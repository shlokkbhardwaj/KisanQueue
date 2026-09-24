"""Voice assistant test: real backend data, login-gating, cancel flow, other-language replies."""
import datetime, json, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5500'
API = 'http://localhost:5000/api'
CTRL = 'http://localhost:5001'
failures = []

def check(name, ok, detail=''):
    print(('PASS  ' if ok else 'FAIL  ') + name + (f'  [{detail}]' if detail and not ok else ''))
    if not ok: failures.append(name)

def call(method, path, body=None, token=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
        headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})})
    try:
        with urllib.request.urlopen(req) as r: return json.load(r)
    except urllib.error.HTTPError as e: return json.load(e)

sfx = str(int(time.time()) % 10000).zfill(4)
reg = call('POST', '/auth/register', {'full_name': 'Voice Farmer', 'mobile': '97001' + sfx + '1', 'password': 'Kisan#2026x'})['data']
tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
booking = call('POST', '/bookings', {'mandiId': 1, 'cropId': 1, 'quantityQuintals': 25, 'bookingDate': tomorrow, 'slotStart': '10:00', 'slotEnd': '10:30'}, reg['token'])['data']
token = call('POST', '/queue/token', {'bookingId': booking['id']}, reg['token'])['data']

def init(lang, auth=None):
    parts = [f"localStorage.setItem('kisanQueueFarmerProfile', JSON.stringify({{language:'{lang}'}}));"]
    if auth:
        s = json.dumps({'token': auth['token'], 'expiresAt': auth['expiresAt'], 'farmer': auth['farmer']})
        parts.append(f"localStorage.setItem('kq_auth', {json.dumps(s)});")
    return 'try{' + ''.join(parts) + '}catch(e){}'

def ask(page, text, wait_for=None):
    before = page.locator('.kq-bubble-assistant').count()
    page.click('#kqMicFab')                     # opens the panel
    page.fill('#kqTextInput', text)
    page.click('#kqTextSend')
    page.wait_for_function(f"document.querySelectorAll('.kq-bubble-assistant').length > {before}", timeout=10000)
    page.wait_for_timeout(150)
    return page.locator('.kq-bubble-assistant').last.inner_text()

with sync_playwright() as p:
    browser = p.chromium.launch()
    errors = []

    # ---- logged out (landing page): public data works, personal data asks for login
    ctx = browser.new_context(); ctx.add_init_script(init('en-IN'))
    page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(f'{BASE}/page01-landing.html'); page.wait_for_selector('#kqMicFab')
    reply = ask(page, 'what is my token')
    check('logged out: token question asks for login', 'log in' in reply.lower(), reply)
    check('logged out: login button offered', page.locator('.kq-chip-btn:has-text("Login")').count() >= 1)
    reply = ask(page, 'I want to sell wheat 25 quintal')
    page.wait_for_selector('.kq-mandi-card', timeout=8000)
    names = page.eval_on_selector_all('.kq-mandi-name', 'els => els.map(e => e.textContent)')
    check('sell wheat: shows the REAL centres that accept wheat (A and B, not C)', sorted(names) == ['Demo Procurement Centre A', 'Demo Procurement Centre B'], str(names))
    check('sell wheat: no demo mandis (Ambala/Yamunanagar)', 'Ambala' not in page.inner_text('#kqTranscript') and 'Yamunanagar' not in page.inner_text('#kqTranscript'))
    reply = ask(page, 'price')
    check('price: honest "not available" instead of a fake number', 'not available' in reply.lower() and '₹' not in reply, reply)
    ask(page, 'sell maize 10 quintal'); page.wait_for_timeout(300)
    check('maize is understood (only centre B accepts it)', page.locator('.kq-mandi-card').count() >= 3)
    reply = ask(page, 'sell mustard 5')
    ctx.close()

    # ---- logged in: token, queue, payment, cancel
    ctx = browser.new_context(); ctx.add_init_script(init('en-IN', reg))
    page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(f'{BASE}/page06-farmer-dashboard.html'); page.wait_for_selector('#kqMicFab')
    reply = ask(page, 'what is my token')
    check('token reply uses the real token number', f"#{token['token_number']}" in reply, reply)
    check('token reply reports tokens ahead (0 here)', '0 tokens ahead' in reply, reply)
    check('token reply does not invent a wait time', 'not available' in reply.lower(), reply)
    reply = ask(page, 'has my payment come')
    check('payment: no record -> says so', 'no payment record' in reply.lower(), reply)
    urllib.request.urlopen(f"{CTRL}/payment?farmer={reg['farmer']['id']}&amount=48750&status=CREDITED")
    reply = ask(page, 'payment')
    check('payment: real amount from the payments table', '48,750' in reply and 'credited' in reply.lower(), reply)
    reply = ask(page, 'purana history')
    check('history: shows real payment records', page.locator('.kq-mandi-card:has-text("48,750")').count() >= 1, reply)

    reply = ask(page, 'cancel my token')
    check('cancel asks for confirmation first', 'cancel your token' in reply.lower(), reply)
    check('nothing cancelled yet', call('GET', f"/bookings/{booking['id']}", token=reg['token'])['data']['status'] == 'BOOKED')
    reply = ask(page, 'no')
    check('answering no keeps the token', 'not cancelled' in reply.lower(), reply)
    check('still booked after "no"', call('GET', f"/bookings/{booking['id']}", token=reg['token'])['data']['status'] == 'BOOKED')
    ask(page, 'cancel my token')
    reply = ask(page, 'yes')
    check('answering yes cancels the real booking', 'cancelled' in reply.lower(), reply)
    check('server: booking now CANCELLED', call('GET', f"/bookings/{booking['id']}", token=reg['token'])['data']['status'] == 'CANCELLED')
    reply = ask(page, 'what is my token')
    check('after cancelling: no active token', 'do not have an active token' in reply.lower(), reply)
    ctx.close()

    # ---- other languages use their own strings (not Hindi fallback)
    for lang in ['mr-IN', 'ta-IN', 'bn-IN', 'gu-IN', 'pa-IN', 'te-IN', 'kn-IN', 'ml-IN']:
        ctx = browser.new_context(); ctx.add_init_script(init(lang))
        page = ctx.new_page(); page.goto(f'{BASE}/page01-landing.html'); page.wait_for_selector('#kqMicFab')
        reply = ask(page, 'token')
        expected = page.evaluate(f"KisanVoice._internal.STRINGS['{lang}'].loginNeeded")
        hindi = page.evaluate("KisanVoice._internal.STRINGS['hi-IN'].loginNeeded")
        check(f'{lang}: replies with its own language pack', reply.strip() == expected.strip(), reply)
        check(f'{lang}: is not the Hindi fallback', expected != hindi)
        ctx.close()
    ctx = browser.new_context(); ctx.add_init_script(init('bho-IN'))
    page = ctx.new_page(); page.goto(f'{BASE}/page01-landing.html'); page.wait_for_selector('#kqTextInput', state='attached')
    page.evaluate("document.getElementById('kqPanel').classList.add('kq-open')")
    page.fill('#kqTextInput', 'token'); page.click('#kqTextSend'); page.wait_for_timeout(800)
    check('bho-IN (text-only) replies in Bhojpuri', 'खातिर पहिले' in page.inner_text('#kqTranscript'), page.inner_text('#kqTranscript')[-120:])
    ctx.close()

    check('no uncaught JS errors', not errors, str(errors))
    browser.close()

print('\nFAILED: ' + ', '.join(failures) if failures else '\nALL VOICE CHECKS PASSED')
sys.exit(1 if failures else 0)

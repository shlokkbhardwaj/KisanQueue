"""
End-to-end browser test (Playwright + headless Chromium):
register -> logout -> wrong password -> login -> crop -> quantity -> centre -> slot -> booking -> token -> page 04.
Run with the fake-DB server on :5000 and a static server on :5500 (see README).
    python3 backend/test/browser/flow_test.py
"""
import json, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5500'   # deliberately 127.0.0.1: the Live Server default that used to be blocked by CORS
MOBILE = '9876500' + str(int(time.time()) % 1000).zfill(3)
PASSWORD = 'Kisan#2026x'
failures = []

def check(name, condition, detail=''):
    print(('PASS  ' if condition else 'FAIL  ') + name + (f'  [{detail}]' if detail and not condition else ''))
    if not condition: failures.append(name)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1200, 'height': 900})
    # The voice assistant asks for a language on first visit; choose one up front so it does not cover the page.
    ctx.add_init_script("try{ if(!localStorage.getItem('kisanQueueFarmerProfile')) localStorage.setItem('kisanQueueFarmerProfile', JSON.stringify({language:'en-IN'})) }catch(e){}")
    page = ctx.new_page()
    console_errors = []
    page.on('pageerror', lambda e: console_errors.append(str(e)))
    api_calls = []
    page.on('request', lambda r: api_calls.append((r.method, r.url)) if ':5000/api' in r.url else None)

    # --- protected pages redirect when logged out (Test 7)
    for protected in ['page03-slot-booking.html', 'page04-booking-token.html']:
        page.goto(f'{BASE}/{protected}')
        page.wait_for_url(re.compile('page02a-farmer-login'))
        check(f'{protected} redirects to login when logged out', 'next=' in page.url)

    # --- crops load on the registration page from 127.0.0.1 (Test 8 / original bug)
    page.goto(f'{BASE}/page02-farmer-registration.html')
    page.wait_for_function("document.querySelectorAll('#crop option').length > 1", timeout=8000)
    opts = page.eval_on_selector_all('#crop option', 'els => els.map(e => e.textContent)')
    check('registration page lists real crops', 'Wheat' in opts and 'Mustard' in opts, str(opts))

    # --- register with a weak password -> blocked client side
    page.fill('#fullName', 'Ramesh Test'); page.fill('#mobile', MOBILE)
    page.fill('#village', 'Kheri'); page.fill('#district', 'Buxar')
    page.select_option('#crop', label='Wheat'); page.fill('#quantity', '20')
    page.wait_for_function("document.querySelectorAll('#centre option').length > 1", timeout=8000)
    page.select_option('#centre', index=1)
    page.fill('#password', 'short'); page.fill('#confirmPassword', 'short')
    page.click('#saveBtn')
    check('weak password rejected', 'at least 8' in page.inner_text('#passwordError'))
    page.fill('#password', PASSWORD); page.fill('#confirmPassword', 'Different#1')
    page.click('#saveBtn')
    check('mismatched confirmation rejected', 'do not match' in page.inner_text('#confirmPasswordError'))
    page.fill('#confirmPassword', PASSWORD)
    # show/hide toggle
    page.click('#togglePassword')
    check('show password toggle works', page.get_attribute('#password', 'type') == 'text')
    page.click('#togglePassword')
    page.click('#saveBtn')
    page.wait_for_selector('#viewCard', state='visible', timeout=8000)
    auth = page.evaluate("JSON.parse(localStorage.getItem('kq_auth'))")
    check('registration stores session token, not password', bool(auth['token']) and PASSWORD not in json.dumps(auth) and 'password' not in json.dumps(auth).lower())
    check('password field cleared after submit', page.input_value('#password') == '')

    # --- logout, wrong password, correct password
    page.goto(f'{BASE}/page03-slot-booking.html')
    page.wait_for_selector('.kq-logout-btn')
    page.click('.kq-logout-btn')
    page.wait_for_url(re.compile('page02a-farmer-login'))
    check('logout clears session', page.evaluate("localStorage.getItem('kq_auth')") is None)
    page.goto(f'{BASE}/page03-slot-booking.html')
    page.wait_for_url(re.compile('page02a-farmer-login'))
    check('after logout page03 is protected again', True)

    page.fill('#mobile', MOBILE); page.fill('#password', 'Wrong#Pass1'); page.click('#loginBtn')
    page.wait_for_selector('#loginAlert.show')
    check('wrong password shows error', 'Wrong mobile number or password' in page.inner_text('#loginAlert'))
    check('still on login page', 'page02a-farmer-login' in page.url)
    page.fill('#password', PASSWORD); page.click('#loginBtn')
    page.wait_for_url(re.compile('page03-slot-booking'), timeout=8000)
    check('correct password logs in and returns to requested page', True)

    # --- booking flow (Tests 4, 5)
    page.wait_for_function("document.querySelectorAll('#crop option').length > 1", timeout=8000)
    page.select_option('#crop', label='Wheat'); page.fill('#quantity', '25')
    page.click('#nextBtn')
    page.wait_for_selector('.centre-card', timeout=8000)
    names = page.eval_on_selector_all('.centre-name', 'els => els.map(e => e.textContent)')
    check('only centres accepting Wheat are listed (A and B, not C)', sorted(names) == ['Demo Procurement Centre A', 'Demo Procurement Centre B'], str(names))
    page.click('.centre-card >> nth=0')
    page.click('#nextBtn')
    page.click('.date-chip >> nth=1')
    page.wait_for_selector('.slot-card', timeout=8000)
    slot_texts = page.eval_on_selector_all('.slot-card .slot-time', 'els => els.map(e => e.textContent)')
    check('slots come from the API (30-minute slots)', len(slot_texts) >= 10, str(slot_texts[:3]))
    page.click('.slot-card:not(.disabled) >> nth=3')
    page.click('#nextBtn')
    check('review shows chosen crop', page.inner_text('#reviewCrop') == 'Wheat')
    bookings_before = len([c for c in api_calls if c[0] == 'POST' and c[1].endswith('/bookings')])
    page.click('#nextBtn')
    page.click('#modalConfirm')
    page.click('#modalConfirm', force=True, timeout=500) if False else None
    page.wait_for_selector('#successView.show', timeout=10000)
    token_text = page.inner_text('#successToken')
    check('success view shows a real token (not A252)', re.fullmatch(r'#\d+', token_text) is not None, token_text)
    posts = [c for c in api_calls if c[0] == 'POST' and c[1].endswith('/bookings')]
    tokens = [c for c in api_calls if c[0] == 'POST' and c[1].endswith('/queue/token')]
    check('exactly one booking and one token request', len(posts) - bookings_before == 1 and len(tokens) == 1, f'{len(posts)} {len(tokens)}')

    # --- page 04 (Test 6)
    page.click('#viewTokenBtn')
    page.wait_for_url(re.compile(r'page04-booking-token\.html\?bookingId=\d+'))
    page.wait_for_selector('#detailsCard', state='visible', timeout=8000)
    check('page04 token matches page03 token', page.inner_text('#tokenNumber') == token_text, page.inner_text('#tokenNumber'))
    body = page.inner_text('body')
    check('page04 shows centre, crop, quantity', 'Demo Procurement Centre A' in body and 'Wheat' in body and '25 quintals' in body)
    check('page04 has no demo values', 'A245' not in body and 'Ambala' not in body and 'Demo' not in page.inner_text('.demo-toggle') if page.query_selector('.demo-toggle') else 'A245' not in body)
    page.context.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE)
    page.click('#copyBtn')
    copied = page.evaluate('navigator.clipboard.readText()')
    check('copy button copies the real token', copied == token_text, copied)

    # reload page04 without the query string still finds the booking
    page.goto(f'{BASE}/page04-booking-token.html')
    page.wait_for_selector('#detailsCard', state='visible', timeout=8000)
    check('page04 works from stored booking (no query string)', page.inner_text('#tokenNumber') == token_text)

    check('no uncaught JS errors', not console_errors, str(console_errors))
    browser.close()

print('\nFAILED: ' + ', '.join(failures) if failures else '\nALL BROWSER CHECKS PASSED')
sys.exit(1 if failures else 0)

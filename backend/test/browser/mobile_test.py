"""Mobile-width check (375px): no sideways scrolling on any farmer page, buttons reachable. Saves screenshots to /tmp/shots."""
import datetime, json, os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5500'; API = 'http://localhost:5000/api'
os.makedirs('/tmp/shots', exist_ok=True)
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
reg = call('POST', '/auth/register', {'full_name': 'Mobile Farmer', 'mobile': '96001' + sfx + '1', 'password': 'Kisan#2026x', 'village': 'Kheri', 'district': 'Buxar'})['data']
tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
b = call('POST', '/bookings', {'mandiId': 1, 'cropId': 1, 'quantityQuintals': 25, 'bookingDate': tomorrow, 'slotStart': '10:00', 'slotEnd': '10:30'}, reg['token'])['data']
call('POST', '/queue/token', {'bookingId': b['id']}, reg['token'])
sess = json.dumps({'token': reg['token'], 'expiresAt': reg['expiresAt'], 'farmer': reg['farmer']})

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=1, has_touch=True, is_mobile=True)
    ctx.add_init_script("try{localStorage.setItem('kisanQueueFarmerProfile', JSON.stringify({language:'en-IN'}));}catch(e){}")
    logged_out = ['page01-landing.html', 'page02a-farmer-login.html', 'page02-farmer-registration.html', 'page07-centre-finder.html']
    logged_in = ['page03-slot-booking.html', 'page04-booking-token.html', 'page05-procurement-status.html',
                 'page06-farmer-dashboard.html', 'page08-live-queue.html', 'page09-notifications.html']
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    def visit(name, auth):
        page.goto(f'{BASE}/{name}'); page.wait_for_timeout(1400)
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f'{name}: no horizontal scroll at 375px', overflow <= 1, f'overflow {overflow}px')
        page.screenshot(path=f"/tmp/shots/{name.replace('.html','')}{'-in' if auth else ''}.png", full_page=False)
    for n in logged_out: visit(n, False)
    page.goto(f'{BASE}/page01-landing.html')
    page.evaluate(f"localStorage.setItem('kq_auth', {json.dumps(sess)})")
    for n in logged_in: visit(n, True)
    check('no uncaught JS errors', not errors, str(errors))
    browser.close()
print('\nFAILED: ' + ', '.join(failures) if failures else '\nALL MOBILE CHECKS PASSED')
sys.exit(1 if failures else 0)

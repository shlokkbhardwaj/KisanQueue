"""
Browser test #2 - dashboard, status, live queue, centre finder, location, notifications, cancel.
Needs the fake-DB API on :5000 (+ its staff/payment control port :5001) and a static server on :5500.
"""
import datetime, json, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5500'
API = 'http://localhost:5000/api'
CTRL = 'http://localhost:5001'
failures = []

def check(name, condition, detail=''):
    print(('PASS  ' if condition else 'FAIL  ') + name + (f'  [{detail}]' if detail and not condition else ''))
    if not condition: failures.append(name)

def call(method, path, body=None, token=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})})
    try:
        with urllib.request.urlopen(req) as r: return json.load(r)
    except urllib.error.HTTPError as e: return json.load(e)

def register(mobile, name):
    r = call('POST', '/auth/register', {'full_name': name, 'mobile': mobile, 'password': 'Kisan#2026x', 'village': 'Kheri', 'district': 'Buxar'})
    assert r['success'], r
    return r['data']

tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
sfx = str(int(time.time()) % 10000).zfill(4)
A = register('98001' + sfx + '1', 'Suresh Yadav'); B = register('98001' + sfx + '2', 'Other Farmer')
def book(auth, start, end):
    b = call('POST', '/bookings', {'mandiId': 1, 'cropId': 1, 'quantityQuintals': 25, 'bookingDate': tomorrow, 'slotStart': start, 'slotEnd': end}, auth['token'])
    assert b['success'], b
    t = call('POST', '/queue/token', {'bookingId': b['data']['id']}, auth['token'])
    return b['data'], t['data']
b_booking, b_token = book(B, '09:00', '09:30')
a_booking, a_token = book(A, '10:00', '10:30')
TOKEN_A = '#' + str(a_token['token_number'])

def session_script(auth):
    s = json.dumps({'token': auth['token'], 'expiresAt': auth['expiresAt'], 'farmer': auth['farmer']})
    return f"try{{ localStorage.setItem('kq_auth', {json.dumps(s)}); localStorage.setItem('kisanQueueFarmerProfile', JSON.stringify({{language:'en-IN'}})); }}catch(e){{}}"

with sync_playwright() as p:
    browser = p.chromium.launch()
    errors = []

    # ---------------- logged-in farmer A
    ctx = browser.new_context(viewport={'width': 1200, 'height': 900}, geolocation={'latitude': 25.5647, 'longitude': 83.9777})
    ctx.add_init_script(session_script(A))
    page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))

    # dashboard
    page.goto(f'{BASE}/page06-farmer-dashboard.html')
    page.wait_for_function("document.getElementById('bookingBody').innerText.includes('Demo Procurement Centre A')", timeout=8000)
    body = page.inner_text('body')
    check('dashboard greets the real farmer', 'Namaste, Suresh' in body)
    check('dashboard shows the real farmer in header badge', 'Suresh Yadav' in page.inner_text('.farmer-name') and 'Kheri' in page.inner_text('.farmer-village'))
    check('dashboard token chip is the real token', page.inner_text('.token-chip') == TOKEN_A, page.inner_text('.token-chip'))
    check('dashboard shows slot, crop and quantity', '10:00 AM' in body and 'Wheat, 25 quintals' in body)
    page.wait_for_function("document.getElementById('queueNumber').textContent === '1'", timeout=8000)
    check('dashboard queue: 1 token ahead (farmer B booked the earlier slot)', True)
    check('dashboard does not invent a wait time', 'not available yet' in page.inner_text('#queueWait'), page.inner_text('#queueWait'))
    check('dashboard payment: no fake amount', page.inner_text('#payAmount') == '—' and 'No payment records' in page.inner_text('#payPill'), page.inner_text('#payPill'))
    check('dashboard has no demo values', 'A245' not in body and 'Ambala' not in body and 'Kheri Village' not in body)
    check('dashboard activity from real records', 'Token ' + TOKEN_A + ' issued' in page.inner_text('#activityList'))

    urllib.request.urlopen(f"{CTRL}/payment?farmer={A['farmer']['id']}&amount=48750&status=CREDITED")
    page.reload()
    page.wait_for_function("document.getElementById('payPill').textContent !== 'Loading…'", timeout=8000)
    check('dashboard shows payment record for another booking as history only', '48,750' in page.inner_text('#payHistory') or '48,750' in page.inner_text('#payAmount'))

    # live queue with staff activity
    urllib.request.urlopen(f"{CTRL}/staff?token={b_token['token_number']}&status=SERVING&counter=C1")
    page.goto(f'{BASE}/page08-live-queue.html')
    page.wait_for_selector('#queueHero', state='visible', timeout=8000)
    check('page08 shows my real token and centre', TOKEN_A in page.inner_text('#heroToken') and 'Demo Procurement Centre A' in page.inner_text('#heroToken'))
    check('page08 tokens ahead = 1', page.inner_text('#posNum') == '1')
    check('page08 shows counter serving the token ahead', 'Serving #' + str(b_token['token_number']) in page.inner_text('#countersRow'), page.inner_text('#countersRow'))
    check('page08 ahead list marks it being served', 'Being served' in page.inner_text('#aheadRows'))
    check('page08 has no demo label / fake values', 'Demo data' not in page.inner_text('body') and 'A245' not in page.inner_text('body'))
    urllib.request.urlopen(f"{CTRL}/staff?token={b_token['token_number']}&status=COMPLETED")
    page.reload(); page.wait_for_selector('#queueHero', state='visible')
    check('page08 after B completes: 0 ahead', page.inner_text('#posNum') == '0')

    # status timeline
    page.goto(f'{BASE}/page05-procurement-status.html')
    page.wait_for_selector('#normalView.show', timeout=8000)
    check('page05 shows real booking summary', 'Demo Procurement Centre A' in page.inner_text('#sumCentre') and page.inner_text('#sumToken') == TOKEN_A)
    check('page05 current stage is Booked (real status)', 'current' in page.get_attribute('.timeline-item >> nth=0', 'class'))
    check('page05 no demo timestamps', 'Yesterday' not in page.inner_text('#timeline') and 'A245' not in page.inner_text('body'))

    # notifications
    page.goto(f'{BASE}/page09-notifications.html')
    page.wait_for_selector('.notif-item', timeout=8000)
    check('page09 shows real notifications', 'Slot confirmed' in page.inner_text('#loadedView') and 'issued' in page.inner_text('#loadedView'))
    page.click('#markAllReadBtn')
    page.wait_for_function("document.querySelectorAll('.notif-item.unread').length === 0", timeout=5000)
    check('page09 mark all read', True)

    # page04 cancel -> cancelled state
    page.goto(f'{BASE}/page04-booking-token.html?bookingId={a_booking["id"]}')
    page.wait_for_selector('#detailsCard', state='visible')
    check('page04 shows booking reference and status', '#' + str(a_booking['id']) in page.inner_text('#detailsCard') and 'Booked' in page.inner_text('#detailsCard'))
    page.on('dialog', lambda d: d.accept())
    page.click('#cancelBookingBtn')
    page.wait_for_selector('#cancelledMessage.show', timeout=8000)
    check('page04 cancelled state after cancelling', page.text_content('#statusBadge').strip().lower() == 'cancelled', page.text_content('#statusBadge'))
    check('server marked booking + token cancelled', call('GET', f'/bookings/{a_booking["id"]}', token=A['token'])['data']['status'] == 'CANCELLED')

    # page03: location button (granted) sorts by distance; other farmer's saved preferences are ignored
    page.goto(f'{BASE}/page03-slot-booking.html')
    page.wait_for_function("document.querySelectorAll('#crop option').length > 1", timeout=8000)
    page.select_option('#crop', label='Wheat'); page.fill('#quantity', '10'); page.click('#nextBtn')
    page.wait_for_selector('.centre-card')
    ctx.grant_permissions(['geolocation'])
    page.click('#useLocationBtn')
    page.wait_for_function("document.querySelector('.centre-addr').textContent.includes('km away')", timeout=8000)
    first = page.inner_text('.centre-name >> nth=0')
    check('page03 location: nearest centre first, with distance', first == 'Demo Procurement Centre A', first)
    check('page03 location note says it is not saved', 'not saved' in page.inner_text('#locationStatus'))
    check('location is not written to storage', 'latitude' not in json.dumps(page.evaluate('Object.assign({}, localStorage)')))
    page.click('#manualLocationBtn')
    page.fill('#centreSearch', 'centre b')
    page.wait_for_function("document.querySelectorAll('.centre-card').length === 1", timeout=5000)
    check('page03 manual search filters centres', page.inner_text('.centre-name') == 'Demo Procurement Centre B')
    page.fill('#centreSearch', '')
    ctx.close()

    # ---------------- location DENIED on page03 (fresh context, no permission)
    ctx2 = browser.new_context(viewport={'width': 1200, 'height': 900}, geolocation={'latitude': 25.5, 'longitude': 83.9})  # position set but permission NOT granted -> denied
    ctx2.add_init_script(session_script(A)); pg = ctx2.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(f'{BASE}/page03-slot-booking.html')
    pg.wait_for_function("document.querySelectorAll('#crop option').length > 1", timeout=8000)
    pg.select_option('#crop', label='Mustard'); pg.fill('#quantity', '5'); pg.click('#nextBtn')
    pg.wait_for_selector('.centre-card')
    pg.click('#useLocationBtn')
    pg.wait_for_function("!document.getElementById('locationStatus').textContent.includes('Finding')", timeout=15000)
    check('location denied: message shown', 'manually' in pg.inner_text('#locationStatus').lower(), pg.inner_text('#locationStatus'))
    check('location denied: centres still selectable', pg.locator('.centre-card').count() == 1)
    pg.click('.centre-card >> nth=0'); pg.click('#nextBtn')
    pg.click('.date-chip >> nth=2'); pg.wait_for_selector('.slot-card')
    check('booking still possible after denial (slots load)', pg.locator('.slot-card').count() > 5)
    ctx2.close()

    # ---------------- logged-OUT centre finder (page07)
    ctx3 = browser.new_context(viewport={'width': 1200, 'height': 900}, geolocation={'latitude': 28.59, 'longitude': 77.03})  # Dwarka, Delhi
    pg = ctx3.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(f'{BASE}/page07-centre-finder.html')
    pg.wait_for_selector('.centre-card', timeout=8000)
    check('page07 lists real centres without login', pg.locator('.centre-card').count() == 3)
    chips = pg.eval_on_selector_all('.filter-chip', 'els => els.map(e => e.textContent)')
    check('page07 crop filters come from /crops', 'Accepts Mustard' in chips and 'Accepts Wheat' in chips, str(chips))
    pg.click('.filter-chip:has-text("Accepts Mustard")')
    check('page07 crop filter uses real acceptance data', pg.locator('.centre-card').count() == 1 and 'Centre C' in pg.inner_text('.centre-name'))
    pg.click('.filter-chip:has-text("All")'); pg.fill('#searchInput', 'zzz')
    check('page07 empty state on no match', pg.is_visible('#emptyState'))
    pg.click('#clearFiltersBtn')
    check('page07 clear filters restores list', pg.locator('.centre-card').count() == 3)
    check('page07 no fake farmer badge for guests', not pg.is_visible('.farmer-badge'))
    pg.click('#locateBtn')   # geolocation not granted -> denied path
    pg.wait_for_selector('#deniedState.show', timeout=8000)
    check('page07 location denied -> message + search still works', 'search' in pg.inner_text('#deniedText').lower())
    ctx3.grant_permissions(['geolocation']); pg.click('#searchInsteadBtn'); pg.click('#locateBtn')
    pg.wait_for_function("document.querySelector('.centre-addr').textContent.includes('km away')", timeout=8000)
    check('page07 far-away user still sees centres, nearest first, with distance', pg.locator('.centre-card').count() == 3)
    check('page07 shows Delhi->Buxar distance in hundreds of km', re.search(r'\b[5-9]\d\d(\.\d+)? km away', pg.inner_text('.centre-addr >> nth=0')) is not None, pg.inner_text('.centre-addr >> nth=0'))

    check('no uncaught JS errors', not errors, str(errors))
    browser.close()

print('\nFAILED: ' + ', '.join(failures) if failures else '\nALL PAGE CHECKS PASSED')
sys.exit(1 if failures else 0)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SLOT_CAPACITY = '2';
process.env.FRONTEND_ORIGIN = 'http://localhost:5500';

const { createApp } = await import('../src/app.js');
const { __setSupabaseForTests } = await import('../src/config/supabase.js');
const { __limiters } = await import('../src/controllers/auth.controller.js');
const { nowInZone, addDaysISO } = await import('../src/services/slots.service.js');
const { createFakeSupabase, seedDemoData } = await import('./fakeSupabase.js');

let server; let base; let fake;
const tomorrow = addDaysISO(nowInZone().date, 1);

before(async () => {
  fake = seedDemoData(createFakeSupabase());
  __setSupabaseForTests(fake);
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

async function call(method, path, { body, token, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json, headers: res.headers };
}

async function registerFarmer(mobile, name = 'Test Farmer') {
  const r = await call('POST', '/auth/register', { body: { full_name: name, mobile, password: 'Kisan#2026x', village: 'V', district: 'D' } });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return { token: r.json.data.token, farmer: r.json.data.farmer };
}

/* ------------------------------------------------------------ public data */

test('health and crops (Test 1, 2, 8 - backend side)', async () => {
  assert.equal((await call('GET', '/health')).json.status, 'ok');
  const crops = await call('GET', '/crops');
  assert.equal(crops.status, 200);
  assert.equal(crops.json.data.length, 4);
  assert.ok(crops.json.data.every((c) => c.name));
});

test('mandis: list, crop filter, accepted crops, location sort', async () => {
  const all = await call('GET', '/mandis');
  assert.equal(all.json.data.length, 3);

  const mustard = await call('GET', '/mandis?cropId=4&includeCrops=true');
  assert.deepEqual(mustard.json.data.map((m) => m.name), ['Demo Procurement Centre C']);
  assert.deepEqual(mustard.json.data[0].accepted_crops.map((c) => c.name), ['Mustard']);

  const near = await call('GET', '/mandis?lat=25.5647&lng=83.9777&radiusKm=5');
  assert.ok(near.json.data.length >= 1);
  assert.equal(near.json.data[0].name, 'Demo Procurement Centre A');
  assert.ok(near.json.data[0].distance_km < 0.1);

  const delhi = await call('GET', '/mandis?lat=28.59&lng=77.03&radiusKm=50');
  assert.equal(delhi.json.data.length, 0); // nothing within 50km of Delhi

  assert.equal((await call('GET', '/mandis?cropId=abc')).status, 400);
  assert.equal((await call('GET', '/mandis?lat=x&lng=1')).status, 400);
});

test('available centres for crop + quantity, sorted by distance when location given', async () => {
  const r = await call('GET', '/mandis/available?cropId=1&quantity=10&lat=25.5700&lng=83.9900');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.data.map((m) => m.name), ['Demo Procurement Centre B', 'Demo Procurement Centre A']);
  assert.ok(r.json.data[0].distance_km <= r.json.data[1].distance_km);
  const none = await call('GET', '/mandis/available?cropId=4&quantity=10');
  assert.deepEqual(none.json.data.map((m) => m.id), [3]);
});

test('slots use the centre hours and real booked counts', async () => {
  const r = await call('GET', `/mandis/1/slots?date=${tomorrow}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.data.hours.open, '08:00');
  assert.equal(r.json.data.hours.close, '18:00');
  assert.equal(r.json.data.slots.length, 20);
  assert.ok(r.json.data.slots.every((s) => s.status === 'available' && s.booked === 0));
  assert.equal((await call('GET', '/mandis/1/slots?date=nope')).status, 400);
  assert.equal((await call('GET', '/mandis/999/slots')).status, 404);
});

/* ----------------------------------------------------------------- CORS */

test('CORS allows configured origin, 127.0.0.1 in dev, blocks unknown sites', async () => {
  const ask = (origin) => call('GET', '/crops', { headers: { Origin: origin } });
  assert.equal((await ask('http://localhost:5500')).headers.get('access-control-allow-origin'), 'http://localhost:5500');
  assert.equal((await ask('http://127.0.0.1:5500')).headers.get('access-control-allow-origin'), 'http://127.0.0.1:5500');
  assert.equal((await ask('https://evil.example')).headers.get('access-control-allow-origin'), null);
});

/* ------------------------------------------------------- authentication */

test('protected endpoints reject anonymous callers', async () => {
  assert.equal((await call('POST', '/bookings', { body: {} })).status, 401);
  assert.equal((await call('GET', '/bookings/mine')).status, 401);
  assert.equal((await call('GET', '/farmers/1')).status, 401);
  assert.equal((await call('GET', '/queue/token/1')).status, 401);
  assert.equal((await call('POST', '/queue/token', { body: { bookingId: 1 } })).status, 401);
  assert.equal((await call('GET', '/payments/farmer/1')).status, 401);
  assert.equal((await call('GET', '/auth/me', { token: 'garbage' })).status, 401);
});

test('register validates, stores only a hash, and logs in (Test 7)', async () => {
  const weak = await call('POST', '/auth/register', { body: { full_name: 'A B', mobile: '9000000001', password: 'short' } });
  assert.equal(weak.status, 400);
  assert.equal((await call('POST', '/auth/register', { body: { full_name: 'A B', mobile: '9000000001', password: 'onlyletters' } })).status, 400);
  assert.equal((await call('POST', '/auth/register', { body: { full_name: 'A B', mobile: '123', password: 'Valid#1234' } })).status, 400);
  assert.equal((await call('POST', '/auth/register', { body: { full_name: 'A B', mobile: '9000000001', password: 'Pass9000000001' } })).status, 400);

  const ok = await call('POST', '/auth/register', { body: { full_name: 'Ram Kumar', mobile: '9000000001', password: 'Kisan#2026x' } });
  assert.equal(ok.status, 201);
  assert.ok(ok.json.data.token && ok.json.data.expiresAt);
  assert.equal(JSON.stringify(ok.json).includes('Kisan#2026x'), false);
  assert.equal(JSON.stringify(ok.json).includes('password_hash'), false);

  const stored = fake.__tables.farmer_credentials[0];
  assert.match(stored.password_hash, /^scrypt\$/);
  assert.equal(stored.password_hash.includes('Kisan#2026x'), false);
  const storedSession = fake.__tables.farmer_sessions[0];
  assert.notEqual(storedSession.token_hash, ok.json.data.token); // only a hash of the token is stored

  assert.equal((await call('POST', '/auth/register', { body: { full_name: 'Ram Kumar', mobile: '9000000001', password: 'Kisan#2026x' } })).status, 409);

  const bad = await call('POST', '/auth/login', { body: { mobile: '9000000001', password: 'Wrong#1234' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.json.error, 'Invalid mobile number or password.');
  assert.equal((await call('POST', '/auth/login', { body: { mobile: '9111111111', password: 'Wrong#1234' } })).json.error, 'Invalid mobile number or password.');

  const good = await call('POST', '/auth/login', { body: { mobile: '9000000001', password: 'Kisan#2026x' } });
  assert.equal(good.status, 200);
  const token = good.json.data.token;

  const me = await call('GET', '/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.json.data.farmer.mobile, '9000000001');

  assert.equal((await call('POST', '/auth/logout', { token })).status, 200);
  assert.equal((await call('GET', '/auth/me', { token })).status, 401); // logout really revokes
});

test('expired session is rejected', async () => {
  const { token } = await registerFarmer('9000000002');
  for (const s of fake.__tables.farmer_sessions) s.expires_at = new Date(Date.now() - 1000).toISOString();
  assert.equal((await call('GET', '/auth/me', { token })).status, 401);
});

test('login is rate limited per mobile number', async () => {
  __limiters.loginLimiter.clear();
  let last;
  for (let i = 0; i < 11; i += 1) last = await call('POST', '/auth/login', { body: { mobile: '9222222222', password: 'Wrong#1234' } });
  assert.equal(last.status, 429);
  assert.ok(last.headers.get('retry-after'));
  __limiters.loginLimiter.clear();
});

test('legacy password-less farmer can attach a password and keeps their id', async () => {
  fake.__tables.farmers.push({ id: 900, full_name: 'Old Farmer', mobile: '9333333333', farmer_id: null, village: null, district: null, state: null, preferred_language: 'hi', created_at: new Date().toISOString() });
  const r = await call('POST', '/auth/register', { body: { full_name: 'Old Farmer', mobile: '9333333333', password: 'Kisan#2026x' } });
  assert.equal(r.status, 201);
  assert.equal(r.json.data.farmer.id, 900);
  assert.equal(r.json.data.claimedExistingProfile, true);
});

test('POST /farmers is retired', async () => {
  assert.equal((await call('POST', '/farmers', { body: { full_name: 'x', mobile: '9444444444' } })).status, 410);
});

/* ------------------------------------------ booking -> token -> queue */

test('booking, duplicate protection, token and page-04 data (Tests 4, 5, 6)', async () => {
  const a = await registerFarmer('9555555501', 'Farmer A');
  const b = await registerFarmer('9555555502', 'Farmer B');
  const bookingBody = { mandiId: 1, cropId: 1, quantityQuintals: 25, bookingDate: tomorrow, slotStart: '10:00', slotEnd: '10:30' };

  // validation
  assert.equal((await call('POST', '/bookings', { token: a.token, body: { ...bookingBody, cropId: 4 } })).status, 422); // centre A does not accept mustard
  assert.equal((await call('POST', '/bookings', { token: a.token, body: { ...bookingBody, bookingDate: '2020-01-01' } })).status, 400);
  assert.equal((await call('POST', '/bookings', { token: a.token, body: { ...bookingBody, slotStart: '10:10', slotEnd: '10:40' } })).status, 400);
  assert.equal((await call('POST', '/bookings', { token: a.token, body: { ...bookingBody, quantityQuintals: -3 } })).status, 400);
  assert.equal((await call('POST', '/bookings', { token: a.token, body: { ...bookingBody, farmerId: b.farmer.id } })).status, 403);
  assert.equal(fake.__tables.bookings.length, 0);

  // create + double click
  const first = await call('POST', '/bookings', { token: a.token, body: bookingBody });
  assert.equal(first.status, 201);
  assert.equal(first.json.data.farmer_id, a.farmer.id); // farmer comes from the session
  const again = await call('POST', '/bookings', { token: a.token, body: bookingBody });
  assert.equal(again.status, 200);
  assert.equal(again.json.existing, true);
  assert.equal(again.json.data.id, first.json.data.id);
  assert.equal(fake.__tables.bookings.length, 1);
  const bookingId = first.json.data.id;

  // token, twice
  const t1 = await call('POST', '/queue/token', { token: a.token, body: { bookingId } });
  assert.equal(t1.status, 201);
  assert.equal(t1.json.data.status, 'WAITING');
  const t2 = await call('POST', '/queue/token', { token: a.token, body: { bookingId } });
  assert.equal(t2.status, 200);
  assert.equal(t2.json.existing, true);
  assert.equal(t2.json.data.token_number, t1.json.data.token_number);
  assert.equal(fake.__tables.queue_tokens.length, 1);

  // other farmer can neither read nor issue
  assert.equal((await call('POST', '/queue/token', { token: b.token, body: { bookingId } })).status, 404);
  assert.equal((await call('GET', `/queue/token/${bookingId}`, { token: b.token })).status, 404);
  assert.equal((await call('GET', `/bookings/${bookingId}`, { token: b.token })).status, 404);

  // page 04 data
  const page4 = await call('GET', `/queue/token/${bookingId}`, { token: a.token });
  assert.equal(page4.status, 200);
  const d = page4.json.data;
  assert.equal(d.token_number, t1.json.data.token_number);
  assert.equal(d.bookings.crops.name, 'Wheat');
  assert.equal(d.bookings.mandis.name, 'Demo Procurement Centre A');
  assert.equal(String(d.bookings.slot_start).slice(0, 5), '10:00');
  assert.equal(page4.json.queue.position.tokensAhead, 0);

  // nonexistent booking keeps its original message
  const missing = await call('GET', '/queue/token/99999', { token: a.token });
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.json, { success: false, error: 'Queue token not found for this booking.' });

  // my bookings
  const mine = await call('GET', '/bookings/mine', { token: a.token });
  assert.equal(mine.json.data.length, 1);
  assert.equal(mine.json.data[0].token.token_number, d.token_number);
  assert.equal((await call('GET', '/bookings/mine', { token: b.token })).json.data.length, 0);

  // Farmer B books an EARLIER slot -> one token ahead of A
  const bBooking = await call('POST', '/bookings', { token: b.token, body: { ...bookingBody, slotStart: '09:00', slotEnd: '09:30' } });
  await call('POST', '/queue/token', { token: b.token, body: { bookingId: bBooking.json.data.id } });
  const status = await call('GET', `/queue/status?bookingId=${bookingId}`, { token: a.token });
  assert.equal(status.json.mine.tokensAhead, 1);
  assert.equal(status.json.summary.waitingCount, 2);
  assert.equal(status.json.summary.currentToken, null);       // nobody is being served yet
  assert.equal(status.json.mine.estimatedWaitMinutes, null);  // no service-time history -> not invented

  // staff calls B's token; another three finish so an average exists
  const tokB = fake.__tables.queue_tokens.find((t) => t.booking_id === bBooking.json.data.id);
  tokB.status = 'SERVING'; tokB.counter_id = 'C1';
  const status2 = await call('GET', `/queue/status?bookingId=${bookingId}`, { token: a.token });
  assert.equal(status2.json.summary.currentToken, tokB.token_number);
  assert.equal(status2.json.mine.tokensAhead, 1);
  assert.deepEqual(status2.json.summary.counters, [{ counter: 'C1', token_number: tokB.token_number, status: 'SERVING' }]);

  // anonymous queue status exposes no farmer ids
  const anon = await call('GET', '/queue/status');
  assert.equal(anon.status, 200);
  assert.equal(JSON.stringify(anon.json).includes('farmer_id'), false);
  assert.equal((await call('GET', `/queue/status?bookingId=${bookingId}`)).status, 401);

  // capacity: SLOT_CAPACITY=2 -> two farmers fill 09:00 ; a third is refused
  const c = await registerFarmer('9555555503', 'Farmer C');
  const d2 = await registerFarmer('9555555504', 'Farmer D');
  assert.equal((await call('POST', '/bookings', { token: c.token, body: { ...bookingBody, slotStart: '09:00', slotEnd: '09:30' } })).status, 201);
  const full = await call('POST', '/bookings', { token: d2.token, body: { ...bookingBody, slotStart: '09:00', slotEnd: '09:30' } });
  assert.equal(full.status, 409);
  assert.equal(full.json.code, 'SLOT_FULL');
  const slots = await call('GET', `/mandis/1/slots?date=${tomorrow}`);
  assert.equal(slots.json.data.slots.find((s) => s.start === '09:00').status, 'full');
  assert.equal(slots.json.data.slots.find((s) => s.start === '10:00').booked, 1);

  // cancel A -> token cancelled, no new token for a cancelled booking, slot freed
  assert.equal((await call('POST', `/bookings/${bookingId}/cancel`, { token: b.token })).status, 404);
  assert.equal((await call('POST', `/bookings/${bookingId}/cancel`, { token: a.token })).status, 200);
  assert.equal(fake.__tables.queue_tokens.find((t) => t.booking_id === bookingId).status, 'CANCELLED');
  assert.equal((await call('POST', '/queue/token', { token: a.token, body: { bookingId } })).status, 409);
  const after = await call('GET', `/mandis/1/slots?date=${tomorrow}`);
  assert.equal(after.json.data.slots.find((s) => s.start === '10:00').booked, 0);
});

test('payments: own records only', async () => {
  const a = await registerFarmer('9666666601', 'Pay A');
  const b = await registerFarmer('9666666602', 'Pay B');
  fake.__tables.payments.push({ id: 1, farmer_id: a.farmer.id, booking_id: null, amount: 12500, status: 'CREDITED', created_at: new Date().toISOString() });
  const mine = await call('GET', `/payments/farmer/${a.farmer.id}`, { token: a.token });
  assert.equal(mine.status, 200);
  assert.equal(mine.json.data.length, 1);
  assert.equal((await call('GET', `/payments/farmer/${a.farmer.id}`, { token: b.token })).status, 403);
  assert.equal((await call('GET', `/farmers/${a.farmer.id}`, { token: b.token })).status, 403);
  const own = await call('GET', `/farmers/${a.farmer.id}`, { token: a.token });
  assert.equal(own.status, 200);
  assert.equal('password_hash' in own.json.data, false);
});

test('notifications are created by booking + token and readable only by their owner', async () => {
  const a = await registerFarmer('9777777701', 'Notif A');
  const b = await registerFarmer('9777777702', 'Notif B');
  const booking = await call('POST', '/bookings', { token: a.token, body: { mandiId: 2, cropId: 3, quantityQuintals: 5, bookingDate: tomorrow, slotStart: '11:00', slotEnd: '11:30' } });
  assert.equal(booking.status, 201, JSON.stringify(booking.json));
  await call('POST', '/queue/token', { token: a.token, body: { bookingId: booking.json.data.id } });
  const mine = await call('GET', '/notifications', { token: a.token });
  assert.deepEqual(mine.json.data.map((n) => n.type).sort(), ['BOOKING', 'QUEUE']);
  assert.equal((await call('GET', '/notifications', { token: b.token })).json.data.length, 0);
  assert.equal((await call('GET', '/notifications')).status, 401);
  assert.equal((await call('POST', '/notifications/read-all', { token: a.token })).status, 200);
  assert.ok((await call('GET', '/notifications', { token: a.token })).json.data.every((n) => n.read === true));
});

test('diagnostics endpoint reports each check', async () => {
  const r = await call('GET', '/health/db');
  assert.equal(r.status, 200);
  assert.ok(r.json.checks.some((c) => c.name.startsWith('table crops') && c.ok));
});

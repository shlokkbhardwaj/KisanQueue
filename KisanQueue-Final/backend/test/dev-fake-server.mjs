/*
 * Starts the real Express app on http://localhost:5000 backed by the in-memory fake database
 * (seeded like supabase/seed.sql). Used only for browser tests - it never touches Supabase.
 *
 *   node test/dev-fake-server.mjs
 */
process.env.NODE_ENV = 'development';
process.env.SLOT_CAPACITY = process.env.SLOT_CAPACITY || '3';

const { createApp } = await import('../src/app.js');
const { __setSupabaseForTests } = await import('../src/config/supabase.js');
const { createFakeSupabase, seedDemoData } = await import('./fakeSupabase.js');

const fake = seedDemoData(createFakeSupabase());
__setSupabaseForTests(fake);
globalThis.__fakeDb = fake;

const port = Number(process.env.PORT || 5000);
createApp().listen(port, () => console.log(`FAKE-DB API on http://localhost:${port}`));

// Test-only control endpoint so a browser test can act as "staff" (call / serve tokens).
import http from 'node:http';
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/staff') {
    const t = fake.__tables.queue_tokens.find((row) => String(row.token_number) === url.searchParams.get('token'));
    if (t) { t.status = url.searchParams.get('status'); t.counter_id = url.searchParams.get('counter') || null;
      if (t.status === 'SERVING' || t.status === 'CALLED') t.called_at = new Date(Date.now() - 12 * 60000).toISOString();
      if (t.status === 'COMPLETED') { t.called_at = new Date(Date.now() - 9 * 60000).toISOString(); t.completed_at = new Date().toISOString(); } }
    res.end(JSON.stringify({ ok: Boolean(t) }));
  } else if (url.pathname === '/payment') {
    fake.__tables.payments.push({ id: fake.__tables.payments.length + 1, farmer_id: Number(url.searchParams.get('farmer')), booking_id: null,
      amount: Number(url.searchParams.get('amount')), status: url.searchParams.get('status') || 'CREDITED', created_at: new Date().toISOString() });
    res.end('{"ok":true}');
  } else res.end('{}');
}).listen(5001);

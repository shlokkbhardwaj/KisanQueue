/*
 * A small in-memory stand-in for the parts of supabase-js the backend uses
 * (from().select/insert/update/delete + eq/neq/in/lt/order/limit/single/maybeSingle + embedded
 * relations). It exists ONLY so the API can be tested without a network or a real project.
 * It is not part of the running application.
 */

const singular = (name) => name.replace(/s$/, '');
const ONE_TO_ONE = new Set(['queue_tokens', 'farmer_credentials']);
const TIME_COLUMNS = new Set(['slot_start', 'slot_end']);
const NULLABLE = {
  queue_tokens: ['counter_id', 'called_at', 'completed_at'],
  farmers: ['farmer_id', 'village', 'district', 'state'],
  farmer_sessions: ['user_agent'],
  farmer_credentials: ['last_login_at'],
  payments: ['booking_id', 'transaction_reference', 'payment_date']
};

const DEFAULT_TABLES = [
  'farmers', 'crops', 'mandis', 'mandi_crop_acceptance', 'prices', 'bookings',
  'queue_tokens', 'payments', 'notifications', 'farmer_credentials', 'farmer_sessions'
];

const col = (...names) => (row) => {
  const values = names.map((n) => row[n]);
  return values.some((v) => v === null || v === undefined) ? null : values.join('|');
};

const UNIQUES = {
  farmers: [col('mobile'), col('farmer_id')],
  queue_tokens: [col('booking_id'), col('token_number')],
  mandi_crop_acceptance: [col('mandi_id', 'crop_id')],
  farmer_credentials: [col('farmer_id')],
  farmer_sessions: [col('token_hash')],
  bookings: [(r) => (r.status === 'CANCELLED' ? null : col('farmer_id', 'mandi_id', 'crop_id', 'booking_date', 'slot_start')(r))]
};

function splitTopLevel(text) {
  const parts = []; let depth = 0; let current = '';
  for (const ch of text) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; } else current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSelect(text) {
  return splitTopLevel(text || '*').map((part) => {
    const m = /^([a-z_]+)(?:![a-z_]+)?\((.*)\)$/is.exec(part);
    if (m) return { type: 'embed', name: m[1], inner: m[2] };
    return { type: part === '*' ? 'star' : 'col', name: part };
  });
}

export function createFakeSupabase({ missingTables = [] } = {}) {
  const tables = Object.fromEntries(DEFAULT_TABLES.filter((t) => !missingTables.includes(t)).map((t) => [t, []]));
  const sequences = {};
  const nextId = (t) => { sequences[t] = (sequences[t] || 0) + 1; return sequences[t]; };

  function applyDefaults(table, row) {
    const out = { ...row };
    if (table !== 'farmer_credentials' && out.id === undefined) out.id = nextId(table);
    if (out.created_at === undefined) out.created_at = new Date().toISOString();
    if (table === 'farmers' && out.preferred_language === undefined) out.preferred_language = 'hi';
    if (table === 'crops' && out.active === undefined) out.active = true;
    if (table === 'mandis' && out.status === undefined) out.status = 'ACTIVE';
    if (table === 'bookings' && out.status === undefined) out.status = 'BOOKED';
    if (table === 'queue_tokens' && out.status === undefined) out.status = 'WAITING';
    if (table === 'payments' && out.status === undefined) out.status = 'PENDING';
    if (table === 'notifications') { if (out.read === undefined) out.read = false; if (out.type === undefined) out.type = 'INFO'; }
    for (const c of TIME_COLUMNS) if (typeof out[c] === 'string' && out[c].length === 5) out[c] += ':00';
    for (const key of NULLABLE[table] || []) if (out[key] === undefined) out[key] = null;
    return out;
  }

  function violatesUnique(table, row, ignoreRow) {
    for (const keyOf of UNIQUES[table] || []) {
      const key = keyOf(row);
      if (key === null) continue;
      if (tables[table].some((r) => r !== ignoreRow && keyOf(r) === key)) return true;
    }
    return false;
  }

  function project(table, row, selectText) {
    const items = parseSelect(selectText);
    const out = {};
    for (const item of items) {
      if (item.type === 'star') Object.assign(out, row);
      else if (item.type === 'col') out[item.name] = row[item.name];
      else if (item.type === 'embed') out[item.name] = embed(table, row, item);
    }
    return out;
  }

  function embed(table, row, item) {
    const target = tables[item.name];
    if (!target) return null;
    const fk = `${singular(item.name)}_id`;
    if (fk in row) {
      const found = target.find((r) => String(r.id) === String(row[fk]));
      return found ? project(item.name, found, item.inner) : null;
    }
    const reverseKey = `${singular(table)}_id`;
    const rows = target.filter((r) => String(r[reverseKey]) === String(row.id)).map((r) => project(item.name, r, item.inner));
    return ONE_TO_ONE.has(item.name) ? (rows[0] || null) : rows;
  }

  class Query {
    constructor(table) {
      this.table = table; this.op = 'select'; this.filters = []; this.orders = [];
      this.limitN = null; this.mode = 'many'; this.selectText = '*'; this.countExact = false;
      this.returning = false; this.payload = null;
    }
    select(text = '*', opts = {}) {
      if (this.op === 'select') { this.selectText = text; this.countExact = opts.count === 'exact'; } else { this.returning = true; this.selectText = text; }
      return this;
    }
    insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    update(values) { this.op = 'update'; this.payload = values; return this; }
    delete() { this.op = 'delete'; return this; }
    eq(c, v) { this.filters.push((r) => String(r[c]) === String(v)); return this; }
    neq(c, v) { this.filters.push((r) => String(r[c]) !== String(v)); return this; }
    in(c, values) { const set = new Set(values.map(String)); this.filters.push((r) => set.has(String(r[c]))); return this; }
    lt(c, v) { this.filters.push((r) => r[c] !== null && r[c] < v); return this; }
    order(c, { ascending = true } = {}) { this.orders.push({ c, ascending }); return this; }
    limit(n) { this.limitN = n; return this; }
    single() { this.mode = 'single'; return this; }
    maybeSingle() { this.mode = 'maybe'; return this; }
    then(resolve, reject) { return Promise.resolve(this.run()).then(resolve, reject); }

    run() {
      if (!tables[this.table]) {
        return { data: null, error: { code: '42P01', message: `relation "public.${this.table}" does not exist` } };
      }
      const rows = tables[this.table];
      const matches = () => rows.filter((r) => this.filters.every((f) => f(r)));
      let result;
      let count = null;

      if (this.op === 'insert') {
        const inserted = [];
        for (const payload of this.payload) {
          const row = applyDefaults(this.table, payload);
          if (violatesUnique(this.table, row)) {
            return { data: null, error: { code: '23505', message: `duplicate key value violates unique constraint on ${this.table}` } };
          }
          rows.push(row); inserted.push(row);
        }
        result = inserted;
      } else if (this.op === 'update') {
        result = matches();
        for (const row of result) {
          const next = applyDefaults(this.table, { ...row, ...this.payload });
          if (violatesUnique(this.table, next, row)) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
          }
          Object.assign(row, next);
        }
      } else if (this.op === 'delete') {
        const doomed = new Set(matches());
        tables[this.table] = rows.filter((r) => !doomed.has(r));
        rows.length = 0; rows.push(...tables[this.table]);
        result = [...doomed];
      } else {
        result = matches();
        count = result.length;
        for (const { c, ascending } of [...this.orders].reverse()) {
          result = [...result].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (ascending ? 1 : -1));
        }
        if (this.limitN !== null) result = result.slice(0, this.limitN);
      }

      const shape = this.op === 'select' || this.returning;
      const projected = shape ? result.map((r) => project(this.table, r, this.selectText)) : null;

      if (this.mode === 'single') {
        if (!projected || projected.length !== 1) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
        return { data: projected[0], error: null };
      }
      if (this.mode === 'maybe') {
        if (projected && projected.length > 1) return { data: null, error: { code: 'PGRST116', message: 'multiple rows returned' } };
        return { data: projected ? (projected[0] || null) : null, error: null };
      }
      return { data: projected, error: null, count };
    }
  }

  return {
    from: (table) => new Query(table),
    __tables: tables
  };
}

/** Same demo rows as backend/supabase/seed.sql. */
export function seedDemoData(fake) {
  const t = fake.__tables;
  const crop = (name, hi, category) => t.crops.push({ id: t.crops.length + 1, name, local_names: { hi }, category, unit: 'quintal', active: true });
  crop('Wheat', 'गेहूँ', 'Cereal'); crop('Rice', 'धान', 'Cereal'); crop('Maize', 'मक्का', 'Cereal'); crop('Mustard', 'सरसों', 'Oilseed');
  const mandi = (name, lat, lng, hours) => t.mandis.push({
    id: t.mandis.length + 1, name, address: `${name}, Demo District`, state: 'Bihar', district: 'Buxar',
    latitude: lat, longitude: lng, contact: '0000000000', operating_hours: hours, status: 'ACTIVE'
  });
  mandi('Demo Procurement Centre A', 25.5647, 83.9777, '08:00-18:00');
  mandi('Demo Procurement Centre B', 25.57, 83.99, '08:00-17:00');
  mandi('Demo Procurement Centre C', 25.55, 83.965, '09:00-18:00');
  const accept = (mandiId, cropId) => t.mandi_crop_acceptance.push({ id: t.mandi_crop_acceptance.length + 1, mandi_id: mandiId, crop_id: cropId, accepted: true });
  accept(1, 1); accept(1, 2); accept(2, 1); accept(2, 3); accept(3, 4);
  return fake;
}

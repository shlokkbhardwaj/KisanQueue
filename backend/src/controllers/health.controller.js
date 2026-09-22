import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

export function health(req, res) {
  res.json({ success: true, service: 'Kisan Queue Farmer Queue API', status: 'ok', timestamp: new Date().toISOString() });
}

/*
 * GET /api/health/db  - developer diagnostic.
 * Walks the same path the crop page uses (Supabase -> crops table -> active column -> rows) and
 * reports exactly which step fails, so "Unable to load crops" can be traced to its real cause.
 * Disabled when NODE_ENV=production unless ENABLE_DIAGNOSTICS=true.
 */
export async function healthDb(req, res) {
  if (!env.enableDiagnostics) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }

  const checks = [];
  const record = (name, ok, detail) => checks.push({ name, ok, ...(detail ? { detail } : {}) });

  record('SUPABASE_URL is set', Boolean(env.supabaseUrl));
  record('SUPABASE_SERVICE_ROLE_KEY is set', Boolean(env.supabaseServiceRoleKey));

  if (supabase) {
    const tables = {
      crops: 'id, name, active',
      mandis: 'id, name, status, latitude, longitude, operating_hours',
      mandi_crop_acceptance: 'mandi_id, crop_id, accepted',
      farmers: 'id, mobile',
      bookings: 'id, farmer_id, mandi_id, crop_id, booking_date, slot_start, slot_end, status',
      queue_tokens: 'id, booking_id, token_number, status',
      payments: 'id, farmer_id, status',
      farmer_credentials: 'farmer_id, password_hash',
      farmer_sessions: 'id, farmer_id, token_hash, expires_at'
    };

    for (const [table, columns] of Object.entries(tables)) {
      try {
        const { error, count } = await supabase.from(table).select(columns, { count: 'exact' }).limit(1);
        record(`table ${table} (${columns})`, !error, error ? `${error.code || ''} ${error.message}`.trim() : `${count ?? '?'} row(s)`);
      } catch (err) {
        record(`table ${table}`, false, err.message);
      }
    }

    try {
      const { data, error } = await supabase.from('crops').select('id').eq('active', true);
      record('active crops available', !error && (data || []).length > 0,
        error ? error.message : `${(data || []).length} active crop(s)` + ((data || []).length ? '' : ' - run backend/supabase/seed.sql'));
    } catch (err) {
      record('active crops available', false, err.message);
    }
  }

  res.json({
    success: checks.every((c) => c.ok),
    checks,
    note: 'farmer_credentials / farmer_sessions come from supabase/migrations/001_auth_and_security.sql'
  });
}

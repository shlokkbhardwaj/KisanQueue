import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

/** "a, b/ ,c" -> ['a','b','c'] (trailing slashes removed: origins never end in "/") */
function parseList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function numberFromEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT || 5000),

  // Kept for backwards compatibility. FRONTEND_ORIGIN may now be a comma-separated list.
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  frontendOrigins: parseList(process.env.FRONTEND_ORIGIN),

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Auth
  sessionTtlHours: numberFromEnv('SESSION_TTL_HOURS', 24 * 7),

  // Slot generation / capacity (business configuration, not data)
  slotMinutes: numberFromEnv('SLOT_MINUTES', 30),
  slotCapacity: numberFromEnv('SLOT_CAPACITY', 20),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',

  // /api/health/db is a developer diagnostic; off in production unless enabled.
  enableDiagnostics: process.env.ENABLE_DIAGNOSTICS
    ? process.env.ENABLE_DIAGNOSTICS === 'true'
    : nodeEnv !== 'production'
};

export function assertEnv() {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !process.env[key]);
  if (missing.length) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Database routes will fail until configured.`);
  }
}

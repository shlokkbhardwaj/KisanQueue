import { supabase } from '../config/supabase.js';
import { hashSessionToken } from '../utils/password.js';
import { asyncHandler } from './error.js';

const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

/** Resolves the session for the request, or null. Throws only for infrastructure problems. */
async function resolveSession(req) {
  const token = bearerToken(req);
  if (!token) return null;
  if (!supabase) throw new Error('Supabase is not configured.');

  const tokenHash = hashSessionToken(token);
  const { data, error } = await supabase
    .from('farmer_sessions')
    .select('id, farmer_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) {
      const e = new Error('Login tables are missing. Run backend/supabase/migrations/001_auth_and_security.sql in the Supabase SQL editor.');
      e.status = 503;
      throw e;
    }
    throw error;
  }
  if (!data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;

  return { sessionId: data.id, farmerId: Number(data.farmer_id), tokenHash, expiresAt: data.expires_at };
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const session = await resolveSession(req);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Please log in to continue.', code: 'AUTH_REQUIRED' });
  }
  req.auth = session;
  next();
});

/** Attaches req.auth when a valid session exists; never rejects. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  req.auth = (await resolveSession(req)) || null;
  next();
});

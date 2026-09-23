import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import {
  burnPasswordCheck, hashPassword, hashSessionToken, newSessionToken,
  validatePassword, verifyPassword
} from '../utils/password.js';
import { cleanText, httpError } from '../utils/validate.js';

/*
 * Farmer authentication.
 *
 * Why not Supabase Auth? Farmers identify themselves by mobile number, and Supabase
 * password sign-in needs an e-mail address (or a Phone provider + SMS gateway). The
 * project's frontend also talks only to this backend, never to Supabase directly.
 * So the backend owns the credentials:
 *   - passwords are hashed with scrypt (see utils/password.js), never stored in clear
 *   - the hash lives in its own table (farmer_credentials) so `select *` on farmers can
 *     never leak it
 *   - a login creates a random session token; only its SHA-256 hash is stored
 *     (farmer_sessions), so logout is a real server-side revocation
 */

const MOBILE_RE = /^[6-9]\d{9}$/;
const LANGUAGES = new Set(['hi', 'en', 'bn', 'mr', 'pa', 'ta', 'te', 'gu', 'bho', 'kn', 'ml', 'or', 'as']);

// Per mobile number: 10 attempts / 15 min. Per IP the ceiling is higher because farmers often share
// a kiosk / common-service-centre connection.
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
export const loginIpLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });
const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 30 });
export const __limiters = { loginLimiter, loginIpLimiter, registerLimiter }; // used by tests

const PUBLIC_FARMER_FIELDS = ['id', 'full_name', 'mobile', 'farmer_id', 'village', 'district', 'state', 'preferred_language', 'created_at'];

export function publicFarmer(row) {
  const out = {};
  for (const key of PUBLIC_FARMER_FIELDS) out[key] = row?.[key] ?? null;
  return out;
}

export function tooMany(res, retryAfterSeconds) {
  res.set('Retry-After', String(retryAfterSeconds));
  return res.status(429).json({
    success: false,
    error: 'Too many attempts. Please wait a few minutes and try again.',
    retryAfterSeconds
  });
}

function missingTables(error) {
  return ['42P01', 'PGRST205'].includes(error?.code);
}

function loginTablesMissing() {
  return httpError(503, 'Login tables are missing. Run backend/supabase/migrations/001_auth_and_security.sql in the Supabase SQL editor.');
}

async function createSession(farmerId, req) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 3600 * 1000).toISOString();

  const { error } = await supabase.from('farmer_sessions').insert({
    farmer_id: farmerId,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt,
    user_agent: cleanText(req.headers['user-agent'], 200)
  });
  if (error) {
    if (missingTables(error)) throw loginTablesMissing();
    throw error;
  }

  // Housekeeping: drop this farmer's expired sessions.
  await supabase.from('farmer_sessions').delete().eq('farmer_id', farmerId).lt('expires_at', new Date().toISOString());

  return { token, expiresAt };
}

/* ------------------------------------------------------------------ register */

export async function register(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const limit = registerLimiter.hit(`ip:${req.ip}`);
  if (limit.limited) return tooMany(res, limit.retryAfterSeconds);

  const body = req.body || {};
  const fullName = cleanText(body.full_name, 100);
  const mobile = String(body.mobile ?? '').trim();
  const password = body.password;

  if (!fullName || fullName.length < 2) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }
  if (!MOBILE_RE.test(mobile)) {
    return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required.' });
  }
  const passwordError = validatePassword(password, { mobile });
  if (passwordError) {
    return res.status(400).json({ success: false, error: passwordError });
  }

  const language = LANGUAGES.has(String(body.preferred_language)) ? String(body.preferred_language) : 'hi';
  const profile = {
    full_name: fullName,
    farmer_id: cleanText(body.farmer_id, 40),
    village: cleanText(body.village, 100),
    district: cleanText(body.district, 100),
    state: cleanText(body.state, 100),
    preferred_language: language
  };

  // Is this mobile number already known?
  const { data: existing, error: lookupError } = await supabase
    .from('farmers').select('*').eq('mobile', mobile).maybeSingle();
  if (lookupError) throw lookupError;

  let farmer = existing;
  let createdNow = false;
  let claimedLegacy = false;

  if (existing) {
    const { data: cred, error: credError } = await supabase
      .from('farmer_credentials').select('farmer_id').eq('farmer_id', existing.id).maybeSingle();
    if (credError) {
      if (missingTables(credError)) throw loginTablesMissing();
      throw credError;
    }
    if (cred) {
      return res.status(409).json({
        success: false,
        error: 'This mobile number is already registered. Please log in instead.',
        code: 'ALREADY_REGISTERED'
      });
    }
    // A profile created before passwords existed (old page02 flow): attach a password to it so
    // its earlier bookings stay linked to the same farmer record.
    claimedLegacy = true;
  } else {
    const { data, error } = await supabase.from('farmers').insert({ ...profile, mobile }).select('*').single();
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'This mobile number or farmer ID is already registered.',
          code: 'ALREADY_REGISTERED'
        });
      }
      throw error;
    }
    farmer = data;
    createdNow = true;
  }

  try {
    const passwordHash = await hashPassword(password);
    const { error } = await supabase.from('farmer_credentials').insert({ farmer_id: farmer.id, password_hash: passwordHash });
    if (error) {
      if (missingTables(error)) throw loginTablesMissing();
      throw error;
    }
  } catch (err) {
    if (createdNow) await supabase.from('farmers').delete().eq('id', farmer.id); // no orphan profile without a password
    throw err;
  }

  if (claimedLegacy) {
    const { data: updated } = await supabase
      .from('farmers').update(profile).eq('id', farmer.id).select('*').maybeSingle();
    if (updated) farmer = updated;
  }

  const session = await createSession(farmer.id, req);
  res.status(201).json({ success: true, data: { farmer: publicFarmer(farmer), ...session, claimedExistingProfile: claimedLegacy } });
}

/* --------------------------------------------------------------------- login */

export async function login(req, res) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const mobile = String(req.body?.mobile ?? '').trim();
  const password = req.body?.password;
  const badCredentials = () => res.status(401).json({ success: false, error: 'Invalid mobile number or password.', code: 'BAD_CREDENTIALS' });

  if (!MOBILE_RE.test(mobile) || typeof password !== 'string' || !password || password.length > 128) {
    return res.status(400).json({ success: false, error: 'Enter your 10-digit mobile number and password.' });
  }

  const mobileKey = `mobile:${mobile}`;
  const a = loginIpLimiter.hit(`ip:${req.ip}`);
  const b = loginLimiter.hit(mobileKey);
  if (a.limited || b.limited) return tooMany(res, Math.max(a.retryAfterSeconds, b.retryAfterSeconds));

  const { data: farmer, error: farmerError } = await supabase
    .from('farmers').select('*').eq('mobile', mobile).maybeSingle();
  if (farmerError) throw farmerError;

  let stored = null;
  if (farmer) {
    const { data: cred, error: credError } = await supabase
      .from('farmer_credentials').select('password_hash').eq('farmer_id', farmer.id).maybeSingle();
    if (credError) {
      if (missingTables(credError)) throw loginTablesMissing();
      throw credError;
    }
    stored = cred?.password_hash || null;
  }

  if (!stored) {
    await burnPasswordCheck(password);
    return badCredentials();
  }
  if (!(await verifyPassword(password, stored))) return badCredentials();

  loginLimiter.reset(mobileKey);
  await supabase.from('farmer_credentials').update({ last_login_at: new Date().toISOString() }).eq('farmer_id', farmer.id);

  const session = await createSession(farmer.id, req);
  res.json({ success: true, data: { farmer: publicFarmer(farmer), ...session } });
}

/* -------------------------------------------------------------------- logout */

export async function logout(req, res) {
  const { error } = await supabase.from('farmer_sessions').delete().eq('id', req.auth.sessionId);
  if (error) throw error;
  res.json({ success: true });
}

/* ------------------------------------------------------------------------ me */

export async function me(req, res) {
  const { data, error } = await supabase.from('farmers').select('*').eq('id', req.auth.farmerId).maybeSingle();
  if (error) throw error;
  if (!data) return res.status(401).json({ success: false, error: 'Please log in to continue.', code: 'AUTH_REQUIRED' });
  res.json({ success: true, data: { farmer: publicFarmer(data), expiresAt: req.auth.expiresAt } });
}

import { supabase } from '../config/supabase.js';
import { hashSessionToken } from '../utils/password.js';
import { asyncHandler } from './error.js';

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

async function resolveStaffSession(req) {
  const token = bearerToken(req);
  if (!token) return null;
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('staff_sessions')
    .select('id, staff_id, expires_at')
    .eq('token_hash', hashSessionToken(token)).maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  const { data: staff, error: staffError } = await supabase.from('staff')
    .select('id, staff_code, name, role, mandi_id, active').eq('id', data.staff_id).maybeSingle();
  if (staffError) throw staffError;
  if (!staff || !staff.active) return null;
  return { sessionId: data.id, staff };
}

export const requireStaffAuth = asyncHandler(async (req, res, next) => {
  const session = await resolveStaffSession(req);
  if (!session) return res.status(401).json({ success:false, error:'Staff login required.', code:'STAFF_AUTH_REQUIRED' });
  req.staffAuth = session;
  next();
});

export function requireStaffRoles(...roles) {
  return asyncHandler(async (req, res, next) => {
    const session = await resolveStaffSession(req);
    if (!session) return res.status(401).json({ success:false, error:'Staff login required.', code:'STAFF_AUTH_REQUIRED' });
    if (!roles.includes(session.staff.role)) return res.status(403).json({ success:false, error:'You do not have permission for this action.', code:'FORBIDDEN' });
    req.staffAuth = session;
    next();
  });
}

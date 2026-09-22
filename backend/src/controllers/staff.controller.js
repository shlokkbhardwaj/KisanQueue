import { supabase } from '../config/supabase.js';
import { hashPassword, verifyPassword, burnPasswordCheck, validatePassword, newSessionToken, hashSessionToken } from '../utils/password.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
const staffLoginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
function tooMany(res, retryAfterSeconds) { res.set('Retry-After', String(retryAfterSeconds)); return res.status(429).json({success:false,error:'Too many login attempts. Please try again later.',code:'RATE_LIMITED'}); }

const ROLES = new Set(['operator','supervisor','admin']);
const STAFF_ID_RE = /^[A-Za-z0-9_-]{3,40}$/;

function publicStaff(s) { return { id:s.id, staffCode:s.staff_code, name:s.name, role:s.role, mandiId:s.mandi_id, active:s.active }; }

async function createSession(staffId, req) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + 8*60*60*1000).toISOString();
  const { error } = await supabase.from('staff_sessions').insert({ staff_id:staffId, token_hash:hashSessionToken(token), expires_at:expiresAt, user_agent:String(req.headers['user-agent']||'').slice(0,500) });
  if (error) throw error;
  return { token, expiresAt };
}

export async function staffLogin(req,res) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const staffCode=String(req.body?.staffCode ?? req.body?.staff_id ?? '').trim();
  const password=req.body?.password;
  if (!STAFF_ID_RE.test(staffCode) || typeof password!=='string' || !password || password.length>128) return res.status(400).json({success:false,error:'Enter a valid staff ID and password.'});
  const lim=staffLoginLimiter.hit(`staff-ip:${req.ip}`); if(lim.limited) return tooMany(res,lim.retryAfterSeconds);
  const {data:staff,error}=await supabase.from('staff').select('*').eq('staff_code',staffCode).maybeSingle();
  if(error) throw error;
  if(!staff || !staff.active){ await burnPasswordCheck(password); return res.status(401).json({success:false,error:'Invalid staff ID or password.',code:'BAD_CREDENTIALS'}); }
  const {data:cred,error:ce}=await supabase.from('staff_credentials').select('password_hash').eq('staff_id',staff.id).maybeSingle();
  if(ce) throw ce;
  if(!cred || !(await verifyPassword(password,cred.password_hash))) return res.status(401).json({success:false,error:'Invalid staff ID or password.',code:'BAD_CREDENTIALS'});
  await supabase.from('staff_credentials').update({last_login_at:new Date().toISOString()}).eq('staff_id',staff.id);
  const session=await createSession(staff.id,req);
  res.json({success:true,data:{staff:publicStaff(staff),...session}});
}

export async function staffLogout(req,res){ const {error}=await supabase.from('staff_sessions').delete().eq('id',req.staffAuth.sessionId); if(error) throw error; res.json({success:true}); }
export async function staffMe(req,res){ res.json({success:true,data:{staff:publicStaff(req.staffAuth.staff)}}); }

export async function listStaff(req,res){
  const {data,error}=await supabase.from('staff').select('id,staff_code,name,role,mandi_id,active,created_at').order('created_at',{ascending:false});
  if(error) throw error; res.json({success:true,data:data||[]});
}

export async function createStaff(req,res){
  const staffCode=String(req.body?.staffCode||'').trim(); const name=String(req.body?.name||'').trim(); const password=req.body?.password; const role=String(req.body?.role||'operator'); const mandiId=req.body?.mandiId?Number(req.body.mandiId):null;
  if(!STAFF_ID_RE.test(staffCode)||name.length<2||name.length>100) return res.status(400).json({success:false,error:'Valid staff ID and name are required.'});
  if(!ROLES.has(role)) return res.status(400).json({success:false,error:'Invalid role.'});
  const passwordError=validatePassword(password); if(passwordError) return res.status(400).json({success:false,error:passwordError});
  const {data:staff,error}=await supabase.from('staff').insert({staff_code:staffCode,name,role,mandi_id:mandiId,active:true}).select('*').single();
  if(error){ if(error.code==='23505') return res.status(409).json({success:false,error:'That staff ID already exists.'}); throw error; }
  try { const {error:ce}=await supabase.from('staff_credentials').insert({staff_id:staff.id,password_hash:await hashPassword(password)}); if(ce) throw ce; }
  catch(e){ await supabase.from('staff').delete().eq('id',staff.id); throw e; }
  res.status(201).json({success:true,data:publicStaff(staff)});
}

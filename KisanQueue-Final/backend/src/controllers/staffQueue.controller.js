import { supabase } from '../config/supabase.js';
import { notifyFarmer } from '../services/notification.service.js';

function day(req){ return String(req.query.date || new Date().toISOString().slice(0,10)); }
function ensureCentre(req,res){ const staff=req.staffAuth.staff; const mandiId=Number(req.query.mandiId || req.body?.mandiId || staff.mandi_id); if(!mandiId) {res.status(400).json({success:false,error:'A centre is required.'}); return null;} if(staff.role!=='admin' && Number(staff.mandi_id)!==mandiId){res.status(403).json({success:false,error:'You can only manage your assigned centre.'}); return null;} return mandiId; }

export async function staffQueue(req,res){
 const mandiId=ensureCentre(req,res); if(!mandiId)return;
 const date=day(req);
 const {data:bookings,error:be}=await supabase.from('bookings').select('id,farmer_id,crop_id,booking_date,slot_start,quantity_quintals,status,crops(name),farmers(full_name,mobile)').eq('mandi_id',mandiId).eq('booking_date',date); if(be)throw be;
 const ids=(bookings||[]).map(x=>x.id); let tokens=[]; if(ids.length){const {data,error}=await supabase.from('queue_tokens').select('*').in('booking_id',ids).order('token_number',{ascending:true});if(error)throw error;tokens=data||[];}
 const byId=new Map((bookings||[]).map(b=>[Number(b.id),b]));
 const data=tokens.map(t=>{const b=byId.get(Number(t.booking_id))||{};const farmer=Array.isArray(b.farmers)?b.farmers[0]:b.farmers;const crop=Array.isArray(b.crops)?b.crops[0]:b.crops;return {...t,booking:b,farmer:{name:farmer?.full_name||'Farmer',mobile:farmer?.mobile||null},cropName:crop?.name||'Crop'};});
 res.json({success:true,data,summary:{total:data.length,waiting:data.filter(x=>x.status==='WAITING').length,called:data.filter(x=>x.status==='CALLED').length,serving:data.filter(x=>x.status==='SERVING').length,hold:data.filter(x=>x.status==='HOLD').length,completed:data.filter(x=>x.status==='COMPLETED').length}});
}

async function token(req){const id=Number(req.params.tokenId);const {data,error}=await supabase.from('queue_tokens').select('*, bookings(id,farmer_id,mandi_id,booking_date,slot_start,status)').eq('id',id).maybeSingle();if(error)throw error;return data;}
async function assertTokenCentre(t,req,res){if(!t||!t.bookings)return res.status(404).json({success:false,error:'Queue token not found.'});if(req.staffAuth.staff.role!=='admin'&&Number(t.bookings.mandi_id)!==Number(req.staffAuth.staff.mandi_id))return res.status(403).json({success:false,error:'You can only manage your assigned centre.'});return true;}
async function transition(req,res,nextStatus,allowed,fields={}){const t=await token(req);if(!(await assertTokenCentre(t,req,res)))return;if(!allowed.includes(t.status))return res.status(409).json({success:false,error:`Token cannot move from ${t.status} to ${nextStatus}.`});const patch={status:nextStatus,...fields};if(nextStatus==='CALLED')patch.called_at=new Date().toISOString();if(nextStatus==='COMPLETED')patch.completed_at=new Date().toISOString();const {data,error}=await supabase.from('queue_tokens').update(patch).eq('id',t.id).eq('status',t.status).select('*').single();if(error)throw error;if(!data)return res.status(409).json({success:false,error:'Token changed by another operator. Refresh and try again.'}); await supabase.from('queue_events').insert({queue_token_id:t.id,staff_id:req.staffAuth.staff.id,from_status:t.status,to_status:nextStatus,counter_id:patch.counter_id||null}); if(nextStatus==='CALLED')await notifyFarmer(Number(t.bookings.farmer_id),{type:'QUEUE',title:`Token #${data.token_number} called`,message:`Please proceed to counter ${data.counter_id || 'the procurement counter'}.`});res.json({success:true,data});}
export const callToken=(req,res)=>transition(req,res,'CALLED',['WAITING'],{counter_id:req.body?.counterId?String(req.body.counterId).slice(0,20):null});
export const serveToken=(req,res)=>transition(req,res,'SERVING',['CALLED']);
export const holdToken=(req,res)=>transition(req,res,'HOLD',['WAITING','CALLED'],{counter_id:null});
export const resumeToken=(req,res)=>transition(req,res,'WAITING',['HOLD'],{counter_id:null});
export const completeToken=(req,res)=>transition(req,res,'COMPLETED',['SERVING','CALLED']);
export const skipToken=(req,res)=>transition(req,res,'SKIPPED',['WAITING','CALLED'],{counter_id:null});
export const recallToken=(req,res)=>transition(req,res,'CALLED',['SKIPPED','HOLD'],{counter_id:req.body?.counterId?String(req.body.counterId).slice(0,20):null});

import 'dotenv/config';
import { supabase } from '../src/config/supabase.js';
import { hashPassword, validatePassword } from '../src/utils/password.js';
if(!supabase) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
const [staffCode,name,role='operator',mandiId=''] = process.argv.slice(2);
const password=process.env.STAFF_PASSWORD;
if(!staffCode||!name||!['operator','supervisor','admin'].includes(role)||!password) throw new Error('Usage: STAFF_PASSWORD="StrongPassword1" node scripts/create-staff.mjs OP001 "Name" operator 1');
const pe=validatePassword(password); if(pe) throw new Error(pe);
const {data,error}=await supabase.from('staff').insert({staff_code:staffCode,name,role,mandi_id:mandiId?Number(mandiId):null,active:true}).select('*').single();
if(error) throw error;
const {error:ce}=await supabase.from('staff_credentials').insert({staff_id:data.id,password_hash:await hashPassword(password)});
if(ce){await supabase.from('staff').delete().eq('id',data.id);throw ce;}
console.log(`Created ${staffCode} (${role}).`);

(function(global){'use strict';
 const KEY='kq_staff_auth';
 function resolveApiBase(){if(global.KQ_API_BASE)return String(global.KQ_API_BASE).replace(/\/+$/,'');var l=global.location||{};var local=(l.protocol==='http:'||l.protocol==='https:')&&(l.hostname==='localhost'||l.hostname==='127.0.0.1');return local?'http://'+l.hostname+':5000/api':'https://kisanqueue-jcgb.onrender.com/api';}
 const API=resolveApiBase();
 function get(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(!s?.token||!s?.staff)return null;if(s.expiresAt&&new Date(s.expiresAt)<=new Date()){localStorage.removeItem(KEY);return null}return s}catch{return null}}
 async function api(path,opts={}){const s=get();const headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});if(s)headers.Authorization='Bearer '+s.token;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let r;try{r=await fetch(API+path,{...opts,headers,signal:controller.signal});}catch(err){clearTimeout(timeout);if(err.name==='AbortError')throw new Error('The staff service took too long to respond. Check the backend connection.');throw new Error('Unable to reach the staff service. Check the backend connection.');}clearTimeout(timeout);const out=await r.json().catch(()=>({}));if(r.status===401){localStorage.removeItem(KEY);location.href='page11-staff-login.html';throw new Error(out.error||'Staff login required.')}if(!r.ok)throw new Error(out.error||'Request failed');return out}
 async function logout(){const s=get();try{if(s)await api('/staff/auth/logout',{method:'POST'})}catch{}localStorage.removeItem(KEY);location.href='page11-staff-login.html'}
 async function requireAuth(){const s=get();if(!s){location.href='page11-staff-login.html';return null}try{const out=await api('/staff/auth/me');return out.data.staff}catch{localStorage.removeItem(KEY);location.href='page11-staff-login.html';return null}}
 global.KQStaff={API,get,api,logout,requireAuth};
})(window);

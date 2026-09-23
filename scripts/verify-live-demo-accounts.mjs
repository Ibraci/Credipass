import {DEMO_ACCOUNTS,demoPasswordFor} from './lib/demo-accounts.mjs';
const base=process.env.CREDIPASS_BASE_URL||'http://127.0.0.1:8092';
let ok=0;
for(const a of DEMO_ACCOUNTS){
  const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:a.login,password:demoPasswordFor(a,{allowCommon:false})})});
  if(r.ok){ok++;console.log(`[OK] ${a.login}`)}else{const j=await r.json().catch(()=>({}));console.log(`[ECHEC] ${a.login} — ${r.status} ${j.error||''}`)}
}
console.log(`COMPTES LIVE: ${ok}/10 PASS`);
process.exit(ok===10?0:1);

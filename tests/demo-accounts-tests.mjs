import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=19632,base=`http://127.0.0.1:${port}`;
const accounts=[
 ['gerant','Gerant@2026'],['agent.credit','Agent@2026'],['analyste.credit','Analyse@2026'],['conformite','Conformite@2026'],['comite.credit','Comite@2026'],['direction','Direction@2026'],['auditeur','Audit@2026'],['admin.systeme','Admin@2026'],['caisse','Caisse@2026'],['suivi.credit','Suivi@2026']
];
const env={...process.env,CREDIPASS_TEST_MODE:'1',CREDIPASS_HOST:'127.0.0.1',CREDIPASS_DEMO_PASSWORD:''};
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{cwd:new URL('..',import.meta.url),env,stdio:['ignore','pipe','pipe']});
async function wait(){for(let i=0;i<80;i++){try{if((await fetch(base+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,75))}throw Error('Serveur non démarré')}
try{
 await wait();
 for(const [login,password] of accounts){
   const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login,password})});
   assert.equal(r.status,200,`${login} doit se connecter`);
   const j=await r.json();assert.equal(j.user.login,login);
 }
 const bad=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:'agent.credit',password:'1234'})});
 assert.equal(bad.status,401,'ancien mot de passe 1234 doit être refusé par défaut');
 console.log('DEMO ACCOUNTS: PASS — 10 comptes / 10 mots de passe mémorisables validés');
}finally{child.kill('SIGTERM')}

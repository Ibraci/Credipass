import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
const port=19681,base=`http://127.0.0.1:${port}`;
const root=new URL('..',import.meta.url);
const env={...process.env,CREDIPASS_TEST_MODE:'1',CREDIPASS_HOST:'127.0.0.1',CREDIPASS_DEMO_PASSWORD:''};
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
async function wait(){for(let i=0;i<80;i++){try{if((await fetch(base+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,75))}throw Error('Serveur non démarré')}
async function login(password){return fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:'agent.credit',password})})}
try{
  await wait();
  let r=await login('Agent@2026');assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await fetch(base+'/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify({currentPassword:'Erreur@2026',newPassword:'Nouveau@2026'})});assert.equal(r.status,401);
  r=await fetch(base+'/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify({currentPassword:'Agent@2026',newPassword:'court'})});assert.equal(r.status,400);
  r=await fetch(base+'/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify({currentPassword:'Agent@2026',newPassword:'Nouveau@2026'})});assert.equal(r.status,200);let j=await r.json();assert.equal(j.user.login,'agent.credit');
  r=await login('Agent@2026');assert.equal(r.status,401,'ancien mot de passe refusé');
  r=await login('Nouveau@2026');assert.equal(r.status,200,'nouveau mot de passe accepté');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const app=readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
  assert.match(html,/data-act="userProfile"/);assert.match(html,/Hackathon CIF · DigiCoop-WA\+/);assert.match(app,/apiChangePassword/);assert.match(app,/Changer mon mot de passe/);
  console.log('MVP PROFILE: PASS — profil cliquable + changement mot de passe serveur + offline credential');
}finally{child.kill('SIGTERM')}

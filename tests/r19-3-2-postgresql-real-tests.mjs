import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as wait} from 'node:timers/promises';
const url=String(process.env.CREDIPASS_TEST_POSTGRES_URL||'').trim();
if(!url){console.log('R19.3.2 REAL POSTGRESQL: SKIP — définissez CREDIPASS_TEST_POSTGRES_URL vers une base PostgreSQL de TEST. Aucun PASS PostgreSQL réel n’est revendiqué.');process.exit(0)}
try{await import('postgres')}catch{console.log('R19.3.2 REAL POSTGRESQL: SKIP — pilote postgres absent; exécutez npm install.');process.exit(0)}
const port=19344,password='PgReal-1932!';
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{cwd:new URL('..',import.meta.url),env:{...process.env,CREDIPASS_DATABASE_URL:url,CREDIPASS_DEMO_PASSWORD:password,CREDIPASS_HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
const base=`http://127.0.0.1:${port}`;
async function health(){for(let i=0;i<80;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return r.json()}catch{}await wait(150)}throw Error('PostgreSQL réel / serveur CREDIPASS indisponible')}
try{const h=await health();assert.equal(h.database.engine,'POSTGRESQL');assert.equal(h.database.connected,true);assert.equal(h.terminalStorage,'IndexedDB');const lr=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:'admin.systeme',password})});assert.equal(lr.status,200);console.log(`R19.3.2 REAL POSTGRESQL: PASS — base ${h.database.name||'connectée'}`)}finally{child.kill('SIGTERM')}

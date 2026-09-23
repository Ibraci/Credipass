import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as wait} from 'node:timers/promises';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const server=fs.readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../scripts/lib/storage.mjs',import.meta.url),'utf8');
const schema=fs.readFileSync(new URL('../db/postgresql/001_init.sql',import.meta.url),'utf8');
const repo=fs.readFileSync(new URL('../src/modules/dataRepository.js',import.meta.url),'utf8');

assert.equal(pkg.version,'19.3.2');
assert.equal(pkg.dependencies?.postgres,'3.4.9');
assert.match(repo,/indexedDB\.open/,'IndexedDB terminal absent');
assert.match(server,/createStore/);
assert.match(server,/PostgreSQL central/);
assert.doesNotMatch(server,/node:sqlite/);
assert.doesNotMatch(server,/credipass-central\.sqlite/);
assert.match(storage,/CREDIPASS_DATABASE_URL/);
assert.match(storage,/import\('postgres'\)/);
assert.match(storage,/CREDIPASS_TEST_MODE/);
assert.match(schema,/JSONB/);
assert.match(schema,/TIMESTAMPTZ/);
assert.match(schema,/sync_entity_versions/);
assert.equal(fs.existsSync(new URL('../data-central/credipass-central.sqlite',import.meta.url)),false,'SQLite central ne doit plus être livré');

const port=19342;
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{
  cwd:new URL('..',import.meta.url),
  env:{...process.env,CREDIPASS_TEST_MODE:'1',CREDIPASS_DEMO_PASSWORD:'PgTest-1932!',CREDIPASS_HOST:'127.0.0.1'},
  stdio:['ignore','pipe','pipe']
});
const base=`http://127.0.0.1:${port}`;
async function health(){for(let i=0;i<40;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return r.json()}catch{}await wait(100)}throw Error('serveur test indisponible')}
try{
  const h=await health();
  assert.equal(h.service,'CREDIPASS Central R19.3.2');
  assert.equal(h.terminalStorage,'IndexedDB');
  assert.equal(h.database.engine,'MEMORY_TEST');
  const lr=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login:'admin.systeme',password:'PgTest-1932!'})});
  assert.equal(lr.status,200);
  const cookie=lr.headers.get('set-cookie').split(';')[0];
  const pr=await fetch(base+'/api/sync/pull',{headers:{cookie}});assert.equal(pr.status,200);
}finally{child.kill('SIGTERM')}

// Sans URL PostgreSQL et hors mode test, aucun fallback SQLite/mémoire n'est autorisé.
const fail=spawn(process.execPath,['scripts/serve.mjs','19343'],{cwd:new URL('..',import.meta.url),env:Object.fromEntries(Object.entries(process.env).filter(([k])=>!['CREDIPASS_DATABASE_URL','DATABASE_URL','CREDIPASS_TEST_MODE','NODE_ENV'].includes(k))),stdio:['ignore','pipe','pipe']});
let err='';fail.stderr.on('data',d=>err+=d);fail.stdout.on('data',d=>err+=d);
await new Promise(resolve=>fail.on('exit',resolve));
assert.match(err,/PostgreSQL non configuré/);

console.log('R19.3.2 POSTGRESQL CENTRAL: PASS — IndexedDB terminaux, PostgreSQL central obligatoire, aucun fallback SQLite de production');

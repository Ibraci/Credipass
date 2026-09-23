import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const dir=mkdtempSync(join(tmpdir(),'credipass-r184-'));
const port=18784;
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{
  env:{...process.env,CREDIPASS_TEST_MODE:'1',CREDIPASS_DATA_DIR:dir,CREDIPASS_DEMO_PASSWORD:'Test-184!'},
  stdio:['ignore','pipe','pipe']
});

async function wait(){
  for(let i=0;i<40;i++){
    try{if((await fetch(base+'/api/health')).ok)return}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Serveur non démarré');
}
async function login(login){
  const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login,password:'Test-184!'})});
  assert.equal(r.status,200);
  return r.headers.get('set-cookie').split(';')[0];
}
async function post(cookie,path,obj){
  return fetch(base+path,{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(obj)});
}
async function get(cookie,path){return fetch(base+path,{headers:{cookie}})}

try{
  await wait();
  const g=await login('gerant');
  const a=await login('agent.credit');
  const r=await login('analyste.credit');

  let x=await post(g,'/api/sync',{
    operations:[{
      id:'M-X-OP',type:'MEMBRE_CREE',entityId:'M-X',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:0,targetVersion:1,createdAt:new Date().toISOString()
    }],
    snapshot:{members:[{id:'M-X',name:'Membre Test',agency:'Agence principale',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',ownerLogin:'gerant',assignedAgentLogin:'agent.credit',syncVersion:1}],applications:[]}
  });
  assert.equal(x.status,200);
  let jr=await x.json();
  assert.equal(jr.conflicts.length,0,'Création membre versionnée sans conflit');

  x=await get(a,'/api/sync/pull');
  let j=await x.json();
  assert.equal(j.snapshot.members.some(m=>m.id==='M-X'),true,'Agent reçoit le membre affecté');

  x=await post(a,'/api/sync',{
    operations:[{
      id:'Q-X',type:'DOSSIER_CREE',entityId:'D-X',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:0,targetVersion:1,createdAt:new Date().toISOString()
    }],
    snapshot:{
      members:[{id:'M-HACK',name:'Interdit',agency:'Agence principale',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',assignedAgentLogin:'agent.credit',syncVersion:1}],
      applications:[{id:'D-X',memberId:'M-X',agency:'Agence principale',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',ownerLogin:'agent.credit',assignedAgentLogin:'agent.credit',status:'BROUILLON',syncVersion:1}]
    }
  });
  assert.equal(x.status,200);
  jr=await x.json();
  assert.equal(jr.conflicts.length,0,'Création dossier versionnée sans conflit');

  x=await get(r,'/api/sync/pull');
  j=await x.json();
  assert.equal(j.snapshot.applications.some(v=>v.id==='D-X'),true,'Analyste / Responsable voit le dossier Agent');
  assert.equal(j.snapshot.members.some(v=>v.id==='M-HACK'),false,'Agent ne peut pas injecter un membre central sans opération membre autorisée');
  console.log('R18.4 CENTRAL SYNC: PASS — état partagé versionné Gérant → Agent → Analyste/Responsable, injection membre Agent rejetée');
} finally {
  child.kill('SIGTERM');
  rmSync(dir,{recursive:true,force:true});
}

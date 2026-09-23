import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir,networkInterfaces} from 'node:os';
import {join} from 'node:path';

// Vérifications statiques des bloqueurs identifiés.
const serverText=fs.readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
const clientText=fs.readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
const offlineText=fs.readFileSync(new URL('../src/modules/offlineFieldR18.js',import.meta.url),'utf8');
assert.match(serverText,/CREDIPASS_HOST/,'mode LAN explicite');
for(const k of ['productForms','businessAnalyses','personalBudgets','personalBalanceSheets','institutionalRisk','bicChecks','dataDisputes','dataCorrections','policyChecks'])assert.ok(serverText.includes(`'${k}'`),`collection sync ${k}`);
for(const t of ['FORMULAIRE_SALARIE_MODIFIE','PME_ANALYSE_ACTIVITE_MODIFIEE','PAIEMENT_ENREGISTRE','DECISION_ENREGISTREE','CREDIT_CLOTURE'])assert.ok(clientText.includes(t),`mutation versionnée ${t}`);
assert.match(clientText,/const verified=await apiMe\(\)/,'restauration session serveur');
assert.match(offlineText,/status==='EN_ATTENTE'/,'les conflits ne sont pas renvoyés automatiquement');
assert.match(offlineText,/preserveEntityIds/,'préservation de la version locale en conflit');
// Le pull central ne doit jamais effacer la version locale d'un agrégat en conflit.
const mem=new Map();globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
const {mergeCentralSnapshot}=await import('../src/modules/offlineFieldR18.js?hardening1931');
let local={applications:[{id:'D-PRES',requestedAmount:222}],businessAnalyses:[{id:'BUS-PRES-L',applicationId:'D-PRES',market:'LOCAL'}]},remote={applications:[{id:'D-PRES',requestedAmount:111}],businessAnalyses:[{id:'BUS-PRES-R',applicationId:'D-PRES',market:'CENTRAL'}]};
mergeCentralSnapshot(local,remote,{preserveEntityIds:['D-PRES']});assert.equal(local.applications[0].requestedAmount,222);assert.equal(local.businessAnalyses[0].market,'LOCAL');
mergeCentralSnapshot(local,remote);assert.equal(local.applications[0].requestedAmount,111);assert.equal(local.businessAnalyses.find(x=>x.applicationId==='D-PRES').market,'CENTRAL');
// Toutes les sous-données dossier doivent conserver leur rattachement territorial historique.
const {normalizeTerritory}=await import('../src/modules/decentralizedR191.js?hardening1931');
const territorial={members:[{id:'M-T',agency:'Agence principale',ownerLogin:'gerant',assignedAgentLogin:'agent.credit'}],applications:[{id:'D-T',memberId:'M-T',agency:'Agence principale',ownerLogin:'agent.credit',assignedAgentLogin:'agent.credit'}],productForms:[{id:'F-T',applicationId:'D-T'}],businessAnalyses:[{id:'B-T',applicationId:'D-T'}],personalBudgets:[{id:'PB-T',applicationId:'D-T'}],personalBalanceSheets:[{id:'BS-T',applicationId:'D-T'}],institutionalRisk:[{id:'R-T',applicationId:'D-T'}],bicChecks:[{id:'BC-T',applicationId:'D-T'}],policyChecks:[{id:'PC-T',applicationId:'D-T'}],trustObservations:[{id:'TR-T',applicationId:'D-T'}],audit:[{id:'A-T',applicationId:'D-T'}]};
normalizeTerritory(territorial);
for(const k of ['productForms','businessAnalyses','personalBudgets','personalBalanceSheets','institutionalRisk','bicChecks','policyChecks','trustObservations','audit']){const row=territorial[k][0];assert.equal(row.institutionId,'INST-DEMO',`${k} institution`);assert.equal(row.structureId,'STR-AGENCE-PRINCIPALE',`${k} structure`);assert.equal(row.zoneId,'ZONE-AGENCE-PRINCIPALE',`${k} zone`);assert.equal(row.ownerUserId,'agent.credit',`${k} propriétaire historique`)}

const port=19431,dir=mkdtempSync(join(tmpdir(),'credipass-r1931-'));
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['scripts/serve.mjs',String(port)],{cwd:new URL('..',import.meta.url),env:{...process.env,CREDIPASS_TEST_MODE:'1',CREDIPASS_DATA_DIR:dir,CREDIPASS_DEMO_PASSWORD:'Hard-1931!',CREDIPASS_HOST:'0.0.0.0'},stdio:['ignore','pipe','pipe']});
async function wait(){for(let i=0;i<80;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return await r.json()}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Serveur non démarré')}
async function login(login){const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({login,password:'Hard-1931!'})});assert.equal(r.status,200,`login ${login}`);return r.headers.get('set-cookie').split(';')[0]}
async function post(cookie,path,obj){return fetch(base+path,{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify(obj)})}
async function pull(cookie){const r=await fetch(base+'/api/sync/pull',{headers:{cookie}});assert.equal(r.status,200);return r.json()}
const node=id=>({id,institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE'});
const empty=()=>({members:[],applications:[],documents:[],visits:[],financials:[],guarantees:[],decisions:[],disbursements:[],payments:[],restructures:[],checklists:[],incomeItems:[],expenseItems:[],debts:[],trustObservations:[],schedules:[],scheduleVersions:[],followups:[],alertsLog:[],recommendations:[],productForms:[],policyChecks:[],institutionalRisk:[],businessAnalyses:[],personalBudgets:[],personalBalanceSheets:[],workflowActions:[],consents:[],bicChecks:[],dataDisputes:[],dataCorrections:[],audit:[]});
function dossierSnapshot({amount=500000,syncVersion=1,business='Version initiale'}={}){const s=empty();s.members=[{id:'M-HARD',name:'Membre Hardening',agency:'Agence principale',assignedAgentLogin:'agent.credit',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',syncVersion:1}];s.applications=[{id:'D-HARD',memberId:'M-HARD',product:'Crédit PME',purpose:'Test',requestedAmount:amount,durationMonths:12,periodicity:'Mensuelle',status:'EN ANALYSE',agency:'Agence principale',ownerLogin:'agent.credit',assignedAgentLogin:'agent.credit',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',syncVersion}];s.productForms=[{id:'FRM-HARD',applicationId:'D-HARD',product:'Crédit PME',data:{accountNumber:'001'}}];s.businessAnalyses=[{id:'BUS-HARD',applicationId:'D-HARD',sales:1200000,purchases:500000,operatingExpenses:200000,result:500000,market:business}];s.personalBudgets=[{id:'BUD-HARD',applicationId:'D-HARD',salary:0,otherIncome:200000,personalExpenses:80000,creditTontinePayments:20000,net:100000}];s.personalBalanceSheets=[{id:'BAL-HARD',applicationId:'D-HARD',assets:2000000,liabilities:300000,netWorth:1700000}];s.institutionalRisk=[{id:'RSK-HARD',applicationId:'D-HARD',dimension:'Volonté de payer de l’emprunteur',rating:'Satisfaisant'}];s.bicChecks=[{id:'BIC-HARD',applicationId:'D-HARD',source:'BIC test',commitments:0}];s.policyChecks=[{id:'POL-HARD',applicationId:'D-HARD',code:'PLAFONDS',status:'Conforme'}];s.audit=[{id:'AUD-HARD',applicationId:'D-HARD',at:'2026-09-22T00:00:00Z',action:'TEST',actor:'agent.credit'}];return s}

try{
  const h=await wait();assert.equal(h.service,'CREDIPASS Central R19.3.2');assert.equal(h.syncMode,'AGGREGATE_OPTIMISTIC_VERSIONING');
  // Le bind LAN doit être réellement joignable sur une interface non-loopback lorsqu'elle existe.
  const lanIp=Object.values(networkInterfaces()).flat().find(x=>x&&x.family==='IPv4'&&!x.internal)?.address;
  if(lanIp){const r=await fetch(`http://${lanIp}:${port}/api/health`);assert.equal(r.status,200,'accès LAN réel')}
  const gerant=await login('gerant'),agent=await login('agent.credit'),analyste=await login('analyste.credit'),admin=await login('admin.systeme');
  // Membre v1.
  let s=empty();s.members=[{id:'M-HARD',name:'Membre Hardening',agency:'Agence principale',assignedAgentLogin:'agent.credit',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',syncVersion:1}];
  let r=await post(gerant,'/api/sync',{node:node('NODE-G'),operations:[{id:'EV-M-1',type:'MEMBRE_CREE',entityId:'M-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:0,targetVersion:1}],snapshot:s});let j=await r.json();assert.equal(j.accepted,1);assert.equal(j.conflicts.length,0);
  // Dossier v1.
  s=dossierSnapshot({amount:500000,syncVersion:1,business:'Base'});
  r=await post(agent,'/api/sync',{node:node('NODE-A'),operations:[{id:'EV-D-1',type:'DEMANDE_CREEE',entityId:'D-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:0,targetVersion:1}],snapshot:s});j=await r.json();assert.equal(j.accepted,1);
  // Nœud A modifie tout l'agrégat dossier : les nouvelles collections doivent monter au central.
  const a=dossierSnapshot({amount:600000,syncVersion:2,business:'Marché nœud A'});
  r=await post(agent,'/api/sync',{node:node('NODE-A'),operations:[{id:'EV-D-A',type:'PME_ANALYSE_ACTIVITE_MODIFIEE',entityId:'D-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:1,targetVersion:2}],snapshot:a});j=await r.json();assert.equal(j.accepted,1);assert.equal(j.conflicts.length,0);
  let central=await pull(analyste);assert.equal(central.snapshot.applications.find(x=>x.id==='D-HARD').requestedAmount,600000);assert.equal(central.snapshot.businessAnalyses.find(x=>x.applicationId==='D-HARD').market,'Marché nœud A');for(const k of ['productForms','personalBudgets','personalBalanceSheets','institutionalRisk','bicChecks','policyChecks'])assert.ok(central.snapshot[k].some(x=>x.applicationId==='D-HARD'),`${k} consolidé`);
  // Snapshot sans opération : aucune écriture silencieuse n'est permise.
  const silent=dossierSnapshot({amount:777777,syncVersion:2,business:'Écrasement silencieux interdit'});
  r=await post(agent,'/api/sync',{node:node('NODE-B'),operations:[],snapshot:silent});j=await r.json();assert.equal(j.accepted,0);central=await pull(analyste);assert.equal(central.snapshot.applications.find(x=>x.id==='D-HARD').requestedAmount,600000);assert.equal(central.snapshot.businessAnalyses.find(x=>x.applicationId==='D-HARD').market,'Marché nœud A');
  // Nœud B travaille depuis v1 : collision explicite, aucune donnée du snapshot B ne remplace A.
  const b=dossierSnapshot({amount:800000,syncVersion:2,business:'Marché nœud B'});
  r=await post(agent,'/api/sync',{node:node('NODE-B'),operations:[{id:'EV-D-B',type:'PME_BUDGET_PERSONNEL_MODIFIE',entityId:'D-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:1,targetVersion:2}],snapshot:b});j=await r.json();assert.equal(j.accepted,0);assert.equal(j.conflicts[0].type,'VERSION_CONFLICT');assert.equal(j.conflicts[0].centralVersion,2);central=await pull(analyste);assert.equal(central.snapshot.applications.find(x=>x.id==='D-HARD').requestedAmount,600000);assert.equal(central.snapshot.businessAnalyses.find(x=>x.applicationId==='D-HARD').market,'Marché nœud A');
  // Résolution humaine : REBASE_LOCAL, puis nouvelle tentative en v2→v3.
  r=await post(agent,'/api/sync/resolve',{eventId:'EV-D-B',resolution:'REBASE_LOCAL'});j=await r.json();assert.equal(j.centralVersion,2);assert.equal(j.nextTargetVersion,3);
  b.applications[0].syncVersion=3;r=await post(agent,'/api/sync',{node:node('NODE-B'),operations:[{id:'EV-D-B',type:'PME_BUDGET_PERSONNEL_MODIFIE',entityId:'D-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:2,targetVersion:3}],snapshot:b});j=await r.json();assert.equal(j.accepted,1);central=await pull(analyste);assert.equal(central.snapshot.applications.find(x=>x.id==='D-HARD').requestedAmount,800000);assert.equal(central.snapshot.businessAnalyses.find(x=>x.applicationId==='D-HARD').market,'Marché nœud B');
  // Rejouer le même event avec un snapshot falsifié ne doit pas réappliquer l'état.
  const tampered=dossierSnapshot({amount:999999,syncVersion:3,business:'REPLAY INTERDIT'});r=await post(agent,'/api/sync',{node:node('NODE-B'),operations:[{id:'EV-D-B',type:'PME_BUDGET_PERSONNEL_MODIFIE',entityId:'D-HARD',institutionId:'INST-DEMO',structureId:'STR-AGENCE-PRINCIPALE',baseVersion:2,targetVersion:3}],snapshot:tampered});j=await r.json();assert.equal(j.accepted,1);central=await pull(analyste);assert.equal(central.snapshot.applications.find(x=>x.id==='D-HARD').requestedAmount,800000,'idempotence sans réapplication');
  // Configuration institutionnelle descend vers les agences.
  const cfg=empty();cfg.creditProducts=[{code:'PME',name:'Crédit PME',status:'ACTIF',policyVersion:'PME-2.0'}];cfg.productPolicyVersions=[{productCode:'PME',version:'PME-2.0',status:'PUBLIÉE'}];cfg.sfdFieldProfiles=[{id:'SFD-X',name:'Profil X',salary:{},pme:{}}];cfg.activeSfdFieldProfileId='SFD-X';cfg.syncConfigVersion=1;
  r=await post(admin,'/api/sync',{node:node('NODE-ADMIN'),operations:[{id:'EV-CFG-1',type:'CONFIG_SFD_FIELD_MODIFIEE',entityId:'CONFIG-INSTITUTION',institutionId:'INST-DEMO',baseVersion:0,targetVersion:1}],snapshot:cfg});j=await r.json();assert.equal(j.accepted,1);central=await pull(agent);assert.equal(central.snapshot.creditProducts[0].policyVersion,'PME-2.0');assert.equal(central.snapshot.activeSfdFieldProfileId,'SFD-X');
  console.log('R19.3.1 BLOCKER HARDENING: PASS — mutations versionnées, données SFD complètes, no-op/replay protégés, conflit humain, LAN et config descendante');
} finally {child.kill('SIGTERM');rmSync(dir,{recursive:true,force:true})}

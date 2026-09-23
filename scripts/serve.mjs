import http from 'node:http';
import {createReadStream,existsSync,statSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {extname,join,normalize,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,pbkdf2Sync,timingSafeEqual,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir,networkInterfaces} from 'node:os';
import {createStore} from './lib/storage.mjs';
import {DEMO_ACCOUNTS,demoPasswordFor} from './lib/demo-accounts.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const db=await createStore();

const demoUsers=DEMO_ACCOUNTS;

function hashPassword(p,s){return pbkdf2Sync(p,s,210000,32,'sha256').toString('hex')}
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'')||'PRINCIPALE';
const structureIdForAgency=agency=>agency==='Agence principale'||!agency?'STR-AGENCE-PRINCIPALE':`STR-${clean(agency)}`;
const zoneIdForAgency=agency=>agency==='Agence principale'||!agency?'ZONE-AGENCE-PRINCIPALE':`ZONE-${clean(agency)}`;
function enrichUser(u){return u?{...u,institutionId:'INST-DEMO',structureId:structureIdForAgency(u.agency),zoneIds:[zoneIdForAgency(u.agency)]}:null}

for(const account of demoUsers){
  const {login,role,name,agency,scopeMode}=account;
  const existing=await db.getUserCredentials(login);
  const forceReset=process.env.CREDIPASS_RESET_DEMO_PASSWORDS==='1';
  const salt=forceReset||!existing?.salt?randomBytes(16).toString('hex'):existing.salt;
  const passwordHash=forceReset||!existing?.password_hash?hashPassword(demoPasswordFor(account),salt):existing.password_hash;
  await db.upsertUser({login,passwordHash,salt,role,name,agency,scopeMode});
  if(forceReset&&existing)await db.setUserCredentials(login,passwordHash,salt);
}
await db.deleteLegacyUsers();

function json(res,status,obj,cookie){
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
    'Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'",
    ...(cookie?{'Set-Cookie':cookie}:{})
  });
  res.end(JSON.stringify(obj));
}
async function body(req,limit=25_000_000){return new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>limit){no(Error('Requête trop volumineuse'));req.destroy()}});req.on('end',()=>{try{ok(b?JSON.parse(b):{})}catch{no(Error('JSON invalide'))}});req.on('error',no)})}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return[v.slice(0,i).trim(),decodeURIComponent(v.slice(i+1))]}))}
async function auth(req){
  const token=cookies(req).credipass_session;
  if(!token)return null;
  const s=await db.getSessionUser(token,Date.now());
  return s?enrichUser({login:s.login,role:s.role,name:s.name,agency:s.agency,scopeMode:s.scope_mode}):null;
}
async function requireAuth(req,res){const u=await auth(req);if(!u)json(res,401,{error:'Session requise'});return u}

const aiBase=String(process.env.CREDIPASS_AI_BASE_URL||'').replace(/\/$/,''),aiKey=String(process.env.CREDIPASS_AI_API_KEY||''),aiModel=String(process.env.CREDIPASS_AI_MODEL||'credipass-local'),aiProvider=String(process.env.CREDIPASS_AI_PROVIDER||'OpenAI-compatible');
function aiConfigured(){return !!aiBase}
function aiContextAllowed(u,c){if(!c?.application)return true;const a=c.application;if((a.institutionId||'INST-DEMO')!==u.institutionId)return false;if(u.scopeMode==='GLOBAL')return true;if((a.structureId||structureIdForAgency(a.agency))!==u.structureId)return false;if(u.scopeMode==='OWN')return a.ownerLogin===u.login||a.assignedAgentLogin===u.login;return true}
function aiSystemPrompt(){return `Tu es CREDIPASS AI COPILOT, copilote d'instruction de microcrédit pour SFD. Tu expliques uniquement les données fournies dans le contexte. Tu distingues clairement faits, calculs, contrôles, incertitudes et données manquantes. Tu peux synthétiser, expliquer INCLUSCORE, confiance, capacité, garanties, politiques et incohérences. Tu ne dois jamais accorder, refuser, recommander d'accepter/refuser un crédit ni inventer une règle institutionnelle. La décision appartient toujours à l'autorité humaine habilitée. Si une information manque, dis-le. Réponds en français clair et concis.`}
async function callAiProvider(question,context){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);try{const headers={'content-type':'application/json'};if(aiKey)headers.authorization=`Bearer ${aiKey}`;const r=await fetch(aiBase+'/chat/completions',{method:'POST',headers,signal:ctl.signal,body:JSON.stringify({model:aiModel,temperature:0.1,messages:[{role:'system',content:aiSystemPrompt()},{role:'user',content:`QUESTION:\n${question}\n\nCONTEXTE CREDIPASS (JSON):\n${JSON.stringify(context)}`}]})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j?.error?.message||j?.error||`IA HTTP ${r.status}`);const answer=String(j?.choices?.[0]?.message?.content||'').trim();if(!answer)throw Error('Réponse IA vide');return answer}finally{clearTimeout(timer)}}

function safePathFromUrl(urlPath){const decoded=decodeURIComponent((urlPath||'/').split('?')[0]),n=normalize(decoded).replace(/^([/\\])+/,'');const c=resolve(join(root,n));return c.startsWith(root)?c:null}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon'};
const APP_COLLECTIONS=['documents','visits','financials','guarantees','decisions','disbursements','payments','restructures','checklists','incomeItems','expenseItems','debts','trustObservations','schedules','scheduleVersions','followups','alertsLog','recommendations','productForms','policyChecks','institutionalRisk','businessAnalyses','personalBudgets','personalBalanceSheets','workflowActions','consents','bicChecks','dataDisputes','dataCorrections','audit'];
const CONFIG_COLLECTIONS=['creditProducts','productPolicyVersions','sfdFieldProfiles','importJobs'];
function idOf(x,k){if(!x)return'';if(x.id)return String(x.id);if(k==='productPolicyVersions')return `${x.productCode||''}:${x.version||''}`;if(k==='creditProducts')return String(x.code||'');return''}
function byKey(list,k){return new Map((Array.isArray(list)?list:[]).map(x=>[idOf(x,k),x]).filter(([id])=>id))}
function appIdOf(x){return String(x?.applicationId||x?.appId||'')}
function writableMember(u,m){return (u.role==='GERANT'||u.role==='ADMIN_SYSTEME')&&(!m?.agency||u.scopeMode==='GLOBAL'||m.agency===u.agency)}
function writableApp(u,a){if(!a)return false;if(u.role==='ADMIN_SYSTEME')return true;if(u.role==='AGENT_CREDIT')return a.agency===u.agency&&(a.ownerLogin===u.login||a.assignedAgentLogin===u.login);if(['ANALYSTE_RESPONSABLE_CREDIT','CONFORMITE','COMITE_CREDIT','CAISSE_COMPTABILITE','SUIVI_RECOUVREMENT'].includes(u.role))return u.scopeMode==='GLOBAL'||a.agency===u.agency;return false}
function opAllowed(u,o,incoming,current){if(!u||!o)return false;const entityId=String(o.entityId||'');if(entityId==='CONFIG-INSTITUTION')return u.role==='ADMIN_SYSTEME';if((o.type||'').startsWith('IMPORT_'))return u.role==='ADMIN_SYSTEME';const institutionId=o.institutionId||o.envelope?.institutionId||'INST-DEMO';if(institutionId!==u.institutionId)return false;const incomingMember=(incoming?.members||[]).find(x=>String(x.id)===entityId),currentMember=(current?.members||[]).find(x=>String(x.id)===entityId);if(incomingMember||currentMember)return writableMember(u,incomingMember||currentMember);const incomingApp=(incoming?.applications||[]).find(x=>String(x.id)===entityId),currentApp=(current?.applications||[]).find(x=>String(x.id)===entityId);if(incomingApp||currentApp)return writableApp(u,incomingApp||currentApp);const sid=o.structureId||o.envelope?.structureId||u.structureId;return u.scopeMode==='GLOBAL'||sid===u.structureId}
function replaceAppAggregate(out,incoming,appId,u){const incomingApp=(incoming.applications||[]).find(x=>String(x.id)===appId),currentApp=(out.applications||[]).find(x=>String(x.id)===appId),target=incomingApp||currentApp;if(!target||!writableApp(u,target))return false;const apps=byKey(out.applications,'applications');if(incomingApp)apps.set(appId,incomingApp);out.applications=[...apps.values()];for(const k of APP_COLLECTIONS){const keep=(out[k]||[]).filter(x=>appIdOf(x)!==appId),replacement=(incoming[k]||[]).filter(x=>appIdOf(x)===appId);out[k]=[...keep,...replacement]}return true}
function mergeState(u,incoming,current,acceptedEntityIds){const out=structuredClone(current||{members:[],applications:[]});out.members??=[];out.applications??=[];for(const entityId of acceptedEntityIds){if(entityId==='CONFIG-INSTITUTION'){if(u.role==='ADMIN_SYSTEME'){for(const k of CONFIG_COLLECTIONS)if(Array.isArray(incoming[k]))out[k]=structuredClone(incoming[k]);if(incoming.activeSfdFieldProfileId)out.activeSfdFieldProfileId=incoming.activeSfdFieldProfileId;if(Number.isFinite(Number(incoming.syncConfigVersion)))out.syncConfigVersion=Number(incoming.syncConfigVersion);if(incoming.organisation)out.organisation=structuredClone(incoming.organisation)}continue}const m=(incoming.members||[]).find(x=>String(x.id)===entityId);if(m){if(writableMember(u,m)){const map=byKey(out.members,'members');map.set(entityId,m);out.members=[...map.values()]}continue}replaceAppAggregate(out,incoming,entityId,u)}return out}
function visibleState(u,state){if(u.scopeMode==='GLOBAL')return state;const members=(state.members||[]).filter(m=>u.scopeMode==='OWN'?(m.agency===u.agency&&m.assignedAgentLogin===u.login):m.agency===u.agency),ids=new Set(members.map(m=>m.id));const apps=(state.applications||[]).filter(a=>ids.has(a.memberId)&&(u.scopeMode!=='OWN'||a.ownerLogin===u.login||a.assignedAgentLogin===u.login)),aids=new Set(apps.map(a=>String(a.id))),out={...state,members,applications:apps};for(const k of APP_COLLECTIONS)out[k]=(state[k]||[]).filter(x=>aids.has(appIdOf(x)));for(const k of CONFIG_COLLECTIONS)out[k]=state[k]||[];return out}
function ocrTsv(image,outBase){execFileSync('tesseract',[image,outBase,'-l','fra+eng','--psm','6','tsv'],{stdio:'ignore',timeout:45000});const rows=readFileSync(outBase+'.tsv','utf8').split(/\r?\n/).slice(1).map(l=>l.split('\t')).filter(c=>c.length>=12),words=rows.filter(c=>Number(c[10])>=0&&c[11]?.trim()),text=words.map(c=>c[11].trim()).join(' '),confidence=words.length?Math.round(words.reduce((s,c)=>s+Number(c[10]),0)/words.length):0;return{text,confidence,wordCount:words.length}}

const server=http.createServer(async(req,res)=>{try{
  const path=(req.url||'').split('?')[0];
  if(path==='/api/health'){
    const pg=await db.ping();
    return json(res,200,{ok:true,service:'CREDIPASS Central R19.3.2',database:{engine:db.kind,connected:true,name:pg?.database||null},terminalStorage:'IndexedDB',aiConfigured:aiConfigured(),aiProvider:aiConfigured()?aiProvider:null,aiModel:aiConfigured()?aiModel:null,syncMode:'AGGREGATE_OPTIMISTIC_VERSIONING',time:new Date().toISOString()});
  }
  if(path==='/api/auth/login'&&req.method==='POST'){
    const b=await body(req),login=String(b.login||''),u=await db.getUser(login);
    if(!u)return json(res,401,{error:'Identifiant ou mot de passe incorrect.'});
    if(Number(u.locked_until)>Date.now())return json(res,423,{error:'Compte temporairement verrouillé.'});
    const got=Buffer.from(hashPassword(String(b.password||''),u.salt),'hex'),exp=Buffer.from(u.password_hash,'hex');
    if(got.length!==exp.length||!timingSafeEqual(got,exp)){
      const n=(Number(u.failed_attempts)||0)+1,lock=n>=5?Date.now()+5*60_000:0;
      await db.updateLoginFailure(login,lock?0:n,lock);
      return json(res,401,{error:'Identifiant ou mot de passe incorrect.'});
    }
    await db.resetLoginFailure(login);
    const token=randomBytes(32).toString('hex'),expires=Date.now()+8*3600_000;
    await db.createSession(token,u.login,expires);
    return json(res,200,{user:enrichUser({login:u.login,role:u.role,name:u.name,agency:u.agency,scopeMode:u.scope_mode})},`credipass_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
  }
  if(path==='/api/auth/me'){const u=await requireAuth(req,res);if(!u)return;return json(res,200,{user:u})}
  if(path==='/api/auth/change-password'&&req.method==='POST'){
    const u=await requireAuth(req,res);if(!u)return;
    const b=await body(req),currentPassword=String(b.currentPassword||''),newPassword=String(b.newPassword||'');
    if(newPassword.length<8)return json(res,400,{error:'Le nouveau mot de passe doit contenir au moins 8 caractères.'});
    if(currentPassword===newPassword)return json(res,400,{error:'Le nouveau mot de passe doit être différent de l’ancien.'});
    const creds=await db.getUserCredentials(u.login);if(!creds)return json(res,404,{error:'Compte utilisateur introuvable.'});
    const got=Buffer.from(hashPassword(currentPassword,creds.salt),'hex'),exp=Buffer.from(creds.password_hash,'hex');
    if(got.length!==exp.length||!timingSafeEqual(got,exp))return json(res,401,{error:'Mot de passe actuel incorrect.'});
    const salt=randomBytes(16).toString('hex'),passwordHash=hashPassword(newPassword,salt);
    await db.setUserCredentials(u.login,passwordHash,salt);
    const token=cookies(req).credipass_session||'';if(db.deleteSessionsForUser)await db.deleteSessionsForUser(u.login,token);
    return json(res,200,{ok:true,user:u});
  }
  if(path==='/api/auth/logout'&&req.method==='POST'){const t=cookies(req).credipass_session;if(t)await db.deleteSession(t);return json(res,200,{ok:true},'credipass_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')}
  if(path==='/api/sync'&&req.method==='POST'){
    const u=await requireAuth(req,res);if(!u)return;
    const b=await body(req),incoming=b.snapshot||{},ops=Array.isArray(b.operations)?b.operations:[];
    const result=await db.withTransaction(async tx=>{
      const cur=await tx.readState({forUpdate:true}),acceptedIds=[],acceptedEntities=new Set(),conflicts=[];
      if(b.node?.id)await tx.upsertNode(String(b.node.id),u.login,String(b.node.institutionId||u.institutionId),String(b.node.structureId||u.structureId));
      for(const o of ops){
        const eventId=String(o.id||randomUUID()),entityId=String(o.entityId||''),created=String(o.createdAt||new Date().toISOString());
        if(!entityId){conflicts.push({eventId,entityId,type:'ENTITY_REQUIRED',resolution:'HUMAINE_REQUISE'});continue}
        if(!opAllowed(u,o,incoming,cur.state)){conflicts.push({eventId,entityId,type:'SCOPE_REJECTED',resolution:'HUMAINE_REQUISE'});continue}
        const prior=await tx.getSyncEvent(eventId);if(prior){acceptedIds.push(eventId);continue}
        const vr=await tx.getEntityVersion(entityId,{forUpdate:true}),centralVersion=Number(vr?.version||0),hasExplicit=Number.isFinite(Number(o.baseVersion)),baseVersion=hasExplicit?Number(o.baseVersion):centralVersion,targetVersion=Number.isFinite(Number(o.targetVersion))?Number(o.targetVersion):baseVersion+1;
        if(!hasExplicit||baseVersion!==centralVersion){
          const cid=randomUUID();await tx.insertConflict({id:cid,eventId,entityId,login:u.login,baseVersion,centralVersion});
          conflicts.push({id:cid,eventId,entityId,type:'VERSION_CONFLICT',baseVersion,centralVersion,resolution:'HUMAINE_REQUISE'});continue;
        }
        await tx.insertSyncEvent({id:eventId,login:u.login,eventType:String(o.type||''),entityId,detail:{...o.detail,envelope:o.envelope,nodeId:o.nodeId},createdAt:created});
        await tx.upsertEntityVersion(entityId,Math.max(targetVersion,centralVersion+1),u.login);
        acceptedIds.push(eventId);acceptedEntities.add(entityId);
      }
      const merged=acceptedEntities.size?mergeState(u,incoming,cur.state,acceptedEntities):cur.state,version=cur.version+(acceptedEntities.size?1:0);
      if(acceptedEntities.size)await tx.saveState(merged,version,u.login);
      return {ok:true,accepted:acceptedIds.length,acceptedIds,acceptedEntities:[...acceptedEntities],conflicts,version,serverTime:new Date().toISOString()};
    });
    return json(res,200,result);
  }
  if(path==='/api/sync/pull'){const u=await requireAuth(req,res);if(!u)return;const cur=await db.readState();return json(res,200,{snapshot:visibleState(u,cur.state),version:cur.version})}
  if(path==='/api/sync/conflicts'){const u=await requireAuth(req,res);if(!u)return;return json(res,200,{conflicts:await db.listOpenConflicts(u.login)})}
  if(path==='/api/sync/resolve'&&req.method==='POST'){
    const u=await requireAuth(req,res);if(!u)return;const b=await body(req),eventId=String(b.eventId||''),resolution=String(b.resolution||'');
    if(!['KEEP_CENTRAL','REBASE_LOCAL'].includes(resolution))return json(res,400,{error:'Résolution invalide'});
    const c=await db.getOpenConflict(eventId,u.login);if(!c)return json(res,404,{error:'Conflit ouvert introuvable'});
    const latest=await db.getEntityVersion(c.entity_id),centralVersion=Number(latest?.version||c.central_version||0);await db.resolveConflict(c.id,resolution);
    return json(res,200,{ok:true,eventId,entityId:c.entity_id,resolution,centralVersion,nextBaseVersion:centralVersion,nextTargetVersion:centralVersion+1});
  }
  if(path==='/api/nodes'){const u=await requireAuth(req,res);if(!u)return;if(!['ADMIN_SYSTEME','DIRECTION','AUDITEUR'].includes(u.role))return json(res,403,{error:'Permission insuffisante'});return json(res,200,{nodes:await db.listNodes()})}
  if(path==='/api/ai/copilot'&&req.method==='POST'){
    const u=await requireAuth(req,res);if(!u)return;const b=await body(req,2_000_000),question=String(b.question||'').trim(),context=b.context||null;
    if(!question)return json(res,400,{error:'Question obligatoire'});if(!aiContextAllowed(u,context))return json(res,403,{error:'Contexte dossier hors périmètre autorisé'});if(!aiConfigured())return json(res,503,{error:'Fournisseur IA non configuré; utiliser le mode local hors connexion.',mode:'ASSISTANT_LOCAL'});
    try{const answer=await callAiProvider(question,context);await db.insertAiAudit({id:randomUUID(),login:u.login,dossierId:String(context?.application?.id||''),mode:'IA_CONNECTEE',provider:aiProvider,question:question.slice(0,500)});return json(res,200,{ok:true,answer,mode:'IA_CONNECTEE',provider:aiProvider,model:aiModel,decisionAuthority:'HUMAINE'})}catch(e){return json(res,502,{error:`IA indisponible : ${e.message}`,mode:'ASSISTANT_LOCAL'})}
  }
  if(path==='/api/ai/selftest'&&req.method==='POST'){const u=await requireAuth(req,res);if(!u)return;if(u.role!=='ADMIN_SYSTEME')return json(res,403,{error:'Administrateur Système requis'});if(!aiConfigured())return json(res,503,{ok:false,error:'Fournisseur IA non configuré'});try{const answer=await callAiProvider('Réponds uniquement: CREDIPASS_AI_OK',{application:null,test:true});return json(res,200,{ok:true,provider:aiProvider,model:aiModel,answer})}catch(e){return json(res,502,{ok:false,error:e.message})}}
  if(path==='/api/ocr'&&req.method==='POST'){
    const u=await requireAuth(req,res);if(!u)return;const b=await body(req,40_000_000);if(!b.dataBase64)return json(res,400,{error:'Fichier manquant'});
    const id=randomUUID(),safe=basename(String(b.name||'document')).replace(/[^a-zA-Z0-9._-]/g,'_'),dir=join(tmpdir(),`credipass-ocr-${id}`);mkdirSync(dir,{recursive:true});const input=join(dir,safe);writeFileSync(input,Buffer.from(b.dataBase64,'base64'));let image=input;
    try{if((b.mime||'').includes('pdf')||safe.toLowerCase().endsWith('.pdf')){execFileSync('pdftoppm',['-f','1','-singlefile','-png','-r','200',input,join(dir,'page')],{stdio:'ignore',timeout:30000});image=join(dir,'page.png')}const out=join(dir,'ocr'),r=ocrTsv(image,out);await db.insertOcrAudit({id,login:u.login,filename:safe,engine:'Tesseract 5 TSV',confidence:r.confidence});rmSync(dir,{recursive:true,force:true});return json(res,200,{ok:true,...r,engine:'Tesseract 5',confidenceSource:'Tesseract TSV — moyenne des mots reconnus',status:'À VALIDER',notice:'Le texte OCR est une proposition. Aucune donnée métier n’est modifiée automatiquement.'})}catch(e){rmSync(dir,{recursive:true,force:true});const msg=String(e?.message||e||'');if(/pdftoppm.*ENOENT|spawnSync pdftoppm ENOENT/i.test(msg))return json(res,424,{error:'OCR PDF indisponible : le composant Poppler (pdftoppm) n’est pas installé sur ce PC. Utilisez une image JPG/PNG pour la démo ou installez Poppler après le hackathon.',code:'PDFTOPPM_MISSING'});if(/tesseract.*ENOENT|spawnSync tesseract ENOENT/i.test(msg))return json(res,424,{error:'OCR indisponible : Tesseract n’est pas installé ou absent du PATH Windows.',code:'TESSERACT_MISSING'});return json(res,500,{error:`OCR impossible : ${msg}`})}
  }
  let filePath=safePathFromUrl(req.url);if(!filePath)return res.writeHead(403).end('Accès refusé');if(existsSync(filePath)&&statSync(filePath).isDirectory())filePath=join(filePath,'index.html');if(!existsSync(filePath)||!statSync(filePath).isFile())filePath=join(root,'index.html');const ext=extname(filePath).toLowerCase();res.writeHead(200,{'Content-Type':mime[ext]??'application/octet-stream','Cache-Control':ext==='.html'||ext==='.js'||ext==='.css'?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'});createReadStream(filePath).pipe(res);
}catch(e){json(res,500,{error:e.message||String(e)})}});

const port=Number(process.argv[2]??process.env.PORT??8080),host=String(process.env.CREDIPASS_HOST||'127.0.0.1').trim();
server.listen(port,host,()=>{console.log(`CREDIPASS R19.3.2 — écoute ${host}:${port} — IndexedDB terminaux + PostgreSQL central + sync versionnée + AI Copilot + auth + OCR`);if(host==='0.0.0.0'||host==='::'){const ips=[];for(const xs of Object.values(networkInterfaces()))for(const x of xs||[])if(x.family==='IPv4'&&!x.internal)ips.push(`http://${x.address}:${port}`);if(ips.length)console.log(`Accès LAN : ${ips.join(' | ')}`)}});

async function shutdown(){try{await db.close()}finally{server.close(()=>process.exit(0))}}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);

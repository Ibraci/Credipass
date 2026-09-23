export const DEFAULT_INSTITUTION={id:'INST-DEMO',name:'Institution de microfinance',level:'INSTITUTION'};
export const DEFAULT_STRUCTURE={id:'STR-AGENCE-PRINCIPALE',name:'Agence principale',type:'AGENCE',parentId:DEFAULT_INSTITUTION.id};
export const DEFAULT_ZONE={id:'ZONE-AGENCE-PRINCIPALE',name:'Zone Agence principale',type:'ZONE',structureId:DEFAULT_STRUCTURE.id};
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'')||'PRINCIPALE';
export const structureIdForAgency=agency=>agency==='Agence principale'||!agency?DEFAULT_STRUCTURE.id:`STR-${clean(agency)}`;
export const zoneIdForAgency=agency=>agency==='Agence principale'||!agency?DEFAULT_ZONE.id:`ZONE-${clean(agency)}`;
function agencyName(entity){return entity?.agency||entity?.structureName||DEFAULT_STRUCTURE.name}
function ensureOrganisation(db){
 db.organisation??={}; db.organisation.institutions??=[DEFAULT_INSTITUTION]; db.organisation.structures??=[]; db.organisation.zones??=[]; db.organisation.nodes??=[];
 if(!db.organisation.institutions.some(x=>x.id===DEFAULT_INSTITUTION.id))db.organisation.institutions.unshift(DEFAULT_INSTITUTION);
 const agencies=new Set([DEFAULT_STRUCTURE.name]);
 for(const x of [...(db.members||[]),...(db.applications||[])])agencies.add(agencyName(x));
 for(const s of db.organisation.structures||[])if(s?.name)agencies.add(s.name);
 for(const agency of agencies){
   const sid=structureIdForAgency(agency),zid=zoneIdForAgency(agency);
   if(!db.organisation.structures.some(x=>x.id===sid))db.organisation.structures.push({id:sid,name:agency,type:'AGENCE',parentId:DEFAULT_INSTITUTION.id});
   if(!db.organisation.zones.some(x=>x.id===zid))db.organisation.zones.push({id:zid,name:`Zone ${agency}`,type:'ZONE',structureId:sid});
   const nid=`NODE-${clean(agency)}`; if(!db.organisation.nodes.some(x=>x.id===nid))db.organisation.nodes.push({id:nid,type:'AGENCE',structureId:sid,status:'ACTIF'});
 }
 return db.organisation;
}
export function normalizeTerritory(db){
 ensureOrganisation(db);
 for(const u of db.users||[])normalizeUser(u);
 for(const m of db.members||[]){const agency=agencyName(m);tag(m,{institutionId:DEFAULT_INSTITUTION.id,structureId:structureIdForAgency(agency),structureName:agency,agencyId:structureIdForAgency(agency),zoneId:zoneIdForAgency(agency)});}
 for(const a of db.applications||[]){const m=(db.members||[]).find(x=>x.id===a.memberId),agency=agencyName(a)||agencyName(m);tag(a,{institutionId:m?.institutionId||DEFAULT_INSTITUTION.id,structureId:m?.structureId||structureIdForAgency(agency),structureName:m?.structureName||agency,agencyId:m?.agencyId||structureIdForAgency(agency),zoneId:m?.zoneId||zoneIdForAgency(agency)});}
 for(const collection of ['documents','visits','financials','guarantees','decisions','disbursements','payments','restructures','checklists','incomeItems','expenseItems','debts','trustObservations','schedules','scheduleVersions','followups','alertsLog','recommendations','productForms','policyChecks','institutionalRisk','businessAnalyses','personalBudgets','personalBalanceSheets','workflowActions','consents','bicChecks','dataDisputes','dataCorrections','audit'])for(const x of db[collection]||[]){const a=(db.applications||[]).find(v=>v.id===(x.applicationId||x.appId));if(!a)continue;tag(x,{institutionId:a.institutionId,structureId:a.structureId,structureName:a.structureName,agencyId:a.agencyId,zoneId:a.zoneId,ownerUserId:a.ownerLogin||a.assignedAgentLogin||null});}
 return db;
}
function tag(x,v){for(const [k,val] of Object.entries(v))if(x[k]==null)x[k]=val;return x}
export function normalizeUser(u){const agency=u.agency||u.structureName||DEFAULT_STRUCTURE.name;u.institutionId??=DEFAULT_INSTITUTION.id;u.structureId??=structureIdForAgency(agency);u.structureName??=agency;u.zoneIds??=[zoneIdForAgency(agency)];u.zoneNames??=[`Zone ${agency}`];u.scopeMode??='AGENCY';u.scopeAgencies??=u.scopeMode==='GLOBAL'?[]:[agency];u.status??='ACTIF';return u}
export function territorialAccess(user,entity){
 if(!user||!entity)return false;normalizeUser(user);const institutionId=entity.institutionId||DEFAULT_INSTITUTION.id,agency=agencyName(entity),structureId=entity.structureId||structureIdForAgency(agency),zoneId=entity.zoneId||zoneIdForAgency(agency);
 if(institutionId!==user.institutionId)return false;
 if(user.scopeMode==='GLOBAL')return true;
 const agencyAllowed=(user.scopeAgencies||[]).includes(agency)||structureId===user.structureId;
 const zoneAllowed=!(user.zoneIds||[]).length||(user.zoneIds||[]).includes(zoneId);
 if(user.scopeMode==='OWN')return agencyAllowed&&zoneAllowed&&(entity.ownerLogin===user.login||entity.assignedAgentLogin===user.login);
 return agencyAllowed&&zoneAllowed;
}
function uid(){const c=globalThis.crypto;return c?.randomUUID?.()||`EVT-${Date.now()}-${Math.floor(Math.random()*1e9)}`}
export function createSyncEnvelope(entity,actor,nodeId='NODE-LOCAL'){const baseVersion=Number(entity?.syncVersion||entity?.version||0);return {eventId:uid(),entityId:entity?.id,entityType:entity?.type||'ENTITY',institutionId:entity?.institutionId||DEFAULT_INSTITUTION.id,structureId:entity?.structureId||structureIdForAgency(agencyName(entity)),zoneId:entity?.zoneId||zoneIdForAgency(agencyName(entity)),nodeId,baseVersion,targetVersion:baseVersion+1,at:new Date().toISOString(),actor:String(actor||'SYSTEM')};}
export function detectConflict(local,remote){if(!local||!remote||local.id!==remote.id)return null;const lv=Number(local.syncVersion??local.version??0),rv=Number(remote.syncVersion??remote.version??0);if(lv<rv)return {type:'REMOTE_AHEAD',entityId:local.id,localVersion:lv,remoteVersion:rv,resolution:'HUMAINE_REQUISE'};if(lv===rv&&JSON.stringify(local)!==JSON.stringify(remote))return {type:'CONCURRENT_MODIFICATION',entityId:local.id,local,remote,resolution:'HUMAINE_REQUISE'};return null}
export function nodeHealth(db,operations=[]){normalizeTerritory(db);const ops=Array.isArray(operations)?operations:[];const nodes=new Map((db.organisation.nodes||[]).map(n=>[n.id,{...n}]));for(const o of ops){const id=o.nodeId||o.envelope?.nodeId;if(id&&!nodes.has(id))nodes.set(id,{id,type:'TERMINAL',structureId:o.structureId||o.envelope?.structureId||null,status:'ACTIF'});}return [...nodes.values()].map(n=>{const own=ops.filter(x=>(x.nodeId||x.envelope?.nodeId)===n.id&&x.status!=='SYNCHRONISE');return {...n,pending:own.length,lastPendingAt:own.map(x=>x.createdAt||x.envelope?.at).filter(Boolean).sort().at(-1)||null};});}

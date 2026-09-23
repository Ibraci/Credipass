import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const schemaPath=resolve(root,'db/postgresql/001_init.sql');
const nowIso=()=>new Date().toISOString();

function jsonValue(v){
  if(v==null)return null;
  if(typeof v==='string'){try{return JSON.parse(v)}catch{return v}}
  return v;
}

export async function createStore(){
  const testMode=process.env.CREDIPASS_TEST_MODE==='1'||process.env.NODE_ENV==='test';
  if(testMode)return createMemoryStore();
  const url=String(process.env.CREDIPASS_DATABASE_URL||process.env.DATABASE_URL||'').trim();
  if(!url)throw new Error('PostgreSQL non configuré. Définissez CREDIPASS_DATABASE_URL (ex: postgresql://credipass:motdepasse@127.0.0.1:5432/credipass).');
  let postgres;
  try{({default:postgres}=await import('postgres'))}
  catch{throw new Error('Le pilote PostgreSQL "postgres" est absent. Exécutez: npm install');}
  const sslMode=String(process.env.CREDIPASS_PG_SSL||'disable').toLowerCase();
  const ssl=sslMode==='require'?'require':sslMode==='prefer'?'prefer':false;
  const sql=postgres(url,{max:Number(process.env.CREDIPASS_PG_POOL||10),idle_timeout:20,connect_timeout:10,ssl});
  const store=createPostgresStore(sql);
  await store.init();
  return store;
}

function createPostgresStore(sql){
  const q=(text,params=[])=>sql.unsafe(text,params);
  const one=async(text,params=[])=>{const rows=await q(text,params);return rows[0]??null};
  const exec=async(text,params=[])=>{const rows=await q(text,params);return rows};
  const api={
    kind:'POSTGRESQL',
    async init(){
      await q('SELECT 1 AS ok');
      const ddl=await readFile(schemaPath,'utf8');
      for(const stmt of ddl.split(';').map(x=>x.trim()).filter(Boolean))await q(stmt);
      await q(`INSERT INTO institution_state(id,state_json,version,updated_at,updated_by) VALUES(1,'{\"members\":[],\"applications\":[]}'::jsonb,0,NOW(),'SYSTEM_INIT') ON CONFLICT(id) DO NOTHING`);
    },
    async close(){await sql.end({timeout:5})},
    async ping(){const r=await one('SELECT current_database() AS database, current_user AS user, version() AS version');return r},
    async withTransaction(fn){return sql.begin(async tx=>fn(createPostgresStore(tx)))},
    async getUser(login){return one('SELECT * FROM users WHERE login=$1',[login])},
    async getUserCredentials(login){return one('SELECT salt,password_hash FROM users WHERE login=$1',[login])},
    async setUserCredentials(login,passwordHash,salt){await exec('UPDATE users SET password_hash=$1,salt=$2,failed_attempts=0,locked_until=0 WHERE login=$3',[passwordHash,salt,login])},
    async upsertUser({login,passwordHash,salt,role,name,agency,scopeMode}){await exec(`INSERT INTO users(login,password_hash,salt,role,name,agency,scope_mode) VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(login) DO UPDATE SET role=EXCLUDED.role,name=EXCLUDED.name,agency=EXCLUDED.agency,scope_mode=EXCLUDED.scope_mode`,[login,passwordHash,salt,role,name,agency,scopeMode])},
    async deleteLegacyUsers(){await exec("DELETE FROM users WHERE login IN ('responsable.credit','admin')")},
    async updateLoginFailure(login,failedAttempts,lockedUntil){await exec('UPDATE users SET failed_attempts=$1,locked_until=$2 WHERE login=$3',[failedAttempts,lockedUntil,login])},
    async resetLoginFailure(login){await exec('UPDATE users SET failed_attempts=0,locked_until=0 WHERE login=$1',[login])},
    async createSession(token,login,expiresAt){await exec('INSERT INTO sessions(token,login,expires_at) VALUES($1,$2,$3) ON CONFLICT(token) DO UPDATE SET login=EXCLUDED.login,expires_at=EXCLUDED.expires_at',[token,login,expiresAt])},
    async deleteSession(token){await exec('DELETE FROM sessions WHERE token=$1',[token])},
    async getSessionUser(token,now){return one('SELECT s.login,u.role,u.name,u.agency,u.scope_mode FROM sessions s JOIN users u ON u.login=s.login WHERE s.token=$1 AND s.expires_at>$2',[token,now])},
    async readState({forUpdate=false}={}){const r=await one(`SELECT state_json,version,updated_at,updated_by FROM institution_state WHERE id=1${forUpdate?' FOR UPDATE':''}`);return r?{state:jsonValue(r.state_json),version:Number(r.version||0),updatedAt:r.updated_at,updatedBy:r.updated_by}:{state:{members:[],applications:[]},version:0}},
    async saveState(state,version,updatedBy){await exec(`INSERT INTO institution_state(id,state_json,version,updated_at,updated_by) VALUES(1,$1::jsonb,$2,$3,$4)
      ON CONFLICT(id) DO UPDATE SET state_json=EXCLUDED.state_json,version=EXCLUDED.version,updated_at=EXCLUDED.updated_at,updated_by=EXCLUDED.updated_by`,[JSON.stringify(state),version,nowIso(),updatedBy])},
    async upsertNode(nodeId,login,institutionId,structureId){await exec(`INSERT INTO node_registry(node_id,login,institution_id,structure_id,last_seen_at,status) VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(node_id) DO UPDATE SET login=EXCLUDED.login,institution_id=EXCLUDED.institution_id,structure_id=EXCLUDED.structure_id,last_seen_at=EXCLUDED.last_seen_at,status=EXCLUDED.status`,[nodeId,login,institutionId,structureId,nowIso(),'ACTIF'])},
    async getSyncEvent(id){return one('SELECT id FROM sync_events WHERE id=$1',[id])},
    async getEntityVersion(entityId,{forUpdate=false}={}){return one(`SELECT version FROM sync_entity_versions WHERE entity_id=$1${forUpdate?' FOR UPDATE':''}`,[entityId])},
    async insertConflict({id,eventId,entityId,login,baseVersion,centralVersion}){await exec('INSERT INTO sync_conflicts(id,event_id,entity_id,login,base_version,central_version,created_at,resolution) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,eventId,entityId,login,baseVersion,centralVersion,nowIso(),'HUMAINE_REQUISE'])},
    async insertSyncEvent({id,login,eventType,entityId,detail,createdAt}){await exec('INSERT INTO sync_events(id,login,event_type,entity_id,detail_json,created_at) VALUES($1,$2,$3,$4,$5::jsonb,$6)',[id,login,eventType,entityId,JSON.stringify(detail??{}),createdAt])},
    async upsertEntityVersion(entityId,version,login){await exec(`INSERT INTO sync_entity_versions(entity_id,version,updated_at,updated_by) VALUES($1,$2,$3,$4)
      ON CONFLICT(entity_id) DO UPDATE SET version=EXCLUDED.version,updated_at=EXCLUDED.updated_at,updated_by=EXCLUDED.updated_by`,[entityId,version,nowIso(),login])},
    async listOpenConflicts(login){return q("SELECT id,event_id,entity_id,base_version,central_version,created_at,resolution FROM sync_conflicts WHERE login=$1 AND resolution='HUMAINE_REQUISE' ORDER BY created_at DESC",[login])},
    async getOpenConflict(eventId,login){return one("SELECT * FROM sync_conflicts WHERE event_id=$1 AND login=$2 AND resolution='HUMAINE_REQUISE' ORDER BY created_at DESC LIMIT 1",[eventId,login])},
    async resolveConflict(id,resolution){await exec('UPDATE sync_conflicts SET resolution=$1 WHERE id=$2',[resolution,id])},
    async listNodes(){return q('SELECT node_id,login,institution_id,structure_id,last_seen_at,status FROM node_registry ORDER BY last_seen_at DESC')},
    async insertAiAudit({id,login,dossierId,mode,provider,question}){await exec('INSERT INTO ai_audit(id,login,dossier_id,mode,provider,question,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,login,dossierId,mode,provider,question,nowIso()])},
    async insertOcrAudit({id,login,filename,engine,confidence}){await exec('INSERT INTO ocr_audit(id,login,filename,engine,confidence,created_at) VALUES($1,$2,$3,$4,$5,$6)',[id,login,filename,engine,confidence,nowIso()])}
  };
  return api;
}

function createMemoryStore(){
  const users=new Map(),sessions=new Map(),syncEvents=new Map(),entityVersions=new Map(),conflicts=[],nodes=new Map(),aiAudit=[],ocrAudit=[];
  let central={state:{members:[],applications:[]},version:0,updatedAt:null,updatedBy:null};
  const api={
    kind:'MEMORY_TEST',
    async init(){},async close(){},async ping(){return{database:'memory-test',user:'test',version:'memory'}},
    async withTransaction(fn){return fn(api)},
    async getUser(login){return users.get(login)||null},async getUserCredentials(login){const u=users.get(login);return u?{salt:u.salt,password_hash:u.password_hash}:null},
    async setUserCredentials(login,passwordHash,salt){const u=users.get(login);if(u){u.password_hash=passwordHash;u.salt=salt;u.failed_attempts=0;u.locked_until=0}},
    async upsertUser({login,passwordHash,salt,role,name,agency,scopeMode}){const old=users.get(login);users.set(login,{login,password_hash:old?.password_hash||passwordHash,salt:old?.salt||salt,role,name,agency,scope_mode:scopeMode,failed_attempts:old?.failed_attempts||0,locked_until:old?.locked_until||0})},
    async deleteLegacyUsers(){users.delete('responsable.credit');users.delete('admin')},
    async updateLoginFailure(login,failedAttempts,lockedUntil){const u=users.get(login);if(u){u.failed_attempts=failedAttempts;u.locked_until=lockedUntil}},
    async resetLoginFailure(login){const u=users.get(login);if(u){u.failed_attempts=0;u.locked_until=0}},
    async createSession(token,login,expiresAt){sessions.set(token,{login,expiresAt})},async deleteSession(token){sessions.delete(token)},
    async getSessionUser(token,now){const s=sessions.get(token);if(!s||s.expiresAt<=now)return null;const u=users.get(s.login);return u?{login:u.login,role:u.role,name:u.name,agency:u.agency,scope_mode:u.scope_mode}:null},
    async readState(){return structuredClone(central)},async saveState(state,version,updatedBy){central={state:structuredClone(state),version,updatedAt:nowIso(),updatedBy}},
    async upsertNode(nodeId,login,institutionId,structureId){nodes.set(nodeId,{node_id:nodeId,login,institution_id:institutionId,structure_id:structureId,last_seen_at:nowIso(),status:'ACTIF'})},
    async getSyncEvent(id){return syncEvents.has(id)?{id}:null},async getEntityVersion(entityId){return entityVersions.has(entityId)?{version:entityVersions.get(entityId).version}:null},
    async insertConflict({id,eventId,entityId,login,baseVersion,centralVersion}){conflicts.push({id,event_id:eventId,entity_id:entityId,login,base_version:baseVersion,central_version:centralVersion,created_at:nowIso(),resolution:'HUMAINE_REQUISE'})},
    async insertSyncEvent({id,login,eventType,entityId,detail,createdAt}){syncEvents.set(id,{id,login,event_type:eventType,entity_id:entityId,detail_json:detail,created_at:createdAt})},
    async upsertEntityVersion(entityId,version,login){entityVersions.set(entityId,{version,updated_at:nowIso(),updated_by:login})},
    async listOpenConflicts(login){return conflicts.filter(x=>x.login===login&&x.resolution==='HUMAINE_REQUISE').sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))},
    async getOpenConflict(eventId,login){return conflicts.filter(x=>x.event_id===eventId&&x.login===login&&x.resolution==='HUMAINE_REQUISE').at(-1)||null},
    async resolveConflict(id,resolution){const c=conflicts.find(x=>x.id===id);if(c)c.resolution=resolution},
    async listNodes(){return [...nodes.values()].sort((a,b)=>String(b.last_seen_at).localeCompare(String(a.last_seen_at)))},
    async insertAiAudit(x){aiAudit.push({...x,createdAt:nowIso()})},async insertOcrAudit(x){ocrAudit.push({...x,createdAt:nowIso()})}
  };
  return api;
}

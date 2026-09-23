import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {loadLocalEnv} from './lib/env-loader.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));loadLocalEnv(root);
const {createStore}=await import('./lib/storage.mjs');
const db=await createStore();
try{
  const seed=JSON.parse(await readFile(resolve(root,'db/seed/central-demo-state.json'),'utf8'));
  const cur=await db.readState();
  const hasData=Number(cur.version)>0||(cur.state?.members?.length||0)>0||(cur.state?.applications?.length||0)>0;
  if(hasData&&process.env.CREDIPASS_FORCE_SEED!=='1'){
    console.log('SEED POSTGRESQL: SKIP — la base centrale contient déjà des données. Utilisez CREDIPASS_FORCE_SEED=1 uniquement si vous voulez explicitement les remplacer.');
    process.exit(0);
  }
  await db.saveState(seed.state||{members:[],applications:[]},Number(seed.version||0),String(seed.updatedBy||'seed-r19.3.2'));
  console.log(`SEED POSTGRESQL: PASS — version ${Number(seed.version||0)}`);
}finally{await db.close()}

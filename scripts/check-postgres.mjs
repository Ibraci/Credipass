import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {loadLocalEnv} from './lib/env-loader.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));loadLocalEnv(root);
try{
  const {createStore}=await import('./lib/storage.mjs');
  const db=await createStore();
  if(db.kind!=='POSTGRESQL')throw new Error(`Moteur inattendu: ${db.kind}`);
  const info=await db.ping();
  console.log('POSTGRESQL CENTRAL: PASS');
  console.log(`Base : ${info?.database||'inconnue'}`);
  console.log(`Utilisateur : ${info?.user||'inconnu'}`);
  await db.close();
}catch(e){console.error('POSTGRESQL CENTRAL: FAIL');console.error(e.message||e);process.exit(1)}

import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import {loadLocalEnv} from './lib/env-loader.mjs';
import {DEMO_ACCOUNTS,demoPasswordFor} from './lib/demo-accounts.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));loadLocalEnv(root);
const {createStore}=await import('./lib/storage.mjs');
const db=await createStore();
const hashPassword=(p,s)=>pbkdf2Sync(p,s,210000,32,'sha256').toString('hex');
try{
  for(const account of DEMO_ACCOUNTS){
    const password=demoPasswordFor(account,{allowCommon:false});
    const salt=randomBytes(16).toString('hex');
    const passwordHash=hashPassword(password,salt);
    await db.upsertUser({login:account.login,passwordHash,salt,role:account.role,name:account.name,agency:account.agency,scopeMode:account.scopeMode});
    await db.setUserCredentials(account.login,passwordHash,salt);
    console.log(`[OK] ${account.login} — ${account.name}`);
  }
  await db.deleteLegacyUsers();
  console.log('COMPTES DEMO CREDIPASS: PASS — 10 comptes créés/réinitialisés avec les mots de passe R19.3.2 Accounts Ready.');
}finally{await db.close()}

const DB_NAME='credipass-r17';
const DB_VERSION=1;
const STATE_STORE='state';
const DOC_STORE='documents';
const STATE_KEY='credit-ledger';
export const hasIndexedDb=()=>typeof indexedDB!=='undefined';
function openDb(){return new Promise((resolve,reject)=>{if(!hasIndexedDb())return resolve(null);const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STATE_STORE))db.createObjectStore(STATE_STORE);if(!db.objectStoreNames.contains(DOC_STORE))db.createObjectStore(DOC_STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
export async function readState(){const db=await openDb();if(!db)return null;return new Promise((resolve,reject)=>{const tx=db.transaction(STATE_STORE,'readonly'),r=tx.objectStore(STATE_STORE).get(STATE_KEY);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
export async function writeState(value){const db=await openDb();if(!db)return false;return new Promise((resolve,reject)=>{const tx=db.transaction(STATE_STORE,'readwrite');tx.objectStore(STATE_STORE).put(structuredClone(value),STATE_KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export async function putDocument(record){const db=await openDb();if(!db)throw Error('IndexedDB indisponible');return new Promise((resolve,reject)=>{const tx=db.transaction(DOC_STORE,'readwrite');tx.objectStore(DOC_STORE).put(record);tx.oncomplete=()=>resolve(record);tx.onerror=()=>reject(tx.error)})}
export async function getDocument(id){const db=await openDb();if(!db)return null;return new Promise((resolve,reject)=>{const tx=db.transaction(DOC_STORE,'readonly'),r=tx.objectStore(DOC_STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
export async function deleteDocument(id){const db=await openDb();if(!db)return false;return new Promise((resolve,reject)=>{const tx=db.transaction(DOC_STORE,'readwrite');tx.objectStore(DOC_STORE).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export async function documentCount(){const db=await openDb();if(!db)return 0;return new Promise((resolve,reject)=>{const tx=db.transaction(DOC_STORE,'readonly'),r=tx.objectStore(DOC_STORE).count();r.onsuccess=()=>resolve(r.result||0);r.onerror=()=>reject(r.error)})}

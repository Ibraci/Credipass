import {putDocument,getDocument} from './dataRepository.js';
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function sha256(file){if(!globalThis.crypto?.subtle)return 'NON-DISPONIBLE';return hex(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))}
export async function storePdf(file,{applicationId,documentId,type='Autre',source='Document scanné'}={}){if(!file||file.type!=='application/pdf')throw Error('Seuls les documents PDF sont acceptés dans cette version.');const hash=await sha256(file);const record={id:documentId,applicationId,name:file.name,type,source,mime:file.type,size:file.size,sha256:hash,blob:file,storedAt:new Date().toISOString()};await putDocument(record);return {...record,blob:undefined}}
export async function openStoredPdf(documentId){const r=await getDocument(documentId);if(!r?.blob)throw Error('Fichier PDF introuvable dans la base locale.');return URL.createObjectURL(r.blob)}

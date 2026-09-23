import { PRIVACY_POLICIES } from '../config/privacyPolicies.js';
const ENGINE_VERSION='3.2.0';
const clone=x=>JSON.parse(JSON.stringify(x));
const stableHash=input=>{const text=JSON.stringify(input);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return `CPV-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;};
const addDays=(iso,days)=>{const d=new Date(iso);d.setUTCDate(d.getUTCDate()+Number(days||0));return d.toISOString();};
function decorateAsset(asset,policy,asOf){
  const retentionDays=Number(policy.retentionDays[asset.category]||365);
  const retentionUntil=asset.retentionUntil||addDays(asset.createdAt,retentionDays);
  const reviewAt=addDays(retentionUntil,-Number(policy.retentionReviewLeadDays||30));
  const now=new Date(asOf).getTime();
  const status=asset.status||'active';
  return {...clone(asset),status,integrityRef:asset.integrityRef||stableHash({id:asset.id,subjectId:asset.subjectId,category:asset.category,type:asset.type,createdAt:asset.createdAt,metadata:asset.metadata}),retention:{days:retentionDays,reviewAt,retentionUntil,reviewDue:now>=new Date(reviewAt).getTime()},encryption:{prototypeAtRestEncrypted:false,productionEncryptionRequired:true,keyManagementRequired:true}};
}
function summary(assets){return {total:assets.length,active:assets.filter(x=>x.status==='active').length,archived:assets.filter(x=>x.status==='archived').length,deletionRequested:assets.filter(x=>x.status==='deletion-requested').length,retentionReviewDue:assets.filter(x=>x.retention.reviewDue&&x.status==='active').length,rawDocumentsEmbedded:assets.filter(x=>x.rawDocumentEmbedded).length};}
export function createDigitalVault(seed,{policyId='balanced',asOf=seed?.asOf||'2026-08-07T10:20:00.000Z'}={}){
  const policy=PRIVACY_POLICIES[policyId]||PRIVACY_POLICIES.balanced;
  const assets=(seed?.assets||[]).map(x=>decorateAsset(x,policy,asOf));
  return {engineVersion:ENGINE_VERSION,vaultId:stableHash({subjectId:seed?.subjectId,assetIds:assets.map(x=>x.id)}),subjectId:seed?.subjectId,policy:{id:policy.id,version:policy.version},asOf,assets,summary:summary(assets),audit:[],safeguards:{rawDocumentsEmbeddedByDefault:false,silentDeletionAllowed:false,automaticCreditDecisionAllowed:false,prototypeStorageEncryptedAtRest:false,productionEncryptionRequired:true,humanReviewForDeletionRequired:true}};
}
export function requestVaultAssetAction(vault,{assetId,action,actor,reason,at=new Date().toISOString()}={}){
  if(!actor?.id)throw new Error('Human actor is required');
  if(!String(reason||'').trim())throw new Error('Reason is required');
  if(!['archive','delete-request','restore'].includes(action))throw new Error('Unsupported vault action');
  const next=clone(vault);const asset=next.assets.find(x=>x.id===assetId);if(!asset)throw new Error('Vault asset not found');
  if(action==='archive')asset.status='archived';
  if(action==='delete-request')asset.status='deletion-requested';
  if(action==='restore')asset.status='active';
  asset.lastLifecycleAction={action,actorId:actor.id,actorName:actor.name||actor.id,reason:String(reason).trim(),at};
  next.audit.push({id:stableHash({assetId,action,at,actor:actor.id}),assetId,action,actorId:actor.id,reason:String(reason).trim(),at});
  next.summary=summary(next.assets);return next;
}
export function buildVaultInventoryExport(vault){return {schema:'CREDIPASS-VAULT-INVENTORY-1',generatedAt:new Date().toISOString(),vaultId:vault.vaultId,subjectId:vault.subjectId,policy:vault.policy,assets:vault.assets.map(x=>({id:x.id,category:x.category,type:x.type,labelFr:x.labelFr,labelEn:x.labelEn,status:x.status,sensitivity:x.sensitivity,source:x.source,createdAt:x.createdAt,integrityRef:x.integrityRef,retention:x.retention,rawDocumentEmbedded:x.rawDocumentEmbedded})),safeguards:vault.safeguards};}
export function validateDigitalVault(vault){return Boolean(vault?.vaultId&&vault?.subjectId&&Array.isArray(vault.assets)&&vault.assets.every(x=>x.id&&x.integrityRef&&x.retention?.retentionUntil&&x.rawDocumentEmbedded===false)&&vault.safeguards?.silentDeletionAllowed===false&&vault.safeguards?.automaticCreditDecisionAllowed===false);}

import { PRIVACY_POLICIES } from '../config/privacyPolicies.js';
const ENGINE_VERSION='3.2.0';
const clone=x=>JSON.parse(JSON.stringify(x));
const stableHash=input=>{const text=JSON.stringify(input);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return `CPP-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;};
const addDays=(iso,days)=>{const d=new Date(iso);d.setUTCDate(d.getUTCDate()+Number(days||0));return d.toISOString();};
function allowedScopes(policy,purpose){return policy.purposeScopes[purpose]||[];}
function activeGrant(grant,at){const now=new Date(at).getTime();return grant.status==='active'&&new Date(grant.grantedAt).getTime()<=now&&new Date(grant.expiresAt).getTime()>now;}
function recompute(workspace,asOf=workspace.asOf){
  const grants=workspace.grants||[], accesses=workspace.accessLog||[];
  workspace.summary={activeConsents:grants.filter(x=>activeGrant(x,asOf)).length,revokedConsents:grants.filter(x=>x.status==='revoked').length,expiredConsents:grants.filter(x=>x.status==='active'&&!activeGrant(x,asOf)).length,allowedAccesses:accesses.filter(x=>x.decision==='allowed').length,deniedAccesses:accesses.filter(x=>x.decision==='denied').length,retentionReviewDue:workspace.vault?.summary?.retentionReviewDue||0,assets:workspace.vault?.summary?.total||0};return workspace;
}
export function createPrivacyWorkspace({vault,grants=[],accessLog=[]},{policyId='balanced',asOf='2026-08-07T10:20:00.000Z'}={}){
  const policy=PRIVACY_POLICIES[policyId]||PRIVACY_POLICIES.balanced;
  const w={engineVersion:ENGINE_VERSION,workspaceId:stableHash({vaultId:vault?.vaultId,subjectId:vault?.subjectId,policy:policy.id}),subjectId:vault?.subjectId,policy:{id:policy.id,version:policy.version},asOf,vault:clone(vault),grants:clone(grants),accessLog:clone(accessLog),message:null,forbiddenScoringCategories:[...policy.forbiddenScoringCategories],safeguards:{purposeLimitationRequired:true,consentRequiredForExternalDisclosure:true,revocationBlocksFutureUse:true,dataMinimisationRequired:true,automaticCreditDecisionAllowed:false,forbiddenCategoriesUsedForScoring:false,portableExportExcludesProprietaryModelInternals:true,silentDeletionAllowed:false}};
  return recompute(w,asOf);
}
export function grantPrivacyConsent(workspace,{recipient,purpose,scopes,durationDays=7,actor,at=new Date().toISOString()}={}){
  const policy=PRIVACY_POLICIES[workspace.policy.id]||PRIVACY_POLICIES.balanced;
  if(!actor?.id)throw new Error('Consent actor is required');if(!recipient||!purpose)throw new Error('Recipient and purpose are required');
  const requested=[...new Set(scopes||[])];const permitted=allowedScopes(policy,purpose);if(!requested.length)throw new Error('At least one scope is required');
  const invalid=requested.filter(x=>!permitted.includes(x));if(invalid.length)throw new Error(`Scopes not allowed for purpose: ${invalid.join(', ')}`);
  const days=Math.max(1,Math.min(Number(durationDays||7),policy.maxConsentDays));
  const next=clone(workspace);next.grants.push({id:stableHash({subjectId:workspace.subjectId,recipient,purpose,scopes:requested,at}),subjectId:workspace.subjectId,recipient,purpose,scopes:requested,status:'active',grantedAt:at,expiresAt:addDays(at,days),actorId:actor.id,actorName:actor.name||actor.id,revokedAt:null,revocationReason:null});
  return recompute(next,workspace.asOf);
}
export function revokePrivacyConsent(workspace,{consentId,actor,reason,at=new Date().toISOString()}={}){
  if(!actor?.id||!String(reason||'').trim())throw new Error('Actor and revocation reason are required');
  const next=clone(workspace), grant=next.grants.find(x=>x.id===consentId);if(!grant)throw new Error('Consent not found');
  grant.status='revoked';grant.revokedAt=at;grant.revokedBy=actor.id;grant.revocationReason=String(reason).trim();return recompute(next,workspace.asOf);
}
export function evaluatePrivacyAccess(workspace,{recipient,purpose,scopes=[],at=workspace.asOf}={}){
  const policy=PRIVACY_POLICIES[workspace.policy.id]||PRIVACY_POLICIES.balanced;const requested=[...new Set(scopes)];const permitted=allowedScopes(policy,purpose);const disallowed=requested.filter(x=>!permitted.includes(x));
  if(disallowed.length)return {allowed:false,reason:'scope-not-permitted',disallowedScopes:disallowed,consentId:null};
  const grant=workspace.grants.find(g=>g.recipient===recipient&&g.purpose===purpose&&activeGrant(g,at)&&requested.every(s=>g.scopes.includes(s)));
  return grant?{allowed:true,reason:'active-consent',disallowedScopes:[],consentId:grant.id}:{allowed:false,reason:'no-active-consent',disallowedScopes:[],consentId:null};
}
export function recordPrivacyAccess(workspace,{recipient,purpose,scopes=[],actor,at=new Date().toISOString()}={}){
  const result=evaluatePrivacyAccess(workspace,{recipient,purpose,scopes,at});const next=clone(workspace);
  next.accessLog.push({id:stableHash({recipient,purpose,scopes,at}),at,recipient,purpose,scopes:[...scopes],decision:result.allowed?'allowed':'denied',reason:result.reason,consentId:result.consentId,actorId:actor?.id||'SYSTEM-CHECK',automaticDisclosurePerformed:false});
  return recompute(next,workspace.asOf);
}
function disclosureMap(source){
  return {
    'identity.minimal':()=>({personId:source?.data?.person?.id||null,name:source?.data?.person?.name||null,city:source?.data?.person?.city||null}),
    'identity.contact-minimal':()=>({personId:source?.data?.person?.id||null,preferredChannel:'in-app'}),
    'financial.summary':()=>({dataConfidence:source?.quality?.confidence??null,incluscore:source?.incluscore?.score??null,financialHealth:source?.health?.score??null,overIndebtednessRisk:source?.debt?.overIndebtedness?.riskScore??null,recommendedPrincipal:source?.simulation?.recommended?.principal??null}),
    'evidence.summary':()=>({evidenceCount:source?.data?.evidence?.length||0,verifiedOrDocumentedCount:(source?.data?.evidence||[]).filter(x=>['verified','documented','observed'].includes(x.status)).length}),
    'decision.status':()=>({workflowStage:source?.workflow?.currentStage||null,humanDecisionStatus:source?.humanDecision?.status||null,automaticDecision:false}),
    'financial.gaps':()=>({recommendation:source?.recommendation?.code||null,conditions:source?.recommendation?.conditions||[],uncertainties:source?.recommendation?.uncertainties||[]}),
    'learning.progress':()=>({completedMinutes:source?.financialLearning?.summary?.completedMinutes||0,totalMinutes:source?.financialLearning?.summary?.totalMinutes||0,progressPercent:source?.financialLearning?.summary?.progressPercent||0}),
    'technical.logs':()=>({applicationVersion:source?.appVersion||'3.2.0',networkMode:'local-demo'})
  };
}
export function buildMinimizedDisclosure(workspace,{recipient,purpose,scopes=[],source,at=workspace.asOf}={}){
  const access=evaluatePrivacyAccess(workspace,{recipient,purpose,scopes,at});if(!access.allowed)throw new Error(`Disclosure denied: ${access.reason}`);
  const map=disclosureMap(source),payload={};for(const scope of scopes){if(map[scope])payload[scope]=map[scope]();}
  return {schema:'CREDIPASS-MINIMIZED-DISCLOSURE-1',referenceId:stableHash({recipient,purpose,scopes,payload}),recipient,purpose,consentId:access.consentId,scopes:[...scopes],payload,excluded:['raw-documents','identity-full','private-messages','contact-graph','social-media-behaviour','proprietary-model-weights'],generatedAt:at,automaticCreditDecision:false};
}
export function buildPortableDataPackage(workspace,{source,at=new Date().toISOString()}={}){
  return {schema:'CREDIPASS-PORTABILITY-1',referenceId:stableHash({subjectId:workspace.subjectId,at}),subjectId:workspace.subjectId,generatedAt:at,profile:{personId:source?.data?.person?.id||null,name:source?.data?.person?.name||null,city:source?.data?.person?.city||null,activityKey:source?.data?.person?.activityKey||null},evidenceMetadata:(source?.data?.evidence||[]).map(x=>({id:x.id,type:x.type,status:x.status,period:x.period||null,source:x.source||null})),vaultInventory:workspace.vault.assets.map(x=>({id:x.id,category:x.category,type:x.type,status:x.status,source:x.source,createdAt:x.createdAt,integrityRef:x.integrityRef,retention:x.retention})),consents:workspace.grants.map(x=>({id:x.id,recipient:x.recipient,purpose:x.purpose,scopes:x.scopes,status:x.status,grantedAt:x.grantedAt,expiresAt:x.expiresAt,revokedAt:x.revokedAt||null})),accessHistory:workspace.accessLog.map(x=>({...x})),learningProgress:source?.financialLearning?.summary||null,excluded:['raw-documents','proprietary-model-weights','fraud-detection-internal-signals','unconsented-third-party-data'],note:'Prototype portability package; production export formats and legal retention rules must be validated with each institution.'};
}
export function refreshPrivacyWorkspace(workspace){return recompute(clone(workspace),workspace.asOf);}
export function validatePrivacyWorkspace(workspace){return Boolean(workspace?.workspaceId&&workspace?.subjectId&&workspace?.vault?.vaultId&&Array.isArray(workspace.grants)&&Array.isArray(workspace.accessLog)&&workspace.safeguards?.automaticCreditDecisionAllowed===false&&workspace.safeguards?.forbiddenCategoriesUsedForScoring===false&&workspace.safeguards?.silentDeletionAllowed===false);}

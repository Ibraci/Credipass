import { getTrustVerificationPolicy, validateTrustVerificationPolicy } from '../config/trustVerificationPolicies.js';
export const TRUST_VERIFICATION_ENGINE_VERSION='2.6.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const round=(v,p=0)=>{const f=10**p;return Math.round(Number(v||0)*f)/f;};
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function hash(value=''){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function tokens(value=''){return new Set(normalize(value).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>2));}
function similarity(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i);}
function captureAll(content,re){return [...String(content||'').matchAll(re)].map(x=>String(x[1]).trim());}
function extractReferences(doc){return captureAll(doc.content,/(?:Référence|Reference)\s*:\s*([^|]+)/gi);}
function extractDates(doc){return captureAll(doc.content,/(?:Date(?: émission| AG)?|Visite)\s*:\s*(\d{4}-\d{2}-\d{2})/gi);}
function severityFromWeight(weight){return weight>=38?'critical':weight>=25?'high':weight>=14?'medium':'low';}
function finding(id,category,weight,details={}){return {id,category,severity:severityFromWeight(weight),weight,confidence:details.confidence??80,status:'open',humanReviewRequired:true,falsePositivePossible:true,automaticFraudConclusionAllowed:false,...details};}
function validDate(s){const d=new Date(`${s}T00:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
function band(score,t){return score>=t.critical?'critical':score>=t.high?'high':score>=t.review?'review':'low';}
function uniqueFindings(items){const seen=new Set();return items.filter(x=>!seen.has(x.id)&&seen.add(x.id));}
export function analyzeTrustVerification(input,options={}){
  const {data,documents=[],financingFile,quality,context={}}=input||{};
  if(!data?.person)throw new TypeError('trust verification requires applicant data');
  const policy=getTrustVerificationPolicy(options.policyId||'balanced'); if(!validateTrustVerificationPolicy(policy))throw new TypeError('invalid trust verification policy');
  const dispositions=new Map((options.dispositions||[]).map(x=>[x.findingId,x]));
  const findings=[]; const positiveChecks=[]; const asOf=String(context.asOfDate||'2026-08-06');
  const docs=documents.map(d=>({...clone(d),contentHash:hash(normalize(d.content))}));
  const expectedShared=new Set(context.expectedSharedDocumentTypes||[]);
  for(let i=0;i<docs.length;i++)for(let j=i+1;j<docs.length;j++){
    const a=docs[i],b=docs[j]; if(expectedShared.has(a.declaredType)||expectedShared.has(b.declaredType))continue;
    if(a.contentHash===b.contentHash) findings.push(finding(`EXACT-${a.id}-${b.id}`,'exact-duplicate',policy.weights.exactDuplicate,{documentIds:[a.id,b.id],observed:a.contentHash,confidence:99}));
    else { const s=similarity(a.content,b.content); if(s>=policy.thresholds.nearDuplicateSimilarity) findings.push(finding(`NEAR-${a.id}-${b.id}`,'near-duplicate',policy.weights.nearDuplicate,{documentIds:[a.id,b.id],observed:round(s*100,1),expected:`< ${round(policy.thresholds.nearDuplicateSimilarity*100,1)}%`,confidence:round(s*100,1)})); }
  }
  for(const doc of docs){
    const refs=extractReferences(doc); const dates=extractDates(doc);
    for(const date of dates){
      if(!validDate(date)) findings.push(finding(`DATE-INVALID-${doc.id}-${date}`,'impossible-date',policy.weights.impossibleDate,{documentIds:[doc.id],observed:date,expected:'valid-calendar-date',confidence:98}));
      else if(date>asOf) findings.push(finding(`DATE-FUTURE-${doc.id}-${date}`,'future-date',policy.weights.futureDate,{documentIds:[doc.id],observed:date,expected:`<= ${asOf}`,confidence:98}));
    }
    for(const ref of refs){
      const matches=(context.crossCaseDocuments||[]).filter(x=>normalize(x.reference)===normalize(ref));
      for(const m of matches){
        if(m.applicantId===data.person.id||m.allowedReuse){
          findings.push(finding(`REF-SAME-${doc.id}-${m.caseId}`,'reused-reference-same-applicant',policy.weights.reusedReferenceSameApplicant,{documentIds:[doc.id],relatedCaseIds:[m.caseId],observed:ref,confidence:88}));
        }else{
          const isIdentity=doc.declaredType==='identityDocument'||m.documentType==='identityDocument';
          findings.push(finding(`${isIdentity?'ID':'REF'}-OTHER-${doc.id}-${m.caseId}`,isIdentity?'identity-reuse-other-applicant':'reused-reference-other-applicant',isIdentity?policy.weights.identityReuseOtherApplicant:policy.weights.reusedReferenceOtherApplicant,{documentIds:[doc.id],relatedCaseIds:[m.caseId],observed:ref,confidence:94}));
        }
      }
    }
  }
  for(const c of financingFile?.contradictions||[]){
    const cat=c.field==='personName'?'name-mismatch':'amount-mismatch'; const w=cat==='name-mismatch'?policy.weights.nameMismatch:policy.weights.amountMismatch;
    findings.push(finding(`FILE-${c.id}`,cat,w,{documentIds:[c.documentId],observed:c.extracted,expected:c.expected,confidence:95}));
  }
  for(const d of financingFile?.documents||[]){if(d.analysis?.classification?.classificationMatch===false)findings.push(finding(`CLASS-${d.id}`,'classification-mismatch',policy.weights.classificationMismatch,{documentIds:[d.id],observed:d.analysis.classification.detectedType,expected:d.analysis.classification.declaredType,confidence:d.analysis.classification.classificationConfidence}));}
  const city=normalize(data.person.city); for(const d of financingFile?.documents||[]){const f=d.analysis?.fields?.find(x=>x.key==='city'); if(f&&city&&normalize(f.value)!==city)findings.push(finding(`GEO-${d.id}`,'geography-mismatch',policy.weights.geographyMismatch,{documentIds:[d.id],observed:f.value,expected:data.person.city,confidence:f.confidence}));}
  for(const r of context.sharedReferences||[]){if(!r.expectedSharedUse&&Number(r.caseCount)>=policy.thresholds.referenceReuseCount)findings.push(finding(`NETWORK-${r.referenceId}`,'reference-network',policy.weights.referenceNetwork,{referenceIds:[r.referenceId],observed:r.caseCount,expected:`< ${policy.thresholds.referenceReuseCount}`,confidence:76}));}
  for(const change of context.profileChanges||[]){const prev=Number(change.previous||0),cur=Number(change.current||0); if(prev>0){const pct=Math.abs(cur-prev)/prev*100;if(pct>=policy.thresholds.profileChangePercent)findings.push(finding(`CHANGE-${change.field}-${change.changedAt}`,'sudden-profile-change',policy.weights.suddenProfileChange,{observed:round(pct,1),expected:`< ${policy.thresholds.profileChangePercent}%`,field:change.field,confidence:82}));}}
  const sourceCounts={};for(const d of documents)sourceCounts[d.source]=(sourceCounts[d.source]||0)+1;const maxShare=documents.length?Math.max(...Object.values(sourceCounts))/documents.length*100:0;if(maxShare>=75)findings.push(finding('SOURCE-CONCENTRATION','high-source-concentration',policy.weights.highSourceConcentration,{observed:round(maxShare,1),expected:'< 75%',confidence:90}));
  const deduped=uniqueFindings(findings).map(f=>{const disp=dispositions.get(f.id);return disp?{...f,status:disp.action,disposition:clone(disp)}:f;});
  const active=deduped.filter(x=>!['cleared','false-positive'].includes(x.status));
  const rawPoints=active.reduce((s,x)=>s+x.weight,0);const score=round(Math.min(100,rawPoints),1);const currentBand=band(score,policy.thresholds);
  if(!deduped.some(x=>['exact-duplicate','near-duplicate'].includes(x.category)))positiveChecks.push('no-material-internal-duplicate');
  if(!deduped.some(x=>['impossible-date','future-date'].includes(x.category)))positiveChecks.push('document-dates-chronologically-valid');
  if(!deduped.some(x=>x.category==='name-mismatch'))positiveChecks.push('applicant-name-consistent');
  if(!deduped.some(x=>x.category==='geography-mismatch'))positiveChecks.push('geography-consistent');
  if(Number(quality?.confidence||0)>=60)positiveChecks.push('data-quality-sufficient-for-verification-review');
  return {engineVersion:TRUST_VERIFICATION_ENGINE_VERSION,caseId:`VERIFY-${data.scenarioId||'baseline'}-${policy.id}`.toUpperCase(),applicant:{id:data.person.id,name:data.person.name,city:data.person.city},policy,verificationPriorityScore:score,band:currentBand,status:active.length?'human-review-required':'no-material-signal',summary:{totalFindings:deduped.length,openFindings:deduped.filter(x=>x.status==='open').length,acknowledged:deduped.filter(x=>x.status==='acknowledged').length,cleared:deduped.filter(x=>['cleared','false-positive'].includes(x.status)).length,confirmedInconsistencies:deduped.filter(x=>x.status==='confirmed-inconsistency').length,escalated:deduped.filter(x=>x.status==='escalated').length,critical:active.filter(x=>x.severity==='critical').length,high:active.filter(x=>x.severity==='high').length,medium:active.filter(x=>x.severity==='medium').length,low:active.filter(x=>x.severity==='low').length},findings:deduped,positiveChecks,sourceDistribution:sourceCounts,controls:{exactFingerprinting:true,nearDuplicateComparison:true,crossCaseReferenceCheck:true,chronologyCheck:true,identityConsistencyCheck:true,geographyConsistencyCheck:true,profileChangeCheck:true,referenceNetworkCheck:true},safeguards:{anomalyIsNotFraud:true,automaticFraudConclusionAllowed:false,automaticCreditDecisionAllowed:false,automaticAccountRestrictionAllowed:false,automaticReportingToAuthorityAllowed:false,humanInvestigationRequired:true,falsePositivePossible:true,rawEvidencePreserved:true,dispositionReasonRequired:true},excludedData:['ethnicity','religion','political-opinion','private-messages','phone-contacts','social-media-behaviour','non-consented-third-party-data'],limitations:['synthetic-cross-case-registry','near-duplicate-detection-is-deterministic-text-similarity','identity-and-document-authenticity-require-authoritative-external-verification','no-biometric-identification','no-automatic-fraud-label'],trace:{deterministic:true,calculatedAt:options.calculatedAt||'2026-08-06T21:00:00.000Z',documentIds:docs.map(x=>x.id),documentFingerprints:docs.map(x=>({documentId:x.id,fingerprint:x.contentHash})),policyVersion:policy.version}};
}
export function recordVerificationDisposition(dispositions=[],input={}){
  const allowed=['acknowledged','cleared','false-positive','confirmed-inconsistency','escalated']; if(!allowed.includes(input.action))throw new TypeError('unsupported verification disposition');
  if(!input.findingId||!input.actor?.id||!String(input.reason||'').trim())throw new TypeError('finding, actor and reason are required');
  return [...dispositions.filter(x=>x.findingId!==input.findingId),{findingId:input.findingId,action:input.action,actor:clone(input.actor),reason:String(input.reason).trim(),at:input.at||new Date().toISOString(),automaticFraudConclusionCreated:false,automaticCreditDecisionCreated:false}];
}
export function validateTrustVerificationResult(r){return Boolean(r?.engineVersion&&r?.policy?.version&&r.verificationPriorityScore>=0&&r.verificationPriorityScore<=100&&Array.isArray(r.findings)&&r.safeguards?.automaticFraudConclusionAllowed===false&&r.safeguards?.automaticCreditDecisionAllowed===false&&r.safeguards?.humanInvestigationRequired===true);}

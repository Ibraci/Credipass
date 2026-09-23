export const TRUST_VERIFICATION_POLICIES = {
  balanced: {
    id:'balanced', version:'2.6.0-BAL', labelKey:'trustPolicyBalanced',
    thresholds:{ review:18, high:38, critical:68, nearDuplicateSimilarity:0.82, referenceReuseCount:2, profileChangePercent:55 },
    weights:{ exactDuplicate:34, nearDuplicate:18, reusedReferenceOtherApplicant:28, reusedReferenceSameApplicant:6, identityReuseOtherApplicant:45, impossibleDate:30, futureDate:18, amountMismatch:26, nameMismatch:38, geographyMismatch:14, classificationMismatch:10, referenceNetwork:16, suddenProfileChange:18, highSourceConcentration:8 }
  },
  prudent: {
    id:'prudent', version:'2.6.0-PRU', labelKey:'trustPolicyPrudent',
    thresholds:{ review:14, high:32, critical:60, nearDuplicateSimilarity:0.78, referenceReuseCount:2, profileChangePercent:45 },
    weights:{ exactDuplicate:38, nearDuplicate:22, reusedReferenceOtherApplicant:32, reusedReferenceSameApplicant:7, identityReuseOtherApplicant:50, impossibleDate:34, futureDate:22, amountMismatch:30, nameMismatch:42, geographyMismatch:18, classificationMismatch:12, referenceNetwork:20, suddenProfileChange:22, highSourceConcentration:10 }
  },
  inclusivePilot: {
    id:'inclusivePilot', version:'2.6.0-INC', labelKey:'trustPolicyInclusivePilot',
    thresholds:{ review:22, high:44, critical:72, nearDuplicateSimilarity:0.86, referenceReuseCount:3, profileChangePercent:65 },
    weights:{ exactDuplicate:30, nearDuplicate:15, reusedReferenceOtherApplicant:24, reusedReferenceSameApplicant:5, identityReuseOtherApplicant:42, impossibleDate:28, futureDate:16, amountMismatch:24, nameMismatch:36, geographyMismatch:12, classificationMismatch:8, referenceNetwork:14, suddenProfileChange:15, highSourceConcentration:6 }
  }
};
export function getTrustVerificationPolicy(id='balanced'){ return TRUST_VERIFICATION_POLICIES[id] || TRUST_VERIFICATION_POLICIES.balanced; }
export function validateTrustVerificationPolicy(p){
  if(!p?.id||!p?.version||!p?.thresholds||!p?.weights) return false;
  const t=p.thresholds; if(!(t.review<t.high&&t.high<t.critical&&t.critical<=100)) return false;
  return Object.values(p.weights).every(x=>Number.isFinite(x)&&x>=0&&x<=100);
}

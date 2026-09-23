export const GROUP_FINANCING_POLICIES = Object.freeze({
  balanced:Object.freeze({
    id:'balanced', version:'GRP-POL-2.1.0-BAL', labelFr:'Financement collectif — politique équilibrée', labelEn:'Group financing — balanced policy',
    minimumCoopScore:65, minimumDataConfidence:70, minimumConsentCoverage:0.80,
    maxGuaranteeCoverage:0.35, maxSingleMemberLiabilityShare:0.04, maxFirstTrancheShare:0.60,
    minimumVerifiedFundUseBeforeNextTranche:0.75, reserveHoldbackRate:0.05, humanApprovalRequired:true
  }),
  prudent:Object.freeze({
    id:'prudent', version:'GRP-POL-2.1.0-PRU', labelFr:'Financement collectif — politique prudente', labelEn:'Group financing — prudent policy',
    minimumCoopScore:72, minimumDataConfidence:78, minimumConsentCoverage:0.90,
    maxGuaranteeCoverage:0.30, maxSingleMemberLiabilityShare:0.03, maxFirstTrancheShare:0.50,
    minimumVerifiedFundUseBeforeNextTranche:0.85, reserveHoldbackRate:0.08, humanApprovalRequired:true
  }),
  inclusivePilot:Object.freeze({
    id:'inclusivePilot', version:'GRP-POL-2.1.0-INC', labelFr:'Financement collectif — profil inclusif contrôlé', labelEn:'Group financing — controlled inclusion',
    minimumCoopScore:60, minimumDataConfidence:66, minimumConsentCoverage:0.75,
    maxGuaranteeCoverage:0.40, maxSingleMemberLiabilityShare:0.05, maxFirstTrancheShare:0.65,
    minimumVerifiedFundUseBeforeNextTranche:0.70, reserveHoldbackRate:0.04, humanApprovalRequired:true
  })
});

export function getGroupFinancingPolicy(id='balanced') { return GROUP_FINANCING_POLICIES[id] || GROUP_FINANCING_POLICIES.balanced; }
export function validateGroupFinancingPolicy(policy) {
  if (!policy?.id || !policy?.version) return false;
  const ratios=['minimumConsentCoverage','maxGuaranteeCoverage','maxSingleMemberLiabilityShare','maxFirstTrancheShare','minimumVerifiedFundUseBeforeNextTranche','reserveHoldbackRate'];
  if (!ratios.every(key=>Number(policy[key])>=0 && Number(policy[key])<=1)) return false;
  return policy.minimumCoopScore>=0 && policy.minimumCoopScore<=100 && policy.minimumDataConfidence>=0 && policy.minimumDataConfidence<=100 && policy.humanApprovalRequired===true;
}

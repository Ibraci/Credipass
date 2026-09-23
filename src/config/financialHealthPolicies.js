export const FINANCIAL_HEALTH_POLICY_REGISTRY_VERSION = '1.3.0';

const COMMON_RULES = Object.freeze([
  'no-double-counting-expenses',
  'conservative-debt-service',
  'minimum-rest-to-live',
  'over-indebtedness-warning',
  'human-review-required',
  'no-automatic-credit-decision'
]);

export const FINANCIAL_HEALTH_POLICIES = Object.freeze({
  balanced: Object.freeze({
    id: 'balanced',
    version: 'ML-HLT-BAL-1.0.0',
    labelKey: 'healthPolicyBalanced',
    baseMinimumRestToLive: 15000,
    dependentReserve: 5000,
    warningDebtServiceRatio: 25,
    maximumDebtServiceRatio: 35,
    warningTotalCommitmentRatio: 85,
    maximumTotalCommitmentRatio: 95,
    minimumSavingsCoverageMonths: 0.5,
    maximumUnverifiedDebtShare: 20,
    highDebtCount: 3,
    minimumDataConfidence: 60,
    rules: COMMON_RULES
  }),
  prudent: Object.freeze({
    id: 'prudent',
    version: 'ML-HLT-PRU-1.0.0',
    labelKey: 'healthPolicyPrudent',
    baseMinimumRestToLive: 25000,
    dependentReserve: 7500,
    warningDebtServiceRatio: 20,
    maximumDebtServiceRatio: 30,
    warningTotalCommitmentRatio: 80,
    maximumTotalCommitmentRatio: 90,
    minimumSavingsCoverageMonths: 1,
    maximumUnverifiedDebtShare: 10,
    highDebtCount: 3,
    minimumDataConfidence: 70,
    rules: COMMON_RULES
  }),
  inclusivePilot: Object.freeze({
    id: 'inclusivePilot',
    version: 'ML-HLT-INC-1.0.0',
    labelKey: 'healthPolicyInclusivePilot',
    baseMinimumRestToLive: 10000,
    dependentReserve: 4000,
    warningDebtServiceRatio: 30,
    maximumDebtServiceRatio: 40,
    warningTotalCommitmentRatio: 90,
    maximumTotalCommitmentRatio: 100,
    minimumSavingsCoverageMonths: 0.35,
    maximumUnverifiedDebtShare: 25,
    highDebtCount: 4,
    minimumDataConfidence: 55,
    rules: COMMON_RULES
  })
});

export function getFinancialHealthPolicy(id = 'balanced') {
  return FINANCIAL_HEALTH_POLICIES[id] || FINANCIAL_HEALTH_POLICIES.balanced;
}

export function validateFinancialHealthPolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new TypeError('policy must be an object');
  const bounded = [
    'warningDebtServiceRatio','maximumDebtServiceRatio','warningTotalCommitmentRatio',
    'maximumTotalCommitmentRatio','minimumDataConfidence','maximumUnverifiedDebtShare'
  ];
  bounded.forEach(key => {
    const value = Number(policy[key]);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${key} must be between 0 and 100`);
  });
  if (policy.warningDebtServiceRatio >= policy.maximumDebtServiceRatio) throw new RangeError('debt service warning must be below maximum');
  if (policy.warningTotalCommitmentRatio >= policy.maximumTotalCommitmentRatio) throw new RangeError('commitment warning must be below maximum');
  if (Number(policy.baseMinimumRestToLive) < 0 || Number(policy.dependentReserve) < 0) throw new RangeError('rest-to-live parameters must be non-negative');
  if (Number(policy.highDebtCount) < 1) throw new RangeError('highDebtCount must be at least one');
  return true;
}

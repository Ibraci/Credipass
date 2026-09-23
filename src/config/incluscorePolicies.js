export const INCLUSCORE_POLICY_REGISTRY_VERSION = '1.2.0';

const COMMON_EXCLUDED_DATA = Object.freeze([
  'ethnicity',
  'religion',
  'political-opinion',
  'private-messages',
  'phone-contacts',
  'social-media-behaviour'
]);

const COMMON_RULES = Object.freeze([
  'deterministic-calculation',
  'no-automatic-credit-decision',
  'confidence-gate',
  'sensitive-data-exclusion',
  'upstream-engine-traceability',
  'human-validation-required'
]);

export const INCLUSCORE_POLICIES = Object.freeze({
  balanced: Object.freeze({
    id: 'balanced',
    version: 'ML-BAL-1.0.0',
    labelKey: 'policyBalanced',
    descriptionKey: 'policyBalancedDescription',
    minimumDataConfidence: 60,
    thresholds: Object.freeze({ favorable: 75, conditional: 60, improvement: 45 }),
    weights: Object.freeze({
      repaymentCapacity: 0.25,
      cashflowStability: 0.15,
      debtBurden: 0.15,
      savingsBuffer: 0.10,
      cooperativeDiscipline: 0.10,
      resilience: 0.15,
      activityContinuity: 0.10
    }),
    excludedData: COMMON_EXCLUDED_DATA,
    rules: COMMON_RULES
  }),
  prudent: Object.freeze({
    id: 'prudent',
    version: 'ML-PRU-1.0.0',
    labelKey: 'policyPrudent',
    descriptionKey: 'policyPrudentDescription',
    minimumDataConfidence: 70,
    thresholds: Object.freeze({ favorable: 80, conditional: 65, improvement: 50 }),
    weights: Object.freeze({
      repaymentCapacity: 0.30,
      cashflowStability: 0.20,
      debtBurden: 0.20,
      savingsBuffer: 0.05,
      cooperativeDiscipline: 0.05,
      resilience: 0.15,
      activityContinuity: 0.05
    }),
    excludedData: COMMON_EXCLUDED_DATA,
    rules: COMMON_RULES
  }),
  inclusivePilot: Object.freeze({
    id: 'inclusivePilot',
    version: 'ML-INC-1.0.0',
    labelKey: 'policyInclusivePilot',
    descriptionKey: 'policyInclusivePilotDescription',
    minimumDataConfidence: 55,
    thresholds: Object.freeze({ favorable: 70, conditional: 55, improvement: 40 }),
    weights: Object.freeze({
      repaymentCapacity: 0.25,
      cashflowStability: 0.10,
      debtBurden: 0.15,
      savingsBuffer: 0.15,
      cooperativeDiscipline: 0.10,
      resilience: 0.15,
      activityContinuity: 0.10
    }),
    excludedData: COMMON_EXCLUDED_DATA,
    rules: COMMON_RULES
  })
});

export function getIncluscorePolicy(id = 'balanced') {
  return INCLUSCORE_POLICIES[id] || INCLUSCORE_POLICIES.balanced;
}

export function validateIncluscorePolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new TypeError('policy must be an object');
  const sum = Object.values(policy.weights || {}).reduce((total, value) => total + Number(value || 0), 0);
  if (Math.abs(sum - 1) > 0.000001) throw new RangeError(`policy weights must total 1 (received ${sum})`);
  if (!(policy.thresholds.favorable > policy.thresholds.conditional && policy.thresholds.conditional > policy.thresholds.improvement)) {
    throw new RangeError('policy thresholds must be strictly descending');
  }
  if (policy.minimumDataConfidence < 0 || policy.minimumDataConfidence > 100) {
    throw new RangeError('minimumDataConfidence must be between 0 and 100');
  }
  return true;
}

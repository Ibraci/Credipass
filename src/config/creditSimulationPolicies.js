export const CREDIT_SIMULATION_POLICY_REGISTRY_VERSION = '1.4.0';

const COMMON_RULES = Object.freeze([
  'payment-bounded-by-prudent-headroom',
  'fees-disclosed-separately',
  'stress-tests-before-recommendation',
  'seasonal-capacity-must-be-explained',
  'no-automatic-credit-decision',
  'human-validation-required'
]);

export const CREDIT_SIMULATION_POLICIES = Object.freeze({
  balanced: Object.freeze({
    id:'balanced', version:'ML-SIM-BAL-1.0.0', labelKey:'simulationPolicyBalanced',
    annualInterestRate:18, originationFeeRate:2, insuranceRate:1,
    minimumAmount:50000, maximumAmount:1500000,
    allowedDurations:[6,9,12,15,18,24], maximumPaymentUtilization:92,
    minimumDataConfidence:60, minimumHealthScore:55, maximumOverIndebtednessRisk:55,
    maximumPrincipalToAnnualResourcesRatio:0.8, maximumStressFailureMonths:1,
    preferredScheduleOrder:['seasonal','standard','progressive'], rules:COMMON_RULES
  }),
  prudent: Object.freeze({
    id:'prudent', version:'ML-SIM-PRU-1.0.0', labelKey:'simulationPolicyPrudent',
    annualInterestRate:17, originationFeeRate:2, insuranceRate:1,
    minimumAmount:50000, maximumAmount:1000000,
    allowedDurations:[6,9,12,15,18,24], maximumPaymentUtilization:80,
    minimumDataConfidence:70, minimumHealthScore:65, maximumOverIndebtednessRisk:35,
    maximumPrincipalToAnnualResourcesRatio:0.65, maximumStressFailureMonths:0,
    preferredScheduleOrder:['standard','seasonal','progressive'], rules:COMMON_RULES
  }),
  inclusivePilot: Object.freeze({
    id:'inclusivePilot', version:'ML-SIM-INC-1.0.0', labelKey:'simulationPolicyInclusivePilot',
    annualInterestRate:18, originationFeeRate:1.5, insuranceRate:0.75,
    minimumAmount:25000, maximumAmount:1500000,
    allowedDurations:[6,9,12,15,18,24], maximumPaymentUtilization:95,
    minimumDataConfidence:55, minimumHealthScore:50, maximumOverIndebtednessRisk:65,
    maximumPrincipalToAnnualResourcesRatio:0.9, maximumStressFailureMonths:2,
    preferredScheduleOrder:['seasonal','progressive','standard'], rules:COMMON_RULES
  })
});

export function getCreditSimulationPolicy(id='balanced') {
  return CREDIT_SIMULATION_POLICIES[id] || CREDIT_SIMULATION_POLICIES.balanced;
}

export function validateCreditSimulationPolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new TypeError('policy must be an object');
  const percentages = ['annualInterestRate','originationFeeRate','insuranceRate','maximumPaymentUtilization','minimumDataConfidence','minimumHealthScore','maximumOverIndebtednessRisk'];
  percentages.forEach(key => {
    const value = Number(policy[key]);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${key} must be between 0 and 100`);
  });
  if (!Array.isArray(policy.allowedDurations) || !policy.allowedDurations.length || policy.allowedDurations.some(value => !Number.isInteger(value) || value < 1)) throw new RangeError('allowedDurations must contain positive integers');
  if (Number(policy.minimumAmount) <= 0 || Number(policy.maximumAmount) < Number(policy.minimumAmount)) throw new RangeError('amount bounds are invalid');
  if (Number(policy.maximumPrincipalToAnnualResourcesRatio) <= 0 || Number(policy.maximumPrincipalToAnnualResourcesRatio) > 2) throw new RangeError('maximumPrincipalToAnnualResourcesRatio is invalid');
  if (!Array.isArray(policy.preferredScheduleOrder) || !policy.preferredScheduleOrder.length) throw new TypeError('preferredScheduleOrder is required');
  return true;
}

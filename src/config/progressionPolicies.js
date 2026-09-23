export const FINANCIAL_PROGRESSION_POLICY_VERSION = '1.8.0';

export const FINANCIAL_PROGRESSION_POLICIES = Object.freeze({
  balanced: Object.freeze({
    id:'balanced', version:'1.8.0-balanced',
    targets:Object.freeze({ confidence:85, incluscore:72, financialHealth:70, maximumDebtRisk:45 }),
    savingsRate:0.22, maximumExpenseOptimisationRate:0.06, maximumDebtServiceReductionRate:0.10,
    minimumVerifiedEvidenceByHorizon:Object.freeze({ 30:1, 60:2, 90:3 }),
    minimumTrackingPeriodsByHorizon:Object.freeze({ 30:1, 60:2, 90:3 })
  }),
  prudent: Object.freeze({
    id:'prudent', version:'1.8.0-prudent',
    targets:Object.freeze({ confidence:90, incluscore:76, financialHealth:75, maximumDebtRisk:35 }),
    savingsRate:0.28, maximumExpenseOptimisationRate:0.05, maximumDebtServiceReductionRate:0.08,
    minimumVerifiedEvidenceByHorizon:Object.freeze({ 30:2, 60:3, 90:4 }),
    minimumTrackingPeriodsByHorizon:Object.freeze({ 30:1, 60:2, 90:3 })
  }),
  inclusionPolicy: Object.freeze({
    id:'inclusionPolicy', version:'1.8.0-inclusive-pilot',
    targets:Object.freeze({ confidence:80, incluscore:68, financialHealth:65, maximumDebtRisk:50 }),
    savingsRate:0.18, maximumExpenseOptimisationRate:0.07, maximumDebtServiceReductionRate:0.12,
    minimumVerifiedEvidenceByHorizon:Object.freeze({ 30:1, 60:2, 90:3 }),
    minimumTrackingPeriodsByHorizon:Object.freeze({ 30:1, 60:2, 90:3 })
  })
});

export const PROGRESSION_INTENSITIES = Object.freeze({
  conservative:Object.freeze({ id:'conservative', factor:0.65, uncertaintyMultiplier:1.25 }),
  recommended:Object.freeze({ id:'recommended', factor:1.00, uncertaintyMultiplier:1.00 }),
  accelerated:Object.freeze({ id:'accelerated', factor:1.15, uncertaintyMultiplier:0.90 })
});

export function getFinancialProgressionPolicy(policyId='balanced') {
  const policy = FINANCIAL_PROGRESSION_POLICIES[policyId];
  if (!policy) throw new Error(`Unknown financial progression policy: ${policyId}`);
  return policy;
}

export function validateFinancialProgressionPolicy(policy) {
  if (!policy?.id || !policy?.version || !policy.targets) throw new TypeError('A valid progression policy is required');
  const { confidence, incluscore, financialHealth, maximumDebtRisk } = policy.targets;
  [confidence, incluscore, financialHealth, maximumDebtRisk].forEach(value => {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError('Progression targets must be between 0 and 100');
  });
  [30,60,90].forEach(horizon => {
    if (!Number.isInteger(policy.minimumVerifiedEvidenceByHorizon[horizon])) throw new TypeError('Evidence targets must be integers');
    if (!Number.isInteger(policy.minimumTrackingPeriodsByHorizon[horizon])) throw new TypeError('Tracking targets must be integers');
  });
  return true;
}

import { getFinancialHealthPolicy, validateFinancialHealthPolicy } from '../config/financialHealthPolicies.js';

export const DEBT_ENGINE_VERSION = '1.3.0';

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const ACTIVE_STATUSES = new Set(['verified','documented','declared','estimated','contested']);
const CONFIRMED_STATUSES = new Set(['verified','documented']);
const CONSERVATIVE_PAYMENT_FACTOR = Object.freeze({
  verified: 1,
  documented: 1,
  declared: 1.10,
  estimated: 1.20,
  contested: 0.50
});

function normaliseDebt(item = {}) {
  const monthlyPayment = Math.max(0, Number(item.monthlyPayment || 0));
  const status = item.status || 'declared';
  const verification = Math.max(0, Math.min(100, Number(item.verification || 0)));
  const active = item.active !== false && ACTIVE_STATUSES.has(status);
  const consented = item.consented !== false;
  const included = active && consented;
  const conservativeFactor = CONSERVATIVE_PAYMENT_FACTOR[status] ?? 1.20;
  return {
    ...item,
    status,
    verification,
    active,
    consented,
    included,
    principalOutstanding: Math.max(0, Number(item.principalOutstanding || 0)),
    monthlyPayment,
    remainingMonths: Math.max(0, Number(item.remainingMonths || 0)),
    conservativeFactor,
    conservativeMonthlyPayment: included ? round(monthlyPayment * conservativeFactor) : 0,
    confirmed: included && CONFIRMED_STATUSES.has(status) && verification >= 70,
    provisional: included && (!CONFIRMED_STATUSES.has(status) || verification < 70)
  };
}

export function analyzeDebtPortfolio(items = [], options = {}) {
  if (!Array.isArray(items)) throw new TypeError('debts must be an array');
  const policy = options.policy || getFinancialHealthPolicy(options.policyId || 'balanced');
  validateFinancialHealthPolicy(policy);

  const debts = items.map(normaliseDebt);
  const included = debts.filter(item => item.included);
  const excluded = debts.filter(item => !item.included).map(item => ({
    id: item.id,
    reason: item.consented ? `status-${item.status}` : 'consent-not-granted'
  }));
  const confirmed = included.filter(item => item.confirmed);
  const provisional = included.filter(item => item.provisional);
  const contested = included.filter(item => item.status === 'contested');

  const confirmedMonthlyService = round(confirmed.reduce((sum, item) => sum + item.monthlyPayment, 0));
  const provisionalMonthlyService = round(provisional.reduce((sum, item) => sum + item.conservativeMonthlyPayment, 0));
  const conservativeMonthlyService = round(confirmedMonthlyService + provisionalMonthlyService);
  const declaredMonthlyService = Math.max(0, Number(options.declaredMonthlyPayment || 0));
  const serviceDifference = round(conservativeMonthlyService - declaredMonthlyService);
  const mismatchTolerance = Math.max(5000, declaredMonthlyService * 0.10);
  const profileMismatch = Math.abs(serviceDifference) > mismatchTolerance;
  const totalOutstandingPrincipal = round(included.reduce((sum, item) => sum + item.principalOutstanding, 0));
  const largestPrincipal = included.length ? Math.max(...included.map(item => item.principalOutstanding)) : 0;
  const concentrationRatio = totalOutstandingPrincipal > 0 ? round(largestPrincipal / totalOutstandingPrincipal * 100) : 0;
  const unverifiedMonthlyService = round(provisional.reduce((sum, item) => sum + item.conservativeMonthlyPayment, 0));
  const unverifiedShare = conservativeMonthlyService > 0 ? round(unverifiedMonthlyService / conservativeMonthlyService * 100) : 0;
  const averageRemainingMonths = included.length
    ? round(included.reduce((sum, item) => sum + item.remainingMonths, 0) / included.length)
    : 0;

  const flags = [
    ...(included.length >= policy.highDebtCount ? ['multiple-active-debts'] : []),
    ...(profileMismatch ? ['profile-debt-mismatch'] : []),
    ...(unverifiedShare > policy.maximumUnverifiedDebtShare ? ['unverified-debt-share-high'] : []),
    ...(contested.length ? ['contested-debt-present'] : []),
    ...(included.some(item => item.remainingMonths > 0 && item.remainingMonths <= 3 && item.monthlyPayment >= conservativeMonthlyService * 0.5) ? ['short-maturity-pressure'] : []),
    ...(concentrationRatio >= 80 && included.length > 1 ? ['debt-concentration-high'] : [])
  ];

  return {
    debts,
    included,
    excluded,
    summary: {
      activeDebtCount: included.length,
      confirmedDebtCount: confirmed.length,
      provisionalDebtCount: provisional.length,
      contestedDebtCount: contested.length,
      confirmedMonthlyService,
      provisionalMonthlyService,
      conservativeMonthlyService,
      declaredMonthlyService,
      serviceDifference,
      totalOutstandingPrincipal,
      concentrationRatio,
      unverifiedShare,
      averageRemainingMonths
    },
    flags: [...new Set(flags)],
    used: included.map(item => item.id),
    uncertainties: [
      ...(profileMismatch ? ['profile-debt-mismatch'] : []),
      ...(provisional.length ? [`provisional-debts:${provisional.length}`] : []),
      ...(contested.length ? [`contested-debts:${contested.length}`] : [])
    ],
    rulesApplied: [
      'all-known-debts-consolidated',
      'uncertain-debt-not-discounted',
      'unconsented-debt-data-excluded',
      'contested-debt-kept-visible',
      'profile-debt-reconciliation'
    ],
    policy: {
      id: policy.id,
      version: policy.version,
      maximumUnverifiedDebtShare: policy.maximumUnverifiedDebtShare,
      highDebtCount: policy.highDebtCount
    },
    safeguards: {
      automaticRejectionAllowed: false,
      humanVerificationRequired: true,
      contestedDebtTreatedAsFraud: false
    },
    engineVersion: DEBT_ENGINE_VERSION
  };
}

export function assessOverIndebtedness(debtPortfolio, financialHealth, options = {}) {
  const policy = options.policy || getFinancialHealthPolicy(options.policyId || debtPortfolio?.policy?.id || 'balanced');
  validateFinancialHealthPolicy(policy);
  if (!debtPortfolio?.summary || !financialHealth?.ratios) throw new TypeError('debt portfolio and financial health outputs are required');

  const { summary } = debtPortfolio;
  const { ratios, amounts } = financialHealth;
  let points = 0;
  const drivers = [];
  const add = (value, code) => { points += value; drivers.push({ code, points:value }); };

  if (amounts.restToLiveAfterDebt < 0) add(40, 'negative-rest-to-live');
  else if (amounts.restToLiveAfterDebt < amounts.minimumRestToLive) add(25, 'rest-to-live-below-policy');

  if (ratios.debtServiceRatio > policy.maximumDebtServiceRatio) add(25, 'debt-service-ratio-over-maximum');
  else if (ratios.debtServiceRatio > policy.warningDebtServiceRatio) add(15, 'debt-service-ratio-warning');

  if (ratios.totalCommitmentRatio > policy.maximumTotalCommitmentRatio) add(20, 'total-commitment-over-maximum');
  else if (ratios.totalCommitmentRatio > policy.warningTotalCommitmentRatio) add(10, 'total-commitment-warning');

  if (summary.activeDebtCount >= policy.highDebtCount) add(10, 'multiple-active-debts');
  if (debtPortfolio.flags.includes('profile-debt-mismatch')) add(10, 'profile-debt-mismatch');
  if (summary.unverifiedShare > policy.maximumUnverifiedDebtShare) add(10, 'unverified-debt-share-high');
  if (summary.contestedDebtCount > 0) add(8, 'contested-debt-present');
  if (financialHealth.stressTests.filter(item => item.restToLiveAfterDebt < 0).length >= 2) add(12, 'stress-tests-negative');

  const riskScore = clamp(points);
  const band = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'moderate' : 'low';
  const actions = [
    ...(band === 'critical' ? ['suspend-new-commitment-pending-human-review','consider-restructuring-or-consolidation'] : []),
    ...(band === 'high' ? ['limit-additional-monthly-payment','perform-second-level-debt-review'] : []),
    ...(summary.unverifiedShare > policy.maximumUnverifiedDebtShare ? ['verify-provisional-debts'] : []),
    ...(debtPortfolio.flags.includes('profile-debt-mismatch') ? ['reconcile-declared-and-detected-debt'] : []),
    ...(band === 'low' ? ['maintain-debt-monitoring'] : [])
  ];

  return {
    riskScore,
    band,
    drivers,
    actions: [...new Set(actions)],
    policyVersion: policy.version,
    safeguards: {
      automaticCreditDecisionAllowed: false,
      humanReviewRequired: true,
      alertIsProofOfFraud: false
    },
    engineVersion: DEBT_ENGINE_VERSION
  };
}

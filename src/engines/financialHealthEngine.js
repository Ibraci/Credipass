import { getFinancialHealthPolicy, validateFinancialHealthPolicy } from '../config/financialHealthPolicies.js';

export const FINANCIAL_HEALTH_ENGINE_VERSION = '1.3.0';

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function interpolate(value, points) {
  const ordered = [...points].sort((a, b) => a[0] - b[0]);
  if (value <= ordered[0][0]) return clamp(ordered[0][1]);
  for (let i = 1; i < ordered.length; i++) {
    const [x2, y2] = ordered[i];
    const [x1, y1] = ordered[i - 1];
    if (value <= x2) {
      const ratio = (value - x1) / Math.max(0.000001, x2 - x1);
      return clamp(y1 + ratio * (y2 - y1));
    }
  }
  return clamp(ordered.at(-1)[1]);
}

function calculateResources(profile, profileResult, cashflow, quality) {
  const reliability = Math.max(0, Math.min(1, Number(profile.reliability || 0) / 100));
  const formalPrudent = Math.max(0, Number(profile.formalIncome || 0)) * reliability;
  const seasonalPrudent = Math.max(0, Number(profile.seasonalIncomeAverage || 0)) * reliability;
  const evidenceBackedIncome = Math.max(0, Number(cashflow.summary?.averagePrudentInflow || 0)) + formalPrudent + seasonalPrudent;
  const declaredPrudentIncome = Math.max(0, Number(profileResult.prudentIncome || 0));
  const evidenceWeight = Math.max(0.35, Math.min(0.9, Number(quality.confidence || 0) / 100));
  const prudentMonthlyResources = round(evidenceBackedIncome * evidenceWeight + declaredPrudentIncome * (1 - evidenceWeight));
  return { formalPrudent:round(formalPrudent), seasonalPrudent:round(seasonalPrudent), evidenceBackedIncome:round(evidenceBackedIncome), declaredPrudentIncome:round(declaredPrudentIncome), evidenceWeight:round(evidenceWeight, 4), prudentMonthlyResources };
}

export function assessFinancialHealth(inputs = {}, options = {}) {
  const { profile = {}, profileResult = {}, cashflow = {}, quality = {}, debt = {} } = inputs;
  const policy = options.policy || getFinancialHealthPolicy(options.policyId || 'balanced');
  validateFinancialHealthPolicy(policy);
  if (!cashflow.summary || !quality.components || !debt.summary) throw new TypeError('profile, cashflow, quality and debt outputs are required');

  const resources = calculateResources(profile, profileResult, cashflow, quality);
  const reconstructedRecurringOutflow = Math.max(0, Number(cashflow.summary.averagePrudentOutflow || 0));
  const declaredEssentialExpenses = Math.max(0, Number(profile.essentialExpenses || 0));
  const essentialCommitments = round(Math.max(declaredEssentialExpenses, reconstructedRecurringOutflow));
  const conservativeDebtService = round(debt.summary.conservativeMonthlyService || 0);
  const dependents = Math.max(0, Number(profile.dependents ?? inputs.person?.dependents ?? 0));
  const minimumRestToLive = round(policy.baseMinimumRestToLive + dependents * policy.dependentReserve);
  const restToLiveBeforeDebt = round(resources.prudentMonthlyResources - essentialCommitments);
  const restToLiveAfterDebt = round(restToLiveBeforeDebt - conservativeDebtService);
  const debtServiceRatio = resources.prudentMonthlyResources > 0 ? round(conservativeDebtService / resources.prudentMonthlyResources * 100) : 100;
  const totalCommitmentRatio = resources.prudentMonthlyResources > 0 ? round((essentialCommitments + conservativeDebtService) / resources.prudentMonthlyResources * 100) : 100;
  const essentialCoverageRatio = essentialCommitments > 0 ? round(resources.prudentMonthlyResources / essentialCommitments) : 0;
  const monthlyObligations = round(essentialCommitments + conservativeDebtService);
  const savingsCoverageMonths = monthlyObligations > 0 ? round(Number(profile.savings || 0) / monthlyObligations) : 0;
  const restAdequacyRatio = minimumRestToLive > 0 ? round(restToLiveAfterDebt / minimumRestToLive * 100) : 100;
  const safeAdditionalMonthlyPayment = round(Math.max(0, Math.min(
    resources.prudentMonthlyResources * policy.maximumDebtServiceRatio / 100 - conservativeDebtService,
    restToLiveAfterDebt - minimumRestToLive
  )));

  const restScore = interpolate(restAdequacyRatio, [[-100,0],[0,15],[50,40],[100,70],[200,90],[300,100]]);
  const debtScore = interpolate(debtServiceRatio, [[0,100],[policy.warningDebtServiceRatio * 0.5,90],[policy.warningDebtServiceRatio,70],[policy.maximumDebtServiceRatio,35],[policy.maximumDebtServiceRatio + 15,0]]);
  const commitmentScore = interpolate(totalCommitmentRatio, [[40,100],[60,90],[policy.warningTotalCommitmentRatio,65],[policy.maximumTotalCommitmentRatio,25],[120,0]]);
  const savingsScore = interpolate(savingsCoverageMonths, [[0,0],[policy.minimumSavingsCoverageMonths * 0.5,40],[policy.minimumSavingsCoverageMonths,70],[policy.minimumSavingsCoverageMonths * 2,100]]);
  const stabilityScore = interpolate(Number(cashflow.summary.volatility || 0), [[0,100],[10,90],[20,70],[30,45],[45,15],[60,0]]);
  let healthScore = clamp(restScore * 0.30 + debtScore * 0.20 + commitmentScore * 0.20 + savingsScore * 0.15 + stabilityScore * 0.15);
  const confidenceGateTriggered = Number(quality.confidence || 0) < policy.minimumDataConfidence;
  if (confidenceGateTriggered) healthScore = Math.min(healthScore, 55);

  const stressTests = [
    { id:'baseline', incomeFactor:1, expenseFactor:1 },
    { id:'income-minus-10', incomeFactor:0.90, expenseFactor:1 },
    { id:'expenses-plus-10', incomeFactor:1, expenseFactor:1.10 },
    { id:'combined-shock', incomeFactor:0.85, expenseFactor:1.10 }
  ].map(item => {
    const income = round(resources.prudentMonthlyResources * item.incomeFactor);
    const expenses = round(essentialCommitments * item.expenseFactor);
    const rest = round(income - expenses - conservativeDebtService);
    return { ...item, income, expenses, debtService:conservativeDebtService, restToLiveAfterDebt:rest, survivesMinimumReserve:rest >= minimumRestToLive };
  });

  let band = healthScore >= 80 ? 'robust' : healthScore >= 65 ? 'stable' : healthScore >= 50 ? 'watch' : healthScore >= 35 ? 'fragile' : 'critical';
  if (restToLiveAfterDebt < 0 || totalCommitmentRatio > policy.maximumTotalCommitmentRatio + 10) band = 'critical';
  else if (restToLiveAfterDebt < minimumRestToLive || totalCommitmentRatio > policy.maximumTotalCommitmentRatio) band = ['critical','fragile'].includes(band) ? band : 'fragile';
  if (confidenceGateTriggered && !['critical','fragile'].includes(band)) band = 'toComplete';

  const alerts = [
    ...(restToLiveAfterDebt < 0 ? ['negative-rest-to-live'] : []),
    ...(restToLiveAfterDebt >= 0 && restToLiveAfterDebt < minimumRestToLive ? ['rest-to-live-below-policy'] : []),
    ...(debtServiceRatio > policy.maximumDebtServiceRatio ? ['debt-service-ratio-over-maximum'] : debtServiceRatio > policy.warningDebtServiceRatio ? ['debt-service-ratio-warning'] : []),
    ...(totalCommitmentRatio > policy.maximumTotalCommitmentRatio ? ['total-commitment-over-maximum'] : totalCommitmentRatio > policy.warningTotalCommitmentRatio ? ['total-commitment-warning'] : []),
    ...(savingsCoverageMonths < policy.minimumSavingsCoverageMonths ? ['savings-buffer-low'] : []),
    ...(Number(cashflow.summary.volatility || 0) > 25 ? ['cashflow-volatility-high'] : []),
    ...(confidenceGateTriggered ? ['data-confidence-below-policy'] : []),
    ...(stressTests.filter(item => item.restToLiveAfterDebt < 0).length >= 2 ? ['stress-resilience-low'] : [])
  ];

  const recommendations = [
    ...(safeAdditionalMonthlyPayment <= 0 ? ['no-additional-payment-before-review'] : ['cap-new-payment-at-safe-headroom']),
    ...(alerts.includes('rest-to-live-below-policy') || alerts.includes('negative-rest-to-live') ? ['review-essential-expense-breakdown'] : []),
    ...(alerts.includes('savings-buffer-low') ? ['build-emergency-savings-buffer'] : []),
    ...(debt.flags?.includes('profile-debt-mismatch') ? ['reconcile-debt-information'] : []),
    ...(stressTests.some(item => !item.survivesMinimumReserve) ? ['use-stress-tested-credit-structure'] : []),
    ...(!alerts.length ? ['maintain-current-financial-discipline'] : [])
  ];

  return {
    score: healthScore,
    band,
    amounts: {
      prudentMonthlyResources: resources.prudentMonthlyResources,
      essentialCommitments,
      conservativeDebtService,
      monthlyObligations,
      restToLiveBeforeDebt,
      restToLiveAfterDebt,
      minimumRestToLive,
      safeAdditionalMonthlyPayment,
      savings: Math.max(0, Number(profile.savings || 0))
    },
    ratios: {
      debtServiceRatio,
      totalCommitmentRatio,
      essentialCoverageRatio,
      savingsCoverageMonths,
      restAdequacyRatio,
      cashflowVolatility: Number(cashflow.summary.volatility || 0)
    },
    components: { restScore, debtScore, commitmentScore, savingsScore, stabilityScore },
    stressTests,
    alerts: [...new Set(alerts)],
    recommendations: [...new Set(recommendations)],
    usedData: [
      { key:'reconstructedPrudentInflow', value:Number(cashflow.summary.averagePrudentInflow || 0), source:'Cashflow Reconstruction Engine', reliability:Number(quality.confidence || 0) },
      { key:'declaredPrudentIncome', value:resources.declaredPrudentIncome, source:'Socio-Economic Profile Engine', reliability:Number(profile.reliability || 0) },
      { key:'essentialCommitments', value:essentialCommitments, source:'Profile + Cashflow reconciliation', reliability:Number(quality.confidence || 0) },
      { key:'conservativeDebtService', value:conservativeDebtService, source:'Debt & Over-Indebtedness Engine', reliability:Math.max(0, 100 - Number(debt.summary.unverifiedShare || 0)) },
      { key:'savings', value:Number(profile.savings || 0), source:'Profile + Financial Evidence Engine', reliability:Number(quality.confidence || 0) }
    ],
    excludedData: ['ethnicity','religion','political-opinion','private-messages','phone-contacts','social-media-behaviour','unconsented-third-party-debt-data'],
    uncertainties: [
      ...(quality.uncertainties || []),
      ...(debt.uncertainties || []),
      ...(confidenceGateTriggered ? [`confidence-below-health-policy:${quality.confidence}/${policy.minimumDataConfidence}`] : []),
      'minimum-rest-to-live-is-institution-configurable-not-a-legal-threshold'
    ],
    intermediate: {
      resourceCalculation: resources,
      expenseReconciliation: {
        declaredEssentialExpenses,
        reconstructedRecurringOutflow,
        selectedEssentialCommitments: essentialCommitments,
        rule: 'maximum of declared recurring essential expenses and reconstructed recurring outflows; never added together'
      },
      weightedScore: {
        restScore:{ score:restScore, weight:0.30 },
        debtScore:{ score:debtScore, weight:0.20 },
        commitmentScore:{ score:commitmentScore, weight:0.20 },
        savingsScore:{ score:savingsScore, weight:0.15 },
        stabilityScore:{ score:stabilityScore, weight:0.15 }
      }
    },
    policy: {
      id:policy.id,
      version:policy.version,
      minimumDataConfidence:policy.minimumDataConfidence,
      minimumRestToLive,
      warningDebtServiceRatio:policy.warningDebtServiceRatio,
      maximumDebtServiceRatio:policy.maximumDebtServiceRatio,
      warningTotalCommitmentRatio:policy.warningTotalCommitmentRatio,
      maximumTotalCommitmentRatio:policy.maximumTotalCommitmentRatio,
      minimumSavingsCoverageMonths:policy.minimumSavingsCoverageMonths,
      rules:policy.rules
    },
    safeguards: {
      automaticCreditDecisionAllowed:false,
      humanValidationRequired:true,
      healthScoreIsProbabilityOfDefault:false,
      minimumRestToLiveIsRegulatoryThreshold:false
    },
    engineVersion: FINANCIAL_HEALTH_ENGINE_VERSION
  };
}

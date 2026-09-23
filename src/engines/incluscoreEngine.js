import { getIncluscorePolicy, validateIncluscorePolicy } from '../config/incluscorePolicies.js';

export const INCLUSCORE_ENGINE_VERSION = '1.2.1';

const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const average = values => values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;

function linearScore(value, points) {
  const ordered = [...points].sort((a, b) => a[0] - b[0]);
  if (value <= ordered[0][0]) return clamp(ordered[0][1]);
  for (let index = 1; index < ordered.length; index++) {
    const [x2, y2] = ordered[index];
    const [x1, y1] = ordered[index - 1];
    if (value <= x2) {
      const ratio = (value - x1) / Math.max(0.000001, x2 - x1);
      return clamp(y1 + ratio * (y2 - y1));
    }
  }
  return clamp(ordered.at(-1)[1]);
}

function evidenceCount(evidence, predicate) {
  return (evidence || []).filter(item => item && item.usable !== false && predicate(item)).length;
}

function calculateAxes({ profile, cashflow, quality, evidence, debt }) {
  const periods = cashflow.periods || [];
  const expectedPeriodCount = Math.max(1, periods.length);
  const prudentInflowsAll = periods.map(row => Number(row.prudentInflow || 0));
  const prudentNetsAll = periods.map(row => Number(row.prudentNet || 0));
  const averagePrudentInflowAll = average(prudentInflowsAll);
  const averagePrudentNetAll = average(prudentNetsAll);
  const netMarginRatio = averagePrudentInflowAll > 0 ? averagePrudentNetAll / averagePrudentInflowAll * 100 : 0;
  const existingDebtPayments = Number(debt?.summary?.conservativeMonthlyService ?? profile.existingDebtPayments ?? 0);
  const debtServiceRatio = averagePrudentInflowAll > 0 ? existingDebtPayments / averagePrudentInflowAll * 100 : 100;
  const essentialExpenses = Math.max(1, Number(profile.essentialExpenses || 0));
  const liquidSavingsMonths = Number(profile.savings || 0) / essentialExpenses;
  const effectiveBufferMonths = (Number(profile.savings || 0) + Number(profile.equipmentValue || 0) * 0.25) / essentialExpenses;
  const directInflowPeriods = periods.filter(row => Number(row.observedInflow || 0) > 0).length;
  const periodCoverageRatio = directInflowPeriods / expectedPeriodCount * 100;
  const contributionPeriods = new Set((evidence || [])
    .filter(item => item && item.usable !== false && item.typeKey === 'coopContribution' && ['verified', 'observed', 'documented'].includes(item.status))
    .map(item => item.period || item.date?.slice(0, 7))
    .filter(Boolean));
  const cooperativeCoverage = contributionPeriods.size / expectedPeriodCount * 100;
  const activityAgeMonths = Math.max(0, Number(profile.activityAgeMonths || 0));

  const capacityScore = linearScore(netMarginRatio, [[-10, 0], [0, 20], [5, 35], [10, 55], [15, 72], [20, 86], [25, 100]]);
  let stabilityScore = linearScore(Number(cashflow.summary?.volatility || 100), [[0, 100], [5, 96], [10, 90], [20, 72], [30, 48], [45, 20], [60, 0]]);
  if (periodCoverageRatio < 100) stabilityScore = clamp(stabilityScore - (100 - periodCoverageRatio) * 0.45);
  const debtScore = linearScore(debtServiceRatio, [[0, 100], [10, 88], [20, 72], [30, 52], [40, 28], [50, 8], [60, 0]]);
  const savingsScore = linearScore(liquidSavingsMonths, [[0, 0], [0.25, 25], [0.5, 42], [1, 65], [2, 86], [3, 100]]);
  const cooperativeScore = linearScore(cooperativeCoverage, [[0, 20], [33, 45], [66, 72], [100, 100]]);
  const resilienceScore = linearScore(effectiveBufferMonths, [[0, 0], [0.5, 35], [1, 62], [2, 84], [3, 100]]);
  const continuityBase = linearScore(activityAgeMonths, [[0, 10], [6, 32], [12, 52], [24, 75], [36, 90], [60, 100]]);
  const continuityScore = clamp(continuityBase * 0.7 + periodCoverageRatio * 0.3);

  return {
    repaymentCapacity: {
      score: capacityScore,
      input: { averagePrudentInflowAll: round(averagePrudentInflowAll), averagePrudentNetAll: round(averagePrudentNetAll), netMarginRatio: round(netMarginRatio) },
      formula: 'average prudent net / average prudent inflow',
      sourceEngines: ['Cashflow Reconstruction Engine']
    },
    cashflowStability: {
      score: stabilityScore,
      input: { volatility: Number(cashflow.summary?.volatility || 0), directInflowPeriods, expectedPeriodCount, periodCoverageRatio: round(periodCoverageRatio) },
      formula: 'volatility curve adjusted by direct inflow period coverage',
      sourceEngines: ['Cashflow Reconstruction Engine', 'Data Quality & Confidence Engine']
    },
    debtBurden: {
      score: debtScore,
      input: { existingDebtPayments, averagePrudentInflowAll: round(averagePrudentInflowAll), debtServiceRatio: round(debtServiceRatio) },
      formula: 'existing monthly debt payments / average prudent inflow',
      sourceEngines: ['Debt & Over-Indebtedness Engine', 'Cashflow Reconstruction Engine']
    },
    savingsBuffer: {
      score: savingsScore,
      input: { savings: Number(profile.savings || 0), essentialExpenses, liquidSavingsMonths: round(liquidSavingsMonths) },
      formula: 'liquid savings / essential monthly expenses',
      sourceEngines: ['Socio-Economic Profile Engine', 'Financial Evidence Engine']
    },
    cooperativeDiscipline: {
      score: cooperativeScore,
      input: { verifiedContributionPeriods: contributionPeriods.size, expectedPeriodCount, cooperativeCoverage: round(cooperativeCoverage) },
      formula: 'verified cooperative contribution periods / expected periods',
      sourceEngines: ['Financial Evidence Engine']
    },
    resilience: {
      score: resilienceScore,
      input: { savings: Number(profile.savings || 0), equipmentValue: Number(profile.equipmentValue || 0), effectiveBufferMonths: round(effectiveBufferMonths) },
      formula: '(savings + 25% of productive equipment) / essential expenses',
      sourceEngines: ['Socio-Economic Profile Engine', 'Financial Evidence Engine']
    },
    activityContinuity: {
      score: continuityScore,
      input: { activityAgeMonths, periodCoverageRatio: round(periodCoverageRatio) },
      formula: '70% activity age curve + 30% direct inflow period coverage',
      sourceEngines: ['Socio-Economic Profile Engine', 'Cashflow Reconstruction Engine']
    }
  };
}

function classify(score, thresholds) {
  if (score >= thresholds.favorable) return 'favorable';
  if (score >= thresholds.conditional) return 'conditional';
  if (score >= thresholds.improvement) return 'improvement';
  return 'fragile';
}

function factorKey(axis, positive) {
  const suffix = positive ? 'Positive' : 'Negative';
  return `${axis}${suffix}`;
}

export function calculateIncluscore(inputs = {}, options = {}) {
  const { profile = {}, cashflow = {}, quality = {}, evidence = [], debt = null } = inputs;
  const policy = options.policy || getIncluscorePolicy(options.policyId || 'balanced');
  validateIncluscorePolicy(policy);

  if (!cashflow.periods || !quality.components) {
    throw new TypeError('cashflow and quality engine outputs are required');
  }

  const axesBase = calculateAxes({ profile, cashflow, quality, evidence, debt });
  const axes = Object.entries(axesBase).map(([id, axis]) => {
    const weight = Number(policy.weights[id] || 0);
    return {
      id,
      score: clamp(axis.score),
      weight,
      weightedPoints: round(axis.score * weight),
      input: axis.input,
      formula: axis.formula,
      sourceEngines: axis.sourceEngines
    };
  });
  const rawScore = clamp(axes.reduce((sum, axis) => sum + axis.score * axis.weight, 0));
  const dataConfidence = clamp(quality.confidence);
  const uncertaintyMargin = Math.max(2, Math.ceil((100 - dataConfidence) / 4));
  const scoreInterval = {
    min: clamp(rawScore - uncertaintyMargin),
    max: clamp(rawScore + uncertaintyMargin)
  };
  const computedBand = classify(rawScore, policy.thresholds);
  const confidenceGateTriggered = dataConfidence < policy.minimumDataConfidence;
  const publishedBand = confidenceGateTriggered ? 'toComplete' : computedBand;

  const positiveFactors = axes
    .filter(axis => axis.score >= 75)
    .sort((a, b) => b.weightedPoints - a.weightedPoints)
    .slice(0, 4)
    .map(axis => ({ axis: axis.id, score: axis.score, weightedPoints: axis.weightedPoints, messageKey: factorKey(axis.id, true) }));
  const negativeFactors = axes
    .filter(axis => axis.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(axis => ({ axis: axis.id, score: axis.score, weightedPoints: axis.weightedPoints, messageKey: factorKey(axis.id, false) }));

  const usableEvidence = (evidence || []).filter(item => item && item.usable !== false);
  const usedData = [
    { key: 'prudentCashflow', value: round(average((cashflow.periods || []).map(row => row.prudentNet))), source: 'Cashflow Reconstruction Engine', reliability: dataConfidence },
    { key: 'cashflowVolatility', value: Number(cashflow.summary?.volatility || 0), source: 'Cashflow Reconstruction Engine', reliability: dataConfidence },
    { key: 'existingDebtPayments', value: Number(debt?.summary?.conservativeMonthlyService ?? profile.existingDebtPayments ?? 0), source: debt ? 'Debt & Over-Indebtedness Engine' : 'Socio-Economic Profile Engine', reliability: debt ? Math.max(0, 100 - Number(debt.summary?.unverifiedShare || 0)) : Number(profile.reliability || 0) },
    { key: 'savings', value: Number(profile.savings || 0), source: 'Socio-Economic Profile Engine + Financial Evidence Engine', reliability: Math.max(0, Math.min(100, evidence.find(item => item.id === 'EV-SAVINGS')?.verification || profile.reliability || 0)) },
    { key: 'cooperativeContributions', value: evidenceCount(usableEvidence, item => item.typeKey === 'coopContribution'), source: 'Financial Evidence Engine', reliability: clamp(average(usableEvidence.filter(item => item.typeKey === 'coopContribution').map(item => item.verification))) },
    { key: 'activityAgeMonths', value: Number(profile.activityAgeMonths || 0), source: 'Socio-Economic Profile Engine', reliability: Number(profile.reliability || 0) }
  ];

  const uncertainties = [
    ...(quality.uncertainties || []),
    ...(cashflow.uncertainties || []),
    ...(confidenceGateTriggered ? [`confidence-below-policy:${dataConfidence}/${policy.minimumDataConfidence}`] : []),
    ...(Number(profile.repaymentHistoryMonths || 0) <= 0 ? ['no-verified-repayment-history'] : []),
    ...(negativeFactors.length === 0 ? [] : ['weak-axes-present'])
  ];

  return {
    score: rawScore,
    scoreInterval,
    computedBand,
    publishedBand,
    dataConfidence,
    confidenceGateTriggered,
    policy: {
      id: policy.id,
      version: policy.version,
      labelKey: policy.labelKey,
      descriptionKey: policy.descriptionKey,
      minimumDataConfidence: policy.minimumDataConfidence,
      thresholds: policy.thresholds,
      weights: policy.weights
    },
    axes,
    factors: { positive: positiveFactors, negative: negativeFactors },
    usedData,
    excludedData: [...policy.excludedData, 'unverified-rumours', 'unconsented-third-party-data'],
    uncertainties: [...new Set(uncertainties)],
    rulesApplied: policy.rules,
    intermediate: {
      weightedCalculation: axes.map(axis => ({ axis: axis.id, score: axis.score, weight: axis.weight, weightedPoints: axis.weightedPoints })),
      totalWeightedPoints: round(axes.reduce((sum, axis) => sum + axis.weightedPoints, 0)),
      confidenceGate: `${dataConfidence} >= ${policy.minimumDataConfidence}`,
      classificationThresholds: policy.thresholds,
      scoreMeaning: 'Explainable financial readiness and sustainability index; not a probability of default.'
    },
    safeguards: {
      automaticDecisionAllowed: false,
      humanValidationRequired: true,
      scoreIsProbabilityOfDefault: false,
      sensitiveDataUsed: false
    },
    modelCard: {
      name: 'INCLUSCORE deterministic prototype',
      purpose: 'Support an explainable microcredit risk review using locally available, consented financial evidence.',
      limitations: [
        'Not statistically calibrated as a probability of default.',
        'Requires field validation and institutional review.',
        'Three months of reconstructed flows remain a short observation horizon.'
      ],
      engineVersion: INCLUSCORE_ENGINE_VERSION,
      policyVersion: policy.version
    },
    engineVersion: INCLUSCORE_ENGINE_VERSION
  };
}

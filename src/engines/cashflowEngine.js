export const CASHFLOW_ENGINE_VERSION = '1.1.0';

const STATUS_FACTOR = Object.freeze({
  verified: 1,
  documented: 0.82,
  observed: 0.9,
  declared: 0.6,
  estimated: 0.45,
  contradictory: 0,
  expired: 0,
  contested: 0,
  rejected: 0,
  revoked: 0
});

const round = value => Math.round((Number(value) || 0) * 100) / 100;
const median = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function periodOf(item) {
  if (item.period) return item.period;
  if (item.date && /^\d{4}-\d{2}/.test(item.date)) return item.date.slice(0, 7);
  return null;
}

function reliabilityFactor(item) {
  const status = STATUS_FACTOR[item.status] ?? 0;
  const verification = Math.max(0, Math.min(1, Number(item.verification || 0) / 100));
  return Math.min(status, verification || status);
}

function conservativeAmount(item) {
  const amount = Math.max(0, Number(item.amount || 0));
  const confidence = reliabilityFactor(item);
  if (item.flowType === 'inflow') return round(amount * confidence);
  if (item.flowType === 'outflow') {
    const uncertaintyBuffer = Math.min(0.2, Math.max(0, (0.85 - confidence) * 0.35));
    return round(amount * (1 + uncertaintyBuffer));
  }
  return 0;
}

function deduplicate(items) {
  const direct = [];
  const duplicateExcluded = [];
  const byOperation = new Map();

  for (const item of items) {
    const key = item.operationKey || item.id;
    const previous = byOperation.get(key);
    if (!previous) {
      byOperation.set(key, item);
      continue;
    }
    const previousScore = Number(previous.verification || 0);
    const currentScore = Number(item.verification || 0);
    if (currentScore > previousScore) {
      duplicateExcluded.push({ id: previous.id, reason: 'duplicate-lower-confidence', operationKey: key });
      byOperation.set(key, item);
    } else {
      duplicateExcluded.push({ id: item.id, reason: 'duplicate-lower-confidence', operationKey: key });
    }
  }

  byOperation.forEach(item => direct.push(item));
  return { direct, duplicateExcluded };
}

export function reconstructCashflow(items = [], options = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');

  const usable = items.filter(item => item && item.usable !== false && (STATUS_FACTOR[item.status] ?? 0) > 0);
  const directCandidates = usable.filter(item => item.cashflowMode === 'direct' && ['inflow', 'outflow'].includes(item.flowType));
  const corroborating = usable.filter(item => item.cashflowMode === 'corroborating');
  const nonCash = usable.filter(item => item.cashflowMode === 'noncash' || !['inflow', 'outflow'].includes(item.flowType));
  const excludedByStatus = items
    .filter(item => !usable.includes(item))
    .map(item => ({ id: item.id, reason: item.reason || `status-${item.status || 'unknown'}` }));

  const { direct, duplicateExcluded } = deduplicate(directCandidates);
  const periods = [...new Set([
    ...(options.expectedPeriods || []),
    ...direct.map(periodOf).filter(Boolean)
  ])].sort();

  const monthly = periods.map(period => {
    const periodItems = direct.filter(item => periodOf(item) === period);
    const inflows = periodItems.filter(item => item.flowType === 'inflow' && item.exceptional !== true);
    const outflows = periodItems.filter(item => item.flowType === 'outflow' && item.exceptional !== true);
    const exceptional = periodItems.filter(item => item.exceptional === true);
    const observedInflow = round(inflows.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    const observedOutflow = round(outflows.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    const prudentInflow = round(inflows.reduce((sum, item) => sum + conservativeAmount(item), 0));
    const prudentOutflow = round(outflows.reduce((sum, item) => sum + conservativeAmount(item), 0));
    return {
      period,
      observedInflow,
      observedOutflow,
      observedNet: round(observedInflow - observedOutflow),
      prudentInflow,
      prudentOutflow,
      prudentNet: round(prudentInflow - prudentOutflow),
      exceptionalAmount: round(exceptional.reduce((sum, item) => sum + Number(item.amount || 0), 0)),
      evidenceIds: periodItems.map(item => item.id)
    };
  });

  const observedInflows = monthly.map(row => row.observedInflow).filter(value => value > 0);
  const prudentInflows = monthly.map(row => row.prudentInflow).filter(value => value > 0);
  const prudentOutflows = monthly.map(row => row.prudentOutflow).filter(value => value > 0);
  const averageObservedInflow = observedInflows.length ? round(observedInflows.reduce((a, b) => a + b, 0) / observedInflows.length) : 0;
  const medianObservedInflow = round(median(observedInflows));
  const averagePrudentInflow = prudentInflows.length ? round(prudentInflows.reduce((a, b) => a + b, 0) / prudentInflows.length) : 0;
  const averagePrudentOutflow = prudentOutflows.length ? round(prudentOutflows.reduce((a, b) => a + b, 0) / prudentOutflows.length) : 0;
  const averagePrudentNet = round(averagePrudentInflow - averagePrudentOutflow);
  const variance = observedInflows.length
    ? observedInflows.reduce((sum, value) => sum + Math.pow(value - averageObservedInflow, 2), 0) / observedInflows.length
    : 0;
  const volatility = averageObservedInflow > 0 ? round(Math.sqrt(variance) / averageObservedInflow * 100) : 0;
  const corroboratingAmount = round(corroborating.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const corroborationCoverage = averageObservedInflow > 0
    ? Math.min(100, Math.round(corroboratingAmount / (averageObservedInflow * Math.max(1, periods.length)) * 100))
    : 0;
  const missingPeriods = periods.filter(period => !direct.some(item => periodOf(item) === period && item.flowType === 'inflow'));

  return {
    periods: monthly,
    summary: {
      averageObservedInflow,
      medianObservedInflow,
      averagePrudentInflow,
      averagePrudentOutflow,
      averagePrudentNet,
      volatility,
      corroboratingAmount,
      corroborationCoverage
    },
    used: direct.map(item => item.id),
    corroborating: corroborating.map(item => item.id),
    nonCash: nonCash.map(item => item.id),
    excluded: [...excludedByStatus, ...duplicateExcluded],
    uncertainties: [
      ...(missingPeriods.length ? [`missing-periods:${missingPeriods.join(',')}`] : []),
      ...(periods.length < 3 ? ['short-history'] : []),
      ...(corroborationCoverage < 20 ? ['limited-corroboration'] : []),
      ...(volatility > 25 ? ['high-volatility'] : [])
    ],
    intermediate: {
      directRecordCount: direct.length,
      corroboratingRecordCount: corroborating.length,
      nonCashRecordCount: nonCash.length,
      statusFactors: STATUS_FACTOR,
      inflowRule: 'amount × min(status factor, verification rate)',
      outflowRule: 'amount + conservative uncertainty buffer (max 20%)',
      exceptionalRule: 'shown separately and excluded from recurring averages'
    },
    engineVersion: CASHFLOW_ENGINE_VERSION
  };
}

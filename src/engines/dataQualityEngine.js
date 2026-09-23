export const DATA_QUALITY_ENGINE_VERSION = '1.1.0';

const REQUIRED_FIELDS = ['id', 'typeKey', 'sourceKey', 'date', 'status', 'verification'];
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

const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 365;
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function freshnessScore(date, asOfDate) {
  const age = daysBetween(date, asOfDate);
  if (age <= 30) return 100;
  if (age <= 60) return 85;
  if (age <= 90) return 70;
  if (age <= 180) return 45;
  return 20;
}

export function assessDataQuality(items = [], options = {}) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const asOfDate = options.asOfDate || new Date().toISOString().slice(0, 10);
  const expectedPeriods = options.expectedPeriods || [];
  const usable = items.filter(item => item && item.usable !== false && (STATUS_FACTOR[item.status] ?? 0) > 0);
  const excluded = items.filter(item => !usable.includes(item));

  const fieldScores = items.map(item => {
    const present = REQUIRED_FIELDS.filter(field => item?.[field] !== undefined && item?.[field] !== null && item?.[field] !== '').length;
    return present / REQUIRED_FIELDS.length * 100;
  });
  const completeness = clamp(average(fieldScores));
  const freshness = clamp(average(usable.map(item => freshnessScore(item.date, asOfDate))));
  const verification = clamp(average(usable.map(item => Number(item.verification || 0) * (STATUS_FACTOR[item.status] ?? 0))));
  const sourceGroups = new Set(usable.map(item => item.diversityGroup || item.sourceKey).filter(Boolean));
  const diversityTarget = Math.max(1, Number(options.diversityTarget || 5));
  const diversity = clamp(sourceGroups.size / diversityTarget * 100);

  const contradictions = items.filter(item => item.status === 'contradictory').length;
  const revoked = items.filter(item => ['revoked', 'contested', 'expired'].includes(item.status)).length;
  const duplicates = items.length - new Set(items.map(item => item.operationKey || item.id)).size;
  const coherence = clamp(100 - contradictions * 18 - revoked * 8 - duplicates * 10);

  const coveredPeriods = new Set(usable.map(item => item.period || item.date?.slice(0, 7)).filter(Boolean));
  const coverage = expectedPeriods.length
    ? clamp(expectedPeriods.filter(period => coveredPeriods.has(period)).length / expectedPeriods.length * 100)
    : clamp(Math.min(100, coveredPeriods.size / 3 * 100));

  const traceable = usable.filter(item => item.sourceKey && item.date && (item.operationKey || item.id)).length;
  const traceability = clamp(usable.length ? traceable / usable.length * 100 : 0);

  const weights = Object.freeze({ completeness: 0.15, freshness: 0.12, verification: 0.25, diversity: 0.13, coherence: 0.15, coverage: 0.12, traceability: 0.08 });
  const confidence = clamp(
    completeness * weights.completeness +
    freshness * weights.freshness +
    verification * weights.verification +
    diversity * weights.diversity +
    coherence * weights.coherence +
    coverage * weights.coverage +
    traceability * weights.traceability
  );
  const band = confidence >= 80 ? 'high' : confidence >= 60 ? 'moderate' : confidence >= 40 ? 'limited' : 'insufficient';

  return {
    components: { completeness, freshness, verification, diversity, coherence, coverage, traceability },
    confidence,
    band,
    used: usable.map(item => item.id),
    excluded: excluded.map(item => ({ id: item.id, reason: item.reason || `status-${item.status || 'unknown'}` })),
    uncertainties: [
      ...(contradictions ? [`contradictions:${contradictions}`] : []),
      ...(duplicates ? [`duplicates:${duplicates}`] : []),
      ...(coverage < 100 ? ['partial-period-coverage'] : []),
      ...(diversity < 60 ? ['limited-source-diversity'] : []),
      ...(verification < 70 ? ['verification-below-target'] : [])
    ],
    deliberatelyExcludedData: ['ethnicity', 'religion', 'political-opinion', 'private-messages', 'phone-contacts'],
    intermediate: {
      asOfDate,
      expectedPeriods,
      usableCount: usable.length,
      excludedCount: excluded.length,
      sourceGroupCount: sourceGroups.size,
      contradictions,
      revoked,
      duplicates,
      weights
    },
    engineVersion: DATA_QUALITY_ENGINE_VERSION
  };
}

export const EVIDENCE_ENGINE_VERSION = '1.0.0';
const statusFactor = { verified: 1, documented: .8, declared: .5, estimated: .4, contradictory: 0, expired: 0, contested: 0, rejected: 0, revoked: 0 };
export function analyzeEvidence(items = []) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const valid = items.filter(x => x && x.usable !== false && statusFactor[x.status] > 0);
  const excluded = items.filter(x => !valid.includes(x));
  const completeness = Math.min(100, Math.round((valid.length / Math.max(5, items.length || 1)) * 100));
  const freshness = valid.length ? Math.round(valid.reduce((s,x)=>s+Number(x.freshness||0),0)/valid.length) : 0;
  const verification = valid.length ? Math.round(valid.reduce((s,x)=>s+Number(x.verification||0)*statusFactor[x.status],0)/valid.length) : 0;
  const groups = new Set(valid.map(x => x.diversityGroup).filter(Boolean));
  const diversity = Math.min(100, groups.size * 20);
  const contradictions = items.filter(x => x.status === 'contradictory').length;
  const coherence = Math.max(0, 100 - contradictions * 20);
  const confidence = Math.round(completeness*.2 + freshness*.15 + verification*.35 + diversity*.15 + coherence*.15);
  return {
    completeness, freshness, verification, diversity, coherence, confidence,
    used: valid.map(x => x.id),
    excluded: excluded.map(x => ({ id:x.id, reason:x.reason || `Statut ${x.status}` })),
    uncertainties: [
      ...(items.length < 5 ? ['Couverture documentaire limitée.'] : []),
      ...(contradictions ? [`${contradictions} contradiction(s) nécessitent une validation humaine.`] : []),
      ...(diversity < 60 ? ['Diversité des sources insuffisante.'] : [])
    ],
    engineVersion: EVIDENCE_ENGINE_VERSION
  };
}

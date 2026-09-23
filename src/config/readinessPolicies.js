export const DEPLOYMENT_READINESS_POLICY = Object.freeze({
  id:'institutional-readiness',
  version:'2.3.0',
  minimumValidImportRows:5,
  minimumImportValidityRate:80,
  minimumReadinessForObservation:70,
  minimumReadinessForCopilot:85,
  maximumCriticalOpenItemsForObservation:3,
  maximumCriticalOpenItemsForCopilot:0,
  targetTimeReductionPercent:50,
  targetIncompleteReductionPercent:25,
  categories:{
    institution:15,
    product:15,
    data:20,
    security:20,
    operations:15,
    measurement:15
  }
});

export function validatePilotReadinessPolicy(policy = DEPLOYMENT_READINESS_POLICY) {
  const total = Object.values(policy.categories || {}).reduce((sum,value)=>sum+Number(value||0),0);
  if (total !== 100) throw new Error('Readiness category weights must total 100');
  if (policy.minimumReadinessForObservation >= policy.minimumReadinessForCopilot) throw new Error('Copilot threshold must exceed observation threshold');
  return true;
}

export const COOP_SCORE_POLICIES = Object.freeze({
  balanced: Object.freeze({
    id:'balanced', version:'COOP-POL-2.0.0-BAL', labelFr:'COOP-SCORE — politique équilibrée', labelEn:'COOP-SCORE — balanced policy',
    minimumConfidence:70,
    weights:Object.freeze({ governance:0.18, contributionDiscipline:0.16, internalRepayment:0.16, financialCapacity:0.18, savingsResilience:0.12, memberStability:0.08, riskDiversification:0.12 }),
    bands:Object.freeze({ strong:80, satisfactory:65, watch:50 }),
    limits:Object.freeze({ maxTopBuyerShare:0.45, maxTopMemberExposure:0.12, targetSavingsMonths:2.0, maxDebtServiceRatio:0.35 })
  }),
  prudent: Object.freeze({
    id:'prudent', version:'COOP-POL-2.0.0-PRU', labelFr:'COOP-SCORE — politique prudente', labelEn:'COOP-SCORE — prudent policy',
    minimumConfidence:78,
    weights:Object.freeze({ governance:0.21, contributionDiscipline:0.15, internalRepayment:0.18, financialCapacity:0.20, savingsResilience:0.12, memberStability:0.06, riskDiversification:0.08 }),
    bands:Object.freeze({ strong:84, satisfactory:70, watch:55 }),
    limits:Object.freeze({ maxTopBuyerShare:0.35, maxTopMemberExposure:0.10, targetSavingsMonths:2.5, maxDebtServiceRatio:0.30 })
  }),
  inclusivePilot: Object.freeze({
    id:'inclusivePilot', version:'COOP-POL-2.0.0-INC', labelFr:'COOP-SCORE — profil inclusif contrôlé', labelEn:'COOP-SCORE — controlled inclusion',
    minimumConfidence:66,
    weights:Object.freeze({ governance:0.16, contributionDiscipline:0.19, internalRepayment:0.15, financialCapacity:0.16, savingsResilience:0.12, memberStability:0.12, riskDiversification:0.10 }),
    bands:Object.freeze({ strong:78, satisfactory:62, watch:46 }),
    limits:Object.freeze({ maxTopBuyerShare:0.50, maxTopMemberExposure:0.15, targetSavingsMonths:1.5, maxDebtServiceRatio:0.38 })
  })
});

export function getCoopScorePolicy(id='balanced') {
  return COOP_SCORE_POLICIES[id] || COOP_SCORE_POLICIES.balanced;
}

export function validateCoopScorePolicy(policy) {
  if (!policy?.id || !policy?.version || !policy?.weights || !policy?.bands || !policy?.limits) return false;
  const weightTotal = Object.values(policy.weights).reduce((sum,value)=>sum+Number(value || 0),0);
  if (Math.abs(weightTotal - 1) > 0.000001) return false;
  if (!(policy.bands.strong > policy.bands.satisfactory && policy.bands.satisfactory > policy.bands.watch)) return false;
  return policy.minimumConfidence >= 0 && policy.minimumConfidence <= 100;
}

import { simulateResponsibleCredit } from './creditSimulationEngine.js';

export const WINNER_SCENARIO_ENGINE_VERSION = '1.0.0';

const clampAmount = value => Math.max(0, Math.round(Number(value) || 0));

export function compareResponsibleAmountScenario(inputs = {}, options = {}) {
  const { data, quality, incluscore, health, debt, currentSimulation } = inputs;
  if (!data?.person || !data?.profile || !quality || !incluscore || !health || !debt || !currentSimulation) {
    throw new TypeError('complete baseline results are required');
  }
  const currentAmount = clampAmount(currentSimulation.request?.amount ?? data.creditRequest?.amount ?? data.profile.requestedAmount);
  const candidateAmount = clampAmount(options.candidateAmount);
  if (!candidateAmount || candidateAmount >= currentAmount) throw new RangeError('candidate amount must be positive and lower than current amount');

  const candidateSimulation = simulateResponsibleCredit(
    {
      person:data.person,
      profile:data.profile,
      quality,
      incluscore,
      health,
      debt,
      request:{ ...(data.creditRequest || {}), amount:candidateAmount }
    },
    { policyId:options.policyId || 'balanced' }
  );

  return {
    engineVersion:WINNER_SCENARIO_ENGINE_VERSION,
    scenarioId:data.scenarioId || 'baseline',
    current:{
      requestedAmount:currentAmount,
      incluscore:incluscore.score,
      proposedPrincipal:currentSimulation.recommended.principal,
      maximumPayment:currentSimulation.recommended.maximumPayment,
      durationMonths:currentSimulation.recommended.durationMonths,
      scheduleType:currentSimulation.recommended.scheduleType,
      simulationRecommendation:currentSimulation.recommendation
    },
    candidate:{
      requestedAmount:candidateAmount,
      incluscore:incluscore.score,
      proposedPrincipal:candidateSimulation.recommended.principal,
      maximumPayment:candidateSimulation.recommended.maximumPayment,
      durationMonths:candidateSimulation.recommended.durationMonths,
      scheduleType:candidateSimulation.recommended.scheduleType,
      simulationRecommendation:candidateSimulation.recommendation
    },
    candidateSimulation,
    explanation:{
      incluscoreChanged:false,
      incluscoreReason:'requested-amount-not-an-incluscore-input',
      financingRecalculated:true,
      automaticApprovalPromised:false
    },
    safeguards:{
      deterministic:true,
      usesResponsibleCreditSimulation:true,
      changesIncluscoreFormula:false,
      automaticCreditDecisionAllowed:false,
      humanDecisionRequired:true
    }
  };
}

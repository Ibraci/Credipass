import { getFinancialProgressionPolicy, PROGRESSION_INTENSITIES } from '../config/progressionPolicies.js';

export const FINANCIAL_PROGRESSION_ENGINE_VERSION = '1.8.0';
export const SUPPORTED_PROGRESSION_HORIZONS = Object.freeze([30, 60, 90]);

const round = (value, digits=0) => Number(Number(value || 0).toFixed(digits));
const clamp = (value, min=0, max=100) => Math.min(max, Math.max(min, Number(value || 0)));
const clone = value => JSON.parse(JSON.stringify(value));
const unique = values => [...new Set(values.filter(Boolean))];
const moneyStep = value => Math.max(0, Math.round(Number(value || 0) / 1000) * 1000);

function stableId(prefix, parts) {
  const input = parts.map(value => String(value ?? '')).join('|');
  let hash = 2166136261;
  for (let i=0;i<input.length;i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return `${prefix}-${(hash >>> 0).toString(16).toUpperCase().padStart(8,'0')}`;
}

function validateInputs(inputs) {
  const required = ['data','quality','incluscore','health','debt','recommendation','policyEvaluation'];
  required.forEach(key => { if (!inputs?.[key]) throw new TypeError(`${key} is required`); });
  if (!inputs.data.person?.id) throw new TypeError('A beneficiary identifier is required');
}

function classifyNeed({ data, quality, incluscore, health, debt, recommendation }, policy) {
  if (quality.confidence < policy.targets.confidence || ['missing','conflict','lowConfidence'].includes(data.scenarioId)) return 'complete-evidence';
  if (debt.overIndebtedness.riskScore > policy.targets.maximumDebtRisk) return 'stabilise-debt';
  if (health.score < policy.targets.financialHealth || incluscore.score < policy.targets.incluscore) return 'strengthen-finances';
  if (recommendation.recommendationCode === 'reduced') return 'align-request';
  return 'consolidate-strengths';
}

function createAction(id, category, priority, dueDay, target, measurement, evidenceRequired, responsibleRole, rationale) {
  return { id, category, priority, dueDay, target, measurement, evidenceRequired, responsibleRole, rationale, status:'planned', requiresVerification:true };
}

function buildActions(inputs, policy, horizonDays) {
  const { data, quality, incluscore, health, debt, recommendation } = inputs;
  const months = Math.max(1, horizonDays / 30);
  const actions=[];
  const evidenceTarget = policy.minimumVerifiedEvidenceByHorizon[horizonDays];
  const trackingPeriods = policy.minimumTrackingPeriodsByHorizon[horizonDays];
  const minimumReserve = Number(health.amounts.minimumRestToLive || 0);
  const safeHeadroom = Number(health.amounts.safeAdditionalMonthlyPayment || 0);
  const savingsBase = Math.max(5000, Math.min(
    Number(data.profile.essentialExpenses || 0) * 0.20,
    Math.max(safeHeadroom, 15000) * policy.savingsRate * months
  ));
  const savingsTarget = moneyStep(savingsBase);
  const activeDebtCount = Number(debt.summary.activeDebtCount || 0);
  const provisionalDebtCount = Number(debt.summary.provisionalDebtCount || 0);
  const contestedDebtCount = Number(debt.summary.contestedDebtCount || 0);

  if (quality.confidence < 95 || incluscore.publishedBand === 'toComplete' || ['missing','conflict','lowConfidence'].includes(data.scenarioId)) {
    actions.push(createAction('ACT-EVIDENCE-VERIFY','evidence','critical',Math.min(15,horizonDays),
      `${evidenceTarget} verified evidence item(s)`, 'verified-evidence-count',
      ['dated-sales-record','source-confirmation','agent-verification'], 'beneficiary-and-field-agent',
      'Increase the reliability and traceability of locally available financial evidence.'));
  }
  actions.push(createAction('ACT-CASHFLOW-TRACK','cashflow','high',horizonDays,
    `${trackingPeriods} complete tracking period(s)`, 'complete-cashflow-periods',
    ['sales-register','expense-register','period-closing-summary'], 'beneficiary',
    'Document inflows and essential outflows without mixing personal and business movements.'));

  actions.push(createAction('ACT-SAVINGS-BUFFER','savings',health.score < policy.targets.financialHealth ? 'critical':'medium',horizonDays,
    savingsTarget, 'additional-verified-savings', ['savings-statement','cooperative-contribution-proof'], 'beneficiary',
    'Build a modest emergency buffer without reducing essential living expenditure.'));

  if (provisionalDebtCount || contestedDebtCount || debt.flags?.includes('profile-debt-mismatch')) {
    actions.push(createAction('ACT-DEBT-RECONCILE','debt','critical',Math.min(30,horizonDays),
      '100% of provisional or contested commitments reviewed', 'debt-reconciliation-rate',
      ['creditor-statement','beneficiary-explanation','human-review-note'], 'credit-analyst',
      'Resolve uncertainty around debt service before any new commitment.'));
  } else {
    actions.push(createAction('ACT-DEBT-DISCIPLINE','debt',activeDebtCount ? 'high':'medium',horizonDays,
      'No missed payment and no unassessed new debt', 'payment-discipline',
      ['payment-receipts','debt-declaration-update'], 'beneficiary',
      'Preserve repayment discipline and prevent hidden multi-indebtedness.'));
  }

  actions.push(createAction('ACT-EXPENSE-REVIEW','expenses','medium',Math.min(45,horizonDays),
    `${Math.min(horizonDays,30)} days of essential-expense review`, 'expense-review-days',
    ['expense-log','beneficiary-validation'], 'beneficiary-and-agent',
    'Identify avoidable leakage without imposing an unrealistic reduction in essential expenses.'));

  if (Number(data.profile.cooperativeMembershipMonths || 0) > 0) {
    actions.push(createAction('ACT-COOP-CONTINUITY','cooperative','medium',horizonDays,
      `${trackingPeriods} regular cooperative contribution(s)`, 'verified-cooperative-contributions',
      ['cooperative-ledger-entry'], 'beneficiary-and-cooperative',
      'Maintain the cooperative evidence that supports continuity and financial discipline.'));
  }

  actions.push(createAction('ACT-FINANCIAL-LEARNING','learning','low',Math.min(30,horizonDays),
    'Complete one short module on debt and cashflow planning', 'learning-module-completion',
    ['module-completion-record'], 'beneficiary',
    'Strengthen understanding of payment capacity, total cost and over-indebtedness risk.'));

  if (recommendation.recommendationCode === 'reduced') {
    actions.push(createAction('ACT-REQUEST-ALIGN','request','high',Math.min(20,horizonDays),
      Number(recommendation.proposedFinancing.principal || 0), 'revised-request-amount',
      ['revised-financing-plan','beneficiary-confirmation'], 'beneficiary-and-analyst',
      'Align the request with the amount that currently survives affordability safeguards.'));
  }

  const order = { critical:0, high:1, medium:2, low:3 };
  return actions.sort((a,b) => (order[a.priority] - order[b.priority]) || (a.dueDay - b.dueDay));
}

function calculatePotential(inputs, policy, horizonDays, actions) {
  const months = horizonDays / 30;
  const { quality, incluscore, health, debt } = inputs;
  const evidenceAction = actions.some(x => x.category === 'evidence');
  const savingsAction = actions.find(x => x.category === 'savings');
  const debtReconciliation = actions.some(x => x.id === 'ACT-DEBT-RECONCILE');
  const cashflowAction = actions.some(x => x.category === 'cashflow');
  const expenseAction = actions.some(x => x.category === 'expenses');

  const confidencePotential = Math.min(95 - quality.confidence,
    (evidenceAction ? 4 + months * 2 : 1) + (cashflowAction ? months * 1.5 : 0));
  const healthPotential = Math.min(92 - health.score,
    (savingsAction ? 2 + months * 2 : 0) + (expenseAction ? 2 : 0) + (debtReconciliation ? 5 : 0));
  const debtRiskReduction = Math.min(debt.overIndebtedness.riskScore,
    (debtReconciliation ? 12 + months * 4 : 0) + (actions.some(x => x.id === 'ACT-DEBT-DISCIPLINE') ? months * 2 : 0));
  const incluscorePotential = Math.min(90 - incluscore.score,
    confidencePotential * 0.25 + healthPotential * 0.45 + debtRiskReduction * 0.20 + (cashflowAction ? months * 1.5 : 0));
  const expenseOptimisation = Number(inputs.data.profile.essentialExpenses || 0) * policy.maximumExpenseOptimisationRate * Math.min(1, months/3);
  const debtServiceReduction = Number(debt.summary.conservativeMonthlyService || 0) * policy.maximumDebtServiceReductionRate * Math.min(1, months/3);
  const savingsMonthlyEffect = Number(savingsAction?.target || 0) / Math.max(1, months) * 0.10;
  const safePaymentPotential = Math.max(0, expenseOptimisation + debtServiceReduction + savingsMonthlyEffect);

  return {
    confidence:round(Math.max(0,confidencePotential),2), incluscore:round(Math.max(0,incluscorePotential),2),
    financialHealth:round(Math.max(0,healthPotential),2), debtRiskReduction:round(Math.max(0,debtRiskReduction),2),
    safeAdditionalPayment:moneyStep(safePaymentPotential)
  };
}

export function createFinancialProgressionPlan(inputs={}, options={}) {
  validateInputs(inputs);
  const horizonDays = Number(options.horizonDays || 90);
  if (!SUPPORTED_PROGRESSION_HORIZONS.includes(horizonDays)) throw new RangeError('Progression horizon must be 30, 60 or 90 days');
  const policyId = options.policyId || inputs.policyEvaluation.policy.id || 'balanced';
  const policy = getFinancialProgressionPolicy(policyId);
  const actions = buildActions(inputs, policy, horizonDays);
  const need = classifyNeed(inputs, policy);
  const potential = calculatePotential(inputs, policy, horizonDays, actions);
  const planId = stableId('PROG', [inputs.data.person.id, inputs.recommendation.referenceId, horizonDays, policy.version, FINANCIAL_PROGRESSION_ENGINE_VERSION]);

  return {
    planId, engineVersion:FINANCIAL_PROGRESSION_ENGINE_VERSION, schemaVersion:'1.0', horizonDays,
    createdAt:String(options.createdAt || '2026-08-06T16:45:00.000Z'),
    beneficiary:{ id:inputs.data.person.id, name:inputs.data.person.name },
    policy:{ id:policy.id, version:policy.version, targets:clone(policy.targets) },
    need,
    baseline:{
      dataConfidence:round(inputs.quality.confidence), incluscore:round(inputs.incluscore.score),
      financialHealth:round(inputs.health.score), overIndebtednessRisk:round(inputs.debt.overIndebtedness.riskScore),
      safeAdditionalMonthlyPayment:round(inputs.health.amounts.safeAdditionalMonthlyPayment),
      recommendationCode:inputs.recommendation.recommendationCode,
      proposedPrincipal:round(inputs.recommendation.proposedFinancing.principal)
    },
    actions,
    potential,
    measurableTargets:{
      verifiedEvidence:policy.minimumVerifiedEvidenceByHorizon[horizonDays],
      completeCashflowPeriods:policy.minimumTrackingPeriodsByHorizon[horizonDays],
      additionalSavings:Number(actions.find(x => x.category === 'savings')?.target || 0),
      debtReviewRequired:actions.some(x => x.id === 'ACT-DEBT-RECONCILE'),
      learningModules:1
    },
    dataUsed:[
      { key:'dataConfidence', value:inputs.quality.confidence, sourceEngine:'Data Quality & Confidence Engine', version:inputs.quality.engineVersion },
      { key:'incluscore', value:inputs.incluscore.score, sourceEngine:'INCLUSCORE Engine', version:inputs.incluscore.engineVersion },
      { key:'financialHealth', value:inputs.health.score, sourceEngine:'Financial Health Engine', version:inputs.health.engineVersion },
      { key:'overIndebtednessRisk', value:inputs.debt.overIndebtedness.riskScore, sourceEngine:'Debt & Over-Indebtedness Engine', version:inputs.debt.engineVersion },
      { key:'recommendationCode', value:inputs.recommendation.recommendationCode, sourceEngine:'Recommendation Orchestrator', version:inputs.recommendation.engineVersion }
    ],
    excludedData:['religion','ethnicity','political-opinion','private-messages','phone-contacts','social-media-behaviour','unconsented-third-party-data'],
    assumptions:[
      'actions-must-be-completed-and-verified', 'no-score-increase-is-guaranteed',
      'future-assessment-reruns-all-engines-with-new-evidence', 'essential-expenses-must-not-be-artificially-suppressed',
      'no-new-unassessed-debt-during-plan'
    ],
    safeguards:{
      automaticCreditDecisionAllowed:false, guaranteedScoreIncrease:false, humanValidationRequired:true,
      planIsNotCreditApproval:true, completedActionRequiresVerification:true, essentialNeedsProtected:true,
      reassessmentRequiredAfterPlan:true
    }
  };
}

function projectionRange(value, confidence, multiplier=1) {
  const baseWidth = confidence >= 85 ? 3 : confidence >= 70 ? 5 : 8;
  const width = Math.max(2, Math.round(baseWidth * multiplier));
  return { low:round(clamp(value-width)), central:round(clamp(value)), high:round(clamp(value+width)) };
}

export function simulateFinancialProgression(plan, options={}) {
  if (!plan?.planId || !plan?.baseline || !plan?.potential) throw new TypeError('A valid financial progression plan is required');
  const intensityId = options.intensity || 'recommended';
  const intensity = PROGRESSION_INTENSITIES[intensityId];
  if (!intensity) throw new Error(`Unknown progression intensity: ${intensityId}`);
  const completionRatio = clamp(Number(options.completionRatio ?? 100),0,100) / 100;
  const achievement = Math.min(1.20, intensity.factor * completionRatio);
  const current = plan.baseline;
  const projectedConfidence = clamp(current.dataConfidence + plan.potential.confidence * achievement);
  const projectedIncluscore = clamp(current.incluscore + plan.potential.incluscore * achievement);
  const projectedHealth = clamp(current.financialHealth + plan.potential.financialHealth * achievement);
  const projectedDebtRisk = clamp(current.overIndebtednessRisk - plan.potential.debtRiskReduction * achievement);
  const projectedPayment = Math.max(0, round(current.safeAdditionalMonthlyPayment + plan.potential.safeAdditionalPayment * achievement));
  const uncertaintyMultiplier = intensity.uncertaintyMultiplier * (1 + (1-completionRatio)*0.5);

  const targets = plan.policy.targets;
  const gates = [
    { id:'confidence-target', passed:projectedConfidence >= targets.confidence, projected:round(projectedConfidence), target:targets.confidence },
    { id:'incluscore-target', passed:projectedIncluscore >= targets.incluscore, projected:round(projectedIncluscore), target:targets.incluscore },
    { id:'health-target', passed:projectedHealth >= targets.financialHealth, projected:round(projectedHealth), target:targets.financialHealth },
    { id:'debt-risk-target', passed:projectedDebtRisk <= targets.maximumDebtRisk, projected:round(projectedDebtRisk), target:targets.maximumDebtRisk }
  ];
  const readiness = gates.every(x => x.passed) ? 'eligible-for-human-reassessment' : gates.filter(x => x.passed).length >= 2 ? 'continue-with-targeted-actions' : 'stabilisation-priority';

  return {
    simulationId:stableId('PROG-SIM',[plan.planId,intensityId,completionRatio,FINANCIAL_PROGRESSION_ENGINE_VERSION]),
    engineVersion:FINANCIAL_PROGRESSION_ENGINE_VERSION, planId:plan.planId, intensity:intensityId,
    completionRatio:round(completionRatio*100), achievementFactor:round(achievement,2),
    projected:{
      dataConfidence:{ current:current.dataConfidence, ...projectionRange(projectedConfidence,current.dataConfidence,intensity.uncertaintyMultiplier) },
      incluscore:{ current:current.incluscore, ...projectionRange(projectedIncluscore,current.dataConfidence,intensity.uncertaintyMultiplier) },
      financialHealth:{ current:current.financialHealth, ...projectionRange(projectedHealth,current.dataConfidence,intensity.uncertaintyMultiplier) },
      overIndebtednessRisk:{ current:current.overIndebtednessRisk, low:round(clamp(projectedDebtRisk-3)), central:round(projectedDebtRisk), high:round(clamp(projectedDebtRisk+3)) },
      safeAdditionalMonthlyPayment:{ current:current.safeAdditionalMonthlyPayment, low:Math.max(0,round(projectedPayment*0.80)), central:projectedPayment, high:round(projectedPayment*1.10) }
    },
    gates, readiness,
    message:readiness === 'eligible-for-human-reassessment' ? 'plan-may-support-human-reassessment' : readiness === 'continue-with-targeted-actions' ? 'continue-targeted-progression' : 'stabilise-before-reassessment',
    assumptions:clone(plan.assumptions),
    uncertainties:unique([
      'projection-is-not-a-guaranteed-future-score',
      'actual-result-depends-on-new-verified-evidence',
      ...(current.dataConfidence < 70 ? ['current-data-confidence-limits-projection'] : []),
      ...(current.overIndebtednessRisk > 70 ? ['debt-risk-may-require-restructuring-not-only-progression'] : [])
    ]),
    safeguards:{
      automaticDecisionAllowed:false, projectionIsBinding:false, humanReassessmentRequired:true,
      currentDecisionUnchanged:true, creditApprovalGuaranteed:false, futureEngineRerunRequired:true
    }
  };
}

export function calculateProgressTracking(plan, completedActionIds=[]) {
  if (!plan?.actions) throw new TypeError('A valid plan is required');
  const completed = new Set((completedActionIds || []).map(String));
  const actions = plan.actions.map(action => ({ ...clone(action), status:completed.has(action.id) ? 'completed-pending-verification':'planned' }));
  const completedCount = actions.filter(x => x.status !== 'planned').length;
  return {
    planId:plan.planId, totalActions:actions.length, completedCount,
    completionPercent:actions.length ? round(completedCount/actions.length*100) : 0,
    verifiedCompletionPercent:0,
    actions,
    safeguard:'demo-completion-does-not-alter-financial-results-until-human-verification'
  };
}

export const RECOMMENDATION_ORCHESTRATOR_VERSION = '1.5.0';

function stableId(parts) {
  const input = parts.map(value => String(value ?? '')).join('|');
  let hash = 2166136261;
  for (let i=0; i<input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `REC-${(hash >>> 0).toString(16).toUpperCase().padStart(8,'0')}`;
}

const unique = values => [...new Set(values.filter(Boolean))];

function detectConflicts({ quality, incluscore, health, debt, simulation, policyEvaluation }) {
  const conflicts = [];
  if (incluscore.score >= 65 && quality.confidence < policyEvaluation.policy.thresholds.minimumDataConfidence) {
    conflicts.push({ id:'score-confidence-conflict', severity:'blocking', engines:['INCLUSCORE Engine','Data Quality & Confidence Engine'], detail:{ score:incluscore.score, confidence:quality.confidence } });
  }
  if (health.score >= 65 && debt.overIndebtedness.riskScore > policyEvaluation.policy.thresholds.maximumOverIndebtednessRisk) {
    conflicts.push({ id:'health-debt-conflict', severity:'blocking', engines:['Financial Health Engine','Debt & Over-Indebtedness Engine'], detail:{ health:health.score, debtRisk:debt.overIndebtedness.riskScore } });
  }
  if (simulation.recommended.principal > 0 && policyEvaluation.blockingFailures.length) {
    conflicts.push({ id:'simulation-policy-conflict', severity:'blocking', engines:['Responsible Credit Simulation Engine','Policy & Rules Engine'], detail:{ principal:simulation.recommended.principal, blockingRules:policyEvaluation.blockingFailures } });
  }
  if (simulation.recommendation === 'supported' && incluscore.publishedBand !== 'favorable') {
    conflicts.push({ id:'simulation-score-conflict', severity:'warning', engines:['Responsible Credit Simulation Engine','INCLUSCORE Engine'], detail:{ simulation:simulation.recommendation, scoreBand:incluscore.publishedBand } });
  }
  if (simulation.recommended.principal > 0 && simulation.stressTests.some(test => ['income-minus-20','combined-seasonal-shock'].includes(test.id) && !test.survives)) {
    conflicts.push({ id:'stress-resilience-conflict', severity:'warning', engines:['Responsible Credit Simulation Engine','Seasonal Finance Engine'], detail:{ failedStressTests:simulation.stressTests.filter(test => !test.survives).map(test => test.id) } });
  }
  return conflicts;
}

function detectConvergences({ quality, incluscore, health, debt, simulation, policyEvaluation }) {
  const items = [];
  if (quality.confidence >= policyEvaluation.policy.thresholds.minimumDataConfidence) items.push({ id:'confidence-policy-aligned', engines:['Data Quality & Confidence Engine','Policy & Rules Engine'] });
  if (incluscore.score >= policyEvaluation.policy.thresholds.minimumIncluscore) items.push({ id:'score-policy-aligned', engines:['INCLUSCORE Engine','Policy & Rules Engine'] });
  if (health.score >= policyEvaluation.policy.thresholds.minimumFinancialHealth) items.push({ id:'health-policy-aligned', engines:['Financial Health Engine','Policy & Rules Engine'] });
  if (debt.overIndebtedness.riskScore <= policyEvaluation.policy.thresholds.maximumOverIndebtednessRisk) items.push({ id:'debt-policy-aligned', engines:['Debt & Over-Indebtedness Engine','Policy & Rules Engine'] });
  if (simulation.recommended.principal > 0 && simulation.selectedSchedule.every(row => row.affordable)) items.push({ id:'schedule-capacity-aligned', engines:['Responsible Credit Simulation Engine','Financial Health Engine'] });
  return items;
}

function recommendationCode(inputs, conflicts) {
  const { quality, incluscore, health, debt, simulation, policyEvaluation } = inputs;
  if (!policyEvaluation.isEffective) return 'humanReview';
  if (quality.confidence < policyEvaluation.policy.thresholds.minimumDataConfidence || incluscore.publishedBand === 'toComplete' || policyEvaluation.blockingFailures.includes('EVD-COV-001')) return 'toComplete';
  if (debt.overIndebtedness.band === 'critical' || health.band === 'critical' || ['fragile','improvement'].includes(incluscore.publishedBand) || simulation.recommendation === 'improvement') return 'improvement';
  if (policyEvaluation.blockingFailures.length || conflicts.some(item => item.severity === 'blocking')) return 'humanReview';
  if (simulation.recommendation === 'reduced' || simulation.recommended.principal < simulation.request.amount) return 'reduced';
  if (simulation.recommendation === 'conditional' || policyEvaluation.summary.warnings || conflicts.length || simulation.conditions.length > 1) return 'conditional';
  return 'supported';
}

function rationale(inputs, code) {
  const { quality, incluscore, health, debt, simulation, policyEvaluation } = inputs;
  const rows = [
    { id:'data-confidence', tone:quality.confidence >= policyEvaluation.policy.thresholds.minimumDataConfidence ? 'positive':'blocking', actual:quality.confidence, threshold:policyEvaluation.policy.thresholds.minimumDataConfidence, source:'Data Quality & Confidence Engine' },
    { id:'incluscore', tone:incluscore.score >= policyEvaluation.policy.thresholds.minimumIncluscore ? 'positive':'caution', actual:incluscore.score, threshold:policyEvaluation.policy.thresholds.minimumIncluscore, source:'INCLUSCORE Engine' },
    { id:'financial-health', tone:health.score >= policyEvaluation.policy.thresholds.minimumFinancialHealth ? 'positive':'blocking', actual:health.score, threshold:policyEvaluation.policy.thresholds.minimumFinancialHealth, source:'Financial Health Engine' },
    { id:'over-indebtedness', tone:debt.overIndebtedness.riskScore <= policyEvaluation.policy.thresholds.maximumOverIndebtednessRisk ? 'positive':'blocking', actual:debt.overIndebtedness.riskScore, threshold:policyEvaluation.policy.thresholds.maximumOverIndebtednessRisk, source:'Debt & Over-Indebtedness Engine' },
    { id:'recommended-principal', tone:simulation.recommended.principal > 0 ? (simulation.recommended.principal < simulation.request.amount ? 'caution':'positive'):'blocking', actual:simulation.recommended.principal, threshold:simulation.request.amount, source:'Responsible Credit Simulation Engine' },
    { id:'policy-compliance', tone:policyEvaluation.summary.blockingFailures ? 'blocking' : policyEvaluation.summary.warnings ? 'caution':'positive', actual:policyEvaluation.summary.passed, threshold:policyEvaluation.summary.total, source:'Policy & Rules Engine' }
  ];
  if (code === 'toComplete') rows.unshift({ id:'complete-file-before-conclusion', tone:'blocking', actual:quality.confidence, threshold:policyEvaluation.policy.thresholds.minimumDataConfidence, source:'Recommendation Orchestrator' });
  return rows;
}

export function orchestrateRecommendation(inputs={}, options={}) {
  const required = ['data','quality','incluscore','health','debt','simulation','policyEvaluation'];
  required.forEach(key => { if (!inputs[key]) throw new TypeError(`${key} is required`); });
  const conflicts = detectConflicts(inputs);
  const convergences = detectConvergences(inputs);
  const code = recommendationCode(inputs, conflicts);
  const { data, quality, incluscore, health, debt, simulation, policyEvaluation } = inputs;
  const policyActions = policyEvaluation.requiredActions || [];
  const simulationConditions = simulation.conditions || [];
  const conditions = unique([
    ...policyActions,
    ...simulationConditions,
    ...(conflicts.filter(item => item.severity === 'warning').map(item => `resolve-${item.id}`)),
    'final-human-credit-review'
  ]);
  const blockingIssues = unique([
    ...policyEvaluation.blockingFailures,
    ...conflicts.filter(item => item.severity === 'blocking').map(item => item.id)
  ]);
  const principal = ['toComplete','improvement','humanReview'].includes(code) ? 0 : Number(simulation.recommended.principal || 0);
  const referenceId = stableId([
    data.person?.id,
    policyEvaluation.policy.version,
    quality.confidence,
    incluscore.score,
    health.score,
    debt.overIndebtedness.riskScore,
    simulation.request.amount,
    principal,
    code
  ]);

  return {
    referenceId,
    recommendationCode:code,
    recommendationScope:'decision-support-only',
    proposedFinancing:{
      requestedAmount:Number(simulation.request.amount || 0),
      principal,
      durationMonths:Number(simulation.recommended.durationMonths || 0),
      scheduleType:simulation.recommended.scheduleType,
      maximumPayment:principal ? Number(simulation.recommended.maximumPayment || 0) : 0,
      averagePayment:principal ? Number(simulation.recommended.averagePayment || 0) : 0,
      totalInterest:principal ? Number(simulation.recommended.totalInterest || 0) : 0,
      totalCost:principal ? Number(simulation.recommended.totalCost || 0) : 0,
      totalRepayable:principal ? Number(simulation.recommended.totalRepayable || 0) : 0
    },
    indicators:{
      dataConfidence:Number(quality.confidence || 0),
      incluscore:Number(incluscore.score || 0),
      incluscoreBand:incluscore.publishedBand,
      financialHealth:Number(health.score || 0),
      financialHealthBand:health.band,
      overIndebtednessRisk:Number(debt.overIndebtedness.riskScore || 0),
      overIndebtednessBand:debt.overIndebtedness.band,
      policyPassRate:Number(policyEvaluation.summary.passRate || 0)
    },
    rationale:rationale(inputs, code),
    convergences,
    conflicts,
    conditions,
    blockingIssues,
    engineAssessments:[
      { engine:'Data Quality & Confidence Engine', version:quality.engineVersion, result:`${quality.confidence}/100`, status:quality.band },
      { engine:'INCLUSCORE Engine', version:incluscore.engineVersion, result:`${incluscore.score}/100`, status:incluscore.publishedBand },
      { engine:'Financial Health Engine', version:health.engineVersion, result:`${health.score}/100`, status:health.band },
      { engine:'Debt & Over-Indebtedness Engine', version:debt.engineVersion, result:`${debt.overIndebtedness.riskScore}/100`, status:debt.overIndebtedness.band },
      { engine:'Responsible Credit Simulation Engine', version:simulation.engineVersion, result:String(simulation.recommended.principal), status:simulation.recommendation },
      { engine:'Policy & Rules Engine', version:policyEvaluation.engineVersion, result:`${policyEvaluation.summary.passed}/${policyEvaluation.summary.total}`, status:policyEvaluation.status }
    ],
    humanReview:{
      required:true,
      status:'pending',
      decisionOptions:['approve-proposal','approve-with-conditions','reduce-amount','request-more-evidence','defer-for-improvement','decline-with-reason'],
      overrideRequiresReason:true,
      secondReviewRequired:blockingIssues.length > 0 || debt.overIndebtedness.band === 'critical',
      finalDecision:null,
      decidedBy:null,
      decidedAt:null
    },
    excludedData:unique([...policyEvaluation.excludedData, ...(simulation.excludedData || [])]),
    uncertainties:unique([
      ...(simulation.uncertainties || []),
      ...(quality.uncertainties || []),
      ...(conflicts.map(item => item.id))
    ]),
    versions:{
      orchestrator:RECOMMENDATION_ORCHESTRATOR_VERSION,
      institutionalPolicy:policyEvaluation.policy.version,
      policyRules:policyEvaluation.engineVersion,
      dataQuality:quality.engineVersion,
      incluscore:incluscore.engineVersion,
      financialHealth:health.engineVersion,
      debt:debt.engineVersion,
      simulation:simulation.engineVersion
    },
    audit:{
      deterministic:true,
      inputMutationAllowed:false,
      generatedFromRuleIds:policyEvaluation.rules.map(rule => rule.id),
      conflictCount:conflicts.length,
      convergenceCount:convergences.length
    },
    safeguards:{
      automaticCreditDecisionAllowed:false,
      recommendationIsBinding:false,
      humanValidationRequired:true,
      overrideRequiresReason:true,
      appealPrepared:true
    }
  };
}

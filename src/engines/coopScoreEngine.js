import { getCoopScorePolicy, validateCoopScorePolicy } from '../config/coopScorePolicies.js';

export const COOP_SCORE_ENGINE_VERSION = '2.0.0';

const clamp = (value,min=0,max=100) => Math.max(min,Math.min(max,Number(value || 0)));
const round = (value,precision=0) => {
  const factor = 10 ** precision;
  return Math.round(Number(value || 0) * factor) / factor;
};
const average = values => values.length ? values.reduce((sum,value)=>sum+Number(value || 0),0) / values.length : 0;
const clone = value => JSON.parse(JSON.stringify(value));

function scoreGovernance(coop={}) {
  const governance = coop.governance || {};
  const components = [
    { id:'documents-current', value:coop.governanceDocumentsCurrent ? 100 : 25 },
    { id:'meeting-attendance', value:clamp(Number(coop.meetingAttendance || 0) * 100) },
    { id:'minutes-coverage', value:clamp(Number(governance.minutesCoverage || 0) * 100) },
    { id:'dual-authorisation', value:governance.dualAuthorization ? 100 : 35 },
    { id:'financial-reports-current', value:governance.financialReportsCurrent ? 100 : 30 },
    { id:'grievance-mechanism', value:governance.grievanceMechanism ? 100 : 45 }
  ];
  return { score:round(average(components.map(x=>x.value))), components };
}

function scoreContributionDiscipline(coop={}) {
  const history = Array.isArray(coop.contributionHistory) ? coop.contributionHistory : [];
  const declared = clamp(Number(coop.monthlyContributionDiscipline || 0) * 100);
  const collectionRates = history.map(row => Number(row.expected || 0) > 0 ? clamp(Number(row.collected || 0) / Number(row.expected || 1) * 100) : 0);
  const observed = collectionRates.length ? average(collectionRates) : declared;
  const consistency = collectionRates.length > 1 ? clamp(100 - (Math.max(...collectionRates) - Math.min(...collectionRates))) : declared;
  return { score:round(average([declared,observed,consistency])), components:[{id:'declared-discipline',value:declared},{id:'observed-collection-rate',value:round(observed)},{id:'collection-consistency',value:round(consistency)}] };
}

function scoreInternalRepayment(coop={}) {
  const portfolio = coop.internalLoanPortfolio || {};
  const repaymentRate = clamp(Number(coop.internalLoanRepaymentRate || 0) * 100);
  const arrearsRate = Number(portfolio.outstandingPrincipal || 0) > 0 ? clamp(Number(portfolio.arrearsAmount || 0) / Number(portfolio.outstandingPrincipal || 1) * 100) : 0;
  const arrearsScore = clamp(100 - arrearsRate * 4);
  const rescheduledShare = Number(portfolio.activeLoans || 0) > 0 ? clamp(Number(portfolio.rescheduledLoans || 0) / Number(portfolio.activeLoans || 1) * 100) : 0;
  const rescheduleScore = clamp(100 - rescheduledShare * 2.5);
  return { score:round(average([repaymentRate,arrearsScore,rescheduleScore])), components:[{id:'repayment-rate',value:repaymentRate},{id:'arrears-control',value:round(arrearsScore)},{id:'rescheduling-control',value:round(rescheduleScore)}] };
}

function scoreFinancialCapacity(coop={}, cashflow={}, debt={}, requestAmount=0, policy) {
  const monthlyPrudentInflow = Number(cashflow.summary?.averagePrudentInflow || cashflow.averagePrudentInflow || 0);
  const monthlyPrudentOutflow = Number(cashflow.summary?.averagePrudentOutflow || cashflow.averagePrudentOutflow || 0);
  const monthlyPrudentNet = Number(cashflow.summary?.averagePrudentNet || cashflow.averagePrudentNet || (monthlyPrudentInflow - monthlyPrudentOutflow));
  const annualPrudentNet = Math.max(0,monthlyPrudentNet * 12);
  const debtService = Number(debt.summary?.conservativeMonthlyService || 0);
  const debtServiceRatio = monthlyPrudentInflow > 0 ? debtService / monthlyPrudentInflow : 1;
  const debtScore = clamp((1 - debtServiceRatio / Math.max(0.01,policy.limits.maxDebtServiceRatio)) * 100);
  const requestCoverage = requestAmount > 0 ? annualPrudentNet / requestAmount : 1;
  const coverageScore = clamp(requestCoverage * 85);
  const operatingMargin = monthlyPrudentInflow > 0 ? monthlyPrudentNet / monthlyPrudentInflow : 0;
  const marginScore = clamp(operatingMargin * 260);
  return {
    score:round(average([debtScore,coverageScore,marginScore])),
    components:[{id:'debt-service-capacity',value:round(debtScore)},{id:'request-coverage',value:round(coverageScore)},{id:'operating-margin',value:round(marginScore)}],
    metrics:{ monthlyPrudentInflow:round(monthlyPrudentInflow), monthlyPrudentOutflow:round(monthlyPrudentOutflow), monthlyPrudentNet:round(monthlyPrudentNet), annualPrudentNet:round(annualPrudentNet), debtService:round(debtService), debtServiceRatio:round(debtServiceRatio*100,1), requestCoverage:round(requestCoverage,2) }
  };
}

function scoreSavingsResilience(coop={}, profile={}, cashflow={}, policy) {
  const savings = Number(coop.collectiveSavings ?? profile.savings ?? 0);
  const monthlyOutflow = Number(cashflow.summary?.averagePrudentOutflow || cashflow.averagePrudentOutflow || 0);
  const monthsCovered = monthlyOutflow > 0 ? savings / monthlyOutflow : 0;
  const score = clamp(monthsCovered / Math.max(0.1,policy.limits.targetSavingsMonths) * 100);
  return { score:round(score), components:[{id:'months-of-outflows-covered',value:round(score)}], metrics:{ savings:round(savings), monthlyOutflow:round(monthlyOutflow), monthsCovered:round(monthsCovered,2) } };
}

function scoreMemberStability(coop={}) {
  const total = Math.max(1,Number(coop.memberCount || 0));
  const active = clamp(Number(coop.activeMemberCount ?? total) / total * 100);
  const stable = clamp(Number(coop.stableMembers12m ?? coop.activeMemberCount ?? total) / total * 100);
  const retention = clamp((1 - Number(coop.exits12m || 0) / total) * 100);
  return { score:round(average([active,stable,retention])), components:[{id:'active-members',value:round(active)},{id:'stable-members',value:round(stable)},{id:'retention',value:round(retention)}] };
}

function scoreRiskDiversification(coop={}, policy) {
  const risk = coop.riskConcentration || {};
  const mapping = { low:92, moderate:72, high:42, critical:20 };
  const concentration = mapping[coop.concentrationRisk] ?? 60;
  const buyerShare = clamp(Number(risk.topBuyerShare || 0) / Math.max(0.01,policy.limits.maxTopBuyerShare) * 100);
  const buyerScore = clamp(100 - Math.max(0,buyerShare - 60) * 1.4);
  const memberExposure = clamp(Number(risk.topMemberExposure || 0) / Math.max(0.01,policy.limits.maxTopMemberExposure) * 100);
  const memberScore = clamp(100 - Math.max(0,memberExposure - 60) * 1.4);
  const sectorCountScore = clamp(Number(risk.activeRevenueStreams || 1) * 24);
  return { score:round(average([concentration,buyerScore,memberScore,sectorCountScore])), components:[{id:'declared-concentration',value:concentration},{id:'buyer-diversification',value:round(buyerScore)},{id:'member-exposure-control',value:round(memberScore)},{id:'revenue-stream-diversity',value:round(sectorCountScore)}], metrics:{ topBuyerShare:round(Number(risk.topBuyerShare || 0)*100,1), topMemberExposure:round(Number(risk.topMemberExposure || 0)*100,1), activeRevenueStreams:Number(risk.activeRevenueStreams || 1) } };
}

function confidenceAssessment(coop={}, quality={}) {
  const required = [
    coop.memberCount, coop.activeMemberCount, coop.monthlyContributionDiscipline, coop.meetingAttendance,
    coop.governanceDocumentsCurrent, coop.internalLoanRepaymentRate, coop.concentrationRisk,
    coop.governance?.minutesCoverage, coop.internalLoanPortfolio?.outstandingPrincipal,
    coop.riskConcentration?.topBuyerShare
  ];
  const completeness = required.filter(value => value !== undefined && value !== null && value !== '').length / required.length * 100;
  const evidenceConfidence = Number(quality.confidence || 0);
  const sourceCoverage = Array.isArray(coop.contributionHistory) && coop.contributionHistory.length >= 3 ? 100 : 55;
  const confidence = round(average([completeness,evidenceConfidence,sourceCoverage]));
  return { confidence, components:{ completeness:round(completeness), evidenceConfidence:round(evidenceConfidence), sourceCoverage } };
}

function bandFor(score,bands) {
  if (score >= bands.strong) return 'strong';
  if (score >= bands.satisfactory) return 'satisfactory';
  if (score >= bands.watch) return 'watch';
  return 'fragile';
}

export function calculateCoopScore(inputs, options={}) {
  if (!inputs?.data?.cooperativeProfile) throw new TypeError('cooperative profile is required');
  const policy = getCoopScorePolicy(options.policyId || 'balanced');
  if (!validateCoopScorePolicy(policy)) throw new TypeError('invalid COOP-SCORE policy');
  const data = inputs.data;
  const coop = data.cooperativeProfile;
  const axesRaw = {
    governance:scoreGovernance(coop),
    contributionDiscipline:scoreContributionDiscipline(coop),
    internalRepayment:scoreInternalRepayment(coop),
    financialCapacity:scoreFinancialCapacity(coop,inputs.cashflow,inputs.debt,data.creditRequest?.amount || data.profile?.requestedAmount || 0,policy),
    savingsResilience:scoreSavingsResilience(coop,data.profile || {},inputs.cashflow || {},policy),
    memberStability:scoreMemberStability(coop),
    riskDiversification:scoreRiskDiversification(coop,policy)
  };
  const axes = Object.entries(axesRaw).map(([id,result]) => ({ id, score:result.score, weight:policy.weights[id], weightedPoints:round(result.score * policy.weights[id],2), components:clone(result.components), metrics:clone(result.metrics || {}), sourceEngines:id === 'financialCapacity' || id === 'savingsResilience' ? ['Cashflow Reconstruction Engine','Debt & Over-Indebtedness Engine','COOP-SCORE Engine'] : ['COOP-SCORE Engine'] }));
  const rawScore = round(axes.reduce((sum,axis)=>sum+axis.weightedPoints,0));
  const confidence = confidenceAssessment(coop,inputs.quality || {});
  const rawBand = bandFor(rawScore,policy.bands);
  const publishedBand = confidence.confidence >= policy.minimumConfidence ? rawBand : 'toComplete';
  const positiveFactors = axes.filter(axis=>axis.score>=75).sort((a,b)=>b.weightedPoints-a.weightedPoints).map(axis=>axis.id);
  const improvementFactors = axes.filter(axis=>axis.score<65).sort((a,b)=>a.score-b.score).map(axis=>axis.id);
  const concentrationAlerts = [];
  const topBuyerShare = Number(coop.riskConcentration?.topBuyerShare || 0);
  const topMemberExposure = Number(coop.riskConcentration?.topMemberExposure || 0);
  if (topBuyerShare > policy.limits.maxTopBuyerShare) concentrationAlerts.push('top-buyer-concentration');
  if (topMemberExposure > policy.limits.maxTopMemberExposure) concentrationAlerts.push('top-member-exposure');
  if (coop.concentrationRisk === 'high' || coop.concentrationRisk === 'critical') concentrationAlerts.push('declared-concentration-risk');
  const requestAmount = Number(data.creditRequest?.amount || data.profile?.requestedAmount || 0);
  const safeMonthlyPayment = Number(inputs.health?.amounts?.safeAdditionalMonthlyPayment || 0);
  const duration = Number(data.creditRequest?.durationMonths || 12);
  const indicativeCapacity = Math.max(0,Math.min(requestAmount,round(safeMonthlyPayment * duration * 0.82 / 1000) * 1000));
  const governanceFlags = [];
  if (!coop.governanceDocumentsCurrent) governanceFlags.push('governance-documents-outdated');
  if (Number(coop.meetingAttendance || 0) < 0.70) governanceFlags.push('low-meeting-attendance');
  if (!coop.governance?.dualAuthorization) governanceFlags.push('single-authorisation-risk');
  if (!coop.governance?.grievanceMechanism) governanceFlags.push('missing-grievance-mechanism');
  return {
    engineVersion:COOP_SCORE_ENGINE_VERSION,
    policy:{ id:policy.id, version:policy.version, labelFr:policy.labelFr, labelEn:policy.labelEn, minimumConfidence:policy.minimumConfidence },
    cooperative:{ id:data.person.id, name:data.person.name, memberCount:Number(coop.memberCount || 0), activeMemberCount:Number(coop.activeMemberCount || 0), womenShare:Number(coop.womenShare || 0), youthShare:Number(coop.youthShare || 0) },
    score:rawScore,
    rawBand,
    publishedBand,
    confidence,
    axes,
    positiveFactors,
    improvementFactors,
    concentrationAlerts,
    governanceFlags,
    capacity:{ requestedAmount:requestAmount, safeMonthlyPayment, durationMonths:duration, indicativeCollectiveCapacity:indicativeCapacity, annualPrudentNet:axesRaw.financialCapacity.metrics.annualPrudentNet, requestCoverage:axesRaw.financialCapacity.metrics.requestCoverage, savingsMonths:axesRaw.savingsResilience.metrics.monthsCovered },
    recommendation:{ code:publishedBand === 'toComplete' ? 'complete-file' : rawBand === 'strong' ? 'collective-review' : rawBand === 'satisfactory' ? 'conditional-review' : rawBand === 'watch' ? 'strengthen-before-review' : 'improvement-required', nonBinding:true, humanDecisionRequired:true },
    excludedData:['religion','ethnicity','political-opinion','private-member-messages','unconsented-member-data','individual-social-media-behaviour'],
    safeguards:{
      automaticCreditDecisionAllowed:false,
      humanValidationRequired:true,
      coopScoreIsProbabilityOfDefault:false,
      individualMemberScoreChanged:false,
      collectiveDefaultTransferredToMembers:false,
      individualDecisionRequiresSeparateAssessment:true,
      memberLiabilityRequiresExplicitAgreement:true,
      alertIsProofOfFraud:false
    },
    trace:{ calculatedAt:options.calculatedAt || '2026-08-06T18:20:00.000Z', deterministic:true, inputs:['cooperativeProfile','cashflow','quality','debt','financialHealth'], policyVersion:policy.version }
  };
}

import { getEarlyWarningPolicy, validateEarlyWarningPolicy } from '../config/earlyWarningPolicies.js';

export const EARLY_WARNING_ENGINE_VERSION='2.2.0';
const clone=value=>JSON.parse(JSON.stringify(value));
const round=(value,precision=0)=>{ const f=10**precision; return Math.round(Number(value||0)*f)/f; };
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value||0)));
const sum=items=>items.reduce((total,value)=>total+Number(value||0),0);

function severityHigher(value,thresholds){
  if(value>=thresholds.critical) return 3;
  if(value>=thresholds.elevated) return 2;
  if(value>=thresholds.watch) return 1;
  return 0;
}
function severityLower(value,thresholds){
  if(value<=thresholds.critical) return 3;
  if(value<=thresholds.elevated) return 2;
  if(value<thresholds.watch) return 1;
  return 0;
}
function severityLabel(level){ return ['none','watch','elevated','critical'][Math.max(0,Math.min(3,Number(level||0)))]; }
function consecutiveMisses(observations){
  let count=0;
  for(let i=observations.length-1;i>=0;i--){
    const x=observations[i];
    if(Number(x.contributionExpected||0)>0 && Number(x.contributionPaid||0)<Number(x.contributionExpected||0)) count+=1;
    else break;
  }
  return count;
}
function average(values){ return values.length?sum(values)/values.length:0; }

export function evaluateEarlyWarning(observations, options={}) {
  const policy=getEarlyWarningPolicy(options.policyId||'balanced');
  if(!validateEarlyWarningPolicy(policy)) throw new TypeError('invalid early-warning policy');
  const rows=[...(observations||[])].map(x=>({ ...clone(x) })).sort((a,b)=>String(a.period).localeCompare(String(b.period)));
  if(rows.length<policy.minimumObservations){
    return {
      engineVersion:EARLY_WARNING_ENGINE_VERSION, policy:clone(policy), status:'insufficient-history', riskScore:0, band:'insufficient',
      signals:[], observationsCount:rows.length, humanReviewRequired:false, automaticSanctionAllowed:false,
      recommendedActions:['collect-more-post-financing-observations'], uncertainties:['insufficient-monitoring-history'],
      trace:{ calculatedAt:options.calculatedAt||'2026-08-06T19:30:00.000Z', deterministic:true }
    };
  }
  const first=rows[0], latest=rows.at(-1);
  const initialSavings=Math.max(1,Number(options.initialSavings ?? first.savingsBalance ?? 1));
  const initialDebtCount=Number(options.initialDebtCount ?? first.activeDebtCount ?? 0);
  const initialConfidence=Number(options.initialDataConfidence ?? first.dataConfidence ?? 0);
  const expected=Math.max(1,Number(latest.expectedInflow||1));
  const latestDeviation=clamp((expected-Number(latest.actualInflow||0))/expected,0,1);
  const trendBase=Math.max(1,Number(first.actualInflow||1));
  const trendDecline=clamp((trendBase-Number(latest.actualInflow||0))/trendBase,0,1);
  const cashflowSeverity=Math.max(severityHigher(latestDeviation,policy.thresholds.cashflowDeviation),severityHigher(trendDecline,policy.thresholds.cashflowTrendDecline));
  const installmentDue=Math.max(0,Number(latest.installmentDue||0));
  const installmentCoverage=installmentDue>0?clamp(Number(latest.installmentPaid||0)/installmentDue,0,1):1;
  const paymentSeverity=Math.max(severityHigher(Number(latest.daysPastDue||0),policy.thresholds.daysPastDue),severityLower(installmentCoverage,policy.thresholds.installmentCoverage));
  const savingsDrawdown=clamp((initialSavings-Number(latest.savingsBalance||0))/initialSavings,0,1);
  const savingsSeverity=severityHigher(savingsDrawdown,policy.thresholds.savingsDrawdown);
  const missedContributions=consecutiveMisses(rows);
  const contributionSeverity=severityHigher(missedContributions,policy.thresholds.missedContributions);
  const newDebtCount=Math.max(0,Number(latest.activeDebtCount||0)-initialDebtCount);
  const debtSeverity=severityHigher(newDebtCount,policy.thresholds.newDebtCount);
  const continuitySeverity=latest.businessOperational===false?3:0;
  const confidenceDrop=Math.max(0,initialConfidence-Number(latest.dataConfidence||0));
  const dataSeverity=severityHigher(confidenceDrop,policy.thresholds.confidenceDrop);
  const rawSignals=[
    { id:'payment-pressure', category:'payment', severity:paymentSeverity, actual:{ daysPastDue:Number(latest.daysPastDue||0), installmentCoverage:round(installmentCoverage*100,1) }, thresholds:clone(policy.thresholds.daysPastDue) },
    { id:'cashflow-decline', category:'cashflow', severity:cashflowSeverity, actual:{ latestDeviation:round(latestDeviation*100,1), trendDecline:round(trendDecline*100,1) }, thresholds:clone(policy.thresholds.cashflowDeviation) },
    { id:'savings-drawdown', category:'savings', severity:savingsSeverity, actual:round(savingsDrawdown*100,1), thresholds:clone(policy.thresholds.savingsDrawdown) },
    { id:'contribution-interruption', category:'contributions', severity:contributionSeverity, actual:missedContributions, thresholds:clone(policy.thresholds.missedContributions) },
    { id:'new-debt-exposure', category:'debt', severity:debtSeverity, actual:newDebtCount, thresholds:clone(policy.thresholds.newDebtCount) },
    { id:'business-interruption', category:'continuity', severity:continuitySeverity, actual:latest.businessOperational!==false, thresholds:{ watch:false,elevated:false,critical:false } },
    { id:'monitoring-data-deterioration', category:'dataQuality', severity:dataSeverity, actual:round(confidenceDrop,1), thresholds:clone(policy.thresholds.confidenceDrop) }
  ];
  const signals=rawSignals.map(item=>({
    ...item, level:severityLabel(item.severity), weight:policy.weights[item.category],
    weightedPoints:round(policy.weights[item.category]*(item.severity/3)*100,1),
    requiresHumanReview:item.severity>0
  }));
  const riskScore=round(sum(signals.map(x=>x.weightedPoints)));
  const band=riskScore>=policy.riskBands.critical?'critical':riskScore>=policy.riskBands.elevated?'elevated':riskScore>=policy.riskBands.watch?'watch':'low';
  const activeSignals=signals.filter(x=>x.severity>0);
  const actions=[];
  if(band==='low') actions.push('continue-routine-monitoring');
  if(['watch','elevated','critical'].includes(band)) actions.push('contact-beneficiary-humanly');
  if(['elevated','critical'].includes(band)) actions.push('perform-cashflow-and-debt-diagnostic','review-support-options');
  if(band==='critical') actions.push('same-day-human-review','consider-consensual-rescheduling');
  if(paymentSeverity>0) actions.push('verify-payment-cause-before-any-action');
  if(cashflowSeverity>0) actions.push('compare-actual-and-seasonal-expected-income');
  if(contributionSeverity>0) actions.push('verify-contribution-interruption');
  if(debtSeverity>0) actions.push('reconcile-new-debt-with-consent');
  const averageConfidence=round(average(rows.map(x=>Number(x.dataConfidence||0))),1);
  return {
    engineVersion:EARLY_WARNING_ENGINE_VERSION,
    status:'evaluated', riskScore, band, observationsCount:rows.length,
    latestPeriod:latest.period, activeSignals, signals,
    responseDeadlineDays:policy.responseDays[band],
    humanReviewRequired:band!=='low',
    automaticSanctionAllowed:false,
    automaticReschedulingAllowed:false,
    recommendedActions:[...new Set(actions)],
    measurements:{ latestDeviation:round(latestDeviation*100,1), trendDecline:round(trendDecline*100,1), installmentCoverage:round(installmentCoverage*100,1), daysPastDue:Number(latest.daysPastDue||0), savingsDrawdown:round(savingsDrawdown*100,1), missedContributions, newDebtCount, confidenceDrop:round(confidenceDrop,1), averageMonitoringConfidence:averageConfidence },
    uncertainties:[...(rows.some(x=>x.verified===false)?['unverified-monitoring-observation']:[]),...(averageConfidence<60?['limited-monitoring-confidence']:[])],
    policy:clone(policy),
    safeguards:{ alertIsNotDefaultProof:true, automaticPenaltyAllowed:false, automaticCollectionAllowed:false, beneficiaryContactRequiredBeforeRestrictiveAction:true, humanValidationRequired:true },
    trace:{ calculatedAt:options.calculatedAt||'2026-08-06T19:30:00.000Z', deterministic:true, observationPeriods:rows.map(x=>x.period) }
  };
}

export function validateEarlyWarningResult(result){
  if(!result?.engineVersion || !result?.policy?.version) return false;
  if(result.riskScore<0 || result.riskScore>100) return false;
  if(result.automaticSanctionAllowed!==false || result.safeguards?.automaticPenaltyAllowed!==false) return false;
  return Array.isArray(result.signals) && result.signals.every(x=>x.weightedPoints>=0);
}

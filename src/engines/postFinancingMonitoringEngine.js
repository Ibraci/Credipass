import { evaluateEarlyWarning } from './earlyWarningEngine.js';

export const POST_FINANCING_MONITORING_ENGINE_VERSION='2.2.0';
const clone=value=>JSON.parse(JSON.stringify(value));
const round=(value,precision=0)=>{ const f=10**precision; return Math.round(Number(value||0)*f)/f; };
function stableHash(value){ const input=typeof value==='string'?value:JSON.stringify(value); let hash=2166136261; for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);} return (hash>>>0).toString(16).toUpperCase().padStart(8,'0'); }
function assertActor(actor){ if(!actor?.id || !actor?.role) throw new Error('authorised human actor is required'); }
function iso(value,fallback='2026-08-06T19:35:00.000Z'){ return value||fallback; }
function addDays(dateValue,days){ const d=new Date(dateValue); d.setUTCDate(d.getUTCDate()+Number(days||0)); return d.toISOString(); }

function financingSnapshot(inputs){
  const group=inputs.groupFinancing;
  if(group){
    return {
      kind:'collective', financingId:group.planId, principal:Number(group.financing.principal||0),
      durationMonths:Number(group.financing.durationMonths||0), monthlyInstallment:round(Number(group.financing.totalRepayable||0)/Math.max(1,Number(group.financing.durationMonths||1))),
      disbursedAmount:Number(group.disbursement.disbursedAmount||0), totalRepayable:Number(group.financing.totalRepayable||0),
      status:Number(group.disbursement.disbursedAmount||0)>0?'active':'awaiting-disbursement'
    };
  }
  const financing=inputs.recommendation?.proposedFinancing || inputs.simulation?.recommended || {};
  return {
    kind:'individual', financingId:`FIN-${stableHash({personId:inputs.data.person.id,principal:financing.principal,version:inputs.recommendation?.engineVersion})}`,
    principal:Number(financing.principal||0), durationMonths:Number(financing.durationMonths||0),
    monthlyInstallment:round(Number(financing.averageInstallment||inputs.simulation?.recommended?.averageInstallment||0)),
    disbursedAmount:Number(financing.principal||0), totalRepayable:Number(financing.totalRepayable||0), status:Number(financing.principal||0)>0?'active-synthetic-demo':'not-financed'
  };
}

function refreshCase(item, options={}){
  const copy=clone(item);
  copy.earlyWarning=evaluateEarlyWarning(copy.observations,{ policyId:copy.policyId, initialSavings:copy.baseline.initialSavings, initialDebtCount:copy.baseline.initialDebtCount, initialDataConfidence:copy.baseline.initialDataConfidence, calculatedAt:options.calculatedAt||iso(null) });
  copy.status=copy.financing.status==='awaiting-disbursement'?'awaiting-disbursement':copy.earlyWarning.band==='critical'?'critical-review':copy.earlyWarning.band==='elevated'?'enhanced-monitoring':copy.earlyWarning.band==='watch'?'watch':'active';
  copy.nextReviewAt=addDays(options.calculatedAt||iso(null),copy.earlyWarning.responseDeadlineDays||30);
  copy.updatedAt=options.calculatedAt||iso(null);
  return copy;
}

export function createPostFinancingMonitoringCase(inputs, options={}){
  if(!inputs?.data?.person || !inputs?.quality) throw new TypeError('data and quality are required');
  const financing=financingSnapshot(inputs);
  const observations=clone(options.observations||[]);
  const baseline={
    initialSavings:Number(inputs.data.profile?.savings||observations[0]?.savingsBalance||0),
    initialDebtCount:Number(inputs.debt?.summary?.activeDebtCount||observations[0]?.activeDebtCount||0),
    initialDataConfidence:Number(inputs.quality?.confidence||observations[0]?.dataConfidence||0),
    expectedInflow:Number(observations[0]?.expectedInflow||inputs.cashflow?.summary?.averagePrudentInflow||0),
    monthlyInstallment:Number(financing.monthlyInstallment||0)
  };
  const payload={ personId:inputs.data.person.id, financingId:financing.financingId, policyId:options.policyId||'balanced', periods:observations.map(x=>x.period) };
  const item={
    engineVersion:POST_FINANCING_MONITORING_ENGINE_VERSION,
    monitoringId:`MON-${stableHash(payload)}`,
    policyId:options.policyId||'balanced',
    subject:{ id:inputs.data.person.id, name:inputs.data.person.name, kind:financing.kind },
    financing, baseline, observations,
    interventions:[], reschedulingProposals:[], alertAcknowledgements:[], closedAlerts:[],
    createdAt:options.createdAt||'2026-08-06T19:35:00.000Z', updatedAt:options.createdAt||'2026-08-06T19:35:00.000Z',
    safeguards:{ automaticSanctionAllowed:false, automaticReschedulingAllowed:false, automaticDefaultClassificationAllowed:false, beneficiaryConsentRequiredForRescheduling:true, humanReviewRequiredForRestrictiveAction:true, monitoringDataCannotModifyOriginalCreditDecision:true },
    excludedData:['private-messages','contact-list','social-media-behaviour','religion','ethnicity','political-opinion','unconsented-third-party-data'],
    trace:{ deterministic:true, upstreamVersions:{ quality:inputs.quality.engineVersion, simulation:inputs.simulation?.engineVersion||null, recommendation:inputs.recommendation?.engineVersion||null, groupFinancing:inputs.groupFinancing?.engineVersion||null } }
  };
  return refreshCase(item,{calculatedAt:options.createdAt||'2026-08-06T19:35:00.000Z'});
}

export function appendMonitoringObservation(monitoringCase, observation, options={}){
  if(!monitoringCase?.monitoringId) throw new TypeError('monitoring case is required');
  if(!observation?.period) throw new TypeError('observation period is required');
  const copy=clone(monitoringCase);
  if(copy.observations.some(x=>x.period===observation.period)) throw new Error('observation period already exists');
  const normalized={
    ...clone(observation), expectedInflow:Math.max(0,Number(observation.expectedInflow||0)), actualInflow:Math.max(0,Number(observation.actualInflow||0)),
    savingsBalance:Math.max(0,Number(observation.savingsBalance||0)), contributionExpected:Math.max(0,Number(observation.contributionExpected||0)), contributionPaid:Math.max(0,Number(observation.contributionPaid||0)),
    installmentDue:Math.max(0,Number(observation.installmentDue||0)), installmentPaid:Math.max(0,Number(observation.installmentPaid||0)), daysPastDue:Math.max(0,Number(observation.daysPastDue||0)),
    activeDebtCount:Math.max(0,Number(observation.activeDebtCount||0)), businessOperational:observation.businessOperational!==false,
    dataConfidence:Math.max(0,Math.min(100,Number(observation.dataConfidence||0))), verified:Boolean(observation.verified!==false)
  };
  copy.observations.push(normalized);
  copy.observations.sort((a,b)=>String(a.period).localeCompare(String(b.period)));
  copy.trace.lastObservationAddedAt=options.at||iso(null);
  return refreshCase(copy,{calculatedAt:options.at||iso(null)});
}

export function recordMonitoringIntervention(monitoringCase, intervention, options={}){
  if(!monitoringCase?.monitoringId) throw new TypeError('monitoring case is required'); assertActor(intervention.actor);
  const allowed=['beneficiary-contact','field-visit','financial-coaching','cashflow-review','debt-reconciliation','payment-plan-review','evidence-refresh'];
  if(!allowed.includes(intervention.type)) throw new RangeError('unsupported monitoring intervention');
  const copy=clone(monitoringCase);
  const item={ interventionId:`INT-${stableHash({id:copy.monitoringId,type:intervention.type,at:options.at||iso(null),count:copy.interventions.length})}`, type:intervention.type, reason:String(intervention.reason||'').trim(), actor:clone(intervention.actor), at:options.at||iso(null), outcome:intervention.outcome||'planned', beneficiaryContacted:Boolean(intervention.beneficiaryContacted), restrictiveActionTaken:false };
  if(!item.reason) throw new Error('intervention reason is required');
  copy.interventions.push(item); copy.updatedAt=item.at; return copy;
}

export function acknowledgeMonitoringAlert(monitoringCase, actor, reason, options={}){
  if(!monitoringCase?.monitoringId) throw new TypeError('monitoring case is required'); assertActor(actor);
  if(!String(reason||'').trim()) throw new Error('acknowledgement reason is required');
  const copy=clone(monitoringCase); const item={ acknowledgementId:`ACK-${stableHash({id:copy.monitoringId,at:options.at||iso(null),count:copy.alertAcknowledgements.length})}`, band:copy.earlyWarning.band, riskScore:copy.earlyWarning.riskScore, actor:clone(actor), reason:String(reason).trim(), at:options.at||iso(null), decisionCreated:false };
  copy.alertAcknowledgements.push(item); copy.updatedAt=item.at; return copy;
}

export function proposeHumanRescheduling(monitoringCase, request, options={}){
  if(!monitoringCase?.monitoringId) throw new TypeError('monitoring case is required'); assertActor(request.actor);
  if(!['elevated','critical'].includes(monitoringCase.earlyWarning.band)) throw new Error('rescheduling can only be proposed after an elevated or critical human review');
  if(!String(request.reason||'').trim()) throw new Error('rescheduling reason is required');
  const copy=clone(monitoringCase);
  const currentDuration=Math.max(1,Number(copy.financing.durationMonths||1));
  const newDuration=Math.max(currentDuration+1,Number(request.newDurationMonths||currentDuration+6));
  const outstanding=Math.max(0,Number(request.outstandingPrincipal ?? copy.financing.principal));
  const proposedInstallment=round(outstanding/Math.max(1,newDuration));
  const proposal={
    proposalId:`RES-${stableHash({id:copy.monitoringId,newDuration,outstanding,at:options.at||iso(null)})}`,
    reason:String(request.reason).trim(), actor:clone(request.actor), at:options.at||iso(null),
    outstandingPrincipal:outstanding, currentDurationMonths:currentDuration, proposedDurationMonths:newDuration,
    indicativeMonthlyPrincipal:proposedInstallment, nonBinding:true, status:'pending-beneficiary-consent-and-committee-review',
    beneficiaryConsent:{ required:true, granted:false, at:null }, committeeApproval:{ required:true, granted:false, at:null },
    automaticContractChangeApplied:false
  };
  copy.reschedulingProposals.push(proposal); copy.updatedAt=proposal.at; return copy;
}

export function closeMonitoringAlert(monitoringCase, actor, reason, options={}){
  if(!monitoringCase?.monitoringId) throw new TypeError('monitoring case is required'); assertActor(actor);
  if(!String(reason||'').trim()) throw new Error('closure reason is required');
  if(['elevated','critical'].includes(monitoringCase.earlyWarning.band)) throw new Error('elevated or critical alert cannot be closed before a verified recovery observation');
  const latest=monitoringCase.observations.at(-1);
  if(latest && Number(latest.daysPastDue||0)>0) throw new Error('past-due installment must be resolved before alert closure');
  const copy=clone(monitoringCase); const item={ closureId:`CLS-${stableHash({id:copy.monitoringId,at:options.at||iso(null)})}`, actor:clone(actor), reason:String(reason).trim(), at:options.at||iso(null), bandAtClosure:copy.earlyWarning.band, decisionChanged:false };
  copy.closedAlerts.push(item); copy.status='active'; copy.updatedAt=item.at; return copy;
}

export function validateMonitoringCase(item){
  if(!item?.monitoringId || !item?.engineVersion) return false;
  if(item.safeguards.automaticSanctionAllowed!==false || item.safeguards.automaticReschedulingAllowed!==false) return false;
  if(!Array.isArray(item.observations) || !item.earlyWarning) return false;
  return item.reschedulingProposals.every(x=>x.automaticContractChangeApplied===false && x.nonBinding===true);
}

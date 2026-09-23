import { getGroupFinancingPolicy, validateGroupFinancingPolicy } from '../config/groupFinancingPolicies.js';

export const GROUP_FINANCING_ENGINE_VERSION = '2.1.0';
const clone=value=>JSON.parse(JSON.stringify(value));
const round=(value,precision=0)=>{ const f=10**precision; return Math.round(Number(value||0)*f)/f; };
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value||0)));
function stableHash(value){ const input=typeof value==='string'?value:JSON.stringify(value); let hash=2166136261; for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);} return (hash>>>0).toString(16).toUpperCase().padStart(8,'0'); }
function assertHuman(actor){ if(!actor?.id || !['committeeChair','supervisor','creditAnalyst','cooperativeOfficer'].includes(actor.role)) throw new Error('authorised human actor is required'); }
function sum(items,key){ return items.reduce((total,item)=>total+Number(typeof key==='function'?key(item):item[key]||0),0); }
function normalizeAgreement(item){ return { memberId:String(item.memberId), affected:Boolean(item.affected!==false), consentGranted:Boolean(item.consentGranted), consentAt:item.consentAt||null, maximumLiability:Math.max(0,Number(item.maximumLiability||0)), liabilityAccepted:Boolean(item.liabilityAccepted), automaticDeductionAllowed:false, scoreImpactAllowed:false }; }

export function createGroupFinancingPlan(inputs, options={}) {
  if(!inputs?.data?.cooperativeProfile || !inputs?.coopScore) throw new TypeError('cooperative data and COOP-SCORE are required');
  const policy=getGroupFinancingPolicy(options.policyId||'balanced');
  if(!validateGroupFinancingPolicy(policy)) throw new TypeError('invalid group financing policy');
  const data=inputs.data, coop=data.cooperativeProfile, spec=coop.groupFinancing;
  if(!spec) throw new TypeError('group financing specification is required');
  const principal=Math.max(0,Math.min(Number(data.creditRequest?.amount||data.profile?.requestedAmount||0),Number(inputs.coopScore.capacity?.indicativeCollectiveCapacity||0),Number(inputs.recommendation?.proposedFinancing?.principal||Infinity)));
  const agreements=(spec.memberAgreements||[]).map(normalizeAgreement);
  const affected=agreements.filter(x=>x.affected);
  const granted=affected.filter(x=>x.consentGranted && x.liabilityAccepted);
  const pending=affected.filter(x=>!(x.consentGranted && x.liabilityAccepted));
  const consentCoverage=affected.length?granted.length/affected.length:0;
  const totalCappedLiability=sum(granted,'maximumLiability');
  const guaranteeCoverage=principal>0?totalCappedLiability/principal:0;
  const maxMemberLiability=granted.length?Math.max(...granted.map(x=>x.maximumLiability)):0;
  const maxMemberLiabilityShare=principal>0?maxMemberLiability/principal:0;
  const allocation=(spec.fundAllocation||[]).map(row=>({ ...clone(row), amount:Number(row.amount||0), share:principal>0?round(Number(row.amount||0)/principal,4):0 }));
  const allocatedAmount=sum(allocation,'amount');
  const allocationBalanced=Math.abs(allocatedAmount-principal)<0.01;
  const tranches=(spec.disbursementPlan||[]).map((row,index)=>({ id:row.id||`TR-${index+1}`, sequence:index+1, amount:Number(row.amount||0), share:principal>0?round(Number(row.amount||0)/principal,4):0, purposeKey:row.purposeKey, requiredEvidenceIds:[...(row.requiredEvidenceIds||[])], conditions:[...(row.conditions||[])], status:'planned', authorisedAt:null, authorisedBy:null, disbursedAt:null, verifiedUseAmount:0 }));
  const trancheTotal=sum(tranches,'amount');
  const firstTrancheShare=principal>0?Number(tranches[0]?.amount||0)/principal:0;
  const gates=[
    { id:'coop-score', passed:Number(inputs.coopScore.score)>=policy.minimumCoopScore, actual:Number(inputs.coopScore.score), required:policy.minimumCoopScore },
    { id:'data-confidence', passed:Number(inputs.quality?.confidence||0)>=policy.minimumDataConfidence, actual:Number(inputs.quality?.confidence||0), required:policy.minimumDataConfidence },
    { id:'governance-approval', passed:Boolean(spec.governanceApproval?.approved), actual:Boolean(spec.governanceApproval?.approved), required:true },
    { id:'member-consent-coverage', passed:consentCoverage>=policy.minimumConsentCoverage, actual:round(consentCoverage*100,1), required:round(policy.minimumConsentCoverage*100,1) },
    { id:'guarantee-cap', passed:guaranteeCoverage<=policy.maxGuaranteeCoverage && maxMemberLiabilityShare<=policy.maxSingleMemberLiabilityShare, actual:round(guaranteeCoverage*100,1), required:round(policy.maxGuaranteeCoverage*100,1) },
    { id:'allocation-balanced', passed:allocationBalanced, actual:allocatedAmount, required:principal },
    { id:'tranches-balanced', passed:Math.abs(trancheTotal-principal)<0.01 && firstTrancheShare<=policy.maxFirstTrancheShare, actual:trancheTotal, required:principal },
    { id:'human-approval', passed:false, actual:false, required:true }
  ];
  const blockingGates=gates.filter(x=>!x.passed && x.id!=='human-approval').map(x=>x.id);
  const warnings=[];
  if(pending.length) warnings.push('pending-member-consents');
  if(guaranteeCoverage>0.30) warnings.push('guarantee-near-policy-limit');
  if(firstTrancheShare>0.50) warnings.push('large-first-tranche');
  const payload={ cooperativeId:data.person.id, principal, policyVersion:policy.version, coopScore:inputs.coopScore.score, consentCoverage:round(consentCoverage,4), guaranteeCoverage:round(guaranteeCoverage,4), allocation, tranches:tranches.map(x=>({id:x.id,amount:x.amount})) };
  return {
    engineVersion:GROUP_FINANCING_ENGINE_VERSION,
    planId:`GRP-${stableHash(payload)}`,
    status:blockingGates.length?'blocked':'ready-for-human-validation',
    cooperative:{ id:data.person.id, name:data.person.name, memberCount:coop.memberCount },
    financing:{ requestedAmount:Number(data.creditRequest?.amount||0), principal, durationMonths:Number(inputs.recommendation?.proposedFinancing?.durationMonths||data.creditRequest?.durationMonths||0), scheduleType:inputs.recommendation?.proposedFinancing?.scheduleType||inputs.simulation?.recommended?.scheduleType||'standard', totalRepayable:Number(inputs.recommendation?.proposedFinancing?.totalRepayable||0), reserveHoldback:round(principal*policy.reserveHoldbackRate) },
    governance:{ ...clone(spec.governanceApproval), approvalIsCreditDecision:false },
    consent:{ affectedMemberCount:affected.length, grantedCount:granted.length, pendingCount:pending.length, coverage:round(consentCoverage*100,1), minimumCoverage:round(policy.minimumConsentCoverage*100,1), agreements, pendingMemberIds:pending.map(x=>x.memberId) },
    guarantee:{ model:spec.guaranteeModel||'limited-solidarity', totalCappedLiability, coverage:round(guaranteeCoverage*100,1), maximumCoverage:round(policy.maxGuaranteeCoverage*100,1), maximumMemberLiability:maxMemberLiability, maximumMemberLiabilityShare:round(maxMemberLiabilityShare*100,2), memberCapLimit:round(principal*policy.maxSingleMemberLiabilityShare), uncappedLiabilityAllowed:false, automaticTransferToMembers:false },
    allocation:{ items:allocation, allocatedAmount, balanced:allocationBalanced },
    disbursement:{ tranches, authorisedAmount:0, disbursedAmount:0, verifiedUseAmount:0, nextTrancheRequiresVerifiedUse:true },
    repayment:{ schedule:clone(inputs.simulation?.selectedSchedule||[]), payments:[], paidAmount:0, overdueAmount:0, automaticMemberCollectionAllowed:false, collectiveAccountRequired:true },
    gates, blockingGates, warnings,
    responsibilities:{ cooperative:['approve-purpose-in-general-assembly','maintain-collective-account','document-fund-use','report-to-members'], committee:['verify-consent-and-liability-caps','authorise-each-tranche','review-use-before-next-tranche'], members:['consent-only-if-affected','liability-never-exceeds-accepted-cap','access-decision-and-appeal-information'], institution:['disclose-costs-and-conditions','never-debit-members-without-mandate','monitor-without-automatic-sanction'] },
    excludedData:['religion','ethnicity','political-opinion','private-member-messages','unconsented-member-data','individual-score-as-collective-guarantee'],
    safeguards:{ automaticCreditDecisionAllowed:false, automaticMemberLiabilityAllowed:false, uncappedJointLiabilityAllowed:false, memberConsentRevocableBeforeDisbursement:true, individualScoresChanged:false, humanApprovalRequired:true, cooperativeDefaultAutomaticallyTransferredToMembers:false },
    policy:clone(policy), events:[], trace:{ calculatedAt:options.calculatedAt||'2026-08-06T19:00:00.000Z', deterministic:true, upstreamVersions:{ coopScore:inputs.coopScore.engineVersion, simulation:inputs.simulation?.engineVersion, recommendation:inputs.recommendation?.engineVersion } }
  };
}

export function recordMemberConsent(plan, consent, options={}) {
  if(!plan?.planId) throw new TypeError('group financing plan is required');
  const copy=clone(plan), item=copy.consent.agreements.find(x=>x.memberId===consent.memberId);
  if(!item) throw new Error('member is not in the affected-member register');
  if(copy.disbursement.disbursedAmount>0) throw new Error('member consent cannot be changed after disbursement');
  item.consentGranted=Boolean(consent.granted); item.liabilityAccepted=Boolean(consent.granted && consent.liabilityAccepted); item.consentAt=consent.at||options.at||'2026-08-06T19:05:00.000Z';
  if(Number(consent.maximumLiability||item.maximumLiability)>copy.guarantee.memberCapLimit) throw new Error('member liability exceeds the policy cap');
  item.maximumLiability=Number(consent.maximumLiability||item.maximumLiability);
  const affected=copy.consent.agreements.filter(x=>x.affected), granted=affected.filter(x=>x.consentGranted&&x.liabilityAccepted), pending=affected.filter(x=>!(x.consentGranted&&x.liabilityAccepted));
  copy.consent.grantedCount=granted.length; copy.consent.pendingCount=pending.length; copy.consent.coverage=round(granted.length/Math.max(1,affected.length)*100,1); copy.consent.pendingMemberIds=pending.map(x=>x.memberId);
  copy.guarantee.totalCappedLiability=sum(granted,'maximumLiability'); copy.guarantee.coverage=round(copy.guarantee.totalCappedLiability/Math.max(1,copy.financing.principal)*100,1); copy.guarantee.maximumMemberLiability=granted.length?Math.max(...granted.map(x=>x.maximumLiability)):0;
  const gate=copy.gates.find(x=>x.id==='member-consent-coverage'); gate.actual=copy.consent.coverage; gate.passed=copy.consent.coverage>=copy.consent.minimumCoverage;
  const guaranteeGate=copy.gates.find(x=>x.id==='guarantee-cap'); guaranteeGate.actual=copy.guarantee.coverage; guaranteeGate.passed=copy.guarantee.coverage<=copy.guarantee.maximumCoverage && (copy.guarantee.maximumMemberLiability/Math.max(1,copy.financing.principal)*100)<=copy.policy.maxSingleMemberLiabilityShare*100;
  copy.blockingGates=copy.gates.filter(x=>!x.passed&&x.id!=='human-approval').map(x=>x.id); copy.status=copy.blockingGates.length?'blocked':'ready-for-human-validation';
  copy.events.push({ type:'member-consent-recorded', memberId:item.memberId, granted:item.consentGranted, at:item.consentAt }); return copy;
}

export function authoriseGroupTranche(plan, request, options={}) {
  if(!plan?.planId) throw new TypeError('group financing plan is required'); assertHuman(request.actor);
  const copy=clone(plan); if(copy.blockingGates.length) throw new Error(`blocking gates: ${copy.blockingGates.join(', ')}`);
  const tranche=copy.disbursement.tranches.find(x=>x.id===request.trancheId); if(!tranche) throw new Error('unknown tranche'); if(tranche.status!=='planned') throw new Error('tranche is not planned');
  const previous=copy.disbursement.tranches.filter(x=>x.sequence<tranche.sequence);
  if(previous.some(x=>x.status!=='disbursed')) throw new Error('previous tranche is not disbursed');
  if(previous.length){ const required=sum(previous,'amount')*copy.policy.minimumVerifiedFundUseBeforeNextTranche; if(copy.disbursement.verifiedUseAmount<required) throw new Error('verified fund use is insufficient for the next tranche'); }
  const provided=new Set(request.evidenceIds||[]); const missing=tranche.requiredEvidenceIds.filter(id=>!provided.has(id)); if(missing.length) throw new Error(`missing tranche evidence: ${missing.join(', ')}`);
  tranche.status='disbursed'; tranche.authorisedAt=options.at||'2026-08-06T19:10:00.000Z'; tranche.disbursedAt=tranche.authorisedAt; tranche.authorisedBy=clone(request.actor);
  copy.disbursement.authorisedAmount=round(copy.disbursement.authorisedAmount+tranche.amount); copy.disbursement.disbursedAmount=round(copy.disbursement.disbursedAmount+tranche.amount); copy.status='active';
  const humanGate=copy.gates.find(x=>x.id==='human-approval'); humanGate.passed=true; humanGate.actual=true;
  copy.events.push({ type:'tranche-disbursed', trancheId:tranche.id, amount:tranche.amount, actor:clone(request.actor), at:tranche.disbursedAt, evidenceIds:[...provided] }); return copy;
}

export function recordVerifiedFundUse(plan, record, options={}) {
  if(!plan?.planId) throw new TypeError('group financing plan is required'); assertHuman(record.actor);
  const copy=clone(plan), tranche=copy.disbursement.tranches.find(x=>x.id===record.trancheId); if(!tranche||tranche.status!=='disbursed') throw new Error('tranche must be disbursed first');
  const amount=Math.max(0,Number(record.amount||0)); if(tranche.verifiedUseAmount+amount>tranche.amount) throw new Error('verified use exceeds tranche amount'); if(!(record.evidenceIds||[]).length) throw new Error('fund-use evidence is required');
  tranche.verifiedUseAmount=round(tranche.verifiedUseAmount+amount); copy.disbursement.verifiedUseAmount=round(copy.disbursement.verifiedUseAmount+amount);
  copy.events.push({ type:'fund-use-verified', trancheId:tranche.id, amount, purposeKey:record.purposeKey, evidenceIds:[...(record.evidenceIds||[])], actor:clone(record.actor), at:options.at||'2026-08-06T19:15:00.000Z' }); return copy;
}

export function recordCollectiveRepayment(plan, payment, options={}) {
  if(!plan?.planId) throw new TypeError('group financing plan is required'); assertHuman(payment.actor);
  const copy=clone(plan); if(copy.disbursement.disbursedAmount<=0) throw new Error('no tranche has been disbursed');
  const amount=Math.max(0,Number(payment.amount||0)); if(amount<=0) throw new Error('repayment amount must be positive');
  const item={ paymentId:`PAY-${stableHash({planId:copy.planId,amount,paidAt:payment.paidAt||options.at||'2026-09-30T12:00:00.000Z',sequence:copy.repayment.payments.length+1})}`, amount, dueDate:payment.dueDate||null, paidAt:payment.paidAt||options.at||'2026-09-30T12:00:00.000Z', sourceKey:payment.sourceKey||'collective-account', actor:clone(payment.actor), memberDebitsCreated:false };
  copy.repayment.payments.push(item); copy.repayment.paidAmount=round(copy.repayment.paidAmount+amount); copy.status=copy.repayment.paidAmount>=copy.financing.totalRepayable&&copy.financing.totalRepayable>0?'repaid':'active'; copy.events.push({type:'collective-repayment-recorded',...item}); return copy;
}

export function validateGroupFinancingPlan(plan){
  if(!plan?.planId || !plan?.policy?.version) return false;
  if(plan.safeguards.automaticCreditDecisionAllowed!==false || plan.safeguards.uncappedJointLiabilityAllowed!==false) return false;
  if(plan.guarantee.totalCappedLiability<0 || plan.consent.coverage<0 || plan.consent.coverage>100) return false;
  return Math.abs(plan.allocation.allocatedAmount-plan.financing.principal)<0.01;
}

import { DEPLOYMENT_READINESS_POLICY, validatePilotReadinessPolicy } from '../config/readinessPolicies.js';

const REQUIRED_COLUMNS = Object.freeze([
  'case_id','applicant_name','sector','requested_amount','manual_decision','manual_amount',
  'manual_analysis_minutes','credipass_recommendation','credipass_amount','credipass_analysis_minutes',
  'incomplete_before','incomplete_after'
]);

const DECISION_MAP = Object.freeze({
  approve:'approve', supported:'approve', conditional:'conditional', reduced:'conditional',
  defer:'defer', 'to-complete':'defer', improvement:'defer', reject:'reject', decline:'reject'
});

const numberValue = value => {
  const parsed = Number(String(value ?? '').replace(/\s/g,'').replace(',','.'));
  return Number.isFinite(parsed) ? parsed : NaN;
};
const round = (value, digits=0) => Number(Number(value || 0).toFixed(digits));
const median = values => {
  const list = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!list.length) return 0;
  const middle = Math.floor(list.length/2);
  return list.length%2 ? list[middle] : (list[middle-1]+list[middle])/2;
};
const normalizeDecision = value => DECISION_MAP[String(value||'').trim().toLowerCase()] || 'unknown';

export function validateInstitutionProfile(institution = {}) {
  const errors=[];
  if (!String(institution.name||'').trim()) errors.push('institution-name-required');
  if (!String(institution.country||'').trim()) errors.push('country-required');
  if (numberValue(institution.branches) < 1) errors.push('at-least-one-branch-required');
  if (numberValue(institution.creditOfficers) < 1) errors.push('at-least-one-credit-officer-required');
  if (numberValue(institution.monthlyCaseVolume) < 1) errors.push('monthly-volume-required');
  if (![30,60,90,120].includes(numberValue(institution.pilotDurationDays))) errors.push('unsupported-pilot-duration');
  return { valid:errors.length===0, errors };
}

export function validateCreditProduct(product = {}) {
  const errors=[];
  const min=numberValue(product.minimumAmount), max=numberValue(product.maximumAmount);
  const minDuration=numberValue(product.minimumDurationMonths), maxDuration=numberValue(product.maximumDurationMonths);
  if (!String(product.name||'').trim()) errors.push('product-name-required');
  if (!(min>0 && max>=min)) errors.push('invalid-amount-range');
  if (!(minDuration>0 && maxDuration>=minDuration)) errors.push('invalid-duration-range');
  if (!(numberValue(product.maximumEffortRatio)>0 && numberValue(product.maximumEffortRatio)<=100)) errors.push('invalid-effort-ratio');
  if (!(numberValue(product.minimumDataConfidence)>=0 && numberValue(product.minimumDataConfidence)<=100)) errors.push('invalid-confidence-threshold');
  if (product.humanDecisionRequired !== true) errors.push('human-decision-must-be-required');
  return { valid:errors.length===0, errors };
}

export function parseInstitutionalCsv(csvText = '') {
  const lines=String(csvText||'').replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if (!lines.length) return { delimiter:';', headers:[], rows:[], errors:['empty-file'] };
  const delimiter=(lines[0].match(/;/g)||[]).length >= (lines[0].match(/,/g)||[]).length ? ';' : ',';
  const headers=lines[0].split(delimiter).map(x=>x.trim());
  const duplicateHeaders=headers.filter((item,index)=>headers.indexOf(item)!==index);
  const errors=[];
  if (duplicateHeaders.length) errors.push(`duplicate-columns:${[...new Set(duplicateHeaders)].join('|')}`);
  REQUIRED_COLUMNS.filter(column=>!headers.includes(column)).forEach(column=>errors.push(`missing-column:${column}`));
  const rows=lines.slice(1).map((line,index)=>{
    const values=line.split(delimiter).map(x=>x.trim());
    const raw=Object.fromEntries(headers.map((header,columnIndex)=>[header,values[columnIndex]??'']));
    return { rowNumber:index+2, raw };
  });
  return { delimiter, headers, rows, errors };
}

export function validateImportedDossiers(csvText = '', policy = DEPLOYMENT_READINESS_POLICY) {
  validatePilotReadinessPolicy(policy);
  const parsed=parseInstitutionalCsv(csvText);
  const validRows=[], invalidRows=[];
  const seen=new Set();
  for (const item of parsed.rows) {
    const row={ ...item.raw };
    const errors=[];
    if (!row.case_id) errors.push('case-id-required');
    if (seen.has(row.case_id)) errors.push('duplicate-case-id');
    seen.add(row.case_id);
    if (!row.applicant_name) errors.push('applicant-name-required');
    if (!row.sector) errors.push('sector-required');
    ['requested_amount','manual_amount','manual_analysis_minutes','credipass_amount','credipass_analysis_minutes','incomplete_before','incomplete_after'].forEach(field=>{
      if (!Number.isFinite(numberValue(row[field]))) errors.push(`invalid-number:${field}`);
    });
    const manualDecision=normalizeDecision(row.manual_decision);
    const credipassDecision=normalizeDecision(row.credipass_recommendation);
    if (manualDecision==='unknown') errors.push('unknown-manual-decision');
    if (credipassDecision==='unknown') errors.push('unknown-credipass-recommendation');
    const normalized={
      caseId:row.case_id,
      applicantName:row.applicant_name,
      sector:row.sector,
      requestedAmount:numberValue(row.requested_amount),
      manualDecision,
      manualDecisionRaw:row.manual_decision,
      manualAmount:numberValue(row.manual_amount),
      manualAnalysisMinutes:numberValue(row.manual_analysis_minutes),
      credipassDecision,
      credipassRecommendationRaw:row.credipass_recommendation,
      credipassAmount:numberValue(row.credipass_amount),
      credipassAnalysisMinutes:numberValue(row.credipass_analysis_minutes),
      incompleteBefore:numberValue(row.incomplete_before),
      incompleteAfter:numberValue(row.incomplete_after)
    };
    (errors.length?invalidRows:validRows).push({ rowNumber:item.rowNumber, data:normalized, errors });
  }
  const totalRows=parsed.rows.length;
  const validityRate=totalRows ? round(validRows.length/totalRows*100,1) : 0;
  return {
    engineVersion:'2.3.0',
    requiredColumns:[...REQUIRED_COLUMNS],
    parsed,
    totalRows,
    validRows,
    invalidRows,
    validityRate,
    readyForPilotComparison:validRows.length>=policy.minimumValidImportRows && validityRate>=policy.minimumImportValidityRate,
    safeguards:{ rawSourcePreserved:true, invalidRowsExcluded:true, automaticCreditDecisionAllowed:false, humanValidationRequired:true }
  };
}

export function compareHumanAndCredipass(validRows = []) {
  const rows=validRows.map(item=>item.data||item);
  const comparisons=rows.map(row=>{
    const decisionAgreement=row.manualDecision===row.credipassDecision;
    const amountDifference=row.credipassAmount-row.manualAmount;
    const amountDifferenceRate=row.manualAmount>0 ? round(amountDifference/row.manualAmount*100,1) : (row.credipassAmount>0?100:0);
    const minutesSaved=Math.max(0,row.manualAnalysisMinutes-row.credipassAnalysisMinutes);
    return { ...row, decisionAgreement, amountDifference, amountDifferenceRate, minutesSaved };
  });
  const total=comparisons.length;
  const agreementCount=comparisons.filter(x=>x.decisionAgreement).length;
  const manualMinutes=comparisons.reduce((sum,x)=>sum+x.manualAnalysisMinutes,0);
  const credipassMinutes=comparisons.reduce((sum,x)=>sum+x.credipassAnalysisMinutes,0);
  const incompleteBefore=comparisons.reduce((sum,x)=>sum+x.incompleteBefore,0);
  const incompleteAfter=comparisons.reduce((sum,x)=>sum+x.incompleteAfter,0);
  return {
    engineVersion:'2.3.0',
    rows:comparisons,
    metrics:{
      caseCount:total,
      agreementRate:total?round(agreementCount/total*100,1):0,
      divergenceCount:total-agreementCount,
      manualAverageMinutes:total?round(manualMinutes/total,1):0,
      credipassAverageMinutes:total?round(credipassMinutes/total,1):0,
      timeReductionPercent:manualMinutes?round((manualMinutes-credipassMinutes)/manualMinutes*100,1):0,
      medianMinutesSaved:round(median(comparisons.map(x=>x.minutesSaved)),1),
      incompleteBefore,
      incompleteAfter,
      incompleteReductionPercent:incompleteBefore?round((incompleteBefore-incompleteAfter)/incompleteBefore*100,1):0,
      amountAdjustedCount:comparisons.filter(x=>x.amountDifference!==0).length
    },
    safeguards:{ comparisonDoesNotOverrideDecision:true, divergenceRequiresHumanReview:true, benchmarkDataMustBeAnonymized:true }
  };
}

export function calculatePilotRoi({ institution, comparison, hourlyStaffCost=4500, monthlySupportCost=180000 } = {}) {
  const monthlyVolume=Math.max(0,numberValue(institution?.monthlyCaseVolume)||0);
  const manualMinutes=Number(comparison?.metrics?.manualAverageMinutes||0);
  const credipassMinutes=Number(comparison?.metrics?.credipassAverageMinutes||0);
  const minutesSavedPerCase=Math.max(0,manualMinutes-credipassMinutes);
  const hoursSavedMonthly=round(monthlyVolume*minutesSavedPerCase/60,1);
  const grossStaffValue=round(hoursSavedMonthly*hourlyStaffCost);
  const netOperationalValue=round(grossStaffValue-monthlySupportCost);
  const annualHoursSaved=round(hoursSavedMonthly*12,1);
  const annualNetOperationalValue=round(netOperationalValue*12);
  return {
    engineVersion:'2.3.0',
    assumptions:{ monthlyVolume, hourlyStaffCost, monthlySupportCost, manualMinutes, credipassMinutes },
    minutesSavedPerCase:round(minutesSavedPerCase,1),
    hoursSavedMonthly,
    grossStaffValue,
    netOperationalValue,
    annualHoursSaved,
    annualNetOperationalValue,
    note:'Illustrative operational estimate; not a contractual financial promise.'
  };
}

export function buildPilotPlan90Days(institution = {}) {
  const target=Math.max(100,numberValue(institution.pilotCaseTarget)||200);
  return {
    version:'2.3.0', durationDays:Number(institution.pilotDurationDays||90), targetCases:target,
    phases:[
      { id:'prepare', days:'J1–J15', mode:'preparation', titleFr:'Cadrage, sécurité et paramétrage', titleEn:'Scoping, security and configuration', deliverables:['institution-profile','credit-product','data-mapping','security-review','acceptance-baseline'] },
      { id:'observe', days:'J16–J45', mode:'observation', titleFr:'Mode observation sans influence sur les décisions', titleEn:'Observation mode without decision influence', deliverables:['historical-batch','human-vs-credipass-comparison','weekly-quality-report'] },
      { id:'copilot', days:'J46–J75', mode:'copilot', titleFr:'Mode copilote avec validation humaine', titleEn:'Copilot mode with human validation', deliverables:['live-assisted-cases','override-log','agent-feedback','early-warning-review'] },
      { id:'evaluate', days:'J76–J90', mode:'evaluation', titleFr:'Évaluation, audit et décision de déploiement', titleEn:'Evaluation, audit and deployment decision', deliverables:['roi-report','model-validation-report','security-closeout','scale-up-recommendation'] }
    ],
    governance:{ weeklySteeringCommittee:true, noAutomaticDecision:true, dataProcessingAgreementRequired:true, exitAndDeletionPlanRequired:true }
  };
}

export function calculateInstitutionalReadiness({ institution, product, importResult, checklist = [], comparison } = {}, policy = DEPLOYMENT_READINESS_POLICY) {
  validatePilotReadinessPolicy(policy);
  const institutionValidation=validateInstitutionProfile(institution);
  const productValidation=validateCreditProduct(product);
  const securityItems=checklist.filter(x=>x.category==='security');
  const operationsItems=checklist.filter(x=>x.category==='operations');
  const governanceItems=checklist.filter(x=>['governance','model'].includes(x.category));
  const completion=items=>items.length?items.filter(x=>x.completed).length/items.length*100:0;
  const categoryScores={
    institution:institutionValidation.valid?100:Math.max(0,100-institutionValidation.errors.length*25),
    product:productValidation.valid?100:Math.max(0,100-productValidation.errors.length*25),
    data:importResult?.readyForPilotComparison?100:Math.min(100,Number(importResult?.validityRate||0)),
    security:completion([...securityItems,...governanceItems]),
    operations:completion(operationsItems),
    measurement:comparison?.metrics?.caseCount>=policy.minimumValidImportRows?100:Math.min(100,(comparison?.metrics?.caseCount||0)/policy.minimumValidImportRows*100)
  };
  const weightedScore=round(Object.entries(policy.categories).reduce((sum,[key,weight])=>sum+(categoryScores[key]||0)*weight/100,0));
  const criticalOpenItems=checklist.filter(x=>x.critical && !x.completed);
  const blockers=[...institutionValidation.errors,...productValidation.errors,...(importResult?.parsed?.errors||[]),...criticalOpenItems.map(x=>`open-critical-item:${x.id}`)];
  const observationReady=weightedScore>=policy.minimumReadinessForObservation && criticalOpenItems.length<=policy.maximumCriticalOpenItemsForObservation && Boolean(importResult?.readyForPilotComparison);
  const copilotReady=weightedScore>=policy.minimumReadinessForCopilot && criticalOpenItems.length<=policy.maximumCriticalOpenItemsForCopilot && Boolean(importResult?.readyForPilotComparison);
  const band=copilotReady?'copilot-ready':observationReady?'observation-ready':weightedScore>=50?'preparation-required':'not-ready';
  return {
    engineVersion:'2.3.0', policyVersion:policy.version, score:weightedScore, band, categoryScores,
    observationReady, copilotReady, criticalOpenItems, blockers,
    nextActions:[
      ...criticalOpenItems.map(x=>x.id),
      ...(!importResult?.readyForPilotComparison?['validate-minimum-pilot-dataset']:[]),
      ...(!institutionValidation.valid?['complete-institution-profile']:[]),
      ...(!productValidation.valid?['validate-credit-product']:[])
    ],
    safeguards:{ scoreIsNotCertification:true, productionGoLiveNotAuthorized:true, humanApprovalRequired:true, independentSecurityReviewRequired:true }
  };
}

export function buildInstitutionalPilotPackage(input = {}) {
  const importResult=validateImportedDossiers(input.csvText||'');
  const comparison=compareHumanAndCredipass(importResult.validRows);
  const roi=calculatePilotRoi({ institution:input.institution, comparison, hourlyStaffCost:input.hourlyStaffCost, monthlySupportCost:input.monthlySupportCost });
  const readiness=calculateInstitutionalReadiness({ institution:input.institution, product:input.product, importResult, checklist:input.checklist||[], comparison });
  const plan=buildPilotPlan90Days(input.institution);
  return { engineVersion:'2.3.0', institution:input.institution, product:input.product, importResult, comparison, roi, readiness, plan };
}

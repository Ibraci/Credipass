import { PRODUCT_MATCHING_POLICIES } from '../config/productMatchingPolicies.js';

const ENGINE_VERSION='3.1.0';
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,Number(v)||0));
const round=(v,d=0)=>Number(Number(v||0).toFixed(d));
const pct=(v)=>clamp(v,0,100);
const stableHash=input=>{const text=JSON.stringify(input);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return `CPM-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;};
const monthlyPayment=(principal,annualRate,months)=>{const p=Number(principal||0),n=Math.max(1,Number(months||1)),r=Number(annualRate||0)/12;if(!r)return p/n;return p*r/(1-Math.pow(1+r,-n));};

function applicantType(data){return data?.cooperativeProfile?'cooperative':'individual';}
function activityKey(data){return data?.creditRequest?.activityKey||data?.person?.activityKey||null;}
function purposeKey(data){return data?.creditRequest?.purposeKey||'workingCapital';}
function debtRisk(context){return Number(context?.debt?.overIndebtedness?.riskScore ?? context?.debt?.riskScore ?? 0);}
function savingsCoverage(context){
  const savings=Number(context?.data?.profile?.savings||0);
  const essential=Number(context?.data?.profile?.essentialExpenses||0);
  return essential>0?savings/essential:0;
}

function evaluateGate(id,label,actual,operator,threshold,blocking=true){
  let passed=true;
  if(operator==='>=')passed=Number(actual)>=Number(threshold);
  else if(operator==='<=')passed=Number(actual)<=Number(threshold);
  else if(operator==='includes')passed=Boolean(actual);
  return {id,label,actual,operator,threshold,passed,blocking};
}

export function matchFinancialProducts(context,{products=[],policyId='balanced'}={}){
  const policy=PRODUCT_MATCHING_POLICIES[policyId]||PRODUCT_MATCHING_POLICIES.balanced;
  const type=applicantType(context.data),sector=activityKey(context.data),purpose=purposeKey(context.data);
  const requestAmount=Number(context?.data?.creditRequest?.amount||context?.data?.profile?.requestedAmount||0);
  const proposedPrincipal=Number(context?.simulation?.recommended?.principal||context?.simulation?.proposedPrincipal||0);
  const targetAmount=proposedPrincipal>0?Math.min(requestAmount||proposedPrincipal,proposedPrincipal):requestAmount;
  const targetDuration=Number(context?.data?.creditRequest?.durationMonths||12);
  const safePayment=Number(context?.health?.amounts?.safeAdditionalMonthlyPayment||0);
  const seasonal=Boolean(context?.data?.creditRequest?.gracePeriodMonths>0||sector==='rainfedAgriculture'||context?.simulation?.recommended?.scheduleType==='seasonal');
  const metrics={dataConfidence:Number(context?.quality?.confidence||0),incluscore:Number(context?.incluscore?.score||0),financialHealth:Number(context?.health?.score||0),overIndebtednessRisk:debtRisk(context),coopScore:Number(context?.coopScore?.score||0),savingsCoverage:savingsCoverage(context)};

  const matches=products.map(product=>{
    const gates=[
      evaluateGate('audience','Applicant type',product.audience.includes(type),'includes',type,true),
      evaluateGate('sector','Sector',product.sectors.includes(sector),'includes',sector,true),
      evaluateGate('purpose','Financing purpose',product.purposes.includes(purpose),'includes',purpose,true),
      evaluateGate('minimum-confidence','Data confidence',metrics.dataConfidence,'>=',product.gates.minDataConfidence,true),
      evaluateGate('minimum-incluscore','INCLUSCORE',metrics.incluscore,'>=',product.gates.minIncluscore||0,true),
      evaluateGate('minimum-health','Financial health',metrics.financialHealth,'>=',product.gates.minFinancialHealth,true),
      evaluateGate('maximum-debt-risk','Over-indebtedness risk',metrics.overIndebtednessRisk,'<=',product.gates.maxOverIndebtednessRisk,true)
    ];
    if(product.gates.minCoopScore!=null)gates.push(evaluateGate('minimum-coop-score','COOP-SCORE',metrics.coopScore,'>=',product.gates.minCoopScore,true));
    if(product.gates.minSavingsCoverage!=null)gates.push(evaluateGate('minimum-savings-coverage','Savings coverage',metrics.savingsCoverage,'>=',product.gates.minSavingsCoverage,false));
    const amountInRange=targetAmount>=product.minAmount&&targetAmount<=product.maxAmount;
    gates.push(evaluateGate('amount-range','Target amount',amountInRange,'includes',`${product.minAmount}-${product.maxAmount}`,false));
    const durationInRange=targetDuration>=product.minDurationMonths&&targetDuration<=product.maxDurationMonths;
    gates.push(evaluateGate('duration-range','Target duration',durationInRange,'includes',`${product.minDurationMonths}-${product.maxDurationMonths}`,false));
    const scheduleMonths=Math.min(product.maxDurationMonths,Math.max(product.minDurationMonths,targetDuration));
    const principal=Math.min(product.maxAmount,Math.max(product.minAmount,targetAmount||product.minAmount));
    const basePayment=monthlyPayment(principal,product.nominalAnnualRate,scheduleMonths);
    const monthlyFees=(principal*(product.originationFeeRate+product.insuranceRate))/Math.max(1,scheduleMonths);
    const estimatedPayment=basePayment+monthlyFees;
    const affordabilityRatio=safePayment>0?estimatedPayment/safePayment:99;
    const affordabilityScore=pct(100-(Math.max(0,affordabilityRatio-0.65)*120));
    const dataReadiness=pct(metrics.dataConfidence);
    const strength=pct((metrics.incluscore+metrics.financialHealth)/2);
    const debtSafety=pct(100-metrics.overIndebtednessRisk);
    const eligibilityScore=pct((gates.filter(g=>['audience','sector','minimum-confidence','minimum-incluscore','minimum-health','maximum-debt-risk','minimum-coop-score','purpose'].includes(g.id)).filter(Boolean).reduce((s,g)=>s+(g.passed?1:0),0)/Math.max(1,gates.filter(g=>['audience','sector','minimum-confidence','minimum-incluscore','minimum-health','maximum-debt-risk','minimum-coop-score','purpose'].includes(g.id)).length))*100);
    const termFit=durationInRange?100:55;
    const seasonalFit=!seasonal?100:(product.seasonalSupport?100:35);
    const score=round(
      eligibilityScore*policy.weights.eligibility+
      affordabilityScore*policy.weights.affordability+
      dataReadiness*policy.weights.dataReadiness+
      strength*policy.weights.financialStrength+
      debtSafety*policy.weights.debtSafety+
      termFit*policy.weights.termFit+
      seasonalFit*policy.weights.seasonalFit
    );
    const blockingFailures=gates.filter(g=>g.blocking&&!g.passed);
    const affordabilityBlocked=affordabilityRatio>policy.affordabilityTolerance;
    let status='not-recommended';
    if(!blockingFailures.length&&!affordabilityBlocked&&score>=policy.compatibleScore)status='compatible';
    else if(!blockingFailures.length&&score>=policy.partialScore)status='partial';
    const positives=[]; const gaps=[];
    if(metrics.dataConfidence>=product.gates.minDataConfidence)positives.push('data-confidence-sufficient'); else gaps.push('increase-data-confidence');
    if(metrics.incluscore>=Number(product.gates.minIncluscore||0))positives.push('incluscore-threshold-met'); else gaps.push('incluscore-below-product-threshold');
    if(metrics.financialHealth>=product.gates.minFinancialHealth)positives.push('financial-health-threshold-met'); else gaps.push('financial-health-below-threshold');
    if(metrics.overIndebtednessRisk<=product.gates.maxOverIndebtednessRisk)positives.push('debt-risk-within-limit'); else gaps.push('debt-risk-too-high');
    if(amountInRange)positives.push('amount-within-product-range'); else gaps.push('adjust-amount-to-product-range');
    if(durationInRange)positives.push('duration-within-product-range'); else gaps.push('adjust-duration-to-product-range');
    if(seasonal&&product.seasonalSupport)positives.push('seasonality-supported'); else if(seasonal&&!product.seasonalSupport)gaps.push('seasonality-not-supported');
    if(affordabilityRatio<=1)positives.push('estimated-payment-within-prudent-capacity'); else gaps.push('estimated-payment-above-prudent-capacity');
    if(product.gates.minSavingsCoverage!=null&&metrics.savingsCoverage<product.gates.minSavingsCoverage)gaps.push('savings-buffer-below-product-target');
    const estimatedTotalCost=estimatedPayment*scheduleMonths-principal;
    return {
      productId:product.id, institution:product.institution, nameFr:product.nameFr,nameEn:product.nameEn,productVersion:product.version,
      score,status,gates,blockingFailures:blockingFailures.map(x=>x.id),positives:[...new Set(positives)],gaps:[...new Set(gaps)],
      fit:{principal,scheduleMonths,estimatedPayment:round(estimatedPayment),estimatedTotalCost:round(estimatedTotalCost),safePayment:round(safePayment),affordabilityRatio:round(affordabilityRatio,2),seasonalSupport:product.seasonalSupport,scheduleTypes:product.scheduleTypes},
      rates:{nominalAnnualRate:product.nominalAnnualRate,originationFeeRate:product.originationFeeRate,insuranceRate:product.insuranceRate},
      featuresFr:product.featuresFr,featuresEn:product.featuresEn,disclaimerFr:product.disclaimerFr,disclaimerEn:product.disclaimerEn,
      requiresHumanReview:true,automaticEligibilityDecision:false
    };
  }).sort((a,b)=>b.score-a.score||a.fit.estimatedTotalCost-b.fit.estimatedTotalCost);
  const compatible=matches.filter(x=>x.status==='compatible');
  const partial=matches.filter(x=>x.status==='partial');
  const best=compatible[0]||partial[0]||matches[0]||null;
  return {
    engineVersion:ENGINE_VERSION, policy:{id:policy.id,version:policy.version}, referenceId:stableHash({subject:context?.data?.person?.id,policy:policy.id,products:products.map(x=>x.id)}),
    applicant:{type,sector,purpose,targetAmount,targetDuration,seasonal},metrics,matches,bestMatch:best,
    summary:{productCount:matches.length,compatibleCount:compatible.length,partialCount:partial.length,notRecommendedCount:matches.filter(x=>x.status==='not-recommended').length,bestScore:best?.score||0},
    safeguards:{syntheticCatalogOnly:true,automaticCreditDecisionAllowed:false,automaticProductApprovalAllowed:false,humanValidationRequired:true,protectedCharacteristicsUsed:false,learningCompletionChangesScore:false},
    deliberatelyExcluded:['sex','gender','ethnicity','religion','politicalOpinion','privateMessages','contactGraph','socialMediaBehavior'],
    limitations:['synthetic-product-catalog','illustrative-cost-estimates','institution-must-validate-real-product-rules','matching-does-not-create-credit-right']
  };
}

export function validateProductMatchingResult(result){
  if(!result?.engineVersion||!Array.isArray(result.matches))return false;
  if(result.safeguards?.automaticCreditDecisionAllowed!==false||result.safeguards?.protectedCharacteristicsUsed!==false)return false;
  if(result.matches.some(x=>!Number.isFinite(x.score)||x.score<0||x.score>100||x.requiresHumanReview!==true))return false;
  return true;
}

export { ENGINE_VERSION as PRODUCT_MATCHING_ENGINE_VERSION };

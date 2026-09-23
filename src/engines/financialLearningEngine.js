import { FINANCIAL_LEARNING_CATALOG } from '../config/financialLearningCatalog.js';
const ENGINE_VERSION='3.1.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const stableHash=input=>{const text=JSON.stringify(input);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return `CPL-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;};

function deriveTriggers(context){
  const out=new Set(['always']);
  if(Number(context?.quality?.confidence||0)<72)out.add('low-confidence');
  if((context?.quality?.uncertainties||[]).includes('short-history'))out.add('short-history');
  if(Number(context?.cashflow?.summary?.volatility||context?.cashflow?.volatility||0)>0.20)out.add('cashflow-volatility');
  const debtRisk=Number(context?.debt?.overIndebtedness?.riskScore??context?.debt?.riskScore??0);
  if(debtRisk>=40)out.add('debt-risk');
  if((context?.debt?.flags||[]).includes('profile-debt-mismatch'))out.add('debt-mismatch');
  if((context?.debt?.flags||[]).includes('multiple-active-debts'))out.add('multiple-debt');
  const savings=Number(context?.data?.profile?.savings||0),essential=Number(context?.data?.profile?.essentialExpenses||0);
  if(essential>0&&savings/essential<0.75)out.add('low-savings');
  if(Number(context?.health?.score||0)<65)out.add('fragile-health');
  if(context?.data?.person?.activityKey==='rainfedAgriculture'||context?.data?.creditRequest?.gracePeriodMonths>0)out.add('seasonal');
  if(context?.data?.cooperativeProfile)out.add('cooperative');
  if(Number(context?.monitoring?.earlyWarning?.riskScore||0)>=35)out.add('monitoring-alert');
  return [...out];
}

export function buildFinancialLearningPlan(context,{completedModuleIds=[]}={}){
  const triggers=deriveTriggers(context);
  const candidates=FINANCIAL_LEARNING_CATALOG.map(module=>{
    const matched=module.triggers.filter(x=>triggers.includes(x));
    const relevance=matched.length?Math.max(...matched.map(x=>x==='always'?1:3)):0;
    return {...clone(module),matchedTriggers:matched,relevance,completed:completedModuleIds.includes(module.id)};
  }).filter(x=>x.relevance>0).sort((a,b)=>b.relevance-a.relevance||a.priorityBase-b.priorityBase||a.minutes-b.minutes);
  const selected=[];
  for(const item of candidates){
    if(selected.length>=5)break;
    if(!selected.some(x=>x.id===item.id))selected.push(item);
  }
  const completed=selected.filter(x=>x.completed).length;
  const totalMinutes=selected.reduce((s,x)=>s+x.minutes,0);
  const completedMinutes=selected.filter(x=>x.completed).reduce((s,x)=>s+x.minutes,0);
  return {
    engineVersion:ENGINE_VERSION,planId:stableHash({subject:context?.data?.person?.id,triggers,modules:selected.map(x=>x.id)}),subjectId:context?.data?.person?.id||'DEMO',triggers,
    modules:selected,summary:{moduleCount:selected.length,completedCount:completed,totalMinutes,completedMinutes,progressPercent:selected.length?Math.round(completed/selected.length*100):0},
    nextAction:selected.find(x=>!x.completed)||null,
    safeguards:{completionChangesIncluscore:false,completionChangesEligibility:false,completionGuaranteesCredit:false,humanCoachingRecommended:true,protectedCharacteristicsUsed:false},
    disclaimer:'Learning supports understanding and preparation. Completion never automatically increases a score or guarantees financing.'
  };
}

export function markLearningModuleCompleted(plan,{moduleId,actor,at=new Date().toISOString()}={}){
  if(!actor?.id)throw new Error('human-actor-required');
  const copy=clone(plan); const module=copy.modules.find(x=>x.id===moduleId); if(!module)throw new Error('learning-module-not-found');
  module.completed=true; module.completedAt=at; module.completedBy=actor.id;
  copy.summary.completedCount=copy.modules.filter(x=>x.completed).length;
  copy.summary.completedMinutes=copy.modules.filter(x=>x.completed).reduce((s,x)=>s+x.minutes,0);
  copy.summary.progressPercent=copy.modules.length?Math.round(copy.summary.completedCount/copy.modules.length*100):0;
  copy.nextAction=copy.modules.find(x=>!x.completed)||null;
  return copy;
}

export function validateFinancialLearningPlan(plan){
  if(!plan?.engineVersion||!Array.isArray(plan.modules))return false;
  if(plan.safeguards?.completionChangesIncluscore!==false||plan.safeguards?.completionGuaranteesCredit!==false)return false;
  return plan.modules.every(x=>x.id&&x.minutes>0&&typeof x.completed==='boolean');
}

export { ENGINE_VERSION as FINANCIAL_LEARNING_ENGINE_VERSION };

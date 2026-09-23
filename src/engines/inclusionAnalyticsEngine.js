import { INCLUSION_OBSERVATORY_POLICIES } from '../config/inclusionObservatoryPolicies.js';
const ENGINE_VERSION='3.3.0';
const round=(n,d=1)=>Number(Number(n||0).toFixed(d));
const sum=(a,fn=x=>x)=>a.reduce((s,x)=>s+Number(fn(x)||0),0);
const pct=(n,d)=>d?round((n/d)*100,1):0;
function aggregate(records,key,minCellSize){
  const groups=new Map();
  for(const r of records){const k=String(r[key]??'Unknown');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
  return [...groups.entries()].map(([label,rows])=>{
    const suppressed=rows.length<minCellSize;
    return {label,count:rows.length,suppressed,
      sharePercent:pct(rows.length,records.length),
      requestedAmount:suppressed?null:sum(rows,x=>x.requestedAmount),
      sustainableAmount:suppressed?null:sum(rows,x=>x.sustainableAmount),
      approvedAmount:suppressed?null:sum(rows,x=>x.approvedAmount),
      financedRate:suppressed?null:pct(rows.filter(x=>x.financed).length,rows.length),
      completionRate:suppressed?null:pct(rows.filter(x=>x.complete).length,rows.length),
      avgProcessingMinutes:suppressed?null:round(sum(rows,x=>x.processingMinutes)/rows.length,1)
    };
  }).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
}
function reasonTable(records,minCellSize){
  const bad=records.filter(x=>!x.complete);const map=new Map();for(const r of bad){const k=r.incompleteReason||'other';map.set(k,(map.get(k)||0)+1);}
  return [...map.entries()].map(([reason,count])=>({reason,count,suppressed:count<minCellSize,sharePercent:pct(count,bad.length)})).sort((a,b)=>b.count-a.count);
}
function target(actual,target,direction='at-least'){const passed=direction==='at-most'?actual<=target:actual>=target;return{actual,target,direction,passed};}
export function buildInclusionObservatory(dataset,{policyId='balanced',publicationTier='institutional'}={}){
  const policy=INCLUSION_OBSERVATORY_POLICIES[policyId]||INCLUSION_OBSERVATORY_POLICIES.balanced;
  const records=(dataset?.records||[]).filter(x=>x?.synthetic===true);
  const minCellSize=publicationTier==='public'?policy.minimumPublicCellSize:policy.minimumInstitutionCellSize;
  const total=records.length, complete=records.filter(x=>x.complete), financed=records.filter(x=>x.financed), appeals=records.filter(x=>x.appeal);
  const women=records.filter(x=>x.gender==='F').length, youth=records.filter(x=>x.age<=policy.youthMaxAge).length, rural=records.filter(x=>policy.ruralZones.includes(x.zone)).length, producers=records.filter(x=>x.producer).length;
  const completionRate=pct(complete.length,total), avgProcessingMinutes=round(sum(records,x=>x.processingMinutes)/Math.max(total,1),1), offlineShare=pct(records.filter(x=>x.offline).length,total), womenShare=pct(women,total), youthShare=pct(youth,total);
  const requested=sum(records,x=>x.requestedAmount), sustainable=sum(records,x=>x.sustainableAmount), approved=sum(records,x=>x.approvedAmount);
  const repaymentRows=records.filter(x=>x.repaymentCurrent!==null);
  const summary={totalBeneficiaries:total,womenShare,youthShare,ruralShare:pct(rural,total),producerShare:pct(producers,total),completionRate,financedRate:pct(financed.length,total),offlineShare,progressionShare:pct(records.filter(x=>x.improved).length,total),appealRate:pct(appeals.length,total),appealResolutionRate:pct(appeals.filter(x=>x.appealResolved).length,appeals.length),repaymentCurrentRate:pct(repaymentRows.filter(x=>x.repaymentCurrent).length,repaymentRows.length),avgProcessingMinutes,requestedAmount:requested,sustainableAmount:sustainable,approvedAmount:approved,financingGap:Math.max(0,requested-sustainable),sustainableToRequestedRate:pct(sustainable,requested)};
  const targets={womenShare:target(womenShare,policy.targetWomenShare),youthShare:target(youthShare,policy.targetYouthShare),completionRate:target(completionRate,policy.targetCompletionRate),offlineShare:target(offlineShare,policy.targetOfflineShare),processingMinutes:target(avgProcessingMinutes,policy.targetProcessingMinutes,'at-most')};
  return {engineVersion:ENGINE_VERSION,dataset:{id:dataset.datasetId,synthetic:true,recordCount:total,generatedAt:dataset.generatedAt},policy:{id:policy.id,version:policy.version,publicationTier,minCellSize},summary,targets,byZone:aggregate(records,'zone',minCellSize),bySector:aggregate(records,'sector',minCellSize),byMonth:aggregate(records,'createdMonth',minCellSize),incompleteReasons:reasonTable(records,minCellSize),privacy:{rowLevelExportAllowed:false,exactLocationPublished:false,smallCellSuppression:true,minimumCellSize:minCellSize,protectedAttributeUse:'aggregate-impact-monitoring-only',protectedAttributesUsedForCreditDecision:false},limitations:['synthetic-demonstration-data','not-a-national-statistic','not-a-credit-decision-engine','pilot-targets-require-field-validation']};
}
export function exportObservatoryAggregate(result,format='json'){
  const safe={schema:'CREDIPASS-OBSERVATORY-AGGREGATE-1',generatedAt:new Date().toISOString(),dataset:result.dataset,policy:result.policy,summary:result.summary,targets:result.targets,byZone:result.byZone,bySector:result.bySector,byMonth:result.byMonth,incompleteReasons:result.incompleteReasons,privacy:result.privacy,limitations:result.limitations};
  if(format==='json')return safe;
  const rows=[['dimension','label','count','share_percent','approved_amount','completion_rate','financed_rate']];
  for(const [dimension,items] of [['zone',result.byZone],['sector',result.bySector],['month',result.byMonth]])for(const x of items)rows.push([dimension,x.label,x.count,x.sharePercent,x.suppressed?'SUPPRESSED':x.approvedAmount,x.suppressed?'SUPPRESSED':x.completionRate,x.suppressed?'SUPPRESSED':x.financedRate]);
  return rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
}
export function validateInclusionObservatory(result){return Boolean(result?.dataset?.synthetic===true&&result?.policy?.minCellSize>=5&&result?.privacy?.rowLevelExportAllowed===false&&result?.privacy?.smallCellSuppression===true&&result?.privacy?.protectedAttributesUsedForCreditDecision===false&&Array.isArray(result.byZone)&&Array.isArray(result.bySector));}

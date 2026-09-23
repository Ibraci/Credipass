const num=v=>Number.isFinite(Number(v))?Number(v):0;
export function assessGuarantee(item={},creditAmount=0){
 const declared=Math.max(0,num(item.declaredValue));
 const appraised=item.appraisedValue==null||item.appraisedValue===''?null:Math.max(0,num(item.appraisedValue));
 const haircut=Math.max(0,Math.min(100,num(item.haircutPercent)));
 const retained=appraised==null?null:Math.round(appraised*(1-haircut/100));
 const coverage=retained==null||num(creditAmount)<=0?null:Math.round(retained/num(creditAmount)*1000)/10;
 return {...item,declaredValue:declared,appraisedValue:appraised,haircutPercent:haircut,retainedValue:retained,coveragePercent:coverage,verified:Boolean(item.owner&&item.evidenceRef&&item.expert&&item.appraisalDate&&appraised!=null),status:appraised==null?'À expertiser':Boolean(item.owner&&item.evidenceRef&&item.expert&&item.appraisalDate)?'Documentée':'À compléter'};
}
export function assessGuaranteePortfolio(items=[],creditAmount=0){const guarantees=items.map(x=>assessGuarantee(x,creditAmount));const retainedTotal=guarantees.reduce((s,x)=>s+num(x.retainedValue),0);return {guarantees,retainedTotal,coveragePercent:num(creditAmount)>0?Math.round(retainedTotal/num(creditAmount)*1000)/10:null,warning:'La garantie complète l’analyse mais ne remplace jamais la capacité de remboursement.'};}

import { sampleAissata, EXPECTED_PERIODS } from '../fixtures/sample-aissata.js';
const clone=v=>JSON.parse(JSON.stringify(v));
const n=(v,d=0)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):d;
export function buildCustomCase(input={}){
 const base=clone(sampleAissata); const sales=(input.sales||[]).map(Number); const costs=(input.costs||[]).map(Number);
 base.person={...base.person,id:String(input.reference||'CUSTOM-001'),name:String(input.name||'Demandeur fictif'),city:String(input.city||'Bamako'),activityKey:String(input.activityKey||'grainTrade'),applicantType:String(input.applicantType||'Personne physique'),legalForm:String(input.legalForm||''),dependents:n(input.dependents,0)};
 base.profile={...base.profile,formalIncome:0,informalIncome:n(input.informalIncome,0),seasonalIncomeAverage:n(input.seasonalIncomeAverage,0),essentialExpenses:n(input.essentialExpenses,0),existingDebtPayments:n(input.debtPayment,0),savings:n(input.savings,0),equipmentValue:n(input.equipmentValue,0),activityAgeMonths:n(input.activityAgeMonths,12),cooperativeMembershipMonths:0,repaymentHistoryMonths:0,requestedAmount:n(input.requestedAmount,0),completeness:75,reliability:65};
 base.creditRequest={...base.creditRequest,amount:base.profile.requestedAmount,durationMonths:Math.max(1,n(input.durationMonths,12)),activityKey:base.person.activityKey,startDate:'2026-09-17',gracePeriodMonths:0};
 const dates=['2026-05-31','2026-06-30','2026-07-31']; const ev=[];
 EXPECTED_PERIODS.forEach((p,i)=>{ev.push({id:`CUSTOM-SALES-${i+1}`,typeKey:'salesNotebook',sourceKey:'beneficiary',amount:n(sales[i],base.profile.informalIncome),date:dates[i],period:p,status:'declared',verification:65,diversityGroup:'sales',usable:true,cashflowMode:'direct',flowType:'inflow',nature:'business',operationKey:`CUSTOM-SALES-${p}`});ev.push({id:`CUSTOM-COST-${i+1}`,typeKey:'supplierReceipt',sourceKey:'supplier',amount:n(costs[i],0),date:dates[i],period:p,status:'documented',verification:72,diversityGroup:'supplier',usable:true,cashflowMode:'direct',flowType:'outflow',nature:'business',operationKey:`CUSTOM-COST-${p}`});});
 if(base.profile.savings>0)ev.push({id:'CUSTOM-SAVINGS',typeKey:'savingsStatement',sourceKey:'beneficiary',amount:base.profile.savings,date:'2026-09-17',period:'2026-07',status:'declared',verification:55,diversityGroup:'savings',usable:true,cashflowMode:'noncash',flowType:'stock',nature:'financial',operationKey:'CUSTOM-SAVINGS'});
 if(base.profile.equipmentValue>0)ev.push({id:'CUSTOM-STOCK',typeKey:'stockPhoto',sourceKey:'fieldAgent',amount:base.profile.equipmentValue,date:'2026-09-17',period:'2026-07',status:'observed',verification:70,diversityGroup:'field',usable:true,cashflowMode:'noncash',flowType:'stock',nature:'business',operationKey:'CUSTOM-STOCK'});
 base.evidence=ev;
 base.debts=base.profile.existingDebtPayments>0?[{id:'CUSTOM-DEBT-01',creditorKey:'other',productKey:'workingCapitalLoan',principalOutstanding:base.profile.existingDebtPayments*6,monthlyPayment:base.profile.existingDebtPayments,remainingMonths:6,status:'declared',verification:55,consented:true,active:true,sourceKey:'beneficiary'}]:[];
 base.scenarioId='custom'; return base;
}

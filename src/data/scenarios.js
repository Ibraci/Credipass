import { sampleAissata } from '../fixtures/sample-aissata.js';
import { sampleMamadou } from '../fixtures/sample-mamadou.js';
import { sampleCooperative } from '../fixtures/sample-cooperative.js';
import { buildCustomCase } from './custom-case.js';

const clone = value => JSON.parse(JSON.stringify(value));

export function buildScenario(id = 'baseline', customInput = null) {
  if (id === 'custom') return buildCustomCase(customInput || {});
  const source = ['mamadou','mamadouWeak'].includes(id) ? sampleMamadou : id === 'cooperative' ? sampleCooperative : sampleAissata;
  const data = clone(source);
  data.scenarioId = id;

  if (id === 'fatoumata') {
    data.person = { ...data.person, id:'BEN-ML-0003', name:'Fatoumata Diallo', city:'Sikasso', activityKey:'grainTrade', dependents:2 };
    data.profile = { ...data.profile, informalIncome:315000, seasonalIncomeAverage:145000, essentialExpenses:205000, existingDebtPayments:18000, savings:165000, equipmentValue:390000, activityAgeMonths:54, requestedAmount:400000, completeness:90, reliability:79 };
    data.creditRequest = { ...data.creditRequest, amount:400000, durationMonths:12, gracePeriodMonths:1, activityKey:'grainTrade' };
    const sales = { 'EV-SALES-MAY':220000, 'EV-SALES-JUN':315000, 'EV-SALES-JUL':465000 };
    const suppliers = { 'EV-SUP-MAY':155000, 'EV-SUP-JUN':190000, 'EV-SUP-JUL':245000 };
    data.evidence.forEach(item => { if (sales[item.id] !== undefined) item.amount=sales[item.id]; if (suppliers[item.id] !== undefined) item.amount=suppliers[item.id]; });
  }
  if (id === 'startup') {
    data.person = { ...data.person, id:'ENT-ML-0001', name:'Kanu Agro SARL', city:'Bamako', activityKey:'grainTrade', applicantType:'Personne morale', legalForm:'SARL', dependents:0 };
    data.profile = { ...data.profile, informalIncome:720000, seasonalIncomeAverage:90000, essentialExpenses:410000, existingDebtPayments:65000, savings:350000, equipmentValue:1250000, activityAgeMonths:28, requestedAmount:1200000, completeness:86, reliability:78 };
    data.creditRequest = { ...data.creditRequest, amount:1200000, durationMonths:18, activityKey:'grainTrade' };
    const sales = { 'EV-SALES-MAY':680000, 'EV-SALES-JUN':760000, 'EV-SALES-JUL':810000 };
    const suppliers = { 'EV-SUP-MAY':340000, 'EV-SUP-JUN':370000, 'EV-SUP-JUL':390000 };
    data.evidence.forEach(item => { if (sales[item.id] !== undefined) item.amount=sales[item.id]; if (suppliers[item.id] !== undefined) item.amount=suppliers[item.id]; });
  }
  if (id === 'mamadouWeak') {
    data.person = { ...data.person, name:'Mamadou Coulibaly', city:'Ségou' };
    data.profile = { ...data.profile, completeness:62, reliability:49, requestedAmount:300000 };
    data.creditRequest = { ...data.creditRequest, amount:300000, durationMonths:12 };
    data.evidence.forEach((item,index) => { if (index % 3 === 0) { item.status='declared'; item.verification=45; } if (index % 5 === 0) { item.usable=false; item.status='revoked'; item.reasonKey='temporarilyUnavailable'; } });
  }
  if (id === 'aminataDebt') {
    data.person = { ...data.person, id:'BEN-ML-0004', name:'Aminata Dembélé', city:'Bamako', activityKey:'grainTrade', dependents:4 };
    data.profile = { ...data.profile, informalIncome:330000, seasonalIncomeAverage:45000, essentialExpenses:215000, existingDebtPayments:95000, savings:50000, requestedAmount:500000, completeness:88, reliability:76 };
    data.creditRequest = { ...data.creditRequest, amount:500000, durationMonths:12 };
    data.debts = [
      { id:'AM-DEBT-01', creditorKey:'cooperative', productKey:'workingCapitalLoan', principalOutstanding:260000, monthlyPayment:55000, remainingMonths:6, status:'verified', verification:94, consented:true, active:true, sourceKey:'cooperative' },
      { id:'AM-DEBT-02', creditorKey:'mobileMoneyProvider', productKey:'digitalLoan', principalOutstanding:160000, monthlyPayment:40000, remainingMonths:5, status:'documented', verification:82, consented:true, active:true, sourceKey:'consentedMobileMoney' }
    ];
  }

  if (id === 'missing') {
    const item = data.evidence.find(x => x.id === 'EV-SALES-JUN');
    if (item) {
      item.usable = false;
      item.status = 'revoked';
      item.reasonKey = 'temporarilyUnavailable';
    }
  }
  if (id === 'conflict') {
    const item = data.evidence.find(x => x.id === 'EV-SALES-JUL');
    if (item) {
      item.usable = false;
      item.status = 'contradictory';
      item.reasonKey = 'salesAmountConflict';
      item.verification = 30;
    }
  }
  if (id === 'lowConfidence') {
    data.profile.reliability = 48;
    data.profile.completeness = 64;
    data.evidence.forEach(item => {
      if (item.typeKey === 'salesNotebook') {
        item.status = 'declared';
        item.verification = 45;
      } else if (item.typeKey === 'stockPhoto') {
        item.status = 'estimated';
        item.verification = 35;
      } else {
        item.status = 'revoked';
        item.usable = false;
        item.reasonKey = 'temporarilyUnavailable';
      }
    });
  }
  if (id === 'fragile') {
    data.profile.informalIncome = 205000;
    data.profile.seasonalIncomeAverage = 25000;
    data.profile.essentialExpenses = 205000;
    data.profile.existingDebtPayments = 55000;
    data.profile.savings = 30000;
    data.profile.equipmentValue = 150000;
    data.profile.activityAgeMonths = 10;
    data.profile.reliability = 67;
    data.profile.completeness = 78;
    const sales = { 'EV-SALES-MAY':230000, 'EV-SALES-JUN':205000, 'EV-SALES-JUL':190000 };
    const suppliers = { 'EV-SUP-MAY':150000, 'EV-SUP-JUN':155000, 'EV-SUP-JUL':160000 };
    data.evidence.forEach(item => {
      if (sales[item.id] !== undefined) item.amount = sales[item.id];
      if (suppliers[item.id] !== undefined) item.amount = suppliers[item.id];
      if (item.id === 'EV-SAVINGS') item.amount = 30000;
      if (item.id === 'EV-STOCK') item.amount = 150000;
      if (item.id === 'EV-MM-JUL') item.amount = 90000;
    });
    data.debts = [
      { id:'DEBT-COOP-01', creditorKey:'cooperative', productKey:'workingCapitalLoan', principalOutstanding:140000, monthlyPayment:30000, remainingMonths:6, status:'verified', verification:94, consented:true, active:true, sourceKey:'cooperative' },
      { id:'DEBT-MM-02', creditorKey:'mobileMoneyProvider', productKey:'digitalLoan', principalOutstanding:150000, monthlyPayment:25000, remainingMonths:7, status:'documented', verification:82, consented:true, active:true, sourceKey:'consentedMobileMoney' }
    ];
  }
  if (id === 'debtStress') {
    data.profile.existingDebtPayments = 55000;
    data.profile.savings = 45000;
    data.profile.completeness = 82;
    data.profile.reliability = 70;
    data.debts = [
      { id:'DEBT-COOP-01', creditorKey:'cooperative', productKey:'workingCapitalLoan', principalOutstanding:180000, monthlyPayment:30000, remainingMonths:7, status:'verified', verification:95, consented:true, active:true, sourceKey:'cooperative' },
      { id:'DEBT-MM-02', creditorKey:'mobileMoneyProvider', productKey:'digitalLoan', principalOutstanding:120000, monthlyPayment:25000, remainingMonths:5, status:'documented', verification:80, consented:true, active:true, sourceKey:'consentedMobileMoney' },
      { id:'DEBT-INFORMAL-03', creditorKey:'supplier', productKey:'supplierAdvance', principalOutstanding:90000, monthlyPayment:20000, remainingMonths:5, status:'declared', verification:50, consented:true, active:true, sourceKey:'beneficiary' },
      { id:'DEBT-CONTESTED-04', creditorKey:'other', productKey:'contestedDebt', principalOutstanding:60000, monthlyPayment:15000, remainingMonths:4, status:'contested', verification:35, consented:true, active:true, sourceKey:'beneficiary' },
      { id:'DEBT-NOCONSENT-05', creditorKey:'other', productKey:'unknownThirdPartyDebt', principalOutstanding:500000, monthlyPayment:80000, remainingMonths:8, status:'documented', verification:70, consented:false, active:true, sourceKey:'thirdParty' }
    ];
  }

  if (id === 'highRequest') {
    data.profile.requestedAmount = 900000;
    data.creditRequest.amount = 900000;
    data.creditRequest.durationMonths = 18;
  }
  if (id === 'seasonalShock') {
    data.profile.requestedAmount = 500000;
    data.creditRequest.amount = 500000;
    data.creditRequest.durationMonths = 18;
    data.creditRequest.gracePeriodMonths = 1;
    data.profile.seasonalIncomeAverage = 115000;
    data.profile.informalIncome = 260000;
    const sales = { 'EV-SALES-MAY':210000, 'EV-SALES-JUN':255000, 'EV-SALES-JUL':335000 };
    data.evidence.forEach(item => { if (sales[item.id] !== undefined) item.amount = sales[item.id]; });
  }
  return data;
}

const clone=value=>JSON.parse(JSON.stringify(value));
const round=value=>Math.round(Number(value||0));

const histories={
  'BEN-ML-0001':[
    { period:'2026-09', expectedInflow:300000, actualInflow:310000, savingsBalance:148000, contributionExpected:10000, contributionPaid:10000, installmentDue:25000, installmentPaid:25000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:86, verified:true, noteKey:'normal-start' },
    { period:'2026-10', expectedInflow:302000, actualInflow:305000, savingsBalance:151000, contributionExpected:10000, contributionPaid:10000, installmentDue:25000, installmentPaid:25000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:86, verified:true, noteKey:'stable-activity' },
    { period:'2026-11', expectedInflow:300000, actualInflow:296000, savingsBalance:149000, contributionExpected:10000, contributionPaid:10000, installmentDue:25000, installmentPaid:25000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:84, verified:true, noteKey:'minor-softening' },
    { period:'2026-12', expectedInflow:295000, actualInflow:286000, savingsBalance:141000, contributionExpected:10000, contributionPaid:10000, installmentDue:25000, installmentPaid:25000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:83, verified:true, noteKey:'cost-pressure' },
    { period:'2027-01', expectedInflow:295000, actualInflow:270000, savingsBalance:134000, contributionExpected:10000, contributionPaid:10000, installmentDue:25000, installmentPaid:25000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:80, verified:true, noteKey:'sales-decline' },
    { period:'2027-02', expectedInflow:295000, actualInflow:258000, savingsBalance:128000, contributionExpected:10000, contributionPaid:0, installmentDue:25000, installmentPaid:22000, daysPastDue:3, activeDebtCount:1, businessOperational:true, dataConfidence:78, verified:true, noteKey:'early-pressure' }
  ],
  'BEN-ML-0002':[
    { period:'2026-09', expectedInflow:120000, actualInflow:118000, savingsBalance:112000, contributionExpected:8000, contributionPaid:8000, installmentDue:0, installmentPaid:0, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:87, verified:true, seasonalPhase:'grace', noteKey:'agricultural-grace' },
    { period:'2026-10', expectedInflow:90000, actualInflow:86000, savingsBalance:105000, contributionExpected:8000, contributionPaid:8000, installmentDue:0, installmentPaid:0, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:86, verified:true, seasonalPhase:'low', noteKey:'low-season-expected' },
    { period:'2026-11', expectedInflow:145000, actualInflow:136000, savingsBalance:101000, contributionExpected:8000, contributionPaid:8000, installmentDue:18000, installmentPaid:18000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:85, verified:true, seasonalPhase:'normal', noteKey:'harvest-start' },
    { period:'2026-12', expectedInflow:390000, actualInflow:360000, savingsBalance:130000, contributionExpected:8000, contributionPaid:8000, installmentDue:52000, installmentPaid:52000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:86, verified:true, seasonalPhase:'peak', noteKey:'harvest-sales' },
    { period:'2027-01', expectedInflow:420000, actualInflow:388000, savingsBalance:154000, contributionExpected:8000, contributionPaid:8000, installmentDue:56000, installmentPaid:56000, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:86, verified:true, seasonalPhase:'peak', noteKey:'peak-repayment' }
  ],
  'COOP-ML-0001':[]
};

export function buildPostFinancingHistory(data, options={}) {
  const existing=histories[data?.person?.id] || [];
  if(existing.length) return clone(existing);
  if(data?.cooperativeProfile && Number(options.groupFinancing?.disbursement?.disbursedAmount||0)>0){
    const due=round(Number(options.groupFinancing?.financing?.totalRepayable||0)/Math.max(1,Number(options.groupFinancing?.financing?.durationMonths||12)));
    return [
      { period:'2026-09', expectedInflow:1450000, actualInflow:1430000, savingsBalance:680000, contributionExpected:52000, contributionPaid:52000, installmentDue:due, installmentPaid:due, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:92, verified:true, noteKey:'collective-first-cycle' },
      { period:'2026-10', expectedInflow:1500000, actualInflow:1390000, savingsBalance:645000, contributionExpected:52000, contributionPaid:50000, installmentDue:due, installmentPaid:due, daysPastDue:0, activeDebtCount:1, businessOperational:true, dataConfidence:90, verified:true, noteKey:'collective-softening' }
    ];
  }
  return [];
}

function nextPeriod(period){
  const [year,month]=String(period||'2027-02').split('-').map(Number);
  const d=new Date(Date.UTC(year,month,1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}

export function buildMonitoringShockObservation(data, monitoringCase, type='downturn') {
  const latest=monitoringCase?.observations?.at(-1) || null;
  const baseline=monitoringCase?.baseline || {};
  const period=nextPeriod(latest?.period);
  const expected=Math.max(1,round(latest?.expectedInflow || baseline.expectedInflow || data?.profile?.informalIncome || 250000));
  const due=Math.max(0,round(latest?.installmentDue || baseline.monthlyInstallment || 25000));
  if(type==='recovery'){
    return {
      period, expectedInflow:expected, actualInflow:round(expected*0.96),
      savingsBalance:round(Math.max(latest?.savingsBalance||0,baseline.initialSavings||0)*1.04),
      contributionExpected:round(latest?.contributionExpected||10000), contributionPaid:round(latest?.contributionExpected||10000),
      installmentDue:due, installmentPaid:due, daysPastDue:0,
      activeDebtCount:Number(latest?.activeDebtCount||baseline.initialDebtCount||0), businessOperational:true,
      dataConfidence:Math.min(100,Number(latest?.dataConfidence||baseline.initialDataConfidence||80)+5), verified:true,
      noteKey:'recovery-after-support'
    };
  }
  return {
    period, expectedInflow:expected, actualInflow:round(expected*0.55),
    savingsBalance:round(Math.max(0,Number(latest?.savingsBalance||baseline.initialSavings||0)*0.62)),
    contributionExpected:round(latest?.contributionExpected||10000), contributionPaid:0,
    installmentDue:due, installmentPaid:round(due*0.40), daysPastDue:18,
    activeDebtCount:Number(latest?.activeDebtCount||baseline.initialDebtCount||0)+1, businessOperational:true,
    dataConfidence:Math.max(0,Number(latest?.dataConfidence||baseline.initialDataConfidence||80)-18), verified:true,
    noteKey:'simulated-severe-downturn'
  };
}

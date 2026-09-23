export const EXPECTED_PERIODS = ['2026-05', '2026-06', '2026-07'];

export const sampleAissata = {
  person: {
    id: 'BEN-ML-0001',
    name: 'Aïssata Traoré',
    country: 'Mali',
    city: 'Bamako',
    activityKey: 'grainTrade',
    dependents: 3
  },
  profile: {
    formalIncome: 0,
    informalIncome: 285000,
    seasonalIncomeAverage: 70000,
    essentialExpenses: 198000,
    existingDebtPayments: 25000,
    savings: 145000,
    equipmentValue: 310000,
    activityAgeMonths: 48,
    cooperativeMembershipMonths: 26,
    repaymentHistoryMonths: 0,
    requestedAmount: 350000,
    completeness: 86,
    reliability: 72
  },
  creditRequest: {
    amount: 350000,
    durationMonths: 18,
    startDate: '2026-09-01',
    activityKey: 'grainTrade',
    gracePeriodMonths: 0,
    purposeKey: 'workingCapital'
  },
  debts: [
    {
      id:'DEBT-COOP-01', creditorKey:'cooperative', productKey:'workingCapitalLoan',
      principalOutstanding:120000, monthlyPayment:25000, remainingMonths:5,
      status:'verified', verification:96, consented:true, active:true,
      sourceKey:'cooperative', startDate:'2026-02-15'
    }
  ],
  evidence: [
    { id:'EV-SALES-MAY', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:260000, date:'2026-05-31', period:'2026-05', status:'documented', verification:78, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'SALES-2026-05' },
    { id:'EV-SALES-JUN', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:292000, date:'2026-06-30', period:'2026-06', status:'documented', verification:82, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'SALES-2026-06' },
    { id:'EV-SALES-JUL', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:303000, date:'2026-07-31', period:'2026-07', status:'documented', verification:86, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'SALES-2026-07' },

    { id:'EV-SUP-MAY', typeKey:'supplierReceipt', sourceKey:'supplier', amount:148000, date:'2026-05-26', period:'2026-05', status:'verified', verification:91, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'SUPPLIER-2026-05' },
    { id:'EV-SUP-JUN', typeKey:'supplierReceipt', sourceKey:'supplier', amount:161000, date:'2026-06-25', period:'2026-06', status:'verified', verification:92, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'SUPPLIER-2026-06' },
    { id:'EV-SUP-JUL', typeKey:'supplierReceipt', sourceKey:'supplier', amount:169000, date:'2026-07-28', period:'2026-07', status:'verified', verification:91, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'SUPPLIER-2026-07' },

    { id:'EV-TRANS-MAY', typeKey:'transportLog', sourceKey:'beneficiary', amount:22000, date:'2026-05-30', period:'2026-05', status:'declared', verification:60, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'TRANSPORT-2026-05' },
    { id:'EV-TRANS-JUN', typeKey:'transportLog', sourceKey:'beneficiary', amount:24000, date:'2026-06-29', period:'2026-06', status:'documented', verification:70, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'TRANSPORT-2026-06' },
    { id:'EV-TRANS-JUL', typeKey:'transportLog', sourceKey:'beneficiary', amount:26000, date:'2026-07-30', period:'2026-07', status:'documented', verification:74, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'TRANSPORT-2026-07' },

    { id:'EV-COOP-MAY', typeKey:'coopContribution', sourceKey:'cooperative', amount:10000, date:'2026-05-29', period:'2026-05', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-2026-05' },
    { id:'EV-COOP-JUN', typeKey:'coopContribution', sourceKey:'cooperative', amount:10000, date:'2026-06-28', period:'2026-06', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-2026-06' },
    { id:'EV-COOP-JUL', typeKey:'coopContribution', sourceKey:'cooperative', amount:10000, date:'2026-07-29', period:'2026-07', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-2026-07' },

    { id:'EV-MM-JUL', typeKey:'mobileMoney', sourceKey:'consentedMobileMoney', amount:172000, date:'2026-07-30', period:'2026-07', status:'documented', verification:83, diversityGroup:'mobile-money', usable:true, cashflowMode:'corroborating', flowType:'inflow', nature:'business', operationKey:'MM-SUMMARY-2026-07', noteKey:'notDoubleCounted' },
    { id:'EV-SAVINGS', typeKey:'savingsStatement', sourceKey:'cooperative', amount:145000, date:'2026-08-01', period:'2026-07', status:'verified', verification:96, diversityGroup:'savings', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'financial', operationKey:'SAVINGS-BALANCE-2026-08' },
    { id:'EV-STOCK', typeKey:'stockPhoto', sourceKey:'fieldAgent', amount:310000, date:'2026-07-29', period:'2026-07', status:'observed', verification:88, diversityGroup:'field', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'business', operationKey:'STOCK-OBS-2026-07' },
    { id:'EV-CONFLICT', typeKey:'supplierReceipt', sourceKey:'beneficiary', amount:465000, date:'2026-07-28', period:'2026-07', status:'contradictory', verification:35, diversityGroup:'supplier', usable:false, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'SUPPLIER-CONFLICT-2026-07', reasonKey:'unjustifiedSupplierAmount' }
  ]
};

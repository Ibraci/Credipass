export const sampleMamadou = {
  person: {
    id: 'BEN-ML-0002',
    name: 'Mamadou Sidibé',
    country: 'Mali',
    city: 'Ségou',
    activityKey: 'rainfedAgriculture',
    dependents: 5
  },
  profile: {
    formalIncome: 0,
    informalIncome: 90000,
    seasonalIncomeAverage: 255000,
    essentialExpenses: 175000,
    existingDebtPayments: 18000,
    savings: 110000,
    equipmentValue: 520000,
    activityAgeMonths: 72,
    cooperativeMembershipMonths: 38,
    repaymentHistoryMonths: 18,
    requestedAmount: 550000,
    completeness: 91,
    reliability: 81
  },
  creditRequest: {
    amount: 550000,
    durationMonths: 18,
    startDate: '2026-09-01',
    activityKey: 'rainfedAgriculture',
    gracePeriodMonths: 2,
    purposeKey: 'agriculturalInputs'
  },
  debts: [
    { id:'DEBT-AGRI-01', creditorKey:'cooperative', productKey:'workingCapitalLoan', principalOutstanding:72000, monthlyPayment:18000, remainingMonths:4, status:'verified', verification:94, consented:true, active:true, sourceKey:'cooperative', startDate:'2026-04-01' }
  ],
  evidence: [
    { id:'MM-SALES-MAY', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:165000, date:'2026-05-31', period:'2026-05', status:'documented', verification:80, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'MAM-SALES-2026-05' },
    { id:'MM-SALES-JUN', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:190000, date:'2026-06-30', period:'2026-06', status:'documented', verification:82, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'MAM-SALES-2026-06' },
    { id:'MM-SALES-JUL', typeKey:'salesNotebook', sourceKey:'beneficiary', amount:225000, date:'2026-07-31', period:'2026-07', status:'documented', verification:85, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'MAM-SALES-2026-07' },
    { id:'MM-SUP-MAY', typeKey:'supplierReceipt', sourceKey:'supplier', amount:98000, date:'2026-05-24', period:'2026-05', status:'verified', verification:92, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-SUP-2026-05' },
    { id:'MM-SUP-JUN', typeKey:'supplierReceipt', sourceKey:'supplier', amount:112000, date:'2026-06-22', period:'2026-06', status:'verified', verification:93, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-SUP-2026-06' },
    { id:'MM-SUP-JUL', typeKey:'supplierReceipt', sourceKey:'supplier', amount:118000, date:'2026-07-26', period:'2026-07', status:'verified', verification:92, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-SUP-2026-07' },
    { id:'MM-TRANS-MAY', typeKey:'transportLog', sourceKey:'beneficiary', amount:16000, date:'2026-05-29', period:'2026-05', status:'documented', verification:72, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-TRANSPORT-2026-05' },
    { id:'MM-TRANS-JUN', typeKey:'transportLog', sourceKey:'beneficiary', amount:18000, date:'2026-06-28', period:'2026-06', status:'documented', verification:74, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-TRANSPORT-2026-06' },
    { id:'MM-TRANS-JUL', typeKey:'transportLog', sourceKey:'beneficiary', amount:19000, date:'2026-07-29', period:'2026-07', status:'documented', verification:76, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'MAM-TRANSPORT-2026-07' },
    { id:'MM-COOP-MAY', typeKey:'coopContribution', sourceKey:'cooperative', amount:8000, date:'2026-05-28', period:'2026-05', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'MAM-COOP-2026-05' },
    { id:'MM-COOP-JUN', typeKey:'coopContribution', sourceKey:'cooperative', amount:8000, date:'2026-06-28', period:'2026-06', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'MAM-COOP-2026-06' },
    { id:'MM-COOP-JUL', typeKey:'coopContribution', sourceKey:'cooperative', amount:8000, date:'2026-07-28', period:'2026-07', status:'verified', verification:96, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'MAM-COOP-2026-07' },
    { id:'MM-MM-JUL', typeKey:'mobileMoney', sourceKey:'consentedMobileMoney', amount:128000, date:'2026-07-30', period:'2026-07', status:'documented', verification:84, diversityGroup:'mobile-money', usable:true, cashflowMode:'corroborating', flowType:'inflow', nature:'business', operationKey:'MAM-MM-2026-07', noteKey:'notDoubleCounted' },
    { id:'MM-SAVINGS', typeKey:'savingsStatement', sourceKey:'cooperative', amount:110000, date:'2026-08-01', period:'2026-07', status:'verified', verification:96, diversityGroup:'savings', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'financial', operationKey:'MAM-SAVINGS-2026-08' },
    { id:'MM-EQUIP', typeKey:'stockPhoto', sourceKey:'fieldAgent', amount:520000, date:'2026-07-27', period:'2026-07', status:'observed', verification:90, diversityGroup:'field', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'business', operationKey:'MAM-EQUIP-2026-07' }
  ],
  sampleNarrative: {
    kind:'agricultural',
    challenge:'Financer les intrants sans imposer une mensualité identique pendant les mois creux.',
    proof:'Historique de récoltes, cotisations, épargne et équipements observés.',
    transformation:'Calendrier agricole versionné, grâce explicite et échéancier saisonnier soumis à validation humaine.'
  }
};

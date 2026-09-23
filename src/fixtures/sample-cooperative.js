export const sampleCooperative = {
  person: {
    id: 'COOP-ML-0042',
    name: 'Coopérative Benkadi de Koutiala',
    country: 'Mali',
    city: 'Koutiala',
    activityKey: 'grainTrade',
    dependents: 0
  },
  profile: {
    formalIncome: 0,
    informalIncome: 920000,
    seasonalIncomeAverage: 280000,
    essentialExpenses: 735000,
    existingDebtPayments: 75000,
    savings: 680000,
    equipmentValue: 2450000,
    activityAgeMonths: 96,
    cooperativeMembershipMonths: 96,
    repaymentHistoryMonths: 36,
    requestedAmount: 1500000,
    completeness: 94,
    reliability: 86
  },
  creditRequest: {
    amount: 1500000,
    durationMonths: 24,
    startDate: '2026-09-01',
    activityKey: 'grainTrade',
    gracePeriodMonths: 1,
    purposeKey: 'equipment'
  },
  debts: [
    { id:'COOP-DEBT-01', creditorKey:'cooperative', productKey:'workingCapitalLoan', principalOutstanding:450000, monthlyPayment:75000, remainingMonths:6, status:'verified', verification:97, consented:true, active:true, sourceKey:'cooperative', startDate:'2026-03-01' }
  ],
  evidence: [
    { id:'CP-SALES-MAY', typeKey:'salesNotebook', sourceKey:'cooperative', amount:890000, date:'2026-05-31', period:'2026-05', status:'verified', verification:94, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'COOP-SALES-2026-05' },
    { id:'CP-SALES-JUN', typeKey:'salesNotebook', sourceKey:'cooperative', amount:935000, date:'2026-06-30', period:'2026-06', status:'verified', verification:95, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'COOP-SALES-2026-06' },
    { id:'CP-SALES-JUL', typeKey:'salesNotebook', sourceKey:'cooperative', amount:1015000, date:'2026-07-31', period:'2026-07', status:'verified', verification:95, diversityGroup:'sales', usable:true, cashflowMode:'direct', flowType:'inflow', nature:'business', operationKey:'COOP-SALES-2026-07' },
    { id:'CP-SUP-MAY', typeKey:'supplierReceipt', sourceKey:'supplier', amount:610000, date:'2026-05-25', period:'2026-05', status:'verified', verification:94, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-SUP-2026-05' },
    { id:'CP-SUP-JUN', typeKey:'supplierReceipt', sourceKey:'supplier', amount:635000, date:'2026-06-25', period:'2026-06', status:'verified', verification:94, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-SUP-2026-06' },
    { id:'CP-SUP-JUL', typeKey:'supplierReceipt', sourceKey:'supplier', amount:680000, date:'2026-07-26', period:'2026-07', status:'verified', verification:95, diversityGroup:'supplier', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-SUP-2026-07' },
    { id:'CP-TRANS-MAY', typeKey:'transportLog', sourceKey:'cooperative', amount:72000, date:'2026-05-29', period:'2026-05', status:'documented', verification:82, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-TRANSPORT-2026-05' },
    { id:'CP-TRANS-JUN', typeKey:'transportLog', sourceKey:'cooperative', amount:76000, date:'2026-06-29', period:'2026-06', status:'documented', verification:84, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-TRANSPORT-2026-06' },
    { id:'CP-TRANS-JUL', typeKey:'transportLog', sourceKey:'cooperative', amount:81000, date:'2026-07-29', period:'2026-07', status:'documented', verification:85, diversityGroup:'expenses', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'business', operationKey:'COOP-TRANSPORT-2026-07' },
    { id:'CP-COOP-MAY', typeKey:'coopContribution', sourceKey:'cooperative', amount:52000, date:'2026-05-28', period:'2026-05', status:'verified', verification:98, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-CONT-2026-05' },
    { id:'CP-COOP-JUN', typeKey:'coopContribution', sourceKey:'cooperative', amount:52000, date:'2026-06-28', period:'2026-06', status:'verified', verification:98, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-CONT-2026-06' },
    { id:'CP-COOP-JUL', typeKey:'coopContribution', sourceKey:'cooperative', amount:52000, date:'2026-07-28', period:'2026-07', status:'verified', verification:98, diversityGroup:'cooperative', usable:true, cashflowMode:'direct', flowType:'outflow', nature:'financial', operationKey:'COOP-CONT-2026-07' },
    { id:'CP-MM-JUL', typeKey:'mobileMoney', sourceKey:'consentedMobileMoney', amount:610000, date:'2026-07-30', period:'2026-07', status:'verified', verification:92, diversityGroup:'mobile-money', usable:true, cashflowMode:'corroborating', flowType:'inflow', nature:'business', operationKey:'COOP-MM-2026-07', noteKey:'notDoubleCounted' },
    { id:'CP-SAVINGS', typeKey:'savingsStatement', sourceKey:'cooperative', amount:680000, date:'2026-08-01', period:'2026-07', status:'verified', verification:98, diversityGroup:'savings', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'financial', operationKey:'COOP-SAVINGS-2026-08' },
    { id:'CP-EQUIP', typeKey:'stockPhoto', sourceKey:'fieldAgent', amount:2450000, date:'2026-07-27', period:'2026-07', status:'observed', verification:92, diversityGroup:'field', usable:true, cashflowMode:'noncash', flowType:'stock', nature:'business', operationKey:'COOP-EQUIP-2026-07' }
  ],
  cooperativeProfile: {
    memberCount:48,
    activeMemberCount:45,
    stableMembers12m:43,
    exits12m:3,
    womenShare:0.63,
    youthShare:0.42,
    leadershipWomenShare:0.50,
    monthlyContributionDiscipline:0.94,
    meetingAttendance:0.88,
    governanceDocumentsCurrent:true,
    internalLoanRepaymentRate:0.96,
    concentrationRisk:'moderate',
    collectiveSavings:680000,
    governance:{
      bylawsCurrent:true,
      electedCommitteeCurrent:true,
      minutesCoverage:0.92,
      dualAuthorization:true,
      financialReportsCurrent:true,
      grievanceMechanism:true,
      lastGeneralAssembly:'2026-06-18'
    },
    contributionHistory:[
      { period:'2026-02', expected:52000, collected:50000 },
      { period:'2026-03', expected:52000, collected:52000 },
      { period:'2026-04', expected:52000, collected:50000 },
      { period:'2026-05', expected:52000, collected:52000 },
      { period:'2026-06', expected:52000, collected:52000 },
      { period:'2026-07', expected:52000, collected:52000 }
    ],
    internalLoanPortfolio:{
      activeLoans:12,
      outstandingPrincipal:890000,
      arrearsAmount:18000,
      rescheduledLoans:1,
      writtenOffLoans12m:0
    },
    riskConcentration:{
      topBuyerShare:0.36,
      topMemberExposure:0.09,
      activeRevenueStreams:3,
      mainSector:'grain-trade'
    },
    groupFinancing:{
      guaranteeModel:'limited-solidarity',
      governanceApproval:{ approved:true, resolutionId:'AG-BENKADI-2026-07-04', approvedAt:'2026-07-04', minutesEvidenceId:'PV-AG-2026-07-04', purposeKey:'equipment', approvalIsMemberLiability:false },
      memberAgreements:[
      { memberId:'BEN-M-01', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-02', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-03', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-04', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-05', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-06', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-07', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-08', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-09', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-10', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-11', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-12', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-13', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-14', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-15', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-16', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-17', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-18', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-19', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-20', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-21', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-22', affected:true, consentGranted:true, consentAt:'2026-07-20T10:00:00.000Z', maximumLiability:20000, liabilityAccepted:true },
      { memberId:'BEN-M-23', affected:true, consentGranted:false, consentAt:null, maximumLiability:20000, liabilityAccepted:false },
      { memberId:'BEN-M-24', affected:true, consentGranted:false, consentAt:null, maximumLiability:20000, liabilityAccepted:false }
      ],
      fundAllocation:[
        { id:'ALLOC-EQUIP', purposeKey:'equipment-purchase', amount:1250000, beneficiaryType:'approved-supplier' },
        { id:'ALLOC-INSTALL', purposeKey:'transport-installation', amount:150000, beneficiaryType:'service-provider' },
        { id:'ALLOC-RESERVE', purposeKey:'maintenance-reserve', amount:100000, beneficiaryType:'collective-account' }
      ],
      disbursementPlan:[
        { id:'TRANCHE-1', amount:900000, purposeKey:'equipment-deposit', requiredEvidenceIds:['AG-BENKADI-2026-07-04','PROFORMA-EQUIP-001','CONSENT-REGISTER-001'], conditions:['human-committee-approval','supplier-account-only','collective-account-traceability'] },
        { id:'TRANCHE-2', amount:600000, purposeKey:'delivery-installation', requiredEvidenceIds:['INVOICE-EQUIP-001','FIELD-DELIVERY-REPORT-001'], conditions:['verified-use-of-first-tranche','delivery-confirmed','human-committee-approval'] }
      ]
    }
  },
  sampleNarrative: {
    kind:'cooperative',
    challenge:'Évaluer un financement collectif sans confondre capacité du groupe et responsabilité de chaque membre.',
    proof:'Cotisations, ventes collectives, épargne, gouvernance et historique de remboursement.',
    transformation:'Synthèse collective traçable, financement plafonné et décision humaine documentée.'
  }
};

export const EARLY_WARNING_POLICIES = Object.freeze({
  balanced:Object.freeze({
    id:'balanced', version:'EW-BAL-2.2.0', labelKey:'balanced',
    weights:Object.freeze({ payment:0.28, cashflow:0.20, savings:0.12, contributions:0.10, debt:0.12, continuity:0.10, dataQuality:0.08 }),
    thresholds:Object.freeze({
      cashflowDeviation:Object.freeze({ watch:0.10, elevated:0.20, critical:0.35 }),
      cashflowTrendDecline:Object.freeze({ watch:0.12, elevated:0.25, critical:0.40 }),
      daysPastDue:Object.freeze({ watch:1, elevated:8, critical:30 }),
      installmentCoverage:Object.freeze({ watch:0.98, elevated:0.75, critical:0.50 }),
      savingsDrawdown:Object.freeze({ watch:0.15, elevated:0.30, critical:0.50 }),
      missedContributions:Object.freeze({ watch:1, elevated:2, critical:3 }),
      newDebtCount:Object.freeze({ watch:1, elevated:2, critical:3 }),
      confidenceDrop:Object.freeze({ watch:8, elevated:15, critical:25 })
    }),
    riskBands:Object.freeze({ watch:18, elevated:40, critical:65 }),
    responseDays:Object.freeze({ low:30, watch:7, elevated:3, critical:1 }),
    minimumObservations:2,
    automaticSanctionAllowed:false,
    automaticReschedulingAllowed:false
  }),
  prudent:Object.freeze({
    id:'prudent', version:'EW-PRU-2.2.0', labelKey:'prudent',
    weights:Object.freeze({ payment:0.30, cashflow:0.22, savings:0.12, contributions:0.08, debt:0.12, continuity:0.10, dataQuality:0.06 }),
    thresholds:Object.freeze({
      cashflowDeviation:Object.freeze({ watch:0.08, elevated:0.16, critical:0.30 }),
      cashflowTrendDecline:Object.freeze({ watch:0.10, elevated:0.20, critical:0.35 }),
      daysPastDue:Object.freeze({ watch:1, elevated:5, critical:20 }),
      installmentCoverage:Object.freeze({ watch:0.99, elevated:0.82, critical:0.60 }),
      savingsDrawdown:Object.freeze({ watch:0.12, elevated:0.25, critical:0.40 }),
      missedContributions:Object.freeze({ watch:1, elevated:2, critical:3 }),
      newDebtCount:Object.freeze({ watch:1, elevated:2, critical:3 }),
      confidenceDrop:Object.freeze({ watch:6, elevated:12, critical:20 })
    }),
    riskBands:Object.freeze({ watch:15, elevated:35, critical:60 }),
    responseDays:Object.freeze({ low:21, watch:5, elevated:2, critical:1 }),
    minimumObservations:2,
    automaticSanctionAllowed:false,
    automaticReschedulingAllowed:false
  }),
  inclusivePilot:Object.freeze({
    id:'inclusivePilot', version:'EW-INC-2.2.0', labelKey:'inclusivePilot',
    weights:Object.freeze({ payment:0.24, cashflow:0.20, savings:0.14, contributions:0.12, debt:0.10, continuity:0.10, dataQuality:0.10 }),
    thresholds:Object.freeze({
      cashflowDeviation:Object.freeze({ watch:0.12, elevated:0.24, critical:0.40 }),
      cashflowTrendDecline:Object.freeze({ watch:0.15, elevated:0.28, critical:0.45 }),
      daysPastDue:Object.freeze({ watch:2, elevated:10, critical:35 }),
      installmentCoverage:Object.freeze({ watch:0.95, elevated:0.70, critical:0.45 }),
      savingsDrawdown:Object.freeze({ watch:0.18, elevated:0.35, critical:0.55 }),
      missedContributions:Object.freeze({ watch:1, elevated:2, critical:4 }),
      newDebtCount:Object.freeze({ watch:1, elevated:2, critical:3 }),
      confidenceDrop:Object.freeze({ watch:10, elevated:18, critical:28 })
    }),
    riskBands:Object.freeze({ watch:20, elevated:45, critical:70 }),
    responseDays:Object.freeze({ low:30, watch:10, elevated:5, critical:2 }),
    minimumObservations:2,
    automaticSanctionAllowed:false,
    automaticReschedulingAllowed:false
  })
});

export function getEarlyWarningPolicy(id='balanced') {
  const policy=EARLY_WARNING_POLICIES[id];
  if(!policy) throw new RangeError(`unknown early-warning policy: ${id}`);
  return policy;
}

export function validateEarlyWarningPolicy(policy) {
  if(!policy?.id || !policy?.version || !policy?.weights || !policy?.thresholds) return false;
  const weightTotal=Object.values(policy.weights).reduce((sum,value)=>sum+Number(value||0),0);
  if(Math.abs(weightTotal-1)>0.000001) return false;
  if(policy.automaticSanctionAllowed!==false || policy.automaticReschedulingAllowed!==false) return false;
  const increasing=['cashflowDeviation','cashflowTrendDecline','daysPastDue','savingsDrawdown','missedContributions','newDebtCount','confidenceDrop'];
  for(const key of increasing){ const x=policy.thresholds[key]; if(!x || !(x.watch<=x.elevated && x.elevated<=x.critical)) return false; }
  const coverage=policy.thresholds.installmentCoverage;
  if(!coverage || !(coverage.watch>=coverage.elevated && coverage.elevated>=coverage.critical)) return false;
  return policy.riskBands.watch<policy.riskBands.elevated && policy.riskBands.elevated<policy.riskBands.critical;
}

export const PORTFOLIO_RISK_POLICIES = Object.freeze({
  balanced:Object.freeze({
    id:'balanced', version:'PR-BAL-2.4.0',
    weights:Object.freeze({ delinquency:0.30, paymentCoverage:0.20, earlyWarning:0.18, overIndebtedness:0.14, dataConfidence:0.08, seasonalClimate:0.10 }),
    bands:Object.freeze({ watch:22, high:45, critical:68 }),
    concentration:Object.freeze({ sectorWatch:0.30, sectorHigh:0.42, branchWatch:0.38, branchHigh:0.52, groupWatch:0.18, groupHigh:0.28 }),
    parThresholds:Object.freeze({ par1Watch:0.15, par7Watch:0.10, par30Watch:0.06 }),
    minimumDataConfidence:60,
    automaticAccountRestrictionAllowed:false,
    automaticCollectionAllowed:false
  }),
  prudent:Object.freeze({
    id:'prudent', version:'PR-PRU-2.4.0',
    weights:Object.freeze({ delinquency:0.33, paymentCoverage:0.20, earlyWarning:0.18, overIndebtedness:0.14, dataConfidence:0.07, seasonalClimate:0.08 }),
    bands:Object.freeze({ watch:18, high:38, critical:62 }),
    concentration:Object.freeze({ sectorWatch:0.26, sectorHigh:0.36, branchWatch:0.34, branchHigh:0.46, groupWatch:0.15, groupHigh:0.24 }),
    parThresholds:Object.freeze({ par1Watch:0.12, par7Watch:0.08, par30Watch:0.04 }),
    minimumDataConfidence:65,
    automaticAccountRestrictionAllowed:false,
    automaticCollectionAllowed:false
  }),
  inclusivePilot:Object.freeze({
    id:'inclusivePilot', version:'PR-INC-2.4.0',
    weights:Object.freeze({ delinquency:0.27, paymentCoverage:0.18, earlyWarning:0.18, overIndebtedness:0.13, dataConfidence:0.12, seasonalClimate:0.12 }),
    bands:Object.freeze({ watch:25, high:50, critical:72 }),
    concentration:Object.freeze({ sectorWatch:0.34, sectorHigh:0.46, branchWatch:0.42, branchHigh:0.56, groupWatch:0.20, groupHigh:0.30 }),
    parThresholds:Object.freeze({ par1Watch:0.18, par7Watch:0.12, par30Watch:0.07 }),
    minimumDataConfidence:55,
    automaticAccountRestrictionAllowed:false,
    automaticCollectionAllowed:false
  })
});

export function getPortfolioRiskPolicy(id='balanced') {
  const policy=PORTFOLIO_RISK_POLICIES[id];
  if(!policy) throw new RangeError(`unknown portfolio-risk policy: ${id}`);
  return policy;
}

export function validatePortfolioRiskPolicy(policy) {
  if(!policy?.id || !policy?.version || !policy?.weights || !policy?.bands || !policy?.concentration) return false;
  const total=Object.values(policy.weights).reduce((sum,value)=>sum+Number(value||0),0);
  if(Math.abs(total-1)>0.000001) return false;
  if(!(policy.bands.watch<policy.bands.high && policy.bands.high<policy.bands.critical)) return false;
  if(policy.automaticAccountRestrictionAllowed!==false || policy.automaticCollectionAllowed!==false) return false;
  return true;
}

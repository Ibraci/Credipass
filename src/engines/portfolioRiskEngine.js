import { getPortfolioRiskPolicy, validatePortfolioRiskPolicy } from '../config/portfolioRiskPolicies.js';
import { PORTFOLIO_STRESS_SCENARIOS } from '../fixtures/portfolio-sample.js';

export const PORTFOLIO_RISK_ENGINE_VERSION='2.4.0';
const clone=value=>JSON.parse(JSON.stringify(value));
const round=(value,precision=0)=>{ const f=10**precision; return Math.round(Number(value||0)*f)/f; };
const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,Number(value||0)));
const sum=values=>values.reduce((total,value)=>total+Number(value||0),0);
const ratio=(num,den)=>den>0?Number(num||0)/den:0;

function delinquencyScore(days){
  if(days>=90) return 100;
  if(days>=30) return 82;
  if(days>=7) return 55;
  if(days>=1) return 28;
  return 0;
}
function paymentCoverageScore(account){
  const due=Number(account.installmentDue||0);
  if(due<=0) return 0;
  const coverage=clamp((Number(account.installmentPaid||0)/due)*100,0,100);
  return 100-coverage;
}
function warningScore(band){ return ({low:0,watch:35,elevated:68,critical:100})[band] ?? 25; }
function riskBand(score,bands){ return score>=bands.critical?'critical':score>=bands.high?'high':score>=bands.watch?'watch':'low'; }
function concentrationBand(share,watch,high){ return share>=high?'high':share>=watch?'watch':'normal'; }
function groupedExposure(accounts,key){
  const total=sum(accounts.map(x=>x.outstandingPrincipal));
  const map=new Map();
  for(const item of accounts){ const value=item[key]||'non-renseigne'; const row=map.get(value)||{key:value,count:0,exposure:0,riskWeightedExposure:0}; row.count+=1; row.exposure+=Number(item.outstandingPrincipal||0); row.riskWeightedExposure+=Number(item.outstandingPrincipal||0)*(Number(item.riskScore||0)/100); map.set(value,row); }
  return [...map.values()].map(x=>({...x,share:round(ratio(x.exposure,total)*100,1),averageRisk:round(ratio(x.riskWeightedExposure,x.exposure)*100,1)})).sort((a,b)=>b.exposure-a.exposure);
}
function hhi(rows){ return round(sum(rows.map(x=>(x.share/100)**2))*10000); }
function stressIncrement(account,scenario){
  const sector=Number(scenario.sectorShocks?.[account.sector]||0);
  const climate=Number(account.climateExposure||0)*Number(scenario.climateMultiplier||0);
  const seasonal=Number(account.seasonalExposure||0)*Number(scenario.seasonalMultiplier||0);
  return round(sector+climate+seasonal,1);
}

export function scorePortfolioAccount(account, options={}) {
  const policy=getPortfolioRiskPolicy(options.policyId||'balanced');
  if(!validatePortfolioRiskPolicy(policy)) throw new TypeError('invalid portfolio risk policy');
  const scenario=PORTFOLIO_STRESS_SCENARIOS[options.stressScenarioId||'baseline'];
  if(!scenario) throw new RangeError(`unknown portfolio stress scenario: ${options.stressScenarioId}`);
  const components={
    delinquency:delinquencyScore(Number(account.daysPastDue||0)),
    paymentCoverage:paymentCoverageScore(account),
    earlyWarning:warningScore(account.earlyWarningBand),
    overIndebtedness:clamp(account.overIndebtednessRisk),
    dataConfidence:100-clamp(account.dataConfidence),
    seasonalClimate:clamp((Number(account.seasonalExposure||0)*45)+(Number(account.climateExposure||0)*55))
  };
  const baseRiskScore=round(sum(Object.entries(policy.weights).map(([key,weight])=>components[key]*weight)),1);
  const shockIncrement=stressIncrement(account,scenario);
  const stressedRiskScore=round(clamp(baseRiskScore+shockIncrement),1);
  const baseBand=riskBand(baseRiskScore,policy.bands);
  const stressedBand=riskBand(stressedRiskScore,policy.bands);
  return {
    ...clone(account), components, baseRiskScore, riskScore:stressedRiskScore, baseBand, riskBand:stressedBand,
    shockIncrement, stressScenarioId:scenario.id,
    paymentCoverage:account.installmentDue>0?round(ratio(account.installmentPaid,account.installmentDue)*100,1):100,
    requiresHumanReview:['watch','high','critical'].includes(stressedBand),
    automaticRestrictionAllowed:false,
    automaticCollectionAllowed:false
  };
}

export function analyzePortfolio(accounts, options={}) {
  const policy=getPortfolioRiskPolicy(options.policyId||'balanced');
  if(!validatePortfolioRiskPolicy(policy)) throw new TypeError('invalid portfolio risk policy');
  const scenario=PORTFOLIO_STRESS_SCENARIOS[options.stressScenarioId||'baseline'];
  if(!scenario) throw new RangeError(`unknown portfolio stress scenario: ${options.stressScenarioId}`);
  const scored=(accounts||[]).map(item=>scorePortfolioAccount(item,{policyId:policy.id,stressScenarioId:scenario.id}));
  if(!scored.length) throw new TypeError('portfolio requires at least one account');
  const totalExposure=sum(scored.map(x=>x.outstandingPrincipal));
  const totalInstallmentDue=sum(scored.map(x=>x.installmentDue));
  const totalInstallmentPaid=sum(scored.map(x=>x.installmentPaid));
  const exposureAtBand=band=>sum(scored.filter(x=>x.riskBand===band).map(x=>x.outstandingPrincipal));
  const baseAtRisk=sum(scored.filter(x=>['watch','high','critical'].includes(x.baseBand)).map(x=>x.outstandingPrincipal));
  const stressedAtRisk=sum(scored.filter(x=>['watch','high','critical'].includes(x.riskBand)).map(x=>x.outstandingPrincipal));
  const par=(days)=>sum(scored.filter(x=>Number(x.daysPastDue||0)>=days).map(x=>x.outstandingPrincipal));
  const sectors=groupedExposure(scored,'sector');
  const branches=groupedExposure(scored,'branch');
  const regions=groupedExposure(scored,'region');
  const groups=groupedExposure(scored.filter(x=>x.groupId),'groupId');
  const products=groupedExposure(scored,'product');
  const topSector=sectors[0]; const topBranch=branches[0]; const topGroup=groups[0]||{share:0,key:'none'};
  const concentrationAlerts=[];
  const sectorBand=concentrationBand(topSector.share/100,policy.concentration.sectorWatch,policy.concentration.sectorHigh);
  const branchBand=concentrationBand(topBranch.share/100,policy.concentration.branchWatch,policy.concentration.branchHigh);
  const groupBand=concentrationBand(topGroup.share/100,policy.concentration.groupWatch,policy.concentration.groupHigh);
  if(sectorBand!=='normal') concentrationAlerts.push({type:'sector',band:sectorBand,key:topSector.key,share:topSector.share});
  if(branchBand!=='normal') concentrationAlerts.push({type:'branch',band:branchBand,key:topBranch.key,share:topBranch.share});
  if(groupBand!=='normal') concentrationAlerts.push({type:'group',band:groupBand,key:topGroup.key,share:topGroup.share});
  const par1=round(ratio(par(1),totalExposure)*100,1), par7=round(ratio(par(7),totalExposure)*100,1), par30=round(ratio(par(30),totalExposure)*100,1);
  const watchlist=scored.filter(x=>x.requiresHumanReview).sort((a,b)=>b.riskScore-a.riskScore || b.outstandingPrincipal-a.outstandingPrincipal);
  const seasonalExposure=sum(scored.map(x=>x.outstandingPrincipal*Number(x.seasonalExposure||0)));
  const climateExposure=sum(scored.map(x=>x.outstandingPrincipal*Number(x.climateExposure||0)));
  const riskWeightedExposure=sum(scored.map(x=>x.outstandingPrincipal*(x.riskScore/100)));
  const portfolioRiskScore=round(ratio(riskWeightedExposure,totalExposure)*100,1);
  const portfolioBand=riskBand(portfolioRiskScore,policy.bands);
  const alerts=[...concentrationAlerts];
  if(par1/100>=policy.parThresholds.par1Watch) alerts.push({type:'par1',band:'watch',share:par1});
  if(par7/100>=policy.parThresholds.par7Watch) alerts.push({type:'par7',band:'high',share:par7});
  if(par30/100>=policy.parThresholds.par30Watch) alerts.push({type:'par30',band:'critical',share:par30});
  if(ratio(stressedAtRisk,totalExposure)>=0.35) alerts.push({type:'at-risk-exposure',band:'high',share:round(ratio(stressedAtRisk,totalExposure)*100,1)});
  return {
    engineVersion:PORTFOLIO_RISK_ENGINE_VERSION,
    status:'evaluated', asOfDate:options.asOfDate||'2026-08-06', policy:clone(policy), stressScenario:clone(scenario),
    summary:{
      accountCount:scored.length,totalExposure,totalInstallmentDue,totalInstallmentPaid,
      installmentCoverage:round(ratio(totalInstallmentPaid,totalInstallmentDue)*100,1),
      portfolioRiskScore,portfolioBand,
      lowExposure:exposureAtBand('low'),watchExposure:exposureAtBand('watch'),highExposure:exposureAtBand('high'),criticalExposure:exposureAtBand('critical'),
      atRiskExposure:stressedAtRisk,atRiskShare:round(ratio(stressedAtRisk,totalExposure)*100,1),
      baseAtRiskExposure:baseAtRisk,incrementalAtRiskExposure:Math.max(0,stressedAtRisk-baseAtRisk),
      par1Exposure:par(1),par7Exposure:par(7),par30Exposure:par(30),par1,par7,par30,
      seasonalExposure:round(seasonalExposure),seasonalExposureShare:round(ratio(seasonalExposure,totalExposure)*100,1),
      climateExposure:round(climateExposure),climateExposureShare:round(ratio(climateExposure,totalExposure)*100,1),
      averageIncluscore:round(sum(scored.map(x=>x.incluscore))/scored.length,1),
      averageDataConfidence:round(sum(scored.map(x=>x.dataConfidence))/scored.length,1),
      watchlistCount:watchlist.length
    },
    concentrations:{ sectors,branches,regions,groups,products,sectorHhi:hhi(sectors),branchHhi:hhi(branches),groupHhi:hhi(groups),alerts:concentrationAlerts },
    watchlist, accounts:scored, alerts,
    stressImpact:{ scenarioId:scenario.id, affectedAccounts:scored.filter(x=>x.shockIncrement>0).length, migratedAccounts:scored.filter(x=>x.baseBand!==x.riskBand).length, baseAtRiskExposure:baseAtRisk, stressedAtRiskExposure:stressedAtRisk, incrementalAtRiskExposure:Math.max(0,stressedAtRisk-baseAtRisk), incrementalAtRiskShare:round(ratio(Math.max(0,stressedAtRisk-baseAtRisk),totalExposure)*100,1) },
    recommendedActions:[
      ...(alerts.some(x=>x.type==='par30')?['review-par30-cases-immediately']:[]),
      ...(concentrationAlerts.length?['review-concentration-limits']:[]),
      ...(scenario.id!=='baseline'?['run-human-stress-review-before-portfolio-action']:[]),
      ...(watchlist.length?['assign-watchlist-cases-to-supervisors']:[]),
      'preserve-individual-human-review','validate-synthetic-assumptions-on-real-pilot-data'
    ],
    safeguards:{
      aggregateIndicatorIsNotIndividualDecision:true,automaticAccountRestrictionAllowed:false,automaticCollectionAllowed:false,
      groupRiskCannotBeTransferredAutomaticallyToMember:true,stressScenarioIsNotForecast:true,humanValidationRequired:true,
      sensitiveAttributesExcludedFromRiskCalculation:true
    },
    excludedData:['ethnicity','religion','political-opinion','private-messages','phone-contacts','social-media-behaviour'],
    limitations:['synthetic-demonstration-portfolio','not-a-statistical-default-model','stress-parameters-require-institutional-validation','portfolio-alerts-require-case-level-review'],
    trace:{ deterministic:true,calculatedAt:options.calculatedAt||'2026-08-06T20:30:00.000Z',accountIds:scored.map(x=>x.id),policyVersion:policy.version,stressScenarioId:scenario.id }
  };
}

export function validatePortfolioRiskResult(result) {
  if(!result?.engineVersion || !result?.policy?.version || !result?.summary) return false;
  if(result.summary.totalExposure<=0 || result.summary.accountCount<=0) return false;
  if(result.summary.portfolioRiskScore<0 || result.summary.portfolioRiskScore>100) return false;
  if(result.safeguards?.automaticAccountRestrictionAllowed!==false || result.safeguards?.humanValidationRequired!==true) return false;
  if(result.summary.par30>result.summary.par7 || result.summary.par7>result.summary.par1) return false;
  return Array.isArray(result.accounts) && result.accounts.every(x=>x.automaticRestrictionAllowed===false);
}

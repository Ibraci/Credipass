import { SECURITY_GOVERNANCE_POLICY, SECURITY_CONTROLS } from '../config/securityGovernancePolicies.js';
const ENGINE_VERSION='4.0.0';
const statusFactor={ 'implemented-synthetic':1, prepared:.55, required:0, 'not-applicable':1 };
export function assessSecurityReadiness({controls=SECURITY_CONTROLS,policy=SECURITY_GOVERNANCE_POLICY}={}){
  const total=controls.reduce((s,c)=>s+c.weight,0),earned=controls.reduce((s,c)=>s+c.weight*(statusFactor[c.status]??0),0);const score=Math.round((earned/total)*100);
  const criticalOpen=controls.filter(c=>c.critical&&c.status==='required');const criticalPrepared=controls.filter(c=>c.critical&&c.status==='prepared');
  const pilotAllowed=score>=policy.minimumPilotScore&&criticalOpen.length===0;
  const productionAllowed=score>=policy.minimumProductionScore&&controls.every(c=>!c.critical||c.status==='implemented-synthetic')&&criticalOpen.length===0&&criticalPrepared.length===0;
  const categories=[...new Set(controls.map(c=>c.category))].map(category=>{const cs=controls.filter(c=>c.category===category),tw=cs.reduce((s,c)=>s+c.weight,0),ew=cs.reduce((s,c)=>s+c.weight*(statusFactor[c.status]??0),0);return{category,score:Math.round(ew/tw*100),controls:cs};});
  return {engineVersion:ENGINE_VERSION,policy:{id:policy.id,version:policy.version},score,status:productionAllowed?'production-gate-met':pilotAllowed?'pilot-gate-met':score>=60?'demo-hardened-pilot-blocked':'demo-only',pilotAllowed,productionAllowed,criticalOpen,criticalPrepared,categories,controls,safeguards:{productionCertificationClaimed:false,externalPenTestClaimed:false,encryptedBrowserStorageClaimed:false,realBackupRestoreClaimed:false}};
}
export function buildSecurityDueDiligenceExport(result){return{schema:'CREDIPASS-SECURITY-DUE-DILIGENCE-1',generatedAt:new Date().toISOString(),engineVersion:result.engineVersion,policy:result.policy,score:result.score,status:result.status,pilotAllowed:result.pilotAllowed,productionAllowed:result.productionAllowed,criticalOpen:result.criticalOpen.map(x=>({id:x.id,category:x.category,evidence:x.evidence})),criticalPrepared:result.criticalPrepared.map(x=>({id:x.id,category:x.category,evidence:x.evidence})),controls:result.controls.map(x=>({id:x.id,category:x.category,critical:x.critical,status:x.status,evidence:x.evidence})),claims:result.safeguards};}
export function validateSecurityReadiness(r){return Boolean(r?.score>=0&&r?.score<=100&&r?.productionAllowed===false&&r?.safeguards?.productionCertificationClaimed===false&&Array.isArray(r.controls));}

const num=v=>Number(v)||0;
const clone=v=>JSON.parse(JSON.stringify(v));
export const DEFAULT_SFD_FIELD_PROFILE={
  id:'SFD-REFERENCE-KAFO-2026',
  name:'Référence terrain SFD — formulaires Kafo 2026',
  status:'ACTIF',
  source:'Formulaires terrain fournis pendant la contextualisation Track B. Paramètres institutionnels configurables; ils ne constituent pas des règles universelles.',
  salary:{
    domiciledMaxMonths:36,
    nonDomiciledMaxMonths:12,
    requireQuotaAboveInstallment:true,
    requireDgaField:true,
    purposes:['Construction','Scolarité','Besoin social','Autres']
  },
  pme:{
    minimumGuaranteeCoverageRatio:1,
    requireMarketAnalysis:true,
    requirePersonalBudget:true,
    requirePersonalBalance:true,
    riskDimensions:[
      'Volonté de payer de l’emprunteur','Stabilité et sécurité du revenu','Stabilité de l’adresse',
      'Pouvoir actuel de remboursement','Niveau et qualité des garanties','Coefficient de la capacité de remboursement',
      'Antécédents de crédit','Équilibre budget familial','Réputation dans le milieu'
    ]
  }
};
export function ensureSfdFieldConfig(db){
  db.sfdFieldProfiles??=[clone(DEFAULT_SFD_FIELD_PROFILE)];
  db.activeSfdFieldProfileId??=db.sfdFieldProfiles[0]?.id||DEFAULT_SFD_FIELD_PROFILE.id;
  if(!db.sfdFieldProfiles.some(x=>x.id===db.activeSfdFieldProfileId))db.activeSfdFieldProfileId=db.sfdFieldProfiles[0]?.id;
  return db;
}
export function activeSfdFieldProfile(db){ensureSfdFieldConfig(db);return db.sfdFieldProfiles.find(x=>x.id===db.activeSfdFieldProfileId)||db.sfdFieldProfiles[0]}
export function saveSfdFieldProfile(db,input){
  ensureSfdFieldConfig(db);const id=String(input.id||db.activeSfdFieldProfileId||'SFD-PROFILE').trim();let p=db.sfdFieldProfiles.find(x=>x.id===id);
  const data={...clone(DEFAULT_SFD_FIELD_PROFILE),...p,...input,id,updatedAt:new Date().toISOString()};
  data.salary={...DEFAULT_SFD_FIELD_PROFILE.salary,...p?.salary,...input.salary};data.pme={...DEFAULT_SFD_FIELD_PROFILE.pme,...p?.pme,...input.pme};
  if(p)Object.assign(p,data);else db.sfdFieldProfiles.push(p=data);db.activeSfdFieldProfileId=id;return p;
}
function docsMissing(db,id){return (db.checklists||[]).filter(x=>x.applicationId===id&&x.required&&x.status!=='Vérifié').map(x=>x.label)}
function guaranteeCoverage(db,id,amount){const gs=(db.guarantees||[]).filter(x=>x.applicationId===id);const retained=gs.reduce((s,g)=>s+num(g.retainedValue??g.expertValue??g.declaredValue),0);return {count:gs.length,retained,ratio:amount>0?retained/amount:0}}
export function fieldDataGaps(db,id){ensureSfdFieldConfig(db);const a=(db.applications||[]).find(x=>x.id===id);if(!a)return ['Dossier introuvable'];const f=(db.productForms||[]).find(x=>x.applicationId===id)?.data||{},gaps=[];
  if(a.product==='Crédit salarié'){
    for(const [k,l] of [['employer','Employeur'],['netSalary','Salaire net'],['assignableQuota','Quotité cessible'],['monthlyRepayment','Remboursement mensuel'],['hireDate','Date d’embauche'],['contractDurationMonths','Durée du contrat']])if(!String(f[k]??'').trim())gaps.push(l);
    if(!('dga' in f))gaps.push('Épargne obligatoire (DGA)');
  }
  if(a.product==='Crédit PME'){
    const b=(db.businessAnalyses||[]).find(x=>x.applicationId===id),pb=(db.personalBudgets||[]).find(x=>x.applicationId===id),bal=(db.personalBalanceSheets||[]).find(x=>x.applicationId===id);
    if(!b)gaps.push('Analyse activité & marché');if(!pb)gaps.push('Budget personnel');if(!bal)gaps.push('Bilan personnel');
    const dims=new Set((db.institutionalRisk||[]).filter(x=>x.applicationId===id).map(x=>x.dimension));for(const dim of activeSfdFieldProfile(db).pme.riskDimensions)if(!dims.has(dim))gaps.push(`Risque : ${dim}`);
  }
  for(const d of docsMissing(db,id))gaps.push(`Pièce : ${d}`);return gaps;
}
export function evaluateFieldPolicies(db,id){ensureSfdFieldConfig(db);const a=(db.applications||[]).find(x=>x.id===id);if(!a)return {ok:false,checks:[],blocking:['Dossier introuvable']};const p=activeSfdFieldProfile(db),checks=[];
  if(a.product==='Crédit salarié'){
    const f=(db.productForms||[]).find(x=>x.applicationId===id)?.data||{},domiciled=!!String(f.salaryDomiciliationDate||'').trim(),maxMonths=domiciled?p.salary.domiciledMaxMonths:p.salary.nonDomiciledMaxMonths,quota=num(f.assignableQuota),monthly=num(f.monthlyRepayment);
    checks.push({code:'SAL_QUOTITE',label:'Quotité cessible supérieure au remboursement mensuel',status:!p.salary.requireQuotaAboveInstallment||quota>monthly?'CONFORME':'BLOQUANT',detail:`Quotité ${quota} / mensualité ${monthly}`});
    checks.push({code:'SAL_DUREE_DOMICILIATION',label:'Durée compatible avec la domiciliation',status:num(a.durationMonths)<=maxMonths?'CONFORME':'BLOQUANT',detail:`${domiciled?'Domicilié':'Non domicilié'} · maximum paramétré ${maxMonths} mois`});
    checks.push({code:'SAL_DGA',label:'DGA renseignée',status:!p.salary.requireDgaField||('dga' in f)?'CONFORME':'À_COMPLÉTER',detail:'Paramètre institutionnel configurable'});
  }
  if(a.product==='Crédit PME'){
    const amount=num((db.decisions||[]).filter(x=>x.applicationId===id&&x.decision==='VALIDÉ').at(-1)?.approvedAmount)||num(a.requestedAmount),cov=guaranteeCoverage(db,id,amount),min=num(p.pme.minimumGuaranteeCoverageRatio);
    checks.push({code:'PME_GARANTIE',label:'Couverture minimale des garanties',status:cov.ratio>=min?'CONFORME':'BLOQUANT',detail:`Couverture ${(cov.ratio*100).toFixed(0)} % / minimum paramétré ${(min*100).toFixed(0)} %`});
    const b=(db.businessAnalyses||[]).find(x=>x.applicationId===id);checks.push({code:'PME_ACTIVITE',label:'Analyse activité & marché',status:b?'CONFORME':'À_COMPLÉTER',detail:b?`Résultat d’exploitation ${num(b.result)} FCFA`:'Analyse absente'});
    checks.push({code:'PME_BUDGET',label:'Budget personnel',status:(db.personalBudgets||[]).some(x=>x.applicationId===id)?'CONFORME':'À_COMPLÉTER'});
    checks.push({code:'PME_BILAN',label:'Bilan personnel',status:(db.personalBalanceSheets||[]).some(x=>x.applicationId===id)?'CONFORME':'À_COMPLÉTER'});
  }
  const missing=docsMissing(db,id);checks.push({code:'PIECES',label:'Pièces requises',status:missing.length?'À_COMPLÉTER':'CONFORME',detail:missing.length?missing.join(', '):'Toutes les pièces requises sont vérifiées'});
  const blocking=checks.filter(x=>x.status==='BLOQUANT');return {ok:blocking.length===0,checks,blocking,profile:{id:p.id,name:p.name,source:p.source}};
}
export function fieldContradictions(db,id){const a=(db.applications||[]).find(x=>x.id===id),out=[];if(!a)return out;const f=(db.productForms||[]).find(x=>x.applicationId===id)?.data||{};
  if(a.product==='Crédit salarié'){
    if(num(f.assignableQuota)&&num(f.monthlyRepayment)&&num(f.assignableQuota)<=num(f.monthlyRepayment))out.push('La quotité cessible n’est pas supérieure au remboursement mensuel.');
    if(f.netSalary&&f.assignableQuota&&num(f.assignableQuota)>num(f.netSalary))out.push('La quotité cessible dépasse le salaire net renseigné.');
  }
  if(a.product==='Crédit PME'){
    const b=(db.businessAnalyses||[]).find(x=>x.applicationId===id);if(b&&num(b.sales)>0&&num(b.result)<0)out.push('L’analyse d’activité présente un résultat d’exploitation négatif.');
    const pb=(db.personalBudgets||[]).find(x=>x.applicationId===id);if(pb&&num(pb.net)<0)out.push('Le budget personnel présente un solde mensuel négatif.');
    const bal=(db.personalBalanceSheets||[]).find(x=>x.applicationId===id);if(bal&&num(bal.netWorth)<0)out.push('Le bilan personnel présente une situation nette négative.');
  }
  return out;
}
export function fieldSummary(db,id){const a=(db.applications||[]).find(x=>x.id===id);return {application:a||null,profile:activeSfdFieldProfile(db),gaps:fieldDataGaps(db,id),policy:evaluateFieldPolicies(db,id),contradictions:fieldContradictions(db,id),guarantee:guaranteeCoverage(db,id,num(a?.requestedAmount))};}

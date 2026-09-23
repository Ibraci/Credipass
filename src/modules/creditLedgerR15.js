import {ensureCatalog,productByName,validateProductRequest,freezePolicySnapshot} from './productCatalogR186.js';
import * as R14 from './creditLedgerR14.js';
import {readState,writeState} from './dataRepository.js';
import {ensureR187,recordBic,bicFor,disputeData,resolveDispute,auditFor,registerImport,passportSummary} from './dataGovernanceR187.js';
import {ensureSfdFieldConfig,fieldSummary} from './sfdFieldR193.js';
import {sfdScore} from './sfdScoreInput.js';
// Circuit unique, repris des formulaires : avis de l'agent → avis de l'analyste → décision du comité.
export const WORKFLOW_STEPS=['AGENT_CREDIT','ANALYSTE_RESPONSABLE_CREDIT','COMITE_CREDIT'];
// Noms d'étapes des versions précédentes, conservés pour lire les validations déjà enregistrées.
const STEP_ALIASES={SUPERVISEUR:'ANALYSTE_RESPONSABLE_CREDIT',CHEF_AGENCE_ANALYSTE:'ANALYSTE_RESPONSABLE_CREDIT'};
const stepOf=step=>STEP_ALIASES[step]||step;
export const RISK_OPINIONS=['Risque acceptable','Risque élevé'];
export const STEP_LABELS={AGENT_CREDIT:'Avis de l’agent de crédit',ANALYSTE_RESPONSABLE_CREDIT:'Avis de l’analyste',COMITE_CREDIT:'Décision du comité',TERMINÉ:'Terminé'};
export * from './creditLedgerR14.js';
const iso=()=>new Date().toISOString(), num=v=>Number(v)||0, next=(p,a)=>`${p}-${String(a.length+1).padStart(4,'0')}`;
export const PRODUCT_DEFINITIONS={
 'Crédit salarié':{code:'SALARIE',workflow:WORKFLOW_STEPS,sections:['IDENTIFICATION','EMPLOI_DOMICILIATION','ANTECEDENTS','PRET','OBJET','CAPACITE','DOCUMENTS','POLITIQUE','RECOMMANDATION_AGENT','AVIS_ANALYSTE','COMITE'],requiredDocs:['Pièce d’identité','Demande signée','Justificatif de salaire','Justificatif employeur / contrat'],policy:['QUOTITE_CESSIBLE','DUREE_PRODUIT','DOCUMENTS_REQUIS']},
 'Crédit PME':{code:'PME',workflow:WORKFLOW_STEPS,sections:['IDENTIFICATION','ENTREPRISE','PRET','EPARGNE_CREDIT','ACTIVITE_MARCHE','GARANTIES','BUDGET_PERSONNEL','BILAN_PERSONNEL','DOCUMENTS','POLITIQUE','RISQUE_INSTITUTIONNEL','INCLUSCORE','RECOMMANDATION_AGENT','AVIS_ANALYSTE','COMITE'],requiredDocs:['Pièce d’identité','Demande signée','Justificatif activité / entreprise','Documents légaux applicables','Justificatifs de revenus / activité','Justificatifs de garanties'],policy:['PLAFONDS','ENCOURS_AUTORISE','FRAIS_ASSURANCE','DOCUMENTS_LEGAUX_GARANTIES','VISAS']}
};
const ARR=['productForms','policyChecks','institutionalRisk','businessAnalyses','personalBudgets','personalBalanceSheets','workflowActions','consents'];
function init(x){ARR.forEach(k=>x[k]??=[]);ensureCatalog(x);ensureR187(x);ensureSfdFieldConfig(x);ensureMvpDemoCase(x);x.version=17;return x}
export function seed(){const x=init(R14.seed()); x.applications.forEach((a,i)=>{a.product=i===0?'Crédit salarié':'Crédit PME';configureApplication(x,a.id,a.product,'Migration R17')});seedR17Cases(x);ensureMvpDemoCase(x);return x}
export function load(){try{const raw=localStorage.getItem('credipass.credit-ledger.r17')||localStorage.getItem('credipass.credit-ledger.r15');if(!raw)return seed();const parsed=init(JSON.parse(raw));/* Migration de démonstration R18 : les anciennes bases partielles (ex. 4 membres) sont remplacées par le jeu cohérent 20+ cas. */return parsed.members?.length>=20&&parsed.applications?.length>=20?parsed:seed()}catch{return seed()}}
export function save(x){const v=init(x);localStorage.setItem('credipass.credit-ledger.r17',JSON.stringify(v));writeState(v).catch(()=>{});return v}
export async function hydrate(){try{const stored=await readState();if(stored)return init(stored);const current=load();await writeState(current);return current}catch{return load()}}
export async function persistIndexedDb(x){await writeState(init(x));return x}
function seedR17Cases(x){
 const profiles=[
 ['M-1005','Moussa Coulibaly','Personne physique','Bamako','Enseignant','Crédit salarié','Scolarité',650000,12,'Mensuelle','DOSSIER_COMPLET'],
 ['M-1006','Aminata Koné','Personne physique','Bamako','Infirmière','Crédit salarié','Construction',1200000,24,'Mensuelle','QUOTITE_LIMITE'],
 ['M-1007','Ibrahim Diarra','Personne physique','Kayes','Agent commercial','Crédit salarié','Besoin social',800000,12,'Mensuelle','NON_DOMICILIE'],
 ['M-1008','Mariam Sangaré','Entrepreneur individuel','Ségou','Commerce textile','Crédit PME','Fonds de roulement',1800000,18,'Mensuelle','CONFIANCE_FAIBLE'],
 ['M-1009','Bakary Keïta','Entrepreneur individuel','Mopti','Élevage','Crédit PME','Investissement',2500000,24,'Saisonnière','SAISONNIER'],
 ['M-1010','Nafissatou Maïga','Entrepreneur individuel','Bamako','Restauration','Crédit PME','Équipement',1400000,18,'Mensuelle','AJOURNE_PIECE'],
 ['M-1011','Sahara Services SARL','Personne morale','Bamako','Services numériques','Crédit PME','Équipement',4500000,24,'Mensuelle','PME_RENTABLE'],
 ['M-1012','Coopérative Faso Jigi','Groupe / Coopérative','Sikasso','Céréales','Crédit PME','Campagne agricole',6000000,18,'Saisonnière','GARANTIE_FORTE'],
 ['M-1013','Oumar Traoré','Entrepreneur individuel','Koulikoro','Menuiserie','Crédit PME','Machine atelier',2200000,24,'Mensuelle','DETTE_EXISTANTE'],
 ['M-1014','Hawa Sidibé','Personne physique','Bamako','Comptable','Crédit salarié','Construction',2000000,30,'Mensuelle','REFUSE_CAPACITE'],
 ['M-1015','Boubacar Diallo','Entrepreneur individuel','Gao','Transport','Crédit PME','Réparation véhicule',1600000,12,'Mensuelle','INCIDENT_REGULARISE'],
 ['M-1016','Djeneba Camara','Entrepreneur individuel','Bamako','Coiffure','Crédit PME','Aménagement salon',900000,12,'Mensuelle','NOUVEAU_MEMBRE'],
 ['M-1017',"Entreprise N'Tji SARL",'Personne morale','Ségou','Transformation céréalière','Crédit PME','Extension',7500000,30,'Mensuelle','DEMANDE_EXCESSIVE'],
 ['M-1018','Adama Touré','Personne physique','Bamako','Technicien','Crédit salarié','Scolarité',500000,10,'Mensuelle','DECAISSE'],
 ['M-1019','Coopérative Sabuyuma','Groupe / Coopérative','Koutiala','Coton et vivriers','Crédit PME','Intrants',4000000,12,'Saisonnière','RETARD'],
 ['M-1020','Fanta Cissé','Entrepreneur individuel','Bamako','Vente de produits cosmétiques','Crédit PME','Stock',1300000,15,'Mensuelle','RESTRUCTURE'],
 ['M-1021','Abdoulaye Samaké','Entrepreneur individuel','Sikasso','Maraîchage','Crédit agricole / campagne','Campagne maraîchère',1800000,12,'Saisonnière','AGRICULTURE_CAMPAGNE'],
 ['M-1022','Aïssata Dembélé','Entrepreneur individuel','Koulikoro','Aviculture','Crédit élevage','Extension élevage',1500000,18,'Saisonnière','ELEVAGE_TERRAIN'],
 ['M-1023','Union Jèkaba','Groupe / Coopérative','Ségou','Transformation agroalimentaire','Crédit groupement / coopérative','Équipement collectif',5000000,24,'Trimestrielle','COOPERATIVE_MULTI_MEMBRES'],
 ['M-1024','Mamadou Sissoko','Personne physique','Bamako','Fonctionnaire','Crédit habitat','Amélioration habitat',3500000,36,'Mensuelle','HISTORIQUE_EXCELLENT'],
 ['M-1025','Fatoumata Traoré','Entrepreneur individuel','Bamako','Commerce alimentaire','Crédit commerce','Stock',1000000,12,'Mensuelle','CONTRADICTION_TERRAIN']];
 for(const [no,name,type,city,activity,product,purpose,amount,duration,periodicity,demoCase] of profiles){
  const m=R14.addMember(x,{memberNo:no,name,type,city,activity,phone:'70 '+no.slice(-2)+' 00 00'},'Démonstration R17');
  const a=R14.addApplication(x,{memberId:m.id,product,purpose,requestedAmount:amount,durationMonths:duration,periodicity},'Démonstration R17');
  configureApplication(x,a.id,product,'Démonstration R17');a.demoCase=demoCase;
  const revenue=product==='Crédit salarié'?Math.round(amount/4):Math.round(amount*.55), biz=product==='Crédit salarié'?0:Math.round(revenue*.42), hh=Math.round(revenue*.18), debt=demoCase==='DETTE_EXISTANTE'?Math.round(revenue*.25):Math.round(revenue*.06);
  R14.addIncome(x,{applicationId:a.id,label:product==='Crédit salarié'?'Salaire net':'Ventes / revenus',amount:revenue,source:demoCase==='CONFIANCE_FAIBLE'?'Déclaré':'Documenté'},'Démonstration R17');
  if(biz)R14.addExpense(x,{applicationId:a.id,label:'Charges activité',amount:biz,category:'Activité'},'Démonstration R17');R14.addExpense(x,{applicationId:a.id,label:'Charges ménage',amount:hh,category:'Ménage'},'Démonstration R17');if(debt)R14.addDebt(x,{applicationId:a.id,creditor:'Engagement existant',outstanding:debt*6,installment:debt,status:'Actif',source:'Déclaré'},'Démonstration R17');
  R14.addTrust(x,{applicationId:a.id,dimension:'Transparence / coopération',fact:demoCase==='CONFIANCE_FAIBLE'?'Certaines pièces restent à confirmer.':'Informations communiquées et cohérentes avec le dossier.',source:demoCase==='CONFIANCE_FAIBLE'?'Déclaré':'Documenté',effect:demoCase==='CONFIANCE_FAIBLE'?'Vigilance':'Favorable',verified:demoCase==='CONFIANCE_FAIBLE'?'Non':'Oui'},'Démonstration R17');
  x.memberUsers.push({id:'USR-'+m.id,memberId:m.id,login:m.memberNo,pin:'1234',enabled:true});
  if(product==='Crédit salarié')saveProductForm(x,a.id,{employer:activity+' — employeur',netSalary:revenue,assignableQuota:Math.round(revenue*.35),monthlyRepayment:Math.round(amount/duration),salaryDomiciliationDate:demoCase==='NON_DOMICILIE'?'':'2025-01-15'},'Démonstration R17');
  else saveBusinessAnalysis(x,{applicationId:a.id,sales:revenue,purchases:Math.round(revenue*.45),operatingExpenses:Math.round(revenue*.12),market:'Marché local et régional',competitors:'Concurrence connue',customers:'Clientèle régulière',pricesVolumes:'Prix et volumes documentés',history:'Activité suivie',productsServices:activity,source:'Documenté'},'Démonstration R17');
  if(demoCase==='AJOURNE_PIECE'){R14.recordDecision(x,{applicationId:a.id,decision:'AJOURNÉ',reason:'Pièce justificative complémentaire attendue'},'Comité de crédit');}
  else if(demoCase==='REFUSE_CAPACITE'||demoCase==='DEMANDE_EXCESSIVE'){R14.recordDecision(x,{applicationId:a.id,decision:'REFUSÉ',reason:demoCase==='REFUSE_CAPACITE'?'Capacité insuffisante au regard de la demande':'Montant demandé non soutenable'},'Comité de crédit');}
  else if(['DECAISSE','RETARD','RESTRUCTURE'].includes(demoCase)){
    x.checklists.filter(c=>c.applicationId===a.id).forEach(c=>c.status='Vérifié');
    const approved=Math.round(amount*.9);R14.recordDecision(x,{applicationId:a.id,decision:'VALIDÉ',approvedAmount:approved,authority:'Comité de crédit',meetingRef:'PV-DEMO-R17'},'Comité de crédit');
    R14.disburse(x,{applicationId:a.id,amount:approved,method:'Caisse',reference:'DEC-DEMO-R17'},'Caisse');R14.generateSchedule(x,a.id,{annualRate:18,interestMethod:'Dégressif'});
    if(demoCase==='RETARD'){const first=x.schedules.find(v=>v.applicationId===a.id&&v.active);if(first)first.dueDate='2026-08-01';a.status='EN SUIVI';}
    if(demoCase==='RESTRUCTURE')R14.restructure(x,{applicationId:a.id,reason:'Baisse temporaire d’activité documentée',evidence:'VIS-DEMO-R17',newDuration:24,newPeriodicity:'Mensuelle',annualRate:18,interestMethod:'Dégressif'},'Responsable crédit');
  }
  else a.status=['DOSSIER_COMPLET','PME_RENTABLE','GARANTIE_FORTE'].includes(demoCase)?'EN ANALYSE':'À COMPLÉTER';
 }
 return x;
}
function ensureMvpDemoCase(x){
 const a=x.applications?.find(v=>v.demoCase==='DOSSIER_COMPLET');if(!a)return x;
 const actor='Démonstration MVP';
 const form=productForm(x,a.id);
 form.data={...form.data,accountNumber:form.data.accountNumber||'CPT-1005',memberSince:form.data.memberSince||'2022-01-10',accountBalance:num(form.data.accountBalance)||185000,profession:form.data.profession||'Enseignant',employer:form.data.employer||'Éducation nationale',hireDate:form.data.hireDate||'2018-10-01',contractDurationMonths:num(form.data.contractDurationMonths)||120,salaryDomiciliationDate:form.data.salaryDomiciliationDate||'2025-01-15',netSalary:num(form.data.netSalary)||280000,assignableQuota:num(form.data.assignableQuota)||98000,dga:num(form.data.dga)||25000,monthlyRepayment:num(form.data.monthlyRepayment)||65000,loanPurposeCategory:form.data.loanPurposeCategory||'Scolarité',priorCreditSummary:form.data.priorCreditSummary||'Un crédit antérieur remboursé sans incident.'};
 const docs=['Pièce d’identité','Demande signée','Justificatif de salaire','Justificatif employeur / contrat'];
 for(const [i,label] of docs.entries())if(!x.documents.some(v=>v.applicationId===a.id&&v.label===label))R14.addDocument(x,{applicationId:a.id,label,status:'Vérifié',source:'Documenté',reference:`MVP-${i+1}`},actor);
 if(!x.visits.some(v=>v.applicationId===a.id))R14.addVisit(x,{applicationId:a.id,addressVerified:'Oui',activityObserved:'Oui',stock:'Sans objet',equipment:'Sans objet',observations:'Situation et informations vérifiées pour la démonstration MVP.',customerFlow:'Sans objet',activityAge:'72',geoReference:'Bamako'},actor);
 if(!x.guarantees.some(v=>v.applicationId===a.id))R14.addGuarantee(x,{applicationId:a.id,type:'Domiciliation salaire',description:'Salaire domicilié et épargne obligatoire',owner:'Moussa Coulibaly',declaredValue:650000,expertValue:650000,retainedValue:650000,status:'Vérifiée'},actor);
 for(const c of ensurePolicyChecks(x,a.id))if(c.status!=='Conforme')setPolicyCheck(x,a.id,c.code,'Conforme','Vérifié dans le dossier MVP',actor);
 if(!x.workflowActions.some(v=>v.applicationId===a.id&&v.step==='AGENT_CREDIT'&&v.status==='VALIDÉ'))recordWorkflowAction(x,a.id,'AGENT_CREDIT','VALIDÉ','Dossier constitué et transmis pour analyse.',actor,{risk:'Risque acceptable'});
 return x;
}
function audit(x,action,actor,detail={}){x.audit.unshift({at:iso(),action,actor,...detail})}
export function productDefinition(product){const known=PRODUCT_DEFINITIONS[product];if(known)return known;return {...PRODUCT_DEFINITIONS['Crédit PME'],code:'CONFIGURABLE',sections:PRODUCT_DEFINITIONS['Crédit PME'].sections}}
export function configureApplication(x,id,product,actor='Système'){const a=x.applications.find(v=>v.id===id);if(!a)throw Error('Dossier introuvable');a.product=product;const def=productDefinition(product),catalog=productByName(x,product);x.checklists=x.checklists.filter(c=>c.applicationId!==id);(catalog?.requiredDocs||def.requiredDocs).forEach(label=>x.checklists.push({id:next('CHK',x.checklists),applicationId:id,label,required:true,status:'Manquant'}));let f=x.productForms.find(v=>v.applicationId===id);if(!f){f={id:next('FRM',x.productForms),applicationId:id,product,data:{},updatedAt:iso()};x.productForms.push(f)}else f.product=product;ensurePolicyChecks(x,id);audit(x,'PARCOURS_PRODUIT_CONFIGURÉ',actor,{applicationId:id,product});return f}
export function addApplication(x,d,actor){ensureCatalog(x);const member=x.members.find(m=>m.id===d.memberId);const check=validateProductRequest(x,{...d,memberType:member?.type});if(!check.ok)throw Error(check.errors.join(' · '));const a=R14.addApplication(x,d,actor);freezePolicySnapshot(x,a);configureApplication(x,a.id,d.product||'Crédit PME',actor);return a}
export function updateApplication(x,id,d,actor){ensureCatalog(x);const old=x.applications.find(v=>v.id===id);const member=x.members.find(m=>m.id===old?.memberId);const candidate={...old,...d};const check=validateProductRequest(x,{...candidate,memberType:member?.type});if(!check.ok)throw Error(check.errors.join(' · '));const a=R14.updateApplication(x,id,d,actor);if(d.product)configureApplication(x,id,d.product,actor);freezePolicySnapshot(x,a);return a}
export function saveProductForm(x,id,data,actor){let f=x.productForms.find(v=>v.applicationId===id);if(!f)f=configureApplication(x,id,x.applications.find(a=>a.id===id)?.product||'Crédit PME',actor);f.data={...f.data,...data};f.updatedAt=iso();audit(x,'FORMULAIRE_PRODUIT_MIS_À_JOUR',actor,{applicationId:id});return f}
export function productForm(x,id){return x.productForms.find(v=>v.applicationId===id)||configureApplication(x,id,x.applications.find(a=>a.id===id)?.product||'Crédit PME')}
export function saveBusinessAnalysis(x,d,actor){let v=x.businessAnalyses.find(z=>z.applicationId===d.applicationId);const sales=num(d.sales),purchases=num(d.purchases),operating=num(d.operatingExpenses),gross=sales-purchases,result=gross-operating;const data={sales,purchases,grossMargin:gross,operatingExpenses:operating,result,market:d.market||'',competitors:d.competitors||'',customers:d.customers||'',pricesVolumes:d.pricesVolumes||'',history:d.history||'',productsServices:d.productsServices||'',source:d.source||'Déclaré',updatedAt:iso()};if(v)Object.assign(v,data);else{x.businessAnalyses.push(v={id:next('BUS',x.businessAnalyses),applicationId:d.applicationId,...data})}audit(x,'ANALYSE_ACTIVITÉ_MARCHÉ',actor,{applicationId:d.applicationId});return v}
export function savePersonalBudget(x,d,actor){let v=x.personalBudgets.find(z=>z.applicationId===d.applicationId);const data={salary:num(d.salary),otherIncome:num(d.otherIncome),personalExpenses:num(d.personalExpenses),creditTontinePayments:num(d.creditTontinePayments),net:num(d.salary)+num(d.otherIncome)-num(d.personalExpenses)-num(d.creditTontinePayments),updatedAt:iso()};if(v)Object.assign(v,data);else x.personalBudgets.push(v={id:next('BUD',x.personalBudgets),applicationId:d.applicationId,...data});audit(x,'BUDGET_PERSONNEL_MIS_À_JOUR',actor,{applicationId:d.applicationId});return v}
export function savePersonalBalance(x,d,actor){let v=x.personalBalanceSheets.find(z=>z.applicationId===d.applicationId);const assets=num(d.savings)+num(d.cash)+num(d.furniture)+num(d.vehicle)+num(d.property),liabilities=num(d.bankDebt)+num(d.otherCreditors),data={savings:num(d.savings),cash:num(d.cash),furniture:num(d.furniture),vehicle:num(d.vehicle),property:num(d.property),bankDebt:num(d.bankDebt),otherCreditors:num(d.otherCreditors),assets,liabilities,netWorth:assets-liabilities,updatedAt:iso()};if(v)Object.assign(v,data);else x.personalBalanceSheets.push(v={id:next('BAL',x.personalBalanceSheets),applicationId:d.applicationId,...data});audit(x,'BILAN_PERSONNEL_MIS_À_JOUR',actor,{applicationId:d.applicationId});return v}
function policyLabels(product){return product==='Crédit salarié'?[['QUOTITE_CESSIBLE','Quotité cessible supérieure au remboursement'],['DUREE_PRODUIT','Durée conforme au produit'],['DOCUMENTS_REQUIS','Pièces requises vérifiées']]:[['PLAFONDS','Respect des différents plafonds'],['ENCOURS_AUTORISE','Respect de l’encours de prêt autorisé'],['FRAIS_ASSURANCE','Frais de dossier, gestion, caution et assurances'],['DOCUMENTS_LEGAUX_GARANTIES','Documents légaux et de garantie signés/légalisés'],['VISAS','Visas requis obtenus']];}
export function ensurePolicyChecks(x,id){const a=x.applications.find(v=>v.id===id);if(!a)return[];const labels=policyLabels(a.product);for(const [code,label] of labels)if(!x.policyChecks.some(v=>v.applicationId===id&&v.code===code))x.policyChecks.push({id:next('POL',x.policyChecks),applicationId:id,code,label,status:'À contrôler',evidence:'',updatedAt:iso()});return x.policyChecks.filter(v=>v.applicationId===id)}
export function setPolicyCheck(x,id,code,status,evidence,actor){const v=ensurePolicyChecks(x,id).find(z=>z.code===code);if(!v)throw Error('Règle introuvable');v.status=status;v.evidence=evidence||'';v.updatedAt=iso();audit(x,'CONTRÔLE_POLITIQUE',actor,{applicationId:id,code,status});return v}
export function policySummary(x,id){const items=ensurePolicyChecks(x,id),ok=items.filter(v=>v.status==='Conforme').length,blocked=items.filter(v=>v.status==='Non conforme').length;return {items,ok,blocked,pending:items.length-ok-blocked,compliant:items.length>0&&ok===items.length}}
export const RISK_DIMENSIONS=['Volonté de payer de l’emprunteur','Stabilité et sécurité du revenu','Stabilité de l’adresse','Pouvoir actuel de remboursement','Niveau et qualité des garanties','Coefficient de la capacité de remboursement','Antécédents de crédit','Équilibre budget familial','Réputation dans le milieu'];
export function setInstitutionalRisk(x,id,dimension,rating,evidence,actor){if(!RISK_DIMENSIONS.includes(dimension))throw Error('Dimension de risque inconnue');let v=x.institutionalRisk.find(z=>z.applicationId===id&&z.dimension===dimension);const data={rating,evidence:evidence||'',updatedAt:iso(),actor};if(v)Object.assign(v,data);else x.institutionalRisk.push(v={id:next('RSK',x.institutionalRisk),applicationId:id,dimension,...data});audit(x,'GRILLE_RISQUE_INSTITUTIONNELLE',actor,{applicationId:id,dimension,rating});return v}
export function salaryCapacity(x,id){const f=productForm(x,id).data,monthly=num(f.monthlyRepayment),quota=num(f.assignableQuota);return {netSalary:num(f.netSalary),assignableQuota:quota,monthlyRepayment:monthly,compliant:quota>monthly,margin:quota-monthly}}
export function workflowState(x,id){const a=x.applications.find(v=>v.id===id),def=productDefinition(a?.product),actions=x.workflowActions.filter(v=>v.applicationId===id).map(v=>({...v,step:stepOf(v.step)}));
const latest=step=>actions.filter(v=>v.step===step).at(-1)||null;
const done=step=>step==='COMITE_CREDIT'?['VALIDÉ','REFUSÉ'].includes(latest(step)?.status):latest(step)?.status==='VALIDÉ';
const agent=latest('AGENT_CREDIT'),analyst=latest('ANALYSTE_RESPONSABLE_CREDIT');
return {steps:def.workflow.map(step=>({step,done:done(step),last:latest(step)})),actions,next:def.workflow.find(step=>!done(step))||'TERMINÉ',agentOpinion:agent?.status==='VALIDÉ'?agent:null,analystOpinion:analyst?.status==='VALIDÉ'?analyst:null,returned:agent?.status==='À_REPRENDRE'?agent:null}}
export function recordWorkflowAction(x,id,step,status,note,actor,extra={}){step=stepOf(step);const def=productDefinition(x.applications.find(v=>v.id===id)?.product);if(!def.workflow.includes(step))throw Error('Étape non prévue pour ce produit');const v={id:next('WF',x.workflowActions),applicationId:id,step,status,note:note||'',...extra,actor,at:iso()};x.workflowActions.push(v);audit(x,'WORKFLOW_VALIDATION',actor,{applicationId:id,step,status});return v}
// Formulaires, section « Recommandation de l'agent de crédit » : avis motivé puis transmission à l'analyste.
export function submitAgentOpinion(x,id,{risk,opinion},actor){if(!RISK_OPINIONS.includes(risk))throw Error('Choisir « Risque acceptable » ou « Risque élevé »');if(!String(opinion||'').trim())throw Error('Avis motivé obligatoire');return recordWorkflowAction(x,id,'AGENT_CREDIT','VALIDÉ',opinion.trim(),actor,{risk})}
// Avis de l'analyste : transmission au comité, ou renvoi à l'agent pour complément.
export function recordAnalystReview(x,id,{risk,opinion,outcome},actor){if(!String(opinion||'').trim())throw Error('Avis motivé obligatoire');
if(outcome==='RENVOYÉ'){const v=recordWorkflowAction(x,id,'ANALYSTE_RESPONSABLE_CREDIT','RENVOYÉ',opinion.trim(),actor);recordWorkflowAction(x,id,'AGENT_CREDIT','À_REPRENDRE',opinion.trim(),actor);return v}
if(!workflowState(x,id).agentOpinion)throw Error('L’agent n’a pas encore soumis son avis');if(!RISK_OPINIONS.includes(risk))throw Error('Choisir « Risque acceptable » ou « Risque élevé »');
return recordWorkflowAction(x,id,'ANALYSTE_RESPONSABLE_CREDIT','VALIDÉ',opinion.trim(),actor,{risk})}
export function dossier(x,id){const d=R14.dossier(x,id),a=d.application,sc=sfdScore(x,id);return {...d,incluscore:sc?.score||0,incluscoreDetail:sc,productDefinition:productDefinition(a.product),productForm:productForm(x,id),businessAnalysis:x.businessAnalyses.find(v=>v.applicationId===id)||null,personalBudget:x.personalBudgets.find(v=>v.applicationId===id)||null,personalBalance:x.personalBalanceSheets.find(v=>v.applicationId===id)||null,policy:policySummary(x,id),institutionalRisk:x.institutionalRisk.filter(v=>v.applicationId===id),workflow:workflowState(x,id),sfdField:fieldSummary(x,id)}}

export {recordBic,bicFor,disputeData,resolveDispute,auditFor,registerImport,passportSummary};

// Score SFD (critères des documents terrain) : remplace le calcul R14 pour l'application.
export function incluscore(x,id){return sfdScore(x,id)}
// La décision fige le score, sa version et ses normes au moment où le comité statue.
export function recordDecision(x,d,actor){const id=d.applicationId,before=workflowState(x,id),sc=sfdScore(x,id),v=R14.recordDecision(x,d,actor);
// Conditions du formulaire « Décision du comité » : montant, taux, durée, échéances, membres présents, quorum.
const rate=num(d.annualRate)||null,duration=num(d.durationMonths)||null,periodicity=d.periodicity||null;
Object.assign(v,{annualRate:rate,durationMonths:duration,periodicity,membersPresent:String(d.membersPresent||'').trim(),directorSignature:d.directorSignature==='Oui'});
if(d.decision==='VALIDÉ'&&v.approvedAmount>0&&rate&&duration){const sim=R14.simulate(x,id,v.approvedAmount,duration,periodicity||'Mensuelle',rate,'Dégressif');v.installments=sim.periods;v.installmentAmount=Math.round(sim.installment)}
// Le comité n'est pas bloqué, mais la décision garde la trace des étapes qui manquaient.
if(before.next!=='COMITE_CREDIT'&&before.next!=='TERMINÉ')v.workflowWarning=`Décision prise avant l’étape « ${STEP_LABELS[before.next]||before.next} »`;
if(sc)v.scoreSnapshot={score:sc.score,band:sc.band,coverage:sc.coverage,dataConfidence:sc.dataConfidence,axes:sc.axes,outOfNorm:sc.outOfNorm,policyVersion:sc.policyVersion,engineVersion:sc.engineVersion,at:v.at};
recordWorkflowAction(x,id,'COMITE_CREDIT',d.decision,d.reason||'',actor);
// Ajourné : le dossier revient à l'agent, puis repasse par l'analyste.
if(d.decision==='AJOURNÉ'){recordWorkflowAction(x,id,'AGENT_CREDIT','À_REPRENDRE',d.reason||'Dossier ajourné par le comité',actor);recordWorkflowAction(x,id,'ANALYSTE_RESPONSABLE_CREDIT','À_REPRENDRE',d.reason||'Dossier ajourné par le comité',actor)}
return v}

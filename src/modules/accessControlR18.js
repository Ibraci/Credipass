import {territorialAccess,normalizeUser} from './decentralizedR191.js';
import {authorityForAmount} from '../config/creditGovernancePolicies.js';
export const ROLES={
 GERANT:{label:'Gérant / Chef d’agence',permissions:['MEMBER_VIEW','MEMBER_CREATE','MEMBER_EDIT','APPLICATION_VIEW','DOCUMENT_VIEW','PASSPORT_VIEW','WORKFLOW_VIEW']},
 AGENT_CREDIT:{label:'Agent de crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','APPLICATION_CREATE','APPLICATION_EDIT','DOCUMENT_VIEW','DOCUMENT_UPLOAD','FIELD_VISIT_EDIT','COLLECTION_EDIT','GUARANTEE_EDIT','PASSPORT_VIEW','SUBMIT_ANALYSIS']},
 ANALYSTE_RESPONSABLE_CREDIT:{label:'Analyste / Responsable crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','ANALYSIS_EDIT','GUARANTEE_VIEW','SCORE_RUN','SCORE_VIEW','SCORE_EXPLAIN','SIMULATE','RECOMMEND','PASSPORT_VIEW','BIC_EDIT','DISPUTE_EDIT','REQUEST_COMPLEMENT','SUPERVISOR_VALIDATE','WORKFLOW_VIEW']},
 CONFORMITE:{label:'Conformité / Contrôle / Risques',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','POLICY_VIEW','POLICY_VALIDATE','SCORE_VIEW','BIC_EDIT','DISPUTE_EDIT','AUDIT_VIEW','WORKFLOW_VIEW']},
 COMITE_CREDIT:{label:'Caisse de crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','SCORE_VIEW','SCORE_EXPLAIN','COMMITTEE_VIEW','CREDIT_APPROVE','CREDIT_REJECT','CREDIT_ADJOURN','PASSPORT_VIEW','WORKFLOW_VIEW']},
 DIRECTION:{label:'Direction générale',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','SCORE_VIEW','SCORE_EXPLAIN','PORTFOLIO_VIEW','REPORT_VIEW','PASSPORT_VIEW','COMMITTEE_VIEW','CREDIT_APPROVE','CREDIT_REJECT','CREDIT_ADJOURN','WORKFLOW_VIEW']},
 AUDITEUR:{label:'Auditeur',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','SCORE_VIEW','SCORE_EXPLAIN','AUDIT_VIEW','REPORT_VIEW','PASSPORT_VIEW','WORKFLOW_VIEW']},
 ADMIN_SYSTEME:{label:'Administrateur Système',permissions:['USER_ADMIN','ROLE_ADMIN','POLICY_EDIT','POLICY_PUBLISH','AUDIT_VIEW','REPORT_VIEW','SYSTEM_CONFIG','SYSTEM_HEALTH','BACKUP_RESTORE','SYNC_ADMIN','OCR_ADMIN','REFERENCE_ADMIN','WORKFLOW_ADMIN','PRODUCT_ADMIN','DATA_IMPORT']},
 CAISSE_COMPTABILITE:{label:'Caisse / Comptabilité',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DISBURSE','SCHEDULE_GENERATE','PAYMENT_RECORD','PASSPORT_VIEW','WORKFLOW_VIEW']},
 SUIVI_RECOUVREMENT:{label:'Suivi / Recouvrement',permissions:['MEMBER_VIEW','APPLICATION_VIEW','PASSPORT_VIEW','PAYMENT_RECORD','FOLLOWUP_EDIT','RESTRUCTURE_PROPOSE','CLOSE_CREDIT','WORKFLOW_VIEW']}
};
export const DEMO_USERS=[
 {login:'gerant',role:'GERANT',name:'Gérant / Chef d’agence',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']},
 {login:'agent.credit',role:'AGENT_CREDIT',name:'Agent de crédit',agency:'Agence principale',scopeMode:'OWN'},
 {login:'analyste.credit',role:'ANALYSTE_RESPONSABLE_CREDIT',name:'Analyste / Responsable crédit',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']},
 {login:'conformite',role:'CONFORMITE',name:'Conformité / Contrôle / Risques',agency:'Contrôle',scopeMode:'GLOBAL'},
 {login:'comite.credit',role:'COMITE_CREDIT',name:'Caisse de crédit',agency:'Caisse de crédit',scopeMode:'GLOBAL'},
 {login:'direction',role:'DIRECTION',name:'Direction générale',agency:'Direction générale',scopeMode:'GLOBAL'},
 {login:'auditeur',role:'AUDITEUR',name:'Auditeur',agency:'Audit',scopeMode:'GLOBAL'},
 {login:'admin.systeme',role:'ADMIN_SYSTEME',name:'Administrateur Système',agency:'Administration',scopeMode:'GLOBAL'},
 {login:'caisse',role:'CAISSE_COMPTABILITE',name:'Caisse / Comptabilité',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']},
 {login:'suivi.credit',role:'SUIVI_RECOUVREMENT',name:'Suivi / Recouvrement',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']}
];
for(const u of DEMO_USERS)normalizeUser(u);
export function can(user,permission){return !!user&&ROLES[user.role]?.permissions.includes(permission)}
export function requirePermission(user,permission){if(!can(user,permission))throw Error(`Action non autorisée pour le rôle « ${ROLES[user?.role]?.label||'inconnu'} »`);return true}
export function roleLabel(user){return ROLES[user?.role]?.label||'Utilisateur'}
export function normalizeScope(db){for(const m of db.members||[]){m.agency??='Agence principale';m.ownerLogin??='gerant';m.assignedAgentLogin??='agent.credit'}for(const a of db.applications||[]){const m=(db.members||[]).find(x=>x.id===a.memberId);a.agency??=m?.agency||'Agence principale';a.ownerLogin??=m?.assignedAgentLogin||'agent.credit'}return db}
function scopeAllows(user,entity){return territorialAccess(user,entity)}
export function canAccessMember(user,member){return !!user&&!!member&&can(user,'MEMBER_VIEW')&&scopeAllows(user,member)}
export function canAccessApplication(user,app){return !!user&&!!app&&can(user,'APPLICATION_VIEW')&&scopeAllows(user,app)}
export function visibleMembers(user,db){return (db.members||[]).filter(m=>canAccessMember(user,m))}
export function visibleApplications(user,db){return (db.applications||[]).filter(a=>canAccessApplication(user,a))}
export function decisionAuthority(appOrAmount){const amount=typeof appOrAmount==='object'?appOrAmount?.requestedAmount:appOrAmount;return authorityForAmount(amount)}
export function canDecideApplication(user,app){const rule=decisionAuthority(app);return !!user&&!!app&&!!rule&&user.role===rule.requiredRole&&can(user,'CREDIT_APPROVE')}
export function roleMission(user){return ({
 GERANT:'Créer et maintenir les membres de l’agence, suivre l’activité et affecter les dossiers aux agents.',
 AGENT_CREDIT:'Constituer le dossier, collecter les preuves, réaliser la visite terrain et transmettre un dossier complet à l’analyse.',
 ANALYSTE_RESPONSABLE_CREDIT:'Analyser la capacité, le scoring institutionnel, INCLUSCORE, les garanties et formuler une recommandation explicable.',
 CONFORMITE:'Contrôler les règles, pièces, BIC, anomalies, conformité et traçabilité avant décision.',
 COMITE_CREDIT:'Décider les crédits jusqu’à 5 000 000 FCFA inclus, après contrôle du dossier et des recommandations.',
 DIRECTION:'Décider les crédits supérieurs à 5 000 000 FCFA et piloter le portefeuille consolidé.',
 AUDITEUR:'Consulter en lecture seule les dossiers, décisions et journaux de preuve pour vérifier la traçabilité.',
 ADMIN_SYSTEME:'Administrer les comptes, rôles, produits, politiques, synchronisation et santé du système sans instruire un crédit.',
 CAISSE_COMPTABILITE:'Décaisser uniquement les crédits validés, générer l’échéancier et enregistrer les opérations financières.',
 SUIVI_RECOUVREMENT:'Suivre les échéances, retards, relances, restructurations et clôtures après décaissement.'
})[user?.role]||'Consulter les informations autorisées selon votre rôle.'}
export function roleTaskApplications(user,db){const apps=visibleApplications(user,db),decisions=db.decisions||[],hasDecision=a=>decisions.some(d=>d.applicationId===a.id),hasDisbursement=a=>(db.disbursements||[]).some(d=>d.applicationId===a.id),hasOutstanding=a=>{const dis=(db.disbursements||[]).filter(x=>x.applicationId===a.id).reduce((s,x)=>s+Number(x.amount||0),0),paid=(db.payments||[]).filter(x=>x.applicationId===a.id).reduce((s,x)=>s+Number(x.principal||x.amount||0),0);return dis-paid>0};switch(user?.role){case'AGENT_CREDIT':return apps.filter(a=>!hasDecision(a)&&!['REFUSÉ','CLÔTURÉ'].includes(a.status));case'ANALYSTE_RESPONSABLE_CREDIT':return apps.filter(a=>!hasDecision(a)&&['EN ANALYSE','À COMPLÉTER','BROUILLON'].includes(a.status));case'CONFORMITE':return apps.filter(a=>(db.policyChecks||[]).some(p=>p.applicationId===a.id&&p.status!=='Conforme'));case'COMITE_CREDIT':return apps.filter(a=>Number(a.requestedAmount)<=5000000&&!hasDecision(a));case'DIRECTION':return apps.filter(a=>Number(a.requestedAmount)>5000000&&!hasDecision(a));case'CAISSE_COMPTABILITE':return apps.filter(a=>decisions.some(d=>d.applicationId===a.id&&d.decision==='VALIDÉ')&&!hasDisbursement(a));case'SUIVI_RECOUVREMENT':return apps.filter(hasOutstanding);case'AUDITEUR':return apps.filter(hasDecision);default:return apps.filter(a=>!['REFUSÉ','CLÔTURÉ'].includes(a.status))}}
export function cockpit(user,db){const apps=visibleApplications(user,db),decisions=db.decisions||[],outstanding=a=>Number((db.disbursements||[]).filter(x=>x.applicationId===a.id).reduce((s,x)=>s+Number(x.amount||0),0))-Number((db.payments||[]).filter(x=>x.applicationId===a.id).reduce((s,x)=>s+Number(x.principal||x.amount||0),0));switch(user?.role){
 case'GERANT':return [['Membres agence',visibleMembers(user,db).length],['Dossiers agence',apps.length],['À affecter',visibleMembers(user,db).filter(m=>!m.assignedAgentLogin).length]];
 case'AGENT_CREDIT':return [['Brouillons / compléments',apps.filter(a=>['BROUILLON','À COMPLÉTER'].includes(a.status)).length],['Visites à faire',apps.filter(a=>!(db.visits||[]).some(v=>v.applicationId===a.id)&&!['REFUSÉ','CLÔTURÉ'].includes(a.status)).length],['À transmettre',apps.filter(a=>a.status==='EN ANALYSE').length]];
 case'ANALYSTE_RESPONSABLE_CREDIT':return [['À analyser',apps.filter(a=>a.status==='EN ANALYSE').length],['Scoring à compléter',apps.filter(a=>String(a.product).includes('PME')&&!((db.institutionalScorecards||[]).find(s=>s.applicationId===a.id)?.updatedAt)).length],['Recommandations',apps.filter(a=>!decisions.some(d=>d.applicationId===a.id)).length]];
 case'CONFORMITE':return [['Contrôles à finaliser',(db.policyChecks||[]).filter(x=>x.status==='À contrôler').length],['Litiges données',(db.dataDisputes||[]).filter(x=>!x.resolvedAt).length],['Dossiers à auditer',apps.filter(a=>['EN ANALYSE','EN COMITÉ'].includes(a.status)).length]];
 case'COMITE_CREDIT':return [['À décider ≤ 5 M',apps.filter(a=>Number(a.requestedAmount)<=5000000&&!decisions.some(d=>d.applicationId===a.id)).length],['Ajournés',apps.filter(a=>a.status==='AJOURNÉ').length],['Décidés',apps.filter(a=>Number(a.requestedAmount)<=5000000&&decisions.some(d=>d.applicationId===a.id)).length]];
 case'DIRECTION':return [['À décider > 5 M',apps.filter(a=>Number(a.requestedAmount)>5000000&&!decisions.some(d=>d.applicationId===a.id)).length],['Encours dossiers',apps.filter(a=>outstanding(a)>0).length],['Dossiers consolidés',apps.length]];
 case'AUDITEUR':return [['Événements audit',(db.audit||[]).length],['Décisions',decisions.length],['Dossiers consultables',apps.length]];
 case'ADMIN_SYSTEME':return [['Comptes',DEMO_USERS.length],['Produits',(db.creditProducts||[]).length],['Nœuds',(db.nodeRegistry||[]).length]];
 case'CAISSE_COMPTABILITE':return [['À décaisser',apps.filter(a=>decisions.some(d=>d.applicationId===a.id&&d.decision==='VALIDÉ')&&!(db.disbursements||[]).some(x=>x.applicationId===a.id)).length],['Décaissements',(db.disbursements||[]).length],['Paiements du registre',(db.payments||[]).length]];
 case'SUIVI_RECOUVREMENT':return [['Crédits en cours',apps.filter(a=>outstanding(a)>0).length],['Retards',(db.alertsLog||[]).filter(x=>x.type==='RETARD').length],['Actions de suivi',(db.followups||[]).length]];
 default:return [['Dossiers',apps.length],['En analyse',apps.filter(a=>a.status==='EN ANALYSE').length],['Ajournés',apps.filter(a=>a.status==='AJOURNÉ').length]];
}}

import {territorialAccess,normalizeUser} from './decentralizedR191.js';
export const ROLES={
 GERANT:{label:'Gérant',permissions:['MEMBER_VIEW','MEMBER_CREATE','MEMBER_EDIT','APPLICATION_VIEW','DOCUMENT_VIEW','PASSPORT_VIEW','WORKFLOW_VIEW']},
 AGENT_CREDIT:{label:'Agent de crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','APPLICATION_CREATE','APPLICATION_EDIT','DOCUMENT_VIEW','DOCUMENT_UPLOAD','FIELD_VISIT_EDIT','COLLECTION_EDIT','GUARANTEE_EDIT','PASSPORT_VIEW','SUBMIT_ANALYSIS']},
 ANALYSTE_RESPONSABLE_CREDIT:{label:'Analyste / Responsable crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','ANALYSIS_EDIT','GUARANTEE_VIEW','SCORE_RUN','SCORE_VIEW','SCORE_EXPLAIN','SIMULATE','RECOMMEND','PASSPORT_VIEW','BIC_EDIT','DISPUTE_EDIT','REQUEST_COMPLEMENT','SUPERVISOR_VALIDATE','WORKFLOW_VIEW']},
 CONFORMITE:{label:'Conformité / Contrôle / Risques',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','POLICY_VIEW','POLICY_VALIDATE','BIC_EDIT','DISPUTE_EDIT','AUDIT_VIEW']},
 COMITE_CREDIT:{label:'Comité de crédit',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','SCORE_VIEW','SCORE_EXPLAIN','COMMITTEE_VIEW','CREDIT_APPROVE','CREDIT_REJECT','CREDIT_ADJOURN','PASSPORT_VIEW']},
 DIRECTION:{label:'Direction',permissions:['MEMBER_VIEW','APPLICATION_VIEW','SCORE_VIEW','SCORE_EXPLAIN','PORTFOLIO_VIEW','REPORT_VIEW','PASSPORT_VIEW']},
 AUDITEUR:{label:'Auditeur',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DOCUMENT_VIEW','GUARANTEE_VIEW','SCORE_VIEW','SCORE_EXPLAIN','AUDIT_VIEW','REPORT_VIEW','PASSPORT_VIEW']},
 ADMIN_SYSTEME:{label:'Administrateur Système',permissions:['USER_ADMIN','ROLE_ADMIN','POLICY_EDIT','POLICY_PUBLISH','AUDIT_VIEW','REPORT_VIEW','SYSTEM_CONFIG','SYSTEM_HEALTH','BACKUP_RESTORE','SYNC_ADMIN','OCR_ADMIN','REFERENCE_ADMIN','WORKFLOW_ADMIN','PRODUCT_ADMIN','DATA_IMPORT']},
 CAISSE_COMPTABILITE:{label:'Caisse / Comptabilité',permissions:['MEMBER_VIEW','APPLICATION_VIEW','DISBURSE','SCHEDULE_GENERATE','PAYMENT_RECORD','PASSPORT_VIEW']},
 SUIVI_RECOUVREMENT:{label:'Suivi / Recouvrement',permissions:['MEMBER_VIEW','APPLICATION_VIEW','PASSPORT_VIEW','PAYMENT_RECORD','FOLLOWUP_EDIT','RESTRUCTURE_PROPOSE','CLOSE_CREDIT']}
};
export const DEMO_USERS=[
 {login:'gerant',role:'GERANT',name:'Gérant',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']},
 {login:'agent.credit',role:'AGENT_CREDIT',name:'Agent de crédit',agency:'Agence principale',scopeMode:'OWN'},
 {login:'analyste.credit',role:'ANALYSTE_RESPONSABLE_CREDIT',name:'Analyste / Responsable crédit',agency:'Agence principale',scopeMode:'AGENCY',scopeAgencies:['Agence principale']},
 {login:'conformite',role:'CONFORMITE',name:'Conformité / Contrôle / Risques',agency:'Contrôle',scopeMode:'GLOBAL'},
 {login:'comite.credit',role:'COMITE_CREDIT',name:'Comité de crédit',agency:'Comité',scopeMode:'GLOBAL'},
 {login:'direction',role:'DIRECTION',name:'Direction',agency:'Direction',scopeMode:'GLOBAL'},
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
export function cockpit(user,db){const apps=visibleApplications(user,db);switch(user?.role){case'GERANT':return [['Membres agence',visibleMembers(user,db).length],['Nouveaux membres',visibleMembers(user,db).filter(m=>!apps.some(a=>a.memberId===m.id)).length],['Dossiers agence',apps.length]];case'AGENT_CREDIT':return [['Brouillons hors ligne',apps.filter(a=>['BROUILLON','À COMPLÉTER'].includes(a.status)).length],['Visites / compléments',apps.filter(a=>a.status==='À COMPLÉTER').length],['À transmettre',apps.filter(a=>a.status==='EN ANALYSE').length]];case'ANALYSTE_RESPONSABLE_CREDIT':return [['À analyser',apps.filter(a=>a.status==='EN ANALYSE').length],['Confiance faible',apps.filter(a=>a.demoCase==='CONFIANCE_FAIBLE').length],['Contradictions',apps.filter(a=>a.demoCase==='CONTRADICTION_TERRAIN').length]];case'COMITE_CREDIT':return [['À examiner',apps.filter(a=>['EN COMITÉ','EN ANALYSE'].includes(a.status)).length],['Ajournés',apps.filter(a=>a.status==='AJOURNÉ').length],['Décidés',apps.filter(a=>['VALIDÉ','REFUSÉ'].includes(a.status)).length]];default:return [['Dossiers',apps.length],['En analyse',apps.filter(a=>a.status==='EN ANALYSE').length],['Ajournés',apps.filter(a=>a.status==='AJOURNÉ').length]]}}

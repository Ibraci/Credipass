export const SECURITY_GOVERNANCE_POLICY = {
  id:'credipass-security-baseline', version:'4.0.0',
  statusScale:['implemented-synthetic','prepared','required','not-applicable'],
  productionBlockingStatuses:['required'],
  minimumPilotScore:72,
  minimumProductionScore:92,
  fairnessReviewGapPp:12,
  minimumFairnessCellSize:12,
  requiredModelApprovals:['product-owner','risk-owner','independent-reviewer'],
  forbiddenSecretPatterns:['api_key=','secret=','password=','private_key=','bearer ']
};
export const SECURITY_CONTROLS = [
  {id:'SEC-IAM-01',category:'identity',nameFr:'Authentification serveur indépendante',nameEn:'Independent server authentication',weight:10,critical:true,status:'required',evidence:'Prototype local : identité de production non raccordée.'},
  {id:'SEC-IAM-02',category:'identity',nameFr:'MFA pour rôles sensibles',nameEn:'MFA for privileged roles',weight:6,critical:true,status:'prepared',evidence:'Contrat préparé, fournisseur non raccordé.'},
  {id:'SEC-DATA-01',category:'data',nameFr:'Chiffrement en transit',nameEn:'Encryption in transit',weight:8,critical:true,status:'prepared',evidence:'HTTPS requis au pilote; serveur local non représentatif.'},
  {id:'SEC-DATA-02',category:'data',nameFr:'Chiffrement au repos et gestion de clés',nameEn:'Encryption at rest and key management',weight:10,critical:true,status:'required',evidence:'Le stockage navigateur n’est pas déclaré chiffré.'},
  {id:'SEC-DATA-03',category:'data',nameFr:'Minimisation et consentement',nameEn:'Minimisation and consent',weight:8,critical:true,status:'implemented-synthetic',evidence:'Bloc 28 opérationnel sur données synthétiques.'},
  {id:'SEC-TENANT-01',category:'tenant',nameFr:'Isolation logique par institution',nameEn:'Logical tenant isolation',weight:10,critical:true,status:'implemented-synthetic',evidence:'Namespace et tests de refus inter-tenant.'},
  {id:'SEC-AUDIT-01',category:'audit',nameFr:'Journal d’audit',nameEn:'Audit trail',weight:7,critical:true,status:'implemented-synthetic',evidence:'Journal local versionné; centralisation serveur requise.'},
  {id:'SEC-BACKUP-01',category:'resilience',nameFr:'Sauvegarde et restauration serveur',nameEn:'Server backup and restore',weight:9,critical:true,status:'required',evidence:'Exercice de table uniquement; sauvegarde serveur absente.'},
  {id:'SEC-IR-01',category:'incident',nameFr:'Plan de réponse aux incidents',nameEn:'Incident response plan',weight:7,critical:true,status:'prepared',evidence:'Procédure préparée, exercice réel à conduire.'},
  {id:'SEC-APP-01',category:'application',nameFr:'Tests automatisés des moteurs',nameEn:'Automated engine tests',weight:7,critical:false,status:'implemented-synthetic',evidence:'Suite locale reproductible.'},
  {id:'SEC-APP-02',category:'application',nameFr:'Analyse de dépendances et vulnérabilités',nameEn:'Dependency and vulnerability scanning',weight:6,critical:false,status:'required',evidence:'Pipeline CI/CD sécurité non raccordé.'},
  {id:'SEC-BCP-01',category:'resilience',nameFr:'Continuité et reprise',nameEn:'Business continuity and recovery',weight:6,critical:true,status:'prepared',evidence:'Objectifs RTO/RPO proposés, test réel requis.'},
  {id:'SEC-LOG-01',category:'audit',nameFr:'Centralisation et alertes sécurité',nameEn:'Central security logging and alerts',weight:6,critical:false,status:'required',evidence:'Non disponible dans la environnement local.'}
];
export function validateSecurityGovernancePolicy(p=SECURITY_GOVERNANCE_POLICY){return Boolean(p?.id&&p?.version&&p.minimumPilotScore>=50&&p.minimumProductionScore>p.minimumPilotScore&&p.minimumFairnessCellSize>=10&&Array.isArray(p.requiredModelApprovals));}

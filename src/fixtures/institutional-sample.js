export const DEFAULT_INSTITUTION = Object.freeze({
  id:'INST-PILOT-ML-001',
  name:'Institution financière — environnement synthétique',
  country:'Mali',
  city:'Bamako',
  branches:2,
  creditOfficers:5,
  supervisors:1,
  monthlyCaseVolume:180,
  pilotCaseTarget:200,
  pilotDurationDays:90,
  mode:'observation'
});

export const DEFAULT_CREDIT_PRODUCT = Object.freeze({
  id:'PROD-AGR-001',
  name:'Crédit activité génératrice de revenus',
  currency:'XOF',
  minimumAmount:50000,
  maximumAmount:750000,
  minimumDurationMonths:3,
  maximumDurationMonths:24,
  maximumEffortRatio:35,
  minimumDataConfidence:60,
  humanDecisionRequired:true
});

export const PILOT_SECURITY_CHECKLIST = Object.freeze([
  { id:'access-control', category:'security', labelFr:'Rôles et droits d’accès définis', labelEn:'Roles and access rights defined', completed:true, critical:true },
  { id:'audit-trail', category:'security', labelFr:'Journal d’audit activé', labelEn:'Audit trail enabled', completed:true, critical:true },
  { id:'data-minimization', category:'governance', labelFr:'Données sensibles exclues du scoring', labelEn:'Sensitive data excluded from scoring', completed:true, critical:true },
  { id:'consent', category:'governance', labelFr:'Consentement et finalité documentés', labelEn:'Consent and purpose documented', completed:true, critical:true },
  { id:'backup-restore', category:'security', labelFr:'Procédure de sauvegarde et restauration à valider en pilote', labelEn:'Backup and restore procedure to validate during pilot', completed:false, critical:true },
  { id:'incident-response', category:'security', labelFr:'Plan de réponse aux incidents à signer', labelEn:'Incident response plan to approve', completed:false, critical:true },
  { id:'model-card', category:'model', labelFr:'Fiche modèle INCLUSCORE disponible', labelEn:'INCLUSCORE model card available', completed:true, critical:true },
  { id:'human-override', category:'model', labelFr:'Dérogation et décision humaine tracées', labelEn:'Human override and decision traced', completed:true, critical:true },
  { id:'fairness-review', category:'model', labelFr:'Revue d’équité planifiée sur données réelles', labelEn:'Fairness review planned on real data', completed:false, critical:false },
  { id:'training', category:'operations', labelFr:'Plan de formation des agents préparé', labelEn:'Credit officer training plan prepared', completed:true, critical:false },
  { id:'support', category:'operations', labelFr:'Canal de support pilote défini', labelEn:'Pilot support channel defined', completed:true, critical:false },
  { id:'acceptance', category:'operations', labelFr:'Plan de recette institutionnelle disponible', labelEn:'Institutional acceptance plan available', completed:true, critical:false }
]);

export const PILOT_SAMPLE_CSV = `case_id;applicant_name;sector;requested_amount;manual_decision;manual_amount;manual_analysis_minutes;credipass_recommendation;credipass_amount;credipass_analysis_minutes;incomplete_before;incomplete_after
CP-001;Aïssata Coulibaly;commerce;350000;conditional;350000;74;conditional;350000;18;1;0
CP-002;Mamadou Traoré;agriculture;600000;approve;600000;92;reduced;450000;23;1;0
CP-003;Benkadi Koutiala;cooperative;1500000;conditional;1500000;138;conditional;1500000;31;1;0
CP-004;Fatoumata Diarra;transformation;250000;approve;250000;65;approve;250000;17;0;0
CP-005;Oumar Konaté;transport;500000;approve;500000;81;conditional;420000;21;1;0
CP-006;Bintou Samaké;maraichage;300000;defer;0;96;to-complete;0;20;1;1
CP-007;Seydou Keïta;artisanat;200000;approve;200000;58;approve;200000;16;0;0
CP-008;Mariama Diallo;commerce;450000;conditional;350000;88;reduced;320000;22;1;0
CP-009;Ibrahim Cissé;elevage;700000;defer;0;110;improvement;0;25;1;1
CP-010;Nana Coulibaly;restauration;180000;approve;180000;62;approve;180000;15;0;0`;

export const PILOT_CLIENT_PACK = Object.freeze([
  { id:'product-sheet', file:'docs/PACK_CLIENT_INSTITUTIONNEL/01_FICHE_PRODUIT_CREDIPASS.md', labelFr:'Fiche produit institutionnelle', labelEn:'Institutional product sheet' },
  { id:'pilot-offer', file:'docs/PACK_CLIENT_INSTITUTIONNEL/02_OFFRE_PILOTE_90_JOURS.md', labelFr:'Offre pilote 90 jours', labelEn:'90-day pilot offer' },
  { id:'model-card', file:'docs/PACK_CLIENT_INSTITUTIONNEL/03_FICHE_TECHNIQUE_INCLUSCORE.md', labelFr:'Fiche technique INCLUSCORE', labelEn:'INCLUSCORE model card' },
  { id:'security-pack', file:'docs/PACK_CLIENT_INSTITUTIONNEL/04_DOSSIER_SECURITE_ET_GOUVERNANCE.md', labelFr:'Dossier sécurité et gouvernance', labelEn:'Security and governance pack' },
  { id:'import-template', file:'docs/PACK_CLIENT_INSTITUTIONNEL/05_MODELE_IMPORT_DOSSIERS.csv', labelFr:'Modèle d’import Excel/CSV', labelEn:'Excel/CSV import template' },
  { id:'roi-matrix', file:'docs/PACK_CLIENT_INSTITUTIONNEL/06_MATRICE_ROI_PILOTE.csv', labelFr:'Matrice ROI pilote', labelEn:'Pilot ROI matrix' },
  { id:'discovery', file:'docs/PACK_CLIENT_INSTITUTIONNEL/07_QUESTIONNAIRE_DECOUVERTE_INSTITUTION.md', labelFr:'Questionnaire de découverte', labelEn:'Institution discovery questionnaire' },
  { id:'acceptance-plan', file:'docs/PACK_CLIENT_INSTITUTIONNEL/08_PLAN_DE_RECETTE_PILOTE.md', labelFr:'Plan de recette pilote', labelEn:'Pilot acceptance plan' },
  { id:'interest-letter', file:'docs/PACK_CLIENT_INSTITUTIONNEL/09_MODELE_LETTRE_INTERET.md', labelFr:'Modèle de lettre d’intérêt', labelEn:'Letter of interest template' },
  { id:'success-grid', file:'docs/PACK_CLIENT_INSTITUTIONNEL/10_GRILLE_CRITERES_SUCCES.md', labelFr:'Grille des critères de succès', labelEn:'Success criteria grid' }
]);

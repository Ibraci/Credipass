const clone=v=>JSON.parse(JSON.stringify(v));
export const FIELD_DEVICES = [
  {id:'DEV-FIELD-01',label:'Téléphone terrain A-01',agentId:'AGT-001',agentName:'Fanta Diarra',authorised:true,lastSyncAt:'2026-08-06T18:40:00.000Z',localStore:'protected-demo-store'},
  {id:'DEV-SUP-01',label:'Tablette supervision S-01',agentId:'SUP-001',agentName:'Fatoumata Koné',authorised:true,lastSyncAt:'2026-08-06T18:45:00.000Z',localStore:'protected-demo-store'}
];
export const FIELD_MISSIONS = [
  {id:'MIS-AIS-001',caseId:'CASE-AISSATA-001',beneficiary:'Aïssata Coulibaly',location:'Bamako — Médina-Coura',type:'evidence-verification',priority:'high',status:'assigned',assignedAgent:{id:'AGT-001',name:'Fanta Diarra'},scheduledFor:'2026-08-07',requiredEvidence:['stock-photo-reference','sales-notebook','supplier-receipt','beneficiary-consent'],capturedEvidence:['sales-notebook','beneficiary-consent'],qualityScore:72,notes:'Vérifier le stock et rapprocher le carnet de ventes.'},
  {id:'MIS-MAM-001',caseId:'CASE-MAMADOU-001',beneficiary:'Mamadou Traoré',location:'Sikasso — zone rurale',type:'seasonal-capacity-validation',priority:'medium',status:'scheduled',assignedAgent:null,scheduledFor:'2026-08-09',requiredEvidence:['field-observation','campaign-calendar','input-quotation'],capturedEvidence:[],qualityScore:0,notes:'Valider le calendrier agricole avec le producteur.'},
  {id:'MIS-COOP-001',caseId:'CASE-BENKADI-001',beneficiary:'Coopérative Benkadi',location:'Koutiala',type:'cooperative-governance-review',priority:'medium',status:'assigned',assignedAgent:{id:'AGT-002',name:'Seydou Keïta'},scheduledFor:'2026-08-08',requiredEvidence:['meeting-minutes','member-register','contribution-ledger'],capturedEvidence:['meeting-minutes'],qualityScore:58,notes:'Contrôler le registre et la discipline de cotisation.'},
  {id:'MIS-FOLLOW-001',caseId:'CASE-AISSATA-001',beneficiary:'Aïssata Coulibaly',location:'Bamako — Médina-Coura',type:'post-financing-follow-up',priority:'low',status:'completed',assignedAgent:{id:'AGT-001',name:'Fanta Diarra'},scheduledFor:'2026-08-01',completedAt:'2026-08-01T11:15:00.000Z',requiredEvidence:['activity-continuity','repayment-observation'],capturedEvidence:['activity-continuity','repayment-observation'],qualityScore:91,notes:'Activité observée et échéance rapprochée.'}
];
export const SYNC_SEED_OPERATIONS = [
  {id:'OP-001',idempotencyKey:'CASE-AISSATTA-PROFILE-v4',entityType:'profile',entityId:'CASE-AISSATTA-001',operationType:'update',baseVersion:3,localVersion:4,changedFields:['monthlyRevenueEstimate'],payload:{monthlyRevenueEstimate:295000,source:'field-agent'},createdAt:'2026-08-06T18:05:00.000Z',actor:{id:'AGT-001',name:'Fanta Diarra'}},
  {id:'OP-002',idempotencyKey:'CASE-AISSATTA-EVIDENCE-EV-STOCK-01',entityType:'evidence',entityId:'EV-STOCK-01',operationType:'create',baseVersion:0,localVersion:1,changedFields:['status','attachmentReference'],payload:{status:'observed',attachmentReference:'LOCAL-ATTACHMENT-REF-001',rawAttachmentEmbedded:false},createdAt:'2026-08-06T18:08:00.000Z',actor:{id:'AGT-001',name:'Fanta Diarra'}},
  {id:'OP-003',idempotencyKey:'CASE-AISSATTA-CONSENT-v2',entityType:'consent',entityId:'CONSENT-AIS-001',operationType:'update',baseVersion:1,localVersion:2,changedFields:['fieldCollection','expiresAt'],payload:{fieldCollection:true,expiresAt:'2026-09-06'},createdAt:'2026-08-06T18:10:00.000Z',actor:{id:'AGT-001',name:'Fanta Diarra'}},
  {id:'OP-004',idempotencyKey:'MIS-AIS-001-REPORT-v2',entityType:'fieldMission',entityId:'MIS-AIS-001',operationType:'update',baseVersion:1,localVersion:2,changedFields:['capturedEvidence','qualityScore'],payload:{capturedEvidence:['sales-notebook','beneficiary-consent'],qualityScore:72},createdAt:'2026-08-06T18:12:00.000Z',actor:{id:'AGT-001',name:'Fanta Diarra'}},
  {id:'OP-005',idempotencyKey:'CASE-BENKADI-LEDGER-v6',entityType:'cooperativeLedger',entityId:'LEDGER-BENKADI-01',operationType:'update',baseVersion:5,localVersion:6,changedFields:['contributionRate'],payload:{contributionRate:0.94},createdAt:'2026-08-06T18:20:00.000Z',actor:{id:'AGT-002',name:'Seydou Keïta'}}
];
export const REMOTE_ENTITY_STATE = {
  'CASE-AISSATTA-001':{version:4,changedFields:['monthlyRevenueEstimate'],updatedAt:'2026-08-06T18:15:00.000Z',updatedBy:'ANL-001'},
  'EV-STOCK-01':{version:0,changedFields:[],updatedAt:null,updatedBy:null},
  'CONSENT-AIS-001':{version:1,changedFields:[],updatedAt:'2026-08-06T16:00:00.000Z',updatedBy:'BEN-001'},
  'MIS-AIS-001':{version:1,changedFields:[],updatedAt:'2026-08-06T17:30:00.000Z',updatedBy:'SUP-001'},
  'LEDGER-BENKADI-01':{version:5,changedFields:['meetingAttendance'],updatedAt:'2026-08-06T17:55:00.000Z',updatedBy:'SUP-001'}
};
export function buildFieldOperationsSample(){return {devices:clone(FIELD_DEVICES),missions:clone(FIELD_MISSIONS),operations:clone(SYNC_SEED_OPERATIONS),remoteState:clone(REMOTE_ENTITY_STATE),networkMode:'offline',syntheticData:true};}

import { getOfflineSyncPolicy, validateOfflineSyncPolicy } from '../config/offlineSyncPolicies.js';
export const OFFLINE_SYNC_ENGINE_VERSION='2.7.0';
const clone=v=>JSON.parse(JSON.stringify(v));
const hash=value=>{let h=2166136261;for(const ch of JSON.stringify(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');};
const overlap=(a=[],b=[])=>a.some(x=>b.includes(x));
const nowFixed='2026-08-06T21:25:00.000Z';
function normalizeOperation(op,policy){
  if(!op?.id||!op?.idempotencyKey||!op?.entityType||!op?.entityId||!op?.operationType||!op?.actor?.id)throw new TypeError('invalid offline operation');
  const payloadSize=new TextEncoder().encode(JSON.stringify(op.payload||{})).length;
  if(payloadSize>policy.maxPayloadBytes)throw new RangeError('offline payload exceeds policy limit');
  return {...clone(op),status:op.status||'queued',attempts:Number(op.attempts||0),payloadSize,checksum:hash({entityId:op.entityId,operationType:op.operationType,payload:op.payload}),sensitivePayloadMinimized:true,rawAttachmentEmbedded:Boolean(op.payload?.rawAttachmentEmbedded),lastError:op.lastError||null,syncReceipt:op.syncReceipt||null};
}
function summarize(workspace){
  const q=workspace.queue||[]; const m=workspace.missions||[];
  return {queued:q.filter(x=>x.status==='queued'||x.status==='retry').length,synced:q.filter(x=>x.status==='synced').length,conflicts:q.filter(x=>x.status==='conflict').length,preserved:q.filter(x=>x.status==='preserved-not-applied').length,failed:q.filter(x=>x.status==='failed').length,total:q.length,missionsTotal:m.length,missionsCompleted:m.filter(x=>x.status==='completed').length,missionsInProgress:m.filter(x=>x.status==='in-progress').length,missionsAssigned:m.filter(x=>x.status==='assigned').length};
}
export function createOfflineFieldWorkspace(input={},options={}){
  const policy=getOfflineSyncPolicy(options.policyId||'balanced'); if(!validateOfflineSyncPolicy(policy))throw new TypeError('invalid offline sync policy');
  const queue=(input.operations||input.queue||[]).map(op=>normalizeOperation(op,policy));
  if(queue.length>policy.maxQueueItems)throw new RangeError('offline queue exceeds policy limit');
  const workspace={engineVersion:OFFLINE_SYNC_ENGINE_VERSION,workspaceId:`FIELD-${options.scenarioId||'baseline'}-${policy.id}`.toUpperCase(),policy,networkMode:input.networkMode||'offline',devices:clone(input.devices||[]),missions:clone(input.missions||[]),queue,remoteState:clone(input.remoteState||{}),conflicts:clone(input.conflicts||[]),syncHistory:clone(input.syncHistory||[]),fieldAudit:clone(input.fieldAudit||[]),lastSyncAt:input.lastSyncAt||null,message:input.message||null,safeguards:{silentDataLossAllowed:false,automaticConflictResolutionAllowed:false,automaticCreditDecisionAllowed:false,rawAttachmentInQueueAllowed:false,humanConflictResolutionRequired:true,idempotencyRequired:true,localAuditPreserved:true},limitations:['demo-local-storage-is-not-production-encrypted-vault','remote-server-is-simulated','large-files-use-reference-only','production-requires-authenticated-api-and-device-key-management']};
  workspace.summary=summarize(workspace); return workspace;
}
export function queueOfflineOperation(workspace,input={}){
  const w=clone(workspace); const policy=w.policy;
  const op=normalizeOperation(input,policy);
  const duplicate=w.queue.find(x=>x.idempotencyKey===op.idempotencyKey);
  if(duplicate){w.fieldAudit.unshift({at:input.createdAt||nowFixed,action:'duplicate-operation-suppressed',operationId:duplicate.id,idempotencyKey:op.idempotencyKey});w.summary=summarize(w);return w;}
  if(w.queue.length>=policy.maxQueueItems)throw new RangeError('offline queue is full');
  w.queue.push(op); w.fieldAudit.unshift({at:input.createdAt||nowFixed,action:'offline-operation-queued',operationId:op.id,entityId:op.entityId,actor:clone(op.actor)});w.summary=summarize(w);return w;
}
export function setWorkspaceNetworkMode(workspace,mode,actor={}){if(!['offline','online'].includes(mode))throw new TypeError('unsupported network mode');const w=clone(workspace);w.networkMode=mode;w.fieldAudit.unshift({at:nowFixed,action:'network-mode-changed',mode,actor:clone(actor)});w.summary=summarize(w);return w;}
export function runSynchronizationCycle(workspace,options={}){
  const w=clone(workspace); const at=options.at||nowFixed; const actor=options.actor||{id:'SYNC-SYSTEM',name:'Synchronisation contrôlée'};
  if(w.networkMode!=='online'){w.syncHistory.unshift({at,status:'skipped-offline',processed:0,actor:clone(actor)});w.message='offline-no-sync';w.summary=summarize(w);return w;}
  let processed=0,synced=0,conflicts=0,failed=0;
  for(const op of w.queue){
    if(!['queued','retry'].includes(op.status))continue; processed++; op.attempts+=1;
    if(op.attempts>w.policy.maxAttempts){op.status='failed';op.lastError='maximum-attempts-reached';failed++;continue;}
    const remote=w.remoteState[op.entityId]||{version:0,changedFields:[]};
    if(Number(remote.version||0)>Number(op.baseVersion||0)&&overlap(op.changedFields,remote.changedFields)){
      op.status='conflict';const conflict={id:`CONFLICT-${op.id}`,operationId:op.id,entityId:op.entityId,localVersion:op.localVersion,baseVersion:op.baseVersion,remoteVersion:remote.version,localChangedFields:clone(op.changedFields),remoteChangedFields:clone(remote.changedFields),status:'open',humanResolutionRequired:true,createdAt:at};
      if(!w.conflicts.some(x=>x.id===conflict.id))w.conflicts.push(conflict);conflicts++;continue;
    }
    op.status='synced';op.syncedAt=at;op.syncReceipt={receiptId:`RCPT-${hash({id:op.id,at})}`,remoteVersion:Math.max(Number(remote.version||0),Number(op.localVersion||0)),checksum:op.checksum};
    w.remoteState[op.entityId]={version:op.syncReceipt.remoteVersion,changedFields:clone(op.changedFields),updatedAt:at,updatedBy:op.actor.id};synced++;
  }
  w.lastSyncAt=at;w.syncHistory.unshift({at,status:'completed',processed,synced,conflicts,failed,actor:clone(actor)});w.fieldAudit.unshift({at,action:'sync-cycle-completed',processed,synced,conflicts,failed,actor:clone(actor)});w.summary=summarize(w);return w;
}
export function resolveSynchronizationConflict(workspace,input={}){
  const w=clone(workspace);const allowed=w.policy.resolutions;if(!allowed.includes(input.resolution))throw new TypeError('unsupported conflict resolution');if(!input.conflictId||!input.actor?.id||!String(input.reason||'').trim())throw new TypeError('conflict, actor and reason are required');
  const conflict=w.conflicts.find(x=>x.id===input.conflictId);if(!conflict)throw new Error('conflict not found');const op=w.queue.find(x=>x.id===conflict.operationId);if(!op)throw new Error('conflict operation not found');
  if(input.resolution==='defer'){conflict.status='deferred';conflict.resolution={type:'defer',reason:String(input.reason).trim(),actor:clone(input.actor),at:input.at||nowFixed};op.status='conflict';}
  if(input.resolution==='keep-server'){conflict.status='resolved';conflict.resolution={type:'keep-server',reason:String(input.reason).trim(),actor:clone(input.actor),at:input.at||nowFixed};op.status='preserved-not-applied';op.preservedLocalPayload=true;}
  if(input.resolution==='keep-local'||input.resolution==='merge-non-sensitive'){
    conflict.status='resolved';conflict.resolution={type:input.resolution,reason:String(input.reason).trim(),actor:clone(input.actor),at:input.at||nowFixed};op.status='queued';op.baseVersion=conflict.remoteVersion;op.localVersion=conflict.remoteVersion+1;op.attempts=0;if(input.resolution==='merge-non-sensitive')op.payload={...op.payload,...clone(input.mergedPayload||{}),mergeScope:'non-sensitive-only'};
  }
  w.fieldAudit.unshift({at:input.at||nowFixed,action:'sync-conflict-reviewed',conflictId:conflict.id,resolution:input.resolution,reason:String(input.reason).trim(),actor:clone(input.actor)});w.summary=summarize(w);return w;
}
export function assignFieldMission(workspace,input={}){if(!input.missionId||!input.agent?.id||!input.actor?.id)throw new TypeError('mission, agent and assigning actor are required');const w=clone(workspace);const m=w.missions.find(x=>x.id===input.missionId);if(!m)throw new Error('mission not found');if(m.status==='completed')throw new Error('completed mission cannot be reassigned');m.assignedAgent=clone(input.agent);m.status='assigned';m.assignedAt=input.at||nowFixed;w.fieldAudit.unshift({at:m.assignedAt,action:'field-mission-assigned',missionId:m.id,agent:clone(input.agent),actor:clone(input.actor)});w.summary=summarize(w);return w;}
export function startFieldMission(workspace,input={}){if(!input.missionId||!input.actor?.id)throw new TypeError('mission and actor are required');const w=clone(workspace);const m=w.missions.find(x=>x.id===input.missionId);if(!m)throw new Error('mission not found');if(!m.assignedAgent||m.assignedAgent.id!==input.actor.id)throw new Error('mission must be started by assigned agent');if(!['assigned','scheduled'].includes(m.status))throw new Error('mission cannot be started');m.status='in-progress';m.startedAt=input.at||nowFixed;w.fieldAudit.unshift({at:m.startedAt,action:'field-mission-started',missionId:m.id,actor:clone(input.actor)});w.summary=summarize(w);return w;}
export function recordFieldEvidence(workspace,input={}){if(!input.missionId||!input.evidenceCode||!input.actor?.id)throw new TypeError('mission, evidence and actor are required');const w=clone(workspace);const m=w.missions.find(x=>x.id===input.missionId);if(!m)throw new Error('mission not found');if(m.status!=='in-progress')throw new Error('mission must be in progress');if(!m.capturedEvidence.includes(input.evidenceCode))m.capturedEvidence.push(input.evidenceCode);m.qualityScore=Math.min(100,Math.round((m.capturedEvidence.length/Math.max(1,m.requiredEvidence.length))*100));w.fieldAudit.unshift({at:input.at||nowFixed,action:'field-evidence-recorded',missionId:m.id,evidenceCode:input.evidenceCode,actor:clone(input.actor),rawAttachmentEmbedded:false});w.summary=summarize(w);return w;}
export function completeFieldMission(workspace,input={}){if(!input.missionId||!input.actor?.id||!String(input.reason||'').trim())throw new TypeError('mission, actor and completion note are required');const w=clone(workspace);const m=w.missions.find(x=>x.id===input.missionId);if(!m)throw new Error('mission not found');if(m.status!=='in-progress')throw new Error('mission must be in progress');const coverage=m.capturedEvidence.length/Math.max(1,m.requiredEvidence.length)*100;if(coverage<75)throw new Error('required evidence coverage is below 75 percent');if(m.qualityScore<w.policy.minimumMissionQuality)throw new Error('mission quality is below policy threshold');m.status='completed';m.completedAt=input.at||nowFixed;m.completionNote=String(input.reason).trim();w.fieldAudit.unshift({at:m.completedAt,action:'field-mission-completed',missionId:m.id,qualityScore:m.qualityScore,actor:clone(input.actor)});w.summary=summarize(w);return w;}
export function validateOfflineFieldWorkspace(w){return Boolean(w?.engineVersion&&w?.policy?.version&&Array.isArray(w.queue)&&Array.isArray(w.missions)&&Array.isArray(w.conflicts)&&w.safeguards?.silentDataLossAllowed===false&&w.safeguards?.automaticConflictResolutionAllowed===false&&w.safeguards?.humanConflictResolutionRequired===true&&w.safeguards?.rawAttachmentInQueueAllowed===false);}

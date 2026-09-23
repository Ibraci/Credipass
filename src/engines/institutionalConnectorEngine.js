const ENGINE_VERSION='3.0.0';
const SENSITIVE_OR_FORBIDDEN=new Set(['religion','ethnicity','politicalOpinion','privateMessages','contactGraph','socialMediaBehavior','rawIdentityDocument','rawEvidenceDocument']);

const clone=value=>JSON.parse(JSON.stringify(value));
const stableHash=input=>{
  const text=typeof input==='string'?input:JSON.stringify(input,Object.keys(input||{}).sort());
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return `CPX-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;
};
const consentFor=(consents,connectorId,scope,asOf)=>consents.find(c=>c.connectorId===connectorId&&c.status==='active'&&c.scopes.includes(scope)&&(!c.expiresAt||new Date(c.expiresAt)>=new Date(asOf)));

export function validateConnectorDefinition(connector){
  if(!connector?.id||!connector?.version||!Array.isArray(connector?.scopes)) return false;
  if(connector.liveNetworkEnabled!==false) return false;
  if(!['sandbox','prepared'].includes(connector.mode)) return false;
  return true;
}

export function normalizeInboundBatch(batch,connector,{consents=[],asOf='2026-08-07T09:45:00.000Z'}={}){
  if(!batch||!connector) throw new Error('batch-and-connector-required');
  if(batch.connectorId!==connector.id) throw new Error('connector-mismatch');
  const neededScope=connector.family==='mobile-money'?'transactions.summary.read':batch.records.some(x=>x.type==='repayment')?'repayment.history.read':'savings.history.read';
  if(!consentFor(consents,connector.id,neededScope,asOf)) throw new Error('active-consent-required');
  const seen=new Set();
  const records=[]; const rejected=[];
  for(const item of batch.records||[]){
    const key=`${connector.id}:${item.externalId}`;
    if(seen.has(key)){rejected.push({...item,reason:'duplicate-external-id'});continue;}
    seen.add(key);
    if(!item.externalId||!item.type||!item.date||!Number.isFinite(Number(item.amount))){rejected.push({...item,reason:'invalid-required-fields'});continue;}
    records.push({
      connectorId:connector.id, externalId:String(item.externalId), sourceFamily:connector.family, type:item.type,
      date:item.date, amount:Number(item.amount), currency:item.currency||'XOF', flow:item.flow||null, category:item.category||null,
      status:item.status||'observed', confidence:connector.family==='core-banking'?0.98:0.90,
      idempotencyKey:stableHash({connectorId:connector.id,externalId:item.externalId,type:item.type,date:item.date,amount:Number(item.amount)}),
      rawPayloadStored:false, normalizedBy:`Institutional Connector Engine v${ENGINE_VERSION}`
    });
  }
  return {batchId:batch.id,connectorId:connector.id,contractVersion:batch.contractVersion,records,rejected,summary:{received:(batch.records||[]).length,accepted:records.length,rejected:rejected.length},liveNetworkUsed:false};
}

export function buildOutboundCasePayload(context,{connector,consents=[],asOf='2026-08-07T09:45:00.000Z'}={}){
  if(!connector?.directions?.includes('outbound')) throw new Error('outbound-not-supported');
  for(const scope of ['case.summary.write']) if(!consentFor(consents,connector.id,scope,asOf)) throw new Error('active-consent-required');
  const payload={
    contractVersion:ENGINE_VERSION,
    caseReference:context.recommendation?.referenceId||context.data?.person?.id||'CASE-DEMO',
    subject:{id:context.data?.person?.id||'BEN-001',name:context.data?.person?.name||'Aïssata Traoré',city:context.data?.person?.city||'Bamako'},
    metrics:{
      dataConfidence:Number(context.quality?.confidence||0),
      incluscore:Number(context.incluscore?.score||0),
      financialHealth:Number(context.health?.score||0),
      overIndebtednessRisk:Number(context.debt?.riskScore||context.debt?.overIndebtedness?.riskScore||0),
      proposedPrincipal:Number(context.simulation?.recommended?.principal||context.simulation?.proposedPrincipal||0)
    },
    recommendation:{code:context.recommendation?.recommendationCode||context.recommendation?.code||'review-required',humanDecisionRequired:true},
    humanDecision:context.humanDecision?.status==='communicated'?{status:'communicated',decision:context.humanDecision.decisionCode||context.humanDecision.decision||null,amount:context.humanDecision.amount||null}:null,
    engineVersions:{connector:ENGINE_VERSION,incluscore:context.incluscore?.engineVersion||null,orchestrator:context.recommendation?.engineVersion||null},
    rawDocumentsIncluded:false, generatedAt:asOf
  };
  const serialized=JSON.stringify(payload);
  for(const field of SENSITIVE_OR_FORBIDDEN) if(serialized.includes(field)) throw new Error(`forbidden-field:${field}`);
  return {...payload,correlationId:stableHash({caseReference:payload.caseReference,connectorId:connector.id,asOf:'2026-08-07'}),idempotencyKey:stableHash({connectorId:connector.id,caseReference:payload.caseReference,kind:'case-summary-v1'})};
}

export function createInstitutionalConnectorWorkspace({connectors=[],consents=[],batches=[],context=null}={},options={}){
  const asOf=options.asOf||'2026-08-07T09:45:00.000Z';
  const normalized=[]; const errors=[];
  connectors.forEach(c=>{if(!validateConnectorDefinition(c)) errors.push({connectorId:c?.id||'unknown',reason:'invalid-connector-definition'});});
  for(const batch of batches){
    const connector=connectors.find(c=>c.id===batch.connectorId);
    try{normalized.push(normalizeInboundBatch(batch,connector,{consents,asOf}));}catch(error){errors.push({batchId:batch.id,connectorId:batch.connectorId,reason:error.message});}
  }
  const outboundPreviews=[];
  if(context){
    for(const connector of connectors.filter(c=>c.directions?.includes('outbound'))){
      try{outboundPreviews.push({connectorId:connector.id,payload:buildOutboundCasePayload(context,{connector,consents,asOf}),approvalStatus:'pending-human-approval'});}catch(error){errors.push({connectorId:connector.id,direction:'outbound',reason:error.message});}
    }
  }
  const inboundRecords=normalized.flatMap(x=>x.records);
  return {
    engineVersion:ENGINE_VERSION, workspaceId:stableHash({connectors:connectors.map(x=>x.id),asOf:'2026-08-07'}), asOf,
    connectors:clone(connectors), consents:clone(consents), normalizedBatches:normalized, inboundRecords, outboundPreviews,
    exchangeLog:[], errors,
    summary:{connectorCount:connectors.length,activeConsents:consents.filter(x=>x.status==='active').length,inboundAccepted:inboundRecords.length,inboundRejected:normalized.reduce((s,x)=>s+x.rejected.length,0),outboundPrepared:outboundPreviews.length,liveConnections:connectors.filter(x=>x.liveNetworkEnabled).length},
    safeguards:{liveNetworkEnabled:false,credentialsStored:false,humanApprovalForOutbound:true,consentRequired:true,rawDocumentsTransferred:false,automaticCreditDecisionAllowed:false,silentOverwriteAllowed:false}
  };
}

export function approveOutboundPreview(workspace,{connectorId,actor,reason,at='2026-08-07T09:46:00.000Z'}={}){
  if(!actor?.id) throw new Error('human-actor-required');
  if(String(reason||'').trim().length<8) throw new Error('approval-reason-required');
  const copy=clone(workspace); const target=copy.outboundPreviews.find(x=>x.connectorId===connectorId);
  if(!target) throw new Error('outbound-preview-not-found');
  target.approvalStatus='approved-for-sandbox-exchange'; target.approvedBy={id:actor.id,name:actor.name||null}; target.approvedAt=at; target.approvalReason=String(reason).trim();
  copy.exchangeLog.push({id:stableHash({connectorId,at,kind:'approval'}),connectorId,direction:'outbound',event:'human-approved',at,actorId:actor.id,reason:target.approvalReason});
  return copy;
}

export function simulateInstitutionalExchange(workspace,{connectorId,direction='outbound',actor,at='2026-08-07T09:47:00.000Z'}={}){
  if(!actor?.id) throw new Error('human-actor-required');
  const copy=clone(workspace); const connector=copy.connectors.find(x=>x.id===connectorId);
  if(!connector) throw new Error('connector-not-found');
  if(connector.liveNetworkEnabled) throw new Error('prototype-live-network-forbidden');
  if(direction==='outbound'){
    const target=copy.outboundPreviews.find(x=>x.connectorId===connectorId);
    if(!target||target.approvalStatus!=='approved-for-sandbox-exchange') throw new Error('human-approval-required');
    target.exchangeStatus='sandbox-delivered'; target.exchangedAt=at;
    copy.exchangeLog.push({id:stableHash({connectorId,at,kind:'sandbox-outbound'}),connectorId,direction,event:'sandbox-delivered',at,actorId:actor.id,idempotencyKey:target.payload.idempotencyKey,simulated:true});
  } else {
    copy.exchangeLog.push({id:stableHash({connectorId,at,kind:'sandbox-inbound'}),connectorId,direction,event:'sandbox-inbound-confirmed',at,actorId:actor.id,simulated:true});
  }
  return copy;
}

export function revokeConnectorConsent(workspace,{consentId,actor,at='2026-08-07T09:48:00.000Z'}={}){
  if(!actor?.id) throw new Error('human-actor-required');
  const copy=clone(workspace); const grant=copy.consents.find(x=>x.id===consentId); if(!grant) throw new Error('consent-not-found');
  grant.status='revoked'; grant.revokedAt=at; grant.revokedBy=actor.id;
  copy.exchangeLog.push({id:stableHash({consentId,at}),connectorId:grant.connectorId,event:'consent-revoked',at,actorId:actor.id});
  return copy;
}

export function validateInstitutionalConnectorWorkspace(workspace){
  if(!workspace?.engineVersion||workspace.safeguards?.liveNetworkEnabled!==false) return false;
  if(workspace.safeguards?.humanApprovalForOutbound!==true||workspace.safeguards?.automaticCreditDecisionAllowed!==false) return false;
  if(workspace.connectors.some(c=>c.liveNetworkEnabled!==false)) return false;
  if(workspace.inboundRecords.some(r=>!r.idempotencyKey||r.rawPayloadStored!==false)) return false;
  return true;
}

export { ENGINE_VERSION as INSTITUTIONAL_CONNECTOR_ENGINE_VERSION };

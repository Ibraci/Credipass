export const CONNECTOR_DEFINITIONS = [
  {
    id:'sfd-core-sample', name:'SFD Core Banking — Sandbox', family:'core-banking', mode:'sandbox', version:'3.0.0',
    directions:['inbound','outbound'],
    scopes:['member.profile.read','savings.history.read','credit.history.read','repayment.history.read','case.summary.write'],
    requiredConsentScopes:['member.profile.read','savings.history.read','credit.history.read','repayment.history.read'],
    authentication:'oauth2-client-credentials-prepared', endpoint:'sandbox://sfd-core', liveNetworkEnabled:false,
    dataOwner:'institution', lastSuccessfulExchangeAt:'2026-08-05T15:00:00.000Z'
  },
  {
    id:'mobile-money-demo', name:'Mobile Money — Sandbox consenti', family:'mobile-money', mode:'sandbox', version:'3.0.0',
    directions:['inbound'],
    scopes:['transactions.summary.read'], requiredConsentScopes:['transactions.summary.read'],
    authentication:'tokenized-api-prepared', endpoint:'sandbox://mobile-money', liveNetworkEnabled:false,
    dataOwner:'beneficiary', lastSuccessfulExchangeAt:'2026-08-04T11:30:00.000Z'
  },
  {
    id:'cif-network-demo', name:'Réseau CIF — Contrat d’échange préparé', family:'network', mode:'prepared', version:'3.0.0',
    directions:['outbound'],
    scopes:['case.summary.write','passport.verification.write','decision.status.write'], requiredConsentScopes:['case.summary.write','passport.verification.write'],
    authentication:'mutual-tls-prepared', endpoint:'prepared://cif-network', liveNetworkEnabled:false,
    dataOwner:'institution', lastSuccessfulExchangeAt:null
  }
];

export const CONNECTOR_CONSENTS = [
  { id:'CONS-SFD-001', subjectId:'BEN-001', connectorId:'sfd-core-sample', scopes:['member.profile.read','savings.history.read','credit.history.read','repayment.history.read','case.summary.write'], status:'active', grantedAt:'2026-08-01T08:00:00.000Z', expiresAt:'2026-09-01T08:00:00.000Z', revocable:true },
  { id:'CONS-MM-001', subjectId:'BEN-001', connectorId:'mobile-money-demo', scopes:['transactions.summary.read'], status:'active', grantedAt:'2026-08-01T08:05:00.000Z', expiresAt:'2026-08-15T08:05:00.000Z', revocable:true },
  { id:'CONS-CIF-001', subjectId:'BEN-001', connectorId:'cif-network-demo', scopes:['case.summary.write','passport.verification.write'], status:'active', grantedAt:'2026-08-01T08:10:00.000Z', expiresAt:'2026-09-01T08:10:00.000Z', revocable:true }
];

export const CONNECTOR_BATCHES = [
  {
    id:'BATCH-SFD-001', connectorId:'sfd-core-sample', direction:'inbound', contractVersion:'3.0.0', receivedAt:'2026-08-06T07:30:00.000Z',
    records:[
      { externalId:'SAV-001', type:'savings', date:'2026-05-10', amount:18000, currency:'XOF', status:'posted' },
      { externalId:'SAV-002', type:'savings', date:'2026-06-10', amount:22000, currency:'XOF', status:'posted' },
      { externalId:'SAV-003', type:'savings', date:'2026-07-10', amount:25000, currency:'XOF', status:'posted' },
      { externalId:'REP-001', type:'repayment', date:'2026-05-28', amount:25000, currency:'XOF', status:'paid' },
      { externalId:'REP-002', type:'repayment', date:'2026-06-28', amount:25000, currency:'XOF', status:'paid' },
      { externalId:'REP-003', type:'repayment', date:'2026-07-28', amount:25000, currency:'XOF', status:'paid' }
    ]
  },
  {
    id:'BATCH-MM-001', connectorId:'mobile-money-demo', direction:'inbound', contractVersion:'3.0.0', receivedAt:'2026-08-06T07:35:00.000Z',
    records:[
      { externalId:'MM-001', type:'transaction-summary', date:'2026-07-03', amount:32000, currency:'XOF', flow:'in', category:'customer-payment' },
      { externalId:'MM-002', type:'transaction-summary', date:'2026-07-08', amount:27000, currency:'XOF', flow:'in', category:'customer-payment' },
      { externalId:'MM-003', type:'transaction-summary', date:'2026-07-12', amount:19000, currency:'XOF', flow:'out', category:'supplier-payment' },
      { externalId:'MM-004', type:'transaction-summary', date:'2026-07-18', amount:41000, currency:'XOF', flow:'in', category:'customer-payment' },
      { externalId:'MM-005', type:'transaction-summary', date:'2026-07-24', amount:16000, currency:'XOF', flow:'out', category:'supplier-payment' }
    ]
  }
];

export const CONNECTOR_API_CONTRACT = {
  name:'CREDIPASS CONNECT Contract', version:'3.0.0', protocol:'REST/JSON prepared', currency:'XOF',
  inboundSchemas:['member-profile.v1','savings-history.v1','credit-history.v1','repayment-history.v1','transaction-summary.v1'],
  outboundSchemas:['case-summary.v1','passport-verification.v1','decision-status.v1'],
  requiredHeaders:['X-Credipass-Contract-Version','X-Credipass-Idempotency-Key','X-Credipass-Correlation-Id'],
  forbiddenFields:['religion','ethnicity','politicalOpinion','privateMessages','contactGraph','socialMediaBehavior','rawIdentityDocument','rawEvidenceDocument'],
  safeguards:{ humanApprovalForOutbound:true, consentRequired:true, idempotencyRequired:true, rawDocumentsByDefault:false, liveNetworkInPrototype:false }
};

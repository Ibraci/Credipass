const daysAgo=(date,days)=>{const d=new Date(date);d.setUTCDate(d.getUTCDate()-days);return d.toISOString();};
export function buildDigitalVaultSample(data,{asOf='2026-08-07T10:20:00.000Z'}={}){
  const subjectId=data?.person?.id||'BEN-001';
  const assets=[
    {id:'VAULT-ID-01',subjectId,category:'identity',type:'identity-reference',labelFr:'Référence de pièce d’identité',labelEn:'Identity document reference',createdAt:daysAgo(asOf,120),source:'beneficiary',sensitivity:'restricted',rawDocumentEmbedded:false,metadata:{documentRef:'ID-SAMPLE-001',verifiedStatus:'documented'}},
    {id:'VAULT-SALES-01',subjectId,category:'evidence',type:'sales-evidence',labelFr:'Carnet de ventes — synthèse',labelEn:'Sales notebook — summary',createdAt:daysAgo(asOf,72),source:'financial-evidence-engine',sensitivity:'confidential',rawDocumentEmbedded:false,metadata:{period:'2026-07',evidenceRef:'EV-SALES-JUL'}},
    {id:'VAULT-SAV-01',subjectId,category:'financial',type:'savings-summary',labelFr:'Résumé d’épargne',labelEn:'Savings summary',createdAt:daysAgo(asOf,34),source:'profile-engine',sensitivity:'confidential',rawDocumentEmbedded:false,metadata:{sourceType:'declared-and-documented'}},
    {id:'VAULT-MM-01',subjectId,category:'financial',type:'mobile-money-summary',labelFr:'Résumé Mobile Money consenti',labelEn:'Consented Mobile Money summary',createdAt:daysAgo(asOf,20),source:'institutional-connector-engine',sensitivity:'confidential',rawDocumentEmbedded:false,metadata:{scope:'transactions.summary.read'}},
    {id:'VAULT-CONSENT-01',subjectId,category:'consent',type:'consent-proof',labelFr:'Preuve de consentement',labelEn:'Consent evidence',createdAt:daysAgo(asOf,7),source:'consent-engine',sensitivity:'restricted',rawDocumentEmbedded:false,metadata:{consentRef:'CONSENT-CREDIT-SAMPLE'}},
    {id:'VAULT-PASS-01',subjectId,category:'financial',type:'passport-metadata',labelFr:'Métadonnées du passeport financier',labelEn:'Financial passport metadata',createdAt:daysAgo(asOf,2),source:'financial-passport-engine',sensitivity:'confidential',rawDocumentEmbedded:false,metadata:{passportStatus:'preview'}},
    {id:'VAULT-LEARN-01',subjectId,category:'learning',type:'learning-progress',labelFr:'Progression d’éducation financière',labelEn:'Financial learning progress',createdAt:daysAgo(asOf,1),source:'financial-learning-engine',sensitivity:'internal',rawDocumentEmbedded:false,metadata:{containsScoreImpact:false}},
    {id:'VAULT-OLD-TECH',subjectId,category:'technical',type:'old-device-log',labelFr:'Ancien journal technique',labelEn:'Old technical log',createdAt:daysAgo(asOf,380),source:'device-log',sensitivity:'internal',rawDocumentEmbedded:false,metadata:{device:'SAMPLE-OLD'}}
  ];
  const grants=[
    {id:'CONSENT-CREDIT-SAMPLE',subjectId,recipient:'SFD Partenaire — Exemple',purpose:'credit-assessment',scopes:['identity.minimal','financial.summary','evidence.summary','decision.status'],status:'active',grantedAt:'2026-08-07T09:00:00.000Z',expiresAt:'2026-08-22T09:00:00.000Z',actorId:subjectId,actorName:data?.person?.name||'Aïssata Coulibaly'},
    {id:'CONSENT-LEARN-SAMPLE',subjectId,recipient:'CREDIPASS Learning',purpose:'financial-learning',scopes:['financial.gaps','learning.progress'],status:'active',grantedAt:'2026-08-07T09:05:00.000Z',expiresAt:'2026-08-22T09:05:00.000Z',actorId:subjectId,actorName:data?.person?.name||'Aïssata Coulibaly'}
  ];
  const accessLog=[
    {id:'ACCESS-SEED-001',at:'2026-08-07T09:15:00.000Z',recipient:'SFD Partenaire — Exemple',purpose:'credit-assessment',scopes:['identity.minimal','financial.summary'],decision:'allowed',reason:'active-consent'},
    {id:'ACCESS-SEED-002',at:'2026-08-07T09:16:00.000Z',recipient:'Tiers non autorisé',purpose:'credit-assessment',scopes:['identity.full'],decision:'denied',reason:'scope-not-permitted'}
  ];
  return {subjectId,assets,grants,accessLog,asOf};
}

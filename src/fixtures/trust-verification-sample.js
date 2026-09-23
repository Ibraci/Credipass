const clone=v=>JSON.parse(JSON.stringify(v));
export function buildTrustVerificationContext(data, documents=[]){
  const scenario=data?.scenarioId||'baseline';
  const person=data?.person||{};
  const base={
    asOfDate:'2026-08-06',
    crossCaseDocuments:[
      {caseId:'ARCH-2026-0041',applicantId:person.id,applicantName:person.name,reference:'ID-MALI-SAMPLE-001',documentType:'identityDocument',allowedReuse:true,reason:'same-applicant-prior-case'},
      {caseId:'ARCH-2026-0041',applicantId:person.id,applicantName:person.name,reference:'SUP-2026-0719',documentType:'supplierReceipt',allowedReuse:true,reason:'same-applicant-document-resubmission'}
    ],
    sharedReferences:[
      {referenceId:'REF-AGENT-014',type:'field-agent',caseCount:2,expectedSharedUse:true},
      {referenceId:'REF-COOP-009',type:'cooperative-officer',caseCount:3,expectedSharedUse:true}
    ],
    profileChanges:[
      {field:'requestedAmount',previous:Number(data?.creditRequest?.amount||0),current:Number(data?.creditRequest?.amount||0),changedAt:'2026-08-02',source:'beneficiary'}
    ],
    expectedSharedDocumentTypes:['coopMembership'],
    syntheticData:true
  };
  if(scenario==='conflict'){
    base.crossCaseDocuments.push(
      {caseId:'CASE-OTHER-0088',applicantId:'BEN-OTHER-88',applicantName:'Autre demandeur',reference:'SUP-2026-0719',documentType:'supplierReceipt',allowedReuse:false,reason:'reference-used-by-different-applicant'},
      {caseId:'CASE-OTHER-0092',applicantId:'BEN-OTHER-92',applicantName:'Autre demandeur',reference:'ID-MALI-SAMPLE-001',documentType:'identityDocument',allowedReuse:false,reason:'identity-reference-used-by-different-applicant'}
    );
    base.sharedReferences.push({referenceId:'REF-COMMUNITY-777',type:'community-reference',caseCount:7,expectedSharedUse:false});
    base.profileChanges=[{field:'requestedAmount',previous:200000,current:Number(data?.creditRequest?.amount||350000),changedAt:'2026-08-05',source:'beneficiary'}];
  }
  if(scenario==='debtStress'){
    base.profileChanges.push({field:'activeDebtCount',previous:1,current:(data?.debts||[]).filter(x=>x.active&&x.consented!==false).length,changedAt:'2026-08-04',source:'debt-reconciliation'});
  }
  if(scenario==='highRequest'){
    base.profileChanges=[{field:'requestedAmount',previous:350000,current:Number(data?.creditRequest?.amount||900000),changedAt:'2026-08-05',source:'beneficiary'}];
  }
  if(scenario==='cooperative'){
    base.sharedReferences.push({referenceId:'REF-COOP-BENKADI',type:'cooperative-governance',caseCount:24,expectedSharedUse:true});
  }
  return clone(base);
}

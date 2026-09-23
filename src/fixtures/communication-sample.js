const clone=value=>JSON.parse(JSON.stringify(value));
export const COMMUNICATION_TEMPLATE_CATALOG = Object.freeze({
  DOCUMENTS_MISSING:{
    purpose:'service', audience:'beneficiary', priority:'normal',
    title:{fr:'Dossier à compléter',en:'File needs completion'},
    inApp:{fr:'{name}, {count} élément(s) du dossier nécessitent encore une validation. Consultez la liste détaillée dans CREDIPASS.',en:'{name}, {count} file item(s) still require validation. Review the detailed list in CREDIPASS.'},
    sms:{fr:'CREDIPASS : votre dossier nécessite une mise à jour. Ouvrez l’application ou contactez votre agent. Réf. {reference}.',en:'CREDIPASS: your file needs an update. Open the app or contact your agent. Ref. {reference}.'},
    email:{fr:'Votre dossier CREDIPASS nécessite une mise à jour. Connectez-vous à l’espace sécurisé pour consulter les éléments concernés.',en:'Your CREDIPASS file needs an update. Sign in to the secure area to review the relevant items.'}
  },
  FIELD_MISSION:{
    purpose:'operations', audience:'fieldAgent', priority:'high',
    title:{fr:'Mission terrain à traiter',en:'Field mission to process'},
    inApp:{fr:'Mission {missionId} pour {beneficiary} à {location}. Statut : {status}.',en:'Mission {missionId} for {beneficiary} in {location}. Status: {status}.'},
    sms:{fr:'CREDIPASS : une mission terrain vous attend. Ouvrez l’application pour les détails. Réf. {missionId}.',en:'CREDIPASS: a field mission is waiting. Open the app for details. Ref. {missionId}.'},
    email:{fr:'Une mission terrain vous a été affectée. Les informations sensibles restent disponibles uniquement dans l’application sécurisée.',en:'A field mission has been assigned to you. Sensitive information remains available only in the secure application.'}
  },
  PAYMENT_REMINDER:{
    purpose:'service', audience:'beneficiary', priority:'normal',
    title:{fr:'Rappel d’échéance',en:'Payment reminder'},
    inApp:{fr:'Une échéance est prévue le {date}. Consultez votre calendrier sécurisé et contactez votre institution en cas de difficulté.',en:'A payment is due on {date}. Review your secure schedule and contact your institution if you face difficulty.'},
    sms:{fr:'CREDIPASS : rappel d’échéance le {date}. Consultez votre calendrier sécurisé. Aucun paiement n’est prélevé automatiquement.',en:'CREDIPASS: payment reminder for {date}. Review your secure schedule. No payment is taken automatically.'},
    email:{fr:'Un rappel d’échéance est disponible. Pour votre sécurité, les montants et détails sont consultables uniquement dans votre espace CREDIPASS.',en:'A payment reminder is available. For your security, amounts and details are visible only in your CREDIPASS area.'}
  },
  EARLY_WARNING_CONTACT:{
    purpose:'support', audience:'beneficiary', priority:'high',
    title:{fr:'Accompagnement proposé',en:'Support proposed'},
    inApp:{fr:'CREDIPASS recommande un échange avec votre agent afin d’actualiser votre situation et rechercher une solution adaptée. Aucune sanction automatique n’est appliquée.',en:'CREDIPASS recommends speaking with your agent to update your situation and explore a suitable solution. No automatic penalty is applied.'},
    sms:{fr:'CREDIPASS : votre agent souhaite faire un point avec vous. Ouvrez l’application ou contactez votre institution. Aucun blocage automatique.',en:'CREDIPASS: your agent would like to speak with you. Open the app or contact your institution. No automatic restriction.'},
    email:{fr:'Votre institution propose un échange d’accompagnement. Les motifs détaillés restent dans l’espace sécurisé CREDIPASS.',en:'Your institution is offering a support conversation. Detailed reasons remain in the secure CREDIPASS area.'}
  },
  CONSENT_EXPIRY:{
    purpose:'privacy', audience:'beneficiary', priority:'high',
    title:{fr:'Autorisation de partage bientôt expirée',en:'Sharing permission expires soon'},
    inApp:{fr:'Votre autorisation de partage avec {institution} expire le {date}. Vous pouvez la laisser expirer ou la révoquer immédiatement.',en:'Your sharing permission with {institution} expires on {date}. You may let it expire or revoke it immediately.'},
    sms:{fr:'CREDIPASS : une autorisation de partage arrive à expiration. Consultez vos consentements dans l’application.',en:'CREDIPASS: a sharing permission is about to expire. Review your consents in the app.'},
    email:{fr:'Une autorisation de partage arrive à expiration. Consultez l’historique et les options de révocation dans votre espace sécurisé.',en:'A sharing permission is about to expire. Review history and revocation options in your secure area.'}
  },
  DECISION_AVAILABLE:{
    purpose:'service', audience:'beneficiary', priority:'high',
    title:{fr:'Décision disponible',en:'Decision available'},
    inApp:{fr:'Une décision humaine motivée est disponible dans votre dossier. Consultez les motifs, conditions et voies de recours.',en:'A reasoned human decision is available in your file. Review the reasons, conditions and appeal options.'},
    sms:{fr:'CREDIPASS : une mise à jour de votre dossier est disponible dans l’application sécurisée. Réf. {reference}.',en:'CREDIPASS: an update to your file is available in the secure app. Ref. {reference}.'},
    email:{fr:'Une mise à jour importante de votre dossier est disponible. Pour protéger vos données, la décision n’est pas incluse dans ce courriel.',en:'An important file update is available. To protect your data, the decision is not included in this email.'}
  }
});

export function buildCommunicationRecipients(data, fieldWorkspace={}){
  const agent=fieldWorkspace.missions?.find(x=>x.assignedAgent)?.assignedAgent || {id:'AGT-001',name:'Fatoumata Koné'};
  return clone([
    {id:data.person.id,type:'beneficiary',name:data.person.name,language:'fr',timezone:'UTC',contacts:{phoneMasked:'+223 ** ** 45 67',phoneVerified:true,emailMasked:'a***@example.ml',emailVerified:false},preferences:{inApp:true,sms:true,email:false,serviceConsent:true,supportConsent:true,operationsConsent:false,privacyConsent:true,marketingConsent:false,quietHours:{start:20,end:7}}},
    {id:agent.id,type:'fieldAgent',name:agent.name,language:'fr',timezone:'UTC',contacts:{phoneMasked:'+223 ** ** 12 40',phoneVerified:true,emailMasked:'a***@kabupro.local',emailVerified:true},preferences:{inApp:true,sms:true,email:true,serviceConsent:true,supportConsent:true,operationsConsent:true,privacyConsent:true,marketingConsent:false,quietHours:{start:20,end:7}}},
    {id:'SUP-001',type:'supervisor',name:'Aminata Diallo',language:'fr',timezone:'UTC',contacts:{phoneMasked:'+223 ** ** 90 10',phoneVerified:true,emailMasked:'s***@institution.local',emailVerified:true},preferences:{inApp:true,sms:false,email:true,serviceConsent:true,supportConsent:true,operationsConsent:true,privacyConsent:true,marketingConsent:false,quietHours:{start:20,end:7}}}
  ]);
}

export function buildCommunicationEvents(context={}){
  const events=[]; const data=context.data||{}; const person=data.person||{}; const file=context.financingFile||{}; const monitoring=context.monitoring||{}; const field=context.fieldWorkspace||{};
  const missing=Math.max(0,Number(file.summary?.missing||0)+Number(file.summary?.pendingValidation||0));
  if(missing>0)events.push({id:`EVT-DOC-${person.id}`,templateId:'DOCUMENTS_MISSING',recipientId:person.id,dedupeKey:`DOC-${person.id}-${missing}`,variables:{name:person.name,count:missing,reference:file.fileId||'DOSSIER'},createdAt:'2026-08-06T21:30:00.000Z'});
  const mission=field.missions?.find(x=>['assigned','in-progress','scheduled'].includes(x.status));
  if(mission){const recipientId=mission.assignedAgent?.id||'AGT-001';events.push({id:`EVT-MISSION-${mission.id}`,templateId:'FIELD_MISSION',recipientId,dedupeKey:`MISSION-${mission.id}-${mission.status}`,variables:{missionId:mission.id,beneficiary:mission.beneficiary,location:mission.location,status:mission.status},createdAt:'2026-08-06T21:31:00.000Z'});}
  events.push({id:`EVT-PAY-${person.id}`,templateId:'PAYMENT_REMINDER',recipientId:person.id,dedupeKey:`PAY-${person.id}-2026-08-10`,variables:{date:'10/08/2026'},createdAt:'2026-08-06T21:32:00.000Z'});
  events.push({id:`EVT-PAY-DUP-${person.id}`,templateId:'PAYMENT_REMINDER',recipientId:person.id,dedupeKey:`PAY-${person.id}-2026-08-10`,variables:{date:'10/08/2026'},createdAt:'2026-08-06T21:33:00.000Z'});
  if(monitoring.earlyWarning?.band&&monitoring.earlyWarning.band!=='low')events.push({id:`EVT-SUPPORT-${person.id}`,templateId:'EARLY_WARNING_CONTACT',recipientId:person.id,dedupeKey:`SUPPORT-${person.id}-${monitoring.earlyWarning.band}`,variables:{reference:monitoring.monitoringId||'SUIVI'},createdAt:'2026-08-06T21:34:00.000Z'});
  if(context.passportShareStatus?.active)events.push({id:`EVT-CONSENT-${person.id}`,templateId:'CONSENT_EXPIRY',recipientId:person.id,dedupeKey:`CONSENT-${context.passportShareGrant?.grantId}`,variables:{institution:context.passportShareGrant?.institutionName||'institution autorisée',date:context.passportShareGrant?.expiresAt?.slice(0,10)||'—'},createdAt:'2026-08-06T21:35:00.000Z'});
  if(context.workflow?.currentStage==='decision-communicated')events.push({id:`EVT-DECISION-${person.id}`,templateId:'DECISION_AVAILABLE',recipientId:person.id,dedupeKey:`DECISION-${context.humanDecision?.decisionId||context.workflow.caseId}`,variables:{reference:context.workflow.caseId},createdAt:'2026-08-06T21:36:00.000Z'});
  return clone(events);
}

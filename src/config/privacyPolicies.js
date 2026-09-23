export const PRIVACY_POLICIES = {
  balanced: {
    id:'balanced', version:'3.2.0',
    maxConsentDays:30,
    retentionReviewLeadDays:30,
    purposeScopes:{
      'credit-assessment':['identity.minimal','financial.summary','evidence.summary','decision.status'],
      'passport-verification':['identity.minimal','financial.summary','decision.status'],
      'portfolio-monitoring':['financial.summary','decision.status'],
      'financial-learning':['financial.gaps','learning.progress'],
      'support':['technical.logs','identity.contact-minimal']
    },
    retentionDays:{ identity:3650, evidence:1825, financial:1825, decision:3650, consent:3650, learning:730, technical:365 },
    sensitiveScopes:['identity.full','raw.documents','private.messages','contacts.graph','social.behaviour'],
    forbiddenScoringCategories:['ethnicity','religion','political-opinion','private-messages','contact-graph','social-media-behaviour','unconsented-third-party-data']
  },
  prudent: {
    id:'prudent', version:'3.2.0', maxConsentDays:15, retentionReviewLeadDays:45,
    purposeScopes:{
      'credit-assessment':['identity.minimal','financial.summary','evidence.summary','decision.status'],
      'passport-verification':['identity.minimal','financial.summary','decision.status'],
      'portfolio-monitoring':['financial.summary','decision.status'],
      'financial-learning':['financial.gaps','learning.progress'],
      'support':['technical.logs']
    },
    retentionDays:{ identity:3650, evidence:1460, financial:1460, decision:3650, consent:3650, learning:365, technical:180 },
    sensitiveScopes:['identity.full','raw.documents','private.messages','contacts.graph','social.behaviour'],
    forbiddenScoringCategories:['ethnicity','religion','political-opinion','private-messages','contact-graph','social-media-behaviour','unconsented-third-party-data']
  },
  inclusivePilot: {
    id:'inclusivePilot', version:'3.2.0', maxConsentDays:30, retentionReviewLeadDays:30,
    purposeScopes:{
      'credit-assessment':['identity.minimal','financial.summary','evidence.summary','decision.status'],
      'passport-verification':['identity.minimal','financial.summary','decision.status'],
      'portfolio-monitoring':['financial.summary','decision.status'],
      'financial-learning':['financial.gaps','learning.progress'],
      'support':['technical.logs','identity.contact-minimal']
    },
    retentionDays:{ identity:3650, evidence:1825, financial:1825, decision:3650, consent:3650, learning:730, technical:365 },
    sensitiveScopes:['identity.full','raw.documents','private.messages','contacts.graph','social.behaviour'],
    forbiddenScoringCategories:['ethnicity','religion','political-opinion','private-messages','contact-graph','social-media-behaviour','unconsented-third-party-data']
  }
};
export function validatePrivacyPolicy(policy){
  if(!policy?.id||!policy?.version||!Number.isFinite(policy.maxConsentDays)||policy.maxConsentDays<1)return false;
  if(!policy.purposeScopes||!policy.retentionDays)return false;
  if(!Object.values(policy.purposeScopes).every(x=>Array.isArray(x)&&x.length))return false;
  if(!Object.values(policy.retentionDays).every(x=>Number.isFinite(x)&&x>0))return false;
  return Array.isArray(policy.forbiddenScoringCategories)&&policy.forbiddenScoringCategories.length>=5;
}

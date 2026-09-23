export const COUNTRY_TEMPLATES=[
  {countryCode:'ML',countryFr:'Mali',countryEn:'Mali',currency:'XOF',defaultLanguage:'fr',timeZone:'Africa/Bamako',regulatoryStatus:'to-validate-with-local-counsel'},
  {countryCode:'BF',countryFr:'Burkina Faso',countryEn:'Burkina Faso',currency:'XOF',defaultLanguage:'fr',timeZone:'Africa/Ouagadougou',regulatoryStatus:'to-validate-with-local-counsel'},
  {countryCode:'TG',countryFr:'Togo',countryEn:'Togo',currency:'XOF',defaultLanguage:'fr',timeZone:'Africa/Lome',regulatoryStatus:'to-validate-with-local-counsel'},
  {countryCode:'BJ',countryFr:'Bénin',countryEn:'Benin',currency:'XOF',defaultLanguage:'fr',timeZone:'Africa/Porto-Novo',regulatoryStatus:'to-validate-with-local-counsel'},
  {countryCode:'SN',countryFr:'Sénégal',countryEn:'Senegal',currency:'XOF',defaultLanguage:'fr',timeZone:'Africa/Dakar',regulatoryStatus:'to-validate-with-local-counsel'}
];
export const TENANT_SAMPLE=[
  {tenantId:'TENANT-ML-SAMPLE',name:'SFD Exemple Mali',countryCode:'ML',namespace:'tenant/ml-demo',policyId:'balanced',status:'synthetic',dataResidency:'to-be-agreed'},
  {tenantId:'TENANT-BF-SAMPLE',name:'SFD Exemple Burkina',countryCode:'BF',namespace:'tenant/bf-demo',policyId:'prudent',status:'synthetic',dataResidency:'to-be-agreed'},
  {tenantId:'TENANT-TG-SAMPLE',name:'SFD Exemple Togo',countryCode:'TG',namespace:'tenant/tg-demo',policyId:'balanced',status:'synthetic',dataResidency:'to-be-agreed'},
  {tenantId:'TENANT-BJ-SAMPLE',name:'SFD Exemple Bénin',countryCode:'BJ',namespace:'tenant/bj-demo',policyId:'inclusionPolicy',status:'synthetic',dataResidency:'to-be-agreed'},
  {tenantId:'TENANT-SN-SAMPLE',name:'SFD Exemple Sénégal',countryCode:'SN',namespace:'tenant/sn-demo',policyId:'balanced',status:'synthetic',dataResidency:'to-be-agreed'}
];
export const REGIONAL_ENVIRONMENTS=[
  {id:'demo',status:'available',purpose:'synthetic demonstration',dataClass:'synthetic-only'},
  {id:'pilot',status:'conditional',purpose:'limited institution pilot',dataClass:'controlled-real-data-after-security-gates'},
  {id:'production',status:'blocked',purpose:'regional production',dataClass:'real-data',reason:'security-model-governance-and-legal-gates-open'}
];

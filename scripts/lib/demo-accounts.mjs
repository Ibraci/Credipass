export const DEMO_ACCOUNTS=[
  {login:'gerant',role:'GERANT',name:'Gérant',agency:'Agence principale',scopeMode:'AGENCY',password:'Gerant@2026',envKey:'CREDIPASS_PASSWORD_GERANT'},
  {login:'agent.credit',role:'AGENT_CREDIT',name:'Agent de crédit',agency:'Agence principale',scopeMode:'OWN',password:'Agent@2026',envKey:'CREDIPASS_PASSWORD_AGENT_CREDIT'},
  {login:'analyste.credit',role:'ANALYSTE_RESPONSABLE_CREDIT',name:'Analyste / Responsable crédit',agency:'Agence principale',scopeMode:'AGENCY',password:'Analyse@2026',envKey:'CREDIPASS_PASSWORD_ANALYSTE_CREDIT'},
  {login:'conformite',role:'CONFORMITE',name:'Conformité / Contrôle / Risques',agency:'Contrôle',scopeMode:'GLOBAL',password:'Conformite@2026',envKey:'CREDIPASS_PASSWORD_CONFORMITE'},
  {login:'comite.credit',role:'COMITE_CREDIT',name:'Comité de crédit',agency:'Comité',scopeMode:'GLOBAL',password:'Comite@2026',envKey:'CREDIPASS_PASSWORD_COMITE_CREDIT'},
  {login:'direction',role:'DIRECTION',name:'Direction',agency:'Direction',scopeMode:'GLOBAL',password:'Direction@2026',envKey:'CREDIPASS_PASSWORD_DIRECTION'},
  {login:'auditeur',role:'AUDITEUR',name:'Auditeur',agency:'Audit',scopeMode:'GLOBAL',password:'Audit@2026',envKey:'CREDIPASS_PASSWORD_AUDITEUR'},
  {login:'admin.systeme',role:'ADMIN_SYSTEME',name:'Administrateur Système',agency:'Administration',scopeMode:'GLOBAL',password:'Admin@2026',envKey:'CREDIPASS_PASSWORD_ADMIN_SYSTEME'},
  {login:'caisse',role:'CAISSE_COMPTABILITE',name:'Caisse / Comptabilité',agency:'Agence principale',scopeMode:'AGENCY',password:'Caisse@2026',envKey:'CREDIPASS_PASSWORD_CAISSE'},
  {login:'suivi.credit',role:'SUIVI_RECOUVREMENT',name:'Suivi / Recouvrement',agency:'Agence principale',scopeMode:'AGENCY',password:'Suivi@2026',envKey:'CREDIPASS_PASSWORD_SUIVI_CREDIT'}
];

export function demoPasswordFor(account,{allowCommon=true}={}){
  const specific=String(process.env[account.envKey]||'').trim();
  if(specific)return specific;
  const common=allowCommon?String(process.env.CREDIPASS_DEMO_PASSWORD||'').trim():'';
  return common||account.password;
}

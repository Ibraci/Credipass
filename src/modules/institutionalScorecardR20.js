const num=v=>Number(v)||0;
const iso=()=>new Date().toISOString();
export const INSTITUTIONAL_SCORECARD_SECTIONS=Object.freeze([
  Object.freeze({code:'ENTREPRISE',label:"I. Note sur l'entreprise",max:45,criteria:Object.freeze([
    {code:'ENT_AGE',label:"Ancienneté de l'entreprise",index:"Est-ce que l'entreprise a plus de cinq ans d'âge ?",max:2},
    {code:'ENT_FORMAL',label:"Degré de formalisation de l'entreprise",index:"Degré de formalisation de l'entreprise",max:2},
    {code:'ENT_RH',label:'Qualité des ressources humaines',index:'Niveau de formation des ressources humaines',max:4},
    {code:'ENT_RENT',label:"Rentabilité (Résultat net de l'entrepreneur)",index:'Chiffrer le niveau de rentabilité des activités',max:10},
    {code:'ENT_CA',label:"Progression du chiffre d'affaires des 3 dernières années",index:"Chiffrer l'évolution du chiffre d'affaires sur les 3 derniers exercices",max:4},
    {code:'ENT_CLIENTS',label:'Portefeuille clientèle (nombre de clients et qualité)',index:'Diversification des débouchés commerciaux',max:2},
    {code:'ENT_SOLV_CLIENTS',label:'Solvabilité des clients',index:'Qualité du portefeuille clients',max:2},
    {code:'ENT_DOCS',label:'Tenue des documents comptables et réglementaires',index:"Existence et qualité de l'archivage de la documentation",max:2},
    {code:'ENT_EMPLACEMENT',label:"Qualité de l'emplacement",index:"Conditions d'exercice des activités",max:4},
    {code:'ENT_EQUIPEMENTS',label:'Qualité des équipements',index:'Existence et qualité de la maintenance des équipements',max:3},
    {code:'ENT_STOCKS',label:'Gestion des stocks',index:'Qualité et suivi des stocks',max:4},
    {code:'ENT_DELAI_CLIENTS',label:'Délais moyens de règlements clients',index:'En nombre de jours',max:2},
    {code:'ENT_DELAI_FOURN',label:'Délais moyens fournisseurs (qualité)',index:'En nombre de jours',max:2},
    {code:'ENT_ENDETTEMENT',label:"Niveau d'endettement (dettes / actif)",index:'Chiffrer le rapport Dettes / Actif',max:2}
  ])}),
  Object.freeze({code:'EMPRUNTEUR',label:"II. Note sur l'emprunteur",max:12,criteria:Object.freeze([
    {code:'EMP_MORALITE',label:"Moralité de l'emprunteur",index:"Renommée de l'emprunteur dans son milieu social et professionnel",max:3},
    {code:'EMP_EXPERIENCE',label:"Expérience professionnelle dans le secteur d'activité",index:"Est-ce que cette expérience est adaptée au secteur d'activité ?",max:3},
    {code:'EMP_ETUDE',label:"Niveau d'étude",index:'Mode acquisition de cette compétence / Niveau de formation',max:2},
    {code:'EMP_MOTIVATION',label:"Motivation pour mener l'activité",index:'État du projet professionnel et cohérence des réalisations',max:1},
    {code:'EMP_RELEVE',label:'Succession & relève',index:"Comment assure-t-il la pérennité de l'entreprise ?",max:1},
    {code:'EMP_MANAGEMENT',label:'Qualité du management',index:"Tempérament de leader et capacité à entraîner l'équipe",max:2}
  ])}),
  Object.freeze({code:'MARCHE',label:'III. Note sur le marché',max:8,criteria:Object.freeze([
    {code:'MAR_STABILITE',label:'Degré de stabilité du secteur',index:'Sensibilité du marché aux fluctuations économiques',max:3},
    {code:'MAR_DIVERSIFICATION',label:'Diversification des produits & services',index:'Étendue de la gamme de produits & services',max:3},
    {code:'MAR_PART',label:'Part de marché',index:'Positionnement dans le marché',max:2}
  ])}),
  Object.freeze({code:'HISTORIQUE',label:'IV. Note sur historique du compte et antécédents de remboursement',max:20,criteria:Object.freeze([
    {code:'HIS_RELATION',label:"Ancienneté de la relation (date d'ouverture du compte)",index:'Voir relevés',max:2},
    {code:'HIS_CREDITS',label:'Antécédents de crédits',index:"Existence de retards éventuels dépassant le mois",max:6},
    {code:'HIS_DEPOT_MONTANT',label:'Montant total dépôt des 06 derniers mois',index:'Voir relevés',max:2},
    {code:'HIS_DEPOT_NOMBRE',label:'Nombre total dépôt des 06 derniers mois',index:'Voir relevés',max:2},
    {code:'HIS_DEPOT_SOLDE',label:'Solde moyen dépôt des 06 derniers mois',index:'Voir relevés',max:2},
    {code:'HIS_DAV',label:'Solde du compte DAV',index:'Voir relevés',max:3},
    {code:'HIS_DAT',label:'Solde du compte DAT',index:'Voir relevés',max:3}
  ])}),
  Object.freeze({code:'GARANTIE',label:'V. Note sur la garantie et la caution',max:15,criteria:Object.freeze([
    {code:'GAR_COUVERTURE',label:'Niveau de couverture de la garantie matérielle',index:'Est-ce que la garantie couvre le prêt à 150 % ?',max:7},
    {code:'GAR_TITRE',label:'Qualité du titre de propriété de la garantie',index:"Garantie immobilière (titre foncier, permis d'occuper, lettre d'attribution) ou garantie matérielle (facture d'achat)",max:3},
    {code:'GAR_FORMALISATION',label:'Degré de formalisation des garanties matérielles',index:'Acte sous seing privé ou acte notarié',max:3},
    {code:'GAR_CAUTION',label:"Caution d'une personne",index:'Solvabilité et patrimoine de la caution',max:2}
  ])})
]);
export const INSTITUTIONAL_SCORECARD_MAX=INSTITUTIONAL_SCORECARD_SECTIONS.reduce((s,x)=>s+x.max,0);
export const INSTITUTIONAL_SCORECARD_THRESHOLD=70;
export function scorecardTemplate(applicationId){return {applicationId,version:'CIF-SFD-100-V1',threshold:INSTITUTIONAL_SCORECARD_THRESHOLD,criteria:{},notes:{},updatedAt:iso()}}
export function ensureInstitutionalScorecards(state){state.institutionalScorecards??=[];return state.institutionalScorecards}
export function scorecardFor(state,applicationId){ensureInstitutionalScorecards(state);let card=state.institutionalScorecards.find(x=>x.applicationId===applicationId);if(!card){card=scorecardTemplate(applicationId);state.institutionalScorecards.push(card)}card.criteria??={};card.notes??={};return card}
export function criterionByCode(code){for(const section of INSTITUTIONAL_SCORECARD_SECTIONS){const criterion=section.criteria.find(x=>x.code===code);if(criterion)return {...criterion,sectionCode:section.code,sectionLabel:section.label}}return null}
export function setInstitutionalScore(state,applicationId,criterionCode,score,note='',actor='Utilisateur'){const c=criterionByCode(criterionCode);if(!c)throw Error('Critère de scoring institutionnel inconnu');const card=scorecardFor(state,applicationId),value=Math.max(0,Math.min(c.max,num(score)));card.criteria[criterionCode]={score:value,note:String(note||''),actor,updatedAt:iso()};card.updatedAt=iso();return institutionalScoreSummary(state,applicationId)}
export function institutionalScoreSummary(state,applicationId){const card=scorecardFor(state,applicationId);const sections=INSTITUTIONAL_SCORECARD_SECTIONS.map(section=>{const rows=section.criteria.map(c=>{const v=card.criteria[c.code]||{};return {...c,score:num(v.score),note:v.note||'',actor:v.actor||'',updatedAt:v.updatedAt||null,filled:Object.prototype.hasOwnProperty.call(card.criteria,c.code)}});const score=rows.reduce((s,x)=>s+x.score,0),filled=rows.filter(x=>x.filled).length;return {code:section.code,label:section.label,max:section.max,score,filled,total:rows.length,criteria:rows}});const score=sections.reduce((s,x)=>s+x.score,0),filled=sections.reduce((s,x)=>s+x.filled,0),total=sections.reduce((s,x)=>s+x.total,0),complete=filled===total;return {applicationId,version:card.version||'CIF-SFD-100-V1',threshold:num(card.threshold)||INSTITUTIONAL_SCORECARD_THRESHOLD,score,max:INSTITUTIONAL_SCORECARD_MAX,complete,filled,total,eligible:complete&&score>=INSTITUTIONAL_SCORECARD_THRESHOLD,status:!complete?'À COMPLÉTER':score>=INSTITUTIONAL_SCORECARD_THRESHOLD?'CONFORME':'REJET SELON GRILLE',sections}}
export function seedDemoInstitutionalScore(state,applicationId,profile='STANDARD',actor='Démonstration'){const card=scorecardFor(state,applicationId);if(Object.keys(card.criteria||{}).length)return institutionalScoreSummary(state,applicationId);const penalty=profile==='FAIBLE'?0.55:profile==='VIGILANCE'?0.72:0.84;for(const section of INSTITUTIONAL_SCORECARD_SECTIONS)for(const c of section.criteria){const raw=Math.max(0,Math.min(c.max,Math.round(c.max*penalty)));card.criteria[c.code]={score:raw,note:'Donnée synthétique de démonstration — à remplacer par l’évaluation institutionnelle.',actor,updatedAt:iso()}}card.updatedAt=iso();return institutionalScoreSummary(state,applicationId)}

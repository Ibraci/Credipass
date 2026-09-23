export const FINANCIAL_PRODUCTS = [
  {
    id:'SAMPLE-WORKING-CAPITAL', institution:'SFD Exemple Sahel', version:'2026.09-sample',
    nameFr:'Crédit fonds de roulement progressif', nameEn:'Progressive working-capital loan',
    audience:['individual'], sectors:['grainTrade','cooperativeTrade','services','artisanat'], purposes:['workingCapital'],
    minAmount:100000, maxAmount:800000, minDurationMonths:6, maxDurationMonths:18,
    nominalAnnualRate:0.16, originationFeeRate:0.01, insuranceRate:0.005,
    scheduleTypes:['standard','progressive'], seasonalSupport:false, maxGraceMonths:1,
    gates:{ minDataConfidence:65, minIncluscore:58, minFinancialHealth:58, maxOverIndebtednessRisk:55, minCoopScore:null },
    featuresFr:['Décaissement progressif possible','Échéancier standard ou progressif','Suivi post-financement recommandé'],
    featuresEn:['Progressive disbursement available','Standard or progressive schedule','Post-financing monitoring recommended'],
    disclaimerFr:'Produit entièrement synthétique destiné à la démonstration CREDIPASS.',
    disclaimerEn:'Fully synthetic product used only for the CREDIPASS demonstration.'
  },
  {
    id:'SAMPLE-STARTER', institution:'SFD Exemple Inclusion', version:'2026.09-sample',
    nameFr:'Microcrédit premier palier accompagné', nameEn:'Supported entry-level microcredit',
    audience:['individual'], sectors:['grainTrade','rainfedAgriculture','services','artisanat'], purposes:['workingCapital','agriculturalInputs'],
    minAmount:50000, maxAmount:300000, minDurationMonths:6, maxDurationMonths:15,
    nominalAnnualRate:0.14, originationFeeRate:0.008, insuranceRate:0.004,
    scheduleTypes:['standard','progressive','seasonal'], seasonalSupport:true, maxGraceMonths:2,
    gates:{ minDataConfidence:55, minIncluscore:48, minFinancialHealth:50, maxOverIndebtednessRisk:60, minCoopScore:null },
    featuresFr:['Montant volontairement plafonné','Parcours d’éducation financière associé','Réévaluation possible après progression'],
    featuresEn:['Deliberately capped amount','Financial-learning path included','Reassessment possible after progression'],
    disclaimerFr:'Produit entièrement synthétique destiné à la démonstration CREDIPASS.',
    disclaimerEn:'Fully synthetic product used only for the CREDIPASS demonstration.'
  },
  {
    id:'SAMPLE-AGRI-SEASONAL', institution:'SFD Exemple Rural', version:'2026.09-sample',
    nameFr:'Crédit intrants agricole saisonnier', nameEn:'Seasonal agricultural input loan',
    audience:['individual'], sectors:['rainfedAgriculture'], purposes:['agriculturalInputs'],
    minAmount:150000, maxAmount:1200000, minDurationMonths:9, maxDurationMonths:24,
    nominalAnnualRate:0.13, originationFeeRate:0.01, insuranceRate:0.006,
    scheduleTypes:['seasonal'], seasonalSupport:true, maxGraceMonths:4,
    gates:{ minDataConfidence:62, minIncluscore:55, minFinancialHealth:55, maxOverIndebtednessRisk:55, minCoopScore:null },
    featuresFr:['Différé lié au cycle agricole','Échéances saisonnières','Stress test de campagne obligatoire'],
    featuresEn:['Grace period aligned with crop cycle','Seasonal repayments','Mandatory campaign stress test'],
    disclaimerFr:'Produit entièrement synthétique destiné à la démonstration CREDIPASS.',
    disclaimerEn:'Fully synthetic product used only for the CREDIPASS demonstration.'
  },
  {
    id:'SAMPLE-SAVINGS-BACKED', institution:'SFD Exemple Épargne', version:'2026.09-sample',
    nameFr:'Crédit adossé à une discipline d’épargne', nameEn:'Savings-discipline backed loan',
    audience:['individual'], sectors:['grainTrade','rainfedAgriculture','services','artisanat'], purposes:['workingCapital','equipment'],
    minAmount:100000, maxAmount:500000, minDurationMonths:6, maxDurationMonths:18,
    nominalAnnualRate:0.12, originationFeeRate:0.006, insuranceRate:0.004,
    scheduleTypes:['standard','progressive'], seasonalSupport:false, maxGraceMonths:1,
    gates:{ minDataConfidence:70, minIncluscore:60, minFinancialHealth:62, maxOverIndebtednessRisk:45, minSavingsCoverage:0.35, minCoopScore:null },
    featuresFr:['Valorise une épargne réellement vérifiée','Coût illustratif réduit','Suivi du coussin de sécurité'],
    featuresEn:['Values genuinely verified savings','Lower illustrative cost','Safety-buffer monitoring'],
    disclaimerFr:'Produit entièrement synthétique destiné à la démonstration CREDIPASS.',
    disclaimerEn:'Fully synthetic product used only for the CREDIPASS demonstration.'
  },
  {
    id:'SAMPLE-COOP-EQUIPMENT', institution:'Réseau Coopératif — Exemple', version:'2026.09-sample',
    nameFr:'Financement équipement collectif', nameEn:'Collective equipment financing',
    audience:['cooperative'], sectors:['cooperativeTrade','grainTrade'], purposes:['equipment'],
    minAmount:500000, maxAmount:5000000, minDurationMonths:12, maxDurationMonths:36,
    nominalAnnualRate:0.11, originationFeeRate:0.008, insuranceRate:0.004,
    scheduleTypes:['standard','seasonal'], seasonalSupport:true, maxGraceMonths:3,
    gates:{ minDataConfidence:70, minIncluscore:0, minFinancialHealth:55, maxOverIndebtednessRisk:55, minCoopScore:65 },
    featuresFr:['Décaissement par tranches','Consentement individuel pour toute responsabilité','Contrôle d’usage des fonds'],
    featuresEn:['Tranche-based disbursement','Individual consent for any liability','Use-of-funds verification'],
    disclaimerFr:'Produit entièrement synthétique destiné à la démonstration CREDIPASS.',
    disclaimerEn:'Fully synthetic product used only for the CREDIPASS demonstration.'
  },
  {
    id:'SAMPLE-DIGITAL-SHORT', institution:'Fintech — Exemple', version:'2026.09-sample',
    nameFr:'Microcrédit numérique court terme', nameEn:'Short-term digital microcredit',
    audience:['individual'], sectors:['grainTrade','services','artisanat'], purposes:['workingCapital'],
    minAmount:25000, maxAmount:200000, minDurationMonths:1, maxDurationMonths:4,
    nominalAnnualRate:0.28, originationFeeRate:0.025, insuranceRate:0,
    scheduleTypes:['standard'], seasonalSupport:false, maxGraceMonths:0,
    gates:{ minDataConfidence:75, minIncluscore:65, minFinancialHealth:68, maxOverIndebtednessRisk:35, minCoopScore:null },
    featuresFr:['Décaissement rapide en environnement connecté','Durée courte','Coût illustratif plus élevé'],
    featuresEn:['Fast disbursement in connected environments','Short term','Higher illustrative cost'],
    disclaimerFr:'Produit entièrement synthétique destiné à démontrer qu’un produit disponible peut rester déconseillé.',
    disclaimerEn:'Fully synthetic product used to demonstrate that an available product may still be discouraged.'
  }
];

export const PRODUCT_CATALOG_META = {
  catalogId:'CREDIPASS-SAMPLE-CATALOG-2026-09',
  version:'3.1.0',
  synthetic:true,
  currency:'XOF',
  generatedFor:'Jeu de données synthétique CREDIPASS — tests et présentation',
  prohibitedMatchingFields:['sex','gender','ethnicity','religion','politicalOpinion','privateMessages','contactGraph','socialMediaBehavior']
};

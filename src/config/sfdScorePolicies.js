// Politique de score SFD — critères repris des documents terrain de l'institution :
// fiche « Analyse de demande de prêt », formulaire « Demande de crédit aux salariés »,
// formulaire « Demande de crédit PME ». Paramètres institutionnels versionnés, modifiables.
export const SFD_SCORE_POLICY_VERSION = 'SFD-SCORE-1.0.0';

// Courbes : points [valeur, score 0-100], interpolation linéaire.
export const SFD_SCORE_CURVES = Object.freeze({
  // Fiche d'analyse : ratio de couverture dette = montant disponible / échéance, norme ≥ 200 %.
  debtCoverage: [[0, 0], [1, 25], [1.5, 50], [2, 75], [3, 100]],
  // Formulaire salarié : la quotité cessible doit être supérieure au remboursement mensuel.
  // Prêter jusqu'à la quotité est la norme du produit : sous 100 % → 0, juste au-dessus → acceptable.
  quotaCoverage: [[0, 0], [0.999, 0], [1, 70], [1.25, 85], [1.5, 100]],
  // (dettes existantes + nouvelle échéance) / revenu mensuel.
  debtToIncome: [[0, 100], [0.33, 85], [0.4, 65], [0.5, 35], [0.6, 0]],
  membershipMonths: [[0, 20], [12, 60], [36, 100]],
  // Fiche d'analyse : dépôt de garantie de 10 % du montant du prêt.
  dgaRatio: [[0, 0], [0.1, 80], [0.2, 100]],
  balanceToInstallment: [[0, 0], [1, 50], [3, 100]],
  davDepositsSixMonths: [[0, 0], [3, 50], [6, 100]],
  activityAgeMonths: [[0, 10], [12, 50], [36, 85], [60, 100]],
  seniorityMonths: [[0, 20], [12, 50], [36, 80], [60, 100]],
  addressYears: [[0, 20], [1, 50], [3, 80], [5, 100]],
  // Flux de trésorerie : écart-type / moyenne des encaissements mensuels (activité saisonnière = plus forte volatilité).
  inflowVolatility: [[0, 100], [15, 85], [30, 60], [50, 30], [80, 0]],
  // Formulaire PME : total des garanties supérieur au montant du prêt autorisé.
  guaranteeCoverage: [[0, 0], [0.5, 40], [1, 80], [1.5, 100]],
  // Fiche d'analyse : ratio de solvabilité = crédit / fonds propres, norme ≤ 50 %.
  creditToEquity: [[0, 100], [0.5, 80], [1, 50], [2, 15], [3, 0]],
  personalContribution: [[0, 20], [0.1, 60], [0.25, 90], [0.4, 100]]
});

export const SFD_SCORE_AXES = Object.freeze({
  capacity: 'Capacité de remboursement',
  indebtedness: 'Endettement & équilibre budgétaire',
  creditHistory: 'Antécédents de crédit',
  savings: 'Épargne & relation avec la caisse',
  stability: 'Stabilité du revenu et de l’adresse',
  guarantees: 'Niveau et qualité des garanties',
  solvency: 'Solvabilité & apport',
  appraisal: 'Appréciation terrain (grille de risque)'
});

const PME_WEIGHTS = Object.freeze({
  capacity: 0.25, indebtedness: 0.10, creditHistory: 0.15, savings: 0.10,
  stability: 0.10, guarantees: 0.10, solvency: 0.05, appraisal: 0.15
});

export const SFD_SCORE_WEIGHTS = Object.freeze({
  'Crédit salarié': Object.freeze({
    capacity: 0.25, indebtedness: 0.15, creditHistory: 0.15, savings: 0.10,
    stability: 0.20, guarantees: 0.10, solvency: 0, appraisal: 0.05
  }),
  'Crédit PME': PME_WEIGHTS,
  default: PME_WEIGHTS
});

export const SFD_SCORE_NORMS = Object.freeze({
  minimumDebtCoverage: 2,          // ≥ 200 % (fiche d'analyse)
  maximumCreditToEquity: 0.5,      // ≤ 50 % (fiche d'analyse)
  minimumDgaRatio: 0.1,            // dépôt de garantie 10 % (fiche d'analyse)
  dgaNormProducts: ['Crédit PME']
});

// Bandes publiées, reprenant les cases « Risque acceptable / Risque élevé » du formulaire PME.
export const SFD_SCORE_BANDS = Object.freeze({
  acceptable: 700,
  watch: 550,
  minimumCoverage: 0.7,            // part des poids renseignée en dessous de laquelle le score n'est pas publié
  minimumDataConfidence: 40
});

export function sfdWeightsFor(product) {
  return SFD_SCORE_WEIGHTS[product] || SFD_SCORE_WEIGHTS.default;
}

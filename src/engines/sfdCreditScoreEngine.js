import {
  SFD_SCORE_POLICY_VERSION, SFD_SCORE_CURVES, SFD_SCORE_AXES, SFD_SCORE_NORMS, SFD_SCORE_BANDS, sfdWeightsFor
} from '../config/sfdScorePolicies.js';

export const SFD_SCORE_ENGINE_VERSION = '1.0.0';

const isNum = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const round = (value, digits = 2) => Math.round(Number(value) * 10 ** digits) / 10 ** digits;
const clamp = value => Math.max(0, Math.min(100, Number(value) || 0));

export function curveScore(value, points) {
  if (!isNum(value)) return null;
  const v = Number(value);
  if (v <= points[0][0]) return clamp(points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const [x2, y2] = points[i];
    const [x1, y1] = points[i - 1];
    if (v <= x2) return clamp(y1 + (v - x1) / (x2 - x1) * (y2 - y1));
  }
  return clamp(points.at(-1)[1]);
}

// Moyenne pondérée des sous-critères renseignés ; null si aucun ne l'est.
function combine(parts) {
  const known = parts.filter(part => part.score !== null);
  if (!known.length) return { score: null, parts };
  const weight = known.reduce((sum, part) => sum + part.weight, 0);
  return { score: clamp(known.reduce((sum, part) => sum + part.score * part.weight, 0) / weight), parts };
}

const part = (label, value, score, weight = 1) => ({ label, value: isNum(value) ? round(value) : (value ?? null), score: score === null ? null : Math.round(score), weight });
const ratio = (numerator, denominator) => isNum(numerator) && Number(denominator) > 0 ? Number(numerator) / Number(denominator) : null;

// Crédit salarié : le remboursement mensuel du formulaire fait foi ; sinon l'échéance simulée.
const installmentFor = input => input.product === 'Crédit salarié' && Number(input.salary?.monthlyRepayment) > 0 ? Number(input.salary.monthlyRepayment) : Number(input.installment || 0);

function capacityAxis(input) {
  if (input.product === 'Crédit salarié') {
    const s = input.salary || {};
    const installment = installmentFor(input);
    const coverage = ratio(s.assignableQuota, installment);
    return combine([part('Quotité cessible / remboursement mensuel', coverage, curveScore(coverage, SFD_SCORE_CURVES.quotaCoverage))]);
  }
  const coverage = ratio(input.capacity?.available, input.installment);
  return combine([part('Montant disponible / échéance', coverage, curveScore(coverage, SFD_SCORE_CURVES.debtCoverage))]);
}

function indebtednessAxis(input) {
  const income = input.product === 'Crédit salarié' && Number(input.salary?.netSalary) > 0 ? input.salary.netSalary : input.revenueMonthly;
  const dti = Number(income) > 0 ? (Number(input.existingDebtInstallments || 0) + installmentFor(input)) / Number(income) : null;
  const budget = input.personalBudget;
  const surplus = budget && Number(budget.expenses) > 0 ? budget.net / budget.expenses : null;
  return combine([
    part('(Dettes existantes + nouvelle échéance) / revenu', dti, curveScore(dti, SFD_SCORE_CURVES.debtToIncome), 2),
    part('Excédent du budget personnel / dépenses', surplus, curveScore(surplus, [[-0.2, 0], [0, 30], [0.2, 70], [0.5, 100]]))
  ]);
}

function creditHistoryAxis(input) {
  const h = input.history || {};
  let repayment = null;
  if (h.previousLoans > 0) {
    repayment = h.maxDaysPastDue > 30 ? 20 : h.maxDaysPastDue > 0 ? 60 : 100;
    if (h.restructured) repayment = Math.max(0, repayment - 20);
  } else if (h.previousLoans === 0 && h.commitmentsRespected === null) {
    repayment = 50; // premier crédit : état réel, noté neutre et signalé
  }
  const declared = h.commitmentsRespected === 'Oui' ? 100 : h.commitmentsRespected === 'Non' ? 0 : null;
  const bic = h.bicIncidents === true ? 0 : h.bicIncidents === false ? 100 : null;
  return combine([
    part('Remboursement des prêts précédents à la caisse', h.previousLoans > 0 ? `${h.previousLoans} prêt(s), retard max ${h.maxDaysPastDue} j` : 'Premier crédit', repayment, 2),
    part('Engagements antérieurs respectés (déclaré / vérifié)', h.commitmentsRespected, declared),
    part('Rapport BIC sans incident', h.bicIncidents === null || h.bicIncidents === undefined ? null : (h.bicIncidents ? 'Incident' : 'Aucun incident'), bic, 2)
  ]);
}

function savingsAxis(input) {
  const s = input.savings || {};
  const dga = ratio(s.dga, input.requestedAmount);
  const balance = ratio(s.accountBalance, installmentFor(input));
  const dgaWeight = SFD_SCORE_NORMS.dgaNormProducts.includes(input.product) ? 2 : 1;
  return combine([
    part('Ancienneté de membre (mois)', s.membershipMonths, curveScore(s.membershipMonths, SFD_SCORE_CURVES.membershipMonths)),
    part('Épargne obligatoire (DGA) / montant', dga, curveScore(dga, SFD_SCORE_CURVES.dgaRatio), dgaWeight),
    part('Solde du compte / échéance', balance, curveScore(balance, SFD_SCORE_CURVES.balanceToInstallment)),
    part('Dépôts sur le compte DAV (6 derniers mois)', s.davDepositCount6m, curveScore(s.davDepositCount6m, SFD_SCORE_CURVES.davDepositsSixMonths))
  ]);
}

function stabilityAxis(input) {
  const s = input.stability || {};
  const parts = [];
  if (input.product === 'Crédit salarié') {
    parts.push(part('Ancienneté chez l’employeur (mois)', s.seniorityMonths, curveScore(s.seniorityMonths, SFD_SCORE_CURVES.seniorityMonths), 2));
    const contractCoversLoan = isNum(s.contractMonthsRemaining) ? (Number(s.contractMonthsRemaining) >= Number(input.durationMonths) ? 100 : 0) : null;
    parts.push(part('Contrat couvrant la durée du prêt', s.contractMonthsRemaining, contractCoversLoan, 2));
    parts.push(part('Salaire domicilié à la caisse', s.salaryDomiciled === null || s.salaryDomiciled === undefined ? null : (s.salaryDomiciled ? 'Oui' : 'Non'), s.salaryDomiciled === null || s.salaryDomiciled === undefined ? null : (s.salaryDomiciled ? 100 : 40)));
  } else {
    parts.push(part('Ancienneté de l’activité (mois)', s.activityAgeMonths, curveScore(s.activityAgeMonths, SFD_SCORE_CURVES.activityAgeMonths), 2));
  }
  parts.push(part('Ancienneté à l’adresse (années)', s.addressYears, curveScore(s.addressYears, SFD_SCORE_CURVES.addressYears)));
  const verified = { Oui: 100, Partiellement: 50, Non: 0 }[s.addressVerified] ?? null;
  parts.push(part('Adresse vérifiée lors de la visite', s.addressVerified, verified));
  return combine(parts);
}

function guaranteesAxis(input) {
  const coverage = ratio(input.guarantees?.retainedValue, input.requestedAmount);
  const hasAny = Number(input.guarantees?.count || 0) > 0 || input.product === 'Crédit PME';
  return combine([part('Valeur retenue des garanties / montant', hasAny ? coverage ?? 0 : null, hasAny ? curveScore(coverage ?? 0, SFD_SCORE_CURVES.guaranteeCoverage) : null)]);
}

function solvencyAxis(input) {
  const netWorth = input.balance?.netWorth;
  const creditToEquity = isNum(netWorth) ? (Number(netWorth) > 0 ? Number(input.requestedAmount) / Number(netWorth) : 99) : null;
  const contribution = ratio(input.financingPlan?.personalContribution, input.financingPlan?.projectCost);
  return combine([
    part('Crédit / fonds propres', creditToEquity, curveScore(creditToEquity, SFD_SCORE_CURVES.creditToEquity), 2),
    part('Apport personnel / coût du projet', contribution, curveScore(contribution, SFD_SCORE_CURVES.personalContribution))
  ]);
}

function appraisalAxis(input) {
  const rated = (input.appraisal?.ratings || []).filter(r => r.rating === 'Satisfaisant' || r.rating === 'Insatisfaisant');
  const grid = rated.length ? rated.filter(r => r.rating === 'Satisfaisant').length / rated.length * 100 : null;
  const t = input.appraisal?.trust || {};
  const trust = t.count > 0 ? clamp(50 + (t.pos - t.warn) * 12.5) : null;
  return combine([
    part('Grille de risque : dimensions satisfaisantes', rated.length ? `${rated.filter(r => r.rating === 'Satisfaisant').length}/${rated.length}` : null, grid, 3),
    part('Faits observés (favorables − vigilances)', t.count > 0 ? `${t.pos} favorable(s), ${t.warn} vigilance(s)` : null, trust)
  ]);
}

const AXIS_BUILDERS = {
  capacity: capacityAxis, indebtedness: indebtednessAxis, creditHistory: creditHistoryAxis, savings: savingsAxis,
  stability: stabilityAxis, guarantees: guaranteesAxis, solvency: solvencyAxis, appraisal: appraisalAxis
};

function norm(code, label, status, detail) { return { code, label, status, detail }; }

// Normes institutionnelles : contrôlées à part du score, jamais compensées par un bon axe.
function evaluateNorms(input) {
  const norms = [];
  const n = SFD_SCORE_NORMS;
  if (input.product !== 'Crédit salarié') {
    const coverage = ratio(input.capacity?.available, input.installment);
    norms.push(coverage === null
      ? norm('NORME_COUVERTURE_DETTE', 'Couverture de la dette ≥ 200 %', 'NON_CALCULABLE', 'Montant disponible ou échéance manquant')
      : norm('NORME_COUVERTURE_DETTE', 'Couverture de la dette ≥ 200 %', coverage >= n.minimumDebtCoverage ? 'CONFORME' : 'HORS_NORME', `${Math.round(coverage * 100)} %`));
    const netWorth = input.balance?.netWorth;
    if (isNum(netWorth)) {
      const cte = Number(netWorth) > 0 ? Number(input.requestedAmount) / Number(netWorth) : Infinity;
      norms.push(norm('NORME_SOLVABILITE', 'Crédit / fonds propres ≤ 50 %', cte <= n.maximumCreditToEquity ? 'CONFORME' : 'HORS_NORME', Number.isFinite(cte) ? `${Math.round(cte * 100)} %` : 'Fonds propres nuls ou négatifs'));
    } else {
      norms.push(norm('NORME_SOLVABILITE', 'Crédit / fonds propres ≤ 50 %', 'NON_CALCULABLE', 'Bilan personnel absent'));
    }
  }
  if (n.dgaNormProducts.includes(input.product)) {
    const dga = ratio(input.savings?.dga, input.requestedAmount);
    norms.push(dga === null
      ? norm('NORME_DGA', 'Dépôt de garantie (DGA) ≥ 10 %', 'NON_CALCULABLE', 'DGA non renseignée')
      : norm('NORME_DGA', 'Dépôt de garantie (DGA) ≥ 10 %', dga >= n.minimumDgaRatio ? 'CONFORME' : 'HORS_NORME', `${Math.round(dga * 100)} %`));
  }
  if (input.history?.bicIncidents === true) norms.push(norm('NORME_BIC', 'Rapport BIC sans incident', 'HORS_NORME', 'Incident signalé'));
  const quotaMissing = input.product === 'Crédit salarié' && !(Number(input.salary?.assignableQuota) > 0 && Number(input.salary?.monthlyRepayment) > 0);
  for (const check of input.fieldChecks || []) {
    if (check.code === 'SAL_QUOTITE' && quotaMissing) norms.push(norm(check.code, check.label, 'NON_CALCULABLE', 'Quotité ou remboursement mensuel non renseigné'));
    else if (check.status === 'BLOQUANT') norms.push(norm(check.code, check.label, 'HORS_NORME', check.detail || ''));
    else if (check.status === 'CONFORME' && ['SAL_QUOTITE', 'SAL_DUREE_DOMICILIATION', 'PME_GARANTIE'].includes(check.code)) norms.push(norm(check.code, check.label, 'CONFORME', check.detail || ''));
  }
  for (const check of input.policyChecks || []) {
    if (check.status === 'Non conforme') norms.push(norm(`POLITIQUE_${check.code}`, check.label, 'HORS_NORME', 'Contrôle de conformité à la politique de crédit'));
  }
  return norms;
}

export function scoreSfdApplication(input = {}) {
  const weights = sfdWeightsFor(input.product);
  const axes = Object.entries(AXIS_BUILDERS).map(([id, build]) => {
    const { score, parts } = build(input);
    return { id, label: SFD_SCORE_AXES[id], weight: weights[id] || 0, score: score === null ? null : Math.round(score), known: score !== null, parts };
  });
  const scored = axes.filter(axis => axis.weight > 0);
  const knownWeight = scored.filter(axis => axis.known).reduce((sum, axis) => sum + axis.weight, 0);
  const totalWeight = scored.reduce((sum, axis) => sum + axis.weight, 0);
  const coverage = totalWeight > 0 ? knownWeight / totalWeight : 0;
  const score100 = knownWeight > 0 ? scored.filter(axis => axis.known).reduce((sum, axis) => sum + axis.score * axis.weight, 0) / knownWeight : 0;
  const score = Math.round(score100 * 10);

  const norms = evaluateNorms(input);
  const outOfNorm = norms.filter(item => item.status === 'HORS_NORME');
  const missingAxes = scored.filter(axis => !axis.known).map(axis => axis.label);
  const missingCriteria = scored.flatMap(axis => axis.parts.filter(p => p.score === null).map(p => `${axis.label} : ${p.label}`));
  const dataConfidence = Number(input.dataConfidence || 0);

  let band;
  const capacityKnown = axes.find(axis => axis.id === 'capacity').known;
  if (!capacityKnown || coverage < SFD_SCORE_BANDS.minimumCoverage || dataConfidence < SFD_SCORE_BANDS.minimumDataConfidence) band = 'À compléter';
  else if (outOfNorm.length || score < SFD_SCORE_BANDS.watch) band = 'Risque élevé';
  else if (score < SFD_SCORE_BANDS.acceptable) band = 'À surveiller';
  else band = 'Risque acceptable';

  const ranked = scored.filter(axis => axis.known);
  return {
    score,
    band,
    published: band !== 'À compléter',
    coverage: round(coverage),
    dataConfidence,
    axes: Object.fromEntries(axes.map(axis => [axis.id, axis.score])),
    weights: Object.fromEntries(axes.map(axis => [axis.id, axis.weight])),
    detail: axes,
    explanation: scored.map(axis => ({ axis: axis.id, label: axis.label, score: axis.score, weight: axis.weight })),
    strengths: ranked.filter(axis => axis.score >= 75).sort((a, b) => b.score * b.weight - a.score * a.weight).map(axis => axis.label),
    weaknesses: ranked.filter(axis => axis.score < 50).sort((a, b) => a.score - b.score).map(axis => axis.label),
    norms,
    outOfNorm: outOfNorm.map(item => item.label),
    missingAxes,
    missingCriteria,
    safeguards: { automaticDecision: false, humanDecisionRequired: true, dataConfidenceInScore: false },
    policyVersion: SFD_SCORE_POLICY_VERSION,
    engineVersion: SFD_SCORE_ENGINE_VERSION
  };
}

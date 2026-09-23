import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };

const { scoreSfdApplication, curveScore } = await import('../src/engines/sfdCreditScoreEngine.js');
const { SFD_SCORE_WEIGHTS } = await import('../src/config/sfdScorePolicies.js');
const L = await import('../src/modules/creditLedgerR15.js');

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

const pme = (over = {}) => ({
  product: 'Crédit PME', requestedAmount: 1_000_000, durationMonths: 12, installment: 100_000,
  capacity: { available: 250_000 }, revenueMonthly: 900_000, existingDebtInstallments: 50_000,
  personalBudget: { net: 60_000, expenses: 150_000 },
  history: { previousLoans: 1, maxDaysPastDue: 0, restructured: false, commitmentsRespected: 'Oui', bicIncidents: false },
  savings: { membershipMonths: 30, accountBalance: 200_000, dga: 120_000, davDepositCount6m: 6 },
  stability: { activityAgeMonths: 48, addressYears: 4, addressVerified: 'Oui' },
  guarantees: { count: 2, retainedValue: 1_200_000 },
  balance: { netWorth: 3_000_000 },
  financingPlan: { personalContribution: 300_000, projectCost: 1_300_000 },
  appraisal: { ratings: [{ rating: 'Satisfaisant' }, { rating: 'Satisfaisant' }, { rating: 'Insatisfaisant' }], trust: { count: 2, pos: 2, warn: 0 } },
  fieldChecks: [], policyChecks: [], dataConfidence: 80,
  ...over
});

check('poids = 100 % pour chaque produit', () => {
  for (const [product, weights] of Object.entries(SFD_SCORE_WEIGHTS)) {
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${product}: ${total}`);
  }
});

check('courbes : interpolation et bornes', () => {
  assert.equal(curveScore(2, [[0, 0], [1, 25], [2, 75]]), 75);
  assert.equal(curveScore(1.5, [[0, 0], [1, 25], [2, 75]]), 50);
  assert.equal(curveScore(99, [[0, 0], [1, 100]]), 100);
  assert.equal(curveScore(null, [[0, 0], [1, 100]]), null);
});

check('dossier PME complet et solide : risque acceptable', () => {
  const r = scoreSfdApplication(pme());
  assert.equal(r.band, 'Risque acceptable', JSON.stringify(r.norms));
  assert.ok(r.score >= 700 && r.score <= 1000);
  assert.equal(r.coverage, 1);
});

check('la confiance des données ne modifie jamais le score', () => {
  const high = scoreSfdApplication(pme({ dataConfidence: 90 }));
  const low = scoreSfdApplication(pme({ dataConfidence: 20 }));
  assert.equal(high.score, low.score);
  assert.equal(low.band, 'À compléter');
  assert.equal(low.published, false);
});

check('plus de dettes → score qui ne monte pas', () => {
  let previous = Infinity;
  for (const debt of [0, 50_000, 150_000, 300_000, 500_000]) {
    const r = scoreSfdApplication(pme({ existingDebtInstallments: debt }));
    assert.ok(r.score <= previous, `dette ${debt}`);
    previous = r.score;
  }
});

check('plus de garanties → score qui ne baisse pas', () => {
  let previous = -1;
  for (const value of [0, 500_000, 1_000_000, 1_500_000]) {
    const r = scoreSfdApplication(pme({ guarantees: { count: 1, retainedValue: value } }));
    assert.ok(r.score >= previous, `garantie ${value}`);
    previous = r.score;
  }
});

check('retards antérieurs → antécédents dégradés', () => {
  const clean = scoreSfdApplication(pme());
  const late = scoreSfdApplication(pme({ history: { previousLoans: 1, maxDaysPastDue: 45, restructured: false, commitmentsRespected: 'Non', bicIncidents: false } }));
  assert.ok(late.axes.creditHistory < clean.axes.creditHistory);
  assert.ok(late.score < clean.score);
});

check('fiche d’analyse : couverture de la dette < 200 % → hors norme, risque élevé', () => {
  const r = scoreSfdApplication(pme({ capacity: { available: 150_000 } }));
  const n = r.norms.find(x => x.code === 'NORME_COUVERTURE_DETTE');
  assert.equal(n.status, 'HORS_NORME');
  assert.equal(r.band, 'Risque élevé');
});

check('fiche d’analyse : crédit / fonds propres > 50 % → hors norme', () => {
  const r = scoreSfdApplication(pme({ balance: { netWorth: 1_500_000 } }));
  assert.equal(r.norms.find(x => x.code === 'NORME_SOLVABILITE').status, 'HORS_NORME');
});

check('fiche d’analyse : DGA < 10 % → hors norme (PME)', () => {
  const r = scoreSfdApplication(pme({ savings: { membershipMonths: 30, accountBalance: 200_000, dga: 50_000, davDepositCount6m: 6 } }));
  assert.equal(r.norms.find(x => x.code === 'NORME_DGA').status, 'HORS_NORME');
});

check('incident BIC → hors norme', () => {
  const r = scoreSfdApplication(pme({ history: { previousLoans: 0, maxDaysPastDue: 0, commitmentsRespected: null, bicIncidents: true } }));
  assert.ok(r.outOfNorm.includes('Rapport BIC sans incident'));
});

check('capacité non calculable → score non publié', () => {
  const r = scoreSfdApplication(pme({ capacity: { available: null } }));
  assert.equal(r.band, 'À compléter');
});

check('formulaire salarié : quotité inférieure au remboursement → capacité 0', () => {
  const r = scoreSfdApplication({
    product: 'Crédit salarié', requestedAmount: 600_000, durationMonths: 12, installment: 55_000,
    salary: { netSalary: 150_000, assignableQuota: 40_000, monthlyRepayment: 55_000 },
    fieldChecks: [{ code: 'SAL_QUOTITE', label: 'Quotité cessible supérieure au remboursement mensuel', status: 'BLOQUANT' }],
    dataConfidence: 80
  });
  assert.equal(r.axes.capacity, 0);
  assert.ok(r.outOfNorm.length >= 1);
});

check('formulaire salarié vide : quotité non calculable, pas hors norme', () => {
  const r = scoreSfdApplication({
    product: 'Crédit salarié', requestedAmount: 600_000, durationMonths: 12, installment: 55_000, salary: {},
    fieldChecks: [{ code: 'SAL_QUOTITE', label: 'Quotité cessible supérieure au remboursement mensuel', status: 'BLOQUANT' }],
    dataConfidence: 80
  });
  assert.equal(r.norms.find(x => x.code === 'SAL_QUOTITE').status, 'NON_CALCULABLE');
  assert.equal(r.band, 'À compléter');
});

check('données de démo : DOS-0005 reste présentable et explicable', () => {
  const x = L.load();
  const d = L.dossier(x, 'DOS-0005');
  assert.equal(d.incluscoreDetail.band, 'Risque acceptable');
  assert.equal(d.incluscore, d.incluscoreDetail.score);
  assert.ok(d.incluscore >= 700);
  assert.equal(d.incluscoreDetail.outOfNorm.length, 0);
});

check('données de démo : un dossier à faible confiance n’est pas publié', () => {
  const x = L.load();
  const low = x.applications.map(a => L.dossier(x, a.id)).filter(d => d.confidence < 40);
  assert.ok(low.length > 0);
  for (const d of low) assert.equal(d.incluscoreDetail.band, 'À compléter', d.application.id);
});

check('la décision du comité fige le score et sa version', () => {
  const x = L.load();
  const v = L.recordDecision(x, { applicationId: 'DOS-0005', decision: 'AJOURNÉ', reason: 'Test' }, 'Comité de crédit');
  assert.ok(v.scoreSnapshot);
  assert.equal(v.scoreSnapshot.policyVersion, 'SFD-SCORE-1.0.0');
  assert.equal(typeof v.scoreSnapshot.score, 'number');
});

console.log(`SFD SCORE: ${passed} PASS`);

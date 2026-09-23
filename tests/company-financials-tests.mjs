import assert from 'node:assert/strict';
const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const L = await import('../src/modules/creditLedgerR15.js');
const CF = await import('../src/modules/companyFinancials.js');

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const x = L.load();
const companies = Object.keys(CF.DEMO_COMPANY_PROFILES);

check('les 7 sociétés de démo ont un bilan et 6 mois de trésorerie', () => {
  for (const name of companies) {
    const m = x.members.find(v => v.name === name);
    assert.ok(m, name);
    const a = x.applications.find(v => v.memberId === m.id && v.product !== 'Crédit salarié');
    assert.ok(x.companyBalanceSheets.some(b => b.applicationId === a.id), `bilan ${name}`);
    const cf = x.cashflows.find(c => c.applicationId === a.id);
    assert.equal(cf.months.length, 6, `trésorerie ${name}`);
    assert.ok(cf.dav.depositCount > 0);
  }
});

check('chaque bilan est équilibré (actif = passif) et a des fonds propres positifs', () => {
  for (const b of x.companyBalanceSheets) {
    const t = CF.balanceTotals(b);
    assert.ok(t.balanced, b.applicationId);
    assert.ok(t.equity > 0, b.applicationId);
  }
});

check('trésorerie : chaque mois repart de la trésorerie de fin du mois précédent', () => {
  for (const c of x.cashflows) {
    const s = CF.cashflowSummary(c);
    for (let i = 1; i < s.months.length; i++) assert.equal(s.months[i].openingCash, s.months[i - 1].closingCash);
  }
});

check('données reproductibles et sans doublon au rechargement', () => {
  const before = JSON.stringify([x.companyBalanceSheets, x.cashflows]);
  L.save(x);
  const y = L.load();
  assert.equal(JSON.stringify([y.companyBalanceSheets, y.cashflows]), before);
  assert.equal(y.companyBalanceSheets.length, companies.length);
});

check('identification légale fictive ajoutée aux sociétés', () => {
  const kanu = x.members.find(v => v.name === 'Kanu Agro SARL');
  assert.equal(kanu.legalForm, 'SARL');
  assert.ok(kanu.rccm && kanu.signatories.length === 1);
  const coop = x.members.find(v => v.name === 'Coopérative Benkadi');
  assert.equal(coop.legalForm, 'Coopérative');
  assert.ok(coop.associationReceipt);
});

check('le score utilise les fonds propres de l’entreprise et les dépôts DAV', () => {
  const sahara = x.applications.find(a => x.members.find(m => m.id === a.memberId)?.name === 'Sahara Services SARL');
  const d = L.dossier(x, sahara.id);
  const norm = d.incluscoreDetail.norms.find(n => n.code === 'NORME_SOLVABILITE');
  assert.equal(norm.status, 'HORS_NORME');
  const solvency = d.incluscoreDetail.detail.find(a => a.id === 'solvency');
  assert.match(solvency.parts[0].label, /Bilan de l’entreprise/);
  const savings = d.incluscoreDetail.detail.find(a => a.id === 'savings');
  assert.equal(savings.parts.find(p => /DAV/.test(p.label)).value, d.cashflow.dav.depositCount);
});

console.log(`COMPANY FINANCIALS: ${passed} PASS`);

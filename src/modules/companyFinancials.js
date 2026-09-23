// Bilan de l'entreprise et flux de trésorerie : rubriques de la fiche « Analyse de demande de prêt ».
// Le générateur de démonstration produit des données SYNTHÉTIQUES et reproductibles pour les sociétés du jeu de démo.

export const BALANCE_ASSETS = Object.freeze({
  longTerm: [
    ['land', 'Terrain'], ['building', 'Boutique / bâtiment'], ['furniture', 'Mobilier de bureau'],
    ['equipment', 'Matériel d’exploitation'], ['computers', 'Matériel informatique'],
    ['rentDeposit', 'Caution déposée sur loyer'], ['otherFixed', 'Autres frais immobilisés'], ['fittings', 'Aménagements et installations']
  ],
  shortTerm: [
    ['rawMaterials', 'Stocks de matières premières'], ['goodsStock', 'Stocks de marchandises'],
    ['supplierAdvances', 'Avances versées aux fournisseurs'], ['receivables', 'Créances clients (saines)'],
    ['bankDAV', 'Banque (DAV à la caisse)'], ['cash', 'Fonds en caisse disponibles']
  ]
});

export const BALANCE_LIABILITIES = Object.freeze({
  equity: [['reserves', 'Fonds propres'], ['capital', 'Capital social'], ['result', 'Résultat']],
  longTerm: [['longTermLoans', 'Emprunt moyen, long terme'], ['otherLongTerm', 'Autres']],
  shortTerm: [['suppliers', 'Dettes fournisseurs'], ['taxSocial', 'Dettes fiscales et sociales'], ['shortTermLoans', 'Emprunt à court terme'], ['otherShortTerm', 'Autres']]
});

export const CASHFLOW_INFLOWS = Object.freeze([['sales', 'Ventes encaissées'], ['otherInflows', 'Autres encaissements']]);
export const CASHFLOW_OUTFLOWS = Object.freeze([
  ['purchases', 'Achats'], ['salaries', 'Salaires'], ['rent', 'Loyer'], ['utilities', 'Électricité, eau, téléphone'],
  ['taxes', 'Taxes'], ['transport', 'Transport et dédouanement'], ['loanRepayments', 'Remboursements d’emprunts'], ['other', 'Autres']
]);

const num = v => Number(v) || 0;
const sumOf = (obj, keys) => keys.reduce((s, [k]) => s + num(obj?.[k]), 0);

export function balanceTotals(bs) {
  const a = bs?.assets || {}, l = bs?.liabilities || {};
  const longTermAssets = sumOf(a, BALANCE_ASSETS.longTerm);
  const shortTermAssets = sumOf(a, BALANCE_ASSETS.shortTerm);
  const equity = sumOf(l, BALANCE_LIABILITIES.equity);
  const longTermDebt = sumOf(l, BALANCE_LIABILITIES.longTerm);
  const shortTermDebt = sumOf(l, BALANCE_LIABILITIES.shortTerm);
  const totalAssets = longTermAssets + shortTermAssets;
  const totalLiabilities = equity + longTermDebt + shortTermDebt;
  return {
    longTermAssets, shortTermAssets, totalAssets, equity, longTermDebt, shortTermDebt, totalLiabilities,
    balanced: Math.abs(totalAssets - totalLiabilities) < 1,
    workingCapital: shortTermAssets - shortTermDebt,
    debtToEquity: equity > 0 ? (longTermDebt + shortTermDebt) / equity : null
  };
}

export function cashflowSummary(cf) {
  const months = (cf?.months || []).map(m => {
    const inflow = sumOf(m.inflows, CASHFLOW_INFLOWS), outflow = sumOf(m.outflows, CASHFLOW_OUTFLOWS);
    return { period: m.period, inflow, outflow, net: inflow - outflow, openingCash: num(m.openingCash), closingCash: num(m.openingCash) + inflow - outflow };
  });
  if (!months.length) return null;
  const avg = v => months.reduce((s, m) => s + m[v], 0) / months.length;
  const avgInflow = avg('inflow');
  const variance = months.reduce((s, m) => s + (m.inflow - avgInflow) ** 2, 0) / months.length;
  return {
    months,
    averageInflow: Math.round(avgInflow),
    averageOutflow: Math.round(avg('outflow')),
    averageNet: Math.round(avg('net')),
    negativeMonths: months.filter(m => m.net < 0).length,
    inflowVolatility: avgInflow > 0 ? Math.round(Math.sqrt(variance) / avgInflow * 100) : null,
    endingCash: months.at(-1).closingCash,
    dav: cf.dav || null
  };
}

// --- Générateur de démonstration (données synthétiques) ---------------------------------

// Pseudo-aléatoire déterministe : mêmes données à chaque chargement pour une société donnée.
function prng(seedText) {
  let h = 2166136261;
  for (const c of String(seedText)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const round = (v, step = 5000) => Math.round(v / step) * step;

// Profils des sociétés du jeu de démo : fonds propres visés et saisonnalité de l'activité.
// Certains profils dépassent volontairement la norme crédit / fonds propres ≤ 50 % pour la démonstration.
export const DEMO_COMPANY_PROFILES = Object.freeze({
  'Kanu Agro SARL': { legalForm: 'SARL', equity: 14000000, monthlySales: 2600000, seasonality: [1, 1, 1.1, 1.2, 0.9, 0.8], sector: 'agro' },
  'Sahara Services SARL': { legalForm: 'SARL', equity: 6000000, monthlySales: 2475000, seasonality: [1, 1, 1, 1, 1, 1], sector: 'services' },
  'Entreprise N\'Tji SARL': { legalForm: 'SARL', equity: 20000000, monthlySales: 4125000, seasonality: [0.9, 1, 1.1, 1.1, 1, 0.9], sector: 'transformation' },
  'Coopérative Benkadi': { legalForm: 'Coopérative', equity: 5000000, monthlySales: 1800000, seasonality: [0.5, 0.7, 1.4, 1.6, 1.1, 0.7], sector: 'maraichage' },
  'Coopérative Faso Jigi': { legalForm: 'Coopérative', equity: 15000000, monthlySales: 3300000, seasonality: [0.8, 0.9, 1.2, 1.3, 1, 0.8], sector: 'cereales' },
  'Coopérative Sabuyuma': { legalForm: 'Coopérative', equity: 9000000, monthlySales: 2200000, seasonality: [0.4, 0.5, 0.8, 1.6, 1.8, 0.9], sector: 'coton' },
  'Union Jèkaba': { legalForm: 'Coopérative', equity: 11000000, monthlySales: 2750000, seasonality: [0.9, 1, 1, 1.1, 1.1, 0.9], sector: 'transformation' }
});

function lastMonths(count, asOf = new Date()) {
  const out = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export function demoBalanceSheet(name, profile, requestedAmount) {
  const r = prng(`bilan:${name}`);
  const sales = profile.monthlySales;
  const assets = {
    land: profile.sector === 'services' ? 0 : round(profile.equity * (0.18 + r() * 0.1)),
    building: round(profile.equity * (0.2 + r() * 0.1)),
    furniture: round(250000 + r() * 400000),
    equipment: round(profile.equity * (0.22 + r() * 0.12)),
    computers: round(150000 + r() * (profile.sector === 'services' ? 1500000 : 400000)),
    rentDeposit: round(100000 + r() * 200000),
    otherFixed: round(r() * 300000),
    fittings: round(200000 + r() * 600000),
    rawMaterials: profile.sector === 'services' ? 0 : round(sales * (0.3 + r() * 0.4)),
    goodsStock: round(sales * (0.4 + r() * 0.5)),
    supplierAdvances: round(sales * r() * 0.15),
    receivables: round(sales * (0.2 + r() * 0.3)),
    bankDAV: round(sales * (0.25 + r() * 0.35)),
    cash: round(80000 + r() * 250000)
  };
  const totalAssets = Object.values(assets).reduce((s, v) => s + v, 0);
  const liabilities = {
    capital: round(profile.equity * 0.35),
    result: round(sales * 12 * (0.06 + r() * 0.05)),
    longTermLoans: round(requestedAmount * (0.2 + r() * 0.4)),
    otherLongTerm: 0,
    suppliers: round(sales * (0.15 + r() * 0.2)),
    taxSocial: round(sales * (0.03 + r() * 0.04)),
    shortTermLoans: round(r() * 400000),
    otherShortTerm: round(r() * 150000)
  };
  // Les fonds propres (réserves) équilibrent le bilan : total actif = total passif.
  const others = Object.values(liabilities).reduce((s, v) => s + v, 0);
  liabilities.reserves = Math.max(0, totalAssets - others);
  if (liabilities.reserves === 0) liabilities.otherShortTerm += totalAssets - others;
  return { assets, liabilities };
}

export function demoCashflow(name, profile, asOf) {
  const r = prng(`treso:${name}`);
  let cash = round(profile.monthlySales * (0.3 + r() * 0.3));
  const months = lastMonths(6, asOf).map((period, i) => {
    const sales = round(profile.monthlySales * profile.seasonality[i] * (0.92 + r() * 0.16));
    const inflows = { sales, otherInflows: round(r() * profile.monthlySales * 0.05) };
    const outflows = {
      purchases: round(sales * (0.42 + r() * 0.12)),
      salaries: round(profile.monthlySales * (0.08 + r() * 0.04)),
      rent: round(75000 + r() * 100000),
      utilities: round(35000 + r() * 60000),
      taxes: round(sales * 0.03),
      transport: round(sales * (0.03 + r() * 0.04)),
      loanRepayments: round(profile.monthlySales * 0.05),
      other: round(r() * 80000)
    };
    const month = { period, openingCash: cash, inflows, outflows };
    cash += Object.values(inflows).reduce((s, v) => s + v, 0) - Object.values(outflows).reduce((s, v) => s + v, 0);
    return month;
  });
  const depositCount = 6 + Math.floor(r() * 18);
  const depositTotal = round(months.reduce((s, m) => s + m.inflows.sales, 0) * (0.55 + r() * 0.3));
  const withdrawalCount = 4 + Math.floor(r() * 14);
  return {
    months,
    dav: {
      depositCount, depositTotal, averageDeposit: round(depositTotal / depositCount, 1000),
      withdrawalCount, withdrawalTotal: round(depositTotal * (0.75 + r() * 0.2)),
      averageWithdrawal: 0
    }
  };
}

// Identification légale fictive, cohérente avec la fiche d'adhésion personne morale.
function demoLegalIdentity(member, profile, index) {
  const n = String(index + 1).padStart(4, '0');
  const association = profile.legalForm === 'Coopérative';
  return {
    legalName: member.name,
    legalForm: profile.legalForm,
    rccm: association ? '' : `MA.BKO.2019.B.${n}`,
    associationReceipt: association ? `REC-COOP-${n}` : '',
    nif: `0000${n}DEMO`,
    annualTurnover: profile.monthlySales * 12,
    signatories: member.signatories?.length ? member.signatories : [{ name: `Dirigeant fictif ${index + 1}`, role: association ? 'Président' : 'Gérant', nationality: 'Malienne', idType: 'NINA', idNumber: `NINA-DEMO-${n}`, phone: '', address: member.city || '', birthDate: '', birthPlace: '' }],
    beneficialOwner: member.beneficialOwner || { hasOwnerAbove25: association ? 'Non' : 'Oui', name: association ? '' : `Dirigeant fictif ${index + 1}`, link: association ? '' : 'Associé majoritaire', birthDate: '', birthPlace: '', nationality: association ? '' : 'Malienne', indirectControl: '' },
    fundsOrigin: member.fundsOrigin || (association ? 'Cotisations des membres' : 'Apport des associés'),
    riskProfile: member.riskProfile || 'Moyen',
    ppe: member.ppe || 'Non',
    documentsProvided: member.documentsProvided && Object.keys(member.documentsProvided).length > 3 ? member.documentsProvided
      : { approval: association, statutes: true, rccm: !association, nif: true, directorsId: true, beneficiariesId: !association, mandate: false }
  };
}

// Ajoute bilan, trésorerie et identification aux sociétés du jeu de démo, sans écraser des données existantes.
export function ensureDemoCompanyFinancials(x, asOf = new Date()) {
  x.companyBalanceSheets ??= [];
  x.cashflows ??= [];
  const next = (prefix, list) => `${prefix}-${String(list.length + 1).padStart(4, '0')}`;
  Object.entries(DEMO_COMPANY_PROFILES).forEach(([name, profile], index) => {
    const member = (x.members || []).find(m => m.name === name);
    if (!member) return;
    const application = (x.applications || []).find(a => a.memberId === member.id && a.product !== 'Crédit salarié');
    if (!member.legalForm) Object.assign(member, demoLegalIdentity(member, profile, index));
    if (!application) return;
    if (!x.companyBalanceSheets.some(b => b.applicationId === application.id)) {
      x.companyBalanceSheets.push({ id: next('BIL', x.companyBalanceSheets), applicationId: application.id, memberId: member.id, asOf: lastMonths(1, asOf)[0] + '-28', source: 'Démonstration (synthétique)', ...demoBalanceSheet(name, profile, application.requestedAmount) });
    }
    if (!x.cashflows.some(c => c.applicationId === application.id)) {
      x.cashflows.push({ id: next('TRE', x.cashflows), applicationId: application.id, memberId: member.id, source: 'Démonstration (synthétique)', ...demoCashflow(name, profile, asOf) });
    }
  });
  for (const c of x.cashflows) if (c.dav && !c.dav.averageWithdrawal && c.dav.withdrawalCount) c.dav.averageWithdrawal = round(c.dav.withdrawalTotal / c.dav.withdrawalCount, 1000);
  return x;
}

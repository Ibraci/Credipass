// Assemble, à partir du registre de crédit, les données du score SFD (critères des documents terrain).
import * as R14 from './creditLedgerR14.js';
import { evaluateFieldPolicies } from './sfdFieldR193.js';
import { scoreSfdApplication } from '../engines/sfdCreditScoreEngine.js';

const num = v => Number(v) || 0;
const known = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const orNull = v => known(v) ? Number(v) : null;
const byApp = (rows, id) => (rows || []).filter(v => v.applicationId === id);

function monthsSince(date, asOf = new Date()) {
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) return null;
  return Math.max(0, (asOf.getFullYear() - d.getFullYear()) * 12 + asOf.getMonth() - d.getMonth());
}

function monthlyInstallment(x, a) {
  const product = (x.creditProducts || []).find(p => p.name === a.product && p.status === 'ACTIF');
  const rate = product?.rate?.value ?? 18;
  const method = product?.rate?.method ?? 'Dégressif';
  return R14.simulate(x, a.id, a.requestedAmount, a.durationMonths, a.periodicity, rate, method).monthlyEquivalent;
}

function creditHistory(x, a, form) {
  const previous = (x.applications || []).filter(v => v.memberId === a.memberId && v.id !== a.id && byApp(x.disbursements, v.id).length);
  let maxDaysPastDue = 0;
  for (const loan of previous) {
    for (const row of R14.schedule(x, loan.id)) maxDaysPastDue = Math.max(maxDaysPastDue, row.daysPastDue || 0);
  }
  const bic = byApp(x.bicChecks, a.id).at(-1);
  const incidentText = String(bic?.incidents || '').trim();
  return {
    previousLoans: previous.length,
    maxDaysPastDue,
    restructured: previous.some(loan => byApp(x.restructures, loan.id).length),
    commitmentsRespected: ['Oui', 'Non'].includes(form.commitmentsRespected) ? form.commitmentsRespected : null,
    bicIncidents: bic ? !(incidentText === '' || /^aucun/i.test(incidentText)) : null
  };
}

function availableForRepayment(x, a, business, budget) {
  const existingDebts = byApp(x.debts, a.id).filter(d => d.status === 'Actif').reduce((s, d) => s + num(d.installment), 0);
  if (business) {
    // Fiche d'analyse : bénéfice de l'activité (+ ou −) surplus personnel.
    if (budget) return { value: num(business.result) + num(budget.otherIncome) - num(budget.personalExpenses) - num(budget.creditTontinePayments), source: 'Résultat d’activité + budget personnel' };
    return { value: num(business.result) - existingDebts, source: 'Résultat d’activité − échéances existantes' };
  }
  return { value: R14.financialPosition(x, a.id).capacity, source: 'Revenus − charges − échéances existantes' };
}

export function buildSfdScoreInput(x, id) {
  const a = (x.applications || []).find(v => v.id === id);
  if (!a) return null;
  const member = (x.members || []).find(m => m.id === a.memberId) || {};
  const form = (x.productForms || []).find(v => v.applicationId === id)?.data || {};
  const business = byApp(x.businessAnalyses, id)[0] || null;
  const budget = byApp(x.personalBudgets, id)[0] || null;
  const balance = byApp(x.personalBalanceSheets, id)[0] || null;
  const visit = byApp(x.visits, id).at(-1) || null;
  const financial = R14.financialPosition(x, id);
  const seniority = monthsSince(form.hireDate);
  const guaranteeFactor = { 'Vérifiée': 1, 'Expertisée': 1, 'À vérifier': 0.5, 'Rejetée': 0 };
  const guarantees = byApp(x.guarantees, id);
  const available = availableForRepayment(x, a, business, budget);

  return {
    product: a.product,
    requestedAmount: num(a.requestedAmount),
    durationMonths: num(a.durationMonths),
    installment: monthlyInstallment(x, a),
    capacity: { available: available.value, source: available.source },
    salary: {
      netSalary: orNull(form.netSalary),
      assignableQuota: orNull(form.assignableQuota),
      monthlyRepayment: orNull(form.monthlyRepayment)
    },
    revenueMonthly: financial.revenue || num(business?.sales),
    existingDebtInstallments: byApp(x.debts, id).filter(d => d.status === 'Actif').reduce((s, d) => s + num(d.installment), 0),
    personalBudget: budget ? { net: num(budget.net), expenses: num(budget.personalExpenses) + num(budget.creditTontinePayments) } : null,
    history: creditHistory(x, a, form),
    savings: {
      membershipMonths: monthsSince(form.memberSince || member.joinedAt),
      accountBalance: orNull(form.accountBalance),
      dga: orNull(form.dga),
      davDepositCount6m: orNull(form.davDepositCount6m)
    },
    stability: {
      seniorityMonths: seniority,
      contractMonthsRemaining: known(form.contractDurationMonths) && seniority !== null ? num(form.contractDurationMonths) - seniority : null,
      salaryDomiciled: a.product === 'Crédit salarié' ? Boolean(String(form.salaryDomiciliationDate || '').trim()) : null,
      activityAgeMonths: orNull(visit?.activityAge ?? form.activityAgeMonths),
      addressYears: orNull(form.addressYears),
      addressVerified: visit?.addressVerified ?? null
    },
    guarantees: {
      count: guarantees.length,
      retainedValue: guarantees.reduce((s, g) => s + num(g.retainedValue ?? g.expertValue ?? g.declaredValue) * (guaranteeFactor[g.status] ?? 0.5), 0)
    },
    balance: balance ? { netWorth: num(balance.netWorth) } : null,
    financingPlan: { personalContribution: orNull(form.personalContribution), projectCost: orNull(form.projectCost) },
    appraisal: {
      ratings: byApp(x.institutionalRisk, id).map(r => ({ dimension: r.dimension, rating: r.rating })),
      trust: R14.trustSummary(x, id)
    },
    fieldChecks: evaluateFieldPolicies(x, id).checks,
    policyChecks: byApp(x.policyChecks, id),
    dataConfidence: R14.confidence(x, id)
  };
}

export function sfdScore(x, id) {
  const input = buildSfdScoreInput(x, id);
  return input ? scoreSfdApplication(input) : null;
}

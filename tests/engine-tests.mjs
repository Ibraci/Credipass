import assert from 'node:assert/strict';
import { buildScenario } from '../src/data/scenarios.js';
import { buildCustomCase } from '../src/data/custom-case.js';
import { calculateProfile } from '../src/engines/profileEngine.js';
import { analyzeEvidence } from '../src/engines/evidenceEngine.js';
import { reconstructCashflow } from '../src/engines/cashflowEngine.js';
import { assessDataQuality } from '../src/engines/dataQualityEngine.js';
import { calculateIncluscore } from '../src/engines/incluscoreEngine.js';
import { analyzeDebtPortfolio } from '../src/engines/debtEngine.js';
const ids=['baseline','fatoumata','mamadouWeak','aminataDebt','cooperative','startup'];
let pass=0;
for(const id of ids){
 const d=buildScenario(id); assert.ok(d.person?.name); pass++;
 assert.ok((d.evidence||[]).length>0); pass++;
 const p=calculateProfile(d.profile); assert.ok(p); pass++;
 const e=analyzeEvidence(d.evidence); assert.ok(e); pass++;
 const c=reconstructCashflow(d.evidence,{expectedPeriods:['2026-05','2026-06','2026-07']}); assert.ok(c?.summary); pass++;
 const q=assessDataQuality(d.evidence,{expectedPeriods:['2026-05','2026-06','2026-07'],asOfDate:'2026-09-21',diversityTarget:6}); assert.ok(q); pass++;
 const debt=analyzeDebtPortfolio(d.debts||[],{policyId:'balanced',declaredMonthlyPayment:d.profile.existingDebtPayments}); assert.ok(debt); pass++;
 const inc=calculateIncluscore({profile:d.profile,evidence:d.evidence,cashflow:c,quality:q,debt},{policyId:'balanced'}); assert.ok(Number.isFinite(Number(inc.score??inc.totalScore))); pass++;
}
const custom=buildCustomCase({name:'Entreprise Test SARL',applicantType:'Personne morale',legalForm:'SARL',city:'Bamako',informalIncome:500000,essentialExpenses:220000,requestedAmount:600000,durationMonths:18,sales:[500000,550000,520000],costs:[220000,240000,230000]});
assert.equal(custom.person.applicantType,'Personne morale'); pass++;
assert.equal(custom.person.legalForm,'SARL'); pass++;
assert.equal(custom.creditRequest.amount,600000); pass++;
console.log(`PASS ${pass}/${pass} — moteurs et scénarios essentiels`);

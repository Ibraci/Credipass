import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
const L = await import('../src/modules/creditLedgerR15.js');
const { can, DEMO_USERS } = await import('../src/modules/accessControlR18.js');

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const user = login => DEMO_USERS.find(u => u.login === login);
const next = (x, id) => L.workflowState(x, id).next;

check('circuit unique Agent → Analyste → Comité pour tous les produits', () => {
  for (const product of ['Crédit salarié', 'Crédit PME', 'Crédit élevage']) {
    assert.deepEqual(L.productDefinition(product).workflow, ['AGENT_CREDIT', 'ANALYSTE_RESPONSABLE_CREDIT', 'COMITE_CREDIT']);
  }
});

check('droits : l’agent soumet, l’analyste valide, le comité décide', () => {
  assert.ok(can(user('agent.credit'), 'SUBMIT_ANALYSIS'));
  assert.ok(!can(user('agent.credit'), 'SUPERVISOR_VALIDATE'));
  assert.ok(can(user('analyste.credit'), 'SUPERVISOR_VALIDATE'));
  assert.ok(!can(user('analyste.credit'), 'CREDIT_APPROVE'));
  assert.ok(can(user('comite.credit'), 'CREDIT_APPROVE'));
});

check('anciennes étapes Superviseur / Chef d’agence reconnues comme Analyste', () => {
  const x = L.load();
  x.workflowActions.push({ id: 'WF-OLD', applicationId: 'DOS-0002', step: 'AGENT_CREDIT', status: 'VALIDÉ', at: '2026-01-01' });
  x.workflowActions.push({ id: 'WF-OLD2', applicationId: 'DOS-0002', step: 'CHEF_AGENCE_ANALYSTE', status: 'VALIDÉ', at: '2026-01-02' });
  assert.equal(next(x, 'DOS-0002'), 'COMITE_CREDIT');
});

check('avis de l’agent : appréciation et motivation obligatoires', () => {
  const x = L.load();
  assert.throws(() => L.submitAgentOpinion(x, 'DOS-0006', { risk: 'Peut-être', opinion: 'x' }, 'Agent'));
  assert.throws(() => L.submitAgentOpinion(x, 'DOS-0006', { risk: 'Risque acceptable', opinion: ' ' }, 'Agent'));
  L.submitAgentOpinion(x, 'DOS-0006', { risk: 'Risque élevé', opinion: 'Capacité juste' }, 'Agent');
  assert.equal(next(x, 'DOS-0006'), 'ANALYSTE_RESPONSABLE_CREDIT');
  assert.equal(L.workflowState(x, 'DOS-0006').agentOpinion.risk, 'Risque élevé');
});

check('l’analyste ne peut pas transmettre avant l’avis de l’agent', () => {
  const x = L.load();
  assert.throws(() => L.recordAnalystReview(x, 'DOS-0007', { risk: 'Risque acceptable', opinion: 'OK', outcome: 'TRANSMIS' }, 'Analyste'), /agent/);
});

check('renvoi par l’analyste : le dossier revient à l’agent avec le motif', () => {
  const x = L.load();
  L.submitAgentOpinion(x, 'DOS-0006', { risk: 'Risque acceptable', opinion: 'OK' }, 'Agent');
  L.recordAnalystReview(x, 'DOS-0006', { opinion: 'Bulletin de salaire manquant', outcome: 'RENVOYÉ' }, 'Analyste');
  const w = L.workflowState(x, 'DOS-0006');
  assert.equal(w.next, 'AGENT_CREDIT');
  assert.equal(w.returned.note, 'Bulletin de salaire manquant');
});

check('ajourné : retour à l’agent, puis nouveau passage par l’analyste', () => {
  const x = L.load();
  L.recordAnalystReview(x, 'DOS-0005', { risk: 'Risque acceptable', opinion: 'OK', outcome: 'TRANSMIS' }, 'Analyste');
  assert.equal(next(x, 'DOS-0005'), 'COMITE_CREDIT');
  L.recordDecision(x, { applicationId: 'DOS-0005', decision: 'AJOURNÉ', reason: 'DGA à compléter' }, 'Comité');
  assert.equal(next(x, 'DOS-0005'), 'AGENT_CREDIT');
  L.submitAgentOpinion(x, 'DOS-0005', { risk: 'Risque acceptable', opinion: 'DGA complétée' }, 'Agent');
  assert.equal(next(x, 'DOS-0005'), 'ANALYSTE_RESPONSABLE_CREDIT');
});

check('décision du comité : conditions du formulaire enregistrées', () => {
  const x = L.load();
  L.recordAnalystReview(x, 'DOS-0005', { risk: 'Risque acceptable', opinion: 'OK', outcome: 'TRANSMIS' }, 'Analyste');
  const v = L.recordDecision(x, { applicationId: 'DOS-0005', decision: 'VALIDÉ', approvedAmount: 600000, annualRate: 18, durationMonths: 12, periodicity: 'Mensuelle', membersPresent: 'A, B, C', directorSignature: 'Non', reason: 'OK' }, 'Comité');
  assert.equal(v.approvedAmount, 600000);
  assert.equal(v.installments, 12);
  assert.ok(v.installmentAmount > 50000);
  assert.equal(v.membersPresent, 'A, B, C');
  assert.equal(v.workflowWarning, undefined);
  assert.equal(next(x, 'DOS-0005'), 'TERMINÉ');
});

check('comité non bloqué, mais la décision garde la trace des étapes manquantes', () => {
  const x = L.load();
  const v = L.recordDecision(x, { applicationId: 'DOS-0006', decision: 'REFUSÉ', reason: 'Capacité insuffisante' }, 'Comité');
  assert.match(v.workflowWarning, /agent/);
});

check('au-delà de 5 000 000 FCFA, l’étape finale est la Direction générale', () => {
  const x = L.load();
  const big = x.applications.find(a => a.requestedAmount > 5000000) || x.applications.find(a => a.id === 'DOS-0005');
  big.requestedAmount = 6000000;
  const w = L.workflowState(x, big.id);
  assert.deepEqual(w.steps, ['AGENT_CREDIT', 'ANALYSTE_RESPONSABLE_CREDIT', 'DIRECTION']);
  assert.equal(w.finalStep, 'DIRECTION');
  assert.throws(() => L.recordDecision(x, { applicationId: big.id, decision: 'REFUSÉ', reason: 'x' }, 'Comité', { role: 'COMITE_CREDIT' }), /Direction générale/);
  const v = L.recordDecision(x, { applicationId: big.id, decision: 'REFUSÉ', reason: 'Hors capacité' }, 'Direction', { role: 'DIRECTION' });
  assert.equal(v.authority, 'Direction générale');
  assert.equal(L.workflowState(x, big.id).stepStates.at(-1).done, true);
});

console.log(`WORKFLOW: ${passed} PASS`);

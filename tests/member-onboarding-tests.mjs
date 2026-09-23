import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
const L = await import('../src/modules/creditLedgerR15.js');
const MO = await import('../src/modules/memberOnboarding.js');
const { validateProductRequest } = await import('../src/modules/productCatalogR186.js');

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

// Données synthétiques uniquement.
const company = (over = {}) => ({
  memberNo: 'M-9001', accountNumber: 'CPT-9001', legalName: 'Société Test Céréales SARL', legalForm: 'SARL',
  rccm: 'MA.BKO.2020.B.0001', nif: '000000001X', address: 'Zone industrielle', city: 'Bamako', phone: '70 00 00 01',
  activity: 'Négoce de céréales', annualTurnover: '48000000',
  s1_name: 'Dirigeant Fictif Un', s1_role: 'Gérant', s1_idNumber: 'ID-TEST-001', s1_nationality: 'Malienne',
  bo_hasOwner: 'Oui', bo_name: 'Dirigeant Fictif Un', bo_link: 'Associé majoritaire',
  fundsOrigin: 'Apport des associés', riskProfile: 'Moyen', ppe: 'Non',
  doc_statutes: 'Oui', doc_rccm: 'Oui', doc_directorsId: 'Oui', doc_beneficiariesId: 'Oui',
  ...over
});

check('personne morale : création complète selon la fiche d’adhésion', () => {
  const x = L.load();
  const before = x.members.length;
  const m = MO.createLegalEntityMember(x, company(), 'Agent', { agency: 'Agence principale' });
  assert.equal(x.members.length, before + 1);
  assert.equal(m.type, 'Personne morale');
  assert.equal(m.name, 'Société Test Céréales SARL');
  assert.equal(m.signatories.length, 1);
  assert.equal(m.signatories[0].role, 'Gérant');
  assert.equal(m.beneficialOwner.hasOwnerAbove25, 'Oui');
  assert.equal(m.annualTurnover, 48000000);
  assert.equal(m.documentsProvided.statutes, true);
  assert.equal(m.documentsProvided.mandate, false);
  assert.equal(m.agency, 'Agence principale');
  assert.deepEqual(MO.kycGaps(m), []);
});

check('personne morale : contrôles bloquants', () => {
  const x = L.load();
  assert.throws(() => MO.createLegalEntityMember(x, company({ legalName: '' }), 'Agent'), /Raison sociale/);
  assert.throws(() => MO.createLegalEntityMember(x, company({ legalForm: '' }), 'Agent'), /Forme juridique/);
  assert.throws(() => MO.createLegalEntityMember(x, company({ rccm: '' }), 'Agent'), /RCCM/);
  assert.throws(() => MO.createLegalEntityMember(x, company({ s1_name: '', s1_role: '', s1_idNumber: '', s1_nationality: '' }), 'Agent'), /signataire/);
  assert.throws(() => MO.createLegalEntityMember(x, company({ s2_name: 'Second', s2_role: '' }), 'Agent'), /Signataire 2/);
  assert.throws(() => MO.createLegalEntityMember(x, company({ bo_name: '' }), 'Agent'), /Bénéficiaire/);
});

check('association : récépissé à la place du RCCM, profil Groupe / Coopérative', () => {
  const x = L.load();
  assert.throws(() => MO.createLegalEntityMember(x, company({ legalForm: 'Association', rccm: '' }), 'Agent'), /récépissé/);
  const m = MO.createLegalEntityMember(x, company({ legalForm: 'Association', rccm: '', associationReceipt: 'REC-TEST-01', doc_approval: 'Oui' }), 'Agent');
  assert.equal(m.type, 'Groupe / Coopérative');
  assert.ok(!MO.kycGaps(m).some(g => /RCCM/.test(g)));
});

check('personne morale : éléments KYC manquants et alertes PPE', () => {
  const x = L.load();
  const m = MO.createLegalEntityMember(x, company({ nif: '', bo_hasOwner: 'Non renseigné', doc_statutes: '', ppe: 'Oui', riskProfile: 'Moyen' }), 'Agent');
  const gaps = MO.kycGaps(m);
  assert.ok(gaps.some(g => /NIF/.test(g)));
  assert.ok(gaps.some(g => /Bénéficiaire effectif/.test(g)));
  assert.ok(gaps.some(g => /statuts/.test(g)));
  assert.ok(MO.kycAlerts(m).some(a => /PPE/.test(a)));
});

check('personne morale : modification conserve le n° et la date d’adhésion', () => {
  const x = L.load();
  const m = MO.createLegalEntityMember(x, company({ joinedAt: '2026-01-15' }), 'Agent');
  const v = MO.updateLegalEntityMember(x, m.id, company({ s2_name: 'Dirigeant Fictif Deux', s2_role: 'Co-gérant', s2_idNumber: 'ID-TEST-002', joinedAt: '' }), 'Agent');
  assert.equal(v.id, m.id);
  assert.equal(v.memberNo, 'M-9001');
  assert.equal(v.joinedAt, '2026-01-15');
  assert.equal(v.signatories.length, 2);
  assert.ok(MO.kycAlerts(v).some(a => /mandat/.test(a)));
});

check('personne physique : création, contrôles et KYC', () => {
  const x = L.load();
  assert.throws(() => MO.createNaturalPersonMember(x, { firstNames: 'Awa' }, 'Agent'), /Nom/);
  const m = MO.createNaturalPersonMember(x, { firstNames: 'Awa', lastName: 'Test', phone: '70 00 00 02', city: 'Kayes', profession: 'Commerçante', idNumber: 'ID-TEST-003', birthDate: '1990-05-01', riskProfile: 'Faible', doc_identity: 'Oui' }, 'Agent');
  assert.equal(m.type, 'Personne physique');
  assert.equal(m.name, 'Awa Test');
  assert.equal(m.activity, 'Commerçante');
  assert.deepEqual(MO.kycGaps(m), []);
  const v = MO.updateNaturalPersonMember(x, m.id, { firstNames: 'Awa', lastName: 'Test', phone: '70 00 00 09', type: 'Entrepreneur individuel' }, 'Agent');
  assert.equal(v.phone, '70 00 00 09');
  assert.equal(v.type, 'Entrepreneur individuel');
});

check('les produits de crédit tiennent compte du type de membre', () => {
  const x = L.load();
  const physique = validateProductRequest(x, { product: 'Crédit salarié', requestedAmount: 500000, durationMonths: 12, periodicity: 'Mensuelle', memberType: 'Personne physique' });
  const morale = validateProductRequest(x, { product: 'Crédit salarié', requestedAmount: 500000, durationMonths: 12, periodicity: 'Mensuelle', memberType: 'Personne morale' });
  assert.equal(physique.ok, true);
  assert.equal(morale.ok, false);
});

console.log(`MEMBER ONBOARDING: ${passed} PASS`);

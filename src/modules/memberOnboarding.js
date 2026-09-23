// Adhésion des membres : personne physique ou personne morale.
// Personne morale : reprend la « Fiche d'adhésion — Personne morale » de l'institution
// (identification de la société, dirigeants signataires, bénéficiaires effectifs,
// origine des fonds, classification du risque, pièces fournies).
import { addMember, updateMember } from './creditLedgerR14.js';

export const NATURAL_TYPES = ['Personne physique', 'Entrepreneur individuel'];
export const LEGAL_TYPES = ['Personne morale', 'Groupe / Coopérative'];
export const LEGAL_FORMS = ['SA', 'SARL', 'SAS', 'GIE', 'Association', 'Coopérative', 'Autre'];
// Formes regroupant des membres : rattachées au profil produit « Groupe / Coopérative ».
const GROUP_FORMS = ['GIE', 'Association', 'Coopérative'];
export const MAX_SIGNATORIES = 3;
export const RISK_PROFILES = ['Faible', 'Moyen', 'Élevé'];

export const LEGAL_DOCUMENTS = Object.freeze([
  { key: 'approval', label: 'Copie agrément / récépissé' },
  { key: 'statutes', label: 'Copie des statuts' },
  { key: 'rccm', label: 'Copie RCCM' },
  { key: 'nif', label: 'Copie NIF' },
  { key: 'directorsId', label: 'Copie CNI des dirigeants' },
  { key: 'beneficiariesId', label: 'Copie CNI des bénéficiaires effectifs' },
  { key: 'mandate', label: 'Copie mandat / procuration' }
]);

export const SIGNATORY_FIELDS = Object.freeze([
  ['name', 'Prénoms & nom'], ['nationality', 'Nationalité'], ['birthDate', 'Date de naissance'],
  ['birthPlace', 'Lieu de naissance'], ['role', 'Fonction dans la société'], ['idType', 'Type de pièce d’identité'],
  ['idNumber', 'N° de pièce d’identité'], ['address', 'Adresse'], ['phone', 'Téléphone']
]);

const text = v => String(v ?? '').trim();
const yes = v => v === true || v === 'Oui';

export const isLegalEntity = member => LEGAL_TYPES.includes(member?.type);
export const legalTypeFor = legalForm => GROUP_FORMS.includes(legalForm) ? 'Groupe / Coopérative' : 'Personne morale';

// Lit les champs du formulaire (s1_name, s2_role…) et construit la fiche de la société.
export function legalEntityFromForm(d = {}) {
  const signatories = [];
  for (let i = 1; i <= MAX_SIGNATORIES; i++) {
    const s = Object.fromEntries(SIGNATORY_FIELDS.map(([key]) => [key, text(d[`s${i}_${key}`])]));
    if (Object.values(s).some(Boolean)) signatories.push(s);
  }
  const legalForm = text(d.legalForm);
  return {
    type: legalTypeFor(legalForm),
    name: text(d.legalName),
    legalName: text(d.legalName),
    legalForm,
    rccm: text(d.rccm),
    nif: text(d.nif),
    inps: text(d.inps),
    associationReceipt: text(d.associationReceipt),
    address: text(d.address),
    city: text(d.city),
    phone: text(d.phone),
    email: text(d.email),
    activity: text(d.activity),
    annualTurnover: Number(d.annualTurnover) || 0,
    accountNumber: text(d.accountNumber),
    branch: text(d.branch),
    signatories,
    beneficialOwner: {
      hasOwnerAbove25: text(d.bo_hasOwner) || 'Non renseigné',
      name: text(d.bo_name),
      birthDate: text(d.bo_birthDate),
      birthPlace: text(d.bo_birthPlace),
      nationality: text(d.bo_nationality),
      link: text(d.bo_link),
      indirectControl: text(d.bo_indirectControl)
    },
    fundsOrigin: text(d.fundsOrigin),
    plannedOperations: text(d.plannedOperations),
    riskProfile: text(d.riskProfile),
    ppe: yes(d.ppe) ? 'Oui' : 'Non',
    documentsProvided: Object.fromEntries(LEGAL_DOCUMENTS.map(doc => [doc.key, yes(d[`doc_${doc.key}`])])),
    joinedAt: text(d.joinedAt),
    joinPlace: text(d.joinPlace)
  };
}

// Contrôles bloquants à la création : ce sans quoi la fiche n'identifie pas la société.
export function validateLegalEntity(e) {
  const errors = [];
  if (!e.legalName) errors.push('Raison sociale obligatoire');
  if (!LEGAL_FORMS.includes(e.legalForm)) errors.push('Forme juridique obligatoire');
  if (e.legalForm === 'Association' ? !e.associationReceipt : !e.rccm) {
    errors.push(e.legalForm === 'Association' ? 'N° de récépissé obligatoire pour une association' : 'N° RCCM / agrément obligatoire');
  }
  if (!e.signatories.length) errors.push('Au moins un dirigeant signataire est obligatoire');
  e.signatories.forEach((s, i) => {
    if (!s.name || !s.role || !s.idNumber) errors.push(`Signataire ${i + 1} : nom, fonction et n° de pièce obligatoires`);
  });
  if (e.beneficialOwner.hasOwnerAbove25 === 'Oui' && !e.beneficialOwner.name) errors.push('Bénéficiaire effectif : nom obligatoire');
  return errors;
}

// Éléments de connaissance du client (KYC) encore manquants : non bloquants, affichés à l'agent.
export function kycGaps(member) {
  const gaps = [];
  if (isLegalEntity(member)) {
    if (!member.nif) gaps.push('N° d’identification fiscale (NIF)');
    if (!member.address) gaps.push('Adresse du siège');
    if (!member.phone) gaps.push('Téléphone');
    if (!member.fundsOrigin) gaps.push('Origine de l’apport initial');
    if (!member.riskProfile) gaps.push('Profil de risque');
    if (member.beneficialOwner?.hasOwnerAbove25 === 'Non renseigné') gaps.push('Bénéficiaire effectif (> 25 % du capital)');
    const docs = member.documentsProvided || {};
    const required = ['statutes', 'directorsId', member.legalForm === 'Association' ? 'approval' : 'rccm'];
    if (member.beneficialOwner?.hasOwnerAbove25 === 'Oui') required.push('beneficiariesId');
    for (const key of required) if (!docs[key]) gaps.push(`Pièce : ${LEGAL_DOCUMENTS.find(d => d.key === key).label}`);
  } else {
    if (!member.idNumber) gaps.push('N° de pièce d’identité');
    if (!member.birthDate) gaps.push('Date de naissance');
    if (!member.address && !member.city) gaps.push('Adresse');
    if (!member.phone) gaps.push('Téléphone');
    if (!member.riskProfile) gaps.push('Profil de risque');
    if (!member.documentsProvided?.identity) gaps.push('Pièce : copie de la pièce d’identité');
  }
  return gaps;
}

// Alertes de vigilance : une personne politiquement exposée impose un profil de risque élevé.
export function kycAlerts(member) {
  const alerts = [];
  if (member.ppe === 'Oui' && member.riskProfile !== 'Élevé') alerts.push('Dirigeant ou bénéficiaire PPE : le profil de risque devrait être « Élevé »');
  if (isLegalEntity(member) && member.signatories?.length && member.documentsProvided && !member.documentsProvided.mandate && member.signatories.length > 1) {
    alerts.push('Plusieurs signataires : joindre le mandat / la procuration');
  }
  return alerts;
}

export function createLegalEntityMember(x, form, actor, context = {}) {
  const entity = legalEntityFromForm(form);
  const errors = validateLegalEntity(entity);
  if (errors.length) throw Error(errors.join(' · '));
  const member = addMember(x, { ...entity, memberNo: text(form.memberNo) || undefined, joinedAt: entity.joinedAt || undefined }, actor);
  Object.assign(member, entity, { memberNo: member.memberNo, joinedAt: member.joinedAt }, context);
  return member;
}

export function updateLegalEntityMember(x, id, form, actor) {
  const entity = legalEntityFromForm(form);
  const errors = validateLegalEntity(entity);
  if (errors.length) throw Error(errors.join(' · '));
  const member = updateMember(x, id, { ...entity, memberNo: text(form.memberNo) || undefined }, actor);
  Object.assign(member, entity, { joinedAt: entity.joinedAt || member.joinedAt });
  return member;
}

// Personne physique : fiche d'adhésion individuelle (identité, coordonnées, pièce, activité, risque).
export const NATURAL_FIELDS = Object.freeze([
  'firstNames', 'lastName', 'birthDate', 'birthPlace', 'nationality', 'originCountry', 'sex', 'fatherName', 'motherName',
  'maritalStatus', 'dependents', 'city', 'district', 'address', 'housing', 'addressSince', 'phone', 'email',
  'idType', 'idNumber', 'idIssuedAt', 'idExpiresAt', 'idIssuePlace', 'profession', 'sector', 'activity',
  'economicStatus', 'employerName', 'employerAddress', 'fundsOrigin', 'accountPurpose', 'riskProfile', 'ppeLink',
  'accountNumber', 'branch', 'joinPlace'
]);

export function naturalPersonFromForm(d = {}) {
  const person = Object.fromEntries(NATURAL_FIELDS.map(key => [key, text(d[key])]));
  return {
    ...person,
    type: NATURAL_TYPES.includes(d.type) ? d.type : 'Personne physique',
    name: [person.firstNames, person.lastName].filter(Boolean).join(' '),
    activity: person.activity || person.profession || person.sector,
    monthlyIncome: Number(d.monthlyIncome) || 0,
    ppe: yes(d.ppe) ? 'Oui' : 'Non',
    documentsProvided: { identity: yes(d.doc_identity), residence: yes(d.doc_residence), income: yes(d.doc_income) },
    joinedAt: text(d.joinedAt)
  };
}

export function validateNaturalPerson(p) {
  const errors = [];
  if (!p.lastName) errors.push('Nom obligatoire');
  if (!p.firstNames) errors.push('Prénom(s) obligatoire(s)');
  if (!p.phone) errors.push('Téléphone obligatoire');
  return errors;
}

export function createNaturalPersonMember(x, form, actor, context = {}) {
  const person = naturalPersonFromForm(form);
  const errors = validateNaturalPerson(person);
  if (errors.length) throw Error(errors.join(' · '));
  const member = addMember(x, { ...person, memberNo: text(form.memberNo) || undefined, joinedAt: person.joinedAt || undefined }, actor);
  Object.assign(member, person, { memberNo: member.memberNo, joinedAt: member.joinedAt }, context);
  return member;
}

export function updateNaturalPersonMember(x, id, form, actor) {
  const person = naturalPersonFromForm(form);
  const errors = validateNaturalPerson(person);
  if (errors.length) throw Error(errors.join(' · '));
  const member = updateMember(x, id, { ...person, memberNo: text(form.memberNo) || undefined }, actor);
  Object.assign(member, person, { joinedAt: person.joinedAt || member.joinedAt });
  return member;
}

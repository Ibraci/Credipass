export const FINANCIAL_PASSPORT_ENGINE_VERSION = '1.7.0';

export const PASSPORT_SECTION_IDS = Object.freeze([
  'identity', 'activity', 'confidence', 'incluscore', 'financialHealth',
  'debtRisk', 'recommendation', 'humanDecision', 'engineVersions', 'limitations'
]);

export const SHARE_PURPOSES = Object.freeze([
  'credit-assessment', 'committee-review', 'pilot-verification', 'beneficiary-copy'
]);

export const PROHIBITED_PASSPORT_FIELDS = Object.freeze([
  'religion', 'ethnicity', 'political-opinion', 'private-messages',
  'phone-contacts', 'social-media-behaviour', 'unconsented-third-party-data',
  'raw-document-bytes', 'national-id-full-number'
]);

const clone = value => JSON.parse(JSON.stringify(value));
const round = (value, digits = 0) => Number(Number(value || 0).toFixed(digits));

function stableId(prefix, parts) {
  const input = parts.map(value => String(value ?? '')).join('|');
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

function iso(value, fallback = '2026-08-06T16:30:00.000Z') {
  const date = value ? new Date(value) : new Date(fallback);
  if (Number.isNaN(date.getTime())) throw new TypeError('A valid ISO date is required');
  return date.toISOString();
}

function addDays(dateIso, days) {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString();
}

function randomTokenHex(bytes = 32, entropy) {
  if (entropy) {
    const input = String(entropy);
    let out = '';
    for (let block = 0; out.length < bytes * 2; block++) {
      let hash = 2166136261;
      const source = `${input}|${block}`;
      for (let i = 0; i < source.length; i++) {
        hash ^= source.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      out += (hash >>> 0).toString(16).padStart(8, '0');
    }
    return out.slice(0, bytes * 2);
  }
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random generation is unavailable');
  const buffer = new Uint8Array(bytes);
  cryptoApi.getRandomValues(buffer);
  return [...buffer].map(value => value.toString(16).padStart(2, '0')).join('');
}

function passportStatus(humanDecision, appeal) {
  if (appeal?.status === 'submitted' || appeal?.reassessmentRequired) return 'suspended-for-review';
  if (humanDecision?.status === 'final' && humanDecision.communicatedAt) return 'issued';
  return 'draft';
}

function decisionSnapshot(humanDecision) {
  if (!humanDecision) return {
    status: 'pending', option: null, approvedAmount: 0, reason: null,
    conditions: [], decidedBy: null, decidedAt: null, communicatedAt: null,
    recommendationPreserved: true
  };
  return {
    decisionId: humanDecision.decisionId,
    status: humanDecision.status,
    option: humanDecision.option,
    approvedAmount: Number(humanDecision.approvedAmount || 0),
    reason: humanDecision.reason,
    conditions: clone(humanDecision.conditions || []),
    decidedBy: humanDecision.actor ? { id: humanDecision.actor.id, name: humanDecision.actor.name, role: humanDecision.actor.role } : null,
    decidedAt: humanDecision.decidedAt,
    communicatedAt: humanDecision.communicatedAt,
    secondReviewRequired: Boolean(humanDecision.secondReviewRequired),
    secondReview: clone(humanDecision.secondReview),
    recommendationPreserved: Boolean(humanDecision.override?.originalRecommendationPreserved ?? true)
  };
}

export function createFinancialPassport(inputs = {}, options = {}) {
  const required = ['data', 'quality', 'incluscore', 'health', 'debt', 'simulation', 'policyEvaluation', 'recommendation', 'workflow'];
  required.forEach(key => { if (!inputs[key]) throw new TypeError(`${key} is required`); });
  const { data, quality, incluscore, health, debt, simulation, policyEvaluation, recommendation, workflow, humanDecision, appeal } = inputs;
  if (!data.person?.id || !data.person?.name) throw new TypeError('A valid beneficiary identity is required');
  const status = passportStatus(humanDecision, appeal);
  const assessmentAt = iso(options.assessmentAt || policyEvaluation.assessedAt || '2026-08-06T16:30:00.000Z');
  const issuedAt = status === 'issued' ? iso(humanDecision.communicatedAt) : null;
  const revision = Number(workflow.revision || 1);
  const passportId = stableId('CP-ML', [
    data.person.id, recommendation.referenceId, revision,
    humanDecision?.decisionId || 'NO-DECISION', FINANCIAL_PASSPORT_ENGINE_VERSION
  ]);

  const recommendationSnapshot = {
    referenceId: recommendation.referenceId,
    code: recommendation.recommendationCode,
    scope: recommendation.recommendationScope,
    requestedAmount: Number(recommendation.proposedFinancing.requestedAmount || 0),
    proposedPrincipal: Number(recommendation.proposedFinancing.principal || 0),
    durationMonths: Number(recommendation.proposedFinancing.durationMonths || 0),
    scheduleType: recommendation.proposedFinancing.scheduleType,
    maximumPayment: Number(recommendation.proposedFinancing.maximumPayment || 0),
    conditions: clone(recommendation.conditions || []),
    blockingIssues: clone(recommendation.blockingIssues || []),
    nonBinding: true
  };

  const passport = {
    passportId,
    engineVersion: FINANCIAL_PASSPORT_ENGINE_VERSION,
    schemaVersion: '1.0',
    status,
    countryCode: 'ML',
    languages: ['fr', 'en'],
    assessmentAt,
    issuedAt,
    lastUpdatedAt: issuedAt || assessmentAt,
    holder: {
      beneficiaryId: data.person.id,
      displayName: data.person.name,
      country: data.person.country,
      city: data.person.city
    },
    activity: {
      activityKey: data.person.activityKey,
      activityAgeMonths: Number(data.profile.activityAgeMonths || 0),
      cooperativeMembershipMonths: Number(data.profile.cooperativeMembershipMonths || 0),
      requestedPurposeKey: data.creditRequest?.purposeKey || null
    },
    indicators: {
      dataConfidence: round(quality.confidence),
      dataConfidenceBand: quality.band,
      incluscore: round(incluscore.score),
      incluscoreBand: incluscore.publishedBand,
      incluscoreMeaning: 'preparation-and-financial-sustainability-index',
      financialHealth: round(health.score),
      financialHealthBand: health.band,
      overIndebtednessRisk: round(debt.overIndebtedness.riskScore),
      overIndebtednessBand: debt.overIndebtedness.band,
      safeAdditionalMonthlyPayment: round(health.amounts.safeAdditionalMonthlyPayment),
      prudentRestToLive: round(health.amounts.restToLiveAfterDebt)
    },
    recommendation: recommendationSnapshot,
    humanDecision: decisionSnapshot(humanDecision),
    workflow: {
      caseId: workflow.caseId,
      revision,
      currentStage: workflow.currentStage,
      decisionFinalAndCommunicated: status === 'issued'
    },
    consentAndSharing: {
      holderControlsSharing: true,
      activeShareRequired: true,
      defaultSections: clone(PASSPORT_SECTION_IDS),
      maximumShareDurationDays: 30,
      revocationSupported: true,
      opaqueVerificationTokenOnly: true,
      sensitiveDataInVerificationUrl: false
    },
    engineVersions: {
      financialPassport: FINANCIAL_PASSPORT_ENGINE_VERSION,
      dataQuality: quality.engineVersion,
      incluscore: incluscore.engineVersion,
      financialHealth: health.engineVersion,
      debt: debt.engineVersion,
      simulation: simulation.engineVersion,
      policy: policyEvaluation.engineVersion,
      recommendation: recommendation.engineVersion,
      workflow: workflow.engineVersion,
      humanDecision: humanDecision?.engineVersion || null
    },
    appliedPolicy: {
      id: policyEvaluation.policy.id,
      version: policyEvaluation.policy.version,
      effectiveFrom: policyEvaluation.policy.effectiveFrom,
      rulePassRate: round(policyEvaluation.summary.passRate, 2)
    },
    excludedData: clone(PROHIBITED_PASSPORT_FIELDS),
    uncertainties: [
      ...(quality.uncertainties || []),
      ...(incluscore.uncertainties || []),
      ...(health.uncertainties || []),
      ...(status === 'draft' ? ['human-decision-not-final-and-communicated'] : []),
      ...(status === 'suspended-for-review' ? ['passport-sharing-suspended-during-review'] : [])
    ].filter((value, index, array) => value && array.indexOf(value) === index),
    limitations: [
      'not-a-probability-of-default',
      'not-an-automatic-credit-decision',
      'depends-on-available-and-consented-data',
      'institution-must-validate-rules-and-contractual-terms',
      'demo-verification-requires-production-backend-signature'
    ],
    safeguards: {
      recommendationSeparatedFromDecision: true,
      noSensitiveDataInVerifier: true,
      rawEvidenceNotEmbedded: true,
      automaticDecisionAllowed: false,
      humanValidationRequired: true,
      shareCreationAllowed: status === 'issued',
      printPreviewAllowed: true,
      productionQrReadyPayload: true,
      productionCryptographicSignatureImplemented: false
    }
  };

  passport.integrityReference = stableId('MANIFEST', [
    passport.passportId,
    passport.status,
    passport.indicators.dataConfidence,
    passport.indicators.incluscore,
    passport.indicators.financialHealth,
    passport.recommendation.referenceId,
    passport.humanDecision.decisionId || 'PENDING',
    Object.values(passport.engineVersions).join('|')
  ]);
  return passport;
}

function validateSections(passport, sections) {
  const requested = [...new Set((sections || []).map(String))];
  if (!requested.length) throw new Error('At least one passport section must be selected');
  requested.forEach(section => {
    if (!PASSPORT_SECTION_IDS.includes(section)) throw new Error(`Unsupported passport section: ${section}`);
  });
  if (!requested.includes('limitations')) requested.push('limitations');
  if (!requested.includes('engineVersions')) requested.push('engineVersions');
  return requested;
}

export function createPassportShareGrant(passport, request = {}, options = {}) {
  if (!passport?.passportId) throw new TypeError('passport.passportId is required');
  if (passport.status !== 'issued' || !passport.safeguards.shareCreationAllowed) throw new Error('Only an issued passport can be shared');
  if (!request.consent?.granted || !request.consent?.actorId) throw new Error('Explicit beneficiary consent is required');
  const recipientInstitution = String(request.recipientInstitution || '').trim();
  if (recipientInstitution.length < 3) throw new Error('Recipient institution is required');
  const purpose = String(request.purpose || 'credit-assessment');
  if (!SHARE_PURPOSES.includes(purpose)) throw new Error('Unsupported sharing purpose');
  const durationDays = Number(request.durationDays || 7);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > passport.consentAndSharing.maximumShareDurationDays) {
    throw new Error(`Share duration must be between 1 and ${passport.consentAndSharing.maximumShareDurationDays} days`);
  }
  const sections = validateSections(passport, request.sections || PASSPORT_SECTION_IDS);
  const createdAt = iso(options.at || request.consent.at || new Date().toISOString());
  const token = randomTokenHex(32, options.entropy);
  const verifierBaseUrl = String(options.verifierBaseUrl || 'https://verify.credipass.local/v').replace(/\/$/, '');
  const verificationUrl = `${verifierBaseUrl}/${token}`;
  const grantId = stableId('SHARE', [passport.passportId, recipientInstitution, purpose, createdAt, token.slice(0, 16)]);
  return {
    grantId,
    passportId: passport.passportId,
    passportIntegrityReference: passport.integrityReference,
    status: 'active',
    recipientInstitution,
    purpose,
    sections,
    createdAt,
    expiresAt: addDays(createdAt, durationDays),
    revokedAt: null,
    revocationReason: null,
    consent: {
      granted: true,
      actorId: request.consent.actorId,
      actorName: request.consent.actorName || null,
      at: iso(request.consent.at || createdAt),
      withdrawable: true
    },
    verification: {
      token,
      tokenPreview: `${token.slice(0, 8)}…${token.slice(-6)}`,
      url: verificationUrl,
      qrPayload: verificationUrl,
      containsPersonalData: false,
      productionSignatureRequired: true,
      demoLocalRegistryOnly: true
    },
    safeguards: {
      beneficiaryConsentRequired: true,
      dataMinimisationApplied: true,
      opaqueTokenOnly: true,
      revocable: true,
      expiresAutomatically: true,
      rawEvidenceExcluded: true
    }
  };
}

export function evaluatePassportShareGrant(grant, options = {}) {
  if (!grant?.grantId) return { status: 'none', active: false, reason: 'no-grant' };
  if (grant.status === 'revoked') return { status: 'revoked', active: false, reason: 'revoked', at: grant.revokedAt };
  const asOf = new Date(iso(options.asOf || new Date().toISOString()));
  const expires = new Date(grant.expiresAt);
  if (asOf.getTime() >= expires.getTime()) return { status: 'expired', active: false, reason: 'expired', at: grant.expiresAt };
  return { status: 'active', active: true, reason: 'within-authorised-period', at: asOf.toISOString() };
}

export function revokePassportShareGrant(grant, actor = {}, reason = '', options = {}) {
  if (!grant?.grantId) throw new TypeError('grant.grantId is required');
  if (!actor?.id) throw new Error('Revocation actor is required');
  const text = String(reason || '').trim();
  if (text.length < 12) throw new Error('Revocation reason must contain at least 12 characters');
  const next = clone(grant);
  next.status = 'revoked';
  next.revokedAt = iso(options.at || new Date().toISOString());
  next.revocationReason = text;
  next.revokedBy = { id: actor.id, name: actor.name || null, role: actor.role || null };
  return next;
}

export function buildPassportDisclosure(passport, grant, options = {}) {
  if (!passport?.passportId || !grant?.grantId) throw new TypeError('passport and grant are required');
  if (passport.status !== 'issued') throw new Error('Passport disclosure is suspended until the passport is issued and outside reassessment');
  if (grant.passportId !== passport.passportId) throw new Error('Grant does not belong to this passport');
  const state = evaluatePassportShareGrant(grant, options);
  if (!state.active) throw new Error(`Share grant is not active: ${state.status}`);
  const output = {
    passportId: passport.passportId,
    status: passport.status,
    integrityReference: passport.integrityReference,
    assessmentAt: passport.assessmentAt,
    issuedAt: passport.issuedAt,
    shareGrant: {
      grantId: grant.grantId,
      recipientInstitution: grant.recipientInstitution,
      purpose: grant.purpose,
      expiresAt: grant.expiresAt
    }
  };
  const map = {
    identity: ['holder'], activity: ['activity'], confidence: ['indicators'],
    incluscore: ['indicators'], financialHealth: ['indicators'], debtRisk: ['indicators'],
    recommendation: ['recommendation'], humanDecision: ['humanDecision'],
    engineVersions: ['engineVersions', 'appliedPolicy'], limitations: ['limitations', 'safeguards']
  };
  grant.sections.forEach(section => (map[section] || []).forEach(key => { output[key] = clone(passport[key]); }));
  output.excludedData = clone(passport.excludedData);
  return output;
}

export const INSTITUTIONAL_POLICY_REGISTRY_VERSION = '1.5.0';

const COMMON_EXCLUDED_DATA = Object.freeze([
  'ethnicity', 'religion', 'political-opinion', 'private-messages',
  'phone-contacts', 'social-media-behaviour', 'unconsented-third-party-data'
]);

const BASE_RULES = Object.freeze([
  { id:'POL-EFF-001', category:'governance', severity:'blocking', operator:'effective-date', source:'Institutional Policy Registry' },
  { id:'DAT-CONF-001', category:'data-quality', severity:'blocking', operator:'minimum', source:'Data Quality & Confidence Engine' },
  { id:'EVD-COV-001', category:'evidence', severity:'blocking', operator:'required-evidence-types', source:'Financial Evidence Engine' },
  { id:'FIN-HLT-001', category:'financial-health', severity:'blocking', operator:'minimum', source:'Financial Health Engine' },
  { id:'DEBT-RSK-001', category:'debt', severity:'blocking', operator:'maximum', source:'Debt & Over-Indebtedness Engine' },
  { id:'INC-MIN-001', category:'scoring', severity:'warning', operator:'minimum', source:'INCLUSCORE Engine' },
  { id:'REQ-AMT-001', category:'credit-request', severity:'warning', operator:'maximum', source:'Credit request' },
  { id:'PAY-CAP-001', category:'affordability', severity:'blocking', operator:'maximum', source:'Responsible Credit Simulation Engine' },
  { id:'STR-RES-001', category:'stress', severity:'warning', operator:'maximum', source:'Responsible Credit Simulation Engine' },
  { id:'SEA-GRC-001', category:'seasonality', severity:'warning', operator:'maximum', source:'Seasonal Finance Engine' },
  { id:'PUR-ELG-001', category:'product', severity:'blocking', operator:'allowed-value', source:'Credit request' },
  { id:'HUM-VAL-001', category:'governance', severity:'blocking', operator:'required-true', source:'CREDIPASS safeguards' },
  { id:'DAT-MIN-001', category:'privacy', severity:'blocking', operator:'required-exclusions', source:'Privacy safeguards' }
]);

function createPolicy(config) {
  return Object.freeze({
    institutionId:'CIF-SYNTH-ML',
    institutionName:'Institution financière — Mali',
    countryCode:'ML',
    currency:'XOF',
    effectiveFrom:'2026-08-01',
    effectiveTo:null,
    timezone:'Africa/Bamako',
    allowedPurposes:['workingCapital','agriculturalInputs','equipment'],
    requiredEvidenceTypes:['salesNotebook','supplierReceipt','coopContribution'],
    excludedData:[...COMMON_EXCLUDED_DATA],
    rules:BASE_RULES,
    ...config
  });
}

export const INSTITUTIONAL_POLICIES = Object.freeze({
  balanced:createPolicy({
    id:'balanced', version:'ML-CIF-POL-BAL-1.0.0', labelKey:'policyBalanced',
    description:'Politique équilibrée : preuves locales, soutenabilité et revue humaine.',
    thresholds:{
      minimumDataConfidence:60,
      minimumFinancialHealth:55,
      maximumOverIndebtednessRisk:55,
      minimumIncluscore:50,
      maximumRequestedAmount:1500000,
      maximumGracePeriodMonths:2,
      maximumSevereStressFailures:1,
      maximumPaymentToSafeHeadroomRatio:1
    },
    linkedPolicies:{ incluscore:'ML-BAL-1.0.0', financialHealth:'ML-HLT-BAL-1.0.0', debt:'ML-DEBT-BAL-1.0.0', simulation:'ML-SIM-BAL-1.0.0' }
  }),
  prudent:createPolicy({
    id:'prudent', version:'ML-CIF-POL-PRU-1.0.0', labelKey:'policyPrudent',
    description:'Politique prudente : seuils renforcés et tolérance limitée aux chocs.',
    thresholds:{
      minimumDataConfidence:70,
      minimumFinancialHealth:65,
      maximumOverIndebtednessRisk:35,
      minimumIncluscore:60,
      maximumRequestedAmount:1000000,
      maximumGracePeriodMonths:1,
      maximumSevereStressFailures:0,
      maximumPaymentToSafeHeadroomRatio:0.9
    },
    linkedPolicies:{ incluscore:'ML-PRU-1.0.0', financialHealth:'ML-HLT-PRU-1.0.0', debt:'ML-DEBT-PRU-1.0.0', simulation:'ML-SIM-PRU-1.0.0' }
  }),
  inclusivePilot:createPolicy({
    id:'inclusivePilot', version:'ML-CREDIPASS-POL-INC-1.0.0', labelKey:'policyInclusivePilot',
    description:'Profil inclusif contrôlé : seuils adaptés, sans suppression des garde-fous.',
    thresholds:{
      minimumDataConfidence:55,
      minimumFinancialHealth:50,
      maximumOverIndebtednessRisk:65,
      minimumIncluscore:45,
      maximumRequestedAmount:1500000,
      maximumGracePeriodMonths:3,
      maximumSevereStressFailures:2,
      maximumPaymentToSafeHeadroomRatio:1
    },
    linkedPolicies:{ incluscore:'ML-INC-1.0.0', financialHealth:'ML-HLT-INC-1.0.0', debt:'ML-DEBT-INC-1.0.0', simulation:'ML-SIM-INC-1.0.0' }
  })
});

export function getInstitutionalPolicy(id='balanced') {
  return INSTITUTIONAL_POLICIES[id] || INSTITUTIONAL_POLICIES.balanced;
}

export function isPolicyEffective(policy, asOfDate='2026-08-06') {
  if (!policy?.effectiveFrom) return false;
  const asOf = new Date(`${asOfDate}T00:00:00Z`).getTime();
  const from = new Date(`${policy.effectiveFrom}T00:00:00Z`).getTime();
  const to = policy.effectiveTo ? new Date(`${policy.effectiveTo}T23:59:59Z`).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(asOf) && asOf >= from && asOf <= to;
}

export function validateInstitutionalPolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new TypeError('institutional policy must be an object');
  ['id','version','institutionId','countryCode','currency','effectiveFrom'].forEach(key => {
    if (!String(policy[key] || '').trim()) throw new TypeError(`${key} is required`);
  });
  if (!policy.thresholds || typeof policy.thresholds !== 'object') throw new TypeError('thresholds are required');
  const percentageKeys = ['minimumDataConfidence','minimumFinancialHealth','maximumOverIndebtednessRisk','minimumIncluscore'];
  percentageKeys.forEach(key => {
    const value = Number(policy.thresholds[key]);
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${key} must be between 0 and 100`);
  });
  if (Number(policy.thresholds.maximumRequestedAmount) <= 0) throw new RangeError('maximumRequestedAmount must be positive');
  if (!Number.isInteger(Number(policy.thresholds.maximumGracePeriodMonths)) || Number(policy.thresholds.maximumGracePeriodMonths) < 0) throw new RangeError('maximumGracePeriodMonths must be a non-negative integer');
  if (!Number.isInteger(Number(policy.thresholds.maximumSevereStressFailures)) || Number(policy.thresholds.maximumSevereStressFailures) < 0) throw new RangeError('maximumSevereStressFailures must be a non-negative integer');
  if (Number(policy.thresholds.maximumPaymentToSafeHeadroomRatio) <= 0 || Number(policy.thresholds.maximumPaymentToSafeHeadroomRatio) > 1) throw new RangeError('maximumPaymentToSafeHeadroomRatio must be in ]0,1]');
  if (!Array.isArray(policy.requiredEvidenceTypes) || !policy.requiredEvidenceTypes.length) throw new TypeError('requiredEvidenceTypes are required');
  if (!Array.isArray(policy.allowedPurposes) || !policy.allowedPurposes.length) throw new TypeError('allowedPurposes are required');
  if (!Array.isArray(policy.rules) || !policy.rules.length) throw new TypeError('rules are required');
  if (!Array.isArray(policy.excludedData) || !policy.excludedData.length) throw new TypeError('excludedData are required');
  return true;
}

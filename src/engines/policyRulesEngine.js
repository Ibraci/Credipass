import { getInstitutionalPolicy, isPolicyEffective, validateInstitutionalPolicy } from '../config/institutionalPolicies.js';

export const POLICY_RULES_ENGINE_VERSION = '1.5.0';

const round = (value, digits=2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const statusFrom = (passed, severity) => passed ? 'passed' : severity === 'warning' ? 'warning' : 'failed';

function usableEvidenceTypes(evidence=[]) {
  return [...new Set(evidence.filter(item => item?.usable !== false && !['rejected','revoked','contradictory','expired'].includes(item?.status)).map(item => item.typeKey).filter(Boolean))].sort();
}

function evaluateRule(rule, context, policy, asOfDate) {
  const t = policy.thresholds;
  const evidenceTypes = usableEvidenceTypes(context.data?.evidence || []);
  const safeHeadroom = Number(context.health?.amounts?.safeAdditionalMonthlyPayment || 0);
  const maximumPayment = Number(context.simulation?.recommended?.maximumPayment || 0);
  const severeFailures = (context.simulation?.stressTests || []).filter(test => ['income-minus-20','combined-seasonal-shock'].includes(test.id) && !test.survives).length;
  let actual;
  let threshold;
  let passed = false;
  let details = {};

  switch (rule.id) {
    case 'POL-EFF-001':
      actual = asOfDate;
      threshold = `${policy.effectiveFrom} → ${policy.effectiveTo || 'open'}`;
      passed = isPolicyEffective(policy, asOfDate);
      details = { effectiveFrom:policy.effectiveFrom, effectiveTo:policy.effectiveTo };
      break;
    case 'DAT-CONF-001':
      actual = Number(context.quality?.confidence || 0);
      threshold = t.minimumDataConfidence;
      passed = actual >= threshold;
      break;
    case 'EVD-COV-001': {
      const missing = policy.requiredEvidenceTypes.filter(type => !evidenceTypes.includes(type));
      actual = evidenceTypes;
      threshold = policy.requiredEvidenceTypes;
      passed = missing.length === 0;
      details = { missing, present:evidenceTypes };
      break;
    }
    case 'FIN-HLT-001':
      actual = Number(context.health?.score || 0);
      threshold = t.minimumFinancialHealth;
      passed = actual >= threshold;
      break;
    case 'DEBT-RSK-001':
      actual = Number(context.debt?.overIndebtedness?.riskScore || 0);
      threshold = t.maximumOverIndebtednessRisk;
      passed = actual <= threshold;
      break;
    case 'INC-MIN-001':
      actual = Number(context.incluscore?.score || 0);
      threshold = t.minimumIncluscore;
      passed = actual >= threshold;
      break;
    case 'REQ-AMT-001':
      actual = Number(context.simulation?.request?.amount || context.data?.creditRequest?.amount || 0);
      threshold = t.maximumRequestedAmount;
      passed = actual <= threshold;
      details = { reducible:true, recommendedPrincipal:Number(context.simulation?.recommended?.principal || 0) };
      break;
    case 'PAY-CAP-001': {
      const scheduleRows = context.simulation?.selectedSchedule || [];
      const utilizationRatios = scheduleRows
        .filter(row => Number(row.payment || 0) > 0)
        .map(row => Number(row.capacity || 0) > 0 ? Number(row.payment || 0) / Number(row.capacity || 0) : Number.POSITIVE_INFINITY);
      const maximumUtilization = utilizationRatios.length ? Math.max(...utilizationRatios) : 0;
      actual = round(maximumUtilization, 4);
      threshold = t.maximumPaymentToSafeHeadroomRatio;
      passed = maximumUtilization <= threshold + 0.0001;
      details = { safeHeadroom, maximumPayment, maximumUtilization:round(maximumUtilization * 100), scheduleType:context.simulation?.recommended?.scheduleType };
      break;
    }
    case 'STR-RES-001':
      actual = severeFailures;
      threshold = t.maximumSevereStressFailures;
      passed = actual <= threshold;
      details = { severeScenarioIds:(context.simulation?.stressTests || []).filter(test => ['income-minus-20','combined-seasonal-shock'].includes(test.id) && !test.survives).map(test => test.id) };
      break;
    case 'SEA-GRC-001':
      actual = Number(context.simulation?.request?.gracePeriodMonths || 0);
      threshold = t.maximumGracePeriodMonths;
      passed = actual <= threshold;
      break;
    case 'PUR-ELG-001':
      actual = context.data?.creditRequest?.purposeKey || 'unspecified';
      threshold = policy.allowedPurposes;
      passed = policy.allowedPurposes.includes(actual);
      break;
    case 'HUM-VAL-001':
      actual = Boolean(context.simulation?.safeguards?.humanValidationRequired && context.incluscore?.safeguards?.humanValidationRequired !== false);
      threshold = true;
      passed = actual === true;
      break;
    case 'DAT-MIN-001': {
      const excluded = new Set([...(context.simulation?.excludedData || []), ...(context.incluscore?.excludedData || []), ...(context.health?.excludedData || [])]);
      const missing = policy.excludedData.filter(item => !excluded.has(item));
      actual = [...excluded].sort();
      threshold = policy.excludedData;
      passed = missing.length === 0;
      details = { missingExclusions:missing };
      break;
    }
    default:
      actual = null;
      threshold = null;
      passed = false;
      details = { unsupportedRule:true };
  }

  return {
    id:rule.id,
    category:rule.category,
    severity:rule.severity,
    operator:rule.operator,
    source:rule.source,
    actual,
    threshold,
    status:statusFrom(passed, rule.severity),
    passed,
    details
  };
}

function actionFor(rule) {
  const actions = {
    'POL-EFF-001':'stop-and-review-policy-version',
    'DAT-CONF-001':'collect-or-verify-additional-evidence',
    'EVD-COV-001':'complete-required-evidence-categories',
    'FIN-HLT-001':'prepare-financial-improvement-plan',
    'DEBT-RSK-001':'reconcile-and-review-debt-before-financing',
    'INC-MIN-001':'review-weak-incluscore-axes',
    'REQ-AMT-001':'reduce-request-or-adjust-structure',
    'PAY-CAP-001':'reduce-installment-below-prudent-cap',
    'STR-RES-001':'strengthen-stress-resilience-or-conditions',
    'SEA-GRC-001':'justify-or-reduce-grace-period',
    'PUR-ELG-001':'select-an-eligible-product-purpose',
    'HUM-VAL-001':'restore-human-validation-control',
    'DAT-MIN-001':'remove-prohibited-data-from-processing'
  };
  return actions[rule.id] || 'human-review-required';
}

export function evaluateInstitutionalRules(context={}, options={}) {
  if (!context.data || !context.quality || !context.incluscore || !context.health || !context.debt || !context.simulation) {
    throw new TypeError('data, quality, incluscore, health, debt and simulation outputs are required');
  }
  const policy = options.policy || getInstitutionalPolicy(options.policyId || 'balanced');
  validateInstitutionalPolicy(policy);
  const asOfDate = options.asOfDate || '2026-08-06';
  const rules = policy.rules.map(rule => evaluateRule(rule, context, policy, asOfDate));
  const failed = rules.filter(rule => rule.status === 'failed');
  const warnings = rules.filter(rule => rule.status === 'warning');
  const passed = rules.filter(rule => rule.status === 'passed');
  const blockingFailures = failed.filter(rule => rule.severity === 'blocking');
  const requiredActions = [...new Set([...failed, ...warnings].map(actionFor))];

  return {
    policy:{
      id:policy.id,
      version:policy.version,
      institutionId:policy.institutionId,
      institutionName:policy.institutionName,
      countryCode:policy.countryCode,
      currency:policy.currency,
      effectiveFrom:policy.effectiveFrom,
      effectiveTo:policy.effectiveTo,
      linkedPolicies:policy.linkedPolicies,
      thresholds:policy.thresholds,
      requiredEvidenceTypes:policy.requiredEvidenceTypes,
      allowedPurposes:policy.allowedPurposes
    },
    asOfDate,
    isEffective:isPolicyEffective(policy, asOfDate),
    status:blockingFailures.length ? 'blocked-for-human-resolution' : warnings.length ? 'eligible-with-warnings' : 'eligible-for-human-review',
    rules,
    summary:{
      total:rules.length,
      passed:passed.length,
      warnings:warnings.length,
      failed:failed.length,
      blockingFailures:blockingFailures.length,
      passRate:round(passed.length / Math.max(1, rules.length) * 100)
    },
    blockingFailures:blockingFailures.map(rule => rule.id),
    warningRules:warnings.map(rule => rule.id),
    requiredActions,
    excludedData:[...policy.excludedData],
    audit:{
      policyRegistryVersion:'1.5.0',
      evaluatedRuleIds:rules.map(rule => rule.id),
      deterministic:true,
      inputsReadOnly:true
    },
    safeguards:{
      automaticCreditDecisionAllowed:false,
      humanValidationRequired:true,
      policyRuleIsFinalDecision:false,
      rulesAreVersioned:true,
      effectiveDatesEnforced:true
    },
    engineVersion:POLICY_RULES_ENGINE_VERSION
  };
}

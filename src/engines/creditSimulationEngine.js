import { getCreditSimulationPolicy, validateCreditSimulationPolicy } from '../config/creditSimulationPolicies.js';
import { buildSeasonalCapacity, shiftSeasonalCapacity } from './seasonalFinanceEngine.js';

export const RESPONSIBLE_CREDIT_SIMULATION_ENGINE_VERSION = '1.4.0';

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};
const clampAmount = value => Math.max(0, Math.round(Number(value) || 0));

function principalWeights(type, rows) {
  const count = rows.length;
  if (!count) return [];
  if (type === 'progressive') return rows.map((row, index) => row.phase === 'grace' ? 0 : 0.65 + (count === 1 ? 0 : 0.7 * index / (count - 1)));
  if (type === 'seasonal') return rows.map(row => row.phase === 'grace' ? 0 : Math.max(0.25, row.factor));
  return rows.map(row => row.phase === 'grace' ? 0 : 1);
}

export function buildRepaymentSchedule(principal, annualInterestRate, seasonal, type='standard') {
  const amount = Math.max(0, Number(principal || 0));
  const monthlyRate = Math.max(0, Number(annualInterestRate || 0)) / 1200;
  const weights = principalWeights(type, seasonal.rows);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  if (amount > 0 && totalWeight <= 0) throw new RangeError('repayment schedule has no repayment month');
  let opening = amount;
  let principalAllocated = 0;
  const schedule = seasonal.rows.map((row, index) => {
    const isLastPayingMonth = index === weights.length - 1 || weights.slice(index + 1).every(value => value === 0);
    let principalPart = totalWeight > 0 ? amount * weights[index] / totalWeight : 0;
    if (isLastPayingMonth && weights[index] > 0) principalPart = amount - principalAllocated;
    principalPart = Math.max(0, Math.min(opening, round(principalPart)));
    const interest = round(opening * monthlyRate);
    const payment = round(principalPart + interest);
    const closing = round(Math.max(0, opening - principalPart));
    principalAllocated = round(principalAllocated + principalPart);
    const result = {
      ...row,
      openingPrincipal:round(opening),
      principal:principalPart,
      interest,
      payment,
      closingPrincipal:closing,
      affordable:payment <= row.capacity + 0.01
    };
    opening = closing;
    return result;
  });
  const totalPayment = round(schedule.reduce((sum, row) => sum + row.payment, 0));
  const totalInterest = round(schedule.reduce((sum, row) => sum + row.interest, 0));
  return {
    type,
    principal:round(amount),
    durationMonths:schedule.length,
    monthlyRate:round(monthlyRate, 6),
    totalPayment,
    totalInterest,
    maximumPayment:round(Math.max(0, ...schedule.map(row => row.payment))),
    minimumPayment:round((payments => payments.length ? Math.min(...payments) : 0)(schedule.filter(row => row.payment > 0).map(row => row.payment))),
    averagePayment:round(totalPayment / Math.max(1, schedule.filter(row => row.payment > 0).length)),
    unaffordableMonths:schedule.filter(row => !row.affordable).length,
    maximumShortfall:round(Math.max(0, ...schedule.map(row => row.payment - row.capacity))),
    schedule
  };
}

function findAffordablePrincipal(requestedAmount, annualInterestRate, seasonal, type) {
  if (!seasonal.rows.some(row => Number(row.capacity || 0) > 0)) return 0;
  const requested = Math.max(0, Number(requestedAmount || 0));
  if (buildRepaymentSchedule(requested, annualInterestRate, seasonal, type).unaffordableMonths === 0) return clampAmount(requested);
  let low = 0;
  let high = requested;
  for (let iteration = 0; iteration < 40; iteration++) {
    const middle = (low + high) / 2;
    const schedule = buildRepaymentSchedule(middle, annualInterestRate, seasonal, type);
    if (schedule.unaffordableMonths === 0) low = middle;
    else high = middle;
  }
  let result = Math.max(0, Math.floor(low));
  while (result > 0 && buildRepaymentSchedule(result, annualInterestRate, seasonal, type).unaffordableMonths > 0) result--;
  return result;
}

function stressSchedule(schedule, seasonal, type) {
  const scenarios = [
    { id:'baseline', factor:1, rows:seasonal.rows },
    { id:'income-minus-10', factor:0.90, rows:seasonal.rows },
    { id:'income-minus-20', factor:0.80, rows:seasonal.rows },
    { id:'peak-delay-one-month', factor:0.90, rows:shiftSeasonalCapacity(seasonal, 1) },
    { id:'combined-seasonal-shock', factor:0.75, rows:shiftSeasonalCapacity(seasonal, 1) }
  ];
  return scenarios.map(scenario => {
    const months = schedule.schedule.map((row, index) => {
      const source = scenario.rows[index];
      const capacity = round(Number(source.capacity || 0) * scenario.factor);
      const shortfall = round(Math.max(0, row.payment - capacity));
      return { month:row.month, payment:row.payment, capacity, shortfall, affordable:shortfall <= 1 };
    });
    return {
      id:scenario.id,
      scheduleType:type,
      unaffordableMonths:months.filter(row => !row.affordable).length,
      maximumShortfall:round(Math.max(0, ...months.map(row => row.shortfall))),
      totalShortfall:round(months.reduce((sum, row) => sum + row.shortfall, 0)),
      survives:months.every(row => row.affordable),
      months
    };
  });
}

function gateResults({ quality, health, debt, incluscore }, policy) {
  const gates = [
    { id:'data-confidence', passed:Number(quality.confidence || 0) >= policy.minimumDataConfidence, actual:Number(quality.confidence || 0), threshold:policy.minimumDataConfidence },
    { id:'financial-health', passed:Number(health.score || 0) >= policy.minimumHealthScore, actual:Number(health.score || 0), threshold:policy.minimumHealthScore },
    { id:'over-indebtedness-risk', passed:Number(debt.overIndebtedness?.riskScore || 0) <= policy.maximumOverIndebtednessRisk, actual:Number(debt.overIndebtedness?.riskScore || 0), threshold:policy.maximumOverIndebtednessRisk },
    { id:'positive-payment-headroom', passed:Number(health.amounts?.safeAdditionalMonthlyPayment || 0) > 0, actual:Number(health.amounts?.safeAdditionalMonthlyPayment || 0), threshold:1 },
    { id:'incluscore-not-fragile', passed:!['fragile','improvement'].includes(incluscore.publishedBand), actual:incluscore.publishedBand, threshold:'conditional-or-better' }
  ];
  return gates;
}

export function simulateResponsibleCredit(inputs = {}, options = {}) {
  const { person = {}, profile = {}, quality = {}, incluscore = {}, health = {}, debt = {}, request = {} } = inputs;
  if (!quality.components || !health.amounts || !debt.summary || !incluscore.axes) throw new TypeError('quality, incluscore, health and debt outputs are required');
  const policy = options.policy || getCreditSimulationPolicy(options.policyId || 'balanced');
  validateCreditSimulationPolicy(policy);

  const requestedAmount = clampAmount(request.amount ?? profile.requestedAmount);
  const desiredDuration = Math.trunc(Number(request.durationMonths || 18));
  const startDate = request.startDate || '2026-09-01';
  const activityKey = request.activityKey || person.activityKey || 'general';
  const gracePeriodMonths = Math.max(0, Math.trunc(Number(request.gracePeriodMonths || 0)));
  const rawHeadroom = Math.max(0, Number(health.amounts.safeAdditionalMonthlyPayment || 0));
  const paymentCap = round(rawHeadroom * policy.maximumPaymentUtilization / 100);
  const annualResourceCap = round(Number(health.amounts.prudentMonthlyResources || 0) * 12 * policy.maximumPrincipalToAnnualResourcesRatio);
  const institutionalCap = Math.min(policy.maximumAmount, annualResourceCap || policy.maximumAmount);
  const amountToTest = Math.max(0, Math.min(requestedAmount, institutionalCap));
  const gates = gateResults({ quality, health, debt, incluscore }, policy);

  const scheduleTypes = ['standard','progressive','seasonal'];
  const candidates = [];
  policy.allowedDurations.forEach(duration => {
    const seasonal = buildSeasonalCapacity(activityKey, { startDate, months:duration, baseMonthlyCapacity:paymentCap, gracePeriodMonths });
    scheduleTypes.forEach(type => {
      const capacityRows = type === 'seasonal'
        ? seasonal.rows
        : seasonal.rows.map(row => ({ ...row, factor:1, capacity:row.phase === 'grace' ? paymentCap * 0.35 : paymentCap, phase:row.phase === 'grace' ? 'grace' : type === 'progressive' ? 'progressive' : 'standard' }));
      const capacityModel = { ...seasonal, rows:capacityRows };
      const affordablePrincipal = findAffordablePrincipal(amountToTest, policy.annualInterestRate, capacityModel, type);
      const principal = Math.min(amountToTest, affordablePrincipal);
      const schedule = buildRepaymentSchedule(principal, policy.annualInterestRate, capacityModel, type);
      const stressTests = stressSchedule(schedule, capacityModel, type);
      const severeFailures = stressTests.filter(test => ['income-minus-20','combined-seasonal-shock'].includes(test.id) && !test.survives).length;
      candidates.push({
        type,
        durationMonths:duration,
        seasonal:capacityModel,
        affordablePrincipal,
        principal,
        supportsRequested:principal >= requestedAmount - 1,
        supportsTestAmount:principal >= amountToTest - 1,
        schedule,
        stressTests,
        severeFailures,
        totalCostExcludingPrincipal:round(schedule.totalInterest + principal * (policy.originationFeeRate + policy.insuranceRate) / 100)
      });
    });
  });

  const typeRank = type => {
    const index = policy.preferredScheduleOrder.indexOf(type);
    return index < 0 ? 99 : index;
  };
  const feasibleFull = candidates.filter(item => item.supportsRequested && item.schedule.unaffordableMonths === 0);
  feasibleFull.sort((a,b) => a.durationMonths - b.durationMonths || typeRank(a.type) - typeRank(b.type) || a.totalCostExcludingPrincipal - b.totalCostExcludingPrincipal);
  const reduced = candidates.filter(item => item.principal >= policy.minimumAmount && item.schedule.unaffordableMonths === 0);
  reduced.sort((a,b) => b.principal - a.principal || a.durationMonths - b.durationMonths || typeRank(a.type) - typeRank(b.type));
  const selected = feasibleFull[0] || reduced[0] || candidates.sort((a,b) => b.principal - a.principal)[0];

  const failedGates = gates.filter(gate => !gate.passed);
  const severeStressFailures = selected.stressTests.filter(test => ['income-minus-20','combined-seasonal-shock'].includes(test.id) && !test.survives).length;

  let recommendation = 'supported';
  if (failedGates.some(gate => gate.id === 'data-confidence')) recommendation = 'toComplete';
  else if (failedGates.length || selected.principal < policy.minimumAmount) recommendation = 'improvement';
  else if (selected.principal < requestedAmount) recommendation = 'reduced';
  else if (severeStressFailures > policy.maximumStressFailureMonths || incluscore.publishedBand === 'conditional') recommendation = 'conditional';

  const publishZero = ['improvement','toComplete'].includes(recommendation);
  const publishedPrincipal = publishZero ? 0 : selected.principal;
  const publishedSchedule = publishZero ? buildRepaymentSchedule(0, policy.annualInterestRate, selected.seasonal, selected.type) : selected.schedule;
  const publishedStressTests = publishZero ? stressSchedule(publishedSchedule, selected.seasonal, selected.type) : selected.stressTests;
  const upfrontFees = round(publishedPrincipal * policy.originationFeeRate / 100);
  const insurance = round(publishedPrincipal * policy.insuranceRate / 100);
  const totalRepayable = round(publishedSchedule.totalPayment + upfrontFees + insurance);
  const totalCost = round(totalRepayable - publishedPrincipal);

  const conditions = [
    ...(recommendation === 'reduced' ? ['accept-reduced-principal-or-extend-duration'] : []),
    ...(severeStressFailures ? ['monitor-cashflow-during-stress-periods'] : []),
    ...(selected.type === 'seasonal' ? ['validate-seasonal-calendar-with-beneficiary'] : []),
    ...(gracePeriodMonths ? ['validate-grace-period-purpose'] : []),
    ...(debt.flags?.includes('profile-debt-mismatch') ? ['reconcile-debt-before-disbursement'] : []),
    ...(!failedGates.length ? ['final-human-credit-review'] : ['resolve-failed-gates-before-decision'])
  ];

  return {
    request:{ amount:requestedAmount, desiredDuration, startDate, activityKey, gracePeriodMonths },
    recommendation,
    recommended:{
      principal:clampAmount(publishedPrincipal),
      durationMonths:selected.durationMonths,
      scheduleType:selected.type,
      paymentCap,
      maximumPayment:publishedSchedule.maximumPayment,
      averagePayment:publishedSchedule.averagePayment,
      totalInterest:publishedSchedule.totalInterest,
      originationFee:upfrontFees,
      insurance,
      totalCost,
      totalRepayable
    },
    selectedSchedule:publishedSchedule.schedule,
    selectedSeasonality:selected.seasonal,
    stressTests:publishedStressTests,
    alternatives:candidates
      .filter(item => item.durationMonths === selected.durationMonths)
      .sort((a,b) => typeRank(a.type) - typeRank(b.type))
      .map(item => ({ type:item.type, durationMonths:item.durationMonths, affordablePrincipal:item.affordablePrincipal, maximumPayment:item.schedule.maximumPayment, averagePayment:item.schedule.averagePayment, totalInterest:item.schedule.totalInterest, unaffordableMonths:item.schedule.unaffordableMonths, severeFailures:item.severeFailures })),
    gates,
    conditions:[...new Set(conditions)],
    rulesApplied:[...policy.rules, 'requested-amount-never-increased', 'shortest-feasible-duration-preferred', 'seasonal-calendar-versioned'],
    usedData:[
      { key:'requestedAmount', value:requestedAmount, source:'Beneficiary request', reliability:Number(profile.reliability || 0) },
      { key:'safeAdditionalMonthlyPayment', value:rawHeadroom, source:'Financial Health Engine', reliability:Number(quality.confidence || 0) },
      { key:'dataConfidence', value:Number(quality.confidence || 0), source:'Data Quality & Confidence Engine', reliability:100 },
      { key:'incluscore', value:Number(incluscore.score || 0), source:'INCLUSCORE Engine', reliability:Number(quality.confidence || 0) },
      { key:'overIndebtednessRisk', value:Number(debt.overIndebtedness?.riskScore || 0), source:'Debt & Over-Indebtedness Engine', reliability:Number(quality.confidence || 0) },
      { key:'seasonalCalendar', value:selected.seasonal.calendarVersion, source:'Seasonal Finance Engine', reliability:60 }
    ],
    excludedData:['ethnicity','religion','political-opinion','private-messages','phone-contacts','social-media-behaviour','unconsented-third-party-data'],
    uncertainties:[
      ...(selected.seasonal.notes || []),
      ...(Number(quality.confidence || 0) < 75 ? ['Data confidence remains below 75%.'] : []),
      ...(selected.seasonal.seasonalityStrength > 30 ? ['Strong seasonality increases schedule sensitivity.'] : []),
      ...(severeStressFailures ? ['At least one severe stress scenario creates payment shortfalls.'] : [])
    ],
    intermediate:{
      rawHeadroom:round(rawHeadroom),
      paymentCap,
      paymentUtilization:policy.maximumPaymentUtilization,
      annualResourceCap,
      institutionalCap:round(institutionalCap),
      testedAmount:amountToTest,
      candidateCount:candidates.length,
      selectedCandidate:{ type:selected.type, durationMonths:selected.durationMonths, principal:selected.principal, supportsRequested:selected.supportsRequested }
    },
    policy,
    safeguards:{
      automaticCreditDecisionAllowed:false,
      humanValidationRequired:true,
      recommendationIsBinding:false,
      interestRateIsIllustrativeAndConfigurable:true,
      seasonalCalendarRequiresValidation:true
    },
    engineVersion:RESPONSIBLE_CREDIT_SIMULATION_ENGINE_VERSION,
    upstreamVersions:{
      incluscore:incluscore.engineVersion,
      financialHealth:health.engineVersion,
      debt:debt.engineVersion,
      dataQuality:quality.engineVersion,
      seasonal:selected.seasonal.engineVersion
    }
  };
}

import { getSeasonalCalendar, validateSeasonalCalendar } from '../config/seasonalCalendars.js';

export const SEASONAL_FINANCE_ENGINE_VERSION = '1.4.0';

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
function addMonths(date, count) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}
function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(`${value || '2026-09-01'}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new TypeError('startDate is invalid');
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function buildSeasonalCapacity(activityKey, options = {}) {
  const calendar = options.calendar || getSeasonalCalendar(activityKey);
  validateSeasonalCalendar(calendar);
  const months = Math.max(1, Math.trunc(Number(options.months || 12)));
  const startDate = normalizeDate(options.startDate);
  const baseMonthlyCapacity = Math.max(0, Number(options.baseMonthlyCapacity || 0));
  const gracePeriodMonths = Math.max(0, Math.trunc(Number(options.gracePeriodMonths || 0)));
  const rows = [];

  for (let index = 0; index < months; index++) {
    const date = addMonths(startDate, index);
    const calendarMonth = date.getUTCMonth() + 1;
    const factor = Number(calendar.factors[calendarMonth - 1]);
    const inGrace = index < gracePeriodMonths;
    const capacity = round(inGrace ? baseMonthlyCapacity * 0.35 : baseMonthlyCapacity * factor);
    rows.push({
      index:index + 1,
      month:monthKey(date),
      dueDate:`${monthKey(date)}-28`,
      calendarMonth,
      factor:round(factor, 3),
      capacity,
      phase:inGrace ? 'grace' : calendar.peakMonths.includes(calendarMonth) ? 'peak' : calendar.lowMonths.includes(calendarMonth) ? 'low' : 'normal'
    });
  }

  const factors = rows.filter(row => row.phase !== 'grace').map(row => row.factor);
  const averageFactor = factors.length ? factors.reduce((sum, value) => sum + value, 0) / factors.length : 1;
  const strength = factors.length ? round((Math.max(...factors) - Math.min(...factors)) / averageFactor * 100) : 0;
  const peakMonths = rows.filter(row => row.phase === 'peak').map(row => row.month);
  const lowMonths = rows.filter(row => row.phase === 'low').map(row => row.month);

  return {
    activityKey,
    calendarId:calendar.id,
    calendarVersion:calendar.version,
    calendarSource:calendar.source,
    baseMonthlyCapacity:round(baseMonthlyCapacity),
    gracePeriodMonths,
    seasonalityStrength:strength,
    rows,
    peakMonths,
    lowMonths,
    notes:calendar.notes || [],
    rulesApplied:['sector-calendar-versioned','capacity-varies-with-economic-cycle','grace-period-explicit','calendar-requires-field-validation'],
    safeguards:{
      calendarIsForecastNotFact:true,
      automaticCreditDecisionAllowed:false,
      humanValidationRequired:true
    },
    engineVersion:SEASONAL_FINANCE_ENGINE_VERSION
  };
}

export function shiftSeasonalCapacity(seasonal, months = 1) {
  if (!seasonal?.rows?.length) throw new TypeError('seasonal capacity rows are required');
  const shift = ((Math.trunc(Number(months)) % seasonal.rows.length) + seasonal.rows.length) % seasonal.rows.length;
  const capacities = seasonal.rows.map(row => row.capacity);
  const shifted = capacities.map((_, index) => capacities[(index - shift + capacities.length) % capacities.length]);
  return seasonal.rows.map((row, index) => ({ ...row, capacity:shifted[index] }));
}

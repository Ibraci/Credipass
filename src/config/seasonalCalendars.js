export const SEASONAL_CALENDAR_REGISTRY_VERSION = '1.4.0';

const calendars = Object.freeze({
  grainTrade: Object.freeze({
    id:'grainTrade', version:'ML-SEA-GRAIN-1.0.0', source:'prototype-sector-calendar',
    factors:[0.82,0.85,0.90,0.95,1.00,1.05,1.08,1.12,1.28,1.35,1.24,1.12],
    peakMonths:[9,10,11], lowMonths:[1,2], graceEligible:false,
    notes:['Illustrative calendar to be validated with partner institutions and field data.']
  }),
  rainfedAgriculture: Object.freeze({
    id:'rainfedAgriculture', version:'ML-SEA-AGRI-1.0.0', source:'prototype-sector-calendar',
    factors:[0.70,0.68,0.65,0.62,0.60,0.58,0.62,0.72,0.95,1.35,1.55,1.28],
    peakMonths:[10,11,12], lowMonths:[4,5,6], graceEligible:true,
    notes:['Illustrative rain-fed agriculture calendar; crop and zone calibration are required.']
  }),
  general: Object.freeze({
    id:'general', version:'ML-SEA-GEN-1.0.0', source:'neutral-calendar',
    factors:[1,1,1,1,1,1,1,1,1,1,1,1], peakMonths:[], lowMonths:[], graceEligible:false,
    notes:['Neutral calendar used when no validated seasonality is available.']
  })
});

export function getSeasonalCalendar(activityKey='general') {
  return calendars[activityKey] || calendars.general;
}

export function listSeasonalCalendars() { return calendars; }

export function validateSeasonalCalendar(calendar) {
  if (!calendar || typeof calendar !== 'object') throw new TypeError('calendar must be an object');
  if (!Array.isArray(calendar.factors) || calendar.factors.length !== 12) throw new RangeError('calendar must contain 12 monthly factors');
  if (calendar.factors.some(value => !Number.isFinite(Number(value)) || Number(value) <= 0)) throw new RangeError('monthly factors must be positive');
  return true;
}

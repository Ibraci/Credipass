export const PROFILE_ENGINE_VERSION = '1.0.0';
export function calculateProfile(profile) {
  const totalIncome = Number(profile.formalIncome || 0) + Number(profile.informalIncome || 0) + Number(profile.seasonalIncomeAverage || 0);
  const obligations = Number(profile.essentialExpenses || 0) + Number(profile.existingDebtPayments || 0);
  const margin = Math.max(0, totalIncome - obligations);
  const prudentIncome = Math.round(totalIncome * Math.min(1, Math.max(.55, (profile.reliability || 0) / 100)));
  return { totalIncome, obligations, margin, prudentIncome, completeness: profile.completeness || 0, reliability: profile.reliability || 0, engineVersion: PROFILE_ENGINE_VERSION };
}

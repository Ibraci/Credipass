export const PRODUCT_MATCHING_POLICIES = {
  balanced:{
    id:'balanced', version:'3.1.0', name:'Matching — politique équilibrée',
    compatibleScore:76, partialScore:60, affordabilityTolerance:1.05,
    weights:{eligibility:0.18,affordability:0.24,dataReadiness:0.14,financialStrength:0.16,debtSafety:0.14,termFit:0.07,seasonalFit:0.07}
  },
  prudent:{
    id:'prudent', version:'3.1.0', name:'Matching — politique prudente',
    compatibleScore:82, partialScore:68, affordabilityTolerance:0.95,
    weights:{eligibility:0.18,affordability:0.27,dataReadiness:0.15,financialStrength:0.16,debtSafety:0.16,termFit:0.04,seasonalFit:0.04}
  },
  inclusivePilot:{
    id:'inclusivePilot', version:'3.1.0', name:'Matching — profil inclusif contrôlé',
    compatibleScore:72, partialScore:56, affordabilityTolerance:1.05,
    weights:{eligibility:0.17,affordability:0.22,dataReadiness:0.13,financialStrength:0.14,debtSafety:0.13,termFit:0.09,seasonalFit:0.12}
  }
};

export function validateProductMatchingPolicy(policy){
  const sum=Object.values(policy?.weights||{}).reduce((a,b)=>a+Number(b||0),0);
  return !!policy?.id && Math.abs(sum-1)<0.000001 && policy.compatibleScore>policy.partialScore && policy.partialScore>=0;
}

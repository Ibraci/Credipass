const round2=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
export function buildAmortizationSchedule({principal,annualRatePercent,months,method='declining'}){
  principal=Math.max(0,Number(principal)||0); months=Math.max(1,Math.trunc(Number(months)||1)); const monthlyRate=(Number(annualRatePercent)||0)/1200; let balance=principal, schedule=[];
  if(method==='linear'){
    const totalInterest=principal*(Number(annualRatePercent)||0)/100*(months/12), payment=(principal+totalInterest)/months, principalPart=principal/months, interestPart=totalInterest/months;
    for(let i=1;i<=months;i++){balance=Math.max(0,balance-principalPart);schedule.push({period:i,principal:round2(principalPart),interest:round2(interestPart),payment:round2(payment),balance:round2(balance)});}
  } else if(method==='accelerated'){
    const weights=Array.from({length:months},(_,i)=>months-i), totalW=weights.reduce((a,b)=>a+b,0);
    for(let i=1;i<=months;i++){const interest=balance*monthlyRate, pp=i===months?balance:principal*weights[i-1]/totalW; balance=Math.max(0,balance-pp);schedule.push({period:i,principal:round2(pp),interest:round2(interest),payment:round2(pp+interest),balance:round2(balance)});}
  } else {
    const principalPart=principal/months; for(let i=1;i<=months;i++){const interest=balance*monthlyRate, pp=i===months?balance:principalPart; balance=Math.max(0,balance-pp);schedule.push({period:i,principal:round2(pp),interest:round2(interest),payment:round2(pp+interest),balance:round2(balance)});}
  }
  const totalInterest=round2(schedule.reduce((a,x)=>a+x.interest,0)), totalPaid=round2(schedule.reduce((a,x)=>a+x.payment,0)); return {method,principal,annualRatePercent:Number(annualRatePercent)||0,months,schedule,totalInterest,totalPaid,firstPayment:schedule[0]?.payment||0,lastPayment:schedule.at(-1)?.payment||0};
}
export function computeLoanRatios({monthlyPayment,monthlyCapacity,totalInterest,principal}){ const payment=Number(monthlyPayment)||0, cap=Number(monthlyCapacity)||0, coverage=payment>0?cap/payment:0, interestRatio=principal>0?(Number(totalInterest)||0)/principal:0; return {coverage:round2(coverage),interestRatio:round2(interestRatio),coverageInterpretation:coverage>=1.3?'Marge confortable':coverage>=1?'Soutenable avec vigilance':'Capacité insuffisante'}; }

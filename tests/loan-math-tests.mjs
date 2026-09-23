import assert from 'node:assert/strict';
import {buildAmortizationSchedule,computeLoanRatios} from '../src/modules/loanMath.js';
for(const method of ['linear','declining','accelerated']){
 const r=buildAmortizationSchedule({principal:300000,annualRatePercent:12,months:12,method});
 assert.equal(r.schedule.length,12); assert.ok(Math.abs(r.schedule.at(-1).balance)<0.01); assert.ok(r.totalPaid>=300000); assert.ok(r.totalInterest>=0);
}
const d=buildAmortizationSchedule({principal:300000,annualRatePercent:12,months:12,method:'declining'});
assert.ok(d.firstPayment>d.lastPayment);
assert.equal(computeLoanRatios({monthlyPayment:50000,monthlyCapacity:65000,totalInterest:30000,principal:300000}).coverageInterpretation,'Marge confortable');
console.log('PASS loan-math — 3 méthodes + ratios');

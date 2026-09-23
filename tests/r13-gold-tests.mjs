import assert from 'node:assert/strict';
const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const L=await import('../src/modules/creditLedgerR13.js');let x=L.seed();
assert.equal(x.members.length,4);assert.equal(x.applications.length,4);assert.ok(x.documents.length>=8);assert.equal(x.visits.length,4);assert.equal(x.financials.length,4);assert.equal(x.guarantees.length,4);assert.equal(x.trustObservations.length,12);
const a=x.applications[1];const d=L.dossier(x,a.id);assert.ok(d.financial.capacity>0);assert.ok(d.confidence>=50);assert.ok(d.incluscore>0);assert.ok(d.recommendation.amount>0);assert.ok(d.recommendation.simulation);
L.recordDecision(x,{applicationId:a.id,decision:'VALIDÉ',approvedAmount:d.recommendation.amount,reason:'Validation test'},'Comité');L.disburse(x,{applicationId:a.id,amount:d.recommendation.amount,method:'Caisse'},'Caisse');L.generateSchedule(x,a.id,18,'2026-09-22');assert.equal(L.schedule(x,a.id).length,a.durationMonths);
L.pay(x,{applicationId:a.id,amount:100000,interest:10000},'Caisse');L.addFollowup(x,{applicationId:a.id,type:'Appel',note:'Suivi',nextAction:'Relance'},'Agent');assert.ok(L.dossier(x,a.id).followups.length===1);assert.ok(L.passport(x,a.memberId).length>=1);assert.ok(L.metrics(x).outstanding>0);assert.ok(L.par(x).active>=1);assert.ok(Array.isArray(L.alerts(x)));L.save(x);assert.equal(L.load().version,13);
console.log('R13 GOLD: PASS');

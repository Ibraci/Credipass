import assert from 'node:assert/strict';
const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const L=await import('../src/modules/creditLedgerR14.js');let x=L.seed();
assert.equal(x.members.length,4);assert.equal(x.applications.length,4);
const a=x.applications[1];let d=L.dossier(x,a.id);
assert.equal(d.checklist.percent,60);assert.ok(d.financial.revenue>0);assert.ok(d.debts.length);assert.ok(d.trust.count>=3);assert.ok(d.confidence>50);assert.ok(d.incluscore>0);assert.equal(Object.keys(d.incluscoreDetail.axes).length,7);assert.ok(d.recommendation.simulation.method==='Dégressif');
// complete checklist
for(const label of ['Preuve adresse / localisation','Justificatifs de revenus / activité'])L.addDocument(x,{applicationId:a.id,label,status:'Vérifié',source:'Documenté'},'Agent');assert.equal(L.checklist(x,a.id).percent,100);
L.recordDecision(x,{applicationId:a.id,decision:'VALIDÉ',approvedAmount:d.recommendation.amount,authority:'Comité',meetingRef:'PV-01'},'Comité');L.disburse(x,{applicationId:a.id,amount:d.recommendation.amount,method:'Caisse'},'Caisse');
for(const periodicity of ['Mensuelle','Hebdomadaire','Trimestrielle','Saisonnière']){a.periodicity=periodicity;L.generateSchedule(x,a.id,{annualRate:18,interestMethod:'Dégressif',startDate:'2026-09-22'});assert.ok(L.schedule(x,a.id).length>0)}
const versionsBefore=x.scheduleVersions.length;L.restructure(x,{applicationId:a.id,reason:'Test',evidence:'PREUVE',newDuration:24,newPeriodicity:'Mensuelle',annualRate:17,interestMethod:'Dégressif'},'Comité');assert.ok(x.scheduleVersions.length===versionsBefore+1);assert.ok(x.schedules.some(v=>v.applicationId===a.id&&!v.active));
L.pay(x,{applicationId:a.id,amount:100000,method:'Caisse'},'Caisse');L.addFollowup(x,{applicationId:a.id,type:'Appel',note:'Suivi',nextAction:'Relance'},'Agent');assert.ok(L.passport(x,a.memberId)[0].scheduleVersions.length>=1);
assert.ok('par1' in L.metrics(x)&&'par7' in L.metrics(x)&&'par30' in L.metrics(x));assert.ok(L.reportData(x).auditCount>0);assert.equal(L.memberLogin(x,'M-1002','1234').id,'MEM-0002');assert.equal(L.memberLogin(x,'M-1002','9999'),null);
L.save(x);assert.equal(L.load().version,14);console.log('R14 COMPLETE FUNCTIONAL: PASS');

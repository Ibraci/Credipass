const KEY='credipass.credit-ledger.v1';
const now=()=>new Date().toISOString();
const id=(p,n)=>`${p}-${String(n).padStart(4,'0')}`;

export function seedCreditLedger(){
 const members=[
  {id:'MEM-0001',memberNo:'M-1001',type:'Personne physique',name:'Aïssata Traoré',phone:'76 00 10 01',city:'Bamako',activity:'Commerce de céréales',joinedAt:'2024-02-10'},
  {id:'MEM-0002',memberNo:'M-1002',type:'Entrepreneur individuel',name:'Fatoumata Diallo',phone:'76 00 10 02',city:'Sikasso',activity:'Transformation agroalimentaire',joinedAt:'2023-07-18'},
  {id:'MEM-0003',memberNo:'M-1003',type:'Personne morale',name:'Kanu Agro SARL',phone:'76 00 10 03',city:'Koutiala',activity:'Agro-distribution',joinedAt:'2022-11-03'},
  {id:'MEM-0004',memberNo:'M-1004',type:'Groupe / Coopérative',name:'Coopérative Benkadi',phone:'76 00 10 04',city:'Ségou',activity:'Production maraîchère',joinedAt:'2021-05-21'}
 ];
 const applications=[
  {id:'DOS-0001',memberId:'MEM-0001',product:'Crédit activité',purpose:'Renforcement du stock',requestedAmount:1000000,durationMonths:12,periodicity:'Mensuelle',status:'EN ANALYSE',createdAt:'2026-09-20'},
  {id:'DOS-0002',memberId:'MEM-0002',product:'Crédit saisonnier',purpose:'Campagne de transformation',requestedAmount:1250000,durationMonths:10,periodicity:'Mensuelle',status:'VALIDÉ',approvedAmount:1100000,createdAt:'2026-09-19'},
  {id:'DOS-0003',memberId:'MEM-0003',product:'Crédit entreprise',purpose:'Fonds de roulement',requestedAmount:2500000,durationMonths:18,periodicity:'Mensuelle',status:'EN VÉRIFICATION',createdAt:'2026-09-18'},
  {id:'DOS-0004',memberId:'MEM-0004',product:'Crédit groupement',purpose:'Intrants et irrigation',requestedAmount:1800000,durationMonths:12,periodicity:'Mensuelle',status:'DÉCAISSÉ',approvedAmount:1500000,createdAt:'2026-09-17'}
 ];
 const financials=[
  {id:'FIN-0001',applicationId:'DOS-0001',revenue:500000,businessExpenses:310000,householdExpenses:85000,debtPayments:30000,source:'Déclaré + documenté',at:'2026-09-20'},
  {id:'FIN-0002',applicationId:'DOS-0002',revenue:620000,businessExpenses:355000,householdExpenses:90000,debtPayments:40000,source:'Reconstitué',at:'2026-09-19'},
  {id:'FIN-0004',applicationId:'DOS-0004',revenue:920000,businessExpenses:510000,householdExpenses:0,debtPayments:60000,source:'Documenté + terrain',at:'2026-09-17'}
 ];
 const decisions=[{id:'DEC-0002',applicationId:'DOS-0002',decision:'VALIDÉ',approvedAmount:1100000,reason:'Capacité compatible avec le montant ajusté.',actor:'Comité de crédit',at:'2026-09-21'},{id:'DEC-0004',applicationId:'DOS-0004',decision:'VALIDÉ',approvedAmount:1500000,reason:'Dossier complet et conditions remplies.',actor:'Comité de crédit',at:'2026-09-18'}];
 const disbursements=[{id:'DEC-OUT-0001',applicationId:'DOS-0004',amount:1500000,method:'Virement',reference:'VIR-2026-0918-01',at:'2026-09-18'}];
 const payments=[{id:'PAY-0001',applicationId:'DOS-0004',amount:150000,principal:130000,interest:20000,method:'Caisse',reference:'REC-0001',at:'2026-09-21'}];
 return {version:1,members,applications,financials,decisions,disbursements,payments,fieldVisits:[],guarantees:[],documents:[],audit:[{at:now(),action:'LEDGER_SEEDED',actor:'Système'}]};
}
export function loadCreditLedger(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x?.version===1?x:seedCreditLedger()}catch{return seedCreditLedger()}}
export function saveCreditLedger(x){localStorage.setItem(KEY,JSON.stringify(x));return x}
function audit(x,action,detail={}){x.audit.unshift({at:now(),action,...detail});x.audit=x.audit.slice(0,500)}
export function addMember(x,data,actor='Agent de crédit'){const m={id:id('MEM',x.members.length+1),memberNo:data.memberNo||id('M',1000+x.members.length+1),type:data.type||'Personne physique',name:data.name,phone:data.phone||'',city:data.city||'',activity:data.activity||'',joinedAt:data.joinedAt||now().slice(0,10)};x.members.push(m);audit(x,'MEMBER_CREATED',{actor,memberId:m.id});return m}
export function addApplication(x,data,actor='Agent de crédit'){const a={id:id('DOS',x.applications.length+1),memberId:data.memberId,product:data.product||'Crédit activité',purpose:data.purpose||'',requestedAmount:Number(data.requestedAmount||0),durationMonths:Number(data.durationMonths||12),periodicity:data.periodicity||'Mensuelle',status:'BROUILLON',createdAt:now().slice(0,10)};x.applications.push(a);audit(x,'APPLICATION_CREATED',{actor,applicationId:a.id,memberId:a.memberId});return a}
export function addFinancialSnapshot(x,data,actor='Agent de crédit'){const f={id:id('FIN',x.financials.length+1),applicationId:data.applicationId,revenue:Number(data.revenue||0),businessExpenses:Number(data.businessExpenses||0),householdExpenses:Number(data.householdExpenses||0),debtPayments:Number(data.debtPayments||0),source:data.source||'Déclaré',at:now()};x.financials.push(f);const a=x.applications.find(v=>v.id===f.applicationId);if(a&&a.status==='BROUILLON')a.status='EN ANALYSE';audit(x,'FINANCIAL_DATA_RECORDED',{actor,applicationId:f.applicationId,financialId:f.id});return f}
export function recordDecision(x,data,actor='Comité de crédit'){const d={id:id('DEC',x.decisions.length+1),applicationId:data.applicationId,decision:data.decision,approvedAmount:Number(data.approvedAmount||0),reason:data.reason||'',actor,at:now()};x.decisions.push(d);const a=x.applications.find(v=>v.id===d.applicationId);if(a){a.status=d.decision;a.approvedAmount=d.decision==='VALIDÉ'?d.approvedAmount:0}audit(x,'DECISION_RECORDED',{actor,applicationId:d.applicationId,decision:d.decision});return d}
export function recordDisbursement(x,data,actor='Caisse'){const d={id:id('DEC-OUT',x.disbursements.length+1),applicationId:data.applicationId,amount:Number(data.amount||0),method:data.method||'Caisse',reference:data.reference||'',at:now()};x.disbursements.push(d);const a=x.applications.find(v=>v.id===d.applicationId);if(a)a.status='DÉCAISSÉ';audit(x,'DISBURSEMENT_RECORDED',{actor,applicationId:d.applicationId,amount:d.amount});return d}
export function recordPayment(x,data,actor='Caisse'){const amount=Number(data.amount||0),interest=Number(data.interest||0);const p={id:id('PAY',x.payments.length+1),applicationId:data.applicationId,amount,principal:Math.max(0,amount-interest),interest,method:data.method||'Caisse',reference:data.reference||'',at:now()};x.payments.push(p);audit(x,'PAYMENT_RECORDED',{actor,applicationId:p.applicationId,amount:p.amount});return p}
export function financialPosition(x,applicationId){const a=x.applications.find(v=>v.id===applicationId);const f=[...x.financials].reverse().find(v=>v.applicationId===applicationId);const revenue=f?.revenue||0, expenses=(f?.businessExpenses||0)+(f?.householdExpenses||0)+(f?.debtPayments||0);return {revenue,expenses,capacity:Math.max(0,revenue-expenses),source:f?.source||'Non renseigné'}}
export function ledgerMetrics(x){const requested=x.applications.reduce((s,a)=>s+Number(a.requestedAmount||0),0);const approved=x.decisions.filter(d=>d.decision==='VALIDÉ').reduce((s,d)=>s+Number(d.approvedAmount||0),0);const disbursed=x.disbursements.reduce((s,d)=>s+Number(d.amount||0),0);const principalPaid=x.payments.reduce((s,p)=>s+Number(p.principal||0),0);const outstanding=Math.max(0,disbursed-principalPaid);return {members:x.members.length,applications:x.applications.length,requested,approved,disbursed,outstanding,inProgress:x.applications.filter(a=>!['VALIDÉ','REFUSÉ','DÉCAISSÉ','CLÔTURÉ'].includes(a.status)).length}}

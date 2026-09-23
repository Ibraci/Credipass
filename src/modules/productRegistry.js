export const ROLE_DEFINITIONS = {
  administrator:{label:'Administrateur',permissions:['client.read','client.write','case.read','case.write','case.import','analysis.run','recommendation.write','decision.write','report.export','users.manage','policy.manage','audit.read'],doubleValidation:false},
  creditAgent:{label:'Agent de crédit',permissions:['client.read','client.write','case.read','case.write','case.import','analysis.run'],doubleValidation:false},
  analyst:{label:'Analyste crédit',permissions:['client.read','case.read','analysis.run','recommendation.write','report.export'],doubleValidation:false},
  supervisor:{label:'Responsable crédit',permissions:['client.read','case.read','analysis.run','recommendation.write','decision.write','report.export','audit.read'],doubleValidation:true},
  compliance:{label:'Contrôle conformité',permissions:['client.read','case.read','compliance.review','audit.read'],doubleValidation:false},
  committee:{label:'Comité de crédit',permissions:['client.read','case.read','decision.write','report.export'],doubleValidation:true},
  auditor:{label:'Auditeur',permissions:['client.read','case.read','audit.read','report.export'],doubleValidation:false},
  readonly:{label:'Lecture seule',permissions:['client.read','case.read'],doubleValidation:false}
};
export function can(role, permission){ return (ROLE_DEFINITIONS[role]?.permissions||[]).includes(permission); }
export function seedRegistry(){
 const clients=[
  {id:'CLI-001',memberNo:'MBR-001',joinedAt:'2022-03-14',name:'Aïssata Traoré',type:'Personne physique',city:'Bamako',phone:'',activity:'Activité informelle stable'},
  {id:'CLI-002',memberNo:'MBR-002',joinedAt:'2023-06-10',name:'Fatoumata Diallo',type:'Entrepreneur individuel',city:'Sikasso',phone:'',activity:'Activité saisonnière'},
  {id:'CLI-003',memberNo:'MBR-003',joinedAt:'2025-01-08',name:'Mamadou Coulibaly',type:'Personne physique',city:'Bamako',phone:'',activity:'Commerce'},
  {id:'CLI-004',memberNo:'MBR-004',joinedAt:'2021-09-02',name:'Aminata Dembélé',type:'Personne physique',city:'Koulikoro',phone:'',activity:'Commerce'},
  {id:'CLI-005',memberNo:'MBR-005',joinedAt:'2020-05-19',name:'Coopérative Benkadi',type:'Groupe / coopérative',city:'Ségou',phone:'',activity:'Financement collectif'},
  {id:'CLI-006',memberNo:'MBR-006',joinedAt:'2024-02-21',name:'Kanu Agro SARL',type:'Personne morale',city:'Bamako',phone:'',activity:'Agro-entreprise'}];
 const cases=[
  {id:'DOS-2026-001',clientId:'CLI-001',scenario:'baseline',requested:350000,granted:300000,status:'En cours',durationMonths:12,agent:'Agent crédit 01',disbursed:300000,outstanding:225000,arrears:0,lateDays:0,physicalRef:'2026-001'},
  {id:'DOS-2026-002',clientId:'CLI-002',scenario:'fatoumata',requested:500000,granted:400000,status:'En cours',durationMonths:12,agent:'Agent crédit 02',disbursed:400000,outstanding:320000,arrears:25000,lateDays:12,physicalRef:'2026-002'},
  {id:'DOS-2026-003',clientId:'CLI-003',scenario:'mamadouWeak',requested:250000,granted:0,status:'Ajourné',durationMonths:12,agent:'Agent crédit 01',disbursed:0,outstanding:0,arrears:0,lateDays:0,physicalRef:'2026-003'},
  {id:'DOS-2026-004',clientId:'CLI-004',scenario:'aminataDebt',requested:450000,granted:250000,status:'Finalisé',durationMonths:12,agent:'Agent crédit 02',disbursed:250000,outstanding:125000,arrears:0,lateDays:0,physicalRef:'2026-004'},
  {id:'DOS-2026-005',clientId:'CLI-005',scenario:'cooperative',requested:1200000,granted:1000000,status:'Finalisé',durationMonths:18,agent:'Agent crédit 01',disbursed:1000000,outstanding:720000,arrears:90000,lateDays:34,physicalRef:'2026-005'},
  {id:'DOS-2026-006',clientId:'CLI-006',scenario:'startup',requested:2000000,granted:1500000,status:'Finalisé',durationMonths:24,agent:'Agent crédit 02',disbursed:1500000,outstanding:1200000,arrears:0,lateDays:0,physicalRef:'2026-006'}
 ]; return {clients,cases};
}
export function normalizeRegistry(value){ const seed=seedRegistry(); return {clients:Array.isArray(value?.clients)?value.clients:seed.clients,cases:Array.isArray(value?.cases)?value.cases:seed.cases}; }
export function portfolio(registry){ const r=normalizeRegistry(registry), joined=r.cases.map(c=>({...c,client:r.clients.find(x=>x.id===c.clientId)})); return {joined,total:joined.length,inProgress:joined.filter(x=>['En cours','À compléter','Ajourné','En vérification','En comité'].includes(x.status)).length,finalized:joined.filter(x=>['Finalisé','Validé','Refusé','Clôturé'].includes(x.status)).length,totalRequested:joined.reduce((s,x)=>s+Number(x.requested||0),0),totalGranted:joined.reduce((s,x)=>s+Number(x.granted||0),0)}; }
export function addClientAndCase(registry,input){ const r=normalizeRegistry(registry); const same=r.clients.find(c=>c.name.trim().toLowerCase()===String(input.name||'').trim().toLowerCase() && c.city===input.city); const client=same||{id:`CLI-${String(r.clients.length+1).padStart(3,'0')}`,name:input.name,type:input.applicantType||'Personne physique',city:input.city,phone:input.phone||'',activity:input.activityKey||''}; if(!same)r.clients.push(client); const id=input.reference||`DOS-${new Date().getFullYear()}-${String(r.cases.length+1).padStart(3,'0')}`; if(r.cases.some(x=>x.id===id)) throw new Error('Cette référence dossier existe déjà.'); r.cases.push({id,clientId:client.id,scenario:'custom',requested:Number(input.requestedAmount||0),granted:0,status:'En cours',durationMonths:Number(input.durationMonths||0)}); return {registry:r,client,case:r.cases.at(-1)}; }
export function validateImportRows(rows){ const required=['reference','name','city','requestedAmount','durationMonths']; return rows.map((row,index)=>{const errors=required.filter(k=>String(row[k]??'').trim()==='').map(k=>`Champ ${k} manquant`); if(Number(row.requestedAmount)<=0)errors.push('Montant demandé invalide'); if(Number(row.durationMonths)<=0)errors.push('Durée invalide'); return {index:index+1,row,valid:errors.length===0,errors};}); }

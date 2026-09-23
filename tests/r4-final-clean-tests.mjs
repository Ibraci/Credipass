import fs from 'node:fs';
import { assessCharacterTrust } from '../src/engines/characterTrustEngine.js';
import { assessGuarantee, assessGuaranteePortfolio } from '../src/engines/guaranteeAssessmentEngine.js';
import { DEFAULT_DELEGATION_MATRIX, authorityForAmount, validateDelegationMatrix } from '../src/config/creditGovernancePolicies.js';
import { seedRegistry, portfolio } from '../src/modules/productRegistry.js';

const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const i18n=fs.readFileSync(new URL('../src/i18n.js',import.meta.url),'utf8');
const inst=fs.readFileSync(new URL('../src/config/institutionalPolicies.js',import.meta.url),'utf8');
const security=fs.readFileSync(new URL('../src/config/securityGovernancePolicies.js',import.meta.url),'utf8');
const report=fs.readFileSync(new URL('../src/engines/reportingDocumentEngine.js',import.meta.url),'utf8');

const checks=[];
const ok=(name,value)=>{if(!value) throw new Error('FAIL '+name); checks.push(name); console.log('PASS '+name)};

// LOT 1: façade + absence d'identifiants historiques critiques destinés à la livraison.
ok('LOT1 clean institutional identifiers',!inst.includes('CIF-DEMO-ML')&&!security.includes('implemented-demo')&&!app.includes("replaceAll('Démo','Exemple')"));
ok('LOT1 no engine version in report',!report.includes('Engine v${escapeHtml(report.engineVersion)}'));

// LOT 2: client persistant et multi-dossiers.
const reg=seedRegistry();
ok('LOT2 persistent member identity',reg.clients.length>0&&reg.clients.every(c=>c.memberNo&&c.joinedAt));
const counts=new Map(); for(const d of reg.cases) counts.set(d.clientId,(counts.get(d.clientId)||0)+1);
ok('LOT2 client dossier separation',reg.cases.every(d=>d.clientId)&&reg.clients.every(c=>c.id));

// LOT 3: caractère fondé sur preuves, sans invention en cas d'absence.
const trustKnown=assessCharacterTrust({membershipMonths:48,history:[{status:'Remboursé',lateDays:0}],evidence:[{status:'Documenté'},{status:'Observé'},{status:'Reconstitué'},{status:'Vérifié'}],fieldVerified:true,referencesVerified:1});
const trustUnknown=assessCharacterTrust({membershipMonths:null,history:[],evidence:[],fieldVerified:false,referencesVerified:0});
ok('LOT3 character dimensions',trustKnown.dimensions&&Object.keys(trustKnown.dimensions).length===8);
ok('LOT3 explainable character',Array.isArray(trustKnown.favorable)&&Array.isArray(trustKnown.vigilance)&&Array.isArray(trustKnown.unknown));
ok('LOT3 unknowns preserved',trustUnknown.unknown.length>0);

// LOT 4: parcours économique présent et explicite.
ok('LOT4 economic reconstruction UI',app.includes('Flux économiques')&&app.includes('Capacité prudente'));
ok('LOT4 ratios explained',app.includes('Formule')||app.includes('formule'));

// LOT 5: garantie déclarée non retenue sans expertise; portefeuille calculé.
const missing=assessGuarantee({declaredValue:1000000},1000000);
const verified=assessGuarantee({type:'Équipement',owner:'Client',evidenceRef:'FAC-01',declaredValue:1000000,appraisedValue:800000,expert:'Expert 01',appraisalDate:'2026-09-21',haircutPercent:25},1000000);
const gp=assessGuaranteePortfolio([{appraisedValue:500000,haircutPercent:20,owner:'A',evidenceRef:'P',expert:'E',appraisalDate:'2026-09-21'}],1000000);
ok('LOT5 no declared guarantee retention',missing.retainedValue===null&&missing.status==='À expertiser');
ok('LOT5 professional guarantee chain',verified.retainedValue===600000&&verified.coveragePercent===60&&verified.verified);
ok('LOT5 guarantee portfolio coverage',gp.retainedTotal===400000&&gp.coveragePercent===40);
ok('LOT5 risk confidence separation',app.includes('INCLUSCORE')&&app.includes('Confiance des données'));

// LOT 6: délégation et ajournement.
validateDelegationMatrix(DEFAULT_DELEGATION_MATRIX);
ok('LOT6 delegation matrix',Boolean(authorityForAmount(25000000)?.authority));
ok('LOT6 adjourned status',portfolio(reg).joined.some(x=>x.status==='Ajourné'));
ok('LOT6 human decision',app.includes('Décision humaine'));

// LOT 7: cockpit portefeuille et agent, sans anciennes constantes 72/8.
ok('LOT7 portfolio cockpit',app.includes('Portefeuille à risque')&&app.includes('Pilotage par agent'));
ok('LOT7 no legacy fake PAR constants',!app.includes('Math.round(totalGranted*0.72)')&&!app.includes('Math.round(totalGranted*0.08)'));

// LOT 8: hygiène visible de la façade française principale.
ok('LOT8 french controlled-inclusion labels',!i18n.includes('pilote inclusif contrôlé'));
ok('LOT8 delivery audit markers clean',!inst.includes('ML-CIF-POL-INC-1.0.0'));

console.log(`R4_FINAL_CLEAN_PASS ${checks.length}/${checks.length}`);

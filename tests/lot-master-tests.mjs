import fs from 'node:fs';
import { assessCharacterTrust } from '../src/engines/characterTrustEngine.js';
import { seedRegistry, portfolio } from '../src/modules/productRegistry.js';
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const report=fs.readFileSync(new URL('../src/engines/reportingDocumentEngine.js',import.meta.url),'utf8');
const trust=assessCharacterTrust({membershipMonths:48,history:[{status:'Remboursé',lateDays:0}],evidence:[{status:'Documenté'},{status:'Observé'},{status:'Reconstitué'},{status:'Vérifié'}],fieldVerified:true,referencesVerified:1});
const checks=[
 ['LOT1 navigation/security',app.includes('productUsers')&&css.includes('.cp-login-screen')],
 ['LOT2 member history structure',seedRegistry().clients.every(x=>x.memberNo&&x.joinedAt)],
 ['LOT3 Character & Trust',trust.proofLevel==='Élevé'&&app.includes('Pourquoi cette appréciation ?')],
 ['LOT4 economic flows',app.includes('Flux économiques')&&app.includes('Capacité prudente')],
 ['LOT5 risk/sustainability',app.includes('INCLUSCORE')&&app.includes('Soutenabilité')],
 ['LOT6 adjourned workflow',portfolio(seedRegistry()).joined.some(x=>x.status==='Ajourné')&&app.includes('Décision humaine')],
 ['LOT7 portfolio cockpit',app.includes('Portefeuille à risque')&&app.includes('Pilotage par agent')],
 ['LOT8 no report engine version',!report.includes('Engine v${escapeHtml(report.engineVersion)}')]
];
for(const [n,ok] of checks){if(!ok)throw new Error('FAIL '+n);console.log('PASS '+n)}
console.log(`MASTER_LOTS_PASS ${checks.length}/${checks.length}`);

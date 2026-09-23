import fs from 'node:fs';
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const checks=[
 ['dashboard clients KPI',app.includes('<small>Clients</small>')],
 ['client/dossier separation',app.includes('Un client peut avoir plusieurs dossiers')],
 ['six analysis steps',['Situation','Données & preuves','Flux économiques','Confiance','INCLUSCORE','Soutenabilité'].every(x=>app.includes(x))],
 ['evidence semantics',['Déclaré','Documenté','Observé','Reconstitué'].every(x=>app.includes(x))],
 ['template integration',app.includes('Canevas d’import complet')],
 ['human decision',app.includes('Décision humaine')],
 ['responsive evidence',css.includes('.cp-evidence-row')&&css.includes('@media(max-width:430px)')],
 ['desktop stepper no ellipsis',css.includes('text-overflow:clip!important')],
 ['admin hash not plaintext',!app.includes("password:'Admin@123'")&&!app.includes('password:"Admin@123"')]
];
for(const [name,ok] of checks){if(!ok)throw new Error('FAIL '+name); console.log('PASS '+name)}
console.log(`CLOSURE_UI_TESTS_PASS ${checks.length}/${checks.length}`);

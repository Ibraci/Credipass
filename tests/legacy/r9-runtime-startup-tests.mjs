import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const checks=[
 ['login visible by default', /id="loginScreen" class="cp-login-screen">/.test(html)],
 ['boot watchdog', html.includes('__CREDIPASS_BOOT_OK__') && html.includes('Démarrage interrompu')],
 ['R9 app cache buster', html.includes('app.js?r=r9-runtime')],
 ['R9 SW registration', app.includes("sw.js?r=r9-runtime")],
 ['R9 SW cache', sw.includes("credipass-r9-runtime")],
 ['runtime network first', sw.includes("cache: 'no-store'") && sw.includes("endsWith('.js')")],
 ['launcher exists', fs.existsSync(new URL('../../windows/LANCER_CREDIPASS.bat',import.meta.url))]
];
let bad=0; for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`); if(!ok) bad++;}
if(bad) process.exit(1); console.log(`R9_RUNTIME_STARTUP_PASS ${checks.length}/${checks.length}`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as L from '../src/modules/creditLedgerR15.js';
import {DEMO_USERS} from '../src/modules/accessControlR18.js';
import {buildCopilotContext,answerCopilotOffline} from '../src/modules/credipassAICopilotR193.js';

const root=new URL('../',import.meta.url);
const app=fs.readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/az.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

// 1) Tous les data-act visibles doivent avoir un handler.
const acts=[...new Set([...app.matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]))];
for(const a of acts)assert.ok(app.includes(`name==='${a}'`),`action sans handler: ${a}`);

// 2) Nouveau membre : vraie modale large et confortable.
assert.match(app,/modal\('Nouveau membre',[\s\S]*?\{size:'xwide',submitLabel:'Créer le membre'\}/);
assert.match(css,/dialog-xwide\{width:min\(1240px,98vw\)\}/);
assert.match(css,/form-intro/);
for(const field of ['Date de naissance','Nationalité','Quartier','Type de pièce','Origine des fonds','Profil de risque','Personne Politiquement Exposée (PPE)','Copie certifiée de la pièce d’identité']) assert.ok(app.includes(field),`champ adhésion manquant: ${field}`);


// 3) Passeport financier : moteur sain pour tous les membres + modale lecture dédiée.
const db=L.seed();
for(const m of db.members){
  const p=L.passport(db,m.id);
  assert.ok(Array.isArray(p),`passeport ${m.id}`);
}
assert.match(app,/function infoModal\(/);
assert.match(app,/infoModal\('Passeport financier — '/);
assert.match(app,/Impossible d’ouvrir le passeport financier/);

// 4) Copilot : doit répondre même sans dossier et à une salutation.
const hello=answerCopilotOffline('Bonjour',null);
assert.match(hello,/Bonjour/i);
assert.match(hello,/Assistant CREDIPASS/i);
const agent=DEMO_USERS.find(x=>x.login==='agent.credit');
const dossier=L.dossier(db,'DOS-0005');
const ctx=buildCopilotContext(db,dossier,{...agent,scopeMode:'GLOBAL'});
const helloCtx=answerCopilotOffline('Bonjour',ctx);
assert.match(helloCtx,/DOS-0005/);
assert.match(answerCopilotOffline('Qu’est-ce que l’INCLUSCORE ?',null),/INCLUSCORE/i);
assert.match(answerCopilotOffline('Explique-moi ce dossier',ctx),/INCLUSCORE/i);

// 5) FAB propre + cache PWA frais.
assert.ok(html.includes('id="copilotFab"'));
assert.match(css,/copilot-fab \.chat-glyph/);
assert.match(sw,/mvp-profile-ready/);
assert.match(html,/az-app\.js\?r=19\.3\.2-profile-ready/);


// 6) Aucun contrôle décoratif mort sur le parcours principal.
assert.ok(!html.includes('Mot de passe oublié ?'),'Pas de bouton mot de passe oublié sans backend dans le MVP');
assert.ok(html.includes('id="globalSearchResults"'),'Recherche globale avec résultats');
assert.match(app,/name==='searchMember'/);
assert.match(app,/name==='searchApp'/);
assert.match(app,/e\.ctrlKey\|\|e\.metaKey/,'Ctrl+K doit être raccordé');
assert.ok(!app.includes('Parcours institutionnel R17'),'Aucun libellé technique R17 visible');
const server=fs.readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
assert.match(server,/PDFTOPPM_MISSING/,'OCR PDF manquant doit être expliqué proprement');

console.log(`MVP JURY READY: PASS — ${acts.length} actions UI raccordées, ${db.members.length} passeports testés, formulaire membre large, Copilot conversationnel local opérationnel.`);

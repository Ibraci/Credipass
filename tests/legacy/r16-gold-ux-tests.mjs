import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8');const app=fs.readFileSync(new URL('../../src/az-app.js',import.meta.url),'utf8');const css=fs.readFileSync(new URL('../../src/az.css',import.meta.url),'utf8');
for(const t of ['Bon retour parmi nous','Identifiant','Mot de passe','Se connecter','Déconnexion'])assert.ok(html.includes(t),t);
for(const t of ['Welcome back','Username','Password','Sign In','Remember me','Forgot password'])assert.ok(!html.includes(t),`anglais visible: ${t}`);
assert.ok(app.includes('Caractère & confiance — fait vérifiable'));assert.ok(css.includes('.login-screen'));console.log('R16 LEGACY COMPAT: PASS — invariants UX français conservés dans la release courante');

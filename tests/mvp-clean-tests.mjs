import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as L from '../src/modules/creditLedgerR15.js';

const root=new URL('../',import.meta.url);
const app=fs.readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(app,/apiLogin,apiLogout,apiMe,verifyOfflineLogin/,'apiMe doit être importé');
assert.doesNotMatch(app,/const f=d\.productForm/,'Le formulaire salarié ne doit pas lire d avant initialisation');
assert.doesNotMatch(app,/if\(name==='editPme(?:Business|Budget|Balance)'\)[\s\S]{0,220}const b=d\./,'Les actions PME ne doivent pas lire d avant initialisation');
assert.match(app,/\$\('#copilotFab'\)\?\.addEventListener\('click'/,'La bulle Copilot doit avoir un gestionnaire direct');
assert.match(app,/function setCopilotOpen\(/,'Le Copilot doit avoir une primitive d’ouverture robuste');
assert.match(html,/aria-controls="copilotDrawer"/,'La bulle Copilot doit cibler explicitement le panneau');
assert.match(html,/>💬<\/span>/u,'La bulle doit afficher une vraie icône de discussion');
assert.doesNotMatch(app,/Parcours institutionnel R17/,'Aucun libellé technique R17 ne doit être visible dans le dossier');
assert.doesNotMatch(app,/SFD FIELD ·/,'Aucun libellé technique SFD FIELD ne doit être visible');

const db=L.seed();
const app5=db.applications.find(a=>a.demoCase==='DOSSIER_COMPLET');
assert.ok(app5,'Le dossier MVP complet doit exister');
assert.equal(app5.id,'DOS-0005','Le scénario jury doit rester DOS-0005');
const d=L.dossier(db,app5.id);
assert.equal(d.member.name,'Moussa Coulibaly');
assert.equal(d.policy.ok,d.policy.items.length,'Les contrôles de politique du dossier MVP doivent être conformes');
assert.ok(d.documents.filter(x=>x.status==='Vérifié').length>=4,'Le dossier MVP doit avoir ses pièces principales vérifiées');
assert.ok(d.visits.length>=1,'Le dossier MVP doit comporter une vérification terrain');
assert.ok(d.guarantees.length>=1,'Le dossier MVP doit comporter une garantie');
assert.ok(d.productForm?.data?.employer,'Le formulaire salarié MVP doit être renseigné');
assert.notEqual(d.workflow.next,'AGENT_CREDIT','Le dossier MVP doit avoir dépassé l’étape agent');
assert.doesNotThrow(()=>L.salaryCapacity(db,app5.id));

console.log('MVP CLEAN: PASS');
console.log(`DOS-0005: ${d.documents.length} pièce(s), ${d.visits.length} visite(s), politique ${d.policy.ok}/${d.policy.items.length}, prochaine étape ${d.workflow.next}`);

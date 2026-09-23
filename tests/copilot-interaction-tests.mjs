import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as L from '../src/modules/creditLedgerR15.js';
import {buildCopilotContext,askCopilot,answerCopilotOffline} from '../src/modules/credipassAICopilotR193.js';
import {DEMO_USERS} from '../src/modules/accessControlR18.js';

const source=readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
const action=source.slice(source.indexOf('function act('),source.indexOf('function setCopilotOpen('));
const drawer={hidden:true};
const thread={html:'',insertAdjacentHTML(_,html){this.html+=html}};
let calls=0;
const context=vm.createContext({
  active:null,db:L.seed(),currentUser:DEMO_USERS.find(u=>u.login==='agent.credit'),L,
  $:selector=>({'#copilotDrawer':drawer,'#copilotThread':thread}[selector]||null),
  setCopilotOpen:open=>{drawer.hidden=!open},toggleCopilot:()=>{drawer.hidden=!drawer.hidden},
  buildCopilotContext,answerCopilotOffline,
  askCopilot:(...args)=>{calls++;return askCopilot(...args)},
  connectionState:()=>'HORS_CONNEXION',esc:value=>String(value??'')
});
vm.runInContext(action,context);
vm.runInContext("act('copilotAsk',{dataset:{question:'Bonjour'}})",context);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(calls,1,'Une question doit être traitée depuis l’accueil sans dossier actif');
assert.equal(drawer.hidden,false);
assert.match(thread.html,/Bonjour/);
assert.match(thread.html,/ASSISTANT_LOCAL/);
vm.runInContext("act('copilotClose',{dataset:{}})",context);
assert.equal(drawer.hidden,true,'La fermeture doit fonctionner sans dossier');
context.active='DOS-0005';thread.html='';
vm.runInContext("act('copilotAsk',{dataset:{question:'Explique-moi ce dossier'}})",context);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(calls,2);
assert.match(thread.html,/DOS-0005/);
assert.match(thread.html,/INCLUSCORE/);
console.log('COPILOT INTERACTION: PASS — accueil, réponse locale, fermeture, contexte dossier');

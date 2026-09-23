import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/az-app.js',import.meta.url),'utf8');
assert.match(html, /id="globalSearchResults"[^>]*hidden/, 'Le panneau de résultats doit exister dans la page');
const box={hidden:true,innerHTML:''};
const member={id:'MEM-1',name:'Émilie Test',memberNo:'M-001',city:'Bamako'};
const app={id:'DOS-0005',memberId:member.id,product:'Crédit salarié'};
const context=vm.createContext({
  $:selector=>selector==='#globalSearchResults'?box:null,
  db:{members:[member]},currentUser:{},esc:value=>String(value??''),
  visibleMembers:()=>[member],visibleApplications:()=>[app]
});
const start=source.indexOf('function hideGlobalSearchResults(');
const end=source.indexOf('\ndocument.addEventListener',start);
assert.ok(start>=0&&end>start);
vm.runInContext(source.slice(start,end),context);
for(const [query,expected] of [['emilie','searchMember'],['DOS-0005','searchApp']]){
  context.query=query;
  vm.runInContext('renderGlobalSearchResults(query)',context);
  assert.equal(box.hidden,false);
  assert.ok(box.innerHTML.includes(expected));
}
vm.runInContext("renderGlobalSearchResults('introuvable')",context);
assert.match(box.innerHTML,/Aucun résultat/);
vm.runInContext("renderGlobalSearchResults('')",context);
assert.equal(box.hidden,true);
assert.equal(box.innerHTML,'');
console.log('GLOBAL SEARCH: PASS — panneau, nom sans accent, dossier, aucun résultat, effacement');

import assert from 'node:assert/strict';
import {normalizeTerritory,normalizeUser,territorialAccess,detectConflict} from '../src/modules/decentralizedR191.js';
import {askCredipass,glossary,explainDossier} from '../src/modules/credipassAssistantR191.js';
let db={members:[{id:'M1',agency:'Agence principale'}],applications:[{id:'D1',memberId:'M1'}],audit:[]};normalizeTerritory(db);
assert.ok(db.members[0].institutionId&&db.members[0].structureId&&db.members[0].zoneId);
let u=normalizeUser({login:'a',agency:'Agence principale',scopeMode:'AGENCY'});assert.equal(territorialAccess(u,db.members[0]),true);
assert.equal(detectConflict({id:'1',version:1,a:1},{id:'1',version:1,a:2}).resolution,'HUMAINE_REQUISE');
assert.ok(glossary().length>=15);assert.match(askCredipass('Qu’est-ce que l’INCLUSCORE ?'),/1000/);assert.match(askCredipass('Explique la confiance des données'),/100/);assert.match(explainDossier({incluscore:716,confidence:82,financial:{}}),/716\/1000/);assert.match(explainDossier({incluscore:716,confidence:82,financial:{}}),/82\/100/);
console.log('R19.1 DECENTRALIZED + ASSISTANT: PASS');

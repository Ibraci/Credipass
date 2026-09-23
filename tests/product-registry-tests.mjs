import assert from 'node:assert/strict';
import {seedRegistry,portfolio,addClientAndCase,validateImportRows,can} from '../src/modules/productRegistry.js';
let r=seedRegistry(); let p=portfolio(r); assert.equal(p.total,6); assert.equal(p.totalRequested,4750000); assert.equal(p.totalGranted,3450000);
let x=addClientAndCase(r,{reference:'DOS-X',name:'Aïssata Traoré',city:'Bamako',requestedAmount:100000,durationMonths:6}); assert.equal(x.registry.clients.length,6); assert.equal(x.registry.cases.length,7); assert.equal(x.case.clientId,'CLI-001');
assert.equal(validateImportRows([{reference:'D1',name:'X',city:'Bamako',requestedAmount:10,durationMonths:2}])[0].valid,true);
assert.equal(validateImportRows([{reference:'',name:'X',city:'',requestedAmount:0,durationMonths:0}])[0].valid,false);
assert.equal(can('creditAgent','decision.write'),false); assert.equal(can('committee','decision.write'),true); console.log('PRODUCT_REGISTRY_TESTS_PASS');

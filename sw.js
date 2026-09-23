// MVP CLEAN 1 — réinstallation du cache applicatif
const CACHE='credipass-r19-3-2-search-results-1';
const BUILD='profil-1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./assets/logo-credipass.png','./src/az.css','./src/az-app.js','./src/modules/creditLedgerV2.js','./src/modules/creditLedgerR14.js','./src/modules/creditLedgerR15.js','./src/modules/dataRepository.js','./src/modules/documentStoreR17.js','./src/modules/accessControlR18.js','./src/modules/decentralizedR191.js','./src/modules/credipassAssistantR191.js','./src/modules/sfdFieldR193.js','./src/modules/sfdScoreInput.js','./src/modules/memberOnboarding.js','./src/engines/sfdCreditScoreEngine.js','./src/config/sfdScorePolicies.js','./src/modules/credipassAICopilotR193.js','./src/modules/offlineFieldR18.js',
  './src/modules/ocrR183.js',
  './src/modules/authProductionR184.js',
  './src/modules/productCatalogR186.js','./src/modules/dataGovernanceR187.js','./src/modules/xlsxImportR187.js','./templates/CREDIPASS_CANEVAS_IMPORT_COMPLET.xlsx'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});

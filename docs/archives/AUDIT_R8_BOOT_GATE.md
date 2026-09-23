# CREDIPASS — R8 BOOT GATE

Date: 22 septembre 2026

## Incident corrigé
La R7 pouvait afficher une page blanche car `src/app.js` demandait deux exports ES Modules inexistants :
- `buildModelValidationSample` alors que la fixture exportait `buildModelValidationDemo` ;
- `createScenarioResetCertificate` alors que le moteur exportait `createDemoResetCertificate`.

Les exports ont été normalisés vers les noms réellement utilisés par l'application.

## Nouveau BOOT GATE
`tests/boot-gate-tests.mjs` parcourt récursivement le graphe de modules depuis `src/app.js`, vérifie l'existence de chaque module relatif et la présence de chaque export nommé/default demandé.

Résultat : `BOOT_GATE_PASS modules=91 imports/exports=coherents`.

## Régressions exécutées après correction
- moteurs/scénarios : 51/51 PASS
- UI clôture : 9/9 PASS
- crédit : 3 méthodes + ratios PASS
- Master Refactor : PASS
- Product Registry : PASS
- LOT 1→8 : 8/8 PASS
- R3 : 7/7 PASS
- R4 : 20/20 PASS
- R5 : 12/12 PASS
- R6 : 8/8 PASS
- R7 : 8/8 PASS
- BOOT GATE R8 : PASS (91 modules)

## Limite de certification
Le BOOT GATE supprime la classe d'erreur qui a causé la page blanche R7. Le rendu Windows/Chrome et le redémarrage offline doivent encore être constatés sur la machine cible avant GO GitLab.

# CREDIPASS — Audit R5 Release Candidate

## Objet
Passe de qualité industrielle sans ajout de périmètre métier.

## Corrections R5
- identité npm normalisée : `credipass` / version 5.8.0 ;
- jeux de données fictifs séparés dans `src/fixtures/` et documentés comme synthétiques ;
- fichiers `demo-*` renommés en `sample-*` ;
- `demoScenarioEngine` renommé `scenarioEngine` ;
- `institutionalPilotEngine` renommé `institutionalReadinessEngine` ;
- politique de readiness normalisée ;
- identifiants synthétiques `DEMO-*` principaux remplacés par `SAMPLE-*` / `SYNTH-*` ;
- anciennes clés de stockage demo/pilot normalisées ;
- version du moteur retirée de la preuve visible du parcours ;
- plusieurs badges visibles en anglais francisés lorsque l'interface est en français ;
- manifeste SHA-256 fichier par fichier ajouté.

## Tests exécutés
- moteurs/scénarios : 51/51 PASS ;
- crédit : 3 méthodes + ratios PASS ;
- Master Refactor PASS ;
- Product Registry PASS ;
- UI clôture 9/9 PASS ;
- LOTS 1→8 : 8/8 PASS ;
- R3 Hardening 7/7 PASS ;
- R4 Final Clean 20/20 PASS ;
- R5 Release Candidate 12/12 PASS.

## Limite de certification
La R5 est un candidat de livraison technique. Le rendu Chrome/Windows et le redémarrage réellement hors connexion de ce paquet exact doivent encore être constatés sur la machine cible avant de marquer LOT 8 définitivement certifié et avant le push GitLab CIF.

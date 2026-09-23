# CREDIPASS R15 — Institutional Credit Process Engine

## Base
R14 conservée comme socle transactionnel. R15 ajoute des parcours institutionnels configurables issus des formulaires Salarié et PME fournis pour l'analyse.

## Ajouts vérifiés
- Form Engine par produit : Crédit salarié / Crédit PME
- Checklists documentaires propres au produit
- Workflow Salarié : Agent de crédit → Superviseur → Comité de crédit
- Workflow PME : Agent de crédit → Chef d'agence/Analyste → Comité de crédit
- Policy Engine distinct du scoring
- PME : analyse activité/marché, marge brute, résultat d'exploitation
- PME : budget personnel et bilan personnel
- PME : grille institutionnelle de risque à 9 dimensions
- Salarié : salaire net, quotité cessible, remboursement mensuel et contrôle de capacité
- Conservation des moteurs R14 : INCLUSCORE, confiance, garanties, simulation, décision, décaissement, échéancier, paiements, PAR, passeport, offline

## Tests exécutés
- node --check src/modules/creditLedgerR15.js : PASS
- node --check src/az-app.js : PASS
- npm run test:r15 : PASS
- npm test : 51/51 PASS
- npm run test:r13 : PASS
- npm run test:boot : PASS (92 modules)
- npm run test:r12 : 15/15 PASS
- npm run test:r11 : 8/8 PASS

## Limite de la certification
PASS signifie conformité aux scénarios automatisés du périmètre Hackathon. Cela ne constitue pas une certification bancaire/réglementaire de production.

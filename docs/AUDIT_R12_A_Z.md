# CREDIPASS R12 — Audit A→Z

Cette version remplace la façade R11 incomplète par une façade transactionnelle dédiée au processus crédit.

## Parcours branché sur le registre local
Membre → Demande → Documents → Visite terrain → Analyse économique → Garanties → Décision humaine → Décaissement → Remboursement → Restructuration → Clôture.

## Règles vérifiées
- vocabulaire visible : Membre ;
- 4 types de membre présents ;
- création et modification membre ;
- création et modification demande ;
- documents et statut ;
- visite terrain ;
- revenus/charges/dettes et capacité calculée ;
- garantie : valeur retenue vide tant qu'elle n'est pas renseignée ;
- décision humaine distincte du décaissement ;
- décaissement impossible sans décision VALIDÉE et impossible au-delà du montant autorisé ;
- paiements calculent le principal et l'encours ;
- restructuration conserve une trace ;
- clôture refusée si encours > 0 ;
- dashboard et portefeuille calculés depuis le registre ;
- audit des opérations ;
- espace membre de base ;
- offline Service Worker limité aux ressources réellement utilisées.

## Tests
- `node --check src/az-app.js` : PASS
- `node tests/r12-az-tests.mjs` : 15/15 PASS
- tests moteurs historiques : PASS
- Service Worker : 6 ressources, 0 manquante

## Limites assumées
La R12 est une V1 locale/offline. Elle ne constitue pas encore un backend multi-utilisateur de production. L'authentification forte, la synchronisation serveur et les connecteurs institutionnels restent hors de ce paquet local.

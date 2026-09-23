# CREDIPASS R18.1 — HARDENING

## Corrections
- RBAC appliqué aux actions sensibles : garanties, décaissement, échéancier, paiements, suivi, restructuration et clôture.
- Ajout de profils opérationnels Caisse/Décaissement et Suivi/Recouvrement afin de ne pas attribuer ces pouvoirs à l'Agent de crédit.
- Filtrage de périmètre par agence/propriétaire pour les rôles opérationnels ; rôles de contrôle institutionnel conservent leur périmètre global de démonstration.
- Contrôle d'accès au dossier avant rendu.
- Création terrain affectée à l'agence et au compte de l'agent connecté.
- Service Worker R18.1 et précache des modules accessControlR18/offlineFieldR18.
- Tests historiques obsolètes archivés dans tests/legacy ; suite active alignée sur le contrat courant.

## Limites assumées
- Pas d'API/PostgreSQL central : la file locale ne prétend pas être synchronisée avec un serveur.
- Pas d'OCR certifié.
- Le test E2E navigateur réel avec coupure réseau reste distinct des tests Node statiques/métier.

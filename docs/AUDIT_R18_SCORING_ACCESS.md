# CREDIPASS R18 — Scoring & Access Control

## Périmètre réellement intégré
- 8 comptes/rôles institutionnels de démonstration avec permissions distinctes.
- Agent de crédit : création membre/demande, documents et visite terrain, utilisables avec la persistance locale hors connexion.
- Cockpit adapté au rôle et indicateur En ligne / Hors connexion.
- File locale « À synchroniser » pour les opérations terrain.
- 20 membres / 20 dossiers / 16 cas pratiques conservés et migration des anciennes bases de démonstration partielles.
- Espace membre externe retiré du périmètre prioritaire.
- Passeport financier enrichi avec historique multi-dossiers et tableau d'échéances/paiements/retards.
- RBAC : l'agent ne décide pas ; l'auditeur est en lecture ; l'administrateur n'obtient pas de droit d'octroi ; le comité dispose des actions de décision.
- Import PDF local IndexedDB et SHA-256 conservés.

## Limite volontaire et explicite
La synchronisation vers une base centrale/API n'est PAS implémentée dans cette release. R18 conserve les opérations hors ligne et les place en attente ; elle ne simule pas un succès serveur. Une API centrale + PostgreSQL restent un lot de production ultérieur.

## Contrôles exécutés
- `node --check src/az-app.js` : PASS
- `npm run test:r18` : PASS
- `npm test` : 51/51 PASS
- `npm run test:r11` : 8/8 PASS
- `npm run test:r12` : 15/15 PASS
- `npm run test:r13` : PASS
- `npm run test:r15` : PASS
- `npm run test:r17` : PASS
- `npm run test:boot` : PASS

Le test historique `test:r16` attend encore l'ancien « espace membre ». Il échoue désormais volontairement car cet espace a été retiré du périmètre R18 à la demande produit. Ce n'est pas masqué comme un PASS.

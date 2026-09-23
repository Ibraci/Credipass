# AUDIT R19.3.2 — POSTGRESQL CENTRAL

## Décision

Architecture retenue : **IndexedDB côté terminaux + PostgreSQL côté central**.

## Modifications

- suppression de `node:sqlite` du serveur de production ;
- suppression des fichiers SQLite centraux du package ;
- ajout d'un stockage PostgreSQL asynchrone ;
- schéma central PostgreSQL avec JSONB pour l'agrégat métier et tables relationnelles pour auth/sync/audit ;
- transactions PostgreSQL autour de la synchronisation ;
- PostgreSQL obligatoire en production : pas de fallback silencieux ;
- stockage mémoire limité aux tests automatisés isolés ;
- `GET /api/health` expose le moteur de base et confirme `IndexedDB` comme stockage terminal ;
- launchers Windows bloquent le démarrage si PostgreSQL n'est pas joignable ;
- configuration par `.env.local` non versionné ;
- préparation Docker facultative ;
- ajout d'un test PostgreSQL réel optionnel séparé.

## Certification exécutée dans l'environnement de build

- `npm run test:all` : PASS après migration ;
- `npm run test:r19.3.2` : PASS ;
- syntaxe Node des nouveaux modules : PASS ;
- absence de `node:sqlite` dans le backend courant : PASS ;
- absence de fichier `.sqlite` dans la release R19.3.2 : PASS.

## Limite

Aucune instance PostgreSQL réelle n'est disponible dans l'environnement de build. Le test `npm run test:postgres:real` doit donc être exécuté sur une base PostgreSQL de test avant de revendiquer une certification PostgreSQL physique/réelle.

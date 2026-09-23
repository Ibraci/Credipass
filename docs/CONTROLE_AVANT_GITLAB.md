# Contrôle avant GitLab CIF — R19.3.2 POSTGRESQL CENTRAL

- [x] Code PWA, moteurs, backend et tests inclus.
- [x] **IndexedDB maintenu côté terminaux/PWA**.
- [x] **PostgreSQL obligatoire côté central de production**.
- [x] `node:sqlite` supprimé du backend courant.
- [x] Aucun fichier `.sqlite` / `.db` livré dans la release R19.3.2.
- [x] Schéma PostgreSQL fourni (`db/postgresql/001_init.sql`).
- [x] Chaîne PostgreSQL limitée au serveur via `CREDIPASS_DATABASE_URL`.
- [x] Aucun fallback SQLite ou mémoire silencieux en production.
- [x] Stockage mémoire réservé à `CREDIPASS_TEST_MODE=1`.
- [x] Synchronisation centrale transactionnelle + versionnement optimiste.
- [x] Formulaires terrain Salarié/PME inclus.
- [x] CREDIPASS AI COPILOT inclus avec bulle flottante et contexte dossier.
- [x] Fournisseur IA côté serveur, aucun secret dans le navigateur.
- [x] Repli local/offline explicitement identifié comme assistant local.
- [x] Snapshot sans opération acceptée = aucune mutation centrale.
- [x] Données SFD nouvelles incluses dans la synchronisation centrale.
- [x] Conflits conservés jusqu'à résolution humaine.
- [x] Idempotence d'un événement rejoué testée.
- [x] Rattachement Institution / Structure / Agence / Zone propagé.
- [x] Mode LAN explicite fourni.
- [x] Session serveur revalidée en ligne.
- [x] `npm run test:all` PASS.
- [x] `npm run test:r19.3.2` PASS.
- [x] Syntaxe JS/MJS PASS : **161 fichiers**.
- [x] `.env.local` / `.env.postgres.local` exclus de Git.
- [ ] `npm run test:postgres:real` — SKIP tant qu'une vraie base PostgreSQL de test n'est pas fournie.
- [ ] `npm run test:ai:real` — SKIP tant qu'un fournisseur IA réel n'est pas configuré.
- [ ] Test physique Android/PC terrain ↔ agence ↔ central.
- [ ] Coupure réseau réelle + fermeture/réouverture + reprise.
- [ ] Contrôle sur écran de projection.

Avant production institutionnelle : TLS, secrets centralisés, sauvegardes/restaurations PostgreSQL, chiffrement au repos, supervision, audit de sécurité et politique de rotation des clés.

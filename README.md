# CREDIPASS by KABU PRO

**Le passeport de confiance financière pour un microcrédit responsable.**

CREDIPASS est une application web installable (PWA) qui aide une institution de microfinance à instruire un dossier de crédit : collecte des pièces, visite terrain, analyse de capacité, score INCLUSCORE expliqué, contrôles de politique et circuit de validation Agent → Analyste → Comité.

> **Principe non négociable :** ni le score ni l'assistant IA n'accordent ou ne refusent un crédit. La décision finale reste humaine.

Projet présenté au **Hackathon National d'Innovation CIF — édition Mali (Track B)**. Toutes les données de démonstration sont **synthétiques** : aucune donnée personnelle réelle n'est utilisée.

## Démarrage avec Docker

Prérequis : **Docker** (Docker Desktop, ou Podman avec `docker compose`). Rien d'autre à installer : l'image contient Node.js, l'OCR (Tesseract français/anglais, Poppler) et le projet ; PostgreSQL tourne dans un second conteneur.

```bash
cp .env.docker.example .env
# Renseigner POSTGRES_PASSWORD dans .env (par exemple : openssl rand -hex 24)
docker compose up -d --build
```

Ouvrir **http://127.0.0.1:8092** et se connecter, par exemple avec `agent.credit` / `Agent@2026`.

**Sous Windows**, avec Docker Desktop démarré : double-cliquer sur `windows\DEMARRER_DOCKER.bat`. Au premier lancement, le script crée `.env` avec un mot de passe aléatoire propre au PC, démarre la base et l'application, puis ouvre le navigateur. Pour arrêter : `windows\ARRETER_DOCKER.bat`. Ne transmettez pas votre propre `.env` : chaque PC génère le sien.

| Action | Commande |
|---|---|
| Voir l'état | `docker compose ps` |
| Voir les journaux | `docker compose logs -f app` |
| Après une modification du code | `docker compose up -d --build --force-recreate app` |
| Arrêter | `docker compose down` (les données sont conservées) |
| Tout effacer, base comprise | `docker compose down -v` |
| Démo en réseau local | `CREDIPASS_BIND=0.0.0.0` dans `.env`, puis `docker compose up -d` |

Avec Podman, activer d'abord le socket : `systemctl --user start podman.socket` puis `export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock`.

## Démarrage sans Docker

Prérequis : **Node.js 20+** et **PostgreSQL**.

Sous Windows, pour une première installation native :

1. Installer Node.js 20+ et PostgreSQL, puis démarrer le service PostgreSQL.
2. Lancer `windows\PREPARER_POSTGRESQL_NATIF_V2.bat` et saisir le mot de passe administrateur PostgreSQL dans la fenêtre. Le script prépare la base, génère `.env.local`, installe les dépendances et initialise les comptes de démonstration.
3. Démarrer le serveur depuis la racine du projet :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\Serve-CrediPass.ps1
```

4. Ouvrir **http://127.0.0.1:8092**.

Si la base et le compte applicatif existent déjà, copier `.env.example` vers `.env.local`, renseigner la connexion réelle, puis exécuter `npm.cmd ci --omit=dev` et `node scripts/check-postgres.mjs`.

**Attention aux comptes :** les lanceurs `LANCER_CREDIPASS.bat` et `LANCER_MVP_DEMO_CORRIGE.bat` réinitialisent encore les mots de passe de démonstration. Pour conserver les mots de passe choisis, utiliser `Serve-CrediPass.ps1` et ne pas activer `CREDIPASS_RESET_DEMO_PASSWORDS=1`. La préparation initiale et `PREPARER_COMPTES_DEMO.bat` réinitialisent également les comptes. Docker active cette option par défaut : la mettre à `0` dans `.env` pour conserver les mots de passe.

Sous Linux, avec Podman pour PostgreSQL seulement :

```bash
# .env.postgres.local : POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
# .env.local : CREDIPASS_DATABASE_URL=postgresql://credipass:<mot de passe>@127.0.0.1:5433/credipass
podman run -d --name credipass-postgresql --restart unless-stopped \
  --env-file .env.postgres.local -p 127.0.0.1:5433:5432 \
  -v credipass_pgdata:/var/lib/postgresql/data docker.io/library/postgres:17-alpine
node scripts/check-postgres.mjs          # vérifie la connexion et crée le schéma
node scripts/reset-demo-accounts.mjs     # crée les 10 comptes de démonstration
node scripts/boot.mjs 8092               # → http://127.0.0.1:8092
```

Les identifiants de démonstration (un compte par rôle) sont dans [docs/COMPTES_DEMONSTRATION.md](docs/COMPTES_DEMONSTRATION.md).

## Parcours de démonstration

Dossier des données synthétiques : **`DOS-0005` — Moussa Coulibaly** (crédit salarié). Vérifier sa présence dans la session de démonstration : le contrôle API du 23 septembre 2026 retourne zéro dossier visible pour `agent.credit` dans le snapshot central.

1. Se connecter en tant qu'agent de crédit.
2. Ouvrir le dossier et montrer les pièces, la visite et la garantie.
3. Montrer la capacité de remboursement et la simulation d'échéancier.
4. Montrer INCLUSCORE et la confiance des données, deux notions distinctes.
5. Ouvrir l'assistant 💬 : « Explique-moi ce dossier », « Pourquoi ce score ? ».
6. Montrer la grille institutionnelle /100 sur un dossier PME.
7. Présenter la décision humaine : Caisse de crédit jusqu’à 5 000 000 FCFA inclus, Direction générale au-delà. Le test du circuit Agent → Analyste → Comité échoue actuellement ; voir le bilan de vérification ci-dessous.

Déroulé détaillé : [docs/DEMO_JURY_7M30.md](docs/DEMO_JURY_7M30.md) et [docs/MVP_FREEZE.md](docs/MVP_FREEZE.md).

## Architecture

```text
Terminaux (PWA, hors ligne)  →  IndexedDB
            ↓↑  synchronisation versionnée
Serveur API  →  Node.js (scripts/serve.mjs)
            ↓↑
Base centrale  →  PostgreSQL
```

| Dossier | Contenu |
|---|---|
| `index.html`, `src/az-app.js` | Interface de l'application |
| `src/modules/` | Registre de crédit, droits d'accès (RBAC), hors ligne, OCR, assistant IA |
| `src/engines/` | Moteurs d'analyse : flux de trésorerie, qualité des données, endettement, INCLUSCORE… |
| `src/config/` | Politiques institutionnelles versionnées |
| `scripts/` | Serveur, initialisation PostgreSQL, comptes de démonstration |
| `db/` | Schéma SQL et données de démonstration |
| `windows/` | Scripts Windows de préparation et de lancement (`.bat`, `.ps1`) |
| `tests/` | Tests automatisés |
| `docs/` | Documentation, audits de release, résultats de tests |

## Scoring

Deux évaluations sont présentes :

- **INCLUSCORE /1000**, accompagné d’une confiance des données /100 distincte. Sur les données synthétiques actuelles, `DOS-0005` obtient 922/1000 et une confiance de 80/100.
- **Grille institutionnelle /100** : entreprise 45 points, emprunteur 12, marché 8, historique 20, garanties et caution 15. Une grille complète atteint le seuil à 70/100 ; les contrôles à 69 et 70 passent. Son module est `src/modules/institutionalScorecardR20.js`.

Le moteur SFD détaillé reste dans `src/engines/sfdCreditScoreEngine.js`, avec ses politiques dans `src/config/sfdScorePolicies.js`. Son intégration au dossier n’est pas certifiée dans cette version : `tests/sfd-score-tests.mjs` échoue sur la bande attendue de `DOS-0005` (`incluscoreDetail.band` absent). Ne pas présenter l’ensemble des tests de scoring comme validé.

La délégation est définie dans `src/config/creditGovernancePolicies.js`. Les frontières 5 000 000 et 5 000 001 FCFA et les permissions Caisse/Direction ont été contrôlées. La décision reste humaine.

## Assistant IA

Sans fournisseur configuré, un assistant local fonctionne hors ligne. Pour brancher un fournisseur compatible OpenAI, voir [docs/CONFIGURATION_IA.md](docs/CONFIGURATION_IA.md). Le serveur vérifie les droits de l'utilisateur avant tout appel.

## Tests

```bash
npm test               # moteurs d'analyse
npm run test:active    # suite active ; échecs connus décrits ci-dessous
npm run test:mvp-clean # parcours de démonstration
```

## Vérification du 23 septembre 2026

Contrôles réalisés sur le dépôt et le serveur local ; les certifications du ZIP externe ne sont pas reprises comme preuves pour cette version.

| Contrôle | Résultat constaté |
|---|---|
| PostgreSQL réel | Connexion à la base `credipass` réussie |
| `/api/health` | `ok: true`, PostgreSQL connecté, IndexedDB déclaré côté terminaux |
| Comptes réels | 10/10 connexions réussies avec `scripts/verify-live-demo-accounts.mjs` |
| Session agent | `/api/auth/me` répond correctement |
| Snapshot central agent | Lecture réussie, **0 dossier visible** ; présence du dossier de démonstration à vérifier |
| Changement de mot de passe | Ancien mot de passe incorrect rejeté ; changement réussi et ré-enrôlement offline non testés |
| Moteurs essentiels | 51/51 passent |
| Copilot local | Test SFD/IA réussi ; cinq questions exécutées sur `DOS-0005` synthétique : accueil, résumé, autorité, score, amortissement |
| IA générative | Non configurée selon `/api/health` |
| Grille institutionnelle | Grille complète : 69 non éligible, 70 éligible |
| Délégation | Frontières 5 M / 5 M + 1 et permissions Caisse/Direction validées |
| Passeports | Génération et nombre de dossiers vérifiés pour 25/25 membres synthétiques |
| Amortissement | Tests des trois méthodes et ratios réussis |
| Authentification offline et synchronisation | Tests automatisés réussis ; parcours navigateur hors connexion non testé |
| Chargement des modules | Boot gate réussi, 92 modules |
| Test MVP urgent | Réussi ; ce test confirme encore la remise à zéro des comptes |
| Test scoring SFD | **Échec** : bande de risque absente dans le détail du dossier |
| Test workflow | **Échec** : étape `SUPERVISEUR` retournée au lieu de `ANALYSTE_RESPONSABLE_CREDIT` |
| Test MVP clean | **Échec** : expression régulière d’import trop stricte ; `apiMe` est pourtant importé avec d’autres fonctions |
| Docker et OCR natif | Docker non trouvé lors du contrôle précédent ; `tesseract` et `pdftoppm` non trouvés dans le PATH lors de cette vérification |
| Parcours visuel | Non vérifié : l’outil de navigateur n’a pas pu démarrer |

La suite complète n’est donc **pas certifiée PASS**. Avant le jury : réconcilier les écarts scoring/workflow, vérifier les dossiers réellement visibles, puis répéter Agent → Analyste → Caisse/Direction, Copilot, changement de mot de passe et reconnexion/synchronisation dans le navigateur. Les tests sur données synthétiques ne prouvent pas à eux seuls ce parcours sur PostgreSQL.

## Documentation

| Document | Sujet |
|---|---|
| [docs/README_HISTORIQUE.md](docs/README_HISTORIQUE.md) | Ancien README : notes de release R19.3.2 |
| [docs/INSTALLATION_POSTGRESQL.md](docs/INSTALLATION_POSTGRESQL.md) | Installation PostgreSQL native |
| [docs/ARCHITECTURE_POSTGRESQL.md](docs/ARCHITECTURE_POSTGRESQL.md) | Choix d'architecture |
| [docs/DIAGNOSTIC_DEMARRAGE.md](docs/DIAGNOSTIC_DEMARRAGE.md) | Problèmes de démarrage |
| [docs/QUESTIONS_JURY_MVP.md](docs/QUESTIONS_JURY_MVP.md) | Questions attendues du jury |
| `docs/archives/` | Historique des audits, certifications et résultats de tests par release |

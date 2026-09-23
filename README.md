# CREDIPASS by KABU PRO

**Le passeport de confiance financière pour un microcrédit responsable.**

CREDIPASS est une application web installable (PWA) qui aide une institution de microfinance à instruire un dossier de crédit : collecte des pièces, visite terrain, analyse de capacité, score INCLUSCORE expliqué, contrôles de politique et circuit de validation Agent → Analyste → Comité.

> **Principe non négociable :** ni le score ni l'assistant IA n'accordent ou ne refusent un crédit. La décision finale reste humaine.

Projet présenté au **Hackathon National d'Innovation CIF — édition Mali (Track B)**. Toutes les données de démonstration sont **synthétiques** : aucune donnée personnelle réelle n'est utilisée.

## Démarrage rapide avec Docker (recommandé)

Prérequis : **Docker** (Docker Desktop, ou Podman avec `docker compose`). Rien d'autre à installer : l'image contient Node.js, l'OCR (Tesseract français/anglais, Poppler) et le projet ; PostgreSQL tourne dans un second conteneur.

```bash
cp .env.docker.example .env
# Renseigner POSTGRES_PASSWORD dans .env (par exemple : openssl rand -hex 24)
docker compose up -d --build
```

Ouvrir **http://127.0.0.1:8092** et se connecter, par exemple avec `agent.credit` / `Agent@2026`.

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

Sous Windows :

```text
1. Copier .env.example vers .env.local et renseigner CREDIPASS_DATABASE_URL
2. npm ci --omit=dev
3. windows\PREPARER_POSTGRESQL_DOCKER.bat   (ou windows\PREPARER_POSTGRESQL_NATIF_V2.bat)
4. windows\PREPARER_COMPTES_DEMO.bat
5. windows\LANCER_CREDIPASS.bat             → http://127.0.0.1:8092
```

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

Dossier préchargé : **`DOS-0005` — Moussa Coulibaly** (crédit salarié, dossier complet).

1. Se connecter en tant qu'agent de crédit.
2. Ouvrir le dossier et montrer les pièces, la visite et la garantie.
3. Montrer la capacité de remboursement et la simulation d'échéancier.
4. Montrer INCLUSCORE et la confiance des données, deux notions distinctes.
5. Ouvrir l'assistant 💬 : « Explique-moi ce dossier », « Pourquoi ce score ? ».
6. Suivre le circuit Agent → Analyste → Comité.

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

Le score reprend les critères des documents de l'institution : fiche « Analyse de demande de prêt », formulaire « Demande de crédit aux salariés » et formulaire « Demande de crédit PME ».

- **INCLUSCORE** (sur 1000) : 8 axes pondérés selon le produit. Ce n'est pas une probabilité de défaut.
  - capacité de remboursement (montant disponible / échéance, ou quotité cessible / remboursement) ;
  - endettement et budget personnel ;
  - antécédents de crédit (prêts précédents, engagements, BIC) ;
  - épargne et relation avec la caisse (ancienneté, DGA, solde, dépôts DAV) ;
  - stabilité du revenu et de l'adresse ;
  - garanties ;
  - solvabilité et apport personnel ;
  - appréciation terrain (grille de risque à 9 dimensions).
- **Normes de l'institution**, contrôlées à part et jamais compensées par un bon axe : couverture de la dette ≥ 200 %, crédit / fonds propres ≤ 50 %, DGA ≥ 10 %, garanties ≥ montant, quotité > remboursement, durée selon domiciliation, BIC sans incident.
- **Bande publiée** : « Risque acceptable », « À surveiller », « Risque élevé » (dès qu'une norme n'est pas respectée) ou « À compléter » (capacité non calculable, critères trop peu renseignés ou confiance des données trop faible).
- **Confiance des données** (sur 100) : indicateur séparé, qui n'entre pas dans le score.
- **Décision du comité** : le score, sa bande et sa version sont figés dans la décision.

Un critère non renseigné n'est jamais compté comme 0 : il est listé comme « non renseigné » et fait baisser la part renseignée du score.

| Fichier | Rôle |
|---|---|
| `src/config/sfdScorePolicies.js` | Poids, courbes, normes et seuils, modifiables par l'institution |
| `src/engines/sfdCreditScoreEngine.js` | Calcul du score, des normes et des explications |
| `src/modules/sfdScoreInput.js` | Assemble les données du dossier pour le calcul |
| `tests/sfd-score-tests.mjs` | Tests du score (`npm run test:score`) |

## Assistant IA

Sans fournisseur configuré, un assistant local fonctionne hors ligne. Pour brancher un fournisseur compatible OpenAI, voir [docs/CONFIGURATION_IA.md](docs/CONFIGURATION_IA.md). Le serveur vérifie les droits de l'utilisateur avant tout appel.

## Tests

```bash
npm test               # moteurs d'analyse
npm run test:active    # suite complète (l'OCR demande tesseract installé)
npm run test:mvp-clean # parcours de démonstration
```

## Documentation

| Document | Sujet |
|---|---|
| [docs/README_HISTORIQUE.md](docs/README_HISTORIQUE.md) | Ancien README : notes de release R19.3.2 |
| [docs/INSTALLATION_POSTGRESQL.md](docs/INSTALLATION_POSTGRESQL.md) | Installation PostgreSQL native |
| [docs/ARCHITECTURE_POSTGRESQL.md](docs/ARCHITECTURE_POSTGRESQL.md) | Choix d'architecture |
| [docs/DIAGNOSTIC_DEMARRAGE.md](docs/DIAGNOSTIC_DEMARRAGE.md) | Problèmes de démarrage |
| [docs/QUESTIONS_JURY_MVP.md](docs/QUESTIONS_JURY_MVP.md) | Questions attendues du jury |
| `docs/AUDIT_*.md`, `docs/TEST_RESULTS_*.txt` | Historique des audits et résultats de tests par release |

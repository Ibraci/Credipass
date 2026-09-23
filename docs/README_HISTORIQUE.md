# CREDIPASS — MVP FINAL CLEAN

Cette passe stabilise le MVP sans ajouter de nouveau module. Elle corrige les erreurs bloquantes du dossier, rend la bulle Copilot fonctionnelle sur tous les écrans, nettoie les libellés techniques visibles et fiabilise le dossier de démonstration `DOS-0005`.

## Correctifs MVP CLEAN
- Correctif `Cannot access d before initialization` sur les formulaires Salarié/PME.
- Import `apiMe` restauré pour la revalidation de session.
- Bulle 💬 reliée directement au panneau Copilot, avec `aria-expanded`, focus automatique et fermeture par `Échap`.
- Nouveau cache Service Worker pour éviter le chargement d'un ancien JavaScript.
- Libellés `R17`, `SFD FIELD` et codes de workflow remplacés par des libellés métier.
- `DOS-0005 — Moussa Coulibaly` réellement complété : pièces principales, visite, garantie, politique 3/3, étape Agent validée.
- PostgreSQL natif Windows V2 inclus.

# CREDIPASS by KABU PRO — R19.3.2 POSTGRESQL CENTRAL

**Le passeport de confiance financière pour un microcrédit responsable.**

CREDIPASS est une PWA d'instruction de microcrédit explicable, offline-first et décentralisée. Elle structure les preuves, reconstruit les flux économiques, distingue la confiance des données du risque de crédit, calcule INCLUSCORE, teste la soutenabilité, applique des politiques institutionnelles versionnées et prépare le dossier pour une décision humaine.

**Principe non négociable : le score et le copilote n'accordent ni ne refusent un crédit. La décision finale reste humaine.**

## Architecture R19.3.2

Décision définitive :

```text
Terminaux / PWA : IndexedDB
           ↓↑ synchronisation versionnée
Serveur API CREDIPASS : Node.js
           ↓↑
Base centrale : PostgreSQL
```

- **IndexedDB** reste la base locale de chaque terminal pour le travail hors ligne.
- **PostgreSQL** est désormais l'unique base centrale de production.
- **SQLite a été retiré du backend de production**.
- Aucun fallback SQLite ou mémoire n'est utilisé en production.
- Le stockage mémoire existe uniquement sous `CREDIPASS_TEST_MODE=1` pour les tests automatisés isolés.

Voir `ARCHITECTURE_POSTGRESQL.md`.

## PostgreSQL central

Le serveur central utilise PostgreSQL avec un schéma dédié :

- utilisateurs et sessions ;
- état institutionnel JSONB versionné ;
- événements de synchronisation ;
- versions des agrégats ;
- conflits ;
- registre des nœuds ;
- audit OCR ;
- audit IA.

Le moteur métier reste compatible avec le protocole offline existant. Les opérations de synchronisation sont exécutées dans une transaction PostgreSQL avec contrôle de version optimiste.

## SFD FIELD

### Crédit salarié

Compte membre, employeur, date d'embauche, durée du contrat, domiciliation du salaire, salaire net, quotité cessible, DGA, remboursement mensuel, objet et antécédents.

### Crédit PME

Activité et marché, ventes/achats/charges, budget personnel, bilan personnel, garanties, contrôles de politique et grille institutionnelle de risque.

Les règles sont configurables par institution et versionnées.

## CREDIPASS AI COPILOT 💬

Une bulle de discussion reste disponible en bas à droite. Selon les droits de l'utilisateur, le copilote peut expliquer le dossier ouvert, INCLUSCORE, confiance des données, capacité, garanties, politiques, pièces manquantes et incohérences.

Le serveur vérifie le périmètre RBAC avant tout appel à un fournisseur IA. Le copilote ne dispose d'aucun pouvoir de décision de crédit.

Sans fournisseur IA configuré, CREDIPASS bascule sur l'assistant local offline.

## Préparation rapide avec Docker

Prérequis : **Node.js 20+** et **Docker Desktop**.

Sous Windows :

```text
PREPARER_POSTGRESQL_DOCKER.bat
```

Le script :

1. crée une configuration PostgreSQL locale ;
2. installe le pilote Node.js `postgres` de façon reproductible via `npm ci` ;
3. démarre PostgreSQL ;
4. vérifie la connexion.

Ensuite :

```text
LANCER_CREDIPASS.bat
```

Voir `INSTALLATION_POSTGRESQL.md` pour une installation PostgreSQL native.

## Démarrage local

Le lanceur refuse de démarrer si PostgreSQL n'est pas joignable.

Configuration principale dans `.env.local` :

```text
CREDIPASS_DATABASE_URL=postgresql://credipass:...@127.0.0.1:5432/credipass
CREDIPASS_PG_SSL=disable
```

Vérification manuelle :

```powershell
npm run db:check
```

Puis :

```powershell
node scripts/boot.mjs 8092
```

## Mode LAN

`LANCER_CREDIPASS_LAN.bat` expose uniquement l'API CREDIPASS sur le LAN. PostgreSQL doit rester privé sur le serveur central.

Les terminaux Android/PC accèdent donc à :

```text
http://IP_DU_SERVEUR:8092
```

et **jamais directement au port PostgreSQL 5432**.

## Comptes de démonstration

10 comptes sont créés pour couvrir les 10 rôles consolidés de CREDIPASS :

`gerant` · `agent.credit` · `analyste.credit` · `conformite` · `comite.credit` · `direction` · `auditeur` · `admin.systeme` · `caisse` · `suivi.credit`

Chaque rôle possède un mot de passe simple et distinct (ex. `Agent@2026`, `Admin@2026`). Voir `COMPTES_DEMONSTRATION.md`.

Après préparation de PostgreSQL, `PREPARER_COMPTES_DEMO.bat` permet de créer ou réinitialiser les 10 comptes. Les mots de passe de démonstration doivent être remplacés avant tout déploiement réel.

## IA connectée

Variables serveur :

```text
CREDIPASS_AI_BASE_URL=<URL compatible /v1>
CREDIPASS_AI_MODEL=<modèle>
CREDIPASS_AI_PROVIDER=<nom>
CREDIPASS_AI_API_KEY=<secret éventuel>
```

Voir `CONFIGURATION_IA.md`.

## Tests

Campagne complète :

```powershell
npm run test:all
```

Migration PostgreSQL :

```powershell
npm run test:r19.3.2
```

Le test R19.3.2 vérifie notamment :

- IndexedDB présent côté terminal ;
- PostgreSQL obligatoire côté serveur de production ;
- absence de `node:sqlite` et de base SQLite centrale ;
- schéma PostgreSQL JSONB/TIMESTAMPTZ ;
- absence de fallback silencieux quand `CREDIPASS_DATABASE_URL` manque ;
- compatibilité du serveur et du protocole de synchronisation en environnement de test.

Test sur une vraie base PostgreSQL dédiée :

```powershell
$env:CREDIPASS_TEST_POSTGRES_URL='postgresql://.../credipass_test'
npm run test:postgres:real
```

Sans base PostgreSQL réelle configurée, ce test affiche `SKIP` et aucun PASS réel n'est revendiqué.

## Données et sécurité

- `.env.local` et `.env.postgres.local` sont ignorés par Git ;
- aucun mot de passe PostgreSQL ne doit être versionné ;
- la chaîne de connexion PostgreSQL reste côté serveur ;
- les sessions utilisent un cookie HttpOnly ;
- les mots de passe applicatifs sont dérivés avec PBKDF2-SHA-256 ;
- les scénarios hackathon restent synthétiques.

Pour un déploiement institutionnel : TLS, rotation des secrets, sauvegardes PostgreSQL, chiffrement au repos, supervision et tests de restauration restent nécessaires.

## Track B

La lignée R19.1 → R19.3.2 couvre la contextualisation SFD, le fonctionnement offline, la décentralisation, les formulaires Salarié/PME, la gestion de conflits, le copilote et désormais **PostgreSQL comme base centrale institutionnelle**.

## Composants tiers à déclarer

Node.js/API Web, **PostgreSQL**, pilote `postgres` (Postgres.js), IndexedDB, Tesseract OCR, `pdftoppm` et, s'il est configuré, le fournisseur IA compatible `chat/completions`.


## MVP URGENT FIX — comptes + Copilot

- Le lanceur `LANCER_MVP_DEMO_CORRIGE.bat` réinitialise les 10 comptes de démonstration dans PostgreSQL avant chaque démo.
- `VERIFIER_COMPTES_MVP.bat` teste les 10 identifiants contre le serveur réel.
- La bulle 💬 utilise un seul gestionnaire de clic et ouvre le panneau Copilot sans double routage.
- Le cache PWA a été rebusté (`credipass-mvp-urgent-1`).
- Si Poppler/pdftoppm manque, l’OCR PDF affiche maintenant un message clair; JPG/PNG reste la voie de secours pour la démo.

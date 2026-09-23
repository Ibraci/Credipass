# Installation PostgreSQL — CREDIPASS R19.3.2

## Méthode A — Docker Desktop

1. Installer Docker Desktop et Node.js 20+.
2. Double-cliquer sur `windows\PREPARER_POSTGRESQL_DOCKER.bat`.
3. Le script crée des identifiants PostgreSQL locaux, installe le pilote Node.js `postgres`, démarre PostgreSQL et vérifie la connexion.
4. Lancer ensuite `windows\LANCER_CREDIPASS.bat`.

PostgreSQL n'est exposé que sur `127.0.0.1:5432` dans le fichier Docker Compose. Les autres terminaux du LAN parlent à l'API CREDIPASS sur le port 8092, **pas directement à PostgreSQL**.

## Méthode B — PostgreSQL déjà installé

Installer PostgreSQL puis créer une base et un utilisateur dédiés, par exemple :

```sql
CREATE ROLE credipass LOGIN PASSWORD 'mot-de-passe-fort';
CREATE DATABASE credipass OWNER credipass;
```

Copier `.env.example` vers `.env.local` puis renseigner :

```text
CREDIPASS_DATABASE_URL=postgresql://credipass:mot-de-passe@127.0.0.1:5432/credipass
CREDIPASS_PG_SSL=disable
```

Puis :

```powershell
npm ci --omit=dev
npm run db:check
windows\LANCER_CREDIPASS.bat
```

Le schéma `db/postgresql/001_init.sql` est créé automatiquement au premier démarrage.

## Vérification

`GET http://localhost:8092/api/health` doit notamment indiquer :

```json
{
  "ok": true,
  "service": "CREDIPASS Central R19.3.2",
  "database": { "engine": "POSTGRESQL", "connected": true },
  "terminalStorage": "IndexedDB"
}
```

## Tests

La suite automatisée normale utilise un stockage mémoire uniquement pour isoler les tests. Il n'existe pas de fallback mémoire/SQLite en production.

Pour certifier une vraie instance PostgreSQL de test :

```powershell
$env:CREDIPASS_TEST_POSTGRES_URL='postgresql://.../credipass_test'
npm run test:postgres:real
```

Sans cette variable, le test affiche `SKIP` et aucun PASS PostgreSQL réel n'est revendiqué.

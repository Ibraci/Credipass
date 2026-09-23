# Diagnostic démarrage — CREDIPASS R19.3.2

## Architecture attendue

- terminal : IndexedDB ;
- serveur central : PostgreSQL ;
- API CREDIPASS : port 8092.

## 1. Vérifier Node.js

```powershell
node -v
```

Node.js 20+ est requis.

## 2. Vérifier la configuration

Le fichier `.env.local` doit contenir `CREDIPASS_DATABASE_URL`.

## 3. Vérifier le pilote PostgreSQL

```powershell
npm install
```

Puis :

```powershell
npm run db:check
```

Le résultat attendu est :

```text
POSTGRESQL CENTRAL: PASS
```

## 4. Vérifier l'API

Lancer `windows\LANCER_CREDIPASS.bat`, puis ouvrir :

```text
http://localhost:8092/api/health
```

Le JSON doit indiquer `database.engine = POSTGRESQL` et `terminalStorage = IndexedDB`.

## 5. Si « Failed to fetch » réapparaît

Cela signifie que le navigateur ne joint pas l'API CREDIPASS. Vérifier dans cet ordre :

1. fenêtre serveur CREDIPASS ;
2. `npm run db:check` ;
3. service/conteneur PostgreSQL ;
4. port 8092 ;
5. pare-feu Windows si accès LAN.

Le navigateur ne se connecte jamais directement à PostgreSQL.

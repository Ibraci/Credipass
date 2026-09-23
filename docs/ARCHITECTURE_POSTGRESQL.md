# Architecture CREDIPASS R19.3.2 — IndexedDB terminaux + PostgreSQL central

## Décision verrouillée

CREDIPASS utilise désormais deux niveaux de données :

```text
TERMINAL / PWA
IndexedDB
  │
  │ opérations versionnées / sync bidirectionnelle
  ▼
API CREDIPASS Node.js
  │
  ▼
POSTGRESQL CENTRAL
```

- **IndexedDB** reste la base locale de chaque terminal pour le mode offline, la file de synchronisation et les documents locaux.
- **PostgreSQL** est l'unique base centrale de production.
- **SQLite n'est plus utilisé par le serveur de production** et aucun fallback SQLite silencieux n'existe.

## Modèle central PostgreSQL

Pour minimiser le risque de régression avant le hackathon, la migration conserve l'agrégat métier CREDIPASS dans `institution_state.state_json` au format **JSONB versionné**, tandis que les fonctions transversales sont relationnelles :

- `users`
- `sessions`
- `sync_events`
- `sync_entity_versions`
- `sync_conflicts`
- `node_registry`
- `ocr_audit`
- `ai_audit`
- `institution_state` (`JSONB`)

Cette structure permet de passer immédiatement à PostgreSQL sans réécrire le moteur métier ni le protocole offline. Une normalisation plus fine des collections métier pourra être faite après la V1 sans changer l'API des terminaux.

## Concurrence

La synchronisation centrale s'exécute dans une transaction PostgreSQL. L'état central est lu avec verrouillage transactionnel et les versions d'entités sont contrôlées avant fusion. Une divergence de `baseVersion` produit un `VERSION_CONFLICT` qui reste soumis à résolution humaine.

## Sécurité

La chaîne de connexion PostgreSQL est exclusivement serveur via `CREDIPASS_DATABASE_URL`. Elle n'est jamais envoyée au navigateur. Les fichiers `.env.local` sont ignorés par Git.

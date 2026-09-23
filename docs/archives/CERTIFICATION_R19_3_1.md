# CERTIFICATION R19.3.1 — SYNC / OFFLINE / LAN / IA / MÉTIER

Date : 2026-09-22

## Campagnes exécutées

### `npm run test:r19.3.1 --silent`

**PASS** — mutations versionnées, données SFD complètes, snapshots sans opération protégés, rejeu idempotent, conflit humain, LAN et configuration descendante.

### `npm run test:active --silent`

**PASS** — inclut notamment :

- 51/51 moteurs/scénarios essentiels ;
- 10 rôles / comptes et périmètres ;
- 25 membres / 25 dossiers ;
- authentification offline PBKDF2 ;
- sync centrale versionnée ;
- OCR Tesseract réel ;
- produits & politiques ;
- passeport / audit ;
- R19 GOLD ;
- R19.1 ;
- R19.2 ;
- R19.3 SFD FIELD + AI COPILOT ;
- fournisseur IA compatible simulé ;
- certification deux nœuds / offline / conflit ;
- R19.3.1 BLOCKER HARDENING.

### `npm run test:all --silent`

**PASS** — campagne active + compatibilité R16, R18.2 et R18.3.

### Syntaxe

**PASS — 153 fichiers JavaScript/MJS vérifiés avec `node --check`.**

### `npm run test:ai:real --silent`

**SKIP** dans l'environnement courant : aucun `CREDIPASS_AI_BASE_URL` / `CREDIPASS_AI_MODEL` réel n'était configuré. Aucun PASS de modèle réel n'est revendiqué.

## Scénarios R19.3.1 spécifiques certifiés automatiquement

- création membre versionnée ;
- création dossier versionnée ;
- mutation du même dossier sur deux nœuds ;
- consolidation des nouvelles données SFD ;
- refus d'un snapshot sans opération ;
- détection d'une base de version périmée ;
- préservation de l'état central tant que le conflit n'est pas résolu ;
- résolution humaine avec rebase local ;
- nouvelle synchronisation après rebase ;
- rejeu du même événement sans réapplication ;
- synchronisation descendante de configuration institutionnelle ;
- propagation territoriale aux sous-données du dossier ;
- écoute réseau `0.0.0.0` et accès par interface non-loopback lorsque disponible.

## Non certifié physiquement

Le test matériel réel reste à exécuter : **Android/PC terrain → coupure réseau → fermeture/réouverture → agence → central → connexion d'un autre rôle → contrôle audit**.

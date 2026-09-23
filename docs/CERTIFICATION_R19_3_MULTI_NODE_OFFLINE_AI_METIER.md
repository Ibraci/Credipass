# CERTIFICATION R19.3 — MULTI-NŒUDS / OFFLINE / IA / MÉTIER

Date : 2026-09-22

## Résultats automatisés

- `npm run test:active` : PASS.
- 51/51 moteurs/scénarios essentiels : PASS.
- 10 rôles / périmètres : PASS.
- Authentification offline : PASS.
- OCR réel Tesseract : PASS.
- Synchronisation centrale : PASS.
- Décentralisation R19.2 : PASS.
- R19.3 SFD FIELD : PASS.
- Copilote sur 25 dossiers : PASS.
- Fournisseur IA compatible simulé côté serveur : PASS.
- Refus d'un contexte IA hors périmètre : PASS.
- File offline conservée : PASS.
- Deux identités de nœud distinctes : PASS.
- Modification concurrente : `VERSION_CONFLICT` : PASS.
- Non-écrasement silencieux de la version centrale : PASS.
- Contrôle métier bloquant sans création automatique de décision : PASS.

## Validation non simulable dans le conteneur

À exécuter sur le matériel réel : Android/PC terrain → coupure → fermeture/réouverture → agence → central → autre rôle → audit, ainsi que le rendu sur écran de projection.

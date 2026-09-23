# CREDIPASS R19.1 — Décentralisation + Assistant explicatif

## Portée
- Modèle Institution → Structure → Zone → Agence/nœud → Utilisateur.
- Rattachement territorial des membres, dossiers et événements métier.
- Contrôle d’accès compatible avec les périmètres existants.
- Enveloppe de synchronisation versionnée et détection de conflit concurrent nécessitant résolution humaine.
- Santé des nœuds.
- Assistant conversationnel CREDIPASS local/offline avec glossaire métier et explication contextualisée INCLUSCORE / confiance.
- L’assistant n’accorde/refuse jamais un crédit et n’invente pas une règle institutionnelle absente.

## Tests exécutés
- `npm run test:r19.1`: PASS.
- `npm run test:r19`: PASS.
- `npm run test:active`: PASS, y compris 51/51 moteurs, RBAC, offline auth, sync centrale, OCR réel, 10 rôles, produits/politiques, data/passeport/audit et R19.

## Limite de certification
Le test physique multi-machines Terminal ↔ Agence ↔ Central reste à exécuter sur l’infrastructure réelle avant de déclarer cette topologie déployée en production. Le module R19.1 fournit le modèle et les garde-fous applicatifs; il ne transforme pas à lui seul une machine unique en infrastructure multi-nœuds.

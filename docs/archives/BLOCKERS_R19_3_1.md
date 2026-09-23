# R19.3.1 — ÉTAT DES BLOQUEURS

Date : 2026-09-22

## Bloqueurs R19.3 traités

1. **Écrasement silencieux possible par snapshot non versionné** → corrigé : le serveur ne merge que les entités/agrégats associés à des opérations acceptées.
2. **Mutations dossier non toutes versionnées** → corrigé : formulaires, analyses, budget/bilan, risque, BIC, garanties, décision, paiements, suivi, restructuration, etc. passent par l'agrégat dossier.
3. **Données Salarié/PME non toutes consolidées** → corrigé : collections SFD ajoutées au merge/pull central.
4. **Conflit local renvoyé automatiquement** → corrigé : statut `CONFLIT` isolé jusqu'à résolution humaine.
5. **Rattachement territorial incomplet des sous-données** → corrigé : propagation aux collections dossier actuelles.
6. **Serveur limité à 127.0.0.1** → corrigé : mode LAN explicite `CREDIPASS_HOST=0.0.0.0` + lanceur dédié.
7. **Session restaurée depuis le navigateur sans revalidation serveur en ligne** → corrigé : `/api/auth/me` obligatoire en ligne.
8. **Scripts R16/R18.2/R18.3 obsolètes** → corrigé : `npm run test:all` vert.
9. **Confusion entre adaptateur IA et modèle réellement branché** → corrigé dans la certification/documentation : test réel séparé et `SKIP` honnête si aucun fournisseur n'est configuré.

## Bloqueurs logiciels automatisés restants

**Aucun bloqueur détecté par les campagnes actuelles.**

## Validations externes restantes

- essai physique Android/PC sur le réseau réel de l'événement ;
- coupure réelle, fermeture/réouverture, reprise et sync ;
- test sur écran de projection ;
- test `npm run test:ai:real` avec un endpoint et un modèle réels configurés.

Ces éléments sont des validations environnementales et ne sont pas marqués PASS dans le lot.

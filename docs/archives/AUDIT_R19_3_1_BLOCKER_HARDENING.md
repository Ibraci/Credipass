# AUDIT R19.3.1 — BLOCKER HARDENING

Date : 2026-09-22

## Objet

Cette passe part de R19.3 et corrige uniquement les bloqueurs identifiés lors de la vérification à froid. Aucun nouveau grand module métier n'est ajouté.

## 1. Synchronisation des mutations métier — CORRIGÉ

Toutes les mutations dossier importantes sont désormais accompagnées d'une opération versionnée portant l'identifiant du dossier. Le serveur traite le dossier comme un agrégat et ne fusionne que les agrégats explicitement acceptés.

Collections dossier consolidées : documents, visites, analyses financières, garanties, décisions, décaissements, paiements, restructurations, checklists, revenus, dépenses, dettes, confiance, échéanciers, suivi, alertes, recommandations, formulaires produit, contrôles de politique, grille de risque, analyse activité/marché, budget, bilan, workflow, consentements, BIC, contestations, corrections et audit.

Un snapshot envoyé sans opération acceptée ne modifie plus l'état central.

## 2. Conflits — CORRIGÉ

- version de base explicite obligatoire pour une nouvelle opération de sync ;
- comparaison à la version centrale par entité/agrégat ;
- conflit `VERSION_CONFLICT` en cas de base périmée ;
- version locale conservée pendant le conflit ;
- aucune relance automatique d'une opération marquée `CONFLIT` ;
- résolution humaine : `KEEP_CENTRAL` ou `REBASE_LOCAL` ;
- rejeu d'un événement déjà accepté : idempotent, sans réapplication d'un snapshot falsifié.

## 3. Rattachement territorial — CORRIGÉ

La normalisation territoriale couvre maintenant les sous-données modernes du dossier, dont les données Salarié/PME. Les objets reçoivent, lorsque le dossier parent le permet : `institutionId`, `structureId`, `structureName`, `agencyId`, `zoneId` et `ownerUserId` historique.

## 4. Configuration institutionnelle — CORRIGÉ

L'agrégat `CONFIG-INSTITUTION` synchronise produits, versions de politique, profils SFD terrain et journal d'import. Seul `ADMIN_SYSTEME` peut le pousser côté serveur.

## 5. LAN multi-équipements — CORRIGÉ CÔTÉ LOGICIEL

Le serveur accepte désormais `CREDIPASS_HOST`. Le mode par défaut reste sûr/local (`127.0.0.1`). Le mode LAN doit être demandé explicitement (`0.0.0.0`). `LANCER_CREDIPASS_LAN.bat` est fourni.

Le test R19.3.1 démarre réellement le serveur sur `0.0.0.0` et vérifie l'accès via une interface IPv4 non-loopback lorsqu'elle existe.

## 6. Session — CORRIGÉ

Une session présente dans `sessionStorage` n'est plus considérée suffisante lorsque le réseau est disponible. Le client appelle `/api/auth/me` et n'ouvre l'application que si la session serveur est encore valide. En mode réellement hors connexion, le cache d'authentification offline conserve le comportement prévu.

## 7. Scripts legacy — CORRIGÉ

Les commandes `test:r16`, `test:r18.2` et `test:r18.3` ont été remises en cohérence avec les chemins et invariants actuels. Elles sont exécutées par `npm run test:all`.

## 8. IA — ÉTAT EXACT

- bulle Copilot : présente ;
- contexte dossier complet : présent ;
- garde RBAC serveur : présente ;
- adaptateur `chat/completions` : présent ;
- clé maintenue côté serveur : oui ;
- fournisseur compatible simulé : PASS ;
- vrai fournisseur externe/local : test conditionnel `npm run test:ai:real` ;
- dans l'environnement de certification du 22/09/2026 : **SKIP, aucun endpoint/modèle réel configuré**.

Aucun PASS de modèle réel n'est revendiqué.

## 9. Résultats

- `npm run test:r19.3.1 --silent` : PASS.
- `npm run test:active --silent` : PASS.
- `npm run test:all --silent` : PASS.
- syntaxe JavaScript : PASS sur 153 fichiers JS/MJS.
- test IA réel : SKIP faute de fournisseur configuré.
- recherche de fichiers `.env`, clés privées et bases SQLite/DB dans le lot : aucun fichier trouvé.

## Verdict logiciel

Les bloqueurs logiciels identifiés lors de l'audit R19.3 sont corrigés dans R19.3.1. Restent hors du périmètre d'exécution du conteneur : le parcours physique multi-équipements du jour J et l'appel à un véritable modèle IA tant qu'un fournisseur n'est pas configuré.

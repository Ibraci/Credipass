# CREDIPASS R11 — Registre transactionnel crédit A→Z

## Objectif
Transformer la façade R10 en application où les indicateurs proviennent d'opérations réellement enregistrées.

## Implémenté
- Terminologie visible : Membre.
- Navigation : Accueil, Membres, Crédits, Tâches, Portefeuille, Rapports, Plus.
- Registre local transactionnel versionné.
- 4 cas pratiques : personne physique, entrepreneur individuel, personne morale, groupe/cooperative.
- Création réelle d'un membre.
- Création réelle d'une demande de crédit.
- Saisie économique réelle et capacité recalculée depuis les données sources.
- Décision humaine enregistrée et auditée.
- Décaissement distinct de la décision.
- Remboursement enregistré avec séparation principal/intérêt.
- Encours calculé : décaissements moins principal remboursé.
- Dashboard alimenté par le registre, pas par des KPI décoratifs.
- File Tâches dérivée du statut des dossiers.

## Contrôles
- node --check app.js : PASS
- node --check creditLedger.js : PASS
- BOOT GATE : PASS, 92 modules
- Moteurs historiques : PASS 51/51
- UI historique : PASS 9/9
- Tests transactionnels R11 : PASS 8/8

## Limite volontaire
R11 pose le socle transactionnel. Les écrans détaillés Terrain, Documents, Garanties, échéancier complet, restructuration et espace membre doivent être branchés au même registre dans les passes suivantes, sans inventer de KPI.

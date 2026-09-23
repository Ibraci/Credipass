# TRACK B — ADAPTATION CREDIPASS AUX SFD

## Avant la contextualisation

CREDIPASS disposait déjà du socle de dossier de crédit, INCLUSCORE, confiance des données, capacité/soutenabilité, garanties, pièces, workflow humain, audit, offline et produits configurables.

## Adaptations intégrées dans la lignée R19.1 → R19.3.2

- rattachement Institution / Structure / Zone / Nœud ;
- rattachement territorial des données dossier, y compris les nouvelles données terrain ;
- synchronisation Terminal / Agence / Central avec agrégats versionnés ;
- détection des conflits et résolution humaine ;
- protection contre snapshots silencieux et rejeux ;
- formulaires terrain Salarié et PME alignés sur les pièces de référence fournies ;
- règles terrain transformées en paramètres institutionnels, pas en règles universelles ;
- contrôles quotité cessible, domiciliation/durée, DGA et couverture garantie ;
- budget et bilan personnel PME ;
- neuf dimensions de risque institutionnel ;
- CREDIPASS AI COPILOT conversationnel avec contexte dossier ;
- garde de périmètre/RBAC appliquée au contexte IA ;
- mode local lorsque le fournisseur IA n'est pas disponible ;
- serveur LAN activable explicitement pour la topologie terrain ;
- certification automatisée multi-nœuds/offline/métier et compatibilité legacy.

## Ce qui doit être montré au jury

Un cas synthétique de bout en bout : dossier ouvert → collecte terrain → contrôle de politique → score/confiance → copilote explique → passage hors connexion → opération en file → retour en ligne → synchronisation → décision humaine.

Pour démontrer une **IA générative réelle**, configurer avant la présentation un endpoint/modèle réel et exécuter `npm run test:ai:real`. Sinon, présenter honnêtement le mode local et l'architecture d'intégration, sans qualifier le mock de modèle réel.

## Ce qui reste environnemental

Le parcours sur plusieurs équipements physiques et le contrôle visuel sur le vidéoprojecteur du jour J.

## R19.3.2 — migration de la base centrale

La base centrale a été migrée de SQLite vers **PostgreSQL**, tout en conservant **IndexedDB sur les terminaux** pour le mode offline. Cette adaptation renforce la capacité de consolidation multi-agences sans modifier le principe de fonctionnement terrain : un terminal continue de travailler localement puis synchronise vers l'API centrale.

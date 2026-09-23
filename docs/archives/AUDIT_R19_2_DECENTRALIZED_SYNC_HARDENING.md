# CREDIPASS R19.2 — Decentralized Sync Hardening

## Correctifs
- Le rattachement territorial n’aplatit plus les agences distinctes sur `Agence principale`.
- La santé des nœuds lit la vraie file hors ligne et compte les opérations par nœud.
- Chaque opération synchronisée transporte institution, structure, zone, nœud, version de base et version cible.
- Le backend enregistre les nœuds vus et protège les opérations versionnées contre l’écrasement concurrent silencieux.
- Une collision de version devient `VERSION_CONFLICT` avec `HUMAINE_REQUISE`; l’entité en conflit n’écrase pas la copie centrale.
- Les réponses d’authentification transportent désormais les métadonnées territoriales nécessaires au client.

## Compatibilité
Les opérations historiques sans métadonnée de version restent acceptées pour ne pas casser les suites R18.x. Les nouvelles opérations R19.2 utilisent le contrôle optimiste de version.

## Limite
La certification multi-machines physique Terminal ↔ Agence ↔ Central reste environnementale. R19.2 durcit le contrat applicatif et le serveur local de référence; il ne remplace pas un test réseau réel sur l’infrastructure de livraison.

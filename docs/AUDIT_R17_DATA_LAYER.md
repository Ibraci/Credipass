# CREDIPASS R17 — DATA LAYER & CAS PRATIQUES

## Périmètre vérifié
- IndexedDB `credipass-r17` avec store `state` et store `documents`.
- Cache localStorage conservé comme mécanisme de démarrage/compatibilité ; IndexedDB est alimenté à chaque sauvegarde et hydraté au démarrage.
- Import PDF scanné : stockage Blob local IndexedDB + métadonnées dans le dossier + empreinte SHA-256 lorsque Web Crypto est disponible.
- Logo CREDIPASS fourni par l'utilisateur intégré comme actif officiel.
- 20 membres fictifs minimum et 20 dossiers minimum.
- Cas pratiques : complet, quotité limite, non domicilié, confiance faible, saisonnier, ajourné pour pièce, PME rentable, garantie forte, dette existante, refus capacité, incident régularisé, nouveau membre, demande excessive, décaissé, retard, restructuré.

## Limites assumées
- Pas de PostgreSQL/API serveur dans R17.
- Les PDF restent locaux au navigateur/appareil dans cette version.
- OCR non déclaré PASS : l'import PDF est réel, l'extraction OCR avancée reste un lot séparé.
- L'authentification de démonstration n'est pas une authentification de production.

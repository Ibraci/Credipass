# CREDIPASS R18.4 — CERTIFICATION HARDENING

Date: 22/09/2026

## Corrections majeures
- Authentification hors ligne : le mot de passe est désormais vérifié localement par PBKDF2-SHA256 (180 000 itérations) après un enrôlement en ligne réussi. Cinq échecs déclenchent un verrouillage local de 5 minutes.
- Authentification serveur : PBKDF2-SHA256, comparaison constante, session HttpOnly/SameSite=Strict, verrouillage temporaire après 5 échecs. Le transport TLS reste une exigence de déploiement production.
- Synchronisation : remplacement des snapshots isolés par login par un état institutionnel central versionné. Le Gérant peut publier les membres de son agence ; l’Agent ne peut pas créer un membre central ; l’Agent publie ses dossiers affectés ; les rôles autorisés récupèrent une vue filtrée par périmètre.
- Synchronisation client : push puis pull central, fusion des entités reçues et conservation de la file locale en cas d’échec.
- OCR : Tesseract 5 TSV ; la confiance affichée est la moyenne réelle des confiances des mots reconnus, et non une estimation basée sur la longueur du texte. Aucune donnée métier n’est validée automatiquement.
- Cache PWA : R18.4 et module d’authentification R18.4 précaché.

## Tests exécutés
- Moteurs essentiels : 51/51 PASS.
- R18 Scoring & Access : PASS — 11 rôles/comptes, 20 membres, 20 dossiers.
- R18.1 Hardening : PASS.
- R17 Data Layer : PASS — 20 membres, 20 dossiers, 16 cas pratiques.
- R15 Institutional : PASS.
- Boot Gate : PASS — 92 modules.
- Closure UI : 9/9 PASS.
- Loan Math : PASS.
- R18.4 Offline Auth : PASS — bon secret accepté, mauvais secret rejeté.
- R18.4 Central Sync : PASS — Gérant → Agent → Responsable et création de membre par Agent rejetée côté serveur.
- R18.4 OCR API : PASS — OCR réel exécuté, texte reconnu, confiance Tesseract réelle mesurée.
- Tous les tests actifs `tests/*.mjs` : 0 échec.
- Syntaxe JavaScript : PASS.

## Limites de certification
Le navigateur Chromium headless de cet environnement n’a pas permis d’exécuter de manière fiable le parcours graphique/PWA complet sur localhost. Le test navigateur physique reste donc à exécuter sur le poste de démonstration : login → mode hors connexion → demande terrain → fermeture/réouverture → récupération → retour en ligne → synchronisation.

La release fournit un backend central SQLite/WAL autonome pour le hackathon. Pour un déploiement institutionnel multi-serveurs, PostgreSQL et TLS/HTTPS restent des exigences d’infrastructure ; ils ne sont pas simulés dans cette release.

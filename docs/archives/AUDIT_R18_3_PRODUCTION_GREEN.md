# CREDIPASS R18.3 — PRODUCTION GREEN

- Gérant seul habilité à créer/modifier les membres dans le flux standard; Agent de crédit consulte les membres affectés et crée/instruit les demandes.
- Mode terrain explicite : bascule « Travailler hors connexion », persistance locale, file de synchronisation et reprise.
- Backend central embarqué : API HTTP + SQLite central (WAL) pour sessions, événements de synchronisation, snapshots et audit OCR.
- Authentification serveur : PBKDF2-SHA256 (210 000 itérations), sels aléatoires, comparaison timing-safe, cookie HttpOnly/SameSite=Strict, session 8 h.
- Synchronisation réelle locale ↔ backend : POST /api/sync, accusé de réception, purge des opérations acquittées, snapshot serveur.
- OCR réel local : Tesseract 5 + pdftoppm pour la première page des PDF; résultat toujours « À VALIDER » et jamais injecté silencieusement dans le dossier.
- UX GOLD renforcée : état offline explicite, actions compactes, hiérarchie dossier/passeport et feedback de synchronisation.
- Limite d'architecture : le backend central de cette release utilise SQLite embarqué pour rester autoportant pendant le hackathon. Un déploiement institutionnel distribué peut remplacer l'adaptateur par PostgreSQL sans modifier le contrat API.

# CREDIPASS — MVP URGENT FIX

Correctifs ciblés avant jury :

- Copilot flottant : un seul chemin de clic, ouverture du panneau, contexte dossier et assistant local de secours.
- Comptes de démonstration : réinitialisation des 10 comptes dans PostgreSQL à chaque lancement MVP.
- Vérification réelle des 10 comptes : `VERIFIER_COMPTES_MVP.bat` appelle `/api/auth/login` sur le serveur actif.
- Démarrage : hôte `127.0.0.1` normalisé.
- OCR PDF : message explicite si Poppler/pdftoppm manque au lieu de `spawnSync ... ENOENT` brut.
- PWA : service worker modifié et lancement avec `?mvp=urgent1` pour forcer une navigation fraîche.

## Campagne

`npm run test:all` : PASS.

Inclut : 51/51 moteurs, rôles, auth offline, sync, OCR, produits/politiques, R19→R19.3.2, comptes de démonstration, MVP CLEAN et MVP URGENT FIX.

## Validation terrain restante

Après lancement sur le PC jury :

1. exécuter `VERIFIER_COMPTES_MVP.bat` et obtenir `COMPTES LIVE: 10/10 PASS` ;
2. ouvrir DOS-0005, cliquer 💬 puis « Explique-moi ce dossier » ;
3. si un ancien écran est encore affiché, faire `Ctrl+F5` une fois.

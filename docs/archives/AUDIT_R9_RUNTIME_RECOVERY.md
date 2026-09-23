# CREDIPASS R9 — Runtime Recovery

- R8 confirmé en échec visuel sur le poste utilisateur : page blanche.
- Inspection interne : le HTML masque l'application et l'écran de connexion par défaut ; toute panne avant `init()` produit donc un écran vide.
- Risque additionnel identifié : un ancien Service Worker peut continuer à servir des modules JavaScript d'une version précédente depuis son cache sur le même origin/port.
- R9 rend l'écran de connexion visible par défaut : une panne de module ne peut plus produire silencieusement une page blanche.
- R9 ajoute un watchdog de démarrage et affiche une erreur de boot au lieu d'un écran vide.
- Service Worker versionné `credipass-r9-runtime`, avec stratégie network-first pour JS/CSS/manifest et suppression des anciens caches à l'activation.
- `LANCER_CREDIPASS.bat` utilise le port 8092 afin d'éviter qu'un ancien Service Worker enregistré sur localhost:8091 ne contrôle le premier chargement.
- BOOT GATE : 91 modules, imports/exports cohérents.
- R9 Runtime Startup Gate : 7/7 PASS.
- Moteurs : 51/51 PASS.
- UI clôture : 9/9 PASS.
- LOT 1→8 : 8/8 PASS.

Limite : la certification finale reste conditionnée au lancement réel de cette archive R9 sur Windows/Chrome.

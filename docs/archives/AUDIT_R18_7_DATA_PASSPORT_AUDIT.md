# CREDIPASS R18.7 — Data / Import / Passeport / Audit final

## Intégré
- 25 membres et 25 dossiers de démonstration, 21 cas pratiques explicitement balisés.
- Import du canevas Excel CREDIPASS (`.xlsx`) hors dépendance externe : lecture locale des feuilles 01_CLIENTS et 02_DOSSIERS, contrôle, anomalies, journal d'import.
- Canevas officiel téléchargeable depuis l'administration.
- BIC / source externe autorisée : date, source, référence, engagements, incidents, observation et preuve.
- Contestation/correction : ancienne valeur, valeur proposée, motif, preuve, décision et trace d'audit.
- Passeport financier et historique de paiement conservés ; synthèse de gouvernance disponible par membre.
- Traçabilité dossier consultable depuis le dossier.

## Règles
- Aucune API BIC n'est revendiquée : la V1 enregistre une consultation/résultat autorisé et sa preuve.
- Une contestation n'écrase pas silencieusement l'historique : la correction est journalisée.
- L'import ne contourne pas les validations produit : les dossiers invalides sont reportés en anomalies.
- Données de démonstration fictives uniquement.

## Tests
- Suite active complète : PASS.
- Parseur XLSX testé sur `templates/CREDIPASS_CANEVAS_IMPORT_COMPLET.xlsx` : 10 feuilles détectées, 01_CLIENTS et 02_DOSSIERS lus.
- R18.7 : PASS — 25 membres, 25 dossiers, 21 cas pratiques.

## Hors certification environnementale
- E2E navigateur/PWA physique.
- Audit visuel écran par écran sur le poste final.

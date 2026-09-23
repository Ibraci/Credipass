# CREDIPASS — Audit maître 8 lots
Date: 21 septembre 2026

## Corrections de durcissement appliquées
- Dashboard portefeuille: suppression des estimations arbitraires 72 % / 8 %. Encours et PAR proviennent désormais des champs dossier `outstanding`, `lateDays` et `arrears` du registre.
- Pilotage agent: agrégation réelle des dossiers du registre par agent (dossiers, validés, ajournés, octroyé, encours, PAR).
- Character & Trust: suppression des hypothèses systématiques `fieldVerified=true`, `referencesVerified=1`, `membershipMonths=36`. L'ancienneté vient de `joinedAt`; la visite terrain et les références viennent des preuves disponibles; l'absence reste à vérifier.
- Character & Trust: normalisation des statuts de preuve français/anglais et minuscules.
- Garanties: distinction explicite entre valeur déclarée, valeur expertisée, décote et valeur retenue. Aucune valeur déclarée n'est automatiquement considérée comme garantie retenue.
- Dossier physique: référence physique et agent affecté intégrés au registre et à la recherche.
- PAR: définition affichée comme paramétrable; le calcul courant utilise l'encours des dossiers avec retard enregistré.

## Tests exécutés
- Moteurs/scénarios essentiels: PASS 51/51
- Loan math: PASS — 3 méthodes + ratios
- Master Refactor: PASS
- Product Registry: PASS
- Closure UI: PASS 9/9
- Master Lots: PASS 8/8

## Limites de certification
Ces PASS certifient les contrôles automatisés disponibles dans le paquet. Ils ne remplacent pas une validation visuelle sur Windows/Chrome, ni une validation réglementaire des définitions PAR, taux, frais, décotes et délégations de décision de l'institution utilisatrice.

# CREDIPASS R18.6 — Produits de crédit & politiques

## Périmètre livré
- Référentiel institutionnel configurable de produits de crédit.
- 9 familles de base : salarié, PME, commerce, agricole/campagne, élevage, équipement, habitat, social/consommation, groupement/coopérative.
- Paramètres par produit : profils éligibles, montants min/max, durées, périodicités, taux/méthode, différé, pièces, garanties, workflow.
- Administration des produits réservée à l'Administrateur Système (`PRODUCT_ADMIN`).
- Cycle de publication et versions de politique.
- Snapshot immuable de la politique produit sur chaque nouvelle demande : une modification ultérieure du produit ne réécrit pas l'historique du dossier.
- Contrôle automatique de l'éligibilité produit lors de la création/modification d'une demande.
- Produits Kafo/Nyesigiso : utilisés comme références terrain pour structurer le moteur ; aucune condition non confirmée n'est codée comme règle officielle de ces institutions.

## Limites volontaires
Les taux, plafonds et conditions du catalogue de base sont des paramètres de démonstration/configuration et non des affirmations sur les conditions actuelles de Kafo Jiginew ou Nyesigiso. Ils doivent être renseignés par l'institution lors du déploiement.

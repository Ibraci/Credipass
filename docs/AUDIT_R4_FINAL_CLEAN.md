# CREDIPASS — Audit R4 FINAL CLEAN — 21 septembre 2026

## Objet
Passe de clôture des LOTS 1 à 8 sans ajout de périmètre métier. Objectifs : hygiène du dépôt, suppression d'identifiants historiques ambigus, renforcement des tests par comportements métier, et préparation du candidat Windows/offline.

## Corrections R4
- Identifiant institutionnel interne `CIF-DEMO-ML` remplacé par `CIF-SYNTH-ML` afin d'indiquer explicitement une donnée synthétique.
- Marqueur interne `implemented-demo` remplacé par `implemented-synthetic`.
- Identifiant de politique `ML-CIF-POL-INC-1.0.0` remplacé par `ML-CREDIPASS-POL-INC-1.0.0`.
- Libellés français « pilote inclusif contrôlé » normalisés en « inclusion contrôlée » dans la façade/localisation.
- Aucun masquage artificiel `Démo -> Exemple` réintroduit.
- Nouveau test `tests/r4-final-clean-tests.mjs` : 20 contrôles comportementaux couvrant les 8 lots.

## Contrôles exécutés
- `engine-tests.mjs` : PASS 51/51.
- `loan-math-tests.mjs` : PASS — 3 méthodes + ratios.
- `master-refactor-tests.mjs` : PASS.
- `product-registry-tests.mjs` : PASS.
- `closure-ui-tests.mjs` : PASS 9/9.
- `lot-master-tests.mjs` : PASS 8/8.
- `r3-hardening-tests.mjs` : PASS 7/7.
- `r4-final-clean-tests.mjs` : PASS 20/20.

## Portée du PASS R4
Le PASS R4 certifie les contrôles automatisables exécutés dans le paquet : identité membre/dossier, Character & Trust 8 dimensions, inconnues préservées, flux/ratios, garanties expertisées, séparation risque/confiance, délégation, ajournement, décision humaine, cockpit portefeuille et absence des anciennes constantes artificielles de PAR.

## Limite restante
La R4 n'est pas déclarée certifiée Windows/offline dans cet audit. Le rendu réel Chrome/Windows, la navigation visuelle complète et le redémarrage hors connexion doivent être exécutés sur la machine cible avec ce ZIP exact avant dépôt GitLab final.

## Note sur les fixtures historiques
Certains noms de fichiers/modules internes contiennent encore `demo` ou `pilot` car ils portent des jeux synthétiques et des fonctions historiques interconnectées. Ils ne sont pas utilisés comme preuve de données réelles. Leur renommage global a volontairement été évité lorsqu'il n'apportait aucune valeur fonctionnelle et augmentait le risque de régression. Les identifiants ambigus directement liés au CIF et les libellés visibles ciblés ont, eux, été normalisés.

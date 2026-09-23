# CREDIPASS — Démo jury 7 min 30

Objectif : finir avant les 8 minutes et garder une marge de sécurité.

## 0:00–0:50 — Problème
« Dans beaucoup de SFD, l'agent doit réunir des informations dispersées, vérifier la capacité de remboursement et expliquer son analyse, parfois avec une connexion instable. CREDIPASS structure ce parcours et rend le scoring explicable sans retirer la décision à l'institution. »

## 0:50–1:30 — Solution
Montrer l'accueil, dire en une phrase :
- offline-first côté terminal avec IndexedDB ;
- central PostgreSQL ;
- scoring explicable ;
- décision humaine ;
- Copilot pour expliquer le dossier.

## 1:30–4:40 — Démo live cœur du MVP
Compte de départ : `agent.credit / Agent@2026`. Réinitialiser les données du navigateur avant de passer.

1. Ouvrir **Membres**.
2. Ouvrir le dossier préchargé `DOS-0005` — **Moussa Coulibaly**.
3. Montrer : produit, montant, durée, revenus/charges, pièces/preuves.
4. Montrer capacité et soutenabilité.
5. Montrer **INCLUSCORE** (747/1000, « Risque acceptable ») et **confiance des données** séparément. Ouvrir un critère du détail du score et dire : « chaque critère vient de vos formulaires ; les normes de l'institution sont contrôlées à part ».
6. Ouvrir le bouton Copilot 💬.
7. Poser : `Explique-moi ce dossier`.
8. Poser : `Pourquoi ce score ?`.
9. Montrer le circuit : l'avis de l'agent est déjà enregistré (✓).
10. Se reconnecter en `analyste.credit / Analyse@2026` → **Avis de l'analyste** → « Risque acceptable », avis court → transmettre au comité.
11. Se reconnecter en `comite.credit / Comite@2026` → **Enregistrer la décision** → VALIDÉ : montrer montant, taux, durée, nombre d'échéances calculé et score figé.
12. Dire clairement : « CREDIPASS éclaire la décision ; le comité décide. En production, la décision part vers le SIG de l'institution. »

Si le temps manque, sauter les étapes 10 et 11 et montrer seulement le circuit.

## 4:40–5:30 — Faible connectivité
Si le test est stable : activer le mode hors connexion, montrer que les données locales restent accessibles, puis revenir en ligne et synchroniser. Sinon, expliquer brièvement l'architecture et ne pas prendre de risque.

## 5:30–6:30 — Impact SFD
Mettre en avant :
- dossier structuré ;
- cohérence des contrôles ;
- explicabilité du score ;
- continuité de travail hors ligne ;
- traçabilité de la décision ;
- contextualisation Salarié / PME.

## 6:30–7:10 — Track B : ce qui a été adapté
Dire que la solution existante a été contextualisée pour les SFD : formulaires Salarié/PME, politiques, workflow institutionnel, décentralisation, offline, Copilot explicatif.

## 7:10–7:30 — Conclusion
« CREDIPASS transforme un dossier de crédit en décision mieux documentée, explicable et traçable, même lorsque la connectivité est faible. »

STOP à 7:30.

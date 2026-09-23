# AUDIT R19.3 — SFD FIELD + AI COPILOT

Date : 2026-09-22

## Réalisé

- UI Crédit salarié terrain reliée au moteur existant.
- UI Crédit PME terrain reliée à analyse activité/marché, budget, bilan et risque institutionnel.
- Profil de règles terrain SFD configurable par l'Administrateur Système.
- Contrôles Salarié : quotité, durée selon domiciliation, DGA.
- Contrôles PME : couverture garantie, analyse activité, budget et bilan.
- Copilote flottant bas-droite, disponible sur les écrans applicatifs.
- Contexte dossier structuré et réponses locales sur n'importe lequel des 25 dossiers de démonstration.
- Adaptateur IA serveur compatible `chat/completions`, secret côté serveur.
- Repli local automatique si réseau/fournisseur IA indisponible.
- Garde serveur de périmètre avant appel au fournisseur IA.
- Nettoyage des anciens identifiants visibles `responsable.credit` / `admin` dans l'écran de connexion et le README.
- Cache PWA R19.3.

## Gouvernance

Le copilote explique, synthétise et signale. Il ne crée aucune décision de crédit et ne possède pas de permission d'accord/refus.

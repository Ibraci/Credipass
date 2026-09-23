# R19.3 — CORRECTIONS BLOQUANTES

## Bloquants détectés pendant la passe

1. Test R19 hérité figé sur `az-app.js?r=19.0` : corrigé pour certifier la lignée R19 sans casser les releases suivantes.
2. Références visibles obsolètes `responsable.credit` et `admin` : corrigées dans l'écran de connexion et le README.
3. Absence d'UI terrain dédiée Salarié/PME malgré moteurs existants : corrigée.
4. Faux « Assistant IA » déterministe présenté comme IA : remplacé fonctionnellement par CREDIPASS AI COPILOT hybride, avec fournisseur IA serveur configurable et repli local clairement identifié.

## État après correction

Aucun bloqueur automatisé restant : `npm run test:active` PASS.

Le test physique multi-équipements reste une validation environnementale, pas un défaut logiciel déclaré.

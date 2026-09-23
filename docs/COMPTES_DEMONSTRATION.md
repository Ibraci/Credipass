# CREDIPASS — Comptes de démonstration

Ces comptes sont destinés à la **démonstration / hackathon**. Les mots de passe sont volontairement simples à mémoriser. Ils doivent être remplacés avant tout déploiement réel.

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Gérant / Chef d'agence | `gerant` | `Gerant@2026` |
| Agent de crédit | `agent.credit` | `Agent@2026` |
| Analyste / Responsable crédit | `analyste.credit` | `Analyse@2026` |
| Conformité / Contrôle / Risques | `conformite` | `Conformite@2026` |
| Comité de crédit | `comite.credit` | `Comite@2026` |
| Direction | `direction` | `Direction@2026` |
| Auditeur | `auditeur` | `Audit@2026` |
| Administrateur Système | `admin.systeme` | `Admin@2026` |
| Caisse / Comptabilité | `caisse` | `Caisse@2026` |
| Suivi / Recouvrement | `suivi.credit` | `Suivi@2026` |

## Préparation

Après la préparation de PostgreSQL, exécuter une fois :

`PREPARER_COMPTES_DEMO.bat`

Cette commande crée les comptes s'ils n'existent pas et réinitialise leurs mots de passe de démonstration s'ils existent déjà.

## Règle simple pour les retenir

Le mot de passe reprend le nom court du rôle suivi de `@2026`.

Exemples : `Agent@2026`, `Admin@2026`, `Caisse@2026`.

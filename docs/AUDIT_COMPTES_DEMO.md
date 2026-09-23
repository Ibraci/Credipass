# Audit — comptes de démonstration CREDIPASS

## Résultat

PASS — 10 comptes de référence correspondent aux 10 rôles consolidés CREDIPASS.

- Chaque compte possède un mot de passe de démonstration distinct et mémorisable.
- Les mots de passe sont hachés côté serveur avec PBKDF2-SHA256 avant stockage.
- Le mot de passe commun historique `1234` n'est plus le mot de passe par défaut de la release Accounts Ready.
- `PREPARER_COMPTES_DEMO.bat` permet de créer/réinitialiser les comptes sur PostgreSQL existant.
- `PREPARER_POSTGRESQL_DOCKER.bat` prépare automatiquement les 10 comptes après le démarrage de PostgreSQL.
- Les anciens comptes `admin` et `responsable.credit` restent supprimés.
- Les identifiants complets sont documentés dans `COMPTES_DEMONSTRATION.md`.

## Test exécuté

`npm run test:accounts`

Résultat : `DEMO ACCOUNTS: PASS — 10 comptes / 10 mots de passe mémorisables validés`.

Les campagnes fonctionnelles R19.3.2, legacy R16/R18.2/R18.3 et les tests de comptes ont également été exécutés séparément avec succès.

## Sécurité

Ces mots de passe sont destinés exclusivement à la démonstration/hackathon. Avant un déploiement réel, les comptes doivent utiliser des secrets propres à l'institution et une politique de renouvellement adaptée.

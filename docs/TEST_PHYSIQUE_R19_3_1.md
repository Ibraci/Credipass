# TEST PHYSIQUE R19.3.1 — ANDROID / PC / LAN / OFFLINE

Ce protocole est la dernière validation environnementale à exécuter sur le matériel réel. Ne cocher PASS qu'après observation effective.

## Préparation

1. Sur le PC agence, définir un mot de passe de démonstration non trivial :

```powershell
$env:CREDIPASS_DEMO_PASSWORD='A_DEFINIR_LOCALEMENT'
```

2. Lancer `LANCER_CREDIPASS_LAN.bat`.
3. Noter l'adresse LAN affichée par le serveur, par exemple `http://192.168.x.x:8092`.
4. Vérifier le pare-feu Windows et autoriser Node.js uniquement sur le réseau privé utilisé pour le test.
5. Ouvrir CREDIPASS sur le PC et sur un second PC/Android du même réseau.

## Scénario A — dossier terrain hors ligne

- [ ] Connexion `agent.credit` en ligne une première fois.
- [ ] Ouvrir un dossier affecté à l'agent.
- [ ] Couper le réseau du terminal terrain.
- [ ] Vérifier l'état **Hors connexion**.
- [ ] Modifier un élément terrain (visite, formulaire Salarié/PME ou analyse autorisée).
- [ ] Vérifier que l'opération reste en file locale.
- [ ] Fermer complètement l'application/navigation.
- [ ] Réouvrir hors connexion et vérifier que le travail local est conservé.
- [ ] Rétablir le réseau.
- [ ] Lancer la synchronisation.
- [ ] Vérifier que la file diminue et que l'opération apparaît au central.

## Scénario B — lecture par un autre rôle

- [ ] Se connecter sur un autre appareil avec `analyste.credit`.
- [ ] Ouvrir le dossier synchronisé.
- [ ] Vérifier les données Salarié/PME ajoutées depuis le terminal.
- [ ] Vérifier l'historique/audit disponible selon le rôle.

## Scénario C — conflit réel entre deux nœuds

- [ ] Charger le même dossier sur les deux terminaux avant modification.
- [ ] Mettre les deux terminaux hors connexion.
- [ ] Modifier le même dossier différemment sur A et B.
- [ ] Reconnecter A et synchroniser : attendu **PASS**.
- [ ] Reconnecter B et synchroniser : attendu **VERSION_CONFLICT**.
- [ ] Vérifier que les données de A n'ont pas été écrasées.
- [ ] Sur B, utiliser **Résoudre conflit**.
- [ ] Tester une fois `CENTRAL` : la version centrale est conservée.
- [ ] Refaire le scénario et tester `LOCAL` : rebase explicite puis nouvelle synchronisation.
- [ ] Vérifier l'audit après résolution.

## Scénario D — Copilot

### Sans fournisseur IA

- [ ] Ouvrir la bulle 💬.
- [ ] Demander « Explique-moi ce dossier ».
- [ ] Vérifier que le mode affiché est l'assistant local lorsque le fournisseur n'est pas configuré.
- [ ] Demander « Que manque-t-il ? », « Explique les garanties », « Résume pour le comité ».

### Avec fournisseur IA réel configuré

- [ ] Exécuter `npm run test:ai:real` avant la démo.
- [ ] Exiger `R19.3.1 REAL AI: PASS`.
- [ ] Poser une question libre non couverte par les réponses déterministes.
- [ ] Vérifier qu'une réponse contextuelle est retournée.
- [ ] Tester un dossier hors périmètre avec un rôle limité : accès attendu **REFUSÉ**.

## Scénario E — projection jury

- [ ] Tester la résolution d'écran du vidéoprojecteur.
- [ ] Vérifier lisibilité des tableaux et du Copilot.
- [ ] Répéter le scénario de démo sans compilation ni modification de code.
- [ ] Préparer une vidéo/captures de secours hors ligne.

## Critère de sortie

Le GEL physique peut être déclaré uniquement si A+B+C passent, et si le parcours de présentation E est lisible. Le test IA réel D n'est PASS que lorsqu'un vrai endpoint/modèle est effectivement configuré et répond.

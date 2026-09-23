# Checklist MVP avant jury

## Machine principale
- [ ] Chargeur branché.
- [ ] Mode veille désactivé pendant la finale.
- [ ] Résolution d'écran testée sur vidéoprojecteur.
- [ ] Navigateur zoom 100 %.
- [ ] Notifications Windows coupées.

## CREDIPASS
- [ ] `docker compose up -d` démarre la base et l'application (ou, sans Docker, `windows\LANCER_CREDIPASS.bat`).
- [ ] `/api/health` répond OK et indique PostgreSQL.
- [ ] `agent.credit / Agent@2026` se connecte.
- [ ] Dossier `DOS-0005` est visible et s'ouvre.
- [ ] INCLUSCORE de `DOS-0005` : 747/1000, « Risque acceptable », détail des critères visible.
- [ ] Confiance des données s'affiche séparément.
- [ ] Copilot s'ouvre sans bloquer l'écran.
- [ ] Circuit Agent → Analyste → Comité : avis de l'analyste puis décision du comité réalisés en direct.

## Répétition
- [ ] Démo répétée 3 fois sans erreur.
- [ ] Pitch chronométré ≤ 7 min 30.
- [ ] Une personne manipule, une autre commente si possible.
- [ ] 3 questions difficiles préparées, dont :
  - « Le score est-il une probabilité de défaut ? » → Non : indice explicable, pondérations initiales à calibrer sur de vrais remboursements.
  - « Remplacez-vous notre SIG ? » → Non : CREDIPASS instruit et décide, le SIG gère le prêt.
  - « D'où viennent les critères ? » → Des formulaires Salarié et PME et de la fiche d'analyse de l'institution.

## Plan B
- [ ] Captures d'écran du parcours sur la machine.
- [ ] Vidéo locale 60–90 secondes de la démo fonctionnelle.
- [ ] Copie du ZIP MVP sur clé USB.
- [ ] README et comptes disponibles hors ligne.

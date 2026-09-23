# CREDIPASS AI COPILOT R19.3.2 — configuration d'un vrai modèle

CREDIPASS ne contient aucune clé API. Le navigateur ne reçoit jamais le secret du fournisseur. Le serveur CREDIPASS appelle une API compatible `POST /chat/completions`.

## Variables

- `CREDIPASS_AI_BASE_URL` : URL de base, généralement terminée par `/v1` pour un serveur compatible OpenAI.
- `CREDIPASS_AI_MODEL` : identifiant exact du modèle exposé par le fournisseur.
- `CREDIPASS_AI_PROVIDER` : libellé affiché dans les diagnostics.
- `CREDIPASS_AI_API_KEY` : facultatif si le serveur IA n'exige pas de clé ; sinon secret serveur uniquement.

Exemple PowerShell — valeurs factices :

```powershell
$env:CREDIPASS_AI_BASE_URL='http://127.0.0.1:1234/v1'
$env:CREDIPASS_AI_MODEL='modele-local'
$env:CREDIPASS_AI_PROVIDER='Serveur IA local'
$env:CREDIPASS_AI_API_KEY=''
$env:CREDIPASS_DEMO_PASSWORD='A_DEFINIR_LOCALEMENT'
node .\scripts\serve.mjs 8092
```

Pour un fournisseur distant, remplacer l'URL/modèle et renseigner la clé uniquement dans l'environnement serveur. Ne jamais écrire une clé réelle dans `index.html`, `src/`, GitLab ou un fichier livré.

## Test réel obligatoire avant de dire « IA connectée testée »

```powershell
npm run test:ai:real
```

Résultats possibles :

- `R19.3.2 REAL AI: PASS ...` : le modèle configuré a réellement répondu via le serveur CREDIPASS ;
- `R19.3.2 REAL AI: SKIP ...` : aucun modèle réel n'est configuré ; aucun PASS IA réel ne doit être revendiqué ;
- erreur/HTTP 502 : fournisseur inaccessible ou configuration invalide.

## Mode offline

Sans fournisseur ou sans réseau, l'interface retombe sur `ASSISTANT_LOCAL_HORS_LIGNE`. Il peut expliquer les valeurs structurées du dossier, les contrôles, les garanties, la capacité et certains manques/incohérences. Il ne s'agit pas d'un modèle génératif.

## Gouvernance

Le contexte envoyé au fournisseur est construit à partir du dossier ouvert et filtré selon le rôle. Le serveur refuse un dossier hors périmètre. Le prompt système interdit au copilote d'accorder, refuser ou recommander une décision de crédit ; la décision reste humaine.

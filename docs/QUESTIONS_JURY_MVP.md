# Questions jury — réponses courtes

## L'IA décide-t-elle du crédit ?
Non. Elle explique le dossier, les facteurs et les contrôles. La décision reste au Comité selon les droits et le workflow de l'institution.

## Que se passe-t-il sans Internet ?
Le terminal conserve les données locales dans IndexedDB. Le travail peut continuer en mode dégradé puis être synchronisé au retour de la connexion.

## Quelle base centrale utilisez-vous ?
PostgreSQL. Les terminaux ne s'y connectent jamais directement ; ils passent par l'API CREDIPASS.

## Le score est-il une boîte noire ?
Non. CREDIPASS sépare le score de risque de la confiance des données et expose les facteurs utilisés pour l'analyse.

## Utilisez-vous des données réelles ?
Non pour la démonstration du hackathon : uniquement des données synthétiques / de démonstration.

## Qu'avez-vous adapté pendant le Track B ?
Le parcours SFD, les formulaires Salarié/PME, les politiques configurables, le workflow institutionnel, l'offline/décentralisation et le Copilot explicatif.

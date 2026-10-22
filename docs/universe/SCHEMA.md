# Catalogues de production par œuvre

Chaque JSON est la source d’un classeur distinct. Le style reprend le catalogue ME1. Les nouvelles fiches sont des spécifications, pas des fonctionnalités déjà réalisées.

## Format

Objet racine : `id`, `title`, `medium`, `filename`, `scope`, `summary`, `canonNote`, `sources`, `entries`, `coverage`.

- `filename` : nom ASCII avec `_`, suffixe `_Production.xlsx`.
- `sources` : objets `{id,title,url,kind,scope,note}` ; uniquement des pages réellement consultées. `kind` distingue source officielle, publication originale, wiki, entretien, analyse technique ou presse. Les résumés doivent être paraphrasés et brefs, sans longs extraits.
- `coverage` : objets `{area,covered,remaining}` expliquant précisément la couverture et les vérifications restantes.
- `entries` : une fiche par élément ou tâche distincte. Identifiants uniques préfixés par l’identifiant de l’œuvre.

Champs d’une fiche :

| Champ | Contenu |
|---|---|
| id | Identifiant stable, par exemple ME2-CHR-MORDIN |
| category | Un des identifiants autorisés ci-dessous |
| name | Nom de l’élément ou du livrable |
| status | Défini par défaut ; jamais Intégré ou Validé sans réalisation/preuve |
| nature | Établi ; À vérifier ; Extrapolation ; Coupé attesté ; Concept abandonné ; Allégation écartée |
| priority | P0, P1 ou P2 |
| description | Fait vérifié de l’œuvre, ou hypothèse explicitement indiquée. Ne pas transformer une proposition de gameplay en canon. |
| adaptation | Proposition spécifique pour le fan game sprites 2D / décors 3D / groupe / ATB |
| gameplay | Règles, actions, ressources, télégraphes, contre-mesures ; tout chiffre nouveau est un réglage proposé |
| visual | Silhouette, costume, matériaux, palette, composition, éléments distinctifs et contrôle visuel requis |
| animation | Poses, transitions, directions, lisibilité et contraintes pertinentes |
| audio | Ambiance, bruitages, musique originale, VFX et accessibilité pertinents |
| implementation | Placement, flux, données, fichiers prévus, liaisons ou système propriétaire |
| conditions | Prérequis, ramifications, états persistants, variantes ou limites applicables |
| acceptance | Critère concret pour accepter le livrable |
| dependencies | Tableau d’identifiants existant dans le même classeur ; vide si aucune dépendance définie |
| sourceIds | Tableau d’identifiants présents dans sources ; vide pour une création purement originale |
| reference | Partie, mission, numéro de comic ou section réellement identifiée ; ne pas inventer de pages/chapitres |
| notes | Incertitudes, limites, différences d’édition ou besoin de validation |

Les champs non applicables peuvent rester vides avec une explication ciblée. Éviter les copies génériques destinées seulement à gonfler le nombre de lignes. Les noms/faits originaux restent distincts du design original. Aucun commentaire ou dialogue du jeu n’est reproduit longuement.

## Catégories

`characters`, `npcs`, `lore`, `worlds`, `zones`, `links`, `scenery`, `props`, `enemies`, `main_quests`, `side_quests`, `choices`, `dialogues`, `cinematics`, `weapons`, `equipment`, `powers`, `ally_moves`, `enemy_moves`, `animations`, `sprites`, `vfx`, `audio`, `systems`, `qa`, `continuity`.

Pour les œuvres non interactives, les missions, boss, choix et statistiques ajoutés sont des propositions d’adaptation explicitement marquées Extrapolation. Les bifurcations optionnelles ne remplacent pas le déroulement de l’œuvre source. Library Edition est une collection éditoriale, pas une nouvelle aventure. Les rumeurs sur des contenus coupés restent exclues de la continuité.

## Travail demandé aux auteurs

Écrire un JSON par œuvre dans `docs/universe/catalogs/`. Fournir une couverture substantielle de tous les domaines pertinents, avec des descriptions spécifiques aux sujets et des références traçables. Les gros jeux doivent détailler leurs campagnes, extensions, équipiers, lieux, bestiaires et systèmes. Les œuvres courtes restent proportionnées à leur contenu. Ne pas fabriquer de missions, de noms, de scènes ou de statistiques en les présentant comme officiels.

Ne pas créer de XLSX, ne pas modifier le jeu ni le catalogue ME1, ne pas effectuer d’opération Git ou de publication. Le générateur, la mise en forme, les contrôles et la publication sont centralisés.

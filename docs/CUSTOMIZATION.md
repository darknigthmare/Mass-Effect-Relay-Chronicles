# Personnalisation de Shepard — 0.3.0

L’atelier réunit l’apparence de Shepard, l’armure et les armes dans trois onglets. Il prépare une configuration complète dans un brouillon. **Appliquer** valide l’ensemble ; **Annuler** abandonne les retouches. La campagne, le dossier narratif et les possessions restent conservés.

## Choix suivis

| Écran | Options | Effet |
|---|---|---|
| Personnage | Apparence masculine ou féminine, 4 préréglages, 6 teints, 5 couleurs d’yeux, 6 couleurs de cheveux et 4 coiffures | Aperçu 2D et paramètres persistants. Les préréglages ne modifient pas l’origine ou le profil psychologique. |
| Armure | Armure complète possédée, module d’armure, 3 canaux de couleur parmi 10 teintes, 4 motifs, 3 finitions, 3 réglages de casque | L’objet et le module conservent leurs effets de combat. Les autres options sont cosmétiques. |
| Armes | Arme possédée, module d’arme, amélioration de munitions | Même inventaire, mêmes règles de disponibilité et mêmes effets que l’écran Équipement. |

Les préréglages visuels sont Alliance, Vétéran, Colon et Stellaire. Ces noms identifient des dessins de l’atelier ; choisir « Colon » ou « Stellaire » ne réécrit pas les antécédents de Shepard.

Les armures restent des ensembles complets ME1. Un casque visible est une préférence d’affichage, pas un nouvel objet donnant des statistiques. Les cinq emplacements conservés sont l’arme, l’armure, le module d’arme, les munitions et le module d’armure.

## Préparation et validation

Les changements du brouillon n’achètent aucun objet et ne réservent aucun exemplaire. La comparaison utilise les calculs d’acteur et d’équipement existants. L’application vérifie l’intégralité de la configuration contre l’inventaire courant, y compris les objets déjà utilisés par les autres équipiers. Une incompatibilité empêche toute application partielle.

La configuration enregistrée contient les choix cosmétiques dans `state.customization`. L’apparence générale reste dans `state.appearance` et les objets dans `state.inventory.equipped.shepard`. Les sauvegardes antérieures sans champ de personnalisation reçoivent les valeurs par défaut. Une structure présente mais invalide est refusée. Le modèle vérifie les valeurs permises et refuse les accesseurs, cycles et clés interdites sans exécuter de getter.

## Portée visuelle

Le mannequin et le portrait de l’atelier sont des aperçus 2D originaux. Les couleurs et préférences prises en charge par le rendu sont transmises au sprite de Shepard. Le terrain garde les silhouettes et les coupes de cheveux des atlas existants. Les préréglages de visage, formes de coiffure et yeux détaillés se lisent sur l’aperçu de l’atelier ; ils ne déforment pas un modèle facial 3D.

Les silhouettes exactes de chaque modèle d’armure et d’arme, leurs accessoires dans toutes les directions, les coiffures animées et les transitions propres au matériel restent à produire. Aucun niveau de fidélité artistique 1:1 n’est déclaré par cette livraison.

## Suivi dans le classeur

Le catalogue principal et son classeur reçoivent **50 fiches de personnalisation** : 20 systèmes et éléments d’interface, 6 d’armure et équipement, 4 d’armes, 5 de sprites, 3 d’animations et 12 scénarios QA. Le total passe de 1 321 à **1 371 fiches**. Les 1 321 enregistrements précédents, dont les 57 fiches de la feuille Trilogie, gardent leurs identifiants et leur contenu.

Les nouveaux éléments disponibles restent classés **Prototype**. Les variantes artistiques exactes, leurs transitions et leur revue finale restent **Défini / À produire**. Un scénario QA décrit ce qu’il faut contrôler ; les résultats d’exécution sont consignés séparément et ne certifient pas la fidélité des assets.

Voir les [références officielles et différences entre opus](research/customization-sources.md), le [catalogue JSON](content-catalog.json) et le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx).

## Fichiers et vérification

| Fichier | Rôle |
|---|---|
| `src/customization.js` | Choix bornés, brouillon, validation et application atomique |
| `src/customization-ui.js` et `src/customization-ui.css` | Écran, options et prévisualisation |
| `src/state.js` | Migration et validation à l’import des sauvegardes |
| `src/world.js` et `src/customization-render.js` | Application des options prises en charge par le rendu des sprites |
| `tests/customization.test.js` | Invariants du brouillon, de la dotation et des sauvegardes |
| `scripts/customization-browser.mjs` | Parcours de l’atelier dans le navigateur |
| `scripts/update-customization-catalog.mjs` | Extension reproductible du catalogue en conservant les fiches antérieures |
| `scripts/update-customization-workbook.mjs` | Édition ciblée du classeur de référence avec conservation des feuilles existantes |

Le rapport du classeur se trouve dans `docs/workbook-previews/customization-verification.json`. Le contrôle natif du fichier exporté compare les cellules historiques, les tableaux, les validations et les volets gelés. Il complète le recalcul et les rendus visuels du moteur d’édition ; il ne remplace pas une session de test dans Microsoft Excel.

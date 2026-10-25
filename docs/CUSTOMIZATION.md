# Personnalisation de Shepard — 0.3.0

L’atelier réunit l’apparence de Shepard, l’armure et les armes dans trois onglets. Il prépare une configuration complète dans un brouillon. **Appliquer** valide l’ensemble ; **Annuler** abandonne les retouches. La campagne, le dossier narratif et les possessions restent conservés.

## Choix suivis

| Écran | Options | Effet |
|---|---|---|
| Personnage | Apparence masculine ou féminine, 4 préréglages, 6 teints, 5 couleurs d’yeux, 6 couleurs de cheveux et 4 coiffures | Aperçu 2D et paramètres persistants. Les préréglages ne modifient pas l’origine ou le profil psychologique. |
| Armure | Armure complète possédée, deux modules d’armure, 3 canaux de couleur parmi 10 teintes, 4 motifs, 3 finitions, 3 réglages de casque | L’objet et ses modules conservent leurs effets de combat. Les autres options sont cosmétiques. |
| Armes | Arme possédée, deux modules d’arme, amélioration de munitions, OmniTech et amplificateur compatibles | Même inventaire, mêmes règles de disponibilité et mêmes effets que l’écran Équipement. |

Les préréglages visuels sont Alliance, Vétéran, Colon et Stellaire. Ces noms identifient des dessins de l’atelier ; choisir « Colon » ou « Stellaire » ne réécrit pas les antécédents de Shepard.

Les armures restent des ensembles complets ME1. Un casque visible est une préférence d’affichage, pas un nouvel objet donnant des statistiques. Les neuf emplacements sont l’arme, l’armure, deux modules d’arme, une modification de munitions, deux modules d’armure, l’OmniTech et l’amplificateur biotique. Les outils restent soumis aux capacités du personnage et n’ajoutent aucun pouvoir.

## Préparation et validation

Les changements du brouillon n’achètent aucun objet et ne réservent aucun exemplaire. La comparaison utilise les calculs d’acteur et d’équipement existants. L’application vérifie l’intégralité de la configuration contre l’inventaire courant, y compris les objets déjà utilisés par les autres équipiers. Une incompatibilité empêche toute application partielle. Retirer ou remplacer une arme ou une armure remet ses modules dans le stock ; les réattacher demande une sélection explicite. Les formations existantes sont conservées. Une autorisation historique `legacyArmor` ne vaut que pour la pièce restée portée : son retrait ou remplacement l’annule et impose ensuite la formation requise. Une sélection réellement identique ne retire pas cette autorisation.

La configuration enregistrée contient les choix cosmétiques dans `state.customization`. L’apparence générale reste dans `state.appearance` et les objets dans `state.inventory.equipped.shepard`. Les sauvegardes antérieures sans champ de personnalisation reçoivent les valeurs par défaut. Une structure présente mais invalide est refusée. Le modèle vérifie les valeurs permises et refuse les accesseurs, cycles et clés interdites sans exécuter de getter.

## Portée visuelle

Le mannequin et le portrait de l’atelier sont des aperçus 2D originaux. Les couleurs et préférences prises en charge par le rendu sont transmises au sprite de Shepard. Le terrain garde les silhouettes et les coupes de cheveux des atlas existants. Les préréglages de visage, formes de coiffure et yeux détaillés se lisent sur l’aperçu de l’atelier ; ils ne déforment pas un modèle facial 3D.

Les silhouettes exactes de chaque modèle d’armure et d’arme, leurs accessoires dans toutes les directions, les coiffures animées et les transitions propres au matériel restent à produire. Aucun niveau de fidélité artistique 1:1 n’est déclaré par cette livraison.

## Suivi dans le classeur

Le catalogue principal et son classeur reçoivent **50 fiches de personnalisation** : 20 systèmes et éléments d’interface, 6 d’armure et équipement, 4 d’armes, 5 de sprites, 3 d’animations et 12 scénarios QA. La fusion finale conserve les **1 330 fiches du main `748b965` et les 50 fiches de personnalisation**, soit **1 380 fiches principales** et **6 706 références** avec les 5 326 fiches supplémentaires. Les 43 sources sont conservées, avec les annotations récentes de main pour les sources partagées. Les 57 fiches de la feuille Trilogie et les six statuts avancés historiques restent inchangés.

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
| `scripts/build-workbook.mjs` | Génération courante du principal fusionné à 1 380 fiches |
| `scripts/verify-customization-workbook.py` | Comparaison de la fusion avec les deux bases Git et contrôle natif du classeur |
| `scripts/update-customization-catalog.mjs` | Outil historique du premier lot, avec sa base et ses garde-fous initiaux |
| `scripts/update-customization-workbook.mjs` | Outil historique d’ajout ciblé sur le classeur de la première livraison |

La validation finale est conservée séparément dans [pr1-final-report.json](qa/pr1-final-report.json) : **415 tests Node**, **neuf contrôles de personnalisation** en développement et en production, puis **dix contrôles HTTP du build fusionné**. Les rapports [personnalisation](qa/pr1-final-customization-report.json) et [production](qa/pr1-final-production-report.json) identifient leurs sources et les ressources réellement chargées.

Le [contrôle final du classeur](qa/pr1-final-workbook-report.json) compare les 1 330 fiches de main, les 50 fiches de la PR et les 23 460 cellules de catalogue ; il vérifie aussi les 28 feuilles, 26 tableaux filtrés, validations, formules et volets gelés. La génération courante utilise `scripts/build-workbook.mjs`, puis le mode de fusion de `scripts/verify-customization-workbook.py`. Les outils `update-customization-*` restent ceux du lot initial, dont les hypothèses anciennes ne décrivent pas la base fusionnée.

Les rapports initiaux [customization-verification.json](workbook-previews/customization-verification.json), [customization-native-check.json](workbook-previews/customization-native-check.json) et [v0.3.0-report.json](qa/v0.3.0-report.json) restent des archives de leur livraison 1 321→1 371. Le [premier contrôle de fusion](workbook-previews/customization-merge-native-check.json) porte sur `0d2192a`. Ces preuves historiques ne sont pas réécrites pour la synchronisation finale. Aucun de ces contrôles n’est un essai de Microsoft Excel ou de l’exécutable Windows natif.

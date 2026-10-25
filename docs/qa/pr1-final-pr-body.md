Cette PR ajoute un atelier de personnalisation de Shepard, accessible à la création et hors combat depuis la pause, le commando et l’équipement. Les onglets Personnage, Armure et Armes partagent un brouillon détaché, des aperçus dans quatre directions et une comparaison ; appliquer valide toute la configuration, annuler conserve la partie.

Les options cosmétiques sont persistantes. L’atelier respecte les neuf emplacements et les quantités de l’inventaire existant, restitue les modules au remplacement de leur pièce et fait expirer l’autorisation d’une ancienne armure lorsqu’elle est retirée. Les objets d’autres équipiers restent réservés. Les préréglages détaillés du visage sont des aperçus 2D ; les sprites existants reçoivent les teintes prises en charge, sans nouveau modèle facial 3D.

La branche intègre `main` `748b965` et conserve ses Chroniques et ses règles d’équipement : ces contenus déjà livrés ne constituent pas les ajouts fonctionnels de cette PR. Le catalogue fusionné contient **1 380 fiches principales = 1 330 existantes + 50 fiches de personnalisation inchangées**, et **6 706 références** avec les 27 catalogues supplémentaires. Les 43 sources principales sont réunies ; le runtime compte 452 sources avec les catalogues supplémentaires. Tous les exports univers, leur manifeste et leur ZIP sont préservés. La version reste **0.3.0**.

Validation récente de la fusion :

- **415 tests Node** réussis, dont 19 de personnalisation ; compilation Vite réussie.
- **9 contrôles navigateur** de personnalisation : création, application et annulation, clavier/mobile, inventaire, migration, sauvegardes et reprise, en développement puis en production.
- **10 contrôles HTTP de production** : parcours ME1 et Chroniques, sauvegardes complètes conservées, six bundles servis identiques au build et aucun harnais DEV. Aucune erreur JavaScript ni requête échouée.
- Classeur principal : **23 460 cellules**, 28 feuilles et 26 tableaux vérifiés contre les deux bases ; aucun fichier univers modifié par la fusion.

Preuves : [rapport final](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/pr1-final-report.json), [personnalisation](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/pr1-final-customization-report.json), [production](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/pr1-final-production-report.json), [classeur](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/pr1-final-workbook-report.json). Les rapports antérieurs gardent leurs sources et empreintes historiques.

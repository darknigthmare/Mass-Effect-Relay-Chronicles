Ajoute un atelier de personnalisation de Shepard à la création et depuis les menus de campagne. Les trois onglets Personnage, Armure et Armes partagent un brouillon : appliquer valide l’apparence et la dotation ensemble, annuler restaure l’état précédent. L’inventaire réel à neuf ports, ses quantités et ses restrictions restent respectés, y compris l’expiration des anciennes autorisations d’armure.

Les choix sont conservés par sauvegarde, export/import et reprise. Les aperçus 2D et la recoloration des sprites restent des rendus de prototype.

La branche est synchronisée avec main `1310a84` (correctif documentaire après `cefa0b1`, sans changement applicatif). Les contenus Chroniques, soutiens, munitions et portraits déjà présents dans main sont conservés. Le catalogue réunit ses 1 330 fiches principales et les 50 fiches de personnalisation, soit 1 380 principales et 6 706 références au total, avec 453 sources. Les 27 classeurs univers et leurs sources restent identiques à main.

Validation du code combiné :

- 492 tests Node réussis et compilation de production.
- 9 contrôles de personnalisation, dont le parcours en production, et 12 contrôles HTTP ; aucune erreur JavaScript ni requête échouée.
- Sept bundles servis et portrait PNG vérifiés par SHA256 ; aucun harnais DEV dans le build.
- Classeur principal reconstruit et vérifié contre main : 1 380 fiches, 43 sources, 28 feuilles et 26 tableaux filtrés ; les rapports historiques sont conservés.

[Rapport actuel](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/customization-support-sync-report.json) · [Parcours de personnalisation](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/customization-support-sync-customization-report.json) · [Production HTTP](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/character-customization-v03/docs/qa/customization-support-sync-production-report.json)

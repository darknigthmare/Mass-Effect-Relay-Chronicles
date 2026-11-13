# Advance : cartes, entrées et reprise d’un contact

Socle : `d2e8432ec4057890b6f86e42ce596f1ab5810148`, Three.js 0.180.0 et Vite 7.3.7. Les sprites 2D, les décors 3D, la caméra orthographique et les commandes ATB sont conservés. Aucune géométrie originale de Mass Effect n’est certifiée par ce lot.

Les consignes `AGENTS.md`, `README.md` et `docs/GAMEDEV_GUIDANCE.md` ont été relues. Les guides épinglés `level-design`, `camera-systems` et `game-ui-ux` ont été consultés dans le cache `/tmp/relay-guides` : rendre les verrous compréhensibles, garantir un chemin praticable, préserver le cadrage existant et distinguer le suivi d’un objectif de sa présence dans un filtre.

| Fiche | Changement concret | Limite de fidélité |
| --- | --- | --- |
| `SYS-carte-galactique` | Annuaire natif amas → système → planète. Une destination verrouillée reste consultable. Le déploiement seul est désactivé ; les étapes manquantes sont tirées des mêmes règles que `unlockedZones`. | Les huit étapes et leur regroupement proviennent de la campagne condensée. Ce n’est pas une reconstitution de la totalité des systèmes galactiques de ME1. |
| `SYS-carte-locale` | Les empreintes des collisions réelles, augmentées du dégagement des pieds, utilisent la projection du sol. Les numéros restent stables dans les filtres. Un repère masqué conserve une explication visible de son suivi. Le suivi d’une charge ou d’une opération passe à son étape courante après résolution. | Les contours existants sont ceux de l’adaptation. Les cartes sans plan détaillé conservent leur cadre historique. Les marqueurs ne sont pas des niveaux canoniques supplémentaires. |
| `QA-sortie-bidirectionnelle` | Les retours débarquent dans l’approche intérieure du Normandy, à trois unités de la sortie. Changer de scène efface chemin, interaction et entrées de mouvement en attente. Le contrôleur principal protège la transition contre une seconde demande. | Les liaisons testées sont les huit déploiements/extractions du prototype. L’événement scénaristique du Conduit reste une transition narrative particulière. |
| `QA-fuite-et-reentree` | Compteur visible de huit secondes de terrain, refus explicite du contact concerné avant expiration, calcul séparé testé à 7,999 et 8 secondes ainsi qu’aux 479e/480e pas de 1/60 s. Les menus et combats suspendent le délai. | Règle de l’adaptation ATB. Le délai reste un état de session ; sa persistance après quitter/recharger n’est pas revendiquée. |

`getDestinationAccess` explique les prérequis et ne modifie aucun drapeau. L’autorité transactionnelle reste dans `state.js`. Le traitement d’une sauvegarde refusée et la progression de campagne sont couverts par le lot Progression ; ce module ne crée pas de nouvelle sauvegarde ni de format parallèle.

## Civils de Féros

À la phase des seize cibles, chaque cible actuelle dispose d’un corps visible sur son point praticable. Arcelia, Macha et Davin réutilisent leur corps Horizon existant ; les treize cibles anonymes réutilisent le sprite civil Emily comme substitut **Prototype**. Il ne s’agit pas de treize apparences nouvelles, ni d’une preuve d’identité canonique. Aucun PNG ou fichier de coordonnées d’atlas n’est modifié.

La présence est dérivée de `advanceFerosCivilianAlive` lors d’un changement de contexte. Les corps non létaux restent présents, les victimes ne réapparaissent pas et les corps nommés ne se doublent pas avec leurs anciens interlocuteurs. Fai Dan ne fait pas partie des seize survivants ; il disparaît après l’ouverture du cargo. Le test natif utilise les vraies transitions de Féros et la vraie scène dressée.

## Vérification

Le 13 novembre 2026, la commande ciblée suivante a réussi : **20 tests sur 20**, dont dix nouveaux. Elle utilise les vraies scènes, collisions, chemins et méthodes de `WorldView`, en remplaçant uniquement les frontières navigateur/image/canvas dans la fixture native.

```bash
node --test tests/advance-world.test.js tests/level-map-render.test.js tests/horizon-character-world.test.js
```

Les huit scènes d’expédition disposent chacune d’un chemin calculé entre arrivée et extraction sur leur sol réellement dressé. Les empreintes de carte sont des copies détachées des collisions. Les vérifications comprennent les 1 024 combinaisons de progression/drapeaux, les neuf destinations, le suivi et les filtres, les seize corps civils et le compteur de réentrée. Ce résultat natif ne vaut pas observation d’un navigateur.

Le collecteur unique `scripts/advance-world-public.mjs` accepte `ADVANCE_WORLD_MODE=development` ou le littéral `production`, `ADVANCE_WORLD_PREFIX` et `GAME_URL`. Il prépare des sauvegardes explicitement décrites, les importe par le sélecteur public, utilise les commandes du jeu, réserve naturellement les jauges ATB et exporte les sauvegardes réelles. Il ne modifie ni état privé, ni DOM/CSS, ni horloge, ni cadence.

Les contrôles de distribution exigent les mêmes hachages de sources au début et à la fin, le contexte catalogue/registre courant, le gel de tous les fichiers de `dist`, leurs mêmes octets servis par HTTP et aucune requête `/src/`, `/@vite/` ou `/@fs/` en production. Les sorties antérieures ne sont jamais écrasées. La qualité **Économie** est choisie dans les options publiques sur SwiftShader.

Le parcours historique [DEV02](../qa/advance-world-dev-02-report.json) réussit les quatre groupes, avec six captures réellement ouvertes dans la [revue visuelle](../qa/advance-world-dev-02-visual-review.json) et trois exports publics. Il montre huit paires d’extraction/déploiement, le suivi après un désamorçage réel, le refus de réentrée à 5,083 secondes de terrain après l’export de repli, une attente explicite de 8 500 ms entre exports identiques en pause, puis un nouveau combat naturel. La durée `pausedWallTimeMs` inclut aussi la reprise ; elle ne doit pas être citée comme une mesure isolée de la pause.

La vérification courante [DEV03](../qa/advance-world-dev-03-report.json), après correction des opérations de PNJ morts, rejoue les mêmes quatre groupes avec six nouvelles captures [réellement relues](../qa/advance-world-dev-03-visual-review.json) et trois nouveaux exports. Le refus près du contact survient après 4,867 secondes de terrain, avec 3,133 secondes restantes ; les exports en pause sont identiques, puis la réentrée se produit naturellement. Les sources et leur contexte catalogue/registre restent gelés pendant le parcours. Le [contrôle natif global 03](../qa/advance-integration-final-03-report.json) compte 1 177 tests réussis.

Les huit paires prouvées ne ferment pas `QA-sortie-bidirectionnelle` dans sa portée générale « chaque liaison ». Le Conduit scénaristique reste à sens unique et les liaisons futures ne sont pas couvertes. Cette fiche reste partielle ; aucun retour contraire au récit n’est ajouté pour faire disparaître cette réserve.

Le collecteur [version 02](../../scripts/advance-world-public-02.mjs) termine chaque geste clavier par un déplacement réellement observé sur le radar public. La [tentative DEV01](../qa/advance-world-dev-01-report.json) et sa [revue négative](../qa/advance-world-dev-01-visual-review.json) restent intactes : ses gestes de 120 ms n’atteignaient pas le contact à la cadence observée sous SwiftShader. Aucun changement de produit n’a été nécessaire entre ces essais. Les appuis E volontairement répétés avant expiration empilent des notifications dans la capture finale ; cette revue ne certifie pas la lisibilité de la colonne de cibles pendant ce spam.

Le parcours compilé [PROD02](../qa/advance-world-production-final-02-report.json) réussit les quatre groupes avec six nouvelles captures [réellement ouvertes](../qa/advance-world-production-final-02-visual-review.json) et trois exports réels. Le groupe revient près du contact, à environ 1,752 unité, et subit un refus après 4,367 secondes de terrain avec 3,633 secondes restantes. Les deux exports en pause restent identiques pendant l’attente explicite de 8 500 ms ; la mesure avant reprise est de 9 999 ms, export compris. Le combat reprend naturellement après expiration. Les 93 fichiers de `dist` restent gelés et leurs octets HTTP concordent avec le build ; les sources, catalogue et registre courants restent gelés, sans requête de source DEV ni harness QA.

La [tentative compilée PROD01](../qa/advance-world-production-final-01-report.json) et sa [revue négative](../qa/advance-world-production-final-01-visual-review.json) sont conservées. Son oracle lisait séparément radar et interaction : le bouton d’arrivée apparaissait entre ces lectures, puis une assertion de mouvement échouait. La [variante QA03](../../scripts/advance-world-public-03.mjs) relève ces deux indications dans une observation DOM synchrone et respecte l’arrivée avant l’assertion de déplacement. Les contrôles suivants de proximité par export réel, de refus avant huit secondes, de suspension et de nouveau combat restent stricts. Ce changement concerne seulement le collecteur ; aucun produit, test, fichier principal ou proposition n’est modifié entre les deux tentatives compilées.

Trois critères fonctionnels sont ainsi couverts : carte galactique, carte locale et fuite/réentrée. La QA générale de sortie bidirectionnelle conserve sa réserve explicite malgré huit paires réussies. Aucun statut du catalogue, d’asset, de registre ou de classeur n’est changé par ce document.

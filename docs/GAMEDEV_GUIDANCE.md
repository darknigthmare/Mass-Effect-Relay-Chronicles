# Guides gamedev appliqués à Relay Chronicles

## Objectif et point de référence

Ce document adapte les guides de [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) au développement de **Mass Effect — Relay Chronicles**. Il relie chaque type de travail aux modules existants, aux sources du suivi de production et aux preuves nécessaires pour déclarer un résultat terminé.

Révision des guides : [`19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/commit/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9). Le [registre des sources](gamedev-sources.json) contient les chemins, liens permanents et identifiants Git des douze guides sélectionnés, avec leurs conditions d'utilisation.

État du jeu examiné : [`main` au commit `3670047499b90aa94e701bd00991bf5b2d15badc`](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/commit/3670047499b90aa94e701bd00991bf5b2d15badc), le **29 octobre 2026**. Cette date identifie la revue documentaire, pas une nouvelle version de gameplay. Lors d'une reprise, relire le code et le manifeste courants ; les rapports des versions précédentes restent des preuves historiques.

## 1. Socle et direction du jeu

| Élément | Référence du projet | Conséquence pour les guides |
|---|---|---|
| Langage et compilation | JavaScript ESM, Vite 7.3.7 | Utiliser les modules existants et la résolution de Vite. |
| Rendu | Three.js 0.180.0 ; `src/world.js` | Conserver le renderer WebGL et la caméra orthographique, adapter les exemples externes r186. |
| Présentation | Personnages en sprites 2D HD dans des décors 3D | Préserver proportions, lumière, ancrage et cadrages ; la référence JRPG PlayStation concerne la mise en scène. |
| Interface | DOM/CSS dans `src/main.js` et les modules `*-ui.js` | Appliquer les principes de navigation et d'état à ces composants. |
| Distribution | Web et enveloppe Electron 45.0.0 | Contrôler les chemins d'assets dans le build réellement visé. |
| Exécution des outils | Node 22.12+ ; CI Node 24 ; Playwright 1.64.1 | Lire les prérequis de chaque script ; la génération Excel demande aussi le runtime d'artefacts. |

Les versions sont celles du [manifeste inspecté](../package.json). Le [guide de conception](DESIGN.md), les [briefs artistiques](ART_BRIEFS.md), le [registre des assets](ASSETS.md), la [personnalisation](CUSTOMIZATION.md) et le [suivi de fidélité](FIDELITY.md) donnent les conventions propres au jeu.

### Adapter les exemples Three.js

Les trois guides Three.js sélectionnés ciblent r186. Vérifier toute API dans le paquet **0.180.0** avant utilisation et garder les addons compatibles avec cette même version. L'import map CDN du tutoriel n'a pas lieu d'être dans l'application Vite. La recommandation `Timer` motivée par r183 ne remplace pas automatiquement la gestion du temps existante. Les nouveautés DRACO/KTX2 annoncées à partir de r185 et les changements d'ombres r182 ne doivent pas être supposés présents dans r180.

Le renderer actuel utilise une caméra orthographique, un filtrage linéaire et des règles d'alpha pour les sprites. Ne pas imposer les réglages d'un tutoriel pixel art, une caméra libre ou un autre backend de rendu à ce style. Une importation glTF/GLB ne devient pertinente que pour un chantier qui en a besoin ; la présence du guide ne signifie pas que des modèles 3D complets sont déjà livrés.

## 2. Quel guide lire pour quel chantier ?

Les identifiants ci-dessous renvoient aux URLs épinglées dans [gamedev-sources.json](gamedev-sources.json). Lire seulement les guides utiles au travail courant ; compléter par leurs références internes si nécessaire.

| Chantier | Guides à mobiliser | Points d'entrée du projet | Résultat attendu |
|---|---|---|---|
| Choisir la méthode de travail | `router` | `package.json`, `README.md`, ce guide | Moteur identifié, périmètre et critères d'acceptation explicites. |
| Équipement, stats, combat ATB | `rpg` | `src/loadout.js`, `src/combat.js`, `src/game-data.js` | Bonus réversibles, restrictions cohérentes, effets de combat vérifiés. |
| Atelier personnage / armure / armes | `game-ui-ux`, `rpg`, `save-systems` | `src/customization.js`, `src/customization-ui.js`, `src/customization-render.js` | Parcours brouillon → application → combat → sauvegarde/reprise cohérent. |
| Sprites, variantes, animations et décors | `create-game-assets`, puis guide Three.js concerné | `public/assets/`, `docs/ART_BRIEFS.md`, `src/world.js` | Famille visuelle cohérente, contrôles techniques et observation en jeu. |
| Sauvegardes et migration | `save-systems` | `src/state.js`, `src/save-slots.js`, `src/chronicles.js` | Anciennes parties lisibles, données invalides refusées, progression préservée. |
| Dialogues, décisions et quêtes | `dialogue-systems`, `rpg` | `src/story-data.js`, `src/story.js`, `src/operations.js`, `src/chronicle-story.js` | Conditions respectées, effets persistants et récompenses uniques. |
| Cartes, collisions et rencontres | `level-design`, `camera-systems` | `src/world-data.js`, `src/world.js`, `src/assignment-data.js`, `src/operation-data.js` | Objectifs accessibles, retours possibles et cadrage lisible. |
| Caméra, canvas et rendu | `threejs-scene-setup`, `camera-systems` | `src/world.js`, `src/main.js` | Scène visible, redimensionnement correct et transitions stables. |
| Matériaux, textures et lumière | `threejs-materials-lighting`, `create-game-assets` | `src/world.js`, `src/customization-render.js` | Couleurs, transparence et silhouettes cohérentes dans le décor réel. |
| Import explicite de modèles glTF/GLB | `threejs-gltf-loading`, `create-game-assets` | Chargeur et ressources à identifier dans le chantier | Échelle, orientation, clips et décodeurs vérifiés dans le build cible. |
| Ralentissements et budgets de ressources | `performance-optimization`, guide Three.js concerné | Scène reproductible et profilage du renderer | Mesure avant/après comparable et cause du ralentissement identifiée. |

## 3. Invariants à protéger

### Personnalisation et équipement

L'atelier modifie un brouillon détaché de la partie. **Appliquer** valide les neuf emplacements ensemble avec le stock courant ; une erreur ne doit laisser aucune application partielle. **Annuler** conserve apparence, inventaire, crédits et équipement. L'atelier reste indisponible en combat.

Les emplacements sont : arme, armure, deux modules d'arme, modification de munitions, deux modules d'armure, OmniTech et amplificateur biotique. Les capacités, espèces, formations et disponibilités continuent de s'appliquer. Remplacer une arme ou une armure restitue ses modules ; l'exception historique `legacyArmor` est propre à la pièce demeurée équipée.

Les statistiques se calculent depuis les valeurs de base et la configuration équipée. Rééquiper, prévisualiser ou charger une sauvegarde ne cumule pas les bonus. Un choix cosmétique ne donne pas de statistiques, un outil ne crée pas de pouvoir absent et une image d'arme n'est pas une preuve de son comportement de combat. Voir [CUSTOMIZATION.md](CUSTOMIZATION.md).

### Persistance et narration

Les formats ont plusieurs versions : l'enveloppe de sauvegarde de la campagne et la version de l'inventaire ne doivent pas être confondues. Un ancien champ absent peut recevoir sa valeur de migration ; un champ explicitement présent mais invalide doit suivre le refus prévu par le validateur. Ne pas remplacer la partie courante avant la validation complète d'un import.

Une sauvegarde automatique reste distincte des six emplacements manuels. La lecture et l'écriture conservent les erreurs de stockage explicites. Les exemples de fichiers temporaires du guide externe expriment un principe de protection ; ils ne constituent pas une API de `localStorage` ni une garantie de sauvegarde sur disque pour cette application.

Les décisions narratives, recrutements, décès, opérations et récompenses restent cohérents après reprise. Revenir dans une conversation ou une rencontre déjà résolue ne verse pas une seconde récompense. Les Chroniques ont leur état et leur clé de stockage propres, avec leur contexte œuvre/période ; une simulation ne modifie pas la campagne ME1. Voir [CHRONICLES.md](CHRONICLES.md).

### Assets et fidélité

Pour chaque famille produite, consigner l'œuvre/période, la référence, le sujet, la variante, les directions, les états d'animation, les dimensions, le pivot, les fichiers et les limites. Réutiliser le catalogue et les manifestes existants avant de créer un nouveau registre.

Contrôler séparément :

1. **Technique** : fichier présent et chargeable, dimensions, alpha, rectangles UV, absence de découpe involontaire, stabilité des pieds et des proportions entre images.
2. **À taille réelle** : silhouette lisible, identité et équipement reconnaissables, continuité de mouvement.
3. **Dans le jeu** : comparaison au décor, aux autres personnages, à la caméra et aux actions réellement jouables.
4. **Fidélité** : comparaison à des références identifiées pour le bon opus et la bonne période ; réserves explicites sur ce qui reste interprété.

Une planche, un buste ou une illustration de concept ne valide pas les vues arrière, animations, modèles complets ou comportements qu'il ne contient pas. Un équipement exécutable, une consultation documentaire et une simulation partielle doivent conserver leurs périmètres respectifs. Le [guide des assets](ASSETS.md) et les sources dans `docs/research/` priment pour les références artistiques du projet.

## 4. Catalogue et Excel : utiliser le bon pipeline

| Livrable | Source et outils | Vigilance |
|---|---|---|
| Classeur principal | `docs/content-catalog.json` → `scripts/build-workbook.mjs` → `docs/Mass_Effect_Relay_Chronicles_Production.xlsx` | `npm run workbook` nécessite `CODEX_PRIMARY_RUNTIME_NODE_MODULES` et `@oai/artifact-tool`. `npm ci` seul ne fournit pas ce runtime. |
| Catalogues des œuvres et runtime des Chroniques | `docs/content-catalog.json` et `docs/universe/catalogs/` → `scripts/build-universe-runtime.mjs` → `src/universe-data.js` | `npm run build:universe` construit le module généré ; il ne met pas à jour les Excel. |
| Classeurs des œuvres | `scripts/build-universe-workbooks.mjs`, `scripts/package-universe-workbooks.py`, `scripts/verify-universe-workbooks.py` | Lire les options et les sources d'entrée de chaque script ; contrôler les œuvres et lignes effectivement touchées. |
| Deux lots Simulation | `scripts/build-expansion-workbook.py`, `scripts/build-expansion2-workbook.py` et outils `audit-` / `verify-` associés | Utiliser le pipeline du lot concerné et ses données courantes ; conserver les résultats et limites du premier lot. |

Les outils `scripts/update-customization-catalog.mjs` et `scripts/update-customization-workbook.mjs` décrivent le premier lot historique de personnalisation. Leurs anciennes hypothèses de base ne justifient pas une régénération aveugle des fichiers courants.

Conserver les statuts de contenu **Défini / Prototype / Intégré / Validé**, le statut d'asset, les priorités, les dépendances et les critères d'acceptation existants. Une liste exhaustive de fiches n'est pas une réalisation exhaustive du jeu. Garder un lien clair entre fiche, fichier intégré, parcours jouable et résultat de contrôle.

`npm run audit:fidelity` examine par défaut le catalogue principal ; `npm run audit:fidelity -- --include-universe` inclut les catalogues des œuvres. L'outil vérifie les déclarations, les dépendances et l'existence des fichiers. Son résultat ne certifie pas le canon, l'exhaustivité des contenus ou la ressemblance visuelle. Préserver les rapports historiques et écrire les nouvelles preuves avec leur portée exacte. Les vérificateurs qui comparent des bases Git, notamment `scripts/verify-customization-workbook.py`, nécessitent les références historiques demandées ; une copie partielle ou un clone peu profond peut être insuffisant.

Une modification exclusivement documentaire de ces guides n'exige pas de changer des statuts ou de régénérer les classeurs. Un changement de contenu ou de disponibilité doit, lui, mettre à jour la source de suivi concernée et l'export correspondant.

## 5. Vérifications adaptées au changement

### Préparer les outils

Les commandes npm ci-dessous existent dans `package.json` au commit de référence. Relire leur définition sur la branche de travail. Les tests Node et le build sont deux contrôles différents ; les tests de navigateur et la revue visuelle apportent des preuves supplémentaires.

Pour un environnement de développement disposant des dépendances :

```bash
npm ci
npm test
npm run build
```

Les scripts navigateur existants attendent un serveur de développement, normalement sur le port **4173**, et un navigateur Chromium disponible pour Playwright. Démarrer le serveur dans un terminal distinct, puis lancer le scénario dans un second terminal :

```bash
RELAY_QA=1 npm run dev -- --host 127.0.0.1 --port 4173
```

La syntaxe d'affectation ci-dessus est celle d'un shell POSIX. Lire dans chaque script sa variable d'URL et ses options avant de changer le port ou la cible. `RELAY_QA=1` désactive HMR ; les scripts ajoutent `?qa` pour le harness réservé au mode développement. Une réussite sur Vite en développement ne démontre pas à elle seule le fonctionnement du build de distribution.

Pour `scripts/customization-browser.mjs`, renseigner **`CUSTOMIZATION_BASE_MAIN` avec le vrai SHA de base** : sa valeur par défaut renvoie à une livraison historique. `GAME_URL`, `PRODUCTION_GAME_URL`, `PLAYWRIGHT_EXECUTABLE_PATH` et `CUSTOMIZATION_REPORT_PREFIX` permettent de choisir les cibles, le navigateur et les sorties pris en charge par ce script. Vérifier les paramètres des autres scripts séparément.

### Choisir les scénarios utiles

| Changement | Commandes/scénarios existants à sélectionner | Observation complémentaire |
|---|---|---|
| Personnalisation | `npm run test:customization`, `npm run test:loadout:extensions` ; `npm run test:saves` si persistance touchée | Tester appliquer/annuler, quatre directions, équipement indisponible et reprise. |
| Inventaire et effets en combat | `npm test`, `npm run test:loadout`, `npm run test:balance` selon le système | Vérifier le stock, le calcul des bonus et les effets réels sur une rencontre. |
| Sauvegardes | `npm run test:saves` et tests de migration concernés | Tester ancienne partie, import refusé, reprise après fermeture et erreur de stockage. |
| Dialogues et progression | `npm run test:story`, `npm run test:assignments`, `npm run test:operations`, `npm run test:campaign` selon le périmètre | Vérifier les branches et les effets après reprise, sans répéter les récompenses. |
| Monde et caméra | `npm run test:world`, `npm run test:browser`, parcours de campagne concerné | `test:world` charge `/src/world.js` et exige le serveur de développement ; parcourir aussi la zone et observer le cadrage. |
| Chroniques | `npm run test:universe`, `npm run test:chronicle:expansion`, `npm run test:chronicle:specialists`, `npm run test:chronicle:support`, `npm run test:arsenal` selon le module | Vérifier contexte œuvre/période et isolation ME1 ; consulter aussi les scripts des lots Simulation si touchés. |
| Excel/catalogues | Outil de génération et vérificateur du pipeline concerné | Contrôler IDs, lignes, statuts, formules et lisibilité des feuilles modifiées. |
| Distribution web | `npm run build`, puis `node scripts/production-http-browser.mjs` après lecture de ses paramètres | Contrôler le build `dist/` servi par HTTP, ses assets et l'absence de `__RELAY_TEST__` ; cela ne valide pas Electron/Windows. |
| Documentation seule | Relecture, résolution des liens locaux, cohérence des versions/commandes et des références épinglées | Ne pas déclarer des tests de jeu non exécutés. |

Limiter les contrôles aux risques du changement et aux exigences de la CI. Corriger la cause d'une régression et vérifier le cas concerné ; éviter de multiplier des tests qui ne feraient que répéter l'implémentation.

Le workflow existant [build.yml](../.github/workflows/build.yml) exécute les tests Node et la compilation web sur les PR. Le job Windows est exclu des événements `pull_request`. Il n'exécute pas tous les scénarios Playwright listés ci-dessus et ne remplace pas une revue visuelle ou un lancement Windows natif.

### Preuve de livraison

Une preuve utile indique la branche/le commit, la commande ou le parcours, l'environnement, le résultat observé et les limites. Distinguer test automatisé, revue visuelle et mesure de performance. Une capture de l'écran réellement testé est plus pertinente qu'une illustration de conception. Utiliser le [modèle de PR](../.github/pull_request_template.md) pour rattacher ces preuves au changement.

## 6. Première application recommandée : terminer une variante vérifiable

À la prochaine intervention sur les manquants, choisir dans le catalogue courant une variante de personnage, d'armure ou d'arme avec un identifiant stable. Ce choix doit dépendre des fichiers et des besoins actuels, pas d'un ancien total de manquants.

1. Relire sa référence d'opus, ses dimensions, directions et animations attendues ; identifier ses dépendances.
2. Produire ou corriger la famille visuelle selon le brief existant, puis vérifier alpha, cadrage, pivot et cohérence des poses.
3. L'intégrer dans l'atelier et sur le terrain, avec les options réellement prises en charge par le renderer.
4. Parcourir **sélection → aperçu → application → combat si pertinent → sauvegarde → reprise** ; essayer aussi l'annulation et une configuration indisponible.
5. Mettre à jour la fiche et l'Excel avec les fichiers, contrôles réussis et réserves restantes. Le statut ne progresse qu'à hauteur des preuves obtenues.

Ce parcours associe les guides `create-game-assets`, `game-ui-ux`, `rpg` et `save-systems` à un résultat concret du jeu. Il donne une unité de travail finissable et vérifiable pour les prochains lots.

## Sources et maintien

Les textes ci-dessus sont une adaptation propre au projet. Les guides upstream restent référencés à une révision précise ; ils ne sont pas installés globalement et aucun script upstream n'est lancé automatiquement. Le [registre](gamedev-sources.json) référence également la politique des versions, la licence Apache-2.0 et le fichier NOTICE. Une future copie des guides doit conserver leurs mentions applicables et leurs fichiers d'accompagnement, puis faire l'objet d'une revue des différences avant mise à jour.

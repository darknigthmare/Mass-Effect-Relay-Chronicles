# Mass Effect — Relay Chronicles

Un RPG de fan en français : **personnages en sprites 2D, décors 3D, groupe de trois et commandes ATB**, dans une mise en scène inspirée des JRPG sur PlayStation.

**Version 0.2.0 : campagne ME1 condensée, 14 assignations, équipement et Shepard femme animée.** Ce dépôt contient le jeu, ses assets, son catalogue de production et son classeur Excel. La reconstitution intégrale de Mass Effect avec fidélité 1:1 reste un objectif de production ; les cartes, dialogues et rencontres actuels sont des adaptations explicitement suivies dans le catalogue.

![Capture réelle du prototype : exploration de la Citadelle](docs/screenshots/citadel.png)

## Jouer

Prérequis : Node.js 22.12+ ou 24, npm, un navigateur récent avec WebGL 2. Le jeu ne demande ni compte ni serveur de données. Les sauvegardes restent sur l’appareil et peuvent être exportées en JSON.

```bash
git clone https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles.git
cd Mass-Effect-Relay-Chronicles
npm ci
npm run dev
```

Ouvrir l’adresse affichée dans le terminal, puis **Nouvelle campagne**. Dans le Normandy, rejoindre le **briefing**, puis choisir **Eden Prime** sur la carte galactique. Les marqueurs se rejoignent aussi au clic.

### Application PC

```bash
npm run desktop
```

Electron ouvre le jeu dans une fenêtre dédiée. **F11** bascule le plein écran. Pour créer un dossier d’application sur sa plateforme :

```bash
npm run package:desktop
```

La commande `package:windows` produit un exécutable portable Windows x64 dans `release/`. Les workflows GitHub construisent également le jeu web et l’application Windows ; leurs résultats se trouvent dans les artefacts des exécutions réussies de l’onglet **[Actions](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions)**. Le [rapport de compilation locale](docs/qa/build-report.json) identifie le build web 0.2.0 et ses sources. Le [binaire local historique](docs/qa/build-v0.1.0-report.json) concerne la version 0.1.0. Le lancement sur Windows reste à vérifier.

### Version de distribution web

```bash
npm run build
npm run preview
```

Le dossier `dist/` contient la version web compilée avec tous les assets locaux. Le servir par HTTP ; le double-clic sur `index.html` n’est pas le mode de lancement prévu. La version Electron charge ces mêmes fichiers localement.

## Commandes

| Action | Commande |
|---|---|
| Se déplacer | ZQSD, WASD ou flèches |
| Courir | Majuscule |
| Interagir | E, bouton à l’écran ou clic sur un marqueur |
| Se rendre à un endroit | Clic sur le sol ; recherche de chemin avec collisions |
| Journal / équipe / équipement | J / C / I |
| Carte locale | M |
| Carte galactique | G au Normandy après le briefing |
| Pause / fermer un menu | Échap |
| Sélectionner un équipier en combat | 1 / 2 / 3 |
| Tir rapide d’un équipier prêt | Espace |
| Pouvoir ou action ciblée | Choisir une commande, puis une cible |

En mode **Attente**, le temps se suspend lorsqu’un allié peut agir. En mode **Actif**, les jauges continuent. La pause arrête aussi les recharges et la chaleur. Les options proposent trois difficultés, le volume, des transitions réduites et du texte agrandi.

## Contenu effectivement présent

- **9 zones 3D**, dont deux états de la Citadelle : Normandy, Eden Prime, Citadelle, Thérum, Féros, Novéria, Virmire, Ilos et Citadelle assiégée.
- **8 étapes de campagne**, **21 rencontres de campagne**, **63 points de mission**, **9 emplacements de conversation conditionnels** au Normandy et **4 contacts des assignations historiques** à la Citadelle, complétés par les marqueurs des nouvelles opérations.
- Shepard et six compagnons permanents possibles, avec Jenkins au départ ; **6 classes** pour Shepard.
- Recrutement, choix de deux compagnons, expérience, niveaux, crédits et calibrations. Inventaire partagé de 150 objets, 48 références achetables, cinq emplacements par personnage et modules avec effets en combat.
- Tirs à chauffe, couverture, pouvoirs biotiques, technologie, attaques organiques, états temporaires et soin.
- Décisions enregistrées pour Féros, la reine rachni, Virmire et le Conseil.
- Journal, 16 entrées de codex à découverte progressive avec recherche, carte galactique, radar, carte locale et sauvegarde avec import/export.
- Conversations avec Nihlus, Joker, Chakwas et les six compagnons, selon leur recrutement, leur survie et les événements connus. Le conseil donné à Garrus est mémorisé et repris dans un échange ultérieur.
- Quatorze assignations : Retour à la maison, Affaire familiale et Le Fan sont conservées ; onze opérations supplémentaires ajoutent 43 étapes à la Citadelle et sur Féros, avec quatre combats annexes. Le journal conserve étapes, choix, conditions et récompenses uniques.
- Atlas HD du commando, d’ennemis, de boss, de PNJ, d’objets et de véhicules ; 16 images de marche pour chaque apparence de Shepard et quatre poses de combat féminines.
- Ambiances et effets générés localement par Web Audio.

Le dossier de Shepard permet de choisir une apparence masculine ou féminine, les trois origines et les trois profils psychologiques. Ces choix sont conservés dans les sauvegardes et consultables depuis la pause ou le commando. Les portraits et sprites suivent l’apparence choisie en exploration et en combat. La variante féminine utilise désormais un cycle de marche dans quatre directions et des poses de visée, pouvoir, impact et hors combat. Les atlas et transitions restent au stade Prototype.

Six emplacements de sauvegarde manuelle sont accessibles depuis le titre et la pause. Chaque emplacement conserve un nom, une date, une zone et l’identité du commandant. Un remplacement ou une suppression demande confirmation. Ces emplacements restent séparés de la sauvegarde automatique ; le chargement et l’enregistrement sont indisponibles en combat.

À la Citadelle, Garrus et Wrex peuvent être recrutés immédiatement ou lors d’un retour après le Conseil. Les preuves de Tali suffisent à obtenir l’audience. Le recrutement ne remplace pas automatiquement le commando sélectionné. Au Normandy, les compagnons disponibles sont stationnés à leur emplacement de conversation ; les mêmes échanges sont accessibles depuis le menu Commando.

Les assignations utilisent des dialogues concis et des cartes condensées ; les variantes et contrôles de persuasion complets restent à reconstituer. Les trois premières conservent leur récompense de 50 XP. Les valeurs des nouvelles opérations et des 48 équipements sont des réglages de l’adaptation ATB. La [note de version 0.2.0](docs/RELEASE_0.2.0.md) détaille les quêtes, leurs délais, les règles de matériel et la migration. Les véhicules servent actuellement de décor. Les autres missions annexes, DLC, romances, dialogues complets et campagnes ME2/ME3 restent à réaliser. Le [suivi de fidélité](docs/FIDELITY.md) distingue les fonctions livrées des références et contenus encore nécessaires.

## Excel et documentation

- **[27 classeurs supplémentaires — univers étendu](docs/universe/README.md)** : ME2, ME3, Andromeda, Infiltrator, Galaxy, les sept romans, les douze comics et collections demandés, Paragon Lost, le dossier d’extrapolation ME4 et les contenus coupés. Chaque classeur contient 28 onglets, ses sources et sa couverture restante.
- **[Télécharger les 27 classeurs en ZIP](docs/universe/outputs/relay-chronicles-20261022/Mass_Effect_Universe_27_Classeurs.zip)**.
- **[Classeur de production — 28 onglets](docs/Mass_Effect_Relay_Chronicles_Production.xlsx)** : décors, mondes, cartes, connexions, personnages, PNJ, ennemis, boss, armes, pouvoirs, movesets, missions, choix, animations, sprites, audio, VFX, interface et QA.
- [Guide et décompte du catalogue](docs/CATALOGUE.md).
- [Catalogue JSON](docs/content-catalog.json), utilisé pour générer le classeur.
- [Conception du jeu et architecture](docs/DESIGN.md).
- [Registre des assets et limites artistiques](docs/ASSETS.md).
- [État de livraison et vérifications](docs/IMPLEMENTATION_STATUS.md).

**Une fiche de production ne signifie pas un élément terminé.** Le classeur sépare le statut du contenu, le statut de l’asset et le niveau de vérification canonique. Les liens vers des fichiers constituent des preuves localisables ; les noms d’assets futurs restent dans une colonne distincte. Une modification directe dans Excel n’est pas automatiquement réimportée dans le JSON.

## Développement et vérification

La configuration de publication web est disponible dans [vercel.json](vercel.json). Voir [relier le dépôt à Vercel](docs/DEPLOYMENT.md) pour l’intégration Git et l’état des accès cloud.

```bash
npm test
npm run build
```

Les 203 tests Node vérifient les règles de combat, l’équipement, les opérations, les sauvegardes, la progression et le cycle audio. Les tests navigateur requièrent Playwright et Chromium :

```bash
npx playwright install chromium
npm run dev
# Dans un autre terminal :
npm run test:browser
npm run test:campaign
npm run test:world
npm run test:commander
npm run test:saves
npm run test:story
npm run test:assignments
npm run test:operations
npm run test:loadout
```

Variables facultatives : `GAME_URL` pour changer le serveur testé, `PLAYWRIGHT_EXECUTABLE_PATH` pour un Chromium existant. `RELAY_QA=1` coupe le rechargement automatique du serveur pendant un parcours. Les tests de campagne accélèrent le temps simulé ; ils ne remplacent pas les dégâts, les statistiques ou les conditions de progression. Les captures et rapports sont écrits dans `test-results/`.

Après `npm run build`, `node scripts/production-v02-browser.mjs` vérifie les ressources et la reprise du build sous URLs locales dans Chromium. `node scripts/femshep-poses-browser.mjs` inspecte les quatre poses dans une scène de rendu isolée avec le serveur dev actif. Ces contrôles ne remplacent pas un lancement de l’exécutable Windows.

`npm run test:assignments -- --late-conrad` vérifie le premier contact avec Conrad après deux missions et l’attente d’une nouvelle mission, y compris après rechargement.

`npm run audit:fidelity` produit dans `test-results/fidelity-report.json` la liste des fiches restantes du classeur principal, leurs critères et leurs preuves locales. Ajouter `-- --include-universe` pour inclure les 27 catalogues supplémentaires. Cet audit ne modifie aucun statut et ne certifie pas la fidélité canonique.

Le classeur livré est directement ouvrable dans un tableur. Sa régénération avec `npm run workbook` requiert le runtime `@oai/artifact-tool` et sa variable `CODEX_PRIMARY_RUNTIME_NODE_MODULES` ; cette dépendance d’édition n’est pas nécessaire pour jouer ou compiler le jeu.

## Structure

| Chemin | Responsabilité |
|---|---|
| `src/main.js` | Écrans, dialogues, transitions et orchestration |
| `src/world.js` | Rendu Three.js, navigation, collisions, sprites et VFX |
| `src/world-data.js` | Zones et points d’intérêt |
| `src/combat.js` | Simulation ATB indépendante du rendu |
| `src/state.js` | Progression, achats, recrutement et validation des sauvegardes |
| `src/story.js` | Conversations, découvertes du codex et historique narratif sauvegardé |
| `src/story-data.js` | Sujets de conversation réécrits et entrées conditionnelles du codex |
| `src/assignments.js` | Assignations, étapes, issues, récompenses uniques et validation des sauvegardes |
| `src/assignment-data.js` | Contacts et dialogues condensés des trois assignations de la Citadelle |
| `src/operations.js` / `src/operation-data.js` | Onze opérations supplémentaires, 43 étapes, quatre combats et validation persistante |
| `src/loadout.js` / `src/loadout-ui.js` | Inventaire, boutiques, compatibilité, effets de matériel et comparaisons |
| `src/local-map.js` | Carte numérotée avec filtres et suivi |
| `src/game-data.js` | Classes, personnages, rencontres, calibrations et codex |
| `src/audio.js` | Audio procédural local |
| `public/assets/` | Images et manifestes des atlas |
| `desktop/` | Application Electron |
| `docs/` | Excel, catalogue, conception, preuves et captures |

## Crédits

Projet de fan indépendant réalisé pour Darknigthmare. Univers, noms et personnages Mass Effect : BioWare / Electronic Arts. Les dialogues, chiffres d’équilibrage, arrangements de cartes et système ATB de ce prototype sont des adaptations. Les images ont été générées pour ce projet et demandent encore un contrôle artistique contre les références de ME1. Aucun statut « fidélité 1:1 validée » n’est revendiqué pour ces atlas.

# Mass Effect — Relay Chronicles

Un RPG de fan en français : **personnages en sprites 2D, décors 3D, groupe de trois et commandes ATB**, dans une mise en scène inspirée des JRPG sur PlayStation.

**Version 0.1.0 : campagne ME1 condensée jouable du départ du Normandy à la confrontation finale.** Ce dépôt contient le jeu, ses assets, son catalogue de production et son classeur Excel. La reconstitution intégrale de Mass Effect avec fidélité 1:1 reste un objectif de production ; les cartes, dialogues et rencontres actuels sont des adaptations explicitement suivies dans le catalogue.

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

La commande `package:windows` produit un exécutable portable Windows x64 dans `release/`. Les workflows GitHub construisent également le jeu web et l’application Windows ; leurs résultats se trouvent dans les artefacts des exécutions réussies de l’onglet **[Actions](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions)**. Le [rapport de compilation locale](docs/qa/build-report.json) identifie le paquet fourni et ses sources. Ce binaire a été construit depuis Linux ; son lancement sur Windows reste à vérifier.

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
- **8 étapes de campagne**, **21 rencontres** et **63 points d’intérêt**.
- Shepard et six compagnons permanents possibles, avec Jenkins au départ ; **6 classes** pour Shepard.
- Recrutement, choix de deux compagnons, expérience, niveaux, crédits et améliorations.
- Tirs à chauffe, couverture, pouvoirs biotiques, technologie, attaques organiques, états temporaires et soin.
- Décisions enregistrées pour Féros, la reine rachni, Virmire et le Conseil.
- Journal, 12 entrées de codex, carte galactique, radar, carte locale et sauvegarde avec import/export.
- Atlas HD du commando, d’ennemis, de boss, de PNJ, d’objets et de véhicules ; animation expérimentale de marche de Shepard.
- Ambiances et effets générés localement par Web Audio.

Les véhicules servent actuellement de décor. L’apparence féminine de Shepard dispose d’une illustration dans l’atlas PNJ, mais la sélection de cette apparence n’est pas encore implémentée. Les missions annexes, DLC, romances, dialogues complets et campagnes ME2/ME3 sont documentés pour la production et ne sont pas jouables dans cette version.

## Excel et documentation

- **[Classeur de production — 28 onglets](docs/Mass_Effect_Relay_Chronicles_Production.xlsx)** : décors, mondes, cartes, connexions, personnages, PNJ, ennemis, boss, armes, pouvoirs, movesets, missions, choix, animations, sprites, audio, VFX, interface et QA.
- [Guide et décompte du catalogue](docs/CATALOGUE.md).
- [Catalogue JSON](docs/content-catalog.json), utilisé pour générer le classeur.
- [Conception du jeu et architecture](docs/DESIGN.md).
- [Registre des assets et limites artistiques](docs/ASSETS.md).
- [État de livraison et vérifications](docs/IMPLEMENTATION_STATUS.md).

**Une fiche de production ne signifie pas un élément terminé.** Le classeur sépare le statut du contenu, le statut de l’asset et le niveau de vérification canonique. Les liens vers des fichiers constituent des preuves localisables ; les noms d’assets futurs restent dans une colonne distincte. Une modification directe dans Excel n’est pas automatiquement réimportée dans le JSON.

## Développement et vérification

```bash
npm test
npm run build
```

Les tests Node vérifient les règles de combat, les sauvegardes, la progression et le cycle audio. Les tests navigateur requièrent Playwright et Chromium :

```bash
npx playwright install chromium
npm run dev
# Dans un autre terminal :
npm run test:browser
npm run test:campaign
npm run test:world
```

Variables facultatives : `GAME_URL` pour changer le serveur testé, `PLAYWRIGHT_EXECUTABLE_PATH` pour un Chromium existant. `RELAY_QA=1` coupe le rechargement automatique du serveur pendant un parcours. Les tests de campagne accélèrent le temps simulé ; ils ne remplacent pas les dégâts, les statistiques ou les conditions de progression. Les captures et rapports sont écrits dans `test-results/`.

Le classeur livré est directement ouvrable dans un tableur. Sa régénération avec `npm run workbook` requiert le runtime `@oai/artifact-tool` et sa variable `CODEX_PRIMARY_RUNTIME_NODE_MODULES` ; cette dépendance d’édition n’est pas nécessaire pour jouer ou compiler le jeu.

## Structure

| Chemin | Responsabilité |
|---|---|
| `src/main.js` | Écrans, dialogues, transitions et orchestration |
| `src/world.js` | Rendu Three.js, navigation, collisions, sprites et VFX |
| `src/world-data.js` | Zones et points d’intérêt |
| `src/combat.js` | Simulation ATB indépendante du rendu |
| `src/state.js` | Progression, achats, recrutement et validation des sauvegardes |
| `src/game-data.js` | Classes, personnages, rencontres, équipement et codex |
| `src/audio.js` | Audio procédural local |
| `public/assets/` | Images et manifestes des atlas |
| `desktop/` | Application Electron |
| `docs/` | Excel, catalogue, conception, preuves et captures |

## Crédits

Projet de fan indépendant réalisé pour Darknigthmare. Univers, noms et personnages Mass Effect : BioWare / Electronic Arts. Les dialogues, chiffres d’équilibrage, arrangements de cartes et système ATB de ce prototype sont des adaptations. Les images ont été générées pour ce projet et demandent encore un contrôle artistique contre les références de ME1. Aucun statut « fidélité 1:1 validée » n’est revendiqué pour ces atlas.

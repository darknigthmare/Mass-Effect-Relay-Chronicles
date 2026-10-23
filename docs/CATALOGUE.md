# Catalogue de production — Mass Effect Relay Chronicles

Mise à jour : **2026-10-23** · Version 0.1.0

Ce catalogue contient **1 203 fiches**, organisées en **26 catégories** et **28 onglets Excel**. Il décrit un plan de couverture du premier Mass Effect, puis une extension séparée vers ME2 et ME3. Le nombre de fiches mesure le travail suivi ; il ne mesure pas le nombre de fonctionnalités terminées.

- [Classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) : filtres, statuts modifiables, validations de saisie, volets figés et tableaux de comptage recalculés.
- [Données de référence du catalogue](content-catalog.json) : identifiants stables, dépendances, références, chemins et critères d’acceptation.
- [Générateur du classeur et de cette page](../scripts/build-workbook.mjs).
- [Aperçu du tableau de bord](workbook-previews/Dashboard.png) · [Vérification des formules](workbook-previews/verification.json) · [Contrôle du fichier exporté](workbook-previews/native-export-check.json).

## État réel

| Statut du contenu | Fiches | Signification |
| --- | ---: | --- |
| Défini | 1 070 | Élément décrit, non vérifié dans le jeu. |
| Prototype | 131 | Présent sous une forme simplifiée à reprendre. |
| Intégré | 0 | Présent dans le jeu avec chemin et dépendances vérifiés. |
| Validé | 2 | Intégré et contrôlé avec preuve de test. |

Un statut de contenu et un statut d’asset décrivent deux choses distinctes. Une image peut être au stade **Prototype** alors que le dialogue, la mission ou la conduite correspondante reste **Défini**. Les éventuelles fiches **Validé** attestent leurs critères fonctionnels documentés ; elles ne certifient pas la fidélité 1:1 de l’ensemble du jeu.

| Niveau de canon | Fiches | Signification |
| --- | ---: | --- |
| Confirmé | 15 | Existence ou règle vérifiée dans la source indiquée. Cela ne valide pas un asset. |
| Référence à vérifier | 532 | Nom, rôle, apparence ou conditions à recouper avant production finale. |
| Adaptation | 656 | Règle, découpage ou livrable original de ce fan game. |

Le périmètre comprend **1 146 fiches ME1**, **33 fiches ME2** et **24 fiches ME3**. Les deux épisodes suivants restent une extension de production. Un élément canonique confirmé ne signifie pas que sa représentation graphique ou ses mécaniques sont fidèles.

## Couverture du prototype

Les preuves locales se trouvent dans [world-data.js](../src/world-data.js), [world.js](../src/world.js), [game-data.js](../src/game-data.js) et [combat.js](../src/combat.js).

| Domaine | Ce qui est représenté | Limite de couverture |
| --- | --- | --- |
| Exploration | 9 zones jouables condensées : Normandy, Eden Prime, Citadelle, Thérum, Feros, Noveria, Virmire, Ilos et Citadelle assiégée | 8 destinations distinctes ; la Citadelle revient sous deux états. Les 100 sous-zones et 91 liaisons du catalogue restent un plan à produire. |
| Personnages | 8 identités dans les données : Shepard, Ashley, Kaidan, Jenkins, Garrus, Tali, Wrex et Liara | Ce nombre inclut Shepard et Jenkins ; il ne désigne pas huit compagnons permanents. Poses et costumes définitifs non validés. |
| Dossier Shepard | Apparence masculine/féminine, trois origines et trois profils psychologiques, conservés après reprise et import | Portrait et sprite cohérents ; variante féminine statique. Réactions narratives aux antécédents, créateur facial et costumes définitifs restent à produire. |
| Combat | 21 rencontres condensées et commandes ATB | Adaptation de conception ; elle ne reproduit pas les combats originaux à l’identique. Les étapes narratives du catalogue sont distinctes de ces rencontres. |
| Codex | 12 entrées de lecture dans le jeu | Ne représente pas le codex complet de Mass Effect. |
| Boss | Images de Saren, Bénézia, Thorien et Saren final | Quatre poses de prototype. Mise en scène, variantes et animations complètes à produire. |
| PNJ | Anderson, Joker, Chakwas, Udina et Kirrahe placés ; Nihlus et Emily présents dans l’atlas | Les deux derniers ne sont pas déclarés placés. L’image de Joker est debout ; sa pose assise reste à produire. |
| Véhicules | Mako et Sovereign placés comme décor ; illustrations de Normandy SR-1 et d’une armature geth | Aucune conduite, aucun tir depuis un véhicule, aucun pilotage spatial. L’armature illustrée n’est pas un ennemi spécifique jouable à ce stade. |
| Animation | Première planche de marche de Shepard : 16 images pour 4 directions, au stade Prototype | Face et dos en trois-quarts, profils latéraux, cycle à nettoyer et mapping UV spécifique. Huit directions et bibliothèque d’actions complètes non validées. Une fiche de marche est Prototype ; les 39 autres fiches d’animation restent Définies. |

### Images existantes

| Fichier | Contenu observable ou rôle de prototype | Statut |
| --- | --- | --- |
| [crew-atlas.png](../public/assets/crew-atlas.png) | 8 poses alliées ; portraits, combat et repli statique du terrain | Prototype |
| [enemy-atlas.png](../public/assets/enemy-atlas.png) | 8 silhouettes ennemies de prototype | Prototype |
| [boss-atlas.png](../public/assets/boss-atlas.png) | 4 poses de boss ; aucune planche animée complète | Prototype |
| [npc-atlas.png](../public/assets/npc-atlas.png) | 8 poses dont Shepard féminin et 7 PNJ ; 5 PNJ placés | Prototype |
| [vehicle-atlas.png](../public/assets/vehicle-atlas.png) | 4 silhouettes de véhicules ou grande machine ; 2 placements décoratifs | Prototype |
| [props-atlas.png](../public/assets/props-atlas.png) | Objets illustrés de décor | Prototype |
| [shepard-walk-atlas.png](../public/assets/shepard-walk-atlas.png) | Shepard : 16 images / 4 directions ; cycle de marche à nettoyer, huit directions non validées | Prototype |

Les images générées sont des propositions graphiques. Leur présence sur disque ne prouve ni l’exactitude du costume, ni une animation complète, ni un dialogue achevé. Les fiches de sprites renvoient au même atlas lorsqu’une seule pose sert à plusieurs usages.

## Catégories et comptes

Les compteurs du classeur utilisent les statuts des lignes. Les onglets Dashboard et Guide complètent les 26 catégories ci-dessous.

| Catégorie | Total | Défini | Prototype | Intégré | Validé | Périmètre |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Personnages | 8 | 0 | 8 | 0 | 0 | Shepard, équipiers et identités jouables |
| PNJ | 66 | 61 | 5 | 0 | 0 | Personnages de rencontre et services |
| Espèces et factions | 36 | 29 | 7 | 0 | 0 | Espèces, organisations et règles culturelles |
| Mondes | 32 | 24 | 8 | 0 | 0 | Destinations et identité environnementale |
| Zones | 100 | 100 | 0 | 0 | 0 | Pièces, espaces extérieurs et points de passage |
| Liaisons | 91 | 91 | 0 | 0 | 0 | Continuité spatiale et conditions de passage |
| Décors | 35 | 34 | 1 | 0 | 0 | Architecture, matières et cadrages |
| Props | 52 | 52 | 0 | 0 | 0 | Objets de décor et interactions |
| Ennemis et boss | 35 | 31 | 4 | 0 | 0 | Bestiaire de ME1 et rencontres nommées |
| Missions | 63 | 42 | 21 | 0 | 0 | Étapes de l’intrigue principale |
| Secondaires et DLC | 62 | 62 | 0 | 0 | 0 | Missions annexes et extensions de ME1 |
| Choix et relations | 34 | 34 | 0 | 0 | 0 | Conséquences persistantes et relations |
| Dialogues | 36 | 36 | 0 | 0 | 0 | Situations de dialogue et conditions |
| Cinématiques | 26 | 26 | 0 | 0 | 0 | Séquences et mise en scène |
| Armes | 24 | 24 | 0 | 0 | 0 | Familles, modèles et comportements |
| Armures et équipement | 26 | 26 | 0 | 0 | 0 | Protections, modules et consommables |
| Pouvoirs | 30 | 17 | 13 | 0 | 0 | Capacités canoniques et traduction ATB |
| Movesets alliés | 50 | 50 | 0 | 0 | 0 | Actions et contraintes par équipier |
| Movesets ennemis | 75 | 75 | 0 | 0 | 0 | Télégraphes, actions et réponses tactiques |
| Animations | 40 | 39 | 1 | 0 | 0 | Bibliothèque d’animation pour sprites |
| Sprites | 77 | 42 | 35 | 0 | 0 | Livrables 2D, portraits et variantes |
| VFX | 26 | 26 | 0 | 0 | 0 | Effets visuels et lisibilité |
| Audio | 30 | 30 | 0 | 0 | 0 | Ambiances, effets et musique originale |
| Systèmes et UI | 40 | 10 | 28 | 0 | 2 | Interface et règles de jeu |
| QA | 52 | 52 | 0 | 0 | 0 | Critères de test et contrôles de fidélité |
| Trilogie | 57 | 57 | 0 | 0 | 0 | Extensions ME2 et ME3 séparées de ME1 |
| **Total** | **1 203** | **1 070** | **131** | **0** | **2** | |

## Lire une fiche

Chaque fiche possède un identifiant stable, une catégorie, un épisode, un périmètre, un niveau de canon, deux statuts, une priorité, une description et un critère d’acceptation. Les dépendances utilisent les identifiants des autres fiches.

| Champ | Usage |
| --- | --- |
| `status` | Avancement du contenu décrit. |
| `assetStatus` | Avancement de son illustration, son ou fichier de production. |
| `canonLevel` | Niveau de confirmation de l’information ou indication d’une adaptation. |
| `sourceId`, `sourceUrl`, `reference` | Référence et point à contrôler. Une URL seule n’atteste pas le détail d’une fiche. |
| `plannedPath` | Destination envisagée, qui peut ne pas encore exister. |
| `assetPath` | Preuve locale réellement présente ; selon la fiche, image ou fichier source du prototype. |
| `gameKey` | Clé actuelle dans les données ou le renderer, lorsqu’elle existe. |
| `acceptance` | Condition à satisfaire avant de déclarer le travail abouti. |
| `dependencies` | Prérequis par identifiants. |
| `priority` | P0 : fonctionnement/cohérence ; P1 : complétude ME1 ; P2 : extensions. |
| `notes` | Limites observées, placeholders et contrôles encore nécessaires. |

## Sources et limites de fidélité

La colonne de source donne une référence de travail. Les lignes marquées **Référence à vérifier** demandent encore une comparaison avec le jeu, son codex, des captures identifiées et la version exacte choisie. Certaines pages du guide constituent seulement un point de départ pour retrouver le détail. L’index communautaire est une source secondaire, signalée comme telle.

| Identifiant | Source | Usage et périmètre |
| --- | --- | --- |
| ME1-MANUAL | [Manuel officiel Mass Effect PC FR](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf) | Classes, interface, équipement et pouvoirs ME1 |
| ME2-MANUAL | [Manuel officiel Mass Effect 2 PC FR](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) | Référence des extensions ME2 uniquement |
| EA-GAMEPLAY | [EA Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations) | Différences original / Legendary Edition |
| EA-VISUAL | [EA Visual Improvements](https://www.ea.com/ea-play/news/visual-improvements) | Atmosphères des lieux remasterisés |
| EA-COSPLAY | [EA guides cosplay](https://www.ea.com/games/mass-effect/community/cosplay-guides) | Silhouettes et costumes à classer par épisode |
| BIOWARE-SR1 | [BioWare Normandy SR-1](https://gear.bioware.com/products/mass-effect-normandy-sr-1-pin-set) | Identification du vaisseau ME1 |
| BIOWARE-SR2 | [BioWare Normandy SR-2 Cerberus](https://gear.bioware.com/en-eu/products/mass-effect-cerberus-normandy-sr-2-ship-replica-remaster) | Référence ME2 uniquement |
| PRIMA-PROLOGUE | [Guide officiel Prima, prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) | Prologue ME1, extraits indexés ; PDF complet à contrôler |
| PRIMA-FEROS | [Prima guide Feros](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectre-assignments-noveria-and-feros/feros-assignments) | Missions secondaires de Feros |
| PRIMA-VIRMIRE | [Prima guide Virmire](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectra-assignments-virmire-and-citadel-lockdown/virmire-assignments) | Choix et objectifs de Virmire |
| PRIMA-NORMANDY | [Prima retours au Normandy](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/chapter-4-feros/the-normandy-revisited) | Relations du premier épisode |
| EA-TRILOGY | [EA Legendary Edition](https://www.ea.com/fr/games/mass-effect/mass-effect-legendary-edition) | Périmètre trilogie et continuité des choix |
| SQUAD-INDEX | [Index des équipiers à recouper](https://masseffect.fandom.com/wiki/Squad) | Index secondaire ; capture du jeu requise avant validation |
| PROJECT | Conception Relay Chronicles | Décisions du fan game ; aucune prétention de canon officiel |

La production prend ME1 comme base. La continuité doit distinguer le Normandy SR-1 des vaisseaux ultérieurs, les armes à chauffe des systèmes de cartouches thermiques, et les talents de ME1 des pouvoirs introduits plus tard. Les guides cosplay et les visuels de la trilogie exigent un classement par épisode avant réutilisation. Les références original/Legendary Edition doivent également être identifiées avant une comparaison exacte.

Les dialogues, la topologie complète, les missions secondaires, les DLC, les choix persistants, les romances, les modèles d’armes, les movesets et les séquences cinématiques ne sont pas réputés complets par simple présence d’une fiche. La boucle ATB, le découpage condensé, les sprites et les décors interprétés sont des décisions d’adaptation.

## Mettre à jour le suivi

Modifier les fiches dans [content-catalog.json](content-catalog.json), puis lancer le générateur avec le runtime Node disposant de `@oai/artifact-tool` :

```bash
node scripts/build-workbook.mjs
```

La variable `CODEX_PRIMARY_RUNTIME_NODE_MODULES` doit désigner les modules du runtime d’artefacts. L’option `--render-sheets Dashboard,PNJ,Ennemis_boss,Sprites` limite les aperçus recalculés, tout en reconstruisant le classeur complet et cette page. Les fichiers de vérification donnent le total exporté, le contrôle des formules et la présence des filtres, validations et volets figés.

Les modifications effectuées directement dans Excel recalculent son tableau de bord, mais ne sont pas automatiquement réimportées dans le JSON. Reporter ces décisions dans le catalogue avant de régénérer le classeur.

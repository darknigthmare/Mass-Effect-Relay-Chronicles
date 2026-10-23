# Catalogue de production — Mass Effect Relay Chronicles

Mise à jour : **2026-10-23** · Version 0.2.0

Ce catalogue contient **1 325 fiches**, organisées en **26 catégories** et **28 onglets Excel**. Il décrit un plan de couverture du premier Mass Effect, puis une extension séparée vers ME2 et ME3. Le nombre de fiches mesure le travail suivi ; il ne mesure pas le nombre de fonctionnalités terminées.

- [Classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) : filtres, statuts modifiables, validations de saisie, volets figés et tableaux de comptage recalculés.
- [Données de référence du catalogue](content-catalog.json) : identifiants stables, dépendances, références, chemins et critères d’acceptation.
- [Générateur du classeur et de cette page](../scripts/build-workbook.mjs).
- [Aperçu du tableau de bord](workbook-previews/Dashboard.png) · [Vérification des formules](workbook-previews/verification.json) · [Contrôle du fichier exporté](workbook-previews/native-export-check.json).

## État réel

| Statut du contenu | Fiches | Signification |
| --- | ---: | --- |
| Défini | 1 035 | Élément décrit, non vérifié dans le jeu. |
| Prototype | 284 | Présent sous une forme simplifiée à reprendre. |
| Intégré | 3 | Présent dans le jeu avec chemin et dépendances vérifiés. |
| Validé | 3 | Intégré et contrôlé avec preuve de test. |

Un statut de contenu et un statut d’asset décrivent deux choses distinctes. Une image peut être au stade **Prototype** alors que le dialogue, la mission ou la conduite correspondante reste **Défini**. Les éventuelles fiches **Validé** attestent leurs critères fonctionnels documentés ; elles ne certifient pas la fidélité 1:1 de l’ensemble du jeu.

| Niveau de canon | Fiches | Signification |
| --- | ---: | --- |
| Confirmé | 17 | Existence ou règle vérifiée dans la source indiquée. Cela ne valide pas un asset. |
| Référence à vérifier | 522 | Nom, rôle, apparence ou conditions à recouper avant production finale. |
| Adaptation | 786 | Règle, découpage ou livrable original de ce fan game. |

Le périmètre comprend **1 268 fiches ME1**, **33 fiches ME2** et **24 fiches ME3**. Les deux épisodes suivants restent une extension de production. Un élément canonique confirmé ne signifie pas que sa représentation graphique ou ses mécaniques sont fidèles.

## Couverture du prototype

Les preuves locales se trouvent dans [world-data.js](../src/world-data.js), [world.js](../src/world.js), [game-data.js](../src/game-data.js) et [combat.js](../src/combat.js).

| Domaine | Ce qui est représenté | Limite de couverture |
| --- | --- | --- |
| Exploration | 9 zones jouables condensées : Normandy, Eden Prime, Citadelle, Thérum, Feros, Noveria, Virmire, Ilos et Citadelle assiégée | 8 destinations distinctes ; la Citadelle revient sous deux états. Les 100 sous-zones et 91 liaisons du catalogue restent un plan à produire. |
| Personnages | 8 identités dans les données : Shepard, Ashley, Kaidan, Jenkins, Garrus, Tali, Wrex et Liara | Ce nombre inclut Shepard et Jenkins ; il ne désigne pas huit compagnons permanents. Poses et costumes définitifs non validés. |
| Dossier Shepard | Apparence masculine/féminine, trois origines et trois profils psychologiques, conservés après reprise et import | Portraits et sprites liés à l’apparence ; marche féminine et quatre poses de combat. Réactions narratives complètes aux antécédents, créateur facial et costumes définitifs restent à produire. |
| Combat | 21 rencontres de campagne et 4 rencontres annexes possibles, commandes ATB | Adaptation de conception ; elle ne reproduit pas les combats originaux à l’identique. Les étapes narratives du catalogue sont distinctes de ces rencontres. |
| Codex | 16 entrées à découverte progressive avec recherche | Les entrées dépendant de Liara, Féros, Virmire et Ilos sont conditionnées aux événements connus. Ne représente pas le codex complet de Mass Effect. |
| Boss | Images de Saren, Bénézia, Thorien et Saren final | Quatre poses de prototype. Mise en scène, variantes et animations complètes à produire. |
| PNJ | Anderson, Joker, Chakwas, Udina et Kirrahe placés ; Nihlus présent au Normandy avant Eden Prime ; Emily intervient dans son opération | Les nouveaux contacts utilisent des marqueurs et dialogues, sans sprites de terrain dédiés. L’image de Joker est debout ; sa pose assise reste à produire. Les positions appartiennent aux décors condensés de l’adaptation. |
| Conversations | Neuf interlocuteurs, dix-huit sujets conditionnels au Normandy, avec conseil à Garrus mémorisé | Textes français réécrits, sans doublage. Les dialogues complets, les animations et leur conformité mot à mot restent à produire ou à vérifier. |
| Assignations | 14 quêtes annexes : trois historiques et 11 opérations ajoutées à la Citadelle et Féros, avec 43 nouvelles étapes | Trois assignations historiques et onze opérations supplémentaires. Quatre scans de veilleurs, dialogues réécrits, cartes condensées, quatre combats possibles. Les variantes complètes, les intérieurs et les autres missions secondaires/DLC restent à produire. Les récompenses sont des réglages de l’adaptation. Les lignes d’étapes complètent les fiches de quêtes sans représenter des quêtes supplémentaires. |
| Équipement | 52 articles jouables : 20 armes, 16 armures, 12 modules et 4 outils, achat/vente, comparaison et neuf emplacements par personnage | Inventaire de 150 objets et 20 exemplaires par référence. Formations explicites, restrictions de morphologie, poids, niveau et bio/tech. Modules restitués au retrait de leur pièce. Prix, points et ports fixes adaptés ; l’arme et la tenue dessinées ne changent pas. Voir [complément et sources](research/loadout-extension-sources.md). |
| Véhicules | Mako et Sovereign placés comme décor ; illustrations de Normandy SR-1 et d’une armature geth | Aucune conduite, aucun tir depuis un véhicule, aucun pilotage spatial. L’armature illustrée n’est pas un ennemi spécifique jouable à ce stade. |
| Animation | 32 images de marche pour les deux apparences de Shepard et 4 poses clés de combat féminines, au stade Prototype | 32 frames de marche pour les deux apparences de Shepard, quatre directions chacune ; quatre poses de combat féminines. Raccords, huit directions, variantes par arme et mouvements des compagnons restent à produire. Les contacts féminins 0 et 2 restent proches dans certaines orientations. |

### Images existantes

| Fichier | Contenu observable ou rôle de prototype | Statut |
| --- | --- | --- |
| [crew-atlas.png](../public/assets/crew-atlas.png) | 8 poses alliées ; portraits, combat et repli statique du terrain | Prototype |
| [enemy-atlas.png](../public/assets/enemy-atlas.png) | 8 silhouettes ennemies de prototype | Prototype |
| [boss-atlas.png](../public/assets/boss-atlas.png) | 4 poses de boss ; aucune planche animée complète | Prototype |
| [npc-atlas.png](../public/assets/npc-atlas.png) | 8 poses dont Shepard féminin et 7 PNJ ; 6 PNJ placés, Nihlus seulement avant Eden Prime | Prototype |
| [vehicle-atlas.png](../public/assets/vehicle-atlas.png) | 4 silhouettes de véhicules ou grande machine ; 2 placements décoratifs | Prototype |
| [props-atlas.png](../public/assets/props-atlas.png) | Objets illustrés de décor | Prototype |
| [shepard-walk-atlas.png](../public/assets/shepard-walk-atlas.png) | Shepard : 16 images / 4 directions ; cycle de marche à nettoyer, huit directions non validées | Prototype |
| [shepard-female-walk-atlas.png](../public/assets/shepard-female-walk-atlas.png) | Shepard femme : 16 frames de marche / quatre directions ; cycle à nettoyer | Prototype |
| [shepard-female-combat-atlas.png](../public/assets/shepard-female-combat-atlas.png) | Shepard femme : quatre poses clés aim, power, hit et down ; aucune transition dessinée | Prototype |

Les images générées sont des propositions graphiques. Leur présence sur disque ne prouve ni l’exactitude du costume, ni une animation complète, ni un dialogue achevé. Les fiches de sprites renvoient au même atlas lorsqu’une seule pose sert à plusieurs usages.

## Catégories et comptes

Les compteurs du classeur utilisent les statuts des lignes. Les onglets Dashboard et Guide complètent les 26 catégories ci-dessous.

| Catégorie | Total | Défini | Prototype | Intégré | Validé | Périmètre |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Personnages | 8 | 0 | 8 | 0 | 0 | Shepard, équipiers et identités jouables |
| PNJ | 66 | 56 | 10 | 0 | 0 | Personnages de rencontre et services |
| Espèces et factions | 36 | 29 | 7 | 0 | 0 | Espèces, organisations et règles culturelles |
| Mondes | 32 | 24 | 8 | 0 | 0 | Destinations et identité environnementale |
| Zones | 100 | 100 | 0 | 0 | 0 | Pièces, espaces extérieurs et points de passage |
| Liaisons | 91 | 91 | 0 | 0 | 0 | Continuité spatiale et conditions de passage |
| Décors | 35 | 34 | 1 | 0 | 0 | Architecture, matières et cadrages |
| Props | 52 | 52 | 0 | 0 | 0 | Objets de décor et interactions |
| Ennemis et boss | 39 | 31 | 8 | 0 | 0 | Bestiaire de ME1 et rencontres nommées |
| Missions | 63 | 42 | 21 | 0 | 0 | Étapes de l’intrigue principale |
| Secondaires et DLC | 108 | 51 | 57 | 0 | 0 | Missions annexes et extensions de ME1 |
| Choix et relations | 34 | 31 | 0 | 3 | 0 | Conséquences persistantes et relations |
| Dialogues | 36 | 24 | 12 | 0 | 0 | Situations de dialogue et conditions |
| Cinématiques | 26 | 26 | 0 | 0 | 0 | Séquences et mise en scène |
| Armes | 44 | 24 | 20 | 0 | 0 | Familles, modèles et comportements |
| Armures et équipement | 58 | 24 | 34 | 0 | 0 | Protections, modules et consommables |
| Pouvoirs | 30 | 17 | 13 | 0 | 0 | Capacités canoniques et traduction ATB |
| Movesets alliés | 50 | 50 | 0 | 0 | 0 | Actions et contraintes par équipier |
| Movesets ennemis | 75 | 75 | 0 | 0 | 0 | Télégraphes, actions et réponses tactiques |
| Animations | 60 | 39 | 21 | 0 | 0 | Bibliothèque d’animation pour sprites |
| Sprites | 77 | 42 | 35 | 0 | 0 | Livrables 2D, portraits et variantes |
| VFX | 26 | 26 | 0 | 0 | 0 | Effets visuels et lisibilité |
| Audio | 30 | 30 | 0 | 0 | 0 | Ambiances, effets et musique originale |
| Systèmes et UI | 40 | 8 | 29 | 0 | 3 | Interface et règles de jeu |
| QA | 52 | 52 | 0 | 0 | 0 | Critères de test et contrôles de fidélité |
| Trilogie | 57 | 57 | 0 | 0 | 0 | Extensions ME2 et ME3 séparées de ME1 |
| **Total** | **1 325** | **1 035** | **284** | **3** | **3** | |

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
| ME1-MANUAL | [Manuel officiel Mass Effect PC FR](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf) | Manuel PC FR réellement consulté : familles, formations d’armures et ports/outils pp.20–24 ; existence et règles seulement, pas les chiffres de chaque modèle. Preuve docs/qa/equipment-primary-reference-report.json. |
| ME2-MANUAL | [Manuel officiel Mass Effect 2 PC FR](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) | Référence des extensions ME2 uniquement |
| EA-GAMEPLAY | [EA Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations) | Article officiel réellement consulté : différences de visée, chauffe et spécialisations original/Legendary Edition, sans certification des valeurs des objets. |
| EA-VISUAL | [EA Visual Improvements](https://www.ea.com/ea-play/news/visual-improvements) | Atmosphères des lieux remasterisés |
| EA-COSPLAY | [EA guides cosplay](https://www.ea.com/games/mass-effect/community/cosplay-guides) | Silhouettes et costumes à classer par épisode |
| BIOWARE-SR1 | [BioWare Normandy SR-1](https://gear.bioware.com/products/mass-effect-normandy-sr-1-pin-set) | Identification du vaisseau ME1 |
| BIOWARE-SR2 | [BioWare Normandy SR-2 Cerberus](https://gear.bioware.com/en-eu/products/mass-effect-cerberus-normandy-sr-2-ship-replica-remaster) | Référence ME2 uniquement |
| PRIMA-PROLOGUE | [Guide officiel Prima, prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) | Extrait officiel consulté de 23 pages : prologue/Normandy, chauffe p.64 et port/maîtrise p.65. Ne contient pas les tables de tous les objets. |
| PRIMA-FEROS | [Prima guide Feros](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectre-assignments-noveria-and-feros/feros-assignments) | Missions secondaires de Feros |
| PRIMA-VIRMIRE | [Prima guide Virmire](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectra-assignments-virmire-and-citadel-lockdown/virmire-assignments) | Choix et objectifs de Virmire |
| PRIMA-NORMANDY | [Prima retours au Normandy](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/chapter-4-feros/the-normandy-revisited) | Relations du premier épisode |
| EA-TRILOGY | [EA Legendary Edition](https://www.ea.com/fr/games/mass-effect/mass-effect-legendary-edition) | Périmètre trilogie et continuité des choix |
| SQUAD-INDEX | [Index des équipiers à recouper](https://masseffect.fandom.com/wiki/Squad) | Index secondaire ; capture du jeu requise avant validation |
| PROJECT | Conception Relay Chronicles | Décisions du fan game ; aucune prétention de canon officiel |
| ME1-CITADEL-ASSIGNMENTS | [Assignations de la Citadelle — index secondaire à vérifier](https://masseffect.fandom.com/wiki/Assignments) | Pistes de comparaison pour Homecoming, Family Matter et The Fan. Pages non consultées depuis cet environnement ; contrôle du jeu et de son édition requis. |
| ME1-OP-CITADEL-CONSORT | [Citadelle : La Favorite](https://masseffect.fandom.com/wiki/Citadel%3A_Asari_Consort) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-XELTAN | [Citadelle : La plainte de Xeltan](https://masseffect.fandom.com/wiki/Citadel%3A_Xeltan's_Complaint) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-REPORTERS-REQUEST | [Citadelle : La demande de la journaliste](https://masseffect.fandom.com/wiki/Citadel%3A_Reporter's_Request) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-KEEPERS | [Citadelle : Scanner les veilleurs](https://masseffect.fandom.com/wiki/Citadel%3A_Scan_the_Keepers) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-SIGNAL-TRACKING | [Citadelle : Traque du signal](https://masseffect.fandom.com/wiki/Citadel%3A_Signal_Tracking) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-PRESIDIUM-PROPHET | [Citadelle : Le prédicateur du Présidium](https://masseffect.fandom.com/wiki/Citadel%3A_Presidium_Prophet) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-CITADEL-DOCTOR-MICHEL | [Citadelle : Le docteur Michel](https://masseffect.fandom.com/wiki/Citadel%3A_Doctor_Michel) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-FEROS-WATER | [Féros : Rétablir l’eau](https://masseffect.fandom.com/wiki/Feros%3A_Water_Restoration) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-FEROS-POWER | [Féros : Cellules énergétiques](https://masseffect.fandom.com/wiki/Feros%3A_Power_Cells) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-FEROS-GETH-TUNNELS | [Féros : Les geth dans les tunnels](https://masseffect.fandom.com/wiki/Feros%3A_Geth_in_the_Tunnels) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-OP-FEROS-DATA-RECOVERY | [Féros : Récupération des données](https://masseffect.fandom.com/wiki/Feros%3A_Data_Recovery) | Source communautaire descriptive consultée pour les objectifs. Dialogues, coordonnées et récompenses ATB adaptés. |
| ME1-GEAR-PISTOLS | [ME1 — Pistols](https://masseffect.fandom.com/wiki/Pistols) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-ASSAULT-RIFLES | [ME1 — Assault Rifles](https://masseffect.fandom.com/wiki/Assault_Rifles) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-SHOTGUNS | [ME1 — Shotguns](https://masseffect.fandom.com/wiki/Shotguns) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-SNIPER-RIFLES | [ME1 — Sniper Rifles](https://masseffect.fandom.com/wiki/Sniper_Rifles) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-ONYX-ARMOR | [ME1 — Onyx Armor](https://masseffect.fandom.com/wiki/Onyx_Armor) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-PHOENIX-ARMOR | [ME1 — Phoenix Armor](https://masseffect.fandom.com/wiki/Phoenix_Armor) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-COLOSSUS-ARMOR | [ME1 — Colossus Armor](https://masseffect.fandom.com/wiki/Colossus_Armor) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-H-ARMOR | [ME1 — H Armor](https://masseffect.fandom.com/wiki/Predator_L/M/H_Armor) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-LIBERATOR-ARMOR | [ME1 — Liberator Armor](https://masseffect.fandom.com/wiki/Liberator_Armor) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-WEAPON-UPGRADES | [ME1 — Weapon Upgrades](https://masseffect.fandom.com/wiki/Weapon_Upgrades) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-AMMUNITION-UPGRADES | [ME1 — Ammunition Upgrades](https://masseffect.fandom.com/wiki/Ammunition_Upgrades) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| ME1-GEAR-ARMOR-UPGRADES | [ME1 — Armor Upgrades](https://masseffect.fandom.com/wiki/Armor_Upgrades) | Source communautaire sur noms, fabricants et familles. Valeurs de combat et économie du prototype, sans équivalence statistique 1:1. |
| EA-LE-FEMSHEP | [EA — apparence féminine de Shepard dans Legendary Edition](https://news.ea.com/press-releases/press-releases-details/2021/Relive-the-Award-Winning-Space-Opera-in-Mass-Effect-Legendary-Edition-on-May-14/) | Source primaire du 2 février 2021, consultée le 23 octobre 2026. Confirme la disponibilité du modèle féminin par défaut dans les trois épisodes ; ne valide pas les PNG du projet. |

La production prend ME1 comme base. La continuité doit distinguer le Normandy SR-1 des vaisseaux ultérieurs, les armes à chauffe des systèmes de cartouches thermiques, et les talents de ME1 des pouvoirs introduits plus tard. Les guides cosplay et les visuels de la trilogie exigent un classement par épisode avant réutilisation. Les références original/Legendary Edition doivent également être identifiées avant une comparaison exacte.

Les dialogues, la topologie complète, les missions secondaires, les DLC, les choix persistants, les romances, les modèles d’armes, les movesets et les séquences cinématiques ne sont pas réputés complets par simple présence d’une fiche. La boucle ATB, le découpage condensé, les sprites et les décors interprétés sont des décisions d’adaptation.

## Mettre à jour le suivi

Modifier les fiches dans [content-catalog.json](content-catalog.json), puis lancer le générateur avec le runtime Node disposant de `@oai/artifact-tool` :

```bash
node scripts/build-workbook.mjs
```

La variable `CODEX_PRIMARY_RUNTIME_NODE_MODULES` doit désigner les modules du runtime d’artefacts. L’option `--render-sheets Dashboard,PNJ,Ennemis_boss,Sprites` limite les aperçus recalculés, tout en reconstruisant le classeur complet et cette page. Les fichiers de vérification donnent le total exporté, le contrôle des formules et la présence des filtres, validations et volets figés.

Les modifications effectuées directement dans Excel recalculent son tableau de bord, mais ne sont pas automatiquement réimportées dans le JSON. Reporter ces décisions dans le catalogue avant de régénérer le classeur.

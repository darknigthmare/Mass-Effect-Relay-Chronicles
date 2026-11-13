Le [lot Advance](ADVANCE.md) conserve exactement les **79 fichiers publics**, dont **46 PNG et 33 métadonnées**. Les seize corps civils de Féros réemploient trois silhouettes Horizon nommées et treize corps civils génériques ; ils restent Prototype. Aucun nouveau portrait, costume, cycle, atlas ni statut d’asset n’est déclaré produit.

Le [lot Continuation](CONTINUATION.md) conserve les 46 PNG et les 33 métadonnées publiques. Marches, hauteurs de sol et marqueurs de positions ATB utilisent la géométrie et l’interface ; aucun nouvel atlas, cycle ou statut d’asset n’est revendiqué.

# Assets visuels — registre de livraison

Le [lot Completion](COMPLETION.md) réutilise ces images et ajoute des caisses basses par la géométrie existante du décor, sans nouveau PNG. Les effets réglables, poses de couverture et signatures des Chroniques ne produisent ni nouveau costume, ni cycle d’animation original. Les fermetures fonctionnelles de son catalogue ne changent aucun statut d’asset.

Le [lot P0/P1 de gameplay](PRIORITY_GAMEPLAY.md) conserve les **46 PNG et les 84 poses fixes de combat**. Les nouvelles phases réutilisent les corps et poses existants ; elles n’ajoutent ni découpe anatomique des nœuds du Thorien, ni nouvelle tenue, direction ou animation originale. Les fonctions, interfaces et règles sont suivies comme logiciel dans le catalogue ; aucun nouveau dessin n’est déclaré produit.

Les images de `public/assets/` sont incluses dans la compilation. Le jeu ne dépend d’aucun CDN pour afficher ses sprites. Les atlas ont été générés pour ce projet, puis inspectés et reliés aux régions utilisées par le renderer. **Ils restent des assets de prototype : la fidélité 1:1 aux épisodes concernés n’est pas certifiée.**

## Images livrées

| Fichier | Dimensions | Contenu | Usage actuel |
|---|---|---|---|
| `citadel-keyart.png` | 1672 × 940 | Vue conceptuelle de la Citadelle | Fond de l’écran titre |
| `crew-atlas.png` | 1536 × 1024 | 8 personnages, grille 4 × 2 | Exploration, combat, portraits, équipe |
| `enemy-atlas.png` | 1536 × 1024 | 8 silhouettes ennemies, grille 4 × 2 | Exploration et combat |
| `boss-atlas.png` | 1024 × 1536 | 4 boss, grille 2 × 2 | Repli pendant le chargement des poses dédiées |
| `npc-atlas.png` | 1536 × 1024 | 8 personnages, grille 4 × 2 | PNJ placés et portraits ; certaines images encore en réserve |
| `props-atlas.png` | 1536 × 1024 | 16 objets, grille 4 × 4 | Habillage 2D des décors 3D |
| `vehicle-atlas.png` | 1312 × 1199 | 4 véhicules / machines ; régions irrégulières | Mako décoratif à Ilos, repli visuel à Thérum et Sovereign distant |
| `shepard-walk-atlas.png` | 1269 × 1240 | 16 poses, quatre directions | Marche de Shepard masculin |
| `shepard-male-combat-atlas.png` | 1536 × 1024 | Visée, pouvoir, impact, hors combat | Combat masculin et aperçu de l’atelier |
| `shepard-female-walk-atlas.png` | 1254 × 1254 | 16 poses, quatre directions | Marche féminine, création, dossier et équipement |
| `shepard-female-combat-atlas.png` | 1536 × 1024 | Visée, pouvoir, impact, hors combat | Poses de combat féminines |
| `chronicle-portraits-me2-me3.png` | 1536 × 1024 | Trois bustes : Miranda ME2, Thane ME2, Garrus ME3 | Portraits de prototype dans leurs contextes Chroniques autorisés |
| `arsenal-people.png` | 1536 × 1024 | Quatre bustes de personnages et deux de PNJ | Identités et usages Chroniques autorisés ; PNJ documentaires |
| `arsenal-opponents.png` | 1536 × 1024 | Six silhouettes d’adversaires, dont deux boss | Références et portraits de combat dans leurs seuls bancs autorisés |
| `arsenal-equipment.png` | 1536 × 1024 | Deux armes, deux costumes et deux modules | Illustrations fixes des dossiers et préparations compatibles |
| `arsenal-fleet.png` | 1536 × 1024 | Trois véhicules et trois vaisseaux | Références documentaires uniquement, sans pilotage |
| `companion-ashley-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat d’Ashley ME1 |
| `companion-kaidan-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat de Kaidan ME1 |
| `companion-garrus-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat de Garrus ME1 |
| `companion-tali-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat de Tali ME1 |
| `companion-wrex-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat de Wrex ME1 |
| `companion-liara-combat.png` | 1536 × 1024 | Visée, action, impact, hors combat | Combat de Liara ME1 |
| `enemy-geth-combat.png` | 1536 × 1024 | Quatre poses fixes | Soldat geth ME1 en combat |
| `enemy-geth-sniper-combat.png` | 1536 × 1024 | Quatre poses fixes | Sniper geth ME1 en combat |
| `enemy-geth-destroyer-combat.png` | 1536 × 1024 | Quatre poses fixes | Destructeur geth ME1 en combat |
| `enemy-husk-combat.png` | 1536 × 1024 | Quatre poses fixes | Husk ME1 en combat |
| `joker-seated.png` | 1536 × 1024 | Deux dessins assis | Idle au cockpit ; pilot produit sans cycle animé |
| `enemy-krogan-combat.png` | 1536 × 1024 | Quatre poses fixes | Krogan ME1 en combat |
| `enemy-rachni-combat.png` | 1536 × 1024 | Quatre poses fixes | Soldat rachni ME1 en combat |
| `eden-ground-grass.png` | 1254 × 1254 | Texture RGB opaque | Prairie sur géométrie 3D d’Eden Prime |
| `eden-ground-dirt.png` | 1254 × 1254 | Texture RGB opaque | Terre et passages d’Eden Prime |
| `companion-jenkins-combat.png` | 1536 × 1024 | Quatre poses fixes | Jenkins au prologue ME1 |
| `enemy-creeper-combat.png` | 1536 × 1024 | Quatre poses fixes | Creeper du Thorien ME1 |
| `enemy-asari-combat.png` | 1536 × 1024 | Quatre poses fixes | Commando asari générique ME1 |
| `frontier-npcs.png` | 1536 × 1024 | Sept corps fixes de PNJ | Conversations et présence ME1 à bord du Normandy et à Novéria |
| `frontier-enemies.png` | 1536 × 1024 | Huit corps fixes | Nouveaux types dans six formations ME1 existantes |
| `boss-saren-combat.png` | 1536 × 1024 | Quatre poses fixes | Saren à Virmire |
| `boss-benezia-combat.png` | 1536 × 1024 | Quatre poses fixes | Bénézia à Novéria |
| `boss-thorian-combat.png` | 1536 × 1024 | Quatre poses fixes | Thorien à Féros |
| `boss-saren-final-combat.png` | 1536 × 1024 | Quatre poses fixes | Forme synthétique du final |
| `vehicle-mako-directions.png` | 1536 × 1024 | Quatre directions fixes | Prototype de conduite à Thérum |
| `horizon-npcs.png` | 1536 × 1024 | Huit corps fixes de PNJ | Féros et Citadelle, présence conditionnelle |
| `horizon-enemies.png` | 1536 × 1024 | Cinq corps fixes | Six formations ME1, dont l’identité du maître de guerre à Thérum |
| `horizon-fleet-me1.png` | 1536 × 1024 | Quatre illustrations de coques | Dossiers et projections de reconnaissance ME1 |
| `horizon-fleet-later.png` | 1536 × 1024 | Quatre coques / variantes de livrée | Dossiers éligibles ME2, ME3 et Andromeda |
| `horizon-fauna.png` | 1536 × 1024 | Huit corps fixes | Varrens et gasbag ME1 ; autres usages documentaires limités par contexte |

Les **46 PNG courants** conservent les 41 précédents et ajoutent les cinq atlas Horizon, soit **29 dessins fixes** : huit PNJ, cinq adversaires, huit corps de faune et huit coques ou variantes. Le nombre de **poses clés de combat reste 84** : huit Shepard, 28 compagnons, 32 ennemis précédents et seize boss. Les nouvelles images fixes ne sont pas des familles de quatre poses. Les quatre directions du Mako, deux dessins assis de Joker et textures de sol restent comptés séparément. Une même espèce ou coque sous plusieurs variantes n’est pas comptée comme autant d’identités complètes.

## Ordre des régions

Les grilles sont lues de gauche à droite, puis de haut en bas. Les coordonnées de la première ligne correspondent au haut de l’image ; les UV Three.js inversent l’axe vertical.

| Atlas | Première ligne | Deuxième ligne |
|---|---|---|
| Commando | Shepard masculin, Ashley, Kaidan, Jenkins | Garrus, Tali, Wrex, Liara |
| Ennemis | Soldat geth, zombie, tireur geth, destructeur geth | Krogan, rachni, rampant, commando asari |
| Boss | Saren, Bénézia | Thorien, Saren synthétique |
| PNJ | Shepard féminine, Anderson, Joker, Chakwas | Nihlus, Udina, Kirrahe, Emily Wong |
| Véhicules | Normandy SR-1, Mako | Armature geth, Sovereign |

Props, quatre lignes :

1. Caisse, terminal, réserve médicale, couverture.
2. Casier, encadrement de porte, générateur, console holographique orange.
3. Banc, lampe, jardinière, borne d’information.
4. Module agricole, débris de Féros, conteneur de Novéria, console d’Ilos.

### Marche de Shepard

La planche est exploitable avec des rectangles personnalisés, car l’image générée n’est pas une grille parfaitement régulière. Les abscisses de départ sont **45, 345, 645 et 945 pixels**, pour une largeur de **300 pixels**. Les rangées sont :

| Direction | Début Y | Fin Y |
|---|---:|---:|
| Avant, en trois-quarts | 0 | 315 |
| Arrière, en trois-quarts | 315 | 621 |
| Profil vers la droite | 621 | 920 |
| Profil vers la gauche | 920 | 1240 |

Le renderer retire une marge d’un pixel sur chaque côté, adapte les proportions du plan et revient à la pose de repos à l’arrêt. Il utilise huit images par seconde pour la marche et accélère le cycle pendant la course. Les quatre poses ne constituent pas encore une animation nettoyée à la main : l’ancrage, le costume et les transitions doivent être affinés.

### Véhicules

La planche véhicules ne doit pas être découpée en quatre quarts réguliers. Dans le renderer :

- Mako : rectangle `(650, 90, 662, 400)` ; le coin inférieur gauche est masqué par la géométrie pour éviter le débordement du nez du Normandy.
- Sovereign : rectangle `(650, 480, 662, 719)`.

Les deux autres images sont livrées comme matériel de production, sans fonction de pilotage ou combat autonome. Le Mako visible est un élément statique avec collision ; il ne peut pas être conduit.

## Intégration et limites

Le complément équipement conserve les dix PNG et les animations de 0.2.0. Il ajoute des tracés distincts pour les quatre familles d’armes et quatre outils fonctionnels, sans nouveau modèle ou atlas de matériel. Changer d’arme ou d’armure ne change pas le costume ni l’arme dessinée sur le sprite ; ces apparences restent à produire et à comparer. Les tracés ne certifient pas la géométrie ou les statistiques de chaque modèle.

Les personnages et objets sont des plans 2D dans un monde 3D. Les accessoires ne remplacent pas la géométrie des bâtiments, sols, coursives, volumes et routes. Les silhouettes conservent un seuil alpha de 0,2 pour limiter les franges de transparence. La taille et les proportions du plan dépendent du type d’atlas, notamment pour les boss.

Shepard dispose d’une animation par images. Les sept compagnons ME1 disposent de quatre poses clés de combat chacun ; leur terrain conserve les poses de base avec transformations procédurales. Les huit familles d’ennemis ordinaires ME1 disposent aussi de quatre poses fixes chacune ; les boss gardent leurs poses de base. Les tirs, impacts, soins, lévitations, couvertures et stases ont des effets visuels, mais ne fournissent pas toutes les animations corporelles finales.

La variante féminine sélectionnable utilise deux atlas propres. Les rectangles et pivots sont décrits dans `shepard-female-animation.json`, puis inclus dans le JavaScript compilé pour fonctionner aussi avec le chargement local d’Electron. La marche garde la dernière direction à l’arrêt, utilise sept images par seconde et accélère pendant la course. En combat, les événements déclenchent les poses de visée, pouvoir et impact ; la pose couchée dispose d’une hauteur et d’un pivot spécifiques. Il s’agit de quatre poses clés, pas de quatre cycles complets.

Les deux nouveaux PNG conservent leur transparence native. Les marges et pivots sont mesurés par frame, sans extraction ou retouche des pixels. Certains contacts du cycle restent proches, les effets de pouvoir sont inclus dans l’illustration et la cohérence de costume demande encore une revue artistique. Voir [la provenance et les limites](research/shepard-female-art.md).

Nihlus est placé au Normandy avant le premier départ sur Eden Prime. Emily Wong possède une interaction de quête ; son image de l’atlas PNJ reste disponible pour une intégration de portrait et son personnage dédié dans le monde reste à produire. Joker utilise désormais le dessin assis idle au poste de pilotage du Normandy. Sa pose debout historique reste dans l’atlas PNJ pour les autres usages ; le second dessin assis pilot ne constitue pas un cycle animé.

## Présentation des Chroniques

Les premiers lots [Chroniques](CHRONICLES.md) conservaient les dix PNG existants. Le lot soutiens ajoutait `chronicle-portraits-me2-me3.png`, avec les trois identités exactes `ME2-CHR-MIRANDA`, `ME2-CHR-THANE` et `ME3-CHR-GARRUS`. Ces trois portraits gardent leur priorité. Aucun portrait de personnage ME1 n’est réemployé pour représenter une autre identité.

L’atlas local est une génération RGBA conservée sans retouche des pixels. Ses trois cellules de 512 × 1024 se lisent de gauche à droite : Miranda ME2, Thane ME2, Garrus ME3. Le [manifeste dédié](../public/assets/chronicle-portraits.json) consigne cadrages, contexte, empreinte et références ; la [note de provenance](research/chronicle-portrait-sources.md) distingue la couverture du manuel ME2 de la petite capture de Garrus dans le manuel ME3. Les contours doux et halos sont conservés. Les détails de visage, cicatrices, reliefs et vêtements sont des interprétations générées, sans certification 1:1.

Le rendu SVG isole chaque cellule pour empêcher l’apparition de fragments du portrait voisin, sans modifier les pixels de l’atlas. La [revue historique](qa/chronicle-portrait-ui-review.json) examine sept captures après correction. Les douze contrôles de production du [lot soutiens](qa/chronicle-support-report.json) chargeaient onze PNG et sept bundles servis. Ces résultats décrivent ce lot historique. Le [contrôle de production arsenal](qa/arsenal-production-report.json) passe désormais 17 contrôles avec quinze PNG et sept bundles servis vérifiés par empreinte ; les quatre nouveaux atlas répondent HTTP 200 avec leurs tailles et SHA attendus.

Ces images fournissent uniquement des têtes et hauts de buste : aucun corps en pied, vue arrière, huit directions, marche ou cycle de combat. Le portrait de Garrus est réservé à son identité ME3, sans substitution dans ME1 ou ME2. Les profils de protagonistes personnalisables gardent leur présentation propre. Les trois portraits ne changent ni recrutement, statistiques, pouvoirs ou conditions de scénario.

Les classes, les trois familles de modules et les 52 pages documentaires restent présentées par les commandes, barres, textes et liens de l’interface. Les **61 fiches de pouvoirs exposées pour 30 commandes** ne correspondent ni à 61 animations ni à 61 VFX livrés. Les trois actions de soutien emploient des symboles et barres d’état de prototype ; leurs entités ciblables ne disposent pas de modèles de drone ou tourelle certifiés. Les quatorze profils d’armes spéciales n’impliquent pas quatorze silhouettes ou animations livrées. Les lectures ne créent aucun portrait ou doublage de roman/comic.

Les mannequins des bancs de personnages, de spécialistes et des six ateliers sont des gabarits originaux. Les six nouveaux bancs d’opposition emploient des profils d’adversaires référencés, dont les mécaniques manquantes restent affichées. Six de ces adversaires disposent d’une illustration partielle ; les autres gardent la convention symbolique. Les effets, projectiles et barres d’état n’établissent aucune conformité visuelle des personnages ou modèles d’armes.

Chaque œuvre demande encore ses costumes, armes dessinées, portraits, silhouettes, décors et animations propres à la période. Une sélection disponible dans un atelier ne livre pas l’asset correspondant. La fidélité artistique et les mouvements par personnage restent des critères distincts de la validation des règles et sauvegardes.

### Quatre atlas arsenal — 26 octobre 2026

Le [manifeste arsenal](../public/assets/arsenal-visuals.json) décrit **24 entrées**, quatre fichiers RGBA de 1536 × 1024 et leurs empreintes. Les sorties de génération sont copiées sans retouche de pixels ; la disposition des adversaires a été corrigée par une nouvelle génération. Toutes les entrées portent `partial: true` et `primaryVisualVerified: false`, et le manifeste conserve `globalFidelityCertified: false`.

| Atlas | Ligne haute, de gauche à droite | Ligne basse, de gauche à droite |
|---|---|---|
| Personnages et PNJ | Mordin ME2, Tali ME2, Legion ME2 | Samara ME2, Aria ME2, Traynor ME3 |
| Adversaires | LOKI ME2, YMIR ME2, Praetorian ME2 | Kai Leng ME3, Brute ME3, Banshee ME3 |
| Équipement | Vindicator ME3, Arc ME3, Inferno ME2 | Terminus ME3, canon ME3, chargeur ME3 |
| Flotte | Mako ME1, Nomad Andromeda, Hammerhead ME2 | Normandy SR-1 ME1, Normandy SR-2 ME2, Tempest Andromeda |

Aria et Traynor sont ici des références de PNJ, sans portrait de groupe ou de combat induit. Les six images de flotte restent documentaires : elles n’ajoutent ni pilotage, ni combat de véhicule ou de vaisseau. Les références ME1 `REF-VEH-M35-MAKO-ME1` et `REF-SHP-NORMANDY-SR1-ME1` sont deux nouvelles fiches étroites fondées sur le manuel Xbox 360 ; les anciens alias d’adaptation restent fermés. La présence d’un visuel ne donne ni statistiques, ni pouvoir, ni recrutement.

L’affichage vérifie l’identifiant de fiche, l’œuvre et le segment exacts. Pour les usages de groupe et de combat, il vérifie aussi le scénario et son personnage ou adversaire autorisé. Les protagonistes personnalisables conservent leur présentation propre ; l’apparence de Shepard n’est pas appliquée aux autres profils. Les soutiens et les profils sans image gardent leurs symboles.

L’atlas d’équipement possède **six rectangles irréguliers**, mesurés en pixels depuis le coin supérieur gauche :

| Entrée | Rectangle `[x, y, largeur, hauteur]` |
|---|---|
| Vindicator | `[0, 0, 620, 500]` |
| Arc | `[620, 0, 404, 512]` |
| Inferno | `[1024, 0, 512, 540]` |
| Terminus | `[0, 508, 512, 516]` |
| Canon | `[512, 540, 512, 484]` |
| Chargeur | `[1024, 540, 512, 484]` |

Les dix-huit cellules des trois autres atlas mesurent 512 × 512. Le découpage SVG utilise ces régions exactes, sans supposer une grille régulière pour l’équipement.

| Fichier | SHA-256 |
|---|---|
| `arsenal-people.png` | `c91d0ee166f9c507e2c73271487120ee6c023c208e702270b156cdf4219211b3` |
| `arsenal-opponents.png` | `03380d759702f0983ea4c318a9fc49ac75d8a789184136f5ad3e63d59d3b3147` |
| `arsenal-equipment.png` | `2337a454628749d2fb42bc3de1956e49e787441d354dab01881376e835355714` |
| `arsenal-fleet.png` | `efc36f55e59f18ecd8b43649299f19e057e4b94e7d0ce11631ab25dd516b2dd5` |

Les [manuels inspectés et leurs limites](research/arsenal-visual-sources.md) ne fournissent pas une référence primaire complète pour chaque cellule. Les visages, silhouettes, costumes, reliefs, proportions et géométries générés restent à contrôler. Ces images fixes ne livrent ni modèle complet, animation, vue arrière, huit directions ou apparence interchangeable d’équipement. Le [parcours arsenal](qa/arsenal-browser-report.json) vérifie les 24 visuels et leurs restrictions. La [revue ciblée de l’interface](qa/arsenal-ui-visual-review.json) et la [revue des images générées](qa/arsenal-generated-art-review.json) distinguent lisibilité, cadrages et conformité canonique non certifiée. Les 17 contrôles de production HTTP chargent les quinze PNG et les sept bundles de cette version ; aucun résultat historique n’est réutilisé comme preuve actuelle. Ces contrôles Linux Chromium ne certifient ni rendu mobile, ni exécutable Windows, ni modèle ou kit original.

## Poses de combat masculines — 29 octobre 2026

Le nouvel atlas conserve l’identité visuelle N7 de l’atlas de marche masculin. Ses quatre rectangles irréguliers, pivots et hauteurs sont définis dans `shepard-male-animation.json` et repris par le manifeste. Le sprite de repli demeure disponible pendant le chargement. L’atelier affiche les mêmes poses avec un angle trois-quarts fixe et une échelle commune ; la pose couchée reste près du sol. Les régions de tête et leur axe sont partagés avec le traitement des couleurs et du casque, également appliqué aux quatre poses féminines existantes.

Le PNG de génération est copié sans retouche de pixels. Les [références, prompts et limites](research/shepard-male-combat-art.md), le [contrôle de l’alpha et des cadrages](qa/shepard-combat-art-report.json) et le [rapport de livraison](qa/shepard-combat-poses-report.json) documentent ce lot. Les poses restent fixes et le fusil illustré reste générique ; les transitions, vues supplémentaires et variantes exactes d’équipement restent à produire. Les anciens nombres de PNG mentionnés dans les rapports historiques décrivent leur version propre.

## Six compagnons ME1 — 1er novembre 2026

Six PNG natifs de 1536 × 1024 ajoutent **24 poses clés** pour Ashley, Kaidan, Garrus, Tali, Wrex et Liara. Les seize PNG précédents sont conservés. Ce lot portait le manifeste principal à **32 poses clés de combat**, avec les huit de Shepard. Les six familles restent Prototype ; les métriques de personnages et de marche ne sont pas gonflées par ces nouveaux dessins.

Le renderer utilise des rectangles et pivots mesurés pour visée, action, impact et hors combat. Le KO a priorité sur les événements et le retour à la vie revient à la visée. Les identités, sprites, équipes et contextes sont vérifiés : les homonymes ME2/ME3 et les identités falsifiées n’utilisent pas ces atlas. Les textures UV de chaque acteur restent distinctes ; les sprites de terrain et les couleurs/casque de Shepard sont conservés.

Les [références, prompts et limites artistiques](research/companion-combat-art.md), le [contrôle technique des six atlas](qa/companion-combat-art-report.json) et les [preuves de livraison](qa/companion-combat-report.json) délimitent les validations. Les PNG sont copiés sans retouche ; leurs très faibles franges d’alpha restent documentées. Les armes illustrées sont génériques, les transitions et autres directions manquent. Aucun modèle original complet, nouvelle armure équipable, animation intégrale ou fidélité 1:1 n’est certifié par ces 24 poses.

## Ennemis ME1 et Joker assis — 2 novembre 2026

Quatre atlas natifs ajoutent **16 poses fixes** au soldat geth, au sniper geth, au destructeur geth et au husk déjà présents. Une planche distincte produit **deux dessins assis de Joker** : seul `idle` est intégré au poste du Normandy, sans nouvelle animation temporelle. Les 22 PNG historiques restent conservés.

Les rectangles, pivots et hauteurs relatifs sont mesurés. Les contextes étrangers, mauvais identifiants, sprites et équipes n’ouvrent pas ces familles ; un repli garde la pose historique lors du chargement. Les repères primaires sont partiels et les dessins restent Prototype. Les [références et limites](research/me1-enemy-poses-art.md) et les [preuves de livraison](qa/me1-enemy-poses-report.json) séparent génération, contrôle technique, inspection du renderer et parcours public. Aucun nouveau moveset, modèle original complet ou fidélité intégrale 1:1 n’est certifié.

## Eden Prime, krogan et rachni — 2 novembre 2026

Deux atlas natifs ajoutent huit poses fixes aux profils krogan et rachni déjà jouables. Barrière et acide conservent leurs commandes natives ; les images ne donnent aucun nouveau pouvoir. Les dessins dérivent des identités de prototype existantes, sans référence corporelle primaire supplémentaire obtenue pour ces espèces. Les deux premières compositions refusées et les générations retenues sont distinguées dans les notes [krogan](research/eden-immersion-krogan.md) et [rachni](research/eden-immersion-rachni.md).

Les textures de [prairie et terre](research/eden-immersion-terrain-art.md) sont deux PNG RGB opaques natifs, copiés sans retouche. Leur répétition 3 × 3 est inspectée ; de légers motifs et variations de ton restent visibles. Elles habillent les meshes du nouveau parcours d’Eden, sans remplacer les bâtiments ou le relief par une image plate. Les 27 PNG précédents sont conservés. Les [preuves du lot](qa/eden-immersion-report.json) séparent l’art, la navigation, les états des sprites, les parcours publics et la revue Excel. Aucun matériau original, modèle complet, animation intégrale ou fidélité 1:1 n’est certifié.

## Jenkins et deux familles ennemies — 9 novembre 2026

Le lot du 9 novembre ajoute trois atlas natifs de quatre poses : [Jenkins](research/me1-prologue-enemies-jenkins.md), [creeper du Thorien](research/me1-prologue-enemies-creeper.md) et [commando asari générique](research/me1-prologue-enemies-asari.md). Les PNG restent des copies sans retouche ; rectangles, pivots et hauteurs sont mesurés. Leurs aperçus natifs, états dans le renderer et commandes publiques sont distingués dans les [preuves du lot](qa/me1-prologue-enemies-report.json). Les 31 PNG précédents restent inchangés.

Jenkins conserve l’armure Alliance casquée de la silhouette de prototype, sans marque N7 ni biotique ajoutée. Son geste d’action accompagne notamment la couverture déjà disponible et sa pose couchée représente le KO de combat ; sa perte narrative ferme sa disponibilité. Les deux nouvelles familles ennemies conservent leurs attaques organiques ou biotiques natives. L’asari générique ne réalise pas le clone du Thorien ni ses phases. Les armes dessinées, détails anatomiques, costumes, cycles et directions restent à comparer aux références originales.

## Horizon : corps, faune et coques

Les [références et limites du lot](HORIZON.md) distinguent les nouveaux corps de leurs usages. Les PNG sont des copies natives sans retouche ; alpha, gouttières, rectangles, pieds et cadrages ont des contrôles séparés. Les dossiers et portraits utilisent un viewport SVG interne pour empêcher l’apparition d’une cellule voisine dans les marges.

Le manuel officiel fournit une référence de silhouette au Normandy SR-1. Le Prima documente l’alpha varren et les créatures dociles d’Eden ; le nom « gasbag » n’est pas écrit dans ce dernier passage. Anatomies, tenues et coques restent des interprétations partielles. Les illustrations des autres médias ne forcent pas l’accès à leurs fiches, ne créent pas d’adoption et ne placent pas un animal ou vaisseau hors de sa période.

## Critères d’acceptation de l’art final

Chaque asset devra être confronté à des références approuvées de l’épisode choisi : silhouette, visage, nombre et forme des appendices, armure, motifs, couleurs, accessoires, époque et poses. Les variantes doivent conserver la même identité. Les frames doivent respecter une origine et un pied d’ancrage constants, sans morceaux des cellules voisines ni variation de taille involontaire.

Pour les décors, la conformité implique également la géographie, les accès, proportions, silhouettes de bâtiments, objets fonctionnels et lignes de vue. Les neuf scènes présentes sont des compositions de prototype, sans validation topographique 1:1.

Le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) détaille les sprites, animations et vérifications attendus. Le [manifeste JSON](../public/assets/manifest.json) consigne dimensions, régions et empreintes des fichiers présents. Les briefs de génération sont conservés dans [ART_BRIEFS.md](ART_BRIEFS.md).

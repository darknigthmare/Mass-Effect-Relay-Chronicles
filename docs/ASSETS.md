# Assets visuels — registre de livraison

Les images de `public/assets/` sont incluses dans la compilation. Le jeu ne dépend d’aucun CDN pour afficher ses sprites. Les atlas ont été générés pour ce projet, puis inspectés et reliés aux régions utilisées par le renderer. **Ils restent des assets de prototype : la fidélité 1:1 aux épisodes concernés n’est pas certifiée.**

## Images livrées

| Fichier | Dimensions | Contenu | Usage actuel |
|---|---|---|---|
| `citadel-keyart.png` | 1672 × 940 | Vue conceptuelle de la Citadelle | Fond de l’écran titre |
| `crew-atlas.png` | 1536 × 1024 | 8 personnages, grille 4 × 2 | Exploration, combat, portraits, équipe |
| `enemy-atlas.png` | 1536 × 1024 | 8 silhouettes ennemies, grille 4 × 2 | Exploration et combat |
| `boss-atlas.png` | 1024 × 1536 | 4 boss, grille 2 × 2 | Combats dédiés |
| `npc-atlas.png` | 1536 × 1024 | 8 personnages, grille 4 × 2 | PNJ placés et portraits ; certaines images encore en réserve |
| `props-atlas.png` | 1536 × 1024 | 16 objets, grille 4 × 4 | Habillage 2D des décors 3D |
| `vehicle-atlas.png` | 1312 × 1199 | 4 véhicules / machines ; régions irrégulières | Mako statique et Sovereign distant ; autres images en réserve |
| `shepard-walk-atlas.png` | 1269 × 1240 | 16 poses, quatre directions | Marche de Shepard masculin |
| `shepard-female-walk-atlas.png` | 1254 × 1254 | 16 poses, quatre directions | Marche féminine, création, dossier et équipement |
| `shepard-female-combat-atlas.png` | 1536 × 1024 | Visée, pouvoir, impact, hors combat | Poses de combat féminines |
| `chronicle-portraits-me2-me3.png` | 1536 × 1024 | Trois bustes : Miranda ME2, Thane ME2, Garrus ME3 | Portraits de prototype dans leurs contextes Chroniques autorisés |
| `arsenal-people.png` | 1536 × 1024 | Quatre bustes de personnages et deux de PNJ | Identités et usages Chroniques autorisés ; PNJ documentaires |
| `arsenal-opponents.png` | 1536 × 1024 | Six silhouettes d’adversaires, dont deux boss | Références et portraits de combat dans leurs seuls bancs autorisés |
| `arsenal-equipment.png` | 1536 × 1024 | Deux armes, deux costumes et deux modules | Illustrations fixes des dossiers et préparations compatibles |
| `arsenal-fleet.png` | 1536 × 1024 | Trois véhicules et trois vaisseaux | Références documentaires uniquement, sans pilotage |

Les **quinze PNG courants** comprennent les dix images historiques — 48 sujets de sprites, 32 images de marche, quatre poses de combat supplémentaires et une illustration d’accueil —, l’atlas des trois bustes partiels et les quatre atlas arsenal de **24 illustrations fixes**. Ces nombres ne correspondent pas à des personnages ou movesets complets. Les doublons d’un même personnage sous plusieurs formes sont comptés comme sujets distincts d’atlas.

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

Shepard dispose d’une animation par images ; les compagnons et les ennemis utilisent encore leurs poses de base avec transformations procédurales. Les tirs, impacts, soins, lévitations, couvertures et stases ont des effets visuels, mais ne fournissent pas toutes les animations corporelles finales.

La variante féminine sélectionnable utilise deux atlas propres. Les rectangles et pivots sont décrits dans `shepard-female-animation.json`, puis inclus dans le JavaScript compilé pour fonctionner aussi avec le chargement local d’Electron. La marche garde la dernière direction à l’arrêt, utilise sept images par seconde et accélère pendant la course. En combat, les événements déclenchent les poses de visée, pouvoir et impact ; la pose couchée dispose d’une hauteur et d’un pivot spécifiques. Il s’agit de quatre poses clés, pas de quatre cycles complets.

Les deux nouveaux PNG conservent leur transparence native. Les marges et pivots sont mesurés par frame, sans extraction ou retouche des pixels. Certains contacts du cycle restent proches, les effets de pouvoir sont inclus dans l’illustration et la cohérence de costume demande encore une revue artistique. Voir [la provenance et les limites](research/shepard-female-art.md).

Nihlus est placé au Normandy avant le premier départ sur Eden Prime. Emily Wong possède une interaction de quête ; son image de l’atlas PNJ reste disponible pour une intégration de portrait et son personnage dédié dans le monde reste à produire. Joker est représenté debout ; sa pose assise reste un livrable distinct à produire.

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

## Critères d’acceptation de l’art final

Chaque asset devra être confronté à des références approuvées de l’épisode choisi : silhouette, visage, nombre et forme des appendices, armure, motifs, couleurs, accessoires, époque et poses. Les variantes doivent conserver la même identité. Les frames doivent respecter une origine et un pied d’ancrage constants, sans morceaux des cellules voisines ni variation de taille involontaire.

Pour les décors, la conformité implique également la géographie, les accès, proportions, silhouettes de bâtiments, objets fonctionnels et lignes de vue. Les neuf scènes présentes sont des compositions de prototype, sans validation topographique 1:1.

Le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) détaille les sprites, animations et vérifications attendus. Le [manifeste JSON](../public/assets/manifest.json) consigne dimensions, régions et empreintes des fichiers présents. Les briefs de génération sont conservés dans [ART_BRIEFS.md](ART_BRIEFS.md).

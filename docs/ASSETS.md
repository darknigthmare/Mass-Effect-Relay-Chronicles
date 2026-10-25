# Assets visuels — registre de livraison

Les images de `public/assets/` sont incluses dans la compilation. Le jeu ne dépend d’aucun CDN pour afficher ses sprites. Les atlas ont été générés pour ce projet, puis inspectés et reliés aux régions utilisées par le renderer. **Ils restent des assets de prototype : la fidélité 1:1 à ME1 n’est pas certifiée.**

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

Le lot comprend **48 sujets de sprites**, **32 images de marche et quatre poses de combat supplémentaires** et **une illustration d’accueil**. Ce nombre ne signifie pas 84 personnages ni 48 movesets complets. Les doublons d’un même personnage sous plusieurs formes sont comptés comme sujets distincts d’atlas.

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

Le lot [Chroniques](CHRONICLES.md) conserve les dix PNG existants et ne livre aucun nouvel atlas, portrait, modèle d’arme ou décor. Les 34 profils sélectionnables des Chroniques sont représentés par des initiales et des symboles de prototype dans l’interface des essais. Ils ne correspondent pas à 34 nouveaux sprites et ne réemploient pas les portraits de personnages ME1 pour représenter d’autres identités.

Le complément pouvoirs, préparations et lectures conserve également ces assets. Les dix mécaniques supplémentaires, les classes, les deux familles de modules et les 42 pages documentaires sont présentées par les commandes, barres, textes et liens de l’interface. Les 40 nouvelles fiches de pouvoirs utilisées ne correspondent ni à 40 animations ni à 40 VFX livrés. Les modules ne livrent aucun modèle visuel ou rang original certifié ; les lectures ne créent aucun portrait ou doublage de roman/comic.

Les mannequins des trois bancs de personnages et les cibles des trois ateliers sont des gabarits originaux. Ils ne représentent pas des adversaires attestés des missions ou comics concernés. Les quatre autres essais conservent des types d’adversaires référencés, présentés avec la même convention symbolique. Les effets, projectiles et barres d’état n’établissent aucune conformité visuelle des personnages ou modèles d’armes.

Chaque œuvre demande encore ses costumes, armes dessinées, portraits, silhouettes, décors et animations propres à la période. Une sélection disponible dans un atelier ne livre pas l’asset correspondant. La fidélité artistique et les mouvements par personnage restent des critères distincts de la validation des règles et sauvegardes.

## Critères d’acceptation de l’art final

Chaque asset devra être confronté à des références approuvées de l’épisode choisi : silhouette, visage, nombre et forme des appendices, armure, motifs, couleurs, accessoires, époque et poses. Les variantes doivent conserver la même identité. Les frames doivent respecter une origine et un pied d’ancrage constants, sans morceaux des cellules voisines ni variation de taille involontaire.

Pour les décors, la conformité implique également la géographie, les accès, proportions, silhouettes de bâtiments, objets fonctionnels et lignes de vue. Les neuf scènes présentes sont des compositions de prototype, sans validation topographique 1:1.

Le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) détaille les sprites, animations et vérifications attendus. Le [manifeste JSON](../public/assets/manifest.json) consigne dimensions, régions et empreintes des fichiers présents. Les briefs de génération sont conservés dans [ART_BRIEFS.md](ART_BRIEFS.md).

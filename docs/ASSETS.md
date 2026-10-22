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
| `shepard-walk-atlas.png` | 1269 × 1240 | 16 poses, quatre directions | Première animation de marche de Shepard |

Le lot comprend **48 sujets de sprites**, **16 images d’animation supplémentaires** et **une illustration d’accueil**. Ce nombre ne signifie pas 64 personnages ni 48 movesets complets. Les doublons d’un même personnage sous plusieurs formes sont comptés comme sujets distincts d’atlas.

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

Les personnages et objets sont des plans 2D dans un monde 3D. Les accessoires ne remplacent pas la géométrie des bâtiments, sols, coursives, volumes et routes. Les silhouettes conservent un seuil alpha de 0,2 pour limiter les franges de transparence. La taille et les proportions du plan dépendent du type d’atlas, notamment pour les boss.

Shepard dispose d’une animation par images ; les compagnons et les ennemis utilisent encore leurs poses de base avec transformations procédurales. Les tirs, impacts, soins, lévitations, couvertures et stases ont des effets visuels, mais ne fournissent pas toutes les animations corporelles finales.

L’atlas PNJ contient une Shepard féminine, mais le créateur de personnage ne permet pas encore de sélectionner cette apparence. Nihlus et Emily Wong sont des images en réserve. Joker est représenté debout ; sa pose assise reste un livrable distinct à produire.

## Critères d’acceptation de l’art final

Chaque asset devra être confronté à des références approuvées de l’épisode choisi : silhouette, visage, nombre et forme des appendices, armure, motifs, couleurs, accessoires, époque et poses. Les variantes doivent conserver la même identité. Les frames doivent respecter une origine et un pied d’ancrage constants, sans morceaux des cellules voisines ni variation de taille involontaire.

Pour les décors, la conformité implique également la géographie, les accès, proportions, silhouettes de bâtiments, objets fonctionnels et lignes de vue. Les neuf scènes présentes sont des compositions de prototype, sans validation topographique 1:1.

Le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) détaille les sprites, animations et vérifications attendus. Le [manifeste JSON](../public/assets/manifest.json) consigne dimensions, régions et empreintes des fichiers présents. Les briefs de génération sont conservés dans [ART_BRIEFS.md](ART_BRIEFS.md).

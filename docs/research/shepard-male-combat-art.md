# Shepard masculin — poses de combat N7

## Livraison et sources

Le lot du 29 octobre 2026 ajoute `public/assets/shepard-male-combat-atlas.png` et `public/assets/shepard-male-animation.json`. Il dérive de l’atlas de marche masculin déjà présent dans le projet : même intention de visage adulte, cheveux courts foncés, armure graphite et bandes rouges/blanches N7. Il reste au statut **Prototype**, sans validation de fidélité 1:1 à un modèle original.

Les guides appliqués sont [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md) et [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md), à la révision déjà épinglée dans le [registre du projet](../gamedev-sources.json). La méthode retient une famille limitée, une référence d’identité, la séparation des effets du moteur et des pixels sources, puis la vérification des cadrages, pivots et usages réels.

Deux requêtes ont été exécutées avec `image_gen.imagegen`, avec fond transparent. La première crée les quatre poses depuis l’atlas de marche. La seconde demande un nettoyage de transparence ; elle conserve la composition, mais modifie aussi certains détails de texture et de visage. La conservation exacte des pixels entre ces deux sorties n’est donc pas revendiquée. Les [prompts complets et identifiants des sorties](shepard-male-combat-prompts.json) sont archivés.

La seconde sortie est copiée **octet pour octet**, sans recadrage, recoloration, réécriture d’alpha ou autre retouche du PNG. Son empreinte SHA-256 est :

```text
a6ba2b005d931d571f1f2e4389eef03c5e9581850a01d440dc30adb81dd0bd18
```

## Quatre poses clés

L’image RGBA mesure **1536 × 1024**. Les poses suivent une vue trois-quarts fixe. Les cellules effectivement obtenues ne suivent pas exactement une grille régulière : le renderer utilise les rectangles mesurés, avec leur ancrage au sol et leur hauteur relative.

| Pose | ID stable | Rectangle `[x, y, largeur, hauteur]` | Pivot relatif | Hauteur relative |
|---|---|---|---|---:|
| Visée | `shepard-combat-aim` | `[222, 9, 430, 527]` | `[190, 521]` | 1 |
| Pouvoir | `shepard-combat-power` | `[930, 9, 424, 527]` | `[168, 521]` | 1 |
| Impact | `shepard-combat-hit` | `[214, 534, 421, 468]` | `[226, 461]` | 0,88 |
| Hors combat | `shepard-combat-down` | `[799, 800, 707, 181]` | `[353, 174]` | 0,25 |

Le fusil de visée est une illustration générique. Il ne représente pas le modèle d’arme réellement équipé. La pose de pouvoir ne contient pas de halo ou projectile de pouvoir incorporé : les effets restent ceux du moteur. Ces quatre dessins ne constituent ni un cycle complet, ni des transitions interpolées, ni des vues de combat dans toutes les directions. La marche masculine existante conserve ses seize images dans quatre directions.

## Transparence et recoloration

Le contrôle [shepard-combat-art-report.json](../qa/shepard-combat-art-report.json) lit le PNG sans le réécrire, vérifie l’empreinte du manifeste, les dimensions, les rectangles, les pivots, les régions de tête et l’échelle couchée. Chaque nouvelle pose conserve une marge de 5 à 7 pixels autour de sa silhouette au seuil alpha 24 utilisé par la recoloration. Deux rangées de marge se recouvrent entre les rectangles de visée et d’impact ; aucun pixel visible au seuil 24 n’est partagé. Les bords masculins ont un alpha maximal de 1 ou 2. Des pixels de très faible opacité subsistent dans la sortie générée ; un nettoyage parfait de tout halo n’est pas déclaré.

Chaque pose possède une `headRegion` normalisée dans son rectangle. `headAxis` indique l’axe allant du sommet de la tête au cou : `y` debout, `x` pour la tête située à gauche de la pose couchée. Le renderer du monde et l’atelier utilisent ces mêmes paramètres. Le casque suit ainsi la tête couchée et les couleurs d’armure peuvent traiter le corps horizontal sans confondre sa partie haute avec un visage. L’alpha source reste conservé dans les textures recolorées.

Les quatre poses féminines existantes reçoivent également leurs régions de tête et axes, sans modification de leur PNG ni de leurs rectangles, pivots ou hauteurs. Le rapport relève leurs pixels de bord historiques ; il ne les présente pas comme réparés. Les masques de couleur restent heuristiques et les coiffures/visages ne sont pas des modèles déformables.

## Intégration et preuves

Le renderer conserve un sprite de repli pendant le chargement, applique visée/pouvoir/impact/hors combat et donne priorité à l’impact puis au KO. Le retour à la vie revient à la visée. La configuration masculine contient uniquement la famille de combat et ne remplace pas le système de marche existant. Les métadonnées sont incorporées au build Vite, sans requête JSON supplémentaire au lancement.

L’atelier propose Terrain, Visée, Pouvoir, Impact et Hors combat pour les deux apparences. Le choix de pose reste temporaire, sans sauvegarde ni effet sur les PV, statistiques, pouvoirs ou inventaire. Les quatre directions de terrain sont conservées pour le retour à Terrain ; les vues de combat indiquent explicitement leur angle fixe. Les panneaux actuel et préparé utilisent la même pose et la même échelle de famille.

Les tests, parcours d’atelier, scène isolée du renderer, captures, contrôles du build et mise à jour des six fiches du classeur sont rassemblés dans le [rapport de livraison](../qa/shepard-combat-poses-report.json). Les tests de logique et de cadrage ne certifient pas la fidélité artistique ni une exécution Windows native.

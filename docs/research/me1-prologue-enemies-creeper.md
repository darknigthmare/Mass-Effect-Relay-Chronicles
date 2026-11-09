# Creeper du Thorien ME1 — quatre poses fixes

Ce lot part du commit `d19197ff43facd066abcc6ff4611e0ce0148609b`. Il complète uniquement l’identité de creeper déjà jouable dans le prototype. La troisième silhouette de la seconde ligne de [enemy-atlas.png](../../public/assets/enemy-atlas.png) a réellement été ouverte avant la génération. Les fibres gris-vert, les saccules fongiques, la tête rentrée, les bras allongés et les extrémités griffues sont conservés dans les quatre dessins.

Le [guide create-game-assets épinglé](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md) et ses références art-direction, raster-pipeline et provenance ont été lus. Le fichier historique est la référence d’identité et de style du prototype, pas une planche primaire du modèle original de Mass Effect. Aucune nouvelle référence primaire de corps complet n’a été obtenue ici ; proportions, anatomie et surface canoniques restent non certifiées 1:1.

## Génération et pixels conservés

Les [prompts exacts](me1-prologue-enemies-creeper-prompts.json) consignent l’unique appel `image_gen.imagegen`, sa référence et la sortie native retenue. Le [PNG livré](../../public/assets/enemy-creeper-combat.png) est une copie octet pour octet de `/workspace/generated_images/exec-a753feec-6288-4168-a5ce-b60948286094.png`, sans redimensionnement, découpage, nettoyage ou retouche de pixels. Le fichier natif RGBA mesure **1536 × 1024**.

PNG SHA-256 : `6ae0a6f8e96111fff3f45c902fd2808fb3411b518421627d10badd6ec5cf6300`. Métadonnées SHA-256 : `4d0c9b23b7f36f546fa479fe10317df51e068779abb1ac1f675bdad40ddc9132`.

Le seuil visible est 51/255, correspondant à l’alpha-test 0,2 du renderer. Les quatre grandes composantes sont séparées. Le contrôle huit-connexe trouve aussi **un pixel visible isolé** à [1118, 193], à l’intérieur du rectangle power ; il reste inchangé et ne touche aucune cellule voisine. Les faibles franges natives restent présentes. Les 272 587 pixels au seuil visible appartiennent chacun exactement à un des quatre rectangles. Aucun pixel visible n’est partagé, non attribué ou coupé par un bord de cadre.

## Cadrages et ancrages mesurés

Les rectangles sont [x, y, largeur, hauteur], origine en haut à gauche. Les pivots sont relatifs au cadre : support des pieds pour les poses debout et support bas pour le corps couché. Les contours au seuil visible gardent huit pixels de marge sur chaque côté. Les hauteurs relatives sont le rapport hauteur-du-cadre/479, pour conserver la même échelle de pixels entre poses.

| Pose | Rectangle | Pivot | Hauteur relative | Sens du dessin |
|---|---|---|---|---|
| aim | [191, 8, 384, 479] | [195, 470] | 1,000000 | Garde organique sans arme |
| power | [825, 30, 590, 451] | [389, 443] | 0,941545 | Préparation de la frappe organique native |
| hit | [175, 531, 405, 487] | [197, 479] | 1,016701 | Recul d’impact |
| down | [826, 727, 651, 228] | [326, 220] | 0,475992 | Corps complet couché, tête à gauche |

Les [métadonnées](../../public/assets/enemy-creeper-animation.json) utilisent les états communs des ennemis. `aim` signifie ici alerte/garde organique ; `power` représente le geste de l’action `strike` déjà existante. Aucune arme, biotique, attaque, statistique, récompense ou phase de boss n’est ajoutée par le dessin.

## Revue réellement effectuée

La sortie native a été affichée par l’outil de génération puis ouverte avec `view_image`. Une [capture Chromium à la taille native](../screenshots/me1-prologue-enemies-creeper-art-native.png) affiche les octets du même PNG à 1536 × 1024 sur un fond neutre ; elle a réellement été ouverte. Ce fond de revue n’est pas incorporé au PNG livré. Les quatre corps, doigts, pieds et saccules y restent visibles et séparés. La posture d’impact est plus redressée ; la tête et les saccules gardent l’identité générale, avec des détails de surface qui varient entre dessins.

Le [rapport artistique et technique](../qa/me1-prologue-enemies-creeper-art.json) déclare cette portée native. Il ne vaut pas parcours de combat, contrôle de l’ancrage réel en scène, ni comparaison canonique. L’intégration du renderer, le déclenchement de `strike`, les protections de contexte et les sauvegardes appartiennent aux preuves distinctes du lot. Les quatre dessins fixes ne forment pas des cycles, des transitions ou des directions supplémentaires.

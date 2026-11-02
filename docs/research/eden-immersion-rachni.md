# Soldat rachni ME1 — poses fixes du 2 novembre 2026

Quatre dessins fixes ajoutent visée/alerte, action, impact et hors combat à l’identité ME1 déjà jouable. La référence effectivement fournie à la première génération est [enemy-atlas.png](../../public/assets/enemy-atlas.png), réellement ouverte. Elle sert de référence de style et d’identité du prototype ; elle ne certifie pas le modèle original de Mass Effect. Le soldat conserve la carapace ivoire/beige et les membres anguleux de la silhouette de prototype. La pose d’action suggère le geste acide déjà utilisé ; aucun liquide, projectile ou effet n’est incorporé au dessin.

## Références et limites

Aucune référence primaire corporelle ou de costume suffisante pour cette famille n’a été obtenue ici. Le guide Prima public de 23 pages inspecté pour le lot contient le prologue et des bustes de geth/husk, pas une planche nommée de soldat rachni me1. L’ancien article EA [Visual Improvements](https://www.ea.com/ea-play/news/visual-improvements), HTTP 200 et titre vérifié, décrit des environnements mais ne fournit pas ici une nouvelle attestation de ce corps. Ses images sur un autre hôte n’ont pas été récupérées. L’ancien atlas reste donc la référence de génération déclarée, avec le statut **Prototype** et `primaryOriginalBodyReferenceObtained: false`.

Les anatomies, détails d’armure, proportions et variantes d’équipement originales ne sont pas certifiés 1:1. Les quatre dessins à angle fixe ne sont ni des cycles, ni des directions supplémentaires, ni un nouveau kit d’attaques. La vérification du rendu réel et de l’ancrage en jeu appartient au parcours du lot, séparément du contrôle artistique présent.

## Génération et conservation des pixels

Les [prompts exacts](eden-immersion-rachni-prompts.json) consignent les deux appels `image_gen.imagegen`, leurs références et les sorties. La première sortie a été refusée : des pixels visibles d’une silhouette entraient dans le rectangle englobant de la voisine, ce qui empêchait un découpage UV rectangulaire propre. Une seconde génération a recomposé les mêmes quatre poses avec davantage d’espace. Il s’agit d’une nouvelle sortie de génération, pas d’une transformation pixel par pixel déterministe de la première.

Le [PNG livré](../../public/assets/enemy-rachni-combat.png) est une copie octet pour octet de cette seconde sortie native RGBA de **1536 × 1024**, sans nettoyage, redimensionnement, extraction ou retouche de pixels. Les faibles franges d’alpha restent présentes. Le seuil visible du renderer est 51/255, correspondant à l’alpha-test 0,2. La sortie retenue compte quatre composantes visibles séparées ; tous les pixels à ce seuil appartiennent exactement à un cadrage et aucune silhouette ne touche son bord.

PNG SHA-256 : `6e623a49feb519f067e0196bbfdf6c22ec2ec765865c02787194ab99dfe94cc9`. Métadonnées SHA-256 : `ea546356667aef5acf7d61f39613906a0c4f7cd55633703aded2f91cb5750fc1`.

## Cadrages mesurés

Les rectangles utilisent `[x, y, largeur, hauteur]`, origine en haut à gauche. Chaque contour visible conserve huit pixels de marge. Les pivots sont relatifs au rectangle : centre de support choisi lors de la revue native et bas visible de la pose. Ils ne sont pas une donnée canonique. Les hauteurs relatives suivent le rapport hauteur-du-cadre/hauteur-du-cadre-visée pour conserver une même échelle de pixels au sein de la famille, y compris le corps couché volumineux ou multijambes.

| Pose | Rectangle | Pivot | Hauteur relative |
|---|---|---|---|
| aim | `[102, 48, 620, 478]` | `[313, 470]` | 1.000000 |
| power | `[816, 39, 650, 485]` | `[324, 477]` | 1.014644 |
| hit | `[140, 545, 567, 439]` | `[275, 431]` | 0.918410 |
| down | `[845, 603, 646, 345]` | `[323, 337]` | 0.721757 |

Les [métadonnées](../../public/assets/enemy-rachni-animation.json) et le [rapport technique](../qa/eden-immersion-rachni-art.json) délimitent la livraison. Les deux sorties natives ont réellement été ouvertes avec `view_image` ; la seconde a été retenue après le contrôle des composantes et des rectangles. Aucun nouveau comportement, inventaire, pouvoir, état narratif ou résultat de combat n’est accordé par l’image.

# Joker ME1 assis — 2 novembre 2026

La fiche existante `SPR-NPC-joker-assis` demandait une pose assise distincte de la silhouette debout de l’atlas PNJ. [Le PNG livré](../../public/assets/joker-seated.png) contient deux dessins fixes : repos et mains aux commandes, avec un siège compact inclus. [Les coordonnées](../../public/assets/joker-seated.json) délimitent chaque sujet, sans retouche du fichier natif.

L’identité du prototype vient de la troisième cellule haute de [npc-atlas.png](../../public/assets/npc-atlas.png), qui conserve son empreinte. Le guide de méthode create-game-assets est lu à la révision épinglée dans [gamedev-sources.json](../gamedev-sources.json), avec ses références art-direction, raster-pipeline et provenance. [Le prompt exact](me1-enemy-poses-joker-prompts.json) consigne les deux références réellement fournies à image_gen.imagegen.

## Référence primaire inspectée

Le [guide Prima ME1, prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a répondu HTTP 200 le 2 novembre 2026 : 4 677 689 octets, 23 pages PDF, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. La page PDF 6, imprimée 62, a été ouverte individuellement : la capture supérieure gauche montre un pilote à casquette assis au premier plan, avec Kaidan au second plan ; le texte adjacent décrit Joker aux commandes et Kaidan également au poste de pilotage. Elle donne un repère partiel de posture, casquette et haut de tenue. La page PDF 17, imprimée 73, a aussi été inspectée ; ses captures principales concernent Chakwas, Shepard et Anderson, et ne deviennent pas une référence corporelle de Joker.

Ce repère est distinct de l’ancienne capture de conversation du manuel Xbox 360, que la [revue précédente](arsenal-visual-sources.md) refusait d’attribuer à Joker. Le PDF de travail et sa page rendue restent sous `/tmp/relay-joker-primary/`, hors des assets distribués. La source ne certifie ni la géométrie complète du siège généré ni toutes les coutures, insignes, couleurs et proportions du sprite.

## Cadrage, ancrage et contrôle

Le PNG natif RGBA mesure 1536 × 1024 ; sa copie distribuée conserve exactement les mêmes 1 984 506 octets et SHA-256 `b8eeebdd674af3cc7a37058917813c2f028d893c73c4043e0b98c88455d44139`. Les deux silhouettes comprennent tête, bras, jambes, bottes, dossier et base du siège. Le pilote reste effectivement assis dans les deux vues.

| Pose | Rectangle x/y/l/h | Pivot relatif | Échelle de hauteur |
|---|---|---|---|
| Repos | 112 / 111 / 636 / 847 | 242 / 839 | 0,77 |
| Aux commandes | 922 / 115 / 589 / 847 | 242 / 839 | 0,77 |

Le pivot horizontal suit la base du siège ; le pivot vertical suit le contact le plus bas des bottes. Le dessin assis est prévu à environ 77 % de la hauteur d’un humain debout, siège inclus. Les rectangles gardent au moins huit pixels autour des silhouettes au seuil alpha 51 du renderer. À ce seuil, exactement deux composants connexes forment les deux poses ; chacun est attribué une seule fois. Des pixels d’alpha extrêmement faible persistent hors des cadres, avec alpha 1 sur une partie du bord gauche ; ils ne passent pas l’alpha-test 0,2. Aucun nettoyage de pixels n’est revendiqué.

Le résultat natif a été vu dans l’affichage de génération. L’aperçu direct de view_image a ensuite présenté une image anormalement sombre, malgré des pixels RGBA normaux ; un affichage HTTP dans Chromium 154 a chargé le PNG natif sans modification et produit [cette capture à 1536 × 1024](../qa/me1-enemy-poses-joker-native-browser.png), réellement ouverte et lisible sur fond uni. Cette capture est un contrôle d’image, pas une preuve d’intégration au cockpit. [Le rapport technique](../qa/me1-enemy-poses-joker-art.json) sépare ces observations de la vérification en jeu confiée au lot renderer.

## Limites

Deux poses fixes ne constituent pas une animation, une simulation du pilotage, des déplacements adaptés à l’état physique du personnage ou une reconstitution complète de son modèle. La tenue et le siège sont des interprétations de prototype, sans certification de fidélité 1:1. Le PNG ne modifie dialogue, recrutement, statistiques, inventaire ou sauvegarde. Seul le PNJ Joker de ME1 au cockpit du Normandy SR-1 doit l’utiliser ; le portrait et les autres scènes conservent leurs usages existants.

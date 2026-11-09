# Commando asari ME1 — quatre poses fixes

Ce lot ajoute quatre dessins de visée, geste de pouvoir, impact et KO à l'identité du commando asari générique déjà présente dans [enemy-atlas.png](../../public/assets/enemy-atlas.png). La cellule en bas à droite de cet atlas a réellement été ouverte avant la génération. Sa peau bleue, ses crêtes crâniennes, son armure noir/violet et son pistolet compact servent de référence de cohérence du prototype. Ils ne constituent pas une preuve du modèle original de Mass Effect.

Le profil natif `asari` conserve `throw` et `barrier`. Aucun pouvoir, effet, statistique, équipement ou événement narratif supplémentaire n'est fourni par ces dessins. Le geste de pouvoir n'incorpore ni aura ni projectile : le renderer conserve ses effets natifs. La pose couchée représente un KO de combat.

## Portée et références

Le sujet est le **commando générique**, pas Bénézia, Liara ou une nouvelle identité de clone du Thorien. La réutilisation actuelle de la clé `asari` dans plusieurs rencontres ne réalise pas les invocations, changements de tenue ou phases d'apparition du clone. Les fiches distinctes de ce clone ne sont pas validées par le présent art.

Aucune nouvelle référence primaire de corps ou de costume complet n'a été obtenue pour cette famille. La seule image réellement fournie au générateur est l'atlas historique du projet. Les proportions, détails d'armure, anatomie et géométrie exacte de l'arme restent donc **Prototype**, sans certification de fidélité 1:1. Les cycles, directions supplémentaires et transitions ne sont pas produits.

Le guide de méthode `create-game-assets` a été lu à la révision épinglée `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`, ainsi que ses références `raster-pipeline.md` et `provenance.md`. Les consignes du projet et l'absence de retouche de pixels restent prioritaires.

## Génération native

Les [arguments et le prompt exacts](me1-prologue-enemies-asari-prompts.json) conservent l'unique appel à `image_gen.imagegen`, avec `transparent_background: true` et la référence locale. La première sortie a été retenue après vérification. Aucun second essai, détourage, redimensionnement ou nettoyage de pixels n'est revendiqué.

Le [PNG livré](../../public/assets/enemy-asari-combat.png) est une copie octet pour octet de la sortie native `/workspace/generated_images/exec-fb370479-72dd-4fef-ae83-381d4c28da5a.png`, en RGBA **1536 × 1024**. Ses pixels de faible alpha sont conservés. Le seuil visible de 51/255 correspond à l'alpha-test 0,2 du renderer : quatre composantes séparées, aucun pixel visible non assigné ou partagé entre les quatre cadrages, huit pixels de marge à chaque bord de frame.

PNG SHA-256 : `3fe770569f7072ccf782b9fad510ec83d245e9508bfd58d5feeb05c491351c5a`.

Métadonnées SHA-256 : `4b299f599418299c62d230ebf682ad0e82175e056f638b7425b255ef2f6ee902`.

## Cadrages et ancrages mesurés

Les rectangles sont `[x, y, largeur, hauteur]`, origine en haut à gauche. Les pivots sont relatifs à leur frame et choisis sur le support au sol après inspection. La hauteur relative est le rapport hauteur-du-cadre/hauteur-du-cadre-visée ; elle conserve l'échelle des pixels natifs entre les poses. Elle ne certifie pas un volume anatomique identique ni les dimensions du modèle original.

| Pose | Rectangle | Pivot | Hauteur relative |
|---|---|---|---|
| aim | `[201, 6, 337, 500]` | `[212, 492]` | 1,000 |
| power | `[938, 6, 411, 497]` | `[226, 489]` | 0,994 |
| hit | `[232, 511, 357, 506]` | `[178, 498]` | 1,012 |
| down | `[857, 754, 607, 175]` | `[304, 167]` | 0,350 |

Les trois figures debout gardent une même identité et une armure cohérente. La pose couchée conserve une perspective et une longueur de corps légèrement différentes ; cette réserve n'est pas corrigée en comprimant arbitrairement les pixels. Le pistolet reste attaché aux mains ou au torse, sans objet détaché ni fragment de cellule voisine.

## Contrôle visuel natif et limites du test

La prévisualisation du générateur montrait les quatre dessins. Le lecteur direct d'image affichait ensuite une image noire alors que les valeurs RGB et alpha mesurées étaient valides. La vérification a donc chargé **les mêmes octets PNG** dans Chromium, à leur taille native de 1536 × 1024, sur un damier CSS. La [capture effective](../screenshots/me1-prologue-enemies-asari-native.png) a réellement été ouverte : les quatre corps, armes, pieds et crêtes sont lisibles et entiers. Le damier appartient à la page de contrôle, pas à l'asset.

Commande réellement exécutée : `node scripts/check-me1-prologue-enemies-asari-native.mjs /workspace/generated_images/exec-fb370479-72dd-4fef-ae83-381d4c28da5a.png`.

Le [rapport de décodage](../qa/me1-prologue-enemies-asari-native-preview.json) décrit la fixture détachée ; son champ de capture `actuallyOpened: false` est l'état automatique avant revue. Le [rapport artistique](../qa/me1-prologue-enemies-asari-art.json) enregistre séparément la revue humaine effective, les mesures et ses réserves. Les [métadonnées](../../public/assets/enemy-asari-animation.json) sont destinées à l'intégration existante, qui doit encore vérifier le rendu en combat réel, les priorités d'impact/KO, l'ancrage et les refus de contexte étranger. Aucun parcours de gameplay n'est attribué au seul aperçu natif.

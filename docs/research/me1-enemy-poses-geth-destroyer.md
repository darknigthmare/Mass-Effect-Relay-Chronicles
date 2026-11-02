# Destructeur geth ME1 — quatre poses fixes

Le 2 novembre 2026, `image_gen.imagegen` a produit un atlas natif RGBA de 1536 × 1024 pour l’identité `geth-destroyer` du prototype. La quatrième silhouette de la première ligne de [enemy-atlas.png](../../public/assets/enemy-atlas.png), réellement ouverte avant génération, fournit le corps complet et la palette conservés : épaules larges, plaques bleu-gris à liserés rouges usés, membres épais, pieds griffus et optique unique. Cette famille ne représente ni un Juggernaut, ni un Prime, ni une variante d’un autre opus.

Le [guide Prima officiel du prologue ME1](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé réellement en HTTP 200, 23 pages, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Les pages PDF 14 à 16 ont été ouvertes. La notice **Geth Destroyer**, page PDF 15 / imprimée 71, contient une petite capture nommée de tête et de torse, ainsi qu’une description du rôle lourd. Le rendu de cette page a été fourni comme seconde référence de génération. Il ne fournit ni modèle complet, ni angles arrière, ni preuve de tous les détails de couleur ou de géométrie. Le corps et la livrée du prototype restent donc des interprétations déclarées ; la petite capture n’est pas présentée comme une validation complète de ceux-ci.

Le [PNG livré](../../public/assets/enemy-geth-destroyer-combat.png) est une copie octet pour octet de `exec-442838c5-d285-486a-be97-9a20ff55ac03.png`, conservé dans le répertoire de génération de la session. Son SHA-256 est `42fa2089e8cb2dde8c8bb25d94906356f4e385cf07a07fb21dbfc1ec288f06bd`. Aucun recadrage, redimensionnement, changement d’alpha ou retouche de pixels n’a été appliqué. Le [prompt exact et ses deux entrées](me1-enemy-poses-geth-destroyer-prompts.json) conservent la provenance de cet unique essai retenu. Les textes, images d’interface et logos de la page Prima ne sont pas reproduits dans l’atlas.

Les [métadonnées](../../public/assets/enemy-geth-destroyer-animation.json) décrivent les rectangles mesurés, avec une marge de huit pixels autour de chaque silhouette au seuil alpha 51 du renderer. Les pivots debout suivent le contact au sol ; le corps couché possède un pivot central et une hauteur propre. Le rectangle couché commence avant la limite théorique d’un quadrant : les régions sont mesurées et ne supposent pas une grille régulière.

| Pose | Rectangle `[x, y, largeur, hauteur]` | Pivot relatif | Hauteur relative |
|---|---|---|---:|
| Visée | `[120, 1, 477, 537]` | `[316, 529]` | 1 |
| Action | `[810, 12, 619, 537]` | `[427, 529]` | 1 |
| Impact | `[109, 548, 518, 460]` | `[301, 452]` | 0,86 |
| Hors combat | `[736, 714, 754, 263]` | `[377, 255]` | 0,35 |

Le [contrôle technique](../qa/me1-enemy-poses-geth-destroyer-art.json), exécuté par [le script de lecture des pixels](../../scripts/check-me1-geth-variants-art.py), retrouve quatre composantes séparées au seuil alpha du moteur. Tous les pixels visibles appartiennent à une seule pose, sans coupe ou fragment voisin. Le PNG natif et la copie ont été ouverts à leur résolution d’origine. Des franges colorées sous le seuil alpha du moteur subsistent ; leur suppression n’est pas revendiquée.

Les quatre dessins sont des poses clés fixes en trois-quarts, de statut **Prototype**. Le geste `power` représente une action générique avec l’arme, sans projectile, flamme ou bouclier incorporé. Il ne crée pas de nouvelle mécanique de Carnage, de charge ou de mêlée. L’arme dessinée reste générique et ne certifie pas un modèle canonique. Les cycles, transitions, directions supplémentaires et tous les détails du modèle original restent à vérifier ou produire. La fidélité 1:1 n’est pas certifiée ; les contrôles de rendu et de combat restent distincts de ce rapport d’art.

# Tireur geth ME1 — quatre poses fixes

Le 2 novembre 2026, `image_gen.imagegen` a produit un atlas natif RGBA de 1536 × 1024 pour l’identité `geth-sniper` du prototype. La référence d’identité et de style est la troisième silhouette de la première ligne de [enemy-atlas.png](../../public/assets/enemy-atlas.png), réellement ouverte avant génération : plaques rouges, proportions mécaniques élancées, optique unique et long fusil illustré générique. Les trois autres familles geth ne sont pas substituées à cette identité.

Le [PNG livré](../../public/assets/enemy-geth-sniper-combat.png) est une copie octet pour octet de `exec-15c4ab49-947c-4892-87d1-81d2c230a040.png`, conservé dans le répertoire de génération de la session. Son SHA-256 est `f1d5d7617d20b7d0845c9fb3af1b51315068061d4403331fa3437f4126b99ab8`. Aucun recadrage, redimensionnement, changement d’alpha ou retouche de pixels n’a été appliqué. Le [prompt exact et ses entrées](me1-enemy-poses-geth-sniper-prompts.json) conservent la provenance de cet unique essai retenu.

Les [métadonnées](../../public/assets/enemy-geth-sniper-animation.json) décrivent des rectangles irréguliers, avec une marge de huit pixels autour de chaque silhouette visible au seuil alpha 51 du renderer. Les pivots des poses debout suivent le contact au sol ; la pose couchée utilise un pivot central au contact inférieur. Il ne s’agit pas d’une grille supposée exacte.

| Pose | Rectangle `[x, y, largeur, hauteur]` | Pivot relatif | Hauteur relative |
|---|---|---|---:|
| Visée | `[105, 4, 480, 527]` | `[332, 519]` | 1 |
| Action | `[850, 5, 560, 532]` | `[336, 524]` | 1,01 |
| Impact | `[175, 543, 538, 453]` | `[270, 445]` | 0,86 |
| Hors combat | `[795, 724, 716, 217]` | `[358, 209]` | 0,31 |

Le [contrôle technique](../qa/me1-enemy-poses-geth-sniper-art.json), exécuté par [le script de lecture des pixels](../../scripts/check-me1-geth-variants-art.py), retrouve quatre composantes séparées au seuil alpha du moteur. Tous les pixels visibles sont attribués une seule fois ; aucun autre sujet ne passe dans les rectangles. Le PNG natif et sa copie livrée ont été ouverts à leur résolution d’origine. Les faibles franges colorées d’alpha inférieur à 51 restent présentes et documentées ; aucun détourage parfait n’est revendiqué.

Le [guide Prima officiel du prologue ME1](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé réellement en HTTP 200, 23 pages, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Les pages PDF 14 à 16 ont été ouvertes ; elles nomment notamment le destructeur et le soldat de choc, mais ne constituent pas une planche du tireur. Aucune apparence complète et nommée de ce dernier n’a été obtenue dans cet échantillon du prologue. Ce PDF n’a pas été fourni comme référence visuelle à la génération du tireur.

Ces quatre dessins restent des poses clés en trois-quarts fixe, de statut **Prototype**. La pose `power` est un geste d’action au fusil sans effet incorporé : elle n’ajoute aucune capacité. Les cycles, transitions, autres directions, silhouette exacte du fusil et modèle original restent à produire ou comparer. La fidélité 1:1 n’est pas certifiée. La revue dans le renderer et le parcours de combat sont des contrôles distincts de ce rapport d’art.

# Soldat geth ME1 — quatre poses fixes

Le lot du 2 novembre 2026 dérive le soldat geth existant de [l’atlas ennemi du prototype](../../public/assets/enemy-atlas.png). La cellule supérieure gauche fournit la silhouette mécanique mince, la coque ivoire, les articulations sombres, l’optique unique et le fusil illustré générique. Le renderer Three.js 0.180.0 existant reste la cible : sprites HD en plans 2D, filtrage linéaire et alpha-test 0,2.

Le [guide Prima officiel du prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé le 2 novembre : 4 677 689 octets, 23 pages, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. La page PDF 10, imprimée 66, a été rendue et réellement ouverte. Elle contient un petit buste explicitement nommé **Geth Trooper**, avec sa tête allongée et son optique lumineuse, et décrit une infanterie synthétique équipée. Cette figure constitue un repère primaire partiel ; sa faible résolution, son éclairage et son cadrage ne prouvent pas la géométrie complète, la livrée ivoire ou le modèle précis de fusil de la génération. Les pages PDF 11 et 12 ont aussi été consultées pour le contexte d’Eden Prime.

Les [prompts exacts et références de génération](me1-enemy-poses-geth-prompts.json) conservent les chemins réellement fournis à `image_gen.imagegen`. Une génération a livré le [PNG natif](../../public/assets/enemy-geth-combat.png), RGBA 1536 × 1024, copié sans retouche depuis `/workspace/generated_images/exec-6091e2c4-0103-4a36-a1c1-469875b3737b.png`. Le SHA-256 livré est `a26b39193130e98031907f7b850f46b8591d74a6e5823af39ba860c76f58614c`. La sortie native et la copie sont identiques octet par octet.

| État | Dessin | Rectangle `[x,y,largeur,hauteur]` |
|---|---|---|
| `aim` | Visée au fusil | `[150,0,480,558]` |
| `power` | Geste de garde mécanique, fusil abaissé et main ouverte | `[900,0,435,576]` |
| `hit` | Recul d’impact, arme conservée | `[195,564,430,460]` |
| `down` | Corps mécanique intact couché, tête à gauche | `[780,780,710,200]` |

La grille demandée n’a pas été suivie exactement : les deux poses hautes débordent la limite théorique de 512 pixels. Les [métadonnées mesurées](../../public/assets/enemy-geth-animation.json) utilisent donc des rectangles irréguliers, des pivots aux appuis et des rapports de hauteur qui conservent l’échelle des pixels. Aucun découpage ou redimensionnement du PNG n’a été effectué.

Le [contrôle technique reproductible](../qa/me1-enemy-poses-geth-art.json) passe avec `python scripts/check-me1-geth-husk-art.py` : 294 682 pixels visibles au seuil alpha 51, quatre composantes entières, zéro pixel visible hors cadre ou partagé et aucune silhouette touchant le bord d’un cadre. Les 47 929 pixels natifs d’alpha 1–50 restent dans le fichier. Le PNG a été réellement ouvert à sa résolution native ; les quatre corps, l’optique et le corps couché sont lisibles et distincts. Cette revue ne remplace pas celle du rendu en jeu.

Les quatre dessins sont des poses clés fixes sous un seul angle, sans animation complète, huit directions, variante de fusil ou reconstruction canonique intégrale. Le geste `power` ne fournit aucun pouvoir, bouclier ou attaque supplémentaire. Les variations fines d’armure et d’arme restent générées et demandent une comparaison primaire plus complète. La famille conserve le statut **Prototype** ; aucune fidélité artistique 1:1 n’est certifiée.

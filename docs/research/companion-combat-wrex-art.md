# Urdnot Wrex — quatre poses clés de combat ME1

Le lot du 1er novembre 2026 ajoute [l’atlas transparent](../../public/assets/companion-wrex-combat.png) et [ses cadrages](../../public/assets/companion-wrex-animation.json) au statut **Prototype**. Il dérive de la case wrex `[768, 512, 384, 512]` du [crew-atlas existant](../../public/assets/crew-atlas.png), réellement ouvert avant génération. L’image de référence entière a été transmise à l’outil, sans extraction de pixels ; le prompt désigne la cellule exacte.

Wrex en armure rouge de ME1 : large silhouette krogan, bosse et épaules massives, visage beige, crête rouge, jambes courtes et lourdes protections segmentées. Le costume de référence existant demeure la direction de ce lot. Cette référence est une illustration générée pour le projet. Elle ne constitue pas une fiche de modèle primaire et ne certifie pas les détails du personnage original. Le lot ne revendique donc aucune fidélité intégrale 1:1.

Une requête réelle **image_gen.imagegen**, avec transparence native activée, a produit `exec-366fd5c1-ec42-4f53-bfbc-4d3d32f64037.png`. La sortie retenue est copiée **octet pour octet**, sans recadrage, redimensionnement, recoloration ni réécriture d’alpha. Les [prompts exacts](companion-combat-wrex-prompts.json) gardent le texte envoyé et l’empreinte de la sortie. SHA-256 du PNG livré :

```text
083f1ba93a63f7dd5043306b2d1b1b7b506c3fbf454b6ad1ba8e673229922e1a
```

La planche RGBA de **1536 × 1024** contient visée, geste de pouvoir neutre, recul d’impact et pose couchée, dans un angle trois-quarts fixe. Les quatre corps sont entiers et séparés. Les rectangles obtenus sont irréguliers ; la séparation s’appuie sur les pixels réellement visibles, avec une marge d’au moins huit pixels par côté au seuil alpha 0,2 du renderer.

| Pose | Rectangle en pixels | Pivot relatif | Hauteur relative |
|---|---|---|---:|
| aim | `[175,0,477,515]` | `[217,507]` | 1 |
| power | `[860,3,529,524]` | `[217,516]` | 1.02 |
| hit | `[192,522,482,484]` | `[251,476]` | 0.94 |
| down | `[792,719,680,265]` | `[340,257]` | 0.39 |

La hauteur couchée est un calibrage de présentation : elle garde une longueur de silhouette proche de la hauteur debout. Elle ne constitue pas une mesure anatomique du modèle original. Les pivots suivent les pieds, puis le contact inférieur du corps couché. Les détails d’armure et les proportions varient légèrement entre poses et restent à comparer aux références de ME1.

Le fusil illustré est générique et ne représente pas le modèle d’arme équipé. Le geste de pouvoir ne contient ni projectile, ni aura ou effet de capacité incorporé et n’accorde aucune compétence. Les quatre images ne sont ni un cycle complet, ni des transitions animées, ni de nouvelles directions de marche. L’exploration et les autres personnages conservent leurs assets existants.

Le [contrôle d’art](../qa/companion-combat-wrex-art-report.json) lit les PNG sans les modifier. Il vérifie dimensions, alpha réel, identité du fichier natif, conservation de la référence, quatre composantes visibles distinctes, cadrages, absence de pixels visibles partagés et pivots. L’atlas livré a également été ouvert en entier pour examen visuel. Le comptage relève 1 084 905 pixels totalement transparents, 41 186 pixels non nuls sous le seuil et 446 773 pixels au seuil de rendu ou au-dessus. Des franges et traces extérieures de faible opacité subsistent sous le seuil de rendu : aucun nettoyage parfait du fichier source n’est déclaré.

```bash
python scripts/check-companion-combat-garrus-wrex.py
```

Ce contrôle demande Pillow, NumPy et SciPy. Il écrit deux nouveaux rapports et ne modifie aucun PNG. La comparaison octet pour octet au fichier de génération est exécutée lorsque ce fichier temporaire est encore présent ; les empreintes du PNG et du prompt restent contrôlées lors des reprises.

La revue dans le renderer, les parcours de campagne, le build de distribution et la synchronisation du suivi sont des preuves séparées produites par l’intégration du lot. Le présent contrôle ne les présente pas comme déjà exécutés. Le guide [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md), réellement téléchargé et lu à sa révision épinglée, a servi à conserver la famille visuelle, consigner la provenance et séparer contrôles techniques, observation en jeu et conformité artistique.

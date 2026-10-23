# Shepard femme — atlas de marche et poses de combat

Livraison du 23 octobre 2026, préparée à partir du dépôt `27daea0`. Statut artistique : **Prototype**. Les images sont des créations générées pour Relay Chronicles, pas des extractions des jeux BioWare.

## Références et intention

L'identité et le traitement graphique reprennent la Shepard du coin supérieur gauche de `public/assets/npc-atlas.png` : cheveux roux courts, armure N7 sombre, bandes rouges et blanches, proportions réalistes. L'apparence féminine par défaut de Mass Effect 3 est proposée dans les trois épisodes de Legendary Edition, selon le [communiqué officiel EA du 2 février 2021](https://news.ea.com/press-releases/press-releases-details/2021/Relive-the-Award-Winning-Space-Opera-in-Mass-Effect-Legendary-Edition-on-May-14/), consulté le 23 octobre 2026. Cette référence d'apparence ne valide pas chaque détail d'armure comme une reproduction de ME1 original.

Les deux images livrées ont été produites avec l'outil intégré **imagegen**, fond transparent demandé, puis copiées à l'identique dans le projet. Aucun détourage, repeint, changement de taille ni assemblage programmatique n'a été appliqué aux PNG.

## Fichiers

| Fichier | Dimensions | Taille | SHA-256 |
|---|---:|---:|---|
| `public/assets/shepard-female-walk-atlas.png` | 1254 × 1254 | 979 680 octets | `094d70bbdbc91aec8ec45a9d1ed779dd46176d68bd7e186e34ba404fa39484cc` |
| `public/assets/shepard-female-combat-atlas.png` | 1536 × 1024 | 1 732 207 octets | `0110415a01fa9805694b03e247e8cd6476080df397cc6a74dda76d00d674bdf0` |
| `public/assets/shepard-female-animation.json` | 16 frames et 4 poses | Métadonnées | Rectangles, pivots et proportions |

La clé de personnage est `femshep`, déjà définie dans `src/commander.js`. Le fichier JSON est l'autorité pour les rectangles : la génération n'a pas produit une grille de cellules régulières. Les coordonnées sont en pixels, depuis le coin supérieur gauche de l'image. Les pivots sont relatifs au rectangle découpé, avec l'ancrage au sol en bas du personnage.

### Marche

Quatre orientations, dans l'ordre `front`, `back`, `right`, `left`, et quatre images par orientation. La cadence proposée est de 7 images par seconde. Le cycle alterne des silhouettes de contact et de passage. Les images 0 et 2 restent similaires dans certaines orientations : cette animation nécessite encore une passe d'animation manuelle pour un cycle naturel définitif. Les rectangles conservent la totalité du corps et les pieds ; leur proportion doit être utilisée par le renderer.

### Combat

| Pose | Rectangle x, y, largeur, hauteur | Pivot x, y | Hauteur relative |
|---|---|---|---:|
| `aim` | 214, 19, 436, 549 | 195, 549 | 1 |
| `power` | 916, 28, 507, 550 | 188, 544 | 1 |
| `hit` | 307, 568, 296, 437 | 153, 431 | 0,8 |
| `down` | 734, 850, 698, 136 | 349, 130 | 0,245 |

La pose couchée possède son dessin horizontal. Elle doit utiliser sa hauteur relative et ne pas recevoir la rotation procédurale qui couche les autres sprites. Les quatre images sont des poses clés ; elles ne forment pas quatre animations complètes. La pose de tir montre un fusil de prototype, sans variante visuelle par arme équipée. La pose de pouvoir possède un effet bleu générique ; elle ne représente pas la gestuelle canonique de chaque pouvoir.

## Contrôles effectués

- Inspection visuelle des deux images retenues, avec comparaison au personnage du prototype.
- Fichiers PNG RGBA natifs. La marche contient 76,72 % de pixels totalement transparents et le combat 77,57 %.
- Les 20 rectangles sont à l'intérieur de leur image et les 20 pivots sont dans leurs rectangles.
- Au seuil alpha 51/255 utilisé pour contrôler les silhouettes visibles, chaque rectangle contient exactement un composant de personnage de plus de 1 000 pixels, sans personnage voisin.
- Les rectangles de `aim` et `hit` sont séparés précisément à Y = 568 pour exclure les pieds de la pose supérieure et les cheveux de la pose inférieure.
- La fidélité au visage, à l'équipement et à la gestuelle canonique reste à valider contre des vues approuvées de l'épisode. Aucune certification 1:1 n'est revendiquée.

## Prompts de production

### Premier candidat de marche, non livré

Référence : `npc-atlas.png`. Sortie : `exec-e7cfcf4b-e98e-476a-a7d6-32dc78effa02.png`. Le contrôle a relevé une marge supérieure insuffisante et des poses trop proches. Ce candidat n'est pas utilisé par le jeu.

> Use case: stylized-concept. Asset type: production 2D game walk-cycle sprite sheet on genuine transparent alpha background. Reference image is a STYLE AND CHARACTER REFERENCE ONLY: use ONLY female Commander Shepard at the TOP LEFT, ignore the other seven characters. Create one high-resolution square 4-column by 4-row sprite sheet containing exactly 16 full-body poses of that same adult red-haired female Commander Shepard in her dark Mass Effect N7 Alliance combat armor. Preserve her identity, proportions, short red bob, charcoal segmented armor, white/red right-arm stripe, small N7 chest mark, dark boots. Modern polished realistic hand-painted game sprite quality, consistent soft frontal lighting, no helmet, no gun in hands. Each sprite is isolated and entirely visible from hair to soles with generous transparent padding. Uniform orthographic camera and constant body scale, no floor, no shadows outside body, no scenery, no lines or labels, no cell borders, no text except the small N7 armor mark. ALL 16 figures must be arranged within their own equal square cells without overlap. Row 1 faces three-quarter FRONT toward viewer: four sequential walking frames left-foot contact, passing pose, right-foot contact, opposite passing pose. Row 2 faces three-quarter BACK away from viewer: the same four walking phases. Row 3 faces RIGHT in profile: the same four phases, visibly alternating legs and opposite arm swing. Row 4 faces LEFT in profile: the same four phases. The walk must be an actual alternating left-right cycle, not sixteen identical standing poses. Feet stay on the same baseline within each row; head height and costume remain consistent. Exactly four figures per row and exactly four rows; each cell has at least 24 pixels of transparent margin. Transparent background must be real alpha, not a checkerboard pattern.

### Marche retenue

Référence : candidat précédent. Sortie : `exec-d315e179-5190-4bc4-af1f-872a6884e4dc.png`.

> Edit the attached sprite sheet into a usable walking animation. Keep the exact same red-haired female Shepard identity, dark N7 armor, colors, visual style and four directional rows. CRITICAL CHANGES: reduce every figure's size about 15% so every head and both feet are fully inside its cell with substantial empty transparent padding above and below. Put them in a strict evenly spaced 4 by 4 square grid. Create a genuinely different pose in every column instead of repeated strides. In EACH ROW: column 1 = wide stride with physical LEFT foot planted FORWARD, physical RIGHT foot behind, physical RIGHT hand forward; column 2 = passing position with feet TOGETHER under the body, physical RIGHT knee raised and passing the left leg; column 3 = the opposite wide stride, physical RIGHT foot planted FORWARD, physical LEFT foot behind, physical LEFT hand forward; column 4 = other passing pose with feet TOGETHER under the body, physical LEFT knee raised and passing the right leg. Columns 2 and 4 must have a narrow leg silhouette, columns 1 and 3 a wide leg silhouette; no adjacent columns can repeat the same limb position. All rows use those four sequential phases. Row 1 faces front three-quarter, row 2 back three-quarter, row 3 right profile, row 4 left profile. Bodies upright and same scale; same head and feet baseline in each row. No changes to her outfit, no extra weapons, no other subjects, no written labels or cell lines. Preserve a genuinely transparent alpha background. Full figure from top of hair to sole never cropped. Isolated figures must not touch the adjacent row.

### Combat retenu

Référence : marche retenue. Sortie : `exec-a254c1a1-8931-46b7-9703-6519d686e7d9.png`.

> Use case: stylized-concept. Asset type: 2D game COMBAT POSE ATLAS with real transparent alpha. The attached walk sheet is a character/style reference: portray exactly the same red-haired female Commander Shepard, same face, haircut, realistic proportions, dark charcoal segmented N7 armor, red-and-white arm stripe and dark boots. Create precisely FOUR separate full-body cutouts in a clean 2-column by 2-row landscape atlas, each within its own generous cell; no labels, no grid lines, no backdrop, no ground or floor shadow. TOP LEFT: aim pose, facing right in three-quarter profile, upright legs apart, shouldering a compact futuristic rifle in BOTH hands aimed toward screen right. TOP RIGHT: power pose, same facing direction, right hand extended toward screen right casting a compact pale blue biotic glow around her hand; left hand near chest, feet apart. BOTTOM LEFT: hit reaction pose, same body orientation, recoiling slightly backward, knees bent with one hand bracing torso, expression of impact but no blood; approximately 80% of standing height. BOTTOM RIGHT: defeated/down pose, same character lying fully horizontally on her back, hair/head at left and boots at right, knees almost straight, arms resting naturally, eyes closed; complete body visible from hair to toes. The down figure must have a normal full body length and horizontal silhouette with only about one quarter the height of a standing figure. Keep the same physical SCALE across poses (not filling each square to the same height). Each standing figure is fully visible from hair to soles with at least 40 pixels padding. Entire rifle and glow visible; hands anatomically correct. Modern polished realistic game-sprite style matching reference with consistent soft frontal light. No caption, no numbered labels, no watermark, no other characters. Genuine transparent background preserved.

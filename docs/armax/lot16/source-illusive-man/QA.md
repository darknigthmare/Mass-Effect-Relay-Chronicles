# QA — deux candidats Homme Trouble ME2

Revue de production du 25 novembre 2026, sur le dépôt de base `71955d9143562d6a44a8b8d48bc552978372bc1e`. Cette revue porte sur les fichiers natifs et leurs références visibles. Elle ne certifie ni la fidélité 1:1 ni une utilisation en moteur.

## Fichiers et transparence

| Contrôle | Fauteuil vide | Homme Trouble assis |
| --- | --- | --- |
| Dimensions | 1024 × 1536 | 1024 × 1536 |
| Mode | RGBA | RGBA |
| Alpha min–max | 0–254 | 0–254 |
| Pixels alpha = 0 | 1 165 673 | 927 584 |
| Pixels alpha = 255 | 0 | 0 |
| Rectangle alpha ≥ 128, coordonnées exclusives à droite/bas | (37, 290)–(975, 1358) | (34, 92)–(979, 1399) |
| Marges de silhouette alpha ≥ 128, gauche/haut/droite/bas | 37 / 290 / 49 / 178 px | 34 / 92 / 45 / 137 px |
| Copie identique à la sortie native | Oui, SHA-256 identique | Oui, SHA-256 identique |

Le fond contient bien des pixels transparents ; il ne s’agit pas d’un damier peint dans un RGB. Les surfaces visibles sont essentiellement à alpha 240–254. Les rendus natifs n’ont aucun pixel à alpha 255. Des résidus très faibles, alpha 1, touchent les bords gauche et bas, malgré les marges de la silhouette utile. Le rectangle de tout alpha non nul est donc plus large que celui du sujet. Aucun seuil, matte, détourage ou réencodage n’a été appliqué pour masquer cette réserve.

Le fauteuil a été inspecté en vue native et sur un fond clair de contrôle, créé uniquement hors dépôt. La sortie assise a été inspectée dans sa vue native complète et comparée au fauteuil vide et aux références. Les mesures ci-dessus proviennent de Pillow, en lecture des PNG ; les SHA-256 ont été calculés sur les octets natifs et copiés.

## Fauteuil vide — observations

- Un seul fauteuil, vide, entier, orienté en trois-quarts avant vers la droite de l’image.
- Cadre argenté ouvert, accoudoirs étroits avec coussinets sombres, patins longitudinaux et diagonales reconnaissables. Aucun piédestal de bureau, roue ou base carrelée.
- Assise sombre et dossier noir à rainures. Ce dossier, la large traverse haute et les parties non visibles dans la capture sont des reconstitutions, pas des détails prouvés du jeu final.
- Le petit inset/cendrier visible sur certaines photos officielles de la statuette n’est pas identifiable dans le rendu. Aucun contrôle d’échelle physique n’a été réalisé.

## Pose assise — observations

- Proportions adultes, visage et costume cohérents avec la direction du prototype debout lot13 : costume noir, col et plastron gris, cheveux foncés grisonnants, chaussures noires.
- Tête, deux mains, deux chaussures et appuis apparents du fauteuil complets dans le cadre. Une jambe est croisée en travers, l’autre est abaissée ; une main repose sur l’accoudoir proche et l’autre tient une cigarette levée.
- Le bassin paraît porté par l’assise ; les bras ont des appuis visuellement plausibles. Le croisement produit n’est pas certifié comme copie exacte de la pose cheville-sur-genou demandée.
- Les iris sont bleus et discrets. Leur structure cybernétique précise et la fidélité du visage ne sont pas validées 1:1.
- Aucun fond, étoile, logo, base carrelée, effet de mouvement ou planche d’animation n’est demandé comme élément du livrable.

## Comparaison des deux fauteuils

La sortie assise a été générée avec le fauteuil vide comme première référence et cible d’édition. Les matériaux, la traverse haute et la famille du piètement sont proches, mais l’assise et les accoudoirs sont déplacés vers le bas, et les terminaisons d’appuis ont changé de position. Ce n’est pas une conservation rigide de la géométrie ni du placement en pixels.

Décision : **candidats non compatibles pour un assemblage direct**, `assemblyCompatible: false`, `pixelRegistered: false`. Chaque PNG est une illustration autonome. Aucun montage du personnage sur le fauteuil vide, ni substitution par calques, n’est promis.

## Limites de la revue

- La capture du jeu utilisée est une image de presse de décembre 2009 ; aucun modèle final extrait n’a servi de mesure géométrique.
- Les photos BioWare montrent un produit sous licence ; leur fonction est secondaire et ne transforme pas la reconstitution en asset canonique exact.
- La planche Troodon et le sprite debout ne prouvent pas le fauteuil. Le sprite debout reste lui-même un prototype généré.
- Pas de revue en moteur, d’échelle réelle en scène, d’ancrage, de collision, de texture UV, d’animation ou de lisibilité en combat.
- Deux appels de génération, deux candidats conservés, aucune retouche supplémentaire. Aucun refus de génération rencontré ou relancé.
- Les statuts demeurent `Prototype`, `fidelity1to1Validated: false`, `engineIntegrated: false`.

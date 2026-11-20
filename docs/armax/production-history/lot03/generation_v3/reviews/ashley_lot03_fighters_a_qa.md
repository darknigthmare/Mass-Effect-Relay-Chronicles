# Ashley Williams — contrôle lot 03

**Verdict : pose concept conservée avec réserves. Fidélité 1:1 non validée.**

Une seule silhouette entière orientée vers la droite. Image statique ; aucun rig, aucune animation, aucun pivot ni test moteur livrés.

## Identité et costume

Ashley est reconnaissable par la coiffure, le profil et la tenue. Le visage produit reste une interprétation, avec un nez et un menton affinés et une texture de peau plus photographique que le modèle du guide.

Tenue bleue à col haut du guide EA Legendary Edition : tunique, épaulières à disques, gants bleus, ceinture et bottes à talons. Aucune variante lourde N7 substituée.

- Répartition cobalt/noir, anneaux d'épaules, bande centrale de tunique et parties bleues des bottes conservés.
- Le bout des bottes est plus arrondi et les talons paraissent plus épais que sur les vues officielles.
- Les petites attaches pectorales et les tracés courbes des coutures sont redessinés ; leur géométrie n'est pas identique pixel à pixel.

## Asymétrie et appuis

Le disque de hanche visible est conservé. Les vues trois quarts du guide montrent du matériel circulaire de part et d'autre : sa présence du côté proche ne suffit pas à conclure à une inversion. Le côté éloigné est masqué et n'est pas validé.

Les deux bottes sont entières, mais leurs points bas sont décalés en perspective. Aucun pivot commun, axe de contact ou plan au sol de combat 2D n'est défini.

## Transparence et cadrage

PNG 1024 × 1536, RGBA, alpha 0–254. Pixels totalement transparents : 75.158 %. Pixels alpha 1–15 : 1.436 %.

Marges au seuil alpha ≥ 16 : gauche 210 px ; haut 23 px ; droite 185 px ; bas 28 px. Aucune extrémité coupée, mais la cible de marge verticale de 8–9 % n'est pas atteinte.

Les valeurs RGB sous alpha 0 sont invisibles. La présence de noir ou de lueurs colorées dans ces pixels ne constitue pas un arrière-plan opaque. Les faibles valeurs d'alpha aux bords devront être contrôlées sur les fonds du jeu.

Copie de travail identique à l'original selon SHA-256. Aucun pixel modifié.

## Corrections prioritaires

- Augmenter la marge verticale avant placement dans un atlas.
- Vérifier sur le modèle source la forme des talons, des bouts de bottes, des attaches pectorales et des disques de ceinture.
- Recaler les appuis et produire les poses d'animation séparément.

## Références

- https://www.ea.com/games/mass-effect/community/cosplay-guides
- https://media.contentapi.ea.com/content/dam/eacom/mass-effect-legendary-edition/cosplay-guides/mele-cosplayguide-ashleywilliams-final-pdf.zip

Fichier : `/workspace/scratch/c3ca3f19d191/outputs/mass-effect/lot03/assets/fighters/ashley/ashley_pose_right_v1.png`

SHA-256 : `d4f2c5fb85ff7e4e52b865493b77af41d2fb87be0b0478e713c76c7053557b67`

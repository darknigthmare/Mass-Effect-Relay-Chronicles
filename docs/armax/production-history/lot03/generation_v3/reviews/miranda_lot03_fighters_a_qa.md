# Miranda Lawson — contrôle lot 03

**Verdict : pose concept conservée avec réserves. Fidélité 1:1 non validée.**

Une seule silhouette entière orientée vers la droite. Image statique ; aucun rig, aucune animation, aucun pivot ni test moteur livrés.

## Identité et costume

Miranda est reconnaissable par la tenue, les cheveux bruns et les yeux bleus. Les traits sont adoucis et la coiffure est rendue plus ondulée que le modèle de référence.

Combinaison blanche à motif hexagonal et sections noires du guide EA Legendary Edition ; double sangle de hanches, gants blanc/noir et hautes bottes noires à talons.

- Répartition blanche/noire, collier noir, gants et harnais de hanches conservés.
- Le maillage hexagonal paraît agrandi et plus contrasté sur le buste et les cuisses ; son échelle n'est pas verrouillée sur celle de la texture du jeu.
- Les coutures blanches du buste, les petits emblèmes d'épaules et les pièces métalliques des bottes sont retracés.

## Asymétrie et appuis

La double sangle reste dissymétrique et lisible ; la pose ne montre pas tout son cheminement arrière. Les petites boucles ne sont pas validées une à une.

Pose statique de présentation à peine fléchie ; mains dégagées et deux talons visibles. Le pied éloigné est plus haut dans l'image et aucun repère de sol/pivot n'est livré.

## Transparence et cadrage

PNG 1024 × 1536, RGBA, alpha 0–254. Pixels totalement transparents : 80.366 %. Pixels alpha 1–15 : 1.119 %.

Marges au seuil alpha ≥ 16 : gauche 270 px ; haut 81 px ; droite 258 px ; bas 76 px. Aucune extrémité coupée, mais la cible de marge verticale de 8–9 % n'est pas atteinte.

Les valeurs RGB sous alpha 0 sont invisibles. La présence de noir ou de lueurs colorées dans ces pixels ne constitue pas un arrière-plan opaque. Les faibles valeurs d'alpha aux bords devront être contrôlées sur les fonds du jeu.

Copie de travail identique à l'original selon SHA-256. Aucun pixel modifié.

## Corrections prioritaires

- Normaliser les marges pour l'atlas.
- Comparer l'échelle du motif hexagonal et les emblèmes à la texture officielle.
- Définir une garde, un pivot et les appuis avant déclinaisons animées.

## Références

- https://www.ea.com/games/mass-effect/community/cosplay-guides
- https://media.contentapi.ea.com/content/dam/eacom/mass-effect-legendary-edition/cosplay-guides/mele-cosplayguide-mirandalawson-final-pdf.zip

Fichier : `/workspace/scratch/c3ca3f19d191/outputs/mass-effect/lot03/assets/fighters/miranda/miranda_pose_right_v1.png`

SHA-256 : `b0edc37a53ea85e897d455eb90a477937ccead63d48ec17db37c8d7af17255f4`

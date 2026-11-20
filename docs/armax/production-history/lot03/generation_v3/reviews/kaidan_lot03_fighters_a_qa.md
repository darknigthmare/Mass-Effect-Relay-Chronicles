# Kaidan Alenko — contrôle lot 03

**Verdict : pose concept conservée avec réserves. Fidélité 1:1 non validée.**

Une seule silhouette entière orientée vers la droite. Image statique ; aucun rig, aucune animation, aucun pivot ni test moteur livrés.

## Identité et costume

Visage, cheveux noirs et silhouette de Kaidan reconnaissables. Le front et la mâchoire sont réinterprétés ; la chevelure obtenue est plus ondulée que la masse courte et dressée du guide.

Armure cobalt/bleu nuit du guide EA Legendary Edition, doubles filets blancs, sous-combinaison noire, gants articulés et plaques de jambes bleues.

- Couleurs, doubles bandes blanches sur torse/épaules/tibias et touches jaunes au col conservées.
- La plaque pectorale est plus anguleuse et sa bordure inférieure plus épaisse que sur le guide.
- Les détails des gants, les fixations de cuisse et le dessin des articulations de genoux sont recomposés.

## Asymétrie et appuis

Les doubles bandes restent lisibles et aucun logo N7 n'a été ajouté. La pose cache une partie du flanc éloigné ; la correspondance arrière et les petites fixations asymétriques ne sont pas validées.

La reprise neutre a produit une posture de présentation presque droite, mains basses, et non une garde de combat. Les deux semelles sont décalées en perspective ; l'ancrage 2D reste à définir.

## Transparence et cadrage

PNG 1024 × 1536, RGBA, alpha 0–254. Pixels totalement transparents : 72.716 %. Pixels alpha 1–15 : 1.001 %.

Marges au seuil alpha ≥ 16 : gauche 289 px ; haut 39 px ; droite 265 px ; bas 30 px. Aucune extrémité coupée, mais la cible de marge verticale de 8–9 % n'est pas atteinte.

Les valeurs RGB sous alpha 0 sont invisibles. La présence de noir ou de lueurs colorées dans ces pixels ne constitue pas un arrière-plan opaque. Les faibles valeurs d'alpha aux bords devront être contrôlées sur les fonds du jeu.

Copie de travail identique à l'original selon SHA-256. Aucun pixel modifié.

## Corrections prioritaires

- Élargir les marges haute et basse.
- Recontrôler contour du plastron, genoux et gants au guide.
- Créer une vraie garde et définir le pivot avant animation.

## Références

- https://www.ea.com/games/mass-effect/community/cosplay-guides
- https://media.contentapi.ea.com/content/dam/eacom/mass-effect-legendary-edition/cosplay-guides/mele-cosplayguide-kaidanalenko-final-pdf.zip

Fichier : `/workspace/scratch/c3ca3f19d191/outputs/mass-effect/lot03/assets/fighters/kaidan/kaidan_pose_right_v1.png`

SHA-256 : `ad88add7a1b3b36e45ca1ead77ea7292becacaec25753a81b504e818c8f9916c`

Premier essai refusé au stade output par le générateur ; une unique reprise neutre a réussi. Les deux tentatives sont conservées.

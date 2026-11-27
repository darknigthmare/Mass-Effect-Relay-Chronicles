# Revue visuelle des vingt bases de FX — Nacre

Date : 27 novembre 2026.

Les vingt images natives retournées ont été ouvertes et relues individuellement. Elles proposent des effets cinétiques, biotiques, thermiques, cryogéniques et techniques cohérents avec la palette de l’extension. Chaque identité possède une seule base représentative. Les 79 phases prévues dans la bible ne sont pas produites comme 79 frames distinctes.

## Observations par image

| ID | Nom | Observation |
| --- | --- | --- |
| `nacre_fx_01` | Trace d'accélérateur | Trace cyan dirigée vers la droite ; noyau lisible, traînée vers la gauche. |
| `nacre_fx_02` | Gerbe cinétique courte | Particule métallique isolée dirigée vers la droite ; la gerbe de trajectoires reste à assembler par le moteur. |
| `nacre_fx_03` | Flamme de bouche | Flamme de bouche isolée ; le point d'émission est à gauche. |
| `nacre_fx_04` | Arc de surcharge | Arc cyan complet, avec extrémités lisibles ; placement entre émetteur et cible à définir. |
| `nacre_fx_05` | Impulsion biotique | Noyau biotique à gauche et traînée à droite ; miroir nécessaire pour un projectile allant vers la droite. |
| `nacre_fx_06` | Ride de barrière | Ondulation de barrière cyan ; halo étendu et transparence du corps à contrôler en composition de jeu. |
| `nacre_fx_07` | Recharge d'émetteur | Base d'émetteur et anneaux de recharge dans une même image ; séparation matérielle/effet encore nécessaire pour l'animation. |
| `nacre_fx_08` | Capsule de refroidissement | Capsule de refroidissement dirigée vers la droite ; traînée froide incluse dans cette base. |
| `nacre_fx_09` | Cristallisation locale | Groupe de cristaux localisé avec vapeur ; apparition et dissipation ne sont pas produites. |
| `nacre_fx_10` | Trait de découpe | Trait thermique court, avec foyer clair à gauche ; ancrage à l'outil à définir. |
| `nacre_fx_11` | Jet thermique | Jet thermique allongé ; origine étroite à gauche, panache à droite. Opacité et largeur doivent préserver la lecture du combat. |
| `nacre_fx_12` | Écran de fumée | Nuage de fumée complet mais occupant largement le cadre ; la durée, la densité et la lisibilité des silhouettes restent à régler. |
| `nacre_fx_13` | Cône de détection | Cône cyan avec émetteur et pictogramme intégrés ; éléments à séparer avant un balayage animé. |
| `nacre_fx_14` | Décharge de contact | Décharge cyan circulaire ; effet de contact autonome, sans corps ni arme. |
| `nacre_fx_15` | Balise à impulsion | Balise verticale ambrée avec anneau de sol ; le déploiement et l'impulsion ne sont pas des frames séparées. |
| `nacre_fx_16` | Grappin de fret | Grappin et câble assemblés ; tête à gauche. La déformation du câble reste à implémenter. |
| `nacre_fx_17` | Éclats de tôle | Un éclat de tôle chauffé ; variété et trajectoires supplémentaires non produites. |
| `nacre_fx_18` | Purge de vapeur | Purge blanche dirigée de gauche à droite ; l'opacité doit être contrôlée pour ne pas masquer la défense. |
| `nacre_fx_19` | Ancrage de champ | Ancrage bleu-violet avec zone au sol et émetteur inclus ; cercle et corps ne sont pas séparés. |
| `nacre_fx_20` | Validation de preuve | Signal ambré de validation de preuve ; pictogramme documentaire et halo dans une image fixe. |

## Raccordements et limites

Trois images sont prévues pour les textures optionnelles du prototype : FX01 pour le tir cinétique, FX05 pour la biotique et FX15 pour un piège ou une zone. Leur présence ne prouve pas leur affichage dans le navigateur. Le renderer doit préserver le rapport largeur/hauteur, retourner FX05 selon sa direction native opposée à FX01 et conserver les collisions indépendantes du dessin.

Les halos, zones de fumée et éléments matériels sont parfois assemblés dans la même base. Les composants à animer, attaches, impacts, apparitions et dissipations restent à séparer. Les valeurs d’opacité, le détourage des pixels faibles, l’échelle, le contraste clair/sombre et l’occultation des combattants demandent une validation dans le rendu réel.

Les dimensions ont été lues dans les en-têtes PNG des octets natifs : aucun agrandissement ou réencodage n’a été effectué. Les vingt PNG disposent d’un canal alpha. Les extrema et limites alpha >32 et >128 ont ensuite été mesurés avec Pillow, ainsi que les SHA-256, sur les vingt fichiers natifs. Tous possèdent des pixels entièrement transparents. Cela ne certifie pas à lui seul la qualité du détourage en situation. Aucun de ces fichiers n’est une image UHD native de 3840 × 2160 ou plus.

La revue confirme la présence des bases et leurs orientations observées. Elle ne certifie ni fidélité 1:1, ni animation complète, ni intégration moteur, ni validation officielle.

# Lot 08 — quatre décors supplémentaires

Ces quatre PNG sont des **masters aplatis au statut Prototype**. Les références du bon opus ont été inspectées et comparées aux sorties. Aucune fidélité 1:1, intégration en moteur ni séparation en calques n’est déclarée.

Base du travail : `c8bbc3321feb08c85d799211d27b217c94357bed`. Génération : 2026-11-20, avec le générateur d’images intégré. Une tentative par sujet, quatre succès, aucun refus et aucune nouvelle tentative.

| ID du catalogue | Sous-zone représentée | Fichier | Dimensions |
|---|---|---|---|
| `stg_me3_mars_archives` | Mars — archives, galerie intérieure | [mars-me3-archives-gallery-master.png](../../../public/assets/armax/lot08/stages/mars-me3-archives-gallery-master.png) | 1672 × 941 |
| `stg_mea_kadara_market` | Kadara — marché | [kadara-mea-market-master.png](../../../public/assets/armax/lot08/stages/kadara-mea-market-master.png) | 1672 × 941 |
| `stg_mea_eos_vault` | Eos — caveau reliquat, salle de réactivation | [eos-mea-vault-heart-master.png](../../../public/assets/armax/lot08/stages/eos-mea-vault-heart-master.png) | 1672 × 941 |
| `stg_me2_pragia_facility` | Pragia — centre de recherche, salle envahie de végétation | [pragia-me2-facility-overgrown-master.png](../../../public/assets/armax/lot08/stages/pragia-me2-facility-overgrown-master.png) | 1672 × 941 |

## Références et écarts

### Mars — archives, galerie intérieure

Référence principale : [Neil McKnight](https://neilmcknight.artstation.com/projects/2L9gg). Une vue de la galerie intérieure de l'installation, publiée par son artiste. Elle ne décrit pas toutes les salles des archives ni leur topologie complète.

Galerie de Mars ME3 : plafond bas, nervures inclinées, insert rouge à gauche, supports courbes, boîtier angulaire et baie oblongue à droite reconnaissables.

- L'escalier et la fosse visibles au premier plan de la référence ne sont pas repris dans le master ; le sol a été nivelé et prolongé pour le duel.
- Vue davantage frontale : profondeur, dimensions de la baie, garde-corps et raccords des panneaux redessinés ; géométrie 1:1 non validée.
- Éclairage et matériau du sol plus réguliers ; échelle des combattants et contraste sur cette galerie sombre à vérifier en moteur.

### Kadara — marché

Référence principale : [Paul Haskins](https://phaskins.artstation.com/projects/YEOwq). Une vue publiée et explicitement titrée Kadara Market par l'artiste ; les façades cachées et l'emprise du sol hors champ ne sont pas documentées.

Vue Kadara Market : modules commerciaux superposés, surplombs rocheux orangés, grande bâche bleue avec filet, poteau à anneaux, câbles, rampe et contraste chaud/cyan conservés.

- Bande de sol étendue vers l'avant pour le duel ; répartition des caisses et petits accessoires adaptée aux bords de l'image.
- Glyphes des enseignes, motif de la bâche, détails des façades et câbles redessinés ; ces motifs ne sont pas des reproductions exactes.
- Habitants et véhicules retirés ; reflets, vapeur et néons incorporés au master sans animation. Intensité des reflets plus forte que dans la capture.

### Eos — caveau reliquat, salle de réactivation

Référence principale : [Jonathon Banks](https://jbbanks.artstation.com/projects/l2LJz). La vue principale est plongeante et la seconde montre la chambre à distance. Le point de vue de duel et le tracé de la bande de premier plan sont une reconstruction, pas une capture de cette caméra en jeu.

Salle du cœur du caveau : pyramides à lamelles, traces vertes, faisceau bleu-blanc, récepteur polygonal et ferrofluide repris des deux vues du niveau.

- Adaptation importante de la caméra et du premier plan : la bande rectiligne de combat est reconstruite et son tracé exact n'est pas établi par les captures.
- Le nombre et l'espacement des lamelles, les circuits lumineux et les proportions du récepteur sont redessinés ; fidélité géométrique 1:1 non validée.
- Vue encore surélevée et contraste très fort autour du faisceau ; perspective des sprites et lisibilité des silhouettes restent à tester en moteur.
- Faisceau, reflets du ferrofluide et brume figés dans le master ; aucun calque ni cycle de réactivation livré.

### Pragia — centre de recherche, salle envahie de végétation

Référence principale : [Neil McKnight](https://neilmcknight.artstation.com/projects/egloX). Une vue du centre de recherche publiée par son créateur de niveau ; elle ne certifie ni le plan complet ni la position de chaque racine et équipement.

Salle de Pragia : grandes parois métalliques claires et nervurées, passerelle gauche, groupe de boîtiers anguleux, tronc courbe droit, racines et toit envahi de végétation conservés.

- Premier plan élargi et sol recomposé ; grosses racines reportées derrière la bande de duel, éclats et dalles redistribués.
- Canopée, ramifications, panneaux et volumes des boîtiers redessinés ; implantation exacte non validée.
- Exposition légèrement relevée pour lire les contours ; pluie, lumière et végétation sont figées dans un seul master.

## Traçabilité et vérification

- [Manifeste des quatre décors](stages-manifest.json) : chemins, dimensions, SHA256, sources, auteurs et réserves.
- [Prompts exacts](stages-generation-prompts.json) : consignes et chemins des images de référence transmises au générateur.
- [Journal des tentatives](stages-attempts.json) : sorties originales et état de chaque tentative.
- [Rapport technique ciblé](stages-verification.json) : décodage des PNG, correspondance aux sorties originales, IDs et empreintes.

Les quatre fichiers sont décodables et distincts entre eux. Le contrôle historique de ce rapport est **partiel** : aucune collision parmi les 46 empreintes reconnues par son collecteur. Pour le contrôle complet des 102 SHA précédents (86 fichiers récupérés, 6 du lot 06 et 10 du lot 07), consulter le [rapport global](verification.json), produit par `scripts/verify-armax-lot08.py`. Les copies de livraison sont identiques aux sorties originales. Les images tierces de recherche ne sont pas incluses dans le dépôt.

Le plan de combat a été adapté dans chacun des masters. La caméra et le premier plan d’Eos sont la reconstruction la plus importante de ce lot. Une validation en jeu reste nécessaire avant de définir les pivots, l’échelle des sprites, les collisions et les limites de caméra.

## Sujets examinés mais non produits

Le cœur du cuirassé geth et la station Atlas n’ont pas été générés : les portfolios consultés n’établissaient pas assez précisément les sous-zones cataloguées. Bekenstein reste en attente d’une vue exacte de la terrasse ; le portfolio Kasumi trouvé montre le coffre et la base souterraine. Aucun de ces sujets ne compte comme image produite dans ce lot.

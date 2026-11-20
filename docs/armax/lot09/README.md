# Armax — lot 09, poursuite des manquants

Continuation du **20 novembre 2026**, depuis `main` au commit `563aab682f7a695b20a774adfee48fe696471ce0`, après fusion de la [PR nº 5](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/pull/5). Ce lot conserve le chantier P0 déjà présent dans cette base et poursuit la production artistique du mode annexe.

**Douze fiches supplémentaires disposent d’une image candidate** : cinq ennemis, Hackett, deux costumes et quatre stages. **Quatorze PNG** sont livrés : douze versions sélectionnées et deux premières versions conservées après correction du lettrage. Le catalogue garde exactement les **164 identifiants** du lot 08 ; les fiches sans image passent de **141 à 129**. Le corpus atteint **126 PNG originaux distincts**, hors trois aperçus historiques de contrôle.

## Images sélectionnées

| Catégorie | Sujet et version | Image |
|---|---|---|
| Ennemi | Scion — modèle original ME2 | [Posture voûtée vers la droite](../../../public/assets/armax/lot09/fighters/scion-me2-three-quarter-right.png) |
| Ennemi | Ravager — ME3, sacs intacts | [Trois-quarts droit](../../../public/assets/armax/lot09/fighters/ravager-me3-three-quarter-right.png) |
| Ennemi | Cannibal — ME3, sans renfort temporaire | [État de base, trois-quarts droit](../../../public/assets/armax/lot09/fighters/cannibal-me3-base-three-quarter-right.png) |
| Ennemi | Banshee — ME3 | [Silhouette entière vers la droite](../../../public/assets/armax/lot09/fighters/banshee-me3-three-quarter-right.png) |
| Ennemi | Combat Engineer de Cerberus — ME3 | [Arme basse, trois-quarts droit](../../../public/assets/armax/lot09/fighters/combat-engineer-me3-three-quarter-right.png) |
| Personnage de soutien | Steven Hackett — uniforme ME3 | [Uniforme et casquette, trois-quarts droit](../../../public/assets/armax/lot09/fighters/hackett-me3-uniform-three-quarter-right.png) |
| Costume | Shepard masculin — Terminus Assault, ME2 | [Armure complète, R1](../../../public/assets/armax/lot09/costumes/shepard-male-me2-terminus-front-r1.png) |
| Costume | Shepard masculin — Inferno, ME2 | [Armure complète, trois-quarts droit](../../../public/assets/armax/lot09/costumes/shepard-male-me2-inferno-three-quarter-right.png) |
| Stage | Rannoch — base geth, passerelle ouverte sur le canyon, ME3 | [Master](../../../public/assets/armax/lot09/stages/rannoch-me3-geth-base-canyon-master.png) |
| Stage | Despoina — épave à la surface, ME3 Leviathan | [Master](../../../public/assets/armax/lot09/stages/despoina-me3-leviathan-wreck-master.png) |
| Stage | Havarl — seuil reliquat dans la jungle, Andromeda | [Master](../../../public/assets/armax/lot09/stages/havarl-mea-remnant-threshold-master.png) |
| Stage | Silversun Strip — promenade, ME3 Citadel | [Master R1](../../../public/assets/armax/lot09/stages/silversun-me3-promenade-master-r1.png) |

Les huit silhouettes sélectionnées sont individuelles et entières en PNG RGBA. Hackett conserve son rôle de narration et de soutien ; sa présence dans le dossier des personnages ne le déclare pas jouable. Les quatre décors sont des masters aplatis RGB de **1672 × 941** pixels. Les octets livrés sont identiques aux sorties correspondantes du générateur.

## Références et comparaison visuelle

Le [registre de références](reference-library.json) distingue les planches des artistes des captures de jeu et des visuels promotionnels. Le Scion provient de la planche ME2 de **Jaemus Wurzbach** ; Ravager, Cannibal et Hackett sont documentés dans l’entretien BioWare de ZBrushCentral et le portfolio de **Kolby Jukes**. Banshee et Combat Engineer sont comparés aux modèles publiés par **Rodrigue Pralier**. Les deux armures utilisent les visuels promotionnels EA/BioWare de ME2 reproduits par Gematsu ; la planche **Rion** apporte une seconde référence du casque, du torse et des bras de l’Inferno.

La [revue indépendante des personnages et costumes](character-art-review.json) vérifie les huit sujets et la première version Terminus. Les principales asymétries sont conservées : canon du Scion au bras gauche anatomique, canon du Cannibal au bras droit, voyant rouge de l’ingénieur à l’épaule gauche. Les canons et sacs du Ravager sont rapprochés de la vue choisie ; une patte reste masquée par cet angle et demande une autre vue avant animation.

Deux erreurs de lettrage ont déclenché une correction ciblée :

- **Terminus** : R0 portait « M86 » sur l’accessoire ; R1 lit « M88 », comme sur l’image promotionnelle. [R0 conservée](../../../public/assets/armax/lot09/costumes/shepard-male-me2-terminus-front.png).
- **Silversun** : les deux colonnes du grand panneau vertical lisent désormais « CASTLE / ARCADE ». Une petite répétition lointaine reste imparfaite. [R0 conservée](../../../public/assets/armax/lot09/stages/silversun-me3-promenade-master.png).

Ces retouches génératives ne sont pas des patches garantissant l’identité de chaque pixel hors de la zone corrigée. Les grandes formes et le cadrage sont comparés visuellement ; chaque version conserve sa propre empreinte. Les premières versions ne sont pas comptées comme de nouveaux sujets.

Les [notes détaillées des stages](STAGES.md) et leur [revue indépendante](stages-art-review.json) conservent les adaptations : cadrage du panorama de Rannoch, pont de premier plan recomposé à Despoina, seuil élargi à Havarl, kiosque et escaliers réinterprétés à Silversun. Les silhouettes architecturales et sous-zones sont documentées, mais leur topographie n’est pas certifiée 1:1.

**Tous les fichiers restent Prototype.** Les visages, textures, inscriptions fines, proportions et parties masquées demandent une comparaison approfondie à la taille de jeu. Les marges du Ravager et de Terminus sont serrées ; il faudra normaliser les cadres avant production de sprites. Aucune animation complète, parallaxe séparée, collision ou intégration moteur n’est déclarée.

## Catalogue courant et suivi Excel

| Catégorie | Fiches | Avec image candidate | Sans image |
|---|---:|---:|---:|
| Personnages et ennemis | 79 | 13 | 66 |
| Costumes | 38 | 9 | 29 |
| Stages | 47 | 13 | 34 |
| **Total** | **164** | **35** | **129** |

Les 35 fiches illustrées comprennent les 23 déjà suivies au lot 08 et les douze nouveaux sujets. Les **86 originaux récupérés** restent suivis séparément dans l’onglet `Recuperes` ; ils ne deviennent pas de nouvelles générations. Les champs d’identité `category`, `name`, `work`, `dlc` et `variant` sont conservés pour les 164 entrées. Les précisions de sous-zone figurent dans les notes de production.

- [Listing complet des manquants](MANQUANTS_2026-11-20.md).
- [Catalogue JSON](production-catalog.json).
- [Mass_Effect_Armax_Suivi_Lot09_2026-11-20.xlsx](Mass_Effect_Armax_Suivi_Lot09_2026-11-20.xlsx).
- [Lot 08 historique](../lot08/README.md) et [inventaire des récupérations](../recovery-20261120/asset-inventory.json).

Ce catalogue de continuation ne prétend pas couvrir chaque apparition de toute la licence. Les lots 01/02 et la bible originale de 99 pages restent non retrouvés.

## Tentatives et provenance

**Seize appels au générateur intégré produisent quatorze PNG** : douze premières sorties et deux corrections. Le Centurion ME3 a été refusé sans fichier et sans seconde tentative ; il reste manquant. Havarl a subi une erreur technique de transport avant lecture de sa référence, puis une seule reprise au prompt identique a réussi. Cette erreur technique est distinguée du refus de contenu.

Au cumul, **neuf sujets sont documentés comme refusés** et **120 fiches sans image n’ont pas encore de tentative**. Les sujets déjà refusés n’ont pas été relancés dans cette passe.

- [Manifeste des personnages](fighters-manifest.json), [manifeste des costumes](costumes-manifest.json) et [manifeste des stages](stages-manifest.json).
- [Prompts des silhouettes](generation-prompts.json) et [journal de leurs tentatives](generation-attempts.json).
- [Prompts des stages](stages-generation-prompts.json) et [journal de leurs tentatives](stages-attempts.json).

Les références tierces sont attribuées par URL, portée et empreinte ; leurs fichiers de recherche ne sont pas incorporés au dépôt. Les images générées sont copiées sans réencodage et leurs premières versions restent disponibles.

## Vérification et reproduction du suivi

Depuis la racine du dépôt, avec Python et Pillow :

```bash
python scripts/verify-armax-lot09.py --report docs/armax/lot09/verification.json
```

Le contrôle vérifie le décodage des quatorze PNG, leurs dimensions et empreintes, la transparence des silhouettes, les liens au catalogue, les 820 champs d’identité, les journaux et l’absence de doublon avec les **112 originaux précédents**. Il compare les fichiers aux sorties brutes lorsqu’elles sont disponibles. Les anciens PNG absents du checkout partiel sont reconnus dans Git sans prétendre les redécoder.

Le [script de préparation du catalogue](../../../scripts/prepare-armax-lot09-catalog.py) et le [builder Excel](../../../scripts/build-armax-lot09-workbook.mjs) reproduisent le suivi sans réécrire les lots historiques. Les formules et les trois onglets sont contrôlés séparément.

Rapports : [vérification du lot](verification.json), [vérification technique des stages](stages-verification.json), [contrôle du classeur](workbook-verification.json), [revue des personnages](character-art-review.json), [revue des stages](stages-art-review.json) et [liens Markdown](link-verification.json).

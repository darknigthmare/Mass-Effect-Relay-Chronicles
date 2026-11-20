# Armax — lot 07, ennemis, costumes et stages

Continuation du **20 novembre 2026**, depuis la PR nº 5 au commit `583ce06aceba8d5e581caa241f22878ffa97c0b0`.

Ce lot illustre **sept nouveaux sujets** et conserve **dix PNG originaux distincts** : sept versions sélectionnées et trois premières versions de revue. Les 86 originaux récupérés et les six images du lot 06 restent conservés, soit **102 originaux** au total, hors aperçus de contrôle. Une variante de revue n’ajoute pas un personnage au catalogue.

## Images sélectionnées

| Catégorie | Sujet et version | Fichier |
|---|---|---|
| Costume | Thane Krios, ME2 — Alternate Appearance Pack 1 | [Garde, R1](../../../public/assets/armax/lot07/costumes/thane-me2-aap1-guard-right-r1.png) |
| Costume | Grunt, ME2 — Alternate Appearance Pack 2 | [Pose neutre, R1](../../../public/assets/armax/lot07/costumes/grunt-me2-aap2-neutral-right-r1.png) |
| Personnage / ennemi | Maraudeur, ME3 | [Préparation non armée](../../../public/assets/armax/lot07/fighters/marauder-me3-idle-right.png) |
| Personnage / ennemi | Brute armurée, ME3 | [Pose accroupie, R1](../../../public/assets/armax/lot07/fighters/brute-me3-armoured-crouch-right-r1.png) |
| Stage | Omega — Afterlife, ME2 | [Master de décor](../../../public/assets/armax/lot07/stages/omega-me2-afterlife-master.png) |
| Stage | Académie Grissom — atrium, ME3 | [Master de décor](../../../public/assets/armax/lot07/stages/grissom-me3-atrium-master.png) |
| Stage | Hagalaz — coque du Courtier, ME2 / Lair of the Shadow Broker | [Master de décor](../../../public/assets/armax/lot07/stages/hagalaz-me2-shadow-broker-hull-master.png) |

Les corps et costumes sont des PNG RGBA individuels, chacun avec une silhouette entière. Les stages sont trois PNG RGB de **1672 × 941** pixels. Les originaux du générateur sont copiés sans réencodage. Échelles, cadrages, pivots, variantes directionnelles et animations restent à harmoniser pour l’intégration.

## Corrections et réserves de fidélité

La [revue croisée des personnages](character-art-review.json) conserve les observations sur les premières versions et les corrections observées :

- **Thane R1** raccourcit les pans du manteau selon la référence promotionnelle AAP1. Le relief des plaques crâniennes reste accentué.
- **Grunt R1** rétablit la paire d’éléments obliques lumineux près des yeux. La crête et les détails d’armure restent à comparer finement.
- **Brute R1** abaisse la tête et accentue le dos voûté. La pose obtenue est plus accroupie que le turnaround et l’éventail dorsal plus courbé.
- **Maraudeur** garde une silhouette et une identité cohérentes lors de cette revue ; le détail de chaque optique, câble et plaque n’est pas certifié.

Les trois R0 sont conservées dans les champs `alternateFiles` des manifestes avec la sélection `superseded`. Elles ne remplacent pas les R1 sélectionnées.

Les [stages](STAGES.md) utilisent des références du bon opus. Leur premier plan est adapté au duel. Les détails architecturaux, les proportions et la géographie exacte restent à comparer ; les images sont aplaties, sans calques de parallaxe séparés. Afterlife demande un contrôle de lisibilité devant la lumière magenta ; Hagalaz conserve un sol sombre et peu profond ainsi que la météo incorporée à l’image.

**Tous les éléments restent Prototype.** La fidélité 1:1 est l’objectif de comparaison ; aucune certification, animation complète ou intégration jouable n’est déclarée.

## Catalogue courant et classeur

Le [catalogue lot 07](production-catalog.json) reprend les **101 fiches du lot 06** et ajoute **63 fiches** : 41 ennemis/créatures, 14 variantes d’armures de Shepard (sept ensembles pour deux corps) et huit sous-zones de stages. Il contient **80 références documentaires** et distingue les fonctions proposées, les opus, DLC, variantes et dépendances.

| Catégorie | Fiches | Avec image candidate | Sans image |
|---|---:|---:|---:|
| Personnages et ennemis | 79 | 3 | 76 |
| Costumes | 38 | 5 | 33 |
| Stages | 47 | 5 | 42 |
| **Total** | **164** | **13** | **151** |

Les treize fiches illustrées comprennent les six sujets du lot 06 et les sept nouveaux sujets. Les 86 originaux récupérés sont suivis séparément dans l’onglet `Recuperes`.

- [Listing des manquants](MANQUANTS_2026-11-20.md).
- [Classeur de suivi lot 07](Mass_Effect_Armax_Suivi_Lot07_2026-11-20.xlsx).
- [Catalogue et classeur historiques du lot 06](../lot06/README.md), conservés inchangés.
- [Inventaire des originaux récupérés](../recovery-20261120/asset-inventory.json).

Ce périmètre prolonge les lots Armax retrouvés. Il ne prétend pas recenser chaque apparition de toute la licence. Les lots 01/02 et la bible originale de 99 pages restent non retrouvés.

## Générations et références

**Onze appels au générateur intégré ont produit dix fichiers**. Le Fantôme de Cerberus ME3 a été refusé sans sortie ; aucune seconde tentative n’a été effectuée. Les cinq refus antérieurs restent distincts dans le suivi. Bekenstein est reporté sans tentative, faute de vue suffisamment précise de la terrasse envisagée.

Les costumes sont comparés aux planches promotionnelles AAP1/AAP2 et aux descriptions officielles. Les modèles texturés de Maraudeur et Brute proviennent du portfolio de leur artiste BioWare. La référence du Fantôme provient de l’entretien de l’équipe artistique ME3. Les sources tierces consultées restent des références de recherche, sans copie de leurs images dans le dépôt.

- [Bibliothèque de références](reference-library.json).
- [Manifest des costumes](costumes-manifest.json) et [manifest des personnages](fighters-manifest.json).
- [Manifest des stages](stages-manifest.json).
- [Prompts des personnages/costumes](generation-prompts.json) et [journal des tentatives](generation-attempts.json).
- [Prompts des stages](stages-generation-prompts.json) et [tentatives des stages](stages-attempts.json).

## Vérifier et régénérer

Depuis la racine du dépôt, avec Python et Pillow :

```bash
python scripts/verify-armax-lot07.py --report docs/armax/lot07/verification.json
```

Ce contrôle vérifie les nouveaux PNG, leurs SHA-256, leurs dimensions, l’alpha des silhouettes, l’unicité des fichiers, les liens au catalogue et la conservation des identités des 101 fiches héritées. Dans un checkout partiel, les fichiers historiques non matérialisés sont reconnus par leurs chemins dans l’arbre Git ; leurs octets ne sont pas redécodés par cette passe.

Le classeur est régénéré avec le [builder lot 07](../../../scripts/build-armax-lot07-workbook.mjs) dans le runtime principal `@oai/artifact-tool`, selon les instructions de son script. Le [script d’extension du catalogue](../../../scripts/extend-armax-lot07-catalog.py) conserve les identifiants hérités. Les contrôles de formules et de lisibilité sont enregistrés séparément.

Rapports : [vérification technique](verification.json), [vérification des stages](stages-verification.json), [vérification Excel](workbook-verification.json), [revue artistique](character-art-review.json).

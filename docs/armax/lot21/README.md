# Armax — lot21 : sprites fixes, audit et compléments de bible

**27 novembre 2026 — Europe/Paris. Base publiée : `8542d7ca03702dcf4b3bccd8ac938bd6574f20bc` ; continuation de la PR #11.**

**216 fiches : 171 avec image candidate et 45 sans**. Le lot21 conserve 196 identités et en ajoute 20. Il livre **10 PNG : 7 récupérés et 3 générés**, pour 2 anciennes fiches complétées et 8 nouvelles identités illustrées. Dans le périmètre hérité, les manquants passent de 35 à 33. La fidélité 1:1 et l’intégration moteur restent non certifiées.

## Livrables

- [Catalogue courant](production-catalog.json) et [liste complète des45 manquants](MANQUANTS_2026-11-27.md).
- [Bible complémentaire du lot21](BIBLE_COMPLEMENTS_LOT21.md) et [bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md).
- [Classeur actualisé](Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx), [contrôle du classeur](workbook-verification.json) et [revue visuelle](workbook-visual-review.md).
- [Audit ciblé des15 ajouts supplémentaires](audit/coverage-additions.md), distinct des5 identités ajoutées par récupération.
- [Manifeste des10 PNG](art-production/manifest.json), prompts et références qualifiées.
- [Vérification finale](verification.json) et [relecture indépendante de consolidation](qa/consolidation-review.md).
- [Reconstitution technique](RECUPERATION_TECHNIQUE.md) : octets des images et du classeur préservés, documents et contrôles reconstitués explicitement.

## Dix PNG effectivement livrés

| Sujet | Opus / variante | Origine de cette livraison | PNG |
|---|---|---|---|
| Adrien Victus | ME3 — Apparence de Primarque | Récupéré, auparavant non publié | [narrative-adrien-victus-me3-primarch-r1.png](../../../public/assets/armax/lot21/characters/narrative-adrien-victus-me3-primarch-r1.png) |
| Oleg Petrovsky | ME3 — Uniforme du DLC Omega | Récupéré, auparavant non publié | [narrative-oleg-petrovsky-me3-standing-r1.png](../../../public/assets/armax/lot21/characters/narrative-oleg-petrovsky-me3-standing-r1.png) |
| Harvester transformé par les Moissonneurs | ME3 — Forme transformée ME3 — pose entière repliée | Récupéré, auparavant non publié | [enemy-harvester-me3-neutral-r0.png](../../../public/assets/armax/lot21/characters/enemy-harvester-me3-neutral-r0.png) |
| Geth Bomber | ME3 — Drone non humanoïde ME3 — vol stationnaire | Récupéré, auparavant non publié | [enemy-geth-bomber-me3-hover-r0.png](../../../public/assets/armax/lot21/characters/enemy-geth-bomber-me3-hover-r0.png) |
| Seeker | ME2 — Spécimen frontal isolé — laboratoire du Normandy SR-2 | Récupéré, auparavant non publié | [enemy-seeker-me2-frontal-r0.png](../../../public/assets/armax/lot21/characters/enemy-seeker-me2-frontal-r0.png) |
| M-300 Claymore | ME2 — Modèle ME2 — profil droit | Récupéré, auparavant non publié | [m300-claymore-me2-profile-r0.png](../../../public/assets/armax/lot21/weapons/m300-claymore-me2-profile-r0.png) |
| M-22 Eviscerator | ME2 — Modèle ME2 — profil droit | Récupéré, auparavant non publié | [m22-eviscerator-me2-profile-r0.png](../../../public/assets/armax/lot21/weapons/m22-eviscerator-me2-profile-r0.png) |
| M-12 Locust | ME2 — Modèle original ME2 — Kasumi: Stolen Memory | Généré ce tour | [m12-locust-me2-profile-r0.png](../../../public/assets/armax/lot21/weapons/m12-locust-me2-profile-r0.png) |
| M-5 Phalanx | ME2 — Modèle original ME2 — Firepower Pack | Généré ce tour | [m5-phalanx-me2-profile-r0.png](../../../public/assets/armax/lot21/weapons/m5-phalanx-me2-profile-r0.png) |
| Swarmer | ME3 — Un spécimen au sol — ME3 | Généré ce tour | [enemy-swarmer-me3-neutral-r0.png](../../../public/assets/armax/lot21/characters/enemy-swarmer-me3-neutral-r0.png) |

Un seul sujet par image, pose fixe et alpha réel. Les sept récupérations ne sont pas comptées comme de nouvelles générations. Les3 nouveaux PNG proviennent de5 appels :3 réussites et2 refus (Mattock, Suppressor), conservés sans relance. Aucune retouche locale des PNG natifs.

## Comptes comparables

| Mesure | Lot20 historique | Lot21 courant |
|---|---:|---:|
| Fiches |196|216|
| Avec image candidate |161|171|
| Sans image |35|45|
| Manquants du périmètre hérité |35|33|
| Ajouts de fiches |0|20|
| Fidélité 1:1 certifiée |0|0|

Le passage à 45 fiches sans image tient à l’élargissement du suivi :196 anciens +20 ajouts. Deux anciennes fiches sont complétées, huit nouveaux sujets sont illustrés et douze nouveaux restent sans image. Les45 sans image comprennent 30 exclusions et 15 fiches ouvertes (4 réemplois à examiner, 11 lacunes de référence/production). Les 31 exclusions totales comprennent aussi Kallo, déjà illustré.

## Fidélité et limites

Les revues [sept récupérés](qa/recovered-art-review.md), [Locust/Phalanx](qa/new-weapons-independent-review.md) et [Swarmer](qa/swarmer-independent-review.md) distinguent les ressemblances et les écarts. Bas des tenues de Victus/Petrovsky insuffisamment documenté ; petite inscription de l’Eviscerator incorrecte/illisible ; détails et usure du Locust, microtextures du Phalanx et intensité de l’optique du Swarmer encore interprétés. Plusieurs marges sont plus courtes que le brief, sans rognage du sujet observé. Le filtrage moteur reste à vérifier.

La catégorie arme sépare l’objet de son porteur et de l’action. Les soutiens narratifs ne reçoivent aucun pouvoir. Seeker ME2 et Swarmer ME3, Harvester ME3 et version organique ME2, Adhi sauvage et Adhi dressé restent distincts. Les 196 identités héritées, les sources originales du guide et les fichiers des lots précédents restent conservés.

## Guide, extensions et validation

Les trois [sources originales](../guides/README.md),68 rubriques,204 critères et40 scénarios planifiés sont conservés. Les scénarios de gameplay restent non exécutés. Le script `python scripts/verify-armax-lot21.py` vérifie les fichiers de cette livraison ; les revues indépendantes qualifient leur portée. Aucun test de combat, réseau, paiement, animation, Microsoft Excel natif ou lancement Windows n’est déclaré. Le moteur et ses dépendances ne sont pas modifiés.

## Historique

[Lot20](../lot20/README.md) · [Lot19 et extensions](../lot19/README.md) · [Dossier Armax](../README.md).

# Armax Relay Clash — lot 12

## Livraison

Le lot 12 illustre **34 anciennes fiches sans image** : **neuf personnages ou ennemis, deux costumes et 23 stages**. Les **36 appels imagegen** ont produit **36 PNG originaux** : 34 masters sélectionnés et deux premiers essais de stages conservés en QA après correction. Aucun refus ni erreur de génération dans ce lot. Les deux R0 ne comptent pas comme sujets supplémentaires. Les identités et usages prévus restent ceux du catalogue précédent ; aucune nouvelle fiche n’est ajoutée.

Le [catalogue](production-catalog.json) compte **169 fiches : 95 avec une image candidate et 74 sans image**. Les champs d’identité et d’usage des 169 fiches héritées restent inchangés. Le corpus Armax atteint **190 PNG originaux**, soit les 154 originaux précédents et les 36 nouveaux, **hors trois aperçus de contrôle historiques**. Ce total comprend les essais originaux conservés ; il est distinct des 95 fiches illustrées et des 34 masters sélectionnés de cette passe.

Tous les nouveaux fichiers restent **Prototype**. Leur présence ne certifie ni fidélité 1:1, ni animation complète, ni intégration moteur. Base de continuation : `e225fb037ff7f7032102f8a854b13b1aaf5c72b0`. Ce lot prolonge la [PR nº 6](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/pull/6) après le [lot 11](../lot11/README.md). Les anciens fichiers, journaux de refus, versions conservées et décomptes historiques sont préservés.

## Neuf personnages et ennemis hérités illustrés

| Fiche | Apparence et pose produites | Usage prévu | PNG |
|---|---|---|---|
| Rachni Worker — ME1 | Carapace verte marbrée ; plongée trois quarts, tête vers le bas-gauche | Opposant candidat | [rachni-worker-me1-three-quarter.png](../../../public/assets/armax/lot12/fighters/rachni-worker-me1-three-quarter.png) |
| Rachni Brood Warrior — ME1 | Carapace violette, longs appendices latéraux ; plongée trois quarts | Boss candidat | [rachni-brood-warrior-me1-three-quarter.png](../../../public/assets/armax/lot12/fighters/rachni-brood-warrior-me1-three-quarter.png) |
| Geth Colossus — ME1 | Plateforme quadrupède argentée sous lumière bleue ; long cou dressé vers la gauche | Boss candidat | [geth-colossus-me1-three-quarter.png](../../../public/assets/armax/lot12/fighters/geth-colossus-me1-three-quarter.png) |
| Geth Stalker — ME1 | Camouflage noir-blanc et fibres bleues ; posture accrochée, bras ouverts vers le haut | Opposant candidat | [geth-stalker-me1-cling.png](../../../public/assets/armax/lot12/fighters/geth-stalker-me1-cling.png) |
| Geth Armature — ME1 | Quatre appuis, câbles et ailettes ; vue basse trois quarts, tête vers la gauche | Boss candidat | [geth-armature-me1-three-quarter.png](../../../public/assets/armax/lot12/fighters/geth-armature-me1-three-quarter.png) |
| Thorian Creeper — ME1 | Peau gris-brun veinée ; pose de référence relâchée, bras baissés et tête inclinée | Opposant candidat | [thorian-creeper-me1-reference-pose.png](../../../public/assets/armax/lot12/fighters/thorian-creeper-me1-reference-pose.png) |
| Praetorian — ME2 | Carapace ouverte, optiques bleues et quatre pointes entières ; trois quarts flottant | Boss candidat | [praetorian-me2-open-head-three-quarter.png](../../../public/assets/armax/lot12/fighters/praetorian-me2-open-head-three-quarter.png) |
| Rampart Mech — ME3, Omega | Coque sombre, marques rouges du visage et fusil ; visée vers la gauche de l’image | Opposant candidat | [rampart-mech-me3-omega-aim.png](../../../public/assets/armax/lot12/fighters/rampart-mech-me3-omega-aim.png) |
| Adjutant — ME3, Omega | Double crête, poche pâle, trois yeux bleus et canon asymétrique ; posture fléchie | Boss candidat | [adjutant-me3-omega-three-quarter.png](../../../public/assets/armax/lot12/fighters/adjutant-me3-omega-three-quarter.png) |

Le [manifeste personnages](fighters-manifest.json) et la [bibliothèque de références](fighters-reference-library.json) relient les sorties aux captures et modèles examinés. Les sources de préproduction restent distinguées des apparences finales : le Worker rouge et les canons saillants des anciennes vues de Geth Armature/Colossus ne gouvernent pas ces masters. Le Stalker utilise une seconde capture de Noveria pour recouper les doigts et l’optique masqués dans la vue principale. Le Praetorian reste celui de ME2 ; les modèles de ME3, les concepts et les variantes non confirmées ne sont pas substitués aux fiches.

Les poses observées sont des **images fixes individuelles**. Le Creeper conserve notamment la posture relâchée de sa référence, et le Stalker une posture accrochée. Aucune famille d’animations, direction normalisée, échelle relative entre bosses ou pivot de combat n’est livrée par ces fichiers.

## Deux costumes hérités illustrés

| Fiche | Variante et pose produites | PNG |
|---|---|---|
| Shepard masculin — ME2 | Armure Collector complète, casque compris ; pose A trois quarts vers la gauche, bras légèrement écartés | [shepard-male-me2-collector-three-quarter.png](../../../public/assets/armax/lot12/costumes/shepard-male-me2-collector-three-quarter.png) |
| Miranda Lawson — ME2 | Tenue de loyauté noire et or ; pose T trois quarts vers la gauche, bras horizontaux | [miranda-me2-loyalty-three-quarter.png](../../../public/assets/armax/lot12/costumes/miranda-me2-loyalty-three-quarter.png) |

Le [manifeste costumes](costumes-manifest.json) et la [bibliothèque costumes](costumes-reference-library.json) distinguent les masters imagegen des références qui ont servi à les produire. L’armure Collector masculine est recoupée avec une capture EA/BioWare partielle ; les jambes et bottes sont documentées par le modèle partagé par **Models124717 sur Models Resource**, attribué à BioWare / Electronic Arts. L’artiste individuel et la méthode d’extraction ne sont pas confirmés.

Pour Miranda, les vues entières proviennent de l’extraction communautaire attribuée à **sn00p**, convertie par **o0Crofty0o**, avec une capture ME2 partielle pour le visage et le haut de la tenue. Les versions blanche, de romance ou AAP2 ne sont pas substituées à la tenue noire et or.

**Les rendus 3D ont servi uniquement à inspecter les références.** Les géométries, UV, textures diffuses et poses natives n’ont pas été modifiés pour ces vues. Le [rapport Collector](collector-reference-inspection.json), son [script](collector-reference-inspection.py), le [rapport Miranda](miranda-reference-inspection.json) et son [script](miranda-reference-inspection.py) consignent fichiers, empreintes et réglages. Les normales et cartes spéculaires n’ont pas été appliquées ; ces vues ne prouvent pas les matériaux ou l’éclairage exacts du jeu.

Modèles, archives et rendus temporaires tiers restent hors dépôt et hors du décompte des 190 originaux. Les PNG livrés sont des générations distinctes. La variante **Collector féminine reste sans master** : les textures de 128 × 128 pixels et la désignation promotionnelle du casque ne suffisent pas à confirmer la variante publiée. La présence d’un modèle dans la recherche ne compte pas comme une génération.

## 23 stages hérités illustrés

| Fiche | Sous-zone effectivement produite | PNG |
|---|---|---|
| Aïté — station Hermès — ME2 | Salle de contrôle radar principale de la station Hermès, vue vers les consoles et la projection d’antenne sur la vitre. | [aite-me2-hermes-radar-control-master.png](../../../public/assets/armax/lot12/stages/aite-me2-hermes-radar-control-master.png) |
| Aïté — station Atlas — ME2 | Laboratoire physique derrière la porte gauche, avant le puzzle de l’ascenseur vers le niveau 7 de la station Atlas. | [aite-me2-atlas-physical-laboratory-master.png](../../../public/assets/armax/lot12/stages/aite-me2-atlas-physical-laboratory-master.png) |
| Tuchanka — camp Urdnot — ME2 | Coin du marché de Ratch’s Wares dans le camp Urdnot, devant le kiosque et la table longeant le garde-corps. | [tuchanka-me2-urdnot-ratch-market-master.png](../../../public/assets/armax/lot12/stages/tuchanka-me2-urdnot-ratch-market-master.png) |
| Rayya — tribunal — ME2 | Salle d’audience du Rayya vue en plongée depuis les gradins, au début du procès de Tali. | [rayya-me2-hearing-hall-master.png](../../../public/assets/armax/lot12/stages/rayya-me2-hearing-hall-master.png) |
| Moissonneur abandonné — cœur — ME2 | Vue rapprochée ascendante du cœur du Moissonneur abandonné, bouclier ouvert, avec terminal orange à droite. | [derelict-reaper-me2-open-core-master.png](../../../public/assets/armax/lot12/stages/derelict-reaper-me2-open-core-master.png) |
| Féros — Zhu's Hope — ME1 | Poste de commande de la grue au pied du cargo de Zhu’s Hope, avant ouverture de l’antre du Thorien. | [feros-me1-zhus-hope-crane-controls-master.png](../../../public/assets/armax/lot12/stages/feros-me1-zhus-hope-crane-controls-master.png) |
| Féros — ExoGeni — ME1 | Salle de l’autel geth dans ExoGeni, vue depuis la passerelle haute après la conversation avec la VI. | [feros-me1-exogeni-geth-altar-master.png](../../../public/assets/armax/lot12/stages/feros-me1-exogeni-geth-altar-master.png) |
| Thérum — ruines prothéennes — ME1 | Entrée extérieure des fouilles au camp minier de Thérum : rampe montante et portique menant aux ruines prothéennes. | [therum-me1-excavation-entrance-master.png](../../../public/assets/armax/lot12/stages/therum-me1-excavation-entrance-master.png) |
| Eos — monolithe — MEA | Approche extérieure du monolithe ouest d’Eos, présenté comme le deuxième monolithe dans A Better Beginning par le guide. | [eos-mea-western-second-monolith-approach-master.png](../../../public/assets/armax/lot12/stages/eos-mea-western-second-monolith-approach-master.png) |
| Elaaden — Nouvelle Tuchanka — MEA | Entrée extérieure de Nouvelle Tuchanka sur Elaaden, sous la grande bannière rouge, au début de l’étape Enter New Tuchanka and talk to Hark. | [elaaden-mea-new-tuchanka-entrance-master.png](../../../public/assets/armax/lot12/stages/elaaden-mea-new-tuchanka-entrance-master.png) |
| Purgatory — prison — ME2 | Allée de Prisoner’s Row devant la cellule du prisonnier 403, avant le piège du secteur Outprocessing. | [purgatory-me2-prisoner403-cell-row-master.png](../../../public/assets/armax/lot12/stages/purgatory-me2-prisoner403-cell-row-master.png) |
| Nexus — baie d'amarrage — MEA | Baie d’amarrage du Tempest au Nexus, vue depuis les terrasses du Common Area près du Cultural Exchange, après l’arrivée du jeu. | [nexus-mea-tempest-berth-common-area-master.png](../../../public/assets/armax/lot12/stages/nexus-mea-tempest-berth-common-area-master.png) |
| Voeld — base de la Résistance — MEA | Entrée du hangar de la Résistance sur Voeld, vue depuis l’intérieur vers le seuil et l’extérieur enneigé. | [voeld-mea-resistance-hangar-entrance-interior-master.png](../../../public/assets/armax/lot12/stages/voeld-mea-resistance-hangar-entrance-interior-master.png) |
| Méridiane — contrôle — MEA | Plate-forme du troisième relais dans Meridian Control, phase finale de Meridian: The Way Home avant l’interface. | [meridian-mea-control-third-relay-master.png](../../../public/assets/armax/lot12/stages/meridian-mea-control-third-relay-master.png) |
| Station Cronos — bureau — ME3 | Bureau de l’Homme Trouble à Cronos, vue frontale vers l’étoile avant le combat contre Kai Leng. | [cronus-me3-illusive-office-before-combat-master.png](../../../public/assets/armax/lot12/stages/cronus-me3-illusive-office-before-combat-master.png) |
| Féros — enceinte du Thorien — ME1 | Premier nœud neural du Thorien dans le tunnel nord du niveau 1 de l’antre, après le combat contre la première asari. | [feros-me1-thorian-first-neural-node-master.png](../../../public/assets/armax/lot12/stages/feros-me1-thorian-first-neural-node-master.png) |
| Cuirassé geth — cœur — ME3 | Unité de confinement ouverte dans Central Core, vue plongeante vers la passerelle circulaire avant libération du geth. | [geth-dreadnought-me3-open-containment-overlook-master.png](../../../public/assets/armax/lot12/stages/geth-dreadnought-me3-open-containment-overlook-master.png) |
| Tuchanka — le Voile — ME3 | Palier et escalier de l’approche du Voile avant le M5 Phalanx et le pont, tour hors cadre. | [tuchanka-me3-shroud-approach-stair-landing-master.png](../../../public/assets/armax/lot12/stages/tuchanka-me3-shroud-approach-stair-landing-master.png) |
| Citadelle — archives — ME3 | Grande salle de stockage des Archives de la Citadelle, coffres cylindriques et passerelles superposées pendant Escape ; numéro de salle non visible. | [citadel-me3-archives-cylindrical-vault-hall-master.png](../../../public/assets/armax/lot12/stages/citadel-me3-archives-cylindrical-vault-hall-master.png) |
| Projet Rho — astéroïde — ME2 | Plateformes extérieures finales du Projet Rho, face au relais Alpha lors de la séquence d’évasion de l’astéroïde. | [arrival-me2-rho-final-exterior-platforms-master.png](../../../public/assets/armax/lot12/stages/arrival-me2-rho-final-exterior-platforms-master.png) |
| Londres — approche du faisceau — ME3 | Pied du faisceau de Londres, vue basse frontale dans l’état légendé Before par la capture 2012 de prettz. | [london-me3-beam-foot-before-low-view-master.png](../../../public/assets/armax/lot12/stages/london-me3-beam-foot-before-low-view-master.png) |
| Virmire — installation de Saren — ME1 | Allée courbe du laboratoire Genophage Labs de Droyas, face aux chambres de stase et aux berceaux horizontaux. | [virmire-me1-droyas-genophage-lab-curved-aisle-master.png](../../../public/assets/armax/lot12/stages/virmire-me1-droyas-genophage-lab-curved-aisle-master.png) |
| Astéroïde X57 — installation principale — ME1 | Atrium de confrontation avec Balak dans l’installation principale de X57, vu du balcon supérieur ; référence visuelle Legendary Edition. | [x57-me1-main-facility-balcony-atrium-master.png](../../../public/assets/armax/lot12/stages/x57-me1-main-facility-balcony-atrium-master.png) |

Le [dossier stages](STAGES.md), le [manifeste](stages-manifest.json) et les [références](stages-reference-library.json) précisent les 23 sous-zones, les 86 images documentées et les choix de cadrage. Les captures de jeu et guides sont attribués dans le registre ; les binaires tiers restent hors dépôt.

Les personnages et interfaces visibles dans les inputs ont été retirés ; les surfaces qu’ils masquaient ont été reconstituées. La réserve est forte pour **les bancs, les marches et le sol du Rayya**, largement occultés dans la source. Zhu’s Hope couvre le poste de grue, ExoGeni l’autel, Thérum l’entrée extérieure et le Moissonneur son cœur rapproché sans sol complet. Le Voile est vu depuis un palier d’approche, **tour hors cadre**. Voeld montre le seuil du hangar **depuis l’intérieur**. Méridiane couvre le troisième relais final, et les Archives une grande salle dont le numéro n’est pas visible.

Les limites d’édition et d’état restent explicites :

- **X57** utilise une référence visuelle de **ME1 Legendary Edition**. Le guide original GameBanshee recoupe la cour de confrontation et le balcon, sans prouver les textures ou la palette de 2007.
- **Virmire** utilise une capture wiki non datée du laboratoire Genophage Labs de Droyas ; architecture et palette sont recoupées avec le guide IGN original. L’édition exacte et les détails de transparence des chambres ne sont pas certifiés.
- **Londres** suit la vue basse attribuée à prettz, publiée en 2012 et légendée **Before**. Méthode de caméra et build exact non documentés ; aucun véhicule, corps ou buisson de la vue After n’est importé.
- **Rho** couvre les plateformes extérieures finales face au relais Alpha. Les surfaces derrière l’hologramme retiré restent reconstruites, sans vue complète garantie de la plateforme.

Deux corrections ciblées ont été nécessaires : le premier rendu du cuirassé geth avait supprimé deux fragments fixes du confinement supérieur ; le premier rendu de X57 conservait une petite silhouette humaine sur le balcon du fond. Les R1 corrigés sont les masters, et les deux R0 restent dans [le registre QA des stages](STAGES.md#deux-premiers-essais-conservés-en-qa), avec leurs empreintes et motifs. Les petites traînées bleues de X57 sont conservées avec une réserve sur leur nature statique ou transitoire.

**Hologrammes, lumières, ombres et énergie restent inclus dans les PNG aplatis.** Les obstacles, gradins et pentes sont conservés. L’usage prévu `arene_adaptee` n’équivaut pas à une arène jouable : calques, parallaxe, collisions et caméra de duel restent à réaliser.

## Listing et recherches sans génération

**Aya est le seul stage de ce catalogue encore sans master.** Les six candidates documentées montrent les quais des navettes, des Angaras ou des scènes distinctes ; aucune ne verrouille le poste éloigné du Tempest au-dessus du lac et sa passerelle extensible. Aucun appel imagegen n’a été tenté pour cette fiche. La [recherche ciblée Aya](aya-reference-research.json) conserve les limites des accès et des images réellement inspectées.

Le [registre des lacunes](REFERENCE_GAPS.md) précise aussi les preuves manquantes pour le Général récolteur, le Collector féminin et les tenues de loyauté de Samara, Thane et Zaeed. **Varren ME1, Dévoreur / Thresher Maw ME1 et Rachni Soldier ME1** restent sans essai dans cette passe ; le Brood Warrior livré ne remplace pas le Soldier. Les références modifiées, cinématiques, promotionnelles ou trop partielles ne deviennent pas des preuves de variantes complètes.

Les [notes consolidées](REFERENCE_NOTES.md) et la [bibliothèque générale](reference-library.json) conservent les décisions. Les premiers gros plans insuffisants de Droyas et du cinquième nœud du Thorien ont été écartés ; les nouveaux masters reposent sur d’autres vues exactement identifiées, sans fusion de sous-zones. Les refus des lots antérieurs restent dans leurs journaux ; **aucun nouveau refus ni aucune relance d’un refus n’a lieu dans ce lot**. Une référence consultée ne compte pas comme un master.

## Catalogue et classeur

| Catégorie | Fiches | Illustrées au lot 11 | Anciennes fiches illustrées au lot 12 | Illustrées après lot 12 | Sans image |
|---|---:|---:|---:|---:|---:|
| Personnages et ennemis | 84 | 26 | 9 | 35 | 49 |
| Costumes | 38 | 12 | 2 | 14 | 24 |
| Stages | 47 | 23 | 23 | 46 | 1 |
| **Total** | **169** | **61** | **34** | **95** | **74** |

Le passage de **108 à 74 manquants** correspond exactement aux 34 anciennes fiches illustrées. Le périmètre reste constant à 169 identités. Les essais R0 conservés augmentent le nombre de PNG, sans ajouter de fiche illustrée.

- [Listing détaillé des manquants](MANQUANTS_2026-11-20.md)
- [Catalogue JSON](production-catalog.json)
- [Classeur Excel](Mass_Effect_Armax_Suivi_Lot12_2026-11-20.xlsx)
- [Bibliothèque consolidée](reference-library.json)
- [Notes de références et exclusions](REFERENCE_NOTES.md)
- [Lacunes documentaires ciblées](REFERENCE_GAPS.md)
- [Vérification du classeur](workbook-verification.json)

Les onglets **Synthese**, **Catalogue** et **Recuperes** relient le suivi aux sources et aux fichiers. Le rapport du classeur distingue les contrôles de formules, de recalcul et d’aperçus ; aucune ouverture dans l’application Excel native n’est revendiquée.

## Revue et vérifications

La [revue des onze personnages et costumes](character-art-review.json) décrit les poses, repères et limites de chaque silhouette. La [revue indépendante des stages](stages-art-review.json) couvre les 23 masters et les deux versions QA. Root revoit les 21 stages générés par stages_lot11 ; [stages_lot11 revoit X57 et Virmire](root-generated-stages-art-review.json), générés par root. La revue propre n’est pas confondue avec la revue indépendante. Ces comparaisons ne constituent pas une certification 1:1 ni un contrôle en jeu.

Les réserves de production restent explicites :

- **Poses fixes et marges** : le Stalker conserve 7 pixels en haut et 16 en bas au seuil alpha 128 ; l’Adjutant 13 en haut et 12 en bas. Miranda garde une pose T avec des marges gauche/haut/droite/bas de 49/39/51/47 pixels ; le Collector une pose A avec 79 pixels en haut et 68 en bas. Les marges demandées ne sont donc pas toujours atteintes, même si aucune extrémité coupée n’a été confirmée dans la revue.
- **Contours et effets** : de faibles franges et halos locaux subsistent. Trois pixels sous un bras de Miranda ont un alpha de 1/255 ; leur filtrage reste à vérifier dans le moteur. Les mesures ponctuelles ne remplacent pas un contrôle de tous les contours sur les fonds du jeu.
- **Occlusions et échelle** : pattes superposées, arrière des modèles, petites articulations, microtextures et matériaux ne sont pas certifiés. L’échelle relative Armature/Colossus et les détails des visages centraux du Praetorian restent à vérifier.
- **Décors aplatis** : continuité des surfaces cachées et petits détails interprétés. Aucun éclairage séparé, volume complet ou déplacement de caméra n’est déduit d’une seule capture.

Les 36 PNG sont les sorties originales copiées sans retouche, recadrage ou rééchantillonnage externe. Dimensions, modes et SHA-256 figurent dans les manifestes. Les [onze appels personnages/costumes](generation-attempts.json) et les [25 appels stages](stages-attempts.json) sont consignés séparément ; les [prompts stages](stages-generation-prompts.json) et les prompts individuels reliés depuis les manifestes conservent les demandes exactes.

Le [rapport technique](verification.json), les [contrôles stages](stages-verification.json), les [contrôles de liens](link-verification.json) et le [rapport du classeur](workbook-verification.json) portent leurs résultats exacts et couvrent des vérifications distinctes de la revue artistique.

```bash
python scripts/verify-armax-lot12.py --report docs/armax/lot12/verification.json
```

Cette livraison concerne les assets et leur suivi documentaire. Les résultats de CI de la PR s’évaluent sur le commit publié ; les fichiers de ce lot ne prouvent pas une intégration jouable.

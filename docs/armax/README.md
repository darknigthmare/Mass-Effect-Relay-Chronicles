# Armax Relay Clash — production du mode annexe de combat

Cette annexe conserve la production artistique du mode de combat 2D de Mass Effect — Relay Chronicles. Les PNG, les compléments de bible et les exports restent accompagnés de leurs références, de leur provenance et de leurs réserves.

## Bible courante — intégration du guide général

La [bible intégrée](bible/BIBLE_ARMAX_INTEGREE.md) relie les **30 rubriques** de **Combat_Games_Guide_General_v1.0.txt** aux contrats et fiches Armax. Elle fixe la référence commune de conception tout en conservant les lots historiques.

- [Associations et 90 critères d’acceptation](bible/guide-associations.json).
- [Associations des 192 fiches de contenu](bible/ASSOCIATIONS_CONTENU.md) : rôles, kits existants, costumes, sous-zones, calques et composants d’action ; [index structuré](bible/content-associations.json).
- [Règles RC-ARMAX-0.1](bible/common-rules.json) : commandes, garde, jauges et arbitrages Grunt/Legion–lot 04.
- [Campagnes et scènes](bible/CAMPAGNES_ET_SCENES.md) : six routes pilotes, 30 combats de route, 36 plans à produire ; campagne globale distincte en deux volumes et douze chapitres.
- [Fiches A–J et liaisons](bible/FICHES_ET_LIAISONS.md), [sources et décisions](bible/SOURCES_ET_DECISIONS.md).

**Portée de la bible : conception documentaire.** Les 36 briefs narratifs restent des plans à produire ; leur écriture ne prouve aucune image ni aucun parcours jouable. Le suivi artistique courant est celui du lot 16 ci-dessous ; les anciens lots conservent leurs comptes historiques. Ce suivi de manquants ne contient pas tous les kits et récupérations précédents.

## Lot 16 — continuation courante du 25 novembre 2026

Le [lot 16](lot16/README.md) apporte **6 PNG natifs pour 5 sujets, dont 5 PNG sélectionnés** : architecture distante PH-20, structures arrière PH-30 et sol PH-40 de Port Hanshan, fauteuil isolé de l’Homme Trouble et pose assise ME2. La révision R0 du sol reste archivée et non sélectionnée. Les trois calques et le fauteuil créent **4 fiches** ; la pose assise complète `chr_me2_illusive_man`, déjà illustré debout au lot 13.

Le [catalogue courant](lot16/production-catalog.json), les [manquants](lot16/MANQUANTS_2026-11-25.md) et le [classeur du 25 novembre](lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx) comptent **192 fiches : 132 avec image candidate et 60 sans**. Couverture : **49/87 personnages, 16/38 costumes, 52/52 masters de sous-zones, 3/3 calques, 7 effets, 2 projectiles et 3 accessoires**. La catégorie stage totalise 55 fiches, en distinguant les 52 sous-zones historiques des 3 composants de Port Hanshan. Le [contrôle du corpus](lot16/workbook-verification.json) compte **231 originaux distincts : 225 antérieurs et 6 nouveaux**.

Les [associations à la bible](lot16/bible-asset-associations.json) rattachent les calques aux fiches **G/J** et les deux sujets de l’Homme Trouble aux fiches narratives **B/F/J**. Le fauteuil et la pose assise disposent de candidats, avec une géométrie différente entre les deux images et un alpha maximal de 254 ; ils ne sont pas prêts à se superposer directement. Le sol PH-40 R1 améliore la jonction avec PH-30 mais conserve une largeur de 1 671 pixels contre 1 672 pour les autres calques. Les franges et le calage restent à revoir. Aucun pouvoir, kit, animation, scène complète ou arène jouable n’est ajouté.

Le [manifeste](lot16/manifest.json), les [sources](lot16/reference-library.json), la [revue indépendante de Port Hanshan](lot16/qa/port-hanshan-independent-review.json), la [revue indépendante de l’Homme Trouble](lot16/qa/illusive-man-independent-review.json) et la [vérification du lot](lot16/verification.json) détaillent les preuves et limites. Les fichiers restent **Prototype**, avec fidélité 1:1 et intégration moteur non validées.

### Lot 15 — livraison antérieure non récupérée

Les **113 PNG annoncés au lot 15 ne sont ni récupérés ni publiés**. L’archive et le commit local de cette livraison ne sont pas disponibles à la reprise. Le [constat de récupération](lot16/RECUPERATION_LOT15.md) conserve les repères antérieurs ; les comptes courants repartent des fichiers du lot 14 et des nouveaux fichiers vérifiés du lot 16. Les plans narratifs annoncés au lot 15 ne sont pas déclarés présents, et les exclusions de génération signalées restent actives.

## Lot 14 — historique du 25 novembre 2026

Le [lot 14](lot14/README.md) ajoute **21 PNG natifs pour 20 sujets** : CAT6 Heavy et Sniper, Amanda Kenson, Suvi assise ; cinq sous-zones Armax/Omega ; sept effets ME2, deux projectiles, un omni-outil et la grenade-disque ME1. Un R0 d’omni-outil est conservé en historique. **Quatre anciennes fiches** sont illustrées et **seize nouvelles fiches** sont ajoutées ; aucun costume nouveau.

Le [catalogue et les manquants](lot14/MANQUANTS_2026-11-25.md) et le [classeur du 25 novembre](lot14/Mass_Effect_Armax_Suivi_Lot14_2026-11-25.xlsx) comptent **188 fiches : 128 avec image et 60 sans**. Couverture : **49/87 personnages, 16/38 costumes, 52/52 stages, 7 effets, 2 projectiles et 2 accessoires**. Les 172 identités héritées et les 13 exclusions sont conservées ; le corpus atteint 225 PNG originaux.

Les [associations à la bible](lot14/bible-asset-associations.json), [sources](lot14/reference-library.json), [réserves](lot14/REFERENCE_GAPS.md), [revues](lot14/independent-art-review.json) et [vérifications](lot14/verification.json) détaillent la portée. Tous restent **Prototype**, sans certification 1:1 ni intégration moteur. La pose assise de Suvi, les décors aplatis et les instants de VFX ne complètent pas tous les assets de leurs fiches.

## Lot 13 — historique

Le [lot 13](lot13/README.md) apporte **14 PNG pour 13 sujets** : Kelly Chambers, l’Homme Trouble et Alec Ryder ; Varren, Dévoreur, Rachni Soldier et CAT6 Specialist ; Samara loyauté et Jack standard ME2 ; la passerelle du poste du Tempest à Aya ; Kett Anointed, Reliquat Assembler et Hydra d’Andromeda. Le R0 d’Hydra reste conservé après correction de son capteur supérieur. **Dix anciennes fiches** sont nouvellement illustrées et **trois identités sourcées** sont ajoutées séparément.

Le [catalogue et les manquants historiques](lot13/MANQUANTS_2026-11-24.md) et le [classeur du 24 novembre](lot13/Mass_Effect_Armax_Suivi_Lot13_2026-11-24.xlsx) conservent les **169 identités et usages hérités**. Avec les trois ajouts, ils comptent **172 fiches, dont 108 avec image candidate et 64 sans** : **45/87 personnages ou ennemis, 16/38 costumes et 47/47 stages** illustrés. Le corpus atteint **204 PNG originaux**, hors trois aperçus historiques. Les 13 exclusions de génération héritées restent inchangées.

La [bibliothèque de références](lot13/reference-library.json), la [revue indépendante](lot13/independent-art-review.json), les [lacunes documentées](lot13/REFERENCE_GAPS.md) et les [vérifications](lot13/verification.json) relient chaque PNG à ses sources, son prompt et ses limites. À l’issue du lot 13, le fauteuil de l’Homme Trouble restait manquant ; son candidat et la pose assise sont désormais suivis au lot 16 avec leurs réserves de géométrie et d’alpha. Le bas de la tenue de Jack s’appuie sur le dessin final officiel, sans certification de sa correspondance exacte au modèle du jeu. Aya représente la passerelle d’accueil, pas l’ensemble des quais ni un stage jouable. Les accessoires, autres poses, surfaces cachées, animations et couches de parallaxe restent à traiter selon chaque fiche. Tous les fichiers restent **Prototype**, sans fidélité 1:1 ni intégration moteur certifiées.

## Lot 12 — livraison précédente

Le [lot 12](lot12/README.md) illustre **34 anciennes fiches avec 36 PNG originaux** : neuf personnages ou ennemis — Rachni Worker, Brood Warrior, Geth Colossus, Stalker, Armature, Thorian Creeper, Praetorian, Rampart Mech et Adjutant —, l’armure Collector masculine ME2, Miranda en tenue de loyauté ME2 et 23 stages. **Aucune nouvelle identité n’est ajoutée.** Les 36 appels imagegen ont réussi sans refus ni erreur technique. Deux R0 de stages restent conservés après des corrections ciblées et ne comptent pas comme sujets supplémentaires.

Le [catalogue et le listing historiques](lot12/MANQUANTS_2026-11-20.md) et le [classeur lot 12](lot12/Mass_Effect_Armax_Suivi_Lot12_2026-11-20.xlsx) conservent **169 fiches : 84 personnages/ennemis, 38 costumes et 47 stages**. **95 ont une image candidate et 74 restent sans image** ; la couverture est de **35/84 personnages, 14/38 costumes et 46/47 stages**. Les champs d’identité et d’usage hérités restent inchangés. Le corpus atteint **190 PNG originaux**, dont les versions R0 conservées, hors trois aperçus historiques.

Les [23 sous-zones de stages](lot12/STAGES.md) vont des postes précis de Féros et des stations Hermès/Atlas aux plateformes finales de Rho, au cœur partiel du cuirassé geth, au seuil intérieur de Voeld et au troisième relais de Méridiane. Thérum reste une entrée extérieure, le Voile un palier avec tour hors cadre et les Archives une salle sans numéro visible. **Au terme du lot 12, Aya seule restait sans master**, faute de référence suffisante de la zone du Tempest. X57 est explicitement référencé en Legendary Edition ; Virmire garde une incertitude d’édition avec recoupement IGN original ; Londres conserve l’état Before et sa limite de caméra/build non documentés.

Les [manifestes et réserves du lot](lot12/README.md), la [bibliothèque de sources](lot12/reference-library.json), les [lacunes documentaires](lot12/REFERENCE_GAPS.md) et les [vérifications](lot12/verification.json) distinguent ces vues partielles des lieux complets. Poses fixes, marges serrées et surfaces cachées restent à traiter. Les rendus 3D du Collector et de Miranda servent uniquement à inspecter les références, hors corpus des masters. Tous les nouveaux fichiers restent **Prototype**, sans fidélité 1:1, animation complète, parallaxe ou moteur validés.

## Lot 11 — historique

Le [lot 11](lot11/README.md) ajoute **treize sujets et treize PNG** : cinq ennemis d’Andromeda — Wraith, Chosen, Behemoth, Breacher et Nullifier —, Jack en tenue de loyauté ME2, Liara AAP1 ME3 et six décors — Canal et archives d’Ilos, Hot Labs, Haestrom, CIC du Normandy SR-1 et Chora’s Den. **Huit fiches héritées sont nouvellement illustrées ; cinq fiches inédites sont ajoutées avec leurs sources.**

Le [catalogue historique](lot11/MANQUANTS_2026-11-20.md) et le [classeur lot 11](lot11/Mass_Effect_Armax_Suivi_Lot11_2026-11-20.xlsx) conservent **169 fiches** : 84 personnages/ennemis, 38 costumes et 47 stages. **61 ont une image candidate et 108 restent sans image.** Les 164 identités et usages hérités sont préservés ; le corpus de cette livraison atteignait **154 PNG originaux**, hors trois aperçus historiques. Le YMIR demeure sans fichier après un refus. Les références partielles, cadrages et limites sont documentés ; tous les nouveaux fichiers restent Prototype, sans fidélité 1:1 ni intégration moteur certifiées.

## Lot 10 — livraison précédente

Le [lot 10](lot10/README.md) ajoute **treize sujets illustrés** : huit personnages ou ennemis d’Andromeda — Eiroch, Fiend, Destined, Moshae Sjefa, Ascendant, Observer, Architecte et Destroyer —, Tali en tenue de loyauté ME2, puis les stages Omega, terrasse de Hock, Eden Prime et Conseil. Les **quinze PNG** comprennent treize versions sélectionnées et deux R0 conservés après correction de sous-zone et de HUD.

Le [catalogue historique](lot10/MANQUANTS_2026-11-20.md) et le [classeur lot 10](lot10/Mass_Effect_Armax_Suivi_Lot10_2026-11-20.xlsx) conservent **164 fiches** : 79 personnages/ennemis, 38 costumes et 47 stages. **48 ont une image candidate et 116 restent sans image.** Le corpus de cette livraison atteignait **141 PNG originaux**, hors trois aperçus historiques. Les trois refus de costumes sont consignés sans relance ; les armures Cerberus Assault, Ajax et Blood Dragon disposent de notes de références partielles supplémentaires. Tous les nouveaux fichiers restent Prototype, avec leurs limites de fidélité et d’intégration.

## Lot 09 — livraison précédente

Le [lot 09](lot09/README.md) ajoute **douze sujets illustrés** : Scion ME2, Ravager, Cannibal, Banshee, Combat Engineer et Hackett ME3, les armures masculines Terminus et Inferno ME2, puis les stages Rannoch, Despoina, Havarl et Silversun. Les **quatorze PNG** comprennent douze versions sélectionnées et deux premières versions conservées après correction du lettrage de Terminus et Silversun.

Le [catalogue historique](lot09/MANQUANTS_2026-11-20.md) et le [classeur lot 09](lot09/Mass_Effect_Armax_Suivi_Lot09_2026-11-20.xlsx) gardent **164 fiches** : 79 personnages/ennemis, 38 costumes et 47 stages. **35 ont une image candidate et 129 restent sans image.** Le corpus de cette livraison atteignait **126 PNG originaux**, hors trois aperçus historiques. Le refus du Centurion et l’erreur technique Havarl suivie d’une reprise réussie sont distingués. Les nouvelles images restent Prototype, avec leurs limites de comparaison et d’intégration.

## Lot 08 — livraison précédente

Le [lot 08](lot08/README.md) ajoute **dix sujets et dix PNG** : Guardian et Atlas ME3, LOKI et FENRIS ME2, les tenues de loyauté ME2 de Kasumi et Mordin, ainsi que les stages Mars, Kadara, Eos et Pragia. Les six silhouettes sont individuelles et les quatre décors sont des masters aplatis.

Le [catalogue historique](lot08/MANQUANTS_2026-11-20.md) et le [classeur lot 08](lot08/Mass_Effect_Armax_Suivi_Lot08_2026-11-20.xlsx) conservent **164 fiches** : 79 personnages/ennemis, 38 costumes et 47 stages. **23 fiches disposent d'images candidates et 141 restent sans image**, soit dix manquants illustrés dans cette passe. Le corpus de cette livraison atteignait **112 PNG originaux**, hors trois aperçus historiques. Nemesis et Assault Trooper restent sans sortie après refus ; les poses réellement obtenues et les réserves de fidélité sont explicites.

## Lot 07 — livraison précédente

Le [lot 07](lot07/README.md) ajoute **sept sujets illustrés** : Thane ME2 AAP1, Grunt ME2 AAP2, Maraudeur et Brute armurée ME3, Afterlife ME2, Grissom ME3 et la coque du Courtier sur Hagalaz ME2. Les **dix PNG** comprennent sept versions sélectionnées et trois premières versions conservées après correction.

Le [catalogue historique](lot07/MANQUANTS_2026-11-20.md) et le [classeur lot 07](lot07/Mass_Effect_Armax_Suivi_Lot07_2026-11-20.xlsx) conservent l'état de cette passe : **164 fiches**, dont treize illustrées et 151 sans image. Le corpus de cette livraison atteignait **102 PNG originaux**, hors aperçus de contrôle. Les réserves artistiques et le refus de génération du Fantôme ME3 restent consignés.

## Lot 06 — livraison précédente

Le [lot 06](lot06/README.md) ajoute **six images** : Balak ME1, Jack AAP1, Miranda AAP2, Tali AAP2, le hangar du Normandy SR-2 ME3 et Sur’Kesh. Avec les 86 originaux récupérés ci-dessous, cette livraison contenait **92 originaux distincts**. Le [catalogue de continuation](lot06/MANQUANTS_2026-11-20.md) et le [classeur historique lot 06](lot06/Mass_Effect_Armax_Suivi_Lot06_2026-11-20.xlsx) conservent l’état de cette passe : 101 fiches, dont six avec image candidate et 95 sans image.

## Reprise du 20 novembre 2026

**86 PNG originaux distincts** ont été retrouvés : 65 déjà organisés et 21 sorties supplémentaires. Le [rapport de récupération](recovery-20261120/README.md) et le [manifeste courant](recovery-20261120/asset-inventory.json) donnent le détail. Chaque original garde ses pixels et son SHA-256. Ces récupérations ne sont pas comptées comme de nouvelles générations de cette reprise.

| Ensemble | Contenu | Accès |
|---|---|---|
| Lot03 | 29 originaux : 26 retenus historiquement et trois versions remplacées ; 16 personnages, quatre poses de Shepard, six arènes parmi la sélection | [Dossier](lot03/README.md), [catalogue HTML](lot03/Catalogue_Lot03.html), [bible](lot03/Bible_Complement_Lot03.md) |
| Lot04 roster | Neuf originaux, dont six prototypes retenus et trois essais | [Dossier](lot04/README.md), [bible](lot04/BIBLE_EXTENSION.md) |
| Complément lot04 | 16 originaux : Saren, Grunt, poses Shepard et études de couches Illium | [Récupération](recovered-lot04-art/README.md) |
| Continuation | Onze originaux : Grunt, drone de Legion, composition et plans de Port Hanshan | [Dossier](../combat-2d/README.md) |
| Sorties supplémentaires | Quatre poses neutres lot04 et 17 gardes/révisions lot05, dont les dix sorties postérieures au classeur | [Inventaire](recovery-20261120/asset-inventory.json) |

La liste des personnages disponibles inclut maintenant Sara et Scott Ryder, Aria, Jack ME3, Tali, Liara, Garrus, Thane, Mordin et Shepard masculin retrouvés dans les dernières sorties. Les corps de Balak, EDI, Kai Leng, Legion et Wrex étaient absents avant les générations de la reprise courante. Jack ME2 reste un costume distinct de la version ME3 récupérée.

## Archives et suivi

Le [classeur historique de consolidation](recovery-20261120/history/Mass_Effect_Armax_Consolidation_2026-11-20.xlsx) est conservé comme provenance. Son décompte de 72 PNG précède 14 récupérations supplémentaires. Les lots01/02 et la bible originale de 99 pages ne sont pas retrouvés.

L’[ancien inventaire](local-import-inventory.json) et les journaux restent historiques. Le ZIP du lot03 n’est pas dupliqué dans cette PR : les fichiers dépliés et les 29 originaux sont présents. Les liens vers l’archive dans les anciennes fiches décrivent la livraison passée ; la consultation actuelle passe par les fichiers dépliés. Les caches d’images et documents tiers ne sont pas incorporés au dépôt.

## Statuts et vérification

Les statuts de fichier, revue visuelle, intégration et fidélité restent distincts. Aucune image fixe ne valide un clip complet ; les masters et études de plans ne certifient pas une arène jouable ou une parallaxe complète. Aucun personnage ni décor n’est certifié 1:1 dans cet inventaire.

Depuis la racine du dépôt :

```bash
python scripts/verify-armax-recovery.py
```

Ce contrôle vérifie les 86 originaux, leur unicité, les empreintes et dimensions PNG. L’ancien `docs/armax/tools/verify_assets.py` reste la commande historique du lot03 avec son ZIP ; il n’est pas le vérificateur de cette publication sans archive redondante.

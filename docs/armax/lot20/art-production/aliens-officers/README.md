# Lot 20 — Général récolteur, Wreav et officiers

Deux PNG natifs sont retenus comme **candidats Prototype** : le Général récolteur de ME2 et Wreav de ME3. Adrien Victus et Oleg Petrovsky ont de nouvelles références inspectées, mais aucune silhouette complète n’est générée sans preuve des parties manquantes. Aucun de ces résultats ne certifie une fidélité 1:1 ni une intégration moteur.

Le [manifeste](manifest.json) contient les deux sorties, les deux tentatives terminées, les quatre recherches clôturées, les URL, les empreintes des références et les réserves. La [revue indépendante du lot](../../independent-art-review.json) relie ses observations aux empreintes des PNG. Les rôles du catalogue restent inchangés.

| Identifiant | Résultat | Portée et limite principale |
|---|---|---|
| `chr_me2_collector_general` | [PNG R0](../../../../../public/assets/armax/lot20/characters/collector-general-me2-neutral-r0.png) | Corps complet du Général ME2 dans la pose repliée de la référence ; reliefs, teinte et émission des yeux restent interprétés. |
| `chr_me3_urdnot_wreav` | [PNG R0](../../../../../public/assets/armax/lot20/characters/wreav-me3-neutral-r0.png) | Armure ME3 complète recoupée avec le visage découvert en jeu ; menton, doigts, raccords et microrelief restent reconstruits. |
| `chr_me3_adrien_victus` | Référence incomplète, aucun PNG | Tenue de Primarque confirmée jusqu’aux hanches ; mains complètes, bas du vêtement, jambes et pieds non documentés. Rôle `narration_support`. |
| `chr_me3_oleg_petrovsky` | Référence incomplète, aucun PNG | Visage et haut de l’uniforme Omega confirmés ; mains, pantalon et chaussures non documentés. Rôle `narration_support`. |

## Général récolteur : récupération traçable

Le [rapport lot 12](../../../lot12/collector-general-reference-inspection.json) et son script sont suivis dans Git. Les trois images qu’il décrit étaient des références temporaires hors dépôt : elles n’ont donc pas été « retrouvées dans Git ». L’archive publique a été récupérée depuis [Models Resource](https://models.spriters-resource.com/pc_computer/masseffect2/asset/310066/). Son SHA-256 et ceux des six fichiers FBX, OBJ, MTL et textures correspondent exactement au relevé historique.

Les trois vues ont été recréées avec Blender 4.3.2 et le script historique, en changeant seulement le chemin de travail. La géométrie, les UV, les textures et les paramètres d’import n’ont pas été modifiés. Les rendus ont de nouvelles empreintes, explicitement distinctes des anciennes. Le [rapport de récupération](collector-general-reference-recovery.json) fournit cette chaîne de provenance portable.

La [scène ME2 de la console](https://static.wikia.nocookie.net/masseffect/images/f/ff/Collectorleader.png) permet de vérifier la tête et les quatre yeux jaunes. Le [charshot isolé](https://static.wikia.nocookie.net/masseffect/images/e/eb/Collector_General_charshot.png) apporte un complément visuel, avec une provenance de rendu moins complète. L’image explicitement Legendary Edition n’est pas utilisée. Le corps est celui du Général ; aucun corps de Drone ou de Harbinger ne lui est substitué.

Le shader Blender reste différent du jeu, notamment l’import de la normale comme bump et de la diffuse en alpha. La présentation verticale et repliée ne prouve aucune animation canonique. La revue indépendante retient la silhouette, la tête en éventail, les quatre yeux, les petits membres repliés, l’abdomen segmenté et les deux longues pointes. Elle garde ouvertes les réserves sur les stries accentuées, les pinces plus anguleuses, la palette gris-brun et les yeux moins lumineux.

## Wreav : armure primaire et visage en jeu

La [planche de Herbert Lowis](https://herbertlowis.artstation.com/projects/YGmq), publiée sous le titre *Mass Effect 3*, identifie explicitement l’armure comme la variante Wreav. Ses quatre vues montrent le corps entier, mains et pieds compris. L’auteur précise ne pas avoir réalisé la tête de cette planche. Le casque fermé qu’elle contient n’est pas repris dans le candidat.

La [capture Steam de Wreav](https://steamcommunity.com/sharedfiles/filedetails/?id=2165846176), rattachée à l’application ME3 originale et légendée « Urdnot Wreav », montre son visage découvert et son armure grise jusqu’aux hanches. Le personnage au centre-droit est retenu ; les autres Krogans sont écartés. Le plastron gris à deux triangles bruns, les bandes abdominales rivetées, les épaulières et la bosse dorsale recoupent la planche du créateur.

Ce complément de source lève la réserve d’identité du corps sans réécrire les anciens rapports qui évoquaient un Volus. La planche seule, avec sa tête casquée, n’aurait pas suffi pour le visage de Wreav. Les captures de ME2, Wrex et les retextures ne servent pas à compléter le sujet. L’absence de mod de la capture communautaire n’est pas certifiée.

La revue indépendante retient le candidat et conserve les limites suivantes : plis et stries du visage accentués ; menton, doigts et raccords entre plaques interprétés ; palette bronze et usure reconstruites sous une lumière neutre. Le bas du corps est comparé aux vues artiste, le haut à la capture en jeu.

## Victus et Oleg : limites précises

Cinq images de Victus ont été inspectées : portraits du wiki, scène avec Linron, puis deux captures Steam. Elles renforcent l’identité, les marques du visage et le haut de la tenue de Primarque. Deux gros plans montrent les bords de l’armure de Menae ; ils ne constituent pas une preuve des parties absentes de la tenue de Primarque. Les jambes d’Avitus Rix, de Tarquin ou d’un Turien générique ne sont pas utilisées. La prochaine preuve utile est une capture native complète ou une extraction traçable de cette tenue exacte.

La nouvelle [capture d’Oleg dans Omega](https://static.wikia.nocookie.net/masseffect/ru/images/6/6a/ME3-Oleg-Petrovsky.png) montre clairement son visage, son col noir, les barrettes d’épaule, la chaîne, les passepoils et l’insigne de l’uniforme. Elle s’arrête aux avant-bras et à la taille. Les deux galeries Steam recherchées ne fournissent pas de vue complète supplémentaire. Les limites des anciennes sources Eliteguias, Nexus et du blog BioWare restent décrites dans le [rapport historique lot 19](../../../lot19/REFERENCE_GAPS_ROOT.md) ; elles ne sont pas présentées comme de nouvelles inspections.

Ces deux recherches se terminent avec `generationAttempted: false` et `outcome: reference_gap`. Un manque de référence n’est ni un refus du service ni une nouvelle exclusion automatique.

## Contrôles et fichiers

Les deux livrables sont des PNG RGBA statiques de 1 024 × 1 536 pixels, conservés octet pour octet depuis la sortie de génération. Aucun détourage, redimensionnement ou recoloration n’est appliqué. Leurs alpha vont de 0 à 254 ; ce plafond et le faible bruit périphérique sont conservés et documentés. Les compositions [Général clair/sombre](qa/collector-general-r0-alpha-comparison.png) et [Wreav clair/sombre](qa/wreav-r0-alpha-comparison.png) sont des fichiers de contrôle séparés.

Les références tierces restent hors dépôt ; leurs noms de cache, URL, tailles et SHA-256 sont enregistrés dans le manifeste. Les deux prompts complets sont conservés dans `prompts/`. Les quatre cibles sont hors des 29 exclusions historiques. Aucune animation, commande de jeu, modification de catalogue, intégration moteur, commit ou publication n’est réalisée par cette sous-tâche.

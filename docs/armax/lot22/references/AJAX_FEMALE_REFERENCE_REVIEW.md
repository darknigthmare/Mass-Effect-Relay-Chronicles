# Ajax ME3 — inspection de la variante Shepard féminin

**Fiche :** `cst_me3_shepard_female_ajax`  
**Date :** 27 novembre 2026  
**Résultat :** aucune vue retenue pour produire le modèle féminin. La lacune de références reste ouverte. Aucun visuel généré, aucune relance du modèle masculin.

## Périmètre et résultat

Les dix images liées à la [page officielle EA d’Alternate Appearance Pack 1](https://www.ea.com/games/mass-effect/mass-effect-3/alternate-appearance-pack-1/buy-microcontent) ont été téléchargées et inspectées deux fois chacune : vignette 260 × 146, puis fichier obtenu à la même adresse sans paramètres de redimensionnement. Les dix fichiers plus grands contiennent les mêmes scènes. Neuf mesurent 1920 × 1080 ; l’image 04 mesure 1919 × 1080. Ces dimensions sont mesurées, sans prétendre connaître la résolution originale de production.

La provenance EA est établie pour ces fichiers. Leur présence sur la page produit et leur nom « alternate-appearance-pack-1 » ne prouvent pas qu’ils montrent le costume recherché. La galerie comprend des scènes générales de ME3. Aucune ne démontre conjointement **Shepard féminin, Ajax et les volumes du corps entier**.

Les 20 JPG exacts occupent **1 538 844 octets**. Le [paquet JSON](ajax-reference-pack.json) conserve URL demandée, URL finale, dimensions, taille, empreinte SHA-256, identifiant Git blob, chemin local et observations par image. Les fichiers ont été lus directement pour l’inspection et conservés sans transformation.

## Les dix scènes inspectées

| Image source | Sujet effectivement visible | Décision pour la fiche féminine Ajax |
|---|---|---|
| [01](ajax_official/ea_ajax_pack_01_source.jpg) | Cockpit d’Atlas et pilote derrière la verrière. | Corps du pilote masqué ; identité et variante féminine indémontrées. |
| [02](ajax_official/ea_ajax_pack_02_source.jpg) | Garrus, gros plan de trois-quarts avant. | Autre personnage. |
| [03](ajax_official/ea_ajax_pack_03_source.jpg) | Scène de salon avec Liara, Wrex et deux hommes en tenues de bord. | Aucun modèle féminin Ajax identifiable. |
| [04](ajax_official/ea_ajax_pack_04_source.jpg) | Deux combattants casqués, optiques cyan et armes levées. | Ni Shepard féminin ni Ajax établis ; corps coupés à la taille. |
| [05](ajax_official/ea_ajax_pack_05_source.jpg) | Shepard masculin, vue arrière rapprochée en combat. | Variante masculine exclue ; aucun bas du corps utilisable. |
| [06](ajax_official/ea_ajax_pack_06_source.jpg) | Shepard masculin au premier plan, marquage N7 visible, entouré de compagnons. | Variante masculine et costume N7 ; aucune substitution autorisée. |
| [07](ajax_official/ea_ajax_pack_07_source.jpg) | Husk / créature cybernétique. | Sans rapport avec le costume. |
| [08](ajax_official/ea_ajax_pack_08_source.jpg) | Atlas face à Shepard masculin vu de dos. | Variante masculine exclue ; pieds hors cadre. |
| [09](ajax_official/ea_ajax_pack_09_source.jpg) | Shepard masculin suspendu à une structure, corps presque entier en perspective. | La présence des bottes ne résout pas la mauvaise variante. |
| [10](ajax_official/ea_ajax_pack_10_source.jpg) | Combattant casqué en armure blanche/orange de style Cerberus, avec Garrus. | Vue partielle la plus proche du thème, mais identité et gabarit féminin indémontrés ; non retenue. |

## Pourquoi l’image 10 ne suffit pas

Le casque fermé, les épaulières blanches, certaines plaques du thorax et les avant-bras sont visibles. L’arme et les mains cachent le centre du plastron. Le bas du bassin, les cuisses, les genoux, les tibias et les pieds sortent du cadre ; le dos n’est pas montré. La personne est entièrement casquée : cette vue ne permet pas d’attribuer le modèle à Shepard féminin.

Cette image reste enregistrée comme **candidate partielle non sélectionnée**, pas comme preuve de géométrie féminine. Son empreinte SHA-256 est `fa88ab1947f7d03d05ae793b1ed58c03e5ce6eaaaf999f19a8068148bc949d3b`, et son identifiant Git blob est `23f6af054144a1abeb69c499561ba6b5d50b47f3`.

## Référence exacte encore nécessaire

Il faut une capture identifiant l’Ajax équipée sur **Shepard féminin dans ME3 original**, puis le dos entier de la même configuration. La vue avant doit aller de la tête ou du casque aux deux semelles, avec un éclairage qui rende lisibles plastron, épaules, taille, hanches, cuisses, genoux et bottes. Une vue latérale ou de trois-quarts complémentaire doit montrer l’épaisseur des épaulières, l’articulation du bassin et le volume des bottes.

Le catalogue signalait déjà une ancienne planche avant/arrière coupée aux tibias et un gabarit féminin non établi. Cette planche historique n’a pas été réinspectée dans cette passe. La galerie EA examinée ici ne résout pas cette lacune.

Le paquet maintient `generationAttempted: false`, `selectedViews: []`, `femaleVariantConfirmed: false` et `promptStatus: disabled_reference_gap`. Aucun modèle masculin n’a été réétiqueté, adapté ou relancé.

## Vérification et limites

L’existence des 20 fichiers, leurs tailles et leurs empreintes ont été revérifiées après sauvegarde : 20 chemins distincts, 20 SHA-256 distincts, aucune incohérence. Ce contrôle porte uniquement sur les références et leur intégrité. Il ne constitue ni un test du moteur, ni une certification de fidélité, ni une preuve que le costume féminin n’existe pas.

Seuls ce paquet Ajax, ce rapport et leurs fichiers de référence sont modifiés ou ajoutés par cette tâche. Les catalogues et les autres sources du projet ont été consultés en lecture seule.

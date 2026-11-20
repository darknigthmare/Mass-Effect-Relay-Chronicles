# Armax Relay Clash — lot 11

## Livraison

Le lot 11 ajoute **13 sujets illustrés et 13 PNG originaux** : cinq ennemis d’Andromeda, deux costumes et six décors. **Huit fiches héritées auparavant sans image** sont maintenant illustrées ; **cinq fiches inédites** sont ajoutées au catalogue avec leurs références. Les quatorze appels de génération ont produit treize sorties ; le YMIR ME2 a été refusé une fois, sans fichier ni relance.

Le [catalogue](production-catalog.json) contient **169 fiches : 61 avec une image candidate et 108 sans image**. Les **164 fiches héritées** conservent leurs **984 champs d’identité et d’usage** : catégorie, nom, opus, DLC, variante et usage prévu. Le corpus Armax atteint **154 PNG originaux**, hors trois aperçus historiques. Ces décomptes portent sur les fichiers présents ; tous les nouveaux assets restent **Prototype**, sans fidélité 1:1 certifiée, animation complète ou intégration moteur.

Base de continuation : `994eed418368b782699341eda95ba0fda9cf252e`. Ce lot prolonge la [PR nº 6](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/pull/6), après les [lots 09](../lot09/README.md) et [10](../lot10/README.md). Leurs fichiers et leurs décomptes historiques restent conservés.

## Cinq nouvelles fiches d’ennemis

| Nouvelle fiche | Apparence et pose produites | Usage prévu | PNG |
|---|---|---|---|
| Wraith kett — Andromeda | Quadrupède équipé, couronne osseuse, harnais verts et queue entière ; trois quarts vers la gauche | Opposant candidat | [wraith-mea-standard-three-quarter.png](../../../public/assets/armax/lot11/fighters/wraith-mea-standard-three-quarter.png) |
| Chosen kett — Andromeda | Col vert, plaques osseuses claires, combinaison anthracite ; trois quarts vers la droite, mains vides | Opposant candidat | [chosen-mea-standard-three-quarter.png](../../../public/assets/armax/lot11/fighters/chosen-mea-standard-three-quarter.png) |
| Behemoth kett — Andromeda | Krogan exalté, carapace et plaques organiques claires, peau sombre ; trois quarts vers la gauche | Boss candidat | [behemoth-mea-standard-three-quarter.png](../../../public/assets/armax/lot11/fighters/behemoth-mea-standard-three-quarter.png) |
| Breacher reliquat — Andromeda | Drone à nacelles latérales et deux pinces, vue trois quarts en suspension | Opposant candidat | [breacher-mea-standard-three-quarter.png](../../../public/assets/armax/lot11/fighters/breacher-mea-standard-three-quarter.png) |
| Nullifier reliquat — Andromeda | Nacelles supérieures, ailettes lumineuses, appuis articulés et rubans segmentés ; vue trois quarts | Opposant candidat | [nullifier-mea-standard-three-quarter.png](../../../public/assets/armax/lot11/fighters/nullifier-mea-standard-three-quarter.png) |

Le [manifeste personnages](fighters-manifest.json) décrit chaque fichier, sa pose observée, ses références et ses limites. Les modèles texturés ont été publiés par Furio Tedeschi, Herbert Lowis et Mathew Makin dans leurs portfolios ou le dossier artistique BioWare. Les identités Breacher et Nullifier sont recoupées avec des captures de jeu portant leur nom ; ces captures servent à l’identification et ne gouvernent pas la palette des sprites.

La piste initialement envisagée comme « Assembler » correspondait au **Nullifier** après recoupement. Aucune fiche Assembler n’est créée sur la seule base d’un nom de fichier. Le Behemoth kett est distingué de l’Architecte déjà illustré ; le Wraith conserve son équipement visible. Les ajouts et leurs usages sont déclarés dans la [bibliothèque personnages](fighters-reference-library.json).

## Deux costumes hérités illustrés

| Fiche | Variante et pose produites | PNG |
|---|---|---|
| Jack — ME2 | Tenue de loyauté : gilet noir sans manches, tatouages, drapé gris asymétrique, bottes à sangles ; corps entier trois quarts | [jack-me2-loyalty-three-quarter.png](../../../public/assets/armax/lot11/costumes/jack-me2-loyalty-three-quarter.png) |
| Liara T’Soni — ME3 | Alternate Appearance Pack 1 : tenue noire/cyan, ornements dorés, épaules argentées ; garde vers la gauche avec l’arme visible dans la référence | [liara-me3-aap1-guard-left.png](../../../public/assets/armax/lot11/costumes/liara-me3-aap1-guard-left.png) |

Le [manifeste costumes](costumes-manifest.json) conserve l’origine de chaque sortie. Jack suit une vue complète publiée par Rylvan, dont l’auteur de l’extraction n’est pas établi. Liara suit deux captures officielles de la publication BioWare du 20 novembre 2012 ; seule Liara, à gauche, est reproduite. La troisième capture de cette publication ne montre pas Liara et n’a pas servi à sa génération.

Les silhouettes sont entières. **Liara ne dispose que de 16 pixels de marge en haut et en bas** ; cette réserve de cadrage doit être augmentée avant animation ou normalisation des pivots. Tatouages, visages, petits motifs, matériaux sous l’éclairage et surfaces cachées restent non certifiés.

## Six décors hérités illustrés

| Fiche | Sous-zone effectivement produite | PNG |
|---|---|---|
| Ilos — le Canal, ME1 | Approche du relais dans la tranchée ; sommet du relais hors cadre comme dans la capture | [ilos-me1-conduit-master.png](../../../public/assets/armax/lot11/stages/ilos-me1-conduit-master.png) |
| Novéria — Hot Labs, ME1 | Annexe arrière du terminal Mira de purge neutronique | [noveria-me1-hotlabs-mira-master.png](../../../public/assets/armax/lot11/stages/noveria-me1-hotlabs-mira-master.png) |
| Haestrom — ruines, ME2 | Plateau d’arrivée de la mission de Tali | [haestrom-me2-ruins-arrival-master.png](../../../public/assets/armax/lot11/stages/haestrom-me2-ruins-arrival-master.png) |
| Ilos — archives, ME1 | Extrémité de la passerelle face à Vigil | [ilos-me1-vigil-chamber-master.png](../../../public/assets/armax/lot11/stages/ilos-me1-vigil-chamber-master.png) |
| Normandy SR-1 — CIC, ME1 | Vue oblique au bord de la carte galactique | [normandy-sr1-me1-cic-master.png](../../../public/assets/armax/lot11/stages/normandy-sr1-me1-cic-master.png) |
| Citadelle — Chora’s Den, ME1 | Bar circulaire vu depuis le seuil d’entrée | [citadel-me1-choras-den-master.png](../../../public/assets/armax/lot11/stages/citadel-me1-choras-den-master.png) |

Le [dossier stages](STAGES.md), le [manifeste](stages-manifest.json) et les [références](stages-reference-library.json) précisent les cadrages et les captures originales ME1/ME2 utilisées. Aucune capture Legendary Edition n’a servi à ce lot. Le terminal des Hot Labs est identifié dans la séquence de purge, distincte du Mira Core administratif.

Personnages, véhicules et interfaces ont été retirés. Les surfaces qu’ils masquaient ont été reconstruites et ne sont pas certifiées à l’identique. **Vigil, la carte galactique et les effets lumineux restent intégrés aux images aplaties**. Chora’s Den et le CIC sont des vues partielles, sans panorama complet, couche de parallaxe, collision ni caméra de duel validés.

## Génération sans sortie et recherches complémentaires

Le **YMIR ME2** dispose d’une référence de production complète extraite d’une présentation BioWare à la GDC Europe 2011. Son unique appel a toutefois été refusé en sortie par l’outil, catégorie renvoyée « other », requête `73ed40c9-cf8f-4b25-a6cf-2bf3424dea9f`. Aucun PNG n’a été produit et le sujet n’a pas été relancé. Le [journal personnages/costumes](generation-attempts.json) conserve le prompt et l’erreur exacts ; le [journal stages](stages-attempts.json) conserve les six appels réussis des décors.

Le listing progresse aussi pour **Miranda loyauté ME2**, **Collector masculin et féminin ME2**, **Ajax masculin ME3** et **Blood Dragon masculin ME2**. Les nouvelles captures partielles et les concepts écartés sont enregistrés dans la [bibliothèque costumes](costumes-reference-library.json). Les jambes ou pieds manquants restent à documenter avant génération. La revue de Kestrel confirme la même limite de cadrage déjà connue.

Les [notes narratives complémentaires](narrative-research-notes.json) décrivent les pistes Joker, Karin Chakwas, Kelly Chambers et l’Homme Trouble. Elles ne sont pas comptées comme des sorties ni comme des modèles entièrement verrouillés. L’Homme Trouble conserve notamment le besoin d’un fauteuil séparé prévu dans sa fiche.

## Catalogue et classeur synchronisés

| Catégorie | Fiches après lot 10 | Fiches ajoutées | Fiches après lot 11 | Avec image | Sans image |
|---|---:|---:|---:|---:|---:|
| Personnages et ennemis | 79 | 5 | 84 | 26 | 58 |
| Costumes | 38 | 0 | 38 | 12 | 26 |
| Stages | 47 | 0 | 47 | 23 | 24 |
| **Total** | **164** | **5** | **169** | **61** | **108** |

Le passage de 116 à 108 manquants vient des **huit fiches héritées illustrées**. Les cinq nouvelles fiches sont ajoutées et illustrées dans le même lot : elles augmentent le catalogue et le total illustré, sans être présentées comme cinq anciens manquants résolus. Parmi les 108 fiches sans image, **13 ont un dernier essai refusé** et **95 n’ont pas été tentées**.

- [Listing détaillé des manquants](MANQUANTS_2026-11-20.md)
- [Catalogue JSON](production-catalog.json)
- [Classeur Excel](Mass_Effect_Armax_Suivi_Lot11_2026-11-20.xlsx)
- [Bibliothèque consolidée](reference-library.json)
- [Notes de références et exclusions](REFERENCE_NOTES.md)

Le classeur conserve les onglets **Synthese**, **Catalogue** et **Recuperes**, les formules et les liens de traçabilité. Le [rapport de vérification du classeur](workbook-verification.json) documente son recalcul, les aperçus inspectés et les empreintes des entrées. Aucune ouverture dans l’application Excel native n’est revendiquée.

## Revue et vérifications

Les treize PNG sont les sorties originales du générateur, copiées sans recadrage, recoloration ou rééchantillonnage externe. Leurs dimensions, modes, transparence et SHA-256 figurent dans les manifestes. Les références tierces restent hors dépôt, avec leurs URL, attributions, empreintes et limites.

La [revue indépendante des cinq ennemis et des deux costumes](character-art-review.json) et la [revue indépendante des six décors](stages-art-review.json) n’ont pas confirmé de défaut majeur exigeant une correction dans cette passe. Elles conservent les réserves :

- Les marges sont parfois plus faibles que demandé, particulièrement Liara et le Behemoth. Aucun solide au seuil alpha 128 n’est coupé par le cadre.
- Certains aperçus affichent des halos : les points extérieurs contrôlés sont des couleurs RGB sous alpha nul. Ce contrôle ponctuel ne remplace pas une revue de tous les contours en moteur.
- Griffes et petits appendices partiellement superposés, microtextures, gravures, visages et surfaces cachées ne sont pas certifiés par une seule vue.
- Les décors sont des cadrages statiques documentés ; leurs zones occultées et détails fins restent interprétés.

Le [rapport technique](verification.json) vérifie la continuité du catalogue, les cinq ajouts déclarés, les liens d’assets, les journaux et les sources. Les [contrôles stages](stages-verification.json) et les [contrôles de liens](link-verification.json) sont séparés de la revue artistique.

```bash
python scripts/verify-armax-lot11.py --report docs/armax/lot11/verification.json
```

Cette livraison concerne les assets et leur suivi. Les résultats de CI de la PR sont à consulter sur le commit publié ; aucune certification du gameplay ou du rendu en jeu n’est déduite de ces fichiers.


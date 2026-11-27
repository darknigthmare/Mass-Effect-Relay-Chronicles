# Armax — lot 20 : continuation des sprites fixes

**27 novembre 2026, Europe/Paris · PR #11 · base `b83a62d277d93cd8140113ee2318745fcdedf8d6`.**

**5 fiches auparavant sans image disposent d’un candidat**. Le suivi conserve **196 identités : 161 avec image et 35 sans**. Cette passe produit **4 PNG natifs, dont 4 sélectionnés**, et résout **1 attribution historique**.

Les 12 fiches sans image non exclues au départ ont été examinées en parallèle. Le [manifeste consolidé](art-production/manifest.json) relie les trois dossiers de production, les sources inspectées, prompts, sorties natives et décisions. Les fichiers tiers de référence restent hors du dépôt.

## Images retenues

| Sujet | Opus et variante | Fichier natif |
|---|---|---|
| Amiral Tadius Ahern | ME1 original — Apparence de Pinnacle Station | [human-ahern-me1-standing.png](../../../public/assets/armax/lot20/characters/human-ahern-me1-standing.png) |
| Jeff « Joker » Moreau | ME2 — Tenue du Normandy SR-2 | [human-joker-me2-standing.png](../../../public/assets/armax/lot20/characters/human-joker-me2-standing.png) |
| Général récolteur | ME2 — Corps du personnage | [collector-general-me2-neutral-r0.png](../../../public/assets/armax/lot20/characters/collector-general-me2-neutral-r0.png) |
| Urdnot Wreav | ME3 — Apparence ME3 | [wreav-me3-neutral-r0.png](../../../public/assets/armax/lot20/characters/wreav-me3-neutral-r0.png) |

Chaque PNG contient un seul sujet et une pose fixe. Les révisions non sélectionnées sont conservées. Les [attributions historiques de cette passe](recovered-attributions.json) comptent 1 décision nouvelle ; 0 PNG ancien reste sans attribution. Le [rapport du lot19](../lot19/recovered-attributions.json) conserve les deux attributions quariens déjà résolues.

## Compteurs et continuité

| Mesure | Lot19 historique | Lot20 courant |
|---|---:|---:|
| Identités | 196 | 196 |
| Avec image candidate | 156 | 161 |
| Sans image sélectionnée | 40 | 35 |
| PNG natifs produits pendant le lot | 6 | 4 |
| PNG sélectionnés pendant le lot | 4 | 4 |
| Attributions historiques nouvellement résolues | 2 | 1 |
| Fidélité 1:1 certifiée | 0 | 0 |
| Nouveau système moteur livré | 0 | 0 |

Le [catalogue](production-catalog.json), les [manquants](MANQUANTS_2026-11-27.md), l’[index de la bible](../bible/ASSOCIATIONS_CONTENU.md) et le [classeur](Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx) utilisent ces mêmes comptes. Les anciens fichiers et les 196 identités sont conservés ; aucune variante ou rôle n'est remplacé. Les 29 exclusions au départ sont respectées ; le total courant est de 29.

## Références, fidélité et rôle dans le jeu

Les manifestes [humains](art-production/human/manifest.json), [costumes](art-production/costumes/manifest.json) et [extraterrestres/officiers](art-production/aliens-officers/manifest.json) distinguent les captures du bon opus, les modèles d’origine, les pistes rejetées et les surfaces non documentées. Les notes de chaque candidat exposent les écarts encore observés. La présence d’un PNG n'est pas une preuve de fidélité 1:1.

Les personnages narratifs conservent ce rôle. Les costumes restent des apparences distinctes, sans pouvoir ni classe ajoutés. Les périodes ME1, ME2, ME3 et Andromeda ne sont pas fusionnées. Tous les actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`.

## Guide et deux extensions

Les [trois sources originales](../guides/README.md), les **68 rubriques et 204 critères** et les **40 scénarios à exécuter** sont conservés. L’[extension équipes et bonus](../bible/EXTENSION_01_EQUIPES_ET_BONUS.md) et l’[extension déblocages](../bible/EXTENSION_02_DEBLOCAGES.md) restent intégrées à la [bible](../bible/BIBLE_ARMAX_INTEGREE.md). La seule adaptation du registre des guides concerne son renvoi vers l’index de production courant ; les exigences ne sont pas réécrites.

## Vérifications

- [Vérification des fichiers, identités, comptes, liens et historique](verification.json), reproductible avec `python3 scripts/verify-armax-lot20.py`.
- [Classeur et recalcul](workbook-verification.json) : import du lot19 avec artifact-tool, feuilles historiques `Recuperes` et `Attributions19` conservées, valeurs enregistrées relues indépendamment.
- [Revue visuelle indépendante](independent-art-review.json) : décision de sélection, preuves inspectées et réserves propres à cette passe.
- [Relecture indépendante de la consolidation](consolidation-review.json) : provenance, comptes, guide et renvois courants vérifiés sur les fichiers livrés.

La livraison porte sur les sprites fixes, documents et outils de suivi. Les autres vues, poses, animations, illustrations de campagne et fonctions de combat restent à réaliser selon leur statut. Les 113 PNG non retrouvés du lot15 restent exclus des comptes. Aucun test de gameplay, de paiement, de réseau, de Microsoft Excel ou de lancement Windows n'est revendiqué ici.

## Historique

- [Lot19 publié](../lot19/README.md).
- [Dossier Armax](../README.md).

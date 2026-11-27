# Armax — lots 17 consolidé et 18

**25 novembre 2026, Europe/Paris · PR #11 · base de reprise `1e3cea80b1a6ec81d7ca6df8ad70d96988973f10`.**

Cette continuation récupère les sorties natives du lot 17 qui n’étaient pas publiées, les associe aux fiches identifiables et ajoute les images fixes du lot 18. Elle complète également les campagnes et les raccords de movesets de Grunt, Legion, Tela Vasir et Morinth.

## Résultat et unités comptées

| Élément | Résultat |
|---|---:|
| Images antérieures récupérées dans cette passe | 12 PNG |
| Images du lot 17 déjà publiées au départ | 2 PNG : Padok Wiks et Gil Brodie |
| Lot 17 après consolidation | 14 PNG, 11 associations candidates, 3 sans attribution certaine |
| Nouvelle génération du lot 18 | 8 PNG natifs pour 7 sujets, dont une révision R0 non sélectionnée |
| Fichiers ajoutés à la PR par cette passe | 20 PNG : 12 récupérés + 8 nouveaux |
| Images sélectionnées parmi lots 17–18 | 18 : 11 + 7 |
| Catalogue courant | 196 fiches, 150 avec image candidate, 46 sans |
| Fiches héritées nouvellement illustrées depuis lot 16 | 14 : 11 au lot 17 + 3 costumes au lot 18 |
| Nouvelles fiches | 4 composants de décor, aucune nouvelle arène |
| Annexe narrative | 4 routes, 20 rencontres, 12 scènes, 32 briefs, 8 issues |
| Nouvelles illustrations de campagne | 0 : une demande refusée, sans relance |

Le [catalogue courant](production-catalog.json), le [suivi des manquants](MANQUANTS_2026-11-25.md), le [manifeste](manifest.json) et le [classeur](Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx) utilisent ces mêmes unités. Les **192 identités héritées et leurs six champs d’identité/usage** sont conservés. Les 46 manquants mesurent ce catalogue de production récupéré ; ils ne constituent pas un inventaire exhaustif de tous les jeux, romans, comics, costumes et phases d’action de l’univers.

## Nouveaux costumes et composants

Trois silhouettes féminines complètent les variantes ME2 : **Inferno**, **Terminus Assault** et **Collector**. Chaque fichier contient un corps entier fixe sur fond transparent, sans animation. Les références vues et les régions reconstruites figurent dans [le manifeste costumes](costume-generation.json).

Le marché du camp Urdnot à Tuchanka reçoit deux calques — architecture arrière et sol — ainsi qu’un groupe table/chaises et une console sur caisse. Ils dérivent du **master interne du lot 12**, lui-même candidat, et ne sont pas présentés comme de nouvelles extractions officielles. L’échelle des props, les zones masquées reconstruites, les contours et le raccord des calques restent à contrôler. Le sol R1 remplace R0 après extension latérale ; l’original R0 demeure dans `history/`.

| Sujet | PNG sélectionné |
|---|---|
| Shepard féminin — Inferno | [shepard-female-inferno-me2-fixed.png](../../../public/assets/armax/lot18/costumes/shepard-female-inferno-me2-fixed.png) |
| Shepard féminin — Terminus Assault | [shepard-female-terminus-me2-fixed.png](../../../public/assets/armax/lot18/costumes/shepard-female-terminus-me2-fixed.png) |
| Shepard féminin — Collector | [shepard-female-collector-me2-fixed.png](../../../public/assets/armax/lot18/costumes/shepard-female-collector-me2-fixed.png) |
| Tuchanka — marché Urdnot : architecture arrière | [tuchanka-me2-market-rear-architecture.png](../../../public/assets/armax/lot18/stages/tuchanka-me2-market-rear-architecture.png) |
| Tuchanka — marché Urdnot : sol | [tuchanka-me2-market-floor.png](../../../public/assets/armax/lot18/stages/tuchanka-me2-market-floor.png) |
| Tuchanka — table du marché Urdnot | [tuchanka-me2-market-table.png](../../../public/assets/armax/lot18/props/tuchanka-me2-market-table.png) |
| Tuchanka — console du marché Urdnot | [tuchanka-me2-market-terminal.png](../../../public/assets/armax/lot18/props/tuchanka-me2-market-terminal.png) |

## Récupération du lot 17

Le [rapport de récupération](../lot17/RECUPERATION.md) et son [audit](../lot17/recovery-audit.json) conservent les chemins de provenance, les empreintes, les observations et la différence entre identification et validation. Les neuf associations récupérées sont **Lexi T’Perro, Sloane Kelly, Gavin Archer, Maya Brooks, Karin Chakwas, Samantha Traynor, Kestrel masculin, Cerberus Assault masculin et féminin**. Padok et Gil étaient déjà publiés, mais n’avaient pas encore été reportés dans le catalogue courant.

Les trois images restantes — un marine de l’Alliance et deux amiraux quariens présumés — sont conservées avec `selected=false` et `catalogId=null`. Jenkins, Han’Gerrel et Zaal’Koris restent donc sans image associée dans le catalogue. Aucun prompt absent ni reçu de génération n’a été reconstruit. Un fichier source vide est exclu des PNG.

Le lot 15 annoncé à 113 PNG reste **non retrouvé**. Ces douze récupérations possèdent leur propre provenance et ne lui sont pas attribuées. Les recherches dans les fichiers persistants n’ont pas fourni l’archive annoncée ni le fichier brut du guide général ; la bible intégrée déjà publiée est conservée.

## Campagnes, rivals et Neutralisations décisives

L’[annexe narrative](BIBLE_COMPLEMENTS_LOT18.md), son [registre structuré](narrative-complements.json) et les [associations artistiques](bible-asset-associations.json) complètent les six routes pilotes antérieures sans réécrire leurs scènes. Les quatre nouvelles routes comportent cinq rencontres et deux conclusions chacune.

- **Grunt** : percée physique, résistance et protection d’un passage ; aucun pouvoir biotique ajouté.
- **Legion** : précision et choix de position ; le gel de présentation d’un finisher ne lui attribue pas Stasis.
- **Tela Vasir** : Liara dans sa version ME2 du DLC, Charge et Shockwave ; aucune substitution par sa tenue ME3.
- **Morinth** : rivalité avec Samara, Emprise distincte de Reave, issue de simulation sans réécrire le canon.

Le nom commun reste **Neutralisation décisive**. Les affrontements originaux, la simulation et les ancrages d’œuvre sont distingués. Les plans restent des briefs : **aucune des 32 nouvelles illustrations n’est déclarée produite**. L’essai `art-lot18-grunt-me2-ending-a-p01` a été refusé par le service ; son `fileRef` reste nul.

## Vérification et limites

Les [contrôles du lot](verification.json), la [relecture indépendante](independent-review.json) et la [vérification Excel](workbook-verification.json) accompagnent les fichiers. Les 22 PNG des lots 17 et 18 sont contrôlés par décodage et empreinte ; les fichiers historiques absents du checkout partiel sont vérifiés par leur chemin dans l’arbre Git. Le vérificateur se lance avec `python scripts/verify-armax-lot18.py` depuis la racine.

Les trois costumes nouveaux et les silhouettes récupérées présentent des pixels partiellement transparents et des halos de faible alpha. Les sources cadrées ne prouvent pas toutes les jambes, pieds, coutures ou surfaces cachées. Les calques mesurent 1585 × 992, contre 1586 × 992 pour le master interne ; les props ont une échelle propre. Les mesures de raccord restent des diagnostics de préparation, sans validation de parallaxe.

Tous les actifs restent **Prototype**, `fidelity1to1Validated=false` et `engineIntegrated=false`. Cette livraison ne modifie pas le moteur, les statistiques, les sauvegardes ou la sélection des combattants. La PR reste ouverte ; aucun déploiement ou test Windows n’est revendiqué.

## Navigation

- [Bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md) et [index de contenu](../bible/ASSOCIATIONS_CONTENU.md).
- [Catalogue historique consolidé lot 17](../lot17/production-catalog.json).
- [Prompts exacts de la nouvelle génération](prompts/).
- [Dossier Armax](../README.md).

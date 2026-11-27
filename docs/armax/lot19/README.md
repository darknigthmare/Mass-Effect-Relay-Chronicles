# Armax — lot 19 et intégration des deux extensions

**27 novembre 2026, Europe/Paris · PR #11 · base `231ffde14652932ffaa667c40315f1232f802d4a`.**

Les trois guides originaux sont désormais conservés avec leurs empreintes dans le [dossier sources](../guides/README.md). La [réconciliation](../bible/GUIDE_RECONCILIATION_2026-11-27.md) confirme la correspondance des 30 rubriques historiques et ajoute les 38 rubriques des extensions. Le [registre complet](../bible/guide-coverage-2026-11-27.json) réunit 68 rubriques et 204 critères de conception : 90 conservés, 114 nouveaux.

## Production réellement livrée

| Mesure | Valeur |
|---|---:|
| Fiches du catalogue conservées | 196 |
| Nouvelles identités | 0 |
| PNG natifs produits dans cette passe, révisions incluses | 6 |
| PNG sélectionnés | 4 |
| Sujets représentés par de nouveaux PNG | 4 |
| Attributions de PNG historiques résolues | 2 |
| Anciennes fiches nouvellement illustrées | 6 |
| Fiches avec image candidate | 156 |
| Fiches sans image sélectionnée | 40 |
| Nouvelles certifications de fidélité 1:1 | 0 |
| Nouveaux systèmes de combat intégrés au moteur | 0 |

Le [catalogue](production-catalog.json), l'[index de la bible](../bible/ASSOCIATIONS_CONTENU.md), les [manquants](MANQUANTS_2026-11-27.md) et le [classeur](Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx) décrivent le même périmètre. Il s'agit d'un catalogue partiel de production, pas d'un pourcentage d'achèvement de tout Mass Effect. Une silhouette fixe ne termine pas toutes les vues, accessoires, poses, animations ou illustrations de son personnage.

### Images retenues

Chaque fichier contient un seul sujet. Les variantes non sélectionnées restent dans `history/` et ne créent pas de nouvelles identités.

| Sujet | Opus et variante | Fichier |
|---|---|---|
| Kallo Jath | MEA — Tenue du pilote du Tempest | [kallo-jath-mea-standing.png](../../../public/assets/armax/lot19/characters/kallo-jath-mea-standing.png) |
| Armando-Owen Bailey | ME3 — Tenue du SSC ME3 | [bailey-me3-standing.png](../../../public/assets/armax/lot19/characters/bailey-me3-standing.png) |
| Evfra | MEA — Apparence de chef de la Résistance | [evfra-mea-standing.png](../../../public/assets/armax/lot19/characters/evfra-mea-standing.png) |
| Collector Drone | ME2 — Drone récolteur ME2 non possédé | [collector-drone-me2-standing.png](../../../public/assets/armax/lot19/characters/collector-drone-me2-standing.png) |

### Attributions historiques résolues

Les deux fichiers suivants étaient déjà présents au lot18 et proviennent du lot17. La comparaison des signatures visuelles résout leurs anciennes hypothèses inversées ; aucun nouveau PNG ni aucune nouvelle génération ne leur sont imputés. Le [rapport de rapprochement](recovered-attributions.json) conserve les preuves, les hypothèses antérieures et les réserves.

| Fiche actuelle | Fichier historique inchangé |
|---|---|
| Zaal'Koris vas Qwib-Qwib — ME3 | [candidate-quarian-purple-e3b9a976.png](../../../public/assets/armax/lot17/recovered/candidate-quarian-purple-e3b9a976.png) |
| Han'Gerrel vas Neema — ME3 | [candidate-quarian-maroon-5c7ec3e1.png](../../../public/assets/armax/lot17/recovered/candidate-quarian-maroon-5c7ec3e1.png) |

Le marine précédemment supposé être Jenkins reste non attribué. Les attributions des deux Quariens portent sur leur identité visuelle ; les détails des jambes, pieds et animations restent à valider.

Le [manifeste artistique](art-production/manifest.json) lie les fichiers, prompts, sources réellement inspectées, contrôles d'alpha et réserves. Les références tierces utilisées pour inspection restent hors du dépôt. Les notes distinguent les régions documentées et les surfaces reconstruites. [Oleg Petrovsky reste sans nouvelle image](REFERENCE_GAPS_ROOT.md), faute de référence intégrale suffisante dans cette passe.

## Extensions appliquées au contexte Mass Effect

- [Équipes, personnalité et bonus](../bible/EXTENSION_01_EQUIPES_ET_BONUS.md) : taunts, sélection/confirmation/désélection, assistances, relais, supers duo, Neutralisations coordonnées et fins dramatiques, clashes/QTE, drones/mines/projectiles persistants, dix activités bonus et exploration des archives.
- [Déblocages et présentation des verrous](../bible/EXTENSION_02_DEBLOCAGES.md) : états de découverte, droits et disponibilité, contenu installé, silhouettes ou secrets, conditions ET/OU, récompenses, voies de progression, modèles de soutien optionnels, accès hors ligne, expiration, replays et accessibilité.
- [Données extension 01](../bible/extension-01-specs.json) et [extension 02](../bible/extension-02-specs.json) : paramètres candidats et scénarios d'acceptation à réaliser. Ces scénarios écrits ne sont pas des tests exécutés.

Les noms de projet, chorégraphies, coûts, timings et rencontres hypothétiques sont identifiés comme adaptations. Les capacités restent liées à leur personnage et à leur version. Les volets ME1/ME2/ME3 et Andromeda ne créent aucun voyage temporel narratif ; un costume ne confère pas une nouvelle classe. Les PNJ de soutien restent des PNJ. La désignation Neutralisation coordonnée complète la Neutralisation décisive existante.

Les 30 associations et 90 critères historiques de `guide-associations.json`, ainsi que `common-rules.json`, restent inchangés. Le sous-objet d'index lot16 de la matrice historique ne porte pas les comptes actuels ; ceux-ci proviennent du catalogue et de l'index lot19.

## Vérifications et portée

Le [rapport de vérification](verification.json), la [relecture des guides](guide-review.json) et le [contrôle Excel](workbook-verification.json) précisent les commandes, sources et limites. La vérification de fichiers se lance avec `python3 scripts/verify-armax-lot19.py` depuis la racine. Le classeur est importé du lot18 puis modifié avec artifact-tool ; les identités, la feuille de récupérations, les tableaux, volets figés et validations sont préservés.

Tous les nouveaux actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Les animations, les systèmes de tag, les déblocages exécutables, les services de paiement et l'intégration jouable ne sont pas produits par cette livraison documentaire et artistique. Aucune nouvelle illustration de campagne n'est déclarée. Les exclusions de génération antérieures restent actives ; une retouche supplémentaire de Kallo a été refusée, sa version R1 est conservée et aucune relance automatique n'est prévue. Le marine historique reste non attribué et les 113 PNG non récupérés du lot15 restent hors des comptes.

## Continuité

- [Bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md).
- [Lot18 historique](../lot18/README.md).
- [Dossier Armax](../README.md).

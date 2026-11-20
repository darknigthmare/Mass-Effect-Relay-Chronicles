# Armax — lot 08, réduction des manquants

Continuation du **20 novembre 2026**, depuis la PR nº 5 au commit `c8bbc3321feb08c85d799211d27b217c94357bed`.

Ce lot ajoute **dix sujets illustrés et dix PNG originaux** : quatre ennemis, deux costumes et quatre stages. Le catalogue conserve les **164 identifiants existants** ; ses fiches sans image passent de **151 à 141**. Le corpus Armax atteint **112 originaux distincts**, hors trois aperçus historiques de contrôle. Les fichiers et rapports des lots précédents sont conservés.

## Images produites

| Catégorie | Sujet et version | Fichier sélectionné |
|---|---|---|
| Personnage / ennemi | Guardian de Cerberus — ME3 | [Garde presque frontale avec bouclier](../../../public/assets/armax/lot08/fighters/guardian-me3-shield-front.png) |
| Personnage / ennemi | Atlas de Cerberus — ME3 | [Cockpit fermé, léger trois-quarts](../../../public/assets/armax/lot08/fighters/atlas-me3-closed-cockpit-right.png) |
| Personnage / ennemi | LOKI — ME2 | [Pistolet relevé, orientation gauche](../../../public/assets/armax/lot08/fighters/loki-me2-pistol-ready-left.png) |
| Personnage / ennemi | FENRIS — ME2 | [Quadrupède, trois-quarts droit](../../../public/assets/armax/lot08/fighters/fenris-me2-ready-right.png) |
| Costume | Kasumi Goto — tenue de loyauté ME2 | [Garde légère, trois-quarts droit](../../../public/assets/armax/lot08/costumes/kasumi-me2-loyalty-guard-right.png) |
| Costume | Mordin Solus — tenue de loyauté ME2 | [Pose neutre, trois-quarts droit](../../../public/assets/armax/lot08/costumes/mordin-me2-loyalty-neutral-right.png) |
| Stage | Mars — galerie intérieure des archives, ME3 | [Master](../../../public/assets/armax/lot08/stages/mars-me3-archives-gallery-master.png) |
| Stage | Kadara — marché, Andromeda | [Master](../../../public/assets/armax/lot08/stages/kadara-mea-market-master.png) |
| Stage | Eos — salle du cœur du caveau, Andromeda | [Master](../../../public/assets/armax/lot08/stages/eos-mea-vault-heart-master.png) |
| Stage | Pragia — salle du centre de recherche envahie de végétation, ME2 | [Master](../../../public/assets/armax/lot08/stages/pragia-me2-facility-overgrown-master.png) |

Chaque personnage ou costume est une silhouette individuelle entière en PNG RGBA. Les quatre décors sont des masters RGB de **1672 × 941** pixels. Les dix fichiers sont des copies identiques aux sorties du générateur, sans réencodage. Aucune première version supplémentaire n'est comptée dans ce lot.

## Références et revue de fidélité

Les ennemis sont comparés aux planches des modèles texturés publiées par **Jaemus Wurzbach** ; sa page Guardian attribue le bouclier à **Ken Finlayson**. Les variantes de Kasumi et Mordin proviennent du portfolio **Rion Swanson**. Leur identification comme tenues de loyauté ME2 est un recoupement explicite entre les planches alternatives et les index de tenues, détaillé dans les [notes de référence](REFERENCE_NOTES.md).

La [revue indépendante des six silhouettes](character-art-review.json) ne relève aucune erreur majeure confirmée d'identité ou d'anatomie nécessitant une nouvelle génération. Elle conserve les limites observées :

- Guardian est presque frontal et LOKI regarde vers la gauche ; les noms des fichiers reflètent les poses obtenues.
- Le bouclier du Guardian, le canon droit et la pince gauche de l'Atlas, ainsi que les quatre pieds du FENRIS sont visibles. Les équipements sont fusionnés au corps dans chaque PNG.
- Les marges de Mordin sont étroites, environ 13 pixels en haut et 12 en bas au seuil alpha 128. Elles demandent une normalisation avant intégration.
- Les textures, coutures, mécanismes, visages et proportions fines demandent encore une comparaison détaillée à la taille de jeu.

Les [quatre stages](STAGES.md) s'appuient sur des vues publiées par leurs artistes : Neil McKnight pour Mars et Pragia, Paul Haskins pour Kadara, Jonathon Banks pour le caveau. Leurs premiers plans ont été adaptés au duel. **Eos conserve la reconstruction la plus importante : caméra surélevée et bande rectiligne de combat.** Géométrie exacte, glyphes, lumière, reflets et végétation ne sont pas certifiés identiques ; les effets restent incorporés aux images aplaties.

**Tous les nouveaux éléments restent au statut Prototype.** La fidélité 1:1 reste à valider par comparaison détaillée ; aucune animation complète, parallaxe séparée ou intégration jouable n'est déclarée.

## Catalogue et suivi Excel

| Catégorie | Fiches | Avec image candidate | Sans image |
|---|---:|---:|---:|
| Personnages et ennemis | 79 | 7 | 72 |
| Costumes | 38 | 7 | 31 |
| Stages | 47 | 9 | 38 |
| **Total** | **164** | **23** | **141** |

Les 23 fiches illustrées comprennent les treize des lots 06/07 et les dix de ce lot. Les **86 originaux récupérés** restent suivis séparément dans l'onglet `Recuperes`. Ce catalogue de continuation ne prétend pas recenser chaque apparition de toute la licence. Les lots 01/02 et la bible originale de 99 pages restent non retrouvés.

- [Listing complet des manquants](MANQUANTS_2026-11-20.md).
- [Catalogue JSON](production-catalog.json).
- [Mass_Effect_Armax_Suivi_Lot08_2026-11-20.xlsx](Mass_Effect_Armax_Suivi_Lot08_2026-11-20.xlsx).
- [Lot 07 historique](../lot07/README.md), [lot 06 historique](../lot06/README.md) et [inventaire des récupérations](../recovery-20261120/asset-inventory.json).

## Tentatives et traçabilité

**Douze appels au générateur intégré ont produit dix images.** Nemesis et Assault Trooper ME3 ont été refusés sans fichier et sans seconde tentative ; ils restent manquants avec leurs références documentées. Les huit sujets refusés au cumul sont distingués des 133 entrées sans tentative. Aucun refus n'est compté comme un asset produit.

- [Manifest des personnages](fighters-manifest.json), [manifest des costumes](costumes-manifest.json) et [manifest des stages](stages-manifest.json).
- [Références des silhouettes](reference-library.json) ; références des décors et empreintes de leurs cinq images de recherche dans le manifest des stages.
- [Prompts exacts des silhouettes](generation-prompts.json) et [journal des tentatives](generation-attempts.json).
- [Prompts des décors](stages-generation-prompts.json) et [tentatives des décors](stages-attempts.json).

Les images tierces consultées sont des références de recherche ; leurs octets ne sont pas inclus dans le dépôt. Les sources sont attribuées et leurs URL conservées.

## Vérification et régénération du suivi

Depuis la racine du dépôt, avec Python et Pillow :

```bash
python scripts/verify-armax-lot08.py --report docs/armax/lot08/verification.json
```

Ce contrôle vérifie les dix PNG, leur décodage, leurs SHA-256, leurs dimensions, l'alpha des six silhouettes, les liens au catalogue, la conservation des 164 identités et l'absence de doublon avec les **102 originaux précédents**. Lorsque les sorties brutes sont disponibles, il compare aussi leurs octets aux fichiers livrés. Les anciens PNG omis par un checkout partiel sont reconnus dans l'arbre Git ; ils ne sont pas redécodés dans cette passe.

Le [script de préparation du catalogue](../../../scripts/prepare-armax-lot08-catalog.py) et le [builder Excel](../../../scripts/build-armax-lot08-workbook.mjs) reproduisent ce suivi sans réécrire les lots historiques. Le recalcul des formules et la revue des trois onglets sont consignés séparément.

Rapports : [contrôle technique global](verification.json), [contrôle des stages](stages-verification.json), [contrôle du classeur](workbook-verification.json) et [revue artistique des personnages](character-art-review.json).

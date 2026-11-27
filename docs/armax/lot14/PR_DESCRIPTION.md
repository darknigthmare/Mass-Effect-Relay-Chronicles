## Pourquoi

Le suivi du lot 13 laisse 64 fiches sans image et les nouveaux actifs doivent être rattachés à la bible de notre mode combat. Cette PR réunit le lot 13, l’intégration du guide général et la continuation artistique du lot 14, en conservant les identités et les résultats historiques.

## Lot 14 — images fixes et associations

- **21 PNG natifs pour 20 sujets** : CAT6 Heavy et Sniper, Amanda Kenson, Suvi assise ; cinq sous-zones Armax/Omega ; sept effets ME2, deux projectiles, un omni-outil et la grenade-disque ME1. Le R0 de l’omni-outil est conservé mais écarté après correction de sa main holographique inventée.
- **4 anciennes fiches illustrées et 16 ajouts distincts**. Les 172 identités et usages hérités restent inchangés ; aucun nouveau costume n’est livré.
- **188 fiches : 128 avec image, 60 sans**. Couverture : 49/87 personnages, 16/38 costumes, 52/52 stages, 7 effets, 2 projectiles et 2 accessoires. Le corpus suivi atteint 225 PNG originaux, hors trois anciens aperçus.
- Raccordement aux fiches B/C/G/J et aux exigences du guide par IDs explicites, avec usages narratifs, composants d’action candidats et sous-zones séparés. Les 30 rubriques et 90 critères de la bible initiale sont conservés. Les règles de combat et les 36 briefs de plans narratifs restent inchangés.
- Catalogue, manifeste, prompts exacts, références inspectées, inputs ordonnés, revues indépendantes, listing des manquants et classeur mis à jour. Les cinq sources de décors sont des captures de production d’artistes ME3 ; la grenade s’appuie sur le manuel EA.

## Validation

Les 21 copies correspondent aux sorties natives par SHA-256. Dimensions, alpha, références, prompts, révisions et ordre des inputs ont été contrôlés. Les 204 originaux antérieurs restent présents dans l’arbre Git et ne sont pas modifiés. Les 13 exclusions historiques, ainsi que l’historique de la Claymore, sont préservés sans nouvelle tentative.

Le classeur conserve Synthese / Catalogue / Recuperes et le style natif du lot 13. Sa relecture compare 5 122 cellules et 36 caches de formules ; 14 rendus sont inspectés. L’essai de recalcul donne 128/60 → 127/61 → 128/60 après restauration de l’entrée. Aucune erreur de formule.

Contrôles reproductibles : `scripts/verify-armax-lot14.py`, le builder et le sérialiseur du classeur. Rapports : `docs/armax/lot14/verification.json`, `workbook-verification.json`, `catalogue-independent-review.json` et `independent-art-review.json`.

## Portée et réserves

Tous les nouveaux actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Kenson et Suvi sont narratifs ; Suvi inclut son siège. Les marges de Kenson/Suvi, les visages, les détails de costumes et les matières CAT6 restent à améliorer ou comparer. Les décors sont aplatis, dans la caméra de leur référence, sans couches ni collisions de duel.

Les VFX sont des instants reconstruits ; l’attribution Overload et celle des munitions incendiaires restent incertaines. Les associations proposées ne ferment aucune action complète ni aucune illustration narrative. Les 60 fiches sans image et les dépendances au-delà de la première image restent explicitement suivies.

Animations, tests de gameplay, comparaison dans le moteur, ouverture dans Excel natif et validation Windows ne sont pas revendiqués pour ce lot artistique. Aucune certification 1:1 ni fusion de la PR.

## Livrables précédents conservés

Le lot 13 apporte 14 PNG pour 13 fiches, dont 10 anciennes et 3 nouvelles. Son catalogue, ses sources et ses rapports restent inchangés. La bible intégrée du 25 novembre associe le guide général aux règles RC-ARMAX-0.1, six routes pilotes, une campagne globale en deux volets et quatre axes d’arène. Les comptes du lot 13 restent des instantanés historiques ; le lot 14 est le suivi courant.

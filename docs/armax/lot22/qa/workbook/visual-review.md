# Classeur Lot22 + Nacre — contrôle final

## Fichier contrôlé

- Export : `Mass_Effect_Armax_Nacre_Lot22_2026-11-27.xlsx`
- SHA-256 : `f5d2576c03967ba033a188a32d5ef208bb6074f4e5c53bd7892e85f13885228b`
- Les copies de livraison et du dépôt sont identiques octet pour octet.
- Génération, formules, mise en page, recalcul et export réalisés avec `@oai/artifact-tool`. Aucune exécution dans Microsoft Excel natif n’est revendiquée.

## Résultats réconciliés

| Périmètre | Fiches | Avec image | Sans image | Prototype UI vérifié | Kit complet | 1:1 certifié |
|---|---:|---:|---:|---:|---:|---:|
| Canon adapté | 216 | 171 | 45 | 0 | 0 | 0 |
| Nacre original | 110 | 109 | 1 | 0 | 0 | 0 |
| Total | 326 | 280 | 46 | 0 | 0 | 0 |

Le boss Halek Orr est l’unique identité originale sans image. Les 45 manques canoniques restent ouverts. Les révisions d’image ne créent aucune identité supplémentaire. Le suivi du moteur indique 38 tests natifs réussis et une compilation réussie ; le parcours navigateur reste non validé.

## Tests de formules

- Comptages `COUNTIFS` rapprochés des données sources indépendamment des formules.
- Modification temporaire de la présence d’image : variation correcte des totaux originaux et généraux.
- Présence vidée temporairement : anomalie visible, sans conversion silencieuse en absence.
- Identifiant dupliqué temporairement : deux lignes détectées ; unicité restaurée après le test.
- Cellules rétablies avant export ; scan des erreurs de formules sans anomalie.

## Revue visuelle

Treize vues représentatives des six feuilles ont été ouvertes à échelle normale. Les titres, unités, commandes, nombres, gardes, notes, liens stage/boss et réserves de production restent lisibles. Les cellules de Dalo conservent les deux charges, le plafond de 120 points et les 38 frames vulnérables. Les URL sont conservées dans un index de 832 entrées, en dehors des plages de comptage. Cette revue par échantillons ne prétend pas à une inspection manuelle de chaque cellule.

| Feuille | Vue | Plage | Résultat |
|---|---|---|---|
| Synthèse | 01-synthese.png | A1:H32 | Lisible ; aucune superposition visible |
| Gameplay | 02-gameplay.png | A1:E13 | Lisible ; aucune superposition visible |
| Kits | 03-kits-commandes.png | A1:I15 | Lisible ; aucune superposition visible |
| Kits | 04-kits-fonctions.png | J5:L12 | Lisible ; aucune superposition visible |
| Campagnes | 05-campagnes.png | A1:F10 | Lisible ; aucune superposition visible |
| Rencontres | 06-rencontres.png | A1:F9 | Lisible ; aucune superposition visible |
| Rencontres | 07-rencontres-phases.png | G5:J9 | Lisible ; aucune superposition visible |
| Catalogue | 08-catalogue-canon.png | A1:H13 | Lisible ; aucune superposition visible |
| Catalogue | 09-catalogue-originaux.png | A222:H231 | Lisible ; aucune superposition visible |
| Catalogue | 10-catalogue-preuves.png | L5:Q9 | Lisible ; aucune superposition visible |
| Kits | 11-kit-dalo-limites.png | J219:L221 | Lisible ; aucune superposition visible |
| Kits | 12-kits-regles-communes.png | J246:L251 | Lisible ; aucune superposition visible |
| Catalogue | 13-index-sources.png | L334:O339 | Lisible ; aucune superposition visible |

## Limites conservées

Un fichier illustré n’est pas une certification de fidélité. Les profils, routes et états de santé condensés ne constituent pas les kits complets de la bible. Les masters de stage ne sont pas cinq couches de parallaxe, et les PNG d’accessoires assemblés ne sont pas leurs pièces détachées. Les fichiers de campagne illustrée, voix, costumes supplémentaires et animations restent des besoins de production.

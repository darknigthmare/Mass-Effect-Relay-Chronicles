# Classeur Lot22 + Nacre — contrôle final

## Fichier contrôlé

- Export : `Mass_Effect_Armax_Nacre_Lot22_2026-11-27.xlsx` (186,644 octets).
- SHA-256 : `96131a8d939e0500fe1780186a8d43b2aac05b1f40c75ce04893125606f860e1`
- Révision du dépôt : `f2b756fd476e00c5a282345e30464966a982c02e`
- Les copies de livraison et du dépôt sont identiques octet pour octet.
- Génération, formules, mise en page, recalcul et export réalisés avec `@oai/artifact-tool`. Aucune exécution dans Microsoft Excel natif n’est revendiquée.
- Les empreintes SHA-256 des six fichiers JSON sources correspondent encore aux fichiers lus lors de la génération. Le rapport JSON conserve aussi l’empreinte du builder et celles des quatorze vues.

## Résultats réconciliés

| Périmètre | Fiches | Avec image | Sans image | Prototype complet vérifié | Kit complet | 1:1 certifié |
|---|---:|---:|---:|---:|---:|---:|
| Canon adapté | 216 | 171 | 45 | 0 | 0 | 0 |
| Nacre original | 110 | 109 | 1 | 0 | 0 | 0 |
| Total | 326 | 280 | 46 | 0 | 0 | 0 |

Le boss Halek Orr est l’unique identité originale sans image. Les 45 manques canoniques restent ouverts. Les révisions d’image ne créent aucune identité supplémentaire.

## Preuves du gameplay

- 38 tests Armax natifs réussis et 16 contrats natifs du routage des entrées vérifiés.
- Suite générale courante : 1 393 tests réussis sur 1 393, zéro échec, zéro skip, compilation de 170 modules ; onze empreintes concordantes avec la révision `f2b756fd476e00c5a282345e30464966a982c02e` (run `46020607465`).
- Interface : six contrôles limités réussis dans Chromium sur cette même révision, treize empreintes concordantes (run `46020607485`). Le classeur indique « Contrôles UI partiels réussis ». La sélection contient dix personnages et vingt stages ; les duels du smoke concernent Mara/Tavin et les stages 01/02. Le pointeur et la perte de focus sont simulés ; aucun appareil tactile physique n’est certifié.
- La suite historique de la révision `6335856adb5c067625404d24f6c6f0ab2a8b56cb` reste indiquée séparément à 1 392/1 392. Elle ne remplace pas la preuve courante.
- `prototypePlayableVerified` reste `false` et la liste des identifiants entièrement vérifiés reste vide. Aucune validation des dix profils, des kits complets, des campagnes, des boss ou des FX individuels n’est déduite de ces six contrôles.

## Tests de formules et de séparation des statuts

- Comptages `COUNTIFS` rapprochés des données sources indépendamment des formules.
- Essai temporaire `smokeTestPassed=true` : les dix cellules de profil restent inchangées, ainsi que tous les totaux ; indicateur et cellules restaurés après l’essai.
- Modification temporaire de la présence d’image : variation correcte des totaux originaux et généraux.
- Présence vidée temporairement : anomalie visible, sans conversion silencieuse en absence.
- Identifiant dupliqué temporairement : deux lignes détectées ; unicité restaurée après le test.
- Cellules et paramètres rétablis avant export ; sept contrôles internes réussis ; scan des erreurs de formules sans anomalie.

## Revue visuelle

Quatorze vues représentatives des six feuilles ont été contrôlées à échelle normale. Les trois vues dépendant du résultat UI ont été rouvertes après la consolidation ; les onze autres ont été confirmées identiques octet pour octet aux images déjà relues. La dernière actualisation de la suite générale ne change aucune des quatorze images, ce qui a été vérifié par SHA-256. Les titres, nombres, commandes, notes, liens stage/boss et limites de validation restent lisibles. Cette revue par échantillons ne prétend pas à une inspection manuelle de chaque cellule.

Les cellules de Dalo conservent les deux charges, le plafond de 120 points et les 38 frames vulnérables. Les URL intégrales sont conservées dans un index de 832 entrées, en dehors des plages de comptage.

| Feuille | Vue | Plage | Résultat |
|---|---|---|---|
| Synthèse | 01-synthese.png | A1:H32 | Lisible ; aucune coupure ou superposition observée |
| Gameplay | 02-gameplay.png | A1:E13 | Lisible ; aucune coupure ou superposition observée |
| Kits | 03-kits-commandes.png | A1:I15 | Lisible ; aucune coupure ou superposition observée |
| Kits | 04-kits-fonctions.png | J5:L12 | Lisible ; aucune coupure ou superposition observée |
| Campagnes | 05-campagnes.png | A1:F10 | Lisible ; aucune coupure ou superposition observée |
| Rencontres | 06-rencontres.png | A1:F9 | Lisible ; aucune coupure ou superposition observée |
| Rencontres | 07-rencontres-phases.png | G5:J9 | Lisible ; aucune coupure ou superposition observée |
| Catalogue | 08-catalogue-canon.png | A1:H13 | Lisible ; aucune coupure ou superposition observée |
| Catalogue | 09-catalogue-originaux.png | A222:H231 | Lisible ; aucune coupure ou superposition observée |
| Catalogue | 10-catalogue-preuves.png | L5:Q9 | Lisible ; aucune coupure ou superposition observée |
| Kits | 11-kit-dalo-limites.png | J219:L221 | Lisible ; aucune coupure ou superposition observée |
| Kits | 12-kits-regles-communes.png | J246:L251 | Lisible ; aucune coupure ou superposition observée |
| Catalogue | 13-index-sources.png | L334:O339 | Lisible ; aucune coupure ou superposition observée |
| Gameplay | 14-gameplay-controles-ui.png | A23:E27 | Lisible ; aucune coupure ou superposition observée |

## Limites conservées

Un fichier illustré n’est pas une certification de fidélité. Les profils, routes et états de santé condensés ne constituent pas les kits complets de la bible. Les masters de stage ne sont pas cinq couches de parallaxe, et les PNG d’accessoires assemblés ne sont pas leurs pièces détachées. Les scènes de campagne illustrées, voix, costumes supplémentaires et animations restent des besoins de production.

Contrôle terminé : 2026-11-27T15:06:47.947760+00:00.

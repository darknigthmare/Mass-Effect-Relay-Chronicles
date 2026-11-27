# Revue visuelle du classeur Armax — lot 21

Le classeur final a été **récupéré avec ses octets intacts**, puis importé en lecture pour reconstruire les preuves perdues. Les **11 rendus régénérés** ont été ouverts individuellement : les deux parties de la synthèse, les colonnes courantes T à Z, les nouvelles identités, les six vues couvrant les 22 lignes de Revue21, et la ligne aux réserves les plus longues.

## Résultats visibles

| Mesure | Résultat |
|---|---:|
| Fiches | 216 |
| Avec image candidate | 171 |
| Sans image | 45 |
| PNG livrés | 10 |
| Dont récupérés | 7 |
| Dont générés pendant ce tour | 3 |
| Anciennes fiches complétées | 2 |
| Nouvelles fiches illustrées | 8 |
| Sans image exclues de relance | 30 |
| Sans image ouvertes | 15 |
| Dont pistes de réemploi | 4 |

Les titres, valeurs, identifiants, catégories et statuts sont lisibles. Aucune troncature nécessitant une correction n’a été constatée. Les longues réserves et sources restent dans leurs colonnes dédiées, avec retour à la ligne et hauteur adaptée. Le style bleu marine/cyan du modèle est conservé.

Revue21 distingue 7 récupérations, 3 générations, 2 refus sans relance, 5 sujets à produire, 4 pistes de réemploi et 1 recherche de référence. Les deux refus gardent zéro PNG. Victus et Petrovsky gardent leur usage de support narratif.

## Contrôles reconstruits et exécutés

Le script `scripts/review-armax-lot21-workbook.mjs` importe le XLSX sans l’exporter. Il compare les valeurs, formules et tables de Recuperes, Attributions19 et Revue20 au lot20 ; contrôle les 196 identités et H/R historiques ; recalcule la synthèse ; vérifie le passage temporaire d’une image présente à absente, la réaction de Revue21 et la restauration des comptes. Le fichier sur disque reste inchangé. Les 11 aperçus et leurs empreintes sont recensés dans `workbook-verification.json`.

La liaison des nouveaux fichiers sources reconstitués est indiquée séparément par `recovery.sourceBindingComplete` dans le rapport. Les anciennes empreintes des JSON perdus ne sont pas présentées comme celles des fichiers restaurés.

## Portée et empreinte

Cette revue porte sur l’affichage et la cohérence du classeur. Microsoft Excel n’a pas été ouvert. Aucune fidélité artistique 1:1 ni intégration moteur n’est certifiée.

Classeur : `docs/armax/lot21/Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx`.

SHA-256 : `0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4`.

## Liaison finale des sources restaurées

La liaison finale a été exécutée après gel central : `recovery.sourceBindingComplete=true`. Les 216 identifiants, noms, œuvres, variantes, statuts et listes de fichiers du catalogue correspondent au classeur conservé. Les 10 fichiers du manifeste sont retenus, dont 7 récupérés et 3 générés ; les 4 identifiants de réemploi correspondent à l’audit. Aucun export du XLSX n’a été effectué. Les empreintes courantes sont consignées dans `workbook-verification.json`.

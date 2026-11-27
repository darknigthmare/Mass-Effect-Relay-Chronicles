## Problème et résultat

La reprise du catalogue Armax laissait 40 fiches sans image, dont 12 encore ouvertes à la recherche et à la production. Cette continuation examine les 12 en parallèle et apporte **quatre nouveaux sprites fixes candidats** : Ahern dans son apparence de Pinnacle Station sur ME1 original, Joker en tenue SR-2 de ME2, le Général récolteur de ME2 et Wreav de ME3.

Une nouvelle comparaison permet aussi de rattacher à **Jenkins ME1 / Eden Prime** le PNG historique du marine conservé au lot17. Cette attribution ne crée aucune image et ne compte pas comme une génération.

**Le suivi courant compte 196 fiches, dont 161 avec image candidate et 35 sans.** Les 196 identités, variantes, rôles et leur ordre sont conservés. Les trois sources originales du guide et des deux extensions intégrées au lot19 restent intactes. Ces comptes portent sur le catalogue de production disponible et ne mesurent pas l’achèvement global du jeu.

## Périmètre et guides appliqués

- Base de cette continuation : `b83a62d277d93cd8140113ee2318745fcdedf8d6`, branche `feat/armax-missing-lot13-20261124`, PR #11.
- **Lot20** : quatre PNG natifs, un sujet par fichier, tous sélectionnés comme candidats ; une attribution historique ; trois manifestes de production avec références, prompts, décisions et réserves ; catalogue, index courant de la bible, manquants et classeur actualisés.
- **Continuité du lot19** : trois originaux totalisant 163 095 octets, 68 rubriques et 204 critères documentaires ; les 30 rubriques et 90 critères historiques, règles communes et spécifications d’extensions restent inchangés.
- **Extension 01 — équipes et bonus** : sélection/désélection, taunts, assist/tag, ressources d’équipe, supers et fins coordonnées, KO et timeout, clashes/QTE, entités persistantes, dix familles de bonus et exploration des archives.
- **Extension 02 — déblocages** : découverte, droits, disponibilité et installation séparés ; secrets/silhouettes, conditions ET/OU, progression, prêts d’exercice, hors ligne, expiration, replays et accessibilité. Les modèles de soutien restent désactivés ; aucun paiement réel n’est activé.
- Les fichiers des lots antérieurs et les deux attributions quariens du lot19 restent historiques. Les feuilles `Recuperes` et `Attributions19` conservent leurs valeurs et formules ; la nouvelle feuille `Revue20` décrit l’état courant des douze fiches examinées.

Les consignes du dépôt, `docs/GAMEDEV_GUIDANCE.md` et les guides pertinents épinglés par `docs/gamedev-sources.json` ont été appliqués. Pour la production d’images, `create-game-assets`, `provenance.md` et `raster-pipeline.md` ont été lus à la révision `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` et adaptés aux sprites fixes du projet. Les références tierces restent hors dépôt ; leurs URL, empreintes, dimensions et limites sont consignées. Aucun modèle de gameplay canonique n’est déduit d’une pose ou d’une illustration.

## Vérifications effectuées

| Commande ou parcours | Environnement / base | Résultat et preuve |
|---|---|---|
| `python3 scripts/verify-armax-lot20.py` | Python, base `b83a62d` | **279 contrôles réussis** : identités, comptes, images, attributions, exclusions, historique, sources des guides, liens et XLSX ; rapport `verification.json` |
| Relecture indépendante de la consolidation | Fichiers réels et arbre Git de base | **72 contrôles réussis**, empreintes de 43 fichiers, aucun défaut documentaire bloquant ; `consolidation-review.json` |
| Contrôle technique et visuel des quatre nouveaux sprites | PNG natifs et compositions alpha claire/sombre | RGBA 1024 × 1536, une image fixe, transparence et empreintes vérifiées ; références et écarts relus indépendamment ; `independent-art-review.json` |
| Attribution Jenkins | PNG lot17 et références inspectées ME1 / Eden Prime | Octets identiques au fichier Git de base ; casque, armure, silhouette et visage rapprochés ; `imageLot=lot17`, `attributionLot=lot20`, `pngCountLot20=0` |
| Import, édition et recalcul du classeur | `@oai/artifact-tool`, modèle lot19 | Totaux 196 / 161 / 35 ; variation temporaire d’une présence puis restauration vérifiées ; cinq feuilles et tableaux natifs conservés/ajoutés ; `workbook-verification.json` |
| Lecture indépendante de l’export XLSX | XML/ZIP, lecture seule | Identités, valeurs/formules historiques, comptes enregistrés, tables, titres, volets et validations contrôlés ; aucune cellule d’erreur enregistrée |
| Revue des rendus du classeur | Douze panneaux Catalogue et six panneaux de synthèse/revue | **18 panneaux inspectés**, aucun texte tronqué observé ; `workbook-visual-review.json` et `workbook-final-visual-review.json` |
| `git diff --check` contre la base | Arbre préparé pour publication | Réussi |

Les **40 scénarios d’acceptation des extensions sont définis et non exécutés**. Aucun test de combat, de réseau, de paiement, d’ouverture dans Microsoft Excel ou de lancement Windows n’est déclaré pour cette livraison documentaire et artistique.

## Suivi du contenu et des assets

| Mesure | Lot19 historique | Lot20 courant |
|---|---:|---:|
| Fiches conservées | 196 | 196 |
| Avec image candidate | 156 | 161 |
| Sans image sélectionnée | 40 | 35 |
| Nouveaux PNG natifs pendant le lot | 6 | 4 |
| Nouveaux PNG sélectionnés pendant le lot | 4 | 4 |
| Attributions historiques résolues pendant le lot | 2 | 1 |
| Images récupérées restant non attribuées | 1 | 0 |
| Fidélité 1:1 certifiée | 0 | 0 |

La progression de cinq fiches illustrées correspond aux quatre nouveaux sujets et à l’attribution Jenkins. Ses octets historiques ne sont pas dupliqués sous le lot20. Les nouvelles images conservent leurs octets natifs ; aucune retouche locale ni recoloration du livrable n’a été effectuée.

## Compatibilité et limites restantes

Tous les actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Les visages, matières, détails des vêtements ou de la chitine et zones faiblement documentées gardent leurs réserves propres. Les références du Général récolteur reconstruisent un rendu du modèle natif sans certifier le shader du jeu. Sa pose repliée ne prouve ni une animation ni un kit de combat. Ahern et Joker restent des personnages de soutien narratif.

Les **29 exclusions de relance automatique** sont respectées, dont 28 fiches actuellement sans image. Aucun nouvel essai refusé n’est enregistré. Les sept autres fiches sans image restent ouvertes faute de référence assez complète :

| Fiche | Lacune persistante |
|---|---|
| Henry Lawson ME3 | Bas du corps et chaussures non établis par les nouvelles scènes |
| Adrien Victus ME3 | Silhouette du Primarque incomplète : mains, tenue basse, jambes et pieds |
| Oleg Petrovsky ME3 / Omega | Uniforme supérieur identifié, bas du corps et mains insuffisants |
| Thane ME2 / loyauté | Aucune vue complète confirmant la tenue de loyauté exacte |
| Shepard féminin ME3 / Ajax | Gabarit féminin et pieds non suffisamment corroborés |
| Shepard féminin ME2 / Blood Dragon | Vues complètes disponibles, mais corps féminin non prouvé |
| Shepard féminin ME3 / Reckoner Knight | Haut féminin documenté ; bas des jambes et pieds manquants |

Les anciennes réserves du lot19 restent conservées. L’attribution Jenkins résout l’identité candidate, sans certifier tous les détails du visage et de l’armure. Les 113 PNG non retrouvés du lot15 restent exclus des comptes.

Cette continuation modifie les documents, images et outils de suivi. Aucun fichier moteur ou dépendance n’est modifié ; sauvegardes, stock/neuf emplacements, décisions/récompenses et isolation campagne/Chroniques ne changent pas. Les autres poses, animations, illustrations de campagne et fonctions de combat restent à réaliser selon leur statut. La PR reste ouverte.

## Livrables et historique

- [Lot20 : bilan et fichiers](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/README.md), [catalogue](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/production-catalog.json), [manquants](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/MANQUANTS_2026-11-27.md) et [classeur](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx).
- [Bible intégrée](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/BIBLE_ARMAX_INTEGREE.md), [sources originales](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/guides/README.md), [extension 01](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/EXTENSION_01_EQUIPES_ET_BONUS.md) et [extension 02](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/EXTENSION_02_DEBLOCAGES.md).
- [Production et références](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/art-production/manifest.json), [attribution Jenkins](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/recovered-attributions.json) et [réserves visuelles](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/independent-art-review.json).
- [Vérification finale](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/verification.json), [relecture indépendante](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/consolidation-review.json) et [revue des 18 panneaux du classeur](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot20/workbook-final-visual-review.json).
- [Lot19 publié : guide et extensions, six PNG et deux attributions quariens](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/b83a62d277d93cd8140113ee2318745fcdedf8d6/docs/armax/lot19/README.md) et [livraison historique lot18](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/231ffde14652932ffaa667c40315f1232f802d4a/docs/armax/lot18/README.md), dont les routes et briefs de campagne restent conservés.

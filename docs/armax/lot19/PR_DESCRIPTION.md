## Problème et résultat

Le guide général avait déjà été adapté, mais son fichier original n’était pas présent dans le dépôt. Les deux extensions récentes n’étaient pas encore raccordées à cette bible. Cette continuation récupère les trois originaux à l’identique, intègre les 68 rubriques et poursuit la production des sprites fixes manquants.

**Le suivi courant compte 196 fiches, dont 156 avec image candidate et 40 sans.** Les 196 identités et leur ordre sont conservés. La progression vient de quatre sujets nouvellement générés et de deux attributions historiques résolues. Ces comptes concernent le catalogue de production disponible, sans mesure d’achèvement globale de Mass Effect.

## Périmètre et guides appliqués

- Base de cette reprise : `231ffde14652932ffaa667c40315f1232f802d4a`, branche `feat/armax-missing-lot13-20261124`, PR #11.
- **Trois originaux intacts**, 163 095 octets et trois SHA-256 : guide général v1.0, extension 01 Tag/Taunts/Bonus v1.0 et extension 02 Slots/Verrous/Déblocages/Abonnés v1.0.
- **68 rubriques et 204 critères documentaires**, dont les 30 rubriques et 90 critères historiques conservés. Les contrats `guide-associations.json` et `common-rules.json` restent identiques octet pour octet.
- **Extension 01** : sélection/désélection, taunts, assist/tag, ressources d’équipe, supers et fins coordonnées, KO et timeout, clashes/QTE, entités persistantes, dix familles de bonus et exploration des archives.
- **Extension 02** : découverte, droits, disponibilité et installation séparés ; secrets/silhouettes, conditions ET/OU, voies de progression, prêts d’exercice, hors ligne, expiration, replays et accessibilité. Les modèles de soutien restent désactivés ; aucun paiement réel n’est activé.
- **Six PNG natifs**, dont quatre sélectionnés : Kallo Jath MEA, Bailey ME3, Evfra MEA et Drone récolteur ME2. Kallo R0/R2 sont conservés en historique. Les rôles et périodes des fiches sont maintenus.
- **Deux attributions historiques corrigées** : le Quarien violet est associé à Zaal’Koris ME3 et le bordeaux à Han’Gerrel ME3. Les anciennes hypothèses étaient inversées et non sélectionnées. Les fichiers existaient déjà au lot18 : zéro nouveau PNG et zéro génération pour ces attributions.
- Catalogue, index courant de la bible, liste des manquants, manifestes, prompts, rapports et classeur mis à jour. La feuille historique `Recuperes` reste intacte ; `Attributions19` explique les deux rattachements et le marine encore non attribué.

Les consignes du dépôt et `docs/GAMEDEV_GUIDANCE.md` ont été appliquées. Les guides de production artistique, d’interface et de sauvegarde utiles du registre `docs/gamedev-sources.json` ont été lus à leur révision épinglée et adaptés au moteur existant. Les coûts, timings, chorégraphies et plans créés pour Armax sont distingués des éléments canoniques.

## Vérifications effectuées

| Commande ou parcours | Environnement / base | Résultat et preuve |
|---|---|---|
| Relecture des trois sources et des annexes | Base `231ffde`, fichiers locaux et arbre Git | 68 numéros et intervalles de source, 204 critères, 90 critères/priorités hérités, références et ancres vérifiés ; rapport indépendant joint |
| `python scripts/verify-armax-lot19.py` | Même base, Python | Identités, historique, compteurs, sources exactes, liens, PNG, refus et associations concordants ; rapport joint |
| Contrôle des images | PNG natifs, compositions claire/sombre | Six images RGBA 1024 × 1536, transparence réelle, tailles et empreintes vérifiées ; les réserves visuelles restent explicites |
| Rapprochement des deux Quariens | PNG lot17 comparés aux références ME3 inspectées | Fichiers inchangés par rapport au Git de base ; correspondance de casque, respirateur, épaules, drapé et harnais documentée |
| Classeur | `@oai/artifact-tool`, import du lot18 | Recalcul et variation/restauration d’une cellule de présence ; identités, données/formules de récupération, tableaux, volets et validations conservés ; nouvelle feuille d’attributions et rendus inspectés |
| Lecture indépendante de l’export XLSX | XML/ZIP, lecture seule | Totaux enregistrés, formules, titres natifs, tables et absence de cellule d’erreur contrôlés |
| `git diff --check` contre la base | Arbre préparé pour publication | Réussi |

Les **40 scénarios d’acceptation des extensions sont définis et non exécutés**. Aucun test de combat, de réseau, de paiement, d’ouverture dans Microsoft Excel ou de lancement Windows n’est déclaré pour cette livraison documentaire et artistique.

## Suivi du contenu et des assets

| Mesure | Lot18 historique | Lot19 courant |
|---|---:|---:|
| Fiches conservées | 196 | 196 |
| Avec image candidate | 150 | 156 |
| Sans image sélectionnée | 46 | 40 |
| Images ambiguës non attribuées | 3 | 1 |
| Fidélité 1:1 certifiée | 0 | 0 |

Les six PNG de cette passe ne comprennent pas les deux fichiers historiques réattribués. Chaque PNG contient un seul sujet et une seule pose fixe. Les références tierces inspectées restent hors du dépôt ; leurs URL, dimensions, empreintes et limites sont consignées.

## Compatibilité et limites restantes

Tous les actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Les régions reconstruites, le shader du Drone, les doigts/pieds d’Evfra, le visage et les cheveux de Bailey, et la couronne de Kallo restent explicitement à contrôler. La retouche supplémentaire Kallo R3 a été refusée par le service : aucun fichier R3 ni nouvelle tentative après ce refus ; R1 est conservée et l’exclusion est enregistrée.

Les références des deux amiraux ne couvrent pas les jambes et pieds complets. Leur attribution d’identité ne certifie pas tous les détails du sprite. Le marine supposé être Jenkins reste non attribué faute de preuve du visage, de l’opus et de la tenue exacte. Les 113 PNG du lot15 restent non retrouvés et exclus des comptes.

Cette livraison concerne les documents, images et outils de suivi. Elle n’implémente pas les nouvelles mécaniques de combat ou de déblocage et ne modifie aucun fichier moteur, sauvegarde, stock/neuf emplacements, décision/récompense ou isolation campagne/Chroniques. La PR reste ouverte.

## Livrables et historique

- [Lot19 : bilan et fichiers](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/README.md).
- [Bible intégrée](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/BIBLE_ARMAX_INTEGREE.md), [sources originales](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/guides/README.md) et [matrice des 68 rubriques](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/guide-coverage-2026-11-27.json).
- [Extension 01 — équipes et bonus](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/EXTENSION_01_EQUIPES_ET_BONUS.md) ; [extension 02 — déblocages](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/bible/EXTENSION_02_DEBLOCAGES.md).
- [Catalogue courant](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/production-catalog.json), [manquants](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/MANQUANTS_2026-11-27.md) et [classeur](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx).
- [Production artistique et réserves](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/art-production/README.md), [manifeste](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/art-production/manifest.json) et [attributions historiques](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/recovered-attributions.json).
- [Vérification finale](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/verification.json), [revue des guides](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/guide-review.json) et [contrôle Excel](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot19/workbook-verification.json).
- [Livraison historique lot18](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/231ffde14652932ffaa667c40315f1232f802d4a/docs/armax/lot18/README.md), dont les routes et briefs de campagne restent conservés.

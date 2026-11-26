## Problème et résultat

Le catalogue Armax restait au lot 16 alors que deux images du lot 17 étaient déjà publiées et que douze autres sorties natives existaient encore localement. Cette continuation récupère ces fichiers, consolide leurs associations, produit de nouveaux sprites fixes et complète les campagnes documentaires.

**Le suivi courant compte 196 fiches, dont 150 avec image candidate et 46 sans.** Les 192 identités héritées et leurs six champs d’identité/usage sont conservés. Ces comptes décrivent le catalogue de production disponible, sans prétendre couvrir tout l’univers Mass Effect.

## Périmètre et guides appliqués

- Base de reprise : `1e3cea80b1a6ec81d7ca6df8ad70d96988973f10`, branche `feat/armax-missing-lot13-20261124`, PR #11.
- **20 PNG ajoutés** : 12 récupérations du lot 17 et 8 sorties natives du lot 18. Les deux images lot 17 déjà publiées ne sont pas comptées comme nouvelles.
- Neuf récupérations sont associées aux fiches : Lexi T’Perro, Sloane Kelly, Gavin Archer, Maya Brooks, Karin Chakwas, Samantha Traynor, Kestrel masculin et Cerberus Assault masculin/féminin. Trois images restent sans identité attribuée, avec `selected=false`.
- Sept nouveaux sujets : Shepard féminin Inferno, Terminus et Collector ; architecture arrière, sol, groupe table/chaises et console du marché Urdnot à Tuchanka. Le huitième PNG est le sol R0 conservé en historique ; R1 est sélectionné.
- **Quatre routes documentaires** : Grunt, Legion, Tela Vasir et Morinth ; 20 rencontres, 12 scènes, 32 briefs d’illustration et 8 issues. Le nom commun des finishers reste « Neutralisation décisive ». Les six routes pilotes et leurs 36 briefs restent conservés.
- Catalogue, index de la bible, manifestes, prompts disponibles, provenance, liste des manquants et classeur `Synthese / Catalogue / Recuperes` mis à jour.

Les consignes du dépôt, sa bible intégrée et son adaptation documentaire des guides sont conservées. Le fichier brut `Combat_Games_Guide_General_v1.0.txt` n’a pas été récupéré dans cette passe ; les 30 rubriques et 90 critères déjà intégrés restent la référence. Les sources et réserves propres à chaque image figurent dans les manifestes.

## Vérifications effectuées

| Contrôle | Résultat et preuve |
|---|---|
| `python scripts/verify-armax-lot18.py` | 19 contrôles réussis ; détails dans le rapport du lot |
| Identités et associations | 1 152 champs hérités conservés ; catalogue et index de la bible concordants |
| Images des lots 17–18 | 22 PNG décodés et contrôlés par empreinte, dont 20 ajoutés dans cette passe ; 18 sélectionnés et 4 non sélectionnés |
| Fichiers historiques | Chemins vérifiés dans l’arbre Git pour les fichiers non matérialisés dans le checkout partiel |
| Classeur | Recalcul avec artifact-tool ; 41 formules relues indépendamment, zéro erreur ; variation contrôlée 150/46 → 149/47 → 150/46 |
| Préservation du classeur | 192 identités et les 1 118 cellules des 86 lignes récupérées historiques conservées ; rendu des trois feuilles inspecté |
| Documentation | Liens locaux contrôlés ; historique et chiffres courants distingués |
| `git diff --check` | Réussi |

Les scripts, le rapport final, la revue indépendante et le rapport Excel sont livrés avec les fichiers. Aucun test de gameplay, de parallaxe, de lancement Windows ou d’ouverture dans Microsoft Excel n’a été exécuté pour cette livraison documentaire et artistique.

## Suivi du contenu et limites restantes

Tous les nouveaux actifs restent **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Les références partielles, régions reconstruites, halos d’alpha et différences d’échelle restent signalés. Les calques Tuchanka dérivent d’un master interne ; leur raccord à origine identique présente encore des écarts après la révision du sol. Ils ne forment pas une arène prête à jouer.

Les trois images récupérées ambiguës ne réduisent pas les manquants de Jenkins, Han’Gerrel et Zaal’Koris. Les 113 PNG annoncés au lot 15 restent non retrouvés et exclus des comptes présents. Aucun prompt ni reçu de génération absent n’est fabriqué.

Les 32 nouveaux plans narratifs sont des briefs. Une tentative d’illustration de fin de Grunt a été refusée par le service, sans nouvelle tentative ; aucune nouvelle illustration de campagne n’est déclarée produite.

Cette livraison modifie les documents, scripts de suivi et images. Le moteur, les sauvegardes, le stock et les neuf emplacements, les décisions/récompenses et l’isolation campagne/Chroniques restent hors de ce changement. La PR reste ouverte, sans fusion ni déploiement demandé.

## Livrables et historique

- [Lot 18 : bilan et galerie](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/README.md).
- [Catalogue courant](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/production-catalog.json), [manquants](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/MANQUANTS_2026-11-25.md) et [classeur](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx).
- [Compléments de campagnes](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/BIBLE_COMPLEMENTS_LOT18.md) et [récupération du lot 17](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot17/RECUPERATION.md).
- [Vérification finale](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/verification.json), [revue indépendante](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/independent-review.json) et [vérification Excel](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot18/workbook-verification.json).
- Historique conservé : [lot 13](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot13/README.md), [lot 14](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/feat/armax-missing-lot13-20261124/docs/armax/lot14/README.md), [lot 16](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/c1124d45bbe265eec07646db1a705d2381e4cb51/docs/armax/lot16/README.md) et [constat du lot 15](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/blob/c1124d45bbe265eec07646db1a705d2381e4cb51/docs/armax/lot16/RECUPERATION_LOT15.md).

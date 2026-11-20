# Armax — lot 04

Ce lot rassemble **14 fiches de personnages**, leurs propositions de combat ou de soutien, les références visuelles et les images reçues. Le [classeur de production](PRODUCTION_ARMAX_LOT04.xlsx) est généré depuis [fighters.json](fighters.json), [asset-manifest.json](asset-manifest.json) et [recovery.json](recovery.json).

## Contenu récupéré le 20 novembre 2026

Six silhouettes individuelles sont sélectionnées comme **prototypes** : Anderson, Morinth, Tela Vasir, Randall Ezno, le Courtier de l’Ombre yahg et l’Archonte. Leurs empreintes, dimensions et réserves sont consignées dans le manifeste. Les fiches correspondantes indiquent désormais qu’un fichier a été produit.

Trois images supplémentaires restent dans le dossier `review/` : la première version d’Anderson, la première Eve/Bakara et une seconde Eve retrouvée dans les sorties précédentes. Cette dernière est archivée sous `eve-me3-recovered-v2.png`. Son prompt exact et l’identifiant de sa requête n’ont pas été retrouvés ; ils restent inconnus. Cette copie ne constitue ni une nouvelle génération ni une sélection validée.

Le [rapport de récupération général](../RECOVERY_2026-11-20.md) suit les anciens lots désormais retrouvés, dont le lot 03, la continuation Grunt / drone de Legion / Port Hanshan et le Saren d’une autre reprise. Leur récupération est distincte des six images sélectionnées dans le manifeste de ce lot.

## Suivi des personnages

| Personnage | Fichier sélectionné dans ce lot | Travail restant |
|---|---|---|
| Saren | Aucun à ce stade | Rapprocher le candidat retrouvé dans l’autre reprise et sa revue |
| Bénézia | Aucun | Produire et comparer la silhouette complète |
| Nihlus | Aucun | Produire et comparer la silhouette complète |
| Kirrahe | Aucun | Produire la tenue ME1 ivoire/crème conforme à la référence |
| Anderson | `anderson-me1-idle.png` | Corriger le halo et le cadrage ; comparer le costume et le visage |
| Morinth | `morinth-me2-idle.png` | Comparer au modèle final et produire les animations |
| Nyreen | Aucun | Produire la silhouette avec tête découverte |
| Kai Leng | Aucun | Produire la silhouette et vérifier le bas de l’armure |
| Tela Vasir | `tela-vasir-me2-idle.png` | Corriger le halo et vérifier le bas de la tenue |
| Balak | Aucun | Compléter la référence de Bring Down the Sky et produire la silhouette |
| Randall Ezno | `randall-ezno-infiltrator-idle.png` | Corriger le halo et vérifier les membres de la variante casquée |
| Eve / Bakara | Aucun ; deux versions en revue | Comparer les versions et les références ; conserver le rôle de soutien |
| Courtier de l’Ombre yahg | `shadow-broker-me2-idle.png` | Vérifier les détails extrapolés et le cadrage |
| Archonte | `archon-andromeda-idle.png` | Corriger le halo et comparer les détails à la planche auteur |

Les fichiers sélectionnés se trouvent sous `public/assets/armax/lot04/`. Une image contient un seul personnage, corps entier, une seule pose. Les essais bloqués restent enregistrés comme tels dans le manifeste.

## Bible et références

- [Bible d’extension](BIBLE_EXTENSION.md) : modes proposés, règles, kits, narration et besoins d’animation.
- [Références canoniques et briefs corrigés](canon-roster.json) : bon opus, costume et réserves de comparaison.
- [Sources](SOURCES.md) et [provenance des références](source-provenance.json).
- [Point de reprise](REPRISE.md) et [état de récupération](recovery.json).

Les valeurs de combat et dialogues sont des adaptations de fan. Les statuts de fichier, de revue artistique et de jeu restent distincts. Aucun combattant de ce lot n’est déclaré jouable ou fidèle 1:1 par la seule présence d’un PNG.

## Actualiser le suivi

Depuis la racine du dépôt :

```bash
python scripts/verify-armax-lot04.py --write
"$CODEX_PRIMARY_RUNTIME_NODE" scripts/build-armax-workbook.mjs --output-dir /chemin/absolu/outputs/armax-lot04
```

Le générateur exige `CODEX_PRIMARY_RUNTIME_NODE` et `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Il exporte le classeur, recalcule ses synthèses, vérifie les empreintes des images et produit des aperçus de contrôle. Le vérificateur contrôle les données et fichiers ; il ne certifie ni les animations, ni le gameplay, ni la fidélité artistique.

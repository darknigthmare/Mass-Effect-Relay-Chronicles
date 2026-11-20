# Récupération Armax — 20 novembre 2026

86 PNG originaux uniques retrouvés dans cinq sessions. 65 étaient déjà organisés; 21 supplémentaires ont été récupérés par empreinte SHA-256 et revue visuelle. Aucun de ces fichiers ne représente une nouvelle génération de cette reprise.

## Contenu récupéré

| Famille | Originaux PNG |
|---|---:|
| Lot03 | 29 |
| Lot04 complément : Saren, Grunt, Shepard, Illium | 16 |
| Lot04 roster | 9 |
| Continuation : Grunt, drone, Port Hanshan | 11 |
| Lot04 non indexé : Bénézia, Kirrahe, Nyreen (2) | 4 |
| Lot05 : corps, gardes et révisions | 17 |

Les fichiers postérieurs au classeur historique incluent Jack ME3, Tali, Sara Ryder, Scott Ryder, Liara, Garrus, Thane, Mordin, Shepard masculin et Aria. Les corps de Balak, EDI, Kai Leng, Legion et Wrex restent absents avant les générations du nouveau lot. Jack ME2 est un costume distinct à produire.

## Réserves et sources

Le [manifeste courant](asset-inventory.json) relie chaque original à son chemin final, à son SHA-256 et à son ancien fichier. Les 21 originaux auparavant non organisés gardent leurs pixels exacts. Pour 14 sorties, les noms ont été attribués par revue visuelle; le prompt exact et la référence d’entrée ne sont pas retrouvés. Les fichiers restent des prototypes à comparer.

Les lots01/02 et la bible originale de 99 pages ne sont pas retrouvés. Le classeur historique est conservé dans [history/](history/) pour sa provenance; son décompte de 72 images n’inclut pas les 14 dernières récupérations et ne constitue pas la synthèse actuelle. Aucun clip complet, aucun combattant Armax jouable et aucune fidélité 1:1 ne sont certifiés.

Les trois chemins de preuves du complément lot04 ont été corrigés vers les rapports déjà importés dans `docs/armax/production-history/recovered-lot04-art/`. Trois autres rapports cités par le classeur historique — `consolidation/recovered-originals.json`, `lot05/provenance/team-a-report.json` et `lot05/provenance/team-b-qa.json` — n’ont pas été retrouvés dans les sessions sources. Pour les huit images concernées, `historicalProof` vaut donc `null`; `historicalProofRecovery` conserve le chemin cité, la source de cette mention et la réserve. Les PNG restent présents et vérifiés. Le vérificateur courant contrôle désormais l’existence de chaque chemin `historicalProof` non nul; ce contrôle n’atteste pas le contenu artistique des rapports.

## Archive ZIP historique

Le ZIP redondant du lot03 (48273099 octets) reste dans la source locale mais n’est pas dupliqué dans cette PR. Son contenu déplié, ses 29 PNG originaux et ses données sont conservés. Les anciens documents qui mentionnent ce ZIP décrivent la livraison passée. L’[inventaire d’import](import-inventory.json) enregistre explicitement cette omission; ce n’est pas un asset manquant.

## Origines

- `c3ca3f19d191` : 45 originaux (lot03 et complément lot04).
- `b2b5b6323238` : 9 originaux roster.
- `31dbe5b9797f` : 11 originaux continuation.
- `2dadc48757e5` : 4 originaux supplémentaires.
- `8a00afd92c39` : 17 originaux lot05.

# Armax — point de reprise du lot 04

## Base historique vérifiée le 19 novembre

Cette continuation part de `main` au commit `deb5c9382a697acd0cf72b182bc646337cdcfb25` du dépôt [Mass-Effect-Relay-Chronicles](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles). L'arbre Git consulté compte 10 592 entrées et ne contient aucun chemin Armax. Les quatre PR historiques sont fermées et fusionnées. Aucune PR ouverte ni branche Armax n'était présente au début de cette reprise.

Les instructions du dépôt, le guide gamedev et les briefs artistiques ont été relus. Le moteur Three.js, les dépendances, la campagne ATB et les sauvegardes ne sont pas modifiés par ce lot de production.

## Récupération actualisée le 20 novembre 2026

La reprise du 19 novembre n’avait pas retrouvé les anciens lots parmi les éléments alors accessibles. L’examen des copies locales le 20 novembre a retrouvé le lot 03, la continuation Grunt / drone de Legion / Port Hanshan et un Saren d’une autre reprise. Le [rapport général de récupération](../RECOVERY_2026-11-20.md) fait foi pour leurs fichiers et leur consolidation. Cette récupération ne constitue pas une nouvelle génération et ne valide pas leur intégration en jeu.

| Ensemble | Éléments annoncés | État de récupération |
|---|---|---|
| Lot 01 | `Mass_Effect_Armax_Bible_v1.pdf`, `.docx`, `Mass_Effect_Armax_Production_v1.xlsx`, `Mass_Effect_Armax_Pack_v1.zip` | Non retrouvé |
| Lot 02 | `Mass_Effect_Armax_Lot02_v2.0.0.zip` ; Shepard homme, Liara, Wrex, Mordin, Jack, Thane, Legion, IDA/EDI, Aria, Scott et Sara Ryder | Non retrouvé |
| Lot 03 | `Mass_Effect_Armax_Lot03_v3.0.0.zip`, `Bible_Complement_Lot03.md`, `asset-manifest.json` ; Shepard femme, Ashley, Kaidan, Miranda, Jacob, Samara, Kasumi, Zaeed, James, Javik, Cora, Liam, Peebee, Jaal, Vetra, Drack et six décors | Retrouvé ; voir le rapport général |
| Continuation | Quatre poses de Grunt, deux états du drone de Legion, Port Hanshan et trois plans parallaxe ; Claymore M-300 non produit | Retrouvée ; voir le rapport général |
| Saren | Pose droite d’une autre continuation, avec sa revue et ses références | Retrouvé ; rapprochement avec le casting courant à effectuer |

Les lots 01 et 02 demeurent non retrouvés dans ce périmètre. Les onze PNG d’armures d’octobre identifiés précédemment ne sont pas les lots de combat recherchés. Le suivi structuré de récupération se trouve dans [recovery.json](recovery.json) et alimente la feuille Reprise du classeur.

Dans le présent lot, les six images sélectionnées ont été recopiées avec leurs empreintes vérifiées. Les six fiches correspondantes indiquent `assetProduced: true` et le statut Prototype. Deux premières versions restent archivées pour revue. Une seconde Eve/Bakara, retrouvée dans les sorties de génération, est ajoutée comme `review/eve-me3-recovered-v2.png` avec son empreinte. Son prompt exact et l’identifiant de requête restent inconnus ; aucun historique de génération n’est inventé et cette image n’est pas sélectionnée automatiquement.

## Décision de continuation

Le lot 04 ajoute quatorze fiches distinctes des personnages annoncés dans les lots 02 et 03 : Saren, Bénézia, Nihlus, Kirrahe, Anderson, Morinth, Nyreen, Kai Leng, Tela Vasir, Balak, Randall Ezno, Eve/Bakara, le Courtier de l'Ombre yahg et l'Archonte. Eve reste un soutien narratif. Les mécaniques Armax, dialogues, chiffres et issues de simulation sont des adaptations de fan explicitement séparées des faits canoniques.

Les générations sont enregistrées dans [asset-manifest.json](asset-manifest.json). Le tableau `assets` contient seulement des fichiers effectivement reçus et contrôlés. Le tableau `generationAttempts` conserve également les tentatives refusées. Un refus ne donne lieu ni à un fichier de remplacement fictif, ni à un statut de réussite.

Les références tierces servent à la comparaison et restent citées par URL ; leurs captures ne sont pas incorporées comme nouveaux sprites du projet. Les prompts préparés et les requêtes réellement soumises sont distingués. Aucun personnage n'est déclaré jouable par la seule présence d'une fiche ou d'un visuel.

## Reprise suivante

1. Consulter le rapport de récupération, comparer les empreintes et identifiants des fichiers retrouvés et préserver les réserves historiques lors de leur consolidation.
2. Produire les silhouettes encore manquantes ou bloquées en conservant l'opus exact, l'anatomie, les costumes et les références validées.
3. Comparer chaque silhouette aux références à taille réelle. Une transparence correcte ne valide pas la fidélité artistique.
4. Produire les poses et transitions indiquées dans le suivi, avec pieds, volumes et costume stables.
5. Intégrer et tester les personnages dans un véritable mode Armax avant de faire progresser le statut d'intégration ou de jeu.

La liste historique de « 36 tâches restantes » n'a pas été retrouvée comme fichier ; elle n'est pas reconstruite arbitrairement ni présentée comme le total courant du projet.

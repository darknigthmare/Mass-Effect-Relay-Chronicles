# Armax — récupération du lot 04 artistique

**Récupéré le 20 novembre 2026 : 16 images originales, sept fichiers de mesures, 39 journaux ou revues et trois compositions de contrôle.** Les copies conservent les octets des fichiers retrouvés. Aucun dessin ni pixel n'a été modifié pendant cette récupération.

## Identité du lot

Ce dossier préserve la production artistique du **19 novembre 2026** retrouvée dans la session `c3ca3f19d191`. Elle portait déjà le nom « lot04 ». Elle est **distincte du [lot04 de fiches roster](../lot04/REPRISE.md)**, préparé dans une autre reprise du projet. Son identifiant courant est `recovered-lot04-art-20261120` ; les anciens identifiants restent dans les journaux pour conserver leur provenance.

Le [manifeste de récupération](recovery-manifest.json) donne les chemins relatifs au dépôt, les SHA-256, les sources, les fichiers de provenance et le statut de chaque image. Les [journaux historiques](../production-history/recovered-lot04-art/) gardent leur contenu d'origine, y compris leurs anciens chemins de travail. Ces chemins historiques ne sont pas des commandes à exécuter dans un nouveau clone.

## Contenu récupéré et statuts

| Ensemble | Images | Statut conservé |
| --- | ---: | --- |
| Grunt et Saren, poses orientées vers la droite | 2 | Prototypes retenus avec réserves |
| Shepard femme : anticipation, récupération, réaction légère et victoire | 7 | Générées et mesurées ; sélection finale non enregistrée |
| Illium : plans L0 à L5 | 6 | Études retenues pour assemblage ; parallaxe incomplète |
| Saren, première orientation vers la gauche | 1 | Historique non retenu |
| **Total des sorties originales** | **16** | **Aucune validation de fidélité 1:1 ni d'intégration en jeu** |

Les trois compositions `assembly_native_*.png`, conservées dans les journaux, sont des preuves de contrôle dérivées. Elles ne s'ajoutent pas aux seize sorties originales et ne constituent pas trois nouvelles arènes.

### Grunt et Saren

- [Grunt — pose droite](assets/fighters/grunt/grunt_pose_right_v1.png) : RGBA, 1086 × 1448. La revue conserve des réserves sur le visage, les doigts, les plaques, les appuis et les marges.
- [Saren — pose droite](assets/fighters/saren/saren_pose_right_v1.png) : RGBA, 1024 × 1536. La revue conserve des réserves sur les mains, les tubes d'armure, la teinte du visage et la correspondance des jambes avec le modèle final.
- [Saren — première orientation gauche](history/saren_pose_left_neutral_v1.png) : version historique non retenue. Elle n'a pas été retournée par logiciel, afin de préserver la trace de l'asymétrie du costume.

Les [revues de Grunt](../production-history/recovered-lot04-art/fighters_a/grunt_qa.md) et de [Saren](../production-history/recovered-lot04-art/fighters_a/saren_qa.md) décrivent les écarts. Les sources comprennent le guide officiel de Grunt et les rendus/concepts identifiés de Saren ; leurs URL sont inscrites dans le manifeste. Les captures tierces ne sont pas redistribuées dans cette récupération.

### Sept poses de Shepard encore à sélectionner

Les fichiers se trouvent dans [assets/keyposes/shepard_female_n7/](assets/keyposes/shepard_female_n7/). Chaque image possède son fichier de mesures `.metadata.json`.

| Action | Versions présentes |
| --- | --- |
| Anticipation du coup gauche | R0 et R1 |
| Récupération du coup gauche | R0 et R1 |
| Réaction légère à un impact | R0 et R1 |
| Victoire sobre | R0 |

**Les sept enregistrements historiques portent encore `selected: false`.** La récupération n'interprète pas cette valeur comme une sélection ni comme un rejet artistique définitif : la sélection finale n'avait pas été enregistrée. Les R1 ont été produites pour travailler l'échelle apparente ; la continuité avec les poses du lot03, les appuis et le timing restent à comparer. Cet ensemble ne constitue pas un clip d'animation complet.

Les deux poses sources de référence appartiennent au [lot03](../lot03/README.md). Leurs chemins actuels et leurs sources figurent dans le manifeste ; aucune copie supplémentaire de ces mêmes images n'a été ajoutée ici.

### Illium : six plans présents, défilement encore défectueux

Les six plans se trouvent dans [assets/stages/illium_nos_astra_me2/layers/](assets/stages/illium_nos_astra_me2/layers/). Ils partagent le cadre **1774 × 887** : L0 est opaque, L1 à L5 possèdent un alpha réel.

| Plan | Contenu |
| --- | --- |
| L0 | Ciel, nuages et soleil |
| L1 | Ville lointaine |
| L2 | Tours principales et passerelle |
| L3 | Bordure arrière et lampes |
| L4 | Sol de combat |
| L5 | Grille de premier plan |

La [revue d'assemblage historique](../production-history/recovered-lot04-art/stages_c/assembly_review.json) relève un raccord fixe utilisable pour l'étude, mais **aucune marge de pixels hors cadre**. Avec les facteurs de contrôle inscrits dans cette revue, un déplacement de caméra de ±32 pixels laisse apparaître du ciel là où le sol devrait continuer ; le manque atteint 32 pixels pour le sol et 36 pixels pour la grille. Les mêmes défauts apparaissent à gauche ou à droite selon le sens du déplacement.

Plusieurs tours secondaires ont aussi disparu ou ont été recomposées. Les tests historiques ne valident ni le défilement dans le moteur, ni une boucle continue, ni une fidélité exacte. Des continuations hors cadre ou une fenêtre de rendu adaptée doivent être produites et vérifiées avant de déclarer cette parallaxe terminée.

## Continuation récupérée en parallèle

La [continuation Grunt, drone de Legion et Port Hanshan](../../combat-2d/README.md) a également été copiée depuis le commit local `9b051c05ced42d91cb081d9d4fa35d6eefb8cde7`. Ses dix images retenues, sa première garde historique, ses documents, son classeur et ses deux scripts ont été conservés sans réécriture. La section `relatedContinuation` du manifeste enregistre les 22 fichiers copiés et leurs empreintes.

Les mentions « introuvable » ou « manquant » des anciens rapports décrivent leur contexte de rédaction. Cette récupération apporte des fichiers supplémentaires, mais ne réécrit pas les preuves historiques. Le présent manifeste identifie les fichiers désormais retrouvés ; les registres de chaque lot gardent leurs limites artistiques et fonctionnelles.

## Vérification de la récupération

Le [rapport de récupération](recovery-verification.json) distingue les contrôles actuels des revues historiques : correspondance des copies et SHA-256, décodage des PNG, présence des fichiers reliés, contrôle du registre de continuation et syntaxe de ses scripts. Ces contrôles ne constituent pas une nouvelle revue artistique ni un essai de gameplay.

Les caches de références tierces, copies redondantes de `generated_images`, profils d'outils et helpers de publication de la session restent hors de cette récupération. Aucun fichier source local n'a été supprimé.

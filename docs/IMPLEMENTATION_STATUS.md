# État de livraison — 0.2.0

Mise à jour : **23 octobre 2026**. Base reprise : dernier `main` disponible, **`27daea0b577650589cef46e896eae79fc9ff4f37`**. Cette version conserve son dossier Shepard, ses sauvegardes manuelles, ses conversations, son codex et ses trois assignations.

## Résultat jouable

La campagne condensée reste jouable du briefing initial au bilan final : **neuf scènes 3D, huit étapes et 21 rencontres de campagne**. La version ajoute **onze opérations annexes, 43 étapes, quatre combats possibles, 48 références d’équipement** et deux atlas d’animation pour Shepard féminine.

Cette livraison est un prototype jouable de l’adaptation ATB. La reconstitution intégrale 1:1 de Mass Effect reste un objectif de production : cartes condensées, dialogues réécrits, animations partielles et références graphiques encore à contrôler.

| Domaine | Livraison observable |
|---|---|
| Exploration | 9 scènes 3D, collisions, navigation au clic, clavier, course et suivi d’objectif |
| Campagne | 8 étapes, 21 rencontres persistantes, enquête à ordre partiellement libre et quatre décisions majeures |
| Groupe | Shepard, Jenkins au départ, puis six compagnons recrutables ; deux équipiers actifs |
| Combat | 6 classes, modes Attente/Actif, trois difficultés, chaleur, boucliers, pouvoirs, états et effets d’équipement |
| Assignations | 3 assignations historiques et 11 nouvelles opérations à la Citadelle et à Féros ; progression et issues persistantes |
| Équipement | 20 armes, 16 armures et 12 modules ; inventaire de 150 objets, achat/vente, stocks et comparaison |
| Personnage | Deux apparences, trois origines, trois profils psychologiques et dossier consultable |
| Sauvegardes | Auto hors combat, 6 emplacements manuels, import/export JSON et migration des anciennes parties v1 |
| Narration | 9 interlocuteurs et 18 sujets conditionnels au Normandy, conseil à Garrus mémorisé, 16 notices de codex progressives |
| Carte et journal | Filtres, légende, repères lisibles, étapes et conditions de blocage, suivi d’une opération |
| Art | 10 PNG, 48 sujets d’atlas, 32 images de marche, 4 poses de combat féminines et une illustration d’accueil |
| Son | Ambiances et effets locaux Web Audio ; aucun doublage |
| Distribution | Compilation Vite, configuration Electron/Windows, configuration Vercel et workflows GitHub existants |

## Ce que change la version

### Opérations annexes

La Favorite, Xeltan, Emily Wong, les veilleurs, le signal suspect, le prédicateur et Michel constituent les sept ajouts à la Citadelle. Féros reçoit l’eau, les cellules énergétiques, les geth des tunnels et les données de Gavin. Le journal explique les prérequis et conserve les choix. Les opérations terminées ne paient qu’une fois.

Les quatre combats possibles fonctionnent avec le moteur ATB et ses statistiques. Le joueur peut éviter celui de Michel par persuasion. Une sauvegarde effectuée après la décision de combattre reprend la rencontre ; elle n’accorde aucune victoire. Michel réduit ensuite de 20 % le prix du médi-gel. Les services à la colonie et les recherches récupérées apparaissent dans le rapport de Féros.

Des avertissements précèdent les échéances du Thorien et du Conduit. Les données de Gavin déjà copiées peuvent encore être rapportées après le Thorien. Les opérations utilisent les cartes condensées et quatre scans représentatifs de veilleurs ; leurs variantes complètes restent à produire.

### Équipement et sauvegardes

Chaque personnage possède cinq emplacements : arme, armure, module d’arme, modification de munitions et module d’armure. Les quantités, crédits et stocks sont contrôlés avant chaque transaction. Une pièce portée ne peut pas être vendue. Les objets de Jenkins ou d’un autre compagnon disparu restent récupérables.

Les restrictions d’espèce, de classe, de niveau et d’entraînement s’appliquent dans l’interface et dans les règles. Les modifications de chaleur, refroidissement, protection et dégâts sont utilisées en combat. Les bonus sont calculés depuis les statistiques de base, sans accumulation à chaque ouverture de menu. Les cinq objets de départ conservent les statistiques de la version antérieure.

Les anciennes parties reçoivent un inventaire initial et un registre d’opérations vide uniquement lorsque ces champs sont absents. Le dossier, les recrutements, les pertes, les conversations, le codex, les choix et les trois assignations restent inchangés. Une structure explicitement invalide est refusée.

### Sprites féminins

Les nouvelles planches fournissent seize images de marche dans quatre directions et quatre poses de combat : visée, pouvoir, impact et KO. Le renderer utilise les rectangles, pivots et échelles propres aux frames. La création, le dossier et l’équipement réutilisent une silhouette recadrée sur l’atlas de marche.

Les métadonnées sont incluses dans le JavaScript compilé pour le chargement local. Les quatre poses ne constituent pas quatre animations complètes. Les limites artistiques et la provenance sont décrites dans [ASSETS.md](ASSETS.md) et [shepard-female-art.md](research/shepard-female-art.md).

## Vérifications de cette version

Les rapports ci-dessous concernent les sources 0.2.0. Le [rapport de livraison](qa/v0.2.0-report.json) rassemble leurs résultats et les empreintes utilisées.

| Contrôle | Résultat et portée | Preuve |
|---|---|---|
| Règles Node | 199 contrôles réussis dans 16 fichiers, aucun échec ni test ignoré | [unit-report.json](qa/unit-report.json) |
| Campagne complète | 21 victoires, huit étapes, bilan final et quatre choix conservés après reprise | [campaign-report.json](qa/campaign-report.json) |
| Opérations | 11 conclusions, 43 étapes, 4 victoires annexes et 4 victoires de campagne nécessaires ; reprise de Michel et réduction médicale | [operations-report.json](qa/operations-report.json) |
| Équipement | 6 contrôles : transactions, sauvegardes auto/manuelles/export/import, quatre onglets à 390 px, véritable victoire et récupération du matériel de Jenkins | [loadout-report.json](qa/loadout-report.json) |
| Apparences | Création, dossier, export/import, reprise, déplacement clavier et combat pour les deux apparences ; migration v1 | [commander-report.json](qa/commander-report.json) |
| Poses féminines | Quatre poses rendues avec les UV et échelles attendus ; fixture distincte du parcours de campagne | [femshep-poses-report.json](qa/femshep-poses-report.json) |
| Assignations antérieures | Régression du premier contact tardif de Conrad, des issues de Samesh et de la famille ; rapport de la version courante | [assignments-v02-report.json](qa/assignments-v02-report.json) |
| Distribution web | Compilation réussie ; quatre contrôles de chargement local du build et des ressources | [build-report.json](qa/build-report.json), [production-v02-report.json](qa/production-v02-report.json) |

Les combats navigateur accélèrent le temps simulé mais utilisent les actions, dégâts, récompenses et conditions réels. Ils n’injectent pas de victoire ou de drapeau de progression. Le parcours d’opérations vérifie la collision et le chemin vers chaque marqueur, puis place Shepard à ce point avant l’interaction clavier ; il ne représente pas 43 trajets parcourus manuellement.

Les quatre poses sont contrôlées dans une scène isolée ; le test force notamment une santé nulle pour inspecter le KO. Cette fixture ne valide pas l’équilibrage. Le contrôle de distribution charge le build dans Chromium par `file://` avec autorisation de lecture locale ; il ne remplace pas un essai du programme Electron ou du portable Windows.

Captures : [équipement](screenshots/v02-equipment-loadout.png), [équipement mobile](screenshots/v02-equipment-mobile.png), [carte](screenshots/v02-local-map.png), [opérations terminées](screenshots/v02-operations-completed.png), [journal mobile](screenshots/v02-mobile-journal.png).

## Excel et catalogues

Le classeur principal contient **1 321 fiches, 26 catégories et 28 feuilles**. Les **118 nouvelles fiches** détaillent 48 objets, 43 étapes, quatre rencontres, vingt frames et trois quêtes absentes du catalogue. Huit autres quêtes réutilisent leurs fiches existantes. Au total, 32 fiches antérieures sont enrichies.

La comparaison avec `27daea0` confirme la conservation des **1 203 identifiants**, des **57 fiches ME2/ME3** et des **six enregistrements Intégré/Validé**. Les statuts finaux sont 1 038 Défini, 277 Prototype, trois Intégré et trois Validé. Ces statuts décrivent les critères de chaque fiche, sans certifier la fidélité artistique globale.

Artifact Tool a recalculé le classeur. Le contrôle de son archive XLSX compare **22 457 cellules** au JSON, relève **274 formules sans erreur**, vérifie les 26 tables filtrées, les validations, les volets figés et les dépendances. Les aperçus concernés ont été inspectés. L’ouverture dans Microsoft Excel ou LibreOffice natif n’a pas été exécutée.

Preuves : [native-export-check.json](workbook-previews/native-export-check.json), [verification.json](workbook-previews/verification.json), [Dashboard](workbook-previews/Dashboard.png). Les **27 classeurs de l’univers, soit 5 326 fiches**, restent conservés dans [universe/](universe/README.md).

## Reproduire les contrôles

```bash
npm ci
npm test
npm run build
```

Pour les scénarios navigateur, ouvrir un terminal avec `RELAY_QA=1 npm run dev`, puis lancer `npm run test:campaign`, `npm run test:commander`, `npm run test:operations`, `npm run test:loadout` ou `npm run test:assignments -- --late-conrad`. `PLAYWRIGHT_EXECUTABLE_PATH` permet de désigner un Chromium installé. Le test `node scripts/production-v02-browser.mjs` exige un build récent et ne dépend pas du serveur de développement.

## Historique conservé

Les rapports [dossier-and-saves](qa/dossier-and-saves-report.json), [story-and-recruitment](qa/story-and-recruitment-report.json) et [assignments-and-deployment](qa/assignments-and-deployment-report.json) décrivent les compléments précédents, avec leurs empreintes propres. Ils ne sont pas présentés comme de nouveaux essais 0.2.0.

L’équilibrage de référence avait parcouru 18 campagnes et 378 rencontres avec une politique déterministe : [balance-report.json](qa/balance-report.json). Cette version n’annonce pas une nouvelle matrice complète de difficulté pour les 48 équipements. Le [rapport Windows initial](qa/build-v0.1.0-report.json) concerne le portable 0.1.0 construit sous Linux, sans essai d’exécution sur Windows. Les workflows du dépôt produisent les artefacts de la version poussée ; leur résultat est à consulter dans GitHub Actions.

La configuration Vercel est conservée. Aucun nouveau déploiement Vercel n’est annoncé dans ce complément ; son état antérieur et ses commandes restent documentés dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Travail restant

- Reconstituer les 100 sous-zones et 91 liaisons, intérieurs et géographies exactes.
- Produire les 51 autres quêtes du registre secondaire/DLC et les variantes complètes des 14 prototypes.
- Compléter dialogues, cinématiques, romances et réactions aux antécédents de Shepard.
- Nettoyer les cycles et produire tous les movesets, huit directions, expressions et variantes visuelles d’équipement.
- Ajouter la conduite et le combat du Mako, les talents détaillés, licences et toute la gamme d’objets.
- Éprouver l’équilibrage avec des joueurs, les commandes manette, le mobile et les matériels réels.
- Produire doublage et musique ; développer les campagnes des autres jeux et adaptations à partir de leurs catalogues.

Le rendu navigateur est testé avec WebGL logiciel. Aucune fréquence d’images sur un PC de joueur, couverture matérielle exhaustive ou certification 1:1 n’est revendiquée. Le [suivi de fidélité](FIDELITY.md) détaille les limites par domaine.

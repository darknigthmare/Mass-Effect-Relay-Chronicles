# État de livraison — 0.2.0

Mise à jour : **25 octobre 2026**. La livraison initiale 0.2.0 reprenait `27daea0`. Le complément équipement reprend **`c614a452b1cdd2712d34ad2344471c01d2c8d209`**, conserve ses opérations, son matériel, les animations féminines et le correctif Windows, puis ajoute les outils et les formations décrits ci-dessous.

## Complément soutiens, munitions et portraits — 25 octobre 2026

Le lot actuel reprend `748b965`. Il raccorde **quatre fiches de soutien à trois actions** : Drone de combat ME2/ME3, Tourelle de garde ME3 et Drone de défense ME3. Chaque invocation devient une entité ciblable, dotée de PV, d’une durée et d’un propriétaire. Les soutiens ne sont pas commandables, ne reçoivent pas les soins du groupe et ne comptent pas dans la détermination des vainqueurs. Les plafonds, cadences, durées, retrait lorsque le propriétaire tombe et réaction défensive sont des choix ATB explicités, sans simulation de proximité originale.

**Dix fiches de munitions exposées donnent six actions de modes exclusifs**, plus leur désactivation. Les modes appris demandent le kit, l’œuvre et une arme conventionnelle à clips compatibles. Activation et désactivation consomment un ordre ATB sans remplir les réserves ; les effets restent limités aux tirs, avec dégâts par couche et états après perte réelle de santé. Pouvoirs, invocations, armes à chaleur et six armes spéciales restent exclus. Warp Ammo ME3 et les consommables de munitions Andromeda restent fermés. Les **61 fiches de pouvoirs exposées correspondent désormais à 30 commandes**, hors désactivation.

La préparation conserve ses choix dans `ammoModes`, avec validation stricte et migration neutre des anciennes sessions. Changer de classe ou d’arme retire un mode incompatible ; les activations pendant un combat ne réécrivent pas la préparation sauvegardée. Les Chroniques restent séparées de la campagne ME1.

Un onzième PNG local fournit **trois bustes de prototype**, limités à Miranda ME2, Thane ME2 et Garrus ME3 dans leurs contextes autorisés. Il ne livre ni sprite en pied, ni huit directions, ni animation ou costume complet. Les autres profils gardent leurs symboles. Les [références des soutiens et munitions](research/chronicle-support-sources.md) et les [références des portraits](research/chronicle-portrait-sources.md) distinguent faits consultés, attributions secondaires et adaptations.

Le lot ajoute **17 promotions Prototype** : quatre pouvoirs de soutien, dix de munitions et trois portraits partiels. Le décompte vérifié après reconstruction est de **530 Prototype, 6 120 Défini, trois Intégré et trois Validé**, soit **6 656 fiches et 449 sources**. Le [rapport global](qa/chronicle-support-report.json) relie les résultats suivants à leurs sources.

| Validation du lot actuel | Résultat et portée |
|---|---|
| Tests Node | 473 réussis sur 473, aucun échec ni test ignoré |
| Build web | Compilation réussie de 47 modules |
| Nouveau parcours navigateur | Cinq contrôles ; dix cartes de munitions, quatre de soutien, trois portraits et une victoire réelle |
| Régression des Chroniques | Six contrôles, seize victoires ; passage antérieur à la correction SVG finale, ensuite couverte par le parcours du lot et la production |
| Production HTTP | Douze contrôles, onze PNG et sept bundles servis avec empreintes vérifiées |
| Différentiel combat ME1 | Bilans, événements et résultats d’ordres identiques sur 30 graines et 1 755 ordres acceptés |
| Classeurs | 28 XLSX vérifiés ; 21 exports univers reconstruits et six conservés |
| Revue des classeurs | 30 panneaux ciblés de deux classeurs univers et trois panneaux du principal |
| Revue des portraits | Sept captures finales revues après correction du débordement entre cellules SVG |

Preuves détaillées : [nouveau parcours](qa/chronicle-support-browser-report.json), [régression](qa/chronicle-support-legacy-universe-report.json), [production](qa/chronicle-support-production-report.json), [différentiel ME1](qa/chronicle-support-me1-combat-diff.json), [exports](qa/chronicle-support-workbook-export-report.json), [revue univers](qa/chronicle-support-workbook-visual-report.json), [principal](qa/chronicle-support-main-workbook-report.json) et [portraits](qa/chronicle-portrait-ui-review.json). La correction SVG isole les bustes voisins sans retouche de l’atlas. Les bustes restent partiels, sans huit directions ni animations.

Ce lot ne revendique aucune nouvelle campagne complète de 21 combats, aucun lancement Windows et aucune fidélité 1:1 complète. Les résultats de campagne et de distribution ci-dessous concernent uniquement les livraisons historiques indiquées.

## Complément spécialistes — historique du 25 octobre 2026

Le complément reprend `7fe7a88`. Il ajoute **six profils d’armes spéciales**, les grenades à fragmentation et collantes à réserve limitée, et le soutien des boucliers de Cora. Les ateliers proposent désormais **76 équipements : 64 armes, dix armures et deux familles de modules**. Explosions différées, chaleur et clips, canaux interrompus et charges dépensées sont des comportements distincts ; leurs paramètres restent adaptés à l’ATB.

Six bancs réservés aux extensions ou bonus rendent sélectionnables huit profils auparavant documentaires : Kasumi, Zaeed, Liara ME2, Javik, Aria, Nyreen, Wrex ME3 et le prisonnier turien d’Incarceration. Les **42 profils partiels** sont maintenant accessibles dans leurs essais autorisés, sans agrandir les dix anciens rosters ni attribuer un recrutement ou une survie à une campagne. Cela porte les essais à **16**, les fiches de pouvoirs utilisées à **47 pour 21 commandes**, et les lectures à **16 parcours / 52 pages**. Les neuf anciennes lectures sont conservées à l’identique.

Le catalogue ajoute **37 promotions Prototype** : huit profils, six armes, sept fiches de pouvoirs et seize références documentaires. Les 6 656 identifiants sont conservés ; le principal reste à 1 330 fiches, les 27 autres classeurs à 5 326. La description et la note du système de lecture sont actualisées dans le principal, sans modifier ses 1 329 autres fiches. Les sources, faits et conditions de toutes les fiches univers restent inchangés.

Les **396 tests Node** et la compilation passent. Le [nouveau parcours navigateur](qa/chronicle-specialists-browser-report.json) passe cinq contrôles : six armes, trois actions, quatre victoires réelles, les six bancs et dix nouvelles pages. Les sauvegardes ME1, imports et reprises sont préservés, sans erreur JavaScript ou réseau. Le [contrôle différentiel ME1](qa/chronicle-specialists-me1-combat-diff.json) reproduit les mêmes résumés et événements sur 30 graines et 1 755 ordres. La régression des Chroniques passe ses six contrôles et remporte les seize essais exposés. La commande `npm run test:chronicle:specialists` reproduit le nouveau parcours. Les résultats finaux et les exports Excel sont regroupés dans le [rapport du complément](qa/chronicle-specialists-report.json).

Les **dix contrôles de production HTTP** passent, dont un rayon P.A.W. effectivement canalisé puis interrompu, et trois grenades de Liam dépensées sans toucher aux munitions de son arme. La campagne ME1 atteint sa fin en 21 combats et se recharge correctement. Les 28 classeurs passent leurs audits ; 21 exports univers sont reconstruits et six restent identiques. La revue visuelle couvre **81 panneaux ciblés**, sans inspection intégrale de tous les onglets.

Les [sources contrôlées](research/chronicle-specialist-sources.md) distinguent le manuel Andromeda effectivement téléchargé des fiches individuelles d’armes, toujours secondaires. Aucun nouveau portrait, sprite, costume ou modèle d’arme n’est livré. La personnalisation 0.3.0 de la PR nº1 reste sur sa branche, avec les conflits corrigés ; elle n’est pas fusionnée dans `main` par ce complément.

## Complément pouvoirs, préparations et lectures — historique du 24 octobre

Le complément reprend **`994a963`**. Il ajoute dix mécaniques ATB de pouvoirs, reliées à **40 fiches de pouvoirs supplémentaires utilisées**, et non 40 actions distinctes. Shepard reçoit les six préparations de classe de ME2 et de ME3 ; Ryder reçoit trois préparations de compétences, en plus des dotations par défaut conservées. Les capacités manquantes et les conditions de loyauté restent explicites. Les effectifs ne changent pas : **34 profils sélectionnables parmi 42 profils partiels**.

Les ateliers passent à **70 équipements : 58 armes, dix armures et deux familles de modules ME3 pour fusils d’assaut à clips**. Les ports `weaponMod` et `weaponMod2` vérifient leurs compatibilités séparément et refusent les doublons de famille. Remplacer ou retirer l’arme retire ses modules, sélectionner la même arme les conserve. Le chargeur conserve le total de munitions ; le canon renforce les tirs et non les pouvoirs. Les anciennes préparations v1 à deux emplacements migrent vers quatre, avec les deux nouveaux ports vides.

L’onglet Lecture propose **neuf parcours documentaires et 42 pages sourcées**, sans dialogue canonique inventé ni choix ou récompense ajoutés. Les textes s’appuient sur des fiches de nature Établi, dans l’œuvre et le segment exacts. La page atteinte est conservée dans `readingProgress`, séparément des notes personnelles. Les acteurs de romans ou comics cités dans les pages restent documentaires lorsqu’ils n’ont pas d’autorisation de combat.

Le suivi de catalogue comprend **85 nouvelles promotions Prototype supplémentaires : 40 pouvoirs, deux familles de modules et 43 références documentaires de lieux, récit ou continuité**, ainsi que **trois systèmes dans le principal**. Le décompte est de **1 330 fiches principales et 5 326 supplémentaires, soit 6 656**. Le registre du jeu est régénéré depuis ces catalogues. Les identifiants de sources, natures et descriptions restent conservés ; aucun nouveau portrait, sprite ou décor n’est livré.

Au 24 octobre 2026, les **358 tests Node** et la compilation passent. Les quatre nouveaux contrôles navigateur exécutent les dix pouvoirs, remportent six essais et visitent les 42 pages ; les six contrôles de régression des Chroniques remportent leurs dix essais. La campagne ME1 atteint sa fin en 21 combats, avec reprise de sauvegarde ; les 18 simulations remportent 378 combats et valident 522 sauvegardes. Les 28 classeurs sont vérifiés et 46 panneaux font l’objet d’une revue visuelle ciblée. Le [rapport du complément](qa/chronicle-expansion-report.json) rassemble les résultats, empreintes et limites ; les rapports historiques sont conservés. La commande `npm run test:chronicle:expansion` écrit `test-results/chronicle-expansion-report.json`. Voir aussi [CHRONICLES.md](CHRONICLES.md) et [FIDELITY.md](FIDELITY.md).

Les **huit contrôles de production HTTP** passent sur les vrais fichiers compilés, sans harnais de développement : sauvegardes ME1 et Chroniques séparées, préparation et modules ME3, lecture restaurée après rechargement. Les six bundles JavaScript servis ont leurs tailles et empreintes exactes ; les dix PNG se chargent sans requête distante ni erreur du jeu. Le lancement Electron Windows reste hors du périmètre de ce contrôle Linux Chromium.

## Premier lot Chroniques — historique

Le premier lot reprend `f6b23904247ff137b37139bb2a512b04f75c745e` et ajoute des **Chroniques indépendantes** : registre de 28 œuvres et 48 segments, dix essais ATB dans sept œuvres, 34 profils sélectionnables parmi 42 profils partiels et 68 équipements d’atelier (58 armes, 10 armures). Les contextes, scènes, porteurs et alternatives conditionnelles limitent la sélection. Les sauvegardes restent séparées de ME1 ; l’entrée depuis une campagne enregistre d’abord son point de reprise.

Les Excel suivent les éléments réellement disponibles : **102 nouvelles fiches Prototype** dans sept catalogues, deux systèmes transversaux dans le principal ; **6 653 fiches** au total. Les 57 fiches d’extension historiques du principal et les six statuts avancés sont conservés. Les autres lignes restent documentaires. Aucun nouveau portrait, sprite, costume ou décor propre aux œuvres ultérieures n’est livré ; les statistiques et chargeurs utilisent des réglages ATB adaptés.

Voir le [périmètre et les dix essais](CHRONICLES.md), les [références consultées](research/chronicles-sources.md) et le [rapport de conservation](qa/chronicles-preservation-report.json). Les rapports du complément équipement ci-dessous restent les preuves historiques de leur livraison.

Validation historique du premier lot Chroniques : **298 tests**, compilation Vite, six contrôles navigateur avec dix victoires réelles et six contrôles de production HTTP. La campagne ME1 atteint de nouveau sa fin en 21 rencontres ; les 18 simulations de campagne réussissent leurs 378 combats et 522 reprises de sauvegarde. Le [rapport de ce premier lot](qa/chronicles-report.json) relie ses résultats, empreintes et limites. Les 28 classeurs sont vérifiés ; les 27 exports supplémentaires ne disposent pas d’une nouvelle revue visuelle liée à leurs empreintes.

## Résultat jouable

La campagne condensée reste jouable du briefing initial au bilan final : **neuf scènes 3D, huit étapes et 21 rencontres de campagne**. La version conserve **onze opérations annexes, 43 étapes et quatre combats possibles**, propose maintenant **52 références d’équipement** et conserve les deux atlas d’animation pour Shepard féminine.

Cette livraison est un prototype jouable de l’adaptation ATB. La reconstitution intégrale 1:1 de Mass Effect reste un objectif de production : cartes condensées, dialogues réécrits, animations partielles et références graphiques encore à contrôler.

| Domaine | Livraison observable |
|---|---|
| Exploration | 9 scènes 3D, collisions, navigation au clic, clavier, course et suivi d’objectif |
| Campagne | 8 étapes, 21 rencontres persistantes, enquête à ordre partiellement libre et quatre décisions majeures |
| Groupe | Shepard, Jenkins au départ, puis six compagnons recrutables ; deux équipiers actifs |
| Combat | 6 classes, modes Attente/Actif, trois difficultés, chaleur, boucliers, pouvoirs, états et effets d’équipement |
| Assignations | 3 assignations historiques et 11 nouvelles opérations à la Citadelle et à Féros ; progression et issues persistantes |
| Équipement | 20 armes, 16 armures, 12 modules et 4 outils ; inventaire de 150 objets, neuf ports, achat/vente, stocks et comparaison |
| Personnage | Deux apparences, trois origines, trois profils psychologiques et dossier consultable |
| Sauvegardes | Auto hors combat, 6 emplacements manuels, import/export JSON et migration des anciennes parties v1 |
| Narration | 9 interlocuteurs et 18 sujets conditionnels au Normandy, conseil à Garrus mémorisé, 16 notices de codex progressives |
| Carte et journal | Filtres, légende, repères lisibles, étapes et conditions de blocage, suivi d’une opération |
| Art | 11 PNG, 48 sujets d’atlas historiques, 32 images de marche, 4 poses de combat féminines, une illustration d’accueil et trois bustes partiels des Chroniques |
| Son | Ambiances et effets locaux Web Audio ; aucun doublage |
| Distribution | Compilation Vite, configuration Electron/Windows, configuration Vercel et workflows GitHub existants |

## Ce que change la version

### Opérations annexes

La Favorite, Xeltan, Emily Wong, les veilleurs, le signal suspect, le prédicateur et Michel constituent les sept ajouts à la Citadelle. Féros reçoit l’eau, les cellules énergétiques, les geth des tunnels et les données de Gavin. Le journal explique les prérequis et conserve les choix. Les opérations terminées ne paient qu’une fois.

Les quatre combats possibles fonctionnent avec le moteur ATB et ses statistiques. Le joueur peut éviter celui de Michel par persuasion. Une sauvegarde effectuée après la décision de combattre reprend la rencontre ; elle n’accorde aucune victoire. Michel réduit ensuite de 20 % le prix du médi-gel. Les services à la colonie et les recherches récupérées apparaissent dans le rapport de Féros.

Des avertissements précèdent les échéances du Thorien et du Conduit. Les données de Gavin déjà copiées peuvent encore être rapportées après le Thorien. Les opérations utilisent les cartes condensées et quatre scans représentatifs de veilleurs ; leurs variantes complètes restent à produire.

### Équipement et sauvegardes

Chaque personnage possède neuf emplacements : arme, armure, deux modules d’arme, modification de munitions, deux modules d’armure, OmniTech et amplificateur biotique. Les quantités, crédits et stocks sont contrôlés avant chaque transaction. Une pièce portée ne peut pas être vendue. Les objets de Jenkins ou d’un autre compagnon disparu restent récupérables. Retirer ou remplacer leur pièce restitue les modules au stock ; les comparaisons et avertissements présentent ce changement avant l’action.

Les restrictions d’espèce, de classe, de niveau et d’entraînement s’appliquent dans l’interface et dans les règles. Les modifications de chaleur, refroidissement, protection et dégâts sont utilisées en combat. Les bonus sont calculés depuis les statistiques de base, sans accumulation à chaque ouverture de menu. Les cinq objets de départ conservent les statistiques de la version antérieure.

Les formations d’armure demandent maintenant une action explicite et un point disponible, selon le profil du personnage. Ce budget et les seuils de déblocage restent une adaptation ATB. La migration conserve l’ancienne armure équipée par une exception limitée à cette pièce ; l’interface avertit que la retirer ou la remplacer met fin à cette exception. Les quatre outils génériques renforcent uniquement leurs pouvoirs biotiques ou technologiques existants. Liara peut porter un OmniTech sans recevoir de pouvoir supplémentaire. Prix et multiplicateurs ne sont pas présentés comme des valeurs originales.

L’inventaire interne passe à la version 2 dans la même enveloppe de sauvegarde. Les anciens stocks, quantités et équipements sont conservés ; les nouveaux ports sont vides. Les anciens modules sans pièce porteuse sont libérés sans créer d’objet. Les règles, références et limites du complément sont dans [loadout-extension-sources.md](research/loadout-extension-sources.md).

Les anciennes parties reçoivent un inventaire initial et un registre d’opérations vide uniquement lorsque ces champs sont absents. Le dossier, les recrutements, les pertes, les conversations, le codex, les choix et les trois assignations restent inchangés. Une structure explicitement invalide est refusée.

### Sprites féminins

Les nouvelles planches fournissent seize images de marche dans quatre directions et quatre poses de combat : visée, pouvoir, impact et KO. Le renderer utilise les rectangles, pivots et échelles propres aux frames. La création, le dossier et l’équipement réutilisent une silhouette recadrée sur l’atlas de marche.

Les métadonnées sont incluses dans le JavaScript compilé pour le chargement local. Les quatre poses ne constituent pas quatre animations complètes. Les limites artistiques et la provenance sont décrites dans [ASSETS.md](ASSETS.md) et [shepard-female-art.md](research/shepard-female-art.md).

## Vérifications du complément équipement

La suite intégrée passe **236 tests Node**, sans échec ni test ignoré. La compilation web réussit avec les métadonnées d’animation embarquées. Les douze nouveaux tests de migration couvrent les anciennes quantités, stocks, ports, armures déjà équipées et modules orphelins ; deux tests d’interface reproduisent puis empêchent une régression du filtre Outils. La revue indépendante a également accepté **8 268 inventaires anciens générés**, sans perte des quantités ni des 48 stocks antérieurs. Ces fixtures ne représentent pas des sauvegardes historiques de joueurs.

La matrice déterministe des six classes et trois difficultés termine **18 campagnes, 378 rencontres et 522 relectures de sauvegarde**, avec les dotations et calibrations de référence. Elle ne mesure pas toutes les combinaisons d’objets et ne remplace pas un essai humain. Les empreintes et preuves courantes sont conservées dans [equipment-extension-report.json](qa/equipment-extension-report.json), séparément des rapports initiaux ci-dessous.

Le parcours des extensions passe huit contrôles et sept combats : migration de la fixture 0.2.0, achats financés par la campagne, outils de Kaidan et Liara, absence de pouvoir ajouté, seconds ports sans duplication, restitution et vente/rachat des modules, formations et sauvegardes. La régression de matériel passe six contrôles, dont les quatre onglets à 390 px et la récupération de Jenkins. La campagne complète remporte ses 21 rencontres, termine les huit étapes et conserve ses quatre décisions après reprise finale. Aucun de ces parcours ne signale d’erreur JavaScript ni de requête échouée.

Quatre contrôles du build servi en HTTP vérifient WebGL, les dix images, les deux bundles reçus identiques aux fichiers compilés, l’absence de hooks QA et de requête JSON d’animation, puis le dossier féminin, l’équipement, la sauvegarde, l’export/import et la reprise. Le navigateur géré refuse les URL de fichiers locaux ; ce contrôle HTTP est le mode web prévu, sans modification de cette politique. Aucun nouvel essai du programme Electron ou du portable Windows n’est annoncé.

## Vérifications initiales de la version 0.2.0

Les rapports ci-dessous concernent les sources initiales 0.2.0. Le [rapport de livraison](qa/v0.2.0-report.json) rassemble leurs résultats et les empreintes utilisées. Les vérifications du complément sont conservées séparément dans [equipment-extension-report.json](qa/equipment-extension-report.json).

| Contrôle | Résultat et portée | Preuve |
|---|---|---|
| Règles Node | 203 contrôles réussis dans 17 fichiers, aucun échec ni test ignoré | [unit-report.json](qa/unit-report.json) |
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

## Excel et catalogues — complément équipement historique

Au stade du complément équipement, le classeur principal contenait **1 325 fiches, 26 catégories et 28 feuilles**. La livraison initiale ajoutait **118 fiches** pour 48 objets, 43 étapes, quatre rencontres, vingt frames et trois quêtes absentes du catalogue ; le complément ajoute quatre fiches d’outils. Huit autres quêtes réutilisent leurs fiches existantes.

La comparaison avec `c614a45` vérifie la conservation des **1 321 identifiants**, des **57 fiches ME2/ME3** et des **six enregistrements Intégré/Validé**. Les statuts sont 1 035 Défini, 284 Prototype, trois Intégré et trois Validé. Ces statuts décrivent les critères de chaque fiche, sans certifier la fidélité artistique globale.

Artifact Tool recalcule le classeur. Le contrôle de son archive XLSX compare ses **22 525 cellules** au JSON, vérifie les formules, les 26 tables filtrées, les validations, les volets figés et les dépendances. L’ouverture dans Microsoft Excel ou LibreOffice natif n’a pas été exécutée.

Preuves : [native-export-check.json](workbook-previews/native-export-check.json), [verification.json](workbook-previews/verification.json), [Dashboard](workbook-previews/Dashboard.png). Les **27 classeurs de l’univers, soit 5 326 fiches**, restent conservés dans [universe/](universe/README.md).

## Reproduire les contrôles

```bash
npm ci
npm test
npm run build
```

Pour les scénarios navigateur, ouvrir un terminal avec `RELAY_QA=1 npm run dev`, puis lancer `npm run test:campaign`, `npm run test:commander`, `npm run test:operations`, `npm run test:loadout`, `npm run test:loadout:extensions`, `npm run test:chronicle:expansion` ou `npm run test:assignments -- --late-conrad`. `PLAYWRIGHT_EXECUTABLE_PATH` permet de désigner un Chromium installé. Pour le build, utiliser `npm run build`, `npm run preview -- --port 4174`, puis `node scripts/production-http-browser.mjs`. Ce dernier contrôle les fichiers compilés servis en HTTP, sans les hooks QA ; il reste distinct du test historique `production-v02-browser.mjs` par fichiers locaux. Le navigateur géré bloque actuellement les URL `file://` ; aucun contournement de cette règle n’est appliqué.

## Historique conservé

Les rapports [dossier-and-saves](qa/dossier-and-saves-report.json), [story-and-recruitment](qa/story-and-recruitment-report.json) et [assignments-and-deployment](qa/assignments-and-deployment-report.json) décrivent les compléments précédents, avec leurs empreintes propres. Ils ne sont pas présentés comme de nouveaux essais 0.2.0.

L’équilibrage de référence avait parcouru 18 campagnes et 378 rencontres avec une politique déterministe : [balance-report.json](qa/balance-report.json). Cette version n’annonce pas une nouvelle matrice complète de difficulté pour les 48 équipements. Le [rapport Windows initial](qa/build-v0.1.0-report.json) concerne le portable 0.1.0 construit sous Linux, sans essai d’exécution sur Windows. Les workflows du dépôt produisent les artefacts de la version poussée ; leur résultat est à consulter dans GitHub Actions.

L’intégration Git Vercel est observée dans les contrôles de la PR nº 1 : la poussée de correction du 25 octobre a déclenché un nouveau déploiement. Le [relevé GitHub](qa/vercel-github-integration-report.json) conserve l’état exact observé ; [DEPLOYMENT.md](DEPLOYMENT.md) distingue cette intégration du diagnostic CLI historique et des tests locaux. Aucun nouveau projet Vercel n’a été créé depuis ce checkout.

Le premier workflow du commit `3aad710` a réussi la compilation web. Windows a détecté un nom de périphérique réservé lors du checkout : `docs/universe/catalogs/CON.json`. Le catalogue Conviction et son rapport sont renommés `CONVICTION.json`, avec leurs octets et l’ID interne `CON` conservés. Les générateurs et chemins actifs sont adaptés et un test de portabilité couvre cette régression. Le [diagnostic CI](qa/windows-path-fix.json) consigne l’échec initial ; le résultat du workflow suivant reste consultable dans GitHub Actions. Les 27 classeurs n’ont pas été régénérés pour ce changement de chemins.

## Travail restant

- Reconstituer les 100 sous-zones et 91 liaisons, intérieurs et géographies exactes.
- Produire les 51 autres quêtes du registre secondaire/DLC et les variantes complètes des 14 prototypes.
- Compléter dialogues, cinématiques, romances et réactions aux antécédents de Shepard.
- Nettoyer les cycles et produire tous les movesets, huit directions, expressions et variantes visuelles d’équipement.
- Ajouter la conduite et le combat du Mako, les talents détaillés, licences et toute la gamme d’objets.
- Éprouver l’équilibrage avec des joueurs, les commandes manette, le mobile et les matériels réels.
- Produire doublage et musique ; développer les campagnes des autres jeux et adaptations à partir de leurs catalogues.

Le rendu navigateur est testé avec WebGL logiciel. Aucune fréquence d’images sur un PC de joueur, couverture matérielle exhaustive ou certification 1:1 n’est revendiquée. Le [suivi de fidélité](FIDELITY.md) détaille les limites par domaine.

# État de livraison — 0.1.0

Rapports de livraison initiaux : 22 octobre 2026. Complément fonctionnel : 23 octobre 2026. Cette page concerne la version du projet livrée dans ce dépôt.

## Résultat

La campagne condensée est jouable du briefing initial au bilan final. Le parcours navigateur a terminé les 21 rencontres, les huit étapes et les quatre décisions principales, puis rechargé la sauvegarde finale depuis l’écran titre. Le projet fournit les sources, les assets, la compilation web, la configuration PC et un registre de production détaillé.

Il ne s’agit pas encore d’une reproduction intégrale 1:1 de Mass Effect. Les lieux actuels sont condensés, le scénario est résumé, les sprites demandent une revue de conformité et l’ensemble des animations reste à produire. Le terme « complet » ne doit donc pas être employé pour qualifier la couverture du jeu original.

### Complément du 23 octobre

Le dossier de Shepard propose maintenant les deux apparences, les trois origines et les trois profils psychologiques. Portraits, sprites et sauvegardes restent cohérents après reprise et import. La variante féminine est statique ; son cycle d’animation et la fidélité artistique restent à vérifier.

Six emplacements manuels nommés affichent la date, la zone et le commandant. Remplacement et suppression exigent une confirmation, les emplacements sont séparés de l’autosauvegarde, et leur utilisation est bloquée en combat. Les erreurs de stockage et les données illisibles sont présentées sans effacement automatique.

Ce premier complément, publié au commit `7b5ecaa`, passait **98 tests Node**, sans échec ni test ignoré. Les parcours navigateur des deux variantes du dossier et les six contrôles des emplacements manuels passaient sans erreur JavaScript ni requête échouée. La campagne condensée avait également remporté ses **21 rencontres**, terminé ses **huit étapes** et rechargé sa sauvegarde finale avec ses quatre décisions conservées. Les détails et empreintes de cette version sont conservés dans [dossier-and-saves-report.json](qa/dossier-and-saves-report.json).

### Conversations, codex et recrutement

Le Normandy accueille neuf interlocuteurs et dix-huit sujets selon les étapes, le recrutement et la survie. Nihlus apparaît avant le premier débarquement sur Eden Prime ; le rapport de Joker est prioritaire au retour. Le conseil donné à Garrus a deux réponses possibles et un suivi qui reprend le choix enregistré. Les compagnons disponibles occupent leur point de conversation à bord, y compris lorsqu’ils appartiennent à l’équipe sélectionnée.

Garrus et Wrex peuvent être recrutés avant ou après l’audience du Conseil ; les preuves de Tali suffisent pour cette audience. Le recrutement ne modifie pas automatiquement le groupe actif. Les anciens PNJ et marqueurs de recrutement disparaissent à la Citadelle pour éviter les doublons. Le codex propose seize notices à découverte progressive avec une recherche insensible aux accents. Les révélations sur Liara, le Cipher, Sovereign et Vigil sont masquées avant les événements correspondants.

Ce complément, publié au commit `9ab5e66`, passait **133 tests Node**. Les **huit contrôles navigateur** vérifiaient les conversations, trois combats réels du prologue, le report puis le recrutement tardif, l’absence de doublons, la mémoire du conseil après reprise et la recherche du codex. La régression de campagne remportait aussi les **21 rencontres**, terminait les **huit étapes** et rechargeait la sauvegarde finale avec ses quatre décisions conservées. Aucun de ces parcours ne signalait d’erreur JavaScript ou de requête HTTP en échec. La compilation web passait. Le lanceur de campagne utilise des processus Chromium séparés, un contrôle de disponibilité toutes les 100 ms et un délai de 60 secondes pour le rendu logiciel.

Preuves et empreintes des sources : [story-and-recruitment-report.json](qa/story-and-recruitment-report.json). Reproduction : `npm test`, `npm run build`, `npm run test:story` et `npm run test:campaign` avec un serveur Vite dev actif. Les textes ajoutés sont des réécritures françaises concises, sans doublage ; les positions appartiennent aux cartes condensées. Les statuts du catalogue distinguent la validation fonctionnelle du codex, l’intégration des trois choix et les dialogues encore au stade Prototype. Le [suivi de fidélité](FIDELITY.md) conserve les contenus manquants et les références restant à contrôler. Les rapports ci-dessous décrivent les validations initiales.

Captures de ce complément : [équipage au Normandy](screenshots/normandy-conversations.png), [conseil mémorisé par Garrus](screenshots/garrus-remembered-advice.png) et [recherche dans le codex](screenshots/codex-search.png). Le placement d’Ashley a été ajusté après revue pour dégager sa silhouette de la poutre du décor.

### Assignations de la Citadelle et préparation Vercel

Trois assignations disposent d’étapes et d’issues sauvegardées : Retour à la maison (Samesh/Bosker, restitution du corps ou recherche), Affaire familiale (Rebekah/Michael, deux positions) et Le Fan (autographe, photo puis dissuasion de Conrad). Une nouvelle mission parmi Thérum, Féros et Novéria est requise entre les rencontres de Conrad, y compris après un premier contact tardif. Les jalons réels sont enregistrés, les simples revisites ne font pas avancer la quête et le journal explique lorsque ces trois missions sont épuisées. Les quatre contacts sont accessibles dans la géométrie de la Citadelle existante.

Le journal distingue Missions, Assignations et Rapports. Les assignations terminées quittent la liste active, conservent leur issue et attribuent une seule fois 50 XP. Ce montant relève de l’équilibrage ATB. Textes et positions restent condensés ; sprites dédiés, scènes intégrales, contrôles de persuasion et autres issues sont encore à produire ou à recouper. Les trois quêtes et les trois interlocuteurs suivis par le catalogue restent donc au stade Prototype.

La suite actuelle passe **155 tests Node**, dont dix-huit pour les assignations et quatre pour leurs contacts dans le monde. Les parcours navigateur précoce et tardif passent respectivement six et cinq contrôles, avec neuf combats chacun par les règles réelles. Ils contrôlent les deux issues de Samesh et de la famille via les emplacements manuels, l’unicité des récompenses et la reprise. Conrad tardif attend bien une nouvelle mission après son autographe, même après rechargement. La régression complète remporte aussi ses **21 combats**, termine ses **huit étapes** et conserve les quatre décisions après reprise finale, sans erreur JavaScript ni requête HTTP échouée. Preuves et empreintes : [assignments-and-deployment-report.json](qa/assignments-and-deployment-report.json). Reproduction : `npm run test:assignments`, sa variante `-- --late-conrad`, puis `npm run test:campaign`, avec Vite dev actif.

Captures : [journal des trois assignations](screenshots/assignments-journal.png), [compte rendu à Samesh](screenshots/homecoming-dialogue.png) et [Conrad après un premier contact tardif](screenshots/conrad-late-contact.png).

[vercel.json](../vercel.json) prépare la compilation Vite et la sortie `dist`. Une installation isolée par `npm ci --include=dev` avec `NODE_ENV=production` et une nouvelle compilation ont réussi sous Node.js 24, avec les mêmes empreintes de fichiers web que la compilation du dépôt. Le binaire Electron est exclu de ce téléchargement web. Trois contrôles sur la version compilée vérifient WebGL et les assets, la création réelle d’une partie, le journal et la reprise, avec les outils QA exclus du bundle. La CLI Vercel indique cependant `Logged out`, et le proxy refuse l’accès à son API en HTTP CONNECT 403 : aucun projet distant ni déploiement Vercel n’est annoncé. Le brouillon cloud ajoute les domaines nécessaires et une exigence de secret personnel `VERCEL_TOKEN`. Son activation et une identité utilisable restent nécessaires à la liaison, détaillée dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Fonctions présentes

| Domaine | Livraison observable |
|---|---|
| Exploration | 9 scènes 3D, collisions, navigation au clic, clavier, course, suivi d’objectif |
| Interactions | 63 points d’intérêt de mission, 9 points de conversation conditionnels et 4 contacts d’assignation ; caches, armurerie, navigation et extraction |
| Campagne | 8 étapes, enquête à ordre partiellement libre, 21 rencontres persistantes |
| Groupe | Shepard, Jenkins au départ, puis six compagnons recrutables ; deux équipiers actifs |
| Combat | 6 classes, modes Attente/Actif, trois difficultés, chaleur, bouclier, pouvoirs et états |
| Choix | Féros, reine rachni, Virmire, Conseil, recrutement différé de Garrus/Wrex et conseil à Garrus ; journal et bilan final |
| Assignations | Retour à la maison, Affaire familiale et Le Fan, étapes persistantes, deux issues pour les deux premières, rencontres espacées pour Conrad |
| Progression | Expérience, niveaux automatiques, crédits, améliorations et réserve de médi-gel |
| Sauvegardes | Auto hors combat, 6 emplacements manuels, import/export JSON, dossier Shepard et historique des conversations persistés, migration v1 |
| Interface | Titre, création et dossier Shepard, journal, cartes, commando, équipement, 16 notices de codex avec recherche, pause, options, victoire, défaite, fin |
| Art | 8 PNG, 48 sujets de sprites, 16 poses de marche supplémentaires, illustration d’accueil |
| Son | Ambiances et effets locaux Web Audio ; aucun doublage |
| Distribution | Build Vite, configuration Vercel à relier, fenêtre Electron, cible portable Windows, workflows de compilation |

## Preuves et méthode

### Tests unitaires

La validation initiale comportait **55 contrôles** : 29 pour le combat, 16 pour l’état et les sauvegardes, 10 pour l’audio. Ce rapport historique correspond aux trois fichiers `tests/combat.test.js`, `tests/state.test.js` et `tests/audio.test.js`. La commande actuelle `npm test` exécute tous les fichiers `tests/*.test.js`, soit les 155 contrôles décrits plus haut.

Les tests comprennent la surchauffe, la Stase, le piratage et ses immunités, les attaques organiques, la recharge des boucliers, les KO, les soins, l’ordre de progression, les décisions sensibles, les imports invalides, les propriétés de prototype, la composition du groupe et la libération des ressources audio. Deux parcours d’état prennent des choix opposés et relisent les sauvegardes au fil de leur progression.

Preuve : [unit-report.json](qa/unit-report.json).

### Campagne dans l’application

Le scénario exécuté dans Chromium utilise l’interface et les callbacks du véritable jeu. Il suit l’ordre Eden Prime → Citadelle → Novéria → Thérum → Virmire → Féros → Ilos → finale, achète une amélioration et sélectionne Garrus/Wrex au Normandy. Les combats utilisent les vraies règles et statistiques, avec temps simulé accéléré. Les tests n’injectent ni dégâts ni récompenses ni drapeaux de progression.

Résultat : **21 victoires, huit étapes complétées, bilan final affiché, quatre choix conservés après rechargement**, aucune erreur JavaScript ni réponse HTTP d’erreur pendant ce parcours. Le scénario a libéré la reine rachni, sauvé Ashley, protégé Féros et secouru le Conseil.

Preuve : [campaign-report.json](qa/campaign-report.json). Reproduction : `npm run test:campaign` avec un serveur Vite dev actif.

### Équilibrage simulé

Le simulateur exécute les six classes dans les trois difficultés, soit **18 campagnes et 378 rencontres**. Toutes atteignent la fin avec la politique déterministe de test. Il relit **522 sauvegardes**. Cette vérification établit l’absence d’impasse dans ce protocole ; elle ne remplace pas des essais de rythme ou de difficulté avec des joueurs.

| Difficulté | Victoires | Rencontres avec perte de santé | Médi-gels consommés | Couvertures |
|---|---:|---:|---:|---:|
| Histoire | 126 | 0 | 0 | 2 |
| Normal | 126 | 38 | 6 | 16 |
| Difficile | 126 | 59 | 15 | 26 |

Le réglage initial n’occasionnait aucune perte de santé. La recharge passive a été réduite, la couverture a reçu un avantage de récupération et les adversaires privilégient davantage les cibles fragilisées. Les chiffres avant/après, les graines, les actions et les empreintes des sources sont conservés dans [balance-report.json](qa/balance-report.json).

### Monde et interface

Les scripts `test:browser` et `test:world` contrôlent les commandes réelles, la pause, les callbacks, les atlas, la marche, les états de combat et la navigation vers les 63 points d’intérêt. Le contrôle des chemins est une vérification algorithmique des routes sur les scènes rendues, pas une revendication de 63 missions parcourues manuellement.

Les captures placées dans `docs/screenshots/` proviennent du renderer. L’illustration de la Citadelle sur l’écran titre est une image conceptuelle et ne représente pas une capture de la carte jouable.

Le dernier contrôle ciblé vérifie le combat de Féros : les six acteurs restent visibles, les deux poutres hautes sont masquées en combat puis restaurées en exploration, et les 16 collisions de la scène sont conservées. Voir [feros-combat-cutaway-report.json](qa/feros-combat-cutaway-report.json).

### Compilation et application PC

La version web et le portable Windows x64 initiaux ont été compilés avec Vite 7.3.7, Electron 45.0.0 et electron-builder 26.15.3. Le paquet Windows a été créé sous Linux ; il n’a pas été exécuté sur Windows pendant cette session et ne contient pas les compléments ultérieurs. Le rapport historique conserve les empreintes du binaire, des fichiers web distribués et des sources utilisées : [build-report.json](qa/build-report.json). La compilation web du complément actuel est vérifiée séparément dans son rapport. Les dossiers `dist/` et `release/` sont des sorties de compilation exclues du dépôt.

### Excel

**1 203 fiches, 26 catégories, 28 feuilles**, dont un dashboard et un guide. Les tableaux possèdent filtres, listes de validation, volets figés et formules de comptage. Les 1 203 identifiants sont uniques et les dépendances se résolvent. Les preuves d’assets sont distinctes des chemins de fichiers prévus.

Le classeur a été exporté, recalculé, inspecté et rendu avec Artifact Tool ; son archive XLSX a également été contrôlée. Il n’a pas été ouvert dans une installation native de Microsoft Excel pendant cette validation. Les aperçus et contrôles sont dans [workbook-previews/](workbook-previews/).

## Limites qui restent à traiter

- Reconstitution exacte des cartes, des sous-zones, des intérieurs et de leurs connexions.
- Scénario complet, les 59 autres fiches de missions annexes/DLC, variantes des trois assignations prototypes, romances, dialogues et cinématiques détaillés.
- Créateur visuel détaillé de Shepard, cycle de marche féminin et variations d’armures. Le choix masculin/féminin et les origines/profils sont désormais disponibles et persistés ; leur conformité artistique finale reste à vérifier.
- Animations complètes dans huit directions, actions et expressions de chaque personnage.
- Contrôle artistique de chaque silhouette et costume ; nettoyage des atlas générés et du cycle de marche.
- Conduite et combat du Mako, comportement fonctionnel des véhicules représentés.
- Inventaire complet, marques, modifications d’armes et arbres de talents détaillés.
- Mise au point de la difficulté avec des joueurs ; sauvegarde intra-combat ; progression de santé entre rencontres.
- Doublage, production musicale complète, essais matériels étendus, manette et finitions mobiles.
- Campagnes ME2 et ME3 : présentes uniquement comme extension future dans le catalogue.

Le rendu est testé dans Chromium avec WebGL logiciel. Aucune fréquence d’images sur un PC de joueur ni matrice complète de compatibilité matérielle n’est annoncée. La compilation Windows réussie ne constitue pas à elle seule un test d’exécution sur Windows.

## Dépendances

Les dépendances sont verrouillées dans `package-lock.json`. L’audit npm après actualisation de Vite, Electron et electron-builder ne signale plus de niveau élevé ou critique. Il conserve huit signalements modérés dans la chaîne transitive des outils de packaging, correspondant à un même avis sur `sprintf-js` sans version corrigée disponible au moment du contrôle. Le code jouable ne prend pas de format de log utilisateur pour ce composant. Voir [dependency-audit.json](qa/dependency-audit.json).

# État de livraison — 0.1.0

Date : 22 octobre 2026. Cette page concerne la version du projet livrée dans ce dépôt.

## Résultat

La campagne condensée est jouable du briefing initial au bilan final. Le parcours navigateur a terminé les 21 rencontres, les huit étapes et les quatre décisions principales, puis rechargé la sauvegarde finale depuis l’écran titre. Le projet fournit les sources, les assets, la compilation web, la configuration PC et un registre de production détaillé.

Il ne s’agit pas encore d’une reproduction intégrale 1:1 de Mass Effect. Les lieux actuels sont condensés, le scénario est résumé, les sprites demandent une revue de conformité et l’ensemble des animations reste à produire. Le terme « complet » ne doit donc pas être employé pour qualifier la couverture du jeu original.

## Fonctions présentes

| Domaine | Livraison observable |
|---|---|
| Exploration | 9 scènes 3D, collisions, navigation au clic, clavier, course, suivi d’objectif |
| Interactions | 63 points d’intérêt, dialogues, caches, armurerie, navigation et extraction |
| Campagne | 8 étapes, enquête à ordre partiellement libre, 21 rencontres persistantes |
| Groupe | Shepard, Jenkins au départ, puis six compagnons recrutables ; deux équipiers actifs |
| Combat | 6 classes, modes Attente/Actif, trois difficultés, chaleur, bouclier, pouvoirs et états |
| Choix | Féros, reine rachni, Virmire, Conseil ; journal et bilan final |
| Progression | Expérience, niveaux automatiques, crédits, améliorations et réserve de médi-gel |
| Sauvegardes | Auto hors combat, import/export JSON, validation structurelle et cohérence de progression |
| Interface | Titre, création, journal, cartes, commando, équipement, codex, pause, options, victoire, défaite, fin |
| Art | 8 PNG, 48 sujets de sprites, 16 poses de marche supplémentaires, illustration d’accueil |
| Son | Ambiances et effets locaux Web Audio ; aucun doublage |
| Distribution | Build Vite, fenêtre Electron, cible portable Windows, workflows de compilation |

## Preuves et méthode

### Tests unitaires

**55 contrôles passent** : 29 pour le combat, 16 pour l’état et les sauvegardes, 10 pour l’audio. Exécution par `node tests/combat.test.js`, `node tests/state.test.js` et `node tests/audio.test.js`. `npm test` exécute les trois fichiers avec le runner Node.

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

La version web finale et le portable Windows x64 ont été compilés avec Vite 7.3.7, Electron 45.0.0 et electron-builder 26.15.3. Le paquet Windows a été créé sous Linux ; il n’a pas été exécuté sur Windows pendant cette session. Le rapport conserve les empreintes du binaire, des fichiers web distribués et des sources utilisées : [build-report.json](qa/build-report.json). Les dossiers `dist/` et `release/` sont des sorties de compilation exclues du dépôt.

### Excel

**1 203 fiches, 26 catégories, 28 feuilles**, dont un dashboard et un guide. Les tableaux possèdent filtres, listes de validation, volets figés et formules de comptage. Les 1 203 identifiants sont uniques et les dépendances se résolvent. Les preuves d’assets sont distinctes des chemins de fichiers prévus.

Le classeur a été exporté, recalculé, inspecté et rendu avec Artifact Tool ; son archive XLSX a également été contrôlée. Il n’a pas été ouvert dans une installation native de Microsoft Excel pendant cette validation. Les aperçus et contrôles sont dans [workbook-previews/](workbook-previews/).

## Limites qui restent à traiter

- Reconstitution exacte des cartes, des sous-zones, des intérieurs et de leurs connexions.
- Scénario complet, missions annexes et DLC, romances, dialogues et cinématiques détaillés.
- Créateur visuel de Shepard, apparence féminine sélectionnable, variations d’armures.
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

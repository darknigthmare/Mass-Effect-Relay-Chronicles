# Lot 22 — prototype local Armax / Les Dettes de Nacre

État de preuve : **27 novembre 2026**. La PR #11 a été fusionnée à **14:33:15 UTC** au commit `6b761f8a`. La vérification continue sur `feat/armax-lot22-verification-20261127`. La suite générale et les six cas navigateur ont réussi sur **`f2b756fd476e00c5a282345e30464966a982c02e`**, correction du bouton « Retour » mobile comprise. Les preuves précédentes de `859fac` et `6335856` restent historiques.

## Livraison et niveau de preuve

Le menu **Armax · duel 2D** est raccordé au titre et à la pause du RPG. Il ouvre une simulation séparée à 60 Hz et une scène Three.js orthographique, avec les dépendances actuelles du projet. Le RPG ME1 et les Chroniques sont suspendus pendant le mode, puis retrouvent leur menu d’origine.

Le code comprend dix profils jouables originaux, vingt décors sélectionnables, vingt profils de boss à trois états de santé et vingt profils d’ennemis à routine annoncée. Les dix routes personnelles enchaînent huit combats et leurs textes d’introduction, de rivalité et de conclusion. Les rencontres exécutent des adaptations condensées ; leurs kits complets, illustrations spécifiques et animations restent à produire.

Les preuves distinguent **38/38 contrôles Armax**, **16/16 contrôles d’entrée**, puis, sur **`f2b756fd`**, une [suite générale réussie à 1 393/1 393 tests](qa/armax-ci-general-current-report.json) avec compilation de **170 modules** et un [parcours navigateur courant réussi à 6/6 cas](qa/ci-armax/run-46020607485/armax-browser-report.json). La première lecture des captures a confirmé le miroir de Tavin face à Mara et l’ancrage des pieds ; la nouvelle sélection mobile montre le libellé « Retour » corrigé. Les [preuves Armax](qa/armax-native-report.json), les [contrôles d’entrée](qa/armax-input-routing-native-report.json) et `gameplay-coverage.json` conservent leurs portées distinctes. Aucun essai sur matériel tactile réel ni validation globale des 72 identités raccordées au prototype n’est revendiqué.

## Boucle de combat et commandes

La simulation avance par pas de 1/60 seconde, indépendamment de la cadence de rendu, via l’horloge fixe existante. Elle gère déplacement horizontal, limites, séparation des corps, saut, accroupissement logique, garde haute/basse, impacts, hitstun, blockstun, hitstop, protection et santé. Les corps affichés restent des poses fixes translatées ; cela ne constitue pas un set d’animations.

| Commande | Action |
|---|---|
| Flèches, ZQSD ou WASD | Déplacement ; bas prépare les coups bas |
| Haut, Z, W ou Espace | Saut |
| Arrière, ou Maj | Garde ; bas + arrière/Maj = garde basse |
| J / K / L / U | Léger / moyen / lourd / spécial |
| I | Super commune, coût 100 |
| O, ou J + K | Prise / déprojection |
| F, ou J + K + L après KO final compatible | Présentation sobre de neutralisation |
| Échap | Pause / reprise explicite |

Les boutons à l’écran exposent les mêmes actions. Perte de focus, onglet masqué ou interruption temporelle suspendent le duel et effacent les entrées maintenues. Aucune commande manette n’est raccordée. Les contrôles tactiles sont implémentés mais n’ont pas été vérifiés sur appareil réel.

Pendant les écrans `armax` et `armax-loading`, le contrôleur global des menus cède les entrées au mode Armax. Cela évite qu’une flèche de déplacement change le focus des boutons avant d’atteindre le combattant. Les listes conservent leurs touches natives et Tab reste géré par le panneau Armax. Le contrat natif de ce routage et la reprise de navigation des autres menus sont conservés dans `qa/armax-input-routing-native-report.json`.

| Action commune | Démarrage | Active | Récupération | Dégâts |
|---|---:|---:|---:|---:|
| L | 5 | 3 | 12 | 55 |
| M | 9 | 4 | 18 | 90 |
| H | 15 | 5 | 25 | 130 |
| Prise | 5 | 2 | 34 | 100 |
| Super normalisée | 18 | 6 | 38 | 235 |

Durées en pas de simulation. Ce sont des paramètres de prototype, pas des statistiques canoniques Mass Effect. Le tampon de cinq pas conserve sens et direction basse au déclenchement. L → M, M/H → S puis S → super peuvent s’annuler sur touche. Un combo exige une continuité réelle de hitstun. Le scaling suit 100/80/65/50/35/25 %, avec six actions au maximum et sans répétition d’une même action dans la chaîne.

La garde debout bloque mid/air/overhead ; la garde basse bloque mid/low. La garde est évaluée après les entrées des deux acteurs, avant la résolution des contacts, y compris au pas exact d’impact. Les prises sont limitées au sol avec dix pas de déprojection ; huit pas d’immunité à une nouvelle prise suivent le hitstun d’une prise subie. Aucune invulnérabilité universelle n’est ajoutée.

La protection précède la vie. Le délai de recharge revient à **300 pas lors d’une attaque acceptée au lancement, d’un dégât reçu ou d’un impact gardé**. Il n’est pas réarmé à chaque frame de récupération d’une attaque. Après ce délai, un point revient par pas jusqu’au maximum. Le hitstop suspend la simulation et le chronomètre.

La jauge plafonne à 300. La super dépense 100 au lancement accepté, sans remboursement après interruption. Gains : 8 sur normal touché, 4 sur spécial touché, 3 pour l’attaquant sur garde, 5 pour une perte positive de protection/vie ; plafond de 30 par joueur et chaîne. Aucun gain à vide, par super, scène, victoire ou finisher. Le grattage vaut floor(5 %) pour spéciaux/supers et ne retire jamais le dernier PV.

Une manche dure 99 secondes hors hitstop. Deux manches gagnantes terminent un duel ordinaire ou celui du rival. Un boss ou avant-poste condensé se joue en une manche. Au temps, les ratios de vie puis de protection départagent. Égalité exacte et double KO n’accordent aucun point et ouvrent une nouvelle manche. Résultat et tableau des victoires sont figés une seule fois.

La neutralisation n’exécute qu’une présentation textuelle de 72 pas, immédiatement passable, disponible pendant 120 pas après un KO final compatible. Elle ne change ni dégâts, ni score, ni récompense. Boss et ennemis sont exclus de cette présentation.

## Dix profils : un spécial raccordé

| Profil | Action de ce prototype | Limite du kit |
|---|---|---|
| Mara Vey | Tir concussif cinétique | Ressource thermique et trois autres spéciaux absents |
| Tavin Rhex | Tir de contention | Couvert déployable complet absent |
| Ilyra Senn | Projection biotique | Unique biotique parmi les dix jouables |
| Keela’Vess | Piège d’interception avec armement | Drone autonome animé absent |
| Ghoran Brakk | Percée physique de quai | Aucune Charge biotique |
| Neral Vesh | Course physique à couvert | Aucune téléportation ; camouflage complet absent |
| Selek Dhan | Mine de sabotage | Une mine active par propriétaire |
| Varek Hesk | Coup d’arrêt au contact | Ressource et contre avancés absents |
| Dalo Ruun | Réserve de protection | Deux charges par manche, +120 maximum, startup vulnérable de 38 pas, aucun soin de PV |
| Nyra Korr | Tir repéré | Système complet de marquage absent |

Dalo ne dépense pas de charge à protection pleine. Une charge engagée reste consommée après interruption ; une nouvelle manche restaure ses deux réserves. Ce raccordement ne réalise pas les quarante spéciaux et dix supers individuelles conçus dans la bible.

## Rencontres condensées

`scripts/armax-build-runtime.py` extrait `DLC/LesDettesDeNacre/nacre-world.json` et `nacre_roster_design.json`. Il produit `src/armax-expansion-data.js` : profils exécutables, phases condensées, textes de route, disponibilité et bounds des PNG. Aucune image ou animation n’est déclarée fidèle ou validée par cette génération.

Chaque boss passe aux états 2 et 3 lorsque sa vie atteint 66 % puis 33 %. La transition annonce l’état, annule ses attaques et ses propres projectiles, puis impose 90 pas d’attente. Elle ne soigne pas et ne rend pas invulnérable. Les annonces et récupérations reprennent les durées proposées par les fiches. Une zone conserve la position verrouillée au début de son annonce ; l’IA ne déplace pas ce verrouillage à partir des nouvelles commandes du joueur.

Les primitives exécutées sont frappe au contact, tir horizontal, percée physique, prise, mine, zone verrouillée, balayage bas, impulsion locale et réserve de protection. Les machines déclarées fixes ne sont déplacées ni par leur IA, ni par collision de corps, ni par recul sur impact ou déprojection. Les auxiliaires, nœuds, couverts, conteneurs et accessoires destructibles de la bible ne sont pas créés par ces primitives.

| Boss | État 1 | État 2 | État 3 |
|---|---|---|---|
| Odran Kell | Frappe engagée | Zone verrouillée | Percée physique |
| Terea Soth | Tir annoncé | Impulsion locale | Tir annoncé |
| Halek Orr (visuel indisponible) | Balise de proximité | Tir annoncé | Zone verrouillée |
| Karrh Bhekt | Frappe engagée | Zone verrouillée | Prise annoncée |
| Karnak Vohl | Percée physique | Balayage bas | Frappe engagée |
| Theral Oss | Tir annoncé | Balise de proximité | Tir annoncé |
| Tuteur-6 | Frappe engagée | Zone verrouillée | Balayage bas |
| Neven Saal | Tir annoncé | Balise de proximité | Percée physique |
| Talin Rorr | Tir annoncé | Réserve de protection | Tir annoncé |
| Barud | Percée physique | Frappe engagée | Zone verrouillée |
| Foreuse M4 — Espace clos | Balayage bas | Tir annoncé | Frappe engagée |
| Grue GM-9 — Dernière prise | Zone verrouillée | Balayage bas | Zone verrouillée |
| Myra Nenn | Balise de proximité | Zone verrouillée | Balayage bas |
| Cercle des verrous | Zone verrouillée | Tir annoncé | Balayage bas |
| Murène-2 | Frappe engagée | Balayage bas | Impulsion locale |
| Severa Dhal | Tir annoncé | Zone verrouillée | Impulsion locale |
| Iven Marr | Zone verrouillée | Balayage bas | Tir annoncé |
| Raddak Norek | Tir annoncé | Balise de proximité | Impulsion locale |
| Veshan Prax | Frappe engagée | Tir annoncé | Prise annoncée |
| Elyne Korda | Tir annoncé | Zone verrouillée | Tir annoncé |

Ce tableau décrit les adaptations codées, pas soixante patterns particuliers complets ni leurs animations. Boss14 utilise seulement la base du noyau ; boss20 utilise seulement le corps d’Elyne, sans portique invisible. Murène-2 reste une base candidate dont les segments visuels ne certifient pas l’ensemble fonctionnel de sa fiche.

Les vingt ennemis ont chacun un profil et une routine annoncée, issue des mêmes familles. Camouflage, soutien entre plusieurs acteurs, hacking de pièces et groupes simultanés restent hors du duel à deux acteurs. Une réserve épuisée devient une frappe de défense annoncée, sans recréer de charge.

## Routes et sauvegarde séparée

Chaque personnage utilise ses huit stages d’auteur, son introduction, son rival, ses répliques et sa conclusion. Le quatrième duel oppose le rival et reste non létal. Les autres étapes sont des défis du stage concerné, sauf l’adaptation explicite du stage03 : **Sapeur de facturation, ennemi05**, avec son propre nom, son propre profil et son PNG. Halek Orr n’y est pas affronté et son identifiant n’est jamais enregistré comme vaincu.

Une victoire de match confirmée avance d’une étape ; une défaite conserve le point de contrôle. Un identifiant de tentative empêche un ancien résultat d’accorder une seconde victoire. Le test de huit victoires affaiblit volontairement les adversaires pour vérifier la progression ; il ne constitue pas un playthrough équilibré.

La clé `relay.armax.nacre.campaign.v1` contient seulement personnage, étape, statut, identifiants effectivement franchis et compteur de tentatives. Aucun crédit, objet ou équipement RPG n’est transféré. Le chargement vérifie version, personnage, bornes, ordre des victoires et cohérence de la conclusion. Un combat interrompu reprend au début de l’étape sans attribuer de victoire. Un stockage refusé laisse le jeu fonctionner en mémoire avec un message.

Les routes sont des branches alternatives du même incident local de 2185. Les choix avancés, scènes spécialement illustrées, doublage et conséquences persistantes du monde ne sont pas exécutés. La conclusion exige huit résultats de victoire valides.

## Images, effets et interface

Les PNG natifs restent inchangés. Les bounds alpha mesurés servent au cadrage UV et aux pieds ; le matériau rejette les alphas faibles à 32/255. L’échelle proposée des jouables est `height / 40` dans une caméra de neuf unités, les pieds vers 80 % de la composition. Les captures du run `46016000543`, sur `859fac`, montrent Tavin face à Mara et des pieds sur la même ligne de sol. Les poses fixes se chevauchent visuellement au contact ; aucun set d’animations n’est validé. Les vues opposées sont des miroirs et les asymétries ne sont pas certifiées. La relecture ne s’étend pas aux autres corps ou aux FX individuels.

Chaque stage reste un master en un seul plan, sans cinq calques de parallaxe ni dangers interactifs. Le générateur préfère `*_r1.png` quand cette variante existe sous la même identité et conserve R0. Cela permet le stage11 avec verrière et la correction anatomique R1 sélectionnée de Neral, sans créer de personnage supplémentaire.

Les corps et FX utilisent des plans XY avec une échelle horizontale signée. Les corps ont leur origine aux pieds ; les effets restent centrés. Cette construction conserve le miroir, les recadrages UV et les textures partagées. Les deux géométries sont libérées une seule fois à la fermeture ; la suppression d’un projectile libère seulement son propre matériau.

Trois textures FX sont raccordées : `fx/nacre_fx_01.png` pour les tirs techniques, `fx/nacre_fx_05.png` pour les asari biotiques, `fx/nacre_fx_15.png` pour les pièges/zones. Leur rapport largeur/hauteur est conservé. FX05 porte un signe d’orientation négatif car sa composition native pointe à gauche ; le renderer multiplie ce signe par la direction du projectile. Ces images fixes ne constituent pas des séquences animées. Un FX absent conserve un jeton provisoire ; ses pixels ne déterminent jamais collisions ou dégâts. Une image de corps ou de stage absente interdit le lancement correspondant, sans substituer l’identité d’un autre sujet.

Les ressources WebGL sont libérées à la fermeture ou au retour à la sélection ; les chargements tardifs sont ignorés après fermeture. Les jauges DOM ne changent qu’en réponse à un état utile. Le focus reste dans le mode et les cibles de boutons font au moins 44 pixels. Aucun essai sur téléphone réel n’est déduit de ces règles CSS.

## Vérification reproductible

```bash
python scripts/armax-build-runtime.py
node scripts/armax-verify.mjs --build
```

Le générateur doit être relancé après l’arrivée ou la révision des PNG. Le script de vérification régénère `qa/armax-native.tap`, `qa/armax-native-report.json` (empreintes SHA-256 et résultats) et `qa/armax-build.log`. Sur la révision `859fac`, les **38/38 contrôles Armax** et la compilation ont réussi : règles communes, garde aux frontières de frame, prises, dégâts/jauge, phases et zones, machines fixes sous collision/impact/déprojection, réserves, routes et sauvegardes isolées. Les **16/16 contrôles d’entrée** de `tests/gamepad-controls.test.js` ont également réussi ; leur portée et leur journal sont dans [armax-input-routing-native-report.json](qa/armax-input-routing-native-report.json). La preuve de navigation effective est portée séparément par le parcours navigateur ci-dessous.

Le parcours UI utilise un harnais distinct :

```bash
ARMAX_SELF_HOST=1 PLAYWRIGHT_EXECUTABLE_PATH=/chemin/du/chromium node scripts/armax-browser.mjs
```

Le harnais peut démarrer Vite dans son propre processus. Ses six cas vérifient l’entrée depuis le titre et les dix/vingt options du sélecteur, déplacement/attaque avec dégâts HUD, pause et blur simulé, IA, boutons à l’écran à 390×844, puis retour au titre sans mutation du stockage par un duel ordinaire. Les combats utilisent Mara/Tavin et les stages01/02. Il n’introduit aucun hook QA dans le bundle de production. Les autres profils, l’entrée depuis la pause RPG, les défis et routes ainsi que le matériel tactile réel restent hors de cette couverture.

**Le parcours courant a réussi 6/6 cas**, dans le run `46020607485`, job `140578969050`, sur **`f2b756fd476e00c5a282345e30464966a982c02e`**. Le [rapport](qa/ci-armax/run-46020607485/armax-browser-report.json) conserve `passed: true`, `errors: []` et `diagnosticErrors: []`. La [provenance](qa/ci-armax/run-46020607485/provenance.json) enregistre treize empreintes de sources concordantes **13/13** avec les fichiers vérifiés. Sept captures sont conservées avec le rapport et le journal.

Le [premier parcours réussi, run 46016000543](qa/ci-armax/run-46016000543/armax-browser-report.json), reste rattaché à `859fac`. Ses [vues desktop](qa/ci-armax/run-46016000543/armax-duel-desktop.png) et [mobile](qa/ci-armax/run-46016000543/armax-duel-mobile.png) ont confirmé le miroir de Tavin, l’appui des pieds et les dégâts affichés de **55 et 90**. La protection de Tavin passe respectivement de 280 à 225 et de 280 à 190 ; Mara reçoit 8 points de jauge. Le nouveau passage sur `f2b756fd` confirme les six cas avec le même périmètre. La [sélection mobile courante](qa/ci-armax/run-46020607485/armax-selection-mobile.png), relue à **390 × 844**, affiche **« RETOUR » sur une ligne**, le titre entier et aucun débordement horizontal. La coupure du libellé observée sur `859fac` devient un défaut historique corrigé.

Les quatre essais CI précédents avaient chacun réussi le seul cas du sélecteur avant d’échouer : [46010749352](qa/ci-armax/run-46010749352/armax-browser-report.json), [46011849232](qa/ci-armax/run-46011849232/armax-browser-report.json), [46012230051](qa/ci-armax/run-46012230051/armax-browser-report.json) et [46014391140](qa/ci-armax/run-46014391140/armax-browser-report.json). Le premier avait rencontré l’interception du clic par le canevas RPG ; le suivant, une attente incorrecte de visibilité du message de chargement masqué dans le harnais. Les deux derniers avaient atteint le duel sans réussir le contrôle de dégâts. Le diagnostic sur `6335856` avait établi que l’horloge avançait, que les flèches déplaçaient le focus et que l’adversaire n’était pas affiché en miroir. L’[observation de file créée à 14:49 UTC](qa/armax-browser-pending-report.json) reste un état historique, antérieur au résultat du run `46016000543`.

### Historique des blocages locaux

Les premiers essais locaux ont été empêchés par l’absence du binaire Chromium et par `ERR_CONNECTION_REFUSED` depuis le navigateur cloud. Une reprise après remplacement de l’environnement a été menée le 27 novembre 2026 à **13:31 UTC**. Le démarrage Vite sur `0.0.0.0` échouait sur l’énumération système des interfaces ; celui sur `127.0.0.1:4187` annonçait « ready », mais un second processus recevait `Connection refused`. Aucun parcours UI n’a été lancé pour cette tentative locale. Son [rapport historique](qa/armax-browser-retry-report.json) conserve `browserPassed: false`, zéro contrôle et zéro capture pour ce seul essai ; les exécutions CI ultérieures ont leurs propres captures et rapports.

Des interruptions d’environnement ont imposé une récupération de sources. Les neuf fichiers sauvegardés en blobs GitHub pendant une interruption ont ensuite été comparés aux fichiers locaux par SHA Git et étaient strictement identiques. Les dernières corrections de revue et métadonnées ont été réexécutées nativement ; seuls les rapports courants font foi. Le harnais V8 de secours envisagé n’a pas été utilisé.

## Suite générale du projet

La suite générale a réussi en CI sur le commit **`f2b756fd476e00c5a282345e30464966a982c02e`** : **1 393/1 393 tests**, zéro échec, zéro test ignoré, puis **compilation réussie de 170 modules**. Le [rapport courant](qa/armax-ci-general-current-report.json) et le [journal brut](qa/armax-ci-general-current.log) identifient le run `46020607465`, le job `140578968871` et **onze empreintes concordant avec les sources vérifiées**. Cette révision comprend les correctifs de routage clavier, de rendu et du bouton « Retour » mobile. L’exécution Windows a été ignorée par ce workflow ; aucun résultat Windows n’est déduit de cette preuve.

La suite générale et les **six cas navigateur sur `f2b756fd`** sont terminés avec succès, chacun avec son rapport et son périmètre. L’échec du job Shepard `140578968931` reste consigné avec son diagnostic séparé ; l’atelier Shepard fait l’objet d’un suivi distinct. L’ensemble des workflows n’est pas déclaré réussi.

La CI distincte du main fusionné `6b761f8a` a produit des [archives web et Windows](qa/armax-packaged-builds.json), avec tests et packaging Windows réussis. Le [lien Windows Portable](README.md#pour-essayer) correspond au runtime du premier succès `859fac` et n’inclut pas la retouche CSS de `f2b756fd`. Aucun essai de l’exécutable sur du matériel Windows réel n’est revendiqué.

L’exécution sur **`859fac838f988c49b05e10c6cc529f5726eb5d5d`** avait réussi **1 393/1 393 tests** et la compilation de **170 modules**. Son [rapport historique 859](qa/armax-ci-general-859-report.json) et son [journal](qa/armax-ci-general-859.log), run `46016000473`, conservent cette preuve antérieure à la retouche CSS mobile.

L’exécution sur **`6335856adb5c067625404d24f6c6f0ab2a8b56cb`** avait réussi **1 392/1 392 tests** et la compilation de **170 modules**. Son [rapport historique 633](qa/armax-ci-general-633-report.json) et son [journal](qa/armax-ci-general-633.log), issus du run `46014391137`, restent liés aux sources antérieures aux corrections de `src/main.js` et `src/armax-ui.js`.

Les essais locaux incomplets sont conservés comme historique. Après restauration de **24 fichiers exacts**, l’essai local rapportait **1 392 tests : 1 373 réussis, 19 en échec** ; les 19 traces provenaient de **12 autres entrées historiques absentes** du checkout. Le [rapport de cette étape](qa/armax-full-suite-restored-report.json) et son journal `qa/armax-full-suite-restored.log` conservent les `ENOENT`, empreintes et limites d’espace. Ces blocages locaux ne sont pas le résultat de la suite complète exécutée ensuite en CI.

Le premier essai (1 378 tests rapportés, 1 347 réussis, 31 échecs) reste archivé dans `qa/armax-full-suite-report.json` et `qa/armax-full-suite.log`. Il échouait aussi au chargement de deux modules, ce qui explique les 14 tests supplémentaires révélés après restauration. `qa/armax-full-suite-rerun-unrestored.log` est un faux départ avant restauration, conservé comme historique et exclu des preuves de progrès. La restauration exacte et ses contrôles de blobs sont consignés dans `qa/armax-restoration-report.json`.

## Travail restant

Quatre spéciaux par personnage, ressources et supers individuelles, animations complètes, hitboxes animées, dash/back throw, commandes avancées, tag/assistants, provocations, tournoi, manette, réseau/rollback, accessoires de boss, scènes illustrées et audio final restent ouverts. Profils définis, images présentes, code testé nativement, parcours visuels et fidélité 1:1 demeurent des états séparés. Ce prototype ne certifie ni fidélité artistique 1:1 ni qualité équivalente à une sortie officielle.

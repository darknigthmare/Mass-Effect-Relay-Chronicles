# Progression et conséquences — Advance

Le journal suit les jalons et le premier départ choisi, les recrutements de Garrus et Wrex ont des branches de refus/report, et les sujets de Tali et Kaidan ouvrent leurs dossiers dédiés. Les cartes expliquent les prérequis et représentent les obstacles ; le repli affiche son délai de terrain. Féros conserve les seize interventions, le Cipher et le sort de Shiala, puis le bilan de fin peut être consulté dans les Chroniques ME2/ME3 autorisées.

Le suivi de campagne reste distinct des assignations. Les décisions civiles portent sur une cible présente et leurs compteurs sont dérivés des actes enregistrés ; un interlocuteur tué ou encore sous influence ne propose pas sa remise de quête. Les vieux bilans sans détail restent explicitement inconnus. Les dossiers des Chroniques ne donnent aucun équipement, pouvoir ou présence future à ME1. Voir [périmètre et preuves](ADVANCE.md).

---

# Suite jouable — Continuation

Le [lot Continuation](CONTINUATION.md) ajoute au socle des graphes de dialogue à questions/tons, des échanges de terrain entre équipiers actifs, le catalogue documentaire des œuvres et les crédits sourcés. Les marqueurs d’échanges entendus utilisent le budget de sauvegarde existant ; aucun personnage absent ou mort ne reste affiché après un changement de groupe.

Les surfaces praticables déterminent la hauteur des pieds et de l’ombre. Les marches physiques de l’approche du Conseil restent une géométrie adaptée. L’arène ME2/ME3 est un modèle ATB bidimensionnel distinct : Avancer/Reculer et Charge modifient des positions bornées, sans prétendre reproduire une carte ou une animation originales.

---

# Conception — Relay Chronicles

## Complétion fonctionnelle P0/P1/P2

Le [lot Completion](COMPLETION.md) conserve ce cadre et précise les contrats de jeu. La [couverture](research/completion-world.md) utilise les mêmes empreintes solides que le déplacement et vérifie séparément chaque direction d’attaque. Le repli exige les jauges des équipiers vivants, une confirmation et un point praticable hors des contacts ; il ne distribue aucun gain. Les messages d’immunité et d’annulation sont explicites.

Les [relations et conséquences](research/completion-narrative.md) dérivent des conversations, recrutements, survivants et choix réellement enregistrés. L’origine et le profil restent stables ; Liara réagit à un recrutement tardif. Aucune romance ou conséquence de campagne ultérieure n’est créée par ce résumé. Le [bilan de fin](COMPLETION_PERSISTENCE.md) conserve un snapshot ME1 versionné, distinct de la reprise et sans déclarer une campagne ME2 disponible.

Les [préférences d’accessibilité](research/completion-controls.md) s’appliquent immédiatement sur l’appareil. Les textes longs défilent ; Tab et Maj+Tab conduisent à des commandes accessibles, y compris dans l’atelier. Réduire les effets conserve les poses et messages nécessaires à la lecture du combat. Les [signatures des Chroniques](research/completion-chronicles.md) restent des actions préparées de leurs classes, œuvres et périodes : Charge utilise un contact abstrait, Camouflage une durée limitée, Technoblindage distingue ME2 et ME3, et Nova dépense le bouclier.

## Intention

Représenter Mass Effect avec le langage d’un JRPG de l’époque PlayStation : cadrages lisibles, groupe de trois, exploration de tableaux, commandes de combat et rythme ATB. La réalisation conserve une séparation matérielle nette : le terrain, les bâtiments et les volumes sont en 3D ; les personnages sont des images 2D orientées vers la caméra. Les lumières, ombres, particules et matériaux donnent de la profondeur aux environnements.

Le projet vise à terme une adaptation de ME1 complète et cohérente avec ses personnages, lieux et décisions. Le passage du tir à un RPG ATB change nécessairement les règles d’action et le découpage des affrontements. La fidélité doit donc être évaluée séparément pour l’apparence, la géographie, la chronologie, les décisions et les systèmes de combat.

**Livraison 0.2.0 :** la campagne condensée reste jouable du départ à la fin. Elle accueille un inventaire persistant, onze nouvelles opérations annexes et une première animation de Shepard féminine. Les règles suivantes décrivent cette implémentation lorsqu’elles sont indiquées comme présentes. Le catalogue Excel décrit en complément les éléments à réaliser pour l’ambition intégrale.

La version 0.3.0 comprend aussi l’atelier de personnalisation avec brouillon atomique et neuf emplacements. Les compléments de novembre étendent le parcours d’Eden Prime et les familles de poses des acteurs ME1 ; leurs portées sont décrites ci-dessous. Le [classeur principal](Mass_Effect_Relay_Chronicles_Production.xlsx), les [Chroniques](CHRONICLES.md) et les [preuves de chaque lot](IMPLEMENTATION_STATUS.md) restent distincts : une fiche de production ou une pose dessinée n’équivaut pas à une campagne ou une animation complète.

## Priorités P0/P1 : règles et objectifs persistants

Le [lot de priorités](PRIORITY_GAMEPLAY.md) conserve les vingt-et-un identifiants de combat et les récompenses uniques. Le désamorçage d’Eden précède le dernier combat ; la remise en marche condensée de MIRA précède les laboratoires ; Vigil active la fenêtre du Conduit après les combats d’Ilos. Ces sous-objectifs ont un état distinct, un journal, des interactions réelles, un échec et une reprise explicites pour les étapes chronométrées. Ils ne sont pas comptés comme de nouvelles quêtes annexes.

Les positions tactiques sont des coordonnées locales des arènes ATB. Les points d’arrivée et les segments de déplacement doivent traverser le sol réel du décor ; les sprites suivent exactement les positions validées. La portée est affichée avant la dépense. Un ordre coordonné prévalide deux ou trois participants, leurs capacités et les ressources communes. Une condition initiale manquante refuse l’ensemble ; une cible invalidée pendant la résolution annule gratuitement les ordres restants avec un événement explicite. Aucun bonus de dégâts n’est accordé par le simple regroupement.

La réservation d’une jauge est volontaire et ne coûte aucun ATB : elle permet aux autres acteurs de se charger en mode Attente, en laissant les ennemis agir. Libérer les réservations ou annuler le brouillon rend les décisions. Bénézia est protégée pendant trois vagues ; le Thorien utilise six nœuds passifs et trois renforts. Les budgets totaux sont répartis entre les étapes et une seule victoire termine la rencontre. Ces découpages, effectifs et chiffres sont des adaptations, avec sources complètes et mise en scène originales encore ouvertes.

Les talents partagent le budget des formations d’armure : un point par niveau ATB gagné, par personnage. Les achats se font au Normandy et sont définitifs dans cette version. Les effets sont reconstruits depuis les bases, le matériel et les rangs. Le comparatif affiche aussi le multiplicateur réel des tirs ; une maîtrise perdue en changeant de famille d’arme ne reste pas appliquée. Les trois nouvelles capacités sont limitées à leurs classes ME1 prises en charge ; Adrénaline réinitialise les autres recharges sans ralenti ME2, soin ou munition créé.

La boucle conserve le temps avec des sous-pas fixes, un rendu par image et une interruption des commandes au changement de focus. Les menus et chargements réinitialisent la reprise, et les longues interruptions ne sont pas rejouées. Une manette standard navigue dans les vrais contrôles DOM ; les champs de texte ont un clavier à l’écran. Les tests de périphérique simulé ne remplacent pas une validation matérielle.

## Boucle jouable

1. Rejoindre le Normandy, consulter le briefing et préparer les deux compagnons.
2. Acheter, vendre et comparer l’équipement ; choisir les armes, armures et modules de chaque compagnon ; consulter les dossiers.
3. Choisir une destination débloquée par l’enquête.
4. Explorer le décor 3D, récupérer les ressources, suivre un objectif et approcher une rencontre visible.
5. Engager le combat ATB ; exploiter pouvoirs, défense, chaleur et ordre des actions.
6. Valider le résultat, compléter l’objectif et prendre les décisions proposées.
7. Revenir au Normandy, avec nouvelles destinations, recrues, ressources et rapports.

Les combats remportés restent sécurisés : le joueur ne peut pas récolter indéfiniment les récompenses d’un même identifiant. Les ressources de terrain ne se récupèrent qu’une fois. La sauvegarde conserve les choix et la composition disponible après les événements irréversibles.

## Parcours de la version jouable

| Étape | Contenu condensé | Condition de fin / effet |
|---|---|---|
| Normandy | Briefing, navigation, équipement, commando, infirmerie, archives | Débloque Eden Prime |
| Eden Prime | Patrouille, quais, quatre charges, défense de la balise | Perte de Jenkins, recrutement d’Ashley, activation de la balise |
| Citadelle | Rencontres de Garrus, Tali et Wrex ; audience | Statut Spectre, trois pistes d’enquête |
| Thérum | Avant-poste, ruines, protection du site | Libération et recrutement de Liara |
| Féros | Route d’ExoGeni, profondeurs, Thorien | Choix concernant la colonie |
| Novéria | Sécurité, trois stations MIRA, laboratoires rachni, Bénézia par vagues | Choix concernant la reine rachni |
| Virmire | Plage, installation, Saren | Extraction de Kaidan ou d’Ashley |
| Ilos | Jardins, galeries, défense, activation de Vigil et fenêtre du Conduit | Archives de Vigil et passage vers la Citadelle |
| Citadelle finale | Quais, tour, Saren synthétique | Choix de flotte et bilan final |

Après la Citadelle, Thérum, Féros et Novéria peuvent être visitées dans l’ordre choisi. Virmire s’ouvre après deux de ces enquêtes. Ilos exige les trois enquêtes et Virmire. Le final s’ouvre après Ilos. Ces conditions sont celles du prototype et sont testées comme telles ; elles ne constituent pas une transcription exhaustive de tous les embranchements de ME1.

Les cartes jouables représentent des condensations de plusieurs lieux. Les cent sous-zones et les liaisons du catalogue constituent un registre de travail distinct, qui doit être vérifié avant reconstruction intégrale.

## Extension Frontier : présence, conduite et grands parcours ME1

Thérum, Novéria et Virmire ont chacune un plan de cinq secteurs reliés par trois chemins : progression, détour facultatif et retour. Leur enveloppe de scène mesure 122 × 176 unités ; le sol réellement praticable suit des polygones et couloirs, avec relief périphérique et collisions. Les distances sont des valeurs de composition du prototype. Thérum associe basalte, lave, raffinerie et fouille ; Novéria associe Port Hanshan, garage, route enneigée et laboratoires ; Virmire associe côte, camp du GSI, périmètre et installation. Ces lieux reliés sans coupure ne reproduisent pas les dimensions ou toutes les transitions du jeu original.

Chaque carte conserve ses sept identifiants de mission et trois arènes ATB locales. La caméra suit le commando ; carte et radar partagent le masque de sol du monde. Les positions d’anciennes sauvegardes sont replacées sur un point libre si nécessaire. Les autres cartes conservent leur plan, dont Eden Prime et ses cinq secteurs.

Greg Adams, Charles Pressly, l’officier des réquisitions et Jenkins proposent deux sujets chacun au Normandy. Jenkins n’est présent qu’avant Eden Prime. Gianna Parasini, Anoleis, Lorik Qui’in et Lilihierax sont placés à Port Hanshan ou au garage, après la Citadelle. Ces huit conversations d’information n’ajoutent ni recrutement, ni récompense, ni résolution implicite des quêtes de Novéria. Les textes sont réécrits pour le prototype.

Huit types adverses supplémentaires occupent six formations ordinaires existantes : drones de reconnaissance et d’assaut geth, lance-roquettes, soldat de choc, juggernaut, traqueur, rachni ouvrier et tourelle. Ils utilisent des corps dédiés et les commandes ATB présentes. Les projectiles explosifs, la grimpe, les trajectoires de vol et l’autodestruction d’origine restent à réaliser. Les quatre boss existants reçoivent chacun quatre dessins de combat ; cela ne crée aucune phase ou capacité supplémentaire.

À Thérum, E permet d’embarquer près du Mako ou de descendre ; ZQSD/WASD/flèches pilotent et Maj accélère. Les commandes tactiles proposent aussi direction et accélérateur. La conduite teste le gabarit contre les sols et obstacles ; un passage non sécurisé bloque le véhicule avant la rencontre obligatoire. Le commando descend pour engager le combat. Le contrôleur est un prototype avec inertie adaptée, sans canon, simulation de suspension ou conduite sur toutes les planètes. La position du commando reste sauvegardée ; le véhicule est recréé à son stationnement et la reprise se fait à pied, sans changement du format de sauvegarde.

## Horizon : Féros, Ilos et dossiers de reconnaissance

Le [complément Horizon](HORIZON.md) étend Féros et Ilos en cinq secteurs et trois chemins chacun. Les sept points de mission et les trois arènes principales sont conservés ; les opérations de Féros sont relocalisées sur ce même plan, avec une arène annexe pour les varrens. Le Thorien possède une chambre à racines ouverte pour la caméra, sans prétendre reconstruire son repaire complet.

Huit PNJ supplémentaires proposent deux sujets chacun. Leurs opérations partagées restent accessibles dans le dialogue lorsque le contact de mission est proche ; le lien n’active pas un objectif éloigné. Fai Dan et les autres corps ajoutés à Féros quittent la scène après le boss, tandis que l’historique des sujets reste sauvegardé.

La nouvelle opération des varrens comprend demande, affrontement d’une meute avec alpha et rapport à Davin. Elle ferme avant le Thorien dans ce prototype, qui ne suit pas la survie de chaque colon. Les anciens états reçoivent son enregistrement initial, sans changer le format de sauvegarde. Les quatre aides à la colonie sont désormais eau, énergie, tunnels geth et viande.

Le Codex donne accès à **Faune et vaisseaux**, selon la connaissance du commando. Les repères de vaisseaux sont des projections bleues sur bornes, sans présence physique de coques dans les promenades. Les dossiers des autres épisodes passent par l’accès documentaire existant et des filtres dédiés des Chroniques ; une image n’accorde ni pilotage, ni recrutement ou rencontre. Les cinq profils ennemis supplémentaires utilisent les ordres ATB existants. Le maître de guerre de Thérum garde le budget exact du krogan qu’il remplace.

## Combat ATB

Chaque acteur possède santé, bouclier, attaque, défense, vitesse, chaleur, concentration, jauge ATB, recharges et états temporaires. Une jauge pleine permet une action. La simulation découpe le temps en petites étapes pour conserver l’ordre des événements même lorsqu’un test accélère plusieurs secondes.

| Système | Fonction dans le prototype |
|---|---|
| Mode Attente | Suspend la simulation dès qu’un allié conscient et non immobilisé peut agir |
| Mode Actif | Fait avancer les jauges pendant le choix des commandes |
| Tirs | Génèrent de la chaleur ; la surchauffe impose un refroidissement |
| Couverture | Réduit les tirs reçus et favorise la récupération de bouclier |
| Contournement | Prépare un tir qui ignore la couverture |
| Technologie | Surcharge, Sabotage, Piratage selon les aptitudes |
| Biotique | Projection, Lévitation, Déchirure, Singularité, Barrière et Stase selon les aptitudes |
| Attaques organiques | Assaut ou acide, sans chaleur d’arme ni pouvoir biotique ajouté |
| Médi-gel | Réserve commune ; soigne un allié conscient |
| Unité | Talent de Shepard après son statut Spectre, pour relever un équipier KO en combat |
| Technique d’élite | Dépense une concentration acquise pendant le combat |

La Stase immobilise sa cible et la protège contre les dégâts. Le piratage requiert une cible synthétique admissible ; les immunités des boss sont explicites. Les morts scénaristiques ne sont pas des KO et ne peuvent être annulées par les soins.

Les classes déterminent les aptitudes de Shepard ; le Soldat ne reçoit pas de biotique. Les actions choisies constituent une adaptation ATB de la licence. Les dégâts chiffrés, la concentration et les durées sont des valeurs de jeu originales, sans prétention à reproduire les calculs de ME1.

Jenkins participe au premier affrontement d’Eden Prime dans cette campagne condensée. Sa perte scénaristique est enregistrée à la validation de cette première victoire, puis Ashley rejoint le groupe. Le personnage reste indisponible après reprise ; une pose de KO ou une commande de soin ne modifie pas cette décision. Ce découpage propre au prototype ne reproduit pas la scène originale plan par plan.

### Progression actuelle

La victoire donne expérience et crédits. Les niveaux renforcent automatiquement les statistiques. L’armurerie conserve les calibrations permanentes de la version précédente et les doses de médi-gel. Elle vend aussi 52 références : 20 armes, 16 armures, quatre modules d’arme, quatre modifications de munitions, quatre modules d’armure et quatre outils OmniTech/amplificateurs biotiques. L’inventaire partagé compte au plus 150 objets, équipement compris, et 20 exemplaires par référence. Les stocks et les neuf emplacements de chaque personnage sont sauvegardés : arme, armure, deux modules d’arme, modification de munitions, deux modules d’armure, OmniTech et amplificateur biotique.

Le jeu contrôle le niveau, l’espèce et la classe avant d’équiper une armure. Une arme non entraînée ne fournit que la moitié de son bonus d’attaque. La comparaison montre les valeurs résultantes avant l’achat ou l’équipement. Un objet porté ne peut pas être vendu ; le matériel d’un compagnon disparu reste récupérable. Les bonus sont appliqués une seule fois, depuis les statistiques de base. L’équipement de départ ne renforce pas les statistiques du prototype précédent, afin de préserver son équilibre.

Les modules peuvent modifier la chaleur, le refroidissement, les dégâts contre les organiques ou synthétiques, la pénétration du bouclier et la résistance au contrôle. Le coût thermique annoncé par l’action correspond à celui du tir. Les valeurs, prix et stocks relèvent de l’adaptation ATB ; les variantes visuelles d’armes et de tenues ne changent pas encore avec l’équipement.

Santé et boucliers sont restaurés au début d’une rencontre : c’est une simplification volontaire de cette version, à reconsidérer avec une campagne plus longue. Le catalogue conserve les familles, qualités et objets du jeu d’origine qui ne font pas partie de ces 52 références.

### Opérations annexes

Les trois assignations déjà publiées — Retour à la maison, Affaire familiale et Le Fan — gardent leur progression. Douze opérations supplémentaires ajoutent 46 étapes à la Citadelle et à Féros. Le journal affiche leur objectif courant, les conditions de déblocage, les réponses mémorisées, les récompenses et les issues. Un seul objectif annexe peut être suivi ; il apparaît sur la carte et dans l’interface d’exploration.

Les cinq rencontres annexes utilisent les vraies règles ATB. Choisir de combattre arme une rencontre persistante ; seule une victoire validée peut compléter cette étape. Un rechargement reprend depuis l’avant-combat, sans attribuer les récompenses. La conclusion de chaque opération paie une seule fois. Le docteur Michel peut être aidé par persuasion ou par combat et donne ensuite une remise de 20 % sur le médi-gel. Les services rendus à la colonie de Féros et les données de Gavin sont enregistrés dans le rapport de mission.

Les opérations des tunnels et la récupération des données possèdent des échéances liées au Thorien. Le retour à Gavin reste possible si les données ont déjà été copiées. Un avertissement précède les échéances du Thorien et du Conduit. Ces conditions sont celles des cartes condensées ; les dialogues complets, tous les veilleurs et les autres variantes du jeu original restent à produire.

## Décisions et narration

Les dialogues du prototype sont des scènes courtes rédigées pour relier les étapes jouables. Ils ne reprennent pas intégralement le script ou les voix du jeu original. Les événements majeurs produisent des drapeaux persistants, des entrées de journal et un bilan de fin.

Les choix de Féros, Novéria, Virmire et de la flotte sont enregistrés sous des valeurs strictes. Une décision manquante ou inconnue ne déclenche pas de conséquence par défaut. La sauvegarde rejette également les états incompatibles, comme un compagnon perdu présent dans le groupe, une destination débloquée sans ses prérequis ou un personnage recruté avant son événement.

Pour la version intégrale, chaque scène devra définir son lieu, les participants, les conditions, les variantes, les décisions, leurs effets différés, les entrées du journal et les tests. Les romances et scènes d’équipage nécessitent des arbres dédiés ; elles ne sont pas simulées par un compteur fictif dans cette livraison.

## Direction artistique et pipeline

### Sprites

Les atlas PNG utilisent un canal alpha. Les matériaux des personnages sont des plans lisibles avec un seuil de transparence, des ombres au sol et une orientation vers la caméra. Les plans de personnages n’exigent pas un squelette 3D. Les portraits de dialogue et les cartes de commando réutilisent les régions d’atlas.

La version actuelle dispose de poses HD du commando, des ennemis et boss, de personnages secondaires, d’objets et de véhicules. Les deux apparences de Shepard possèdent chacune une première marche en quatre directions et quatre images par direction, ainsi que quatre poses de combat : visée, pouvoir, impact et KO. Les sept compagnons du parcours ME1, Jenkins compris, ont chacun quatre dessins de combat. Les huit familles d’ennemis ordinaires — soldat geth, sniper geth, destructeur geth, husk, krogan, rachni, creeper du Thorien et commando asari — disposent aussi de quatre poses chacune, Les quatre familles de boss disposent de seize autres poses, soit **84 poses clés de combat** au total. Les deux dessins assis de Joker et les deux textures de sol sont comptés séparément. Les rectangles, pivots et hauteurs sont mesurés dans les images natives et embarqués dans la compilation ; leur chargement ne demande pas de requête JSON externe.

Les poses accompagnent les actions déjà disponibles ; elles ne donnent aucun pouvoir, équipement ou recrutement supplémentaire. Le geste de Jenkins ne lui attribue pas de biotique. Le dessin du commando asari correspond à la famille générique déjà réutilisée par plusieurs rencontres : il ne produit pas les phases d’apparition et de disparition du clone asari du Thorien, qui garde ses fiches distinctes à réaliser.

Les autres mouvements restent des transformations de présentation : balancement, déplacement, impact, lévitation, couverture, disparition après KO. Quatre poses ne constituent pas quatre cycles animés. L’exploration des compagnons conserve ses silhouettes de base ; les nouvelles familles concernent le combat. Les [références et contrôles du lot](qa/me1-prologue-enemies-report.json) distinguent les corps produits, leurs usages natifs, la perte narrative de Jenkins et les détails d’identité encore non certifiés 1:1.

Pour une production finale, chaque personnage devra avoir une référence d’époque approuvée, des proportions et costumes stables, huit directions si le cadrage l’exige, repos, marche, course, tir, usage des pouvoirs, dégâts, KO et transitions. Une silhouette comparable à son personnage ne suffit pas à valider la fidélité des détails.

### Décors 3D

Les neuf zones sont construites avec des volumes, matériaux, éclairages et éléments spécifiques. Les géométries statiques partageant un matériau sont regroupées pour réduire les appels de rendu. La végétation répétée est instanciée. Les façades côté caméra sont réduites en coupe pour éviter d’occulter le commando.

Eden Prime possède un plan propre à cinq secteurs, un chemin principal, une boucle de ravitaillement et une piste de retour. Ses sept points de progression conservent leurs identifiants ; trois arènes locales évitent de ramener tous les combats au même endroit. Le masque de sol, les obstacles, les déplacements au clic, la caméra de suivi, la carte locale et le radar utilisent ce même plan. L’enveloppe de 110 × 150 unités comprend aussi du décor non praticable ; elle n’est ni une surface entièrement accessible, ni un relevé des dimensions originales. Thérum, Novéria, Virmire, Féros et Ilos disposent aussi de cinq secteurs ; Normandy et les deux états de la Citadelle conservent leurs plans plus condensés. Les [références du parcours](research/eden-level-layout.md) précisent les neuf repères de production, qui ne constituent pas neuf sous-niveaux originaux complets.

Les éléments de structure qui masquent les combattants à Novéria et les poteaux de premier plan à Féros sont gérés séparément de la fusion statique et peuvent s’effacer pendant le combat. Leur présence en exploration et leurs collisions sont conservées. Cette coupe de présentation ne change ni les accès ni la progression de la mission ; sa portée visuelle est contrôlée sur les captures réellement produites.

Le déplacement possède des limites, des collisions et une navigation au clic par recherche A*. Les points d’intérêt utilisent des identifiants stables. Le renderer ne décide pas des récompenses : il émet une interaction que la couche de progression valide.

Les véhicules actuellement visibles sont des éléments de décor. La conduite du Mako nécessitera une physique, des commandes, des collisions, une caméra, un arsenal et des rencontres spécifiques. L’atlas ne remplit pas ces fonctionnalités.

### Audio

L’audio repose sur des oscillateurs et enveloppes Web Audio, avec un profil par zone et des signaux pour les actions. L’activation attend un geste de l’utilisateur ; les sons se désactivent et les ressources se libèrent proprement. Cette piste ne fournit ni doublage, ni enregistrements orchestraux, ni bande originale reproduite.

## Architecture

`main.js` orchestre l’interface et les transitions. `world.js` rend le décor et les sprites. `combat.js` fonctionne sans DOM pour permettre des tests déterministes. `state.js` contrôle les mutations de campagne et reconstruit les sauvegardes depuis des champs validés. `game-data.js` décrit les données du jeu présent. `loadout.js` valide l’inventaire et calcule les bonus ; `operations.js` contrôle les nouvelles étapes sans modifier les trois assignations historiques. Les modules d’interface correspondants rendent l’équipement, le journal et la carte. Le catalogue de production est distinct et ne déclare pas automatiquement une fiche jouable.

La séparation permet de remplacer une carte condensée, un atlas ou un écran sans réécrire les règles de combat. L’ajout d’une mission nécessite néanmoins des données, des interactions, des conditions de progression, du contenu narratif, des assets et des preuves de test ; ajouter un nom au catalogue ne suffit pas.

## Sauvegarde et reprise

La sauvegarde automatique se produit hors combat. En combat, la reprise part du point précédent la rencontre. Six emplacements manuels complètent l’autosauvegarde. Le fichier exporté porte un identifiant de format et une version. Les nouveaux sous-états `talents` et `missionProgress` ont leur propre version, avec migration des champs absents et refus des champs présents invalides ; les détails historiques inconnus ne sont pas inventés. Les données importées sont contrôlées avant d’être appliquées ; une importation invalide ne remplace pas la progression valide. Les niveaux, calibrations, équipements, stocks, opérations, choix, morts, recrues, conversations, dossier et paramètres de jeu sont persistés.

Le format reste en version 1. Les sauvegardes antérieures sans inventaire ou opérations reçoivent les valeurs initiales de ces champs, tout en conservant le dossier et la progression déjà publiés. Les champs présents mais invalides sont refusés. Une étape ou un combat annexe incomplet n’est pas converti en victoire pendant la migration.

Le stockage local dépend du navigateur ou de l’application ; l’export JSON permet de transférer la progression. La version actuelle ne fournit pas de cloud, de multijoueur ni de comptes.

## Critères pour passer du prototype à l’adaptation intégrale

- Chaque carte du catalogue doit être reconstruite et comparée aux références, avec accès, proportions, repères et connexions documentés.
- Chaque mission doit être jouable dans les ordres autorisés, avec ses variantes, objectifs optionnels et conséquences.
- Les personnages, ennemis et boss doivent disposer de toutes les animations nécessaires, d’assets vérifiés et de comportements distincts.
- Les objets et véhicules doivent être fonctionnels lorsqu’ils ne servent pas seulement de décor.
- L’équilibrage doit être éprouvé par des joueurs, sur toutes les classes et difficultés, au-delà de simulations automatisées.
- Les choix exportés doivent rester cohérents à travers les scènes et, ultérieurement, les autres épisodes.
- Une ligne ne passe à « Validé » qu’avec une preuve correspondant à son critère d’acceptation.

## Références de départ

- [Manuel français Mass Effect PC, EA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf) : classes, monde et systèmes de ME1.
- [Manuel français Final Fantasy VII, PlayStation](https://secure.cdn.us.playstation.com/manuals/classic/games/final-fantasy-vii-manual-fr.pdf) : langage d’interface et commandes du JRPG de référence.
- [Rééquilibrage Legendary Edition, BioWare / PlayStation](https://blog.playstation.com/2021/04/06/mass-effect-legendary-edition-rebalancing-tuning--mechanical-improvements/) : distinctions à documenter entre variantes de ME1.
- [Guides cosplay Mass Effect, EA](https://www.ea.com/games/mass-effect/community/cosplay-guides) : sources visuelles à sélectionner selon l’épisode et la tenue.
- [Documentation Three.js](https://threejs.org/docs/) : renderer et assets techniques.

Le registre JSON contient les sources associées aux fiches. Une source générale ne certifie pas tous les détails d’une silhouette, d’un lieu ou d’un embranchement ; les fiches non vérifiées restent identifiées comme telles.

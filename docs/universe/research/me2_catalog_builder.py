from games_catalog_common import Catalog

c=Catalog('ME2','Mass Effect 2','Campagne solo ME2 et Legendary Edition ; recrutements, loyautés, affectations N7 et hubs ; Kasumi, Zaeed, Normandy Crash Site, Firewalker, Overlord, Lair of the Shadow Broker et Arrival. Genesis est identifié comme récapitulatif interactif ; aucun mode multijoueur ME2 ajouté au canon.')
def wiki(key,title,path,scope): c.src(key,title,'https://masseffect.fandom.com/wiki/'+path,scope)
c.src('EA-LE','Mass Effect Legendary Edition — EA','https://www.ea.com/fr/games/mass-effect/mass-effect-legendary-edition','Périmètre de la collection solo et DLC','source officielle')
c.src('EA-CAL','Gameplay Calibrations — BioWare / EA','https://www.ea.com/ea-play/news/gameplay-calibrations','Différences Legendary : clips, moralité, intégration des équipements DLC','source officielle')
c.src('EA-DLC','How to download and buy DLC for classic EA games','https://help.ea.com/en//articles/orders-and-rewards/dlc-for-classic-games/','Noms des packs et distribution historique','source officielle')
c.src('EA-SHADOW','The Battles Rage On — EA, 7 septembre 2010','https://news.ea.com/press-releases/press-releases-details/2010/The-Battles-Rage-On-in-New-Downloadable-Content-for-BioWares-Dragon-Age-Origins-and-Mass-Effect-2/default.aspx','Liara, le Courtier et le centre de renseignements','source officielle')
for args in [
('GUIDE','Mass Effect 2 Guide','Mass_Effect_2_Guide','Ordre de campagne et disponibilités'),
('MISSIONS','Missions','Missions','Intitulés des missions ME2'),
('ASSIGN','Assignments','Assignments','Index des affectations ME2 ; pas les missions coupées'),
('CHAR','Characters/Mass Effect 2','Characters/Mass_Effect_2','Liste des équipiers et rôles temporaires'),
('SQUAD','Squad Members Guide (Mass Effect 2)','Squad_Members_Guide_%28Mass_Effect_2%29','Armes et capacités des équipiers'),
('POWERS','Powers','Powers','Pouvoirs de ME2 et pouvoirs de loyauté'),
('WEAPONS','Weapons','Weapons','Familles et recharge par clips thermiques'),
('HEAVY','Heavy Weapons','Heavy_Weapons','Armes lourdes ME2'),
('ARMOR','Armor Customization','Armor_Customization','Pièces et ensembles ME2'),
('UPGRADE','Upgrade Guide','Upgrade_Guide','Recherche et améliorations'),
('COMBAT','Combat (Mass Effect 2)','Combat_%28Mass_Effect_2%29','Base du combat et ordre d’escouade'),
('COLLECTOR','Collector','Collector','Collecteurs et principaux types'),
('ENEMIES','Prison Guard — index de bestiaire ME2','Prison_Guard','Index des unités de factions en pied de page'),
('PROF','Dossier: The Professor','Dossier%3A_The_Professor','Peste d’Omega, ventilation et Mordin'),
('WARLORD','Dossier: The Warlord','Dossier%3A_The_Warlord','Korlus, Okeer et Grunt'),
('CONVICT','Dossier: The Convict','Dossier%3A_The_Convict','Purgatory et libération de Jack'),
('ARCHANGEL','Dossier: Archangel','Dossier%3A_Archangel','Siège de Garrus à Omega'),
('TALI','Dossier: Tali','Dossier%3A_Tali','Haestrom et radiation solaire'),
('ASSASSIN','Dossier: The Assassin','Dossier%3A_The_Assassin','Thane et tours Dantius'),
('JUSTICAR','Dossier: The Justicar','Dossier%3A_The_Justicar','Samara, Illium et enquête'),
('GARRUS','Garrus: Eye for an Eye','Garrus%3A_Eye_for_an_Eye','Sidonis, Fade et Citadelle'),
('JACK','Jack: Subject Zero','Jack%3A_Subject_Zero','Retour à Pragia'),
('JACOB','Jacob: The Gift of Greatness','Jacob%3A_The_Gift_of_Greatness','Hugo Gernsback et Aeia'),
('MIRANDA','Miranda: The Prodigal','Miranda%3A_The_Prodigal','Niket et Oriana'),
('MORDIN','Mordin: Old Blood','Mordin%3A_Old_Blood','Maelon et recherches sur le génophage'),
('SAMARA','Samara: The Ardat-Yakshi','Samara%3A_The_Ardat-Yakshi','Morinth, enquête et substitution'),
('THANE','Thane: Sins of the Father','Thane%3A_Sins_of_the_Father','Kolyat et filature'),
('TREASON','Tali: Treason','Tali%3A_Treason','Procès de Tali et amiraux'),
('LEGION','Legion: A House Divided','Legion%3A_A_House_Divided','Station hérétique et choix des geth'),
('GRUNT','Grunt: Rite of Passage','Grunt%3A_Rite_of_Passage','Rite krogan et conséquences'),
('KASUMI','Kasumi: Stealing Memory','Kasumi%3A_Stealing_Memory','Bekenstein et graybox'),
('ZAEED','Zaeed: The Price of Revenge','Zaeed%3A_The_Price_of_Revenge','Raffinerie et revanche'),
('SHADOW','Lair of the Shadow Broker (mission)','Lair_of_the_Shadow_Broker_%28mission%29','Illium, Vasir, Hagalaz et yahg'),
('OVERLORD','Overlord','Overlord','Périmètre de Project Overlord'),
('ATLAS','Atlas Station','Atlas_Station','David Archer et installations d’Aite'),
('ARRIVAL','Arrival (assignment)','Arrival_%28assignment%29','Kenson, Aratoht, projet et relais Alpha'),
('FIRE','Firewalker Pack','Firewalker_Pack','Cinq affectations Hammerhead'),
('FIRE-COLD','Project Firewalker: Geth Incursion','Project_Firewalker%3A_Geth_Incursion','Lattesh, sondes et gel du moteur'),
('FIRE-START','Project Firewalker: Rosalie Lost','Project_Firewalker%3A_Rosalie_Lost','Récupération du Hammerhead'),
('INFIL','Collector Base: Infiltration','Collector_Base%3A_Infiltration','Spécialiste technique et chefs d’équipe'),
('WALK','Collector Base: The Long Walk','Collector_Base%3A_The_Long_Walk','Bulle biotique et équipage captif'),
('FINAL','Collector Base: Final Battle','Collector_Base%3A_Final_Battle','Dernière partie de la mission suicide'),
('STORY','Storyline II','Storyline_II','Chronologie principale et enlèvement de l’équipage'),
('STOP','Stop the Collectors','Stop_the_Collectors','IFF et point de bascule'),
('FREEDOM','Freedom’s Progress (mission)','Freedom%27s_Progress_%28mission%29','Veetor et colonie disparue'),
('INTERRUPT','Interrupt','Interrupt','Interruptions contextuelles ME2'),
('SAVE','Save File Transfer','Save_File_Transfer','Choix importés et exportables'),
('MERCHANTS','Merchants Guide','Merchants_Guide','Marchands, remises et hubs'),
('OMEGA','Omega','Omega','Station et peste'),
('NOSASTRA','Nos Astra','Nos_Astra','Hub d’Illium et personnages'),
('PRAETORIAN','Praetorian','Praetorian','Archetype de boss, barrières et poursuite'),
('HORIZON','Horizon (mission)','Horizon_%28mission%29','Défense coloniale et Praetorian'),
('SHIP','Collector Ship (mission)','Collector_Ship_%28mission%29','Embuscade et plateformes'),
('CAIN','M-920 Cain','M-920_Cain','Arme lourde chargée'),
('LOCUST','M-12 Locust','M-12_Locust','Arme de Kasumi'),
('VINDICATOR','M-15 Vindicator','M-15_Vindicator','Arme à rafales'),
('GETH-SG','Geth Plasma Shotgun','Geth_Plasma_Shotgun','Arme geth'),
('N7','N7 Armor','N7_Armor','Ensemble de base'),
('KESTREL','Kestrel Armor','Kestrel_Armor','Ensemble personnalisable')]: wiki(*args)

c.rows('characters', '''
SHEPARD|Commandant Shepard|Protagoniste personnalisable de ME2.|Chef de groupe ATB : donner un ordre collectif ou conserver sa jauge pour une interruption contextuelle.|Armure N7 modulable, visage et carrure paramétrables ; cicatrices en calque séparé.|Historique et état importés ; aucune apparence unique imposée.|EA-LE
MIRANDA|Miranda Lawson|Équipière de Cerberus.|Soutien hybride : préparer une cible par Surcharge, puis choisir Distorsion ou protection de l’équipe.|Combinaison claire à panneaux noirs ; silhouette droite et démarche maîtrisée.||SQUAD
JACOB|Jacob Taylor|Équipier de Cerberus.|Avant-garde de protection : attirer une menace proche puis la suspendre pour ouvrir un tir allié.|Tenue noire Cerberus, épaules larges et fusil compact.||SQUAD
MORDIN|Mordin Solus|Scientifique galarien recruté à Omega.|Médecin offensif : diagnostic des protections, Incinération et retrait rapide derrière la ligne de front.|Visage anguleux, crête asymétrique, manteau clair ; gestes précis.||PROF
GARRUS|Garrus Vakarian|Garrus est Archangel.|Tireur : marquer une ligne de tir, briser un bouclier puis armer une visée différée.|Armure bleue abîmée, viseur, mandibule cicatrisée ; asymétrie conservée.||ARCHANGEL
GRUNT|Grunt|Krogan récupéré dans la cuve d’Okeer.|Briseur de ligne : accumuler de l’élan au contact, dépenser Fortification pour protéger un allié.|Masse krogan, carapace claire et armure sombre ; centre de gravité bas.|Activation de la cuve nécessaire.|WARLORD
JACK|Jack|Biotique libérée de Purgatory.|Contrôle de foule : tracer une onde de choc au sol et repousser les ennemis regroupés.|Crâne rasé, tatouages simplifiés lisibles, posture nerveuse.||CONVICT
TALI|Tali’Zorah vas Neema / vas Normandy|Tali rejoint l’équipe après Haestrom.|Ingénieure : drone placé, piratage synthétique et récupération de bouclier sous conditions.|Capuche violette, visière opaque lumineuse, jambes et mains quariens.|Nom selon étape du procès ; ne pas l’uniformiser.|TALI,TREASON
THANE|Thane Krios|Assassin drell recruté sur Illium.|Précision biotique : suspendre une cible et consommer une fenêtre de visée pour un tir préparé.|Écailles vertes, yeux sombres, manteau noir à ouverture thoracique.||ASSASSIN
SAMARA|Samara|Justicari asari recrutée sur Illium.|Contrôle discipliné : projection et Reave pour maintenir une zone sûre autour du groupe.|Armure rouge, tête bleue et posture verticale ; mains ouvertes en préparation.||JUSTICAR
MORINTH|Morinth|Elle peut remplacer Samara.|Spécialiste de domination : convertir brièvement une unité organique vulnérable ; afficher l’identité cachée uniquement au joueur informé.|Variante de Samara avec détails faciaux séparés ; portrait de secret facultatif.|Exclusivité Samara/Morinth ; embranchement de loyauté.|SAMARA
LEGION|Legion|Unité geth recrutabile après l’IFF.|Analyste synthétique : drone de diversion et piratage, puis tir lourd lorsque la cible expose son flanc.|Optique unique, plaques geth, partie d’armure N7 rapportée et trou thoracique.|Décision d’activation ; disponibilité tardive.|CHAR,SQUAD,STOP
KASUMI|Kasumi Goto|Équipière du pack Stolen Memory.|Infiltration : marquer une cible isolée, disparaître pendant l’approche et revenir après une attaque de dos.|Capuche sombre, bordures ocre, un œil visible ; ombre distincte.||KASUMI
ZAEED|Zaeed Massani|Équipier du pack The Price of Revenge.|Mercenaire : feu de couverture et grenade incendiaire pour isoler une voie d’approche.|Armure usée, visage marqué, œil altéré et fusil tenu sans cérémonie.||ZAEED
LIARA|Liara T’Soni — équipière temporaire|Liara accompagne le DLC Shadow Broker.|Biotique de siège : singularité de courte zone et stase pour interrompre une menace protégée.|Combinaison blanche, bleu asari et détails de ceinture.|Équipière limitée à cette extension ; contacts possibles ailleurs.|SHADOW,SQUAD
KENSON|Amanda Kenson — alliée temporaire|Kenson accompagne une partie d’Arrival.|Escorte scriptée : protéger sa progression vers une console, sans la rendre sélectionnable dans le groupe permanent.|Scientifique humaine en tenue technique sobre.|Arc Arrival uniquement ; son rôle change pendant l’histoire.|ARRIVAL
''', source='CHAR')

c.rows('npcs', '''
ILLUSIVE|L’Homme Trouble|Dirige Cerberus et contacte Shepard.|Dialogue à distance qui expose objectifs et divergences ; journaliser la confiance sans jauge morale cachée.|Siège isolé, cigarette stylisée, regard lumineux et baie stellaire.|Ne pas confondre alliance circonstancielle et adhésion.|CHAR
JOKER|Jeff « Joker » Moreau|Pilote du Normandy.|PNJ mobile à vitesse adaptée pendant l’attaque ; trajet d’évasion lisible et sans mécanique de tir ajoutée.|Casquette et uniforme ; démarche prudente.||STORY
EDI|EDI — intelligence du Normandy|EDI intervient lors de l’enlèvement.|Projection et voix de bord donnant un avertissement d’itinéraire ; contrôle du vaisseau sous état narratif.|Hologramme bleuté ; aucune enveloppe synthétique ME3.||STORY
KELLY|Kelly Chambers|Membre de l’équipage du Normandy.|Relais des demandes de loyauté ; file de messages annotée par provenance et disponibilité.|Uniforme Cerberus et station d’accueil CIC.||CHAR
CHAKWAS|Karin Chakwas|Médecin à bord du Normandy.|Entretien de repos et point de soins ; dialogue particulier après sa demande de brandy.|Blouse médicale et plateau de soins ; gestes rassurants.||CHAR,ASSIGN
KEN|Kenneth Donnelly|Technicien associé à la demande de coupleurs.|Repère visuel des recherches mécaniques ; réplique originale déclenchée après livraison.|Poste de maintenance et combinaison de service.||ASSIGN
GABBY|Gabriella Daniels|Technicienne liée aux coupleurs FBA.|Dialogue d’atelier à deux interlocuteurs ; l’état de livraison ne doit se déclencher qu’une fois.|Silhouette humaine sur passerelle d’ingénierie.||ASSIGN
GARDNER|Rupert Gardner|Demande des ingrédients pour le Normandy.|Petit circuit d’approvisionnement sans combat obligatoire ; retour culinaire visible dans le mess.|Tablier de cuisine et poste multifonction.||ASSIGN
ARIA|Aria T’Loak|Dirige Omega depuis Afterlife.|Centre de renseignement : fournir plusieurs pistes sans forcer un ordre de recrutement.|Asari violette, tenue sombre et banquette surélevée.||OMEGA,PROF
PATRIARCH|Le Patriarche|PNJ d’une affectation d’Omega.|Entretien sur la protection personnelle ; choisir aide discrète ou confrontation annoncée.|Krogan âgé assis dans un coin du club.||ASSIGN
KENN|Kenn|Quarien de l’affectation Struggling Quarian.|Marchand associé à une aide au départ ; prix et aide narrative restent deux états séparés.|Combinaison quariène d’ouvrier et étal de récupération.||ASSIGN
ISH|Ish|Donneur de Packages for Ish.|Remise de colis avec aperçu du destinataire ; laisser une issue de refus claire.|Salarien près d’une zone de transit.||ASSIGN
DANIEL|Daniel Abrams|Assistant de Mordin porté disparu.|Résoudre un face-à-face de civils ; la sortie pacifique exige une lecture de la situation, pas une attaque.|Tenue médicale au milieu d’un quartier hostile.||PROF
VEETOR|Veetor’Nara|Survivant retrouvé à Freedom’s Progress.|Dialogue de stress avec espace et rythme contrôlés ; acquisition d’un témoignage sans combat contre lui.|Quarien entouré d’écrans de surveillance.||FREEDOM
RENEGAR|Kal’Reegar|Soldat quarian présent à Haestrom.|Soutien facultatif au Colosse ; afficher son exposition avant d’accepter son aide.|Armure quariène militaire ; arme lourde et blessures indiquées sobrement.||TALI
OKEER|Okeer|Scientifique krogan à Korlus.|Scène de laboratoire centrée sur son projet ; sa cuve constitue un résultat récupérable distinct du PNJ.|Krogan âgé près de cuves de croissance.||WARLORD
JEDORE|Jedore|Commande les mercenaires de Korlus.|Antagoniste de rencontre : ordre de renfort lisible avant l’ouverture des cuves.|Officier humaine en position dominante.||WARLORD
KURIL|Gardien Kuril|Antagoniste de Purgatory.|Mettre le marché de prisonnier et le combat sur deux états exclusifs ; l’hostilité ne débute qu’après la trahison.|Turien en armure de garde et position de contrôle.||CONVICT
ANDERSON|David Anderson|Personnage de la rencontre au Conseil.|Entretien de retrouvailles variable selon l’import ; aucun statut politique figé par défaut.|Uniforme de l’Alliance, bureau Citadelle.|Fonction exacte conditionnée par la sauvegarde.|MISSIONS,SAVE
BAILEY|Capitaine Bailey|Contact C-Sec des missions de Citadelle.|Intermédiaire judiciaire : afficher ce qui relève de sa décision et ce qui relève de Shepard.|Uniforme C-Sec, bureau aux écrans cyan.||MISSIONS,THANE
HARKIN|Harkin / Fade|Garrus cherche Fade pour atteindre Sidonis.|Interrogatoire avec preuve et pression ; interaction pouvant exposer un chemin de service.|Tenue civile usée dans le quartier industriel.||GARRUS
SIDONIS|Sidonis|Ancien membre de l’équipe de Garrus.|Entretien dans une ligne de tir ; positionner Shepard entre la cible et le viseur avant le choix final.|Turien civil sur belvédère urbain.||GARRUS
NIKET|Niket|Ami d’enfance impliqué dans l’arc de Miranda.|Confrontation à plusieurs regards ; état de révélation sépare identité, intention et résolution.|Humain en costume dans le terminal de fret.||MIRANDA
ORIANA|Oriana Lawson|Sœur de Miranda au cœur de sa loyauté.|Brève scène familiale après sécurisation ; aucune escorte combattante artificielle.|Civile et famille en zone sûre.||MIRANDA
MAELON|Maelon|Ancien assistant de Mordin.|Confrontation éthique : dissocier sort du chercheur et conservation de ses données.|Salarien dans un laboratoire dégradé.||MORDIN
RONALD|Ronald Taylor|Père de Jacob sur Aeia.|Révélation des journaux avant jugement ; conserver une trace distincte du sort des survivants.|Uniforme usé, installation de fortune et entourage armé.||JACOB
ARESH|Aresh|Rencontré pendant le retour de Jack.|Dialogue de confrontation près de la charge ; interruption de désescalade lisible.|Humain isolé dans le centre de détention abandonné.||JACK,INTERRUPT
KOLYAT|Kolyat Krios|Fils de Thane impliqué dans un contrat.|Filature suivie d’une scène d’interception ; pas de combat requis pour réussir.|Drell jeune, arme de poing ; silhouette distincte du père.||THANE
TALID|Joram Talid|Cible du contrat de Kolyat.|Personnage de filature avec arrêts lisibles ; ne pas lui attribuer des actions de combat inventées comme canon.|Turien en tenue politique et garde du corps.||THANE
RAAN|Shala’Raan|Amirale présente au procès de Tali.|Interlocutrice de soutien ; afficher le rôle institutionnel indépendamment de l’affection.|Combinaison quariène d’officier et lumière d’audience.||TREASON
KORIS|Zaal’Koris|Amiral du procès de Tali.|Point de vue politique opposé à la guerre ; dialogue original appuyé sur les preuves disponibles.|Quarien aux signes d’amiral distincts.||TREASON
GERREL|Han’Gerrel|Amiral du procès de Tali.|Position martiale du débat ; ses interventions ne remplacent pas le verdict.|Quarien d’allure militaire.||TREASON
XEN|Daro’Xen|Amirale du procès de Tali.|Perspective technologique ; questionner les preuves geth avec un volet de codex séparé.|Capuche claire et gestes d’analyse.||TREASON
HOCK|Donovan Hock|Marchand d’armes visé par le cambriolage.|Hôte social puis pilote de boss ; dissocier ses deux états dans le même identifiant narratif.|Costume luxueux, manoir et aéronef.||KASUMI
KEIJI|Keiji Okuda — enregistrement|Partenaire disparu de Kasumi.|Fragment mémoriel consultable avant le choix du graybox ; éviter toute réplique source longue.|Projection intime, données et portrait stylisés.||KASUMI
GAVIN|Gavin Archer|Responsable du projet Overlord.|Guide distant puis confrontation finale ; montrer la responsabilité dans le récit sans jeu de score moral simpliste.|Blouse Cerberus, écrans de contrôle.||ATLAS
DAVID|David Archer|Relié de force au dispositif Overlord.|Scène sensible centrée sur la libération et la personne ; pas de collectible ni récompense attachés à la souffrance.|Dispositif technique traité par cadrage sobre, visage et mains prioritaires.||ATLAS
FERON|Feron|Captif que Liara cherche à récupérer.|Rencontre après le combat ; dépendance à la libération et au nouveau rôle de Liara.|Drell marqué par la captivité, tenue sombre.||EA-SHADOW,SHADOW
VASIR|Tela Vasir|Spectre adverse dans Shadow Broker.|Enquêtrice puis duel biotique ; son statut ne protège pas artificiellement des choix d’enquête.|Asari en armure bleue claire, posture de charge.||SHADOW
HACKETT|Amiral Hackett|Confie Arrival à Shepard.|Briefing d’une mission solo et débriefing de conséquence ; séparer urgence narrative et choix jouable.|Hologramme Alliance et tenue d’officier.||ARRIVAL
''')

c.rows('main_quests', '''
SAVE-JOKER|Prologue: Save Joker|Prologue sur le Normandy attaqué.|Tutoriel d’exploration en urgence : progression vers Joker, cloisons brûlantes et sortie ; commandes de dialogue conservées.|Coursives brisées, fumée basse, espace au-delà de la passerelle.|Introduction.|GUIDE
AWAKENING|Prologue: Awakening|Shepard se réveille dans une installation Cerberus.|Introduire tir, couverture, pouvoir et recrutement séparément pendant l’évacuation.|Laboratoire clinique, alarmes et vitrages fissurés.|Après le prologue.|GUIDE
FREEDOM|Freedom’s Progress|Enquête sur une colonie disparue.|Construire trois arènes de mécas puis un entretien avec Veetor ; permettre de préserver les munitions avant le YMIR.|Préfabriqués vides, éclairage froid et écrans de surveillance.|Après Awakening.|FREEDOM
PROFESSOR|Dossier: The Professor|Mordin soigne une peste à Omega.|Traverser quarantaine, clinique puis ventilation ; phase finale de protection des commandes d’air.|Taudis enfumés, clinique claire, turbines industrielles.|Premier lot de dossiers.|PROF
ARCHANGEL|Dossier: Archangel|Garrus affronte plusieurs groupes mercenaires.|Défense étagée : saboter les préparatifs, couvrir le pont puis verrouiller les accès inférieurs.|Planque criblée, balcon et pont exposé.|Premier lot de dossiers.|ARCHANGEL
CONVICT|Dossier: The Convict|Jack est retenue sur Purgatory.|Ouvrir par une inspection calme, faire basculer les systèmes puis relier libération et fuite tactique.|Coursives carcérales, cellules et générateurs de protection.|Premier lot de dossiers.|CONVICT
WARLORD|Dossier: The Warlord|Okeer travaille dans un camp de Korlus.|Progression de ferraille en hauteur ; combat de cuves et récupération du conteneur krogan.|Carcasses de vaisseaux, ascenseurs, laboratoire provisoire.|Premier lot de dossiers.|WARLORD
GRUNT-TANK|Dr. Okeer’s Legacy|L’activation de Grunt reste une décision.|Interaction de cuve hors combat ; expliquer le risque narratif sans imposer une loyauté automatique.|Soute du Normandy et cuve translucide.|Après récupération de la cuve.|WARLORD
HORIZON|Horizon|La colonie subit une attaque des Collecteurs.|Alternance sauvetage, réparation de défense et survie contre un Praetorian ; conserver des abris après les renforts.|Colonie agricole, tourelles et cocons lumineux.|Seuil de campagne déclenché par les dossiers initiaux.|HORIZON,GUIDE
TALI|Dossier: Tali|Tali opère sur Haestrom sous les tirs geth.|Zones d’ombre matérialisées ; détruire les obstacles, rejoindre Kal’Reegar puis aborder le Colosse par plusieurs routes.|Ruines quariènes, soleil dur, abris noirs.|Après Horizon.|TALI
ASSASSIN|Dossier: The Assassin|Thane poursuit une cible dans les tours Dantius.|Ascension par paliers et sauvetage de travailleurs ; terminer par une scène de recrutement après la cible.|Tour inachevée, verre et vide urbain.|Après Horizon.|ASSASSIN
JUSTICAR|Dossier: The Justicar|Samara enquête sur Illium.|Enquête au spatioport puis entrepôts Eclipse ; l’information sur le vaisseau débloque le recrutement.|Police asari, fret industriel et nuages chimiques.|Après Horizon.|JUSTICAR
COLLECTOR-SHIP|Collector Ship|Une exploration tourne à l’embuscade.|Arènes de plateformes en mouvement ; signaler les débarquements avant de retirer des zones de couverture.|Biomatière, couloirs alvéolés et plateformes suspendues.|Déclenchement de campagne à contrôler par états, pas par horloge réelle.|SHIP,GUIDE
IFF|Reaper IFF|L’IFF est récupéré sur un Moissonneur abandonné.|Exploration de laboratoire contaminé, poussée de husks puis cœur exposé ; réserver un temps de choix pour Legion.|Matière noire, câbles organiques et cœur de masse.|Point stratégique qui engage la séquence finale.|STOP
ABDUCTION|Attaque du Normandy — séquence Joker|Les Collecteurs enlèvent l’équipage.|Parcours de survie sans arsenal pour Joker ; EDI annonce des abris et ouvertures sûres.|Normandy envahi, portes déformées et silhouettes ennemies.|Après installation de l’IFF selon progression.|STORY,STOP
OMEGA4|Passage du relais Omega-4|Le relais conduit à la base des Collecteurs.|Séquence spatiale résolue par améliorations et états du vaisseau ; présenter les raisons des dégâts.|Épaves dans le vide, attaques Oculus et approche organique.|Départ volontaire après activation IFF.|GUIDE
INFILTRATION|Collector Base: Infiltration|L’équipe se divise autour d’un spécialiste.|Ordres de chef et technicien avant combat ; valves à activer pendant que le groupe protège le conduit.|Ventilations chaudes, ponts et panneaux de sécurité.|Compétence et loyauté des affectations influencent l’issue.|INFIL
LONG-WALK|Collector Base: The Long Walk|Une barrière biotique protège des essaims.|Déplacement du groupe dans un volume mobile ; intégrer escorte des survivants comme décision distincte.|Nuage d’insectes, dôme biotique et couloir de captifs.|Après infiltration ; délai de départ affecte les captifs.|WALK
FINAL|Collector Base: Final Battle|La confrontation termine la mission suicide.|Boss à points faibles et phases de retrait ; choix de la base après le combat, puis extraction.|Plateforme suspendue et Moissonneur humain en construction.|Composition du dernier groupe et défense arrière à résoudre séparément.|FINAL
LOY-GARRUS|Garrus: Eye for an Eye|Garrus recherche Sidonis.|Enquête, entrepôt et cadrage de tir ; laisser au joueur une vraie fenêtre de désescalade.|Secteur industriel puis belvédère de la Citadelle.|Garrus recruté et requête ouverte.|GARRUS
LOY-GRUNT|Grunt: Rite of Passage|Grunt entreprend un rite krogan.|Arena de survie à vagues et objectif de durée proposé ; duel de fin séparé de la performance face au dévoreur.|Arène de Tuchanka et monument rituel.|Grunt activé.|GRUNT
LOY-JACK|Jack: Subject Zero|Jack retourne au centre de Pragia.|Exploration des salles de souvenirs puis pose de charge ; permettre le silence après chaque découverte.|Jungle intrusive et ancien laboratoire.|Jack recrutée.|JACK
LOY-JACOB|Jacob: The Gift of Greatness|Le signal du Gernsback mène à Aeia.|Assembler les indices avant la confrontation ; protéger les survivants dans les combats intermédiaires.|Plage, épave, camp séparé et végétation.|Jacob recruté.|JACOB
LOY-MIRANDA|Miranda: The Prodigal|Miranda protège sa sœur sur Illium.|Combat de fret à convoyeurs ; preuves, confrontation de Niket puis choix de rencontre avec Oriana.|Terminal cargo, conteneurs et quais.|Miranda recrutée.|MIRANDA
LOY-MORDIN|Mordin: Old Blood|Mordin retrouve les travaux de Maelon.|Exploration médicale puis choix distincts sur Maelon et ses recherches ; bannir un résumé qui fusionne les deux.|Hôpital en ruine et laboratoire clandestin.|Mordin recruté.|MORDIN
LOY-SAMARA|Samara: The Ardat-Yakshi|Samara poursuit Morinth.|Enquête sociale, sélection d’indices et conversation à risque ; aucune fusillade obligatoire ajoutée.|Appartement de victime, club VIP et demeure de Morinth.|Samara recrutée ; substitution conditionnelle.|SAMARA
LOY-TALI|Tali: Treason|Tali est jugée par la Flotte.|Audience, fouille de l’Alarei puis verdict ; garder preuve, disculpation et loyauté comme variables distinctes.|Vaisseaux quariens, assemblée et pont contaminé.|Tali recrutée.|TREASON
LOY-THANE|Thane: Sins of the Father|Thane veut arrêter le contrat de Kolyat.|Interrogatoire puis filature par passerelles ; échec de suivi et réussite diplomatique ont des retours différents.|Citadelle, ponts intérieurs et appartement de la cible.|Thane recruté.|THANE
LOY-LEGION|Legion: A House Divided|Des geth hérétiques préparent un virus.|Piratage de défenses avant alerte ; tenir un terminal puis choisir destruction ou réécriture.|Station sans confort organique, serveurs et lignes vertes.|Legion activé ; vérifier calendrier de l’équipage.|LEGION
KASUMI-RECRUIT|Dossier: The Master Thief|Kasumi se recrute sur la Citadelle.|Rencontre d’alias au terminal public ; établir un canal privé avant d’ouvrir le cambriolage.|Publicité holographique et foule discrète.|Pack Kasumi / Legendary.|MISSIONS
KASUMI-HEIST|Kasumi: Stealing Memory|Le cambriolage vise le graybox de Keiji.|Préparer accès vocal, prélèvement et brouillage, puis sortir du coffre sous le feu.|Manoir de Bekenstein, réception, collection et terrasse.|Kasumi recrutée.|KASUMI
ZAEED-RECRUIT|Dossier: The Veteran|Zaeed se recrute sur Omega.|Entretien court présentant sa méthode et sa dette ; ouvrir la mission sans la confondre avec sa résolution.|Quai industriel et départ de mercenaires.|Pack Zaeed / Legendary.|MISSIONS
ZAEED-LOY|Zaeed: The Price of Revenge|Zaeed poursuit Vido dans une raffinerie.|Embranchements physiques entre secours et poursuite ; faire comprendre les conséquences avant leur verrouillage.|Feu industriel et passerelles de raffinerie.|Zaeed recruté ; loyauté et survie séparées.|ZAEED
SHADOW|Lair of the Shadow Broker|Shepard aide Liara à retrouver le Courtier.|Enquête, poursuite, duel Vasir, assaut extérieur puis boss yahg ; points de reprise entre grands segments.|Illium luxueuse puis coque sous orage d’Hagalaz.|DLC / Legendary ; Liara temporairement imposée.|SHADOW,EA-SHADOW
OVERLORD|Overlord — opération d’Aite|Un projet Cerberus échappe au contrôle.|Centre attaqué, exploration Hammerhead et deux stations débloquant Atlas ; progression suivie par verrouillages.|Antennes, vallée verte et laboratoires contaminés.|DLC / Legendary.|OVERLORD,ATLAS
OV-VULCAN|Overlord: Vulcan Station|Vulcan appartient aux installations d’Aite.|Alterner géothermie et mécas ; ouvrir l’accès local sans rendre Atlas disponible avant les autres verrous.|Basalte, vapeur, lave et réseaux Cerberus.|Opération Overlord ouverte.|ATLAS
OV-PROMETHEUS|Overlord: Prometheus Station|Prometheus est nécessaire pour ouvrir Atlas.|Approche d’une épave geth puis exploration intérieure ; utiliser un faisceau adverse comme contrainte d’abri.|Carcasse geth et modules industriels.|Opération Overlord ouverte.|ATLAS
OV-ATLAS|Overlord: Atlas Station|David Archer est relié au dispositif.|Dissocier données virtuelles, arrêt de transfert et décision concernant David ; dernier acte en solo contrôlé.|Superposition de réel et flux numériques verts.|Verrous de stations levés.|ATLAS
ARRIVAL|Arrival|Shepard détruit le relais Alpha.|Évasion de prison, artefact puis course au projet ; mission globalement solo avec compagnon temporaire local.|Prison batarienne, astéroïde et vue du relais.|DLC / Legendary ; contenu de fin d’arc.|ARRIVAL
''', priority='P0')

c.rows('side_quests', '''
NORMANDY-BRANDY|Normandy: Serrice Ice Brandy|Affectation de Chakwas.|Trouver une bouteille au marchand, confirmer sa remise et ouvrir la conversation de repos.|Objet ambré dans inventaire de quête.|Ne pas consommer comme objet de combat.|ASSIGN
NORMANDY-FBA|Normandy: FBA Couplings|Affectation de maintenance du Normandy.|Acheter une pièce, la remettre à l’ingénierie ; afficher le circuit de service complété.|Coupleurs industriels marqués pour la soute.||ASSIGN
NORMANDY-FOOD|Normandy: Special Ingredients|Affectation d’approvisionnement du mess.|Liste de courses courte ; mise à jour du mess après livraison.|Caisses alimentaires distinctes du ravitaillement d’armes.||ASSIGN
OMEGA-DATAPAD|Omega: Archangel: Datapad Recovered|Document associé à Archangel.|Retourner une preuve trouvée pendant le siège ; permettre consultation et remise séparées.|Datapad orange et icône de preuve.||ASSIGN
OMEGA-BARTENDER|Omega: Batarian Bartender|Affectation du bar d’Omega.|Enquête sociale sur la boisson ; offrir réponse verbale et confrontation via un embranchement visible.|Comptoir sombre et verre contaminé stylisé.||ASSIGN
OMEGA-ISH|Omega: Packages for Ish|Affectation de colis.|Circuit entre hubs avec inspection du destinataire ; distinguer un colis acquis d’un colis remis.|Colis et reçu numérique.||ASSIGN
OMEGA-QUARIAN|Omega: Struggling Quarian|Affectation d’aide à un quarien.|Séparer commerce, remise et aide au voyage ; supprimer la quête du journal seulement après résultat confirmé.|Étal de récupération et affiche de transit.||ASSIGN
OMEGA-PATRIARCH|Omega: The Patriarch|Affectation liée au Patriarche.|Organiser protection ou confrontation ; gérer la sortie du club et le retour au donneur.|Coin de bar isolé et couloir d’accès.||ASSIGN
OMEGA-DANIEL|Omega: The Professor: Missing Assistant|Mordin demande de retrouver Daniel.|Dialoguer avant de dégainer ; confirmer le retour à la clinique après négociation.|Zone civile de quarantaine.|Pendant recrutement de Mordin.|PROF
CIT-CRIME|Citadel: Crime in Progress|Affectation de Citadelle.|Interroger plusieurs témoins et inspecter la preuve avant accusation.|Marché public et objet porté disparu.||ASSIGN
CIT-ID|Citadel: Found Forged ID / False Positives|Deux intitulés reliés concernent des identités.|Unifier l’objet et la résolution dans un graphe ; aucune récompense doublée pour les alias du journal.|Papiers numériques et poste de douane.||ASSIGN
CIT-SUSHI|Citadel: Krogan Sushi|Affectation des poissons du Présidium.|Demande humoristique avec enquête au commerce ; ne pas créer de pêche de combat.|Aquarium et stand de restauration.||ASSIGN
CIT-COUNCIL|Citadel: The Council|Rencontre politique facultative.|Vérifier la composition importée du Conseil et la possibilité de réintégration ; interface de statut séparée.|Salle de conseil ou liaison holographique.|Dépend de ME1.|MISSIONS,SAVE
CIT-BAILEY|Citadel: Captain Bailey|Contact facultatif avec Bailey.|Débloquer le réseau C-Sec et le repère de bureau ; ne pas exiger un combat.|Bureau de contrôle des entrées.||MISSIONS
ILLIUM-HACK|Illium: Liara: System Hacking|Mission de piratage pour Liara.|Parcours de terminaux avec accès local et retour ; afficher les bornes déjà traitées.|Terminaux répartis dans Nos Astra.|À résoudre avant d’embrayer sur Shadow Broker pour préserver son contenu.|MISSIONS,SHADOW
ILLIUM-OBSERVER|Illium: Liara: The Observer|Enquête après le piratage.|Assembler des fragments de preuve dans un tableau ; autoriser la réponse de doute si l’identification n’est pas étayée.|Écrans de renseignements et dossier annoté.||MISSIONS
ILLIUM-CONRAD|Illium: Conrad Verner|Affectation du fan de Shepard.|Conversation de désescalade ; vérifier l’état importé sans présenter un bug historique comme un choix du joueur.|Bar et tenue de Conrad.||ASSIGN
ILLIUM-BLUE|Illium: Blue Rose of Illium|Affectation relationnelle à Illium.|Entretiens brefs avec points de vue distincts ; récompense sociale séparée d’un recrutement.|Couple séparé dans le hub.||ASSIGN
ILLIUM-GIANNA|Illium: Gianna Parasini|Rencontre avec Gianna sur Illium.|Repérer un marchand et retourner au contact ; l’identité de couverture ne doit pas être révélée par l’UI.|Table de café et boutique.|Variante de retrouvailles selon ME1.|ASSIGN
ILLIUM-INDENTURE|Illium: Indentured Service|Affectation sur un contrat de service.|Lire les conditions puis négocier une issue ; le contrat n’est pas un objet vendable.|Bureau, cliente quariène et documents.||ASSIGN
ILLIUM-MEDICAL|Illium: Medical Scans|Affectation de données médicales.|Traduire en autorisation ou refus de partage des données ; afficher la personne concernée.|Terminal de société biomédicale.||ASSIGN
ILLIUM-FAMILY|Illium: The Assassin: Salarian Family Data|Données retrouvées pendant le recrutement de Thane.|Chaîner découverte et restitution ; l’objet de quête reste disponible après la mission.|Datapad salarian dans une zone de chantier.||ASSIGN
ILLIUM-SMUGGLE|Illium: The Justicar: Smuggling Evidence|Preuve de contrebande à Illium.|Choisir destinataire des preuves et enregistrer la remise irréversible ; proposer un aperçu avant validation.|Document de fret et bureau d’enquête.||ASSIGN,JUSTICAR
ILLIUM-GOODS|Illium: The Justicar: Stolen Goods Found|Marchandises volées liées au dossier Samara.|Associer la découverte au bon commerçant ; ne pas imposer une revisite d’arène déjà fermée.|Caisse et identifiant commercial.||ASSIGN
ILLIUM-LOCKET|Illium: The Prodigal: Lost Locket Found|Objet familial de la mission Miranda.|Restitution au hub ; inspection sans consommation.|Petit pendentif avec icône propre.||ASSIGN
TUCH-MANIFOLD|Tuchanka: Combustion Manifold|Pièce mécanique recherchée sur Tuchanka.|Lier l’objet trouvé au mécanicien ; prévoir retour de dialogue après départ de mission.|Collecteur usé et atelier krogan.||ASSIGN
TUCH-PYJAK|Tuchanka: Killing Pyjaks|Affectation contre des pyjaks.|Mini-jeu de tourelle facultatif converti en choix de cibles chronométrées ; mode sans timing proposé.|Tour de garde et champs de nourriture.||ASSIGN
TUCH-SCOUT|Tuchanka: Old Blood: Missing Scout|Éclaireur lié à l’enquête Mordin.|Conversation dans l’hôpital puis compte rendu au clan ; distinguer retrouvé et revenu.|Krogan blessé dans une salle latérale.||ASSIGN
N7-RESEARCH|N7: Abandoned Research Station|Affectation N7.|Puzzle de station où chaque système rétabli ouvre un secteur mais alimente une nouvelle menace.|Salle machines et câbles interrompus.||ASSIGN
N7-MINE|N7: Abandoned Mine|Affectation N7.|Descente à éclairage limité ; maintenir un passage d’extraction libre quand des husks convergent.|Tunnels, ascenseur et foreuse immobile.||ASSIGN
N7-WEATHER|N7: Anomalous Weather Detected|Affectation N7.|Faire de l’anomalie une contrainte de visibilité ; baliser les approches et désactiver des émetteurs.|Brume électrique et relief rocheux.||ASSIGN
N7-ARCHEO|N7: Archeological Dig Site|Début d’une chaîne N7.|Fouiller les excavations sous pression mercenaire et récupérer une piste menant au Strontium Mule.|Fouilles, tentes et structures anciennes.||ASSIGN
N7-BLOOD-RELAY|N7: Blood Pack Communications Relay|Affectation menant à une base Blood Pack.|Repérer les relais en visibilité réduite ; sabotage de communication avant fuite.|Brouillard, balises et antenne.|Ouvre la piste de la base.|ASSIGN
N7-BLOOD-BASE|N7: Blood Pack Base|Affectation N7 du Blood Pack.|Assaut d’installation avec portes latérales ; prioriser le chef qui appelle les renforts.|Atelier armé et équipements krogan/vorcha.||ASSIGN
N7-BLUESUN|N7: Blue Suns Base|Étape de chaîne N7.|Entrée par cour puis bunker ; obtenir des informations sur les missiles après sécurisation.|Bunker mercenaire à codes bleus.||ASSIGN
N7-CAPTURED|N7: Captured Mining Facility|Affectation de mine occupée.|Libérer des points de travail sans tirer sur les équipements identifiés ; organiser les lignes de vue de deux galeries.|Machinerie et postes Eclipse.||ASSIGN
N7-ECLIPSE|N7: Eclipse Smuggling Depot|Affectation N7 Eclipse.|Course de sauvegarde de cargaisons : choisir les caisses à protéger et neutraliser les mécas destructeurs.|Dépôt ouvert, caisses numérotées et brûlures.||ASSIGN
N7-ENDANGERED|N7: Endangered Research Station|Affectation N7 de station menacée.|Rerouter l’énergie entre capteurs et protection ; validation montrant ce qui a été sauvé.|Panneaux de puissance et dôme de recherche.||ASSIGN
N7-HAHNE|N7: Hahne-Kedar Facility|Affectation liée aux mécas défaillants.|Traverser chaîne d’assemblage, couper l’origine des commandes puis laisser une route de sortie.|Usine de mécas et convoyeurs.||ASSIGN
N7-CRASH|N7: Imminent Ship Crash|Affectation N7 d’urgence.|Réparer la propulsion avant échéance proposée ; temps gelé pendant lecture indispensable.|Frégate inclinée, conduite et étoiles en mouvement.||ASSIGN
N7-JAVELIN|N7: Javelin Missiles Launched|Dernière étape d’une chaîne N7.|Infiltrer la commande et choisir un objectif de neutralisation ; indiquer l’irréversibilité finale.|Bunker et carte de trajectoires.|Chaîne de base Blue Suns.|ASSIGN
N7-OPERATIVE|N7: Lost Operative|Affectation N7 Cerberus.|Fouiller les journaux d’un poste silencieux et récupérer des données sans ajouter de vague artificielle.|Petit avant-poste abandonné.||ASSIGN
N7-CANYON|N7: Mining the Canyon|Affectation N7 de canyon.|Escorter un méca de travail via relais d’énergie ; éviter le blocage de trajectoire par le groupe.|Canyon et minerai bleu-gris.||ASSIGN
N7-ESTEVANICO|N7: MSV Estevanico|Affectation d’exploration d’épave.|Parcours de coque instable avec points d’appui clairement marqués ; proposer une option sans réflexe.|Épave suspendue dans un relief désertique.||ASSIGN
N7-STRONTIUM|N7: MSV Strontium Mule|Étape d’une chaîne N7.|Aborder le cargo, débloquer ses ponts et identifier la piste de la base Blue Suns.|Couloirs de cargo et soute étroite.||ASSIGN
N7-QUARIAN|N7: Quarian Crash Site|Affectation de secours.|Protéger un survivant jusqu’au départ de sa navette ; éloigner les charges animales de sa position.|Cratère, débris quariens et navette de secours.||ASSIGN
N7-WRECK|N7: Wrecked Merchant Freighter|Début de chaîne des mécas défaillants.|Enquêter entre les débris et survivre aux machines encore actives ; rapport mène à la station.|Cargo fracturé et modules LOKI.||ASSIGN
CRASH-SITE|Normandy Crash Site|DLC de retour sur le site du Normandy.|Exploration commémorative sans ennemi ajouté ; poser le mémorial et retrouver des traces de l’équipage.|Neige, morceaux du SR-1 et plaque de souvenir.|DLC / Legendary.|ASSIGN,EA-DLC
FIRE-ROSALIE|Project Firewalker: Rosalie Lost|Début du pack Hammerhead.|Tutoriel de saut, vol stationnaire et extraction par faisceau ; aucun atelier d’amélioration inventé comme canon.|Site de recherche et Hammerhead posé.|DLC / Legendary.|FIRE-START
FIRE-SURVEY|Project Firewalker: Survey Sites Located|Affectation du pack Firewalker.|Parcours de collecte à embranchements ; distinguer parcours sûr et détour de minerais.|Terrasses minérales et balises d’étude.|Hammerhead obtenu.|FIRE
FIRE-COLD|Project Firewalker: Geth Incursion|Le froid menace le moteur sur Lattesh.|Courte expédition à jauge thermique ; chaque sonde réchauffe le véhicule, l’échec devient retour partiel.|Canyon glacé et colonnes rouges de sondes.|Hammerhead obtenu.|FIRE-COLD
FIRE-VOLCANO|Project Firewalker: Volcano Station|Affectation du pack Firewalker.|Enchaîner plateformes et fuite d’une zone volcanique ; conserver une trajectoire sûre lisible.|Lave et station en surchauffe.|Hammerhead obtenu.|FIRE
FIRE-PROTHEAN|Project Firewalker: Prothean Site|Conclusion de recherche du pack.|Passer de véhicule à salle d’exploration ; signaler les éléments scientifiques sans prétendre connaître leur usage.|Ruines et artefact suspendu.|Autres pistes du pack avancées.|FIRE
''')

c.rows('worlds', '''
OMEGA|Omega|Station principale des Systèmes Terminus.|Hub vertical compact avec secteurs sociaux et accès vers deux recrutements ; risque local annoncé avant transition.|Métal usé, éclairages orange, néons et foule hétérogène.||OMEGA
ILLIUM|Illium / Nos Astra|Hub des recrutements Samara et Thane.|Centre commerçant à terrasses reliées ; journal de pistes par bâtiment et non par écran unique.|Tours lisses, verre, soleil chaud et transports aériens.||NOSASTRA
CITADEL|Citadelle — secteur ME2|Hub de missions et de recrutement de Kasumi.|Quartier de transit sur plusieurs étages, marché et bureaux ; itinéraires courts entre recherches.|Architecture blanche, lueurs bleues et jardins aperçus.||MISSIONS
TUCHANKA|Tuchanka|Lieu des loyautés de Grunt et Mordin.|Hub de clan conduisant à une arène et un hôpital ; routes de mission distinctes.|Ruines, ciel sale et installations krogan.||GRUNT,MORDIN
HORIZON|Horizon|Colonie visée par les Collecteurs.|Carte en quartiers dont la défense centrale demeure le point d’orientation.|Champs agricoles, préfabriqués et défenses orbitales.||HORIZON
FREEDOM|Freedom’s Progress|Colonie humaine désertée.|Petit réseau d’habitations menant à la pièce de Veetor ; vie interrompue visible dans les détails.|Éclairage froid, habitations et escaliers extérieurs.||FREEDOM
KORLUS|Korlus|Monde de récupération du dossier Okeer.|Labyrinthe de carcasses avec niveaux lisibles ; ne pas confondre décor de coque et sol praticable.|Fer rouillé, moteurs géants et brouillard industriel.||WARLORD
HAESTROM|Haestrom|Ancienne colonie quariène exposée à son soleil.|Ombre comme ressource de déplacement ; obstacles d’abri lisibles en caméra fixe.|Pierre claire, ombres dures et ruines geth.||TALI
PRAGIA|Pragia|Lieu du centre d’enfance de Jack.|Exploration émotionnelle par salles et raccourcis ; combat périphérique autour des souvenirs.|Pluie, jungle et béton laboratoire.||JACK
AEIA|2175 Aeia|Monde du crash du Hugo Gernsback.|Bande côtière en trois zones : épave, survivants, autorité ; indexer chaque preuve par provenance.|Mer, végétation tropicale et camp improvisé.||JACOB
BEKENSTEIN|Bekenstein|Lieu du manoir de Hock.|Hub fermé de réception donnant vers jardin, sécurité, coffre et terrasse de fuite.|Villas luxueuses et skyline nocturne.||KASUMI
HAGALAZ|Hagalaz|La base du Courtier s’y dissimule.|Coque mobile sous orage ; cycles de vent et antennes comme couverts temporaires.|Nuages tourbillonnants, plaques métalliques et éclairs.||SHADOW
AITE|Aite|Monde de Project Overlord.|Vallée Hammerhead reliant des stations de recherche ; chaque installation porte un code visuel propre.|Prairies, rochers, antennes et zones volcaniques.||ATLAS
ARATOHT|Aratoht|Prison de départ d’Arrival.|Niveau solo avec route furtive et route d’alerte ; navigation dans conduits et cellules.|Roche, prison batarienne et éclairage ambré.||ARRIVAL
BAHAK|Bahak — système et projet|Le relais Alpha est détruit avec le système.|Carte de conséquence narrative ; ne pas traiter le système comme zone encore visitable après Arrival.|Astéroïde, relais et axe de collision.|Après événement, destination verrouillée définitivement.|ARRIVAL
LATTESH|Lattesh|Planète froide de Firewalker.|Circuit de sondes en véhicule ; planifier le détour avant de quitter une source de chaleur.|Glace bleue, canyon et balises rouges.||FIRE-COLD
ZEONA|Zeona|Site de récupération du Hammerhead.|Terrain tutoriel sans piège létal non annoncé ; premiers prélèvements à faible pression.|Roche et installation de recherche.|Firewalker.|FIRE-START
HERETIC|Station hérétique|Le virus geth y est préparé.|Stations de serveur reliées par couloirs ; réseau technique visible sans espaces sociaux organiques.|Noir, vert et surfaces fonctionnelles.||LEGION
COLLECTOR-BASE|Base des Collecteurs|Destination de la mission suicide.|Macro-zone terminale à séquences verrouillées ; chaque transition conserve les pertes d’équipe.|Biomatière, tubes et vide autour de la structure.||INFIL,WALK,FINAL
''')

c.rows('zones', '''
NORMANDY-CIC|Normandy SR-2 — CIC|Centre de commandement de Shepard.|Boucle briefing, carte et contacts ; réserver la caméra d’action aux incursions narratives.|Passerelles, carte holographique et postes Cerberus.||STORY
NORMANDY-CABIN|Normandy — cabine de Shepard|Espace personnel du commandant.|Équipement, messages personnels et souvenirs avec interaction proche du lit ou du bureau ; aucune jauge combat.|Bois sombre, baie spatiale et objets personnels.||GUIDE
NORMANDY-LAB|Normandy — laboratoire|Mordin travaille au laboratoire.|Regrouper recherche, consultation de ressources et conversation dans des points d’interaction séparés.|Tables claires, instruments et écran de recherche.||PROF,UPGRADE
NORMANDY-ENGINE|Normandy — ingénierie|L’ingénierie accueille plusieurs membres d’équipage.|Connecter passerelle technique, cœur et niches d’équipiers ; poser l’audio ambiant sous la parole.|Cœur bleu et réseaux de conduites.||ASSIGN,SQUAD
NORMANDY-MESS|Normandy — mess et infirmerie|Vie quotidienne et soins à bord.|Deux zones calmes permettant scènes d’équipage et traitement du medi-gel sans ouvrir le menu de combat.|Cuisine, tables et lits médicaux.||ASSIGN
AFTERLIFE|Afterlife|Club d’Aria sur Omega.|Plan social en deux niveaux ; l’accès VIP appartient au graphe d’enquête de Morinth.|Néons orange, bar, scène et banquette haute.||OMEGA,SAMARA
OMEGA-MARKET|Omega — marché|Hub de marchands et demandes locales.|Parcours court entre vendeurs ; afficher le nom de boutique à l’approche avec filtre de quête.|Étal de récupération, enseignes et canalisations.||MERCHANTS
OMEGA-CLINIC|Omega — clinique de Mordin|Mordin soigne la quarantaine.|Sanctuaire de conversation séparé des combats ; traiter les arrivées de civils après les décisions.|Lumière blanche médicale au milieu du brun industriel.||PROF
OMEGA-VENT|Omega — contrôle de ventilation|La cure passe par la ventilation.|Arène en éventail avec deux consoles ; l’activation nécessite une interruption de menace plutôt qu’un long canal aveugle.|Ventilateurs, conduits et passerelles.||PROF
ARCHANGEL-HOUSE|Omega — refuge d’Archangel|Le refuge est assiégé.|Deux étages et un pont ; l’arrière-garde peut fermer les accès pendant qu’un tireur protège le balcon.|Murs éventrés et sacs de couverture.||ARCHANGEL
PURGATORY|Purgatory — blocs de détention|Jack est retenue dans le vaisseau prison.|Succession inspection, cellules, couloirs cassés et commandement ; les portes changent de logique après alerte.|Cellules transparentes et générateurs blindés.||CONVICT
KORLUS-LAB|Korlus — laboratoire d’Okeer|La cuve de Grunt y est récupérée.|Boss à renforts limités ; cuve protégée du ciblage et du loot de combat.|Cuves vertes, métal récupéré et plateforme de commande.||WARLORD
HORIZON-TURRETS|Horizon — défenses de colonie|Le combat culmine aux défenses.|Anneau de couverture où le Praetorian menace progressivement les abris ; laisser une échappatoire continue.|Canons et hangar agricole.||HORIZON
DANTIUS|Tours Dantius|Lieu du recrutement de Thane.|Ascension en trois étages et pont aérien ; l’ascenseur sert de respiration entre arènes.|Verre, charpente blanche et vide urbain.||ASSASSIN
ILLIUM-DOCK|Nos Astra — spatioport|Samara enquête au spatioport.|Boucle police, quai et entrepôt ; nouvelles preuves ouvrent les dialogues sans recharger toute la carte.|Docks, ruban de police et conteneurs.||JUSTICAR
ILLIUM-CARGO|Illium — terminal de fret|La loyauté de Miranda y conduit.|Convoyeurs changeant l’angle de tir ; étages visibles avant de choisir une route.|Conteneurs et plateformes mécanisées.||MIRANDA
HAESTROM-COURT|Haestrom — cour du Colosse|Les geth protègent l’accès à Tali.|Trois routes d’abri ; point de soutien de Kal’Reegar et console finale distincts.|Cour de ruines et passerelle centrale.||TALI
COLLECTOR-SHIP|Vaisseau des Collecteurs|Lieu de l’embuscade.|Plateformes suspendues en poches de combat ; télégraphier chaque arrivée de segment.|Chitine sombre et lueurs orange.||SHIP
DERELICT|Moissonneur abandonné|Destination de l’opération IFF.|Couloir de laboratoire puis plate-forme du cœur ; contrôler les grappes de husks par entrées annoncées.|Architecture organique noire et câbles rouges.||STOP
TUCH-HOSPITAL|Tuchanka — hôpital de Maelon|Le laboratoire de Maelon se trouve dans des ruines.|Salles latérales de témoignages avant les objectifs ; combat de front gardant une route de retraite.|Béton cassé, lits et instruments improvisés.||MORDIN
TUCH-RITE|Tuchanka — arène du rite|Grunt y réalise son passage.|Arène ouverte à phases ; pylône de déclenchement protégé des tirs involontaires.|Stèle, cercle de pierre et sable.||GRUNT
ALAREI|Alarei|Vaisseau inspecté pendant le procès de Tali.|Explorer ponts geth puis salle de données ; preuves conservées même si l’équipe se replie.|Vaisseau quarian, écrans d’urgence et passerelles.||TREASON
RAYYA|Flotte migrante — salle d’audience|Le procès de Tali s’y déroule.|Disposition circulaire des amiraux ; caméra accompagne l’interlocuteur et garde le verdict visible.|Passerelles quariènes et pupitres.|Nom exact du vaisseau à revérifier visuellement avant art final.|TREASON
PRAGIA-CENTER|Pragia — centre Teltin|Ancien centre de Cerberus lié à Jack.|Carte mémorielle avec salles repérées par fonction ; ordonner le récit sans longues scènes forcées.|Lits, vitres de contrôle et végétation intrusive.||JACK
AEIA-CAMP|Aeia — camp du Gernsback|Les survivants y sont retrouvés.|Positionner preuves et personnes en deux circuits pour éviter une accusation avant enquête.|Tentes, épave et barrières de fortune.||JACOB
CIT-FACTORY|Citadelle — secteur de Fade|Garrus y piste Sidonis.|Arènes de manutention et ascenseurs ; revenir à une scène sociale clairement désarmée.|Bras de manutention, caisses et garde-corps.||GARRUS
CIT-CATWALK|Citadelle — passerelles de filature|Thane suit la cible de Kolyat.|Chemin parallèle avec fenêtres de rapport ; grand marqueur de cible et mode sans pression proposé.|Passerelles au-dessus des rues.||THANE
HOCK-MANSION|Manoir Hock — réception|Kasumi infiltre la propriété.|Salle sociale avec itinéraires courts vers indices de sécurité ; portrait d’identité de couverture.|Marbre, œuvres, jardin et lumière nocturne.||KASUMI
HOCK-VAULT|Manoir Hock — coffre|Le graybox est dans la collection.|Zone d’examen avant embuscade ; armes récupérées par déclencheur de préparation visible.|Collection hétéroclite, socles et coffre technologique.||KASUMI
VASIR-ROOF|Illium — poursuite de Vasir|Vasir fuit puis affronte Shepard.|Poursuite de véhicule convertie en sélection de route, puis duel à arcs de charge.|Terrasse urbaine, véhicules et bassins.||SHADOW
HAGALAZ-HULL|Hagalaz — coque extérieure|L’assaut passe par l’extérieur du vaisseau.|Parcours sous tempête ; condensateurs utilisables contre les renforts avec annonce du danger.|Coque courbe, antennes et flux de vent.||SHADOW
BROKER-OFFICE|Bureau du Courtier|Le Courtier yahg y est affronté.|Boss concentré sur alternance distance/contact ; protéger la lisibilité du bouclier et de Liara.|Grande salle sombre, bureau brisé et écrans suspendus.||SHADOW
ATLAS-VR|Atlas — environnement virtuel|Le dispositif expose Shepard à une réalité virtuelle.|Superposer un plan numérique aux couloirs physiques ; restaurer la vision réelle par étape de contrôle.|Grille verte, surfaces fragmentées et signes de transfert.||ATLAS
ARRIVAL-PRISON|Aratoht — prison|Shepard y délivre Kenson.|Solo furtif : cônes de vision explicites et raccourcis ; l’alerte ne bloque pas la mission.|Cellules, passerelles et circuits électriques.||ARRIVAL
ARRIVAL-PROJECT|Arrival — installation de l’astéroïde|Le projet vise le relais Alpha.|Arène de défense puis reroutage et plateforme extérieure ; compteur lisible en unités de jeu proposées.|Artefact, propulseurs et passerelles sous vide.||ARRIVAL
COLLECTOR-VENTS|Base — conduits d’infiltration|Un spécialiste traverse les conduits.|Valves comme objectifs tactiques ; jauge thermique gelée pendant un menu essentiel.|Tuyaux organiques et panneaux verts.||INFIL
COLLECTOR-PODS|Base — pods et essaims|Des captifs sont maintenus dans la base.|Zone de révélations puis marche sous barrière ; appliquer le résultat des délais une seule fois.|Pods translucides, condensation et essaims.||WALK
COLLECTOR-CORE|Base — chambre finale|Lieu du Moissonneur humain.|Plateforme en plusieurs bandes ; les mains du boss annoncent les zones de frappe.|Structure inachevée et tubes d’alimentation.||FINAL
''')

c.rows('lore', '''
CERBERUS|Cerberus et alliance circonstancielle|Cerberus finance la mission de Shepard.|Glossaire à deux colonnes : objectif affiché et informations obtenues ; ne jamais confondre allégeance jouée et approbation.|Logo Cerberus comme repère documentaire.||STORY
LAZARUS|Projet Lazarus|Le retour de Shepard ouvre ME2.|Frise courte du réveil avec zones d’incertitude ; ne pas déduire une immortalité jouable.|Silhouette médicale et protocole de reconstruction.||GUIDE
COLLECTORS|Collecteurs|Ils enlèvent des colonies humaines.|Bestiaire et dossier d’enquête progressifs ; informations avancées masquées avant révélation.|Chitine, essaims et technologie organique.||COLLECTOR
COLLECTOR-ORIGIN|Origine des Collecteurs|La campagne révèle leur lien prothéen.|Entrée de codex débloquée par le vaisseau ; conserver l’ordre de révélation.|Schéma symbolique d’altération, sans anatomie inventée.||SHIP
HARBINGER|Harbinger et possession|Harbinger agit par des Collecteurs.|Décrire rôle de contrôle dans le codex ; adaptation par transfert de priorité ennemie.|Halo orange sur l’hôte et faisceau de liaison.||COLLECTOR
SEEKERS|Essaims de Seeker|Les essaims participent aux enlèvements.|Jauge de menace de zone liée au dispositif de protection ; ne pas donner d’origine précise non sourcée.|Nuage d’insectes à contour animé.||WALK
GENOPHAGE|Génophage et recherche de Maelon|La loyauté de Mordin interroge ces recherches.|Codex avec témoignages séparés et état de données ; conserver les contradictions des interlocuteurs.|Documents médicaux et symboles krogan.||MORDIN
JUSTICAR|Code des Justicari|Le code guide Samara.|Contrainte narrative affichée dans son dossier ; ne pas convertir tout désaccord en hostilité automatique.|Tablette de serment et portrait de Samara.||JUSTICAR
ARDAT|Ardat-Yakshi et Morinth|Morinth est l’Ardat-Yakshi recherchée.|Entrée débloquée lors de l’enquête ; séparer condition biologique et responsabilité individuelle.|Dossier clinique sobre et arbre familial partiel.||SAMARA
HERETICS|Geth hérétiques|Legion décrit une divergence geth.|Interface de décision présentant destruction et réécriture comme conséquences différentes.|Nœuds de réseau avec deux chemins.||LEGION
FLOTILLA|Flotte migrante et procès|Le procès reflète des conflits quariens.|Cartographier les arguments d’amiraux sans figer tous les quariens dans une seule position.|Schéma de flotte et pupitres.||TREASON
BROKER|Réseau du Courtier|Liara accède à son centre de renseignements.|Dossiers facultatifs à provenances claires ; les informations privées ne deviennent pas une vue omnisciente de tout événement.|Écrans, index et segments occultés.||EA-SHADOW
INDOCTRINATION|Endoctrinement dans Arrival|Kenson a subi l’influence de l’artefact.|Marquer les indices rétrospectifs dans un codex déverrouillé ; conserver le doute pendant l’enquête.|Artefact sombre et interférences de signal.||ARRIVAL
NO-MULTI|Périmètre solo de ME2|La collection présente le contenu solo ME2.|Exclure les personnages multijoueurs de ME3 des tables de recrutement ; un mode arène éventuel sera original.|Étiquette de module et filtres de campagne.||EA-LE
''')

# Chaque archétype a sa propre attaque d'adaptation, son anticipation et sa réponse.
enemy_data='''
BS-TROOPER|Blue Suns Trooper|Mercenaire Blue Suns.|Rafale croisée|Vise la dernière position connue ; un déplacement latéral ou un écran biotique rompt le tir.|Armure bleue, fusil et visière rectiligne.|ENEMIES
BS-HEAVY|Blue Suns Heavy|Mercenaire Blue Suns.|Roquette annoncée|Pose un marqueur au sol avant départ ; quitter le couvert ciblé ou interrompre le tireur.|Tube de roquette haut sur l’épaule.|ENEMIES
BS-CENTURION|Blue Suns Centurion|Mercenaire Blue Suns.|Ordre de concentration|Désigne un allié à harceler ; casser sa ligne de vue annule le bonus d’équipe proposé.|Armure bleue renforcée et signe d’officier.|ENEMIES
BS-LEGION|Blue Suns Legionnaire|Mercenaire Blue Suns.|Avancée sous bouclier|Progresse d’un abri à l’autre ; Surcharge ouvre une fenêtre de recul.|Silhouette blindée et forte protection frontale.|ENEMIES
EC-TROOPER|Eclipse Trooper|Mercenaire Eclipse.|Tir de maintien|Couvre un corridor ; le détour latéral force un changement de position coûteux.|Armure jaune et noire, arme légère.|ENEMIES
EC-HEAVY|Eclipse Heavy|Mercenaire Eclipse.|Salve de zone|Prépare une explosion derrière l’abri ; le joueur peut tirer sur le projectile ou sortir de la zone.|Lanceur et bandes jaunes larges.|ENEMIES
EC-ENGINEER|Eclipse Engineer|Ingénieur Eclipse.|Déploiement de drone|Un point de construction apparaît ; interrompre la pose ou pirater le drone déjà actif.|Omni-outil et équipement jaune technique.|ENEMIES
EC-VANGUARD|Eclipse Vanguard|Biotique Eclipse.|Poussée de proximité|Chargement des mains puis projection en cône ; se placer derrière ou casser sa barrière.|Halo biotique et posture penchée.|ENEMIES
EC-COMMANDO|Eclipse Commando|Combattante Eclipse.|Barrière offensive|Alterne protection et décharge ; le pouvoir anti-barrière permet un contre pendant la récupération.|Asari en armure jaune, bulle bleu-violet.|ENEMIES
BP-TROOPER|Blood Pack Trooper|Combattant Blood Pack.|Ruée désordonnée|Attaque par courtes courses ; contrôler les premières lignes empêche l’encerclement.|Vorcha rougeâtre et plaques mal ajustées.|ENEMIES
BP-WARRIOR|Blood Pack Warrior|Krogan du Blood Pack.|Charge lourde|Pied planté et tête baissée annoncent l’assaut ; esquive latérale puis attaque du dos.|Grande silhouette krogan rouge sombre.|ENEMIES
BP-PYRO|Blood Pack Pyro|Unité incendiaire Blood Pack.|Balayage de flammes|Trace un arc continu de portée courte ; sortir du cône et viser le réservoir après anticipation.|Réservoir dorsal et brûleur.|ENEMIES
BP-BOOM|Blood Pack Boom-Squad|Unité Blood Pack.|Tir explosif|Prend appui avant d’arroser une bande de terrain ; couverts épais ou déplacement interrompent l’exposition.|Lanceur volumineux et appui large.|ENEMIES
LOKI|LOKI Mech|Méca de sécurité.|Acquisition lente|Laser bref puis tir ; le gel ou piratage interrompt l’acquisition.|Humanoïde blanc, articulations fines et optique rouge.|ENEMIES
FENRIS|FENRIS Mech|Méca quadrupède.|Bond de morsure|Pattes arrière comprimées puis bond ; repousser ou esquiver, éviter de camper le même abri.|Châssis canin métallique.|ENEMIES
YMIR|YMIR Mech|Méca lourd.|Saturation alternée|Alterner mitrailleuse et roquette ; l’optique passe au rouge avant la salve de zone.|Buste massif, bras d’armes et pas lourds.|ENEMIES
GETH-TROOPER|Geth Trooper|Infanterie geth.|Rafale calculée|Tir à intervalle régulier ; surcharge puis déplacement empêchent l’alignement de plusieurs unités.|Optique unique et châssis synthétique fin.|TALI
GETH-ROCKET|Geth Rocket Trooper|Unité geth à roquettes.|Verrou de cible|Un trait annonce l’axe ; rompre le verrou ou contourner par l’abri opposé.|Tube d’arme et lumière d’optique nette.|TALI
GETH-HUNTER|Geth Hunter|Unité geth camouflée.|Approche masquée|Brève distorsion au départ, pas détectables et silhouette au tir ; révéler par effet de zone.|Châssis sombre semi-transparent, optique temporaire.|TALI
GETH-DESTROYER|Geth Destroyer|Unité geth rencontrée à Haestrom.|Pression rapprochée|Réduit l’espace avec une menace courte ; geler la progression après avoir retiré ses défenses.|Geth robuste et arme à effet continu.|TALI
GETH-PRIME|Geth Prime|Unité geth lourde.|Commandement de réseau|Une impulsion renforce ses proches ; éliminer les soutiens avant d’exposer le noyau.|Grand châssis rouge et blanc, large torse.|TALI
GETH-COLOSSUS|Geth Colossus|Boss geth de Haestrom.|Canon et réparation|Charge lumineuse visible, tir sur bande puis phase de réparation ; flanquer pour stopper la reprise.|Quadrupède colossal sur cour surélevée.|TALI
GETH-DRONE|Geth Recon Drone|Drone rencontré à Haestrom.|Passage aérien|Annonce son trajet par moteur et ombre ; tire en ligne puis s’expose au retour.|Petit drone volant et optique.|TALI
HUSK|Husk|Créature des rencontres Collecteurs.|Agrippement de groupe|Approche en meute ; pousser le premier brise temporairement la chaîne d’assaut.|Humanoïde cybernétique bleu, posture courbée.|COLLECTOR
ABOMINATION|Abomination|Variante du bestiaire Collecteurs.|Explosion de proximité|Lueur et contraction signalent l’explosion ; éloigner la cible avant de l’éliminer.|Husk rouge-orangé très contrasté.|COLLECTOR
SCION|Scion|Unité lourde du bestiaire Collecteurs.|Onde au sol|Bras et corps chargent une ligne d’onde ; changer de bande ou stopper la préparation.|Masse tordue, bras-canon et silhouette asymétrique.|COLLECTOR
COLLECTOR-DRONE|Collector Drone|Infanterie des Collecteurs.|Rafale organique|Tir depuis couvert et repositionnement ailé ; les tirs de suppression bloquent le vol proposé.|Chitine brune, aile repliée et arme organique.|COLLECTOR
COLLECTOR-GUARDIAN|Collector Guardian|Unité protectrice des Collecteurs.|Écran de passage|Place une protection sur une voie ; contourner ou employer un pouvoir anti-barrière.|Silhouette de Collecteur et lueur de projection.|COLLECTOR
COLLECTOR-ASSASSIN|Collector Assassin|Tireur des Collecteurs.|Rayon de précision|Canal lumineux fixe une cible ; passer derrière un couvert épais ou interrompre le canal.|Arme-faisceau et visée stable.|COLLECTOR
HARBINGER|Collecteur possédé par Harbinger|Harbinger prend le contrôle d’hôtes.|Transfert d’autorité|L’hôte brûle puis avance ; neutraliser ses soutiens limite les prochaines prises de contrôle.|Chitine embrasée et tête éclairée.|COLLECTOR
PRAETORIAN|Praetorian|Boss volant des rencontres Collecteurs.|Poursuite et atterrissage|Faisceau pendant poursuite, onde autour de l’atterrissage ; maintenir un pilier entre lui et la cible puis reculer.|Carapace noire, membres pendants, plusieurs visages regroupés.|PRAETORIAN
OCULUS|Oculus|Drone des abords de la base Collecteur.|Percée de coque|Entrée annoncée, balayage puis recul ; le groupe rejoint le couvert opposé à son iris.|Sphère mécanique à iris central.|COLLECTOR
HUMAN-REAPER|Moissonneur humain|Boss final de ME2.|Bras et tubes|Attaques de bandes puis exposition de points faibles ; détruire des alimentations sans confondre décor et cibles.|Immense torse humanoïde métallique, yeux et tubes éclairés.|FINAL
VARRREN|Varren|Faune hostile de ME2.|Morsure en tenaille|Deux approches décalées ; garde au contact ou projection empêchent d’être encerclé.|Quadrupède trapu, gueule large, peau écailleuse.|PROF
THRESHER|Dévoreur du rite|Rencontré lors du rite de Grunt.|Émergence et projection|Sol secoué avant sortie ; dissocier esquive et visée puis garder une marge de déplacement.|Ver géant, bouche segmentée et poussière.|GRUNT
GUNSHIP|Aéronef de combat|Des aéronefs servent de boss.|Passe de mitraillage|Ombre annonçant le secteur balayé ; changer d’abri puis attaquer pendant le demi-tour.|Coque de gunship, canons et moteurs latéraux.|ARCHANGEL,KASUMI
BROKER-AGENT|Shadow Broker Agent|Unité du réseau du Courtier.|Grenade d’éblouissement|Objet lancé et icône de délai ; se couvrir ou viser le lanceur avant émission.|Armure sombre et visière opaque.|SHADOW
BROKER-VANGUARD|Shadow Broker Vanguard|Biotique du Courtier.|Charge oblique|Marqueur d’arrivée avant déplacement ; esquive latérale et contre anti-barrière.|Armure noire et énergie bleue.|SHADOW
VASIR|Tela Vasir — boss|Vasir combat Shepard et Liara.|Chaîne de charges|Tracer plusieurs segments avant résolution ; casser une phase en exploitant sa récupération.|Asari en armure, traînée biotique et posture d’élan.|SHADOW
BROKER|Courtier de l’Ombre — yahg|Le Courtier affronté est un yahg.|Bouclier et coup lourd|Alterner tir, mêlée et coordination de Liara ; le côté protégé reste signalé.|Yahg massif, yeux multiples et bouclier de grande taille.|SHADOW
OVERLORD|Dispositif VI Overlord|Le dispositif tente un transfert.|Transfert par relais|Nœuds activés successivement ; prioriser le relais qui annonce l’envoi sans attaquer la personne captive.|Visage numérique vert et câbles de laboratoire.|ATLAS
PROJECT-GUARD|Project Guard|Garde hostile dans Arrival.|Verrouillage de couloir|Avance après une grenade ; l’interface avertit du changement de couverture.|Tenue technique et arme Cerberus.|ARRIVAL
PROJECT-PYRO|Project Pyro|Unité incendiaire d’Arrival.|Nettoyage de sas|Brûleur le long d’un corridor ; détour court disponible et réservoir exposé après tir.|Tenue de projet, réservoir et flammes.|ARRIVAL
PRISON-GUARD|Prison Guard|Garde batarien d’Arrival.|Alerte par témoin|Observe, enquête puis transmet ; neutraliser la transmission ou choisir l’affrontement.|Batarien armé dans la prison.|ARRIVAL
'''
for line in enemy_data.strip().splitlines():
    key,name,fact,move,rule,look,src=line.split('|')
    eid=c.add('enemies',key,name,fact,f'Archétype à adapter autour de « {move} ». Donner un rôle distinct dans les compositions de rencontre.',gameplay=rule,visual=look,source=src,reference='Bestiaire ME2 / rencontres associées')
    c.original('enemy_moves',key, name+' — '+move,rule,look+' Ajouter un télégraphe de préparation indépendant du décor.',dependencies=[eid],acceptance=f'En duel puis en groupe, « {move} » laisse une réponse observable ; l’impact ne précède jamais son télégraphe et l’interruption n’exécute pas les dégâts annulés.')

c.rows('weapons','''
PREDATOR|M-3 Predator|Pistolet de ME2.|Arme d’appoint fiable, coût ATB faible ; recharger choisit une pause courte plutôt qu’une action offensive.|Pistolet compact noir/gris.||WEAPONS
CARNIFEX|M-6 Carnifex|Pistolet obtenu auprès de Mordin.|Tir lourd ciblé, avantage proposé sur protection dure et réserve réduite.|Canon massif et poignée courte.||PROF
PHALANX|M-5 Phalanx|Pistolet de contenu additionnel ME2.|Visée précise préparée : récompenser une cible marquée par un allié.|Pistolet technique à point de visée distinct.||EA-DLC
SHURIKEN|M-4 Shuriken|Pistolet mitrailleur de ME2.|Rafale courte, bon maintien à portée moyenne ; efficacité réduite en tir précipité.|Châssis compact et canon court.||WEAPONS
TEMPEST|M-9 Tempest|Arme récupérable sur Haestrom.|Arrosage rapide qui consomme les clips ; suppression proposée contre cibles légères.|Pistolet mitrailleur large et chargeur proéminent.||TALI
LOCUST|M-12 Locust|Arme de la mission Kasumi.|Tir compact précis ; rôle de solution moyenne portée pour spécialistes de pouvoirs.|Corps allongé noir et crosse courte.||LOCUST,KASUMI
AVENGER|M-8 Avenger|Fusil d’assaut de ME2.|Référence d’équilibrage : rafale, tir mobile et rechargement moyens, sans bonus de niche.|Fusil N7 reconnaissable à profil central.||WEAPONS
VINDICATOR|M-15 Vindicator|Fusil à rafales.|Rafale concentrée après préparation courte ; perdre la cible disperse le bénéfice.|Canon fin et viseur supérieur.||VINDICATOR
REVENANT|M-76 Revenant|Arme du groupe des fusils d’assaut.|Suppression prolongée avec coût de mobilité ; la chauffe visuelle anticipe le changement de clip.|Fusil lourd et large caisson.||WEAPONS
MATTOCK|M-96 Mattock|Fusil de contenu additionnel.|Tirs semi-automatiques à budget ATB ajustable ; récompense les fenêtres sur point faible.|Long fût et silhouette de fusil de précision intermédiaire.||EA-DLC
GETH-RIFLE|Geth Pulse Rifle|Fusil geth trouvable à Haestrom.|Flux de projectiles lumineux, avantage proposé sur boucliers ; trajectoires lisibles en 2D.|Arme organomécanique et tubes bleutés.|Condition d’obtention varie selon édition/difficulté à vérifier.|TALI
COLLECTOR-RIFLE|Collector Assault Rifle|Fusil associé aux Collecteurs.|Rafale organique stable ; conserver une identité sonore propre sans réutiliser celle des armes humaines.|Chitine et géométrie courbe.||WEAPONS
KATANA|M-23 Katana|Fusil à pompe de ME2.|Cône court, recul net et arrêt proposé des ennemis légers.|Pompe compacte et canon large.||WEAPONS
SCIMITAR|M-27 Scimitar|Fusil à pompe de ME2.|Deux tirs rapprochés contre une longue récupération ; ne pas égaler le Claymore en impact.|Silhouette plus longue et mécanisme de pompe.||WEAPONS
CLAYMORE|M-300 Claymore|Arme krogan du jeu.|Une décharge très engagée suivie d’une recharge vulnérable ; prévoir protection alliée.|Canon très large et corps massif.|Accès Shepard/Grunt conditionné par règles de classe et recherche.|SQUAD
EVISCERATOR|M-22 Eviscerator|Fusil de contenu additionnel.|Fusil de flanc à portée utile intermédiaire ; avantage si cible sortie d’abri.|Canon court, mécanisme lourd.||EA-DLC
GETH-SHOTGUN|Geth Plasma Shotgun|Fusil plasma geth.|Choisir tir immédiat ou charge affichée ; une interruption perd seulement la charge engagée proposée.|Trois ouvertures lumineuses et matériau geth.||GETH-SG
MANTIS|M-92 Mantis|Fusil de précision de ME2.|Tir unique, cycle long ; ligne de vue à conserver jusqu’à résolution.|Long canon et grande lunette.||WEAPONS
VIPER|M-97 Viper|Fusil de précision de ME2.|Précision soutenue par plusieurs tirs, impact unitaire inférieur proposé.|Fusil long au chargeur distinct.||WEAPONS
WIDOW|M-98 Widow|Fusil de précision lourd.|Très longue préparation contre armure ; avertir du coût de déplacement et de recharge.|Canon imposant et masse visible dans les bras.|Accès soumis à choix/recherche appropriés.|SQUAD
INCISOR|M-29 Incisor|Fusil de précision additionnel.|Rafale de précision : trois impacts proposés distribués si la cible change d’abri.|Arme longue à double volume.||EA-DLC
GRENADE|M-100 Grenade Launcher|Arme lourde de ME2.|Arc d’explosion prévisualisé, cellules séparées ; collision de décor vérifiée avant confirmation.|Tube court et magasin de grenades.||HEAVY
MISSILE|ML-77 Missile Launcher|Arme lourde de recherche.|Verrou de cible plus long que grenade ; cible perdue entraîne une annulation lisible.|Lanceur à optique et tête explosive.||HEAVY
AVALANCHE|M-622 Avalanche|Arme lourde cryogénique.|Zone de gel puis fragilisation ; les bosses résistent à l’immobilisation complète mais restent affectés par une fenêtre proposée.|Grand réservoir et jet blanc-bleu.||HEAVY
CAIN|M-920 Cain|Arme lourde à charge.|Charge très longue annoncée à tous ; réserve de cellules et espace de tir contrôlés avant lancement.|Arme énorme, halo de charge et flash réduit optionnel.||CAIN
PARTICLE|Collector Particle Beam|Arme lourde de faisceau.|Canal continu sur une cible, coût de cellules au fil du canal ; interrompre sans vider la réserve.|Arme organique et rayon ambré.||HEAVY
FIRESTORM|M-451 Firestorm|Arme lourde incendiaire.|Jet rapproché en cône, risque de position ; aucune destruction involontaire des civils de la branche de secours.|Réservoir et buse industriels.|Mission de Zaeed / disponibilité à confirmer par édition.|HEAVY
BLACKSTORM|M-490 Blackstorm|Arme lourde additionnelle.|Projectile lent créant une attraction puis une implosion ; anneau de portée visible avant tir.|Générateur sombre et noyau lumineux.||HEAVY
ARC|Arc Projector|Arme lourde Cerberus.|Chaîne électrique affichée à la sélection ; limiter les rebonds par portée et conducteur visible.|Conducteurs exposés et arcs blancs.||HEAVY,EA-DLC
''')

c.rows('equipment','''
N7|Armure N7 personnalisable|Armure de base de Shepard.|Pièces de casque, torse, épaules, bras et jambes ; les statistiques proposées s’agrègent dans un aperçu avant achat.|Noir, bande N7 et palette modifiable.||N7,ARMOR
KESTREL|Ensemble Kestrel|Ensemble personnalisable de ME2.|Profil polyvalent par pièces ; éviter un bonus caché de set inventé comme caractéristique du jeu.|Plaques technologiques anguleuses et casque opaque.||KESTREL
CERBERUS|Armure d’assaut Cerberus|Ensemble additionnel.|Proposition de rôle d’assaillant ; verrouiller ensemble complet et personnalisable comme types d’objet différents.|Blanc, noir et jaune Cerberus.||EA-DLC
COLLECTOR|Armure des Collecteurs|Ensemble additionnel.|Proposition de protection inhabituelle ; conserver la silhouette sans attribuer une biologie précise à Shepard.|Chitine sombre, surfaces organiques.||EA-LE
TERMINUS|Armure Terminus|Ensemble additionnel.|Profil de front proposé, malus de vitesse annoncé si ajouté par le fan game.|Plaques noires lourdes et visière rouge.||EA-LE
BLOOD-DRAGON|Armure Blood Dragon|Ensemble promotionnel.|Variante cosmétique identifiable, ajustement de pouvoir facultatif clairement séparé.|Rouge et noir, motif dragon stylisé.||EA-LE
INFERNO|Armure Inferno|Ensemble additionnel.|Proposition de recharge technique contre moindre réserve défensive ; aperçu explicite des échanges.|Orange vif et segments de protection fermés.||EA-LE
RECON|Recon Hood|Coiffe présente au départ en Legendary.|Coiffe légère ; bonus de reconnaissance proposé sans changer les dialogues canoniques.|Capuche textile noire et visière.||EA-CAL
SENTRY|Sentry Interface|Visière de personnalisation.|Profil défensif de casque ; feedback de bouclier séparé du visage en sprite.|Interface de visière compacte.||ARMOR
ARCHON|Archon Visor|Visière de personnalisation.|Choix de soutien aux pouvoirs ; affichage de récupération clair dans l’atelier.|Visière technologique fine.||ARMOR
CAPACITOR|Capacitor Helmet|Casque de personnalisation.|Proposition d’accélération de régénération ; aucune modification du délai pendant une scène.|Casque à panneaux de condensateurs.||ARMOR
LIFE-SUPPORT|Life Support Webbing|Pièce d’armure disponible.|Augmentation de marge de survie proposée ; expliquer la différence santé et protection.|Renforts et supports autour des jambes.||ARMOR
ORDNANCE|Ordnance Packs|Pièce liée aux réserves lourdes.|Réserve de cellules proposée distincte des clips ; avertissement lorsque l’armure change hors combat.|Poches techniques et boîtiers latéraux.||ARMOR
MEDIGEL|Medi-gel / Unity|Le medi-gel permet de relever les équipiers.|Action de secours consommant une ressource ; cible et coût avant confirmation ; pas de consommation sur cible déjà relevée.|Dose bleue et icône médicale.||COMBAT
THERMAL|Clips thermiques|Les armes conventionnelles emploient des clips.|Compteurs d’arme et réserve séparés ; recharge anticipée ne gaspille pas arbitrairement la réserve proposée.|Bloc thermique expulsé avec halo chaud.||WEAPONS
CELLS|Cellules d’armes lourdes|Les armes lourdes utilisent des cellules.|Réserve partagée explicitement entre armes lourdes ; aucune cellule négative lors d’un changement d’équipement.|Conteneur énergétique identifiable.||HEAVY
NORMANDY-ARMOR|Amélioration du blindage du Normandy|Des améliorations protègent le vaisseau final.|Recherche préventive et rappel avant départ ; résultat narratif appliqué par événement, pas par combat aléatoire.|Schéma de coque renforcée.|Vérifier table exacte des pertes avant implémentation.|UPGRADE,GUIDE
NORMANDY-SHIELD|Amélioration des boucliers du Normandy|Le vaisseau dispose d’une amélioration de bouclier.|Recherche via contact d’équipier ; lien explicite entre dossier de Tali et capacité accessible.|Schéma de barrières sur coque.|Tali requise pour l’accès approprié.|TALI,UPGRADE
NORMANDY-GUN|Amélioration de l’armement du Normandy|L’armement intervient dans l’approche finale.|Investissement de recherche ; choix visible avant Omega-4 et résolution déterministe.|Schéma de batterie de vaisseau.|Table de conséquences à revérifier en jeu.|UPGRADE,GUIDE
HAMMERHEAD|M-44 Hammerhead|Véhicule du pack Firewalker.|Module de déplacement séparé du groupe ATB ; translation, saut et récolte avec aides de trajectoire.|Véhicule bas à sustentation et moteurs latéraux.|Firewalker et sections d’Overlord.|FIRE,OVERLORD
''')

power_data='''
PULL|Pull|Soulever une cible dépouillée de protection ; une icône de résistance explique l’échec sur armure.|Fil biotique ascendant et cible suspendue.
THROW|Throw|Pousser une cible selon l’axe prévisualisé ; un mur arrête le recul sans téléportation.|Impulsion bleue et trajectoire au sol.
WARP|Warp|Dégrader une défense puis exploiter une suspension ; séparer dégâts et détonation proposée.|Tourbillon violet serré.
SINGULARITY|Singularity|Créer une zone persistante de contrôle ; petite silhouette de centre évitant de masquer les cibles.|Noyau sombre et anneaux bleus.
SHOCKWAVE|Shockwave|Dessiner une ligne d’impulsions par bandes ; couvert bas franchi, mur plein bloquant.|Vagues successives au sol.
SLAM|Slam|Levée brève puis chute ; indiquer le point d’impact, immunité de boss partielle proposée.|Colonne biotique et choc vertical.
REAVE|Reave|Affaiblir une cible organique et accorder une protection temporaire proposée à l’utilisateur ; statut visible.|Aura biotique rouge-violette.
DOMINATE|Dominate|Contrôle temporaire d’organique vulnérable ; empêcher le ciblage amical pendant sa conversion.|Lien violet et icône de durée.
BARRIER|Barrier|Ajouter une réserve biotique séparée ; son activation ne réinitialise pas tous les temps de récupération.|Dôme bref et bord de portrait violet.
CHARGE|Biotic Charge|Déplacement offensif vers une cible valide ; vérifier chemin d’atterrissage et espace du sprite avant paiement.|Trainée bleue et choc de contact.
OVERLOAD|Overload|Retirer une protection électrique et interrompre une machine ; ne pas assimiler barrière biotique et bouclier.|Arc sur circuit et flash de cible.
INCINERATE|Incinerate|Appliquer combustion contre armure ; effet de panique limité aux cibles compatibles.|Projectile orange et lueur résiduelle.
CRYO|Cryo Blast|Refroidir puis geler une cible vulnérable ; boss ralenti sans pose brisée.|Brume blanche et givre à contour épais.
HACK|AI Hacking|Convertir temporairement une machine dépouillée de protection ; afficher faction provisoire sans ambiguïté.|Omni-outil orange et icône réseau.
DRONE|Combat Drone|Placer une diversion sur un emplacement libre ; le drone agit après un signal d’apparition.|Petite sphère holographique et ombre.
ENERGY-DRAIN|Energy Drain|Voler une part de bouclier disponible ; aucun gain sur cible incompatible selon la règle proposée.|Arc dirigé de la cible vers l’allié.
NEURAL|Neural Shock|Désorienter un organique vulnérable ; résistance des synthétiques annoncée avant confirmation.|Trait orange et pose d’étourdissement.
TACTICAL|Tactical Cloak|Réduire la sélection ennemie, puis sortir au tir ; une attaque déjà résolue ne disparaît pas rétroactivement.|Réfraction et bord lumineux accessible.
TECH-ARMOR|Tech Armor|Protection technique avec rupture de proximité ; rendre visible le compromis de récupération.|Plaques holographiques segmentées.
GETH-SHIELD|Geth Shield Boost|Renforcer le bouclier de Legion ; empêcher accumulation illimitée par réactivation répétée.|Grille bleue à motifs geth.
FORTIFICATION|Fortification|Défense de front qui engage le personnage ; retirer le buff après dépense de contre-charge proposée.|Halo dense et posture plantée.
CONCUSSIVE|Concussive Shot|Tir de déséquilibre ; la résistance réduit le recul sans supprimer la lecture de l’impact.|Projectile blanc et recul bref.
ADRENALINE|Adrenaline Rush|Accélérer la prochaine action armée de Shepard ; l’ATB global des autres ne change pas sans règle explicite.|Traînée de visée et assourdissement modulable.
SHADOW-STRIKE|Shadow Strike|Kasumi approche une cible marquée puis revient ; chemin et cible de repli réservés avant action.|Disparition, silhouette brève et frappe de dos.
FLASHBANG|Flashbang Grenade|Créer une zone de désorientation ; prévoir icône équivalente et réduction du flash.|Arc de grenade et étoile atténuable.
INFERNO|Inferno Grenade|Éclats incendiaires de Zaeed ; zone de danger annoncée et dégagement allié.|Éclats orange en éventail.
AMMO-INCENDIARY|Incendiary Ammo|Mode de munitions de feu ; un seul mode actif par arme et aperçu du remplacement.|Marque orange au chargeur.
AMMO-DISRUPTOR|Disruptor Ammo|Mode anti-bouclier ; effets et munitions comptés séparément.|Éclats électriques bleus.
AMMO-CRYO|Cryo Ammo|Mode de refroidissement progressif ; gel déclenché par seuil proposé affiché.|Liseré blanc au projectile.
AMMO-AP|Armor-Piercing Ammo|Mode contre armure ; ne pas promettre pénétration de chaque décor sans règle du fan game.|Icône de plaque perforée.
AMMO-WARP|Warp Ammo|Mode associé aux défenses biotiques ; bonus sur cible suspendue si retenu au réglage.|Impact violet.
AMMO-SHREDDER|Shredder Ammo|Mode contre santé organique ; avertissement sur cible encore protégée.|Icône d’impact rouge sans gore.
STASIS|Stasis|Immobiliser une cible pendant une durée bornée ; mesurer précisément entrée et sortie de la fenêtre.|Silhouette figée dans un cadre bleu.
UNITY|Unity|Relever des alliés avec medi-gel ; sélectionner les cibles valides avant de consommer.|Pulse médical et portrait qui se relève.
'''
for line in power_data.strip().splitlines():
    key,name,rule,look=line.split('|')
    c.add('powers',key,name,'Pouvoir de ME2.',f'Conversion ATB proposée : {rule}',gameplay=rule,visual=look,source='POWERS' if key!='UNITY' else 'COMBAT',reference='Table des pouvoirs ME2',acceptance='La cible, la protection pertinente, le coût proposé, l’état appliqué et sa fin sont visibles ; une cible non admissible ne consomme pas la commande.')

c.rows('choices','''
VEETOR|Veetor : transfert ou retour|Le sort immédiat de Veetor peut varier.|Sauvegarder le destinataire et l’état de confiance ; ne pas changer le résultat après avoir quitté le dialogue.|Deux destinataires dans l’UI de décision.||FREEDOM
GRUNT|Ouvrir la cuve de Grunt|Grunt peut rester dans sa cuve.|Afficher l’effet sur le recrutement et demander une décision narrative claire ; aucune ouverture par simple inspection.|Cuve fermée et commande séparée.||WARLORD
COUNCIL|Statut de Spectre et Conseil|L’import affecte la rencontre politique.|Table de variantes par Conseil survivant et représentant humain ; statut de Spectre indépendant des crédits.|Badge et compte rendu de réunion.||MISSIONS,SAVE
SIDONIS|Épargner ou laisser viser Sidonis|La confrontation de Garrus possède un choix.|Position de Shepard garde la ligne de tir bloquée jusqu’au verrouillage ; enregistrer issue sans effacer la loyauté.|Cible, viseur et zone protégée.||GARRUS
ARESH|Aresh : confrontation de Jack|Une interruption peut désamorcer la scène.|Fenêtre allongée proposée ; option textuelle équivalente au geste.|Portraits rapprochés et arme abaissée.||INTERRUPT,JACK
RONALD|Jugement de Ronald Taylor|La loyauté de Jacob mène à son père.|Présenter les issues dans un résumé concis après les preuves ; aucune issue choisie par défaut au timeout.|Zone de conversation neutralisée.||JACOB
NIKET|Intervenir auprès de Miranda|La scène de Niket peut être interrompue.|Séparer interruption émotionnelle et événements non évitables ; ne pas promettre une survie absente du jeu publié.|Main, arme et champ de dialogue.||MIRANDA,INTERRUPT
ORIANA|Miranda et Oriana|L’arc permet une rencontre familiale.|Sauvegarder la décision de contact sans en faire un prérequis de combat.|Distance entre les deux personnages.||MIRANDA
MAELON-LIFE|Sort de Maelon|Mordin peut être arrêté par Shepard.|Choix indépendant du sort des données ; conserver deux champs d’état.|Arme, Maelon et terminal en trois points.||MORDIN
MAELON-DATA|Conserver les données de Maelon|Le joueur statue sur la recherche.|Résumé des raisons et aperçu de l’état conservé ; aucune prévision omnisciente de ME3 dans le dialogue.|Données gardées ou effacées.||MORDIN
SAMARA|Samara ou Morinth|Morinth peut remplacer Samara.|Préconditions de résistance vérifiables ; un seul emplacement d’équipe, identité réelle et identité affichée séparées.|Deux portraits exclusifs.||SAMARA
TALI-PROOF|Données de l’Alarei au procès|Le procès offre plusieurs résolutions.|Matrice preuves, témoignages, verdict, exil et loyauté ; afficher le verdict exact au débriefing.|Auditoire et preuve en surimpression.||TREASON
TALI-LEGION|Dispute Tali / Legion|Les loyautés peuvent être affectées.|Dialogue de médiation conditionnel ; une loyauté récupérée ne modifie pas secrètement les autres choix.|Deux portraits et résultat par personne.||GUIDE,POWERS
JACK-MIRANDA|Dispute Jack / Miranda|Les loyautés peuvent être affectées.|État distinct pour grief et loyauté ; possibilité de revenir parler sans rejouer la scène entière.|Cabine centrale et séparation spatiale.||GUIDE,POWERS
KOLYAT|Interception de Kolyat|La filature influence la loyauté de Thane.|Échec de suivi signifié immédiatement ; mode d’aide ne change pas les dialogues obtenus.|Témoin de suivi et marqueur de cible.||THANE
HERETICS|Détruire ou réécrire les hérétiques|Legion propose deux issues au virus.|Sauvegarder le choix avec son contexte ; aucun pourcentage moral présenté comme vérité universelle.|Deux opérations de terminal distinctes.||LEGION
GRAYBOX|Conserver ou détruire le graybox|Les deux issues existent.|Confirmer que le choix concerne le souvenir et les données ; aucun double butin de branche.|Graybox et mémoires atténuées.||KASUMI
REFINERY|Secours ou poursuite de Vido|L’arc de Zaeed bifurque.|Deux routes physiques et avertissement de point de non-retour ; calcul de loyauté séparé du secours.|Portes de route et fumée industrielle.||ZAEED
DAVID|Libérer ou laisser David|Le joueur statue sur David et le projet.|Dialogue à l’issue du combat ; documenter les conséquences sans traiter David comme un bonus d’objet.|Caméra à hauteur de personne et commandes désactivées.||ATLAS
KENSON|Alerter les colons ou appeler le Normandy|Arrival propose une intention de contact.|Enregistrer l’intention choisie sans inventer un sauvetage du système ; la destruction n’est pas évitable par ce bouton.|Deux canaux de communication.||ARRIVAL
SPECIALIST|Désigner le spécialiste technique|Compétence et loyauté déterminent l’issue.|Table explicite de candidats par profil ; afficher l’incertitude fictionnelle, garder la logique déterministe.|Portraits et parcours de conduit.||INFIL
FIRETEAM|Désigner le chef de diversion|Le chef compte dans l’infiltration.|Évaluer leadership et loyauté indépendamment du duo joué ; journaliser l’affectation.|Deux colonnes d’escouades.||INFIL
BIOTIC|Choisir le spécialiste biotique|Un biotique maintient la protection.|Montrer la capacité soutenue comme critère de rôle ; ne pas confondre tout porteur de biotique avec expert adapté.|Dôme et portraits de candidats.||WALK
ESCORT|Désigner l’escorte des survivants|Une escorte peut accompagner les captifs.|Retirer l’escorte des membres disponibles puis calculer son retour ; pas de duplication en défense arrière.|Route de retour vers Normandy.||WALK
BASE|Détruire ou conserver la base|La base constitue un choix final.|Choix séparé de la victoire sur le boss ; export narratif distinct du nombre de survivants.|Réacteur et liaison avec Cerberus.||FINAL
DELAY|Délai après enlèvement|L’attente affecte les captifs.|Compteur d’événements de mission ; le temps passé à lire ou régler l’inventaire ne compte pas.|Avertissement de préparation et journal des départs.||WALK,STOP
''')

c.originals('ally_moves','''
MIRANDA-OPEN|Miranda — ouvrir une fenêtre hybride|Surcharge un bouclier puis réserve l’ordre suivant pour Distorsion lorsque l’allié applique un contrôle ; choix de conserver la jauge si la protection n’a pas cédé.|Arc orange suivi d’halo violet, deux icônes distinctes.||characters:MIRANDA,powers:OVERLOAD,powers:WARP
JACOB-GUARD|Jacob — ligne de secours|Interpose une garde courte devant un allié puis projette l’assaillant exposé ; l’interposition ne téléporte pas Jacob à travers les murs.|Pas latéral et bras biotique orienté vers la menace.||characters:JACOB,powers:PULL
MORDIN-TRIAGE|Mordin — diagnostic et brûlure|Marque le type de protection puis lance Incinération contre l’armure ; la recommandation n’exécute jamais une action sans confirmation.|Omni-outil, pictogramme de plaque et projectile orange.||characters:MORDIN,powers:INCINERATE
GARRUS-CROSS|Garrus — tir de croisement|Verrouille une ligne ; un équipier déloge la cible, déclenchant le tir préparé si la ligne reste libre.|Viseur bleu et trait discontinu à travers le couloir.||characters:GARRUS
GRUNT-BREACH|Grunt — percée protégée|Fortification puis avancée d’une bande ; repousse un ennemi léger et crée un couvert corporel temporaire sans immunité totale.|Charge basse, carapace en avant et onde brève.||characters:GRUNT,powers:FORTIFICATION
JACK-LIFT|Jack — rampe biotique|Lance Pull sur le premier ennemi puis une onde au sol ; limiter le combo à la fenêtre affichée et ne pas soulever les boss.|Bras écartés, ligne bleue et cible suspendue.||characters:JACK,powers:PULL,powers:SHOCKWAVE
TALI-BAIT|Tali — diversion piratée|Place le drone sur le côté d’un robot ; lorsque celui-ci se tourne, Tali tente le piratage après suppression de son bouclier.|Drone violet, arc de verrou et icône de faction temporaire.||characters:TALI,powers:DRONE,powers:HACK
THANE-SUSPEND|Thane — cible suspendue|Prépare un tir de précision pendant une suspension alliée ; le tir reste annulable avant impact pour éviter une cible disparue.|Posture basse, respiration et lunette stabilisée.||characters:THANE
SAMARA-CORRIDOR|Samara — corridor de recul|Projette les menaces vers une bande libre ; Reave verrouille le plus résistant pendant le repli du groupe.|Arc de bras calme et ligne de recul au sol.||characters:SAMARA,powers:THROW,powers:REAVE
MORINTH-TURN|Morinth — détour d’attention|Convertit une cible organique isolée et révèle au joueur sa durée de loyauté provisoire ; le groupe évite de la prendre automatiquement pour cible.|Lien violet et portrait de cible barré d’un minuteur.||characters:MORINTH,powers:DOMINATE
LEGION-NET|Legion — contrôle de réseau|Un drone force une rotation, puis le tir de Legion frappe la cible marquée ; ne pas utiliser l’identité geth pour ouvrir arbitrairement tout terminal.|Optique éclairée, drone et ligne de tir droite.||characters:LEGION,powers:DRONE
KASUMI-EXIT|Kasumi — entrée et repli|Réserve une case de retour avant Shadow Strike ; si elle est occupée à la fin, choisir l’abri adjacent sûr sans téléporter hors arène.|Après-image sombre et marqueur de retour.||characters:KASUMI,powers:SHADOW-STRIKE
ZAEED-LANE|Zaeed — couper une route|Grenade incendiaire derrière un abri puis tir de couverture sur l’issue ; un compteur montre l’entretien de suppression.|Éventail orange et arme calée sur l’épaule.||characters:ZAEED,powers:INFERNO
LIARA-DUO|Liara — ouverture du bouclier yahg|Après une fenêtre de mêlée, Liara intervient sur le bouclier ; un ordre de duo consomme les deux disponibilités prévues et ne peut se doubler.|Deux trajectoires de protagonistes encadrent le boss.|Extension Shadow Broker.|characters:LIARA,enemies:BROKER
SHEPARD-RALLY|Shepard — regroupement|Ordre collectif déplace les deux équipiers vers des positions sûres ; n’efface pas les projectiles déjà en vol.|Icône de point de rassemblement et flèches individuelles.||characters:SHEPARD
KENSON-PANEL|Kenson — travail de console|Pendant sa séquence alliée, un événement de console progresse si l’espace proche est protégé ; une interruption ralentit sans perdre tous les progrès.|Posture de saisie et écran à barres de progression.|Arrival uniquement.|characters:KENSON
''')

c.originals('links','''
NORMANDY-HUBS|Normandy ↔ hubs|Routes de carte distinguant atterrissage, carburant et retour ; chaque hub conserve ses marchands et demandes.|Lignes de transit simples et destination nommée.||zones:NORMANDY-CIC,worlds:OMEGA,worlds:ILLIUM,worlds:CITADEL
OMEGA-PROF|Marché Omega → quarantaine|Transition avec avertissement de mission et composition d’équipe ; retour à la clinique puis hub après le recrutement.|Sas, garde et lumière médicale.||zones:OMEGA-MARKET,zones:OMEGA-CLINIC
OMEGA-ARCH|Omega → siège d’Archangel|Taxi de mission ouvre le siège ; bloquer le retour libre pendant la défense tout en conservant la sauvegarde d’entrée.|Navette et vue de pont.||zones:OMEGA-MARKET,zones:ARCHANGEL-HOUSE
ILLIUM-DANTIUS|Nos Astra → tours Dantius|Navette séparant le hub de l’ascension ; expliquer que le recrutement s’effectue sur une carte de mission.|Skycar et tours jumelles.||worlds:ILLIUM,zones:DANTIUS
ILLIUM-POLICE|Nos Astra → spatioport|Passage sans coût de carburant ; les preuves de mission reviennent au bon bureau.|Ascenseur et panneaux de police.||worlds:ILLIUM,zones:ILLIUM-DOCK
ILLIUM-FRET|Illium → fret de Miranda|Transition verrouillée par sa présence ; ne pas permettre d’abandonner l’équipière sur place.|Navette au-dessus des conteneurs.||worlds:ILLIUM,zones:ILLIUM-CARGO
TUCH-RITE|Clan Urdnot → arène|Trajet de rite disponible après dialogue ; retour applique appartenance et loyauté séparément.|Porte de clan et stèle rituelle.||worlds:TUCHANKA,zones:TUCH-RITE
TUCH-MED|Clan Urdnot → hôpital|Route de mission conservant l’éclaireur comme sous-objectif ; retour au clan n’efface pas la preuve de Maelon.|Tunnel, ruines et hôpital.||worlds:TUCHANKA,zones:TUCH-HOSPITAL
FLOTILLA|Audience ↔ Alarei|Deux voyages liés au procès ; la seconde audience s’ouvre même si certaines preuves sont refusées.|Navette entre coques quariènes.||zones:RAYYA,zones:ALAREI
SHADOW-TRANSIT|Illium → Hagalaz|Enchaînement d’extension et point de composition avant coque ; distinguer sortie narrative et voyage libre.|Carte galactique, nuages et vaisseau.||zones:VASIR-ROOF,zones:HAGALAZ-HULL
BROKER-IN|Coque → bureau du Courtier|Sas de fin d’assaut avec restauration des seuls états autorisés ; conserver les ressources engagées.|Porte épaisse et lumière du bureau.||zones:HAGALAZ-HULL,zones:BROKER-OFFICE
AITE-STATIONS|Vallée d’Aite → stations|Réseau Hammerhead avec verrous Vulcan/Prometheus puis Atlas ; pas de liaison inventée vers un autre système.|Carte des stations à pictogrammes.||worlds:AITE,zones:ATLAS-VR
ARRIVAL-TRANSIT|Prison → projet d’Arrival|Voyage narratif après Kenson ; invalider l’ancienne route de retour sans retirer la sauvegarde d’avant-mission.|Navette et silhouette d’astéroïde.||zones:ARRIVAL-PRISON,zones:ARRIVAL-PROJECT
OMEGA4|Normandy → base Collecteur|Point de départ final avec résumé des préparatifs ; la confirmation crée un instantané des affectations.|Relais rouge et carte de destination.||main_quests:OMEGA4,worlds:COLLECTOR-BASE
COLLECTOR-SEQUENCE|Conduits → pods → noyau|Trois segments appliquant leurs pertes à l’entrée du suivant ; transitions atomiques à la sauvegarde.|Trois cartes imbriquées, lumières de progression.||zones:COLLECTOR-VENTS,zones:COLLECTOR-PODS,zones:COLLECTOR-CORE
POSTGAME|Retour après mission suicide|Retour conditionné à la survie de Shepard ; garder missions restantes jouables selon leurs propres prérequis.|Normandy endommagé et vue de carte rétablie.||main_quests:FINAL
''')

c.originals('scenery','''
OMEGA-KIT|Kit de rues Omega|Construire murs métalliques, passerelles et conduits modulaires avec points de couverture distincts du décor.|Orange sale, brun, câbles pendants et néons.|Éviter les zones interactives noyées sous les enseignes.|worlds:OMEGA
ILLIUM-KIT|Kit architectural d’Illium|Terrasses à garde-corps transparents et arrière-plans de tours ; retirer automatiquement les éléments qui cachent les sprites.|Blanc chaud, cuivre et verre.|Hauteur de couvert indiquée par profil.|worlds:ILLIUM
CITADEL-KIT|Kit Zakera / Citadelle ME2|Galeries commerçantes en niveaux lisibles ; vues lointaines de station en plans non accessibles.|Blanc, bleu et plantes.||worlds:CITADEL
TUCH-KIT|Kit de ruines krogan|Bâtir un contraste entre pierre ancienne et ferraille fonctionnelle ; larges portes pour gabarits krogan.|Ocre, gris cendre, bannières et tôles.||worlds:TUCHANKA
KORLUS-KIT|Carcasses de Korlus|Assembler des coques en silhouettes de relief ; chaque marche praticable reçoit un liseré de sol.|Rouille, fumée et énormes moteurs.||worlds:KORLUS
PRAGIA-KIT|Laboratoire envahi de jungle|Végétation en premier plan qui s’efface près des indices ; traces du centre visibles sans gore ajouté.|Vert humide, béton et lampes mortes.||worlds:PRAGIA
AEIA-KIT|Camp côtier d’Aeia|Plage et épave en trois profondeurs ; habitat improvisé différencié de la zone de commandement.|Bleu marin, vert tropical et tissu usé.||worlds:AEIA
HAESTROM-KIT|Ruines à ombres utiles|Générer des ombres cohérentes avec le soleil ; art et volume de danger partagent la même projection.|Sable clair et noir d’ombre tranché.||worlds:HAESTROM
HORIZON-KIT|Colonie agricole interrompue|Maisons, cultures et défense composent une carte habitée avant l’attaque ; les corps figés ne servent pas de couverts.|Bois industriel, vert pâle et soleil jaune.||worlds:HORIZON
COLLECTOR-KIT|Architecture organique Collecteur|Couloirs en alvéoles et plateformes de combat ; marquer les bords praticables pour ne pas perdre les sprites.|Brun, ambre et tissus luisants.||worlds:COLLECTOR-BASE
REAPER-KIT|Intérieur du Moissonneur|Volumes inclinés, conduits et laboratoire ajouté ; l’inclinaison décorative ne déforme pas la grille ATB.|Noir bleuté et rouge discret.||zones:DERELICT
QUARIAN-KIT|Vaisseau quarian|Coursives compactes à portes circulaires ; codes de fonction visibles au-dessus des accès.|Gris, orange chaud et tissus techniques.||zones:ALAREI
HOCK-KIT|Réception et collection de Hock|Luxe posé en grands aplats pour rester lisible à basse résolution ; socles interactifs séparés de la décoration.|Marbre, or discret et art hétérogène.||zones:HOCK-MANSION,zones:HOCK-VAULT
HAGALAZ-KIT|Coque sous tempête|Panneaux courbes et antennes avec masques de profondeur ; limiter l’orage derrière l’action.|Métal bleu-gris et éclairs blancs atténuables.||zones:HAGALAZ-HULL
AITE-KIT|Vallée de recherche d’Aite|Terrain en terrasses compatible Hammerhead ; repères de navigation aux bifurcations de stations.|Herbe, roches et structures Cerberus.||worlds:AITE
ATLAS-KIT|Atlas réel et virtuel|Même géométrie de base dans les deux états ; remplacement progressif de matériaux sans déplacer le sol.|Béton clinique puis grille verte.||zones:ATLAS-VR
PRISON-KIT|Prison batarienne d’Aratoht|Passages de service lisibles depuis la route principale ; cellules comme rythme visuel et non petits labyrinthes.|Bronze sombre et roche brute.||zones:ARRIVAL-PRISON
ALCHERA-KIT|Neige et débris du SR-1|Scène mémorielle avec traces et brise légère ; les repères ne ressemblent pas à des ennemis.|Blanc froid, noir de coque et ciel pâle.||side_quests:CRASH-SITE
''')

c.originals('props','''
IFF|Transpondeur IFF|Objet de quête non vendable ; inspection avant extraction, drapeau d’acquisition atomique au retour.|Module de données fixé au cœur technique.||main_quests:IFF
GRAYBOX|Graybox de Keiji|Modèle inspectable et états intact/effacé ; aucune copie persistante après le choix d’effacement.|Boîtier neural compact et projection de souvenirs.||choices:GRAYBOX
GRUNT-TANK|Cuve de Grunt|États scellée, déverrouillée et ouverte ; interaction d’examen séparée de la commande d’ouverture.|Grand cylindre et silhouettes dans liquide.||choices:GRUNT
GENOPHAGE-DATA|Recherche de Maelon|Dossier de preuve à deux états irréversibles ; la fermeture d’écran ne confirme pas l’effacement.|Terminal médical et lignes de données abstraites.||choices:MAELON-DATA
ALAREI-DATA|Preuves de l’Alarei|Objet de preuve distinct du témoignage et du verdict ; provenance visible dans le journal.|Enregistrement et icône de vaisseau.||choices:TALI-PROOF
VENT-VALVE|Commande de ventilation Collecteur|Deux états très contrastés ; activation alignée sur la baisse thermique du technicien.|Vanne organique à lumière verte.||main_quests:INFILTRATION
AIR-CURE|Diffuseur de cure d’Omega|Objet actif de mission : cure chargée, ventilation coupée puis rétablie ; ne pas disparaître au combat.|Conduit, cartouche et témoin médical.||main_quests:PROFESSOR
HORIZON-TURRET|Console de défense d’Horizon|Animation de réparation interrompable puis verrouillage de tir ; signaler la fin de la phase.|Écran de ciblage et pylône.||main_quests:HORIZON
THERMAL-CLIP|Clip thermique au sol|Pickup original avec aimantation limitée ; couleur identique à l’icône de réserve, sans faux chargeur lourd.|Bloc fumant avec bord clair.||equipment:THERMAL
POWER-CELL|Cellule lourde au sol|Pickup avec aperçu de capacité ; le trop-plein suit une règle explicite et ne duplique pas au rechargement.|Cube énergétique jaune.||equipment:CELLS
MED-STATION|Station de medi-gel|Deux états de stock ; interdire la double prise par interaction et auto-loot simultanés.|Croix médicale bleue et porte transparente.||equipment:MEDIGEL
FIREWALKER-PROBE|Sonde de Lattesh|État non récolté visible à distance ; chaleur ajoutée une fois lors de capture complète.|Colonne rouge et appareil enfoui.||side_quests:FIRE-COLD
OVERLORD-ANTENNA|Relais de transfert Overlord|Animation de charge avant envoi ; ordre de priorité lu depuis luminosité et numéro.|Bras d’antenne, câbles verts et écran d’état.||enemies:OVERLORD
PROJECT-ARTIFACT|Artefact d’Arrival|Objet narratif dangereux ; lumière subtile et champ d’influence sans mécanique d’inventaire portable.|Masse sombre et halo rouge.||main_quests:ARRIVAL
PROJECT-THRUSTER|Commande du projet|Écran d’axe de collision avec état armé ; une seule confirmation narrative engage le final.|Console, carte du relais et jauges lisibles.||main_quests:ARRIVAL
MEMORIAL|Mémorial du Normandy|Placement dans un point désigné ; inspection après pose conserve l’état de commémoration.|Plaque et débris de coque.||side_quests:CRASH-SITE
DOGTAGS|Traces de l’équipage du SR-1|Collectibles commémoratifs inventoriés avec provenance ; ne pas donner de bonus d’attaque aux souvenirs.|Plaquettes identitaires discrètes dans la neige.||side_quests:CRASH-SITE
HOCK-SECURITY|Sécurité du coffre Hock|Trois types d’accès représentés par objets différents ; un état manquant indique sa catégorie sans révéler la solution.|Scanner biométrique, micros et ligne d’alimentation.||main_quests:KASUMI-HEIST
TUCH-KEYSTONE|Stèle du rite de Grunt|Déclencheur par interaction volontaire hors combat ; verrou après lancement d’une phase.|Pierre gravée et poussière.||main_quests:LOY-GRUNT
BROKER-TERMINAL|Terminal de renseignements|Index documentaire avec lecture marquée et liens de provenance ; chaque dossier reste optionnel.|Écrans suspendus et pupitre sombre.||lore:BROKER
''')

c.originals('dialogues','''
ILLUSIVE|Briefings de l’Homme Trouble|Écrire des dialogues originaux de mission ; distinguer information confirmée, ordre reçu et réponse de Shepard.|Plan fixe du bureau et réponse du commandant.||npcs:ILLUSIVE
GARRUS|Garrus : vengeance et confiance|Dialogue original en plusieurs retours ; rappeler les actes de Sidonis sans répéter les mêmes questions à chaque visite.|Visage marqué et silence entre deux sujets.||characters:GARRUS,choices:SIDONIS
MORDIN|Mordin : recherche et responsabilité|Séparer explication scientifique, souvenirs et jugement ; aucun bouton ne valide toute une position politique.|Poste médical et regard mobile.||characters:MORDIN,choices:MAELON-DATA
TALI|Tali : famille et preuve|Conversations indexées avant/après audience ; montrer le conflit entre réputation familiale et défense personnelle.|Visière et mains serrées.||characters:TALI,choices:TALI-PROOF
JACK|Jack : mémoire du centre|Répliques originales courtes et possibilité de laisser un silence ; ne pas réduire le trauma à un bonus de loyauté.|Assise basse et distance de caméra respectueuse.||characters:JACK,main_quests:LOY-JACK
MIRANDA|Miranda : projet familial|Écrire des retours distincts sur Niket et Oriana ; ne pas les fusionner en un unique booléen de confiance.|Posture maîtrisée puis relâchement.||characters:MIRANDA
LEGION|Legion : consensus et hérésie|Dialogue original explicitant une décision de réseau ; un lexique secondaire explique les termes sans allonger chaque réplique.|Optique et panneaux orientables.||characters:LEGION,choices:HERETICS
SAMARA|Samara : code et filiation|Réponses sobres avec branche exclusive si Morinth est présente ; aucune réplique de mère réutilisée sans contexte.|Posture assise calme, palette rouge/bleu.||characters:SAMARA,characters:MORINTH
THANE|Thane : mortalité et Kolyat|Entretien original en épisodes ; conserver les conséquences de la filature et les liens familiaux séparés de romance.|Respiration et focalisation sur le regard.||characters:THANE
KASUMI|Kasumi : souvenir et secret|Commentaires de souvenirs conditionnés au graybox ; ne pas traiter destruction et conservation comme dialogue identique.|Ombre de capuche et projection discrète.||characters:KASUMI,choices:GRAYBOX
LIARA|Liara : après le Courtier|Dialogue de rôle nouveau et relation importée ; retour au Normandy facultatif sans imposer romance.|Bureau d’informations et lumière chaude intime.||characters:LIARA
CREW|Normandy : conversations de service|Écrire courts échanges originaux à deux voix dans ingénierie et mess ; priorité aux alertes de mission.|Petits gestes de travail, portraits non envahissants.||zones:NORMANDY-ENGINE,zones:NORMANDY-MESS
''')

c.originals('cinematics','''
LOSS|Destruction du Normandy — storyboard|Établir les espaces avant leur rupture ; passage de contrôle à caméra puis retour sans modifier le choix du joueur.|Grande silhouette du vaisseau et cabine ouverte.||main_quests:SAVE-JOKER
RETURN|Réveil de Shepard — storyboard|Plans de reconstruction abstraits puis reprise en laboratoire ; ne pas exposer d’explication technique inventée comme canon.|Instruments, silhouette et yeux ouverts.||main_quests:AWAKENING
GARRUS-REVEAL|Révélation d’Archangel|Révéler la silhouette avant le visage ; le nom apparaît après reconnaissance, pas avant l’entrée de scène.|Viseur, fusil posé et armure bleue.||characters:GARRUS
HORIZON|Rencontre du survivant de Virmire|Variante Ashley ou Kaidan selon import ; garder la distance émotionnelle et le départ quel que soit le romance flag.|Colonie silencieuse après attaque.||main_quests:HORIZON
JOKER-ESCAPE|Joker et EDI pendant l’attaque|Caméra guide l’itinéraire sans faire courir le personnage de façon incompatible ; sous-titres complets des ordres.|Coursives sombres et projections d’EDI.||main_quests:ABDUCTION
OMEGA4|Approche de la base|Plans conditionnels selon améliorations ; chaque perte apparaît une fois avec identité correcte.|Normandy entre épaves et Oculus.||main_quests:OMEGA4
BROKER|Mort du Courtier et succession|Chorégraphie de duo lisible ; poser le nouveau statut de Liara après la résolution, pas pendant le boss.|Yahg, écran de protection et lueur de décharge.||main_quests:SHADOW
DAVID|Révélation de David|Cadrer le dispositif puis la personne ; proposer réduction d’intensité visuelle tout en gardant l’information narrative.|Laboratoire vert, visage et câbles.||main_quests:OV-ATLAS
RELAY|Collision du relais Alpha|Établir trajectoire, évacuation et conséquence à distance ; ne pas fabriquer d’issue de sauvetage disponible.|Astéroïde et flash spatial atténuable.||main_quests:ARRIVAL
EXTRACTION|Extraction de la mission suicide|Branches de survie et saut final ; contrôler le nombre de personnes visibles et les places du groupe.|Plateforme effondrée et soute du Normandy.||main_quests:FINAL
''')

c.originals('animations','''
SHEP-COVER|Shepard — entrée et sortie de couvert|Animer approche, appui et retrait ; le ciblage au sol ne bouge qu’au début du déplacement autorisé.|Variantes debout/accroupi et arme longue/courte.||characters:SHEPARD
SHEP-RELOAD|Shepard — changement de clip|Éjection, prise et verrou distincts ; événement de munition unique au verrou ; annulation avant verrou préserve l’ancien compte.|Petit bloc chaud et geste de main lisible.||equipment:THERMAL
SHEP-OMNI|Shepard — geste omni-outil|Main libre pour canal technique ; transition correcte depuis chaque famille d’arme.|Arc orange extérieur à la silhouette.||powers:OVERLOAD
SHEP-BIOTIC|Shepard — anticipation biotique|Poids du corps puis geste ; lire préparation, déclenchement et récupération même sans particules.|Trois poses fortes et paume ouverte.||powers:WARP
GRUNT-CHARGE|Grunt — charge et freinage|Abaisser le centre, accélérer puis glisser à l’arrêt ; aucun passage à travers un allié.|Carapace avançant avant le corps.||characters:GRUNT
JACK-SHOCK|Jack — onde au sol|Deux appuis au sol, projection des bras et reprise ; la ligne de choc commence au contact de la pose clé.|Silhouette ouverte et effet horizontal.||characters:JACK
GARRUS-SNIPE|Garrus — visée suspendue|Épauler, immobiliser le viseur, tir et retour ; garder cicatrice du même côté selon orientation.|Armure asymétrique et longue arme.||characters:GARRUS
KASUMI-STRIKE|Kasumi — disparition et retour|Fondre dans l’ombre après anticipation puis frapper ; les frames de retour choisissent l’emplacement validé.|Capuche, lame de geste et ombre au sol.||characters:KASUMI
LEGION-IDLE|Legion — optique et panneaux|Mouvements de tête et panneaux substituent les expressions faciales ; garder le trou du torse non miroir.|Optique unique et plaques mobiles.||characters:LEGION
TALI-DRONE|Tali — invocation de drone|Omni-outil puis libération ; un point lumineux relie clairement la créatrice au drone.|Paume et capuche sans masquer l’optique.||characters:TALI
MORDIN-WORK|Mordin — diagnostic et conversation|Gestes rapides mais arrêts aux phrases importantes ; conserver la lisibilité des doigts en petite taille.|Tête inclinée et omni-outil.||characters:MORDIN
JOKER-WALK|Joker — marche de fuite|Cycle prudent avec appuis ; ne pas utiliser le sprint générique du héros.|Casquette et déplacements courts.||npcs:JOKER
FENRIS-LEAP|FENRIS — bond|Compression des pattes, décollage, trajectoire et réception ; collider suit la position au sol prévue.|Quatre pattes nettement séparées.||enemies:FENRIS
YMIR-TURN|YMIR — rotation armée|Buste tourne avant les pieds ; fenêtre de flanc lisible pendant le pivot.|Grand torse et jambes lourdes.||enemies:YMIR
PRAET-LAND|Praetorian — atterrissage|Baisser le corps puis déployer la décharge ; anneau de danger apparaît avant contact.|Silhouette suspendue devenant masse au sol.||enemies:PRAETORIAN
SCION-WAVE|Scion — préparation d’onde|Gonflement/armement du bras puis ligne d’onde ; conserver l’asymétrie sur toutes les vues.|Bras-canon et épaule lourde.||enemies:SCION
HARBINGER-TAKE|Possession d’un Collecteur|Arrêt du porteur, allumage puis posture de Harbinger ; conversion unique de l’état d’IA à la frame de prise.|Chitine orange lumineuse.||enemies:HARBINGER
BROKER-SHIELD|Yahg — alternance de bouclier|Pose défensive haute, ouverture et frappe ; l’état de collision suit la surface dessinée.|Bouclier géant et silhouette quadrupède redressée.||enemies:BROKER
HAMMER-HOVER|Hammerhead — sustentation et saut|Boucle de vol bas, jets de montée puis réception ; échelle du groupe invisible durant le véhicule.|Jets latéraux et poussière au sol.||equipment:HAMMERHEAD
CREW-RESCUE|Équipage — sortie des pods|Pose de réveil, appui et marche assistée ; variantes seulement pour survivants présents.|Humains affaiblis et pods ouverts.||main_quests:LONG-WALK
''')

c.originals('vfx','''
SHIELD|Rupture de bouclier|Décharge bleue courte avec pictogramme ; pas de flash plein écran obligatoire.|Contour et éclats directionnels.||powers:OVERLOAD
BARRIER|Rupture de barrière|Effet violet en fragments souples distinct du bouclier technique ; texture et forme doublent la couleur.|Arc brisé et icône biotique.||powers:WARP
ARMOR|Impact sur armure|Étincelles localisées et marque de plaque ; la protection reste visible sans gore.|Petits impacts jaunes et plaque striée.||powers:INCINERATE
WARP-COMBO|Détonation biotique proposée|Anneau borné et lecture de l’origine ; ne pas masquer le retour d’ennemis prêts à agir.|Violet/bleu, centre sombre.||powers:WARP,powers:PULL
CRYO|Gel et dégel|Givre progressif sur le contour, fissure à la fin ; bosses utilisent une variante de ralentissement.|Blanc opaque en bord et cœur visible.||powers:CRYO
FIRE|Combustion persistante|Flammes limitées au contour et icône de durée ; pas de confusion avec une mort de personnage.|Orange et braises petites.||powers:INCINERATE
CLOAK|Camouflage accessible|Réfraction accompagnée d’un bord réglable pour le joueur ; silhouette ennemie perceptible par indice de mouvement.|Contour discontinu et distorsion légère.||powers:TACTICAL,enemies:GETH-HUNTER
SEEKER|Essaim de Seeker|Nuage à densité plafonnée et masque de visibilité ; dôme protecteur garde toujours son bord visible.|Insectes en particules regroupées.||main_quests:LONG-WALK
HAESTROM|Radiation solaire|Liseré chaud sur personnage exposé et icône de bouclier en baisse ; ombre reste une forme stable.|Orange discret et pictogramme soleil.||worlds:HAESTROM
HAGALAZ|Éclairs d’Hagalaz|Impulsions météo séparées des attaques ; mode sans flash garde les repères de condensateurs.|Éclair en arrière-plan et halo de charge.||worlds:HAGALAZ
OVERLORD|Interférence verte Overlord|Déformation d’écran limitée à certaines surfaces ; informations essentielles restent nettes.|Grille et visage morcelé.||zones:ATLAS-VR
CAIN|Explosion du Cain|Zone prévisualisée puis choc en couches ; intensité et secousse réglables.|Onde blanche/orange avec noyau atténué.||weapons:CAIN
BLACKSTORM|Implosion Blackstorm|Noyau lent et flèches d’attraction ; la fin est annoncée par anneau, pas seulement par couleur.|Noir-violet et déformation locale.||weapons:BLACKSTORM
ARRIVAL|Destruction du relais|Effet spatial de fin de scène indépendant des systèmes de dégâts de l’arène.|Anneau de lumière et coupure au noir graduée.||main_quests:ARRIVAL
LOYALTY|Gain ou perte de loyauté|Notification discrète avec nom et conséquence système ; pas de pluie de particules durant une scène sensible.|Portrait, mot et trait de statut.||systems:LOYALTY
''')

c.originals('audio','''
OMEGA|Ambiance d’Omega|Composer nappes industrielles, ventilation et club lointain ; ducking sur parole, variante calme pour accès au journal.|Repères sonores de portes et foule de provenances variées.||worlds:OMEGA
ILLIUM|Ambiance de Nos Astra|Transports aériens, talons et fontaines ; annonces originales brèves plutôt qu’une radio envahissante.|Espace aérien ample et zone commerciale nette.||worlds:ILLIUM
TUCHANKA|Ambiance de Tuchanka|Vent sec, métal et marteaux distants ; le rite reçoit une percussion originale distincte de l’hôpital.|Spatialisation par cour et couloir.||worlds:TUCHANKA
NORMANDY|Vie du Normandy|Moteur grave, électroniques discrètes et proximité des voix ; changer l’ambiance après l’enlèvement.|Résonance différente entre CIC, cabine et ingénierie.||zones:NORMANDY-CIC,main_quests:ABDUCTION
QUARIAN|Ambiance de la Flotte|Ventilation dense et filtres de masque ; sous-titres identifiant les amiraux même hors champ.|Bips de vaisseau et voix filtrées avec intelligibilité prioritaire.||main_quests:LOY-TALI
COLLECTOR|Ambiance Collecteur|Organique sec, ailes et grondements ; séparer les appels de renfort des textures de décor.|Sons de chitine et bruit spatial étouffé.||worlds:COLLECTOR-BASE
HARBINGER|Signature de possession|Créer une signature vocale originale et un signal de transfert ; aucune imitation d’acteur ni réplique extraite.|Grave traité, attaque lumineuse sous-titrée.||enemies:HARBINGER
PRAETORIAN|Signal du Praetorian|Montée de fréquence avant atterrissage, pulsation de rayon ; option de texte tactique pour joueurs sans son.|Deux motifs incompatibles entre eux.||enemies:PRAETORIAN
GUNS|Familles d’armes ME2|Bibliothèque originale distinguant pistolet, rafale, pompe, sniper et arme lourde ; limiter les collisions de voix.|Matériaux métalliques pour humain, organiques pour Collecteur.||weapons:AVENGER,weapons:PARTICLE
HAMMERHEAD|Hammerhead : moteurs et récolte|Jets différenciés montée/sustentation, boucle de gel de moteur et son de capture de sonde.|Avertissement thermique également écrit.||equipment:HAMMERHEAD
SHADOW|Musique originale du cambriolage au Courtier|Composer deux arcs séparés : enquête tendue puis tempête et duel ; transitions selon états de mission.|Pulsations discrètes et percussions métalliques.||main_quests:SHADOW
KASUMI|Musique originale de l’infiltration|Motif social posé puis variation rythmique de fuite ; pas de morceau officiel copié.|Instruments légers et basse contrôlée.||main_quests:KASUMI-HEIST
OVERLORD|Audio de détresse d’Overlord|Traitement abstrait avec intensité réduite possible ; message narratif compréhensible sans hurlement prolongé.|Signal fragmenté, silence et ambiance électrique.||main_quests:OV-ATLAS
ARRIVAL|Audio d’urgence Arrival|Compteur et alarme non continus ; messages de progression prioritaires et sous-titres complets.|Pulsation de délai et bruit de propulseurs.||main_quests:ARRIVAL
MEMORIAL|Silence du site du Normandy|Vent, neige et quelques notes originales espacées ; découverte d’une trace reçoit un son discret.|Réverbération ouverte et peu de basses.||side_quests:CRASH-SITE
''')

c.originals('systems','''
ATB|Noyau de combat ATB ME2|Proposer jauges individuelles et pause de sélection ; résolution déterministe avec réservation de cible, coût et interruption.|Trois portraits, jauges et timeline des attaques lourdes.||characters:SHEPARD
PROTECTIONS|Santé, bouclier, barrière, armure|Quatre couches lisibles ; chaque pouvoir affiche son efficacité sans dépendre uniquement de couleur.|Icônes cœur, grille, onde et plaque.||powers:OVERLOAD,powers:WARP,powers:INCINERATE
LOYALTY|Loyauté par équipier|Garder recrutement, mission accomplie et loyauté comme états distincts ; disputes et réconciliation écrivent des événements auditables.|Portraits avec état explicite et historique concis.||choices:TALI-LEGION,choices:JACK-MIRANDA
SQUAD|Sélection du groupe et exclusivités|Shepard plus deux équipiers ; contraintes de mission et personnages temporaires annoncés avant embarquement.|Grille avec tags temporaire, requis et indisponible.||characters:SAMARA,characters:MORINTH,characters:LIARA
SUICIDE|Résolveur de mission suicide|États du vaisseau, rôles, loyauté, escorte, défense arrière et dernier groupe sont évalués séparément puis dans l’ordre.|Table de préparation avec vérification des affectations.||main_quests:INFILTRATION,main_quests:LONG-WALK,main_quests:FINAL
IFF-CLOCK|Compteur IFF et enlèvement|Compter les événements admissibles de mission ; aucune progression pendant menus, dialogues ou temps réel d’inactivité.|Journal de missions et signal d’urgence.||main_quests:IFF,main_quests:ABDUCTION
MORALITY|Dialogue et moralité par édition|Modèle d’adaptation explicite, sans recopier un seuil numérique non vérifié ; éviter d’afficher une option faisable qui échoue silencieusement.|Roue lisible et raison de verrouillage facultative.||choices:SAMARA
INTERRUPTS|Interruptions contextuelles accessibles|Fenêtre de temps réglable, pause ou sélection textuelle équivalente ; résultat narratif identique pour chaque mode.|Bouton et phrase d’action avant pression.||choices:ARESH
SCANNING|Scan planétaire et ressources|Mini-jeu de sondage facultatif avec balayage automatique proposé ; toute ressource a un coût et une destination de recherche visibles.|Globe, courbe de scanner et stocks nommés.||equipment:NORMANDY-ARMOR
RESEARCH|Recherche de laboratoire|Séparer découverte de schéma, ressources et achat ; prévisualiser bénéfice avant validation et sauvegarder transaction atomique.|Table de recherche du Normandy.||equipment:NORMANDY-SHIELD
MERCHANTS|Boutiques et remises|Chaque boutique expose ses catégories, crédit disponible et remise ; ne pas appliquer une remise deux fois.|Liste avec comparaison de prix et confirmation.||zones:OMEGA-MARKET
LOADOUT|Armes, armures et classes|Tables par classe et édition ; les restrictions de Shepard et celles des équipiers ne partagent pas le même filtre.|Emplacements avec raison d’incompatibilité.||equipment:N7,weapons:WIDOW
HEAVY|Réserve d’armes lourdes|Cellules partagées, changement d’arme et capacité avec règle documentée ; aucune recharge gratuite involontaire au menu.|Barre lourde distincte des clips.||equipment:CELLS
HACKING|Piratage et contournement|Deux puzzles courts distincts avec option accessible ; le succès signale l’état de porte et l’objet reçu séparément.|Circuits et segments de code abstraits.||props:HOCK-SECURITY
HAMMERHEAD|Pilotage Hammerhead|Sous-mode véhicule avec chemins, boost et prélèvement ; caméra empêche de cacher le prochain point d’appui.|Ombre du véhicule et prédiction d’atterrissage.||equipment:HAMMERHEAD
JOURNAL|Journal par mission et alias|Un identifiant de quête pour les variantes de titre ; journal distingue piste, action et retour au donneur.|Filtres campagne, loyauté, affectation et DLC.||side_quests:CIT-ID
ROMANCE|Relations et consentement narratif|Drapeaux propres à chaque relation ; choix amoureux explicites et contrôle des conflits importés ; aucun flirt forcé par amabilité.|Portrait, intention et résumé d’engagement.||characters:SHEPARD
PHOTO|Caméra de production hybride|Sprites à huit directions proposées, décors 3D et masques d’occlusion ; priorité de visibilité au groupe et aux télégraphes.|Plan d’ombres et contours sélectionnables.||zones:DANTIUS
SAVE|Sauvegarde d’états de mission|Écrire inventaire, équipe et choix dans une transaction ; reprise interdit de rejouer les récompenses déjà confirmées.|Journal de sauvegarde daté et miniature de zone.||main_quests:FINAL
EDITION|Profils Original / Legendary|Distinguer disponibilité des DLC, acquisition d’équipement et ajustements officiels ; aucune dépendance au réseau Cerberus simulée requise pour jouer le fan game.|Étiquette d’édition dans options et fiches.||equipment:RECON
''',priority='P0')

c.originals('qa','''
SQUAD-MORINTH|QA — exclusivité Samara / Morinth|Charger chaque issue de loyauté ; vérifier qu’un seul emplacement est sélectionnable et que les dialogues reflètent l’identité connue.|Captures avant/après choix et grille d’équipe.||choices:SAMARA
TALI-PROOF|QA — procès de Tali|Tester acquittement, exil et usage/refus de preuve ; vérifier verdict, loyauté et nom sans confondre les états.|Table de vérité narrative.||choices:TALI-PROOF
IFF|QA — compteur de missions IFF|Rejouer un parcours avec missions restantes puis un parcours achevé ; les menus et achats n’ajoutent aucune unité de délai.|Chronologie d’événements.||systems:IFF-CLOCK
CREW|QA — délais après enlèvement|Comparer départ immédiat et départ retardé ; vérifier les captifs, l’escorte et les scènes sans duplication de survivants.|Liste de PNJ attendus par branche.||choices:DELAY
SHIP|QA — améliorations du Normandy|Tester absence puis présence des trois améliorations critiques ; chaque conséquence survient à la bonne étape de l’approche.|Journal de scène et identité des victimes conditionnelles.||systems:SUICIDE
TECH|QA — technicien et chef de diversion|Tester candidat adapté loyal, adapté non loyal et inadapté ; un bon technicien ne compense pas automatiquement un chef incorrect.|Table de rôles et résultat du sas.||choices:SPECIALIST,choices:FIRETEAM
BIOTIC|QA — barrière et escorte|Comparer biotique approprié et autre candidat ; vérifier que l’escorte quitte bien la liste du groupe final.|Jauge de barrière et registre d’affectation.||choices:BIOTIC,choices:ESCORT
HOLDLINE|QA — défense arrière|Tester plusieurs répartitions de survivants, loyautés et membres emmenés au boss ; aucun membre ne défend en deux lieux.|Journal d’évaluation et bilan final.||systems:SUICIDE
SHEPARD-DEATH|QA — issue sans survie de Shepard|Déclencher l’issue d’échec final admissible ; pas de retour libre ni d’import de héros vivant généré par défaut.|Écran de fin et métadonnées de partie.||main_quests:FINAL
HAESTROM|QA — soleil et ombre|Tracer les limites d’exposition sur les parcours ; ombre visuelle et protection réelle restent alignées après rotation caméra.|Carte thermique de zone.||worlds:HAESTROM
JOKER|QA — chemin Joker|Rejouer la séquence à vitesse minimale et avec aide ; vérifier qu’un personnage sans sprint combat peut atteindre chaque abri prévu.|Trajets annotés et temps d’événements proposés.||main_quests:ABDUCTION
THANE|QA — filature sans combat|Tester perte de cible, reprise et rapport dans chaque fenêtre ; aucune attaque indispensable n’est ajoutée.|Trace du suivi de Talid.||main_quests:LOY-THANE
ZAEED|QA — routes de raffinerie|Comparer secours et poursuite ; vérifier état de travailleurs, Vido et loyauté séparés ; aucun loot inaccessible requis pour sortir.|Graphe de mission annoté.||main_quests:ZAEED-LOY
SHADOW|QA — Liara et Shadow Broker|Passer du duo DLC à l’équipe permanente ; Liara ne reste pas sélectionnable hors périmètre par accident.|Roster avant, pendant et après DLC.||characters:LIARA
OVERLORD|QA — verrous d’Aite|Faire Vulcan puis Prometheus et l’ordre inverse ; Atlas s’ouvre une fois et conserve les collectibles déjà pris.|Table d’états des stations.||main_quests:OVERLORD
ARRIVAL|QA — mission solo et variant Harbinger|Lancer Arrival avant et après le final ME2 ; groupe temporaire et scène de communication suivent le bon état.|Comparaison de dialogues et roster.||main_quests:ARRIVAL
FIRE-COLD|QA — panne de froid Firewalker|Laisser le moteur geler puis réussir toutes les sondes ; résultat partiel sans écran de mort inventé.|Bilan de ressources et retour Normandy.||side_quests:FIRE-COLD
SOURCES|QA — titres et provenance|Pour chaque fait dépassant le simple index, vérifier une page spécifique ou une capture en jeu avant validation du canon ; corriger la traduction française indépendamment.|Registre source, date et édition.||systems:EDITION
VISUAL|QA — sprites sur décors 3D|Tester les huit directions proposées, couverts translucides et grands ennemis ; aucun masque ne cache un télégraphe essentiel.|Mosaïque de scènes de lisibilité.||systems:PHOTO
ACCESS|QA — sans son et effets réduits|Terminer un duel Praetorian, une poursuite et une interruption avec son coupé et flash réduit ; toutes les informations tactiques restent disponibles.|Icônes, sous-titres et réglages.||vfx:HAGALAZ,audio:PRAETORIAN
''')

c.rows('continuity','''
IMPORT-ME1|Import ME1 : Virmire, Conseil, relations|Des choix précédents sont importés.|Schéma de sauvegarde sans défaut silencieux ; trois groupes de variables et origine de chaque valeur.|Table d’import lisible.|Parties sans import utilisent un profil explicite.|SAVE
SHEPARD|Shepard : identité conservée|La personnalisation traverse la trilogie.|Conserver nom, genre joué et visage ; cicatrices ME2 comme calque et non remplacement d’identité.|Portraits cohérents entre scènes.||EA-LE,EA-CAL
SURVIVORS|Survivants exportés vers ME3|La mission suicide peut coûter des équipiers.|Exporter chaque mort et chaque absence séparément ; ne pas ressusciter un personnage pour une scène de fan game.|Table par personne et cause.|Validation narrative ME3 nécessaire.|SAVE
MORDIN|Données de Maelon vers ME3|La recherche fait partie des décisions suivies.|Transmettre état de données distinct de survie de Maelon, Mordin et loyauté.|Dossier médical scellé.||MORDIN,SAVE
GETH|Hérétiques et relation Tali/Legion|Les choix participent à la continuité geth.|Exporter réécriture/destruction, survie et médiation sous clés séparées ; aucun score de paix inventé.|Schéma de trois sources d’état.||LEGION,SAVE
BROKER|Liara après Shadow Broker|Liara prend le rôle du Courtier.|Après l’extension, changer le rôle et le lieu de contact sans rendre tous les dossiers publics.|Portrait et titre actualisés.||SHADOW
DAVID|David après Overlord|Son sort peut changer.|Exporter décision de protection et réalisation de la mission ; ne pas supposer une même situation dans tous les futurs.|Dossier personnel à état discret.||ATLAS
ARRIVAL|Conséquence du relais Alpha|Bahak est détruit dans Arrival.|Enregistrer mission faite et conséquence ; ne pas imposer la présence du DLC à une partie originale qui ne l’avait pas.|Carte barrée et compte rendu.|Le raccord sans DLC doit être vérifié dans ME3.|ARRIVAL
KASUMI|Graybox et mémoire de Kasumi|Conserver ou effacer donne deux états.|Exporter choix sans fabriquer un partenaire vivant ; dialogues ultérieurs respectent le souvenir.|Icône graybox intact/effacé.||KASUMI
ZAEED|Loyauté et sort de Zaeed|L’arc comporte des variantes.|Dissocier recrutement, loyauté, Vido et survie finale ; chaque absence a une cause propre.|Table d’états mercenaire.||ZAEED
LEGENDARY|Différences de distribution DLC|Legendary intègre les équipements différemment.|Maintenir deux profils d’acquisition ; ne pas recopier le cadeau immédiat de l’original dans toutes les boutiques.|Étiquette d’édition visible.||EA-CAL
GENESIS|Genesis comme récapitulatif|Legendary intègre les comics interactifs Genesis.|Séparer ce récapitulatif d’une mission jouable nouvelle ; profil d’import couvre uniquement les choix réellement proposés.|Frise d’images et choix résumés.||EA-CAL
''')

c.sprites()
c.cover('Campagne et loyautés','Tous les recrutements majeurs, les douze arcs de loyauté, les étapes du chemin Collecteur et les principaux choix sont détaillés.','Tables exactes de délais IFF, défense arrière et seuils moraux à rejouer sur versions Original et Legendary ; aucun chiffre canon reconstitué.')
c.cover('Affectations et DLC','Affectations N7 et hubs ; Kasumi, Zaeed, Crash Site, cinq Firewalker, Overlord, Shadow Broker et Arrival sont couverts. Les alias de journal sont regroupés.','Recensement en jeu des micro-dialogues, objets secondaires, nouvelles et variantes de visite ; titres français officiels à harmoniser. Aucune exhaustivité de tous les textes revendiquée.')
c.cover('Personnages, ennemis et mouvements','Équipiers permanents et temporaires, principaux PNJ, factions et archétypes ennemis possèdent des spécifications ; attaques d’adaptation et planches de sprites sont séparées.','Sous-variantes de chaque mercenaire nommé, animations de toutes les orientations et visages à contrôler sur références visuelles ; spécifications non réalisées.')
c.cover('Armes, équipements et pouvoirs','Arsenal principal et DLC, ensembles et pièces représentatives, réserves et pouvoirs jouables sont couverts sans statistiques copiées.','Liste intégrale des petites pièces, apparences alternatives et emplacements de recherche à recouper par édition ; réglages ATB à équilibrer en prototype.')
c.cover('Décors, audio, UI et QA','Mond es et zones clés, connexions, kits de décor, objets de quête, interfaces, effets, audio original et scénarios de non-régression sont décrits.'.replace('Mond es','Mondes'),'Ni sprite, animation, niveau, son ni test du jeu final produit par ces fiches ; captures visuelles et exécution des scénarios restent à faire.')
c.cover('Sources et périmètre','Confirmations EA/BioWare pour éditions et DLC ; index et pages spécifiques Fandom pour le détail. Les créations originales sont marquées Extrapolation.','L’accès direct Fandom a été limité ; les pages ont été consultées sous forme indexée. Les index ne constituent pas une validation primaire de chaque détail. Aucun contenu coupé ni rumeur promu en canon.')
if __name__=='__main__': c.write()

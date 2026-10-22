from games_catalog_common import Catalog
from me2_catalog_builder import power_data as me2_power_data

c=Catalog('ME3','Mass Effect 3','Campagne solo et DLC From Ashes, Leviathan, Omega, Citadel et Extended Cut ; profils Original et Legendary distincts. Le multijoueur de ME3 original et ses packs sont décrits comme module séparé, sans l’intégrer au roster solo ni le présenter comme présent dans Legendary.')
def wiki(key,title,path,scope): c.src(key,title,'https://masseffect.fandom.com/wiki/'+path,scope)
for key,title,url,scope in [
('EA-LE','Mass Effect Legendary Edition — EA','https://www.ea.com/fr/games/mass-effect/mass-effect-legendary-edition','Collection solo et DLC'),
('EA-CAL','Gameplay Calibrations','https://www.ea.com/ea-play/news/gameplay-calibrations','Galaxy at War, Extended Cut et acquisition des objets'),
('EA-ASHES','ME3: Surgi des cendres','https://www.ea.com/fr-fr/games/mass-effect/mass-effect-3-from-ashes','Recrutement du Prothéen'),
('EA-LEV','Mass Effect 3: Leviathan — EA','https://www.ea.com/fr-fr/games/mass-effect/mass-effect-3-leviathan','Sujet de l’extension'),
('EA-OMEGA','Mass Effect 3: Omega — EA','https://www.ea.com/fr-fr/games/mass-effect/mass-effect-3-omega','Aria et libération d’Omega'),
('BW-CITADEL','Citadel & Reckoning DLC Announced','https://blog.bioware.com/2013/02/21/mass-effect-3-citadel-reckoning-dlc-announced/','Citadel solo, Armax et Reckoning multi'),
('BW-LEV','Leviathan & Firefight DLC and Wii U information','https://blog.bioware.com/2012/08/02/mass-effect-3-leviathan-firefight-dlc-and-wii-u-information/','Leviathan et armes solo'),
('BW-EC','Mass Effect 3: Extended Cut','https://blog.bioware.com/2012/06/22/mass-effect-3-extended-cut-2/','Scènes finales et épilogues supplémentaires')]: c.src(key,title,url,scope,'source officielle')
for args in [
('GUIDE','Mass Effect 3 Guide','Mass_Effect_3_Guide','Campagne et échéances de missions'),
('MISSIONS','Missions','Missions','Index ME3 et DLC'),
('CHAR','Characters/Mass Effect 3','Characters/Mass_Effect_3','Personnages'),
('SQUAD','Squad Members Guide (Mass Effect 3)','Squad_Members_Guide_%28Mass_Effect_3%29','Roster campagne, DLC et Armax'),
('POWERS','Powers (Mass Effect 3)','Powers_%28Mass_Effect_3%29','Pouvoirs et progressions'),
('COMBAT','Combat (Mass Effect 3)','Combat_%28Mass_Effect_3%29','Couches de protection et attaques létales'),
('EQUIP','Equipment Guide (Mass Effect 3)','Equipment_Guide_%28Mass_Effect_3%29','Équipement et lieux de collecte'),
('CITADEL','Citadel','Citadel','Index des missions annexes de Citadelle'),
('HUERTA','Huerta Memorial Hospital','Huerta_Memorial_Hospital','Hôpital et personnages'),
('TUCH','Priority: Tuchanka','Priority%3A_Tuchanka','Génophage, Eve et sabotage'),
('RANNOCH','Priority: Rannoch','Priority%3A_Rannoch','Geth, quariens et résolution'),
('EARTH','Priority: Earth','Priority%3A_Earth','Final et variantes de décision'),
('HORIZON','Priority: Horizon','Priority%3A_Horizon','Sanctuary et Miranda'),
('THESSIA','Priority: Thessia','Priority%3A_Thessia','Temple et Vendetta'),
('HQ','Priority: Cerberus Headquarters','Priority%3A_Cerberus_Headquarters','Assaut final de Cerberus'),
('CITADEL2','Priority: The Citadel II','Priority%3A_The_Citadel_II','Coup d’État et Kolyat'),
('GRISSOM','Grissom Academy: Emergency Evacuation','Grissom_Academy%3A_Emergency_Evacuation','Jack, élèves et évacuation'),
('RACHNI','Attican Traverse: Krogan Team','Attican_Traverse%3A_Krogan_Team','Grunt, équipe et reine rachni'),
('BOMB','Tuchanka: Bomb','Tuchanka%3A_Bomb','Désamorçage et Victus'),
('PLATOON','Tuchanka: Turian Platoon','Tuchanka%3A_Turian_Platoon','Peloton et enchaînement vers bombe'),
('KALLINI','Kallini: Ardat-Yakshi Monastery','Kallini%3A_Ardat-Yakshi_Monastery','Samara, Falere et Rila'),
('ARRAE','Arrae: Ex-Cerberus Scientists','Arrae%3A_Ex-Cerberus_Scientists','Jacob, Brynn Cole et Gavin'),
('FIGHTERS','Rannoch: Geth Fighter Squadrons','Rannoch%3A_Geth_Fighter_Squadrons','Consensus et échéance avant Rannoch'),
('OMEGA','Omega: Aria T’Loak (Mass Effect 3)','Omega%3A_Aria_T%27Loak_%28Mass_Effect_3%29','Campagne DLC, Nyreen et Petrovsky'),
('OMEGA-START','Citadel: Aria T’Loak','Citadel%3A_Aria_T%27Loak','Briefing de l’extension'),
('LEV','Mass Effect 3: Leviathan','Mass_Effect_3%3A_Leviathan','Index des étapes de recherche'),
('CIT-DLC','Mass Effect 3: Citadel','Mass_Effect_3%3A_Citadel','Complot et activités'),
('MP','Mass Effect 3 Multiplayer','Mass_Effect_3_Multiplayer','Cartes et packs multijoueurs, original uniquement'),
('MP-CHALLENGES','Mass Effect 3 Multiplayer/Challenges','Mass_Effect_3_Multiplayer/Challenges','Défis de Retaliation'),
('GAME','Mass Effect 3','Mass_Effect_3','Périmètre et éditions'),
('INTERRUPT','Interrupt (Mass Effect 3)','Interrupt_%28Mass_Effect_3%29','Interruptions et variantes'),
('MORAL','Morality Guide (Mass Effect 3)','Morality_Guide_%28Mass_Effect_3%29','Dialogues et décisions'),
('PHANTOM','Phantom','Phantom','Unité Cerberus et index bestiaire'),
('MARAUDER','Marauder','Marauder','Unité Moissonneur et index bestiaire'),
('RAVAGER','Ravager','Ravager','Unité d’artillerie et index bestiaire'),
('KAI','Kai Leng (enemy)','Kai_Leng_%28enemy%29','Boss Cerberus'),
('CLONE','Clone','Clone','Boss de Citadel'),
('BROOKS','Brooks','Brooks','Antagoniste de Citadel'),
('CAT6','CAT6 Specialist','CAT6_Specialist','Unités CAT6 et drones'),
('HARVESTER','Harvester (enemy)','Harvester_%28enemy%29','Boss volant'),
('SUPPRESSOR','M-11 Suppressor','M-11_Suppressor','Arme de Citadel et index arsenal'),
('PARTICLE','Particle Rifle','Particle_Rifle','Fusil prothéen et index arsenal'),
('PHAESTON','Phaeston','Phaeston','Fusil turien et index arsenal'),
('CHAKRAM','Chakram Launcher','Chakram_Launcher','Arme additionnelle'),
('SABER','M-99 Saber','M-99_Saber','Fusil lourd'),
('BLACKSTAR','Reaper Blackstar','Reaper_Blackstar','Arme lourde locale'),
('HYDRA','M-560 Hydra','M-560_Hydra','Lanceur local de Tuchanka'),
('GETH-SOFT','Geth Combat Software','Geth_Combat_Software','Arme virtuelle du consensus'),
('ALIEN-MED','Citadel: Alien Medi-Gel Formula','Citadel%3A_Alien_Medi-Gel_Formula','Mission, échéance et rattrapage Spectre'),
('WAR-ALIEN','War Assets/Alien','War_Assets/Alien','Ressources de guerre extraterrestres'),
('WAR-KROGAN','War Assets/Krogan','War_Assets/Krogan','Ressources krogan et rachni'),
('WAR-SALARIAN','War Assets/Salarian','War_Assets/Salarian','Ressources salariennes conditionnelles')]:wiki(*args)

c.rows('characters','''
SHEPARD|Commandant Shepard|Protagoniste de ME3.|Commandant ATB : distribuer son temps entre action armée, pouvoirs et ordre d’équipe ; aucune classe définitive imposée par le catalogue.|Armure N7, personnalisation et cicatrices importées.||EA-LE
JAMES|James Vega|Équipier humain de la campagne.|Point d’appui défensif : Fortification, grenade et Carnage pour protéger les équipiers fragiles.|Carrure massive, coupe courte et armure Alliance.||SQUAD
LIARA|Liara T’Soni|Équipière biotique de la campagne.|Contrôle par Singularity et Stasis, préparation de détonations puis repli ; faible résistance proposée compensée par son contrôle.|Armure claire, bleu asari, tenue de Courtier hors combat.||SQUAD
GARRUS|Garrus Vakarian|Équipier s’il a survécu à ME2.|Tireur préparant Overload et mine de proximité ; ordre de tir sur cible fragilisée.|Armure bleue marquée et viseur asymétrique.|Survie ME2 requise.|SQUAD
EDI|EDI — corps synthétique|EDI devient équipière de terrain.|Ingénieure utilisant Incinerate, Overload, Decoy et Defense Matrix ; silhouette du leurre distincte.|Corps synthétique argenté et segments noirs.||SQUAD
JAVIK|Javik|Prothéen recruté via From Ashes.|Contrôle offensif par Dark Channel, Slam et Lift Grenade ; identité de vétéran dans les poses.|Carapace prothéenne, yeux multiples et armure rouge sombre.|DLC / Legendary.|SQUAD,EA-ASHES
ASHLEY|Ashley Williams|Équipière possible, survivante de Virmire.|Soldate de précision : Marksman et munitions disruptives ; scène de confiance conditionne son retour.|Armure Alliance bleue, silhouette humaine et cheveux propres au modèle.|Exclusive de Kaidan ; autres conditions narratives.|SQUAD
KAIDAN|Kaidan Alenko|Équipier possible, survivant de Virmire.|Hybride biotique/tech : Reave, Barrier, Overload et Cryo Blast pour alterner soutien et détonation.|Armure Alliance et posture contenue.|Exclusif d’Ashley ; autres conditions narratives.|SQUAD
TALI|Tali’Zorah vas Normandy|Équipière dépendant de ME2 et Rannoch.|Contrôle synthétique et maintien de bouclier ; séparer drone offensif et drone défensif.|Capuche violette, visière et tenue quariène.|Survie et dénouement Rannoch conditionnels.|SQUAD
ANDERSON|David Anderson — temporaire|Accompagne le prologue terrestre.|Guide de déplacement et de tir ; ne pas garder son slot disponible après l’évacuation.|Uniforme Alliance et arme de poing.|Prologue seulement.|SQUAD
ARIA|Aria T’Loak — Omega|Équipière spécifique à l’extension.|Biotique agressive avec Flare, Lash, Reave et Carnage ; équilibrer longue préparation et forte zone.|Asari violette et tenue de commandement noire.|Omega seulement.|SQUAD
NYREEN|Nyreen Kandros — Omega|Équipière temporaire d’Omega.|Protection biotique et compétences tech ; rôle de secours à distance lisible.|Turienne, armure tactique et marque faciale.|Omega seulement.|SQUAD
WREX|Urdnot Wrex — Citadel|Wrex peut combattre dans Citadel.|Krogan de mêlée avec Carnage et soutien ; rendre les consommables de Stimulant Pack distincts des grenades dans l’adaptation.|Grande carapace rouge et armure lourde.|Vivant ; extension Citadel uniquement hors arène.|SQUAD
ARENA-GRUNT|Grunt — Armax uniquement|Équipier du simulateur si vivant.|Importer sa résistance et ses armes dans les règles d’arène ; interdire son sélectionneur en mission de campagne.|Carapace claire et armure krogan.|Simulateur Armax ; survie requise.|SQUAD
ARENA-JACK|Jack — Armax uniquement|Équipière du simulateur si vivante.|Version biotique de contrôle dans arène ; apparence d’instructrice et variante combat distinctes.|Tatouages, tenue ME3 et coupe propre à ME3.|Simulateur Armax ; survie requise.|SQUAD
ARENA-JACOB|Jacob Taylor — Armax uniquement|Équipier du simulateur si vivant.|Rôle shotgun/biotique repris dans une table de simulation ; aucune réintégration au Normandy actif.|Tenue de combat d’ex-Cerberus.|Simulateur Armax ; survie requise.|SQUAD
ARENA-KASUMI|Kasumi Goto — Armax uniquement|Équipière du simulateur si vivante.|Tactical Cloak et Decoy donnent une niche de diversion ; ne pas recopier automatiquement Shadow Strike de ME2.|Capuche et couleurs de tenue connues.|Simulateur Armax ; survie requise.|SQUAD
ARENA-MIRANDA|Miranda Lawson — Armax uniquement|Équipière du simulateur si vivante.|Hybride Overload/Warp et autres pouvoirs propres à sa version Armax ; données séparées du personnage de ME2.|Combinaison claire et noire.|Simulateur Armax ; survie requise.|SQUAD
ARENA-SAMARA|Samara — Armax uniquement|Équipière du simulateur si vivante.|Combinaisons biotiques à distance ; verrou de disponibilité après l’arc du monastère.|Armure rouge et posture droite.|Simulateur Armax ; survie requise.|SQUAD
ARENA-ZAEED|Zaeed Massani — Armax uniquement|Équipier du simulateur si vivant.|Suppression et grenades incendiaires ; approche offensive propre à la simulation.|Armure usée et visage marqué.|Simulateur Armax ; survie requise.|SQUAD
''')

c.rows('npcs','''
HACKETT|Amiral Hackett|Coordonne l’effort allié.|Briefings de ressources de guerre avec provenance de chaque contribution ; évite les discours répétés après collecte minime.|Hologramme Alliance, uniforme et visage marqué.||GUIDE
JOKER|Jeff « Joker » Moreau|Pilote du Normandy.|Scènes de relation avec EDI et retours de mission ; placement à la passerelle pour repère constant.|Casquette et posture assise.||CHAR
TRAYNOR|Samantha Traynor|Spécialiste des communications.|Relais d’alertes et missions avec file consultable ; distinguer invitation personnelle et ordre urgent.|Uniforme Alliance et console CIC.||CHAR,GUIDE
CORTEZ|Steve Cortez|Pilote de navette du Normandy.|Déplacements vers missions et arc personnel ; les conversations changent selon deuil et soutien, pas selon score de pilotage inventé.|Tenue de pilote et hangar Kodiak.||CHAR
CHAKWAS|Karin Chakwas|Médecin pouvant rejoindre le Normandy.|Choix de médecin et dialogues d’après-guerre ; emplacement infirmerie unique.|Blouse et geste de soin.|Disponibilité et invitation conditionnelles.|HUERTA
MICHEL|Chloe Michel|Médecin de l’hôpital.|Alternative de personnel médical ; état du médecin recruté distinct des objets achetés.|Blouse, cheveux roux et bureau de clinique.|Ne pas afficher simultanément deux responsables au même poste.|HUERTA
KELLY|Kelly Chambers|Ancienne membre de l’équipage.|Retrouvailles sur Citadelle avec conséquences conditionnelles ; aucune disponibilité garantie après coup d’État.|Tenue civile et secteur de réfugiés.|Survie ME2 requise.|CHAR
ADAMS|Gregory Adams|Ingénieur du Normandy.|Point de service de la pièce GX12 ; dialogues coordonnés aux retours de Kenneth/Gabriella.|Uniforme technique et poste moteur.||CITADEL
ALLERS|Diana Allers|Journaliste pouvant embarquer.|Interviews originales à fenêtres de campagne ; l’invitation et la présence restent facultatives.|Tenue civile de journaliste et zone de reportages.||CHAR
UDINA|Donnel Udina|Responsable politique de l’arc Citadelle.|Scènes de Conseil puis de coup d’État ; l’UI ne révèle pas l’issue avant découverte.|Costume sombre et bureau d’ambassade.||CITADEL2
BAILEY|Commandant Bailey|Responsable C-Sec.|Guide des enquêtes de Citadelle ; reprendre ses contacts sans devoir quitter le hub entre chaque dialogue.|Uniforme C-Sec et bureau.||CITADEL
VICTUS|Primarque Adrien Victus|Dirigeant turien recherché sur Menae.|Conversations de sommet et de peloton distinctes ; état de son fils après la bombe.|Armure turienne de commandement.|Arc Palaven/Tuchanka.|GUIDE,PLATOON
TARQUIN|Tarquin Victus|Officier de la mission de bombe.|PNJ d’objectif à défendre pendant désamorçage ; fin narrative indépendante de l’animation de santé d’escorte.|Turien en armure près du dispositif.|Arc Tuchanka.|BOMB
WREAV|Urdnot Wreav|Alternative au dirigeant krogan Wrex.|Sous-graphe politique conditionnel ; ses intérêts ne sont pas des répliques de remplacement de Wrex.|Krogan massif et armure distincte.|État importé de Wrex.|TUCH
EVE|Bakara / Eve|Krogan soignée pendant l’arc du génophage.|PNJ d’escorte et interlocutrice politique ; éviter de la réduire à une ressource de guerre.|Voile krogan, tenue cérémonielle et posture digne.|Survie dépend de l’arc et des données importées.|TUCH
MORDIN|Mordin Solus|Peut préparer le remède.|Scientifique de mission, non équipier général ; gérer sa présence et ses issues au Shroud.|Tenue médicale et omni-outil.|Survie ME2.|TUCH
WIKS|Padok Wiks|Peut remplacer Mordin dans l’arc.|Écrire une branche propre au scientifique ; motivations et épilogue séparés de Mordin.|Salarien et équipement STG.|Cas d’absence de Mordin.|TUCH
DALATRASS|Dalatrasse Linron|Propose le sabotage du remède.|Entretien politique présentant son offre ; conserver l’accord et la révélation comme états distincts.|Hologramme galarien et tenue politique.||TUCH
KIRRAHE|Major Kirrahe|Personnage conditionnel de l’arc galarien.|Apparition selon import ; ne pas le rendre immortel pour remplacer une autre absence.|Armure STG.|État ME1 et progression ME3 à vérifier.|CITADEL2
THANE|Thane Krios|Personnage conditionnel à l’hôpital.|Dialogue de retrouvailles puis scène de coup d’État ; rôle narratif, non compagnon de campagne.|Manteau sombre, écailles vertes et souffle posé.|Survie ME2.|HUERTA,CITADEL2
KOLYAT|Kolyat Krios|Apparaît dans l’arc de Thane.|Scène familiale conditionnée aux événements ; interaction calme après mission.|Drell jeune dans l’hôpital.|Ne pas exiger à tort la réussite de sa mission ME2.|CITADEL2
JACK|Jack — instructrice|Peut être retrouvée à Grissom.|Coordination des élèves et débriefing ; état d’instructrice séparé du personnage de simulation.|Tatouages, vêtement ME3 et tenue de terrain.|Survie ME2 et délai de sauvetage.|GRISSOM
SANDERS|Kahlee Sanders|Contact de l’Académie Grissom.|Guide d’évacuation donnant le nombre de groupes sécurisés ; pas de rôle de combattante inventé comme établi.|Tenue d’école et salle de communication.||GRISSOM
DAVID|David Archer|Peut apparaître à Grissom.|Dialogue de continuité d’Overlord ; aucun exposé gratuit des violences subies.|Étudiant dans un espace de recherche.|Sauvé dans ME2 et mission Grissom accessible.|ARRAE,GRISSOM
BRYNN|Brynn Cole|Scientifique à évacuer d’Arrae.|Coordonne les civils et Jacob ; priorités d’extraction lisibles dans l’arène.|Blouse et station de communication.||ARRAE
JACOB|Jacob Taylor — rescapés|Peut protéger les scientifiques.|Retrouvailles et appui local ; son éventuelle relation ME2 est traitée séparément.|Armure d’ex-Cerberus et blessure.|Survie ME2.|ARRAE
GAVIN|Gavin Archer|Peut être rencontré à Arrae.|Dialogue de conséquence avec conditions distinctes selon David et Grissom ; ne pas utiliser un unique booléen de pardon.|Tenue de laboratoire usée.|Project Overlord importé.|ARRAE
SAMARA|Samara — monastère|Peut apparaître au monastère.|Retrouvailles familiales et dilemme du code ; fenêtre d’intervention adaptée accessible.|Armure rouge dans un décor austère.|Survie ME2 et choix Samara/Morinth.|KALLINI
FALERE|Falere|Sœur de Rila au monastère.|PNJ de recherche puis résolution ; protéger son autonomie narrative dans les choix finaux.|Asari en tenue monastique.||KALLINI
RILA|Rila|Sœur recherchée dans le grand hall.|Scène de sauvetage et sacrifice ; l’animation reste narrative, aucune quête de loot associée.|Asari affaiblie près du dispositif.||KALLINI
LEGION|Legion / VI geth|Intervient dans l’arc de Rannoch.|Identité Legion ou substitut VI selon import ; le codex et les conditions de paix lisent cette différence.|Châssis geth et optique.|Survie et activation de ME2.|RANNOCH,FIGHTERS
RAAN|Shala’Raan|Amirale de l’arc quarian.|Interlocutrice de commandement ; disponibilité alternative si Tali absente.|Tenue d’amirale quariène.||RANNOCH
KORIS|Zaal’Koris|Amiral à secourir sur Rannoch.|Choix d’évacuation entre chef et équipe ; état de survie séparé de réussite du site.|Combinaison quariène et balise.||RANNOCH
GERREL|Han’Gerrel|Amiral quarian de guerre.|Débriefing du cuirassé et décision de flotte ; opposition verbale sans bonus caché obligatoire.|Armure quariène militaire.||RANNOCH
XEN|Daro’Xen|Amirale quariène.|Point de vue technologique ; contributions de flotte distinctes du dialogue personnel.|Capuche claire et instrumentation.||RANNOCH
MIRANDA|Miranda Lawson — Sanctuary|Poursuit Oriana si elle a survécu.|Chaîne de rencontres et avertissement avant Horizon ; notifications non perdues si joueur explore.|Combinaison et rendez-vous discrets.|Conditions de survie nombreuses à tester.|HORIZON
HENRY|Henry Lawson|Dirige les expériences de Sanctuary.|Confrontation avec otage ; ne pas transformer un choix de dialogue en combat de boss séparé.|Costume clair, laboratoire et Oriana.||HORIZON
ORIANA|Oriana Lawson|Se trouve au centre de l’arc Sanctuary.|Préserver son message si Miranda est absente ; identifiant distinct d’une simple quête de sauvetage.|Tenue civile et environnement de laboratoire.||HORIZON
ILLUSIVE|L’Homme Trouble|Dirige Cerberus et intervient au final.|Conversations idéologiques à étapes ; conserver les traces des réponses importantes sans seuil caché inventé.|Siège, implants visibles et éclairage froid.||HQ,EARTH
KAI|Kai Leng|Antagoniste Cerberus.|Trois contextes narratifs séparés ; ses scènes ne doivent pas annoncer une victoire jouable quand l’issue est imposée.|Armure noire, masque et lame.||KAI
VENDETTA|Vendetta|VI prothéenne du temple.|Exposition du Catalyseur et de l’histoire ; source de connaissance limitée aux données révélées.|Hologramme prothéen bleu.||THESSIA
BRYSON|Garret Bryson|Chercheur de l’arc Leviathan.|Point d’entrée d’enquête et preuves dans son laboratoire ; pas de dialogue posthume automatique.|Bureau, artéfacts et carte galactique.||LEV
ANN|Ann Bryson|Chercheuse à retrouver dans Leviathan.|Escorte à Namakli puis décision d’enquête ; son état de santé reste distinct du succès de recherche.|Tenue scientifique et laboratoire.||LEV
PETROVSKY|Oleg Petrovsky|Commandant de l’occupation d’Omega.|Antagoniste de stratégie, puis choix de reddition ; l’issue dépend des interventions et attitude d’Aria.|Uniforme Cerberus, écrans et échiquier.||OMEGA
BROOKS|Maya Brooks|Personnage du complot Citadel.|Alliée apparente puis antagoniste ; UI de confiance sans spoiler anticipé.|Tenue de service puis équipement de combat.||BROOKS
CATALYST|Catalyseur|Expose les options finales.|Entretien final et choix explicite ; aucune théorie d’endoctrinement ajoutée comme fait établi.|Apparition lumineuse et espace de décision.||EARTH
''')

c.rows('main_quests','''
EARTH-PROLOGUE|Prologue: Earth|La Terre est envahie.|Évacuation tutorielle avec Anderson ; progression entre ruines et attente d’extraction.|Ville détruite, bâtiments militaires et Moissonneur lointain.||GUIDE
MARS|Priority: Mars|Liara recherche les données du Creuset.|Archives enneigées, train et poursuite d’Eva ; apprendre combos et objectifs au milieu de Cerberus.|Rouge martien, laboratoires blancs et neige.||GUIDE
CITADEL1|Priority: The Citadel I|Shepard cherche des alliances.|Hub politique et hôpital ; nouveaux contacts clairement repérés sans combat.|Ambassades, hôpital et docks.||GUIDE
PALAVEN|Priority: Palaven|Un primarque turien doit être retrouvé.|Mission sur Menae : défendre les positions, retrouver Victus et repousser la pression au sol.|Lune en guerre, ciel de Palaven embrasé et barricades.||GUIDE
SURKESH|Priority: Sur’Kesh|Une krogan est évacuée sous attaque.|Escorte d’une capsule d’un étage à l’autre ; menaces alternées et réparations exposées.|Laboratoire galarien, jungle et ascenseurs.||GUIDE
TUCHANKA|Priority: Tuchanka|Le remède du génophage est en jeu.|Ruines, convois et route vers le Shroud ; choix du sabotage résolu après les attaques du Moissonneur.|Architecture krogan, Kalros et tour atmosphérique.||TUCH
CITADEL2|Priority: The Citadel II|Cerberus attaque la Citadelle.|Progression C-Sec, poursuite et face-à-face politique ; dialogue du survivant de Virmire reste une étape séparée.|Docks, rues et ascenseur diplomatique.||CITADEL2
PERSEUS|Priority: Perseus Veil|La campagne rejoint le conflit quarian/geth.|Sommet de flotte en zone sûre ; préparer les règles du cuirassé et restaurer les contacts conditionnels.|Hologrammes d’amiraux et vaisseaux.||MISSIONS
DREADNOUGHT|Priority: Geth Dreadnought|Le cuirassé geth est une cible majeure.|Avancer dans une structure à impulsions ; libérer l’interlocuteur geth et planifier l’évasion.|Canon central, réseaux geth et couloir sous tension.||MISSIONS
RANNOCH|Priority: Rannoch|Le conflit geth/quarian arrive à son choix.|Assaut terrestre puis désignation du Moissonneur ; négociation finale séparée des réflexes de visée.|Montagnes, base geth et ciel de Rannoch.|Prérequis de paix à vérifier avant validation.|RANNOCH
CITADEL3|Priority: The Citadel III|Rencontre politique après Rannoch.|Donner un point clair de passage vers Thessia et garder les retours de compagnons accessibles.|Ambassade asari et passage du Présidium.||MISSIONS
THESSIA|Priority: Thessia|Shepard atteint le temple de Thessia.|Montée urbaine sous feu, temple et Vendetta ; afficher l’issue narrative imposée sans faux choix de victoire.|Ruines asari, temple et Moissonneurs.||THESSIA
HORIZON|Priority: Horizon|Sanctuary cache des expériences Cerberus.|Enquête de centre de réfugiés, laboratoire puis confrontation familiale ; preuves téléchargeables avant la sortie.|Centre d’accueil blanc et sous-sols industriels.||HORIZON
CERBERUS|Priority: Cerberus Headquarters|Shepard attaque le quartier général.|Assaut de hangar, archives de Lazarus et duel Kai Leng ; avertissement clair du verrou final avant départ.|Station Cerberus et bureaux profonds.|Point de non-retour de campagne.|HQ,GUIDE
EARTH|Priority: Earth|Les alliés attaquent pour ouvrir le Creuset.|Deux grandes phases avec pause de composition ; routes de Londres, tir lourd, défense des missiles et faisceau.|Londres en ruine, blindés et faisceau de Citadelle.||EARTH
FINAL|Final — Catalyseur et épilogues|Les décisions finales ont plusieurs issues.|Entretien sans ATB ; chaque option montre sa portée et exige confirmation ; épilogues lisent le parcours entier.|Espace du Creuset et scènes de reconstruction conditionnelles.|Profil Extended Cut par défaut pour Legendary.|EARTH,EA-CAL,BW-EC
EDEN|Priority: Eden Prime|From Ashes permet de recruter Javik.|Exploration de colonie et capsule prothéenne ; lire deux archives avant déverrouillage de réveil.|Colonie verte, fouilles et capsule.|DLC / Legendary.|EA-ASHES,MISSIONS
BRYSON|Citadel: Dr. Bryson / Leviathan I|Entrée de l’enquête Leviathan.|Table d’indices au laboratoire ; combiner pistes pour réduire les systèmes à scanner.|Objets scientifiques, carte et artéfacts.|DLC / Legendary.|LEV,MISSIONS
GARNEAU|Leviathan: Find Garneau / Mahavid|L’enquête mène à Mahavid.|Minerie silencieuse, travailleurs étranges et fuite ; le doute progresse via objets et regards.|Astéroïde, mine et logements industriels.|Première piste de Leviathan.|LEV,MISSIONS
ANN|Leviathan: Find Ann Bryson / Namakli|Ann Bryson doit être retrouvée.|Sauvetage sous pression avec chemins de réparation ; permettre une dernière inspection de preuve après sécurisation.|Falaises, fouilles et base précaire.|Après première visite laboratoire.|LEV,MISSIONS
LEV-LAB|Citadel: Leviathan II / III|Le laboratoire sert plusieurs étapes.|Graphe d’enquête conservant les filtres précédents ; le choix concernant Ann n’efface pas les indices.|Table centrale et filtres holographiques.|Deux retours narratifs regroupés dans cette fiche.|LEV,MISSIONS
DESPOINA|Leviathan: Scan Locations / Despoina|L’enquête aboutit à Despoina.|Épaves de surface puis plongée en méca ; pression et oxygène comme réglages originaux facultatifs, pas faits de statistiques.|Océan, coques et obscurité sous-marine.|Conclusion Leviathan.|LEV,MISSIONS,EA-LEV
OMEGA-BRIEF|Citadel: Aria T’Loak|Aria recrute Shepard pour Omega.|Briefing avant départ avec verrou d’équipe annoncé ; la sélection permanente n’apparaît pas pendant ce DLC.|Navette, Aria et plan d’invasion.|DLC / Legendary.|OMEGA-START
OMEGA|Omega: Aria T’Loak|Aria reprend la station à Cerberus.|Assaut, bunker, tunnels, Talons, réacteur puis Afterlife ; séparer morale d’Aria, civils et reddition finale.|Station occupée, champs de force et Adjutants.|Aria et Nyreen temporaires ; retour libre limité.|OMEGA,EA-OMEGA
CIT-SHORE|Citadel: Shore Leave|Le DLC Citadel commence pendant une permission.|Installer appartement et rencontre au restaurant ; aucune position après-fin canonique imposée.|Silversun Strip, appartement et restaurant.|Pendant la campagne, avant verrou final.|CIT-DLC,BW-CITADEL
CIT-AMBUSH|Citadel Wards: Ambush|Shepard subit une attaque.|Fuite avec arsenal limité puis rassemblement des alliés ; routes latérales et couvert léger.|Restaurant endommagé, rues basses et parkings.|DLC Citadel.|MISSIONS,CIT-DLC
CIT-IDENTITY1|Citadel: Identity Theft I|Enquête sur le complot.|Débriefing à l’appartement, équipe et choix de partenaire pour la soirée ; ne pas doubler les scènes avec compagnons absents.|Appartement converti en poste d’enquête.|DLC Citadel.|MISSIONS
CIT-CASINO|Silver Coast Casino: Infiltration|L’enquête traverse un casino.|Phase sociale, capteurs et partenaire ; navigation discrète sans combat imposé.|Salle de jeu, éclairage or et caméras.|DLC Citadel.|MISSIONS,BW-CITADEL
CIT-IDENTITY2|Citadel: Identity Theft II|La piste conduit aux archives.|Débriefing de groupe et préparation de l’assaut ; conversation de romance sélectionnée par état.|Appartement et carte d’archives.|DLC Citadel.|MISSIONS
CIT-ARCHIVES|Citadel Archives: Escape|Le groupe entre dans les archives.|Combats à équipes multiples et découverte du clone ; parallèles de groupe représentés par événements précis.|Salles de mémoire, hologrammes et passerelles.|DLC Citadel.|MISSIONS,BW-CITADEL
CIT-NORMANDY|Citadel Docks: Retake the Normandy|Le complot menace le Normandy.|Assaut de soute et duel clone/Brooks ; contre-mesures selon classe du clone, médi-gel visible.|Normandy envahi et rampe de soute.|DLC Citadel.|MISSIONS,CLONE,BROOKS
CIT-PARTY|Citadel: Party|La permission permet une fête d’équipage.|Invitations conditionnelles, phases d’ambiance et photo de groupe ; positions sans collision et chronologie explicite.|Appartement, musique originale et souvenirs.|Personnages vivants et invités uniquement.|MISSIONS,BW-CITADEL
''',priority='P0')

c.rows('side_quests','''
RACHNI|Attican Traverse: Krogan Team / The Rachni|Une équipe krogan manque à l’appel.|Exploration de tunnels, flammes contre membranes et choix de reine ; suivre survie de Grunt séparément de l’équipe.|Cavernes rachni et structures Moissonneurs.|Titre selon choix ME1.|RACHNI
PLATOON|Tuchanka: Turian Platoon|Un peloton turien doit être secouru.|Traversée de ruines à menaces aériennes ; dernier combat ouvre l’alerte de bombe.|Ruines et vaisseau turien abattu.||PLATOON
BOMB|Tuchanka: Bomb|Victus désamorce une bombe.|Défendre le technicien contre assauts latéraux ; annoncer les transporteurs et garder un abri de secours.|Plateforme de bombe et piliers.|Mission à échéance de progression.|BOMB,GUIDE
GRISSOM|Grissom Academy: Emergency Evacuation|L’Académie subit une attaque Cerberus.|Sauver les groupes d’élèves puis évacuer ; écoles de combat et choix d’emploi des élèves séparés.|Salles de classe, verrière et défenses biotiques.|À terminer dans sa fenêtre de campagne.|GRISSOM
ARRAE|Arrae: Ex-Cerberus Scientists|Des scientifiques demandent une évacuation.|Réparer communications, défendre civils et couvrir la navette ; priorité de menace claire.|Avant-poste Cerberus retourné et plateau rocheux.||ARRAE
KALLINI|Kallini: Ardat-Yakshi Monastery|Le monastère contient des survivantes.|Enquête silencieuse, grand hall et sortie explosive ; interruption de Samara accessible.|Monastère asari, noir profond et architecture sobre.||KALLINI
KORIS|Rannoch: Admiral Koris|L’amiral Koris est recherché.|Détruire défenses puis choisir extraction ; les personnes sauvées influent séparément sur la flotte.|Base et crash quarian.|Avant Priority: Rannoch.|RANNOCH
FIGHTERS|Rannoch: Geth Fighter Squadrons|Shepard entre dans le consensus geth.|Nettoyage virtuel simplifié, fragments de mémoire et retour clair au monde réel.|Espace blanc, lignes de données et reconstitutions.|Avant Priority: Rannoch.|FIGHTERS
N7-LAB|N7: Cerberus Lab|Mission N7 de laboratoire.|Récupérer preuves puis tenir l’extraction ; inclure la formule médicale dans un point distinct.|Installation de Sanctum et neige.||ALIEN-MED,GUIDE
N7-ABDUCTIONS|N7: Cerberus Abductions|Mission N7 d’enlèvements.|Secourir civils à plusieurs points ; interdire une victoire qui ignore le dernier groupe.|Ville et navettes Cerberus.||GUIDE
N7-ATTACK|N7: Cerberus Attack|Mission N7 sur Tuchanka.|Rétablir un canon puis repousser la riposte ; télégraphier les consoles désactivées.|Cour industrielle et artillerie.||GUIDE
N7-FIGHTER|N7: Cerberus Fighter Base|Mission N7 d’aérodrome.|Neutraliser appareils et sécuriser les commandes ; éviter la confusion entre objectif et décoration aérienne.|Base enneigée, hangars et pistes.||GUIDE
N7-REACTOR|N7: Fuel Reactors|Mission N7 de réacteurs.|Réacheminer le carburant et protéger les intervenants ; signaux de fuite lisibles avec effets réduits.|Réacteur et conduites vertes.||MISSIONS
N7-COMMS|N7: Communication Hub|Mission N7 de communications.|Désactiver des nœuds à distance puis extraction ; les renforts viennent de routes marquées.|Antenne et plateformes rocheuses.||MISSIONS
ARIA-BLOOD|Aria: Blood Pack|Recrutement de mercenaires pour Aria.|Scène de négociation distincte d’Omega DLC ; résultat ajoute une contribution une seule fois.|Bar et rencontre de faction.||CITADEL
ARIA-BLUE|Aria: Blue Suns|Recrutement de mercenaires pour Aria.|Choisir méthode d’accord ; enregistrer conditions et interlocuteur final.|Docks et contacts militaires.||CITADEL
ARIA-ECLIPSE|Aria: Eclipse|Recrutement de mercenaires pour Aria.|Enquête entre C-Sec et dirigeant ; séparer libération et succession interne.|Bureau C-Sec et bar.||CITADEL
HANAR|Citadel: Hanar Diplomat|Enquête de diplomate hanari.|Suivre les terminaux dans l’ordre de preuve ; Kasumi apparaît seulement sous ses conditions.|Ambassades et écrans de trafic.||CITADEL
VOLUS|Citadel: Volus Ambassador|Enquête d’ambassadeur volus.|Recouper communication et rendez-vous ; Zaeed conditionnel ne devient pas compagnon permanent.|Ambassade et appartements.||CITADEL
BATARIAN|Citadel: Batarian Codes|Enquête sur des accès batariens.|Relier terminaux et suspect ; choix final conserve identité et contribution de guerre.|Postes de transit et holo-enquête.||CITADEL,WAR-ALIEN
SABOTAGE|Citadel: Medi-Gel Sabotage|Mission concernant des dispensateurs.|Inspecter plusieurs distributeurs puis signaler le responsable ; état de preuve séparé de réparation.|Camp de réfugiés et distributeurs.||CITADEL
RETRIBUTION|Citadel: Cerberus Retribution|Mission de Citadelle.|Enquête de sécurité à deux contacts ; consigner l’information sans ajouter un combat de quartier non attesté.|Secteur civil et communications.||CITADEL
STORIES|Citadel: Inspirational Stories|Mission de reportages.|Collecter des cadrages autorisés dans le camp puis valider un compte rendu original.|Points de vue sur aides et réfugiés.||CITADEL
WOUNDED|Citadel: Wounded Batarian|Un blessé peut être rencontré.|Dialogue médical et moral avec choix explicite ; ne pas récompenser la souffrance comme mini-jeu.|Hôpital, lit et respiration filtrée.||CITADEL
BARLAVON|Citadel: Barla Von|Mission fournie par Barla Von.|Piste galactique puis compte rendu ; distinguer données trouvées et personne contactée.|Banquier volus et carte de région.||CITADEL
MEDFORM|Citadel: Alien Medi-Gel Formula|Formule trouvable au laboratoire Cerberus.|Objet de mission récupérable via réquisitions s’il est manqué ; retour auprès du docteur à la bonne période.|Datapad et bureau de Dr. Ravin.|Échéance avant Tuchanka.|ALIEN-MED
BIOTIC-AMP|Citadel: Biotic Amp Interfaces|Mission de données d’amplificateur.|Ramener le schéma trouvé à l’hôpital ; afficher sa provenance Grissom et solution de rattrapage à vérifier.|Schéma et poste médical.||CITADEL
TURRET|Citadel: Cerberus Automated Turret Schematics|Mission de plans de tourelles.|Faire correspondre plans de mission et demande après coup d’État ; acquisition et remise séparées.|Datapad de mécanisme.||CITADEL,GUIDE
CIPHERS|Citadel: Cerberus Ciphers|Mission de codes Cerberus.|Déposer des codes au bon contact ; état unique même si le joueur acquiert d’abord l’objet.|Écran de décryptage.||CITADEL
POISON|Citadel: Cerberus Turian Poison|Mission de traitement d’un poison.|Retour médical après découverte ; preuve présentée sans inventer une recette réelle.|Dossier de soins turien.||CITADEL
CHEMICAL|Citadel: Chemical Treatment|Mission de traitement chimique.|Suivre demande, donnée et restitution ; journal précise le lieu de retour.|Hôpital et fiche de laboratoire.||CITADEL
GX12|Citadel: GX12 Thermal Pipe|Mission d’une pièce pour le Normandy.|Achat puis remise à l’ingénierie ; capacité du vaisseau actualisée une fois.|Tuyau thermique identifiable.||CITADEL
HEATING|Citadel: Heating Unit Stabilizers|Mission de stabilisateurs.|Récupérer matériel ou voie de rattrapage confirmée ; présenter l’usage civil de l’objet.|Pièce de chauffage dans caisse.||CITADEL
GRID|Citadel: Improved Power Grid|Mission d’un réseau électrique.|Remettre un schéma à l’interlocuteur ; l’effet de guerre n’écrase pas un ancien résultat.|Schéma de distribution.||CITADEL
FOSSIL|Citadel: Kakliosaur Fossil|Mission d’un fossile.|Scan galactique et restitution ; séparer découverte scientifique et contribution finale.|Échantillon fossilisé.||CITADEL
MESSAGE|Citadel: Krogan Dying Message|Message récupérable dans l’arc rachni.|Restitution personnelle avec lecture facultative ; l’objet n’est ni vendable ni destructible.|Enregistrement krogan.||CITADEL,RACHNI
REAPER-CODE|Citadel: Reaper Code Fragments|Mission de données.|Récupérer fragments du consensus puis livrer ; distinguer information de guerre et souvenir geth.|Paquets de code et motif réseau.||CITADEL,FIGHTERS
JAMMER|Citadel: Target Jamming Technology|Mission de brouillage.|Retour au contact après mission de Rannoch ; état de fin reste cohérent si remise tardive autorisée.|Module d’antenne compact.||CITADEL
WIDOW|Citadel: Asari Widow|Message destiné à une veuve.|Scène de remise sobre et brève ; aucune récompense spectaculaire pendant le deuil.|Datapad et banc de Citadelle.||CITADEL,KALLINI
MEDSUPPLY|Citadel: Medical Supplies|Mission d’approvisionnement médical.|Négociation entre fournisseurs et équipage médical ; registre de stock sans combat ajouté.|Caisses de medi-gel.||CITADEL
APIEN|Apien Crest: Banner of the First Regiment|Mission de récupération galactique.|Repérer la bannière par scan puis livrer au contact ; les ressources trouvées restent distinctes du drapeau.|Bannière turienne.|Références de planète exactes à compléter.|CITADEL
ATHENA|Athena Nebula: Hesperia-Period Statue|Mission de récupération galactique.|Scan ciblé et objet culturel ; retour à la personne demandeuse.|Statue asari sur socle.||CITADEL
BENNING|Benning: Evidence|Mission de preuve sur Benning.|Prélèvement et retour personnel ; vérifier que le document demeure accessible après N7.|Preuve dans un quartier évacué.||CITADEL
DEKUUNA-CODE|Dekuuna: Code of the Ancients|Mission culturelle elcor.|Récupérer des données patrimoniales et les restituer sans les convertir en artefact de combat.|Tablette elcor.||CITADEL
DEKUUNA-RESCUE|Dekuuna: Elcor Extraction|Mission d’extraction elcor.|Expédition sur carte avec état de secours et compte rendu ; ne pas créer un niveau non existant comme canon.|Carte de secours et vaisseaux lourds.||CITADEL
HADES-OBELISK|Hades Nexus: Obelisk of Karza|Mission d’objet ancien.|Scan, inventaire de quête puis retour ; afficher le nom entier pour éviter confusion avec l’autre obélisque.|Obélisque sur vignette.||CITADEL
HADES-SPHERE|Hades Nexus: Prothean Sphere|Mission d’objet prothéen.|Circuit galactique sans combat imposé ; validation de provenance et interlocuteur.|Sphère métallique ancienne.||CITADEL
IRUNE|Irune: Book of Plenix|Mission culturelle volus.|Retour d’un texte à son demandeur ; ne pas reproduire de texte source complet.|Volume scellé et pictogramme volus.||CITADEL
ISMAR|Ismar Frontier: Prototype Components|Mission de composants.|Scan et remise avant échéance ; objet de quête distinct des matériaux usuels.|Composants en caisse.||CITADEL
KITE|Kite’s Nest: Pillars of Strength|Mission culturelle batarienne.|Localiser puis remettre un artefact ; noter contexte de réfugiés.|Objet de tradition et emballage de voyage.||CITADEL
NIMBUS|Nimbus Cluster: Library of Asha|Mission d’archives.|Récupérer données culturelles ; entrée de codex séparée du bonus de guerre.|Support numérique d’archive.||CITADEL
SHRIKE|Shrike Abyssal: Prothean Obelisk|Mission d’obélisque prothéen.|Nom complet affiché sur objet et remise ; aucun partage d’ID avec Karza.|Monolithe sur carte d’inventaire.||CITADEL
SILEAN|Silean Nebula: Rings of Alune|Mission d’artefacts.|Scan puis remise ; plusieurs anneaux restent un objet de quête cohérent.|Anneaux entrelacés.||CITADEL
VALHALLAN|Valhallan Threshold: Prothean Data Drives|Mission de données prothéennes.|Récupérer puis donner les supports ; progression indépendante du codex prothéen de Javik.|Petits modules anciens.||CITADEL
EDEN-RESIST|Eden Prime: Resistance Movement|Mission liée à From Ashes.|Rechercher les preuves pendant l’opération Eden Prime ; avertir au dernier passage avant extraction.|Trois groupes d’informations identifiables.|DLC / Legendary ; nombre exact à revérifier en jeu.|MISSIONS
OMEGA-HACK|Omega: Assist the Hacker|Demande locale du DLC Omega.|Activer les éléments requis pendant le trajet ; retour au bunker sans traversée répétitive ajoutée.|Terminaux et poste de résistants.|DLC Omega.|MISSIONS
OMEGA-MECH|Omega: Assist the Mechanic|Demande locale du DLC Omega.|Récupération mécanique imbriquée dans la libération ; pas de planète annexe inventée.|Outils et composants du bunker.|DLC Omega.|MISSIONS
OMEGA-HARROT|Omega: Assist Harrot|Demande locale du DLC Omega.|Recherche du souvenir d’Aria ; validation avant de quitter les zones à sens unique.|Mobilier familier au milieu des débris.|DLC Omega.|MISSIONS,OMEGA
ARMAX|Armax Arsenal Arena — accès et récompenses|Citadel ajoute le simulateur Armax.|Mode combat séparé de campagne : règles, compagnons, adversaires et récompenses affichés avant lancement.|Arène holographique et comptoir de récompenses.|DLC Citadel.|BW-CITADEL,SQUAD
''')

# Les défis sont des objectifs séparés du simulateur et ne sont pas des missions de campagne.
for key,name,rule in [
('GETH','Geth Challenge','Sélection de faction geth et critère de score ; chronomètre de simulation distinct de la mission.'),
('SPIN','Spin Zone Elite Challenge','Contraintes de carte et de score clairement exposées avant entrée ; valeurs originales à vérifier.'),
('MEDIGEL','Medi-Gel Challenge','Règle de ressource explicite avec compteur de soins ; aucune consommation sur inventaire de campagne.'),
('REAPER-SOLO','Reaper Solo Challenge','Verrou de groupe solo et faction Moissonneur affichés ; retour du roster normal à la sortie.'),
('THERMAL','Thermal Clip Challenge','Restriction de clips et suivi de réserve propre au défi ; armes sans clips gérées explicitement.'),
('PROTHEAN','Prothean Challenge','Conditions particulières présentées en fiche ; vérifier les paramètres exacts avant reproduction.'),
('CERBERUS','Cerberus Challenge','Composer des vagues Cerberus et afficher la mesure de réussite attendue.'),
('CHARITY','Charity Reaper Challenge','Contrat d’arène et bénéficiaire narratif séparés ; récompense validée une fois.'),
('UNUSUAL','Unusual Scores','Suite d’anomalies et rencontre de simulation ; tous les adversaires demeurent des copies holographiques.')]:
    c.add('side_quests','ARENA-'+key,'Citadel Arena: '+name,'Défi nommé de l’arène Citadel.',rule,visual='Interface de simulateur, paramètres de vague et score.',conditions='Simulateur Armax uniquement ; paramètres détaillés à vérifier dans l’édition choisie.',source='MISSIONS',reference='Mass Effect 3: Citadel — missions d’arène',dependencies=[c.ident('side_quests','ARMAX')])

c.rows('worlds','''
EARTH|Terre|Lieu du prologue et de l’assaut final.|Deux cartes temporelles séparées, Vancouver et Londres ; ne pas raccorder physiquement des villes par une porte.|Ville de départ puis métropole dévastée.||GUIDE,EARTH
MARS|Mars|Les archives recèlent les données du Creuset.|Carte de recherche et de poursuite ; climat et surface lointaine restent décoratifs hors zones praticables.|Poussière rouge et laboratoire sous neige.||GUIDE
CITADEL|Citadelle|Hub politique et civil de ME3.|État avant/après coup d’État et accès DLC ; groupes de réfugiés changent au fil de la guerre.|Blanc, bleu, foule et signes d’urgence.||CITADEL
MENAE|Menae / front de Palaven|Le secours du primarque se déroule sur Menae.|Front lunaire en progression circulaire ; Palaven sert de repère au ciel sans zone jouable inventée.|Roche lunaire et planète en flammes.||GUIDE
SURKESH|Sur’Kesh|Installation galarienne de l’escorte.|Bloc vertical de laboratoire avec jungle en profondeur ; la capsule relie les étages de mission.|Verts, blanc clinique et terrasses.||GUIDE
TUCHANKA|Tuchanka|Plusieurs opérations s’y déroulent.|Cartes de ruines, bombe et Shroud reliées uniquement par missions ; variété de couleurs sans fausse continuité géographique.|Ocre, pierre ancienne et ciel de bataille.||TUCH,BOMB,PLATOON
UTUKKU|Utukku|Lieu de l’équipe krogan disparue.|Surface froide puis cavernes ; passage continu au sein de la mission.|Rochers, membranes et noir profond.||RACHNI
GRISSOM|Académie Grissom|Site d’une évacuation.|Station scolaire à salles distinctes ; protéger la lisibilité des groupes de civils.|Coursives claires, jardin et classe.||GRISSOM
GELLIX|Gellix / Arrae|Lieu des ex-scientifiques Cerberus.|Avant-poste de hauteur et zones d’atterrissage ; deux routes de secours.|Roche et bâtiments industriels.||ARRAE
LESSUS|Lessus / Kallini|Lieu du monastère Ardat-Yakshi.|Approche sombre et intérieur silencieux ; lumière d’objectif indépendante de la lampe du personnage.|Temple asari, montagnes et ruines.||KALLINI
RANNOCH|Rannoch|Monde central du conflit geth/quarian.|Trois opérations terrestres distinctes ; progression de guerre actualise la carte.|Montagnes désertiques et architecture geth.||RANNOCH,FIGHTERS
THESSIA|Thessia|Monde asari attaqué.|Itinéraire urbain vers temple ; silhouettes de dévastation séparées des unités ciblables.|Bleu asari, statues, fumée et ciel de guerre.||THESSIA
HORIZON|Horizon — Sanctuary|Site d’un centre Cerberus dissimulé.|Contraste accueil civil/laboratoire ; toutes les preuves restent rattachées à Sanctuary.|Blanc, eau, couloirs et sous-sol technique.||HORIZON
EDEN|Eden Prime|Monde du DLC From Ashes.|Zone de colonie et fouilles ; capsule en destination centrale lisible.|Vert, préfabriqués et technologie prothéenne.||EA-ASHES,MISSIONS
OMEGA|Omega occupée|Cerberus occupe la station.|Cartes de résistance et reprise ; les anciens hubs ME2 ne deviennent pas tous accessibles automatiquement.|Métal, néons et champs Cerberus.||EA-OMEGA,OMEGA
MAHAVID|Mahavid|Destination de Leviathan.|Mine d’astéroïde en boucles courtes, espace social étrange puis combat.|Gris poussiéreux, machines et regards fixes.||LEV
NAMAKLI|Namakli|Destination de secours d’Ann.|Verticalité de chantier, réparation et défenses ; les échelles ne bloquent pas les compagnons.|Falaises et plateformes scientifiques.||LEV
DESPOINA|Despoina|Destination finale de Leviathan.|Surface d’épaves puis fond marin en séquence séparée ; volume sous-marin non assimilé à l’espace.|Océan sombre, épaves et lueurs abyssales.||LEV
CERBERUS|Station de Cerberus|Quartier général attaqué avant la Terre.|Structure militaire en plusieurs secteurs ; retour galactique verrouillé après engagement.|Blanc Cerberus, noir et orange d’alarme.||HQ
CRUCIBLE|Creuset et Citadelle finale|Le Creuset porte la décision finale.|Espace de récit final sans boutons de combat ; conserver options et conditions dans un résumé clair.|Lumière blanche et vues sur Terre.||EARTH
''')

c.rows('zones','''
NORM-CIC|Normandy — CIC et salle de guerre|Centre de commandement de ME3.|Carte et actifs de guerre séparés ; passerelle ne bloque jamais la route vers une conversation urgente.|Alliance bleu/gris, hologrammes et table de briefing.||GUIDE
NORM-HANGAR|Normandy — hangar|Zone de préparation de terrain.|Atelier d’armes, navette et contacts de James/Cortez distincts ; pas d’ouverture de dialogue par clic d’arme.|Kodiak, caisses et banc d’armes.||SQUAD
NORM-CREW|Normandy — espaces d’équipage|Équipiers vivent à bord.|Placement dynamique après mission avec minimap de recherche ; conserver la vie quotidienne sans forcer la tournée.|Infirmerie, mess, salon et cabines.||SQUAD
CIT-DOCKS|Citadelle — docks et réfugiés|Secteur de demandes civiles.|Foule à couloirs libres ; conversations de quête signalées sans les masquer dans l’ambiance.|Containers, lits et arrivées de navettes.||CITADEL
CIT-EMBASSY|Citadelle — ambassades|Hub diplomatique et Spectre.|Réquisitions, décisions administratives et Conseil sont trois interactions ; titres clairs.|Blanc, panneaux diplomatiques et bureaux.||CITADEL
CIT-HOSP|Hôpital Huerta|Lieu de soins et de retrouvailles.|Conversations conditionnelles par lit ; mission de données distincte des visites personnelles.|Lumière clinique et baies vitrées.||HUERTA
CIT-COMMONS|Présidium — Commons|Secteur social de Citadelle.|Marchands et appartements proches ; état de fréquentation suit la guerre.|Terrasses blanches et eau.|Les scènes de rencontres exigent leur propre fenêtre.|CITADEL
CIT-PURGATORY|Purgatory — bar de ME3|Bar de Citadelle.|Ne pas utiliser le modèle du vaisseau prison ME2 ; contacts d’Aria et Jack par position fixe.|Lumière violette et piste de danse.||CITADEL
MARS-ARCHIVE|Mars — archives|Site des données du Creuset.|Combats de couloirs et baie de tempête ; faux murs techniques non utilisables comme couvert.|Rouge au-dehors, blanc clinique dedans.||GUIDE
MENAE-CAMP|Menae — camp turien|Front du secours de Victus.|Centre de commandement et plusieurs sorties, menace de brute par entrée annoncée.|Batteries, tentes et fumées.||GUIDE
SURKESH-LAB|Sur’Kesh — laboratoire vertical|Capsule d’Eve à évacuer.|Étages reliés par ascenseurs de capsule ; les ennemis attaquent les flancs sans téléportation invisible.|Végétation et consoles galariennes.||GUIDE
SHROUD|Tuchanka — Shroud|La cure passe par la tour.|Montée narrative, sabotage et conclusion ; garder le combat géant à distance de l’intérieur.|Tour atmosphérique et ruines sacrées.||TUCH
TUCH-BOMB|Tuchanka — site de la bombe|Zone de désamorçage.|Couverture en anneau et défense de l’officier ; arme lourde locale marquée comme temporaire.|Pylônes et dispositif sous ruines.||BOMB
RACHNI-TUNNEL|Utukku — tunnels rachni|La reine est au fond des tunnels.|Coulées organiques, sacs de swarmer et poche de reine ; les flammes dégageant le chemin restent distinctes du tir d’arme.|Membranes et halos Moissonneurs.||RACHNI
GRISSOM-ATRIUM|Grissom — atrium|L’évacuation traverse les salles d’école.|Deux niveaux avec défenses d’élèves ; les silhouettes civiles utilisent des marques de non-cible.|Jardin intérieur, vitres et classe détruite.||GRISSOM
ARRAE-BASE|Gellix — camp scientifique|Les civils attendent l’extraction.|Périphérie de tourelle et toit de communication ; routes d’évacuation réservées.|Containers et laboratoire de fortune.||ARRAE
KALLINI-HALL|Monastère — grand hall|Falere recherche Rila.|Salle sombre avec repères fixes ; Banshee audible et visible avant entrée dans la zone proche.|Grand volume asari et piliers.||KALLINI
GETH-DREAD|Cuirassé geth — canon|Mission d’assaut du cuirassé.|Impulsions périodiques annoncées au sol ; abris ne cachant pas la jauge de charge.|Canon central bleu et surfaces synthétiques.||MISSIONS
GETH-CONSENSUS|Consensus geth|Le joueur visite un espace virtuel.|Traversée en couche séparée ; arme de débogage sans inventaire de campagne et fragments de mémoire non tirables.|Blanc numérique et chemins de données.||FIGHTERS
RANNOCH-BASE|Rannoch — base du Moissonneur|Site de confrontation planétaire.|Trois arènes jusqu’au ciblage de vaisseau ; mode d’aide de visée du boss proposé.|Structures geth, plateaux et grand rayon.||RANNOCH
THESSIA-TEMPLE|Thessia — temple d’Athame|Vendetta est révélée au temple.|Indices architecturaux puis activation ; dialogues de Javik conditionnels sans le rendre obligatoire.|Statues asari et hologramme prothéen.||THESSIA
SANCTUARY|Horizon — accueil et laboratoires|Sanctuary cache son programme.|Parcours de dévoilement en couches ; panneaux de bienvenue contrastent avec équipement de recherche.|Blanc rassurant puis noir technique.||HORIZON
HQ-HANGAR|Cerberus — hangar et archives|L’assaut mène aux données de Cerberus.|Hangar d’Atlas, passerelles puis salle Kai Leng ; écran de verrou final avant embarquement.|Navettes, vidéos et bureaux.||HQ
LONDON-FOB|Londres — base avancée|Point de préparation avant l’attaque.|Derniers entretiens, composition et tirs de soutien ; la validation de départ est distincte des adieux.|Ruines, radio et alliés rassemblés.||EARTH
LONDON-MISSILES|Londres — batterie de missiles|Le final comporte une défense lourde.|Survie jusqu’à fenêtre de tir ; zones de menace des Banshees et Brutes visibles entre vagues.|Rue détruite, lanceur et barricades.||EARTH
BEAM|Londres — course au faisceau|Le faisceau conduit à la Citadelle.|Séquence d’assaut narrative avec contrôle limité annoncé ; pas de récompense d’optimisation cachée.|Rayon vertical, ombres de Moissonneur et sol détruit.||EARTH
BRYSON-LAB|Citadelle — laboratoire Bryson|Base de l’enquête Leviathan.|Table à filtres, archives et artéfacts ; les indices importants restent cliquables sans pixels minuscules.|Objets scientifiques et baie sur Citadelle.||LEV
LEV-OCEAN|Despoina — épaves et abîme|La rencontre Leviathan est sous-marine.|Défense d’épaves puis descente encadrée ; définir un horizon de vision cohérent sous l’eau.|Océan noir et coque de méca.||LEV
OMEGA-BUNKER|Omega — bunker d’Aria|QG de la résistance.|Contacts, table de carte et demandes locales ; retour permis seulement aux étapes valides.|Bunker de fortune et écrans anciens.||OMEGA
OMEGA-TUNNELS|Omega — tunnels et réacteur|La libération traverse les entrailles.|Alternance Ramparts et Adjutants ; générateurs identifiés avant interruption d’alimentation.|Conduites, obscurité et champs de force.||OMEGA
OMEGA-AFTERLIFE|Omega — Afterlife occupé|Confrontation finale de l’extension.|Anneau de consoles et générateurs ; libérer Aria puis traiter Petrovsky sans nouveau combat superflu.|Club transformé en poste de commandement.||OMEGA
SILVERSUN|Silversun Strip|Zone sociale du DLC Citadel.|Casino, arène et activités dans un hub compact ; nom et fonction à chaque entrée.|Néons, façade luxueuse et foule festive.||BW-CITADEL
APARTMENT|Appartement de Shepard|Lieu de rencontres et de fête.|Pièces à capacité définie ; invitations déterminent sièges, photographies et petites scènes.|Terrasse, cuisine, salon et souvenirs.||BW-CITADEL
CASINO|Silver Coast Casino|Lieu d’infiltration.|Points sociaux et accès de maintenance en boucle courte ; caméras comme indices d’enquête.|Or, verre et lumière de jeu.||BW-CITADEL
ARCHIVES|Archives du Conseil|Zone de combat du DLC.|Mémoire historique et combat en cours séparés visuellement ; absence de collisions avec hologrammes.|Plates-formes et reconstitutions bleues.||BW-CITADEL
ARMAX|Armax Arsenal Arena|Simulateur du DLC Citadel.|Chargeur de carte, modificateurs et tableau de scores ; état de simulation ne fuit pas dans la campagne.|Grille holographique et barrières de match.||BW-CITADEL
''')

c.rows('lore','''
REAPERS|Moissonneurs — invasion|L’invasion structure la campagne.|Séparer connaissance du joueur, renseignements alliés et révélations tardives ; codex évolutif sans spoiler automatique.|Cartes de fronts et silhouettes gigantesques.||GUIDE
CRUCIBLE|Projet Creuset|Les plans de Mars lancent le projet.|Suivre recherche, construction et coalition par des entrées distinctes ; aucun pourcentage technique canon inventé.|Plans holographiques et stations de chantier.||GUIDE
CATALYST|Catalyseur|Son identité se précise dans le final.|Entrée verrouillée avant la révélation ; distinguer théorie des personnages et information de fin.|Icône masquée puis motif de Citadelle.||EARTH
GENOPHAGE|Génophage et remède|Tuchanka résout l’arc du remède.|Frise des causes et décisions importées ; afficher les points de vue krogan, turien et galarien sans score moral universel.|Échantillons et portraits politiques.||TUCH
QUARIAN-GETH|Guerre quariens/geth|Rannoch confronte les deux peuples.|Dossier à deux témoignages ; les souvenirs du consensus et les décisions présentes restent séparés.|Flottes opposées et mémoire numérique.||RANNOCH,FIGHTERS
CERBERUS|Cerberus — force ennemie|Cerberus mène des opérations militaires.|Distinguer soldats, scientifiques déserteurs, dirigeants et victimes de Sanctuary ; faction ne signifie pas identité individuelle uniforme.|Emblème noir/orange et chaînes de commandement.||HQ,HORIZON,ARRAE
INDOCTRINATION|Endoctrinement|Le contrôle des Moissonneurs intervient dans l’intrigue.|Indices narratifs contextualisés ; ne pas présenter une théorie sur Shepard comme conclusion officielle.|Parasites d’image modérés et dossier de preuves.||HQ,EARTH
PROTHEANS|Héritage prothéen|Javik et les archives éclairent le cycle antérieur.|Séparer mémoire de Javik, données de Vendetta et croyances asari ; lignes de dialogue selon interlocuteur présent.|Reliefs et hologrammes distincts.||EA-ASHES,THESSIA
ASARI-TEMPLE|Temple d’Athame|Le temple dissimule une technologie prothéenne.|Inspection à étapes révélant liens culturels ; aucun changement rétroactif de toute la culture asari à partir d’un seul indice.|Statue et balise cachée.||THESSIA
LEVIATHANS|Léviathans|Le DLC traite l’origine des Moissonneurs.|Codex de révélation en fin d’enquête ; apparitions et artefacts ne deviennent pas un pouvoir libre de Shepard.|Masses abyssales et orbes.||EA-LEV,BW-LEV
TALONS|Talons d’Omega|Nyreen dirige une résistance locale.|Fiche de faction avec civils protégés, postes et relations à Aria ; ne pas fusionner Talons et gangs de mercenaires.|Marques de résistance et équipements disparates.||OMEGA
CAT6|Mercenaires CAT6|Groupe impliqué dans le complot Citadel.|Faction de l’extension isolée des forces Cerberus ; réutiliser les catégories tactiques sans reprendre leurs identités.|Armures tactiques sombres.||CAT6,CIT-DLC
SPECTRES|Spectres et réquisitions|Le statut de Shepard ouvre des ressources.|Terminal de décision : autoriser, acheter ou lire sont des opérations différentes ; historique de chaque validation.|Console diplomatique et accès sécurisé.||CITADEL
REFUGEES|Réfugiés de guerre|La Citadelle accueille des déplacés.|Récits courts avec états de mission et changements de foule ; pas de réduction de chaque personne à un point de guerre.|Lits, bagages et arrivées.||CITADEL
ALLIANCE|Alliance et coalition|La reconquête nécessite plusieurs forces.|Registre de contributions relié aux missions qui les justifient ; drapeaux d’espèce et organisation distincts.|Salle de guerre et logos alliés.||GUIDE,WAR-ALIEN
ARMAX-FICTION|Simulations Armax|L’arène propose des ennemis simulés.|Étiquette permanente de simulation ; adversaires impossibles dans la campagne ne modifient pas le codex des événements réels.|Trame holographique discrète.||BW-CITADEL
''')

# Ennemis : une fiche de rôle et une fiche de mouvement spécifique, sans statistiques originales reconstituées.
enemy_data='''
ASSAULT|Cerberus Assault Trooper|Fantassin Cerberus.|Avance de couvert en couvert et lance une grenade de délogement ; sortie sûre affichée avant résolution.|Armure blanche, noir et visière rouge.|Campagne et simulation.|PHANTOM
CENTURION|Cerberus Centurion|Unité Cerberus.|Fumée de protection et rafale ; son écran brouille la visée mais jamais les marqueurs de menace du fan game.|Armure renforcée et fumigène.|Campagne et simulation.|PHANTOM
ENGINEER|Cerberus Combat Engineer|Unité de soutien Cerberus.|Pose une tourelle à un emplacement annoncé ; interrompre le montage évite l’activation, détruire l’ingénieur ne téléporte pas l’objet.|Omni-outil et sac technique.|Campagne et simulation.|PHANTOM
GUARDIAN|Cerberus Guardian|Porteur de bouclier.|Avancée frontale ; flanc et ouverture de tir clairement prévisualisés, résistance ne se réduit pas à une santé arbitraire.|Bouclier rectangulaire à meurtrière.|Campagne et simulation.|PHANTOM
NEMESIS|Cerberus Nemesis|Tireuse de précision.|Marque sa cible par laser avant tir ; briser la ligne ou l’interrompre annule la charge.|Silhouette fine et viseur rouge.|Campagne et simulation.|PHANTOM
PHANTOM|Cerberus Phantom|Assaillante rapprochée.|Approche furtive, barrière puis attaque de lame ; prise létale originale convertie en saisie télégraphiée avec possibilité de secours.|Lame, corps agile et voile de camouflage.|Campagne et simulation.|PHANTOM
ATLAS|Atlas|Méca Cerberus piloté.|Missile de zone, canon puis récupération ; pilote visible comme point ciblable si la rencontre autorise cette interaction.|Cockpit vitré et châssis massif.|Campagne ; variantes de pilotage à vérifier.|PHANTOM
TURRET|Tourelle Cerberus|Construction de l’ingénieur.|Pivot limité et cône de suppression ; l’interface montre sa ligne de tir même derrière un sprite allié.|Trépied et canon automatique.|Campagne et simulation.|PHANTOM
EVA|Dr Eva Coré — confrontation|Antagoniste de Mars.|Course avec jalons de poursuite puis confrontation courte ; aucun combat d’endurance inventé comme événement source.|Corps androïde sous identité médicale.|Mars uniquement.|GUIDE
KAI|Kai Leng|Boss récurrent de Cerberus.|Rush de lame et phases de protection ; afficher ce qui relève d’une phase narrative invulnérable et ce qui peut être interrompu.|Lame, armure sombre et visière.|Thessia et QG ; tables de phases distinctes.|KAI
RAMPART|Rampart Mech|Robot rencontré dans Omega.|Avance directe et rafale ; un noyau de faiblesse proposé encourage la rotation du groupe autour des couverts.|Robot bipède blanc et rouge.|DLC Omega.|OMEGA
ADJUTANT|Adjutant|Créature d’Omega.|Bond à zone d’arrivée visible, projectile puis ruée ; empêcher deux saisies simultanées non évitables dans couloir.|Masse déformée, membres allongés et lueur interne.|DLC Omega.|OMEGA
HUSK|Husk|Infanterie transformée des Moissonneurs.|Course de contact et encerclement ; grappin contestable par allié et indicateur de pression plutôt que spam de touche.|Silhouette humanoïde et implants bleus.|Campagne et simulation.|MARAUDER
CANNIBAL|Cannibal|Infanterie des Moissonneurs.|Tir, grenade et consommation de cadavre ; annoncer le gain de protection, neutraliser le cadavre comme interaction facultative.|Corps massif et arme greffée.|Campagne et simulation.|MARAUDER
MARAUDER|Marauder|Unité de soutien des Moissonneurs.|Renforce les voisins compatibles et tire en couverture ; aura de soutien relie visuellement les bénéficiaires.|Traits turiens et carapace synthétique.|Campagne et simulation.|MARAUDER
BRUTE|Brute|Unité lourde des Moissonneurs.|Charge en couloir puis balayage ; zone d’impact au sol et fenêtre latérale après collision.|Grand corps cuirassé et bras massif.|Campagne et simulation.|MARAUDER
RAVAGER|Ravager|Artillerie des Moissonneurs.|Salves à zone ciblée et sacs fragiles ; rupture des sacs libère des Swarmers à places réservées.|Pattes, canons dorsaux et poches lumineuses.|Campagne et simulation.|RAVAGER
SWARMER|Swarmer|Petite unité associée aux Ravagers.|Approche rapide par groupes limités ; indicateur collectif de danger et sélection par grappe pour ne pas viser des pixels.|Petites formes organiques au sol.|Campagne et simulation.|RAVAGER
BANSHEE|Banshee|Unité biotique des Moissonneurs.|Téléportations préparées, projectile et saisie ; halo de portée et signal sonore distinct avant menace de contact.|Silhouette asari allongée et aura biotique.|Campagne et simulation.|MARAUDER
HARVESTER|Harvester|Grande créature volante.|Passage de bombardement puis exposition au tir ; altitude visuelle séparée du point ciblable projeté au sol.|Ailes massives et carapace sombre.|Rencontres terrestres prévues.|HARVESTER
REAPER-RANNOCH|Moissonneur de Rannoch|Boss de la conclusion Rannoch.|Alternance acquisition laser et déplacement latéral ; assistances de maintien de visée et de rythme proposées.|Œil lumineux et rayon lourd.|Rannoch uniquement.|RANNOCH
GETH-TROOPER|Geth Trooper|Infanterie geth.|Tir soutenu et déplacement coordonné ; signal réseau lors du changement de cible pour lire le groupe.|Plateforme synthétique et lampe centrale.|Arc geth, Armax ou multijoueur selon rencontre.|MARAUDER
GETH-ROCKET|Geth Rocket Trooper|Unité geth à roquettes.|Charge d’un tir explosif puis récupération ; trajectoire et rayon d’explosion annoncés.|Lanceur d’épaule et optique.|Arc geth, Armax ou multijoueur selon rencontre.|MARAUDER
GETH-HUNTER|Geth Hunter|Unité geth camouflée.|Approche furtive et tir proche ; perturbation visible au sol et bruit directionnel accessibles sans vision parfaite.|Réfraction, lampe et fusil court.|Arc geth, Armax ou multijoueur selon rencontre.|MARAUDER
GETH-PYRO|Geth Pyro|Unité geth incendiaire.|Cône de feu court, rotation lente proposée ; flanquement et rupture de jet ouvrent une fenêtre de secours.|Réservoirs et tuyau de flamme.|Arc geth, Armax ou multijoueur selon rencontre.|MARAUDER
GETH-PRIME|Geth Prime|Plateforme geth lourde.|Tir lourd et soutien de machines ; limites de créations actives pour conserver une arène lisible.|Châssis imposant et optique rouge.|Arc geth, Armax ou multijoueur selon rencontre.|MARAUDER
GETH-TURRET|Tourelle geth|Défense synthétique.|Conserve l’orientation acquise pendant préparation ; pas de pivot instantané vers une cible hors de son arc.|Dispositif compact et lumière geth.|Rencontres et simulations compatibles.|MARAUDER
CAT6-MERC|CAT6 Mercenary|Mercenaire de Citadel.|Rafale et grenade de délogement ; marquage d’équipe propre à CAT6 malgré gabarit humain partagé.|Armure sombre et casque.|DLC Citadel / Armax.|CAT6
CAT6-SPECIALIST|CAT6 Specialist|Technicien CAT6.|Déploie un Disruption Drone ; un lien de commande discret facilite l’identification de la source.|Armure technique et omni-outil.|DLC Citadel.|CAT6
CAT6-HEAVY|CAT6 Heavy|Unité CAT6 protégée.|Avance avec protection frontale ; contourner ou interrompre la posture expose une fenêtre de tir.|Grand bouclier énergétique et silhouette lourde.|DLC Citadel.|CAT6
DISRUPTION|Disruption Drone|Drone CAT6.|Approche et perturbation locale ; zone de brouillage n’empêche jamais d’ouvrir le menu accessible.|Sphère volante et arc d’énergie.|DLC Citadel.|CAT6
CLONE|Clone de Shepard|Antagoniste de Citadel.|Construire un miroir de la classe sélectionnée avec télégraphes propres ; ses soins et changements de phase sont visibles.|Ressemblance Shepard, tenue et éclairage adverses.|DLC Citadel ; classe du joueur prise en compte.|CLONE
BROOKS|Maya Brooks — combat|Antagoniste de Citadel.|Tir de soutien pendant duel du clone ; la cibler interrompt son appui sans faire disparaître la scène de reddition.|Tenue tactique et arme de précision.|DLC Citadel.|BROOKS
COLLECTOR-TROOPER|Collector Trooper — simulation / multi|Les Récolteurs figurent dans Retaliation.|Tir en couverture avec possible possession de vague ; aucune présence réelle ajoutée à l’histoire ME3.|Carapace insectoïde et arme organique.|Multijoueur Retaliation ou simulation Armax uniquement.|MP
COLLECTOR-CAPTAIN|Collector Captain — simulation / multi|Unité du module Récolteurs.|Soutien de groupe et harcèlement ; possession signalée par transformation d’aura et priorité tactique.|Carapace plus visible et lueur de contrôle.|Multijoueur Retaliation / simulations prévues.|MP
ABOMINATION|Abomination — simulation / multi|Unité explosive des Récolteurs.|Course puis explosion avec zone d’évacuation ; distinguer cadavre inerte et charge encore active.|Forme humanoïde instable et pulsation.|Multijoueur Retaliation / simulations prévues.|MP
SCION|Scion — simulation / multi|Unité lourde des Récolteurs.|Onde linéaire et attaque proche ; origine du cône et fenêtre de sortie visibles depuis toute caméra.|Corps massif et bras canon.|Multijoueur Retaliation / simulations prévues.|MP
PRAETORIAN|Praetorian — simulation / multi|Unité lourde volante des Récolteurs.|Descente de protection puis rayons ; zones sûres indépendantes de sa grande image en surplomb.|Carapace volante et optiques lumineuses.|Multijoueur Retaliation / simulations prévues.|MP
DRAGOON|Cerberus Dragoon — multi|Unité Cerberus du multijoueur.|Rush et combo rapproché séparés par une préparation ; le groupe peut rompre l’approche.|Fouets énergétiques et armure sombre.|Multijoueur Retaliation ; absence de campagne imposée.|MP
'''
for line in enemy_data.strip().splitlines():
    key,name,fact,rule,look,condition,source=line.split('|')
    eid=c.add('enemies',key,name,fact,rule,visual=look,conditions=condition,source=source,
      acceptance=f'{name} : la menace décrite est annoncée avant résolution ; tester une esquive, une interruption admise et une résistance refusée avec message explicite.',
      animation='Séparer anticipation et impact : '+rule,
      audio='Créer un signal de préparation propre à cette famille, un départ d’action et un impact ; afficher un équivalent visuel du signal hors champ.')
    c.original('enemy_moves',key,'Séquence adverse — '+name,rule,look,condition,[eid],
      acceptance=f'La séquence de {name} respecte son aire de menace, conserve sa cible réservée pendant la préparation et annule proprement coût/effets si la scène change.',
      animation='Préparation orientée, événement de résolution unique, retour au contrôle ; pour bond ou charge, réserver départ et arrivée avant mouvement.',
      audio='Un seul événement de danger et un seul impact par résolution ; pas de répétition lors d’un retour de pause tactique.')

c.rows('weapons','''
AVENGER|M-8 Avenger|Fusil d’assaut.|Arme témoin : rafale stable et coût ATB modéré proposé ; calibrer les autres profils par sa lisibilité.|Carcasse Alliance compacte.||EQUIP
VINDICATOR|M-15 Vindicator|Fusil d’assaut.|Rafale courte indivisible ; la file affiche le nombre de projectiles déjà résolus avant interruption.|Fusil à cadence en salve.||EQUIP
MATTOCK|M-96 Mattock|Fusil semi-automatique.|Visée posée et dépense par coup ; garder choix entre deux cibles plutôt qu’une rafale imposée.|Crosse longue et boîtier sombre.||EQUIP
REVENANT|M-76 Revenant|Fusil d’assaut lourd.|Suppression prolongée avec stabilité croissante en couvert ; déplacement rompt l’engagement.|Large canon et chargeur massif.||EQUIP
PHAESTON|Phaeston|Fusil turien.|Rafale régulière avec silhouette et son propres ; aucune égalité automatique avec fusil humain.|Carcasse angulaire turienne.||PHAESTON
FALCON|M-37 Falcon|Lance-grenades classé fusil.|Arc de tir et zone d’impact visibles ; rebond proposé limité aux surfaces compatibles.|Canon de projectile large.||EQUIP
SABER|M-99 Saber|Fusil lourd.|Tir lent de précision ; longue récupération expose le tireur si ordre donné hors couvert.|Fusil massif à long canon.||SABER
PARTICLE|Particle Rifle|Arme prothéenne de From Ashes.|Canalisation à jauge thermique ; relâcher avant surchauffe économise la reprise, sans clip inventé.|Rayon continu et arme prothéenne.|DLC / Legendary.|PARTICLE
CHAKRAM|Chakram Launcher|Arme additionnelle de ME3.|Préparation de projectile visible ; variante de charge proposée explicite, collisions de disque testées sur arêtes.|Disque énergétique et lanceur compact.|Disponibilité selon édition et pack.|CHAKRAM
HARRIER|Cerberus Harrier|Fusil de l’arsenal étendu.|Rafale rapide et réserve courte proposée ; rendement affiché sans imposer un classement absolu.|Marquages Cerberus.|Pack et acquisition selon édition.|EQUIP
TYPHOON|N7 Typhoon|Fusil de l’arsenal étendu.|Montée en régime puis suppression ; annulation précoce autorisée avec coût indiqué.|Arme lourde N7 et protection frontale.|Pack / édition à vérifier.|EQUIP
VALKYRIE|N7 Valkyrie|Fusil N7.|Double impulsion proposée et stabilité de couverture ; les bonus ne doublent pas le coût à chaque projectile.|Fusil N7 distinct du Mattock.|Pack / édition à vérifier.|EQUIP
ADAS|Adas Anti-Synthetic Rifle|Fusil de l’arsenal étendu.|Projectile énergétique adapté aux protections techniques ; indiquer règles de résistance avant tir.|Arme compacte et arcs lumineux.|Pack / édition à vérifier.|EQUIP
LANCER|M-7 Lancer|Arme du DLC Citadel.|Cycle de chaleur avec récupération ; tutoriel sépare réserve thermique et clips des autres fusils.|Fusil ancien aux marques N7.|DLC Citadel.|SUPPRESSOR
GETH-RIFLE|Geth Pulse Rifle|Fusil geth.|Projectiles rapides et lecture synthétique ; audio distinct du Prime pour ne pas confondre ami et ennemi.|Carcasse courbe et lumière bleue.||EQUIP
PREDATOR|M-3 Predator|Pistolet.|Arme légère de secours : tir court compatible avec récupération rapide des pouvoirs proposée.|Pistolet compact noir et blanc.||EQUIP
PHALANX|M-5 Phalanx|Pistolet lourd.|Tir posé à silhouette intermédiaire ; ne pas recopier sans vérification le laser de sa version ME2.|Pistolet militaire trapu.||EQUIP
CARNIFEX|M-6 Carnifex|Pistolet lourd.|Impact ponctuel et recul prononcé ; intérêt de coup d’arrêt contre ennemi déjà préparé.|Grande carcasse grise.||EQUIP
PALADIN|M-77 Paladin|Pistolet lourd.|Puissance ponctuelle avec réserve réduite proposée ; indication du nombre de tirs restants avant ordre.|Profil de gros pistolet.||EQUIP
TALON|M-358 Talon|Pistolet à dispersion.|Cône court avec aperçu des cibles touchées ; éviter une fausse promesse de tir de sniper.|Canon court et silhouette massive.||EQUIP
SCORPION|Scorpion|Pistolet à projectile explosif.|Charge adhésive puis détonation différée ; marquer cibles et sols sans doubler la zone après déplacement.|Projectile collant lumineux.||EQUIP
ARC|Arc Pistol|Pistolet énergétique.|Choisir impulsion ou charge proposée ; déplacement pendant préparation peut annuler sans tir fantôme.|Arme électrique et chambre lumineuse.||EQUIP
ACOLYTE|Acolyte|Arme de l’arsenal étendu.|Tir préparé de zone anti-protection ; rebond affiché avant engagement dans l’adaptation.|Forme asari et projectile énergétique.|Pack / édition à vérifier.|EQUIP
SUPPRESSOR|M-11 Suppressor|Pistolet de Citadel.|Profil de précision discret ; bonus ciblé proposé exige une visée lisible sans encourager un clic minuscule.|Silencieux et modèle compact.|DLC Citadel.|SUPPRESSOR
KATANA|M-23 Katana|Fusil à pompe.|Cône de proximité simple servant de référence pour les autres shotguns.|Fusil court à pompe.||EQUIP
SCIMITAR|M-27 Scimitar|Fusil à pompe.|Succession rapide de coups courts ; réserve et déplacement empêchent une boucle sans décision.|Fusil compact à cadence rapide.||EQUIP
CLAYMORE|M-300 Claymore|Fusil krogan.|Gros impact puis recharge exposée ; annonce de dispersion et des cibles secondaires.|Carcasse krogan très massive.||EQUIP
EVISCERATOR|M-22 Eviscerator|Fusil à pompe.|Portée intermédiaire proposée avec cône plus étroit ; profil distinct sans modifier le canon de l’objet.|Arme courte sombre.||EQUIP
DISCIPLE|Disciple|Fusil à pompe asari.|Impact de contrôle et faible masse proposée ; pouvoir suivant reste identifiable dans la file ATB.|Courbes asari et teinte claire.||EQUIP
GRAAL|Graal Spike Thrower|Arme à pointes.|Salve ou charge de pointes proposée ; visuel de projectiles solides distinct d’un rayon.|Grand fusil organique et pointes.||EQUIP
REEGAR|Reegar Carbine|Arme électrique de courte portée.|Canalisation en cône bref ; le joueur voit la zone exacte et la consommation continue.|Arc électrique entre arme et cible.|Pack / édition à vérifier.|EQUIP
PIRANHA|N7 Piranha|Fusil à pompe N7.|Rafale de proximité qui engage la position ; récupération plus longue si l’ordre est poursuivi.|Arme N7 compacte.|Pack / édition à vérifier.|EQUIP
RAIDER|AT-12 Raider|Arme ajoutée avec Leviathan.|Deux temps de tir puis reprise proposée ; ne pas remplacer la vérification des valeurs par celles de ME2.|Fusil court massif.|Leviathan / édition.|BW-LEV
VENOM|Venom|Arme de l’arsenal étendu.|Zone explosive à trajectoire prévisualisée ; charge complète et tir court ont icônes distinctes.|Lanceur lourd et projectile lumineux.|Solo selon pack ; aussi Reckoning multi.|EQUIP,BW-CITADEL
MANTIS|M-92 Mantis|Fusil de précision.|Tir préparé, ligne dégagée puis récupération ; évite tout tir à travers un obstacle opaque non autorisé.|Long fusil de sniper.||EQUIP
VIPER|M-97 Viper|Fusil de précision.|Tirs successifs avec fenêtre de retargeting ; qualité de visée proposée visible.|Fusil semi-automatique fin.||EQUIP
WIDOW|M-98 Widow|Fusil lourd de précision.|Pénétration définie par matériau du fan game ; un aperçu signale couvert traversable ou bloquant.|Canon massif et bipied.||EQUIP
BLACK-WIDOW|Black Widow|Fusil de précision.|Petite série de tirs puissants ; afficher réserve du chargeur dans menu d’ordre.|Grande carcasse sombre.||EQUIP
JAVELIN|Javelin|Fusil geth de précision.|Préparation avant projectile ; la cible réserve une fenêtre de fuite, évitant un impact instantané injuste.|Arme geth à ligne énergétique.||EQUIP
RAPTOR|M-13 Raptor|Fusil semi-automatique.|Précision légère, récupération rapide proposée ; peut accompagner un build de pouvoirs.|Fusil fin à lunette.||EQUIP
INDRA|M-90 Indra|Fusil automatique de précision.|Maintien du tir avec dispersion graduelle ; interruption au changement de ligne de vue.|Long canon et chargeur.|Arsenal étendu selon édition.|EQUIP
VALIANT|N7 Valiant|Fusil de précision N7.|Cadence contrôlée et réserve visible ; rôle mobile proposé distinct du Widow.|Fusil N7 blanc et noir.|Arsenal étendu selon édition.|EQUIP
SHURIKEN|M-4 Shuriken|Pistolet mitrailleur.|Rafale légère et courte ; choisir sa cible avant chaque salve.|SMG compact.||EQUIP
TEMPEST|M-9 Tempest|Pistolet mitrailleur.|Suppression légère à proximité ; échange de précision contre flexibilité proposé.|Chargeur et canon courts.||EQUIP
LOCUST|M-12 Locust|Pistolet mitrailleur.|Tir précis de soutien ; coût de préparation réduit à couvert dans l’adaptation.|Silhouette fine de SMG.||EQUIP
HORNET|M-25 Hornet|Pistolet mitrailleur.|Salves courtes avec recul lisible ; aucun tir continu caché derrière animation de rafale.|Boîtier Cerberus compact.||EQUIP
HURRICANE|N7 Hurricane|Pistolet mitrailleur N7.|Débit très court et intense ; saturation proposée compensée par consommation affichée.|Arme N7 légère.|Arsenal étendu selon édition.|EQUIP
CAIN|M-920 Cain — local|Arme lourde de mission.|Objet local à préparation forte et zone d’explosion immense ; empêcher auto-tir après annulation.|Gros lanceur et charge visible.|Ne devient pas inventaire lourd permanent de ME2.|EQUIP
HYDRA|M-560 Hydra — local|Lanceur lourd local.|Salve à verrouillage visible ; cible valide exigée avant consommation de la charge locale.|Lanceur de missiles lourd.|Rencontre du site de bombe.|HYDRA
BLACKSTAR|Reaper Blackstar — local|Arme lourde trouvée en mission.|Charge unique locale avec confirmation de zone ; état laissé sur place si non utilisé.|Arme organique sombre.|Ramassage en mission compatible.|BLACKSTAR
GETH-SOFT|Geth Combat Software|Outil du consensus geth.|Action de nettoyage numérique seulement ; pas de dégâts sur organiques ni export dans loadout.|Faisceau et particules de données.|Consensus uniquement.|GETH-SOFT
''')

# Conserver les noms communs sans importer les pouvoirs propres à ME2.
exclude={'HACK','NEURAL','GETH-SHIELD','SHADOW-STRIKE','FLASHBANG','AMMO-SHREDDER','UNITY'}
for line in me2_power_data.strip().splitlines():
    key,name,rule,look=line.split('|')
    if key in exclude: continue
    c.add('powers',key,name,'Pouvoir présent dans l’arsenal ME3.', 'Conversion ATB originale : '+rule,visual=look,source='POWERS',
      acceptance='Vérifier cible organique/synthétique, chaque protection, durée et fin d’état ; une cible non admissible garde ressources et action disponibles.')
c.rows('powers','''
NOVA|Nova|Pouvoir biotique de ME3.|Dépenser une protection pour choc de proximité ; prévisualiser défense restante et risque de contre-attaque.|Onde circulaire au sol.||POWERS
DARK-CHANNEL|Dark Channel|Pouvoir de Javik.|Marque persistante puis transfert proposé sur cible valide à sa mort ; une seule instance à suivre dans l’UI.|Lueur sombre et lien de transfert.||SQUAD,POWERS
FLARE|Flare|Pouvoir associé à Aria.|Grande zone explosive à longue préparation ; équipe libre de se déplacer pendant la charge.|Sphère biotique puis onde large.|DLC Omega / déblocage selon campagne.|SQUAD
LASH|Lash|Pouvoir d’Aria.|Traction suivant un axe prévisualisé ; collision et cibles protégées contrôlées avant dépense.|Fouet biotique et trajectoire.|DLC Omega / déblocage selon campagne.|SQUAD
LIFT-GRENADE|Lift Grenade|Grenade biotique.|Zone de lévitation consommable ; séparer réserve de grenade et récupération des pouvoirs.|Arc puis suspension de groupe.||POWERS
FRAG|Frag Grenade|Grenade offensive.|Trajectoire lobée et rayon visible ; grenade déjà lancée continue après incapacité du lanceur.|Grenade physique puis éclats atténués.||POWERS
CARNAGE|Carnage|Pouvoir offensif de plusieurs équipiers.|Projectile lourd de zone ; position de cible figée à résolution, pas au premier clic de menu.|Projectile rouge-orange.||SQUAD
PROXIMITY|Proximity Mine|Pouvoir de Garrus.|Poser mine sur surface admise ; aire de déclenchement distincte de l’explosion.|Mine au sol et halo de détection.||SQUAD
SABOTAGE|Sabotage|Pouvoir de Tali.|Perturber machine ou arme selon type ; fiche d’effet affiche le résultat réellement applicable.|Omni-outil et parasites orange.||SQUAD
DEFENSE-DRONE|Defense Drone|Pouvoir de Tali.|Drone proche du protecteur, attaque de réaction limitée ; aucun blocage de chemin au pied d’un allié.|Sphère de défense et petit arc.||SQUAD
DEFENSE-MATRIX|Defense Matrix|Pouvoir d’EDI.|Protection entretenue avec purge de secours proposée ; coût de récupération visible.|Trame technique et segments de bouclier.||SQUAD
DECOY|Decoy|Pouvoir d’EDI et d’Armax.|Leurre à emplacement réservé ; les ennemis déjà engagés ne changent pas tous instantanément de cible.|Copie holographique distincte.||SQUAD
MARKSMAN|Marksman|Pouvoir d’Ashley.|Bonus temporaire de visée/rythme proposé ; durée commence à activation et non au premier tir.|Viseur stabilisé et portrait marqué.||SQUAD
BIOTIC-PROTECTOR|Biotic Protector|Pouvoir de Nyreen.|Bulle locale de protection avec durée et portée visibles ; distinguer la pose narrative de ses règles de combat.|Dôme biotique et mains ouvertes.|Omega, Nyreen uniquement.|SQUAD
STIMULANT|Stimulant Pack|Pouvoir de Wrex dans Citadel.|Activation de réserve personnelle ; icône et stock propres, séparés du medi-gel partagé.|Injection stylisée et regain de posture.|Citadel / Armax selon roster.|SQUAD
''')

c.rows('equipment','''
N7|Armure N7 personnalisable|Shepard dispose d’une armure modulaire.|Séparer apparence, pièces et effet de statistiques proposé ; aperçu avant achat et restauration de la tenue précédente.|Plaques N7, couleur et matériau réglables.||EQUIP
AJAX|Cerberus Ajax Armor|Armure additionnelle.|Preset d’armure complet avec silhouette Cerberus ; afficher les avantages proposés sans les attribuer au jeu source.|Armure Cerberus lourde.|Acquisition différente en Legendary.|EA-CAL,EQUIP
INFERNO|Inferno Armor|Armure additionnelle.|Preset orienté pouvoirs proposé ; pas de cumul caché avec pièces de tenue modulaire.|Armure orange profilée.|Pack / édition.|EQUIP
BLOOD-DRAGON|Blood Dragon Armor|Armure additionnelle.|Tenue de récompense avec identité visuelle particulière ; garder sa provenance promotionnelle hors diégèse.|Plaques médiévales stylisées et motif rouge.|Pack / édition.|EQUIP
COLLECTOR|Collector Armor|Armure additionnelle.|Preset organique avec masque ; sous-titres et portrait assurent la lecture des dialogues.|Carapace de type Récolteur.|Pack / édition.|EQUIP
TERMINUS|Terminus Assault Armor|Armure additionnelle.|Preset sombre de combat ; contraste de bord adapté aux couloirs noirs.|Armure noire et casque fermé.|Pack / édition.|EQUIP
CERBERUS|Cerberus Assault Armor|Armure additionnelle.|Tenue complète distincte de l’Ajax ; inspecteur de pièces interdit les combinaisons non prévues.|Blanc, noir et orange.|Pack / édition.|EQUIP
ROSENKOV|Pièces Rosenkov Materials|Fabricant d’armure présent dans ME3.|Composants à tags et emplacement ; tableau de comparaison par rôle de pouvoir proposé.|Pièces tactiques uniformes.||EQUIP
SERRICE|Pièces Serrice Council|Famille d’armure.|Pièces orientées biotique dans l’adaptation ; effets lisibles sans bonus de set inventé comme canon.|Formes lisses et détails techniques.||EQUIP
HANNES|Pièces Hahne-Kedar|Famille d’armure.|Proposition de bonus d’arme par emplacement ; rendre visibles les contreparties choisies.|Plaques militaires fonctionnelles.||EQUIP
KASSA|Pièces Kassa Fabrication|Famille d’armure.|Proposition de résistance et maintien des protections ; effets séparés par pièce.|Plaques renforcées.||EQUIP
ARIAKE|Pièces Ariake Technologies|Famille d’armure.|Effets de mobilité et mêlée proposés ; ne pas partager l’ID d’un objet nommé d’un autre fabricant.|Plaques articulées.||EQUIP
SENTRY|Sentry Interface|Casque de l’arsenal.|Affichage de protection proposé ; option casque masqué en dialogue sans retirer ses effets.|Visière électronique.||EQUIP
DEATH-MASK|Death Mask|Casque de l’arsenal.|Silhouette alternative ; préserver lisibilité des expressions par portrait en dialogue.|Masque fermé sombre.||EQUIP
WEAPON-MODS|Mods d’armes|Les armes reçoivent des modifications.|Deux emplacements proposés si retenus par design ; compatibilités par catégorie, aucun double mod incompatible silencieux.|Slots et aperçu sur arme.||EQUIP
BARREL|Canon et dégâts — mod|Famille de modification.|Compromis de puissance proposé visible avant validation ; recalcul unique, pas de double application au projectile.|Icône canon et comparaison chiffrée de fan game.||EQUIP
SCOPE|Lunette — mod|Famille de modification.|Aide de cible et précision proposées ; caméra ne change pas brutalement en ATB isométrique.|Petit viseur et cône de précision.||EQUIP
MAGAZINE|Chargeur — mod|Famille de modification.|Augmenter réserve de chargeur proposée ; rechargement plein lors d’un changement interdit hors zone sûre.|Chargeur et compteur.||EQUIP
ULTRALIGHT|Matériaux ultralégers — mod|Famille de modification.|Réduire la masse proposée et recalculer récupération de pouvoirs ; afficher le changement total du loadout.|Plume technique et jauge de masse.||EQUIP
MEDIGEL|Medi-gel|Ressource de secours.|Inventaire partagé lisible, cibles relevables choisies avant dépense ; action annulée sur changement de scène restaure la réserve.|Bande médicale et compteur.||COMBAT
GRENADE-STOCK|Réserve de grenades|Plusieurs pouvoirs utilisent des grenades.|Capacité affichée par porteur et classe d’action ; ramassage inutilisable explique pourquoi.|Grenade physique et jauge discrète.||POWERS
THERMAL|Clips thermiques|Munition commune aux armes compatibles.|Ramassage réparti selon arme équipée et règles proposées ; armes thermiques spéciales exclues explicitement.|Clips lumineux à échelle lisible.||COMBAT
''')
# Clé sans espace, sans changer les libellés lisibles.
for e in c.entries:
    if e['id']=='ME3-EQP-ARI AKE':
        c.ids.remove(e['id']); e['id']='ME3-EQP-ARIAKE'; c.ids.add(e['id'])
        e['implementation']=e['implementation'].replace('ari ake','ariake')

c.rows('choices','''
IMPORT|Importer la survie et les relations|ME3 reprend des décisions antérieures.|Écran de contrôle des événements majeurs avant prologue ; valeur inconnue distincte de faux, pas d’inférence depuis romance.|Frise des deux jeux précédents.||GUIDE
COUNCIL|Survivant de Virmire et confiance|Le retour d’Ashley/Kaidan est conditionnel.|Mémoriser visites, entretiens et affrontement politique séparément ; preview ne révèle pas la trahison avant scène.|Portrait unique du survivant.||CITADEL2
DOCTOR|Médecin du Normandy|Des choix de recrutement existent.|Enregistrer nomination et refus séparément ; un même lit de responsable ne doit pas faire disparaître l’autre PNJ du monde.|Choix de personnel dans infirmerie.||HUERTA
KELLY|Conseils à Kelly|Ses choix de sécurité ont des conséquences.|Variable de conseil et événement du coup d’État ; réplique nouvelle si identité protégée, aucun effacement sans journal.|Refuge et conversation privée.||CHAR
EVE|Données de Maelon et Eve|L’import influe sur Eve.|Séparer conservation des données, présence de Mordin et survie d’Eve ; toutes les combinaisons valides disposent d’une scène.|Portrait d’Eve et note de laboratoire.||TUCH
REVEAL-SABOTAGE|Révéler l’offre de sabotage|Le secret influe sur Tuchanka.|Choix de révélation à plusieurs fenêtres ; une révélation antérieure bloque les dialogues prétendant encore un secret.|Conversation de trajet ou sommet.||TUCH
CURE|Remède effectif ou sabotage|Tuchanka offre des issues divergentes.|Décision finale rattachée au monde et au savant ; bénéfices politiques et conséquences personnelles restent des états séparés.|Shroud et hologrammes d’alliés.||TUCH
MORDIN-SURVIVE|Issue exceptionnelle de Mordin|Sa survie exige des conditions précises.|Branche de persuasion seulement avec Wrex et Eve morts et secret compatible ; vérifier l’ensemble exact en jeu avant reproduction fidèle.|Ascenseur du Shroud et départ discret.|Survie ME2 ; variantes de dialogue à revérifier.|TUCH
WIKS|Résolution avec Padok Wiks|Wiks remplace Mordin si nécessaire.|Graphe propre au scientifique ; ne pas réutiliser automatiquement les conditions émotionnelles de Mordin.|Portrait galarien et salle du Shroud.|Mordin absent.|TUCH
RACHNI|Reine rachni ou substitut|Le passé modifie l’identité de la captive.|Deux identités différentes, deux conséquences distinctes ; sauver la reine synthétique n’est pas sauvetage de la reine de ME1.|Prison organique et identification préalable.||RACHNI,WAR-KROGAN
GRUNT|Destin de l’équipe de Grunt|Sa présence et son passé comptent.|Tester import, loyauté et décision de sauvetage ; narration ne suppose pas qu’il mène toujours l’équipe.|Tunnel et sortie après combat.||RACHNI
STUDENTS|Affectation des élèves de Grissom|Les élèves contribuent à la guerre.|Présenter soutien ou rôle offensif selon options de mission ; recrutement ne conditionne pas rétroactivement le sauvetage.|Débriefing d’évacuation.||GRISSOM
SAMARA|Intervenir au monastère|Une intervention peut sauver Samara.|Fenêtre suspendable et alternative de choix non chronométré ; gérer Falere dans la branche où l’intervention manque.|Plan rapproché mains/arme et Falere.|Samara vivante.|KALLINI
KORIS|Sauvetage de Koris|La mission de Rannoch permet des choix.|Isoler décision de secours, présence de l’amiral et bilan quarian ; ne pas déduire paix d’un seul drapeau.|Radio et point d’extraction.||RANNOCH
PEACE|Paix geth/quariens|Une issue de coexistence est conditionnelle.|Évaluateur lisible par provenance : passé ME2, Tali/Legion et missions de Rannoch ; aucun seuil numérique non vérifié.|Flottes, portraits et route de dialogue verrouillée.||RANNOCH,FIGHTERS
GETH-UPDATE|Accepter ou refuser la mise à jour geth|La conclusion Rannoch diverge.|Deux résolutions incompatibles, éventuelle médiation avant combat ; maintenir état de Tali et Legion cohérent jusqu’à l’épilogue.|Lien geth et navires quariens.||RANNOCH
MIRANDA|Aide et survie de Miranda|Plusieurs rencontres influencent Horizon.|Suivre avertissement, aide et relation importée séparément ; une rencontre manquée ne devient pas aide reçue par défaut.|Messages, appartement et Sanctuary.|Miranda vivante après ME2.|HORIZON
ORIANA|Confrontation avec Henry Lawson|Horizon conclut l’arc familial.|Dialogue et intervention ont des variantes ; Oriana, Henry et Miranda reçoivent des états propres après la scène.|Baie de Sanctuary.||HORIZON
LEVIATHAN-ANN|Interrogation d’Ann|L’enquête peut pousser Ann au risque.|Afficher caractère insistant du choix et résultat d’indice ; pas de jauge médicale inventée présentée comme règle originale.|Fauteuil de laboratoire et écran de signal.||LEV
OMEGA-REACTOR|Énergie et civils d’Omega|La reprise pose des choix locaux.|Conserver sauvetage, vitesse et réaction d’Aria dans variables séparées ; feedback du quartier après la décision.|Interrupteurs de puissance et communications.||OMEGA
PETROVSKY|Sort de Petrovsky|La conclusion d’Omega possède des variantes.|Choix final et interventions selon relation construite avec Aria ; éviter une seule bascule qui efface les décisions antérieures.|Afterlife libéré, Aria et général.||OMEGA
BROOKS|Reddition de Brooks|Le DLC conclut son arc par un choix.|État prisonnière, tentative de fuite et réaction de Shepard sont séquentiels ; pas de relance de combat après validation finale.|Quai et escorte.||BROOKS
CLONE|Dernier geste envers le clone|La fin du duel comporte une réaction.|Distinguer tentative d’aide et issue narrative ; ne pas proposer un recrutement qui n’existe pas dans l’œuvre.|Rampe du Normandy.||CLONE
INVITATIONS|Invités de la fête|Citadel dépend des survivants disponibles.|Liste fondée sur survie, progression et invitations ; messages expliquent absence sans faire apparaître un mort.|Tablette d’organisation et sièges.||CIT-DLC
PARTY-TONE|Ambiance de la fête|Citadel propose des variations sociales.|Choix d’ambiance par phase ; transitions de musique et placement des invités conservent les conversations déjà vues.|Appartement en soirée.||CIT-DLC
ROMANCE|Relations et invitations|Les relations influencent les scènes.|Contrat de relation exclusivité/rupture explicite par personnage ; états ME1, ME2 et ME3 séparés.|Portraits et souvenir de conversation.|Conditions exactes par partenaire à vérifier.|CHAR,CIT-DLC
DESTROY|Fin — Destruction|Une option vise les synthétiques.|Présenter conséquence annoncée, valider choix puis charger un épilogue de la bonne version et force de guerre.|Flux rouge et galerie d’épilogue.|Options disponibles conditionnelles ; aucune fin canon imposée.|EARTH,BW-EC
CONTROL|Fin — Contrôle|Une option porte sur le contrôle des Moissonneurs.|Décision finale séparée de l’argumentaire de l’Homme trouble ; variantes de voix et d’images vérifiées par état.|Flux bleu et nouvel horizon.|Disponibilité selon version et état.|EARTH,BW-EC
SYNTHESIS|Fin — Synthèse|Une option transforme le vivant et le synthétique.|Annonce du changement et confirmation sans minijeu ajouté ; pas de présentation comme résultat objectivement supérieur.|Flux vert et motifs transformés.|Disponibilité selon version et état.|EARTH,BW-EC
REFUSAL|Fin — Refus|Extended Cut permet une voie de refus.|Séparer refus explicite et gestes déclencheurs si reproduits ; sauvegarde finale conserve le choix sans le convertir en échec technique.|Silence, extinction et témoignage futur.|Extended Cut / Legendary.|EARTH,BW-EC
''')

c.originals('ally_moves','''
LIARA-GARRUS|Liara + Garrus — préparer puis percer|Singularity prépare la zone, Overload traite la protection compatible, tir ciblé au bon moment ; file d’ordres montre les étapes sans promettre un combo biotique invalide.|Violet de contrôle puis éclair bleu.|Deux équipiers disponibles.|characters:LIARA,characters:GARRUS,powers:SINGULARITY,powers:OVERLOAD
EDI-JAMES|EDI + James — tenir un passage|Decoy détourne un flanc pendant que Fortification protège James ; les ennemis engagés peuvent terminer leur action pour éviter un aggro artificiel.|Leurre translucide et silhouette de garde.||characters:EDI,characters:JAMES,powers:DECOY,powers:FORTIFICATION
TALI-GARRUS|Tali + Garrus — couper le réseau|Sabotage perturbe la plateforme admissible, Overload retire la protection ; priorité d’état interdit double conversion ou piratage de boss immune.|Lien orange puis arc électrique.|Survivants présents.|characters:TALI,characters:GARRUS,powers:SABOTAGE
JAVIK-LIARA|Javik + Liara — marquer et regrouper|Dark Channel désigne une cible ; Singularity attire ses voisins compatibles ; transfert choisi à mort de la marque, affiché dans l’aperçu.|Aura sombre au sein du noyau bleu.|Javik recruté.|characters:JAVIK,characters:LIARA,powers:DARK-CHANNEL
KAIDAN-EDI|Kaidan + EDI — relais de protection|Kaidan couvre la récupération d’EDI puis son Incinerate ouvre un état de feu ; éviter d’associer tout pouvoir à une détonation automatique.|Barrière violette et projectile orange.|Kaidan disponible.|characters:KAIDAN,characters:EDI,powers:INCINERATE
ASHLEY-JAMES|Ashley + James — assaut coordonné|Marksman fournit une fenêtre de tir, Carnage déloge un couvert ; verrouiller le tir allié tant que l’explosion proposée coupe la ligne.|Visée stabilisée et impact rouge.|Ashley disponible.|characters:ASHLEY,characters:JAMES,powers:MARKSMAN
ARIA-NYREEN|Aria + Nyreen — traversée protégée|Nyreen déploie une protection pendant préparation de Flare ; la durée de protection est visible pour choisir repli ou engagement.|Dôme bleu et charge violette.|Omega et disponibilité de Nyreen.|characters:ARIA,characters:NYREEN,powers:FLARE
WREX-SHEPARD|Wrex + Shepard — rupture de front|Wrex engage une unité lourde pendant que Shepard traverse une ligne de tir réservée ; aucune traversée forcée d’une collision de bouclier.|Krogan de face et marque latérale.|Citadel seulement hors Armax.|characters:WREX,characters:SHEPARD
TALI-DRONES|Tali — couverture de drones|Un Combat Drone attire une cible pendant que Defense Drone sécurise le retour ; deux rôles et deux icônes empêchent la confusion.|Sphères de couleur et forme différentes.||characters:TALI,powers:DRONE,powers:DEFENSE-DRONE
EDI-PURGE|EDI — purge et redirection|Defense Matrix stocke une protection proposée ; la purge offre un secours au prix de sa réserve, puis Decoy ouvre le repli.|Segments qui se détachent puis leurre.||characters:EDI,powers:DEFENSE-MATRIX
JAMES-GRENADE|James — couverture d’évacuation|Tir de suppression suivi d’une grenade sur un chemin vide de civils ; cible de zone interdite si civil dans rayon affiché.|Bras en lancer et flèche d’évacuation.||characters:JAMES,powers:FRAG
LIARA-STASIS|Liara — verrou de cible prioritaire|Stasis suspend la menace compatible, puis repositionnement du groupe ; la cible non contrôlable affiche résistance et aucun piège de commande.|Cadre biotique autour d’une silhouette.||characters:LIARA,powers:STASIS
GARRUS-MINE|Garrus — embuscade de flanc|Mine sur accès annoncé et tir de précision sur une autre cible ; mine persiste jusqu’à déclenchement ou fin de rencontre définie.|Mine basse et marque de visée.||characters:GARRUS,powers:PROXIMITY
JAVIK-SLAM|Javik — chute contrôlée|Pull puis Slam sur cible admissible ; verrou au sol évite que la chute déplace le sprite dans un couvert interdit.|Trajet vertical et impact.||characters:JAVIK,powers:PULL,powers:SLAM
NYREEN-RESCUE|Nyreen — relais de secours|Préparer la protection avant d’ouvrir un chemin aux civils ; action de soutien validée par passage du groupe, sans compte de morts caché.|Dôme et trajectoire civile.|Omega seulement.|characters:NYREEN,powers:BIOTIC-PROTECTOR
ARENA-KASUMI|Kasumi — diversion de simulation|Cloak et Decoy alternent pour ouvrir un angle ; l’arsenal de ME2 ne s’importe pas automatiquement dans son moveset Armax.|Deux silhouettes dont une holographique.|Armax seulement.|characters:ARENA-KASUMI
ARENA-MIRANDA|Miranda — rupture mixte d’arène|Overload puis Warp selon la protection affichée ; menu évite de proposer une efficacité de bouclier identique contre barrière.|Orange tech et violet biotique.|Armax seulement.|characters:ARENA-MIRANDA
RESCUE|Ordre commun — secourir un allié|Réserver un chemin et un emplacement de soin ; si la cible est relevée avant arrivée, annuler proprement sans double consommation.|Contour médical et zone de contact.||equipment:MEDIGEL
''')

# Cartes et contenu multi explicitement isolés du solo et de Legendary.
for key,name,look in [
('DAGGER','Firebase Dagger','Base désertique, ponts et toiture'),('GHOST','Firebase Ghost','Quartier industriel et rues étroites'),
('GIANT','Firebase Giant','Chantier industriel et longues lignes'),('GLACIER','Firebase Glacier','Installation enneigée et passages serrés'),
('REACTOR','Firebase Reactor','Réacteur, passerelles et portes'),('WHITE','Firebase White','Base froide et terrasses'),
('HYDRA','Firebase Hydra','Installations aquatiques et plateformes'),('CONDOR','Firebase Condor','Relief lunaire et ruines'),
('GODDESS','Firebase Goddess','Architecture asari et avenues'),('JADE','Firebase Jade','Jungle et installations scientifiques'),
('LONDON','Firebase London','Rues terrestres en ruines'),('RIO','Firebase Rio','Installations portuaires et verticalité'),
('VANCOUVER','Firebase Vancouver','Toitures et ville en guerre')]:
    c.add('zones','MP-'+key,name,'Carte du multijoueur ME3 original.',
      'Arène de vagues séparée : réserver quatre entrées de groupe, répartir objectifs et munitions, conserver au moins deux voies de repli lisibles ; topologie exacte à relever avant reproduction.',
      visual=look+'.',conditions='Module multijoueur original uniquement ; absent de Legendary.',source='MP',
      acceptance='Le lancement indique multijoueur ; aucune mission solo ne charge cette carte par erreur ; tester objectif, extraction et réapparition sans blocage de chemin.')
for key,name,fact,design in [
('RESURGENCE','Resurgence','Pack multijoueur avec nouvelles cartes et options.','Introduire Hydra et Condor avec roster et armes propres à la version installée ; contenu verrouillé par manifeste multi.'),
('REBELLION','Rebellion','Pack multijoueur ajoutant du contenu.','Introduire Goddess et Jade et une table de personnages/armes séparée ; vérifier variantes avant duplication en fiche.'),
('EARTH','Earth','Pack multijoueur lié à trois cartes terrestres.','Regrouper Londres, Rio et Vancouver dans sélection de cartes, conserver objectifs et règles de difficulté indépendants.'),
('RETALIATION','Retaliation','Pack multijoueur incluant les Récolteurs et des dangers.','Activer faction Récolteurs, défis et versions dangereuses ; danger de carte et attaque ennemie ont signaux différents.'),
('RECKONING','Reckoning','Pack multijoueur annoncé par BioWare.','Registre de personnages et armes du pack ; Geth Juggernaut, Cabal Vanguard, Talon Mercenary, Alliance Infiltration Unit et Krogan Warlord sont des classes multi, jamais équipiers de campagne.')]:
    c.add('systems','MP-'+key,'Multijoueur — '+name,fact,design,visual='Carte de pack avec emblème multijoueur et version.',conditions='ME3 original multijoueur uniquement ; aucun lien de sélection solo.',source='BW-CITADEL' if key=='RECKONING' else 'MP',acceptance='Installer ou masquer ce pack ne change aucun drapeau de compagnon, quête ou scène solo ; sa liste exacte reste vérifiable dans le manifeste dédié.')

wiki('FIRST-AID','First Aid','First_Aid','Différence Unity ME2 et First Aid ME3')
c.rows('powers','''
FIRST-AID|First Aid|Remplace Unity dans ME3.|Secours via medi-gel séparé de la récupération universelle ; adaptation conserve un ordre médical propre, cibles et coût visibles.|Omni-outil médical et portraits relevés.||FIRST-AID
CLUSTER|Cluster Grenade|Grenade biotique de l’adepte.|Dispersion en sous-projectiles annoncée ; cap du nombre de zones pour garder lisibles les cibles multiples.|Petites charges et halos biotiques.||POWERS
STICKY|Sticky Grenade|Grenade de l’infiltré.|Adhérence sur cible ou surface puis délai de détonation ; retrait du porteur de scène nettoie la charge sans explosion fantôme.|Charge collée et décompte visuel.||POWERS
SENTRY|Sentry Turret|Pouvoir d’ingénieur.|Tourelle placée dans une cellule libre et orientée ; déplacement interdit pendant résolution d’un tir propre.|Tourelle holographique et cône.||POWERS
FITNESS|Fitness|Passif commun des classes.|Santé, protection et mêlée proposées dans un arbre sans ambiguïté ; aucune animation active factice pour un passif.|Icône corporelle et résumé des effets.||POWERS
CLASS-PASSIVES|Maîtrises de classe|Chaque classe possède un passif.|Six profils de données : Biotic, Tech, Operational, Offensive, Combat et Assault Mastery ; afficher gains par rang plutôt que traduire en six attaques actives.|Six emblèmes de classe.||POWERS
''')

c.originals('links','''
GALAXY|Normandy ↔ carte galactique|Voyage par interface avec confirmation de mission, consommation et alerte ; jamais de marche directe entre planètes.|Carte, destination et bouton de départ.||zones:NORM-CIC
CIT-HUB|Navette ↔ quartiers de Citadelle|Sélection du district puis arrivée au point connu ; hub mémorise dernier quartier et messages non lus.|Carte de transport et portes de district.||worlds:CITADEL,zones:CIT-DOCKS
HOSPITAL|Ambassades ↔ hôpital|Transit de hub à distance explicite ; disponibilité des visites vérifiée avant placement du PNJ.|Sélecteur hôpital et lit ciblé.||zones:CIT-EMBASSY,zones:CIT-HOSP
SURKESH|Étages de Sur’Kesh|Ascenseur de capsule et escaliers joueurs synchronisés ; empêcher Eve de disparaître si un allié reste en retard.|Capsule sur rail et balises d’étage.||zones:SURKESH-LAB
TUCH-ROUTES|Trajets des missions Tuchanka|Chaque opération a son point d’arrivée ; seules liaisons réellement scénarisées sont jouées, autres transitent par carte.|Trois icônes de mission séparées.||worlds:TUCHANKA
CONSENSUS|Cuirassé / Rannoch ↔ consensus|Entrée virtuelle sauvegarde loadout et état physique ; sortie restaure l’inventaire sans garder l’arme de nettoyage.|Transition de données et cadre virtuel.||zones:GETH-CONSENSUS,weapons:GETH-SOFT
SANCTUARY|Accueil → niveaux cachés|Une porte d’enquête irréversible marque la révélation ; indices accessibles avant validation du dernier passage.|Signalétique d’accueil puis maintenance.||zones:SANCTUARY
ENDGAME|Carte galactique → QG Cerberus|Écran dédié annonce verrou de fin et sauvegarde avant départ ; annuler conserve quêtes et composition.|Avertissement narratif clair sans spoiler de fin.||main_quests:CERBERUS
LONDON|Base avancée → batterie → faisceau|Trois transitions conservent les adieux et états d’armée ; un chargement ne relance pas le briefing final.|Flèches d’assaut et jalons de radio.||zones:LONDON-FOB,zones:LONDON-MISSILES,zones:BEAM
LEV-INVEST|Laboratoire → destinations Leviathan|Filtres d’enquête déverrouillent des destinations sans effacer les pistes ; retour au laboratoire restaure tableau et preuves.|Table d’indices et carte galactique.||zones:BRYSON-LAB
LEV-DIVE|Épaves → abîme de Despoina|Transition vers méca de plongée vérifie équipement et pilote ; pas d’accès libre à l’eau comme si sol marchable.|Plateforme de descente et noir abyssal.||zones:LEV-OCEAN
OMEGA|Normandy → campagne Omega|Entrée avec engagement dans extension, roster Aria/Nyreen et journal local ; sortie restaure groupe standard.|Carte de station et navette dédiée.||main_quests:OMEGA
CIT-LEISURE|Appartement ↔ Silversun|Retour au hub social après complot ; état fête dépend d’invitations, pas de réapparition arbitraire des équipiers.|Ascenseur, terrasse et rue néon.||zones:APARTMENT,zones:SILVERSUN
ARENA|Silversun ↔ simulation Armax|Sauvegarder inventaire et états campagne à entrée ; abandon ou victoire restaure exactement l’état extérieur autorisé.|Sas de simulation et paramètres.||zones:ARMAX
''')

c.originals('scenery','''
VANCOUVER|Kit 3D — Vancouver en invasion|Façades et passerelles de fuite avec ruines en fond ; privilégier parcours lisible et grande échelle des Moissonneurs.|Béton clair, poussière et ciel sombre.||worlds:EARTH
MARS|Kit 3D — archives martiennes|Modules blancs et vitres sur tempête rouge ; couvert collidable séparé des consoles de récit.|Baies, sas et poussière rouge.||zones:MARS-ARCHIVE
MENAE|Kit 3D — front lunaire|Roches, tentes et batteries avec Palaven comme ciel ; aucun faux chemin vers la planète en arrière-plan.|Gris froid et lueurs de ville au ciel.||worlds:MENAE
CITADEL|Kit 3D — Citadelle civile en guerre|Dalles, kiosques et lits de réfugiés ; états avant/après coup d’État via variantes de décor sans casser navigation.|Blanc, bleu, bagages et balisage d’urgence.||worlds:CITADEL
SURKESH|Kit 3D — laboratoire galarien|Piliers et plateformes superposées avec lianes au fond ; transparence de toit quand personnage passe dessous.|Végétation verte et blanc clinique.||zones:SURKESH-LAB
TUCHANKA|Kit 3D — ruines krogan|Modules de pierre ancienne et gravats ; chemin de Kalros séparé du terrain jouable.|Ocres, sculptures et poussière.||worlds:TUCHANKA
ORGANIC|Kit 3D — tunnels organiques|Membranes, poches et ponts rocheux ; collisions simples indépendantes du mouvement visuel des tissus.|Noir, chair stylisée et halos bleus.||zones:RACHNI-TUNNEL
GRISSOM|Kit 3D — école attaquée|Salles et atrium avec mobilier scolaire identifiable ; civils lisibles malgré végétation et vitres.|Blanc, jardin et écrans éducatifs.||zones:GRISSOM-ATRIUM
MONASTERY|Kit 3D — monastère asari|Grands piliers et perspectives noires ; obscurité de décor ne masque jamais une entrée de Banshee.|Pierre froide et halo au sol.||zones:KALLINI-HALL
RANNOCH|Kit 3D — installations geth|Falaises et modules synthétiques avec câbles ; hauteurs ont contours au sol cohérents pour les sprites.|Sable, métal lisse et lignes bleues.||worlds:RANNOCH
THESSIA|Kit 3D — cité et temple asari|Courbes monumentales et statues ; destructibles d’action distincts des ruines de fond.|Bleu, blanc et fissures.||zones:THESSIA-TEMPLE
SANCTUARY|Kit 3D — façade et sous-sol Sanctuary|Même langage architectural transformé par portes de maintenance ; progression visuelle soutient la révélation.|Blanc rassurant puis panneaux techniques sombres.||zones:SANCTUARY
LONDON|Kit 3D — Londres final|Rues à barricades et silhouettes de bâtiments ; voies sûres toujours distinguables des zones de frappe.|Gris, feux, fumée et drapeaux alliés.||zones:LONDON-MISSILES
OMEGA|Kit 3D — occupation d’Omega|Reprendre identité industrielle avec ajouts Cerberus ; champs de force et passage libre ont couleurs/formes distinctes.|Métal noir, néon et orange militaire.||worlds:OMEGA
ABYSS|Kit 3D — Despoina|Épaves mouillées puis volume sous-marin ; réduire visibilité sans rendre l’objectif invisible.|Océan sombre, faisceaux et particules.||worlds:DESPOINA
SILVERSUN|Kit 3D — luxe et loisirs|Façades de casino, appartement et arène ; échelle sociale différente des cartes de guerre.|Verre, dorure et néons chaleureux.||zones:SILVERSUN
''')

c.originals('props','''
WAR-TABLE|Table holographique de guerre|Afficher contribution, origine et état de chaque force ; interaction à portée large et zoom accessible.|Plan galactique bleu et panneaux de faction.||zones:NORM-CIC
MARS-DATA|Terminal des plans de Mars|Un téléchargement atomique ouvre le chapitre Creuset ; reprise après chargement ne duplique pas la découverte.|Console et schéma ancien.||zones:MARS-ARCHIVE
EVE-POD|Capsule d’Eve|Objet d’escorte avec repère d’intégrité de scénario ; distinguer état de capsule et santé de la personne.|Capsule médicale sur rail.||zones:SURKESH-LAB
BOMB|Bombe de Tuchanka|Objet interactif du désamorçage avec étapes visuelles ; dégâts externes ne réinitialisent pas silencieusement le progrès.|Dispositif sous terrain et câblages.||side_quests:BOMB
HAMMER|Commande du marteau de Kalros|Objet d’objectif avec accès dégagé ; activation après prérequis, animation interruptible seulement avant engagement.|Grand mécanisme krogan et signal sismique.||main_quests:TUCHANKA
SHROUD|Console du Shroud|Deux états narratifs, sabotage connu/inconnu ; aucune action de combat à la place de la décision finale.|Console de dispersion et ascenseur.||zones:SHROUD
GETH-GUN|Canon du cuirassé geth|Cycle d’impulsion indépendant des animations du groupe ; anticipation au sol et abri vérifiés à chaque cycle.|Long tube et accumulations bleues.||zones:GETH-DREAD
TARGET-LASER|Désignateur de Rannoch|Interface de verrou à maintien facultatif ; progression conservée selon règle annoncée lors d’une interruption.|Viseur sur œil et jauge de charge.||enemies:REAPER-RANNOCH
PROTHEAN-POD|Capsule de Javik|Lecture avant ouverture, personnage créé une seule fois ; éviter double recrutement après chargement de fouilles.|Capsule ancienne et écriture prothéenne.||main_quests:EDEN
BYRSON-ORB|Artefact de Bryson|État d’observation, danger et contact distincts ; les indices ne nécessitent pas de toucher sans prévenir.|Orbe sombre et appareil de confinement.||zones:BRYSON-LAB
FILTERS|Table de filtres Leviathan|Pistes activables/désactivables et historique ; solution accessible sans identifier de minuscules pixels de couleur.|Carte d’enquête et jeux de données.||main_quests:LEV-LAB
DIVE-MECH|Méca de plongée|Cockpit de récit, commandes de descente et communication ; statut d’eau distingue le modèle des Atlas de combat.|Coque massive, lampes et hublot.||zones:LEV-OCEAN
OMEGA-GEN|Générateurs d’Afterlife|Objets d’objectif numérotés par position, pas seulement couleur ; leur destruction actualise un état global de barrière.|Pylônes orange et liens d’énergie.||zones:OMEGA-AFTERLIFE
CHESS|Échiquier de Petrovsky|Souvenir narratif avec une interaction unique après reprise ; pas de nouveau minijeu attribué à l’œuvre.|Plateau de stratégie sur table.||npcs:PETROVSKY
CASINO|Table de casino et passe d’accès|Interaction sociale et accès de maintenance distincts ; le passe ne devient pas monnaie de boutique.|Table de jeu et carte d’accès.||zones:CASINO
INVITATION|Terminal d’invitations|Liste de personnes disponibles et rendez-vous ; conserver refus, invitation et scène achevée séparément.|Tablette de l’appartement.||choices:INVITATIONS
PHOTO|Photo de groupe|Composer positions selon invités ; aucun espace de portrait mort ou silhouette flottante si un personnage manque.|Cadrage de salon et disposition adaptative.||zones:APARTMENT
''')

c.originals('dialogues','''
WAR|Briefings de Hackett|Répliques originales courtes distinguant objectif, événement accompli et contribution nouvelle ; éviter répétitions à chaque scan.|Hologramme Alliance et journal d’écoute.||npcs:HACKETT
SABOTAGE|Offre de la dalatrasse|Afficher proposition, refus et report de décision ; ne pas attribuer consentement au seul fait d’avoir écouté.|Fenêtre de canal privé.||npcs:DALATRASS,choices:REVEAL-SABOTAGE
MORDIN|Dernier entretien au Shroud|Variantes liées à Eve, Wrex, données et secret ; toute ligne de remords dépend d’un fait réellement vécu dans la sauvegarde.|Ascenseur et plans serrés.||choices:CURE,choices:MORDIN-SURVIVE
TALI-LEGION|Médiation Rannoch|Écrire les arguments des deux camps puis conditions de médiation ; les choix indisponibles expliquent la catégorie de prérequis sans inventer un chiffre canon.|Alternance Tali/Legion et radio de flotte.||choices:PEACE
MIRANDA|Messages et rencontres Miranda|Trois fenêtres de récit avec sujet propre ; avertissement et aide ont accusé de réception et état persisté.|Terminal puis appartement privé.||npcs:MIRANDA,choices:MIRANDA
EVE-WREX|Entretien politique krogan|Distinguer espoir d’Eve et stratégie du dirigeant présent ; variante Wreav réécrite, aucun remplacement de nom mécanique.|Couple de portraits krogan.||npcs:EVE,npcs:WREAV
JAVIK|Réactions de Javik aux archives|Interventions conditionnelles au groupe présent ; exposé principal reste compréhensible sans lui.|Hologramme ancien et visage prothéen.||characters:JAVIK,zones:THESSIA-TEMPLE
ANN|Interrogatoire d’Ann|Clarifier les propositions risquées et la possibilité d’arrêter ; maintenir les indices déjà obtenus après refus.|Laboratoire et pulsation de signal.||npcs:ANN,choices:LEVIATHAN-ANN
ARIA-NYREEN|Tension Aria / Nyreen|Écrire des désaccords sur protection civile et reprise de pouvoir ; ne pas transformer les deux voix en simple bon/mauvais choix.|Plans croisés dans bunker.||characters:ARIA,characters:NYREEN
CLONE|Confrontation d’identité|Dialogue original autour de l’identité et des liens ; portraits homonymes portent rôle visuel pour rester compréhensibles.|Deux Shepard éclairés différemment.||enemies:CLONE
FAREWELL|Adieux de Londres|Une scène par relation disponible avec reprise après interruption ; l’utilisateur choisit de revoir avant de partir.|Base avancée et communication distante.||zones:LONDON-FOB
CATALYST|Décision finale explicitée|Chaque option dispose d’une explication accessible et d’une confirmation ; ne pas réduire le choix à trois couleurs sans texte.|Espace final et sous-titres contrastés.||choices:DESTROY,choices:CONTROL,choices:SYNTHESIS,choices:REFUSAL
PARTY|Conversations de la fête|Groupes de discussion selon invités et ambiance ; priorité aux répliques non vues et pas de chevauchement de sous-titres.|Petit cercle d’invités et caméra stable.||choices:PARTY-TONE
''')

c.originals('cinematics','''
EARTH-DEPARTURE|Évacuation de la Terre|Découper attaque, parcours et décollage ; garder sentiment d’échelle avec caméra stable et flashes réglables.|Navette, Normandy et ville attaquée.||main_quests:EARTH-PROLOGUE
MARS-REVEAL|Révélation de Mars|Poursuite puis révélation d’Eva avec état final unique ; skip applique les mêmes conséquences que lecture complète.|Couloir de tempête et visage synthétique.||main_quests:MARS
CURE|Dispersion du remède|Version de cure et version de sabotage ont plans et bilan cohérents ; aucune image de guérison complète dans branche mensongère.|Tour, ciel et réactions krogan.||choices:CURE
KALROS|Kalros et le Moissonneur|Combat gigantesque en arrière-plan, puis retour au groupe sur repère stable ; pas d’ennemi ciblable géant par accident.|Silhouettes colossales et poussière.||main_quests:TUCHANKA
COUP|Affrontement du coup d’État|Placer survivant de Virmire, Udina et Shepard ; arme et orientation dépendent de l’auteur effectif de l’action.|Ascenseur et couloir du Conseil.||main_quests:CITADEL2
RANNOCH|Résolution des flottes|Trois montages conditionnels sans couper un personnage vivant au mauvais endroit ; résultat explicite au retour du contrôle.|Flottes et ciel de Rannoch.||choices:PEACE,choices:GETH-UPDATE
THESSIA|Chute de Thessia|Échec narratif lisible après confrontation ; le joueur n’est pas puni par un faux écran de mort/retry impossible.|Temple endommagé et navette ennemie.||main_quests:THESSIA
SANCTUARY|Confrontation des Lawson|Variantes selon Miranda, aide et décision ; poser Oriana à un emplacement sûr après la scène.|Passerelle et baie de Sanctuary.||choices:ORIANA
LEVIATHAN|Rencontre abyssale|Échelle par silhouettes et lumière, dialogue sous-titré ; toutes les réponses restent accessibles en mode réduction de mouvement.|Visages abyssaux et cockpit minuscule.||main_quests:DESPOINA
OMEGA|Conclusion d’Omega|Mort ou reddition de Petrovsky, réponse d’Aria puis départ ; journal final s’écrit avant transition de retour.|Afterlife et foule libérée.||choices:PETROVSKY
NORMANDY-DUEL|Duel final du clone|Animation de rampe avec acteur principal et clone identifiables ; skip conserve état de Brooks et équipement rendu.|Rampe du Normandy et espace ouvert.||choices:CLONE,choices:BROOKS
FINALE|Épilogues Extended Cut|Assemblage à partir de choix final, version et grands états politiques ; index de plans vérifié sans déclarer un montage canon unique.|Terre, relais, Normandy et peuples.||choices:DESTROY,choices:CONTROL,choices:SYNTHESIS,choices:REFUSAL
''')

c.originals('animations','''
COVER|Couvert et changement d’épaule|Conserver pieds ancrés et profondeur ; sortie de couvert avant tir visible, retour sans glissement sur les angles.|Sprites bas/haut et repères au sol.||systems:COVER
VAULT|Franchissement de couvert bas|Réserver la cellule d’arrivée avant saut ; annuler si allié la bloque et ne pas traverser un couvert haut.|Arc court et ombre continue.||systems:TRAVERSAL
OMNIBLADE|Mêlée lourde de Shepard|Anticipation du bras, extension de lame puis récupération ; contrôle de hitbox indépendant de l’illustration lumineuse.|Omni-lame orange et pose de fente.||characters:SHEPARD
BIOTIC-CAST|Gestuelle biotique d’équipe|Variantes humain/asari/krogan/turien ; la main de cast conserve arme et silhouette sans duplication.|Main ouverte et déformation légère.||powers:WARP
TECH-CAST|Omni-outil et activation tech|Projeter outil du bon bras selon sprite original ; événement de pouvoir une seule fois même si pause tactique.|Anneau d’interface orange.||powers:OVERLOAD
GRENADE|Lancer de grenade|Préparation, lâcher et retour au fusil ; projectile créé au lâcher, réserve débitée à ce moment précis.|Main, grenade et parabole.||powers:FRAG
REVIVE|Secours manuel et First Aid|Deux poses distinctes, contact au corps ou omni-outil ; vérifier orientation et absence de traversée de mur.|Geste de soin et reprise de station.||powers:FIRST-AID
PHANTOM|Phantom — menace de lame|Camouflage lisible, sortie, pose de menace puis frappe ; réduire possibilité de saisie instantanée hors champ.|Lame et contour de menace.||enemies:PHANTOM
BANSHEE|Banshee — téléportation et prise|Départ et arrivée reliés par signal ; phase de saisie distincte de l’attaque normale, durée lisible.|Aura, silhouette étirée et main tendue.||enemies:BANSHEE
BRUTE|Brute — charge arrêtée|Épaules baissées, poussée, collision puis déstabilisation ; pas de correction de trajectoire invisible après charge.|Masse projetée et poussière.||enemies:BRUTE
ATLAS|Atlas — marche et cockpit|Cycle lourd sans déplacer artificiellement la hitbox ; ouverture et destruction de vitre sont états séparés si utilisés.|Pistons, genoux et cockpit.||enemies:ATLAS
RAVAGER|Ravager — sacs et émergence|Réaction locale à la rupture d’un sac ; Swarmers apparaissent à emplacements libres et non sur pieds alliés.|Sacs pulsants et petites sorties.||enemies:RAVAGER
ADJUTANT|Adjutant — bond annoncé|Compression du corps, ombre d’arrivée et bond ; contact seulement après réception valide.|Grande silhouette en arc.||enemies:ADJUTANT
CLONE|Clone — miroir de classe|Conserver le modèle personnalisé et varier les gestes selon classe ; ne pas reproduire une arme absente du loadout de boss.|Silhouette Shepard avec posture hostile.||enemies:CLONE
DIALOGUE|Visages et regard en conversation|Jeu de bouches original sobre, regard sur interlocuteur actif ; distances de caméra compatibles avec aliens à yeux multiples.|Portraits et buste en surimpression.||characters:JAVIK
CIVILIANS|Évacuation des civils|Groupes courts avec espace autour des sprites ; panique, arrêt et reprise sans collision en boucle devant porte.|Marche pressée et mains de protection.||side_quests:GRISSOM
PARTY|Gestes sociaux de la fête|S’asseoir, boire, rire et danser avec ancres de meubles ; vérifier variantes grandes/petites silhouettes.|Groupes de salon et piste improvisée.||zones:APARTMENT
''')

c.originals('vfx','''
PROTECTION|Santé, bouclier, barrière et armure|Quatre motifs et noms au-dessus de cible ; la couleur seule ne détermine jamais protection active.|Liserés géométriques distincts.||systems:DEFENSES
PRIMER|Marqueur d’amorce|Icône de type et durée sur cible ; afficher compatibilité du prochain détonateur avant paiement.|Petit signe feu/glace/tech/biotique.||systems:COMBOS
DETONATION|Détonation de combo|Flash court, onde au sol et nombre d’impacts réel ; cap de luminosité lors de plusieurs combos synchrones.|Onde et particules de famille.||systems:COMBOS
CLOAK|Camouflage accessible|Contour joueur constant, contour ennemi perceptible par indice de menace ; réglage indépendant de l’opacité canonique.|Réfraction et ondulation au sol.||powers:TACTICAL,enemies:GETH-HUNTER
SMOKE|Fumée Cerberus|Occlusion du décor et visée sans cacher marqueurs essentiels ; bord de volume et durée lisibles.|Nuage gris et contour discret.||enemies:CENTURION
BANSHEE|Signal de prise Banshee|Halo de rayon, main mise en avant et texte de menace ; réduire flashes sans retirer le signal.|Anneau violet segmenté.||enemies:BANSHEE
PHANTOM|Signal de frappe Phantom|Trace de lame et cône court ; le cône reste visible si le corps est derrière un couvert.|Ligne rouge et silhouette translucide.||enemies:PHANTOM
REAPER-BEAM|Rayon de Rannoch|Balayage annoncé par bande au sol ; luminosité limitée, point de verrou visible dans toutes les aides visuelles.|Large rayon et trace de chaleur.||enemies:REAPER-RANNOCH
CANNON|Impulsion du cuirassé|Cycle de charge gradué et bandes sûres ; fréquence adaptée au rythme ATB choisi sans valeur source inventée.|Anneaux bleus du canon.||props:GETH-GUN
LEV-INFLUENCE|Influence des artefacts|Déformation légère périphérique ; alternative sans distorsion et mêmes indices narratifs textuels.|Motifs concentriques et halo sombre.||props:BYRSON-ORB
LEV-DEPTH|Profondeur et particules d’eau|Atténuation par distance sans rendre texte flou ; bulles et sédiments ne ressemblent pas à des projectiles.|Bleu-noir et faisceaux volumétriques.||zones:LEV-OCEAN
OMEGA-BARRIER|Barrières d’Afterlife|Liens vers générateurs, affaiblissement par étapes et rupture finale ; masques empêchent de cacher cible active.|Plans orange et fissures énergétiques.||props:OMEGA-GEN
ARMAX|Matérialisation de simulation|Apparition en grille avec invulnérabilité de spawn signalée ; aucun dégât avant fin de préparation annoncée.|Maille lumineuse puis modèle solide.|Armax seulement.|zones:ARMAX
FINAL|Flux des fins|Couleurs accompagnées de noms, symboles et narration ; luminosité plafonnée et option scène simplifiée.|Rouge, bleu, vert et extinction selon branche.|Épilogue uniquement.|choices:DESTROY,choices:CONTROL,choices:SYNTHESIS
MAP-SCAN|Scan galactique et alerte|Propagation d’onde et jauge de menace ; la zone déjà visitée garde repère lisible après retour de mission.|Onde circulaire et signal ennemi.||systems:SCAN
''')

c.originals('audio','''
NORMANDY|Ambiance du Normandy Alliance|Créer moteur feutré et consoles ; réduire ambiance pendant dialogues sans supprimer les alertes de mission.|Étiquettes de sous-titres pour communications.||zones:NORM-CIC
EARTH|Terre en invasion|Couches lointaines de bataille, impacts proches et alarmes ; priorité aux signaux de parcours et à la voix d’Anderson.|Sous-titres directionnels des alertes.||worlds:EARTH
MENAE|Front turien|Artillerie lointaine distincte des tirs visant le groupe ; limiter basses répétitives fatigantes.|Icône de barrage et événements au ciel.||worlds:MENAE
CITADEL|Foule de Citadelle|Boucles de conversations originales non informatives et canaux de quêtes prioritaires ; aucun faux sous-titre d’objectif dans ambiance.|Sources de voix discrètement localisées.||worlds:CITADEL
MONASTERY|Silence du monastère|Réverbération et faible fond ; cri de Banshee a signal visuel équivalent et avertit avant la menace.|Halo de danger hors champ.||zones:KALLINI-HALL
GETH|Réseau et machines geth|Motifs synthétiques originaux séparant drone, prime et alerte réseau ; éviter confusions avec pouvoir de Tali.|Symboles de source sonore.||enemies:GETH-PRIME
TUCHANKA|Ruines et mécanique du Shroud|Vent, pierre et machine montante ; grande créature reste un événement ponctuel, pas une boucle de combat constante.|Indicateur de vibration à faible mouvement.||zones:SHROUD
LEVIATHAN|Voix et abîme|Traitement vocal original intelligible avec sous-titres ; canal de voix indépendant des graves abyssaux.|Portraits et noms d’interlocuteur.||cinematics:LEVIATHAN
OMEGA|Résistance et réacteur|Métal, conduites et alarmes selon alimentation ; passage en zone sûre diminue urgence sans effacer les annonces de civils.|Pictogrammes d’alimentation.||worlds:OMEGA
CITADEL-PARTY|Musique originale de la fête|Transitions calmes/animées selon phase ; paroles éventuelles originales, piste séparée du dialogue.|Nom d’ambiance et niveau de fête.||choices:PARTY-TONE
BOSS|Lexique de télégraphes de boss|Un motif par menace : saisie, charge, rayon, renfort ; motifs accompagnés de texte et non seulement de position stéréo.|Quatre signes de menace.||enemies:BANSHEE,enemies:BRUTE,enemies:ATLAS
EPILOGUE|Montage musical des épilogues|Composition originale en segments compatibles avec toutes les branches ; aucun collage de bande originale extrait.|Sous-titres de narration et option sans musique.||cinematics:FINALE
''')

c.originals('systems','''
ATB|ATB hybride de ME3|File visible d’actions de trois membres, pause tactique facultative ; préparation, résolution et récupération séparées, annulation selon étape annoncée.|Jauges proches des portraits et chronologie courte.||characters:SHEPARD
COVER|Couvert sur décor 3D|Tags haut/bas et côtés exposés ; tester visée depuis pivot au sol indépendamment de taille du sprite.|Contours de couvert à survol.||scenery:CITADEL
TRAVERSAL|Déplacement, roulade et franchissement|Actions de mouvement utilisent réservation de destination ; coût ATB proposé distingue déplacement sûr et esquive de menace active.|Chemin et position fantôme.||animations:VAULT
DEFENSES|Protections et immunités|Santé, armure, bouclier et barrière ont règles séparées ; prévisualiser contrôle résistant et dégâts admis.|Quatre barres avec motifs et noms.||vfx:PROTECTION
COMBOS|Amorces et détonateurs|Table explicite feu/glace/tech/biotique ; détonation résout une fois, consomme l’amorce voulue et laisse les autres selon règle annoncée.|Icônes de compatibilité dans sélection.||vfx:PRIMER
WEIGHT|Masse d’armes et récupération|Charge du loadout modifie récupération proposée ; aperçu avant validation et calcul unique lors du changement.|Jauge de masse et délai estimé.||equipment:ULTRALIGHT
EVOLUTION|Arbres de pouvoirs|Rangs et bifurcations lisibles ; séparer effet actif, passif et changement de combo, avec restauration de points contrôlée.|Arbre compact et résumé de build.||powers:CLASS-PASSIVES
WAR-ASSETS|Ressources de guerre avec provenance|Chaque contribution garde mission, décision et éventuel retrait ; montant proposé du fan game distinct des chiffres du jeu original.|Registre filtrable par faction.||props:WAR-TABLE
READINESS|Original / Legendary : préparation de guerre|Deux profils de règles ; original peut relier readiness au multi, Legendary solo ne dépend d’aucun service multi ni application.|Étiquette de version persistante.|Profil de version choisi avant campagne.|choices:IMPORT
SCAN|Scan galactique et poursuite|Scan détecte ressources et peut accroître alerte ; fuite revient à une carte cohérente, données acquises restent sauvegardées.|Carte avec alerte et marqueurs de collecte.||vfx:MAP-SCAN
JOURNAL|Journal : enquête, collecte, remise|États distincts évitent de marquer une mission finie dès réception d’objet ; les demandes civiles ont destinataire visible.|Liste triable par lieu et prochaine action.||side_quests:MEDFORM
DEADLINES|Échéances de campagne|Horloge en événements de missions, pas en temps réel de lecture ; avertissements de point de non-retour proposés avant départ.|Marqueur d’urgence et condition d’expiration.||side_quests:BOMB,side_quests:GRISSOM
ROSTER|Composition et substitutions|Règles par chapitre, DLC et mode ; Mordin/Wiks, Ashley/Kaidan, Aria/Nyreen et Armax ne partagent pas un seul roster permanent.|Portrait avec raison d’indisponibilité.||characters:ARIA,characters:WREX
ROMANCE|État des relations|Relation, flirt, rupture, passé et scène finale sont variables distinctes ; scripts ne déduisent pas romance du seul sexe de Shepard.|Historique de scène consultable sans score affection affiché.||choices:ROMANCE
DLC|Ordre et admission des DLC|Manifestes From Ashes, Leviathan, Omega et Citadel ; obligations de chapitre et roster contrôlées à l’entrée et au retour.|Carte d’extension et avertissement contextuel.||main_quests:EDEN,main_quests:OMEGA
ARENA|Simulateur Armax isolé|Équipement, score et modificateurs en état temporaire ; absence de mort permanente des invités ; récompense persistée à sortie réussie.|Étiquette Simulation sur HUD.|Citadel.|side_quests:ARMAX
MP-WAVES|Module coopératif à vagues|Objectifs, réanimation, extraction et budgets de menace séparés du solo ; synchroniser décisions ATB par mode coopératif explicitement expérimental.|Quatre portraits et statut de vague.|Multijoueur original adapté, absent Legendary.|systems:MP-RETALIATION
MP-HAZARDS|Dangers des cartes multijoueurs|Variantes tempête, pluie acide, nuit, essaims, réacteur et blizzard ; danger paramétré par carte, télégraphe et chemin sûr toujours visibles.|Pictogramme danger, intensité et abris.|Module multi uniquement.|zones:MP-DAGGER,zones:MP-GHOST,zones:MP-REACTOR
ENDING|Résolveur d’épilogues|Sélectionner version, choix final, force de guerre et grands états ; utiliser table documentée sans seuil canon inventé.|Planche d’épilogues et raisons de sélection.|Extended Cut / original séparés.|cinematics:FINALE
SAVE|Sauvegarde des variantes|Sauvegarder avant grands verrous et décisions ; états inconnus d’import traités explicitement, migrations idempotentes.|Emplacements nommés par étape.||choices:IMPORT
ACCESS|Accessibilité des décisions et menaces|Sous-titres paramétrables, couleurs doublées de formes, fenêtres non chronométrées proposées et réduction d’effets ; ne pas supprimer conséquences du choix.|Panneau de réglages avec exemples.||dialogues:CATALYST
''')

c.originals('qa','''
IMPORT|Matrice QA — import ME1/ME2|Tester morts/vivants, Wrex/Wreav, Mordin/Wiks, Samara/Morinth et romance ; aucun personnage supprimé ne revient hors simulation explicitement autorisée.|Table d’états et captures des portraits.||systems:ROSTER
TUCH-CURE|Matrice QA — Tuchanka|Croiser dirigeant krogan, Eve, savant, secret révélé et choix final ; vérifier dialogues, montage et ressources de guerre à chaque feuille valide.|Arbre de décisions auditable.||choices:CURE,choices:MORDIN-SURVIVE
TUCH-BOMB|Matrice QA — échéance bombe|Compter les missions pertinentes après activation, vérifier expiration et Tarquin ; sauvegarder/charger à chaque frontière ne remet pas le compteur à zéro.|Journal et compte d’événements de test.||side_quests:BOMB
GRISSOM|Matrice QA — Grissom|Tester arrivée avant/après fenêtre, Jack vivante/absente et David sauvé/non sauvé ; civils ne restent pas bloqués sur route d’évacuation.|Scènes d’arrivée et liste des élèves.||side_quests:GRISSOM
RACHNI|Matrice QA — reine et Grunt|Distinguer reine authentique et substitut, loyauté de Grunt et décision ; actifs de guerre et personnage à la sortie suivent la bonne identité.|Quatre portraits et bilan de mission.||choices:RACHNI,choices:GRUNT
COUP|Matrice QA — Citadelle II|Croiser survivant Virmire, visites et intervenants ; vérifier coup de feu attribué au bon acteur et absence de faux recrutement.|Vidéo de scène et état du roster.||main_quests:CITADEL2
RANNOCH|Matrice QA — coexistence|Tester conditions de paix une à une, faux positif avec Legion ou Tali absent, et décisions de soutien ; résultat flotte/personnages/épilogue cohérent.|Table de prérequis nommés.||choices:PEACE
MIRANDA|Matrice QA — Sanctuary|Varier avertissement, aide, relation et rencontres ; vérifier Miranda/Oriana/Henry et message postmission sans supposer une visite reçue.|Timeline de messages et scène finale.||choices:MIRANDA,choices:ORIANA
SAMARA|Matrice QA — intervention monastère|Tester interruption, option non chronométrée et absence de Samara ; aucune réplique du personnage absent après explosion.|Capture de fenêtre et état Falere.||choices:SAMARA
OMEGA|Matrice QA — roster Omega|Aria/Nyreen seulement aux étapes valides ; pas de compagnons Normandy lors des scènes locales, retour correct à fin du DLC.|Sélecteur de groupe et portraits.||systems:DLC
OMEGA-END|Matrice QA — Afterlife|Détruire générateurs dans ordres différents, sauver/laisser civils, varier relation Aria ; aucune boucle infinie d’Adjutants après victoire.|Journal de générateurs et scène Petrovsky.||props:OMEGA-GEN,choices:PETROVSKY
LEV-FILTER|Matrice QA — enquête Leviathan|Activer filtres dans différents ordres, retirer une piste, sauver/recharger au laboratoire ; bonnes destinations et aucun verrou irréversible accidentel.|État de table et carte galactique.||props:FILTERS
LEV-DIVE|Matrice QA — plongée|Vérifier sous-titres, caméra, entrée/sortie cockpit et transition d’eau ; aucune chute sous décor 3D ni arme de terrain active dans la scène finale.|Plan de contrôle de Despoina.||links:LEV-DIVE
CLONE|Matrice QA — clone et classes|Tester chaque classe jouable, modèle personnalisé et équipements temporairement retirés ; boss a moveset admis et joueur retrouve ses biens à sortie.|Six scénarios de classe et inventaire avant/après.||enemies:CLONE
PARTY|Matrice QA — invités de Citadel|Groupe minimal, maximal et morts importés ; aucune chaise chevauchée, conversation orpheline ou photo montrant un absent.|Plan d’appartement et photo obtenue.||choices:INVITATIONS,props:PHOTO
ARMAX|Matrice QA — simulateur|Abandon, victoire, mort et retour menu ; stock de campagne restauré, points attribués une fois et invités indisponibles hors arène.|Comparaison sauvegarde avant/après.||systems:ARENA
ENDINGS|Matrice QA — fins par version|Tester options disponibles, choix et épilogue avec profils original/Extended Cut/Legendary ; aucun montage de destruction d’EDI dans branche incompatible.|Table de plans et drapeaux finaux.||systems:ENDING
PROTECTION|Matrice QA — pouvoirs et défenses|Chaque pouvoir reçoit cible santé, armure, bouclier, barrière et immunité ; comparer aperçu et effet, vérifier absence de coût sur cible invalide.|Arène de mannequins à protections.||systems:DEFENSES
BOSS-TELEGRAPH|Matrice QA — saisies et attaques lourdes|Phantom, Banshee, Brute, Atlas et Adjutant à toutes orientations et hors champ ; toujours un signal visible et une réponse autorisée avant impact.|Captures huit orientations et journal d’actions.||audio:BOSS
DEPTH|Matrice QA — sprites sur 3D|Traverser escaliers, portes, grands ennemis et couverts ; pivot au sol, profondeur et sélection restent stables sans sprite derrière le mauvais mur.|Scène de contrôle de hauteurs.||systems:COVER
MP-SEPARATION|Matrice QA — modes solo et multi|Aucun personnage multijoueur, carte Firebase ni besoin de connexion dans profil Legendary ; Armax garde son propre marqueur de simulation.|Écrans de sélection par profil.||systems:READINESS,systems:MP-WAVES
SAVE-LOCK|Matrice QA — reprise aux grands verrous|Recharger avant QG, avant choix final, pendant journal de DLC et après récompense ; pas de double déblocage ni quête réouverte.|Emplacements de sauvegarde nommés.||systems:SAVE
ACCESS|Matrice QA — accès sans couleur ni son|Tester muet, daltonisme simulé, faible contraste et réduction de mouvement ; tous choix et télégraphes restent compréhensibles.|Captures et parcours documentés.||systems:ACCESS
''')

c.originals('continuity','''
ME1|Continuité — héritage ME1|Virmire, Wrex, reine rachni, Conseil et choix coloniaux sont des variables de contexte, pas un récit unique déclaré canon.|Frise d’import avec inconnus explicités.||choices:IMPORT
ME2|Continuité — héritage ME2|Survie, loyauté, Maelon, Overlord, Cerberus et romances importés séparément ; valeur absente n’est pas assimilée à échec.|Dossier de sauvegarde logique.||choices:IMPORT
GENOPHAGE|Continuité — génophage|Répercuter Eve, Wrex/Wreav, cure/sabotage et destin du savant dans dialogues et forces ; pas de réparation implicite après mission.|Résumé de Tuchanka et portrait politique.||choices:CURE
RANNOCH|Continuité — peuples de Rannoch|État des flottes et survie Tali/Legion suivent la résolution choisie jusque fête et final ; exclure invités morts.|Table de peuples et personnages.||choices:PEACE
MIRANDA|Continuité — Lawson et Cerberus|L’arc de Miranda dans ME2 informe ses messages ME3 ; Sanctuary reste son propre événement, sans faire du roman une condition obligatoire.|Chronologie des rencontres.||choices:MIRANDA
JAVIK|Continuité — From Ashes|Présence de Javik conditionne ses réactions, pas la possibilité de comprendre le récit principal ; absence DLC ne supprime pas la conclusion.|Entrée de roster et scènes alternatives.||characters:JAVIK
LEVIATHAN|Continuité — révélation des origines|Informations acquises seulement après l’enquête ; les répliques du Catalyseur utilisent un état de connaissance dédié.|Codex avant/après DLC.||lore:LEVIATHANS
OMEGA|Continuité — station et Aria|ME2, occupation et libération sont trois états distincts ; le catalogue ne crée pas de libre hub post-DLC non attesté.|Carte de station par période.||worlds:OMEGA
CITADEL|Continuité — placement de Citadel|Positionner le contenu avant le départ final, avec invités selon progression ; une scène festive n’annule pas les pertes déjà actées.|Timeline de congé et verrou QG.||systems:DLC
EXTENDED|Continuité — Extended Cut|Répartir scènes ajoutées et épilogues selon profil d’édition ; garder les variantes disponibles sans élire une fin officielle.|Manifeste des fins.||systems:ENDING
LEGENDARY|Continuité — règles Legendary|Pas de multijoueur ni dépendance de readiness à un service externe ; acquisition d’équipement et Extended Cut suivent le profil choisi.|Badge Legendary et provenance d’objet.||systems:READINESS
ANDROMEDA|Continuité — départ de l’Initiative|Le futur catalogue Andromeda n’exige pas une fin canon de ME3 ; séparation des chronologies et révélations à documenter sans retcon.|Frise distincte des galaxies.||choices:DESTROY
SPINOFFS|Continuité — romans et comics|Référencer les œuvres connexes par bibliographie, pas comme preuves d’événements d’une sauvegarde ; spoilers filtrés par période.|Liens documentaires hors journal de mission.||systems:JOURNAL
CANON|Continuité — faits et adaptation|Description/source expriment les faits brefs ; ATB, ressources proposées, timings et méthodes d’art sont originaux et non des valeurs BioWare.|Bandeau de nature dans chaque fiche.||systems:ATB
''')

# Sources primaires de systèmes qui pourraient sinon être lus comme simples idées de design.
for e in c.entries:
    if e['id'] in ('ME3-SYS-READINESS','ME3-CON-LEGENDARY'):
        e['sourceIds']=['ME3-SRC-EA-CAL']; e['reference']='Gameplay Calibrations — Legendary Edition'
    if e['id']=='ME3-CON-EXTENDED': e['sourceIds']=['ME3-SRC-BW-EC','ME3-SRC-EA-CAL']

# Critères de réception contextualisés pour les scènes à conséquences irréversibles.
critical={
('main_quests','TUCHANKA'):'Chaque branche de cure/sabotage charge le bon scientifique, le bon dirigeant et le bon état d’Eve ; la tour, le journal, les forces de guerre et les entretiens suivants donnent le même résultat. Aucune branche de survie de Mordin sans prérequis vérifiés.',
('main_quests','RANNOCH'):'La paix n’apparaît que si tous les prérequis documentés sont satisfaits ; détruire une flotte retire ses contributions et applique le destin des personnages avant retour au Normandy. Le laser possède une aide de maintien et un signal avant rayon.',
('main_quests','HORIZON'):'Les rencontres et aides réellement enregistrées déterminent la variante Lawson ; Miranda absente n’apparaît pas dans une cinématique, Oriana reçoit toujours son état final et le journal clôt Sanctuary une fois.',
('main_quests','OMEGA'):'Les étapes locales n’acceptent que les compagnons autorisés ; chaque générateur désactivé est conservé à la reprise, la boucle de combat s’arrête à la victoire et la branche Petrovsky restitue le groupe normal après départ.',
('main_quests','DESPOINA'):'Le passage épave/méca/abîme se charge sans perdre les preuves ; voix compréhensible avec effets réduits, aucune commande de combat dans dialogue final, retour au Normandy avec révélation et contribution enregistrées une fois.',
('main_quests','CIT-NORMANDY'):'Chaque classe du clone possède un cycle d’action contrôlable ; skip et lecture complète rendent le même équipement, le même sort de Brooks et le même journal. Aucun invité n’est modifié par le duel.',
('main_quests','CERBERUS'):'Le départ requiert une confirmation du verrou narratif et crée une sauvegarde préalable ; retour menu n’annule pas le verrou après engagement, archives et Kai Leng se clôturent sans doubler les preuves.',
('main_quests','FINAL'):'L’option sélectionnée, le profil d’édition et les états politiques produisent un montage cohérent ; une option indisponible ne peut être validée via clavier. Le refus est une branche narrative définie, jamais une erreur technique.',
('choices','MORDIN-SURVIVE'):'Tester Wrex vivant, Eve vivante et sabotage révélé séparément : chacun doit bloquer la branche exceptionnelle correspondante. Tester le cas admissible puis vérifier absence de scène de mort et attribution correcte de sa contribution.',
('choices','PEACE'):'Tester sauvegardes satisfaisant tous les prérequis puis retirer chacun à tour de rôle ; aucune paix avec Tali ou Legion absents si la table de référence l’exclut. Pas de seuil numérique reconstitué sans preuve.',
('side_quests','BOMB'):'La fenêtre compte les événements de mission définis et persiste après sauvegarde ; lancement de Priority: Tuchanka ne doit pas être codé comme expiration automatique sans preuve de la règle choisie.',
('side_quests','GRISSOM'):'La fenêtre de secours et ses conséquences sont testées ; tous les groupes d’élèves atteignent l’extraction sans collider bloquant, Jack et David n’apparaissent que selon import.',
('choices','INVITATIONS'):'Chaque invité satisfait survie et progression ; bouton invité ne duplique pas la personne, la photo et les conversations excluent toute absence et fonctionnent avec le roster minimal.',
}
for (category,key),criteria in critical.items():
    target=c.ident(category,key)
    found=[e for e in c.entries if e['id']==target]
    assert found,target
    found[0]['acceptance']=criteria
    found[0]['animation']='Prévoir chaque variante de scène comme état nommé ; lecture, interruption et saut appliquent exactement les mêmes décisions et positions finales. '+found[0]['visual']
    found[0]['audio']='Dialogues originaux enregistrés par branche, nom du locuteur et sous-titres ; couper les répliques de personnages absents avant mixage, préserver les alertes utiles pendant les transitions.'

c.sprites()
c.cover('Campagne solo','Prologue, priorités, missions N7, grandes missions conditionnelles et demandes civiles/collectes nommées.','Parcours pièce par pièce, positions exactes de loot, textes et toutes variantes mineures de dialogues non vérifiés en jeu.')
c.cover('Extensions solo','From Ashes, Leviathan, Omega, Citadel, activités Armax et Extended Cut ; roster et décisions propres.','Ordre de chaque petite rencontre sociale, tous scores d’arène et chaque paramètre de pack d’équipement à relever par édition.')
c.cover('Combats et ressources','Familles adverses, attaques proposées, arsenal et pouvoirs substantiels, fiches de sprites, animations, VFX, décors et audio.','Pas de fichiers artistiques livrés ni statistiques originales certifiées ; variantes de mods, rangs, skins et personnages multi restent à détailler.')
c.cover('Choix et continuité','Matrices Tuchanka, Rannoch, Sanctuary, imports, invités et fins ; états mutuellement conditionnels.','Seuils numériques exacts et minutages d’origine volontairement non inventés ; exigences à confirmer par captures dans édition ciblée.')
c.cover('Multijoueur','Module original séparé, cinq packs, cartes, dangers, factions et cadre de vagues ; aucun multi dans Legendary.','Chaque personnage jouable, défi, carte de danger, mod et coefficient de difficulté n’a pas encore sa fiche exhaustive ; adaptation coop ATB expérimentale.')
c.cover('Traçabilité','Sources officielles EA/BioWare pour éditions et DLC ; index wiki secondaires pour inventaire détaillé.','Consultation par pages indexées lorsque Fandom direct est limité ; aucune revendication d’audit exhaustif ou de validation de tous les embranchements en jeu.')

if __name__=='__main__': c.write()

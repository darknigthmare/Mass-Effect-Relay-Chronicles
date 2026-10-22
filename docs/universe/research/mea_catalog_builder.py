from games_catalog_common import Catalog

c=Catalog('MEA','Mass Effect Andromeda','Campagne solo complète comme périmètre de préparation, grands arcs d’alliés, mondes de Heleus, tâches représentatives et épilogue. Profils de patch explicités. APEX et multijoueur coopératif sont des modules séparés ; aucun DLC narratif solo hypothétique ni résolution inventée de l’arche quarienne.')
def wiki(key,title,path,scope): c.src(key,title,'https://masseffect.fandom.com/wiki/'+path,scope)
for key,title,url,scope in [
('EA-GAME','Mass Effect: Andromeda — EA','https://www.ea.com/games/mass-effect/mass-effect-andromeda','Exploration, rôle du Pathfinder et équipage'),
('BW-FINAL','Mass Effect: Andromeda — message du studio','https://blog.bioware.com/2017/08/19/mass-effect-andromeda/','Fin des mises à jour solo après 1.10, autres supports narratifs'),
('BW-108','Mass Effect: Andromeda Patch 1.08 Notes','https://blog.bioware.com/2017/06/06/mass-effect-andromeda-patch-1-08-notes/','Romance Jaal/Scott et changements de personnages'),
('BW-106','Mass Effect: Andromeda Patch 1.06 Notes','https://blog.bioware.com/2017/05/09/mass-effect-andromeda-patch-1-06-notes/','Correctifs de dialogue, cinématique et sauvegarde'),
('MANUAL','Mass Effect: Andromeda — manuel PC','https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-pc-en.pdf','Commandes, personnages, loadout et modes'),
('EA-DELUXE','Mass Effect: Andromeda — boutique EA sur Steam','https://store.steampowered.com/app/1238000/Mass_EffectAndromeda/','Édition Deluxe, armes/armures/skins et pyjak')]:c.src(key,title,url,scope,'source officielle')
for args in [
('GAME','Mass Effect: Andromeda','Mass_Effect%3A_Andromeda','Périmètre et chronologie'),
('GUIDE','Mass Effect: Andromeda Guide','Mass_Effect%3A_Andromeda_Guide','Campagne, ordre variable et missions'),
('MISSIONS','Missions (Mass Effect: Andromeda)','Missions_%28Mass_Effect%3A_Andromeda%29','Index des missions et catégories de journal'),
('CHAR','Characters/Mass Effect: Andromeda','Characters/Mass_Effect%3A_Andromeda','Personnages et factions'),
('SQUAD','Squad Members Guide (Mass Effect: Andromeda)','Squad_Members_Guide_%28Mass_Effect%3A_Andromeda%29','Équipiers et composition'),
('LOYALTY','Loyalty Missions (Mass Effect: Andromeda)','Loyalty_Missions_%28Mass_Effect%3A_Andromeda%29','Missions d’alliés et déblocages'),
('COMBAT','Combat (Mass Effect: Andromeda)','Combat_%28Mass_Effect%3A_Andromeda%29','Déplacement, protections et combat'),
('SKILLS','Skills','Skills','Compétences de combat, biotique, tech et équipiers'),
('TOOLS','Combat Tools','Combat_Tools','Passifs de combat'),
('AUX','Auxiliary Systems','Auxiliary_Systems','Passif tech'),
('SUPPORT','Team Support (skill)','Team_Support_%28skill%29','Passif de soutien'),
('BARRICADE','Barricade (skill)','Barricade_%28skill%29','Barrière de combat'),
('TURRET','Assault Turret (skill)','Assault_Turret_%28skill%29','Construction technique'),
('CORA','Cora Harper','Cora_Harper','Équipière et compétences'),
('VETRA','Vetra Nyx','Vetra_Nyx','Équipière et compétences'),
('JAAL','Jaal Ama Darav','Jaal_Ama_Darav','Équipier et arc familial'),
('ROMANCE','Romance (Mass Effect: Andromeda)','Romance_%28Mass_Effect%3A_Andromeda%29','Relations et versions'),
('WEAPONS','Weapons (Mass Effect: Andromeda)','Weapons_%28Mass_Effect%3A_Andromeda%29','Familles et armes'),
('MELEE','Melee Weapons','Melee_Weapons','Armes de contact'),
('SWEEPER','Sweeper','Sweeper','Arme reliquate'),
('ARMOR','Armor (Mass Effect: Andromeda)','Armor_%28Mass_Effect%3A_Andromeda%29','Pièces et familles technologiques'),
('ANGARA-ARMOR','Angaran Armor','Angaran_Armor','Armure angara'),
('N7-ARMOR','N7 Armor','N7_Armor','Armure N7'),
('REM-ARMOR','Remnant Armor','Remnant_Armor','Armure reliquate'),
('SCAV-ARMOR','Scavenger Armor','Scavenger_Armor','Armure additionnelle'),
('HELEUS-ARMOR','Heleus Armor','Heleus_Armor','Armure de fusion technologique'),
('KETT-ARMOR','Kett Armor','Kett_Armor','Armure inspirée kett'),
('RESEARCH','Research Center (Mass Effect: Andromeda)','Research_Center_%28Mass_Effect%3A_Andromeda%29','Recherche et fabrication'),
('LOADOUT','Loadout','Loadout','Armes et armures sélectionnées'),
('WARDROBE','Wardrobe','Wardrobe','Tenues et couleurs'),
('CODEX','Codex Entry Guide (Mass Effect: Andromeda)','Codex_Entry_Guide_%28Mass_Effect%3A_Andromeda%29','Codex et contexte'),
('LOCATIONS','Codex — Planets And Locations','Codex_%28Mass_Effect%3A_Andromeda%29/Planets_And_Locations','Planètes et lieux'),
('VAULT','Vault','Vault','Caveaux reliquats'),
('HAZARD','Hazard','Hazard','Dangers environnementaux par monde'),
('ASCENDANT','Ascendant','Ascendant','Unité kett, orbe et attaques'),
('AGENT','Agent','Agent','Unité hors-la-loi et index bestiaire'),
('CHOSEN','Chosen','Chosen','Unité kett et index bestiaire'),
('ASSEMBLER','Assembler','Assembler','Unité reliquate et renforts'),
('ADHI','Adhi','Adhi','Faune et usage par ennemis'),
('KAERKYN','Kaerkyn','Kaerkyn','Faune'),
('SPITBUG','Spitbug','Spitbug','Faune et projectile'),
('CHALLYRION','Challyrion','Challyrion','Faune'),
('TAURG','Taurg','Taurg','Faune'),
('EIROCH','Ancient Eiroch','Ancient_Eiroch','Créature lourde'),
('MP','Mass Effect: Andromeda Multiplayer','Mass_Effect%3A_Andromeda_Multiplayer','Coopératif séparé du solo'),
('MP-CHARS','Multiplayer Characters (Mass Effect: Andromeda)','Category%3AMultiplayer_Characters_%28Mass_Effect%3A_Andromeda%29','Roster multijoueur distinct'),
('ARCHON','Hunting the Archon','Hunting_the_Archon','Arche galarienne et choix de secours'),
('MERIDIAN','Meridian: The Way Home','Meridian%3A_The_Way_Home','Final, Hyperion et alliés'),
('EPILOGUE','Epilogue: Home and Away','Epilogue%3A_Home_and_Away','Ambassade, équipage et signal quarien'),
('CORA-LOYAL','Cora Harper: At Duty’s Edge','Cora_Harper%3A_At_Duty%27s_Edge','Arche asari et Sarissa'),
('PEEBEE-LOYAL','Peebee: A Mysterious Remnant Signal','Peebee%3A_A_Mysterious_Remnant_Signal','Pas-10, Kalinda et choix'),
('PEEBEE-POC','Peebee: Reclaiming Poc','Peebee%3A_Reclaiming_Poc','Poc et lien vers mission de loyauté'),
('JAAL-LOYAL','Jaal Ama Darav: Flesh and Blood','Jaal_Ama_Darav%3A_Flesh_and_Blood','Akksul et famille de Jaal'),
('MISSING-ARKS','Missing Arks','Missing_Arks','Arches disparues et missions'),
('MURDER','First Murderer','First_Murderer','Enquête de Nilken Rensus'),
('NILKEN','Nilken Rensus','Nilken_Rensus','Accusation et enquête'),
('HIGH-NOON','High Noon','High_Noon','Pouvoir à Kadara'),
('LIAM-OUTPOST','Liam Kosta: Outpost Worlds','Liam_Kosta%3A_Outpost_Worlds','Arc de Liam'),
('ALIEN-TASK','Task: Comparatively Alien','Task%3A_Comparatively_Alien','Tâche scientifique')]:wiki(*args)

c.rows('characters','''
RYDER|Pathfinder Ryder — Sara ou Scott|Le joueur choisit l’un des jumeaux Ryder.|Protagoniste ATB mobile : trois compétences actives dans un favori proposé, profils adaptables et ordres d’équipe ; ne pas figer une classe de Shepard.|Personnalisation humaine et armure de Pionnier.|L’autre jumeau a un rôle narratif distinct.|EA-GAME,SKILLS
CORA|Cora Harper|Équipière biotique humaine.|Avant-garde protectrice : Charge, Nova et Shield Boost traduits en approche, choc et secours ; réserve de protection visible.|Coupe courte, armure de Pionnier et halo biotique.||CORA
LIAM|Liam Kosta|Équipier humain.|Assaut mobile avec Havoc Strike, grenades et soutien électrique ; sa prise de risque devient une option d’ordre claire.|Armure légère et posture vive.||SQUAD,SKILLS
VETRA|Vetra Nyx|Équipière turienne.|Tireuse de soutien avec armure renforcée et Turbocharge ; sa défense couvre l’engagement d’une rafale prolongée.|Grande silhouette turienne, visière et armure sombre.||VETRA,SKILLS
JAAL|Jaal Ama Darav|Équipier angara.|Tireur d’angle avec Energy Drain, Avenger Strike et Sticky Grenade ; retour de mobilité vers emplacement réservé.|Manteau angara, visage violet et silhouette large.||JAAL,SKILLS
DRACK|Nakmor Drack|Équipier krogan.|Combattant de contact avec Blood Rage, Incinerate et Flak Cannon ; ne pas confondre rage offensive et invulnérabilité.|Vieille carapace krogan, armure lourde et pièces techniques.||SQUAD,SKILLS
PEEBEE|Pelessaria B’Sayle / Peebee|Équipière asari et chercheuse de Reliquats.|Pull, Invasion et Shockwave ouvrent des contrôles complémentaires ; Poc reste un dispositif propre à son arc.|Masque de peinture, veste et silhouette asari.||SQUAD,SKILLS
ALEC|Alec Ryder — prologue|Pionnier initial de l’Hyperion.|Allié guide de Habitat 7 ; actions d’apprentissage puis retrait narratif, sans slot permanent après transmission.|Armure N7 et casque de Pionnier.|Prologue uniquement.|GUIDE
''')

c.rows('npcs','''
TWIN|Jumeau Ryder non choisi|L’autre Ryder intervient dans le récit.|Un profil d’apparence dérivé du choix initial et des scènes propres ; pas de copie du sprite de combat sans distinction.|Sara ou Scott selon protagoniste.|Identité opposée au choix joueur.|GUIDE,MERIDIAN
SAM|SAM|IA liée au Pathfinder.|Canal d’aide et de scanner ; distinguer analyse acquise, hypothèse et conseil, réduire répétitions de dangers connus.|Interface de voix et terminal SAM.||EA-GAME,CODEX
LEXI|Dr Lexi T’Perro|Médecin du Tempest.|Bilans d’équipage et arc personnel ; dialogue médical séparé de redistribution des compétences.|Asari en tenue médicale et infirmerie.||CHAR
KALLO|Kallo Jath|Pilote du Tempest.|Transit et souvenirs de construction ; conflit avec Gil stocké comme scènes vues plutôt que score d’hostilité arbitraire.|Salarien à la passerelle.||CHAR,MISSIONS
SUVI|Suvi Anwar|Scientifique du Tempest.|Rapports d’exploration, conversation personnelle et découverte ; voix de science distincte de SAM.|Uniforme de scientifique et console de navigation.||CHAR,MISSIONS
GIL|Gil Brodie|Ingénieur du Tempest.|Atelier, poker et relations ; ne pas faire du succès à un minijeu une condition canon inventée de son amitié.|Tenue d’atelier et salle moteur.||CHAR,MISSIONS
JILL|Jill|Personnage de l’arc de Gil.|Scènes personnelles et messages contextualisés ; préserver son rôle distinct des décisions de Ryder.|Portrait civil et message à bord.||CHAR
TANN|Jarun Tann|Dirigeant du Nexus.|Briefings d’implantation et décisions politiques ; options de rapport ne valent pas automatiquement approbation.|Salarien en tenue de direction.||CHAR,MISSIONS
ADDISON|Foster Addison|Responsable coloniale du Nexus.|Suivi des avant-postes et dossiers de personnel ; messages de progrès liés aux implantations réelles.|Tenue administrative et bureau du Nexus.||CHAR
KANDROS|Tiran Kandros|Responsable militaire du Nexus.|APEX, sécurité et pistes d’arche turienne ; mission multi facultative clairement signalée.|Turien en uniforme de milice.||CHAR,MISSING-ARKS
KESH|Nakmor Kesh|Responsable technique du Nexus.|Réparations et liens krogan ; arc de Drack et demandes personnelles ne se remplacent pas par une simple quête de ressources.|Krogan à l’atelier du Nexus.||CHAR
DUNN|Nozomi Dunn|Capitaine de l’Hyperion.|Commandement de l’arche puis scène de final ; présence d’autres Pionniers vérifiée pour les variantes de sauvetage.|Uniforme de capitaine et passerelle.||MERIDIAN,EPILOGUE
HARRY|Harry Carlyle|Médecin de l’Hyperion.|Tutoriel de réveil et suivi du jumeau ; examens conduisent aux scènes de famille, jamais à une statistique de diagnostic inventée.|Blouse et salle de cryostase.||CHAR
FISHER|Fisher|Membre de l’équipe de Habitat 7.|PNJ de secours de prologue ; son marqueur blessé reste visible derrière les rochers.|Tenue de reconnaissance et blessure.|Habitat 7.|CHAR,GUIDE
GREER|Greer|Membre de l’équipe de Habitat 7.|Branche de recherche et secours facultative ; journal distingue trouvé, secouru et extraction.|Armure d’équipe de Pionnier.|Habitat 7.|CHAR,GUIDE
KIRKLAND|Kirkland|Membre de l’équipe du prologue.|Scène du premier contact hostile avec conséquence narrative ; ne pas proposer un sauvetage sans preuve.|Armure de reconnaissance.|Habitat 7.|CHAR,GUIDE
ELLEN|Ellen Ryder|Mère des jumeaux.|Présence par souvenirs et révélations familiales ; informations verrouillées par progression de SAM.|Portrait familial et cryostase selon révélation.|Arc familial, spoilers.|CHAR,MISSIONS
GARSON|Jien Garson|Fondatrice de l’Initiative.|Documents et enquête de mémoire ; ne pas présenter son apparition comme PNJ vivant au Nexus.|Enregistrements et portrait officiel.|Souvenirs / enquête.|CHAR,CODEX
BENEFACTOR|Bienfaiteur non identifié|Une figure mystérieuse finance l’Initiative.|Dossier de pistes sans identité inventée ; statut inconnu conservé à la fin de l’œuvre.|Communication masquée et documents.|Mystère non résolu dans le périmètre.|CHAR,CODEX
BRADLEY|August Bradley|Responsable de Prodromos.|Contact de progrès d’Eos et mission Making an Impression ; invitation liée au vrai retour de colonisation.|Tenue d’avant-poste et poste de commandement.||CHAR,MISSIONS
SLOANE|Sloane Kelly|Dirigeante de Kadara Port.|Entretien de pouvoir, accès local et High Noon ; changements de régime répercutés sur les gardes.|Armure de hors-la-loi et salle du trône.||HIGH-NOON,CHAR
REYES|Reyes Vidal|Interlocuteur majeur de Kadara.|Enquêtes, relation et rôle politique à révélation progressive ; ne pas spoiler son identité dans l’UI initiale.|Tenue civile sombre et bar de Kadara.||HIGH-NOON,CHAR
EVFRA|Evfra de Tershaav|Chef de la Résistance angara.|Autorise des opérations selon confiance et résultats ; une mission obtenue reste lisible après changement de planète.|Angara en tenue de commandement.||CHAR,GUIDE
MOSHAE|Moshae Sjefa|Scientifique angara recherchée.|Sauvetage et révélation de l’exaltation ; attitude liée aux décisions sans en faire un objet de récompense.|Angara âgée en tenue de recherche.||GUIDE
AKKSUL|Akksul|Chef des Roekaar.|Confrontation familiale de Jaal avec interruption conditionnelle ; visée de l’arme doit montrer clairement qui menace qui.|Visage angara marqué et tenue militante.|Arc de Jaal.|JAAL-LOYAL
RAEKA|Zevin Raeka|Pionnière galarienne.|Alliée de l’arche et branche de secours ; contribution finale conditionnelle à survie.|Salarienne en tenue de Pionnier.|Choix de Hunting the Archon.|ARCHON
HAYJER|Lumont Hayjer|Successeur possible de Raeka.|Profil de Pionnier alternatif avec scènes propres ; ne pas le créer si Raeka occupe toujours le rôle.|Salarien et tenue de Pionnier.|Succession conditionnelle.|EPILOGUE,CHAR
AVITUS|Avitus Rix|Personnage de l’arche turienne.|Recherche de Macen puis choix de succession ; un refus ne le transforme pas automatiquement en Pionnier au final.|Turien en armure de reconnaissance.|Arc de l’arche turienne.|MISSING-ARKS,CHAR
MACEN|Macen Barro|Pionnier de l’arche turienne.|Traces et révélation de son sort ; séparer enregistrements passés et acteur présent de la scène.|Portrait turien et archives de SAM.|Arc Natanus.|CHAR,MISSING-ARKS
SARISSA|Sarissa Theris|Pionnière asari de l’arc Leusinia.|Confrontation autour des données et du sacrifice d’Ishara ; maintien ou remplacement selon décision.|Asari en armure de commandement.|Mission de Cora.|CORA-LOYAL
VEDERIA|Vederia Damali|Personnage de l’arche asari.|Assistance technique et succession possible ; mêmes zones mais dialogues selon fonction finale.|Asari et armure de l’arche.|Mission de Cora.|CORA-LOYAL
ATANDRA|Capitaine Atandra|Capitaine du Leusinia.|Point de retour à la passerelle et résolution ; préserver sa fonction de capitaine distincte du Pionnier.|Asari à la passerelle.|Mission de Cora.|CORA-LOYAL
MORDA|Nakmor Morda|Dirigeante krogan de New Tuchanka.|Négociations du moteur reliquat et de l’installation ; accord local ne réconcilie pas tous les conflits de Nexus par défaut.|Krogan imposante et salle de commandement.||CHAR,MISSIONS
VORN|Vorn|Personnage de l’arc de Drack.|Sauvetage et recherche krogan ; garantir un chemin de sortie malgré grandes silhouettes.|Krogan scientifique et équipement de terrain.|Arc de Drack.|CHAR,MISSIONS
SPENDER|William Spender|Administrateur lié à l’arc krogan.|Collecte de preuves et confrontation ; accusation n’est validée qu’après éléments du dossier prévu.|Humain en tenue administrative.|Krogan Betrayal.|CHAR,MISSIONS
SID|Sid Nyx|Sœur de Vetra.|Messages et intervention de mission ; relation de sœurs séparée de celle de Ryder/Vetra.|Jeune turienne et portrait de communication.|Arc de Vetra.|VETRA,CHAR
KALINDA|Kalinda T’Reve|Personnage du passé de Peebee.|Rivalité, poursuite et résolution conditionnelle ; secours ou tir produisent des retours différents.|Asari et tenue de voyage.|Arc de Peebee.|PEEBEE-LOYAL
KIIRAN|Kiiran Dals|Chercheuse angara de Havarl.|Point d’enquête de planète et aide scientifique ; tableau d’indices plutôt que longue exposition obligatoire.|Angara au poste de recherche.||CHAR,MISSIONS
ESMUS|First Sage Esmus|Sage de Havarl.|Entretien de progression vers le caveau ; vocabulaire angara expliqué sans remplacer ses croyances par une certitude universelle.|Sanctuaire de Mithrava et tenue de sage.||CHAR,MISSIONS
TAAVOS|Taavos|Angara de l’arc Havarl.|Guide contextuel lié à A Dying Planet ; suivi de déplacement robuste dans forêt dense.|Angara en tenue de terrain.|Arc de Havarl.|CHAR,MISSIONS
NILKEN|Nilken Rensus|Accusé de meurtre sur le Nexus.|Dialogue de détenu et enquête ; séparer intention, fait matériel et décision politique finale.|Turien derrière une barrière de cellule.|First Murderer.|NILKEN,MURDER
MARIETTE|Mariette|Épouse de Nilken.|Demande d’enquête puis réponse selon verdict ; ne pas répéter la quête après clôture.|Turienne près de la milice.|First Murderer.|MURDER
PRIMUS|La Primus|Dirigeante kett.|Proposition et rivalité avec l’Archonte à accès conditionnel ; toute coopération garde sa provenance dans le journal.|Kett de commandement et communication.|Arc secondaire de renseignement.|CHAR,MISSIONS
RYNN|Spécialiste Rynn Gee|Interlocutrice de Port Meridian.|Transmet le signal de l’arche quarienne ; message d’alerte conservé sans fabriquer de suite jouable.|Uniforme et terminal d’écoute.|Épilogue.|EPILOGUE
''')

c.rows('main_quests','''
HYPERION|Prologue: Hyperion|Réveil sur l’arche humaine.|Tutoriel dialogue, déplacement et scanner avec étapes courtes ; personnalisation confirmée avant entrée sur terrain.|Cryostase, passerelle et fenêtres spatiales.||GUIDE
PLANETSIDE|Planetside — Habitat 7|Première exploration planétaire.|Décomposer atterrissage, recherche d’équipe, premier combat et tour reliquate ; dangers météo lisibles avant mouvement.|Roches flottantes, éclairs et ruines.||GUIDE
NEXUS|Nexus Reunion|Premier contact avec le Nexus.|Hub de présentation avec parcours libre et interlocuteurs repérables ; toutes les missions obtenues gardent leur provenance.|Station incomplète et bureaux.||GUIDE
FIRST-STRIKE|First Strike|Introduction aux équipes d’intervention.|Tutoriel d’envoi de Strike Team et explication du mode APEX facultatif ; aucun lancement multijoueur imposé.|Table de mission et succès estimé.||MISSIONS,MP
EOS|A Better Beginning|L’opération d’Eos fonde le premier avant-poste.|Site abandonné, monolithes, caveau puis implantation ; séparer étapes de viabilité et choix de fonction de colonie.|Désert irradié, ruines et Prodromos.||GUIDE
AVP|AVP Cryo Deployment Perks|La progression déverrouille des avantages de cryostase.|Écran de spécialistes et bénéfices, confirmation réversible de lecture ; réveil n’est pas recrutement d’un équipier de terrain.|Pod, liste de rôles et avantage.||MISSIONS
AYA|A Trail of Hope I|Premier accueil sur Aya.|Présenter angara, restrictions et contacts ; confiance obtenue par missions, pas par simple traversée du hub.|Ville sous cascade et contrôle d’accès.||GUIDE
RESISTANCE|Meet the Resistance|Arc de Résistance sur Voeld.|Mission dont catégorie dépend de l’ordre Havarl/Voeld ; même identifiant de progression sous deux vues de journal.|Base angara enneigée.|Priority Ops ou Heleus selon parcours.|MISSIONS
FRONTLINES|On the Frontlines|Étape de Voeld selon ordre choisi.|Contact militaire et route de sauvetage ; ne pas la rendre obligatoire si le parcours Havarl l’a remplacée.|Avant-poste enneigé et radio.|Si Voeld traité avant Havarl.|MISSIONS
RESCUE|Stage a Rescue|Opération de secours angara.|Préparer assaut, libérer groupes et valider extraction ; peut apparaître sous catégorie différente selon donneur.|Prison kett et cellule d’otages.|Catégorie conditionnelle selon parcours.|MISSIONS
HAVARL|Helping Havarl’s Scientists|Mission scientifique de Havarl.|Inspecter l’anomalie reliquate et libérer les chercheurs ; résolution du puzzle et sécurité du groupe sont deux validations.|Jungle, chercheurs et dispositif reliquat.|Priority Ops ou Heleus selon ordre.|MISSIONS
MOSHAE|A Trail of Hope II|Le secours de la Moshae mène à une révélation.|Installation d’exaltation, Cardinal puis décision de sort du site ; annoncer les alternatives avant engagement.|Complexe kett et capsules angara.||GUIDE
ARCHON|Hunting the Archon|La traque mène à l’arche galarienne.|Enquête Kadara, abordage, piège et choix de secours ; les deux objectifs finaux ne sont pas simultanément sauvables par défaut.|Vaisseau kett, arche et laboratoire.||ARCHON
ELAADEN|Elaaden: A New World|Introduction au monde désertique.|Accès aux krogans, points de survie et conflits locaux ; ne pas forcer tout arc du monde comme priorité principale.|Sable, New Tuchanka et épave reliquate.||MISSIONS
H047C|H-047c: A New World|Exploration d’un monde fragmenté.|Nomad obligatoire hors dôme, entrée de terrain sûr explicitée ; ressources et mission Tiller distinctes.|Astéroïdes, vide et dômes.||MISSIONS,HAZARD
JOURNEY|The Journey to Meridian|La recherche vise le réseau de Méridiane.|Assaut et activation du site reliquat ; identifier ville/centre découvert et véritable destination pour éviter confusion de carte.|Structures reliquates et architecture géante.||GUIDE
MERIDIAN|Meridian: The Way Home|Opération finale contre l’Archonte.|Perte de SAM, relais du jumeau, secours Hyperion puis combat final à objectifs ; alliés acquis conditionnent apparitions.|Hyperion, sphère habitable et noyau.||MERIDIAN
EPILOGUE|Epilogue: Home and Away|Retrouvailles à Port Meridian.|Dialogue du jumeau, ambassadeur et équipage ; étapes de conversation obligatoires et facultatives distinguées.|Arche posée, fête et plateforme.||EPILOGUE
WORLD-WAITING|The World is Waiting|Le jeu permet de poursuivre l’exploration.|Retour au Tempest et activités restantes ; ne pas rouvrir automatiquement les choix irréversibles du final.|Carte de Heleus avec objectifs restants.||MISSIONS
''')

for args in [
('LIAM-LOYAL','Liam Kosta: All In','Liam_Kosta%3A_All_In','Sauvetage, gravité et retour de Liam'),
('VETRA-LOYAL','Vetra Nyx: Means and Ends','Vetra_Nyx%3A_Means_and_Ends','Piège, Sid et systèmes de sécurité'),
('DRACK-LOYAL','Nakmor Drack: A Future for our People','Nakmor_Drack%3A_A_Future_for_our_People','Vorn, graines, Aroane et Spender'),
('DRACK','Nakmor Drack','Nakmor_Drack','Équipier, prothèses et compétences')]:wiki(*args)

c.rows('side_quests','''
CORA-ARK|Cora Harper: Asari Ark|Recherche de l’arche asari.|Chaîne d’indices avec contacts et balises ; journal montre la prochaine piste sans révéler le rôle de Sarissa.|Hologrammes d’arche et traces de voyage.||MISSIONS
CORA-EDGE|Cora Harper: At Duty’s Edge|Mission de loyauté de Cora.|Assaut du Leusinia, réparation, révélation du journal et choix de succession ; chaque étape sauve un état de mission distinct.|Passerelle asari, champ de masse et couloirs.||CORA-LOYAL
CORA-DUTY|Cora Harper: Duty Calls|Étape personnelle de Cora.|Invitation après progression compatible ; laisser distinguer conversation amicale et engagement romantique.|Lieu de rendez-vous et portrait de Cora.||MISSIONS
CORA-FOUNDATION|Cora Harper: A Foundation|Étape personnelle de Cora.|Scène de projection vers l’avenir après sa loyauté ; aucune récompense de survie du final inventée.|Avant-poste et geste de construction.||MISSIONS
LIAM-ARMOR|Liam Kosta: Armor Diplomacy|Mission sociale de Liam.|Échange culturel et fabrication ciblée ; objet de mission séparé du meilleur équipement de combat.|Armures présentées et scène à bord.||MISSIONS
LIAM-AYA|Liam Kosta: Day out on Aya|Rencontre de Liam sur Aya.|Parcours social dans le marché avec sujets facultatifs ; journal évite de guider hors zone autorisée.|Marché angara et conversation en promenade.||MISSIONS
LIAM-OUTPOST|Liam Kosta: Outpost Worlds|Étape d’implantation liée à Liam.|Détecter avant-poste réellement fondé, pas seule viabilité ; même événement n’incrémente qu’une fois l’objectif.|Carte des colonies et message de Liam.||LIAM-OUTPOST
LIAM-ALLIN|Liam Kosta: All In|Mission de loyauté de Liam.|Infiltration cargo, changement de gravité, secours puis boss sous bouclier ; chaque orientation conserve un axe de sol cohérent pour sprites.|Intérieur de vaisseau tourné et containers.||LIAM-LOYAL
LIAM-NEIGHBORS|Liam Kosta: Something for the Neighbors|Étape sociale de Liam.|Réponse à son projet collectif ; objets de décor montrant progrès sans nouvelle colonie fictive.|Espace communautaire et équipage.||MISSIONS
LIAM-COMMUNITY|Liam Kosta: Community|Étape personnelle de Liam.|Scène sociale après ses initiatives ; conditions de relation séparées de validation de mission.|Lieu collectif et posture détendue.||MISSIONS
LIAM-US|Liam Kosta: Something for Us|Étape de relation avec Liam.|Interaction privée uniquement si état relationnel admissible ; refus explicite ne bloque pas les missions d’équipe.|Rendez-vous et cadrage intime non explicite.||MISSIONS,ROMANCE
JAAL-FRIEND|Jaal Ama Darav: Friend or Foe? I–III|Chaîne de préparation de Jaal.|Trois sous-états conservés dans une même fiche de chaîne ; ordre, message et rencontre ont accusé de progression.|Famille, messages et préoccupations Roekaar.||MISSIONS,JAAL-LOYAL
JAAL-FLESH|Jaal Ama Darav: Flesh and Blood|Mission de loyauté de Jaal.|Recherche familiale, combats Roekaar et confrontation avec Akksul ; fenêtre de tir accessible sans confirmer un choix par accident.|Village angara et famille rassemblée.||JAAL-LOYAL
JAAL-FAMILY|Jaal Ama Darav: Runs in the Family|Rencontre familiale.|Dialogue de groupe original et placement de nombreux interlocuteurs ; conserver leurs noms et liens lisibles.|Maison angara et textiles.||MISSIONS
JAAL-AFFECTION|Jaal Ama Darav: Angaran Affection|Étape relationnelle de Jaal.|Conditions compatibles avec patch 1.08 pour Scott ; séparer amitié, flirt et scène de couple.|Rendez-vous et portrait angara.|Version de romance explicite.|MISSIONS,BW-108
DRACK-BETRAYAL|Nakmor Drack: Krogan Betrayal|Enquête liée à Spender.|Collecter preuves et comparer témoignages ; aucune accusation finale sur un unique indice facultatif.|Nexus, vidéo et dossiers.||MISSIONS,DRACK-LOYAL
DRACK-FUTURE|Nakmor Drack: A Future for our People|Mission de loyauté de Drack.|Récupérer le transport de graines, secourir Vorn puis traiter Aroane/Spender ; loyauté et clôture administrative séparées.|Chantier lunaire, transport et serre.||DRACK-LOYAL
DRACK-KNOCK|Nakmor Drack: Knock ’em Down|Étape personnelle de Drack.|Réception d’invitation indépendante de la dernière formalité sur Spender ; verrouiller seulement selon règles confirmées du patch.|Rencontre de détente et silhouette krogan.||MISSIONS,DRACK-LOYAL
DRACK-TOUGH|Nakmor Drack: How to Act Tough|Échange de Drack.|Conversation courte et gestuelle originale ; ne pas convertir plaisanterie en bonus canon permanent.|Krogan en posture de démonstration.||MISSIONS
DRACK-MAWS|Nakmor Drack: Firebreathing Thresher Maws|Étape personnelle de Drack.|Séquence de conversation avec option de sortie ; nom de mission ne crée pas une créature de combat non attestée.|Scène sociale et objets de boisson.||MISSIONS
DRACK-CLUTCH|Nakmor Drack: Clutch Moment|Étape familiale krogan.|Conversation d’avenir, Kesh et liens de clan ; respect des révélations déjà obtenues.|Nexus, portraits krogan et ton calme.||MISSIONS
PEEBEE-SCANNER|Peebee: Remnant Scanner|Étape de recherche de Peebee.|Chercher composants selon planètes débloquées ; scanner distingue objet déjà acquis et donnée nouvelle.|Pièces reliquates et marqueur de scan.||MISSIONS
PEEBEE-SECRET|Peebee: Secret Project|Projet personnel de Peebee.|Acquisition et présentation de Poc ; l’outil ne devient pas compagnon humain ni septième équipier.|Atelier de capsule et petit robot.||MISSIONS
PEEBEE-POC|Peebee: Reclaiming Poc|Récupération de Poc.|Poursuite de Kalinda et réparation ; valider cette étape ouvre la recherche du signal sans double mission en journal.|Robot endommagé et message privé.||PEEBEE-POC
PEEBEE-SIGNAL|Peebee: A Mysterious Remnant Signal|Mission de loyauté de Peebee.|Pas-10, Observers alliés, rivalité Kalinda puis fuite ; différencier sauvegarde de la personne et acquisition de l’appareil.|Cavernes volcaniques et plateformes reliquates.||PEEBEE-LOYAL
PEEBEE-SPIRITS|Peebee: Spirits|Étape personnelle de Peebee.|Rencontre après son arc ; état amitié/romance conservé, aucune option implicite dans un dialogue seulement humoristique.|Lieu de détente et langage corporel asari.||MISSIONS
PEEBEE-MUSEUM|Peebee: The Museum Trip|Visite liée à Peebee.|Parcours d’observation avec pauses facultatives ; les connaissances affichées dépendent des découvertes.|Musée angara et objets exposés.||MISSIONS
VETRA-MEANS|Vetra Nyx: Means and Ends|Mission de loyauté de Vetra.|Mine de H-047c, captifs et caméras de Sid ; chaque sabotage de sécurité modifie réellement la salle suivante.|Mine fermée, ateliers et moniteurs.||VETRA-LOYAL
VETRA-PLANET|Vetra Nyx: A Moment Planetside|Rencontre personnelle de Vetra.|Scène de repos avec branches relationnelles ; ne pas imposer une exclusivité non choisie.|Paysage et deux silhouettes assises.||MISSIONS,ROMANCE
FAMILY|Ryder Family Secrets|Arc des souvenirs d’Alec.|Déverrouiller mémoires par collecte ; séparer connaissance sur Ellen, Garson et le Bienfaiteur, sans inventer résolution de ce dernier.|SAM Node et enregistrements familiaux.||MISSIONS
ARKS|Missing Arks|Recherche des autres arches.|Dossier maître reliant Leusinia, Natanus et Paarchero ; Keelah Si’yah demeure signal distinct sans mission de sauvetage livrée.|Carte des arches et statuts connus.||MISSING-ARKS,EPILOGUE
TURIAN-DEAD|Turian Ark: Not Dead Yet|Premières pistes de l’arche turienne.|Contacts et traces de rescapés ; progression persistante entre Havarl et Nexus.|Balises de détresse et camp turien.||MISSING-ARKS
TURIAN-LOST|Turian Ark: Lost But Not Forgotten|Arc de Macen et Avitus.|Explorer l’arche et découvrir le sort du Pionnier ; succession comme décision séparée du sauvetage.|Couloirs endommagés et SAM turien.||MISSING-ARKS
GIL-POKER|Gil Brodie: A Game of Poker|Moment personnel avec Gil.|Minijeu original facultatif avec option de résolution rapide ; résultat de partie et relation ne sont pas le même drapeau.|Table de cartes et visages.||MISSIONS
GIL-FRIEND|Gil Brodie: The Friend|Rencontre liée à Jill.|Dialogue à plusieurs personnages ; choix de conseil sans sanction romantique inventée.|Conversation à bord et messages.||MISSIONS
LEXI|Lexi T’Perro: Bottom of a Bottle|Étape personnelle de Lexi.|Retrouver et écouter ; contraste entre médecin et personne, pas de combat ni loot d’alcool ajouté.|Bar et éclairage doux.||MISSIONS
SUVI|Suvi Anwar: New Discoveries|Étape personnelle de Suvi.|Conversation de découverte et relation selon conditions ; journal ne transforme pas une discussion scientifique en romance automatique.|Table de recherche et vue spatiale.||MISSIONS
TRUTH|Truth and Trespass|Mission d’enquête liée au Tempest.|Chaîne de messages et preuves, identité d’interlocuteur révélée au moment prévu ; conserver dossier consultable.|Terminaux et transmission codée.||MISSIONS
LITTLE-THINGS|The Little Things That Matter|Mission d’Addison.|Suivre personnes et appels plutôt qu’un compteur abstrait ; entretien final tient compte des contacts réellement retrouvés.|Bureaux de colonie et logs.||MISSIONS
DISSENSION|Dissension in the Ranks|Mission de renseignement kett.|Recherche d’informations et proposition de coopération ; décision conservée pour assaut final si compatible.|Canal kett et preuves de dissension.||MISSIONS
KNOW-ENEMY|Know Your Enemy|Mission de renseignement.|Scanner preuves et livrer une synthèse à Raelis ; éviter de traiter tout objet kett comme preuve suffisante.|Laboratoire et traces kett.||MISSIONS
MOVIE|Movie Night — chaîne de préparation|Suite de missions sociales du Tempest.|Six sous-étapes nommées : Getting Started, Snacks, Better Snacks, The Right Setup, Raise a Glass, The Final Piece ; objets et donneurs distincts, soirée ouverte après validation complète.|Écran, sièges, snacks et boissons.||MISSIONS
EOS-KETT|Defeating the Kett|Opération d’Eos.|Assaut d’installation avec désactivation de défenses et commandement ; garantir plusieurs angles pour sprites sur plateformes.|Base kett dans falaises.||MISSIONS
EOS-IMPRESSION|Making an Impression|Mission de retour à Eos.|Équipements scientifiques et rencontre d’Architecte ; choix locaux et combat géant ont états séparés.|Sondes sismiques et désert.||MISSIONS
EOS-BANE|Kett’s Bane|Mission d’Eos.|Contact et infiltration ciblée ; l’information de route ne supprime pas tout combat sans règle annoncée.|Camp et entrée de base.||MISSIONS
EOS-SHOCK|Shock Treatment|Mission d’Eos.|Enquête de blessure et matériel ; scanner fournit indices lisibles, conclusion rattachée au bon dossier.|Infirmerie d’avant-poste et installations électriques.||MISSIONS
EOS-SECRET|The Secret Project|Mission d’Eos.|Explorer le site et sécuriser le prototype ; secret ne devient pas arme universelle du groupe sans déblocage documenté.|Site de recherche abandonné.||MISSIONS
EOS-DANNY|A Job for Danny Messier|Mission d’Eos.|Demande locale avec objet et retour ciblés ; signal de remise distinct du voyage de recherche.|Avant-poste et carte locale.||MISSIONS
EOS-ADDUP|Doesn’t Add Up|Mission d’Eos.|Analyser anomalie via plusieurs éléments ; validation de scan atomique sans doublon de preuve.|Terminal et relevés scientifiques.||MISSIONS
EOS-PERSONNEL|Something Personnel|Mission d’Eos.|Suivi de personnel par identifiants et messages ; objet de quête jamais vendu comme butin ordinaire.|Poste de colonie et dossier.||MISSIONS
HAVARL-DYING|A Dying Planet|Arc de restauration de Havarl.|Recherche de savoir, trajet de Mithrava, guide puis caveau ; restauration change écologie visuelle et accès de façon contrôlée.|Jungle envahie et ruines anciennes.||MISSIONS
HAVARL-SISTER|A Lost Sister|Mission de Havarl.|Recherche familiale et information de départ ; résultat présenté comme personne retrouvée/information obtenue, pas seulement objet livré.|Sanctuaire et zone de jungle.||MISSIONS
HAVARL-ALLIANCES|Cross-Cultural Alliances|Mission de Havarl.|Collaboration entre chercheurs ; conditions d’accès après aide initiale et dialogue de confiance.|Poste scientifique partagé.||MISSIONS
HAVARL-STARS|Forgotten Stars|Mission de Havarl.|Exploration de mémoire et observation ; éléments scannables gardent titre scientifique propre.|Données anciennes et ciel.||MISSIONS
HAVARL-OVERGROWN|Overgrown|Mission de Havarl.|Traitement d’une zone envahie ; limites praticables visibles dans végétation sans imposer de pixel hunt.|Lianes, racines et obstacle.||MISSIONS
VOELD-RESTORE|Restoring a World|Arc du caveau de Voeld.|Monolithes, puzzle et course de purification ; distinguer amélioration du climat et disparition totale du froid non promise.|Glace et architecture reliquate.||MISSIONS,HAZARD
VOELD-SETTLE|Settling Voeld|Fondation d’avant-poste.|Liste de prérequis locaux visibles, validation avec site et ressources ; colonie n’apparaît qu’après décision.|Habitat polaire et balise.||MISSIONS
VOELD-HEART|Remove the Heart|Assaut d’installation kett.|Approche, brèches et neutralisation du commandement ; libération n’efface pas tout ennemi aléatoire du monde par hypothèse.|Base fortifiée sous neige.||MISSIONS
VOELD-PAST|Uncovering the Past|Mission de ruines sous la glace.|Découverte d’IA et décision de conservation/remise ; implications connues exposées sans attribuer conséquences futures non écrites.|Caverne glacée et terminal ancien.||MISSIONS
VOELD-SCOUT|The Lost Scout|Mission de secours angara.|Repérage par signaux, approche du lieu puis résolution ; un cadavre ne peut pas être traité comme PNJ vivant par fallback.|Abri enneigé et traces.||MISSIONS
VOELD-SONG|The Lost Song|Mission de faune et culture.|Recherche, scans et conflit de pratique ; cibles animales distinguées des adversaires d’objectif.|Faune polaire et piste de chasse.||MISSIONS
VOELD-VANISHED|The Vanished|Mission de personnes disparues.|Chaîne d’indices nommés et journal de victimes ; pas de génération aléatoire rendant la solution introuvable.|Traces, camp et communications.||MISSIONS
VOELD-MEDICAL|Medical Caches|Mission de ravitaillement.|Caches avec validation unique puis remise ; accès conditionnés au terrain et aux contrôles locaux.|Caisse médicale sous neige.||MISSIONS
VOELD-BRIDGE|Bridge Sabotage|Mission de sabotage.|Approche et interaction sur infrastructure ; le pont ne coupe pas l’unique route de retour après explosion.|Pont et charges.||MISSIONS
VOELD-INTERCEPT|Intercepted|Mission de renseignement.|Décoder transmission puis visiter la destination ; conserver texte de piste et coordonnées accessibles.|Radio et poste de liaison.||MISSIONS
VOELD-MISSING|Missing Science Crew|Mission de recherche.|Suivre équipe et données ; marqueurs de chercheurs nommés plutôt que confondus avec ressources de scan.|Matériel scientifique dans glace.||MISSIONS
VOELD-REFORM|Reformation|Mission de Voeld.|Parcours d’enquête puis confrontation ; choix de réponse rattaché au groupe présent.|Avant-poste angara et terminal.||MISSIONS
VOELD-BEACON|Strange Beacon|Mission de signal.|Triangulation avec scanner et confirmation du dispositif ; intensité doublée d’un indicateur textuel.|Balise sous la neige.||MISSIONS
VOELD-TRAP|Resistance Trap|Mission de Voeld.|Préparation d’une embuscade avec zone de danger lisible ; aucun allié ne stationne au point d’explosion annoncé.|Couvert de glace et dispositif piégé.||MISSIONS
KADARA-HEART|Healing Kadara’s Heart|Arc de restauration de Kadara.|Monolithes et caveau reliquat ; rendre eaux toxiques et zones assainies identifiables avant déplacement.|Bassins acides et réseau reliquat.||MISSIONS,HAZARD
KADARA-SETTLE|Settling Kadara|Fondation d’avant-poste.|Résolution de critères de sécurité et de politique ; régime de Kadara reste cohérent après construction.|Site d’implantation dans badlands.||MISSIONS
HIGH-NOON|High Noon|Duel politique de Kadara.|Scène avec Sloane/Reyes, interruption et issue de pouvoir ; l’accès ultérieur aux quêtes tient compte du dirigeant.|Grotte de rendez-vous et ligne de tir.||HIGH-NOON
KADARA-MURDER|Murder in Kadara Port|Enquête locale.|Recueillir témoignages et indices, identifier adversaires ; solution liée au dossier plutôt qu’à un scan générique.|Rue de port et traces médico-légales.||MISSIONS
KADARA-DIVIDED|A People Divided|Mission de Kadara.|Poursuite d’enquête vers un groupe hostile ; la culpabilité de celui-ci ne s’étend pas à tous les angara.|Cache et réunion clandestine.||MISSIONS
KADARA-MIND|Mind Games|Mission d’expérience locale.|Enquête et réaction au dispositif ; information de consentement et résultats suivis sans modifier la personnalité du joueur arbitrairement.|Expérience, sujets et console.||MISSIONS
KADARA-MEDICINE|Modern Medicine|Mission de recherche médicale.|Collecter substance et décider de remise selon contexte ; inventaire garde l’objet de mission hors du commerce.|Laboratoire de fortune et échantillon.||MISSIONS
KADARA-WATER|Something in the Water|Mission environnementale.|Prélever échantillons sur lieux distincts ; scanner distingue eau à risque et eau sans objectif restant.|Bassins et analyse de prélèvement.||MISSIONS
KADARA-CARGO|Precious Cargo|Mission de cargaison.|Recherche puis découverte liée au contenu ; retour et récompense ne se déclenchent pas à la seule prise d’une caisse quelconque.|Épave, caisse et piste.||MISSIONS
KADARA-NIGHT|Night on the Town|Scène sociale de Kadara.|Rencontre selon relation avec Reyes ; conversations privées ne bloquent pas l’exploration après clôture.|Bar et lumières du port.||MISSIONS
KADARA-MIXED|Mixed Messages|Mission de Kadara.|Fenêtre de disponibilité liée à la politique locale ; prévenir qu’une avancée de High Noon peut la fermer.|Message, interlocuteur et rue du port.|Conditions précises de régime à vérifier.|MISSIONS,HIGH-NOON
KADARA-BASE|The Collective Base|Mission liée au Collectif.|Enquête d’accès puis choix local ; identité du groupe révélée dans le journal au moment approprié.|Base cachée et signes de faction.||MISSIONS
ELAADEN-CORE|Search for the Stolen Remnant Drive Core|Recherche du moteur reliquat.|Trajet d’indices et récupération ; objet unique conservé jusqu’à décision de négociation avec Morda.|Cœur de moteur et conteneur de transport.||MISSIONS
ELAADEN-DERELICT|Investigate Remnant Derelict|Exploration de l’épave d’Elaaden.|Intérieur en niveaux avec chemins de sortie repérables ; scan du cœur ne vaut pas possession.|Épave gigantesque et conduits.||MISSIONS
ELAADEN-PARLAY|Parlay with the Krogan|Négociation locale.|Accès au dirigeant et clarification des demandes ; refus conserve piste d’objectifs restants.|Salle de Morda à New Tuchanka.||MISSIONS
ELAADEN-SETTLE|Settling Elaaden|Fondation d’avant-poste.|Accord local et conditions environnementales visibles ; ne pas faire surgir une colonie si le moteur est gardé et accord manquant.|Site désertique et balise.||MISSIONS
ELAADEN-TAME|Taming a Desert|Arc du caveau d’Elaaden.|Monolithes et caveau, purification puis mise à jour de danger ; les zones sous abri restent visuellement distinctes.|Dunes et piliers reliquats.||MISSIONS,HAZARD
ELAADEN-WATER|Water Supply|Mission sur la distribution d’eau.|Enquête puis décision de contrôle ; l’eau comme ressource narrative reste distincte d’un consommable de survie inventé.|Réservoir, pompe et échange local.||MISSIONS
ELAADEN-ARCH|Architect on Elaaden|Combat d’Architecte.|Déclencher arène hors routes civiles, objectifs membres/noyau lisibles ; sauvegarder avant lancement proposé.|Machine géante au-dessus des dunes.||MISSIONS
ELAADEN-FLOP|The Flophouse|Mission contre un repaire.|Reconnaissance puis assaut à plusieurs entrées ; contrôler renforts et retours Nomad pour éviter réinitialisation abusive.|Base de hors-la-loi et containers.||MISSIONS
ELAADEN-OKEER|Save Dr. Okeer’s Krogan Research|Mission de données d’Okeer.|Récupérer archives avec provenance ; n’implique ni présence vivante d’Okeer ni rencontre avec Grunt.|Support de recherche krogan.||MISSIONS
ELAADEN-CONFLICT|Conflict in the Colony|Mission de New Tuchanka.|Entretiens de conflit interne et preuves ; décision finale conservée distinctement de la relation globale Initiative/krogans.|Quartier de colonie et témoignages.||MISSIONS
ELAADEN-LJETA|The Search for Ljeta|Mission de recherche personnelle.|Suivi d’une personne par informations nommées ; issue sociale sans boss ajouté par convenance.|Camp et piste de voyage.||MISSIONS
ELAADEN-GRAY|Gray Matter|Mission d’Elaaden.|Recherche de matériel et conversation technique ; scan confirme la bonne pièce avant récupération.|Pièces et atelier improvisé.||MISSIONS
H047C-DUST|From the Dust|Mission sur H-047c.|Conduite entre dômes et récupération dans sites pressurisés ; sortie Nomad impossible dans le vide hors transition sûre.|Dômes miniers et minerai.||MISSIONS,HAZARD
H047C-TILLER|The Remnant Tiller|Mission reliquate sur H-047c.|Caveau avec machines et accès interne ; sommet de plateforme et sol distincts pour sélection ATB.|Foreuse reliquate et salle géométrique.||MISSIONS
AYA-HISTORY|Forgotten History|Mission d’archives sur Aya.|Examiner objets culturels avec descriptions originales courtes ; aucune extraction de longs textes de codex.|Musée et vitrines.||MISSIONS
AYA-PAST|Recovering the Past|Mission d’exploration historique.|Collecter preuves de passé local puis remise ; chaque objet porte une provenance et un destinataire.|Artefacts et témoignages angara.||MISSIONS
AYA-JOURNEYS|Safe Journeys|Mission de voyage angara.|Suivre disparition ou route de voyage par balises ; distinguer objectif scanné et rapport remis.|Carte, traces et camp.||MISSIONS
AYA-VESAAL|The Vesaal|Mission culturelle angara.|Rencontre et enquête sur un objet nommé ; appellation conservée, traduction explicative séparée.|Objet de tradition et portrait de donneur.||MISSIONS
AYA-TRADE|Trading Favors|Mission d’échange.|Chaîne d’interlocuteurs sans multiplication de trajet obligatoire ; journal précise ce qui est donné et reçu à chaque étape.|Marché et petits objets d’échange.||MISSIONS
NEXUS-MURDER|First Murderer|Enquête sur Nilken Rensus.|Scène de prison, preuves d’Eos puis verdict ; séparer intention de tirer et auteur réel du décès dans l’interface d’enquête.|Cellule, logs et théâtre des faits.||MURDER
NEXUS-CONTAGION|Contagion|Mission d’urgence médicale.|Suivre patient et déplacement avec dossier d’état ; aucune épidémie en simulation hors règles réellement choisies.|Infirmerie, navette et traces.||MISSIONS
NEXUS-DRAGONS|Sleeping Dragons|Conflit de cryostase.|Entretien collectif et décision de réveil ; afficher personnes concernées sans transformer morale en score Paragon/Renegade.|Zone de protestation et pods.||MISSIONS
NEXUS-SABOTAGE|Station Sabotage|Enquête technique du Nexus.|Scanner composants puis interroger ; sélectionner preuves avant accusation pour éviter validation involontaire.|Conduites, consoles et traces d’énergie.||MISSIONS
NEXUS-FIREFIGHT|The Firefighters|Mission liée à SAM.|Enquête d’opposition à l’IA, infiltration et résolution ; capacités désactivées affichées si scénario les retire.|Signal informatique et installation.||MISSIONS
NEXUS-FRONTIER|Life on the Frontier|Mission de disparitions et exilés.|Comparer témoignages avec dossiers de personnel ; distinguer volontaires et victimes dans le journal.|Bureaux, camps et communications.||MISSIONS
NEXUS-APEX|Aid APEX|Mission de soutien aux forces APEX.|Présenter alternative d’équipes d’intervention ; ne pas forcer connexion multi pour progresser la campagne.|Table de missions et badges de groupe.||MISSIONS,MP
TEMPEST-PYJAK|Monkeys in Space|Mission de pyjak de l’édition Deluxe.|Livraison et présence de l’animal à bord ; aucune stat de combat ou compagnon sélectionnable inventé.|Petit pyjak et caisse de transport.|Deluxe / contenu correspondant.|EA-DELUXE,MISSIONS
TEMPEST-VISITOR|The Visitor|Mission de présence inattendue.|Recherche dans le vaisseau et choix de traitement ; interaction ne bloque pas le chemin de l’équipage.|Recoin du Tempest et créature.||MISSIONS
TEMPEST-BAGGAGE|Excess Baggage|Mission du Tempest.|Examiner fret et dialogue responsable ; validateur ne vend pas un objet requis au marchand.|Soute et cargaison.||MISSIONS
''')

# Tâches de terrain représentatives, sélectionnées pour leurs livrables distincts.
c.rows('side_quests','''
TASK-NAMING|Task: Naming the Dead|Tâche d’Eos.|Identifier les personnes par scan avec liste consultable ; ne pas les réduire à des ressources anonymes.|Balise mémorielle et scanner.||MISSIONS
TASK-GHOST|Task: The Ghost of Promise|Tâche d’Eos.|Enregistrements dispersés suivis par identifiants ; replay d’un log n’incrémente pas une collecte.|Journaux de colonie et écran d’écoute.||MISSIONS
TASK-DRONE|Task: Drone Recovery|Tâche d’Eos.|Repérer drones, sécuriser puis récupérer données ; distinguer carcasse décorative et objectif actif.|Drones au sol et halo de scan.||MISSIONS
TASK-REMCORES|Task: Remnant Data Cores|Tâche de technologie reliquate.|Objets rares suivis par lieu avec prévention de vente ; couverture explicitement non exhaustive des caches.|Noyaux reliquats et liste de collecte.||MISSIONS
TASK-SUPPLY|Task: Supply Loss and Recovery|Tâche d’Eos.|Récupération de ravitaillement avec routes de retour et contrôle de volume ; pas de caisse dupliquée au chargement.|Caisse Initiative et marque de destination.||MISSIONS
TASK-ROEKAAR|Task: Roekaar Manifestos|Tâche de Havarl.|Collecter documents et synthétiser brièvement ; ne pas copier manifestes intégraux ni uniformiser tous les angara.|Supports écrits et icône de dossier.||MISSIONS
TASK-TURIAN|Task: Turian Salvage|Tâche de Havarl.|Pièces de rescapés turiens à scan lisible sous végétation ; route indépendante du choix d’Avitus.|Épaves et matériel turien.||MISSIONS
TASK-UNEARTHED|Task: Unearthed|Tâche de Havarl.|Repérer objets enfouis avec carte de proximité accessible ; terrain ne nécessite pas de pixel hunt.|Sol de jungle et reliques.||MISSIONS
TASK-WHITED|Task: White Death|Tâche de Voeld.|Traquer une menace spécifique à partir d’indices ; météo ne masque pas sa signalisation d’arrivée.|Neige, traces et cible signalée.||MISSIONS
TASK-NOMAD|Task: Nomad Shield Crafting|Tâche de fabrication.|Recherche, matériaux et fabrication validés séparément ; améliorer véhicule ne modifie pas bouclier de Ryder.|Atelier de véhicule et module.||MISSIONS
TASK-CLEAR|Task: Clearing the Air|Tâche de Voeld.|Repérer dispositif adverse et le neutraliser ; retour d’état du réseau visible sans répéter l’opération.|Antenne et icône de signal.||MISSIONS
TASK-EMBEZZLE|Task: Investigating Embezzlement|Tâche d’enquête Nexus.|Comparer comptes et témoignages ; un achat du joueur ne compte pas comme preuve de détournement.|Registre et lignes surlignées.||MISSIONS
TASK-ALIEN|Task: Comparatively Alien|Tâche de recherche.|Scans de vie avec catégorie demandée et indicateur déjà étudié ; récompense de science indépendante de tuer le sujet.|Scanner et silhouettes de faune.||ALIEN-TASK
TASK-FLOWER|Task: A Flower for Kesh|Tâche personnelle krogan.|Objet unique avec destinataire affiché ; remise et conversation affective sans mécanisme de romance joueur ajouté.|Fleur et portrait de Kesh.||MISSIONS
TASK-DATATRAIL|Task: Data Trail|Tâche d’Eos.|Suivre traces de données par étapes distinctes ; indices peuvent être relus hors zone dangereuse.|Flux orange et terminal.||MISSIONS
TASK-LAWS|Task: Laws and Customs|Tâche d’Aya.|Dialogue d’apprentissage culturel ; réponses de journal décrivent les usages sans règle universelle inventée.|Interlocuteur angara et carnet.||MISSIONS
TASK-CUISINE|Task: Local Cuisine|Tâche d’Aya.|Échange culinaire court ; nourriture reste objet culturel et non soin magique sans étiquette d’adaptation.|Marché et plat local.||MISSIONS
TASK-TEST|Task: Test Subject|Tâche d’Aya.|Expérience avec consentement explicite de Ryder ; résultats de quête et statistiques proposées séparés.|Appareil scientifique et chaise.||MISSIONS
TASK-BOOST|Task: Boosting the Signal|Tâche de communications.|Déposer équipements aux points prévus, chacun unique ; état réseau affiché à retour Nexus.|Balise relais et signal.||MISSIONS
TASK-OUTLAW|Task: Outlaw Weapon Crafting|Tâche de fabrication sur Kadara.|Fabriquer l’objet demandé avec vraie recette ; disposer d’une arme différente du même type ne suffit pas.|Plan, matériaux et banc d’armes.||MISSIONS
''')
# Corriger une clé de saisie avant création des dépendances, sans changer le titre d’index.
for e in c.entries:
    if e['id']=='MEA-SQ-TASK-UNEART HED':
        c.ids.remove(e['id']);e['id']='MEA-SQ-TASK-UNEARTHED';c.ids.add(e['id']);e['implementation']=e['implementation'].replace('task-uneart hed','task-unearthed')

c.rows('worlds','''
HABITAT7|Habitat 7|Première destination planétaire.|Carte de prologue avec dangers météo et parcours d’équipe ; l’état après tour reste distinct des mondes à coloniser librement.|Roches suspendues, éclairs et montagnes.||LOCATIONS,GUIDE
NEXUS|Nexus|Station centrale de l’Initiative.|Hub qui évolue avec réveils et progrès ; repères de commerce, administration, bar et archives.|Station inachevée et couloirs propres.||LOCATIONS
HYPERION|Hyperion|Arche humaine.|Cryostase, SAM Node et passerelle ; versions spatiale et Port Meridian séparées par état du final.|Grands volumes d’arche et pods.||GUIDE,EPILOGUE
EOS|Eos|Monde désertique à coloniser.|Régions ouvertes progressivement par restauration ; distinguer radiation, verticalité et zones de colonie.|Désert, mesas et installations abandonnées.||HAZARD,LOCATIONS
AYA|Aya|Monde angara protégé.|Hub social à accès progressif ; climat luxuriant et volcans de fond sans exploration de surface illimitée inventée.|Cascade, marché et ciel chargé.||LOCATIONS
VOELD|Voeld|Monde froid d’Heleus.|Carte neigeuse avec relais de chaleur, résistance, kett et caveau ; gestion de froid visible.|Glace, falaises et lumière pâle.||HAZARD,LOCATIONS
HAVARL|Havarl|Monde de jungle angara.|Densité végétale et ruines verticales ; ne pas inventer une jauge de poison ambiant générale.|Jungle lumineuse et terrasses reliquates.||HAZARD,LOCATIONS
KADARA|Kadara|Monde d’exilés et d’angara.|Port et badlands reliés par transit ; eau toxique localisée, pas danger global de l’air.|Roche colorée, bassins et constructions disparates.||HAZARD,LOCATIONS
ELAADEN|Elaaden|Lune désertique des krogans.|Dunes, épave, New Tuchanka et abris thermiques ; chaleur dépend de l’exposition, avec indicateurs accessibles.|Sable clair, grand corps céleste et épave.||HAZARD,LOCATIONS
H047C|H-047c|Vestiges d’un monde détruit.|Nomad entre dômes pressurisés ; entrées/sorties séparées pour éviter marche dans le vide.|Fragments rocheux, étoiles et habitats sous dôme.||HAZARD,LOCATIONS
KHI-TASIRA|Khi Tasira|Site reliquat de la recherche de Méridiane.|Immense ville technique à secteurs d’énergie ; ne pas confondre ce site et monde habitable final.|Tours géométriques et réseaux lumineux.||GUIDE
MERIDIAN|Méridiane|Destination du final et de l’épilogue.|Noyau de réseau puis paysage intérieur habitable ; carte de Port Meridian distincte du champ de bataille.|Sphère, ciel intérieur et végétation.||MERIDIAN,EPILOGUE
PAS10|Pas-10|Monde volcanique de la mission de Peebee.|Carte linéaire de loyauté avec Observers alliés, lave et retour par navette ; exploration ouverte non promise.|Roche rouge et ruines au-dessus de lave.||PEEBEE-LOYAL
MOONYARD|Chantier lunaire de Drack|Le transport volé mène à une lune d’Elaaden.|Zone d’abordage, plateformes et serre de transport ; géographie originale locale annoncée.|Chantier orbital bas et containers.||DRACK-LOYAL
LEUSINIA|Leusinia|Arche asari.|Carte intérieure de mission avec champs et salles de survie ; roster Cora obligatoire selon mission.|Architecture d’arche et panneaux asari.||CORA-LOYAL
NATANUS|Natanus|Arche turienne recherchée.|Parcours d’enquête et mémoire de Macen ; scènes d’Avitus dans zones restreintes.|Couloirs endommagés et dispositifs turiens.||MISSING-ARKS
PAARCHERO|Paarchero|Arche galarienne de la traque de l’Archonte.|Séparer portions d’arche et vaisseau kett où se déroule l’opération ; pas de téléportation de pont sans transition.|Pods galariens et structure d’arche.||ARCHON
''')

c.rows('zones','''
TEMPEST-BRIDGE|Tempest — passerelle|Lieu du pilotage et de Suvi.|Carte galactique, conversation et départ sont interactions distinctes ; fenêtres donnent orientation stable.|Grand cockpit vitré et consoles.||CHAR
TEMPEST-LAB|Tempest — laboratoire et recherche|Zone de recherche et fabrication.|Écran de recette, scanner et dialogue scientifique séparés ; pas de consommation en lisant un plan.|Bancs blancs et hologrammes.||RESEARCH
TEMPEST-ENGINE|Tempest — moteur et atelier|Lieu de Gil.|Atelier et mini-scènes personnelles ; machines décoratives ne déclenchent pas un menu d’amélioration inexistant.|Générateur et outils.||CHAR
TEMPEST-CREW|Tempest — quartiers|Lieu de l’équipage.|Pièces à états relationnels, nom sur porte et minimap ; conversations verrouillées expliquent besoin de progression.|Cabines, mess et couchettes.||SQUAD
TEMPEST-POD|Tempest — capsule de Peebee|Espace personnel de Peebee.|Atelier de Poc, rencontre et déclencheur de mission sont actions distinctes ; avertissement avant départ de loyauté proposé.|Capsule, dessins et composants reliquats.||PEEBEE-LOYAL,PEEBEE-POC
HYP-CRYO|Hyperion — cryostase|Zone du réveil.|Tutoriel sur allées sûres ; pods en fond ne ressemblent pas à des cibles ouvrables.|Lignes de capsules et brume froide.||GUIDE
SAM-NODE|Hyperion — SAM Node|Lieu des souvenirs d’Alec.|Console principale et archives ; tableau de mémoires connues/à débloquer sans spoilers de contenu.|Salle d’IA bleue et interface familiale.||MISSIONS
NEXUS-OPS|Nexus — Operations|Centre administratif.|Quatre responsables et tableau APEX facilement repérables ; dossiers politiques séparés des marchands.|Bureaux, passerelles et écrans.||CHAR
NEXUS-COMMON|Nexus — Common Area|Zone sociale et commerces.|Bar, magasins et mission markers distincts ; routes libres pour grands sprites krogan.|Boutiques, bancs et éclairage chaud.||LOCATIONS
NEXUS-MILITIA|Nexus — bureau de la milice|Lieu d’enquête et sécurité.|Cellules, Kandros et archives ; interroger un détenu ne déclenche pas jugement sans confirmation.|Barrières et consoles de sécurité.||MURDER
EOS-SITE1|Eos — Site 1 / Promise|Colonie abandonnée.|Enquête sur traces et chemin de remise en route ; log trouvé reste disponible même après changement de zone.|Préfabriqués désertés et sable.||GUIDE
EOS-SITE2|Eos — Site 2 / Resilience|Autre site de colonie.|Parcours de recherche séparé de Promise ; identifiants de morts et de journaux spécifiques au lieu.|Installations endommagées et laboratoire.||MISSIONS
PRODROMOS|Eos — Prodromos|Premier avant-poste.|Variantes scientifique/militaire proposées fidèles au choix enregistré ; personnel et retour de mission changent selon progression.|Habitat neuf et équipements de colonie.||GUIDE
EOS-VAULT|Eos — caveau reliquat|Caveau de la première restauration.|Tutoriel de console, glyphes et purification ; portes de sortie visibles avant déclenchement du danger.|Murs noirs, lumière turquoise et plateformes.||VAULT
AYA-MARKET|Aya — marché|Zone de rencontres et d’échange.|Étals avec objets distincts ; conversations à proximité n’empilent pas les sous-titres.|Textiles, aliments et bassins.||MISSIONS
AYA-MUSEUM|Aya — musée|Lieu de mémoire angara.|Vitrines et descriptions courtes ; objets récupérés se placent par état de quête sans doublon.|Reliques et panneaux culturels.||MISSIONS
VOELD-RESIST|Voeld — base de la Résistance|Hub angara du monde froid.|Salle de commandement, soins et ravitaillement ; zone chaude clairement définie pour jauge de survie.|Tunnels de glace et radiateurs.||MISSIONS,HAZARD
EXALTATION|Voeld — installation d’exaltation|Lieu de secours de la Moshae.|Prison, transformation et salle Cardinal en secteurs ; sortir des captifs reste objectif distinct de tuer le boss.|Pods, métal organique et cages.||GUIDE
VOELD-VAULT|Voeld — caveau|Site de restauration.|Approche froide et intérieur technique ; danger de purification indépendant du froid de surface.|Glace extérieure et réseau turquoise.||VAULT,HAZARD
HAVARL-RESEARCH|Havarl — poste de recherche|Centre scientifique angara.|Hub compact au pied de jungle ; contacts et observations accessibles après restauration.|Équipements angara sous feuillage.||MISSIONS
MITHRAVA|Havarl — Mithrava|Sanctuaire de sages.|Ascension à plateformes avec repères d’étage ; raccourci de retour proposé pour éviter refaire tous les sauts.|Ruines hautes et passerelles végétales.||MISSIONS
HAVARL-VAULT|Havarl — caveau|Site lié à A Dying Planet.|Entrée après guide et indices ; liens d’énergie lisibles malgré racines.|Tech reliquate mêlée de végétation.||VAULT,MISSIONS
KADARA-PORT|Kadara Port|Hub politique du monde.|Salle de Sloane, marché, bar et accès bas ; autorité/gardes modifiés après High Noon.|Roche orange et structures urbaines.||HIGH-NOON
KADARA-BADLANDS|Kadara — badlands|Région d’exploration.|Bassins dangereux, camps et voies Nomad ; identifier routes avec ponts sûrs et eau non franchissable à pied.|Roches rouges et eau acide.||HAZARD
KADARA-VAULT|Kadara — caveau|Lieu d’assainissement.|Circuit de console distinct de l’eau de surface ; restaurer fait évoluer danger selon table dédiée.|Salles noires et lumière reliquate.||VAULT
NEW-TUCHANKA|Elaaden — New Tuchanka|Colonie krogan.|Grande porte, salle de Morda et serres ; volume adapté aux silhouettes krogans sans rendre humains minuscules.|Récupération industrielle et sable.||MISSIONS
DERELICT|Elaaden — épave reliquate|Grande structure à explorer.|Découpage en coque, intérieur et chambre du cœur ; repères pour retour sans fausse liaison au caveau.|Volumes géants et passerelles.||MISSIONS
ELAADEN-VAULT|Elaaden — caveau|Site de restauration du désert.|Chaînes d’alimentation et purification ; ombre thermique de surface et sécurité intérieure séparées.|Architecture noire sous sable.||VAULT,HAZARD
H047C-DOMES|H-047c — dômes|Zones pressurisées.|Transition Nomad/pied seulement dans sas admis ; pas d’escouade apparaissant hors air respirable.|Bulles d’habitat et bases minières.||HAZARD
VETRA-MINE|H-047c — mine de Meriweather|Lieu de loyauté de Vetra.|Captifs, ménagerie et atelier vus par caméras ; sabotage change obstacles, dangers et rencontres.|Mine à niveaux, moniteurs et Hydra.||VETRA-LOYAL
LIAM-SHIP|Vaisseau de Calot Gurting|Lieu du secours de Liam.|Trois états d’orientation de salle avec ancres recalculées ; objets de scan disponibles seulement où ils sont physiquement présents.|Containers, grues et plafond devenu sol.||LIAM-LOYAL
PAS10-CORE|Pas-10 — dispositif reliquat|Lieu de conclusion Peebee.|Plateformes au-dessus de lave, choix Kalinda puis route d’évacuation ; temporisation accessible proposée.|Ponts, appareil et navette.||PEEBEE-LOYAL
KETT-FLAGSHIP|Vaisseau de l’Archonte|Site du choix de secours.|Laboratoire, prisonniers et deux routes finales ; afficher clairement l’objectif engagé et irréversibilité de bifurcation.|Architecture kett et pods d’expérience.||ARCHON
MERIDIAN-CORE|Méridiane — noyau final|Arène de l’Archonte.|Progression d’objectifs de réseau pendant combat ; la cible principale est système de contrôle et machine, pas un simple sac de PV.|Noyau, conduits et grande plateforme.||MERIDIAN
PORT-MERIDIAN|Port Meridian|Hub de l’épilogue.|Arche posée, fête et conversations ; présence du jumeau et fenêtres finales traitées comme scènes d’épilogue limitées.|Hyperion au milieu de végétation.||EPILOGUE
''')

c.rows('lore','''
INITIATIVE|Initiative Andromède|Projet d’installation dans une autre galaxie.|Codex de départ, attentes et difficultés à l’arrivée ; séparer rêve de colonisation et réalité locale rencontrée.|Emblème Initiative et schémas d’arches.||EA-GAME,CODEX
PATHFINDER|Pionnier / Pathfinder|Ryder mène l’exploration.|Fiche de fonction, décisions et responsabilité ; titre ne signifie pas autorité absolue sur les peuples angara.|Insigne et carte de terrain.||EA-GAME
SAM|SAM et lien neural|SAM accompagne le Pionnier.|Dossier de compétences, limites et partage de perception ; retrait scénarisé désactive les bons outils sans inventer télépathie universelle.|Interface IA et réseau de données.||CODEX,MERIDIAN
SCOURGE|Fléau / Scourge|Phénomène dangereux de Heleus.|Cartographie de danger et indices de réseau ; origine précise révélée seulement par découverte, pas comme présupposé de départ.|Filaments noirs et énergie spatiale.||CODEX
ANGARA|Angara|Peuple rencontré dans Heleus.|Entrées culturelles par interlocuteur et lieu ; leurs opinions ne se résument ni à Evfra ni à Akksul.|Silhouettes et textiles angara.||CODEX
RESISTANCE|Résistance angara|Force opposée aux kett.|Registre des bases et contacts ; coopération s’étend par missions et ne rend pas chaque angara soldat.|Marques de Résistance et cartes locales.||MISSIONS,CODEX
ROEKAAR|Roekaar|Mouvement hostile aux nouveaux arrivants.|Faction distincte des angara civils et de la Résistance ; résolution de Jaal conserve réactions locales.|Symboles militants et dossiers.||JAAL-LOYAL
KETT|Kett|Force antagoniste d’Andromeda.|Hiérarchie Archonte/Primus et unités ; ne pas traiter le contingent rencontré comme description exhaustive d’un empire entier.|Architecture organique et armures osseuses.||CODEX
EXALTATION|Exaltation|Transformation révélée pendant la campagne.|Codex verrouillé avant installation de Voeld ; nom, victime et résultat distincts des théories initiales de l’équipage.|Capsules et silhouettes en transformation.||GUIDE,CODEX
REMNANT|Reliquats / Remnant|Machines et structures anciennes.|Scanner sépare fonctionnement observé et origine interprétée ; machines parfois alliées, faction non automatiquement hostile.|Géométrie noire et lumière turquoise.||VAULT,CODEX
JAARDAN|Jardaan|Civilisation liée aux révélations reliquates.|Entrée tardive de savoir, incertitudes conservées ; aucun personnage ou plan futur inventé.|Archives et réseaux de Méridiane.|Spoilers tardifs.|CODEX
VAULTS|Réseau des caveaux|Les caveaux participent aux restaurations.|Carte des liens techniques, état par planète et résultat vérifié ; un seul caveau activé ne rend pas tout Heleus habitable.|Nœuds et lignes de réseau.||VAULT
EXILES|Exilés du Nexus|Des groupes ont quitté le Nexus.|Distinguer civils, Outcasts, Collective et bandes ; appartenance d’une espèce ne détermine pas faction.|Camps et insignes de groupes.||CODEX,HIGH-NOON
KROGAN|Colons krogan|Les krogans ont leur propre implantation.|Conflits Nexus, clan et espoir de générations ; ne pas appliquer automatiquement le dénouement du génophage de ME3.|New Tuchanka, serre et portraits.||DRACK,DRACK-LOYAL
ARKS|Arches et Pionniers|Plusieurs arches rejoignent Heleus.|Chaque arche a capitaine, SAM et Pionnier propres ; états des survivants ne sont pas interchangeables.|Carte d’arches et statut par peuple.||MISSING-ARKS
CRYO|Cryostase et ressources|Les arrivants ne sont pas tous réveillés ensemble.|Décisions AVP et personnes concernées séparées ; chaque bonus est une proposition de design tant que valeur source non vérifiée.|Pods et registre de spécialistes.||MISSIONS
BENEF|Financement et mystères familiaux|L’arc familial révèle des éléments cachés.|Dossier de faits connus, témoignages et questions ouvertes ; identité du Bienfaiteur conservée inconnue.|Archives SAM et transmissions masquées.||MISSIONS,CODEX
QUARIAN|Signal du Keelah Si’yah|L’épilogue transmet un avertissement.|Entrée d’archive sans quête de résolution inventée ; lien bibliographique vers roman traité dans catalogue dédié.|Signal codé et nom d’arche.|Épilogue ; aucune extension solo produite à inférer.|EPILOGUE,BW-FINAL
''')

for key,title in [('EOS-PAGE','Eos'),('VOELD-PAGE','Voeld'),('KADARA-PAGE','Kadara'),('ELAADEN-PAGE','Elaaden'),('HAVARL-PAGE','Havarl'),('AYA-PAGE','Aya'),('TEMPEST-PAGE','Tempest')]:
    wiki(key,title,title,'Lieu et index de missions associés')
wiki('MOVIE','Movie Night','Movie_Night','Chaîne et fenêtres de soirée film')
wiki('OVERGROWN','Overgrown','Overgrown','Analyse de faune mutée de Havarl')
wiki('VESAAL','The Vesaal','The_Vesaal','Équilibre de population sur Aya')
wiki('DRAGONS','Sleeping Dragons','Sleeping_Dragons','Familles en cryostase et protestation')
for e in c.entries:
    if e['category']=='side_quests':
        suffix=e['id'].split('-',2)[2]
        for prefix,src in [('EOS-','EOS-PAGE'),('VOELD-','VOELD-PAGE'),('KADARA-','KADARA-PAGE'),('ELAADEN-','ELAADEN-PAGE'),('HAVARL-','HAVARL-PAGE'),('AYA-','AYA-PAGE'),('TEMPEST-','TEMPEST-PAGE')]:
            if suffix.startswith(prefix):e['sourceIds']=[('MEA-SRC-'+src if s=='MEA-SRC-MISSIONS' else s) for s in e['sourceIds']]
        if suffix=='HAVARL-OVERGROWN':
            e['adaptation']=e['gameplay']='Analyser les marqueurs génétiques puis rechercher la faune mutée ; les trois pistes de créatures restent distinctes et chaque analyse est relisible dans le scanner.'
            e['visual']='Archives génétiques, indices de tanières et créatures marquées.';e['sourceIds']=['MEA-SRC-OVERGROWN']
        if suffix=='AYA-VESAAL':
            e['adaptation']=e['gameplay']='Interroger les personnes concernées par l’équilibre des arrivées et départs sur Aya ; journal explicite cette règle locale sans inventer un artefact à rapporter.'
            e['visual']='Résidents d’Aya, interlocuteurs de l’Initiative et registre de population.';e['sourceIds']=['MEA-SRC-VESAAL']
        if suffix=='MOVIE':e['sourceIds']=['MEA-SRC-MOVIE']
        if suffix=='NEXUS-DRAGONS':e['sourceIds']=['MEA-SRC-DRAGONS']

# Rôles et movesets originaux, ancrés aux familles attestées du bestiaire.
enemy_data='''
CHOSEN|Kett Chosen|Infanterie kett.|Avance par petits groupes et tir de ligne ; annonce de grenade proposée pour déloger un couvert sans sortie forcée hors carte.|Armure organique claire et visage kett.|Campagne / multi selon rencontre.|CHOSEN
ANOINTED|Kett Anointed|Unité kett.|Rafale soutenue et repositionnement ; les arrêts de tir ouvrent une fenêtre de flanc distincte de la simple recharge du joueur.|Arme lourde et plaques osseuses.|Campagne / multi selon rencontre.|CHOSEN
DESTINED|Kett Destined|Unité de soutien kett.|Soutenir un groupe puis se replier ; une zone de brouillage proposée masque visée, jamais les icônes de danger essentielles.|Silhouette de commandement et effets de voile.|Campagne / multi selon rencontre.|CHOSEN
WRAITH|Kett Wraith|Créature kett camouflée.|Approche basse puis bond ; perturbation au sol et zone d’arrivée permettent de réagir sans distinguer un sprite transparent.|Quadrupède et contour de camouflage.|Campagne / multi selon rencontre.|CHOSEN
FIEND|Kett Fiend|Grande créature kett.|Charge, balayage et menace de prise ; réservation du trajet avant départ, phase de secours d’allié proposée avant mise hors combat.|Masse quadrupède et bras puissants.|Campagne / multi selon rencontre.|CHOSEN
ASCENDANT|Ascendant|Unité kett protégée par un orbe.|Orbe comme cible mobile séparée, champ de protection et attaque électrique ; après rupture, vraie fenêtre d’attaque puis retour signalé.|Kett flottant et sphère orbitale.|Campagne / multi selon rencontre.|ASCENDANT
CARDINAL|Le Cardinal|Boss de l’installation d’exaltation.|Variante Ascendant avec renforts limités et phases de protection lisibles ; résolution du boss ouvre la décision sur le site.|Armure de commandement et orbe.|A Trail of Hope II.|ASCENDANT,GUIDE
INVICTOR|Invictor|Boss kett d’Eos.|Variante lourde de commandement : traiter protections, renforts puis fenêtre d’exposition ; réglage original sans nombres copiés.|Silhouette kett et halo de boss.|Defeating the Kett.|CHOSEN
ARCHON-SWORD|Archon’s Sword|Adversaire kett nommé.|Offensive de commandement avec changements d’angle annoncés ; éviter téléportation sans signal hors champ.|Armure kett distincte et effets d’énergie.|Rencontre de campagne.|CHOSEN
VALIANT|Valiant|Adversaire kett nommé.|Variante d’élite à cible prioritaire ; fenêtre de charge/attaque affichée même si renforts remplissent l’arène.|Kett renforcé et marque d’élite.|Rencontre liée à l’arche asari.|CHOSEN,CORA-LOYAL
BEHEMOTH|Behemoth|Créature lourde kett.|Assaut rapproché et dégâts de zone ; corps imposant ne doit pas cacher cibles secondaires ni sortie de cône.|Très grande silhouette et armure organique.|Rencontres de campagne / multi selon profil.|CHOSEN
SCIENTIST|Scientifique kett|Unité kett répertoriée.|Rôle de laboratoire avec fuite et alarme proposés ; distinguer non-combattant narratif et ennemi actif selon scène.|Tenue scientifique et instruments.|Identité de rencontre à confirmer avant combat automatique.|CHOSEN
KETT-TURRET|Tourelle kett|Défense fixe kett.|Pivot puis rafale dans cône ; alimentation et piratage proposés seulement sur objets explicitement interactifs.|Socle organique et canon.|Rencontres kett.|CHOSEN
RAIDER|Raider hors-la-loi|Infanterie de hors-la-loi.|Tir de couvert et déplacement latéral ; faction et espèce indiquées séparément pour variantes d’apparence.|Armure de récupération et fusil.|Campagne / multi selon rencontre.|AGENT
BERSERKER|Berserker hors-la-loi|Unité lourde hors-la-loi.|Avance de rupture et coup proche ; annoncer l’engagement et laisser exploiter l’angle arrière.|Grande armure et silhouette krogan.|Campagne / multi selon rencontre.|AGENT
AGENT|Agent hors-la-loi|Unité de soutien.|Soutien technique et diversion ; lien visuel vers construction ou cible affectée dans l’adaptation.|Armure légère et omni-outil.|Campagne / multi selon rencontre.|AGENT
ANARCHIST|Anarchist|Unité explosive hors-la-loi.|Projectiles de zone à trajectoire et délai visibles ; cadence limitée pour ne pas couvrir tout sol praticable.|Charges, grenades et équipement irrégulier.|Campagne / multi selon rencontre.|AGENT
HYDRA|Hydra|Méca des hors-la-loi.|Salve de missiles, canon puis refroidissement ; tir à travers couvert uniquement si matériau marqué destructible.|Méca large et lanceurs.|Campagne / multi selon rencontre.|AGENT
PARIAH|Pariah|Unité biotique hors-la-loi.|Contrôle de zone et projection ; contre visible avant déplacement forcé, résistance des gros alliés annoncée.|Asari en tenue de mercenaire.|Campagne / multi selon rencontre.|AGENT
SABOTEUR|Saboteur|Unité technique hors-la-loi.|Pose de zone dangereuse et brouillage ; l’objet placé possède sa propre cible et peut être neutralisé.|Omni-outil et matériel de terrain.|Campagne / multi selon rencontre.|AGENT
SHARPSHOOTER|Sharpshooter|Tireur de précision hors-la-loi.|Laser de visée avant tir ; casser la ligne annule la résolution sans conserver impact fantôme.|Lunette et arme longue.|Campagne / multi selon rencontre.|AGENT
OUTLAW-TURRET|Tourelle de hors-la-loi|Défense fixe.|Cône limité, rechargement puis reprise ; couleur de faction différente de l’Assault Turret de Ryder.|Trépied de récupération.|Campagne / multi selon rencontre.|AGENT
ADHI-TRAINED|Adhi dressé|Animal utilisé par des groupes ennemis.|Course, morsure puis recul ; prise à l’avant-bras convertie en état secourable sans martèlement de touche.|Quadrupède bas et harnais selon variante.|Faction de la rencontre distincte de faune sauvage.|ADHI
ASSEMBLER|Assembler|Machine reliquate.|Production de renforts avec cycle annoncé et emplacements réservés ; interruption de fabrication ne crée pas d’unité invisible.|Machine flottante et éléments rotatifs.|Sites reliquats.|ASSEMBLER
BREACHER|Breacher|Unité reliquate.|Approche de contact puis onde courte proposée ; forme basse reste sélectionnable par icône de cible.|Petite machine segmentée.|Sites reliquats.|ASSEMBLER
CREEPER|Creeper|Unité reliquate de proximité.|Avance sur sol puis attaque de contact ; déplacement de mur purement visuel si collision non gérée.|Petite silhouette mécanique et pattes.|Sites reliquats.|ASSEMBLER
DESTROYER|Destroyer|Machine reliquate lourde.|Tourelles latérales, salves et noyau ; pièces ciblables ont barres et projections au sol indépendantes du corps.|Châssis massif et lumière turquoise.|Sites reliquats.|ASSEMBLER
NULLIFIER|Nullifier|Machine reliquate protégée.|Déploiement de barrière puis tir ; exposer flanc et intervalle de reconfiguration plutôt qu’immunité totale opaque.|Bouclier frontal et corps mécanique.|Sites reliquats.|ASSEMBLER
OBSERVER|Observer|Machine reliquate volante.|Rayon continu à préparation visible ; version alliée étiquetée et contours de faction distincts.|Petit œil flottant et faisceau.|Hostile ou allié selon console / mission.|ASSEMBLER,PEEBEE-LOYAL
REM-TURRET|Tourelle reliquate|Défense de site.|Commande de console change faction explicitement ; conserver cible réservée ou annuler proprement lors de conversion.|Pylône et canon géométriques.|Sites reliquats.|ASSEMBLER
ARCHITECT|Architecte reliquat|Machine géante de plusieurs mondes.|Membres puis tête exposée, repositionnement et renforts ; attaque au sol lisible en vue isométrique, distance visuelle ne cache pas portée réelle.|Long corps et trois membres monumentaux.|Rencontres Eos/Voeld/Kadara/Elaaden à parametrer séparément.|ASSEMBLER,MISSIONS
PROGENITOR|Progenitor|Boss reliquat nommé.|Variante Destroyer à phases propres, objectifs latéraux puis cœur ; aucune nouvelle espèce inventée.|Machine lourde aux points lumineux.|The Remnant Tiller.|ASSEMBLER,MISSIONS
ARCHON-FINAL|Archonte et réseau de Méridiane|Confrontation finale.|Boss à objectifs : survivre aux machines, ouvrir relais puis couper contrôle ; ne pas traiter l’Archonte comme fantassin à abattre directement.|Plateforme de contrôle et machine géante.|Final solo uniquement.|MERIDIAN
CALOT|Calot Gurting|Chef du vaisseau de Liam.|Bouclier à neutraliser par point de piratage défendu ; couvrir l’opérateur et repousser les vagues limitées.|Angara de commandement et champ protecteur.|Liam: All In.|LIAM-LOYAL
MERIWEATHER|Meriweather|Antagoniste de la mission de Vetra.|Rencontre conditionnée aux sabotages de Sid ; renforts et dangers correspondent aux salles réellement préparées.|Chef de groupe et mine industrielle.|Vetra: Means and Ends.|VETRA-LOYAL
ADHI-WILD|Adhi sauvage|Faune de Heleus.|Territoire et avertissement avant poursuite ; possibilité d’observation sans combat si le joueur reste hors zone proposée.|Quadrupède nerveux.|Faune, pas faction kett par défaut.|ADHI
ANCIENT-EIROCH|Ancient Eiroch|Créature massive.|Charge et balayage à cône large ; faiblesse proposée après collision, champ de cible indépendant de hauteur du sprite.|Grand quadrupède et tête massive.|Rencontre de faune.|EIROCH
KAERKYN|Kaerkyn|Faune locale.|Réaction de défense et déplacement court proposés ; comportement non hostile par défaut tant que rencontre ne le requiert.|Créature locale à silhouette distincte.|Paramètres d’hostilité à vérifier par lieu.|KAERKYN
SPITBUG|Spitbug|Créature projetant une substance.|Jet arqué puis zone persistante proposée ; trace au sol donne durée et contournement.|Insectoïde et projectile visible.|Faune.|SPITBUG
TAURG|Taurg|Faune locale.|Patrouille territoriale et recul d’avertissement proposés ; conservation d’une distance d’observation pour scanner.|Grande silhouette de faune.|Hostilité déterminée par variante documentée.|TAURG
CHALLYRION|Challyrion|Faune de Havarl.|Variante normale observable et variante mutée dangereuse séparées ; analyser avant action reste une vraie option.|Créature de jungle et variante plus grande.|Overgrown pour variante mutée.|CHALLYRION,OVERGROWN
'''
for line in enemy_data.strip().splitlines():
    key,name,fact,rule,look,cond,src=line.split('|');key=key.replace(' ','')
    eid=c.add('enemies',key,name,fact,rule,visual=look,conditions=cond,source=src,
      acceptance=f'{name} : tester la menace annoncée, une réponse de déplacement, un contre compatible et la sortie de combat ; cible, faction et phase ne changent jamais sans retour visible.',
      animation='Préparer une anticipation orientée, un événement de résolution, une récupération et une réaction interrompue propres à ce comportement : '+rule,
      audio='Créer un signal distinct de préparation et une indication visuelle équivalente ; signaux de créature, machine et tir allié restent différenciés.')
    c.original('enemy_moves',key,'Séquence adverse — '+name,rule,look,cond,[eid],
      acceptance=f'Le cycle de {name} réserve ses cibles et emplacements avant résolution ; interruption, cible morte et changement de scène ne laissent ni projectile ni renfort orphelin.',
      animation='Départ, trajet ou canalisation, contact puis retour ; le pivot au sol et l’altitude visuelle restent cohérents avec les zones annoncées.',
      audio='Déclenchement au premier événement de cycle uniquement ; pause ATB et reprise ne rejouent pas le signal de menace sans nouvelle attaque.')

wiki('PROFILES','Profiles','Profiles','Sept profils de Ryder et progression')
wiki('FAMILY','Ryder Family Secrets','Ryder_Family_Secrets','Souvenirs, Ellen et Bienfaiteur')
wiki('OMNI-GRENADE','Omni Grenade','Omni_Grenade','Compétence, réserve et variantes')
wiki('FLAK','Flak Cannon','Flak_Cannon','Compétence de Ryder et Drack')
wiki('PATH-ARMOR','Pathfinder Armor','Pathfinder_Armor','Pièces et compatibilité d’armure')
for e in c.entries:
    if e['id']=='MEA-SQ-FAMILY':e['sourceIds']=['MEA-SRC-FAMILY']
    if e['id'] in ('MEA-NPC-ELLEN','MEA-NPC-BENEFACTOR','MEA-LOR-BENEF'):e['sourceIds']=['MEA-SRC-FAMILY']

weapon_data='''
AVENGER|Avenger|Fusil d’assaut.|Rafale de référence et reprise courte proposées ; poids/temps affichés avant équipement.|Silhouette militaire compacte.
CYCLONE|Cyclone|Fusil d’assaut.|Montée en régime puis suppression ; une pause de déplacement réduit stabilité dans l’adaptation.|Gros fusil à rotation.
MATTOCK|Mattock|Fusil semi-automatique.|Tirs posés à coût par coup ; conserver possibilité de changer de cible entre coups.|Longue crosse et canon.
REVENANT|Revenant|Fusil d’assaut lourd.|Rafale prolongée engageant la position ; réserver une fenêtre d’interruption et de repli.|Large carcasse et chargeur.
VALKYRIE|Valkyrie|Fusil d’assaut.|Salve en deux temps, événements de dégâts distincts mais coût ATB unique annoncé.|Fusil militaire N7.
SWEEPER|Sweeper|Fusil reliquat.|Cycle énergétique et surchauffe proposés ; affichage de chaleur distinct de clips thermiques.|Surface noire et lumière reliquate.
PAW|P.A.W.|Arme à rayon.|Canalisation sur cible visible ; interruption arrête consommation au même instant que le rayon.|Rayon continu et cœur énergétique.
THOKIN|Thokin|Fusil kett.|Projectile énergétique à suivi limité proposé ; aperçu indique possibilité de contourner couvert bas, pas mur plein.|Arme organique et chambre lumineuse.
ZALKIN|Zalkin|Fusil kett.|Salve lourde à dispersion proposée ; distinguer projectile et flash de protection ennemie.|Carcasse osseuse angulaire.
SONED|Soned|Fusil kett lourd.|Temps d’installation puis gros volume de tir ; récupération rend le porteur vulnérable si isolé.|Grande arme lourde organique.
PIONEER|Pathfinder Pioneer|Arme du pack Pathfinder Elite.|Profil de fusil de début distinct sans rendre le pack indispensable à un build ; manifeste d’édition contrôle accès.|Fusil de Pionnier.
PREDATOR|Predator|Pistolet.|Arme légère d’exploration ; faible coût de préparation proposé, utile après déplacement.|Pistolet compact.
CARNIFEX|Carnifex|Pistolet lourd.|Gros impact ponctuel et faible réserve proposée ; rôle d’achèvement sur cible exposée.|Grande carcasse métallique.
PHALANX|Phalanx|Pistolet.|Précision de milieu de gamme proposée ; retours de recul lisibles à petite échelle.|Pistolet militaire stable.
EAGLE|Eagle|Pistolet automatique.|Courte rafale à cadence élevée ; consommation par projectile sans doubler un proc de pouvoir.|Pistolet N7.
EQUALIZER|Equalizer|Pistolet reliquat.|Débit énergétique de proximité et chaleur ; éviter mélange avec courbe de refroidissement du Sweeper.|Arme noire et lumineux turquoise.
CHARGER|Charger|Pistolet automatique.|Suppression légère avec dérive progressive ; cadence originale du fan game réglable.|Arme compacte à chargeur.
HORNET|Hornet|Arme automatique classée pistolet.|Salve courte à reprise ; afficher catégorie de MEA au lieu d’importer un slot SMG séparé de la trilogie.|Petit boîtier militaire.
SCORPION|Scorpion|Pistolet explosif.|Charge adhésive et détonation retardée ; zone suit le porteur jusqu’à explosion selon règle affichée.|Projectile collant lumineux.
SIDEWINDER|Sidewinder|Pistolet de type revolver.|Tirs mesurés et recharge exposée ; silhouette de barillet préservée aux rotations.|Revolver futuriste.
TALON|Talon|Pistolet à dispersion.|Cône de proximité avec aperçu des cibles touchées ; pas de précision garantie à distance.|Gros canon court.
KATANA|Katana|Fusil à pompe.|Cône court de référence ; largeur affichée au sol avant commande.|Fusil militaire classique.
RUZAD|Ruzad|Fusil krogan.|Grosse impulsion à courte portée et préparation lourde ; armement de Drack cité sans rendre son inventaire éditable.|Carcasse krogan massive.
HESH|Hesh|Fusil kett.|Rafales de proximité proposées ; recul et angle de cible définissent les risques d’approche.|Arme organique courte.
DHAN|Dhan|Fusil angara.|Salve dense à projectile visible ; effet d’étourdissement proposé dépend de résistance de cible.|Forme angara et projectiles d’énergie.
DISCIPLE|Disciple|Fusil asari.|Arme légère de contrôle proposée ; déplacement puis tir s’enchaînent avec coût transparent.|Courbes asari.
REEGAR|Reegar Carbine|Fusil électrique.|Jet court continu, ressource consommée pendant canalisation ; arc visuel ne peut traverser mur opaque.|Électricité et petit canon.
SCATTERSHOT|Scattershot|Fusil reliquat.|Salve d’énergie et chaleur ; cône de dispersion lisible malgré multitude de projectiles.|Géométrie reliquate et lueurs.
PIRANHA|N7 Piranha|Fusil à pompe.|Rafale rapide de contact ; le porteur choisit durée d’engagement dans menu ATB proposé.|Arme N7 compacte.
VENOM|Venom|Fusil à projectiles explosifs.|Mode de charge proposé avec parabole ; avertir des surfaces qui changent rebond ou zone.|Lanceur à canon large.
DEEP-IMPACT|Pathfinder Deep Impact|Arme du pack Pathfinder Elite.|Profil d’impact court défini comme équipement additionnel ; aucune quête principale ne l’exige.|Fusil de Pionnier.
MANTIS|Mantis|Fusil de précision.|Tir préparé sur ligne dégagée ; maintenir visée coûte une action clairement bornée.|Long canon et lunette.
VIPER|Viper|Fusil de précision.|Suite de tirs avec retargeting après chaque impact ; conserver la lisibilité face à ennemis volants.|Arme fine semi-automatique.
BLACK-WIDOW|Black Widow|Fusil lourd de précision.|Petite série puissante proposée ; pénétration limitée aux matériaux déclarés traversables.|Grand fusil sombre.
INDRA|Indra|Fusil automatique de précision.|Canal court avec dispersion graduelle ; couvert ou attaque reçue perturbe la stabilité proposée.|Fusil long automatique.
ISHARAY|Isharay|Fusil angara de précision.|Gros coup puis longue reprise ; prévisualiser changement d’angle adverse avant confirmer l’engagement.|Arme angara lourde.
LANAT|Lanat|Fusil angara de précision.|Charge contrôlée puis projectile ; tir partiel et complet distingués dans file d’action.|Chambre d’énergie et long fût.
INFERNO|Inferno|Fusil kett de précision.|Tir énergétique et refroidissement proposés ; signal visuel propre évite confusion avec incendie de compétence.|Arme kett et lueur rouge.
VANQUISHER|Vanquisher|Fusil de précision.|Tir répété et cadence de repositionnement ; spécialisation proposée sans affirmer classement canon.|Carcasse de sniper tactique.
WATCHMAN|Pathfinder Watchman|Arme du pack Pathfinder Elite.|Option de sniper additionnelle avec entrée d’inventaire propre ; accès conditionné au manifeste d’édition.|Fusil de Pionnier.
OMNIBLADE|Omni-Blade|Arme de mêlée.|Fente courte avec cible et cellule de retour réservées ; contact exige portée réelle au sol.|Lame orange sur avant-bras.
ASARI-SWORD|Asari Sword|Arme de mêlée.|Approche biotique et frappe proposée ; vérifier la place d’arrivée avant mouvement pour éviter traverser des murs.|Lame fine et traînée bleue.
KROGAN-HAMMER|Krogan Hammer|Arme de mêlée.|Frappe lourde à zone courte, préparation longue et choc au sol ; grandes silhouettes ne modifient pas rayon de dégâts.|Marteau massif.
FIRAAN|Angaran Firaan|Arme de mêlée angara.|Combo court directionnel ; chaque coup a cible réservée et retour interruptible.|Lame angara.
CARFALON|Kett Carfalon|Arme de mêlée kett.|Entaille puissante et mouvement de reprise ; effets de soin éventuels seulement si définis dans recette du fan game.|Grande lame organique.
VAKARSH|Kett Vakarsh|Arme de mêlée kett.|Frappe rapide de contact ; silhouette distincte de Carfalon malgré technologie commune.|Lame osseuse plus compacte.
CRYO-GAUNTLET|Remnant Cryo-Gauntlet|Arme de mêlée reliquate.|Coup de givre puis recul ; ralentissement proposé visible et résistance des boss expliquée.|Gantelet noir et givre.
BIOTIC-AMP|Biotic Amplifier|Arme de mêlée biotique.|Impulsion rapprochée, dépense et résistance clairement affichées ; ne devient pas compétence active supplémentaire gratuite.|Poing et halo biotique.
'''
for line in weapon_data.strip().splitlines():
    key,name,fact,rule,look=line.split('|')
    src='MELEE' if key in ('OMNIBLADE','ASARI-SWORD','KROGAN-HAMMER','FIRAAN','CARFALON','VAKARSH','CRYO-GAUNTLET','BIOTIC-AMP') else 'SWEEPER' if key=='SWEEPER' else 'WEAPONS'
    c.add('weapons',key,name,fact,rule,visual=look,source=src,
      conditions='Solo ; les valeurs, versions de rang et adaptations multijoueurs sont des données séparées.' if not key.startswith(('PIONEER','DEEP-IMPACT','WATCHMAN')) else 'Pack Pathfinder Elite / édition compatible ; vérifier la voie d’acquisition.',
      acceptance=f'{name} : aperçu de portée, coût et ressource correspond à la résolution ; vérifier obstacle, cible mobile, rechargement/refroidissement et annulation avant tir.',
      animation='Pose de visée adaptée à cette carcasse, départ de tir ou frappe, recul/contact puis reprise ; point d’origine lié à la main et non au centre du sprite.',
      audio='Créer signature originale du mécanisme et de son impact ; mix séparant arme du joueur et armes adverses de même famille.')

c.rows('equipment','''
INITIATIVE|Initiative Armor|Famille d’armure humaine.|Pièces par emplacement, silhouette de départ et bonus proposés ; comparaison avant remplacement.|Blanc et gris d’expédition.||ARMOR
PATHFINDER|Pathfinder Armor|Armure en quatre pièces.|Casque, torse, bras et jambes suivis séparément ; couleur n’altère pas la recette ou les effets.|Armure du Pionnier et insigne.||PATH-ARMOR
N7|N7 Armor|Armure N7.|Preset visuel iconique, pièces et effets proposés dans arbre de fabrication ; aucune présence de Shepard induite.|Noir, rouge et marquage N7.||N7-ARMOR
HYPERGUARDIAN|Hyperguardian Armor|Famille d’armure.|Profil de défense lourde proposé ; épaules larges mais collision identique au gabarit de Ryder.|Plaques épaisses et casque robuste.||ARMOR
MAVERICK|Maverick Armor|Famille d’armure.|Profil de précision proposé avec silhouette légère ; effets visibles pièce par pièce.|Tenue de tireur et visière.||ARMOR
ANGARAN|Angaran Armor|Armure de technologie Heleus.|Préserver langage textile/plaques angara ; apparence de Ryder reste distincte d’un corps angara.|Violet, textiles et plaques locales.||ANGARA-ARMOR
KETT|Kett Armor|Famille de technologie kett.|Variantes Integrator/Fusion/Unity à enregistrer par pièce et rang ; ne pas confondre nom Fusion et mod de fusion.|Plaques osseuses intégrées à tenue humaine.||KETT-ARMOR
REMNANT|Remnant Armor|Armure reliquate.|Géométrie noire et lumière modérée ; effets de protection proposés séparés de l’apparence robotique.|Segments noirs et accents turquoise.||REM-ARMOR
HELEUS|Heleus Armor|Famille d’armure.|Combinaison visuelle des technologies avec recette explicite ; aucune origine supplémentaire inventée dans codex.|Matériaux mixtes et détails locaux.||HELEUS-ARMOR
SCAVENGER|Scavenger Armor|Armure de l’édition Deluxe.|Preset additionnel avec compatibilités propres ; pas de slot de fusion ajouté silencieusement.|Armure de récupération.|Édition compatible.|SCAV-ARMOR,EA-DELUXE
DEEP-SPACE|Deep Space Explorer Armor|Armure de l’édition Deluxe.|Tenue d’exploration additionnelle ; séparer bonus proposés et skins du Nomad.|Tenue de grande expédition.|Édition compatible.|EA-DELUXE,ARMOR
AUGMENT|Augmentations de fabrication|Modifications intégrées lors de fabrication.|Choisir lors de création, aperçu global et restauration lors de démontage selon règle versionnée ; ne pas confondre avec mod installé ensuite.|Emplacements de recette et icônes d’effet.||RESEARCH,ARMOR
FUSION|Mods de fusion|Modifications d’armure spécifiques.|Torse compatible seulement ; avantage et pénalité tous deux visibles, vérifier exceptions d’armures additionnelles.|Noyau au torse et deux lignes d’effet.||ARMOR
WEAPON-MODS|Mods d’armes|Modifications équipables.|Compatibilité par famille et emplacement ; comparaison conserve le cumul réel de toutes les pièces.|Slots autour d’une arme.||WEAPONS,LOADOUT
WEIGHT|Masse du loadout|L’équipement affecte le profil de jeu.|Calcul de récupération proposé affiché avant départ ; exclusion des armes de compagnon non personnalisables.|Jauge de masse et cadence des compétences.||LOADOUT,COMBAT
AMMO-FIRE|Munitions incendiaires — consommable|MEA utilise des consommables de munitions.|Activation sur arme compatible avec réserve et durée proposées ; aucune compétence Ammo importée automatiquement de ME3.|Chargeur orange et compteur de consommable.||COMBAT
AMMO-CRYO|Munitions cryogéniques — consommable|Type de consommable.|Ralentissement proposé progressif, expiration et remplacement d’un autre mode visibles.|Chargeur blanc et motif de givre.||COMBAT
AMMO-DISRUPT|Munitions disruptives — consommable|Type de consommable.|Effet sur protections techniques selon table proposée ; stock séparé des cellules de compétence.|Chargeur bleu et éclairs.||COMBAT
SHIELD-CAP|Shield Capacitor|Consommable de protection.|Commande de secours avec ressource débitée une fois ; pas d’application si écran de dialogue retire le combat.|Icône de bouclier et pulse.||COMBAT
POWER-CELLS|Cellules de pouvoirs|Certaines compétences ont une réserve limitée.|Stock par compétence à afficher avant ordre ; ramassage réparti sans remplir arbitrairement toutes les charges.|Petites cellules et compteur d’icône.||OMNI-GRENADE,SKILLS
NOMAD-UPGRADES|Améliorations du Nomad|Le véhicule peut être amélioré.|Recettes et effets de véhicule séparés de Ryder ; changements de bouclier/propulsion visibles sur fiche Nomad.|Châssis à six roues et modules.||MISSIONS,MANUAL
NOMAD-SKINS|Apparences du Nomad|Des skins additionnels existent.|Palette et peinture sans statistiques implicites ; conditions Deluxe ou autre contenu indiquées.|Nomad avec motifs sélectionnables.|Selon édition et contenu.|EA-DELUXE,BW-106
''')

# Les 36 compétences de Ryder et un groupe de compétences propres aux alliés.
power_data='''
CONCUSSIVE|Concussive Shot|Combat|Tir de déséquilibre à cible ; résistance lourde réduit déplacement sans effacer le retour d’impact.|Projectile blanc et recul.
OMNI-GRENADE|Omni Grenade|Combat|Grenade à réserve et fusée proposées ; option de maintien remplacée par sélection explicite du délai pour accessibilité ATB.|Arc et cercle d’explosion.
TRIP-MINE|Trip Mine|Combat|Poser deux points de détection compatibles ; segment de déclenchement visible, explosion à rayon séparé.|Ligne laser et petite mine.
TURBOCHARGE|Turbocharge|Combat|Fenêtre de tir renforcée proposée ; aperçu affiche effet sur arme équipée et consommation accrue éventuelle.|Arme surlignée et jauge de durée.
BARRICADE|Barricade|Combat|Couvert déployable orienté avant pose ; interdire placement qui enferme un allié ou bloque unique sortie.|Plaque holographique basse.
FLAK|Flak Cannon|Combat|Cône de fragments à charge limitée ; cibles et résistance d’armure prévisualisées.|Éclats orange en éventail.
PISTOLS|Pistols|Passif combat|Améliorer famille pistolets dans l’arbre proposé ; affecte aussi armes automatiques classées pistolets, sans slot SMG ajouté.|Icône d’arme courte.
ASSAULT-RIFLES|Assault Rifles|Passif combat|Bonus de stabilité/efficacité proposés ; récapitulatif du gain actif sur arme tenue.|Icône de fusil.
SHOTGUNS|Shotguns|Passif combat|Réglage de dispersion et de reprise proposé ; ne modifie pas visuellement le cône sans mettre à jour l’aperçu.|Cône court.
SNIPERS|Sniper Rifles|Passif combat|Bonus de visée proposés, temps d’engagement visible ; aucune pénétration de mur universelle gratuite.|Lunette et ligne de visée.
FITNESS|Combat Fitness|Passif combat|Capacités corporelles et emplacements de loadout proposés ; migration recalcule maxima sans guérir gratuitement en boucle.|Silhouette et emplacements d’armes.
COMBAT-TOOLS|Combat Tools|Passif combat|Effets de mêlée et consommables selon choix d’arbre ; séparer gain passif de charge active.|Omni-outil et arme de contact.
THROW|Throw|Biotique|Impulsion selon axe choisi ; destination valide affichée et arrêt au premier mur plein.|Trait bleu et flèche de recul.
PULL|Pull|Biotique|Soulever cible vulnérable puis conserver pour combo selon règle proposée ; cible blindée explique résistance.|Halo de lévitation.
CHARGE|Charge|Biotique|Approche rapide vers cible avec place d’atterrissage réservée ; échec de chemin ne consomme pas l’action.|Traînée bleue et onde de contact.
NOVA|Nova|Biotique|Onde de proximité, coût de protection proposé visible ; phase aérienne n’invente pas invulnérabilité permanente.|Cercle de choc au sol.
SHOCKWAVE|Shockwave|Biotique|Succession de bandes de contrôle ; franchit couvert bas autorisé, stoppe au mur complet.|Vagues bleues en ligne.
ANNIHILATION|Annihilation|Biotique|Aura portée par Ryder avec rayon et coût d’entretien proposés ; danger pour ennemis n’obstrue pas sélection d’allié.|Anneau violet mobile.
BACKLASH|Backlash|Biotique|Bouclier orienté réfléchissant selon règle proposée ; ne renvoie pas attaque de zone ou saisie sans compatibilité explicite.|Écran biotique frontal.
SINGULARITY|Singularity|Biotique|Zone de suspension à centre fixe ; bornes du contrôle et des protections résistantes visibles.|Noyau sombre et anneaux.
LANCE|Lance|Biotique|Projectile rapide de détonation proposée ; choisir cible amorcée et coût avant résolution.|Trait violet fin.
BARRIER|Barrier|Passif biotique|Améliorations de protection dans l’arbre ; ne pas créer un bouton actif nommé Barrier importé de ME3.|Contour de bouclier biotique.
CONTAINMENT|Containment|Passif biotique|Durée/contrôle proposés sur effets compatibles ; aperçu de durée recalculé selon rang.|Icône de confinement.
OFFENSIVE-BIOTICS|Offensive Biotics|Passif biotique|Effets offensifs proposés séparés des dégâts d’arme ; pas de double multiplication aux combos.|Emblème biotique et récapitulatif.
OVERLOAD|Overload|Tech|Impulsion électrique ou chaîne proposée ; ordre des cibles secondaires affiché, barrière et bouclier non confondus.|Arc bleu-orange.
INCINERATE|Incinerate|Tech|Projectile incendiaire et état de combustion ; cibles immunes gardent leurs protections lisibles.|Projectile orange et flamme résiduelle.
ASSAULT-TURRET|Assault Turret|Tech|Construction sur sol admis, ligne de tir et durée ; une nouvelle pose respecte limite active annoncée.|Tourelle compacte et cône.
CRYO-BEAM|Cryo Beam|Tech|Canal de refroidissement progressif ; interrompre stoppe rayon et consommation au même événement.|Rayon blanc et givre.
ENERGY-DRAIN|Energy Drain|Tech|Drain sur cible compatible et gain de protection proposé ; pas de soin arbitraire sur créature sans énergie admissible.|Lien électrique vers Ryder.
TACTICAL-CLOAK|Tactical Cloak|Tech|Camouflage réduit sélection puis se rompt sur action offensive ; attaque déjà résolue ne disparaît pas rétroactivement.|Réfraction et contour accessible.
FLAMETHROWER|Flamethrower|Tech|Cône continu de feu ; rotation limitée pendant canalisation et durée visible.|Jet orange court.
INVASION|Invasion|Tech|Dégradation technique transmissible selon règle proposée ; chaînes limitées et origine de statut visible.|Nuage de particules et liens orange.
REMNANT-VI|Remnant VI|Tech|Observer allié commandable après déblocage ; unité invoquée ne remplace pas un équipier dans le roster.|Petit Observer de faction alliée.
AUXILIARY|Auxiliary Systems|Passif tech|Soutien aux compétences tech compatibles ; pas d’application silencieuse aux armes ou pouvoirs biotiques.|Circuit et symboles de systèmes.
OFFENSIVE-TECH|Offensive Tech|Passif tech|Renforcer dégâts et interactions tech proposés ; comparer effet de base et combo sans double comptage.|Circuit offensif.
TEAM-SUPPORT|Team Support|Passif tech|Soutien à l’équipe selon portée et déclencheur proposés ; buffs de groupe ont durée et source affichées.|Trois portraits reliés.
SHIELD-BOOST|Shield Boost|Allié Cora|Secours de protection avec cible et rayon proposés ; le gain ne relève pas un mort sans règle médicale dédiée.|Pulse bleu autour des alliés.
HAVOC|Havoc Strike|Allié Liam|Bond offensif vers cellule réservée puis retour au contrôle ; point de départ ne constitue pas téléportation libre.|Impulsion de saut et impact.
FRAG|Frag Grenade|Allié Liam|Grenade propre au compagnon ; réserve et compétences de Ryder distinctes dans données.|Grenade et arc de lancer.
AVENGER-STRIKE|Avenger Strike|Allié Jaal|Approche furtive de frappe et repli ; chemin et cible valides avant coût, retour évite fosse et couvert.|Voile bref et lame de contact.
STICKY|Sticky Grenade|Allié Jaal|Charge adhésive à délai visible ; ne pas confondre avec évolution d’Omni Grenade de Ryder.|Charge fixée et signal de durée.
POWER-ARMOR|Power Armor|Allié Vetra|Défense personnelle renforcée proposée, purge et récupération lisibles ; ne rend pas Ryder équipé du même pouvoir.|Plaques lumineuses sur Vetra.
BLOOD-RAGE|Blood Rage|Allié Drack|Fenêtre offensive de mêlée et résistance proposée ; le risque et la fin de rage sont signalés avant épuisement.|Halo rouge et posture krogan.
'''
for line in power_data.strip().splitlines():
    key,name,family,rule,look=line.split('|')
    src={'OMNI-GRENADE':'OMNI-GRENADE','FLAK':'FLAK','BARRICADE':'BARRICADE','ASSAULT-TURRET':'TURRET','COMBAT-TOOLS':'TOOLS','AUXILIARY':'AUX','TEAM-SUPPORT':'SUPPORT'}.get(key,'SKILLS')
    c.add('powers',key,name,'Compétence de MEA — '+family+'.',rule,visual=look,conditions=family,source=src,
      acceptance=f'{name} : contrôler cible, protections, portée, coût, interruption et fin d’effet ; un passif n’apparaît jamais comme action sélectionnable et un pouvoir d’allié n’entre pas dans le build de Ryder par erreur.',
      animation='Aucune animation d’activation pour les passifs ; pour une action, pose anticipée, effet à événement unique et reprise compatible avec saut/sol.',
      audio='Signature originale par famille ; signal de disponibilité distinct du signal d’impact, équivalents visuels pour les informations utiles.')

for args in [
('TRAIL2','A Trail of Hope II','A_Trail_of_Hope_II','Captifs et Cardinal'),
('ANCIENT-AI','Uncovering the Past','Uncovering_the_Past','IA ancienne, otage et destinataire'),
('TURIAN-LOST','Turian Ark: Lost But Not Forgotten','Turian_Ark%3A_Lost_But_Not_Forgotten','Avitus et secours final'),
('DUNN','Nozomi Dunn','Nozomi_Dunn','Capitaine et destin final'),
('MP-ZERO','Firebase Zero','Firebase_Zero','Carte multijoueur et index de cartes'),
('MP-MAGMA','Firebase Magma','Firebase_Magma','Carte multijoueur et index de cartes'),
('APEX','APEX Missions','APEX_Missions','Opérations coopératives et contexte')]:wiki(*args)

c.rows('npcs','''
KERI|Keri T’Vessa|Journaliste du Nexus.|Interviews aux fenêtres de campagne, amitié et relation séparées ; témoignage sur découverte réelle seulement.|Asari et matériel de reportage.||CHAR
AVELA|Avela Kjar|Chercheuse angara d’Aya.|Réception d’artefacts et conversations culturelles ; lien personnel ne change pas le contenu des archives par magie.|Angara au musée et outils de recherche.||CHAR,AYA-PAGE
RAELIS|Raelis|Contact de renseignement.|Reçoit les données de Know Your Enemy ; dossier complet et message final validés une seule fois.|Angara et console de données.||MISSIONS,CHAR
HAINLY|Hainly Abrams|Personnage dont le dialogue fut ajusté.|Utiliser le profil de dialogue postérieur au correctif retenu ; ne pas confondre texte de lancement et version 1.08.|Scientifique humaine à l’avant-poste.|Version de patch explicitée.|BW-108
''')

c.rows('choices','''
RYDER|Choisir Sara ou Scott|Un jumeau devient le personnage joué.|Deux identités, personnalisation et jumeau non joué dérivés au départ ; aucun échange de noms lors du relais final.|Écran de création et portraits liés.||GUIDE
TONE|Tons de dialogue de Ryder|Les réponses utilisent plusieurs tons.|Émotionnel, logique, décontracté et professionnel comme styles, pas axe Paragon/Renegade ; choix d’action séparé du ton.|Quatre symboles de réponse.||GAME
EOS|Avant-poste scientifique ou militaire|Premier établissement offre un choix.|Conserver fonction choisie, réactions et éléments d’avant-poste ; pas de bonus numérique de source non vérifié.|Deux projets de Prodromos.||GUIDE,EOS-PAGE
MOSHAE|Site d’exaltation et captifs|La conclusion de Voeld propose une décision.|Libération des captifs et destruction du site sont alternatives ; confirmer connaissance des conséquences sans inventer solution universelle sauvant tout.|Plan d’installation et portraits angara.||TRAIL2
CARDINAL|Sort du Cardinal|Une interruption suit le choix de site.|Traiter sort du boss séparément de la décision sur prisonniers ; ne pas rouvrir une confrontation terminée après chargement.|Cardinal au sol et signal de réaction.||TRAIL2
RAEKA|Raeka ou éclaireurs krogan|La traque exige un choix de secours.|Deux objectifs mutuellement engagés ; conserver personnages, réactions de Drack et succession galarienne dans états distincts.|Deux routes et communications urgentes.||ARCHON
SARISSA-TRUTH|Révéler les actes de Sarissa|Cora découvre un journal compromettant.|Conserver révélation publique, réaction de Cora et décision de commandement séparément ; une preuve lue n’est pas automatiquement divulguée.|Passerelle et enregistrement.||CORA-LOYAL
SARISSA-ROLE|Sarissa ou Vederia comme Pionnière|Le rôle asari peut changer.|Présenter successeure et maintien du commandement ; présence finale correspond à fonction confirmée, pas au seul choix de révélation.|Deux portraits de Pionnières.||CORA-LOYAL
AVITUS|Convaincre Avitus de devenir Pionnier|La succession turienne dépend du dialogue.|Choix explicite après découverte de Macen ; refus laisse le poste vacant et affecte la préparation du secours final.|SAM turien et portrait d’Avitus.||TURIAN-LOST
AKKSUL|Tirer ou faire confiance à Jaal|La loyauté de Jaal propose une interruption.|Fenêtre accessible et visée lisible ; absence de tir est un choix enregistré, pas un bouton ignoré sans effet.|Jaal, Akksul et famille.||JAAL-LOYAL
KALINDA|Sauver Kalinda ou récupérer l’appareil|La mission de Peebee diverge.|Tir fait chuter Kalinda et préserve l’objet ; laisser Peebee secourir perd l’appareil, avec retours propres à chaque branche.|Deux points d’intérêt au-dessus de lave.||PEEBEE-LOYAL
VERAND|Libérer ou retenir Verand|Le débrief de Liam comporte une décision.|Enregistrer traitement de la rescapée et réaction de Liam ; ne pas casser une romance par une règle non attestée.|Tempest et communication aux sauveteurs.||LIAM-LOYAL
SID|Options des caméras de Sid|La mission de Vetra offre des interventions.|Chaque salle mémorise sabotage choisi ; gaz, machine neutralisée ou explosion changent son danger réel, pas seulement le dialogue.|Écrans de sécurité et aperçu de salle.||VETRA-LOYAL
AROANE|Sort d’Aroane|Drack confronte le responsable du vol.|Mort ou conservation comme prisonnier ; ne pas inventer une grande conséquence ultérieure si source ne l’atteste pas.|Quai du transport et face-à-face krogan.||DRACK-LOYAL
SPENDER|Prison ou exil pour Spender|L’enquête de Drack mène à un verdict.|Décision après examen des preuves ; état du PNJ, message de clôture et responsabilité discutée restent cohérents.|Salle administrative du Nexus.||DRACK-LOYAL
CORE|Moteur reliquat et accord krogan|Le cœur volé intervient dans la négociation.|Don, conservation et permission d’implantation suivis séparément ; aucun avant-poste fondé si accord manquant.|Morda, cœur énergétique et carte d’Elaaden.||ELAADEN-PAGE
SLOANE-REYES|High Noon — autorité de Kadara|L’issue change le pouvoir local.|Intervention, mort/survie et direction politique ont variables propres ; gardes, contacts et missions suivent l’autorité finale.|Grotte et salle de gouvernement.||HIGH-NOON
NILKEN|Verdict de Nilken|L’enquête distingue intention et décès.|Présenter preuves avant libération ou exil ; le mot innocent ne réécrit pas les témoignages déjà acquis.|Dossier comparatif et cellule.||MURDER
CRYO|Réveil des proches en cryostase|Sleeping Dragons pose une demande collective.|Décision de gestion de population avec réponse aux familles ; ne pas ajouter un chronomètre de mort des proches absent de l’œuvre.|Protestataires et registre de pods.||DRAGONS
AI-LIFE|Détruire ou conserver l’IA ancienne|L’IA retient un prisonnier.|Deux résolutions cohérentes de l’otage ; confirmation avec informations connues, pas d’option cachée sauvant tout par rechargement de dialogue.|Otage, console ancienne et ligne de menace.||ANCIENT-AI
AI-OWNER|Confier l’IA aux angara ou à SAM|Le destinataire est choisi si l’IA survit.|Présence future au bon hub et éventuel soutien final ; aucun double exemplaire dans SAM Node et Aya.|Deux destinations d’archive.|IA conservée.|ANCIENT-AI
PRIMUS|Accepter l’aide proposée par la Primus|Un accord kett peut être discuté.|Enregistrer proposition, accord et utilisation séparés ; aucun changement universel de faction kett en alliés.|Communication kett et code d’accès.||MISSIONS
DUNN|Secours de l’Hyperion par les Pionniers|Le final dépend des Pionniers disponibles.|Matrice des quatre fonctions, Avitus et variantes asari/galarienne ; chaque secours vérifie personnages effectifs avant animation.|Hyperion en descente et communications.||DUNN,TURIAN-LOST,MERIDIAN
AMBASSADOR|Choix de l’ambassadeur de Heleus|L’épilogue propose une nomination.|Liste des candidats réellement disponibles ; rôle diplomatique enregistré sans promettre une suite politique non développée.|Dirigeants réunis à Port Meridian.||EPILOGUE
ELLEN|Partager les secrets familiaux|La chaîne dévoile la vérité sur Ellen.|États de mémoire, logs et rencontre du jumeau séparés ; connaissance n’est pas transmise avant accès à la dernière scène.|Pod et deux Ryder.|Arc de famille complété au moment admis.|FAMILY
ROMANCE|Relations de Ryder|Plusieurs partenaires ont des conditions propres.|Fiches de relation par partenaire, sexe du Ryder, patch et exclusivité ; signaler engagement explicite et distinguer flirt d’amitié.|Portrait et historique de rencontre.|Jaal/Scott possible à partir du correctif 1.08.|ROMANCE,BW-108
RESTORE|Restauration et implantation|Caveau et avant-poste sont distincts.|Un monde restauré reste à négocier/implanter ; pas de validation automatique de toutes ses tâches ni suppression de tous dangers.|Deux états sur carte planétaire.||VAULT,MISSIONS
''')

c.originals('ally_moves','''
CORA-SHIELD|Cora — assaut protégé|Charge ouvre un angle puis Shield Boost prépare le repli ; réserver arrivée et annoncer alliés dans rayon du secours.|Traînée bleue puis pulse de protection.||characters:CORA,powers:SHIELD-BOOST
LIAM-DRACK|Liam + Drack — brèche rapprochée|Havoc Strike décale un groupe compatible, Drack engage Flak Cannon ; aucun saut de Liam dans cône déjà réservé de son allié.|Bond humain puis tir krogan.||characters:LIAM,characters:DRACK,powers:HAVOC,powers:FLAK
VETRA-CORA|Vetra + Cora — couloir d’assaut|Power Armor stabilise Vetra pendant Turbocharge, Cora protège la progression ; portée de soutien visible avant départ.|Armure renforcée et arc biotique.||characters:VETRA,characters:CORA,powers:POWER-ARMOR
JAAL-PEEBEE|Jaal + Peebee — cible préparée|Invasion affaiblit le groupe, Jaal place une charge puis se replie ; ordre des explosions et états d’amorce montrés dans la file.|Particules tech puis charge adhésive.||characters:JAAL,characters:PEEBEE,powers:INVASION
CORA-PEEBEE|Cora + Peebee — contrôle biotique|Pull sur cible vulnérable puis Nova à proximité ; Cora ne traverse pas un mur pour atteindre une cible en hauteur.|Cible suspendue et onde au sol.||characters:CORA,characters:PEEBEE,powers:PULL,powers:NOVA
VETRA-JAAL|Vetra + Jaal — croisement des tirs|Vetra fixe une cible protégée, Jaal choisit un angle d’Energy Drain ; les tirs alliés ne bloquent pas artificiellement leurs propres lignes.|Deux axes et arc de drain.||characters:VETRA,characters:JAAL,powers:ENERGY-DRAIN
DRACK-FIRE|Drack — brûler puis engager|Incinerate prépare une cible cuirassée, Blood Rage ouvre la mêlée ; durée de rage annoncée pour choisir retour avant épuisement.|Projectile orange puis posture krogan.||characters:DRACK,powers:BLOOD-RAGE
LIAM-TECH|Liam — interruption de machine|Overload sur tourelle compatible puis progression vers couvert ; empêcher un ordre de contact si la machine reste hors portée réelle.|Arc électrique et chemin d’assaut.||characters:LIAM,powers:OVERLOAD
PEEBEE-REMNANT|Peebee — assistance de Poc|Distinguer robot narratif et Remnant VI invoqué ; commande technique passe par bon objet, ne double pas gratuitement un familier.|Petit robot et marque d’allié.||characters:PEEBEE,powers:REMNANT-VI
JAAL-REPOSITION|Jaal — frappe et retour|Avenger Strike réserve point de retrait avant attaque ; si point occupé, choisir alternative proche visible ou annuler proprement.|Voile, frappe et trajectoire retour.||characters:JAAL,powers:AVENGER-STRIKE
RYDER-COMBO|Ryder — amorce/détonation avec favori|Préparer avec compétence compatible, changer de favori seulement selon récupération annoncée ; aucune remise à zéro de cooldown en boucle.|Trois slots et icône d’amorce.||characters:RYDER,systems:FAVORITES
REVIVE|Secours au sol avec saut d’approche|Choisir allié puis réserver route et cellule de soin ; un saut ne permet pas de traverser un plafond pour secourir.|Chemin, point médical et portrait.||systems:VERTICAL
''')

# Échantillon de classes multijoueurs : toutes ont un statut distinct du groupe de Ryder.
for key,name,role,look in [
('HUMAN-KINETICIST','Human Kineticist','Accumuler une fenêtre biotique proposée puis gérer sa dissipation ; cycles de risque lisibles.','Humain à aura biotique'),
('ASARI-DUELIST','Asari Duelist','Combattante mobile de contact ; réserver entrée et sortie pour éviter prise létale sans réponse.','Asari et arme de mêlée'),
('TURIAN-HAVOC','Turian Havoc Trooper','Assaut aérien proposé avec durée de vol bornée et point d’atterrissage.','Turien à propulseurs'),
('KROGAN-ENGINEER','Krogan Engineer','Combiner construction et robustesse ; limite des invocations affichée pour tout le groupe.','Krogan avec outils techniques'),
('SALARIAN-ARCHITECT','Salarian Architect','Déploiement technique proposé et appui à distance ; bonus de groupe ne se cumulent pas sans borne.','Salarien en armure technique'),
('ANGARA-AVENGER','Angara Avenger','Infiltration et frappe coordonnée ; phase de réapparition toujours annoncée.','Angara et voile de camouflage'),
('BATARIAN-VANGUARD','Batarian Vanguard','Approche biotique lourde ; anticipation, impact et retour de contrôle distincts.','Batarien à quatre yeux et armure')]:
    c.add('characters','MP-'+key,name,'Classe du multijoueur de MEA.',role,visual=look+'.',conditions='Multijoueur APEX uniquement ; aucun recrutement dans la campagne de Ryder.',source='MP-CHARS',acceptance='Cette classe apparaît seulement dans le roster multijoueur ; vérifier sauvegarde, équipements et passifs sans modification des six équipiers de campagne.')
for key,name,look in [
('AQUA','Firebase Aqua','Plateformes et eau, conception de quais proposée'),
('DERELICT','Firebase Derelict','Installations abandonnées et couverts de récupération proposés'),
('ICEBREAKER','Firebase Icebreaker','Environnement glacé, chaleur et abris comme repères visuels proposés'),
('MAGMA','Firebase Magma','Fonderie sur rivière de lave'),
('NIMBUS','Firebase Nimbus','Volumes de station et lignes de hauteur à relever, kit de nuages proposé'),
('PARADOX','Firebase Paradox','Géométrie reliquate et réseau de plateformes proposé'),
('SANDSTORM','Firebase Sandstorm','Structures de désert et visibilité modulée proposées'),
('VERTIGO','Firebase Vertigo','Hauteurs et ponts, zones de chute toujours marquées'),
('ZERO','Firebase Zero','Avant-poste minier dans un astéroïde'),
('REMNANT','Remnant Ruins','Ruines reliquates et objectifs de mission APEX')]:
    c.add('zones','MP-'+key,name,'Carte du module multijoueur.',
      'Arène à vagues distincte du solo ; définir quatre positions de départ, des voies de secours et des objectifs distribués. Relevé exact de géométrie requis avant reproduction fidèle.',visual=look+'.',
      conditions='Multijoueur uniquement ; Remnant Ruins associé à missions APEX, disponibilité de service non garantie par ce catalogue.',source='MP-ZERO' if key=='ZERO' else 'MP-MAGMA' if key=='MAGMA' else 'MP',
      acceptance='Sélection affiche le mode multi et le bon nom ; objectif, renforts, extraction et reprise de partie fonctionnent sans fuite d’états vers la carte solo.')

c.originals('links','''
GALAXY|Tempest ↔ carte de Heleus|Voyage par système puis destination ; distinguer découverte orbitale, approche et atterrissage, conserver scans déjà faits.|Carte et transition spatiale courte.||zones:TEMPEST-BRIDGE
NEXUS|Tempest ↔ Nexus / Hyperion|Sélecteur de quai et transit de station ; SAM Node reste attaché à Hyperion jusqu’au changement du final.|Plan de station et icône d’arche.||worlds:NEXUS,worlds:HYPERION
HABITAT|Atterrissage → sites de Habitat 7|Branches facultatives vers rescapés puis convergence vers Alec ; sortie finale annoncée avant abandon des recherches.|Carte locale et traces d’équipe.||main_quests:PLANETSIDE
FORWARD|Stations avancées ↔ voyage rapide|Débloquer à découverte et sécurité ; téléportation de confort hors combat seulement, état météo recalculé à arrivée.|Balise et carte de région.||props:FORWARD
NOMAD|Ryder ↔ Nomad|Entrée conserve roster et équipement ; sortie choisit sol sûr et espace pour les trois personnages, interdite dans vide de H-047c.|Portière et points de placement.||worlds:H047C,systems:NOMAD
EOS|Promise → monolithes → caveau → Prodromos|Flux de première implantation avec retours permis avant purification ; restauration et choix de colonie deux étapes distinctes.|Carte à jalons et réseaux reliquats.||main_quests:EOS
AYA|Quai d’Aya ↔ quartiers autorisés|Gates de confiance explicites aux entrées ; aucune barrière invisible sans explication de restriction locale.|Gardes, porte et nom de district.||worlds:AYA
VOELD|Résistance → camp de captifs → installation|Missions de Voeld gardent points d’entrée propres selon ordre Havarl ; secours de la Moshae n’écrase pas les libérations secondaires.|Carte de neige et routes de navette.||zones:VOELD-RESIST,zones:EXALTATION
MITHRAVA|Poste Havarl ↔ Mithrava|Sauts et ascenseurs de ruine à orientation claire ; raccourci de retour proposé après premier parcours réussi.|Plateformes et numéros d’étage.||zones:MITHRAVA
KADARA|Port → bidonville → badlands|Transit vertical et accès Nomad à leur vrai type de zone ; pas de véhicule dans intérieur social.|Ascenseur, sas et terrain ouvert.||zones:KADARA-PORT,zones:KADARA-BADLANDS
ELAADEN|New Tuchanka ↔ épave ↔ caveau|Carte d’exploration reliant objectifs indépendants ; motorcore, restauration et accord de Morda ne fusionnent pas.|Trois icônes d’objectif et routes désertiques.||zones:NEW-TUCHANKA,zones:DERELICT,zones:ELAADEN-VAULT
LEUSINIA|Tempest → arche asari|Confirmer Cora et loadout avant mission ; retour applique rôle de Sarissa/Vederia et suite de relation.|Sas d’arche et tableau d’escouade.||side_quests:CORA-EDGE
LIAM-GRAVITY|Transitions de gravité du vaisseau de Liam|Trois états de carte avec ancres sol recalculées ; ranger sprites, caméra, projectiles et loot avant rotation de scène.|Grue, containers et nouvelle orientation.||zones:LIAM-SHIP
PAS10|Capsule → ruines de Pas-10 → navette|Départ narratif, itinéraire et évacuation ; retour rend l’accès au Tempest sans restaurer l’appareil perdu dans lave.|Capsule, pont et navette.||side_quests:PEEBEE-SIGNAL
ARCHON|Arche galarienne ↔ vaisseau kett|Transitions de groupes de captifs et embranchement final ; point d’engagement sauvegardé avant secours exclusif.|Sas, cellules et deux routes.||main_quests:ARCHON
MERIDIAN|Khi Tasira → véritable Méridiane|Carte et dénomination distinguent découverte du site et destination ; relais du jumeau conserve protagoniste original à retour.|Réseau spatial et trajectoire Hyperion.||worlds:KHI-TASIRA,worlds:MERIDIAN
''')

c.originals('scenery','''
TEMPEST|Kit 3D — Tempest|Modules de cabine, pont et moteur avec toit escamotable ; circulation continue entre conversations, grandes silhouettes sans blocage.|Blanc, verre et éclairage d’exploration.||zones:TEMPEST-CREW
NEXUS|Kit 3D — Nexus incomplet|Sections administratives et structures en chantier ; variantes de population et réparations par progression.|Métal clair, échafaudages et hologrammes.||worlds:NEXUS
HYPERION|Kit 3D — arche humaine|Cryostase répétable sans tous pods interactifs ; passerelle et SAM Node à identité propre.|Volumes blancs, brume et lumière bleue.||worlds:HYPERION
HABITAT|Kit 3D — Habitat 7|Rochers, sol brisé et tours avec flottements décoratifs ; masque de collision clairement séparé de débris en vol.|Noir, rouge de ciel et éclairs.||worlds:HABITAT7
EOS|Kit 3D — Eos|Mesas, préfabriqués et dunes ; routes Nomad larges, couvert ATB local défini dans arènes de pied.|Sable orange et blanc Initiative.||worlds:EOS
AYA|Kit 3D — Aya|Terrasses, canaux et marché sous cascade ; volumes de foule et stands permettent lecture de portraits.|Végétation, textile et architecture angara.||worlds:AYA
VOELD|Kit 3D — Voeld|Neige, grottes et bases ; surfaces bleues glissantes décoratives ne deviennent pas mécaniques sans règle annoncée.|Glace cyan, abris chauds et ciel froid.||worlds:VOELD
HAVARL|Kit 3D — Havarl|Forêt dense à étages, lianes et reliquats ; transparence de feuillage proche caméra sans disparition des indices.|Vert, magenta et lumière de ruine.||worlds:HAVARL
KADARA|Kit 3D — Kadara|Roches multicolores, port et bassins ; eau dangereuse bordée par forme/texture, pas couleur seule.|Orange, violet et reflets acides.||worlds:KADARA
ELAADEN|Kit 3D — Elaaden|Dunes claires, gigantesque épave et colonie ; ombres jouables cohérentes avec protection contre chaleur proposée.|Sable pâle et métal de récupération.||worlds:ELAADEN
H047C|Kit 3D — H-047c|Fragments, dômes et mine ; horizon spatial et rochers de fond ne créent pas de fausse plateforme praticable.|Vide noir et minéraux lumineux.||worlds:H047C
KETT|Kit 3D — architecture kett|Parois organiques modulaires, prisons et laboratoire ; système de portes clairement distinct des consoles reliquates.|Os, vert sourd et lumière clinique.||zones:KETT-FLAGSHIP
REMNANT|Kit 3D — caveaux reliquats|Piliers noirs, dalles mobiles, portes et lignes d’énergie ; chaque pièce fonctionne à plusieurs orientations de caméra.|Noir poli et turquoise géométrique.||lore:VAULTS
MERIDIAN|Kit 3D — Méridiane|Intérieur habitable et réseau monumental ; final technique puis épilogue verdoyant en cartes distinctes.|Lumière intérieure, eau et architecture géante.||worlds:MERIDIAN
''')

c.originals('props','''
SCANNER|Scanner du Pionnier|Mode d’observation avec silhouette de cible, catégorie de données et statut déjà scanné ; grandes zones interactives accessibles.|Cadre orange et nom lisible.||systems:SCAN
FORWARD|Station avancée|Déploiement, repos et loadout en interactions séparées ; ne pas consommer ressource en consultant la carte.|Balise Initiative et modules déployés.||systems:FORWARD
MONOLITH|Monolithe reliquat|États inactif, glyphes acquis, puzzle résolu et réseau ouvert ; aucun simple clic ne saute une étape sans option explicite.|Piliers et lignes d’énergie.||systems:PUZZLES
GLYPH|Glyphe à scanner|Surface assez large pour pointage et alternative de liste ; identifiant unique de découverte et symbole indépendant de couleur.|Symbole géométrique sur pierre.||systems:PUZZLES
VAULT-CONSOLE|Console de caveau|Interface avec effet visible sur porte, champ ou machine ; afficher conséquence d’interaction avant déclenchement de purification.|Pupitre noir et hologramme turquoise.||systems:VAULTS
PURIFICATION|Champ de purification|Danger de déplacement avec front lisible et compte à rebours facultatif proposé ; route de sortie pas dissimulée derrière sprite géant.|Mur d’énergie et sol de fuite.||systems:VAULTS
LIFE-SUPPORT|Indicateur de survie|Radiation, froid, chaleur et vide ont noms et symboles propres ; avertissement gradué sans répétition vocale constante.|Jauge de combinaison et icône de danger.||systems:HAZARDS
MINING|Gisement et drone minier|Scanner de zone et extraction avec aperçu ; inventaire confirme quantité du fan game, aucun forage d’un gisement déjà vide.|Sonde, minerai et carte d’intensité.||systems:RESEARCH
MEMORY|Déclencheur de mémoire d’Alec|Objet de collecte à silhouette distincte des données reliquates ; débloque seuil d’archive sans jouer mémoire sur place par accident.|Halo de mémoire et progression SAM.||side_quests:FAMILY
CRYO-POD|Pod de cryostase|Personne, statut et autorisation de réveil séparés ; enregistrements Ellen restent cachés avant révélation familiale.|Capsule vitrée et étiquette.||choices:ELLEN
SEED-VAULT|Banque de graines krogan|Objet central du transport ; visualiser conservation et chargement, pas un sac de loot pouvant être vendu.|Serre, capsules de semences et éclairage doux.||side_quests:DRACK-FUTURE
DRIVE-CORE|Cœur de propulsion reliquat|Inventaire de quête unique, transfert de possession explicite vers Morda ou Initiative ; objet retiré une seule fois.|Noyau lumineux en support.||choices:CORE
SID-CAMERA|Caméra de sécurité de Sid|Prévisualiser salle, danger et sabotage possible ; choix verrouille dispositif exact avant entrée du groupe.|Écran quadrillé et cibles nommées.||choices:SID
EXALT-POD|Capsule d’exaltation|États prisonnier/libéré/vide séparés ; scan fournit découverte sans effacer l’action de secours.|Cuve kett et silhouette angara.||choices:MOSHAE
ASCENDANT-ORB|Orbe d’Ascendant|Cible orbitale distincte avec chemin prévisible ; protection du porteur réagit au vrai état de l’orbe.|Sphère lumineuse et lien de champ.||enemies:ASCENDANT
ARCHITECT-NODES|Membres et tête d’Architecte|Sous-cibles à barres séparées, repères projetés au sol ; ouverture de tête annoncée et durée suffisante pour décision ATB.|Noyaux rouge/turquoise et attaches massives.||enemies:ARCHITECT
MOVIE-KIT|Écran et installation de soirée film|Chaque objet de la chaîne trouve une place et confirme préparation ; version complète rassemble les sièges sans chevauchement.|Écran, enceintes et nourriture.||side_quests:MOVIE
QUARIAN-SIGNAL|Terminal du signal quarien|Lecture unique mémorisée puis replay autorisé ; aucune flèche vers une mission solo inexistante.|Signal codé et étiquette Keelah Si’yah.||npcs:RYNN
''')

c.originals('dialogues','''
SAM|Conseils et analyses de SAM|Répliques originales courtes selon découverte ; espacer alertes de danger déjà connus et afficher source d’information.|Sous-titres avec nom SAM.||npcs:SAM
LEADERS|Entretiens de direction du Nexus|Chaque responsable a son domaine, ses preuves et décisions ; dialogue de rapport distinct d’une autorisation politique.|Quatre portraits et bureaux.||npcs:TANN,npcs:ADDISON,npcs:KANDROS,npcs:KESH
FIRST-CONTACT|Premier contact angara|Restrictions, curiosité et négociation progressives ; pas d’exposition de toute la culture au premier entretien.|Aya et cadrages d’interlocuteurs.||main_quests:AYA
MOSHAE|Débrief du secours de la Moshae|Écrire réactions selon site/captifs/Cardinal ; la colère éventuelle reste compatible avec suite de mission, sans softlock d’autorisation.|Moshae et Evfra après secours.||choices:MOSHAE,choices:CARDINAL
CORA|Cora face à Sarissa|Échange sur confiance et devoir après découverte du journal ; révélation publique et nomination séparées dans roue de dialogue.|Passerelle Leusinia et portraits.||choices:SARISSA-TRUTH,choices:SARISSA-ROLE
JAAL|Jaal et sa famille|Identifier chaque locuteur et point de vue ; silence de Ryder au moment de confiance doit être reconnu comme action.|Village angara et groupe familial.||choices:AKKSUL
DRACK|Drack, avenir et Spender|Différencier rancœur institutionnelle, graines et protection de Vorn ; accusation finale appuyée par dossier réellement obtenu.|Serre puis bureau Nexus.||side_quests:DRACK-FUTURE,choices:SPENDER
VETRA|Vetra et Sid après le piège|Réactions selon aides de Sid et choix de protection ; relation sororale n’est pas un simple niveau de loyauté.|Communication privée et cabine turienne.||side_quests:VETRA-MEANS
PEEBEE|Peebee après Kalinda|Deux conversations selon perte ou survie, gratitude et doute distincts ; éviter même ligne de regret dans les deux branches.|Capsule et objet retrouvé ou absent.||choices:KALINDA
LIAM|Liam et responsabilité de l’échange|Débrief distingue initiative risquée, contact secouru et décision de détention ; options de ton ne changent pas les faits.|Tempest après vaisseau de Calot.||choices:VERAND
FAMILY|Ryder et souvenirs familiaux|Répliques de découverte accessibles après mémoire complète, logs et rencontre du jumeau ; aucune identité de Bienfaiteur inventée.|SAM Node et pod familial.||side_quests:FAMILY
EPILOGUE|Retrouvailles et nomination finale|Interlocuteurs selon survie et fonctions ; marquer conversations requises avant départ tout en gardant rencontres facultatives.|Port Meridian et fête.||main_quests:EPILOGUE
''')

c.originals('cinematics','''
WAKE|Réveil de Ryder|Découper réveil, rencontre et alerte de l’arche ; skip conserve personnalisation et flags du tutoriel.|Cryostase et visage de Ryder.||main_quests:HYPERION
ALEC|Transmission du rôle de Pionnier|Scène de Habitat 7 avec échange vital et conséquence finale ; input de joueur ne doit pas prétendre sauver Alec par un QTE inventé.|Casques, orage et main tendue.||main_quests:PLANETSIDE
FIRST-VAULT|Première purification d’Eos|Activation, découverte d’échelle puis fuite ; caméra de contrôle revient sur axe de sortie et non derrière un obstacle.|Lumière turquoise et grande salle.||main_quests:EOS
AYA|Arrivée sur Aya|Dévoiler cascade, ville et accueil prudent ; les zones restreintes sont montrées avant reprise de déplacement.|Tempest et terrasse angara.||main_quests:AYA
EXALTATION|Révélation de l’exaltation|Insister sur découverte et réaction d’équipe avec imagerie contenue ; connaissances de codex écrites une fois après scène.|Capsules et ombres kett.||main_quests:MOSHAE
ARCHON|Piège de l’Archonte|États de capture, SAM et sortie cohérents après skip ; effets de perte de contrôle annoncés comme narration.|Laboratoire kett et Ryder immobilisé.||main_quests:ARCHON
GRAVITY|Gravité du vaisseau de Liam|Rotation cinématique puis carte dans nouvel axe ; alternative à faible mouvement par fondu vers état stable.|Containers, murs et grues réorientés.||side_quests:LIAM-ALLIN
KALINDA|Choix au-dessus de lave|Cadre montrant appareil et Kalinda avant interruption ; mode non chronométré conserve même décision et même résultat.|Plateforme instable et lave.||choices:KALINDA
TWIN|Relais du jumeau Ryder|Changement temporaire de personnage jouable signalé ; interface et équipement propres puis restitution au bon Ryder.|Hyperion attaqué et deuxième portrait.||main_quests:MERIDIAN
HYPERION|Atterrissage de l’Hyperion|Montage des Pionniers disponibles puis branche Dunn ; ne pas montrer une aide absente pour recycler un plan.|Arche en descente et communications.||choices:DUNN
FINAL|Libération du réseau de Méridiane|Dernier relais, rupture du contrôle et retour du groupe ; victoire par objectifs, pas simple barre de vie de l’Archonte.|Machine géante et lumière du réseau.||enemies:ARCHON-FINAL
HOME|Port Meridian et avenir ouvert|Scène d’équipage avec ambassadeur, jumeau et signal quarien aux étapes requises ; aucun teaser transformé en mission développée.|Nature, arche posée et fête.||main_quests:EPILOGUE,props:QUARIAN-SIGNAL
''')

c.originals('animations','''
JUMP|Saut et propulseurs de Ryder|Anticipation, montée, vol bref et atterrissage ; ombre au sol et position ciblable restent distinctes de hauteur visuelle.|Traînées de propulseur et sprite aérien.||systems:VERTICAL
HOVER|Visée en suspension|Pose stable pendant fenêtre de visée, chute après durée ; impacts ne figent pas indéfiniment Ryder dans l’air.|Inclinaison du corps et petites corrections de jet.||systems:VERTICAL
DASH|Esquive latérale|Déplacement de courte portée à destination réservée ; annulation si plafond ou bord de carte bloque le trajet.|Traînée et fantôme de destination.||systems:VERTICAL
COVER|Couvert automatique adapté|Entrée/sortie déclenchée par contexte visible ; en ATB, le joueur sait si l’action conserve son couvert.|Pose basse et changement d’épaule.||systems:COVER
SCAN|Pose de scanner|Bras et regard sur cible, sortie immédiate vers danger ; lire un objet ne déclenche pas une animation d’attaque.|Omni-outil ouvert et balayage.||props:SCANNER
BIOTIC|Gestuelle biotique MEA|Mains, déplacement et corps alignés au pouvoir ; distinguer charge physique de simple projectile.|Halo violet et poses dynamiques.||powers:CHARGE,powers:THROW
TECH|Gestuelle technique|Activation d’omni-outil au bon bras, arme tenue sans duplication ; effet naît à l’événement de résolution.|Interface orange segmentée.||powers:INCINERATE
MELEE|Familles de mêlée|Dague, épée, marteau et gantelet ont préparations et zones distinctes ; même arme ne change pas arbitrairement de main entre orientations.|Arcs de lame, marteau et poing.||weapons:ASARI-SWORD,weapons:KROGAN-HAMMER
NOMAD|Entrée, sortie et roues du Nomad|Poser équipiers sur cellules sûres, roues suivent relief ; mode tout-terrain a état visuel distinct sans inventer arme embarquée.|Six roues, suspension et portières.||systems:NOMAD
CORA|Cora — protection et impact|Séparer Charge, Nova et Shield Boost en silhouettes lisibles ; phase de secours n’a pas la posture offensive d’une frappe.|Fente, choc et mains protectrices.||characters:CORA
DRACK|Drack — poids et prothèses|Pas lourds, charge courte et Flak Cannon ; asymétries d’armure/prothèses ne sont pas retournées par miroir paresseux.|Carapace large et démarche ancienne.||characters:DRACK
JAAL|Jaal — tir et repli|Appuis de tireur, voile et retour d’Avenger Strike ; conserver manteau et arme hors du volume des alliés.|Manteau, épaule et silhouette angara.||characters:JAAL
ASCENDANT|Ascendant — orbe et vulnérabilité|Orbite cohérente avec collision, rupture de champ puis pose exposée ; pas de sphère restant invincible après fin de phase.|Corps flottant et orbe distinct.||enemies:ASCENDANT
ARCHITECT|Architecte — déplacement monumental|Plier membres, déplacer corps puis rouvrir tête ; point ciblable au sol suit la bonne sous-partie sans chevaucher l’UI.|Grandes pattes et noyau facial.||enemies:ARCHITECT
FACE|Expressions de dialogue|Jeu de bouches et regard adaptés aux espèces, pauses naturelles ; les choix de ton ont expressions sobres sans grimace fixe réutilisée.|Bustes et portraits originaux.||dialogues:FAMILY
GRAVITY|Repositionnement après rotation|Transformer pivots et axes des acteurs pendant transition de Liam ; reprise en pose stable sans glisser le long d’un ancien mur.|Sprites ancrés au nouveau sol.||links:LIAM-GRAVITY
''')

c.originals('vfx','''
JET|Propulseurs et déplacement|Traînée courte sans cacher ligne d’attaque ennemie ; intensité réglable et retours au sol visibles.|Gaz bleu et ombre nette.||animations:JUMP
SCAN|Contours de scanner|Objet utile, déjà lu et pure décoration ont états distincts ; format texte accessible en plus de couleur.|Orange, trame et nom de cible.||props:SCANNER
SCOURGE|Filaments du Fléau|Effet spatial en fond et danger narratif ; ne pas créer projectiles évitables là où scène ne donne aucun contrôle.|Noir, violets et éclairs étirés.||lore:SCOURGE
HAZARDS|Radiation, froid, chaleur et vide|Quatre motifs et mots, vignette limitée ; danger local se lit avant barre critique et sans déformation agressive.|Icônes de combinaison et bord d’écran discret.||systems:HAZARDS
SHIELD|Protection et armure|Bouclier, santé et armure de cible ne se confondent pas avec les pièces d’armure équipées de Ryder.|Barres et motifs segmentés.||systems:DEFENSES
COMBOS|Amorces et détonations|Familles feu/glace/tech/biotique distinctes ; afficher la compatibilité avant ordre et une seule onde par combo résolu.|Pictogrammes et cercles d’impact.||systems:COMBOS
ANNIHILATION|Aura portée par Ryder|Rayon précis sur sol, hauteur de sprite non prise pour portée ; luminosité plafonnée à plusieurs auras.|Anneau violet et particules de bord.||powers:ANNIHILATION
BACKLASH|Réflexion de Backlash|Panneau frontal avec normal visible ; projectile renvoyé change direction et faction à l’événement exact.|Plan courbe et ricochet lumineux.||powers:BACKLASH
ORB|Orbe et champ d’Ascendant|Lien visible entre sphère et protection ; changement d’état signalé par forme, pas seulement teinte.|Orbite et champ concentrique.||props:ASCENDANT-ORB
ARCHITECT|Signaux d’Architecte|Zones de salve, balayage et renfort annoncées ; tête vulnérable garde signal même derrière son corps géant.|Bandes au sol et noyau pulsant.||props:ARCHITECT-NODES
PURIFY|Purification de caveau|Front de danger homogène, flèches de sortie et alternative de faible mouvement ; effet ne traverse pas une porte fermée sans règle.|Mur d’énergie et piste de course.||props:PURIFICATION
RESTORE|Avant/après restauration|Couches d’environnement par état de planète ; changement cohérent mais progressif, sans promettre pluie immédiate partout.|Nuages, végétation et eaux selon monde.||choices:RESTORE
GRAVITY|Transition de gravité|Particules et éclairages réorientés pendant fondus ; repère d’horizon revient avant la première commande jouable.|Débris flottants et balises de sol.||links:LIAM-GRAVITY
MINE-GAS|Gaz de sabotage de Sid|Volume dangereux avec limites, durée/état permanent affiché ; ne pas faire disparaître le danger après une simple entrée/sortie de caméra.|Brume verte et symbole toxique.||choices:SID
''')

c.originals('audio','''
TEMPEST|Ambiance du Tempest|Moteur doux, consoles et vie d’équipage ; prioriser conversation active et différencier alertes de SAM des barks ordinaires.|Sous-titres avec source et nom.||zones:TEMPEST-BRIDGE
SAM|Voix originale de l’assistant SAM|Répliques brèves et répétition contrôlée ; choix de fréquence des conseils, aucun signal essentiel seulement sonore.|Journal des dernières analyses.||dialogues:SAM
NEXUS|Ambiance du Nexus|Outils, foule et annonces selon progression ; déclarations importantes du HNS sous-titrées, ambiances fictives clairement non informatives.|Haut-parleurs et marqueur de bulletin.||worlds:NEXUS
HABITAT|Orages de Habitat 7|Tonnerre à différentes distances, éclair avant impact annoncé ; mode basses réduites sans perdre la menace.|Flash limité et zone de frappe.||worlds:HABITAT7
ANGARA|Identité sonore angara|Créer langues d’ambiance et instruments originaux sans copier dialogues ; sous-titres pour les informations de quête uniquement.|Sources locales au marché et sanctuaire.||worlds:AYA
VOELD|Vent et froid de Voeld|Souffle de vent, pas neige et abris ; signal de danger thermique rare et clair, pas spam à chaque seuil oscillant.|Icône de froid et passage en chaleur.||worlds:VOELD
HAVARL|Faune et jungle Havarl|Couches animales et végétales originales ; signal de créature hostile distinct de chant de fond non menaçant.|Marqueur de danger hors champ.||worlds:HAVARL
KETT|Machines et voix kett|Timbres organiques/industriels ; conserver intelligibilité des ordres ennemis utiles sans besoin de comprendre mots fictifs.|Pictogrammes de charge et renfort.||enemies:ASCENDANT
REMNANT|Résonance des Reliquats|Motifs de machine par famille, tonalité d’activation de console distincte de tir ; puzzle a validation visuelle équivalente.|Formes et lueurs synchronisées.||lore:REMNANT
NOMAD|Moteur et relief du Nomad|Son de traction, boost et réception selon contact réel ; pas de moteur de vaisseau sur sortie de dôme.|Indicateur de mode et patinage.||systems:NOMAD
LOYALTY|Musique originale des loyautés|Six palettes propres aux missions : arche, gravité, famille, graines, mine et volcan ; transitions par phase du récit.|Nom de scène et intensité modulable.||side_quests:CORA-EDGE,side_quests:LIAM-ALLIN
MERIDIAN|Final et retour au calme|Composition originale de tension puis ouverture ; montage selon alliés disponibles et volume de communication prioritaire.|Sous-titres de renforts et d’épilogue.||main_quests:MERIDIAN,main_quests:EPILOGUE
''')

c.originals('systems','''
ATB|ATB hybride d’exploration mobile|Actions à préparation/résolution/récupération, deux équipiers et Ryder ; déplacement vertical consomme le coût proposé sans figer les ennemis hors règle de pause.|Chronologie courte, portraits et chemins.||characters:RYDER
VERTICAL|Saut, vol bref et sol cible|Séparer altitude visuelle, position au sol et collision ; tout bond réserve destination et teste plafond, pente et espace d’allié.|Projection au sol et marque de réception.||characters:RYDER
COVER|Couvert contextualisé|Détecter orientation et hauteur du couvert, montrer protection réelle avant tir ; couverts de décor 3D taggés indépendamment des textures.|Bords de couvert et flanc exposé.||scenery:KETT
FAVORITES|Favoris de compétences|Trois actions par favori, profils et récupération annoncée au changement ; aucun reset exploitable en changeant d’onglet.|Barre de trois slots et profil actif.||powers:CHARGE,powers:OVERLOAD
PROFILES|Sept profils de Ryder|Soldier, Engineer, Adept, Sentinel, Vanguard, Infiltrator, Explorer ; déblocages par investissement, bonus et rangs vérifiés séparément des propositions ATB.|Sept emblèmes et résumé de rôle.||systems:FAVORITES
SKILL-TREE|Compétences actives et passives|Arbres de combat, tech et biotique ; passifs exclus de la barre d’action, compétences d’alliés dans tables propres.|Arbre à trois familles et bifurcations.||powers:BARRIER,powers:TEAM-SUPPORT
LOYALTY|Loyauté et progression de compagnon|Déverrouillage des rangs avancés après mission propre ; aucune matrice de survie de suicide mission ME2 importée.|Portrait, mission et rang accessible.||side_quests:CORA-EDGE,side_quests:DRACK-FUTURE
DEFENSES|Protections et contrôle|Table santé/bouclier/armure, immunités par unité ; l’armure portée de Ryder n’est pas une barre jaune de créature.|Barres nommées et aperçu d’effet.||enemies:ANCIENT-EIROCH
COMBOS|Amorces, détonateurs et propagation|Compatibilités définies et nombre de transmissions borné ; les primings du familier et de l’allié ont source affichée.|Icônes d’amorce et lien de combo.||powers:INCINERATE,powers:LANCE
SCAN|Scanner et données de recherche|Cibles de lore, indices de quête et données techniques séparées ; rescan relit mais ne recrée pas récompense.|Carte de cible et catégorie de données.||systems:RESEARCH
RESEARCH|Recherche puis développement|Points Voie lactée/Heleus/Reliquat séparés des matériaux ; plan débloqué ne consomme pas les ressources de fabrication.|Deux écrans reliés, coûts visibles.||equipment:AUGMENT
CRAFT|Fabrication, augmentations et mods|Augmentations choisies à création, mods équipables ensuite, fusion sur torse compatible ; aperçu global et démontage versionné.|Recette, emplacements et récapitulatif.||equipment:FUSION,equipment:WEAPON-MODS
NOMAD|Nomad d’exploration|Six roues, modes de traction et boost ; véhicule sans arme ajoutée comme fait canon, transition pied seulement sur sol admissible.|HUD de véhicule et état de survie.||equipment:NOMAD-UPGRADES
FORWARD|Stations avancées et préparation|Déploiement unique, réapprovisionnement et voyage ; conditions hors combat et dangers testées avant servir de refuge.|Balise et menu de services.||systems:NOMAD
HAZARDS|Survie environnementale par monde|Eos radiation, Voeld froid, Elaaden chaleur, Kadara eau dangereuse, H-047c vide ; Havarl n’a pas de jauge de poison ambiant globale inventée.|Jauge, type et niveau local.||worlds:EOS,worlds:H047C
PUZZLES|Glyphes et décryptage reliquat|Grille à contraintes, vérification locale et option d’aide explicite ; symboles jamais réduits à couleurs et solution persistée après chargement.|Grille, symboles et règle lisible.||lore:REMNANT
VAULTS|Caveaux et purification|Graphe consoles/portes/énergie, objectif de restauration et course finale ; activer une console ne téléporte pas le groupe hors carte.|Carte de circuit et voie de sortie.||lore:VAULTS
VIABILITY|Viabilité et implantation|Score d’exploration distinct de caveau, négociation et fondation ; toutes contributions indiquent provenance et ne se comptent qu’une fois.|Tableau planétaire et critères d’avant-poste.||choices:RESTORE
AVP|AVP et réveil des spécialistes|Points globaux, catégorie de spécialiste et bonus proposés séparés ; pas de membre de squad généré par sélection d’un perk.|Pods et liste de spécialistes.||main_quests:AVP
JOURNAL|Journal à catégories conditionnelles|Priority Ops, Allies and Relationships, Heleus Assignments, Additional Tasks ; même mission Havarl/Voeld conserve ID malgré changement de catégorie.|Filtres, étapes et état En attente.||main_quests:RESISTANCE,main_quests:HAVARL
RELATIONS|Relations et version de dialogue|Partenaire, Ryder, patch, exclusivité et scène vue ont variables séparées ; table 1.08 traite Jaal/Scott sans réécrire arbitrairement tous les partenaires.|Fiche de relation et message d’engagement.||choices:ROMANCE
STRIKE|Strike Teams et missions APEX|Envoyer équipe abstraite ou choisir mission coop admissible ; services multi facultatifs et récompenses réclamées une seule fois.|Table des équipes et rapport de mission.||main_quests:FIRST-STRIKE
MP-ROSTER|Roster et progression multijoueurs|Classes spécifiques, équipements, Prestige et Veteran Bonus restent dans sauvegarde multi ; pas de rang vétéran ajouté au build solo de Ryder.|Sélecteur de classe et badge APEX.|Multijoueur uniquement.|characters:MP-HUMAN-KINETICIST
MP-WAVES|Coopératif à vagues|Objectifs, réanimation et extraction ; synchronisation ATB coop est une adaptation expérimentale à spécifier, aucune promesse réseau déjà développée.|Quatre portraits et phase de vague.|Multijoueur uniquement.|zones:MP-ZERO
MP-SKILLS|Compétences propres au multijoueur|Warp, Tech Armor, Stealth Grid et autres options vérifiées au roster ; aucune importation automatique dans les 36 compétences solo.|Badge multi sur fiche de compétence.|Multijoueur uniquement.|systems:MP-ROSTER
SAVE|Sauvegardes et grands choix|Snapshots avant loyauté, choix de secours et final proposés ; progression de terrain, mutations de décor et inventaire atomiques.|Emplacements nommés et résumé d’état.||choices:RAEKA,choices:DUNN
ACCESS|Options d’accès|Sous-titres, texte d’indices, formes de danger, maintien/toggle et réduction de mouvement ; fenêtres d’interruption non chronométrées proposées.|Panneau de réglages avec démonstrations.||choices:KALINDA
''')

# Appuis documentaires explicites pour les règles de versions et les distinctions de modes.
for e in c.entries:
    if e['id']=='MEA-SYS-PROFILES':e['sourceIds']=['MEA-SRC-PROFILES'];e['reference']='Profiles — index des profils MEA'
    if e['id']=='MEA-SYS-LOYALTY':e['sourceIds']=['MEA-SRC-LOYALTY','MEA-SRC-SKILLS']
    if e['id']=='MEA-SYS-HAZARDS':e['sourceIds']=['MEA-SRC-HAZARD']
    if e['id']=='MEA-SYS-RELATIONS':e['sourceIds']=['MEA-SRC-ROMANCE','MEA-SRC-BW-108']
    if e['id'] in ('MEA-SYS-STRIKE','MEA-SYS-MP-ROSTER','MEA-SYS-MP-WAVES','MEA-SYS-MP-SKILLS'):e['sourceIds']=['MEA-SRC-MP','MEA-SRC-MANUAL']

c.originals('qa','''
RYDER|QA — identité des jumeaux|Tester Sara et Scott, apparences personnalisées et relais final ; portraits, noms, voix et retour au protagoniste cohérents.|Deux parcours de sauvegarde.||choices:RYDER
ORDER|QA — ordre Havarl/Voeld|Jouer chaque ordre, puis parcours partiellement engagé ; mission possède un seul état et la bonne catégorie, jamais deux récompenses ni blocage de A Trail of Hope.|Table de missions et journal comparé.||systems:JOURNAL
EOS|QA — première implantation|Tester monolithes dans ordres différents, sauvegarde dans caveau, restauration puis chaque type d’avant-poste ; Prodromos reflète le choix après retour.|Carte et versions de colonie.||main_quests:EOS,choices:EOS
VAULTS|QA — caveaux et purification|Pour chaque monde : alimentation, grille, portes, cache optionnelle et fuite ; un groupe retardataire suit sans rester condamné derrière porte fermée.|Parcours par caveau et route de sortie.||systems:VAULTS
HAZARD|QA — dangers locaux|Tester passage ombre/soleil Elaaden, eau/terre Kadara, chaleur/froid Voeld et dôme/vide H-047c ; absence de faux poison global Havarl.|Scènes de seuil et états de jauge.||systems:HAZARDS
NOMAD|QA — Nomad et terrain|Tester pente, boost, eau, bord de dôme et sortie avec grandes silhouettes ; pas de spawn d’allié dans vide ou intérieur de roue.|Routes de contrôle et emplacements de sortie.||systems:NOMAD
SCAN|QA — scans et collections|Scanner deux fois, recharger puis revenir après restauration ; données et objets uniques récompensés une fois, lore toujours relisible.|Journal de scans et inventaire.||systems:SCAN
CRAFT|QA — fabrication et augmentation|Séparer recherche et développement ; tester matériaux insuffisants, annulation, mod incompatible, fusion interdite et démontage sans duplication.|Table de recettes et comparatif d’inventaire.||systems:CRAFT
SKILLS|QA — favoris et compétences|Tester chaque type actif/passif, changement de favori en récupération et respec ; aucun cooldown remis à zéro ni pouvoir d’allié débloqué chez Ryder.|Arène de compétences et arbre.||systems:FAVORITES,systems:SKILL-TREE
COMBOS|QA — protections et combos|Tester santé, armure, bouclier, immunités puis propagation ; aperçu et effet concordent, dégâts et amorce résolus une fois.|Mannequins et journal d’événements.||systems:COMBOS,systems:DEFENSES
CORA|QA — arche asari|Croiser révélation de Sarissa et choix de Pionnière ; Cora conserve progression, bonne Pionnière apparaît au final et dialogues ne supposent pas divulgation absente.|Table de branches Leusinia.||choices:SARISSA-TRUTH,choices:SARISSA-ROLE
LIAM|QA — gravité et captivité|Chaque orientation de vaisseau : pivots, caméra, loot et scanner ; captifs évacués une fois, débrief Verand ne force pas rupture non attestée.|Trois scènes d’orientation et état final.||side_quests:LIAM-ALLIN
VETRA|QA — caméras et dangers|Tester chaque option de Sid par salle, aucune action et reprise ; gaz, Hydra, grues et ennemis doivent refléter l’option choisie.|Moniteur puis capture de salle jouée.||choices:SID
DRACK|QA — graines et verdict|Sauver Vorn, sécuriser transport, puis prison/exil de Spender ; déblocage de loyauté et clôture administrative ne se confondent pas.|Journal de mission et roster de compétences.||side_quests:DRACK-FUTURE
JAAL|QA — Akksul et confiance|Tir, absence de tir et mode non chronométré ; acteurs visés corrects, conséquences de blessure/mort cohérentes, loyauté ne déclenche pas romance automatique.|Captures de confrontation et bilan.||choices:AKKSUL
PEEBEE|QA — appareil et Kalinda|Deux branches exclusives : appareil récupéré avec mort ou Kalinda sauvée avec appareil perdu ; fuite et retours de mission conservent le bon inventaire.|Plateforme, objet et messages postmission.||choices:KALINDA
ARKS|QA — secours galarien et succession turienne|Choisir Raeka ou scouts, Avitus convaincu ou non ; roster de Pionniers et réactions de Drack reflètent ces deux axes indépendants.|Matrice de quatre fonctions.||choices:RAEKA,choices:AVITUS
POLITICS|QA — Kadara et Elaaden|Tester changements de régime, moteur gardé/donné, retours aux hubs et fondation ; aucun ancien chef mort ne donne une quête ni accord absent ne valide colonie.|Cartes politiques avant/après.||choices:SLOANE-REYES,choices:CORE
ANCIENT-AI|QA — IA, otage et destination|Trois issues : IA détruite, conservée chez SAM, confiée aux angara ; otage, terminal, message et soutien final cohérents, aucune duplication de l’IA.|Table des trois branches.||choices:AI-LIFE,choices:AI-OWNER
FAMILY|QA — souvenirs de Ryder|Trouver déclencheurs dans ordre variable, lire logs puis dernière mémoire ; Ellen, Garson et Bienfaiteur se révèlent seulement au bon état, jumeau visible à scène requise.|Index des mémoires et scènes.||side_quests:FAMILY
ROMANCE|QA — partenaires et patch|Tester Sara/Scott avec profil 1.08+, relations exclusives et non exclusives selon table vérifiée ; Jaal/Scott disponible sans copier conditions de lancement.|Matrice de relation par version.||systems:RELATIONS
DUNN|QA — final Hyperion|Matrice des Pionniers réellement disponibles, identité des remplaçants et Avitus ; brancher survie de Dunn et communications sans acteur absent.|Table de secours et montage d’atterrissage.||choices:DUNN
FINAL|QA — Archonte et épilogue|Objectifs de réseau terminent combat, jumeau revient au bon rôle, ambassadeur appartient à liste valide et signal quarien ne crée pas de mission fictive.|Journal final et scène Port Meridian.||main_quests:MERIDIAN,main_quests:EPILOGUE
MP|QA — séparation APEX / solo|Échec de connexion, désactivation du multi, récompense déjà réclamée et classe batarienne ; campagne reste jouable, aucune classe multi ajoutée à Tempest.|Deux sauvegardes et écrans de mode.||systems:STRIKE,systems:MP-ROSTER
DEPTH|QA — sprites et décors 3D|Tester hauteurs, couverts, caméra sous plafond et boss géant ; pivot au sol, masque de profondeur et sélection des sous-cibles restent stables.|Arène d’essai de reliefs.||systems:VERTICAL,props:ARCHITECT-NODES
ACCESS|QA — lecture des dangers|Parcours sans son, sans couleur et à faible mouvement ; scan, glyphes, saut, orbe et purification conservent signaux nécessaires.|Captures des modes accessibles.||systems:ACCESS
''')

c.originals('continuity','''
TRILOGY|Continuité — trilogie et Andromeda|Chronologie de départ et d’arrivée distincte des choix de fin ME3 ; aucune importation de fin rouge/bleue/verte comme vérité du récit d’Andromeda.|Deux frises de galaxies et événements.||lore:INITIATIVE
INITIATIVE|Continuité — Nexus Uprising|Événements du Nexus et départ des exilés renvoient au roman dans son propre catalogue ; pas d’invention de participation de Ryder avant réveil.|Bibliographie liée à lore d’exilés.||lore:EXILES
INITIATION|Continuité — Cora et SAM|Le roman Initiation éclaire un passé distinct ; les pouvoirs et missions du jeu restent définis par leur propre version.|Dossier de Cora et références de période.||characters:CORA
ANNIHILATION|Continuité — Keelah Si’yah|Roman Annihilation traité séparément ; signal d’épilogue reste un appel non résolu par une extension solo supposée.|Lien bibliographique et archive radio.||lore:QUARIAN
DLC|Continuité — absence de DLC solo publié|Le message BioWare de 2017 annonce fin du suivi solo après 1.10 ; aucune mission d’arche quarienne, monde ou compagnon additionnel fictif ne remplit le catalogue.|Notice de périmètre des extensions.||props:QUARIAN-SIGNAL
PATCH108|Continuité — patch 1.08|Jaal/Scott, personnalisation et ajustements de dialogue ont une version ; conserver règles choisies dans sauvegarde et fiches de relation.|Badge de patch et journal de variation.||systems:RELATIONS,npcs:HAINLY
PATCH110|Continuité — patch et bugs|Corrections de dialogue/sauvegarde servent à définir scénarios QA ; aucun bug de lancement reproduit comme caractéristique voulue de l’adaptation.|Table d’écarts de version.||systems:SAVE
ROSTER|Continuité — six équipiers de Tempest|Cora, Liam, Vetra, Jaal, Drack et Peebee restent groupe permanent ; Alec prologue, jumeau temporaire et classes APEX ont des portées distinctes.|Roster avec raisons de présence.||characters:ALEC,npcs:TWIN
PATHFINDERS|Continuité — fonctions et personnes|Raeka/Hayjer, Sarissa/Vederia et Avitus/Macen ; un rôle vacant n’est pas rempli par substitution automatique non choisie.|Matrice des postes et survivants.||choices:DUNN
COLONIES|Continuité — restauration et accords|Caveau, danger, viabilité et fondation suivent quatre axes ; politique de Kadara/Elaaden reste visible après final.|Carte avant/après avec états.||systems:VIABILITY
FAMILY|Continuité — mystères familiaux|Révélation d’Ellen est un fait conditionnel découvert ; identité du Bienfaiteur et suite du projet ne sont pas résolues par le fan game comme canon.|Dossier de connaissances acquises.||side_quests:FAMILY
LOYALTY|Continuité — sens de la loyauté|Les missions débloquent progression et scènes ; ne pas copier la sélection de spécialistes et la mortalité de la suicide mission ME2.|Comparaison des systèmes sans import de règle.||systems:LOYALTY
MULTI|Continuité — APEX et campagne|Le multi complète contexte et récompenses facultatives ; ni Prestige ni statistiques Veteran Bonus ne deviennent des capacités de Ryder.|Manifeste de modes et sauvegardes.||systems:MP-ROSTER
ORIGINAL|Continuité — statut des créations|ATB, arènes proposées, contrôles, animations, sons et ressources graphiques sont du design original ; aucune valeur de dégâts ne prétend reconstituer BioWare.|Bandeau de nature et source.||systems:ATB
''')
for e in c.entries:
    if e['id']=='MEA-CON-DLC':e['sourceIds']=['MEA-SRC-BW-FINAL'];e['reference']='Message BioWare du 19 août 2017'
    if e['id']=='MEA-CON-PATCH108':e['sourceIds']=['MEA-SRC-BW-108']
    if e['id']=='MEA-CON-PATCH110':e['sourceIds']=['MEA-SRC-BW-106','MEA-SRC-BW-FINAL']

# Les cas importants reçoivent des critères propres, au-delà du gabarit de fiche.
critical={
('main_quests','EOS'):'Scanner, monolithes, décryptage, purification puis type d’avant-poste sont cinq états distincts ; une reprise dans le caveau conserve la solution et aucune colonie n’est créée avant choix. Radiation et accès se mettent à jour selon le bon état de restauration.',
('main_quests','MOSHAE'):'Le Cardinal possède orbe et protection cohérentes ; à victoire, choix de captifs/site puis sort du Cardinal sont enregistrés séparément. Le débrief de la Moshae, les retours angara et les prochains objectifs suivent ces valeurs.',
('main_quests','ARCHON'):'Le choix Raeka/scouts n’accomplit jamais les deux secours ; la réaction de Drack, la fonction galarienne et les communications finales sont cohérentes après sauvegarde/reprise. Aucun effet de piège de SAM ne reste bloqué après sortie.',
('main_quests','MERIDIAN'):'Le relais du jumeau utilise le bon nom/modèle puis rend le contrôle au bon Ryder ; chaque Pionnier présent a un état valide, l’arène se termine par objectifs de réseau et le destin de Dunn concorde dans montage et épilogue.',
('main_quests','EPILOGUE'):'Ambassadeur choisi dans liste disponible, conversations d’équipage marquées distinctement et signal quarien relisible ; sortie ne crée aucune quête de DLC fictive et les morts/absents ne réapparaissent pas à la fête.',
('side_quests','CORA-EDGE'):'Réparer les systèmes ouvre le bon parcours ; révélation du journal et rôle de Pionnière sont deux décisions sauvegardées. Rangs avancés de Cora et apparition de Sarissa/Vederia au final correspondent aux états réels.',
('side_quests','LIAM-ALLIN'):'Chaque orientation de gravité conserve corps, caméra, projectiles et scanner dans le même repère ; consoles du bouclier et secours validés une fois. Relire le debrief ne duplique pas captifs ni récompenses.',
('side_quests','VETRA-MEANS'):'Chaque intervention de Sid modifie la salle attendue, y compris gaz dangereux et Hydra neutralisée ; caméra preview correspond à carte jouée, aucun captif placé dans danger créé sans route de secours.',
('side_quests','DRACK-FUTURE'):'Vorn et transport sécurisés avant retour, graines retirées du registre de vol, loyauté débloquée à son jalon et Spender jugé à son propre jalon ; les deux statuts ne se remplacent pas.',
('side_quests','JAAL-FLESH'):'Tir et abstention produisent la bonne scène Akksul/Jaal ; alternative sans délai proposée garde le même choix. La loyauté ne modifie pas les conditions de romance avant dialogue explicite.',
('side_quests','PEEBEE-SIGNAL'):'Tir Kalinda = personnage perdu/appareil acquis ; abstention = Kalinda sauvée/appareil perdu. Après fuite, inventaire, dialogue et aide éventuelle au final restent compatibles avec la branche.',
('side_quests','FAMILY'):'Collecte, lecture des logs, déblocage de mémoire et rencontre familiale sont des étapes distinctes ; identité d’Ellen n’apparaît pas avant révélation et aucune identité de Bienfaiteur n’est produite par défaut.',
('choices','DUNN'):'Tester les quatre fonctions de Pionnier avec variantes asari/galarienne, Avitus présent et absent ; une fonction vide ne déclenche pas une communication de secours. L’état de Dunn est identique dans cinématique et Port Meridian.',
('choices','AI-OWNER'):'Après décision, une seule instance de l’IA existe au hub choisi ; son soutien final correspond à sa remise aux angara, la survie de l’otage suit la décision précédente sans possibilité de double issue.',
('choices','SLOANE-REYES'):'Mise à jour atomique du dirigeant, des gardes et des fenêtres de mission ; le PNJ mort ne reste pas au trône, les interactions déjà terminées ne réapparaissent pas comme disponibles.',
('choices','CORE'):'Le moteur est possédé par un seul détenteur ; l’accord d’implantation requis est vérifié indépendamment de restauration/viabilité, aucune remise répétée ne produit plusieurs récompenses.',
}
for (category,key),criteria in critical.items():
    found=[e for e in c.entries if e['id']==c.ident(category,key)];assert found,(category,key)
    found[0]['acceptance']=criteria
    found[0]['animation']='Nommer les variantes de scène et leurs positions finales ; saut de cinématique, réduction de mouvement et lecture complète appliquent le même état. '+found[0]['visual']
    found[0]['audio']='Répliques originales par branche et sous-titres nominatifs ; supprimer les voix d’acteurs absents avant mixage et conserver les informations de danger en texte.'

char_motion={
'RYDER':('Marche, sprint, saut, suspension, dash, tir et trois compétences sélectionnées ; visages Sara/Scott séparés, ancres de main partagées par gabarit.','Pas de combinaison, souffle et propulsion originaux ; deux profils de voix selon personnage choisi.'),
'CORA':('Charge au sol, impact Nova et geste ouvert de Shield Boost ; transitions de visée shotgun vers biotique sans arme flottante.','Impulsion biotique courte, pulse de protection doux et annonce de secours avec sous-titre.'),
'LIAM':('Bond Havoc Strike, lancer de grenade et Overload ; atterrissage utilise la bonne hauteur et reprise de garde mobile.','Propulseur bref, lancer physique et signal électrique distinct, annonces d’assaut lisibles.'),
'VETRA':('Activation de plaques, pose de tir soutenu et recul de fusil ; tête turienne et visière gardent leur asymétrie.','Déploiement d’armure, montée de rafale puis reprise ; voix de tir priorisée sur bruit mécanique.'),
'JAAL':('Visée longue, lancer adhésif, voile et frappe de retour ; manteau suit mouvement sans cacher la cellule ciblée.','Signal de voile, frappe et arme séparés, voix angara originale sous-titrée.'),
'DRACK':('Pas lourds, Incinerate d’un bras, Flak Cannon et rage de contact ; ne pas mirrorer prothèses et marques de carapace.','Pas métalliques/armure, souffle rauque original et avertissement de charge.'),
'PEEBEE':('Pull, Shockwave et activation Invasion avec gestuelle vive ; acrobatie de décoration ne modifie pas hitbox ni coût.','Impulsion biotique et parasites tech distincts ; commentaire de découverte limité en fréquence.'),
'ALEC':('Progression de guide, tir d’appui et gestes vers objectif ; retrait du prologue désactive toutes animations de compagnon permanent.','Ordres courts de tutoriel et respiration de casque, voix coupée au bon jalon narratif.')}
for key,(motion,sound) in char_motion.items():
    e=next(e for e in c.entries if e['id']==c.ident('characters',key));e['animation']=motion;e['audio']=sound
    e['acceptance']=f'{e["name"]} : identifier sa silhouette aux huit orientations proposées, tester chaque action de son rôle et ses conditions de présence ; arme, portrait et retour au couvert restent cohérents pendant saut, cast et reprise.'

c.sprites()
c.cover('Campagne et missions','19 opérations principales, six arcs de loyauté, nombreuses rencontres d’équipage, missions de chaque monde, tâches choisies et épilogue.','Les 130 fiches annexes incluent quelques chaînes regroupées (Friend or Foe, Movie Night) ; tâches restantes, datapads, positions de tous collectibles et variantes de chaque conversation non exhaustives.')
c.cover('Personnages et monde','Ryder, six équipiers, Alec temporaire, principaux PNJ, arches, mondes, caveaux et lieux d’alliés.','Figuration, marchands mineurs, tous membres de familles angara et chaque variante de costume restent à détailler après relevé en jeu.')
c.cover('Combat et arsenal','Familles kett/hors-la-loi/reliquates/faune, boss, movesets originaux, 36 compétences de Ryder plus alliés, arsenal et armures substantiels.','Statistiques, rangs I–X, augmentations individuelles, toutes armes et immunités d’origine ne sont pas certifiés ; design ATB à prototyper et équilibrer.')
c.cover('Production graphique et sonore','Planches de sprites à produire, cycles d’animation, décors 3D, props, VFX, ambiances et critères de profondeur/verticalité.','Ce catalogue ne fournit pas les fichiers artistiques, meshes ou sons ; validation de silhouette, atlas, performance et écoute à réaliser.')
c.cover('Choix et continuité','Moshae, Raeka/scouts, Pionniers, Dunn, Kalinda, Akksul, régime Kadara, moteur krogan, IA de Voeld, famille et romance versionnée.','Conditions exactes de tous dialogues, petites réactions et fenêtres de patch à confirmer par sauvegardes/captures ; aucune fin ou identité de Bienfaiteur imposée.')
c.cover('Multijoueur / APEX','Dix cartes, échantillon de sept classes de plusieurs espèces, Strike Teams, Prestige/Veteran et compétences propres isolés du solo.','Roster multi complet, toutes vagues, événements, cartes de danger, armes exclusives et disponibilité des services ne sont pas audités ; coop ATB reste une proposition.')
c.cover('Extensions et suivi','Édition Deluxe et contenu additionnel d’équipement distingués du récit ; déclaration BioWare de fin du suivi solo documentée.','Aucun DLC narratif solo ni résolution jouable de l’arche quarienne inventé ; les romans et comics sont couverts dans leurs propres catalogues.')
c.cover('Sources','Sources EA/BioWare/manuel pour périmètre et versions, pages wiki de missions et mondes pour inventaire secondaire.','Pages Fandom consultées par index de recherche lorsque accès direct limité ; inventaire substantiel sans revendication d’exhaustivité vérifiée en jeu.')

if __name__=='__main__':c.write()

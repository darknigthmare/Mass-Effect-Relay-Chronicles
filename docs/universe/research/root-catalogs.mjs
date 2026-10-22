import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dossiers de conception. Les valeurs ATB, plans et animations sont des propositions.
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../catalogs');
const categories=['characters','npcs','lore','worlds','zones','links','scenery','props','enemies','main_quests','side_quests','choices','dialogues','cinematics','weapons','equipment','powers','ally_moves','enemy_moves','animations','sprites','vfx','audio','systems','qa','continuity'];
const sid=(s)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase();
const src=(id,title,url,kind,scope,note='Consulté le 22/10/2026.')=>({id,title,url,kind,scope,note});
function book(id,title,medium,scope,summary,canonNote,sources){return {id,title,medium,filename:`Mass_Effect_${id}_Production.xlsx`,scope,summary,canonNote,sources,entries:[],coverage:[]};}
function add(b,category,key,name,description,adaptation,gameplay='',visual='',acceptance='',extra={}){
 const e={id:`${b.id}-${key}`,category,name,status:'Défini',nature:'Extrapolation',priority:'P1',description,adaptation,gameplay,visual,animation:'',audio:'',implementation:'',conditions:'',acceptance,dependencies:[],sourceIds:[],reference:'Conception du fan game',notes:'',...extra};
 b.entries.push(e);return e.id;
}
function cast(b,list,source){
 for(const [key,name,fact,role,look,motion] of list){
  const id=add(b,'characters',`CHR-${key}`,name,fact,role,'Rôle et règles ATB définis dans les movesets associés.',look,'La fiche distingue identité de référence et rôle proposé.',{nature:'Établi',sourceIds:[source],reference:'Personnages',notes:'Costume exact à contrôler sur les images originales avant validation 1:1.'});
  add(b,'sprites',`SPR-${key}`,`Sprite et portrait de ${name}`,'Livrable 2D proposé.',`Créer un atlas de déplacement et un portrait de dialogue pour ${name}.`,'Réglage proposé : 8 directions, 6 poses de marche par direction, pivot aux pieds.',look,'Aucun membre tronqué, même taille apparente dans chaque direction, silhouette lisible à 96 px.',{dependencies:[id],animation:motion,implementation:`Asset prévu : ${b.id.toLowerCase()}/sprites/${key.toLowerCase()}.png et atlas JSON. Aucun fichier livré par cette fiche.`,conditions:'Référence costume et palette validée avant déclinaisons.',notes:'Le nombre de poses est une cible de production, pas une donnée du jeu source.'});
 }
}
function place(b,list,source){
 for(const [key,name,fact,layout,look,hazard] of list){
  const id=add(b,'worlds',`LOC-${key}`,name,fact,'Destination de la campagne adaptée.',hazard,look,'La destination se distingue de ses sous-zones et possède une référence.',{nature:'Établi',sourceIds:[source],reference:'Lieux'});
  const zone=add(b,'zones',`MAP-${key}`,`Plan jouable : ${name}`,'Plan original à construire.',layout,hazard,look,'Chaque objectif et sortie est atteignable. Aucun changement de caméra ne masque une interaction.',{dependencies:[id],implementation:'Graphe de navigation, colliders 3D, ancres de caméra fixe, déclencheurs et spawn séparés.',conditions:'Les dimensions et la distribution sont des adaptations, à comparer aux captures avant validation de fidélité.'});
  add(b,'scenery',`SET-${key}`,`Décor 3D : ${name}`,'Direction artistique proposée à partir du lieu.',look,'Obstacles solides en 3D, personnages et accessoires animés en billboards 2D.',`Palette de travail : ${look}`,'Pas de scintillement des transparences. Les ombres des sprites suivent le sol et les passerelles.',{dependencies:[zone],animation:'Animer seulement les éléments environnementaux nécessaires à la lecture du lieu.',audio:`Ambiance originale située dans ${name}, sources proches distinctes du fond, boucle sans coupure.`,implementation:'Meshes modulaires, matériaux PBR sobres, lumière indirecte et masque d’occlusion pour sprites.'});
 }
}
function moves(b,list){
 for(const [key,name,owner,rule,telegraph,counter] of list){
  add(b,'ally_moves',`MOV-${key}`,name,`Action proposée pour ${owner}.`,rule,`${rule} Contrepartie : ${counter}`,telegraph,'La commande expose cible, coût et résultat avant confirmation.',{animation:`Anticipation lisible, pose de libération, récupération. ${telegraph}`,audio:'Signal d’activation distinct du signal de disponibilité. Sous-titre des alertes.',implementation:`Action de données ${b.id.toLowerCase()}_${key.toLowerCase()}. Coût retiré une seule fois.`,conditions:'Aucun coût numérique ne décrit une statistique officielle.'});
 }
}
function enemies(b,list,source){
 for(const [key,name,fact,rule,look,counter] of list){
  const id=add(b,'enemies',`ENM-${key}`,name,fact,`Archétype ATB : ${rule}`,`Proposition : ${rule} Réponse : ${counter}`,look,'L’adversaire peut être identifié avant son premier coup et possède une réponse accessible.',{nature:'Établi',sourceIds:[source],reference:'Adversaires',notes:'PV, dégâts, cadence et nombre d’unités à équilibrer pour le fan game.'});
  add(b,'enemy_moves',`EMV-${key}`,`${name} : boucle de combat`,'IA et télégraphes originaux.',rule,`Priorité IA : cible valide, anticipation, résolution, temps de récupération. ${counter}`,look,'Une action interrompue ne s’exécute pas après la mort. Le télégraphe précède toujours les dégâts.',{dependencies:[id],animation:`Anticipation propre à ${name}, attaque et état de rupture distincts.`,audio:'Avertissement sonore doublé par forme et texte, sans dépendance exclusive à la couleur.'});
 }
}
function missions(b,list,source){
 let prior=null;
 for(const [key,name,fact,objective,layout,condition] of list){
  const id=add(b,'main_quests',`MIS-${key}`,name,fact,objective,`Objectif proposé : ${objective} Échec : retour au point de contrôle sans duplication des récompenses.`,layout,'Objectif, progression, sortie et sauvegarde fonctionnent après chargement intermédiaire.',{nature:'Établi',sourceIds:[source],reference:name,conditions:condition,dependencies:prior?[prior]:[],implementation:`État de mission prévu ${b.id.toLowerCase()}_${key.toLowerCase()} : disponible, active, résolue.`,notes:'Le nom et la place du chapitre sont référencés. Son agencement ATB est original.'});
  prior=id;
 }
}
function rows(b,category,list){for(const r of list){const [key,name,desc,adapt,game,visual,accept,extra={}] =r;add(b,category,key,name,desc,adapt,game,visual,accept,extra);}}
function common(b,subject,save,restrictions){
 rows(b,'systems',[
 ['SYS-ATB','ATB avec pause des commandes','Système original du fan game.','Garder une jauge par acteur, la chronologie des attaques et un mode Attente.','Réglage proposé : une commande consomme une jauge pleine. Une anticipation ennemie engagée reste visible.','Barre bleu acier pour attente, icône et libellé pour interruption.','Changer de mode ne crée ni double tour ni perte de commande.'],
 ['SYS-SAVE','Sauvegarde de campagne','Schéma de sauvegarde proposé.',save,'Versionner les états de mission, l’inventaire, les choix et le point de retour.','Menu à trois emplacements avec chapitre et objectif.','Charger avant et après un embranchement restitue le même état.'],
 ['SYS-CAMERA','Caméras fixes et sprites dans le décor 3D','Règle de présentation proposée.',`Conserver la mise en scène propre à ${subject}.`,'Calculer la direction du sprite dans le repère caméra. Conserver les axes de déplacement lors des raccords.','Perspective douce, contours lisibles, profondeur et ombres de contact.','Un personnage derrière un pilier disparaît proprement sans passer devant le sol.'],
 ['SYS-ACCESS','Commandes et lisibilité','Spécification d’accès au jeu.','Clavier, manette et interface tactile facultative.','Reconfigurer les touches, accélérer les animations, afficher les résistances par texte.','Contraste des textes, taille réglable, réduction du flash et du mouvement.','Toutes les commandes et le journal restent utilisables sans souris.'],
 ['SYS-SOURCES','Registre de références','Suivi de production.','Conserver les références visuelles et leur provenance par asset.','Un élément change de statut uniquement après contrôle documenté.','Guide lisible avec source et limite de couverture.','Aucune fiche de conception n’est automatiquement marquée Intégré.']
 ]);
 rows(b,'qa',[
 ['QA-PATH','Parcours de bout en bout','Scénario de recette proposé.',`Exécuter le parcours prévu de ${subject}.`,'Tester une victoire, une défaite puis un rechargement dans chaque chapitre.','','Chaque objectif peut se terminer sans commande de débogage.'],
 ['QA-BRANCH','Choix et états persistants','Recette des embranchements.',save,'Tester chaque condition vraie/fausse, ainsi que l’absence de donnée dans une vieille sauvegarde.','','Les choix ne s’écrasent pas et le journal explique les objectifs indisponibles.'],
 ['QA-VISUAL','Contrôle de référence et de lisibilité','Recette artistique avant validation.',`Comparer silhouette, tenue, palette et décor de ${subject} aux références détenues.`,'Capturer les mêmes poses et angles. Séparer écart voulu et erreur.','','Chaque écart est corrigé ou signalé dans la fiche de l’asset.'],
 ['QA-BALANCE','Coûts, immunités et boss','Recette des règles proposées.','Vérifier les coûts avant et après interruption et la lecture des résistances.','Tester une cible morte, immunisée, hors champ et dépourvue de protection.','','Aucun combat ne dépend d’une faiblesse non annoncée.'],
 ['QA-SCOPE','Limites de fidélité','Contrôle de publication.',restrictions,'Vérifier les mentions Établi, À vérifier et Extrapolation à chaque export.','','Aucune scène créée ne devient un fait officiel dans le journal ou les crédits.']
 ]);
 rows(b,'continuity',[
 ['CNT-FLAGS','Transfert de progression','Contrat de continuité proposé.',save,'Importer uniquement les clés explicitement déclarées ; ignorer les valeurs inconnues avec message.','','Le jeu de base peut démarrer sans ce module.'],
 ['CNT-SCOPE','Périmètre et variantes','Règle de continuité du catalogue.',restrictions,'Conserver une campagne source et un profil d’adaptation séparés.','','Le joueur sait quelle version de l’histoire est sélectionnée.']
 ]);
 for(const c of categories)b.coverage.push({area:c,covered:'Fiches de référence et/ou de production disponibles dans cet onglet.',remaining:'Relevé visuel dans l’œuvre originale, fabrication des assets, équilibrage et test en jeu à réaliser.'});
}

const inf=book('INF','Mass Effect: Infiltrator','Jeu mobile','Campagne de Randall, mission bonus turienne et systèmes adaptés.','Un parcours d’infiltration et de fuite réinterprété en ATB avec sprites 2D et environnements 3D.','Les faits de base sont référencés. Plans, statistiques, bruitages et animations proposés ne constituent pas un relevé 1:1.',[
src('INF-OFFICIAL','Koolhaus Games : Mass Effect Infiltrator','https://koolhausgames.com/portfolio/mass-effect-3/','Source développeur','Prémisse, combat, bonus turien et ancienne liaison Galaxy at War.'),
src('INF-WIKI','Mass Effect Wiki : Infiltrator','https://masseffect.fandom.com/wiki/Mass_Effect:_Infiltrator','Wiki','Personnages, lieux et déroulement général.'),
src('INF-GUIDE','Guide Infiltrator','https://masseffect.fandom.com/wiki/Mass_Effect:_Infiltrator_Guide','Wiki','Neuf missions principales, checkpoints et Incarceration.'),
src('INF-ABIL','Capacités Infiltrator','https://masseffect.fandom.com/wiki/Abilities_(Mass_Effect:_Infiltrator)','Wiki indexé','Noms des pouvoirs et principales fonctions.','Ouverture directe refusée ; extraits indexés consultés. Chiffres source non repris.'),
src('INF-EQUIP','Équipement Infiltrator','https://masseffect.fandom.com/wiki/Equipment_(Mass_Effect:_Infiltrator)','Wiki indexé','Quatre armes de Randall et équipement.','Ouverture directe refusée ; résultats indexés consultés.'),
src('INF-STORE','Boutique Infiltrator','https://masseffect.fandom.com/wiki/Store_(Mass_Effect:_Infiltrator)','Wiki indexé','Listes armes, biotiques, capacités, mêlée.','Résultats indexés consultés. Fiche à confirmer dans une capture du jeu.')
]);
cast(inf,[
['RANDALL','Randall Ezno','Agent de Cerberus puis fugitif.','Protagoniste solo, arsenal et implants évolutifs.','Proposition : armure segmentée gris clair, marquages Cerberus à contrôler, implants visibles au portrait.','Course basse, tir à deux mains, glissade et déstabilisation des implants.'],
['TURIAN','Prisonnier turien','Personnage jouable de la mission bonus.','Chapitre isolé avec arsenal et ressources limités.','Crête turienne, jambes digitigrades, tenue de sujet d’expérience à relever.','Locomotion distincte de Randall, gestes douloureux et tir sous pression.']
],'INF-WIKI');
rows(inf,'npcs',[
['NPC-INALI','Inali Renata','Interlocutrice de Randall.','Portrait calme puis variante altérée selon la progression.','','Uniforme et prothèses à relever dans les cinématiques.','Aucune variante finale visible avant le chapitre concerné.',{nature:'Établi',sourceIds:['INF-WIKI']}],
['NPC-DIRECTOR','Le Directeur','Responsable du Barn.','Antagoniste transmis à distance.','Ne pas ajouter un duel physique présenté comme officiel.','Écrans et cadrage froid proposés.','La présence du Directeur conserve sa fonction narrative.',{nature:'Établi',sourceIds:['INF-WIKI']}],
['NPC-VOLUS','Allié volus','Contact de Randall pendant sa fuite.','Relais radio et indications de progression.','','Combinaison pressurisée, portrait masqué.','Sa voix possède un sous-titre et n’occulte pas les alertes.',{nature:'Établi',sourceIds:['INF-WIKI']}]
]);
place(inf,[
['ICE','Ice Giant','Destination du début.','Trois terrasses enneigées reliées par rampes, aire d’extraction séparée.','Bleu glacial, neige basse, silhouettes industrielles sombres.','Rafales de vent annoncées ; couverts abrités.'],
['BARN','The Barn','Station de recherche de Cerberus.','Boucle hangar, clinique, sécurité, laboratoire, relais puis retour vers navette.','Blanc clinique, noir mécanique, éclairage orange en alerte.','Portes sous contrôle de sécurité ; accès persistants après piratage.'],
['LV426','LV426','Destination désertique finale.','Arène ouverte avec rochers périphériques et arrivée navette hors combat.','Sable ocre, roches usées, ciel poussiéreux.','Lignes de tir longues ; obstacles non destructibles pour couvrir les phases.']
],'INF-WIKI');
missions(inf,[
['ICE','Ice Giant','4 checkpoints dans le guide.','Apprendre couvert, pouvoir et capture.','Couloirs de neige alternant approche et flanc.','Ouverture.'],
['HANGAR','Hangar Bay','2 checkpoints.','Atteindre la zone de débriefing.','Quai, rampes et passerelle de contrôle.','Ice Giant terminé.'],
['MEDICAL','Medical Bay','5 checkpoints.','Traverser les salles et retrouver le contact.','Cloisons vitrées et zone de quarantaine.','Hangar Bay terminé.'],
['SECURITY','Security Checkpoint','2 checkpoints.','Lever le verrou vers les laboratoires.','Deux lignes de couverture et sas sécurisé.','Medical Bay terminé.'],
['X1WING','X1 Wing','6 checkpoints.','Récupérer les données et survivre au laboratoire.','Cuves, cages, conduits et plateformes.','Sécurité franchie.'],
['COLOSSEUM','Colosseum','1 checkpoint.','Affronter X1 avec télégraphes de charge.','Arène circulaire avec piliers de protection.','X1 Wing terminé.'],
['COMM','Comm Relay','6 checkpoints.','Rétablir une liaison vers l’Alliance.','Escalier de maintenance puis antenne et consoles.','Colosseum terminé.'],
['CORRIDOR','Access Corridor','6 checkpoints.','Rejoindre le hangar et sécuriser la navette.','Retour transformé par les dégâts et renforts.','Message émis.'],
['DESERT','Desert Planet','1 checkpoint.','Conclure l’affrontement avec Inali.','Arène désertique, alternance barrières et armure.','Navette récupérée.']
],'INF-GUIDE');
rows(inf,'side_quests',[
['SIDE-INCARCERATION','Incarceration','Bonus turien, 6 checkpoints.','Campagne indépendante accessible depuis le menu.','Pas d’import des améliorations de Randall.','Clinique dévastée et sortie inaccessible.','Le bonus conserve sa progression séparée.',{nature:'Établi',sourceIds:['INF-GUIDE']}],
['SIDE-INTEL','Collecte des renseignements','Collecte présente dans le jeu.','Objectifs de récupération facultatifs dans les arènes.','Proposition : journal local, récompenses fixes et aucune connexion à un ancien service.','Tablettes orange et conteneurs identifiables.','Un renseignement ne se crédite qu’une fois.',{nature:'Établi',sourceIds:['INF-OFFICIAL']}],
['SIDE-RANK','Rejouer un checkpoint','Rejeu et amélioration du rang.','Menu de sélection des segments débloqués.','Conserver le meilleur résultat ; ne pas réécrire les choix narratifs.','','Le score ne déverrouille pas prématurément un chapitre.',{nature:'Établi',sourceIds:['INF-GUIDE']}]
]);
rows(inf,'lore',[
['LOR-CERBERUS','Cerberus','Organisation au centre du conflit.','Dossiers synthétiques débloqués par preuves.','Séparer croyances de Randall et faits établis.','Emblèmes uniquement après vérification graphique.','Le codex indique la provenance des informations.',{nature:'Établi',sourceIds:['INF-OFFICIAL']}],
['LOR-EXPERIMENT','Expérimentation et implants','Thème de la campagne.','Expliquer les effets via des situations de jeu.','Les surcharges d’implants proposées sont des handicaps temporaires, pas un diagnostic.','Interface neurale en arcs fragmentés.','Le tutoriel distingue pouvoir acquis et effet narratif.',{nature:'Établi',sourceIds:['INF-WIKI']}]
]);
enemies(inf,[
['TROOPER','Soldat de Cerberus','Troupe rencontrée pendant la fuite.','Rafale puis changement de couvert.','Armure claire, visière sombre ; détails à comparer.','Interrompre le déplacement ou briser sa protection.'],
['MECH','Mech de Cerberus','Machines hostiles du Barn.','Verrouillage puis rafale lourde.','Châssis massif et articulation lumineuse proposée.','Sortir du secteur marqué avant résolution.'],
['SUBJECT','Sujet évadé','Victime expérimentale hostile.','Charge au plus proche puis récupération longue.','Silhouette altérée et posture asymétrique.','Garder un point de recul libre.'],
['X1','X1','Krogan mutant du Colosseum.','Charge, frappe au sol puis vulnérabilité du dos.','Masse krogan augmentée, échelle renforcée.','Casser la ligne de charge avec un pilier.'],
['INALI','Inali augmentée','Affrontement final.','Phases protection, armure, contrôle du Directeur.','Silhouette transformée à relever sur référence.','Détruire la protection sans perdre la lecture du choix final.'],
['OGRE','Ogre Mech','Adversaire du bonus.','Bombardement central et appel de renforts.','Structure lourde et canon distinct.','Prioriser les unités de soutien pendant la récupération.'],
['ORCUS','Orcus Mech','Adversaire du bonus.','Pression à distance en groupe.','Petite silhouette mécanique répétable.','Réserver un espace de repli.']
],'INF-WIKI');
for(const [key,name,rule,look] of [
['MATTOCK','M-96 Mattock Auto','Tir soutenu avec accumulation de chaleur proposée.','Fusil long, finitions Cerberus à relever.'],
['EVISCERATOR','M-22 Eviscerator','Tir court en cône ; bonus de proximité proposé.','Pompe compacte et canon large.'],
['INCISOR','M-29 Incisor','Visée sur une cible ; rafale groupée proposée.','Silhouette à lunette.'],
['PARTICLE','M-333 Particle Beam','Canalisation qui bloque le déplacement et reste interruptible.','Faisceau continu, noyau lumineux limité.']])
 add(inf,'weapons',`WPN-${key}`,name,'Modèle répertorié dans Infiltrator.',rule,`Réglage ATB proposé : ${rule}`,look,'La fiche distingue dégâts de base, protection ciblée et coût proposés.',{nature:'Établi',sourceIds:['INF-EQUIP','INF-STORE'],reference:'Armes'});
for(const [key,name,rule] of [['PULL','Pull','Sortir une cible légère de son couvert.'],['LEASH','Leash','Déplacer une cible exposée vers une case libre.'],['STORM','Storm','Zone biotique de contrôle temporaire proposée.'],['SALVO','Salvo','Salve sur cibles distinctes, jamais de doublon sur une cible morte.'],['CLOAK','Cloak','Réduire la priorité de ciblage et repositionner Randall.'],['SPRINT','Sprint','Rejoindre un couvert sans attaque.'],['SLIDE','Slide','Glisser sous la ligne de tir et conserver le pivot aux pieds.'],['PUNCH','Punch','Coup de proximité simple.'],['PUSH','Push','Repousser pour dégager un passage.'],['CHARGE','Charge','Mêlée d’approche avec cible et chemin valides.']])
 add(inf,'powers',`PWR-${key}`,name,'Capacité mentionnée dans l’index de la boutique ; présence et intitulé à confirmer.',`Traduction ATB : ${rule}`,`${rule} Coût et durée à régler, sans reprise de valeurs officielles.`,key==='CLOAK'?'Contour réfracté avec silhouette accessible.':'Effet directionnel lisible devant les sprites.','L’interface expose les cibles immunisées avant dépense.',{nature:'À vérifier',sourceIds:['INF-STORE'],reference:'Index des capacités',conditions:'Confirmer le nom, le déblocage et l’effet dans une version jouable ou une capture complète.',notes:'Source secondaire partielle. Les règles ATB proposées ne constituent pas une validation de la capacité originale.'});
moves(inf,[['BURST','Rafale de couverture','Randall','Retarder une attaque ennemie déjà signalée.','Canon pointé et flash bref.','Ne repousse pas un boss lourd.'],['LIFT','Extraction biotique','Randall','Combiner sortie de couvert et tir de précision.','Main tendue puis cible soulevée.','Cible lourde uniquement marquée, jamais projetée.'],['ESCAPE','Évasion sous camouflage','Prisonnier turien','Réduire les cibles hostiles pendant un changement de ligne.','Contour et déplacement rapide.','Aucun pouvoir biotique ajouté au prisonnier.']]);
rows(inf,'equipment',[
['EQ-BODY','Armure de corps','Armure et casque sont des pièces distinctes.','Dissocier survie et recharge dans l’écran d’équipement.','Bonus relatifs proposés ; visualiser avant achat.','Plaques et emplacements de casque compatibles.','Changer de casque ne duplique pas le bonus de corps.',{nature:'Établi',sourceIds:['INF-EQUIP']}],
['EQ-INTEL','Données de Cerberus','Ressource du parcours.','Inventaire de preuves et conversion locale optionnelle.','Conversion irréversible avec aperçu de la valeur.','Icône tablette orange.','Une conversion persiste après chargement.',{nature:'Établi',sourceIds:['INF-OFFICIAL']}]
]);
rows(inf,'choices',[
['CHO-MORAL','Conduite de Randall','Choix moraux présents.','Enregistrer chaque décision dans un journal sans résumé binaire permanent.','Les seuils de l’adaptation sont proposés et exposés.','','Les choix précédents ne sont pas remplacés lors du rejeu.',{nature:'Établi',sourceIds:['INF-WIKI']}],
['CHO-INALI','Sort d’Inali','Issue liée à la conduite du joueur.','Présenter la conclusion selon les drapeaux de campagne.','Tester toutes les combinaisons autorisées.','Portrait final adapté à la branche.','Aucune issue n’est déclarée canon pour toute la franchise.',{nature:'Établi',sourceIds:['INF-WIKI']}]
]);
rows(inf,'dialogues',[
['DIA-VOLUS','Instructions du volus','Situation référencée de soutien radio.','Courtes répliques originales selon objectif et retard.','Priorité aux annonces de danger ; pas de répétition à chaque retour.','Portrait compact dans le coin libre.','La reprise de sauvegarde ne rejoue pas toute la conversation.'],
['DIA-DIRECTOR','Interventions du Directeur','Situation antagoniste.','Échanges originaux brefs déclenchés par la progression.','Ne pas inventer de nouvelles révélations présentées comme source.','Écran mural ou portrait radio.','Les sous-titres restent lisibles pendant la marche.']
]);
rows(inf,'cinematics',[
['CIN-REVEAL','Découverte dans la clinique','Séquence à reconstruire sur références.','Plan large, contrechamp Randall, état d’Inali.','Passage de caméra avec immobilisation contrôlée.','Vitres opaques puis dévoilement progressif.','Sauter la scène laisse le même objectif et le même état.'],
['CIN-ESCAPE','Départ en navette','Transition vers le désert.','Navette 3D lointaine avec passager sprite.','Charger la destination après fermeture du sas.','Éclairage de hangar orange puis désert ocre.','Aucun personnage visible simultanément sur les deux cartes.']
]);
rows(inf,'links',[
['LNK-LOOP','Boucle du Barn','Topologie originale.','Relier hangar, clinique, sécurité, X1 et relais avec raccourcis de retour.','Verrous fondés sur état de mission.','Sas numérotés et éclairage par secteur.','Un retour tardif ne ferme jamais l’issue requise.'],
['LNK-SHUTTLE','Hangar vers LV426','Transition de campagne référencée.','Point de non-retour annoncé avant embarquement.','Autoriser sauvegarde manuelle avant départ.','Marqueur de navette isolé des autres interactions.','Le joueur connaît les objectifs facultatifs encore ouverts.']
]);
rows(inf,'props',[
['PRP-GLASS','Cloison médicale','Accessoire 3D proposé.','Vitres avec masque de profondeur pour sujets en sprite.','Collision distincte de la transparence.','Verre froid, montants clairs.','Un tir ne traverse que les panneaux prévus.'],
['PRP-TERMINAL','Console de preuves','Objet interactif proposé.','Terminal orienté vers la caméra principale.','Un état vide remplace l’icône après récupération.','Hologramme orange discret.','Lisible sans surbrillance permanente.'],
['PRP-SHUTTLE','Navette de fuite','Véhicule de transition.','Carlingue 3D et porte animée, portrait 2D à bord.','Pas de pilotage libre ajouté à la campagne source.','Silhouette et marquage à contrôler.','La porte ne traverse pas le sprite à l’embarquement.']
]);
rows(inf,'animations',[
['ANM-SLIDE','Glissade vers couvert','Animation proposée.','Déplacer le pivot sans changer la hauteur des pieds après récupération.','Réglage proposé : anticipation 2 poses, translation 4, redressement 3.','Silhouette basse, arme protégée.','La hitbox suit l’action et ne reste pas basse après celle-ci.'],
['ANM-X1','Charge de X1','Animation de boss proposée.','Lever d’épaule, départ, impact ou arrêt, reprise.','L’impact est attaché à un événement unique.','Volume de silhouette constant durant les rotations.','Une charge interrompue ne déclenche pas l’onde d’impact.']
]);
rows(inf,'vfx',[
['VFX-CLOAK','Camouflage','Effet proposé.','Dissoudre progressivement la couleur du sprite en gardant un liseré optionnel.','Ne pas retirer l’indicateur de sélection.','Réfraction faible, pas de flash blanc.','Randall reste localisable sur fond clair.'],
['VFX-BIOTIC','Biotique de laboratoire','Effet proposé.','Rubans bleu-violet devant et derrière la cible.','Z-order et fin liés à l’état de la cible.','Émission limitée sur verre blanc.','L’effet disparaît à l’interruption et au chargement.']
]);
rows(inf,'audio',[
['AUD-BARN','Ambiance du Barn','Création sonore originale.','Ventilation, bips médicaux et alarmes selon les secteurs.','Les alarmes baissent pendant les communications.','Repère visuel des alarmes dans le HUD.','Aucun pic sonore ne masque une instruction.'],
['AUD-CHASE','Musique de fuite','Composition originale proposée.','Pulsation synthétique avec couches selon intensité et présence du boss.','Transitions sur mesures, pas de redémarrage après chaque ennemi.','','Le niveau sonore demeure stable entre exploration et combat.']
]);
common(inf,'Infiltrator','Conserver checkpoints, rangs, achats, preuves et décisions de Randall. Séparer la sauvegarde du prisonnier turien.','Aucun service Galaxy at War historique n’est requis. Les données exportées restent locales ; aucun lien fonctionnel avec un compte EA n’est promis.');

const gal=book('GAL','Mass Effect: Galaxy','Jeu mobile','Six missions de Jacob, trois pistes d’enquête et adaptation du système mobile.','Transformer les arènes mobiles et la narration dessinée en module ATB de poche, avec décors 3D.','BioWare situe l’aventure entre ME1 et ME2 ; certains repères du wiki la placent avant des événements de 2183. Le calendrier précis reste à arbitrer sans modifier silencieusement la source.',[
src('GAL-BIO','BioWare : Mass Effect on the iPhone','https://blog.bioware.com/2009/05/29/mass-effect-on-the-iphone/','Source officielle','Jacob, position annoncée entre ME1 et ME2, structure à trois branches et narration 2D.'),
src('GAL-GUIDE','Guide Mass Effect Galaxy','https://masseffect.fandom.com/wiki/Mass_Effect_Galaxy_Guide','Wiki indexé','Noms des six missions, zones de combat et améliorations.','Ouverture directe refusée ; extrait indexé détaillé consulté.'),
src('GAL-WIKI','Mass Effect Galaxy','https://masseffect.fandom.com/wiki/Mass_Effect_Galaxy','Wiki indexé','Distribution et lieux.','Ouverture directe refusée ; résultats indexés consultés.'),
src('GAL-COMBAT','Combat dans Galaxy','https://masseffect.fandom.com/wiki/Combat_(Mass_Effect_Galaxy)','Wiki indexé','M-8 Avenger, déplacement, protections et verrouillage de cible.'),
src('GAL-ABIL','Pouvoirs dans Galaxy','https://masseffect.fandom.com/wiki/Abilities_(Mass_Effect_Galaxy)','Wiki indexé','Stase, attaque lourde et surcharge, progressions liées aux pistes.'),
src('GAL-STORY','Storyline II : Galaxy','https://masseffect.fandom.com/wiki/Storyline_II','Wiki indexé','Enquête, contacts et conclusion.','Seule la section Galaxy consultée dans les résultats indexés. Ne pas mélanger les éléments ME2 voisins.'),
src('GAL-JATH','Jath’Amon','https://masseffect.fandom.com/wiki/Jath%27Amon','Wiki indexé','Ambassadeur et confrontation finale.'),
src('GAL-ENEMIES','Adversaires de Galaxy','https://masseffect.fandom.com/wiki/Category:Enemies_(Mass_Effect_Galaxy)','Wiki indexé','Index des adversaires.'),
src('GAL-TUDGE','Reginald Tudge','https://masseffect.fandom.com/wiki/Reginald_Tudge','Wiki indexé','Capitaine de l’Arcturian Jade.')
]);
cast(gal,[
['JACOB','Jacob Taylor','Soldat biotique protagoniste.','Combattant jouable, enquêteur et protecteur.','Proposition : tenue de combat compacte, visage lisible, fusil conservé dans la silhouette.','Marche, course, visée, lancement biotique et réaction au choc.'],
['MIRANDA','Miranda Lawson','Contact central de l’enquête.','Soutien narratif et radio. Une présence combattante serait une variante originale.','Proposition : silhouette sobre, tenue noire et claire à relever sur le dessin source.','Portrait neutre, réflexion, alerte et transmission.']
],'GAL-WIKI');
for(const [key,name,fact,role,source] of [
['DEREK','Derek Izunami','Personnage référencé.','Briefing et relation de confiance à vérifier dans les dialogues.','GAL-WIKI'],
['BATHA','Batha','Scientifique rencontrée dans l’enquête.','Objectif de protection et de transmission de preuves.','GAL-STORY'],
['NAX','Nax','Krogan associé au sauvetage.','Soutien temporaire proposé, sans modifier sa fonction source.','GAL-STORY'],
['ILLO','Illo Nazario','Marchand d’armes turien.','Interlocuteur de la piste Tortuga.','GAL-STORY'],
['ISH','Ish','Contact salarien de Miranda.','Fournir un accès et marquer la provenance du renseignement.','GAL-STORY'],
['TUDGE','Reginald Tudge','Capitaine de l’Arcturian Jade.','Remerciement et transition après l’attaque.','GAL-TUDGE']])
 add(gal,'npcs',`NPC-${key}`,name,fact,role,'Dialogues courts originaux ; condition de présence liée à la mission.','Portrait dessiné à confronter au jeu source.','Le personnage apparaît uniquement dans les scènes prévues.',{nature:'Établi',sourceIds:[source],reference:'Personnages de Galaxy'});
place(gal,[
['JADE','Arcturian Jade','Paquebot de l’ouverture.','Promenade, coursive et pont, reliés par portes latérales.','Boiseries claires proposées, baies sur les étoiles, mobilier de croisière.','Évacuation de passagers comme objectif secondaire proposé.'],
['CARTAGENA','Cartagena Station','Étape de l’enquête.','Quai, ruelle intérieure, bar, arrière-salle et zone de confrontation.','Acier usé, néons chauds, foule en sprites de fond.','Couloirs étroits : protéger les civils des lignes de tir.'],
['TORTUGA','Tortuga','Destination de la piste du marchand d’armes.','Entrepôt, contrôle d’accès, cour de caisses et bureau.','Conteneurs asymétriques, lampes industrielles et affichages commerciaux.','Verrou de porte alimenté par renseignement obtenu.'],
['AHN','Ahn’Kedar Orbital Platform','Station de la piste des scientifiques.','Sas, laboratoire, cellules et baie de récupération.','Blanc dégradé, verre turquoise, signalétique médicale.','Séparer les scientifiques des zones de combat.'],
['BEKKE','Bekke','Monde de la piste batarienne.','Camp sous la pluie, dépôts et entrepôt d’élément zéro.','Roches noires, flaques, pluie oblique et lueurs d’eezo.','Effet biotique local proposé signalé avant les combats.'],
['CITADEL','Citadelle','Destination finale.','Chemin de sécurité, jardin, ascenseur et zone du Conseil.','Architecture blanche, végétation basse, accents bleus.','Maintenir une route d’évacuation lisible.']
],'GAL-GUIDE');
const gm=[
['JADE','Save the Arcturian Jade','6 zones dans le guide.','Repousser l’attaque et protéger l’accès au pont.','Tutoriel de déplacement, tir et surcharge.'],
['ABYSS','Into the Abyss','5 zones dans le guide.','Trouver le contact sur Cartagena.','Alterner espace social et affrontements en profondeur.'],
['TORTUGA','Scum and Villainy','8 zones dans le guide.','Explorer la piste d’Illo et améliorer l’attaque lourde.','Arènes d’entrepôt avec obstacles destructibles.'],
['AHN','A Formula for Hope','6 zones dans le guide.','Retrouver les scientifiques et améliorer la surcharge.','Choisir des angles de tir qui protègent les otages.'],
['BEKKE','A Batarian Army','6 zones dans le guide.','Examiner le déploiement batarien et améliorer la stase.','Passer de la pluie à une zone d’eezo plus lumineuse.'],
['COUNCIL','Protect the Council','9 zones dans le guide.','Rassembler les preuves et conclure l’enquête.','Pression croissante sans rendre les indices illisibles.']
];
for(let i=0;i<gm.length;i++){const [key,name,desc,goal,layout]=gm[i];add(gal,'main_quests',`MIS-${key}`,name,desc,goal,layout,'Plans 3D originaux correspondant aux lieux répertoriés.','La mission fournit son objectif, sa sortie, son bilan et son point de reprise.',{nature:'Établi',sourceIds:['GAL-GUIDE'],reference:name,dependencies:i===0?[]:i===1?['GAL-MIS-JADE']:i<5?['GAL-MIS-ABYSS']:['GAL-MIS-TORTUGA','GAL-MIS-AHN','GAL-MIS-BEKKE'],conditions:i>1&&i<5?'Les trois pistes peuvent être réalisées dans l’ordre choisi.':i===5?'Les trois pistes sont résolues.':'Progression d’introduction.',notes:'Le nombre de zones est un relevé du guide, pas un nombre de cartes 3D déjà créées.'});}
rows(gal,'lore',[
['LOR-ALLIANCE','Passé militaire de Jacob','BioWare le décrit comme ancien soldat de l’Alliance.','Évoquer son expérience par des tutoriels courts.','','Portrait et badge sans ajouter une promotion non sourcée.','La biographie reste limitée aux informations vérifiées.',{nature:'Établi',sourceIds:['GAL-BIO']}],
['LOR-BATARIAN','Cellule batarienne','Menace au cœur de l’enquête.','Distinguer les responsables rencontrés de l’ensemble de l’espèce.','Les indices identifient des acteurs précis.','Symboles de faction à relever.','Les fiches civiles ne sont pas marquées hostiles par espèce.',{nature:'Établi',sourceIds:['GAL-STORY']}],
['LOR-EEZO','Élément zéro sur Bekke','Indice de la piste Bekke.','Introduire une perturbation biotique locale clairement signalée.','Bonus et fatigue proposés uniquement dans cette arène.','Cristaux et champ bleuté modéré.','Quitter la zone retire le modificateur.',{nature:'Établi',sourceIds:['GAL-STORY']}]
]);
enemies(gal,[
['CLINT','Clint « Black Eye » Darragh','Chef pirate de l’enquête.','Duel avec couvert et renforts espacés.','Silhouette de pirate distincte, visage à contrôler.','Couper sa ligne de tir puis traiter le soutien.'],
['JATH','Jath’Amon','Ambassadeur au centre du final.','Pression à distance, missiles télégraphiés et drones de soutien.','Fauteuil mobile et silhouette batarienne à relever.','Surcharge puis déplacement latéral pendant la préparation.'],
['TURIAN','Adversaire turien','Type listé dans le bestiaire Galaxy.','Tir précis depuis un angle fixe.','Crête et armure distinguées de celles d’un civil.','Stase pour traverser son cône de visée.'],
['ROBOT','Robot','Type listé dans le bestiaire Galaxy.','Approche mécanique puis décharge de proximité.','Silhouette géométrique avec noyau identifiable.','Attaque technologique avant qu’il atteigne Jacob.']
],'GAL-ENEMIES');
// La source spécifique de Jath’Amon apporte la fonction narrative, l’index seulement l’existence.
gal.entries.find(e=>e.id==='GAL-ENM-JATH').sourceIds=['GAL-JATH'];
rows(gal,'weapons',[
['WPN-AVENGER','M-8 Avenger','Fusil de Jacob dans Galaxy.','Transformer le tir automatique en attaque ATB de base.','Proposition : tir sur une cible, pas de ressource de munitions.','Silhouette compacte du fusil à relever.','Ne pas introduire une surchauffe présentée comme règle du jeu mobile.',{nature:'Établi',sourceIds:['GAL-COMBAT']}],
['WPN-GRENADE','Attaque lourde','Projectile explosif du système de pouvoirs.','Commande à zone prévisualisée.','Proposition : petit rayon, dégâts alliés désactivés en mode histoire.','Arc et cercle d’impact distincts du tir normal.','Le mode choisi explique le traitement des alliés.',{nature:'Établi',sourceIds:['GAL-ABIL']}]
]);
rows(gal,'powers',[
['PWR-STASIS','Stase','Pouvoir biotique de Jacob.','Suspendre l’action d’une cible pendant un cycle proposé.','L’amélioration de Bekke prolonge l’effet dans le profil adapté.','Halo bleu-violet en anneau.','La cible reprend son tour après expiration sans double action.',{nature:'Établi',sourceIds:['GAL-ABIL']}],
['PWR-OVERLOAD','Surcharge des boucliers','Pouvoir technique de Jacob.','Retirer une part de protection avant le tir.','Amélioration liée à Ahn’Kedar. Coefficients proposés, pas valeurs originales.','Éclairs courts au contact de la protection.','La barre de santé ne reçoit pas automatiquement les dégâts de bouclier.',{nature:'Établi',sourceIds:['GAL-ABIL']}],
['PWR-HEAVY','Amélioration de l’attaque lourde','Progression liée à Tortuga.','Augmenter la force de la grenade après la piste.','Une seule attribution de l’amélioration.','Icône plus explicite en plus du symbole +.','Rejouer la mission ne cumule pas le bonus.',{nature:'Établi',sourceIds:['GAL-GUIDE']}]
]);
moves(gal,[['SHOOT','Tir ciblé','Jacob','Confirmer un ennemi puis tirer à la fin de la jauge.','Arme alignée, flash bref.','Un mur interrompt la ligne de tir.'],['STASIS','Neutralisation de priorité','Jacob','Suspendre le préparatif d’un ennemi dangereux.','Main levée puis anneau sur cible.','Les boss réduisent la durée, avec message explicite.'],['GRENADE','Déloger un groupe','Jacob','Utiliser l’explosif sur deux adversaires voisins.','Trajectoire et rayon prévisualisés.','Le couvert peut protéger une partie du groupe.'],['SUPPORT','Appel de Miranda','Miranda à distance','Révéler une faiblesse ou clarifier l’objectif en cours.','Portrait radio animé.','Variante originale facultative, pas un quatrième pouvoir officiel.']]);
rows(gal,'equipment',[
['EQ-SHIELD','Boucliers','Protection rechargeable dans Galaxy.','Barre distincte des points de vie.','Proposition : reprise après une commande de garde sans dégâts.','Contour bleu plus icône.','Une sauvegarde ne restaure pas gratuitement toutes les protections.',{nature:'Établi',sourceIds:['GAL-COMBAT']}],
['EQ-MED','Ramassage de soin','Ramassages présents dans les arènes.','Choix entre atteindre un objet et attaquer.','Quantité de soin proposée affichée avant déplacement.','Capsule et marqueur de sol.','Un ramassage disparaît après attribution unique.',{nature:'Établi',sourceIds:['GAL-COMBAT']}]
]);
rows(gal,'links',[
['LNK-THREE','Les trois pistes','Structure à trois branches.','Carte galactique avec Tortuga, Ahn’Kedar et Bekke disponibles après l’introduction.','Le final requiert les trois états résolus.','Trois destinations séparées, récompense annoncée sur chacune.','Les six ordres possibles atteignent la même porte de fin.',{nature:'Établi',sourceIds:['GAL-BIO','GAL-GUIDE']}],
['LNK-ARENA','Passage entre arènes','Progression du système mobile.','Passage vert remplacé par une porte et un repère 3D.','Actif seulement après résolution de l’arène.','Porte visible sans ouvrir le menu.','Aucune vague résiduelle n’empêche une sortie déjà validée.',{nature:'Établi',sourceIds:['GAL-GUIDE']}]
]);
rows(gal,'side_quests',[
['SIDE-EVAC','Passagers de l’Arcturian Jade','Objectif facultatif original.','Ouvrir une issue de secours et escorter une silhouette civile.','Récompense cosmétique ou journal, sans changer l’ouverture canonique.','Balises de secours discrètes.','Le joueur peut poursuivre même après échec de l’objectif facultatif.'],
['SIDE-DATA','Preuves sur les trois pistes','Extension d’enquête originale.','Photographier une cargaison, récupérer un manifeste et identifier un canal de transmission.','Trois preuves indépendantes, aucune nouvelle révélation canonique ajoutée.','Documents et hologrammes résumés sans copie du texte source.','Le journal distingue preuve obtenue et interprétation de Jacob.'],
['SIDE-REPLAY','Défis d’arènes','Mode original de rejeu.','Rejouer sans toucher à la sauvegarde principale.','Budget de tours proposé avec résultat local.','Grille des arènes et meilleur résultat.','Le défi ne duplique ni objets ni améliorations.']
]);
rows(gal,'choices',[
['CHO-ORDER','Ordre des pistes','Choix attesté de progression.','Afficher l’amélioration attendue pour aider le joueur.','L’ordre affecte l’arsenal disponible, pas l’obligation des trois pistes.','','Tester les six permutations.',{nature:'Établi',sourceIds:['GAL-GUIDE']}],
['CHO-TONE','Ton des échanges','Adaptation de dialogue proposée.','Réponses calme, directe ou question, avec intention affichée.','Changer des réactions locales sans réécrire le dénouement.','Roue compacte textuelle.','Aucune réponse n’impose une conséquence cachée de grande ampleur.'],
['CHO-SUPPORT','Soutien de Nax','Variante de gameplay proposée.','Soutien ponctuel à Ahn’Kedar plutôt qu’un équipier permanent.','Disponibilité liée à la scène de rencontre.','Icône krogan dans la commande d’aide.','Le personnage ne suit pas Jacob dans les cartes où sa présence n’est pas prévue.']
]);
rows(gal,'dialogues',[
['DIA-BRIEF','Briefing des pistes','Situation d’enquête.','Dialogue original de Miranda présentant les trois objectifs.','Chaque piste ajoute une entrée courte au journal.','Portraits 2D et fond 3D du lieu.','Le journal est complet même si la scène est passée.'],
['DIA-EVIDENCE','Présentation des preuves','Situation de confrontation finale.','Résumer les éléments recueillis avec répliques originales.','Le joueur peut revoir les indices sans répéter tout le dialogue.','Gros plan sur le portrait puis retour au Conseil.','Ne pas copier les échanges de l’œuvre source.'],
['DIA-ILLO','Contact avec Illo','Scène d’enquête.','Mettre en scène la vérification du code ou du contact.','Accès obtenu par drapeau de dialogue, pas par devinette aléatoire.','Interphone puis portrait turien.','Un retour au lieu ne bloque pas la porte déjà ouverte.']
]);
rows(gal,'cinematics',[
['CIN-BOARDING','Attaque du paquebot','Mise en scène adaptée.','Plans de la baie, réaction de Jacob, prise du fusil.','Transition vers tutoriel.','Sprites de foule à deux profondeurs, alerte rouge ponctuelle.','Passer la scène place Jacob dans une position sûre.'],
['CIN-REVEAL','Révélation au Conseil','Mise en scène adaptée.','Plans serrés sur les interlocuteurs puis vue large de l’évacuation.','Déclencher le boss après reprise du contrôle.','Plans précomposés dans le décor 3D.','La caméra n’occulte pas la première anticipation ennemie.'],
['CIN-EPILOGUE','Retour à la croisière','Conclusion à référencer.','Épilogue court en portraits et décor réutilisé.','Afficher bilan des pistes et crédits après la scène.','Lumière chaude et absence d’alerte.','Le journal marque la campagne achevée après la scène passée ou lue.']
]);
rows(gal,'props',[
['PRP-EEZO','Caisse d’élément zéro','Accessoire d’enquête proposé.','Boîtier 3D avec cœur 2D lumineux.','Inspection indépendante de la destruction des couverts.','Bleu froid visible sur sol noir de Bekke.','Un tir ne supprime pas l’indice nécessaire.'],
['PRP-CHAIR','Fauteuil de Jath’Amon','Accessoire central à relever.','Sprite composite pour occupant et base mobile.','Le point d’impact reste attaché à la base.','Formes du fauteuil à vérifier dans le jeu.','La silhouette reste reconnaissable dans les huit directions.'],
['PRP-CRATE','Caisses d’arène','Objets destructibles référencés.','Meshes simples et débris en sprites.','État intact, fragilisé, détruit avec collision mise à jour.','Plaques et bandes lisibles.','Un projectile ne reste pas bloqué dans un couvert détruit.']
]);
rows(gal,'animations',[
['ANM-JACOB','Jacob : déplacement et ciblage','Pack original d’animation.','Séparer bas du corps et direction du fusil si le moteur le permet.','8 directions proposées ; pivots stables.','Course claire et arme à deux mains.','Aucun saut de taille lors du retournement.'],
['ANM-PORTRAITS','Portraits de l’enquête','Pack original de portraits.','Quatre expressions pertinentes par interlocuteur.','Transitions courtes ; pas de simulation labiale promettant la voix originale.','Visages non déformés entre expressions.','Le nom du locuteur reste affiché pendant une transition.']
]);
rows(gal,'vfx',[
['VFX-STASIS','Stase lisible','Effet original.','Anneau et motif fixe pour distinguer stase et bouclier.','Durée calée sur l’état de contrôle.','Violet pour stase, bleu pour protection, icônes distinctes.','Compréhensible en niveaux de gris.'],
['VFX-RAIN','Pluie de Bekke','Effet de décor proposé.','Plans de pluie 2D avec occlusion sous les toits.','Intensité réglable et sans gêne pour les marqueurs d’attaque.','Reflets ponctuels au sol.','La pluie ne traverse pas l’interface de dialogue.']
]);
rows(gal,'audio',[
['AUD-INVEST','Musique d’enquête','Composition originale.','Motif court et couches propres à chaque piste.','Transition harmonique lors du choix d’une destination.','','Aucune reprise de la bande originale non fournie.'],
['AUD-JADE','Vie à bord','Ambiance originale du paquebot.','Murmures lointains, ventilation douce, alerte ponctuelle.','Baisse du fond pendant les conversations.','','Boucle propre après chargement et retour d’épilogue.'],
['AUD-POWERS','Retours des trois pouvoirs','Design sonore original.','Son grave pour stase, crépitement pour surcharge, impact sourd pour grenade.','Recharge annoncée par un son facultatif et une icône.','','Les trois actions sont reconnaissables à faible volume.']
]);
common(gal,'Galaxy','Conserver ordre des pistes, améliorations acquises, preuves et arène de reprise. Les variantes locales ne décident pas d’une romance ME2.','Le calendrier exact est signalé comme à vérifier. Les contrôles ATB et l’escouade éventuelle sont des adaptations. Aucun déblocage distant dans Mass Effect 2 n’est promis.');
add(gal,'continuity','CNT-DATE','Chronologie publiée divergente','L’annonce BioWare place Galaxy entre ME1 et ME2 ; les index de récit donnent des repères de 2183 difficiles à concilier.','Afficher une position relative provisoire et garder une note de vérification.','Ne pas imposer de date précise dans les sauvegardes.','','La contradiction est visible et ne se transforme pas en correction silencieuse.',{nature:'À vérifier',sourceIds:['GAL-BIO','GAL-STORY','GAL-JATH'],priority:'P0'});

const me4=book('ME4','Mass Effect 4 : extrapolation du projet annulé','Projet annulé et campagne fan originale','Registre des annonces publiques puis proposition complète de module intitulé Les Routes du silence.','Une équipe rétablit des liaisons entre communautés isolées et enquête sur un signal qui imite des messages anciens. Le conflit porte sur le contrôle de ce réseau.','Mass Effect 4 est ici un nom de travail. EA et BioWare ont annoncé l’arrêt du projet le 21/10/2026. Aucun scénario officiel complet n’a été consulté. Le casting, les lieux nouveaux, les missions, les boss et les fins ci-dessous sont des créations pour Relay Chronicles.',[
src('ME4-STOP','EA : Building EA’s Next Chapter','https://www.ea.com/news/building-eas-next-chapter','Source officielle','Annonce du 21/10/2026 : arrêt du développement précoce du prochain Mass Effect.'),
src('ME4-BIO','BioWare Update','https://blog.bioware.com/2026/10/21/bioware-update/','Source officielle','Confirmation de l’arrêt du projet et de la fermeture du studio.'),
src('ME4-2020','Happy N7 Day 2020','https://blog.bioware.com/2020/11/07/happy-n7-day-4/','Source officielle','Annonce d’un nouveau chapitre en phase précoce.'),
src('ME4-2022','N7 Day 2022','https://blog.bioware.com/2022/11/07/n7-day-2022/','Source officielle','Préproduction et diffusion de séquences de station de surveillance.'),
src('ME4-2023','N7 Day 2023','https://www.ea.com/games/mass-effect/mass-effect-legendary-edition/news/n7-day-2023','Source officielle','Questions de continuité évoquées par Mike Gamble, visuels promotionnels.'),
src('ME4-PORTAL','Portail officiel Mass Effect','https://www.ea.com/games/mass-effect','Source officielle','Accès au teaser du prochain chapitre.','La présence d’un ancien teaser sur le portail ne remplace pas l’annonce d’arrêt du 21/10/2026.')
]);
cast(me4,[
['ROOK','Rook','Protagoniste créé pour le fan game.','Commandant·e personnalisable, spécialiste des opérations de relais.','Manteau court asymétrique proposé, armure charbon, repères blancs et lampe orange. Ne pas identifier au personnage du teaser.','8 directions, commande de groupe de la main libre, tir et raccord manteau sans traversée.'],
['VEYRA','Veyra Sen','Asari originale, cartographe.','Contrôle biotique et lecture des anomalies.','Silhouette haute, tunique technique bleu pétrole, instruments de mesure suspendus.','Main qui trace un arc, posture d’écoute, recul lors d’une surcharge.'],
['TARIK','Tarik Venn','Turien original, ingénieur de pont.','Déploiement de couvert et interruption technologique.','Crête fine, plaques cuivrées, sac de relais dorsal.','Pose agenouillée, outil à deux bras, tir stable et marche digitigrade.'],
['KHELA','Khela vas Rannoch','Quarienne originale, archiviste.','Analyse des signaux et drones de reconnaissance.','Combinaison graphite, voile sable, motifs fins propres au personnage.','Projection de carte, déploiement de drone, marche prudente.'],
['DORN','Urdnot Dorn','Krogan original, médiateur.','Protection de l’équipe et négociation de passage.','Armure vert sombre, épaulière usée, outils civils autant que militaires.','Prise d’appui large, garde frontale, levée d’un obstacle.'],
['SIRIN','Sirin','Salarien original, logistien.','Gestion des consommables et leurres tactiques.','Veste claire à poches, lunettes de travail, couleurs ocre et gris.','Gestes précis, rythme rapide, rechargement de dispositif.']
],'ME4-2023');
for(const [key,name,role,look] of [
['ANJA','Anja Vale','Responsable d’une communauté qui dépend des convois.','Tenue civile renforcée, tablette de distribution.'],
['KEST','Kest Ralos','Capitaine indépendant qui vend des routes de passage.','Manteau de bord, harnais et cicatrices dessinées originales.'],
['CURATOR','Le Conservateur','Interface d’une archive autonome créée pour l’intrigue.','Visage abstrait fait de rectangles de mémoire, jamais un Moissonneur supposé.'],
['NEME','Neme Raal','Négociatrice batarienne à la tête d’une coalition locale.','Tenue de travail soignée, palette bleu acier et cuivre.'],
['ARCHIVIST','Émissaire de l’Ombre','Contact original servant d’accès à des archives.','Portrait volontairement anonyme ; aucun retour de personnage annoncé comme officiel.']])
 add(me4,'npcs',`NPC-${key}`,name,'Personnage original.',role,'Échanges fondés sur preuves, ressources et engagements tenus.',look,'La biographie et les dialogues portent la mention adaptation.');
place(me4,[
['WAYFARER','Wayfarer','Vaisseau original de l’équipe.','Pont, salon commun, atelier, infirmerie et soute reliés par coursive centrale.','Coque de récupération, lumière ambre, surfaces métalliques réparées.','Une amélioration visible correspond à chaque investissement, sans changer les collisions du passage.'],
['MERCY','Port Miséricorde','Habitat orbital original.','Anneau public, quai de fret, niveau agricole et atelier de route.','Blanc jauni, jardins hydroponiques, bâches turquoise et hublots étroits.','Trafic de civils ; les combats restent sur des quais séparés.'],
['GLASS','Mer de verre','Monde original à surface vitrifiée.','Plateau d’arrivée, canyon réfléchissant, station enfouie et refuge.','Verre noir, poussière rose, ciel pâle, panneaux solaires brisés.','Reflets désactivables et abris contre les balayages énergétiques.'],
['KNOT','Nœud 17','Chantier de relais original.','Docks, ossature annulaire, capsules de maintenance et chambre de commande.','Échelle monumentale, nacelles blanches, rails jaunes et vide spatial.','Faible gravité contrôlée par séquences, sans modifier arbitrairement les déplacements.'],
['MEMORY','Archive des voix','Installation originale.','Vestibule, chambres d’archives, salle des copies et cœur de stockage.','Basalte synthétique, fins volumes de lumière, reflets mats.','Fausses portes signalées par contradiction d’indices, jamais par hasard.'],
['TIDE','Chantier de la Marée','Colonie industrielle originale.','Digue, pompes, quartier surélevé et tour de négociation.','Béton salin, eau sombre, grues basses et drapeaux de convois.','Niveau de l’eau prévisible lié à deux vannes accessibles.']
],'ME4-2023');
missions(me4,[
['01','01. Le convoi muet','Chapitre original.','Secourir un transport immobilisé et découvrir un signal contradictoire.','Petit quai, deux voies de sauvetage et refuge.','Ouverture indépendante de la fin choisie de ME3.'],
['02','02. Une route à payer','Chapitre original.','Obtenir un accès au chantier du relais par négociation ou réparation.','Hub Port Miséricorde puis atelier.','Convoi secouru.'],
['03','03. Sous le verre','Chapitre original.','Récupérer un étalon de synchronisation dans la station ensevelie.','Canyon avec soleil rasant et accès inférieur.','Accès au chantier accepté.'],
['04','04. Les gardiens du nœud','Chapitre original.','Désactiver une défense automatique sans détruire la structure.','Trois nacelles autour du Nœud 17.','Étalon récupéré.'],
['05','05. Deux demandes de secours','Chapitre original.','Départager une transmission réelle et une copie fabriquée.','Enquête dans le vaisseau puis deux points d’approche.','Premier relais local réactivé.'],
['06','06. La Marée monte','Chapitre original.','Stabiliser les pompes et négocier une évacuation.','Digue avec deux hauteurs et tour civile.','Source du véritable appel identifiée.'],
['07','07. Le prix des archives','Chapitre original.','Accéder aux données et découvrir la fonction du Conservateur.','Salles de mémoire avec chemins alternatifs.','Accord ou aide de la coalition.'],
['08','08. Les passagers du signal','Chapitre original.','Identifier les copies de voix sans les confondre avec leurs personnes d’origine.','Exploration sociale et consoles d’analyse.','Archive ouverte.'],
['09','09. Le relais assiégé','Chapitre original.','Protéger le chantier pendant une tentative de prise de contrôle.','Arènes reliées avec priorités de secours.','Origine du signal comprise.'],
['10','10. Le droit de passage','Chapitre original.','Choisir un mode de gouvernance des routes et désamorcer le cœur de contrôle.','Salle de négociation puis arène de régulation.','Siège résolu.'],
['11','11. Une voix dans le silence','Chapitre original.','Conclure selon les engagements tenus et ouvrir un épilogue local.','Vaisseau, vues des communautés puis générique.','Décision de gouvernance appliquée.']
],'ME4-2023');
rows(me4,'lore',[
['LOR-COALITION','Coalition des Routes','Faction originale.','Communautés unies par un besoin logistique commun.','Chaque accord exige une contrepartie locale vérifiable.','Symboles de nœuds reliés, palette cuivre.','Le codex ne confond pas coalition fan et Conseil officiel.'],
['LOR-SIGNAL','Copies de voix','Hypothèse de science-fiction originale.','Une archive assemble des enregistrements pour simuler des appels.','Preuves techniques imparfaites et témoignages humains distincts.','Ondes avec segments manquants.','Aucune copie n’est présentée comme une résurrection prouvée.'],
['LOR-REBUILD','Reconstruction des routes','Cadre original compatible avec plusieurs états de galaxie.','Limiter le récit à une région et à ses routes locales.','Les différences de fin de ME3 modifient contexte et dialogues, pas une vérité officielle imposée.','Cartes fragmentaires.','Le journal indique explicitement le profil de continuité sélectionné.'],
['LOR-N7','Héritage N7','Usage de référence dans une histoire fan.','Rook peut avoir une qualification choisie, sans être Shepard.','Profil militaire à définir au départ.','Insigne séparé du visage et de la classe.','Aucune identité du teaser n’est révélée par le catalogue.']
]);
enemies(me4,[
['SCAV','Récupérateur armé','Adversaire original.','Tir opportuniste puis déplacement vers une ressource.','Armure bricolée, sac de récupérateur.','Prendre le contrôle de la ressource ou négocier avant le combat.'],
['JAMMER','Brouilleur de route','Drone original.','Retarde les pouvoirs techniques dans un rayon visible.','Anneau tournant et trois antennes.','Briser l’antenne ou sortir du rayon.'],
['ANCHOR','Garde d’ancrage','Automate original.','Protège un point fixe et accumule de l’énergie.','Jambes larges et cœur en forme de verrou.','Détruire les câbles externes pendant la charge.'],
['ECHO','Projection Écho','Simulation originale.','Imite la dernière attaque du joueur avec un retard.','Silhouette à double contour et fragments transparents.','Utiliser une garde ou une attaque faible pour changer le motif.'],
['SENTINEL','Sentinelle du Nœud 17','Boss original.','Trois bras protègent successivement un régulateur central.','Structure en anneaux, bras très distincts.','Désactiver les bras dans un ordre choisi, avec danger restant explicite.'],
['WARDEN','Gardien de la digue','Boss original.','Déclenche des vagues à travers les vannes de l’arène.','Châssis amphibie bas, bouclier frontal.','Changer de hauteur et ouvrir une vanne opposée.'],
['ARCHON','Mandataire du Conservateur','Boss final original, sans lien avec l’Archonte kett.','Alterne copie, verrouillage de commandes et exposition du cœur.','Volume fait de panneaux d’archive et d’un noyau sombre.','Sauvegarder une commande de rupture pendant la phase copie.']
],'ME4-2023');
for(const [key,name,rule,look] of [
['CARBINE','Carabine de convoi','Tir fiable sur une cible ; surchauffe proposée après trois tirs consécutifs.','Canon court avec pièces de rechange apparentes.'],
['ARC','Projecteur d’arc','Dégâts technologiques proposés sur deux cibles reliées ; faible efficacité sur l’armure.','Crosse isolée et deux électrodes.'],
['BREACH','Fusil de brèche','Frappe rapprochée qui ouvre une faiblesse d’armure pendant un tour.','Corps large, chargeur visible et poignée renforcée.'],
['MARK','Fusil de cartographe','Visée longue qui marque une faiblesse si le tireur reste immobile.','Lunette double et peinture bleu pétrole.']])
 add(me4,'weapons',`WPN-${key}`,name,'Arme originale.',rule,`Valeurs de départ proposées : ${rule}`,look,'Aucun nom de modèle officiel n’est utilisé pour prétendre une existence canonique.');
rows(me4,'equipment',[
['EQ-ANCHOR','Module d’ancrage','Équipement original.','Empêcher un déplacement forcé au prix d’une vitesse ATB réduite.','Réglage proposé : une charge par rencontre.','Semelles et témoin d’état.','Une fois consommé, le module ne se recharge pas par changement d’équipement.'],
['EQ-ECHO','Filtre Écho','Équipement original.','Révéler la cible d’une prochaine imitation.','Réglage proposé : choix entre renseignement et protection brute.','Verre sombre parcouru d’une ligne claire.','L’information révélée est exacte même après chargement.'],
['EQ-DRONE','Drone de balisage','Équipement original.','Poser une balise de déplacement ou une cible de diversion.','Réglage proposé : une balise active par équipier.','Coque claire et lumière orange.','Créer une seconde balise retire la première sans doublon.'],
['EQ-SUIT','Combinaison de maintenance','Équipement original.','Protéger dans le vide lors des séquences du chantier.','Les séquences dangereuses possèdent un retour sûr.','Harnais et casque cohérents en huit directions.','Aucune scène de vide n’utilise la variante sans casque.']
]);
const newPowers=[
['ROOK','Coordination', 'Transférer une fraction de jauge à un allié dont la jauge est incomplète.','Débiter la jauge de Rook avant le transfert ; plafonner la cible à une jauge pleine. Aucun transfert ne crée de charge supplémentaire.'],
['VEYRA','Courbe de masse','Déplacer une zone de danger d’un emplacement annoncé.','Coût proposé : une jauge complète et une recharge de deux tours.'],
['TARIK','Pont de phase','Poser un couvert temporaire entre le groupe et un tireur.','Durée proposée : deux actions hostiles ; pas de blocage de sortie.'],
['KHELA','Lecture d’empreinte','Révéler le prochain motif d’une projection Écho.','Ne fonctionne pas sur un adversaire organique sans signal.'],
['DORN','Tenir le passage','Intercepter une attaque dirigée vers un allié proche.','Dorn subit l’impact et ne peut agir pendant l’interception.'],
['SIRIN','Leurre logistique','Attirer un récupérateur vers une fausse ressource.','L’ennemi découvre le leurre après une action ; immunité temporaire ensuite.']
];
for(const [key,name,rule,cost] of newPowers){add(me4,'powers',`PWR-${key}`,name,'Pouvoir original.',rule,`${rule} ${cost}`,'Symbole propre à la fonction, couleur et nom simultanés.','Le coût est prévisualisé et retiré une seule fois.',{dependencies:[`ME4-CHR-${key}`]});}
moves(me4,newPowers.map(([key,name,rule,cost])=>[key,name,key,rule,'Pose de préparation propre au personnage. Effet dirigé vers la cible.',cost]));
rows(me4,'choices',[
['CHO-CONVOY','Répartir l’escorte','Choix original.','Affecter deux spécialistes aux vivres ou au personnel technique.','Conséquence locale visible, personnes protégées selon le résultat du combat.','Carte du convoi avec distances lisibles.','La conséquence annoncée correspond au choix, sans mort hors champ arbitraire.'],
['CHO-ARCHIVE','Conserver les copies','Choix original.','Désactiver les appels automatiques tout en conservant, isolant ou effaçant l’archive.','Trois états incompatibles, journal et épilogue dédiés.','Console avec aperçu de ce qui sera perdu.','Une confirmation décrit l’effet concret et ne se répète pas après validation.'],
['CHO-ROUTES','Gouvernance des routes','Choix final original.','Réseau partagé, délégation locale ou accès limité.','Conséquences sur convois, sécurité et autonomie, sans fin parfaite cachée.','Trois cartes du réseau comparables.','Chaque issue possède une scène de résultat et un état de sauvegarde distinct.'],
['CHO-IMPORT','Profil de galaxie','Choix de continuité fan.','Importer une fin ME3 connue ou sélectionner un contexte neutre explicite.','Ne pas annoncer une fin officielle pour le projet annulé.','Menu textuel avant campagne.','Le profil est rappelé dans le journal et reste modifiable uniquement avant une nouvelle campagne.']
]);
rows(me4,'side_quests',[
['SIDE-VEYRA','Les mesures manquantes','Mission de personnage originale.','Aider Veyra à corriger une carte qui a mis un convoi en danger.','Comparer trois relevés et assumer publiquement la correction.','Observatoire à ciel ouvert sur la Mer de verre.','La résolution repose sur les indices réunis, pas sur une stat invisible.'],
['SIDE-TARIK','Un pont pour tous','Mission de personnage originale.','Tarik doit choisir entre réparer vite ou rendre le passage accessible à des charges lourdes.','Deux itinéraires, ressources et résultat visibles.','Passerelle en treillis avec zones de sécurité.','Les deux solutions restent traversables après chargement.'],
['SIDE-KHELA','Noms sans visages','Mission de personnage originale.','Khela classe des messages que l’archive attribue à tort.','Comparer métadonnées et témoignages.','Chambre de consultation avec portraits anonymisés.','Le journal ne traite pas une voix imitée comme témoignage réel.'],
['SIDE-DORN','La table commune','Mission de personnage originale.','Dorn organise une négociation entre transporteurs rivaux.','Invitations, preuve de bonne foi et médiation ; combat facultatif évitable.','Cantine du port.','Le succès diplomatique procure une issue complète.'],
['SIDE-SIRIN','Dernière caisse','Mission de personnage originale.','Sirin suit la disparition d’une cargaison de soins.','Piste de stock, enquête et réallocation sans vol récompensé par erreur.','Dépôts à casiers et balances.','Les quantités du journal restent cohérentes dans toutes les branches.']
]);
rows(me4,'links',[
['LNK-LOCAL','Réseau régional','Topologie originale.','Wayfarer vers Port Miséricorde ; trois routes locales déverrouillées par le chantier.','Prévoir retour depuis chaque destination avant le final.','Carte de nœuds avec état de service.','Aucune route ne dépend d’un relais supposé officiel du jeu annulé.'],
['LNK-ARCHIVE','Accès aux archives','Transition originale.','Deux chemins : accord logistique ou réparation du pont.','Les chemins rejoignent le même vestibule avec des réactions différentes.','Portes distinctes mais repères identiques à l’intérieur.','L’entrée alternative ne contourne pas l’explication du système de copies.'],
['LNK-FINAL','Point de non-retour','Règle de progression.','Vérifier quêtes de personnages et afficher les demandes non résolues avant le siège.','Sauvegarde dédiée et retour au hub possible avant confirmation.','Écran de préparation sobre.','Le final ne démarre pas en ouvrant simplement la carte.']
]);
rows(me4,'props',[
['PRP-BEACON','Balise de convoi','Objet original.','Support 3D et halo 2D, manipulable en exploration.','État actif lié à la route ouverte.','Boîtier blanc, orange et acier.','Balise et carte partagent le même état de service.'],
['PRP-VALVE','Vanne de digue','Objet original.','Volant mécanique lisible avec repère de sens.','Changer le niveau d’eau une seule fois par résolution.','Peinture écaillée et axe central.','La position visuelle suit l’état de collision de l’eau.'],
['PRP-RECORD','Bobine de mémoire','Objet original.','Capsule d’archive avec prévisualisation textuelle.','Une copie peut être consultée sans être importée dans le journal principal.','Verre mat et repère lumineux.','Chaque consultation indique l’origine réelle ou simulée du message.'],
['PRP-SKIFF','Skiff de maintenance','Véhicule original.','Navette courte sur rail de maintenance.','Séquence de déplacement dirigée entre deux plateformes.','Cabine ouverte, harnais, moteur dorsal.','Le joueur garde une possibilité de reprendre après une chute.']
]);
rows(me4,'dialogues',[
['DIA-COUNCIL','Conseil des transporteurs','Scène originale.','Comparer besoins de nourriture, accès et sécurité avec réponses reformulées.','Les répliques dépendent des engagements réellement tenus.','Table holographique et trois portraits.','Aucun participant ne félicite un engagement rompu.'],
['DIA-VOICE','Une voix familière','Scène originale.','Proposer un doute, puis une vérification ; ne pas identifier un ancien personnage sans preuve.','Le joueur peut différer la réponse et consulter les données.','Onde et transcription partielle.','La scène conserve sa force sans reprendre une voix d’acteur existant.'],
['DIA-CREW','Désaccord de l’équipe','Scène originale.','Chaque équipier défend une conséquence concrète du choix des routes.','Pas de perte automatique d’un compagnon pour un simple désaccord.','Positions autour du salon du Wayfarer.','Les avis reflètent les événements vus par chaque personnage.']
]);
rows(me4,'cinematics',[
['CIN-OPEN','Approche du convoi','Séquence originale.','Vue du Wayfarer, transmission brisée, premier abordage.','Pas de promesse d’identité liée aux teasers officiels.','Vaisseau 3D lointain, équipage en sprites.','L’objectif du premier chapitre est clair après trente secondes proposées.'],
['CIN-RELAY','Réveil du nœud','Séquence originale.','Montrer d’abord le changement de lumière, puis les nacelles et la route ouverte.','La géométrie animée garde des zones sûres.','Anneaux lents, lignes de champ fines.','La séquence ne provoque ni flash excessif ni collision tardive.'],
['CIN-END','Épilogues régionaux','Séquences originales.','Présenter les communautés affectées, puis la vie à bord.','Une variante par état de gouvernance et par mission de compagnon résolue.','Plans réutilisés avec changements visibles.','Les légendes décrivent des conséquences spécifiques plutôt qu’une note morale globale.']
]);
rows(me4,'animations',[
['ANM-COAT','Manteau de Rook','Pack d’animation original.','Deux silhouettes de volume selon la direction, sans simulation textile complète.','Limiter les variations au cycle de course et aux arrêts.','Pans courts compatibles avec accroupissement.','Aucune traversée de jambes ou d’arme dans les poses clés.'],
['ANM-INTERCEPT','Interception de Dorn','Pack d’animation original.','Départ, déplacement court, garde, impact et retour.','Annuler proprement si la cible n’est plus menacée.','Masse et appuis lisibles.','Le retour au point d’origine ne traverse pas les autres sprites.'],
['ANM-ECHO','Copie différée','Animation originale de projection.','Rejouer le geste enregistré avec retard visible et contours fragmentés.','Mettre en cache une pose autorisée sans copier des animations absentes.','Géométrie légèrement décalée.','La copie ne devient jamais invisible quand le personnage source meurt.']
]);
rows(me4,'vfx',[
['VFX-ROUTE','Champ de route','Effet original.','Lignes courbes reliant les nœuds activés.','Luminosité plafonnée et désactivation des flashes.','Blanc bleuté à accents ambre.','La route reste compréhensible en mode effets réduits.'],
['VFX-ECHO','Signal imité','Effet original.','Décaler deux formes d’onde sans clignotement rapide.','La légende explique ce que montre le décalage.','Cyan et contour pointillé.','Ne pas présenter un effet visuel comme preuve suffisante de vérité.'],
['VFX-WATER','Montée de l’eau','Effet original.','Surface 3D simple, mousse en sprites et repère de hauteur.','Synchroniser collision, son et accès.','Eau sombre sans miroir instable.','Le changement de niveau reste visible à toutes les caméras.']
]);
rows(me4,'audio',[
['AUD-WAYFARER','Vie du Wayfarer','Composition et ambiance originales.','Ventilation irrégulière, communications courtes, musique chaleureuse au salon.','Évolution sonore selon réparations terminées.','','La progression du vaisseau s’entend sans augmenter le volume global.'],
['AUD-SIGNAL','Voix reconstruites','Création audio originale.','Acteurs ou voix autorisées avec traitement léger et sous-titres.','Ne pas cloner ni attribuer la voix d’un acteur de Mass Effect.','','L’interface indique quand une transmission est simulée.'],
['AUD-NODE','Le chant du chantier','Paysage sonore original.','Vibration grave, métaux et pulses espacés.','Couper la basse continue dans le mode fatigue auditive.','','Les alertes de sécurité restent distinctes du fond.']
]);
common(me4,'Les Routes du silence','Conserver gouvernance des routes, intégrité de l’archive, communautés aidées, missions d’équipiers et profil de continuité choisi.','Aucun retour de Shepard, date, fin de ME3 ou pont vers Andromeda n’est posé comme canon officiel du projet annulé. Les personnages nommés ici sont des créations de fan game.');
// Tous les éléments de design créés au-dessus sont originaux, y compris ceux qui utilisent un helper commun.
for(const e of me4.entries){e.nature='Extrapolation';e.sourceIds=[];e.reference='Les Routes du silence, conception originale';if(e.notes.includes('jeu source'))e.notes='Référence de production interne à créer. Aucun modèle officiel du projet annulé disponible pour cet élément.';}
rows(me4,'continuity',[
['REF-STOP','Arrêt du développement le 21 octobre 2026','EA annonce ne pas poursuivre le prochain Mass Effect ; BioWare confirme l’arrêt.','Conserver le dossier comme extrapolation datée.','','','Le titre et le guide ne le présentent pas comme une sortie officielle future.',{nature:'Établi',sourceIds:['ME4-STOP','ME4-BIO'],priority:'P0',reference:'Annonces du 21/10/2026'}],
['REF-2020','Annonce du nouveau chapitre en 2020','Une équipe expérimentée travaillait à un nouveau chapitre, encore précoce.','Archiver ce jalon comme historique du projet.','','','Ne pas le lire comme une confirmation de personnages ou de scénario.',{nature:'Établi',sourceIds:['ME4-2020'],reference:'N7 Day 2020'}],
['REF-2022','Préproduction et images en 2022','BioWare décrivait une préproduction et diffusait un extrait de surveillance.','Établir une fiche de référence par visuel avant toute reproduction.','','','Les hypothèses sur les images restent distinctes de leur description.',{nature:'Établi',sourceIds:['ME4-2022'],reference:'N7 Day 2022'}],
['REF-2023','Questions de continuité en 2023','Le message de Mike Gamble évoquait les personnages, les galaxies et les fins sans donner un scénario complet.','Garder un registre des questions ouvertes.','','','Aucune question promotionnelle n’est transformée en réponse officielle.',{nature:'Établi',sourceIds:['ME4-2023'],reference:'N7 Day 2023'}],
['REF-IDENTITY','Identité du protagoniste du teaser','Identité non établie dans le corpus consulté.','Rook est une création indépendante de cette silhouette.','','','Aucune fiche ne conclut que la silhouette est Shepard ou Liara.',{nature:'À vérifier',sourceIds:['ME4-2023','ME4-PORTAL'],reference:'Teasers'}],
['REF-TITLE','Titre et numérotation','Mass Effect 4 est le nom de travail demandé pour ce dossier.','Afficher Extrapolation dans le titre du classeur.','','','Ne pas confondre ce nom avec un titre commercial confirmé.',{nature:'À vérifier',sourceIds:['ME4-PORTAL'],reference:'Périmètre du dossier'}]
]);
me4.coverage=categories.map(c=>({area:c,covered:c==='continuity'?'Jalons publics 2020–2026, arrêt officiel et hypothèses explicitement séparées.':'Design original du module Les Routes du silence dans ce domaine.',remaining:'Ce contenu ne peut pas être certifié 1:1 avec un jeu annulé dont le scénario complet n’a pas été publié dans les sources consultées. Production et tests à réaliser.'}));

const cut=book('CUT','Mass Effect : contenus coupés et concepts abandonnés','Dossier transversal','Registre de pistes ME1, ME2, ME3 et Andromeda, distinctions d’édition et propositions de reconstruction facultative.','Chaque cas conserve sa provenance, son niveau de preuve et une spécification d’adaptation isolée de la campagne de référence.','Un fichier inutilisé, un dessin préparatoire, un témoignage et un mod de restauration ne prouvent pas le même état de production. Les index wiki sont des pistes à contrôler dans les sources primaires. Les reconstructions et chiffres de gameplay sont originaux.',[
src('CUT-ME1','Mass Effect Cut Content','https://masseffect.fandom.com/wiki/Mass_Effect_Cut_Content','Wiki indexé','Index ME1 : lieux, missions, systèmes et pistes de DLC.','Ouverture directe refusée ; extrait indexé détaillé consulté. Les fichiers et documents cités n’ont pas été audités individuellement.'),
src('CUT-CALESTON','Caleston (Cut)','https://masseffect.fandom.com/wiki/Caleston_(Cut)','Wiki indexé','Version abandonnée de Caleston/Throw Down, distincte du Caleston publié dans ME2/ME3.'),
src('CUT-ME2','Mass Effect 2 Cut Content','https://masseffect.fandom.com/wiki/Mass_Effect_2_Cut_Content','Wiki indexé','Index ME2 : recrutement, loyautés, répliques et systèmes.','Ouverture directe refusée ; extrait indexé détaillé consulté. Aucun asset extrait ni script officiel reproduit.'),
src('CUT-LEGION','Legion : Cut Content','https://masseffect.fandom.com/wiki/Legion','Wiki indexé','Acquisition de Legion envisagée plus tôt et réactions inutilisées.'),
src('CUT-FINAL','The Final Hours of Mass Effect 3','https://www.me3finalhours.com/','Publication originale','Notice de Geoff Keighley : prototype Team Assault et boss de l’Homme Trouble abandonné.','Notice publique consultée ; le livre interactif complet n’est pas reproduit.'),
src('CUT-ANDERSON','The Final Hours, chapitre 10','https://masseffect.fandom.com/wiki/The_Final_Hours_of_Mass_Effect_3/Chapter_10:_The_Darkest_Hours','Transcription wiki','Témoignage de Mac Walters sur le raccourcissement de la scène d’Anderson.','Transcription indexée consultée, vidéo originale à contrôler avant montage.'),
src('CUT-DARK','Entretien Karpyshyn rapporté par PC Gamer','https://www.pcgamer.com/mass-effect-3-series-former-lead-writer-reveals-original-ending-ideas/','Presse citant un auteur','Pistes d’énergie noire décrites comme peu développées.'),
src('CUT-PINNACLE','Entretien Mac Walters sur Pinnacle Station','https://www.gamespot.com/articles/why-mass-effects-pinnacle-station-isnt-in-the-legendary-edition/1100-6487087/','Entretien','DLC publié, absent de Legendary Edition à cause de données corrompues.'),
src('CUT-ARK','BioWare : Andromeda update','https://blog.bioware.com/2017/08/19/mass-effect-andromeda/','Source officielle','Annonce 2017 de fin des mises à jour solo et poursuite de récits en livres/comics.'),
src('CUT-JACK','Témoignage Brian Kindregan sur Jack','https://www.gamespot.com/articles/mass-effect-2s-jack-was-supposed-to-be-pansexual-until-fox-news-got-in-the-way/1100-6486662/','Presse citant un auteur','Développement de la romance de Jack et restriction ultérieure.'),
src('CUT-INDOC','Témoignage Chris Hepler sur l’endoctrinement','https://www.gamesradar.com/mass-effect-3s-indoctrination-fan-theory-is-incorrect-but-the-devs-love-it/','Presse citant un auteur','La théorie d’endoctrinement n’est pas décrite comme intention scénaristique.'),
src('CUT-STOP','EA : arrêt du prochain Mass Effect','https://www.ea.com/news/building-eas-next-chapter','Source officielle','Projet annulé le 21/10/2026, traité dans un classeur séparé.')
]);
const cases=[
['CALESTON','worlds','Caleston et Throw Down','Hub abandonné répertorié.','À vérifier','CUT-CALESTON','Reconstituer une place minière, une raffinerie et deux accès aux ruines.','Carte alternative à Therum, sélection explicite avant campagne ; ne pas remplacer les sauvegardes de référence.','Ciel jaune-vert et architecture industrielle à contrôler sur concepts.'],
['MISERY','worlds','Misery','Hub coupé signalé.','À vérifier','CUT-ME1','Créer un petit avant-poste d’exploration à partir des plans attestés lorsqu’ils seront réunis.','Quatre services séparés : cartographie, atelier, renseignements et contrats.','Architecture modulaire basse, vue d’ensemble à relever dans les documents.'],
['GLOBAL1','side_quests','Global Plot 1','Piste de mission inutilisée.','À vérifier','CUT-ME1','Enquête optionnelle sur des sujets biotiques, avec preuves et issues de protection.','Ne reprendre aucun nom ou dénouement absent d’une source vérifiée.','Laboratoire et refuge conçus comme espaces contrastés.'],
['GLOBAL2','side_quests','Global Plot 2','Piste de mission inutilisée.','À vérifier','CUT-ME1','Enquête économique sur un système automatisé, avec simulation abstraite.','Les décisions portent sur des flux fictifs, sans règles financières réelles.','Bureau de transactions, serveurs et cartes de données.'],
['GLOBAL3','side_quests','Global Plot 3','Piste de conflit hanar/lystheni.','À vérifier','CUT-ME1','Construire une médiation optionnelle en conservant un registre des inconnues.','N’inventer ni culture complète ni position officielle des espèces.','Deux ambassades temporaires, silhouettes à documenter.'],
['REFINERY','side_quests','Caleston: Reactivate Production','Affectation coupée répertoriée.','À vérifier','CUT-CALESTON','Réparer trois éléments de raffinerie avec accès interdépendants.','Réglage original : une ressource d’alimentation partagée et trois sorties sûres.','Pompes, valves et passerelles.'],
['GANGS','main_quests','Caleston: Last Man Standing','Mission coupée répertoriée.','À vérifier','CUT-CALESTON','Dessiner une structure d’enquête sur les groupes du hub.','Proposer infiltration, médiation ou combat, en les distinguant des scripts récupérés.','Place commune, bureaux et locaux de stockage.'],
['MARS','side_quests','Projet DLC Mars','Projet de DLC répertorié.','À vérifier','CUT-ME1','Dossier d’un site de fouille, sans le confondre avec la mission Mars de ME3.','Module autonome et chronologie dédiée.','Dunes rouges, habitat pressurisé et fouille souterraine.'],
['BRAIN','side_quests','Cerberus Brainchild','Projet de DLC répertorié.','À vérifier','CUT-ME1','Dossier d’enquête séparé sur la structure de Cerberus envisagée à cette étape.','Éviter de révéler rétroactivement des informations non connues de Shepard.','Laboratoire discret et architecture civile.'],
['CORP','side_quests','Evil Corp','Nom de travail de DLC répertorié.','À vérifier','CUT-ME1','Concevoir un audit narratif de société fictive et des choix d’exposition des preuves.','Aucune identité de PNJ ajoutée sans marquage original.','Campus d’entreprise et aile de recherche.'],
['X57','main_quests','UNC: Bring Down the Sky','Version antérieure à X57.','À vérifier','CUT-ME1','Comparer fonctions de mission conservées et supprimées.','Séparer deux modules pour éviter le doublon de récompenses et de décisions.','Astéroïde et installations comparés aux niveaux publiés.'],
['INTERRUPT','systems','Interruptions de ME1','Mécanique ancienne signalée.','À vérifier','CUT-ME1','Tester une interruption de conversation avec aperçu d’intention.','Distinguer cette version des interruptions contextuelles de ME2.','Prompt court, discret et accessible.'],
['ROUT','powers','Rout','Talent inutilisé répertorié.','À vérifier','CUT-ME1','Définir une variante de démoralisation uniquement comme hypothèse de gameplay.','Valeur proposée : retarder une action légère ; immunité des boss affichée.','Onde courte et réaction de recul.'],
['CAMO','powers','Camouflage de ME1','Talent inutilisé répertorié.','À vérifier','CUT-ME1','Tester une furtivité courte compatible avec caméra fixe.','Ne pas importer automatiquement les règles du camouflage de ME2.','Liseré de silhouette et désaturation.'],
['LILITH','characters','Lilith jouable à Horizon','Séquence envisagée signalée.','À vérifier','CUT-ME2','Prologue d’évacuation civile avec options de mise à l’abri.','Pas d’arsenal de Shepard attribué au personnage.','Tenue coloniale à relever, gestes de fuite.'],
['CHANDANA','enemies','Dr Chandana comme boss','Affrontement coupé signalé.','À vérifier','CUT-ME2','Prototype facultatif de confrontation à distance.','Ne pas présenter les phases imaginées comme des attaques récupérées.','Silhouette et transformation non fabriquées comme canon.'],
['KASUMI','main_quests','Recrutement de Kasumi sur Illium','Variante de recrutement signalée.','À vérifier','CUT-ME2','Parcours de toits et fuite avec tirs venus du ciel.','Gardes de sécurité et accès ne changent pas le recrutement publié sans profil alternatif.','Terrasses urbaines et passerelles.'],
['ZAEED','main_quests','Recrutement de Zaeed sur Korlus','Variante de recrutement signalée.','À vérifier','CUT-ME2','Parcours d’épave, rencontre et extraction.','Séparer ce recrutement de la mission de loyauté.','Ferraille, grues et carcasses.'],
['NIKET','choices','Niket peut survivre','Issue inutilisée suggérée par données.','À vérifier','CUT-ME2','Créer un embranchement alternatif isolé.','La survie reste dans un espace de sauvegarde distinct, sans prétendre au canon publié.','Portrait de sortie et réaction de Miranda.'],
['LEGION','characters','Acquisition précoce de Legion','Ordre de recrutement antérieur signalé.','À vérifier','CUT-LEGION','Tester la présence de Legion dans les zones tôt accessibles.','Chaque réaction exige une référence ; une ligne absente n’est pas remplacée par une imitation officielle.','Sprite et portrait déjà définis dans le module ME2 à adapter.'],
['MORDINGRUNT','dialogues','Confrontation Mordin et Grunt','Échange abandonné signalé.','À vérifier','CUT-ME2','Écrire une scène originale clairement indiquée comme reconstruction.','Conditions de loyauté distinctes, médiation et tensions locales.','Salon Normandy avec positions de dialogue stables.'],
['MAKO','props','Mako dans ME2','Présence envisagée répertoriée.','À vérifier','CUT-ME2','Prototype de circulation terrestre facultatif, sans supprimer le Hammerhead.','Accès par menu de modules alternatifs.','Véhicule à six roues ; proportions à contrôler.'],
['JACK','choices','Romance de Jack et Shepard féminin','Restriction tardive décrite par son scénariste.','Concept abandonné','CUT-JACK','Écrire une branche consentie avec scènes originales et drapeaux séparés.','Ne pas considérer toutes les répliques doublées comme une romance finalisée.','Expressions et gestuelle sans scène explicite nécessaire.'],
['DARK','lore','Piste de l’énergie noire','Idée décrite comme peu développée.','Concept abandonné','CUT-DARK','Module hypothétique sur un phénomène stellaire.','Aucune affirmation de vraie fin de la trilogie ; scénario fan intégralement annoncé.','Soleil, instrument et couches de lumière.'],
['TIM','enemies','Boss de l’Homme Trouble','Boss abandonné annoncé dans Final Hours.','Concept abandonné','CUT-FINAL','Créer une épreuve optionnelle en simulation de combat.','Conserver la confrontation publiée dans le profil de référence.','Concept à examiner avant toute silhouette définitive.'],
['TEAM','systems','Mass Effect Team Assault','Prototype FPS non terminé.','Concept abandonné','CUT-FINAL','Proposer une arène tactique à équipes comme adaptation de l’idée.','Ce prototype ne devient pas un jeu publié ni une campagne retrouvée.','Points de capture et silhouettes de classes.'],
['ANDERSON','cinematics','Scène finale d’Anderson raccourcie','Raccourcissement attribué à Mac Walters par une transcription secondaire à contrôler.','À vérifier','CUT-ANDERSON','Montage alternatif à documenter avec repères de séquence.','Ne pas copier une transcription complète ; écrire un storyboard de production.','Cadre, pauses et durée à comparer aux prises originales.'],
['PINNACLE','continuity','Pinnacle Station dans Legendary Edition','DLC publié absent du remaster.','Établi','CUT-PINNACLE','Répertorier l’édition source puis les modes d’arène à adapter.','Absence d’édition ne signifie pas mission narrative jamais publiée.','Station d’entraînement et hologrammes.'],
['ARK','continuity','Arche quarienne et contenu solo Andromeda','Fin de suivi solo annoncée en 2017.','Établi','CUT-ARK','Relier au dossier Annihilation pour le récit publié.','Ne pas affirmer qu’un DLC jouable terminé a été supprimé.','Référence d’arche distincte du Nexus.'],
['INDOC','continuity','Théorie de l’endoctrinement comme fin coupée','Intention non revendiquée par Chris Hepler.','Allégation écartée','CUT-INDOC','Conserver comme hypothèse de fans exclue du relevé des scènes attestées.','Un module onirique éventuel sera une fan fiction explicite.','Aucun faux écran de preuve officielle.'],
['ME4','continuity','Annulation du prochain projet','Arrêt annoncé le 21/10/2026.','Établi','CUT-STOP','Renvoyer au classeur ME4, sans fabriquer un inventaire de fichiers non publiés.','Extrapolation distincte du contenu récupéré.','Visuels de teaser à traiter selon provenance.']
];
for(const [key,category,name,fact,nat,source,adapt,rule,visual] of cases){
 const id=add(cut,category,`CASE-${key}`,name,fact,adapt,rule,visual,'La fiche cite une provenance et ne présente pas sa reconstruction comme un contenu final officiel.',{nature:nat,sourceIds:[source],reference:name,priority:['CALESTON','LEGION','DARK','TIM','ARK','INDOC'].includes(key)?'P0':'P1',conditions:'Activation facultative dans un profil alternatif. La campagne de référence reste sélectionnable.',notes:nat==='À vérifier'?'Piste issue d’index secondaires. Captures, fichiers ou témoignages primaires requis avant reclassification.':'Le niveau de preuve porte sur l’existence ou le statut de la piste, pas sur les détails du gameplay proposé.'});
 add(cut,'qa',`QA-${key}`,`Vérifier : ${name}`,'Tâche de contrôle de provenance.',`Retrouver les pièces qui justifient ${name}, relever version, date et segment exact.`,nat==='Allégation écartée'?'Contrôler qu’aucune branche de production ne réintroduit cette hypothèse comme fait.':'Comparer source primaire, état publié et proposition du projet. Documenter tout écart.','','Le registre contient référence précise, pièce contrôlée, conclusion et limites.',{dependencies:[id],sourceIds:[source],reference:name,priority:'P0',conditions:'La vérification porte sur une œuvre ou un fichier légalement accessible ; le catalogue ne fournit aucun binaire extrait.'});
}
rows(cut,'characters',[
['CHR-SHEPARD','Shepard dans un profil alternatif','Personnage existant réutilisé dans une reconstruction.','Conserver personnalisation, classe et genre de la sauvegarde.','Aucune scène coupée ne force silencieusement l’identité du personnage.','Portrait personnalisé.','Le même profil traverse campagne publiée et module alternatif.'],
['CHR-RESEARCHER','Guide d’archive','Personnage original de médiation.','Présenter les dossiers dans une salle d’archives facultative.','Ne pas lui attribuer l’autorité de BioWare.','Tenue d’archiviste et tablette.','Ses propos distinguent document, hypothèse et reconstruction.']
]);
rows(cut,'npcs',[
['NPC-CALESTON','Habitants du hub de Caleston','Inventaire à établir.','Créer une fiche par PNJ seulement après identification du nom et de sa source.','Les figurants provisoires restent nommés figurants.','Silhouettes de mineurs et marchands sans identité canonique inventée.','Aucun prénom de remplissage n’apparaît comme personnage supprimé.'],
['NPC-LILITH','Habitants de l’évacuation Horizon','Figurants de reconstruction.','Limiter les interactions à l’objectif de secours du module.','Aucune liste de survivants non attestée.','Tenues coloniales variées.','Chaque figurant possède une route et une issue, même hors caméra.']
]);
rows(cut,'zones',[
['MAP-THROWDOWN','Throw Down : blockout','Plan de reconstruction proposé.','Place centrale, bar, comptoir administratif et descente vers raffinerie.','Trois parcours possibles entre hub et objectif ; vues fixes au maximum de la lisibilité.','Distances de travail à comparer aux concepts.','Le plan est marqué reconstruction, avec éléments attestés différenciés.'],
['MAP-HORIZON','Horizon : évacuation civile','Plan original pour la piste Lilith.','Maison, passage extérieur, abri et rupture du parcours.','Éviter les combats de puissance qui contredisent la vulnérabilité d’un civil.','Lumière du matin et intrusion froide.','Le joueur comprend l’objectif sans arme ni barre de dégâts.'],
['MAP-ILL','Illium : toits alternatifs','Plan original.','Trois terrasses, une passerelle, un abri contre les tirs et un point d’extraction.','Les salves de l’aéronef sont annoncées avant la traversée.','Ville lointaine 3D, garde-corps contrastés.','Aucun saut exigeant une précision de plateforme incompatible avec les sprites.'],
['MAP-ARCHIVE','Salle des contenus coupés','Hub original du fan game.','Bornes par jeu, vitrine des sources, accès aux simulations.','Débloquer chaque simulation indépendamment du canon.','Architecture sobre et panneaux datés.','Le joueur peut quitter une simulation à tout moment sans perdre sa campagne.']
]);
rows(cut,'links',[
['LNK-PROFILE','Séparation des profils','Contrat de données proposé.','Campagne de référence et reconstruction utilisent des espaces de drapeaux distincts.','Clé proposed.<module> ; migration explicite seulement à une nouvelle partie.','','Une survie alternative ne modifie pas les dialogues du profil de référence.'],
['LNK-THERUM','Therum ou Caleston alternatif','Embranchement de module.','Choisir la variante avant la mission et afficher ses limites.','Les deux routes attribuent une seule fois le recrutement de Liara.','Carte avec noms complets.','Impossible de recruter Liara deux fois en changeant de variante.'],
['LNK-LEGION','Ordre alternatif de recrutement','Graphe de progression proposé.','Déclarer chaque mission accessible avec Legion et les réactions disponibles.','Refuser les réactions non documentées ou les écrire comme adaptation.','','Le journal indique quelle réaction est une reconstruction.']
]);
rows(cut,'scenery',[
['SET-REFINERY','Raffinerie de Caleston','Décor de reconstruction.','Modules de tuyaux, plateformes et cuves avec matière usée.','Occlusion propre des personnages sur les deux niveaux.','Soufre et métaux, palette finale à confronter aux concepts.','Les images comparatives distinguent volumes documentés et volumes créés.'],
['SET-MARS','Fouille martienne alternative','Décor original pour piste abandonnée.','Habitat pressurisé, déblai rouge et accès à vestiges.','Ne pas réutiliser le plan ME3 comme preuve de l’ancien DLC.','Terre rouge mate, lumière froide intérieure.','Les fiches de référence ne fusionnent pas deux projets distincts.'],
['SET-SIM','Simulateur de Team Assault adapté','Décor original.','Arène symétrique avec trois points et lignes de tir multiples.','Miroir de gameplay possible sans dupliquer les éclairages.','Matériaux neutres et codes d’équipe accompagnés de formes.','Les deux départs ont des distances comparables aux objectifs.']
]);
rows(cut,'props',[
['PRP-ARCHIVE','Borne de provenance','Objet original.','Afficher source, version et limite avant lancement d’une reconstruction.','Conserver une URL consultable et une note courte.','Tablette à trois sections textuelles.','Aucun lien interne de l’outil d’auteur n’apparaît dans le jeu.'],
['PRP-MAKO','Mako : rig de démonstration','Livrable de prototype.','Châssis 3D, roues animées et passagers en sprites.','Suspension proposée indépendante de la physique originale.','Six roues et masse du véhicule à comparer.','La silhouette et les pivots restent stables sur une pente.']
]);
rows(cut,'weapons',[
['WPN-JAVELIN','Entrée de codex Javelin inutilisée','Entrée mentionnée par l’index ME1.','Créer une fiche de recherche avant de concevoir une arme.','Ne pas conclure qu’il s’agit du fusil Javelin publié ultérieurement.','Aucune silhouette officielle attribuée sans preuve.','Une homonymie ne devient pas une identité d’objet.',{nature:'À vérifier',sourceIds:['CUT-ME1']}],
['WPN-SIM','Armes du prototype Team Assault','Inventaire non relevé dans ce dossier.','Utiliser des armes de test explicitement génériques pour l’arène.','Pas de modèle, cadence ou équilibrage récupéré prétendu.','Fusils simples distingués par longueur et portée proposée.','Le menu affiche arme de simulation jusqu’à identification primaire.']
]);
rows(cut,'equipment',[
['EQ-VEHICLE','Améliorations de véhicule','Piste d’équipement signalée.','Séparer blindage et boucliers dans un prototype local.','Réglages proposés ; aucune économie prétendument restaurée.','Icônes véhicule lisibles.','Le catalogue note le fichier ou document qui confirmerait chaque modificateur.',{nature:'À vérifier',sourceIds:['CUT-ME1']}],
['EQ-PROVENANCE','Identifiant de version','Outil de production.','Associer un manifeste de référence à chaque asset reconstruit.','Version de jeu, langue, numéro de séquence et nature du travail.','','On peut retrouver l’origine d’un asset sans ouvrir son fichier graphique.']
]);
rows(cut,'ally_moves',[
['MOV-LILITH','Évacuer un voisin','Action originale pour la piste Lilith.','Choisir entre avertir, déplacer un obstacle et rejoindre l’abri.','Pas d’attaque biotique attribuée sans source.','Bras tendu, geste de guidage et posture basse.','Chaque commande explique son effet avant la validation.'],
['MOV-LEGION','Analyse anticipée','Action originale pour un Legion recruté tôt.','Révéler une route de tir à un allié.','Aucune nouvelle capacité n’est qualifiée de retrouvée.','Lumière optique et panneau de visée.','Une cible hors champ n’est pas endommagée par le seul diagnostic.'],
['MOV-INTERRUPT','Intervenir dans une conversation','Prototype d’action.','Prévisualiser intention et temps disponible.','Option sans limite de temps pour accessibilité.','Geste court puis reprise de l’écoute.','Une interruption ne supprime pas une réponse nécessaire à la quête.']
]);
rows(cut,'enemy_moves',[
['EMV-TIM','Simulation du boss abandonné','Moveset original, non retrouvé.','Trois phases abstraites : pression, rupture de soutien, fenêtre finale.','Signaler chaque transition ; éviter les attaques punitives sans contre.','Silhouette provisoire jusqu’à étude des concepts.','Le titre du combat mentionne la reconstruction.'],
['EMV-CHANDANA','Épreuve du chercheur','Moveset original pour piste de boss.','Attaques via dispositifs environnants plutôt qu’un pouvoir attribué sans preuve.','Couper deux relais, puis atteindre un dialogue de sortie.','Consoles et signaux au sol.','Le boss ne reste pas invincible après destruction des relais.'],
['EMV-GUNSHIP','Poursuite aérienne sur Illium','Moveset original de poursuite.','Balayage horizontal, pause d’observation, salve ciblée.','Le joueur passe d’un abri au suivant pendant la pause.','Faisceau d’alerte large.','Toutes les plateformes possèdent un abri utilisable.']
]);
rows(cut,'animations',[
['ANM-RECOVER','Animation retrouvée ou refaite','Règle de nomenclature.','Nommer original documenté, restauration partielle ou animation nouvelle.','Conserver les versions sans écraser la trace de provenance.','Contact sheet avec pivots et silhouette.','Aucun rendu neuf n’est présenté comme un asset extrait.'],
['ANM-ANDERSON','Pauses et regards du montage alternatif','Plan de travail proposé.','Chronométrer les gestes observés, puis dessiner une adaptation abrégée.','Pas d’invention de durée officielle.','Positions assises, regard et respiration.','Le storyboard cite la version examinée pour chaque timing.'],
['ANM-MAKO','Suspension et tourelle du Mako','Animation de reconstruction.','Axes de roues, débattement limité et rotation indépendante.','Vérifier que la tourelle ne tourne pas dans la cabine.','Ombres de contact sous chaque roue.','Aucun flottement durable après l’arrêt.']
]);
rows(cut,'sprites',[
['SPR-LILITH','Lilith : atlas civil','Livrable original.','Marche, course, alerte, aide et refuge ; pas de poses armées sans source.','Réglage proposé : 8 directions de déplacement.','Costume à vérifier sur la version publiée avant production.','Chaque pose reste cohérente avec le rôle de civil.'],
['SPR-CALESTON','Figurants miniers','Livrable original.','Trois tenues de travail et variantes de port d’outil.','Aucun nom de personnage officiel attribué aux variantes génériques.','Palette charbon, jaune de travail et poussière.','Silhouettes lisibles sans recycler le même visage.'],
['SPR-LEGION','Legion : réactions supplémentaires','Livrable original.','Poses d’observation et portraits pour scènes alternatives.','Pas de variation de corps liée à une ligne vocale inexistante.','Capteur, câbles et asymétrie à comparer aux références.','Les portraits restent conformes au modèle utilisé dans ME2.'],
['SPR-ARCHIVE','Panneaux et vignettes du dossier','Livrable original.','Une vignette par type de preuve, accompagnée d’un libellé.','Ne pas utiliser la couleur comme seul niveau de preuve.','Document, voix, plan, concept, prototype.','Le sens des icônes est expliqué dans l’interface.']
]);
rows(cut,'vfx',[
['VFX-DARK','Anomalie d’énergie noire','Effet original d’une hypothèse.','Déformations lentes autour d’un instrument de mesure.','Aucune représentation physique certifiée ni explication canonique inventée.','Contours bleu sombre et repères stables.','La scène reste compréhensible effets désactivés.'],
['VFX-SIM','Identification des simulations','Effet d’interface original.','Afficher un cadre discret à l’entrée du module alternatif.','Le cadre ne gêne pas la zone de combat.','Marquage Simulation et date du dossier.','Le joueur ne peut confondre la simulation avec une scène publiée.']
]);
rows(cut,'audio',[
['AUD-UNUSED','Répliques inutilisées','Règle de travail audio.','Identifier locuteur, langue, contexte et version avant toute utilisation.','Une ligne enregistrée ne prouve pas une scène achevée.','','Chaque réplique de production porte une référence ou la mention texte original.'],
['AUD-NEW','Voix des reconstructions','Création sonore originale.','Écrire et enregistrer de courtes situations adaptées au module.','Pas de voix officielle fabriquée ou revendiquée.','','Les crédits distinguent création du projet et référence historique.'],
['AUD-CALESTON','Ambiance minière','Création sonore originale.','Moteurs éloignés, frappes métalliques et foule sourde.','Diminuer le fond pendant l’enquête.','','Aucune boucle n’est attribuée à une musique coupée non retrouvée.']
]);
rows(cut,'dialogues',[
['DIA-SOURCE','Du fragment au dialogue jouable','Méthode de reconstruction.','Lister ce qui est attesté, ce qui manque et les raccords écrits pour le fan game.','Ne pas remplir un trou avec une citation inventée.','','Chaque raccord créé est traçable dans la fiche.'],
['DIA-CONSENT','Branche de romance alternative','Écriture originale.','Inclure progression, consentement, refus et poursuite de l’amitié.','Un refus bloque la relance automatique et conserve les missions communes.','Portraits sobres et cadrage respectueux.','Les quatre chemins fonctionnent sans bloquer la loyauté.']
]);
rows(cut,'cinematics',[
['CIN-COMPARE','Avant, version publiée, reconstruction','Présentation de production.','Comparer trois storyboards légendés, sans copier les scènes intégrales.','Chaque vignette donne sa source ou son auteur.','Mêmes cadrages de comparaison quand ils sont disponibles.','Une différence ne disparaît pas derrière une mention vague de fidélité.'],
['CIN-HORIZON','Introduction civile alternative','Storyboard original.','Plan du quartier, perception du danger, course vers abri, raccord de campagne.','Durée et dialogues créés pour ce projet.','Caméra proche du sol, pas de regard omniscient sur le plan ennemi.','La scène ne révèle pas des informations que le personnage ne pouvait pas connaître.']
]);
common(cut,'contenus coupés','Séparer drapeaux de référence, variantes et simulations. Conserver version de dossier, sources validées et choix d’activation.','Les cas indexés restent À vérifier tant que leurs pièces primaires n’ont pas été contrôlées. Les DLC publiés mais absents d’une édition et les théories de fans ont des classements distincts.');
cut.coverage=categories.map(c=>({area:c,covered:c==='qa'?'Une fiche de provenance par cas, plus tests des profils et de la continuité.':`${cut.entries.filter(e=>e.category===c).length} fiches de cas ou de production dans ce domaine.`,remaining:'Ce registre ciblé ne constitue pas un inventaire de tous les fichiers inutilisés de toutes les versions. Audit des builds, artbooks et prises originales à poursuivre cas par cas.'}));

const books=[inf,gal,me4,cut];
inf.filename='Mass_Effect_Infiltrator_Production.xlsx';
gal.filename='Mass_Effect_Galaxy_Production.xlsx';
me4.filename='Mass_Effect_4_Extrapolation_Production.xlsx';
cut.filename='Mass_Effect_Contenus_Coupes_Production.xlsx';
for(const b of books){
 const actors=b.entries.filter(e=>['characters','npcs','enemies'].includes(e.category));
 for(const actor of actors){
  if(b.entries.some(e=>e.category==='sprites'&&e.dependencies.includes(actor.id)))continue;
  const key=actor.id.slice(b.id.length+1);
  const portrait=actor.category==='npcs';
  add(b,'sprites',`ASSET-${key}`,portrait?`Portraits : ${actor.name}`:`Atlas de combat : ${actor.name}`,'Livrable graphique proposé.',portrait?`Dessiner ${actor.name} en face et trois-quarts avec expressions liées à ses échanges.`:`Construire les poses de ${actor.name} nécessaires à sa boucle de combat.`,portrait?'Proposition : neutre, désaccord, alerte et conclusion. Ne pas fabriquer une réaction absente du scénario.':`Proposition : attente, anticipation, attaque, impact, rupture et sortie. La boucle à rendre lisible est : ${actor.gameplay}`,actor.visual,portrait?`Le nom ${actor.name} reste identifiable à petite taille et les expressions ne modifient pas les traits.`:`Le télégraphe de ${actor.name} reste identifiable en silhouette ; aucune pose ne change le pivot aux pieds.`,{dependencies:[actor.id],animation:portrait?'Transitions discrètes entre expressions ; pas de déplacement du cadre.':'Huit directions pour les unités mobiles ; vue fixe possible pour un boss ancré. Événements d’impact séparés des poses.',implementation:`Livrable prévu : atlas ${b.id.toLowerCase()}_${sid(key).toLowerCase()}, métadonnées des pivots et fichier de référence visuelle.`,conditions:'Référence visuelle validée avant les variantes. Les cases manquantes sont suivies explicitement.',notes:'Fiche de production uniquement. Aucun sprite supplémentaire n’a été généré par ce classeur.'});
 }
}
for(const [key,name,layout,interaction,enemy] of [
['HANGAR','Hangar Bay','Quai inférieur, deux rampes, passerelle et bureau à l’étage.','Console d’arrivée et porte de débriefing.','Attaque turienne : entrée visible depuis le quai.'],
['MEDICAL','Medical Bay','Accueil, couloir vitré, salles médicales et zone d’expérience.','Sas de quarantaine, tableau d’état et cellule d’Inali.','Menaces séparées des sujets non hostiles.'],
['SECURITY','Security Checkpoint','Sas A, salle centrale avec deux couverts, poste de contrôle, sas B.','Deux verrous alimentés par la même console.','Rafales croisées avec un couvert central sûr.'],
['X1WING','X1 Wing','Couloir de cuves, enceinte de test, passerelle et sortie vers arène.','Cuves translucides, terminaux de preuves et portes endommagées.','Sujet évadé à courte portée et mécaniques de soutien.'],
['COLOSSEUM','Colosseum','Arène circulaire, quatre piliers proposés et marges de recul.','Piliers avec états intacts et fragilisés ; sortie verrouillée jusqu’au bilan.','X1 : ligne de charge et zone d’impact visibles.'],
['COMM','Comm Relay','Accès technique, deux paliers puis plateforme d’antenne.','Trois consoles proposées pour alimentation, alignement et émission.','Tirs à distance, puis interruption de piratage.'],
['CORRIDOR','Access Corridor','Coursive de retour, dérivation, accès de hangar et rampe de navette.','Porte de raccourci, console de navette et verrou de départ.','Renforts annoncés pendant la sécurisation de l’embarquement.']])
 add(inf,'zones',`MAP-${key}`,`Sous-zone : ${name}`,'Plan détaillé original pour une mission référencée.',layout,`${interaction} ${enemy}`,'Cadrage fixe en trois-quarts avec profondeur 3D et couverts à hauteur cohérente.','Chaque interaction est atteignable à pied et visible depuis au moins une caméra. Les transitions ne traversent pas les murs.',{dependencies:[`INF-MIS-${key}`],implementation:'Blocage volumétrique, graphe de navigation, triggers, emplacements d’ennemis et points de reprise séparés.',conditions:'Ce plan traduit la mission ; il ne prétend pas reproduire les dimensions exactes du niveau mobile.',animation:'Portes à deux états et arrêt des machines au changement de secteur.',audio:`Ambiance spécifique : ${name}, alertes localisées sur les menaces décrites.`});
for(const b of [inf,gal]){
 for(const e of b.entries)if(e.category==='main_quests'||e.category==='systems'||e.category==='qa'||e.id.includes('ENM-INALI')||e.id.includes('ENM-JATH'))e.priority='P0';
 b.coverage=[
 {area:'Campagne',covered:b.id==='INF'?'Les neuf missions principales et le bonus Incarceration sont répertoriés, avec leurs nombres de checkpoints issus du guide.':'Les six missions et les trois pistes permutables sont répertoriées avec leurs récompenses de progression.',remaining:'Positions exactes des objets, tous les segments visuels, répliques et variantes à relever dans une version exécutable ou une capture complète.'},
 {area:'Personnages et combat',covered:'Identités principales, adversaires, armes, pouvoirs, actions ATB et planches graphiques à produire.',remaining:'Statistiques originales non relevées. Les paramètres proposés nécessitent un prototype et ne sont pas une équivalence 1:1.'},
 {area:'Décors et cartes',covered:'Destinations, plans de travail, liaisons, accessoires et règles d’occlusion 2D/3D.',remaining:'Les plans sont des conceptions originales ; dimensions, colliders et positions doivent être comparés au jeu source avant toute revendication de fidélité.'},
 {area:'Production et contrôles',covered:'Animation, VFX, audio original, sauvegarde, UI, critères de recette et limites de continuité.',remaining:'Aucun asset ni niveau de ce module n’est réalisé par la rédaction du classeur. Les critères QA décrivent des tests futurs du jeu.'}
 ];
}
// The original ME4 campaign uses internal art references, not missing official scenes.
for(const e of me4.entries){
 if(e.category==='characters'){
  e.notes='Créer puis valider une fiche modèle interne : silhouette, costume, palette et expressions. Personnage original de ce fan game.';
  e.acceptance='Le rôle, le costume et les expressions restent cohérents avec la fiche modèle interne approuvée.';
 }
 if(e.category==='zones')e.conditions='Dimensions et distribution originales. Vérifier le blockout contre le plan interne approuvé, puis tester navigation et cadrages.';
 if(e.category==='main_quests')e.notes='Nom, ordre, objectifs et agencement du chapitre créés pour Les Routes du silence ; validation dans le scénario interne.';
}
const lilith=cut.entries.find(e=>e.id==='CUT-ASSET-CASE-LILITH');
Object.assign(lilith,{name:'Atlas d’évacuation : Lilith',adaptation:'Construire les poses civiles nécessaires au secours et à la fuite.',gameplay:'Attente, alerte, marche, course, appel, aide et mise à l’abri ; aucune pose armée ni attaque ajoutée.',animation:'Huit directions pour marche et course ; gestes d’aide en trois-quarts et transition vers le refuge.',acceptance:'La silhouette reste civile ; chaque geste correspond à une commande d’évacuation et conserve le pivot aux pieds.'});
const archivist=cut.entries.find(e=>e.id==='CUT-ASSET-CHR-RESEARCHER');
Object.assign(archivist,{name:'Atlas de médiation : Guide d’archive',adaptation:'Dessiner les poses de consultation, présentation et dialogue du guide.',gameplay:'Attente, marche, lecture de tablette, désignation de document et écoute ; aucune boucle de combat.',animation:'Quatre directions de marche et gestes courts au pupitre, synchronisés avec le document consulté.',acceptance:'Chaque pose sert la médiation et ne suggère ni fonction combattante ni autorité officielle.'});
cut.coverage=categories.map(c=>({area:c,covered:c==='qa'?'Une fiche de provenance par cas, plus tests des profils et de la continuité.':`${cut.entries.filter(e=>e.category===c).length} fiches de cas ou de production dans ce domaine.`,remaining:'Ce registre ciblé ne constitue pas un inventaire de tous les fichiers inutilisés de toutes les versions. Audit des builds, artbooks et prises originales à poursuivre cas par cas.'}));
await fs.mkdir(out,{recursive:true});
for(const b of books){await fs.writeFile(path.join(out,`${b.id}.json`),JSON.stringify(b,null,2)+'\n');console.log(`${b.id}: ${b.entries.length} fiches`);}

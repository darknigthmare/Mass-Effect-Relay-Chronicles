# Armax — campagnes, routes et illustrations

**Version de conception : 25 novembre 2026, Europe/Paris. Statut : Défini.**

Cette annexe applique les sections **07, 08, 09, 10 et 24** du fichier utilisateur *Combat_Games_Guide_General_v1.0.txt* au mode annexe **Armax Relay Clash** de *Mass Effect — Relay Chronicles*. Elle complète les récits déjà écrits et les relie à des combats, des scènes et des besoins d'illustration. Elle ne déclare aucune route jouable ni aucune nouvelle image produite.

Base documentaire examinée : commit **4befa64285080fe016d6ecd9424b00ab4d42509f**, tête de la PR #11 lors de cette préparation. Le [contrat commun de la bible intégrée](BIBLE_ARMAX_INTEGREE.md), [les règles communes](common-rules.json) et [la matrice d'association du guide](guide-associations.json) déterminent le périmètre général. Les réglages de combat historiques ne sont pas recopiés ici.

## 1. Sources de conception et liens conservés

| Source existante | Ce qu'elle fournit à cette annexe | Ce qu'elle ne prouve pas |
|---|---|---|
| [Bible lot 04](../lot04/BIBLE_EXTENSION.md) et [fighters.json](../lot04/fighters.json) | Identités, variantes, rôles, kits et scènes intro/rival/ending de quatorze sujets ; dix candidats au Versus, trois profils de boss et Eve en soutien. | Disponibilité d'un combattant dans le moteur ; animation ; route complète. |
| [Continuation Grunt/Legion](../../combat-2d/CONTINUATION_2026-11-19.md) | Rivalité de simulation croisée, gestes d'intro et d'ending, contrat de production. | Rivalité canonique, boucle jouable, validité commune des anciens chiffrages. |
| [Bible lot 03](../lot03/Bible_Complement_Lot03.md) et [manifeste lot 03](../lot03/asset-manifest.json) | Variantes visuelles et identités de compagnons d'Andromeda, sous-zones de plusieurs arènes. | Personnages jouables, scènes narratives ou calques achevés. |
| [Inventaire récupéré](../recovery-20261120/asset-inventory.json) | Identités sara-ryder/scott-ryder et références de poses récupérées. | Identifiants de combattants du moteur ni profil de pouvoirs entièrement raccordé. |
| [Catalogue lot 13](../lot13/production-catalog.json) | IDs de personnages, ennemis, costumes et 47 sous-zones de stages. | Catalogue exhaustif de toutes les identités antérieures ; équivalence entre deux pièces d'un même lieu. |

Les dialogues du lot 04 gardent leurs IDs et leur texte source. Les ajouts ci-dessous portent uniquement sur le déroulé, les objectifs et la mise en scène. Une correction future passe par la source structurée et une version de récit identifiable.

**Vocabulaire de statut narratif :**

- **Ancrage d'œuvre** : personnage, période ou relation rattachés à une source existante. La qualité de preuve reste celle de cette source.
- **Adaptation Armax** : confrontation, objectif ou présentation créés pour le mode combat.
- **Original du projet** : intrigue ou nom introduits ici ; aucune attribution à BioWare.
- **À raccorder** : sous-zone, acteur, profil de boss, scène ou asset requis mais pas encore associé à un élément utilisable.
- **Alternative de simulation** : issue hypothétique qui ne modifie aucun recrutement, décès ou choix de la campagne RPG.

Saren/Nihlus simulé ne prouve pas une survie de Nihlus ; Nyreen/Kai Leng et Randall/Kai Leng restent inventés.

## 2. Deux formats narratifs distincts

### Routes individuelles

Une route suit un combattant, son objectif, son rival et sa conclusion : **cinq combats** et **sept temps narratifs**, selon le parcours Histoire du lot 04 :

1. **Situation** : l'introduction existante situe la version choisie.
2. **Déclencheur** : un objectif personnel rend l'exercice nécessaire.
3. **Progression** : trois combats expliqués font évoluer la stratégie.
4. **Rivalité** : scène existante puis quatrième combat.
5. **Revers** : le résultat révèle une limite ou une conséquence.
6. **Décision** : cinquième rencontre, boss ou objectif final.
7. **Conclusion** : l'ending existant montre ce qui a été appris ou refusé.

Le joueur peut recommencer chaque rencontre, réduire la difficulté et revoir son objectif. Les objectifs secondaires mesurent le style ; seuls les critères annoncés conditionnent la progression.

### Campagne globale

La campagne **Protocoles de relais** est une **proposition originale du projet**, distincte de ces routes. Son conflit porte sur la manière d'évaluer une opération : un protocole d'entraînement donne progressivement la priorité à la destruction des cibles et perd de vue l'extraction, l'information et la protection. Le joueur traverse des chapitres à points de vue imposés pour identifier cette erreur, suspendre le protocole puis rétablir une évaluation cohérente.

Le titre et ce protocole ne sont pas des éléments officiels de Mass Effect. Le cadre est une **interface éditoriale de dossiers hors diégèse**. Il ne suppose ni voyage temporel, ni accès de personnages ME1/ME3 aux événements futurs d'Andromeda, ni transmission instantanée entre les deux galaxies. Deux volumes indépendants réemploient le même principe d'épreuve ; aucun personnage ne traverse physiquement de l'un à l'autre.

Avant le premier chapitre et dans la galerie, indiquer si la scène est sourcée, alternative ou originale.

## 3. Campagne globale — structure proposée

**ID : campaign-protocoles-relais.** Deux volumes et douze chapitres proposés ; aucun n'est implémenté par cette annexe. Chaque chapitre requiert une scène d'entrée, une sortie et un checkpoint. La campagne alterne les responsabilités d'une opération ; elle ne concatène pas les routes individuelles.

### Volume I — Voie lactée : « Ce que mesure une victoire »

| Chapitre / scène | Point de vue | Objectif narratif et de jeu | Sortie et dépendances |
|---|---|---|---|
| PR-VL-01 / scene-pr-vl-01 | armax-anderson-me1 | Opposer dégâts et maîtrise dans un duel d'entraînement ; employer garde et interruption, sans bonus narratif caché. | Une victoire propre est mal notée : première anomalie. Espace d'entraînement original à produire. |
| PR-VL-02 / scene-pr-vl-02 | armax-nihlus-me1 | Observer avant d'engager ; distinguer deux signaux proches demandant des réponses différentes. | Comparaison des décisions, sans lecture des intentions ni connaissance du futur. |
| PR-VL-03 / scene-pr-vl-03 | armax-kirrahe-me1 | Préparer une extraction. Atteindre un objectif visible avec des balises de progression, sans alliés invincibles hors écran. | La mission réussit avec un score moindre : divergence explicitée au journal. Accès de Virmire à raccorder. |
| PR-VL-04 / scene-pr-vl-04 | armax-randall-ezno-infiltrator | Fermer un canal d'ordres, ouvrir une sortie par un objectif lisible plutôt que par un nombre de victimes. | Le protocole entretient le combat ; le personnage refuse ce verrou, sans nouveau pouvoir ni renseignement canonique. |
| PR-VL-05 / scene-pr-vl-05 | armax-nyreen-me3 | Protéger une voie civile et neutraliser les menaces avec des fenêtres de réponse lisibles. | Objectif accompli sans maximum de dégâts. Nyreen demeure un profil de dossier, sans survie imposée dans Omega. |
| PR-VL-06 / scene-pr-vl-06 | armax-anderson-me1 ; armax-saren-me1 en opposition | Arrêter la boucle d'évaluation : confrontation et objectif de contrôle clairement séparés, kit du boss annoncé. | Protocole clos ; duel et mission gardent leurs résultats distincts. Aucun événement ME1–ME3 réécrit. |

Chaque changement d'époque passe par le **menu des dossiers**, avec œuvre et profil affichés. Les personnages n'acquièrent pas les souvenirs d'autres dossiers ; les comparaisons appartiennent au journal du joueur.

### Volume II — Andromeda : « Une connexion n'est pas un ordre »

Réutiliser les identités sara-ryder/scott-ryder de l'inventaire récupéré et cora, liam, peebee, jaal, vetra_nyx_mea, nakmor_drack_mea du manifeste lot 03. Ces références préparent art et récit ; **elles ne deviennent pas des fighterId du moteur**. Profil jouable, kit et disponibilité restent à raccorder.

| Chapitre / scène | Point de vue proposé | Objectif et lieu associé | Sortie et dépendances |
|---|---|---|---|
| PR-AN-01 / scene-pr-an-01 | sara-ryder ou scott-ryder, choix conservé | Diagnostic d'entraînement : déplacement, défense, terminal ; stg_mea_nexus_docking_bay. | Distinguer décision et automatisme ; aucune commutation de Ryder à mi-scène. Le quai ne constitue pas une salle d'entraînement. |
| PR-AN-02 / scene-pr-an-02 | cora puis liam, un acteur par rencontre | Couvrir une progression à Eos ; stg_mea_eos_monolith puis stg_mea_eos_vault. | Coordination par objectifs, sans tag présumé. Le raccord est un changement de chapitre, pas une arène connectée livrée. |
| PR-AN-03 / scene-pr-an-03 | jaal | Examiner une menace avant d'ouvrir un accès ; stg_mea_voeld_resistance. | Le débriefing montre l'erreur d'un système classant toute présence comme cible ; connaissances du personnage respectées. |
| PR-AN-04 / scene-pr-an-04 | vetra_nyx_mea puis nakmor_drack_mea | Préserver approvisionnement puis extraction ; stg_mea_kadara_market et stg_mea_elaaden_new_tuchanka. | Changement d'acteur au checkpoint ; aucune capacité accordée par le seul rôle narratif. |
| PR-AN-05 / scene-pr-an-05 | peebee puis Ryder choisi | Comprendre un dispositif avant de le couper ; stg_mea_havarl_ruins. Conditions du terminal visibles. | SAM et technologie reliquat respectent les limites sourcées ; aucune résolution automatique de boss. |
| PR-AN-06 / scene-pr-an-06 | Ryder choisi contre armax-archon-andromeda | Atteindre les relais à stg_mea_meridian_control et répondre aux phases de commandement du boss existant. | Clôture d'une épreuve de réseau ; l'Archonte ne devient pas un duel Versus ordinaire. Aucun retour vers Shepard. |

Le volume II reprend le thème du premier, **pas ses événements ni sa mémoire diégétique**. Galaxy, romans, bandes dessinées et autres œuvres retenues peuvent enrichir les dossiers après revue de période, scène source et rôle ; leur mention ne ferme aucun manque.

### Contrat de chapitre

Champs proposés : chapterId, volumeId, workId, period, actorSourceRef, costumeRef, objectiveIds, encounterIds, sceneIds, checkpointId, prerequisites, completionEffect. L'échec reprend au checkpoint annoncé. Passer une scène applique les mêmes transitions que la regarder ; la galerie relit sans effet de progression.

## 4. Contrat des six routes pilotes

Les six pilotes sont déjà candidats au Versus dans le lot 04. Ils éprouvent six identités : précision, observation, terrain, discipline, protection et rupture de commandement.

| Route proposée | Source du personnage | Rival déjà écrit | Statut de la rencontre | Finalisation existante à conserver |
|---|---|---|---|---|
| route-armax-saren-me1 | armax-saren-me1 | armax-anderson-me1 | Confrontation de simulation ; le scénario précis est original. | Dernier avertissement |
| route-armax-nihlus-me1 | armax-nihlus-me1 | armax-saren-me1 | Alternative d'Eden Prime ; aucune survie canonique. | Extraction propre |
| route-armax-kirrahe-me1 | armax-kirrahe-me1 | armax-saren-me1 | Opposition de mission, duel précis créé pour Armax. | Terrain sécurisé |
| route-armax-anderson-me1 | armax-anderson-me1 | armax-saren-me1 | Confrontation alternative, dialogue original conservé. | Fin de mission |
| route-armax-nyreen-me3 | armax-nyreen-me3 | armax-kai-leng-me3 | Rencontre inventée ; aucune présence de Kai Leng dans Omega affirmée. | Zone évacuée |
| route-armax-randall-ezno-infiltrator | armax-randall-ezno-infiltrator | armax-kai-leng-me3 | Comparaison de profils simulés ; aucun duel officiel d'Infiltrator affirmé. | Données libérées |

Ces noms de finalisations sont **des créations de conception existantes**, pas des noms de techniques officielles. Elles restent facultatives, après KO final fixé, sans modification du résultat ni récompense supplémentaire. Les scènes d'outro ne dépendent pas de leur exécution.

Chaque combat reçoit l'ID complet de route suivi de **-c01** à **-c05**. Un « boss d'exercice » est un mode à concevoir ; il ne crée pas une identité ni une version Versus sélectionnable.

## 5. Route de Saren — route-armax-saren-me1

**Ancrage :** Saren vivant ME1, sans forme squelettique finale ; armure et implants définis par sa fiche lot 04. **Motivation d'adaptation :** défendre son idée d'une supériorité tactique fondée sur le contrôle. L'exercice met cette certitude à l'épreuve sans lui inventer une rédemption ni un nouveau succès historique.

Les IDs **armax-saren-me1-intro**, **armax-saren-me1-rival** et **armax-saren-me1-ending** restent les scènes de référence. L'intro commence sur la plateforme de Virmire, à pied ; aucun hoverboard ne surgit pour combler une absence d'asset.

### Sept temps et cinq combats

Situation : il prend position à Virmire. Déclencheur : un relevé de mission conteste la valeur d'un score obtenu en laissant une sortie découverte. Progression : trois exercices opposent précision, terrain et coercition. Rivalité : Anderson refuse de laisser le résultat effacer la responsabilité. Revers : le score reste élevé, mais la voie annoncée comme sûre ne l'était pas. Décision : Saren doit lire une pression biotique sans raccourci de scénario. Conclusion : sa victoire demeure celle d'une simulation.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | armax-nihlus-me1 ; terrain d'évaluation original | Nihlus teste la réaction à un changement de rythme. Victoire par KO réglementaire ; bonus de rapport facultatif pour punition d'un tir manqué. | Un relevé met en évidence l'espace abandonné lors du tir. Il devient une question de briefing, pas un malus caché. |
| c02 | armax-kirrahe-me1 ; accès de Virmire à produire | Le dispositif au sol force Saren à choisir son approche. Gagner le duel en lisant sa durée et son placement. | La scène suivante conserve la position du dispositif s'il reste visible ; aucune téléportation silencieuse vers le laboratoire. |
| c03 | armax-balak-me1 ; stg_me1_x57_main_facility | Le contrôle du terrain devient une confrontation avec une autre logique de contrainte. Le dossier est une juxtaposition d'exercices, pas un déplacement canonique de Saren à X57. | L'interface ferme X57 avant d'ouvrir le dossier Citadelle ; aucun trajet galactique fictif n'est montré comme officiel. |
| c04 | armax-anderson-me1 ; passerelle Citadelle à produire | Reprendre la scène de rival existante : Anderson barre la sortie. Gagner ne réécrit ni leur histoire ni les événements du Conseil. | Revers court : le débriefing distingue la cible vaincue de l'accès laissé sans protection. |
| c05 | armax-benezia-me1 ; espace Novéria d'exercice à préciser | Boss de pression biotique, avec règles de boss et fenêtres lisibles. Les ressources et la stase doivent être normalisées pour ce scénario avant intégration. | Le relevé se fige puis rejoint l'ending existant en salle de simulation ; ni Novéria ni la campagne ME1 ne changent. |

### Illustrations — six plans proposés

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-saren-me1-intro-p01 | Plan large latéral de plateforme ; Saren entre à pied, volume sombre sur fond froid, ligne de fuite lisible. | Costumes ME1 uniquement ; plateforme distincte du master du laboratoire. Zone de sous-titre basse dégagée. |
| art-armax-saren-me1-intro-p02 | Trois-quarts poitrine et main près de l'arme ; le regard examine une sortie hors champ. | Implant et main du bon côté ; conserver l'arme retenue par la fiche. Cut vers garde au même côté de l'écran. |
| art-armax-saren-me1-rival-p01 | Plan à deux, Anderson entre Saren et l'issue ; séparation spatiale forte. | Aucun décor de Conseil utilisé comme passerelle. Les deux personnages entiers peuvent partager l'illustration, pas le sprite source. |
| art-armax-saren-me1-rival-p02 | Contrechamp court sur Saren, expression contenue ; reflet de la porte sur l'armure. | Répliques existantes sous-titrées séparément. Même lumière, même distance, pas de changement d'implant. |
| art-armax-saren-me1-ending-p01 | Le décor virtuel se fige ; Saren reste visible tandis qu'un relevé s'affiche dans l'interface. | Les chiffres sont rendus par UI et ne sont pas peints dans l'image. Aucune blessure nouvelle imposée. |
| art-armax-saren-me1-ending-p02 | Porte d'exercice ouverte, silhouette de dos partiel qui ne révèle aucun équipement non référencé. | Le texte source confirme le statut simulé ; retour galerie ou résultat sans nouvelle conséquence canonique. |

## 6. Route de Nihlus — route-armax-nihlus-me1

**Ancrage :** version ME1 avant l'attaque d'Eden Prime ; marquages noirs et blancs et armure rouge/sombre propres à Nihlus. **Motivation d'adaptation :** transformer une observation juste en décision prise à temps. Le dossier reconnaît explicitement son caractère alternatif.

Scènes conservées : **armax-nihlus-me1-intro**, **armax-nihlus-me1-rival**, **armax-nihlus-me1-ending**.

Situation : il observe le quai. Déclencheur : le simulateur soumet deux signaux contradictoires. Progression : distinguer retenue, préparation et menace. Rivalité : Saren refuse d'expliquer ce que Nihlus observe. Revers : attendre une certitude absolue a laissé l'initiative à l'autre. Décision : appliquer une lecture prudente sans rester immobile. Conclusion : le rapport d'exercice conserve la vigilance, sans modifier le destin d'Eden Prime.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | armax-anderson-me1 ; entraînement Normandy SR-1 à produire | Exercice consenti : reconnaître une récupération et répondre sans tir précipité. Duel standard, objectifs pédagogiques facultatifs. | Anderson commente le comportement observé, pas un futur qu'il connaîtrait. |
| c02 | armax-kirrahe-me1 ; terrain de test original | Identifier la menace d'un dispositif et son expiration. Aucune commande n'est présentée comme pouvoir biotique. | Une vue du terrain prépare la lecture spatiale d'Eden Prime. |
| c03 | armax-balak-me1 ; installation X57 simulée | Distinguer la sortie visible de la zone réellement contrôlée. Duel sans otages, fidèle au cadre déjà écrit pour Balak. | Le débriefing révèle une intention tactique du profil, pas des renseignements historiques nouveaux. |
| c04 | armax-saren-me1 ; quai d'Eden Prime à produire | Rencontre alternative précédée du dialogue existant. Nihlus choisit d'engager dans l'exercice ; cela n'affirme pas ce choix dans ME1. | Le relevé signale une réponse tardive lors d'une attaque précise ; introduction de l'épreuve finale. |
| c05 | armax-saren-me1, boss d'exercice ; même quai | Revanche de lecture avec un ordre d'actions déterministe et des fenêtres annoncées, pas une forme squelettique nouvelle. | Nihlus clôt le dossier virtuel. L'ending rappelle la séparation avec l'œuvre. |

c04 conclut le conflit personnel ; c05 vérifie une réponse tactique précise. Le boss d'exercice doit disposer de règles documentées, au-delà d'une hausse de vie.

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-nihlus-me1-intro-p01 | Plan large du quai, Nihlus légèrement décentré ; attention portée à l'espace et aux lignes de tir. | La plateforme de balise stg_me1_eden_prime_spaceport n'est pas automatiquement ce quai. Sous-zone exacte à vérifier. |
| art-armax-nihlus-me1-intro-p02 | Gros plan du regard et des marquages, tête tournée avant le corps. | Ne reprendre ni cicatrices ni armure de Garrus. Le regard se raccorde à la position de l'adversaire. |
| art-armax-nihlus-me1-rival-p01 | Deux silhouettes séparées par une portion vide du quai ; Saren apparaît dans un axe déjà établi. | La scène est étiquetée alternative dans le récit/UI, sans faux écran issu du jeu original. |
| art-armax-nihlus-me1-rival-p02 | Plan rapproché de Nihlus qui cesse d'observer et place sa garde. | Arme, doigts et orientation suivis ; texte source séparé. Cut direct vers le duel. |
| art-armax-nihlus-me1-ending-p01 | Dossier d'analyse sur écran hors focus ; Nihlus reprend un point du trajet du regard. | Aucun certificat de survie ou portrait commémoratif inventé. Éclairage de débriefing distinct du quai. |
| art-armax-nihlus-me1-ending-p02 | Main fermant le terminal virtuel, puis plan plus ouvert montrant l'espace d'exercice. | L'ending existant donne la limite canonique. La scène n'accorde pas un nouveau recrutement. |

## 7. Route de Kirrahe — route-armax-kirrahe-me1

**Ancrage :** Kirrahe ME1, GSI à Virmire ; armure ivoire/crème et noire avec accents bordeaux, selon la référence héritée. **Motivation d'adaptation :** obtenir le retour de l'équipe plutôt qu'un maximum de cibles abattues. Les compagnons évacués peuvent être représentés dans les scènes ; leur nombre et leur disponibilité ne sont pas inventés comme fait officiel.

Scènes conservées : **armax-kirrahe-me1-intro**, **armax-kirrahe-me1-rival**, **armax-kirrahe-me1-ending**.

Situation : vérification d'un terminal au camp. Déclencheur : une fenêtre d'extraction se raccourcit. Progression : préparer un passage, tenir la position puis quitter le terrain. Rivalité : Saren bloque la sortie. Revers : le chemin initial n'est plus sûr. Décision : réorganiser l'approche sans abandonner l'objectif. Conclusion : le compte rendu privilégie ceux qui rentrent.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | armax-nihlus-me1 ; terrain GSI original | Exercice consenti : placer un dispositif sans perdre la lecture du duel. Une seule charge de terrain à la fois selon le kit. | Le terminal note l'ouverture créée, non une assistance apparue gratuitement. |
| c02 | armax-anderson-me1 ; accès simulé de Virmire | Tenir une position puis rejoindre une zone annoncée après le duel ; aucune transition de stage ne s'active pendant un KO non résolu. | La scène distingue fin de combat et déplacement de mission. |
| c03 | armax-balak-me1 ; parcours abstrait d'interdiction | Comparer deux méthodes de contrôle ; le profil de Balak sert d'opposition virtuelle. Ce n'est pas une visite canonique de Balak à Virmire. | Le trajet de repli est lisible dans le briefing suivant. |
| c04 | armax-saren-me1 ; accès industriel Virmire | Dialogue de rival déjà écrit puis confrontation. Saren cherche à fermer la route ; Kirrahe cherche une fenêtre. | Revers : une sortie simulée est condamnée, sans effondrement canonique inventé. |
| c05 | armax-saren-me1, boss d'exercice ; nouvelle zone d'extraction | Réutiliser la lecture du rival pour atteindre un objectif de sortie annoncé après neutralisation. La zone d'arrivée doit exister avant intégration. | Navette de débriefing simulée ; résultat et extraction s'enregistrent une seule fois. |

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-kirrahe-me1-intro-p01 | Plan moyen du camp ; Kirrahe règle un terminal, silhouettes de personnel en arrière-plan si référencées. | Ne pas lui attribuer l'orange des soldats de fond ; pas de portrait de Mordin. |
| art-armax-kirrahe-me1-intro-p02 | Main quittant la console, signe bref vers l'accès ; silhouette entière à l'arrière-plan. | Anatomie salarienne et orientation des doigts contrôlées ; lignes UI séparées. |
| art-armax-kirrahe-me1-rival-p01 | Kirrahe au premier tiers, Saren plus loin dans l'accès ; la sortie reste visible. | Géographie originale de l'exercice explicitée ; elle ne réemploie pas le labo comme couloir extérieur. |
| art-armax-kirrahe-me1-rival-p02 | Visage concentré de Kirrahe puis regard vers une seconde voie. | Aucune révélation de plan future qui annulerait le revers ; sous-titre court sous le visage. |
| art-armax-kirrahe-me1-ending-p01 | Intérieur de navette virtuelle ; la posture de Kirrahe se détend après vérification du retour. | Équipe représentée seulement après choix du nombre et des variantes ; silhouettes anonymes originales signalées. |
| art-armax-kirrahe-me1-ending-p02 | Terminal de débriefing à côté d'une issue ouverte, Kirrahe tourné vers le groupe hors champ. | Résultats affichés par l'interface ; fin sur l'extraction, sans déclaration de survie canonique imposée. |

## 8. Route d'Anderson — route-armax-anderson-me1

**Ancrage :** Anderson ME1 en uniforme marine de cette époque ; pas de veste de guerre ME3 ni d'omni-lame ajoutée. **Motivation d'adaptation :** transmettre une discipline qui reste valable quand l'adversaire conteste sa légitimité. Le récit s'appuie sur son rôle de formateur dans le dossier, sans produire un cours officiel absent des sources.

Scènes conservées : **armax-anderson-me1-intro**, **armax-anderson-me1-rival**, **armax-anderson-me1-ending**.

Situation : inspection de la zone d'entraînement. Déclencheur : un exercice doit être reproductible pour un autre combattant. Progression : défendre, contrôler et arrêter une pression. Rivalité : Saren réduit l'autorité à la précision. Revers : un succès personnel ne suffit pas à prouver que la méthode est transmissible. Décision : démontrer la même réponse dans une configuration plus exigeante. Conclusion : un relevé d'apprentissage demeure consultable.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | armax-nihlus-me1 ; entraînement SR-1 à produire | Échange consenti pour travailler la garde et les fenêtres de réponse. Gagner par les règles communes, sans statistique narrative supplémentaire. | Le rapport conserve une situation reproductible pour l'entraînement futur. |
| c02 | armax-kirrahe-me1 ; terrain de test | Se dégager d'une zone d'interdiction en respectant les fenêtres du dispositif. | Le débriefing identifie une réponse accessible, pas une cinématique de domination. |
| c03 | armax-balak-me1 ; stg_me1_x57_main_facility | Arrêter un adversaire de contrôle dans un exercice sans civils pris en otage. | L'interface annonce la fermeture du dossier X57 ; aucun choix moral de la campagne n'est appliqué. |
| c04 | armax-saren-me1 ; passerelle Citadelle à produire | Conserver la confrontation et les lignes sources. La maîtrise défensive compte au débriefing, le KO décide du duel. | Revers : le protocole demande de reproduire la réponse sous une pression plus structurée. |
| c05 | armax-saren-me1, boss d'exercice ; même passerelle | Épreuve finale avec attaques annoncées et variation documentée ; pas de bonus invisible ni de nouveau pouvoir de Saren. | L'ending affiche score de maîtrise et durée séparément, puis permet de revoir la situation. |

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-anderson-me1-intro-p01 | Plan large de l'espace d'entraînement ; Anderson vérifie la zone avant de rejoindre le centre. | L'entraînement SR-1 est à produire ; le CIC stg_me1_normandy_sr1_cic ne devient pas une salle de combat par renommage. |
| art-armax-anderson-me1-intro-p02 | Plan moyen de l'uniforme et du visage, attitude ferme sans menace excessive. | Chaîne et liserés selon référence ; bas de costume non corroboré conservé comme réserve. |
| art-armax-anderson-me1-rival-p01 | Saren et Anderson de part et d'autre du passage, caméra à hauteur de regard. | Géographie identique à la route de Saren si la même sous-zone est retenue ; inversion de point de vue, pas miroir des costumes. |
| art-armax-anderson-me1-rival-p02 | Anderson fait un pas vers la ligne centrale puis s'arrête. | Pas d'omni-lame, de geste biotique ou de tenue ME3. Dialogue existant séparé de l'image. |
| art-armax-anderson-me1-ending-p01 | Anderson devant le relevé ; un second cadre d'analyse reste vide pour le prochain élève. | Aucune identité d'élève n'est inventée. Le score est UI, la posture raconte la transmission. |
| art-armax-anderson-me1-ending-p02 | Retour sur l'espace du premier plan d'intro, désormais prêt pour un nouvel exercice. | Même sol, même accès et même lumière ; fermeture sans faire croire à une mission canonique accomplie. |

## 9. Route de Nyreen — route-armax-nyreen-me3

**Ancrage :** Nyreen ME3 Omega, tête nue, armure bordeaux/noire et liserés or selon la fiche héritée. **Motivation d'adaptation :** garder un passage ouvert pour les autres. Son rival de route reste Kai Leng parce que cette confrontation a déjà été écrite ; elle porte partout le statut **rencontre inventée de simulation**.

Scènes conservées : **armax-nyreen-me3-intro**, **armax-nyreen-me3-rival**, **armax-nyreen-me3-ending**.

Situation : regard vers l'accès civil. Déclencheur : le profil de mission annonce sa fermeture. Progression : briser la pression mécanique, comprendre une menace rapprochée et empêcher une défense de se réinstaller. Rivalité : Kai Leng cherche à reprendre le point de passage. Revers : la victoire du duel ne suffit pas à rendre la sortie sûre. Décision : neutraliser la machine qui verrouille l'accès. Conclusion : les objectifs protégés priment dans le rapport.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | chr_me3_rampart_mech_omega ; zone des Serres à produire | Apprendre à lire la pression d'une unité mécanique. Les conditions de destruction et de garde sont celles de sa fiche à compléter. | Le passage gagne un premier état « accessible », encore non sûr. |
| c02 | chr_me3_adjutant_omega ; couloir Omega à produire | Rencontre de menace rapprochée avec signaux et espace de réponse. Le gabarit et les réactions ne sont pas déduits du PNG. | Une scène courte montre une voie latérale rendue inutilisable dans l'exercice. |
| c03 | chr_me3_combat_engineer ; stg_me3_omega_reactor comme dossier de secteur | Empêcher une installation défensive de maintenir le verrou. Les cibles secondaires éventuelles doivent être visibles et documentées. | Le terminal annonce le point de contrôle final ; il ne révèle pas un pouvoir de piratage universel de Nyreen. |
| c04 | armax-kai-leng-me3 ; passerelle de contrôle Omega à produire | Dialogue de rival existant, puis duel. Cette localisation de Kai Leng est propre au simulateur. | Le résultat arrête sa pression mais laisse le dispositif lourd actif. |
| c05 | chr_me3_atlas ; accès d'évacuation original compatible | Boss machine à concevoir : lire ses attaques, atteindre ses vulnérabilités et sécuriser l'accès. Aucune capture automatique de pilote ni interaction absente n'est présumée. | Débriefing virtuel ; le sort de Nyreen dans Omega reste séparé. |

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-nyreen-me3-intro-p01 | Plan large de l'accès civil ; Nyreen au bord de la ligne de passage, regard tourné vers l'arrière. | Activité de fond prévue en scène seulement ; civils et blessures à documenter avant production. |
| art-armax-nyreen-me3-intro-p02 | Elle se retourne face au champ, visage déterminé ; masse du col et crâne turien lisibles. | Tête nue, proportions turiennes, bas des jambes réservé à une référence complète. |
| art-armax-nyreen-me3-rival-p01 | Kai Leng sur la passerelle, Nyreen entre lui et l'accès ; axe de protection évident. | Rencontre inventée identifiée dans le dossier ; ne pas présenter ce plan comme capture de DLC. |
| art-armax-nyreen-me3-rival-p02 | Regard de Nyreen puis main préparant l'action de protection, effet discret séparé. | La barrière n'efface pas les pieds ni la silhouette ; aucun pouvoir supplémentaire introduit par l'illustrateur. |
| art-armax-nyreen-me3-ending-p01 | Le passage est libre dans la simulation ; Nyreen vérifie l'espace au lieu de poser devant des victimes. | Les PNJ éventuellement visibles restent cohérents entre intro et outro ; pas de ressuscités narratifs. |
| art-armax-nyreen-me3-ending-p02 | Débriefing virtuel, profil au repos ; données d'objectifs protégés affichées à côté. | Fin alternative explicitement indiquée ; retour menu sans flag de survie Omega. |

## 10. Route de Randall — route-armax-randall-ezno-infiltrator

**Ancrage :** Randall Ezno, variante casquée référencée d'Infiltrator. Les changements moraux et faciaux des variantes restent séparés ; le casque n'est pas retiré pour inventer un visage manquant. **Motivation d'adaptation :** reprendre le contrôle d'une chaîne d'ordres et sortir d'un dispositif qui le traite comme une ressource.

Scènes conservées : **armax-randall-ezno-infiltrator-intro**, **armax-randall-ezno-infiltrator-rival**, **armax-randall-ezno-infiltrator-ending**.

Situation : fermeture d'un canal. Déclencheur : un ordre contredit l'objectif d'évasion choisi dans l'exercice. Progression : apprendre à refuser, contourner puis rompre le verrou. Rivalité : Kai Leng invoque le commandement. Revers : le duel ne suffit pas à ouvrir la sortie. Décision : détruire ou désactiver l'obstacle annoncé par les règles. Conclusion : transmettre un résultat d'exercice, sans modifier les choix d'Infiltrator.

| Combat | Adversaire / lieu du dossier | Raison et objectif annoncé | Conséquence / transition |
|---|---|---|---|
| c01 | chr_me2_loki_mech ; complexe Cerberus simulé original | Calibration contre une opposition mécanique simple. Le dossier précise l'origine ME2 du modèle emprunté. | La porte suivante s'ouvre après résultat confirmé, une seule fois. |
| c02 | chr_me2_fenris_mech ; couloir du même complexe | Répondre à un gabarit bas et à une approche rapide ; collisions et projections adaptées à l'anatomie. | Les systèmes de ciblage signalent le changement de famille, pas un simple costume de LOKI. |
| c03 | chr_me3_guardian ; poste de contrôle original | Lire une défense physique et trouver la réponse prévue par le kit de Randall. Ce profil ME3 est un emprunt explicite de simulation, pas un ennemi canonique affirmé d'Infiltrator. | Un écran indique la rupture de chaîne de commandement ; aucune capacité de piratage non sourcée n'est ajoutée. |
| c04 | armax-kai-leng-me3 ; complexe Cerberus simulé | Reprendre le dialogue rival et le duel hypothétique existants. Les deux versions gardent leur œuvre source. | La sortie reste verrouillée par une machine, pas par une résurrection du rival. |
| c05 | chr_me3_atlas ; hangar original compatible | Boss machine d'exercice : neutraliser la menace selon ses phases et rejoindre la sortie annoncée. La présence de l'Atlas dans ce scénario est une adaptation. | Les données libérées sont un score de scénario ; ending existant, choix moraux originaux inchangés. |

Cette route **composite et alternative** emprunte des modèles ME2/ME3. Une reconstitution stricte d'Infiltrator exigerait des ennemis et lieux sourcés de cette œuvre avant toute qualification canonique.

| ID de plan | Composition et action | Continuité, texte et sortie |
|---|---|---|
| art-armax-randall-ezno-infiltrator-intro-p01 | Plan moyen du personnage casqué, éclairage industriel froid ; main quittant le canal de communication. | Armure sombre, épaules jaunes, visière fermée. Aucun visage ou costume du prisonnier turien substitué. |
| art-armax-randall-ezno-infiltrator-intro-p02 | Plan large montrant l'accès qu'il décide de prendre ; corps entier à trois-quarts. | Bas d'armure à contrôler contre références complètes ; chemin original du simulateur identifié. |
| art-armax-randall-ezno-infiltrator-rival-p01 | Kai Leng en travers du passage ; Randall conserve une marge de recul visible. | Armures séparées par œuvre ; pas de mélange des visières ou armes. Texte rival existant hors image. |
| art-armax-randall-ezno-infiltrator-rival-p02 | Gros plan de la visière opaque, légère rotation vers la sortie avant retour sur le rival. | Émotion par posture et cadrage, pas par un visage reconstruit. Effets biotiques conformes à la variante si montrés. |
| art-armax-randall-ezno-infiltrator-ending-p01 | Terminal affichant une transmission d'exercice, Randall en retrait ; aucun document officiel lisible inventé. | Interface séparée et localisable ; la transmission n'ajoute pas un secret au canon. |
| art-armax-randall-ezno-infiltrator-ending-p02 | Silhouette franchissant l'issue virtuelle puis arrêt sur l'espace de débriefing. | Le casque, l'usure et l'équipement restent identiques. Les choix moraux du jeu source ne sont pas remplacés. |

## 11. Raccords des autres routes et rôles

Ces six pilotes ne ferment pas la narration du roster. Appliquer le contrat à chaque profil jouable retenu, en conservant les sources et les limites suivantes.

| Sujet / source | Récit ou relation existants à poursuivre | Raccord nécessaire |
|---|---|---|
| armax-benezia-me1 | Liara comme rival, Novéria, épilogue alternatif. | Raccorder la bonne version de Liara ; Bénézia reste boss tant que sa version Versus n'est pas normalisée. |
| armax-morinth-me2 | Rival Samara, tenue civile d'Omega, porte virtuelle en outro. | Distinguer mère/fille et variante d'imitation ; route alternative, aucun recrutement ou décès remplacé. |
| armax-kai-leng-me3 | Rival Nyreen déjà écrit, Thessia comme intro virtuelle. | Conserver cette rencontre inventée ; ne pas présenter sa route comme un nouveau chapitre officiel de ME3. |
| armax-tela-vasir-me2 | Rival Liara, terminal d'Illium, archive finale. | Liara version ME2 et sous-zone exacte à associer ; aucune information nouvelle du Courtier affirmée. |
| armax-balak-me1 | Rival Shepard, X57, scénario sans otages dans la simulation. | Associer version et classe de Shepard ; aucune décision sur les civils de la campagne modifiée. |
| armax-eve-me3 | Briefing et débriefing ; le « rival » est un désaccord sur la priorité donnée au score. | **Soutien narratif uniquement** : pas de cinq combats personnels, pas de moveset inventé, pas d'exécution. |
| armax-shadow-broker-me2 | Boss yahg, Liara comme référence narrative, archive d'exercice. | Fiche de rencontre et outro de boss ; ne pas imposer une route standard de cinq duels. |
| armax-archon-andromeda | Boss à relais, Ryder comme référence, sortie d'analyse du réseau. | Raccorder le Ryder choisi ; conserver commandes d'arène, objectifs et échelle du dispositif. |
| Grunt, continuation et variantes lot 03/07 | Rivalité de simulation avec Legion, réexamen d'une tentative ratée puis reprise d'entraînement. | Étendre en cinq combats sans importer les anciens chiffrages incompatibles ; même version ME2 et même arme dans les scènes. |
| Legion / chr_me2_legion_standard | Rivalité de simulation avec Grunt, comparaison de trajectoires, journal laissé ouvert. | Le drone produit ne remplace pas le corps manquant ; pas de promotion d'asset ni de route tant que le personnage et son kit ne sont pas raccordés. |
| Autres profils de production | Intros, relations, scènes et variantes à reprendre dans leurs sources respectives. | Inventaire par identité/œuvre et rôle avant ajout ; aucune affirmation de couverture totale de l'univers. |

## 12. Direction des illustrations et continuité

L'intro montre une situation qui exige une décision ; la scène de rival rend l'opposition visible ; l'outro montre une conséquence. Les six plans de chaque route ne sont pas des portraits promotionnels interchangeables.

Cadrage proposé : **16:9**, avec action et visages dans une zone centrale protégée ; résolution finale selon la bible artistique. Sous-titres, noms, compteurs et symboles UI restent séparés des images. Un recadrage mobile ne doit couper aucune information essentielle.

Une illustration peut réunir plusieurs personnages. Un sprite autonome conserve **un sujet exploitable par image**, son alpha et ses repères. Une scène de rival à deux personnages ne remplace pas deux sprites de combat.

### Fiche de plan

Champs : artId, sceneId, routeId ou chapterId, sourceActorRefs, workId, period, costumeRef, weaponRefs, locationRef, shotType, focalSubject, action, emotion, gaze, light, palette, subtitleSafeArea, continuityIn, continuityOut, audioCueRefs, fileRef et statuts séparés.

Avant production, résoudre les références exactes, accessoires cachés, armes, blessures et états du décor. Le costume reste verrouillé sur la route, sauf changement explicite et sourcé. Les blessures éventuelles du match utilisent des états prévus ; elles ne deviennent pas un nouvel événement canonique.

**fileRef reste nul** jusqu'à réception et vérification. Aucun chemin d'image attendu ne vaut fichier produit. Les trente-six plans ci-dessus sont des briefs.

Les dialogues hérités restent originaux au projet, sous-titrés et localisés par leurs IDs. Voix, ambiance et musique disposent de réglages distincts. Aucune voix d'acteur officiel n'est livrée. Prévoir silences, raccords sonores et passage des scènes selon le mode ; les durées de présentation ne modifient pas la simulation.

### Géographie et sous-zones

| Besoin narratif | Référence disponible | Écart à conserver |
|---|---|---|
| Plateforme / accès de Virmire | stg_me1_virmire_breeding_lab et masters historiques | Le laboratoire n'est pas une plateforme extérieure. |
| Quai d'Eden Prime | stg_me1_eden_prime_spaceport | Le catalogue suit une plateforme de balise ; vérifier ou produire le quai exact. |
| Passerelle Citadelle | stg_me1_citadel_council | La chambre du Conseil n'est pas la passerelle. |
| Entraînement Normandy SR-1 | stg_me1_normandy_sr1_cic | Le CIC ne fournit pas une salle d'entraînement. |
| Zone des Serres / passerelle Omega | stg_me3_omega_reactor | Le réacteur documente une autre sous-zone. |
| Complexe de Randall | Fiche Infiltrator ; modèles ME2/ME3 déclarés | Géographie composite de simulation, sans attribution au niveau original. |
| Cœur de Méridiane | stg_mea_meridian_control | Le master ne fournit pas tous les relais ni le parcours complet. |

## 13. Sauvegarde, reprise et galerie

L'état narratif Armax reste indépendant de la campagne ME1 et des Chroniques. Contrat proposé : narrativeSchemaVersion, contentVersion, routeId ou campaignId, volumeId, actorVariantRef, costumeRef, checkpointId, encounterResults, choices, seenSceneIds et grantedRewardIds. Aucun nouveau moteur de dialogue n'est requis.

Checkpoint de route avant chaque combat, après résultat confirmé et après scène finale ; checkpoint de campagne au début du chapitre et après chaque objectif complet annoncé. La reprise propose un résumé du contexte, de l'objectif restant et de la dernière décision.

Les transitions sont idempotentes : passer une scène, fermer après résultat ou rouvrir la galerie ne donne pas deux récompenses. Le résultat est fixé avant finisher ; l'outro ne le recalcule pas. La reprise d'une illustration mémorise le plan ou reprend la scène selon la politique commune, sans exécuter deux fois sa sortie.

La galerie conserve œuvre, version, costume et statut narratif. Un ending alternatif reste identifié après déblocage. Les dialogues gardent leurs IDs ; les nouvelles lignes de briefing reçoivent des IDs de chapitre. Les variables de progression ne sont pas peintes ni inscrites dans le texte source.

Valider toute la sauvegarde avant mutation. Les changements d'ID exigent une migration explicite ; une migration manquante préserve la sauvegarde et explique la limite. Elle ne déplace jamais silencieusement le joueur vers une autre œuvre ou un autre costume.

## 14. Validation et bilan

Contrôle documentaire : les six routes pointent vers les personnages et dix-huit scènes existants du lot 04 ; les trente rencontres ont adversaire, objectif et conséquence ; les trente-six plans ont un ID distinct ; les douze chapitres ont point de vue, objectif, sortie et dépendances. Les emprunts entre œuvres et sous-zones manquantes restent explicites.

Une route est intégrée lorsque sélection → intro → c01–c03 → scène de rival et c04 → revers → c05 → ending → résultat → reprise est réellement parcourable. Contrôler passage des scènes, retry, fermeture après résultat et reprise entre versions. Les rencontres de protection et les boss à relais doivent avoir des conditions de passage conformes aux objectifs affichés.

La revue artistique compare costume, asymétries, armes, lieu, lumière et émotion entre les plans, à la bonne référence d'œuvre. Elle conserve les écarts ; aucune approximation n'est convertie en fidélité 1:1 par la seule présence du fichier.

| Unité | Documenté ici | Produit ou implémenté par cette modification |
|---|---:|---:|
| Campagne globale originale proposée | 1, avec 2 volumes séparés | 0 |
| Chapitres de campagne | 12 | 0 |
| Routes pilotes détaillées | 6 | 0 route jouable |
| Rencontres proposées de routes | 30 | 0 rencontre intégrée |
| Scènes individuelles existantes enrichies | 18 | 0 nouvelle scène exécutée |
| Plans individuels proposés | 36 : deux plans par scène | 0 image |
| Variantes canoniques nouvellement certifiées | 0 | 0 |
| Animations produites | 0 | 0 |

Chapitres, scènes, plans et PNG sont des unités différentes : ce bilan ne s'ajoute pas aux images du lot 13. La phase de sprites fixes reste respectée ; les animations, mouvements de caméra et voix sont des besoins ultérieurs.

## 15. Références et limites

Les ancrages canon-me1, canon-me2, canon-me3, canon-infiltrator et canon-andromeda restent définis dans [fighters.json](../lot04/fighters.json). Cette préparation n'a pas relancé les jeux ni certifié les costumes complets.

Sources primaires déjà recensées : [guides de cosplay EA](https://www.ea.com/games/mass-effect/community/cosplay-guides), [Character Kits BioWare](https://www.bioware.com/digitalmedia/mass-effect/), [Mass Effect Infiltrates Android!](https://blog.bioware.com/2012/05/22/mass-effect-infiltrates-android/) et [Mass Effect Infiltrator Update](https://blog.bioware.com/2012/04/12/mass-effect-infiltrator-update/). Elles documentent des familles visuelles et capacités, pas les routes originales ou leurs dialogues.

La structure suit le [guide gamedev local](../../GAMEDEV_GUIDANCE.md) : IDs stables, texte séparé des variables, transitions explicites, sauvegardes et récompenses uniques. **Protocoles de relais**, ses chapitres, les rencontres et les plans de cette annexe sont des propositions du projet.

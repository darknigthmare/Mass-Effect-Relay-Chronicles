# Combat 2D — continuation Grunt, Legion et Port Hanshan

Date : **19 novembre 2026**. Socle du dépôt : `deb5c9382a697acd0cf72b182bc646337cdcfb25`.

**Statut de cette conception : Défini.** Ce document prépare le mode de combat annexe de Mass Effect — Relay Chronicles. Il détaille deux combattants, leurs dépendances visuelles et une arène. Les règles, commandes, durées, dialogues et scènes proposés sont des adaptations originales pour ce projet de fan. Aucun moteur de duel, personnage jouable supplémentaire ou cycle animé complet n'est attesté par ce document.

## 1. Périmètre et reprise de production

Le point de reprise vérifié est le dépôt du RPG ATB. Son [catalogue principal](../content-catalog.json), ses [catalogues par œuvre](../universe/catalogs/) et ses atlas conservent leur périmètre. Leurs portraits, poses et statuts ne deviennent pas automatiquement des livrables du combat latéral. Les deux fiches de cette annexe réutilisent les identités `ME2-CHR-GRUNT` et `ME2-CHR-LEGION` comme références documentaires ; leurs animations et règles versus devront posséder leurs propres identifiants.

La bible de 99 pages et les archives Lot02/Lot03 évoquées lors du précédent échange n'ont pas été retrouvées parmi les fichiers accessibles à cette reprise. Ce complément ne les remplace pas et ne prétend pas les restaurer. Lorsqu'elles seront disponibles, comparer les empreintes, les sujets, les variantes et les fichiers avant toute consolidation.

Le suivi de ce lot est porté par [production.json](production.json), puis ses exports [CSV](production.csv) et [Excel](Mass_Effect_Combat_Continuation_2026-11-19.xlsx). Le nombre d'images effectivement livrées, les chemins et les résultats de contrôle doivent être lus dans ce suivi. La liste de production ci-dessous exprime des besoins ; elle ne constitue pas un inventaire de fichiers déjà présents.

La fidélité visuelle **1:1 demeure l'objectif** : bonne identité, bon opus, costume exact, silhouette, anatomie et équipement vérifiés. Les valeurs de combat constituent un équilibrage spécifique au versus et ne sont jamais présentées comme les valeurs des jeux Mass Effect.

## 2. Contrat commun du duel proposé

La simulation prévue avance à 60 pas par seconde, indépendamment du rendu. Une image d'animation peut durer plusieurs pas. Les temporisations se comptent en pas entiers ; les effets cosmétiques ne prolongent pas une fenêtre active. Le jeu suspend les entrées et la simulation à la perte de focus en mode local.

| Paramètre | Proposition de départ | Critère de contrôle futur |
|---|---|---|
| Match | Deux manches gagnantes, 99 secondes par manche | Fin simultanée et égalité déterministes |
| Vitalité | Grunt 1 100 ; Legion 950 | Valeurs propres au mode annexe |
| Ressource | Jauge de 0 à 300, trois segments de 100 | Dépense atomique ; aucun coût sur entrée refusée |
| Entrées | L léger, M moyen, H lourd, T technique | Réaffectation clavier/manette et commandes simplifiées |
| Directions | Notation 1–9 relative au côté ; 5 neutre | Commande miroir calculée selon l'orientation au début du mouvement |
| Défense | Arrière pour garde haute, bas-arrière pour garde basse | Coups bas et attaques aériennes clairement distingués |
| Projection | L+M au contact ; déprojection dans les 8 premiers pas | Pas de prise durant le relevé protégé |
| Ressource initiale | 0 à chaque manche | Entraînement configurable, compétition fixe |
| Jauge gagnée | 8 sur normal touché ; 4 si bloqué ; 12 sur spécial touché | Aucun gain à vide, sur drone ou pendant une super |
| Combos | Dégâts successifs 100 %, 90 %, 80 %, puis plancher 30 % | Arrondi une fois par impact ; pas de boucle de compteur |

Dans les tableaux, **D/A/R** signifie démarrage, durée active et récupération. Le premier pas actif suit les D pas de démarrage. L'avantage en garde est une cible à mesurer au premier contact, hors arrêt d'impact. Toutes ces valeurs sont **proposées, non testées**. Le compteur de combo exige une continuité réelle d'étourdissement ; il ne confond pas succession rapide et enchaînement garanti.

Les annulations autorisées sont explicites : L vers M, M vers H, puis normal au sol vers spécial sur contact. Un spécial ne s'annule vers une super que sur touche. Les projections et la commande technique ne participent pas à cette chaîne. Le recul à la garde et l'échelle des distances doivent permettre une sortie : aucun tableau ne constitue une promesse de combo sans contrôle des positions.

## 3. Grunt — fiche de combattant ME2

### Identité et rôle

Grunt recherche le contact par la pression et l'anticipation. Sa grande silhouette, son avancée engagée et sa récupération longue rendent ses intentions lisibles. La source locale [des personnages](../../src/universe-actors.js) associe son profil ME2 aux fusils d'assaut, fusils à pompe, Concussive Shot, Fortification et Incendiary Ammo. Ces repères orientent la traduction versus ; le catalogue du RPG ne fournit pas ces nouveaux timings.

Verrouiller l'identité sur les références de Grunt : tête, crête, cou, masse du dos, épaules, bras, armure et pieds. Garder une version de costume définie avant les variantes. Ne pas transférer les scarifications, couleurs ou proportions d'un autre krogan. Le [guide officiel EA](https://www.ea.com/games/mass-effect/community/cosplay-guides) et le [travail de Jaemus Wurzbach](https://jwurzbach.artstation.com/projects/nJvvK) sont les points de départ de la comparaison artistique.

### Normaux et projections proposés

| Commande | Mouvement | D/A/R | Dégâts | Garde | Usage et limite |
|---|---|---:|---:|---:|---|
| 5L | Revers court | 7/2/10 | 35 | −2 | Interruption rapprochée ; portée courte |
| 2L | Frappe basse | 8/2/12 | 30 | −3 | Ouverture basse ; faible recul |
| 5M | Coup de crosse | 11/3/17 | 65 | −5 | Confirmation vers un spécial |
| 2M | Balayage court | 12/3/19 | 60 | −7 | Bas ; ne projette pas automatiquement |
| 5H | Percussion d'épaule | 18/4/26 | 95 | −10 | Grand engagement ; vulnérable à vide |
| 2H | Revers ascendant | 14/5/24 | 80 | −12 | Interception aérienne ; aucune invulnérabilité |
| 6H | Frappe plongeante | 25/3/25 | 90 | −9 | Attaque haute télégraphiée |
| j.L | Poing aérien | 7/4/variable | 30 | Variable | Récupération à l'atterrissage : 6 |
| j.M | Genou aérien | 10/5/variable | 55 | Variable | Récupération à l'atterrissage : 8 |
| j.H | Crosse descendante | 14/6/variable | 80 | Variable | Récupération à l'atterrissage : 10 |
| L+M | Saisie et repoussement | 6/2/28 | 120 | Sans objet | Prise déprojectable ; remise à distance courte |

### Spéciaux et ressource

| Commande | Proposition | D/A/R | Coût | Effet et réponse adverse |
|---|---|---:|---:|---|
| 236H | Tir de Claymore | 20/2/40 | 0 | 120 dégâts au contact, 70 à moyenne portée ; garde −24. Consomme la cartouche ; saut ou punition à vide |
| 22H | Rechargement | 42/0/0 | 0 | Si l'arme est vide, valide une cartouche au pas 42 ; interruption possible jusqu'à la validation |
| 214M | Percée krogan | 24/8/30 | 0 | 90 dégâts, garde −16 ; avancée corporelle sans téléportation ni propriété biotique |
| 236M | Tir percussif | 23/1/31 | 0 | 70 dégâts, garde −12 ; projectile lent, saut ou neutralisation par projectile de même niveau |
| 22T | Fortification | 28/0/18 | 100 | Pendant 120 pas, absorbe un seul coup non projetant avec 50 % des dégâts ; garde et déplacement ordinaires conservés |
| 214T | Munitions incendiaires | 30/0/15 | 100 | Les deux prochains tirs de Claymore gagnent 20 dégâts directs ; aucune brûlure permanente ni cumul |
| 236236H | Brèche décisive | 12/4/48 | 200 | Super de 250 dégâts avant réduction ; garde −28 ; portée courte, arrêt cinématique seulement après confirmation |

La percée est une **charge physique créée pour ce duel**, pas le pouvoir Charge d'un biotique. Fortification ne donne aucune immunité aux prises, aux attaques multiples ou aux supers. Sa protection disparaît au premier impact éligible et ne peut pas se réactiver avant la fin de la durée initiale. L'effet incendiaire appartient à l'arme ; il disparaît après deux tirs ou à la fin de la manche.

Le Claymore possède un état explicite chargé/vide. Tirer à vide donne un retour bref et lance le rechargement sans produire de projectile. Une interruption garde l'arme vide jusqu'à l'achèvement d'un nouveau rechargement. Aucun changement de pose, animation de victoire ou ouverture de menu ne recharge l'arme.

### Enchaînements et défense

Les séquences à vérifier sont `5L > 5M > 236M` pour confirmer sans dépense, `2L > 2M > 236H` uniquement avec une cartouche disponible, et `5M > 5H > 214M > 236236H` avec 200 points. Elles sont des routes d'essai ; leur portée, le recul et l'étourdissement pourront imposer des corrections.

Face à Grunt, garder la percée puis punir sa récupération doit être fiable. Ses bras et son buste restent touchables pendant l'avancée. Un adversaire peut provoquer le tir de Claymore, passer au-dessus de sa ligne puis profiter du rechargement. Une forte vitalité ne compense pas une option sans réponse : vérifier séparément défense au sol, saut, projection et recul.

## 4. Legion — fiche de combattant ME2

### Identité et rôle

Legion contrôle l'espace par la préparation du tir et un drone limité. Son profil ME2 est lié localement aux fusils d'assaut, fusils de précision, piratage, Combat Drone et Geth Shield Boost. Conserver la tête à optique unique, les articulations, les câbles, les panneaux et les éléments asymétriques propres au personnage. La version ME2 doit rester identifiée dans les fichiers et dans la sélection.

Le drone est un soutien distinct, jamais un deuxième combattant caché. Il possède un propriétaire, un état, une durée et une vulnérabilité visibles. Son apparence doit être comparée à la bonne variante de Combat Drone ; la fiche de Legion n'autorise pas à lui attribuer automatiquement les couleurs de Tali ou une tourelle d'un autre épisode.

### Normaux et projections proposés

| Commande | Mouvement | D/A/R | Dégâts | Garde | Usage et limite |
|---|---|---:|---:|---:|---|
| 5L | Frappe de paume | 6/2/9 | 30 | −1 | Défense rapprochée, portée courte |
| 2L | Contact bas | 7/2/10 | 25 | −2 | Bas ; pression limitée |
| 5M | Crosse horizontale | 10/3/16 | 55 | −4 | Portée moyenne |
| 2M | Balayage mécanique | 11/3/18 | 50 | −6 | Bas ; récupération punissable à vide |
| 5H | Crosse étendue | 16/4/23 | 85 | −9 | Extension de la zone vulnérable |
| 2H | Lever de fusil | 13/4/22 | 70 | −10 | Réponse aérienne sans invulnérabilité |
| 6M | Revers descendant | 24/3/22 | 65 | −7 | Ouverture haute lente |
| j.L | Paume aérienne | 6/4/variable | 25 | Variable | Récupération à l'atterrissage : 6 |
| j.M | Crosse aérienne | 9/5/variable | 45 | Variable | Récupération à l'atterrissage : 8 |
| j.H | Percussion descendante | 13/5/variable | 65 | Variable | Récupération à l'atterrissage : 10 |
| L+M | Verrouillage et rejet | 6/2/26 | 100 | Sans objet | Prise déprojectable ; séparation moyenne |

### Spéciaux et contrôle du drone

| Commande | Proposition | D/A/R | Coût | Effet et réponse adverse |
|---|---|---:|---:|---|
| 236H | Tir de précision | 27/1/35 | 0 | 110 dégâts, garde −18 ; signal de visée visible, aucune correction verticale après départ |
| 236L | Rafale courte | 17/3/24 | 0 | Trois impacts de 20, garde −8 ; un seul projectile logique par impact |
| 214T | Déploiement du drone | 34/0/22 | 100 | Un soutien, 80 PV, durée maximale 360 pas ; interruption avant activation annule le déploiement |
| T | Ordre de décharge | 10/0/16 | 0 | Si drone disponible : 18 pas d'annonce, puis 35 dégâts ; 90 pas avant nouvel ordre |
| 22T | Renfort de bouclier geth | 30/0/20 | 100 | Protection absorbant 80 dégâts pendant 180 pas ; n'annule ni étourdissement ni projection |
| 214M | Intrusion ciblée | 26/2/28 | 50 | Neutralise 90 pas un soutien adverse exposé ; portée courte, aucun contrôle du joueur adverse |
| 236236H | Solution de tir | 15/1/46 | 200 | 230 dégâts avant réduction ; garde −26 ; angle fixé avant déclenchement |

Un ordre T sans drone produit une indication d'indisponibilité sans dépense ni attaque. Le drone reste du côté de Legion : il se déplace vers un point choisi à distance fixe devant lui, sans poursuivre derrière l'adversaire. Sa décharge respecte la garde selon la direction de Legion. Ainsi, l'adversaire n'a pas à bloquer simultanément à gauche et à droite.

Le drone s'arrête pendant les cinématiques et disparaît à la fin de la manche, au KO de son propriétaire ou à sa destruction. Il ne décide jamais seul de la victoire, ne prend pas de récompense et n'alimente pas la jauge. Un coup reçu par Legion interrompt son ordre encore en préparation. La décharge ne peut pas prolonger un combo où une décharge a déjà touché.

L'intrusion vise uniquement un soutien déclaré piratable. Elle ne prend pas le contrôle d'un combattant synthétique, ne retire aucune commande au joueur et ne revendique pas une capacité canonique sur tous les personnages. Sans cible compatible, l'action échoue proprement. Le bouclier n'est pas cumulable et possède un indicateur distinct de la vitalité.

### Enchaînements et défense

Routes d'essai : `5L > 5M > 236L`, `2L > 2M > 236H` à courte distance, puis décharge confirmée `T > 5M > 236236H` lorsque le positionnement permet réellement le raccord. La troisième demande au moins 200 points disponibles après le déploiement antérieur du drone.

La réponse attendue consiste à avancer pendant la récupération du tir, interrompre le déploiement ou détruire le soutien. Un drone frappé n'inflige pas d'explosion gratuite. Legion doit pouvoir défendre avec ses normaux, mais ni son bouclier ni sa super ne donnent une sortie universelle contre la pression.

## 5. Intro, rival, fin de parcours et finishers

Les confrontations inter-épisodes prennent place dans une simulation du mode annexe. Elles ne modifient aucun choix, recrutement ou décès des campagnes. Les lignes suivantes sont **écrites pour ce projet**, sans attribution à des dialogues officiels. La fonction rival exprime un contraste de styles dans cette fiction, pas une rivalité canonique.

| Séquence | Grunt | Legion |
|---|---|---|
| Intro | Vérifie sa prise sur l'arme, avance d'un pas : « Cette fois, je passe devant. » | Termine un balayage optique : « Distance mesurée. Engagement autorisé. » |
| Rival croisé | Observe le drone : « Je commence par le petit. » | Ajuste sa garde : « La trajectoire la plus probable reste frontale. » |
| Victoire | Abaisse l'arme et relâche les épaules ; trois secondes, puis résultat | Replie le fusil et rappelle le drone avant le résultat |
| Ending | Revoit une tentative ratée, repart à l'entraînement ; progression personnelle sans nouveau fait d'univers | Compare plusieurs trajectoires et efface la solution unique ; le journal de simulation reste ouvert |

Chaque intro peut être passée par un joueur en solo et par accord des joueurs en local. Les paroles ont sous-titres et réglage séparé du volume. Aucune voix d'acteur officielle n'est supposée livrée. Les variantes de victoire demandent entrée, maintien et sortie de pose ; une image fixe ne remplit pas ces trois phases.

Les finishers se déclenchent uniquement après le KO final confirmé, dans une fenêtre proposée de 120 pas. Grunt effectue une percussion puis un tir hors champ ; Legion immobilise la cible dans la mise en scène et termine par un tir de précision. Les effets et destructions sont des créations du mode annexe. Un réglage **Finishers : désactivés / sobres / complets** sélectionne la présentation ; le résultat, les récompenses et la durée maximale de transition restent identiques. Le mode tournoi utilise la variante sobre ou un passage immédiat convenu dans ses règles.

## 6. Port Hanshan — arène ME1 et parallaxe

La cible est une vue latérale inspirée de Port Hanshan, sur Novéria, rattachée au contexte ME1. Le cadrage versus, la longueur du terrain et les positions de départ sont des adaptations. Comparer les structures, matériaux, volumes et éclairages à des vues identifiées du lieu avant d'utiliser le terme « reconstruction 1:1 ». Une ambiance neigeuse générique ne suffit pas à identifier Port Hanshan.

Préparer un espace de travail 16:9, avec un repère de composition proposé de 3 840 × 2 160. Conserver les dimensions natives réellement générées dans le manifeste : ce repère ne promet aucune sortie 4K et n'autorise pas un agrandissement présenté comme détail natif. La ligne des pieds se situe vers 82 % de la hauteur, à vérifier avec Grunt et Legion à taille de jeu.

| Couche prévue | Contenu | Facteur de déplacement | Collision |
|---|---|---:|---|
| PH-00 | Ciel et profondeur atmosphérique | 0,05 | Aucune |
| PH-10 | Relief lointain et masses du site | 0,12 | Aucune |
| PH-20 | Architecture distante identifiable | 0,28 | Aucune |
| PH-30 | Structures derrière le plan de combat | 0,55 | Aucune |
| PH-40 | Sol et jonctions du plan jouable | 1,00 | Géométrie séparée, une surface plane initiale |
| PH-50 | Bordures proches hors silhouettes | 1,10 | Aucune |
| PH-FX | Neige, vapeur, signaux lumineux | Variable | Aucune |

Les facteurs multiplient le déplacement de caméra ; ils ne décrivent pas une vitesse autonome des bâtiments. Toutes les couches partagent horizon, direction de lumière et points d'ancrage. Les couches détourées exigent un alpha réel, sans damier peint. Un fond complet peut servir de cible de composition ; il ne remplace pas les couches séparées.

Le terrain proposé mesure 1 920 unités de simulation et les départs sont placés à 640 et 1 280. Le cadrage inclut les deux combattants et laisse la place au saut le plus haut. Les bords bloquent le déplacement sans infliger de dégâts. Les collisions proviennent de données numériques versionnées, jamais de la lecture de la neige, de la vapeur ou des pixels du sol.

Prévoir 15 % de débord de composition sur les côtés des couches mobiles. Vérifier le cadrage minimal et maximal, les coins et le croisement des combattants pour éviter de dévoiler du vide. La version compétitive garde météo et éclairage stables ; les particules respectent le réglage de réduction des effets et ne masquent ni les pieds ni les projectiles. Aucun danger aléatoire ne modifie le résultat.

## 7. Images candidates et animations restantes

Chaque fichier contient **un seul sujet ou une seule couche**. Une posture de Grunt ne doit pas partager son image avec les autres poses. Le Claymore isolé ne contient pas de main. L'effet électrique et le drone restent séparables. Les sorties retenues gardent leur original et leur provenance ; une correction crée une version identifiée.

| Famille | Candidats du lot | Compléments à produire ensuite |
|---|---|---|
| Grunt ME2 | Garde, impact, contact de percée, victoire | Respiration, entrée/sortie de garde, accroupissement, marche, recul, saut, réception, chutes, relevé, toutes transitions d'attaque |
| Legion ME2 | Références d'identité et contrat de drone | Corps en garde, visée, recul de tir, déploiement, impact, saut, chute et victoire |
| Drone de Legion | Attente et décharge | Apparition, déplacement, anticipation, récupération, dommage, destruction et rappel |
| M-300 Claymore ME2 | Profil isolé | Prises en main cohérentes, recul, ouverture, recharge, fermeture, effets séparés |
| Port Hanshan ME1 | Fond ou cible de composition | Toutes couches indépendantes, jonctions du sol, débords, effets, revue de caméra |

Pour chaque action, préparer une fiche anticipation → contact → récupération, avec les durées proposées du moveset. Une pose clé ne devient pas un cycle par interpolation automatique. Vérifier volume, identité, longueur d'arme et stabilité des pieds entre images ; le pivot appartient à la fiche de la pose, pas au centre arbitraire du fichier. L'arme conserve un point d'attache mesuré dans la main porteuse.

Priorité P0 : identité de référence, garde, déplacement, attaques fondamentales, impacts, chute et relevé. Priorité P1 : spéciaux, soutien, rechargement, couches de l'arène. Priorité P2 : introductions, taunts, variantes de victoire et finishers. Un manquant reste inscrit même si une illustration similaire existe dans le RPG ou une autre œuvre.

## 8. Modes et ordre d'intégration

La première tranche jouable future devra réunir deux combattants, une arène, une manche complète et un entraînement avec reprise immédiate. L'entraînement affichera entrées, états, dégâts, récupération et zones de collision, avec mannequin configuré pour garde et punition. Ces outils servent à confirmer les tables avant l'ajout de routes narratives.

Le versus local utilisera les mêmes règles que l'entraînement. Le tournoi préparera un tableau à élimination directe, la gestion des participants absents, les rematches et une reprise d'état entre rencontres ; les résultats ne modifieront pas les sauvegardes du RPG. Le mode histoire associera intro, confrontation de rival et ending à une route explicitement adaptée. Chaque mode devra avoir un statut séparé dans le suivi.

Une future extension contre boss, véhicules ou créatures géantes demandera une caméra, des zones vulnérables et des annonces d'attaque spécifiques. Agrandir un sprite ne constitue ni un boss complet ni une preuve d'échelle canonique. Ce lot n'en ferme aucune fiche et ne réemploie pas les valeurs de duel pour revendiquer un équilibrage contre boss.

## 9. Acceptation et preuves à consigner

Les contrôles techniques portent sur le chargement, les dimensions, l'alpha utile, le cadrage, la marge des effets, le pivot et l'empreinte de chaque fichier. La revue à taille réelle porte sur la lisibilité, les proportions et la cohérence entre poses. La revue en jeu porte sur la caméra, les collisions et le déroulement des actions. La comparaison de fidélité porte sur les références du bon opus et les écarts relevés. Ces quatre conclusions restent distinctes.

Un fichier généré et inspecté peut recevoir le statut **Prototype**. Le statut **Intégré** exige son utilisation dans le parcours prévu. **Validé** exige les critères propres à la fiche, avec preuve et réserves conservées. L'exécution réussie de l'audit technique ne certifie pas la fidélité 1:1. Les timings et combos de cette conception restent **Défini** jusqu'à leur implémentation et leur observation.

La livraison doit enregistrer le commit de départ, les chemins réels, les résultats de vérification, le nombre d'images retenues et les manquants. Aucun test ancien, capture conceptuelle ou réussite du RPG ne sert de preuve de combat versus. La publication dans GitHub et le fonctionnement du mode sont également deux états distincts.

## Références et portée

- [Consignes du dépôt](../../AGENTS.md), [guide gamedev](../GAMEDEV_GUIDANCE.md), [briefs artistiques](../ART_BRIEFS.md) et [registre des assets](../ASSETS.md) : conventions, statuts et limites du projet existant.
- [Profils des personnages](../../src/universe-actors.js) et [catalogue ME2](../universe/catalogs/ME2.json) : identifiants et familles de capacités déjà suivis dans le RPG ; ne valident pas les règles versus proposées ici.
- [EA — guides de cosplay officiels](https://www.ea.com/games/mass-effect/community/cosplay-guides), consulté le 19 novembre 2026 : répertoire comprenant Grunt et Legion ; la présence d'un guide ne vaut pas comparaison de tous les pixels des nouveaux sprites.
- [Jaemus Wurzbach — Grunt, Mass Effect 2/3](https://jwurzbach.artstation.com/projects/nJvvK), consulté le 19 novembre 2026 : l'artiste identifie son travail de modèles, textures et matériaux de Grunt. Sélectionner les vues correspondant au costume retenu avant validation.

Les documents de référence gardent leurs attributions. Ce complément ne reproduit ni dialogue officiel ni guide complet ; les règles et scènes narratives sont des propositions du projet.

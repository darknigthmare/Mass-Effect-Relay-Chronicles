# Les Dettes de Nacre — Bible des 10 combattants

> Création originale pour Mass Effect Relay Chronicles. Conception du 27 novembre 2026. Ce document ne revendique aucun statut officiel et ne déclare pas les kits complets intégrés au moteur.

## 1. Intention et place dans l’univers

En 2185, une petite chaîne logistique des systèmes Terminus détourne des contrats de transit en dettes artificielles. La station originale Nacre et les installations de la lune minière originale Tessère sont tenues par le Concordat des Quais. Dix personnes découvrent dix faces de cette opération. Leur campagne traverse le même incident par des routes alternatives : leurs fins ne forcent aucune décision de Shepard, aucun résultat de Mass Effect 3, aucune rencontre avec Andromeda et aucun changement à la carte des relais.

Le conflit reste à l’échelle des quais, des équipes de travail, des familles et des témoins. Les antagonistes ne contrôlent pas secrètement la galaxie. Chaque héroïsme repose sur une compétence et une responsabilité : escorter, réparer, protéger, établir la preuve ou laisser une personne choisir sa destination.

### Fidélité visuelle et création originale

Les identités, tenues, intrigues et coups de Nacre sont inventés pour le projet. La fidélité recherchée porte sur la morphologie des espèces, le langage de fabrication des armures, les limites de la technologie, la lisibilité des rôles et la cohérence de l’époque. Aucun original ne possède une référence canon personnelle « 1:1 » ; les contrôles doivent donc comparer les invariants de son espèce et de son équipement, puis la continuité avec sa fiche approuvée.

## 2. Contrat de combat de conception

- **version** : RC-ARMAX-0.1 design extension
- **simulationHz** : 60
- **meterMaximum** : 300
- **superCost** : 100
- **notation** : 5 neutre ; 2 bas ; 4 arrière ; 6 avant ; j en l’air ; 236 quart de cercle avant ; 214 arrière ; 623 avant-bas-diagonale ; 22 bas-bas ; L+M simultané (alias avant au neutre ; arrière différé hors prototype).
- **scope** : Les nombres sont des intentions de réglage, pas un équilibrage certifié ni une description de tous les états du prototype.
- **simplifiedInputs** : Le prototype expose seulement L/M/H/S, garde et mouvement. Les commandes directionnelles, contres, lancers, pièges avancés, ressources propres et cinématiques restent à relier explicitement avant d’être annoncés comme jouables.
- **normalCancel** : L vers M ou H ; M vers H ; un normal confirmé vers un spécial autorisé. Aucun cancel infini et aucun super automatique sur garde.
- **airRule** : Un saut physique, sans double saut universel, vol ou dash aérien inventé. Hauteurs et arcs adaptés aux silhouettes.
- **throws** : Portée de contact, fenêtre de déchoppage commune de conception de 10 frames ; les command throws annoncées ne sont pas garanties après garde.
- **finisherRule** : Cinématique de fin appelée Neutralisation décisive ; aucune exécution pendant une manche, aucun rival tué par un résultat de duel non létal.
- **tagRule** : Assistance de conception à 25 points, délai global et un appel actif ; modes compétitifs sans bonus chiffré de taunt.
- **damageRule** : Dégâts indiqués avant les règles de protection, échelle de combo et ajustements du moteur. Un effet de bouclier n’est pas un soin de santé.
- **tuningGate** : Vérifier portée, temps de réaction, dégâts de combo, collision des petits corps et boucles de restauration avant qualification.

Tous les nombres suivants sont provisoires et exprimés pour une simulation à 60 Hz. Une donnée de conception n’est ni une animation produite, ni une mécanique raccordée, ni une mesure d’équilibrage. La preuve d’intégration appartient au prototype, à ses tests et à son manifeste.

## 3. Roster et rivalités

| Personnage | Espèce | Rôle | Rival | Vie / bouclier proposés |
|---|---|---|---|---|
| Mara Vey | Humaine | Escorte polyvalente | Tavin Rhex | 1000 / 220 |
| Tavin Rhex | Turien | Contrôle à mi-distance | Mara Vey | 1000 / 280 |
| Ilyra Senn | Asari | Contrôle biotique | Nyra Korr | 900 / 250 |
| Keela’Vess nar Tasera | Quarienne | Ingénieure d’interception | Selek Dhan | 900 / 280 |
| Ghoran Brakk | Krogan | Lutteur lourd | Varek Hesk | 1300 / 100 |
| Neral Vesh | Drell | Infiltration | Dalo Ruun | 850 / 160 |
| Selek Dhan | Galarien | Pièges et sabotage | Keela’Vess nar Tasera | 850 / 220 |
| Varek Hesk | Batarien | Briseur de proximité | Ghoran Brakk | 1100 / 180 |
| Dalo Ruun | Volus | Renfort de protection | Neral Vesh | 800 / 380 |
| Nyra Korr | Turienne | Éclaireuse de précision | Ilyra Senn | 900 / 220 |

## 4. Mara Vey

**ID :** `nacre_mara_vey` · **Espèce :** Humaine · **Rôle :** Escorte polyvalente

### Identité et limites

Ancienne fusilière régulière de l’Alliance devenue escorte de convois, Mara a signé la livraison d’un groupe de travailleurs qui n’est jamais arrivé. Elle revient à Nacre avec les doubles de ses bordereaux, convaincue qu’un officier de quai a transformé son évacuation en saisie de personnel. Elle n’a ni grade N7 ni autorité Spectre. Sa compétence vient de l’escorte, de la discipline de tir et de la responsabilité qu’elle assume pour les passagers disparus.

**Objectif :** Retrouver les passagers du convoi Vey-17, admettre sa propre négligence et remplacer les promesses de sauvetage par une évacuation vérifiable.

**Équipement :** Carabine de masse de gabarit M-8 Avenger ; Protection composite de fret ; Munitions à fonction concussive adaptées au duel.

**Invariants :** Aucun pouvoir biotique ; Aucun insigne N7 ; Aucune immunité par statut militaire.

### Direction visuelle

Femme adulte, carrure athlétique crédible d'escorte de fret, visage brun aux cheveux noirs courts repoussés derrière l'oreille, petite cicatrice verticale au sourcil gauche. Armure composite graphite aux volumes fonctionnels Mass Effect, plaques sternum et épaules ivoire usé, discrètes bandes de repérage cuivre sur l'avant-bras droit, combinaison technique anthracite, bottes fermées. Carabine de masse de gabarit Avenger compacte tenue basse, canon vers la droite ; aucune arme surdimensionnée. Attitude stable, pieds décalés, regard vigilant, aucun effet de pouvoir.

**Silhouette :** Triangle compact, épaules modérées, taille protégée, arme à deux mains sous la ligne du visage.

**À exclure :** Aucune armure ou visage de Shepard/Ashley, pas de logo N7, pas d'aura biotique, pas de talons.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Personnage d’apprentissage exigeant sur la discipline de tir : alterner un projectile lisible, les coups de crosse et une courte progression protégée. Son point faible est la récupération de ses tirs à longue distance.

**Ressource propre de conception :** Une salve spéciale consomme une charge thermique de conception ; trois salves disponibles, rechargement vulnérable de 42 frames. Les coups de crosse ne consomment pas de charge. Ce réservoir est une abstraction de duel, pas une règle canon de fonctionnement de l’arme.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Coup de paume au poignet | 45 | 6 / 3 / 12 | mid | Interrompre une approche courte. |
| 5M | Crosse au sternum | 70 | 10 / 4 / 17 | mid | Confirmer une ouverture sans tirer. |
| 5H | Crosse descendante | 100 | 16 / 4 / 25 | mid | Punir un engagement trop proche. |
| 2L | Balayage de cheville | 40 | 7 / 3 / 13 | low | Tester la garde basse. |
| 2M | Genou bas | 65 | 11 / 4 / 19 | low | Garder l’adversaire au contact. |
| 2H | Crosse montante | 90 | 14 / 5 / 29 | mid | Dégager une trajectoire aérienne. |
| jL | Poing en descente | 40 | 7 / 4 / 10 | overhead | Approche aérienne de faible portée. |
| jM | Genou sauté | 65 | 10 / 5 / 14 | overhead | Ouvrir la garde haute. |
| jH | Crosse d’atterrissage | 95 | 15 / 5 / 19 | overhead | Retomber devant la cible, sans ambiguïté de côté. |
| 6H | Avancée sous protection | 105 | 20 / 5 / 25 | overhead | Pas de progression suivi d’un coup de crosse ; aucune invulnérabilité. |
| 6L+M / 4L+M | Sortie de ligne | 125 | 7 / 2 / 29 | throw | Saisie du poignet, déplacement de l’arme et projection latérale, sans tir sur une cible déjà neutralisée. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Tir concussif — 236S** : Une décharge de masse horizontale à portée moyenne repousse sans téléporter.

- Réglage proposé : 120 dégâts ; 18 / 4 / 25 frames ; coût 0 sur 300.
- Réponse adverse : Saut anticipé ou garde puis punition à courte portée.

**Angle de crosse — 623S** : Uppercut de crosse anti-aérien. Ne protège pas les jambes au sol.

- Réglage proposé : 105 dégâts ; 11 / 4 / 32 frames ; coût 0 sur 300.
- Réponse adverse : Appât au sol puis punition de récupération.

**Repli d’escorte — 214S** : Court recul physique suivi d’un tir seulement si S est relâché. Le recul reste vulnérable aux coups bas.

- Réglage proposé : 80 dégâts ; 12 / 4 / 27 frames ; coût 0 sur 300.
- Réponse adverse : Poursuivre au sol ; attendre le tir pour avancer.

**Changement de clip — 22S** : Éjecte le dissipateur chaud et réarme les trois salves ; l’action peut être interrompue et ne restaure aucune santé.

- Réglage proposé : 0 dégâts ; 1 / 4 / 42 frames ; coût 0 sur 300.
- Réponse adverse : Mettre sous pression pendant la manipulation.

**Couloir dégagé — 236236S** : Après un premier impact confirmé, succession de deux tirs concussifs et d’une poussée de crosse qui crée une fenêtre d’extraction.

- Réglage proposé : 285 dégâts ; 12 / 12 / 42 frames ; coût 100 sur 300.
- Réponse adverse : Garder la première décharge ou sauter avant son activation.

### Neutralisation, tag et provocation

**Neutralisation décisive — Bordereau clos :** Désarme la cible, tire dans son module de protection déjà en panne puis la met au sol avec une sangle d’arrestation. Le tir vise le matériel ; un rival vivant reste évacuable. Fin de manche seulement, adversaire vaincu et version narrative non létale. Durée cible : 5 secondes.

**Assistance — Tir de couverture :** Une salve horizontale lente force la garde pendant l’entrée du partenaire. Coût proposé : 25. Réponse : Peut être bloquée ou évitée ; une seule assistance active.

**Provocation — Contrôle du bordereau :** « Cette fois, tout le monde arrive. » Vérifie un jeton d’embarquement puis reprend sa garde. Cosmétique ; aucune recharge ni bonus.

### Routes de combo proposées

- `5L > 5M > 236S` — Confirmation simple suivie d’une mise à distance.
- `2M > 5H > 236236S` — Conversion à 100 points après ouverture confirmée ; aucun super automatique sur garde.

### Campagne personnelle

**Intro :** À bord d’une navette vide, Mara réécoute dix-sept confirmations d’embarquement. Le manifeste reçu à Nacre n’en reconnaît que six. Elle s’arrime au quai avant que les traces ne soient purgées.

**Rival :** Tavin Rhex. Mara veut forcer immédiatement les portes ; Tavin refuse un assaut qui exposerait les civils derrière. Leur duel non létal décide qui commande la traversée.

> Mara : « Chaque minute que tu négocies leur donne un autre quai. »
> Tavin : « Chaque porte que tu ouvres sans regarder leur donne un otage. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_01, nacre_stage_02, nacre_stage_04, nacre_stage_06, nacre_stage_10, nacre_stage_12, nacre_stage_13, nacre_stage_20.

**Adversaires personnels :** nacre_boss_01, nacre_boss_13. **Final commun :** nacre_boss_20.

**Choix :** Publier le faux manifeste immédiatement ou attendre la sortie du dernier groupe ; les deux voies sauvent des personnes différentes dans cette affaire locale.

**Ending :** Mara évacue les passagers dont elle a retrouvé la trace et remet les copies intactes des contrats aux familles. Elle rend sa licence d’escorte le temps de l’enquête, puis reprend du service avec un protocole où chaque personne confirme son arrivée. Les disparus non retrouvés restent une responsabilité, pas une victoire effacée du registre.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 5. Tavin Rhex

**ID :** `nacre_tavin_rhex` · **Espèce :** Turien · **Rôle :** Contrôle à mi-distance

### Identité et limites

Ancien coordinateur de sécurité d’une compagnie de transit turienne, Tavin a quitté son employeur quand les escortes ont commencé à protéger les créanciers plutôt que les passagers. Sa signature reste attachée à plusieurs procédures utilisées par le Concordat des Quais. Il est méthodique, mais le doute ne l’a pas rendu passif : il veut employer sa connaissance du dispositif pour ouvrir des couloirs de sortie.

**Objectif :** Rendre les protocoles de sûreté à ceux qu’ils devaient protéger et identifier qui a détourné ses schémas de défense.

**Équipement :** Pistolet de masse de service ; Omni-outil de maintenance ; Générateur de couvert cinétique compact à durée limitée.

**Invariants :** Mandibules et posture turiennes lisibles ; Aucun pouvoir biotique ; Couvert créé par équipement destructible, pas par anatomie.

### Direction visuelle

Turien adulte masculin grand et sec, exosquelette facial gris pierre, mandibles lisibles, crête crânienne longue propre aux turiens, marquage tribal bleu ardoise discret sur le côté du visage. Armure industrielle segmentée bleu pétrole et gris clair, épaules angulaires, jambes turiennes anatomiquement lisibles, bottes digitigrades compatibles. Petit module de réparation fermé sur hanche gauche ; pas de bouclier médiéval. Pistolet de masse compact bas dans la main droite et avant-bras gauche dégagé pour omni-outil inactif. Position de contrôle stable et légèrement de biais, profil vers la droite.

**Silhouette :** Long torse étroit, crête et mandibles identifiables, protections angulaires, profil haut.

**À exclure :** Pas de visage balafré ou armure Garrus, pas d'armure de Saren, aucun visage humain.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Contrôleur de mi-distance : ses meilleurs coups interceptent une course. Il perd son avantage lorsqu’un adversaire traverse son dispositif ou lui impose une garde basse prolongée.

**Ressource propre de conception :** Un seul émetteur de couvert posé à la fois. Déployer un second remplace le premier. Sa durée et sa résistance limitées empêchent une forteresse permanente.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Main de contrôle | 45 | 6 / 3 / 12 | mid | Contrôler le poignet proche. |
| 5M | Coude de ligne | 70 | 10 / 4 / 17 | mid | Conserver la distance de crosse. |
| 5H | Pointe de crosse | 100 | 16 / 4 / 25 | mid | Contester la portée adverse. |
| 2L | Croche-pied court | 40 | 7 / 3 / 13 | low | Sanctionner une garde debout. |
| 2M | Poussée basse | 65 | 11 / 4 / 19 | low | Écarter un poursuivant. |
| 2H | Bras de barrage | 90 | 14 / 5 / 29 | mid | Intercepter une retombée. |
| jL | Paume aérienne | 40 | 7 / 4 / 10 | overhead | Interrompre un saut face à face. |
| jM | Genou de traversée | 65 | 10 / 5 / 14 | overhead | Approche aérienne prudente. |
| jH | Crosse verticale | 95 | 15 / 5 / 19 | overhead | Frapper verticalement sans couverture gratuite. |
| 6H | Pas de barrage | 110 | 18 / 5 / 28 | mid | Long coup de crosse qui fait reculer mais laisse la jambe avancée exposée. |
| 6L+M / 4L+M | Réorientation | 120 | 7 / 2 / 28 | throw | Détourne l’axe de l’adversaire puis le pousse hors de sa ligne de tir. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Tir de contention — 236S** : Projectile de faible recul qui marque l’espace devant lui ; pas de verrouillage automatique.

- Réglage proposé : 105 dégâts ; 17 / 4 / 26 frames ; coût 0 sur 300.
- Réponse adverse : Saut ou changement de rythme avant la décharge.

**Couvert de fortune — 214S** : Pose un émetteur devant lui qui intercepte une seule attaque à projectile normale, puis s’éteint.

- Réglage proposé : 0 dégâts ; 25 / 4 / 24 frames ; coût 0 sur 300.
- Réponse adverse : Avancer au corps à corps, feinter un tir ou frapper le module.

**Déviation de ligne — 623S** : Contre technique des seuls projectiles cinétiques de catégorie légère ; ne renvoie ni super ni attaque de contact.

- Réglage proposé : 80 dégâts ; 6 / 4 / 36 frames ; coût 0 sur 300.
- Réponse adverse : Attendre la fin de la fenêtre ou utiliser une attaque de contact.

**Surcharge locale — 22S** : Courte impulsion de son omni-outil : dégâts de bouclier élevés, portée courte, récupération importante.

- Réglage proposé : 95 dégâts ; 22 / 4 / 33 frames ; coût 0 sur 300.
- Réponse adverse : Rester hors de la portée puis punir.

**Périmètre tenu — 236236S** : Trois angles de tir successifs annoncés au sol ; le premier doit toucher pour déclencher le zoom cinématique.

- Réglage proposé : 275 dégâts ; 15 / 18 / 43 frames ; coût 100 sur 300.
- Réponse adverse : Garde initiale puis punition ; aucun encerclement imblocable.

### Neutralisation, tag et provocation

**Neutralisation décisive — Ordre de mise à l’abri :** Verrouille l’arme adverse par surcharge, désarme puis enferme la cible vaincue dans le couvert de sécurité temporaire afin qu’une équipe puisse la récupérer. Fin de manche ; protection temporaire illustrative, pas prison infinie. Durée cible : 5 secondes.

**Assistance — Angle sûr :** Déploie un écran qui absorbe un projectile léger, puis disparaît. Coût proposé : 25. Réponse : Le corps à corps, les projectiles lourds et le déplacement le contournent.

**Provocation — Vérification des angles :** « La sortie est derrière moi. » Inspecte les deux extrémités du quai. Cosmétique.

### Routes de combo proposées

- `5M > 5H > 236S` — Punition à mi-distance.
- `623S [contre réussi] > 5M > 236236S` — Conversion après lecture d’un projectile ; échec du contre lourdement punissable.

### Campagne personnelle

**Intro :** Tavin reconnaît sa propre grille de contrôle sur une porte où des évacués attendent sous la menace. Il coupe son identification professionnelle et entre comme simple passager.

**Rival :** Mara Vey. Tavin veut cartographier les prisonniers avant l’assaut ; Mara ne croit plus aux délais administratifs. Ils se disputent la méthode, pas la valeur des vies.

> Tavin : « Une sortie n’est pas sûre parce qu’elle est ouverte. »
> Mara : « Une sortie fermée ne sauve personne. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_01, nacre_stage_04, nacre_stage_06, nacre_stage_09, nacre_stage_12, nacre_stage_14, nacre_stage_19, nacre_stage_20.

**Adversaires personnels :** nacre_boss_06, nacre_boss_19. **Final commun :** nacre_boss_20.

**Choix :** Sacrifier ses anciens accès pour ouvrir tout de suite un passage ou les conserver jusqu’à la preuve finale ; conséquences locales sur les secours.

**Ending :** Il livre les clés du réseau de sûreté à une équipe indépendante de travailleurs et fournit le journal de ses anciennes autorisations. Une voie d’évacuation reste tenue jusqu’au dernier transport. Il accepte de témoigner contre son employeur, même si l’enquête examine aussi ses décisions passées.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 6. Ilyra Senn

**ID :** `nacre_ilyra_senn` · **Espèce :** Asari · **Rôle :** Contrôle biotique

### Identité et limites

Ilyra a été médiatrice pour des communautés dont les contrats de relogement dépendaient de la chaîne de Nacre. Biotique formée, elle a longtemps séparé les familles de leurs créanciers en négociant des échéances. La découverte de personnes inscrites comme garanties matérielles rend cette neutralité impossible. Elle n’est ni Justicar ni maîtresse d’un ordre secret : elle connaît les gens que le système transforme en chiffres.

**Objectif :** Retrouver les familles déplacées, préserver leurs choix et mettre les signataires face aux conséquences de leurs actes.

**Équipement :** Amplificateur biotique entretenu ; Armure légère de protection ; Omni-outil d’identification des passagers.

**Invariants :** Crêtes naturelles asari, aucun cheveu ; Biotique issue d’une aptitude et d’une formation, pas d’un artefact magique ; Pas de stase infinie ni de contrôle mental.

### Direction visuelle

Asari adulte à peau bleu violet désaturé, visage calme, crêtes naturelles lisses de la tête nettement visibles, aucun cheveu ni oreille humaine. Tenue d'intervention biomédicale et protection légère, plastron gris perle, panneaux prune profond, sous-combinaison presque noire, petites attaches cuivre. Un gant technique à l'avant-bras, aucun bâton. Elle pose un pied devant l'autre avec mains libres ouvertes à hauteur du torse, disponibilité biotique indiquée seulement par un minuscule reflet bleu sur la paume gauche, sans sphère géante. Silhouette élégante mais équipée, bottes plates, rien de sexualisé.

**Silhouette :** Épaules douces, protection légère, mains et crêtes dégagées pour animation.

**À exclure :** Pas de tenue Liara/Samara/Aria, pas de cheveux, pas de talons, pas de cristal ou magie runique.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Contrôle biotique mobile : elle prépare une courte ouverture et choisit de projeter ou d’approcher. Sa faible robustesse punit les préparations irréfléchies.

**Ressource propre de conception :** Après deux effets de contrôle successifs sur la même cible, celle-ci reçoit une immunité de juggle de 90 frames. La stase de conception protège la cible des dégâts pendant son arrêt ; elle ne devient pas un combo gratuit.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Paume d’écart | 45 | 6 / 3 / 12 | mid | Créer un petit intervalle sans pouvoir. |
| 5M | Coude fluide | 70 | 10 / 4 / 17 | mid | Confirmer une touche rapprochée. |
| 5H | Paume renforcée | 100 | 16 / 4 / 25 | mid | Coup physique accompagné d’un faible champ bleu. |
| 2L | Balayage léger | 40 | 7 / 3 / 13 | low | Menacer la garde basse. |
| 2M | Genou bas | 65 | 11 / 4 / 19 | low | Arrêter une course. |
| 2H | Élévation de garde | 90 | 14 / 5 / 29 | mid | Intercepter sans lévitation permanente. |
| jL | Main descendante | 40 | 7 / 4 / 10 | overhead | Toucher au début de la descente. |
| jM | Talonnade aérienne | 65 | 10 / 5 / 14 | overhead | Approche aérienne claire. |
| jH | Paume en retombée | 95 | 15 / 5 / 19 | overhead | Attaque lourde lisible et punissable. |
| 6H | Main de traverse | 95 | 22 / 4 / 26 | overhead | Paume biotique à courte portée au-dessus de la garde basse ; très visible. |
| 6L+M / 4L+M | Dépose contrôlée | 115 | 8 / 2 / 30 | throw | Saisie au contact, assistance biotique brève et dépose de l’adversaire au sol ; aucune télékinésie pleine portée. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Projection — 236S** : Champ biotique bref qui avance en ligne droite et repousse ; jamais un portail.

- Réglage proposé : 115 dégâts ; 18 / 4 / 27 frames ; coût 0 sur 300.
- Réponse adverse : Garder ou sauter avant le passage du champ.

**Lévitation brève — 623S** : Soulève une cible déjà vulnérable dans une petite colonne devant elle ; bouclier intact limite l’effet à un recul.

- Réglage proposé : 90 dégâts ; 19 / 4 / 34 frames ; coût 0 sur 300.
- Réponse adverse : Rester hors de la colonne ou interrompre le démarrage.

**Stase de sûreté — 214S** : Immobilise un court instant sans dégâts, et empêche les dégâts tant que l’enveloppe reste active ; sert à se replacer.

- Réglage proposé : 0 dégâts ; 24 / 4 / 30 frames ; coût 0 sur 300.
- Réponse adverse : Approcher pendant le démarrage ; après sortie de stase, reprise neutre sans avantage automatique.

**Barrière resserrée — 22S** : Concentre sa protection vers l’avant pour une courte fenêtre ; ne couvre ni une projection ni les coups venant de derrière.

- Réglage proposé : 0 dégâts ; 8 / 4 / 29 frames ; coût 0 sur 300.
- Réponse adverse : Projection au contact, délai ou changement de côté.

**Champ de dégagement — 236236S** : Impact biotique confirmé, soulèvement limité puis projection hors du couloir d’évacuation ; la cible retombe sur le même plan de jeu.

- Réglage proposé : 290 dégâts ; 16 / 10 / 44 frames ; coût 100 sur 300.
- Réponse adverse : Garder la première poussée ou interrompre la préparation.

### Neutralisation, tag et provocation

**Neutralisation décisive — Dépose sous protection :** Arrête brièvement la chute de l’adversaire vaincu, dépose son arme hors de portée puis l’immobilise dans un filet de retenue physique fourni par l’équipe de quai. Fin de manche ; la stase ne sert pas à infliger des dégâts à une cible invulnérable. Durée cible : 6 secondes.

**Assistance — Écart biotique :** Une petite poussée défensive sépare les combattants sans garantir un combo. Coût proposé : 25. Réponse : Bloquable, courte portée et pas de capture aérienne infinie.

**Provocation — Main ouverte :** « Vous pouvez encore vous arrêter. » Ouvre une paume sans produire de pouvoir. Cosmétique.

### Routes de combo proposées

- `5L > 5M > 236S` — Confirmer puis créer de l’espace.
- `623S [sans bouclier] > jM > 236236S` — Conversion aérienne dans la limite anti-juggle ; pas de combo sur stase.

### Campagne personnelle

**Intro :** Dans un centre de transit, une enfant lui rend le jeton qui garantissait un logement. Le code mène à un quai condamné. Ilyra suit cette preuve avec les familles qui acceptent son aide.

**Rival :** Nyra Korr. Nyra veut exfiltrer les témoins avant la négociation ; Ilyra veut laisser les familles décider de leur destination. Leur confrontation protège les deux options.

> Ilyra : « Les mettre en sécurité ne vous donne pas le droit de choisir leur vie. »
> Nyra : « Et une signature ne vaut rien si personne ne sort d’ici. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_02, nacre_stage_03, nacre_stage_07, nacre_stage_08, nacre_stage_12, nacre_stage_16, nacre_stage_18, nacre_stage_20.

**Adversaires personnels :** nacre_boss_02, nacre_boss_16. **Final commun :** nacre_boss_20.

**Choix :** Préserver un passage discret pour les familles ou rendre l’abus public pour briser les contrats ; la décision change les témoins disponibles, pas le canon galactique.

**Ending :** Elle organise un choix explicite entre refuge local, départ et témoignage protégé. Son dernier dialogue n’impose pas le pardon à ses anciens collègues. Les familles reprennent possession de leurs dossiers ; le récit s’achève sur un lieu où l’on peut rester sans dette fabriquée.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 7. Keela’Vess nar Tasera

**ID :** `nacre_keela_vess` · **Espèce :** Quarienne · **Rôle :** Ingénieure d’interception

### Identité et limites

Keela est en pèlerinage ; Tasera est le nom original de son vaisseau de naissance dans ce projet. Elle réparait des pompes de transit pour financer un matériel utile à la Flotte quand elle a reconnu ses propres codes d’entretien dans un système de verrouillage des personnes. Elle ne peut pas effacer ce détournement en changeant simplement d’employeur. Son talent porte sur l’interface et la maintenance, pas sur une domination magique de toute intelligence synthétique.

**Objectif :** Démonter les serrures qu’elle a involontairement rendues fiables, puis rentrer avec une contribution dont elle connaît les usages.

**Équipement :** Combinaison environnementale intégralement étanche ; Omni-outil de maintenance ; Drone d’interception non conscient ; Pistolet compact de défense.

**Invariants :** Visière et respirateur conservés en combat et en victoire ; Pas de visage nu ajouté pour une pose ; Drone à programme limité, aucune IA geth docile invoquée.

### Direction visuelle

Quarienne adulte élancée, combinaison environnementale entièrement fermée et étanche, visière fumée opalescente opaque aux traits humains, respirateur frontal et flexibles discrets. Capuche courte couleur terre cuite et étole asymétrique sable, étoffe à micro-motif géométrique original sans reprise du motif de Tali, protections graphite aux articulations, petites pièces d'atelier bleu acier. Morphologie et mains de quarienne, jambes anatomiquement compatibles, pas de visage nu. Pose basse technique, avant-bras droit prêt pour omni-outil mais sans interface ni projecteur visible, petit pistolet de masse tenu bas dans l'autre main. Drone non présent dans l'image, produit séparément.

**Silhouette :** Capuche courte, volume des tuyaux limité, longue ligne des jambes, outils compacts.

**À exclure :** Pas de Tali recolorée, pas de combinaison violette iconique, pas de visage découvert, pas de second personnage/drone.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Ingénieure de position : elle prépare un relais qui gêne l’approche, puis profite d’un petit tir de couverture. Elle souffre lorsqu’on détruit son dispositif avant son armement.

**Ressource propre de conception :** Un drone ou relais actif maximum ; trois commandes de tir au plus avant retour. La perte du dispositif entraîne une récupération de système de 180 frames. Les drones ne persistent pas après un changement de manche.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Contact de gant | 45 | 6 / 3 / 12 | mid | S’écarter d’un contact dangereux. |
| 5M | Coude d’atelier | 70 | 10 / 4 / 17 | mid | Obtenir une confirmation courte. |
| 5H | Crosse courte | 100 | 16 / 4 / 25 | mid | Finir un échange rapproché. |
| 2L | Crochet de botte | 40 | 7 / 3 / 13 | low | Tester la garde basse sans exposer les tuyaux. |
| 2M | Genou de recul | 65 | 11 / 4 / 19 | low | Pousser en recul. |
| 2H | Bras de déviation | 90 | 14 / 5 / 29 | mid | Intercepter une arrivée aérienne. |
| jL | Paume en descente | 40 | 7 / 4 / 10 | overhead | Petite attaque de saut. |
| jM | Genou oblique | 65 | 10 / 5 / 14 | overhead | Approche compacte. |
| jH | Crosse de secours | 95 | 15 / 5 / 19 | overhead | Punition aérienne lourde. |
| 4H | Recul de maintenance | 95 | 17 / 4 / 27 | mid | Frappe du coude accompagnée d’un petit pas arrière, sans invulnérabilité. |
| 6L+M / 4L+M | Prise de dérivation | 115 | 7 / 2 / 30 | throw | Utilise le poignet et l’élan de la cible pour la tourner ; sa combinaison reste fermée. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Relais d’interception — 236S** : Pose au sol un relais qui émet un seul arc court si un adversaire entre dans sa zone après armement.

- Réglage proposé : 105 dégâts ; 27 / 4 / 25 frames ; coût 0 sur 300.
- Réponse adverse : Frapper le relais avant armement, sauter au-dessus de sa zone ou garder.

**Drone de diversion — 214S** : Un drone non conscient arrive à un point fixe, produit une décharge télégraphiée puis revient ; aucun suivi parfait de cible.

- Réglage proposé : 85 dégâts ; 30 / 4 / 22 frames ; coût 0 sur 300.
- Réponse adverse : Intercepter le drone ou passer sous sa ligne de tir.

**Surcharge d’urgence — 623S** : Impulsion courte contre les protections techniques ; ne désactive pas gratuitement toutes les attaques adverses.

- Réglage proposé : 95 dégâts ; 15 / 4 / 31 frames ; coût 0 sur 300.
- Réponse adverse : Rester hors de la portée et punir le geste.

**Rappel du relais — 22S** : Récupère le dispositif en place ; produit une fenêtre de repositionnement, sans explosion ni dégâts gratuits.

- Réglage proposé : 0 dégâts ; 12 / 4 / 20 frames ; coût 0 sur 300.
- Réponse adverse : Punir le rappel si elle est acculée.

**Circuit de sortie — 236236S** : Une décharge initiale ouvre une boucle entre deux relais temporaires, qui referment leurs arcs sur la cible touchée puis se désactivent.

- Réglage proposé : 280 dégâts ; 19 / 12 / 44 frames ; coût 100 sur 300.
- Réponse adverse : Garder le premier arc ; les relais ne capturent pas sur garde.

### Neutralisation, tag et provocation

**Neutralisation décisive — Accès révoqué :** Coupe les commandes de l’équipement de la cible vaincue, récupère son propre relais et envoie le code de déverrouillage du quai aux évacués. Fin de manche ; sabotage limité au matériel présent, pas prise de contrôle d’une personne. Durée cible : 5 secondes.

**Assistance — Décharge d’interception :** Un relais disparaissant après une impulsion crée une menace basse de courte portée. Coût proposé : 25. Réponse : Télégraphe, blocage et destruction du relais.

**Provocation — Diagnostic propre :** « Ce verrou aussi était mal câblé. » Tapote un module de poignet sans rompre l’étanchéité. Cosmétique, aucun soin.

### Routes de combo proposées

- `2L > 5M > 623S` — Défense au contact quand le relais est détruit.
- `236S [arc confirmé] > 5M > 236236S` — Récompenser un placement réussi sans garantie après simple pose.

### Campagne personnelle

**Intro :** Keela découvre une mise à jour portant sa signature sur une porte de confinement. Elle photographie les numéros, arrache le réseau du contrôle central puis cherche les personnes encore enfermées.

**Rival :** Selek Dhan. Selek veut effacer les commandes compromises ; Keela veut en préserver les journaux pour identifier les responsables. Le conflit porte sur la réparation sans destruction de preuve.

> Keela : « Tu peux supprimer le programme. Pas ce qu’ils en ont fait. »
> Selek : « Si je le laisse tourner, il recommence avant notre témoignage. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_01, nacre_stage_05, nacre_stage_07, nacre_stage_11, nacre_stage_12, nacre_stage_14, nacre_stage_15, nacre_stage_20.

**Adversaires personnels :** nacre_boss_07, nacre_boss_14. **Final commun :** nacre_boss_20.

**Choix :** Détruire le contrôleur immédiatement ou le maintenir isolé le temps d’extraire les preuves ; chaque voie possède une procédure de secours sûre.

**Ending :** Elle sépare les fonctions de sûreté des fonctions de dette, remet les journaux aux témoins et garde un exemplaire chiffré de son travail. Son futur présent à la Flotte sera un protocole d’audit et des pièces réellement réparées, jamais une arme miraculeuse ni une IA volée.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 8. Ghoran Brakk

**ID :** `nacre_ghoran_brakk` · **Espèce :** Krogan · **Rôle :** Lutteur lourd

### Identité et limites

Brakk appartient au clan original Ghoran, sans parenté revendiquée avec les figures canoniques. Après des années de contrats de force, il a organisé une équipe de manutention sur Tessère. Le Concordat retient les paies, puis déclare les ouvriers redevables de leur propre transport. Brakk a promis à son équipe qu’aucun collègue ne deviendrait une ligne d’actif. Sa colère se traduit par des décisions précises, pas par une incapacité à comprendre la fraude.

**Objectif :** Sortir les équipes de la mine et récupérer les paies détournées sans laisser le consortium les diviser.

**Équipement :** Plaques de protection de manutention renforcées ; Gants et avant-bras d’appui ; Balise de sécurité de chantier.

**Invariants :** Bosse dorsale et proportions krogan conservées ; Aucune biotique présumée ; Sa robustesse ne donne pas une invulnérabilité permanente.

### Direction visuelle

Krogan adulte massif avec bosse dorsale organique et silhouette basse lourde, grande plaque crânienne ocre sombre marquée d'une entaille ancienne non sanglante, museau large, peau gris brun rugueuse. Armure de dock à plaques épaisses orange industriel brûlé et graphite, protections avant-bras renforcées, sangles de manutention et petite balise de sécurité fermée sur l'épaule. Aucun canon géant. Bras lourds relevés en garde de lutte, pieds larges au sol, pose préparant une poussée d'épaule. Visage expressif décidé, aucune rage magique.

**Silhouette :** Bosse crânio-dorsale, torse immense, cou très court, pas de proportions humaines de bodybuilder.

**À exclure :** Pas d'armure Wrex/Grunt, pas de cornes fantasy, pas de biotique, pas de mecha.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Lutteur de proximité très robuste : il gagne en amenant la cible dans la portée de ses prises. Les attaques longues et les esquives de saisie exploitent sa lenteur.

**Ressource propre de conception :** Deux crans d’ancrage maximum, obtenus par garde réussie d’un coup lourd. Dépenser un cran protège d’un seul impact léger pendant un pas lourd ; les projections et les coups bas restent efficaces.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Poing court | 55 | 8 / 3 / 15 | mid | Arrêter un adversaire collé. |
| 5M | Coude de quai | 80 | 12 / 4 / 20 | mid | Confirmer à courte portée. |
| 5H | Marteau d’avant-bras | 110 | 18 / 4 / 28 | mid | Punir une garde mal placée. |
| 2L | Écrasement de botte | 50 | 9 / 3 / 16 | low | Menacer la garde basse. |
| 2M | Balayage lourd | 75 | 13 / 4 / 22 | low | Renverser au prix d’une récupération lente. |
| 2H | Crochet montant | 100 | 16 / 5 / 32 | mid | Défendre le ciel sans démarrage invincible. |
| jL | Poing de chute | 50 | 9 / 4 / 13 | overhead | Petit coup aérien rare. |
| jM | Genou massif | 75 | 12 / 5 / 17 | overhead | Approche très lisible. |
| jH | Double avant-bras | 105 | 17 / 5 / 22 | overhead | Lourde retombée, forte récupération. |
| 6H | Appui de chantier | 135 | 24 / 6 / 32 | mid | Avance une épaule en gardant le contact au sol. Un cran d’ancrage peut absorber un léger impact, jamais une projection. |
| 6L+M / 4L+M | Déchargement manuel | 145 | 8 / 2 / 34 | throw | Saisie au contact et jet court sur la même voie de combat ; aucune projection hors du stage. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Percée de quai — 236S** : Charge d’épaule physique au sol sur une distance fixe, sans propulsion biotique.

- Réglage proposé : 145 dégâts ; 23 / 4 / 34 frames ; coût 0 sur 300.
- Réponse adverse : Sauter, reculer hors de portée ou garder puis punir.

**Prise de levage — 63214S** : Saisie de commandement très courte ; un échec laisse une longue récupération.

- Réglage proposé : 170 dégâts ; 11 / 2 / 43 frames ; coût 0 sur 300.
- Réponse adverse : Saut, recul ou attaque avant la prise.

**Frein de charge — 214S** : Plante ses appuis et arrête volontairement une approche ; peut absorber un léger projectile contre un cran d’ancrage.

- Réglage proposé : 0 dégâts ; 8 / 4 / 26 frames ; coût 0 sur 300.
- Réponse adverse : Projection ou poursuite après la fenêtre.

**Frappe de plancher — 22S** : Coup d’avant-bras près des pieds, vague de choc physique limitée à la portée proche ; aucune secousse planétaire.

- Réglage proposé : 125 dégâts ; 30 / 4 / 38 frames ; coût 0 sur 300.
- Réponse adverse : Sauter le coup annoncé ou frapper pendant le démarrage.

**Dernier chargement — 236236S** : Saisie initiale au contact puis poussée et projection lourde contre un conteneur d’arrière-plan simulé ; la frontière du combat reste inchangée.

- Réglage proposé : 320 dégâts ; 10 / 3 / 51 frames ; coût 100 sur 300.
- Réponse adverse : Éviter la saisie initiale ; aucun super de projection automatique après garde.

### Neutralisation, tag et provocation

**Neutralisation décisive — Quai évacué :** Brakk déplace l’adversaire vaincu hors du couloir et bloque son arme sous un bloc de manutention ; il se tourne immédiatement vers l’évacuation des travailleurs. Fin de manche, pas d’atteinte à des civils ni d’effondrement du stage. Durée cible : 5 secondes.

**Assistance — Poussée d’équipe :** Brève charge physique télégraphiée qui repousse ; ne transporte pas la cible hors écran. Coût proposé : 25. Réponse : Sauter ou garder ; l’assistant reste vulnérable pendant son entrée.

**Provocation — Prêt à porter :** « Mes gens repartent. Discutez entre vous. » Resserre un gant et se remet en garde. Cosmétique ; aucun gain d’ancrage.

### Routes de combo proposées

- `5L > 5M > 236S` — Terminer un échange court par un recul forcé.
- `6H [touché] > 5M > 22S` — Maintenir la pression avec une frappe lente évitable ; aucune saisie garantie hors règles de combo.

### Campagne personnelle

**Intro :** Dans une galerie minière, Brakk fait l’appel. Le terminal prétend que cinq absents ont été transférés volontairement. Les autres montrent les contrats qu’ils n’ont jamais signés.

**Rival :** Varek Hesk. Varek refuse que Brakk écrase un poste de sûreté dont les caméras prouvent les saisies ; Brakk refuse de retarder le départ de l’équipe. Ils apprennent à protéger personnes et preuves ensemble.

> Brakk : « Leurs noms d’abord. Leurs murs après. »
> Varek : « Alors garde le mur debout jusqu’à ce qu’il témoigne. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_04, nacre_stage_05, nacre_stage_07, nacre_stage_10, nacre_stage_11, nacre_stage_12, nacre_stage_18, nacre_stage_20.

**Adversaires personnels :** nacre_boss_05, nacre_boss_11. **Final commun :** nacre_boss_20.

**Choix :** Récupérer les paies dans le coffre de fret ou utiliser ce transport pour les blessés ; le manque éventuel est reconnu dans l’épilogue.

**Ending :** Les ouvriers quittent la mine avec leurs effets et une copie des paies récupérées. Brakk reste le temps d’assurer la dernière rotation, puis accepte une place dans une coopérative de fret. Son clan n’est ni le nouveau dirigeant de Tuchanka ni l’instrument d’un changement du génophage.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 9. Neral Vesh

**ID :** `nacre_neral_vesh` · **Espèce :** Drell · **Rôle :** Infiltration

### Identité et limites

Neral a transporté des messages scellés pour des témoins qui ont ensuite disparu de la circulation. Il n’était pas payé pour connaître leur contenu ; il sait désormais que cette ignorance faisait partie du dispositif. Son expérience est celle d’un coursier clandestin et d’un opérateur discret, pas d’un nouvel assassin légendaire. Il a gardé des souvenirs suffisamment précis pour relier les trajets, mais doit trouver des preuves matérielles recevables.

**Objectif :** Rétablir le fil des témoignages, protéger ceux qui veulent parler et cesser de confondre discrétion et neutralité.

**Équipement :** Pistolet compact de masse ; Protection souple de coursier ; Camouflage tactique limité par équipement ; Poche médicale étanche de voyage.

**Invariants :** Silhouette et traits drell conservés ; Aucune biotique attribuée par défaut ; Camouflage technologique : ni téléportation ni invulnérabilité.

### Direction visuelle

Drell adulte masculin mince et nerveux, peau écaillée vert sombre désaturé avec zone sous la gorge cuivre mat, grands yeux noirs à reflet discret, reliefs faciaux et crâne lisse propres aux drell, aucun cheveu. Veste technique courte gris fumée intégrée à une protection légère, doublure olive, sous-combinaison noire, bottes fines plates et gants courts. Pistolet compact à la main droite près du flanc, main gauche en garde. Poche médicale étanche à la ceinture mais pas de respirateur permanent inventé. Pose ramassée vers la droite, furtive sans transparence ni doublon de silhouette.

**Silhouette :** Élancé, col court laissant voir gorge et tête, veste asymétrique arrêtée aux hanches.

**À exclure :** Pas de manteau ni visage de Thane, pas de katana, pas d'aura magique, pas d'exosuit.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Infiltrateur rapide et fragile : approche physique, feinte de visibilité et courte confirmation au pistolet. Il perd nettement lorsqu’une feinte est lue.

**Ressource propre de conception :** Le camouflage dure au plus 45 frames et se rompt sur attaque, impact ou projection. Les collisions, la trace au sol et les sons restent actifs ; aucune invisibilité permanente en duel.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Frappe de poignet | 45 | 5 / 3 / 12 | mid | Punition rapide de près. |
| 5M | Coude rentré | 70 | 9 / 4 / 17 | mid | Confirmer sans sortir l’arme. |
| 5H | Crosse précise | 100 | 15 / 4 / 25 | mid | Récompenser une ouverture nette. |
| 2L | Pointe basse | 40 | 6 / 3 / 13 | low | Tester la garde basse. |
| 2M | Crochet de jambe | 65 | 10 / 4 / 19 | low | Préparer un déplacement latéral. |
| 2H | Coude montant | 90 | 13 / 5 / 29 | mid | Défendre une approche aérienne. |
| jL | Main aérienne | 40 | 6 / 4 / 10 | overhead | Approche peu engagée. |
| jM | Genou de passage | 65 | 9 / 5 / 14 | overhead | Passage rapide, même plan de jeu. |
| jH | Coup de talon | 95 | 14 / 5 / 19 | overhead | Engagement lourd puni s’il manque. |
| 6M | Pas intérieur | 80 | 14 / 4 / 22 | mid | Court pas physique suivi d’un coude, traversée de garde impossible sans déplacement réel. |
| 6L+M / 4L+M | Retrait discret | 115 | 6 / 2 / 29 | throw | Déséquilibre la cible par le bras et la pivote, sans blessure cinématique imposée. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Percée à couvert — 236S** : Course basse physique puis coude ; aucune dématérialisation et aucune invulnérabilité aux coups bas.

- Réglage proposé : 115 dégâts ; 15 / 4 / 31 frames ; coût 0 sur 300.
- Réponse adverse : Contester au sol ou garder puis punir.

**Camouflage bref — 214S** : Réduit la visibilité du corps sans retirer la trace au sol ni le repère d’adversaire ; aucune attaque automatique.

- Réglage proposé : 0 dégâts ; 12 / 4 / 26 frames ; coût 0 sur 300.
- Réponse adverse : Lire la trace ou frapper une zone ; les dégâts interrompent le camouflage.

**Tir d’intervalle — 623S** : Décharge de pistolet à courte diagonale, utile contre une approche déjà lue.

- Réglage proposé : 100 dégâts ; 13 / 4 / 32 frames ; coût 0 sur 300.
- Réponse adverse : Rester au sol à distance ou bloquer le tir.

**Fausse sortie — 22S** : Feinte de départ suivie d’un pas de recul ; la reprise d’action n’est pas instantanée.

- Réglage proposé : 0 dégâts ; 8 / 4 / 23 frames ; coût 0 sur 300.
- Réponse adverse : Attendre le recul et avancer sans surréagir.

**Trajet sans témoin — 236236S** : La première frappe doit toucher ; Neral contourne physiquement la garde, désarme, puis enchaîne deux impacts de crosse.

- Réglage proposé : 285 dégâts ; 10 / 8 / 43 frames ; coût 100 sur 300.
- Réponse adverse : Garder le premier coude ; aucun saut cinématique gratuit derrière la cible.

### Neutralisation, tag et provocation

**Neutralisation décisive — Dernière livraison :** Pose le jeton de preuve sur l’arme désarmée, immobilise la cible puis rejoint le témoin sous protection. Le camouflage sert à sortir, pas à faire disparaître une personne. Fin de manche ; aucun meurtre d’un rival dans la campagne. Durée cible : 5 secondes.

**Assistance — Passage discret :** Courte traversée physique suivie d’un coup léger, toujours annoncée par un signal et une trace. Coût proposé : 25. Réponse : Garde possible des deux côtés selon position ; pas d’attaque invisible instantanée.

**Provocation — Jeton retourné :** « Je me souviens du destinataire. » Retourne un jeton de transit entre ses doigts. Cosmétique, ne déclenche pas le camouflage.

### Routes de combo proposées

- `5L > 5M > 236S` — Conversion rapide et courte.
- `214S > déplacement > 5M > 236236S` — Approche de camouflage à lire et contrer ; aucun enchaînement garanti depuis l’activation seule.

### Campagne personnelle

**Intro :** Un témoin lui remet une enveloppe vide avec le code d’une ancienne livraison. Neral se rappelle le trajet et retrouve, quai après quai, la chaîne qui l’a utilisée.

**Rival :** Dalo Ruun. Dalo exige des documents authentifiables avant d’ouvrir un corridor garanti ; Neral veut protéger l’identité de témoins vivants. Leur accord cherchera une preuve qui n’expose pas la source.

> Neral : « Un nom publié devient une cible. »
> Dalo : « Un dossier sans preuve devient une rumeur. Trouvons mieux. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_02, nacre_stage_04, nacre_stage_08, nacre_stage_09, nacre_stage_13, nacre_stage_15, nacre_stage_18, nacre_stage_20.

**Adversaires personnels :** nacre_boss_08, nacre_boss_13. **Final commun :** nacre_boss_20.

**Choix :** Rendre publique une partie du trajet ou garder le réseau d’exfiltration intact ; les preuves doivent rester suffisantes dans chaque voie.

**Ending :** Il remet des preuves corroborées et anonymisées aux personnes que les témoins ont choisies. Les itinéraires sûrs restent secrets. Son dernier trajet est payé par ceux qu’il escorte, avec un contrat qu’il lit en entier avant de le signer.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 10. Selek Dhan

**ID :** `nacre_selek_dhan` · **Espèce :** Galarien · **Rôle :** Pièges et sabotage

### Identité et limites

Selek est un contrôleur de qualité indépendant, engagé pour réduire les incidents des installations de Tessère. Ses rapports ont été réécrits pour rendre les retards imputables aux travailleurs. En recoupant les versions, il découvre que la même procédure fabrique dette, panne puis transfert forcé. Il parle vite lorsqu’il vérifie une hypothèse, mais sa voix ne copie pas celle de Mordin et sa compétence ne fait pas de lui un ancien membre secret du GSI.

**Objectif :** Empêcher la prochaine purge de dossiers et prouver la différence entre une erreur de maintenance et une fraude organisée.

**Équipement :** Omni-outil d’inspection ; Microcharges de sabotage limitées aux dispositifs techniques ; Capsules de cryorefroidissement industriel adaptées au duel.

**Invariants :** Anatomie galarienne, long cou et membres fins ; Pas de biotique ; Pas de pouvoir de piratage universel sur un organisme vivant.

### Direction visuelle

Galarien adulte grand et très mince, tête allongée avec cornes crâniennes d'allure galarienne, grands yeux sombres, peau gris olive mouchetée, cou long. Armure légère d'inspection technique vert sauge et graphite avec un seul panneau d'épaule jaune désaturé, petites capsules d'entretien fixées proprement à la ceinture, gants fins. Main gauche près d'un omni-outil inactif, main droite tenant un injecteur de réparation industriel fermé et non une seringue médicale à aiguille, posture en recul prête à se déplacer. Aucun explosif ni piège posé autour de lui.

**Silhouette :** Très grande tête étroite, long cou, membres fins, silhouette haute et légère.

**À exclure :** Pas de Mordin recoloré, pas de blouse de médecin, aucun ajout d'anatomie humaine ou yeux rouges artificiels.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Poseur de pièges fragile : temporiser, menacer une voie puis changer d’emplacement. Ses dispositifs ont une phase d’armement visible et peuvent être détruits.

**Ressource propre de conception :** Deux balises maximum, mais une seule peut être armée simultanément. Un signal clignotant et un bip indiquent l’activation ; pas de piège invisible ou de dégâts hors écran.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Test de contact | 45 | 5 / 3 / 12 | mid | Petit coup rapide. |
| 5M | Coude d’écart | 70 | 9 / 4 / 17 | mid | Confirmer une ouverture proche. |
| 5H | Frappe de boîtier | 100 | 15 / 4 / 25 | mid | Frapper avec un boîtier fermé. |
| 2L | Pointe de botte | 40 | 6 / 3 / 13 | low | Menacer la garde basse. |
| 2M | Balayage en retrait | 65 | 10 / 4 / 19 | low | S’écarter après une touche basse. |
| 2H | Bras d’alarme | 90 | 13 / 5 / 29 | mid | Antiaérien vulnérable au sol. |
| jL | Paume suspendue | 40 | 6 / 4 / 10 | overhead | Rester peu engagé en l’air. |
| jM | Genou de fuite | 65 | 9 / 5 / 14 | overhead | Passer au-dessus d’une attaque basse. |
| jH | Boîtier en descente | 95 | 14 / 5 / 19 | overhead | Attaque lourde lisible. |
| 4M | Diagnostic en retrait | 70 | 12 / 4 / 22 | mid | Petit coup de boîtier en recul physique, sans armure. |
| 6L+M / 4L+M | Mise hors ligne | 110 | 7 / 2 / 31 | throw | Saisie brève et bascule de l’adversaire par son équipement, sans téléchargement instantané de cerveau. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Microcharge de sabotage — 236S** : Pose une petite charge technique qui désorganise les boucliers au contact de sa zone, une fois armée.

- Réglage proposé : 110 dégâts ; 26 / 4 / 27 frames ; coût 0 sur 300.
- Réponse adverse : Détruire la charge avant le bip d’armement, sauter ou bloquer.

**Froid de maintenance — 214S** : Jet court de refroidissement qui ralentit brièvement une approche ; ne congèle pas un corps vivant de façon permanente.

- Réglage proposé : 75 dégâts ; 20 / 4 / 31 frames ; coût 0 sur 300.
- Réponse adverse : Rester hors de portée ou sauter avant l’émission.

**Détonation contrôlée — 22S** : Déclenche la balise armée après un avertissement distinct ; aucun effet sans balise.

- Réglage proposé : 100 dégâts ; 16 / 4 / 30 frames ; coût 0 sur 300.
- Réponse adverse : S’éloigner du repère ou interrompre l’ordre de déclenchement.

**Purge locale — 623S** : Neutralise sa propre balise pour traverser un intervalle sûr ; elle ne blesse pas en disparaissant.

- Réglage proposé : 0 dégâts ; 10 / 4 / 21 frames ; coût 0 sur 300.
- Réponse adverse : Poursuivre Selek pendant qu’il perd son contrôle de zone.

**Chaîne de causalité — 236236S** : Après impact de la première impulsion, trois microcharges préannoncées isolent et frappent successivement l’équipement adverse.

- Réglage proposé : 280 dégâts ; 18 / 15 / 45 frames ; coût 100 sur 300.
- Réponse adverse : Garder ou sortir de la première zone avant le verrouillage.

### Neutralisation, tag et provocation

**Neutralisation décisive — Rapport irréfutable :** Désactive l’armement de la cible déjà vaincue, scelle un journal de diagnostic et affiche son accusé d’intégrité sur un terminal de l’équipe. Fin de manche ; le document est un élément narratif, jamais une interface couvrant le duel. Durée cible : 5 secondes.

**Assistance — Balise de retard :** Une charge télégraphiée couvre une petite zone puis expire. Coût proposé : 25. Réponse : Destructible, évitable, une seule occurrence par appel.

**Provocation — Dernière vérification :** « Erreur reproductible. Responsabilité aussi. » Referme un boîtier après un diagnostic silencieux. Cosmétique, aucune réinitialisation de piège.

### Routes de combo proposées

- `2L > 5M > 214S` — Obtenir le temps de reposer une balise.
- `236S [déclenchement confirmé] > 5H > 236236S` — Conversion de placement ; jamais à partir d’une balise non armée.

### Campagne personnelle

**Intro :** Selek confronte deux rapports portant sa signature et des conclusions incompatibles. Le terminal confirme qu’une nouvelle purge commencera à la prochaine relève.

**Rival :** Keela’Vess nar Tasera. Il privilégie l’arrêt immédiat du système ; Keela insiste sur la conservation des journaux. Tous deux doivent concevoir un isolement qui permette les deux.

> Selek : « Le système fonctionne exactement comme ils l’ont voulu. Il faut le couper. »
> Keela : « Alors gardons la preuve de ce qu’ils ont voulu. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_03, nacre_stage_05, nacre_stage_07, nacre_stage_11, nacre_stage_13, nacre_stage_14, nacre_stage_17, nacre_stage_20.

**Adversaires personnels :** nacre_boss_03, nacre_boss_14. **Final commun :** nacre_boss_20.

**Choix :** Sauvegarder une archive volumineuse ou immobiliser immédiatement la ligne de purge ; une sauvegarde partielle reste possible mais change les personnes inculpables.

**Ending :** Les données de maintenance, les heures de transfert et les contrats sont réunis sans altérer leurs originaux. Il transmet une méthode de contrôle aux techniciens de Nacre et refuse un contrat qui exige le silence sur les causes de panne.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 11. Varek Hesk

**ID :** `nacre_varek_hesk` · **Espèce :** Batarien · **Rôle :** Briseur de proximité

### Identité et limites

Ancien agent de sécurité portuaire, Varek a longtemps considéré les conflits de dette comme extérieurs à son poste. Le jour où le Concordat lui a demandé de retenir une équipe sous un motif qu’il savait faux, il a refusé et perdu son travail. Il a ensuite organisé l’entraide entre employés d’origines différentes. Son histoire traite de ses propres choix ; elle ne prétend ni excuser ni condamner une espèce entière.

**Objectif :** Obtenir la libération des travailleurs retenus et établir la chaîne des ordres au lieu de laisser les exécutants porter seuls la faute.

**Équipement :** Armure de sûreté portuaire ; Protections d’avant-bras compactes ; Pistolet rangé pendant les enchaînements de contact.

**Invariants :** Quatre yeux lisibles ; Aucun pouvoir biotique ; Désignation politique individuelle, aucun alignement moral automatique lié à l’espèce.

### Direction visuelle

Batarien adulte masculin large d'épaules, quatre yeux clairement distincts en deux paires, reliefs faciaux épais, peau brun rouille et crâne court sans cheveux stylisés humains. Armure de sécurité portuaire robuste vert sombre et cuir technique brun, panneau de poitrine asymétrique gris vieilli, avant-bras droit protégé par une plaque rectangulaire compacte, brassard de travailleurs sans texte ni logo. Arme rangée ; poings en garde de boxe et coude prêt au contre, posture centrée et pragmatique.

**Silhouette :** Compact et trapu, tête aux quatre yeux lisible, protections de poings sans lames.

**À exclure :** Pas de Balak, pas de collier d'esclave ni accessoire faisant de toute son espèce un stéréotype, pas de pouvoir biotique.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Briseur de proximité fondé sur les contres : il oblige l’adversaire à varier ses attaques. Sa garde anticipée et ses coups lourds sont vulnérables aux feintes et aux projections.

**Ressource propre de conception :** Une lecture réussie peut renforcer un prochain coup d’arrêt. Ce bénéfice expire au bout de 120 frames, est perdu à l’impact subi et ne se cumule pas.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Jab de quai | 55 | 8 / 3 / 15 | mid | Interruption rapprochée. |
| 5M | Coude court | 80 | 12 / 4 / 20 | mid | Confirmer un jab. |
| 5H | Direct lourd | 110 | 18 / 4 / 28 | mid | Punir une récupération. |
| 2L | Pointe basse | 50 | 9 / 3 / 16 | low | Tester le bas de garde. |
| 2M | Balayage serré | 75 | 13 / 4 / 22 | low | Faire trébucher à courte portée. |
| 2H | Crochet de garde | 100 | 16 / 5 / 32 | mid | Défendre contre un saut. |
| jL | Poing plongeant | 50 | 9 / 4 / 13 | overhead | Saut d’approche court. |
| jM | Genou de passage | 75 | 12 / 5 / 17 | overhead | Toucher au corps. |
| jH | Marteau aérien | 105 | 17 / 5 / 22 | overhead | Gros engagement lisible. |
| 6H | Frappe au montant | 120 | 23 / 4 / 30 | overhead | Direct oblique au-dessus d’une garde basse ; pas de casse-garde automatique. |
| 6L+M / 4L+M | Sortie du poste | 135 | 7 / 2 / 31 | throw | Saisie de sécurité et projection hors de la ligne de tir, sans étouffement cinématique prolongé. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Coup d’arrêt — 236S** : Court pas suivi d’un puissant direct de protection d’avant-bras.

- Réglage proposé : 140 dégâts ; 19 / 4 / 31 frames ; coût 0 sur 300.
- Réponse adverse : Recul ou garde ; punissable à portée courte.

**Lecture de contact — 214S** : Garde anticipée qui contre un coup de contact moyen ou haut ; les coups bas, tirs et projections la battent.

- Réglage proposé : 115 dégâts ; 5 / 4 / 39 frames ; coût 0 sur 300.
- Réponse adverse : Feinte, bas, projectile ou projection.

**Rupture d’appui — 22S** : Balayage lourd à courte portée, utile contre une attente debout.

- Réglage proposé : 115 dégâts ; 24 / 4 / 35 frames ; coût 0 sur 300.
- Réponse adverse : Garde basse ou saut annoncé.

**Interposition — 623S** : Coup d’avant-bras montant qui intercepte un saut mais n’est pas invincible au sol.

- Réglage proposé : 110 dégâts ; 13 / 4 / 34 frames ; coût 0 sur 300.
- Réponse adverse : Rester au sol et punir la récupération.

**Fin du contrôle — 236236S** : Premier direct confirmé, enchaînement de deux coudes puis mise au sol. La protection technique de la cible se désactive sous les impacts, sans magie.

- Réglage proposé : 305 dégâts ; 13 / 11 / 46 frames ; coût 100 sur 300.
- Réponse adverse : Bloquer le premier coup ; la séquence ne se déclenche pas sur garde.

### Neutralisation, tag et provocation

**Neutralisation décisive — Ordre refusé :** Arrache le brassard de commandement de l’adversaire vaincu, le remet avec son arme au sol et ouvre le passage aux retenus. Fin de manche ; un rival reste vivant, la scène vise le pouvoir du poste. Durée cible : 5 secondes.

**Assistance — Épaule au poste :** Un coup physique court stoppe une poursuite proche. Coût proposé : 25. Réponse : Courte portée et garde possible ; aucun contre automatique de tout type.

**Provocation — Brassard retiré :** « Je ne retiens plus personne pour vous. » Montre sa main ouverte puis reprend sa garde. Cosmétique.

### Routes de combo proposées

- `5L > 5M > 236S` — Punition de proximité.
- `214S [contre réussi] > 5H > 236236S` — Récompenser une lecture ; aucun déclenchement après contre manqué.

### Campagne personnelle

**Intro :** Varek retrouve son nom sur le registre d’un ordre qu’il a refusé. Il revient au poste avec ses anciens collègues pour réclamer les images originales de la relève.

**Rival :** Ghoran Brakk. Il veut préserver une salle de contrôle qui contient les preuves ; Brakk veut dégager ses collègues avant une fermeture des sas. Ils doivent choisir un ordre d’action commun.

> Varek : « S’ils peuvent effacer les ordres, ils recommenceront ailleurs. »
> Brakk : « S’ils gardent mes gens, il n’y aura personne pour témoigner. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_01, nacre_stage_04, nacre_stage_05, nacre_stage_08, nacre_stage_10, nacre_stage_12, nacre_stage_18, nacre_stage_20.

**Adversaires personnels :** nacre_boss_04, nacre_boss_18. **Final commun :** nacre_boss_20.

**Choix :** Garder les caméras intactes ou couper le réseau qui retient des personnes ; les équipes de Keela et Selek peuvent réduire, sans annuler, ce coût.

**Ending :** Il confronte les registres aux témoignages de l’équipe et laisse chaque ancien agent répondre de ses choix. Une garde commune protège le départ des civils, sans se transformer en nouvelle milice du Concordat. Varek y tient un poste soumis au même contrôle que les autres.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 12. Dalo Ruun

**ID :** `nacre_dalo_ruun` · **Espèce :** Volus · **Rôle :** Renfort de protection

### Identité et limites

Dalo inspecte les garanties des transporteurs. Il a découvert que le Concordat revendait le même droit d’évacuation à plusieurs créanciers, puis accusait les passagers de défaut de paiement. Son métier lui donne accès aux écritures, mais pas l’autorité d’annuler toutes les dettes de la galaxie. Sa combinaison pressurisée de sécurité et ses outils de protection lui permettent d’accompagner les inspecteurs dans les secteurs dangereux.

**Objectif :** Rendre les garanties aux passagers, établir les faux et empêcher les créanciers de recouvrer deux fois une même obligation.

**Équipement :** Combinaison pressurisée volus intégralement scellée ; Renfort de bouclier technique à réserve finie ; Balise de sûreté de fret ; Omni-outil d’audit.

**Invariants :** Corps volus court et corpulent conservé ; Combinaison vitale toujours fermée ; Aucun méca géant ni biotique ; Le système de protection est un équipement limité, pas une invincibilité financière.

### Direction visuelle

Volus adulte très court et corpulent, proportions emblématiques rotundes, combinaison pressurisée entièrement scellée avec grand respirateur frontal et deux lentilles oculaires lumineuses ambre. Tenue de sécurité de fret bronze patiné, bleu nuit et gris mat, petites protections arrondies intégrées, réservoir dorsal compact respectant le volume volus, mains courtes et bottes basses. Aucune jambe mécanique allongée. Une main prête sur le contrôleur de renfort de bouclier à la poitrine, autre main ouverte en garde. Posture basse ferme, héros de soutien compétent, sans arme lourde ni bulle de bouclier autour du corps.

**Silhouette :** Volus authentiquement petit et rond, tête intégrée au col respiratoire, aucune silhouette de soldat humain/mecha.

**À exclure :** Pas de mecha géant, pas de torse bodybuilder, pas de tête découverte, pas de gag 'dieu biotique', pas de biotique.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Soutien défensif lent : fort bouclier, faible santé, portée de contact courte. Il gagne du temps au bon moment et perd vite lorsqu’un adversaire lit sa restauration.

**Ressource propre de conception :** Réserve de bouclier finie pour la manche : deux charges proposées. Chaque charge restaure au plus 120 points sans dépasser le maximum, ne soigne pas la vie et exige 38 frames vulnérables. Pas de recharge pendant la même manche ; compteur visible.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Contact de gant | 40 | 6 / 3 / 12 | mid | Se dégager à très courte portée. |
| 5M | Poussée de bras | 65 | 10 / 4 / 17 | mid | Éloigner légèrement une cible collée. |
| 5H | Butoir de protection | 95 | 16 / 4 / 25 | mid | Frapper avec la protection, pas avec une force surhumaine. |
| 2L | Coup de botte court | 35 | 7 / 3 / 13 | low | Tester le bas de garde. |
| 2M | Poussée basse | 60 | 11 / 4 / 19 | low | Créer un intervalle de sécurité. |
| 2H | Coude de dégagement | 85 | 14 / 5 / 29 | mid | Intercepter une cible proche en l’air. |
| jL | Gant en descente | 35 | 7 / 4 / 10 | overhead | Petit saut défensif adapté à son gabarit. |
| jM | Genou compact | 60 | 10 / 5 / 14 | overhead | Approche aérienne très limitée. |
| jH | Butoir descendant | 90 | 15 / 5 / 19 | overhead | Retombée compacte, jamais charge de mecha. |
| 6H | Appui pressurisé | 90 | 21 / 5 / 29 | mid | Courte avancée du corps protégé, faible portée, aucun changement de taille. |
| 6L+M / 4L+M | Dégagement de sûreté | 105 | 8 / 2 / 33 | throw | Prise d’équipement et poussée assistée par un petit amortisseur mécanique ; ne soulève pas un krogan à bras nus. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Réserve de bouclier — 22S** : Canalise son renfort technique et restaure au maximum 120 points de bouclier sur sa réserve, sans vie ni dépassement.

- Réglage proposé : 0 dégâts ; 1 / 4 / 38 frames ; coût 0 sur 300.
- Réponse adverse : Attaquer pendant la canalisation, projeter ou épuiser ses deux charges.

**Balise de sûreté — 236S** : Pose une balise visible qui produit une impulsion de recul très courte après un délai.

- Réglage proposé : 75 dégâts ; 29 / 4 / 28 frames ; coût 0 sur 300.
- Réponse adverse : Détruire la balise, rester hors de sa zone ou garder.

**Écran rapproché — 214S** : Posture qui réduit un seul impact frontal ; ne bloque pas les projections ni les attaques venant de derrière.

- Réglage proposé : 0 dégâts ; 9 / 4 / 31 frames ; coût 0 sur 300.
- Réponse adverse : Feinte puis projection ou changement de côté.

**Impulsion de dégagement — 623S** : Décharge technique de contact qui éloigne faiblement une cible collée ; pas de pouvoir biotique.

- Réglage proposé : 85 dégâts ; 15 / 4 / 34 frames ; coût 0 sur 300.
- Réponse adverse : Garder puis punir, ou rester hors de sa très courte portée.

**Garantie de sortie — 236236S** : Une impulsion initiale confirmée désarme l’équipement, puis une balise de fret repousse la cible. En tag, aucun soin gratuit n’est ajouté à cette attaque.

- Réglage proposé : 250 dégâts ; 18 / 12 / 45 frames ; coût 100 sur 300.
- Réponse adverse : Garder le premier contact ; si la cible reste hors de portée, tout le coût est perdu.

### Neutralisation, tag et provocation

**Neutralisation décisive — Garantie restituée :** Place la cible vaincue derrière un écran de sûreté, récupère la clé de transit de son équipement puis la remet aux passagers enregistrés. Fin de manche ; combinaison fermée, aucune transformation en géant. Durée cible : 5 secondes.

**Assistance — Marge de sécurité :** Restaure au plus 60 boucliers au partenaire après un délai visible ; pas de vie et pas de dépassement du maximum. Coût proposé : 25. Réponse : Un coup sur l’appel interrompt le renfort ; la réserve d’assistances et le délai global bornent le gain.

**Provocation — Audit terminé :** « Vous facturez deux fois la même sortie. » Referme une projection d’audit sans texte lisible dans la pose sprite. Cosmétique, aucun bouclier restauré.

### Routes de combo proposées

- `5L > 5M > 623S` — Se dégager pour préparer le bouclier.
- `236S [impulsion confirmée] > 5H > 236236S` — Petite conversion de placement ; pas de boucle de soin.

### Campagne personnelle

**Intro :** Deux contrats de sortie portent le même numéro de garantie et deux listes de passagers incompatibles. Dalo suspend son mandat et vient vérifier les personnes derrière les dossiers.

**Rival :** Neral Vesh. Il a besoin de preuves authentifiables, Neral a besoin de témoins anonymes. Leur confrontation aboutit à une chaîne de preuve qui respecte les deux.

> Dalo : « Je peux bloquer le paiement. Pas sur une simple parole. »
> Neral : « Alors vérifiez la preuve sans livrer celui qui l’a portée. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_01, nacre_stage_03, nacre_stage_08, nacre_stage_09, nacre_stage_10, nacre_stage_13, nacre_stage_16, nacre_stage_20.

**Adversaires personnels :** nacre_boss_09, nacre_boss_20. **Final commun :** nacre_boss_20.

**Choix :** Geler les comptes pour préserver l’argent ou laisser passer un paiement contrôlé pour identifier l’organisateur ; le montant récupéré varie.

**Ending :** Il fait geler les garanties frauduleuses de cette opération avec les preuves obtenues ; il ne réécrit pas le droit galactique. Les fonds réellement disponibles financent les traversées promises. Une ligne demeure à son nom : les frais qu’il accepte de ne pas faire supporter aux évacués.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.


## 13. Nyra Korr

**ID :** `nacre_nyra_korr` · **Espèce :** Turienne · **Rôle :** Éclaireuse de précision

### Identité et limites

Nyra cartographie les accès de secours et pilote parfois les navettes de reconnaissance de Tessère. Une série de balises déplacées a conduit ses collègues dans une zone de contrôle du Concordat. Elle revient établir un itinéraire que personne ne puisse fermer à distance. Sa précision est acquise sur le terrain ; elle n’est pas liée à une organisation secrète ou à une aptitude biotique rare inventée pour la distinguer.

**Objectif :** Retrouver l’équipe disparue et laisser à Nacre des cartes d’évacuation dont les habitants possèdent eux-mêmes les clés.

**Équipement :** Carabine de précision de masse ; Omni-outil de cartographie ; Protection légère d’éclaireuse ; Balise de repérage sans tir orbital.

**Invariants :** Silhouette turienne féminine, tête et mandibles turiennes ; Pas de propulseurs empruntés à Andromeda ; Aucun pouvoir biotique ; Pas de tir depuis l’orbite par une simple balise.

### Direction visuelle

Turienne adulte féminine athlétique et élancée, visage turien à mandibles distinctes, plaques faciales gris clair et petite marque diagonale cuivre originale, crête arrière courte compatible avec silhouettes turiennes féminines de Mass Effect, jamais visage humain. Armure légère d'éclaireuse anthracite et rouge argile avec plaques de cuisses compactes, ligne dorsale souple, petit paquetage cartographique. Carabine de précision de masse fermée et compacte tenue près du corps, canon vers le bas à droite ; pas de propulseurs. Pose mobile un pied décalé en arrière, tête tournée vers la droite.

**Silhouette :** Turienne légère aux jambes caractéristiques, crête courte, équipement sans bords de cape.

**À exclure :** Pas de copie Nyreen/Vetra, pas de corps humain coiffé d'un masque, pas de jetpack ni énergie biotique.

**Tenue alternative — Service de relève :** Remplacer les grandes plaques de couleur par des panneaux de service gris pierre avec marquages de repérage propres au personnage. Aucun insigne canon réservé. Cette tenue reste à produire ; les équipements vitaux et les articulations ne changent pas.

### Plan de jeu

Éclaireuse de précision : marche rapide, tir annoncé et recul. Elle doit confirmer ses tirs à bonne distance ; le corps à corps prolongé reste dangereux.

**Ressource propre de conception :** Une seule marque de repérage visible peut exister pendant 120 frames. Elle réduit la dispersion de l’animation du tir mais ne crée ni poursuite automatique ni coup imblocable. Le tir consomme la marque.

### Coups de base et déplacements offensifs

| Entrée | Coup | Dégâts proposés | Début / actif / récupération | Garde | Fonction |
|---|---|---:|---|---|---|
| 5L | Poignet rapide | 45 | 6 / 3 / 12 | mid | Interrompre un assaut très proche. |
| 5M | Coude d’angle | 70 | 10 / 4 / 17 | mid | Confirmer avant de reculer. |
| 5H | Crosse de précision | 100 | 16 / 4 / 25 | mid | Punir une attaque trop courte. |
| 2L | Pointe de botte | 40 | 7 / 3 / 13 | low | Tester la garde basse. |
| 2M | Balayage latéral | 65 | 11 / 4 / 19 | low | Gagner de l’espace latéral. |
| 2H | Crosse montante | 90 | 14 / 5 / 29 | mid | Défendre contre un saut lu. |
| jL | Paume aérienne | 40 | 7 / 4 / 10 | overhead | Approche aérienne légère. |
| jM | Genou d’angle | 65 | 10 / 5 / 14 | overhead | Attaque sautée médiane. |
| jH | Crosse plongeante | 95 | 15 / 5 / 19 | overhead | Frappe lourde en retombée. |
| 6M | Traverse de quai | 85 | 15 / 4 / 23 | mid | Pas rapide et coup de crosse ; aucune traversée de corps gratuite. |
| 6L+M / 4L+M | Changement de route | 115 | 7 / 2 / 30 | throw | Pivote autour du bras saisi et remet l’adversaire dans la direction choisie. |

Les récupérations des coups aériens sont des intentions à la retombée ; l’état réel doit être défini avec le moteur avant validation. Les valeurs de stun, de portée, de collision et de recul restent à mesurer.

### Spéciaux et super

**Tir repéré — 236S** : Tir de précision horizontal annoncé par une brève lueur de visée ; aucun suivi vertical automatique.

- Réglage proposé : 135 dégâts ; 25 / 4 / 34 frames ; coût 0 sur 300.
- Réponse adverse : Sauter pendant la visée ou s’approcher après garde.

**Balise de lecture — 214S** : Marque une zone de sol fixe, visible de tous ; le repérage améliore l’information du joueur, pas les collisions.

- Réglage proposé : 0 dégâts ; 22 / 4 / 23 frames ; coût 0 sur 300.
- Réponse adverse : Changer de zone ou forcer Nyra à quitter sa ligne.

**Roulade d’écart — 22S** : Roulade physique avec trajectoire fixe ; reste vulnérable aux projections et aux coups bas, sans téléportation.

- Réglage proposé : 0 dégâts ; 9 / 4 / 27 frames ; coût 0 sur 300.
- Réponse adverse : Poursuivre à la sortie ou placer un coup bas.

**Crosse de relèvement — 623S** : Coup de crosse anti-aérien ; aucune invulnérabilité au réveil.

- Réglage proposé : 105 dégâts ; 12 / 4 / 33 frames ; coût 0 sur 300.
- Réponse adverse : Appâter au sol puis punir.

**Route libre — 236236S** : Tir d’arrêt confirmé puis déplacement physique sur une courte trajectoire et second tir sur le module d’arme ; aucun soutien orbital.

- Réglage proposé : 290 dégâts ; 18 / 12 / 45 frames ; coût 100 sur 300.
- Réponse adverse : Bloquer ou éviter le premier tir ; punition si elle manque.

### Neutralisation, tag et provocation

**Neutralisation décisive — Balise rendue :** Désactive la balise de verrouillage de la cible vaincue et la remplace par un signal d’évacuation appartenant à l’équipe locale. Fin de manche ; le signal ne contrôle ni relais ni planète. Durée cible : 5 secondes.

**Assistance — Lecture de couloir :** Un tir lent annonce et ferme une voie horizontale pendant l’entrée du partenaire. Coût proposé : 25. Réponse : Saut, garde ou interruption de l’entrée.

**Provocation — Cap vérifié :** « J’ai trouvé une autre route. » Vérifie un petit module puis reprend sa ligne de tir. Cosmétique, aucune marque gratuite.

### Routes de combo proposées

- `5L > 5M > 623S` — Défense rapprochée et séparation.
- `5H > 236S [marque active] > 236236S` — Conversion de précision uniquement si la portée le permet ; aucun verrouillage automatique.

### Campagne personnelle

**Intro :** Les coordonnées de secours ont changé entre sa vérification et le départ du convoi. Nyra conserve les deux cartes et remonte la piste des balises remplacées.

**Rival :** Ilyra Senn. Nyra privilégie la vitesse de l’exfiltration ; Ilyra lui rappelle qu’une escorte ne peut décider à la place des passagers. Elles confrontent urgence et consentement.

> Nyra : « Si nous attendons l’accord de tout le monde, ils fermeront le ciel. »
> Ilyra : « Ils n’ont pas tous choisi la même destination. Nous pouvons leur offrir les deux. »

**Issue du duel rival :** Duel non létal ; coopération après désaccord de méthode.

**Étapes d’arène proposées :** nacre_stage_02, nacre_stage_06, nacre_stage_10, nacre_stage_12, nacre_stage_15, nacre_stage_16, nacre_stage_19, nacre_stage_20.

**Adversaires personnels :** nacre_boss_06, nacre_boss_19. **Final commun :** nacre_boss_20.

**Choix :** Publier un itinéraire qui pourra être contesté ou protéger une route secrète pour les derniers témoins ; l’épilogue précise qui bénéficie de chaque choix.

**Ending :** Les itinéraires de secours sont copiés sur des appareils détenus par les équipes de quai, avec des procédures manuelles si le réseau tombe. Nyra accompagne le dernier transport et laisse une voie sûre derrière elle, sans devenir la nouvelle autorité sur les routes de Nacre.

**Illustrations à produire séparément :** intro, rival et ending. Une image de personnage ne remplace aucune de ces trois scènes. Les routes, dialogues et états de sauvetage restent des données de conception tant que le mode histoire ne les exécute pas.

## 14. Liste de production et qualification

Pour les dix combattants, les exigences structurées comprennent 10 bases entières, 10 portraits de sélection, 10 costumes alternatifs, 30 illustrations de campagne, 10 images clés de neutralisation et 10 ensembles de voix/sous-titres. Ces 80 lignes sont des besoins, pas 80 fichiers livrés. Les sprites de base produits pendant le lot 22 doivent être réconciliés avec le manifeste de livraison sans promouvoir les autres lignes.

Le présent JSON garde `engineIntegrated: false` parce que le jeu complet décrit ici n’est pas encore raccordé. Un profil adapté dans le prototype peut être jouable avec une seule attaque spéciale ; cela ne valide pas les quatre spéciaux, la ressource unique, les projections, le tag ou les cinématiques.

### Contrôles visuels requis

- Un personnage par image, entier et sans collage ; vrai canal alpha pour les sprites.
- Anatomie d’espèce, combinaison vitale, quatre yeux du batarien, petites proportions du volus et mandibules turiennes vérifiables.
- Matériaux, fixations et armes cohérents avec Mass Effect 1–2 ; pas de mélange d’équipement d’Andromeda.
- Aucune copie directe de la silhouette personnelle de Shepard, Garrus, Tali, Liara, Wrex, Thane, Mordin, Nyreen ou Vetra.
- Garde, taille de collision, pieds au sol et portée adaptés à la silhouette ; le petit corps du volus ne donne pas d’invulnérabilité passive.
- Chaque projectile, drone, piège ou accessoire mobile doit posséder son image indépendante avant d’être déclaré produit.

### Contrôles de jeu requis

- Vérifier réellement les boucles de bouclier de Dalo, le nombre de balises de Selek et de Keela, les contraintes de camouflage et la protection de stase.
- Faire échouer proprement chaque super sur garde ou à vide ; aucune cinématique ne doit confirmer une attaque ratée.
- Tester un duel miroir et chaque silhouette petite/grande ; contrôler les changements de côté et les projections en coin.
- Séparer compétences de conception et sous-ensemble exécuté ; conserver les commandes simplifiées du prototype clairement annoncées.

## 15. Sources de cohérence et portée

Les biographies, noms, lieux, contrats, campagnes, paramètres et attaques personnalisées sont des créations de cette extension. Les références ci-dessous servent uniquement aux contraintes de l’univers et à l’adaptation des familles de mécaniques.

- **[Mass Effect — manuel officiel Xbox 360 français](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_fr.pdf)** — Electronic Arts ; official_primary. Existence des familles de talents biotiques et techniques ; Projection, Lévitation, Barrière, Stase et Sabotage. Les commandes, frames, dégâts et variantes de Nacre sont une adaptation originale, pas des chiffres tirés du manuel.
- **[Mass Effect Legendary Edition — Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations)** — EA/BioWare ; official_primary. Les trois épisodes possèdent des systèmes de combat distincts ; couvert, contrôle des équipiers et munitions ont fait l’objet de réglages différents. Le combat 2D ne peut donc pas être présenté comme une reproduction mécanique littérale de tous les épisodes simultanément.
- **[Female Character Profiles: Tali](https://www.ea.com/amp/news/female-character-profiles-tali)** — Electronic Arts ; official_primary. Précédents officiels des quariens ingénieurs : drones, piratage, omni-outils. Aucun détail de Keela ne prétend être une biographie de Tali. La compétence individuelle et la tenue de Keela restent des créations.
- **[A Tour of the New N7 HQ](https://blog.bioware.com/2012/10/11/a-tour-of-the-new-n7-hq/)** — BioWare ; official_primary. BioWare annonce les volus dans le contenu multijoueur Retaliation de Mass Effect 3. Ce précédent de jouabilité ne prouve pas l’équipement exact de Dalo en 2185 ; son kit demeure une proposition originale limitée.
- **[Codex — Aliens: Non-Council Races, transcription communautaire](https://masseffect.fandom.com/wiki/Codex/Aliens%3A_Non-Council_Races)** — Mass Effect Wiki ; secondary_codex_transcription. Repères morphologiques/culturels des espèces non membres du Conseil, notamment volus et quariens. Source de contrôle à recouper avec modèles et codex des jeux pour la revue visuelle 1:1 ; pas preuve que les originaux sont canoniques.
- **[Codex — Technology, transcription communautaire](https://masseffect.fandom.com/wiki/Codex/Technology)** — Mass Effect Wiki ; secondary_codex_transcription. La biotique relève de champs d’effet de masse, d’aptitudes et d’entraînement, distincts des outils techniques. Seule Ilyra possède une biotique dans ce roster ; les autres actions sont physiques ou techniques.

Aucune source n’atteste l’existence officielle de Nacre, Tessère, du Concordat des Quais ou de ces dix personnages. La certification de fidélité des sprites nécessite une revue des images réellement produites et des références visuelles retenues.

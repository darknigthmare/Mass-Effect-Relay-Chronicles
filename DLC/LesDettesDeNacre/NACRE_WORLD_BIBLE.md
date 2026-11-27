# Les Dettes de Nacre — Monde et opposition

**Extension originale de fan • version de conception 1.0 • 27 novembre 2026**

Extension originale de fan conçue pour Relay Chronicles. Nacre, Tessère, le Concordat des Quais, les personnes, les machines, les lieux et les événements de cette fiche ne sont pas du contenu officiel Mass Effect. La cohérence avec le lore est un objectif de conception, pas une certification 1:1 de références qui n'existent pas.

## Portée de cette livraison

20 stages, 20 ennemis, 20 boss, 20 props et 20 familles de projectiles/VFX sont définis. Les 10 combattants relèvent de la fiche roster associée. Les 100 couches de parallaxe, les pièces mobiles et les phases d'effets sont des demandes de production : **aucune image ni animation n'est comptée comme générée dans ce fichier**.

## Intrigue et limites

2185, dans une fenêtre narrative indépendante avant la fin de Mass Effect 2.

Le Concordat des Quais modifie les registres de transit pour convertir des retards fabriqués en dettes. Des saisies de matériel et de combinaisons rendent les départs impossibles. Dix protagonistes aux méthodes différentes rassemblent des preuves, ouvrent les quais et protègent une évacuation locale.

Le Concordat est une coalition originale d'administrateurs, de prestataires et de sûreté privée. Son pouvoir vient des contrats, des stocks et des portes, pas d'une origine secrète cosmique.

### Actes

| Acte | Étendue | Fonction |
|---|---|---|
| 1 — Prendre pied | nacre_stage_01 à nacre_stage_05 | Les registres d'arrivée ne concordent pas ; les premiers scellés révèlent une saisie organisée. |
| 2 — Remonter les comptes | nacre_stage_06 à nacre_stage_10 | Des témoins et quittances prouvent que les garanties sont déjà payées ; l'autorité des quais devient contestable. |
| 3 — Faire parler la matière | nacre_stage_11 à nacre_stage_15 | Les pesées, épaves et données du cargo établissent le détournement physique des transports. |
| 4 — Rompre le contrat | nacre_stage_16 à nacre_stage_20 | Équipements rendus, budget thermique rétabli, preuves diffusées : le dernier quai peut s'ouvrir. |

### Invariants de lore

- Aucun choix de Shepard n'est fixé ni réécrit.
- Pas de compagnon canon indispensable, d'issue ME3 imposée, de solution au génophage ou de paix geth-quarienne anticipée.
- Pas d'élément d'Andromeda, de Reliquat, de kett ou de technologie arrivée plusieurs siècles plus tard.
- Aucun relais nouveau, voyage instantané ou réseau de communication universel.
- Aucune espèce inventée pour remplacer les espèces de Mass Effect.
- Les oppositions dépendent de contrats et de choix individuels, pas d'une culpabilité raciale.
- Toutes les techniques de combat sont des adaptations 2D identifiées, pas des règles prétendument identiques à ME2.

Les cadres d'univers proviennent des sources listées à la fin. Les noms, lieux, événements et patterns ci-dessous sont des décisions créatives du projet. Aucun texte de codex n'est reproduit comme dialogue.

## Direction artistique et fabrication

Sprites 2D HD détaillés, plans latéraux de combat, matériaux lisibles ; aucun remplacement automatique par pixel art ou silhouettes vectorielles.

Coques courbes et panneaux utilitaires, couches d'armure et tissus techniques, omni-outils ambrés, champs biotiques bleu-violet, architecture de transit propre mais usée. Les choix précis de Nacre sont originaux.

Respecter anatomie et équipement de l'espèce ; aucune oreille humaine sur asari, aucun visage humain découvert sous une combinaison quariane, aucune combinaison volus simplifiée en costume de robot.

Les armes, câbles, pinces, volets, drones, impacts et halos mobiles sont des assets séparés.

Conserver asymétries, identité et inscriptions ; le miroir automatique ne valide pas la vue opposée.

## Règles de conception du combat

- **simulationProposal** : 60 Hz pour exprimer les fenêtres de conception ; ces chiffres restent des propositions non testées.
- **bossPolicy** : Boss de défi et d'histoire séparés du versus compétitif ; pas de boss multi-composant ajouté au classement sans équilibrage propre.
- **counterplay** : Chaque attaque a une annonce visuelle et sonore, une portée finie et une récupération ; aucune espèce jouable n'est obligatoire pour réussir.
- **controls** : La garde, le déplacement et au moins une réponse commune restent disponibles lors des brouillages ; immunité temporaire après contrôle pour éviter les boucles.
- **projectileLifecycle** : Annonce → activation → collision utile unique ou cadence explicite → fin ; annulation au changement de phase, KO et sortie de rencontre.
- **camera** : Aucune attaque dommageable hors écran. Les gros boss montrent leurs composants actifs dans le même cadre que le joueur.
- **accessibility** : Contours et icônes doublent les couleurs ; télégraphes jamais masqués par fumée, flashes ou premier plan ; options de réduction des éclairs et secousses.
- **persistence** : Une preuve et une récompense possèdent une clé unique ; recommencer, changer de combattant ou recharger ne crée pas de crédits ou d'objets en double.
- **scope** : Spécification de contenu et de comportement ; aucun code moteur ni résultat de playtest n'est revendiqué par ce fichier.

## 20 stages et leurs cinq couches

Tous les stages emploient une caméra orthographique latérale et un sol plat. La proposition compétitive utilise une largeur de 12 unités, des départs à −3 et +3, sans danger, sol mobile ni prop interactif. Ces unités et fenêtres sont des données de conception à adapter au moteur. Les facteurs de parallaxe proposés sont 0,08 / 0,25 / 0,55 / 1 / 1,15 ; ils ne prouvent aucun assemblage déjà réalisé.

### nacre_stage_01 — Quai des arrivées de Nacre

**Acte 1 · Nacre — couronne d'accueil**

Intérieur pressurisé d’une station de fret des systèmes Terminus, vue strictement latérale de combat, plancher horizontal vers 80 % de l’image. Deux sas industriels ivoire, graphite et cuivre, signalétique cyan usée, quais à lumière orange chaude et grande baie vitrée sur Tessère, sa géante gazeuse et les cargos locaux. Zone de duel dégagée, sans personnages ni objets au premier plan.

Objectif : Obtenir le registre d'arrivée avant le transfert des passagers.

Boss : nacre_boss_01 ; prop principal : nacre_prop_01 ; opposition : nacre_enemy_01, nacre_enemy_02, nacre_enemy_13.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Tessère, sa géante gazeuse et étoiles fixes derrière la baie vitrée | 0.08 |
| background | Flancs de cargos à l'amarrage | 0.25 |
| midground | Portiques, guichets et files de caisses derrière le plan | 0.55 |
| floor | Tôle claire à bandes de sécurité effacées | 1.0 |
| foreground | Deux gaines et feux de quai aux extrémités | 1.15 |

Histoire : Un portique effectue un balayage annoncé ; le joueur peut couper son alimentation au terminal latéral.

Limite de lore : Nacre ne possède pas de relais cosmodésique privé : les silhouettes sont des cargos et navettes.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_02 — Galerie de transit

**Acte 1 · Nacre — marché couvert**

Atrium de services sous des poutres blanches, kiosques suspendus et écrans de transport ambrés ; impression de prospérité sous surveillance.

Objectif : Relier les contrats falsifiés aux numéros des lots de passagers.

Boss : nacre_boss_02 ; prop principal : nacre_prop_02 ; opposition : nacre_enemy_01, nacre_enemy_04, nacre_enemy_08.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Verrière et panneaux solaires éloignés | 0.08 |
| background | Balcons administratifs sur deux niveaux | 0.25 |
| midground | Comptoirs distincts et jalousies fermées | 0.55 |
| floor | Dalles composites planes, joints lisibles | 1.0 |
| foreground | Stores roulés et potelets hors silhouettes | 1.15 |

Histoire : Des volets de sécurité ferment des postes en arrière-plan ; une borne protégée devient momentanément inaccessible.

Limite de lore : Les publicités sont celles des sociétés originales locales ; pas de logo Cerberus inventé sur chaque appareil.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_03 — Annexe de quarantaine

**Acte 1 · Nacre — clinique de transit**

Couloir clinique blanc cassé à joints bleus, cabines isolées derrière une vitre, lumière douce et matériel médical rangé.

Objectif : Protéger les dossiers médicaux et ouvrir un départ sanitaire pour les retenus.

Boss : nacre_boss_03 ; prop principal : nacre_prop_03 ; opposition : nacre_enemy_05, nacre_enemy_12, nacre_enemy_15.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Ailes de l'infirmerie sous verre dépoli | 0.08 |
| background | Réservoirs et cheminements stériles | 0.25 |
| midground | Cabines de triage fermées, écrans à pictogrammes | 0.55 |
| floor | Résine grise mate sans sang ni débris glissants | 1.0 |
| foreground | Pieds de chariot et montants latéraux | 1.15 |

Histoire : Un cycle de décontamination remplit un tiers du fond de vapeur ; seule une zone de sol nettement signalée devient dangereuse.

Limite de lore : Les patients restent hors de la zone de combat ; la défaite n'implique pas une exécution de civils.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_04 — Salle des scellés

**Acte 1 · Nacre — tri automatisé**

Grande salle d'étiquetage orange sombre, rails verticaux, pinces de tri et rangées de cases d'archives ; le contraste vient des étiquettes lumineuses.

Objectif : Saisir un lot de preuves sans détruire son numéro de suivi.

Boss : nacre_boss_04 ; prop principal : nacre_prop_04 ; opposition : nacre_enemy_03, nacre_enemy_14, nacre_enemy_19.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Puits logistique obscur | 0.08 |
| background | Colonnes de stockage automatiques | 0.25 |
| midground | Casier témoin, bras de tri et rails fixes | 0.55 |
| floor | Grille antidérapante à pas réguliers | 1.0 |
| foreground | Garde-corps bas coupés avant l'espace de duel | 1.15 |

Histoire : Un bras déplace une caisse vers une zone marquée ; l'objet peut être interrompu avant sa descente.

Limite de lore : Les manipulations automatiques sont des routines industrielles, pas une IA consciente qui choisit ses victimes.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_05 — Cale sèche des débiteurs

**Acte 1 · Nacre — maintenance lourde**

Ventre de cargo démonté sous une charpente immense, plaques ivoire, rouille contrôlée et faisceaux de travail obliques.

Objectif : Retrouver la plaque d'identification retirée d'un transport saisi.

Boss : nacre_boss_05 ; prop principal : nacre_prop_05 ; opposition : nacre_enemy_06, nacre_enemy_16, nacre_enemy_18.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Cloche du dock pressurisé | 0.08 |
| background | Coque du cargo et nervures porteuses | 0.25 |
| midground | Treuil, échafaudages et outillage immobilisé | 0.55 |
| floor | Plateau d'entretien continu de métal brun | 1.0 |
| foreground | Deux chaînes roulées, sans barres devant les pieds | 1.15 |

Histoire : Le treuil fait osciller une pièce de coque en hauteur après alarme ; l'ombre indique sa zone de chute.

Limite de lore : L'arène se trouve dans un dock pressurisé ; aucun personnage non équipé ne combat dans le vide.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_06 — Galerie des consignataires

**Acte 2 · Nacre — corridor commercial**

Longue galerie à arcades basses, vitrines vert bouteille, métal poli et terminaux de contrats ; un lieu élégant mais vidé de ses clients.

Objectif : Comparer un original contractuel à la copie rendue exécutoire.

Boss : nacre_boss_06 ; prop principal : nacre_prop_06 ; opposition : nacre_enemy_02, nacre_enemy_08, nacre_enemy_09.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Extension de la galerie sous verrière | 0.08 |
| background | Façades modulaires et coursives supérieures | 0.25 |
| midground | Comptoirs de courtage, horloges de transit | 0.55 |
| floor | Pierre synthétique sombre à bandes crème | 1.0 |
| foreground | Pots fermés et enseignes situés hors du corridor | 1.15 |

Histoire : Un panneau publicitaire endommagé s'allume avant une décharge électrique locale.

Limite de lore : Les échanges sociaux interespèces sont ordinaires ; l'activité criminelle appartient au consortium, pas à une espèce entière.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_07 — Pont des amarres

**Acte 2 · Nacre — ascenseur de fret**

Plateforme de service entre deux pylônes télescopiques, réseau de câbles noirs et grande baie sur les navettes ; profondeur verticale forte.

Objectif : Récupérer un transpondeur de quai avant sa réaffectation.

Boss : nacre_boss_07 ; prop principal : nacre_prop_07 ; opposition : nacre_enemy_13, nacre_enemy_16, nacre_enemy_20.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Planète et trajectoires de cargos très lentes | 0.08 |
| background | Tiges d'amarrage et colliers de dock | 0.25 |
| midground | Cage de l'ascenseur avec passerelles latérales | 0.55 |
| floor | Plateau plat verrouillé mécaniquement | 1.0 |
| foreground | Deux câbles aux limites extrêmes du cadre | 1.15 |

Histoire : Les moteurs déplacent le décor autour de la plateforme ; le sol reste stable et ne provoque pas de chute instantanée.

Limite de lore : La pesanteur locale est assurée par l'infrastructure ; aucune téléportation n'est utilisée.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_08 — Jardin sec des témoins

**Acte 2 · Nacre — refuge sous dôme**

Jardin minéral sous verre ambré, bancs bas, céramiques poreuses et quelques plantes xérophytes cultivées ; espace intime au milieu du fret.

Objectif : Faire témoigner un courtier qui connaît les ordres de transfert.

Boss : nacre_boss_08 ; prop principal : nacre_prop_08 ; opposition : nacre_enemy_07, nacre_enemy_09, nacre_enemy_15.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Courbe du dôme et ombres des structures | 0.08 |
| background | Terrasses de sable retenues derrière des vitres | 0.25 |
| midground | Banc, fontaine arrêtée et écrans acoustiques | 0.55 |
| floor | Dallage sec et stable sans dénivelé | 1.0 |
| foreground | Branches sèches seulement dans les angles hauts | 1.15 |

Histoire : Les panneaux acoustiques changent de position après un signal ; les lignes de vue changent dans la variante histoire.

Limite de lore : Ce jardin est une installation originale pour résidents ; il ne prétend pas reproduire une ville de Rakhana.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_09 — Chambre des garanties

**Acte 2 · Nacre — banque d'entrepôt**

Coffres cylindriques, portes épaisses, passerelles de consultation et éclairage cuivré ; vitres épaisses sur des équipements de pression.

Objectif : Geler les saisies automatiques avant la destruction des justificatifs.

Boss : nacre_boss_09 ; prop principal : nacre_prop_09 ; opposition : nacre_enemy_08, nacre_enemy_12, nacre_enemy_17.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Anneaux structurels du coffre | 0.08 |
| background | Rangées de capsules de dépôt | 0.25 |
| midground | Guichets et émetteurs de sécurité séparés | 0.55 |
| floor | Plaques noires cernées de lignes de circulation | 1.0 |
| foreground | Coins de coffres et piliers cadrés hors combattants | 1.15 |

Histoire : Des générateurs renforcent une protection temporaire ; ils peuvent être ciblés hors de leur phase couverte.

Limite de lore : La salle jouable reste respirable pour le groupe ; les zones volus sous pression sont séparées et jamais ouvertes comme piège.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_10 — Tri des vivres

**Acte 2 · Nacre — entrepôt alimentaire**

Réserves de nourriture sous emballages opaques, voies de manutention séparées, bras de tri et bannières de lots ; atmosphère de travail épuisé.

Objectif : Restituer les stocks détournés sans mélanger leurs destinations.

Boss : nacre_boss_10 ; prop principal : nacre_prop_10 ; opposition : nacre_enemy_06, nacre_enemy_11, nacre_enemy_16.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Hangars de réserve plongés dans la pénombre | 0.08 |
| background | Racks et cheminements de caisses | 0.25 |
| midground | Modules de conditionnement et poste de pesée | 0.55 |
| floor | Couloir de manutention jaune mat et gris | 1.0 |
| foreground | Coins de palettes sous la ligne de vue | 1.15 |

Histoire : Des palettes progressent lentement au fond ; une arrivée sur le plan de combat est précédée d'un voyant et d'une barrière.

Limite de lore : Les conteneurs de rations restent étiquetés et séparés ; les différences alimentaires ne deviennent pas un gag ou un pouvoir.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_11 — Front minier de Tessère

**Acte 3 · Tessère — excavation sous abri**

Front de roche sombre, filons ferrugineux peu lumineux, convoyeurs massifs et abri pressurisé vitré ; lumière orangée de la surface.

Objectif : Prélever l'enregistrement du pesage démontrant le trafic de charges.

Boss : nacre_boss_11 ; prop principal : nacre_prop_11 ; opposition : nacre_enemy_06, nacre_enemy_16, nacre_enemy_18.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Cratères de Tessère et horizon court | 0.08 |
| background | Chevalements miniers et remblais | 0.25 |
| midground | Foreuse et piliers de soutien | 0.55 |
| floor | Plaque de chantier plane fixée à la roche | 1.0 |
| foreground | Éclats de minerai confinés aux bords | 1.15 |

Histoire : Les chocs de foreuse produisent des bandes de sol annoncées ; les grosses projections restent des effets visuels sans dégâts aléatoires.

Limite de lore : L'extraction porte sur du minerai industriel courant ; aucun gisement d'élément zéro miraculeux ne motive le DLC.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_12 — Cimetière des coques

**Acte 3 · Tessère — déconstruction couverte**

Demi-coques de navettes, traverses géantes et grues de récupération sous une toiture transparente ; bleus froids et métal brûlé.

Objectif : Retrouver les traces d'un transport déclaré perdu avant son arrivée.

Boss : nacre_boss_12 ; prop principal : nacre_prop_12 ; opposition : nacre_enemy_10, nacre_enemy_13, nacre_enemy_18.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Silhouettes lointaines d'épaves anonymes | 0.08 |
| background | Arceaux de cargos empilés | 0.25 |
| midground | Grue et presse à pièces sous filets | 0.55 |
| floor | Allée de manutention dégagée et renforcée | 1.0 |
| foreground | Fragments verticaux cadrant les coins | 1.15 |

Histoire : Une presse comprime une zone marquée ; l'aire sûre reste visible, accessible et suffisamment large.

Limite de lore : Aucune épave du Normandy ou d'un autre vaisseau canon nommé n'est ajoutée comme décoration.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_13 — Serres de remplacement

**Acte 3 · Tessère — ferme sous dôme**

Longues rangées hydroponiques vert sourd, canalisations ivoire, bâches translucides et éclairage violet horticole limité au fond.

Objectif : Empêcher la falsification des volumes de nourriture servant à justifier la dette.

Boss : nacre_boss_13 ; prop principal : nacre_prop_13 ; opposition : nacre_enemy_04, nacre_enemy_05, nacre_enemy_10.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Toit du dôme et poussière extérieure | 0.08 |
| background | Rangs de cultures de plusieurs tailles | 0.25 |
| midground | Bacs d'irrigation et passerelle de contrôle | 0.55 |
| floor | Dallage technique sec, sans végétation sur les pieds | 1.0 |
| foreground | Feuilles hors plan et gouttières basses | 1.15 |

Histoire : Un bras d'irrigation coupe une bande annoncée ; son débit est une contrainte de déplacement, pas une pluie de dégâts imprévisibles.

Limite de lore : Les plantes sont des cultures originales ordinaires ; aucune nouvelle espèce intelligente ni technologie de Reliquat.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_14 — Pont cargo du Lest Gris

**Acte 3 · Cargo original Lest Gris — cale centrale**

Cale étroite mais profonde, conteneurs suspendus sur rails, portes hexagonales et hublots aveugles ; orange de service sur acier bleu.

Objectif : Copier l'ordre réel d'escale enregistré à bord.

Boss : nacre_boss_14 ; prop principal : nacre_prop_14 ; opposition : nacre_enemy_14, nacre_enemy_15, nacre_enemy_19.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Enfilade des compartiments cargo | 0.08 |
| background | Rails supérieurs et réservoirs blindés | 0.25 |
| midground | Réseau de portes, noyau de sûreté et cellules de commande | 0.55 |
| floor | Plateau cargo plat entre deux rangées sécurisées | 1.0 |
| foreground | Câbles attachés et arêtes de conteneurs latérales | 1.15 |

Histoire : Deux portes créent des couloirs de tir annoncés ; la sortie d'une porte ne coïncide jamais avec une prise inévitable.

Limite de lore : Le Lest Gris est un cargo local original ; ses commandes VI ne possèdent ni esprit collectif geth ni conscience secrète.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_15 — Canal du ballast

**Acte 3 · Cargo Lest Gris — galerie hydraulique**

Galerie sèche longeant un immense réservoir visible derrière une vitre, tuyaux ovales et reflets lents turquoise ; horizon bas.

Objectif : Rejoindre le branchement qui détourne les messages de détresse.

Boss : nacre_boss_15 ; prop principal : nacre_prop_15 ; opposition : nacre_enemy_17, nacre_enemy_18, nacre_enemy_20.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Volume sombre du ballast derrière les vitres | 0.08 |
| background | Baffles et silhouettes des conduites internes | 0.25 |
| midground | Vannes, hublots et rails de maintenance | 0.55 |
| floor | Passerelle sèche avec garde-corps situé au fond | 1.0 |
| foreground | Une conduite basse aux deux extrémités | 1.15 |

Histoire : Une purge de vapeur est annoncée par pression, son et lumière ; jamais de noyade automatique à écran entier.

Limite de lore : Le ballast est un système de service original du cargo, sans prétention de fiche technique officielle d'un modèle canon.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_16 — Atelier des combinaisons

**Acte 4 · Nacre — réparation des équipements**

Atelier textile et technique, mannequins sans corps, casques rangés, chambres hermétiques au fond et lignes d'entretien au sol.

Objectif : Rendre aux détenus les équipements dont le consortium retient la propriété.

Boss : nacre_boss_16 ; prop principal : nacre_prop_16 ; opposition : nacre_enemy_03, nacre_enemy_08, nacre_enemy_12.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Panneaux dépoli des chambres de test | 0.08 |
| background | Racks de pièces et bobines de tissus techniques | 0.25 |
| midground | Cabines scellées et consoles de diagnostic | 0.55 |
| floor | Résine mate et chemins dégagés | 1.0 |
| foreground | Bras de support repliés sur les bords | 1.15 |

Histoire : Des bras de montage occupent brièvement une zone marquée ; le courant peut être coupé après le premier cycle.

Limite de lore : Les combinaisons quarianes et volus sont conçues selon leurs contraintes respectives ; leurs circuits ne sont pas interchangeables.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_17 — Répartiteur thermique

**Acte 4 · Nacre — utilités de la station**

Tours de refroidissement fermées, plaques céramiques blanches, conduites rouge sombre et ventilation massive ; ambiance de fatigue industrielle.

Objectif : Rétablir un budget thermique suffisant pour maintenir les quais ouverts.

Boss : nacre_boss_17 ; prop principal : nacre_prop_17 ; opposition : nacre_enemy_05, nacre_enemy_10, nacre_enemy_17.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Plafond nervuré et grandes conduites | 0.08 |
| background | Colonnes de transfert et filtres verticaux | 0.25 |
| midground | Cartouches et panneaux de commande | 0.55 |
| floor | Pont technique rectiligne avec trappes verrouillées | 1.0 |
| foreground | Raccords de tubes très bas hors silhouettes | 1.15 |

Histoire : Des soupapes purgent des bandes de vapeur après alarme ; le niveau de chaleur se lit aussi sur une jauge accessible.

Limite de lore : Les composants dissipent la chaleur ; ils n'expliquent pas un rayon de gel magique ni une énergie illimitée.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_18 — Nœud d'écoute des convois

**Acte 4 · Nacre — tour de communication**

Galerie protégée sous une antenne civile, rangées de paraboles visibles au dehors, écrans vert pâle et ciel noir au-dessus de Tessère.

Objectif : Envoyer les témoignages hors du réseau contrôlé par le Concordat.

Boss : nacre_boss_18 ; prop principal : nacre_prop_18 ; opposition : nacre_enemy_02, nacre_enemy_07, nacre_enemy_15.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Espace et croissant de Tessère | 0.08 |
| background | Antennes à rotation lente derrière une enveloppe vitrée | 0.25 |
| midground | Baies d'écoute et câblage vertical | 0.55 |
| floor | Passerelle technique plate à bords continus | 1.0 |
| foreground | Montants fins situés aux limites du cadre | 1.15 |

Histoire : Un brouillage masque les faux marqueurs ennemis, mais jamais les signes de danger ni les commandes du joueur.

Limite de lore : L'antenne est un équipement de communication local ; elle n'ouvre pas de relais, ne téléporte personne et ne contacte pas Andromeda.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_19 — Salle des matrices

**Acte 4 · Nacre — archives sous séquestre**

Archives physiques et serveurs protégés dans une chambre feutrée à halos bleus, lecteurs rouges inactifs et câbles proprement gainés.

Objectif : Publier la chaîne des validations établissant la responsabilité de la direction.

Boss : nacre_boss_19 ; prop principal : nacre_prop_19 ; opposition : nacre_enemy_09, nacre_enemy_14, nacre_enemy_19.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Alvéoles d'archives et murs courbes | 0.08 |
| background | Rayonnages scellés séparés par des vitres | 0.25 |
| midground | Consoles de validation et coffres de sauvegarde | 0.55 |
| floor | Dalles anthracite avec rails noyés | 1.0 |
| foreground | Cadres de baie sans masquage de la zone de duel | 1.15 |

Histoire : L'effacement progresse par segments lisibles ; une interruption déclenche un délai récupérable, pas une perte définitive après une seule erreur.

Limite de lore : La falsification résulte d'ordres humains et de complices ; une VI n'est pas rendue coupable de décisions politiques autonomes.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

### nacre_stage_20 — Digue d'embarquement

**Acte 4 · Nacre — sortie civile principale**

Longue terrasse intérieure ouverte visuellement sur les navettes d'évacuation, lumière d'aube réfléchie, rampes abaissées et balises blanches.

Objectif : Achever l'évacuation tout en conservant une preuve exploitable des saisies.

Boss : nacre_boss_20 ; prop principal : nacre_prop_20 ; opposition : nacre_enemy_01, nacre_enemy_11, nacre_enemy_20.

| Couche séparée | Contenu | Facteur proposé |
|---|---|---|
| far | Tessère et lumière rasante d'une étoile locale non nommée | 0.08 |
| background | Navettes civiles et grande coque de Nacre | 0.25 |
| midground | Passerelles d'embarquement, commandement du quai et cordons de sécurité | 0.55 |
| floor | Quai plat clair à repères larges | 1.0 |
| foreground | Balises basses et garde-corps aux côtés du cadre | 1.15 |

Histoire : Des barrières matérielles tentent de couper deux files ; la fenêtre d'action est annoncée et n'empêche pas le combat de rester lisible.

Limite de lore : La résolution sauve des habitants et expose un consortium local ; elle ne change pas les choix de Shepard ni la suite de la trilogie.

Acceptation : cinq vrais fichiers, pas de personnages incrustés, aucun masquage des pieds/mains, neutralisation mécanique du danger en compétitif. État : Défini, à produire.

## 20 ennemis ordinaires

Chaque entrée définit une identité de production et un rôle. Les unités partageant une espèce ne sont pas de simples recolorations : comportement, équipement, télégraphe et contre diffèrent.

### nacre_enemy_01 — Porte-scellés

**Humain · garde de contrôle**

Casque court, gilet à col haut et protège-bras blanc avec sceau ambré original.

Équipement : Matraque de sûreté et arme de poing à accélérateur.

Comportement : Avance en garde, s'arrête à portée puis alterne poussée et coup retardé.

Annonce : Épaule abaissée et deux bips avant la poussée.

Contre : Faire rater la poussée, punir le retour du bras ; la garde n'arrête pas une prise réussie.

Limite de gameplay : Ne poursuit pas au-delà d'un poste de contrôle ; ne lit pas les entrées du joueur.

Limite de lore : Pas d'habilitation N7 ni d'uniforme officiel réinventé.

Stages : nacre_stage_01, nacre_stage_02. Effets : nacre_fx_01, nacre_fx_14. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_02 — Sentinelle de quai

**Turien · contrôle de ligne**

Silhouette turienne haute, plaques de joue visibles, cuirasse asymétrique de manutention et crête intacte.

Équipement : Fusil à accélérateur compact.

Comportement : Choisit un couvert marqué, tire une rafale courte puis change de côté si le joueur s'approche.

Annonce : Visée fixe et diode à l'épaule durant 30 frames de proposition.

Contre : Approcher pendant le rechargement, frapper la couverture puis passer de l'autre côté.

Limite de gameplay : Pas de tirs hors écran ; une seule nouvelle position choisie par salve.

Limite de lore : La précision vient de l'entraînement ; aucun pouvoir biotique implicite.

Stages : nacre_stage_01, nacre_stage_06, nacre_stage_18. Effets : nacre_fx_01, nacre_fx_03. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_03 — Percepteur d'abordage

**Batarien · briseur rapproché**

Quatre yeux visibles, masque de mâchoire amovible visuellement mais jamais arraché, mantelet de protection trapu.

Équipement : Fusil court et gantelet de choc.

Comportement : Attend une garde prolongée puis se rapproche pour une saisie lente ; tire si on recule trop tôt.

Annonce : Main ouverte, pas lourd puis voyant blanc du gantelet.

Contre : Interrompre avant la saisie ou esquiver son engagement ; la salve a une longue récupération.

Limite de gameplay : Ne saisit pas une cible déjà contrôlée ; résistance aux boucles de prise après relâchement.

Limite de lore : Le rôle décrit une unité du consortium ; il ne caractérise pas les Batariens en général.

Stages : nacre_stage_04, nacre_stage_16. Effets : nacre_fx_02, nacre_fx_14. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_04 — Veilleuse biotique

**Asari · contrôle de zone**

Crâne asari sans chevelure, manteau de travail ajusté sur combinaison, petites plaques bleues originales.

Équipement : Projection biotique et pistolet.

Comportement : Marque une zone de poussée, protège un allié proche puis laisse une fenêtre après canalisation.

Annonce : Trajet bleu-violet au sol, geste continu de la main et tonalité montante.

Contre : Sortir de la zone au déclenchement puis attaquer pendant la retombée du champ.

Limite de gameplay : Une seule zone active ; immunité temporaire à la relance du même contrôle sur la même cible.

Limite de lore : Biotique entraînée ; pas de téléportation ni de contrôle mental attribué par défaut.

Stages : nacre_stage_02, nacre_stage_13. Effets : nacre_fx_05, nacre_fx_19. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_05 — Sapeur de facturation

**Galarien · pièges de proximité**

Corps fin, yeux sombres, coudes dégagés et sac technique rectangulaire.

Équipement : Balises à décharge et omni-outil.

Comportement : Place deux balises au maximum et essaie de conduire le joueur entre elles.

Annonce : Son sec de fixation et halo au sol pulsant avant armement.

Contre : Détruire la balise non armée ou forcer le sapeur à sortir de son réseau.

Limite de gameplay : Ne pose pas sous les pieds d'une cible immobilisée ; pas de balise invisible.

Limite de lore : L'omni-outil traite des appareils accessibles ; il n'annule pas toute armure à distance.

Stages : nacre_stage_03, nacre_stage_13, nacre_stage_17. Effets : nacre_fx_04, nacre_fx_15. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_06 — Récupérateur de dette

**Krogan · pression lourde**

Bosse et plaques crâniennes nettes ; harnais de cargaison avec épaulière épaisse et tablier court.

Équipement : Marteau de chantier renforcé et fusil lourd.

Comportement : Accumule une courte élan, charge au sol, puis se bloque contre un obstacle ou au bout de la piste.

Annonce : Deux frappes de pied, respiration forte et tension du torse.

Contre : Éviter latéralement au bon moment puis attaquer le flanc durant le freinage.

Limite de gameplay : Le suivi s'arrête dès que la charge démarre ; pas de virage instantané.

Limite de lore : Robustesse krogan n'implique pas invulnérabilité ni régénération infinie.

Stages : nacre_stage_05, nacre_stage_10, nacre_stage_11. Effets : nacre_fx_02, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_07 — Baliseur discret

**Drell · attaque de flanc**

Silhouette souple, cou nervuré visible, mantelet court gris et genouillères d'escalade.

Équipement : Pistolet, fumigène et outil de coupe physique.

Comportement : Disparaît brièvement derrière une fumée locale puis réapparaît dans une position télégraphiée.

Annonce : Ombre et froissement dans le côté d'arrivée ; éclat du viseur avant le tir.

Contre : Attendre la réapparition au lieu de frapper une silhouette factice ; chasser hors de la fumée.

Limite de gameplay : Fumée réduite par l'option de lisibilité ; aucun coup actif à l'intérieur d'un masquage total.

Limite de lore : La discrétion relève du matériel et de la formation, pas d'un pouvoir de déplacement racial.

Stages : nacre_stage_08, nacre_stage_18. Effets : nacre_fx_01, nacre_fx_12. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_08 — Garant mobile

**Volus · soutien de protection**

Combinaison de pression ronde, respirateur intact, paire d'émetteurs dorsaux externes séparés de la survie.

Équipement : Émetteur de bouclier local et arme de poing.

Comportement : Reste près d'un allié et le recharge par fenêtres ; recule lentement s'il devient prioritaire.

Annonce : Ligne cyan reliant uniquement l'allié réellement soutenu.

Contre : Rompre la ligne ou désactiver l'émetteur pendant sa recharge ; aucun besoin de percer la combinaison.

Limite de gameplay : Une cible soutenue à la fois ; réserve de protection et cooldown finis.

Limite de lore : Pas de roulades acrobatiques ; les éléments offensifs se démontent sans ouvrir le système respiratoire.

Stages : nacre_stage_02, nacre_stage_06, nacre_stage_09, nacre_stage_16. Effets : nacre_fx_06, nacre_fx_07. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_09 — Éclaireuse à faux signal

**Humaine · embuscade technologique**

Armure légère mate, capuche de service courte et générateur de camouflage externe visible.

Équipement : Pistolet et camouflage tactique limité.

Comportement : Laisse une trace de capteur puis attaque après un déplacement court sous camouflage.

Annonce : Distorsion des contours, bruit de pas et lumière du générateur avant réapparition.

Contre : Lire le déplacement, bloquer le premier tir puis punir le refroidissement.

Limite de gameplay : Camouflage rompu sur attaque ; pas d'invisibilité persistante après impact reçu.

Limite de lore : Le camouflage est une fonction de l'équipement, pas une disparition physique.

Stages : nacre_stage_06, nacre_stage_08, nacre_stage_19. Effets : nacre_fx_01, nacre_fx_13. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_10 — Chalumiste sous contrat

**Vorcha · pression à courte portée**

Silhouette vorcha nerveuse, masque de chantier et bidon de service fixé au dos.

Équipement : Chalumeau industriel détourné.

Comportement : Entre lentement en portée, balaie un cône de chaleur puis doit couper le débit.

Annonce : Sifflement de valve et flamme pilote avant le cône.

Contre : Reculer pendant le balayage puis entrer au moment où la valve se referme.

Limite de gameplay : Portée courte et cône explicite ; aucune nappe permanente après disparition de l'ennemi.

Limite de lore : Le matériel industriel est original ; le comportement ne réduit pas tous les Vorchas à des incendiaires.

Stages : nacre_stage_12, nacre_stage_13, nacre_stage_17. Effets : nacre_fx_10, nacre_fx_11. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_11 — Porte-charge blindé

**Elcor · mur mobile**

Quadrupède massif, visage ouvert, harnais de manutention au-dessus des épaules avec bouclier frontal séparé.

Équipement : Bélier de poussée assisté et émetteur frontal.

Comportement : Occupe une voie, pousse lentement puis pivote avec un délai avant de protéger un autre côté.

Annonce : Intention dite à voix basse, verrouillage du harnais et translation des épaules.

Contre : Passer pendant le pivot ou neutraliser le module frontal ; frapper de face sans plan est inefficace.

Limite de gameplay : Pas de saut, téléportation ou charge fulgurante ; rotation lisible et plafonnée.

Limite de lore : Locomotion et débit de voix cohérents avec le codex ; le harnais est un appareil original de dock.

Stages : nacre_stage_10, nacre_stage_20. Effets : nacre_fx_06, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_12 — Inspecteur des interfaces

**Quarien · sabotage ciblé**

Combinaison hermétique bleu-gris, visière sombre et outils rangés sur un baudrier étroit.

Équipement : Omni-outil, drone de diagnostic et pistolet.

Comportement : Envoie un drone sur une borne ou un soutien allié puis exploite une seule panne temporaire.

Annonce : Le drone suit une trajectoire claire ; une icône montre le module ciblé avant le sabotage.

Contre : Détruire le drone ou frapper l'opérateur durant la connexion.

Limite de gameplay : Ne supprime ni déplacements ni défense de base ; la panne ne peut pas s'enchaîner indéfiniment.

Limite de lore : Le contrat et sa responsabilité sont individuels ; ce n'est pas une unité officielle de la Flotte.

Stages : nacre_stage_03, nacre_stage_09, nacre_stage_16. Effets : nacre_fx_04, nacre_fx_13, nacre_fx_20. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_13 — Limier de cale

**Méca quadrupède original · poursuite basse**

Corps de maintenance court, quatre pattes articulées, tête de capteurs carrée et une lampe horizontale.

Équipement : Pince de retenue et décharge de contact.

Comportement : Suit une balise de contrebande puis bondit sur une trajectoire courte et droite.

Annonce : Pattes fléchies, lampe qui se resserre et triple clic.

Contre : Esquiver l'axe du bond puis frapper le châssis au retour au sol.

Limite de gameplay : Une seule correction de cap avant le départ ; délai entre deux bonds.

Limite de lore : VI de pistage bornée ; dessin original inspiré de fonctions présentes dans le codex, sans se prétendre un FENRIS exact.

Stages : nacre_stage_01, nacre_stage_07, nacre_stage_12. Effets : nacre_fx_14, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_14 — Agent de clôture

**Méca léger original · garde programmable**

Bipède étroit à mains-outils, coque rectangulaire et badge de service triangulaire.

Équipement : Électrochoqueur et arme de sûreté intégrée.

Comportement : Annonce une fermeture puis défend un carré de sol ; poursuit seulement après violation de sa consigne.

Annonce : Annonce sonore sous-titrée et segments lumineux sur la zone gardée.

Contre : Attirer hors de la zone, provoquer un coup de bras puis punir sa remise en position.

Limite de gameplay : Routine locale visible ; ne coordonne pas seul un enlèvement ou une enquête.

Limite de lore : Méca de sûreté à VI limitée ; mains opposables conservées pour sa fonction d'outil.

Stages : nacre_stage_04, nacre_stage_14, nacre_stage_19. Effets : nacre_fx_01, nacre_fx_14. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_15 — Sonde de marquage

**Drone original · désignation de cible**

Anneau aplati, capteur inférieur et deux petites dérives ; ne ressemble pas à un geth miniature.

Équipement : Projecteur de capteurs et faible décharge.

Comportement : Marque une zone pour un allié, puis s'éloigne pour recharger son capteur.

Annonce : Cône visible qui se fige avant la validation du marquage.

Contre : Sortir du cône ou détruire la sonde ; le marquage ne traverse pas un couvert.

Limite de gameplay : Deux sondes au maximum actives par rencontre ; pas de caméra secouée par le marqueur.

Limite de lore : Le survol utilise les technologies locales connues ; pas de conscience collective inventée.

Stages : nacre_stage_03, nacre_stage_08, nacre_stage_14, nacre_stage_18. Effets : nacre_fx_13, nacre_fx_14. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_16 — Mule magnétique

**Plateforme cargo originale · contrôle par obstacle**

Socle très bas sur patins, dos plat et serre-caisses mécaniques ; volume large et industriel.

Équipement : Charge de cargaison et pince de retenue.

Comportement : Pousse une caisse annoncée puis freine ; sert d'obstacle mobile plutôt que de tireur.

Annonce : Rampe de feux blancs puis alarme de recul.

Contre : Éviter la ligne de poussée et atteindre le contacteur latéral après le freinage.

Limite de gameplay : Ne pousse pas au-delà des limites de l'arène ; vitesse et masse plafonnées en gameplay.

Limite de lore : Les champs de masse facilitent la manutention ; aucun aimant ne contrôle les corps organiques à volonté.

Stages : nacre_stage_05, nacre_stage_07, nacre_stage_10, nacre_stage_11. Effets : nacre_fx_16, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_17 — Nacelle de brouillage

**Appareil fixe original · dénégation de soutien**

Trépied court, tête à trois disques et capot de maintenance ouvert vers le fond.

Équipement : Brouilleur d'émetteurs locaux.

Comportement : Alterne un arc de perturbation et une recharge exposée ; gêne une fonction de soutien définie.

Annonce : Trois disques tournent ensemble et la zone apparaît avec texture hachurée.

Contre : Détruire la nacelle durant sa recharge ou franchir l'arc hors de sa portée.

Limite de gameplay : La garde, les sauts et le mouvement restent disponibles ; pas d'annulation universelle des pouvoirs.

Limite de lore : Le brouillage concerne des interfaces déterminées ; il n'éteint pas une personne biotique.

Stages : nacre_stage_09, nacre_stage_15, nacre_stage_17. Effets : nacre_fx_04, nacre_fx_07, nacre_fx_19. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_18 — Araignée soudeuse

**Robot de service original · danger de sol**

Six membres fins autour d'un corps plat, torche rabattable et câble de bobine séparé.

Équipement : Tête de soudure industrielle.

Comportement : S'arrête pour tracer une ligne courte de chaleur puis replie sa tête pour traverser.

Annonce : Ligne de travail en pointillés, tête abaissée et bruit de mise à feu.

Contre : Franchir le segment avant son activation ou frapper le corps pendant le repli.

Limite de gameplay : Une ligne courte à la fois ; aucune attaque cachée derrière les combattants.

Limite de lore : Robot original de maintenance ; le cordon électrique est un élément mobile séparé à produire.

Stages : nacre_stage_05, nacre_stage_11, nacre_stage_12, nacre_stage_15. Effets : nacre_fx_10, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_19 — Tourelle à collerette

**Tourelle originale · pression angulaire**

Embase circulaire, canon court et collerette fendue qui expose un capteur durant la rotation.

Équipement : Accélérateur cinétique de sûreté.

Comportement : Balaie un angle lentement puis tire une rafale et ventile.

Annonce : Faisceau de visée fin avec balayage lent, puis pause avant le tir.

Contre : Traverser le faisceau pendant le balayage, attaquer après la salve ou utiliser le couvert.

Limite de gameplay : Pas de visée instantanée sur l'apparition ; dégâts calculés une fois par projectile logique.

Limite de lore : La trace lumineuse sert à lire le tir ; la munition n'est pas transformée en long laser de science-fiction générique.

Stages : nacre_stage_04, nacre_stage_14, nacre_stage_19. Effets : nacre_fx_01, nacre_fx_03. Corps, équipement mobile, poses et effets restent à produire séparément.

### nacre_enemy_20 — Sonde de poursuite

**Microdrone original · harcèlement mesuré**

Petit corps triangulaire, deux volets stabilisateurs et diode unique ; un seul drone par sprite.

Équipement : Impulsion électrique de proximité.

Comportement : Approche en zigzag prévisible, s'immobilise pour une impulsion puis se retire.

Annonce : Volets rabattus et cercle qui se referme avant décharge.

Contre : Attaquer durant l'arrêt ou s'éloigner du rayon annoncé.

Limite de gameplay : Trois unités maximum ; leurs décharges sont décalées pour éviter une immobilisation perpétuelle.

Limite de lore : Le type décrit une unité ; un groupe ne doit pas être compté comme un sprite individuel déjà réalisé.

Stages : nacre_stage_07, nacre_stage_15, nacre_stage_20. Effets : nacre_fx_14, nacre_fx_17. Corps, équipement mobile, poses et effets restent à produire séparément.

## 20 boss distincts

Les trois phases sont des propositions à 60 Hz. Les seuils proposés sont 100 %, 66 %, 33 % de santé restante ; ils ne restaurent jamais la santé. Chaque changement de phase annule les attaques encore actives, annonce sa routine et assure une fenêtre sans attaque invisible. Le KO est distinct d'une mort narrative. Les récompenses ont une clé unique pour éviter leur duplication à la reprise.

### nacre_boss_01 — Odran Kell

**Humain · nacre_stage_01**

Chef des contrôles de débarquement, rémunéré sur les frais de retard.

Visuel : Veste de quai blindée gris clair, demi-casque et brassard à double sceau ; silhouette droite, courte cape de pluie absente.

Signature : Apprendre à séparer garde physique, tir et ordre de renfort.

Point faible : Terminal de fermeture indépendant de sa réserve de santé.

#### Contrôle de passage — seuil proposé 100 %

Avance derrière un bouclier court puis effectue deux coups de matraque distincts.

Annonce (30 frames proposées) : Bouclier levé et appel vocal avant la première frappe.

Réponse : Bloquer le premier coup et esquiver le second pour frapper son côté ouvert. Récupération proposée : 30 frames.

#### File prioritaire — seuil proposé 66 %

Appelle un porte-scellés et ferme alternativement une petite portion du quai.

Annonce (48 frames proposées) : Borne qui clignote avec numéro de zone et alarme de portique.

Réponse : Couper la borne ou vaincre l'auxiliaire ; les deux options libèrent la même fenêtre. Récupération proposée : 36 frames.

#### Mainlevée forcée — seuil proposé 33 %

Abandonne la garde mobile pour une charge au gantelet suivie d'une salve courte.

Annonce (36 frames proposées) : Abaissement du bouclier et verrouillage visible du gantelet.

Réponse : Faire rater la charge puis interrompre la mise en joue. Récupération proposée : 42 frames.

Résolution : Registre d'arrivée et premier lot de contrats saisis.

Limite de lore : Ses sceaux n'octroient aucun pouvoir spécial ; un KO suspend son contrôle sans signifier sa mort.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_02 — Terea Soth

**Asari · nacre_stage_02**

Responsable privée de la sûreté des transitaires ; protège d'abord la réputation de ses clients.

Visuel : Tenue de sûreté bleu pétrole, masque de joue ouvert, plaques lisses et crête asari libre.

Signature : Déplacer des caisses légères par biotique pour remodeler temporairement les trajectoires.

Point faible : Canalisation visible, une seule masse maintenue à la fois.

#### Objet sous scellé — seuil proposé 100 %

Soulève une caisse de service puis la déplace horizontalement avant de la poser.

Annonce (42 frames proposées) : Lien biotique entre main et caisse ; ombre de pose au sol.

Réponse : Passer sous la trajectoire haute et attaquer pendant la descente annoncée. Récupération proposée : 30 frames.

#### Zone réservée — seuil proposé 66 %

Pose un champ de répulsion local puis projette un second objet de faible masse.

Annonce (48 frames proposées) : Anneau texturé au sol et geste du bras opposé.

Réponse : Quitter l'anneau et attendre la fin du maintien ; la prise casse sa concentration à portée. Récupération proposée : 36 frames.

#### Rupture du mandat — seuil proposé 33 %

Enchaîne deux poussées directionnelles puis doit récupérer sans barrière personnelle.

Annonce (36 frames proposées) : Deux gestes nettement séparés ; la deuxième direction se verrouille avant l'action.

Réponse : Esquiver la première, garder la seconde ou changer de côté avant son verrouillage. Récupération proposée : 48 frames.

Résolution : Copie signée des mandats de transfert.

Limite de lore : Biotique entraînée ; pas de téléportation, vol permanent ou pouvoir psychique inventé.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_03 — Halek Orr

**Galarien · nacre_stage_03**

Auditeur du triage qui transforme les défauts administratifs en coûts impossibles à rembourser.

Visuel : Blouse technique courte sur armure fine, pupilles sombres et deux boîtiers de diagnostic au ceinturon.

Signature : Faux circuits à distinguer par leur alimentation réelle.

Point faible : Boîtier réellement branché indiqué par un câble et un son continus.

#### Contrôle croisé — seuil proposé 100 %

Active deux balises dont une seule est reliée à l'attaque électrique.

Annonce (48 frames proposées) : Le câble utile devient lumineux ; l'autre reste inerte.

Réponse : Détruire la balise alimentée ou sortir de sa zone avant la décharge. Récupération proposée : 30 frames.

#### Nouvelle expertise — seuil proposé 66 %

Déplace le branchement d'une balise à l'autre après chaque attaque et ajoute une sonde.

Annonce (42 frames proposées) : Raccordement physique visible, tonalité de la sonde et numéro sur le module.

Réponse : Neutraliser la sonde puis frapper Halek lorsqu'il reconnecte manuellement. Récupération proposée : 36 frames.

#### Facture finale — seuil proposé 33 %

Lance une séquence courte de trois secteurs de décharge, puis éjecte une cartouche vide.

Annonce (54 frames proposées) : Les trois secteurs s'allument dans leur ordre exact, sans tirage aléatoire caché.

Réponse : Suivre l'ordre annoncé et punir l'éjection de cartouche. Récupération proposée : 48 frames.

Résolution : Historique des diagnostics et preuve de surfacturation médicale.

Limite de lore : Son omni-outil n'invente pas une infection ni un pouvoir de contrôle biologique.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_04 — Karrh Bhekt

**Batarien · nacre_stage_04**

Préposé des saisies qui conserve les pièces à conviction comme moyens de pression.

Visuel : Quatre yeux sous un bandeau rigide, protection d'épaule massive et pistolet accroché à un harnais court.

Signature : Saisir une caisse de preuves ou le combattant selon une annonce différente.

Point faible : Bras droit verrouillé pendant le recul du mécanisme de retenue.

#### Saisie conservatoire — seuil proposé 100 %

Frappe bas au gantelet puis menace une prise lente à courte portée.

Annonce (30 frames proposées) : Coup bas annoncé par genou plié ; prise par main ouverte et voyant circulaire.

Réponse : Lire les deux annonces, rester mobile et punir la prise manquée. Récupération proposée : 36 frames.

#### Pièce manquante — seuil proposé 66 %

Attire un conteneur avec un grappin de fret et s'en sert comme couvert temporaire.

Annonce (48 frames proposées) : Grappin visible, câble tendu et trajectoire hachurée du conteneur.

Réponse : Briser l'ancrage ou le contourner ; jamais besoin de tirer sur un civil. Récupération proposée : 42 frames.

#### Sous réserve — seuil proposé 33 %

Fait une feinte de prise puis une attaque lourde, avec recul de l'épaule avant l'impact.

Annonce (36 frames proposées) : Le voyant de prise s'éteint ; un bruit mécanique distinct annonce le coup lourd.

Réponse : Ne pas sauter sur la feinte ; intercepter le démarrage lent ou garder puis riposter. Récupération proposée : 48 frames.

Résolution : Lot de scellés originaux correspondant aux identités retenues.

Limite de lore : Le grappin vise cargaison et équipements ; aucune chaîne organique ou télékinésie raciale.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_05 — Karnak Vohl

**Krogan · nacre_stage_05**

Contremaître de la cale sèche, ancien salarié lié au Concordat par une dette de matériel.

Visuel : Bosse krogan sous un harnais de treuil rouge brique, tête usée et grands gants d'entretien ; masse concentrée au torse.

Signature : Prises de manutention et chocs qui changent les couvertures du dock.

Point faible : Treuil fixé au dos qui doit se réarmer après usage.

#### Prise de poste — seuil proposé 100 %

Charge sur une ligne arrêtée puis retourne une plaque de coque en couvert.

Annonce (36 frames proposées) : Marquage des pieds, respiration et plaque qui se soulève lentement.

Réponse : Esquiver la ligne et attaquer quand il fixe la plaque. Récupération proposée : 42 frames.

#### Charge hors norme — seuil proposé 66 %

Accroche une pièce légère au treuil et la balaie en arc limité.

Annonce (54 frames proposées) : Grincement du câble et arc dessiné au sol avant le départ.

Réponse : Rester dans l'ouverture proche ou passer derrière pendant l'enroulement. Récupération proposée : 42 frames.

#### Dette de force — seuil proposé 33 %

Détache le treuil, gagne en mobilité et alterne trois coups lourds espacés.

Annonce (30 frames proposées) : Abandon visible du matériel ; mains repositionnées entre les coups.

Réponse : Faire rater la série et punir son souffle ; une garde continue n'offre pas une ouverture infinie. Récupération proposée : 54 frames.

Résolution : Identification du transport démantelé et possibilité de libérer son contrat.

Limite de lore : La robustesse ne régénère pas les phases ; aucune résurrection mécanique après KO.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_06 — Theral Oss

**Turien · nacre_stage_06**

Tireur sous contrat chargé d'empêcher les négociations hors du registre officiel.

Visuel : Armure longue et étroite gris vert, visière à une fente et arme de précision locale sans insigne hiérarchique.

Signature : Rythme de visée, suppression et changement de poste.

Point faible : Stock limité de couvertures déployables et recharge lisible.

#### Clause de distance — seuil proposé 100 %

Vise une ligne horizontale puis tire une fois et recule.

Annonce (42 frames proposées) : Viseur fixe, respiration brève et éclat du canon.

Réponse : Couper la ligne ou franchir avant le tir ; punir après la détonation. Récupération proposée : 36 frames.

#### Champ réservé — seuil proposé 66 %

Déploie deux petites protections et tire depuis l'une après un déplacement annoncé.

Annonce (48 frames proposées) : Le bon poste montre son ombre et sa mise en joue ; l'autre reste un leurre passif.

Réponse : Détruire le couvert choisi ou approcher pendant son déplacement. Récupération proposée : 42 frames.

#### Dernier avertissement — seuil proposé 33 %

Échange le tir de précision contre une salve brève et un coup de crosse retardé.

Annonce (30 frames proposées) : Arme abaissée et appui du pied avant la crosse.

Réponse : Ne pas poursuivre immédiatement la salve ; provoquer le coup de crosse puis punir. Récupération proposée : 48 frames.

Résolution : Contrat de sûreté et nom du commanditaire de la galerie.

Limite de lore : Aucune visée à travers les murs, aucun tir depuis une zone que la caméra ne montre pas.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_07 — Tuteur-6

**Méca de manutention original · nacre_stage_07**

Machine réaffectée à la fermeture du pont des amarres par un ordre falsifié.

Visuel : Deux pieds larges, torse-châssis ouvert, bras pinces courts et capteur suspendu ; silhouette de porteur, pas de soldat humanoïde.

Signature : Changer d'appui pour atteindre deux contacteurs opposés.

Point faible : Contacteurs de sécurité latéraux qui restent accessibles sans personnage spécifique.

#### Arrêt de quai — seuil proposé 100 %

Pose les deux pieds puis pousse le joueur avec une pince frontale.

Annonce (42 frames proposées) : Vérins ancrés et capteur qui descend vers la cible.

Réponse : Passer la pince et frapper le contacteur du côté exposé. Récupération proposée : 36 frames.

#### Réaffectation — seuil proposé 66 %

Pivote en levant un seul pied et tente de barrer le centre avec une amarre.

Annonce (54 frames proposées) : Pied levé, gyrophare et ligne de l'amarre au sol.

Réponse : Traverser sous le bras levé, éviter la ligne puis endommager le second contacteur. Récupération proposée : 42 frames.

#### Mode manuel — seuil proposé 33 %

Ses pinces restent désynchronisées ; deux attaques alternées exposent le noyau entre elles.

Annonce (36 frames proposées) : Une pince blanche puis l'autre orange avec deux sons distincts.

Réponse : Lire l'ordre et frapper le noyau seulement dans la fenêtre centrale. Récupération proposée : 54 frames.

Résolution : Transpondeur original et journal de réaffectation du pont.

Limite de lore : La machine obéit à des routines ; elle ne discute pas de morale ni ne choisit d'enlever des personnes.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_08 — Neven Saal

**Drell · nacre_stage_08**

Courtier de témoignages qui vend la même preuve à plusieurs acheteurs.

Visuel : Col haut ouvert sur le cou nervuré, manteau mat étroit et petits dispositifs acoustiques au poignet.

Signature : Séparer une fausse silhouette de l'attaquant réel par ses appuis et son son.

Point faible : Un générateur de leurres unique, visible à chaque apparition réelle.

#### Déposition — seuil proposé 100 %

Projette une silhouette passive puis se déplace derrière un écran acoustique.

Annonce (36 frames proposées) : Seul le vrai corps projette une ombre nette et fait vibrer le sol.

Réponse : Viser l'ombre et attendre sa récupération après le déplacement. Récupération proposée : 36 frames.

#### Témoin contradictoire — seuil proposé 66 %

Alterne deux leurres sans dégâts et une salve réelle précédée d'un pas audible.

Annonce (42 frames proposées) : La salve réelle porte toujours le même signal sonore et une icône de visée.

Réponse : Garder face au vrai pas ; réduire les leurres dans l'option de lisibilité n'altère pas la difficulté temporelle. Récupération proposée : 42 frames.

#### Hors procès-verbal — seuil proposé 33 %

Désactive les leurres et tente deux frappes rapides suivies d'une sortie longue.

Annonce (24 frames proposées) : Extinction du générateur puis éclair bref de son outil physique.

Réponse : Bloquer la paire, intercepter sa sortie ou punir son retour. Récupération proposée : 48 frames.

Résolution : Témoignage enregistré sous protection et clé du coffre de garanties.

Limite de lore : Les leurres sont des projections d'équipement ; sa mémoire ne devient pas une illusion télépathique.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_09 — Talin Rorr

**Volus · nacre_stage_09**

Garant des dépôts qui refuse de reconnaître les quittances déjà payées.

Visuel : Combinaison de pression brun nacré, respirateur protégé et petits émetteurs fixés à un cadre dorsal indépendant.

Signature : Gérer un budget de protection partagé entre le boss et ses deux émetteurs.

Point faible : Chaque recharge désactive temporairement la protection de l'émetteur source.

#### Provision — seuil proposé 100 %

Protège un émetteur puis l'autre et tire une salve de dissuasion entre les cycles.

Annonce (48 frames proposées) : Liaisons cyan et jauge segmentée sur le générateur actif.

Réponse : Frapper le générateur découvert ; les dégâts de corps restent possibles dans les fenêtres. Récupération proposée : 36 frames.

#### Intérêts composés — seuil proposé 66 %

Transfère la protection d'un émetteur à un garant mobile auxiliaire.

Annonce (42 frames proposées) : Le câble d'énergie change de destination avant toute attaque.

Réponse : Rompre le soutien, éliminer l'auxiliaire puis exploiter le budget épuisé. Récupération proposée : 42 frames.

#### Solde négatif — seuil proposé 33 %

Le cadre passe en refroidissement et le boss tente de rejoindre un contacteur de fuite.

Annonce (36 frames proposées) : Valve externe du cadre et chemin de fuite affiché.

Réponse : Intercepter la fuite ou couper le contacteur ; le KO désarme le cadre sans ouvrir la combinaison. Récupération proposée : 54 frames.

Résolution : Quittances et réserve d'indemnisation locale sous séquestre.

Limite de lore : Aucun retrait de casque, dépressurisation punitive ou souffle surnaturel ; déplacements courts et lourds.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_10 — Barud

**Elcor · nacre_stage_10**

Doyen du tri qui croit que le verrouillage protège les stocks d'une émeute fabriquée.

Visuel : Elcor quadrupède massif au harnais de levage crème, deux projecteurs dorsaux et grande plaque de protection de fret.

Signature : Affrontement de position où l'on désarme un harnais sans renverser le personnage.

Point faible : Connecteurs du harnais visibles sur les flancs lors de chaque rotation.

#### Avec fermeté : accès fermé — seuil proposé 100 %

Avance lentement avec la plaque de fret et pousse sur une courte distance.

Annonce (54 frames proposées) : Intention sous-titrée et vérins qui se déploient avant l'avance.

Réponse : Contourner pendant le pivot puis neutraliser un connecteur. Récupération proposée : 42 frames.

#### Avec doute : ordre maintenu — seuil proposé 66 %

Le harnais ouvre des pinces latérales et déplace une palette devant lui.

Annonce (60 frames proposées) : Deux pinces se lèvent ; le trajet de palette reste marqué.

Réponse : Faire passer la palette puis frapper le connecteur qui l'alimente. Récupération proposée : 48 frames.

#### Avec résolution : vérification — seuil proposé 33 %

Arrête les renforts, mais le dernier automate de son harnais continue un cycle de poussée.

Annonce (48 frames proposées) : Barud annonce l'arrêt tandis que le module clignote en désaccord.

Réponse : Détruire le module autonome ou soutenir l'interruption ; victoire par désarmement. Récupération proposée : 60 frames.

Résolution : Stocks libérés et témoignage volontaire sur la chaîne d'ordres.

Limite de lore : Pas de bonds ni de coups de poing humains ; la voix annonce les intentions sans caricature comique.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_11 — Foreuse M4 — Espace clos

**Machine minière originale · nacre_stage_11**

Routine de purge déclenchée pour effacer les pesées de minerai.

Visuel : Foreuse sur deux bogies, grande tête annulaire et panneau de contrôle latéral ; jaune mat, acier nu et conduites épaisses.

Signature : Désamorcer une machine qui attaque par sa zone de travail et non par des armes gratuites.

Point faible : Trois alimentations mécaniques exposées selon le cycle.

#### Avance de taille — seuil proposé 100 %

La tête fore une bande basse puis s'immobilise pour évacuer les déblais.

Annonce (60 frames proposées) : Rotation croissante et vibration du sol avant le trait annoncé.

Réponse : Rester hors de la bande puis frapper le module d'alimentation découvert. Récupération proposée : 48 frames.

#### Débourrage — seuil proposé 66 %

Projette des fragments visibles dans deux arcs fixes et déplace un bogie.

Annonce (54 frames proposées) : Deux arcs se dessinent au sol ; une zone centrale reste accessible.

Réponse : Rejoindre l'ouverture et neutraliser le moteur du bogie. Récupération proposée : 48 frames.

#### Coupure de sécurité — seuil proposé 33 %

Le rotor ralentit mais deux bras essaient de reconnecter la puissance.

Annonce (48 frames proposées) : Bras qui s'allument avant de se brancher, un par un.

Réponse : Interrompre les deux raccordements puis actionner le contacteur ; aucune arme spécifique exigée. Récupération proposée : 60 frames.

Résolution : Journal brut des pesées et navette vers la déconstruction.

Limite de lore : La foreuse ne saute pas, ne tire pas de missiles et ne manipule pas l'élément zéro comme un pouvoir magique.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_12 — Grue GM-9 — Dernière prise

**Grue de déconstruction originale · nacre_stage_12**

Machine pilotée à distance pour écraser l'épave qui prouve un détournement.

Visuel : Mât hors plan jouable, long bras segmenté, pince double et contrepoids visibles ; le boss est cadré comme une machine de chantier.

Signature : Attaquer des composants accessibles pendant les oscillations d'une pince pendulaire.

Point faible : Pince, palan et boîtier d'orientation ont des fenêtres distinctes.

#### Descente de pince — seuil proposé 100 %

La pince descend sur une zone fixe puis se referme avant de remonter.

Annonce (60 frames proposées) : Ombre de contact grandissante, câble vertical et alarme lente.

Réponse : Quitter la zone puis frapper la charnière lorsque la pince est basse. Récupération proposée : 48 frames.

#### Balancement — seuil proposé 66 %

Déplace une pièce de coque dans un arc large avec un point bas prévisible.

Annonce (66 frames proposées) : Câble incliné et points d'impact matérialisés avant le mouvement.

Réponse : Passer après le point bas et attaquer le boîtier d'orientation. Récupération proposée : 54 frames.

#### Charge libérée — seuil proposé 33 %

Pose la coque hors arène puis tente deux reprises à vide plus rapides.

Annonce (42 frames proposées) : Aucune masse invisible ; la pince ouverte reste à l'écran.

Réponse : Éviter les deux prises puis neutraliser le palan mis en défaut. Récupération proposée : 66 frames.

Résolution : Enregistreur de l'épave et ordre de destruction signé.

Limite de lore : Toutes les pièces mobiles ont un asset propre ; pas de combat impossible contre un mât hors de portée.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_13 — Myra Nenn

**Humaine · nacre_stage_13**

Responsable d'approvisionnement qui provoque des pertes pour créer des contrats de secours rentables.

Visuel : Combinaison agricole renforcée vert sombre, épaules souples, grand filtre de travail et petite cape de pluie courte attachée.

Signature : Désamorçage de charges de service pendant un duel mobile.

Point faible : Chaque pose de charge l'oblige à rester immobile et visible.

#### Perte déclarée — seuil proposé 100 %

Pose une charge de dépressurisation factice sur un bac puis tire pour protéger le déclencheur.

Annonce (54 frames proposées) : Capsule bien visible, bip lent et cercle de portée limité.

Réponse : Désamorcer ou sortir de la zone ; les cultures du fond ne deviennent pas une barrière mortelle. Récupération proposée : 36 frames.

#### Plan de secours — seuil proposé 66 %

Pose deux capsules thermiques avec un ordre de déclenchement fixe.

Annonce (48 frames proposées) : Numéros 1 et 2 lisibles, clignotements et sons différents.

Réponse : Éteindre la première puis attaquer Myra pendant qu'elle réarme la seconde. Récupération proposée : 42 frames.

#### Pertes non couvertes — seuil proposé 33 %

N'a plus de charges et utilise un jet bref de refroidissement suivi d'une fuite.

Annonce (36 frames proposées) : Valve du pulvérisateur puis point de fuite indiqué par sa posture.

Réponse : Franchir le jet après sa coupure et empêcher le départ avec une attaque normale. Récupération proposée : 54 frames.

Résolution : Comptabilité des denrées et route du cargo Lest Gris.

Limite de lore : La manipulation des stocks est un crime local ; aucune plante canon n'est mutée en monstre pour justifier le combat.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_14 — Cercle des verrous

**Système VI original de sûreté · nacre_stage_14**

Réseau de portes qui applique l'ordre falsifié de retenir toute personne non facturée.

Visuel : Un noyau fixe, trois nœuds muraux et deux drones de commande ; chaque unité a une silhouette et un asset distincts.

Signature : Résoudre l'ordre des nœuds tout en gérant des lignes de tir bornées.

Point faible : Le nœud actif expose son alimentation avant d'ordonner une porte.

#### Accès classé — seuil proposé 100 %

Ouvre un seul nœud et actionne une porte, pendant qu'un drone désigne la voie.

Annonce (54 frames proposées) : Numéro de nœud affiché sur la porte et le noyau.

Réponse : Détruire le nœud portant le même numéro ou interrompre le drone. Récupération proposée : 42 frames.

#### Chaîne de garde — seuil proposé 66 %

Active deux nœuds successifs, jamais simultanés, et ajoute une tourelle à salves lentes.

Annonce (60 frames proposées) : Séquence entière annoncée ; la tourelle vise avant d'ouvrir le feu.

Réponse : Suivre l'ordre et utiliser les temps de porte pour traverser. Récupération proposée : 48 frames.

#### Autorisation manuelle — seuil proposé 33 %

Les nœuds sont inertes ; le noyau répète une procédure de fermeture à deux bras.

Annonce (42 frames proposées) : Bras alternés, contacteur central et avertissement constant.

Réponse : Frapper le contacteur entre les bras ; victoire par mise hors tension. Récupération proposée : 60 frames.

Résolution : Ordre d'escale réel et preuve de la modification du logiciel de sûreté.

Limite de lore : La VI n'est pas consciente ; le scénario attribue la fraude aux personnes qui ont changé ses consignes.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_15 — Murène-2

**Robot d'inspection original · nacre_stage_15**

Robot de canalisation détourné pour sectionner les liaisons du cargo.

Visuel : Corps long articulé à six segments, pince de service et petite tête capteur ; roule dans un rail de maintenance au bord de la passerelle.

Signature : Suivre l'ordre des segments et interrompre une coupure de câble.

Point faible : Deux segments d'alimentation restent visibles après chaque déploiement.

#### Inspection — seuil proposé 100 %

Déploie trois segments le long de la passerelle puis pince une zone délimitée.

Annonce (48 frames proposées) : Segments qui s'allument de l'arrière vers la tête.

Réponse : Laisser passer la tête puis frapper le segment lumineux exposé. Récupération proposée : 42 frames.

#### Tronçonnage — seuil proposé 66 %

Se fixe à un câble et balaye lentement avec son outil de coupe court.

Annonce (54 frames proposées) : Câble ciblé hachuré et torche qui chauffe avant de s'allumer.

Réponse : Interrompre l'ancrage ou traverser derrière la tête après le balayage. Récupération proposée : 48 frames.

#### Retour au rail — seuil proposé 33 %

Tente un retrait segment par segment et déclenche une dernière impulsion locale.

Annonce (42 frames proposées) : Ordre de retrait visible, cercle limité autour du segment final.

Réponse : Attaquer le segment final après l'impulsion pour provoquer l'arrêt d'urgence. Récupération proposée : 60 frames.

Résolution : Liaison de détresse restaurée et retour sécurisé vers Nacre.

Limite de lore : Il s'agit d'une machine d'inspection, pas d'une espèce extraterrestre ou d'un corps synthétique conscient.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_16 — Severa Dhal

**Asari · nacre_stage_16**

Cheffe d'une société de sûreté liée au stock de combinaisons retenues.

Visuel : Combinaison de protection ivoire et bleu, bande frontale utilitaire et grandes attaches de harnais, sans cape de Justicar.

Signature : Enchaîner maintien biotique et défense d'un stock d'équipements.

Point faible : La protection des casiers retire des ressources à sa barrière personnelle.

#### Bien retenu — seuil proposé 100 %

Protège un casier et utilise des poussées courtes pour garder ses distances.

Annonce (36 frames proposées) : Un lien visible vers le casier et une main réservée à la poussée.

Réponse : Approcher du côté opposé au lien ; interrompre après la poussée. Récupération proposée : 36 frames.

#### Droit d'usage — seuil proposé 66 %

Déplace deux supports de combinaison vides pour former des obstacles temporaires.

Annonce (54 frames proposées) : Ombres de placement et pose lente, aucune collision pendant la lévitation.

Réponse : Traverser avant la pose ou briser un support ; le chemin ne se ferme jamais totalement. Récupération proposée : 42 frames.

#### Résiliation — seuil proposé 33 %

Rappelle sa protection et lance une série courte de projections, puis épuise son maintien.

Annonce (42 frames proposées) : Effet biotique qui se concentre autour du bras, puis trois impulsions espacées.

Réponse : Changer de garde et punir la récupération ; pas de contrôle infini en coin. Récupération proposée : 54 frames.

Résolution : Contrats de restitution et libération des équipements saisis.

Limite de lore : Severa n'est ni une Justicar ni une Ardat-Yakshi ; sa spécialité est un entraînement biotique original.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_17 — Iven Marr

**Humain · nacre_stage_17**

Cryotechnicien qui accepte de rationner les quais afin de favoriser un départ privé.

Visuel : Armure de maintenance épaisse, casque à visière fumée et cartouches de refroidissement fixées au dos.

Signature : Jouer autour d'un budget thermique mesurable sans geler tout le personnage.

Point faible : Cartouche éjectée à chaque surchauffe du projecteur.

#### Circuit fermé — seuil proposé 100 %

Projette une capsule de refroidissement qui crée une petite zone de sol ralentie.

Annonce (42 frames proposées) : Capsule bleue distincte du signal de visée ; zone annoncée au point d'impact.

Réponse : Esquiver la capsule puis approcher par le bord non refroidi. Récupération proposée : 36 frames.

#### Dérivation — seuil proposé 66 %

Récupère une cartouche au répartiteur en activant deux soupapes en alternance.

Annonce (54 frames proposées) : Soupape numérotée, jauge de pression et son de valve.

Réponse : Couper le distributeur ou le frapper pendant le prélèvement. Récupération proposée : 42 frames.

#### Rupture de charge — seuil proposé 33 %

Son équipement surchauffe ; il alterne un jet très court et une tentative de fuite latérale.

Annonce (30 frames proposées) : Lumière blanche de température puis baisse visible du débit.

Réponse : Garder hors du jet et punir la fuite pendant l'éjection finale. Récupération proposée : 54 frames.

Résolution : Contrôle thermique rétabli et budget de départ des navettes.

Limite de lore : Le refroidissement vient de matériel et de consommables ; il ne fige pas le temps, la biologie ou tout le décor.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_18 — Raddak Norek

**Batarien · nacre_stage_18**

Intercepteur chargé de garder les témoignages à l'intérieur du réseau du Concordat.

Visuel : Quatre yeux, long col de protection, deux petites antennes au dos et bottes lourdes de coursive.

Signature : Empêcher un brouillage ciblé tout en lisant deux types de projectile.

Point faible : Antenne portée exposée lorsqu'il transmet l'ordre de brouillage.

#### Canal privé — seuil proposé 100 %

Tire une salve cinétique puis prépare un brouillage de soutien.

Annonce (36 frames proposées) : Salve blanche fine ; brouillage annoncé par antenne qui se déploie.

Réponse : Bloquer la salve et interrompre le déploiement ; les commandes de base restent disponibles. Récupération proposée : 36 frames.

#### Embargo local — seuil proposé 66 %

Pose un relais de brouillage et tire des capsules de fumée sur deux zones annoncées.

Annonce (48 frames proposées) : Relais relié par une ligne claire ; fumée à contours limités.

Réponse : Détruire le relais et garder le boss hors de la fumée. Récupération proposée : 42 frames.

#### Dernière fréquence — seuil proposé 33 %

Rappelle le relais en un seul émetteur puissant mais immobile.

Annonce (54 frames proposées) : Antenne brillante, avertissement sonore et fenêtre de transmission visible.

Réponse : Contourner son cône puis neutraliser l'émetteur avant le prochain cycle. Récupération proposée : 60 frames.

Résolution : Canal externe ouvert et diffusion des témoignages conservés.

Limite de lore : Brouiller un lien ne supprime pas les pensées ou les pouvoirs biotiques ; aucun vrai relais cosmodésique portable.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_19 — Veshan Prax

**Turien · nacre_stage_19**

Régulateur de sécurité qui signe les validations finales du Concordat.

Visuel : Armure de cadre sévère graphite et cuivre, manteau court rigide, visière escamotable et crête turienne intacte.

Signature : Alterner un duel discipliné et une défense active des preuves.

Point faible : Clé physique qu'il doit insérer pour valider chaque effacement.

#### Lecture seule — seuil proposé 100 %

Contrôle le centre avec crosse et salves courtes, puis vérifie un terminal.

Annonce (30 frames proposées) : Crosse annoncée par prise à deux mains ; vérification par clé sortie.

Réponse : Garder la pression courte puis interrompre la vérification. Récupération proposée : 36 frames.

#### Purge signée — seuil proposé 66 %

Ouvre un effacement en trois segments et déploie une tourelle de protection.

Annonce (60 frames proposées) : Chaque segment s'allume dans l'ordre ; une jauge montre le délai restant.

Réponse : Interrompre le terminal ou désactiver la tourelle puis reprendre l'accès ; une erreur n'efface pas tout le dossier. Récupération proposée : 48 frames.

#### Autorité révoquée — seuil proposé 33 %

Perd ses soutiens et tente une feinte de salve suivie d'une prise défensive.

Annonce (36 frames proposées) : La salve feinte n'a aucun projectile ; main ouverte visible avant la prise.

Réponse : Retarder l'approche, faire rater la prise et punir la récupération. Récupération proposée : 54 frames.

Résolution : Chaîne des signatures et autorisation locale d'embarquement.

Limite de lore : Il ne représente pas la Hiérarchie turienne ; ses pouvoirs viennent uniquement de son contrat et de son équipement.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

### nacre_boss_20 — Elyne Korda

**Humaine · nacre_stage_20**

Directrice logistique du Concordat des Quais ; elle tente de sauver son contrôle des départs en détruisant les dernières preuves.

Visuel : Combinaison d'officière civile anthracite, gants clairs et cadre de commandement relié physiquement aux bras du quai ; visage visible et pas d'armure N7.

Signature : Boss final de commandement qui perd progressivement ses dispositifs puis affronte les conséquences de ses choix.

Point faible : Contrôle manuel des bras obligeant à exposer le siège de commande ; la victoire ne dépend pas d'un pouvoir spécifique.

#### Priorité contractuelle — seuil proposé 100 %

Depuis le cadre de commandement, ferme une rampe puis ordonne à deux drones une trajectoire alternée.

Annonce (60 frames proposées) : Numéro de rampe, bras extérieur visible et deux lignes de vol affichées successivement.

Réponse : Neutraliser le contacteur de rampe et attaquer pendant qu'elle réarme les drones. Récupération proposée : 48 frames.

#### Abandon d'actifs — seuil proposé 66 %

Tente de couper un convoi de sa preuve en déplaçant un obstacle de quai et une pince.

Annonce (66 frames proposées) : Obstacle lent, pince sur un axe séparé, zone sûre indiquée par balises fixes.

Réponse : Arrêter la pince ou détruire son alimentation ; l'évacuation progresse par jalons, pas par victimes perdues au hasard. Récupération proposée : 54 frames.

#### Mainlevée — seuil proposé 33 %

Le cadre est hors service ; Korda utilise son arme de poing et tente de rejoindre le commutateur de destruction des preuves.

Annonce (36 frames proposées) : Arme basse avant la salve ; course vers le commutateur visible et bornée.

Réponse : Garder la salve et intercepter le trajet ; victoire par désarmement et sécurisation du commutateur. Récupération proposée : 66 frames.

Résolution : Évacuation terminée, dossier préservé selon les objectifs réussis et épilogue local propre au combattant.

Limite de lore : La direction n'est ni Cerberus ni un agent des Moissonneurs révélé au dernier moment ; le récit reste un drame logistique original.

Production : corps/châssis, pièces mobiles, portrait, introduction, poses, transitions et effets séparés encore à réaliser. Boss d'histoire/défi ; aucune disponibilité en versus classé supposée.

## 20 props décomposés

Les pièces ci-dessous sont des demandes de fichiers individuels ; aucun assemblage n'est accepté en remplacement des parties mobiles.

| ID et prop | Brief | Pièces séparées | États |
|---|---|---|---|
| nacre_prop_01 — Borne de caution | Borne de contrôle à base lourde, écran de quittance étroit et tiroir physique. | corps, tiroir, écran holographique, volet de coupure | consulter / verrouillée / désactivée |
| nacre_prop_02 — Comptoir des transitaires | Comptoir compact en métal clair, tablette de dépôt et volet enroulable. | socle, volet, tablette, hologramme de lot | ouvert / fermé / sous scellé |
| nacre_prop_03 — Module de triage | Chariot médical fermé, lecteur de dossier et boîtier de cartouches stériles. | châssis, roues, bras lecteur, écran, tiroir | veille / diagnostic / verrouillé |
| nacre_prop_04 — Casier de preuve | Coffre de tri vertical doté de six emplacements et d'un verrou physique. | corps, porte, verrou, cartouche de preuve | fermé / ouvert / preuve retirée |
| nacre_prop_05 — Treuil de cale | Tambour de service fixé au sol avec câble et crochet industriel. | base, tambour, câble segment, crochet, capot | repos / tension / bloqué |
| nacre_prop_06 — Kiosque des contrats | Borne semi-circulaire avec trois surfaces de lecture et petite cache d'archives. | socle, panneaux, cache, lecteur | public / privé / preuve copiée |
| nacre_prop_07 — Amarre télescopique | Poutre de dock à collier, trois segments et pince de verrouillage. | embase, segment fixe, segment médian, segment mobile, pince gauche, pince droite | rétractée / étendue / verrouillée |
| nacre_prop_08 — Banc acoustique | Banc bas en céramique mate avec écrans de séparation orientables. | banc, écran gauche, écran droit, émetteur acoustique | ouvert / confidentialité / hors service |
| nacre_prop_09 — Coffre de garantie | Capsule de dépôt cuivre et graphite avec couronne de fermeture et deux verrous. | socle, capsule, couronne, verrou A, verrou B, interface | scellé / contrôle / ouvert |
| nacre_prop_10 — Séparateur de vivres | Module de tri à deux voies bien marquées et caisse de rations opaque. | châssis, bande A, bande B, bras de tri, caisse | tri / arrêt / manuel |
| nacre_prop_11 — Chariot de minerai | Châssis bas blindé avec plateau, bogies et benne amovible. | châssis, bogie avant, bogie arrière, benne, charge minérale | chargé / vide / bloqué |
| nacre_prop_12 — Presse de déconstruction | Portique industriel à mâchoires épaisses et plateau renforcé. | portique, mâchoire haute, mâchoire basse, vérin, panneau | ouvert / compression / arrêt sécurité |
| nacre_prop_13 — Bac hydroponique | Bac fermé à plantes basses et tuyaux translucides de service. | bac, plantation, couvercle, bras d'irrigation, tuyau | cultivé / maintenance / isolé |
| nacre_prop_14 — Conteneur du Lest Gris | Conteneur court à serrure de transit, panneaux rayés et points de levage nets. | caisson, porte gauche, porte droite, serrure, étiquette de lot | fermé / ouvert / retenu |
| nacre_prop_15 — Vanne de ballast | Vanne de service à grande roue, deux conduites et boîtier de pression. | corps, roue, tige, jauge, panache de vapeur | fermée / purge / arrêt |
| nacre_prop_16 — Cabine de combinaison | Station de diagnostic hermétique derrière une vitre avec bras de support. | cabine, porte, bras gauche, bras droit, support vide, écran | fermée / réparation / équipement rendu |
| nacre_prop_17 — Cartouche thermique | Module cylindrique de refroidissement, poignée rabattable et deux contacts protégés. | cartouche, poignée, capuchon, joint lumineux | pleine / chaude / éjectée |
| nacre_prop_18 — Antenne de témoignage | Antenne civile sur pied robuste, parabole orientable et coffre de communication. | pied, axe, parabole, récepteur, coffre | écoute / diffusion / brouillée |
| nacre_prop_19 — Registre isolé | Lecteur d'archives avec cartouche matérielle, capot et deux voyants de validation. | socle, capot, cartouche, clé, écran | lecture / copie / purge interrompue |
| nacre_prop_20 — Rampe d'évacuation | Rampe civile courte et large, garde-corps repliables et balises à socle. | rampe, charnière, garde-corps gauche, garde-corps droit, balise, barrière | relevée / prête / embarquement terminé |

### Pivots et contraintes

- **nacre_prop_01** : Tiroir sur glissière ; écran en calque transparent indépendant. Aucun texte complet dans le dessin ; les contrats restent du texte localisable de l'interface.
- **nacre_prop_02** : Volet sur axe supérieur ; tablette à translation verticale courte. Pas de nouveau logo canon ; sceau du Concordat original sur calque distinct.
- **nacre_prop_03** : Roues et bras orientable séparés ; pas de patient incorporé au prop. Le dispositif ne fournit pas de soin illimité en versus.
- **nacre_prop_04** : Porte sur charnière ; cartouche extractible gardant la même identité. La preuve obtenue possède un identifiant persistant ; ouvrir à nouveau ne la duplique pas.
- **nacre_prop_05** : Pivot du tambour documenté ; câble répétable et crochet détaché du bras porteur. Le câble ne doit pas être peint avec une longueur définitive dans le sprite du boss.
- **nacre_prop_06** : Panneaux inclinables autour d'un axe latéral commun. La copie de preuve est une action scénarisée et non une mutation du catalogue canon.
- **nacre_prop_07** : Tous les segments à ancrage commun ; pince gauche et droite indépendantes. Désactivée mécaniquement en compétitif même si le décor conserve une animation lointaine.
- **nacre_prop_08** : Pivots des écrans à leur bord inférieur ; aucun visage dans la texture. Les écrans n'effacent jamais les indicateurs d'attaque pour le joueur.
- **nacre_prop_09** : Couronne en rotation lente ; verrous en translation indépendante. Pas de chambre d'atmosphère volus ouvrable comme piège de combat.
- **nacre_prop_10** : Bandes animées séparées ; bras sur pivot fixe ; caisse réutilisable comme objet. Le texte alimentaire reste une donnée d'interface ; aucune espèce n'est réduite à une couleur de caisse.
- **nacre_prop_11** : Benne sur axe arrière ; charge séparée sans dispersion aléatoire nuisible. Aucun minerai n'est présenté comme un canon nouveau d'élément zéro.
- **nacre_prop_12** : Mâchoires à translation opposée ; vérin visible pour rendre la phase lisible. La zone de dommage est calculée par le gameplay et non déduite des éclats de la texture.
- **nacre_prop_13** : Couvercle sur charnière ; tuyau et bras détachés pour animation. Les plantes sont décoratives ; pas de champ de dégâts permanent peint sur le sol.
- **nacre_prop_14** : Deux pivots de porte ; étiquette générée par l'interface sur un plan propre. Ne pas fusionner le conteneur avec un drone ou une pince dans le même master.
- **nacre_prop_15** : Roue centrée et séparée ; vapeur référencée comme FX, pas intégrée au métal. La galerie reste sèche et respirable ; pas de mort automatique par noyade.
- **nacre_prop_16** : Porte sur glissière ; bras indépendants ; vêtements et personnages à produire séparément. Différencier pièces quarianes et volus ; ne pas utiliser un même casque pour les deux.
- **nacre_prop_17** : Poignée pivotante ; capuchon extractible dans le sens du module. La cartouche a une fin d'usage ; aucun réarmement infini sans cooldown ou interaction explicite.
- **nacre_prop_18** : Deux pivots documentés ; câble au coffre séparé. Matériel de communication locale ; aucune fonction de relais cosmodésique ou de téléportation.
- **nacre_prop_19** : Clé et cartouche extractibles ; écran avec masque propre pour textes localisés. Les choix de sauvegarde protègent le dossier déjà acquis ; reprise sans duplication des récompenses.
- **nacre_prop_20** : Rampe sur axe bas ; garde-corps indépendants ; barrière mobile séparée des civils. En versus, état fixe et aucune chute ; les civils appartiennent à des scènes distinctes.

## 20 familles de projectiles et VFX

Chaque famille possède des phases distinctes et des attaches explicites. Une image d'impact ne compte pas comme un projectile complet ; un effet éclairé n'ajoute pas de dégâts sans événement mécanique. Toutes les familles sont à produire avec alpha réel.

### nacre_fx_01 — Trace d'accélérateur

Trait blanc très bref avec noyau pâle ; jamais un long rayon rouge permanent.

Phases : départ → trace → impact → dissipation.

Règle : Le tir logique applique les dégâts une fois ; la trace visuelle ne multiplie pas les impacts.

Attaches : Origine au canon, direction horizontale ; côté opposé à produire sans retourner les inscriptions de l'arme.

Audio à produire : court et sec, sans emprunt d'un fichier audio officiel.

### nacre_fx_02 — Gerbe cinétique courte

Une particule métallique/trace par fichier ; les trajectoires sont assemblées par le moteur.

Phases : départ → particule → impact → dissipation.

Règle : Nombre de particules, angle et dommage total plafonnés ; pas de tirages hors écran.

Attaches : Point d'émission unique ; spread mécanique défini en données, pas dessiné dans le corps.

Audio à produire : salve grave suivie d'un souffle bref.

### nacre_fx_03 — Flamme de bouche

Éclair court blanc-jaune, limité en surface, avec une variante de haute lisibilité.

Phases : allumage → pic → extinction.

Règle : Aucun volume de dommage autonome ; l'éclair suit l'événement de tir.

Attaches : Pivot au bout du canon ; calque derrière la ligne de lecture des mains.

Audio à produire : synchronisé avec le tir, sans doubler son volume.

### nacre_fx_04 — Arc de surcharge

Arc électrique cyan segmenté, point de départ et de contact séparés.

Phases : charge → liaison → contact → retombée.

Règle : Effet borné à la cible et à la portée validées ; ne saute pas implicitement aux civils ni à tout le décor.

Attaches : Extrémités fournies par les attaches ; conserver le corps et l'arc dans des fichiers distincts.

Audio à produire : grésillement court et rupture sèche.

### nacre_fx_05 — Impulsion biotique

Déformation bleu-violet ramassée et filaments discrets ; pas de portail ou de magie runique.

Phases : préparation → libération → contact → dissipation.

Règle : Le contrôle de cible est limité et résisté par les règles de combat ; aucune boucle infinie.

Attaches : Main émettrice comme pivot ; volume d'impact indépendant de la taille lumineuse.

Audio à produire : montée grave et déplacement d'air bref.

### nacre_fx_06 — Ride de barrière

Ondulation cyan localisée autour de la zone touchée, laissant le corps visible.

Phases : contact → étalement → affaiblissement → extinction.

Règle : Pure lecture de bouclier ; le statut mécanique n'est pas déterminé par l'opacité du dessin.

Attaches : Point d'impact sur la coque ou l'armure ; taille adaptée à l'hôte par données.

Audio à produire : claquement mat et résonance courte.

### nacre_fx_07 — Recharge d'émetteur

Courtes bandes cyan concentriques sur un module externe ; pas de guérison organique représentée.

Phases : mise en lien → transfert → fin de charge → refroidissement.

Règle : Réserve et cooldown finis ; un lien cassé ne continue pas à recharger sans source.

Attaches : Deux attaches définies pour source et destinataire, plus effet local de fin.

Audio à produire : tic de connexion puis ronflement contenu.

### nacre_fx_08 — Capsule de refroidissement

Petite capsule industrielle opaque avec un voyant bleu, sans texte incrusté.

Phases : éjection → vol → contact → coque inerte.

Règle : Une collision utile seulement ; le rebond éventuel exige une règle explicite.

Attaches : Pivot au centre de masse de la capsule ; traînée séparée facultative.

Audio à produire : souffle propulsif et claquement plastique.

### nacre_fx_09 — Cristallisation locale

Aiguilles de givre courtes et vapeur froide dans une petite zone ; pieds et contours restent lisibles.

Phases : contact → croissance → maintien → fonte.

Règle : Ralentissement limité avec sortie visible ; jamais gel illimité ou terrain intégralement bloqué.

Attaches : Effet ancré au sol pour une capsule, au contact pour l'impact ; versions distinctes.

Audio à produire : crépitement fin et souffle de refroidissement.

### nacre_fx_10 — Trait de découpe

Point chaud blanc-orangé et trait très court de chalumeau avec arc nettement borné.

Phases : préchauffage → allumage → travail → coupure.

Règle : Collision uniquement pendant la fenêtre de travail ; portée jamais déduite d'un halo.

Attaches : Attache sur tête de soudure ; pas de rayon sortant des doigts du robot.

Audio à produire : sifflement de valve, crépitement bref, arrêt net.

### nacre_fx_11 — Jet thermique

Petit paquet de flamme orangée à bord doux ; un paquet par image, assemblage contrôlé.

Phases : flamme pilote → émission → contact → extinction.

Règle : Dégâts cadencés, pas un impact par particule visuelle ; longueur et durée maximales.

Attaches : Origine sur buse ; flamme séparée du réservoir et du corps.

Audio à produire : souffle court modulé, réduit dans les options audio.

### nacre_fx_12 — Écran de fumée

Volutes grises à bords délimités, cœur translucide et contour plus net en accessibilité.

Phases : amorce → déploiement → maintien → dispersion.

Règle : N'efface jamais les télégraphes, le HUD ni les silhouettes nécessaires à une parade.

Attaches : Centre de volume au sol ; densité minimale configurée pour le mode compétitif.

Audio à produire : petite détonation sourde puis souffle.

### nacre_fx_13 — Cône de détection

Faisceau pâle quadrillé avec contour et icône ; information lisible sans dépendre du rouge/vert.

Phases : balayage → verrouillage → validation → arrêt.

Règle : Pas de dégâts propres ; une attaque suit seulement après un délai annoncé.

Attaches : Pivot au capteur ; angle et portée limités par l'appareil.

Audio à produire : deux tons de recherche puis bip de validation.

### nacre_fx_14 — Décharge de contact

Petit anneau électrique blanc-cyan et arcs courts autour du point de contact.

Phases : charge → décharge → résidu → extinction.

Règle : Durée de contrôle plafonnée ; protection contre les relances consécutives.

Attaches : Attache sur gantelet ou module ; victime et arcs restent deux assets.

Audio à produire : claquement électrique distinct de l'arc longue portée.

### nacre_fx_15 — Balise à impulsion

Petit pied triangulaire et capuchon lumineux détaché, anneau au sol séparé.

Phases : pose → armement → impulsion → désarmement.

Règle : Maximum deux balises par opérateur ; suppression à la fin de la rencontre et délai avant armement.

Attaches : Pied au sol ; halo indépendant et ne constituant pas la seule indication de danger.

Audio à produire : clic de pose, bip régulier puis impulsion.

### nacre_fx_16 — Grappin de fret

Crochet magnétique compact, câble modulaire sombre et halo d'ancrage discret.

Phases : lancement → vol → ancrage → rappel.

Règle : Vise l'objet explicitement sélectionné ; le câble ne crée pas une force continue après interruption du porteur.

Attaches : Crochet, segment de câble et ancrage en fichiers séparés ; pivots mesurés au point d'attache.

Audio à produire : départ de piston, tension puis rembobinage.

### nacre_fx_17 — Éclats de tôle

Un éclat industriel par fichier, bords arrondis et brillance brève.

Phases : arrachement → vol → chute → repos.

Règle : Décoratif par défaut ; aucun dégât aléatoire ajouté à un impact déjà calculé.

Attaches : Pivot au centre de l'éclat ; trajectoire et rotation déterministes si utilisées.

Audio à produire : impact métallique léger et chute amortie.

### nacre_fx_18 — Purge de vapeur

Panache blanc semi-transparent, axe de sortie clair et zone d'expansion limitée.

Phases : pré-purge → jet → retombée → dissipation.

Règle : En histoire, danger seulement après annonce ; en compétitif effet purement visuel ou désactivé.

Attaches : Attache à la soupape ; contraste ajusté sans masquer le plan des pieds.

Audio à produire : sifflement progressif servant de télégraphe doublé visuellement.

### nacre_fx_19 — Ancrage de champ

Anneau au sol segmenté, texture hachurée et marque de direction claire.

Phases : désignation → stabilisation → action → effacement.

Règle : Un volume mécanique unique ; changement de couleur jamais seul signal de déclenchement.

Attaches : Ancrage au sol de l'arène ; aucun décor ou personnage incrusté.

Audio à produire : ton grave croissant puis coupure nette.

### nacre_fx_20 — Validation de preuve

Petits segments holographiques ambrés qui se referment sur un pictogramme de copie.

Phases : lecture → copie → validation → disparition.

Règle : Effet sans dégâts et sans récompense autonome ; une seule validation par identifiant de preuve.

Attaches : Attaché à l'écran du prop, texte ajouté par l'interface et non généré dans l'image.

Audio à produire : trois notes douces originales, confirmation également sous-titrée.

## Raccordements suggérés aux dix campagnes

Ces routes servent de proposition au fichier des combattants. Elles couvrent ensemble les vingt stages ; les rivalités entre jouables restent distinctes des boss locaux.

| Combattant | Route de stages | Objectif personnel | Boss personnels suggérés |
|---|---|---|---|
| nacre_mara_vey | 01, 02, 04, 06, 10, 12, 13, 20 | Retrouver les passagers du convoi Vey-17, admettre sa propre négligence et remplacer les promesses de sauvetage par une évacuation vérifiable. | 01, 13 |
| nacre_tavin_rhex | 01, 04, 06, 09, 12, 14, 19, 20 | Rendre les protocoles de sûreté à ceux qu’ils devaient protéger et identifier qui a détourné ses schémas de défense. | 06, 19 |
| nacre_ilyra_senn | 02, 03, 07, 08, 12, 16, 18, 20 | Retrouver les familles déplacées, préserver leurs choix et mettre les signataires face aux conséquences de leurs actes. | 02, 16 |
| nacre_keela_vess | 01, 05, 07, 11, 12, 14, 15, 20 | Démonter les serrures qu’elle a involontairement rendues fiables, puis rentrer avec une contribution dont elle connaît les usages. | 07, 14 |
| nacre_ghoran_brakk | 04, 05, 07, 10, 11, 12, 18, 20 | Sortir les équipes de la mine et récupérer les paies détournées sans laisser le consortium les diviser. | 05, 11 |
| nacre_neral_vesh | 02, 04, 08, 09, 13, 15, 18, 20 | Rétablir le fil des témoignages, protéger ceux qui veulent parler et cesser de confondre discrétion et neutralité. | 08, 13 |
| nacre_selek_dhan | 03, 05, 07, 11, 13, 14, 17, 20 | Empêcher la prochaine purge de dossiers et prouver la différence entre une erreur de maintenance et une fraude organisée. | 03, 14 |
| nacre_varek_hesk | 01, 04, 05, 08, 10, 12, 18, 20 | Obtenir la libération des travailleurs retenus et établir la chaîne des ordres au lieu de laisser les exécutants porter seuls la faute. | 04, 18 |
| nacre_dalo_ruun | 01, 03, 08, 09, 10, 13, 16, 20 | Rendre les garanties aux passagers, établir les faux et empêcher les créanciers de recouvrer deux fois une même obligation. | 09, 20 |
| nacre_nyra_korr | 02, 06, 10, 12, 15, 16, 19, 20 | Retrouver l’équipe disparue et laisser à Nacre des cartes d’évacuation dont les habitants possèdent eux-mêmes les clés. | 06, 19 |

Le boss final débloque une sortie ; les objectifs facultatifs enrichissent l'épilogue sans transformer toute erreur en mort imposée. Une issue locale n'exporte aucun changement vers les campagnes canons.

## Sources et frontières

Les pages de codex ci-dessous sont des transcriptions communautaires de textes des jeux, consultées le 27 novembre 2026 ; elles ne sont pas présentées comme de nouveaux écrits officiels. La publication EA est officielle. Ces références fondent les contraintes d'univers ; elles ne prouvent pas l'existence de Nacre ou des personnes créées ici.

- **nacre_source_terminus** — [Mass Effect, codex : Region — Terminus Systems](https://masseffectdb.wiki/mass-effect/codex/primary/planets-and-locations/region-terminus-systems) · transcription communautaire du codex du jeu. La région se situe hors de l'administration du Conseil ; les pouvoirs locaux sont fragmentés. Nacre et son consortium sont des inventions du projet.
- **nacre_source_mechs** — [Mass Effect 2, codex : Security Mechs](https://masseffectdb.wiki/mass-effect-2/codex/secondary/technology/security-mechs) · transcription communautaire du codex du jeu. Les mécas de sécurité existent ; leur VI reste limitée à des fonctions de sûreté. Les machines de Nacre reçoivent des routines préprogrammées, sans conscience ni stratégie politique.
- **nacre_source_armor** — [Mass Effect, codex : Body Armor](https://masseffectdb.wiki/mass-effect/codex/primary/weapons-armor-and-equipment/body-armor) · transcription communautaire du codex du jeu. Les protections combinent matériaux et barrières cinétiques ; les réserves de bouclier sont finies. Les variantes originales conservent cette logique.
- **nacre_source_biotics** — [Mass Effect 2, codex : Biotics](https://masseffectdb.wiki/mass-effect-2/codex/primary/technology/biotics) · transcription communautaire du codex du jeu. Les pouvoirs biotiques manipulent des champs de masse et demandent des aptitudes et un entraînement. Ils ne sont pas attribués par défaut à tous les habitants de Nacre.
- **nacre_source_volus** — [Mass Effect, codex : Volus](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/volus) · transcription communautaire du codex du jeu. Les volus emploient une combinaison de pression et un respirateur hors de leur atmosphère. Aucun combat ne leur retire ces protections pour fournir un avantage mécanique.
- **nacre_source_quarians** — [Mass Effect, codex : Quarians](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/quarians) · transcription communautaire du codex du jeu. La flotte nomade et le pèlerinage fournissent un cadre social possible. Les personnages quariens, leurs contrats et leurs combinaisons précis sont originaux ; aucune filiation canon n'est inventée.
- **nacre_source_elcor** — [Mass Effect, codex : Elcor](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/elcor) · transcription communautaire du codex du jeu. La silhouette quadrupède, la stabilité, les déplacements mesurés et les intentions explicitées à l'oral guident Barud. Son harnais de manutention est une invention locale.
- **nacre_source_omnitool** — [Mass Effect, codex : Omni-tool](https://masseffectdb.wiki/mass-effect/codex/primary/technology/omni-tool) · transcription communautaire du codex du jeu. L'outil combine calcul, analyse et fabrication de petits éléments. Réparer ou pirater exige un accès et du temps ; il ne fabrique pas une machine de plusieurs tonnes en combat.
- **nacre_source_vi** — [Mass Effect, codex : Computers — Virtual Intelligence](https://masseffectdb.wiki/mass-effect/codex/primary/technology/computers-virtual-intelligence-vi) · transcription communautaire du codex du jeu. La VI peut simuler une interaction et exécuter des tâches spécialisées sans être une personne consciente. Le système des verrous conserve une logique bornée et lisible.
- **nacre_source_calibrations** — [BioWare / EA : Gameplay Calibrations — Legendary Edition](https://www.ea.com/ea-play/news/gameplay-calibrations) · publication officielle BioWare / EA. Les jeux de la trilogie ont des comportements de combat distincts. Les règles du mode 2D sont documentées comme adaptations propres au projet, sans promettre une reproduction des moteurs originaux.

## État de production

Les cinq familles comptent chacune vingt fiches. Les cinq couches de chaque stage représentent cent assets prévus, pas cent images présentes. Les pièces de props et phases d'effets ont des identifiants de production et des chemins null. Les sources, IDs et associations sont vérifiés séparément dans le rapport de cohérence ; aucune exécution moteur, mesure d'équilibrage, animation ou revue artistique en jeu n'est déduite de cette vérification.

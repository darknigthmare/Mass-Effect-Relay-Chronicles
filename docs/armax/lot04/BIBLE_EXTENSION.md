# Mass Effect — Relay Chronicles
# Armax : bible d’extension du casting, lot 04

**État : conception spécifiée ; aucun gameplay Armax livré par cette bible.**

> **Association au guide général — 25 novembre 2026 :** la [bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md) complète les 30 rubriques communes et relie ces fiches aux [campagnes et scènes](../bible/CAMPAGNES_ET_SCENES.md). Le [contrat RC-ARMAX-0.1](../bible/common-rules.json) est la référence courante des règles communes, avec les arbitrages explicites vis-à-vis du complément Grunt/Legion. Les kits, noms, récits, valeurs spécifiques et preuves ci-dessous restent leur version historique ; aucune disponibilité jouable ni fidélité supplémentaire n’est déclarée.

Date de préparation : 19 novembre 2026, contexte Europe/Paris. Base examinée : `deb5c9382a697acd0cf72b182bc646337cdcfb25`. Source structurée : [fighters.json](fighters.json). Les fichiers réellement obtenus et leurs contrôles sont suivis par le manifeste de production du lot ; le chemin prévu d’une image ne prouve jamais son existence.

Le lot définit **14 sujets : dix candidats au Versus standard, trois profils de boss dont Bénézia à normaliser avant une éventuelle sélection Versus, et un soutien narratif, Eve**. Treize sujets reçoivent un kit de conception, soit 78 normaux, 39 spéciaux, treize prises, treize supers, treize finalisations sobres et 26 séquences. Les deux grands boss ont six phases au total. Ces nombres comptent des fiches et des intentions, pas des personnages déjà jouables. Pour l’Archonte, le kit décrit des commandes de dangers environnementaux et ne lui attribue pas une carrière de duelliste.

## 1. Reprise et périmètre réel

Le dépôt de base ne contient pas un mode Armax fonctionnel à étendre. Les conversations antérieures annonçaient des lots, notamment le lot 03 et un complément Grunt/Legion/Port Hanshan ; leurs octets n’ont pas été récupérés dans cette reprise. Le présent travail porte donc sa propre provenance et ne revendique pas la récupération de ces anciens fichiers. Un sujet déjà dessiné ailleurs dans le RPG peut manquer dans le format individuel latéral d’Armax : les anciens atlas, bustes et poses ATB ne sont pas une preuve de kit de combat 2D complet.

Les entrées de casting restent séparées par œuvre et période. Saren vivant ME1 n’est pas la forme squelettique finale ; Morinth civile n’est pas son imitation visuelle de Samara ; Anderson ME1 ne porte pas automatiquement sa tenue de guerre ME3. Randall est prévu dans la variante **casquée effectivement référencée**. Eve/Bakara remplace un nom « Rasa » non corroboré pendant la recherche ; aucune identité ou biographie n’est fabriquée pour ce nom écarté.

La campagne RPG en français, ses trois membres de groupe, son ATB, le renderer Three.js 0.180.0, les neuf emplacements d’équipement et les sauvegardes existantes restent les contrats de l’application. Le futur mode annexe devra disposer d’une entrée explicite et d’un état isolé. Cette bible ne modifie ni le moteur ni les dépendances, ne débloque pas de personnages dans la campagne et n’achève pas une campagne Mass Effect supplémentaire.

## 2. Contrat de combat proposé à 60 Hz

Toutes les valeurs ci-dessous sont des **propositions originales d’équilibrage Armax**, pas des statistiques tirées des jeux Mass Effect. Une image logique vaut 1/60 seconde, soit environ 16,67 ms. Une pose dessinée peut tenir plusieurs images logiques : le nombre d’illustrations uniques ne doit jamais être utilisé comme une durée implicite. La simulation conservera une cadence fixe ; l’interpolation du rendu ne devra pas changer les fenêtres de garde ou de contact.

### Commandes et lecture des tableaux

| Symbole | Action proposée |
|---|---|
| L / M / H | Attaque légère / moyenne / lourde |
| S | Action spéciale |
| 5 / 2 / 6 | Neutre / bas / avant, relativement à l’adversaire |
| 236 / 214 / 623 | Quart de cercle avant / arrière / commande de relevée |
| `>` | Chaîne normale après une touche confirmée |
| `xx` | Annulation de récupération après contact autorisé |
| 6L+M | Prise avant ; 4L+M pourra inverser la projection après réalisation des animations |
| L+M+H après KO final | Finalisation facultative, résultat déjà fixé |

Les colonnes **D / A / R** signifient départ, fenêtre active et récupération, en images logiques. Le départ compte le délai avant la première image de contact. **Garde** indique l’avantage visé au contact immédiat : un nombre négatif laisse un temps de réponse à l’adversaire. Pour un projectile lointain, la distance change l’avantage réel ; une seule valeur ne permet pas de le certifier. **Hitstun** est la cible de durée d’immobilisation après impact, hors hitstop. Les chiffres ne remplacent pas le futur contrôle des collisions, portées et trajectoires.

### Défense, endurance et jauges

La garde debout arrière protège les coups moyens et aériens. La garde arrière-bas protège les coups moyens et bas mais perd face aux attaques aériennes. Aucun des normaux de ce lot n’est un overhead au sol caché. Les prises ont dix images d’échappée à partir de la capture ; elles ne garantissent pas une conversion gratuite. Après la relevée, huit images d’immunité aux prises empêchent une boucle immédiate. Les attaques lourdes, les esquives et les contres ont une récupération exploitable et ne reçoivent pas une invulnérabilité générale par défaut.

Le bouclier absorbe les dégâts avant les points de vie. Une recharge d’un point par image peut commencer après 300 images sans attaque ni dégât ; elle ne dépasse pas la valeur initiale. Les variantes de boss conservent des règles de phase distinctes. Le grattage est limité à 5 % arrondis à l’inférieur du dégât de base d’un spécial ou d’une super ; il ne donne jamais le KO final. Les normaux ne grattent pas.

La jauge commune va de 0 à 300. Une touche normale rapporte huit points, un spécial réussi quatre, une attaque réellement gardée trois et des dégâts subis cinq. Le total gagné pendant une chaîne est plafonné à trente points. Une super coûte cent points au déclenchement, même si son départ est interrompu. Une animation de victoire, une provocation, une finalisation ou une scène d’Eve ne produit pas de jauge. Les ressources personnelles sont explicites dans les fiches ; elles ne doivent pas réapparaître gratuitement à l’ouverture d’un menu.

### Chaînes et budgets de dégâts

Les coefficients successifs sont 100 %, 80 %, 65 %, 50 %, 35 %, puis 25 %. Chaque événement dommageable utilise `floor(dégâts de base × coefficient)`. Un mouvement à plusieurs impacts conserve **un budget total**, et non ce budget pour chacun de ses impacts. Une chaîne ne dépasse pas six événements dommageables. Aucun coup n’est répété dans la même chaîne. Les séquences à trois mouvements de cette bible utilisent les trois premiers coefficients.

Les annulations proposées sont L vers M, M vers spécial 1, H vers spécial 2 puis super. Kirrahe utilise H vers spécial 3 pour sa conversion : sa charge au sol retardée reste un outil de placement, pas une fausse liaison garantie. Le cancel démarre au premier contact confirmé et ne consomme pas le hitstop. Les projets de séquences du boss Archonte servent au budget des commandes d’arène ; elles ne sont pas des combos de joueur.

Un léger produit six images de hitstop, un moyen huit, un lourd ou spécial dix. Le chronomètre de round est suspendu pendant ce hitstop ; les entrées sont mémorisées sur une fenêtre proposée de cinq images. L’assistance de commandes devra traduire vers les mêmes actions et les mêmes coûts. Aucun mode de saisie ne doit obtenir une invulnérabilité ou un dégât supplémentaire.

### Rounds et conditions de victoire

Le format standard proposé est deux rounds gagnants de 99 secondes. Les dangers de décor capables de décider seuls du résultat sont désactivés en Versus et tournoi. À l’expiration, le pourcentage de points de vie restant départage ; le bouclier ne départage qu’une égalité exacte de points de vie. Une égalité complète conduit à un round supplémentaire à valeurs initiales, sans gain cumulatif de jauge. Ce départage est une proposition à implémenter et vérifier.

Les boss utilisent une manche à objectifs, des seuils de phase et leurs propres budgets. Une transition ne peut s’exécuter qu’une fois. Lors d’un franchissement de seuil, les dangers résiduels sont nettoyés ou explicitement conservés avec leur télégraphe ; aucun projectile invisible n’accompagne la cinématique. Le KO et la récompense sont fixés une seule fois. Une finalisation peut être passée immédiatement et ne change pas le résultat déjà enregistré.

## 3. Parcours du mode annexe à réaliser

| Mode | Parcours attendu | Conditions avant de l’annoncer jouable |
|---|---|---|
| Histoire | Choix d’un profil éligible, introduction, trois rencontres d’apprentissage, rival, boss, épilogue | Tous les sprites, dialogues, transitions, conditions et sauvegardes de ce parcours fonctionnent. |
| Arcade | Échelle de cinq rencontres avec ordre reproductible et boss final choisi | Pas de personnage absent, raccord des arènes et des KO, reprise du résultat. |
| Versus local | Deux contrôleurs ou clavier partagé avec attribution explicite | Même simulation des deux côtés, interfaces accessibles, rematch et changement de personnage. |
| Tournoi | Tableaux de 4, 8 ou 16 participants ; doublons de personnage permis si plus de participants que de profils | Tirage stable, forfait, égalité, progression, reprise et désignation unique du vainqueur. |
| Entraînement | Dégâts, historique d’entrée, garde programmable, affichage des collisions, reset des ressources | Les chiffres affichés correspondent aux événements réellement simulés. |
| Boss Battle | Yahg ou Archonte, lecture des objectifs, trois phases, score et débriefing | Chaque phase reste gagnable ; les ennemis auxiliaires et relais sont visibles et testés. |
| Dossiers et galerie | Filtres d’œuvre et de rôle, référence, disponibilité réelle, réserves de fidélité | Aucun chemin vide présenté comme une image ; Eve demeure soutien. |

Le tournoi standard commence avec les dix candidats éligibles de ce lot. Bénézia reste verrouillée jusqu’à normalisation de la stase, des ressources et de la protection. Les deux grands boss ne reçoivent pas un accès Versus par la simple présence d’un sprite. Un futur règlement « boss exhibition » serait un mode distinct, avec handicap affiché et résultats séparés.

Le menu d’entraînement doit laisser choisir côté, distance, ressources et comportement du mannequin. Les coups gardés, interrompus ou manqués doivent être distingués. La portée exprimée dans les données est une unité abstraite de conception ; elle devra être raccordée à l’échelle réelle du renderer et vérifiée sur des petits et grands gabarits. Un test sans décor n’établit pas la lisibilité finale avec parallaxe et effets.

Pour les sauvegardes futures, prévoir un espace Armax indépendant avec version, profils disponibles, préférences de saisie, records et progression de tournoi. Le choix d’un personnage décédé dans l’histoire ne le ressuscite pas dans la campagne. Les finales et rencontres de rival sont des exercices hypothétiques, clairement annoncés comme tels. Les dialogues ci-dessous sont originaux ; leurs identifiants stables permettent une table de localisation sans recopier une ligne officielle.

## 4. Direction artistique et règles de production

Une image contient **un seul personnage**, une seule pose, corps entier, pieds et extrémités compris, orienté vers la droite en vue latérale légèrement trois-quarts. Le format demandé est un PNG RGBA avec transparence réelle. Aucun quadrillage peint, sol, décor, nom, interface, planche de poses ou second personnage ne doit se retrouver dans le fichier. Un compagnon, un bouclier, un projectile ou une console représente un asset distinct. Les effets lumineux doivent rester discrets dans l’image neutre pour permettre leur composition ultérieure.

Les proportions sont adultes, le rendu HD précalculé, les matières différenciées et les contours lisibles à l’échelle du jeu. Pas de pixelisation volontaire ni de proportions chibi. La lumière et le contraste sont communs au lot, sans remplacer les palettes propres aux personnages. L’orientation droite n’autorise pas à retourner aveuglément une asymétrie : inscriptions, marquages, prothèses et équipement portés d’un seul côté exigent une vérification de la vue opposée.

Le cadrage laisse une marge de sécurité, avec un pivot mesuré sous les pieds. Les dimensions effectives, l’empreinte du fichier, le rectangle alpha et la position du pied d’appui seront consignés à la réception. Une dimension suggérée dans un prompt n’est pas une dimension mesurée. Les tailles du yahg et de l’Archonte demandent une échelle en scène distincte ; les caler sur la même hauteur d’image qu’un salarien ne prouve pas une échelle de monde cohérente.

Quatre niveaux de preuve restent séparés : fichier techniquement chargeable ; silhouette lisible à taille réelle ; intégration observée dans le jeu ; comparaison à la bonne référence d’œuvre. Un PNG réussi peut faire progresser l’asset vers Prototype, jamais certifier à lui seul une fidélité 1:1 ou des animations absentes. Les images refusées, manquantes ou non récupérées restent explicitement non produites.

## 5. Casting du lot


| Sujet | Œuvre / période | Usage proposé | Image attendue |
|---|---|---|---|
| Saren Arterius | Mass Effect | Versus candidat | `saren-me1-idle.png` |
| Matriarche Bénézia | Mass Effect | Boss, normalisation requise | `benezia-me1-idle.png` |
| Nihlus Kryik | Mass Effect | Versus candidat | `nihlus-me1-idle.png` |
| Kirrahe | Mass Effect | Versus candidat | `kirrahe-me1-idle.png` |
| David Anderson | Mass Effect | Versus candidat | `anderson-me1-idle.png` |
| Morinth | Mass Effect 2 | Versus candidat | `morinth-me2-idle.png` |
| Nyreen Kandros | Mass Effect 3 : Omega | Versus candidat | `nyreen-me3-idle.png` |
| Kai Leng | Mass Effect 3 | Versus candidat | `kai-leng-me3-idle.png` |
| Tela Vasir | Mass Effect 2 : Lair of the Shadow Broker | Versus candidat | `tela-vasir-me2-idle.png` |
| Balak | Mass Effect : Bring Down the Sky | Versus candidat | `balak-me1-idle.png` |
| Randall Ezno | Mass Effect Infiltrator | Versus candidat | `randall-ezno-infiltrator-idle.png` |
| Urdnot Bakara / Eve | Mass Effect 3 | Soutien narratif | `eve-me3-idle.png` |
| Courtier de l’Ombre — yahg | Mass Effect 2 : Lair of the Shadow Broker | Boss uniquement | `shadow-broker-me2-idle.png` |
| L’Archonte | Mass Effect Andromeda | Boss uniquement | `archon-andromeda-idle.png` |

Les fichiers sont attendus sous `public/assets/armax/lot04/`. Leur présence et le statut de génération sont indiqués par le suivi du lot, qui prévaut sur cette liste de chemins prévus.

## 6.1. Saren Arterius

**ID :** `armax-saren-me1`. **Œuvre :** Mass Effect. **Période :** ME1 — apparence vivante, avant la forme squelettique finale. **Rôle :** Rival majeur / boss normalisable. **Archétype proposé :** Contrôle de portée et engagements mesurés.

### Identité, silhouette et disponibilité

Turien adulte, crête et mandibules de Saren, armure sombre volumineuse, implants apparents cohérents avec ME1. Corps vivant complet ; aucune silhouette de Saren final squelettique. Profil trois-quarts droit, les deux pieds visibles, poids vers l’arrière.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, `press-benezia-gameinformer`, détaillées en bibliographie.

**Portée de la référence inspectée :** Aucune vue de modèle final convenable inspectée dans cette passe ; implantation, côtés anatomiques et doigts restent à comparer.

### Garde et ressources

Budget proposé : **1050 PV, 220 bouclier**, marche 4.5 unités/s ; saut 44 images logiques. Ces valeurs ne sont pas canoniques.

Avant-bras haut et arme proche du torse ; garde basse par fléchissement. Les implants ne donnent pas une garde arrière automatique.

Surcharge tactique : deux charges, recharge individuelle 240 images hors attaque. Une charge renforce un spécial de 15 dégâts ; aucun bonus de vitesse. Les deux charges consommées rendent la prochaine récupération de spécial +6 images.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Crosse courte | 32 | 6 / 2 / 11 | -3 | 20 | Contact bref de la crosse ; aucune traînée cachant la main. |
| 2L | Frappe de cheville | 28 | 6 / 2 / 13 | -4 | 20 | Coup bas à courte portée, se garde accroupi. |
| 5M | Avant-bras spectre | 60 | 10 / 3 / 18 | -6 | 30 | Projection du coude dans la ligne médiane. |
| 2M | Balayage latéral | 54 | 11 / 3 / 19 | -7 | 30 | Pied d’appui conservé ; ne lance pas en l’air. |
| 5H | Épaule blindée | 92 | 16 / 4 / 26 | -11 | 38 | Avance de 0,25 unité, punissable à vide. |
| 2H | Crosse montante | 86 | 14 / 4 / 28 | -13 | 38 | Anti-air local ; pas d’invulnérabilité aux coups au sol. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir de verrouillage | 75 | 18 / 1 / 30 | -12 | 28 | Un projectile horizontal. Évitable en se baissant à moyenne portée ; pas de salve automatique. |
| 214S | Rupture de garde cinétique | 68 | 22 / 4 / 33 | -15 | 32 | Impact au sol après une posture lumineuse ; un seul coup, aucune prise imblocable. |
| 623S | Repositionnement spectre | 55 | 14 / 3 / 30 | -14 | 28 | Pas latéral puis frappe. Esquive seulement les projectiles images 6–12 ; vulnérable aux prises et aux attaques basses. |

### Prise, super et finalisation

**Mise au sol du spectre — 6L+M.** 100 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Prise de bras et déséquilibre ; deux sujets animés dans des fichiers séparés.

**Directive absolue — 236236H.** 225 dégâts au budget total, coût 100 jauge ; D/A/R 16/8/44, -24 en garde au contact. Salve courte puis impulsion de proximité ; la garde annule l’approche et laisse une récupération longue.

**Dernier avertissement — finalisation facultative.** Saren immobilise le module de simulation adverse, baisse son arme et s’éloigne ; écran de résultat immédiat en option. Durée proposée : 150 images, soit 2.50 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **124 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **292 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Réduire la distance après un projectile évité.
- Attirer 5H hors portée puis punir.
- Compter les deux charges avant de contester une pression renforcée.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Virmire — plateforme.** Entrée à pied ; aucun hoverboard inclus dans le sprite.

> Saren : « Votre détermination ne compense pas une mauvaise position. »  
> Identifiant : `armax-saren-me1-intro-01`

**Rival / confrontation — Citadelle — passerelle.** Anderson se place entre Saren et la sortie.

> Anderson : « Cette fois, personne ne vous couvrira. »  
> Identifiant : `armax-saren-me1-rival-01`

> Saren : « Alors choisissez mieux votre angle. »  
> Identifiant : `armax-saren-me1-rival-02`

**Épilogue — Salle de simulation Armax.** Le relevé de combat se fige ; une porte s’ouvre sur un décor virtuel.

> Narration : « Le spectre remporte une simulation, pas le droit de réécrire la guerre. »  
> Identifiant : `armax-saren-me1-ending-01`

Résultat de scène : Fin alternative de simulation, sans modification du récit ME1.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Apparence vivante ne signifie pas absence de cybernétique.
- Les noms de coups, la ressource et les valeurs sont inventés pour Armax.
- Aucun déplacement sur plateforme volante ni transformation finale produit.

## 6.2. Matriarche Bénézia

**ID :** `armax-benezia-me1`. **Œuvre :** Mass Effect. **Période :** ME1 — Novéria, tenue de matriarche. **Rôle :** Boss narratif ; option Versus à normaliser. **Archétype proposé :** Contrôle biotique lent.

### Identité, silhouette et disponibilité

Bénézia ME1, asari bleue mûre, coiffe et vêtement à nervures métalliques noires visibles dans la capture. Ne pas inventer une robe principalement violet profond. Corps entier demandé ; chute du vêtement, pieds et partie basse restent à corroborer. Bras libres pour la proposition de geste biotique.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, `press-nihlus-softpedia`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture de tête et haut du torse seulement ; nervures métalliques noires visibles, vêtement inférieur et pieds non vérifiés.

### Garde et ressources

Budget proposé : **1000 PV, 280 bouclier**, marche 3.2 unités/s ; saut 50 images logiques. Ces valeurs ne sont pas canoniques.

Paume levée, barrière visible seulement à l’impact. Blocage bas distinct ; la robe ne cache pas la lecture de l’accroupissement.

Concentration : trois unités. Les spéciaux 1 et 3 consomment une unité, regagnée après 180 images sans lancer de pouvoir. Stase interdit une seconde stase sur la même cible pendant 300 images.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Paume de maintien | 38 | 8 / 3 / 14 | -4 | 22 | Frappe courte de la main, contact non lumineux avant l’impact. |
| 2L | Pression basse | 34 | 8 / 3 / 15 | -5 | 22 | Geste vers le sol, hitbox au pied adverse. |
| 5M | Onde rapprochée | 70 | 12 / 4 / 21 | -7 | 32 | Arc biotique court, silhouette des mains lisible. |
| 2M | Déport de cheville | 64 | 13 / 4 / 22 | -8 | 32 | Balayage biotique au ras du sol, arrêt net. |
| 5H | Double paume | 110 | 19 / 5 / 30 | -14 | 40 | Engagement lent ; pas d’armure sur le début. |
| 2H | Paume céleste | 100 | 17 / 5 / 31 | -15 | 40 | Anti-air au-dessus de l’avant-bras, flanc arrière vulnérable. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Projection de matriarche | 88 | 25 / 4 / 38 | -18 | 34 | Onde télégraphiée ; garde debout ou saut tôt. Consomme une concentration. |
| 214S | Stase brève | 32 | 26 / 2 / 40 | -20 | 40 | Marque visible ; immobilisation maximale 40 images, brisée par le premier coup. La garde l’annule, sans enchaînement infini. |
| 623S | Soulèvement frontal | 84 | 20 / 5 / 36 | -17 | 34 | Anti-air en cône court, vulnérable au sol pendant le départ. Consomme une concentration. |

### Prise, super et finalisation

**Renversement calme — 6L+M.** 105 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Saisie du poignet, déplacement biotique court et chute sans torsion explicite.

**Cercle de concentration — 236236H.** 240 dégâts au budget total, coût 100 jauge ; D/A/R 28/10/50, -30 en garde au contact. Onde circulaire à deux temps annoncés ; aucune invulnérabilité de cinématique avant le premier contact.

**Silence du combat — finalisation facultative.** L’adversaire demeure suspendu dans un halo qui se dissipe ; transition vers son état KO sans blessure représentée. Durée proposée : 180 images, soit 3.00 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **147 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **291 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Se rapprocher pendant les récupérations, jamais après un pouvoir gardé trop loin.
- Attendre le marquage de stase puis esquiver avant son activation.
- Les angles arrière et les prises battent sa garde frontale.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Novéria — laboratoire.** La matriarche termine une méditation puis relève la tête.

> Bénézia : « L’agitation masque souvent la peur. »  
> Identifiant : `armax-benezia-me1-intro-01`

**Rival / confrontation — Novéria — plateforme.** Liara est une dépendance de roster, pas un fichier livré dans ce lot.

> Liara : « Je vous écoute encore. Mais je ne céderai pas. »  
> Identifiant : `armax-benezia-me1-rival-01`

> Bénézia : « Alors montre-moi ce que tu as choisi de devenir. »  
> Identifiant : `armax-benezia-me1-rival-02`

Dépendance : Roster antérieur non récupéré ; à raccorder.

**Épilogue — Salle de débriefing Armax.** Les couches virtuelles de Novéria s’effacent.

> Narration : « Une pause devient possible dans la simulation. La décision de Novéria reste celle de la campagne. »  
> Identifiant : `armax-benezia-me1-ending-01`

Résultat de scène : Épilogue de simulation explicitement alternatif.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Les capacités biotiques inspirent la proposition ; aucun frame data canonique.
- Boss disponible uniquement sur le papier. Variante Versus verrouillée jusqu’à normalisation de la garde et de la stase.

## 6.3. Nihlus Kryik

**ID :** `armax-nihlus-me1`. **Œuvre :** Mass Effect. **Période :** ME1 — Eden Prime, avant l’attaque. **Rôle :** Duelliste tactique. **Archétype proposé :** Punition et mobilité courte.

### Identité, silhouette et disponibilité

Turien aux marquages faciaux noirs et blancs de Nihlus, armure rouge et sombre identifiable, crête complète. Les proportions sont celles de ME1 ; ne pas reprendre visage, armure ou cicatrices de Garrus.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, `press-kirrahe-rpgsite`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture du Normandy : tête, torse et jambes partielles ; pieds non vérifiés. Le sujet retenu est le turien, pas les humains à côté.

### Garde et ressources

Budget proposé : **950 PV, 180 bouclier**, marche 5.1 unités/s ; saut 40 images logiques. Ces valeurs ne sont pas canoniques.

Arme tenue basse, avant-bras libre prêt à dévier ; garde compacte. Un pas de recul visuel ne déplace pas la collision de garde.

Lecture : une marque après esquive réussie d’un projectile. Le prochain spécial gagne 12 dégâts, puis la marque disparaît. Maximum une marque ; une provocation ne la recharge pas.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Jab de contrôle | 28 | 5 / 2 / 10 | -2 | 20 | Main libre, pas d’allonge surnaturelle. |
| 2L | Pointe basse | 25 | 5 / 2 / 12 | -3 | 20 | Coup de pied avant court. |
| 5M | Crosse croisée | 55 | 9 / 3 / 17 | -5 | 30 | Rotation du buste, pied arrière ancré. |
| 2M | Crochet de jambe | 50 | 10 / 3 / 18 | -6 | 30 | Bas moyen sans relevée automatique. |
| 5H | Percussion du spectre | 85 | 14 / 4 / 25 | -10 | 38 | Crosse lourde droite, déplacement volontairement court. |
| 2H | Revers ascendant | 80 | 12 / 4 / 27 | -12 | 38 | Anti-air, grande récupération si l’adversaire reste au sol. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir de précision | 72 | 17 / 1 / 28 | -11 | 28 | Projectile unique ; trajectoire fixe, aucune poursuite du saut. |
| 214S | Pas de flanc | 60 | 16 / 3 / 28 | -13 | 34 | Déplacement de 0,5 unité puis impact ; ne traverse jamais l’adversaire. |
| 623S | Contre préparé | 82 | 8 / 12 / 37 | -18 | 32 | Fenêtre de contre sur frappe haute uniquement images 8–19 ; échec contre prise, bas et projectile. |

### Prise, super et finalisation

**Désarçonnement turien — 6L+M.** 92 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Prise d’épaule et passage sur le côté, arme abaissée.

**Audit du spectre — 236236H.** 210 dégâts au budget total, coût 100 jauge ; D/A/R 13/6/42, -23 en garde au contact. Enchaînement de deux frappes rapprochées et tir de simulation ; aucune accélération globale du temps.

**Extraction propre — finalisation facultative.** Nihlus désarme la projection ennemie et active la balise de fin d’exercice. Durée proposée : 135 images, soit 2.25 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **115 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **269 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Appâter son contre avec une attaque basse ou une prise.
- Garder le tir, avancer par petites distances, éviter un saut toujours identique.
- Punir le pas de flanc gardé.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Eden Prime — quai.** Observation du terrain avant de se mettre en garde.

> Nihlus : « Je regarde vos décisions. Le résultat viendra ensuite. »  
> Identifiant : `armax-nihlus-me1-intro-01`

**Rival / confrontation — Eden Prime — quai.** Simulation alternative d’une confrontation avec Saren.

> Nihlus : « Je veux comprendre ce que je vois. »  
> Identifiant : `armax-nihlus-me1-rival-01`

> Saren : « Tu observes trop longtemps. »  
> Identifiant : `armax-nihlus-me1-rival-02`

**Épilogue — Débriefing Armax.** Nihlus clôt un dossier virtuel.

> Narration : « Le rapport retient la vigilance et la retenue. Cette rencontre n’altère pas le destin d’Eden Prime. »  
> Identifiant : `armax-nihlus-me1-ending-01`

Résultat de scène : Épilogue hors continuité canonique.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- La confrontation avec Saren est une branche de simulation ; aucune survie canonique revendiquée.
- La mécanique Lecture est une invention de design.

## 6.4. Kirrahe

**ID :** `armax-kirrahe-me1`. **Œuvre :** Mass Effect. **Période :** ME1 — opération de Virmire. **Rôle :** Spécialiste de terrain du GSI. **Archétype proposé :** Préparation et contrôle des accès.

### Identité, silhouette et disponibilité

Kirrahe ME1, salarien longiligne, visage et crâne allongés. Référence inspectée : armure ivoire/crème et noire, accents bordeaux ; ne pas lui attribuer l’orange des soldats en arrière-plan. Main et pieds salariens entièrement visibles, anatomie à contrôler. Ne pas reprendre le visage ou la tenue de Mordin.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, `press-anderson-nerdstash`, `press-nihlus-softpedia`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture en pied de Virmire inspectée ; résolution et lumière limitent les marquages fins.

### Garde et ressources

Budget proposé : **930 PV, 170 bouclier**, marche 5.0 unités/s ; saut 40 images logiques. Ces valeurs ne sont pas canoniques.

Profil étroit, avant-bras protégeant le centre ; accroupissement court. Les oreilles/crêtes ne doivent pas disparaître dans les impacts.

Charge d’interdiction : un seul dispositif au sol à la fois, expiration 180 images, recharge 300 images après destruction ou expiration. Les commandes ne produisent aucun allié supplémentaire hors écran.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Contact de reconnaissance | 28 | 5 / 2 / 10 | -2 | 20 | Frappe rapide paume/crosse. |
| 2L | Accroc bas | 25 | 5 / 2 / 12 | -3 | 20 | Pied avant, portée réduite. |
| 5M | Crosse tactique | 55 | 9 / 3 / 17 | -5 | 30 | Attaque médiane lisible par la rotation d’épaule. |
| 2M | Balayage d’appui | 50 | 10 / 3 / 18 | -6 | 30 | Bas moyen, sans projectile dissimulé. |
| 5H | Percussion préparée | 85 | 14 / 4 / 25 | -10 | 38 | Engagement annoncé, bras et arme restent lisibles. |
| 2H | Coude de couverture | 80 | 12 / 4 / 27 | -12 | 38 | Anti-air court, vulnérable derrière. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir d’interdiction | 68 | 18 / 1 / 28 | -12 | 28 | Projectile unique légèrement bas ; saut possible si anticipé. |
| 214S | Charge de terrain | 56 | 24 / 3 / 34 | -16 | 36 | Pose puis détonation courte annoncée par un clignotement de 30 images ; un seul dispositif. Aucun explosif réel détaillé. |
| 623S | Brouillage de simulation | 45 | 20 / 4 / 32 | -15 | 30 | Impulsion courte ; masque le verrouillage visuel pendant 45 images, sans bloquer les commandes, la garde ni la lecture des coups. |

### Prise, super et finalisation

**Évacuation forcée — 6L+M.** 88 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Pivot du bras et projection basse, retour immédiat en couverture.

**Fenêtre de passage — 236236H.** 205 dégâts au budget total, coût 100 jauge ; D/A/R 18/8/42, -24 en garde au contact. Deux lignes de tir annoncées, intervalle de 12 images ; couloir de sortie lisible entre elles.

**Terrain sécurisé — finalisation facultative.** Kirrahe pose un marqueur de fin sur la zone dégagée puis range son équipement. Durée proposée : 150 images, soit 2.50 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **113 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 623S xx 236236H`. Budget théorique réduit : **254 dégâts**, coût 100 jauge. Punition de 5H, brouillage au contact, annulation en super ; 100 jauge. Le dispositif retardé 214S reste un outil de placement, pas un maillon de combo garanti. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Détruire ou attendre le dispositif avant d’avancer.
- Le brouillage ne supprime aucun input : continuer sa défense sans attendre l’interface.
- Kirrahe perd les échanges rapprochés prolongés ; contester ses poses lentes.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Virmire — camp du GSI.** Vérification du terminal puis signal de départ.

> Kirrahe : « Une ouverture suffit. Préparez-la avant de courir. »  
> Identifiant : `armax-kirrahe-me1-intro-01`

**Rival / confrontation — Virmire — accès industriel.** Saren bloque la voie d’extraction.

> Kirrahe : « Nous avons déjà prévu le chemin du retour. »  
> Identifiant : `armax-kirrahe-me1-rival-01`

> Saren : « Voyons si vous l’atteindrez. »  
> Identifiant : `armax-kirrahe-me1-rival-02`

**Épilogue — Navette simulée.** Le compte rendu privilégie les coéquipiers évacués.

> Narration : « L’exercice mesure une équipe qui rentre, pas seulement un adversaire mis à terre. »  
> Identifiant : `armax-kirrahe-me1-ending-01`

Résultat de scène : Bilan de simulation indépendant des choix de Virmire.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Les gestes, dispositifs et commandes sont une proposition pour ce jeu de combat.
- Ne pas attribuer de biotique à Kirrahe sans source propre.

## 6.5. David Anderson

**ID :** `armax-anderson-me1`. **Œuvre :** Mass Effect. **Période :** ME1 — capitaine, tenue militaire de l’époque. **Rôle :** Combattant fondamental. **Archétype proposé :** Défense et punition rapprochée.

### Identité, silhouette et disponibilité

David Anderson ME1, visage adulte de l’époque, uniforme marine à liserés or et chaîne visible selon référence. Aucune veste de guerre ME3 ni armure ajoutée pour justifier le combat. Silhouette solide, chaussures intégralement cadrées ; pose martiale est une adaptation.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, détaillées en bibliographie.

**Portée de la référence inspectée :** Portrait ME1/Legendary Edition et vue latérale partielle dans le Normandy ; chaîne visible dans cette seconde vue, uniforme complet et chaussures non validés.

### Garde et ressources

Budget proposé : **1100 PV, 150 bouclier**, marche 4.1 unités/s ; saut 46 images logiques. Ces valeurs ne sont pas canoniques.

Coudes près du torse et appui large. Garde debout conventionnelle, bas vulnérable si les genoux ne fléchissent pas.

Discipline : après 3 coups gardés sans recevoir de dégâts, la prochaine attaque moyenne repousse davantage, sans dégâts supplémentaires. Le compteur disparaît après prise subie ou 240 images sans garde.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Direct court | 32 | 6 / 2 / 11 | -3 | 20 | Poing fermé sans omni-lame. |
| 2L | Coup au tibia | 28 | 6 / 2 / 13 | -4 | 20 | Bas bref sans déplacement. |
| 5M | Crosse du capitaine | 60 | 10 / 3 / 18 | -6 | 30 | Frappe médiane lourde mais lisible. |
| 2M | Balayage de contrôle | 54 | 11 / 3 / 19 | -7 | 30 | Attaque basse médiane, retrait net du pied. |
| 5H | Percussion d’épaule | 92 | 16 / 4 / 26 | -11 | 38 | Avance de 0,3 unité, pas d’invulnérabilité. |
| 2H | Coude montant | 86 | 14 / 4 / 28 | -13 | 38 | Anti-air de proximité ; éviter toute onde biotique. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir discipliné | 78 | 20 / 1 / 30 | -13 | 30 | Un tir fixe de simulation ; récupération assez longue pour être approché après un saut anticipé. |
| 214S | Poussée de contrôle | 70 | 19 / 4 / 31 | -14 | 34 | Épaule à courte distance ; traverse seulement les projectiles déjà neutralisés, sans armure générale. |
| 623S | Interception | 82 | 15 / 4 / 34 | -16 | 32 | Coup ascendant précis ; ne couvre pas toute la verticale et reste vulnérable aux attaques basses. |

### Prise, super et finalisation

**Désarmement Alliance — 6L+M.** 102 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Saisie d’avant-bras, neutralisation sans cassure de membre.

**Autorité de terrain — 236236H.** 220 dégâts au budget total, coût 100 jauge ; D/A/R 17/7/46, -25 en garde au contact. Trois impacts espacés de courte portée, garde possible dès le premier si non confirmé.

**Fin de mission — finalisation facultative.** Anderson immobilise l’arme adverse, la dépose au sol puis ordonne l’arrêt de l’exercice. Durée proposée : 145 images, soit 2.42 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **126 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **291 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Passer par le jeu de pied : Anderson se déplace plus lentement.
- Alterner prise et attente pour casser Discipline.
- Le tir discipliné se punit à l’anticipation, la poussée se punit en garde.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Normandy SR-1 — entraînement.** Anderson vérifie la zone et rejoint la ligne centrale.

> Anderson : « Montrez-moi que vous savez aussi vous arrêter. »  
> Identifiant : `armax-anderson-me1-intro-01`

**Rival / confrontation — Citadelle — passerelle.** Confrontation de simulation avec Saren.

> Anderson : « Un uniforme ne vous protège pas de vos choix. »  
> Identifiant : `armax-anderson-me1-rival-01`

> Saren : « Je préfère compter sur ma précision. »  
> Identifiant : `armax-anderson-me1-rival-02`

**Épilogue — Débriefing Alliance.** Le score de maîtrise défensive apparaît à côté du temps de combat.

> Narration : « Le capitaine transmet un exercice reproductible. Le joueur garde sa victoire sans en faire un événement de campagne. »  
> Identifiant : `armax-anderson-me1-ending-01`

Résultat de scène : Progression Armax uniquement.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Aucune biotique ni omni-lame ME3 ajoutée à cette version ME1.
- La tenue choisie pour l’image doit être documentée, pas mélangée entre épisodes.

## 6.6. Morinth

**ID :** `armax-morinth-me2`. **Œuvre :** Mass Effect 2. **Période :** ME2 — tenue civile d’Omega, identité révélée. **Rôle :** Duelliste biotique. **Archétype proposé :** Pression différée et feintes lisibles.

### Identité, silhouette et disponibilité

Asari bleue adulte, visage et marques de Morinth, tenue civile noire/dark d’Omega conforme à la référence, sans lui attribuer l’armure rouge de Samara. Pose assurée mais de combat ; aucun contenu érotique.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me2`, `community-morinth-troodon80`, détaillées en bibliographie.

**Portée de la référence inspectée :** Rendu communautaire de modèle civil en plusieurs vues ; extraction et modifications éventuelles non auditées. Comparaison au jeu final requise.

### Garde et ressources

Budget proposé : **930 PV, 190 bouclier**, marche 4.9 unités/s ; saut 42 images logiques. Ces valeurs ne sont pas canoniques.

Une main ouverte à hauteur de l’épaule, autre protégeant l’abdomen. Garde basse explicitement dessinée ; pas de défense passive par regard.

Emprise de simulation : un marqueur après spécial 2 réussi, dure 150 images. Le prochain spécial 1 consomme le marqueur pour +18 dégâts. Aucune inversion des commandes ni perte prolongée de contrôle du joueur.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Paume rapide | 28 | 5 / 2 / 10 | -2 | 20 | Contact court sans flash avant l’impact. |
| 2L | Pointe basse | 25 | 5 / 2 / 12 | -3 | 20 | Frappe du pied avant. |
| 5M | Arc de paume | 55 | 9 / 3 / 17 | -5 | 30 | Attaque médiane, petit effet au point de contact. |
| 2M | Balayage fluide | 50 | 10 / 3 / 18 | -6 | 30 | Bas moyen, corps gardé en profil droit. |
| 5H | Revers d’emprise | 85 | 14 / 4 / 25 | -10 | 38 | Frappe lourde annoncée par l’ouverture des bras. |
| 2H | Geste ascendant | 80 | 12 / 4 / 27 | -12 | 38 | Anti-air court, pas de poursuite automatique. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Projection nerveuse | 70 | 17 / 3 / 29 | -13 | 28 | Trait biotique horizontal ; consomme Emprise si présente. |
| 214S | Lien bref | 46 | 22 / 3 / 33 | -16 | 36 | Pose une marque sur touche seulement. La marque n’immobilise pas et n’agit pas sur l’interface. |
| 623S | Recul biotique | 62 | 16 / 4 / 32 | -14 | 30 | Court recul puis poussée ; projectile adverse peut toujours la toucher pendant la récupération. |

### Prise, super et finalisation

**Déséquilibre mental — 6L+M.** 92 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Feinte du regard puis crochetage physique ; aucune représentation de relation intime.

**Convergence — 236236H.** 215 dégâts au budget total, coût 100 jauge ; D/A/R 14/8/45, -25 en garde au contact. Le champ se referme devant elle, avec zone arrière libre ; la marque n’est pas obligatoire pour l’utiliser.

**Volonté coupée — finalisation facultative.** Morinth éteint la projection de l’adversaire dans un halo, puis se détourne. Aucune scène intime ni violence graphique. Durée proposée : 150 images, soit 2.50 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **114 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **260 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Bloquer le lien plutôt que paniquer devant le marqueur.
- Se déplacer derrière sa convergence si elle est lancée sans confirmation.
- Profiter de sa faible endurance pour punir les feintes anticipées.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Omega — salle d’entraînement.** Elle observe l’espace, paumes ouvertes.

> Morinth : « Vous avez choisi de rester. Assumez la distance. »  
> Identifiant : `armax-morinth-me2-intro-01`

**Rival / confrontation — Omega — passerelle.** Samara entre dans le champ ; leur rencontre est une hypothèse de simulation.

> Samara : « Cet exercice s’arrête lorsque tu cèdes. »  
> Identifiant : `armax-morinth-me2-rival-01`

> Morinth : « Alors il durera. »  
> Identifiant : `armax-morinth-me2-rival-02`

Dépendance : Roster antérieur non récupéré ; à raccorder.

**Épilogue — Sortie virtuelle d’Omega.** Une porte se ferme sur son profil ; pas de conséquence narrative imposée.

> Narration : « Le profil Morinth termine son épreuve. Aucun recrutement ni décès de la campagne n’est remplacé. »  
> Identifiant : `armax-morinth-me2-ending-01`

Résultat de scène : Épilogue propre à la simulation.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Tenue civile choisie : ne pas confondre avec imitation de Samara.
- Emprise et finisher sont adaptations abstraites ; aucune capacité canonique exacte reproduite.

## 6.7. Nyreen Kandros

**ID :** `armax-nyreen-me3`. **Œuvre :** Mass Effect 3 : Omega. **Période :** ME3 — résistance sur Omega. **Rôle :** Combattante de protection. **Archétype proposé :** Défense active et contre-pression.

### Identité, silhouette et disponibilité

Nyreen Kandros ME3 Omega, turienne tête nue. Référence inspectée : col ouvert et armure bordeaux/noir à liserés or ; aucune capuche portée sur la tête. Respecter crâne, marquages faciaux, proportions et pieds turiens ; ne pas convertir son anatomie en silhouette humaine.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me3`, `press-nyreen-pcgamer`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture de presse : tête nue, torse et haut des jambes ; bas des jambes et pieds non vérifiés.

### Garde et ressources

Budget proposé : **1030 PV, 220 bouclier**, marche 4.4 unités/s ; saut 43 images logiques. Ces valeurs ne sont pas canoniques.

Avant-bras protégeant le groupe imaginaire mais seule à l’image. Effet de barrière dessiné séparément, garde basse distincte.

Protection : deux charges défensives. Une parade temporelle consomme une charge et réduit le recul, sans riposte automatique. Recharge 360 images ; aucune armure permanente.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Contact d’arrêt | 32 | 6 / 2 / 11 | -3 | 20 | Paume/crosse à très courte portée. |
| 2L | Frappe d’appui | 28 | 6 / 2 / 13 | -4 | 20 | Bas léger précis. |
| 5M | Crosse de résistance | 60 | 10 / 3 / 18 | -6 | 30 | Moyen frontal avec appui fort. |
| 2M | Balayage protecteur | 54 | 11 / 3 / 19 | -7 | 30 | Bas moyen, avance limitée. |
| 5H | Poussée blindée | 92 | 16 / 4 / 26 | -11 | 38 | Lourd annoncé ; aucune prise cachée. |
| 2H | Arc de protection | 86 | 14 / 4 / 28 | -13 | 38 | Anti-air local, contour lisible. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir de couverture | 76 | 19 / 1 / 29 | -12 | 28 | Projectile unique, sans allié tirant hors écran. |
| 214S | Barrière de riposte | 64 | 18 / 5 / 34 | -15 | 36 | Court contact suivi d’un écran de 18 images ; casse après un impact, contournable par prise. |
| 623S | Poussée biotique | 84 | 21 / 4 / 35 | -16 | 32 | Cône frontal qui écarte ; les distances et propriétés sont adaptées, pas une liste officielle de talents. |

### Prise, super et finalisation

**Extraction de proximité — 6L+M.** 98 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Écarte l’adversaire, l’abaisse et recule pour créer une distance de sécurité.

**Ligne des Serres — 236236H.** 225 dégâts au budget total, coût 100 jauge ; D/A/R 18/9/45, -24 en garde au contact. Barrière brève suivie d’une poussée. Aucun soldat auxiliaire n’apparaît dans l’image du personnage.

**Zone évacuée — finalisation facultative.** Nyreen désactive la projection adverse, vérifie un signal d’évacuation et baisse la garde. Durée proposée : 165 images, soit 2.75 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **125 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **289 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Épuiser ses deux charges avant une attaque longue.
- Prendre la garde/barrière, ou attendre ses 18 images.
- Ne pas attaquer systématiquement après un projectile gardé à grande distance.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Omega — zone des Serres.** Regard vers l’accès civil, retour face à l’adversaire.

> Nyreen : « Tant que je suis ici, ce passage reste sûr. »  
> Identifiant : `armax-nyreen-me3-intro-01`

**Rival / confrontation — Omega — passerelle de contrôle.** Kai Leng incarne une opposition Cerberus de simulation ; aucune rencontre canonique affirmée.

> Kai Leng : « Vous ralentissez l’opération. »  
> Identifiant : `armax-nyreen-me3-rival-01`

> Nyreen : « C’est précisément mon intention. »  
> Identifiant : `armax-nyreen-me3-rival-02`

**Épilogue — Omega — débriefing virtuel.** Le nombre d’objectifs protégés prime sur le score de dégâts.

> Narration : « La simulation récompense les ouvertures créées pour les autres. Le sort de Nyreen dans Omega reste séparé. »  
> Identifiant : `armax-nyreen-me3-ending-01`

Résultat de scène : Fin alternative explicitement non canonique.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Rencontre Nyreen/Kai Leng inventée pour Armax.
- Les propriétés exactes de la barrière et du kit sont à valider comme adaptation.

## 6.8. Kai Leng

**ID :** `armax-kai-leng-me3`. **Œuvre :** Mass Effect 3. **Période :** ME3 — armure et visière Cerberus. **Rôle :** Assassin mobile. **Archétype proposé :** Approche risquée et attaques retardées.

### Identité, silhouette et disponibilité

Kai Leng ME3, cheveux noirs, visière couvrant les yeux, armure noire/grise avec détails Cerberus et lame propre à son apparence. Ne pas dessiner un ninja générique ni remplacer la visière par des yeux lumineux.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me3`, `screenshot-kai-leng-wallpapers`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture redistribuée en gros plan : visage, visière et armure supérieure seulement ; lame, cheveux attachés et jambes non certifiés.

### Garde et ressources

Budget proposé : **980 PV, 200 bouclier**, marche 5.2 unités/s ; saut 39 images logiques. Ces valeurs ne sont pas canoniques.

Lame en garde diagonale, main libre à mi-hauteur. La lame ne forme pas un bouclier couvrant le dos.

Impulsion : deux charges de déplacement, recharge 300 images après usage. Le déplacement renforcé garde une silhouette résiduelle visible ; aucune invisibilité totale pour l’adversaire.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Poignée courte | 28 | 5 / 2 / 10 | -2 | 20 | Contact avec la poignée, sans grande traînée de lame. |
| 2L | Frappe au tibia | 25 | 5 / 2 / 12 | -3 | 20 | Bas léger du pied avant. |
| 5M | Taille médiane | 55 | 9 / 3 / 17 | -5 | 30 | Lame frontale, arc court et lisible. |
| 2M | Coupe basse de simulation | 50 | 10 / 3 / 18 | -6 | 30 | Bas moyen sans blessure représentée. |
| 5H | Entaille annoncée | 85 | 14 / 4 / 25 | -10 | 38 | Grand mouvement lourd avec départ visible. |
| 2H | Lame montante | 80 | 12 / 4 / 27 | -12 | 38 | Anti-air ; pas d’invulnérabilité complète. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Approche éclair | 74 | 16 / 4 / 32 | -15 | 30 | Avance linéaire d’une charge ; arrêt au contact, jamais de passage automatique derrière. |
| 214S | Frappe différée | 68 | 24 / 4 / 35 | -17 | 38 | Retard lisible : aucun hitbox tant que l’épaule n’a pas fini son armé. |
| 623S | Repli tactique | 58 | 15 / 3 / 31 | -14 | 30 | Recule puis attaque court ; perd contre poursuite prudente et projectile lent. |

### Prise, super et finalisation

**Verrou du bras — 6L+M.** 96 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Déséquilibre puis pose au sol ; lame tenue loin du cou.

**Séquence Cerberus — 236236H.** 220 dégâts au budget total, coût 100 jauge ; D/A/R 14/10/47, -26 en garde au contact. Trois contacts de simulation ; garde possible avant le premier, récupération visible après le dernier.

**Signal interrompu — finalisation facultative.** Kai Leng coupe un câble holographique du mannequin adverse puis rengaine ; aucun membre n’est touché. Durée proposée : 150 images, soit 2.50 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **117 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **282 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Garder l’approche puis punir à -15 au contact.
- Prendre de l’espace pendant la frappe différée.
- Compter les charges : le repli répété cesse d’être gratuit.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Thessia — architecture virtuelle.** Lame déployée, arrêt bref pour lire la cible.

> Kai Leng : « La trajectoire est claire. Ne la compliquez pas. »  
> Identifiant : `armax-kai-leng-me3-intro-01`

**Rival / confrontation — Omega — passerelle de contrôle.** Nyreen protège le point de passage.

> Nyreen : « Votre vitesse n’ouvre pas toutes les portes. »  
> Identifiant : `armax-kai-leng-me3-rival-01`

> Kai Leng : « Une seule me suffira. »  
> Identifiant : `armax-kai-leng-me3-rival-02`

**Épilogue — Terminal de simulation.** Le compte rendu se marque exercice clos.

> Narration : « Le profil d’assaut termine son programme. Aucune victoire d’Armax ne décide de Thessia ou de la Citadelle. »  
> Identifiant : `armax-kai-leng-me3-ending-01`

Résultat de scène : Épilogue de simulation.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Pas de vaisseau invulnérable ni d’aide hors écran imposée au Versus.
- Ne pas reprendre la totalité de son comportement de boss ME3 comme frame data canonique.

## 6.9. Tela Vasir

**ID :** `armax-tela-vasir-me2`. **Œuvre :** Mass Effect 2 : Lair of the Shadow Broker. **Période :** ME2 — Illium, apparence de Spectre. **Rôle :** Vanguard de simulation. **Archétype proposé :** Charge et conversion de proximité.

### Identité, silhouette et disponibilité

Tela Vasir du DLC ME2, asari bleue aux marquages magenta, plaques d’armure bleu royal, abdomen clair et bordures or/beige visibles dans la capture. Aucune tenue de Justicar ni visage de Liara. Partie basse et emblèmes à comparer ; corps entier demandé sans prétendre ces détails déjà vérifiés.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me2`, `press-tela-vasir-gamestar`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture DLC du visage et torse : plaques bleu royal, marques magenta, abdomen clair, bordures dorées/beiges ; partie basse non visible.

### Garde et ressources

Budget proposé : **1020 PV, 210 bouclier**, marche 4.6 unités/s ; saut 42 images logiques. Ces valeurs ne sont pas canoniques.

Avant-bras levé, main arrière préparant une impulsion. Le corps se replace après chaque poussée ; pas de flottaison constante.

Élan : charge réussie sur touche donne une impulsion pendant 180 images ; prochain moyen +10 dégâts. Une charge gardée n’octroie rien et consomme la réserve de 180 images avant réemploi.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Paume de percée | 32 | 6 / 2 / 11 | -3 | 20 | Coup bref au centre. |
| 2L | Pointe d’approche | 28 | 6 / 2 / 13 | -4 | 20 | Bas léger sans téléportation. |
| 5M | Percussion de Spectre | 60 | 10 / 3 / 18 | -6 | 30 | Impact médian à l’épaule. |
| 2M | Balayage d’élan | 54 | 11 / 3 / 19 | -7 | 30 | Bas moyen, pied pivot stable. |
| 5H | Double poussée | 92 | 16 / 4 / 26 | -11 | 38 | Geste lourd avec halo au seul contact. |
| 2H | Arc ascendant | 86 | 14 / 4 / 28 | -13 | 38 | Anti-air proche, grand retour de bras. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Charge de Vasir | 82 | 19 / 4 / 35 | -17 | 32 | Trajectoire horizontale visible ; s’arrête à la garde, pas de suivi vertical ni invulnérabilité complète. |
| 214S | Onde de rupture | 70 | 23 / 5 / 34 | -16 | 36 | Onde locale, temps mort avant déclenchement. Détruit un projectile faible sans garantir une touche. |
| 623S | Tir de repli | 65 | 18 / 1 / 29 | -12 | 30 | Projectile unique pendant un retrait court ; impossible d’enchaîner immédiatement une autre charge. |

### Prise, super et finalisation

**Projection de Spectre — 6L+M.** 100 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Saisie, pivot et poussée de faible hauteur, réception sans violence graphique.

**Percée d’Illium — 236236H.** 230 dégâts au budget total, coût 100 jauge ; D/A/R 16/9/48, -27 en garde au contact. Charge confirmée puis choc de proximité ; dépense la jauge même si le départ est interrompu.

**Dossier clos — finalisation facultative.** Tela piège le module de simulation dans une barrière et récupère une donnée holographique. Durée proposée : 165 images, soit 2.75 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **129 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **297 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Ne pas lancer un projectile lent lorsque la réserve de charge est prête.
- Garder la charge au lieu de reculer sans fin.
- Punir l’onde de rupture si elle est employée hors portée.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Illium — terrasse.** Tela coupe une communication puis prend position.

> Tela Vasir : « La bonne question est de savoir qui vous a envoyé. »  
> Identifiant : `armax-tela-vasir-me2-intro-01`

**Rival / confrontation — Illium — terrasse.** Liara bloque l’accès à un terminal.

> Liara : « Vos accès s’arrêtent ici. »  
> Identifiant : `armax-tela-vasir-me2-rival-01`

> Tela Vasir : « Il reste toujours une autre entrée. »  
> Identifiant : `armax-tela-vasir-me2-rival-02`

Dépendance : Roster antérieur non récupéré ; à raccorder.

**Épilogue — Archive Armax.** Les dossiers obtenus restent des données du simulateur.

> Narration : « Tela obtient un résultat d’exercice. Les événements du Repaire du Courtier gardent leur continuité propre. »  
> Identifiant : `armax-tela-vasir-me2-ending-01`

Résultat de scène : Récompense documentaire Armax, aucune information canonique nouvelle.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- La Charge est une inspiration du rôle ; propriétés 2D inventées.
- Le finisher ne révèle aucun dossier canonique.

## 6.10. Balak

**ID :** `armax-balak-me1`. **Œuvre :** Mass Effect : Bring Down the Sky. **Période :** ME1 — X57, tenue de chef butarien. **Rôle :** Adversaire de contrôle. **Archétype proposé :** Pression lente et interruption.

### Identité, silhouette et disponibilité

Butarien à quatre yeux, visage et pilosité propres à Balak, armure de ME1 X57. Quatre yeux visibles ou correctement occultés par le profil ; aucune réduction en visage humain générique. Appui large.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me1`, détaillées en bibliographie.

**Portée de la référence inspectée :** Aucune vue de modèle final convenable inspectée ; une capture de ME3 ne peut pas certifier sa tenue ME1.

### Garde et ressources

Budget proposé : **1120 PV, 180 bouclier**, marche 3.9 unités/s ; saut 47 images logiques. Ces valeurs ne sont pas canoniques.

Arme contre le torse, coude haut ; garde basse lourde et lisible. Armure ne signifie pas invulnérabilité.

Intimidation mécanique : après lourd réussi, une marque de pression dure 120 images ; prochain projectile pousse davantage mais ne fait pas plus de dégâts. Aucun debuff de commandes du joueur.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Crosse sèche | 38 | 8 / 3 / 14 | -4 | 22 | Léger à portée très courte. |
| 2L | Talon bas | 34 | 8 / 3 / 15 | -5 | 22 | Bas léger lourd mais lent. |
| 5M | Revers butarien | 70 | 12 / 4 / 21 | -7 | 32 | Moyen frontal, épaules carrées. |
| 2M | Balayage d’arrêt | 64 | 13 / 4 / 22 | -8 | 32 | Bas moyen, peu d’avance. |
| 5H | Heurt d’armure | 110 | 19 / 5 / 30 | -14 | 40 | Lourd avançant de 0,2 unité. |
| 2H | Crosse de rejet | 100 | 17 / 5 / 31 | -15 | 40 | Anti-air large, retour particulièrement lent. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Tir de barrage court | 84 | 22 / 1 / 33 | -15 | 32 | Un projectile lourd ; ne remplit pas tout l’écran. |
| 214S | Poussée de rupture | 80 | 24 / 4 / 37 | -18 | 38 | Attaque de proximité qui pousse ; garde possible, aucune menace prise/bas simultanée. |
| 623S | Interruption X57 | 64 | 21 / 4 / 35 | -16 | 30 | Impulsion d’équipement fictive dans le simulateur ; interrompt le projectile faible au contact, pas les supers. |

### Prise, super et finalisation

**Saisie de contrôle — 6L+M.** 110 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Saisie des épaules puis déplacement latéral ; pas d’otage ajouté à l’image.

**Verrouillage X57 — 236236H.** 245 dégâts au budget total, coût 100 jauge ; D/A/R 22/8/50, -29 en garde au contact. Deux zones d’impact de simulation annoncées au sol, avec espace d’évasion entre elles.

**Accès verrouillé — finalisation facultative.** Balak active le verrou holographique d’une porte devant l’adversaire vaincu ; coupure sur le résultat. Durée proposée : 155 images, soit 2.58 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **144 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **333 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Profiter de sa marche lente et faire rater la crosse lourde.
- Sauter après lecture du projectile, pas au hasard.
- Sa marque pousse mais ne vole pas la garde : défendre normalement.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — X57 — installation.** Lecture d’un terminal puis rotation lente vers la ligne.

> Balak : « Vous êtes entré. Il faut maintenant trouver la sortie. »  
> Identifiant : `armax-balak-me1-intro-01`

**Rival / confrontation — X57 — installation.** Shepard constitue une dépendance antérieure à raccorder.

> Shepard : « L’exercice n’a pas d’otages. Seulement vous et moi. »  
> Identifiant : `armax-balak-me1-rival-01`

> Balak : « Alors ne perdez pas de temps. »  
> Identifiant : `armax-balak-me1-rival-02`

Dépendance : Roster antérieur non récupéré ; à raccorder.

**Épilogue — Console Armax.** Le bilan affiche seulement la maîtrise du terrain.

> Narration : « L’exercice se termine sans décision sur les civils de X57. Les choix narratifs restent ceux de la campagne. »  
> Identifiant : `armax-balak-me1-ending-01`

Résultat de scène : Aucun embranchement moral canonique réécrit.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Mécaniques de terrain et finisher sont abstractions de simulation.
- Ne pas illustrer ni intégrer des civils pris en otage dans le sprite individuel.

## 6.11. Randall Ezno

**ID :** `armax-randall-ezno-infiltrator`. **Œuvre :** Mass Effect Infiltrator. **Période :** Infiltrator — variante casquée référencée, changements moraux séparés. **Rôle :** Agent en rupture avec Cerberus. **Archétype proposé :** Tir et biotique à ressource.

### Identité, silhouette et disponibilité

Randall Ezno, variante CASQUÉE visible dans la capture Infiltrator inspectée : armure sombre, épaules jaunes Cerberus, casque et visière fermée. Aucun visage inventé, aucun remplacement par le turien Lucasc. Apparence et traces d’usure à comparer aux vues de cette variante précise. Corps entier, pieds visibles.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-infiltrator`, `bioware-infiltrator-2012-05-22`, `bioware-infiltrator-2012-04-12`, `press-randall-gameinformer`, détaillées en bibliographie.

**Portée de la référence inspectée :** Deux captures de gameplay de faible définition : joueur casqué, haut du corps de face et dos ; visage, jambes et état initial exact non validés.

### Garde et ressources

Budget proposé : **1000 PV, 200 bouclier**, marche 4.6 unités/s ; saut 43 images logiques. Ces valeurs ne sont pas canoniques.

Garde compacte de soldat avec main biotique libre ; aucun bouclier magique permanent. Variante de cicatrices enregistrée séparément.

Énergie biotique : 100 unités ; Leash coûte 30, Storm 40, recharge 0,5 unité par image après 90 images sans pouvoir. Un pouvoir sans énergie est refusé sans déclencher une animation trompeuse.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Crosse d’agent | 32 | 6 / 2 / 11 | -3 | 20 | Contact bref. |
| 2L | Coup d’appui | 28 | 6 / 2 / 13 | -4 | 20 | Bas léger du pied. |
| 5M | Coude de rupture | 60 | 10 / 3 / 18 | -6 | 30 | Moyen rapproché. |
| 2M | Balayage Cerberus | 54 | 11 / 3 / 19 | -7 | 30 | Bas moyen, silhouette claire. |
| 5H | Percussion d’évasion | 92 | 16 / 4 / 26 | -11 | 38 | Lourd à l’épaule ; pas de charge traversant l’écran. |
| 2H | Crosse ascendante | 86 | 14 / 4 / 28 | -13 | 38 | Anti-air à portée locale. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Salve brève | 76 | 19 / 1 / 30 | -13 | 30 | Projectile unique adapté au 2D ; les armes exactes restent des assets dédiés à produire. |
| 214S | Leash — adaptation | 64 | 23 / 4 / 35 | -17 | 38 | Attraction limitée à 0,5 unité, coûte 30 énergie, bloquée par la garde. Aucun contrôle forcé prolongé. |
| 623S | Storm — adaptation | 88 | 24 / 5 / 37 | -18 | 34 | Zone courte annoncée, coûte 40 énergie. Le nom renvoie à une inspiration documentée ; valeurs et forme 2D originales. |

### Prise, super et finalisation

**Neutralisation d’agent — 6L+M.** 100 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Saisie d’épaule, mise au sol et retour de garde.

**Sortie de complexe — 236236H.** 230 dégâts au budget total, coût 100 jauge ; D/A/R 18/9/47, -27 en garde au contact. Tir puis onde biotique ; coûte 100 jauge, sans consommer d’énergie biotique supplémentaire.

**Données libérées — finalisation facultative.** Randall coupe l’alimentation du mannequin de combat et transmet un paquet de données holographique. Durée proposée : 160 images, soit 2.67 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **125 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **292 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Faire dépenser l’énergie dans une garde ou hors portée.
- Rester au-delà de Leash puis punir sa récupération.
- Contester les tirs à moyenne portée avant la recharge biotique.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Complexe Cerberus — simulation.** Il referme un canal de communication avant la garde.

> Randall Ezno : « Le protocole s’arrête quand je le décide. »  
> Identifiant : `armax-randall-ezno-infiltrator-intro-01`

**Rival / confrontation — Complexe Cerberus — simulation.** Confrontation hypothétique avec Kai Leng, non affirmée dans Infiltrator.

> Kai Leng : « Votre dossier mentionne une rupture de commandement. »  
> Identifiant : `armax-randall-ezno-infiltrator-rival-01`

> Randall Ezno : « Ajoutez-y cette rencontre. »  
> Identifiant : `armax-randall-ezno-infiltrator-rival-02`

**Épilogue — Débriefing Armax.** La transmission est uniquement un score de scénario.

> Narration : « Le profil Infiltrator termine un parcours d’évasion. Les choix et l’apparence d’origine ne sont pas écrasés. »  
> Identifiant : `armax-randall-ezno-infiltrator-ending-01`

Résultat de scène : Variante de simulation distincte des décisions d’Infiltrator.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Impulsion, montée, sommet, chute, réception | 7 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Référence visuelle du lot : variante casquée ; l’identité faciale n’est pas représentée ni certifiée.
- La source BioWare corrobore la biotique, pas ces valeurs de jeu de combat.
- Leash et Storm sont des inspirations de gameplay signalées par une critique secondaire.
- Aucun personnage Rasa n’est retenu : identité non confirmée pendant la reprise.

## 6.12. Urdnot Bakara / Eve

**ID :** `armax-eve-me3`. **Œuvre :** Mass Effect 3. **Période :** ME3 — arc de Tuchanka, tenue de patiente/émissaire. **Rôle :** Soutien narratif et personnage de débriefing. **Archétype proposé :** Présence, médiation et mémoire du parcours.

### Identité, silhouette et disponibilité

Kroganne de grande carrure, visage d’Eve/Bakara selon la visibilité de la tenue. Modèle ME3 inspecté : robe et capuche bleu marine, bordures ivoire/or et intérieur bordeaux brun. Ne pas transformer la tenue en robe principalement rouge. Respecter masse des épaules, plis et pieds entièrement cadrés. Aucun fusil, lame, biotique ou armure militaire ajouté.

Dossier et scènes de soutien spécifiés ; aucun combat solo. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me3`, `overview-mass-effect-characters`, `community-eve-troodon80`, détaillées en bibliographie.

**Portée de la référence inspectée :** Rendu communautaire en pied, toutes les vues utilisées étant couvertes/masquées. Aucune reconstruction de visage découvert retenue comme canon.

### Soutien narratif

Eve ne reçoit pas de garde, de normaux, de spéciaux, de prise, de super, de finalisation ni de statistiques de duel. Elle n’est pas une cible de combo et ne peut pas devenir boss ou combattante solo par un simple changement d’interface.

| Action | Déclenchement | Effet de scène proposé |
|---|---|---|
| Briefing de l’épreuve | Valider une conversation | Explique l’objectif secondaire de protection, sans bonus de combat. |
| Écoute attentive | Attendre | Respiration et regard de suivi ; aucun projectile ni hitbox. |
| Prendre la parole | Choix de dialogue | Une ligne originale, sous-titrée, rend la transition de scène lisible. |
| Débriefing | Voir le résultat | Commente le résultat local avec conditions explicites ; aucun changement du génophage. |
| Consulter la mémoire | Ouvrir le dossier | Renvoie aux sources et distingue jeu d’origine et adaptation. |
| Sortie de scène | Fermer | Quitte le champ sans récompense répétable et sans sauvegarde de campagne mutée. |
### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Tuchanka — espace de repos.** Bakara écoute puis avance d’un pas, sans posture guerrière.

> Bakara : « Une épreuve n’a de sens que si quelqu’un peut en tirer une leçon. »  
> Identifiant : `armax-eve-me3-intro-01`

**Rival / confrontation — Débriefing Armax.** Le mot rival désigne ici un désaccord de briefing, sans duel ni ennemi à vaincre.

> Bakara : « Vous avez compté vos victoires. Avez-vous compté ceux qui sont rentrés ? »  
> Identifiant : `armax-eve-me3-rival-01`

**Épilogue — Tuchanka — espace de repos.** Retour calme vers le groupe hors champ.

> Narration : « Bakara conserve un rôle de voix et de mémoire. Le résultat d’une arène ne décide pas de l’avenir des krogans. »  
> Identifiant : `armax-eve-me3-ending-01`

Résultat de scène : Soutien narratif uniquement, aucune capacité offensive attribuée.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration, plis du voile et regard | 6 | À produire |
| Prise de parole, pauses et retour au repos | 8 | À produire |
| Écoute, hochement de tête et attention | 5 | À produire |
| Deux gestes de médiation sans pouvoir | 8 | À produire |
| Entrée et sortie, poids de la robe conservé | 8 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Aucun talent de combat individuel affirmé.
- La robe/voile d’Eve doit être comparée à des captures ME3 avant approbation.
- Le slot remplace Rasa, identité non corroborée, sans inventer de correspondance entre elles.

## 6.13. Courtier de l’Ombre — yahg

**ID :** `armax-shadow-broker-me2`. **Œuvre :** Mass Effect 2 : Lair of the Shadow Broker. **Période :** ME2 — forme yahg dans le repaire. **Rôle :** Boss de grand gabarit. **Archétype proposé :** Pression frontale et objectifs d’arène.

### Identité, silhouette et disponibilité

Yahg massif du Courtier de l’Ombre ME2, tête large et deux longues pointes crâniennes visibles dans la référence, plusieurs yeux et masse du torse distinctes d’un krogan. Tenue et avant-bras partiellement visibles ; bas des jambes, doigts et échelle relative à contrôler. Une silhouette entière demandée, sans prétendre disposer d’un modèle complet vérifié.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-me2`, `screenshot-shadow-broker-srcdn`, détaillées en bibliographie.

**Portée de la référence inspectée :** Capture redistribuée : tête, torse, avant-bras et deux longues pointes crâniennes ; yeux, doigts et partie basse restent à comparer.

### Garde et ressources

Budget proposé : **3200 PV, 400 bouclier**, marche 3.0 unités/s ; aucun saut de combat prévu. Ces valeurs ne sont pas canoniques.

Écran frontal clairement dessiné en calque séparé. Le boss ne fait pas de garde basse classique : les phases définissent les ouvertures, annoncées au joueur.

Tension d’arène : augmente après trois attaques lourdes ; déclenche l’ouverture du relais en phase 2. Les seuils ne provoquent ni guérison cachée ni annulation du KO.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Revers court | 48 | 10 / 3 / 18 | -6 | 24 | Impact de proximité, anticipation assez longue pour petit personnage. |
| 2L | Coup de pied de masse | 44 | 11 / 3 / 18 | -7 | 24 | Bas annoncé ; aucune hitbox sous tout le corps. |
| 5M | Poing du Courtier | 85 | 15 / 4 / 25 | -10 | 34 | Moyen frontal, portée limitée à 1,15 unité de conception avant mise à l’échelle. |
| 2M | Balayage de masse | 80 | 16 / 4 / 26 | -11 | 34 | Bas moyen, espace arrière libre. |
| 5H | Écrasement des bras | 130 | 24 / 5 / 35 | -18 | 42 | Lourd lent ; double dégât interdit sur les deux mains. |
| 2H | Rejet montant | 120 | 20 / 5 / 34 | -17 | 42 | Anti-air large mais direction fixe. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Percussion de façade | 120 | 28 / 6 / 48 | -25 | 40 | Charge courte, arrêt net ; brise un obstacle de simulation uniquement. |
| 214S | Heurt de bouclier | 95 | 26 / 5 / 46 | -24 | 42 | Impact frontal ; le retour découvre le flanc pendant la récupération. |
| 623S | Frappe de sol | 110 | 29 / 5 / 50 | -27 | 40 | Zone annoncée à terre, saut ou éloignement possible. Une seule zone dangereuse par attaque. |

### Prise, super et finalisation

**Rejet du géant — 6L+M.** 145 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Le boss soulève brièvement puis repousse, sans écrasement ; échappée obligatoire disponible.

**Autorité du repaire — 236236H.** 285 dégâts au budget total, coût 100 jauge ; D/A/R 30/12/60, -35 en garde au contact. Deux ondes de choc avec interstice ; pas de séquence imblocable ni de caméra coupant les esquives.

**Confidentialité rétablie — finalisation facultative.** Le yahg enferme la projection ennemie dans un champ de confinement ; disparition du décor virtuel, aucune mutilation. Durée proposée : 185 images, soit 3.08 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **190 dégâts**, coût 0 jauge. À portée proche, premier coup confirmé ; cancel sur contact uniquement. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

- **Conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **391 dégâts**, coût 100 jauge. Punition confirmée de 5H ; le deuxième mouvement doit connecter ; 100 points de jauge. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Séquence théorique ; fenêtres arithmétiques contrôlées, collisions et distances non testées.

### Contre-jeu à préserver

- Rester mobile et lire les annonces au sol.
- Punir les récupérations après charge ; ne pas frapper l’écran sans objectif.
- En phase 2, viser le relais accessible, puis convertir sa fenêtre de vulnérabilité.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Repaire — salle centrale.** Le géant se lève, laissant lire toute sa silhouette avant le HUD.

> Courtier : « Vous avez atteint la dernière porte. Elle n’ouvre pas dans les deux sens. »  
> Identifiant : `armax-shadow-broker-me2-intro-01`

**Rival / confrontation — Repaire — salle centrale.** Liara constitue la référence narrative, non une promesse d’asset disponible.

> Liara : « Votre monopole s’arrête à cette salle. »  
> Identifiant : `armax-shadow-broker-me2-rival-01`

> Courtier : « Tout dépend de ce que vous pourrez en sortir. »  
> Identifiant : `armax-shadow-broker-me2-rival-02`

Dépendance : Roster antérieur non récupéré ; à raccorder.

**Épilogue — Archive Armax — boss clear.** La base de données se referme avec un tampon simulation terminée.

> Narration : « Les données consultées appartiennent à l’exercice. Aucun secret nouveau n’est ajouté au canon. »  
> Identifiant : `armax-shadow-broker-me2-ending-01`

Résultat de scène : Déblocage d’un dossier d’entraînement proposé, sans effet de campagne.

### Trois phases du boss

Les pourcentages désignent la santé du boss. Le seuil inférieur déclenche une transition unique ; la phase suivante commence à ce même seuil sans double exécution.

**Lecture du géant — de 100 % à 66 %.** Alternance crosse/griffe et charge frontale ; 36 images minimum d’annonce pour les attaques de boss hors normaux.

Réponse du joueur : Éviter la ligne frontale, punir l’arrêt de charge pendant 50 images.

Transition : Seuil atteint : vider les projectiles actifs, retour centre, annonce 60 images sans dégâts.

**Écran de protection — de 66 % à 33 %.** Écran frontal après trois attaques ; expose un relais d’arène destructible. Briser le relais ouvre 150 images de vulnérabilité.

Réponse du joueur : Contourner les tirs, toucher le relais pendant l’armé du lourd ; aucune phase infiniment invulnérable.

Transition : Relais cassé ou seuil atteint : fermeture unique de phase, évènements idempotents.

**Circuit surchargé — de 33 % à 0 %.** Deux impacts au sol alternés, annonces 45 images ; pendant récupération, possibilité de toucher le boss directement.

Réponse du joueur : Se déplacer vers la zone non annoncée puis frapper ; pas de piège couvrant simultanément tout le terrain.

Transition : KO unique, entrée finisher optionnelle puis sortie ; pas de récompense répétée.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Entrée, maintien, sortie accroupissement | 4 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Six normaux : anticipation, contact, suivi, retour distincts | 24 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Prise et échappée ; synchronisation avec victime séparée | 8 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |
| Trois transitions de phase et écran frontal | 12 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Les trois phases reprennent des motifs de boss mais leurs seuils, relais et valeurs sont une adaptation Armax.
- Kit réservé au boss ; aucun tournoi standard avec 3200 PV.
- Animation de saut non applicable : déplacements du boss au sol ; aucun saut de combat inventé.

## 6.14. L’Archonte

**ID :** `armax-archon-andromeda`. **Œuvre :** Mass Effect Andromeda. **Période :** Andromeda — apparence kett de l’Archonte. **Rôle :** Boss de commandement et de réseau. **Archétype proposé :** Affrontement à objectifs, attaques commandées.

### Identité, silhouette et disponibilité

Archonte kett conforme au turnaround d’artiste inspecté : couronne en ANNEAU OSSEUX FERMÉ entourant la tête, pas une paire de cornes séparées. Face et armure bio-organique spécifiques, contrastes d’os clair et matière sombre. Corps entier sans trône, console ni autre personnage ; couleurs studio à comparer dans le contexte final.

Spécification uniquement ; aucun combattant Armax exécutable livré. La fiche de conception reste **Défini / Spécifié** ; la certification 1:1 reste **non acquise**. Références de départ : `canon-andromeda`, `author-archon-2017-04-04`, détaillées en bibliographie.

**Portée de la référence inspectée :** Turnaround complet crédité à l’artiste : face, profil et dos ; couronne en anneau osseux fermé, pas cornes séparées. Lumière studio, aucune certification du PNG généré.

### Garde et ressources

Budget proposé : **3000 PV, 500 bouclier**, marche 2.6 unités/s ; aucun saut de combat prévu. Ces valeurs ne sont pas canoniques.

Protection du dispositif de commande : pas une garde de boxeur. L’interface montre clairement si la cible est protégée ou vulnérable ; jamais de faux dégâts.

Contrôle de réseau : deux objectifs par ouverture. L’Archonte commande des dangers d’arène ; leurs effets sont des assets séparés. Pas de pouvoir biotique humain attribué ni de téléportation personnelle affirmée.

**Base du kit :** Commandes de dangers environnementaux proposées ; pas une liste de gestes de combat canoniques personnels.

### Six attaques normales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Intention et ouverture défensive |
|---|---|---:|---|---:|---:|---|
| 5L | Signal de proximité | 48 | 10 / 3 / 18 | -6 | 24 | Commande un impact local de simulation ; geste personnel purement indicateur. |
| 2L | Balise basse | 44 | 11 / 3 / 18 | -7 | 24 | Danger bas annoncé au sol, aucune frappe anatomique canonique prétendue. |
| 5M | Vecteur médian | 85 | 15 / 4 / 25 | -10 | 34 | Ligne courte issue d’un dispositif d’arène à produire. |
| 2M | Balayage de réseau | 80 | 16 / 4 / 26 | -11 | 34 | Commande de danger bas, trajectoire affichée avant activation. |
| 5H | Ordre de percussion | 130 | 24 / 5 / 35 | -18 | 42 | Annonce lourde de 24 images dans le kit minimal, 60 images en phase d’objectif. |
| 2H | Interception verticale | 120 | 20 / 5 / 34 | -17 | 42 | Danger anti-air issu du réseau, pas d’uppercut de l’Archonte. |

### Trois attaques spéciales

| Entrée | Mouvement | Dégâts | D / A / R | Garde | Hitstun | Fonction et contre-jeu |
|---|---|---:|---|---:|---:|---|
| 236S | Ordre de convergence | 110 | 29 / 5 / 50 | -26 | 40 | Deux marqueurs se rejoignent ; le centre reste évitable jusqu’à l’activation. |
| 214S | Impulsion de relais | 85 | 27 / 5 / 46 | -24 | 42 | Un relais émet une onde ; correspondance visible entre ordre et source du danger. |
| 623S | Interdiction verticale | 100 | 30 / 6 / 50 | -27 | 40 | Colonne annoncée, position figée 30 images avant activation ; aucun suivi tardif du joueur. |

### Prise, super et finalisation

**Champ de confinement — 6L+M.** 130 dégâts, départ 5, actif 2, récupération 30 images ; échec 34, échappée 10. Action du dispositif, pas prise anatomique personnelle : immobilisation courte échappable, relâchement latéral.

**Commandement d’Hélius — 236236H.** 275 dégâts au budget total, coût 100 jauge ; D/A/R 30/12/60, -35 en garde au contact. Trois zones apparaissent successivement, jamais simultanément sur toute la scène ; déplacement du joueur conservé.

**Liaison coupée — finalisation facultative.** Le réseau se fige et les lumières de commande s’éteignent. La projection adverse disparaît sans blessure montrée. Durée proposée : 190 images, soit 3.17 s. Zéro dégât additionnel ; résultat déjà fixé. Après résultat fixé ; aucune récompense exclusive, aucun effet sur la sauvegarde de campagne.

### Deux séquences de conception

- **Séquence de commandes — confirmation courte :** `2L > 5M xx 236S`. Budget théorique réduit : **183 dégâts**, coût 0 jauge. Enchaînement de conception pour le boss seulement ; danger suivant lancé lorsque le précédent a laissé une sortie sûre. Pas une chaîne de joueur garantie. Contre-jeu : Bloquer bas puis debout ; aucune projection automatique si la première touche est gardée. Budget théorique des commandes ; confrontation à objectifs, collisions, temporisations et sorties sûres non implémentées.

- **Séquence de commandes — conversion de ressource :** `5H xx 214S xx 236236H`. Budget théorique réduit : **376 dégâts**, coût 100 jauge. Enchaînement de conception pour le boss seulement ; danger suivant lancé lorsque le précédent a laissé une sortie sûre. Pas une chaîne de joueur garantie. Contre-jeu : Faire rater le lourd ; punir sa récupération. La super n’est pas une garantie de contact à distance. Budget théorique des commandes ; confrontation à objectifs, collisions, temporisations et sorties sûres non implémentées.

### Contre-jeu à préserver

- Prioriser interfaces et relais aux dégâts impossibles sur une protection active.
- Observer la source du danger, pas uniquement le geste du boss.
- Conserver une zone de retrait ; pas de poursuite lorsque la fenêtre se ferme.

### Introduction, rival et épilogue

Ces scènes sont écrites pour Armax et ne prétendent pas être des scènes ni des répliques officielles.

**Introduction — Meridian — simulation de réseau.** Le dispositif s’allume avant le boss ; objectifs et zones sûres apparaissent.

> Archonte : « Ce réseau répond à une volonté. Montrez-moi la vôtre. »  
> Identifiant : `armax-archon-andromeda-intro-01`

**Rival / confrontation — Meridian — simulation de réseau.** Ryder constitue la référence de scénario, avec choix de profil à raccorder.

> Ryder : « Vous voyez un trône. Je vois une connexion à couper. »  
> Identifiant : `armax-archon-andromeda-rival-01`

> Archonte : « Essayez donc de l’atteindre. »  
> Identifiant : `armax-archon-andromeda-rival-02`

Dépendance : Ryder et dispositif à produire/raccorder.

**Épilogue — Analyse Armax — réseau.** Le scénario affiche objectif résolu, pas mort ou conquête nouvelle.

> Narration : « L’épreuve clôt une simulation de réseau. La campagne Andromeda et le destin de Meridian restent indépendants. »  
> Identifiant : `armax-archon-andromeda-ending-01`

Résultat de scène : Résultat d’épreuve à objectifs, sans duel personnel canonique inventé.

### Trois phases du boss

Les pourcentages désignent la santé du boss. Le seuil inférieur déclenche une transition unique ; la phase suivante commence à ce même seuil sans double exécution.

**Contrôle du réseau — de 100 % à 70 %.** Le joueur doit activer deux interfaces de simulation pendant les annonces des attaques commandées. L’Archonte reste protégé tant que les deux objectifs ne sont pas validés.

Réponse du joueur : Annonces au sol de 60 images ; chaque canal d’interface demande 45 images et peut être repris sans perdre toute la progression.

Transition : Deux interfaces validées ouvrent 180 images de vulnérabilité ; seuil 70 % verrouille une seule transition.

**Relais contestés — de 70 % à 35 %.** Un seul gardien virtuel actif et un relais à neutraliser, en alternance ; leur ressource est indépendante des PV du joueur.

Réponse du joueur : Détruire le gardien ou profiter de son armé de 48 images pour atteindre le relais. Aucun projectile hors écran sans indicateur.

Transition : Relais neutralisé : ouverture de 180 images ; nettoyage des dangers avant changement de phase.

**Rupture de liaison — de 35 % à 0 %.** Trois commandes de réseau annoncées successivement ; après leur résolution, l’Archonte subit une fenêtre de 210 images où son dispositif peut être touché.

Réponse du joueur : Se déplacer entre deux zones sûres toujours visibles ; fin de combat déterminée sur objectif et seuil, sans lui inventer un duel de boxe.

Transition : Désactivation finale unique ; disparition des dangers, finisher de liaison optionnel, score figé.

### Animations à produire

| Famille | Dessins distincts minimaux proposés | Statut |
|---|---:|---|
| Respiration / garde neutre | 6 | À produire |
| Marche avant | 8 | À produire |
| Marche arrière | 8 | À produire |
| Départ, déplacement, freinage avant | 6 | À produire |
| Repli et arrêt | 5 | À produire |
| Garde debout et impact | 4 | À produire |
| Garde basse et impact | 4 | À produire |
| Trois spéciaux : départ, déclenchement, relâchement, retour | 18 | À produire |
| Super, entrée et récupération | 10 | À produire |
| Impacts haut/bas/aérien, recul et chute | 9 | À produire |
| Au sol, relevée, récupération | 6 | À produire |
| Entrée, rivalité, victoire et sortie | 10 | À produire |
| Finalisation sobre, raccord et sortie | 10 | À produire |
| Six gestes de commande, anticipation/activation/retour | 18 | À produire |
| Transitions et ruptures de liaison | 12 | À produire |

Ces minima ne constituent ni une séquence déjà dessinée ni une durée. Chaque anticipation, contact et retour doit être relu dans le contexte de son attaque ; une copie déplacée de la pose neutre ne remplit pas ce besoin.

### Réserves spécifiques

- Le kit est celui d’un boss de système ; il ne prouve pas treize techniques personnelles de l’Archonte.
- L’affrontement d’origine ne justifie pas d’en faire un duelliste standard.
- Boss non sélectionnable en Versus ; dispositifs, ennemis auxiliaires et phases restent tous à produire.

## 7. Décors, parallaxe et effets requis

Ce lot est consacré au casting. Les scènes citées fixent des besoins, sans annoncer de nouveaux stages produits. Une image de fond unique ne suffit pas à un décor de combat avec profondeur et interactions.

| Famille de scène | Plans minimum proposés | Contraintes de combat |
|---|---|---|
| Eden Prime / Virmire | Ciel lointain, relief, architecture moyenne, plan de sol, bordure avant | Sol continu, repères stables, couvertures décoratives distinctes des collisions. |
| Citadelle / Normandy | Fond architectural, circulation lointaine, structures moyennes, sol, premier plan | Éviter les colonnes qui cachent les mains ou la réception d’un saut. |
| Novéria / X57 | Volume distant, parois, dispositifs, sol, effets atmosphériques | Interdire le brouillard opaque devant les jambes ; annonces de boss au-dessus du décor. |
| Omega / Illium / Thessia | Skyline, bâtiments, passerelles, sol, éclairages avant | Pulsations contrôlées ; palettes compatibles avec les effets biotiques et les armures bordeaux. |
| Repaire du Courtier | Fond orageux, fenêtres, structure, sol, relais interactif séparé | Le relais de phase 2 est visible, touchable et n’est jamais peint seulement dans le fond. |
| Meridian | Fond lointain, architectures remnant, surfaces, interfaces séparées, dangers séparés | Au moins deux zones sûres lisibles ; caméra ne coupe ni objectif ni source des dangers. |

Les particules, projectiles, barrières et halos reçoivent leur propre durée, origine et ordre de rendu. Le bouclier doit laisser voir le début d’attaque. Les effets ne changent pas la silhouette de base d’un personnage entre deux images. Les animations de tissu, mandibules, respiration et regard font partie de la qualité vivante recherchée, mais doivent être dessinées ou articulées à partir de pièces adaptées ; un PNG neutre ne les contient pas automatiquement.

## 8. Suivi, critères de passage et priorités

Le JSON est la source de la conception et des identifiants. Le manifeste de production identifie les images réellement présentes, les sorties refusées ou manquantes et les contrôles exécutés. Le classeur exporte ces états ; il ne crée pas de disponibilité par sa propre présence. Les anciens lots non récupérés restent un besoin séparé, sans être comptés deux fois dans la production nouvelle.

| Étape | Preuve minimale | Statut compatible |
|---|---|---|
| Fiche de conception | Identité, œuvre, rôle, réserves, commandes et dépendances décrites | Défini / Spécifié |
| Dessin neutre obtenu | Fichier réel, dimensions et alpha mesurés, contrôle du cadrage | Prototype de l’asset seulement |
| Famille animée | États nommés, volumes stables, pivots, directions et transitions observés | Prototype ; aucune validation automatique |
| Intégration de jeu | Sélection → chargement → combat → KO → rematch → reprise exécutés | Intégré si tous les éléments du périmètre sont présents |
| Validation du périmètre | Gameplay contrôlé, revue à l’échelle réelle, comparaison de référence documentée | Validé pour le périmètre précis, sans généraliser à tout le personnage |

**P0 :** conserver le référentiel d’identité, obtenir les images neutres manquantes, vérifier leur cadrage et leur alpha, puis choisir un duel représentatif. Avant ce duel, définir les boîtes de poussée, collision et réception, une garde debout/basse, trois réactions d’impact et le KO. Un personnage ne doit pas être affiché comme prêt parce que sa miniature est belle.

**P1 :** réaliser les familles de normaux et spéciaux, stabiliser les pivots sur les silhouettes différentes, puis implémenter les ressources et les commandes. Tester les refus : pouvoir sans énergie, prise hors portée, super sans jauge, séquence interrompue, asset introuvable, manette déconnectée. Ajouter les scènes de rival uniquement lorsque leurs deux identités et leurs transitions sont présentes.

**P2 :** enrichir les états secondaires, les variantes d’époque explicitement séparées, les transitions faciales et de tissu, les arènes et le tournoi. Les grands boss viennent après la preuve d’un duel de base et d’un objectif d’arène reproductible. Le mode réseau, le rollback, les résultats partagés et les classements en ligne ne sont pas promis par ce lot.

### Contrôles documentaires de ce lot

Les identifiants, cardinalités, références internes des mouvements et budgets des séquences peuvent être contrôlés sans moteur. Cette vérification ne remplace pas les tests de contact, la perception des timings, les lectures de garde, l’équilibrage des gabarits, l’exécution d’une histoire complète ou une partie au clavier/manette. Aucun ancien résultat de CI du RPG n’est repris comme preuve de ce futur mode combat.

L’application de méthode suit les guides locaux `AGENTS.md`, `docs/GAMEDEV_GUIDANCE.md` et `docs/ART_BRIEFS.md`, puis les guides épinglés **create-game-assets** et **dialogue-systems**, révision `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`, consultés via les fichiers GitHub. Les autres moteurs cités dans les guides ne sont pas introduits dans le projet.

## 9. Bibliographie et limites de canon

Le dossier [SOURCES.md](SOURCES.md) et [canon-roster.json](canon-roster.json) précisent les images et les références effectivement examinées. Les œuvres primaires définissent la période et le sujet à consulter ; leur mention ne signifie pas qu’une partie native, tous les angles ou toutes les scènes aient été inspectés. Les sources web et les modèles communautaires ont des portées différentes. Les valeurs de combat, dialogues, modes, seuils, objectifs et noms de techniques de cette bible restent des créations d’adaptation.

- **`canon-me1` — Mass Effect (BioWare, 2007), including Bring Down the Sky.** Type : primary-work-anchor. game-not-launched-this-pass — Scene anchors: Nihlus/Anderson aboard Normandy SR-1; Saren organic form at Eden Prime/Virmire; Benezia on Noveria; Kirrahe at the Virmire STG camp; Balak at X57 final confrontation.
- **`canon-me2` — Mass Effect 2 (BioWare, 2010), including Lair of the Shadow Broker.** Type : primary-work-anchor. game-not-launched-this-pass — Scene anchors: Morinth at Afterlife/apartment during Samara loyalty mission; Tela Vasir investigation and combat on Illium; yahg final Shadow Broker encounter.
- **`canon-me3` — Mass Effect 3 (BioWare, 2012), including Omega.** Type : primary-work-anchor. game-not-launched-this-pass — Scene anchors: Eve in Priority: Sur'Kesh and Tuchanka; Nyreen in Omega; Kai Leng at Citadel/Thessia/Cerberus HQ.
- **`canon-andromeda` — Mass Effect: Andromeda (BioWare, 2017).** Type : primary-work-anchor. game-not-launched-this-pass — Archon in Hunting the Archon and final story encounters; primary author turnaround supplies the visual reference actually inspected.
- **`publisher-legendary-edition` — [EA — Mass Effect Legendary Edition](https://www.ea.com/games/mass-effect/mass-effect-legendary-edition).** Type : primary-publisher. page-read — Trilogy and DLC scope only; does not establish any individual costume.
- **`bioware-infiltrator-2012-05-22` — [BioWare — Mass Effect Infiltrates Android! (22 May 2012)](https://blog.bioware.com/2012/05/22/mass-effect-infiltrates-android/).** Type : primary-developer. page-read — Infiltrator product, Cerberus setting, gear/weapons/biotic gameplay and version 1.0.3 features; not exact outfit.
- **`bioware-infiltrator-2012-04-12` — [BioWare — Mass Effect Infiltrator Update (12 April 2012)](https://blog.bioware.com/2012/04/12/mass-effect-infiltrator-update/).** Type : primary-developer. page-read — Bonus playable turian prisoner is distinct from Randall; choice-dependent facial scars and biotic colours in update 1.0.3.
- **`author-archon-2017-04-04` — [Christopher Cao — Archon turnaround, Mass Effect Andromeda Art Dump](https://www.zbrushcentral.com/t/mass-effect-andromeda-art-dump/206455?page=2).** Type : primary-artist. page-and-image-viewed — Author-credited complete Archon turnaround, post 21, 4 April 2017. Image carries Christopher Cao / EA BioWare Montréal credit.
- **`press-benezia-gameinformer` — [Game Informer — How Mass Effect Legendary Edition Makes Boss Fights More Effective](https://gameinformer.com/2021/02/15/how-mass-effect-legendary-edition-makes-boss-fights-more-effective).** Type : secondary-game-screenshot. retrieved-image-viewed — Benezia headpiece, face and upper costume; cropped lower body.
- **`press-nihlus-softpedia` — [Softpedia — Mass Effect RPG Fans Meet Nihlus Kryik](https://news.softpedia.com/news/Mass-Effect-RPG-Fans-Meet-Nihlus-Kryik-67457.shtml).** Type : secondary-game-screenshot. retrieved-image-viewed — Nihlus and partial Anderson Normandy screenshot; lower legs not visible.
- **`press-kirrahe-rpgsite` — [RPG Site — Virmire choices and assisting Kirrahe's team](https://www.rpgsite.net/feature/11128-mass-effect-virmire-choices-who-to-send-take-dealing-with-wrex-and-assisting-kirrahes-team).** Type : secondary-game-screenshot. page-and-image-viewed — Kirrahe full body, cream/black palette; distinguishes orange-accented soldiers in the background.
- **`press-anderson-nerdstash` — [The Nerd Stash — Anderson or Udina for Council](https://thenerdstash.com/mass-effect-legendary-edition-anderson-or-udina-for-council/).** Type : secondary-game-screenshot. retrieved-image-viewed — Anderson ME1/Legendary Edition portrait, navy/gold collar and shoulder bars only.
- **`community-morinth-troodon80` — [Troodon80 — Mass Effect 2 Morinth Model Reference](https://www.deviantart.com/troodon80/art/Mass-Effect-2-Morinth-Model-Reference-275634055).** Type : community-model-render. image-viewed-page-403 — Full body civilian Morinth model reference. Extraction/modification status not independently audited.
- **`press-nyreen-pcgamer` — [PC Gamer — Mass Effect writer on creating a strong female character](https://www.pcgamer.com/mass-effect-3-writer-female-character/).** Type : secondary-press-screenshot. page-and-image-viewed — Nyreen screenshot and discussion quoting writer Ann Lemay. Original EA article now unavailable in this pass.
- **`screenshot-kai-leng-wallpapers` — [Wallpapers.com — Kai Leng](https://wallpapers.com/kai-leng).** Type : redistributed-game-screenshot. retrieved-image-viewed — Kai Leng close-up, face/visor/upper armour; no full body or weapon validation.
- **`press-tela-vasir-gamestar` — [GameStar — Mass Effect 2 gallery, Lair of the Shadow Broker screenshot](https://www.gamestar.de/galerien/mass_effect_2,92066.html).** Type : secondary-game-screenshot. page-and-image-viewed — Tela Vasir blue armour, light abdomen, gold/beige trim and magenta facial markings; torso only.
- **`press-randall-gameinformer` — [Game Informer — Not Quite Spectre Material (7 March 2012)](https://gameinformer.com/games/mass_effect_infiltrator/b/ios/archive/2012/03/07/not-quite-specter-material).** Type : secondary-review-and-game-screenshot. page-and-two-images-viewed — Randall as human Cerberus operative with biotics, and helmeted player upper-body screenshots. Complete lower armour unverified.
- **`community-eve-troodon80` — [Troodon80 — Mass Effect 3 Urdnot Eve Bakara Reference, image associated with Reddit discussion](https://www.reddit.com/r/masseffect/comments/1yqccl/someones_done_a_render_of_bakara_with_her_face/).** Type : community-model-render. retrieved-masked-model-image-viewed — Only the masked navy/gold/burgundy turnaround was used. The discussion title about an uncovered face does not establish that reconstruction as canon. Original source-page chain incomplete.
- **`screenshot-shadow-broker-srcdn` — [Shadow Broker screenshot hosted by ScreenRant CDN, discovered via article mirror](https://static0.srcdn.com/wordpress/wp-content/uploads/2021/06/Mass-Effect-2-Shadow-Broker.jpg).** Type : redistributed-game-screenshot. image-viewed-original-article-not-opened — Yahg head and upper body. Secondary image provenance is weaker than publisher footage.
- **`overview-mass-effect-characters` — [Wikipedia — List of Mass Effect characters](https://en.wikipedia.org/wiki/Characters_of_the_Mass_Effect_universe).** Type : tertiary-overview. page-read — Identity/navigation cross-check for Eve and Morinth; not a visual or ability specification.
- **`overview-infiltrator` — [Wikipedia — Mass Effect Infiltrator](https://en.wikipedia.org/wiki/Mass_Effect_Infiltrator).** Type : tertiary-overview. page-read — Advisor named Inali, not the unsupported proposed Rasa. Used for identity correction, not costume.
- **`canon-infiltrator` — Mass Effect Infiltrator — jeu.** Type : primary-work-anchor. Œuvre de référence identifiée ; captures partielles de presse et annonces BioWare consultées, pas de partie native lancée.

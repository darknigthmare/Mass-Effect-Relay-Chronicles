# Mass Effect — Armax Relay Clash
# Bible intégrée du mode combat 2D

**Révision documentaire du 27 novembre 2026 — Europe/Paris.**
**État : conception définie. Guide général et deux extensions intégrés à la bible ; la continuation courante est le lot 22, avec l’extension originale Nacre et un prototype local de duel. Les fonctions du moteur gardent leurs statuts propres.**

Cette bible applique désormais **68 rubriques** fournies par Darknigthmare à Armax, le mode annexe de **Mass Effect — Relay Chronicles** : **00–29** dans ce corps, **30–49** dans l'[extension équipes et bonus](EXTENSION_01_EQUIPES_ET_BONUS.md), **50–67** dans l'[extension déblocages](EXTENSION_02_DEBLOCAGES.md). Les [trois fichiers originaux](../guides/README.md) ont été récupérés intégralement et conservés sans modification. La [réconciliation](GUIDE_RECONCILIATION_2026-11-27.md) conserve les 30 associations et 90 critères historiques et relie les 38 rubriques supplémentaires. Ce document constitue le point d'entrée courant ; les lots conservent leur provenance et leurs résultats historiques.

Base de l’intégration initiale : **4befa64285080fe016d6ecd9424b00ab4d42509f**, branche **feat/armax-missing-lot13-20261124**, PR **#11**. La continuation lot 16 repart du catalogue lot 14 au commit **71955d9143562d6a44a8b8d48bc552978372bc1e**. Le RPG hôte conserve son ATB, son groupe de trois, son renderer Three.js 0.180.0 et ses sauvegardes. Le duel Armax possède son propre contrat.

## Documents associés

| Document | Usage |
|---|---|
| [Matrice courante des 68 rubriques](guide-coverage-2026-11-27.json) | Sources originales, numéros exacts, adaptation documentaire, critères et limites |
| [Associations historiques du guide](guide-associations.json) | Snapshot inchangé : 30 exigences et 90 critères ; son sous-index lot 16/192 est historique, sans autorité sur les comptes courants |
| [Extension 01](EXTENSION_01_EQUIPES_ET_BONUS.md) et [spécifications](extension-01-specs.json) | Sections 30–49 : taunts, sélection/désélection, assist/tag, supers et fins d'équipe, clashes, entités, dix bonus, archives |
| [Extension 02](EXTENSION_02_DEBLOCAGES.md) et [spécifications](extension-02-specs.json) | Sections 50–67 : découverte, droits, technique, compatibilité, règles ET/OU, modèles de soutien désactivés et reprise |
| [Originaux et provenance](../guides/source-manifest.json) | Trois fichiers immuables, 163 095 octets et empreintes vérifiées |
| [Associations du contenu](ASSOCIATIONS_CONTENU.md) et [index structuré](content-associations.json) | 216 fiches rattachées à leur rôle ; correspondances des kits, costumes, scènes, sous-zones et calques |
| [Règles communes RC-ARMAX-0.1](common-rules.json) | Contrat de conception normalisé, arbitrages entre les anciens lots |
| [Campagnes et scènes](CAMPAGNES_ET_SCENES.md) | Campagne globale distincte, six routes pilotes et briefs d'illustrations |
| [Fiches et liaisons](FICHES_ET_LIAISONS.md) | Modèles A–J adaptés, exemples remplis, dépendances et critères |
| [Sources et décisions](SOURCES_ET_DECISIONS.md) | Autorité des documents, sources officielles et limites de leur preuve |
| [Lot 04 : bible détaillée](../lot04/BIBLE_EXTENSION.md) et [fiches](../lot04/fighters.json) | 14 sujets, 13 kits de conception, récits et deux boss à phases |
| [Complément Grunt / Legion / Port Hanshan](../../combat-2d/CONTINUATION_2026-11-19.md) | Deux kits et une arène, à normaliser selon le contrat commun |
| [Lot 03 : bible de production](../lot03/Bible_Complement_Lot03.md) | Apparences, poses, masters et besoins de parallaxe |
| [Catalogue courant lot 22](../lot22/production-catalog.json) et [bilan](../lot22/README.md) | 326 fiches ; production canonique héritée et extension originale Nacre ; statuts artistiques et moteur distincts |
| [Catalogue historique lot 18](../lot18/production-catalog.json) | Instantané : 196 fiches, 150 avec image candidate et 46 sans ; 192 identités héritées conservées |
| [Livraison lot 16](../lot16/README.md), [manifeste](../lot16/manifest.json) et [associations artistiques](../lot16/bible-asset-associations.json) | 6 PNG natifs, dont 5 sélectionnés, pour 5 sujets ; sources, poses observées et réserves |
| [Bible du jeu hôte](../../DESIGN.md) | Association au RPG et séparation du contrat ATB |
| [Dossier Armax](../README.md) | Navigation dans les livraisons artistiques |
| [Vérification documentaire](verification-2026-11-25.json) | Couverture, liens, IDs, cohérence et limites |

**Lecture des statuts.** « Retenu » est une décision de conception, « Défini » décrit une fiche, « Prototype » un état de production. Aucun de ces termes ne signifie « jouable » ou « fidélité 1:1 validée ». Les exigences d'animation restent documentées pendant la phase de production de sprites fixes.

## Reprise courante — lot 22 : Les Dettes de Nacre

L’extension originale ajoute **10 combattants, 20 stages, 20 ennemis, 20 boss, 20 accessoires et 20 familles FX/projectiles**, soit 110 identités distinctes. Le [catalogue consolidé](../lot22/production-catalog.json) comporte 326 fiches ; ses 216 enregistrements canoniques sont conservés à l’identique. Les [associations du lot 22](../lot22/content-associations.json) rattachent les 110 créations aux modèles et rubriques existants sans élargir artificiellement les 68 rubriques / 204 critères du guide.

Le [dossier Nacre](../../../DLC/LesDettesDeNacre/README.md), la [bible des personnages](../../../DLC/LesDettesDeNacre/NACRE_ROSTER_BIBLE.md) et la [bible du monde](../../../DLC/LesDettesDeNacre/NACRE_WORLD_BIBLE.md) fixent la période 2185, les rivalités, les routes de huit rencontres, les quatre actes et les limites de lore. Il s’agit de créations de fan, pas d’éléments canoniques ou officiels.

Un simulateur de duel à 60 Hz est désormais présent dans le code. Son [rapport précis](../lot22/GAMEPLAY_IMPLEMENTATION.md), sa [couverture](../lot22/gameplay-coverage.json) et ses preuves de test priment pour décrire le sous-ensemble exécutable. Le texte documentaire ci-dessous conserve les kits cibles, y compris les fonctionnalités encore absentes. Les images ne prouvent ni animation complète, ni équilibrage, ni fidélité canonique 1:1.

## Reprise historique — lot 21

**216 fiches : 171 avec image candidate et 45 sans**. Le lot21 conserve 196 identités et en ajoute 20. Il livre **10 PNG : 7 récupérés et 3 générés**, pour 2 anciennes fiches complétées et 8 nouvelles identités illustrées. Dans le périmètre hérité, les manquants passent de 35 à 33. La fidélité 1:1 et l’intégration moteur restent non certifiées. Le [catalogue](../lot21/production-catalog.json), le [bilan](../lot21/README.md) et la [bible complémentaire](../lot21/BIBLE_COMPLEMENTS_LOT21.md) portent la reprise. Les30 exclusions parmi 45 fiches sans image restent respectées ; 15 fiches ouvertes comprennent 4 pistes de réemploi. Les 68 rubriques et 204 critères restent documentaires. Le [lot20](../lot20/README.md) conserve son résultat historique.

## Intégration historique — guides originaux, extensions et lot 19

La source originale du guide général est maintenant présente avec les deux extensions. Les **68 rattachements documentaires** et **204 critères** comprennent les 90 critères hérités conservés et 114 critères nouveaux. Les **40 scénarios d'acceptation** décrivent des tests à exécuter, sans résultat de gameplay déclaré. Les deux annexes donnent six taunts, quatre duos prioritaires, dix bonus, six zones d'archives et cinq règles de déblocage comme exemples de conception, sans les compter comme sprites ou animations produits.

Le [lot 19](../lot19/README.md) poursuit séparément les images candidates et leur suivi. Le [catalogue qu'il porte](../lot19/production-catalog.json) conserve les fichiers et comptes historiques de cette étape, tandis que les instantanés des anciens lots restent lisibles ci-dessous. La présence des extensions dans cette bible n'active ni tag, ni service de paiement, ni droit de joueur dans le moteur.

## Continuation artistique historique — lots 17 consolidé et 18

Le [lot 18](../lot18/README.md), son [catalogue](../lot18/production-catalog.json), ses [associations](../lot18/bible-asset-associations.json) et le [classeur](../lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx) constituent l'instantané précédent : **196 fiches, 150 avec candidat et 46 sans**. Douze PNG locaux y sont récupérés ; huit nouveaux PNG représentent sept sujets. Les trois fichiers sans attribution certaine et le sol R0 non sélectionné restent explicitement séparés.

Les nouveaux costumes suivent **B/J**, les personnages narratifs **B/F/J**, les composants du marché Urdnot **G/J**. Les deux calques et deux accessoires appartiennent à la même sous-zone ME2. Leur géométrie et leurs raccords restent des prototypes dérivés du master interne, sans nouvelle fidélité 1:1 ni action ajoutée.

L’[annexe narrative](../lot18/BIBLE_COMPLEMENTS_LOT18.md) développe quatre routes supplémentaires — Grunt, Legion, Tela Vasir, Morinth — avec vingt rencontres, douze scènes, huit issues et trente-deux briefs. Elle préserve les six routes et les trente-six briefs antérieurs. Le terme **Neutralisation décisive**, la séparation des périodes et les pouvoirs documentés restent communs. Aucune nouvelle image de campagne n’a été produite ; l’essai de fin Grunt a été refusé sans relance.

## Continuation artistique historique — lot 16 du 25 novembre 2026

Le [lot 16](../lot16/README.md) produit **6 PNG natifs, dont 5 sélectionnés, pour 5 sujets fixes** : les calques PH-20, PH-30 et PH-40 de Port Hanshan, le fauteuil de l’Homme Trouble et sa pose assise ME2. Les trois calques et le fauteuil ajoutent **4 fiches** ; la pose assise complète `chr_me2_illusive_man`, déjà illustré au lot 13. Le sol PH-40 R0 est conservé comme révision écartée.

**Bilan historique lot 16 : 192 fiches, 132 avec image candidate et 60 sans ; 231 originaux distincts dans le corpus, soit 225 antérieurs et 6 nouveaux.** Le [suivi des manquants](../lot16/MANQUANTS_2026-11-25.md), le [classeur](../lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx) et sa [vérification](../lot16/workbook-verification.json) distinguent les unités comptées. Les **55 entrées de catégorie stage** comprennent **52 masters de sous-zones historiques et 3 calques**, rattachés à la composition documentaire `ME1-VS-PORT-HANSHAN-REF-01`.

**Usage dans notre jeu de combat :** les calques relèvent des fiches **G/J**, avec hypothèses de calage et de parallaxe à contrôler. Le fauteuil et la pose assise relèvent des fiches **B/F/J** pour le briefing et la présence narrative ME2. Ils n’ajoutent aucune action, capacité ou sélection de combattant. La [revue de Port Hanshan](../lot16/qa/port-hanshan-independent-review.json) conserve les franges et la largeur de PH-40, inférieure d’un pixel à celle de PH-20/PH-30. La [revue de l’Homme Trouble](../lot16/qa/illusive-man-independent-review.json) conserve les réserves de géométrie, de visage et d’alpha ; le fauteuil vide et celui de la pose assise ne sont pas directement superposables. Tous restent **Prototype**, sans fidélité 1:1 ni intégration moteur validées.

Les **113 PNG annoncés au lot 15 ne sont ni récupérés ni publiés** ; le [constat de reprise](../lot16/RECUPERATION_LOT15.md) les exclut du corpus présent. Les **36 briefs narratifs** restent conservés comme besoins de conception. Les cinq associations du lot 16 ne déclarent aucun de ces plans entièrement illustré.

## Continuation artistique historique — lot 14 du 25 novembre 2026

Le [lot 14](../lot14/README.md) matérialise **20 sujets fixes en 21 PNG natifs** et conserve les 172 identités héritées. Quatre anciens manquants sont illustrés ; seize entrées sourcées s’ajoutent au catalogue. Les [liaisons par actif](../lot14/bible-asset-associations.json) raccordent les fiches B/C/G/J aux exigences du guide. Les 30 rubriques et 90 critères de la matrice initiale conservent leur sens.

**Usage dans notre jeu de combat :** les CAT6 sont des sprites d’ennemis candidats ; Kenson et Suvi restent narratifs ; les sous-zones Armax/Omega sont des masters de composition ; les effets, projectiles et accessoires constituent des composants visuels à associer aux actions après contrôle. L’effet percussif est proposé pour Grunt, le traceur chaud reste d’attribution incertaine et Throw est seulement une famille visuelle candidate pour le Recul biotique de Morinth. Les autres fichiers ne reçoivent aucun porteur inventé.

**Bilan historique du lot 14 : 188 fiches, 128 avec image et 60 sans ; 225 originaux dans le corpus à cette étape.** La [revue indépendante](../lot14/independent-art-review.json) et le [classeur](../lot14/Mass_Effect_Armax_Suivi_Lot14_2026-11-25.xlsx) documentent les réserves. Fidélité 1:1, paramètres moteur, phases d’action, couches de scène et autres poses restent ouverts. Les 36 plans narratifs ne sont pas déclarés illustrés par ce lot.

## Associations consolidées du contenu

L’[index de contenu](ASSOCIATIONS_CONTENU.md) rattache chacune des **216 fiches** aux modèles A–J et aux rubriques pertinentes du guide. Il distingue les **9 combattants candidats, 22 boss candidats, 42 adversaires et 25 soutiens narratifs** du suivi, puis les **38 costumes, 52 masters de sous-zones, 5 calques, 15 effets/projectiles/accessoires et 8 armes**. Ces rôles décrivent la production prévue ; ils ne constituent pas un roster jouable.

Les **14 fiches de conception du lot 04** et les **deux compléments Grunt/Legion** sont accessibles dans ce même index, sans les ajouter aux 216 lignes. Les correspondances exactes et les identifiants documentaires restent distincts. Kai Leng et Balak présentent une divergence entre usage « boss candidat » du catalogue et sélection Versus de leur fiche ; elle est exposée avant toute décision d’implémentation.

Pour les décors, les **18 associations précises concernant 16 des 52 sous-zones** sont conservées. Les trois calques de Port Hanshan et les deux calques de Tuchanka ajoutent des relations de composant à leur composition documentaire, sans créer de nouvelle arène. Les avertissements de non-équivalence restent des restrictions. Le [rapport historique de réconciliation](verification-content-associations-2026-11-25.json) conserve son périmètre de 188 fiches ; la [vérification du lot 18](../lot18/verification.json) conserve les preuves de cette étape. Les contrôles de la reprise courante sont liés au [lot 21](../lot21/README.md).

<a id="g00"></a>
## 00. Utilisation, priorités et autorité

La demande spécifique du projet prime ; le guide général complète les contrats locaux. En cas de contradiction entre documents historiques, les arbitrages de **common-rules.json** et de cette bible s'appliquent à la conception courante. Les timings et traits propres à une action restent dans sa fiche, sauf remplacement explicite. Les règles du RPG ne sont jamais copiées implicitement dans le duel.

P0 établit un combat complet, la lisibilité, l'entraînement, l'isolation des états et les vérifications. P1 couvre histoires individuelles, campagne globale, tournoi, boss, Boss Rush, stages vivants/statiques et liaisons autorisées. P2 contient les extensions retenues pour étude ; leur présence au guide n'autorise pas à les annoncer réalisées.

Pour chaque lot : choisir l'exigence du guide, retrouver les IDs existants, préciser les dépendances et le livrable, produire selon la phase demandée, puis consigner les preuves propres à ce livrable. Les tâches différées restent dans les associations. La source utilisateur est identifiée par son nom et sa version ; cette adaptation ne prétend pas restaurer la bible historique de 99 pages signalée manquante.

<a id="g01"></a>
## 01. Identité et périmètre

**Promesse :** faire reconnaître le personnage Mass Effect dans sa manière de combattre, avec un duel latéral lisible, des décisions tactiques et un récit personnel cohérent. Les piliers sont l'identité fidèle, des réponses adverses compréhensibles, des campagnes situées, des arènes habitées et une production traçable.

Le format cible est un duel 2D/2,5D, sprites 2D HD/UHD, caméra adaptée au renderer existant. UHD désigne une exigence artistique à contrôler à la taille d'affichage ; une dimension native non atteinte ne sera pas annoncée comme produite. Le web et l'enveloppe PC existante sont les cibles du projet ; aucune console, version mobile ou certification supplémentaire n'est acquise.

Le périmètre documentaire conserve ME1, ME2, ME3, leurs DLC, Andromeda, Galaxy, Infiltrator, romans, comics, Paragon Lost et les autres dossiers déjà retenus dans les [catalogues d'univers](../../universe/README.md). Les contenus coupés, extrapolations et rencontres alternatives gardent leur statut. Ce périmètre ne transforme pas les 172 lignes du suivi lot 13 en inventaire exhaustif de toute la franchise.

<a id="g02"></a>
## 02. Fidélité au lore

Chaque fiche porte œuvre, édition, période, variante, source narrative, référence visuelle et niveau de certitude. Employer cinq qualifications : **canon attesté**, **adaptation jouable**, **original compatible**, **alternatif / crossover**, **à confirmer**. Une même action peut avoir une capacité attestée, une commande inventée et des chiffres entièrement adaptés.

Les sources ont des rôles différents. Un guide de costume peut documenter une armure sans prouver un pouvoir. Une scène établit une relation sans valider des timings. Les valeurs des jeux de rôle ne deviennent pas des frame data. Les sources officielles et les limites des références secondaires restent rattachées à l'entrée concernée.

Ne pas fusionner Saren vivant et sa forme finale, Morinth civile et son apparence imitant Samara, un Shepard de classe Soldat et un kit biotique, ou plusieurs périodes de Ryder. Un costume reste lié à une version. Les connaissances des protagonistes s'arrêtent à leur période ; le catalogue du joueur peut connaître davantage que les personnages.

La ressemblance 1:1 exige une comparaison effective. Les marqueurs **fidelity1to1Validated=false** et les réserves des lots restent inchangés par cette intégration documentaire.

<a id="g03"></a>
## 03. Personnages, variantes et costumes

Conserver les identifiants et leur espace de noms : **armax-saren-me1** désigne une fiche de kit, **chr_me2_legion_standard** une entrée de suivi d'image, **ME2-CHR-LEGION** une identité du catalogue d'univers. Leur association est déclarée ; ils ne sont pas interchangeables et ne deviennent pas trois personnages distincts.

Chaque sujet indique son rôle : candidat jouable, boss, adversaire, soutien, PNJ ou présence narrative. Eve/Bakara reste un soutien. Le yahg et l'Archonte restent hors tournoi standard ; Bénézia attend une variante normalisée. L’[Homme Trouble](ASSOCIATIONS_CONTENU.md#chr_me2_illusive_man) conserve son corps debout lot 13 et dispose désormais d’une pose assise candidate. Son [fauteuil isolé](ASSOCIATIONS_CONTENU.md#prop_me2_illusive_man_chair) est une fiche d’accessoire narratif distincte, associée en B/F/J ; géométrie et alpha restent sous réserve, sans action de combat déduite.

Séparer identité, période, classe/profil, transformation, costume et palette. Une nouvelle apparence ne modifie pas automatiquement les collisions ou les pouvoirs. Un changement de morphologie ou d'arme exige une vérification ; un changement substantiel de kit devient une variante explicite.

La fiche de chaque candidat relie sprite de base, portrait de sélection, HUD, visuel versus, armes, effets, présentations, route et illustrations. Les variantes de Shepard et Ryder sont filtrées par règles de sélection, jamais déduites du seul costume.

<a id="g04"></a>
## 04. Fondations et résolution des contradictions

**RC-ARMAX-0.1** conserve la simulation à 60 Hz, L/M/H/S, la jauge 0–300, les manches de 99 secondes et deux manches gagnantes. La garde, les délais et les coûts sont des propositions d'équilibrage du projet.

| Divergence observée | Décision courante |
|---|---|
| T technique dans Grunt/Legion ; S dans lot 04 | S est la notation commune ; T est un alias historique |
| Déprojection de 8 ou 10 pas | 10 pas communs ; protection contre les prises 8 pas après relevée |
| Gains de jauge et réductions différents | Contrat lot 04 commun : gains 8/4/3/5, plafond 30 par chaîne et par joueur ; réduction 100/80/65/50/35/25 |
| Chaîne L→M→H du complément ; conversions spécifiques du lot 04 | Conversions du lot 04 communes ; anciennes chaînes Grunt/Legion à remapper et vérifier |
| Supers à 100 ou 200 | 100 par défaut ; Brèche décisive et Solution de tir restent à 200, niveau II déclaré |
| Deux systèmes de protection décrits | Bouclier de base commun ; protections personnelles explicitement bornées et non cumulées sans règle |

Le bouclier commun absorbe avant les PV et récupère un point par pas après 300 pas hors échange, dans la limite initiale. Un impact gardé relance ce délai. Cette protection normalisée ne prétend pas rendre physiquement identiques bouclier cinétique, barrière biotique et armure.

Le grattage des spéciaux/supers vaut 5 % arrondis vers le bas, sans KO final ; les normaux ne grattent pas. La jauge n'est jamais gagnée sur une provocation, un finisher, une super, un soutien ou une attaque manquée. Le JSON précise l'attribution des gains afin d'éviter les doubles récompenses.

Une égalité exacte ou un double KO ne donne pas de point de manche : nouvelle manche aux valeurs initiales. Au temps, comparer d'abord les ratios de PV puis de bouclier. Une déconnexion locale suspend le jeu avec réattribution explicite. Ces règles demandent leur vérification future ; aucune harmonisation du runtime n'est revendiquée.

<a id="g05"></a>
## 05. Movesets, pouvoirs et ressources

Les kits du [lot 04](../lot04/fighters.json) et du [complément](../../combat-2d/CONTINUATION_2026-11-19.md) sont les bases d'auteur. Ajouter aux fiches ce que le guide exige sans effacer leurs réserves : rôle tactique, conditions, démarrage/actif/récupération, volumes, déplacements, ressources, résultats en touche/garde/contre/échec, annulations, interactions, signaux et preuves.

Le plan de jeu doit couvrir approche, contrôle de distance, réponse aérienne, défense, projection, coin et punition d'une attaque manquée. Un personnage peut être faible dans une situation ; il doit conserver une réponse prévue. Ne pas attribuer une omni-lame, une Charge biotique, un camouflage ou un piratage à tous les porteurs d'un omni-tool.

| Cas déjà documenté | Traduction et limite |
|---|---|
| Grunt ME2 | Claymore chargé/vide, rechargement interruptible, percussion physique ; la Percée krogan n'est pas la Charge biotique |
| Legion ME2 | Tir préparé et drone distinct, un propriétaire, une durée et des PV ; l'Intrusion ciblée vise seulement un soutien piratable |
| Nyreen ME3 | Protection temporaire et contrôle biotique selon son kit ; aucune immunité permanente ni allié tirant invisiblement |
| Saren ME1 | Tir et repositionnement du kit ; noms et commandes conçus pour Armax, pas techniques officielles prétendues |
| Archonte Andromeda | Commandes de réseau et objectifs d'arène ; pas de biotique humaine ou de téléportation personnelle ajoutée |

La chaleur, les clips, les charges et les recharges sont des ressources propres à l'arme/version, intégrées à la jauge commune sans la remplacer. Les différences ME1/ME2 et les changements d'édition sont documentés par EA ; le profil de combat doit préciser la normalisation choisie. Les profils de Ryder et leurs adaptations se traitent séparément des classes de Shepard. Voir [sources](SOURCES_ET_DECISIONS.md).

Amorçage et détonation biotique/technologique ne deviennent possibles que pour les actions et versions qui les justifient. Leur traduction Armax consomme le budget de combo existant. Un multi-impact conserve un budget total ; il ne multiplie pas les dégâts, les gains ou les déclenchements par effet visuel. Le coefficient et la limite de six avancent une fois par action offensive distincte, au premier contact dommageable ; les sous-impacts partagent ce budget et ne prennent pas de rang supplémentaire. Toutes les chaînes historiques restent des hypothèses jusqu'à mesure du recul, de la portée et du hitstun.

<a id="g06"></a>
## 06. Supers, neutralisations et victoire

Le nom de famille retenu est **Neutralisation décisive**, une appellation originale du projet adaptée au vocabulaire militaire de Mass Effect. Les noms individuels existants sont conservés : **Dernier avertissement** pour Saren, **Zone évacuée** pour Nyreen, **Volonté coupée** pour Morinth ou **Liaison coupée** pour l'Archonte. Ils ne sont pas présentés comme des termes officiels.

La super intervient pendant le combat et consomme sa jauge. La neutralisation intervient uniquement **après résultat final fixé**, dans une fenêtre de 120 pas, avec vainqueur et cible compatibles ; temps écoulé, égalité, forfait, abandon et déconnexion ne l'autorisent pas. Elle inflige zéro dégât de gameplay, ne rapporte ni jauge ni récompense exclusive. La victoire est une présentation brève. L'outro raconte la conséquence d'une route : ces quatre objets ont leurs propres fiches et IDs.

| Cible ou contexte | Présentation admissible |
|---|---|
| Humanoïde compatible | Séquence personnelle cadrée sur les bons ancrages |
| Synthétique ou machine | Désactivation/confinement adapté à sa structure, sans anatomie humaine plaquée |
| Géant ou installation | Coupure du système ou plan large de fin d'objectif ; aucune prise forcée à l'échelle humaine |
| Projection de simulation | Dissipation visuelle, résultat inchangé |
| Allié ou route non létale | Désarmement, immobilisation ou extraction compatibles avec la scène |
| Cible sans réaction disponible | Victoire sobre de repli ; pas de corps étiré ou d'image absente |

Les réglages désactivé/sobre/complet modifient la mise en scène. Le tournoi choisit sobre ou passage immédiat. L'option « complet » ne signifie pas qu'une nouvelle séquence graphique est produite ; elle suit le ton de chaque personnage et les assets effectivement validés. Le passage abrégé ne redéclenche ni KO ni déblocage.

Une neutralisation de stage exige sa propre fiche et une zone d'arrivée validée. Une conclusion arcade ne réécrit aucune mort, relation ou issue du RPG.

<a id="g07"></a>
## 07. Présentation et relations

La matrice de relations qualifie **allié, rival, ennemi, mentor, inconnu, rival de simulation ou rencontre incompatible** avec œuvre et période. Une opposition tactique inventée ne devient pas une inimitié canonique. Grunt/Legion conservent leur rivalité de simulation ; les récits du lot 04 gardent leurs réserves.

Prioriser les dialogues des rivaux, partenaires attestés et rencontres de campagne. Pour les autres paires, prévoir des lignes génériques fidèles plutôt qu'une promesse de scène unique pour chaque combinaison du roster. Les miroirs et variantes d'un même personnage sont annoncés comme simulation.

Arrivée, garde initiale, provocation, victoire, défaite et sortie doivent exprimer la personnalité. Utiliser des IDs de répliques localisables et des conditions narratives ; ne pas intégrer les textes dans les sprites. Les voix, mouvements et portraits disposent de statuts propres. Les scènes ne supposent ni voix officielle disponible ni animation livrée.

<a id="g08"></a>
## 08. Routes individuelles

Chaque combattant éligible reçoit une route versionnée, avec période, motivation, rival et conclusion. Le contrat existant de **cinq combats** s'exprime en **sept temps narratifs** : situation ; déclencheur ; trois confrontations d'apprentissage ; rival ; revers ; confrontation décisive ; outro. Les temps narratifs et les combats ne sont pas des unités de production interchangeables.

Chaque rencontre indique personnage/version, adversaire, motif, stage ou sous-zone manquante, règle, objectif, dialogue, conséquence et checkpoint. Les combats entre alliés sont des exercices ou désaccords explicitement qualifiés. L'arcade hypothétique n'autorise pas à faire survivre un personnage dans une campagne canonique.

L'[annexe narrative](CAMPAGNES_ET_SCENES.md) développe six routes pilotes à partir des récits du lot 04 et prépare leurs intros, rivaux et outros. Les autres routes restent dans leurs fiches avec besoins à compléter. Les six pilotes ne valent pas six personnages jouables ni achèvement de toutes les histoires du roster.

La reprise se fait entre rencontres sur un état Armax distinct, avec difficulté, règle, scène vue et récompense déjà attribuée. Revoir une illustration dans la galerie n'applique pas une seconde fois sa conséquence.

<a id="g09"></a>
## 09. Campagne globale distincte

**Protocoles de relais** est le titre de travail original de la campagne cadre. Elle s'organise en dossiers de mission et chapitres alternant points de vue, objectifs et débriefings. Son intrigue commune porte sur les décisions de commandement et leurs conséquences, avec progression et conclusion propres. Elle ne consiste pas à juxtaposer les fins des routes individuelles.

Les volets **Voie lactée** et **Andromeda** restent séparés. Le menu peut les présenter ensemble comme collection hors diégèse ; il n'affirme pas que l'Armax historique permet à Shepard de rencontrer physiquement Ryder ou de connaître les événements futurs d'Héléus. Le cadre de simulation est une création du projet, pas une nouvelle technologie canonique.

L'annexe décrit les chapitres, personnages, objectifs, conséquences, scènes et raccords manquants. Un chapitre doit fonctionner du briefing à sa conclusion avec reprise. Les versions d'un même personnage, les morts et les conditions d'alliance sont fixées par dossier.

Le format P1 est cinématique, en chapitres et combats/objectifs. Exploration libre, hub social Armax, coopération et progression RPG supplémentaire sont différés P2. Le jeu hôte possède déjà son exploration et sa personnalisation ; un éventuel raccord nécessite un contrat spécifique et ne transfère pas les bonus dans le Versus normalisé.

<a id="g10"></a>
## 10. Illustrations de campagne

Chaque scène reçoit une fiche avant génération : fonction narrative ; époque ; personnages/version/costume ; lieu exact ; état du monde ; action ; émotion ; cadrage ; regard ; lumière ; accessoires ; dialogues séparés ; transition ; sources ; statuts et dépendances.

L'intro montre une situation et une motivation, la scène de rivalité rend le conflit perceptible, l'outro montre une conséquence. La même pose devant trois fonds ne satisfait pas ces fonctions. Les six routes pilotes prévoient des planches distinctes ; leurs images restent à produire.

Conserver une feuille de continuité : arme portée, côté des marquages, dégâts, blessures, éclairage, positions et état du décor. Les personnages peuvent partager une illustration narrative, tandis qu'un sprite autonome conserve un seul sujet par fichier. Le texte, les sous-titres et les logos restent séparés pour la localisation.

Prévoir une composition lisible en 16:9 avec zone de sous-titre réservée ; enregistrer les dimensions natives obtenues. Une demande de calques indique l'usage réel : parallaxe légère, recadrage ou montage. Aucun découpage arbitraire d'un master aplati n'est annoncé comme scène animée complète.

<a id="g11"></a>
## 11. Boss, machines et Boss Rush

Les fiches différencient duel, rival/élite, boss à phases, géant, machine et objectif scénarisé. Les phases du yahg et de l'Archonte du lot 04 sont les premières bases ; Atlas, Hydra et autres figures du catalogue ont un rôle de conception à préciser avant d'être sélectionnables.

Chaque boss documente échelle, cadre, télégraphes, fenêtres de réponse, objectifs, échec, reprise et récompense. Une attaque à distance obligatoire demande une solution pour chaque kit autorisé ; un combattant de contact doit pouvoir rejoindre un point faible ou remplir un objectif équivalent. Une immunité de boss est annoncée et compensée par une réponse réelle.

**Boss Combat** sélectionne une rencontre. **Boss Rush** enchaîne une liste versionnée de rencontres validées. Proposition initiale : ordre fixe par dossier, trois tentatives pour la série, reprise entre boss, 25 % des PV maximaux restaurés après victoire sans dépasser le maximum, protection restaurée et jauge remise à zéro avant le suivant. Ces paramètres originaux sont à équilibrer ; score et temps conservent règle, difficulté et version.

Les phases ne se déclenchent qu'une fois, le KO final reste prioritaire et les projectiles résiduels sont résolus avant transition. Un boss n'obtient pas une version Versus par simple réduction de taille ou de PV.

<a id="g12"></a>
## 12. Modes et périmètre

| Mode | Décision | Livrable attendu |
|---|---|---|
| Versus local, IA libre | Retenu P0 | Sélection, match, résultat, revanche, retour |
| Entraînement et tutoriels | Retenu P0 | Situation reproductible, diagnostic et progression pédagogique |
| Routes individuelles / Arcade narratif | Retenu P1 | Intro, cinq combats, rival et outro propres |
| Campagne globale | Retenue P1 | Chapitres reliés avec intrigue et état propres |
| Tournoi local 4/8/16 | Retenu P1, engagement existant | Tableau, tirage, forfait, reprise et vainqueur unique |
| Boss Combat / Boss Rush | Retenus P1 | Objectifs, phases, reprise et bilan |
| Galerie / dossiers / codex | Retenus P1 | Contenus disponibles, sources et consultation sans mutation de campagne |
| Survie, contre-la-montre, défis spécialisés | Différés P2 | Règles et coûts de production séparés |
| Assistances et tag à deux | Retenus P1 de conception depuis l'extension 01 | Profils distincts, coûts, KO/timeout et état du partenaire définis dans RC-ARMAX-TEAM-0.1 ; aucune implémentation revendiquée |
| Hybride assistance/tag | Retenu P2, après les profils séparés | Combinaisons d'états, budgets et scénarios de collision à tester |
| Coopération, quatre joueurs, plusieurs plans | Différés P2 | Aucun transfert implicite depuis le module à deux ; le drone propre à Legion reste dans son kit |
| Parties privées en ligne, classement, crossplay | À décider P2 ; contraintes d'état anticipées P0 | Architecture, services et tests nécessaires avant engagement |

Le tournoi est retenu dans ce projet même si le guide générique le présente comme extension. Chaque mode a sa propre condition de disponibilité. Un menu, une fiche ou un PNG ne constitue pas un mode terminé.

La priorité P2 historique de toutes les équipes est conservée dans l'ancien snapshot des associations ; le tableau courant et l'[extension 01](EXTENSION_01_EQUIPES_ET_BONUS.md#g33) explicitent l'évolution ASSIST/TAG vers P1. Cette priorité porte sur la conception et l'ordre futur d'intégration, sans prétendre que les modes soient déjà jouables.

<a id="g13"></a>
## 13. Arènes et lisibilité

Chaque stage conserve son ID, son lieu, son opus, son édition et la sous-zone réellement représentée. La ligne **stg_mea_aya_docks** suit une vue de passerelle du Tempest ; elle ne fournit ni tous les quais, ni le vaisseau complet. **stg_me1_virmire_breeding_lab** ne remplace pas automatiquement une plateforme extérieure.

La caméra de duel et le terrain latéral sont des adaptations déclarées. Définir sol, limites, départs, hauteur de saut visible, profondeur, contraste et marge de caméra. Les pieds, armes et projectiles restent lisibles ; les collisions sont des données, jamais déduites des pixels d'un fond.

Réutiliser les plans déjà étudiés : lointain, architecture, activité de fond, structures proches, sol, avant-plan et effets. Chaque couche a une fonction, une vitesse relative et des marges de recouvrement contrôlables. Les coefficients de Port Hanshan restent des hypothèses de sa fiche.

Le lot 16 fournit trois candidats de rôle `calque_decor` : [architecture distante PH-20](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_architecture_distant_fixed), [structures arrière PH-30](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_rear_structures_fixed) et [sol PH-40](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_floor_fixed). Ils dérivent de candidats internes historiques. La révision R1 du sol améliore la jonction avec PH-30 sur la largeur commune ; le pixel de largeur manquant, les franges et l’assemblage moteur restent à vérifier. Ces composants ne remplacent pas les 52 identités historiques de sous-zones et ne prouvent aucune collision.

La variante de campagne décrit état du monde, météo et destruction. Un master disponible est une image candidate de sous-zone ; il ne clôt ni la parallaxe, ni les interactions, ni l'échelle, ni les connexions.

<a id="g14"></a>
## 14. Présentation vivante et quatre axes indépendants

| Axe | Valeurs | Portée |
|---|---|---|
| Présentation | Vivante / réduite / statique | Option locale si toutes les annonces sont conservées |
| Interactions | Activées / désactivées selon fiche | Règle commune au match |
| Dangers | Activés / désactivés selon fiche | Règle commune au match |
| Transitions | Activées / désactivées selon liaisons | Règle commune au match |

Le profil Compétition initial désactive interactions, dangers et transitions. Il peut garder un décor animé neutre. Spectacle et Campagne utilisent uniquement les événements définis et validés de leur fiche ; l'entraînement permet de reproduire les configurations.

Exemples de conception à rattacher aux bonnes références : circulation et écrans à la Citadelle ; éclairages et activité de club à Afterlife ; météo et arcs atmosphériques sur la coque d'Hagalaz ; dispositifs reliquats à Eos. Leur présence visuelle n'inflige aucun dégât sans règle de danger explicite.

Chaque événement a déclencheur, acteurs, durée, fréquence, priorité, son, effet, état final et impact de jeu éventuel. En statique, figer le décor mais conserver une annonce alternative lisible d'un danger activé. Les séquences cosmétiques peuvent varier localement ; l'aléatoire qui influence le combat doit être commun et reproductible.

<a id="g15"></a>
## 15. Transitions et interactions

Une liaison associe une zone de départ précise, une destination jouable, une période et un déclencheur défendable. Les trajets entre planètes restent des transitions de chapitre ; ils ne sont pas des projections au travers d'un mur. **Afterlife ME2** et **réacteur Omega ME3** ne sont pas les deux pièces d'une même arène sans création et référencement d'une variante temporelle cohérente.

Première étude retenue : **coque d'Hagalaz ME2 → zone intérieure du Courtier ME2**, comme adaptation de parcours à confirmer contre les références du DLC. La coque a un candidat visuel ; la destination, son entrée et le raccord exact restent des dépendances, pas des assets supposés présents. Une seconde étude peut porter sur deux secteurs d'une même installation, après vérification de leur véritable sous-zone.

Contrat initial de liaison : déclenchement sur une action identifiée près d'une borne, une fois par match ; aucune activation si KO final ; aucune prime de dégâts ; fin de combo avant arrivée ; arrêt du chronomètre pendant la présentation ; positions et orientation définies ; retour neutre simultané ; un déclenchement simultané résolu dans un ordre déterministe. Réduire la cinématique ne change ni l'état ni la durée logique partagée.

Une interaction indique commande, portée, coût, vulnérabilité, effet et contre-jeu. Piratage de console, déplacement d'un obstacle ou activation d'un dispositif exigent la capacité du kit. Une réponse équivalente doit exister pour les autres profils autorisés, ou l'objet demeure purement cosmétique. Les objets consommés et murs rompus se réinitialisent selon la fiche.

<a id="g16"></a>
## 16. Ennemis, soutiens, véhicules et projectiles

Le catalogue sépare identité et fonction : un soldat peut être ennemi de campagne sans kit Versus ; une machine peut être boss sans être pilotable. Les véhicules, faunes et PNJ gardent leur inventaire propre. Pour chaque famille, préciser silhouette, rôle tactique, attaque annoncée, apparition, interruption et sortie.

Un projectile possède propriétaire, action source, arme/version, point d'émission, trajectoire, vitesse, portée, durée, collision, nombre de touches et réponse à garde, décor, autre projectile et soutien. Une traînée lumineuse ne décide pas si la simulation est instantanée ou balistique.

Les attaques à tir instantané conservent une annonce et une possibilité de réponse prévues pour le duel ; l'éventuel temps de trajet ajouté est une adaptation explicite. Les projectiles guidés définissent angle, limite de suivi et expiration. Aucun projectile ne suit hors écran ou au travers d'une transition sans règle.

Le tir, sa traînée, son impact et la dissipation sont des assets séparés lorsque le moteur en a besoin. Un drone n'ajoute pas un deuxième joueur : propriétaire, durée, PV, pause cinématique, destruction et fin de manche sont définis. Le drone de Legion n'impose jamais de garde gauche/droite simultanée ni de piratage du joueur synthétique adverse.

<a id="g17"></a>
## 17. Direction artistique et phase de production

Produire les sprites autonomes avec **un sujet exploitable par image**, corps et équipement nécessaires entiers, fond réellement transparent, orientation et ancrage explicites. Les sources individuelles restent conservées même si un atlas technique est ensuite assemblé.

L'identité, les proportions, matériaux, détails, contrastes et asymétries se comparent à la version retenue. Le miroir d'un sprite ne valide pas l'autre côté : marquages N7, prothèses, armes et accessoires exigent leur contrôle. Mesurer dimensions natives, alpha, pivot, ligne de sol, marges et empreinte ; ne pas annoncer la taille demandée comme taille obtenue.

Le plan de travail courant privilégie les éléments fixes manquants : corps, costumes, stages, armes, projectiles, machines et illustrations autorisées. Les besoins d'animation restent listés, leur production attend la phase demandée. Aucun nouvel asset n'est créé par cette mise à jour de bible.

Les revues technique, à taille réelle, en scène et de fidélité restent distinctes. Les historiques d'essais et réserves ne sont pas effacés par la sélection d'une version candidate.

<a id="g18"></a>
## 18. Animations, effets, son et caméra

Planifier attente, déplacement, accroupissement, saut, garde, attaques, impact, chute, relève, projection, interaction, victoire et neutralisation. Chaque état précise entrée, maintien éventuel, sortie, pivot, déplacement, points d'émission et réaction adverse. Une image fixe ne couvre qu'une pose.

Les phases D/A/R déterminent la simulation ; le nombre de dessins ne détermine pas la durée. Hitstop, ralenti, zoom et secousses doivent respecter le contrat de combat. Les effets de biotique, de protection et de tech ont des signatures lisibles, sans masquer le sol ou un signal adverse.

Séparer attaque, trajet, impact, garde, contre, gain de ressource et destruction. Les couches de son distinguent voix, musique, ambiance et SFX ; les signaux essentiels ne reposent pas uniquement sur l'audio ou la couleur. Les réglages de confort modifient l'intensité, jamais la fenêtre d'action.

La caméra inclut les deux combattants et traite les boss géants par un cadrage dédié. Une scène narrative restaure ensuite les positions et le contrôle annoncés. Les animations, VFX dynamiques, sons et parcours caméra restent à produire et vérifier selon leur statut propre.

<a id="g19"></a>
## 19. Interface et parcours utilisateur

Le parcours cible est titre → mode → combattant/version/costume → stage/profil → versus → combat → résultat → revanche ou sélection. Les variantes indisponibles affichent leur raison. La présentation reprend le langage graphique du projet sans cacher les informations utiles sous des effets.

Le HUD expose PV, protection, jauge commune, ressource du kit, temps, manches et états de contrôle. Un drone affiche sa disponibilité et sa destruction ; un Claymore vide n'est pas représenté comme prêt. Une sélection de profil Ryder n'est pas un simple bouton de palette.

Le menu de pause contient liste des coups, objectifs, options, reprise et sortie avec conséquence de progression réelle. Le tournoi montre le tableau et les forfaits ; campagne et routes montrent checkpoints et résumé. La galerie relie la scène débloquée à son contexte, avec consultation sans récompense répétée.

Clavier et manette disposent d'un focus visible, d'indications correspondant au périphérique et de commandes reconfigurables. Prévoir chargement raté d'une image, profil invalide et périphérique retiré. Un mode non intégré demeure identifié comme conception, sans bouton suggérant une disponibilité fictive.

<a id="g20"></a>
## 20. Tutoriels et entraînement

P0 apprend déplacement, distance, garde haute/basse, projection, punition, ressources et confirmation. Les exercices Mass Effect incluent approche sous tir annoncé, fenêtre de rechargement, interruption de déploiement, destruction d'un drone, récupération du bouclier et défense contre contrôle biotique borné.

Chaque personnage dispose d'une fiche « comprendre mon plan de jeu » : deux outils de placement, une réponse aérienne, une conversion accessible, une vulnérabilité et le moyen de l'exploiter. Une commande ne suffit pas : l'exercice décrit ce que le joueur doit observer.

L'entraînement règle côté, position, vie, ressources, bouclier, état de l'arme et comportement du mannequin. Reset immédiat, historique d'entrées, dégâts, frames, hitboxes/hurtboxes et distinction touche/garde/échec sont retenus. Les valeurs affichées doivent venir de la simulation future, pas d'une table décorative.

Enregistrement d'actions adverses et exercices de boss appartiennent à P1. La reprise d'une situation issue d'un replay dépend du format de replay retenu. Les exercices ne déverrouillent pas artificiellement les équipements de la campagne RPG.

<a id="g21"></a>
## 21. IA et difficulté

L'IA incarne le plan du kit : pression engagée pour Grunt, préparation et soutien pour Legion, protection et contrôle pour Nyreen. Elle respecte coûts, temps de réaction, états d'arme et règles de garde. Les exceptions des boss sont affichées dans leurs fiches.

La difficulté modifie délai de décision, erreurs, choix de placement, confirmation et gestion des ressources. Elle ne lit pas silencieusement les entrées futures pour garantir une réponse. Les valeurs initiales restent à calibrer par situations reproductibles.

Vérifier coin, tir lointain, saut, projection, soutien, géant et objectifs. Une transition ne doit pas bloquer le comportement dans l'ancienne zone. Les aides après échec proposent un conseil précis ou un changement de difficulté en conservant le checkpoint.

Les scripts d'IA et leurs tests ne sont pas livrés ici. Une personnalité narrative écrite n'est pas une preuve de comportement exécutable.

<a id="g22"></a>
## 22. Équilibrage et accessibilité

Mesurer les confrontations entre courte/longue portée, petits/grands gabarits et mobilités. Contrôler les prises en boucle, blocages infinis, réactions multiples, drones, murs, transitions et récupération excessive de jauge. Un combo doit rendre le contrôle selon le contrat ; aucun effet cosmétique ne prolonge son hitstun.

Les statistiques de campagne, niveaux d'arme et récompenses ne s'appliquent pas au Versus normalisé. Les costumes ne modifient pas la puissance. Les variantes de boss reçoivent un règlement séparé. Les changements d'équilibrage conservent raison, version et situations mesurées.

Retenir remappage, sous-titres, taille du texte, contraste, identification des joueurs, volumes séparés, réduction des flashs/secousses et décor statique. Les états utilisent formes, icônes ou textes en plus de la couleur. Une présentation réduite conserve les informations de danger.

Les commandes simplifiées activent les mêmes actions, coûts et fenêtres. Les aides qui prennent une décision à la place du joueur ont une compatibilité annoncée par mode. Les critères seront vérifiés sur la cible réelle ; aucun bénéfice de performance ou test de confort n'est déduit de cette spécification.

<a id="g23"></a>
## 23. Local, réseau et replays

Le local est retenu : attribution des côtés, profils, pause, déconnexion, reprise et revanche. Le réseau reste à décider ; aucune fonction de rollback, serveur, matchmaking, classement ou crossplay n'est annoncée.

Dès P0, éviter de lier les règles au rendu et prévoir un état sérialisable : combattants, commandes, jauges, armes, drones, projectiles, événements, objets, phase de boss et transition. Les décisions qui influencent la partie sont reproductibles. Cette préparation réduit un risque d'architecture ; elle ne constitue pas un netcode.

Les replays de simulation sont différés P2. Leur contrat futur doit inclure version du moteur/règles, contenu, seed et commandes, avec refus lisible d'une version incompatible. Une vidéo est une capture, pas nécessairement un replay exploitable pour reprendre une situation.

Avant de retenir le jeu en ligne, chiffrer services, plateformes, déconnexion, qualité de connexion et compatibilité. Une fois retenu, le choix devient une dépendance P0 et doit être testé avant l'extension du contenu.

<a id="g24"></a>
## 24. Progression et sauvegarde

La progression Armax privilégie maîtrise, chapitres, routes, scènes, dossiers, costumes et défis. Chaque déblocage indique sa condition et son périmètre. Le même combattant a des règles normalisées en compétition.

L'état Armax possède version, règles, difficulté, route/chapitre, rencontre suivante, scènes vues, déblocages, récompenses déjà versées, réglages et tournoi. Le nom exact de la clé de stockage est une décision d'implémentation à rattacher au système existant, pas une API déjà ajoutée.

Une reprise charge d'abord un état validé. Un import invalide conserve la partie courante ; une ancienne version demande migration. Le checkpoint entre combats évite de promettre une sauvegarde au milieu d'une animation non implémentée.

Les décisions du RPG, inventaires et neuf emplacements restent isolés. Rejouer Nihlus en simulation ne le ressuscite pas dans la campagne. Consulter une outro, revenir en arrière ou relancer le résultat ne duplique ni récompense ni événement.

<a id="g25"></a>
## 25. Inventaires et statistiques

Le suivi garde six axes : **lore, conception, assets, intégration, validation, publication**. Les statuts historiques ne sont pas remplacés ; une association peut ajouter ces axes sans modifier les résultats de production d'origine. Les chemins attendus se distinguent des fichiers réellement présents.

Le catalogue lot 13 constitue un périmètre nommé : **172 fiches, 108 avec image candidate, 64 sans image**, réparties en 87 personnages/ennemis, 38 costumes, 47 stages. Le total de 204 PNG originaux appartient à son corpus artistique consolidé. Ces nombres sont repris du [suivi du 24 novembre](../lot13/README.md), pas d'une nouvelle revue de leurs pixels.

Ce catalogue de manquants ne contient pas tous les IDs de kits et de récupérations. Lier lot 04, continuation, lot 03 et récupération évite d'inventer une exhaustivité ou de compter plusieurs fois Legion selon ses espaces de noms. Les sous-zones et les couches restent des unités distinctes.

L’intégration initiale du guide a ajouté une couverture documentaire des 30 rubriques, des décisions communes et des briefs narratifs, sans augmenter les compteurs artistiques de son instantané. Le [catalogue historique lot 16](../lot16/production-catalog.json) conserve les 188 fiches du lot 14 et ajoute quatre fiches : **192 au total, 132 avec candidat et 60 sans**. La pose assise supplémentaire ne compte pas comme une nouvelle identité. Son corpus de **231 originaux** inclut le sol R0 écarté ; les 113 PNG non récupérés du lot 15 en sont exclus. Le [catalogue historique lot 18](../lot18/production-catalog.json) conserve ces 192 identités, ajoute quatre composants de Tuchanka et compte **196 fiches, 150 avec candidat et 46 sans**. Les compteurs de fidélité certifiée et d’intégration moteur ne progressent pas par la seule présence d’images.

<a id="g26"></a>
## 26. Validation et ordre de production

Premier jalon futur : deux styles contrastés, une arène, entrée de match, manche complète, résultat et entraînement avec reset. Grunt/Legion et Port Hanshan constituent un candidat de tranche, conditionné à la normalisation des commandes, à la présence des corps et aux assets nécessaires. Une alternative déjà mieux équipée peut être choisie sur preuve.

Tester tôt les risques structurants : grand gabarit, drone, ressource d'arme, transition et boss à objectifs. Puis produire une route pilote et un chapitre de campagne complets avant d'étendre leurs variantes. Pendant la phase actuelle, documenter ces besoins tout en produisant uniquement les images fixes demandées.

Une fiche est terminée lorsqu'elle possède source, version, règle, dépendances et critères. Un sprite est terminé pour son usage après les revues requises. Un combattant exige actions/réactions/collisions et modes testés. Un stage exige terrain, profils, limites et liaisons fonctionnels. Une route et une campagne exigent une traversée jusqu'à la conclusion avec reprise.

La vérification de l’intégration initiale du guide est documentaire : couverture, IDs, liens, cohérence des règles, préservation du suivi et revue des briefs de scènes. Les vérifications artistiques des [lots 16](../lot16/verification.json) et [18](../lot18/verification.json), ainsi que les revues propres aux images, ajoutent leurs mesures et réserves. Ces preuves restent distinctes d’un build, d’un test de combat ou d’un parcours Windows.

<a id="g27"></a>
## 27. Fiches A–J adaptées

Les [fiches et liaisons](FICHES_ET_LIAISONS.md) reprennent les dix modèles du guide : projet, personnage, action/projectile, neutralisation, route, chapitre/scène, arène, événement/interaction/transition, boss et asset.

Chaque fiche est reliée à une source existante et aux exigences du guide. Les nouveaux IDs de conception ne créent pas automatiquement une ligne de personnage ou de stage dans le catalogue de production. L'ajout réel d'un élément à produire passera par le pipeline du catalogue concerné et son export.

Les exemples remplis portent sur Saren, Nyreen, Grunt/Legion et une arène déjà suivie. Une information encore inconnue est écrite comme telle : collision, vitesse de projectile ou référence de sous-zone ne sont pas déduites arbitrairement d'un PNG.

Les critères distinguent validation documentaire et validation en jeu. Une fiche complète peut rester non implémentée ; un objet chargé dans le moteur peut encore nécessiter sa revue de fidélité.

<a id="g28"></a>
## 28. Instruction de reprise du projet

> Reprendre Armax depuis cette bible, les associations du guide et RC-ARMAX-0.1. Examiner les derniers commits, les catalogues et les manifestes avant de choisir un manquant. Conserver le RPG ATB, ses états et ses dépendances. Réutiliser les IDs des kits, images et œuvres en déclarant leurs liaisons.
>
> Pour le sujet choisi, vérifier opus, édition, période, costume, pouvoirs, rôle, sources et adaptations. Relier moveset, ressources, route, rival, neutralisation, stage, projectiles et besoins d'illustration. Respecter la phase sprites fixes ; garder les besoins d'animation documentés.
>
> Ne pas confondre fichier présent, fidélité, intégration, test et publication. Mettre à jour le suivi de production et l'export associé seulement lorsque ce contenu ou sa disponibilité change. Une mise à jour documentaire de méthode ne promeut pas les anciens statuts.
>
> Vérifier les critères propres au changement, publier dans le suivi de PR du projet et fournir les quantités dans leur unité et périmètre exacts. Toute divergence entre anciennes règles passe par une décision versionnée, jamais par une substitution silencieuse.

<a id="g29"></a>
## 29. Références, vocabulaire et limites

Le guide utilisateur apporte la structure. Les bibles et catalogues locaux apportent les décisions déjà prises. EA/BioWare documentent les différences d'opus, les profils et les apparences ; les références de chaque lot restent nécessaires pour les détails. Le [registre de sources et décisions](SOURCES_ET_DECISIONS.md) indique ce que chaque source prouve et ce qu'elle ne prouve pas.

Les références Street Fighter 6, Guilty Gear Isuka, Mortal Kombat X/11/1 et Injustice 2 du guide inspirent des structures distinctes ; elles ne prouvent pas le lore Mass Effect ni la présence de toutes leurs fonctions dans Armax. Aucun mécanisme étranger n'est ajouté par simple analogie.

**Neutral** : recherche d'ouverture par position et menace. **Hitbox/hurtbox** : volumes de frappe/vulnérabilité. **Frame data** : durées de simulation. **Cancel** : transition autorisée entre actions. **Amorçage/détonation** : états et interactions explicitement définis. **Neutralisation décisive** : famille de finishers créée pour ce projet. **Route** : histoire individuelle. **Campagne globale** : progression commune distincte. **Master** : image source ; il ne prouve ni calques, ni collisions, ni stage jouable.

Les règles chiffrées, scènes, titres et liaisons nouvellement proposés sont des créations de conception. Les six routes pilotes, les sous-zones, les nouveaux plans, les animations et le runtime restent soumis à leurs prochains livrables et validations.

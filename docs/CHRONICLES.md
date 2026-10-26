# Chroniques — œuvres, segments et essais tactiques

Les **Chroniques** ouvrent un registre de 28 œuvres et 48 segments explicites, puis vingt-cinq essais ATB indépendants dans sept œuvres : Mass Effect 2, Mass Effect 3, Andromeda, Infiltrator, Galaxy, Redemption et Paragon Lost. Seize parcours documentaires proposent 52 pages de lecture dans des contextes de romans et comics. La campagne ME1 conserve ses cartes, son commando, son inventaire et ses sauvegardes.

La branche 0.3.0 conserve les **1 332 fiches de main `7ef342a` et les 50 fiches de personnalisation**, soit **1 382 fiches principales et 6 708 références** avec les 5 326 supplémentaires. Elle réunit **454 sources : 44 principales et 410 supplémentaires**, avec **629 Prototype, 6 073 Défini, trois Intégré et trois Validé**. Les 27 exports univers et leur ZIP restent identiques au main publié. Les [preuves de synchronisation](qa/customization-arsenal-sync-report.json) restent distinctes des rapports historiques de main.

**Complément arsenal de main du 26 octobre 2026, basé sur `1310a84`, validé fonctionnellement dans son périmètre partiel.** Le registre de main contient **6 658 fiches : 1 332 dans le principal et 5 326 dans les 27 catalogues supplémentaires**, avec **450 sources : 40 principales et 410 supplémentaires**. Deux nouvelles références ME1 documentent l’existence et la vue nommée du Mako et du Normandy SR-1 dans le manuel officiel Xbox 360, sans valider leur géométrie ni leur pilotage. Les **52 promotions Prototype sont appliquées**. Ses statuts sont **582 Prototype, 6 070 Défini, trois Intégré et trois Validé**. Le [rapport arsenal](qa/arsenal-report.json) conserve les résultats fonctionnels et leurs limites.

**Historique soutiens, munitions et portraits du 25 octobre, basé sur `748b965`.** Ce lot conservait 6 656 fiches et 449 sources. Ses 17 promotions donnaient 530 Prototype, 6 120 Défini, trois Intégré et trois Validé. Le [rapport historique](qa/chronicle-support-report.json) relie ses propres contrôles aux sources de cette version.

Le complément spécialistes précédent, basé sur `7fe7a88`, ajoutait 37 promotions Prototype : huit profils de personnages, six armes, sept fiches de pouvoirs et seize références documentaires. Ses rapports restent historiques. Une fiche du registre ne devient pas automatiquement visible, sélectionnable ou jouable : sa provenance doit autoriser le segment et l’essai choisis. Les campagnes intégrales, dialogues, cartes et scènes des œuvres supplémentaires restent à produire ; aucune fidélité 1:1 n’est certifiée par ces essais.

## Ouvrir une chronique

Depuis le titre ou la pause de la campagne, choisir **Chroniques**, puis une **œuvre** et un **chapitre ou une période**.

- **Registre** : rechercher parmi les personnages, équipements, pouvoirs, récits et lieux autorisés. Une fiche affiche son statut, ses conditions, ses repères et ses sources.
- **Essai tactique** : choisir l’essai proposé, préparer un groupe d’un à trois personnages, puis lancer l’escarmouche. Certains contextes proposent seulement des références.
- Dans les six ateliers d’équipement, dont trois limités à une édition préparée, choisir un profil de combat disponible, une arme et, pour le protagoniste autorisé, une armure. Les modules compatibles disposent de deux ports ; les choix incompatibles restent indisponibles avec leur motif.
- **Lecture** : ouvrir le parcours documentaire du segment, avancer ou revenir parmi ses pages et consulter leurs sources. La page atteinte est enregistrée sans récompense ni choix ajouté au récit.
- Enregistrer, reprendre, exporter ou importer la chronique depuis ce même espace. Le retour ramène au titre ou à la pause de la campagne.

Les combats utilisent le mode Attente. Les armes conventionnelles des profils ME2, ME3 et Andromeda emploient un chargeur et une réserve ; **Recharger** consomme une action ATB. Les capacités, statistiques, réserves et adversaires des essais suivent les réglages de ce prototype.

Les **42 profils sélectionnables sont comptés par œuvre** : un même personnage peut avoir plusieurs profils distincts selon son contexte. Les capacités manquantes restent signalées dans chaque préparation. Les huit profils supplémentaires restent réservés aux six bancs d’extensions ou de bonus : leur présence n’est pas ajoutée aux dix essais antérieurs.

## Vingt-cinq essais et leurs périmètres

| Œuvre et segment | Essai | Périmètre réalisé |
|---|---|---|
| ME2 · `me2` | Freedom’s Progress — sécurité mécanique | Shepard, Miranda et Jacob face à des LOKI référencés ; rencontre condensée |
| ME3 · `me3-prologue` | Terre — banc du prologue | Shepard et Anderson face à des mannequins originaux ; aucune rencontre du prologue reproduite |
| Andromeda · `mea-prologue` | Habitat 7 — banc de personnages | Ryder et Alec face à des mannequins originaux ; aucune rencontre de la mission reproduite |
| Infiltrator · `inf` | Fuite face à Cerberus | Randall face aux types soldat et mech documentés, dans une opposition ATB condensée |
| Galaxy · `gal` | Intervention de Jacob | Jacob face aux types robot et adversaire turien documentés ; exercice sans attribution à une rencontre précise |
| Paragon Lost · `pl-collectors` | Crise des Récolteurs | Vega face à un Récolteur de prototype ; les autres membres de Delta Squad restent exclus faute de fenêtre de présence vérifiée |
| Redemption · `red` | Banc de personnages | Liara et Feron face à des mannequins originaux ; aucun événement ou adversaire du comic rejoué |
| ME2 · `me2` | Atelier d’équipement | Groupe de test et matériel autorisé de ME2 face à des cibles originales |
| ME3 · `me3` | Atelier d’équipement | Groupe de test et matériel autorisé de ME3 face à des cibles originales |
| Andromeda · `mea` | Atelier d’équipement | Groupe de test et matériel autorisé d’Andromeda face à des cibles originales |
| ME2 · `me2` | Spécialistes DLC | Shepard, Kasumi et Zaeed ; packs et conditions de loyauté préparés pour l’essai |
| ME2 · `me2` | Shadow Broker | Shepard et Liara ; rôle temporaire limité à cette extension |
| ME3 · `me3` | From Ashes | Shepard et Javik ; extension et recrutement préparés pour l’essai |
| ME3 · `me3` | Omega | Shepard, Aria et Nyreen ; état où les deux partenaires temporaires sont présentes |
| ME3 · `me3` | Citadel, Wrex vivant | Shepard et Wrex ; survie préparée dans ce banc uniquement, sans accès global ou Armax |
| Infiltrator · `inf` | Incarceration | Prisonnier turien seul ; le bonus ne lui attribue pas la campagne de Randall |
| ME2 · `me2` | Banc des mécas de sécurité | LOKI, FENRIS et YMIR ; actions génériques, sans rejouer leur rencontre d’origine |
| ME2 · `me2` | Banc des Collecteurs | Drone, hôte d’Harbinger et Praetorian ; possession, vol et phases non reproduits |
| ME3 · `me3` | Banc de Cerberus | Fantassin et Kai Leng ; les phases de boss restent absentes |
| ME3 · `me3` | Banc des Moissonneurs | Husk, Marauder, Brute et Banshee ; kits et comportements propres restent partiels |
| Andromeda · `mea` | Banc kett | Chosen, Ascendant et Cardinal ; orbes, objectifs et phases non simulés |
| Andromeda · `mea` | Banc reliquat | Destroyer ; sous-cibles et comportement original non reproduits |
| ME2 · `me2` | Atelier Legendary Edition | Équipements d’édition autorisés dans cette seule préparation |
| ME3 · `me3` | Atelier Legendary Edition | Armures d’édition, fusil à particules et Lancer, sous leurs conditions préparées |
| Andromeda · `mea` | Atelier Deluxe | Armures Scavenger et Deep Space, sans acquisition d’origine simulée |

Les seize essais précédents sont conservés : quatre oppositions à types d’adversaires référencés, trois bancs de personnages à cibles abstraites, trois ateliers standard et six bancs de spécialistes. Le complément ajoute **six bancs d’opposition et trois ateliers d’édition**, soit **25 essais**. Les six bancs de spécialistes utilisent des mannequins originaux et la dotation abstraite du profil, sans équipement supplémentaire. Aucun banc ne décide d’un recrutement, d’une loyauté ou d’une survie dans une campagne. Les effectifs, cartes de combat, durées, valeurs et commandes ATB sont adaptés. Une victoire enregistre la réussite de l’essai ; elle n’accorde ni crédits, ni expérience, ni choix canoniques à la campagne.

Les nouveaux bancs d’opposition emploient **16 profils d’adversaires, dont trois boss : Praetorian, Kai Leng et Cardinal**. Leurs descriptions distinguent les faits de silhouette des valeurs ATB et affichent les mécaniques absentes. Une protection chiffrée ne reconstitue pas une barrière de boss ; une action générique ne reproduit pas son kit, ses phases ou sa rencontre canonique.

## Présence des personnages et du matériel

Les vingt-cinq essais exposent **42 profils de personnages sélectionnables au total**, tous partiels et inchangés par le complément arsenal. Un même personnage dans deux œuvres possède deux identifiants distincts. Chaque sélection demande une autorisation dans l’essai choisi. Les pouvoirs absents du moteur ou insuffisamment documentés ne sont pas ajoutés par analogie.

Les ateliers proposent **100 équipements sélectionnables : 72 armes, 25 armures et trois familles de modules**. Chaque modèle doit satisfaire simultanément les conditions de l’œuvre, du segment, de l’essai, du porteur et des mécaniques disponibles. Les armures personnelles sont réservées à Shepard ou Ryder selon l’œuvre. Parmi les quinze armures ajoutées, six ME2 et six ME3 sont limitées aux ateliers Legendary Edition, deux Andromeda à l’atelier Deluxe ; la protection Reliquats d’Andromeda est un profil agrégé sans bonus de régénération inventé. Les variantes et mécanismes non pris en charge restent fermés, même si leur nom figure au registre.

La préparation d’atelier est libre. Elle ne simule pas l’acquisition d’origine, le recrutement, les arbres détaillés de talents, les rangs, les bonus passifs, les ressources, les achats, les crédits ou le butin. L’atelier utilise un état de test où les compagnons proposés ont rejoint le groupe et survécu ; les conditions de leurs fiches restent consultables. Les alternatives sont conservées : **Samara/Morinth** et **Ashley/Kaidan** ne peuvent pas être sélectionnés ensemble. Anderson et Alec restent limités à leurs bancs de prologue.

Les bonus d’armure, profils de familles d’armes, chargeurs et pouvoirs utilisent des valeurs ATB adaptées. La cadence, la dispersion, les sons, les améliorations détaillées et les variantes de chaque modèle ne sont pas reproduits intégralement.

## Pouvoirs et préparations

Le premier complément ajoutait dix mécaniques ATB : Attraction, Incinération, Explosion cryogénique, Tir percutant, Drain d’énergie, Fortification, Ravage, Onde de choc, Écrasement et Domination. Le complément spécialistes ajoutait **Grenade à fragmentation**, **Grenade collante** et **Soutien des boucliers**. Le lot soutiens avait porté l’ensemble à **61 fiches de pouvoirs exposées pour 30 commandes**, plus la commande de désactivation des munitions. Les protections, cibles, durées, états et variantes restent des réglages explicitement adaptés. Les pouvoirs de loyauté ME2 ne sont proposés que dans les bancs qui déclarent cette condition préparée.

Les grenades de James et du Soldat ME3, celles du Franc-tireur ME3, de Liam et de Jaal disposent de **trois charges par escarmouche dans le réglage d’essai**. Chaque lancer accepté dépense une charge, sans clip d’arme ni délai de recharge artificiel ; aucun réapprovisionnement n’a lieu pendant le combat. La grenade collante reste un projectile différé. Le soutien de Cora restaure les boucliers des alliés vivants puis accélère temporairement leur recharge ; il ne soigne pas la santé et ne ranime personne. L’attribution non vérifiée de Flak Cannon à Peebee a été retirée de ses capacités manquantes, sans lui accorder une autre capacité.

### Soutiens autonomes

Quatre fiches correspondent à **trois actions** : Drone de combat ME2 et ME3, Tourelle de garde ME3 et Drone de défense ME3. Le Drone de combat est réservé à l’Ingénieur, Tali et Legion dans ME2, puis à l’Ingénieur et Tali dans ME3. La tourelle reste propre à l’Ingénieur ME3 ; le drone défensif à Tali ME3. Ces listes respectent les préparations et essais autorisés, sans déduction depuis un nom de classe voisin.

Chaque déploiement ajoute une entité ciblable avec ses propres PV, boucliers éventuels, propriétaire et durée. Le drone harcèle une cible et peut la déloger du couvert ; la tourelle tire automatiquement ; la garde défensive réagit aux dégâts réellement reçus par son propriétaire. Cette réaction est une convention ATB, sans simulation de proximité physique. Le budget est d’un soutien du même type par propriétaire, deux types par propriétaire et six entités par camp ; redéployer le même type le remplace. Destruction, expiration ou mise hors combat du propriétaire retirent l’entité. Ces durées, plafonds et règles de retrait sont des choix du prototype.

Les soutiens ne sont pas commandables et ne prennent pas la place d’un équipier. Ils ne reçoivent ni médi-gel, ni Unité, ni Soutien des boucliers. Leur disponibilité ne suspend pas le mode Attente ; ils cessent d’agir pendant une vraie attente d’ordre ou une pause. La victoire et la défaite dépendent des combattants natifs, jamais des soutiens survivants.

### Modes de munitions appris

Dix fiches exposées couvrent **six modes exclusifs** : incendiaire, cryogénique, disruptif, perforant, distorsion et déchiqueteur. ME2 propose les six ; ME3 en propose quatre, sans mode déchiqueteur ni Warp Ammo. Les permissions sont reconstruites depuis le kit et l’œuvre, avec les conditions de loyauté conservées. Les consommables de munitions Andromeda restent fermés faute de règle individuelle suffisamment vérifiée.

Choisir ou désactiver un mode consomme un ordre ATB, sans réserve supplémentaire, remplissage du chargeur ou recharge temporelle ajoutée. Un seul mode reste actif. Les effets concernent les tirs contrôlés, rafales et techniques d’élite d’armes conventionnelles à clips ; pouvoirs, invocations, armes à chaleur et profils d’armes spéciales restent exclus. Incendiaire et cryogénique exigent des dégâts réels de santé et respectent protections et immunités. Les autres modes modifient leurs couches de dégâts adaptées ; la munition perforante ne simule pas la traversée du décor. Multiplicateurs, accumulation de gel et durées restent des réglages ATB. Voir les [références et limites](research/chronicle-support-sources.md).

Shepard peut choisir les **six classes dans ME2 et les six classes dans ME3**, en plus de la dotation par défaut conservée pour les anciennes sessions. Ryder dispose de **trois préparations de compétences — combat, biotique, technologie — et de sa dotation par défaut**. Ces préparations ne reproduisent ni tout l’arbre des talents ni les bonus passifs des profils d’Andromeda. Les compagnons gardent leur kit autorisé et les bancs de prologue gardent leur dotation par défaut. Les capacités manquantes restent affichées.

Deux **familles de modules ME3**, canon et chargeur, utilisent les ports `weaponMod` et `weaponMod2`. Elles demandent une arme ME3 de famille fusil d’assaut à clips, explicitement équipée dans l’atelier. Les deux familles peuvent coexister ; dupliquer une famille est refusé avec un motif par port. Il ne s’agit pas de nouveaux rangs ou modèles officiels certifiés. Le canon multiplie les dégâts des tirs par 1,12 sans renforcer les pouvoirs. Le chargeur conserve le total de munitions : l’Avenger passe de 18/72 à 23/67 dans ce réglage ATB. Remplacer ou retirer l’arme retire ses modules ; sélectionner la même arme les conserve.

Une troisième famille, **matériaux ultralégers pour mitraillette ME3**, applique un multiplicateur de **0,9 aux délais de pouvoirs ATB**. Elle exige une mitraillette conventionnelle à clips compatible ; elle ne donne aucun pouvoir et ne modélise pas le poids original, les rangs ou les restrictions de tous les épisodes. Les deux ports demeurent les seuls ports de modules des Chroniques ; l’inventaire ME1 conserve ses neuf emplacements séparés.

## Armes spéciales

Falcon et les deux Scorpion lancent un projectile qui explose après un délai, avec des dégâts réduits sur les autres adversaires. Le P.A.W. canalise un rayon à chaleur, le Reegar un jet électrique consommant ses clips par impulsion, et le Sweeper une salve énergétique à chaleur. Une canalisation s’interrompt par annulation, mise hors combat ou neutralisation ; les projectiles déjà lancés restent en vol. Une victoire attend la résolution des projectiles encore dangereux. Les profils à chaleur n’héritent pas de réserves de clips.

Ces six profils historiques restent limités aux ateliers ME3 ou Andromeda. Le complément arsenal ajoute **huit profils**, soit quatorze au total : fusil à particules et Lancer ME3, Arc, Graal et Javelin ME3, puis Equalizer, Scattershot et Venom Andromeda. Le fusil à particules et le Lancer exigent l’atelier Legendary Edition ME3 ; cette préparation ne reconstitue pas l’acquisition de From Ashes ou Citadel.

Arc, Graal, Javelin et Venom utilisent **quatre charges automatiques d’une seconde ATB**, interruptibles avant le tir. Les clips sont dépensés au tir, pas au début de la charge. L’annulation ne rembourse ni l’ordre ni le coût d’action ; les niveaux de charge manuels d’origine ne sont pas simulés. Le Javelin ignore seulement le couvert binaire du moteur ATB : aucune pénétration de mur, géométrie ou cible multiple n’est reproduite. Les autres ajouts distinguent rayon à chaleur et salve à chaleur.

Falcon et les autres profils spéciaux ne reçoivent pas les modules conçus pour les armes conventionnelles. Délais, zone, suivi de cible, chaleur, munitions, trajectoires et dégâts ne constituent pas une reproduction intégrale des modèles originaux. Les [sources historiques](research/chronicle-specialist-sources.md) restent identifiées comme telles ; les métadonnées courantes conservent les conditions et limites de chaque profil.

## Seize parcours documentaires

L’onglet Lecture présente des **paraphrases courtes de faits établis**. Les pages s’appuient sur des fiches et sources identifiées ; l’interface affiche leurs titres, liens et repères. L’ordre des pages guide la lecture ; il ne constitue pas un découpage exhaustif des chapitres ou cases. Aucun dialogue canonique, choix alternatif, personnage de combat, butin ou récompense n’est créé pour ces parcours.

| Œuvre et segment exact | Parcours | Pages |
|---|---|---|
| Revelation · `rev` | Le dossier Sidon | 5 |
| Ascension · `asc` | Protéger Gillian | 5 |
| Retribution · `ret` | La disparition de Grayson | 5 |
| Nexus Uprising · `nex` | Une station en crise | 5 |
| Initiation · `ini` | Le dossier de Cora | 5 |
| Annihilation · `ann` | Pendant le voyage | 5 |
| Redemption · `red` | La recherche de Liara | 5 |
| Invasion · `inv` | La défense d’Omega | 3 |
| Evolution · `evo-aftermath` | Après les hostilités | 4 |
| Deception · `dec` | Repères et contradictions documentaires | 4 |
| Homeworlds · `hom-4-liara` | Liara, quatrième numéro | 1 |
| Foundation · `fou-5` | La recherche de Shepard, cinquième numéro | 1 |
| Discovery · `dis` | L’infiltration | 1 |
| Incursion · `inc` | Repères sur Omega | 1 |
| Inquisition · `inq` | L’enquête de Bailey | 1 |
| Evolution · `evo-contact` | Pendant les hostilités | 1 |

Les **52 pages** s’appuient sur 82 fiches, dont 59 références documentaires de lieux, récit ou continuité. Les fiches d’identité citées gardent leur statut documentaire : aucun acteur de roman n’est rendu combattant par la présence de son nom. Les descriptions, natures et sources d’origine restent conservées. Les fenêtres d’Homeworlds et Foundation ne sont pas fusionnées ; aucun parcours global d’anthologie n’est ajouté. Les deux parcours d’Evolution restent séparés, Annihilation limité au transit de l’arche et Initiation à sa préquelle en Voie lactée. Deception conserve ses contradictions et distingue une correction annoncée d’une édition corrigée effectivement vérifiée. Inquisition mentionne un traître présumé, sans établir sa culpabilité ou lui attribuer un nom non attesté par les fiches utilisées.

## Continuité et incertitudes

Un contexte est un triplet strict `{mediaId, periodId, galaxy}`. La galaxie provient du registre ; une année libre ou une plage chronologique approximative ne donne aucun accès supplémentaire. Une fiche ME3 n’entre pas dans ME1 parce qu’un personnage ou un nom d’arme existe dans les deux épisodes.

Les anthologies sont découpées explicitement : six segments pour Homeworlds, treize pour Foundation. Les deux phases d’Evolution et de Paragon Lost sont séparées. Une notice de recueil confirmant un personnage ne suffit pas à placer sa jeunesse, son équipement ou ses compagnons dans chaque scène. Les associations de scène non vérifiées restent fermées. Les modules multijoueurs de ME3 original et APEX ne fournissent pas de compagnons aux groupes solo.

Annihilation possède son propre contexte de transit, avec un lieu non fixé : il n’est pas assimilé à une mission dans Heleus. Discovery et Initiation gardent leurs contextes de préquelle en Voie lactée. Les réserves documentaires et contradictions restent affichées avec les sources.

Quatre dossiers ne proposent aucune période historique ni essai :

| Dossier | Limite |
|---|---|
| ME4 | Contenu spéculatif ou période non établie ; aucune campagne officielle reconstituée |
| Library Edition | Compilation éditoriale ; les périodes appartiennent aux récits rassemblés |
| Blasto | Fiction à l’intérieur de l’univers, sans conversion en événement historique |
| Contenus coupés | Archives et concepts, sans insertion automatique dans la continuité publiée |

Ces dossiers restent présents dans la liste avec leur motif de fermeture et leurs catalogues documentaires. Les statuts, natures et sources des fiches sont conservés ; les tests fonctionnels ne les promeuvent pas en contenus certifiés.

## Sauvegardes séparées

Une chronique est enregistrée par couple œuvre/segment sous une clé locale propre : `relay-chronicles.chronicle.<mediaId>.<periodId>.v1`. Elle conserve le scénario actif, le groupe, les profils `builds`, les quatre emplacements de préparation, les modes préparés `ammoModes` et les essais réussis. Les anciennes sessions v1 à deux emplacements migrent automatiquement vers `weapon`, `armor`, `weaponMod` et `weaponMod2`, avec les deux ports supplémentaires vides. Une ancienne session sans `ammoModes` reçoit des choix neutres. Une structure explicitement invalide reste refusée.

Le mode préparé est validé selon l’œuvre, le kit et l’arme. Un changement de classe ou d’arme retire une sélection devenue incompatible ; il ne débloque aucun pouvoir. Les activations pendant l’escarmouche restent dans ce combat et ne réécrivent pas la préparation sauvegardée. Les entités invoquées ne sont pas ajoutées au groupe préparé ni à la sauvegarde de campagne.

Les découvertes enregistrent uniquement des fiches autorisées dans le contexte. `readingProgress` conserve séparément l’index de page par parcours ; il n’écrase pas `notes`, qui reste réservé aux notes personnelles. Les anciens exports dépourvus de ces champs reçoivent leurs valeurs par défaut. L’interface ne propose pas d’éditeur de notes personnelles.

Depuis une campagne en cours, l’entrée dans Chroniques enregistre d’abord un point de reprise ME1 avec la position et le temps courants. La campagne reste ensuite figée et ses sauvegardes ne sont pas modifiées par les essais. Un rafraîchissement permet de reprendre ce point de campagne.

Les exports Chroniques utilisent le format `relay-chronicles.chronicle`. Ils sont distincts des exports de campagne `relay-chronicles`, de la sauvegarde automatique ME1 et de ses six emplacements manuels. Aucun transfert d’équipement, de crédits, de compagnon ou de progression entre ces espaces n’est fourni.

Les imports sont validés avant enregistrement : contexte exact, scénario connu, personnages autorisés, équipement compatible et structure des données. Une référence périmée ou un contenu étranger au contexte rend l’import invalide. Les erreurs de stockage sont signalées ; un enregistrement illisible est conservé et n’est pas remplacé automatiquement. Les sauvegardes ME1 publiées gardent leur version et leur contexte ME1 implicite.

## Présentation visuelle

L’atlas de portraits précédent conserve sa priorité pour `ME2-CHR-MIRANDA`, `ME2-CHR-THANE` et `ME3-CHR-GARRUS`, dans leurs seuls contextes autorisés. Le complément ajoute **24 illustrations fixes et partielles sur quatre atlas de 1536 × 1024** : quatre bustes de joueurs, deux de PNJ, six silhouettes d’adversaires, six équipements et six véhicules ou vaisseaux. Le manifeste [arsenal-visuals.json](../public/assets/arsenal-visuals.json) conserve les identifiants exacts, périodes, cadrages et empreintes.

Les bustes ajoutés concernent Mordin, Tali, Legion et Samara ME2 ; Aria ME2 et Traynor ME3 restent des références de PNJ. Les six silhouettes représentent LOKI, YMIR, Praetorian, Kai Leng, Brute et Banshee dans leur œuvre exacte. Les six images de flotte — Mako, Nomad, Hammerhead, Normandy SR-1, Normandy SR-2 et Tempest — sont documentaires, sans pilotage ni intégration au groupe. L’accès à une image en référence ne rend pas son sujet sélectionnable en combat ; cet usage demande aussi une autorisation dans le scénario exact. Les deux références ME1 nouvelles ne débloquent pas les anciens alias d’adaptation.

Les rectangles SVG isolent chaque illustration, avec six cadrages irréguliers dans l’atlas d’équipement. Aucun nouveau sprite animé, huit directions, modèle complet, costume interchangeable ou apparence Shepard n’est appliqué par ces images. Toutes portent `partial: true` et `primaryVisualVerified: false` ; aucune fidélité visuelle 1:1 n’est certifiée. Les profils sans image et les soutiens gardent leurs symboles. Voir le [registre des assets](ASSETS.md), les [références primaires inspectées](research/arsenal-visual-sources.md) et, pour les trois bustes historiques, leur [revue d’interface](qa/chronicle-portrait-ui-review.json).

## Sources, code et vérifications

| Fichier | Responsabilité |
|---|---|
| [`continuity-data.js`](../src/continuity-data.js) | Œuvres, segments explicites, réserves et règles documentaires de provenance |
| [`universe-data.js`](../src/universe-data.js) | Registre généré à partir des catalogues, sans promotion de leurs statuts |
| [`continuity.js`](../src/continuity.js) | Contexte, filtrage et validation de la base des sessions |
| [`universe-actors.js`](../src/universe-actors.js) | Profils partiels, autorisations des groupes et vingt-cinq essais |
| [`universe-specialist-scenarios.js`](../src/universe-specialist-scenarios.js) | Six bancs d’extensions ou de bonus, sans ouverture des autres scènes |
| [`universe-opponents.js`](../src/universe-opponents.js) | Seize profils d’adversaires, dont trois boss, et leurs mécaniques manquantes |
| [`universe-equipment.js`](../src/universe-equipment.js) | Matériel, quatre emplacements, compatibilité par port et effets disponibles |
| [`universe-powers.js`](../src/universe-powers.js) | Liaisons sourcées, kits, classes et conditions des pouvoirs |
| [`chronicle-story.js`](../src/chronicle-story.js) | Seize lectures, 52 pages, provenance et découvertes validées |
| [`universe-weapon-profiles.js`](../src/universe-weapon-profiles.js) | Quatorze profils d’armes ATB sans chargement du catalogue depuis le combat |
| [`combat-summons.js`](../src/combat-summons.js) | Plans purs des entités, durée, plafonds, réactions et retrait des soutiens |
| [`universe-ammo.js`](../src/universe-ammo.js) | Modes appris exclusifs, compatibilité et effets par couche de dégâts |
| [`universe-portraits.js`](../src/universe-portraits.js) | Trois bustes associés aux identités et contextes exacts |
| [`universe-visuals.js`](../src/universe-visuals.js) | Illustrations fixes avec accès documentaire et usages de groupe/combat distincts |
| [`arsenal-visual-data.js`](../src/arsenal-visual-data.js) | Vingt-quatre associations, rectangles, empreintes et réserves artistiques |
| [`chronicles.js`](../src/chronicles.js) | Validation composite, préparation, combat, import/export et stockage isolé |
| [`universe-ui.js`](../src/universe-ui.js) | Registre, profils, modules, lecture et commandes des essais |

Le registre est chargé à l’ouverture des Chroniques. Les sources éditoriales restent dans le [catalogue principal](content-catalog.json), les [27 catalogues supplémentaires](universe/README.md) et leurs références. Les briefs d’adaptation et les faits sourcés restent distincts.

```bash
# Régénérer le registre du jeu depuis les catalogues :
npm run build:universe
# Vérifier qu’il correspond aux sources sans le modifier :
npm run build:universe -- --check
npm test
npm run build
# Avec un serveur local et Chromium Playwright disponibles :
npm run test:universe
npm run test:chronicle:expansion
npm run test:chronicle:specialists
```

Les tests dédiés couvrent continuité, provenance, personnages, matériel, rechargement, validation des sessions et isolation des sauvegardes. Sur main `7ef342a`, le complément arsenal passait **537 tests Node sur 537**, sans échec ni test ignoré, puis la compilation de **52 modules en 3,31 secondes**. Les 52 promotions Prototype sont appliquées. Les contrôles suivants sont reliés au [rapport global](qa/arsenal-report.json) ; ils ne certifient pas une fidélité artistique ou mécanique 1:1.

| Contrôle arsenal | Résultat et portée | Preuve |
|---|---|---|
| Nouveau parcours navigateur | Six contrôles : huit armes, quinze armures, un module, seize adversaires dont trois boss, 24 visuels ; six victoires réelles | [Parcours](qa/arsenal-browser-report.json) |
| Régression des Chroniques | Six contrôles et 25 victoires, couvrant tous les essais exposés | [Régression](qa/arsenal-legacy-universe-report.json) |
| Production HTTP | 17 contrôles ; quinze PNG et sept bundles servis de taille et empreinte exactes ; quatre atlas répondant HTTP 200 avec les SHA attendus | [Production](qa/arsenal-production-report.json) |
| Combat ME1 | Aucune divergence sur 30 graines et 1 755 ordres acceptés | [Différentiel](qa/arsenal-weapons-me1-combat-diff.json) |
| Classeurs | 28 XLSX vérifiés ; 21 exports univers reconstruits ; 93 panneaux ciblés de trois classeurs supplémentaires et trois panneaux du principal revus | [Exports](qa/arsenal-workbook-export-report.json), [revue univers](qa/arsenal-workbook-visual-report.json), [principal](qa/arsenal-main-workbook-report.json) |

Les catalogues, sources et archives sont préservés dans les limites déclarées du [rapport de conservation](qa/arsenal-preservation-report.json). Six citations héritées restent indirectes, avec une [réserve bibliographique](qa/arsenal-source-reservations.json) explicite. La [corroboration primaire supplémentaire](qa/arsenal-additional-source-check.json) porte seulement sur quelques faits nommés de Brute, Banshee et Husk, sans valider les kits, les paramètres ATB ou les images. Ces résultats Linux Chromium ne comprennent ni nouvelle campagne ME1 complète, ni lancement Windows, ni contrôle mobile.

### Rapports conservés du lot soutiens, munitions et portraits

Le lot précédent ajoutait `tests/combat-summons.test.js`, `tests/combat-support.test.js`, `tests/universe-ammo.test.js`, `tests/chronicle-ammo-sessions.test.js` et `tests/universe-portraits.test.js`. Le [rapport historique](qa/chronicle-support-report.json) conserve les résultats suivants, qui ne sont pas les résultats du complément arsenal.

| Contrôle du lot soutiens, munitions et portraits | Résultat | Preuve |
|---|---|---|
| Tests et compilation | 473 tests Node réussis sur 473 ; build de 47 modules | [Rapport global](qa/chronicle-support-report.json) |
| Nouveau parcours navigateur | Cinq contrôles, dix cartes de munitions, quatre cartes de soutien, trois portraits et une victoire réelle | [Parcours du lot](qa/chronicle-support-browser-report.json) |
| Régression des Chroniques | Six contrôles et seize victoires ; réalisée avant la dernière correction SVG, couverte ensuite par le parcours final et la production | [Régression](qa/chronicle-support-legacy-universe-report.json) |
| Production HTTP | Douze contrôles, onze PNG chargés et sept bundles servis vérifiés par empreinte | [Production](qa/chronicle-support-production-report.json) |
| Combat ME1 | Événements, bilans et résultats d’ordres identiques sur 30 graines et 1 755 ordres acceptés | [Comparaison déterministe](qa/chronicle-support-me1-combat-diff.json) |
| Classeurs | 28 XLSX vérifiés, 21 exports univers reconstruits ; 30 panneaux ciblés de deux classeurs univers et trois panneaux du principal revus | [Exports](qa/chronicle-support-workbook-export-report.json), [revue univers](qa/chronicle-support-workbook-visual-report.json), [principal](qa/chronicle-support-main-workbook-report.json) |

Ces contrôles ne constituent ni une nouvelle campagne ME1 complète de 21 combats, ni un lancement Windows, ni une certification 1:1. Le premier parcours navigateur écrit `test-results/universe-report.json` ; le complément pouvoirs, modules et lecture écrit `test-results/chronicle-expansion-report.json`. Les rapports historiques gardent les résultats de leur propre exécution.

### Rapports conservés du lot spécialistes

Le [rapport historique du complément spécialistes du 25 octobre 2026](qa/chronicle-specialists-report.json) rassemble les 396 tests de ce lot, son parcours, ses six armes, trois actions, six bancs et sept lectures, ses régressions et ses exports. Son contrôle différentiel de combat ME1 conservait les mêmes événements et bilans sur 30 graines et 1 755 ordres acceptés. Les limites des sources et de la présentation restent distinctes des tests fonctionnels.

La régression remporte les **16 essais** ; les **dix contrôles de production HTTP** passent avec les fichiers compilés réels, dont le rayon et les grenades sans harnais de développement. La campagne ME1 termine ses 21 combats et restaure sa sauvegarde. Les audits des 28 classeurs passent. La [revue visuelle du 25 octobre](qa/chronicle-specialists-workbook-visual-report.json) couvre 81 panneaux ciblés de onze classeurs, sans inspection complète de toutes leurs feuilles.

### Rapports conservés du 24 octobre

Le [rapport du complément du 24 octobre 2026](qa/chronicle-expansion-report.json) relie les **358 tests réussis**, la compilation, les quatre contrôles navigateur et les six contrôles de régression de cette version. Son parcours exécutait les dix pouvoirs ajoutés, remportait six essais et visitait les 42 pages des neuf lectures. Ses 21 combats de campagne ME1 et ses reprises passaient ; ses 18 simulations de campagne remportaient 378 combats et validaient 522 sauvegardes. Ces rapports gardent leurs résultats et empreintes propres.

Les 28 classeurs sont vérifiés contre les catalogues. La [revue visuelle ciblée](qa/chronicle-expansion-workbook-visual-report.json) couvre 46 panneaux conservés avec leurs empreintes : elle ne constitue pas une inspection intégrale de tous leurs onglets. Les [références des pouvoirs et leurs limites](research/chronicle-power-sources.md) distinguent le manuel officiel consulté localement des attributions de compagnons issues de références secondaires.

Les **huit contrôles de production HTTP** passent avec les vrais bundles compilés, sans accès au harnais de développement : reprise de campagne, ateliers ME2 et ME3 séparés, préparation Ingénieur et ses deux modules, lecture de Revelation restaurée à sa page enregistrée. Les dix PNG et les six fichiers JavaScript chargés ont les tailles et empreintes attendues, sans requête distante ni erreur du jeu. Ce parcours Linux Chromium ne valide pas un exécutable Electron Windows ; la navigation `file://` reste bloquée par la politique du navigateur géré.

![Préparation Ingénieur ME3 avec deux ports de modules et statistiques ATB adaptées](screenshots/chronicle-expansion-two-module-ports.png)

![Une page sourcée du parcours documentaire Initiation](screenshots/chronicle-expansion-documentary-page.png)

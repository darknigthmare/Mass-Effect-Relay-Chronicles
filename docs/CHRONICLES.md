# Chroniques — œuvres, segments et essais tactiques

Les **Chroniques** ouvrent un registre de 28 œuvres et 48 segments explicites, puis seize essais ATB indépendants dans sept œuvres : Mass Effect 2, Mass Effect 3, Andromeda, Infiltrator, Galaxy, Redemption et Paragon Lost. Seize parcours documentaires proposent 52 pages de lecture dans des contextes de romans et comics. La campagne ME1 conserve ses cartes, son commando, son inventaire et ses sauvegardes.

**Lot soutiens, munitions et portraits du 25 octobre 2026, basé sur `748b965`.** Le registre reconstruit conserve **6 656 fiches : 1 330 dans le principal et 5 326 dans les 27 catalogues supplémentaires**. Les 17 nouvelles promotions concernent quatre pouvoirs de soutien, dix pouvoirs de munitions exposés et trois portraits partiels. Le décompte vérifié est de **530 Prototype, 6 120 Défini, trois Intégré et trois Validé, avec 449 sources**. Le [rapport du lot](qa/chronicle-support-report.json) relie validation fonctionnelle, exports et limites de fidélité.

Le complément spécialistes précédent, basé sur `7fe7a88`, ajoutait 37 promotions Prototype : huit profils de personnages, six armes, sept fiches de pouvoirs et seize références documentaires. Ses rapports restent historiques. Une fiche du registre ne devient pas automatiquement visible, sélectionnable ou jouable : sa provenance doit autoriser le segment et l’essai choisis. Les campagnes intégrales, dialogues, cartes et scènes des œuvres supplémentaires restent à produire ; aucune fidélité 1:1 n’est certifiée par ces essais.

## Ouvrir une chronique

Depuis le titre ou la pause de la campagne, choisir **Chroniques**, puis une **œuvre** et un **chapitre ou une période**.

- **Registre** : rechercher parmi les personnages, équipements, pouvoirs, récits et lieux autorisés. Une fiche affiche son statut, ses conditions, ses repères et ses sources.
- **Essai tactique** : choisir l’essai proposé, préparer un groupe d’un à trois personnages, puis lancer l’escarmouche. Certains contextes proposent seulement des références.
- Dans les trois ateliers, choisir un profil de combat disponible, une arme et, pour le protagoniste autorisé, une armure. Les modules compatibles disposent de deux ports ; les choix incompatibles restent indisponibles avec leur motif.
- **Lecture** : ouvrir le parcours documentaire du segment, avancer ou revenir parmi ses pages et consulter leurs sources. La page atteinte est enregistrée sans récompense ni choix ajouté au récit.
- Enregistrer, reprendre, exporter ou importer la chronique depuis ce même espace. Le retour ramène au titre ou à la pause de la campagne.

Les combats utilisent le mode Attente. Les armes conventionnelles des profils ME2, ME3 et Andromeda emploient un chargeur et une réserve ; **Recharger** consomme une action ATB. Les capacités, statistiques, réserves et adversaires des essais suivent les réglages de ce prototype.

Les **42 profils sélectionnables sont comptés par œuvre** : un même personnage peut avoir plusieurs profils distincts selon son contexte. Les capacités manquantes restent signalées dans chaque préparation. Les huit profils supplémentaires restent réservés aux six bancs d’extensions ou de bonus : leur présence n’est pas ajoutée aux dix essais antérieurs.

## Seize essais, quatre périmètres

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

Cela représente **quatre oppositions à types d’adversaires référencés**, **trois bancs à cibles abstraites**, **trois ateliers d’équipement** et **six bancs de spécialistes**. Les six derniers utilisent exclusivement des mannequins originaux et la dotation abstraite du profil, sans équipement supplémentaire. Ils ne rejouent aucune mission et ne décident d’aucun recrutement, loyauté ou survie dans une campagne. Les effectifs, cartes de combat, durées, valeurs et commandes ATB sont adaptés. Une victoire enregistre la réussite de l’essai ; elle n’accorde ni crédits, ni expérience, ni choix canoniques à la campagne.

## Présence des personnages et du matériel

Les seize essais exposent **42 profils de personnages sélectionnables au total**, tous partiels. Un même personnage dans deux œuvres possède deux identifiants distincts. Chaque sélection demande une autorisation dans l’essai choisi. Les pouvoirs absents du moteur ou insuffisamment documentés ne sont pas ajoutés par analogie.

Les ateliers proposent **76 équipements sélectionnables** : 11 dans ME2, 31 dans ME3 et 34 dans Andromeda, soit **64 armes, 10 armures et deux familles de modules**. Chaque modèle doit satisfaire simultanément les conditions de l’œuvre, du segment, de l’essai, du porteur et des mécaniques disponibles. Les armures personnelles sont réservées à Shepard ou Ryder selon l’œuvre. Les armes lourdes, tirs chargés, variantes d’édition et autres modèles dont le mécanisme manque restent des références fermées.

La préparation d’atelier est libre. Elle ne simule pas l’acquisition d’origine, le recrutement, les arbres détaillés de talents, les rangs, les bonus passifs, les ressources, les achats, les crédits ou le butin. L’atelier utilise un état de test où les compagnons proposés ont rejoint le groupe et survécu ; les conditions de leurs fiches restent consultables. Les alternatives sont conservées : **Samara/Morinth** et **Ashley/Kaidan** ne peuvent pas être sélectionnés ensemble. Anderson et Alec restent limités à leurs bancs de prologue.

Les bonus d’armure, profils de familles d’armes, chargeurs et pouvoirs utilisent des valeurs ATB adaptées. La cadence, la dispersion, les sons, les améliorations détaillées et les variantes de chaque modèle ne sont pas reproduits intégralement.

## Pouvoirs et préparations

Le premier complément ajoutait dix mécaniques ATB : Attraction, Incinération, Explosion cryogénique, Tir percutant, Drain d’énergie, Fortification, Ravage, Onde de choc, Écrasement et Domination. Le complément spécialistes ajoutait **Grenade à fragmentation**, **Grenade collante** et **Soutien des boucliers**. Le lot actuel porte l’ensemble à **61 fiches de pouvoirs exposées pour 30 commandes**, plus la commande de désactivation des munitions. Les protections, cibles, durées, états et variantes restent des réglages explicitement adaptés. Les pouvoirs de loyauté ME2 ne sont proposés que dans les bancs qui déclarent cette condition préparée.

Les grenades de James et du Soldat ME3, celles du Franc-tireur ME3, de Liam et de Jaal disposent de **trois charges par escarmouche dans le réglage d’essai**. Chaque lancer accepté dépense une charge, sans clip d’arme ni délai de recharge artificiel ; aucun réapprovisionnement n’a lieu pendant le combat. La grenade collante reste un projectile différé. Le soutien de Cora restaure les boucliers des alliés vivants puis accélère temporairement leur recharge ; il ne soigne pas la santé et ne ranime personne. L’attribution non vérifiée de Flak Cannon à Peebee a été retirée de ses capacités manquantes, sans lui accorder une autre capacité.

### Soutiens autonomes

Quatre fiches correspondent à **trois actions** : Drone de combat ME2 et ME3, Tourelle de garde ME3 et Drone de défense ME3. Le Drone de combat est réservé à l’Ingénieur, Tali et Legion dans ME2, puis à l’Ingénieur et Tali dans ME3. La tourelle reste propre à l’Ingénieur ME3 ; le drone défensif à Tali ME3. Ces listes respectent les préparations et essais autorisés, sans déduction depuis un nom de classe voisin.

Chaque déploiement ajoute une entité ciblable avec ses propres PV, boucliers éventuels, propriétaire et durée. Le drone harcèle une cible et peut la déloger du couvert ; la tourelle tire automatiquement ; la garde défensive réagit aux dégâts réellement reçus par son propriétaire. Cette réaction est une convention ATB, sans simulation de proximité physique. Le budget est d’un soutien du même type par propriétaire, deux types par propriétaire et six entités par camp ; redéployer le même type le remplace. Destruction, expiration ou mise hors combat du propriétaire retirent l’entité. Ces durées, plafonds et règles de retrait sont des choix du prototype.

Les soutiens ne sont pas commandables et ne prennent pas la place d’un équipier. Ils ne reçoivent ni médi-gel, ni Unité, ni Soutien des boucliers. Leur disponibilité ne suspend pas le mode Attente ; ils cessent d’agir pendant une vraie attente d’ordre ou une pause. La victoire et la défaite dépendent des combattants natifs, jamais des soutiens survivants.

### Modes de munitions appris

Dix fiches exposées couvrent **six modes exclusifs** : incendiaire, cryogénique, disruptif, perforant, distorsion et déchiqueteur. ME2 propose les six ; ME3 en propose quatre, sans mode déchiqueteur ni Warp Ammo. Les permissions sont reconstruites depuis le kit et l’œuvre, avec les conditions de loyauté conservées. Les consommables de munitions Andromeda restent fermés faute de règle individuelle suffisamment vérifiée.

Choisir ou désactiver un mode consomme un ordre ATB, sans réserve supplémentaire, remplissage du chargeur ou recharge temporelle ajoutée. Un seul mode reste actif. Les effets concernent les tirs contrôlés, rafales et techniques d’élite d’armes conventionnelles à clips ; pouvoirs, invocations, armes à chaleur et six armes spéciales restent exclus. Incendiaire et cryogénique exigent des dégâts réels de santé et respectent protections et immunités. Les autres modes modifient leurs couches de dégâts adaptées ; la munition perforante ne simule pas la traversée du décor. Multiplicateurs, accumulation de gel et durées restent des réglages ATB. Voir les [références et limites](research/chronicle-support-sources.md).

Shepard peut choisir les **six classes dans ME2 et les six classes dans ME3**, en plus de la dotation par défaut conservée pour les anciennes sessions. Ryder dispose de **trois préparations de compétences — combat, biotique, technologie — et de sa dotation par défaut**. Ces préparations ne reproduisent ni tout l’arbre des talents ni les bonus passifs des profils d’Andromeda. Les compagnons gardent leur kit autorisé et les bancs de prologue gardent leur dotation par défaut. Les capacités manquantes restent affichées.

Deux **familles de modules ME3**, canon et chargeur, utilisent les ports `weaponMod` et `weaponMod2`. Elles demandent une arme ME3 de famille fusil d’assaut à clips, explicitement équipée dans l’atelier. Les deux familles peuvent coexister ; dupliquer une famille est refusé avec un motif par port. Il ne s’agit pas de nouveaux rangs ou modèles officiels certifiés. Le canon multiplie les dégâts des tirs par 1,12 sans renforcer les pouvoirs. Le chargeur conserve le total de munitions : l’Avenger passe de 18/72 à 23/67 dans ce réglage ATB. Remplacer ou retirer l’arme retire ses modules ; sélectionner la même arme les conserve.

## Armes spéciales

Falcon et les deux Scorpion lancent un projectile qui explose après un délai, avec des dégâts réduits sur les autres adversaires. Le P.A.W. canalise un rayon à chaleur, le Reegar un jet électrique consommant ses clips par impulsion, et le Sweeper une salve énergétique à chaleur. Une canalisation s’interrompt par annulation, mise hors combat ou neutralisation ; les projectiles déjà lancés restent en vol. Une victoire attend la résolution des projectiles encore dangereux. Les profils à chaleur n’héritent pas de réserves de clips.

Ces six profils restent limités aux ateliers ME3 ou Andromeda. Falcon ne reçoit pas les deux modules conçus pour les fusils d’assaut conventionnels. Délais, zone, suivi de cible, chaleur, munitions, trajectoires et dégâts ne constituent pas une reproduction intégrale des modèles originaux. Voir les [sources et limites vérifiées](research/chronicle-specialist-sources.md).

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

Un atlas local de 1536 × 1024 fournit **trois bustes de prototype**, associés aux identités exactes `ME2-CHR-MIRANDA`, `ME2-CHR-THANE` et `ME3-CHR-GARRUS`, dans leurs essais autorisés. Le Garrus de ME3 n’est pas utilisé pour ME1 ou ME2. Les autres profils et les soutiens conservent des symboles de prototype. Les silhouettes de ME1 ne sont pas réattribuées à d’autres identités.

Ces bustes partiels ne livrent ni sprites en pied, ni huit directions, ni animations ou variations d’équipement. Le débordement de cellules voisines est corrigé par un découpage SVG ; sept captures finales d’interface ont été revues. Cette correction de présentation ne certifie pas les détails générés contre les modèles d’origine. Voir le [registre des assets](ASSETS.md), la [revue visuelle finale](qa/chronicle-portrait-ui-review.json) et les [références de portraits](research/chronicle-portrait-sources.md).

## Sources, code et vérifications

| Fichier | Responsabilité |
|---|---|
| [`continuity-data.js`](../src/continuity-data.js) | Œuvres, segments explicites, réserves et règles documentaires de provenance |
| [`universe-data.js`](../src/universe-data.js) | Registre généré à partir des catalogues, sans promotion de leurs statuts |
| [`continuity.js`](../src/continuity.js) | Contexte, filtrage et validation de la base des sessions |
| [`universe-actors.js`](../src/universe-actors.js) | Profils partiels, autorisations des groupes et seize essais |
| [`universe-specialist-scenarios.js`](../src/universe-specialist-scenarios.js) | Six bancs d’extensions ou de bonus, sans ouverture des autres scènes |
| [`universe-equipment.js`](../src/universe-equipment.js) | Matériel, quatre emplacements, compatibilité par port et effets disponibles |
| [`universe-powers.js`](../src/universe-powers.js) | Liaisons sourcées, kits, classes et conditions des pouvoirs |
| [`chronicle-story.js`](../src/chronicle-story.js) | Seize lectures, 52 pages, provenance et découvertes validées |
| [`universe-weapon-profiles.js`](../src/universe-weapon-profiles.js) | Six profils d’armes ATB sans chargement du catalogue depuis le combat |
| [`combat-summons.js`](../src/combat-summons.js) | Plans purs des entités, durée, plafonds, réactions et retrait des soutiens |
| [`universe-ammo.js`](../src/universe-ammo.js) | Modes appris exclusifs, compatibilité et effets par couche de dégâts |
| [`universe-portraits.js`](../src/universe-portraits.js) | Trois bustes associés aux identités et contextes exacts |
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

Les tests dédiés couvrent continuité, provenance, personnages, matériel, rechargement, validation des sessions et isolation des sauvegardes. Le lot actuel ajoute `tests/combat-summons.test.js`, `tests/combat-support.test.js`, `tests/universe-ammo.test.js`, `tests/chronicle-ammo-sessions.test.js` et `tests/universe-portraits.test.js`. Le [rapport global](qa/chronicle-support-report.json) conserve les résultats suivants.

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

# Armax — fiches types, exemples et liaisons

**25 novembre 2026 — conception documentaire et associations artistiques du lot 16.** Ce document applique les fiches A–J de la rubrique 27 du guide général. Référence : [bible intégrée](BIBLE_ARMAX_INTEGREE.md) et [RC-ARMAX-0.1](common-rules.json). Les exemples initiaux conservent leurs sources historiques ; la section 15 décrit les nouveaux candidats fixes.

## 1. Une référence explicite pour chaque objet

Une association se compose de **source + identifiant + rôle**. Un ID de sprite ne devient pas un ID de combattant. Les nouveaux IDs de scène, liaison ou règle désignent des besoins de conception ; ils ne prouvent ni image produite ni disponibilité runtime.

| Sujet | Source et ID existants | Association |
|---|---|---|
| Saren ME1 | [fighters.json](../lot04/fighters.json), armax-saren-me1 | Fiche de kit ; actions préfixées par ce même ID |
| Nyreen ME3 | [fighters.json](../lot04/fighters.json), armax-nyreen-me3 | Fiche de kit et récits ; finalisation armax-nyreen-me3-finisher |
| Grunt ME2 | [catalogue ME2](../../universe/catalogs/ME2.json), ME2-CHR-GRUNT | Identité source ; kit décrit dans la continuation |
| Grunt, pose de garde | [production.json](../../combat-2d/production.json), ME2-VS-GRUNT-GUARD-01 | Asset de pose ; ne remplace pas le kit |
| Legion ME2 | [catalogue ME2](../../universe/catalogs/ME2.json), ME2-CHR-LEGION | Identité source ; kit décrit dans la continuation |
| Corps de Legion | [catalogue lot 13](../lot13/production-catalog.json), chr_me2_legion_standard | Manquant de corps suivi, sans image dans ce périmètre |
| Drone de Legion | [production.json](../../combat-2d/production.json), ME2-VS-LEGION-DRONE-IDLE-01 | Asset distinct du corps ; propriétaire futur Legion |
| Port Hanshan | [production.json](../../combat-2d/production.json), ME1-VS-PORT-HANSHAN-REF-01 | Référence de composition ; les IDs FAR/ROOM/NEAR sont des plans prototypes |
| Calques de Port Hanshan | [Catalogue lot 16](../lot16/production-catalog.json), `layer_port_hanshan_architecture_distant_fixed`, `layer_port_hanshan_rear_structures_fixed`, `layer_port_hanshan_floor_fixed` | Composants PH-20/PH-30/PH-40 de cette même composition ; G/J, sans création de trois arènes |
| L’Homme Trouble assis | [Catalogue lot 16](../lot16/production-catalog.json), `chr_me2_illusive_man` | Pose additionnelle sur une identité existante ; B/F/J, briefing et présence narrative ME2 |
| Fauteuil de l’Homme Trouble | [Catalogue lot 16](../lot16/production-catalog.json), `prop_me2_illusive_man_chair` | Accessoire isolé associé à `chr_me2_illusive_man` ; B/F/J, sans action de combat |
| Coque d'Hagalaz | [catalogue lot 13](../lot13/production-catalog.json), stg_me2_hagalaz_broker_hull | Sous-zone extérieure ME2 ; master aplati |
| Archonte | [fighters.json](../lot04/fighters.json), armax-archon-andromeda | Boss à objectifs, hors Versus standard |

Le catalogue lot 13 est un suivi de manquants et de candidats visuels ; il n'absorbe pas arbitrairement les kits et récupérations précédents. Pour le réunir ultérieurement à un autre catalogue, déclarer les correspondances et vérifier les doublons par identité, version et usage.

## 2. Contrat des dix fiches

| Fiche | Champs nécessaires | Complément Armax |
|---|---|---|
| A — Projet | ID, titre, version, œuvres, périodes, piliers, format, plateformes, modes, scope, DA, risques, critères | RPG hôte/Armax distincts ; RC-ARMAX-0.1 ; phase sprites fixes |
| B — Personnage | Identité/version, sources, morphologie, personnalité, relations, kit, ressources, récit, costumes, assets, statuts | Classe/profil séparé du costume ; éligibilité Versus/boss/soutien explicite |
| C — Action/projectile | ID, porteur, source, commande, conditions, D/A/R, volumes, dégâts, ressources, résultats, cancels, effets et tests | Protection commune, budget de combo, propriétaire du projectile, adaptations et source de chaque capacité |
| D — Neutralisation | Nom/origine, intention, conditions, cibles, plans, durée, effets, repli, résultat et retour | Après KO final fixé ; zéro dégât/jauge ; aucun déblocage exclusif ; nom original signalé |
| E — Route | Personnage/version, statut narratif, motivation, rival, combats, revers, final, outro, scènes, reprises | Cinq combats / sept temps ; rivaux de simulation distincts des relations attestées |
| F — Chapitre/scène | Campagne, ordre, époque, objectif, acteurs, émotion, dialogues, plans, continuité, checkpoint, sources | Cadre hors diégèse ; Voie lactée/Andromeda séparées ; texte localisable hors image |
| G — Arène | Lieu/version, sources, terrain, composition, ambiance, événements, objets, connexions, profils, assets | Sous-zone exacte ; quatre axes indépendants ; master différent d'une scène jouable |
| H — Événement/interaction/liaison | Origine, destination, déclencheur, défense, délai, effets, chrono, combo, arrivée, reset, concurrence | KO final prioritaire ; destination chargée ; période compatible ; options de confort sans altération des règles |
| I — Boss | Type, rôle, échelle, arène, phases, signaux, réponses, objectifs, difficulté, reprise, Rush, assets | Réponse prévue pour chaque famille de kit ; version jouable éventuelle distincte |
| J — Asset/suivi | ID, sujet, provenance, format, dimensions, alpha, échelle, pivot, fichier, dépendances, six axes, preuve, écarts | Chemin attendu/present distinct ; mesures natives ; aucune promotion de fidélité par simple existence |

Les six axes sont **lore**, **conception**, **assets**, **intégration**, **validation**, **publication**. Lorsqu'un axe ne s'applique pas, écrire « non applicable » avec le motif. Ne pas remplacer un statut historique par une déduction générale.

## 3. Fiche A — projet rempli

**ID :** ARMAX-PROJECT. **Titre :** Mass Effect — Armax Relay Clash. **Révision :** bible du 25 novembre 2026, règles RC-ARMAX-0.1. **Nature :** mode annexe de duel latéral du RPG Relay Chronicles.

**Piliers :** identité fidèle, combat lisible, contre-jeu, récits situés, production traçable. **Périmètre :** œuvres déjà retenues dans les catalogues, avec continuités et rôles séparés. **Cibles :** web et enveloppe PC existante ; autres plateformes à décider.

**Socle P0 :** Versus local/IA, entraînement, tutoriels, commandes, ressources, règles de fin et état isolé. **Cible P1 :** routes, campagne globale, tournoi 4/8/16, boss/Rush, galerie, stages et liaisons validées. **Extensions P2 :** voir la matrice.

**Phase :** conception complète ; production artistique limitée aux éléments fixes demandés. L’exemple initial n’ajoutait aucun asset ; les candidats du lot 16 et leurs limites sont associés en section 15. **Critère :** un lot ne change que les statuts étayés par ses propres preuves. **Risques ouverts :** harmonisation des vieux combos, sous-zones exactes, géants, animations et intégration du duel.

## 4. Fiche B — Saren ME1

**Source :** armax-saren-me1 dans [fighters.json](../lot04/fighters.json). Conserver Saren vivant ME1 ; la forme finale est une autre variante. L'identité et les repères visuels se vérifient contre ses sources ; les valeurs de duel sont des créations d'équilibrage.

**Rôle :** contrôle de distance, tir puis repositionnement ; statut candidat Versus et profil de boss selon fiche, sans disponibilité runtime affirmée. **Profil de conception existant :** 1 050 PV, protection 220, vitesse 4,5 unités abstraites, saut 44 pas. L'échelle des unités doit être raccordée au renderer avant test.

**Ressource personnelle existante :** deux charges tactiques, recharge individuelle de 240 pas hors attaque ; renfort de 15 dégâts sans bonus de vitesse ; après consommation des deux, prochaine récupération de spécial augmentée de 6 pas. Ces chiffres ne sont pas des statistiques officielles.

**Actions :** normaux, trois spéciaux, prise, Directive absolue et Dernier avertissement conservent leurs IDs de lot. Les règles communes de jauge, garde et combo sont RC-ARMAX-0.1. **Route :** développement situé dans l'[annexe narrative](CAMPAGNES_ET_SCENES.md), avec les relations originales déjà écrites conservées.

**Assets :** base, directions compatibles, arme, projectile, impacts, portraits et plans narratifs ont des besoins séparés. **Acceptation :** silhouette/version correcte, source de chaque capacité, plan d'approche et de défense, fiche d'action exploitable, route et disponibilité honnêtes. **Statut :** conception définie ; aucune validation de combattant jouable déduite de cet exemple.

## 5. Fiche C — Tir de verrouillage de Saren

**ID :** armax-saren-me1-special-1. **Porteur :** armax-saren-me1. **Source de données :** fighters.json, spéciale 1. **Nom et mécanique :** création Armax ; canonicalMechanic=false dans la source. Une référence générale de Saren n'établit pas que ce nom ou cette commande existe dans ME1.

| Champ | Valeur ou état de conception |
|---|---|
| Commande | 236S, orientée relativement à l'adversaire |
| Fonction | Tir horizontal de contrôle ; un projectile |
| Conditions | Profil sélectionné et action permise ; pas de lancement pendant état interdit |
| Démarrage / actif / récupération | 18 / 1 / 30 pas, valeurs de la fiche |
| Dégâts de base | 75, puis réduction de chaîne selon règle commune |
| Coût | 0 jauge commune ; renfort éventuel selon la ressource personnelle, sans modifier le coût déclaré par déduction |
| Portée | 5,5 unités de conception ; conversion monde à définir |
| Résultat touche | Hitstun cible 28 pas ; gain offensif de spécial +4, plafonné dans la chaîne |
| Résultat garde | Avantage visé de l'attaquant : −12 pas au contact de référence ; grattage selon règle commune ; distance réelle à mesurer |
| Résultat à vide | Pas de gain ; récupération prévue ; projectile expiré à sa limite |
| Réponse prévue | Éviter par accroupissement à moyenne portée ; pas de salve automatique |
| Annulation | Spécial de conversion vers super sur touche selon les règles communes |
| Zones vulnérables/frappe | Coordonnées non définies ; à produire depuis pose, échelle et trajectoire |
| Vitesse / durée / émission | Non définies ; ne pas les déduire de l'image ou de la fenêtre active du porteur |
| Collision avec autre projectile | Niveau d'annulation/réflexion à définir ; aucune réflexion universelle présumée |
| Effets | Départ, trajet, impact, garde et dissipation séparés si nécessaire |
| Tests futurs | Deux orientations, accroupissement, coin, garde à plusieurs distances, interruption, KO et transition |

**Limite :** le tableau termine l'association documentaire, pas l'équilibrage. Une valeur d'avantage unique ne certifie pas un projectile à toutes les distances. Les champs inconnus interdisent de déclarer la fiche prête à importer sans complément.

## 6. Fiche D — Zone évacuée de Nyreen

**ID :** armax-nyreen-me3-finisher. **Nom individuel :** Zone évacuée, conservé du lot 04 ; **famille :** Neutralisation décisive, nom créé pour le projet. **Contexte :** simulation Armax, pas prolongation canonique du destin de Nyreen.

**Condition :** KO final et résultat enregistrés, entrée L+M+H dans les 120 pas autorisés, vainqueur connu et cible compatible ; exclure temps écoulé, égalité, forfait, abandon et déconnexion. **Durée source :** 165 pas de présentation, environ 2,75 secondes à 60 Hz. **Effet de jeu :** zéro dégât, aucune jauge, aucune récompense exclusive.

**Déroulement conservé :** Nyreen désactive la projection adverse, vérifie le signal d'évacuation, puis baisse sa garde. **Brief de plans :** un plan moyen lisible du geste et de la cible ; un cadrage de débriefing qui montre son attention à la protection des autres. Lumière et costume reprennent la version ME3 Omega de la fiche, avec VFX séparés.

**Cible mécanique :** extinction de système dans le cadre ; pas d'anatomie humaine superposée. **Géant/installations :** signal de neutralisation et plan de conclusion, sans prise de corps. **Réaction absente :** victoire sobre de Nyreen. **Tournoi :** sobre ou passage immédiat.

**Acceptation :** aucun résultat modifié, aucune action après retour aux menus, même déblocage en passant la scène, pas d'effet sur la campagne. **Production restante :** poses, réaction de cible, VFX, son, caméra et raccord moteur.

## 7. Fiches E et F — contrats de route et de scène

Les six routes détaillées sont dans [Campagnes et scènes](CAMPAGNES_ET_SCENES.md). Elles réutilisent les IDs de personnages et de récits du lot 04 ; leurs plans sont des objets d'illustration supplémentaires.

Une route E est recevable avec les sept temps narratifs, les cinq rencontres ordonnées, la qualification du rival, l'objectif final, les conséquences, l'outro et un checkpoint. Une rencontre de rival ne devient pas une preuve canonique simplement parce que la relation politique ou personnelle est attestée.

Une scène F doit pouvoir être produite sans réinventer le contexte : numéro de plan, fonction dramatique, acteurs/version/costume, pose, direction du regard, action, cadrage, point focal, espace de texte, palette, accessoires, état du décor et raccord précédent/suivant. Les phrases sont originales et leurs clés de localisation restent séparées de l'image.

Le scénario distingue résultat du combat, choix de dialogue et indicateur de scène vue. Une scène passée doit terminer sa transition logique ; elle ne doit pas jouer deux fois sa récompense. Un chapitre quitté avant validation reprend au checkpoint, sans considérer l'illustration aperçue comme chapitre achevé.

**Acceptation documentaire :** aucun plan orphelin, aucune sous-zone renommée artificiellement, aucun costume pris d'une autre époque. **Acceptation future :** route parcourue jusqu'à sa conclusion, choix/reprise et galerie observés dans le moteur.

## 8. Fiche G — coque d'Hagalaz ME2

**ID :** stg_me2_hagalaz_broker_hull. **Œuvre :** ME2, DLC Lair of the Shadow Broker. **Sous-zone :** extérieur du vaisseau du Courtier. **Source de l’exemple initial :** catalogue lot 13, image héritée du lot 07 ; même identité conservée dans le catalogue lot 16.

**Asset existant déclaré :** public/assets/armax/lot07/stages/hagalaz-me2-shadow-broker-hull-master.png. Statut Prototype, engineIntegrated=false, fidelity1to1Validated=false. La bande latérale prolonge la coque dans une composition adaptée ; elle ne prouve pas la topologie du niveau original.

**Composition à terminer :** fond atmosphérique, architecture/capaciteurs, coque, sol de duel, avant-plan et météo séparée. Le master contient déjà des éléments météorologiques : ce ne sont pas des couches indépendantes. La bande sombre et peu profonde demande une vérification des pieds et de la caméra.

**Quatre axes :** présentation vivante/réduite/statique ; interactions selon objets spécifiés ; dangers selon télégraphes ; transitions selon liaisons. Profil Compétition initial : trois axes de gameplay désactivés, même terrain. Profil Spectacle : événements possibles après validation.

**Critères :** sujet reconnaissable à la bonne époque, sol lisible avec petits/grands gabarits, aucun vide au recadrage, annonces préservées en statique, raccords de couches vérifiés. **État actuel :** image candidate suivie ; cette fiche ne livre pas de nouvelle composition ou d'arène jouable.

## 9. Fiche H — liaison d'étude Hagalaz

**ID de conception proposé :** ARMAX-LINK-HAGALAZ-01. **Origine :** stg_me2_hagalaz_broker_hull. **Destination :** zone intérieure du Courtier ME2 à référencer et produire ; aucun ID de stage livré n'est inventé pour masquer ce manque.

**Statut lore :** lieu et contexte DLC identifiés ; trajet précis et passage de caméra à confirmer. **Statut gameplay :** adaptation originale de liaison, non intégrée. **Mode :** Spectacle/Campagne après validation, pas Compétition initiale.

**Déclencheur proposé :** action lourde identifiée près d'un accès signalé, sur touche et dans le bon sens ; une garde correcte ou un placement hors borne empêche le déclenchement. Une fois par match. Aucun pouvoir supplémentaire n'est attribué au personnage.

**Résolution :** vérifier destination disponible ; priorité au KO final ; terminer la chaîne ; aucun dégât bonus ni jauge ; suspendre le chrono ; neutraliser les éléments transitoires selon leur règle ; restituer deux positions sûres et une orientation explicite. Les mêmes états et durées logiques s'appliquent avec présentation abrégée.

**Concurrence :** un déclenchement simultané doit suivre une règle de priorité unique enregistrée. Un échec de chargement doit empêcher le départ, sans laisser un combattant dans le vide. **Reset :** liaison indisponible après usage jusqu'au prochain match ; géométrie et objets remis à leur état initial.

**Validation future :** défense du déclenchement, mur, KO simultané, cible géante, drone actif, retour menu, reprise et présentation réduite. **Dépendances bloquantes :** destination, collisions, plans de transition et référence du parcours.

## 10. Fiche I — Archonte, boss à objectifs

**ID :** armax-archon-andromeda. Source : [fiches lot 04](../lot04/fighters.json). L'Archonte commande le réseau et les dangers d'arène ; la fiche ne lui invente pas un duel de boxe ou des pouvoirs de Shepard.

| Phase source | Règle de conception conservée | Réponse prévue |
|---|---|---|
| armax-archon-andromeda-phase-1 — Contrôle du réseau | De 100 à 70 % ; deux interfaces ; annonce 60 pas, canal 45 pas ; ouverture 180 pas | Activer pendant les annonces, reprendre le canal sans perte totale |
| armax-archon-andromeda-phase-2 — Relais contestés | De 70 à 35 % ; un gardien et un relais en alternance ; ouverture 180 pas | Détruire le gardien ou profiter de ses 48 pas d'armé |
| armax-archon-andromeda-phase-3 — Rupture de liaison | De 35 à 0 % ; trois commandes successives ; fenêtre de 210 pas | Deux zones sûres toujours visibles ; frapper le dispositif pendant l'ouverture |

Ces chiffres sont des adaptations originales déjà écrites dans le lot 04. Ils ne décrivent pas exactement les paramètres de la rencontre officielle.

**Caméra :** doit rendre lisibles interfaces, zones sûres et cible vulnérable. **Compatibilité :** chaque kit autorisé doit atteindre les objectifs ; un contrôle de réseau ne supprime pas les commandes du joueur. **Conclusion :** désactivation unique, disparition des dangers et score figé ; Liaison coupée facultative après résultat.

**Boss Rush :** utiliser le même identifiant de rencontre et version de règles ; relever difficulté, temps, tentatives et récupération du règlement. **Versus :** exclu tant qu'une variante propre n'est pas conçue et validée.

**Critères :** toutes les phases gagnables, annonces lisibles en mode statique, changement de seuil non répété, aucun projectile hors écran non annoncé, une seule récompense. **Statut :** conception, pas boss exécuté dans le moteur.

## 11. Fiche J — preuve et disponibilité d'un asset

Exemple documentaire initial : master de coque Hagalaz déjà associé au stage. Les nouvelles preuves du lot 16 sont présentées séparément en section 15.

| Axe | État retenu dans cette révision |
|---|---|
| Lore | Sources du lot conservées ; détails et topologie encore sous réserves |
| Conception | Sous-zone et usage définis ; adaptation latérale explicitée |
| Assets | Candidat présent déclaré par le catalogue ; aucune nouvelle image d’Hagalaz dans le lot 16 |
| Intégration | false dans le catalogue ; aucune promotion |
| Validation | Revues historiques propres au lot ; pixels non réinspectés dans cet exemple documentaire |
| Publication | Fichier présent dans l'arbre Git de référence ; mise en production jouable non déduite |

Le catalogue conserve chemin, provenance, blob et réserves. Les mesures d'alpha, dimensions, pivot, marges et couleur doivent venir d'une inspection du fichier concerné, pas de cet exemple. Une valeur absente reste inconnue.

Une nouvelle revue consigne date, commit, fichier exact, méthode, résultat et limites. Une publication en PR n'est ni une fusion ni un déploiement. Les chiffres de couverture documentaire n'augmentent pas les compteurs d'assets vérifiés.

## 12. Compléments restant à produire

Les fiches structurent les travaux futurs : compléter les collisions et trajectoires des actions, documenter les sources fines des pouvoirs, préparer les sous-zones de récits, produire les plans narratifs, terminer les couches nécessaires, puis intégrer les parcours. Les bibles des lots restent les sources des détails de personnage ; ce document fournit leur cadre commun et des exemples vérifiables.

Les changements de contenu ou de disponibilité passent par le catalogue concerné et son export. La présente association de méthode n'altère pas les 172 entrées du lot 13 ni son classeur historique.


## 13. Raccordement historique des images fixes du lot 14

Le [catalogue lot 14](../lot14/production-catalog.json) conserve son bilan historique du 25 novembre 2026 : 188 fiches, 128 avec image candidate et 60 sans. Les références lot 13 des exemples précédents restent des liens historiques ; leurs identités et usages ont été conservés.

| Fiche | Actifs liés | Portée de l’association |
|---|---|---|
| B — Personnage | CAT6 Heavy, CAT6 Sniper, Amanda Kenson, Suvi Anwar | Une pose observée par sujet ; Kenson/Suvi restent narratifs ; Suvi inclut le siège |
| C — Action/projectile | Tir percussif, traceur chaud, impacts, Singularité, Shockwave, flash, omni-outil et grenade-disque | Composants fixes ; pas de fermeture automatique d’une action ni d’attribution canonique non démontrée |
| G — Arène | Armax hall nord, Fatal Error ; Omega Water Treatment, passerelle Doru District, Afterlife commandement | Cinq points de vue documentés ; sol jouable, couches et connexions à produire |
| J — Asset/suivi | Les 21 PNG, dont R0 omni-outil écarté | Native PNG, SHA-256, dimensions, alpha, prompt exact, inputs ordonnés, sources, revues et réserves |

Les [associations machine-lisibles](../lot14/bible-asset-associations.json) conservent les IDs et les références d’action existantes. La grenade ME1 ne crée pas un équipement pour chaque combattant ME1 ; un effet ME2 ne vaut pas preuve du même effet dans un autre opus. Les règles RC-ARMAX-0.1, dégâts, coûts et ressources ne sont pas modifiés par l’existence d’un PNG.

La [revue artistique](../lot14/independent-art-review.json), les [lacunes](../lot14/REFERENCE_GAPS.md) et les [dépendances restantes](../lot14/remaining-work.json) sont des pièces de la fiche J. Aucun de ces actifs ne reçoit les statuts Intégré ou Validé.

## 14. Associations de tout le catalogue courant

L’[index consolidé](ASSOCIATIONS_CONTENU.md) et sa [version structurée](content-associations.json) appliquent ces modèles aux **192 fiches du lot 16**, dont les 188 identités antérieures conservées. Une association indique le cadre à consulter ou compléter ; elle ne prouve pas que la fiche soit terminée. Le catalogue reste l’autorité sur les identités, usages, fichiers et statuts.

Les costumes sont regroupés en 19 ensembles identité/œuvre, sans fusion de variantes. Deux liens exacts rejoignent les fiches lot 04 de Kai Leng et Balak ; leur divergence de sélection est conservée. Quatre liens documentaires rejoignent Legion standard, Legion loyauté et les deux costumes de Grunt, sans inventer de kitId Versus.

Les **52 masters de décor** conservent leurs sous-zones. Les **3 calques de Port Hanshan** sont des composants en G/J, portant le rôle `calque_decor` ; les deux ensembles forment les 55 fiches de catégorie stage. Les liens narratifs positifs, les simples mentions de lieu et les avertissements interdisant une substitution sont enregistrés séparément. Les trois rapprochements d’action déjà proposés au lot 14 gardent leurs réserves d’attribution et ne modifient pas RC-ARMAX-0.1.

## 15. Raccordement des images fixes du lot 16

Le [lot 16](../lot16/README.md) ajoute **6 PNG natifs pour 5 sujets, dont 5 sélectionnés**. Les trois calques et le fauteuil créent quatre fiches ; la pose assise complète `chr_me2_illusive_man`. Le [catalogue courant](../lot16/production-catalog.json) compte **192 fiches, 132 avec candidat et 60 sans**. Les [associations du lot](../lot16/bible-asset-associations.json) donnent pour chaque sujet le chemin du PNG sélectionné, les rubriques du guide, le parent documentaire et les réserves.

| Sujet et identifiant | Fiches | Association précise et portée |
|---|---|---|
| [Architecture distante PH-20](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_architecture_distant_fixed), `layer_port_hanshan_architecture_distant_fixed` | G, J | Composant PH-20 de `ME1-VS-PORT-HANSHAN-REF-01` ; architecture extérieure isolée depuis un candidat interne historique. Îlot détaché et franges cyan à contrôler. |
| [Structures arrière PH-30](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_rear_structures_fixed), `layer_port_hanshan_rear_structures_fixed` | G, J | Composant PH-30 de la même composition ; architecture intérieure séparée du sol. Raccord, baies et franges sous réserve. |
| [Sol PH-40](ASSOCIATIONS_CONTENU.md#layer_port_hanshan_floor_fixed), `layer_port_hanshan_floor_fixed` | G, J | Composant PH-40 ; R1 sélectionné après amélioration de la jonction avec PH-30. R0 conservé et non sélectionné. Largeur native de 1 671 pixels contre 1 672 pour PH-20/PH-30. |
| [Fauteuil de l’Homme Trouble](ASSOCIATIONS_CONTENU.md#prop_me2_illusive_man_chair), `prop_me2_illusive_man_chair` | B, F, J | Accessoire narratif ME2 relié à `chr_me2_illusive_man` : identité et contexte de briefing, préparation de scène, preuve de l’asset. Dossier, jonctions cachées et alpha sous réserve. |
| [L’Homme Trouble assis](ASSOCIATIONS_CONTENU.md#chr_me2_illusive_man), `chr_me2_illusive_man` | B, F, J | Pose assise additionnelle pour présence narrative ME2, avec la pose debout lot 13 conservée. Une jambe croisée et une main levée avec cigarette sont observées ; le fauteuil inclus diffère du fauteuil vide. |

Les calques renvoient aux rubriques **02, 13, 14, 15, 17, 22, 26 et 27**. Le fauteuil et la pose assise renvoient aux rubriques **02, 03, 07, 09, 10, 16, 17, 26 et 27**. Pour cette paire narrative, la fiche **F** décrit la fonction de scène et la fiche **J** conserve les preuves ; le cadre **C** des accessoires de combat ne lui attribue aucun coup, projectile ou pouvoir. Aucun chapitre ni numéro de plan n’est choisi par déduction, et les 36 briefs narratifs ne sont pas déclarés terminés.

**Preuves de la fiche J :** le [manifeste](../lot16/manifest.json) consigne les six fichiers, leurs empreintes, dimensions, alpha, prompts, références et états de sélection. La [revue de Port Hanshan](../lot16/qa/port-hanshan-independent-review.json) vérifie la composition des candidats ; celle de [l’Homme Trouble](../lot16/qa/illusive-man-independent-review.json) vérifie le fauteuil et la pose. Les deux images de cette paire ont un alpha maximal de 254 et des résidus faibles aux bords ; l’assise, les accoudoirs et les appuis changent de position entre elles. Leur assemblage direct reste donc non validé. Le raccord du sol R1 est amélioré sur la largeur commune sans supprimer l’écart d’un pixel ni les franges. Les sources et réserves ne certifient aucune fidélité 1:1.

La [vérification du lot](../lot16/verification.json), le [classeur courant](../lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx) et les [manquants](../lot16/MANQUANTS_2026-11-25.md) conservent la séparation entre présence, sélection, validation et intégration. Les **113 PNG annoncés au lot 15 restent non récupérés et non publiés**, selon le [constat de reprise](../lot16/RECUPERATION_LOT15.md) ; ils ne complètent aucune fiche actuelle par présomption. Les nouveaux candidats restent **Prototype**, sans moteur ou animation livrés.


## Continuation de production — lot 18

Le [catalogue courant lot 18](../lot18/production-catalog.json) compte **196 fiches : 150 avec image candidate et 46 sans**, après consolidation des sorties du lot17. Les [associations](../lot18/bible-asset-associations.json) relient les trois costumes à **B/J**, les soutiens narratifs à **B/F/J** et les quatre composants du marché Urdnot à **G/J**. Le groupe table/chaises et la console sont des props de décor ; aucun cadre C ne leur attribue un coup ou un fonctionnement interactif.

La [preuve J](../lot18/manifest.json) distingue huit nouvelles sorties pour sept sujets, douze sorties récupérées, deux sorties déjà publiées et trois hypothèses d’identité non retenues. La [relecture](../lot18/independent-review.json) conserve les mesures d’alpha et de raccord. Le [complément narratif](../lot18/BIBLE_COMPLEMENTS_LOT18.md) développe les fiches E/F de quatre routes sans les déclarer jouables.

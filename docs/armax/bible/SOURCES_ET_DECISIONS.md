# Armax — sources, décisions et portée

**25 novembre 2026 — Europe/Paris.** L’intégration initiale du guide fourni par Darknigthmare examine le dépôt au commit **4befa64285080fe016d6ecd9424b00ab4d42509f**, PR #11. La réconciliation du contenu décrite en section 6 part ensuite du lot 14 au commit **cc44ce510f1bb152fa68f3d8375a5db2745437c5**. La continuation lot 16, décrite en section 7, repart de l’état publié **71955d9143562d6a44a8b8d48bc552978372bc1e**. Les preuves de chaque passe conservent leur périmètre.

## 1. Autorité des documents

| Niveau | Document | Rôle |
|---|---|---|
| Demande du projet | Intégrer le guide à la bible selon le contexte Mass Effect | Objectif de cette livraison |
| Guide utilisateur | Combat_Games_Guide_General_v1.0.txt, version 1.0 du 25 novembre 2026, 30 rubriques 00–29 | Structure commune et exigences à contextualiser |
| Contrat courant Armax | [Bible intégrée](BIBLE_ARMAX_INTEGREE.md), [règles communes](common-rules.json), [associations](guide-associations.json) | Décisions transversales de conception et critères |
| Fiches de contenu | [Lot 04](../lot04/fighters.json), [bible détaillée](../lot04/BIBLE_EXTENSION.md), [Grunt/Legion](../../combat-2d/CONTINUATION_2026-11-19.md) | Identités, kits, actions, récits et réserves de leurs versions |
| Production artistique au moment de cette table historique | [Catalogue lot 16](../lot16/production-catalog.json), [manifeste](../lot16/manifest.json), manifestes antérieurs et récupération | Fichiers, provenance, présence et limites de cette étape ; la section 8 identifie les autorités courantes |
| Associations du contenu | [Index lisible](ASSOCIATIONS_CONTENU.md), [données](content-associations.json) | Projection des sources et correspondances documentaires ; aucun remplacement de catalogue ou de kit |
| Invariants du jeu hôte | [AGENTS.md](../../../AGENTS.md), [guide gamedev](../../GAMEDEV_GUIDANCE.md), [Chroniques](../../CHRONICLES.md) | Renderer, RPG, personnalisation, sauvegardes, périodes et vérifications |

Les nouveaux documents ne remplacent pas la provenance des lots. En cas de divergence des règles communes de duel, RC-ARMAX-0.1 arbitre explicitement. Les chiffres propres à une action restent des hypothèses de sa fiche ; ils ne sont ni automatiquement validés ni assimilés à des valeurs officielles.

La bible de 99 pages et les lots 01/02 signalés non retrouvés restent une lacune historique. Cette intégration n'en revendique pas la récupération. Le guide utilisateur n'est pas réécrit : ses 30 sections sont associées à des décisions contextualisées.

## 2. Sources Mass Effect consultées pour cette adaptation

| ID | Source | Ce qu'elle apporte | Limite |
|---|---|---|---|
| SRC-ME-EA-CALIBRATIONS | [EA/BioWare — Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations), 6 avril 2021 | Différences de combat entre épisodes et modifications de Legendary Edition ; gestion de chauffe ME1 et ajustement des munitions ME2 | Ne fournit pas de règles de duel, frame data ou ressources Armax |
| SRC-ME-EA-MEA-MANUAL | [EA — manuel Andromeda PS4 français](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-ps4-fr.pdf), pages imprimées 3, 5–6 et 16–23 | Séparation du contexte d'Andromeda, identités de Ryder, SAM, catégories de compétences et profils | Ne prouve pas qu'un kit spécifique dispose de tous les pouvoirs ni que ses règles peuvent être copiées en Versus |
| SRC-ME-EA-COSPLAY | [EA — guides de cosplay Legendary Edition](https://www.ea.com/games/mass-effect/community/cosplay-guides) | Répertoire officiel de références d'apparence pour plusieurs personnages | La consultation du répertoire ne constitue pas une nouvelle comparaison artistique des PNG |
| SRC-ARMAX-LOT04 | [Source structurée du lot 04](../lot04/fighters.json) | 14 sujets, 13 kits, scènes, noms de finalisations, phases et réserves | Données de conception, avec actions explicitement non canoniques |
| SRC-ARMAX-CONTINUATION | [Complément combat](../../combat-2d/CONTINUATION_2026-11-19.md) | Grunt, Legion, Port Hanshan, ressources et contraintes de soutien | Anciennes règles communes partiellement divergentes ; harmonisation définie ici |
| SRC-ARMAX-LOT13 | [Catalogue](../lot13/production-catalog.json) et [rapport du lot](../lot13/README.md) | 172 fiches et statistiques de présence à l’intégration initiale | Instantané historique ; pas un inventaire exhaustif de tous les kits, récupérations ou personnages de l'univers |
| SRC-ARMAX-LOT14 | [Catalogue historique](../lot14/production-catalog.json) et [associations artistiques](../lot14/bible-asset-associations.json) | 188 fiches, usages hérités et 20 associations de sujets fixes à cette étape | Images candidates ; aucune sélection de mode ni action complète déduite |
| SRC-ARMAX-LOT16 | [Catalogue courant](../lot16/production-catalog.json), [associations artistiques](../lot16/bible-asset-associations.json) et [bibliothèque de références](../lot16/reference-library.json) | 192 fiches, 5 nouvelles associations de sujets fixes ; 6 PNG dont 5 sélectionnés, avec sources et réserves | Trois calques issus de candidats internes ; fauteuil et pose narrative avec géométrie et alpha à revoir. Aucune fidélité 1:1, scène complète ou intégration moteur certifiée |

Consultation des trois pages officielles : **25 novembre 2026**. Les références détaillées de personnage et de sous-zone restent celles de chaque lot. Les sources secondaires qu'ils utilisent sont conservées avec leurs limites ; elles ne sont pas promues en source officielle.

**Qualification des nouveautés :** Protocoles de relais, sa structure de campagne, les nouveaux découpages de scènes, Neutralisation décisive, les paramètres de Boss Rush et les études de liaison sont des créations du projet. Les relations réelles de l'univers et les rencontres inventées restent identifiées séparément dans l'annexe narrative.

## 3. Arbitrages entre documents de combat

| ID | Problème observé | Décision | Conséquence |
|---|---|---|---|
| DEC-ARMAX-01 | T dans le complément ; S dans lot 04 | S commun ; T alias documentaire | Remapper les commandes sans ajouter de bouton |
| DEC-ARMAX-02 | Échappée de projection 8 ou 10 pas | 10 pas communs | Rejouer les cas de capture et relève lors de l'intégration |
| DEC-ARMAX-03 | Gains de jauge différents | 8 normal, 4 spécial, 3 garde, 5 dégâts subis ; plafond 30 | Les anciens gains ne sont plus la référence commune |
| DEC-ARMAX-04 | Réductions et annulations différentes | Lot 04 commun ; six événements et non-répétition | Les combos Grunt/Legion restent à remapper et mesurer |
| DEC-ARMAX-05 | Super 100 dans lot 04, 200 pour Grunt/Legion | 100 par défaut ; deux exceptions 200 déclarées | Préserver leurs coûts sans les baisser silencieusement |
| DEC-ARMAX-06 | Risque de mélange RPG / simulation | État et conséquences Armax isolés | Aucune résurrection, récompense ou dotation transférée implicitement |
| DEC-ARMAX-07 | Décor vivant confondu avec danger | Quatre axes indépendants ; compétition initiale neutre | Même information et mêmes règles malgré un confort local différent |
| DEC-ARMAX-08 | Gains, multi-impacts, égalité et échange insuffisamment précis | Attributions et ordres écrits dans le contrat | Décisions de conception à éprouver, pas résultat de test annoncé |

Les temps de prise propres aux fiches demeurent spécifiques ; la fenêtre d'échappée est commune. Les attaques hautes explicitement définies pour Grunt/Legion restent des particularités, sans transformer les normaux du lot 04 en overheads. Le changement de notation ne certifie pas le raccord des anciennes chaînes.

## 4. Guides de méthode appliqués

Le [registre gamedev](../../gamedev-sources.json) épingle les références à la révision **19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9**.

- [router](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/router/SKILL.md) : sélection d'un périmètre documentaire adapté au moteur conservé.
- [dialogue-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/dialogue-systems/SKILL.md) : graphes de scènes, identifiants de localisation, variables séparées et absence de récompense répétée.

Ces références apportent une méthode, pas une nouvelle dépendance. Aucun runtime Ink/Yarn, moteur ou service supplémentaire n'est installé. Les exemples d'autres moteurs ne sont pas transplantés dans Relay Chronicles.

Les jeux cités dans la rubrique 29 du guide utilisateur servent d'inspirations : récit individuel, campagne distincte, coopération éventuelle et interactions. Cette livraison ne réalise pas une nouvelle étude comparative de ces jeux ; elle n'utilise pas leurs fonctions comme preuves du lore Mass Effect.

## 5. Statistiques et preuves de l’intégration initiale

La couverture **30/30** mesure les rubriques du guide reliées à la bible. Les **90 critères** de la matrice sont des critères d'acceptation, pas 90 tests de gameplay réussis. Les six routes pilotes et leurs plans sont de la conception narrative, pas des scènes produites.

Le suivi artistique lot 13 reste inchangé : **172 fiches, 108 avec image candidate, 64 sans image**, avec ses réserves. Les 47 stages illustrés sont des sous-zones avec candidats, sans clôture automatique des couches, collisions et transitions. Les compteurs ne sont pas augmentés par les nouveaux briefs.

La vérification de cette révision porte sur les documents, les références locales, les IDs, la couverture des rubriques et la cohérence des règles. Les fichiers historiques de production, les images, les classeurs, les sources runtime et les dépendances sont préservés. Les tests de combat, le build, les rendus d'illustration, la comparaison de pixels et le parcours Windows ne sont pas exécutés pour cette modification documentaire.

La publication dans la PR courante est distincte de sa fusion et d'une livraison jouable. Le [rapport de vérification du lot documentaire](verification-2026-11-25.json) donne sa portée et ses limites, sans recycler les tests du lot artistique comme preuves de nouvelles mécaniques.

## 6. Réconciliation des associations après le lot 14

La première réconciliation de la même consigne associait individuellement les 188 entrées du lot 14 aux fiches et rubriques de la bible. Elle exposait les 16 sujets de conception examinés, les 19 groupes identité/œuvre des costumes, les 18 liens précis de décors et les 20 associations artistiques existantes. L’[index courant](ASSOCIATIONS_CONTENU.md) conserve ces correspondances, les 30 rubriques et les 90 critères initiaux.

Cette passe révèle deux divergences de rôle pour Kai Leng et Balak : le catalogue les décrit comme boss candidats, tandis que leur fiche lot 04 permet le Versus et ne coche pas boss. La décision de cette réconciliation est de conserver et signaler les deux sources. Elle n’autorise pas une nouvelle sélection. Les mentions de lieu sans sous-zone exacte et les avertissements de non-équivalence sont également conservés comme tels.

Le JSON d’associations de cette passe identifiait ses sources par chemin, sélecteur, commit et empreinte ; les références de ligne historiques restent celles du commit de base. La [vérification propre à cette passe](verification-content-associations-2026-11-25.json) contrôle la couverture, les rôles, les correspondances, les liens et la préservation de la production. Son bilan demeure **188 fiches, 128 avec image candidate, 60 sans**. Aucun asset, classeur, kit ou mécanisme jouable n’était ajouté par cette seule réconciliation. Le [JSON courant](content-associations.json) identifie sa version précédente et les ajouts ultérieurs du lot 16.

## 7. Continuation lot 16 et disponibilité vérifiable

Le [lot 16](../lot16/README.md) part des **188 fiches du catalogue lot 14** et ajoute quatre entrées : `layer_port_hanshan_architecture_distant_fixed`, `layer_port_hanshan_rear_structures_fixed`, `layer_port_hanshan_floor_fixed` et `prop_me2_illusive_man_chair`. La pose assise est ajoutée à `chr_me2_illusive_man`, déjà illustré debout. Le bilan courant est **192 fiches, 132 avec candidat et 60 sans**, pour **6 PNG natifs, 5 sélections et 5 sujets**. Le sol PH-40 R0 reste conservé avec `selected: false`.

Le [contrôle du corpus](../lot16/workbook-verification.json) compte **231 originaux distincts**, union des 225 antérieurs et des six nouveaux. Les **55 fiches de catégorie stage** regroupent **52 masters de sous-zones historiques et 3 calques** ; les couches de Port Hanshan ne sont pas comptées comme trois arènes supplémentaires. Les 188 ancres de l’index initial sont conservées et quatre nouvelles ancres reprennent exactement les IDs ajoutés.

### Sources et qualifications des nouveaux sujets

| Sujet | Preuve utilisée et association | Réserve maintenue |
|---|---|---|
| PH-20, PH-30 et PH-40 de Port Hanshan | PNG internes historiques de la continuation du 19 novembre, extraits de l’arbre de base et inspectés ; relation G/J à `ME1-VS-PORT-HANSHAN-REF-01` | Ces références sont des candidats générés, sans nouvelle preuve canonique. Surfaces reconstruites, franges, îlot détaché de PH-20 et écart de largeur de PH-40 restent documentés. |
| Fauteuil isolé ME2 | Capture de presse du jeu avant sortie et vues de statuette sous licence, qualifiées dans la [bibliothèque de références](../lot16/reference-library.json) ; relation narrative B/F/J à `chr_me2_illusive_man` | La statuette complète la lecture de forme mais ne prouve pas tous les détails du modèle final. Dossier, jonctions cachées et accessoire de cendrier restent non confirmés ; alpha maximal 254. |
| L’Homme Trouble assis ME2 | Références du personnage et de son contexte, planche secondaire historique, candidat debout lot 13 et fauteuil lot 16 comme continuité ; B/F/J | Pose croisée candidate ; visage et iris non certifiés. Le fauteuil inclus est redessiné et ne se superpose pas exactement au fauteuil vide ; alpha maximal 254 et résidus faibles aux bords. |

Les [associations par asset](../lot16/bible-asset-associations.json) relient les calques aux rubriques **02, 13, 14, 15, 17, 22, 26, 27**, et les sujets de l’Homme Trouble aux rubriques **02, 03, 07, 09, 10, 16, 17, 26, 27**. Le fauteuil reste un `accessoire_candidat`, avec la qualification particulière **B/F/J de scène narrative**. Aucune association d’action, capacité de combat ou scène complète n’est ajoutée. Les 36 briefs narratifs restent des besoins documentés.

Le [manifeste](../lot16/manifest.json), les revues indépendantes de [Port Hanshan](../lot16/qa/port-hanshan-independent-review.json) et de [l’Homme Trouble](../lot16/qa/illusive-man-independent-review.json), la [vérification du lot](../lot16/verification.json), le [classeur](../lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx) et les [manquants courants](../lot16/MANQUANTS_2026-11-25.md) constituent les preuves de cette passe. Les PNG restent **Prototype** ; aucune valeur d’intégration moteur ou de fidélité 1:1 n’est promue.

### Lot 15 non récupéré

Les **113 PNG annoncés au lot 15 ne sont ni récupérés ni publiés**. L’archive, le classeur et le commit local annoncés précédemment ne sont pas disponibles dans l’environnement repris ni dans l’arbre publié de base. Le [constat de reprise](../lot16/RECUPERATION_LOT15.md) conserve les empreintes rapportées et les recherches effectuées. Ces déclarations historiques ne prouvent aucune présence courante ; les 33 plans narratifs annoncés pour cette livraison ne sont donc pas crédités comme fichiers disponibles.

Les exclusions et refus antérieurement signalés restent actifs. La perte des fichiers ne déclenche pas leur régénération. Les réserves rapportées sur Thane, Méridiane et Fortification restent ouvertes, en attente d’originaux vérifiables ou de références suffisantes. Une nouvelle production éventuelle devrait être identifiée comme une nouvelle version, avec ses propres preuves.

## 8. Originaux retrouvés et extensions intégrées — 27 novembre 2026

Base de reprise : **231ffde14652932ffaa667c40315f1232f802d4a**, même branche et PR #11. Les trois fichiers utilisateurs sont récupérés depuis leur emplacement Drive, copiés sans modification dans [docs/armax/guides](../guides/README.md), et vérifiés par taille et SHA-256. Le [manifeste](../guides/source-manifest.json) conserve les identifiants d'origine et leur URL. Leur total est **163 095 octets**.

| Source | Version déclarée | Rubriques | Portée de la preuve |
|---|---|---|---|
| Combat_Games_Guide_General_v1.0.txt | 25 novembre 2026 | 00–29 | Original désormais présent ; concordance des 30 numéros avec l'adaptation antérieure |
| Combat_Games_Extension_01_Tag_Taunts_Bonus_v1.0.txt | 26 novembre 2026 | 30–49 | Exigences d'équipes, personnalité, entités, clashes, bonus et exploration conservées intégralement |
| Combat_Games_Extension_02_Slots_Verrouilles_Deblocages_Abonnes_v1.0.txt | 27 novembre 2026 | 50–67 | Exigences de découverte, droits, disponibilité, compatibilité, déblocages et soutien conservées intégralement |

La [matrice courante](guide-coverage-2026-11-27.json) fait autorité sur les **68 rattachements**. Les anciens `guide-associations.json` et `common-rules.json` sont conservés octet pour octet ; leurs 30 rubriques, priorités et 90 critères ne sont pas réécrits. Le sous-index lot 16/192 de l'ancien fichier d'associations reste **historique**. Les comptes artistiques actuels proviennent de [content-associations.json](content-associations.json), du [catalogue lot 20](../lot20/production-catalog.json) et de sa livraison.

La comparaison n'a pas révélé de décalage entre numéros 00–29, seulement des titres abrégés dans l'adaptation. La [réconciliation](GUIDE_RECONCILIATION_2026-11-27.md) donne chaque correspondance. Les 38 rubriques nouvelles ajoutent 114 critères, pour **204 critères documentaires**, et deux annexes détaillées. Les 40 scénarios d'acceptation restent à tester dans le moteur. Aucun résultat des vérifications historiques n'est présenté comme un test de tag, de déblocage ou de paiement.

### Décisions nouvelles et périmètre

RC-ARMAX-TEAM-0.1 complète le contrat duel pour les seuls profils d'équipe : ressources partagées sans double gain, KO selon survivants, timeout agrégé, entrée de relais explicite, propriété des entités et conclusions de match. Les assistances et le tag passent à P1 de **conception** ; hybride P2, coopération/quatre joueurs/multiplans différés. Les nombres restent des hypothèses d'équilibrage, pas des valeurs officielles de Mass Effect.

Les **Archives de simulation Armax**, leurs six pièces, les dix exercices bonus, les nouvelles chorégraphies et le nom **Neutralisation coordonnée** sont des créations du projet. Les profils ME1/ME2/ME3/Andromeda restent séparés ; un menu de collection n'ajoute aucune présence physique, résurrection ou pouvoir à l'histoire.

Les modèles de soutien sont spécifiés, **désactivés**, sans fournisseur ni offre configurés. Les références externes que contiennent les guides restent attribuées à leur rédaction. Leur copie ne signifie pas que leurs APIs, modalités commerciales ou disponibilités ont été vérifiées à nouveau dans cette passe.

### Sources supplémentaires consultées pour des faits précis

| ID | Source et mode de consultation | Fait utilisé et limite |
|---|---|---|
| SRC-EXT-BIOWARE-CITADEL | [BioWare, annonce Citadel & Reckoning du 21 février 2013](https://blog.bioware.com/2013/02/21/mass-effect-3-citadel-reckoning-dlc-announced/), texte indexé restitué par recherche et ouverture le 27 novembre 2026 | Mention de l'arène Armax dans Citadel ; ne prouve ni le plan des archives imaginées, ni le tag, ni les scènes nouvelles. La disponibilité HTTP directe de cette URL historique n'est pas certifiée. |
| SRC-EXT-ME3-MANUAL-P5 | [Manuel officiel ME3 Xbox 360](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf), page imprimée 5, extraction consultée le 27 novembre 2026 | Pouvoirs affichés de Garrus ; aucun timing, coût ou dégâts Armax n'en est déduit. |
| SRC-EXT-PRIMA-ZAP | [Guide Prima Andromeda — Peebee's Secret Project](https://primagames.com/eguides/mass-effect-andromeda-collectors-edition-eguide/secondary-ops/peebees-secret-project), texte consulté le 27 novembre 2026 | L'introduction de Poc est reliée au pouvoir Remnant VI qui invoque Zap ; cette source ne donne pas le contrat d'entité du duel. |

Les méthodes `router`, `game-ui-ux` et `save-systems` du [registre gamedev épinglé](../../gamedev-sources.json) ont été lues pour cette spécification : périmètre documentaire, états de menu/focus, données versionnées et autorité distincte. Aucun exemple Godot ou Unity n'est présenté comme API de l'hôte Three.js/localStorage, et aucune dépendance nouvelle n'est ajoutée.

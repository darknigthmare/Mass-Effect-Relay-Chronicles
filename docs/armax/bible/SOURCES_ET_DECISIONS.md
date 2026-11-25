# Armax — sources, décisions et portée

**25 novembre 2026 — Europe/Paris.** L’intégration initiale du guide fourni par Darknigthmare examine le dépôt au commit **4befa64285080fe016d6ecd9424b00ab4d42509f**, PR #11. La réconciliation du contenu décrite en section 6 part ensuite du lot 14 au commit **cc44ce510f1bb152fa68f3d8375a5db2745437c5**. Les preuves des deux passes conservent leur périmètre.

## 1. Autorité des documents

| Niveau | Document | Rôle |
|---|---|---|
| Demande du projet | Intégrer le guide à la bible selon le contexte Mass Effect | Objectif de cette livraison |
| Guide utilisateur | Combat_Games_Guide_General_v1.0.txt, version 1.0 du 25 novembre 2026, 30 rubriques 00–29 | Structure commune et exigences à contextualiser |
| Contrat courant Armax | [Bible intégrée](BIBLE_ARMAX_INTEGREE.md), [règles communes](common-rules.json), [associations](guide-associations.json) | Décisions transversales de conception et critères |
| Fiches de contenu | [Lot 04](../lot04/fighters.json), [bible détaillée](../lot04/BIBLE_EXTENSION.md), [Grunt/Legion](../../combat-2d/CONTINUATION_2026-11-19.md) | Identités, kits, actions, récits et réserves de leurs versions |
| Production artistique courante | [Catalogue lot 14](../lot14/production-catalog.json), manifestes des lots et récupération | Fichiers, provenance, présence et limites ; le [lot 13](../lot13/production-catalog.json) conserve son instantané historique |
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
| SRC-ARMAX-LOT14 | [Catalogue courant](../lot14/production-catalog.json) et [associations artistiques](../lot14/bible-asset-associations.json) | 188 fiches, usages hérités et 20 associations de sujets fixes | Images candidates ; aucune sélection de mode ni action complète déduite |

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

La reprise de la même consigne associe individuellement les 188 entrées de production aux fiches et rubriques de la bible. L’[index](ASSOCIATIONS_CONTENU.md) expose les 16 sujets de conception examinés, les 19 groupes identité/œuvre des costumes, les 18 liens précis de décors et les 20 associations artistiques existantes. Les 30 rubriques et 90 critères initiaux sont conservés.

Cette passe révèle deux divergences de rôle pour Kai Leng et Balak : le catalogue les décrit comme boss candidats, tandis que leur fiche lot 04 permet le Versus et ne coche pas boss. La décision de cette réconciliation est de conserver et signaler les deux sources. Elle n’autorise pas une nouvelle sélection. Les mentions de lieu sans sous-zone exacte et les avertissements de non-équivalence sont également conservés comme tels.

Le [JSON d’associations](content-associations.json) identifie ses sources par chemin, sélecteur, commit et empreinte. Les références de ligne sont celles du commit de base. La [vérification propre à cette passe](verification-content-associations-2026-11-25.json) contrôle la couverture, les rôles, les correspondances, les liens et la préservation de la production. Les compteurs restent **188 fiches, 128 avec image candidate, 60 sans**. Aucun asset, classeur, kit ou mécanisme jouable n’est ajouté par cette réconciliation.

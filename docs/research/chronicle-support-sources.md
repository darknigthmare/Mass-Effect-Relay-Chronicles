# Sources des invocations et munitions des Chroniques

Relevé du 25 octobre 2026, sur la base `748b9657de4cad0a4633b86c9d185ea63793c293`, complété après inspection de la capture de Garrus en page 5 du manuel ME3. Cette revue porte sur la provenance ; elle ne valide aucune nouvelle mécanique, animation ou interface. Le [rapport structuré](../qa/chronicle-support-reference-report.json) distingue les manuels réellement lus, les déclarations secondaires locales et les règles non établies. Aucun ancien rapport ni catalogue n’a été modifié par cette revue. Le raccord fonctionnel des capacités fait l’objet d’une validation distincte.

## Consommables de munitions d’Andromeda : règle non vérifiée

**Les documents effectivement consultés ne permettent pas de décider si ces consommables sont limités par durée, tirs ou chargeurs, ni d’en certifier une quantité.** Les trois dossiers `MEA-EQP-AMMO-FIRE`, `MEA-EQP-AMMO-CRYO` et `MEA-EQP-AMMO-DISRUPT` établissent dans le catalogue secondaire les types incendiaire, cryogénique et disruptif. Leurs descriptions ne donnent aucune règle de consommation. Le champ `gameplay` est une proposition de fan game, pas une source du jeu original.

Le [manuel PC anglais officiel MEA](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-pc-en.pdf) a été relu localement : 30 pages, 847 754 octets, SHA-256 `a5e3bfc40a63695fb20d8fcb2db4b590a6fa65bf24c90b01c9eae555190f817f`, identique à la [consultation primaire précédente](../qa/chronicle-specialist-reference-report.json). Cette revue ne prétend pas avoir retéléchargé ce PDF.

| Passage du manuel MEA | Fait lu | Ce qu’il ne permet pas de conclure |
|---|---|---|
| p. 17 | La préparation comporte un onglet de consommables distinct des armes, armures et équipiers. | Aucun nom, budget, durée ou nombre de chargeurs de munitions spéciales n’y est donné. |
| p. 18 | Les mods d’armes et les Fusion Mods de torse sont des équipements de préparation. Le HUD affiche les tirs et la réserve ; R recharge. | Un mod, un consommable de munitions et une augmentation de fabrication ne sont pas interchangeables. Le HUD général ne prouve pas le budget d’un consommable précis. |
| p. 19 | Un pouvoir accompagné d’un compteur consomme des Power Cells ; les caches les remplissent. Ces pouvoirs n’ont pas de recharge temporelle. Les autres pouvoirs ont un temps de recharge. | Ce ne sont pas des règles pour les consommables de munitions. Aucun pouvoir nommé ni nombre de cellules initial n’est attesté par ce passage. |
| p. 30, multijoueur | Des fournitures permettent notamment de remplir les munitions et cellules, avec un nombre d’utilisations limité par partie. | Ne définit ni l’effet ni la durée des trois types de munitions spéciales du solo. |

La page officielle actuelle [Andromeda](https://www.ea.com/games/mass-effect/mass-effect-andromeda) a répondu HTTP 200. Une tentative ciblée vers l’ancien article `news/mass-effect-andromeda-gameplay-series-combat` a redirigé vers cette même page générale : **l’article n’a pas été consulté** et aucune règle utile n’a été trouvée dans le texte reçu. Les corps HTML et leurs empreintes sont consignés dans le rapport. Aucun accès supplémentaire aux pages Fandom déjà refusées par HTTP 402, aucun miroir, aucune désactivation TLS et aucun contournement du proxy n’ont été tentés.

En conséquence, une implémentation peut annoncer un budget **ATB choisi pour le prototype**, mais cette revue ne permet pas de qualifier un compteur de secondes, de tirs ou de chargeurs de règle originale vérifiée. L’activation d’un mode de munitions ME2/ME3, le stock d’un consommable MEA, ses effets restants et les Power Cells doivent garder des états distincts. La compatibilité avec une arme thermique reliquate ou un rayon demande également une preuve ou une restriction de prototype explicite.

## Manuels ME2 et ME3 réellement consultés

Le [manuel PC français ME2](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) local reste valide : 18 pages PDF, 2 937 619 octets, SHA-256 `c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1`. Les pages imprimées 8–9 décrivent l’ingénieur utilisant des drones pour harceler une cible et la déloger de son couvert. La page imprimée 24 énumère « Drone de combat » comme pouvoir exclusif de l’ingénieur. Les pages imprimées 22–23 donnent les familles de munitions des classes Soldat, Franc-tireur et Porte-étendard ; elles ne donnent pas les kits individuels de Tali, Legion ou des autres compagnons. La page PDF 14, qui contient la page imprimée 24, a aussi été inspectée visuellement.

Une nouvelle URL officielle ME3, [mass-effect-3-manuals_PC.pdf](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf), a été récupérée avec succès par la revue de portraits parallèle : HTTP 200, `application/pdf`, 1 886 992 octets, signature `%PDF-`, 27 pages, SHA-256 `07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01`. Les observations HTTP du 25 octobre à 07:58:34 UTC ont été lues ; cette revue a ensuite lu le PDF local et inspecté visuellement ses pages 5, 25 et 26. **Cela ne requalifie pas l’ancien fichier ME3 `_fr.pdf` de 263 octets : ce dernier reste un XML AccessDenied, pas un PDF.**

| Passage du manuel ME3 | Portée établie |
|---|---|
| p. 5, capture du panneau de Garrus | Les libellés Concussive Shot, Overload, Armor-Piercing Ammo et Proximity Mine sont lisibles. Cette image confirme notamment l’attribution d’Armor-Piercing Ammo à Garrus ME3 ; elle ne certifie aucun rang acquis, niveau de départ ou chiffre ATB. |
| p. 8 | Description générale des dissipateurs/chargeurs, tirs restants et réserve. Aucun effet de mode de munitions ni quantité propre à une arme n’est donné. |
| p. 20, section multijoueur | Trois catégories d’équipement, dont les munitions, renforcent le personnage pour une mission. Cette règle est explicitement multijoueur ME3 ; elle ne doit pas être transposée aux pouvoirs solo ou aux consommables MEA. |
| p. 25 | Les munitions incendiaires et perforantes aident contre l’armure ; Cryo Ammo peut amorcer une combinaison cryogénique. Aucun multiplicateur, rang ou durée précis n’est donné. |
| p. 26 | Disruptor Ammo est utile contre les boucliers, barrières et geth. Les dissipateurs permettent le tir et leur absence empêche de tirer. Aucun kit individuel de compagnon n’est établi. |

Le texte extrait du manuel ME3 ne fournit pas de fiche nommée Combat Drone, Sentry Turret ou Defense Drone. La rubrique « Engineer » des conseils ennemis, p. 24, parle des ingénieurs **ennemis de Cerberus** et ne prouve pas le kit de Shepard ou de Tali. La capture de Garrus en page 5 constitue une preuve visuelle distincte du texte extrait ; elle ne doit pas être généralisée aux autres compagnons.

## Attributions : conserver des listes explicites

Le tableau suivant décrit les déclarations présentes dans les profils et catalogues locaux au moment du relevé initial, avec l’exception primaire de Garrus ME3 signalée séparément. **Les autres attributions aux compagnons restent des références secondaires ; elles ne constituent pas une nouvelle vérification primaire de leurs kits.** Un nom de pouvoir identique entre œuvres ne suffit pas à ouvrir une capacité, un rang, une loyauté ou un personnage supplémentaire.

| Pouvoir | Déclaration locale retenue | Limite |
|---|---|---|
| Combat Drone ME2 | Préparation Engineer de Shepard ; libellé manquant des profils Tali et Legion ME2. | Seul le lien à la classe Engineer est corroboré par le manuel ME2. Les deux compagnons demandent les références de commando ME2. |
| Combat Drone ME3 | Préparation Engineer de Shepard ; libellé manquant de Tali ME3. | Déclaration secondaire locale, pas d’ouverture à Legion ME2 dans ME3. |
| Sentry Turret ME3 | Préparation Engineer ; `ME3-POW-SENTRY` décrit un pouvoir d’ingénieur. | Aucun droit déduit pour Tali. `ME2-EQP-SENTRY` et `ME3-EQP-SENTRY` sont des casques Sentry Interface, pas une invocation. |
| Defense Drone ME3 | `ME3-POW-DEFENSE-DRONE` dit explicitement « Pouvoir de Tali » ; le profil Tali le distingue de Combat Drone. | Aucun droit déduit pour Engineer. Une réaction à un événement de dégâts n’établit pas une simulation de proximité physique originale. |
| Incendiary Ammo ME2 | Libellés déjà déclarés pour Jacob et Grunt. | Les fiches génériques de pouvoir ne prouvent pas leurs rangs, variantes de commando ou conditions d’acquisition. |
| Disruptor Ammo ME2 | Libellé déjà déclaré pour Zaeed. | Aucune attribution automatique à un autre soldat. |
| Armor-Piercing / Warp / Shredder Ammo ME2 | Libellés déclarés respectivement pour Garrus, Jack et Thane. | Les cartes génériques ne prouvent pas à elles seules l’accès avant/après loyauté ; une condition explicite doit être vérifiée et conservée. |
| Disruptor Ammo ME3 | Libellé déjà déclaré pour Ashley ME3. | Ne déduit pas le kit ME3 d’Ashley de sa fiche ME1, ni un autre mode du rôle « soldat ». |
| Armor-Piercing Ammo ME3 | Attribution à Garrus confirmée dans la capture primaire du manuel ME3, p. 5. | Ne prouve pas son rang ou acquisition, ni le kit de Garrus ME2, ni l’accès à Warp Ammo ou à un autre compagnon. |
| Consommables ammo MEA | Trois dossiers d’équipement, sans attribution de pouvoir à un équipier. | Aucun accès de compagnon déduit. Ryder et un équipier n’obtiennent pas le même inventaire ou kit parce qu’ils utilisent une arme similaire. |

Les préparations de classes ME2 du manuel sont distinctes des kits de compagnons. Les autres attributions ammo ME3 éventuelles, absentes des libellés locaux inspectés, demandent une référence explicite avant branchement. En particulier, les compétences actuelles de Liara, EDI, Kaidan, Cora, Liam, Vetra, Jaal, Drack et Peebee ne permettent pas d’inférer un mode ammo.

Pour les invocations, points de vie, durée de vie, cadence, cible automatique, nombre simultané, participation à la condition de victoire, retrait à la mise hors combat du propriétaire et réaction du drone défensif restent des choix ATB tant qu’aucune source plus précise n’est consultée. Cette revue n’établit pas non plus un accès à Assault Turret ou Remnant VI à partir d’un libellé de drone ME2/ME3.

## Périmètre d’une future vérification

Le futur parcours navigateur devra contrôler les pouvoirs via leurs listes explicites par œuvre/scène/préparation, le remplacement d’un mode ammo, des ressources séparées et leur épuisement selon le contrat ATB annoncé, les invocations réellement ciblables et retirées, les sauvegardes/imports et l’absence de mutation de la partie ME1. Ce relevé ne contient aucun lancement de navigateur, résultat de combat ou validation fonctionnelle nouvelle.

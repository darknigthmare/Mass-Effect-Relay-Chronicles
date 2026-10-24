# Sources et périmètre des pouvoirs des Chroniques

Cette note décrit les **40 fiches de pouvoirs reliées à 18 actions natives** réellement exposées par les scénarios et préparations disponibles. Dix de ces actions sont nouvelles dans ce lot. Les autres réemploient les règles du moteur existant. Il ne s’agit pas de 40 mécaniques originales distinctes ni d’une certification des variantes de chaque jeu.

Les identifiants proviennent de [universe-powers.js](../../src/universe-powers.js). Le rapport d’usage de [universe-actors.js](../../src/universe-actors.js), `getUniversePowerUsage()`, ajoute les acteurs, scénarios et préparations qui exposent chaque liaison. Une correspondance déclarée mais inaccessible dans les essais ne fait pas partie de cette liste. Le [moteur de combat](../../src/combat.js) garde tous les nombres, durées, formules et effets au statut **adaptation ATB**.

## Ce que les sources établissent

Le [manuel officiel PC français de Mass Effect 2](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf), pages **imprimées 22–24**, annexe 2, a été consulté dans le relevé local du PDF téléchargé. Il énumère les six classes, leurs familles d’armes et leurs pouvoirs, en distinguant les capacités exclusives et celles à débloquer. Le téléchargement antérieur et son empreinte sont conservés dans le [rapport primaire des Chroniques](../qa/chronicles-primary-reference-report.json). L’empreinte locale est restée identique : SHA-256 `c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1`. Cette note ne modifie pas ce rapport historique.

| Classe ME2 | Familles d’armes du sous-ensemble préparé | Pouvoirs actuellement exécutables |
|---|---|---|
| Soldat | Pistolet, fusil d’assaut, fusil à pompe, fusil de précision | Concussive Shot |
| Ingénieur | Pistolet, mitraillette | Overload, AI Hacking, Incinerate, Cryo Blast |
| Adepte | Pistolet, mitraillette | Singularity, Throw, Pull, Shockwave, Warp |
| Franc-tireur | Pistolet, mitraillette, fusil de précision | AI Hacking, Incinerate |
| Porte-étendard | Pistolet, mitraillette, fusil à pompe | Pull, Shockwave |
| Sentinelle | Pistolet, mitraillette | Throw, Cryo Blast, Overload, Warp |

Le manuel emploie notamment Télékinésie pour Pull et Tir percussif pour Concussive Shot. Les libellés français communs du moteur restent ceux de cette adaptation ; ils ne constituent pas une transcription certifiée des interfaces de chaque édition.

L’absence de Drone, Tactical Cloak, Tech Armor, Charge ou d’un type de munitions dans cette colonne signifie que la mécanique manque encore. La sélection de classe prépare un état de test avec les compétences disponibles débloquées ; elle ne simule ni les niveaux, ni les points, ni la progression d’acquisition. Les statistiques ATB de base restent identiques à la dotation antérieure.

Les préparations de Shepard ME3 gardent les cinq familles d’armes utilisables et un sous-ensemble de pouvoirs de classe. Les trois préparations de Ryder sont des sélections libres combat/biotique/tech, avec trois pouvoirs au maximum. Elles n’accordent aucun bonus chiffré des sept profils d’Andromeda et ne deviennent pas des classes de Shepard. Le choix historique `default` conserve la dotation neutre du protagoniste. Les bancs de prologue ne proposent que ce choix.

## Références secondaires et attribution aux compagnons

Les catalogues attestent l’existence et l’œuvre des pouvoirs suivants, avec leurs références. Une carte générique « pouvoir de ME2 » n’établit pas, à elle seule, le kit complet d’un compagnon.

| Identifiant de source | Référence conservée | Portée du catalogue |
|---|---|---|
| `GAL-ABIL` | [Pouvoirs dans Galaxy](https://masseffect.fandom.com/wiki/Abilities_(Mass_Effect_Galaxy)) | Stase, attaque lourde et surcharge, progressions liées aux pistes. |
| `ME2-SRC-POWERS` | [Powers](https://masseffect.fandom.com/wiki/Powers) | Pouvoirs de ME2 et pouvoirs de loyauté |
| `ME3-SRC-POWERS` | [Powers (Mass Effect 3)](https://masseffect.fandom.com/wiki/Powers_%28Mass_Effect_3%29) | Pouvoirs et progressions |
| `ME3-SRC-SQUAD` | [Squad Members Guide (Mass Effect 3)](https://masseffect.fandom.com/wiki/Squad_Members_Guide_%28Mass_Effect_3%29) | Roster campagne, DLC et Armax |
| `MEA-SRC-SKILLS` | [Skills](https://masseffect.fandom.com/wiki/Skills) | Compétences de combat, biotique, tech et équipiers |

Les whitelists d’acteurs conservent également les pistes [ME2-SRC-SQUAD](https://masseffect.fandom.com/wiki/Squad_Members_Guide_%28Mass_Effect_2%29), [ME3-SRC-SQUAD](https://masseffect.fandom.com/wiki/Squad_Members_Guide_%28Mass_Effect_3%29), [MEA-SRC-SQUAD](https://masseffect.fandom.com/wiki/Squad_Members_Guide_%28Mass_Effect%3A_Andromeda%29) et [MEA-SRC-SKILLS](https://masseffect.fandom.com/wiki/Skills). Les objets `powerProvenance` distinguent la source du pouvoir et celle de son attribution au porteur. Ces attributions restent des profils partiels fondés sur les références secondaires de squad/skills ; aucun nouveau relevé primaire complet des kits n’a été réalisé pour ce lot.

Les tentatives de lecture directe des guides de commando Fandom ME2 et ME3 le 24 octobre 2026 ont renvoyé HTTP 402. Les tentatives IGN et StrategyWiki ont été refusées par le proxy HTTP 403. Elles ne sont pas présentées comme des sources nouvellement consultées avec succès. La référence primaire disponible étaye les classes ME2 ; elle ne remplace pas les tableaux individuels des compagnons.

Les pouvoirs de loyauté de ME2 restent limités à l’atelier dans un état de test post-loyauté : Slam de Miranda, Barrier de Jacob, Fortification de Grunt, Energy Drain de Tali, Reave de Samara et Dominate de Morinth. Ils sont absents du constructeur sans scène et de Freedom’s Progress. Cet atelier ne simule aucune quête de loyauté ni acquisition narrative.

Peebee reçoit seulement Pull dans le sous-ensemble actif ; Invasion et Flak Cannon restent à reproduire. Shockwave n’est pas attribué à Peebee. L’existence de cette action pour Ryder ne donne pas accès à un autre personnage. Les attributions précises supplémentaires de Liam et Vetra demandent encore un relevé de leurs kits ; aucune compétence n’est ajoutée seulement parce qu’elle existe dans Andromeda.

Les personnages de DLC ou temporaires ne rejoignent pas l’atelier générique par la présence d’une liaison de pouvoir. Aucun kit de Liara ME2/ME3 n’est copié vers Redemption. Les capacités d’Infiltrator encore à vérifier ne deviennent pas celles d’un autre épisode.

## Les 40 fiches utilisées

Les effets de cette table décrivent le code disponible. Leurs valeurs et leurs simplifications ne sont pas attribuées aux sources canoniques. Les informations d’acquisition, rangs, évolutions, projectiles, animations et différences d’édition restent distinctes.

### GAL — 2 fiches

| Fiche exacte | Action native | Effet ATB disponible | Source de la fiche |
|---|---|---|---|
| `GAL-PWR-OVERLOAD` | `overload` | Attaque les boucliers et les synthétiques ; pas de dégâts de santé sur organique exposé. | `GAL-ABIL` |
| `GAL-PWR-STASIS` | `stasis` | Immobilisation et immunité temporaire aux dégâts selon le moteur commun. | `GAL-ABIL` |

### ME2 — 16 fiches

| Fiche exacte | Action native | Effet ATB disponible | Source de la fiche |
|---|---|---|---|
| `ME2-POW-BARRIER` | `barrier` | Restauration partielle des boucliers et protection temporaire. | `ME2-SRC-POWERS` |
| `ME2-POW-CONCUSSIVE` | `concussiveShot` | Impact physique, brisure du gel et bref déséquilibre ; recharge de pouvoir sans munition. | `ME2-SRC-POWERS` |
| `ME2-POW-CRYO` | `cryoBlast` | Gel sans dégât direct ; cible exposée, tirs renforcés pendant le gel. | `ME2-SRC-POWERS` |
| `ME2-POW-DOMINATE` | `dominate` | Contrôle temporaire d’un organique exposé ; redirection vers son camp initial. | `ME2-SRC-POWERS` |
| `ME2-POW-ENERGY-DRAIN` | `energyDrain` | Dégâts de bouclier ou de synthétique ; restauration de bouclier selon les dégâts réels. | `ME2-SRC-POWERS` |
| `ME2-POW-FORTIFICATION` | `fortification` | Réserve de bouclier temporaire ; aucun bouclier normal restauré. | `ME2-SRC-POWERS` |
| `ME2-POW-HACK` | `hack` | Redirige temporairement un synthétique piratable vers son camp initial. | `ME2-SRC-POWERS` |
| `ME2-POW-INCINERATE` | `incinerate` | Impact thermique puis brûlure ; aucune munition consommée. | `ME2-SRC-POWERS` |
| `ME2-POW-OVERLOAD` | `overload` | Attaque les boucliers et les synthétiques ; pas de dégâts de santé sur organique exposé. | `ME2-SRC-POWERS` |
| `ME2-POW-PULL` | `pull` | Suspension sans dégât direct ; cible exposée et non immunisée. | `ME2-SRC-POWERS` |
| `ME2-POW-REAVE` | `reave` | Impact et dégâts continus ; soin selon la santé organique réellement perdue. | `ME2-SRC-POWERS` |
| `ME2-POW-SHOCKWAVE` | `shockwave` | Impact sur le groupe ; déséquilibre des cibles exposées non immunisées. | `ME2-SRC-POWERS` |
| `ME2-POW-SINGULARITY` | `singularity` | Contrôle de groupe par suspension ; règles communes du prototype. | `ME2-SRC-POWERS` |
| `ME2-POW-SLAM` | `slam` | Suspension brève puis impact différé unique, bloqué par Stase. | `ME2-SRC-POWERS` |
| `ME2-POW-THROW` | `throw` | Impact biotique renforcé sur une cible suspendue, puis déséquilibre. | `ME2-SRC-POWERS` |
| `ME2-POW-WARP` | `warp` | Impact, affaiblissement de défense et dégâts continus. | `ME2-SRC-POWERS` |

### ME3 — 15 fiches

| Fiche exacte | Action native | Effet ATB disponible | Source de la fiche |
|---|---|---|---|
| `ME3-POW-BARRIER` | `barrier` | Restauration partielle des boucliers et protection temporaire. | `ME3-SRC-POWERS` |
| `ME3-POW-CONCUSSIVE` | `concussiveShot` | Impact physique, brisure du gel et bref déséquilibre ; recharge de pouvoir sans munition. | `ME3-SRC-POWERS` |
| `ME3-POW-CRYO` | `cryoBlast` | Gel sans dégât direct ; cible exposée, tirs renforcés pendant le gel. | `ME3-SRC-POWERS` |
| `ME3-POW-ENERGY-DRAIN` | `energyDrain` | Dégâts de bouclier ou de synthétique ; restauration de bouclier selon les dégâts réels. | `ME3-SRC-POWERS` |
| `ME3-POW-FORTIFICATION` | `fortification` | Réduction temporaire des dégâts, sans réserve de bouclier supplémentaire. | `ME3-SRC-POWERS` |
| `ME3-POW-INCINERATE` | `incinerate` | Impact thermique puis brûlure ; aucune munition consommée. | `ME3-SRC-POWERS` |
| `ME3-POW-OVERLOAD` | `overload` | Attaque les boucliers et les synthétiques ; pas de dégâts de santé sur organique exposé. | `ME3-SRC-POWERS` |
| `ME3-POW-PULL` | `pull` | Suspension sans dégât direct ; cible exposée et non immunisée. | `ME3-SRC-POWERS` |
| `ME3-POW-REAVE` | `reave` | Impact et dégâts continus ; réduction personnelle temporaire des dégâts, sans soin ME2. | `ME3-SRC-POWERS` |
| `ME3-POW-SABOTAGE` | `sabotage` | Neutralise temporairement une arme ; chauffe supplémentaire pour les armes à chaleur. | `ME3-SRC-SQUAD` |
| `ME3-POW-SHOCKWAVE` | `shockwave` | Impact sur le groupe ; déséquilibre des cibles exposées non immunisées. | `ME3-SRC-POWERS` |
| `ME3-POW-SINGULARITY` | `singularity` | Contrôle de groupe par suspension ; règles communes du prototype. | `ME3-SRC-POWERS` |
| `ME3-POW-STASIS` | `stasis` | Immobilisation et immunité temporaire aux dégâts selon le moteur commun. | `ME3-SRC-POWERS` |
| `ME3-POW-THROW` | `throw` | Impact biotique renforcé sur une cible suspendue, puis déséquilibre. | `ME3-SRC-POWERS` |
| `ME3-POW-WARP` | `warp` | Impact, affaiblissement de défense et dégâts continus. | `ME3-SRC-POWERS` |

### MEA — 7 fiches

| Fiche exacte | Action native | Effet ATB disponible | Source de la fiche |
|---|---|---|---|
| `MEA-POW-CONCUSSIVE` | `concussiveShot` | Impact physique, brisure du gel et bref déséquilibre ; recharge de pouvoir sans munition. | `MEA-SRC-SKILLS` |
| `MEA-POW-ENERGY-DRAIN` | `energyDrain` | Dégâts de bouclier ou de synthétique ; restauration de bouclier selon les dégâts réels. | `MEA-SRC-SKILLS` |
| `MEA-POW-INCINERATE` | `incinerate` | Impact thermique puis brûlure ; aucune munition consommée. | `MEA-SRC-SKILLS` |
| `MEA-POW-OVERLOAD` | `overload` | Attaque les boucliers et les synthétiques ; pas de dégâts de santé sur organique exposé. | `MEA-SRC-SKILLS` |
| `MEA-POW-PULL` | `pull` | Suspension sans dégât direct ; cible exposée et non immunisée. | `MEA-SRC-SKILLS` |
| `MEA-POW-SHOCKWAVE` | `shockwave` | Impact sur le groupe ; déséquilibre des cibles exposées non immunisées. | `MEA-SRC-SKILLS` |
| `MEA-POW-THROW` | `throw` | Impact biotique renforcé sur une cible suspendue, puis déséquilibre. | `MEA-SRC-SKILLS` |

## Variantes natives et limites des effets

- Pull suspend sans employer le statut ME1 Lift. Cryo Blast utilise un gel distinct ; l’exposition et les immunités sont contrôlées avant la dépense de l’ordre.
- Incinerate applique un impact puis une brûlure. Energy Drain restaure le bouclier seulement à partir des dégâts réellement absorbés par une cible éligible ; il ne vole pas la santé d’un organique exposé.
- Fortification utilise une réserve temporaire de bouclier pour ME2 et une réduction des dégâts pour ME3. Elle ne devient pas Barrier et ne reçoit aucun multiplicateur biotique.
- Reave distingue le soin issu de la santé organique en ME2 et la protection personnelle en ME3. Les quantités et durées de ces variantes restent des réglages du prototype.
- Shockwave touche le groupe et ne déséquilibre que les cibles éligibles. Slam garde un impact différé unique. Dominate contrôle un organique exposé et lui fait cibler son camp initial ; le piratage synthétique reste une action distincte.
- Les multiplicateurs biotiques et technologiques suivent leurs familles respectives. Concussive Shot et Fortification sont des actions militaires et ne reçoivent pas ces bonus. Les mods d’arme renforcent les tirs, sans augmenter les pouvoirs.
- Les pouvoirs n’utilisent ni chargeur, ni réserve, ni chaleur d’arme. Leurs ordres et recharges utilisent le temps simulé ATB. Pause, mode Attente et Stase suivent les protections du moteur.

Les états et durées ne reproduisent pas l’intégralité des interactions et évolutions des jeux originaux. Les anciennes actions communes, notamment Stase, conservent les simplifications du prototype. Les missions, cartes, dialogues, animations et talents complets restent à produire. La liste d’usage est une preuve de branchement fonctionnel, pas une validation de fidélité 1:1.

## Vérification ciblée

```bash
node --test tests/universe-power-profiles.test.js tests/universe-powers.test.js
```

Ces tests contrôlent les liaisons de provenance, l’exposition réelle des commandes, les restrictions de loyauté et de période, les protections, les effets distincts et les préparations. Les résultats de publication et de navigateur sont suivis dans les rapports de l’exécution concernée ; cette note ne modifie aucun ancien rapport.

La [revue différentielle ME1](../qa/chronicle-expansion-combat-diff.json) consigne le contrôle déjà exécuté contre `994a963` : 30 graines et 1 755 ordres alliés, avec résultats d’actions, événements et résumés identiques. Elle conserve les paramètres, empreintes des deux sources et limites du protocole ; elle ne constitue pas un second parcours de campagne ni une certification des nouveaux effets.

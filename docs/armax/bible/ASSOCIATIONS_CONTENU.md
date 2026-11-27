# Armax — associations du contenu à la bible

**Révision documentaire du 27 novembre 2026 — Europe/Paris.**

Cet index relie les **196 fiches du catalogue lot 19** aux rôles, fiches types et rubriques de notre jeu de combat. Les **196 identités héritées du lot 18** sont conservées. Les quatre composants du marché Urdnot, les onze fiches illustrées par le lot17 consolidé et les trois costumes du lot18 appartiennent aux livraisons antérieures. L’index rend aussi accessibles les **14 fiches de conception du lot 04** et les **deux compléments Grunt/Legion**, dont une grande partie n’apparaît pas dans le suivi des images manquantes. Les totaux de ces ensembles ne s’additionnent pas : ils décrivent des périmètres qui se recoupent.

Sources : [catalogue courant](../lot19/production-catalog.json), [fiches lot 04](../lot04/fighters.json), [complément Grunt/Legion](../../combat-2d/CONTINUATION_2026-11-19.md), [campagnes et scènes](CAMPAGNES_ET_SCENES.md), [fiches A–J](FICHES_ET_LIAISONS.md), [associations artistiques lot 14](../lot14/bible-asset-associations.json) et [lot 16](../lot16/bible-asset-associations.json). Le [JSON associé](content-associations.json) contient les sélecteurs exacts, qualifications et empreintes des sources.

**Base de la continuation lot 16 : `71955d9143562d6a44a8b8d48bc552978372bc1e`.** La première projection examinait le lot 14 au commit `cc44ce510f1bb152fa68f3d8375a5db2745437c5` ; ses correspondances et ses 188 ancres sont conservées. La projection courante reprend les apports vérifiés des lots17–18 depuis `1e3cea80b1a6ec81d7ca6df8ad70d96988973f10`. Les relations de conception antérieures restent conservées. Le catalogue demeure la source de production ; l’index n’est ni une nouvelle liste de combattants sélectionnables ni un inventaire exhaustif du projet.

Le [registre complet des 68 rubriques](guide-coverage-2026-11-27.json) est la référence documentaire courante du guide et des deux extensions. Les associations aux 30 rubriques initiales ci-dessous restent valables.

## Continuation lot 19

Les 196 identités sont conservées. **6 fiches précédemment sans image disposent d'un candidat**, portant la présence à **156/196**, avec **40 fiches sans image**. Les images et leurs réserves figurent dans le [lot19](../lot19/README.md). Les comptes des lots16–18 décrivent les livraisons antérieures. La matrice générale initiale reste un instantané historique ; son sous-objet lot16 ne constitue pas le compteur courant.

## 1. Lecture et portée

Chaque ligne du catalogue est associée à un rôle déjà déclaré, puis aux fiches du guide nécessaires pour le décrire. Une lettre de fiche désigne un cadre applicable ou à compléter, pas un document terminé. Les liens de conception utilisent leurs propres espaces de noms ; un identifiant de sprite, de personnage documentaire ou de kit n’est jamais substitué à un autre.

| Famille du catalogue | Fiches | Avec image candidate | Sans image |
|---|---:|---:|---:|
| Personnages et adversaires | 87 | 63 | 24 |
| Costumes | 38 | 22 | 16 |
| Masters de sous-zones de décor | 52 | 52 | 0 |
| Calques de décor — Port Hanshan et marché Urdnot | 5 | 5 | 0 |
| Effets | 7 | 7 | 0 |
| Projectiles | 2 | 2 | 0 |
| Accessoires | 5 | 5 | 0 |
| **Total** | **196** | **156** | **40** |

La catégorie stage contient **57 fiches : 52 masters de sous-zones et 5 calques**. Le lot 16 apporte **6 PNG, dont 5 sélectionnés, pour 5 sujets** ; la pose assise ne crée pas une nouvelle identité et le sol R0 écarté ne crée pas un sujet supplémentaire. La présence d’une image ne ferme pas les autres poses, vues, accessoires, phases d’action ou couches de décor. Les valeurs de fidélité et d’intégration moteur restent celles des sources. Les associations ne modifient aucun kit, coût, dégât, condition de fin ou sauvegarde. Les 113 PNG annoncés au lot 15 sont exclus des présences tant qu’ils restent [non récupérés](../lot16/RECUPERATION_LOT15.md).

### Rôles dans le jeu de combat

| Usage déclaré | Nombre | Fiches à consulter ou compléter | Rattachement au contexte Armax |
|---|---:|---|---|
| Combattant candidat | 9 | B, C, E, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [04](BIBLE_ARMAX_INTEGREE.md#g04), [05](BIBLE_ARMAX_INTEGREE.md#g05), [07](BIBLE_ARMAX_INTEGREE.md#g07), [08](BIBLE_ARMAX_INTEGREE.md#g08), [17](BIBLE_ARMAX_INTEGREE.md#g17), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Documenter la version, le kit, les ressources et la route avant de définir sa disponibilité dans un mode. Candidat du suivi artistique ; aucune sélection jouable déduite du catalogue. |
| Boss candidat | 22 | B, C, I, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [05](BIBLE_ARMAX_INTEGREE.md#g05), [11](BIBLE_ARMAX_INTEGREE.md#g11), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [21](BIBLE_ARMAX_INTEGREE.md#g21), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Relier gabarit, phases, signaux, réponses et arène à une fiche de boss. Usage proposé dans le catalogue ; confronter la sélection de la fiche de conception avant tout accès Versus ou tournoi. |
| Adversaire candidat | 31 | B, C, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [05](BIBLE_ARMAX_INTEGREE.md#g05), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [21](BIBLE_ARMAX_INTEGREE.md#g21), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Préparer les actions et réponses lisibles de l’adversaire dans son opus et sa variante. Un adversaire de rencontre ne devient pas automatiquement un combattant sélectionnable. |
| Soutien narratif | 25 | B, F, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [07](BIBLE_ARMAX_INTEGREE.md#g07), [09](BIBLE_ARMAX_INTEGREE.md#g09), [10](BIBLE_ARMAX_INTEGREE.md#g10), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Rattacher identité, dialogues, briefing ou présence visuelle aux scènes compatibles. Aucun coup, pouvoir ou soutien de combat ajouté par le seul rôle narratif. |
| Costume / variante visuelle | 38 | B, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [17](BIBLE_ARMAX_INTEGREE.md#g17), [19](BIBLE_ARMAX_INTEGREE.md#g19), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Relier chaque apparence à son identité, son œuvre, son corps et son pack distincts. Le costume ne crée ni classe, ni pouvoir, ni kit ; aucune statistique n’est transférée au duel. |
| Arène adaptée | 52 | G, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [13](BIBLE_ARMAX_INTEGREE.md#g13), [14](BIBLE_ARMAX_INTEGREE.md#g14), [15](BIBLE_ARMAX_INTEGREE.md#g15), [17](BIBLE_ARMAX_INTEGREE.md#g17), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Documenter la sous-zone exacte, le sol, la caméra, les couches et les quatre axes d’options. Un master de décor ne prouve ni terrain jouable ni connexion. Une fiche H s’ajoute seulement pour un événement ou une liaison explicitement étudiés. |
| Effet visuel | 7 | C, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [05](BIBLE_ARMAX_INTEGREE.md#g05), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [18](BIBLE_ARMAX_INTEGREE.md#g18), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Associer l’instant visuel à une phase d’action et à une attribution sourcée. Ni la couleur ni le nom du fichier ne prouvent un porteur, des dégâts ou une durée. |
| Projectile candidat | 2 | C, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [05](BIBLE_ARMAX_INTEGREE.md#g05), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [18](BIBLE_ARMAX_INTEGREE.md#g18), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Préparer propriétaire, trajectoire, collision, interaction et phase visuelle dans la fiche d’action. L’image fixe et l’association proposée restent distinctes d’un projectile moteur fonctionnel. |
| Accessoire candidat | 5 | B, C, J pour grenade et omni-outil ; B, F, J pour le fauteuil narratif ; G, J pour les deux props du marché Urdnot. Rubriques précisées par entrée dans le JSON. | Définir l’attache et l’usage compatibles avec l’acteur ou le décor documenté. Le fauteuil est lié à l’Homme Trouble et à sa présence narrative ME2 ; les props de Tuchanka restent des composants de scène. Aucune action ne leur est attribuée. La grenade ou l’omni-outil n’équipe pas automatiquement tous les personnages du même opus. |
| Calque de décor — `calque_decor` | 5 | G, J ; rubriques [02](BIBLE_ARMAX_INTEGREE.md#g02), [13](BIBLE_ARMAX_INTEGREE.md#g13), [14](BIBLE_ARMAX_INTEGREE.md#g14), [15](BIBLE_ARMAX_INTEGREE.md#g15), [17](BIBLE_ARMAX_INTEGREE.md#g17), [22](BIBLE_ARMAX_INTEGREE.md#g22), [26](BIBLE_ARMAX_INTEGREE.md#g26), [27](BIBLE_ARMAX_INTEGREE.md#g27) | Séparer les trois couches de Port Hanshan et les deux couches du marché Urdnot à Tuchanka. Chaque composant conserve son ID et sa relation à sa composition documentaire ; aucune arène supplémentaire, collision ou vitesse de parallaxe validée n’en est déduite. |

Les 87 fiches de personnages se répartissent en **9 combattants candidats, 22 boss candidats, 31 adversaires candidats et 25 soutiens narratifs**. Ce sont les usages du suivi artistique. La sélection d’un mode doit rester cohérente avec la fiche de conception, les règles communes et les réserves ci-dessous.

Le fauteuil conserve le rôle de catalogue `accessoire_candidat`, avec une association particulière **B/F/J** : identité de l’Homme Trouble, contexte de briefing ou présence narrative, puis provenance et revue de l’asset. Ses rubriques sont [02](BIBLE_ARMAX_INTEGREE.md#g02), [03](BIBLE_ARMAX_INTEGREE.md#g03), [07](BIBLE_ARMAX_INTEGREE.md#g07), [09](BIBLE_ARMAX_INTEGREE.md#g09), [10](BIBLE_ARMAX_INTEGREE.md#g10), [16](BIBLE_ARMAX_INTEGREE.md#g16), [17](BIBLE_ARMAX_INTEGREE.md#g17), [26](BIBLE_ARMAX_INTEGREE.md#g26) et [27](BIBLE_ARMAX_INTEGREE.md#g27). Le cadre C général des accessoires de combat ne s’applique pas à cette association narrative.

## 2. Fiches de conception et correspondances exactes

Les sélections du tableau suivant reproduisent la conception du lot 04. Elles ne prouvent pas une implémentation. Une absence du catalogue de manquants ne signifie pas que le sujet manque au projet.

| Sujet / identifiant de conception | Sélection décrite dans la source | Correspondance au catalogue courant lot 19 |
|---|---|---|
| Saren Arterius — `armax-saren-me1` | Versus, boss | Hors de ce catalogue ; fiche existante conservée |
| Matriarche Bénézia — `armax-benezia-me1` | boss | Hors de ce catalogue ; fiche existante conservée |
| Nihlus Kryik — `armax-nihlus-me1` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Kirrahe — `armax-kirrahe-me1` | Versus | Hors de ce catalogue ; fiche existante conservée |
| David Anderson — `armax-anderson-me1` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Morinth — `armax-morinth-me2` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Nyreen Kandros — `armax-nyreen-me3` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Kai Leng — `armax-kai-leng-me3` | Versus | [chr_me3_kai_leng](#chr_me3_kai_leng) — divergence de rôle à examiner |
| Tela Vasir — `armax-tela-vasir-me2` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Balak — `armax-balak-me1` | Versus | [chr_me1_balak](#chr_me1_balak) — divergence de rôle à examiner |
| Randall Ezno — `armax-randall-ezno-infiltrator` | Versus | Hors de ce catalogue ; fiche existante conservée |
| Urdnot Bakara / Eve — `armax-eve-me3` | soutien | Hors de ce catalogue ; fiche existante conservée |
| Courtier de l’Ombre — yahg — `armax-shadow-broker-me2` | boss | Hors de ce catalogue ; fiche existante conservée |
| L’Archonte — `armax-archon-andromeda` | boss | Hors de ce catalogue ; fiche existante conservée |
| Grunt — `ME2-CHR-GRUNT` (identité documentaire) | Complément de conception ; aucun kitId Versus attribué | [cst_me2_grunt_loyalty](#cst_me2_grunt_loyalty), [cst_me2_grunt_aap2](#cst_me2_grunt_aap2) |
| Legion — `ME2-CHR-LEGION` (identité documentaire) | Complément de conception ; aucun kitId Versus attribué | [chr_me2_legion_standard](#chr_me2_legion_standard), [cst_me2_legion_loyalty](#cst_me2_legion_loyalty) |

### Deux divergences conservées explicitement

**Kai Leng et Balak** portent `boss_candidat` dans le catalogue, alors que leurs fiches lot 04 indiquent `soloVersus=true` et `boss=false`. L’association établit leur identité et leur période ; elle conserve les deux déclarations et signale l’arbitrage à effectuer avant une sélection jouable. Elle ne change aucune des deux sources.

Pour Balak, le candidat artistique suivi vient du lot 06. Il ne prouve pas que le chemin `expectedAsset` historique de sa fiche lot 04 soit livré. Pour Legion, le drone récupéré ne remplace pas la plateforme physique standard encore manquante. Les identités `ME2-CHR-GRUNT` et `ME2-CHR-LEGION` restent documentaires ; leurs futurs identifiants de règles Versus ne sont pas créés ici.

**Eve reste un soutien narratif.** Le Courtier yahg et l’Archonte restent des boss ; Bénézia attend sa normalisation avant une éventuelle variante Versus. Les costumes de Samara ne sont pas affectés à Morinth, et les ennemis génériques ne sont pas identifiés à des protagonistes nommés.

Pour 119 des 125 fiches personnage/costume, aucun raccord à une fiche de personnage n’a été trouvé dans les deux sources de conception examinées. Ce résultat ne signifie pas qu’aucun kit existe ailleurs dans le projet ; les anciennes bibles et récupérations gardent leur portée.

## 3. Costumes : identité, œuvre et variante

Les **38 costumes** forment **19 groupes documentaires identité/œuvre**. Chaque variante conserve son ID et son DLC. Les groupes n’ajoutent aucun combattant. Les corps masculin et féminin de Shepard, les périodes ME2/ME3, les tenues de loyauté et les packs d’apparence restent distincts.

| Identité | Œuvre | Variantes du catalogue |
|---|---|---|
| Garrus Vakarian | ME2 | [Tenue de loyauté](#cst_me2_garrus_loyalty), [Alternate Appearance Pack 1](#cst_me2_garrus_aap1) |
| Grunt | ME2 | [Tenue de loyauté](#cst_me2_grunt_loyalty), [Alternate Appearance Pack 2](#cst_me2_grunt_aap2) |
| Jack | ME2 | [Tenue de loyauté](#cst_me2_jack_loyalty), [Alternate Appearance Pack 1](#cst_me2_jack_aap1), [Tenue standard ME2](#cst_me2_jack_standard) |
| Jacob Taylor | ME2 | [Tenue de loyauté](#cst_me2_jacob_loyalty) |
| Kasumi Goto | ME2 | [Tenue de loyauté](#cst_me2_kasumi_loyalty) |
| Legion | ME2 | [Tenue de loyauté](#cst_me2_legion_loyalty) |
| Miranda Lawson | ME2 | [Tenue de loyauté](#cst_me2_miranda_loyalty), [Alternate Appearance Pack 2](#cst_me2_miranda_aap2) |
| Mordin Solus | ME2 | [Tenue de loyauté](#cst_me2_mordin_loyalty) |
| Samara | ME2 | [Tenue de loyauté](#cst_me2_samara_loyalty) |
| Tali'Zorah | ME2 | [Tenue de loyauté](#cst_me2_tali_loyalty), [Alternate Appearance Pack 2](#cst_me2_tali_aap2) |
| Thane Krios | ME2 | [Tenue de loyauté](#cst_me2_thane_loyalty), [Alternate Appearance Pack 1](#cst_me2_thane_aap1) |
| Zaeed Massani | ME2 | [Tenue de loyauté](#cst_me2_zaeed_loyalty) |
| Garrus Vakarian | ME3 | [Alternate Appearance Pack 1](#cst_me3_garrus_aap1) |
| Liara T'Soni | ME3 | [Alternate Appearance Pack 1](#cst_me3_liara_aap1) |
| IDA / EDI | ME3 | [Alternate Appearance Pack 1](#cst_me3_edi_aap1) |
| Shepard masculin | ME3 | [Armure Cerberus Ajax](#cst_me3_shepard_male_ajax), [Armure Reckoner Knight complète — corps masculin](#cst_me3_shepard_male_reckoner_knight) |
| Shepard féminin | ME3 | [Armure Cerberus Ajax](#cst_me3_shepard_female_ajax), [Armure Reckoner Knight complète — corps féminin](#cst_me3_shepard_female_reckoner_knight) |
| Shepard masculin | ME2 | [Armure Kestrel complète — corps masculin](#cst_me2_shepard_male_kestrel), [Armure Blood Dragon complète — corps masculin](#cst_me2_shepard_male_blood_dragon), [Armure Terminus Assault complète — corps masculin](#cst_me2_shepard_male_terminus), [Armure Collector complète — corps masculin](#cst_me2_shepard_male_collector), [Armure Inferno complète — corps masculin](#cst_me2_shepard_male_inferno), [Armure Cerberus Assault complète — corps masculin](#cst_me2_shepard_male_cerberus_assault) |
| Shepard féminin | ME2 | [Armure Kestrel complète — corps féminin](#cst_me2_shepard_female_kestrel), [Armure Blood Dragon complète — corps féminin](#cst_me2_shepard_female_blood_dragon), [Armure Terminus Assault complète — corps féminin](#cst_me2_shepard_female_terminus), [Armure Collector complète — corps féminin](#cst_me2_shepard_female_collector), [Armure Inferno complète — corps féminin](#cst_me2_shepard_female_inferno), [Armure Cerberus Assault complète — corps féminin](#cst_me2_shepard_female_cerberus_assault) |

Les seize armures de Shepard n’établissent aucune classe ni liste de pouvoirs. Wrex conserve « opus à confirmer » dans sa fiche. Ahern conserve son contexte du DLC original. L’[Homme Trouble](#chr_me2_illusive_man) possède le corps debout lot 13 et une pose assise candidate lot 16 ; son [fauteuil isolé](#prop_me2_illusive_man_chair) est désormais présent dans une fiche distincte. Les réserves de géométrie et d’alpha de la paire restent ouvertes. Suvi est représentée assise avec son siège, sans nouveau rôle de combattante.

## 4. Décors, scènes et liaisons

Les **52 sous-zones historiques** sont rattachées aux fiches G/J. Parmi elles, **16 disposent de 18 associations documentaires précises** dans les campagnes ou les exemples de fiches. Les **36 autres** n’ont pas d’affectation positive particulière dans les deux documents examinés ; elles restent utilisables comme besoins d’arène à préciser, sans scénario ajouté par déduction. Les **3 calques de Port Hanshan** ont une association de composant distincte ; ils ne modifient pas ce décompte de sous-zones ou de scènes.

| Sous-zone | Association explicitement écrite | Portée |
|---|---|---|
| [Astéroïde X57 — installation principale](#stg_me1_x57_main_facility) | route-armax-saren-me1 / c03 | Utilisation explicitement située dans un dossier de simulation ; aucun déplacement canonique de ce protagoniste à X57 n’est affirmé. |
| [Astéroïde X57 — installation principale](#stg_me1_x57_main_facility) | route-armax-anderson-me1 / c03 | Utilisation explicitement située dans un dossier de simulation ; aucun déplacement canonique de ce protagoniste à X57 n’est affirmé. |
| [Hagalaz — coque du Courtier](#stg_me2_hagalaz_broker_hull) | Exemple de fiche G | Exemple de fiche G appliqué au master aplati de la coque extérieure, avec couches, sol et caméra encore à produire. |
| [Hagalaz — coque du Courtier](#stg_me2_hagalaz_broker_hull) | ARMAX-LINK-HAGALAZ-01 — origine seulement | Origine de la liaison proposée. Destination intérieure à référencer et produire ; aucun catalogId de destination existant n’est attribué. |
| [Omega — réacteur](#stg_me3_omega_reactor) | route-armax-nyreen-me3 / c03 | Le texte associe le réacteur comme dossier de secteur au c03 ; ce lien ne livre pas le terminal, le sol de duel ou les autres sous-zones de la route. |
| [Eos — monolithe](#stg_mea_eos_monolith) | PR-AN-02 | Lieu de progression à Eos explicitement nommé ; le raccord au caveau reste scénaristique et ne prouve pas une liaison d’arènes livrée. |
| [Havarl — ruines](#stg_mea_havarl_ruins) | PR-AN-05 | Secteur reliquat explicitement associé ; dispositif et conditions du terminal à réaliser. |
| [Voeld — base de la Résistance](#stg_mea_voeld_resistance) | PR-AN-03 | Entrée de la base de la Résistance suivie au catalogue ; objectifs et scène à réaliser. |
| [Kadara — marché](#stg_mea_kadara_market) | PR-AN-04 | Marché associé au segment d’approvisionnement ; ne représente pas l’ensemble de Kadara. |
| [Nexus — baie d'amarrage](#stg_mea_nexus_docking_bay) | PR-AN-01 | Le quai est associé au diagnostic ; le texte précise qu’il ne constitue pas une salle d’entraînement. |
| [Elaaden — Nouvelle Tuchanka](#stg_mea_elaaden_new_tuchanka) | PR-AN-04 | Entrée de Nouvelle Tuchanka associée au segment d’extraction ; même chapitre, changement de lieu non traité comme arène connectée. |
| [Méridiane — contrôle](#stg_mea_meridian_control) | PR-AN-06 | Cœur de la mission finale associé au boss à relais ; le master ne fournit ni tous les relais ni le parcours complet. |
| [Eos — caveau reliquat](#stg_mea_eos_vault) | PR-AN-02 | Caveau explicitement nommé après le monolithe ; aucune topologie de raccord livrée. |
| [Armax — hall, entrée nord](#stg_me3_armax_lobby_north) | Fiches G/J du lot 14 ; aucune route assignée | Le tableau de fiche G nomme cette sous-zone ; l’ID est confirmé par l’association lot14 existante. Aucun chapitre, route, lien inter-arènes ou scène narrative spécifique ne lui est attribué. |
| [Armax — arène Fatal Error](#stg_me3_armax_fatal_error) | Fiches G/J du lot 14 ; aucune route assignée | Le tableau de fiche G nomme cette sous-zone ; l’ID est confirmé par l’association lot14 existante. Aucun chapitre, route, lien inter-arènes ou scène narrative spécifique ne lui est attribué. |
| [Omega — entrée Water Treatment](#stg_me3_omega_water_treatment_entry) | Fiches G/J du lot 14 ; aucune route assignée | Le tableau de fiche G nomme cette sous-zone ; l’ID est confirmé par l’association lot14 existante. Aucun chapitre, route, lien inter-arènes ou scène narrative spécifique ne lui est attribué. |
| [Omega — passerelle vers Doru District](#stg_me3_omega_doru_district_walkway) | Fiches G/J du lot 14 ; aucune route assignée | Le tableau de fiche G nomme cette sous-zone ; l’ID est confirmé par l’association lot14 existante. Aucun chapitre, route, lien inter-arènes ou scène narrative spécifique ne lui est attribué. |
| [Omega — Afterlife, centre de commandement Cerberus](#stg_me3_omega_afterlife_command) | Fiches G/J du lot 14 ; aucune route assignée | Le tableau de fiche G nomme cette sous-zone ; l’ID est confirmé par l’association lot14 existante. Aucun chapitre, route, lien inter-arènes ou scène narrative spécifique ne lui est attribué. |

### Sous-zones qui ne se remplacent pas

Les sept avertissements explicites des sources concernent cinq stages. Ils restent distincts des associations positives :

| Image ou sous-zone disponible | Besoin qui reste distinct |
|---|---|
| Laboratoire de reproduction de Virmire | Plateforme ou accès extérieurs des routes |
| Plateforme de la balise d’Eden Prime | Quai de l’intro de Nihlus |
| Chambre du Conseil | Passerelle de la rivalité Saren/Anderson |
| CIC du Normandy SR-1 | Salle d’entraînement d’Anderson |
| Réacteur Omega | Zone des Serres et passerelle de contrôle de Nyreen |

Le c03 de Nihlus cite une installation X57 simulée sans confirmer la salle précise. Le c05 de Saren demande un espace de Novéria à préciser : Hot Labs ne lui est pas affecté automatiquement. La destination intérieure de **ARMAX-LINK-HAGALAZ-01** reste sans identifiant de stage livré. La composition de Port Hanshan conserve son ID documentaire `ME1-VS-PORT-HANSHAN-REF-01` dans [production.json](../../combat-2d/production.json), extérieur au catalogue de manquants. Les nouvelles entrées [PH-20](#layer_port_hanshan_architecture_distant_fixed), [PH-30](#layer_port_hanshan_rear_structures_fixed) et [PH-40](#layer_port_hanshan_floor_fixed) s’y rattachent par `componentParent` dans le JSON ; elles ne remplacent pas cette composition et ne lui attribuent pas de route.

Ces calques dérivent des candidats internes historiques, avec des détails reconstruits. PH-20 et PH-30 mesurent 1 672 × 941 pixels ; le sol PH-40 R1 mesure 1 671 × 941 pixels. La révision améliore le raccord vertical sur leur largeur commune, mais la colonne manquante, les franges et l’îlot détaché de PH-20 restent consignés dans la [revue indépendante](../lot16/qa/port-hanshan-independent-review.json). Le PH-50 historique reste une référence distincte déjà disponible ; le lot 16 ne le recompte pas comme une génération nouvelle.

Le hall Armax et Fatal Error, Afterlife ME2 et le commandement Cerberus ME3, le CIC SR-1 et le hangar SR-2 restent des identités séparées. Le passage entre lieux de campagne ne prouve pas une transition de combat. Les options de présentation, interactions, dangers et transitions restent celles de la [bible](BIBLE_ARMAX_INTEGREE.md#g13).

## 5. Composants d’action du lot 14

Les vingt associations artistiques existantes sont référencées sans modifier leur portée. Trois d’entre elles contiennent déjà un rapprochement d’action :

| Composant | Rapprochement conservé | Limite |
|---|---|---|
| [Tir percussif ME2](#projectile_me2_concussive_fixed) | Grunt, Tir percussif, `236M` | Proposition de visuel ; trajectoire et comportement à contrôler |
| [Impact Throw ME2](#fx_me2_throw_impact_fixed) | Morinth, `armax-morinth-me2-special-3`, Recul biotique | Famille visuelle seulement ; comparaison exacte encore requise |
| [Traceur chaud ME2](#projectile_me2_incendiary_fixed) | Grunt, Munitions incendiaires, `214S` (ancien `214T`) | Attribution du visuel incertaine ; aucun dégât permanent ajouté |

Les autres effets, projectiles et accessoires du lot 14 conservent leurs références sans recevoir de porteur inventé. La décharge candidate Overload reste à attribuer. L’omni-outil et la grenade-disque n’octroient pas d’équipement ou de capacité. Aucun composant ne ferme une action complète, une animation ou un plan narratif.

Le [fauteuil](#prop_me2_illusive_man_chair) et la [pose assise](#chr_me2_illusive_man) du lot 16 sont associés à la présence narrative ME2 de l’Homme Trouble, en **B/F/J**. Les [associations du lot](../lot16/bible-asset-associations.json) portent `actionAssociations: []` et `completeNarrativeSceneProduced: false`. Aucun chapitre ou numéro de plan particulier ne leur est affecté sans brief correspondant. Le personnage assis inclut un fauteuil redessiné : assise, accoudoirs et appuis ne coïncident pas exactement avec l’accessoire vide. Les deux PNG ont un alpha réel de 0 à 254, avec résidus faibles sur certains bords ; la [revue indépendante](../lot16/qa/illusive-man-independent-review.json) conserve ces limites.

## 6. Index des 192 entrées héritées

Les quatre nouvelles fiches du lot 18 figurent dans la section « Composants du marché Urdnot » en fin de document, portant le total courant à 196.

L’identité, l’œuvre, la variante et l’état d’image ci-dessous sont repris du catalogue de référence. « Candidat présent » indique uniquement qu’au moins un chemin d’image est déclaré. Les preuves et réserves détaillées restent dans le catalogue et les manifestes des lots. Les rubriques et fiches applicables sont celles du rôle indiqué en section 1 et dans le JSON.

### Combattant candidat — 9 fiches

Fiches : **B, C, E, J**. Candidat du suivi artistique ; aucune sélection jouable déduite du catalogue.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="chr_me2_legion_standard"></a>`chr_me2_legion_standard` — Legion | ME2 ; Plateforme physique standard | Sans image | ME2-CHR-LEGION ; identité documentaire |
| <a id="chr_me3_edi_standard"></a>`chr_me3_edi_standard` — IDA / EDI | ME3 ; Corps synthétique standard | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_trilogy_urdnot_wrex_guide_ea"></a>`chr_trilogy_urdnot_wrex_guide_ea` — Urdnot Wrex | Trilogie / guide EA ; Armure rouge du guide EA (opus à confirmer) | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_jenkins"></a>`chr_me1_jenkins` — Richard L. Jenkins | ME1 ; Uniforme et armure d'Eden Prime | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_urdnot_wreav"></a>`chr_me3_urdnot_wreav` — Urdnot Wreav | ME3 ; Apparence ME3 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_alec_ryder"></a>`chr_mea_alec_ryder` — Alec Ryder | MEA ; Armure de Pionnier du prologue | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_reyes_vidal"></a>`chr_mea_reyes_vidal` — Reyes Vidal | MEA ; Apparence Kadara | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_sloane_kelly"></a>`chr_mea_sloane_kelly` — Sloane Kelly | MEA ; Apparence Kadara | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_evfra"></a>`chr_mea_evfra` — Evfra | MEA ; Apparence de chef de la Résistance | Image candidate lot19 | Cadre du rôle ; affectation particulière à préciser |

### Boss candidat — 22 fiches

Fiches : **B, C, I, J**. Usage proposé dans le catalogue ; confronter la sélection de la fiche de conception avant tout accès Versus ou tournoi.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="chr_me3_kai_leng"></a>`chr_me3_kai_leng` — Kai Leng | ME3 ; Tenue du jeu publié | Sans image | armax-kai-leng-me3 ; divergence de rôle conservée |
| <a id="chr_me1_balak"></a>`chr_me1_balak` — Balak | ME1 ; Bring Down the Sky ; Apparence X57 | Candidat présent | armax-balak-me1 ; divergence de rôle conservée |
| <a id="chr_me2_collector_general"></a>`chr_me2_collector_general` — Général récolteur | ME2 ; Corps du personnage | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_maya_brooks"></a>`chr_me3_maya_brooks` — Maya Brooks | ME3 ; Citadel ; Apparence finale du DLC | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_thresher_maw"></a>`chr_me1_thresher_maw` — Dévoreur / Thresher Maw | ME1 ; Créature ME1 émergée | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_rachni_brood_warrior"></a>`chr_me1_rachni_brood_warrior` — Rachni Brood Warrior | ME1 ; Guerrier rachni ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_geth_armature"></a>`chr_me1_geth_armature` — Geth Armature | ME1 ; Plateforme lourde ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_geth_colossus"></a>`chr_me1_geth_colossus` — Geth Colossus | ME1 ; Plateforme colossale ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_ymir_mech"></a>`chr_me2_ymir_mech` — YMIR Mech | ME2 ; Mech lourd ME2 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_scion"></a>`chr_me2_scion` — Scion | ME2 ; Apparence ME2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_praetorian"></a>`chr_me2_praetorian` — Praetorian | ME2 ; Apparence ME2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_brute_armoured"></a>`chr_me3_brute_armoured` — Brute | ME3 ; Modèle ME3 avec plaques d'armure | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_ravager"></a>`chr_me3_ravager` — Ravager | ME3 ; Modèle ME3 standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_banshee"></a>`chr_me3_banshee` — Banshee | ME3 ; Modèle ME3 standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_atlas"></a>`chr_me3_atlas` — Atlas | ME3 ; Mech Cerberus standard ME3 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_adjutant_omega"></a>`chr_me3_adjutant_omega` — Adjutant | ME3 ; Omega ; Modèle du DLC Omega | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_ascendant"></a>`chr_mea_kett_ascendant` — Ascendant kett | Andromeda ; Unité standard, hors Prefect nommé | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_fiend"></a>`chr_mea_kett_fiend` — Fiend kett | Andromeda ; Créature kett standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_destroyer"></a>`chr_mea_remnant_destroyer` — Destroyer reliquat | Andromeda ; Unité standard, hors Progenitor nommé | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_architect"></a>`chr_mea_remnant_architect` — Architecte reliquat | Andromeda ; Créature mécanique d'Andromeda | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_behemoth"></a>`chr_mea_kett_behemoth` — Behemoth kett | Andromeda ; Krogan exalté standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_hydra"></a>`chr_mea_hydra` — Hydra | Andromeda ; Méca hors-la-loi standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |

### Adversaire candidat — 31 fiches

Fiches : **B, C, J**. Un adversaire de rencontre ne devient pas automatiquement un combattant sélectionnable.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="chr_me1_varren"></a>`chr_me1_varren` — Varren | ME1 ; Modèle sauvage ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_rachni_worker"></a>`chr_me1_rachni_worker` — Rachni Worker | ME1 ; Ouvrier rachni ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_rachni_soldier"></a>`chr_me1_rachni_soldier` — Rachni Soldier | ME1 ; Soldat rachni ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_thorian_creeper"></a>`chr_me1_thorian_creeper` — Thorian Creeper | ME1 ; Créature de Féros ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_geth_stalker"></a>`chr_me1_geth_stalker` — Geth Stalker | ME1 ; Sous-type Stalker des hoppers ME1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_loki_mech"></a>`chr_me2_loki_mech` — LOKI Mech | ME2 ; Mech bipède ME2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_fenris_mech"></a>`chr_me2_fenris_mech` — FENRIS Mech | ME2 ; Mech quadrupède ME2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_collector_drone"></a>`chr_me2_collector_drone` — Collector Drone | ME2 ; Drone récolteur ME2 non possédé | Image candidate lot19 | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_collector_assassin"></a>`chr_me2_collector_assassin` — Collector Assassin | ME2 ; Assassin récolteur ME2 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_collector_guardian"></a>`chr_me2_collector_guardian` — Collector Guardian | ME2 ; Gardien récolteur ME2 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_marauder"></a>`chr_me3_marauder` — Marauder | ME3 ; Modèle ME3 standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_cannibal"></a>`chr_me3_cannibal` — Cannibal | ME3 ; Modèle ME3 sans renfort temporaire | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_phantom"></a>`chr_me3_phantom` — Phantom | ME3 ; Armure Cerberus standard ME3 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_guardian"></a>`chr_me3_guardian` — Guardian | ME3 ; Fantassin Cerberus avec bouclier ME3 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_nemesis"></a>`chr_me3_nemesis` — Nemesis | ME3 ; Tireuse Cerberus ME3 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_combat_engineer"></a>`chr_me3_combat_engineer` — Combat Engineer | ME3 ; Ingénieur Cerberus ME3 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_assault_trooper"></a>`chr_me3_assault_trooper` — Assault Trooper | ME3 ; Fantassin Cerberus standard ME3 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_centurion"></a>`chr_me3_centurion` — Centurion | ME3 ; Centurion Cerberus ME3 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_rampart_mech_omega"></a>`chr_me3_rampart_mech_omega` — Rampart Mech | ME3 ; Omega ; Modèle du DLC Omega | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_cat6_heavy"></a>`chr_me3_cat6_heavy` — CAT6 Heavy | ME3 ; Citadel ; Unité CAT6 du DLC Citadel | Candidat présent | Association lot 14 conservée |
| <a id="chr_me3_cat6_sniper"></a>`chr_me3_cat6_sniper` — CAT6 Sniper | ME3 ; Citadel ; Unité CAT6 du DLC Citadel | Candidat présent | Association lot 14 conservée |
| <a id="chr_me3_cat6_specialist"></a>`chr_me3_cat6_specialist` — CAT6 Specialist | ME3 ; Citadel ; Unité CAT6 du DLC Citadel | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_destined"></a>`chr_mea_kett_destined` — Destined kett | Andromeda ; Unité kett standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_observer"></a>`chr_mea_remnant_observer` — Observer reliquat | Andromeda ; Drone standard, hors variante Progenitor | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_eiroch"></a>`chr_mea_eiroch` — Eiroch | Andromeda ; Créature standard, hors Ancient Eiroch | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_wraith"></a>`chr_mea_kett_wraith` — Wraith kett | Andromeda ; Créature kett standard avec harnais | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_chosen"></a>`chr_mea_kett_chosen` — Chosen kett | Andromeda ; Soldat kett standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_breacher"></a>`chr_mea_remnant_breacher` — Breacher reliquat | Andromeda ; Drone reliquat standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_nullifier"></a>`chr_mea_remnant_nullifier` — Nullifier reliquat | Andromeda ; Unité reliquat standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kett_anointed"></a>`chr_mea_kett_anointed` — Kett — Anointed | Andromeda ; Armure standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_remnant_assembler"></a>`chr_mea_remnant_assembler` — Reliquats — Assembler | Andromeda ; État hostile standard | Candidat présent | Cadre du rôle ; affectation particulière à préciser |

### Soutien narratif — 25 fiches

Fiches : **B, F, J**. Aucun coup, pouvoir ou soutien de combat ajouté par le seul rôle narratif.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="chr_me1_ahern"></a>`chr_me1_ahern` — Amiral Tadius Ahern | ME1 original ; Pinnacle Station ; Apparence de Pinnacle Station | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_kate_bowman"></a>`chr_me1_kate_bowman` — Kate Bowman | ME1 ; Bring Down the Sky ; Apparence X57 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me1_chakwas"></a>`chr_me1_chakwas` — Karin Chakwas | ME1 ; Tenue médicale Normandy SR-1 | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_joker"></a>`chr_me2_joker` — Jeff « Joker » Moreau | ME2 ; Tenue du Normandy SR-2 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_kelly_chambers"></a>`chr_me2_kelly_chambers` — Kelly Chambers | ME2 ; Tenue de service | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_gavin_archer"></a>`chr_me2_gavin_archer` — Gavin Archer | ME2 ; Overlord ; Apparence du projet Overlord | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me2_amanda_kenson"></a>`chr_me2_amanda_kenson` — Amanda Kenson | ME2 ; Arrival ; Apparence Arrival | Candidat présent | Association lot 14 conservée |
| <a id="chr_me2_illusive_man"></a>`chr_me2_illusive_man` — L'Homme Trouble | ME2 ; Costume et fauteuil ME2 | Candidat présent | Pose debout lot 13 conservée ; pose assise lot 16 en B/F/J. [Fauteuil isolé](#prop_me2_illusive_man_chair) distinct ; géométrie et alpha sous réserve, sans action ajoutée. |
| <a id="chr_me3_padok_wiks"></a>`chr_me3_padok_wiks` — Padok Wiks | ME3 ; Apparence Sur'Kesh | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_adrien_victus"></a>`chr_me3_adrien_victus` — Adrien Victus | ME3 ; Apparence de Primarque | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_steven_hackett"></a>`chr_me3_steven_hackett` — Steven Hackett | ME3 ; Uniforme d'amiral ME3 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_han_gerrel"></a>`chr_me3_han_gerrel` — Han'Gerrel vas Neema | ME3 ; Combinaison de l'amiral | Image candidate lot17 — attribution lot19 | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_zaal_koris"></a>`chr_me3_zaal_koris` — Zaal'Koris vas Qwib-Qwib | ME3 ; Combinaison de l'amiral | Image candidate lot17 — attribution lot19 | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_shala_raan"></a>`chr_me3_shala_raan` — Shala'Raan vas Tonbay | ME3 ; Combinaison de l'amirale | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_daro_xen"></a>`chr_me3_daro_xen` — Daro'Xen vas Moreh | ME3 ; Combinaison de l'amirale | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_bailey"></a>`chr_me3_bailey` — Armando-Owen Bailey | ME3 ; Tenue du SSC ME3 | Image candidate lot19 | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_steve_cortez"></a>`chr_me3_steve_cortez` — Steve Cortez | ME3 ; Tenue de pilote Alliance | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_samantha_traynor"></a>`chr_me3_samantha_traynor` — Samantha Traynor | ME3 ; Tenue de service Alliance | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_oleg_petrovsky"></a>`chr_me3_oleg_petrovsky` — Oleg Petrovsky | ME3 ; Omega ; Uniforme du DLC Omega | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_me3_henry_lawson"></a>`chr_me3_henry_lawson` — Henry Lawson | ME3 ; Apparence Sanctuary | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_kallo_jath"></a>`chr_mea_kallo_jath` — Kallo Jath | MEA ; Tenue du pilote du Tempest | Image candidate lot19 | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_suvi_anwar"></a>`chr_mea_suvi_anwar` — Suvi Anwar | MEA ; Tenue scientifique du Tempest | Candidat présent | Association lot 14 conservée |
| <a id="chr_mea_gil_brodie"></a>`chr_mea_gil_brodie` — Gil Brodie | MEA ; Tenue d'ingénieur du Tempest | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_lexi_tperro"></a>`chr_mea_lexi_tperro` — Lexi T'Perro | MEA ; Tenue médicale du Tempest | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="chr_mea_moshae_sjefa"></a>`chr_mea_moshae_sjefa` — Moshae Sjefa | MEA ; Apparence du jeu | Candidat présent | Cadre du rôle ; affectation particulière à préciser |

### Costume / variante visuelle — 38 fiches

Fiches : **B, J**. Le costume ne crée ni classe, ni pouvoir, ni kit ; aucune statistique n’est transférée au duel.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="cst_me2_garrus_loyalty"></a>`cst_me2_garrus_loyalty` — Garrus Vakarian | ME2 ; Tenue de loyauté | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_grunt_loyalty"></a>`cst_me2_grunt_loyalty` — Grunt | ME2 ; Tenue de loyauté | Sans image | ME2-CHR-GRUNT ; identité documentaire |
| <a id="cst_me2_jack_loyalty"></a>`cst_me2_jack_loyalty` — Jack | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_jacob_loyalty"></a>`cst_me2_jacob_loyalty` — Jacob Taylor | ME2 ; Tenue de loyauté | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_kasumi_loyalty"></a>`cst_me2_kasumi_loyalty` — Kasumi Goto | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_legion_loyalty"></a>`cst_me2_legion_loyalty` — Legion | ME2 ; Tenue de loyauté | Sans image | ME2-CHR-LEGION ; identité documentaire |
| <a id="cst_me2_miranda_loyalty"></a>`cst_me2_miranda_loyalty` — Miranda Lawson | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_mordin_loyalty"></a>`cst_me2_mordin_loyalty` — Mordin Solus | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_samara_loyalty"></a>`cst_me2_samara_loyalty` — Samara | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_tali_loyalty"></a>`cst_me2_tali_loyalty` — Tali'Zorah | ME2 ; Tenue de loyauté | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_thane_loyalty"></a>`cst_me2_thane_loyalty` — Thane Krios | ME2 ; Tenue de loyauté | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_zaeed_loyalty"></a>`cst_me2_zaeed_loyalty` — Zaeed Massani | ME2 ; Tenue de loyauté | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_garrus_aap1"></a>`cst_me2_garrus_aap1` — Garrus Vakarian | ME2 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_jack_aap1"></a>`cst_me2_jack_aap1` — Jack | ME2 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_thane_aap1"></a>`cst_me2_thane_aap1` — Thane Krios | ME2 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_grunt_aap2"></a>`cst_me2_grunt_aap2` — Grunt | ME2 ; Alternate Appearance Pack 2 ; Alternate Appearance Pack 2 | Candidat présent | ME2-CHR-GRUNT ; identité documentaire |
| <a id="cst_me2_tali_aap2"></a>`cst_me2_tali_aap2` — Tali'Zorah | ME2 ; Alternate Appearance Pack 2 ; Alternate Appearance Pack 2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_miranda_aap2"></a>`cst_me2_miranda_aap2` — Miranda Lawson | ME2 ; Alternate Appearance Pack 2 ; Alternate Appearance Pack 2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_garrus_aap1"></a>`cst_me3_garrus_aap1` — Garrus Vakarian | ME3 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_liara_aap1"></a>`cst_me3_liara_aap1` — Liara T'Soni | ME3 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_edi_aap1"></a>`cst_me3_edi_aap1` — IDA / EDI | ME3 ; Alternate Appearance Pack 1 ; Alternate Appearance Pack 1 | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_shepard_male_ajax"></a>`cst_me3_shepard_male_ajax` — Shepard masculin | ME3 ; Alternate Appearance Pack 1 ; Armure Cerberus Ajax | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_shepard_female_ajax"></a>`cst_me3_shepard_female_ajax` — Shepard féminin | ME3 ; Alternate Appearance Pack 1 ; Armure Cerberus Ajax | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_jack_standard"></a>`cst_me2_jack_standard` — Jack | ME2 ; Tenue standard ME2 | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_kestrel"></a>`cst_me2_shepard_male_kestrel` — Shepard masculin | ME2 ; Aegis Pack ; Armure Kestrel complète — corps masculin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_kestrel"></a>`cst_me2_shepard_female_kestrel` — Shepard féminin | ME2 ; Aegis Pack ; Armure Kestrel complète — corps féminin | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_blood_dragon"></a>`cst_me2_shepard_male_blood_dragon` — Shepard masculin | ME2 ; Blood Dragon Armor ; Armure Blood Dragon complète — corps masculin | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_blood_dragon"></a>`cst_me2_shepard_female_blood_dragon` — Shepard féminin | ME2 ; Blood Dragon Armor ; Armure Blood Dragon complète — corps féminin | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_terminus"></a>`cst_me2_shepard_male_terminus` — Shepard masculin | ME2 ; Terminus Weapon and Armor Pack ; Armure Terminus Assault complète — corps masculin | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_terminus"></a>`cst_me2_shepard_female_terminus` — Shepard féminin | ME2 ; Terminus Weapon and Armor Pack ; Armure Terminus Assault complète — corps féminin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_collector"></a>`cst_me2_shepard_male_collector` — Shepard masculin | ME2 ; Collectors' Weapon and Armor Pack ; Armure Collector complète — corps masculin | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_collector"></a>`cst_me2_shepard_female_collector` — Shepard féminin | ME2 ; Collectors' Weapon and Armor Pack ; Armure Collector complète — corps féminin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_inferno"></a>`cst_me2_shepard_male_inferno` — Shepard masculin | ME2 ; Equalizer Pack ; Armure Inferno complète — corps masculin | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_inferno"></a>`cst_me2_shepard_female_inferno` — Shepard féminin | ME2 ; Equalizer Pack ; Armure Inferno complète — corps féminin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_male_cerberus_assault"></a>`cst_me2_shepard_male_cerberus_assault` — Shepard masculin | ME2 ; Cerberus Weapon and Armor Pack ; Armure Cerberus Assault complète — corps masculin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me2_shepard_female_cerberus_assault"></a>`cst_me2_shepard_female_cerberus_assault` — Shepard féminin | ME2 ; Cerberus Weapon and Armor Pack ; Armure Cerberus Assault complète — corps féminin | Image candidate | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_shepard_male_reckoner_knight"></a>`cst_me3_shepard_male_reckoner_knight` — Shepard masculin | ME3 ; Bonus démo Kingdoms of Amalur: Reckoning ; Armure Reckoner Knight complète — corps masculin | Sans image | Cadre du rôle ; affectation particulière à préciser |
| <a id="cst_me3_shepard_female_reckoner_knight"></a>`cst_me3_shepard_female_reckoner_knight` — Shepard féminin | ME3 ; Bonus démo Kingdoms of Amalur: Reckoning ; Armure Reckoner Knight complète — corps féminin | Sans image | Cadre du rôle ; affectation particulière à préciser |

### Arène adaptée — 52 fiches

Fiches : **G, J**. Un master de décor ne prouve ni terrain jouable ni connexion. Une fiche H s’ajoute seulement pour un événement ou une liaison explicitement étudiés.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="stg_me1_eden_prime_spaceport"></a>`stg_me1_eden_prime_spaceport` — Eden Prime — spatioport | ME1 ; Plateforme de la balise | Candidat présent | Sous-zone non substituable, section 4 |
| <a id="stg_me1_feros_zhus_hope"></a>`stg_me1_feros_zhus_hope` — Féros — Zhu's Hope | ME1 ; Colonie | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_feros_exogeni"></a>`stg_me1_feros_exogeni` — Féros — ExoGeni | ME1 ; Intérieur du siège | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_ilos_archives"></a>`stg_me1_ilos_archives` — Ilos — archives | ME1 ; Salle de Vigil | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_ilos_conduit"></a>`stg_me1_ilos_conduit` — Ilos — le Canal | ME1 ; Approche du relais | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_citadel_council"></a>`stg_me1_citadel_council` — Citadelle — tour du Conseil | ME1 ; Chambre du Conseil | Candidat présent | Sous-zone non substituable, section 4 |
| <a id="stg_me1_noveria_hotlabs"></a>`stg_me1_noveria_hotlabs` — Novéria — Hot Labs | ME1 ; Laboratoires du pic 15 | Candidat présent | Mention de lieu à préciser |
| <a id="stg_me1_therum_ruins"></a>`stg_me1_therum_ruins` — Thérum — ruines prothéennes | ME1 ; Site de fouilles de Liara | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_x57_main_facility"></a>`stg_me1_x57_main_facility` — Astéroïde X57 — installation principale | ME1 ; Bring Down the Sky ; Salle de confrontation | Candidat présent | 2 association(s) précise(s), section 4; Mention de lieu à préciser |
| <a id="stg_me2_omega_afterlife"></a>`stg_me2_omega_afterlife` — Omega — Afterlife | ME2 ; Salle du club | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_haestrom_ruins"></a>`stg_me2_haestrom_ruins` — Haestrom — ruines | ME2 ; Zone de la mission de Tali | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_tuchanka_urdnot"></a>`stg_me2_tuchanka_urdnot` — Tuchanka — camp Urdnot | ME2 ; Zone du camp | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_purgatory_prison"></a>`stg_me2_purgatory_prison` — Purgatory — prison | ME2 ; Secteur des cellules | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_hagalaz_broker_hull"></a>`stg_me2_hagalaz_broker_hull` — Hagalaz — coque du Courtier | ME2 ; Lair of the Shadow Broker ; Extérieur du vaisseau | Candidat présent | 2 association(s) précise(s), section 4 |
| <a id="stg_me2_bekenstein_hock"></a>`stg_me2_bekenstein_hock` — Bekenstein — propriété de Hock | ME2 ; Kasumi: Stolen Memory ; Extérieur de la réception | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_aite_hermes"></a>`stg_me2_aite_hermes` — Aïté — station Hermès | ME2 ; Overlord ; Salle de contrôle | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_aite_atlas"></a>`stg_me2_aite_atlas` — Aïté — station Atlas | ME2 ; Overlord ; Installation intérieure | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_arrival_asteroid"></a>`stg_me2_arrival_asteroid` — Projet Rho — astéroïde | ME2 ; Arrival ; Plateforme extérieure | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_rayya_tribunal"></a>`stg_me2_rayya_tribunal` — Rayya — tribunal | ME2 ; Salle de l'audience | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_pragia_facility"></a>`stg_me2_pragia_facility` — Pragia — centre de recherche | ME2 ; Secteur de Jack | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_normandy_shuttle_bay"></a>`stg_me3_normandy_shuttle_bay` — Normandy SR-2 — hangar | ME3 ; Pont 5 Alliance | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_surkesh_stg"></a>`stg_me3_surkesh_stg` — Sur'Kesh — base GSI | ME3 ; Plateforme d'évacuation | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_mars_archives"></a>`stg_me3_mars_archives` — Mars — archives | ME3 ; Installation prothéenne | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_tuchanka_shroud"></a>`stg_me3_tuchanka_shroud` — Tuchanka — le Voile | ME3 ; Approche de la tour | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_rannoch_base"></a>`stg_me3_rannoch_base` — Rannoch — base du signal | ME3 ; Zone de l'assaut final | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_grissom_atrium"></a>`stg_me3_grissom_atrium` — Académie Grissom — atrium | ME3 ; Atrium de la mission | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_omega_reactor"></a>`stg_me3_omega_reactor` — Omega — réacteur | ME3 ; Omega ; Installation sous occupation | Candidat présent | 1 association(s) précise(s), section 4; Sous-zone non substituable, section 4 |
| <a id="stg_me3_silversun_strip"></a>`stg_me3_silversun_strip` — Citadelle — Silversun Strip | ME3 ; Citadel ; Promenade | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_despoina_wreck"></a>`stg_me3_despoina_wreck` — Despoina — épave | ME3 ; Leviathan ; Plateforme à la surface | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_cronus_office"></a>`stg_me3_cronus_office` — Station Cronos — bureau | ME3 ; Salle de l'Homme Trouble | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_london_beam"></a>`stg_me3_london_beam` — Londres — approche du faisceau | ME3 ; Zone de l'assaut terrestre | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_mea_eos_monolith"></a>`stg_mea_eos_monolith` — Eos — monolithe | MEA ; Site reliquat | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_havarl_ruins"></a>`stg_mea_havarl_ruins` — Havarl — ruines | MEA ; Secteur reliquat | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_voeld_resistance"></a>`stg_mea_voeld_resistance` — Voeld — base de la Résistance | MEA ; Entrée de la base | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_kadara_market"></a>`stg_mea_kadara_market` — Kadara — marché | MEA ; Niveau principal du port | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_aya_docks"></a>`stg_mea_aya_docks` — Aya — quais | MEA ; Zone d'atterrissage du Tempest | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_mea_nexus_docking_bay"></a>`stg_mea_nexus_docking_bay` — Nexus — baie d'amarrage | MEA ; Zone du Tempest | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_elaaden_new_tuchanka"></a>`stg_mea_elaaden_new_tuchanka` — Elaaden — Nouvelle Tuchanka | MEA ; Entrée de la colonie | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_mea_meridian_control"></a>`stg_mea_meridian_control` — Méridiane — contrôle | MEA ; Cœur de la mission finale | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_me1_normandy_sr1_cic"></a>`stg_me1_normandy_sr1_cic` — Normandy SR-1 — CIC | ME1 ; Centre d'information de combat | Candidat présent | Sous-zone non substituable, section 4 |
| <a id="stg_me1_feros_thorian_lair"></a>`stg_me1_feros_thorian_lair` — Féros — enceinte du Thorien | ME1 ; Niveau des nœuds du Thorien | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me1_virmire_breeding_lab"></a>`stg_me1_virmire_breeding_lab` — Virmire — installation de Saren | ME1 ; Laboratoire de reproduction krogan | Candidat présent | Sous-zone non substituable, section 4 |
| <a id="stg_me1_citadel_choras_den"></a>`stg_me1_citadel_choras_den` — Citadelle — Chora's Den | ME1 ; Salle principale du club | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me2_derelict_reaper_core"></a>`stg_me2_derelict_reaper_core` — Moissonneur abandonné — cœur | ME2 ; Zone du cœur de la mission Reaper IFF | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_geth_dreadnought_core"></a>`stg_me3_geth_dreadnought_core` — Cuirassé geth — cœur | ME3 ; Salle du cœur de la mission Priority: Geth Dreadnought | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_me3_citadel_archives"></a>`stg_me3_citadel_archives` — Citadelle — archives | ME3 ; Citadel ; Salle d'archives de la séquence Escape | Candidat présent | Cadre du rôle ; affectation particulière à préciser |
| <a id="stg_mea_eos_vault"></a>`stg_mea_eos_vault` — Eos — caveau reliquat | Andromeda ; Salle intérieure de réactivation | Candidat présent | 1 association(s) précise(s), section 4 |
| <a id="stg_me3_armax_lobby_north"></a>`stg_me3_armax_lobby_north` — Armax — hall, entrée nord | ME3 ; Citadel ; Armax — hall, entrée nord | Candidat présent | 1 association(s) précise(s), section 4; Association lot 14 conservée |
| <a id="stg_me3_armax_fatal_error"></a>`stg_me3_armax_fatal_error` — Armax — arène Fatal Error | ME3 ; Citadel ; Armax — arène Fatal Error | Candidat présent | 1 association(s) précise(s), section 4; Association lot 14 conservée |
| <a id="stg_me3_omega_water_treatment_entry"></a>`stg_me3_omega_water_treatment_entry` — Omega — entrée Water Treatment | ME3 ; Omega ; Omega — entrée Water Treatment | Candidat présent | 1 association(s) précise(s), section 4; Association lot 14 conservée |
| <a id="stg_me3_omega_doru_district_walkway"></a>`stg_me3_omega_doru_district_walkway` — Omega — passerelle vers Doru District | ME3 ; Omega ; Omega — passerelle vers Doru District | Candidat présent | 1 association(s) précise(s), section 4; Association lot 14 conservée |
| <a id="stg_me3_omega_afterlife_command"></a>`stg_me3_omega_afterlife_command` — Omega — Afterlife, centre de commandement Cerberus | ME3 ; Omega ; Omega — Afterlife, centre de commandement Cerberus | Candidat présent | 1 association(s) précise(s), section 4; Association lot 14 conservée |

### Calque de décor — 3 fiches héritées, hors compléments lot 18

Fiches : **G, J**. Rôle `calque_decor`, catégorie stage. Chaque calque est un composant de la composition documentaire `ME1-VS-PORT-HANSHAN-REF-01`, distinct des 52 masters historiques. Les coefficients de parallaxe, le calage et les collisions ne sont pas validés.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="layer_port_hanshan_architecture_distant_fixed"></a>`layer_port_hanshan_architecture_distant_fixed` — Port Hanshan — architecture distante PH-20 | ME1 ; PH-20 — architecture extérieure isolée | Candidat présent | Composant PH-20 en G/J ; candidat interne historique comme source, îlot détaché et franges cyan sous réserve. |
| <a id="layer_port_hanshan_rear_structures_fixed"></a>`layer_port_hanshan_rear_structures_fixed` — Port Hanshan — structures arrière PH-30 | ME1 ; PH-30 — architecture intérieure sans sol | Candidat présent | Composant PH-30 en G/J ; plafond, baies et structures séparés du sol, avec franges et raccord à contrôler. |
| <a id="layer_port_hanshan_floor_fixed"></a>`layer_port_hanshan_floor_fixed` — Port Hanshan — sol PH-40 | ME1 ; PH-40 — sol et jonctions isolés | Candidat présent | Composant PH-40 en G/J ; R1 sélectionné, R0 archivé. Raccord vertical amélioré ; largeur native inférieure d’un pixel. |

### Effet visuel — 7 fiches

Fiches : **C, J**. Ni la couleur ni le nom du fichier ne prouvent un porteur, des dégâts ou une durée.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="fx_me2_overload_impact_fixed"></a>`fx_me2_overload_impact_fixed` — Décharge électrique ME2 — candidat Overload | ME2 ; Impact radial | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_throw_impact_fixed"></a>`fx_me2_throw_impact_fixed` — Projection biotique ME2 — impact Throw | ME2 ; Impact compact | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_incinerate_impact_fixed"></a>`fx_me2_incinerate_impact_fixed` — Incinération ME2 — impact | ME2 ; Impact thermique | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_cryo_impact_fixed"></a>`fx_me2_cryo_impact_fixed` — Cryo Blast ME2 — impact | ME2 ; Impact cryogénique | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_singularity_active_fixed"></a>`fx_me2_singularity_active_fixed` — Singularité ME2 — état actif fixe | ME2 ; Champ biotique actif | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_shockwave_pulse_fixed"></a>`fx_me2_shockwave_pulse_fixed` — Shockwave ME2 — une impulsion au sol | ME2 ; Impulsion hémisphérique au sol | Candidat présent | Association lot 14 conservée |
| <a id="fx_me2_weapon_discharge_observed_fixed"></a>`fx_me2_weapon_discharge_observed_fixed` — Décharge d'arme ME2 — motif observé | ME2 ; Flash orienté vers la droite | Candidat présent | Association lot 14 conservée |

### Projectile candidat — 2 fiches

Fiches : **C, J**. L’image fixe et l’association proposée restent distinctes d’un projectile moteur fonctionnel.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="projectile_me2_concussive_fixed"></a>`projectile_me2_concussive_fixed` — Tir percussif ME2 | ME2 ; Projectile orienté vers la droite | Candidat présent | Association lot 14 conservée |
| <a id="projectile_me2_incendiary_fixed"></a>`projectile_me2_incendiary_fixed` — Traceur chaud ME2 — candidat munitions incendiaires | ME2 ; Traceur orienté vers la droite | Candidat présent | Association lot 14 conservée |

### Accessoire candidat — 3 fiches héritées, hors compléments lot 18

Fiches : **B, C, J** pour la grenade et l’omni-outil ; **B, F, J** pour le fauteuil de scène narrative. La grenade ou l’omni-outil n’équipe pas automatiquement tous les personnages du même opus ; le fauteuil ne reçoit aucune association d’action.

| Identifiant et sujet | Œuvre / variante | Image candidate | Raccord particulier |
|---|---|---|---|
| <a id="prop_me1_alliance_grenade_disc"></a>`prop_me1_alliance_grenade_disc` — Grenade-disque de l'Alliance | ME1 ; Disque fermé — vue du manuel Xbox 360 français | Candidat présent | Association lot 14 conservée |
| <a id="accessory_me2_omnitool_casting_fixed"></a>`accessory_me2_omnitool_casting_fixed` — Omni-outil ME2 — projection d'avant-bras | ME2 ; Projection d'avant-bras isolée | Candidat présent | Association lot 14 conservée |
| <a id="prop_me2_illusive_man_chair"></a>`prop_me2_illusive_man_chair` — Fauteuil de l’Homme Trouble | ME2 ; Fauteuil ME2 isolé — vue trois-quarts | Candidat présent | Association particulière B/F/J à [chr_me2_illusive_man](#chr_me2_illusive_man), pour briefing et présence narrative. Géométrie et alpha sous réserve ; aucune action. |

## 7. Reprise et vérification

Lors d’un prochain lot, partir du catalogue courant, conserver les identités et rechercher la fiche de conception correspondante. Un nouveau raccord doit nommer la source, l’ID ou la section, le type de relation et ce qui reste à confirmer. Un lien de costume ne vaut pas lien de kit ; une occurrence d’ID dans un avertissement ne vaut pas affectation de scène.

Mettre à jour la projection si sa source change. Les empreintes de `sourceSnapshots` identifient les versions effectivement utilisées, avec leur chemin et leur portée de révision. Les occurrences historiques conservent leurs références de ligne au commit de base ; les ajouts ultérieurs ne sont pas présentés comme déjà présents dans cet arbre. Les 188 ancres initiales, les quatre ajouts du lot 16 et les quatre ajouts du lot 18 restent alignés sur les IDs du catalogue courant.

Le [rapport historique d’association](verification-content-associations-2026-11-25.json) conserve son contrôle des 188 IDs du lot 14. La [vérification du lot 16](../lot16/verification.json), le [manifeste historique](../lot16/manifest.json) et le [classeur historique](../lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx) suivent les 192 fiches et les six PNG de cette étape. Les revues de [Port Hanshan](../lot16/qa/port-hanshan-independent-review.json) et de [l’Homme Trouble](../lot16/qa/illusive-man-independent-review.json) qualifient les candidats ; elles ne constituent ni test de gameplay ni certification de fidélité. Les [manquants historiques](../lot18/MANQUANTS_2026-11-25.md), le [classeur lot 18](../lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx), la [vérification du lot 18](../lot18/verification.json) et son [bilan](../lot18/README.md) conservent la preuve de cette étape. Les [manquants courants](../lot19/MANQUANTS_2026-11-27.md), le [classeur lot 19](../lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx), la [vérification courante](../lot19/verification.json) et le [bilan du lot 19](../lot19/README.md) portent la reprise actuelle des 196 fiches.

## Composants du marché Urdnot ajoutés au lot 18

Les quatre fiches relèvent de G/J et de la même sous-zone `stg_me2_tuchanka_urdnot`. Les deux props ne sont pas des accessoires de combat.

| Identité | Usage | Image et réserve |
|---|---|---|
| <a id="layer_me2_tuchanka_market_rear_architecture"></a>`layer_me2_tuchanka_market_rear_architecture` — Tuchanka — marché Urdnot : architecture arrière | calque_decor | [Candidat](../../../public/assets/armax/lot18/stages/tuchanka-me2-market-rear-architecture.png) ; fidélité et moteur non validés |
| <a id="layer_me2_tuchanka_market_floor"></a>`layer_me2_tuchanka_market_floor` — Tuchanka — marché Urdnot : sol | calque_decor | [Candidat](../../../public/assets/armax/lot18/stages/tuchanka-me2-market-floor.png) ; fidélité et moteur non validés |
| <a id="prop_me2_tuchanka_market_table"></a>`prop_me2_tuchanka_market_table` — Tuchanka — table du marché Urdnot | accessoire_candidat | [Candidat](../../../public/assets/armax/lot18/props/tuchanka-me2-market-table.png) ; fidélité et moteur non validés |
| <a id="prop_me2_tuchanka_market_terminal"></a>`prop_me2_tuchanka_market_terminal` — Tuchanka — console du marché Urdnot | accessoire_candidat | [Candidat](../../../public/assets/armax/lot18/props/tuchanka-me2-market-terminal.png) ; fidélité et moteur non validés |

[Annexe narrative lot18](../lot18/BIBLE_COMPLEMENTS_LOT18.md) · [Manifestes et réserves](../lot18/manifest.json) · [Suivi des manquants](../lot18/MANQUANTS_2026-11-25.md).

# Armax — équipes, personnalité, entités et activités bonus

**Extension 01 · 27 novembre 2026 · spécification de conception.** Source intégrale : [Combat Games Extension 01 v1.0](../guides/Combat_Games_Extension_01_Tag_Taunts_Bonus_v1.0.txt), sections **30–49**. Le [registre des 68 rubriques](guide-coverage-2026-11-27.json) conserve leur numérotation ; les [données de conception](extension-01-specs.json) portent les identifiants et cas d'acceptation.

Le contrat **RC-ARMAX-TEAM-0.1** complète [RC-ARMAX-0.1](common-rules.json) pour les seuls profils d'équipe. Toutes les valeurs nouvelles sont des hypothèses d'équilibrage. Aucun tag, QTE, mode bonus, animation ou lieu exploratoire n'est déclaré implémenté par cette annexe. La production artistique courante porte sur des sujets fixes ; les séquences ci-dessous sont des besoins d'animation.

<a id="g30"></a>
## 30. Portée et rattachement

Les équipes sont retenues comme extension du duel Armax, avec une tranche initiale **deux combattants, une arène neutre, un relais et une assistance**. Le moteur Three.js et le RPG ATB existants restent les systèmes hôtes ; l'annexe ne remplace ni leurs groupes de trois ni leurs sauvegardes. Les campagnes par opus gardent leurs choix, recrutements et pertes. Les rencontres entre périodes éloignées relèvent du versus de simulation et sont identifiées comme hypothétiques.

Le nom Armax s'appuie sur l'arène citée dans l'[annonce BioWare de Citadel](https://blog.bioware.com/2013/02/21/mass-effect-3-citadel-reckoning-dlc-announced/). L'annexe de collection, les duels latéraux, les équipes proposées et leurs chorégraphies sont des créations du projet ; cette source ne les décrit pas. L'extension Andromeda est un volet de simulation indépendant. Aucun transfert de données d'Héléus vers le Normandy en 2186 n'est présenté comme un fait narratif.

Les fonctions gardent leurs identités : **assistance** = intervention temporaire ; **relais** = contrôle transféré ; **super duo** = attaque pendant le combat ; **neutralisation coordonnée** = présentation après résultat ; **fin dramatique** = conclusion conditionnelle ; **entité native** = composant du kit ; **clash** = confrontation de propriétés ; **bonus** = épreuve ; **archives** = exploration. Les qualifications canon attesté, adaptation jouable, original compatible, alternatif/crossover et à confirmer s'appliquent séparément à l'apparence, au pouvoir et à la scène.

<a id="g31"></a>
## 31. Taunts et personnalité

L'action remappable `TAUNT` n'accorde ni jauge, ni bouclier, ni invulnérabilité dans le profil initial. Elle n'est acceptée qu'au sol, hors garde subie, hitstun, relève, transition ou action d'équipe. La fiche pilote propose 12 pas d'entrée, 30 de pose et 18 de retour à 60 Hz. Elle est vulnérable du début à la fin ; une touche la remplace par la réaction normale. Aucun cancel volontaire avant la phase de retour ; les 6 derniers pas acceptent une commande mémorisée, exécutée à la fin. Cette règle évite un faux geste gratuit servant de cancel.

| ID de conception | Version | Geste proposé | Garde de fidélité |
|---|---|---|---|
| E1-TAUNT-GARRUS-ME3 | Garrus ME3 | Vérifie brièvement l'alignement de son fusil, puis reprend son appui | Geste original ; conserver le côté de la visière et les cicatrices de sa version ; ne pas jouer une réparation longue |
| E1-TAUNT-TALI-ME3 | Tali ME3 | Un bref diagnostic sur l'omni-tool, puis main ramenée à l'arme | Aucun retrait de masque, aucun nouveau drone ni recharge implicite |
| E1-TAUNT-GRUNT-ME2 | Grunt ME2 | Redresse le torse et défie silencieusement l'adversaire | Force physique ; aucun halo ni déplacement de Charge biotique |
| E1-TAUNT-LEGION-ME2 | Legion ME2 | Incline la tête, ajuste les volets, revient à sa visée | Pas de sourire humain, pas de copie de l'esprit adverse |
| E1-TAUNT-NYREEN-ME3 | Nyreen, Omega | Désigne une sortie sûre avant de reprendre une garde | Protéger l'intention du personnage ; pas de cruauté ajoutée pour imiter un autre jeu |
| E1-TAUNT-RYDER-MEA | Ryder, profil fixé | Contrôle son équipement et reprend son appui | Même apparence, même profil de compétences ; SAM ne devient pas un corps de soutien |

Ces six fiches sont des **gestes originaux compatibles à produire**, avec validation lore encore ouverte. Les voix restent facultatives, textes de création distincts de répliques officielles. Une seule voix de taunt par personnage peut jouer à la fois ; une nouvelle demande durant sa temporisation vocale peut jouer le geste muet. La variante rival doit identifier la relation et son chapitre, jamais faire divulguer un événement futur. Une présentation automatique ne prend pas la main sur une commande de combat.

<a id="g32"></a>
## 32. Sélection, confirmation et désélection

Le cycle de sélection comporte huit états : **survol → aperçu → confirmation → attente confirmée → changement de costume → désélection → validation de l'équipe → départ**. Le survol révèle uniquement les informations permises par l'[extension 02](EXTENSION_02_DEBLOCAGES.md#g51). Chaque aperçu possède un identifiant de session ; quand le curseur quitte la fiche, seuls ses sons, particules, ombres et entités sont retirés. Les éléments de l'autre joueur restent actifs.

Pour Garrus, l'aperçu présente la posture et la visière correctes ; la confirmation resserre la prise sur l'arme ; l'attente conserve le regard au combat ; la désélection abaisse le fusil et recule hors du cadre. Pour Tali, la confirmation ferme l'omni-tool et reprend l'arme ; la sortie rappelle seulement les effets d'aperçu, sans faire disparaître son équipement par magie. Pour Legion, les volets et la tête assurent la réaction, avec un déplacement de sortie. **La désélection possède sa propre entrée et sa propre sortie** ; elle n'est pas une confirmation simplement inversée.

Hypothèses de présentation : confirmation complète 30 pas, attente bouclée 120 pas, sortie complète 24 pas, sortie abrégée 6 pas. Ces pas sont une durée d'affichage de menu, jamais une fenêtre de combat. Le choix logique est enregistré immédiatement ; changer de fiche invalide l'ancien aperçu avant sa fin. En mouvement réduit, une pose de confirmation et un fondu bref remplacent les déplacements. Le focus, l'intitulé et le statut d'équipe restent identiques.

La sélection montre **actif**, **réserve contrôlable** ou **soutien uniquement**. Elle ne fait pas passer un PNJ illustré en combattant jouable. L'aléatoire utilise seulement les profils admissibles dans le mode, les droits et les versions chargées ; un miroir reste réservé au versus hypothétique. Les costumes ne changent ni le kit ni les pouvoirs.

<a id="g33"></a>
## 33. Profils d'équipe retenus

| Profil de conception | Composition | Défaite | Décision |
|---|---|---|---|
| E1-PROFILE-DUEL | 1 actif | KO de l'actif | Contrat commun inchangé |
| E1-PROFILE-ASSIST | 1 actif + 1 soutien | KO de l'actif ; soutien non contrôlable | Retenu en P1, exige fiche de soutien dédiée |
| E1-PROFILE-TAG | 1 actif + 1 réserve | Deux membres KO | Retenu en P1 ; aucune assistance implicite |
| E1-PROFILE-HYBRID | 1 actif + 1 réserve utilisable en assistance | Deux membres KO | Cible P2 après validation des deux précédents |
| E1-PROFILE-STORY | Membres autorisés par le chapitre | Règle déclarée du chapitre | Adapté, pas d'ajout automatique au groupe narratif |

Chaque membre du tag possède ses PV, protection, munitions et récupérations. La réserve ne récupère pas de PV dans le premier réglage. Les protections ne se rechargent qu'en état actif selon RC-ARMAX-0.1 ; le passage en réserve ne les restaure pas. Les délais d'actions continuent sur l'horloge normale, mais restent suspendus pendant pause, hitstop et cinématique. Le membre vivant entre gratuitement après un KO ; l'absence de jauge ne peut empêcher ce relais. Après des KO simultanés, examiner tous les survivants : deux actifs KO avec réserves vivantes provoquent deux relais ; une seule équipe sans survivant perd ; si aucune des deux équipes n'a de survivant, appliquer l'égalité du contrat commun. Deux KO dans la même équipe ne créent pas une égalité contre une équipe survivante.

Au temps écoulé en tag/hybride, comparer **somme des PV restants / somme des PV initiaux des deux membres**, puis le même ratio de protection. Un membre KO compte zéro ; un dénominateur de protection nul vaut zéro. Une égalité exacte n'accorde aucun point et relance une manche. Le profil assistance compare seulement le combattant principal selon le duel. À chaque nouvelle manche, les deux membres retrouvent les valeurs initiales de leur fiche, l'ordre de départ choisi, zéro coordination, aucun effet ni objet persistant ; les recharges reviennent à l'état initial déclaré. Aucun report de vie de réserve n'est implicite entre manches.

Une seule intervention temporaire de partenaire par équipe est autorisée. Une entité native ne consomme pas une place de roster et ne donne pas une troisième barre de vie de combattant. Le même membre ne peut être actif, en assistance et en super en parallèle. Les doublons d'identité au sein d'une équipe sont refusés au départ ; le miroir entre adversaires reste configurable en simulation. Une alliance impossible dans une route devient un duo hypothétique de versus, sans modifier l'histoire.

<a id="g34"></a>
## 34. Commandes, jauges et disponibilité

Les actions `TAUNT`, `ASSIST`, `TAG`, `DUO_SUPER`, `TEAM_FINISH` et `ENTITY_ORDER` sont remappables. Elles s'ajoutent à L/M/H/S sans réinterpréter les anciennes commandes. Aucun couple appui court/maintien n'est requis au premier prototype. Les commandes rejetées affichent la cause : partenaire engagé, KO, récupération, jauge, mode ou état interdit.

Dans les profils d'équipe, la **jauge de coordination** reprend l'économie de RC-ARMAX-0.1 comme ressource commune : capacité 300, départ de manche 0, gains 8/4/3/5 et plafond 30 par combo, comptés une seule fois par événement admissible pour l'équipe. Elle **remplace** la jauge de super individuelle dans ces profils, au lieu de créditer deux barres pour le même impact. Les ressources intrinsèques de chaque kit restent séparées. Les coûts de supers individuelles (100 par défaut ; 200 pour les deux exceptions Grunt/Legion existantes) sont conservés et payés par cette jauge.

| Action | Coût proposé | Engagement et refus |
|---|---:|---|
| Assistance | 50 | Débit atomique à l'appel accepté ; pas de remboursement après interruption |
| Relais volontaire | 25 | Débit à l'acceptation, uniquement en neutral au sol |
| Relais de combo | 100 | Différé ; fenêtre de cancel explicitement enregistrée, historique du combo conservé |
| Relais après KO | 0 | Priorité de résolution, jamais bloqué par la jauge |
| Super duo | 200 | Débit à l'amorce ; animation longue seulement sur touche confirmée |
| Taunt / fin d'équipe | 0 | Aucun gain ; fin uniquement après résultat fixé |

Pas de gain passif initial. Un seul arbitre d'équipe accepte les dépenses d'un pas ; ordre proposé : résolution KO obligatoire, puis super duo, relais, assistance, taunt. L'ordre dépend des classes d'action, jamais du côté gauche/droit. Les demandes incompatibles restantes sont refusées sans coût. Une ressource pleine n'efface ni la récupération ni l'état du partenaire. Les points de départ de récupération sont explicites : fin de sortie d'assistance ou fin du relais, pas début d'animation. Aucun switch ne remet les recharges à zéro.

<a id="g35"></a>
## 35. Assistances ponctuelles

Le cycle est `disponible → engagé → arrivée → action → sortie → récupération → disponible`. Le partenaire est vulnérable en arrivée, action et sortie, avec les PV de sa réserve en profil hybride. Sa mise KO le rend indisponible sans réapparition scénaristique. Dans le profil assistance seule, une réserve de soutien dédiée est suivie par la fiche, sans l'assimiler à un combattant contrôlable.

**E1-ASSIST-GARRUS-ME3 — Tir de couverture.** Garrus entre derrière l'actif, vise et exécute un seul Tir percutant adapté du pouvoir de sa version. Le [manuel officiel ME3, page 5](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf) identifie Tir percutant, Surcharge et Mine de proximité dans ses pouvoirs. La mise en scène, les timings et le soutien Armax restent une adaptation. Hypothèse : arrivée 18 pas, préparation 18, projectile émis une fois, sortie 24, récupération 600 pas. La fiche de projectile devra préciser vitesse et portée avant l'intégration. En garde, seul le chip autorisé s'applique ; à vide, la sortie reste vulnérable. Aucun tir à travers un obstacle solide non autorisé.

Un soutien ne peut être appelé pendant hitstun ou garde subie dans le premier profil. Un éventuel secours défensif demande une fiche séparée. Si une attaque touche l'actif et le soutien, chacun reçoit son dommage autorisé ; le gain de jauge est dédupliqué par action/équipe. En hybride ou dans un profil d'histoire autorisant un relais réel, un KO de l'actif pendant l'assistance attend la résolution du pas puis transforme le survivant contrôlable en entrant selon le relais KO, sans lui faire terminer simultanément deux actions. En assistance seule, le KO de l'actif conclut la défaite ; le soutien ne devient pas contrôlable. Une transition annule les nouveaux appels ; les interventions déjà engagées passent par leur règle de sortie avant chargement.

<a id="g36"></a>
## 36. Relais réel et continuité

**E1-TAG-NEUTRAL — Relève de terrain.** L'actif annonce son retrait pendant 18 pas vulnérables. L'entrant apparaît au point de remplacement autorisé pendant 24 pas ; le routage des commandes, le HUD et la cible active passent au pas 18, atomiquement. Il n'y a qu'un actif logique. L'entrant reste en état d'arrivée jusqu'au pas 42 : ses actions de combat ne s'exécutent pas avant cette fin ; les cinq derniers pas acceptent le tampon d'entrée commun. L'entrant n'est pas invulnérable par défaut. Un impact avant transfert interrompt le retrait et conserve l'ancien actif ; après transfert, il touche l'entrant. Les sorties cinématiques ne changent pas cette règle. Une arène sans point d'entrée sûr refuse le relais volontaire avant tout débit et indique le motif.

Le relais de combo, plus coûteux, reste **différé** jusqu'aux poses, collisions et mesures. Sa conception ne réinitialise aucun rang de réduction, rebond, capture, plafond de six actions distinctes ou limite de gain. Le relais de secours est **non retenu dans le premier profil**, pour éviter d'introduire une rupture universelle sans contrepartie testée.

Les projectiles déjà émis conservent propriétaire, action d'origine et règle de cible. Un tir direct poursuit sa trajectoire ; un tir guidé ne se réoriente sur l'entrant que si sa fiche le permet. Aucun aimant automatique ne téléporte un effet vers la nouvelle cible. Les effets de durée utilisent le temps de simulation commun ; un poison ou malus en réserve n'est ni effacé ni accéléré. Une mort narrative rend le membre inéligible dans la route ; le prêt d'un personnage en simulation n'annule pas cette décision.

<a id="g37"></a>
## 37. Supers d'équipe

La super duo engage les deux membres et consomme 200 points à l'amorce. L'actif doit toucher une cible compatible ; garde, distance excessive ou interruption donnent une résolution courte. Le partenaire doit être vivant et disponible. Pendant la séquence, aucun nouvel appel, relais ou ordre d'entité n'est accepté. Les délais et le chrono restent suspendus ; les dépenses restent acquises. À la sortie, l'ancien meneur reprend le contrôle, sauf fiche explicitement différente, et les participants reviennent sur des positions autorisées.

| ID | Duo et période | Contribution réelle prévue | Qualification et limite |
|---|---|---|---|
| E1-DUO-GARRUS-SHEPARD-ME3 | Garrus + Shepard soldat ME3 | Garrus ouvre par Tir percutant ; Shepard poursuit par tir coordonné | Chorégraphie originale, noms de projet ; le soldat ne reçoit aucune biotique |
| E1-DUO-GRUNT-LEGION-ME2 | Grunt + Legion ME2, recrutés et vivants | Legion fixe une ligne de tir, Grunt exploite l'ouverture par une percussion physique | Variante de simulation ; pas de « charge biotique de Grunt » ni de piratage d'un organique |
| E1-DUO-NYREEN-ARIA-ME3 | Nyreen + Aria pendant le segment compatible d'Omega | Nyreen couvre le retrait, Aria engage sa propre action autorisée | À détailler depuis leurs kits sources ; pas de résurrection après la perte narrative de Nyreen |
| E1-DUO-RYDER-PEEBEE-MEA | Ryder + Peebee, volet Héléus | Une contribution biotique de Peebee et une action du profil effectivement équipé par Ryder | Projet à confirmer contre les fiches d'opus ; aucune greffe automatique de pouvoirs Shepard |

Seul le premier duo possède ici le découpage pilote complet : **signal du meneur → ligne de tir Garrus → ouverture confirmée → tir du soldat → réaction commune → retour**. Les autres sont des fiches de conception priorisées, pas des animations exclusives produites. Une paire non couverte utilise un relais générique ou ne propose pas de super commune ; elle n'est pas comptée comme scène exclusive. Les dégâts de la chorégraphie forment un budget d'action, réparti entre impacts, sans multiplier la jauge ni contourner le scaling.

<a id="g38"></a>
## 38. Neutralisations coordonnées et fins dramatiques

Le nom **Neutralisation coordonnée** complète la famille **Neutralisation décisive** ; les deux sont des noms originaux du projet. La fenêtre est celle du contrat commun : 120 pas après KO final, résultat fixé, zéro dégât, zéro jauge et aucune récompense exclusive liée au passage de la scène. Temps écoulé, abandon, égalité ou déconnexion ne l'autorisent pas. Un équipier KO n'apparaît pas pour compléter la chorégraphie.

Priorité déterministe : **fin dramatique spécifique admissible → neutralisation coordonnée → neutralisation individuelle → victoire normale**. Les options de présentation sobre/complète/désactivée ne changent ni vainqueur ni récompense. La scène peut être ignorée avec le même état final.

**E1-FIN-GARRUS-SHEPARD-ME3 — Périmètre sécurisé.** Pour le duo soldat ME3, contre cible humanoïde compatible en simulation : Garrus couvre la ligne de retraite ; Shepard neutralise l'arme et confirme l'objectif. Aucun écrasement d'anatomie imposé. Pour machine géante, utiliser un plan de coupure de visée suivi de victoire normale ; aucune mise à l'échelle absurde des acteurs.

**E1-DRAMATIC-GRUNT-ME2 — Après l'épreuve.** Présentation de route originale réservée à Grunt ME2, chapitre et état de Tuchanka explicitement compatibles dans sa route documentaire du lot 18. Le résultat reflète l'épreuve de la simulation, sans créer un nouveau rite officiel. Si lieu, variante, participant ou état narratif diffère, repli sur victoire normale. Les conditions sont conservées dans une fiche et une entrée de codex ; la dernière action peut être une condition seulement si elle a été effectivement enregistrée.

<a id="g39"></a>
## 39. Clashes et QTE

Le premier groupe autorisé, **E1-CLASH-MELEE**, oppose deux attaques lourdes de mêlée marquées compatibles, actives et réellement en contact. Fenêtre proposée : départs séparés de 3 pas au plus ; un clash par action et 600 pas de récupération par paire d'équipes. Les fusils à effet instantané et les rayons ordinaires ne se transforment pas spontanément en lutte de faisceaux. Une collision non éligible conserve l'échange ou l'annulation normale.

Le profil compétition utilise une séparation mécanique sans QTE, après coût normal des attaques engagées. Le spectacle propose un appui unique dans une fenêtre commune de 30 pas : un succès unique donne un avantage de reprise proposé de 12 pas, sans dégâts supplémentaires ; double succès, double échec et absence d'entrée séparent les deux acteurs sans dégâts supplémentaires. La version solo peut annoncer une assistance automatique. Le mode PvP ne permet pas une fenêtre secrètement plus large pour un joueur. Le martèlement n'est pas requis.

Ordre proposé d'un pas : recueillir les contacts, résoudre les KO et interceptions prioritaires, puis examiner un clash survivant. Un projectile tiers ou une assistance qui frappe un participant au même pas empêche le clash cinématique ; les contacts suivent leurs règles normales. Une fois le clash engagé, tous les acteurs, projectiles, pièges, récupérations et chrono sont suspendus ensemble. Un compteur logique QTE distinct continue à 60 Hz pour mesurer la fenêtre de réponse ; il n'avance aucune recharge ni le chrono du round, et la pause locale autorisée le suspend aussi. Une déconnexion suit le règlement de match, sans donner artificiellement un succès QTE. À la sortie, aucun projectile n'est recréé ni aucun coût débité deux fois. Le résultat est un événement de simulation, pas une conséquence de la durée d'une vidéo.

<a id="g40"></a>
## 40. Entités et objets placés

Les entités possèdent `ownerFighterId`, `ownerTeamId`, `actionId`, `instanceId`, position, vie éventuelle, durée et états. La propriété ne change pas lors d'un relais. Une même équipe peut avoir au plus **deux entités natives** au premier réglage, dont une au plus par propriétaire, indépendamment du soutien temporaire. La nouvelle pose à la limite est refusée avant coût ; aucune récupération gratuite par remplacement silencieux.

| Fiche | Propriétaire et version | Famille | Contrat et réserve |
|---|---|---|---|
| E1-ENTITY-LEGION-DRONE-ME2 | Legion ME2 | Drone du kit historique | Conserver le kit et les limites du complément Grunt/Legion ; pas d'accès à un troisième slot |
| E1-ENTITY-GARRUS-MINE-ME3 | Garrus ME3 | Mine de proximité | Pouvoir identifié dans le manuel ME3 ; pose en duel, temps d'armement et destruction restent adaptés |
| E1-ENTITY-RYDER-ZAP-MEA | Ryder, après condition de quête compatible | Observateur Remnant contrôlé | Le guide Prima distingue l'introduction de Poc et le pouvoir Remnant VI invoquant **Zap** ; pas de substitution automatique de Poc en combattant |

Le [guide Prima de la quête](https://primagames.com/eguides/mass-effect-andromeda-collectors-edition-eguide/secondary-ops/peebees-secret-project) étaye cette distinction et le lien avec la progression de Peebee. Il ne valide pas la traduction en duel, la durée ni les ordres Armax. Une disponibilité en menu ne remplace pas l'accomplissement narratif exigé par le chapitre.

La mine pilote propose pose 24 pas, armement 30, durée maximale 600 et une seule instance ; elle est visible, contournable et destructible selon une catégorie d'attaque documentée. Le propriétaire peut se déplacer après la pose, mais ne peut recommencer avant récupération. Le drone reçoit des ordres bornés, pas une autonomie ou un clonage universel. Les illusions, doubles corporels et résurrections ne sont pas attribués aux personnages qui n'ont aucune source pour ces capacités.

<a id="g41"></a>
## 41. Projectiles persistants et événements d'état

Le budget pilote est **quatre projectiles dangereux simultanés par équipe**, en plus des deux entités. Un effet de bouche, une traînée ou une étincelle ne consomme pas ce budget s'il n'a aucune collision. L'option graphique peut réduire ces particules, jamais supprimer la représentation d'un danger actif.

| Événement | Drone commandé | Mine armée | Projectile déjà émis |
|---|---|---|---|
| Propriétaire touché/projeté | Action engagée continue ; aucun nouvel ordre pendant son incapacité | Reste jusqu'à sa durée | Continue selon sa trajectoire |
| Propriétaire en réserve | Rappel à la fin du pas, sans récupération de coût | Reste, propriétaire inchangé | Continue ; pas de retarget implicite |
| Propriétaire KO | Résoudre les contacts du pas, puis retirer | Résoudre le pas, puis désarmer | Résoudre le pas ; retirer ceux qui n'ont pas encore impacté |
| Transition | Retirer avant chargement, garder les récupérations | Retirer sans remboursement | Retirer ; aucune attaque invisible dans la destination |
| Nouvelle manche | Nettoyer toutes les instances | Nettoyer | Nettoyer |
| Super/clash | Suspendre dans l'état enregistré | Suspendre | Suspendre |
| Finisher après résultat | Retirer du gameplay avant présentation | Désarmer | Retirer |

Ce tableau fixe le premier profil ; toute exception future doit nommer son entité. La réflexion est **non retenue par défaut** : être biotique ne permet pas de renvoyer toutes les munitions. Une action explicitement autorisée pourra changer `damageOwnerId` tout en conservant l'origine et l'historique de réflexion. Les conditions de victoire utilisent l'auteur des dégâts au moment du contact. Actif, soutien, drone, mine et relais partagent le même historique de combo et le même plafond de gains.

<a id="g42"></a>
## 42. Dix familles de bonus contextualisées

Tous les bonus ci-dessous sont des **exercices originaux de simulation**, avec leur propre état de départ. Aucun ennemi réel redoutable n'est réécrit comme fragile dans la campagne. La difficulté règle cibles et délais, pas le canon. Les chiffres sont des réglages candidats ; ils ne décrivent pas les missions originales.

| ID | Famille et exercice | Objectif pilote | Échec et transmission |
|---|---|---|---|
| E1-BONUS-01 | Destruction : carcasse d'entraînement | Détruire 4 zones d'une maquette de véhicule en 60 s ; aucune personne à bord | Score seul, suite autorisée ; munitions réinitialisées à l'entrée du combat suivant |
| E1-BONUS-02 | Horde : cibles holographiques | Survivre 90 s, 6 unités présentes au plus, apparition signalée hors contact | Fin du score, pas de décès narratif ; nouvelle tentative possible |
| E1-BONUS-03 | Précision : galerie de tir | 12 cibles mobiles ; 10 atteintes pour le rang de base | Version mêlée dédiée pour kits sans projectile, même récompense |
| E1-BONUS-04 | Défense : corridor balisé | Répondre à 8 attaques annoncées, 6 réponses correctes | Indiquer la réponse attendue et relancer l'exercice |
| E1-BONUS-05 | Mobilité : évacuation simulée | 3 balises et sortie en 60 s | Aucun saut ou dash réservé imposé aux kits qui ne le possèdent pas |
| E1-BONUS-06 | Protection : extraction | Maintenir le dispositif au-dessus de zéro pendant 60 s | Sortie avec conseil, checkpoint avant le bonus |
| E1-BONUS-07 | Interaction : rétablir le signal | Activer 3 consoles après fenêtres sûres | Piratage réservé aux kits aptes ; autre variante d'interaction préparée |
| E1-BONUS-08 | Maîtrise d'entité : ligne déportée | 4 objectifs, dont 2 atteints par l'entité autorisée | Réservé à Legion/drone ou Ryder/Zap selon volet ; jamais drone offert à un autre kit |
| E1-BONUS-09 | Coordination : couverture croisée | 1 assistance et 1 relais réussis, puis cible commune | Équipe réellement disponible ; pas de super forcée sans jauge initiale prévue |
| E1-BONUS-10 | Personnalité : défi de résistance krogan | Grunt ME2, cibles et placement plutôt qu'un nouvel acte rituel canonique | Exercice de simulation présenté comme tel ; ne remplace pas son rite de passage |

Une route place le bonus à un temps de préparation ou de détente. Un chapitre urgent propose une insertion facultative depuis les archives, sans arrêter fictivement une évacuation pour « faire des points ». Les récompenses sont des découvertes, illustrations ou défis, pas un bonus de statistiques compétitives. Un identifiant de tentative suit le résultat ; la récompense permanente se déduplique par règle et profil. Un score amélioré met à jour le record sans accorder un second contenu.

<a id="g43"></a>
## 43. Archives de simulation — lieu exploratoire

**E1-HUB-ARCHIVES — Archives de simulation Armax** est un espace original de collection, pas une reconstitution revendiquée du plan officiel de l'arène. Il prend la forme d'un parcours 2,5D compatible avec le renderer hôte. Les dossiers de l'Initiative restent dans une section de galerie séparée de la continuité ME3 ; ce voisinage de menus n'est pas une liaison physique entre galaxies.

| Zone | Rôle | Accès et connexions réciproques |
|---|---|---|
| HUB-ACCUEIL | Orientation, retour au menu, conditions | Libre ; portes vers GALERIE et ENTRAINEMENT |
| HUB-GALERIE | Portraits et miniatures des œuvres | Depuis ACCUEIL ; vers DOSSIERS après initiation ; raccourcis réciproques avec ARMURERIE et OBSERVATOIRE après leur première visite |
| HUB-ENTRAINEMENT | Lancer exercices et bonus | Depuis ACCUEIL ; accès vers ARMURERIE après une épreuve au choix |
| HUB-DOSSIERS | Routes et scènes consultables | Depuis GALERIE ; vers OBSERVATOIRE après découverte de trois dossiers |
| HUB-ARMURERIE | Costumes et présentations | Depuis ENTRAINEMENT ; boucle vers GALERIE après première visite |
| HUB-OBSERVATOIRE | Destinations et variantes de stages | Depuis DOSSIERS ; raccourci réciproque vers GALERIE déverrouillé par la première visite |

Les portes sont placées sur les limites de pièces et représentées dans les deux zones. Aucun portail ne flotte dans le plan de combat sans structure. Une carte montre la destination et la raison de fermeture. Les accès sont des autorisations de l'interface de simulation ; ils ne confèrent pas un rang Spectre canonique au joueur.

La ressource initiale est **le jalon accompli**, sans coffre aléatoire ni monnaie achetable. Une condition peut offrir plusieurs épreuves équivalentes ; aucune clé ne demande le contenu qu'elle ouvre. Les bornes réutilisent les mêmes IDs que la collection, pas une copie de l'objet. Un coffre déjà réclamé affiche son contenu et ne prélève rien. Le joueur peut quitter et revenir avec portes ouvertes et découvertes conservées. La scène de révélation intervient après sauvegarde de la récompense.

<a id="g44"></a>
## 44. Relations, périodes et compatibilités

La matrice de relation d'un duo inclut œuvre, version, période, rencontre attestée ou hypothétique, connaissance mutuelle, recrutement, survie et objectif. La relation entre deux personnages ne prouve pas une super collective officielle. Le versus de simulation peut autoriser une association non canonique avec mention claire ; une route doit satisfaire les conditions de son chapitre.

Garrus et Shepard ME3 utilisent leurs versions ME3 ; Grunt et Legion restent dans le volet ME2 ; Aria et Nyreen sont limitées au contexte d'Omega où les deux sont présentes ; Ryder et Peebee restent dans Héléus. Les pertes de Virmire et autres branches ne sont pas effacées par le roster. Un costume Collector ne donne pas à Shepard le statut biologique ou les pouvoirs d'un Récolteur ; une armure Cerberus ne prouve pas une fidélité narrative permanente à Cerberus.

Le tableau des quatre duos de la section 37 définit quatre fiches, pas toutes les paires du roster. Le volume futur se calcule sur les seuls combattants admissibles : N × (N − 1) / 2 paires sans ordre ; N × (N − 1) si le meneur change la scène. Costumes, périodes et cibles peuvent ajouter des variantes, qui restent décomptées séparément.

<a id="g45"></a>
## 45. Production des assets et séquences

Chaque fiche de taunt, sélection, assistance, relais, duo, entité, bonus et porte liste ses poses d'entrée, pose lisible, sortie, points d'émission, VFX, SFX, voix et variante réduite. Les sources autonomes gardent **un sujet par image**. Une illustration de duo peut contenir les deux acteurs mais n'est pas un sprite de combat interchangeable. Les versions assises ou portraits narratifs ne remplissent pas les tâches de corps entier en combat.

Les anchors requis sont pieds, main/arme, regard et émission de pouvoir, selon la technique. Le côté de la visière de Garrus, l'anatomie turienne/quarienne, les bras de Legion et les équipements de l'opus sont vérifiés avant miroir. Un flip horizontal n'est pas une validation des asymétries. La scène duo exige une mesure des positions des deux acteurs et de la cible à l'échelle d'affichage, puis une vérification en jeu.

Le suivi distingue **fiche documentée**, **pose fixe produite**, **séquence animée**, **collision intégrée**, **parcours testé**. Cette annexe crée les premières unités, pas les quatre suivantes. Aucun compteur artistique n'est augmenté par un nom d'animation dans un JSON. Les fichiers du lot courant restent la source des images effectivement disponibles.

<a id="g46"></a>
## 46. Interface, entraînement, accessibilité et réseau

Le HUD montre actif, PV/protection de réserve, coordination, récupération et état du partenaire, avec texte et forme en plus de la couleur. La liste des coups précise entité requise, membre indisponible ou fenêtre de relais. Le roster annonce une super commune disponible sans révéler une fin dramatique secrète. Le menu d'entraînement peut figer ressource, placement et état de réserve, puis rejouer une même situation.

Neuf exercices ciblent appel, punition de soutien, relais sûr, relais de combo lorsqu'il existe, jauge, super duo, clash, ordre d'entité et activation de mine. Les options de présentation gardent les annonces utiles. Les commandes sont distinctes et remappables ; une alternative au martèlement est prévue ; le texte peut grandir sans sortir du panneau. La pile de menus conserve un focus explicite sur le contrôle qui a ouvert une fiche.

Le réseau et les replays restent différés dans le périmètre courant. Le format de conception prévoit néanmoins version des règles, commandes, participants, propriété des entités, graine éventuelle et événements de conclusion. Une correction future doit restaurer l'état sans double coût, doublon d'entité, récompense répétée ni voix résiduelle. Aucun rollback opérationnel n'est revendiqué. Les aides de QTE qui modifient une fenêtre doivent être des règles communes au match ; les aides purement visuelles peuvent rester locales.

<a id="g47"></a>
## 47. Validation et ordre d'intégration

Les **18 scénarios E1-TEST-01 à E1-TEST-18** sont conservés dans [extension-01-specs.json](extension-01-specs.json), avec leur attendu Mass Effect et le statut `a_tester`. Ils couvrent navigation rapide, taunt interrompu, demandes simultanées, dépenses concurrentes, KO du soutien, super pendant sortie, amorce bloquée, fin incompatible, clash avec tiers, réponses QTE, propriétaire en réserve/KO, transition, attribution de projectile, boucles, horde, résultat bonus, déblocage/reprise et scène abrégée. Leur présence documentaire n'est pas un résultat d'exécution.

Ordre retenu : contrat d'équipe et propriété → cycle de sélection d'un personnage → assistance et relais isolés → kit à entité → collisions croisées → super et conclusion → clash → bonus et première boucle des archives → extension aux autres duos. L'entraînement et la sauvegarde doivent accompagner la première mécanique jouable, et non arriver après le remplissage du roster.

<a id="g48"></a>
## 48. Dix fiches complémentaires remplies et reliées

Le préfixe **E1** empêche toute collision avec les fiches A–J du guide général. Les exemples complets héritent explicitement des contrats ci-dessus ; chaque valeur non arrêtée reste un blocage d'intégration nommé.

| Fiche | Exemple et rattachement | Données de production à conserver |
|---|---|---|
| E1-A — Taunt | E1-TAUNT-GARRUS-ME3, section 31 | Geste, 12/30/18 pas, vulnérabilité, pas de gain, voix originale facultative, visière/cicatrices à vérifier |
| E1-B — Sélection | E1-SELECT-GARRUS-ME3, section 32 | Huit états, sortie propre et abrégée, propriété de l'aperçu, pose réduite, costumes et deux curseurs |
| E1-C — Équipe | E1-PROFILE-HYBRID, sections 33–34 | Deux membres, PV propres, KO complet, jauge partagée remplaçant l'individuelle, exclusivité d'engagement |
| E1-D — Assistance/relais | E1-ASSIST-GARRUS-ME3 et E1-TAG-NEUTRAL | Coûts, arrivée/action/sortie, transfert atomique, dégâts de réserve, récupération et transition |
| E1-E — Scène collective | E1-DUO-GARRUS-SHEPARD-ME3 et E1-FIN-GARRUS-SHEPARD-ME3 | Meneur/version, amorce, contributions, budget, cibles, replis, scène abrégée et résultat |
| E1-F — Clash | E1-CLASH-MELEE, section 39 | Groupe, contact, fenêtre, cadence, tiers, QTE commun, résultat neutre et mode compétition |
| E1-G — Entité | E1-ENTITY-GARRUS-MINE-ME3, sections 40–41 | Propriétaire stable, armement, durée, limite, contre-jeu, réserve/KO, aucune réflexion implicite |
| E1-H — Bonus | E1-BONUS-02, section 42 | 90 s, six hologrammes maximum, signaux, limites de foule, score, échec facultatif et record unique |
| E1-I — Lieu | E1-HUB-ARCHIVES, section 43 | Six zones, portes réciproques, progression sans cycle, même catalogue, reprise et confort |
| E1-J — Condition | E1-REWARD-ARCHIVE-FIRST, règle E2-RULE-ARCHIVE-FIRST dans l'extension 02 | Une initiation ET borne consultée ; attribution une fois au profil Armax ; état secret respecté |

Les assets de ces séquences, leurs collisions, sons et contrôles de gameplay restent à produire ou à vérifier. Les exemples ne remplacent pas les kits existants et ne créent pas de nouveaux personnages dans le catalogue artistique.

<a id="g49"></a>
## 49. Reprise, sources et limites

À chaque lot, relire la [matrice vérifiée](guide-coverage-2026-11-27.json), le catalogue courant et les restrictions de période avant toute génération. Associer chaque tâche au numéro source, à son ID de conception et à l'ID de contenu déjà existant. Ne pas compter une nouvelle révision d'image comme un nouveau personnage. Les refus et réserves antérieurs restent applicables.

Sources de cette passe : les trois [guides utilisateurs conservés](../guides/README.md), les [règles communes historiques](common-rules.json), les [fiches existantes](FICHES_ET_LIAISONS.md), les [campagnes](CAMPAGNES_ET_SCENES.md) et [compléments lot 18](../lot18/BIBLE_COMPLEMENTS_LOT18.md). Les textes indexés des trois références externes consultés par recherche et ouverture le 27 novembre 2026 servent seulement aux faits précisément indiqués (la disponibilité HTTP directe des URLs historiques n’est pas certifiée) : existence de l'arène Citadel, pouvoirs affichés de Garrus, distinction Poc/Remnant VI/Zap. Les nouvelles scènes, états, coûts, accès et activités sont des décisions de conception, non des éléments officiels prétendus.

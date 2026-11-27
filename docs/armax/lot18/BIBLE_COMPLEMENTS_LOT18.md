# Armax — compléments de campagnes et de movesets, lot 18

**Révision documentaire : 25 novembre 2026, Europe/Paris. Base inspectée : `1e3cea80b1a6ec81d7ca6df8ad70d96988973f10`, PR #11.**

Cette annexe complète quatre lacunes signalées dans la [bible des campagnes](../bible/CAMPAGNES_ET_SCENES.md) : les parcours Grunt/Legion encore courts et les raccords de Morinth/Tela Vasir à leurs rivales de la bonne période. Elle fournit **4 routes, 20 rencontres, 12 scènes référencées, 32 briefs de plans et 8 variantes d’ending**. Les six routes pilotes antérieures, leurs dialogues et leurs 36 briefs restent intacts.

Le [JSON compagnon](narrative-complements.json) conserve les identifiants, références, conditions et plans séparés. Il s’agit de conception : aucune route n’est rendue jouable par ces documents, aucun ancien asset n’est promu et aucune image n’est produite par la rédaction. Un fichier d’illustration livré séparément pourra être associé à son `artId` après contrôle de sa variante et de sa composition.

## 1. Raccords et décisions qui lèvent les ambiguïtés

| Point | Décision de continuation | Source du projet |
|---|---|---|
| Nom commun des finishers | **Neutralisation décisive**, nom original du projet. « Brèche décisive » reste la super de Grunt ; ce n’est pas le nom de toute la famille. | [Contrat RC-ARMAX-0.1](../bible/common-rules.json) |
| Grunt et Legion | `ME2-CHR-GRUNT` et `ME2-CHR-LEGION` restent des identités du catalogue d’univers, sans prétendre être des kitIds Versus exécutables. | [Associations du contenu](../bible/ASSOCIATIONS_CONTENU.md), [complément historique](../../combat-2d/CONTINUATION_2026-11-19.md) |
| Rival de Tela | `ME2-CHR-LIARA`, version du Repaire du Courtier, documentée dans les acteurs d’univers. Son `runtimeBinding` Armax reste nul. | [Acteurs](../../../src/universe-actors.js), fiche `armax-tela-vasir-me2` du [lot 04](../lot04/fighters.json) |
| Rival de Morinth | `ME2-CHR-SAMARA`, personnalité et tenue séparées de Morinth civile. Son `runtimeBinding` Armax reste nul. | Mêmes sources ; fiche `armax-morinth-me2` |
| Manquants graphiques | Une rivalité documentée ne ferme pas le corps manquant de Legion. Les exclusions de génération restent actives. | [Plan lot 17](../lot17/production-plan.json) |
| Localisation des récits | Une terrasse Azure n’est pas la propriété de Hock ; le camp Urdnot n’est pas l’arène du Rite ; le hangar ME3 n’est pas la soute ME2. | Fiches de plans ci-dessous, sources S4/S5 |

Les scènes sont **originales à la simulation Armax**. Leurs enjeux peuvent refléter les personnages, mais leurs rencontres, objectifs secondaires, dialogues ajoutés et fins ne sont pas des événements officiels. Tous les modèles utilisés dans ces quatre routes sont identifiés ME2 ; aucune version ME3/Andromeda ne les remplace implicitement.

## 2. Capacités attestées et adaptation du moveset

L’index EA offre des références de costume ; il n’atteste pas des capacités de combat [S1]. Le guide de gameplay Prima permet ici de recouper les familles de capacités [S2–S4]. Les textes des jeux n’ont pas été relancés pendant cette passe : les timings, dégâts, commandes, annulations et limites de cible demeurent des choix du projet.

| Profil | Socle recoupé | Application au kit existant | Limite explicite |
|---|---|---|---|
| Grunt ME2 | Tir percussif, munitions incendiaires, Fortification ; fusils d’assaut et à pompe [S2]. | Conserver Claymore, tir percussif, protection limitée et percée corporelle. | La percée reste physique ; pas de Charge biotique. Le traceur chaud du lot 14 ne devient pas une preuve exacte de ses munitions. |
| Legion ME2 | Piratage, drone de combat, renfort de bouclier geth ; fusils d’assaut et de précision [S2]. | Intrusion limitée aux soutiens exposés déclarés piratables, drone destructible, angle de tir annoncé. | Pas de contrôle d’un joueur synthétique, d’omniscience ou de preuve de couleur du drone. |
| Tela Vasir ME2 | Déplacement biotique rapide, Shockwave, protection et arme lors du combat d’Azure [S4]. | `Charge de Vasir` et `Onde de rupture` gardent leurs IDs ; `Tir de repli` garde son rôle. | La neutralisation de projectile de l’Onde est une règle 2D, pas un pouvoir canonique établi. Aucune Nova/Singularité supplémentaire. |
| Morinth ME2 | Pull, Throw et Dominate ; Samara est une identité distincte [S3]. | Les trois spéciaux existants et la marque Emprise restent des traductions abstraites de duel. | Emprise n’inverse pas les commandes. Sur synthétique, son marqueur est une donnée de simulation. Convergence ne devient pas Singularité ; pas de Reave de Samara ajouté. |

### Annulations normalisées proposées

Les alias historiques `T` deviennent `S` selon le contrat commun. Les anciennes chaînes comportant directement `M > H` ne sont plus présentées comme autorisées. Pour les compléments Grunt/Legion, les **emplacements de conversion** proposés ci-dessous lèvent l’ambiguïté du document historique ; ils ne modifient pas encore `common-rules.json` ou un moteur.

| Profil | Conversion 1 / conversion 2 | Confirmation courte à éprouver | Conversion lourde à éprouver |
|---|---|---|---|
| Grunt | Tir percussif `236M` / Percée `214M` | `5L > 5M xx 236M` | `5H xx 214M xx 236236H`, 200 de jauge |
| Legion | Rafale `236L` / Précision `236H` | `5L > 5M xx 236L` | `5H xx 236H xx 236236H`, 200 de jauge |
| Tela Vasir | Spéciaux 1/2 du lot 04 inchangés | `2L > 5M xx 236S` | `5H xx 214S xx 236236H`, 100 de jauge |
| Morinth | Spéciaux 1/2 du lot 04 inchangés | `2L > 5M xx 236S` | `5H xx 214S xx 236236H`, 100 de jauge |

Ce sont des **séquences d’essai**, pas des combos certifiés. Confirmer en moteur : portée après recul, continuité de hitstun, premier contact, état de ressource, cible compatible, six actions offensives distinctes maximum et budget unique d’une rafale multi-impact. Une charge gardée ne reçoit pas le bonus réservé à la touche. L’ordre de drone ne donne pas une nouvelle annulation gratuite ; son ancienne chaîne vers moyen/super reste à réévaluer séparément.

## 3. Contrat narratif commun des quatre routes

Ordre proposé : intro → c01 → c02 → c03 → scène du rival → c04 → annonce de l’objectif final → c05 → ending A/B → résultat consultable. Chaque victoire est enregistrée avant la transition. Une défaite conduit à Réessayer / Reprendre le checkpoint / Quitter ; elle ne saute pas vers un ending victorieux.

Les deux fins dépendent d’un **objectif secondaire annoncé avant c05**, jamais du choix de regarder le finisher. La victoire du duel et l’objectif de campagne sont deux champs séparés. Si les conditions de l’objectif secondaire n’ont pas été implémentées, afficher « indisponible » et conserver la route comme non jouable ; ne pas attribuer arbitrairement la fin A.

Récompenser le parcours une seule fois par `routeId + actorVariantRef + contentVersion`. L’ending, sa consultation en galerie et le passage d’une scène n’exécutent pas de second versement. Les objectifs peuvent influer sur le récit, pas sur les statistiques du tournoi. Les valeurs des balises, comportements IA et conditions temporelles restent des dépendances à spécifier dans les fiches de rencontre.

Dans le JSON, chaque référence porte son espace d’identifiants et sa source. `runtimeBinding=null` empêche de confondre une entrée documentaire avec un combattant chargeable. Les scènes déjà écrites de Morinth et Tela conservent leurs IDs et dialogues. Les nouvelles scènes de Grunt/Legion reprennent les intentions et phrases existantes du complément du 19 novembre ; aucune réplique officielle n’est reproduite.

## 4. Grunt — Le passage appartient au groupe

**Route : `route-armax-grunt-me2`. Acteur : `ME2-CHR-GRUNT` ; rival : `ME2-CHR-LEGION`.**

Passer de la seule percée à une victoire qui préserve le couloir nécessaire aux autres. La cuve constitue un rappel visuel de son origine ; le récit de cet exercice est nouveau.

| Rencontre | Profil / sous-zone | Objectif | Conséquence |
|---|---|---|---|
| c01 — progression | `chr_me2_loki_mech` ; Couloir Armax original à façade industrielle ME2 | Reconnaître la récupération adverse avant le tir de Claymore. | Le premier verrou se lève ; une carte annonce le couloir à préserver. |
| c02 — progression | `chr_me2_fenris_mech` ; Même couloir, secteur de sas | Répondre à un gabarit bas sans employer une prise humanoïde. | Une voie de contournement s’ouvre. |
| c03 — progression | `chr_me2_collector_drone` ; Aire de tir simulée, géographie originale | Choisir sa fenêtre de recharge sous une pression à distance. | Le rapport signale qu’une avancée trop directe a laissé un flanc exposé. |
| c04 — rival | `ME2-CHR-LEGION` ; Aire de calibration commune Armax | Duel rival : fermer la distance en lisant drone et tir préparé. | Le vainqueur est enregistré ; les deux balises du test final sont expliquées. |
| c05 — finale | `chr_me2_scion` ; Couloir final original, deux balises hors ligne de combat | Vaincre le profil lourd ; objectif secondaire de protection affiché séparément. | Résultat du duel puis branche a/b, sans toucher au rite de Tuchanka. |

**Condition d’ending :** Après victoire finale, objectif secondaire accompli si les deux balises de passage restent actives. Balises, seuils et ennemis qui les ciblent doivent être annoncés avant c05.

| Issue | Condition après victoire | Conséquence |
|---|---|---|
| A — Avancer ensemble | `finalVictory && optionalObjectiveMet` | L’espace gagné reste praticable ; Grunt quitte le débriefing en regardant la sortie commune. |
| B — Recommencer plus juste | `finalVictory && !optionalObjectiveMet` | Le duel est gagné, le couloir a été perdu ; il conserve l’échec de protection comme nouvel objectif. |

### Plans d’illustration

Les plans sont des besoins séparés, chacun en 16:9, sans sous-titre ou UI peints. Les plans de rival à deux personnages ne sont pas des sprites individuels.

| artId | Cadrage / action | Verrou de continuité |
|---|---|---|
| `art-lot18-grunt-me2-intro-p01` | Large 3/4 — Grunt standard ME2 près de sa cuve vide dans la soute cargo du Normandy SR-2, main sur le bord, regard vers l’issue. | Cuve et soute exactes à référencer ; aucun Okeer vivant ni nouveau recrutement. |
| `art-lot18-grunt-me2-intro-p02` | Plan moyen latéral — Son regard quitte la cuve pour la sortie ; l’interface de l’exercice apparaît séparément au montage. | Même costume, même usure, même éclairage ; ne pas remplacer la soute par le hangar ME3. |
| `art-lot18-grunt-me2-rival-p01` | Large sur les deux axes — Grunt ferme son angle d’approche tandis que Legion protège sa ligne de tir. | Simulation originale ; Legion reste une dépendance visuelle exclue des nouveaux essais de génération. |
| `art-lot18-grunt-me2-rival-p02` | Plan moyen Grunt — Grunt détourne un instant son attention vers l’emplacement du drone, sans charger. | La référence du drone reste ouverte ; ne pas fixer une nouvelle géométrie inventée. |
| `art-lot18-grunt-me2-ending-a-p01` | Large camp Urdnot — Grunt vu de dos/3/4 dans le camp Urdnot ME2, arme abaissée, tête tournée vers la sortie commune. | Même tenue ; pas de cérémonie, Kalros, personnage ajouté ou arène du Rite substituée au camp. |
| `art-lot18-grunt-me2-ending-a-p02` | Plan rapproché mains/visage — Il relâche sa prise puis se remet en marche ; le bilan de protection reste dans l’UI. | Fin originale de simulation ; aucun grade ou clan attribué par cette image. |
| `art-lot18-grunt-me2-ending-b-p01` | Large aire de débriefing — Grunt reste face au schéma du couloir perdu, arme baissée ; sortie visible derrière lui. | Un résultat d’exercice, aucune destruction de Tuchanka. |
| `art-lot18-grunt-me2-ending-b-p02` | Plan moyen — Il remet son arme en position de repos et accepte la nouvelle tentative. | Reprendre l’intention de l’ending historique ; pas de recharge gratuite par la pose. |

## 5. Legion — La solution manquante

**Route : `route-armax-legion-me2`. Acteur : `ME2-CHR-LEGION` ; rival : `ME2-CHR-GRUNT`.**

Une trajectoire optimale ne suffit pas si elle ignore les objectifs protégés. Le débriefing conserve plusieurs solutions au lieu d’imposer un consensus narratif nouveau.

| Rencontre | Profil / sous-zone | Objectif | Conséquence |
|---|---|---|---|
| c01 — progression | `chr_me2_loki_mech` ; Aire synthétique Armax originale | Distinguer combattant principal et soutien explicitement piratable. | Le test valide l’identification de cible, sans étendre le piratage aux joueurs. |
| c02 — progression | `chr_me2_fenris_mech` ; Sas technique du même exercice | Défendre une approche basse sans attendre la fin du déploiement. | Le rapport annonce que le soutien peut être interrompu. |
| c03 — progression | `chr_me2_collector_drone` ; Aire de tir Armax originale | Répondre par arme et placement ; l’intrusion n’est pas une réponse universelle. | Le rival propose une approche physique différente. |
| c04 — rival | `ME2-CHR-GRUNT` ; Aire de calibration commune Armax | Duel rival : conserver la distance tout en défendant le drone. | Le relevé précédent ne prédit plus à lui seul l’épreuve finale. |
| c05 — finale | `chr_me2_scion` ; Plateforme d’exercice avec relais d’observation | Vaincre le profil lourd et tenter de garder le relais actif. | Rappel du drone, résultat, branche a/b ; aucune réécriture des hérétiques. |

**Condition d’ending :** Objectif secondaire accompli si le relais d’observation survit au combat final ; il est affiché avant engagement et ne doit jamais imposer un piratage de cible non compatible.

| Issue | Condition après victoire | Conséquence |
|---|---|---|
| A — Plusieurs solutions | `finalVictory && optionalObjectiveMet` | Le journal conserve les trajectoires de tir et de protection. |
| B — Mesure à compléter | `finalVictory && !optionalObjectiveMet` | Le duel est gagné ; la trajectoire qui négligeait le relais est conservée comme contre-exemple. |

### Plans d’illustration

Les plans sont des besoins séparés, chacun en 16:9, sans sous-titre ou UI peints. Les plans de rival à deux personnages ne sont pas des sprites individuels.

| artId | Cadrage / action | Verrou de continuité |
|---|---|---|
| `art-lot18-legion-me2-intro-p01` | Plan moyen plateforme — Legion examine deux trajectoires sur un terminal de simulation. | Plan à produire uniquement à partir d’originaux autorisés récupérés ; corps ME2 et asymétries conservés. |
| `art-lot18-legion-me2-intro-p02` | Insert optique/terminal — L’optique se tourne vers une zone que la première trajectoire ne couvrait pas. | Données UI séparées ; pas d’accès nouveau aux archives geth. |
| `art-lot18-legion-me2-rival-p01` | Large opposition de distances — Grunt se place à l’entrée du couloir, Legion reste à son autre extrémité. | Rivalité du simulateur ; aucune hostilité canonique annoncée. |
| `art-lot18-legion-me2-rival-p02` | Plan moyen optique/arme — Legion modifie la visée avant l’avancée de Grunt. | Angle fixé avant départ ; pas de visée courbe omnisciente. |
| `art-lot18-legion-me2-ending-a-p01` | Large débriefing — Le relais reste allumé ; Legion rappelle le drone et s’éloigne. | Aucun drone exact validé par le brief. |
| `art-lot18-legion-me2-ending-a-p02` | Insert terminal — Plusieurs tracés restent ouverts dans le journal d’exercice. | Interface originale, pas copie des données de la station hérétique. |
| `art-lot18-legion-me2-ending-b-p01` | Large débriefing — Relais éteint, silhouette immobile devant le point resté découvert. | Le KO ne devient pas un échec fictif du duel. |
| `art-lot18-legion-me2-ending-b-p02` | Insert terminal — Le trajet gagnant est conservé mais marqué comme incomplet. | Aucune option Détruire/Réécrire de la campagne ME2 modifiée. |

## 6. Tela Vasir — La valeur du dossier

**Route : `route-armax-tela-vasir-me2`. Acteur : `armax-tela-vasir-me2` ; rival : `ME2-CHR-LIARA`.**

Une extraction d’archives simulées confronte sa recherche du résultat aux accès qu’elle sacrifie. Liara défend le terminal ; cet exercice ne réécrit pas leur confrontation du DLC.

| Rencontre | Profil / sous-zone | Objectif | Conséquence |
|---|---|---|---|
| c01 — progression | `chr_me2_loki_mech` ; Terrasse d’exercice inspirée du secteur Azure ; géométrie originale pour c01-c03 | Mesurer la distance avant une Charge de Vasir. | Accès au palier suivant. |
| c02 — progression | `chr_me2_fenris_mech` ; Palier d’exercice adjacent, sans traversée cinématique supposée | Punir une approche basse en gardant une issue de repli. | La carte signale un coffre à préserver. |
| c03 — progression | `chr_me2_ymir_mech` ; Poste de contrôle de simulation | Aborder une protection lourde ; ne pas supposer une prise humanoïde. | La force brute est insuffisante pour atteindre l’archive intacte. |
| c04 — rival | `ME2-CHR-LIARA` ; Terrasse précise hôtel Azure, reproduction à référencer | Duel rival : Liara bloque le terminal ; les commandes 2D sont des adaptations. | Conserver dialogue du lot04, puis annoncer la vérification finale. |
| c05 — finale | `armax-shadow-broker-me2` ; Salle d’archive Armax originale, sans prétendre être le vaisseau d’Hagalaz | Boss de simulation : neutraliser le verrou lourd et préserver le coffre. | Épreuve volontairement alternative opposant deux anciens alliés de contexte ; branche a/b. |

**Condition d’ending :** Objectif secondaire accompli si le coffre de données reste lisible pendant c05. Les données sont exclusivement celles du simulateur et leur intégrité ne verse pas de récompense supplémentaire.

| Issue | Condition après victoire | Conséquence |
|---|---|---|
| A — Archive intacte | `finalVictory && optionalObjectiveMet` | Les données d’exercice sont isolées et rendues au débriefing. |
| B — Dossier incomplet | `finalVictory && !optionalObjectiveMet` | Tela rejoint l’issue avec un résultat de duel et une archive devenue inutilisable. |

### Plans d’illustration

Les plans sont des besoins séparés, chacun en 16:9, sans sous-titre ou UI peints. Les plans de rival à deux personnages ne sont pas des sprites individuels.

| artId | Cadrage / action | Verrou de continuité |
|---|---|---|
| `art-lot18-tela-vasir-me2-intro-p01` | Large terrasse Azure — Tela termine une communication, près du balcon courbe avec jardinières ; regard vers l’accès intérieur. | Tenue Spectre ME2, marquages magenta ; pas de blessure, otage ou personnage ajouté. |
| `art-lot18-tela-vasir-me2-intro-p02` | Plan moyen 3/4 — Sa main quitte la communication tandis que l’autre protège son flanc. | Même sous-zone, lumière et costume ; le terminal reste un calque séparé. |
| `art-lot18-tela-vasir-me2-rival-p01` | Large accès au terminal — Liara version DLC ME2 se tient devant l’accès ; Tela conserve une voie de retrait visible. | Ne pas utiliser costume Liara ME3 AAP1 ; scène originale du simulateur. |
| `art-lot18-tela-vasir-me2-rival-p02` | Plans opposés sans changement d’axe — Tela cherche une entrée latérale ; Liara suit ce regard. | Même terminal et même hauteur de garde-corps entre les plans. |
| `art-lot18-tela-vasir-me2-ending-a-p01` | Plan moyen archive Armax — Tela pose le module de données de simulation sur le support de débriefing. | Aucun secret, dossier ou lieu canonique nouveau n’est révélé. |
| `art-lot18-tela-vasir-me2-ending-a-p02` | Large sortie — Elle quitte l’archive, laissant le module dans le champ. | Le module est le même objet que celui annoncé avant c05. |
| `art-lot18-tela-vasir-me2-ending-b-p01` | Plan moyen archive Armax — Le module est présent mais son état incomplet apparaît dans l’UI ; Tela le regarde sans triompher. | Aucun texte incrusté dans l’image. |
| `art-lot18-tela-vasir-me2-ending-b-p02` | Large sortie — Elle se détourne de la donnée inutilisable, en conservant son résultat du duel. | Ne pas ressusciter Tela après un événement de campagne. |

## 7. Morinth — Une issue reste ouverte

**Route : `route-armax-morinth-me2`. Acteur : `armax-morinth-me2` ; rival : `ME2-CHR-SAMARA`.**

Morinth cherche une sortie dans un dispositif de surveillance simulé. Samara est son opposition personnelle ; le final révèle si gagner le duel suffisait à effacer la trace laissée dans l’exercice.

| Rencontre | Profil / sous-zone | Objectif | Conséquence |
|---|---|---|---|
| c01 — progression | `chr_me2_loki_mech` ; Salle d’exercice originale derrière un habillage Omega | Lire la garde adverse et confirmer le trait biotique. | Le dispositif annonce qu’une porte sera surveillée. |
| c02 — progression | `chr_me2_fenris_mech` ; Couloir de la même simulation | Maintenir un espace de réponse contre une cible basse. | La trace de déplacement est montrée au joueur. |
| c03 — progression | `chr_me2_collector_drone` ; Passerelle virtuelle ; adversaire emprunté au profil ME2 | Convertir une ouverture sans dépendre de la marque d’Emprise. | Samara rejoint la porte finale de l’exercice. |
| c04 — rival | `ME2-CHR-SAMARA` ; Passerelle d’Omega créée pour le simulateur | Duel rival à identité révélée ; aucune exécution ou substitution réelle de Samara. | Le verrou matériel reste actif après le duel. |
| c05 — finale | `chr_me2_ymir_mech` ; Sortie virtuelle d’Omega, module de suivi visible | Vaincre le verrou lourd ; possibilité de neutraliser le suivi dans le même espace. | La porte se ferme ; branche a/b selon le suivi, sans recruter Morinth. |

**Condition d’ending :** Objectif secondaire accompli si le dispositif de suivi annoncé avant c05 est neutralisé avant la victoire. Il s’agit d’un module d’arène vulnérable, pas d’une domination mentale des machines.

| Issue | Condition après victoire | Conséquence |
|---|---|---|
| A — Trace interrompue | `finalVictory && optionalObjectiveMet` | La sortie virtuelle se ferme et le suivi de l’exercice s’arrête. |
| B — Poursuite ouverte | `finalVictory && !optionalObjectiveMet` | Elle franchit la sortie mais l’UI conserve une trace de suivi ; aucune victime ou fuite canonique ajoutée. |

### Plans d’illustration

Les plans sont des besoins séparés, chacun en 16:9, sans sous-titre ou UI peints. Les plans de rival à deux personnages ne sont pas des sprites individuels.

| artId | Cadrage / action | Verrou de continuité |
|---|---|---|
| `art-lot18-morinth-me2-intro-p01` | Large couloir Omega original — Morinth en tenue civile ME2 observe l’issue et le champ de surveillance. | Pas d’armure de Samara, pas de victime ou séduction ; décor explicitement original compatible. |
| `art-lot18-morinth-me2-intro-p02` | Plan moyen de profil — Elle ouvre les paumes et fixe sa distance d’engagement. | Marquages propres à Morinth et tenue sombre de la référence lot04. |
| `art-lot18-morinth-me2-rival-p01` | Large porte et deux silhouettes — Samara bloque la passerelle, Morinth reste côté sortie. | Samara ME2 et Morinth civile distinctes ; ne pas fusionner visages et costumes. |
| `art-lot18-morinth-me2-rival-p02` | Plans rapprochés sur axe conservé — Le regard de Morinth passe de Samara à la porte, puis revient vers elle. | Dialogue lot04, aucun lien mental représenté comme fait nouveau. |
| `art-lot18-morinth-me2-ending-a-p01` | Large seuil — Morinth franchit seule la porte virtuelle ; voyant de suivi inactif séparé. | Aucun décès, échange d’identité ou recrutement canonique. |
| `art-lot18-morinth-me2-ending-a-p02` | Plan serré profil — La porte se ferme sur son profil comme dans l’ending existant. | Profil et marques identiques à l’intro. |
| `art-lot18-morinth-me2-ending-b-p01` | Large seuil — Même passage de porte ; le module reste allumé en arrière-plan. | La différence porte sur le suivi simulé, pas sur une blessure ajoutée. |
| `art-lot18-morinth-me2-ending-b-p02` | Plan serré profil — Elle regarde une dernière fois le module avant la fermeture. | Épilogue alternatif présenté comme tel dans la galerie. |

## 8. Neutralisations décisives : signature, cible et raccord

Les noms sont des créations du projet, compatibles avec les thèmes du personnage. Le nom d’une technique ne constitue pas une citation du lore. **Dossier clos** et **Volonté coupée** sont conservés du lot 04 ; les noms Grunt/Legion précisent les séquences déjà décrites sans les confondre avec leurs supers.

| Profil / nom | Découpage proposé | Cible et réserve |
|---|---|---|
| ME2-CHR-GRUNT — **Dernier passage** | Le coup de crosse/percussion ferme la distance ; arme cadrée puis coupe vers la ligne de sortie. Tir hors champ et extinction du profil de simulation. Durée de conception : 180 pas à 60 Hz. | Humanoïde dont les contacts ont été définis ; sinon extinction sobre de la projection. Dépendance : poses et cadrage arme à produire. |
| ME2-CHR-LEGION — **Trajectoire résolue** | Optique, ligne de visée et arme sur trois accents ; le gel de la cible appartient à la présentation après résultat, pas à une nouvelle capacité de Stasis. Durée de conception : 180 pas à 60 Hz. | Cible prévue par la fiche ; pas de piratage du joueur ni de trophée sur boss géant. Dépendance : corps existant à récupérer et référence du fusil. |
| armax-tela-vasir-me2 — **Dossier clos** | La barrière encadre un module Armax, puis Tela récupère le témoin de résultat. Aucun secret canonique ni fichier de la campagne n’est ouvert. Durée de conception : 165 pas à 60 Hz. | Module de simulation commun, sans contact imposé à l’anatomie du boss. Dépendance : module, main et barrière cohérents. |
| armax-morinth-me2 — **Volonté coupée** | Le halo ne masque pas le visage de Morinth ; la projection se coupe et elle regarde la sortie. Il s’agit d’une extinction Armax, pas d’un nouvel usage canonique de Dominate. Durée de conception : 150 pas à 60 Hz. | Extinction sobre pour toute cible incompatible ; le joueur garde le contrôle jusqu’au résultat fixé. Dépendance : halo distinct du corps, raccord sortie. |

Contrat commun conservé : KO final confirmé, vainqueur connu, résultat fixé, cible compatible, fenêtre de 120 pas et commande `L+M+H`. Zéro dégât, zéro gain de jauge, aucune récompense exclusive. Passage immédiat possible. Une présentation désactivée/sobre/complète conserve exactement le résultat et les droits de progression. Aucun déclenchement après égalité, temps écoulé, abandon ou déconnexion.

Les cadrages proposés n’imposent pas une prise humanoïde à un FENRIS, un Scion ou un boss géant. Une cible sans raccord validé utilise l’extinction sobre prévue. Le gel de la cible du finisher de Legion appartient à la présentation après résultat ; il ne lui attribue pas Stasis en plein combat.

## 9. Production, géographie et preuves restantes

| Besoin | Source ou candidat disponible | Ce qui reste à prouver |
|---|---|---|
| Intro Grunt, cuve et soute ME2 | Références d’identité du complément ; localisation recoupée S5 | Géométrie de la cuve, disposition de la soute, corps/arme exacts. Le hangar ME3 ne répond pas à ce besoin. |
| Outro Grunt, camp Urdnot | `stg_me2_tuchanka_urdnot` | Sous-zone exacte, costume verrouillé et mise en scène de la sortie ; le master seul ne produit pas une nouvelle illustration. |
| Rival Grunt/Legion | Identités documentaires et intentions historiques | Corps de Legion à récupérer, exact drone, axes et proportions communes. Aucun nouvel essai de génération d’un sujet exclu n’est autorisé par cette annexe. |
| Terrasse Azure | Source S4 ; dossier Tela lot 04 | Master exact, courbe du balcon, niveaux et accès. La coque d’Hagalaz ou la terrasse de Hock ne sont pas équivalentes. |
| Rival Tela/Liara | `ME2-CHR-LIARA` | Apparence DLC ME2 ; l’AAP1 ME3 du catalogue ne doit pas servir de raccourci. |
| Rival Morinth/Samara | Fiche Morinth civile et `ME2-CHR-SAMARA` | Deux apparences distinctes, costume de Samara explicitement choisi ; sa tenue de loyauté ne devient pas celle de Morinth. |
| Verrous lourds YMIR / Courtier | Identifiants existants du catalogue/lot 04 | Sprites et kit boss propres ; une rencontre conçue n’efface ni l’exclusion YMIR ni les besoins moteur. |
| Objectifs de protection/suivi | Conception de cette annexe | Données d’arène, cible secondaire, annonce, IA, lisibilité, retry et reprise à implémenter. |

La composition finale garde sujet, arme et information narrative dans une zone sûre. La position d’un sous-titre est définie au montage, indépendamment de l’image. La revue compare costume, marquages, asymétries, matériel, lumière, échelle, sous-zone et émotion entre intro/rival/outro. Une preuve de présence PNG ne ferme aucun contrôle de fidélité.

Les 32 briefs restent distincts des 36 briefs historiques. Ils ne sont ni 32 PNG, ni 32 stages, ni 32 animations. Une livraison séparée peut compléter `fileRef`, `imageProduced` et sa provenance pour un plan précis ; `fidelity1to1Validated` et `engineIntegrated` restent faux tant que leurs propres preuves manquent. Le catalogue des 192 identités n’est pas élargi par les identifiants narratifs de cette annexe.

**Essai graphique communiqué par la production :** `art-lot18-grunt-me2-ending-a-p01` a été refusé (`moderation_blocked/output/other`, demande `8f59b8ab-5dba-4100-ba30-529927fc50d8`). Aucun fichier produit, `fileRef=null`, aucun nouvel essai sur cette cible.

## 10. Vérification documentaire ciblée

Vérifier les quatre routeIds uniques, cinq rencontres par route, trois scènes par route, huit plans par route et deux issues disjointes par victoire finale. Chaque plan doit viser une scène de sa route ; les scènes héritées de Morinth/Tela doivent rester présentes dans `fighters.json`. Les références d’adversaires sont résolues dans le catalogue lot 16, les fiches lot 04 ou les acteurs d’univers, selon leur espace.

Le JSON préserve les empreintes des sources inspectées et la base Git. Une source mise à jour par la consolidation artistique ne doit pas être remplacée silencieusement dans cet historique. La relecture des liens et identifiants n’atteste aucun parcours de gameplay ; tests de combat, images et intégration moteur ont leurs preuves séparées.

## 11. Sources et portée

- **S1 — [EA — guides officiels de cosplay](https://www.ea.com/games/mass-effect/community/cosplay-guides)**, lu le 2026-11-25 ; `primary-publisher`. Présence de guides Grunt, Legion, Samara et Liara. Index lu ; les fichiers graphiques complets ne sont pas certifiés examinés dans cette annexe.
- **S2 — [Prima Games — Mass Effect 2, Dossiers](https://primagames.com/eguides/mass-effect-2-eguide/essentials/cast-of-characters/dossiers)**, lu le 2026-11-25 ; `secondary-gameplay-guide`. Familles d’armes et pouvoirs Grunt/Legion ; familles biotiques de Samara/Liara. Ne prouve aucun timing ou trajet de duel 2D.
- **S3 — [Prima Games — Samara: The Ardat-Yakshi](https://primagames.com/eguides/mass-effect-2-eguide/walkthrough/walkthrough/samaras-loyalty-the-ardat-yakshi)**, lu le 2026-11-25 ; `secondary-gameplay-guide`. Relation Samara/Morinth, identité distincte, Pull/Throw/Dominate. Les choix narratifs restent ceux de l’œuvre.
- **S4 — [Prima Games — Lair of the Shadow Broker: Azure Hotel](https://primagames.com/eguides/mass-effect-2-eguide/walkthrough/special-assignments/lair-of-the-shadowbroker-azure-hotel)**, lu le 2026-11-25 ; `secondary-gameplay-guide`. Confrontation Vasir/Liara, balcon courbe, charge/dash biotique, Shockwave, protection et arme ; ne prouve pas les nouvelles règles 2D.
- **S5 — [Prima Games — Grunt: Rite of Passage](https://primagames.com/eguides/mass-effect-2-eguide/walkthrough/walkthrough/grunts-loyalty-rite-of-passage)**, lu le 2026-11-25 ; `secondary-gameplay-guide`. Soute de Grunt, Tuchanka et existence d’une arène du rite distincte du camp. L’annexe ne fixe aucun chef de clan ou choix de campagne.
- **M1 — [gamedev — dialogue-systems (révision épinglée)](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/dialogue-systems/SKILL.md)**, lu le 2026-11-25 ; `method-only`. IDs, conditions, transitions, texte séparé et effets exécutés une seule fois. Aucun moteur ou dépendance ajouté.

Les références secondaires de gameplay servent au recoupement ciblé ; elles ne remplacent pas une comparaison au jeu source pour certifier les apparences ou toutes les variantes. Les routes, leurs objectifs secondaires, leurs huit conclusions et leur mise en scène constituent une écriture originale du projet. Le guide de méthode M1 est appliqué aux transitions et identifiants ; aucune dépendance Ink/Yarn ou nouveau moteur de dialogue n’est installée.

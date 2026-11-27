# Armax — compléments de bible du lot 21

**27 novembre 2026 — Europe/Paris. Statut : conception et prototypes visuels.**

Cette annexe prolonge la [bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md), les [fiches A–J](../bible/FICHES_ET_LIAISONS.md) et leurs deux extensions. Elle développe les usages possibles des dix images livrées et des vingt identités ajoutées au suivi. Elle ne crée aucun kit exécutable. Les [68 rubriques du guide](../bible/guide-coverage-2026-11-27.json), leurs 204 critères et leurs 40 scénarios d’acceptation restent conservés ; les scénarios ne sont pas exécutés par cette livraison.

Le [catalogue courant](production-catalog.json) contient **216 fiches : 171 avec une image candidate et 45 sans**. Les 196 identités héritées conservent leur ordre et leurs distinctions. Parmi les 35 anciennes fiches sans image, Victus et Petrovsky disposent désormais d’un candidat : il en reste 33 dans ce périmètre. Les vingt ajouts apportent huit identités illustrées et douze sans image. Ce catalogue de production reste partiel à l’échelle de la franchise.

## 1. Contrat de fidélité

L’unité suivie est une identité située : nom, œuvre, période, DLC éventuel et variante. Une arme de ME2, son éventuel retour dans ME3, une version de comic et une adaptation au duel demandent des preuves distinctes. La silhouette générale peut être reconnaissable alors que la face opposée, les petites inscriptions ou le bas du corps restent insuffisamment documentés. Chaque réserve demeure attachée à l’asset dans le [manifeste](art-production/manifest.json) et les [revues indépendantes](qa/recovered-art-review.md).

Les dix PNG sont des **images fixes, un sujet par fichier**, avec leurs octets natifs conservés. Ils sont au statut **Prototype**, avec `fidelity1to1Validated=false` et `engineIntegrated=false`. Une image n’établit ni une pose d’attaque, ni un enchaînement, ni une hitbox, ni un comportement d’IA. La présente annexe utilise « proposition » pour les adaptations au duel ; les sources de l’opus établissent les identités et apparences, sans imposer leurs paramètres dans Armax.

La validation future demande une comparaison avec des vues attribuées au bon modèle : silhouettes, proportions, volumes, matières, couleurs, marquages et détails visibles. Les zones non documentées restent ouvertes. Les images doivent ensuite être contrôlées à leur taille réelle d’affichage, sur les fonds et avec le filtrage du moteur. Une certification artistique et une intégration fonctionnelle sont deux décisions séparées.

## 2. Personnages narratifs récupérés

### Adrien Victus — ME3, Primarque

**Fiche :** `chr_me3_adrien_victus`. Le candidat représente Adrien dans son apparence de Primarque ; Tarquin Victus possède une identité distincte. Le rôle hérité `narration_support` est conservé. L’usage proposé concerne un briefing ou une présence dans les archives ME3, à relier aux fiches **B/F/J**. Aucune capacité de duel, attaque ou assistance de combat n’est attribuée au personnage par cette image.

La relecture a retrouvé des images de la scène de référence, mais les petites captures ne prouvent pas tous les détails des mains, des jambes et des pieds. Le visage, les plaques et l’uniforme supérieur disposent d’une meilleure assise visuelle que la tenue basse. Le candidat est retenu pour le suivi avec ces réserves, sans annuler la lacune de référence enregistrée au lot20. Cette revue antérieure reste conservée dans le catalogue.

**Complément encore nécessaire :** obtenir une vue suffisamment nette du modèle entier et de l’arrière de l’uniforme ; comparer les mains et les pieds ; décider d’une composition narrative précise. Une illustration de briefing complète devra identifier ses autres acteurs, son lieu et son moment ; le sprite isolé ne la remplace pas.

### Oleg Petrovsky — ME3, Omega

**Fiche :** `chr_me3_oleg_petrovsky`. Le candidat vise l’uniforme du DLC Omega. Les cases de *Invasion* ne remplacent pas cette apparence de jeu. Le rôle reste `narration_support`, avec fiches **B/F/J** : identité, contexte de scène, provenance et revue visuelle.

L’uniforme supérieur et la tête peuvent être rapprochés des images inspectées. Les captures exactes précédemment annoncées à 120/122 secondes n’ont pas été récupérées dans cette passe ; les autres images disponibles ne donnent pas une preuve suffisamment détaillée du pantalon, des mains et des chaussures. Ces parties restent une reconstruction candidate. La présence de ce PNG ne signifie pas qu’une scène Omega ou un parcours de campagne est entièrement illustré.

**Complément encore nécessaire :** retrouver une vue intégrale précisément attribuée au jeu, comparer le bas de l’uniforme, puis définir une pose narrative compatible avec la scène retenue. La fiche ne reçoit aucun kit de boss par déduction de son rôle dans l’histoire.

## 3. Adversaires : identités et livrables séparés

| Fiche | Identité à préserver | Proposition Armax | Manques après le PNG ou l’audit |
|---|---|---|---|
| `chr_me3_harvester` | Harvester de ME3 ; ne pas substituer une apparence organique de ME2 | Étudier un adversaire de rencontre de grande taille, avec fiches B/C/J | Échelle, face opposée, poses et rapport à l’arène ; aucun boss ou état de vol implémenté |
| `chr_me3_geth_bomber` | Geth Bomber de ME3 | Adversaire aérien candidat, lisible au-dessus du plan de combat | Vol, orientation, signaux, action de largage et réponse du joueur à spécifier séparément |
| `chr_me2_seeker` | Seeker de ME2 | Entité candidate propre au contexte récolteur | Taille relative, autres vues et comportement ; aucune assimilation au Swarmer |
| `chr_me3_swarmer` | Swarmer de ME3, associé aux Ravagers par le manuel officiel | Petite menace de rencontre ; proposition à évaluer avec les entités persistantes | Naissance, marche, poursuite, contact, mort et limites de population restent ouverts |
| `chr_me1_geth_rocket_trooper` | Geth à roquettes de ME1 | Examiner le réemploi documentaire d’un atlas RPG existant | Attribution et pose exactes, arme et raccords au duel à vérifier |
| `chr_me1_geth_juggernaut` | Juggernaut de ME1 | Adversaire lourd candidat | Ne pas transférer automatiquement les valeurs RPG ou l’échelle de l’atlas |
| `chr_me1_geth_destroyer` | Destroyer de ME1 | Vérifier les quatre poses RPG conservées comme piste | Arme générique du candidat antérieur ; conformité et éventuel nouveau sprite restent ouverts |
| `chr_me3_geth_hunter` | Hunter de ME3 | Fiche d’adversaire à documenter depuis son opus | Modèle complet et état visuel à verrouiller ; aucune invisibilité moteur ajoutée |
| `chr_me3_geth_pyro` | Pyro de ME3 | Fiche d’adversaire à documenter depuis son opus | Corps et équipement exacts ; flamme, portée et états restent distincts |
| `chr_mea_adhi_wild` | Adhi sauvage d’Andromeda | Examiner l’entrée RPG `adhi-mea` | Variante, proportions, détails et usage dans Armax non validés |
| `chr_mea_adhi_trained_outlaws` | Adhi dressé des hors-la-loi, Andromeda | Conserver une fiche distincte de l’animal sauvage | Vue exacte et différences d’équipement à établir ; aucun simple recoloriage équivalent |

Le [manuel EA de ME3](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_Microsoft%20XBOX360.pdf), pages 26–27, donne un contexte d’ennemis pour Hunter, Pyro et les Swarmers. Cette source textuelle n’est pas une preuve géométrique. Les images et sources propres aux sujets sont liées dans l’[audit](audit/coverage-additions.md) et les manifestes de production.

Pour les quatre nouveaux ennemis illustrés, les propositions de rencontre doivent conserver une lecture latérale : silhouette visible, ancrage clair, anticipation compréhensible et réponse identifiable. Ces objectifs n’attribuent aucune durée, vitesse ou quantité de dégâts. Les nombres, timings, distances et interactions demandent une fiche d’action puis un prototype contrôlé. Les filtres de sélection des modes restent ceux de la bible ; un adversaire n’est pas automatiquement sélectionnable en Versus.

## 4. Arsenal : objet, porteur et action

L’ajout de la catégorie `arme` permet de suivre un objet sans l’attribuer arbitrairement à un personnage. Le rôle `arme_candidat` renvoie aux fiches **B/C/J** : identité visuelle, action éventuelle et provenance. Un PNG de profil ne prouve aucune pose tenue en main, aucune compatibilité avec un squelette, aucun projectile et aucun équilibrage.

| Fiche | État du lot21 | Distinction à conserver | Suite de production |
|---|---|---|---|
| `wpn_me2_m300_claymore` | PNG récupéré | Modèle ME2, profil propre ; une arme ne définit pas le kit d’un porteur | Vues complémentaires, marquages et points de prise |
| `wpn_me2_m22_eviscerator` | PNG récupéré | Modèle ME2 ; petite inscription `CAUTION` imparfaite dans le candidat | Corriger la fidélité des inscriptions après référence détaillée ; contrôler la face opposée |
| `wpn_me2_m12_locust` | PNG généré | Locust ME2 ; marquage CR2 reconnaissable, autres lettres et usure réinterprétées | Référence de texture nette, correction des microdétails, pose équipée distincte |
| `wpn_me2_m5_phalanx` | PNG généré | Phalanx ME2 / Firepower Pack ; laser éteint dans ce livrable | Microdétails, autre face et états d’utilisation à produire séparément |
| `wpn_me2_m96_mattock` | Refus de génération, aucun PNG | ME2 / Firepower Pack | Exclusion de relance automatique conservée ; aucune image de substitution |
| `wpn_me2_m920_cain` | Fiche sans PNG | Identité ME2 ; ne pas importer des paramètres d’un autre opus | Référence complète, version et gabarit à verrouiller |
| `wpn_me3_m11_suppressor` | Refus de génération, aucun PNG | ME3 / Citadel | Exclusion de relance automatique conservée ; aucun essai alternatif |
| `wpn_mea_paw` | Fiche sans PNG | Arme d’Andromeda, distincte des modèles de la trilogie | Vue exacte du modèle, matériaux et proportions avant production |

La [fiche officielle du Firepower Pack](https://www.xbox.com/en-us/games/store/firepower-pack/BVVZ72CC1VJJ) confirme le contexte DLC du Mattock et du Phalanx ainsi que la visée laser du Phalanx. Le profil fixe livré ne simule pas cette visée. Les deux refus restent enregistrés dans les sous-manifestes, avec leurs identifiants et l’absence de relance.

Pour chaque future action, l’association devra nommer explicitement le porteur, l’opus, la pose d’attache, l’état de l’arme, les phases d’anticipation/activité/récupération, les effets séparés et les réponses adverses. Aucune valeur de l’inventaire RPG, aucun emplacement d’équipement et aucune statistique n’est modifié par cette annexe.

## 5. Accessoire narratif : balise d’Eden Prime

**Fiche :** `prop_me1_eden_prime_prothean_beacon`. L’identité est celle de la balise prothéenne d’Eden Prime dans ME1. Un master de décor existe comme contexte documentaire ; il ne constitue pas un PNG de prop isolé. Le catalogue conserve donc cette fiche sans image.

L’usage proposé relève de **B/F/G/J** : identité, contexte narratif, place dans la scène et provenance de l’actif. La balise n’est pas déclarée interactive. Une production future doit déterminer la scène, l’état visuel exact, l’échelle, les vues et la séparation entre objet, lumière et effet éventuel. Une capture de la balise seule ne rendrait pas complète une scène narrative de contact.

## 6. Réemploi des ressources RPG

Quatre fiches ouvertes disposent d’une piste concrète dans le dépôt. Elles restent sans PNG sélectionné dans Armax tant que la revue d’identité et de variante n’est pas effectuée.

| Fiche | Ressource existante | Limite du réemploi |
|---|---|---|
| Geth à roquettes ME1 | `public/assets/frontier-enemies.png`, entrée `rocket-geth` du descripteur | Piste RPG ; nouvelle extraction/association Armax et fidélité à examiner |
| Juggernaut ME1 | `public/assets/frontier-enemies.png`, entrée `juggernaut` | Aucune échelle ou statistique du RPG transférée |
| Destroyer ME1 | `public/assets/enemy-geth-destroyer-combat.png` et descripteur d’animation | Quatre poses existantes ; arme générique signalée |
| Adhi sauvage MEA | `public/assets/horizon-fauna.png`, entrée `adhi-mea` | Identification de variante non certifiée ; pas d’équivalence automatique avec l’Adhi dressé |

Ce réemploi demande d’abord la vérification visuelle des originaux et de leurs métadonnées. La présence d’une frame nommée ne suffit pas à certifier une apparence. Le manifeste du lot21 ne compte aucun de ces fichiers comme PNG nouvellement produit ou livré par cette passe.

## 7. Liaison aux deux extensions

**Équipes et bonus, sections 30–49.** Les nouvelles fiches pourront être consultées dans les archives ou dossiers de production. Elles ne deviennent ni membres d’équipe, ni assists, ni entités persistantes actives. Le Swarmer et le Bomber sont seulement des candidats pour l’étude de rencontres ; leurs règles de propriété, durée de vie, collision, priorité, suppression et quantité simultanée devront être définies avant un prototype. Aucun taunt, tag, super ou fin coordonnée n’est créé par les PNG.

**Déblocages, sections 50–67.** Une fiche présente dans le catalogue peut être connue documentairement sans être disponible dans le jeu. La présence du fichier, son installation, les droits éventuels et son éligibilité au mode restent distincts. Les refus de génération et lacunes de référence sont des états de production ; ils ne constituent pas des secrets ou conditions de déblocage pour le joueur. Les modèles de soutien restent désactivés et aucun paiement réel n’est activé.

Les scénarios déjà définis gardent leur résultat « non exécuté ». Aucun résultat de campagne, d’équipe, de sauvegarde, de paiement ou de réseau n’est attribué à cette continuation artistique.

## 8. Reste à produire et critères de fermeture

Le [registre des manquants](MANQUANTS_2026-11-27.md) expose toutes les 45 fiches sans image : **30 sont exclues des relances automatiques** et **15 restent ouvertes**, dont quatre pistes de réemploi. Les onze autres fiches ouvertes ont une recherche ou une production à accomplir ; cette classe ne signifie pas que leur référence soit déjà suffisante pour un rendu 1:1.

La clôture d’un manque visuel demande un fichier réel, une identité et variante vérifiées, une attribution claire, une revue technique de transparence/cadrage et une revue visuelle avec les réserves restantes. La clôture de la fidélité 1:1 demande davantage : sources complètes, comparaison des détails et absence d’écart matériel dans la portée certifiée. La clôture de l’intégration demande ensuite les tests de rendu et d’usage dans le moteur. Ces portes sont séparées dans le catalogue et le classeur.

La perte de la copie temporaire avant publication a imposé une [reconstitution contrôlée](RECUPERATION_TECHNIQUE.md). Les dix PNG et le classeur final ont conservé leurs octets ; les documents et contrôles réécrits sont identifiés comme tels. Les empreintes de références tierces perdues restent indéterminées. Les contrôles finaux portent sur les fichiers effectivement livrés après restauration.

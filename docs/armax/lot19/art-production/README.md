# Lot19 — production et revue des poses fixes

## État des livrables

Le manifeste décrit **4 nouveaux sujets**, **6 PNG natifs** et **7 tentatives de génération** : six sorties réussies et un refus de service sans fichier. Quatre PNG sont sélectionnés comme candidats de travail ; les deux autres sont l’historique de Kallo. Aucun de ces livrables n’est une animation ou une preuve d’intégration moteur. Tous gardent le statut **Prototype**, `fidelity1to1Validated=false` et `engineIntegrated=false`.

| Fiche existante | Candidat sélectionné | Rôle préservé | Historique |
| --- | --- | --- | --- |
| `chr_mea_kallo_jath` | `characters/kallo-jath-mea-standing.png`, R1 | `narration_support`, pilote debout au repos | R0 et R2 non sélectionnés ; R3 refusé sans fichier |
| `chr_me3_bailey` | `characters/bailey-me3-standing.png`, R0 | `narration_support`, officier en tenue ME3 | Aucun autre essai |
| `chr_mea_evfra` | `characters/evfra-mea-standing.png`, R0 | `combattant_candidat`, adaptation de pose proposée par le projet | Aucun autre essai |
| `chr_me2_collector_drone` | `characters/collector-drone-me2-standing.png`, R0 | `opposant_candidat`, Drone non possédé | Aucun autre essai |

Les chemins de la table sont relatifs à `public/assets/armax/lot19/`. `manifest.json` fournit les chemins complets dans le dépôt, les identifiants uniques, les SHA256, les prompts, les références et les réserves par fichier. Les six PNG sont des sorties **1024 × 1536, RGBA**, conservées octet pour octet.

## Méthode et portée de la fidélité

Production par `image_gen.imagegen` intégré, un appel par image ou révision. Les références visuelles ont été téléchargées puis inspectées avant les appels. Le guide `create-game-assets` de `gamedev-skills/awesome-gamedev-agent-skills`, épinglé à `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`, et le skill `imagegen` ont guidé la production et la revue.

La fidélité 1:1 est la cible. La source disponible ne permet pas de certifier les silhouettes intégrales. Les références de Kallo, Bailey et Evfra montrent surtout le visage, les épaules et le torse. Les jambes, les chaussures et certaines coutures ont été reconstruites : elles sont indiquées comme telles dans le manifeste. Le Drone dispose d’une géométrie intégrale de Collector Trooper publiée par son créateur, mais son équivalence intégrale au sous-type Drone et la couleur de ses pieds restent à corroborer. La présence d’un détail dans un PNG ne le transforme pas en élément canonique vérifié.

Les références de jeu n’ont pas été remplacées par du fanart ou par un costume d’une autre période. Les personnages de soutien restent des personnages de soutien. Kallo debout ne couvre pas le livrable distinct du pilote assis. Bailey conserve la tenue ME3. Evfra n’a reçu aucune arme ou capacité inventée ; sa conversion en candidat du jeu de combat est une proposition du projet.

## Revue visuelle par personnage

### Kallo Jath

La capture [PC Gamer du Tempest](https://www.pcgamer.com/mass-effect-andromeda-4k-gallery-a-tour-of-the-tempest/) documente la tête, les yeux noirs, le col brun, les panneaux crème, les manches grises, le badge Initiative et les mains du pilote. Une [capture promotionnelle du visage](https://masseffect-universe.com/images/mass_effect_andromeda/screenshots/lico_kehllo/46-0-21199) complète ce contrôle. Son rôle de pilote est décrit dans le [guide officiel Prima](https://primagames.com/eguides/mass-effect-andromeda-collectors-edition-eguide/introduction/andromeda-initiative).

R0 représentait trop de doigts ; R1 corrige les mains vers les trois doigts salarians. La forme exacte des mains reste à confronter au modèle. La couronne de la tête est plus resserrée que la grande fente ouverte visible dans la capture ; le museau, les proportions de tête, le dessin du badge et plusieurs coutures restent des interprétations. Le pantalon, les bottes et la pose debout ne sont pas corroborés par les captures partielles.

R2 a été demandé pour retirer un halo apparent. La composition réelle avec l’alpha a montré que les couleurs de ce halo étaient masquées par une transparence nulle. R1 est donc retenu pour préserver davantage le visage. Les deux essais non sélectionnés restent documentés et comptés comme fichiers historiques.

Une édition R3 ciblait uniquement la couronne et les proportions du visage d’après les deux références exactes. Le service de génération a refusé la sortie : HTTP400, `moderation_blocked`, étape `output`, catégorie `other`, identifiant de requête `f8a502e3-bf2d-401a-af79-801de28b4b25`. Le prompt et l’erreur complète sont consignés ; aucun PNG R3 n’a été renvoyé et aucune nouvelle tentative Kallo n’a été lancée après ce refus. R1 conserve donc sa réserve visible sur la forme de la tête.

### Armando-Owen Bailey

Une [capture ME3 légendée « Commander Bailey »](https://www.mobygames.com/game/55078/mass-effect-3/screenshots/windows/552780/) montre les épaules à attaches rondes, les bandes claires aux bras, le col et les fermetures de poitrine. Le petit portrait de [Massrelay, section ME3](https://massrelay.cz/mass-effect-3/charaktery/) complète l’identification faciale. La capture de dialogue et le portrait présentent des éclairages différents : la couleur grise des cheveux et les proportions du visage généré demandent encore une comparaison au modèle final.

Le candidat conserve une pose calme, sans arme. Le bas de veste, le pantalon et les bottes sont une reconstruction conservatrice, pas une preuve de la coupe exacte de l’uniforme intégral.

### Evfra

Le [guide officiel Prima, A Trail of Hope](https://primagames.com/eguides/mass-effect-andromeda-collectors-edition-eguide/priority-ops/mission-3-a-trail-of-hope) identifie Evfra comme chef de la Résistance. Trois [captures communautaires de la scène du QG](https://www.livequote.org/hashtag/evfradetershaav) documentent la tête bleue, les lobes, les cicatrices, la tunique teal croisée, la sangle claire et les manches blanches. Deux captures publiées en 2017 par [Samurai Gamers](https://samurai-gamers.com/mass-effect-andromeda/evfra-de-tershaav-character-profile/) recoupent ces détails. La provenance communautaire ne permet pas de certifier l’absence totale de modification, même si les éléments visibles concordent.

Les cinq références sont cadrées au buste. Les noms de cache `standing`, `seated` et `back` décrivent le contexte de la scène ; ils ne désignent pas des vues intégrales. La taille, le pantalon, les chaussures et les mains complètes du candidat sont reconstruits. La séparation des groupes de doigts, les deux ou trois groupes d’orteils visibles selon le pied et la morphologie digitigrade doivent être revus à partir d’une référence complète. Aucune fidélité anatomique 1:1 n’est attestée.

### Drone récolteur

Le [portfolio de Leroy Chen](https://leroychen.artstation.com/projects/gJy9KZ), créateur du modèle de production de ME2, fournit une sculpture grise intégrale face/profil/dos ainsi qu’un rendu coloré de Collector Trooper. Le portrait explicitement légendé « Collector Drone » dans le [guide officiel Prima, Horizon](https://primagames.com/eguides/mass-effect-2-eguide/walkthrough/walkthrough/horizon) recoupe la tête et les épaules. L’équivalence de tout le corps entre le Trooper générique du portfolio et ce sous-type est une inférence, conservée comme réserve dans le manifeste.

Le candidat reprend le casque allongé vers l’arrière, les yeux clairs, la chitine sombre, les fibres rouges aux articulations, l’abdomen segmenté, les trois doigts griffus et la morphologie des pieds. La rotation en trois-quarts et les recouvrements empêchent de certifier l’agencement exact des yeux et des plaques. Le rendu coloré de l’auteur coupe le bas des jambes : la palette des pieds et leur brillance sont interprétées. La teinte cuivrée se rapproche du portrait Prima et diffère du rendu gris du portfolio ; les éclairages différents empêchent de certifier le shader. La finesse des surfaces reste interprétée.

La pose fixe est une présentation sans arme et sans effet de possession d’Harbinger. Les captures identifiées comme Collector Guardian ont été rejetées avant génération. Le Drone n’est pas transformé en Guardian ou en boss par son ajout au catalogue.

## Contrôle de la transparence

Les PNG ont un canal alpha réel. Les couleurs de halo présentes dans le RGB des zones transparentes apparaissent dans certains aperçus qui ignorent ou montrent mal l’alpha. Les trois planches `qa/kallo-r1-r2-alpha-comparison.png`, `qa/bailey-evfra-alpha-comparison.png` et `qa/collector-drone-alpha-comparison.png` montrent les sorties composées sur fond clair et sur fond sombre : aucun halo large n’y est visible.

Le maximum d’alpha est **254**, pas 255 : le sujet est quasi opaque. Un faible bruit d’alpha périphérique, principalement de 1 à 10, est conservé dans les octets natifs. C’est pourquoi le rectangle des pixels d’alpha non nul peut atteindre les bords, alors que le rectangle d’alpha ≥128 reste à l’intérieur. Le manifeste distingue ces deux mesures. Ce contrôle ne vaut pas revue en moteur.

Les planches QA sont des documents de contrôle ; elles ne remplacent pas les fichiers natifs. Aucun détourage, redimensionnement, recoloriage ni correction automatique des pixels n’a été appliqué aux PNG livrés. La seule transformation hors du générateur est la composition des planches d’inspection.

## Références non suffisantes et exclusions

Les recherches non concluantes figurent dans `referenceSearches`. Wreav reste manquant : une image prétendument attribuée à Wreav représente en réalité un Volus et une autre montre la période ME2 ; les images de l’auteur et de Creative Uncut n’ont pas été récupérées. Adrien Victus et Ajax féminin restent sans nouvelle référence verrouillée. Pour Henry Lawson, les captures de Sanctuary masquent le torse derrière Oriana ou présentent le corps en chute sous des effets ; le mod qui change explicitement son visage et sa tenue a été écarté. Aucune image n’a été produite pour ces fiches à partir de ces références insuffisantes.

Le Général récolteur reste aussi manquant : la grande charshot et la scène de console documentent la tête et le torse, mais coupent les extrémités. Le petit aperçu du modèle natif 310066 montre une pose verticale repliée et une finition différente de celle de la scène, avec des yeux non émissifs. Ces éléments ne verrouillent pas une pose intégrale exploitable avec toutes les articulations ; aucune génération supplémentaire n’a été lancée.

Les exclusions historiques du catalogue sont conservées. Les caches d’images tierces restent extérieurs au dépôt : seules leurs URL, dimensions, empreintes et descriptions d’inspection sont consignées. Les images générées et leurs prompts sont les livrables de ce dossier.

# Mako de Thérum — conduite et vues de prototype

Lot du **9 novembre 2026**, à partir de `ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd`. Ce lot fournit un contrôleur de conduite 2D, des entrées/sorties contrôlées et quatre vues fixes du **Mako M35 de ME1**. Il ne termine ni le système Mako original ni toutes les lignes de véhicules du classeur. L'intégration du monde, des commandes et les essais en jeu constituent une preuve distincte de cette revue d'asset.

## Sources consultées et portée

Le [manuel officiel EA de Mass Effect sur Xbox 360](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf) a été retéléchargé avec réponse HTTP 200 : **1 701 003 octets**, SHA-256 `f09cbe3dae03b652299d63f6b4c9340b8d0a9bf4df8b92b83e9bd9545dbceb44`. Sa page PDF **13**, pages imprimées **23–24**, a été rendue avec `pdftoppm` puis effectivement ouverte. La figure objet PDF 233 mesure seulement **443 × 333** pixels : elle montre le Mako à six roues dans le terrain. Le texte décrit l'approche pour embarquer, la conduite et la recherche d'un sol sûr avant de sortir. Le canon, la mitrailleuse, le saut et la réparation par omni-gel sont également décrits, mais restent hors de cette implémentation.

Le petit JPEG extrait est en CMYK ; sa prévisualisation directe apparaissait inversée. La page PDF rendue avec ses couleurs correctes a donc servi de référence à `image_gen`, avec l'atlas véhicules existant. Les fichiers de source restent dans `/tmp/relay-frontier-vehicles/` et ne sont pas redistribués comme assets du jeu.

`public/assets/vehicle-atlas.png` et `public/assets/arsenal-fleet.png` ont été ouverts avant la génération. Le premier guide le rendu HD du Mako déjà présent ; le second sert à distinguer Mako, Nomad, Hammerhead, Normandy SR-1/SR-2 et Tempest. Ces images de prototype ne prouvent pas leurs détails canoniques. La [revue primaire précédente](arsenal-visual-sources.md) précise aussi les angles et identités qui restent insuffisamment documentés.

Méthode : consignes `AGENTS.md`, briefs HD, conception RPG/ATB, guide assets et références épinglées `rpg`, `create-game-assets` et `level-design`. Le moteur reste Three.js 0.180.0, avec caméra orthographique et sprites 2D dans le monde 3D. Aucune bibliothèque de physique ni migration de sauvegarde n'est introduite.

## Fichiers produits

| Fichier | Rôle |
|---|---|
| `src/frontier-vehicles.js` | Données, état détaché, embarquement, conduite, sortie et validation des cadrages |
| `tests/frontier-vehicles.test.js` | Huit essais ciblés du contrôleur et des métadonnées |
| `public/assets/vehicle-mako-directions.png` | Atlas RGBA natif 1536 × 1024, quatre vues fixes |
| `public/assets/vehicle-mako-directions.json` | Rectangles, pivots, échelles, identité ME1/me1 et réserves |
| [Prompts exacts](frontier-vehicles-prompts.json) | Deux tentatives et sélection de la première |
| [Rapport technique](../qa/frontier-mako-art.json) | Empreintes, alpha, composantes, source primaire et revue native |
| [Revue sur damier](../screenshots/frontier-mako-native.png) | Capture Chromium à 1536 × 1024 effectivement ouverte |

Le PNG publié est une **copie byte à byte** de `/workspace/generated_images/exec-e2fe78c1-1c3a-44bb-840a-b4dbb01c1de9.png` : SHA-256 `50d4a2f3639c62e0a548283b3167b703c3917c5bd14bb2c9e4c975a82552df74`. Aucune retouche, découpe, remise à l'échelle ou réparation de pixel n'a été appliquée au PNG. Pillow a seulement lu l'alpha et mesuré les régions ; le damier est un fond CSS de prévisualisation. La seconde génération, demandée pour éliminer un halo apparent du premier aperçu, n'améliore pas le nombre de pixels de faible opacité et n'est pas retenue. La revue sur damier du fichier natif montre que le premier PNG possède déjà des silhouettes propres.

Les quatre composantes principales correspondent à avant, arrière, profil gauche et profil droit. Les deux profils montrent chacun trois roues proches. Au seuil mesuré `alphaTest .16`, plus permissif que le matériau observé à `.2`, aucun pixel visible ne sort de son rectangle et aucun ne touche le bord de l'atlas. Quelques pixels de très faible opacité restent hors des corps ; ils sont documentés et rejetés par le seuil du matériau. Les détails de carrosserie et les angles absents de la petite référence officielle restent interprétés. **Aucune fidélité 1:1 n'est certifiée.**

## Contrat d'intégration

Toutes les fonctions retournent un nouvel état ; elles ne mutent ni partie, ni inventaire, ni sauvegarde. Les coordonnées sont les axes **x/z du monde**, après conversion du clavier dans la base de la caméra déjà utilisée à pied.

| API | Résultat et responsabilité du monde |
|---|---|
| `FRONTIER_VEHICLES.mako` | ME1/me1, zone `therum`, rayon 1.45, embarquement à 4 unités, vitesse 9 et accélération Maj à 13. Valeurs adaptées au JRPG. |
| `createMakoState({x,z})` | Mako arrêté au parking auteur ; `null` pour une position invalide. Le parking du nouveau plan est fourni par le monde, autour de `(-18,65)`. |
| `getMakoState(state)` | Copie validée limitée aux données du contrôleur. |
| `boardMako(state, playerPosition, zoneId)` | `{ok,state,reason}` ; vérifie proximité et Thérum. Le monde vérifie exploration ME1 et accès sans mur entre groupe et véhicule. |
| `stepMako(state,{x,z,boost},dt,isVehicleWalkable)` | État neuf, inertie et freinage. `dt ≤ .05`, déplacements sous-échantillonnés à au plus `.18` unité. Le callback `(x,z,radius)` doit vérifier toute l'empreinte contre sol, obstacles élargis et barrières de progression. Un callback absent, faux ou en erreur bloque la conduite. |
| `dismountMako(state,isFootWalkable)` | `{ok,state,position,reason}` ; cherche parmi 16 directions à 2.35 unités et vérifie les empreintes pied de rayon `.4` tout le long du trajet. Aucun trajet sûr : le groupe reste embarqué. Le Mako lui-même n'est pas un obstacle pied pour cette vérification. |
| `makoDirectionFrame(state)` | `front`, `back`, `left` ou `right`, selon la caméra `(23,29,27)` ; dernière direction conservée à l'arrêt. |
| `normalizeMakoDirections(metadata)` | Métadonnées gelées ou `null`. Vérifie identité, dimensions, rectangles, pivots et absence de chevauchement avant usage UV. |

Le monde embarque les métadonnées à la compilation via `__RELAY_MAKO_DIRECTIONS__`, comme les autres familles de poses. Pour une direction : hauteur du plan `displayHeight * heightScale`, largeur selon le ratio du rectangle, ancrage à partir du pivot en pixels et filtrage linéaire. `displayHeight: 3` reste un choix d'échelle du décor, pas une dimension officielle du véhicule. Le rayon de collision représente une approximation circulaire conservatrice du contrôleur, à comparer au plan 2D sur les façades lors de l'essai en jeu.

## Sauvegarde, progression et limites

Le mode véhicule est **transitoire dans le renderer**. Le format de sauvegarde conserve seulement la position normale du groupe, légale pour un piéton. Après rechargement de zone ou de sauvegarde, le groupe revient à pied et le Mako retourne à son parking d'origine ; aucune persistance de véhicule, de vitesse ou de tourelle n'est déclarée. Les rencontres et objectifs existants gardent leurs identifiants et leurs récompenses ; le Mako doit s'arrêter devant les secteurs non sécurisés et le groupe descend pour interagir ou combattre.

Cette passe ne fournit pas suspension 3D, basculement, saut, canon, mitrailleuse, visée de tourelle, dégâts de coque/boucliers, réparation, rotation animée des roues ou combats embarqués. `WPN-canon-du-mako` et la mitrailleuse ne changent donc pas de statut. Le Mako d'Ilos reste dans son périmètre existant ; le contrôleur n'autorise que Thérum.

Les références de la flotte existante conservent leurs contextes : Mako et SR-1 ME1, Hammerhead et SR-2 ME2, Nomad et Tempest MEA. Aucun pilotage d'un autre véhicule, déplacement de vaisseau, transfert d'inventaire entre œuvres ou disponibilité anachronique n'est ajouté. Ces chantiers et leurs références visuelles manquantes restent ouverts.

## Vérifications de cette sous-tâche

`node --test tests/frontier-vehicles.test.js` : **8 réussites, 0 échec**. Cas couverts : proximité/zone et absence de mutation, inertie et plafonds, collisions avec rayon/glissement, obstacle mince, sortie bloquée par un anneau pourtant libre à son extrémité, directions caméra, entrées invalides, métadonnées incorrectes et copies gelées. Ces essais ne prouvent pas le parcours jouable complet de Thérum.

Le [rapport d'asset](../qa/frontier-mako-art.json) passe ses contrôles techniques et sa revue native ; l'essai en jeu appartient au lot monde/interface. Aucun build global, test global, commit ou push n'a été exécuté par cette sous-tâche. Les rapports d'intégration de l'ensemble du lot doivent établir embarquement, conduite, collision de bord/façade, sortie, reprise à pied, commandes tactiles et absence de contournement des rencontres avant de promouvoir le système dans le suivi.

Le [parcours public du lot](frontier-public-journey.md) a ensuite joué l'entrée/sortie E, la conduite/accélération, la pause immobile, l'import d'un export embarqué puis le rechargement à pied, ainsi que les commandes tactiles simultanées. La collecte DEV03 conserve son échec final d'empreinte dû au correctif séparé d'Ilos ; ses contrôles joués, sa revue visuelle et la qualification de cette différence restent dans des rapports distincts. Aucune preuve de production n'est déduite de cette seule collecte de développement.

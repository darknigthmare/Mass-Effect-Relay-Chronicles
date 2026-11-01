# Compagnons ME1 — poses de combat du 1er novembre 2026

Les six compagnons existants — Ashley, Kaidan, Garrus, Tali, Wrex et Liara — reçoivent chacun quatre **poses clés fixes** : visée, action, impact et hors combat. Les six atlas sont des sorties natives de `image_gen.imagegen`, copiées sans modification de pixels. Le renderer découpe leurs rectangles mesurés et utilise les pivots propres à chaque pose.

Le [guide create-game-assets épinglé](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md) est appliqué au renderer Three.js 0.180.0 existant. La référence artistique est [crew-atlas.png](../../public/assets/crew-atlas.png), conservée à l’identique. Elle fixe la cohérence avec le prototype ; elle ne constitue pas une preuve primaire des costumes originaux.

| Compagnon | Atlas et métadonnées | Provenance de génération |
|---|---|---|
| Ashley | [PNG](../../public/assets/companion-ashley-combat.png), [JSON](../../public/assets/companion-ashley-animation.json) | [Prompts](companion-combat-ashley-prompts.json), [notes](companion-combat-ashley-art.md) |
| Kaidan | [PNG](../../public/assets/companion-kaidan-combat.png), [JSON](../../public/assets/companion-kaidan-animation.json) | [Prompts](companion-combat-kaidan-prompts.json), [notes](companion-combat-kaidan-art.md) |
| Garrus | [PNG](../../public/assets/companion-garrus-combat.png), [JSON](../../public/assets/companion-garrus-animation.json) | [Prompts](companion-combat-garrus-prompts.json), [notes](companion-combat-garrus-art.md) |
| Tali | [PNG](../../public/assets/companion-tali-combat.png), [JSON](../../public/assets/companion-tali-animation.json) | [Prompts](companion-combat-tali-prompts.json), [notes](companion-combat-tali.md) |
| Wrex | [PNG](../../public/assets/companion-wrex-combat.png), [JSON](../../public/assets/companion-wrex-animation.json) | [Prompts](companion-combat-wrex-prompts.json), [notes](companion-combat-wrex-art.md) |
| Liara | [PNG](../../public/assets/companion-liara-combat.png), [JSON](../../public/assets/companion-liara-animation.json) | [Prompts](companion-combat-liara-prompts.json), [notes](companion-combat-liara.md) |

Les images font 1536 × 1024 et conservent un alpha natif. Les rectangles ne supposent pas une grille régulière. Au seuil alpha 51, correspondant à l’alpha-test 0,2 du renderer, chaque pixel visible appartient à une seule pose ; les silhouettes conservent des marges dans leurs cadres. De faibles franges colorées d’alpha inférieur persistent dans les sorties natives. Elles sont documentées et aucun nettoyage de pixels n’est revendiqué. Kaidan a demandé trois générations ; les essais refusés sont distingués dans sa provenance.

La pose d’action représente un geste générique. Elle ne donne aucun pouvoir supplémentaire : Ashley reste sans capacité biotique ajoutée, Tali conserve sa combinaison et son visage masqué. Les armes dessinées sont génériques, peuvent varier entre poses et ne représentent pas tous les équipements réellement portés. Les variantes exactes d’armure et d’arme, les transitions, les cycles complets et les directions supplémentaires restent à produire.

Le rendu vérifie les six identités courtes de la campagne ME1, leur sprite, leur équipe et leur contexte. Un personnage homonyme d’un autre opus ou segment ne reçoit pas ces poses. Les atlas de terrain et la personnalisation de Shepard restent distincts. Les images ne modifient ni statistiques, ni inventaire, ni recrutement, ni décès narratif.

Le [contrôle technique](../qa/companion-combat-art-report.json), la [revue des atlas](../qa/companion-combat-native-art-review.json), la [fixture du vrai renderer](../qa/companion-combat-world-report.json) et le [rapport de livraison](../qa/companion-combat-report.json) séparent les preuves. Le rendu isolé force explicitement les états pour inspecter les 24 poses ; le parcours public utilise des sauvegardes de préparation déclarées et des commandes réelles. Aucun de ces contrôles ne certifie une fidélité intégrale 1:1 aux jeux d’origine.

Les changements de cadrage utilisent la matrice UV sans invalider l’image source à chaque frame. La [mesure avant/après](../qa/companion-combat-texture-update-report.json) rejoue 50 appels sur les deux versions du vrai renderer et vérifie les uniformes de Three.js 0.180.0. Elle confirme la suppression d’invalidations inutiles, sans mesure de débit GPU ou certification de gain FPS. Le clonage initial, les cadrages, les pivots et les autres chemins de textures restent conservés.

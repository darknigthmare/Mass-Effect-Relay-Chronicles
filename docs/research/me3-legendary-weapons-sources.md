# Suppressor et Raider dans l’atelier ME3 Legendary

Relevé du 2 novembre 2026, depuis `05d1f030dab0925d57d4ba8c5bdb9ccde8db1ad0`. Deux modèles existants deviennent sélectionnables dans **Chroniques → ME3 → Atelier des équipements Legendary Edition** : `ME3-WPN-SUPPRESSOR` et `ME3-WPN-RAIDER`. Ce chantier n’ajoute aucune nouvelle identité, fiche Simulation, mission, arme à la campagne ME1 ou droit de classe.

## Sources et décision de périmètre

La [page produit Legendary Edition](https://www.ea.com/games/mass-effect/mass-effect-legendary-edition) et [Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations) ont été téléchargés avec succès en HTTP 200. EA indique collectivement l’inclusion de plus de 40 DLC, avec armes, armures et packs promotionnels, puis leur intégration à la progression par achats ou recherches. Ces deux pages ne nomment ni Suppressor ni Raider. Aucune acquisition précise, magasin, rang, coût ou récompense n’est déduit de cette déclaration.

| Identifiant existant | Association explicitement enregistrée | Portée de la référence héritée |
|---|---|---|
| `ME3-WPN-SUPPRESSOR` | « Pistolet de Citadel », condition « DLC Citadel ». | `ME3-SRC-SUPPRESSOR` : fiche individuelle communautaire M-11 Suppressor, relevée par le catalogue le 22 octobre ; aucune nouvelle lecture de l’article complet revendiquée. |
| `ME3-WPN-RAIDER` | « Arme ajoutée avec Leviathan », condition « Leviathan / édition ». | `ME3-SRC-BW-LEV` : annonce officielle historique « Leviathan & Firefight DLC and Wii U information », consignée dans le catalogue ; aucune nouvelle lecture de l’annonce complète revendiquée. |

Le [relevé des réponses et réserves](../qa/me3-legendary-weapons-reference-report.json) conserve URLs, empreintes et portées. La page actuelle du produit ME3 répond également HTTP 200, mais n’apporte pas d’association individuelle exploitable. Les trois anciennes routes EA Firefight, Groundside Resistance et N7 Digital Deluxe essayées répondent HTTP 404 et sont exclues des preuves.

Les sept autres candidats conventionnels — Harrier, Typhoon, Valkyrie, Piranha, Indra, Valiant et Hurricane — restent fermés. Leurs notices héritées signalent seulement l’arsenal étendu ou une édition à vérifier avec un index générique. La preuve collective EA ne suffit pas à compléter leur association individuelle au contenu. Les armes à charge, rayon, projectiles spéciaux, lourdes locales et les restrictions d’autres œuvres restent inchangées.

## Comportement ajouté et limites

Les deux profils possèdent `requiredEditionProfile: legendary`. Leur autorisation est ajoutée uniquement à l’atelier ME3 Legendary canonique, dont la condition de préparation nomme désormais aussi Leviathan. Un champ d’édition ajouté à une sauvegarde, un atelier standard, un autre opus ou segment ne donne aucun accès. Les limites de porteur, famille d’arme et emplacement restent indépendantes.

Les profils techniques existaient déjà : pistolet pour Suppressor, fusil à pompe pour Raider, avec clips et réserves **ATB** finis. Aucun bonus de dégâts, précision, tête, portée ou cadence n’est créé. Les deux armes ne deviennent pas compatibles avec les modules de fusils d’assaut ou de mitraillettes. Les ateliers totalisent **107 équipements fonctionnels : 79 armes, 25 armures et trois familles de modules**.

Les modèles illustrés, sons, animations, chargeurs, réserves, dispersion, recul, zoom, cadence, bonus originaux et voies d’acquisition restent incomplets. Ce lot réutilise les primitives de famille existantes ; il ne reproduit pas tous les comportements propres aux armes d’origine et ne certifie aucune fidélité intégrale 1:1.

Le [contrôle natif](../qa/me3-legendary-weapons-native-report.json) compare les 224 profils et les 25 scénarios à la base, rejoue les 25 combats par défaut et les 280 résultats historiques, vérifie les 218 consultations fermées, les nouvelles consommations et la sérialisation. Le parcours navigateur de production est une preuve distincte ; sa présence dans le dépôt ne vaut réussite que si son rapport est positif.

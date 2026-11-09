# Ennemis ME1 Horizon — cinq corps et six rencontres adaptées

Le lot reprend `main` à `2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75`. Il ajoute **cinq profils natifs et cinq dessins fixes**, sans nouveau cycle de quatre poses ni nouveau système de projectile. Les valeurs de combat, distances et hauteurs sont adaptées au JRPG ATB. Elles ne sont pas des statistiques ou dimensions originales certifiées.

| Fiche existante | Clé native | Action réellement disponible | Limites conservées |
|---|---|---|---|
| `ENM-drone-lance-roquettes` | `rocket-drone` | Tir et chaleur ATB | Ni roquette explosive, ni zone évitable, ni trajectoire de vol originale |
| `ENM-sapeur-geth` | `sapper` | Tir et véritable Sabotage ATB des armes | Locomotion bondissante, kit et valeurs exactes selon l’édition à vérifier |
| `ENM-armature-geth` | `armature` | Tir ATB ; corps quadrupède plus grand | Charge de canon, arc de tir, locomotion et résistances originales absents |
| `ENM-colosse-geth` | `colossus` | Tir ATB plus lent ; grand corps quadrupède | Combat Mako, projectile, réorientation et résistances originales absents |
| `ENM-maitre-de-guerre-krogan` | `battlemaster` | Tir et Barrière ATB du krogan remplacé | Aucun kit complet, ruée, régénération ou nouvelle phase originale |

Le Fantôme reste **Défini** : sa fiche exige de confirmer ses différences avant production et aucune référence suffisante n’a été obtenue. Il n’est pas fusionné avec le sapeur ou le traqueur. Les varrens appartiennent au module de faune séparé ; ils ne sont pas ajoutés aux formations principales de ce lot.

## Rencontres et continuité

| Secteur existant | Révision de départ | Horizon | Budget PV + bouclier avant → après |
|---|---|---|---|
| Féros, rencontre 1 | geth, geth, sniper | armature, geth, sniper | 385 → 405 |
| Novéria, rencontre 1 | geth, destructeur | drone lance-roquettes, destructeur | 365 → 365 |
| Ilos, rencontre 2 | destructeur, sniper | sapeur, sniper | 360 → 325 |
| Virmire, rencontre 2 | juggernaut, krogan | colosse, krogan | 520 → 555 |
| Citadelle finale, rencontre 1 | geth, sniper, destructeur | geth, sniper, juggernaut | 490 → 520 |
| Thérum, rencontre finale existante | krogan, geth, sniper | maître de guerre, geth, sniper | 510 → 510 |

Les huit types Frontier restent rencontrables. Le Juggernaut se retrouve dans les défenses finales de la Citadelle ; il ne disparaît pas du jeu quand le Colosse prend son emplacement de Virmire. Les geth restent dans des lieux tenus par les geth. L’Armature accompagne la route d’ExoGeni ; le Colosse occupe une approche extérieure de l’installation de Virmire. Ces apparitions et formations restent condensées : elles ne reproduisent pas les positions, effectifs ou trajets Mako originaux.

Le maître de guerre est placé dans la rencontre existante de protection du site de Liara à Thérum. Il remplace l’identité du krogan générique, avec **exactement 210 PV, 45 boucliers, 25 attaque, 9 défense, 0,66 vitesse et le pouvoir `barrier`**. Aucun drapeau `boss`, phase, ordre, dialogue, récompense ou rencontre supplémentaire n’est créé. Le nom, le corps et la présence à ce lieu constituent la portée du changement.

Toutes les autres formations de boss et tout Eden Prime restent identiques. Les 21 identifiants de rencontre, leur ordre, leurs récompenses et leurs portes de progression sont conservés. Une sauvegarde déjà sécurisée conserve son identifiant de secteur et ne rejoue pas l’affrontement. La campagne et les Chroniques gardent leur isolation.

## Budgets et comparaison native

La comparaison [`horizon-enemies-balance.json`](../qa/horizon-enemies-balance.json) charge les vrais profils et formations de `2ab3f7c` avec `git show`, puis conserve le moteur et la politique déterministe existants. Les snapshots proviennent de campagnes réellement gagnées avec achats et recrutements natifs. Les essais secondaires ne versent pas leurs récompenses dans la campagne.

Le résultat final comprend **324 paires / 648 combats détachés**, sur six classes, trois difficultés et trois seeds par secteur. Les deux versions gagnent les 324 cas, sans KO supplémentaire ni alerte de baisse du plancher de santé supérieure à 15 points. Les **18 parcours de campagne atteignent 378 victoires et leur fin**. Les résultats restent limités à une politique automatique en mode Attente et à un ordre de missions ; ils ne remplacent pas l’équilibrage humain ou le mode Actif.

L’Armature initiale à 130 PV / 45 boucliers / 17 attaque / 5 défense provoquait une alerte de −24,38 points chez un Franc-tireur difficile à Féros, sans défaite. Le [rapport initial](../qa/horizon-enemies-balance-initial.json) et sa [source exacte](../qa/horizon-enemies-balance-initial-sources/src/horizon-enemies.js) sont conservés. Le profil final devient 110 PV / 40 boucliers / 16 attaque / 4 défense / 0,55 vitesse : plus résistant qu’un soldat, mais plus lent. Les cinq autres changements n’ont pas requis d’ajustement. Le remplacement du krogan de Thérum a exactement zéro différence mesurée.

## Génération native et cadrages

Les sources visuelles de style `frontier-enemies.png` et `vehicle-atlas.png` ont été ouvertes avant génération. Ce sont des prototypes existants, pas des modèles primaires certifiés. Le [prompt initial](horizon-enemies-prompt.txt), les [corrections morphologiques](horizon-enemies-edit-2.txt), la [correction du fond](horizon-enemies-edit-3.txt) et la [provenance](horizon-enemies-generation.json) conservent les étapes exactes.

La première génération a été refusée : son Colosse était un robot bipède. L’édition suivante rétablissait quatre jambes mais possédait un fond diffus en faible alpha et débordait la cellule nominale. La troisième sortie conserve cinq corps entiers et deux machines quadrupèdes lisibles, avec transparence native. Le PNG retenu est une copie octet pour octet de `/workspace/generated_images/exec-71b0e6db-8214-4f05-be05-16db9ef339b7.png` vers `public/assets/horizon-enemies.png`. **Aucun pixel n’a été retouché ou rééchantillonné.**

Le PNG RGBA mesure **1536 × 1024**, avec alpha 0–254. Les cinq rectangles publiés sont mesurés sur les pixels d’alpha supérieure à 8, puis entourés d’au moins huit pixels de marge. Le cadrage du Colosse traverse légèrement la frontière théorique des 512 pixels, dans une gouttière vide ; il ne contient aucun pixel du voisin. La sixième cellule est vide au seuil visible ; quelques pixels natifs d’alpha1 restent sur le fond. Les pivots sont mesurés pour l’ancrage au sol, avec un pivot horizontal décentré pour le Colosse dont le canon dépasse sur la gauche.

Les trois présentations natives clair/sombre/échelle ont été réellement ouvertes et revues : [`horizon-enemies-native-review.json`](../qa/horizon-enemies-native-review.json). Les cinq corps sont complets, distincts et lisibles. Les quatre pieds des deux machines restent visibles, la face organique krogan est distincte des unités synthétiques et le drone conserve ses nacelles. Cette lecture confirme le cadrage et la morphologie grossière, sans valider les panneaux d’armure, canons, couleurs, visage ou dimensions contre les modèles originaux.

Les hauteurs de scène sont 1,6 pour le drone, 2,85 pour le sapeur, 4,4 pour l’Armature, 5,6 pour le Colosse et 3,25 pour le krogan. Le drone reçoit une élévation de présentation de 0,65. Ce sont des réglages de cadrage, sans équivalence en mètres canoniques.

## Références et réserves

Le guide officiel Prima du catalogue a été retéléchargé et son texte inspecté : l’extrait couvre 23 pages du prologue. Aucun des cinq nouveaux types n’y a été retrouvé par son nom. Il ne fournit donc pas de corps ou de kit complet utilisable comme preuve de conformité de ce lot. La page secondaire Geth Sapper de Fandom répond **HTTP 402** ; son contenu n’a pas été consulté et aucun contournement n’a été appliqué.

Les noms et critères de production proviennent des fiches existantes, dont le niveau de canon demeure « Référence à vérifier ». Les valeurs chiffrées, gabarits, dessins et enchaînements sont explicitement des adaptations. Les critères originaux restent conservés : zone explosive évitable, arc de tir, Mako pertinent et récupérations/kit complets ne deviennent pas terminés par l’ajout de ces corps. Aucune fidélité artistique ou mécanique 1:1 n’est déclarée.

## Reproduire les contrôles

- `node --test tests/horizon-enemies.test.js` : cinq tirs réels, Sabotage et Barrière natifs, budgets, six seules substitutions, 21 historiques/sauvegardes, métadonnées et refus de contexte.
- `python scripts/horizon-enemies-art.py` : source/copie exactes, alpha, rectangles, marges et revue réellement ouverte.
- `node scripts/horizon-enemies-art-preview.mjs` : présentation native des mêmes octets sur deux fonds et cinq crops SVG indicatifs.
- `node scripts/horizon-enemies-balance.mjs` : 324 comparaisons et 18 campagnes. Il requiert la référence Git de départ ; préserver le rapport précédent avant nouvelle exécution.
- `GAME_URL=http://127.0.0.1:4181 HORIZON_ENEMIES_QA_PREFIX=horizon-enemies-browser node scripts/horizon-enemies-browser.mjs` : six formations, cinq corps et Juggernaut conservé, ordres ATB natifs, refus étrangers, ambiance et nettoyage. Les fixtures antérieures sont préparées explicitement, sans prétendre que le navigateur les a jouées.

Le [parcours WebGL courant](../qa/horizon-enemies-dev-final-02.json) réussit les six formations et l’ambiance de Féros sur le renderer gelé `29b8a20a`. Ses [sept captures réellement ouvertes](../qa/horizon-enemies-dev-final-02-visual-review.json) montrent les cinq corps nouveaux et le Juggernaut conservé, sans fragment d’atlas voisin ni masquage de décor sur les groupes. Les tirs, Sabotage et Barrière consomment leur ATB natif ; les gardes de période, restaurations et nettoyages réussissent, sans mutation de sauvegarde. Le premier rapport est conservé : il comparait par erreur la clé `sniper` au sprite `geth-sniper` et s’arrête avant toute capture ; seule cette comparaison du collecteur a été corrigée. Les tests et le build globaux, le parcours public compilé, la synchronisation Excel et le commit relèvent du parent intégrateur.

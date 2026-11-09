# Huit types ennemis supplémentaires de ME1 — 9 novembre 2026

Ce lot part de `ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd`. Il ajoute huit profils ennemis natifs et huit corps illustrés, dans six formations régulières existantes de la campagne. Ce sont des **prototypes partiels** : statistiques adaptées à l’ATB, une seule pose fixe par type, présentation de combat procédurale. Aucun kit original complet, modèle 3D, cycle animé ni fidélité 1:1 n’est certifié.

| Identifiant du catalogue | Clé native / sprite | Action réellement exécutée |
|---|---|---|
| `ENM-drone-de-reconnaissance-geth` | `recon-drone` | Tir ATB, chaleur et couverture |
| `ENM-drone-d-assaut-geth` | `assault-drone` | Tir ATB ; budget du soldat geth remplacé conservé |
| `ENM-lance-roquettes-geth` | `rocket-geth` | Tir ATB générique ; aucun projectile explosif annoncé |
| `ENM-soldat-de-choc-geth` | `shock-geth` | Tir ATB ; protection renforcée |
| `ENM-juggernaut-geth` | `juggernaut` | Tir ATB ; profil lourd plus lent |
| `ENM-traqueur-geth` | `stalker` | Tir ATB ; profil léger rapide, sans grimpe |
| `ENM-rachni-ouvrier` | `rachni-worker` | Assaut organique `strike` sans chaleur, sans explosion |
| `ENM-tourelle-automatisee` | `turret` | Tir ATB, corps fixe ; aucun secteur de tir géométrique |

`src/frontier-enemies.js` fournit les profils, les limites mécaniques par type et le lookup du corps. Il n’importe pas `game-data.js` ni `world-data.js`. `src/game-data.js` inclut ces profils dans `ENEMIES`. Aucun pouvoir biotique ou kit d’un opus ultérieur n’est attribué à ces nouvelles unités.

## Rencontres et continuité

Seules ces six lignes changent. Les indices, identifiants de secteur, nombres d’adversaires, récompenses, prérequis et historiques de sauvegarde restent stables.

| Secteur existant | Avant | Après | Total PV + bouclier avant → après, hors multiplicateur de progression |
|---|---|---|---|
| `therum:encounter-1` | geth, sniper | recon-drone, rocket-geth | 255 → 235 |
| `therum:encounter-2` | geth, destroyer | shock-geth, turret | 365 → 370 |
| `noveria:encounter-2` | rachni × 3 | rachni-worker, rachni × 2 | 405 → 340 |
| `virmire:encounter-1` | geth, sniper, krogan | assault-drone, sniper, krogan | 510 → 510 |
| `virmire:encounter-2` | destroyer, krogan | juggernaut, krogan | 490 → 520 |
| `ilos:encounter-1` | geth, destroyer | stalker, destroyer | 365 → 365 |

Les geth restent dans des secteurs déjà tenus par les geth ; la tourelle garde l’accès minier de Thérum ; l’ouvrier accompagne deux soldats rachni dans les laboratoires de Novéria. Ce placement condensé reste une adaptation, sans relevé de chaque apparition du jeu original. **Toutes les formations d’Eden Prime, de Feros et de boss sont inchangées**, y compris le premier combat lié à Jenkins. Les sept zones gardent leurs 21 identifiants de combat. Une sauvegarde déjà sécurisée contient ces identifiants de secteur, sans liste de l’ancienne formation ; elle ne rejoue pas le combat et ne reçoit pas une seconde récompense.

La [comparaison déterministe](../qa/frontier-enemies-balance.json) confronte les six substitutions aux vrais profils de la révision de départ, chargés par `git show`. Elle conserve le moteur actuel et la politique du simulateur de campagne existant. Pour chaque classe et difficulté Story/Normal/Hard, les snapshots proviennent de campagnes réellement gagnées, avec achats payés, recrutement et portes de progression. Trois seeds par snapshot produisent **324 paires / 648 combats détachés**, à équipement, niveau et ressources identiques. Les récompenses des comparaisons ne modifient pas la campagne.

Résultat final : **324 victoires avant et après, aucun KO, aucune alerte** de défaite, KO supplémentaire ou baisse du plancher de santé supérieure à 15 points. Les 18 parcours de campagne atteignent **378 victoires et la fin**. Écart moyen de durée par formation : −0,839 s ; +0,531 s ; −2,908 s ; 0 s ; +2,033 s ; +0,739 s. Le pire écart de plancher de santé est −5,31 points pour la formation mixte rachni. La politique utilise le mode Attente et un seul ordre de missions : elle ne remplace pas les essais humains ou le mode Actif.

Le [rapport initial](../qa/frontier-enemies-balance-initial.json) conserve trois alertes sur Virmire avec le drone d’assaut à 110 PV / 18 attaque / 0,88 vitesse. Une réduction intermédiaire ne supprimait pas toute la variance de focus. Le profil final conserve donc exactement le budget ATB du geth remplacé : 95 PV, 35 bouclier, 15 attaque, 3 défense, 0,74 vitesse. L’apparence, l’identité et la présentation en sustentation restent distinctes. Les huit nombres de profils ne sont pas des statistiques originales certifiées. Le contrôle Normal préliminaire, antérieur à cet ajustement, reste séparé dans `frontier-enemies-campaign-normal-initial.json`.

## Production et contrôle de l’image

Les références existantes `enemy-atlas.png` et `vehicle-atlas.png` ont été ouvertes avant génération. Le [prompt exact et sa provenance](frontier-enemies-prompts.json) décrivent l’unique sortie de `image_gen.imagegen`. Le PNG natif `/workspace/generated_images/exec-bbf157c5-3816-48b1-9d9f-aa8d1d15f6eb.png` est copié octet pour octet vers `public/assets/frontier-enemies.png` : RGBA **1536 × 1024**, SHA-256 `6db26ffbb1288dc9a5b9f16f88f58912d181c656c7b9c21cb2fd19fc8372ece9`. Aucun pixel n’a été retouché ou rééchantillonné. Pillow et NumPy servent uniquement à lire et mesurer.

Le placement obtenu ne suit pas huit cellules identiques : la tête du Juggernaut commence à y494. Les huit rectangles publiés dans `frontier-enemies.json` suivent les silhouettes réelles, avec **au moins huit pixels de marge autour de toute alpha supérieure à 8/255**. Les silhouettes ainsi définies sont assignées une seule fois, sans contamination des voisins. Des pixels natifs très faibles, notamment alpha1, subsistent hors des rectangles ; ils ne sont pas présentés comme une transparence parfaite. Le [rapport technique](../qa/frontier-enemies-art.json) conserve leurs comptes, les bornes, marges, pivots et empreintes.

Le viewer natif a présenté une image noire malgré les octets RGBA valides. Le même PNG a donc été ouvert dans Chromium à sa taille native sur fonds clair et sombre, puis les huit cadrages ont été inspectés à l’échelle indicative de 130 px par corps humanoïde. Les trois captures, réellement ouvertes, sont décrites dans la [revue native](../qa/frontier-enemies-native-review.json) et le [rapport de présentation](../qa/frontier-enemies-art-preview.json). Les corps sont entiers, séparés et lisibles. Le traqueur emprunte fortement le langage de l’Armature de la référence ; ses proportions et membres nécessitent une correction sur référence primaire avant toute validation d’identité exacte.

`normalizeFrontierEnemyAtlas` refuse les œuvres/périodes étrangères, chemins distants, identités incorrectes, familles incomplètes, rectangles hors image ou superposés et pivots invalides. Il dérive un identifiant de corps `${key}-body`. Le lookup de combat exige `enemy:true`, l’équipe ennemie, un sprite identique à la clé et l’identifiant natif `${key}-<entier>`. Le lookup d’ambiance est séparé : vrai secteur de la bonne zone, type `encounter`, premier sprite natif attendu et identifiant `ambient:${poi.id}`. Une référence de Chroniques, un alias d’équipier ou un contexte explicite ME2/ME3/MEA n’accorde aucun corps ME1.

## Sources primaires et réserves de fidélité

Le [guide Prima officiel](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé et inspecté après génération : 23 pages, 4 677 689 octets, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Les pages PDF 9 et 16 ont été ouvertes visuellement ; la [revue des sources](../qa/frontier-enemies-sources.json) distingue ces observations des intentions du prompt.

La page PDF 9 / imprimée 65 nomme le drone de reconnaissance et décrit ses tirs faibles, boucliers légers et immunité physique à Projection, Lévitation et Singularité. Le profil léger et la présentation élevée ne reproduisent pas cette immunité ni son vol. Le châssis illustré diverge encore de la petite vue nommée. La page PDF 16 / imprimée 72 nomme le soldat de choc et ses capacités Carnage, Geth Barrier et Shield Boost, avec des barrières de couvert destructibles. Ces capacités restent absentes : le pouvoir biotique générique `barrier` n’est pas substitué à une construction de couvert geth.

L’extrait ne fournit pas de corps primaire complet nommé pour les six autres types ni un relevé exhaustif de leurs lieux. Les drones, le lanceur, le Juggernaut, le traqueur, l’ouvrier et la tourelle restent des interprétations générées. Les déplacements de vol/grimpe, projectiles et télégraphes de roquette, explosion/autodestruction de l’ouvrier, secteur de tir de tourelle, armes exactes et poses d’action/impact/défaite dédiées restent à produire. Les mises à jour du suivi doivent conserver les critères d’acceptation initiaux et ces réserves.

## Vérifications reproductibles

- `node --test tests/frontier-enemies.test.js` : profils, huit attaques réelles, six seules formations modifiées, budget, continuité des 21 secteurs/sauvegardes, normalisation et frontières de contexte/identité, ambiance native.
- `python scripts/frontier-enemies-art.py` : huit silhouettes, marges, pivots, alpha, native/copie et revue réellement ouverte.
- `node scripts/frontier-enemies-art-preview.mjs` : présentation native clair/sombre et cadrages CSS à petite échelle, sans production d’un asset retouché.
- `node scripts/frontier-enemies-balance.mjs` : 324 paires et 18 parcours de campagne ; source du moteur inchangée.
- `node scripts/frontier-enemies-browser.mjs` : six formations natives dans leurs décors WebGL, huit corps/actions, refus d’œuvre étrangère, aperçu d’ambiance et nettoyage des crops. Voir son rapport courant avant de revendiquer un succès navigateur.

Les tests et captures techniques n’attribuent aucun statut `Validé`. Le build de production et la passe de régression globale relèvent de l’intégration du lot parallèle.

La [revue visuelle finale des sept captures WebGL](../qa/frontier-enemies-world-review.json) a réellement ouvert les six formations et l’aperçu d’ambiance. Les **huit nouvelles silhouettes sont visibles**, séparées du décor au premier plan. À Ilos, la revue initiale avait détecté le traqueur caché par les deux dalles historiques de passerelle. Le propriétaire du renderer a conservé leurs supports, géométrie et collisions, en masquant seulement les dalles en combat. La reprise finale constate le traqueur et le Destructeur entiers. La [revue initiale négative](../qa/frontier-enemies-world-review-before-ilos.json) et ses captures restent archivées.

Le rapport navigateur final utilise une fixture détachée Shepard/Garrus/Tali, trois identités possibles après la Citadelle sur chacun des six secteurs, avec statistiques par défaut et jauges ennemies explicitement prêtes. Il ne prétend pas qu’un nouveau jeu vient réellement d’atteindre ces lieux. Les anciens screenshots utilisaient le groupe initial avec Jenkins ; ils sont conservés avec cette réserve dans `frontier-enemies-browser-before-ilos.json`. Les tests de continuité et les 18 parcours déterministes restent les preuves séparées des recrutements, décès, récompenses et sauvegardes.

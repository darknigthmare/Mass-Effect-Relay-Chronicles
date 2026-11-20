# Armax Relay Clash — lot 10

## Livraison

Le lot 10 illustre **13 fiches auparavant sans image** : huit personnages ou ennemis d’Andromeda, la tenue de loyauté de Tali dans ME2 et quatre stages. Il conserve **15 PNG originaux** : treize versions sélectionnées et deux R0 écartés après revue. Les dix-huit appels de génération comprennent quinze sorties et trois refus sans fichier ; aucun sujet refusé n’a été relancé.

Le [catalogue courant](production-catalog.json) conserve les **164 identifiants et leurs 820 champs d’identité** du lot 09. **48 fiches ont désormais une image candidate et 116 restent sans image**. Le corpus Armax atteint **141 PNG originaux**, hors trois aperçus historiques. Ces chiffres décrivent la présence de fichiers : les images du lot restent **Prototype**, sans fidélité 1:1 certifiée, animation complète ou intégration moteur.

Base de continuation : `9321b4f77d8f857d8c40265c0fca70e03121a4ea`. Le lot s’ajoute à la branche de la [PR nº 6](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/pull/6). Le [lot 09](../lot09/README.md) et les livraisons antérieures restent conservés.

## Sujets produits

### Personnages et ennemis

| Fiche existante | Apparence et pose produites | PNG |
|---|---|---|
| Eiroch — Andromeda | Créature standard bleue, vue presque frontale sur les poings ; hors Ancient Eiroch | [eiroch-mea-front.png](../../../public/assets/armax/lot10/fighters/eiroch-mea-front.png) |
| Fiend kett — Andromeda | Modèle standard équipé de brassards verts, trois quarts vers la gauche | [kett-fiend-mea-three-quarter-left.png](../../../public/assets/armax/lot10/fighters/kett-fiend-mea-three-quarter-left.png) |
| Destined kett — Andromeda | Crête osseuse, haute collerette et armure verte/cyan, vue frontale | [kett-destined-mea-front.png](../../../public/assets/armax/lot10/fighters/kett-destined-mea-front.png) |
| Moshae Sjefa — MEA | Tenue propre à la Moshae, prune et gris clair, ornements dorés, trois quarts vers la droite | [moshae-sjefa-mea-three-quarter-right.png](../../../public/assets/armax/lot10/fighters/moshae-sjefa-mea-three-quarter-right.png) |
| Ascendant kett — Andromeda | Modèle standard en lévitation, longs pans verts, sans orbe ajouté | [kett-ascendant-mea-three-quarter-left.png](../../../public/assets/armax/lot10/fighters/kett-ascendant-mea-three-quarter-left.png) |
| Observer reliquat — Andromeda | Carapace anguleuse, deux rubans mécaniques et câbles bleus, sans faisceau de tir | [remnant-observer-mea-three-quarter.png](../../../public/assets/armax/lot10/fighters/remnant-observer-mea-three-quarter.png) |
| Architecte reliquat — Andromeda | Modèle déployé, structure segmentée et tête radiale, émissions rouges | [remnant-architect-mea-deployed.png](../../../public/assets/armax/lot10/fighters/remnant-architect-mea-deployed.png) |
| Destroyer reliquat — Andromeda | Modèle standard gris/cyan, tourelles latérales et appuis mécaniques | [remnant-destroyer-mea-three-quarter-left.png](../../../public/assets/armax/lot10/fighters/remnant-destroyer-mea-three-quarter-left.png) |

Les noms affichés ci-dessus servent à la lecture. Les champs `category/name/work/dlc/variant` du [manifeste personnages](fighters-manifest.json) reprennent exactement les identités du catalogue parent, y compris ses conventions « MEA » et « Andromeda ».

Les références primaires proviennent des modèles publiés par Sperasoft/Eugene Chernov, Furio Tedeschi, Christopher Cao, Frédéric Daoust, Mathew Makin et l’équipe personnages BioWare. Les recherches de Fiend sans brassards et les variantes exploratoires d’Observer sont explicitement écartées. L’identification du Destroyer repose sur la concordance du modèle « REM_Reg » avec une capture portant le nom « Destroyer » dans le HUD ; cette capture sert à l’identification, pas à recopier sa surbrillance rouge.

### Costume

| Fiche existante | Variante | PNG |
|---|---|---|
| Tali’Zorah — ME2 | Tenue de loyauté, capuche et tissu gris à motifs, combinaison noire, attaches dorées ; vue trois quarts vers la gauche | [tali-me2-loyalty-three-quarter-left.png](../../../public/assets/armax/lot10/costumes/tali-me2-loyalty-three-quarter-left.png) |

Le [manifeste costumes](costumes-manifest.json) décrit le fichier obtenu. La capture frontale complète publiée par Rylvan en 2013 est croisée avec la géométrie du modèle de Jaemus Wurzbach. L’auteur de l’extraction frontale n’est pas établi ; les petits motifs et la palette sous l’éclairage restent à comparer au jeu. Les deux pages Listal de Tali contiennent le même fichier : elles ne constituent pas deux angles indépendants.

### Stages

| Fiche existante | Sous-zone retenue | PNG |
|---|---|---|
| Omega — ME3, DLC Omega | Réacteur, plateforme et poste central selon les vues de Scotty Brown | [omega-me3-reactor-master.png](../../../public/assets/armax/lot10/stages/omega-me3-reactor-master.png) |
| Bekenstein — ME2, Kasumi: Stolen Memory | Balcon extérieur de Donovan Hock, bassin et auvent | [bekenstein-me2-hock-terrace-master.png](../../../public/assets/armax/lot10/stages/bekenstein-me2-hock-terrace-master.png) |
| Eden Prime — ME1 | Plateforme de la balise pendant l’attaque, palette rouge de l’édition originale | [eden-prime-me1-beacon-platform-master.png](../../../public/assets/armax/lot10/stages/eden-prime-me1-beacon-platform-master.png) |
| Citadelle — ME1 | Chambre du Conseil, vue oblique du sol vitré et des balcons | [citadel-me1-council-chamber-master.png](../../../public/assets/armax/lot10/stages/citadel-me1-council-chamber-master.png) |

Le [dossier stages](STAGES.md) précise les caméras, les références et les limites. Les décors suivent les architectures observées : le bassin de Hock et les vides d’Omega ne sont pas recouverts par un plancher de duel inventé. Le Conseil reste une vue étagée ; ces masters aplatis ne fournissent pas encore les collisions ou une arène latérale jouable.

## Corrections conservées

| Sujet | R0 conservé | Décision |
|---|---|---|
| Bekenstein / Hock | [bekenstein-me2-hock-hall-r0.png](../../../public/assets/armax/lot10/stages/bekenstein-me2-hock-hall-r0.png) | Le hall à deux escaliers reproduit une autre sous-zone. La version retenue suit la figure 007 du guide Prima, explicitement située sur le balcon extérieur. |
| Eden Prime | [eden-prime-me1-beacon-platform-r0.png](../../../public/assets/armax/lot10/stages/eden-prime-me1-beacon-platform-r0.png) | Deux arcs cyan de ciblage avaient été conservés comme lumière physique. Ils sont retirés dans la version sélectionnée après revue indépendante. |

La capture Legendary Edition consultée pour Eden Prime sert uniquement à contrôler l’absence du marqueur d’interface hors ciblage ; elle n’a pas été passée à la génération et ne gouverne pas la palette du décor. Le sommet de la balise reste hors cadre comme dans la capture d’origine ; son pied et ses inscriptions demandent encore une comparaison précise. Le maintien général du cadrage après correction a été revu visuellement, sans affirmer une invariance de tous les pixels hors zone d’édition.

## Demandes sans sortie

| Costume | Résultat de l’unique appel lot 10 | Identifiant de requête |
|---|---|---|
| Grunt — ME2, tenue de loyauté | Refus en sortie ; catégorie renvoyée « other » ; aucun PNG | `ed415b35-067d-4430-ae42-34f1c2d24ed8` |
| Shepard masculin — ME3, Reckoner Knight | Refus en sortie ; catégorie renvoyée « other » ; aucun PNG | `d38401a9-f207-49a6-9dd4-bd294e14ae74` |
| Jacob Taylor — ME2, tenue de loyauté | Refus en sortie ; catégorie renvoyée « other » ; aucun PNG | `5969e110-d8f7-47ca-99b2-e7efa4b67583` |

Les prompts exacts et les réponses d’erreur sont conservés dans le [journal personnages/costumes](generation-attempts.json). Ces trois fiches restent sans image, comme les neuf refus hérités. Aucun refus n’est présenté comme une réussite ou contourné par une autre variante du même sujet.

Le listing progresse aussi pour les armures masculines **Cerberus Assault ME2**, **Ajax ME3** et **Blood Dragon ME2** : les références partielles inspectées et leurs limites sont enregistrées, mais les pieds ou les jambes manquants empêchent encore une génération suffisamment référencée.

## Catalogue et classeur

| Catégorie | Fiches | Avec image après lot 09 | Nouveaux sujets lot 10 | Avec image après lot 10 | Sans image |
|---|---:|---:|---:|---:|---:|
| Personnages et ennemis | 79 | 13 | 8 | 21 | 58 |
| Costumes | 38 | 9 | 1 | 10 | 28 |
| Stages | 47 | 13 | 4 | 17 | 30 |
| **Total** | **164** | **35** | **13** | **48** | **116** |

Parmi les 116 fiches sans image, **12 ont un dernier essai refusé** et **104 n’ont pas été tentées**. Le suivi ne confond pas une référence trouvée, une sortie générée et une validation de fidélité.

- [Listing des manquants](MANQUANTS_2026-11-20.md)
- [Catalogue JSON](production-catalog.json)
- [Classeur Excel](Mass_Effect_Armax_Suivi_Lot10_2026-11-20.xlsx)
- [Bibliothèque de références consolidée](reference-library.json)
- [Notes de références et exclusions](REFERENCE_NOTES.md)

Le classeur conserve les onglets **Synthese**, **Catalogue** et **Recuperes**, avec formules de comptage et liens de traçabilité. Son [rapport de vérification](workbook-verification.json) documente le recalcul, les aperçus rendus et les empreintes des entrées qui ont servi à l’export. Aucune ouverture dans l’application Excel native n’est revendiquée.

## Vérifications et limites

Les [manifestes personnages](fighters-manifest.json), [costumes](costumes-manifest.json) et [stages](stages-manifest.json) conservent dimensions, modes, empreintes et sorties originales. Les PNG sont copiés sans recadrage, recoloration ou rééchantillonnage externe. Les binaires des références tierces restent hors dépôt.

La [revue indépendante des personnages et du costume](character-art-review.json) couvre les neuf silhouettes ; la [revue indépendante des stages](stages-art-review.json) couvre les quatre masters et les deux R0. Les éléments principaux des références sont reconnaissables, avec les réserves suivantes :

- Certaines marges transparentes sont plus serrées que demandé, notamment le Fiend à 10 pixels en haut et 16 en bas. Aucun solide au seuil alpha 128 ne touche le cadre.
- Les halos apparents de plusieurs aperçus proviennent de couleurs RGB sous alpha nul ; les contrôles et leurs échantillons sont consignés dans la revue.
- Les appendices occultés, petits câbles, motifs textiles, visages et matériaux ne sont pas certifiés à l’identique. Une image ne valide pas les autres vues ou une animation.
- Les surfaces masquées par les personnages des captures de stages ont dû être reconstruites. Les références compressées ne permettent pas une validation topographique complète.

Le [rapport technique](verification.json) rapproche chaque sortie, chaque fiche, les champs d’identité hérités, les sources et les cellules exportées. Les [contrôles des stages](stages-verification.json) et des [liens Markdown](link-verification.json) sont séparés de la revue artistique.

Commande de vérification ciblée :

```bash
python scripts/verify-armax-lot10.py --report docs/armax/lot10/verification.json
```

Cette livraison porte sur les assets et leur suivi. Elle ne modifie pas le gameplay, les dépendances ou les pipelines de rendu. Les résultats de CI de la PR restent consultables sur le commit publié.


## Problème et résultat

Le lot 12 laissait 74 fiches sans image candidate. Cette continuation produit 14 PNG originaux pour 13 sujets : 10 fiches héritées nouvellement illustrées et 3 identités d’Andromeda ajoutées avec leurs références. Le catalogue passe à **172 fiches, dont 108 illustrées et 64 sans image**. Les 169 identités et usages hérités restent inchangés.

La livraison comprend Kelly Chambers, l’Homme Trouble et Alec Ryder ; Varren, Dévoreur, Rachni Soldier et CAT6 Specialist ; Samara loyauté et Jack standard ME2 ; la passerelle du poste du Tempest à Aya ; Kett Anointed, Reliquat Assembler et Hydra. Le premier Hydra est conservé après correction ciblée de son capteur supérieur orange : 13 versions sélectionnées et 1 R0, sans sujet supplémentaire.

| Catégorie | Fiches | Avec image | Sans image |
|---|---:|---:|---:|
| Personnages / ennemis | 87 | 45 | 42 |
| Costumes | 38 | 16 | 22 |
| Stages | 47 | 47 | 0 |
| **Total** | **172** | **108** | **64** |

Le corpus atteint 204 PNG originaux, hors trois aperçus historiques de contrôle. Les 47 stages ont désormais une image candidate de leur sous-zone ; cela ne signifie pas que leurs niveaux, leurs calques ou leur gameplay sont terminés.

## Périmètre et guides appliqués

- Base : `main` au commit `c67af65cd469da9cc3eb3748d2497ea50a578fbd`, après fusion de la PR #6. Branche : `feat/armax-missing-lot13-20261124`.
- Fichiers : `public/assets/armax/lot13/`, `docs/armax/lot13/`, cinq scripts de consolidation/export/vérification et les trois index `README.md`, `docs/ASSETS.md`, `docs/armax/README.md`.
- Guide `create-game-assets` consulté par l’agent principal à la révision épinglée `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`, avec les adaptations locales de `docs/GAMEDEV_GUIDANCE.md` et `docs/ART_BRIEFS.md` : sources d’opus/variante, PNG natifs, revue distincte des tests techniques, statut Prototype conservé.
- Aucun changement du renderer, des dépendances, du catalogue de la campagne ou du runtime des Chroniques.

## Vérifications effectuées

Les contrôles portent sur le contenu de cette branche et la base ci-dessus, dans l’environnement Linux de production du lot, le 24 novembre 2026.

| Commande ou parcours | Environnement | Résultat et preuve |
|---|---|---|
| `python scripts/prepare-armax-lot13-catalog.py` | Python ; manifestes figés | 172 fiches, 13 nouveaux sujets illustrés, 14 PNG, 107 références et 14 appels consignés. |
| Revue indépendante des 13 versions sélectionnées | Images et références ouvertes à taille réelle | `docs/armax/lot13/independent-art-review.json` : correction Hydra R1 contrôlée, revue R0 conservée et réserves reprises dans le suivi. |
| `scripts/build-armax-lot13-workbook.mjs` exécuté avec le Node principal géré | `@oai/artifact-tool` | Recalcul, modification/restauration d’un champ de présence, zéro erreur de formule ; 8 aperçus relus sur les 3 feuilles. |
| `scripts/export-armax-lot13-workbook-xml.py`, appelé par le générateur | Python standard ; checkpoint artifact-tool ; styles natifs lot 12 | Export final local réussi. 4 794 cellules, 24 formules/caches et 20 styles contrôlés ; dimensions, tables, validations, formats conditionnels et volets conservés. |
| Relecture du XLSX final et deux rendus supplémentaires | openpyxl en lecture seule puis artifact-tool | 4 794 cellules et leurs formats comparés indépendamment ; Synthese et la ligne Jack rendues depuis les données réellement relues et inspectées. Hauteur maximale : 346 points. Preuve : `docs/armax/lot13/workbook-verification.json`. |
| `python scripts/verify-armax-lot13.py --report docs/armax/lot13/verification.json` | Python + Pillow ; références et sorties natives disponibles | Réussi, 0 erreur et 0 avertissement : 14 sorties natives identiques, 107 références rehashées, 13 revues, 1 014 champs hérités, 190 chemins historiques et 2 763 cellules du suivi vérifiés. |
| `python scripts/verify-armax-lot13-links.py` | Python ; système de fichiers et arbre Git de base | Réussi : 8 documents, 266 liens locaux, 168 cibles locales distinctes et 1 ancre. Les 312 URLs externes sont recensées, sans test réseau global. |
| `git diff --check` | Branche de travail | Réussi, aucun problème d’espacement détecté dans les modifications suivies. |

Le fichier final a pour SHA-256 `5485db65cd948a50df3a1eeefef38770cf783d8b9365afd672bf085ec5011012`. Les deux voies d’export WASM ont bloqué : `SpreadsheetFile.exportXlsx` pendant plus de six minutes après les aperçus, puis `workbook.export({format:"xlsx"})`, arrêté après 123 secondes. Le classeur a donc été sérialisé localement depuis le checkpoint artifact-tool recalculé, avec le paquet de styles natifs lot 12 vérifié avant réemploi. Aucun export WASM réussi n’est revendiqué. Le générateur livré utilise directement cette sauvegarde locale et la relecture indépendante ; openpyxl ne crée ni ne sauvegarde le classeur.

## Suivi du contenu et des assets

Le catalogue, `MANQUANTS_2026-11-24.md`, les bibliothèques de références et le classeur `Mass_Effect_Armax_Suivi_Lot13_2026-11-24.xlsx` partagent les mêmes identifiants. Le classeur conserve les trois feuilles Synthese, Catalogue et Recuperes. Les réserves des revues indépendantes sont reprises dans ses notes de production. La colonne Sources est élargie pour que les 28 URLs de Jack restent visibles sans dépasser la hauteur de ligne prise en charge par Excel.

Les 107 références inspectées, dont 29 sélectionnées pour guider les générations, restent hors dépôt ; les URLs, empreintes, observations et décisions sont consignées. Les 14 appels ont produit 14 PNG, sans refus ni erreur technique. Les 13 exclusions historiques de génération restent intactes et ne sont pas relancées. Les sujets insuffisamment documentés restent au listing sans image ; Adhi n’est pas ajouté sur la seule base d’une piste bibliographique.

Tous les nouveaux fichiers restent **Prototype**, `fidelity1to1Validated=false` et `engineIntegrated=false`. Une fiche illustrée compte un candidat visuel, pas nécessairement tous ses accessoires ou poses.

## Compatibilité et limites restantes

L’Homme Trouble est produit debout : son fauteuil et sa pose assise restent manquants. Le bas du costume de Jack suit le dessin final officiel de l’artbook ME2 ; les captures natives corroborent la silhouette et le haut du corps mais ne certifient pas chaque détail du pantalon et des bottes. Les iris, tatouages, motifs, textures, pièces fines et proportions reconstruits conservent leurs réserves propres. Plusieurs marges demandées ne sont pas atteintes, bien que les silhouettes retenues soient entières.

Aya est une vue fixe de la passerelle d’accueil du Tempest, avec les personnages et le HUD retirés. Le vaisseau, l’ensemble des quais, la rétraction de la passerelle et les couches de parallaxe ne sont pas livrés par ce master aplati. Le Dévoreur représente uniquement le corps émergé ; les figures conservent des faces cachées et des animations à produire. Les alpha doux et les couleurs RGB présentes sous des pixels transparents doivent encore être vérifiés dans la composition du moteur.

Les PNG historiques ne sont pas modifiés. Dans cette copie partielle du dépôt, leurs 190 chemins sont contrôlés dans l’arbre Git de base ; les binaires historiques absents localement ne sont pas redécodés. La vérification complète des références et sorties originales demande Pillow et les caches externes aux chemins consignés : un clone seul ne permet pas de rejouer ces comparaisons. Le contrôle des liens n’a pas cette dépendance, et les PNG livrés restent vérifiables par leurs empreintes.

Tests de jeu, build de distribution, parcours navigateur/Electron/Windows, ouverture dans Excel natif et comparaison dans le moteur : **non exécutés localement pour ce lot de production artistique et de suivi**. La CI web automatique sera suivie sur le commit publié après ouverture de la PR. Aucun effet nouveau n’est introduit sur les sauvegardes, le stock, les neuf emplacements, les décisions/récompenses ou l’isolation campagne/Chroniques. La présence des PNG et la réussite des contrôles techniques ne certifient ni fidélité 1:1, ni animation, ni gameplay.

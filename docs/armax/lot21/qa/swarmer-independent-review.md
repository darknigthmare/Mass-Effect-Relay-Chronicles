# Lot 21 — revue indépendante du Swarmer ME3

**1 candidats retenus au statut Prototype. Zéro certification de fidélité 1:1 et zéro intégration moteur validée.**

Swarmer ME3 uniquement ; le Suppressor refusé n’a aucun PNG à évaluer.

## Continuité du rapport

Rapport reconstitué après la perte du dépôt temporaire /tmp. Les observations et empreintes des références proviennent de la revue visuelle indépendante antérieure conservée dans les traces de session. Les dix PNG récupérés à nouveau sont identiques aux empreintes antérieurement contrôlées. Les mesures techniques et aperçus sont recalculés depuis ces fichiers. Ce rapport reconstitué possède une nouvelle empreinte ; il ne prétend pas reproduire les octets du rapport perdu.

Les réserves ci-dessous proviennent de la revue visuelle antérieure. Les mêmes PNG ont été retrouvés, vérifiés par SHA-256 et mesurés à nouveau. Les fichiers tiers issus du cache temporaire ne sont pas redistribués ; leur disponibilité à la reconstruction est qualifiée dans le JSON.

## Synthèse

| Sujet | Dimensions | Marges G/H/D/B, alpha>10 | Décision |
|---|---|---|---|
| Swarmer | 1254×1254 | 68/38/47/25 px | Prototype |

## Swarmer

[PNG candidat](../../../../public/assets/armax/lot21/characters/enemy-swarmer-me3-neutral-r0.png) · [Aperçu alpha](previews/enemy-swarmer-me3-neutral-r0-independent-alpha-preview.jpg)

**Correspondances observées**

- Quatre longues pattes porteuses, articulations bleues, appendices sous le front et espaces entre membres suivent la capture.
- Optique circulaire à anneaux bleus, protubérance dorsale courbe et plaques arrière superposées reconnaissables ; angle frontal trois-quarts cohérent.
- Un sujet entier détouré ; grille de sol absente et pas de halo large en composition claire/sombre.

**Réserves**

- Optique plus intense et microtexture plus détaillée ; courbures fines, épaisseurs et proportions non mesurées 1:1.
- Marges G/H/D/B 68/38/47/25 px, toutes sous 8 % (environ 100 px), aucune extrémité coupée observée.
- 25717 pixels alpha 1–3 résiduels ; transparence non strictement nulle hors silhouette, filtrage moteur à contrôler.
- Une vue statique : marche, saut, apparition, contacts, mort et vue opposée manquent.
- Échelle relative aux combattants et ancrage au sol non testés.

Références : [R21-SWARMER](https://masseffect.fandom.com/wiki/Swarmer).

SHA-256 : `a70013df5825747a15e3395d31eb0e46c659e2d0fc8c9bc2d6361c58aae5414d`.

## Limites de la décision

Les grands halos d’aperçus bruts ne sont pas assimilés à un fond opaque : les compositions RGBA normales ont été inspectées. Des pixels de faible alpha et des marges trop courtes restent présents, avec leur contrôle moteur à effectuer. Les sujets gardent leurs réserves de détails, variantes et sources. Une sélection de candidat ne ferme aucune validation 1:1.

Les mesures et empreintes des références figurent dans [swarmer-independent-review.json](swarmer-independent-review.json).

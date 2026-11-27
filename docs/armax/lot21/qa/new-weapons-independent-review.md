# Lot 21 — revue indépendante des deux nouvelles armes

**2 candidats retenus au statut Prototype. Zéro certification de fidélité 1:1 et zéro intégration moteur validée.**

M-5 Phalanx et M-12 Locust uniquement ; les sept récupérés ont un rapport distinct.

## Continuité du rapport

Rapport reconstitué après la perte du dépôt temporaire /tmp. Les observations et empreintes des références proviennent de la revue visuelle indépendante antérieure conservée dans les traces de session. Les dix PNG récupérés à nouveau sont identiques aux empreintes antérieurement contrôlées. Les mesures techniques et aperçus sont recalculés depuis ces fichiers. Ce rapport reconstitué possède une nouvelle empreinte ; il ne prétend pas reproduire les octets du rapport perdu.

Les réserves ci-dessous proviennent de la revue visuelle antérieure. Les mêmes PNG ont été retrouvés, vérifiés par SHA-256 et mesurés à nouveau. Les fichiers tiers issus du cache temporaire ne sont pas redistribués ; leur disponibilité à la reconstruction est qualifiée dans le JSON.

## Synthèse

| Sujet | Dimensions | Marges G/H/D/B, alpha>10 | Décision |
|---|---|---|---|
| M-5 Phalanx | 1536×1024 | 48/83/29/77 px | Prototype |
| M-12 Locust | 1536×1024 | 48/138/35/134 px | Prototype |

## M-5 Phalanx

[PNG candidat](../../../../public/assets/armax/lot21/weapons/m5-phalanx-me2-profile-r0.png) · [Aperçu alpha](previews/m5-phalanx-me2-profile-r0-independent-alpha-preview.jpg)

**Correspondances observées**

- La boucle inférieure ajourée et le pontet séparé sont conservés ; la poignée noire inclinée reste distincte.
- Plaque argent-lavande, bande cyan et marquage M5 lisibles ; mécanisme supérieur et doubles éléments avant cohérents.
- Un seul sujet entier, laser éteint, sans effet de tir ni nouvel accessoire visible.

**Réserves**

- Source 512×256 : microtextures et contours secondaires insuffisamment établis, grain et reflets reconstruits/accentués.
- Marges alpha>10 :48/83/29/77 px (G/H/D/B), sous la cible 10 %; contour physique entier.
- Alpha maximal 254 et 18129 pixels alpha 1–3 ; pas de large halo après composition, filtre moteur à tester.
- Face opposée, laser actif, tenue en main, tir, rechargement et animation non couverts.

Références : [R21-PHALANX](https://masseffect.fandom.com/wiki/M-5_Phalanx).

SHA-256 : `cd9cd67a25a140cb3be0de15b59046571fc77aec467146a54476c8fe12698f53`.

## M-12 Locust

[PNG candidat](../../../../public/assets/armax/lot21/weapons/m12-locust-me2-profile-r0.png) · [Aperçu alpha](previews/m12-locust-me2-profile-r0-independent-alpha-preview.jpg)

**Correspondances observées**

- Crosse étroite, emblème rouge et CR2, bande diagonale claire, capsule latérale et boîtier correspondent aux deux références.
- Chargeur incliné, arceau arrière et pontet distincts ; poignée avant verticale, canon fendu et cylindre inférieur conservés.
- Détourage propre sur fonds clair et sombre, accents rouges sans effet de tir.

**Réserves**

- Petit marquage du panneau avant réinterprété et peu lisible ; caractères et usure exacte non certifiés.
- Fissures et éraflures plus appuyées, notamment à la poignée arrière et sur les plaques ; microtexture extrapolée.
- Marges alpha>10 :48/138/35/134 px ; côtés sous la cible 8 %, aucun bout physique coupé observé.
- Alpha maximal 254,13987 pixels alpha 1–3 ; la large lueur de la vue native n’apparaît pas en composition normale.
- Une face statique seulement ; autre face, tenue en main, tir et rechargement non vérifiés.

Références : [R21-LOCUST-GAME](https://gamestegy.com/mass-effect-2/wiki/1107/m-12-locust), [R21-LOCUST-ART](https://www.creativeuncut.com/gallery-13/me2-gun-m-12-locust-smg.html).

SHA-256 : `a5cfffe37605b4856de8d1461eeba35acfa2730cceab7251537f4fac4582cdfe`.

## Limites de la décision

Les grands halos d’aperçus bruts ne sont pas assimilés à un fond opaque : les compositions RGBA normales ont été inspectées. Des pixels de faible alpha et des marges trop courtes restent présents, avec leur contrôle moteur à effectuer. Les sujets gardent leurs réserves de détails, variantes et sources. Une sélection de candidat ne ferme aucune validation 1:1.

Les mesures et empreintes des références figurent dans [new-weapons-independent-review.json](new-weapons-independent-review.json).

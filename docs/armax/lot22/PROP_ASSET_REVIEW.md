# Accessoires Nacre — revue des PNG natifs

## Résultat

Vingt identités originales possèdent une base assemblée illustrée. Vingt et un PNG natifs sont conservés, car l’antenne possède une révision de cadrage. Aucun accessoire canonique manquant n’est fermé par cette production. Les 98 pièces prévues dans la bible ne sont pas des fichiers produits.

## Contrôles réalisés

- Les vingt sorties sélectionnées sont des PNG RGBA lisibles, avec des pixels alpha à zéro et un sujet non vide.
- Les vingt fichiers ont été comparés à leurs octets natifs et à leurs blobs Git immuables. Aucun pixel n’a été redimensionné, nettoyé ou reconstruit après génération.
- Les sujets assemblés ont été examinés visuellement dans les résultats natifs. Une seule identité est comptée par objet.
- Le prop18 R0 était trop près du bord supérieur. La version R1 conserve la même identité et montre le mât entier avec une marge de 115 pixels ; R0 reste disponible.
- Les palettes ivoire usé, graphite, cuivre et cyan sont cohérentes avec la direction industrielle de Nacre. Ce contrôle ne vaut ni validation officielle ni certification canonique 1:1.

## Limites de production

Les animations, états ouverts/endommagés, pièces séparées, collisions et interactions en situation ne sont pas validés par ces PNG. Les légers pixels d’antialias et les proportions à l’échelle de l’arène doivent être contrôlés lors de l’intégration. Les fichiers natifs restent conservés.

## Inventaire sélectionné

| ID | Nom | Révision | Dimensions | Alpha min–max | Fichier |
|---|---|---|---|---|---|
| nacre_prop_01 | Borne de caution | R0 | 1312 × 1199 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_01.png` |
| nacre_prop_02 | Comptoir des transitaires | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_02.png` |
| nacre_prop_03 | Module de triage | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_03.png` |
| nacre_prop_04 | Casier de preuve | R0 | 1199 × 1312 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_04.png` |
| nacre_prop_05 | Treuil de cale | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_05.png` |
| nacre_prop_06 | Kiosque des contrats | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_06.png` |
| nacre_prop_07 | Amarre télescopique | R0 | 2172 × 724 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_07.png` |
| nacre_prop_08 | Banc acoustique | R0 | 1774 × 887 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_08.png` |
| nacre_prop_09 | Coffre de garantie | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_09.png` |
| nacre_prop_10 | Séparateur de vivres | R0 | 1774 × 887 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_10.png` |
| nacre_prop_11 | Chariot de minerai | R0 | 1774 × 887 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_11.png` |
| nacre_prop_12 | Presse de déconstruction | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_12.png` |
| nacre_prop_13 | Bac hydroponique | R0 | 1752 × 897 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_13.png` |
| nacre_prop_14 | Conteneur du Lest Gris | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_14.png` |
| nacre_prop_15 | Vanne de ballast | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_15.png` |
| nacre_prop_16 | Cabine de combinaison | R0 | 1321 × 1191 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_16.png` |
| nacre_prop_17 | Cartouche thermique | R0 | 2172 × 724 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_17.png` |
| nacre_prop_18 | Antenne de témoignage | R1 | 1217 × 1293 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_18_r1.png` |
| nacre_prop_19 | Registre isolé | R0 | 1536 × 1024 | 0–254 | `public/assets/armax/lot22/originals/props/nacre_prop_19.png` |
| nacre_prop_20 | Rampe d'évacuation | R0 | 1752 × 897 | 0–255 | `public/assets/armax/lot22/originals/props/nacre_prop_20.png` |

## Preuves

- `prop-generation-prompts.json` : demandes exactes, chemin d’origine et révision.
- `prop-asset-manifest.json` : dimensions, SHA-256, alpha, limites du sujet et qualifications.
- `prop-git-blobs.json` : correspondance avec les blobs immuables, version sélectionnée et version conservée.

# Lot 16 — Homme Trouble ME2 : fauteuil et pose assise

Deux **candidats fixes** produits le 25 novembre 2026 avec l’outil intégré `image_gen.imagegen`. Les deux sorties natives ont été copiées sans modification dans `public/assets/armax/lot16/`. Elles restent `Prototype`, avec `fidelity1to1Validated: false` et `engineIntegrated: false`.

| Entrée | Nouveau fichier | Usage |
| --- | --- | --- |
| `prop_me2_illusive_man_chair` | `public/assets/armax/lot16/props/illusive-man-me2-chair.png` | Fauteuil vide, accessoire candidat |
| `chr_me2_illusive_man` | `public/assets/armax/lot16/fighters/illusive-man-me2-seated.png` | Pose assise additionnelle, narration/support |

L’identité du personnage reste celle du catalogue lot14 : **L'Homme Trouble**, **ME2**, variante **Costume et fauteuil ME2**. Le fichier debout lot13 demeure l’asset historique ; cette production n’en est pas un remplacement. Sa copie de référence a été extraite du commit `71955d9143562d6a44a8b8d48bc552978372bc1e` dans le dossier temporaire de références, sans modifier le dépôt. L’absence de ce PNG dans le checkout partiel initial n’était pas une absence au dépôt.

## Références effectivement inspectées

La preuve primaire utilisée est une [capture de presse ME2 publiée par Gematsu le 17 décembre 2009](https://www.gematsu.com/2009/12/new-mass-effect-2-screenshots-surface), avec [pixels de la sixième image](https://www.gematsu.com/wp-content/uploads/2009/12/zp-83181_Mass-Effect-2_2009_12-17-09_06.jpg). Elle montre l’Homme Trouble assis et une partie substantielle du fauteuil. C’est une capture antérieure à la sortie, pas une certification du maillage final.

Les vues de la [statuette officielle BioWare](https://gear.bioware.com/products/illusive-man-statue), en particulier l’avant et l’arrière trois-quarts, ont servi à lire la lame centrale du dossier, les accoudoirs et les appuis cachés. Une statuette sous licence reste une source secondaire : ses détails de fabrication ne prouvent pas la géométrie exacte du modèle de jeu. Sa base carrelée n’a pas été reprise.

La [planche historique de costume](https://i.pinimg.com/originals/6b/15/19/6b15195e94307ece0a8436dd460bdff4.jpg), attribuée à Troodon/Troodon80 dans le suivi, ainsi que le prototype debout lot13 ont uniquement guidé le personnage. La planche ne contient aucun fauteuil. Les pixels de tiers sont conservés hors dépôt ; leurs URL, dimensions, rôles et SHA-256 sont dans `reference-library.json`.

## Compatibilité de la paire

**Les deux candidats ne sont pas compatibles pour un assemblage direct de calques.** L’image du fauteuil vide a bien été fournie comme cible à la génération assise. Celle-ci a néanmoins déplacé l’assise, les accoudoirs et certains appuis. La famille de forme et les matériaux se ressemblent, mais une substitution pixel pour pixel ou une superposition ne sont pas validées. La seconde image contient déjà son propre fauteuil.

Le dossier rembourré, la largeur de la traverse haute, les jonctions partiellement cachées et le cendrier/inset restent des points de fidélité à vérifier. Le mot « exact » dans le prompt exprime la cible demandée au générateur, pas le résultat d’une certification.

## Traçabilité et contrôles

- `manifest.json` : les deux assets, les identités, leurs réserves, les sources et les mesures techniques.
- `attempts.json` : les deux appels effectués, prompts exacts, références ordonnées et chemins natifs ; aucune relance ni refus de génération.
- `prompt-chair.txt` et `prompt-seated.txt` : textes exacts envoyés à l’outil intégré.
- `reference-library.json` : sources inspectées et empreintes des pixels.
- `technical-chair.json` et `technical-seated.json` : dimensions, SHA-256, alpha et marges utiles.
- `QA.md` : revue visuelle et limites.

Aucune animation, intégration moteur, scène jouable ou restauration de fichiers perdus du lot15 n’est livrée par ce dossier.

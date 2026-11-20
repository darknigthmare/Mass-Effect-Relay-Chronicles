# Illium — six plans natifs, lot04

## Résultat retenu

Six PNG ont été générés à partir du master Illium du lot03. Ils gardent tous le canvas natif **1774 × 887**. L0 est opaque ; L1 à L5 possèdent une vraie couche alpha. Les copies retenues sont identiques, octet pour octet, aux fichiers produits par la génération. Aucun recadrage, redimensionnement ou détourage manuel n’a été effectué.

**Statut : premier ensemble de travail. La parallaxe n’est pas terminée ni validée en moteur.**

| Plan | Contenu | Fichier retenu |
|---|---|---|
| L0 | Ciel, nuages et soleil | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L0_sky_r0.png` |
| L1 | Ville lointaine | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L1_far_skyline_r0.png` |
| L2 | Grandes tours et passerelle | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L2_landmark_structures_r0.png` |
| L3 | Bordure arrière et ses cinq lampes | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L3_rear_curb_r0.png` |
| L4 | Sol de combat continu | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L4_combat_floor_r0.png` |
| L5 | Fine grille de premier plan | `outputs/mass-effect/lot04/assets/stages/illium_nos_astra_me2/layers/illium_L5_foreground_accents_r0.png` |

Le master source reste un concept d’arène adapté à une composition latérale, lui-même non certifié 1:1. Le fractionnement génératif n’ajoute aucune certification de fidélité.

## Contrôle de l’assemblage

Les trois images `assembly_native_0.png`, `assembly_native_minus32.png` et `assembly_native_plus32.png` sont des **preuves de contrôle séparées**, conservées dans ce dossier `work`. Elles ne sont pas de nouveaux assets canoniques. Elles ont été calculées en composition alpha à la taille native, sans modifier les PNG sources.

Au cadrage fixe, le raccord entre bordure et sol est continu. Le contrôle alpha confirme une couverture complète de L3 à y=740 et de L4 à y=741. La grille de premier plan apparaît une fois ; aucun double de la passerelle ou des grandes tours n’a été observé.

Les grandes silhouettes restent proches de leurs positions sources, mais plusieurs tours secondaires manquent, notamment le pylône fin vers x=45 et les volumes vers x=404 et x=460. La ville lointaine a été reconstruite avec d’autres silhouettes. Les nuages, certains détails de façade et des joints du sol ont également été redessinés. Une extraction fidèle de chaque pixel n’a pas été obtenue.

### Défaut bloquant au défilement

Chaque PNG s’arrête exactement aux limites du master. **La marge de pixels disponible hors cadre est de 0 pixel de chaque côté.** Les continuations générées derrière les grandes tours ne constituent pas une marge hors cadre.

Le test utilise, uniquement pour le contrôle, les facteurs L0→L5 `[0, 0.15, 0.45, 0.8, 1, 1.12]`. À un déplacement de caméra de +32, les plans sont déplacés de `[0, -5, -14, -26, -32, -36]` pixels. Des manques apparaissent à droite : 32 pixels sans sol, 26 sans bordure et 36 sans grille. Le test −32 produit les mêmes défauts à gauche.

Le ciel opaque maintient l’alpha final à 255 ; cela ne corrige pas le défaut visuel où du ciel remplace le sol. Les plages de déplacement et les facteurs doivent être définis et testés dans le moteur, avec des continuations hors cadre ou une fenêtre de rendu plus petite explicitement prévue. Aucun de ces choix n’a été appliqué aux PNG livrés.

Le fichier `illium_parallax_review.html` propose un aperçu local, mais Chromium a refusé de démarrer avec l’erreur `socket() failed: Operation not permitted`. Il n’a pas été relancé après ce blocage. L’interaction de cet aperçu et le défilement en moteur restent non vérifiés.

## Port Hanshan reste manquant

Quatre nouvelles images de jeu ont été téléchargées et inspectées : une carte de la plaza et un angle du lounge de Lorik sur Gamepur, un couloir vitré et l’écran de planète dans la rétrospective de Shamus Young. Elles n’établissent pas une vue large suffisamment complète de l’architecture de la plaza. Aucun nouveau décor Port Hanshan n’a été généré à partir de ces vues.

Sources examinées :

- [Gamepur — Noveria: Lorik Qui’in, Legendary Edition](https://www.gamepur.com/guides/how-to-complete-noveria-lorik-quiin-in-mass-effect-legendary-edition)
- [Shamus Young — rétrospective Mass Effect, Noveria](https://www.shamusyoung.com/twentysidedtale/?p=28025)

## Fichiers de traçabilité

- `../runs/stages_c.json` : les six prompts exacts, références, résultats, sélections, SHA-256, dimensions, alpha et erreur de prévisualisation.
- `assembly_review.json` : contrôle visuel, raccords, tours manquantes, marges et limites de validation.
- `assembly_render.json` : paramètres des trois compositions de contrôle.
- `alpha_row_checks.json` : couverture alpha sur les lignes de raccord et correspondance des copies.
- `port_hanshan_research.json` : sources, fichiers examinés, décisions et version du jeu.
- `stages_c_summary.json` : résumé exploitable par l’assemblage du lot04.

Les fichiers du lot03, le manifeste central et GitHub n’ont pas été modifiés par cette tâche.

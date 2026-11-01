# Kaidan ME1 — quatre poses de combat

Le fichier `public/assets/companion-kaidan-combat.png` apporte quatre poses fixes : visée au pistolet, geste d’action neutre, impact et hors combat. L’identité et le costume dérivent de la cellule Kaidan du [crew-atlas existant](../../public/assets/crew-atlas.png), rectangle `[768, 0, 384, 512]` : cheveux sombres courts, visage rasé, armure Alliance bleu-gris sombre et plaques d’acier bleu clair. Aucun insigne N7 de Shepard ni costume d’un épisode ultérieur n’est ajouté.

Le [relevé des prompts exacts](companion-combat-kaidan-prompts.json) conserve les trois requêtes `image_gen.imagegen` avec transparence native. Les deux premières sorties n’ont pas été retenues : certaines poses faisaient entrer des pixels voisins dans leurs rectangles. La troisième utilise le commando comme référence d’identité et l’atlas Ashley comme référence de composition et de style. Sa sortie native, `exec-07a13a87-b9ed-49bb-96dc-1b0bee3e875d.png`, a été copiée octet pour octet ; aucun pixel n’a été retouché et les anciens essais restent dans le dossier de générations.

| Contrôle | Résultat |
|---|---|
| Format natif | RGBA, 1 536 × 1 024 |
| SHA-256 livré | `40e33a509ddeb5d4c7583dbbd05a5b7c8d38ed36fa3f2b55eddddec60c495c35` |
| Poses | Quatre corps entiers séparés, trois-quarts fixe |
| Alpha | Fond réellement transparent ; valeurs de 0 à 254 |
| Découpage au seuil visible 51/255 | Aucun pixel visible non assigné ou partagé entre cadres |
| Copie native | Octets identiques à la sortie conservée sous `/workspace/generated_images/` |

Les rectangles irréguliers, pivots et facteurs de hauteur mesurés figurent dans [companion-kaidan-animation.json](../../public/assets/companion-kaidan-animation.json). La pose couchée utilise la même convention de longueur corporelle que celle d’Ashley. Les très faibles opacités extérieures restent dans le fichier inchangé ; le contrôle des voisins s’appuie sur le seuil alpha de 0,2 déjà utilisé par le renderer.

Les deux vues ont été effectivement ouvertes : [atlas transparent sur fond de contrôle](../qa/companion-kaidan-art-source-review.png) et [huit cadres Ashley/Kaidan à échelle de lecture](../qa/companion-ashley-kaidan-art-frame-review.png). Les silhouettes et états sont lisibles, les couleurs restent cohérentes avec la référence du projet et aucun morceau voisin n’est observé dans les cadres retenus. Il s’agit d’une revue de source ; le contrôle dans le jeu réel appartient au rapport d’intégration.

Le cadre `power` représente un geste neutre, sans effet incorporé ni nouvelle attribution de pouvoir. Le pistolet illustré est générique et ne certifie aucun modèle équipé. Le visage, les proportions et les panneaux d’armure générés gardent des variations de détail. La référence initiale est elle-même un prototype : aucune comparaison primaire complète au modèle ME1 original n’a été réalisée par ce chantier. Les autres directions, transitions et cycles complets restent à produire ; aucune règle, statistique, sauvegarde ou survie narrative n’est modifiée par ces images.

Le [rapport technique et visuel](../qa/companion-combat-kaidan-art-report.json) conserve les mesures et réserves. Le statut reste **Prototype** et la fidélité intégrale **1:1 non certifiée**.

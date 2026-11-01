# Ashley ME1 — quatre poses de combat

Le fichier `public/assets/companion-ashley-combat.png` apporte quatre poses fixes : visée, geste de commandement, impact et hors combat. L’identité et le costume dérivent de la cellule Ashley du [crew-atlas existant](../../public/assets/crew-atlas.png), rectangle `[384, 0, 384, 512]` : cheveux bruns attachés, protection claire blanc/rose et empiècements bordeaux sombres. Cette référence est elle-même un prototype du projet, pas un modèle original certifié.

Le [prompt exact](companion-combat-ashley-prompts.json) décrit la génération par `image_gen.imagegen`, avec le PNG du commando comme référence et `transparent_background: true`. La sortie native sélectionnée est `exec-3f6d5560-1c3f-457e-a7a5-d04558eed9d0.png`. Elle a été copiée octet pour octet dans les assets ; aucune retouche, modification de l’alpha ou remise à l’échelle du fichier n’a été effectuée.

| Contrôle | Résultat |
|---|---|
| Format natif | RGBA, 1 536 × 1 024 |
| SHA-256 livré | `1dc47da889cbc51fafe451605d04f49a3fc6040feff6a4388592ffff299fb783` |
| Poses | Quatre corps entiers séparés, trois-quarts fixe |
| Alpha | Fond réellement transparent ; valeurs de 0 à 254 |
| Découpage au seuil visible 51/255 | Aucun pixel visible non assigné ou partagé entre cadres |
| Copie native | Octets identiques à la sortie conservée sous `/workspace/generated_images/` |

Les rectangles irréguliers, les pivots relatifs et les facteurs de hauteur sont dans [companion-ashley-animation.json](../../public/assets/companion-ashley-animation.json). Les poses debout utilisent une échelle commune ; la pose couchée conserve une longueur voisine de la hauteur corporelle debout. Les fichiers contiennent encore de très faibles opacités hors silhouette ; ils restent inchangés et le renderer utilise son seuil alpha de 0,2.

Les deux vues ont été effectivement ouvertes : [atlas transparent sur fond de contrôle](../qa/companion-ashley-art-source-review.png) et [huit cadres Ashley/Kaidan à échelle de lecture](../qa/companion-ashley-kaidan-art-frame-review.png). Le fond gris et les libellés de ces captures appartiennent uniquement à la page de contrôle, pas au PNG livré. Les poses sont lisibles et aucun morceau du personnage voisin n’est observé dans les cadres. Cette revue de source demeure distincte du contrôle dans le vrai jeu.

Ashley est une soldate sans biotique. Le cadre nommé `power` montre un geste militaire neutre ; il n’accorde aucune capacité. Le fusil illustré est générique et ne suit pas tous les modèles équipables. Le visage et les panneaux d’armure générés présentent des variations de détail. Aucune comparaison primaire complète au modèle ME1 original, vue arrière, transition, animation médicale ou cycle d’action n’est certifié. Les règles, statistiques, inventaires, sauvegardes et décès narratifs restent hors de ce livrable artistique.

Le [rapport technique et visuel](../qa/companion-combat-ashley-art-report.json) conserve dimensions, alpha, cadrages, empreintes et limites. Le statut reste **Prototype** et la fidélité intégrale **1:1 non certifiée**.

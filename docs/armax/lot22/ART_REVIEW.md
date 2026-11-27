# Revue artistique de consolidation — lot22

Date : 27 novembre 2026. Périmètre : **109 identités originales illustrées**, 114 PNG natifs avec les versions conservées. Les vingt boss sont conçus ; Halek Orr reste sans image.

## Étendue de la revue

| Famille | Revue effectuée | Preuve ou réserve principale |
| --- | --- | --- |
| 10 combattants | Lecture de la planche des corps entiers ; contrôle détaillé de Neral avant/après correction | `qa/contact-fighters.jpg` ; `revision-generation-prompts.json` |
| 20 arènes | Lecture des vingt masters et du stage11 corrigé | `qa/contact-stages.jpg` ; une composition aplatie par arène |
| 20 ennemis | Lecture de la planche des vingt silhouettes | `qa/contact-enemies.jpg` ; armes/modules encore inclus dans certaines bases |
| 19 boss | Inspection des bases et de deux corrections d’identité/anatomie | `nacre-boss-art-review.md` ; modules et phases incomplets |
| 20 accessoires | Inspection des bases assemblées et de la correction du mât18 | `PROP_ASSET_REVIEW.md` ; aucune série d’états séparés |
| 20 FX | Ouverture et lecture individuelle des vingt images natives | `nacre-fx-art-review.md` ; une frame représentative par famille |

Les planches sont des compositions de contrôle à échelle réduite. Elles ne remplacent pas les PNG sources et ne constituent pas des captures du moteur. Les dimensions, SHA-256, extrema et limites alpha des bases sélectionnées sont mesurés dans `asset-manifest.json`.

## Corrections sélectionnées

- **Neral Vesh R1** : retrait de l’oreille externe humaine, membrane latérale drell nervurée et plaques crâniennes moins épaisses. La comparaison utilise la page4 du guide officiel EA de Thane. La tenue courte, la posture, le pistolet, la palette olive/cuivre et l’identité originale de Neral restent propres au projet. R0 est conservée.
- **Stage11 R1** : ajout d’une verrière et de sa structure étanche derrière le plan de combat. La mine reste visible au-dehors ; le sol horizontal est conservé. R0 est conservée.
- **Terea Soth R1** : correction de l’anatomie asari ; la base précédente est conservée dans `bosses/qa/`.
- **Elyne Korda R1** : identité visuelle distinguée de Myra Nenn, avec peau brune foncée et cheveux courts poivre et sel ; silhouette et tenue de direction conservées.
- **Accessoire18 R1** : mât entièrement cadré avec marge supérieure ; R0 est conservée comme ancienne version.

Ces cinq révisions ne créent aucune identité supplémentaire. Les prompts exacts et les choix sont consignés dans les manifestes de leurs familles.

## Observations sur les silhouettes

Le corpus utilise des vêtements et protections de fret, des matières ivoire/graphite et des accents techniques cuivre, ambre ou cyan. Les vingt ennemis proposent des gabarits reconnaissables : espèces organiques, quadrupède mécanique, drones, plateforme de charge, nacelle de brouillage et tourelle. La tourelle et la nacelle sont des machines fixes dans le prototype.

La base de l’ennemi12 inclut encore un petit drone et l’effet d’omni-outil ; la protection holographique du volus08 est aussi incluse dans son image. Ces éléments ne sont pas comptés comme des drones ou FX séparés ni comme des animations réalisées. Les armes tenues et attaches des autres corps restent à décomposer lorsque le kit final le demande.

La masse et les volumes des machines ont été conservés. Le noyau du boss14 n’inclut pas ses portes et drones autonomes. Le corps d’Elyne n’inclut pas le portique du quai. Le nombre de segments visuellement lisibles de Murène-2 ne valide pas ses six composants fonctionnels prévus.

## Lecture des décors et effets

Les arènes possèdent un plan horizontal lisible et des architectures cohérentes avec leur fonction de quai, atelier, salle de registre ou infrastructure minière. Les objets dessinés dans les fonds ne deviennent pas des collisions ou des accessoires destructibles. Les cinq couches de chaque arène restent à produire séparément.

FX01 pointe vers la droite ; le noyau de FX05 est à gauche. Le renderer applique un signe d’orientation propre à FX05. Les halos et fumées demandent un réglage d’opacité en situation ; les bounds de lecture ne doivent pas devenir des hitboxes. Les cycles d’apparition, impact et extinction restent absents des bases fixes.

## Réserves conservées

Les franges et voiles d’alpha faibles, les marges de certaines machines, l’échelle relative des corps, le contact des pieds, la visibilité des attaques et les asymétries retournées en miroir doivent encore être contrôlés dans le moteur. Le rejet d’alphas faibles n’est pas une certification de détourage parfait.

La revue conclut à des **bases candidates cohérentes pour la continuation**, avec réserves explicites. Elle ne certifie ni une reproduction 1:1, ni la totalité des anatomies sous tous les angles, ni les kits animés, ni un rendu en jeu ou une approbation officielle. Les références canoniques ouvertes restent traitées dans l’audit distinct des manquants.

# Combat ME1 — Tali’Zorah nar Rayya

Quatre poses fixes ont été dérivées du sprite de commando existant par `image_gen.imagegen`, en réutilisant l’atlas `public/assets/crew-atlas.png` comme référence locale. Les [prompts exacts](companion-combat-tali-prompts.json) conservent la demande, le nom de sortie native et les empreintes.

Tali nar Rayya ME1 : capuche violette à motif, visière teintée couvrante, combinaison environnementale intégrale, silhouette et jambes quariennes dérivées du sprite existant.

L’atlas livré `public/assets/companion-tali-combat.png` mesure 1536 × 1024 RGBA. Son SHA-256 est `5b3bc87417e7f96c868a41bb35367944fad1774ac0918032ccad8c893ea9c470`. Il est identique octet pour octet à la sortie `exec-9836d3c7-f306-44d1-9e4c-903658c76af5.png` ; aucun recadrage, rééchantillonnage ou changement d’alpha n’a été appliqué au PNG. Les rectangles, pivots et tailles de lecture sont consignés dans [la configuration](../../public/assets/companion-tali-animation.json).

Les quatre états sont visée, geste de capacité sans effet incorporé, réaction d’impact et corps couché. La vue trois-quarts est fixe ; l’arme dessinée reste un modèle générique. Le casque et la combinaison couvrent le personnage dans toutes les poses ; le geste de capacité représente une commande technique et ne lui donne aucune biotique.

Les cadrages irréguliers sont mesurés au seuil alpha 24 et conservent une marge sans pixels visibles à ce seuil. Des pixels de faible opacité subsistent ; ils ne sont pas présentés comme un détourage nettoyé à la main. Le corps couché utilise une échelle réduite et un pivot au sol ; ce réglage de rendu ne change aucune statistique de jeu.

Le [contrôle technique](../qa/companion-combat-tali-art-report.json) décrit les pixels et la géométrie de lecture. L’intégration au renderer et l’observation du personnage en situation relèvent de la recette globale de ce lot et doivent être rapportées séparément. Les poses ne constituent pas un cycle de mouvement complet, des vues arrière, ni des variantes de chaque armure ou arme. La ressemblance à l’œuvre originale n’est pas certifiée : la référence artistique ici est le prototype existant, sans nouveau relevé primaire. Le statut reste **Prototype** et aucune fidélité **1:1** n’est validée.

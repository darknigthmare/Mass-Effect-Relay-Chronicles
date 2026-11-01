# Combat ME1 — Liara T’Soni

Quatre poses fixes ont été dérivées du sprite de commando existant par `image_gen.imagegen`, en réutilisant l’atlas `public/assets/crew-atlas.png` comme référence locale. Les [prompts exacts](companion-combat-liara-prompts.json) conservent la demande, le nom de sortie native et les empreintes.

Liara ME1 : peau bleue et crêtes asari, tenue claire à panneaux bleu nuit dérivée du sprite de commando existant.

L’atlas livré `public/assets/companion-liara-combat.png` mesure 1536 × 1024 RGBA. Son SHA-256 est `fdfd8db58ef32860403c9d31e1393793c619a51129ef6767c22c95bb1cd506dd`. Il est identique octet pour octet à la sortie `exec-41ce3925-5281-4213-9fe2-e892cae2b54b.png` ; aucun recadrage, rééchantillonnage ou changement d’alpha n’a été appliqué au PNG. Les rectangles, pivots et tailles de lecture sont consignés dans [la configuration](../../public/assets/companion-liara-animation.json).

Les quatre états sont visée, geste de capacité sans effet incorporé, réaction d’impact et corps couché. La vue trois-quarts est fixe ; l’arme dessinée reste un modèle générique. Les crêtes et la peau asari restent visibles ; les expressions et détails locaux ne sont pas identiques pixel pour pixel au sprite initial.

Les cadrages irréguliers sont mesurés au seuil alpha 24 et conservent une marge sans pixels visibles à ce seuil. Des pixels de faible opacité subsistent ; ils ne sont pas présentés comme un détourage nettoyé à la main. Le corps couché utilise une échelle réduite et un pivot au sol ; ce réglage de rendu ne change aucune statistique de jeu.

Le [contrôle technique](../qa/companion-combat-liara-art-report.json) décrit les pixels et la géométrie de lecture. L’intégration au renderer et l’observation du personnage en situation relèvent de la recette globale de ce lot et doivent être rapportées séparément. Les poses ne constituent pas un cycle de mouvement complet, des vues arrière, ni des variantes de chaque armure ou arme. La ressemblance à l’œuvre originale n’est pas certifiée : la référence artistique ici est le prototype existant, sans nouveau relevé primaire. Le statut reste **Prototype** et aucune fidélité **1:1** n’est validée.

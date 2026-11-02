# Eden Prime — deux matériaux de terrain du 2 novembre 2026

Deux textures de couleur originales complètent les sols et chemins des vrais meshes 3D de la refonte d’Eden Prime. Elles sont générées pour ce prototype ; elles ne sont ni extraites de Mass Effect, ni certifiées comme matériaux PBR ou reproductions 1:1 du jeu original.

| Usage | Fichier natif | Dimensions et format |
|---|---|---|
| Prairie agricole sobre | [eden-ground-grass.png](../../public/assets/eden-ground-grass.png) | 1254 × 1254, RGB opaque |
| Chemin de terre grisocre | [eden-ground-dirt.png](../../public/assets/eden-ground-dirt.png) | 1254 × 1254, RGB opaque |

Les [prompts exacts et fichiers sources](eden-immersion-terrain-art-prompts.json) décrivent deux générations neuves avec `image_gen.imagegen`, sans image cible à modifier. La taille demandée était 1024 × 1024 ; l’outil a réellement livré 1254 × 1254. Les PNG sont copiés byte pour byte depuis les sorties natives, sans retouche, recadrage, redimensionnement ni compression supplémentaire. La révision du modèle n’est pas exposée par cet outil.

La [capture du prototype inspectée](../screenshots/me1-enemy-poses-visible-geth-husk-aim.png) a servi uniquement à observer la palette du niveau, sans être fournie comme image d’entrée. Les matériaux utilisent des couleurs désaturées, des détails fins et un éclairage diffus, sans décor, horizon, texte ou ombre dirigée. Ils ne fournissent aucun objet, collision ou élément narratif supplémentaire.

Le [contrôle reproductible](../../scripts/check-eden-immersion-terrain-browser.mjs) sert ces mêmes octets à Chromium et les applique à deux vrais plans Three.js 0.180.0. Chaque texture se répète 3 × 3 avec `RepeatWrapping` et un espace de couleur sRGB. Les vues [verticale](../screenshots/eden-immersion-terrain-flat-3x3.png) et [oblique](../screenshots/eden-immersion-terrain-oblique-3x3.png) ont réellement été ouvertes. Les [observations visuelles](../qa/eden-immersion-terrain-material-review.json) sont séparées des contrôles techniques du [rapport art](../qa/eden-immersion-terrain-art.json).

La répétition reste discernable en cherchant les motifs, surtout sur la terre en vue verticale. De petites différences de ton subsistent aux limites ; aucune continuité mathématiquement parfaite n’est revendiquée. Aucun raccord dur ou quadrillage très contrasté n’a été observé aux échelles capturées. Le matériau doit encore être relu dans le niveau complet ; ce contrôle isolé ne remplace pas cette intégration.

Réglages conseillés au renderer : sRGB, filtrage linéaire avec mipmaps, `RepeatWrapping`, environ 4–6 unités de monde par répétition, matériau très rugueux et repli procédural pendant le chargement. La couleur finale doit être inspectée avec l’éclairage réel. Ces valeurs sont des choix du prototype, sans certification de performance matérielle. Les fichiers ne livrent ni normal map, ni hauteur, ni paramètres physiques mesurés.

Provenance : création générative pour ce projet via l’outil imagegen disponible. Aucun statut de licence libre ou d’asset officiel Mass Effect n’est déduit de cette génération ; le suivi conserve les empreintes et les conditions d’origine sans attribuer une licence de tiers inventée.

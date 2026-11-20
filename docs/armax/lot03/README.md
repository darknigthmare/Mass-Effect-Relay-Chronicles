# Mass Effect — Armax Relay Clash
## Lot 03 · Génération des manquants

**26 PNG sélectionnés : 16 poses individuelles, 4 poses de combat de Shepard féminine et 6 décors.**

Date : 19 novembre 2026.

### Ouvrir le lot

1. Décompresser toute l’archive.
2. Ouvrir `Catalogue_Lot03.html` dans un navigateur : les filtres, la recherche et les fonds clair/sombre/damier fonctionnent sans serveur ni connexion.
3. Ouvrir une fiche pour lire ses dimensions, sa variante et ses réserves ; le lien PNG ouvre le fichier original retenu.
4. Lire `Bible_Complement_Lot03.md` pour les décisions de production et `asset-manifest.json` pour les chemins, SHA-256 et statuts.

### Production réelle

- 36 appels de génération ; 29 fichiers créés et 7 refus conservés.
- 26 fichiers sélectionnés ; 3 sortie créée non retenue.
- Tous les PNG sélectionnés sont identiques aux sorties du générateur : aucun redimensionnement, détourage ou repeint manuel.
- Les personnages et poses de combat mesurent 1024 × 1536 et possèdent un canal alpha réel. Leurs niveaux alpha plafonnent à 254 ; les couleurs RGB sous alpha 0 sont invisibles. Des pixels de très faible alpha peuvent toutefois produire une frange sur certains fonds.
- Les six décors sont des masters RGB opaques de dimensions natives variables.

### Ce que signifie « retenu »

Les sources de costume ont été inspectées et chaque sortie a reçu une revue visuelle et un contrôle de fichier. Les images restent des **concepts ou poses clés d’étude**. La fidélité 1:1, la stabilité d’animation, le pivot, l’échelle commune, les hitboxes et la composition dans le moteur restent à valider. Les quatre actions de Shepard ne forment pas une animation prête à lire. Les six décors ne constituent pas des ensembles de parallaxe séparés.

### Manquants immédiats

- **Grunt** : deux refus de sortie, aucun PNG.
- **M-300 Claymore ME3** : refus de sortie, aucun PNG dans cette vague.
- **Port Hanshan** : référence large insuffisante ; Menae a été produit à sa place.
- **Drone de Legion** : manquant documentaire conservé du lot précédent.

### Organisation

- `assets/fighters/` : poses individuelles.
- `assets/keyposes/` : études de combat de Shepard féminine.
- `assets/stages/` : six masters d’arènes.
- `qa/` : dimensions, alpha, SHA et observations détaillées ; revue indépendante des sorties principales.
- `provenance/` : journaux de génération, prompts exacts et références. Les chemins de travail y sont historiques ; les sources restent consultables par leurs URLs.

Les PDF et captures tiers de référence ne sont pas redistribués dans le paquet. Cette archive contient les nouveaux assets de ce lot ; les anciens lots et la bible v1 ne sont pas recopiés. Le complément de bible décrit la production actuelle sans prétendre avoir fusionné un document antérieur non récupéré.

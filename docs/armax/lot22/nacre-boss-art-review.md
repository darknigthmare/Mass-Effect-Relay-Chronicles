# Les Dettes de Nacre — Contrôle des bases de boss

Date : 27 novembre 2026. Périmètre : images de base générées, sans certification de fidélité 1:1, sans décompte d'animations terminées.

## Résultat vérifié

- 20 identités de boss définies dans la bible.
- 19 identités disposent d'une PNG native sélectionnée : 01, 02, 04 à 20.
- 2 PNG supplémentaires sont des anciennes versions conservées pour contrôle, dans `bosses/qa/` : boss02 R0 et boss20 R0. Elles ne constituent pas deux nouveaux boss.
- 21 PNG natives ont été conservées et déposées comme blobs Git immuables.
- Boss03 Halek Orr n'a pas de PNG : le générateur a renvoyé `moderation_blocked` à la sortie (catégorie `other`), request ID `a61abb1a-6206-4d74-8119-6025f1837519`. Aucun motif plus précis n'a été fourni et aucune nouvelle tentative de contournement n'a été effectuée.
- Les fichiers sélectionnés ont un canal alpha et des pixels entièrement transparents, vérifiés avec Pillow sans modification des images. La présence de ces pixels ne certifie pas la propreté intégrale du détourage.

## Sélection des versions

| Identité | Version retenue | Décision |
| --- | --- | --- |
| Terea Soth, boss02 | R1 | Retrait du pavillon d'oreille humain visible dans R0 ; anatomie asari revue. |
| Elyne Korda, boss20 | R1 | Identité distincte de Myra Nenn : femme mûre à peau brune foncée, cheveux courts poivre et sel. Uniforme civil anthracite, manchettes, pose et proportions conservés. |
| Autres boss produits | R0 | Bases candidates conservées pour intégration du prototype et contrôle suivant. |

## Écarts de production à traiter

| Sujet | Constat | Travail restant |
| --- | --- | --- |
| Voile lumineux périphérique | Plusieurs bases humanoïdes et la grue comportent encore un halo ou des valeurs semi-transparentes autour de la silhouette, malgré le fond transparent demandé. | Nouvelle correction ciblée avec imagegen et vérification sur fonds clairs/sombres ; ne pas déclarer le détourage final. |
| Marges | Certains sujets sont très proches des bords ; la pince de Murène-2 nécessite une marge sûre. | Recomposition des marges par imagegen ; vérifier les extrémités avant animation. |
| Grue GM-9, boss12 | Base de machine entière disponible ; contour et marges à améliorer. | Séparer rail, chariot, câble, pince et charges pour les mouvements prévus. |
| Cercle des verrous, boss14 | L'image représente uniquement l'assemblage central. | Produire et séparer les nœuds, portes, drones et états de verrouillage. |
| Murène-2, boss15 | La base comporte cinq grands segments corporels lisibles ; les six segments fonctionnels de la fiche ne sont pas confirmés visuellement. | Aligner le nombre de segments à la fiche puis livrer chaque articulation séparément. |
| Elyne Korda, boss20 | Le corps du personnage est disponible ; l'interface de commande est intégrée à la pose. | Produire le portique, les bras et modules mobiles du quai, puis les animations. |
| Tous les boss | Une seule base fixe par identité produite. | Produire poses, transitions, attaques, impacts, récupération, défaite et éléments mobiles selon la bible. Les 60 phases décrites ne constituent pas 60 animations réalisées. |

## Traçabilité

- `drafts/world/boss-art-prompts.json` : vingt prompts initiaux et deux corrections ciblées.
- `drafts/world/boss-art-manifest.json` : fichier sélectionné, source native, SHA-256, dimensions, alpha mesuré, statut, contrôle visuel et blocage boss03.
- `drafts/world/boss-git-blobs.json` : vingt-et-un blobs Git, chemins cibles et SHA.
- Dossier d'intégration : `public/assets/armax/lot22/originals/bosses/`.
- Sources natives : `generated_images/`, conservées sans conversion ni redimensionnement.
- Les mesures Pillow servent uniquement à vérifier les fichiers ; aucune retouche, segmentation ou recoloration n'a été faite par script.

Le statut d'intégration moteur est évalué séparément par les tests du prototype. Ce contrôle décrit la livraison artistique et ne déclare pas les vingt combats complets, les modules animés ou une qualité commerciale validée.

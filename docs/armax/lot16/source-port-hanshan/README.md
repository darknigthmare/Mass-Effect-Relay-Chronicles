# Port Hanshan — trois calques fixes du lot16

**Base examinée : `71955d9143562d6a44a8b8d48bc552978372bc1e`.** Quatre appels à `image_gen.imagegen`, quatre PNG natifs conservés, trois versions sélectionnées et aucun refus. Le sol PH-40 a reçu une révision ciblée ; sa R0 est conservée et écartée. Les images sont des éditions génératives de candidats internes historiques ; elles n’apportent aucune nouvelle preuve de reconstruction canonique.

## Fichiers produits

| Couche | Identifiant | PNG natif | Dimensions |
|---|---|---|---:|
| PH-20 | `layer_port_hanshan_architecture_distant_fixed` | [Architecture distante](../../../../public/assets/armax/lot16/layers/port-hanshan-ph20-architecture.png) | 1672 × 941 |
| PH-30 | `layer_port_hanshan_rear_structures_fixed` | [Structures arrière](../../../../public/assets/armax/lot16/layers/port-hanshan-ph30-structures.png) | 1672 × 941 |
| PH-40 R1 sélectionnée | `layer_port_hanshan_floor_fixed` | [Sol et jonction](../../../../public/assets/armax/lot16/layers/port-hanshan-ph40-floor.png) | 1671 × 941 |
| PH-40 R0 écartée | même sujet, révision historique | [Sol R0](../../../../public/assets/armax/lot16/layers/port-hanshan-ph40-floor-r0.png) | 1671 × 941 |

Les quatre PNG sont RGBA avec alpha réel de 0 à 255. Ils restent **Prototype**, `fidelity1to1Validated:false`, `engineIntegrated:false`, `animationComplete:false`. Ils représentent trois couches de décor et ne créent pas trois nouvelles arènes.

## Sources et usages

Le registre [combat 2D historique](../../../combat-2d/production.json) contient déjà un extérieur opaque, un intérieur avec fenêtres transparentes et une bordure de premier plan. Le [contrat de composition](../../../combat-2d/CONTINUATION_2026-11-19.md) prévoit les couches PH-00 à PH-50 et PH-FX.

PH-20 isole les masses architecturales de l’extérieur ; les surfaces auparavant masquées par la neige et le brouillard sont reconstruites. PH-30 conserve les structures intérieures, sans le sol. PH-40 conserve le sol et son étroite jonction arrière, sans les murs. Le PNG PH-30 est également utilisé comme référence de calage de PH-40. Les facteurs 0,28 / 0,55 / 1,00 reprennent les propositions du document historique ; aucun mouvement de caméra n’est implémenté.

Les sources complètes et leurs empreintes figurent dans le [manifeste](manifest.json). Leurs copies de travail sont conservées hors dépôt pour la revue ; les originaux restent dans le commit source. Les prompts exacts sont les quatre fichiers `.prompt.json` de ce dossier, et les appels sont consignés dans [attempts.json](attempts.json).

## Réserves de composition

- **PH-20 :** un petit îlot alpha détaché reste visible en haut à gauche ; fines franges cyan/bleues à contrôler sur fonds clairs. Les détails découverts par retrait de météo sont interprétés.
- **PH-30 :** de fines franges subsistent autour de certaines ouvertures et sous les garde-corps. La partie forte de l’architecture s’arrête vers y = 672.
- **PH-40 R0 :** le sol commençait à y = 674 en alpha ≥ 128, laissant la rangée y = 673 faiblement couverte. Cette version est conservée mais n’est plus sélectionnée.
- **PH-40 R1 :** la jonction est relevée et le jour vertical est corrigé au seuil alpha 128 sur la largeur commune de 1671 pixels. À y = 672, l’alpha minimal de l’union est d’environ 156,5 ; à y = 673, il atteint environ 218,6. Des franges et une légère transparence résiduelle restent visibles selon le fond.
- **Largeur :** PH-40 R1 reste nativement large de 1671 pixels, contre 1672 pour PH-20/PH-30. La colonne de droite n’est donc pas couverte par le sol à un alignement sans décalage. Cette différence est conservée et aucune nouvelle boucle de génération n’est effectuée.
- **Assemblage :** le calage final reste à résoudre avant intégration. Les fichiers originaux n’ont subi ni recadrage, ni redimensionnement, ni correction externe de pixels. PH-50 existe déjà dans le registre historique et n’a pas été régénéré.

La [vérification technique](verification.json) distingue la réussite des contrôles de fichiers de l’absence de validation de composition. Elle consigne séparément les mesures alpha des jonctions R0 et R1 ; elle ne certifie ni moteur, ni collision, ni fidélité 1:1.

## Conservation des octets

PH-20 et PH-40 sont des copies identiques des fichiers natifs sauvegardés par le service. Pour PH-30, la réponse contenait le PNG complet mais aucun chemin sauvegardé utilisable. Ses octets base64 ont été décodés sans réencodage et conservés ; la copie finale possède la même empreinte. Cet incident ne représente ni un nouvel appel, ni une perte d’image, ni une opération sur les pixels.

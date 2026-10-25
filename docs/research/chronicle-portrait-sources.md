# Références des portraits des Chroniques

Relevé du 25 octobre 2026 sur la base `748b965`. Cette note décrit les références et la livraison de trois portraits de prototype ; elle ne certifie ni animation, ni costume complet, ni conformité artistique 1:1. Le [rapport de consultation](../qa/chronicle-portrait-reference-report.json) distingue les documents effectivement téléchargés des guides seulement indexés.

## Références primaires consultées

Le [manuel PC français de Mass Effect 2](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) a été vérifié à nouveau : HTTP 200, `application/pdf`, 2 937 619 octets, 18 pages PDF et SHA-256 `c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1`. Sa couverture, **page PDF 1**, montre Miranda et Thane à droite de Shepard. Le manuel ne légende pas leurs noms sur cette illustration ; les identités sont rapprochées des fiches `ME2-CHR-MIRANDA` et `ME2-CHR-THANE` du catalogue existant.

La page entière a été rendue avec Poppler 26.05.0, sans découpage, recoloration, reconstruction ni ajout de pixels de costume :

```sh
pdftoppm -f 1 -l 1 -scale-to 1100 -png -singlefile \
  /tmp/relay-me2-manual-fr.pdf /tmp/chronicle-visual-review/me2-cover
```

Le fichier de travail est `/tmp/chronicle-visual-review/me2-cover.png`, **734 × 1100**, SHA-256 `02be5914876656148d6b84f190d533a92d8b91b5b4d5a81ec267f2d790c3cf01`. Il sert de référence à la génération et n’est pas un nouvel asset du jeu. Le PDF et son rendu de travail ne sont pas ajoutés aux assets distribués.

Le [manuel PC anglais de Mass Effect 3](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf), sans suffixe de langue dans l’URL, a également répondu HTTP 200 : `application/pdf`, **1 886 992 octets**, **27 pages PDF**, SHA-256 `07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01`. La **page imprimée/PDF 5** contient un écran du commando portant le nom « Garrus » et son buste. Les captures ont été inspectées sur les pages 5–7, 10 et 12–14 ; elles n’apportent pas de référence suffisamment lisible de Liara, EDI, Javik ou James pour ce sous-lot.

Le rendu intégral de la page 5 est `/tmp/chronicle-visual-review/me3-page5.png`, **1160 × 1500**, SHA-256 `0107765bbb643ea942788c34103e10c435ee58ef42bdc3c8d42469187d004c2f`. La capture de Garrus intégrée au PDF ne contient que **512 × 256 pixels**, interface comprise : agrandir le rendu de page n’ajoute aucun détail de visage ou d’armure.

## Sous-lot utilisable

| Fiche et contexte exclusif | Éléments effectivement visibles | Limites de la génération |
|---|---|---|
| `ME2-CHR-MIRANDA`, `ME2/me2` | Visage humain, cheveux bruns arrivant aux épaules, raie latérale ; col clair ouvert ; panneau blanc à motif alvéolé sur le buste ; côtés et manches sombres ; détails géométriques de sa tenue Cerberus. | Portrait tête et haut du buste uniquement. L’arme, l’autre épaule, la taille et les jambes sont masquées ou coupées. Ne pas prolonger un costume complet ni importer une tenue de ME3. |
| `ME2-CHR-THANE`, `ME2/me2` | Drell à peau verte/olive ; tête sans cheveux, reliefs et zones sombres sur le crâne ; grands yeux très sombres ; visage et cou non humains ; veste sombre brune/noire à haut col ouvert, coutures et bordures claires. | Portrait tête et haut du buste uniquement. Conserver les proportions drell sans les transformer en celles d’un galarien ou d’un turien. Le bas du vêtement et le dos ne sont pas établis par cette vue. |
| `ME3-CHR-GARRUS`, `ME3/me3` | Légende « Garrus », tête turienne à plaques et mandibules, marques bleues, viseur latéral bleu, dommages au visage ; haut d’armure sombre bleutée et emblème coloré au plastron. | Référence secondaire possible pour un portrait de prototype ME3 seulement. Les détails fins, le dos et le corps entier restent à obtenir ; ne pas réutiliser cette armure pour `ME2-CHR-GARRUS` ou pour le Garrus ME1. |

La couverture établit les deux premiers bustes avec davantage de détail que la petite capture de Garrus. Leur présence visuelle ne change pas les autorisations de scénario, les recrutements ou les sauvegardes. Le portrait de Miranda peut suivre son identité ME2 dans les deux essais déjà autorisés ; celui de Thane reste dans son atelier ME2 autorisé. Aucun portrait ne doit être lié au seul nom « Miranda » ou « Thane » indépendamment de l’œuvre.

Shepard visible sur la couverture ne définit pas l’apparence du profil générique : cette planche ne doit pas imposer un Shepard masculin aux préparations personnalisables. L’atlas ME1 existant peut guider le traitement pictural et la lisibilité ; il ne fournit pas le costume des personnages de ME2/ME3.

## Planche générée et intégration bornée

L’opérateur de génération a fourni une planche de **trois bustes**, Miranda ME2 à gauche, Thane ME2 au centre et Garrus ME3 à droite. Les entrées confirmées de `image_gen.imagegen` sont le rendu de la couverture ME2, le rendu de la page 5 ME3 et `public/assets/crew-atlas.png`. Ce troisième fichier est une référence de **style uniquement** ; aucun costume ME1 n’est réassigné. Les chemins et leurs empreintes sont consignés dans les [métadonnées](../../public/assets/chronicle-portraits.json). Le résumé du prompt est conservé, sans prétendre en archiver le verbatim.

L’original `/workspace/generated_images/exec-01bbe381-b451-466e-b90c-62acf657a7ec.png` est conservé. La copie distribuée `public/assets/chronicle-portraits-me2-me3.png` est identique octet par octet : **PNG RGBA, 1536 × 1024, 2 622 017 octets**, SHA-256 `7e1e20382766f0740e06dcae7f4598ff3f9d2528fc434988e495a129803b3ebd`. Aucun découpage, redimensionnement, recoloriage ou retrait de fond n’a été appliqué aux pixels. Les trois cadrages de rendu sont `(0,0,512,1024)`, `(512,0,512,1024)` et `(1024,0,512,1024)`.

La planche a été ouverte et comparée aux références consultées. Les trois identités sont reconnaissables et le traitement pictural est cohérent, mais les détails générés de visage, coutures, reliefs, cicatrices et armure restent des interprétations de prototype. Les quatre coins ont un alpha nul ; le maximum d’alpha est **254**, avec des centres de cellules à **253**. Les contours doux et halos colorés sont conservés : aucun pixel n’est totalement opaque. Cette inspection ne certifie pas la géométrie des modèles du jeu.

Le helper `getUniversePortrait(actorId, context, scenarioId?)` fournit un chemin d’atlas local et un rectangle de source. Il exige l’identité exacte, le contexte normalisé et l’autorisation de l’acteur dans le scénario lorsqu’il est fourni. Miranda est limitée aux essais ME2 Freedom’s Progress et atelier ; Thane à l’atelier ME2 ; Garrus à l’atelier ME3. ME1, les prologues, les autres œuvres et le Shepard générique conservent leur présentation existante. Les définitions natives d’acteurs restent symboliques et ne sont pas modifiées par ce calque visuel.

Les **sept tests Node ciblés** vérifient les octets et dimensions du PNG, les régions, tous les scénarios, les entrées invalides, les contextes étrangers, l’absence de mutation des acteurs et la provenance. La validation navigateur de l’intégration appartient à un contrôle distinct ; ces tests ne la remplacent pas. Les trois fiches de portrait peuvent seulement revendiquer un **prototype partiel** après cette QA, sans achèvement des animations.

## Dix apparences prioritaires encore à documenter en détail

L’[index officiel EA des guides cosplay](https://www.ea.com/games/mass-effect/community/cosplay-guides) a été consulté avec succès. Il énumère vingt guides, dont les dix cibles ci-dessous. Il ne suffit pas à établir quelle tenue ou quel épisode figure dans chaque PDF. Les dix archives ont échoué au téléchargement avec une erreur de tunnel HTTP 403 ; leur contenu **n’a pas été consulté** et aucune vue, couleur ou couture n’est déclarée vérifiée par ces guides.

| Priorité | Fiche ciblée | Vérification nécessaire avant un sprite ou un nouveau portrait |
|---|---|---|
| 1 | `ME2-CHR-MIRANDA` | Couverture exploitable pour le buste ; guide `mirandalawson` requis pour silhouette complète, bottes, dos et bras masqués. |
| 2 | `ME2-CHR-JACOB` | Guide `jacobtaylor` : tenue de Cerberus ME2, proportions du torse, chevelure et marquages ; ne pas employer le Jacob de Galaxy. |
| 3 | `ME2-CHR-MORDIN` | Guide `mordinsolus` : silhouette galarienne, tête et oreilles asymétriques, coupe et panneaux de la tenue de cette période ; aucun humain recoloré. |
| 4 | `ME2-CHR-JACK` | Guide `jack` : distinguer son apparence ME2 des cheveux et vêtements de ME3 ; relever les tatouages et la coupe exacte sur des vues lisibles. |
| 5 | `ME2-CHR-GARRUS` | Guide `garrusvakarian` : armure d’Archangel, état des dommages et cicatrices ; ne pas copier le buste ME3 du manuel ou l’atlas ME1. |
| 6 | `ME2-CHR-TALI` | Guide `talizorah` : combinaison environnementale, masque, capuche et motifs propres à la tenue choisie ; visage découvert non autorisé par cette référence. |
| 7 | `ME3-CHR-LIARA` | Guide `liaratsoni` : apparence et tenue de terrain ME3 ; ne pas substituer la tenue ME1 ni une illustration de Redemption. |
| 8 | `ME3-CHR-EDI` | Guide `edi` : corps synthétique de terrain ME3, articulations et matériaux ; ne pas représenter l’IA ME2 comme ce corps. |
| 9 | `ME3-CHR-JAVIK` | Guide `javik` : morphologie prothéenne et armure ; conserver l’accès conditionnel From Ashes, sans réassigner une silhouette drell ou galarienne. |
| 10 | `ME3-CHR-JAMES` | Guide `jamesvega` : James de ME3, visage, gabarit et tenue de terrain ; ne pas utiliser le dessin animé Paragon Lost comme costume ME3. |

Les noms entre accents graves sont les composants d’URL des archives officielles. Le rapport conserve leurs URL complètes. Ces lignes sont des critères de vérification et des risques de confusion, pas une certification des détails encore invisibles.

## Portée de la livraison

La planche livre trois portraits séparables, limités aux bustes visibles. Une coupe au buste évite de reconstruire les parties cachées ; les appendices, traits du visage et couleurs devront rester stables si des variantes sont produites. La transparence, le cadrage et les marges sont à conserver pendant le raccord de l’interface.

Même après inspection et intégration, ces images resteront des **portraits de prototype partiels**. Elles ne livrent ni sprites en pied, ni marche, ni huit directions, ni cycle de tir, ni équipement interchangeable. Les tâches d’animation restent distinctes et ne sont pas achevées par la présence d’un portrait. Les 42 profils des Chroniques et leurs règles existantes ne deviennent pas visuellement certifiés par ce sous-lot.

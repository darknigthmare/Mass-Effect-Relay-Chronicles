# Lot20 — personnages humains

Date : 27 novembre 2026. Base de travail : `b83a62d277d93cd8140113ee2318745fcdedf8d6`.

Les quatre cibles confiées à cette passe ont été traitées. Deux nouveaux PNG natifs sont retenus comme **Prototypes**. Une attribution de PNG historique est proposée pour Jenkins. Henry Lawson reste sans génération, faute de référence complète lisible. Aucune fidélité 1:1 ni intégration moteur n’est certifiée.

## Résultats et comptage

| Identité existante | Résultat | Fichier ou rapport | Comptage |
|---|---|---|---|
| `chr_me1_ahern` | Nouveau candidat debout, ME1 original / Pinnacle Station | `public/assets/armax/lot20/characters/human-ahern-me1-standing.png` | 1 nouveau PNG |
| `chr_me2_joker` | Nouveau candidat debout, tenue Normandy SR-2 ME2 | `public/assets/armax/lot20/characters/human-joker-me2-standing.png` | 1 nouveau PNG |
| `chr_me1_jenkins` | Attribution candidate du fichier de marine historique après comparaison avec de nouvelles références exactes | `recovered-attributions.json` | 0 nouveau PNG ; fichier conservé dans lot17 |
| `chr_me3_henry_lawson` | Référence incomplète malgré nouveau portrait et images de la séquence originale | `manifest.json`, entrée `not_generated_reference_gap` | 0 génération |

Les deux PNG natifs réussis figurent tous deux dans `manifest.assets`, avec `selected:true`. Il n’existe aucune révision cachée, tentative de génération refusée, animation ou planche de poses dans ce sous-lot. Les deux appels réussis sont consignés dans `manifest.attempts`.

`selected:true` signifie candidat de production retenu. Chaque asset garde `status:Prototype`, `fidelity1to1Validated:false` et `engineIntegrated:false`. Ahern, Joker et Henry restent des soutiens narratifs. Jenkins conserve le rôle candidat au combat du catalogue. Une pose assise de Joker serait un livrable distinct ; elle n’est pas produite ici.

## Ahern — variante originale documentée

La [galerie du DLC Pinnacle Station](https://www.masseffect-game.de/mass-effect-1/bilder/pinnacle-station-dlc) fournit des captures nommées et datées de septembre 2009. La vue `me1ps_20090928_01.jpg` montre les tracés de la tunique bleu marine, le col, les passepoils dorés, les deux attaches et les poignets. `me1ps_20090927_04.jpg` montre une jambe et une chaussure derrière Shepard ; `me1ps_20090927_05.jpg` complète la silhouette entière, petite et éloignée. Le portrait du wiki a été recoupé avec ces captures anciennes. Le [communiqué EA du 26 août 2009](https://news.ea.com/press-releases/press-releases-details/2009/BioWare-Expands-Mass-Effect-Universe-with-New-Downloadable-Content-Pack-for-Episode-1/default.aspx) documente le contexte du DLC original.

Le candidat reprend ces éléments dans une pose de conversation sans arme. Le visage est plus anguleux et sévère, les cheveux et la barbe plus réalistes que dans le modèle de jeu. L’épaisseur des liserés, les plis du pantalon et le détail des chaussures restent interprétés. Une seule chaussure est assez visible dans la référence proche : les deux pieds ne sont pas validés au détail.

## Joker — nouveau complément de silhouette

Les portraits et la vue arrière déjà récupérés au lot19 ne montraient pas les pieds. La [séquence de jeu publiée par WC3Gaming le 10 juillet 2011](https://www.youtube.com/watch?v=LfEWLLTRilQ) apporte les vues manquantes de silhouette : Joker debout de dos à 2:15, debout de face/trois-quarts à 6:15, puis assis à 6:20 et 6:35. Le dernier cadrage à 7:55 précise les panneaux du torse et la ceinture. Onze feuilles de vignettes publiques du lecteur, soit 97 images, ont été inspectées. Chaque vignette mesure **320×180** : il ne s’agit pas de captures extraites de la vidéo à 1080p.

Le nouveau sprite respecte la casquette SR2, la barbe, les yeux verts, les manches courtes, les panneaux clairs et la double ceinture. Le nez, le menton et la barbe sont réinterprétés ; la matière et les divisions fines du torse sont simplifiées. Les poches, coutures et bottes ne sont pas verrouillées au détail par ces petites vues. Le candidat reste en pose neutre, sans arme ni pouvoir ajouté.

L’aperçu du port communautaire GMod retrouvé sur Steam reste coupé aux cuisses et n’a pas été fourni au générateur. Le sprite existant de Joker ME1 assis et la capture de salut en tenue ME3 ont été exclus comme substitutions de période ou de pose.

## Jenkins — résolution d’une attribution historique

Le fichier historique `public/assets/armax/lot17/recovered/candidate-alliance-marine-1b151607.png` a été comparé au corps de Jenkins à Eden Prime et à deux portraits nommés. Le casque monde ouvert à disques, les doubles liserés thoraciques, les épaules percées, les chevrons souples, les hanches circulaires, les genoux à deux ronds et la géométrie des bottes convergent. Les yeux bleus et les traits du visage sont cohérents, avec un rendu embelli.

Le casque de l’écran d’inventaire est différent du modèle monde observé à Eden Prime ; cette différence est explicitement conservée dans la preuve. Les octets du PNG ont été comparés au blob Git de la base : ils sont identiques. Le fichier n’a été ni recopié sous lot20, ni renommé, ni retouché. Son prompt, son reçu et sa date de génération d’origine restent inconnus.

La texture d’armure du candidat est sensiblement plus usée et détaillée que dans la capture. L’édition exacte de la capture communautaire et l’absence de mods ne sont pas établies. Le rapport propose seulement une association candidate : `imageLot:lot17`, `attributionLot:lot20`, zéro nouvel essai de génération.

## Henry Lawson — manque conservé et précisé

Le nouveau portrait `Henry_Lawson_charshot.png` (1800×2160, fourni en WebP par le CDN) documente désormais le visage, le col et le haut rouge/mauve de la tenue Sanctuary. Il est coupé sous la poitrine. Les scènes de prise d’otage masquent le corps derrière Oriana. Vingt-sept vignettes de la [compilation ME3 publiée le 28 mars 2012 par OhManTFE](https://www.youtube.com/watch?v=1MATpORpJeg) ont également été inspectées ; Henry demeure trop sombre, éloigné ou coupé pour établir les panneaux de taille, le pantalon et les deux chaussures.

La page Prima a refusé le téléchargement. Le mod « Henry Lawson Looks Like Miranda » annonce une nouvelle tête et tenue et n’a pas été utilisé comme référence canonique. Il manque une capture originale lisible de la taille aux pieds, ou une vue documentée du modèle original complet. Aucun costume générique n’a été ajouté pour remplir ce manque.

## Transparence, provenance et livraison

Les deux sorties natives ont été copiées avec égalité exacte des octets. Leurs dimensions sont 1024×1536, leur mode RGBA et leur plage alpha 0–254. Le sujet reste quasi opaque ; aucun pixel n’atteint alpha255. Des pixels de faible alpha périphériques sont présents et sont conservés tels quels. Les compositions sur fonds clair/sombre ne montrent pas de large halo visible.

Les fichiers `qa/*-alpha-comparison.png` sont des compositions de contrôle séparées, sans modification des sprites livrés. Le manifeste contient les dimensions, tailles, SHA-256, bornes alpha et décomptes de pixels. La revue indépendante de root a recoupé Ahern, Joker et Jenkins avec leurs références exactes et conserve les réserves ci-dessus.

Les images tierces restent dans le cache externe au dépôt. Seuls leurs URLs, hashes, dimensions, rôles et notes d’inspection sont livrés. Les accès refusés sont consignés dans les recherches et ne sont pas transformés en preuves visuelles ou en tentatives de génération. Le catalogue, l’index, le classeur et les fichiers des lots précédents ne sont pas modifiés par ce sous-lot ; leur consolidation est distincte.

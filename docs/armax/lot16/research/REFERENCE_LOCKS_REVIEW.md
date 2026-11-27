# Lot 16 — Thane loyauté et drone de Legion

Date de recherche : 25 novembre 2026. Base de travail : `71955d9143562d6a44a8b8d48bc552978372bc1e`.

## Décision

**Les deux réserves restent ouvertes.** Aucun asset n’a été généré, aucun PNG de production n’a été modifié et aucun changement n’a été effectué dans le dépôt pendant cette recherche. Les deux JPG joints sont des références consultées, pas des assets livrables du jeu.

| Entrée | Résultat | Élément encore nécessaire |
| --- | --- | --- |
| `cst_me2_thane_loyalty` | Variante native non verrouillée | Capture explicitement identifiée standard/loyauté ou extraction native traçable |
| `DRONE-FIDELITY` | Géométrie et état du drone de Legion non verrouillés | Menu du pouvoir lié à une invocation observable, puis vues proches du drone |

## 1. Thane — costume de loyauté ME2

Le catalogue lot 14 maintient un manque réel : la planche de Troodon80, déjà examinée au lot 13, ne relie pas sans ambiguïté son modèle à la variante de loyauté. Les huit aperçus Ottemis ont été précédemment exclus comme retextures HD. Ces résultats sont repris du registre existant ; ils ne sont pas présentés comme une nouvelle inspection des images par cette recherche.

La recherche complémentaire n’a pas fourni la capture native nécessaire. Elle a en revanche permis de séparer clairement trois pistes :

| Source | Ce qu’elle établit | Limite |
| --- | --- | --- |
| [Xbox — Alternate Appearance Pack 1](https://www.xbox.com/en-GB/games/store/alternate-appearance-pack-1-garrus-thane-jack/C1X221KHR62K/0001) | La fiche officielle décrit un uniforme DLC avec lunettes rouges réfléchissantes pour Thane. | Ce produit ne fournit pas la référence de la tenue de loyauté recherchée. |
| [Index XNALara, page 1763](https://www.tombraiderforums.com/showthread.php?page=1763&t=151335) | L’index de recherche mentionne un modèle nommé Thane Loyalty attribué à ignacio77. | Page en 403 ; aucune archive ni texture inspectée. La collection comporte aussi des variantes camouflage, qu’il faudrait distinguer. |
| [Guide Steam ME2 — Adepte — Démentiel](https://steamcommunity.com/sharedfiles/filedetails/?id=2898790167) | La page est classée dans Mass Effect Legendary Edition. | Son image de profil n’atteste pas le passage standard/loyauté ni l’absence de modifications. |
| [Assassin Krios](https://www.nexusmods.com/masseffectlegendaryedition/mods/1654) | La description indexée explique une modification du costume lors du recrutement. | Mod Legendary Edition ; aucune preuve visuelle native exploitable pour le verrou demandé. |

**Conséquence de production :** conserver `cst_me2_thane_loyalty` sans nouvelle image. Ne pas requalifier la planche Troodon80, utiliser les textures Ottemis, appliquer une recoloration libre ou substituer le costume AAP1.

## 2. Drone de Legion — preuves visuelles partielles

### Capture Millenium : menu du pouvoir

Source : [Mass Effect Legendary Edition — pouvoirs](https://br.millenium.gg/guias/12495.html).

Image inspectée : `legion_menu_millenium.jpg`, 1920 × 1080, SHA-256 `6a8ba559ed7f96466df48642efbb071671b8da0b03c78371502a77e8411e107e`.

L’image nomme Legion et affiche la description du rang 4 de Combat Drone. Les options Attack Drone et Explosive Drone apparaissent dans le texte. Le bouton Purchase Rank est visible : cette capture n’établit pas laquelle a été achetée. Aucun drone invoqué n’y apparaît. Elle prouve la présence des deux choix dans ce menu, mais ne fixe ni la géométrie ni la couleur de l’objet à produire.

L’article est consacré à Legendary Edition. L’image seule ne permet pas de certifier son édition exacte ni l’absence de modifications. Le portrait de Legion sert uniquement à identifier le menu ; aucun asset du corps de Legion n’a été créé.

### Capture GamerGuides : drone violet en contexte Tali

Source : [Combat Drone — guide Legendary Edition](https://www.gamerguides.com/mass-effect-2-legendary-edition/guide/powers/tech/combat-drone/).

Image inspectée : `drone_action_gamerguides.jpg`, 3840 × 2160, SHA-256 `87709efa0301a89ac69e469009470ccd859df6bd0d6b67bccbf32ff94ec8e117`.

La capture montre une sphère holographique violette/rose devant un LOKI Mech, avec bandes et arcs lumineux. Le HUD affiche Kasumi et Tali, sans Legion. Une image fixe ne suffit pas à relier l’objet à une commande d’invocation précise ; elle ne fournit pas non plus l’évolution sélectionnée. Sa palette et son contexte empêchent de la présenter comme une référence vérifiée du drone de Legion.

Le guide précise que ses médias ont été mis à jour pour Legendary Edition. Cette source permet d’observer un drone en jeu, mais pas de lever le verrou du prototype Legion ME2 original.

### Texte sur les couleurs : piste exclue comme preuve native

[Custom Combat Drone Colors](https://www.nexusmods.com/masseffect2/mods/276?tab=description) décrit des modifications de teintes et une option utilisant, selon l’auteur, des valeurs du drone de base de Legion. La page a répondu 403 ; seule sa description indexée a été lue. Ni l’affirmation de l’auteur ni les aperçus d’un mod ne suffisent à certifier le drone natif.

La [fiche Combat Drone du wiki](https://masseffect.fandom.com/wiki/Combat_Drone) reste une orientation secondaire. Le registre actuel en dépend déjà et précise que grille, anneaux et teintes sont encore interprétés.

**Conséquence de production :** `ME2-VS-LEGION-DRONE-IDLE-01` reste un prototype à fidélité non validée ; `DRONE-FIDELITY` reste ouvert. Une correspondance avec un drone de Tali ne doit pas être affirmée sans preuve.

## 3. Conditions concrètes de levée des réserves

Pour Thane, une courte séquence de la version originale non modifiée peut suffire si elle montre le personnage entier, le changement de costume dans le sélecteur et le lien explicite avec la récompense de loyauté. Une extraction est également exploitable si sa provenance et ses ressources natives sont vérifiables. Une seule image étiquetée par un tiers, sans lien avec la variante, reste insuffisante.

Pour le drone, il faut relier le menu de Legion à l’invocation visible dans la même session et identifier le rang ou l’évolution. Des vues proches doivent ensuite permettre d’examiner la silhouette, la grille, les anneaux et les teintes. Les paramètres du kit Armax ne permettent pas de déduire rétroactivement l’évolution du jeu d’origine.

## 4. Livrables de recherche

- `reference-locks-review.json` : registre structuré, sources, portée de preuve, exclusions et décisions.
- `download-log.json` : URLs directes, dimensions et empreintes des deux images inspectées.
- `legion_menu_millenium.jpg` : preuve partielle du menu du pouvoir.
- `drone_action_gamerguides.jpg` : capture à exclure du verrou exact Legion.

Les échecs d’accès 403 n’ont pas été contournés ni retentés. Aucun résultat non consulté n’est traité comme une inspection visuelle.

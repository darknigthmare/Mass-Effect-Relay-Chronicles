# Armax — lot 04 : références, contrôle visuel et limites

Recherche du 19 novembre 2026. **Statut : Prototype. Aucune fidélité 1:1 certifiée.**

Les quatorze briefs sont dans `canon-roster.json`. Ce fichier contient des propositions de prompts et leur provenance ; il ne constitue pas un journal des appels de génération. `source-provenance.json` identifie les références effectivement regardées, leur cadrage et leur empreinte SHA-256. Le champ `artisticDetailsVerified` signifie uniquement que certains détails visibles ont été comparés aux pixels d'une référence ; il ne valide pas un sprite généré ni la totalité de la tenue.

Les images tierces de recherche restent hors du dépôt. Les URL, identifiants de sources, observations et limites ci-dessous peuvent accompagner la PR. Une capture partielle, un concept de production et un rendu communautaire n'offrent pas la même preuve qu'un modèle final examiné dans le jeu.

## Œuvres primaires et scènes de contrôle

Les jeux n'ont pas été lancés au cours de cette passe. Ces entrées indiquent **où effectuer la vérification finale**, sans prétendre qu'elle a déjà eu lieu.

| ID | Œuvre | Scènes ou variantes à contrôler |
|---|---|---|
| `canon-me1` | *Mass Effect*, BioWare, 2007, et *Bring Down the Sky* | Nihlus et Anderson à bord du Normandy SR-1 ; Saren organique/cybernétique à Eden Prime ou Virmire ; Bénézia sur Noveria ; Kirrahe au camp de Virmire ; Balak lors de la confrontation finale sur X57. |
| `canon-me2` | *Mass Effect 2*, BioWare, 2010, et *Lair of the Shadow Broker* | Morinth dans sa tenue civile à Afterlife et dans son appartement ; Tela Vasir sur Illium ; Courtier de l'ombre yahg lors de la rencontre finale du DLC. |
| `canon-me3` | *Mass Effect 3*, BioWare, 2012, et *Omega* | Eve dans Priorité : Sur'Kesh et sur Tuchanka ; Nyreen dans Omega ; Kai Leng à la Citadelle, sur Thessia et au QG de Cerberus. |
| `canon-andromeda` | *Mass Effect: Andromeda*, BioWare, 2017 | Archonte dans les rencontres de l'histoire principale. Le turnaround de son artiste, identifié plus bas, est la référence visuelle primaire effectivement examinée. |

La [page officielle EA de Legendary Edition](https://www.ea.com/games/mass-effect/mass-effect-legendary-edition) (`publisher-legendary-edition`) confirme le périmètre de la compilation. Elle ne documente pas chaque costume.

## Sources primaires consultées

### Archonte : auteur du modèle

**`author-archon-2017-04-04`** — [Mass Effect Andromeda Art Dump, page 2, publication 21 du 4 avril 2017](https://www.zbrushcentral.com/t/mass-effect-andromeda-art-dump/206455?page=2). Le turnaround porte le crédit **Christopher Cao / EA BioWare Montréal**. [Image consultée](https://www.zbrushcentral.com/uploads/default/original/3X/4/1/41f439449368bfd9be39a2bfeaecfd3ec1afe49c.jpeg).

Contrôle effectué sur les vues avant, côté et dos : anneau osseux fermé beige au-dessus du crâne ; visage bleu-gris ; armure olive/noire ; col métallique segmenté ; épaules hautes et pointues ; trois tubes cyan de chaque côté du torse ; panneaux textiles bleu sombre à motifs de labyrinthe ; trois doigts et trois orteils. Cette inspection soutient le brief visuel, sans certifier les sorties générées.

### Mass Effect Infiltrator

**`bioware-infiltrator-2012-05-22`** — [BioWare, « Mass Effect Infiltrates Android! », 22 mai 2012](https://blog.bioware.com/2012/05/22/mass-effect-infiltrates-android/). Source développeur pour le produit, le cadre Cerberus, l'équipement et les pouvoirs biotiques du jeu. Ne suffit pas à établir la couleur exacte d'une armure.

**`bioware-infiltrator-2012-04-12`** — [BioWare, « Mass Effect Infiltrator Update », 12 avril 2012](https://blog.bioware.com/2012/04/12/mass-effect-infiltrator-update/). La mise à jour 1.0.3 ajoute un **prisonnier turien jouable distinct de Randall** et fait varier les cicatrices faciales et les couleurs biotiques selon les choix. Aucun état fixe de cicatrices n'est donc imposé au brief.

## Références visuelles secondaires examinées

Les observations suivantes proviennent des images regardées, et non des légendes automatiques du moteur de recherche. Leurs fichiers restent dans l'espace de recherche temporaire.

| Personnage et ID de source | Source et portée | Détails retenus et réserves |
|---|---|---|
| Bénézia — `press-benezia-gameinformer` | [Game Informer, article sur les boss de Legendary Edition](https://gameinformer.com/2021/02/15/how-mass-effect-legendary-edition-makes-boss-fights-more-effective). Capture du visage et du buste. | Coiffe noire haute à pointes fines, bande centrale vers le nez, costume noir métallique nervuré. Bas de la tenue et chaussures non contrôlés. |
| Nihlus — `press-nihlus-softpedia` | [Softpedia, présentation de Nihlus Kryik](https://news.softpedia.com/news/Mass-Effect-RPG-Fans-Meet-Nihlus-Kryik-67457.shtml). Capture du Normandy, personnage entre deux humains. | Plaques faciales claires à marquages sombres, armure grise/noire, bordeaux et lumières rouges au col. Pieds absents du cadrage. |
| Kirrahe — `press-kirrahe-rpgsite` | [RPG Site, choix de Virmire et équipe de Kirrahe](https://www.rpgsite.net/feature/11128-mass-effect-virmire-choices-who-to-send-take-dealing-with-wrex-and-assisting-kirrahes-team). Capture de la silhouette entière. | Plaques **ivoire/crème sur noir**, quelques accents bordeaux, peau vert pâle mouchetée. L'orange des soldats à l'arrière-plan n'est pas sa palette. |
| Anderson — `press-anderson-nerdstash` | [The Nerd Stash, choix d'Anderson ou Udina](https://thenerdstash.com/mass-effect-legendary-edition-anderson-or-udina-for-council/). Portrait ME1/Legendary Edition. | Uniforme marine, liserés et trois barres d'épaule dorés, cheveux très courts, visage rasé. La chaîne est visible dans la capture séparée du Normandy utilisée pour Nihlus. Jambes et chaussures non contrôlées. |
| Morinth — `community-morinth-troodon80` | [Troodon80, Morinth Model Reference](https://www.deviantart.com/troodon80/art/Mass-Effect-2-Morinth-Model-Reference-275634055). Image téléchargée et examinée ; page retournant 403. Rendu communautaire multivue. | Tenue civile brun très sombre/noir, col fermé, bandes et attaches horizontales, panneaux de maille grise, gants et bottes hautes. L'extraction et l'absence de retouches du modèle n'ont pas été auditées. |
| Nyreen — `press-nyreen-pcgamer` | [PC Gamer, article citant la scénariste Ann Lemay](https://www.pcgamer.com/mass-effect-3-writer-female-character/). Capture presse avec Nyreen devant Aria et Shepard. | **Tête découverte**, visage ivoire à bande centrale rouge, armure bordeaux/noir à bords dorés. Le col ouvert ne doit pas être transformé en capuchon. Bas des jambes hors champ. |
| Kai Leng — `screenshot-kai-leng-wallpapers` | [Wallpapers.com, Kai Leng](https://wallpapers.com/kai-leng). Gros plan redistribué du jeu. | Visière sombre à fentes blanc bleuté, attaches sur front/joues, bouche découverte ; cheveux noirs ; armure anthracite/noire et petit symbole Cerberus doré. Les deux Phantoms sont hors sujet. Aucune validation des jambes, du sabre ou de la coiffure arrière. |
| Tela Vasir — `press-tela-vasir-gamestar` | [GameStar, galerie Mass Effect 2](https://www.gamestar.de/galerien/mass_effect_2,92066.html). Capture du DLC, cadrage buste. | Armure **bleu royal**, abdomen gris clair, bordures beige/or ; chevrons et marques faciales magenta. Les détails exacts des emblèmes et l'ensemble inférieur restent à comparer. |
| Randall Ezno — `press-randall-gameinformer` | [Game Informer, « Not Quite Spectre Material », 7 mars 2012](https://gameinformer.com/games/mass_effect_infiltrator/b/ios/archive/2012/03/07/not-quite-specter-material). Test et deux captures de jeu. | Personnage joueur humain **casqué** : casque gris/noir à panneaux clairs et lumières cyan, épaules jaune/or avec symbole Cerberus. Images de face et de dos limitées au haut du corps ; visage nu et armure complète non établis. |
| Eve — `community-eve-troodon80` | [Discussion Reddit où l'image Troodon80 est indexée](https://www.reddit.com/r/masseffect/comments/1yqccl/someones_done_a_render_of_bakara_with_her_face/). Turnaround multivue masqué inspecté. | Extérieur **bleu marine**, tracés or/ivoire, couches bordeaux brun à motifs croisés, coiffe arrondie et voile grillagé doré. Le titre du fil évoque une reconstruction sans masque : cette reconstruction n'a pas été utilisée. La chaîne vers la publication originale est incomplète. |
| Courtier yahg — `screenshot-shadow-broker-srcdn` | [Capture hébergée sur le CDN ScreenRant](https://static0.srcdn.com/wordpress/wp-content/uploads/2021/06/Mass-Effect-2-Shadow-Broker.jpg), repérée via un miroir. Article original non consulté. | Tête rouge à marques blanches, huit yeux sombres, **deux grandes pointes crâniennes**, mâchoire lourde ; vêtement noir/bleu sombre, col/poitrine clair. Provenance secondaire faible ; pieds et nombre exact de doigts non validés. |

## Identités, rôles et corrections

**Eve est un soutien narratif dans ce lot.** La [liste des personnages de Mass Effect](https://en.wikipedia.org/wiki/Characters_of_the_Mass_Effect_universe) (`overview-mass-effect-characters`) aide à vérifier les noms Eve/Urdnot Bakara et le contexte de la guérison du génophage. Elle ne justifie aucune capacité de combat, et le lot n'en attribue aucune.

**Rasa a été retirée de la proposition.** Aucune source consultée ne soutient cette identité dans *Infiltrator*. Le [résumé du jeu](https://en.wikipedia.org/wiki/Mass_Effect_Infiltrator) (`overview-infiltrator`) nomme **Inali** comme conseillère de Randall. Cette correction ne fait pas d'Inali un nouveau personnage à générer dans ce lot : le slot a été remplacé par Eve.

**Morinth reste dans sa tenue civile propre.** Son modèle lorsqu'elle se fait passer pour Samara et sa transformation ultérieure ne servent pas de référence à ce slot.

Les valeurs de dégâts, enchaînements, frames, variantes versus, répliques nouvelles et règles de jeu sont des **adaptations de prototype**, sauf citation primaire explicite supplémentaire. Ces références visuelles ne les établissent pas.

## Éléments restant sans validation visuelle suffisante

**Saren ME1** : forme organique/cybernétique visée, jamais forme squelettique finale. Aucun modèle final adapté n'a été visuellement inspecté dans cette passe ; implantation précise, côté anatomique des augmentations et silhouette complète restent à contrôler.

**Balak ME1** : le slot vise sa tenue de *Bring Down the Sky*, pas sa tenue civile de ME3. Aucun screenshot exploitable n'a pu être inspecté avec assez de certitude pour figer sa palette ou son armure. Le [guide PPE sur X57](https://www.ppe.pl/poradniki/210715/mass-effect-1--asteroida-x57-zniszcz-niebo.html) a été ouvert, mais son image pertinente n'a pas été récupérée. Le brief reste générique sur l'armure et explicitement non validé.

## Références rejetées et accès incomplets

- `eve-color-grade-reference.png` montre **Wrex**, pas Eve. Rejetée après inspection.
- `randall-keyart.jpg`, provenant du [test de Lucas C.](https://lucasc.me/post/mass-effect-infiltrator-review), montre le **prisonnier turien**, pas Randall. Rejetée après inspection.
- Plusieurs recherches d'images Balak renvoient à ME3. Elles ne valident pas sa tenue ME1.
- Les concepts Kai Leng hébergés par Creative Uncut ont été repérés, mais n'ont pas été employés pour affirmer les détails du modèle final.
- L'ancien [article EA d'Ann Lemay](https://www.ea.com/news/playas1-ann-lemay-mass-effect) et l'ancienne page EA d'Infiltrator n'étaient pas disponibles ; ils ne sont pas présentés comme des sources directement lues.
- Les légendes automatiques de recherche ont produit des confusions d'identité et de rôle. Elles ne sont jamais retenues comme preuve canonique.

## Condition de validation ultérieure

Comparer chaque sortie générée à la bonne version du modèle : silhouette, palette, visage, asymétries, coiffe, mains/pieds, emblèmes et couvre-chef. Vérifier séparément le nombre de personnages, l'intégrité tête/pieds, l'orientation et le canal alpha. Une telle comparaison est encore nécessaire avant de changer le statut **Prototype**.

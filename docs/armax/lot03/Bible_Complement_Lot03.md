# Bible de production — complément du lot 03

**Mass Effect — Armax Relay Clash** · 19 novembre 2026

## 1. Livrable et position dans la production

Le lot produit 26 nouvelles images sélectionnées. Il étend les apparences individuelles du roster, ouvre quatre études de mouvement de Shepard féminine et ajoute six lieux de combat. Les statuts restent séparés : image produite, choix retenu pour étude, correction de fidélité, préparation technique, intégration et validation en jeu. Aucun statut « Validé » n’est déduit de la présence d’un fichier.

Les costumes de la trilogie proviennent des guides EA Legendary Edition ; les six compagnons d’Andromeda proviennent des Character Kits BioWare. La variante réellement visible prime sur une association vague à un épisode. Ashley est représentée dans la tenue bleue du guide, James dans sa tenue de repos. Les visages, coutures et détails générés restent des interprétations à contrôler. [Guides EA](https://www.ea.com/games/mass-effect/community/cosplay-guides) · [Kits BioWare](https://www.bioware.com/digitalmedia/mass-effect/)

## 2. Personnages nouvellement couverts

| Personnage | Variante produite | État |
| --- | --- | --- |
| Commandant Shepard — féminine | Armure N7 du guide EA Legendary Edition, identité féminine par défaut | Pose statique, réserves QA |
| Ashley Williams | Tenue Alliance bleue à col haut du guide EA | Pose statique, réserves QA |
| Kaidan Alenko | Armure cobalt et bleu nuit à filets blancs du guide EA | Pose statique, réserves QA |
| Miranda Lawson | Combinaison blanche et noire à motif hexagonal du guide EA | Pose statique, réserves QA |
| Jacob Taylor | Tenue Cerberus sombre du guide EA | Pose statique, réserves QA |
| Samara | Armure rouge, col sombre et ornements dorés du guide EA | Pose statique, réserves QA |
| Kasumi Goto | Tenue noire et grise à capuche du guide EA | Pose statique, réserves QA |
| Zaeed Massani | Armure blanche, jaune-orangé et noire du guide EA | Pose statique, réserves QA |
| James Vega | Tenue de repos, tee-shirt gris SF-03, harnais et tatouages du guide EA | Pose statique, réserves QA |
| Javik | Armure rouge et noire du guide EA ; main corrigée en R1 | Pose statique, réserves QA |
| Cora Harper | Tenue du Character Kit BioWare, manches asymétriques | Pose statique, réserves QA |
| Liam Kosta | Tenue du Character Kit BioWare, épaule droite et pochette gauche | Pose statique, réserves QA |
| Peebee | Tenue du Character Kit BioWare, marquage facial et bracelet gauche | Pose statique, réserves QA |
| Jaal Ama Darav | Tenue du Character Kit BioWare, viseur droit et dispositif gauche | Pose statique, réserves QA |
| Vetra Nyx | Tenue du Character Kit BioWare Andromeda | Pose statique, réserves QA |
| Nakmor Drack | Armure du Character Kit BioWare Andromeda | Pose statique, réserves QA |

Chaque fichier contient une figure entière, orientée vers la droite. Les vues de dos, profils opposés, expressions dédiées, variantes de costume et cycles complets ne sont pas fournis par cette pose. Il faut produire les vues opposées en préservant les asymétries : le miroir automatique inverserait, entre autres, la bande du bras droit de Shepard, les manches de Cora et les dispositifs de Jaal.

## 3. Première famille de poses de combat

| Pose | Ce que le fichier contient | Travail restant |
| --- | --- | --- |
| Shepard féminine — Coup léger — extension du bras gauche | Le bras réellement tendu est le gauche ; le prompt demandait le droit. La sortie est retenue comme jab gauche, sans miroir du costume. | Poing proche du bord droit, hauteur des pieds et amplitudes à recaler. |
| Shepard féminine — Garde basse | R1 : le corps accroupi occupe une hauteur réduite et les semelles sont presque alignées. | La correction améliore le cadrage et la lecture de la garde basse ; elle ne certifie pas les proportions locales ni la continuité avec les autres poses. |
| Shepard féminine — Garde haute | Les deux mains montent en protection, sans masquer le visage. | Écart de semelle entre les bottes, silhouette plus large et petits détails d’armure variables. |
| Shepard féminine — Pas avant — pose de contact | Une jambe est avancée, l’autre repoussée, dans une pose de déplacement. | La phase des pieds et le transfert de poids ne constituent pas un contact de marche validé ; proportions et ligne des appuis à recaler. |

La pose neutre de Shepard féminine est la référence de cette famille. Les quatre sorties ont un visage et un costume proches, mais ne conservent pas une échelle de corps et des contacts au sol suffisamment stables pour former un clip. La garde basse R0 remplissait presque tout le cadre malgré l’accroupissement ; R1 corrige nettement sa hauteur dans le cadre et rapproche les semelles d’une même ligne : leur écart passe de 99 à 3 pixels, et la hauteur de silhouette de 1422 à 1102 pixels. Ces mesures sur alpha >127 sont des repères de silhouette, pas des collisions validées. Les proportions locales et les transitions restent à contrôler : un montage brut des quatre poses peut encore provoquer des changements apparents de taille. Le coup léger tend le bras gauche, alors que le prompt demandait le droit : il est catalogué selon le résultat observé, sans miroir.

### Passage vers des animations utilisables

1. Fixer une hauteur du personnage, un pivot et une ligne de contact dans la caméra du mode combat. Utiliser la tête, le bassin et les pieds comme repères ; la boîte alpha ne suffit pas à estimer l’échelle du corps.
2. Recaler ou régénérer les poses sur cette référence. Le genou plié doit réduire la hauteur de silhouette ; il ne doit pas agrandir le crâne ou le torse.
3. Produire séparément anticipation, extension, récupération et retour en garde, puis les intermédiaires nécessaires. Les durées et les fenêtres actives relèvent du moveset, pas du nombre d’images obtenu.
4. Contrôler la continuité du visage, des volumes, de l’emblème N7 et des bandes du bras droit à la taille d’affichage du jeu.
5. Définir hurtboxes, hitboxes, déplacements de racine et événements sonores/VFX dans le moteur ; observer une séquence complète et ses transitions.

Ces étapes sont un plan de travail. Aucun timing de combat, rectangle de collision ou test moteur n’est livré par les PNG actuels.

## 4. Arènes supplémentaires

| Arène | Période / variante | Dimensions |
| --- | --- | --- |
| Base des Récolteurs — passerelles d’infiltration | Mass Effect 2 — Première section intérieure de la mission suicide, hors salle du Proto-Moissonneur | 1774 × 887 |
| Horizon — cour de défense des canons AA | Mass Effect 2 — Cour de la bataille du Prétorien, avant toute destruction ajoutée | 1774 × 887 |
| Illium — terrasse de Nos Astra | Mass Effect 2 — Terrasse extérieure au coucher du soleil | 1774 × 887 |
| Ménaé — poste de communication turien | Mass Effect 3 — Poste extérieur avec antenne parabolique et Palaven en feu dans le ciel | 1774 × 887 |
| Thessia — temple d’Athamé | Mass Effect 3 — Intérieur, statue intacte avant révélation de la balise | 1774 × 887 |
| Virmire — côte de débarquement | Mass Effect 1 — Rivage côtier naturel, sans véhicule ni campement ajouté | 1842 × 854 |

Les arènes conservent des repères d’architecture et de palette issus de captures identifiées. Leur caméra et leur sol de combat ont été recomposés pour une lecture latérale. Les plans, distances, géométries exactes et transitions des niveaux d’origine ne sont pas reproduits ni certifiés.

**Thessia :** la sortie montre surtout le buste de la statue au-dessus d’un socle important. Le raccord, les proportions et la silhouette complète d’Athamé demandent une nouvelle comparaison au jeu. **Base des Récolteurs :** les références sont petites ; les microdétails organiques ont été reconstruits et doivent être revalidés. **Menae :** la capture est publiée dans un article sur Legendary Edition ; le build exact de la capture n’a pas été confirmé indépendamment.

### Plan de séparation des décors

| Plan | Rôle prévu | Contrainte de production |
| --- | --- | --- |
| L0 | Ciel ou volume d’ambiance lointain | Une base opaque, sans personnages ni éléments de jeu collés au premier plan. |
| L1 | Horizon, ville lointaine ou fond architectural | Extension latérale adaptée au déplacement de caméra. |
| L2 | Grandes structures et silhouette du lieu | Conserver les repères canoniques identifiables ; reconstruire les surfaces cachées. |
| L3 | Objets et architecture derrière les combattants | Séparer leurs alpha et vérifier leur ordre d’occlusion. |
| L4 | Sol et bande de combat | Une surface continue, un contact lisible, aucun trou au raccord. |
| L5 | Accents de premier plan | Occultation légère, pieds et silhouettes encore lisibles. |

**État actuel : 6 masters aplatis, 0 ensemble de parallaxe terminé.** La cible de six couches par arène représente 36 sorties à produire et assembler. Les coefficients de défilement, limites de caméra et marges de recouvrement seront réglés après un test dans la scène cible ; ils ne sont pas inventés à partir du seul master.

## 5. Contrôle de fidélité et préparation technique

Chaque fiche de `qa/` contient la taille réelle, le mode couleur, le SHA-256, les mesures d’alpha et la revue spécifique. Les corrections prioritaires concernent les proportions du visage, les petits motifs, les accessoires et l’appui des pieds. Les marges demandées n’ont pas été systématiquement respectées. La présence de transparence ne suffit pas à déclarer les contours propres sur tous les décors ; il faut les observer sur des fonds clairs, sombres et contrastés.

Pour Javik, une révision corrige le nombre de doigts après comparaison au guide. Drack R1 remet les deux attaches circulaires abdominales côte à côte et rétablit le piston extérieur de tibia. Shepard en garde basse R1 remplace la version trop agrandie. Les trois sorties précédentes ne sont pas retenues dans la sélection finale. Les archives de tentative et les fichiers sélectionnés gardent des rôles distincts. Aucune image ne doit être importée comme un sprite d’animation final simplement parce que son nom contient « ready ».

## 6. Suite de production et blocages

| Priorité | Sujet | Résultat encore attendu |
| --- | --- | --- |
| P0 | Repères de personnages | Hauteur de corps, pivot, orientation, ligne de contact et contrôle à la caméra finale. |
| P0 | Shepard féminine | Famille de poses recalée, phases complètes et premier clip observé en jeu. |
| P0 | Fidélité | Corrections concrètes des QA ; revue des visages, mains, motifs et asymétries. |
| P1 | Grunt | Pose individuelle, après résolution du blocage de génération. |
| P1 | Claymore ME3 | Prop isolé ; aucun fichier livré par la tentative de ce lot. |
| P1 | Port Hanshan | Captures larges fiables puis master de la plaza. |
| P1 | Six arènes | Couches séparées, reconstruction des zones cachées et test de raccord. |
| P2 | Drone de Legion | Référence de définition suffisante avant une nouvelle génération. |
| P2 | Présentation du combat | Portraits dédiés, intros, rivalités, endings, finishers, VFX et sons selon les fiches de la bible. |

Les trois derniers ensembles exigent des livrables propres. Une pose ou un décor ne prouve pas que le mode histoire, le tournoi, les finishers ou les règles de combat existent dans le moteur. Le présent complément documente uniquement ce qui a effectivement été produit dans ce lot.

## 7. Traçabilité

Les journaux conservent 36 appels, 29 fichiers créés, 7 refus et 26 choix finaux. Les PNG sont copiés à l’identique, sans retouche de pixels. Les références tierces restent des documents de travail et ne sont pas incluses dans le paquet. Le manifeste permet de retrouver chaque fichier sélectionné, sa tentative et ses limites.

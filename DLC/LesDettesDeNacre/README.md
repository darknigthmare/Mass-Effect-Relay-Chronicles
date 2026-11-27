# Les Dettes de Nacre

**Extension originale de Mass Effect Relay Chronicles — Armax Relay Clash.**  
État de conception et de production artistique : 27 novembre 2026.

En 2185, des passagers arrivés à la station Nacre découvrent que leurs billets de transit sont devenus des dettes. Les registres changent, les garanties déjà payées disparaissent et les combinaisons nécessaires pour partir sont saisies. Dix protagonistes remontent cette fraude jusqu'aux administrateurs qui contrôlent les quais. Leur objectif est concret : retrouver les personnes retenues, établir la preuve et ouvrir une évacuation.

Ce dossier rassemble **110 créations conçues** : dix combattants, vingt arènes, vingt ennemis ordinaires, vingt boss, vingt accessoires et vingt familles de projectiles ou d'effets. Il contient les intentions narratives, visuelles et de combat. Les images produites, les composants animés et les comportements effectivement exécutés par le jeu possèdent leur propre suivi.

Nacre est une création de fans pour ce projet. Le niveau de cohérence recherché est celui d'une extension qui pourrait s'insérer dans l'univers de la trilogie. Aucun personnage, lieu ou événement original de ce dossier n'est présenté comme officiel ou canonique.

## 1. Cadre et synopsis

L'action occupe une fenêtre indépendante de **2185, avant la fin de Mass Effect 2**. Nacre est une station de transit originale en orbite de **Tessère**, lune minière originale d'une géante gazeuse locale non nommée. Le cargo **Lest Gris** relie la station, les installations de surface et leurs dépôts. Le système reste volontairement hors d'un emplacement canon nommé des systèmes Terminus.

Le **Concordat des Quais** réunit administrateurs, entreprises de maintenance, consignataires et sûreté privée. Il fabrique des retards, transforme ces retards en frais, puis saisit les équipements indispensables au départ. Son autorité tient à la maîtrise des stocks, des signatures et des portes. Les habitants subissent ainsi un système dont chaque service prétend ne gérer qu'une petite partie.

Les dix héros découvrent des éléments complémentaires : faux manifestes, doubles garanties, modifications de serrures, détournements de cargaisons et disparition de témoignages. Leurs méthodes entrent parfois en conflit. Certains veulent forcer une issue immédiatement ; d'autres doivent protéger une preuve, éviter une décompression ou rendre les équipements avant de déplacer un groupe.

**Elyne Korda**, directrice de l'opération, ferme le dernier quai lorsque la fraude devient démontrable. Le final doit réunir les conditions d'un départ réel : une voie sûre, des équipements rendus, des témoins protégés et des commandes de quai libérées. L'épilogue dépend des personnes évacuées, de la qualité des preuves et de la restitution du matériel. Il laisse des conséquences locales sans imposer un choix à Shepard.

## 2. Une progression en quatre actes

Les vingt arènes forment un espace narratif continu. Chaque route personnelle en utilise huit, selon son enquête. Les routes sont des perspectives alternatives sur le même incident ; elles ne décrivent pas dix neutralisations successives de la même directrice.

| Acte | Arènes | Progression |
| --- | --- | --- |
| **I — Prendre pied** | 01 Quai des arrivées de Nacre · 02 Galerie de transit · 03 Annexe de quarantaine · 04 Salle des scellés · 05 Cale sèche des débiteurs | Les manifestes ne concordent pas. Les premiers scellés révèlent une saisie organisée derrière les procédures d'arrivée. |
| **II — Remonter les comptes** | 06 Galerie des consignataires · 07 Pont des amarres · 08 Jardin sec des témoins · 09 Chambre des garanties · 10 Tri des vivres | Les témoignages et quittances montrent que des garanties sont déjà payées. Le contrôle des vivres devient une pièce de l'enquête. |
| **III — Faire parler la matière** | 11 Front minier de Tessère · 12 Cimetière des coques · 13 Serres de remplacement · 14 Pont cargo du Lest Gris · 15 Canal du ballast | Les pesées, les épaves et les données du cargo prouvent le détournement physique des transports. L'enquête rejoint les équipes retenues. |
| **IV — Rompre le contrat** | 16 Atelier des combinaisons · 17 Répartiteur thermique · 18 Nœud d'écoute des convois · 19 Salle des matrices · 20 Digue d'embarquement | Les équipements sont récupérés, les installations nécessaires au départ sont rétablies et les preuves peuvent être diffusées. La dernière digue devient l'enjeu du final. |

Les choix d'épilogue ne doivent pas transformer chaque objectif facultatif manqué en mort automatique. Le duel contre un rival est non létal et ouvre une coopération après le désaccord.

## 3. Les dix héros

| ID | Personnage | Espèce et rôle de combat | Enjeu personnel |
| --- | --- | --- | --- |
| `nacre_mara_vey` | **Mara Vey** | Humaine ; escorte polyvalente | Retrouver les passagers de son convoi et rendre leur arrivée vérifiable. |
| `nacre_tavin_rhex` | **Tavin Rhex** | Turien ; contrôle à mi-distance | Rendre les procédures de sûreté aux personnes qu'elles devaient protéger. |
| `nacre_ilyra_senn` | **Ilyra Senn** | Asari ; contrôle biotique | Retrouver les familles déplacées et préserver leur choix de destination. |
| `nacre_keela_vess` | **Keela’Vess nar Tasera** | Quarienne ; ingénieure d'interception | Défaire les serrures qu'elle a involontairement rendues fiables. |
| `nacre_ghoran_brakk` | **Ghoran Brakk** | Krogan ; lutteur lourd | Sortir les équipes de la mine et récupérer les paies détournées. |
| `nacre_neral_vesh` | **Neral Vesh** | Drell ; infiltration | Reconstituer les témoignages et protéger celles et ceux qui veulent parler. |
| `nacre_selek_dhan` | **Selek Dhan** | Galarien ; pièges et sabotage | Empêcher la purge des dossiers et établir la fraude organisée. |
| `nacre_varek_hesk` | **Varek Hesk** | Batarien ; briseur de proximité | Libérer les travailleurs retenus et remonter la chaîne des ordres. |
| `nacre_dalo_ruun` | **Dalo Ruun** | Volus ; renfort de protection | Restituer les garanties et empêcher le recouvrement répété d'une même dette. |
| `nacre_nyra_korr` | **Nyra Korr** | Turienne ; éclaireuse de précision | Retrouver une équipe disparue et rendre les cartes d'évacuation aux habitants. |

Cinq rivalités mettent en jeu des méthodes : **Mara / Tavin**, **Ilyra / Nyra**, **Keela / Selek**, **Brakk / Varek**, **Neral / Dalo**. Elles ne reposent pas sur une culpabilité attribuée à une espèce.

La [bible des combattants](NACRE_ROSTER_BIBLE.md) détaille biographies, contraintes d'espèce, ressources, coups, contres, supers, neutralisations, assistances, provocations, tenues alternatives, introductions et fins. Ces descriptions constituent des objectifs de production. Une pose illustrée ne représente pas un kit animé complet.

## 4. Cohérence visuelle et continuité de l'univers

### Direction artistique

Nacre emploie des sprites 2D détaillés et des scènes latérales aux matériaux lisibles : **ivoire céramique, graphite, cuivre de signalisation et turquoise de service**. Les biotiques utilisent une famille bleu-violet ; les interfaces d'omni-outils conservent leur vocabulaire ambré. L'usure dépend de la fonction : poussière minière, frottements de quai, traces thermiques, réparations et tissus techniques.

Cette palette relie les lieux sans effacer les identités. Les protections, outils et volumes doivent expliquer le travail de chaque personnage. Le responsable de garantie volus, le manutentionnaire elcor, la grue industrielle et la directrice civile possèdent des silhouettes et des fonctions différentes.

L'anatomie reste une contrainte : crêtes asari sans oreilles humaines ajoutées, mandibules et posture turiennes, quatre yeux batariens cohérents avec l'angle, combinaison quariane fermée, équipement vital volus et masse elcor lisibles. La tenue d'un original ne reproduit pas automatiquement l'armure ou le visage d'un compagnon connu.

Chaque arène prévoit **cinq couches de parallaxe distinctes**, une ligne de sol, une caméra et un éclairage de combat. Les cent couches prévues ne sont pas cent images déjà livrées. Les obstacles mobiles, grues, portes, câbles, armes, drones et effets doivent être séparés lorsqu'ils participent à l'animation ou aux collisions. Un fond aplati ne vaut pas un décor entièrement démonté.

### Limites de continuité

Le conflit se tient dans les ressources et les rapports de force locaux des Terminus. Il n'introduit aucun nouveau relais, aucune superarme et aucune révélation cosmique nécessaire à la compréhension de la trilogie.

La conception ne fixe aucun choix de Shepard, aucune issue de Mass Effect 3, aucune résolution anticipée du génophage ou du conflit geth-quarien. Elle n'utilise pas les espèces, équipements ou événements d'Andromeda. Les VI de sûreté restent des systèmes de contrôle ; leur présence ne suffit pas à leur attribuer une conscience.

Les temps de récupération, jauges et commandes du jeu de combat sont des adaptations identifiées. Ils ne sont pas présentés comme une transcription littérale des règles de Mass Effect 2. Les sources de référence et leurs limites sont conservées dans les deux bibles et les tableaux `sources` des JSON.

## 5. Principes de combat et de mise en scène

Les ennemis ordinaires doivent se distinguer par leur comportement, leur portée, leur annonce et la réponse qu'ils demandent. Les vingt boss possèdent chacun trois phases de conception, soit **soixante phases spécifiées**. Une phase décrite ne compte pas comme un pattern intégré, une animation ou un test réussi.

Les attaques dommageables doivent rester visibles et posséder une réponse commune : garde, déplacement, saut ou punition de récupération selon le cas. Les brouillages ne retirent pas toutes les possibilités de défense. Les projectiles suivent un cycle annoncé d'activation, de collision et de fin ; ils doivent être annulés lors des transitions appropriées.

Les dangers narratifs des arènes sont neutralisés pour le compétitif. Les boss de machines ou à plusieurs composants appartiennent aux défis et à l'histoire tant qu'un équilibrage spécifique ne permet pas leur usage en versus. Les télégraphes utilisent forme, son et couleur ; le premier plan et les effets ne doivent pas masquer le plan de jeu.

Les routes, récompenses et preuves requièrent des clés stables pour éviter les duplications au rechargement. Leur validation appartient aux tests d'intégration du jeu.

## 6. État des livrables

| Famille | Créations conçues | Portée du décompte |
| --- | ---: | --- |
| Combattants | 10 | Dix identités et campagnes personnelles ; les profils de prototype restent un sous-ensemble de leurs kits. |
| Arènes | 20 | Vingt lieux, caméra, sol, lumière, dangers et cinq couches planifiées par lieu. |
| Ennemis ordinaires | 20 | Vingt comportements et réponses distincts. |
| Boss | 20 | Vingt identités et soixante phases de conception. **19 identités sur 20 sont illustrées par une base sélectionnée.** |
| Accessoires | 20 | Vingt familles, avec pièces et états à produire séparément. |
| Projectiles et VFX | 20 | Vingt familles, avec phases et cycles de vie détaillés. |
| **Total** | **110** | Créations de contenu conçues ; ce total ne mesure pas des animations ou rencontres terminées. |

**Boss03 — Halek Orr** ne dispose d'aucune image : la génération a été bloquée en sortie. La fiche, les mécaniques et le prompt sont conservés dans le suivi ; aucune image de remplacement n'est déclarée.

Les dix-neuf bases retenues sont accompagnées de deux versions de contrôle non sélectionnées, pour Terea Soth et Elyne Korda. Ces deux fichiers supplémentaires ne gonflent pas le nombre de boss. Terea utilise sa correction d'anatomie asari. Elyne utilise une identité désormais distincte de Myra Nenn : femme mûre à peau brune foncée et cheveux courts poivre et sel.

Le Cercle des verrous dispose d'une base d'assemblage central ; ses nœuds, portes et drones restent à séparer. La base d'Elyne représente son corps ; le portique et les bras du quai restent à produire. La grue requiert un contrôle supplémentaire du contour, et le nombre de segments visibles de Murène-2 doit être aligné sur sa fiche. Plusieurs bases demandent encore un nettoyage du voile lumineux périphérique ou des marges.

Il n'existe donc **ni certification de fidélité 1:1, ni validation officielle, ni kit animé complet** dans ce décompte. Les statuts `Défini` des données décrivent la spécification initiale ; les manifestes artistiques et les preuves d'exécution du moteur doivent être consultés pour connaître l'avancement réel.

## 7. Index des données

| Fichier | Usage |
| --- | --- |
| [NACRE_ROSTER_BIBLE.md](NACRE_ROSTER_BIBLE.md) | Lecture complète des dix combattants, coups et campagnes. |
| [nacre_roster_design.json](nacre_roster_design.json) | Données structurées des identités, mécaniques et huit étapes de chaque route. |
| [nacre_visual_briefs.json](nacre_visual_briefs.json) | Briefs artistiques des dix combattants. |
| [nacre_fighter_asset_requirements.json](nacre_fighter_asset_requirements.json) | Pièces, poses et scènes demandées par combattant. |
| [nacre_runtime_profiles.json](nacre_runtime_profiles.json) | Profils destinés au prototype ; à confronter aux comportements réellement raccordés. |
| [NACRE_WORLD_BIBLE.md](NACRE_WORLD_BIBLE.md) | Lecture complète des vingt arènes et des quatre familles de vingt éléments du monde. |
| [nacre-world.json](nacre-world.json) | Catalogue autoritatif des cent éléments du monde, références croisées et sources. |
| [nacre-stage-briefs.json](nacre-stage-briefs.json) | Vingt briefs de composition des arènes. |
| [nacre-opposition-briefs.json](nacre-opposition-briefs.json) | Briefs visuels des ennemis et boss. |
| [nacre-world-validation.json](nacre-world-validation.json) | Résultat des contrôles structurels des données ; aucune certification artistique ou moteur. |

Les identifiants `nacre_stage_01` à `20`, `nacre_enemy_01` à `20`, `nacre_boss_01` à `20`, `nacre_prop_01` à `20` et `nacre_fx_01` à `20` sont stables. Les campagnes référencent ces identifiants, pas l'ordre d'affichage d'une liste.

Les images sont intégrées sous `public/assets/armax/lot22/originals/`, dans les sous-dossiers de leur famille. Les versions de contrôle des boss sont rangées sous `bosses/qa/`. Les prompts, manifestes et le rapport de contrôle de production sont regroupés dans `docs/armax/lot22/` lors de l'intégration du lot. Un fichier absent doit rester signalé comme absent ; un chemin cible prévu n'est pas une preuve de production.

Les fichiers `src/armax-data.js`, `src/armax-engine.js`, `src/armax-ui.js` et leurs tests constituent la référence pour le comportement du prototype. Ils ne remplacent pas les bibles et ne prouvent que le sous-ensemble effectivement testé.

## 8. Références de continuité

Les entrées de codex sont consultées à travers des transcriptions communautaires, identifiées comme telles dans les données. Elles servent à vérifier les contraintes générales ; les noms, intrigues et silhouettes propres à Nacre restent des créations du projet.

- [Codex : systèmes Terminus](https://masseffectdb.wiki/mass-effect/codex/primary/planets-and-locations/region-terminus-systems).
- [Codex ME2 : mécas de sécurité](https://masseffectdb.wiki/mass-effect-2/codex/secondary/technology/security-mechs).
- [Codex ME2 : biotiques](https://masseffectdb.wiki/mass-effect-2/codex/primary/technology/biotics).
- [Codex : volus](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/volus), [Quariens](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/quarians) et [elcors](https://masseffectdb.wiki/mass-effect/codex/primary/aliens-non-council-races/elcor).
- [Codex : omni-outil](https://masseffectdb.wiki/mass-effect/codex/primary/technology/omni-tool) et [intelligence virtuelle](https://masseffectdb.wiki/mass-effect/codex/primary/technology/computers-virtual-intelligence-vi).
- [BioWare / EA : Gameplay Calibrations, Legendary Edition](https://www.ea.com/ea-play/news/gameplay-calibrations), source officielle distincte des transcriptions.

Une référence de continuité documente une contrainte. Elle ne transforme pas la création originale en contenu canon ni ne valide automatiquement un modèle, une image ou une mécanique.

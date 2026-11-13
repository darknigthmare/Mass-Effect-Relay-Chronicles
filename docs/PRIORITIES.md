# Priorités P0/P1 — bilan historique du lot précédent

Ce document conserve les résultats du lot P0/P1 basé sur `259d512`. Le [lot Continuation](CONTINUATION.md), depuis `5d933068`, poursuit le lot [Completion](COMPLETION.md). Son audit courant suit 6 581 critères ouverts ; les compteurs ci-dessous restent ceux du lot historique.

Le lot met en jeu les objectifs d’Eden Prime, de Mira et d’Ilos, les positions et ordres tactiques, les talents ME1, la navigation manette et les phases de Bénézia et du Thorien. Il renforce aussi l’horloge ATB, la pause au changement de focus, les sauvegardes et les comparatifs d’équipement. **51 fiches existantes** sont mises à jour ; **18 passent de Défini à Prototype** (11 P0 et sept P1). Les critères originaux restent ouverts lorsque l’adaptation ne les satisfait pas entièrement. Aucune fiche ne devient Intégré ou Validé et aucun asset n’est déclaré produit dans ce lot.

Le [rapport de publication du catalogue et de l’Excel](qa/priority-workbook-visual-report.json) lie les preuves exécutées aux sources gelées. Le principal contient désormais **962 Défini, 417 Prototype, trois Intégré et trois Validé**, sur **1 385 fiches**. L’[audit des catalogues publics courants](qa/priority-current-audit.json) et son [registre exhaustif](qa/priority-current-open-ledger.json) donnent les critères encore ouverts, leurs dépendances, leurs chemins et leurs réserves. L’ensemble des 28 catalogues contient toujours **6 711 fiches**, dont **6 588 P0/P1 non Validé** : réaliser un prototype partiel ne clôt pas son critère.

| Périmètre courant | P0 Défini | P0 Prototype | P0 Validé | P1 Défini | P1 Prototype | P1 Intégré |
|---|---:|---:|---:|---:|---:|---:|
| Principal — 1 385 fiches | 90 | 138 | 3 | 815 | 279 | 3 |
| 27 catalogues supplémentaires — 5 326 fiches | 541 | 15 | 0 | 4 431 | 276 | 0 |
| Total | **631** | **153** | **3** | **5 246** | **555** | **3** |

## Contenu livré et limites

| Famille | Comportement jouable ajouté ou renforcé | Critères encore ouverts |
|---|---|---|
| Objectifs de campagne | Quatre charges d’Eden Prime avec canalisation, trois stations de Mira et course d’Ilos ; échec/reprise, progression et récompense unique sauvegardés | Géographie, dialogues et mise en scène d’origine ; les durées globales et la course à pied sont des adaptations ATB |
| Positions et ordres | Bandes de portée, repositionnement, brouillon annulable et engagement des jauges des équipiers ; en Attente, une réservation permet aux autres acteurs d’avancer | Distances originales, ligne de visée physique et toutes les situations tactiques d’origine |
| Talents ME1 | Neuf options, rangs de prototype, budget partagé avec les formations d’armure, Atténuation, Immunité et Montée d’adrénaline | Arbres, rangs et durées complets de chaque classe/édition ; le nom historique de fiche `PWR-amortissement` est conservé |
| Commandes | Navigation et actions DOM au clavier et via API Gamepad standard, indicateurs contextuels et retour du focus | Matériel manette réel, tous les dialogues, remappage complet et sélecteurs système ; la preuve manette utilise un périphérique simulé |
| Boss | Vagues de soutien de Bénézia, six objectifs neuronaux du Thorien et renforts successifs, avec budgets de combat répartis | Verticalité, dialogues, animations, personnages et séquences originaux complets ; aucune extension de Saren dans ce lot |
| Horloge, sauvegarde et UI | Cadences contrôlées 10/20/60/144 Hz, arrêt sur blur, reprise sans rattrapage, import strict des sous-états et multiplicateur des maîtrises visible dans le comparatif | Le critère exact 30/60/120 FPS et les performances matérielles restent ouverts ; la visibilité d’onglet du navigateur sans écran reste une limite documentée |

Les descriptions des **21 formations ATB** sont dérivées des profils réels du code, avec les phases adaptées des deux boss explicites. Le journal documente désormais **12 opérations** et les préparations des Chroniques **107 équipements pris en charge**. Ces corrections n’attribuent aucune fidélité artistique ou canonique supplémentaire.

La publication repose sur les [978 tests natifs](qa/priority-integration-final-04-report.json), les [six familles de parcours navigateur](qa/priority-development-report.json), leurs [54 captures réellement ouvertes](qa/priority-visual-review.json), puis les [73 panneaux Excel réellement ouverts par six réviseurs](qa/priority-workbook-visual-review-record.json). Le [vérificateur OpenXML indépendant](qa/priority-workbook-visual-report-public-native.json) contrôle les **23 545 cellules du catalogue**, 28 feuilles, 26 tables, 274 formules, 130 règles de validation et 130 mises en forme conditionnelles. Les styles sont identiques octet pour octet ; seuls les champs autorisés, les hauteurs des lignes concernées et les caches des compteurs changent. Le contrôle des formules inclut une modification temporaire en mémoire puis une restauration, sans export ; Microsoft Excel n’a pas été lancé.

Les six fiches Intégré/Validé historiques, les **46 PNG historiques**, les **31 autres XLSX**, les **27 catalogues supplémentaires** et le manifeste d’assets sont préservés. Les images de contrôle Excel sont des preuves de lecture du classeur, pas de nouveaux assets du jeu. Les essais antérieurs interrompus ou rejetés restent conservés avec leurs sources et leur qualification historique.

## Point de départ conservé

L’audit reprend `main` à **`259d51267a64404048c1e18a1e549f5a356b63c6`**, après Horizon. Il lit les **28 catalogues de production**, soit **6 711 fiches**, sans les modifier ni déclarer leurs critères satisfaits. Les classeurs indépendants d’études Simulation ont un autre schéma et ne sont pas additionnés à ce registre.

Le [rapport exhaustif](qa/priority-baseline-audit.json) donne les totaux par œuvre, priorité, statut et chantier. Le [registre des 6 588 critères ouverts](qa/priority-baseline-open-ledger.json) conserve pour chaque identifiant le texte d’acceptation, les dépendances, les conditions, les réserves et les preuves déclarées. La présence d’un chemin ou du nom d’un test n’est pas une nouvelle exécution de ce test.

| Périmètre initial | P0 Défini | P0 Prototype | P0 Validé | P1 Défini | P1 Prototype | P1 Intégré |
|---|---:|---:|---:|---:|---:|---:|
| Principal — 1 385 fiches | 101 | 127 | 3 | 822 | 272 | 3 |
| 27 catalogues supplémentaires — 5 326 fiches | 541 | 15 | 0 | 4 431 | 276 | 0 |
| Total | **642** | **142** | **3** | **5 253** | **548** | **3** |

Il reste donc **784 P0 et 5 804 P1 non Validé**, soit **6 588 fiches**. Ce total inclut **6 585 Défini ou Prototype** et **trois Intégré encore à valider**. Les **120 P2** et les trois P0 déjà Validé sont séparés. Les priorités des catalogues d’autres œuvres comprennent aussi des vérifications de sources et de continuité ; elles ne demandent pas toutes une mission jouable.

## Chantiers et critères

| Chantier du registre | Critères ouverts au départ | Travail restant à distinguer |
|---|---:|---|
| Fondations, systèmes et QA | 666 | Commandes complètes, refus explicites, sauvegardes, journal, formats, preuve d’exécution de chaque critère |
| Campagnes, choix et continuité | 732 | Objectifs interactifs, prérequis, conséquences, transitions, échecs et reprises ; contexte propre à chaque œuvre |
| Combat, personnages, ennemis et pouvoirs | 1 095 | Portée, actions, coûts, télégraphes, contre-mesures et phases, avec traduction ATB explicitement adaptée |
| Exploration et lieux | 1 192 | Géographie, accès, volumes, chemins, liaisons, échelle, intérieurs et cadrages |
| Conversations et quêtes annexes | 983 | Interlocuteurs présents au bon moment, branches, objectifs et récompenses uniques |
| Équipement | 383 | Éligibilité, acquisitions, effets réels et apparences propres aux objets |
| Images, animations, cinématiques, VFX et audio | 1 301 | Familles visuelles complètes et sources identifiées ; une image fixe ne termine pas une animation ou une scène |
| Canon et contexte | 236 | Faits établis, adaptations et éléments incertains séparés, sans révélation anticipée |

Les **101 P0 encore Défini dans le principal** comprennent 42 étapes de campagne, 52 cas QA et sept systèmes. Des fonctions correspondantes peuvent déjà exister partiellement. Par exemple, l’écran de crédits est jouable alors que sa fiche reste Défini ; les imports et morts narratives ont des tests, mais leurs lignes QA demandent leurs propres preuves courantes.

Les lacunes de fonctionnement identifiées au départ comprennent la manette, les bandes de portée et ordres coordonnés, les objectifs temporisés d’Eden Prime et d’Ilos, les réparations de Mira, les talents et les phases distinctes des boss. Les relations et ramifications complètes de campagne restent également ouvertes. La réalisation doit préserver la mort narrative de Jenkins et de Virmire, les récompenses uniques, les neuf emplacements et l’isolation des Chroniques.

## Méthode de livraison

Le [snapshot initial](qa/priority-workbook-baseline.json) identifie le catalogue et le classeur principal, les **46 PNG historiques**, les **31 autres XLSX**, les **27 catalogues supplémentaires**, leurs empreintes et les six statuts avancés. Les preuves historiques Horizon et antérieures restent inchangées.

Le suivi de ce chantier utilise une modification OpenXML ciblée du classeur principal. Les identifiants, priorités, sources, dépendances et critères d’acceptation existants restent conservés. Les descriptions des 21 formations ATB doivent refléter les véritables compositions, et les compteurs documentaires périmés doivent être corrigés. Une éventuelle promotion concerne seulement une livraison démontrée ; elle ne valide pas la fidélité artistique ni l’intégralité d’un épisode.

Le catalogue et l’Excel publics ne sont copiés qu’après des preuves natives et navigateur liées aux sources gelées, une revue réelle des captures, une vérification indépendante du candidat, un contrôle des compteurs et l’ouverture des panneaux Excel concernés. L’audit exhaustif sert à retrouver ce qui reste à faire ; il ne ferme aucun critère à lui seul.

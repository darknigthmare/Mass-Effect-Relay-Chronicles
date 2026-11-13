# Compléter les critères P0/P1/P2

Les copies locales du lot mettent à jour **99 fiches et 251 cellules**. **89 critères fonctionnels exacts** passent à Validé : **78 P0, six P1 et cinq P2**. Sept autres fiches avancent seulement vers Prototype ; les notes de trois autres fiches sont actualisées sans fermer leur critère. Le [rapport de copie locale](qa/completion-tracking-workbook-report.json) distingue ces 96 avancements des 89 fermetures. Son `productionPending:true` décrit le moment de cette copie ; les [sept familles de production ont depuis passé leurs contrôles](qa/completion-tracking-production-report.json), avec [95 nouvelles captures réellement ouvertes](qa/completion-tracking-production-visual-review.json). Le bilan global de livraison reste distinct de ces rapports d’étape.

Le principal contient maintenant **918 Défini, 375 Prototype, zéro Intégré et 92 Validé**, sur **1 385 fiches**. Les 28 catalogues gardent **6 711 fiches et 454 sources**, avec **5 953 Défini, 666 Prototype, zéro Intégré et 92 Validé**. L’[audit courant effectué après la copie](qa/completion-tracking-current-audit.json) et son [registre exact](qa/completion-tracking-current-open-ledger.json) recensent **6 619 critères encore ouverts** : **706 P0, 5 798 P1 et 115 P2**. Aucune fidélité artistique ou canonique 1:1 n’est déduite de ces validations fonctionnelles.

Les preuves locales relient le [gel natif06 de 1 060 tests](qa/completion-integration-final-06-report.json), les [sept parcours DEV courants](qa/completion-tracking-development-report.json), leurs [95 captures réellement ouvertes](qa/completion-tracking-development-visual-review.json), puis les [120 panneaux Excel réellement ouverts par sept réviseurs](qa/completion-tracking-workbook-visual-review.json). Les sept parcours de production ont ensuite vérifié les mêmes fonctions sur les fichiers compilés : **91 fichiers de distribution et 251 empreintes courantes** sont liés à leurs preuves, avec **95 captures de production distinctes**. Le [vérificateur indépendant des copies](qa/completion-tracking-workbook-report-public-native.json) contrôle 23 545 cellules, 28 feuilles, 26 tableaux, 274 formules et 130 règles de validation ainsi que 130 règles de mise en forme conditionnelle. Les styles sont identiques octet pour octet ; aucune ligne ni formule n’est ajoutée. Les 46 PNG, les 31 autres XLSX, les 27 catalogues supplémentaires, le manifeste et le ZIP restent inchangés.

Le lot part du `main` **`0d76912517a91c5d2ad00f1ef5718188b40abd8e`**. Il vise des critères réellement terminés et des fonctions manquantes ajoutées au jeu. Les conditions d’acceptation existantes ne sont pas réécrites pour faciliter une fermeture. Une fonction adaptée peut satisfaire son critère fonctionnel tout en conservant ses réserves de fidélité artistique ou canonique.

Le [snapshot de référence renforcé](qa/completion-tracking-baseline-02.json) conserve les empreintes des 28 catalogues, des classeurs, des 46 PNG, du manifeste d’assets, des sources et de **3 499 fichiers historiques** : rapports, captures, aperçus et ZIP des 27 classeurs. Les [première](qa/completion-tracking-baseline.json) et [deuxième captures](qa/completion-tracking-baseline-final.json), qui protégeaient 2 103 preuves, restent conservées avec leurs outils exacts archivés. Toutes utilisent les mêmes octets Git pour les catalogues et les classeurs. Aucun résultat antérieur n’est présenté comme une nouvelle exécution.

L’[audit exhaustif](qa/completion-tracking-audit.json) et le [registre des critères exacts](qa/completion-tracking-open-ledger.json) couvrent **6 708 fiches non Validé** : **784 P0, 5 804 P1 et 120 P2**. Les 28 catalogues comprennent **6 711 fiches et 454 sources** ; les trois Validé historiques sont conservées. Le principal part de **962 Défini, 417 Prototype, trois Intégré et trois Validé**, sur 1 385 fiches. Les trois Intégré peuvent être proposées explicitement après une nouvelle vérification ; aucune promotion ne découle du simple inventaire.

## Fermetures à examiner

Le [plan des candidats](qa/completion-tracking-candidates.json) cite **126 identifiants distincts**, avec le texte exact de leur critère, leurs dépendances, les fichiers existants à inspecter et les conditions de preuve. Ce sont des candidats, pas des fermetures annoncées.

| Ordre | Famille | Critères et conditions concrètes |
|---|---|---|
| 1 | Sauvegardes, inventaire et commerce | Versions/migrations explicites, refus atomiques, quantités et crédits exacts, reprise et export. Refaire les parcours de refus et reprise, puis comparer tous les champs concernés. |
| 1 | Combat, talents et ordres | `SYS-talents` : dépendances et points ; `SYS-portee` : refus visible avant validation ; `SYS-ordres-coordonnes` : participants disponibles et actions consommées. Couvrir aussi cibles devenues invalides, KO, coûts, chaleur, stase et victoire unique. |
| 1 | Narration, équipe et journal | Refuser les morts/non-recrutés, éviter doublons et récompenses répétées, adapter les réactions à l’ordre des planètes et au recrutement tardif. Chaque branche contrôlée doit survivre à une reprise. |
| 1 | Personnalisation | Pureté du brouillon, transaction des neuf ports, annulation, migration, restrictions et précision des valeurs. Les dépendances atelier/inventaire/sauvegarde et les critères visuels de chaque fiche sont traités explicitement. |
| 2 | Commandes et lisibilité | Focus, sortie des dialogues, touches actives, dimensions d’écran, absence d’audio et réduction des flashs. La méthode Gamepad simulée reste déclarée ; elle n’atteste pas un essai matériel. |
| 2 | Monde et reprise sûre | Concordance géométrie/bonus de couverture, occlusion, sol, seuils, caméra et repli hors déclencheur de combat. Une capture d’ambiance seule ne satisfait pas ces critères. |
| 2 | Chroniques et P2 | Clips, soutien, modules, lectures et nouveaux pouvoirs dans leur contexte exact, séparés de ME1. Les fiches P2 d’une règle ne ferment pas une campagne, un personnage ou l’ensemble d’un vaisseau. |
| 2 | Catalogue et contrôles documentaires | Compteurs et identités exhaustifs, statut lié à une preuve réelle, recalcul après édition et distinction contenu jouable/plan. Un écran de catalogue ou de crédits doit exister réellement pour fermer sa fiche. |

Les **63 P2 des catalogues supplémentaires** sont des tâches annexes de comics : leurs critères demandent terminaison, ignorance ou abandon sans bloquer le récit, avec sauvegarde correcte. Une lecture documentaire existante ne réalise pas ces tâches et ne suffit pas à les fermer. Les **57 P2 du principal** restent examinées individuellement ; les costumes, gestes, campagnes et révélations ne sont pas réputés réalisés par analogie avec un exercice ATB.

Les trois choix déjà Intégré sont examinés sur leurs critères inchangés : `CHC-recrutement-de-garrus` exige l’absence de doublon PNJ/équipier ; `CHC-recrutement-de-wrex`, des conversations et une présence en soute adaptées ; `CHC-attitude-de-garrus`, la référence au bon choix dans la conversation suivante. Leurs références et réserves canoniques restent intactes.

Sept fiches POW des catalogues ME2/ME3 ont un progrès logiciel documenté dans les Chroniques, avec des clauses artistiques, d’animation et d’audio encore ouvertes. Elles ne sont pas promues dans ces catalogues et leurs classeurs dans ce lot ; leurs critères complets restent suivis. Les deux exports ont un schéma de 19 colonnes et des empreintes liées au manifeste et au ZIP. Les cinq P2 fonctionnelles du principal sont évaluées séparément, sans annoncer une fidélité complète de ces grandes fiches.

## Contrat des propositions

Chaque famille remet ses propositions dans `docs/qa/completion-*-tracking.json`. Une fiche cite son identifiant existant, les champs proposés, les chemins d’implémentation et les preuves fraîches. La revue d’acceptation reproduit le critère exact, distingue ses clauses couvertes et ses limites, précise le type de contrôle (fonctionnel, documentaire ou artistique) et indique si le critère est entièrement satisfait.

`Prototype` décrit encore une réalisation partielle. `Intégré` décrit une fonction raccordée, dont les chemins et dépendances ont été contrôlés, avec les clauses restant ouvertes explicites. `Validé` exige la couverture complète du critère original dans son périmètre et ses conditions, les vérifications exécutées et la revue correspondante. Aucune dépendance, aucun asset et aucun autre contexte n’est promu automatiquement. Une référence présente sur disque ou un test nommé ne vaut pas une preuve d’exécution actuelle.

La revue `complete` atteste les clauses exactes démontrées par les natifs frais, le parcours DEV courant et ses captures réellement ouvertes. Elle ne prétend pas que les vérifications de livraison sont déjà terminées. Une fiche réellement couverte peut ainsi entrer dans le candidat et les **copies locales** pendant que `productionPending` reste vrai. Le **commit et le push restent bloqués par les sept familles de production**, après synchronisation du registre et compilation : commandes, persistance, combat, narration, Chroniques, monde/focus et le complément distinct modules/lectures. Si une vérification de production échoue, le changement est corrigé et revérifié ou les copies sont restaurées avant toute livraison. Aucun critère encore incomplet n’est fermé pour débloquer cette séquence.

Le pipeline conserve identifiants, priorités, acceptations, sources, références, épisodes, périmètres, niveaux de canon, dépendances et chemins prévus. Les statuts d’assets restent inchangés. Les fiches déjà Validé restent intactes ; toute évolution des trois Intégré est explicitement incluse dans le plan revu. Les notes de fidélité restent conservées et complétées sans déclaration artistique implicite.

Les **préfixes des notes héritées sont des états historiques conservés**, pas une seconde évaluation courante. Une ancienne phrase telle que « critères restant à vérifier », « aucune validation finale déclarée » ou « résultat non exécuté tant qu’aucune preuve n’est ajoutée » précède la mise à jour du lot Completion. Le statut actuel et cet ajout, liés aux preuves citées, portent la nouvelle évaluation fonctionnelle. Les réviseurs ont consigné cette chronologie comme réserve éditoriale visible ; aucun texte ancien ni PNG n’a été masqué. Les réserves artistiques et de matériel réel restent applicables dans leur périmètre. Les mentions de production encore attendue dans les propositions et le rapport de copie sont aussi des photographies de ces étapes : les preuves de production ultérieures sont conservées séparément, sans réécriture de ces archives.

La [carte des propositions](qa/completion-tracking-proposal-map-02.json) est une photographie de leur préparation, avec critères, preuves manquantes et dépendances. Elle distingue 92 fiches principales proposées et sept progrès documentés hors promotion. Ses éventuels totaux de cibles ne sont pas des fermetures effectives. La première photographie reste conservée ; les versions ultérieures ne l’écrasent pas. Le [relevé des sept POW](qa/completion-tracking-universe-progress-01.json) conserve les critères complets, les clauses encore ouvertes et la proposition logicielle archivée.

## Préparer et publier

Les scripts du lot portent le préfixe `completion-tracking`. Le snapshot demande un SHA complet ; il lit les octets exacts de ce commit, même si d’autres agents modifient déjà les sources de travail. Le registre d’audit ne modifie ni catalogue ni Excel.

```bash
node scripts/completion-tracking-baseline.mjs --base SHA_COMPLET --output docs/qa/completion-tracking-baseline-N.json --snapshot-dir /tmp/completion-tracking-baseline-N
node scripts/completion-tracking-audit.mjs --baseline docs/qa/completion-tracking-baseline-N.json --output-prefix docs/qa/completion-tracking-N
```

La suite compose un périmètre explicite, vérifie les nouvelles preuves contre les sources gelées, construit des copies candidates puis contrôle leur préservation indépendamment. Elle ne réemploie pas les plans Horizon ou P0/P1 comme générateurs courants. Les compteurs sont recalculés dans un import distinct, la sonde temporaire est restaurée sans export et chaque panneau Excel concerné est réellement ouvert. Seules les copies candidates approuvées remplacent les fichiers publics après tous les contrôles. Les preuves historiques, les autres classeurs et les images ne sont pas écrasés.

Les [dix autocontrôles privés](qa/completion-tracking-selfcheck-03.json) comprennent deux cas acceptés (texte/métadonnées et statut avec caches) et huit refus : style, formule, critère, validation incomplète, statut d’asset, fiche déjà Validé, dépendance non validée et valeur différente du plan explicite. Le [rendu privé de précontrôle](qa/completion-tracking-render-selfcheck-01.json) est explicitement exclu des gates produit. Le [contrôle exhaustif après reconstruction du registre](qa/completion-tracking-catalogue-native-02.json) vérifie les 6 711 IDs et chaque statut, catégorie, œuvre et digest. Le [contrôle initial du véritable XLSX](qa/completion-tracking-workbook-native-01.json), avec [deux rendus réellement ouverts](qa/completion-tracking-workbook-native-01-visual-review.json), et la sonde restaurée du candidat final restent distincts de ces fixtures. Aucun de ces contrôles ne lance Microsoft Excel ni n’atteste la fidélité artistique.

### Commandes de la chaîne ciblée

Chaque sortie doit être nouvelle. Les plans de ce lot conservent les identités existantes ; la publication cible uniquement le JSON et le XLSX principaux. Une liste JSON explicite sélectionne les IDs principaux et exclut les sept POW documentaires. Une autre liste JSON décrit les sources `src/` réellement concernées ; `src/universe-data.js` est reconstruit et contrôlé après la publication.

| Étape | Script et paramètres essentiels |
|---|---|
| Carte de préparation | `completion-tracking-review-proposals.mjs --proposal FICHIER` (répété), `--output RAPPORT` ; inventaire sans promotion |
| Plan explicite | `completion-tracking-plan.mjs --proposal FICHIER` (répété), `--baseline ...baseline-02.json --select-file IDS.json --feature-paths-file SOURCES.json --archive-dir DOSSIER --output PLAN.json` ; les trois CHC nécessitent aussi `--allow-advanced-ids` avec leurs IDs séparés par des virgules |
| Composer les preuves | `completion-tracking-compose-gates.mjs --scope PLAN.json --native-report RAPPORT --stage development --report FAMILLE=RAPPORT` et `--review REVUE` (répétés), `--execution-output RAPPORT --visual-output REVUE` |
| Auteur candidat | `completion-tracking-candidate.mjs --scope PLAN.json --output-dir DOSSIER_PRIVE --report RAPPORT --integration-report NATIF --development-report DEV --visual-review REVUE` |
| Vérification indépendante | `completion-tracking-verify-workbook.py --baseline ...baseline-02.json --before XLSX_INITIAL --after XLSX_CANDIDAT --catalog-before JSON_INITIAL --catalog-after JSON_CANDIDAT --changes RAPPORT --scope PLAN.json --output NATIF` |
| Import et rendu | `completion-tracking-render-workbook.mjs --input XLSX_CANDIDAT --update-report RAPPORT --output-dir DOSSIER --report RENDU` |
| Composer les ouvertures réelles | `completion-tracking-compose-workbook-review.mjs --render-report RENDU --review REVUE` (répété), `--output REVUE_GLOBALE` ; ne crée aucune attestation d’ouverture |
| Publier les deux copies | `completion-tracking-publish.mjs --update-report RAPPORT --native-report NATIF --render-report RENDU --visual-review REVUE_GLOBALE --scope PLAN.json --output PUBLICATION --publish` ; nouvelle vérification des copies publiques et restauration des deux originaux en cas d’échec |

Après synchronisation du registre, compilation et parcours de production, la composition des preuves peut être rejouée avec `--stage production` et de nouveaux rapports. Elle contrôle aussi les empreintes des fichiers compilés et l’absence de requêtes vers les sources de développement. Ces preuves restent séparées de la composition DEV.

```bash
node scripts/completion-tracking-audit.mjs --input-mode current --output-prefix docs/qa/completion-tracking-current
node scripts/completion-tracking-catalogue-qa.mjs --output docs/qa/completion-tracking-catalogue-native-02.json
```

L’audit courant mesure alors les critères encore ouverts après publication ; le premier registre exhaustif reste une photographie de départ.

État de cette note : **copies locales vérifiées, registre synchronisé et sept familles de production validées**. Les totaux ci-dessus sont issus des fichiers réellement copiés et revérifiés. Les comptes des photographies de préparation ne remplacent pas ce bilan ; cette note n’atteste ni déploiement externe ni push Git.

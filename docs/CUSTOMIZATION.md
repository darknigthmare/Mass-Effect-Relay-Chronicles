# Personnalisation de Shepard — 0.3.0

L’atelier réunit l’apparence de Shepard, l’armure et les armes dans trois onglets. Il prépare une configuration complète dans un brouillon. **Appliquer** valide l’ensemble ; **Annuler** abandonne les retouches. La campagne, le dossier narratif et les possessions restent conservés.

## Choix suivis

| Écran | Options | Effet |
|---|---|---|
| Personnage | Apparence masculine ou féminine, 4 préréglages, 6 teints, 5 couleurs d’yeux, 6 couleurs de cheveux et 4 coiffures | Aperçu 2D et paramètres persistants. Les préréglages ne modifient pas l’origine ou le profil psychologique. |
| Armure | Armure complète possédée, deux modules d’armure, 3 canaux de couleur parmi 10 teintes, 4 motifs, 3 finitions, 3 réglages de casque | L’objet et ses modules conservent leurs effets de combat. Les autres options sont cosmétiques. |
| Armes | Arme possédée, deux modules d’arme, amélioration de munitions, OmniTech et amplificateur compatibles | Même inventaire, mêmes règles de disponibilité et mêmes effets que l’écran Équipement. |

Les préréglages visuels sont Alliance, Vétéran, Colon et Stellaire. Ces noms identifient des dessins de l’atelier ; choisir « Colon » ou « Stellaire » ne réécrit pas les antécédents de Shepard.

Les armures restent des ensembles complets ME1. Un casque visible est une préférence d’affichage, pas un nouvel objet donnant des statistiques. Les neuf emplacements sont l’arme, l’armure, deux modules d’arme, une modification de munitions, deux modules d’armure, l’OmniTech et l’amplificateur biotique. Les outils restent soumis aux capacités du personnage et n’ajoutent aucun pouvoir.

## Préparation et validation

Les changements du brouillon n’achètent aucun objet et ne réservent aucun exemplaire. La comparaison utilise les calculs d’acteur et d’équipement existants. L’application vérifie l’intégralité de la configuration contre l’inventaire courant, y compris les objets déjà utilisés par les autres équipiers. Une incompatibilité empêche toute application partielle. Retirer ou remplacer une arme ou une armure remet ses modules dans le stock ; les réattacher demande une sélection explicite. Les formations existantes sont conservées. Une autorisation historique `legacyArmor` ne vaut que pour la pièce restée portée : son retrait ou remplacement l’annule et impose ensuite la formation requise. Une sélection réellement identique ne retire pas cette autorisation.

La configuration enregistrée contient les choix cosmétiques dans `state.customization`. L’apparence générale reste dans `state.appearance` et les objets dans `state.inventory.equipped.shepard`. Les sauvegardes antérieures sans champ de personnalisation reçoivent les valeurs par défaut. Une structure présente mais invalide est refusée. Le modèle vérifie les valeurs permises et refuse les accesseurs, cycles et clés interdites sans exécuter de getter.

## Comparer la dotation et consulter une pièce

L’atelier distingue deux niveaux de comparaison :

| Zone | Comparaison | Ce qu’elle permet de décider |
|---|---|---|
| Profil de combat | **Dotation actuelle → Configuration préparée** | Évaluer l’ensemble des changements du brouillon avant de les appliquer. |
| Fiche de la pièce consultée | **Brouillon actuel → Avec cet objet** | Voir les statistiques qui changeraient en préparant cette pièce, en conservant les autres choix du brouillon. |

Les deux niveaux utilisent les valeurs calculées par `actorFor`. Le profil de combat affiche désormais les multiplicateurs de puissance technologique et biotique, auparavant absents, avec deux décimales, par exemple **×1,00 → ×1,15**. Ces multiplicateurs renforcent uniquement les pouvoirs déjà disponibles au personnage.

Consulter une pièce construit une configuration candidate temporaire avec les mêmes règles que **Préparer**. Cette consultation ne modifie ni la partie, ni le brouillon, ni les quantités d’inventaire. Le bouton **+** prépare explicitement l’objet dans le brouillon ; **Appliquer** reste nécessaire pour modifier la dotation de la partie. Une pièce non possédée, sans exemplaire disponible ou incompatible affiche le motif réel du refus, sans statistiques de gain projetées. La fiche suit l’emplacement actif parmi les neuf emplacements ; un emplacement sans objet indique **Emplacement vide**.

Lorsqu’une arme ou une armure remplace une pièce porteuse, la fiche indique les modules qui seraient remis dans le stock. Leur retrait est inclus dans les statistiques de la configuration candidate. Cette liste décrit l’effet de l’application future ; la simple consultation ne rend, ne réserve et ne consomme aucun exemplaire.

## Portée visuelle

Le mannequin et le portrait de l’atelier sont des aperçus 2D originaux. Les couleurs et préférences prises en charge par le rendu sont transmises au sprite de Shepard. Le terrain garde les silhouettes et les coupes de cheveux des atlas existants. Les préréglages de visage, formes de coiffure et yeux détaillés se lisent sur l’aperçu de l’atelier ; ils ne déforment pas un modèle facial 3D.

Les silhouettes exactes de chaque modèle d’armure et d’arme, leurs accessoires dans toutes les directions, les coiffures animées et les transitions propres au matériel restent à produire. Aucun niveau de fidélité artistique 1:1 n’est déclaré par cette livraison.

## Consulter les poses et poursuivre au clavier

L’aperçu propose **Terrain / Visée / Pouvoir / Impact / Hors combat** pour les deux apparences de Shepard. Terrain conserve quatre directions ; les quatre poses de combat sont des dessins en trois-quarts fixe. Les boutons de direction sont alors désactivés et la direction de terrain choisie est restaurée au retour. Le fusil illustré dans Visée est générique, indépendant de la dotation.

La pose d’aperçu appartient à l’interface, sans modifier le brouillon, les statistiques, les PV, les pouvoirs ou la sauvegarde. Le comparatif visuel actuel/préparé utilise la même pose. Le cadrage respecte les pivots et hauteurs du renderer : le corps couché conserve son échelle et son ancrage, au lieu d’être agrandi à la hauteur du personnage debout. Les régions de tête et leur axe local guident la teinte de peau, les cheveux et le casque ; les pixels source et leur alpha restent conservés.

Après **Préparer**, si le bouton devient indisponible parce que la pièce est déjà préparée, le focus revient au bouton **Inspecter** de cette même pièce. Après **Retirer**, il rejoint le port vidé ; après **Réinitialiser le brouillon**, il rejoint le bouton de comparaison voisin qui reste actif. Le contrôle de repli est remis dans la partie visible du panneau. Le filtre d’armes conserve aussi son focus après un changement. **Tab / Maj+Tab** restent dans l’atelier et **Échap** conserve son rôle d’annulation.

Le [rapport du lot de poses](qa/shepard-combat-poses-report.json) rassemble les tests, les captures réelles de l’atelier, la scène isolée du renderer et les contrôles du build. La [provenance artistique](research/shepard-male-combat-art.md) distingue les quatre nouvelles poses masculines des poses féminines existantes. Le catalogue et l’Excel précisent six fiches existantes, soit vingt cellules, sans changer leurs statuts Prototype ni le nombre de lignes.

## Suivi dans le classeur

Le catalogue principal et son classeur reçoivent **50 fiches de personnalisation** : 20 systèmes et éléments d’interface, 6 d’armure et équipement, 4 d’armes, 5 de sprites, 3 d’animations et 12 scénarios QA. La fusion finale conserve les **1 332 fiches du main `7ef342a` et les 50 fiches de personnalisation**, soit **1 382 fiches principales** et **6 708 références** avec les 5 326 fiches supplémentaires. Les 44 sources principales sont conservées, avec les annotations récentes de main pour les sources partagées. Les 57 fiches de la feuille Trilogie et les six statuts avancés historiques restent inchangés.

Les nouveaux éléments disponibles restent classés **Prototype**. Les variantes artistiques exactes, leurs transitions et leur revue finale restent **Défini / À produire**. Un scénario QA décrit ce qu’il faut contrôler ; les résultats d’exécution sont consignés séparément et ne certifient pas la fidélité des assets.

Voir les [références officielles et différences entre opus](research/customization-sources.md), le [catalogue JSON](content-catalog.json) et le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx).

## Fichiers et vérification

| Fichier | Rôle |
|---|---|
| `src/customization.js` | Choix bornés, brouillon, validation et application atomique |
| `src/customization-ui.js` et `src/customization-ui.css` | Écran, options et prévisualisation |
| `src/state.js` | Migration et validation à l’import des sauvegardes |
| `src/world.js` et `src/customization-render.js` | Application des options prises en charge par le rendu des sprites |
| `tests/customization.test.js` | Invariants du brouillon, de la dotation et des sauvegardes |
| `tests/customization-comparison.test.js` | Comparaisons, multiplicateurs, consultation sans mutation, refus et restitution des modules |
| `scripts/customization-browser.mjs` | Parcours de l’atelier dans le navigateur |
| `scripts/customization-comparison-browser.mjs` | Parcours de comparaison et de consultation, ordinateur/mobile et texte agrandi |
| `scripts/build-workbook.mjs` | Génération courante du principal fusionné à 1 382 fiches |
| `scripts/verify-customization-workbook.py` | Comparaison de la fusion avec les deux bases Git et contrôle natif du classeur |
| `scripts/update-customization-comparison-workbook.mjs` | Mise à jour ciblée des cinq fiches de comparaison et de consultation avec artifact-tool |
| `scripts/verify-customization-comparison-workbook.py` | Contrôle des quatorze cellules modifiées et de la préservation native du reste du classeur |
| `scripts/update-customization-catalog.mjs` | Outil historique du premier lot, avec sa base et ses garde-fous initiaux |
| `scripts/update-customization-workbook.mjs` | Outil historique d’ajout ciblé sur le classeur de la première livraison |

### Livraison comparaison et consultation — 29 octobre 2026

Les **neuf nouveaux tests Node** couvrent la comparaison, la consultation et les invariants associés : **0/9 passent avec l’ancienne interface, 9/9 avec la correction**. Les **100 tests ciblés** de personnalisation, équipement, dotation, migration, sauvegarde et état passent, ainsi que la **suite complète de 674 tests**. Le build avec **Vite 7.3.7 et Three.js 0.180.0** réussit. Le [rapport de cette livraison](qa/customization-comparison-report.json) rassemble les commandes, résultats et limites ; les **huit parcours navigateur** passent sur ordinateur (1440 × 1000) et mobile (390 × 844), en texte normal et agrandi, et les **six contrôles de production** passent sans exposer le harness QA. Les 15 captures proviennent des interfaces réellement exécutées.

Le test Node de régression se lance avec :

```bash
node --test tests/customization-comparison.test.js
```

Le parcours navigateur dispose de sa commande dédiée, après démarrage du serveur de développement avec `RELAY_QA=1` :

```bash
CUSTOMIZATION_BASE_MAIN=3670047499b90aa94e701bd00991bf5b2d15badc RELAY_BUILD_KIND=vite-development npm run test:customization:comparison
```

`CUSTOMIZATION_BASE_MAIN` doit toujours identifier le vrai commit de référence du contrôle. Le script accepte aussi `GAME_URL`, `PLAYWRIGHT_EXECUTABLE_PATH` et `CUSTOMIZATION_REPORT_PREFIX` ; voir le [guide des vérifications](GAMEDEV_GUIDANCE.md#5-vérifications-adaptées-au-changement). La commande navigateur et le test Node apportent des preuves différentes.

Le suivi conserve **1 382 fiches** et les statuts existants : seules cinq fiches de comparaison/consultation sont précisées, soit quatorze cellules du catalogue et du classeur. Aucun nouvel asset ni progrès de fidélité artistique n’est déclaré.

### Résultats des livraisons précédentes

La synchronisation avec main `7ef342a` a passé **556 tests Node**, la compilation de **56 modules** et **neuf contrôles de personnalisation**, dont le build compilé. Les **17 contrôles HTTP de production** passaient, avec quinze PNG et sept bundles servis vérifiés par empreinte. Le [rapport de cette synchronisation](qa/customization-arsenal-sync-report.json) distingue les vérifications de cette branche des preuves antérieures. Les rapports de [personnalisation](qa/customization-arsenal-sync-customization-report.json) et de [production HTTP](qa/customization-arsenal-sync-production-report.json) identifient les sources et ressources du build combiné. Le [rapport précédent](qa/pr1-final-report.json) conserve ses 415 tests Node, neuf contrôles de personnalisation et dix contrôles HTTP sur le socle `748b965` ; il reste historique.

Le [contrôle du classeur lors de cette synchronisation](qa/customization-arsenal-sync-workbook-report.json) compare les 1 332 fiches de main, les 50 fiches de la PR et les 23 494 cellules de catalogue ; il vérifie aussi les 28 feuilles, 26 tableaux filtrés, validations, formules et volets gelés. La génération courante utilise `scripts/build-workbook.mjs`, puis le mode de fusion de `scripts/verify-customization-workbook.py`. Les outils `update-customization-catalog.mjs` et `update-customization-workbook.mjs` restent ceux du lot initial, dont les hypothèses anciennes ne décrivent pas la base fusionnée.

Les rapports initiaux [customization-verification.json](workbook-previews/customization-verification.json), [customization-native-check.json](workbook-previews/customization-native-check.json) et [v0.3.0-report.json](qa/v0.3.0-report.json) restent des archives de leur livraison 1 321→1 371. Le [premier contrôle de fusion](workbook-previews/customization-merge-native-check.json) porte sur `0d2192a`. Ces preuves historiques ne sont pas réécrites pour la synchronisation finale. Aucun de ces contrôles n’est un essai de Microsoft Excel ou de l’exécutable Windows natif.

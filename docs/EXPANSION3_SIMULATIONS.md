# Simulation — troisième lot du 1er novembre 2026

Dans **Chroniques → œuvre et période → Simulation**, choisir **Lot 3**. Le filtre **Tous les lots** conserve les sélections précédentes. La livraison part du `main` fusionné `1b3444f`, avec les dernières poses de Shepard et les corrections de l’atelier.

Ce lot ajoute **122 dossiers distincts**, dont **38 exercices exécutables** et **84 consultations**. Les sources disponibles déterminent les effectifs ; aucun modèle ou combattant n’est inventé pour atteindre un quota.

| Famille | Dossiers supplémentaires | Exercices | Consultation |
|---|---:|---:|---:|
| Personnages et PNJ | 40 | 3 | 37 |
| Secours médicaux | 2 | 2 | 0 |
| Armes | 40 | 18 | 22 |
| Vaisseaux et véhicules | 0 | 0 | 0 |
| Ennemis et boss | 40 | 15 | 25 |
| Total | **122** | **38** | **84** |

Les trois lots réunissent **498 références**, **280 exercices partiels** et **218 consultations**. Une occurrence documentaire n’est pas nécessairement une personne unique, une arme nouvellement équipable ou une nouvelle rencontre de campagne.

## Secours avec médi-gel

Deux commandes natives distinctes permettent de tester **Unité ME2** et les **Premiers secours ME3**. Elles exigent un banc explicitement préparé, la bonne œuvre et la capacité correspondante déjà préparée sur le secouriste. Aucun personnage existant ne reçoit ces pouvoirs.

Une vraie commande consomme une dose partagée du banc et relève deux équipiers abstraits KO. La jauge ATB du secouriste est consommée. L’essai vérifie ensuite un refus avec une réserve vide, une jauge prête et un équipier KO. Un autre contrôle refuse une cible exclue sans dépenser de dose. Les témoins conscients et les cibles explicitement exclues restent inchangés ; les soutiens et cibles d’une autre œuvre sont également exclus.

Le [relevé primaire](qa/expansion3-medical-reference-report.json) et la [note de sources](research/expansion3-medical-sources.md) identifient deux manuels officiels réellement téléchargés et les pages effectivement inspectées. Ils attestent le principe du secours avec médi-gel. **Le coût de groupe, le retour à 30 % de santé et les jauges sont des réglages ATB de démonstration.** Le secours gratuit de proximité de ME3, les améliorations, les animations et les valeurs complètes d’origine restent à reproduire.

Ces deux nouveaux dossiers sont des **pouvoirs médicaux**, accessibles dans la famille **Équipements et secours**. Ils n’ajoutent aucune armure. Les anciennes fiches de médi-gel du lot 2 restent des consultations historiques ; elles ne sont pas comptées une seconde fois comme nouveaux dossiers.

## Personnages, armes et adversaires

Les 40 dossiers de personnages couvrent treize œuvres et sont absents des 376 études et des 42 acteurs sélectionnables historiques. Ils distinguent 31 occurrences nommées et neuf identités conditionnelles, collectives, enregistrées ou distantes. Trois exercices abstraits concernent Brooks sous préparation Legendary, Anderson dans Retribution avec une action armée attestée et le collectif des défenseurs d’Omega dans Invasion. Cela ne crée ni recrutement ni kit original. Les enfants, civils, IA et références trop peu décrites restent en consultation. Fisher, Greer et Kirkland restent dans le prologue d’Andromeda.

Les 18 exercices d’armes utilisent leurs profils conventionnels exacts : dix ME3 et huit Andromeda. Chargeurs et réserves restent finis. Les noms identiques de deux œuvres ne donnent aucune équivalence de ressource ou de permission. Les 22 consultations conservent les mécanismes et droits non reconstitués : spécialisation ME2, contenu additionnel non préparé, armes d’Infiltrator/Galaxy et objets narratifs de romans. Aucun rang, recette ou acquisition n’est accordé.

Les 40 adversaires sont distincts des deux lots et des seize opposants historiques. Quinze exercices utilisent des actions génériques : cinq unités des DLC ME2 exigent Legendary Edition ; les défenses fixes n’acquièrent aucun déplacement. Les 25 fermetures couvrent notamment rencontres spéciales, variantes multijoueur/Armax non préparées, allégeance de l’Observer, faune à hostilité locale et contenu bonus d’Infiltrator. Aucune phase de boss ou capacité originale n’est certifiée.

Le stock examiné ne fournit plus de nouvelle coque contextuelle. Les 66 dossiers de flotte des deux premiers lots demeurent accessibles. Des pièces intérieures, missions doublonnées et références sans période ne sont pas transformées en nouveaux véhicules.

## Suivi et vérification

[Expansion3_Simulations.xlsx](Expansion3_Simulations.xlsx) suit les 122 dossiers dans cinq feuilles à effectifs réels, dont une feuille de flotte vide. Le statut SIM du nouveau livrable reste séparé du statut du catalogue source. Les catalogues conservent leurs **6 708 fiches et 454 sources** ; aucune promotion de statut historique n’est appliquée.

Les **745 tests Node** et la compilation de **76 modules** passent. L’audit compare intégralement les **242 anciens résultats et contrôles**, garde leurs **134 fermetures** et vérifie les empreintes de **1 301 fichiers historiques**. Les limites de chaque dossier restent affichées dans le jeu.

Le [rapport de livraison](qa/expansion3-report.json) relie l’[audit natif](qa/expansion3-native-report.json), les [tests](qa/expansion3-unit-report.json), le [build](qa/expansion3-build-report.json), la [revue des sources](qa/expansion3-source-review.json), les parcours [développement](qa/expansion3-browser-report.json) et [production](qa/expansion3-production-report.json), la [revue visuelle en jeu](qa/expansion3-ui-visual-review.json) et le [contrôle du classeur](qa/expansion3-workbook-report.json).

```bash
npm test
npm run build
node scripts/audit-expansion3.mjs
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium GAME_URL=http://127.0.0.1:4173 node scripts/expansion3-browser.mjs
```

Ce lot ne fournit pas de nouveau sprite, costume, son, modèle ou campagne complète. **La fidélité intégrale 1:1 reste inachevée.**

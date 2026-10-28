# Simulations indépendantes — lot du 28 octobre 2026

Depuis le titre ou la pause, ouvrir **Chroniques**, choisir une **œuvre** et sa **période**, puis **Simulation**. Sélectionner une famille et une référence. Les profils d’édition sont explicites : Standard, Legendary pour ME2/ME3, Deluxe pour Andromeda. Une édition ne remplace jamais une preuve de disponibilité manquante.

Les cinq lots ajoutent chacun 40 fiches d’étude liées aux identifiants du registre existant. Ce sont **200 références contextuelles**, pas 200 nouveaux faits, 40 personnes uniques par jeu ou 40 véhicules pilotables. Les occurrences d’une même identité dans différentes œuvres restent séparées.

| Lot | Références | Épreuves possibles avec contexte et édition corrects | Consultation seule |
|---|---:|---:|---:|
| Personnages et PNJ | 40 | 25 | 15 |
| Armures et équipements | 40 | 35 | 5 |
| Armes | 40 | 22 | 18 |
| Vaisseaux et véhicules | 40 | 27 | 13 |
| Ennemis et boss | 40 | 36 | 4 |
| Total | **200** | **145** | **55** |

Les personnages comprennent 40 occurrences sur 18 œuvres, représentant 36 personnes nommées. Les 40 adversaires sont supplémentaires aux 16 profils des bancs historiques. Les armures comprennent 25 ensembles déjà couverts ailleurs et 15 références auparavant fermées aux anciens loadouts ; cinq pièces ME2 restent en consultation. Les armes comprennent 14 profils spéciaux existants, huit nouvelles épreuves de contact Andromeda et 18 inspections fermées. Les vaisseaux restent des références par œuvre ; stations, groupes et identités de transports non résolues restent en consultation.

## Épreuves

Le bouton lance un exercice borné et reproductible. La graine, de 1 à 999999, fixe les événements aléatoires ; la difficulté et le profil d’édition font partie des paramètres. Changer de référence, de période ou de paramètre retire le résultat précédent.

Les exercices ATB utilisent le moteur réel, sans forcer le résultat. Le groupe ou la cible adverse est abstrait : aucune rencontre de l’œuvre originale n’est attribuée à cette équipe. Les armures comparent deux essais séparés avec le même témoin et la même graine. Les profils d’armes natifs conservent leurs ressources exactes de prototype, y compris clips, chaleur, charge et canalisation. Les huit armes de mêlée utilisent le contact générique : aucun soin, gel, téléportation, pouvoir ou effet propre n’est ajouté à partir du seul nom de l’arme.

Les véhicules suivent trois étapes logistiques originales. Intégrité, réserve, marge et mobilité sont des budgets de cet exercice ; ils ne représentent ni carburant réel, ni armement, vitesse, coque ou capacité du modèle original. Il n’y a pas de pilotage physique ni de combat spatial.

Les rôles civils restent en inspection. Une source qui identifie un personnage n’atteste pas son kit de combat. Les phases, pouvoirs, mouvements, silhouettes et animations manquants restent visibles dans chaque fiche. **Aucune fidélité intégrale 1:1 n’est certifiée.**

## Excel et conservation

[Expansion_Simulations_200.xlsx](Expansion_Simulations_200.xlsx) suit les cinq lots dans cinq feuilles de 40 lignes. Le statut du catalogue et le statut du nouvel exercice sont séparés. Une consultation fermée ne devient pas un prototype de gameplay. Les 1 382 fiches principales, les 5 326 supplémentaires et leurs 454 sources sont conservées ; les 28 classeurs historiques, le manifeste et le ZIP ne sont pas réécrits par ce lot.

103 références jusque-là au stade Défini disposent d’une nouvelle épreuve partielle. Cela ne termine pas leurs critères de production d’origine ; leur statut documentaire historique reste inchangé. Le nouvel Excel et ses preuves suivent cette livraison séparément.

Le simulateur ne lit ni n’écrit les sauvegardes de campagne ou de Chroniques. Il n’accorde aucun recrutement, objet, crédit, récompense, survie, loyauté ou décision narrative. La personnalisation fusionnée par la PR nº1 reste présente.

## Vérification

```bash
npm test
npm run build
node scripts/audit-expansion.mjs
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium GAME_URL=http://127.0.0.1:4173 node scripts/expansion-browser.mjs
```

Le [rapport de livraison](qa/expansion-report.json) relie les preuves finales. L’[audit natif](qa/expansion-native-report.json) exécute et rejoue les 145 épreuves et vérifie la conservation des fichiers historiques protégés. Les rapports [navigateur](qa/expansion-browser-report.json) et [production HTTP](qa/expansion-production-report.json) décrivent leurs parcours réels. La [revue des sources](qa/expansion-source-review.json) distingue les identités attestées des mécanismes de prototype. Les empreintes identifient les versions testées ; les rapports des lots antérieurs restent historiques.

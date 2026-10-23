# Opérations annexes — sources et choix de l’adaptation

Vérification documentaire : **23 octobre 2026**. Les pages ci-dessous ont été consultées pour les personnages, objectifs et grandes conditions narratives de ME1. Les dialogues du jeu sont des textes réécrits pour ce projet. Les 11 opérations ajoutées complètent les trois assignations déjà présentes sur `main` (`homecoming`, `family`, `fan`) ; elles ne les remplacent pas.

## Couverture jouable

| Opération | Source descriptive | Éléments repris | Adaptations ou éléments restants |
|---|---|---|---|
| La Favorite | [Asari Consort](https://masseffect.fandom.com/wiki/Citadel%3A_Asari_Consort) | Nelyna, Sha’ira, Septimus ; accusations puis réconciliation. | Quatre étapes sur la Citadelle condensée ; pas de cadeau d’Eletania, de scène intime ni de variantes complètes liées au passé de Shepard. |
| La plainte de Xeltan | [Xeltan’s Complaint](https://masseffect.fandom.com/wiki/Citadel%3A_Xeltan%27s_Complaint) | Les preuves de Septimus innocentent Sha’ira ; Xeltan retire sa plainte. | Deux échanges guidés ; le bonus de relique de Sha’ira n’est pas implémenté. |
| La demande de la journaliste | [Reporter’s Request](https://masseffect.fandom.com/wiki/Citadel%3A_Reporter%27s_Request) | Emily Wong recherche des preuves ; le disque de Fist étaye son enquête. | Le recrutement de Tali débloque le disque ; l’assaut de Chora’s Den reste hors scène. |
| Scanner les veilleurs | [Scan the Keepers](https://masseffect.fandom.com/wiki/Citadel%3A_Scan_the_Keepers) | Chorban prête un scanner ; collecte de mesures non invasives. | Quatre relevés guidés puis rapport. Le jeu original comporte 21 veilleurs ; Legendary Edition demande 20 scans parmi les 21. Les embranchements de Jahleed et les récompenses par scan restent à produire. |
| Traque du signal | [Signal Tracking](https://masseffect.fandom.com/wiki/Citadel%3A_Signal_Tracking) | Flux → accès aux secteurs → Barla Von → Emporium ; une IA détourne des crédits et menace de se détruire. | Quatre points sur une carte condensée. La décision de neutralisation remplace le désamorçage chronométré ; récompense fixe adaptée. |
| Le prédicateur du Présidium | [Presidium Prophet](https://masseffect.fandom.com/wiki/Citadel%3A_Presidium_Prophet) | Différend entre un hanari et un agent du SSC ; possibilité de payer un permis de 150 crédits ou de persuader. | Trois étapes ; seuils de 6 points sur les jauges de l’adaptation, au lieu des talents et niveaux de Charme/Intimidation du jeu original. |
| Le docteur Michel | [Doctor Michel](https://masseffect.fandom.com/wiki/Citadel%3A_Doctor_Michel) | Chantage médical, Morlan, maître chanteur krogan ; issue persuasive ou combat ; remise médicale. | Quatre étapes. La remise devient 20 % sur les recharges de médi-gel des armureries. L’avantage de revente et la piste Banes restent absents. |
| Rétablir l’eau | [Water Restoration](https://masseffect.fandom.com/wiki/Feros%3A_Water_Restoration) | Macha Doyle, trois vannes puis rapport. | Cinq étapes dans le niveau actuel ; salles et défenseurs de chaque conduite non reconstitués. |
| Cellules énergétiques | [Power Cells](https://masseffect.fandom.com/wiki/Feros%3A_Power_Cells) | May O’Connell attend des cellules prélevées sur une épave. | Trois étapes. Les varrens sont omis, sans remplacement par un autre type d’ennemi ; la viande de varren reste hors de ce lot. |
| Les geth dans les tunnels | [Geth in the Tunnels](https://masseffect.fandom.com/wiki/Feros%3A_Geth_in_the_Tunnels) | Fai Dan, défense geth, trois krogans, destruction du transmetteur puis rapport. | Deux combats ATB ; unité lourde existante et deux tireurs, drone absent. Destruction du transmetteur par interaction. Rapport impératif avant le boss Thorien. |
| Récupération des données | [Data Recovery](https://masseffect.fandom.com/wiki/Feros%3A_Data_Recovery) | Gavin Hossle demande ses recherches ; trois krogans protègent son terminal. | Gavin et le terminal partagent la carte condensée. Copie avant le Thorien ; remise ultérieure permise. Conséquences ME3 non simulées. |

Le parcours des tunnels et la récupération des données ont également été recoupés avec le [guide officiel Prima pour Féros](https://primagames.com/eguides/mass-effect-pc-eguide/walkthrough/spectre-assignments-noveria-and-feros/feros-assignments). Certaines formulations générales du guide sur la disponibilité après le Thorien ne distinguent pas les contacts ; les restrictions explicites concernant Fai Dan et l’accès au terminal ont été retenues pour ce prototype.

## Règles propres à Relay Chronicles

- **43 étapes**, dont **4 combats possibles** : le maître chanteur de Michel (évitable), la défense geth des tunnels, les trois gardes du transmetteur et les trois gardes du terminal de Gavin.
- Les statistiques des ennemis proviennent des archétypes déjà employés par le moteur. Leur nombre et leurs actions passent par `createBattle`, sans victoire automatique liée au dialogue.
- Un choix de combat crée une étape en attente. La sauvegarde conserve cette intention ; un rechargement invite à recommencer le combat. Les dégâts et jauges d’un combat en cours ne sont pas sauvegardés.
- Les récompenses d’XP, crédits et moralité sont fixes et réglées pour le rythme ATB. Elles sont versées une fois, à la dernière étape. Le permis de 150 crédits est payé au moment du choix ; abandonner puis reprendre ne permet pas de modifier une décision déjà appliquée.
- Toutes les opérations ferment lors du passage du Conduit. Une opération terminée conserve son historique et ses effets. Les aides à l’eau et à l’énergie peuvent être terminées après Féros si la colonie a été épargnée.
- `colonySupport` indique combien des trois services présents ont été résolus. Cet indicateur ne prétend pas reproduire la formule complète de survie des colons de ME1.
- Les coordonnées désignent les emplacements de l’adaptation. Le moteur choisit à proximité un point accessible, sans supprimer les obstacles du niveau.

## État et interfaces

`state.operations` est indépendant de `state.assignments`. Format :

```json
{
  "version": 1,
  "records": {
    "citadel-doctor-michel": {
      "stage": 2,
      "choices": { "request": "accept", "morlan": "question", "blackmailer": "fight" },
      "victories": [],
      "pendingBattle": "blackmailer"
    }
  }
}
```

`stage` compte les étapes réellement résolues. Chaque étape résolue exige un choix valide ; chaque choix de combat résolu exige une entrée de victoire. Une seule étape de combat peut être en attente dans une opération. Les données absentes des anciennes sauvegardes sont initialisées ; les données explicitement invalides sont rejetées.

Les exports `listOperations`, `operationPOIs` et `getOperationInteraction` sont des lectures sans mutation. `advanceOperation` exécute une réponse autorisée. `getOperationEncounter` ne fournit un combat qu’après l’armement de l’étape. `finishOperationBattle` est appelé par l’orchestrateur après vérification du gagnant réel. `operationEffects` expose les effets persistants de conclusion.

## Vérification

`tests/operations.test.js` vérifie la progression, les conditions, la coexistence des anciennes assignations, les transactions atomiques, les récompenses uniques, la reprise d’un combat, les limites narratives, la migration et le rejet d’états incohérents. Le parcours navigateur complémentaire est décrit dans son rapport de QA ; ses preuves d’intégration restent distinctes de la fidélité au jeu original.

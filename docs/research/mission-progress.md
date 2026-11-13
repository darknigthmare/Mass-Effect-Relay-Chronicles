# Objectifs de mission ME1 — étapes jouables

Ce chantier part de `259d51267a64404048c1e18a1e549f5a356b63c6`. Il complète trois fiches P0 existantes avec des interactions dans les cartes déjà jouables. Il conserve les sprites HD, le groupe de trois, l’ATB et les récompenses de chapitre existantes. Aucun nouvel atlas, aucune nouvelle statistique d’équipement et aucun chapitre supplémentaire ne sont créés.

## Référence réellement relue

Le [guide Prima officiel](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) a été téléchargé à nouveau avec une réponse **HTTP 200** : **4 677 689 octets**, **23 pages PDF**, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Le texte de la **page PDF 15 / page imprimée 71** confirme quatre charges de détonation, un désamorçage de six secondes, une possibilité d’annulation et une échéance décrite comme « a few minutes ». Il indique aussi que la première charge se trouve près de la plateforme après le train.

Le délai total de **300 secondes** n’est pas certifié par ce passage : c’est un réglage de l’adaptation. Les quatre coordonnées sont celles des quais et de la plateforme de la carte locale actuelle, sans relevé topographique du jeu original. Le train, les hauteurs et les combats intermédiaires originaux restent condensés.

Les tentatives de lecture des pages communautaires `Noveria:_Reconnect_Landlines` et `Ilos:_Find_the_Conduit` ont répondu **HTTP 402**, avec 55 octets. Leur contenu n’a pas été lu et ne sert pas de preuve des systèmes, durées ou parcours reproduits. L’extrait Prima contient la table des matières des autres chapitres, pas leur réalisation détaillée.

## Périmètre jouable

| Fiche | Comportement de l’adaptation | Réserve restante |
|---|---|---|
| `QST-desamorcage-du-spatioport` | Après les deux premiers contacts et avant la dernière défense, démarrer l’étape ; rejoindre quatre charges et rester immobile six secondes par charge ; annuler, échouer, reprendre ou terminer | 300 secondes, placements, suspension des combats et carte condensée adaptés ; train et topologie d’origine incomplets |
| `QST-remise-en-marche-mira` | Après le premier combat, réactiver trois stations distinctes dans l’ordre choisi ; chaque réparation persiste et ouvre l’accès aux laboratoires suivants | Initialisation, alimentation et liaison condensées ; puzzle du noyau, réacteur, carburant, intérieurs et séquence d’origine non reproduits intégralement |
| `QST-course-au-conduit` | Après les trois rencontres d’Ilos, demander l’activation de Vigil, puis atteindre le passage avant expiration ; échec et reprise à Vigil explicites | Fenêtre de 60 secondes et parcours à pied adaptés ; course originale au Mako et durée exacte restent à produire ou recouper |

Ces fiches restent **Prototype**, même après réussite des tests techniques. Leurs apparences, mises en scène et mécaniques originales complètes ne sont pas certifiées 1:1.

## État et frontières

Le sous-état `state.missionProgress` est versionné séparément (`version: 1`) et contient trois enregistrements. Les statuts sont `idle`, `active`, `failed`, `complete` et `legacy-complete`. Un enregistrement contient les étapes réellement terminées, le temps de terrain restant, le nombre de tentatives et, pour Eden, le désamorçage en cours avec son point de départ.

Seul un champ absent déclenche la migration. Un ancien chapitre déjà terminé reçoit `legacy-complete` avec zéro détail de charge ou de réparation inventé. Un objet présent malformé, des étapes dupliquées, une durée impossible, une version étrangère, un canal inconnu ou un accesseur sont refusés. La lecture du journal, du HUD ou d’un dialogue n’écrit rien dans la partie.

Le module ne modifie que ce sous-état. Il ne remet ni XP, ni crédits, ni médi-gel, ne change aucun choix et ne marque aucun chapitre gagné. `completeZone` conserve la remise unique de ses récompenses. La frontière primitive historique reste compatible avec les fixtures natives qui terminent un chapitre sans activer ce nouveau module ; dans le parcours joueur, les portes de rencontre et l’objectif démarrent l’étape, puis un état actif ou échoué bloque sa validation.

Le chronomètre consomme le temps simulé de terrain transmis par la boucle du jeu. Les menus, le combat ATB, le chargement et la perte du focus le suspendent. Il ne dépend d’aucun `Date.now`, temporisateur système ou temps accumulé en arrière-plan. La suspension en combat est un choix de cette adaptation. La sortie de la zone est refusée tant qu’une étape chronométrée est active ou échouée ; MIRA peut être quittée et reprise sans perdre les stations déjà réparées.

À Eden, un déplacement de plus de 1,25 unité depuis le point de départ annule le canal sans valider la charge. Une reprise explicite remet les quatre charges et les cinq minutes, sans retirer les combats ou ressources déjà enregistrés. À Ilos, la reprise revient à Vigil et attend une nouvelle activation ; elle ne prétend pas remonter le temps de toute la campagne.

## Intégration

`getMissionEncounterGate` place les portes avant la dernière rencontre d’Eden et avant les laboratoires suivants de Novéria. `getMissionPOIs` fournit des marqueurs `missionId` / `stepId` ; `WorldView.setOperationPOIs` choisit leur position praticable en tenant compte des autres interactions. La proximité appartient à l’interaction normale du renderer, avec le point effectivement affiché après déplacement éventuel du marqueur.

`getMissionInteraction` fournit les lignes et choix français, `advanceMission` valide la transition, et `tickMission` publie uniquement les changements de canal, l’échec ou la réussite. Une reprise renvoie un point de contrôle ; le parent applique son placement par la méthode native du monde. `mission-progress-ui.js` fournit le texte du HUD et le panneau du journal, avec le compte à rebours et les règles visibles.

## Vérifications

Les douze tests de `tests/mission-progress.test.js` passent après le raccord de persistance de `state.js` ; combinés aux seize tests existants de ce module, le contrôle ciblé totalise 28 réussites. Ils contrôlent les quatre canaux, la pause, le mouvement, les limites de temps, les reprises, les stations dans plusieurs ordres, l’activation de Vigil, les refus, la migration et l’absence de récompense. Parmi eux, trois contrôles vérifient le vrai décodeur de campagne, le blocage des récompenses de chapitre jusqu’à la résolution et le même temps consommé à 5, 10 et 60 pas par seconde. Les ancrages déclarés appartiennent au sol natif des trois cartes.

Le parcours public DEV04 passe cinq contrôles sur les sources gelées : quatre désamorçages naturels et pause exacte, expiration/reprise, trois réparations MIRA, activation/arrivée puis transition réelle au Conduit, et reprise par la sauvegarde automatique. Ses 14 captures ont été réellement ouvertes et revues. Les 27 exports sont de vrais téléchargements de la partie ; les 14 imports comprennent des préparations de progression et des transferts de position déclarés. Ces transferts ne sont pas présentés comme des marches jouées. Le passage public de production final 01 passe ensuite les mêmes cinq contrôles sur le build compilé inchangé, avec 14 nouvelles captures réellement ouvertes, 27 exports et 14 imports déclarés. Les empreintes des 18 sources et de tous les fichiers de `dist` restent identiques avant et après le passage ; aucune source Vite, erreur de console produit ou exception n’est relevée. Les seuls avertissements réseau sont ceux du favicon absent.

Le collecteur [priority-objectives-public.mjs](../../scripts/priority-objectives-public.mjs) est préparé. Il demande un serveur gelé et un préfixe inédit :

```bash
GAME_URL=http://127.0.0.1:4191/ PRIORITY_OBJECTIVES_MODE=development PRIORITY_OBJECTIVES_PREFIX=priority-objectives-dev-final-01 node scripts/priority-objectives-public.mjs
```

Pour le build compilé, changer l’URL et `PRIORITY_OBJECTIVES_MODE=production`, avec un nouveau préfixe. La commande ci-dessus décrit la forme du lancement ; le passage DEV exécuté utilise le préfixe `priority-objectives-dev-final-04`. Voir le [rapport brut DEV04](../qa/priority-objectives-dev-final-04-report.json) et sa [revue des images](../qa/priority-objectives-dev-final-04-visual-review.json), puis le [rapport brut de production](../qa/priority-objectives-production-final-01-report.json) et sa [revue des 14 nouvelles captures](../qa/priority-objectives-production-final-01-visual-review.json). Les essais 01/02/03 sont conservés avec leurs périmètres propres. Le collecteur prépare les prérequis avec les callbacks natifs et lit les positions réelles des marqueurs dans la carte publique ; ses transferts dérivés des vrais exports sont déclarés comme positions préparées, pas comme marches jouées. Les six secondes, la pause du canal, l’expiration, les réparations, l’arrivée et la transition utilisent ensuite les contrôles publics réels.

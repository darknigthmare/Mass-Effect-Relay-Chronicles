# Advance — progression et suivi des étapes ME1

Socle : `d2e8432ec4057890b6f86e42ce596f1ab5810148` (`main`). Le lot conserve JavaScript ESM, Three.js 0.180.0, les sprites 2D HD dans les décors 3D et les combats ATB. Méthode : `rpg`, `dialogue-systems` et `save-systems` de la révision épinglée dans [gamedev-sources.json](../gamedev-sources.json), lus depuis le cache de session `/tmp/relay-guides/`. Les textes restent des adaptations françaises condensées ; aucun dialogue, cadrage ou asset original complet n’est certifié.

## Fonction ajoutée

Le journal montre huit étapes du dossier initial au premier départ sous le commandement de Shepard. Il lit les vrais champs de la partie : dossier, briefing, visites, rencontres, recrutement, pertes et chapitres. Il ne maintient pas une seconde table de validations de quêtes. Une étape active peut être suivie ; la sélection survit à la sauvegarde et fournit un objectif au HUD ainsi qu’un repère dans la zone concernée. L’étape achevée cesse immédiatement de fournir un objectif suivi, même si son identifiant historique reste conservé.

Le contact avec la balise et l’extraction sont distincts. Après `completeZone('eden-prime')`, le journal attend le retour effectif Eden Prime → Normandy. Ce voyage inscrit le reçu unique du retour. Le premier départ Normandy → Thérum/Féros/Novéria après la nomination inscrit la première piste choisie ; il ne verrouille pas les deux autres.

Les transactions de briefing et de voyage valident la sauvegarde complète avant toute mutation. Elles ne donnent ni expérience, ni crédits, ni objet. Une deuxième validation du même briefing ou de la même arrivée ne réécrit ni la position, ni le journal. La carte et le voyage utilisent la même autorité : `getDestinationAccess`, qui compose `unlockedZones` et le verrou des étapes chronométrées existantes.

## Persistance et migration

Le champ facultatif de sauvegarde `campaignProgress` a la forme exacte suivante :

```json
{
  "version": 1,
  "beaconReturned": false,
  "commandDestination": null,
  "trackedMilestone": null
}
```

`commandDestination` vaut `null`, `therum`, `feros` ou `noveria`. Une destination renseignée doit être réellement visitée après l’accomplissement du chapitre Citadelle. `beaconReturned:true` exige Eden Prime accompli. Le suivi ne peut nommer que l’une des huit étapes connues. Un champ absent dans une ancienne partie migre depuis les visites et accomplissements démontrables ; un champ présent invalide, `undefined`, doté d’une propriété supplémentaire ou d’un accesseur est refusé. La migration ne crée aucune récompense. Les emplacements manuels, la sauvegarde automatique et le bilan portable de fin ME1 conservent leurs contrats distincts.

## Contrat d’intégration

`src/state.js` fournit :

- `confirmCampaignBriefing(state)` : `{ok, changed, reason?}` ; remplace l’écriture directe de `flags.briefed` après confirmation finale.
- `canTravelCampaign(state, zone)` : résultat de la même autorité d’accès que la carte, après validation de la partie.
- `travelCampaign(state, zone)` : `{ok, changed, firstVisit, reason?}` ; commit atomique de la zone, position de reprise remise à `null`, visite, reçus et rapports. À appeler après préparation de la transition visuelle ; la reprise de sauvegarde conserve son chemin dédié et sa position.
- `trackCampaignMilestone(state, id|null)` : `{ok, changed, reason?}` ; exige une étape active pour une nouvelle sélection, et libère l’opération suivie.

`src/advance-progression.js` fournit `renderCampaignMilestones(state,{esc})` pour le journal et `getTrackedCampaignObjective(state)` pour le HUD et la carte. Ce dernier renvoie `{id,text,targetZone,targetPoiId}` ou `null`, et ne fournit le POI que dans sa zone effective. Une sélection d’opération doit libérer le suivi de campagne.

## Critères et réserves de clôture

| ID | Critère exact | Portée du lot et réserve |
| --- | --- | --- |
| `QST-profil-de-shepard` | Variables sauvegardées avant le prologue. | Les cinq variables du dossier, dont apparence, origine, réputation psychologique et classe, sont vérifiées avant briefing. Le créateur facial et les réactions complètes aux antécédents ne sont pas ajoutés. |
| `QST-briefing-normandy` | Ordre des informations et transitions contrôlé. | Confirmation finale protégée et persistante. La description exige rencontrer Anderson **et Nihlus** ; la présence de son nom dans une question ne termine pas cette description. Fiche encore partielle. |
| `QST-deploiement-eden-prime` | Équipe temporaire et première caméra correctes. | Le départ conserve Shepard/Kaidan/Jenkins et inscrit une seule visite. Aucune comparaison au cadrage initial original n’est prouvée ici. Fiche encore partielle. |
| `QST-perte-de-jenkins` | Aucune guérison mécanique annulant sa mort. | La perte scénarisée du premier affrontement reste irréversible ; Unity relève un KO réellement présent en combat et le médi-gel soigne un vivant, sans réintroduire Jenkins. Récompenses du premier contact uniques. |
| `QST-rencontre-d-ashley` | Ajout au groupe au bon moment. | Ashley remplace Jenkins après le premier contact existant. Le soutien à la survivante et une rencontre distincte complète ne sont pas reconstitués ; ne pas clore toute la fiche sur le seul tableau de groupe. |
| `QST-vision-de-la-balise` | Séquence unique puis retour au Normandy. | La primitive de chapitre garde le contact unique ; un reçu distinct et un rapport sont inscrits au retour réel. La séquence française demeure textuelle et condensée. |
| `QST-intronisation-spectre` | Déblocage des systèmes lié à cet événement. | Les trois premières pistes restent verrouillées avant la fin effective Conseil/passation existante. Le journal expose ce verrou, sans octroyer l’autorité depuis sa consultation. |
| `QST-commandement-du-normandy` | Carte galactique ouverte sans imposer un ordre arbitraire. | Les trois premières destinations sont libres et testées chacune comme premier choix. Le reçu de première piste décrit le choix réel ; aucune priorité Thérum imposée. |
| `QA-double-validation` | Une seule transaction ou progression. | Vérifié pour briefing, voyage, premier combat, recrutement déjà reçu, fin de chapitre et sélection de suivi. L’ensemble des actions du jeu dépasse ce lot : critère global encore partiel. |
| `QA-continuer-apres-rechargement` | Même équipe, mêmes objectifs et même position sûre. | Roundtrip natif de l’équipe, du suivi et des reçus ; la reprise publique et la sûreté de position doivent encore être observées après intégration. |
| `QA-quete-et-journal` | État cohérent dans journal, PNJ et carte. | Huit étapes suivies et cibles contextuelles. La totalité des quêtes, PNJ et cartes du catalogue dépasse ce lot : critère global encore partiel. |
| `SYS-journal-de-mission` | Aucune mission terminée restant affichée active. | Les huit étapes dérivent des faits actuels et le suivi cesse sur accomplissement. Les assignations et opérations existantes restent des niveaux distincts ; aucune validation globale n’est déduite de cette seule suite. |

Les décisions de suivi catalogue ne doivent être figées qu’après les preuves publiques DEV, leur revue visuelle et le contrôle du build effectivement servi. Aucun statut d’asset n’est promu.

## Vérification native et parcours public prévu

Commande ciblée exécutée pendant le développement : `node --test tests/advance-progression.test.js tests/state.test.js` — 30/30 réussis, dont 14 nouveaux cas. Cela couvre aussi la frontière de compatibilité Féros : chapitre historique intact converti explicitement en historique sans inventer de survivants, et parcours moderne commencé qui refuse de contourner ses conditions. Aucun test global, build ou navigateur n’est présenté comme exécuté par cette note.

Plan du [collecteur public](../../scripts/advance-progression-public.mjs), après GO racine et gel de tous les fichiers exécutables : nouvelle preuve `advance-progression-public-dev-01`, puis nouveau préfixe indépendant en production. Il enregistre le SHA Git de base, les SHA-256 des sources courantes au début et à la fin, les fixtures, les quatre exports, les six captures, les erreurs et les requêtes ; le contexte du registre inclut `docs/content-catalog.json` et `src/universe-data.js`. En production, il fige aussi les fichiers `dist`, compare les octets effectivement chargés en HTTP et vérifie l’absence de requête source ou de harness QA. Les captures doivent encore être ouvertes réellement et leur revue est un artefact séparé.

1. Nouvelle campagne par les commandes publiques : choisir un dossier non standard, ouvrir le journal, suivre le briefing, sauvegarder/exporter, revenir au titre puis Reprendre. Comparer le dossier, l’équipe, le suivi et la position de l’export ; le marqueur du briefing et son objectif doivent revenir.
2. Terminer le briefing avec ses vrais boutons, puis choisir Eden Prime. Vérifier l’équipe temporaire, le déploiement et la disparition du suivi désormais terminé. Une capture du journal et une du terrain suffisent pour ce groupe.
3. Importer par le sélecteur public une fixture déclarée préparant **uniquement** les trois rencontres précédentes et le désamorçage déjà accompli, position devant la balise. Aucun parcours de ces étapes n’est revendiqué. Déclencher le contact, capturer son rapport puis utiliser le vrai retour au Normandy. Vérifier une récompense de chapitre et un reçu/rapport de retour, exporter, reprendre puis exporter de nouveau pour vérifier leur unicité ainsi que l’équipe, les objectifs et la position. Une capture avant retour et une après reprise.
4. Importer une fixture déclarée de Citadelle avec les preuves de Tali, dérivée de l’export réellement extrait, sans Conseil/passation accomplis. Jouer la nomination et la passation par leurs vrais boutons, retourner au Normandy et vérifier les trois destinations libres. Exécuter un vrai départ vers Novéria (ordre différent du premier choix proposé), reprendre et comparer le reçu, le journal et l’absence de récompense de voyage. Les trois premiers choix sont couverts nativement ; un départ est observé dans ce parcours public. Deux captures : choix galactique et bilan après reprise.

Le collecteur ne doit pas utiliser de harness privé, lecture d’état applicatif, injection DOM/CSS, horloge, jauge ATB ou PV. Les fixtures et éventuels transferts de position proviennent de données déclarées et sont importés par le sélecteur public ; leurs limites sont conservées. Ce plan n’est pas une preuve de traversée physique complète, de caméra canonique, de dialogues intégraux ou de support Windows/manette/téléphone.

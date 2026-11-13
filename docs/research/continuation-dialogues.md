# Dialogues de campagne · continuation

## Sources effectivement lues

- [Bible locale, DESIGN.md](../DESIGN.md), notamment le parcours Normandy → Eden Prime → Citadelle, l’équipe choisie et les récompenses uniques.
- [Suivi de fidélité](../FIDELITY.md), section Conversations et progression : Tali apporte la preuve ; Garrus et Wrex restent facultatifs et recrutables après l’audience ; les textes français sont condensés.
- Les cinq fiches courantes du [catalogue](../content-catalog.json) : `DIA-anderson-avant-eden-prime`, `DIA-premiere-audience`, `DIA-tali-preuve`, `DIA-intronisation`, `DIA-anderson-transmission`. Elles indiquent toutes une réécriture de production, source `PROJECT`, sans transcription intégrale fournie.
- Les règles exécutables de [state.js](../../src/state.js), [story.js](../../src/story.js), [story-data.js](../../src/story-data.js), [world-data.js](../../src/world-data.js) et les scènes jusque-là condensées dans `main.js`.
- Les guides épinglés [dialogue-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/dialogue-systems/SKILL.md) et [rpg](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/genres/rpg/SKILL.md), effectivement téléchargés et lus à cette révision. Ils guident la séparation graphe/état, les conditions et les effets uniques ; ils ne constituent pas une référence narrative Mass Effect.

Aucune autre bible externe ni transcription intégrale ME1 n’est accessible à cette vérification. Les détails de la scène, l’intégralité des répliques et leur fidélité mot à mot restent à comparer à une capture ou une transcription originale identifiée. Les dialogues ne revendiquent donc pas une reconstitution 1:1.

## Contrat et limites

`src/continuation-dialogues.js` fournit quatre graphes d’affichage : briefing, première audience, preuve de Tali, puis intronisation/passation. Chaque nœud et chaque choix ont un identifiant stable ; chaque ligne précise son interlocuteur. Les répliques de ton ne changent ni le verdict, ni les points de moralité, ni les relations. Elles ne créent aucune nouvelle décision sauvegardée.

Les modèles sont détachés et sans mutation. `advanceCampaignDialogue` revalide la disponibilité du choix avant de retourner une transition ou un effet. Le contrôleur du jeu conserve les opérations existantes : briefing, recrutement de Tali et `completeZone('citadel')`. Aucun autre budget XP, objet, crédit, pouvoir ou état de quête n’est ajouté.

La preuve détaillée de Tali n’est lisible qu’après l’acceptation qui déclenche son recrutement existant. Cette convention conserve les anciennes sauvegardes où le recrutement signifie déjà que les preuves ont été recueillies. Elle ne reconstitue pas les scènes hors carte, la clinique ou l’assaut de Chora’s Den.

Le briefing est limité à l’avant-Eden ; la première audience est indisponible après l’obtention des preuves. L’intronisation exige l’accès Citadelle et Tali vivante. Garrus et Wrex ne sont pas requis. Après les réponses au Conseil, Anderson passe le commandement ; seule sa confirmation finale déclenche la récompense de chapitre et les destinations d’enquête existantes. Une reprise au milieu de la conversation revient au dernier checkpoint et permet de relire la scène, sans récompense intermédiaire.

Les portraits du Conseil utilisent la représentation générique existante, avec le nom explicite de l’interlocuteur. Aucune nouvelle voix, cinématique, animation ou apparence n’est produite. Les sprites 2D, décors 3D, groupe de trois, commandes ATB et autres Chroniques gardent leurs règles.

## Vérification

Le [rapport natif](../qa/continuation-dialogues-native-01-report.json) conserve la commande réellement exécutée, les empreintes et les limites : 39 tests réussis, dont 11 nouveaux. Il vérifie chaque branche atteignable, la sortie de chaque nœud, les gardes de connaissance, les callbacks périmés, les quatre combinaisons de recrutement facultatif et la récompense existante accordée une seule fois après encodage/décodage.

`scripts/continuation-dialogues-public.mjs` collecte séparément les vrais contrôles de dialogue et les sauvegardes importées/exportées par l’interface. Il exige un préfixe de preuve neuf et déclare les fixtures de prologue et de position. Un rapport navigateur ne constitue une preuve qu’après son exécution et sa relecture ; le suivi proposé les référence au fur et à mesure de leur disponibilité.

Le [parcours public DEV01](../qa/continuation-dialogues-public-dev-01-report.json) réussit ses sept contrôles, avec sept exports réels et onze captures. Les onze images ont été [ouvertes et relues](../qa/continuation-dialogues-public-dev-01-review.json). Les sources et le registre de contexte sont identiques au début et à la fin du parcours ; aucune erreur JavaScript, console ou requête échouée n’est relevée. Une notification d’import masque transitoirement la fin d’une phrase dans la capture d’introduction de Tali ; la capture suivant la remise des preuves est dégagée.

Quatre critères fonctionnels peuvent être proposés comme couverts dans ce périmètre adapté. `DIA-anderson-transmission` reste partiel : la passation finale commande bien l’avancement et les destinations suivantes, mais l’accès physique au Normandy existait déjà avant la scène. Le critère original « Débloquer le Normandy au terme de la scène » n’est donc pas clos par une réinterprétation du mot déblocage.

Le [parcours compilé PROD02](../qa/continuation-dialogues-public-production-final-02-report.json) passe les mêmes sept groupes de contrôles, avec sept exports et onze [captures réellement ouvertes et relues](../qa/continuation-dialogues-public-production-final-02-review.json). Les sources courantes, registre généré inclus, et les 92 fichiers du build sont hachés au début et à la fin et restent identiques. Les quatre fichiers HTML/JS/CSS distincts observés dans le navigateur correspondent aux octets compilés. Les routes de sources de développement sont refusées ; aucune requête de ce type, erreur ou notification de ressource manquante n’est relevée. Le parcours conserve les fixtures et limites de DEV01.

La [première tentative compilée](../qa/continuation-dialogues-public-production-final-01-report.json) reste explicitement négative : après ses sept groupes fonctionnels, une attente globale `networkidle` ajoutée au collecteur a expiré. Ses douze captures ont été [ouvertes et revues séparément](../qa/continuation-dialogues-public-production-final-01-review.json), sans convertir ce résultat en réussite. Une nouvelle variante de collecte, liée par SHA aux collecteurs précédents, supprime seulement cette attente globale et conserve les comparaisons de réponses et de build. Aucun produit, ancienne preuve DEV ou proposition publiée n’est modifié par cette correction de QA.

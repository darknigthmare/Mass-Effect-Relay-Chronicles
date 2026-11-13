# Narration ME1 : ordre des missions et conséquences

Base du lot : `0d76912517a91c5d2ad00f1ef5718188b40abd8e`. Cette extension conserve le runner français existant, les sprites HD, les trois membres de groupe et l’ATB. Elle utilise les décisions déjà présentes dans la sauvegarde ; elle n’ajoute ni jauge d’affection ni romance fictive.

## Comportements ajoutés

Le premier sujet de Liara, « Vos recherches prothéennes », évoque les destinations effectivement terminées **avant** Thérum. Le tableau ordonné `completed` fait foi : une planète déverrouillée, simplement visitée ou terminée après son recrutement ne devient pas une enquête menée avant son arrivée. Les sujets Cipher et Vigil conservent leurs portes de progression. Un sauvetage après Féros, Novéria puis Virmire possède donc une réaction distincte sans anticiper Ilos.

Après Virmire, seul le survivant dispose du sujet « Le retour de Virmire ». Son texte nomme correctement le membre perdu. Chakwas peut parler de cette absence et distingue décès narratif et réanimation d’un KO. Les anciens échanges du défunt restent consultables sous forme d’historique dans le dossier du commando ; ils ne rendent disponible ni interlocuteur, ni sélection d’équipe, ni corps dans la scène.

Chakwas adapte aussi « Mon dossier de service » aux trois origines et trois profils déjà enregistrés. Cet échange ne donne aucun point de réputation. Les libellés français du module `commander.js` sont réutilisés ; cette réactivité ne produit pas les missions personnelles d’origine ni une certification de leur localisation officielle.

Le résumé des décisions affiche les valeurs réelles de Conciliation et Pragmatisme ainsi que les faits connus : Jenkins, rapport de Féros, reine rachni, extraction de Virmire, conseil à Garrus et ordre final à la flotte. Il distingue un rapport global sur Féros du décompte individuel des colons non implémenté. L’ordre militaire final n’invente ni représentant humain ni composition politique. Les conséquences des épisodes suivants ne sont pas déduites.

Le panneau des liens du commando décrit les sujets réellement lus et le conseil réellement donné à Garrus. Les étapes « A rejoint le commando », « Échanges établis » et « Conseil mémorisé » décrivent ces actions enregistrées. Elles ne représentent pas un score d’amitié ou une romance originale complète.

## Contrat technique

`completion-narrative.js` expose des lectures pures :

- `getRecruitmentContext(state, id = 'liara')` : destinations précédant le recrutement, ou `null` avant le sauvetage.
- `getVirmireConsequence(state)` : survivant, défunt et bilan, uniquement après un choix enregistré cohérent.
- `getCompanionRelations(state)` : disponibilité, sélection et sujets réellement lus des membres recrutés.
- `getNarrativeConsequences(state)` : conséquences déjà décidées, avec réserves explicites.
- `getNarrativeSummary(state)` : réputation affichée, dossier, ordre des chapitres, recrutement et conséquences.
- `narrativeTopicText(state, conversationId, topicId, fallback)` : réécritures conditionnelles utilisées par le runner.

`completion-narrative-ui.js` expose `renderNarrativeSummary(state)` et `renderCompanionRelations(state)`. Ils échappent leur texte et réutilisent les classes du journal. Le parent les raccorde au commando, aux rapports et à la fin de campagne.

Aucun nouveau champ persistant n’est nécessaire. `story.heard` enregistre les nouveaux sujets dans le schéma existant ; `migrateStoryState` valide leurs prérequis. Un historique absent ne crée pas de conversation passée. Un sujet Virmire présent prématurément est refusé. Les tableaux `completed`, `recruited`, `lost` et les décisions existantes gardent leurs validateurs natifs. Les lectures ne touchent ni crédits, ni expérience, ni inventaire, ni choix.

## Références et limites

Les méthodes RPG et dialogues ont été relues à la révision épinglée `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` de `gamedev-skills/awesome-gamedev-agent-skills`, guides `skills/genres/rpg/SKILL.md` et `skills/disciplines/dialogue-systems/SKILL.md`. Le runner existant suffit ; aucune dépendance ou langue de script supplémentaire n’est introduite.

Les références et identifiants source du catalogue restent inchangés. Les pages communautaires Liara et Virmire ont répondu **HTTP 402 / 55 octets**, et la page Prima Thérum tentée **HTTP 403 / 17 octets**. Leur contenu n’a pas été consulté. Les nouvelles lignes sont des réécritures françaises de l’adaptation, pas des citations, ni une reconstitution certifiée 1:1 de toutes les réactions originales. La référence Prima Virmire inscrite dans plusieurs anciennes fiches n’est pas remplacée par cette tentative de lecture de Thérum.

Les romances, leur éligibilité et leurs étapes, les talents originaux Charme/Intimidation, la persuasion exacte de Saren, les conflits complets de Wrex et les issues politiques d’après-guerre restent ouverts. L’essai des seuils de persuasion porte les opérations ATB existantes : 6 points pour le hanari et les jauges affichées, sans prétendre reproduire les talents du jeu original.

## Vérifications

Le précontrôle natif [`completion-narrative-native-preflight-01-report.json`](../qa/completion-narrative-native-preflight-01-report.json) passe **52 tests**, avec sa sortie intégrale et les empreintes des sources. Les 15 nouveaux cas du module, deux nouveaux parcours du renderer et les 35 cas existants exécutés à nouveau couvrent les six ordres planétaires, Liara après Virmire, les deux pertes possibles, les deux conseils de Garrus, les neuf dossiers, les refus de sujets prématurés, la persistance et les limites 5/6 de persuasion. Médi-gel soigne réellement un survivant blessé et Unité relève réellement un KO de combat sans recréer le défunt du récit. Les méthodes natives du renderer vérifient l’absence des corps et conversations perdus dans plusieurs scènes, et l’unicité des recrutés sur les revisites.

Le précontrôle est réalisé pendant le développement concurrent et ne remplace pas le gel final. Le collecteur [`completion-narrative-public.mjs`](../../scripts/completion-narrative-public.mjs) est prêt pour les contrôles publics séparés :

```bash
GAME_URL=http://127.0.0.1:4191/ COMPLETION_NARRATIVE_MODE=development COMPLETION_NARRATIVE_PREFIX=completion-narrative-dev-final-01 node scripts/completion-narrative-public.mjs
```

Pour la production compilée, choisir son URL, `COMPLETION_NARRATIVE_MODE=production` et un préfixe inédit. Aucun lancement navigateur n’est revendiqué avant son exécution. Les prérequis de campagne et les points de réputation préparés sont déclarés dans les fixtures ; les transferts de position dérivent d’un véritable export public. Le collecteur utilise ensuite les vrais choix, menus, imports/exports et reprises du jeu, sans harness QA ou injection d’état dans la page.

## Parcours DEV gelé exécuté

Le [rapport DEV02](../qa/completion-narrative-dev-final-02-report.json) passe les six groupes : deux recrutements avec report/acceptation et revisites, deux conseils de Garrus, Liara précoce/tardive avec reprise, deux survivants de Virmire avec journal et reprise, deux choix réels sur la reine rachni, puis seuils 5/6 affichés. Les 22 nouvelles captures ont toutes été ouvertes individuellement et sont liées à leur SHA dans la [revue réelle](../qa/completion-narrative-dev-final-02-visual-review.json). Les 33 exports sont de vrais téléchargements ; les 19 imports incluent 17 fixtures déclarées et la reprise d’exports publics inchangés. Les sources du rapport sont restées identiques. Le [gate natif gelé du parent](../qa/completion-integration-final-05-report.json) passe 1 060 tests, incluant les cas narratifs et les opérations existantes.

Les réserves visuelles restent explicites : un accord grammatical dans le bilan d’Ashley et des notifications transitoires sur une ligne d’introduction du hanari. Les choix et prérequis restent lisibles. La vue centrale du Normandy ne cadre pas tous les postes ; ses corps sont contrôlés séparément par les méthodes natives du renderer. L’essai DEV01 incomplet et son diagnostic sont conservés. Au moment de cette revue DEV02, la production compilée était encore attendue ; le passage de production distinct est documenté ci-dessous.

## Parcours narratif de production exécuté

Le [rapport PROD01](../qa/completion-narrative-production-final-01-report.json) passe les six mêmes groupes sur la version compilée servie sur le port local 4194, avec le collecteur strictement identique au DEV02. Il produit 33 exports réels, 19 imports déclarés et 22 nouvelles captures. Aucun harness QA ni chargement de source Vite n’est observé ; les sources du collecteur et les 91 fichiers de `dist` restent inchangés. Les prérequis préparés et transferts de position gardent les limites explicites du rapport : aucune bataille antérieure ni marche transférée n’est déclarée jouée.

La [revue des 22 images de production](../qa/completion-narrative-production-final-01-visual-review.json) attribue leurs ouvertures réelles : les onze premières à `/root/priority_objectives`, les onze dernières à `/root/priority_controls`. Les deux revues élémentaires, les SHA des PNG et le SHA du brut sont liés individuellement ; aucune ancienne capture DEV n’est réétiquetée en production. Le bilan est PASS sans constat bloquant. La réserve de cadrage central du Normandy et le défilement de la phrase suivant les valeurs de réputation restent explicités. Le [natif global courant 06](../qa/completion-integration-final-06-report.json) passe 1 060 tests et remplace le lien global 05 dans la proposition ; les anciens rapports restent inchangés.

Ce passage valide la livraison de la famille narrative seulement. La composition globale du parent reste responsable des sept familles, du suivi publié, du registre, du build, de l’HTTP et de la préservation. Les romances, dialogues originaux, géométrie et scènes 1:1 restent limités comme indiqué plus haut. Le produit et le collecteur ne sont pas modifiés pour corriger les réserves mineures pendant ce gel.

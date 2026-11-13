# Resolve — Vigil et conclusion politique ME1

Point de départ : `f94bd6b7fbb36a4cd83b7672e7eb294b4830735f`. Les dialogues sont des réécritures françaises condensées. Le renderer, les sprites, le groupe de trois et les combats ATB restent ceux du projet. Aucun asset ni statut artistique n’est promu par ce travail.

Les guides locaux `/tmp/relay-guides/dialogue-systems.md` et `/tmp/relay-guides/save-systems.md` ont été lus : graphes explicites, effets à la validation, objets narratifs séparés de l’interface, migration des seuls champs absents et refus des entrées présentes invalides.

## Sources effectivement consultées le 13 novembre 2026

Les trois pages de l’eGuide Prima ont été obtenues par `curl -L -s` avec HTTP 200. Le même accès avec `urllib.request` a répondu 403 ; aucun contenu n’est attribué à cette tentative refusée. Le corps HTML public reçu contenait les paragraphes des objectifs, suivis d’un message d’inscription. Aucun compte, contournement ou contenu additionnel n’a été utilisé.

| Source | Passage exploité | Taille HTML / SHA-256 |
|---|---|---|
| [Ilos, objectif 3 : archives et Vigil](https://www.primagames.com/eguides/mass-effect-pc-eguide/walkthrough/chapter-7-ilos/objective-3-enter-archives-pursue-saren) | VI, barrière, fin des Prothéens, stase, Veilleurs, relais Citadelle, Conduit et fichier de commandes | 53 954 octets · `132808e95d5c609032cbbf6e419eb9e3206418a7a765302aebc4a518d5ded465` |
| [Endgame, objectif 3 : Break the Cycle](https://www.primagames.com/eguides/mass-effect-pc-eguide/walkthrough/chapter-8-endgame/objective-3-break-the-cycle) | Persuasion par talents Charm/Intimidate élevés, doute semé à Virmire ; deux ordres à la flotte ; Ascension et Conseil | 55 544 octets · `1b4381131146575536d623fd98c4926781395075e352e7361f5e4e71f60c232f` |
| [Endgame, objectif 4 : Usher a New Era](https://www.primagames.com/eguides/mass-effect-pc-eguide/walkthrough/chapter-8-endgame/objective-4-usher-a-new-era) | Présence du Conseil selon le secours ; siège humain ; recommandation Anderson ou Udina distincte de cet ordre | 49 073 octets · `738b8653dcdfdc65c75aea275d08425ab773061c73350a702dd0cc3c332dc785` |

L’extrait PDF Prima ancien du dépôt porte seulement le prologue : il ne prouve pas ces trois scènes. La phrase du guide Vigil qui semble associer le Conduit à l’activation directe du grand relais n’est pas reprise : son propre développement distingue ensuite le relais Ilos–Citadelle de l’action manuelle de Saren/Sovereign.

## Descriptions, critères et limites du sous-ensemble

| ID existant | Description couverte et critère vérifiable | Conditions / limite |
|---|---|---|
| `DIA-vigil-histoire` | Un entretien avec Vigil explique la disparition des Prothéens, leur stase, les Veilleurs et le piège de la Citadelle. Deux dossiers spécifiques deviennent visibles seulement après la réception explicite des données. | Campagne ME1, Ilos sécurisé, avant validation du chapitre. Les questions seules ne débloquent rien. Texte réécrit, sans voix ni cinématique originale. |
| `QST-revelation-de-vigil` | Le dialogue distingue Conduit, Citadelle et données de commandes ; le codex se complète après l’échange. | Deux nouveaux dossiers `vigil-reaper-cycle` et `vigil-conduit`. Le dossier historique `vigil` déjà acquis après Ilos reste compatible avec les sauvegardes et tests antérieurs ; il ne prouve pas un échange joué dans ce lot. |
| `QST-choix-de-la-flotte` | L’ordre déjà enregistré conserve deux issues : Ascension/Conseil sauvés ou détruits. Le rapport de fin exporte ce fait distinctement de la nomination humaine. | Le fait dérive de `choices['citadel-finale']` validé ; aucune recomposition future du Conseil n’est déduite. |
| `DIA-epilogue-politique` | Les réactions décrivent le sort du Conseil puis permettent de recommander Anderson ou Udina. Le choix distinct est conservé sans pouvoir être remplacé. | Après la victoire du chapitre final. Quatre combinaisons Conseil/représentant restent possibles ; aucune moralité supplémentaire. |
| `QST-epilogue-politique` | Le bilan et sa sauvegarde concordent sur le Conseil, la nomination et les décisions de campagne. Le dossier importé en Chroniques reste documentaire. | Rapport politique facultatif strictement comparé à la sauvegarde. Un ancien rapport absent reste absent après import, sans nomination inventée. |
| `DIA-saren-final` et `QST-derniere-confrontation` | Référence de la persuasion relevée mais critère encore partiel. | Aucun rang original Charm/Intimidate ni doute persuasif de Virmire n’existe dans le socle. Aucun seuil de points de moralité n’est inventé ; le combat existant reste jouable. Les deux phases originales ne sont pas certifiées. |

`resolveEndgame` conserve uniquement la réception de Vigil et la nomination humaine. Le sort du Conseil vient de l’ordre à la flotte existant. Un champ absent migre vers réception non documentée et nomination inconnue ; un champ présent invalide est refusé avant mutation. Lire l’entretien, le bilan ou la continuité ne donne ni XP, ni crédits, ni médi-gel, ni talent. La mort de Jenkins et le sacrifice de Virmire restent des faits narratifs.

## Vérification de ce lot

Les tests ciblés sont dans `tests/resolve-endgame.test.js` : parcours de tous les nœuds, absence d’effet de lecture, réception unique, codex avant/après, quatre combinaisons politiques, impossibilité de réécriture, vraie sérialisation campagne et export, imports documentaires ME2/ME3, migration historique et refus de rapports contradictoires/accesseurs. Le parcours public et les résultats finaux seront documentés séparément après raccord main, sans réutiliser les preuves historiques.

Le contrôle ciblé courant `node --test tests/resolve-endgame.test.js tests/resolve-virmire.test.js tests/advance-continuity.test.js tests/completion-persistence.test.js tests/story.test.js` passe **74 tests**, dont les quatre groupes du nouveau module. Les rapports facultatifs Novéria, Virmire, origines et enquête de la Citadelle sont comparés aux faits de la sauvegarde validée ; leur absence est conservée. Une fixture d’export déclarée vérifie cette frontière sans prétendre avoir joué ces quatre parcours. Les suites propres aux chapitres vérifient leurs transactions.

Le collecteur `scripts/resolve-endgame-public.mjs` utilise le helper commun `scripts/resolve-browser-proof.mjs`. Le même scénario prépare Ilos, joue réellement l’entretien et consulte le codex, puis prépare deux conclusions et joue les ordres à la flotte avec les nominations Anderson/Udina. Les combats préparés et le franchissement natif du Conduit sont déclarés dans les fixtures. Quatre captures et quatre téléchargements sont prévus ; leur génération et leur revue ne sont pas encore revendiquées ici.

# Commandes manette et navigation DOM

Base de travail : `259d51267a64404048c1e18a1e549f5a356b63c6`. La portée concerne le RPG existant en français, avec sprites HD, décors Three.js et commandes ATB. Elle ne convertit pas les commandes de combat originales de Mass Effect.

## Règles d’entrée

`src/gamepad-controls.js` lit les périphériques exposés par `navigator.getGamepads` avec la correspondance `standard`. Le premier périphérique reconnu conserve la priorité jusqu’à sa déconnexion. Une connexion, une reprise de focus ou un changement de mode exige un échantillon neutre avant tout nouvel ordre : maintenir A ou le stick à travers un écran ne valide pas l’écran suivant.

Le stick gauche et la croix directionnelle fournissent un vecteur de déplacement séparé des touches physiques. La zone morte est radiale ; les diagonales sont normalisées et la gâchette droite demande la course. Le raccord du renderer appartient au parent dans `src/world.js` : retirer une manette ne retire aucune touche physique de `world.keys`.

Dans les menus, la navigation utilise les contrôles DOM visibles et actifs. Le voisin est choisi selon leur géométrie, puis selon un ordre de repli stable ; les contrôles désactivés, cachés ou inertes sont exclus. Le focus est rétabli sur le nouveau nœud possédant le même identifiant ou la même action lorsque le DOM est reconstruit. A active le vrai contrôle ; il n’appelle pas directement une transaction du jeu. Les listes et curseurs utilisent de vrais événements `input` / `change`.

B cherche un retour, une annulation ou une fermeture explicite avant de déléguer au gestionnaire d’écran. Il ne choisit pas arbitrairement une réponse de dialogue irréversible. Start demande la pause. Les boutons d’épaule et le tir rapide sont des raccourcis de campagne ; les commandes et cibles restent accessibles dans le DOM. Le tir rapide existant avec Espace, ainsi que ZQSD, E et 1/2/3, ne sont pas interceptés par ce module.

Les flèches, Entrée et la boucle Tab/Maj+Tab complètent la navigation des menus au clavier. Dans un champ de saisie, les flèches gardent leur rôle natif. Un A maintenu ne répète pas une validation ; les directions possèdent un délai initial puis une répétition bornée, sans accumulation lors d’une image tardive.

Un indicateur intégré au pied de l’écran, au dialogue ou au panneau d’actions suit la dernière méthode d’entrée et le contrôle actif. Il distingue confirmer, saisir du texte et régler une liste ou un curseur. Il ne recouvre pas les boutons. Les repères d’exploration du HUD sont raccordés séparément par le parent au même indicateur de méthode d’entrée.

## Clavier à l’écran

A sur un champ de texte ouvre un panneau propre à l’interface. Les caractères sont préparés dans un brouillon ; Annuler ou B laisse le champ et la partie inchangés. Valider applique le texte au champ encore présent et émet ses événements normaux. Les limites de longueur sont respectées et les nombres sont bornés aux limites du champ. Le panneau tient compte de la largeur et de la hauteur disponibles, avec défilement et focus visible.

Ce clavier permet notamment le nom de Shepard, les noms des emplacements et les recherches. Les dialogues système d’import/export de fichiers restent fournis par le navigateur ou par le système ; le code web ne pilote pas leur sélecteur natif. Une manette sans correspondance `standard`, le retour de force, le remappage libre et un essai matériel physique ne sont pas livrés par ce module.

## Sources de méthode et contrôles

Le guide [`game-ui-ux`, révision épinglée](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md) a été téléchargé et lu pendant cette intervention. Son modèle de focus, de défilement, de changement de périphérique et de respect des limites d’écran est adapté au DOM actuel ; aucun autre moteur n’est introduit.

`tests/gamepad-controls.test.js` couvre quatorze scénarios natifs : neutralité, fronts de boutons, diagonales, répétition, périphériques concurrents, menus bloqués, navigation des grilles, reconstruction du DOM avec ou sans manette, clavier, curseurs/listes, déconnexion/focus, API indisponible et annulation prioritaire d’une transaction et unicité du marqueur de focus après Tab natif. Ces contrôles utilisent un périphérique et un DOM de test ; ils ne sont pas un essai matériel.

`scripts/priority-controls-browser.mjs` prépare le parcours public de création, dialogue, réglages, exports, déplacement/déconnexion et premier combat d’Eden Prime. Il utilise des entrées clavier réelles et un mock explicitement déclaré de l’API Gamepad. Il ne remplace pas l’état de l’application ; sa fixture de combat passe par le véritable import de sauvegarde. Chaque tentative a un préfixe inédit, ses empreintes de sources et ses captures. La présence du script ne constitue pas une exécution : consulter les rapports réellement produits après le gel du parent.

Les fiches de suivi restent partielles jusqu’aux vérifications exécutées. La correspondance matérielle réelle et la couverture de tous les écrans ne sont pas déclarées validées.

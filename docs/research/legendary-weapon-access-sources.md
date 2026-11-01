# Cinq armes ME2 dans la préparation Legendary

Relevé du 1er novembre 2026, depuis `main` au commit `105d03727dc51c6121ed1bd2811b0146d047cbb2`. Les cinq modèles existaient déjà dans les catalogues et dans les profils techniques. Ce chantier ajoute leur sélection fonctionnelle dans **Chroniques → ME2 → Atelier des équipements Legendary Edition**. Il ne crée ni nouvelle fiche Simulation, ni nouveau modèle, ni acquisition de campagne.

## Sources réellement accessibles

| Document EA téléchargé | Observation et portée |
| --- | --- |
| [Page produit Legendary Edition](https://www.ea.com/games/mass-effect/mass-effect-legendary-edition) | HTTP 200. La collection solo inclut plus de 40 DLC, avec armes, armures et packs promotionnels. Cette déclaration est collective ; elle n’énumère pas les cinq modèles. |
| [Gameplay Calibrations](https://www.ea.com/ea-play/news/gameplay-calibrations), « Unifying & Modernizing the Trilogy » | HTTP 200. Les packs d’armes et d’armures sont intégrés à la progression de ME2/ME3 par achats ou recherches, au lieu d’être tous accordés au départ. Aucun marchand, prix, recherche ou déclencheur précis n’est déduit de ce texte. |
| [Produit Mass Effect 2 (2010)](https://www.ea.com/games/mass-effect/mass-effect-2) | HTTP 200. Le produit actuel annonce ses DLC historiques inclus. Ce texte ne remplace pas la preuve de la collection Legendary et ne fournit pas de liste d’armes. |

Le [relevé HTTP](../qa/legendary-weapon-access-reference-report.json) conserve URLs finales, tailles, SHA-256 des réponses téléchargées et limites. Les six pages individuelles Fandom essayées ont répondu **402** ; les chemins EA d’aide classique, FAQ et comparaison essayés ont répondu **404**. Ces réponses ne sont pas présentées comme des vérifications réussies des modèles.

## Identités et liens DLC hérités du catalogue

| Identifiant exact ME2 | Fait et références existants | Préparation ajoutée |
| --- | --- | --- |
| `ME2-WPN-PHALANX` | M-5 Phalanx, pistolet de contenu additionnel ; `ME2-SRC-EA-DLC`. | Legendary uniquement. |
| `ME2-WPN-LOCUST` | M-12 Locust, arme de la mission Kasumi ; `ME2-SRC-LOCUST` et `ME2-SRC-KASUMI`. | Legendary uniquement ; aucune mission Kasumi terminée ou arme obtenue dans le récit. |
| `ME2-WPN-MATTOCK` | M-96 Mattock, fusil de contenu additionnel ; `ME2-SRC-EA-DLC`. | Legendary uniquement. |
| `ME2-WPN-EVISCERATOR` | M-22 Eviscerator, fusil de contenu additionnel ; `ME2-SRC-EA-DLC`. | Legendary uniquement. |
| `ME2-WPN-INCISOR` | M-29 Incisor, fusil de précision additionnel ; `ME2-SRC-EA-DLC`. | Legendary uniquement. |

Ces identités et associations sont celles déjà relevées dans `docs/universe/catalogs/ME2.json`. Les textes EA téléchargés apportent la preuve collective de contenu et d’intégration ; **ils ne constituent pas une nouvelle vérification primaire de chaque modèle**. Les noms de packs particuliers, fabricants, valeurs et chemins d’acquisition ne sont pas ajoutés.

`ME2-WPN-COLLECTOR-RIFLE` reste fermé. Sa notice héritée indique seulement un fusil associé aux Collecteurs avec une référence générique `ME2-SRC-WEAPONS`. Un complément de source reliant explicitement cette occurrence à son contenu ou édition manque dans le périmètre examiné. Les restrictions de spécialisation de Revenant, Claymore et Widow ME2 restent également fermées.

## Comportement effectivement ajouté

La liste des cinq IDs est explicite. Leurs profils portent `requiredEditionProfile: legendary` et seul l’atelier canonique Legendary ME2 les ajoute à ses équipements autorisés. Les autres œuvres, prologues, ateliers, emplacements, personnages et classes gardent leurs contrôles existants. Un indicateur d’édition ajouté dans une sauvegarde ne suffit pas. Le Soldat ME2 ne gagne notamment pas de formation SMG.

Les chargeurs, réserves et tirs sont les budgets de famille **ATB existants**, conservés sans modification : une famille pour chacun des cinq modèles. La sélection atteint la vraie préparation, le combat et l’export/reprise des Chroniques. Les tirs consomment des munitions ; recharger transfère la réserve et ne crée aucune munition. La collection propose désormais **105 profils supportés : 77 armes, 25 armures et trois familles de modules**. Ce ne sont pas cinq armes nouvelles dans les œuvres originales.

Les consultations historiques de Simulation conservent leur fermeture. Leur motif hérité mentionne désormais l’atelier Legendary requis plutôt qu’une édition non configurée ; il ne prépare pas cet atelier ni ne remplace leur profil fermé. Les 25 essais conservent leurs groupes par défaut et leurs adversaires ; les anciens choix restent présents dans le même ordre, avec cinq choix ajoutés à ce seul atelier.

Les capacités originales des chargeurs, cadence, rafales, dispersion, recul, précision, rangs, prix, acquisitions, géométrie, sons et animations restent incomplets. **Aucune fidélité intégrale 1:1 n’est certifiée.** Le [rapport natif](../qa/legendary-weapon-access-native-report.json) sépare les nouveaux ordres, les résultats historiques conservés et les tests techniques ; la revue navigateur et le build ont leurs propres preuves de livraison.

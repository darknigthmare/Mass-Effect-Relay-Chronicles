# Armax — lot 10 : quatre stages, six PNG conservés

**Quatre fonds de stage manquants du catalogue lot 09 sont illustrés.** Les quatre identités `category/name/work/dlc/variant` sont conservées exactement ; les cadrages produits sont précisés dans `producedSubzone`. Les six appels au générateur intégré ont réussi : quatre masters sélectionnés et deux R0 conservés pour tracer les corrections. Aucun refus et aucune erreur technique.

Base de continuation : `9321b4f77d8f857d8c40265c0fca70e03121a4ea`. Date : 20 novembre 2026. Tous les fichiers restent au statut **Prototype**. La fidélité 1:1, la jouabilité, les collisions, la caméra de duel et l’intégration au moteur ne sont pas validées.

## Masters retenus

| Identité du catalogue | Sous-zone et cadrage produits | PNG original | Dimensions |
|---|---|---|---:|
| **Omega — réacteur** · ME3 · Omega · Installation sous occupation | Face centrale du réacteur ; plateforme, deux escaliers, piliers et puits latéraux existants | [omega-me3-reactor-master.png](../../../public/assets/armax/lot10/stages/omega-me3-reactor-master.png) | 2172 × 724 |
| **Bekenstein — propriété de Hock** · ME2 · Kasumi: Stolen Memory · Extérieur de la réception | Balcon arrière avec bassin, auvent et panorama, figure 007 du guide Prima | [bekenstein-me2-hock-terrace-master.png](../../../public/assets/armax/lot10/stages/bekenstein-me2-hock-terrace-master.png) | 1586 × 992 |
| **Eden Prime — spatioport** · ME1 · Plateforme de la balise | Plateforme finale sous le ciel rouge de ME1 original ; balise à droite, partiellement hors cadre comme dans la capture | [eden-prime-me1-beacon-platform-master.png](../../../public/assets/armax/lot10/stages/eden-prime-me1-beacon-platform-master.png) | 1654 × 951 |
| **Citadelle — tour du Conseil** · ME1 · Chambre du Conseil | Vue oblique du balcon proche droit, sol vitré et arbres sous le vitrage | [citadel-me1-council-chamber-master.png](../../../public/assets/armax/lot10/stages/citadel-me1-council-chamber-master.png) | 1654 × 951 |

La géométrie et le point de vue des références ont priorité sur l’ajout d’une voie de combat. Omega conserve ses puits et ses marches ; Hock conserve son bassin ; le Conseil conserve ses niveaux et son balcon restreint. **Aucun pont ou plancher de duel n’a été ajouté pour masquer ces contraintes.** Eden Prime présente déjà une surface dégagée dans la capture, mais ses collisions et son usage en combat restent à définir.

## Références et attribution

Les captures tierces restent hors dépôt. Leurs URLs, auteurs ou éditeurs, dimensions, SHA-256, rôles et limites sont conservés dans la [bibliothèque de références des stages](stages-reference-library.json), puis fusionnés dans la bibliothèque consolidée du lot.

- **Omega :** [Scotty Brown — Mass Effect 3](https://scottyartist.artstation.com/projects/ROaaE), deux vues de production. La vue frontale 3 fixe la composition ; la vue oblique 4 confirme les formes. Le [billet BioWare sur Omega](https://blog.bioware.com/2012/11/30/dev-blog-creating-the-mass-effect-3-omega-dlc/) documente le DLC. Les vues ne fournissent pas de géométrie 3D ni de calques séparés pour les champs de confinement.
- **Hock, master retenu :** [Prima Games — Kasumi’s Loyalty: Stealing Memory](https://primagames.com/eguides/mass-effect-2-eguide/walkthrough/walkthrough/kasumis-loyalty-stealing-memory), figure **007**. Le guide identifie explicitement ce côté du balcon extérieur, son datapad et le panorama. La capture de 700 × 438 pixels fixe la sous-zone et les grands repères ; les détails de skyline, les reflets et les bordures du bassin restent à comparer dans le jeu.
- **Eden Prime :** [Michael Monette / SuperCheats — Prologue](https://www.supercheats.com/guides/mass-effect/prologue), capture « Prothean Beacon » de ME1 original. Sa définition est de 996 × 572 pixels. Le ciel rouge, le tablier métallique et le cadrage ne sont pas remplacés par l’ambiance de From Ashes ou par celle du remaster.
- **Conseil :** [Michael Monette / SuperCheats — Citadel](https://www.supercheats.com/guides/mass-effect/citadel), capture « Council Chamber » après la promotion Spectre. La vue de 996 × 572 pixels documente les grands volumes ; le feuillage, le vitrage et les petits détails reconstruits ne peuvent pas être certifiés à cette définition.
- **Contrôle du HUD sur Eden :** [AJ / The Games Journals — Eden Prime](https://www.thegamesjournals.com/blog/mass-effect-1-eden-prime), capture de la balise en cinématique hors ciblage. Cette vue de Legendary Edition sert uniquement à vérifier l’absence physique des arcs de ciblage. Elle n’a pas été fournie au générateur et ne gouverne ni la palette ni l’architecture du master original ME1.

## Corrections et R0 conservés

| Sujet | R0 conservé | Motif de non-sélection | Correction retenue |
|---|---|---|---|
| Hock | [bekenstein-me2-hock-hall-r0.png](../../../public/assets/armax/lot10/stages/bekenstein-me2-hock-hall-r0.png), 1928 × 815 | Le [portfolio primaire de Don Arceta](https://donarceta.artstation.com/projects/8P9wx) montre le hall à deux escaliers. Ce hall ne répond pas à la variante « Extérieur de la réception ». | Nouvelle génération référencée sur le balcon exact de la figure 007 Prima. L’identité du catalogue reste inchangée. |
| Eden Prime | [eden-prime-me1-beacon-platform-r0.png](../../../public/assets/armax/lot10/stages/eden-prime-me1-beacon-platform-r0.png), 1654 × 951 | Deux arcs cyan du marqueur d’interaction avaient été interprétés comme une lumière physique de la balise. La revue indépendante les a repérés. | Édition localisée du R0 pour retirer les deux arcs et leur lueur immédiate ; cadrage, structure de la balise et éclairage général conservés visuellement. |

Ces corrections sont des reprises de qualité et d’identification de sous-zone, sans refus de génération. Les R0 et les masters gardent leurs octets d’origine ; aucun fichier n’a été redimensionné, recadré ou retouché hors du générateur.

## Contrôle et limites

Les six PNG ont été décodés et leurs dimensions, modes RGB, tailles et SHA-256 comparés aux originaux produits. Les quatre identités du catalogue parent ont été vérifiées. Les références ont été inspectées avant leur utilisation. Le [rapport de vérification](stages-verification.json) distingue ces contrôles techniques de l’examen visuel et de la revue indépendante.

Les grands repères restent reconnaissables, mais les petits panneaux, câbles, feuillages, formes lointaines et surfaces masquées par les personnages ont été reconstruits. La balise d’Eden est partiellement coupée par le cadre source et son modèle complet reste à valider. Aucun relevé orthographique, modèle 3D, test de collision ou rendu dans le moteur n’a été réalisé dans ce lot.

**Les quatre masters sont des fonds statiques opaques.** Aucun calque de parallaxe séparé, état animé, effet autonome, collision ou intégration moteur n’est livré. Le statut reste Prototype et les deux champs de validation de fidélité restent faux.

## Fichiers de production

- [Manifeste des stages](stages-manifest.json) : sélection, versions conservées, identités, provenance, hashes et réserves par image.
- [Prompts complets](stages-generation-prompts.json) : les six appels et leurs références exactes.
- [Journal des tentatives](stages-attempts.json) : six réussites, quatre masters, deux corrections et aucune erreur ou refus.
- [Bibliothèque de références](stages-reference-library.json) : six définitions de sources et sept captures inspectées, dont une de contrôle sans génération.
- [Vérification](stages-verification.json) : contrôle des six PNG, conservation des originaux et limites visuelles.

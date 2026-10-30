# Développement de Mass Effect — Relay Chronicles

## Point de départ

- Lire `README.md`, puis `docs/GAMEDEV_GUIDANCE.md` et la documentation du système modifié.
- Identifier la branche, le commit de départ et les changements en cours avant de modifier des fichiers. Préserver le travail existant et livrer les changements dans une PR selon le suivi du projet.
- Vérifier les versions dans `package.json` et `package-lock.json`. Le socle observé lors de l'introduction de ce guide est JavaScript ESM, Three.js **0.180.0**, Vite **7.3.7**, Electron **45.0.0**, Node **22.12+** ; la CI utilise Node 24.
- Conserver le moteur et les dépendances du projet. Une migration est un chantier distinct. Les exemples Three.js r186 du catalogue externe doivent être adaptés aux API r180 présentes.

## Sélection des guides

Les références de `gamedev-skills/awesome-gamedev-agent-skills` sont épinglées dans `docs/gamedev-sources.json`. Lire le guide correspondant à la tâche et ses références utiles avant de l'appliquer ; utiliser la matrice de `docs/GAMEDEV_GUIDANCE.md`. Le routeur sert à sélectionner un petit ensemble pertinent, pas à charger tout le catalogue à chaque intervention.

Les guides sont des références de méthode. Les instructions du projet et les demandes de l'utilisateur définissent le périmètre. Les exemples d'autres moteurs ne doivent pas introduire une nouvelle dépendance ou remplacer un système existant sans besoin du chantier. Si une référence externe est inaccessible, indiquer cette limite et travailler à partir du code et du guide local ; ne pas prétendre l'avoir consultée.

## Identité et invariants

- Préserver le RPG en français : sprites 2D HD dans des décors 3D, mise en scène JRPG, groupe de trois et commandes ATB. La référence PlayStation ne signifie pas une conversion automatique en pixel art ; voir `docs/ART_BRIEFS.md`.
- Rendu actuel : Three.js WebGL, caméra orthographique et interface DOM/CSS. Les sprites restent dans ce renderer. Respecter échelle, ancrage des pieds, cadrages UV, alpha, filtrage et direction des animations existants.
- Personnalisation : les retouches restent dans un brouillon ; appliquer valide les **neuf emplacements** ensemble contre l'inventaire courant. Annuler laisse l'état intact. Respecter restrictions, disponibilité, restitution des modules et exception `legacyArmor` limitée à la pièce concernée.
- Calculer les bonus à partir des statistiques de base et du matériel réellement équipé. Une ouverture de menu, un changement d'apparence ou un rechargement ne doit pas cumuler des bonus ni créer d'objets, de crédits ou de pouvoirs.
- Préserver les sauvegardes existantes et leurs migrations. Distinguer champ ancien absent et champ présent invalide. Garder sauvegarde automatique et emplacements manuels séparés ; un import refusé conserve la partie courante.
- Garder les décisions, conditions de recrutement, décès narratifs et récompenses uniques cohérents après reprise. Un KO de combat et une mort scénaristique sont des états différents.
- Conserver l'isolation des Chroniques par œuvre/période et celle de la campagne ME1. Une fiche consultable, un exercice partiel, un équipement fonctionnel et un asset visuel complet ne sont pas le même livrable.

## Catalogue, assets et preuves

- Mettre à jour la source du suivi concerné, puis son export : catalogue principal `docs/content-catalog.json`, catalogues des œuvres `docs/universe/catalogs/`, ou données et classeurs des lots Simulation. Identifier le bon pipeline dans le guide avant de générer.
- Préserver les identifiants, les références d'opus/période, les dépendances et les réserves de fidélité. Ne pas réutiliser les anciens scripts `update-customization-*` comme générateurs courants sans vérifier leurs hypothèses.
- Réutiliser les statuts existants. Une génération d'image, un fichier présent ou un test technique réussi ne suffit pas à passer une fiche à `Validé`. Documenter séparément : contrôles techniques, revue à taille réelle, revue en jeu et comparaison aux références.
- `audit:fidelity` vérifie des déclarations et des fichiers ; il ne certifie pas l'exhaustivité ni la fidélité artistique. Une illustration de concept ne sert pas de preuve de scène jouable.
- Conserver les rapports historiques avec leur périmètre. Une nouvelle vérification précise ses sources/commit, conditions, commande, résultat et limites ; ne pas recycler un résultat ancien comme preuve du changement courant.

## Vérification et livraison

- Choisir les contrôles adaptés au risque à partir de la matrice du guide. Pour un changement exécutable, lancer les tests pertinents et le build ; compléter par le parcours utilisateur concerné. Pour une modification documentaire seule, vérifier chemins, liens, versions et commandes, sans inventer de validation de gameplay.
- Les scripts navigateur demandent leur serveur, Playwright et Chromium ; les générateurs Excel ont leurs propres prérequis. Lire les paramètres du script avant exécution. Une commande définie dans `package.json` n'est pas une preuve qu'elle a été exécutée.
- Garder le mode QA réservé au développement. Vérifier le build de production quand ce mécanisme est modifié ; ne pas exposer `__RELAY_TEST__` aux joueurs.
- Toute optimisation commence par une mesure reproductible. Les gains de FPS, la compatibilité Windows, la navigation manette et les performances sur téléphone doivent être qualifiés selon les essais réellement faits.
- Décrire dans la PR le problème, le changement, le parcours vérifié, la mise à jour éventuelle du suivi et les limites restantes. Utiliser `.github/pull_request_template.md` sans cocher des contrôles non exécutés.

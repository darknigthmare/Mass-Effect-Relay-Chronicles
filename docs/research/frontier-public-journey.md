# Parcours public du lot Frontières

Le script `scripts/frontier-public.mjs` utilise les commandes publiques du jeu dans Chromium. Il ne demande pas `?qa`, refuse la présence de `window.__RELAY_TEST__`, ne lit pas le magasin interne du jeu et n'injecte ni scène ni état par JavaScript dans le navigateur. Les observations JavaScript du navigateur se limitent au DOM public, aux ressources et à l'absence de l'interface de test.

## Exécution

Le serveur doit être démarré séparément. Attendre le gel des fichiers du jeu avant la collecte ; leurs empreintes sont contrôlées à la fin. Chaque essai demande un préfixe inédit et refuse d'écraser un rapport existant.

```bash
FRONTIER_QA_MODE=dev \
FRONTIER_QA_PREFIX=frontier-public-dev-03 \
GAME_URL=http://127.0.0.1:4173 \
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium \
node scripts/frontier-public.mjs
```

Après compilation finale et démarrage du serveur de `dist`, utiliser `FRONTIER_QA_MODE=production`, une nouvelle URL et un nouveau préfixe, par exemple `frontier-public-production-01`. Le mode production compare aussi les fichiers servis à leurs empreintes dans `dist`, exige l'absence de requêtes `/src/`, `/@vite/` ou `/@fs/`, puis vérifie que `dist` reste inchangé. Le script ne construit pas le jeu et ne démarre pas de serveur.

Les rapports et sauvegardes sont écrits dans `docs/qa/`, les captures dans `docs/screenshots/`, avec le même préfixe. Un échec conserve son rapport, ses fixtures, ses exports et la capture du point d'arrêt ; le prochain essai utilise un autre préfixe.

## Progression préparée et actions réellement jouées

Quatre sauvegardes JSON sont créées en Node avec les fonctions existantes `newGame`, `recordVisit`, `winEncounter`, `recruit`, `completeZone`, `encodeSave` et `decodeSave`. Elles préparent le Mako de Thérum, la première formation de Thérum, Parasini à Port Hanshan et la carte de Virmire. Les coordonnées et empreintes figurent dans le rapport. Le navigateur les importe par le véritable sélecteur de fichiers du bouton **Importer**.

La progression antérieure d'Eden Prime et de la Citadelle, ainsi que les deux missions supplémentaires nécessaires à l'ouverture de Virmire, sont **préparées**. Le script ne les présente pas comme des victoires jouées pendant ce parcours. Aucune modification artificielle de statistiques ou d'inventaire n'est nécessaire.

Le parcours joue ensuite :

1. Approche du Mako depuis la fixture, embarquement avec E, déplacement au clavier et accélération Maj. Le déplacement est constaté sur le radar public. L'attente est bornée et porte sur un changement visible du DOM, sans avancer l'horloge du jeu ; elle ne mesure pas les performances ou les vitesses canoniques.
2. Pause, deux vrais exports séparés par une direction maintenue, comparaison des positions et de l'état normal, sortie avec E.
3. Import de l'export effectué à bord, reprise à pied, véritable rechargement de page et bouton **Reprendre**, puis nouvel export comparé. Aucun champ de véhicule transitoire ne doit apparaître dans les sauvegardes.
4. Cartes locales de Thérum, Novéria et Virmire à 1280 × 800 puis 390 × 844 : cinq secteurs, routes et marqueurs réellement présents dans les SVG publics.
5. Contact de Gianna Parasini, sujet d'accueil de Port Hanshan, retour et clôture du dialogue ; l'export confirme le sujet entendu sans récompense, achat ni progression de mission.
6. Première formation de Thérum, avec drone de reconnaissance et lance-roquettes geth. Un acteur naturellement prêt reçoit un ordre de tir par les boutons publics acteur/action/cible. La consommation de sa jauge ATB et le journal sont observés. Aucune victoire ni récompense de cette rencontre n'est revendiquée.
7. Direction et accélération simultanées sur les boutons mobiles visibles, au moyen de vrais événements tactiles Chromium, puis sortie par le bouton d'interaction. Ce viewport n'est pas un téléphone physique.

## Premiers essais conservés

- `frontier-public-dev-01` : embarquement réussi, arrêt sur une attente fixe de 724 ms qui n'avait pas encore produit de déplacement visible du radar sous le rendu logiciel. L'essai suivant attend le déplacement public avec une limite de temps.
- `frontier-public-dev-02` : parcours Mako complet réussi, dont pause, sortie et vrai import/rechargement à pied ; carte Thérum ouverte sur les deux tailles. Le test attendait ensuite la bande du groupe, intentionnellement masquée par le CSS mobile. La capture montre le jeu correctement revenu à l'exploration. L'attente a été corrigée vers le titre de lieu public. Les fichiers monde ont aussi changé pendant cette période ; cet essai intermédiaire ne remplace pas le contrôle final des empreintes.

Le rapport final et la revue du lot doivent rester distincts de ces tentatives, du rapport technique des images et de la comparaison canonique. Aucun de ces contrôles ne certifie une reconstitution intégrale 1:1 de Mass Effect.

## Collecte DEV03

Le [rapport brut DEV03](../qa/frontier-public-dev-03-report.json) contient **7 contrôles fonctionnels réussis, 7 exports réels, 1 ordre ATB joué et 17 captures**, avec zéro erreur de page, requête échouée ou erreur de preuve. Il conserve toutefois `passed:false` : son dernier contrôle détecte le changement de `world.js` de `d5715efd8177ad71fffe0d107506b2046074a3deb6ac589cf16b14db6d784601` vers `2a17bdbe81eb46bccb05df0597e00df9a74b37ed746a9a73687ff69ebe5d6b1c`.

Le [contrôle séparé de la modification d'Ilos](../qa/frontier-ilos-delta-report.json) établit la portée de cette différence ; il ne réécrit ni le résultat brut ni son empreinte de départ. La [revue visuelle des 17 captures](../qa/frontier-public-dev-03-visual-review.json) confirme leur ouverture réelle et leurs empreintes, en précisant les toasts mobiles et les contenus défilants. Cette collecte de développement ne remplace pas le parcours de production sur le `dist` final.

# Personnalisation — critères restants du lot Continuation

Référence de départ : `5d933068cacd1b595d584b7cedfffd35b1db362d`.
Cette revue conserve les acceptations du catalogue principal. Elle vise les
fonctions de l’atelier de Relay Chronicles : portrait SVG de conception, palette
du sprite existant, inventaire ME1 à neuf ports et sauvegardes de campagne.

Les références déjà associées aux fiches restent celles de
[`customization-sources.md`](customization-sources.md). Aucun nouveau contrôle
de fidélité d’un modèle officiel, de sa morphologie 3D ou de ses animations
n’est déduit de ce lot fonctionnel. Aucun statut d’asset n’est modifié. Les
modules et armures restent des objets existants de l’inventaire ; les couleurs,
motifs, finitions et retouches en campagne restent des extensions de
l’adaptation, explicitement annoncées dans l’atelier.

Le collecteur [`continuation-customization-public.mjs`](../../scripts/continuation-customization-public.mjs)
importe des fixtures déclarées par le sélecteur public. Leurs crédits, XP et
objets sont préparés en Node ; aucune acquisition par le parcours de campagne
n’est prétendue. Il utilise les vrais boutons, touches, aperçus SVG/canvas et
fichiers exportés. Il n’accède ni à l’état privé du jeu, ni au stockage du
navigateur, ni à l’observateur QA ; il n’injecte aucun DOM, CSS ou changement
d’horloge.

Les nouveaux contrôles natifs de
[`continuation-customization.test.js`](../../tests/continuation-customization.test.js)
complètent les tests existants : réversibilité de chaque préréglage, couleurs
effectivement présentes dans le SVG, indépendance coiffure/couleur, refus de
chaque identifiant facial inconnu et refus d’accesseurs imbriqués dans les
marqueurs de changement d’équipement. La suite globale fraîche du parent
réexécute aussi les transactions, la restitution des modules, la migration,
les accès hostiles ordinaires, les six manuels et les multiplicateurs.
L’introspection d’un Proxy JavaScript hostile peut exécuter ses traps ; cette
limite ne constitue pas une exécution de getter d’un objet de données ordinaire.

Les parcours publics comparent les exports complets avant/après annulation,
application et rechargement. Seuls la position reconstruite par le monde et le
temps de jeu écoulé sont écartés de ces comparaisons de navigateur. Apparence,
neuf ports, quantités, stock marchand, attributions de Kaidan, crédits, XP,
dossier, quêtes et drapeaux restent comparés. Les projections de l’écran sont
contrôlées avec `actorFor`, le même calcul que l’écran Équipement.

Les fiches de choix de Shepard conservent leur périmètre exact : l’origine
stable dans les sauvegardes et l’impossibilité pour un module de soldat
d’accorder de la biotique. Les missions originales propres aux origines
restent à produire ; les tests du dossier et de la persistance ne les réalisent
pas. Les références et réserves historiques des fiches restent conservées.

Les rapports portent des préfixes nouveaux `continuation-customization-*`.
Les rapports `completion-persistence-*` et les anciennes livraisons de
personnalisation demeurent historiques. Les captures nouvelles doivent être
réellement ouvertes et reliées à leur revue avant une proposition complète.
Les vérifications DEV et du build compilé sont conservées séparément.

Le [natif global frais](../qa/continuation-integration-final-01-report.json)
passe **1 106/1 106**, dont les quatre nouveaux tests ciblés. Le
[parcours DEV03](../qa/continuation-customization-dev-final-03-report.json)
passe sept groupes, avec quatorze exports, sept fixtures déclarées et
[treize captures réellement ouvertes](../qa/continuation-customization-dev-final-03-visual-review.json).
La [proposition ciblée](../qa/continuation-customization-tracking.json) évalue
vingt-six critères fonctionnels ; la production compilée reste une étape
distincte. L’origine de Shepard reste hors de ces fermetures, car sa mission
propre n’est pas réalisée.

DEV01 conserve son échec de collecteur : la comparaison ne traitait pas la
valeur neutre d’un multiplicateur absent du calcul d’acteur. L’oracle corrigé
reprend le défaut public de l’écran (un pour les multiplicateurs, zéro pour les
valeurs additives). Le prévol DEV02 a échoué avant lancement de Chromium lors
de la lecture du chemin du collecteur ; DEV03 utilise un objet URL correct.
Ces tentatives ne sont pas des gates produit réussies et aucun changement du
jeu n’a été nécessaire. Les guides de méthode `router`, `game-ui-ux`, `rpg` et
`save-systems`, ainsi que leurs références pertinentes de disposition,
statistiques et migration, ont été consultés à la révision épinglée du projet.

Le [parcours compilé PROD02](../qa/continuation-customization-production-final-02-report.json)
passe les mêmes sept groupes, avec quatorze exports, sept fixtures déclarées
et [treize nouvelles captures réellement ouvertes après fermeture du navigateur](../qa/continuation-customization-production-final-02-visual-review.json).
Les sources strictes, registre généré compris, et les **92 fichiers de dist**
restent identiques entre le début et la fin de la collecte. Les six réponses
JavaScript/CSS effectivement chargées, rechargement compris, correspondent aux
octets du build ; aucune requête vers les sources de développement, erreur
JavaScript ou autre erreur console bloquante n’est observée.

Le [premier passage de production](../qa/continuation-customization-production-final-01-report.json)
et sa [revue négative de treize captures](../qa/continuation-customization-production-final-01-visual-review.json)
restent intacts : les fonctions passaient, mais le collecteur refusait deux
erreurs réseau de favicon avant ses contrôles finaux de gel. La variante
[`continuation-customization-production-v2.mjs`](../../scripts/continuation-customization-production-v2.mjs)
conserve les scénarios et oracles et lie ses empreintes au DEV03 et au PROD01.
Elle classe seulement la paire exacte URL `/favicon.ico` et message réseau
`404 (Not Found)` comme avertissement de ressource optionnelle du navigateur.
PROD02 en conserve **trois occurrences brutes**, toutes identiques à cette
politique ; toutes les autres erreurs restent bloquantes. Aucun produit,
ancien collecteur, rapport brut, proposition figée ou statut d’asset n’a été
modifié pour obtenir cette nouvelle vérification complète.

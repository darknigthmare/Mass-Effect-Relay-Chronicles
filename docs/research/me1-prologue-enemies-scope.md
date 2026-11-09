# Jenkins et deux familles d’ennemis ME1

Base de reprise : `d19197ff43facd066abcc6ff4611e0ce0148609b`, dernier `main` récupéré pour ce travail. Les deux commits suivants à notre dernière livraison concernent les outils IA ; aucun nouveau classeur ou document de bible distinct n’est présent dans ce diff. `docs/DESIGN.md` est le document de conception conservé et synchronisé. Les nouvelles intégrations IA restent disponibles selon `.ai-tools/README.md` ; le diagnostic local n’atteste pas de plugin chargé.

## Périmètre

- Produire et intégrer quatre dessins de combat pour Jenkins, le creeper du Thorien et le commando asari générique, à partir des silhouettes de prototype et des conventions existantes.
- Conserver les actions, statistiques, identifiants et conditions de présence actuels. Le geste de Jenkins n’ajoute pas de biotique. Sa mort scénaristique, après la première victoire d’Eden dans la campagne condensée, demeure persistante et distincte du KO.
- Corriger l’occlusion des combattants par la rangée de piliers côté caméra à Novéria et les poteaux de premier plan à Féros, avec géométrie d’exploration et collisions conservées.
- Synchroniser les fiches existantes, l’Excel et la conception. Les fiches du clone asari du Thorien restent distinctes : un dessin générique ne produit pas leurs phases.

## Critères de livraison

1. Les trois PNG sont des copies des sorties natives, sans retouche. L’alpha, les rectangles, pivots, proportions et marges sont mesurés et réellement relus ; la présence d’un fichier ne constitue pas une validation artistique.
2. Les douze états sont inspectés sur le renderer réel. Les identités, équipes et contextes étrangers restent fermés ; les actions natives ne changent ni la partie sauvegardée ni leurs règles pour les besoins d’une capture.
3. Les contrôles publics distinguent les parties préparées des victoires réellement jouées. Les reprises conservent les états et les récompenses uniques. Le build de production ne fournit aucun observateur de développement aux joueurs.
4. Les corrections de Novéria et Féros sont comparées à leurs vues avant coupe ; les structures reviennent en exploration.
5. Seules les deux fiches SPR ennemies peuvent passer de Défini à Prototype après les preuves natives et en jeu. Les autres statuts, les fiches non touchées et les structures du classeur sont conservés ; les panneaux modifiés sont ouverts et relus.

Le catalogue, ses exports et les [preuves finales](../qa/me1-prologue-enemies-report.json) donnent le résultat réel. Quatre poses fixes ne fournissent pas de cycles complets, de vues supplémentaires, d’équipement géométrique exact ou de certification originale 1:1. Les campagnes ultérieures, les véhicules pilotables et les autres manquants restent des chantiers distincts.

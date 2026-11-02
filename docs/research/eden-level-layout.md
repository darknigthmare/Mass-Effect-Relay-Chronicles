# Eden Prime — parcours spatial du 2 novembre 2026

Le niveau précédent utilisait la même enveloppe rectangulaire de 40 × 42 unités et les mêmes sept coordonnées que les autres expéditions. Son sol visible était une boîte de 54 × 58 unités ; la caméra suivait environ la moitié du déplacement, puis restait bornée à ±9/10 unités. Agrandir ce seul rectangle n’aurait pas créé un parcours plus immersif.

Le [nouveau plan](../../src/level-layout-data.js) compose cinq clairières polygonales, un chemin principal brisé, une boucle vers le ravitaillement et un retour par l’ouest. Les zones hors de cette union ne sont pas marchables. Les [données de monde](../../src/world-data.js) conservent les sept identifiants et types de points de mission, mais déplacent leurs coordonnées. Les autres cartes conservent leur plan précédent. La caméra, l’habillage, les collisions et les trajets réels sont vérifiés séparément dans le renderer.

| Élément | Valeur de production |
|---|---|
| Enveloppe du plan | 110 × 150 unités de monde |
| Clairières | Largage, patrouille, ferme, quais et balise |
| Largeur du chemin principal | 8 unités |
| Largeur de la boucle ravitaillement | 7 unités |
| Largeur du retour ouest | 6 unités |
| Longueur des lignes centrales | Principal 162,70 ; ravitaillement 51,68 ; retour 124,77 |
| Masque au pas de 0,75, marge de 0,4 | 10 905 cellules, environ 6 134 unités² avant collisions de décor |

La surface théorique du masque représente environ 3,65 fois l’ancien rectangle de navigation. L’enveloppe représente 9,82 fois sa surface, mais elle contient de larges vides non traversables. Ces deux mesures ne sont pas interchangeables. Les collisions de l’habillage peuvent réduire la surface finale ; le rapport du renderer délimite le parcours réellement vérifié. Le controller conserve une marche de 4,35 unités/s et une course de 6,6 unités/s. Le chemin principal représente environ 37,4 secondes de déplacement théorique continu à la marche, hors détours, interactions, pauses et combats.

La progression utilise toujours les mêmes trois rencontres, le même cache, les mêmes conditions de mission et les mêmes récompenses uniques. Le retour de fin de mission passe toujours par le dialogue existant vers le Normandy. Les trois arènes sont proches des rencontres ; un premier combat ne doit pas déplacer la caméra jusqu’à la dernière plateforme.

## Références et limite de fidélité

Le [guide Prima officiel du prologue](https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf) est disponible sous forme d’un PDF de 23 pages, SHA-256 `dbef65537b3ab6dc7dbcc2d8f4f9ae2f7e4eaa99d47f1d1a2831d7b213e5f8c2`. Son texte des pages PDF 9 à 16 a été relu : largage, rencontre d’Ashley et ferme, fouille, camp scientifique, quais et train de fret, spatioport et balise y sont décrits. Les neuf repères de production du catalogue donnent les références de travail correspondantes.

Ces repères ne suffisent pas à certifier la géométrie, les distances, les orientations ou toutes les adjacences du jeu original. Les cinq clairières condensent ces étapes dans un parcours original de l’adaptation. La présence de silhouettes de quais ou de fret ne crée pas un voyage en train, de nouveaux survivants interactifs, un système de désamorçage ou un chronomètre. Aucune fidélité géographique 1:1 ni réalisation complète des neuf sous-zones du catalogue n’est annoncée.

## Navigation et anciennes sauvegardes

`isLevelGround` vérifie le masque polygonal et les corridors, avec une marge. Le renderer ajoute ses collisions de décor. `nearestLevelGround` conserve un point encore valide et projette un ancien point devenu inaccessible vers un point du nouveau sol ; la résolution finale doit aussi vérifier les collisions réelles. Le format de sauvegarde, les drapeaux, l’inventaire et les récompenses restent distincts de ce repositionnement.

Les [tests du plan](../../tests/level-layout.test.js) vérifient la stabilité des identifiants, les ouvertures des corridors, la connectivité de la grille à pas 0,75 sans couper les coins, la projection de positions héritées et l’absence de gain de progression par déplacement. Les images avant/après et les contrôles du renderer complètent ces tests purs.

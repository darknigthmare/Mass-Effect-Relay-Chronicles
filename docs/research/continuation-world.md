# Sol, escaliers et cadrage — continuation

Socle : `5d933068cacd1b595d584b7cedfffd35b1db362d`. Le lot conserve les
sprites 2D HD, Three.js 0.180.0, la caméra orthographique et le combat ATB.
Les guides `level-design`, `camera-systems` et `threejs-scene-setup` sont ceux
épinglés dans `docs/gamedev-sources.json`, révision
`19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`.

## Défauts corrigés

Les groupes de personnages restaient à la hauteur zéro, même sur la plateforme
du Conseil déjà présente. Quatre marches basses relient désormais l’allée à
cette plateforme, dans la Citadelle et sa variante finale. Les maillages réels
de l’allée, des marches et du palier sont enregistrés comme supports. La
hauteur vient de leurs triangles transformés dans le monde, après fusion des
autres décors. Les supports sont conservés séparément et remplacés à chaque
chargement de zone. Le pont central du Normandy utilise le même mécanisme.

Chaque membre du groupe et chaque PNJ échantillonne le sol à sa propre
position. Les combattants utilisent aussi ce support ; une élévation biotique
s’ajoute à sa hauteur, tandis que l’ombre de contact reste sur le support.
Seuls les maillages explicitement enregistrés participent : un toit, un mur,
une console ou une poutre ne peut pas devenir un étage praticable par accident.
Les autres zones conservent leur plan de référence existant.

Les placements de zone sans grand plan initialisaient le cadrage avec un
facteur de 0,42, puis le suivi courant utilisait 0,48. L’entrée et la reprise
utilisent maintenant la même fonction de cadrage que les frames suivantes.
Le suivi exponentiel et ses limites restent inchangés. Les tests examinent
l’arrêt sur les deux côtés du seuil x = ±18,75, avec trois pas temporels,
et vérifient une convergence sans dépassement ni inversion.

## Occlusion

Les corps existants utilisent déjà le test et l’écriture de profondeur, avec
un seuil alpha. Aucun affichage systématique au travers des murs n’a été
ajouté. Le test indépendant place un mur opaque de part et d’autre du même
corps réel et contrôle l’ordre géométrique des fragments. Le parcours public
prévoit aussi une traversée devant la silhouette d’un pilier réel.

Les éléments de décor qui s’effacent déjà en vue tactique gardent leur règle
de lisibilité. Une interface de repérage à travers le décor ne doit pas être
confondue avec le corps d’un personnage. La vérification vise le masquage des
sprites par une structure effectivement opaque et visible.

## Vérifications et limites

`node --test tests/continuation-world.test.js tests/*world.test.js` passe
81 tests, dont cinq nouveaux cas indépendants. Ils exécutent les vraies
méthodes de construction, fusion, placement et mise à jour ; seules les
frontières sans navigateur (images, canvas, textes et soumission WebGL) sont
substituées. Les cas de sol utilisent aussi une géométrie indépendante inclinée
et transformée pour éviter de vérifier seulement les constantes de l’escalier.

`scripts/continuation-world-public.mjs` utilise des sauvegardes préparées et
déclarées, importées avec le sélecteur public. Il parcourt les marches au
clavier, franchit le seuil de caméra, passe derrière un pilier et vérifie le
repli réel d’Eden. Les jauges s’y remplissent naturellement. Le retour au
contact doit être refusé avant la fin du délai, rester refusé après plus de
neuf secondes de menu, puis devenir possible après le temps de terrain restant.
Le collecteur n’écrit pas dans l’état du jeu, ne modifie pas ses horloges,
n’appelle pas le harness QA et ne force pas la cadence.

Les captures et rapports de ce parcours ne constituent une preuve qu’une fois
exécutés et relus. Leurs préfixes `continuation-world-*` distinguent toutes les
tentatives des preuves historiques. Les escaliers et leurs dimensions sont
une adaptation locale ; aucun relevé du plan original, fidélité artistique
intégrale, mesure matérielle de FPS ou lancement Windows n’est revendiqué.

## Parcours effectivement exécutés

Les tentatives DEV01 et DEV02 restent conservées avec leurs revues négatives :
un maintien de touche trop bref n’a pas franchi le seuil, puis une descente
chronométrée n’a atteint qu’une marche intermédiaire. DEV03 passe les trois
groupes du monde, mais échoue à observer le refus attendu après son clic de
retour au contact. Ces échecs de collecte ne démontrent pas un défaut du jeu
et ne valident aucune frontière de repli.

Le nouveau `scripts/continuation-world-core-public.mjs` conserve la même
logique publique pour les escaliers, le pilier et la caméra, et enregistre la
provenance et le SHA du collecteur précédent. Il retire le scénario de repli
de son périmètre. Les déplacements ne sont confirmés qu’après lecture des
vrais exports, avec de courts maintiens supplémentaires si nécessaire. La
qualité Économie est choisie dans les vraies Options, sans toucher aux horloges
ou à la cadence.

Le [DEV core01](../qa/continuation-world-core-dev-01-report.json) passe les trois
groupes, avec sept exports publics et dix captures
[effectivement ouvertes](../qa/continuation-world-core-dev-01-visual-review.json).
Les quatre critères fonctionnels d’occlusion, mur opaque, escalier et caméra
ont leur [proposition ciblée](../qa/continuation-world-tracking.json).
`QA-fuite-et-reentree` conserve son critère exact et son statut Prototype :
la frontière des huit secondes reste partielle.

Le [parcours de production final01](../qa/continuation-world-core-production-final-01-report.json)
passe lui aussi les trois groupes, avec sept exports et dix nouvelles captures
[réellement ouvertes](../qa/continuation-world-core-production-final-01-visual-review.json).
Le même collecteur positif est utilisé après reconstruction du registre et du
build. Ses 92 fichiers compilés restent figés, le registre et les autres
sources sont vérifiés au début et à la fin, aucune requête de source de
développement n’est observée et le harness QA est absent. Cette preuve
fonctionnelle n’élargit pas la portée artistique ou matérielle du lot.

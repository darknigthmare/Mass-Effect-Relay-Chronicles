# Couverture, repli et interruption

Le lot reprend `0d76912`, avec les mêmes sprites HD, décors Three.js et combats
ATB. Les guides de niveaux et de caméra épinglés dans `gamedev-sources.json`
servent à vérifier les chemins et le cadrage. Les paramètres ci-dessous sont
des adaptations en unités de scène, sans équivalence balistique ou métrique
avec le jeu original.

## Couverture directionnelle

La campagne transmet au moteur les empreintes solides qui empêchent aussi le
déplacement. Un obstacle doit être proche du défenseur, à moins de 2,4 unités,
et traverser le segment vers l’attaquant. Une caisse devant le personnage ne
protège donc pas contre un ennemi qui le prend par le flanc. Le bonus de tir
historique est appliqué seulement si ce test est positif pour cet attaquant.
Un piratage ne change pas artificiellement la géométrie.

Des caisses basses visibles sont placées dans les arènes lorsque le sol et les
approches le permettent. Elles ne remplacent pas les éléments des cartes et
ne sont pas des placements canoniques relevés dans une édition de Mass Effect.
Les positions de départ restent libres ; les obstacles peuvent demander un
contournement avant d’avancer.

L’ordre est refusé sans coût ni tirage aléatoire en l’absence d’un obstacle
protecteur. Une couverture devenue complètement invalide est retirée, avec
un message. La récupération de bouclier suit l’état de couverture courant.
Les empreintes sont en 2D : elles ne simulent ni la hauteur d’un projectile,
ni une posture anatomique exacte, ni l’arrêt physique du trait lumineux.

Après un ordre, l’interface peut sélectionner le prochain équipier prêt.
L’aide décrit ce nouvel acteur ; la capture de Shepard et la mesure de sa
jauge ne doivent pas être attribuées à l’acteur suivant. Les tests natifs
contrôlent séparément son activation et les dégâts directionnels.

## Repli du commando

Le repli demande une jauge pleine pour chaque équipier vivant et disponible.
En mode Attente, réserver les premières jauges permet aux autres d’avancer,
en laissant aussi agir les ennemis. Les confrontations de boss refusent le
repli et donnent la raison.

La confirmation ne distribue ni XP, ni crédits, ni butin et ne marque aucune
rencontre remportée. Le médi-gel dépensé n’est pas rendu. Le commando est
repositionné sur un point praticable, hors d’un rayon de cinq unités de tous
les contacts, après vérification d’un chemin continu depuis sa position de
combat. Le chemin est calculé ; ce repositionnement ne prétend pas être une
marche jouée ou une animation originale.

Le contact quitté refuse une nouvelle entrée pendant huit secondes de
terrain. Menus, combat et interruptions ne font pas avancer ce délai. Ce
délai est transitoire ; le rechargement conserve le point de repli sauvegardé,
sans prétendre sauvegarder le combat, ses jauges, ses phases ou ses ordres.
La frontière temporelle doit avoir sa propre preuve avant fermeture du
critère QA qui l’exige.

## Focus et effets réduits

La perte du focus suspend la simulation, libère les commandes maintenues et
réinitialise l’horloge. Le retour à la fenêtre garde le menu de pause ; la
reprise est explicite. Le parcours navigateur observe de vrais événements
fiables après désactivation de l’émulation de focus Playwright. Un onglet
Chromium sans écran peut rester visible : ce contrôle ne certifie pas toutes
les transitions de visibilité d’un système d’exploitation.

Les préférences d’affichage peuvent supprimer les particules, la secousse des
sprites et les teintes d’impact, et stabiliser les pulsations décoratives.
Les poses utiles, messages de combat et états persistants restent disponibles.
Ces préférences n’altèrent aucun dégât, statut ou chronomètre du moteur.

Les bancs natifs contrôlent le mouvement, le refroidissement et l’ATB Actif à
30, 60 et 120 appels de premier plan par seconde, avec un rendu par frame.
Ils ne constituent pas une mesure de FPS sur du matériel réel.

## Vérifications du lot gelé

Le [natif global06](../qa/completion-integration-final-06-report.json) passe
1 060 tests. Le parcours public [DEV02](../qa/completion-world-public-dev-final-02-report.json)
et sa [revue des dix captures](../qa/completion-world-public-dev-final-02-visual-review.json)
portent sur la barre tactique compacte finale. La première tentative reste
conservée avec sa revue négative : son panneau masquait une partie du terrain.

Le [parcours de production01](../qa/completion-world-public-production-final-01-report.json)
passe quatre groupes de contrôles, avec cinq exports réels et
[dix nouvelles captures effectivement ouvertes](../qa/completion-world-public-production-final-01-visual-review.json).
Les octets du build restent figés et aucune source de développement n’est
chargée. La préparation d’Eden est une fixture native déclarée ; aucune
traversée antérieure, victoire ou consommation de médi-gel n’est revendiquée.
La frontière des huit secondes reste non jouée et sa fiche QA demeure
Prototype. Ces preuves fonctionnelles ne certifient pas une reconstitution
artistique ou physique intégrale du jeu original.

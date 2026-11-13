# Portée et ordres coordonnés de campagne

Ce chantier reprend `main` à `259d51267a64404048c1e18a1e549f5a356b63c6`. Il applique le guide RPG épinglé du projet et les critères existants `SYS-portee`, `SYS-ordres-coordonnes`, `PWR-ordre-coordonne` et `PWR-repositionnement-atb`. Il ne présente aucune nouvelle règle comme une mécanique canonique originale de Mass Effect.

## Activation et positions

`createBattle({ tactical: true })` active un plan local de campagne. L’absence de l’option conserve les actions et la simulation historiques ; un contexte joueur explicitement ME2/ME3/Andromeda est refusé. Les Chroniques ne demandent pas cette option.

Les coordonnées représentent des unités de scène ATB relatives au centre de l’arène, pas des mètres. Le modèle fournit des positions détachées via `getTacticalPosition` et `getTacticalState` ; le renderer utilise ces mêmes coordonnées. Le plan est borné à x ±8 / z ±6. Les corps lourds disposent d’un espacement initial plus grand. Les nouveaux objectifs de boss peuvent reprendre la position d’un identifiant précédent sans réutiliser son identité ou sa santé.

La campagne transmet `tacticalPositionAllowed`, un prédicat de sol réel de la scène. Une marche vérifie les extrémités et le segment par échantillons espacés d’au plus 0,2 unité. Elle peut être raccourcie pour rester praticable et éviter de terminer sur un corps vivant. Il ne s’agit pas d’une physique continue ou d’une garantie pour des obstacles arbitrairement fins. Les bancs natifs sans callback utilisent seulement les limites du plan adapté.

## Portée et coûts

Les portées de ce réglage ATB sont : pistolet 11,5 ; fusil d’assaut 14 ; fusil à pompe 8,5 ; précision 22 ; contact organique 3,2 ; médi-gel individuel 12 ; capacités ciblées ordinaires 12,5. Elles ne reproduisent pas les tables de distances d’origine. Les actions de groupe amies conservent leurs règles natives.

Une action choisie avant sa cible reste affichée. `getTargetAvailability` explique le refus de la cible et expose distance, portée et coût ATB. Le contrôle précède toute dépense de chaleur, munitions, dose, délai, ATB ou nombre aléatoire. Les effets de zone n’atteignent que les opposants autorisés dans la portée ; une cible explicitement choisie hors portée est refusée. Les lignes de tir balistiques et les obstacles qui bloqueraient un projectile restent à réaliser ; le callback de marche ne prétend pas les simuler.

Avancer et Reculer déplacent le participant de 3,6 unités au maximum et consomment son ordre ATB complet. Ils ne donnent ni dommage, ni pouvoir, ni bonus de concentration. Contournement conserve son effet natif et change aussi la position latérale dans ce mode. Les adversaires peuvent avancer avant une attaque rapprochée lorsque leur cible est trop loin. Une sauvegarde de campagne reprend toujours avant le combat ; ces positions éphémères ne modifient pas le format de sauvegarde.

## Coordination

En mode Attente, la première jauge prête suspend normalement le temps avant que les autres ne soient pleines. La commande explicite « Réserver la jauge » conserve ses 100 ATB, puis laisse le temps et les adversaires avancer jusqu’au prochain équipier prêt. Ce choix ne consomme ni chaleur, ni dose, ni RNG, mais comporte le risque normal de subir des attaques. Une action réussie libère la réserve du participant ; KO et réanimation la retirent. « Libérer les réservations » rétablit le comportement Attente. Cette décision de combat est séparée du brouillon, qui reste une simple lecture sans mutation.

Un brouillon contient deux ou trois participants distincts et un ordre natif par participant. `planCoordinatedOrder` vérifie toutes les maîtrises, disponibilités, cibles, portées, positions et réserves communes sans changer le combat ou son générateur aléatoire. Le joueur peut consulter puis abandonner ce brouillon sans coût. La confirmation effectue une nouvelle validation complète avant le premier engagement.

La résolution applique les vrais ordres successivement : chacun consomme ses propres 100 ATB et les coûts habituels. Aucun pouvoir ni multiplicateur de dégâts n’est inventé. Lévitation puis Projection produit ainsi le même résultat et le même tirage aléatoire que ces deux ordres natifs séparés. Si le premier ordre supprime la dernière cible ou rend un participant suivant indisponible, l’ordre suivant est explicitement annulé sans dépense ; le premier ordre reste résolu. C’est l’engagement initial qui est atomique, pas une simulation simultanée d’attaques indépendantes de leurs conséquences.

## Vérifications

Les [tests tactiques](../../tests/tactical-combat.test.js) couvrent l’activation, les lectures détachées, le refus sans coût ou RNG, le déplacement réel, le segment bloqué, le budget de soin partagé, les participants invalides, deux jauges chargées naturellement en mode Attente et une action ennemie réelle pendant la réserve, le vrai couple Lévitation/Projection, l’annulation tardive et l’approche de l’IA.

Le [comparatif natif](../qa/priority-tactical-balance-02.json) gèle les modules de la révision Git de départ et compare 468 paires : les 21 formations de campagne et les cinq emplacements annexes, trois classes, trois difficultés, deux graines. Les 1 404 combats incluent aussi le contrôle du moteur courant sans opt-in : acteurs, résultats et prochain nombre aléatoire y restent identiques à la baseline. Toutes les configurations activées gagnent sans KO ni expiration dans cette politique. Ces combats détachés ne prouvent ni la traversée des nouvelles étapes narratives, ni une partie humaine complète, ni la fidélité artistique ou statistique originale.

Les phases Bénézia/Thorien et les trois nouvelles capacités de talents possèdent leurs propres modules et recherches. Le moteur de combat applique leurs portes et coûts, sans toucher aux profils de statistiques existants. Le [parcours public DEV](../qa/priority-tactical-public-dev-final-02-report.json) passe quatre contrôles : réservation naturelle en mode Attente et annulation gratuite, deux tirs coordonnés avec chaleur et ATB réels, retrait/approche et cibles hors portée, puis victoire et export/reprise. Ses [huit images réellement ouvertes](../qa/priority-tactical-public-dev-final-02-visual-review.json) couvrent ordinateur et mobile. La première revue négative est conservée ; les boutons de retrait, le texte de portée des actions personnelles et la position des notifications ont été corrigés avant cette nouvelle collecte. Le même collecteur passe ensuite les [quatre contrôles de production](../qa/priority-tactical-public-production-final-01-report.json), avec deux exports réels et [huit nouvelles images réellement ouvertes](../qa/priority-tactical-public-production-final-01-visual-review.json). Sources et 91 fichiers compilés restent identiques ; les préparations initiales restent déclarées.

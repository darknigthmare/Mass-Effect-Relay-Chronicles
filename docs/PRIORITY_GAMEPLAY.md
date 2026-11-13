# Priorités P0/P1 — gameplay ME1

Ce lot reprend `main` à `259d512`. Le [registre complet des priorités](PRIORITIES.md) distingue les critères encore ouverts de ce qui existe déjà. Le travail porte sur les mécanismes du jeu actuel ; il ne reconstitue pas toutes les campagnes des autres œuvres. Les sprites HD, les décors Three.js, le groupe de trois, les sauvegardes et les commandes ATB sont conservés.

## Objectifs persistants

| Lieu | Déroulement disponible | Limite de fidélité |
|---|---|---|
| Eden Prime | Après les deux premiers combats, quatre charges sont marquées. Chaque désamorçage demande six secondes immobile ; se déplacer l’annule. Échec du délai puis reprise explicite du point de contrôle. Le dernier combat reste bloqué jusqu’à la neutralisation. | Prima confirme quatre charges et six secondes ; les cinq minutes de terrain, positions et pause des menus/combats sont adaptées. |
| Novéria | Après l’accès de sécurité, trois stations de MIRA peuvent être rétablies dans un ordre libre. Les laboratoires et Bénézia attendent leur remise en service. | Les stations condensent le noyau, l’alimentation et les communications ; puzzle, réacteur, carte et séquence originaux restent incomplets. |
| Ilos | Après les combats, Vigil active une fenêtre ; le commando doit atteindre le Conduit. L’expiration propose une reprise à Vigil avant une nouvelle activation. La transition vers la Citadelle reste explicite. | La course actuelle se fait à pied et dure soixante secondes de terrain ; elle ne reproduit pas la course originale au Mako. |

Le journal et le HUD utilisent le même état `missionProgress`. Les timers ne comptent ni menus, ni combat, ni chargement, ni perte du focus. Une pause et un rechargement conservent le canal de désamorçage et les étapes déjà traitées. La reprise ne retire aucun combat déjà gagné et ne distribue aucune récompense. Seul le chapitre, après validation, conserve son gain historique unique.

Le chemin public démarre ces étapes à leur porte de combat ou d’objectif. La primitive historique `completeZone` reste compatible avec les fixtures natives qui n’activent pas ces sous-objectifs ; elle refuse un objectif actif ou échoué non résolu. Une ancienne sauvegarde sans détails reçoit un marqueur `legacy-complete` si son chapitre est terminé, sans inventer de charges désamorcées. Un champ présent malformé est refusé.

## Portée, mouvement et coordination

La campagne utilise un petit plan tactique relatif à son arène. Les distances des tirs et pouvoirs sont montrées avant l’ordre. Avancer, reculer ou contourner coûte une jauge ; le renderer suit exactement la position validée. Les déplacements échantillonnent le segment sur le sol réel du décor et ne traversent pas un obstacle pour atteindre un point libre de l’autre côté. Ce plan reste une adaptation en unités de scène, sans trajectoires balistiques, couvertures originales ni distance canonique en mètres.

**Ordres coordonnés** ouvre un brouillon de deux ou trois participants. L’exécution vérifie d’abord les jauges, aptitudes, cibles, portée et ressources communes. Un refus initial laisse ressources et générateur aléatoire intacts. Si une cible disparaît pendant la résolution, les ordres qui ne peuvent plus s’exécuter sont explicitement annulés sans dépense pour ces participants ; les ordres déjà résolus restent acquis. Aucun bonus de dégâts n’est ajouté par la coordination.

En mode Attente, le premier équipier prêt suspend normalement le temps. **Réserver la jauge** l’écarte volontairement de cette condition pour attendre un autre équipier ; les ennemis et refroidissements reprennent alors. Les réservations peuvent être libérées, et annuler le brouillon ne consomme pas de jauge. Le HUD expose chaleur et réservation de chaque équipier. Les règles antérieures des Chroniques et bancs de simulation restent désactivées par défaut pour ces options ME1.

## Talents et budget

**Pause → Talents** affiche les personnages éligibles, leurs prérequis, rangs et points disponibles. Le même budget sert aux talents et aux formations d’armure : un point par niveau ATB gagné, pour chaque personnage. Les achats sont définitifs et limités au Normandy ; la consultation reste possible ailleurs. Aucune monnaie ou pièce d’équipement n’est créée.

Neuf définitions couvrent quatre maîtrises d’armes, Aptitude physique, Formation d’assaut, Électronique, Atténuation et une discipline biotique adaptée. Les bonus se reconstruisent depuis la base et la dotation. Les comparatifs affichent le multiplicateur des tirs, y compris la perte d’une maîtrise en changeant de famille d’arme.

| Capacité nouvelle | Accès de ce prototype | Effet et réserve |
|---|---|---|
| Immunité ME1 | Shepard soldat, Aptitude physique rang 2 | Réduction temporaire des dégâts ; valeurs et arbre adaptés. |
| Montée d’adrénaline ME1 | Shepard soldat, Formation d’assaut rang 2 | Réinitialise les autres recharges. Sa propre recharge reste active ; aucun ralenti ME2, soin, refroidissement ou dose de médi-gel créé. |
| Atténuation | Shepard ingénieur, Électronique rang 1 puis Atténuation rang 2 | Bloque les nouvelles capacités bio/tech ; ne révoque pas un effet déjà résolu. Mine de zone et arbre original non reproduits. |

Le manuel PC français décrit ces mécanismes ; les rangs, coûts et multiplicateurs restent propres à l’ATB. Les arbres complets à douze rangs et toutes les classes/variantes originales restent ouverts. Les nouvelles données `talents` ont une version et un import contrôlé ; l’absence migre vers zéro rang, une structure présente invalide est refusée. Un budget partagé surdépensé est rejeté.

## Phases des boss

Bénézia reste protégée pendant trois vagues d’asari avant de pouvoir être ciblée. Le Thorien possède six nœuds passifs et trois renforts répartis dans la séquence. Les sommes de santé et de bouclier de la formation initiale sont réparties entre les étapes ; il n’existe ni récompense ni victoire intermédiaire. Les anciens corps retirés sont masqués et les poses existantes sont réutilisées.

Les plans de phases sont séparés de leur application au combat. Les sources accessibles ne suffisent pas à certifier leurs vagues, nœuds, effectifs et chiffres comme une transcription exacte : ces mécanismes restent Prototype. La mise en scène et la géographie d’origine restent à produire. Saren conserve son kit et ses phases antérieurs dans ce lot.

## Commandes et temps

La manette standard prend en charge déplacement analogique, navigation des vrais contrôles DOM, listes/curseurs, sélection des équipiers et un clavier à l’écran. Les boutons désactivés sont évités, le focus est restauré après reconstruction de l’interface et les touches maintenues ne sont pas rejouées après connexion ou changement de mode. Retour annule d’abord un brouillon ou une confirmation. Les indications changent avec la méthode utilisée.

Les essais de manette utilisent un périphérique virtuel déclaré et les vrais événements du jeu. Ils ne valident pas un modèle de manette physique ; remappage, vibrations et sélecteurs système de fichiers restent ouverts. Le clavier et la souris restent disponibles.

L’horloge emploie des sous-pas de 1/60 seconde avec une soumission de rendu par image. Les bancs natifs contrôlent l’équivalence ATB/refroidissement et mouvement à 10, 20, 60 et 144 appels par seconde. Ce sont des cadences de test, pas des FPS matériels mesurés. Une interruption supérieure à deux secondes est abandonnée sans rattrapage. Le chargement et les menus réinitialisent la reprise ; blur et changement d’onglet mettent réellement en pause et libèrent les commandes.

## Vérification et suivi

Le [rapport du lot](qa/priority-report.json) relie les sources et les preuves courantes : suite native, comparaisons de combat, parcours publics, images réellement ouvertes, fichier compilé et revue Excel. Les essais anciens ou interrompus restent sous leurs propres noms et ne sont pas présentés comme les parcours du code courant.

Les 1 385 identités du principal, critères, priorités, 27 catalogues supplémentaires, 31 autres classeurs, 46 PNG et manifeste sont conservés. Les corrections de descriptions des formations, opérations et équipements sont dérivées des données exécutables. Les statuts avancés historiques restent inchangés ; aucune nouvelle image, animation complète ou fidélité intégrale 1:1 n’est déduite de ces tests.

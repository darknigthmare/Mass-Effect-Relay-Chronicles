# Combat : fermeture fonctionnelle des critères P0

Lot repris depuis `0d76912`. Le contrat du projet conserve le groupe de trois,
les sprites et les commandes ATB. Les distances sont des unités de scène ; les
coûts, dégâts et durées restent des réglages adaptés, sans certification des
tables, animations ou parcours originaux. Le guide RPG épinglé par
`docs/gamedev-sources.json` est appliqué aux ressources, états et récompenses
séparés du rendu.

## Défauts corrigés

- Un contrôle appliqué sur une cible déjà en Stase échouait silencieusement.
  Il produit maintenant un événement `blocked` et une explication. Les dégâts
  directs et périodiques conservent la protection existante.
- Surcharge sur un organique sans bouclier ne causait aucun dégât, sans raison
  lisible. Le moteur explique désormais cette restriction. Les résistances aux
  brûlures et aux contrôles produisent également leur retour explicite.
- Une préparation de tir perdant sa cible ne distinguait pas le KO d’une
  interruption générique. Les canaux sont annulés immédiatement à la mort de
  leur cible, avec le motif `cible hors combat`. Un tireur piraté annule aussi
  son ancien tir devenu incompatible avec son camp temporaire. Les munitions
  encore non tirées restent disponibles ; aucun tour déjà dépensé n’est rendu.
- La couverture abstraite pouvait être activée au milieu d’un sol vide et
  protéger contre un tir de flanc. La campagne ME1 peut maintenant la relier
  aux obstacles réels, y compris pour un attaquant piraté du même camp nominal.
- Une IA qui ne pouvait plus utiliser Couverture risquait de réessayer ce
  même ordre refusé. Elle choisit un déplacement défensif disponible.

Le correctif d’Atténuation contre `controlImmune` et une résistance complète
appartient à `src/campaign-talents.js`. Les signatures ME2/ME3 sont définies et
restreintes séparément dans `src/completion-chronicles-powers.js` ; le moteur
commet leurs instructions après la prévalidation et les coûts natifs.

## Contrat avec le décor

`createBattle({ tactical: true, tacticalCoverAvailable })` reçoit une fonction
privée, conservée hors sauvegarde. Son argument détaché est
`{ actorId, team, position: {x,z}, opponentPositions: [{id,x,z}] }`.
Elle retourne un booléen ou `{ available, reason, protectedFrom, coverId? }`.
`protectedFrom` contient les identifiants réellement protégés par un obstacle.

`getTacticalCoverState(battle, actorId, attackerId?)` expose
`{ enforced, available, active, reason, protectedFrom, opponentCount, coverId? }`.
Sans attaquant, la requête décrit les menaces vivantes, en tenant compte du
piratage et de Domination. Avec un attaquant, elle teste ce seul identifiant,
indépendamment de son camp permanent. Le getter ne change ni combat ni RNG.

Une activation refusée ne dépense rien. Une couverture devenue totalement
invalide perd son bonus et son refroidissement de bouclier accéléré. Un flanc
exposé reçoit les dégâts complets sans supprimer l’obstacle qui protège encore
un autre côté. Les scènes fournissent leurs colliders de sol et des caisses
visibles ; ce test 2D ne simule ni posture, ni hauteur balistique, ni tirs
réellement arrêtés par le décor.

Sans cette option, les exercices historiques des Chroniques gardent leur
couverture abstraite. Les règles de portée et de coordination restent opt-in
ME1. Le brouillon est pur ; seule une réservation explicite de jauge laisse
avancer les ennemis pendant la préparation des autres équipiers.

Les nouvelles lignes de fin/annulation de canal sont activées par
`combatFeedback: true` et automatiquement par le plan tactique ME1. Les
escarmouches interactives des Chroniques passent explicitement ce drapeau.
Les études Simulation conservent leurs journaux historiques, tandis que
l’événement structuré `channelEnd` conserve son motif dans les deux cas.
Un test compare les acteurs et le prochain tirage aléatoire entre ces modes :
seul le retour de présentation est différent. Les résultats publiés des
extensions historiques ne sont ni régénérés ni affaiblis pour accepter ce lot.

## Preuves et limites

`tests/completion-combat.test.js` isole les vrais défauts : refus géométrique
gratuit, protection directionnelle, menace piratée, disparition de couverture,
Stase, résistance, piratage organique, amplificateur acheté par un soldat,
annulation de cible/acteur KO, surchauffe naturelle, règle commune Actif/Attente
et résultat unique après dégâts périodiques. Les fixtures déclarent leurs
acteurs ; ce sont des tests de simulation et non des sauvegardes de parcours.

`scripts/completion-combat-native.mjs` conserve le TAP et le graphe des sources
avant les tests. `scripts/completion-combat-balance.mjs` fige aussi le graphe du
commit de départ et compare 21 formations de campagne et cinq combats annexes,
trois classes, trois difficultés et deux graines. Les combats sans option sont
comparés exactement, acteurs et prochain tirage aléatoire inclus. Les combats
avec options utilisent le vrai sol et la couverture des builders de zone,
sans créer WebGL ni charger les textures. Les objectifs nécessaires aux
snapshots de progression passent par les callbacks natifs du commit de départ.

Le premier essai `completion-combat-balance-initial-01.json` précède les caisses
ajoutées au centre des arènes. Il reste une preuve historique de 468 paires,
1 872 combats, sans KO ni blocage, et ne valide pas le décor final. De même,
`completion-combat-native-initial-01.json` est l’essai de 159 tests précédant le
dernier cas de couverture contre un équipier piraté. Les preuves finales
doivent avoir un préfixe neuf et correspondre aux empreintes du code livré.

Sur le gel global 02, `completion-combat-native-final-02.json` passe **176
tests**, dont les quinze nouveaux cas et les résultats historiques exacts des
extensions. Les deux anciens rapports utilisés comme attentes sont vérifiés
inchangés depuis `0d76912`. Le préfixe natif final 01 reste un échec du
collecteur avant lancement des tests : sa lecture Git dépassait le tampon par
défaut de 1 Mo ; seul le tampon du script a été augmenté.

`completion-combat-balance-final-01.json` passe **468 paires / 1 872 combats**
avec les caisses réelles installées et les callbacks de sol/couverture. Les 468
cas sans option conservent exactement acteurs, résultats et prochain tirage.
Les 468 combats configurés avant et après sont gagnés, sans KO allié, timeout
ou drapeau de régression. Le rapport conserve les graphes de sources des deux
versions et revérifie leurs empreintes en fin d’exécution. Ce résultat décrit
une politique automatique et ne garantit pas la difficulté de toute stratégie.

**Réserve historique sur les deux premiers comparatifs :** ils appelaient les
builders avec une graine fixe, sans toute la séquence `setZone` et sans les
colliders ajoutés par les sprites de véhicule chargés. Ils ne prouvent donc pas
le masque exact du chargement réel. Les anciens helpers sont archivés dans
`completion-combat-geometry-scope-qualification.json`, sans modifier les
rapports exécutés.

Le helper corrigé appelle directement `WorldView.setZone`, conserve ses tirages
aléatoires, l’habillage, le filtre des colliders autour des interactions, les
caisses et le Mako statique natif. `_propSprite` ne consomme pas le RNG du monde
et n’ajoute pas de collision ; `_vehicleSprite` ajoute bien un cercle Mako et
reste exécuté. Seuls les pixels des textures, les labels DOM et la soumission
WebGL sont simulés. Le contexte et les marqueurs optionnels passent par les
méthodes natives. `completion-combat-geometry-native-final-01-report.json`
atteste les **six tests monde** sur ce helper aligné et le gel produit 04.

Le remplacement `completion-combat-balance-final-02.json` passe de nouveau
**468 paires / 1 872 combats**, cette fois avec le chargement natif exact des
snapshots déclarés. Les 468 victoires avant/après, l’absence de KO/timeout et
les 468 égalités sans option sont conservées. Le contexte et les marqueurs sont
chargés depuis chaque snapshot distinct ; les parcours précédant ces positions
restent préparés en Node. `completion-combat-native-final-03.json` conserve les
**176 tests** passés avec le `loadout.js` du gel 04, après la correction de vente
à stock plein. Ces preuves natives restent celles du registre avant sa future
synchronisation ; le registre généré final a son propre contrôle de build.

`scripts/completion-combat-public.mjs` prépare trois sauvegardes indépendantes
avec `newGame`, une position de départ déclarée et un import par le sélecteur
public. Aucun HP, ATB, timer ou résultat de combat n’est forcé. Le parcours joue
la coordination, la victoire/récompense/reprise, une défaite naturelle en
Actif/Difficile, la tentative suivante et le checkpoint réel, puis une Stase
d’Adepte contre laquelle un allié tire réellement. Les captures doivent être
ouvertes individuellement après chaque essai DEV et production.

La distribution unique des récompenses et la reprise après défaite ou fuite
appartiennent à la campagne et à l’interface, avec leurs preuves propres.
L’événement moteur de victoire unique, à lui seul, ne prouve pas le versement
unique du butin. Aucune phase de boss canonique complète ni nouvelle famille
d’assets n’est validée par ce lot.

## Parcours public DEV du gel 05

`completion-combat-public-dev-final-01-report.json` passe les **sept contrôles**
et conserve treize captures, trois fixtures et trois exports. La défaite des
trois équipiers est réellement jouée sans ordre en Actif/Difficile pendant
85,992 secondes de temps réel ; Retry reconstruit les alliés vivants et le vrai
checkpoint précombat reprend sans altérer les ressources/progrès contrôlés.
L’autre fixture montre Stase, le vrai tir de Kaidan, sa dépense d’ATB/chaleur et
les protections intactes avec leur explication.

La revue `completion-combat-public-dev-final-01-visual-review.json` ouvre
réellement chaque PNG en résolution originale, après fermeture de Chrome,
sans défaut bloquant. Le panneau développé occupe beaucoup du champ mobile ;
aucune certification de téléphone physique, contraste WCAG ou fidélité
artistique ne découle de ce contrôle. Les 114 sources de logique sont figées ;
le registre DEV avant synchronisation est conservé séparément. Les deux
avertissements sont le seul favicon 404, sans erreur JS ou requête bloquante.

Les comparatifs natifs détaillés du gel 04 précèdent le durcissement des
entrées ; ils ne sont pas réécrits. Le gate complet courant
`completion-integration-final-05-report.json` rejoue les tests de fonctionnalité
et passe **1 060 / 1 060**. Les propositions de suivi attendent encore le
parcours public de production sur le registre définitif et sa revue.

Le composant compact final est repris par
`completion-combat-public-dev-final-02-report.json` : **sept contrôles et treize
captures passent à nouveau**, avec le collecteur strictement identique au
DEV01. La revue `completion-combat-public-dev-final-02-visual-review.json` ouvre
les treize fichiers en original après fermeture de Chrome. Le groupe et les
adversaires restent maintenant visibles au-dessus du brouillon desktop/mobile,
les commandes et retraits restent lisibles. Les 114 sources de logique sont
exactes, le registre DEV est séparé et le composant a pour SHA
`45385da462f1cf8ee00fb2bdcd72646e98a9353c6ea9e0b36c5515837641547a`.

Le gate natif complet `completion-integration-final-06-report.json` passe
**1 060 / 1 060** avec ce produit. Les dix-neuf clauses fonctionnelles proposées
sont couvertes par leurs exécutions natives et DEV réellement citées ;
`productionPending: true` conserve le contrôle de production comme gate séparé
obligatoire avant livraison. Aucun résultat de production n’est anticipé.

## Parcours public de production final

Le gate séparé est maintenant exécuté :
`completion-combat-public-production-final-01-report.json` passe **sept contrôles**
sur `http://127.0.0.1:4194/`, avec le collecteur strictement identique au DEV02
(`b36beaf01a32f362b3481e855b086c955c6372be5f31ef366f5158af9c01469d`).
Il conserve treize captures, trois fixtures importées par le sélecteur public et
trois exports réels. La défaite naturelle en Actif/Difficile prend
**86,535 secondes** dans cette exécution ; les trois KO, la tentative suivante
et le chargement du vrai checkpoint sont contrôlés sans modifier HP, ATB ou
horloge. La Stase d’Adepte protège bien les barres de la cible contre le tir
réel de Kaidan, qui dépense sa jauge et affiche 24 % de chaleur.

La revue `completion-combat-public-production-final-01-visual-review.json`
réunit **treize ouvertures réelles en résolution originale** après fermeture
de Chrome. Les sept premières sont attribuées à `/root/gameplay_audit`, les
six dernières à `/root/priority_bosses`, avec leurs revues partielles et SHA
liés au même rapport brut. Aucun défaut bloquant n’est constaté. Les acteurs
restent visibles au-dessus du composant compact desktop/mobile ; les ordres,
les distances hors portée et les boutons de reprise sont lisibles. Le prochain
acteur sélectionné sur la dernière capture est Jenkins ; le tir déjà exécuté
et protégé par Stase appartient bien à Kaidan, comme l’indique le journal.

Les **115 sources**, registre généré définitif inclus, leurs 115 snapshots et
les **91 fichiers de distribution** sont figés et revérifiés par leurs SHA.
Aucune requête de source/Vite, erreur JS/console ou requête échouée n’est
relevée ; les trois avertissements de ressources sont uniquement le
`favicon.ico` absent déjà déclaré. Le registre final porte le SHA
`ceb6ca3970a5098d66ae7f06f20f596fa6e483cbac19ead0d004ba237aa1c124`.

Les propositions archivées de `completion-combat-tracking.json` conservent
leur `productionPending: true` historique : elles décrivent l’étape locale
avant ce gate et ne sont pas réécrites. Les rapports de production et l’agrégat
final documentent sa clôture séparée. Ce parcours public porte sur les trois
fixtures précoces déclarées ; les autres clauses restent fondées sur les
scénarios natifs cités. Il ne certifie ni tous les gestes tactiles sur téléphone
physique, ni une manette physique, ni la balistique ou la fidélité artistique
originale 1:1.

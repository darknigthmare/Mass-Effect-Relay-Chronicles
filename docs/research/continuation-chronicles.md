# Charge : positions locales des essais Chroniques

Base de travail : `5d933068cacd1b595d584b7cedfffd35b1db362d`, branche `equipment-main`, 13 novembre 2026. Les anciens rapports Completion restent historiques et ne servent pas de preuve de cette modification.

## Critère et décision de périmètre

La fiche principale `ME2-charge-biotique` demande exactement **« Déplacement et risque adaptés à l’ATB. »**. Le précédent contact enregistré par identifiant de cible ne déplaçait aucune coordonnée. Le module existant `tactical-positions.js` fournit des positions ME1 mais refuse explicitement les acteurs des autres œuvres ; il reste inchangé.

`continuation-chronicles-positions.js` fournit donc une arène locale à deux dimensions, dans les essais indépendants ME2/ME3 de leur seule période principale. Chaque combattant natif commence à une position bornée. Avancer/Reculer consomment un ordre ATB et changent cette position. Charge prépare un point de contact libre à 1,6 unité de la cible puis le moteur valide et applique une seule fois déplacement, coûts, impact et exposition. La prévisualisation et la résolution emploient le même plan ; une cible déplacée est réévaluée au moment de l’ordre.

Le menu et la carte affichent ces coordonnées. Le modèle ne produit ni déplacement du sprite dans un décor 3D original, ni trajet physique, ni traversée d’obstacle. Les autres pouvoirs conservent leurs portées abstraites existantes, notamment l’onde de Nova. La campagne ME1 conserve son propre système de positions et son rendu en sprites 2D dans les décors 3D.

## Paramètres choisis pour l’adaptation

| Règle | Valeur et conséquence |
| --- | --- |
| Bornes locales | x : −8 à +8 ; z : −6 à +6, en unités de scène ATB. Deux colonnes couvrent les effectifs actuels, avec au plus six combattants natifs par camp. |
| Avancer/Reculer | Pas maximum de 3,6 unités, raccourci si une limite ou un corps vivant interdit la destination ; coût de 100 ATB. Aucun trajet balayé ni collision avec un obstacle n’est revendiqué. |
| Charge | Cible à 12,5 unités maximum ; contact à 1,6 unité. Plusieurs destinations de contact déterministes sont essayées sans tirage aléatoire ; aucun chevauchement de corps vivant à l’arrivée. |
| Refus de Charge | Cible invalide ou KO, position absente, portée dépassée, contact déjà atteint ou toutes les arrivées occupées : aucun coût, aucune recharge, aucun bouclier ni dégât, aucun tirage aléatoire. |
| Coûts et risque | 100 ATB, recharge 12 secondes ATB, sortie du couvert, impact biotique existant, récupération plafonnée de la moitié du bouclier maximal ; dégâts reçus +15 % pendant trois secondes ATB. Pause et mode Attente suivent l’horloge native. |
| Persistance | Classe et équipement préparés sont sauvegardés. Coordonnées, exposition et résultats vivants ne sont jamais ajoutés au format de préparation ; un nouvel essai reconstruit sa formation. |

Ces nombres et refus sont des choix du fan game. Ils ne certifient ni les distances, rangs, évolutions, acquisitions ou animations originaux, ni une campagne ME2/ME3 complète.

Les attributions et références des pouvoirs restent celles des fiches existantes `ME2-POW-CHARGE` et `ME3-POW-CHARGE`, avec les gardes Shepard/Porte-étendard/œuvre/période/source exactes déjà présentes. Aucun nouveau pouvoir n’est accordé par son nom et aucun prologue, autre média ou acteur ne reçoit cette permission.

## Omni-lame toujours ouverte

La fiche principale `ME3-omni-lame` garde son critère exact **« Ne pas rétroporter comme équipement canonique ME1. »**. La recherche dans le catalogue ME3 courant ne trouve aucune fiche POW factuelle éligible d’omni-lame. `ME3-ANI-OMNIBLADE` est une **Extrapolation**, une spécification de production sans `sourceIds` ; sa présence ne constitue pas une attribution de mêlée lourde à une classe ou un personnage. `ME3-ANI-TECH-CAST` est également une spécification sans source et n’établit pas une omni-lame.

Le constat du manuel ME3 conservé dans la recherche Completion porte sur une attaque lourde propre à chaque classe ; il ne permet pas de transformer toutes ces attaques en omni-lame universelle. Ce lot n’annonce pas une nouvelle inspection primaire de ce manuel. Il ne crée donc ni action, équipement, identifiant de source, fiche factuelle ou autorisation artificielle pour cette fonctionnalité. La fiche demeure ouverte et aucun élément ME1 n’est modifié à ce titre.

Le [relevé d’éligibilité frais](../qa/continuation-chronicles-source-eligibility.json) conserve les empreintes du catalogue et du registre consultés, le candidat exact et l’absence de fiche POW factuelle sourcée correspondante. Ce relevé documentaire ne certifie pas une attribution de classe ou d’acteur.

## Méthode et preuves fraîches

Les guides `rpg` et `save-systems` épinglés à `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` ont été lus, ainsi que la référence RPG `stats-combat-quests.md`. Ils sont adaptés au moteur et aux schémas existants : plans avant mutation, statistiques et effets reconstruits sans cumul, données de préparation séparées des objets vivants. Aucune dépendance ni migration n’est ajoutée.

`CONTINUATION_CHRONICLES_NATIVE_PREFIX=continuation-chronicles-native-02 node scripts/continuation-chronicles-native.mjs` passe **91/91 tests**, avec empreintes inchangées des sources avant/après. Le [rapport natif](../qa/continuation-chronicles-native-02-report.json) et la sortie TAP couvrent les douze nouvelles régressions, les signatures existantes, les sessions et les combats ME1. Ces essais déclarent leurs fixtures natives ; ils ne constituent pas des captures ni un parcours public.

Le nouveau collecteur `scripts/continuation-chronicles-public.mjs` prépare la classe et le groupe par les menus, attend l’ATB naturelle, joue Reculer puis Charge, lit seulement le DOM public, conserve captures et exports, attend la fin naturelle de l’exposition et reprend une véritable préparation après import/rechargement. Un témoin ME1 natif déclaré avant import doit rester inchangé. Il refuse de réutiliser un préfixe et vérifie le gel des sources ; le registre généré DEV est un contexte séparé également vérifié avant/après. En production, le registre devient une source stricte et les octets JS/CSS servis sont comparés à `dist/`.

Le passage **DEV03** passe réellement **quatre contrôles**, avec **onze captures originales ouvertes individuellement après fermeture de Chrome** et **cinq exports** : [rapport](../qa/continuation-chronicles-dev-03-report.json), [revue liée aux empreintes des PNG](../qa/continuation-chronicles-dev-03-visual-review.json). Il montre le retrait puis la Charge ME2 et ME3 jusqu’au contact à 1,6 unité, le risque annoncé avant l’ordre, et les deux états actifs effectivement capturés (+15 %, une seconde restante ME2 et deux ME3). Après reprise, la ligne d’exposition disparaît naturellement sans retour de la position initiale. Le calcul des dégâts réellement multipliés par 1,15 et les refus atomiques sont établis par les natifs, pas déduits des seules images.

Le même passage conserve exactement la préparation après la bataille ; un véritable import, une sauvegarde et un rechargement du navigateur reconstruisent une nouvelle arène à la révision zéro, sans effet vivant. Soldat ME3 et prologue terrestre n’ont pas Charge ; le prologue n’a pas la nouvelle arène. Le stockage du témoin ME1 reste identique octet pour octet. Sources et contexte du registre sont gelés, sans erreur JavaScript, console ou requête en échec.

Le viewport de bureau déclaré est **1280 × 1900**, sans zoom ni modification du DOM ou du CSS : cette grande fenêtre conserve les commandes et Pause dans la même vue. La capture mobile **390 × 844** montre une carte et sa légende lisibles sans débordement horizontal ; elle ne constitue pas un parcours complet de commandes au téléphone.

Les tentatives **DEV01/02** et leurs artefacts sont conservés. Elles ont obtenu le retrait et le contact corrects mais ont lu l’exposition après son expiration naturelle de trois secondes, en rejoignant Pause depuis les commandes dans une fenêtre plus courte. Aucune de leurs images n’est utilisée comme capture positive d’un état actif. DEV03 ajoute un relevé DOM immédiat après le clic réel, un grand geste de molette, une recherche neuve de Pause et les dimensions déclarées ci-dessus. Aucune horloge, durée, ressource ou donnée de bataille n’est forcée.

Le passage **production final01** passe ensuite **quatre contrôles**, avec **neuf captures originales ouvertes individuellement en détail original après fermeture de Chrome** et **cinq exports** : [rapport](../qa/continuation-chronicles-production-final-01-report.json), [revue avec les empreintes exactes](../qa/continuation-chronicles-production-final-01-visual-review.json). Le collecteur est strictement identique à DEV03. Les sources et le build sont gelés ; les octets des douze fichiers JS/CSS servis correspondent à `dist/`, sans requête `/src/`, erreur JavaScript, erreur console ou requête en échec.

Ce passage compilé confirme le retrait puis le déplacement de Charge vers le contact à 1,6 unité, l’annonce du risque avant l’ordre, la préparation seule conservée à l’export/reprise et les gardes Soldat/prologue, avec le témoin ME1 inchangé. **Aucun état actif d’exposition n’est capturé en PNG de production** : le relevé DOM immédiat observe le statut ME2 et ME3, mais la fenêtre naturelle de trois secondes expire avant Pause. Les neuf images montrent les positions et l’état après expiration ; aucune n’est présentée comme capture positive de l’exposition active. Les deux captures actives restent celles du parcours DEV03 distinct et réellement relu. Le multiplicateur de dégâts ×1,15, le gel en pause et la fin d’effet sont établis par les 91 tests natifs frais, sans forcer une durée ou l’horloge en production.

Le [suivi proposé et figé](../qa/continuation-chronicles-tracking.json) conserve les critères inchangés et l’évaluation fonctionnelle fondée sur les natifs et DEV03. Ses mentions de production en attente décrivent l’étape antérieure à la copie du suivi ; le rapport de production distinct ci-dessus consigne la vérification réellement exécutée ensuite, avec sa limite de capture. L’omni-lame, les campagnes complètes et les grandes fiches POW avec ressources originales restent ouvertes.

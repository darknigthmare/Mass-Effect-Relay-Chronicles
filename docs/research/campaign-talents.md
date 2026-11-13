# Talents de campagne ME1 et budget de formation

Le lot reprend `259d51267a64404048c1e18a1e549f5a356b63c6`. Il ajoute une progression ATB persistante, avec neuf définitions de talents, à la campagne ME1. Les arbres originaux, leurs douze rangs, leurs seuils d’activation et leurs effets complets ne sont pas reproduits. Les Chroniques gardent leurs préparations distinctes.

## Référence effectivement consultée

Le [manuel PC français officiel](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_PC_fr.pdf) a été téléchargé de nouveau le 13 novembre 2026 : HTTP 200, 4 659 610 octets, SHA-256 `17fa35a20690481d7b29edaa06c618a7b74ff85bb03fb3ec4b5b9ef9b6f5516c`. Les pages PDF 17–18, imprimées 30–33, décrivent les points de talents, les catégories militaires/technologiques/biotiques et leurs fonctions générales.

Le manuel confirme que Formation d’assaut donne accès à Montée d’adrénaline, laquelle rend les autres capacités immédiatement disponibles. Aptitude physique donne accès à une protection temporaire appelée Immunité. Le champ Atténuation neutralise les capacités technologiques et biotiques. Électronique améliore les boucliers. Le catalogue conserve son identifiant historique `PWR-amortissement` ; l’interface utilise ici le libellé « Atténuation » du manuel.

Les trois pages communautaires Damping, Immunity et Adrenaline Burst ont répondu HTTP 402. Elles n’ont pas été lues. Le [rapport d’accès](../qa/priority-talents-source-access.json) conserve les URL, réponses, octets et empreintes ; il ne prétend pas certifier les chiffres ou arbres individuels.

## Contenu fonctionnel et restrictions

| Talent | Éligibilité du prototype | Effet ATB |
|---|---|---|
| Pistolets, fusils d’assaut, fusils à pompe, fusils de précision | Les familles déjà maîtrisées du profil de classe ou d’équipier | +3,5 % de dégâts par rang pour la seule famille équipée ; trois rangs |
| Aptitude physique | Shepard soldat | +14 santé par rang ; Immunité au rang 2 ; trois rangs |
| Formation d’assaut | Shepard soldat | +3 % de dégâts de tir par rang ; Adrénaline ME1 au rang 2 ; trois rangs |
| Électronique | Profils technologiques existants | +8 bouclier par rang ; ne confère aucun nouveau pouvoir ; trois rangs |
| Atténuation | Shepard ingénieur, Électronique rang 1 requis | Deux rangs, action déverrouillée au deuxième |
| Discipline biotique | Profils biotiques existants | Exercice adapté : +4 % au multiplicateur biotique par rang ; trois rangs, aucun nouveau pouvoir |

Les trois nouvelles capacités actives restent limitées aux deux profils de Shepard indiqués ci-dessus. Cette sélection conserve un périmètre prudent ; elle ne constitue pas la table complète des talents des autres classes ou compagnons. Aucun arbre n’est inventé pour Jenkins. Les achats d’un équipier perdu sont refusés ; ses investissements historiques restent conservés dans la sauvegarde.

| Action | Effet exécuté | Limite de fidélité |
|---|---|---|
| Atténuation | Bloque les nouvelles actions technologiques et biotiques pendant huit secondes, modulées par l’outil et la résistance au contrôle. Les tirs et aptitudes militaires restent utilisables. Les effets, dégâts et actions déjà résolus ne sont pas annulés. | Mine de zone et effets complets non réalisés ; durée de base, recharge de 18 s et cible unique adaptées à l’ATB |
| Immunité | Multiplie les dégâts entrants par 0,65 pendant huit secondes, avant le calcul d’armure ; recharge de 24 s | Réduction, durée, interaction avec les boucliers et recharge adaptées ; variante originale/Legendary non certifiée |
| Montée d’adrénaline ME1 | Remet les autres recharges à zéro après le paiement natif de l’ordre. Sa propre recharge de 45 s demeure active. | Aucun ralenti ME2, aucun soin, médi-gel, point ATB, dégât ou refroidissement d’arme accordé |

## Point commun aux talents et aux armures

Chaque acteur dispose de `floor(xp / 300)` points. Le nombre de rangs achetés et le nombre de formations d’armure acquises sont additionnés avant toute validation. Avec un seul point, acheter Aptitude physique empêche l’achat d’armure lourde ; faire l’inverse empêche l’achat du talent. Une exception historique d’armure `legacyArmor` ne consomme pas artificiellement un point.

Les talents s’achètent uniquement au Normandy ; ils restent consultables sur le terrain. Chaque achat annonce un coût d’un point et son caractère définitif. Il n’y a pas encore de redistribution ou d’apprentissage automatique des points. Un refus de classe, de prérequis, de rang maximal, de budget ou de présence laisse la partie entière intacte. Aucun XP, crédit, objet, pouvoir étranger ou récompense de mission n’est créé par le menu.

## Données et persistance

`state.talents = { version: 1, ranks: { actorId: { talentId: rank } } }` conserve uniquement les rangs achetés. L’absence de ce champ dans une ancienne sauvegarde donne des rangs vides. Une valeur explicitement invalide, un rang inconnu, une classe non éligible, un équipier non recruté, un prérequis absent ou une somme de points supérieure au budget provoquent le refus de l’import.

Les bonus sont reconstruits depuis `baseActorFor`, l’équipement courant et les rangs ; ils ne s’ajoutent pas à la sauvegarde comme nouvelles statistiques de base. Un acteur déjà traité porte un marqueur empêchant une deuxième application. Les aperçus d’équipement et l’atelier utilisent les mêmes calculs et ne dépensent aucun point.

## Vérifications et portée des preuves

Les tests de [campaign-talents.test.js](../../tests/campaign-talents.test.js) couvrent le budget dans les deux ordres d’achat, le refus atomique, les six classes, la mort narrative, les getters et données malformées, les reconstitutions réelles de sauvegarde et les comparatifs d’équipement. Ils exécutent aussi les trois effets via le vrai moteur de combat : blocage des nouveaux ordres bio/tech, maintien du tir, dégâts réduits et recharge propre d’Adrénaline conservée.

Le collecteur [priority-talents-public.mjs](../../scripts/priority-talents-public.mjs) prépare trois contextes natifs avec XP déclaré, puis utilise les vrais imports, achats, sauvegardes manuelles, exports et reprise automatique. Il est prévu pour les deux modes `dev` et `production`, avec préfixe unique par tentative ; son existence ne constitue pas un résultat exécuté. Les rapports effectivement produits par le parent préciseront les captures ouvertes, leurs sources et les réserves restantes.

Le [parcours public DEV exécuté](../qa/priority-talents-dev-final-01-report.json) passe cinq groupes : budget commun talents/armure, sauvegarde manuelle et recharge, prérequis ingénieur et reprise automatique, import invalide refusé, cartes mobiles et achat sur le terrain bloqué. Huit exports réels sont décodés et comparés ; les [neuf captures](../qa/priority-talents-dev-final-01-visual-review.json) ont été réellement ouvertes. Les trois contextes donnent leur XP explicitement comme préparation de test ; aucune victoire ou acquisition préalable jouée n’est revendiquée. Le même collecteur passe ensuite les [cinq contrôles de production](../qa/priority-talents-production-final-01-report.json), avec huit nouveaux exports et [neuf nouvelles captures réellement ouvertes](../qa/priority-talents-production-final-01-visual-review.json) ; les sources et 91 fichiers compilés restent identiques avant et après.

Aucune nouvelle image, pose ou animation n’est ajoutée. Les dessins existants de gestes de pouvoir restent des prototypes génériques. La réussite fonctionnelle de ces règles ne certifie pas une fidélité artistique ou mécanique intégrale 1:1.

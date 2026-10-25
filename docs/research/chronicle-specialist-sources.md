# Sources des armes et capacités spécialisées des Chroniques

Relevé du 25 octobre 2026. Cette note sépare la consultation primaire réussie, les déclarations des catalogues secondaires et les mécanismes qui restent à vérifier. Elle ne certifie pas les six armes candidates ni une fidélité 1:1. Aucun catalogue, code du jeu ou ancien rapport n’a été modifié pour ce relevé. Les résultats structurés figurent dans [chronicle-specialist-reference-report.json](../qa/chronicle-specialist-reference-report.json).

## Documents effectivement consultés

Le [manuel officiel PC anglais de Mass Effect: Andromeda](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-pc-en.pdf) a répondu **HTTP 200**, avec le type `application/pdf`, **847 754 octets** et une signature `%PDF-`. `pdfinfo` reconnaît un document PDF 1.7 de **30 pages**. Son SHA-256 est `a5e3bfc40a63695fb20d8fcb2db4b590a6fa65bf24c90b01c9eae555190f817f`. Le texte a été extrait avec `pdftotext -layout` ; les pages 18 et 19 ont également été inspectées dans leur rendu PDF. Les numéros ci-dessous sont les numéros imprimés, qui correspondent aux pages PDF de ce document.

| Pages MEA | Fait établi par cette consultation | Limite de la preuve |
|---|---|---|
| 15–16 | La recherche débloque des plans ; les augmentations s’ajoutent lors de la fabrication et peuvent modifier le fonctionnement d’un équipement. | Ne prouve ni une augmentation particulière ni sa compatibilité avec un modèle précis. |
| 17 | Ryder peut sélectionner les familles d’armes disponibles sans restriction de catégorie ; leur poids influence le temps de recharge des pouvoirs. Deux équipiers accompagnent Ryder, avec des missions pouvant imposer un équipier. | Cette phrase ne définit pas les armes autorisées pour chaque compagnon ni une présence dans une mission donnée. Aucun poids ou multiplicateur précis n’est fourni ici. |
| 18 | Les mods d’armes se choisissent dans la préparation ; les Fusion Mods concernent l’armure de torse et peuvent comporter des contreparties. | Ne transforme pas une augmentation de fabrication ou un Fusion Mod en module d’arme. Aucun nombre de ports, rang ou bonus propre à un modèle n’est établi par ce passage. |
| 18–19 | Le HUD indique les tirs restants et la réserve ; la touche R recharge. Les caches de munitions permettent le réapprovisionnement. | Description générale du HUD : elle ne prouve pas que chaque arme spécialisée emploie ce mécanisme, ni ses capacités. |
| 19 | Les pouvoirs portant un compteur consomment des **Power Cells** ; les caches de munitions les reconstituent. Le manuel précise que ces pouvoirs n’ont pas de temps de recharge. Les pouvoirs sans compteur utilisent un temps de recharge. | Le passage ne nomme pas les capacités appartenant à chaque groupe. Il ne permet pas, à lui seul, d’attribuer ce fonctionnement à Omni Grenade, Flak Cannon ou à un autre pouvoir nommé. |
| 21–23, 25 | Les compétences mêlent combat, biotique et technologie ; trois pouvoirs au maximum sont assignés. Les profils se débloquent suivant les investissements et donnent des bonus. La loyauté ouvre le dernier palier des compétences d’un équipier. | Ne fournit pas tous les kits individuels, conditions de recrutement, rangs, statistiques ni un profil canonique unique de Ryder. |
| 30 | Les fournitures **multijoueur** déclenchent notamment Cobra RPG, réanimation, réapprovisionnement munitions/cellules et restauration santé/boucliers ; leur nombre d’utilisations par partie est limité. | Ces fournitures et raccourcis ne constituent pas une règle d’inventaire ou de récompense du solo. Le passage ne donne pas les quantités exactes de chaque fourniture. |

La recherche dans le texte intégral et la lecture des sections de combat n’ont pas trouvé de fiche Falcon, Scorpion, P.A.W., Reegar ou Sweeper, ni de description d’un cycle de chaleur des armes reliquates ou d’un tir à rayon. **Ce manuel ne sert donc pas de preuve primaire des mécanismes propres aux six modèles.** Cette absence de détail n’est pas une preuve d’absence de ces armes dans le jeu.

Le [manuel PC français de Mass Effect 2](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) déjà téléchargé a été relu localement. Sa signature PDF, ses **2 937 619 octets**, ses **18 pages PDF** et son SHA-256 `c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1` concordent avec le [rapport historique](../qa/chronicles-primary-reference-report.json). Il n’a pas été retéléchargé dans ce relevé. Les pages imprimées 16–17 établissent les dissipateurs amovibles, leur remplacement et le compteur des tirs restants ; les pages 22–24 présentent les classes. Ces faits ne sont pas une preuve des mécanismes ME3/MEA ou des kits complets de compagnons de DLC.

Le fichier local `/tmp/relay-me3-manual-fr.pdf` fait **263 octets** et commence par du XML contenant `AccessDenied`. Ce n’est **pas un PDF**. Le rapport historique documentait une réponse HTTP 403 ; aucune nouvelle requête ME3 n’a été effectuée ici. Aucune consultation primaire du manuel ME3 n’est revendiquée.

## Portée des six modèles candidats

Les affirmations de la colonne centrale ont été retrouvées dans les fichiers JSON du dépôt. Elles restent des **déclarations du catalogue secondaire**, pas des faits nouvellement confirmés par la consultation du manuel ou des pages individuelles. Leurs identités de source et descriptions n’ont pas été changées.

| Fiche | Déclaration existante et source | Détails restant non vérifiés dans ce relevé |
|---|---|---|
| `ME3-WPN-FALCON` | M-37 Falcon : lance-grenades classé fusil ; `ME3-SRC-EQUIP`. | Comportement exact du projectile, déclenchement de l’explosion, portée et zone d’effet, munitions, chiffres, acquisition et scène. |
| `ME3-WPN-SCORPION` | Scorpion : pistolet à projectile explosif ; `ME3-SRC-EQUIP`. | Éventuelle adhésion, conditions et délai de détonation, zone d’effet, chargeur/réserve, acquisition et scène. |
| `MEA-WPN-SCORPION` | Scorpion : pistolet explosif ; `MEA-SRC-WEAPONS`. | Comportement précis et variantes du projectile, détonation, munitions, mods et acquisition. La fiche ME3 ne suffit pas à établir les variantes MEA. |
| `MEA-WPN-PAW` | P.A.W. : arme à rayon ; `MEA-SRC-WEAPONS`. | Cycle de chaleur ou munitions, fonctionnement et interruption du rayon, refroidissement/surchauffe, dégâts et acquisition. |
| `MEA-WPN-REEGAR` | Reegar Carbine : fusil électrique ; `MEA-SRC-WEAPONS`. | Fonctionnement exact du flux électrique, alimentation, distance, effets contre les différentes protections et acquisition. « Électrique » ne suffit pas à lui attribuer un système thermique reliquat. |
| `MEA-WPN-SWEEPER` | Sweeper : fusil reliquat ; `MEA-SRC-SWEEPER`. | Cadence ou salve, système d’alimentation, cycle de chauffe/refroidissement, chiffres et acquisition. L’appartenance reliquate ne suffit pas à reconstruire tous ses effets. |

La page [Scorpion](https://masseffect.fandom.com/wiki/Scorpion) a répondu **HTTP 402**, avec une courte réponse JSON demandant de contacter le propriétaire du site. Son article n’a pas été lu. Une requête de recherche ciblée Bing a été refusée par le proxy au stade CONNECT (**403**, aucun document reçu). Les autres pages du même wiki n’ont pas été multipliées, aucun miroir de contournement n’a été utilisé et aucune vérification TLS n’a été désactivée.

Un prototype peut annoncer ses règles ATB et ses valeurs comme des choix d’adaptation. Ce relevé ne permet pas de marquer les détails de tir, de chaleur, de réserve ou de détonation des six modèles comme vérifiés dans une source primaire. Une munition d’arme, une cellule de pouvoir et une fourniture multijoueur doivent conserver des états distincts ; les durées et quantités choisies pour le prototype ne deviennent pas des valeurs originales certifiées.

## Contextes des compagnons et capacités

La revue locale des catalogues retrouve les limites suivantes : Liara ME2 est une équipière temporaire de Shadow Broker ; Aria et Nyreen ME3 sont propres à Omega ; Javik relève de From Ashes/DLC ou Legendary ; Wrex combattant hors arène est limité à Citadel et à sa survie. Ces limites viennent des notices et sources secondaires conservées, et non d’une nouvelle lecture primaire des DLC.

Les fiches génériques `ME2-POW-SLAM`, `ME2-POW-REAVE`, `ME2-POW-DOMINATE` et `ME2-POW-ENERGY-DRAIN` attestent dans le catalogue le nom et l’œuvre, mais leurs descriptions « Pouvoir de ME2 » ne prouvent pas à elles seules le porteur, la loyauté requise ou le kit complet. De même, les dossiers MEA d’Omni Grenade et de Flak Cannon restent des références secondaires pour leur attribution ; le principe général des Power Cells du manuel ne remplace pas leur vérification individuelle. Une préparation d’atelier n’est ni un recrutement ni une acquisition narrative.

Cette note ne change aucun statut de contenu et n’atteste aucune campagne, mission, scène, illustration ou mécanique complète d’origine.

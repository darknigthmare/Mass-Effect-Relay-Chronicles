# Adversaires et boss — périmètre du lot arsenal

Relevé du 26 octobre 2026, base `1310a84`. Les seize fiches retenues sont `Établi` dans les catalogues existants et disponibles uniquement dans leur contexte principal ME2, ME3 ou Andromeda. Il s’agit d’un bestiaire de **bancs ATB indépendants**, avec statistiques et protections adaptées. Aucune mission, composition de rencontre, phase de boss ou statistique d’origine n’est déclarée reproduite.

## Brief du premier atlas de silhouettes

Huit identités sont proposées pour une planche de prototype, chacune dans une cellule séparée et sans confusion entre épisodes. L’ordre ci-dessous convient à une grille quatre colonnes × deux lignes. Les références de catalogue établissent les identités et certains rôles, **pas une vérification primaire des modèles 3D, palettes ou textures**. Les indications de reconnaissance servent au brief de production ; elles ne constituent pas des détails nouvellement certifiés par une capture du jeu. Aucun guide bloqué ou image inaccessible n’a été déclaré consulté.

| Cellule | Identité exacte | Fiche SPR existante | Brief de reconnaissance et exclusions |
|---|---|---|---|
| 1 | `ME2-ENM-LOKI` | `ME2-SPR-ENM-LOKI` | Méca de sécurité humanoïde ME2 : structure bipède étroite, carénage blanc/gris clair, articulations sombres apparentes, tête mécanique compacte. Aucun visage humain, uniforme Alliance, armure geth de ME1 ou robot YMIR miniature. |
| 2 | `ME2-ENM-FENRIS` | `ME2-SPR-ENM-FENRIS` | Méca quadrupède ME2 : silhouette basse de chien robot, quatre membres mécaniques, tête mécanique allongée, panneaux clairs et structure sombre. Ne pas générer une bête organique, une tourelle ou un bipède. Le nombre de pattes doit rester quatre. |
| 3 | `ME2-ENM-YMIR` | `ME2-SPR-ENM-YMIR` | Méca lourd ME2 : bipède massif, carénage clair, torse et épaules larges, membres mécaniques lourds. Silhouette nettement plus volumineuse que LOKI. Aucun cockpit de l’Atlas ME3, peau organique ou accessoire emprunté au Destroyer reliquat. |
| 4 | `ME3-ENM-ASSAULT` | `ME3-SPR-ENM-ASSAULT` | Fantassin Cerberus ME3 : humanoïde en armure claire segmentée sur sous-couche sombre, casque fermé et visière sombre/orangée. Ne pas représenter un soldat Alliance/N7, un ingénieur, une Phantom ou un personnage nommé. Arme de lecture générale seulement, sans inventer un modèle précis. |
| 5 | `ME3-ENM-HUSK` | `ME3-SPR-ENM-HUSK` | Infanterie transformée ME3 : humanoïde émacié, peau grisâtre, éléments cybernétiques et lueurs bleutées, posture hostile. Pas d’armure Cerberus, d’arme à feu attribuée au modèle ou de réemploi direct du zombie ME1 du projet. |
| 6 | `ME3-ENM-MARAUDER` | `ME3-SPR-ENM-MARAUDER` | Unité de soutien des Moissonneurs ME3 : silhouette humanoïde turienne transformée, tête à plaques/mandibules et éléments cybernétiques. Ne pas générer Garrus, son viseur personnel, un turien civil ou un Husk humain. Les détails de plaques et de matériel restent à recouper. |
| 7 | `ME3-ENM-BRUTE` | `ME3-SPR-ENM-BRUTE` | Créature lourde ME3 : silhouette énorme et voûtée, épaules et membres supérieurs massifs, carapace et chair altérée. Lecture de menace de corps à corps, sans costume humain, fusil ou silhouette de krogan compagnon en armure. Aucun nombre de pointes ou motif de carapace exact n’est certifié par ce brief. |
| 8 | `ME3-ENM-BANSHEE` | `ME3-SPR-ENM-BANSHEE` | Créature biotique ME3 : silhouette asari transformée, très grande et maigre, membres allongés, tête/crête non humaine, peau pâle altérée. Pas de Liara en armure, robe de Bénézia ou commando asari ME1. Effets biotiques discrets seulement ; ils ne livrent ni téléportation ni pouvoir animé. |

Pour la génération : sujets adultes/créatures, personnages en pied séparés, fond transparent, pas de texte ni décor ni cellules voisines. Les proportions relatives des rôles doivent rester lisibles ; une pose fixe n’est ni une animation ni une certification de taille canonique. Les boss nommés et les modèles Andromeda ne font pas partie de ce premier brief : leurs silhouettes complexes ou mécaniques demandent des références complémentaires. Les huit fiches SPR sont des cibles de production existantes, pas des preuves d’un asset livré ou terminé ; aucune promotion n’est effectuée par cette note.

## Sélection factuelle et limites des profils

Le contexte exact est `{mediaId:'ME2',periodId:'me2'}`, `{mediaId:'ME3',periodId:'me3'}` ou `{mediaId:'MEA',periodId:'mea'}`. Les prologues, le multijoueur, APEX et toutes les autres œuvres sont exclus de ces profils. Le rôle de boss n’autorise aucune fusion de plusieurs rencontres ni aucun résultat narratif.

| Fiche | Fait retenu dans le catalogue | Source(s) existante(s) | Limite explicite |
|---|---|---|---|
| `ME2-ENM-LOKI` | Méca de sécurité | `ME2-SRC-ENEMIES` | Arme et comportement original non reconstruits. |
| `ME2-ENM-FENRIS` | Méca quadrupède | `ME2-SRC-ENEMIES` | Mouvement et attaques quadrupèdes non simulés par la silhouette. |
| `ME2-ENM-YMIR` | Méca lourd | `ME2-SRC-ENEMIES` | Armement, protections et destruction d’origine non reconstruits. |
| `ME2-ENM-COLLECTOR-DRONE` | Infanterie des Collecteurs | `ME2-SRC-COLLECTOR` | Aucun fusil ou kit original complet attribué. |
| `ME2-ENM-HARBINGER` | Harbinger prend le contrôle d’hôtes | `ME2-SRC-COLLECTOR` | Hôte Collecteur seulement, jamais le vaisseau/forme physique du Moissonneur ; transfert de possession absent. |
| `ME2-ENM-PRAETORIAN` | Boss volant des rencontres Collecteurs | `ME2-SRC-PRAETORIAN` | Vol, poursuite, cycle de barrières et phases non reproduits. |
| `ME3-ENM-ASSAULT` | Fantassin Cerberus | `ME3-SRC-PHANTOM` | Pas de reconstruction de tactiques ou d’armement original. |
| `ME3-ENM-HUSK` | Infanterie transformée des Moissonneurs | `ME3-SRC-MARAUDER` | Course et attaques corporelles spécifiques absentes. |
| `ME3-ENM-MARAUDER` | Unité de soutien des Moissonneurs | `ME3-SRC-MARAUDER` | Soutien et kit propre non reproduits. |
| `ME3-ENM-BRUTE` | Unité lourde des Moissonneurs | `ME3-SRC-MARAUDER` | Charges et attaques corporelles non reproduites. |
| `ME3-ENM-BANSHEE` | Unité biotique des Moissonneurs | `ME3-SRC-MARAUDER` | Aucun pouvoir nommé ajouté sur la seule mention « biotique » ; mouvements et prises spécifiques absents. |
| `ME3-ENM-KAI` | Boss récurrent de Cerberus | `ME3-SRC-KAI` | La condition distingue Thessia et le QG ; ni ces combats ni leurs phases ne sont fusionnés/reproduits. |
| `MEA-ENM-CHOSEN` | Infanterie kett | `MEA-SRC-CHOSEN` | Banc solo `mea`, sans ouverture du multijoueur APEX. |
| `MEA-ENM-ASCENDANT` | Unité kett protégée par un orbe | `MEA-SRC-ASCENDANT` | Orbe, ciblage et protection cyclique absents ; la réserve de bouclier ATB n’en est pas une reproduction. |
| `MEA-ENM-CARDINAL` | Boss de l’installation d’exaltation | `MEA-SRC-ASCENDANT`, `MEA-SRC-GUIDE` | Condition `A Trail of Hope II` conservée ; ni phase, objectif, choix de site, mort ni récompense accordés. |
| `MEA-ENM-DESTROYER` | Machine reliquate lourde | `MEA-SRC-ASSEMBLER` | Sites reliquats seulement dans la référence ; sous-cibles et armement original non simulés. |

Les seize profils ont une liste de pouvoirs natifs vide : les notices ne rattachent pas de pouvoir nommé précis à chacun d’eux. Leur attaque de base utilise les primitives génériques du moteur ATB : l’assaut organique existant pour Husk et Brute, l’attaque standard pour les autres. Ce choix ne reconstitue ni charge, ni prise, ni arme de modèle précis ; les déplacements, armes et attaques originales sont suivis parmi les mécaniques manquantes. Les PV, boucliers, dégâts, défense et cadence sont des valeurs d’équilibrage du banc, y compris lorsque la présence exacte d’une protection n’est pas établie par la notice.

## Provenance réellement disponible

Les descriptions et leurs liens ont été **relus localement dans les catalogues générés**, sans modification de nature, statut ou disponibilité. Les sources secondaires y sont consignées comme consultées par résultats indexés le 22 octobre 2026, avec ouvertures directes Fandom limitées par robots/HTTP 402. Ce lot ne prétend pas avoir récupéré les pages complètes ou de nouvelles captures du jeu. L’existence d’une fiche `enemy_moves` extrapolée n’est pas utilisée pour attester un kit.

| Source | URL enregistrée | Portée utilisable |
|---|---|---|
| `ME2-SRC-ENEMIES` | https://masseffect.fandom.com/wiki/Prison_Guard | Index secondaire d’unités ME2 ; pas de table primaire de chiffres. |
| `ME2-SRC-COLLECTOR` | https://masseffect.fandom.com/wiki/Collector | Collecteurs et types principaux ; possession décrite dans la fiche Harbinger. |
| `ME2-SRC-PRAETORIAN` | https://masseffect.fandom.com/wiki/Praetorian | Archétype volant et pistes sur barrières/poursuite ; valeurs et phases non certifiées. |
| `ME3-SRC-PHANTOM` | https://masseffect.fandom.com/wiki/Phantom | Unité Cerberus et index du bestiaire, pas tous les kits individuels. |
| `ME3-SRC-MARAUDER` | https://masseffect.fandom.com/wiki/Marauder | Unité Moissonneur et index du bestiaire. |
| `ME3-SRC-KAI` | https://masseffect.fandom.com/wiki/Kai_Leng_%28enemy%29 | Boss Cerberus ; phases des rencontres à vérifier séparément. |
| `MEA-SRC-CHOSEN` | https://masseffect.fandom.com/wiki/Chosen | Kett et index du bestiaire. |
| `MEA-SRC-ASCENDANT` | https://masseffect.fandom.com/wiki/Ascendant | Orbe et unité kett ; le moteur ne reproduit pas encore ce dispositif. |
| `MEA-SRC-GUIDE` | https://masseffect.fandom.com/wiki/Mass_Effect%3A_Andromeda_Guide | Périmètre de campagne et mission du Cardinal. |
| `MEA-SRC-ASSEMBLER` | https://masseffect.fandom.com/wiki/Assembler | Unité reliquate et index ; kit du Destroyer non directement reconstruit. |

Les manuels officiels ME2 et ME3 déjà vérifiés dans le [relevé des portraits](chronicle-portrait-sources.md) établissent des règles générales et certaines apparences, mais pas les seize modèles ou leurs kits complets. Ils ne sont pas cités comme une validation primaire de ce bestiaire. L’Archonte final reste fermé : `MEA-ENM-ARCHON-FINAL` décrit une confrontation avec le réseau de Méridiane, ce qui ne suffit pas à créer un adversaire direct doté d’une simple barre de PV. Les variantes multijoueur, les personnages non attestés comme adversaires et les rencontres conditionnelles hors périmètre restent fermés.

## Contrat d’implémentation

`src/universe-opponents.js` expose `UNIVERSE_OPPONENTS`, `getUniverseOpponent(id, context)` et `universeOpponentFor(id, context, {instanceId}?)`. Les profils sont immuables ; le constructeur retourne une copie native indépendante, avec provenance documentaire et mécaniques manquantes séparées des chiffres ATB. Les contextes inconnus, champs d’époque ajoutés, getters, prototypes et identifiants détournés sont refusés. Les imports sont limités au registre documentaire et à la continuité : aucun cycle avec le registre d’acteurs ou le moteur de combat.

Les six nouveaux bancs sont assemblés séparément dans `src/universe-opposition-scenarios.js`, en conservant les seize anciens scénarios et les quarante-deux identités d’équipe. Les listes d’acteurs, opposants et sources y sont explicites ; aucune composition de mission canonique n’est déduite d’une simple disponibilité dans le même jeu. La sélection, les sauvegardes, les récompenses et la QA d’intégration restent sous le contrôle du composite des Chroniques.

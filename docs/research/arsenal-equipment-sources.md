# Armures et modules — complément d’arsenal

Relevé du 26 octobre 2026. Ce complément ajoute quinze profils d’armures agrégés et une famille de modules à la préparation des Chroniques. Il conserve les noms, descriptions factuelles, conditions et références des catalogues. Les statistiques, représentations et réserves du prototype ne sont pas des tables originales certifiées.

## Quinze profils d’armures supplémentaires

| Fiche | Identité conservée | Sources du catalogue |
| --- | --- | --- |
| ME2-EQP-KESTREL | Ensemble Kestrel | ME2-SRC-KESTREL |
| ME2-EQP-CERBERUS | Armure d’assaut Cerberus | ME2-SRC-EA-DLC |
| ME2-EQP-COLLECTOR | Armure des Collecteurs | ME2-SRC-EA-LE |
| ME2-EQP-TERMINUS | Armure Terminus | ME2-SRC-EA-LE |
| ME2-EQP-BLOOD-DRAGON | Armure Blood Dragon | ME2-SRC-EA-LE |
| ME2-EQP-INFERNO | Armure Inferno | ME2-SRC-EA-LE |
| ME3-EQP-AJAX | Cerberus Ajax Armor | ME3-SRC-EA-CAL, ME3-SRC-EQUIP |
| ME3-EQP-INFERNO | Inferno Armor | ME3-SRC-EQUIP |
| ME3-EQP-BLOOD-DRAGON | Blood Dragon Armor | ME3-SRC-EQUIP |
| ME3-EQP-COLLECTOR | Collector Armor | ME3-SRC-EQUIP |
| ME3-EQP-TERMINUS | Terminus Assault Armor | ME3-SRC-EQUIP |
| ME3-EQP-CERBERUS | Cerberus Assault Armor | ME3-SRC-EQUIP |
| MEA-EQP-REMNANT | Remnant Armor | MEA-SRC-REM-ARMOR |
| MEA-EQP-SCAVENGER | Scavenger Armor | MEA-SRC-SCAV-ARMOR, MEA-SRC-EA-DELUXE |
| MEA-EQP-DEEP-SPACE | Deep Space Explorer Armor | MEA-SRC-EA-DELUXE, MEA-SRC-ARMOR |

Les quatorze ensembles additionnels ne deviennent pas disponibles par simple sélection de l’œuvre. Les ateliers `me2-legendary-equipment-workshop` et `me3-legendary-equipment-workshop` déclarent explicitement un équipement Legendary préparé ; `mea-deluxe-equipment-workshop` déclare les droits et bonus Deluxe correspondants. Ces conditions décrivent un état de test, sans simulation de possession, achat, recrutement ou acquisition narrative. Les ateliers historiques refusent ces quatorze ensembles. Le contrôle lit la scène canonique, jamais un indicateur d’édition fourni dans une sauvegarde.

Remnant est accessible dans les ateliers MEA standard et Deluxe avec le même budget de protection agrégée que les variantes déjà présentes : défense +2 et bouclier +10 ATB. Aucun effet particulier de régénération, de fusion ou de technologie reliquate n’est déduit. Tous les profils d’armure restent réservés à Shepard ou Ryder, selon l’œuvre, et à leur morphologie humaine ; ils n’habillent pas les équipiers.

Les vingt-cinq armures sont des profils agrégés. N7, Kestrel ou Pathfinder ne sont pas présentés comme une reconstruction de leurs pièces séparées. Le complément ne produit ni costume, silhouette complète, animation, recette, rang, fabricant ou bonus de set original. Les quatre ports de préparation restent arme, armure et deux modules d’arme.

## Module ultraléger et limites des autres familles

`ME3-EQP-ULTRALIGHT` conserve sa fiche de famille issue de `ME3-SRC-EQUIP`. Le prototype exige une mitraillette ME3 conventionnelle à clips explicitement équipée. Les profils spéciaux, armes thermiques, autres œuvres, parent absent et deux copies de la même famille sont refusés. Remplacer l’arme libère ses modules.

Le [manuel officiel PC anglais de ME3](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf), section **Weapons, Mods, and Armor**, page imprimée 12, explique que surcharger le personnage ralentit la recharge de ses pouvoirs et que les armes ont deux ports de modules. Le passage a été relu dans l’extraction locale du PDF déjà vérifié ; les consultations et limites de cette référence sont consignées dans [le relevé des soutiens](../qa/chronicle-support-reference-report.json) et [les références visuelles](../qa/arsenal-visual-reference-report.json). Il ne donne pas le multiplicateur du prototype ni une table de compatibilité des matériaux ultralégers.

Le réglage `powerCooldownMultiplier: 0.9` est une adaptation statique et visible : la durée de recharge d’un pouvoir temporisé est multipliée une fois par 0,9. Ce n’est pas un calcul du poids original. Les dégâts, chargeurs, réserves, grenades, cellules de pouvoirs et modes de munitions sans recharge temporelle ne sont pas modifiés. La limitation aux mitraillettes est la portée prudente de ce prototype de famille, sans certification universelle des modèles ou rangs d’origine.

Les familles canon/dégâts et chargeur ME3 conservent leurs restrictions précédentes aux fusils d’assaut conventionnels. Les lunettes restent fermées : le manuel décrit notamment certaines lunettes de sniper permettant de voir à travers les fumigènes, ce qui ne justifie pas un bonus arbitraire de pénétration du couvert. Le prototype n’implémente pas cette visée ou ce filtrage des fumées.

Les fiches MEA « Mods d’armes », « Augmentations de fabrication » et « Mods de fusion » restent documentaires. Le manuel MEA distingue leurs catégories mais n’établit pas trois modèles receiver/barrel/magazine. Aucune de ces fiches génériques n’est convertie en objet nommé. Les casques et pièces ME2 restent fermés tant qu’un vrai emplacement compatible et leur effet propre ne sont pas implémentés.

## Vérification

Les tests [universe-equipment.test.js](../../tests/universe-equipment.test.js) et [universe-armor-editions.test.js](../../tests/universe-armor-editions.test.js) contrôlent les restrictions d’édition et de porteur, les imports forgés, les parents de modules, l’absence de duplication des deux ports, la sauvegarde/restauration, la protection appliquée une fois dans un vrai combat et la recharge ultralégère sans changement de dégâts ou de réserve.

Commande : `node --test tests/universe-equipment.test.js tests/universe-armor-editions.test.js`. L’état d’une exécution reste à lire dans son résultat : cette note ne transforme pas une mécanique proposée ou un raccord en attente en validation passée, ni une réussite des tests en fidélité globale 1:1.

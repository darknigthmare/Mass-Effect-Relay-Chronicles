# Équipement ME1 — sources et adaptation ATB

Vérification du 23 octobre 2026. Ce module ajoute **48 fiches jouables** : 20 armes, 16 armures et 12 modules. Les noms et les familles se réfèrent à Mass Effect 1 ; les valeurs, prix, stocks, seuils et effets détaillés ci-dessous sont l’équilibrage de Relay Chronicles. Les fiches ne certifient pas une fidélité statistique ou artistique 1:1.

## Références

| Domaine | Source consultée | Utilisation |
|---|---|---|
| Pistolets | https://masseffect.fandom.com/wiki/Pistols | Kessler, Striker, Raikou, Brawler, HMWP ; fabricants |
| Fusils d’assaut | https://masseffect.fandom.com/wiki/Assault_Rifles | Lancer, Banshee, Tsunami, Crossfire, HMWA ; fabricants |
| Fusils à pompe | https://masseffect.fandom.com/wiki/Shotguns | Storm, Hurricane, Katana, Avalanche, HMWSG ; fabricants ME1 |
| Fusils de précision | https://masseffect.fandom.com/wiki/Sniper_Rifles | Avenger, Hammer, Naginata, Punisher, HMWSR ; fabricants ME1 |
| Armures et morphologies | https://masseffect.fandom.com/wiki/Armor | Familles, fabricants et types d’espèces |
| Humains / Asari | https://masseffect.fandom.com/wiki/Human_Armor | Morphologie commune, restrictions d’armures de Kaidan et Liara |
| Turiens | https://masseffect.fandom.com/wiki/Turian_Armor | Absence d’armure lourde turienne |
| Onyx | https://masseffect.fandom.com/wiki/Onyx_Armor | Aldrin Labs et types disponibles |
| Phoenix | https://masseffect.fandom.com/wiki/Phoenix_Armor | Sirta Foundation et morphologies |
| Predator L/M/H | https://masseffect.fandom.com/wiki/Predator_L/M/H_Armor | Version Armax Arsenal pour humains, Turiens et Krogans ; distincte de Predator Hahne-Kedar |
| Modules d’arme | https://masseffect.fandom.com/wiki/Weapon_Upgrades | Dissipation thermique, bobines, extension de rail, matériaux sans friction |
| Munitions | https://masseffect.fandom.com/wiki/Ammunition_Upgrades | Perforantes, tungstène, lacérantes et phasiques |
| Modules d’armure | https://masseffect.fandom.com/wiki/Armor_Upgrades | Blindage, batterie, tissage renforcé et amortisseurs |

Les pages agrègent plusieurs épisodes : seules les sections ME1 ont servi aux associations de noms et fabricants. Par exemple, le fabricant d’un Scimitar ME1 ne doit pas être déduit de celui du M-27 de ME2. Les traductions affichées sont des libellés de travail ; leur conformité à la localisation française officielle reste à comparer au jeu.

## Règles de cette version

- Une arme, une armure, un module d’arme, un type de munitions et un module d’armure par personnage. Les emplacements d’origine à plusieurs modules ne sont pas reproduits.
- Inventaire commun : 150 objets au total, au plus 20 exemplaires d’une référence. Les objets équipés comptent dans ce total ; un exemplaire est affecté à une seule personne.
- Stocks persistants et communs au Normandy et à la Citadelle. Un achat retire un exemplaire du stock ; une vente le remet dans la limite technique de 40. Revente à 40 % du prix, arrondie vers le bas. Aucun réapprovisionnement aléatoire.
- Niveaux de personnage calculés par `floor(xp / 300) + 1` comme la campagne. Les rangs I, III, V, VII et VIII des objets ne correspondent pas à ce niveau : les déblocages 1 à 7 sont propres à l’adaptation.
- Une arme sans entraînement reste utilisable avec la moitié de son bonus de puissance, arrondie vers le bas. Les bonus de module restent complets. La table du commando est simplifiée ; la Sentinelle reçoit ici une maîtrise du pistolet sans arbre de talents.
- La catégorie intermédiaire devient accessible au niveau 4 pour les Francs-tireurs, Porte-étendards et Garrus. L’armure lourde devient accessible au niveau 5 pour les Soldats, Ashley, Jenkins et Wrex. L’Adepte, l’Ingénieur, la Sentinelle, Kaidan, Liara et Tali restent en légère.
- Les quatre armes et l’Onyx humaine de départ n’ajoutent aucun bonus : les statistiques déjà présentes dans la campagne restent la référence de base.
- Les compagnons rejoignent l’équipe avec leur profil de base ; leur recrutement ne crée pas de stock implicite. Un personnage disparu ne peut plus recevoir d’objet ; son équipement existant peut être récupéré.
- Les calibrations permanentes de l’ancienne version sont conservées et s’ajoutent aux objets. `applyLoadout` doit être appelé une seule fois sur les statistiques de base.

## Effets implantés et limites

Les objets modifient réellement la santé, les boucliers, la puissance, la défense, la chaleur des tirs, le refroidissement et la résistance aux contrôles. Les munitions peuvent augmenter les dégâts de tir contre une famille de cibles ou répartir une partie des dégâts sous le bouclier. Les pouvoirs et les dégâts périodiques ne reçoivent pas ces bonus de munitions.

Phoenix accorde ici une réserve de santé supplémentaire, sans régénération passive. Les amortisseurs utilisent la résistance générique aux contrôles du moteur, sans simulation physique propre. La dispersion, la cadence, les sons, les modèles visibles et les animations spécifiques à chaque arme restent à développer ; équiper un fusil ne transforme pas encore l’arme dessinée sur le sprite. Les armes ne reproduisent pas les variantes de tir de Legendary Edition.

## Preuves locales

- Catalogue et transactions : `src/loadout.js`.
- Interface, comparaison avant achat et récupération : `src/loadout-ui.js`, `src/loadout-ui.css`.
- Validation, migration, coûts, stock, compatibilité et absence de duplication : `tests/loadout.test.js`.
- Intégration des statistiques dans le combat : `src/game-data.js`, `src/combat.js`.
- Parcours navigateur réel : `scripts/loadout-browser.mjs` et `docs/qa/loadout-report.json` ; achat, équipement, vente, reprise automatique, export/import, restauration d’un emplacement manuel et récupération après la disparition de Jenkins. Le premier combat est remporté par la simulation ATB normale, avec temps accéléré, et mesure une chaleur de tir de 21,6 après équipement du dissipateur.
- Captures de l’interface réelle PC et mobile : `docs/screenshots/v02-equipment-loadout.png`, `docs/screenshots/v02-equipment-mobile.png` et `docs/screenshots/v02-equipment-mobile-inventory.png`.

Les tests de données ne constituent pas une validation visuelle du matériel face aux références ME1.

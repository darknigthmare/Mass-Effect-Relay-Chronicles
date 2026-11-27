# Lot 22 — Les Dettes de Nacre et prototype Armax

Date : **27 novembre 2026**. Continuation de la PR **#11**, à partir du lot21 au commit `d448b795db469b490eb0f8b4116ef19cfb202e05`.

Cette livraison ajoute une extension originale conçue autour de **110 identités**, avec **109 bases visuelles sélectionnées**, et un prototype local de combat raccordé au jeu. Les **114 PNG natifs** comprennent les bases sélectionnées et cinq versions de contrôle conservées. Les dix campagnes personnelles, les rencontres et les règles communes disposent de code exécutable ; les kits complets et la validation visuelle en jeu restent ouverts.

Le catalogue courant contient **326 fiches : 280 avec une image candidate, 46 sans image**. Les 216 fiches historiques sont conservées à l’identique ; leurs 45 manquants ne sont pas fermés par les créations originales. La fidélité artistique 1:1 certifiée reste à zéro.

## Extension originale

**Les Dettes de Nacre** se déroule dans une branche locale de 2185, avant la fin de Mass Effect 2. Une fraude transforme les billets de transit en dettes, puis les dettes en saisies de matériel et en immobilisation des passagers. Dix protagonistes remontent le réseau du **Concordat des Quais**, entre la station **Nacre**, la lune minière **Tessère** et le cargo **Lest Gris**.

Les vingt arènes suivent quatre actes : prendre pied sur la station, remonter les comptes, établir les preuves matérielles puis ouvrir une évacuation. Les routes personnelles sont des perspectives alternatives sur le même incident. Elles ne fixent aucune décision de Shepard et ne font pas intervenir les événements ou technologies d’Andromeda.

La direction artistique emploie des volumes fonctionnels, une palette ivoire/graphite/cuivre, des interfaces ambrées ou cyan et une biotique bleu-violet. Les silhouettes, protections vitales et anatomies propres aux espèces restent des contraintes de conception. Nacre est du contenu original de fan ; l’objectif de cohérence ne lui attribue aucun statut officiel.

| Famille | Conçues | Bases sélectionnées | Raccordement actuel |
| --- | ---: | ---: | --- |
| Combattants | 10 | 10 | Dix profils du prototype, coups communs et un spécial par profil |
| Arènes | 20 | 20 | Vingt décors sélectionnables, un master plat par lieu |
| Ennemis ordinaires | 20 | 20 | Vingt profils avec routine annoncée |
| Boss | 20 | 19 | Vingt profils conçus, dix-neuf visuels disponibles ; trois états de santé condensés |
| Accessoires | 20 | 20 | Bases assemblées ; pièces, états et interactions supplémentaires non livrés |
| Projectiles et FX | 20 | 20 | Bases fixes ; trois textures optionnelles raccordées au prototype |
| **Total** | **110** | **109** | Les images ne représentent pas des kits animés complets |

**Halek Orr, boss03**, reste sans PNG après un refus de génération. Aucune relance ni substitution d’identité n’est déclarée. Dans les routes, le stage03 utilise explicitement une rencontre d’avant-poste contre le **Sapeur de facturation**, avec son propre nom, son propre profil et son image ; Halek n’est pas enregistré comme vaincu.

### Les dix protagonistes

| Personnage | Espèce | Fonction de conception |
| --- | --- | --- |
| Mara Vey | Humaine | Escorte polyvalente, discipline de tir |
| Tavin Rhex | Turien | Contrôle à moyenne distance et sûreté de quai |
| Ilyra Senn | Asari | Contrôle biotique et protection des déplacés |
| Keela’Vess nar Tasera | Quarienne | Interception et ingénierie des serrures |
| Ghoran Brakk | Krogan | Lutte et percée physique |
| Neral Vesh | Drell | Mobilité, infiltration et témoignages |
| Selek Dhan | Galarien | Pièges et sabotage technique |
| Varek Hesk | Batarien | Pression au contact et rupture de garde |
| Dalo Ruun | Volus | Renfort de protection et restitution des garanties |
| Nyra Korr | Turienne | Reconnaissance et précision |

Les fiches d’auteur détaillent **90 coups normaux, 40 spéciaux, 10 supers, 10 neutralisations, les prises, assistances, provocations, costumes alternatifs et dix campagnes de huit étapes**. Ces volumes décrivent la conception. Le moteur actuel en réalise un sous-ensemble explicite.

## Gameplay ajouté

L’entrée **Armax · duel 2D** est présente sur l’écran titre et dans le menu pause. Elle ouvre une scène Three.js orthographique et une simulation séparée à **60 Hz**. Le jeu conserve ses dépendances et son architecture RPG existantes.

Le noyau gère déplacements, saut, garde haute/basse, coups légers/moyens/lourds, spécial, super, prise/déprojection, hitstop, protection avant vie, recharge, jauge et réduction des dégâts en combo. Les duels ordinaires se jouent en deux manches gagnantes de 99 secondes. Les rencontres condensées ont une manche. Pause et perte de focus suspendent la simulation et effacent les entrées maintenues.

Les boss changent d’état à 66 % puis 33 % de vie, avec annonce, annulation de leurs attaques et sans soin automatique. Les routines emploient des primitives lisibles : contact, projectile, charge physique, zone verrouillée, balayage, mine, impulsion, prise ou réserve de protection. Les machines déclarées fixes résistent au déplacement par collision, recul et déprojection. Les soixante patterns complets décrits dans la bible restent à construire.

Les dix routes enchaînent huit duels, avec un rival non létal au quatrième combat et des textes propres à chaque héros. La progression utilise une sauvegarde isolée, valide les étapes et empêche la duplication d’une victoire. Les choix narratifs avancés et les illustrations de campagne sont encore des objectifs de production.

**Commandes principales :** flèches/ZQSD/WASD, saut avec haut ou Espace, garde avec arrière ou Maj, `J/K/L/U` pour léger/moyen/lourd/spécial, `I` pour la super, `O` ou `J+K` pour la prise, Échap pour la pause. Des boutons tactiles exposent les mêmes actions. Le détail des règles, valeurs, exceptions et limites figure dans [GAMEPLAY_IMPLEMENTATION.md](GAMEPLAY_IMPLEMENTATION.md).

## Production et revue artistique

Les originaux natifs sont conservés. Les manifestes mesurent dimensions, SHA-256, transparence et limites alpha. Aucun agrandissement n’est présenté comme de l’UHD native. Les versions corrigées sont sélectionnées sous la même identité, sans augmenter le nombre de personnages, lieux ou accessoires.

Cinq révisions sont conservées : anatomie asari de Terea, identité d’Elyne, abri pressurisé du stage11, anatomie drell de Neral et cadrage du mât de l’accessoire18. Le guide officiel EA de Thane sert à vérifier l’anatomie d’espèce de Neral ; il ne lui attribue ni l’identité ni la tenue du personnage canonique.

Les armes, modules, drones ou effets encore inclus dans une base demandent une séparation avant animation. Les vingt arènes ne fournissent pas les cent couches de parallaxe prévues. Les vingt accessoires ne fournissent pas leurs 98 pièces/états, et les vingt familles FX ne fournissent pas leurs 79 phases séparées. Les vues opposées du prototype sont des miroirs, avec les limites que cela implique pour les asymétries.

## Vérification

Les **38 tests natifs ciblés** du moteur et des routes ont réussi, ainsi que la compilation de production. Les rapports portent les empreintes de leurs sources. Le [rapport de consolidation](verification-final.json) vérifie les concordances entre catalogue, fichiers natifs, code testé et classeur final. Le test de progression complète utilise volontairement des adversaires affaiblis : il vérifie la logique d’étapes, pas l’équilibrage.

La suite générale `npm test`, après restauration de 24 fichiers historiques exacts, rapporte **1 392 tests : 1 373 réussis, 19 en échec**. Les 19 traces restantes correspondent à 12 autres entrées historiques absentes de la copie locale. Aucun échec Armax n’est observé, mais la suite globale reste partiellement vérifiée. Le [rapport final de suite générale](qa/armax-full-suite-restored-report.json) conserve chaque trace et les empreintes des sources ; le [premier essai](qa/armax-full-suite-report.json) reste identifié comme historique.

**Le parcours navigateur reste non validé.** Chromium était indisponible localement et le navigateur cloud n’a pas pu joindre le serveur. Un dernier essai après remplacement de l’environnement a échoué au contrôle HTTP depuis un second processus, avant le parcours UI. Les [rapports du navigateur](qa/armax-browser-report.json) et du [dernier essai](qa/armax-browser-retry-report.json) conservent zéro contrôle UI réussi et zéro capture de duel. Les règles CSS, la compilation et les contacts d’images ne constituent pas un playtest ou une validation du rendu mobile.

```bash
python3 scripts/armax-build-runtime.py
python3 scripts/build-armax-lot22-catalog.py
node scripts/armax-verify.mjs --build
```

Le script [armax-browser.mjs](../../../scripts/armax-browser.mjs) prépare un parcours réel de l’interface, à exécuter dans un environnement disposant de Chromium. Le générateur du classeur utilise l’environnement ArtifactTool ; sa preuve de recalcul et les rendus relus sont enregistrés avec le fichier final.

## Manquants canoniques

Le périmètre historique conserve **45 fiches sans image** : 30 exclusions de relance automatique et 15 lacunes ouvertes. Les quatre pistes issues d’anciens atlas restent candidates tant que l’identité, l’opus et la variante de chaque frame ne sont pas confirmés.

La recherche a consolidé une référence primaire de géométrie du M‑920 Cain et les sources officielles du pack Ajax. Une géométrie grise ne valide pas les textures finales ; la galerie d’un pack ne prouve pas à elle seule la variante féminine d’une armure. Les obstacles précis et les références sont dans [CANONICAL_REMAINING.md](CANONICAL_REMAINING.md) et [canonical-followup.json](canonical-followup.json).

## Livrables

- [Présentation et synopsis de l’extension](../../../DLC/LesDettesDeNacre/README.md).
- [Bible des dix combattants](../../../DLC/LesDettesDeNacre/NACRE_ROSTER_BIBLE.md) et [bible des arènes, ennemis, boss, accessoires et FX](../../../DLC/LesDettesDeNacre/NACRE_WORLD_BIBLE.md).
- [Catalogue courant de 326 fiches](production-catalog.json), [associations aux guides de la bible](content-associations.json) et [manifeste des bases sélectionnées](asset-manifest.json).
- [Classeur de suivi du lot22](Mass_Effect_Armax_Nacre_Lot22_2026-11-27.xlsx).
- [Implémentation du gameplay](GAMEPLAY_IMPLEMENTATION.md), [matrice de couverture](gameplay-coverage.json) et [preuves natives](qa/armax-native-report.json).
- [Revue des boss](nacre-boss-art-review.md), [revue des accessoires](PROP_ASSET_REVIEW.md), [revue des FX](nacre-fx-art-review.md) et [revue de consolidation visuelle](ART_REVIEW.md).
- [Lot21 historique](../lot21/README.md) et [entrée de la bible intégrée](../bible/BIBLE_ARMAX_INTEGREE.md).

## Travail encore ouvert

La réalisation complète des kits, animations, hitboxes animées, directions natives, dash, tag et assistances, provocations, tournoi, manette, réseau, déblocages avancés, dangers de décor, scènes illustrées et audio final reste à poursuivre. Les critères originaux des guides sont conservés ; le lot22 ne transforme pas leur rédaction en réussite d’un test.

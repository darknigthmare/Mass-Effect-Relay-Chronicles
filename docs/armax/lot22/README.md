# Lot 22 — Les Dettes de Nacre et prototype Armax

État de preuve : **27 novembre 2026**. La PR **#11** a été fusionnée à **14:33:15 UTC**, au commit `6b761f8a`. La vérification se poursuit sur `feat/armax-lot22-verification-20261127`. La suite générale et les six cas navigateur ont réussi sur **`f2b756fd476e00c5a282345e30464966a982c02e`**, après correction du bouton « Retour » mobile. Les résultats de `859fac` et `6335856` restent historiques. Le lot21 au commit `d448b795db469b490eb0f8b4116ef19cfb202e05` reste la base historique de cette continuation.

Cette livraison ajoute une extension originale conçue autour de **110 identités**, avec **109 bases visuelles sélectionnées**, et un prototype local de combat raccordé au jeu. Les **114 PNG natifs** comprennent les bases sélectionnées et cinq versions de contrôle conservées. Les dix campagnes personnelles, les rencontres et les règles communes disposent de code exécutable ; les kits complets et la validation visuelle exhaustive en jeu restent ouverts.

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

## Pour essayer

[Télécharger Windows Portable](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46016973856/artifacts/15207573142) — archive de **770 422 138 octets**, conservée jusqu’au **27 décembre 2026** selon la rétention CI. Le mode se lance depuis **Armax · duel 2D** sur l’écran titre. Le [run de fabrication 46016973856](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/actions/runs/46016973856) a réussi ses jobs web et Windows, dont les tests, le packaging Windows et la publication des artefacts ; les [métadonnées](qa/armax-packaged-builds.json) donnent les tailles, empreintes et dates d’expiration.

Ce build provient du **main fusionné `6b761f8a`**, avec le même runtime que le premier parcours navigateur réussi sur **`859fac`**. Il n’inclut pas la dernière retouche du libellé « Retour » du sélecteur mobile, présente dans `f2b756fd`. La production de l’archive est vérifiée en CI ; aucun lancement sur du matériel Windows réel n’est revendiqué.

## Production et revue artistique

Les originaux natifs sont conservés. Les manifestes mesurent dimensions, SHA-256, transparence et limites alpha. Aucun agrandissement n’est présenté comme de l’UHD native. Les versions corrigées sont sélectionnées sous la même identité, sans augmenter le nombre de personnages, lieux ou accessoires.

Cinq révisions sont conservées : anatomie asari de Terea, identité d’Elyne, abri pressurisé du stage11, anatomie drell de Neral et cadrage du mât de l’accessoire18. Le guide officiel EA de Thane sert à vérifier l’anatomie d’espèce de Neral ; il ne lui attribue ni l’identité ni la tenue du personnage canonique.

Les armes, modules, drones ou effets encore inclus dans une base demandent une séparation avant animation. Les vingt arènes ne fournissent pas les cent couches de parallaxe prévues. Les vingt accessoires ne fournissent pas leurs 98 pièces/états, et les vingt familles FX ne fournissent pas leurs 79 phases séparées. Les vues opposées du prototype sont des miroirs, avec les limites que cela implique pour les asymétries.

## Vérification

### Sources exécutables vérifiées

Sur les sources de `859fac838f988c49b05e10c6cc529f5726eb5d5d`, les **38/38 tests natifs Armax**, les **16/16 contrôles d’entrée** et la **compilation de production** ont réussi. Les [preuves Armax](qa/armax-native-report.json) et le [contrat de routage des entrées](qa/armax-input-routing-native-report.json) portent leurs périmètres et empreintes. Le [rapport de consolidation](verification-final.json) conserve les concordances qu’il a contrôlées entre catalogue, fichiers natifs, code et classeur. Le test de progression complète utilise volontairement des adversaires affaiblis : il vérifie la logique d’étapes, pas l’équilibrage.

Les correctifs couvrent la réception des clics par le panneau Armax, la capture des flèches par le menu global et le miroir des corps/FX. Les entrées globales cèdent désormais la place au mode Armax ; les images utilisent des plans `Mesh` à échelle signée. Le parcours navigateur décrit ci-dessous confirme le déplacement et les attaques de Mara, ainsi que le miroir visible de Tavin. Il ne valide pas chaque profil ni chaque FX.

### Suite générale complète sur la révision f2b756fd

La CI sur **`f2b756fd476e00c5a282345e30464966a982c02e`** a réussi **1 393/1 393 tests**, sans échec ni test ignoré, puis la **compilation de 170 modules**. Le [rapport courant](qa/armax-ci-general-current-report.json) et son [journal brut](qa/armax-ci-general-current.log) identifient le run `46020607465`, le job `140578968871` et **onze empreintes concordant avec les sources vérifiées**. Cette exécution comprend les correctifs de clic, de routage clavier, de rendu `Mesh` et du libellé « Retour » mobile.

La suite générale et le parcours navigateur courant ont donc tous deux réussi sur `f2b756fd`. L’échec du job Shepard `140578968931` reste consigné avec son diagnostic distinct ; l’atelier Shepard est suivi séparément. Aucun succès de l’ensemble de la CI n’est déclaré.

Le résultat de **`859fac838f988c49b05e10c6cc529f5726eb5d5d`**, **1 393/1 393 tests** et compilation de **170 modules**, est conservé dans le [rapport historique 859](qa/armax-ci-general-859-report.json) et son [journal](qa/armax-ci-general-859.log), run `46016000473`. Il précède la dernière retouche CSS mobile.

L’exécution sur `6335856adb5c067625404d24f6c6f0ab2a8b56cb` avait réussi **1 392/1 392 tests** et la compilation de **170 modules**. Le [rapport historique 633](qa/armax-ci-general-633-report.json) et son [journal brut](qa/armax-ci-general-633.log) identifient le run `46014391137`. Cette preuve reste rattachée au code antérieur aux corrections de `src/main.js` et `src/armax-ui.js`.

Les essais locaux incomplets restent archivés : le [premier essai](qa/armax-full-suite-report.json) et l’[essai après restauration partielle](qa/armax-full-suite-restored-report.json) documentent les fichiers historiques absents de la copie locale. Ils constituent l’historique des blocages, distinct de la suite complète réussie en CI.

### Navigateur : six cas réussis sur f2b756fd

Le [rapport du run 46020607485](qa/ci-armax/run-46020607485/armax-browser-report.json), job `140578969050`, établit **6/6 cas réussis**, avec `errors: []` et `diagnosticErrors: []`, dans Chromium automatisé. La [provenance](qa/ci-armax/run-46020607485/provenance.json) rattache l’exécution à **`f2b756fd476e00c5a282345e30464966a982c02e`** ; ses **13/13 empreintes** concordent avec les sources vérifiées. Sept captures sont conservées avec le rapport, la provenance et le journal.

La couverture comprend le sélecteur avec **10 combattants et 20 stages**, le déplacement et une attaque avec dégâts/jauge, la pause et une perte de focus simulée, les dégâts infligés par le CPU, les commandes pointer à **390 × 844** sur le second stage, puis le retour au titre avec toutes les valeurs de `localStorage` inchangées. Les duels exercent seulement **Mara Vey et Tavin Rhex**, sur **Quai des arrivées de Nacre** et **Galerie de transit**.

Les premières captures [initiale](qa/ci-armax/run-46016000543/armax-ready-1.png), [desktop](qa/ci-armax/run-46016000543/armax-duel-desktop.png) et [mobile](qa/ci-armax/run-46016000543/armax-duel-mobile.png) ont confirmé Tavin face à Mara, un ancrage des pieds cohérent et les messages de **55 puis 90 dégâts**. Les poses restent fixes et se chevauchent visuellement au contact. Le nouveau parcours repasse les mêmes six cas ; la [sélection mobile courante](qa/ci-armax/run-46020607485/armax-selection-mobile.png), relue après correction CSS, affiche **« RETOUR » sur une ligne**, le titre entier et aucun débordement horizontal.

Ce résultat ne valide pas les autres profils ou décors, les campagnes, les boss, les ennemis, les FX individuels, les kits animés ou un téléphone réel. Les **72 identités** raccordées au prototype ne sont pas globalement certifiées en navigateur, et la certification artistique **1:1 reste à zéro**.

Le [premier succès à 6/6, run 46016000543](qa/ci-armax/run-46016000543/armax-browser-report.json), reste la preuve historique de `859fac`, avant la retouche CSS du sélecteur mobile. Les quatre essais CI antérieurs avaient chacun réussi le seul cas du sélecteur avant d’échouer : [46010749352](qa/ci-armax/run-46010749352/armax-browser-report.json), [46011849232](qa/ci-armax/run-46011849232/armax-browser-report.json), [46012230051](qa/ci-armax/run-46012230051/armax-browser-report.json) et [46014391140](qa/ci-armax/run-46014391140/armax-browser-report.json). Leurs captures de diagnostic ont révélé les défauts de réception du clic, de routage des flèches et de miroir. L’[observation de file créée à 14:49 UTC](qa/armax-browser-pending-report.json) conserve l’attente historique du premier run réussi ; elle n’en décrit pas le résultat final.

Les blocages locaux antérieurs — Chromium absent, accès cloud refusé et connexion HTTP locale impossible après remplacement de l’environnement — restent documentés comme historique, notamment dans le [rapport de reprise locale](qa/armax-browser-retry-report.json). Les règles CSS, la compilation et les planches d’images ne constituent pas un essai sur téléphone réel.

```bash
python3 scripts/armax-build-runtime.py
python3 scripts/build-armax-lot22-catalog.py
node scripts/armax-verify.mjs --build
```

Le script [armax-browser.mjs](../../../scripts/armax-browser.mjs) définit les six cas du parcours UI : sélecteur, déplacement/attaque, pause/blur simulé, IA, commandes à l’écran à 390×844 et retour au titre avec stockage préservé. Il exerce Mara/Tavin et les stages01/02 ; son résultat ne couvre pas tous les profils, décors, défis ou routes. Le générateur du classeur utilise l’environnement ArtifactTool ; sa preuve de recalcul et les rendus relus sont enregistrés avec le fichier final.

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

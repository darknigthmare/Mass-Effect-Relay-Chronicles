# Revue artistique de consolidation — lot22

État de la revue : **27 novembre 2026**. Périmètre : **109 identités originales illustrées**, 114 PNG natifs avec les versions conservées. Les vingt boss sont conçus ; Halek Orr reste sans image. Le parcours navigateur courant réussit six cas sur **`f2b756fd476e00c5a282345e30464966a982c02e`**, après un premier succès sur `859fac`. Les captures relues restent limitées à Mara/Tavin, aux stages01/02 et aux sélecteurs testés.

## Étendue de la revue

| Famille | Revue effectuée | Preuve ou réserve principale |
| --- | --- | --- |
| 10 combattants | Lecture de la planche des corps entiers ; contrôle détaillé de Neral avant/après correction | `qa/contact-fighters.jpg` ; `revision-generation-prompts.json` |
| 20 arènes | Lecture des vingt masters et du stage11 corrigé | `qa/contact-stages.jpg` ; une composition aplatie par arène |
| 20 ennemis | Lecture de la planche des vingt silhouettes | `qa/contact-enemies.jpg` ; armes/modules encore inclus dans certaines bases |
| 19 boss | Inspection des bases et de deux corrections d’identité/anatomie | `nacre-boss-art-review.md` ; modules et phases incomplets |
| 20 accessoires | Inspection des bases assemblées et de la correction du mât18 | `PROP_ASSET_REVIEW.md` ; aucune série d’états séparés |
| 20 FX | Ouverture et lecture individuelle des vingt images natives | `nacre-fx-art-review.md` ; une frame représentative par famille |

Les planches sont des compositions de contrôle à échelle réduite. Elles ne remplacent pas les PNG sources et ne constituent pas des captures du moteur. Les dimensions, SHA-256, extrema et limites alpha des bases sélectionnées sont mesurés dans `asset-manifest.json`.

## Corrections sélectionnées

- **Neral Vesh R1** : retrait de l’oreille externe humaine, membrane latérale drell nervurée et plaques crâniennes moins épaisses. La comparaison utilise la page4 du guide officiel EA de Thane. La tenue courte, la posture, le pistolet, la palette olive/cuivre et l’identité originale de Neral restent propres au projet. R0 est conservée.
- **Stage11 R1** : ajout d’une verrière et de sa structure étanche derrière le plan de combat. La mine reste visible au-dehors ; le sol horizontal est conservé. R0 est conservée.
- **Terea Soth R1** : correction de l’anatomie asari ; la base précédente est conservée dans `bosses/qa/`.
- **Elyne Korda R1** : identité visuelle distinguée de Myra Nenn, avec peau brune foncée et cheveux courts poivre et sel ; silhouette et tenue de direction conservées.
- **Accessoire18 R1** : mât entièrement cadré avec marge supérieure ; R0 est conservée comme ancienne version.

Ces cinq révisions ne créent aucune identité supplémentaire. Les prompts exacts et les choix sont consignés dans les manifestes de leurs familles.

## Observations sur les silhouettes

Le corpus utilise des vêtements et protections de fret, des matières ivoire/graphite et des accents techniques cuivre, ambre ou cyan. Les vingt ennemis proposent des gabarits reconnaissables : espèces organiques, quadrupède mécanique, drones, plateforme de charge, nacelle de brouillage et tourelle. La tourelle et la nacelle sont des machines fixes dans le prototype.

La base de l’ennemi12 inclut encore un petit drone et l’effet d’omni-outil ; la protection holographique du volus08 est aussi incluse dans son image. Ces éléments ne sont pas comptés comme des drones ou FX séparés ni comme des animations réalisées. Les armes tenues et attaches des autres corps restent à décomposer lorsque le kit final le demande.

La masse et les volumes des machines ont été conservés. Le noyau du boss14 n’inclut pas ses portes et drones autonomes. Le corps d’Elyne n’inclut pas le portique du quai. Le nombre de segments visuellement lisibles de Murène-2 ne valide pas ses six composants fonctionnels prévus.

## Lecture des décors et effets

Les arènes possèdent un plan horizontal lisible et des architectures cohérentes avec leur fonction de quai, atelier, salle de registre ou infrastructure minière. Les objets dessinés dans les fonds ne deviennent pas des collisions ou des accessoires destructibles. Les cinq couches de chaque arène restent à produire séparément.

FX01 pointe vers la droite ; le noyau de FX05 est à gauche. Le renderer applique un signe d’orientation propre à FX05. Les halos et fumées demandent un réglage d’opacité en situation ; les bounds de lecture ne doivent pas devenir des hitboxes. Les cycles d’apparition, impact et extinction restent absents des bases fixes.

## Captures du moteur : preuve courante bornée

Le [run 46020607485](qa/ci-armax/run-46020607485/armax-browser-report.json), job `140578969050`, a réussi **6/6 cas** avec `errors: []` et `diagnosticErrors: []`. Sa [provenance](qa/ci-armax/run-46020607485/provenance.json) identifie **`f2b756fd476e00c5a282345e30464966a982c02e`** et treize empreintes concordantes avec les sources vérifiées. Sept captures sont conservées. Ce parcours exerce Mara/Tavin, les stages01/02, les dix/vingt options du sélecteur, le déplacement et les dégâts, la pause/blur simulé, le CPU, les commandes pointer à 390 × 844 et le retour au titre avec `localStorage` inchangé.

Le [premier succès du run 46016000543](qa/ci-armax/run-46016000543/armax-browser-report.json), sur `859fac`, reste historique. Ses vues [initiale](qa/ci-armax/run-46016000543/armax-ready-1.png), [desktop](qa/ci-armax/run-46016000543/armax-duel-desktop.png) et [mobile](qa/ci-armax/run-46016000543/armax-duel-mobile.png) ont été relues : Tavin regarde vers Mara ; les pieds restent sur une même ligne de sol, sans coupe visible des corps. Le HUD affiche 55 puis 90 dégâts, et le duel mobile ne déborde pas horizontalement. Les poses fixes se chevauchent visuellement au contact, particulièrement dans le petit viewport. Elles ne constituent pas des attaques animées.

La [capture courante du sélecteur mobile](qa/ci-armax/run-46020607485/armax-selection-mobile.png), sur `f2b756fd`, a été relue : **« RETOUR » tient sur une ligne**, le titre est entier et aucun débordement horizontal n’est observé à **390 × 844**. La coupure du libellé visible dans la [version précédente](qa/ci-armax/run-46016000543/armax-selection-mobile.png) est corrigée. Aucune validation d’un autre corps, d’un boss, d’un ennemi, d’un FX individuel ou d’un téléphone réel n’est déduite de cette correction et des six cas repassés.

Quatre exécutions CI antérieures avaient chacune réussi le seul cas du sélecteur avant l’échec. Le [diagnostic du run 46014391140](qa/ci-armax/run-46014391140/armax-browser-report.json), sur `6335856`, montrait Tavin dans le même sens que Mara et les flèches détournées vers le focus du menu. Les correctifs de routage et les plans `Mesh` à échelle signée ont ensuite été relus ; les nouvelles captures confirment leur effet pour le duel testé. L’[observation de file de 14:49 UTC](qa/armax-browser-pending-report.json) conserve seulement l’attente historique du run.

La [suite générale courante](qa/armax-ci-general-current-report.json), sur **`f2b756fd`**, a réussi **1 393/1 393 tests** sans échec ni test ignoré, puis la compilation de **170 modules** : run `46020607465`, job `140578968871`, onze empreintes concordantes. Les **38/38 contrôles Armax** et **16/16 contrôles d’entrée** disposent aussi de leurs preuves. Ces résultats natifs restent distincts de la lecture des captures. Les résultats de [`859fac` à 1 393 tests](qa/armax-ci-general-859-report.json), de [`6335856` à 1 392 tests](qa/armax-ci-general-633-report.json) et les blocages locaux restent historiques. L’échec du job Shepard `140578968931` est consigné avec son diagnostic distinct ; l’atelier Shepard reste suivi séparément et aucun succès global de la CI n’est déclaré.

## Réserves conservées

La première lecture en jeu porte seulement sur Mara/Tavin et les deux décors testés. Les franges et voiles d’alpha faibles, les marges des machines, l’échelle et le contact des pieds des autres corps, la visibilité des attaques, les FX et les asymétries retournées en miroir restent à contrôler dans le moteur. Le rejet d’alphas faibles n’est pas une certification de détourage parfait.

La revue conclut à des **bases candidates cohérentes pour la continuation**, avec réserves explicites. Elle ne certifie ni une reproduction 1:1, ni la totalité des anatomies sous tous les angles, ni les kits animés, ni une validation exhaustive du rendu en jeu ou une approbation officielle. Les 72 identités raccordées au code ne sont pas déclarées vérifiées dans le navigateur. Les références canoniques ouvertes restent traitées dans l’audit distinct des manquants.

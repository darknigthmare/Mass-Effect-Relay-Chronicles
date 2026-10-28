# Simulation — second lot du 28 octobre 2026

Ouvrir **Chroniques → œuvre et période → Simulation**, puis choisir **Lot 2** dans **Lot de contenu**. **Tous les lots** réunit les sélections ; **Lot 1** conserve les 200 références précédentes.

Le second lot ajoute **176 références contextuelles distinctes**, dont **97 exercices exécutables** sous leurs conditions et **79 consultations fermées**. Les quotas ne remplacent pas les sources : il restait 30 équipements et 26 références de flotte admissibles, pas 40 nouvelles armures ou 40 nouvelles coques.

| Famille | Références nouvelles dans Simulation | Exercices possibles | Consultation seule |
|---|---:|---:|---:|
| Personnages et PNJ | 40 | 12 | 28 |
| Équipements et modules | 30 | 9 | 21 |
| Armes | 40 | 40 | 0 |
| Vaisseaux, véhicules et stations | 26 | 2 | 24 |
| Ennemis et boss | 40 | 34 | 6 |
| Total | **176** | **97** | **79** |

Le cumul est de **376 références**, **242 exercices** et **134 consultations fermées**. Les identifiants des deux lots sont disjoints. Ces nombres ne représentent pas des objets tous nouveaux dans les œuvres originales, des personnages uniques, des mécaniques certifiées ou des missions terminées.

## Contenu ajouté

Les personnages comprennent 33 occurrences nommées et sept archétypes APEX. Les archétypes restent limités au segment multijoueur d’Andromeda ; ils ne deviennent pas des compagnons solo. Les occurrences récurrentes, notamment Jacob et Kai Leng, ne sont pas présentées comme des personnes inédites. Douze profils permettent un exercice générique ; les civils et rôles insuffisamment décrits restent sans statistiques de combat.

Les 40 armes conventionnelles reprennent leurs propres profils d’équipement existants : dix ME2, seize ME3 et quatorze Andromeda. Chargeur et réserve viennent de l’identifiant exact. Une arme ne reçoit pas le profil d’un homonyme d’une autre œuvre. Les réserves restent finies ; ce lot n’ajoute ni acquisition, ni rang, ni équipement à un porteur de campagne. Les cadences, dispersions, modèles et valeurs originales restent incomplets.

Les 40 adversaires sont supplémentaires aux sélections précédentes et aux 16 profils historiques. Les 34 exercices ouverts utilisent des actions génériques et des paramètres ATB déclarés ; les phases et pouvoirs propres non reproduits restent signalés. Les six fermetures couvrent notamment les rencontres spéciales, les mécaniques de clone ou de réseau et les droits de contenu insuffisants. Le Dragoon reste lié au multijoueur original de ME3, absent de Legendary Edition.

La flotte compte deux parcours abstraits : l’Arcturian Jade de Galaxy et l’occurrence d’Hyperion au prologue d’Andromeda. Cela n’ajoute qu’une nouvelle identité de transport à la sélection : les occurrences d’Hyperion demeurent distinctes par segment. Dix-neuf dossiers de stations, une épave, trois améliorations Normandy et une apparence Nomad restent en consultation. Aucun pilotage, intérieur ou armement original n’est créé.

## Neuf bancs d’équipement

Les nouveaux bancs exécutent de vrais ordres du moteur sur des porteurs de test, sans modifier un personnage existant. Les pouvoirs de démonstration sont préparés avant l’essai ; un outil ou module ne les accorde à aucun personnage.

- Deux outils ME1 comparent l’effet des amplificateurs ATB existants sur une capacité déjà disponible.
- Le canon ME3 compare les dommages des tirs, avec le même parent et la même graine.
- Le chargeur ME3 compare 18 et 23 munitions chargées, en conservant le total de 90 munitions du banc.
- Les matériaux ultralégers utilisent une SMG compatible et comparent une recharge de huit et 7,2 secondes ATB.
- Deux bancs de clips ME2/ME3 transfèrent les munitions de la réserve vers le chargeur par un vrai ordre de rechargement.
- Grenades ME3 et cellules Andromeda épuisent trois charges de démonstration, refusent un quatrième ordre pourtant prêt et n’en récupèrent aucune par le temps.

Ces chiffres sont des réglages du jeu existant. La preuve primaire du principe des cellules finies ne certifie pas le nombre de charges ou le pouvoir choisi pour le banc. Les médi-gels ME2/ME3 restent fermés : le soin d’un allié conscient et le talent Spectre Unité ME1 ne reconstituent pas leur réanimation d’origine. Les familles de modules, implants et consommables non modélisés ne reçoivent pas des bonus de défense fictifs.

## Suivi et preuves

[Expansion2_Simulations.xlsx](Expansion2_Simulations.xlsx) suit les 176 références dans cinq feuilles à effectifs réels. Le statut du nouveau livrable SIM est séparé de celui du catalogue. Les 52 références source Défini désormais associées à un exercice partiel conservent leur statut d’origine ; aucune promotion de canon ou de réalisation historique n’est appliquée.

Les catalogues restent à **6 708 fiches et 454 sources**. Les anciens profils, exports, QA, sprites et règles de campagne sont conservés. Les 145 résultats natifs publiés du premier lot sont comparés intégralement aux résultats actuels, avec les mêmes graines. Il n’y a aucun transfert de recrutement, d’inventaire, de sauvegarde, de récompense ou de décision narrative.

Le [bilan de livraison](qa/expansion2-report.json) relie les [665 tests Node](qa/expansion2-unit-report.json), l’[audit natif et de conservation](qa/expansion2-native-report.json), les parcours [navigateur](qa/expansion2-browser-report.json) et [production](qa/expansion2-production-report.json), la [revue visuelle](qa/expansion2-ui-visual-review.json) et l’[audit du classeur](qa/expansion2-workbook-report.json). Les rapports du premier lot restent des preuves de leur version publiée `64c305f`.

```bash
npm test
npm run build
node scripts/audit-expansion2.mjs
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium GAME_URL=http://127.0.0.1:4173 node scripts/expansion2-browser.mjs
```

Les modèles, animations, sons, kits et phases complets d’origine restent à produire ou à vérifier. **Aucune fidélité intégrale 1:1 n’est certifiée par ce lot.**

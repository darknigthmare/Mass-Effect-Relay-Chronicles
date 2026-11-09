# Horizon — coques de vaisseaux

Base de travail : `2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75`. Le lot produit huit **dessins extérieurs fixes** dans deux atlas RGBA natifs 1536 × 1024. Il ne crée pas de pilotage spatial, d’armement, d’intérieur complet, de modèle 3D ou d’échelle commune.

| Atlas et région | Identité et contexte | Liaison documentaire ou campagne |
|---|---|---|
| `horizon-fleet-me1.png`, haut gauche | Normandy SR-1, ME1 | Dossier de campagne ; projection de reconnaissance dans les placements ME1 autorisés |
| Même atlas, haut droite | Sovereign, ME1 | Identification après Virmire ; projection réservée au final, retirée après sa conclusion |
| Même atlas, bas gauche | Destiny Ascension, ME1 | Projection à la Citadelle après son enquête, retirée après le final quel que soit le choix Conseil |
| Même atlas, bas droite | Transport geth, ME1 | Après le briefing, dans les placements d’Eden Prime et Thérum |
| `horizon-fleet-later.png`, haut gauche | Normandy SR-2 Cerberus, ME2 | Référence extérieure associée à `ME2-ZON-NORMANDY-CIC`, segment `me2` |
| Même atlas, haut droite | Normandy SR-2 Alliance, ME3 | Référence extérieure associée à `ME3-ZON-NORM-CIC`, segment `me3` |
| Même atlas, bas gauche | Tempest, Andromeda | Référence extérieure associée à `MEA-ZON-TEMPEST-BRIDGE`, segment `mea` |
| Même atlas, bas droite | Hyperion, Andromeda | `MEA-WRL-HYPERION` en `mea`, ou `MEA-MQ-HYPERION` en `mea-prologue` |

Les identifiants larges de production ME2/ME3 et les kits 3D MEA restent associés aux images dans les données, mais leurs fiches actuellement fermées ne sont pas forcées ouvertes. Les quatre coques ultérieures n’ont aucun placement dans la campagne ME1. Elles ne deviennent ni véhicules équipables ni acteurs de combat.

## Références réellement inspectées

Le [manuel officiel ME1 Xbox 360 anglais](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf) a été de nouveau téléchargé : 1 701 003 octets, seize pages, SHA-256 `f09cbe3dae03b652299d63f6b4c9340b8d0a9bf4df8b92b83e9bd9545dbceb44`. Le JPEG natif de la page PDF 3, 560 × 284, porte le nom NORMANDY et a été extrait sans retouche puis réellement ouvert. Son SHA-256 est `60d20277ffb248af32acafd5b66f0fa59347c637b8d27b8d8407aabebee10592`. Il montre un angle du SR-1 ; il ne prouve pas toutes ses proportions ou faces.

Les atlas historiques `vehicle-atlas.png` et `arsenal-fleet.png` ont été ouverts comme références de style. Ils sont eux-mêmes des prototypes générés, et ne sont pas de nouvelles sources canoniques. Les deux nouveaux prompts et leurs chemins réellement fournis au générateur sont conservés dans [horizon-fleet-prompts.json](horizon-fleet-prompts.json).

Aucune vue primaire complète fraîchement obtenue ne certifie les sept autres coques. Les silhouettes, modules, détails de livrée et proportions demeurent interprétés ; `primaryVisualVerified:false` et `Prototype` restent explicites. La référence générale EA du catalogue n’atteste pas à elle seule les détails de Destiny Ascension ou du transport geth. Les deux nouvelles fiches SPR de ces sujets sont des livrables d’illustration, sans création implicite d’une mission ou d’un système de vol.

## Production et contrôles

Les deux PNG sont des copies byte à byte des sorties `image_gen.imagegen`, avec les données de provenance intégrées conservées. Aucun pixel n’a été retouché. Les fichiers sources restent dans `/workspace/generated_images/` ; les métadonnées JSON distribuées gardent leurs chemins et empreintes.

Le cadrage réel est mesuré sur l’alpha ≥ 8, avec huit pixels de marge autour de chaque coque. Les rectangles restent dans leurs quadrants et ne se chevauchent pas. Les faibles pixels alpha 1–7 hors corps restent dans les images natives. Le renderer peut employer son seuil d’alpha habituel ; le découpage inclut déjà toutes les silhouettes visibles à ce seuil.

Les deux atlas ont été affichés à 1:1 pixels sur un vrai damier CSS, puis leurs huit régions à 280 × 180 maximum. Les quatre captures ont été réellement ouvertes. Toutes les pointes et nacelles restent dans le cadre ; les coques sont distinctes sans région voisine ou fond peint visible. Les deux SR-2 partagent une forme de coque avec livrées distinctes. Les grandes différences d’échelle entre arche, Moissonneur et frégates ne sont pas représentées par les cellules égales.

Preuves : [technique ME1](../qa/horizon-fleet-me1-art.json), [technique autres périodes](../qa/horizon-fleet-later-art.json), [collecte native](../qa/horizon-fleet-native-report.json), [revue réellement ouverte](../qa/horizon-fleet-native-visual-review.json). Une première collecte avant le dernier renforcement des gardes de contexte est conservée séparément ; ses quatre captures sont byte-identiques au passage final. Ces preuves sont distinctes des captures ultérieures en jeu. La [qualification finale](../qa/horizon-fleet-final-qualification.json) relie ces images inchangées au module final : seules deux descriptions lore et le retrait monde de Sovereign/Destiny après finale ont changé depuis le rendu natif. Les tests de portes et ceux du renderer sont rapportés séparément ; aucune nouvelle génération n’est revendiquée pour ces captures conservées.

## Contrats d’intégration

`src/horizon-fleet.js` contient les identités et gardes pures. `normalizeHorizonFleetAtlas(familyId,input)` valide `me1` ou `later`, fichiers locaux exacts, dimensions, empreinte et quatre cadrages connus. `getHorizonFleetFrame(id,atlases)` accepte la carte des deux familles normalisées ou un atlas unique, et renvoie le rectangle, pivot, fichier et dimensions. Les cadrages sont embarqués par Vite ; aucun fetch JSON runtime n’est requis.

La liste du Codex de campagne appelle `listHorizonFleet(context,state)` ; la projection en monde appelle `canShowHorizonFleet(id,context,state,zoneId)`. Les quatre repères sont explicitement des hologrammes bleus avec socle, anneau lumineux et légende « PROJECTION DE RECONNAISSANCE », pour que leur taille locale ne prétende pas représenter des coques physiques miniatures. Le socle et la coque se masquent ensemble en combat, hors contexte, si les dimensions de l’atlas diffèrent ou quand la porte narrative se ferme. Sovereign et Destiny Ascension sont retirés du monde après `citadel-finale` ; leurs dossiers historiques restent consultables. Les états et contextes étrangers ferment ces usages. Les conditions reposent sur le briefing et les étapes Citadelle/Virmire effectivement conservées, sans année universelle extrapolée.

`src/horizon-fleet-reference.js` est séparé pour rester chargé avec l’interface documentaire. Son adaptateur vérifie `canAccessContent(recordId,context)` avant de renvoyer une illustration. Les fiches de CIC/pont sont légendées « Vaisseau associé à ce lieu » ; leur intérieur n’est pas déclaré reconstruit. La consultation ne modifie pas d’état, d’inventaire, de progression ou de statistiques. Les segments d’ouverture de ME2, multijoueur et APEX ne donnent pas accès à des coques absentes de ces segments.

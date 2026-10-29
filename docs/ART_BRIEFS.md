# Briefs artistiques des assets générés

Ces briefs résument les demandes de génération. Ils définissent une intention artistique, pas une validation de fidélité ni une garantie de résultat reproductible à l’identique.

## Ligne commune

Sprites en rendu précalculé HD, proportions adultes réalistes, silhouettes lisibles, matériaux détaillés, lumière cohérente et fond transparent. Éviter les proportions chibi et la pixelisation volontaire. Les briefs historiques de sprites en pied demandent un sujet entier avec un espace de séparation ; les bustes et illustrations fixes des Chroniques ont un cadrage partiel distinct. Les personnages de ME1 doivent porter leurs tenues de l’époque : Normandy SR-1, Garrus sans les cicatrices des épisodes suivants, Tali nar Rayya, Liara dans une tenue correspondant à sa première aventure.

## Commando

Planche 4 × 2 : Shepard masculin en armure N7 sombre à bande rouge/blanche, Ashley en armure claire rosée, Kaidan en armure Alliance sombre, Jenkins ; Garrus bleu, Tali violette, Wrex rouge, Liara claire. Poses debout en trois-quarts, échelle et pieds cohérents. Le résultat constitue une base de silhouette, à comparer aux modèles de référence.

## Bestiaire

Planche 4 × 2 : soldat geth, zombie, tireur geth, destructeur geth, mercenaire krogan, soldat rachni, rampant du Thorien, commando asari. Silhouettes distinctes, anatomie reconnaissable, mêmes conventions de lumière et de caméra. Les variations organiques générées restent à contrôler avec les références ME1.

## Boss

Planche 2 × 2 : Saren Arterius turien cybernétique, Matriarche Bénézia avec coiffure et longue tenue, organisme végétal du Thorien, Saren sous sa forme synthétique squelettique. Montrer le corps complet et distinguer nettement les quatre silhouettes. Le rendu actuel de Bénézia et les détails de Saren demandent une revue artistique avant toute validation canonique.

## PNJ

Planche 4 × 2 : Shepard féminine, Anderson, Joker, Chakwas ; Nihlus, Udina, Kirrahe, Emily Wong. Uniformes et équipements inspirés de ME1. Les poses demandées étaient debout ; les usages assis ou cinématiques nécessitent des images supplémentaires.

## Véhicules et machines

Quatre sujets isolés : Normandy SR-1, Mako M35 à six roues, armature geth, Sovereign. Vue trois-quarts lisible ; l’échelle est adaptée à chaque cellule et ne représente pas la taille relative des objets. Le résultat possède des frontières irrégulières, compensées pour les images actuellement intégrées par des rectangles UV spécifiques.

## Props

Seize objets de science-fiction : rangements, consoles, ravitaillement, couvertures, générateurs, mobilier de Citadelle, éléments agricoles, débris, contenants et terminal prothéen. Ces objets habillent les décors et ne sont pas tous des reproductions d’un prop canonique identifié.

## Marche Shepard

Référence d’identité : Shepard de l’atlas commando. Demande de seize poses, quatre directions et quatre phases de marche par direction, sans arme en main. Le résultat a été relu : avant / arrière en trois-quarts, profil droit puis profil gauche. L’ordre réel est utilisé dans le jeu. Les variations entre frames et l’ancrage demandent encore un nettoyage.

## Illustration Citadelle

Vue conceptuelle d’un RPG 2D/3D : passerelles, architecture blanche, jardins et profondeur atmosphérique, avec un commando reconnaissable. Utilisée comme illustration d’accueil. Ce visuel n’est pas une capture du renderer du jeu et n’atteste pas la géométrie de la carte jouable.

## Arsenal des Chroniques — 26 octobre 2026

Ce complément couvre neuf familles visuelles : personnages, boss, ennemis, PNJ, costumes, armes, modules, véhicules et vaisseaux. Les résumés ci-dessous décrivent l’intention et la composition livrées ; ils ne prétendent pas reproduire mot pour mot les prompts de génération. Le [manifeste publié](../public/assets/arsenal-visuals.json) conserve les associations exactes, cadrages, références et empreintes. Les quatre sorties RGBA mesurent 1536 × 1024 et contiennent **24 illustrations fixes partielles**, sans retouche de pixels. La disposition des adversaires a été corrigée par une nouvelle génération.

| Atlas | Intention et composition, de gauche à droite puis de haut en bas |
|---|---|
| `arsenal-people.png` | Bustes distincts de Mordin, Tali, Legion et Samara ME2 ; références de PNJ Aria ME2 et Traynor ME3. Identité et costume limités à l’œuvre concernée, sans convertir les PNJ en équipiers. |
| `arsenal-opponents.png` | Silhouettes séparées de LOKI, YMIR et Praetorian ME2, puis Kai Leng, Brute et Banshee ME3. La taille de cellule ne fixe pas leur échelle relative et l’image ne fournit pas leurs animations ou phases de boss. |
| `arsenal-equipment.png` | Vindicator ME3, Arc ME3 et costume Inferno ME2, puis costume Terminus ME3, famille canon et famille chargeur ME3. Objets isolés avec des cadrages mesurés, sans rang, fabricant ou géométrie originale certifiés par la génération. |
| `arsenal-fleet.png` | Mako ME1, Nomad Andromeda et Hammerhead ME2, puis Normandy SR-1 ME1, Normandy SR-2 ME2 et Tempest Andromeda. Références documentaires uniquement ; aucune échelle commune, fonction de pilotage ou animation n’est produite. |

L’atlas d’équipement ne suit pas une grille entièrement régulière. Six rectangles `[x, y, largeur, hauteur]` diffèrent de 512 × 512 : Vindicator `[0, 0, 620, 500]`, Arc `[620, 0, 404, 512]`, Inferno `[1024, 0, 512, 540]`, Terminus `[0, 508, 512, 516]`, canon `[512, 540, 512, 484]` et chargeur `[1024, 540, 512, 484]`. Les autres atlas utilisent dix-huit cellules de 512 × 512. Le rendu découpe chaque région SVG sans afficher la cellule voisine.

Ces images complètent les trois bustes historiques de Miranda ME2, Thane ME2 et Garrus ME3, qui gardent leur priorité. Elles ne remplacent pas l’apparence choisie pour Shepard et ne réattribuent pas une silhouette ME1 à un homonyme d’une autre œuvre. Le contexte exact et l’autorisation de scénario restent requis pour les usages de groupe ou de combat ; la présence dans le registre ne les accorde pas.

Les [sources primaires inspectées](research/arsenal-visual-sources.md) donnent des repères limités : vues nommées du manuel, captures et couvertures, sans dossiers géométriques complets pour chaque sujet. Les deux références ME1 ajoutées pour le Mako et le Normandy SR-1 établissent seulement leur existence et leur vue nommée dans le manuel Xbox 360. Les détails non attestés restent des interprétations. Le manifeste indique `partial: true`, `primaryVisualVerified: false` pour les 24 entrées et `globalFidelityCertified: false`.

Chaque sujet demande encore une comparaison primaire de silhouette, visage, costume, couleurs, proportions et équipements. Aucun modèle complet, vue arrière, huit directions, mouvement corporel ou animation de véhicule n’est livré par ce lot. Les huit armes fonctionnelles et quinze protections ajoutées au moteur ne sont pas autant de nouveaux modèles visuels ; seules les six images d’équipement listées ici sont livrées. Le [parcours arsenal](qa/arsenal-browser-report.json) vérifie les 24 illustrations ; les [revues de génération](qa/arsenal-generated-art-review.json) et [d’interface](qa/arsenal-ui-visual-review.json) conservent leurs limites. La [production HTTP](qa/arsenal-production-report.json) charge les quatre nouveaux atlas avec réponse 200 et empreintes exactes, parmi quinze PNG et sept bundles servis. Les contrôles d’interface et de cadrage ne certifient pas une fidélité 1:1. Les [six réserves bibliographiques](qa/arsenal-source-reservations.json) restent distinctes des quelques faits corroborés par le [manuel ME3](qa/arsenal-additional-source-check.json) ; aucun kit complet ou détail d’image n’en est certifié.

## Combat Shepard masculin — 29 octobre 2026

Dériver quatre poses de la référence de marche masculine : visée au fusil générique, geste de pouvoir sans effet incorporé, recul d’impact et corps couché, tête à gauche. Conserver les proportions adultes, le visage et les cheveux courts, l’armure graphite N7 à bandes rouges/blanches et la lumière douce. Demander des corps entiers séparés sur un atlas transparent 1536 × 1024. Une seconde requête vise les halos extérieurs ; la sortie retenue conserve quelques pixels de faible opacité et varie légèrement dans les détails.

Les [prompts exacts](research/shepard-male-combat-prompts.json) et la [provenance du lot](research/shepard-male-combat-art.md) conservent les deux générations, l’empreinte du fichier livré et les limites. Les rectangles réellement obtenus sont mesurés séparément, sans retouche de pixels. Il s’agit de quatre poses clés fixes en trois-quarts, sans cycle animé complet, variante exacte d’arme ou fidélité 1:1 certifiée.

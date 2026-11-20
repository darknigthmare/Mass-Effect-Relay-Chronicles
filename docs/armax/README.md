# Armax Relay Clash — production du mode annexe de combat

Cette annexe conserve la production artistique du mode de combat 2D de Mass Effect — Relay Chronicles. Les PNG, les compléments de bible et les exports restent accompagnés de leurs références, de leur provenance et de leurs réserves.

## Nouveau lot 06

Le [lot 06](lot06/README.md) ajoute **six images** : Balak ME1, Jack AAP1, Miranda AAP2, Tali AAP2, le hangar du Normandy SR-2 ME3 et Sur’Kesh. Avec les 86 originaux récupérés ci-dessous, cette livraison contient **92 originaux distincts**. Le [catalogue de continuation](lot06/MANQUANTS_2026-11-20.md) et le [classeur courant](lot06/Mass_Effect_Armax_Suivi_Lot06_2026-11-20.xlsx) suivent 101 fiches, dont six avec image candidate et 95 encore sans image.

## Reprise du 20 novembre 2026

**86 PNG originaux distincts** ont été retrouvés : 65 déjà organisés et 21 sorties supplémentaires. Le [rapport de récupération](recovery-20261120/README.md) et le [manifeste courant](recovery-20261120/asset-inventory.json) donnent le détail. Chaque original garde ses pixels et son SHA-256. Ces récupérations ne sont pas comptées comme de nouvelles générations de cette reprise.

| Ensemble | Contenu | Accès |
|---|---|---|
| Lot03 | 29 originaux : 26 retenus historiquement et trois versions remplacées ; 16 personnages, quatre poses de Shepard, six arènes parmi la sélection | [Dossier](lot03/README.md), [catalogue HTML](lot03/Catalogue_Lot03.html), [bible](lot03/Bible_Complement_Lot03.md) |
| Lot04 roster | Neuf originaux, dont six prototypes retenus et trois essais | [Dossier](lot04/README.md), [bible](lot04/BIBLE_EXTENSION.md) |
| Complément lot04 | 16 originaux : Saren, Grunt, poses Shepard et études de couches Illium | [Récupération](recovered-lot04-art/README.md) |
| Continuation | Onze originaux : Grunt, drone de Legion, composition et plans de Port Hanshan | [Dossier](../combat-2d/README.md) |
| Sorties supplémentaires | Quatre poses neutres lot04 et 17 gardes/révisions lot05, dont les dix sorties postérieures au classeur | [Inventaire](recovery-20261120/asset-inventory.json) |

La liste des personnages disponibles inclut maintenant Sara et Scott Ryder, Aria, Jack ME3, Tali, Liara, Garrus, Thane, Mordin et Shepard masculin retrouvés dans les dernières sorties. Les corps de Balak, EDI, Kai Leng, Legion et Wrex étaient absents avant les générations de la reprise courante. Jack ME2 reste un costume distinct de la version ME3 récupérée.

## Archives et suivi

Le [classeur historique de consolidation](recovery-20261120/history/Mass_Effect_Armax_Consolidation_2026-11-20.xlsx) est conservé comme provenance. Son décompte de 72 PNG précède 14 récupérations supplémentaires. Les lots01/02 et la bible originale de 99 pages ne sont pas retrouvés.

L’[ancien inventaire](local-import-inventory.json) et les journaux restent historiques. Le ZIP du lot03 n’est pas dupliqué dans cette PR : les fichiers dépliés et les 29 originaux sont présents. Les liens vers l’archive dans les anciennes fiches décrivent la livraison passée ; la consultation actuelle passe par les fichiers dépliés. Les caches d’images et documents tiers ne sont pas incorporés au dépôt.

## Statuts et vérification

Les statuts de fichier, revue visuelle, intégration et fidélité restent distincts. Aucune image fixe ne valide un clip complet ; les masters et études de plans ne certifient pas une arène jouable ou une parallaxe complète. Aucun personnage ni décor n’est certifié 1:1 dans cet inventaire.

Depuis la racine du dépôt :

```bash
python scripts/verify-armax-recovery.py
```

Ce contrôle vérifie les 86 originaux, leur unicité, les empreintes et dimensions PNG. L’ancien `docs/armax/tools/verify_assets.py` reste la commande historique du lot03 avec son ZIP ; il n’est pas le vérificateur de cette publication sans archive redondante.

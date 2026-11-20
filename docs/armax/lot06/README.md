# Armax — lot 06, personnages, costumes et stages

Reprise du 20 novembre 2026. Ce lot ajoute **six images originales** aux **86 PNG récupérés**, soit **92 originaux distincts** pour cette livraison. Les aperçus de contrôle ne sont pas compris dans ce total.

## Productions de cette reprise

| Catégorie | Sujet et version | Sortie |
|---|---|---|
| Personnage | Balak, ME1 — Bring Down the Sky | [Corps entier, pose initiale](../../../public/assets/armax/lot06/fighters/balak-me1-guard-right.png) |
| Costume | Jack, ME2 — Alternate Appearance Pack 1 | [Garde en pied](../../../public/assets/armax/lot06/costumes/jack-me2-aap1-guard-right.png) |
| Costume | Miranda Lawson, ME2 — Alternate Appearance Pack 2 | [Pose neutre en pied](../../../public/assets/armax/lot06/costumes/miranda-me2-aap2-neutral-right.png) |
| Costume | Tali’Zorah, ME2 — Alternate Appearance Pack 2 | [Pose neutre en pied](../../../public/assets/armax/lot06/costumes/tali-me2-aap2-neutral-right.png) |
| Stage | Normandy SR-2, ME3 — baie des navettes | [Composition complète](../../../public/assets/armax/lot06/stages/normandy-sr2-me3-shuttle-bay-master.png) |
| Stage | Sur’Kesh, ME3 — plateforme GSI | [Composition complète](../../../public/assets/armax/lot06/stages/surkesh-me3-stg-platform-master.png) |

Chaque PNG de personnage ou de costume contient une figure entière et une pose. Les images originales sont conservées sans transformation des pixels. Les sprites sont des PNG RGBA ; les deux décors sont des PNG RGB de 1672 × 941 pixels. Les cadrages, pivots et échelles devront être harmonisés lors de l’intégration.

## Catalogue et classeur

Le [catalogue de continuation](MANQUANTS_2026-11-20.md) définit **101 fiches** : 38 personnages, 24 costumes et 39 stages, avec opus, DLC, variantes, références, priorités et rôles proposés. Six fiches disposent maintenant d’une image candidate. **95 restent sans image** dans ce périmètre : 37 personnages, 21 costumes et 37 stages.

- [Classeur de suivi](Mass_Effect_Armax_Suivi_Lot06_2026-11-20.xlsx) : synthèse, catalogue filtrable et 86 originaux récupérés.
- [Source éditable du catalogue](production-catalog.json).
- [Inventaire des 86 originaux antérieurs](../recovery-20261120/asset-inventory.json).
- [Rapport de récupération](../recovery-20261120/README.md).

Ce catalogue prolonge les lots retrouvés. Il ne revendique pas le recensement de chaque apparition de toute la licence. Les images de la campagne RPG, les portraits et les corps du mode annexe conservent leurs périmètres distincts. Les lots 01/02 et la bible originale de 99 pages restent non retrouvés.

## Références et fidélité

Les costumes ME2 utilisent les planches promotionnelles des packs AAP1/AAP2 et leurs descriptions officielles. Balak est ancré dans la rencontre X57 de ME1. Les décors utilisent des captures du bon jeu. Les sources et réserves sont inscrites dans les [costumes](costumes-manifest.json), le [personnage supplémentaire](fighters-extra-manifest.json) et les [stages](stages-manifest.json).

La fidélité 1:1 demeure l’objectif de comparaison. Les six nouvelles images sont au statut **Prototype**. Le bas du costume de Balak est extrapolé à partir d’une référence montrant surtout la tête et le torse. Les détails des visages, tatouages, motifs et armures des costumes restent à vérifier contre les modèles finaux. Le cadrage des décors est adapté au duel ; les deux masters sont aplatis et n’incluent pas encore de couches de parallaxe distinctes.

Onze demandes ont été effectuées pour ce lot : **six fichiers produits et cinq refus sans fichier**. Legion, IDA/EDI, Wrex, Garrus AAP1 et Kai Leng restent à produire. Les journaux ne comptent aucun refus comme une livraison : [tentatives principales](generation-attempts.json), [personnages supplémentaires](fighters-extra-attempts.json), [prompts des stages](stages-generation-prompts.json).

## Vérifier et actualiser

Les contrôles de récupération et de cohérence du nouveau catalogue sont distincts des revues artistiques et du jeu :

```bash
python scripts/verify-armax-recovery.py
python scripts/verify-armax-lot04.py
python scripts/verify-combat-2d-assets.py
python scripts/verify-armax-lot06.py --report docs/armax/lot06/verification.json
```

Le vérificateur lot04 reconnaît les quatre fichiers récupérés ultérieurement via leur inventaire et leur SHA-256, sans modifier les six sélections historiques. Le classeur se régénère avec `scripts/build-armax-followup-workbook.mjs` dans le runtime principal et avec `@oai/artifact-tool`, selon les mêmes prérequis que les autres exports du projet.

La présence des fichiers et les formules du classeur ne valident pas les animations, le mode versus, les hitboxes ni la fidélité artistique. Les rapports de cette passe sont [verification.json](verification.json), [verification-imports.json](verification-imports.json) et [workbook-verification.json](workbook-verification.json).

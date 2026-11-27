# Armax — réconciliation du guide original et des extensions

**27 novembre 2026.** Base : `231ffde14652932ffaa667c40315f1232f802d4a`, PR #11. Les trois originaux ont été récupérés intégralement et vérifiés par SHA-256 ; voir le [manifeste des sources](../guides/source-manifest.json). La passe précédente disposait d’une adaptation structurée du guide général mais ne livrait pas son TXT brut. Cette lacune de provenance est désormais comblée.

## Résultat de comparaison

Les 30 anciennes rubriques ARMAX-G00…G29 correspondent dans le même ordre aux sections 00–29 du fichier original. Leurs titres étaient abrégés ; aucun décalage de numérotation ni remapping d’identité n’est nécessaire. Les **30 objets et 90 critères de guide-associations.json restent inchangés**, ainsi que common-rules.json. La nouvelle [matrice de 68 sections](guide-coverage-2026-11-27.json) cite les titres exacts, les bornes des sections dans les originaux et leur empreinte, puis ajoute 38 rubriques documentaires et 114 critères.

L’ancien guide-associations.json est un **snapshot historique**. Son sous-objet contentAssociationIndex décrit encore le lot 16/192 fiches et ne fait pas autorité pour le suivi courant. Utiliser [content-associations.json](content-associations.json) et le catalogue de production qu’il référence. Conserver une ancienne empreinte n’autorise pas à réutiliser ses chiffres comme bilan du lot 19.

## Correspondance vérifiée du général

| Source | Titre exact du corps du guide | Association conservée | Constat |
|---|---|---|---|
| 00 | UTILISATION DU GUIDE ET PRIORITÉS | [ARMAX-G00](BIBLE_ARMAX_INTEGREE.md#g00) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 01 | IDENTITÉ DU PROJET ET PÉRIMÈTRE | [ARMAX-G01](BIBLE_ARMAX_INTEGREE.md#g01) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 02 | FIDÉLITÉ AU LORE ET SOURCES | [ARMAX-G02](BIBLE_ARMAX_INTEGREE.md#g02) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 03 | ROSTER, PERSONNAGES, VARIANTES ET COSTUMES | [ARMAX-G03](BIBLE_ARMAX_INTEGREE.md#g03) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 04 | FONDATIONS DU SYSTÈME DE COMBAT | [ARMAX-G04](BIBLE_ARMAX_INTEGREE.md#g04) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 05 | MOVESETS, COUPS SPÉCIAUX ET RESSOURCES | [ARMAX-G05](BIBLE_ARMAX_INTEGREE.md#g05) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 06 | ULTIMES, FINISHERS ET CONCLUSIONS DE COMBAT | [ARMAX-G06](BIBLE_ARMAX_INTEGREE.md#g06) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 07 | PRÉSENTATION ET RELATIONS ENTRE PERSONNAGES | [ARMAX-G07](BIBLE_ARMAX_INTEGREE.md#g07) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 08 | HISTOIRE INDIVIDUELLE DE CHAQUE PERSONNAGE | [ARMAX-G08](BIBLE_ARMAX_INTEGREE.md#g08) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 09 | CAMPAGNE GLOBALE DISTINCTE | [ARMAX-G09](BIBLE_ARMAX_INTEGREE.md#g09) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 10 | ILLUSTRATIONS ET CINÉMATIQUES NARRATIVES | [ARMAX-G10](BIBLE_ARMAX_INTEGREE.md#g10) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 11 | BOSS, MACHINES ET BOSS RUSH | [ARMAX-G11](BIBLE_ARMAX_INTEGREE.md#g11) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 12 | MODES DE JEU | [ARMAX-G12](BIBLE_ARMAX_INTEGREE.md#g12) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 13 | ARÈNES : LIEUX, COMPOSITION ET LISIBILITÉ | [ARMAX-G13](BIBLE_ARMAX_INTEGREE.md#g13) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 14 | ARÈNES VIVANTES, STATIQUES ET ÉVÉNEMENTS | [ARMAX-G14](BIBLE_ARMAX_INTEGREE.md#g14) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 15 | ARÈNES CONNECTÉES, TRANSITIONS ET INTERACTIONS | [ARMAX-G15](BIBLE_ARMAX_INTEGREE.md#g15) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 16 | ENNEMIS, SOUTIENS, VÉHICULES ET PROJECTILES | [ARMAX-G16](BIBLE_ARMAX_INTEGREE.md#g16) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 17 | DIRECTION ARTISTIQUE ET PRODUCTION DES ASSETS | [ARMAX-G17](BIBLE_ARMAX_INTEGREE.md#g17) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 18 | ANIMATIONS, VFX, SON ET CAMÉRA | [ARMAX-G18](BIBLE_ARMAX_INTEGREE.md#g18) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 19 | INTERFACE ET EXPÉRIENCE UTILISATEUR | [ARMAX-G19](BIBLE_ARMAX_INTEGREE.md#g19) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 20 | TUTORIELS, ENTRAÎNEMENT ET APPRENTISSAGE | [ARMAX-G20](BIBLE_ARMAX_INTEGREE.md#g20) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 21 | IA ET DIFFICULTÉ | [ARMAX-G21](BIBLE_ARMAX_INTEGREE.md#g21) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 22 | ÉQUILIBRAGE ET ACCESSIBILITÉ | [ARMAX-G22](BIBLE_ARMAX_INTEGREE.md#g22) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 23 | MULTIJOUEUR, RÉSEAU ET REPLAYS | [ARMAX-G23](BIBLE_ARMAX_INTEGREE.md#g23) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 24 | PROGRESSION, SAUVEGARDES ET REJOUABILITÉ | [ARMAX-G24](BIBLE_ARMAX_INTEGREE.md#g24) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 25 | ORGANISATION, INVENTAIRES ET STATISTIQUES | [ARMAX-G25](BIBLE_ARMAX_INTEGREE.md#g25) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 26 | CRITÈRES DE VALIDATION ET ORDRE DE PRODUCTION | [ARMAX-G26](BIBLE_ARMAX_INTEGREE.md#g26) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 27 | FICHES TYPES À REMPLIR | [ARMAX-G27](BIBLE_ARMAX_INTEGREE.md#g27) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 28 | INSTRUCTION PRÊTE À TRANSMETTRE À UN PROJET | [ARMAX-G28](BIBLE_ARMAX_INTEGREE.md#g28) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |
| 29 | RÉFÉRENCES VÉRIFIÉES ET VOCABULAIRE | [ARMAX-G29](BIBLE_ARMAX_INTEGREE.md#g29) | Identité de rubrique conservée ; formulation abrégée dans l’ancien titre |

## Écarts traités par les extensions

L’[Extension01](EXTENSION_01_EQUIPES_ET_BONUS.md) ajoute personnalité et cycle de sélection, profils d’équipe, économie, assistances/relais, scènes collectives, clashes, entités, bonus et archives. L’[Extension02](EXTENSION_02_DEBLOCAGES.md) ajoute quatre axes d’accès, présentation et secret, conditions ET/OU, acquisition et modèles de soutien, offline, participation, replays et sauvegarde. Les 40 scénarios d’acceptation sont écrits avec attendu et statut à tester.

La priorisation historique P2 de toutes les équipes est remplacée, pour la conception courante, par ASSIST/TAG P1 et HYBRID P2. Coopération, quatre joueurs et multiplans restent différés. RC-ARMAX-TEAM-0.1 précise les seules différences des profils d’équipe ; le contrat duel historique reste intact. Tous les paramètres nouveaux sont des hypothèses d’équilibrage.

## Portée et travail restant

Cette réconciliation certifie présence des sources, numérotation et rattachements documentaires. Elle ne certifie ni gameplay, ni animation, ni fidélité 1:1 des images. Aucun paiement, service externe, nouveau droit de joueur ou code de moteur n’est ajouté. La bible 99pages et les originaux lot 15 historiquement non retrouvés ne sont pas déclarés récupérés par la découverte de ces guides.

# Relay Chronicles 0.2.0

**23 octobre 2026 — Opérations, équipement et animation féminine.**

Cette version reprend le dernier `main`, `27daea0b577650589cef46e896eae79fc9ff4f37`. Elle conserve le dossier de Shepard, les six sauvegardes manuelles, les conversations du Normandy, le codex progressif et les trois assignations déjà publiées.

## Nouveautés jouables

- **Onze opérations annexes, 43 étapes et quatre combats possibles**, à la Citadelle et à Féros. Les étapes, réponses, récompenses, échéances et rencontres à reprendre sont sauvegardées. Le journal affiche les prérequis et permet de suivre un objectif sur la carte.
- **48 références d’équipement** : 20 armes, 16 armures et 12 modules. Achat, vente, stocks persistants, comparaison et cinq emplacements par personnage. Inventaire partagé de 150 objets. Récupération du matériel des compagnons disparus.
- **Effets d’équipement en combat** : chaleur, refroidissement, protections, résistance au contrôle, dégâts spécialisés et pénétration partielle des boucliers. Les bonus ne s’accumulent pas lorsque le joueur rouvre un menu.
- **Shepard féminine animée** : seize images de marche dans quatre directions, plus quatre poses de combat. Création, dossier, équipement et renderer utilisent la même variante. Les métadonnées sont embarquées dans le build.
- **Carte locale et journal adaptés aux annexes** : filtres, légende, repères lisibles, objectifs suivis et affichage mobile.

### Opérations ajoutées

| Citadelle | Féros |
|---|---|
| La Favorite | Rétablir l’eau |
| La plainte de Xeltan | Cellules énergétiques |
| La demande de la journaliste | Les geth dans les tunnels |
| Scanner les veilleurs | Récupération des données |
| Traque du signal | |
| Le prédicateur du Présidium | |
| Le docteur Michel | |

Avec Retour à la maison, Affaire familiale et Le Fan, le jeu compte **14 quêtes annexes prototypes**. Les cartes et dialogues restent condensés ; les nouveaux veilleurs comprennent quatre scans représentatifs.

## Compatibilité des parties

Le format de sauvegarde reste en version 1. Les parties antérieures reçoivent uniquement les nouveaux champs absents, tout en conservant leur dossier, choix, équipe, conversations et assignations. Une donnée présente mais invalide est refusée. Les quatre armes et l’armure de départ ne modifient pas les statistiques de référence de la version précédente.

Une rencontre annexe interrompue doit être rejouée depuis son début. Le choix de combattre ne donne ni victoire ni récompense. Les récompenses d’opérations sont attribuées une seule fois, à leur conclusion.

## Catalogue Excel

Le [classeur principal](Mass_Effect_Relay_Chronicles_Production.xlsx) passe à **1 321 fiches dans 28 onglets**. Il ajoute 118 fiches et en enrichit 32, sans supprimer les 1 203 identifiants existants ni modifier les 57 fiches futures ME2/ME3 ou les six enregistrements Intégré/Validé.

Le contrôle de l’export compare 22 457 cellules aux données JSON et vérifie 274 formules sans erreur. Les 27 classeurs des autres œuvres, soit 5 326 fiches, restent conservés. Le [catalogue](CATALOGUE.md) distingue le contenu jouable, les prototypes et le travail défini.

## Validation et lancement

Les essais couvrent **199 contrôles Node**, la campagne complète de 21 combats, les onze nouvelles opérations, les deux apparences de Shepard, les transactions et sauvegardes d’équipement, le rendu des poses et le chargement du build. Les méthodes, limites et rapports sont dans [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) et [qa/v0.2.0-report.json](qa/v0.2.0-report.json).

```bash
npm ci
npm run dev
```

Pour compiler : `npm run build`. Pour le portable Windows : `npm run package:windows`, ou télécharger l’artefact du workflow GitHub une fois sa compilation réussie. Les dossiers `dist/` et `release/` sont des sorties locales exclues du dépôt.

## Limites de cette livraison

La version 0.2.0 développe le prototype ATB jouable ; elle ne termine pas la reproduction 1:1 du jeu original. Les animations de combat sont encore partielles, l’apparence de l’équipement ne change pas le sprite, les contacts annexes utilisent des marqueurs et le Mako n’est pas pilotable. Les décors complets, dialogues, cinématiques, romances, DLC et campagnes des autres épisodes restent à réaliser selon les catalogues.

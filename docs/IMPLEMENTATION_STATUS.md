# État de livraison — 0.3.0

Mise à jour : **23 octobre 2026**. Le travail a démarré depuis `main` **`3aad710557b8bc413e6d7ee79cda128cf65165c9`**, puis a intégré la nouvelle base **`c614a452b1cdd2712d34ad2344471c01d2c8d209`**, qui corrige les chemins incompatibles avec Windows.

La version ajoute un **atelier de personnalisation de Shepard, de son armure et de ses armes**, ainsi que **50 fiches dans l’Excel de production**. Elle prolonge le prototype jouable existant ; la reconstitution intégrale 1:1 de Mass Effect reste un objectif de production.

## Périmètre de cette version

L’atelier est accessible à la création et, hors combat, depuis Pause, Commando et Équipement. Ses trois onglets partagent un brouillon, un aperçu et une comparaison avec la configuration enregistrée.

| Onglet | Choix disponibles | Effet |
|---|---|---|
| Personnage | Deux apparences, quatre préréglages de visage, six teints, cinq couleurs d’yeux, six couleurs de cheveux et quatre coiffures | Paramètres persistants et portrait de conception 2D |
| Armure | Armure complète possédée, module d’armure, trois canaux parmi dix couleurs, quatre motifs, trois finitions et trois réglages de casque | Équipement existant et options cosmétiques ; casque masqué, visible ou réservé au combat |
| Armes | Arme possédée, module d’arme et modification de munitions | Disponibilité et statistiques issues du même inventaire que l’écran Équipement |

**Appliquer** valide l’ensemble de la configuration avant toute mutation. Les quantités disponibles tiennent compte des autres équipiers ; les restrictions d’équipement restent actives. **Annuler** ou fermer l’atelier abandonne les changements du brouillon. Les cosmétiques ne donnent aucun bonus de combat et les armures restent des ensembles complets ME1.

Les choix sont conservés dans `state.customization`, avec l’apparence et les cinq emplacements d’équipement existants. Une ancienne sauvegarde sans personnalisation reçoit les valeurs par défaut. Un champ présent mais malformé est refusé, sans exécuter d’accesseur. Les détails fonctionnels et les fichiers concernés figurent dans [CUSTOMIZATION.md](CUSTOMIZATION.md).

### Portée visuelle

L’aperçu réutilise les sprites existants dans quatre directions ; le portrait de conception rend les choix de visage et de coiffure. L’aperçu et le terrain partagent le traitement des couleurs, motifs, finitions et du casque. Le casque est représenté par un masque et une visière sur la silhouette existante.

Le terrain conserve la géométrie des silhouettes et les coupes de cheveux des atlas. Les préréglages de visage, les formes de coiffure et le détail des yeux se lisent dans le portrait de l’atelier ; ils ne constituent pas un morphing facial 3D. Les silhouettes exactes de chaque arme et armure, leurs accessoires et leurs animations propres restent à produire. Aucune fidélité artistique 1:1 n’est déclarée.

## Jeu existant conservé

La campagne condensée comprend **neuf scènes 3D, huit étapes et 21 rencontres**, avec six classes, les modes ATB Attente/Actif et trois difficultés. Elle conserve le recrutement, deux équipiers actifs, les décisions persistantes, les conversations, le codex et le journal.

Les **14 assignations**, les **20 armes, 16 armures et 12 modules**, l’inventaire de 150 objets, les achats/ventes et les effets de combat restent disponibles. Les sauvegardes automatiques, six emplacements manuels et import/export JSON utilisent le format existant. Les cartes, dialogues et animations demeurent ceux d’un prototype condensé. Le périmètre antérieur est détaillé dans [RELEASE_0.2.0.md](RELEASE_0.2.0.md).

## Excel et catalogues

Le [classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) et le [catalogue JSON](content-catalog.json) contiennent désormais **1 371 fiches**, dans **26 catégories et 28 feuilles**. Les **50 ajouts** couvrent 20 systèmes et éléments d’interface, six éléments d’armure et d’équipement, quatre d’armes, cinq de sprites, trois d’animations et douze scénarios QA.

Les **1 321 fiches précédentes**, dont les **57 fiches ME2/ME3**, gardent leurs identifiants et leur contenu. Les nouveaux éléments sont suivis comme prototypes ou travail restant ; une fiche de scénario QA ne constitue pas à elle seule un résultat d’exécution.

Le recalcul et l’inspection de l’archive XLSX contrôlent les totaux, les cellules historiques, les tableaux filtrés, les validations, les formats et les volets figés. Le contrôle exporté ne relève aucune erreur de formule en cache. Les preuves de cette extension sont [customization-verification.json](workbook-previews/customization-verification.json) et [customization-native-check.json](workbook-previews/customization-native-check.json). L’ouverture dans Microsoft Excel natif n’a pas été exécutée.

Les **27 classeurs de l’univers, soit 5 326 fiches**, restent conservés dans [universe/](universe/README.md). Les références et différences entre les systèmes des opus sont documentées dans [customization-sources.md](research/customization-sources.md).

## Vérifications 0.3.0

Le [rapport de livraison 0.3.0](qa/v0.3.0-report.json) réunit les résultats et les empreintes des sources et de la compilation.

| Contrôle | Résultat et portée | Preuve |
|---|---|---|
| Règles Node | **217 contrôles réussis dans 18 fichiers**, aucun échec ni test ignoré ; dont 14 scénarios dédiés à la personnalisation | [customization-unit-report.json](qa/customization-unit-report.json) |
| Atelier dans le navigateur | **9 groupes réussis** : création, brouillon, équipement, rendu terrain, sauvegardes, trois onglets mobiles, migration, restrictions et build de production ; aucune erreur navigateur ou ressource en échec | [customization-report.json](qa/customization-report.json) |
| Compilation web | `npm run build` réussi, 33 modules ; ressources locales et WebGL contrôlés dans le build | [v0.3.0-report.json](qa/v0.3.0-report.json) |
| Classeur | 1 371 fiches, conservation des 1 321 fiches historiques et de leurs styles ; 28 feuilles et 26 tables filtrées | [customization-native-check.json](workbook-previews/customization-native-check.json) |

Les contrôles du modèle couvrent le brouillon détaché, l’application atomique, l’équipement partagé, l’interdiction en combat, la migration et le refus de données malformées. Ils vérifient aussi les couleurs, le casque, les valeurs par défaut et la libération des textures générées.

Le parcours navigateur utilise les commandes réelles de création, d’achat, de personnalisation et de sauvegarde. Il vérifie la reprise automatique, un export JSON téléchargé puis importé et une restauration manuelle nommée. Le contrôle du rendu constate 16 812 pixels RGB modifiés sur la texture de Shepard et une transparence identique. Les deux sauvegardes préparées pour la migration et les restrictions d’inventaire sont des fixtures importées explicitement ; elles ne représentent pas du matériel obtenu en campagne.

Les trois onglets ont été contrôlés à **360 × 800** et l’atelier bureau à **1 440 × 1 000**, sans débordement horizontal ni bouton tronqué. Le build de production reprend les choix après rechargement et n’expose pas l’API de développement. Les captures [création](screenshots/customization-creation.png), [armure](screenshots/customization-armor.png), [armes](screenshots/customization-weapons-desktop.png), [mobile](screenshots/customization-mobile.png) et [production](screenshots/customization-production.png) sont issues de ces essais. Le casque du sprite reste un masque coloré schématique sur la silhouette d’origine, comme indiqué dans la revue visuelle du rapport.

## Preuves historiques et distribution

Les rapports de campagne, d’opérations, d’équipement et d’apparences de **0.2.0 restent des preuves historiques de leurs sources respectives** : [livraison 0.2.0](qa/v0.2.0-report.json), [campagne](qa/campaign-report.json), [opérations](qa/operations-report.json), [équipement](qa/loadout-report.json), [apparences](qa/commander-report.json), [poses féminines](qa/femshep-poses-report.json) et [distribution web](qa/production-v02-report.json). Ils ne signifient pas que ces parcours complets ont été réexécutés sur 0.3.0.

La correction Windows de la base `c614a45` est conservée : le fichier de catalogue nommé `CON.json` et son rapport deviennent `CONVICTION.json`, avec leurs octets et l’identifiant interne `CON` préservés. Les chemins des générateurs et le test de portabilité sont intégrés. Le [diagnostic initial](qa/windows-path-fix.json) décrit l’échec de checkout qui motivait ce changement ; cette livraison n’annonce pas un nouveau test d’exécution sous Windows.

Les configurations Electron, Vercel et les workflows GitHub restent présents. Les résultats des builds publiés sont à consulter dans GitHub Actions. Aucun nouveau déploiement Vercel n’est annoncé ici ; voir [DEPLOYMENT.md](DEPLOYMENT.md). Le [rapport Windows 0.1.0](qa/build-v0.1.0-report.json) et le [rapport d’équilibrage antérieur](qa/balance-report.json) restent historiques.

## Reproduire les contrôles

```bash
npm ci
npm test
npm run build
```

Pour le parcours de personnalisation, démarrer `RELAY_QA=1 npm run dev`, puis lancer `npm run test:customization`. `PLAYWRIGHT_EXECUTABLE_PATH` permet de désigner un Chromium installé. Les scripts de campagne, d’opérations et d’équipement restent disponibles pour une passe de régression distincte.

## Travail restant

- Compléter les cartes, sous-zones, liaisons, quêtes secondaires et variantes encore condensées.
- Produire les dialogues, cinématiques, romances et réactions aux antécédents manquants.
- Réaliser les silhouettes d’équipement, coiffures et visages animés, les mouvements complets et huit directions.
- Compléter le Mako, les talents détaillés, licences et gamme d’objets.
- Éprouver l’équilibrage, les commandes manette, le mobile et les matériels réels ; produire doublage et musique et développer les autres campagnes.

Le rendu navigateur utilise WebGL logiciel pour les contrôles automatisés. Aucune fréquence d’images sur un PC de joueur ni couverture matérielle exhaustive n’est revendiquée. Le [suivi de fidélité](FIDELITY.md) détaille les limites par domaine.

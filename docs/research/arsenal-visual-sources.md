# Références visuelles primaires pour les familles d’assets

Revue du **26 octobre 2026**. Quatre manuels EA ont été téléchargés et reconnus comme PDF, avec réponse HTTP 200. Les quatre planches de repérage couvrent leurs 91 pages ; douze vues sélectionnées ont été inspectées individuellement. Le [rapport structuré](../qa/arsenal-visual-reference-report.json) conserve les téléchargements, empreintes, observations, identifiants vérifiés et lacunes. Cette revue prépare trois atlas ; elle ne génère aucun asset et ne certifie aucune fidélité 1:1.

Les fichiers de travail et figures extraites sont dans `/tmp/relay-arsenal-refs/`. Ils ne sont pas ajoutés aux assets distribués. Les numéros ci-dessous désignent les **pages PDF** ; les pages imprimées sont précisées lorsqu’elles ont été relevées.

## Documents effectivement consultés

| Document primaire | Fichier et pagination | SHA-256 |
|---|---|---|
| [ME1 — manuel Xbox 360 anglais](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-manuals_Microsoft%20XBOX360_en_US.pdf) | `me1-manual-x360-en.pdf`, 1 701 003 octets, 16 pages | `f09cbe3dae03b652299d63f6b4c9340b8d0a9bf4df8b92b83e9bd9545dbceb44` |
| [ME2 — manuel PC français](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf) | `me2-manual-fr.pdf`, 2 937 619 octets, 18 pages | `c4d5edbe68f36fc261e6efe9e445711ec6214e38b74b61b3c89edc34ef2965e1` |
| [ME3 — manuel PC anglais](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-3-manuals_PC.pdf) | `me3-manual-en.pdf`, 1 886 992 octets, 27 pages | `07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01` |
| [MEA — manuel PC anglais](https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-andromeda-pc-en.pdf) | `mea-manual-en.pdf`, 847 754 octets, 30 pages | `a5e3bfc40a63695fb20d8fcb2db4b590a6fa65bf24c90b01c9eae555190f817f` |

Les trois derniers PDF correspondent aux empreintes des [revues précédentes](../qa/chronicle-support-reference-report.json), mais ont bien été retéléchargés pour ce relevé. Le manuel ME1 Xbox 360 constitue une **autre URL** que le manuel PC français désigné par `ME1-MANUAL`. Il reste identifié dans cette recherche par `EA-ME1-X360-MANUAL-EN-20261026`, sans ajout au catalogue ni réaffectation silencieuse du sourceID existant.

L’[index officiel EA des guides cosplay](https://www.ea.com/games/mass-effect/community/cosplay-guides) a aussi répondu HTTP 200 : 136 477 octets, SHA-256 `2248c7661ce15965aa8c2c3e598f3c678192d91c02c02835e15d056464108ba3`. Il expose vingt liens de guides et leurs vignettes. Une nouvelle tentative sur la vignette publique de Miranda a échoué **avant la réponse du serveur d’origine**, avec `CONNECT tunnel failed, response 403` et zéro octet. Aucune autre requête vers cet hébergeur n’a suivi. Les archives ZIP déjà refusées lors du lot précédent n’ont pas été retentées ; leurs PDF n’ont pas été lus. L’ancien faux PDF ME3 français AccessDenied n’a pas été retéléchargé.

## Vues utilisables et portée exacte

| Référence | Page et identifiants existants | Ce que l’image permet de guider | Limite |
|---|---|---|---|
| Couverture ME1 | PDF 1 ; `CHR-shepard` | Personnage central en tenue N7 ; visage bleu au-dessus du titre | Les figures ne portent pas de légende individuelle. Le rapprochement du grand visage avec Saren reste visuel ; aucun corps ou costume de confrontation n’est établi. Les personnages latéraux ne sont pas attribués. |
| Couverture ME2 | PDF 1 ; `ME2-CHR-SHEPARD`, `ME2-CHR-MIRANDA`, `ME2-CHR-THANE` | Têtes, hauts de vêtements, armes tenues et palette de l’illustration officielle | Identités reconnues visuellement, sans noms imprimés sur la couverture ; pas de dos, bas du corps, animation ou modèle d’arme nommé. |
| Garrus ME3 | PDF 5 ; `ME3-CHR-GARRUS` | Tête et haut d’armure dans une capture portant explicitement son nom | Figure d’origine de 512 × 256 pixels, interface comprise. Ne prouve pas le costume de Garrus ME1/ME2 ou une silhouette entière. |
| Armes ME1 | PDF 9–10, imprimées 15–18 ; `WPN-pistolet-standard`, `WPN-fusil-d-assaut-standard`, `WPN-fusil-a-pompe-standard`, `WPN-fusil-de-precision-standard` | Quatre illustrations accompagnant les intitulés de familles | Aucun nom de modèle, fabricant ou rang ne légende ces quatre illustrations. |
| Grenade ME1 | PDF 10, imprimée 17 ; `WPN-grenade-de-shepard` | Forme circulaire d’une grenade-disque de l’Alliance | Pas une grenade ME2/ME3/MEA ni une preuve de leurs réserves ou mécanismes. |
| Vindicator ME3 | PDF 12 ; `ME3-WPN-VINDICATOR` | Profil latéral explicitement légendé « M-15 Vindicator V » | Le rang V appartient à cette capture ; il n’ajoute aucune progression ou table de statistiques au jeu. |
| Armures et casques | ME1 PDF 10 ; ME2 PDF 1 ; ME3 PDF 5 et 22 ; MEA PDF 1 | Exemples de casque et tenues propres à chaque œuvre ; marquage N7 visible sur la couverture MEA | Pas de certification d’une gamme Onyx/Colossus, d’un dos complet ou d’un porteur Sara/Scott/Alec identifié. La couleur rouge d’un exemple n’établit pas une livrée universelle. |
| Clips thermiques ME2 | PDF 10 ; `ME2-EQP-THERMAL`, `ME2-PRP-THERMAL-CLIP` | Deux objets de cartouche amovible clairement illustrés | Ce sont des clips, pas des pouvoirs de munitions appris ni des modules d’arme. |
| Mako | ME1 PDF 13, imprimées 23–24 ; `SYS-mako`, `SPR-VEH-mako` | Véhicule à six roues sous rubrique MAKO, vue de terrain | Une seule petite perspective ; aucune référence de carrosserie ou livrée du Nomad. |
| Normandy SR-1 | ME1 PDF 3, imprimée 4 ; `WRL-normandy-sr-1`, `SCN-normandy-coque-sr-1`, `SPR-VEH-normandy-sr-1` | Coque visible et nom NORMANDY inscrit sur le vaisseau | Contexte ME1 seulement ; pas de preuve des coques SR-2, Tempest ou Sovereign. |

La capture de conversation ME1 PDF 5, imprimée 8, contient un sous-titre attribué à Joker et un visage en contrechamp. **Le nom du locuteur ne prouve pas l’identité du visage affiché.** Cette image n’est donc pas attribuée à `NPC-jeff-joker-moreau`.

## Préparation des trois atlas et des neuf familles

| Atlas prévu | Famille | État des références |
|---|---|---|
| Acteurs, PNJ, boss, ennemis | Personnages | Références partielles ci-dessus ; Garrus ME3 est nommé dans sa capture. |
| Acteurs, PNJ, boss, ennemis | Boss | Rapprochement de visage Saren uniquement. Aucun corps vérifié pour `ENM-saren-sur-virmire`, `ENM-saren-a-la-citadelle`, `ENM-matriarche-benezia` ou `ME2-ENM-HUMAN-REAPER`. |
| Acteurs, PNJ, boss, ennemis | Ennemis | Les pages ME3 24–25 nomment des types comme Atlas, Brute ou Banshee, mais ne montrent pas de planche corporelle nommée suffisamment lisible. Pas de silhouette certifiée pour `ENM-husk`, `ME3-ENM-ATLAS`, `ME3-ENM-BRUTE`, `ME3-ENM-BANSHEE` ou `ME3-ENM-CENTURION`. |
| Acteurs, PNJ, boss, ennemis | PNJ | Aucune apparence individuelle suffisamment établie pour Joker, Anderson, Chakwas ou l’Homme Trouble dans ce relevé. |
| Armures, armes, mods | Costumes | Hauts de tenues, casque et exemple de dos seulement ; conserver l’œuvre de chaque référence. Les lignes `ME2-EQP-N7`, `ME3-EQP-N7`, `MEA-EQP-N7` ne partagent pas automatiquement un modèle. |
| Armures, armes, mods | Armes | Quatre familles génériques ME1, grenade-disque et un modèle nommé ME3 Vindicator. |
| Armures, armes, mods | Mods | Le principe des améliorations et les deux ports ME3 sont décrits, sans forme physique nommée pour `ME3-EQP-BARREL`, `ME3-EQP-MAGAZINE` ou `ME3-EQP-SCOPE`. Un pictogramme original reste un symbole de prototype. |
| Véhicules, vaisseaux | Véhicules | Mako illustré ; `MEA-SYS-NOMAD` et `MEA-EQP-NOMAD-SKINS` restent documentés par le texte, sans carrosserie ou livrée visible obtenue ici. |
| Véhicules, vaisseaux | Vaisseaux | SR-1 illustré ; aucune coque qualifiée pour `ME2-normandy-sr-2-cerberus`, `ME3-normandy-sr-2-alliance`, `MEA-SCN-TEMPEST` ou `SPR-VEH-sovereign`. |

Les neuf familles sont examinées ; elles ne disposent pas toutes de références suffisantes pour reconstituer un modèle original. Les corps, variantes et angles manquants doivent rester explicitement des interprétations de prototype ou attendre une source visuelle supplémentaire.

## Entrées de travail pour la génération

Chemins courts utiles à l’opérateur de génération, tous sous `/tmp/relay-arsenal-refs/` :

- Personnages : `pages/me2-manual-fr-p01.png`, `source-images/me3-manual-en-p05-xref132.jpeg`.
- Armes et costumes : `pages/me1-manual-x360-en-p09.png`, `pages/me1-manual-x360-en-p10.png`, `source-images/me3-manual-en-p12-xref96.jpeg`, `pages/me3-manual-en-p22.png`, `pages/mea-manual-en-p01.png`.
- Véhicule : `source-images/me1-manual-x360-en-p13-xref233.jpeg`, **443 × 333** pixels d’origine.
- Vaisseau : `source-images/me1-manual-x360-en-p03-xref31.jpeg`, **560 × 284** pixels d’origine.

Les figures intégrées sont extraites sans retouche. Les rendus de pages ne créent aucun détail supplémentaire dans les petites captures. Les interfaces, logos EA, titres et barres de statistiques présents sur les pages ne doivent pas entrer dans les nouveaux dessins. Les atlas actuels du projet peuvent guider le style ; ils ne constituent pas une nouvelle preuve de costume ou d’identité.

L’opérateur conservera séparément les chemins réellement fournis à `image_gen`, le prompt, le résultat et ses empreintes. Cette revue n’a exécuté ni génération, ni navigateur, ni commande Git, ni modification des catalogues ou de l’application.

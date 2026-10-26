La création et les menus hors combat proposent un atelier **Personnage / Armure / Armes**. Le joueur prépare un brouillon, compare ses effets, puis applique tous ses choix ensemble ou les abandonne. L’équipement conserve les règles de propriété, compatibilité et formation : les neuf emplacements ME1 utilisent le même inventaire que l’écran Équipement. Retirer ou remplacer une pièce restitue ses modules ; l’autorisation historique d’une armure expire lors de son retrait effectif, même si un brouillon forgé rétablit ensuite le même identifiant.

Les choix d’apparence sont sauvegardés et repris par le sprite ; le portrait de conception, les teintes et le casque schématique restent des rendus de prototype, sans morphing facial 3D ni variantes exactes de chaque modèle. Les anciennes sauvegardes reçoivent des valeurs neutres lorsque la personnalisation est absente ; les données explicitement invalides sont refusées sans application partielle.

La branche est synchronisée avec main `7ef342a1c7fb2152cb9f614917575886da4fcb8f`. Les **50 fiches de personnalisation** s’ajoutent aux 1 332 fiches principales conservées, soit **1 382 principales / 6 708 références / 454 sources**. Le contenu arsenal, les 25 essais Chroniques, leurs quatre emplacements, les 27 classeurs univers et le ZIP proviennent de main et sont préservés ; ils ne constituent pas des ajouts de cette PR. Les rapports historiques de main restent inchangés.

Validation de cette fusion :

- **556 tests Node** réussis ; build **0.3.0**, **56 modules**.
- **9 contrôles de personnalisation** par l’interface, dont création, annulation, application atomique, rendu, sauvegardes et reprise du build compilé.
- **17 contrôles HTTP de production**, sans harnais DEV, avec sauvegardes ME1/personnalisation/Chroniques préservées, quinze PNG et sept bundles servis aux empreintes exactes ; quatre atlas HTTP 200 identiques au build.
- Principal reconstruit et comparé aux deux bases : **1 382 fiches / 44 sources**, 28 feuilles, 26 tableaux filtrés, validations et formules préservées ; les exports univers, images et archives restent identiques à main.

Les preuves actuelles portent le préfixe `customization-arsenal-sync-*`. Ces contrôles ne certifient ni la fidélité artistique 1:1, ni les campagnes ultérieures complètes, ni un lancement Windows natif.

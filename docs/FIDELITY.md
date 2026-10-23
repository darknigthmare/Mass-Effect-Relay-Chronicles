# Suivi de réalisation et de fidélité

Le périmètre retenu conserve les sprites et les combats ATB de Relay Chronicles. La fidélité du contenu demande des références distinctes pour les lieux, les personnages, les missions et les conséquences. Les statistiques et le rythme ATB restent des choix d’adaptation.

Le classeur principal suit 1 327 fiches. Les 27 autres classeurs suivent 5 326 fiches supplémentaires, soit 6 653 fiches au total. Ces quantités décrivent un plan de production, pas des éléments tous jouables. La version 0.2.0 conservait les 1 203 identifiants antérieurs et les six statuts déjà avancés ; ses 118 nouvelles fiches détaillent les opérations, rencontres, objets et frames ajoutés. Le complément équipement conserve ces 1 321 fiches et ajoute quatre outils ; le lot Chroniques ajoute deux fiches de fonctions et de validation.

## Dossier de Shepard

Le jeu propose les deux apparences, les origines Stellaire/Colon/Terrien et les profils Rescapé/Héros de guerre/Impitoyable. Les choix sont conservés dans les sauvegardes, les exports et les imports. Le dossier reste consultable depuis la pause et le commando. Les anciennes sauvegardes v1 reçoivent les valeurs par défaut uniquement lorsque les nouveaux champs sont absents ; les valeurs explicitement invalides sont rejetées.

La même identité est conservée en exploration et en combat. Les deux apparences ont chacune seize images de marche dans quatre directions. La variante féminine possède quatre poses de combat distinctes, avec rectangles et pivots par frame. Ces dessins restent des prototypes : transitions, huit directions, variations par arme et conformité artistique finale ne sont pas validées. Les réactions narratives complètes aux antécédents, les bonus de moralité de l’original et le créateur facial ne sont pas implémentés par ce dossier. Le choix d’apparence n’ajoute aucun bonus de combat.

Les tests se trouvent dans `tests/commander.test.js`, `tests/commander-world.test.js` et `scripts/commander-browser.mjs`. La commande `npm run test:commander` exerce la création réelle, le dossier, l’export/import, la migration v1, la reprise, le clavier, le changement de zone et le sprite de combat. Son rapport est écrit dans `test-results/commander-report.json`.

## Sauvegardes manuelles

Six emplacements indépendants conservent le nom choisi, la date et la zone avec le nom, la classe et l’apparence du commandant. Leurs aperçus sont dérivés de la progression validée qui sera effectivement chargée. Un emplacement occupé ou corrompu exige une confirmation explicite avant remplacement. La suppression demande aussi confirmation ; la sauvegarde automatique et les autres emplacements sont préservés.

Les erreurs de capacité et d’accès au stockage sont présentées sans annoncer de réussite. Les emplacements illisibles restent visibles et ne sont pas effacés automatiquement. L’enregistrement et le chargement sont désactivés pendant un combat. Le choix de six emplacements relève de l’interface de cette adaptation.

`tests/save-slots.test.js` contrôle les opérations et leurs échecs ; `npm run test:saves` exerce l’interface, les aperçus, les confirmations, le chargement de l’apparence féminine et l’indépendance de la sauvegarde automatique. Son rapport est écrit dans `test-results/save-slots-report.json`.

## Conversations et progression

Le Normandy propose neuf interlocuteurs et dix-huit sujets conditionnels : Nihlus avant le départ sur Eden Prime, Joker et Chakwas, puis les six compagnons selon leur recrutement et leur survie. Le premier rapport de Joker est prioritaire après le prologue. Le conseil donné à Garrus est mémorisé et repris ensuite. Ces textes sont des réécritures françaises concises ; ils ne constituent pas une transcription certifiée du jeu original.

Le codex comprend seize entrées conditionnelles et une recherche insensible aux accents. Les informations sur Liara, le Cipher, Sovereign et Vigil sont limitées aux étapes appropriées. Les sujets lus, les réponses, les découvertes et les visites sont sauvegardés. Le format v1 conserve les anciennes parties en initialisant uniquement les champs narratifs absents.

Garrus et Wrex peuvent être recrutés avant ou après l’audience du Conseil ; Tali fournit la preuve nécessaire. Le recrutement laisse l’équipe choisie intacte. Un compagnon recruté n’est plus simultanément représenté par son ancien PNJ de recrutement à la Citadelle. Les positions de conversation restent une mise en scène dans les cartes condensées existantes.

Les tests correspondants sont `tests/story.test.js`, `tests/recruitment.test.js`, `tests/story-world.test.js` et `npm run test:story`. Les rapports courants restent dans `test-results/` et les preuves conservées sont référencées dans l’état de livraison.

## Premières assignations de la Citadelle

Retour à la maison suit la demande de Samesh Bhatia, l’échange avec Bosker puis le compte rendu à la famille, avec restitution du corps de Nirali ou poursuite des recherches. Affaire familiale propose deux réponses au désaccord de Rebekah et Michael après une première mission de l’enquête. Le Fan propose l’autographe, la photographie puis la dissuasion de Conrad, avec une nouvelle mission parmi Thérum, Féros et Novéria entre chaque rencontre. Les jalons sont enregistrés au moment de l’autographe et de la photographie, y compris si le premier contact arrive tard. De simples allers-retours ne débloquent pas la rencontre suivante. Si ces missions sont déjà épuisées, le journal explique pourquoi cette assignation ne peut plus avancer dans la chronique.

Les étapes et les issues sont sauvegardées, et chaque assignation terminée attribue une seule fois 50 XP. Ce montant est un choix d’équilibrage de l’adaptation ATB. Le journal distingue Missions, Assignations et Rapports, puis sépare les assignations en cours et terminées. Les contacts utilisent des marqueurs nommés dans la carte condensée ; leurs sprites et portraits dédiés restent à produire. Les conditions de persuasion, l’ensemble des répliques et les autres issues restent à reconstituer. Ces trois fiches sont donc des Prototypes.

Les tests correspondants sont `tests/assignments.test.js`, `tests/assignment-world.test.js` et `npm run test:assignments`. La migration v1 initialise uniquement les données absentes et refuse les étapes ou issues incompatibles avec l’enquête.

## Onze opérations supplémentaires

La Favorite, la plainte de Xeltan, la demande d’Emily Wong, les veilleurs, le signal suspect, le prédicateur, le docteur Michel et quatre opérations de Féros ajoutent 43 étapes et quatre combats possibles. Les étapes, réponses, rencontres armées et victoires sont sauvegardées séparément des trois assignations historiques. Le journal présente les conditions et les échéances. Les récompenses de conclusion ne peuvent pas être récupérées une seconde fois.

Le contenu est adapté aux cartes existantes : quatre scans représentatifs de veilleurs, dialogues français réécrits, positions regroupées, désamorçage simplifié et absence des varrens. Les seuils de persuasion, les récompenses, les combats et la remise de 20 % sur le médi-gel sont des réglages du prototype. Le gain de soutien à la colonie ne recrée pas l’intégralité du calcul de survie de ME1. Les références et écarts sont consignés dans [operations-sources.md](research/operations-sources.md).

Les tests `tests/operations.test.js` et `scripts/operations-browser.mjs` valident la progression, les blocages, les récompenses uniques, les échéances, la reprise de combat et l’accès aux marqueurs. Le parcours navigateur contrôle les chemins puis positionne Shepard à chaque marqueur pour interagir au clavier ; il ne revendique pas une marche manuelle sur l’ensemble des routes.

## Équipement

L’inventaire, l’achat et la vente conservent les 48 références de 0.2.0 : 20 armes, 16 armures et 12 modules. Le complément ajoute quatre outils génériques, neuf emplacements par personnage, les formations explicites et les effets bio/tech séparés. Les contrôles portent sur les quantités, stocks, niveaux, formations et morphologies. Les modules sont restitués au stock au retrait ou remplacement de leur arme/armure ; leurs effets ne restent plus actifs sans pièce porteuse. Les armures et armes dessinées ne changent pas avec l’objet équipé. Les prix, effets chiffrés, points de formation et nombres de ports fixes restent des adaptations ATB.

Les fiches de familles d’armes ou de marques ne sont pas remplacées par les nouvelles fiches d’objets jouables : une famille encore définie peut contenir un modèle prototype. Les licences, toute la gamme de rangs, le butin aléatoire, les talents détaillés et les apparences d’équipement restent à produire. Voir [loadout-sources.md](research/loadout-sources.md), `tests/loadout.test.js`, `tests/equipment-combat.test.js` et [loadout-report.json](qa/loadout-report.json).

Le [complément et ses limites](research/loadout-extension-sources.md) conserve les règles consultées, la migration de l’inventaire interne et les écarts restants. Les profils des compagnons restent partiels. Le droit de Liara à un omni-outil n’ajoute pas de pouvoir technologique ; Electronics et les arbres originaux complets restent à reproduire. Les types d’armes ont des tracés distincts, sans reproduction de leur précision ou portée originales.

## Chroniques par œuvre et segment

Le [module Chroniques](CHRONICLES.md) réunit un registre de 28 œuvres et 48 segments. Les références visibles sont limitées à leur œuvre et à un segment explicitement documenté ; une année supposée, un nom commun ou la présence dans un recueil ne suffit pas à rendre un acteur ou un objet disponible. Les fenêtres de scène incertaines restent fermées. ME4, Library Edition, Blasto et les contenus coupés n’ouvrent aucune période historique jouable.

Dix essais indépendants couvrent sept œuvres : ME2, ME3, Andromeda, Infiltrator, Galaxy, Redemption et Paragon Lost. Quatre utilisent des types d’opposition référencés ; trois sont des bancs de personnages face à des mannequins originaux ; trois sont des ateliers d’équipement. Les prologues de ME3 et d’Andromeda ainsi que Redemption ne rejouent donc aucun affrontement canonique. Les essais proposent 34 profils sélectionnables au total, parmi 42 profils partiels définis, avec des identifiants distincts selon l’œuvre. Les profils, pouvoirs disponibles et groupes restent bornés à chaque essai.

Les ateliers exposent 68 équipements compatibles : 11 ME2, 27 ME3 et 30 Andromeda. Leur préparation libre ne simule aucune acquisition, aucun recrutement ni déblocage d’origine. Les alternatives Samara/Morinth et Ashley/Kaidan restent exclusives ; les armures personnelles sont réservées au protagoniste autorisé. Les modèles dont la charge, le rayon, les cellules, l’édition ou une autre mécanique manque restent fermés. Les statistiques, réserves, effets et rythmes sont des adaptations ATB.

Les sauvegardes, préparations et résultats des Chroniques sont séparés de la campagne ME1 et de ses six emplacements manuels. Aucune victoire ne transfère crédit, expérience, choix narratif, personnage ou équipement dans ME1. Le registre et les essais ne modifient pas les statuts documentaires par leur simple existence. Aucun atlas ni portrait supplémentaire n’est livré : la présentation utilise des symboles de prototype. Les campagnes complètes, la mise en scène, les costumes et les mécaniques propres aux œuvres restent à produire.

Les contrôles dédiés se trouvent dans `tests/continuity*.test.js`, `tests/save-continuity.test.js`, `tests/chronicles.test.js` et `tests/universe-*.test.js`. `npm run test:universe` exerce l’interface et l’isolation des sauvegardes ; ses résultats dépendent du rapport de l’exécution concernée, pas de ce décompte de fonctionnalités.

## État du contenu restant

Les 100 sous-zones et 91 liaisons du catalogue ne constituent pas encore des parcours complets. Parmi les 65 fiches de quêtes secondaires/DLC, 14 ont un prototype jouable et 51 restent Définies. Les 43 nouvelles fiches d’étapes complètent ces quêtes sans être comptées comme des missions supplémentaires. Les dialogues complets, les cinématiques, les romances, le Mako pilotable, les variantes visuelles d’équipement, les animations et les campagnes ultérieures intégrales restent à réaliser. La présence d’un nom, d’un atlas ou d’un chemin prévu ne suffit pas à terminer une fiche.

Pour reproduire une scène précisément, il faut identifier l’édition, les étapes et conditions, les références de carte ou de costume et les embranchements attendus. Le dépôt conserve des liens de manuels et de guides, mais pas un relevé primaire complet de ces éléments. Les captures de `docs/screenshots/` représentent le prototype.

Après activation des domaines réseau, le manuel officiel PC français, l’extrait officiel Prima et la page EA comparant les éditions ont été consultés avec succès (HTTP 200). Les empreintes, pages et règles lues sont consignées dans [equipment-primary-reference-report.json](qa/equipment-primary-reference-report.json). L’extrait Prima contient 23 pages, pas les tables complètes des objets. Les pages Weapons et Upgrades de Fandom ont répondu HTTP 402 ; leur contenu n’est pas présenté comme nouvellement consulté. Les différences de visée, chauffe et spécialisations entre original et Legendary Edition sont documentées ; les valeurs individuelles restent à relever dans l’édition retenue.

L’accès Git natif au dépôt fonctionne et permet les pushes sur `main`. L’autorisation d’un domaine ne garantit ni l’accès à toutes ses pages ni les droits d’un compte distant ; les réponses observées sont conservées avec leur date.

L’API Vercel est maintenant atteignable mais demande un jeton d’authentification ; la CLI reste déconnectée. Aucun secret ni identité Vercel n’est configuré dans le runtime observé. La liaison et le déploiement restent à effectuer avec une identité utilisable. La configuration web, les commandes et le diagnostic courant sont dans [DEPLOYMENT.md](DEPLOYMENT.md).

## Auditer les fiches

```bash
npm run audit:fidelity
npm run audit:fidelity -- --include-universe
```

L’audit écrit `test-results/fidelity-report.json`. Il sépare les statuts déclarés, les fichiers réellement présents, les répertoires seulement prévus, les dépendances et les références canoniques. Chaque fiche non validée conserve son critère d’acceptation. L’existence d’une URL ne valide pas son contenu ; un test fonctionnel ne certifie pas la fidélité visuelle. Les statuts ne sont jamais promus automatiquement.

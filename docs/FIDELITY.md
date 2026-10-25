# Suivi de réalisation et de fidélité

Le périmètre retenu conserve les sprites et les combats ATB de Relay Chronicles. La fidélité du contenu demande des références distinctes pour les lieux, les personnages, les missions et les conséquences. Les statistiques et le rythme ATB restent des choix d’adaptation.

Le complément basé sur `994a963` comprend **1 330 fiches dans le principal et 5 326 dans les 27 catalogues supplémentaires, soit 6 656 fiches** avant personnalisation. La fusion 0.3.0 ajoute 50 fiches de personnalisation en conservant ce socle : **1 380 principales et 6 706 références** dans le registre régénéré. Les trois nouveaux systèmes transversaux et les 85 promotions Prototype supplémentaires sont suivis séparément des rapports historiques. Ces quantités décrivent un plan de production, pas des éléments tous jouables. La version 0.2.0 conservait les 1 203 identifiants antérieurs et les six statuts déjà avancés ; ses 118 nouvelles fiches détaillent les opérations, rencontres, objets et frames ajoutés. Le complément équipement conserve ces 1 321 fiches et ajoute quatre outils ; le premier lot Chroniques ajoute deux fiches de fonctions et de validation. Le complément pouvoirs, préparations et lectures ajoute ensuite trois fiches système, sans modifier les six statuts avancés historiques.

Le complément du **25 octobre**, basé sur `7fe7a88`, conserve ces 6 656 identifiants et ajoute **37 promotions Prototype**, soit **513 Prototype, 6 137 Défini, trois Intégré et trois Validé** dans les 28 catalogues. Parmi les 1 330 fiches principales, seule la description et la note du système de lecture sont actualisées ; les 1 329 autres restent inchangées. Les champs factuels et les sources des 5 326 fiches supplémentaires sont conservés. Le [rapport de conservation](qa/chronicle-specialists-preservation-report.json) sépare ces vérifications de toute certification canonique ou artistique.

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

Seize essais indépendants couvrent sept œuvres : ME2, ME3, Andromeda, Infiltrator, Galaxy, Redemption et Paragon Lost. Quatre utilisent des types d’opposition référencés ; trois sont des bancs de personnages face à des mannequins originaux ; trois sont des ateliers d’équipement ; six sont des bancs de spécialistes DLC ou bonus. Les prologues, Redemption et les six nouveaux bancs ne rejouent aucun affrontement canonique. Les essais proposent 42 profils sélectionnables, tous partiels, avec des identifiants distincts selon l’œuvre. Kasumi, Zaeed, Liara ME2, Javik, Aria, Nyreen, Wrex ME3 et le prisonnier turien d’Incarceration restent limités à leur banc explicite, sans élargir les dix anciens rosters.

Les ateliers exposent **76 équipements compatibles : 11 ME2, 31 ME3 et 34 Andromeda**, soit 64 armes, dix armures et deux familles de modules. Leur préparation libre ne simule aucune acquisition, aucun recrutement ni déblocage d’origine. Les alternatives Samara/Morinth et Ashley/Kaidan restent exclusives ; les armures personnelles sont réservées au protagoniste autorisé. Les modèles dont la charge, les cellules, l’édition ou une autre mécanique manque restent fermés. Les statistiques, réserves, effets et rythmes sont des adaptations ATB.

Les six nouveaux profils distinguent les projectiles explosifs différés de Falcon et des deux Scorpion, le rayon à chaleur du P.A.W., le jet électrique à clips du Reegar et les salves à chaleur du Sweeper. Les profils sont reconstruits depuis un identifiant connu, sans paramètres mécaniques importés depuis la sauvegarde. Les détails physiques et ressources originales ne sont pas vérifiés intégralement ; les [sources contrôlées](research/chronicle-specialist-sources.md) distinguent les faits secondaires du manuel Andromeda effectivement lu. Ce dernier ne contient pas les fiches individuelles de ces armes et ne certifie donc pas leurs paramètres.

Treize mécaniques ajoutées depuis le premier lot sont reliées aux fiches de pouvoirs, avec leurs restrictions de cible et leurs états. Les **47 fiches de pouvoirs utilisées correspondent à 21 commandes ATB** : plusieurs œuvres et variantes partagent des commandes adaptées. Grenades à fragmentation et collantes dépensent des charges finies, sans clip d’arme ni recharge temporelle ; le stock initial de trois est un budget d’essai. Le soutien de Cora restaure les boucliers des alliés vivants, puis accélère leur recharge, sans soin de santé ni résurrection. Les durées, dégâts et protections ne certifient pas les valeurs originales. Les pouvoirs de loyauté ME2 restent conditionnés aux bancs préparés après loyauté. Aucune capacité non attestée n’est déduite pour Peebee ; l’ancienne mention de Flak Cannon dans ses capacités manquantes est retirée.

Les six classes de Shepard dans ME2 et dans ME3, les trois préparations combat/biotique/technologie de Ryder et les dotations par défaut limitent les capacités et familles d’armes disponibles. Les profils de protagonistes ne reconstituent pas tous les rangs, talents, passifs ou spécialisations ; les bancs de prologue gardent leur dotation par défaut. Les 42 profils sélectionnables restent partiels.

Les deux modules ME3 sont des **prototypes de familles**, canon et chargeur, compatibles seulement avec les fusils d’assaut ME3 à clips autorisés dans l’atelier. Chaque port affiche son motif de refus ; les doublons de famille sont refusés. Le canon renforce les tirs, sans renforcer les pouvoirs. Remplacer ou retirer l’arme retire ses deux modules ; rééquiper la même arme les conserve. Aucun rang ni modèle original précis n’est certifié par ces profils de familles.

Seize parcours documentaires proposent **52 pages paraphrasées et sourcées** : les neuf précédents restent inchangés, sept parcours courts ajoutent Deception, Homeworlds nº4, Foundation nº5, Discovery, Incursion, Inquisition et le segment `evo-contact` d’Evolution. Ils utilisent 82 fiches établies, dont 59 références de lieux, récit ou continuité, sans promouvoir leurs acteurs en combattants. Aucun dialogue canonique, choix alternatif ni récompense n’est inventé. Deception distingue l’annonce de corrections d’une édition corrigée réellement vérifiée. Inquisition conserve un traître présumé sans affirmer son nom ou sa culpabilité. Les autres segments d’anthologies restent fermés lorsqu’aucun fait précis n’est attesté.

Les sauvegardes, préparations et résultats des Chroniques sont séparés de la campagne ME1 et de ses six emplacements manuels. Aucune victoire ni lecture ne transfère crédit, expérience, choix narratif, personnage ou équipement dans ME1. La migration des préparations v1 conserve arme et armure, puis initialise les deux ports de modules vides. Les profils `builds` et la progression `readingProgress` sont validés séparément ; les notes personnelles ne sont pas réutilisées pour stocker une page de lecture. Le registre et les essais ne modifient pas les statuts documentaires par leur simple existence. Aucun atlas ni portrait supplémentaire n’est livré : la présentation utilise des symboles de prototype. Les campagnes complètes, la mise en scène, les costumes et les mécaniques propres aux œuvres restent à produire.

Les contrôles dédiés se trouvent dans `tests/continuity*.test.js`, `tests/save-continuity.test.js`, `tests/chronicles.test.js` et `tests/universe-*.test.js`. `npm run test:universe` exerce l’interface et l’isolation des sauvegardes ; `npm run test:chronicle:expansion` couvre les nouvelles préparations, pouvoirs, ports, migrations et lectures. Les résultats dépendent des rapports de l’exécution concernée, pas de ce décompte de fonctionnalités. Les rapports antérieurs restent les preuves de leurs propres commits.

## État du contenu restant

Les 100 sous-zones et 91 liaisons du catalogue ne constituent pas encore des parcours complets. Parmi les 65 fiches de quêtes secondaires/DLC, 14 ont un prototype jouable et 51 restent Définies. Les 43 nouvelles fiches d’étapes complètent ces quêtes sans être comptées comme des missions supplémentaires. Les dialogues complets, les cinématiques, les romances, le Mako pilotable, les variantes visuelles d’équipement, les animations et les campagnes ultérieures intégrales restent à réaliser. La présence d’un nom, d’un atlas ou d’un chemin prévu ne suffit pas à terminer une fiche.

Pour reproduire une scène précisément, il faut identifier l’édition, les étapes et conditions, les références de carte ou de costume et les embranchements attendus. Le dépôt conserve des liens de manuels et de guides, mais pas un relevé primaire complet de ces éléments. Les captures de `docs/screenshots/` représentent le prototype.

Après activation des domaines réseau, le manuel officiel PC français, l’extrait officiel Prima et la page EA comparant les éditions ont été consultés avec succès (HTTP 200). Les empreintes, pages et règles lues sont consignées dans [equipment-primary-reference-report.json](qa/equipment-primary-reference-report.json). L’extrait Prima contient 23 pages, pas les tables complètes des objets. Les pages Weapons et Upgrades de Fandom ont répondu HTTP 402 ; leur contenu n’est pas présenté comme nouvellement consulté. Les différences de visée, chauffe et spécialisations entre original et Legendary Edition sont documentées ; les valeurs individuelles restent à relever dans l’édition retenue.

L’accès Git natif au dépôt fonctionne et permet les pushes sur `main`. L’autorisation d’un domaine ne garantit ni l’accès à toutes ses pages ni les droits d’un compte distant ; les réponses observées sont conservées avec leur date.

L’intégration Git Vercel est observée dans les contrôles GitHub de la PR nº1. Elle déclenche ses déploiements sans session CLI locale. Aucun secret ni identité Vercel n’est configuré dans le runtime observé ; les paramètres de production et le jeu distant n’ont pas été vérifiés par l’API. Voir [DEPLOYMENT.md](DEPLOYMENT.md) et le [relevé daté](qa/vercel-github-integration-report.json).

## Auditer les fiches

```bash
npm run audit:fidelity
npm run audit:fidelity -- --include-universe
```

L’audit écrit `test-results/fidelity-report.json`. Il sépare les statuts déclarés, les fichiers réellement présents, les répertoires seulement prévus, les dépendances et les références canoniques. Chaque fiche non validée conserve son critère d’acceptation. L’existence d’une URL ne valide pas son contenu ; un test fonctionnel ne certifie pas la fidélité visuelle. Les statuts ne sont jamais promus automatiquement.

# Commandes, affichage et accessibilité — lot Completion

Base : `0d76912517a91c5d2ad00f1ef5718188b40abd8e`. Ce lot garde les sprites HD, le renderer Three.js r180, la campagne ME1 condensée et les règles ATB. Il ne produit pas de nouvel asset visuel ni de dialogue canon.

## Changements exécutables

`src/completion-accessibility.js` gère des préférences d’appareil séparées des sauvegardes de campagne : qualité du rendu, luminosité, intensité des effets et contraste. L’objet JSON versionné est strictement validé. Un réglage malformé est ignoré sans effacer sa valeur avant un changement explicite. Si le stockage est indisponible, le réglage reste utilisable pendant la session et le message le précise. La luminosité est calculée depuis l’exposition initiale ; réappliquer un réglage ne la multiplie pas de nouveau.

Les trois qualités changent la définition du rendu et les ombres, sans annoncer de gain de FPS. Les changements s’appliquent immédiatement à la même campagne. Les options existantes « Texte agrandi » et « Réduire animations et flashs » restent des préférences de campagne. Le renderer conserve les poses et états des acteurs, les dégâts, jauges et messages lorsque les particules, secousses, teintes rapides et pulsations sont réduites. La réduction ne crée aucune immunité ni modification de coût ou de temps ATB.

`src/completion-accessibility.css`, importée après les styles existants, borne les fenêtres à la hauteur disponible et laisse défiler leur contenu. Elle traite aussi les dialogues génériques longs, auparavant dépourvus de borne commune, et agrandit les textes et commandes du combat. Les réponses suivent le texte dans le même panneau défilant. Les trois onglets de l’atelier et ses boutons se replient à petite largeur.

Un chevauchement du journal et du haut du panneau tactique a été observé à 390×844. Le journal mobile occupe désormais la largeur disponible moins 32 pixels et commence à 100 pixels du haut : les trois messages gardent leur texte complet avec moins de retours à la ligne. L’ancienne CSS et la revue négative du diagnostic `completion-controls-combat-dev-05` restent conservées. Les captures suivantes sont distinctes ; le diagnostic 07 conserve aussi son échec global de gel lorsque `state.js` a changé pendant la correction parallèle des validateurs.

`src/gamepad-controls.js` utilise maintenant le panneau défilant contenant réellement le focus pour le stick droit et les touches Page haut/bas, Début et Fin. Ces touches gardent leur fonction native dans les champs de saisie. L’aide ne propose Retour/Échap que si une vraie commande de retour est disponible ; une réplique obligatoire conserve ses réponses comme chemin de sortie. La méthode d’entrée active reste affichée.

Une régression a été démontrée dans Chromium : Tab peut visiter un conteneur défilant natif sans attribut `tabindex`, puis la réparation à la frame suivante restaure le bouton précédent. Le pied d’atelier devient ainsi inaccessible. Le lot traite désormais chaque Tab/Maj+Tab à partir de la liste des commandes actives du panneau ; les autres touches des champs gardent leur traitement natif. La trace négative et l’ancien module restent archivés dans `docs/qa/completion-controls-focus-bug-01-review.json` et ses références.

L’option « Tester la lisibilité des sous-titres » ouvre le dialogue normal du jeu avec un exemple explicitement désigné comme tel : douze paragraphes français, noms longs, apostrophes, accents et six réponses. Chaque réponse revient aux options sans décision de campagne. Ce contenu d’affichage ne remplace pas les dialogues du jeu.

## Raccords et invariants

Le module reçoit `world` et `onReadabilityPreview` dans `createCompletionAccessibility`. L’écran Options ajoute `renderSettings()`, et `applySettings` appelle `applyCampaignSettings(state.settings)`. Le callback utilise `speak` avec `accessibilityPreview:true`, traduit en `data-readability-preview` sur le dialogue. Aucun global QA ni commande privée n’est ajouté au build.

Le monde lit `visualAccessibility` dans ses effets et son animation. Le garde de `_impact` couvre aussi l’appel direct lors d’une variation des PV. Les poses et les états sont mis à jour avant de supprimer un effet ; le texte et les jauges restent les signaux alternatifs lorsque le son est coupé.

## Vérification et périmètre des critères

Les tests natifs nouveaux vérifient validation sans exécuter d’accesseur, application absolue, indépendance des ressources de campagne, persistance, refus de stockage, événements inter-onglets, traitement des entrées, suppression des effets du renderer et navigation de lecture. Ils complètent les quatorze tests manette existants.

Le collecteur `scripts/completion-controls-browser.mjs` parcourt l’application publique avec Tab, Entrée, Espace, les flèches et un contrôleur standard déclaré dans `navigator.getGamepads`. Il importe ses sauvegardes natives par le vrai sélecteur de fichier et observe les exports réellement téléchargés. Il prépare explicitement un omni-tool possédé et la première rencontre d’Eden ; il ne prétend pas avoir joué les étapes antérieures. Le passage long est une fixture visible d’affichage.

L’import des fixtures est déclenché par un clic public réel après avoir rejoint Importer par Tab. Les premiers essais de confirmation clavier du sélecteur système, intermittents, restent conservés. Ce clic appartient à la préparation déclarée, pas à une preuve de navigation du sélecteur OS au clavier/manette. Les taps du contrôleur virtuel durent exactement une lecture de `navigator.getGamepads` : une frame WebGL coûteuse ne les transforme pas en direction maintenue par la latence d’automatisation.

La préparation du combat utilise les vraies options Économie, puis Pause/Reprendre et des lectures neutres. L’application immédiate du profil Élevée et sa conservation après rechargement sont vérifiées auparavant. Cette sélection publique d’appareil ne modifie ni les règles, ni l’ATB, ni les dimensions du texte DOM ; elle ne constitue pas une mesure de gain de FPS. Les essais logiciels trop lents ou interrompus restent négatifs sous leurs préfixes d’origine. L’entrée de rencontre et l’ordre naturel sont préparés à 1280×720 dans le parcours complet, puis les autres tailles sont vérifiées indépendamment.

Tailles vérifiées dans les parcours finaux : 1280×720, 1920×1080, 2560×1440 et 390×844. Le parcours couvre les préférences actives sans reprise de sauvegarde, toutes les réponses longues, les trois onglets d’atelier à largeur de bureau et de téléphone avec texte agrandi, Préparer, Annuler par Échap, Appliquer, la géométrie du canvas et un ordre ATB naturellement prêt en combat muet avec effets réduits. Les captures sont réellement ouvertes et revues, liées par SHA au rapport brut de chaque essai. Le build de production sert uniquement son arbre `dist` gelé.

Les propositions de suivi sont dans `docs/qa/completion-controls-tracking.json`. Une proposition reste incomplète avant les natifs frais, le parcours DEV courant et sa revue réellement ouverte. La production est une porte de livraison séparée : `productionPending:true` reste explicite et commit/push demeurent bloqués jusqu’aux portes de production post-synchronisation du parent. Les critères sont repris sans modification. La simulation logicielle ne certifie ni manette physique, ni vibration, ni pilote, ni appareil mobile réel ; ces limites ne sont pas ajoutées artificiellement au texte historique d’un critère logiciel. La revue visuelle ne certifie pas une fidélité artistique 1:1.

## Panneau tactique ME1 — correction de visibilité déléguée

Le parent a transféré la modification de `src/tactical-ui.js` après une capture monde à 1280×800 : la barre de conseils/repli de 126–146 pixels recouvrait Shepard et les adversaires après une action. L’ancien module est conservé dans `docs/qa/completion-controls-tactical-before-01.js` et la capture initiale reste inchangée.

Les commandes principales gardent leurs actions et conditions, avec des libellés courts, des noms accessibles complets et des titres. Les conseils et la raison de repli sont dans une aide native facultative. Le contenu fermé est explicitement `display:none` : Chromium gardait autrement une boîte pour la région de lecture et sa présence interrompait Tab avant le retrait d’un ordre. Les chips d’ordres préparés restent hors Aide, visibles et retirables. Pendant le brouillon la barre reste au haut de son panneau, avec une marge de défilement pour atteindre les commandes et les cibles.

Les styles sont rendus uniquement avec ce composant ME1 et conditionnés à `#battle-ui:has(> [data-compact-tactical])`. Ils bornent le panneau à 40dvh, puis 44dvh sur téléphone. Le moteur, la caméra, les états de couverture, les coûts, les réservations et les récompenses ne changent pas. La place libérée laisse les cinq sprites visibles ; le contenu long du panneau reste défilant.

`completion-controls-tactical-dev-04` parcourt le vrai combat Story/Attente avec trois jauges chargées/réservées naturellement, puis Couverture et sélection automatique de Kaidan. Il ouvre, lit et referme l’aide au clavier et avec A virtuel ; il prépare puis retire un ordre visible avant Exécuter aux deux tailles. Les ressources de combat sont comparées inchangées pour ce brouillon. Le rapport brut, les treize images réellement ouvertes et la comparaison avant/après sont liés dans sa revue SHA. Les essais intermédiaires restent conservés ; ce parcours court ne remplace pas les portes longues de livraison.

## Preuves finales du 13 novembre 2026

Le [natif global final06](../qa/completion-integration-final-06-report.json) passe les 1 060 tests sur les sources produit gelées. Le [parcours public DEV08](../qa/completion-controls-dev-final-08-report.json) passe ses quatre groupes et produit dix-huit captures ; sa [revue complète](../qa/completion-controls-dev-final-08-review.json) attribue les douze premières ouvertures à `priority_controls` et les six dernières à `root`, avec les SHA de chaque image et du rapport brut.

Le [parcours production01](../qa/completion-controls-production-final-01-report.json), exécuté sur `http://127.0.0.1:4194/` avec le même collecteur gelé que DEV08, passe également les quatre groupes et produit dix-huit captures. Sa [revue des dix-huit images](../qa/completion-controls-production-final-01-review.json) conserve la même attribution réelle : douze ouvertures par `priority_controls`, six par `root`. La [revue déléguée de ces six images](../qa/completion-controls-production-final-01-root-review.json) est liée par SHA, ainsi que le rapport brut et le build. Le parcours constate un arbre `dist` de 91 fichiers inchangé et vérifie les octets de 50 réponses HTTP contre ce build, sans requête de source ou `@vite`, erreur console ou requête échouée. Chrome est fermé après cette exécution ; la porte de livraison globale reste coordonnée par le parent.

Ces preuves utilisent les commandes clavier réelles et une manette standard virtuelle déclarée dans `navigator.getGamepads`. Elles ne certifient ni matériel physique, vibration, pilote, sélecteur système au clavier, téléphone réel, gain de FPS, campagne entière ou fidélité artistique 1:1. Les fixtures natives, le passage long d’affichage et la préparation publique Économie/Pause/Reprendre restent explicites dans les rapports.

Deux réserves visuelles non bloquantes sont conservées : à 390×844 avec texte agrandi, « Annuler » et « Profil gauche » reviennent à la ligne, tandis que leurs boutons restent visibles et activables ; à 1280×720, l’aide au bas du panneau de combat se lit par défilement. Les commandes principales, les cibles et leur focus contrasté restent accessibles.

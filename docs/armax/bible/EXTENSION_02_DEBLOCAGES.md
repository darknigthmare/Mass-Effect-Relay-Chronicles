# Armax — dossiers verrouillés, progression et droits d'accès

**Extension 02 · 27 novembre 2026 · conception, sans service de paiement actif.** Source intégrale : [Combat Games Extension 02 v1.0](../guides/Combat_Games_Extension_02_Slots_Verrouilles_Deblocages_Abonnes_v1.0.txt), sections **50–67**. Les [données de conception](extension-02-specs.json) définissent règles, exemples et 22 cas d'acceptation ; la [matrice commune](guide-coverage-2026-11-27.json) relie ces éléments au guide original.

Les conditions décrites sont des propositions de progression pour le mode Armax. Elles n'ajoutent pas de verrous au jeu hôte existant et ne donnent pas de statut officiel à une tenue ou à un lieu. Les quatre axes **découverte / droit / disponibilité technique / compatibilité de partie** restent distincts. Un fichier artistique inachevé n'est jamais caché derrière une condition d'achat.

<a id="g50"></a>
## 50. Périmètre et décisions

Le module est retenu pour les personnages et soutiens du roster admissible, costumes, palettes, stages, scènes, taunts, archives et défis. Les modes avancés peuvent recevoir une condition explicite ; réglages, accessibilité, tutoriel de base, entraînement des mécaniques déjà jouables et sortie du jeu restent accessibles. Le Boss Rush peut dépendre de rencontres préalables, sans exiger d'avoir déjà terminé ce même mode.

La présentation de contenus pour soutiens est retenue **en spécification**, sous trois modèles séparés : récompense permanente, catalogue temporaire et lot de période. Aucun fournisseur, campagne, niveau, prix, calendrier commercial ni droit externe n'est configuré. Les bénéfices restent désactivés dans les données de cette passe ; il n'y a ni page de paiement, ni bouton de souscription opérationnel, ni liaison de compte déployée.

L'extension 01 apporte les profils d'équipe, sélections et [archives de simulation](EXTENSION_01_EQUIPES_ET_BONUS.md#g43). La progression Armax dispose de son propre espace de sauvegarde. Débloquer Legion au roster ne le recrute pas dans ME2 ; voir Nyreen dans une galerie ne la ressuscite pas ; obtenir un dossier Ryder ne crée pas de visite physique à la Citadelle de Shepard.

<a id="g51"></a>
## 51. Quatre dimensions d'état

| Dimension | Valeurs de conception | Effet sur le joueur |
|---|---|---|
| Découverte | `secret`, `indice`, `identifie` | Détermine nom, silhouette, voix, texte et aperçu montrables |
| Droit | `aucun`, `a_reclamer`, `permanent`, `temporaire_actif`, `verification`, `expire`, `retire` | Détermine les sources autorisant sélection et équipement |
| Technique | `pret`, `installation_requise`, `version_incompatible`, `indisponible` | Détermine si les fichiers et règles nécessaires peuvent être chargés |
| Partie | `compatible`, `mode_interdit`, `periode_interdite`, `dependance`, `doublon` | Détermine l'admission dans la composition et le chapitre courants |

Ces dimensions se combinent. **Identifié + permanent + installation requise + compatible** donne « Acquis — installation nécessaire ». **Identifié + permanent + prêt + période interdite** donne « Acquis — indisponible dans ce chapitre ». **Secret + aucun** ne révèle ni nom ni silhouette reconnaissable. **Temporaire actif + prêt + dépendance** conserve le droit et explique quel personnage ou costume parent manque.

Les droits sont calculés depuis une liste de sources, jamais écrasés par un simple booléen. Une source permanente valide suffit pour le contenu lorsque la règle d'accès est un OU, même si une autre source temporaire expire. « Vérification en cours » concerne la source non confirmée ; elle ne rend pas inconnue une acquisition permanente déjà enregistrée. L'état global présente l'obstacle utile suivant et garde les autres motifs consultables.

Ordre d'affichage proposé : appliquer le masque de découverte ; identifier les droits valides ; montrer le prochain acte réellement utile ; présenter disponibilité et compatibilité. Cet ordre n'autorise jamais une sélection avant le contrôle complet. Un droit temporaire non vérifié n'est pas inventé pour faire disparaître un message d'erreur.

<a id="g52"></a>
## 52. Charte visuelle Mass Effect

La métaphore est celle d'un **dossier de simulation et d'une autorisation d'accès**, avec plans holographiques sobres, grille de scan et badge de statut. C'est une proposition d'interface du projet, pas un nouvel objet canonique. Le cadrage conserve les visages, équipements et silhouettes des références de l'opus ; le symbole de verrou ne masque pas les informations utiles.

Palette candidate : fond bleu très sombre `#071A26`, texte clair `#E7F6FA`, focus cyan `#8FE7FA`, silhouette noire sur panneau contrasté. Les hexagones, cadres et pistes de scan sont décoratifs ; ne pas attribuer un alphabet alien inventé à une faction. Chaque état possède une forme, un texte et une icône ; la couleur seule ne suffit pas.

| État lisible | Présentation | Réaction de focus et confirmation |
|---|---|---|
| Dossier secret | Emblème de dossier neutre, sans silhouette, nom ni voix | « Dossier non révélé » ; ouvre l'indice autorisé |
| Indice révélé | Silhouette noire autorisée par sa fiche, verrou de dossier | Condition courte visible, détail accessible |
| Identifié, à débloquer | Portrait assombri avec badge fermé | Affiche la voie de progression, sans ajouter à l'équipe |
| Récompense disponible | Badge de réception distinct, stable | Propose Réclamer seulement si la règle l'exige |
| Acquis permanent | Portrait révélé et marque de collection | Sélection si technique et contexte compatibles |
| Accès temporaire | Portrait révélé et marque de durée | Modalités et échéance seulement si connues |
| Installation / erreur | Icône dédiée, pas un cadenas de progression | Installer, réessayer ou choisir un contenu disponible |

Le déblocage reconstitue brièvement l'aperçu et ouvre le cadre. Le mode réduit fait apparaître portrait et texte sans balayage ni flash. Le choix devient utilisable avant la fin de la scène si les dépendances sont prêtes. Une seconde visite ne rejoue pas de force la révélation. Le son confirme l'événement mais le texte et le badge le portent aussi.

<a id="g53"></a>
## 53. Personnages, variantes et partenaires

Une case verrouillée reste focalisable et ouvre sa fiche. La confirmation explique la condition, sans boucle d'erreur ni membre invalide ajouté à l'équipe. L'aléatoire filtre successivement droits, installation, profil de règles, période et doublons. Les préréglages sauvegardés conservent le choix souhaité mais demandent un remplacement explicite si un membre ne peut plus être utilisé.

**E2-SLOT-LEGION-ME2** associe la proposition de droit à l'identité artistique existante `chr_me2_legion_standard`. Le nom et la silhouette restent masqués au niveau secret ; le viseur et la tête geth ne servent pas de pseudo-secret. Le bonus de maîtrise d'entité peut proposer Legion comme **prêt d'exercice**, indépendamment de l'accès au roster, afin d'éviter une condition circulaire. Le prêt finit avec l'exercice ; sa présence ne vaut pas acquisition. Une fois la règle de collection remplie, le contenu est acquis pour les modes de simulation admis, sous réserve d'un kit réellement intégré.

Le droit au combattant inclut les entités indispensables à son kit de référence. Le drone ne devient pas un achat séparé rendant le personnage incomplet. Une version assistance ne devient disponible que si une fiche de soutien et ses ressources sont prêtes ; le même droit peut la couvrir, mais **droit commun** ne veut pas dire **implémentation commune**. Une super de duo non produite n'est pas représentée comme un verrou d'abonnement.

Une variante de gameplay différente conserve son propre ID, sa période et son contrôle d'admissibilité. Un changement de costume cosmétique ne constitue pas une nouvelle identité ; un boss uniquement ne devient pas sélectionnable à cause d'une récompense de galerie.

<a id="g54"></a>
## 54. Costumes, palettes et accessoires

Chaque apparence référence son personnage, sa version, son costume parent éventuel et la provenance de sa représentation. L'aperçu libre ne donne pas le droit de l'équiper. La fiche indique **officiel de l'opus**, **adaptation**, **original compatible** ou **alternatif**, avec les réserves de fidélité de l'image. Les costumes existants restent contrôlés par leurs manifestes artistiques ; leur nouvelle voie d'acquisition ne les certifie pas 1:1.

**E2-SLOT-KESTREL-F-ME2** se rattache à `cst_me2_shepard_female_kestrel`. Le costume peut être gagné avant le profil Shepard féminin correspondant : le droit est conservé et le message devient « Costume acquis — profil requis ». Son aperçu est autorisé en galerie selon découverte ; la campagne peut le refuser hors de sa période. Sa silhouette et ses collisions restent celles du kit validé, sans avantage dû à la source d'acquisition.

Les réglages de confort et les palettes nécessaires pour distinguer les joueurs ne sont pas des récompenses payantes. Une décoration de soutien proposée reçoit un ID séparé, le statut **original compatible à confirmer**, et ne remplace pas les matériaux ou emblèmes d'un costume officiel sans signaler cette variation. Les effets de particules décoratifs ne cachent ni arme, ni départ d'attaque, ni adversaire. Une tenue qui modifie les capacités devient une variante documentée, pas un skin silencieux.

Un doublon permanent conserve l'acquisition et n'allonge pas artificiellement une période. Le premier modèle ne prévoit aucune dépense ni compensation automatique : le joueur voit « Déjà acquis » avant toute réclamation d'un objet déjà reçu.

<a id="g55"></a>
## 55. Stages, présentations et destinations

Le stage, ses variantes de période, ses présentations visuelles, ses événements et ses destinations sont des objets distincts. L'accès à un stage inclut les versions **vivante, réduite et statique** prévues pour le confort. Un verrou ne doit pas obliger à payer pour réduire les distractions. Les collisions, limites et annonces utiles restent identiques lorsque la variante n'est que visuelle.

**E2-SLOT-TUCHANKA-ME2** pointe `stg_me2_tuchanka_urdnot`, avec les quatre composants de marché déjà suivis séparément. Le droit à la sélection ne transforme pas ces candidats en arène assemblée. Tant que sol, limites, raccords, couches et chargement ne sont pas vérifiés, l'état technique reste `indisponible` ou `installation_requise` selon la cause réelle. Une image candidate seule n'autorise pas un match.

Une ambiance de soutien proposée pour une arène de simulation utilise la même géométrie normalisée. En partie privée future, le détenteur pourrait la sélectionner et l'adversaire y participer sans acquisition : c'est une **politique retenue à implémenter**, conditionnée à la distribution de tous les fichiers nécessaires aux deux participants. Le non-détenteur ne reçoit pas le droit de la choisir plus tard. Si un paquet manque ou si les versions divergent, le match n'est pas lancé dans cet état : proposer une arène commune avant validation.

Toutes les destinations d'une transition autorisée font partie du paquet de match. Les deux joueurs doivent pouvoir les charger sans achat supplémentaire pendant le combat. À défaut, sélectionner une configuration sans transition avant le match ; jamais placer une porte bloquée derrière un combo. Une variante détruite d'un lieu conserve sa politique anti-spoiler propre.

<a id="g56"></a>
## 56. Modes et parcours avancés

Le menu conserve des tuiles explicatives pour les défis avancés, le Boss Rush, les routes alternatives et les zones d'archives. Une condition doit montrer l'activité qui permet de progresser. L'initiation, les réglages et les aides restent accessibles sans victoire préalable. Un mode non développé reçoit « En préparation » dans le suivi de production ; il n'est pas présenté au joueur comme une épreuve impossible à débloquer.

**E2-MODE-BOSS-RUSH** propose une condition d'accomplissement : terminer trois fiches de rencontres distinctes du parcours d'introduction, avec prêt de kit si nécessaire. Ces rencontres sont accessibles séparément sans le Boss Rush. Le choix exact des trois boss reste un blocage de conception explicite avant intégration ; la règle ne prétend pas que les boss sont déjà jouables. Les résultats seront conservés par ID et version de rencontre, pas par nom traduit.

Aucun mode essentiel n'est réservé au soutien dans ce premier module. Un mode spécial éventuellement proposé plus tard demanderait sa propre fiche, permanence ou durée, récompenses, accès d'entraînement et règle d'expiration ; il ne serait pas assimilé automatiquement à un skin cosmétique.

<a id="g57"></a>
## 57. Conditions ET/OU et progression

Les règles ci-dessous sont des expressions de **conception**, pas un moteur d'autorisation déjà chargé. Chaque événement devra provenir de l'autorité déclarée du mode. Les identifiants sont stables, avec la version du catalogue et un journal d'attribution distinct des préférences d'affichage.

| Règle | Expression exacte proposée | Attribution et dépendance |
|---|---|---|
| E2-RULE-LEGION | `initiation_terminee ET bonus_entite_termine ET borne_legion_consultee` | Permanente, à la borne ; bonus réalisable avec kit de prêt |
| E2-RULE-KESTREL-F | `galerie_ouverte ET (bonus_precision_termine OU bonus_destruction_termine)` | Permanente et automatique ; garde le costume si le profil parent manque |
| E2-RULE-TUCHANKA | `dossier_tuchanka_identifie ET (route_grunt_terminee OU bonus_resistance_termine)` | Permanente ; accès technique indépendant |
| E2-RULE-ARCHIVE-FIRST | `initiation_terminee ET borne_accueil_consultee` | Première scène de collection ; un seul événement d'attribution |
| E2-RULE-SUPPORT-DEMO | `defi_cosmetique_termine OU justificatif_temporaire_valide` | Exemple de multi-source ; bénéfice externe désactivé |

Les alternatives sont affichées comme alternatives. La dernière règle n'est jamais transformée en **défi ET abonnement**. Le contenu obtenu par défi reste permanent ; la source de soutien ne peut le retirer. Les règles de ces exemples ne réattribuent pas de force une récompense à une sauvegarde ancienne : la rétroactivité exige un événement effectivement conservé et compatible. Sinon, proposer une activité alternative explicite.

Pour E2-RULE-TUCHANKA, le bonus de résistance E1-BONUS-10 prête le kit Grunt ME2 dans l'exercice, sans exiger de l'avoir acquis au roster. Le dossier de Tuchanka peut être identifié depuis la galerie déjà accessible. Cette voie reste indépendante de l'accès à sa route, et évite que le stage, Grunt et le bonus se demandent mutuellement comme prérequis.

Les compteurs sont attachés au profil Armax, avec mode admissible, objectif et période. Un abandon ne valide pas une réussite. Un record peut se mettre à jour indépendamment de la récompense. Les prédicats doivent être acycliques ; l'analyse inclut contenu, portes, personnages prêtés et activités. La sauvegarde du RPG et les crédits ME1 ne servent pas de monnaie cachée pour ces conditions.

<a id="g58"></a>
## 58. Exploration, récompenses et révélation

Les bornes des archives consomment le catalogue commun des droits. Elles ne créent pas une autre version d'un costume ou d'un personnage. L'accès à la pièce, l'ouverture de la borne, l'attribution et la scène sont des opérations séparées. Le premier réglage n'utilise pas de coût consommable ; une transaction future qui en utiliserait un devrait conserver débit et attribution ensemble.

Ordre de conception : vérifier conditions → identifier la clé d'attribution → enregistrer une acquisition unique → confirmer la sauvegarde → révéler le portrait/scène. En cas d'erreur d'enregistrement, expliquer que la récompense reste à réclamer et ne pas simuler sa perte. Le passage de la scène ne peut annuler une acquisition déjà enregistrée. Après relance, la borne montre son état réclamé ; le joueur peut revoir la présentation dans la galerie.

La clé de déduplication comprend profil, règle, contenu et période si applicable. Elle ne dépend pas de la session de menu. Une deuxième interaction, un double clic ou un même événement reçu deux fois doit retrouver le même résultat. Si une acquisition permanente existe déjà par une autre voie, la borne indique « Déjà acquis » et conserve toutes les provenances utiles.

L'espace consacré aux soutiens reste une galerie de présentation facultative. Les modalités externes sont clairement hors fiction : aucun personnage n'est supposé avoir souscrit à Patreon pour ouvrir une porte du Normandy. Le vocabulaire de dossiers sert à la cohérence visuelle, pas à dissimuler la nature de l'accès.

<a id="g59"></a>
## 59. Trois modèles de soutien distincts

| ID de conception | Modèle | Attribution | Fin ordinaire de l'abonnement |
|---|---|---|---|
| E2-BENEFIT-PERM | Récompense permanente | Événement admissible confirmé, contenu identifié, attribution unique | Contenu conservé |
| E2-BENEFIT-TEMP | Catalogue temporaire | Justificatif valide pour ce catalogue, début et fin si établis | Seule la source temporaire expire |
| E2-BENEFIT-PERIOD | Lot de période | Lot/version/période admissible explicitement accordés | Chaque lot suit la permanence annoncée ; pas d'acquisition des lots passés par défaut |

Les trois bénéfices restent `enabled: false`, avec fournisseur/campagne/niveaux/dates non configurés. Leurs exemples ciblent de futures décorations de galerie ou ambiances originales compatibles, sans effets sur les statistiques. Aucun montant, avantage réel ou échéance n'est inventé. Les choix de permanence sont exposés avant toute éventuelle activation.

Une simple liaison de compte n'est pas une preuve de paiement ni d'admissibilité. Essais, cadeaux, adhésions gratuites, baisse de niveau, anciens lots et autre voie en jeu demandent chacun une politique. Un nom commercial modifié ne change pas les IDs de bénéfice. Une offre future doit annoncer dépendances, plateformes, durée, éventuelle autre acquisition, participation au stage et traitement des droits déjà gagnés.

Les références de modèles commerciaux dans le guide utilisateur sont conservées comme provenance de sa rédaction. Cette passe n'effectue pas de nouvelle validation des conditions d'un fournisseur et ne prétend pas activer son API.

<a id="g60"></a>
## 60. Liaison avec un fournisseur — contrat différé

Le futur parcours, s'il est retenu, est volontaire : compte de jeu clairement identifié → fournisseur choisi → autorisation officielle → vérification dans un service de confiance → état expliqué dans le jeu. Le mot de passe du fournisseur ne doit pas être demandé dans Armax. Les secrets d'application et jetons sensibles ne sont pas intégrés au client web public.

Le service de confiance devra associer fournisseur, campagne, identifiant de compte, bénéfices et période. Un résultat local « abonné = vrai », une capture d'écran ou une adresse courriel identique n'est pas une autorité suffisante. Les événements doivent être authentifiés, dédupliqués et réconciliés avec l'état autoritatif, en supportant leur arrivée hors ordre. Le client reçoit seulement les informations nécessaires à l'affichage et au droit de contenu.

Les états **compte lié**, **vérification demandée**, **avantage confirmé**, **vérification indisponible** et **droit expiré confirmé** sont distincts. Le bouton de resynchronisation est borné pour ne pas multiplier les appels. La déliaison, l'arrêt de renouvellement et la suppression du compte de jeu sont trois actions différentes. Aucun changement silencieux de profil bénéficiaire ni livraison permanente dupliquée sur deux comptes n'est admis.

Avant une implémentation, relire la documentation officielle actuelle du fournisseur choisi et vérifier ce qu'il permet d'attester. Les chemins, scopes, signatures et dates de fin ne sont pas déduits des exemples d'un autre service. Cette annexe fournit le contrat de comportement, sans serveur, credential, webhook ni paiement déployé.

<a id="g61"></a>
## 61. Expiration, retrait et hors ligne

Une acquisition permanente validée reste utilisable hors ligne, indépendamment de l'état d'une source temporaire. Un accès temporaire suit un justificatif de confiance et sa validité réellement connue. **Réglage candidat retenu : aucune extension de validité au-delà du justificatif**, afin de ne pas promettre une durée qu'aucun service n'a fournie. Une future période de tolérance serait une règle versionnée distincte et annoncée. Si aucune fin vérifiable n'est disponible, afficher « Vérification nécessaire » pour la source temporaire, sans supprimer la progression.

| Événement | Traitement de la source | Conservation |
|---|---|---|
| Renouvellement arrêté | Attendre la fin effective confirmée, pas retrait immédiat universel | Acquisitions permanentes, découvertes et préférences |
| Service indisponible | `verification` pour la source concernée ; appliquer le justificatif encore valide | Pas de faux message « abonnement terminé » |
| Expiration confirmée | Désactiver cette source temporaire au prochain écran de préparation | Toute autre source valide continue d'autoriser |
| Remboursement/retrait confirmé | Appliquer seulement la politique publiée de cette source | Ne pas effacer un gain indépendant par défi |
| Déliaison | Cesser la nouvelle synchronisation ; expliquer les droits restants selon contrat | Distinguer permanent, temporaire et compte supprimé |
| Changement de niveau | Recalculer à la date effective vérifiée | Ne pas accorder automatiquement les anciens lots |

Une partie autorisée gèle sa configuration jusqu'à son résultat. Une expiration ne retire ni personnage, ni costume, ni stage au milieu d'un combo. La prochaine préparation de match recalcule les droits. Si le costume souhaité est devenu indisponible, conserver la préférence, proposer l'apparence de base et demander le choix nécessaire sans perdre toute l'équipe. Après réactivation, proposer de restaurer le choix, sans l'imposer silencieusement.

Un recul de l'horloge locale n'étend pas un justificatif externe. Une perte de connexion ne révoque pas une acquisition permanente. Les accomplissements et récompenses permanentes gagnés pendant une session valide restent inscrits conformément à leur règle, même si le catalogue qui permettait la session expire ensuite.

<a id="g62"></a>
## 62. Sélection, participation, entraînement et replay

Quatre autorisations sont séparées : **consulter**, **sélectionner/équiper**, **participer à un match**, **tester en entraînement**. La présence des images ne suffit pas à accorder la sélection. Voir un costume adverse ne l'ajoute pas à la collection. Un profil d'entraînement peut prêter un kit déjà intégré pour apprendre ses propriétés, sans récompense de possession.

Politique locale proposée : chaque joueur utilise son profil ; l'invité peut utiliser le roster de base et les prêts annoncés, sans recevoir les acquisitions du profil hôte. Un partage local éventuel d'un bénéfice externe reste bloqué tant que ses modalités ne sont pas définies. Le match valide les deux compositions et les fichiers nécessaires avant le lancement. Le hasard ne sélectionne jamais un élément inaccessible dans ce contexte.

Pour les stages spéciaux, la participation du non-détenteur est autorisée seulement dans la politique de paquet préparé de la section 55. La compétition utilise une liste de géométries communes et un règlement visible. La collection n'ajoute ni dégâts, ni jauge, ni hitbox plus petite. Une apparence qui réduit la lisibilité est refusée à la liste compétitive jusqu'à correction.

Les replays restent un module différé. Leur conception conserve versions des assets/règles, profils de match et droits de **lecture** séparés de la sélection courante. L'expiration d'un abonnement de l'auteur ne doit pas être l'unique condition de lecture d'un enregistrement ancien. Si une ressource manque, afficher le repli ou l'incompatibilité précise ; ne pas promettre un replay fidèle avec une version incompatible. La lecture n'attribue aucune récompense.

<a id="g63"></a>
## 63. Textes, accessibilité et surprises

| Situation | Texte court proposé | Action utile |
|---|---|---|
| Secret | « Dossier non révélé » | Voir l'indice autorisé |
| Condition à compléter | « À débloquer — consulter les conditions » | Ouvrir le défi ou la route |
| Récompense prête | « Récompense disponible aux archives » | Rejoindre la borne |
| Costume sans personnage | « Costume acquis — profil requis » | Voir le profil, avec masque si secret |
| Acquis mais fichiers absents | « Acquis — installation nécessaire » | Installer ou choisir un contenu prêt |
| Temporaire | « Accès temporaire actif » | Consulter la validité connue |
| Panne de vérification | « Vérification indisponible — réessayer » | Réessayer ou jouer le contenu accessible |
| Mode incompatible | « Indisponible dans ce mode » | Voir les modes autorisés |
| Permanent | « Acquis — conservé » | Sélectionner si les autres axes le permettent |

Chaque fiche possède un texte accessible soumis au même niveau de découverte. Aucun nom caché ne fuit dans le texte alternatif, la voix, l'infobulle, la notification, le titre de l'aperçu ou l'intitulé du costume. Les fichiers techniques ne constituent pas une garantie anti-extraction ; la promesse concerne les écrans et parcours annoncés. Les rencontres en versus peuvent révéler un adversaire choisi par quelqu'un d'autre : l'option anti-spoiler annonce clairement cette limite.

Le focus clavier/manette garde un cadre lisible et revient au slot consulté. Les détails se ferment sans perdre la sélection. Taille de texte, lecture d'écran, contrastes et mouvement réduit font partie des cas de validation. Aucun son ni couleur ne porte seul une information. Les alternatives gratuites et de soutien sont présentées avec la même clarté lorsque la règle les autorise ; aucun bouton de soutien ne remplace l'explication du défi.

<a id="g64"></a>
## 64. Sauvegarde, production et critères

Le schéma de conception conserve `schemaVersion`, `catalogVersion`, découvertes par contenu, sources d'acquisition, événements d'attribution, portes ouvertes, records, préférences et derniers résultats de vérification utiles. Les noms affichés sont localisés séparément. Les références sont des IDs de données ; aucun objet du renderer n'est sérialisé. L'état Armax ne réécrit pas la sauvegarde de campagne ni l'inventaire à neuf emplacements.

L'attribution doit être idempotente : même événement, même acquisition, pas de double débit ni renouvellement artificiel. Charger signifie vérifier version, migrer purement, valider, puis appliquer. Un format futur non pris en charge ou une donnée présente invalide conserve l'état courant et expose une erreur ; un champ ancien absent suit une migration explicite. Une acquisition permanente ne devient pas temporaire lors d'une migration de noms.

Les exemples de fichier temporaire/rename du guide gamedev ne sont pas supposés disponibles dans `localStorage`. L'implémentation web devra démontrer son propre comportement en cas d'interruption, limite de stockage et reprise. Les preuves actuelles ne couvrent aucune nouvelle sauvegarde de droits, puisque cette passe n'ajoute pas de code d'accès.

Les **22 scénarios E2-TEST-01 à E2-TEST-22** figurent dans [extension-02-specs.json](extension-02-specs.json) avec statut `a_tester` : secret sans fuite, navigation, attribution, ET/OU, doublon/interruption, costume avant personnage, permanent après expiration, temporaire expiré, annulation, panne, fichiers absents, deux sources, stage partagé, destination, expiration en match, équipement de repli, confort, dépendances, comptes, événements hors ordre, accessibilité et migration. Pour chacun, les futurs tests devront vérifier message, action, droit effectif, sauvegarde et possibilité de continuer.

<a id="g65"></a>
## 65. Six fiches complémentaires remplies

Les fiches **E2-A à E2-F** sont propres à cette extension ; elles ne remplacent ni les fiches générales A–J ni les fiches E1-A–J.

| Fiche | Exemple rempli | Points vérifiables |
|---|---|---|
| E2-A — Contenu/slot | E2-SLOT-LEGION-ME2 | ID artistique existant, secret neutre, prêt d'exercice, droit permanent de simulation, technique indépendante, drone inclus au kit |
| E2-B — Déblocage | E2-RULE-KESTREL-F | Galerie ET (précision OU destruction), automatique, permanente, profil Armax, doublon sans coût, parent indisponible conservé |
| E2-C — Soutien | E2-BENEFIT-TEMP | Exemple désactivé, fournisseur non choisi, preuve requise, validité du justificatif, autre voie par défi, aucune date inventée |
| E2-D — Charte | E2-UI-DOSSIER | Métaphore non diégétique, fond sombre/focus cyan, quatre axes, secret sans silhouette, version réduite et libellés |
| E2-E — Stage spécial | E2-STAGE-ACCESS-POLICY | Sélection réservée à source valide, participation sans acquisition, paquet complet, mêmes collisions, fin de match figée, repli avant lancement |
| E2-F — Matrice droits | E2-MATRIX-PERM-AND-EXPIRED | Source permanente valide + temporaire expirée + installé + compatible ⇒ « Acquis », sélection autorisée ; répéter après reprise |

Chaque exemple conserve des dépendances d'implémentation : catalogue runtime, état de droits, UI, services éventuels, fichiers livrés et scénarios de test. La conception ne transforme pas ces dépendances en fonctions terminées.

<a id="g66"></a>
## 66. Instruction de reprise du module

Pour la prochaine tranche : relier un contenu existant, une règle gratuite, une borne et un slot ; implémenter les quatre axes et le stockage séparé ; tester secret, droit acquis, fichier absent, parent absent et reprise ; ensuite étendre aux équipes, scènes et stages. Les bénéfices externes restent désactivés jusqu'à leur intégration séparée et vérifiée. Ne pas coder d'exception qui confond « image produite » et « déverrouillé ».

Chaque nouvel ajout cite sa section source 50–67, son ID de règle et ses contenus. Les statistiques séparent exigences documentées, contenus produits, parcours intégrés, scénarios exécutés et acquisitions de joueurs. Les 22 cas écrits ne sont pas 22 tests réussis.

<a id="g67"></a>
## 67. Sources et vocabulaire

La source d'exigences est la copie originale de l'[Extension 02 v1.0](../guides/Combat_Games_Extension_02_Slots_Verrouilles_Deblocages_Abonnes_v1.0.txt), avec provenance et empreinte dans le [manifeste des guides](../guides/source-manifest.json). Les références Patreon incluses par son auteur restent dans cette copie ; elles ne sont pas présentées comme une nouvelle vérification ni comme une intégration disponible dans le projet.

Les références Mass Effect restent attachées aux fiches de personnages, costumes et lieux existantes. Les dossiers d'interface, noms de bornes, conditions de collection, modèles de soutien et réglages de cette annexe sont des créations de conception. **Découverte** décrit ce qui est montrable ; **acquisition** décrit une source de droit ; **disponibilité** décrit ce qui est chargeable ; **compatibilité** décrit ce qui est autorisé pour la partie. **Intégré dans la bible** signifie documenté et relié, pas implémenté dans le moteur.

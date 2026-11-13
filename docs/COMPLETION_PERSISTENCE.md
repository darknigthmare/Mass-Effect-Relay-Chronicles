# Sauvegardes, inventaire et atelier — lot Completion

Le format de reprise reste `relay-chronicles`, version 1. Les anciennes données **absentes** migrent par les normalisateurs existants ; une donnée présente invalide est refusée. La prévalidation de l'objet précède désormais `JSON.stringify` : les getters et `toJSON` fournis dans les données ordinaires ne s'exécutent pas, et une propriété `undefined` ne disparaît plus avant le contrôle. Les symboles, propriétés cachées, cycles et prototypes exotiques sont refusés, y compris les prototypes modifiés des tableaux. Classe et zone exigent des chaînes, sans conversion implicite d'un tableau en identifiant. Les options manuelles acceptent uniquement leurs champs connus, énumérables et sans accesseur.

Cette garantie concerne le JSON et les objets de données ordinaires inspectés. Un `Proxy` JavaScript hostile peut exécuter ses traps pendant `getPrototypeOf` ou l'inspection des descripteurs ; ces API ne constituent pas une sandbox pour du code arbitraire ayant déjà accès au processus. Les sauvegardes choisies comme fichiers sont parsées comme JSON, sans instancier de tels objets exécutables.

`inspectSave` et `readAutomaticSave` distinguent une sauvegarde absente, corrompue, d'une version non prise en charge ou un stockage indisponible. Le titre affiche le diagnostic et conserve l'accès à une nouvelle campagne. Un import refusé conserve la partie et les octets déjà enregistrés. Les six emplacements manuels restent séparés de la clé automatique, avec remplacement explicite. `localStorage.setItem` constitue l'écriture atomique de l'API web ; aucune garantie de synchronisation cloud ou de survie à une panne matérielle n'est ajoutée.

`collectSupply(state, id)` est l'unique transaction des caches et du réapprovisionnement de l'infirmerie : il contrôle l'état et le lieu avant d'enregistrer le conteneur utilisé et sa récompense. Un cache déjà vide, une destination verrouillée ou un dépassement du plafond de crédits n'effectue aucune mutation. La récompense demeure celle du prototype : 100 crédits et une dose pour un cache, deux doses pour l'infirmerie, avec plafond de neuf doses.

Les calibrations permanentes refusent les soldes non entiers, infinis, négatifs ou hors limites avant toute mutation. Une vente est refusée si l'armurerie possède déjà 40 exemplaires de la référence ; les objets du joueur restent alors intacts. La dernière place libre accepte une vente et incrémente le stock exactement une fois. La remise de Michel reste réservée aux recharges de médi-gel ; aucun équipement ou calibration n'en bénéficie. Les achats et ventes d'objets, restrictions d'espèce, stock partagé, restitution des modules et récupération des pièces d'un équipier disparu conservent leurs autres règles existantes.

L'atelier valide également ses options sans exécuter d'accesseur. Le brouillon reste détaché ; annulation et réinitialisation ne changent pas la campagne. L'application contrôle les neuf emplacements contre l'inventaire courant et conserve le dossier, les quêtes, crédits, XP et décisions. Les bonus sont recalculés depuis les bases, sans cumul au rechargement.

## Bilan de fin

L'écran final et la pause d'une campagne terminée proposent **Exporter le bilan de fin ME1**. Ce fichier est distinct de la sauvegarde de reprise :

```json
{
  "format": "relay-chronicles.campaign-export",
  "version": 1,
  "sourceMediaId": "ME1",
  "sourcePeriodId": "me1",
  "continuationImplemented": false,
  "save": { "format": "relay-chronicles", "version": 1, "savedAt": "…", "state": {} }
}
```

Le champ `save.state` contient le snapshot ME1 complet validé, avec identité, quatre décisions de chapitre, roster et pertes, décisions des conversations, opérations, missions, inventaire et talents. L'exemple abrège cet état ; le fichier réel ne le vide pas. La création exige une fin légitime selon les validateurs de progression. `decodeCampaignExport` refuse une autre version, période, œuvre, une fin incohérente ou des accesseurs et reconstruit un objet détaché. Le chargeur de reprise n'accepte pas ce format de bilan. Une continuation ME2 n'est pas implémentée ni supposée compatible.

## Vérification

`tests/completion-persistence.test.js` contient vingt contrôles supplémentaires. Ils préparent les fins par les fonctions natives de progression ; ils ne représentent pas une campagne gagnée dans l'interface. Les seize combinaisons des décisions finales, les trois canaux de persistance, les six emplacements, la récupération après décès narratif, la remise de Michel et les refus atomiques, dont le stock plein, sont contrôlés. La frontière valide aussi classes/zones, getters propres ou hérités, cycles, versions, symboles et propriétés cachées.

Les preuves courantes sont :

- [Natif global 06](qa/completion-integration-final-06-report.json) : **1 060 tests réussis**, sans échec ni test ignoré, sur les sources gelées. Le [contrôle ciblé 03](qa/completion-persistence-native-final-03-report.json) passe **110 tests** et les huit contre-épreuves avant/après. La [revue indépendante de frontière](qa/completion-persistence-boundary-review.json) conserve son périmètre et la limite des Proxy.
- [DEV06](qa/completion-persistence-dev-final-06-report.json) : **16 contrôles**, **27 changements réels de tracés ou couleurs** et [15 captures ouvertes individuellement et revues](qa/completion-persistence-dev-final-06-visual-review.json). Le registre généré est conservé comme contexte séparé, avec ses octets et son SHA vérifiés pendant le parcours.
- [Production 01](qa/completion-persistence-production-final-01-report.json), sur `http://127.0.0.1:4194/` : **16 contrôles**, **27 changements de dessin** et [15 captures réellement ouvertes et revues](qa/completion-persistence-production-final-01-visual-review.json). Le collecteur est identique à DEV06. Les neuf réponses JavaScript/CSS observées correspondent aux fichiers du `dist/` haché ; aucun accès `/src/` ni harness QA n'est exposé. Sources et registre restent immuables pendant ce parcours. Les trois requêtes implicites `favicon.ico` en 404 sont conservées comme avertissements exacts, sans qualifier d'autres erreurs.

Le parcours de production vérifie notamment le refus du JSON à classe malformée, la vente au stock plein sans mutation, les six emplacements manuels indépendants, les reprises automatique/manuelle, l'annulation et la réinitialisation du brouillon, les neuf ports, les comparaisons technologiques/biotiques à deux décimales, le cache non récupérable deux fois et le bilan ME1 versionné. Une nouvelle campagne après une fin importée retrouve son état initial et conserve les emplacements manuels. Les fixtures préparent explicitement progression, ressources ou positions ; ces résultats ne représentent pas une campagne complète gagnée publiquement.

La [revue Excel du groupe persistance](qa/completion-tracking-workbook-review-persistence.json) ouvre les **17 vues attribuées** du candidat et vérifie les SHA du classeur, du rendu et des PNG. Les statuts fonctionnels restent distincts des statuts d'assets historiques. La réserve non bloquante de césures des libellés manuels sur téléphone reste indiquée dans les revues ; les contrôles restent identifiables et accessibles. Le PASS de cette famille ne remplace pas les autres gates de production du lot ni un lancement Windows ou une mesure matérielle.

Le collecteur natif produit un rapport et le TAP, avec empreintes des sources et contre-épreuve de huit cas avant/après sur le commit de base exact. Choisir un préfixe inédit pour chaque tentative :

```bash
COMPLETION_BASE_MAIN=0d76912517a91c5d2ad00f1ef5718188b40abd8e \
COMPLETION_PERSISTENCE_PREFIX=completion-persistence-native-review-01 \
node scripts/completion-persistence-proof.mjs
```

Le collecteur public utilise les contrôles DOM, imports et téléchargements réels, sans harness, setter de campagne ou injection de style. Il exige un serveur déjà lancé et un préfixe inédit par tentative :

```bash
GAME_URL=http://127.0.0.1:4193/ \
COMPLETION_PERSISTENCE_MODE=development \
COMPLETION_PERSISTENCE_PREFIX=completion-persistence-dev-review-01 \
node scripts/completion-persistence-browser.mjs
```

Le mode `production` compare aussi les scripts et styles servis aux octets du `dist/` local et refuse tout accès `/src/`. Chaque capture doit être ouverte et revue séparément. Aucun contrôle technique de ce lot ne certifie les silhouettes, variantes artistiques ou fidélité originale 1:1. Les références méthodologiques épinglées `save-systems`, `rpg` et `game-ui-ux` complètent les règles du projet ; aucune dépendance de moteur n'est ajoutée.

## Essais antérieurs conservés

[DEV01](qa/completion-persistence-dev-final-01-report.json) reste un échec de navigation du collecteur après réinitialisation du brouillon ; sa [revue de tentative](qa/completion-persistence-dev-final-01-attempt-review.json) distingue cet échec du comportement correct du produit. [DEV02](qa/completion-persistence-dev-final-02-report.json) conserve son échec de gate console avec quatre messages 404 dont les URL n'étaient pas enregistrées ; il n'est pas requalifié rétroactivement.

[DEV03](qa/completion-persistence-dev-final-03-qualification.json), [DEV04](qa/completion-persistence-dev-final-04-qualification.json) et [DEV05](qa/completion-persistence-dev-final-05-qualification.json) conservent leurs résultats et captures avant, respectivement, les dernières corrections clavier, de stock marchand et de validation de frontière. Ils ne servent pas de preuve de la version finale. Leurs rapports et collecteurs exacts restent archivés ; seuls DEV06 et Production01 portent les parcours courants ci-dessus. Les anciens résultats natifs gardent également leurs compteurs et sources propres ; le ciblé courant est le rapport03 à110 tests.

Les réserves génériques des notes issues de `main` au commit `0d76912` restent historiques lorsqu'elles précèdent une mise à jour Completion dans le suivi. L'évaluation fonctionnelle courante s'appuie sur les preuves nommées ici ; elle ne transforme pas un asset Prototype en asset artistique certifié et ne suppose aucune suite ME2.

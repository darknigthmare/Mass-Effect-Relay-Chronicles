# Déploiement web sur Vercel

Le dépôt fournit [vercel.json](../vercel.json) pour compiler le jeu avec Vite et publier le dossier `dist`. Utiliser Node.js 24, comme dans la CI. L’installation emploie le lockfile, inclut les outils de compilation même avec `NODE_ENV=production` et désactive le téléchargement du binaire Electron pour cette cible web. Le jeu fonctionne dans le navigateur ; les sauvegardes sont conservées dans le stockage local de chaque origine web.

L’installation et la compilation ont été vérifiées dans un dossier isolé avec `NODE_ENV=production`. Les fichiers web obtenus ont les mêmes empreintes que ceux du dépôt. La version compilée démarre une partie, affiche le journal et recharge sa sauvegarde sans les outils QA de développement. Voir [le rapport de vérification](qa/assignments-and-deployment-report.json). Ces contrôles locaux restent distincts d’un déploiement sur Vercel.

## Relier le dépôt existant

Dans [Vercel — nouveau projet](https://vercel.com/new), importer `darknigthmare/Mass-Effect-Relay-Chronicles` depuis GitHub dans l’espace Vercel souhaité. Autoriser l’application GitHub de Vercel à accéder à ce dépôt si nécessaire. Sélectionner la racine du dépôt, le framework Vite, Node.js 24 et `main` comme branche de production. Les commandes d’installation et de compilation ainsi que le dossier de sortie proviennent de `vercel.json`. Les pushes suivants sur `main` seront déployés par cette intégration Git.

Pour relier aussi un checkout avec une session Vercel authentifiée :

```bash
npx vercel@65.2.0 link --yes --project mass-effect-relay-chronicles
npx vercel@65.2.0 git connect https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles.git --yes
```

Si le compte possède plusieurs espaces, choisir celui du projet avec `--scope`. La CLI crée `.vercel/project.json` localement ; ce dossier est ignoré par Git. Utiliser le véritable identifiant retourné par Vercel, sans inventer de projet ni d’URL.

## Accès depuis cet environnement cloud

Au contrôle du **23 octobre 2026 à 23 h 01, heure de Paris**, l’API Vercel était atteignable : `GET https://api.vercel.com/v2/user` répondait HTTP **403** avec le message `The request is missing an authentication token`. Ce résultat remplace le diagnostic historique de refus HTTP CONNECT par le proxy ; il indique ici une authentification manquante.

La CLI Vercel 65.2.0 indiquait toujours **`Logged out`**. Le runtime et la configuration cloud consultée ne déclaraient **aucun secret**, et `VERCEL_TOKEN` était absent du processus. Aucune exigence de secret n’est actuellement sauvegardée dans cette configuration. Le fichier local `.vercel/project.json` est absent ; aucun projet distant, lien Git ou déploiement Vercel n’a été créé par ces vérifications. L’existence éventuelle d’un projet dans votre compte reste à vérifier après authentification.

Les paramètres réseau incluent déjà `api.vercel.com` et `vercel.com`. Il reste à configurer l’accès au compte :

1. Ajouter **`VERCEL_TOKEN`** dans les paramètres sécurisés de l’environnement, avec la destination HTTPS **`api.vercel.com`**. Utiliser un jeton du compte ou de l’espace Vercel souhaité, puis enregistrer et activer la configuration dans l’environnement. Ne pas envoyer sa valeur dans le chat, la placer dans le dépôt ou l’exposer sous un nom `VITE_*`.
2. Vérifier que l’application GitHub de Vercel est autorisée à accéder à `darknigthmare/Mass-Effect-Relay-Chronicles`. L’accès GitHub fourni au cloud fonctionne pour lire le dépôt ; il ne prouve pas cette autorisation de Vercel.
3. Après activation du secret, vérifier l’identité et les projets avec la CLI avant de créer le lien Git persistant :

```bash
export XDG_DATA_HOME=/workspace/.cache/relay-vercel/data
export XDG_CACHE_HOME=/workspace/.cache/relay-vercel/cache
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 whoami --token "$VERCEL_TOKEN"
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 project ls --token "$VERCEL_TOKEN"
```

Choisir le projet réellement présent dans le bon espace Vercel. Si aucun projet n’existe, l’importer depuis GitHub avec la procédure ci-dessus. Remplacer ensuite `NOM_OU_ID_VERIFIE` par le nom ou l’identifiant confirmé ; ajouter `--scope` si nécessaire :

```bash
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 link --yes --project NOM_OU_ID_VERIFIE --token "$VERCEL_TOKEN"
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 git connect https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles.git --yes --project NOM_OU_ID_VERIFIE --token "$VERCEL_TOKEN"
```

La liaison Git persistante est prise en charge par cette CLI. Elle n’a pas été exécutée pendant le diagnostic. Une fois le lien confirmé, vérifier la branche de production `main` et le déploiement dans Vercel, puis tester l’URL effective. Les sauvegardes restent propres à chaque origine web ; l’export/import JSON permet de transférer une partie entre prévisualisation et production.

Preuve du contrôle actuel, basée sur le commit `27daea0` : [vercel-access-report.json](qa/vercel-access-report.json). Ce rapport distingue l’accès API actuel du rapport historique de déploiement local.

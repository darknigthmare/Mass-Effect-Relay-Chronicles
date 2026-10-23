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

Au contrôle du 23 octobre 2026, la CLI Vercel 65.2.0 indiquait `Logged out` et l’appel à `api.vercel.com` recevait un refus HTTP CONNECT 403 du proxy. Aucun projet Vercel distant n’a été créé ou lié pendant ce contrôle.

Un brouillon cloud conserve les accès existants et ajoute `api.vercel.com`, `vercel.com` ainsi qu’une exigence de secret personnel `VERCEL_TOKEN`, limité à `api.vercel.com`. Renseigner sa valeur dans les paramètres sécurisés de l’environnement, revoir et enregistrer le brouillon, puis publier l’environnement. Cette valeur reste côté outils de déploiement ; elle ne doit jamais devenir une variable `VITE_*` ni être ajoutée au dépôt ou au chat.

Après activation, vérifier l’identité avant la liaison :

```bash
export XDG_DATA_HOME=/workspace/.cache/relay-vercel/data
export XDG_CACHE_HOME=/workspace/.cache/relay-vercel/cache
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 whoami --token "$VERCEL_TOKEN"
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 link --yes --project mass-effect-relay-chronicles --token "$VERCEL_TOKEN"
npx --cache /workspace/.cache/relay-vercel/npm vercel@65.2.0 git connect https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles.git --yes --token "$VERCEL_TOKEN"
```

Les chemins de cache ci-dessus sont accessibles en écriture dans cet environnement cloud. L’enregistrement du brouillon ne connecte pas le compte et ne déploie pas le site. Une fois la liaison confirmée, vérifier le déploiement dans Vercel puis tester son URL effective. Une sauvegarde créée sur un domaine de prévisualisation reste distincte de celle du domaine de production ; l’export/import JSON permet de transférer une partie.

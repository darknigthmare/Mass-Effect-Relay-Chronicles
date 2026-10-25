# Déploiement web sur Vercel

L’intégration Git Vercel est déjà active sur ce dépôt. Le **25 octobre 2026**, la poussée de correction de la [PR nº 1](https://github.com/darknigthmare/Mass-Effect-Relay-Chronicles/pull/1) a déclenché un nouveau statut de déploiement dans le projet [mass_effect_relay_chronicles](https://vercel.com/darknigthmares-projects/mass_effect_relay_chronicles). Le [relevé GitHub](qa/vercel-github-integration-report.json) conserve le commit, le lien et l’état observés. Un statut en attente ne signifie pas que le déploiement est terminé ; consulter les contrôles de la PR pour son état courant.

Le dépôt fournit [vercel.json](../vercel.json) pour compiler le jeu avec Vite et publier `dist`. Utiliser Node.js 24, comme dans la CI. L’installation emploie le lockfile, inclut les outils de compilation même avec `NODE_ENV=production` et désactive le téléchargement d’Electron pour cette cible web.

Les tests de production locaux utilisent les véritables bundles compilés servis en HTTP avec Chromium Linux. Ils vérifient les ressources, leurs empreintes et les sauvegardes, sans accès au harnais de développement. Ils ne constituent pas un test de la version distante Vercel ou d’un exécutable Windows. La navigation `file://` reste bloquée par le navigateur géré.

## Accès du checkout cloud

L’existence de l’intégration Git ne nécessite pas une session CLI locale pour déclencher ses déploiements par push. Le runtime cloud ne déclare actuellement aucun secret ou identité Vercel ; aucun nouveau projet, lien local ou réglage distant n’a été créé pour corriger la PR. Les paramètres de branche de production et l’URL publique effective n’ont pas été vérifiés via l’API Vercel.

Le [diagnostic du 23 octobre](qa/vercel-access-report.json) reste historique : l’API répondait sans jeton, la CLI était déconnectée et aucun projet n’avait été créé par ce diagnostic. Il ne décrit pas l’intégration Git constatée ensuite.

Pour administrer le projet depuis ce checkout si nécessaire, configurer l’accès au compte dans les paramètres sécurisés de l’environnement, puis sélectionner le projet existant. Ne pas envoyer de jeton dans le chat ou le dépôt. Vérifier d’abord l’identité et les projets du bon espace ; ne pas recréer un projet déjà relié.

Les sauvegardes restent propres à chaque origine web : une prévisualisation et le site de production ne partagent pas automatiquement leur stockage local. L’export/import JSON permet de transférer une partie.

# Suivi de réalisation et de fidélité

Le périmètre retenu conserve les sprites et les combats ATB de Relay Chronicles. La fidélité du contenu demande des références distinctes pour les lieux, les personnages, les missions et les conséquences. Les statistiques et le rythme ATB restent des choix d’adaptation.

Le classeur principal suit 1 203 fiches, dont 1 146 ME1 et 57 extensions ME2/ME3. Les 27 autres classeurs suivent 5 326 fiches supplémentaires. Ces quantités décrivent un plan de production, pas des éléments tous jouables.

## Dossier de Shepard

Le jeu propose les deux apparences, les origines Stellaire/Colon/Terrien et les profils Rescapé/Héros de guerre/Impitoyable. Les choix sont conservés dans les sauvegardes, les exports et les imports. Le dossier reste consultable depuis la pause et le commando. Les anciennes sauvegardes v1 reçoivent les valeurs par défaut uniquement lorsque les nouveaux champs sont absents ; les valeurs explicitement invalides sont rejetées.

La même identité et la même variante d’atlas sont utilisées en exploration et en combat. La variante féminine garde une pose statique afin de ne pas lui appliquer la marche masculine. Les animations féminines, les réactions narratives aux antécédents, les bonus de moralité de l’original et le créateur facial ne sont pas implémentés par ce dossier. Aucun bonus de combat n’est ajouté.

Les tests se trouvent dans `tests/commander.test.js`, `tests/commander-world.test.js` et `scripts/commander-browser.mjs`. La commande `npm run test:commander` exerce la création réelle, le dossier, l’export/import, la migration v1, la reprise, le clavier, le changement de zone et le sprite de combat. Son rapport est écrit dans `test-results/commander-report.json`.

## Sauvegardes manuelles

Six emplacements indépendants conservent le nom choisi, la date et la zone avec le nom, la classe et l’apparence du commandant. Leurs aperçus sont dérivés de la progression validée qui sera effectivement chargée. Un emplacement occupé ou corrompu exige une confirmation explicite avant remplacement. La suppression demande aussi confirmation ; la sauvegarde automatique et les autres emplacements sont préservés.

Les erreurs de capacité et d’accès au stockage sont présentées sans annoncer de réussite. Les emplacements illisibles restent visibles et ne sont pas effacés automatiquement. L’enregistrement et le chargement sont désactivés pendant un combat. Le choix de six emplacements relève de l’interface de cette adaptation.

`tests/save-slots.test.js` contrôle les opérations et leurs échecs ; `npm run test:saves` exerce l’interface, les aperçus, les confirmations, le chargement de l’apparence féminine et l’indépendance de la sauvegarde automatique. Son rapport est écrit dans `test-results/save-slots-report.json`.

## État du contenu restant

Les 100 sous-zones, 91 liaisons et 62 missions secondaires/DLC du catalogue ne constituent pas encore des parcours jouables. Les dialogues complets, les cinématiques, les romances, le Mako pilotable, les modèles d’équipement, les animations et les campagnes ultérieures restent à réaliser. La présence d’un nom, d’un atlas ou d’un chemin prévu ne suffit pas à terminer une fiche.

Pour reproduire une scène précisément, il faut identifier l’édition, les étapes et conditions, les références de carte ou de costume et les embranchements attendus. Le dépôt conserve des liens de manuels et de guides, mais pas un relevé primaire complet de ces éléments. Les captures de `docs/screenshots/` représentent le prototype.

Les tentatives de consultation du manuel EA et de la page officielle comparant les éditions ont reçu un refus HTTP CONNECT 403 du proxy de cet environnement. Les domaines concernés sont `eaassets-a.akamaihd.net` et `www.ea.com`. Cette restriction empêche leur consultation ici ; elle ne prouve pas que les documents n’existent plus. La comparaison original/Legendary Edition reste à établir pour les détails qui diffèrent.

## Auditer les fiches

```bash
npm run audit:fidelity
npm run audit:fidelity -- --include-universe
```

L’audit écrit `test-results/fidelity-report.json`. Il sépare les statuts déclarés, les fichiers réellement présents, les répertoires seulement prévus, les dépendances et les références canoniques. Chaque fiche non validée conserve son critère d’acceptation. L’existence d’une URL ne valide pas son contenu ; un test fonctionnel ne certifie pas la fidélité visuelle. Les statuts ne sont jamais promus automatiquement.

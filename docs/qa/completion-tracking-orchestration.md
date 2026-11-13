# Orchestration finale locale

Les chemins ci-dessous correspondent au gel natif06. Les quatre dernières révisions DEV attendues sont controls08, persistence06, combat02 et world02. Aucun parcours supplémentaire ni audit exhaustif n’est demandé. On attend simplement leurs confirmations de revue réelle, puis on exécute les étapes suivantes dans le dépôt. Un numéro de rapport ne remplace pas la vérification de son contenu et de ses empreintes.

La sélection explicite est déjà préparée : **99 IDs principaux**, sept POW supplémentaires exclus, 114 sources de produit. Les propositions restent modifiables jusqu’à l’étape 1. Les critères satisfaits par natifs + DEV + captures réelles autorisent seulement le candidat et les copies locales ; la production reste en attente et bloque commit/push.

1. Figer les propositions exactes après les sept revues courantes.

```bash
node scripts/completion-tracking-plan.mjs \
  --baseline docs/qa/completion-tracking-baseline-02.json \
  --proposal docs/qa/completion-controls-tracking.json \
  --proposal docs/qa/completion-persistence-tracking.json \
  --proposal docs/qa/completion-combat-tracking.json \
  --proposal docs/qa/completion-narrative-tracking.json \
  --proposal docs/qa/completion-chronicles-tracking.json \
  --proposal docs/qa/completion-world-tracking.json \
  --proposal docs/qa/completion-catalogue-tracking.json \
  --select-file scripts/completion-tracking-selection-final-01.json \
  --feature-paths-file scripts/completion-tracking-feature-paths.json \
  --allow-advanced-ids CHC-recrutement-de-garrus,CHC-recrutement-de-wrex,CHC-attitude-de-garrus \
  --archive-dir docs/qa/completion-tracking-proposals-final-01 \
  --output scripts/completion-tracking-scope.json
```

2. Composer les sept preuves DEV et leurs ouvertures réelles, en vérifiant les sources courantes.

```bash
node scripts/completion-tracking-compose-gates.mjs \
  --scope scripts/completion-tracking-scope.json \
  --native-report docs/qa/completion-integration-final-06-report.json \
  --stage development \
  --report controls=docs/qa/completion-controls-dev-final-08-report.json \
  --report persistence=docs/qa/completion-persistence-dev-final-06-report.json \
  --report combat=docs/qa/completion-combat-public-dev-final-02-report.json \
  --report narrative=docs/qa/completion-narrative-dev-final-02-report.json \
  --report chronicles=docs/qa/completion-chronicles-dev-final-05-report.json \
  --report world=docs/qa/completion-world-public-dev-final-02-report.json \
  --report chronicles-support=docs/qa/completion-chronicles-support-dev-final-02-report.json \
  --review docs/qa/completion-controls-dev-final-08-review.json \
  --review docs/qa/completion-persistence-dev-final-06-visual-review.json \
  --review docs/qa/completion-combat-public-dev-final-02-visual-review.json \
  --review docs/qa/completion-narrative-dev-final-02-visual-review.json \
  --review docs/qa/completion-chronicles-dev-final-05-visual-review.json \
  --review docs/qa/completion-world-public-dev-final-02-visual-review.json \
  --review docs/qa/completion-chronicles-support-dev-final-02-visual-review.json \
  --execution-output docs/qa/completion-tracking-development-report.json \
  --visual-output docs/qa/completion-tracking-development-visual-review.json
```

3. Construire uniquement les copies candidates et les vérifier indépendamment.

```bash
node scripts/completion-tracking-candidate.mjs \
  --scope scripts/completion-tracking-scope.json \
  --output-dir /tmp/completion-tracking-candidate \
  --report docs/qa/completion-tracking-workbook-update.json \
  --integration-report docs/qa/completion-integration-final-06-report.json \
  --development-report docs/qa/completion-tracking-development-report.json \
  --visual-review docs/qa/completion-tracking-development-visual-review.json

python scripts/completion-tracking-verify-workbook.py \
  --baseline docs/qa/completion-tracking-baseline-02.json \
  --before /tmp/completion-tracking-baseline-02/docs/Mass_Effect_Relay_Chronicles_Production.xlsx \
  --after /tmp/completion-tracking-candidate/Mass_Effect_Relay_Chronicles_Production.xlsx \
  --catalog-before /tmp/completion-tracking-baseline-02/docs/content-catalog.json \
  --catalog-after /tmp/completion-tracking-candidate/content-catalog.json \
  --changes docs/qa/completion-tracking-workbook-update.json \
  --scope scripts/completion-tracking-scope.json \
  --output docs/qa/completion-tracking-workbook-preservation.json
```

4. Rendre le candidat, exercer sa sonde de recalcul/restauration et répartir les images.

```bash
node scripts/completion-tracking-render-workbook.mjs \
  --input /tmp/completion-tracking-candidate/Mass_Effect_Relay_Chronicles_Production.xlsx \
  --update-report docs/qa/completion-tracking-workbook-update.json \
  --output-dir docs/workbook-previews/completion-tracking \
  --report docs/qa/completion-tracking-workbook-render-report.json

node scripts/completion-tracking-assign-reviews.mjs \
  --scope scripts/completion-tracking-scope.json \
  --render-report docs/qa/completion-tracking-workbook-render-report.json \
  --output docs/qa/completion-tracking-workbook-review-assignments.json
```

Les sept groupes sont attribués aux cinq owners de produit, à root (monde) et au suivi (compteurs et QA documentaire). Chaque PNG est attribué une fois, y compris les blocs dont les IDs concernent plusieurs familles. L’attribution n’atteste aucune ouverture. Chaque réviseur ouvre réellement ses images et écrit sa propre revue liée au SHA du classeur et du rapport de rendu ; pas de simple validation d’un nombre de panneaux.

5. Composer les sept revues réelles, puis seulement copier les deux fichiers locaux.

```bash
node scripts/completion-tracking-compose-workbook-review.mjs \
  --render-report docs/qa/completion-tracking-workbook-render-report.json \
  --review docs/qa/completion-tracking-workbook-review-controls.json \
  --review docs/qa/completion-tracking-workbook-review-persistence.json \
  --review docs/qa/completion-tracking-workbook-review-combat.json \
  --review docs/qa/completion-tracking-workbook-review-narrative.json \
  --review docs/qa/completion-tracking-workbook-review-chronicles.json \
  --review docs/qa/completion-tracking-workbook-review-world.json \
  --review docs/qa/completion-tracking-workbook-review-tracking.json \
  --output docs/qa/completion-tracking-workbook-visual-review.json

node scripts/completion-tracking-publish.mjs \
  --update-report docs/qa/completion-tracking-workbook-update.json \
  --native-report docs/qa/completion-tracking-workbook-preservation.json \
  --render-report docs/qa/completion-tracking-workbook-render-report.json \
  --visual-review docs/qa/completion-tracking-workbook-visual-review.json \
  --scope scripts/completion-tracking-scope.json \
  --output docs/qa/completion-tracking-workbook-report.json \
  --publish
```

La dernière commande revérifie les copies publiques locales et restaure les deux originaux si cette vérification échoue. Son rapport reste `productionPending:true` et `commitPushAllowed:false`. La distinction entre tous les avancements et les véritables critères fermés est calculée depuis les transitions réellement présentes dans les copies vérifiées.

Ensuite root reconstruit le registre, valide, compile et sert la production. Les sept familles exécutent et ouvrent leurs véritables preuves PROD. La même composition générique avec `--stage production` produit `completion-tracking-production-report.json` et `completion-tracking-production-visual-review.json`. Le seul inventaire courant final est généré après la copie locale ; le contrôle JSON/registre est exécuté après la reconstruction. Aucun nouvel autocontrôle structurel déjà réussi n’est nécessaire.

// Compose executed gates and actual image reviews; never invent a new run.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, PRIORITY_FEATURE_SOURCES, readFeatureSources, sha } from './priority-workbook-data.mjs';
import { UNIVERSE_SUMMARY, UNIVERSE_RECORDS } from '../src/universe-data.js';
import { CAMPAIGN_TALENTS } from '../src/campaign-talents.js';
import { MISSION_DEFINITIONS } from '../src/mission-progress.js';
const root = new URL('../', import.meta.url), read = filename => readFile(new URL(filename, root));
const paths = {
  native: 'docs/qa/priority-integration-final-04-report.json', development: 'docs/qa/priority-development-report.json',
  developmentReview: 'docs/qa/priority-visual-review.json', workbook: 'docs/qa/priority-workbook-visual-report.json',
  validation: process.env.PRIORITY_VALIDATION_REPORT || 'docs/qa/priority-validation-final-01-report.json',
  build: 'docs/qa/priority-build-report.json', preservation: 'docs/qa/priority-preservation-report.json',
  http: 'docs/qa/priority-production-http-report.json',
  currentAudit: 'docs/qa/priority-current-audit.json',
};
const families = {
  controls: process.env.PRIORITY_CONTROLS_PROOF_PREFIX || 'priority-controls-production-final-01',
  objectives: process.env.PRIORITY_OBJECTIVES_PROOF_PREFIX || 'priority-objectives-production-final-01',
  talents: process.env.PRIORITY_TALENTS_PROOF_PREFIX || 'priority-talents-production-final-01',
  tactical: process.env.PRIORITY_TACTICAL_PROOF_PREFIX || 'priority-tactical-public-production-final-01',
  focus: process.env.PRIORITY_FOCUS_PROOF_PREFIX || 'priority-focus-production-final-01',
};
for (const [kind, prefix] of Object.entries(families)) {
  assert.match(prefix, /^priority-[a-z0-9-]+$/);
  paths[`production-${kind}`] = `docs/qa/${prefix}-report.json`;
  paths[`review-${kind}`] = `docs/qa/${prefix}-visual-review.json`;
}
const reports = {}, proofs = {};
for (const [key, path] of Object.entries(paths)) {
  const bytes = await read(path), report = JSON.parse(bytes); assert.equal(report.passed, true, path);
  for (const [filename, expected] of Object.entries(report.sourceHashes || report.featureSourceHashes || {})) assert.equal(sha(await read(filename)), expected, `Stale ${path}: ${filename}`);
  reports[key] = report; proofs[key] = { path, sha256: sha(bytes) };
}
let productionChecks = 0, productionImages = 0, productionExports = 0;
for (const kind of Object.keys(families)) {
  const run = reports[`production-${kind}`], review = reports[`review-${kind}`];
  assert.equal(run.mode, 'production'); assert.equal(run.sourceFrozen, true); assert.equal(run.distFrozen, true);
  assert.deepEqual(run.sourceRequests, []); assert.deepEqual(run.distFiles, reports.build.distFiles);
  for (const field of ['errors', 'failedRequests', 'consoleErrors', 'evidenceErrors']) if (Array.isArray(run[field])) assert.deepEqual(run[field], [], `${kind}.${field}`);
  assert.ok(run.checks.length > 0); assert.ok(run.checks.every(check => check.passed === true));
  assert.deepEqual(review.blockingFindings ?? review.findings, []);
  const opened = review.images || review.captures; assert.ok(Array.isArray(opened));
  for (const capture of run.captures) {
    assert.equal(sha(await read(capture.path)), capture.sha256);
    assert.ok(opened.some(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true), capture.path);
  }
  for (const artifact of [...(run.exports || []), ...(run.fixtures || [])]) assert.equal(sha(await read(artifact.path)), artifact.sha256, artifact.path);
  productionChecks += run.checks.length; productionImages += run.captures.length; productionExports += run.exports.length;
}
assert.equal(reports.http.buildReport.sha256, proofs.build.sha256);
assert.equal(reports.http.checks.length, Object.keys(reports.build.distFiles).length);
for (const item of reports.http.checks) {
  assert.equal(item.status, 200); assert.equal(item.sha256, reports.build.distFiles[item.path].sha256);
  assert.equal(sha(await read(`dist/${item.path}`)), item.sha256);
}
const catalogue = JSON.parse(await read('docs/content-catalog.json'));
const counts = records => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, records.filter(record => record.status === status).length]));
assert.equal(catalogue.entries.length, 1385); assert.deepEqual(counts(catalogue.entries), { Défini: 962, Prototype: 417, Intégré: 3, Validé: 3 });
assert.equal(UNIVERSE_SUMMARY.recordCount, 6711); assert.equal(UNIVERSE_SUMMARY.sourceCount, 454);
assert.deepEqual(counts(UNIVERSE_RECORDS), { Défini: 5997, Prototype: 708, Intégré: 3, Validé: 3 });
assert.equal(reports.native.unit.pass, 978); assert.equal(reports.native.unit.fail, 0);
assert.equal(reports.workbook.changedIds.length, 51); assert.equal(reports.workbook.statusPromotions, 18);
assert.equal(reports.workbook.assetStatusPromotions, 0); assert.equal(reports.workbook.integratedOrValidatedPromotions, 0);
assert.equal(reports.currentAudit.openP0P1, 6588); assert.equal(reports.currentAudit.openP0, 784); assert.equal(reports.currentAudit.openP1, 5804);
assert.equal(sha(await read(reports.currentAudit.ledger.path)), reports.currentAudit.ledger.sha256);
assert.equal(JSON.parse(await read(reports.currentAudit.ledger.path)).records.length, reports.currentAudit.ledger.entries);
const sourceHashes = await readFeatureSources(fileURLToPath(root), [...PRIORITY_FEATURE_SOURCES,
  'README.md', 'docs/ASSETS.md', 'docs/CATALOGUE.md', 'docs/DESIGN.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/PRIORITIES.md', 'docs/PRIORITY_GAMEPLAY.md', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx',
  'docs/research/boss-phases.md', 'docs/research/campaign-talents.md', 'docs/research/gamepad-controls.md',
  'docs/research/mission-progress.md', 'docs/research/tactical-systems.md',
  'public/assets/manifest.json', 'src/universe-data.js', 'scripts/priority-finalize.mjs']);
const report = { passed: true, at: new Date().toISOString(), baselineCommit: BASE_COMMIT, sourceHashes, proofs,
  delivery: {
    missions: Object.values(MISSION_DEFINITIONS).map(record => ({ id: record.id, catalogId: record.catalogId, steps: record.steps.length, duration: record.duration, channelSeconds: record.channelSeconds })),
    talents: CAMPAIGN_TALENTS.length, newME1Actions: ['me1Damping', 'me1Immunity', 'me1Adrenaline'], sharedArmourTrainingBudget: true,
    tacticalScope: 'ME1 campaign opt-in: real local positions, geometry-checked movement, range, pure coordinated drafts, atomic initial preflight and voluntary Wait-mode reservations; no bonus damage.',
    bossScope: 'Benezia three escort waves then vulnerability; Thorian six passive nodes and three reinforcements. Initial total HP/shield budgets split, one final victory; Saren unchanged.',
    inputScope: 'Standard virtual Gamepad API exercised through actual UI; physical devices, remapping and native file pickers remain outside verification.',
    clockScope: 'Native ATB, cooling and movement equivalence at controlled 10/20/60/144 call rates; trusted browser blur/focus exercised by switching tabs after disabling Playwright focus emulation.',
    mainCatalogue: { records: 1385, changed: 51, prototypePromotions: 18, statuses: counts(catalogue.entries), existingCriteriaPrioritiesAndAssetsPreserved: true },
    universe: { records: 6711, sources: 454, statuses: counts(UNIVERSE_RECORDS) },
    remainingOpenCriteria: { P0: reports.currentAudit.openP0, P1: reports.currentAudit.openP1, total: reports.currentAudit.openP0P1, ledger: reports.currentAudit.ledger },
  },
  verification: {
    nativeTests: reports.native.unit.pass, pairedTacticalCases: 468, nativeTacticalBattles: 1404, phaseOnlyPairs: 108,
    developmentImagesOpened: reports.developmentReview.images.length,
    workbookPanelsOpened: reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionChecks, productionImagesOpened: productionImages, productionExports,
    png: reports.build.pngCount, publicFilesVerified: reports.build.publicFilesVerified, httpFilesVerified: reports.http.checks.length,
    oldPNGsPreserved: reports.preservation.preservedPNGCount, otherWorkbooksPreserved: reports.preservation.preservedOtherWorkbookCount,
    otherCataloguesPreserved: reports.preservation.preservedUniverseCatalogueCount,
  },
  limitations: [
    'This advances a bounded set of P0/P1 criteria; the exhaustive open ledger is not completed and no new record is declared Validé.',
    'Ranks, ranges, timings, waves, node staging and numeric effects remain ATB adaptations; original maps, campaigns, trees, animations and artistic 1:1 fidelity remain incomplete.',
    'There are no new game-asset PNG, costumes or original animation cycles. The phase renderer reuses existing bodies/poses.',
    'Objective browser position transfers and earlier progression, talent XP, initial battle equipment and virtual controller inputs are explicitly prepared fixtures, not claimed earned/traversed.',
    'The boss development renderer uses declared high-HP/high-attack/initial-ready fixtures to inspect phases; the paired native policies and the separate public journeys are different evidence.',
    'Headless tabs can remain visible; the focus check observes trusted native blur/focus, without claiming every OS visibility transition or physical-device performance.',
    'The historical native gates and earlier failed or interrupted browser attempts remain separate; the listed proofs identify current sources and individually opened images.',
    'Local browser/build checks do not launch Microsoft Excel or verify native Windows gameplay; CI packaging has its own execution.',
  ],
};
await writeFile(new URL('docs/qa/priority-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, main: report.delivery.mainCatalogue, verification: report.verification }));

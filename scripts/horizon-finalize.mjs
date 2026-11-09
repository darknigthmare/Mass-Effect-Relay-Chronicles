// Verify the linked evidence. This composes existing observations, never claims
// a new browser run, image opening or original-game fidelity certification.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readAssets } from './horizon-assets.mjs';
import { BASE_COMMIT, sha } from './horizon-workbook-data.mjs';
import { HORIZON_NPCS } from '../src/horizon-characters.js';
import { HORIZON_ENEMY_IDS } from '../src/horizon-enemies.js';
import { HORIZON_FAUNA } from '../src/horizon-fauna.js';
import { HORIZON_LAYOUTS } from '../src/horizon-layout-data.js';
import { UNIVERSE_SUMMARY, UNIVERSE_RECORDS } from '../src/universe-data.js';
const root = new URL('../', import.meta.url);
const read = filename => readFile(new URL(filename, root));
const paths = {
  native: 'docs/qa/horizon-integration-final-01-report.json',
  validation: process.env.HORIZON_VALIDATION_REPORT || 'docs/qa/horizon-validation-final-02-report.json',
  build: 'docs/qa/horizon-build-report.json', development: 'docs/qa/horizon-development-report.json',
  developmentReview: 'docs/qa/horizon-visual-review.json', workbook: 'docs/qa/horizon-workbook-visual-report.json',
  preservation: 'docs/qa/horizon-preservation-report.json',
  productionArchive: process.env.HORIZON_ARCHIVE_PRODUCTION_REPORT || 'docs/qa/horizon-archive-production-final-01-report.json',
  productionArchiveReview: process.env.HORIZON_ARCHIVE_PRODUCTION_REVIEW || 'docs/qa/horizon-archive-production-final-01-visual-review.json',
  productionFauna: process.env.HORIZON_FAUNA_PRODUCTION_PROOF || 'docs/qa/horizon-fauna-public-production-final-01-report.json',
  productionFaunaReview: process.env.HORIZON_FAUNA_PRODUCTION_REVIEW || 'docs/qa/horizon-fauna-public-production-final-01-visual-review.json',
  productionHTTP: 'docs/qa/horizon-production-http-final-01-report.json',
};
const reports = {}, proofs = {};
for (const [key, path] of Object.entries(paths)) {
  const bytes = await read(path), report = JSON.parse(bytes); assert.equal(report.passed, true, path);
  for (const [filename, expected] of Object.entries(report.sourceHashes || report.assetSourceHashes || {})) assert.equal(sha(await read(filename)), expected, `Stale ${path}: ${filename}`);
  reports[key] = report; proofs[key] = { path, sha256: sha(bytes) };
}
const independentPath = 'docs/qa/horizon-ui-independent-review.json', independentBytes = await read(independentPath), independent = JSON.parse(independentBytes);
assert.deepEqual(independent.findings, []); assert.equal(independent.verification.failed, 0);
for (const [filename, expected] of Object.entries(independent.sourceHashes)) assert.equal(sha(await read(filename)), expected, filename);
proofs.independentUIReview = { path: independentPath, sha256: sha(independentBytes) };
const spotPath = 'docs/qa/horizon-root-visual-spot-review.json', spotBytes = await read(spotPath), spot = JSON.parse(spotBytes);
assert.equal(spot.passed, true); assert.deepEqual(spot.blockingFindings, []);
for (const image of spot.images) { assert.equal(image.actuallyOpened, true); assert.equal(sha(await read(image.path)), image.sha256); }
proofs.rootVisualSpotReview = { path: spotPath, sha256: sha(spotBytes) };
for (const kind of ['Archive', 'Fauna']) {
  const report = reports[`production${kind}`], review = reports[`production${kind}Review`];
  assert.equal(report.mode, 'production'); assert.deepEqual(review.blockingFindings ?? review.findings, []);
  const openedImages = review.images || review.captures; assert.ok(Array.isArray(openedImages));
  const captures = report.captures || report.captureArtifacts;
  assert.ok(captures.length > 0);
  for (const capture of captures) {
    assert.equal(sha(await read(capture.path)), capture.sha256);
    assert.ok(openedImages.some(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true), `Missing opened production image: ${capture.path}`);
  }
  const raw = report.rawReport ? JSON.parse(await read(report.rawReport.path)) : report;
  if (report.rawReport) {
    assert.equal(sha(await read(report.rawReport.path)), report.rawReport.sha256);
    assert.equal(raw.passed, false); assert.equal(report.consoleWarnings.length, 3);
    assert.equal(sha(await read('scripts/horizon-fauna-public-qualify.mjs')), report.qualifierSHA256);
    proofs.productionFaunaRaw = report.rawReport;
  } else { assert.equal(raw.sourceFrozen, true); assert.equal(raw.distFrozen, true); }
  assert.deepEqual(raw.sourceRequests, []); assert.deepEqual(raw.distFiles, reports.build.distFiles);
  assert.ok(raw.checks.every(check => check.passed === true)); assert.equal(raw.checks.length, 4);
  for (const artifact of [...raw.exports, ...raw.fixtures]) assert.equal(sha(await read(artifact.path)), artifact.sha256, artifact.path);
}
assert.equal(reports.productionHTTP.buildReport.sha256, proofs.build.sha256);
assert.equal(reports.productionHTTP.checks.length, Object.keys(reports.build.distFiles).length);
for (const check of reports.productionHTTP.checks) {
  assert.equal(check.status, 200); assert.equal(check.sha256, reports.build.distFiles[check.path].sha256);
  assert.equal(sha(await read(`dist/${check.path}`)), check.sha256);
}
const catalogue = JSON.parse(await read('docs/content-catalog.json'));
const counts = entries => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, entries.filter(entry => entry.status === status).length]));
assert.equal(catalogue.entries.length, 1385); assert.deepEqual(counts(catalogue.entries), { Défini: 980, Prototype: 399, Intégré: 3, Validé: 3 });
assert.equal(UNIVERSE_SUMMARY.recordCount, 6711); assert.equal(UNIVERSE_SUMMARY.sourceCount, 454);
assert.deepEqual(counts(UNIVERSE_RECORDS), { Défini: 6015, Prototype: 690, Intégré: 3, Validé: 3 });
const unit = reports.validation.commands.find(command => command.name === 'unit');
assert.equal(unit.pass, unit.tests); assert.ok(unit.pass > 854); assert.equal(unit.fail, 0);
const assets = await readAssets(fileURLToPath(root)), sourceHashes = { ...assets.sourceHashes };
for (const filename of ['README.md', 'docs/ASSETS.md', 'docs/CATALOGUE.md', 'docs/DESIGN.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/HORIZON.md', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json', 'src/universe-data.js', 'scripts/horizon-finalize.mjs']) sourceHashes[filename] = sha(await read(filename));
const faunaRaw = reports.productionFauna.rawReport ? JSON.parse(await read(reports.productionFauna.rawReport.path)) : reports.productionFauna;
const retainedAttempts = [];
for (const [path, reason] of [
  ['docs/qa/horizon-validation-final-01-report.json', '914/915: the legacy-camera test still selected Feros, now an authored map. The fixture now selects the still-legacy Citadel; production code was unchanged and final-02 passes 915/915.'],
  ['docs/qa/horizon-enemies-dev-final-01.json', 'Collector compared sprite names with formation profile IDs; stopped before captures. Only the collector changed before the passing final-02 execution.'],
  ['docs/qa/horizon-fauna-public-dev-final-01-report.json', 'Collector lost a recreated HUD button after acceptance; no battle or completed journey claimed. Atomic public locator clicking was fixed before final-02.'],
  ['docs/qa/horizon-fauna-public-dev-final-02-report.json', 'All four functional checks passed; raw assertion remains false for three exact absent-favicon 404 warnings, qualified separately without replay.'],
]) { const bytes = await read(path); retainedAttempts.push({ path, sha256: sha(bytes), reason }); }
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT, sourceHashes, proofs, retainedAttempts,
  delivery: { npcConversations: HORIZON_NPCS.length, npcBodies: 8, topicsAdded: 16, enemyTypes: HORIZON_ENEMY_IDS.length, changedCampaignFormations: 6,
    faunaDrawings: HORIZON_FAUNA.length, fleetDrawings: 8, fixedDrawingsAdded: assets.families.reduce((sum, family) => sum + family.subjects, 0),
    faunaGameplay: 'Davin assignment: organic varren/alpha pack, deferred report reward once; passive Eden creature observation. Other fauna remain documentary.',
    fleetGameplay: 'Four ME1 recognition holograms and knowledge-gated dossiers; four later hull illustrations in eligible documentary records. No new piloting or space combat.',
    optionalOperations: 12, operationSteps: 46, optionalCombatSlots: 5, totalSideQuests: 15,
    expandedMaps: Object.values(HORIZON_LAYOUTS).map(layout => ({ id: layout.id, sectors: layout.rooms.length, paths: layout.paths.length, stableMissionPoints: 7, mainArenas: 3 })),
    mainCatalogue: { records: 1385, statuses: counts(catalogue.entries), existingRecordsChanged: 28, addedSpriteRecords: 3, contentPromotionsToPrototype: 21, assetPromotionsToPrototype: 20 },
    universe: { records: 6711, sources: 454, statuses: counts(UNIVERSE_RECORDS) } },
  verification: { completeNativeTests: unit.pass, targetedNativeTests: reports.native.unit.passed,
    pairedBalanceCases: reports.native.balance.summary.pairs, actualCampaignVictories: reports.native.balance.summary.actualCampaignWins,
    developmentImagesOpened: reports.developmentReview.actuallyOpenedImages,
    workbookPanelsOpened: reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionChecks: reports.productionArchive.checks.length + reports.productionFauna.checks.length,
    productionImagesOpened: reports.productionArchive.captures.length + reports.productionFauna.captures.length,
    productionExports: reports.productionArchive.exports.length + faunaRaw.exports.length,
    naturallyPlayedPublicPlayerOrders: faunaRaw.orders.length,
    png: reports.build.pngCount, publicFilesVerified: reports.build.publicFilesVerified, productionHTTPFilesVerified: reports.productionHTTP.checks.length,
    oldPNGsPreserved: reports.preservation.preservedPNGCount, otherWorkbooksPreserved: reports.preservation.preservedOtherWorkbookCount,
    otherCataloguesPreserved: reports.preservation.preservedUniverseCatalogueCount },
  limitations: ['The remaining production catalogue and complete later-game/media campaigns remain open.',
    'All generated bodies/hulls and authored geography remain Prototype; original likeness, costumes, scales, cycles and full mechanics are not certified 1:1.',
    'The Therum battlemaster preserves the old boss budget and Barrier; original phases and complete boss kits are not added.',
    'Holographic ship projections are adapted recognition props, not physically docked ships. Later illustrations grant no pilotability, acquisition or character recruitment.',
    'No new adopted pet or Thresher Maw combat; the Eden name/anatomy remains partly unverified. The Davin quest closes before the Thorian because individual colonist survival is not tracked.',
    'Public browser fixtures prepare earlier progression and make two declared position-only transfers. The varren battle, report and reload are played; full routes/campaigns are not claimed played.',
    'A failed raw fauna assertion may be separately qualified only for its three exact absent-favicon 404 warnings. Original raw reports remain unchanged and linked.',
    'Software-rendered browser checks and workbook panel reviews do not establish physical-device performance, Microsoft Excel execution or Windows gameplay.'] };
await writeFile(new URL('docs/qa/horizon-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, tests: unit.pass, delivery: report.delivery.mainCatalogue, verification: report.verification }));

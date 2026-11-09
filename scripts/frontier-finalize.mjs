import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readAssets } from './frontier-assets.mjs';
import { fileURLToPath } from 'node:url';
import { FRONTIER_NPCS } from '../src/frontier-characters.js';
import { FRONTIER_ENEMY_IDS } from '../src/frontier-enemies.js';
import { BOSS_ANIMATION_IDS } from '../src/boss-animation-data.js';
import { FRONTIER_LAYOUTS } from '../src/frontier-layout-data.js';
import { UNIVERSE_SUMMARY, UNIVERSE_RECORDS } from '../src/universe-data.js';
const root = new URL('../', import.meta.url), sha = value => createHash('sha256').update(value).digest('hex');
const paths = {
  native: 'docs/qa/frontier-integration-03-report.json', validation: 'docs/qa/frontier-validation-report.json',
  build: 'docs/qa/frontier-build-report.json', development: 'docs/qa/frontier-development-report.json',
  developmentReview: 'docs/qa/frontier-visual-review.json', workbook: 'docs/qa/frontier-workbook-visual-report.json',
  preservation: 'docs/qa/frontier-preservation-report.json',
  production: 'docs/qa/frontier-public-production-01-report.json',
  productionReview: 'docs/qa/frontier-public-production-01-visual-review.json',
  productionHTTP: 'docs/qa/frontier-production-http-artifacts.json',
};
const reports = {}, proofs = {};
for (const [key, path] of Object.entries(paths)) {
  const bytes = await readFile(new URL(path, root)), report = JSON.parse(bytes);
  assert.equal(report.passed, true, path);
  for (const [filename, expected] of Object.entries(report.sourceHashes || report.assetSourceHashes || {})) {
    assert.equal(sha(await readFile(new URL(filename, root))), expected, `Stale final proof ${path}: ${filename}`);
  }
  reports[key] = report; proofs[key] = { path, sha256: sha(bytes) };
}
assert.equal(reports.productionReview.actuallyOpened, true);
assert.equal(reports.productionReview.rawReportSHA256, proofs.production.sha256);
assert.equal(reports.productionHTTP.sourceReportSHA256, proofs.production.sha256);
for (const artifact of reports.productionHTTP.checks) {
  assert.equal(artifact.status, 200);
  assert.equal(artifact.sha256, reports.build.distFiles[artifact.path]?.sha256);
}
assert.equal(reports.productionHTTP.checks.length, Object.keys(reports.build.distFiles).length);
for (const capture of reports.production.captures) {
  assert.equal(sha(await readFile(new URL(capture.path, root))), capture.sha256);
  assert.ok(reports.productionReview.captures.some(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true));
}
const catalogue = JSON.parse(await readFile(new URL('docs/content-catalog.json', root)));
const counts = entries => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, entries.filter(entry => entry.status === status).length]));
assert.deepEqual(counts(catalogue.entries), { Défini: 1001, Prototype: 375, Intégré: 3, Validé: 3 });
assert.deepEqual(counts(UNIVERSE_RECORDS), { Défini: 6036, Prototype: 666, Intégré: 3, Validé: 3 });
const assets = await readAssets(fileURLToPath(root)), sourceHashes = { ...assets.sourceHashes };
for (const filename of ['README.md', 'docs/ASSETS.md', 'docs/CATALOGUE.md', 'docs/DESIGN.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json', 'src/universe-data.js', 'scripts/frontier-finalize.mjs']) {
  sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
}
const unit = reports.validation.commands.find(command => command.name === 'unit');
assert.equal(unit.pass, 854); assert.equal(unit.fail, 0);
const report = { passed: true, generatedAt: new Date().toISOString(),
  baselineCommit: 'ff8a1cf7fd343d2bb8df6b01d5f18f3f5e7723cd', sourceHashes, proofs,
  delivery: { npcConversations: FRONTIER_NPCS.length, npcBodies: 7, topicsAdded: 16,
    enemyTypes: FRONTIER_ENEMY_IDS.length, changedRegularFormations: 6,
    existingBossFamilies: BOSS_ANIMATION_IDS.length, bossDrawings: 16,
    pilotableVehiclePrototype: 'Mako, Therum only; four drawings; no vehicle weapons',
    expandedMaps: Object.values(FRONTIER_LAYOUTS).map(layout => ({ id: layout.id, sectors: layout.rooms.length, paths: layout.paths.length, stableMissionPoints: 7, localArenas: 3 })),
    mainCatalogue: { records: catalogue.entries.length, statuses: counts(catalogue.entries), changed: 34, prototypePromotions: 25 },
    universe: { records: UNIVERSE_SUMMARY.recordCount, sources: UNIVERSE_SUMMARY.sourceCount, statuses: counts(UNIVERSE_RECORDS) } },
  verification: { completeNativeTests: unit.pass, targetedNativeTests: reports.native.unit.passed,
    pairedBalanceCases: reports.native.balance.summary.pairs, actualCampaignVictories: reports.native.balance.summary.actualCampaignWins,
    developmentImagesOpened: reports.developmentReview.images.length,
    workbookPanelsOpened: reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionChecks: reports.production.checks.length, productionImagesOpened: reports.production.captures.length,
    productionExports: reports.production.exports.length, actualPublicATBOrders: reports.production.orders.length,
    png: reports.build.pngCount, publicFilesVerified: reports.build.publicFilesVerified,
    productionHTTPFilesVerified: reports.productionHTTP.checks.length,
    oldPNGsPreserved: reports.preservation.preservedPNGCount, otherWorkbooksPreserved: reports.preservation.preservedOtherWorkbookCount },
  qualification: { sourceDelta: 'docs/qa/frontier-ilos-delta-report.json',
    explanation: 'Non-Ilos development results retain their executed d5715 source hashes. The exact preserved source and audited bridge-only replacement qualify these unchanged methods; fresh enemy and production checks execute the final 2a17 source. Earlier attempts remain separately archived.' },
  limitations: ['Partial ME1 delivery; the remaining catalogue and full later-game/media campaigns are not complete.',
    'Generated likenesses, costumes, map proportions and fixed poses remain Prototype, without original-game 1:1 certification.',
    'NPC texts are French adaptations; full quests and dialogue branches remain open.',
    'New enemies use adapted existing ATB commands; original flight, climbing, explosives, autodestruction and complete kits remain open.',
    'Boss drawings add no original phases. Thorian still uses the historical exterior Feros scene.',
    'Mako physics, cannons, machine gun, suspensions and availability on other worlds remain open; saves resume on foot.',
    'Browser fixtures explicitly prepare earlier story progression; public production plays one ATB order, not the full campaign.',
    'Local software-rendered desktop/mobile checks do not establish physical-device performance or Windows execution.'] };
await writeFile(new URL('docs/qa/frontier-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, tests: unit.pass, delivery: report.delivery.mainCatalogue, verification: report.verification }));

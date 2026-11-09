// Read-only aggregation after candidate verification, actual panel review and
// deliberate copying of the three scoped public deliveries. No generator runs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, IDS, PROMOTED_IDS, COVERAGE_FIELDS, sha } from './me1-prologue-enemies-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bytes = name => fs.readFile(path.join(root, name));
const json = async name => JSON.parse(await bytes(name));
const update = await json('docs/qa/me1-prologue-enemies-workbook-update.json');
const native = await json('docs/qa/me1-prologue-enemies-workbook-public-preservation.json');
const render = await json('docs/qa/me1-prologue-enemies-workbook-render-report.json');
const visual = await json('docs/qa/me1-prologue-enemies-workbook-visual-review-record.json');
const baseline = await json('docs/qa/me1-prologue-enemies-workbook-baseline.json');
assert.equal(update.passed, true); assert.equal(native.ok, true); assert.equal(native.passed, true);
assert.equal(render.passed, true); assert.equal(visual.passed, true);
assert.equal(update.baseCommit, BASE_COMMIT); assert.deepEqual(update.changedIds, IDS);
assert.equal(update.cellChanges.length, 24); assert.equal(update.catalogueChanges.length, 37);
assert.equal(native.changedMetadataFields, 13); assert.equal(native.unchangedEntries, 1375);
assert.equal(native.statusPromotions, 2); assert.equal(native.assetStatusPromotions, 2);
assert.equal(native.integratedOrValidatedPromotions, 0);
assert.deepEqual([...native.prototypeCoverageChangedKeys].sort(), [...COVERAGE_FIELDS].sort());
const deliveries = {};
for (const filename of ['docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json']) deliveries[filename] = sha(await bytes(filename));
assert.equal(deliveries['docs/content-catalog.json'], update.outputHashes.catalogue);
assert.equal(deliveries['docs/Mass_Effect_Relay_Chronicles_Production.xlsx'], update.outputHashes.workbook);
assert.equal(deliveries['docs/Mass_Effect_Relay_Chronicles_Production.xlsx'], native.sha256);
assert.equal(deliveries['public/assets/manifest.json'], update.manifestProof.sha256);
assert.equal(render.sourceWorkbookSha256, native.sha256); assert.equal(render.sourceWorkbookUnchanged, true);
assert.equal(render.images.length, 30); assert.equal(visual.images.length, 30);
assert.equal(visual.actuallyOpenedImages, 30); assert.equal(visual.rowPanels, 28); assert.equal(visual.dashboardPanels, 2);
assert.equal(visual.sourceWorkbookSha256, native.sha256);
assert.equal(visual.renderReportSha256, sha(await bytes('docs/qa/me1-prologue-enemies-workbook-render-report.json')));
assert.deepEqual(visual.images.map(image => image.path).sort(), render.images.map(image => image.path).sort());
for (const image of visual.images) {
  assert.equal(image.actuallyOpened, true); assert.equal(sha(await bytes(image.path)), image.sha256);
  assert.equal(image.sha256, render.images.find(item => item.path === image.path).sha256);
}
for (const [filename, digest] of Object.entries(update.assetSourceHashes)) assert.equal(sha(await bytes(filename)), digest);
for (const gate of update.integrationProofs) assert.equal(sha(await bytes(gate.path)), gate.sha256);
const manifest = await json('public/assets/manifest.json');
assert.equal(manifest.assets.length, 29); assert.equal(manifest.combatKeyPoses, 68);
assert.equal(manifest.enemyCombatKeyPoses, 32); assert.equal(manifest.companionCombatKeyPoses, 28);
assert.equal(manifest.seatedKeyPoses, 2); assert.equal(manifest.terrainTextureCount, 2);
for (const [filename, digest] of Object.entries(baseline.publicPNGHashes)) assert.equal(sha(await bytes(filename)), digest);
const pngs = (await fs.readdir(path.join(root, 'public/assets'))).filter(name => name.endsWith('.png'));
assert.equal(pngs.length, 34);
const paths = ['scripts/me1-prologue-enemies-workbook-data.mjs', 'scripts/update-me1-prologue-enemies-manifest.mjs',
  'scripts/update-me1-prologue-enemies-workbook.mjs', 'scripts/verify-me1-prologue-enemies-workbook.py',
  'scripts/render-me1-prologue-enemies-workbook.mjs', 'scripts/finalize-me1-prologue-enemies-tracking.mjs',
  'docs/qa/me1-prologue-enemies-workbook-baseline.json', 'docs/qa/me1-prologue-enemies-manifest-candidate.json',
  'docs/qa/me1-prologue-enemies-manifest-update.json', 'docs/qa/me1-prologue-enemies-workbook-update.json',
  'docs/qa/me1-prologue-enemies-workbook-preservation.json', 'docs/qa/me1-prologue-enemies-workbook-public-preservation.json',
  'docs/qa/me1-prologue-enemies-workbook-render-report.json', 'docs/qa/me1-prologue-enemies-workbook-visual-review-record.json'];
const artifactDigests = Object.fromEntries(await Promise.all(paths.map(async filename => [filename, sha(await bytes(filename))])));
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  scope: 'Seven existing Jenkins/enemy/camera records; seven explicit visual coverage keys. No global workbook redesign or original1:1 certification.',
  deliveries, changedIds: IDS, catalogueEntries: 1382, unchangedEntries: 1375,
  changedWorkbookCells: 24, changedTextCells: 20, changedStatusCells: 4, changedCatalogueFields: 37, changedMetadataFields: 13,
  statusPromotions: 2, assetStatusPromotions: 2, integratedOrValidatedPromotions: 0,
  explicitPromotions: update.explicitPromotions, beforeStatuses: update.beforeStatuses, afterStatuses: update.afterStatuses,
  nativeChecks: native.nativeChecks,
  actualVisualReview: { record: 'docs/qa/me1-prologue-enemies-workbook-visual-review-record.json', actuallyOpenedImages: 30,
    rowPanels: 28, dashboardPanels: 2, result: visual.result },
  integrationProofs: update.integrationProofs, assetSourceHashes: update.assetSourceHashes,
  prototypeCoverageSynchronization: { changedKeys: native.prototypeCoverageChangedKeys, changes: update.prototypeCoverage.changes,
    preservedChronicles: update.prototypeCoverage.after.chronicles },
  manifestChecks: { manifestAssets: 29, previousManifestAssetsPreserved: 26, previousPublicPNGPreserved: 31,
    publicPNG: 34, newPNG: 3, newCombatKeyPoses: 12, combatKeyPoses: 68, enemyCombatKeyPoses: 32,
    companionCombatKeyPoses: 28, seatedKeyPoses: 2, terrainTextureCount: 2,
    unchangedMetrics: { subjects: manifest.subjects, walkFrames: manifest.walkFrames, keyArtImages: manifest.keyArtImages } },
  artifactDigests,
  limits: ['Only the30targeted workbook panels were visually opened. Open XML checks compare all23,494catalogue cells and preserve native structures/effective formats; Microsoft Excel was not run.',
    'Only the two enemy SPR records become Prototype. Their ENM parent records retain their content and asset statuses. Separate clone-asari/Thorian-phase records remain untouched.',
    'Jenkins retains his temporary prologue availability and irreversible narrative loss. A combat KO drawing is not a resurrection, recruitment or new power.',
    'Promotion gates use source-bound native fixtures, development public controls and actual image review; the separately collected final production journey is required by the root delivery before commit.',
    'Twelve fixed drawings are not complete animation cycles, exact costumes, original movement or certified1:1 body references. The25armour/79weapon/3mod supported equipment counts are inherited and unchanged.'] };
await fs.writeFile(path.join(root, 'docs/qa/me1-prologue-enemies-workbook-visual-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, changedIds: IDS.length, cells: 24, actualPanels: 30, publicPNG: 34, deliveries }));

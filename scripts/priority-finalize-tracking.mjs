// Publish only the two reviewed principal files. No asset manifest mutation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, sha } from './priority-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const updatePath = option('--update-report'), nativePath = option('--native-report'), renderPath = option('--render-report');
const visualPath = option('--visual-review'), scopePath = option('--scope'), output = option('--output');
assert.ok(updatePath && nativePath && renderPath && visualPath && scopePath && output);
const read = filename => fs.readFile(path.resolve(root, filename));
const json = async filename => JSON.parse(await read(filename));
try { await fs.access(output); throw Error('Preserve the existing publication report.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const [update, native, render, visual, baseline, scope] = await Promise.all([
  json(updatePath), json(nativePath), json(renderPath), json(visualPath), json('docs/qa/priority-workbook-baseline.json'), json(scopePath),
]);
for (const report of [update, native, render, visual]) assert.equal(report.passed, true);
assert.equal(update.baseCommit, BASE_COMMIT); assert.equal(native.baselineCommit, BASE_COMMIT); assert.equal(scope.baseCommit, BASE_COMMIT);
assert.deepEqual(update.changedIds, scope.changedIds); assert.deepEqual(update.newIds, []); assert.deepEqual(native.newIds, []);
assert.equal(native.unchangedEntries, 1385 - scope.changedIds.length); assert.equal(native.statusPromotions, update.explicitPromotions.length);
assert.equal(native.assetStatusPromotions, 0); assert.equal(native.integratedOrValidatedPromotions, 0);
assert.equal(native.sha256, update.outputHashes.workbook); assert.equal(render.sourceWorkbookSha256, native.sha256);
assert.equal(render.sourceWorkbookUnchanged, true); assert.equal(render.updateReportSha256, sha(await read(updatePath)));
assert.equal(render.counterProbe.passed, true); assert.equal(render.counterProbe.restored, true); assert.equal(render.counterProbe.exported, false);
assert.equal(visual.reviewComplete, true); assert.deepEqual(visual.blockingFindings, []);
assert.equal(visual.sourceWorkbookSha256, native.sha256); assert.equal(visual.renderReportSha256, sha(await read(renderPath)));
assert.equal(visual.images.length, render.images.length); assert.equal(visual.actuallyOpenedImages, render.images.length);
assert.deepEqual(visual.images.map(image => image.path).sort(), render.images.map(image => image.path).sort());
for (const image of visual.images) {
  assert.equal(image.actuallyOpened, true); assert.equal(image.sha256, render.images.find(other => other.path === image.path).sha256);
  assert.equal(sha(await read(image.path)), image.sha256);
}
assert.equal(update.scopeProof.sha256, sha(await read(scopePath)));
for (const [filename, expected] of Object.entries(update.featureSourceHashes)) assert.equal(sha(await read(filename)), expected, filename);
for (const proof of update.integrationProofs) assert.equal(sha(await read(proof.path)), proof.sha256, proof.path);
for (const [filename, expected] of Object.entries({ ...baseline.publicPNGHashes, ...baseline.otherWorkbookHashes, ...baseline.universeCatalogueHashes })) assert.equal(sha(await read(filename)), expected, filename);
assert.equal(sha(await read('public/assets/manifest.json')), baseline.sourceHashes['public/assets/manifest.json']);
const pngFiles = (await fs.readdir(path.join(root, 'public/assets'))).filter(filename => filename.endsWith('.png')).sort();
assert.deepEqual(pngFiles, Object.keys(baseline.publicPNGHashes).map(filename => path.basename(filename)).sort());
const deliveries = [['docs/content-catalog.json', update.cataloguePath, update.outputHashes.catalogue],
  ['docs/Mass_Effect_Relay_Chronicles_Production.xlsx', update.workbookPath, update.outputHashes.workbook]];
for (const [publicPath, candidate, expected] of deliveries) {
  assert.equal(sha(await read(candidate)), expected); assert.equal(sha(await read(publicPath)), baseline.sourceHashes[publicPath]);
}
assert.ok(process.argv.includes('--publish'), 'All checks passed. Use --publish for the two reviewed principal files.');
const publicNativePath = output.replace(/\.json$/, '-public-native.json'); assert.notEqual(publicNativePath, output);
try {
  for (const [publicPath, candidate] of deliveries) await fs.copyFile(path.resolve(root, candidate), path.join(root, publicPath));
  execFileSync('python', ['scripts/priority-verify-workbook.py', '--before', '/tmp/priority-workbook-baseline/Mass_Effect_Relay_Chronicles_Production.xlsx',
    '--after', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', '--catalog-before', '/tmp/priority-workbook-baseline/content-catalog.json',
    '--catalog-after', 'docs/content-catalog.json', '--changes', updatePath, '--scope', scopePath, '--output', publicNativePath], { cwd: root, stdio: 'inherit' });
  assert.equal((await json(publicNativePath)).passed, true);
} catch (error) {
  for (const [publicPath] of deliveries) await fs.copyFile(path.join('/tmp/priority-workbook-baseline', path.basename(publicPath)), path.join(root, publicPath));
  await fs.writeFile(output.replace(/\.json$/, '-failed-publication.json'), JSON.stringify({ passed: false, at: new Date().toISOString(), failure: String(error), publicCopiesRestoredToBaseline: true }, null, 2) + '\n');
  throw error;
}
const sourceHashes = { ...update.featureSourceHashes };
for (const [filename] of deliveries) sourceHashes[filename] = sha(await read(filename));
sourceHashes['public/assets/manifest.json'] = baseline.sourceHashes['public/assets/manifest.json'];
const proofs = {};
for (const [kind, filename] of [['update', updatePath], ['native', nativePath], ['render', renderPath], ['visual', visualPath], ['publishedNative', publicNativePath]]) proofs[kind] = { path: path.relative(root, path.resolve(root, filename)), sha256: sha(await read(filename)) };
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT, sourceHashes, proofs,
  changedIds: scope.changedIds, newIds: [], catalogueEntries: 1385, unchangedEntries: native.unchangedEntries,
  changedWorkbookCells: update.cellChanges.length, changedCatalogueFields: update.catalogueChanges.length,
  resizedRows: update.rowHeightChanges.length, statusPromotions: native.statusPromotions, assetStatusPromotions: 0, integratedOrValidatedPromotions: 0,
  beforeStatuses: update.beforeStatuses, afterStatuses: update.afterStatuses,
  deliveries: Object.fromEntries(deliveries.map(([filename, , expected]) => [filename, expected])), nativeChecks: native.nativeChecks,
  actualVisualReview: { record: path.relative(root, path.resolve(root, visualPath)), actuallyOpenedImages: visual.images.length, result: visual.result },
  counterProbe: render.counterProbe, integrationProofs: update.integrationProofs, derivedCorrections: update.derivedCorrections,
  preservedHistoricalPNG: 46, unchangedOtherWorkbooks: 31, unchangedUniverseCatalogues: 27, manifestUnchanged: true,
  limits: ['Only the named final panels were actually opened; every catalogue cell and native workbook structure has its separate independent comparison. Microsoft Excel was not launched.',
    'The exact1385identities, sources, priorities, dependencies and canonical acceptance texts remain intact. No record becomes Intégré or Validé.',
    'All46PNG,27supplemental catalogues,31otherXLSX and the asset manifest retain their baseline bytes.',
    'The parent must synchronize the universe registry and verify compiled production after these principal public copies.'] };
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, published: true, changed: scope.changedIds.length, promotions: native.statusPromotions, openedPanels: visual.images.length, statuses: update.afterStatuses }));

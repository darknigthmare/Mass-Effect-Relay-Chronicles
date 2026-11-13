// Publish only the two reviewed principal files. No asset manifest mutation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha, preservation, currentSources, fresh, counts } from './completion-tracking-common.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const updatePath = option('--update-report'), nativePath = option('--native-report'), renderPath = option('--render-report');
const visualPath = option('--visual-review'), scopePath = option('--scope'), output = option('--output');
assert.ok(updatePath && nativePath && renderPath && visualPath && scopePath && output);
const read = filename => fs.readFile(path.resolve(root, filename));
const json = async filename => JSON.parse(await read(filename));
try { await fs.access(output); throw Error('Preserve the existing publication report.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const [update,native,render,visual,scope]=await Promise.all([json(updatePath),json(nativePath),json(renderPath),json(visualPath),json(scopePath)]);
const baseline=await json(scope.baselineProof.path),BASE_COMMIT=baseline.baseCommit;
assert.notEqual(scope.publicationAllowed,false,'A provisional scope is not publishable.');
assert.equal(sha(await read(scope.baselineProof.path)),scope.baselineProof.sha256);
const recordCount=update.catalogueEntries;
for (const report of [update, native, render, visual]) assert.equal(report.passed, true);
for (const report of [update, native, render, visual]) { assert.notEqual(report.selfcheckOnly, true); assert.notEqual(report.publicationAllowed, false); }
assert.deepEqual(update.integrationProofs.map(proof => proof.kind).sort(), ['development', 'integration', 'visual']);
assert.equal(update.baseCommit, BASE_COMMIT); assert.equal(native.baselineCommit, BASE_COMMIT); assert.equal(scope.baseCommit, BASE_COMMIT);
assert.deepEqual(update.changedIds, scope.changedIds); assert.deepEqual(update.newIds, []); assert.deepEqual(native.newIds, []);
assert.equal(native.unchangedEntries, recordCount - scope.changedIds.length); assert.equal(native.statusPromotions, update.explicitPromotions.length);
assert.equal(native.assetStatusPromotions, 0); assert.equal(native.integratedOrValidatedPromotions,update.explicitPromotions.filter(p=>['Intégré','Validé'].includes(p.to)).length);
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
await preservation(baseline);
assert.equal(sha(await read(native.sourceTool.path)),native.sourceTool.sha256);
assert.equal(sha(await read(native.canonicalParser.path)),native.canonicalParser.sha256);
const actualPublicPngs=(await fs.readdir(path.join(root,'public'),{recursive:true})).filter(filename=>filename.endsWith('.png')).map(filename=>`public/${filename}`).sort();
const expectedPublicPngs=Object.keys(baseline.publicInputHashes).filter(filename=>filename.startsWith('public/')&&filename.endsWith('.png')).sort();
assert.deepEqual(actualPublicPngs,expectedPublicPngs,'This lot produces no additional public PNG assets.');
for(const proof of update.integrationProofs) await currentSources((await json(proof.path)).sourceHashes || {},proof.path);
const deliveries = [['docs/content-catalog.json', update.cataloguePath, update.outputHashes.catalogue],
  ['docs/Mass_Effect_Relay_Chronicles_Production.xlsx', update.workbookPath, update.outputHashes.workbook]];
for (const [publicPath, candidate, expected] of deliveries) {
  assert.equal(sha(await read(candidate)), expected); assert.equal(sha(await read(publicPath)), baseline.publicInputHashes[publicPath]);
}
const mainCandidate=await json(update.cataloguePath),candidateById=new Map(mainCandidate.entries.map(entry=>[entry.id,entry]));
const closedRecords=update.explicitPromotions.filter(change=>change.to==='Validé').map(change=>({id:change.id,priority:candidateById.get(change.id).priority,
  from:change.from,to:change.to,validationKind:scope.acceptanceReviews[change.id].kind,exactCriterion:candidateById.get(change.id).acceptance}));
const allAfter=[...mainCandidate.entries];
for(const catalogue of baseline.catalogues)if(catalogue.id!=='ME1')allAfter.push(...(await json(catalogue.catalogPath)).entries);
assert.equal(allAfter.length,baseline.records);
const remainingOpenByPriority=Object.fromEntries(['P0','P1','P2'].map(priority=>[priority,allAfter.filter(entry=>entry.priority===priority&&entry.status!=='Validé').length]));
const closedByPriority=Object.fromEntries(['P0','P1','P2'].map(priority=>[priority,closedRecords.filter(entry=>entry.priority===priority).length]));
for(const priority of ['P0','P1','P2'])assert.equal(baseline.openByPriority[priority]-remainingOpenByPriority[priority],closedByPriority[priority]);
assert.equal(update.afterStatuses['Validé']-update.beforeStatuses['Validé'],closedRecords.length);
assert.ok(process.argv.includes('--publish'), 'All checks passed. Use --publish for the two reviewed principal files.');
const publicNativePath = output.replace(/\.json$/, '-public-native.json'); assert.notEqual(publicNativePath, output); await fresh(path.resolve(root,publicNativePath));
try {
  for (const [publicPath, candidate] of deliveries) await fs.copyFile(path.resolve(root, candidate), path.join(root, publicPath));
  execFileSync('python', ['scripts/completion-tracking-verify-workbook.py', '--baseline',scope.baselineProof.path,'--before', path.join(baseline.snapshotDir,'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'),
    '--after', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', '--catalog-before', path.join(baseline.snapshotDir,'docs/content-catalog.json'),
    '--catalog-after', 'docs/content-catalog.json', '--changes', updatePath, '--scope', scopePath, '--output', publicNativePath], { cwd: root, stdio: 'inherit' });
  assert.equal((await json(publicNativePath)).passed, true);
} catch (error) {
  for (const [publicPath] of deliveries) await fs.copyFile(path.join(baseline.snapshotDir,publicPath), path.join(root, publicPath));
  await fs.writeFile(output.replace(/\.json$/, '-failed-publication.json'), JSON.stringify({ passed: false, at: new Date().toISOString(), failure: String(error), publicCopiesRestoredToBaseline: true }, null, 2) + '\n');
  throw error;
}
const sourceHashes = { ...update.featureSourceHashes };
for (const [filename] of deliveries) sourceHashes[filename] = sha(await read(filename));
sourceHashes['public/assets/manifest.json'] = baseline.publicInputHashes['public/assets/manifest.json'];
const proofs = {};
for (const [kind, filename] of [['update', updatePath], ['native', nativePath], ['render', renderPath], ['visual', visualPath], ['publishedNative', publicNativePath]]) proofs[kind] = { path: path.relative(root, path.resolve(root, filename)), sha256: sha(await read(filename)) };
const report = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT, sourceHashes, proofs,
  localFilesOnly:true,productionPending:true,commitPushAllowed:false,
  releaseVerification:{criterionScope:'Exact acceptance clauses supported by current native/development/actual visual evidence.',production:'Pending separate post-synchronization compiled-product gates. No production execution or external delivery is claimed by this local-copy report.',onFailure:'Correct and reverify, or restore the baseline files before commit/push.'},
  changedIds: scope.changedIds, newIds: [], catalogueEntries: recordCount, unchangedEntries: native.unchangedEntries,
  changedWorkbookCells: update.cellChanges.length, changedCatalogueFields: update.catalogueChanges.length,
  resizedRows: update.rowHeightChanges.length, statusPromotions: native.statusPromotions, assetStatusPromotions: 0, integratedOrValidatedPromotions: native.integratedOrValidatedPromotions,
  beforeStatuses: update.beforeStatuses, afterStatuses: update.afterStatuses,
  criteriaClosed:closedRecords.length,criteriaClosedByPriority:closedByPriority,closedRecords,
  universeAfterStatuses:counts(allAfter),remainingOpenByPriority,remainingOpenTotal:Object.values(remainingOpenByPriority).reduce((sum,value)=>sum+value,0),
  deliveries: Object.fromEntries(deliveries.map(([filename, , expected]) => [filename, expected])), nativeChecks: native.nativeChecks,
  actualVisualReview: { record: path.relative(root, path.resolve(root, visualPath)), actuallyOpenedImages: visual.images.length, result: visual.result },
  counterProbe: render.counterProbe, integrationProofs: update.integrationProofs, acceptanceReviews: scope.acceptanceReviews,
  preservedHistoricalPNG: baseline.preservation.publicPngs, unchangedOtherWorkbooks: baseline.preservation.otherWorkbooks, unchangedUniverseCatalogues: baseline.catalogues.length-1, preservedHistoricalProofs:Object.keys(baseline.historicalHashes).length, manifestUnchanged: true,
  limits: ['Only the named final panels were actually opened; every catalogue cell and native workbook structure has its separate independent comparison. Microsoft Excel was not launched.',
    'Existing identities, sources, priorities, dependencies and canonical acceptance texts remain intact. Every status target is explicitly scoped; a functional validation does not certify artistic or canonical fidelity.',
    'Historical PNG, supplemental catalogues, other XLSX, historical proofs and the asset manifest retain their baseline bytes.',
    'The parent must synchronize the universe registry and verify compiled production after these principal public copies.'] };
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, published: true, changed: scope.changedIds.length, promotions: native.statusPromotions, openedPanels: visual.images.length, statuses: update.afterStatuses }));

// Preserve the verified five-family freeze. A known late-Garrus regression
// blocks delivery; a distinct follow-up report must assess the corrected graph.
// Exact inventories may be arrays or compact reference chains.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, PUBLIC_TARGETS, IMMUTABLE_FIELDS, sha, counts, currentSources, fresh, preservation } from './completion-tracking-common.mjs';
import { loadOpenLedger } from './resolve-tracking-ledger.mjs';
import { UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
const configPath = process.argv[2]; assert.ok(configPath, 'Pass an explicit proof configuration.');
const read = filename => fs.readFile(path.resolve(ROOT, filename));
const configRaw = await read(configPath), config = JSON.parse(configRaw);
assert.match(config.baseCommit || '', /^[0-9a-f]{40}$/);
assert.ok(config.output?.startsWith('docs/qa/resolve-')); await fresh(path.resolve(ROOT, config.output));
const reports = {}, proofs = {};
for (const key of ['native', 'development', 'developmentReview', 'workbook', 'validation', 'build', 'http', 'production', 'productionReview', 'currentAudit', 'preservation']) {
  assert.equal(typeof config[key], 'string', key);
  const bytes = await read(config[key]), report = JSON.parse(bytes);
  assert.equal(report.passed, true, config[key]);
  for (const field of ['selfcheckOnly', 'historicalExecution']) assert.notEqual(report[field], true, config[key]);
  for (const field of ['publicationAllowed', 'currentProductGate']) assert.notEqual(report[field], false, config[key]);
  await currentSources(report.sourceHashes || report.featureSourceHashes || {}, config[key]);
  if (report.baseCommit || report.baselineCommit) assert.equal(report.baseCommit || report.baselineCommit, config.baseCommit, config[key]);
  reports[key] = report; proofs[key] = { path: config[key], sha256: sha(bytes) };
}
const preserved = reports.preservation, baselineRaw = await read(preserved.baselineProof.path), baseline = JSON.parse(baselineRaw);
assert.equal(sha(baselineRaw), preserved.baselineProof.sha256); assert.equal(baseline.baseCommit, config.baseCommit);
await preservation(baseline, true);
await currentSources(Object.fromEntries(Object.entries(baseline.sourceHashes).filter(([filename]) => filename.startsWith('scripts/'))), 'historical tools');
assert.equal(preserved.principalCopiesMayDiffer, true); assert.equal(preserved.preservedValidatedRecords, baseline.catalogues[0].statuses.Validé);
assert.equal(preserved.preservedPublicFiles, 79); assert.equal(preserved.preservedPublicPngs, 46);
assert.equal(preserved.preservedOtherWorkbooks, 31); assert.equal(preserved.preservedSupplementalCatalogues, 27);
for (const item of preserved.frozenProposals) for (const filename of [item.path, item.source]) assert.equal(sha(await read(filename)), item.sha256, filename);
const beforeRaw = execFileSync('git', ['show', `${config.baseCommit}:docs/content-catalog.json`], { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 });
assert.equal(sha(beforeRaw), baseline.publicInputHashes[PUBLIC_TARGETS[0]]);
const before = JSON.parse(beforeRaw), catalogue = JSON.parse(await read(PUBLIC_TARGETS[0]));
const beforeById = new Map(before.entries.map(record => [record.id, record]));
assert.deepEqual(catalogue.entries.map(record => record.id), before.entries.map(record => record.id));
for (const record of catalogue.entries) {
  const original = beforeById.get(record.id);
  if (original.status === 'Validé') assert.deepEqual(record, original, record.id);
  for (const field of [...IMMUTABLE_FIELDS, 'description', 'assetStatus']) assert.deepEqual(record[field], original[field], `${record.id}.${field}`);
  assert.ok((record.notes || '').startsWith(original.notes || ''), `${record.id}: append-only notes`);
}
const closed = catalogue.entries.filter(record => record.status === 'Validé' && beforeById.get(record.id).status !== 'Validé');
const byId = new Map(catalogue.entries.map(record => [record.id, record]));
for (const record of closed) {
  const review = reports.workbook.acceptanceReviews[record.id]; assert.ok(review, record.id);
  assert.equal(review.exactCriterion, record.acceptance); assert.equal(review.complete, true);
  assert.equal(review.exactDescription, record.description); assert.equal(review.descriptionComplete, true);
  assert.ok(review.coveredDescriptionClauses?.length && review.coveredClauses?.length && review.evidence?.length, record.id);
  for (const filename of review.evidence) await fs.access(path.resolve(ROOT, filename));
  for (const dependency of record.dependencies || []) assert.equal(byId.get(dependency)?.status, 'Validé', `${record.id}: ${dependency}`);
}
const currentLedger = await loadOpenLedger(config.currentAudit), ledgerById = new Map(currentLedger.records.map(record => [record.id, record]));
assert.equal(reports.currentAudit.records, baseline.records); assert.equal(currentLedger.records.length, Object.values(baseline.openByPriority).reduce((sum, value) => sum + value, 0) - closed.length);
const manifest = JSON.parse(await read('docs/universe/manifest.json'));
const catalogues = [catalogue, ...await Promise.all(manifest.workbooks.map(async work => JSON.parse(await read(work.catalogPath))))];
const all = catalogues.flatMap(item => item.entries), runtime = new Map(UNIVERSE_RECORDS.map(record => [record.id, record]));
assert.equal(all.length, baseline.records); assert.equal(new Set(all.map(record => record.id)).size, all.length);
assert.equal(UNIVERSE_SUMMARY.recordCount, baseline.records); assert.equal(UNIVERSE_SUMMARY.sourceCount, baseline.sources);
for (const record of all) {
  assert.equal(runtime.get(record.id)?.status, record.status, record.id);
  if (record.status === 'Validé') { assert.equal(ledgerById.has(record.id), false, record.id); continue; }
  const inventory = ledgerById.get(record.id); assert.ok(inventory, record.id);
  for (const field of ['id', 'category', 'priority', 'status', 'assetStatus', 'name', 'episode', 'scope', 'canonLevel', 'description', 'acceptance', 'reference', 'sourceUrl', 'notes']) assert.deepEqual(inventory[field], record[field], `${record.id}.${field}`);
  assert.deepEqual(inventory.dependencies, record.dependencies || [], record.id);
  assert.deepEqual(inventory.implementationPaths, record.implementationPaths || [], record.id);
  assert.deepEqual(inventory.declaredEvidence, record.evidence || [], record.id);
}
const closedByPriority = Object.fromEntries(['P0', 'P1', 'P2'].map(priority => [priority, closed.filter(record => record.priority === priority).length]));
for (const priority of ['P0', 'P1', 'P2']) assert.equal(reports.currentAudit.openByPriority[priority], baseline.openByPriority[priority] - closedByPriority[priority]);
assert.equal(reports.workbook.criteriaClosed, closed.length); assert.equal(reports.workbook.assetStatusPromotions, 0);
assert.deepEqual(reports.workbook.afterStatuses, counts(catalogue.entries));
await currentSources(reports.workbook.deliveries, 'published principal files');
for (const proof of [...Object.values(reports.workbook.proofs), ...reports.workbook.integrationProofs]) assert.equal(sha(await read(proof.path)), proof.sha256, proof.path);
const unit = reports.native.unit; assert.ok(unit && unit.tests >= 1177); assert.equal(unit.tests, config.expectedNativeTests); assert.equal(unit.pass, unit.tests);
for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(unit[key], 0);
assert.equal(reports.native.output.exitCode, 0); assert.equal(sha(await read(reports.native.output.path)), reports.native.output.sha256);
const nativeBundleRaw = await read(reports.native.sourceBundle.path);
assert.equal(sha(nativeBundleRaw), reports.native.sourceBundle.sha256);
const nativeBundle = JSON.parse(nativeBundleRaw); assert.equal(nativeBundle.baseCommit, config.baseCommit);
for (const [filename, content] of Object.entries(nativeBundle.replacements)) assert.equal(sha(content), reports.native.sourceHashes[filename], `native reconstructed source: ${filename}`);
const nativeOutput = (await read(reports.native.output.path)).toString();
for (const key of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) assert.equal(Number(nativeOutput.match(new RegExp(`(?:#|ℹ) ${key} (\\d+)`))?.[1]), unit[key], `actual native output: ${key}`);
for (const command of reports.validation.commands) {
  assert.equal(command.exitCode, 0); assert.equal(sha(await read(command.output)), command.sha256);
  if (command.detailedReport) assert.equal(sha(await read(command.detailedReport.path)), command.detailedReport.sha256);
}
const expectedKinds = ['citadel', 'noveria', 'virmire', 'endgame', 'origins'].sort(), captureCounts = {};
for (const stage of ['development', 'production']) {
  const aggregate = reports[stage], review = reports[`${stage}Review`], captured = new Set();
  assert.equal(aggregate.stage, stage); assert.deepEqual(aggregate.inputReports.map(item => item.kind).sort(), expectedKinds);
  assert.equal(review.reviewComplete, true); assert.deepEqual(review.blockingFindings, []);
  captureCounts[stage] = {};
  for (const family of aggregate.inputReports) {
    const bytes = await read(family.path); assert.equal(sha(bytes), family.sha256);
    const run = JSON.parse(bytes); assert.equal(run.passed, true); assert.equal(run.mode, stage); assert.equal(run.sourceFrozen, true);
    await currentSources(run.sourceHashes, family.path);
    const collectorPath = run.command.script.replace(/^node /, '');
    assert.match(collectorPath, /^scripts\/resolve-[a-z0-9-]+\.mjs$/);
    for (const [snapshot, source] of [[run.collectorSnapshot, collectorPath], [run.helperSnapshot, 'scripts/resolve-browser-proof.mjs']]) {
      assert.ok(snapshot?.path && snapshot.sha256, `${family.path}: exact collector/helper archive required`);
      assert.equal(sha(await read(snapshot.path)), snapshot.sha256); assert.equal(snapshot.sha256, run.sourceHashes[source], `${family.path}: actual executed tool version`);
    }
    if (stage === 'production') await currentSources(run.registryContextHashes || {}, `${family.path}: registry context`);
    else {
      assert.equal(run.registryContextHashes?.['docs/content-catalog.json'], baseline.publicInputHashes['docs/content-catalog.json'], `${family.path}: DEV catalogue must match the baseline`);
      assert.equal(run.registryContextHashes?.['src/universe-data.js'], baseline.sourceHashes['src/universe-data.js'], `${family.path}: DEV generated context must match the baseline`);
    }
    if (run.finalSourceHashes) assert.deepEqual(run.finalSourceHashes, run.sourceHashes);
    if (run.finalRegistryContextHashes) assert.deepEqual(run.finalRegistryContextHashes, run.registryContextHashes);
    for (const field of ['errors', 'failedRequests', 'consoleErrors', 'evidenceErrors', 'deliveryErrors', 'codeResponseErrors']) if (Array.isArray(run[field])) assert.deepEqual(run[field], [], `${family.path}.${field}`);
    for (const check of run.checks || []) assert.equal(check.passed, true, `${family.path}: ${check.name}`);
    for (const artifact of [...(run.exports || []), ...(run.fixtures || [])]) assert.equal(sha(await read(artifact.path)), artifact.sha256);
    const captures = run.captureArtifacts || run.captures || run.screenshots || [];
    assert.ok(captures.length >= 4 && captures.length <= 6, `${family.path}: four to six actual PNG captures`);
    captureCounts[stage][family.kind] = captures.length;
    for (const capture of captures) {
      assert.equal(sha(await read(capture.path)), capture.sha256); captured.add(`${capture.path}\0${capture.sha256}`);
      assert.ok(review.images.some(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true), capture.path);
    }
    if (stage === 'production') {
      assert.equal(run.distFrozen, true); assert.deepEqual(run.sourceRequests, []); assert.deepEqual(run.distFiles, reports.build.distFiles);
      const context = { ...run.sourceHashes, ...run.registryContextHashes };
      for (const filename of ['docs/content-catalog.json', 'src/universe-data.js']) assert.equal(context[filename], sha(await read(filename)), filename);
      for (const served of run.servedFiles || []) {
        assert.ok(!served.path.startsWith('dist/')); const built = reports.build.distFiles[served.path]; assert.ok(built, served.path);
        assert.equal(served.bytes, built.bytes); assert.equal(served.sha256, built.sha256);
      }
    }
  }
  assert.deepEqual([...captured].sort(), review.images.map(image => `${image.path}\0${image.sha256}`).sort());
  for (const item of aggregate.reviewRecords) assert.equal(sha(await read(item.path)), item.sha256);
}
assert.deepEqual(captureCounts.development, captureCounts.production, 'Same capture count for each DEV/production family.');
assert.equal(reports.http.buildReport.sha256, proofs.build.sha256); assert.equal(reports.build.pngCount, 46);
assert.deepEqual(reports.http.checks.map(item => item.path).sort(), Object.keys(reports.build.distFiles).sort());
const actualDist = (await fs.readdir(path.join(ROOT, 'dist'), { recursive: true, withFileTypes: true })).filter(item => item.isFile()).map(item => path.relative(path.join(ROOT, 'dist'), path.join(item.parentPath, item.name))).sort();
assert.deepEqual(actualDist, Object.keys(reports.build.distFiles).sort());
for (const item of reports.http.checks) {
  assert.equal(item.status, 200); const bytes = await read(`dist/${item.path}`), built = reports.build.distFiles[item.path];
  assert.equal(sha(bytes), item.sha256); assert.equal(item.sha256, built.sha256); assert.equal(bytes.length, built.bytes);
}
const sourcePaths = [...new Set([...Object.keys(reports.build.sourceHashes), ...PUBLIC_TARGETS, 'src/universe-data.js', configPath,
  'scripts/resolve-tracking-finalize.mjs', 'scripts/resolve-tracking-ledger.mjs', ...(config.documentationPaths || [])])].sort();
const sourceHashes = Object.fromEntries(await Promise.all(sourcePaths.map(async filename => [filename, sha(await read(filename))])));
const followupRequired = { id: 'late-garrus-after-wrex-investiture', blocking: true, status: 'pending',
  regression: 'After the modern Wrex investigation route without the clinic and the Spectre investiture, late Garrus recruitment is no longer available although the prior campaign contract allowed it.',
  requiredWork: ['Restore the existing late-recruitment contract with a minimal main/state correction and a meaningful native regression test.',
    'Execute the affected public development and compiled-production recruitment route, then produce a new build and complete HTTP byte proof.',
    'Compose a separate delivery report that references this historical freeze and the correction, and explicitly identifies the unchanged family journeys not rerun on the final bundle.'],
  trackingDataUnchanged: 'No second principal catalogue/workbook copy is authorized or required for this follow-up; the exact 32 criteria and 70 reviewed panels retain their existing scope.',
  ...(config.followupRequired || {}) };
assert.equal(followupRequired.blocking, true, 'This freeze cannot waive the known follow-up.');
assert.equal(followupRequired.status, 'pending', 'A distinct current delivery report must resolve the follow-up; preserve this freeze.');
const report = { passed: true, at: new Date().toISOString(), baselineCommit: config.baseCommit, sourceHashes,
  scopeFreezeOnly: true, currentProductGate: false, productionPending: false,
  scopedValidationComplete: true, localValidationComplete: false, commitPushAllowed: false, followupRequired,
  configuration: { path: configPath, sha256: sha(configRaw) }, proofs,
  delivery: { scope: config.scope || 'ME1 Citadel, Noveria, Virmire, endgame and Shepard origin functional criteria.',
    main: { records: catalogue.entries.length, changed: reports.workbook.changedIds.length, statuses: counts(catalogue.entries) },
    universe: { records: all.length, sources: baseline.sources, statuses: counts(all) },
    closedCriteria: closed.length, closedByPriority,
    closed: closed.map(record => ({ id: record.id, priority: record.priority, previousStatus: beforeById.get(record.id).status,
      exactCriterion: record.acceptance, acceptanceReview: reports.workbook.acceptanceReviews[record.id] })),
    remainingOpenCriteria: reports.currentAudit.openByPriority, remainingTotal: currentLedger.records.length,
    compactLedger: { reference: { path: currentLedger.path, sha256: currentLedger.sha256 }, chain: currentLedger.chain } },
  verification: { nativeTests: unit.pass, developmentImagesOpened: reports.developmentReview.images.length,
    productionImagesOpened: reports.productionReview.images.length, workbookPanelsOpened: reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionFamilies: reports.production.inputReports.length, httpFilesVerified: reports.http.checks.length,
    gamePNG: reports.build.pngCount, preservedOtherWorkbooks: preserved.preservedOtherWorkbooks,
    preservedOtherCatalogues: preserved.preservedSupplementalCatalogues, preservedValidatedRecords: preserved.preservedValidatedRecords },
  limitations: config.limitations || ['Exact criteria are assessed within the current sprites/3D/ATB adaptation; original artistic, geographic and canonical fidelity remains separately scoped.',
    'Each fixture, public save, browser execution and actually opened image belongs to its cited collector or reviewer.',
    'Microsoft Excel, physical controllers, native Windows gameplay and untested hardware are not claimed.'] };
await fs.writeFile(path.resolve(ROOT, config.output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, closed: closed.length, byPriority: closedByPriority, verification: report.verification }));

// Assess the corrected graph separately from the immutable five-family freeze.
// No old browser journey is promoted to an execution of the new bundle.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, sha, fresh, currentSources, preservation } from './completion-tracking-common.mjs';
import { decodeSave } from '../src/state.js';

const configPath = process.argv[2]; assert.ok(configPath, 'Pass the distinct delivery configuration.');
const read = filename => fs.readFile(path.resolve(ROOT, filename));
const json = async filename => JSON.parse(await read(filename));
const configRaw = await read(configPath), config = JSON.parse(configRaw);
assert.equal(config.output, 'docs/qa/resolve-report.json'); await fresh(path.resolve(ROOT, config.output));
const proofs = {}, reports = {};
for (const key of ['freezeReport', 'native', 'development', 'developmentReview', 'production', 'productionReview', 'validation', 'build', 'http']) {
  assert.equal(typeof config[key], 'string', key); const bytes = await read(config[key]);
  const report = JSON.parse(bytes); assert.equal(report.passed, true, config[key]);
  reports[key] = report; proofs[key] = { path: config[key], sha256: sha(bytes) };
}
const freeze = reports.freezeReport;
assert.equal(freeze.scopeFreezeOnly, true); assert.equal(freeze.currentProductGate, false);
assert.equal(freeze.commitPushAllowed, false); assert.equal(freeze.followupRequired?.blocking, true);
assert.equal(freeze.followupRequired.status, 'pending'); assert.equal(freeze.productionPending, false);
assert.equal(freeze.followupRequired.id, 'late-garrus-after-wrex-investiture');
assert.equal(config.baseCommit, freeze.baselineCommit);
for (const proof of Object.values(freeze.proofs)) assert.equal(sha(await read(proof.path)), proof.sha256, `immutable freeze proof: ${proof.path}`);
const oldNative = await json(freeze.proofs.native.path), oldProduction = await json(freeze.proofs.production.path);
const oldWorkbook = await json(freeze.proofs.workbook.path), oldPreservation = await json(freeze.proofs.preservation.path);
const baselineRaw = await read(oldPreservation.baselineProof.path), baseline = JSON.parse(baselineRaw);
assert.equal(sha(baselineRaw), oldPreservation.baselineProof.sha256); assert.equal(baseline.baseCommit, config.baseCommit);
await preservation(baseline, true);
await currentSources(Object.fromEntries(Object.entries(baseline.sourceHashes).filter(([filename]) => filename.startsWith('scripts/'))), 'original historical tools');
await currentSources(oldWorkbook.deliveries, 'unchanged reviewed principal copies');
assert.equal(sha(await read('src/universe-data.js')), freeze.sourceHashes['src/universe-data.js'], 'unchanged generated tracking registry');
for (const proposal of oldPreservation.frozenProposals) for (const filename of [proposal.path, proposal.source]) assert.equal(sha(await read(filename)), proposal.sha256, filename);

const allowedExisting = ['src/main.js', 'src/state.js'];
const addedTests = config.allowedNewTestPaths;
assert.ok(Array.isArray(addedTests) && addedTests.length > 0); assert.equal(new Set(addedTests).size, addedTests.length);
for (const filename of addedTests) { assert.match(filename, /^tests\/resolve-[a-z0-9-]+\.test\.js$/); assert.ok(!Object.hasOwn(oldNative.sourceHashes, filename), filename); }
const native = reports.native; assert.equal(native.baseCommit || native.baselineCommit, config.baseCommit);
assert.equal(native.sourceFrozen, true); await currentSources(native.sourceHashes, config.native);
const changedExisting = [];
for (const [filename, expected] of Object.entries(oldNative.sourceHashes)) {
  assert.ok(Object.hasOwn(native.sourceHashes, filename), `Missing frozen executable input: ${filename}`);
  if (native.sourceHashes[filename] !== expected) { assert.ok(allowedExisting.includes(filename), `Unexpected executable change: ${filename}`); changedExisting.push(filename); }
}
assert.ok(changedExisting.length > 0, 'The late-recruitment regression needs a real executable correction.');
assert.deepEqual(Object.keys(native.sourceHashes).filter(filename => !Object.hasOwn(oldNative.sourceHashes, filename)).sort(), [...addedTests].sort(), 'Only declared new regression tests extend the native graph.');
const changedFrozen = [];
for (const [filename, expected] of Object.entries(freeze.sourceHashes)) {
  if (filename === 'README.md' || filename.startsWith('docs/') && !filename.endsWith('.xlsx') && filename !== 'docs/content-catalog.json') continue;
  const actual = sha(await read(filename));
  if (actual !== expected) { assert.ok(allowedExisting.includes(filename), `Unexpected change to the verified freeze: ${filename}`); changedFrozen.push(filename); }
}
assert.deepEqual(changedFrozen.sort(), [...changedExisting].sort());
const unit = native.unit; assert.equal(unit.tests, config.expectedNativeTests); assert.ok(unit.tests > oldNative.unit.tests); assert.equal(unit.pass, unit.tests);
for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(unit[key], 0);
assert.equal(native.output.exitCode, 0); const tap = await read(native.output.path); assert.equal(sha(tap), native.output.sha256);
for (const key of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) assert.equal(Number(tap.toString().match(new RegExp(`(?:#|ℹ) ${key} (\\d+)`))?.[1]), unit[key], `actual current TAP: ${key}`);
assert.match(tap.toString(), /garrus/i, 'The current native output must include the recruitment regression.');
for (const filename of addedTests) assert.ok(native.command.includes(filename), `New test was not executed: ${filename}`);
const bundleRaw = await read(native.sourceBundle.path); assert.equal(sha(bundleRaw), native.sourceBundle.sha256);
const bundle = JSON.parse(bundleRaw); assert.equal(bundle.baseCommit, config.baseCommit);
for (const [filename, content] of Object.entries(bundle.replacements)) assert.equal(sha(content), native.sourceHashes[filename], filename);

for (const key of ['validation', 'build', 'http']) {
  const report = reports[key]; assert.equal(report.baseCommit || report.baselineCommit, config.baseCommit);
  await currentSources(report.sourceHashes, config[key]);
}
for (const command of reports.validation.commands) {
  assert.equal(command.exitCode, 0); assert.equal(sha(await read(command.output)), command.sha256);
  if (command.detailedReport) assert.equal(sha(await read(command.detailedReport.path)), command.detailedReport.sha256);
}
const build = reports.build; assert.equal(build.pngCount, 46); assert.equal(build.publicFilesVerified, 79);
for (const filename of ['src/main.js', 'src/state.js', 'src/universe-data.js', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx']) assert.equal(build.sourceHashes[filename], sha(await read(filename)), `Current build context: ${filename}`);
assert.notDeepEqual(build.distFiles, (await json(freeze.proofs.build.path)).distFiles, 'A corrected executable graph requires a new bundle.');
assert.equal(reports.http.buildReport.sha256, proofs.build.sha256);
const distPaths = (await fs.readdir(path.join(ROOT, 'dist'), { recursive: true, withFileTypes: true })).filter(item => item.isFile()).map(item => path.relative(path.join(ROOT, 'dist'), path.join(item.parentPath, item.name))).sort();
assert.deepEqual(distPaths, Object.keys(build.distFiles).sort());
assert.deepEqual(reports.http.checks.map(item => item.path).sort(), distPaths);
for (const item of reports.http.checks) {
  assert.ok(!item.path.startsWith('dist/')); assert.equal(item.status, 200);
  const bytes = await read(`dist/${item.path}`), expected = build.distFiles[item.path];
  assert.equal(bytes.length, expected.bytes); assert.equal(sha(bytes), expected.sha256); assert.equal(item.sha256, expected.sha256);
}

const target = state => state?.resolveCitadel?.legacy === false && state.resolveCitadel.clinic === false
  && state.resolveCitadel.proof === true && state.flags?.spectre === true && state.completed?.includes('citadel') && state.recruited?.includes('wrex');
const targetedVerification = {};
for (const stage of ['development', 'production']) {
  const execution = reports[stage], review = reports[`${stage}Review`];
  assert.equal(execution.mode, stage); assert.equal(execution.sourceFrozen, true); assert.equal(execution.browserClosed, true);
  assert.equal(execution.baseCommit || execution.baselineCommit, config.baseCommit);
  await currentSources(execution.sourceHashes, config[stage]); await currentSources(execution.registryContextHashes, `${config[stage]}: context`);
  assert.deepEqual(execution.finalSourceHashes, execution.sourceHashes); assert.deepEqual(execution.finalRegistryContextHashes, execution.registryContextHashes);
  for (const filename of changedExisting) assert.equal(execution.sourceHashes[filename], native.sourceHashes[filename], `Current targeted execution: ${filename}`);
  const collector = execution.command.script.replace(/^node /, '');
  for (const [snapshot, filename] of [[execution.collectorSnapshot, collector], [execution.helperSnapshot, 'scripts/resolve-browser-proof.mjs']]) {
    assert.ok(snapshot?.path); assert.equal(sha(await read(snapshot.path)), snapshot.sha256); assert.equal(snapshot.sha256, execution.sourceHashes[filename]);
  }
  for (const field of ['errors', 'consoleErrors', 'failedRequests', 'deliveryErrors', 'evidenceErrors']) if (Array.isArray(execution[field])) assert.deepEqual(execution[field], [], `${config[stage]}.${field}`);
  assert.ok(execution.checks.length > 0); for (const check of execution.checks) assert.equal(check.passed, true);
  assert.match(execution.checks.map(check => check.name).join(' '), /garrus/i);
  assert.equal(review.reviewComplete, true); assert.deepEqual(review.blockingFindings, []);
  if (review.sourceHashes) await currentSources(review.sourceHashes, config[`${stage}Review`]);
  for (const link of [review.originalReview, review.execution]) if (link?.path && link.sha256) assert.equal(sha(await read(link.path)), link.sha256);
  if (review.report && review.reportSHA256) assert.equal(sha(await read(review.report)), review.reportSHA256);
  const captures = execution.captures || execution.captureArtifacts || execution.screenshots || [];
  assert.ok(captures.length > 0); assert.equal(review.images.length, captures.length);
  assert.deepEqual(review.images.map(image => `${image.path}\0${image.sha256}`).sort(), captures.map(image => `${image.path}\0${image.sha256}`).sort());
  for (const capture of captures) {
    assert.equal(sha(await read(capture.path)), capture.sha256);
    const image = review.images.find(image => image.path === capture.path); assert.equal(image.actuallyOpened, true); assert.ok(image.observations || image.observation);
  }
  const beforeStates = [];
  for (const fixture of execution.fixtures) {
    const bytes = await read(fixture.path); assert.equal(sha(bytes), fixture.sha256); assert.equal(fixture.importedViaPublicChooser, true); beforeStates.push(decodeSave(bytes.toString()));
  }
  assert.ok(beforeStates.some(state => target(state) && !state.recruited.includes('garrus')), 'A declared imported modern Wrex/no-clinic/Spectre fixture must start without Garrus.');
  const exportedStates = [];
  for (const artifact of execution.exports) { const bytes = await read(artifact.path); assert.equal(sha(bytes), artifact.sha256); exportedStates.push(decodeSave(bytes.toString())); }
  assert.ok(exportedStates.some(state => target(state) && state.recruited.filter(id => id === 'garrus').length === 1), 'An actual public export must contain late Garrus while preserving the no-clinic modern route.');
  if (stage === 'production') {
    assert.equal(execution.distFrozen, true); assert.deepEqual(execution.sourceRequests, []); assert.deepEqual(execution.distFiles, build.distFiles); assert.deepEqual(execution.finalDistFiles, build.distFiles);
    assert.ok(execution.servedFiles.some(file => file.path.endsWith('.js') && file.observedActualBrowserResponse === true));
    for (const file of execution.servedFiles) { const expected = build.distFiles[file.path]; assert.ok(expected); assert.equal(file.bytes, expected.bytes); assert.equal(file.sha256, expected.sha256); }
  }
  targetedVerification[stage] = { checks: execution.checks.length, actuallyOpenedImages: captures.length, publicExports: execution.exports.length,
    modernWrexNoClinicSpectreFixture: true, lateRecruitmentInActualPublicExport: true };
}
const proofToolPaths = config.proofToolPaths || [];
for (const filename of proofToolPaths) { assert.match(filename, /^scripts\/resolve-[a-z0-9-]+\.mjs$/); await fs.access(path.resolve(ROOT, filename)); }
const currentProofSources = Object.entries(reports).filter(([key]) => key !== 'freezeReport').flatMap(([, report]) => Object.keys(report.sourceHashes || {}));
const sourcePaths = [...new Set([...currentProofSources, ...proofToolPaths,
  'scripts/resolve-delivery.mjs', 'scripts/completion-tracking-common.mjs', configPath, ...(config.documentationPaths || [])])].sort();
const sourceHashes = Object.fromEntries(await Promise.all(sourcePaths.map(async filename => [filename, sha(await read(filename))])));
const report = { passed: true, at: new Date().toISOString(), baselineCommit: config.baseCommit, sourceHashes,
  productionPending: false, localValidationComplete: true, commitPushAllowed: true, currentProductGate: true,
  configuration: { path: configPath, sha256: sha(configRaw) }, proofs,
  followupRequired: { ...freeze.followupRequired, blocking: false, status: 'resolved', resolvedBy: { native: proofs.native, development: proofs.development, production: proofs.production, build: proofs.build, http: proofs.http } },
  executableDelta: { comparedWith: freeze.proofs.native, changedExisting: changedExisting.sort(), addedTests: [...addedTests].sort(), allOtherNative03InputsByteIdentical: true },
  trackingPreserved: { principalCopiesUnchanged: true, catalogueAndWorkbook: oldWorkbook.deliveries, generatedRegistryUnchanged: true,
    reviewedWorkbookPanels: freeze.verification.workbookPanelsOpened, noSecondPrincipalCopy: true, publicAssetsByteIdentical: true },
  delivery: freeze.delivery,
  initialFiveFamilies: { phase: 'Historical five-family freeze before the late-Garrus correction', productionAggregate: freeze.proofs.production,
    families: oldProduction.inputReports.map(item => ({ ...item, executedBeforeCorrection: true, rerunOnCurrentBundle: false })),
    qualifier: 'These five public family journeys were verified on the preceding bundle. They were not rerun in full on the corrected bundle. The current bundle has the full fresh native suite, targeted late-Garrus development/production journeys and complete HTTP byte verification.' },
  verification: { ...freeze.verification, nativeTests: unit.pass, historicalNativeTests: oldNative.unit.pass,
    currentTargeted: targetedVerification, currentHttpFilesVerified: reports.http.checks.length },
  limitations: ['The five initial family journeys and their screenshots remain attributed to their historical pre-correction bundle; no replay on the current bundle is inferred.',
    'Only the late-recruitment route is newly exercised in current development and compiled production; the complete current native suite and HTTP byte checks have separate proofs.',
    'The 32 exact criteria and reviewed Excel data are unchanged. Artistic, original geographic and canonical limits remain those of the frozen proposals; no assets are promoted.',
    'Microsoft Excel, native Windows gameplay and untested physical hardware are not claimed.'] };
await fs.writeFile(path.resolve(ROOT, config.output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, commitPushAllowed: true, correctedFiles: changedExisting, nativeTests: unit.pass, targetedVerification, historicalFamiliesNotRerun: oldProduction.inputReports.length }));

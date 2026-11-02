import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { decodeSave } from '../src/state.js';

// This collector reads existing proofs. It never runs tests, builds, browsers or
// generators, and never rewrites evidence from the first accepted Eden lot.
const root = new URL('../', import.meta.url), baseline = '641fa6309d7eb04a28f981b8bcdd34210ffdd200';
const publicPath = process.argv[2] || 'docs/qa/eden-occlusion-production-summary.json';
assert.match(publicPath, /^docs\/qa\/eden-occlusion-[a-z0-9-]+\.json$/);
const hash = data => createHash('sha256').update(data).digest('hex');
const bytes = path => readFile(new URL(path, root)), proofs = {}, checked = new Map();
async function digest(path) {
  if (!checked.has(path)) checked.set(path, hash(await bytes(path)));
  return checked.get(path);
}
async function artifact(item) {
  assert.ok(item?.path && /^[a-f0-9]{64}$/.test(item.sha256), 'Evidence needs a file and its SHA256.');
  assert.equal(await digest(item.path), item.sha256, `Changed evidence: ${item.path}`);
  if (Number.isInteger(item.bytes)) assert.equal((await bytes(item.path)).length, item.bytes);
}
async function artifacts(items = []) { for (const item of items) await artifact(item); }
async function sources(value = {}) { for (const [path, sha256] of Object.entries(value)) await artifact({ path, sha256 }); }
async function proof(path, accepted = report => report.passed === true) {
  const raw = await bytes(path), report = JSON.parse(raw); assert.ok(accepted(report), `Proof is not accepted: ${path}`);
  proofs[path] = { path, bytes: raw.length, sha256: hash(raw) }; return report;
}
const clean = (report, keys) => { for (const key of keys) assert.deepEqual(report[key], [], `Nonempty ${key}`); };
const paths = items => items.map(item => item.path).sort();
const native = await proof('docs/qa/eden-occlusion-native-report.json');
const unit = await proof('docs/qa/eden-occlusion-unit-report.json');
const build = await proof('docs/qa/eden-occlusion-build-report.json');
const production = await proof(publicPath);
const visual = await proof('docs/qa/eden-occlusion-visual-review.json');
const encounterRun = await proof('docs/qa/eden-occlusion-production-report.json', report => report.passed === false && report.encounter?.exactPrecombatRestore === true);
const debugRun = await proof('docs/qa/eden-occlusion-map-production-report.json', report => report.passed === false && /entire map board/.test(report.failure));
const mapRun = await proof('docs/qa/eden-occlusion-map-production-final-report.json');
const executions = [encounterRun, debugRun, mapRun];
assert.equal(production.proofKind, 'explicit-composite-public-proof'); assert.equal(production.composite, true);
assert.equal(production.executionCount, 3); assert.equal(production.acceptedEvidenceExecutions, 2);
await artifacts(production.rawReports); await artifacts(production.executedDrivers); await artifacts(production.snapshots);
await artifact(production.collectionTool);
const collectedLaunches = executions.reduce((sum, run) => sum + run.profile.launches, 0);
const collectedShutdowns = executions.reduce((sum, run) => sum + run.profile.completeShutdowns, 0);
assert.equal(collectedLaunches, 3); assert.equal(collectedShutdowns, 3);
assert.equal(production.profile.launches, collectedLaunches); assert.equal(production.profile.completeShutdowns, collectedShutdowns);
const collectionArchives = [];
for (const path of ['docs/qa/eden-occlusion-production-attempt1/snapshot-manifest.json', 'docs/qa/eden-occlusion-map-production-attempt1/snapshot-manifest.json']) {
  const manifest = JSON.parse(await bytes(path));
  for (const item of manifest.files) {
    await artifact({ path: item.archive, sha256: item.sha256 });
    if (item.source !== 'scripts/eden-occlusion-production.mjs') await artifact({ path: item.source, sha256: item.sha256 });
  }
  collectionArchives.push({ path, sha256: await digest(path), ...manifest });
}

assert.equal(native.baselineCommit, baseline); assert.equal(production.baselineCommit, baseline);
assert.equal(native.baselineTrackedFiles, 2169); assert.equal(native.protectedTrackedFiles, 2166);
assert.equal(native.patch.changedMethod, '_noveria'); assert.equal(native.patch.registeredMeshes, 4);
for (const key of ['originalDimensionsRetained', 'exactScopedReplacementVerified', 'geometryLayoutDataPreserved', 'combatAndSaveModulesPreserved'])
  assert.equal(native.patch[key], true);
assert.deepEqual([...native.permittedChangedTrackedFiles].sort(), ['README.md', 'docs/IMPLEMENTATION_STATUS.md', 'src/world.js']);
await sources(native.sourceHashes); await artifact(native.protectedFileProof);
const protectedProof = JSON.parse(await bytes(native.protectedFileProof.path));
assert.equal(protectedProof.baselineCommit, baseline); assert.equal(protectedProof.files.length, 2166);
await artifacts(protectedProof.files); await artifacts(native.protectedCatalogueAndWorkbook);
assert.equal(native.patch.currentWorldSha256, await digest('src/world.js'));

// These bytes belong to the first accepted commit. Its old source hashes must
// not be tested against the later renderer containing this four-mesh fix.
await artifact(native.previousEdenEvidence);
const previousEden = JSON.parse(await bytes(native.previousEdenEvidence.path)); assert.equal(previousEden.passed, true);
const baselineReport = execFileSync('git', ['show', `${baseline}:${native.previousEdenEvidence.path}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
assert.equal(hash(baselineReport), native.previousEdenEvidence.sha256);
assert.equal(previousEden.aggregationTool.sha256, await digest('scripts/summarize-eden-immersion.mjs'));
assert.equal(previousEden.validation.nodeTests, 801);
assert.equal(previousEden.proofs['eden-immersion-world-report'].sha256, await digest('docs/qa/eden-immersion-world-report.json'));

await sources(unit.sourceHashes); await sources(build.sourceHashes); assert.deepEqual(unit.sourceHashes, build.sourceHashes);
assert.equal(Object.keys(unit.sourceHashes).length, 216); assert.equal(unit.tests, 802); assert.equal(unit.passedTests, 802);
assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0); assert.equal(unit.exitCode, 0);
assert.equal(build.exitCode, 0); assert.equal(build.modules, 83); assert.equal(build.pngFiles, 31);
assert.equal(build.compiledJavaScriptBundles, 9); assert.deepEqual(build.changedSources, []);
await artifacts([unit.output, build.output]); await artifacts(build.artifacts);
const unitText = (await bytes(unit.output.path)).toString();
for (const [name, value] of [['tests', 802], ['pass', 802], ['fail', 0], ['skipped', 0]])
  assert.match(unitText, new RegExp(`^(?:#|ℹ) ${name} ${value}$`, 'm'));
assert.match((await bytes(build.output.path)).toString(), /83 modules transformed/);

assert.equal(production.buildKind, 'production-dist'); assert.equal(production.strictFullRunPassed, false);
assert.equal(production.newFullRunPerformedForSummary, false);
const runtimeSources = run => Object.fromEntries(Object.entries(run.sources).filter(([path]) => !path.startsWith('scripts/')));
for (const run of executions) {
  assert.equal(run.baselineCommit, baseline); assert.equal(run.buildKind, 'production-dist');
  assert.deepEqual(runtimeSources(run), runtimeSources(mapRun)); await sources(runtimeSources(run));
  assert.deepEqual(run.buildFiles, mapRun.buildFiles);
  clean(run, ['sourceRequests', 'evidenceErrors', 'errors', 'failedRequests']);
}
assert.equal(mapRun.sourceAndDistFrozen, true); await sources(mapRun.sources);
assert.deepEqual(production.buildFiles, mapRun.buildFiles);
await sources(runtimeSources(production));
const dist = Object.entries(production.buildFiles).map(([path, item]) => ({ path: `dist/${path}`, ...item }));
await artifacts(dist); assert.deepEqual(paths(dist), paths(build.artifacts));
for (const item of dist) assert.equal(item.sha256, build.artifacts.find(file => file.path === item.path).sha256);
for (const item of production.servedFiles) {
  assert.equal(item.status, 200); assert.equal(item.matchesDist, true);
  assert.equal(item.sha256, await digest(`dist/${item.path}`));
}
assert.ok(production.servedFiles.some(item => item.path === 'index.html'));
assert.ok(production.browserResponses.some(item => item.path === 'assets/enemy-rachni-combat.png' && item.status === 200));
for (const run of executions) assert.deepEqual(run.noHarness, { own: false, type: 'undefined', viteClient: false });
const consoleObservations = executions.flatMap(run => run.consoleObservations);
for (const item of consoleObservations) {
  assert.match(item.text, /Failed to load resource/); assert.equal(new URL(item.location.url).pathname, '/favicon.ico');
}
assert.equal(production.screenshots.length, 6); assert.equal(production.exports.length, 2);
assert.equal(production.fixtures.length, 2); assert.equal(production.nativeOrders.length, 1);
const expectedCaptures = [...encounterRun.screenshots.filter(item => !item.path.endsWith('-failure.png')), ...mapRun.screenshots];
assert.equal(expectedCaptures.length, 6); assert.deepEqual(paths(production.screenshots), paths(expectedCaptures));
for (const capture of production.screenshots) assert.equal(capture.sha256, expectedCaptures.find(item => item.path === capture.path).sha256);
assert.deepEqual(production.exports, encounterRun.exports); assert.deepEqual(production.nativeOrders, encounterRun.nativeOrders);
await artifacts(production.screenshots); await artifacts(production.exports); await artifacts(production.fixtures);
assert.equal(production.encounter.zone, 'noveria');
assert.deepEqual(production.encounter, encounterRun.encounter);
assert.deepEqual(production.encounter.actualEnemyIDs, ['rachni-0', 'rachni-1', 'rachni-2']);
assert.deepEqual(production.encounter.expectedEnemyIDs, production.encounter.actualEnemyIDs);
assert.equal(production.encounter.actualNaturalATBShot, true); assert.equal(production.encounter.exactPrecombatRestore, true);
assert.equal(production.encounter.noVictoryRewardClaimed, true);
assert.deepEqual(production.encounter.omittedStateFields, ['playedSeconds']);
const downloaded = [];
for (const item of production.exports) {
  const saved = decodeSave((await bytes(item.path)).toString()); assert.ok(saved); delete saved.playedSeconds; downloaded.push(saved);
}
assert.deepEqual(downloaded[0], downloaded[1]);
const inheritedRachniSave = decodeSave((await bytes('docs/qa/eden-immersion-production-rachni-precombat-save.json')).toString());
assert.ok(inheritedRachniSave); delete inheritedRachniSave.playedSeconds; assert.deepEqual(downloaded[0], inheritedRachniSave);
const shot = production.nativeOrders[0]; assert.equal(shot.actionId, 'shoot'); assert.ok(shot.atbBefore >= 99.999 && shot.atbAfter < 20);

assert.equal(production.mapViews.length, 2);
assert.deepEqual(production.mapViews, mapRun.mapViews); assert.deepEqual(production.mapListEnd, mapRun.mapListEnd);
for (const view of production.mapViews) {
  assert.equal(view.board.fullyVisible, true); assert.equal(view.marker7.fullyVisible, true);
  assert.equal(view.board.toasts, 0); assert.ok(view.board.documentWidth <= view.board.viewport.width);
}
const mobile = production.mapViews.find(view => view.board.viewport.width === 390); assert.ok(mobile);
assert.equal(production.mapListEnd.after.fullyVisible, true);
assert.ok(production.mapListEnd.listScroll.top > 0);
assert.ok(production.mapListEnd.listScroll.height - production.mapListEnd.listScroll.client - production.mapListEnd.listScroll.top < 2);

assert.equal(visual.reviewComplete, true); assert.deepEqual(visual.blockingFindings, []);
await artifacts(visual.inputReports); await artifacts(visual.imagesReviewed);
assert.equal(visual.imagesReviewed.length, 6); assert.ok(visual.imagesReviewed.every(image => image.actuallyOpened));
assert.deepEqual(paths(visual.imagesReviewed), paths(production.screenshots));
for (const item of visual.imagesReviewed) assert.equal(item.sha256, production.screenshots.find(file => file.path === item.path).sha256);
assert.ok(visual.inputReports.some(item => item.path === publicPath && item.sha256 === proofs[publicPath].sha256));

const report = {
  passed: true, generatedAt: new Date().toISOString(), baselineCommit: baseline,
  scope: 'Four existing Noveria overhead structural/light meshes now yield to combat view and return in exploration. The existing combat-occluder mechanism handles visibility, while static merging preserves these meshes individually. Public production evidence also inspects the unchanged Eden map after real desktop/mobile scrolling.',
  additions: { combatOccluderMeshesRegistered: 4, newPNG: 0, newBodyPoses: 0, newEquipment: 0,
    newEncounterMechanics: 0, changedLayoutCoordinates: 0, changedWorkbookStatuses: 0 },
  patch: native.patch,
  validation: { nodeTests: unit.tests, addedMeaningfulTests: 1, stableSources: Object.keys(unit.sourceHashes).length,
    compiledModules: build.modules, compiledPNG: build.pngFiles, compiledJavaScriptBundles: build.compiledJavaScriptBundles,
    protectedBaselineFiles: protectedProof.files.length, publicCapturesActuallyOpened: visual.imagesReviewed.length,
    realDownloadedSavesCompared: production.exports.length, naturalATBShots: production.nativeOrders.length,
    publicCollectionExecutions: executions.length, acceptedEvidenceExecutions: 2,
    publicBrowserLaunches: collectedLaunches, completeBrowserShutdowns: collectedShutdowns,
    desktopMobileMapBoardViews: production.mapViews.length, nativeMobileListBottomReached: true,
    newTestBuildOrBrowserRunForSummary: false },
  previousEdenEvidence: { ...native.previousEdenEvidence, acceptedCommit: baseline,
    qualification: 'Byte-preserved historical evidence for the accepted Eden lot, including its inherited Noveria occlusion reserve. Its801-test and old renderer hashes remain phase-bound; current802-test and current production evidence belong to this subsequent patch.' },
  publicEvidence: { report: proofs[publicPath], proofKind: production.proofKind, strictFullRunPassed: false,
    newFullRunPerformedForSummary: false, collectionExecutions: executions.length, acceptedEvidenceExecutions: 2,
    rawReports: production.rawReports, executedDrivers: production.executedDrivers, collectionTool: production.collectionTool,
    collectorFailures: executions.filter(run => !run.passed).map(run => ({ failure: run.failure, completedEncounter: !!run.encounter?.exactPrecombatRestore })),
    collectionArchives, fixtureOrigins: production.fixtures,
    encounter: production.encounter, nativeOrders: production.nativeOrders, mapViews: production.mapViews,
    mapListEnd: production.mapListEnd, fullConsoleClean: consoleObservations.length === 0,
    consoleObservations, resourceWarnings: executions.flatMap(run => run.resourceWarnings),
    limitations: production.limitations },
  visualEvidence: { report: proofs['docs/qa/eden-occlusion-visual-review.json'], observations: visual.observations,
    historicalComparisons: visual.historicalComparisons, residualFindings: visual.residualFindings, limitations: visual.limitations },
  limitations: [
    'This targets the overhead Noveria occluders only. It does not replay the full Eden route or add new enemy poses, equipment, story gates, map geometry or workbook statuses.',
    'The three-rachni encounter uses the unchanged real public export from the previous explicitly prepared campaign fixture. One natural-ATB shot and its exact precombat restoration do not claim a completed victory or reward.',
    'Six captures are actually opened; their visual conclusions apply to those views. Complete original-game geography, likeness, animation and1:1 fidelity remain unvalidated.',
    'The public proof combines encounter evidence from an initially interrupted collector with a later positive map-only execution. Both negative collection traces are preserved. Three executions collected evidence; two contribute accepted captures. No fresh complete all-in-one public run is claimed.',
    'The overhead beam obstruction is corrected in the reviewed battle views, but a foreground vertical pillar still partially covers the central rachni. Complete visibility of all three enemy silhouettes is not claimed.',
    'The desktop/mobile map views use real scrolling and natural toast expiry. This is evidence of visibility after those actions, not a claim that CSS, the initial opening position or all mobile gameplay were changed or certified.',
    'Historical Eden QA remains byte-preserved with its original limitations. No old renderer digest is reinterpreted as a current-source result.',
    'Software WebGL and a390px Chromium viewport do not establish hardware FPS, physical-phone performance, controller behavior or a native Windows game launch.',
    'The local production build is verified. Vercel project configuration is not evidence of a deployed playable application.',
  ],
  aggregationTool: { path: 'scripts/summarize-eden-occlusion.mjs', sha256: await digest('scripts/summarize-eden-occlusion.mjs') },
  verifiedFileCount: checked.size, proofs,
};
await writeFile(new URL('docs/qa/eden-occlusion-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofs: Object.keys(proofs).length, checkedFiles: checked.size,
  nodeTests: unit.tests, occluders: 4, reviewedCaptures: 6, comparedExports: 2 }));

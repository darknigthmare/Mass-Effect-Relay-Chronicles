import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { decodeSave } from '../src/state.js';

// Derive an explicit composite from existing raw executions. This never launches
// Chromium, repeats combat, changes a raw report or reclassifies a failed run.
const root = new URL('../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = path => readFile(new URL(path, root));
const refs = [
  'docs/qa/eden-occlusion-production-report.json',
  'docs/qa/eden-occlusion-map-production-report.json',
  'docs/qa/eden-occlusion-map-production-final-report.json',
];
const runs = await Promise.all(refs.map(async path => JSON.parse(await bytes(path))));
const [native, debug, map] = runs;
const artifact = async path => { const raw = await bytes(path); return { path, bytes: raw.length, sha256: sha(raw) }; };
const verify = async item => { const actual = await artifact(item.path); assert.equal(actual.sha256, item.sha256, item.path); if (item.bytes !== undefined) assert.equal(actual.bytes, item.bytes); };
assert.equal(native.passed, false); assert.equal(debug.passed, false); assert.equal(map.passed, true);
assert.match(native.failure, /map-desktop/); assert.match(debug.failure, /map-desktop/);
assert.equal(native.encounter.actualNaturalATBShot, true); assert.equal(native.encounter.exactPrecombatRestore, true);
assert.deepEqual(native.encounter.actualEnemyIDs, ['rachni-0', 'rachni-1', 'rachni-2']);
assert.deepEqual(native.encounter.party, ['shepard', 'kaidan', 'ashley']);
assert.equal(native.nativeOrders.length, 1); assert.equal(native.exports.length, 2);
assert.equal(map.mapViews.length, 2); assert.equal(map.screenshots.length, 3); assert.equal(map.sourceAndDistFrozen, true);
for (const view of map.mapViews) { assert.equal(view.board.fullyVisible, true); assert.equal(view.marker7.fullyVisible, true); assert.equal(view.board.toasts, 0); }
assert.equal(map.mapListEnd.after.fullyVisible, true);
assert.ok(map.mapListEnd.listScroll.top > 0);
assert.ok(map.mapListEnd.listScroll.height - map.mapListEnd.listScroll.client - map.mapListEnd.listScroll.top < 2);

const driver = 'scripts/eden-occlusion-production.mjs';
const runtime = Object.fromEntries(Object.entries(map.sources).filter(([path]) => path !== driver));
assert.equal(Object.keys(runtime).length, 16);
for (const run of runs) {
  assert.equal(run.baselineCommit, '641fa6309d7eb04a28f981b8bcdd34210ffdd200');
  assert.deepEqual(Object.fromEntries(Object.entries(run.sources).filter(([path]) => path !== driver)), runtime);
  assert.deepEqual(run.buildFiles, map.buildFiles);
  assert.equal(run.profile.launches, 1); assert.equal(run.profile.completeShutdowns, 1);
  for (const key of ['sourceRequests', 'evidenceErrors', 'errors', 'failedRequests']) assert.deepEqual(run[key], []);
}
for (const [path, sha256] of Object.entries(runtime)) await verify({ path, sha256 });
for (const [path, item] of Object.entries(map.buildFiles)) await verify({ path: `dist/${path}`, ...item });
const sourceDirectory = 'docs/qa/eden-occlusion-map-production-final-source';
await mkdir(new URL(`${sourceDirectory}/scripts/`, root), { recursive: true });
const driverBytes = await bytes(driver); assert.equal(sha(driverBytes), map.sources[driver]);
await writeFile(new URL(`${sourceDirectory}/${driver}`, root), driverBytes);
const driverPaths = [
  'docs/qa/eden-occlusion-production-attempt1/scripts/eden-occlusion-production.mjs',
  'docs/qa/eden-occlusion-map-production-attempt1/scripts/eden-occlusion-production.mjs',
  `${sourceDirectory}/${driver}`,
];
const executedDrivers = [];
for (let index = 0; index < runs.length; index++) {
  const item = await artifact(driverPaths[index]); assert.equal(item.sha256, runs[index].sources[driver]);
  executedDrivers.push({ execution: index + 1, rawReport: refs[index], ...item });
}
const screenshots = [...native.screenshots.filter(item => item.label !== 'failure'), ...map.screenshots];
assert.equal(screenshots.length, 6); for (const item of screenshots) await verify(item);
for (const item of native.exports) await verify(item);
const states = await Promise.all(native.exports.map(async item => {
  const state = decodeSave((await bytes(item.path)).toString()); assert.ok(state); delete state.playedSeconds; return state;
}));
assert.deepEqual(states[0], states[1]);
const inherited = decodeSave((await bytes('docs/qa/eden-immersion-production-rachni-precombat-save.json')).toString());
assert.ok(inherited); delete inherited.playedSeconds; assert.deepEqual(states[0], inherited);
const fixtures = [native.fixtures.find(item => item.zone === 'noveria'), map.fixtures.find(item => item.zone === 'eden-prime')];
for (const item of fixtures) { assert.equal(item.importedViaPublicChooser, true); await verify(item); }
const rawReports = await Promise.all(refs.map(async (path, index) => ({ ...await artifact(path), passed: runs[index].passed,
  role: ['Accepted native encounter sub-result from a globally failed map-assertion attempt', 'Preserved diagnostic map failure from incorrect body clipping measurement', 'Accepted positive map-only completion after correcting the driver observer'][index] })));
const snapshots = await Promise.all([
  'docs/qa/eden-occlusion-production-attempt1/snapshot-manifest.json',
  'docs/qa/eden-occlusion-map-production-attempt1/snapshot-manifest.json',
].map(artifact));
const summary = {
  schemaVersion: 1, passed: true, generatedAt: new Date().toISOString(), proofKind: 'explicit-composite-public-proof',
  composite: true, strictFullRunPassed: false, executionCount: 3, acceptedEvidenceExecutions: 2,
  newFullRunPerformedForSummary: false, baselineCommit: map.baselineCommit, sourceHead: map.sourceHead,
  buildKind: 'production-dist', url: map.url, sourceAndDistFrozen: true,
  scope: 'Collection-only composite of source/dist-identical public executions. The first raw run passes its Noveria native encounter/shot/downloaded restore then fails a map observer assertion. The second map-only diagnostic repeats that observer error. The third map-only run corrects the zero-height body clipping calculation and passes desktop/mobile scrolling. Six accepted frames come from the first and third executions. No failed raw report is rewritten and no complete fresh run is claimed.',
  rawReports, executedDrivers, snapshots,
  collectionTool: await artifact('scripts/collect-eden-occlusion-production.mjs'),
  sources: runtime, runtimeSourceHashes: runtime, buildFiles: map.buildFiles,
  servedFiles: native.servedFiles,
  browserResponses: [...native.browserResponses, ...map.browserResponses],
  fixtures, exports: native.exports, encounter: native.encounter, nativeOrders: native.nativeOrders,
  reloads: native.reloads, screenshots, mapViews: map.mapViews, mapListEnd: map.mapListEnd,
  noHarness: native.noHarness,
  profile: { launches: 3, completeShutdowns: 3, executionCount: 3, acceptedEvidenceExecutions: 2,
    rawProfiles: runs.map((run, index) => ({ execution: index + 1, ...run.profile })) },
  tools: map.tools, checks: [...native.checks, ...map.checks],
  sourceRequests: [], evidenceErrors: [], errors: [], failedRequests: [],
  consoleObservations: runs.flatMap(run => run.consoleObservations), resourceWarnings: runs.flatMap(run => run.resourceWarnings),
  collectionFailures: refs.slice(0, 2).map((path, index) => ({ path, failure: runs[index].failure,
    qualification: 'Preserved actual failure of the driver clipping observer; no game CSS or geometry changed to resolve it.' })),
  residualFindings: [{ id: 'noveria-front-pillar', severity: 'visual-reserve',
    text: 'Overhead spans disappear and Ashley is fully visible. The centre rachni remains partly occluded by a foreground vertical pillar in both battle frames; three fully unobscured enemy bodies are not certified.',
    screenshots: screenshots.filter(item => /rachni-(?:public-battle|native-shot)$/.test(item.label)).map(item => item.path) }],
  limitations: [...native.limitations,
    'This is an explicit composite of two useful executions among three attempts, not a passing full uninterrupted browser run. Original failed reports and driver versions are preserved.',
    'The central rachni retains partial vertical-pillar occlusion. Only the targeted overhead-beam/Ashley obstruction is resolved; no complete visibility of all three rachni bodies is claimed.'],
};
await writeFile(new URL('docs/qa/eden-occlusion-production-summary.json', root), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofKind: summary.proofKind, rawRuns: 3, usefulRuns: 2,
  runtimeSources: Object.keys(runtime).length, screenshots: screenshots.length, exports: native.exports.length, nativeShots: native.nativeOrders.length }));

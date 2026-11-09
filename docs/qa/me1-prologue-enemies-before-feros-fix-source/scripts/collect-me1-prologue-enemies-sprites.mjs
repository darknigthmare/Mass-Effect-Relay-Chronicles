import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';

// Collection only. No browser/test/build is run and no raw proof is rewritten.
const root = new URL('../', import.meta.url), output = 'docs/qa/me1-prologue-enemies-sprites-summary.json';
try { await access(new URL(output, root)); throw Error('Existing collection must be preserved.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const bytes = path => readFile(new URL(path, root)), hash = b => createHash('sha256').update(b).digest('hex');
const read = async path => { const data = await bytes(path); return { path, sha256: hash(data), bytes: data.length, value: JSON.parse(data) }; };
const first = await read('docs/qa/me1-prologue-enemies-sprites-report.json');
const events = await read('docs/qa/me1-prologue-enemies-sprites-events-report.json');
assert.equal(first.value.passed, false); assert.match(first.value.failure, /r\.actionOK && r\.liveDamageOK/);
assert.equal(first.value.cases.length, 12); assert.ok(first.value.cases.every(row => row.passed && row.battleUnchanged && row.saveUnchanged));
assert.equal(events.value.passed, true); assert.equal(events.value.case, 'events'); assert.equal(events.value.cases.length, 0);
const acceptedCaptures = first.value.captureArtifacts.filter(item => !item.path.endsWith('-failure.png'));
assert.equal(acceptedCaptures.length, 4); assert.equal(events.value.captureArtifacts.length, 0);
assert.equal(events.value.nativeEvents.length, 4); assert.equal(events.value.scopeClosures.length, 18);
assert.equal(events.value.narrativeClosures.length, 3); assert.equal(events.value.regressions.length, 12);
assert.ok(events.value.nativeEvents.every(row => row.actionOK && row.liveDamageOK && row.koOK && row.powersUnchanged && row.rendererPreservesBattle));
assert.ok(events.value.scopeClosures.every(row => row.frame === null && !row.usesNewAtlas));
assert.ok(events.value.narrativeClosures.every(row => row.frame === null && !row.usesNewAtlas && row.stateUnchanged));
const manifestPath = 'docs/qa/me1-prologue-enemies-sprites-attempt1/snapshot-manifest.json';
const manifest = await read(manifestPath);
for (const item of manifest.value.files) assert.equal(hash(await bytes(item.snapshot)), item.sha256);
const oldDriver = manifest.value.files.find(item => item.original === 'scripts/me1-prologue-enemies-sprites.mjs');
assert.equal(oldDriver.sha256, first.value.sourceHashes[oldDriver.original]);
for (const [path, expected] of Object.entries(first.value.sourceHashes)) {
  if (path === oldDriver.original) continue;
  assert.equal(events.value.sourceHashes[path], expected, `Runtime/art changed between collections:${path}`);
  assert.equal(hash(await bytes(path)), expected, `Runtime/art changed:${path}`);
}
for (const [path, expected] of Object.entries(events.value.sourceHashes)) assert.equal(hash(await bytes(path)), expected);
for (const item of acceptedCaptures) assert.equal(hash(await bytes(item.path)), item.sha256);
for (const raw of [first.value, events.value]) { assert.deepEqual(raw.errors, []); assert.deepEqual(raw.failedRequests, []); }
const summary = {
  passed: true, generatedAt: new Date().toISOString(), proofKind: 'explicit-composite-detached-renderer-proof', composite: true,
  executionCount: 2, strictFullRunPassed: false, newBrowserRunPerformedForSummary: false,
  sourceHead: events.value.sourceHead, sourceHashes: events.value.sourceHashes, buildKind: events.value.buildKind,
  url: events.value.url, viewport: events.value.viewport,
  scope: 'Twelve successful held-pose observations from the first collector are combined with four native action sequences, eighteen foreign-context refusals, three Jenkins narrative closures and twelve old-family aim checks from the later native-only collector. The initial raw run remains negative because its asari-throw test attempted to shoot using the natively staggered Shepard. No uninterrupted full passing run is claimed.',
  cases: first.value.cases, captureArtifacts: acceptedCaptures, servedAssets: events.value.servedAssets,
  nativeEvents: events.value.nativeEvents, scopeClosures: events.value.scopeClosures,
  narrativeClosures: events.value.narrativeClosures, regressions: events.value.regressions,
  fixturePreserved: events.value.fixturePreserved, errors: [], failedRequests: [],
  resourceWarnings: [...first.value.resourceWarnings, ...events.value.resourceWarnings],
  rawReports: [first, events].map(({ value, ...item }) => ({ ...item, passed: value.passed })),
  executedDrivers: [{ path: oldDriver.snapshot, sha256: oldDriver.sha256 }, { path: oldDriver.original, sha256: events.value.sourceHashes[oldDriver.original] }],
  initialAttemptArchive: { path: manifestPath, sha256: manifest.sha256 },
  collectorFailure: { report: first.path, failure: first.value.failure, correctedTestInput: 'The unaffected Jenkins supplies the native damage/KO witness after asari throw; the battle engine and artwork remain unchanged.' },
  limitations: [...events.value.limitations,
    'The initial collector completed twelve poses but stopped at a native-test-input assertion; the second run collects native cases only. The composite preserves both raw reports and their actual executed drivers.',
    'The four accepted images still require actual visual review. This detached evidence does not replace the separate public development and final production journeys.'],
  collectionTool: { path: 'scripts/collect-me1-prologue-enemies-sprites.mjs', sha256: hash(await bytes('scripts/collect-me1-prologue-enemies-sprites.mjs')) },
};
await writeFile(new URL(output, root), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, poses: 12, captures: 4, nativeEvents: 4, scopeClosures: 18, narrativeClosures: 3, regressions: 12, executions: 2, strictFullRunPassed: false }));

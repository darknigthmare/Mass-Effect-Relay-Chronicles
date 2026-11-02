import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFile(new URL(path, root));
const digest = async path => hash(await read(path));
const rawPath = 'docs/qa/me1-enemy-poses-world-attempt-2/report.json';
const archivedRunner = 'docs/qa/me1-enemy-poses-world-attempt-2/runner.mjs';
const runnerPath = 'scripts/me1-enemy-poses-world-browser.mjs';
const completionPath = 'docs/qa/me1-enemy-poses-world-completion-report.json';
const summaryPath = 'scripts/summarize-me1-enemy-poses-world.mjs';
const raw = JSON.parse(await read(rawPath)), completion = JSON.parse(await read(completionPath));
assert.equal(raw.passed, false); assert.equal(raw.cases.length, 16);
assert.ok(raw.cases.every(entry => entry.passed && entry.battleUnchanged && entry.saveUnchanged));
assert.ok(raw.nativeEvents.some(entry => entry.key === 'geth-sniper' && entry.actionOK && !entry.damageOK));
assert.match(raw.failure, /AssertionError/);
assert.equal(completion.passed, true); assert.equal(completion.phase, 'completion'); assert.equal(completion.cases.length, 0);
assert.equal(completion.nativeEvents.length, 4); assert.ok(completion.nativeEvents.every(entry => entry.actionOK && entry.damageOK
  && entry.hpAfterDamage === 0 && entry.powersUnchanged && entry.rendererPreservesNativeBattle && entry.damageActorId === 'ashley'));
assert.equal(completion.scopeClosures.length, 6); assert.ok(completion.scopeClosures.every(entry => entry.frame === null && entry.sourceIsBase));
assert.equal(completion.regressions.length, 3); assert.ok(completion.regressions.every(entry => entry.passed));
assert.equal(completion.joker.length, 2); assert.equal(completion.joker[0].actualIdleIntegration, true);
assert.equal(completion.joker[1].heldDrawingOnly, true);
assert.equal(completion.applicationPreserved, true); assert.deepEqual(completion.errors, []);
assert.deepEqual(completion.assetErrors, []); assert.deepEqual(completion.failedRequests, []);

for (const [path, expected] of Object.entries(raw.sourceHashes)) {
  const actualPath = path === runnerPath ? archivedRunner : path;
  assert.equal(await digest(actualPath), expected, `Initial pose source changed: ${actualPath}`);
  if (path !== runnerPath) assert.equal(completion.sourceHashes[path], expected, `Runtime differs between phases: ${path}`);
}
for (const [path, expected] of Object.entries(completion.sourceHashes)) assert.equal(await digest(path), expected, `Completion source changed: ${path}`);
const acceptedPaths = new Set(raw.cases.map(entry => entry.screenshot));
const poseCaptures = raw.captureArtifacts.filter(entry => acceptedPaths.has(entry.path));
assert.equal(poseCaptures.length, 8); assert.equal(completion.captureArtifacts.length, 5);
const captures = [...poseCaptures, ...completion.captureArtifacts];
assert.equal(new Set(captures.map(entry => entry.path)).size, 13);
for (const item of captures) assert.equal(await digest(item.path), item.sha256, `Capture changed: ${item.path}`);
for (const item of completion.servedAssets) {
  assert.equal(item.status, 200); assert.equal(await digest(item.path), item.sha256);
}
const proofs = [
  { path: rawPath, sha256: await digest(rawPath), kind: 'actual-sixteen-pose-observations-from-failed-later-native-fixture',
    runner: { path: archivedRunner, sha256: await digest(archivedRunner) }, acceptedCaptures: poseCaptures.map(entry => entry.path) },
  { path: completionPath, sha256: await digest(completionPath), kind: 'actual-targeted-native-scope-regression-and-pilot-completion',
    runner: { path: runnerPath, sha256: await digest(runnerPath) }, acceptedCaptures: completion.captureArtifacts.map(entry => entry.path) },
];
const report = { ...completion, passed: true, at: new Date().toISOString(),
  proofKind: 'explicit-composite-renderer-proof', phase: 'composite', strictFullRunPassed: false, newFullRunPerformedForSummary: false,
  scope: 'Explicit composite of two actual development renderer collections on identical runtime, metadata and PNG sources. The first collected all16 enemy key poses successfully before a later native fixture incorrectly asked sabotaged Shepard to fire; that strict attempt remains failed and archived. The targeted completion ran no enemy pose matrix: it exercised four corrected native action/KO sequences using a separate ready ally Ashley, six negative scopes, three retained Shepard/companion regressions and two fixed Joker drawings. Idle is the actual Normandy pilot integration; pilot is a separately requested held drawing. No new complete collection or clean original run is claimed. These are detached development fixtures, not the public campaign journey or original-game fidelity certification.',
  sourceHashes: { ...completion.sourceHashes, [archivedRunner]: await digest(archivedRunner), [summaryPath]: await digest(summaryPath) },
  cases: raw.cases, captureArtifacts: captures, proofs,
  phaseMethods: { poseCasesObserved: 16, poseMatrixRepeatedByCompletion: false,
    identicalRuntimeMetadataAndPNGSourceHashes: true,
    completionCasesObserved: { nativeEvents: 4, negativeScopes: 6, retainedSquadRenders: 3, fixedPilotDrawings: 2 },
    nativeKOFixture: 'Both allies begin ready in detached data. The enemy targets Shepard. Ashley performs the controlled KO witness with test attack5000 against the target at1HP; Sabotage is neither cleared nor bypassed on Shepard.',
    completionReportScope: 'The completion input retains the full script description, but phase=completion and cases=[] identify the targeted invocation actually executed.' },
  strictAttempt: { path: rawPath, passed: false, failure: raw.failure, browserErrors: raw.errors,
    failedRequests: raw.failedRequests, nativeEvents: raw.nativeEvents, rawFailurePreserved: true },
  applicationPreservationScope: 'The targeted completion compares the real title application state and localStorage bytes before/after. Each accepted original enemy-pose observation independently compares detached battle/save data; no final storage comparison from the interrupted initial browser is claimed.',
  limitations: ['All18 drawings are fixed prototype poses, with incomplete original likeness, equipment silhouettes, animation cycles and extra directions.',
    'The sixteen enemy states are held explicitly in detached fixtures. The four native action/KO sequences supplement them without turning the held matrix into ordinary gameplay.',
    'Joker uses idle at his authored ME1 Normandy pilot station. The pilot drawing is measured and shown in a separate forced preview only, with no new animation or dialogue state.',
    'Existing campaign rules, save schemas, recruitment, inventory and enemy statistical profiles are not modified by these render fixtures.'] };
await writeFile(new URL('docs/qa/me1-enemy-poses-world-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, proofKind: report.proofKind, enemyCases: report.cases.length,
  nativeEvents: report.nativeEvents.length, captures: report.captureArtifacts.length, strictFullRunPassed: false }));

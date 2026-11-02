import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFile(new URL(path, root)), digest = async path => hash(await read(path));
const mainPath = 'docs/qa/me1-enemy-poses-world-report.json';
const inputPath = 'docs/qa/me1-enemy-poses-world-visibility-report.json';
const toolPath = 'scripts/add-me1-enemy-visibility-proof.mjs';
const base = JSON.parse(await read(mainPath)), visible = JSON.parse(await read(inputPath));
assert.equal(base.passed, true); assert.equal(base.proofKind, 'explicit-composite-renderer-proof');
assert.equal(base.cases.length, 16); assert.equal(base.nativeEvents.length, 4);
assert.equal(visible.passed, true); assert.deepEqual(visible.actualZone, { id: 'eden-prime', theme: 'eden' });
assert.deepEqual(visible.fixtureArena, { zoneId: 'eden-prime', x: 0, z: 8 });
assert.equal(visible.observations.length, 16); assert.equal(visible.captureArtifacts.length, 8);
assert.deepEqual(visible.errors, []); assert.deepEqual(visible.failedRequests, []);
for (const report of [base, visible]) for (const [path, expected] of Object.entries(report.sourceHashes))
  assert.equal(await digest(path), expected, `Source changed: ${path}`);
for (const [path, expected] of Object.entries(visible.sourceHashes)) if (base.sourceHashes[path])
  assert.equal(expected, base.sourceHashes[path], `Visual supplement used different runtime/art: ${path}`);
const originalCaptures = base.captureArtifacts.filter(entry => !entry.path.startsWith('docs/screenshots/me1-enemy-poses-visible-'));
assert.equal(originalCaptures.length, 13);
const captures = [...originalCaptures, ...visible.captureArtifacts];
assert.equal(new Set(captures.map(entry => entry.path)).size, 21);
for (const item of captures) assert.equal(await digest(item.path), item.sha256, `Capture changed: ${item.path}`);
const cases = base.cases.map(entry => {
  const match = visible.observations.find(item => item.key === entry.key && item.pose === entry.pose);
  assert.ok(match); assert.equal(match.frameId, entry.frameId); assert.deepEqual(match.arena, { x: 0, z: 8 });
  return { ...entry, visibleScreenshot: match.screenshot };
});
const proof = { path: inputPath, sha256: await digest(inputPath), kind: 'targeted-open-Eden-visual-supplement',
  runner: { path: 'scripts/me1-enemy-poses-visibility-browser.mjs', sha256: await digest('scripts/me1-enemy-poses-visibility-browser.mjs') },
  acceptedCaptures: visible.captureArtifacts.map(entry => entry.path) };
const scopeBeforeVisibilitySupplement = base.scopeBeforeVisibilitySupplement || base.scope;
const report = { ...base, at: new Date().toISOString(), scopeBeforeVisibilitySupplement,
  scope: `${scopeBeforeVisibilitySupplement} A third, separately sourced visual-only supplement adds eight captures of the sixteen held poses in the actual Eden Prime landscape at declared detached arena z8, because Normandy architecture partly occluded the lower-right enemy in the initial images. Native actions, saves and retained-squad checks were not replayed for this visual supplement.`,
  sourceHashes: { ...base.sourceHashes, ...visible.sourceHashes, [toolPath]: await digest(toolPath) }, cases,
  captureArtifacts: captures, proofs: [...base.proofs.filter(item => item.kind !== proof.kind), proof],
  visibilitySupplement: { path: inputPath, sha256: proof.sha256, actualZone: visible.actualZone, fixtureArena: visible.fixtureArena,
    heldPoseObservations: 16, additionalCaptures: 8, nativeSequencesReplayed: 0,
    qualification: 'The initial eight Normandy enemy captures are retained with their actual foreground occlusion. Eight additional Eden captures make the source silhouettes available for independent full-body visual review. Only this isolated visual fixture moves the arena to z8; production layout and enemy placements are unchanged.' },
};
await writeFile(new URL(mainPath, root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, captures: captures.length, inputProofs: report.proofs.length,
  sha256: await digest(mainPath), worldSHA256: report.sourceHashes['src/world.js'] }));

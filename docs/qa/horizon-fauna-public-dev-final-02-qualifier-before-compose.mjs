// Classify the three observed browser favicon requests without changing the raw
// failed run. This verifies existing artifacts; it never starts or replays a game.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeSave } from '../src/state.js';

const prefix = process.argv[2];
assert.match(prefix || '', /^horizon-fauna-public-[a-z0-9-]+$/);
const root = new URL('../', import.meta.url), rawPath = `docs/qa/${prefix}-report.json`;
const output = `docs/qa/${prefix}-qualification.json`;
try { await access(new URL(output, root)); throw Error('Preserve the existing qualification.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rawBytes = await readFile(new URL(rawPath, root)), raw = JSON.parse(rawBytes);
assert.equal(raw.passed, false, 'This qualifier only classifies the preserved failed favicon assertion.');
assert.equal(raw.checks.length, 4); assert.ok(raw.checks.every(check => check.passed === true));
assert.deepEqual(raw.errors, []); assert.deepEqual(raw.failedRequests, []);
assert.equal(raw.consoleErrors.length, 3);
const faviconURL = new URL('favicon.ico', raw.url).href;
assert.ok(raw.consoleErrors.every(error => error.text === 'Failed to load resource: the server responded with a status of 404 (Not Found)'
  && error.location.url === faviconURL));
assert.ok(raw.failure.startsWith('AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:'));
assert.ok(raw.failure.includes(faviconURL));
assert.ok(!raw.failure.includes('Source changed during run:'));
const verifiedSources = [];
for (const [path, expected] of Object.entries(raw.sourceHashes)) {
  const actual = sha(await readFile(new URL(path, root))); assert.equal(actual, expected, path);
  verifiedSources.push({ path, sha256: actual, matchesRawRun: true });
}
const verifiedCaptures = [];
for (const capture of raw.captures) {
  const bytes = await readFile(new URL(capture.path, root));
  assert.equal(sha(bytes), capture.sha256, capture.path); assert.equal(bytes.length, capture.bytes);
  verifiedCaptures.push({ ...capture, matchesRawRun: true });
}
assert.equal(verifiedCaptures.length, 7);
const saves = new Map();
for (const item of raw.exports) {
  const bytes = await readFile(new URL(item.path, root)); assert.equal(sha(bytes), item.sha256, item.path);
  const state = decodeSave(bytes.toString('utf8')); assert.ok(state); saves.set(item.label, state);
}
assert.equal(saves.size, 5);
const accepted = saves.get('accepted'), won = saves.get('pack-won'), completed = saves.get('reported'), unchanged = saves.get('no-repeat'), reloaded = saves.get('reloaded');
const progress = state => state.operations.records['feros-varrens'];
assert.equal(progress(accepted).stage, 1); assert.equal(progress(won).stage, 2);
assert.deepEqual(progress(won).victories, ['pack']); assert.equal(progress(won).pendingBattle, null);
assert.equal(progress(completed).stage, 3);
assert.equal(won.xp, accepted.xp); assert.equal(won.credits, accepted.credits);
assert.equal(completed.xp, won.xp + 70); assert.equal(completed.credits, won.credits + 80);
assert.equal(completed.paragon, won.paragon + 4);
assert.equal(unchanged.xp, completed.xp); assert.equal(unchanged.credits, completed.credits);
assert.deepEqual(unchanged.operations, completed.operations);
const stable = state => { const value = structuredClone(state); delete value.playedSeconds; return value; };
assert.deepEqual(stable(reloaded), stable(unchanged));
assert.equal(raw.fixtures.length, 3); assert.ok(raw.fixtures.every(item => item.importedViaPublicChooser === true));
for (const item of raw.fixtures.slice(1)) {
  const bytes = await readFile(new URL(item.path, root)); assert.equal(sha(bytes), item.sha256);
  const actual = raw.exports.find(entry => entry.path === item.origin.parentExport); assert.ok(actual);
  assert.equal(actual.sha256, item.origin.parentSHA256); assert.equal(item.origin.navigationClaimed, false);
  assert.equal(item.origin.changedFields.length, 1); assert.equal(item.origin.changedFields[0].path, 'position');
  const fixture = decodeSave(bytes.toString('utf8')), original = saves.get(actual.label);
  const omitPosition = state => { const copy = structuredClone(state); delete copy.position; return copy; };
  assert.deepEqual(omitPosition(fixture), omitPosition(original));
}
assert.ok(raw.orders.length > 0); assert.ok(raw.orders.every(order => order.naturallyReadyATB >= 99.999));
if (raw.mode === 'production') assert.deepEqual(raw.sourceRequests, []);
const report = {
  passed: true, at: new Date().toISOString(), mode: raw.mode,
  scope: 'Qualification of the preserved functional public journey and three favicon-only 404 console warnings; the raw report remains passed:false. No game replay or artifact rewriting.',
  command: ['node', 'scripts/horizon-fauna-public-qualify.mjs', prefix],
  qualifierSHA256: sha(await readFile(new URL('scripts/horizon-fauna-public-qualify.mjs', root))),
  rawReport: { path: rawPath, sha256: sha(rawBytes), passed: raw.passed, failure: raw.failure },
  checks: raw.checks, consoleWarnings: raw.consoleErrors.map(error => ({ ...error, classification: 'Browser request for absent favicon.ico; exact URL and 404 text verified, separate from game assets and JavaScript errors.' })),
  javascriptErrors: raw.errors, failedGameRequests: raw.failedRequests,
  sourceHashes: raw.sourceHashes, verifiedSources, sourceFrozenAtQualification: true,
  captures: verifiedCaptures, exports: raw.exports, fixtures: raw.fixtures,
  publicPlayerOrders: raw.orders.length,
  proof: 'Decoded actual public exports independently verify stage 1 → 2 → 3, pending encounter completion, delayed rewards once, and reload equality except playedSeconds. Position-only fixtures independently match their actual parent exports outside position.',
  limitations: raw.limitations,
};
await writeFile(new URL(output, root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, rawPassed: false, output, warnings: 3, checks: 4, captures: verifiedCaptures.length, sources: verifiedSources.length }));

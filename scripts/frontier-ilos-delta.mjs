// Qualify already executed non-Ilos proofs against one reviewed local change.
// This never substitutes an executed report's source hash.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const snapshot = 'docs/qa/frontier-before-ilos-sources/src/world.js';
const before = await readFile(new URL(snapshot, root), 'utf8');
const after = await readFile(new URL('src/world.js', root), 'utf8');
const oldBridge = "    for (const z of [-9, 8]) { this._box(30, 1.3, 3, stone, 0, 13, z); for (const x of [-7, 7]) this._pipe([x, 12, z], [x + .7, 1, z + 1.5], .2, dark); }";
const newBridge = `    for (const z of [-9, 8]) {
      const span = this._box(30, 1.3, 3, stone, 0, 13, z);
      // Retain the field bridge but expose the native enemy sightline in ATB.
      span.userData.keep = true; span.userData.combatOccluder = true;
      span.visible = this.mode !== 'combat'; this.combatOccluders.push(span);
      for (const x of [-7, 7]) this._pipe([x, 12, z], [x + .7, 1, z + 1.5], .2, dark);
    }`;
assert.equal(sha(before), 'd5715efd8177ad71fffe0d107506b2046074a3deb6ac589cf16b14db6d784601');
assert.equal(before.split(oldBridge).length, 2);
assert.equal(before.replace(oldBridge, newBridge), after, 'Only the reviewed bridge metadata/visibility replacement is permitted.');
const split = source => {
  const start = source.indexOf('  _ilos() {'), end = source.indexOf('  _mergeStatic() {', start);
  assert.ok(start > 0 && end > start);
  return { outside: source.slice(0, start) + source.slice(end), method: source.slice(start, end) };
};
assert.equal(split(before).outside, split(after).outside);
const report = { passed: true, at: new Date().toISOString(),
  scope: 'Exact source qualification for successful non-Ilos development checks. Ilos itself requires fresh native and browser checks on the changed source.',
  before: { path: 'src/world.js', snapshot, sha256: sha(before) },
  after: { path: 'src/world.js', sha256: sha(after) },
  sourceHashes: { [snapshot]: sha(before), 'src/world.js': sha(after), 'scripts/frontier-ilos-delta.mjs': sha(await readFile(new URL('scripts/frontier-ilos-delta.mjs', root))) },
  outsideIlosUnchanged: true, geometryAndCollisionsUnchanged: true,
  permittedReplacement: { before: oldBridge, after: newBridge },
  observations: ['The two existing boxes retain dimensions 30×1.3×3, position (0,13,z), materials, and z=-9/8.',
    'All support pipe calls and collider declarations remain byte-identical.',
    'keep prevents static merging; combatOccluders/setMode hide only these spans in ATB and restore them in exploration.',
    'Other methods, including maps, NPCs, Mako movement, portraits, camera, native actions and save paths, are byte-identical.'],
  limitations: ['Earlier captures still identify their actually executed pre-fix source. They are qualified for unchanged zones, never relabelled as new executions.',
    'This audit does not replace the current-source Ilos visibility check or the final production browser journey.'] };
await writeFile(new URL('docs/qa/frontier-ilos-delta-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, before: report.before.sha256, after: report.after.sha256 }));

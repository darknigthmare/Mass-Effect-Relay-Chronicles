import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = process.env.COMPLETION_COMBAT_PREFIX || 'completion-combat-native-01';
assert.match(prefix, /^completion-combat-[a-z0-9-]+$/);
const destination = path.join(root, 'docs/qa', prefix + '.json');
try { await fs.access(destination); throw Error('Choose a fresh COMPLETION_COMBAT_PREFIX; preserve every previous result.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const tests = ['tests/completion-combat.test.js', 'tests/combat.test.js', 'tests/tactical-combat.test.js',
  'tests/equipment-combat.test.js', 'tests/combat-specialists.test.js', 'tests/combat-arsenal-weapons.test.js',
  'tests/combat-summons.test.js', 'tests/combat-support.test.js', 'tests/universe-ammo.test.js', 'tests/campaign-talents.test.js',
  'tests/completion-chronicles-powers.test.js'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHashes = {}, snapshots = [];
async function freeze(filename) {
  if (Object.hasOwn(sourceHashes, filename)) return;
  const bytes = await fs.readFile(path.join(root, filename)); sourceHashes[filename] = sha(bytes);
  const stored = `docs/qa/${prefix}-sources/${filename}`;
  await fs.mkdir(path.dirname(path.join(root, stored)), { recursive: true }); await fs.writeFile(path.join(root, stored), bytes);
  snapshots.push({ path: filename, storedPath: stored, sha256: sourceHashes[filename] });
  for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.\.?\/[^'"]+\.(?:js|mjs))['"]/g)) {
    await freeze(path.posix.normalize(path.posix.join(path.posix.dirname(filename), match[1])));
  }
}
for (const filename of [...tests, 'scripts/completion-combat-native.mjs']) await freeze(filename);
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const transcript = (result.stdout || '') + (result.stderr || '');
const transcriptPath = `docs/qa/${prefix}.tap`; await fs.writeFile(path.join(root, transcriptPath), transcript);
const report = { passed: false, at: new Date().toISOString(), baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  command: `node scripts/completion-combat-native.mjs`, environment: { COMPLETION_COMBAT_PREFIX: prefix },
  scope: 'Native functional combat assertions. Geometry callback, directional cover, Stasis, immunity feedback, lost-target/KO cancellation, heat bounds, common Wait/Active freeze and unique final outcome.',
  sourceHashes, snapshots, tests, exitCode: result.status, transcript: { path: transcriptPath, sha256: sha(transcript) },
  counts: Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => [key, Number(transcript.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] || 0)])),
  limitations: ['Engine fixtures are explicit input definitions; this is not a public browser traversal or original-game balance/art validation.',
    'Reward distribution and safe exploration after defeat/flee are owned by the campaign/UI and have separate checks.',
    'Cover collision geometry and renderer agreement are checked separately on real zone builders; these focused tests isolate the engine callback contract.'] };
try {
  assert.equal(result.status, 0, transcript.slice(-6000)); assert.ok(report.counts.pass > 0); assert.equal(report.counts.fail, 0);
  for (const [filename, expected] of Object.entries(sourceHashes)) assert.equal(sha(await fs.readFile(path.join(root, filename))), expected, `Source changed during run: ${filename}`);
  report.passed = true;
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
await fs.writeFile(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, counts: report.counts, failure: report.failure }));

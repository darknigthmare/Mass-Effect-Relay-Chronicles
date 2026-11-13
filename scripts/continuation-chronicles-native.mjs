import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const prefix = process.env.CONTINUATION_CHRONICLES_NATIVE_PREFIX;
assert.match(prefix || '', /^continuation-chronicles-native-[a-z0-9-]+$/);
const reportPath = `docs/qa/${prefix}-report.json`, tapPath = `docs/qa/${prefix}-tests.tap`;
for (const path of [reportPath, tapPath]) {
  try { await access(path); throw Error(`Preserve ${path}; choose a fresh prefix.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const tests = ['continuation-chronicles', 'completion-chronicles-powers', 'chronicles', 'universe-combat',
  'tactical-combat', 'completion-combat', 'combat'].map(name => `tests/${name}.test.js`);
const sources = ['src/continuation-chronicles-positions.js', 'src/completion-chronicles-powers.js', 'src/combat.js',
  'src/chronicles.js', 'src/tactical-positions.js', 'src/universe-actors.js', 'src/universe-powers.js',
  ...tests, 'scripts/continuation-chronicles-native.mjs'];
const before = Object.fromEntries(await Promise.all(sources.map(async path => [path, sha(await readFile(path))])));
const command = [process.execPath, '--test', '--test-reporter=tap', ...tests];
const run = spawnSync(command[0], command.slice(1), { encoding: 'utf8', maxBuffer: 20_000_000 });
const output = (run.stdout || '') + (run.stderr || ''); await writeFile(tapPath, output);
const counts = Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(match => [match[1], Number(match[2])]));
const after = Object.fromEntries(await Promise.all(sources.map(async path => [path, sha(await readFile(path))])));
const sourceFrozen = JSON.stringify(before) === JSON.stringify(after);
const report = { passed: run.status === 0 && counts.tests > 0 && counts.fail === 0 && sourceFrozen,
  at: new Date().toISOString(), baselineCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d', command,
  exitCode: run.status, sourceFrozen, sourceHashes: before,
  output: { path: tapPath, bytes: Buffer.byteLength(output), sha256: sha(output) }, counts,
  scope: 'ME2/ME3 local ATB displacement, target/range/contact refusals without costs or RNG, advance/withdraw, Charge costs/impact/risk/end, detached preview, non-persistence and ME1 combat regressions.',
  limitations: ['Native fixtures explicitly prepare readiness, coordinates, shields and deterministic opponents. No played progression or browser observation is implied.',
    'Coordinates describe a two-dimensional ATB arena with bounded free destinations; no obstacles, swept path, original 3D animation or numerical fidelity are certified.',
    'Omni-blade remains absent: the existing animation record is an unsourced extrapolation. No eligible power record or source is invented.'] };
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, counts, reportPath }));
if (!report.passed) process.exitCode = 1;

import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const prefix = process.env.COMPLETION_CHRONICLES_NATIVE_PREFIX;
assert.match(prefix || '', /^completion-chronicles-native-[a-z0-9-]+$/);
const reportPath = `docs/qa/${prefix}-report.json`, tapPath = `docs/qa/${prefix}-tests.tap`;
for (const path of [reportPath, tapPath]) {
  try { await access(path); throw Error(`Preserve ${path}; choose a fresh prefix.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const tests = ['completion-chronicles-powers', 'universe-power-profiles', 'chronicles', 'campaign-talents',
  'universe-powers', 'universe-actors', 'universe-ui', 'universe-support-ui', 'universe-combat',
  'chronicle-ammo-sessions', 'chronicle-expansion', 'chronicle-story', 'chronicle-specialists'].map(name => `tests/${name}.test.js`);
const sources = ['src/completion-chronicles-powers.js', 'src/campaign-talents.js', 'src/universe-powers.js',
  'src/universe-actors.js', 'src/universe-equipment.js', 'src/chronicles.js', 'src/chronicle-story.js',
  'src/continuity.js', 'src/combat.js', 'src/combat-summons.js', 'src/universe-ui.js', ...tests,
  'scripts/completion-chronicles-native.mjs'];
const before = Object.fromEntries(await Promise.all(sources.map(async path => [path, sha(await readFile(path))])));
const command = [process.execPath, '--test', '--test-reporter=tap', ...tests];
const run = spawnSync(command[0], command.slice(1), { encoding: 'utf8', maxBuffer: 20_000_000 });
const output = (run.stdout || '') + (run.stderr || ''); await writeFile(tapPath, output);
const counts = Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$/gm)].map(match => [match[1], Number(match[2])]));
const after = Object.fromEntries(await Promise.all(sources.map(async path => [path, sha(await readFile(path))])));
const sourceFrozen = JSON.stringify(before) === JSON.stringify(after);
const report = { passed: run.status === 0 && counts.tests > 0 && counts.fail === 0 && sourceFrozen,
  at: new Date().toISOString(), command, exitCode: run.status, sourceFrozen, sourceHashes: before,
  output: { path: tapPath, bytes: Buffer.byteLength(output), sha256: sha(output) }, counts,
  scope: 'Native real actor/build/session/combat regressions, provenance, context isolation, finite signature effects and resources. Existing clip, preparation, module and reading acceptance clauses are re-executed; no browser or artistic validation is implied.',
  limitations: ['Tests may explicitly prepare ATB, shields and deterministic opponents; these fixtures do not represent played campaign progression.',
    'Charge engagement is abstract and all signature timings/multipliers are adapted to ATB. Original models, scenes, numerical ranks and complete original campaigns remain outside this proof.'] };
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, counts, reportPath }));
if (!report.passed) process.exitCode = 1;

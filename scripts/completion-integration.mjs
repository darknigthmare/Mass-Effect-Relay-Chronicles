import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COMPLETION_BASE_COMMIT, projectRoot, featureSourceFiles, filesBelow, sourceHashes, snapshot, sha } from './completion-evidence.mjs';
const prefix = process.env.COMPLETION_INTEGRATION_PREFIX || 'completion-integration-final-01';
assert.match(prefix, /^completion-integration-[a-z0-9-]+$/);
const path = `docs/qa/${prefix}-report.json`, outputPath = `docs/qa/${prefix}-output.txt`;
try { await access(new URL(path, projectRoot));throw Error('Choose a fresh prefix; do not replace an executed gate.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const tests = (await filesBelow('tests/')).filter(path => /^tests\/[^/]+\.test\.js$/.test(path));
const files = await featureSourceFiles([...(await filesBelow('tests/')), 'scripts/completion-integration.mjs', 'scripts/completion-evidence.mjs', 'scripts/completion-combat-geometry.mjs']);
const report = { passed: false, at: new Date().toISOString(), baselineCommit: COMPLETION_BASE_COMMIT,
  command: ['node', '--test', ...tests], sourceHashes: await snapshot(files, `docs/qa/${prefix}-sources`),
  scope: 'Full native Node test suite on the frozen feature sources and actual test fixtures. Generated universe-data.js is verified separately after tracking publication. This is not a browser, physical controller, hardware FPS or Windows gameplay test.' };
let output = Buffer.alloc(0), exitCode = 0;
try { output = execFileSync(process.execPath, ['--test', ...tests], { cwd: fileURLToPath(projectRoot), maxBuffer: 64 * 1024 * 1024, timeout: 180000, encoding: 'buffer' }); }
catch (error) { exitCode = error.status ?? 1;output = Buffer.concat([error.stdout || Buffer.alloc(0), error.stderr || Buffer.from(String(error))]); }
await writeFile(new URL(outputPath, projectRoot), output);
report.output = { path: outputPath, sha256: sha(output), exitCode };
report.unit = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => [key, Number(output.toString().match(new RegExp(`(?:#|ℹ) ${key} (\\d+)`))?.[1] ?? NaN)]));
try {
  assert.equal(exitCode, 0);assert.ok(report.unit.pass >= 1000);assert.equal(report.unit.fail, 0);
  for (const key of ['cancelled','skipped','todo']) assert.equal(report.unit[key], 0, key);
  assert.deepEqual(await sourceHashes(files), report.sourceHashes);report.sourceFrozen = true;report.passed = true;
} catch (error) { report.failure = error.stack || String(error);process.exitCode = 1; }
await writeFile(new URL(path, projectRoot), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, ...report.unit, output: outputPath, failure: report.failure }));

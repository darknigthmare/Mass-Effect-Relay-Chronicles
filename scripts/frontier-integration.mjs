// Pre-workbook native gate. No production or original-game fidelity claim.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readAssets } from './frontier-assets.mjs';
import { BASE_COMMIT, sha } from './frontier-workbook-data.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = process.env.FRONTIER_INTEGRATION_PREFIX || 'frontier-integration';
assert.match(prefix, /^frontier-[a-z0-9-]+$/);
const reportPath = path.join(root, `docs/qa/${prefix}-report.json`);
try { await fs.access(reportPath); throw Error('Preserve the existing report and choose a fresh FRONTIER_INTEGRATION_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const report = { passed: false, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  scope: 'Current native feature rules, actual authored geometry and paired six-formation balance. DEV/public rendering and final production remain separate gates.',
  sourceHashes: {}, captureArtifacts: [], checks: [], limitations: ['Automated rules and software-rendered browser proofs do not certify original-game likeness, complete mechanics or physical-device performance.'] };
try {
  const assets = await readAssets(root);
  Object.assign(report.sourceHashes, assets.sourceHashes);
  const tests = (await fs.readdir(path.join(root, 'tests'))).filter(name => /^frontier-.*\.test\.js$/.test(name)).map(name => `tests/${name}`);
  tests.push('tests/state.test.js', 'tests/story.test.js', 'tests/story-world.test.js', 'tests/companion-combat-world.test.js', 'tests/commander-world.test.js');
  for (const filename of [...tests, 'src/state.js', 'src/combat.js', 'src/world-navigation.js', 'scripts/frontier-integration.mjs']) {
    report.sourceHashes[filename] = sha(await fs.readFile(path.join(root, filename)));
  }
  const command = [process.execPath, '--test', '--test-reporter=spec', ...tests];
  const run = spawnSync(command[0], command.slice(1), { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const output = `${run.stdout || ''}${run.stderr || ''}`, outputPath = `docs/qa/${prefix}-unit-output.txt`;
  await fs.writeFile(path.join(root, outputPath), output);
  report.unit = { command, exitCode: run.status, outputPath, sha256: sha(output),
    passed: Number(output.match(/ℹ pass (\d+)/)?.[1]), failed: Number(output.match(/ℹ fail (\d+)/)?.[1]) };
  assert.equal(run.error, undefined); assert.equal(run.status, 0); assert.ok(report.unit.passed > 0); assert.equal(report.unit.failed, 0);
  report.checks.push({ name: 'Native geometry, interactions, save compatibility, guards and combat regression', passed: true });
  const balancePath = 'docs/qa/frontier-enemies-balance.json', balanceRaw = await fs.readFile(path.join(root, balancePath));
  const balance = JSON.parse(balanceRaw); assert.equal(balance.passed, true);
  for (const [filename, expected] of Object.entries(balance.sourceHashes).filter(([filename]) => !filename.includes('@baseline'))) {
    assert.equal(sha(await fs.readFile(path.join(root, filename))), expected, `Stale balance proof: ${filename}`);
    report.sourceHashes[filename] = expected;
  }
  report.balance = { path: balancePath, sha256: sha(balanceRaw), summary: balance.summary };
  report.checks.push({ name: 'Paired native before/after combat policy on the six changed formations', passed: true });
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await fs.readFile(path.join(root, filename))), expected, `Source changed during gate: ${filename}`);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, tests: report.unit?.passed, failure: report.failure }));

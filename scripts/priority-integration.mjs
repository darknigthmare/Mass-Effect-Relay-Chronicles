// Current pre-workbook native gate, with the executed tests and feature sources.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, PRIORITY_FEATURE_SOURCES, readFeatureSources, sha } from './priority-workbook-data.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = process.env.PRIORITY_INTEGRATION_PREFIX || 'priority-integration-final-01';
assert.match(prefix, /^priority-[a-z0-9-]+$/);
const output = `docs/qa/${prefix}-report.json`;
try { await fs.access(`${root}/${output}`); throw Error('Preserve old attempts; select another prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const report = { passed: false, at: new Date().toISOString(), baselineCommit: BASE_COMMIT, sourceHashes: {},
  scope: 'Complete native suite on the frozen executable sources before workbook metadata publication. Paired tactical/boss policies, development journeys, workbook review and final compiled production are distinct gates.', checks: [] };
try {
  const tests = (await fs.readdir(`${root}/tests`)).filter(name => name.endsWith('.test.js')).map(name => `tests/${name}`);
  report.sourceHashes = await readFeatureSources(root, [...PRIORITY_FEATURE_SOURCES, ...tests, 'scripts/priority-integration.mjs', 'package.json', 'package-lock.json']);
  const command = ['npm', 'test'], result = spawnSync(command[0], command.slice(1), { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const text = `${result.stdout || ''}${result.stderr || ''}`, path = `docs/qa/${prefix}-output.txt`;
  await fs.writeFile(`${root}/${path}`, text); report.unit = { command, exitCode: result.status, path, sha256: sha(text) };
  for (const field of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) report.unit[field] = Number(text.match(new RegExp(`(?:#|ℹ) ${field} (\\d+)`))?.[1]);
  assert.equal(result.error, undefined); assert.equal(result.status, 0, `Native suite failed; read ${path}`);
  assert.ok(report.unit.pass >= 915); assert.equal(report.unit.pass, report.unit.tests);
  for (const field of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(report.unit[field], 0);
  report.checks.push({ name: 'Complete native suite and historical regressions', passed: true });
  report.comparisons = [];
  for (const path of ['docs/qa/priority-tactical-balance-02.json', 'docs/qa/priority-bosses-comparison-final-01.json']) {
    const bytes = await fs.readFile(`${root}/${path}`), proof = JSON.parse(bytes); assert.equal(proof.passed, true, path);
    for (const [filename, expected] of Object.entries(proof.sourceHashes || {})) assert.equal(sha(await fs.readFile(`${root}/${filename}`)), expected, `Stale ${path}: ${filename}`);
    report.comparisons.push({ path, sha256: sha(bytes), summary: proof.summary });
  }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await fs.readFile(`${root}/${filename}`)), expected, `Source changed while running: ${filename}`);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await fs.writeFile(`${root}/${output}`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, tests: report.unit?.pass, failure: report.failure }));

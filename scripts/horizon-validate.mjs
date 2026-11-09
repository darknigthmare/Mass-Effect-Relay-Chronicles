// Execute the required final checks in order; preserve failed attempts separately.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { readAssets } from './horizon-assets.mjs';
import { BASE_COMMIT, sha } from './horizon-workbook-data.mjs';
const root = new URL('../', import.meta.url), cwd = fileURLToPath(root);
const prefix = process.env.HORIZON_VALIDATION_PREFIX || 'horizon-validation';
assert.match(prefix, /^horizon-[a-z0-9-]+$/);
const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Choose a fresh HORIZON_VALIDATION_PREFIX; preserve previous attempts.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const report = { passed: false, at: new Date().toISOString(), baselineCommit: BASE_COMMIT,
  commands: [], sourceHashes: {}, scope: 'Sequential registry synchronization, complete native suite, production compilation and declared fidelity inventory. No original-game artistic fidelity certification.' };
try {
  Object.assign(report.sourceHashes, (await readAssets(cwd)).sourceHashes);
  for (const [name, command] of [['universe', ['npm', 'run', 'build:universe']], ['unit', ['npm', 'test']],
    ['build', ['npm', 'run', 'build']], ['fidelity', ['npm', 'run', 'audit:fidelity']]]) {
    const started = performance.now();
    const result = spawnSync(command[0], command.slice(1), { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const output = `${result.stdout || ''}${result.stderr || ''}`, filename = `docs/qa/${prefix}-${name}-output.txt`;
    await writeFile(new URL(filename, root), output);
    const entry = { name, command, exitCode: result.status, output: filename, sha256: sha(output), seconds: (performance.now() - started) / 1000 };
    if (name === 'unit') for (const field of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) entry[field] = Number(output.match(new RegExp(`(?:#|ℹ) ${field} (\\d+)`))?.[1]);
    if (name === 'build') entry.modules = Number(output.match(/(\d+) modules transformed/)?.[1]);
    report.commands.push(entry);
    assert.equal(result.error, undefined); assert.equal(result.status, 0, `${name} failed; see ${filename}`);
    if (name === 'unit') { assert.ok(entry.pass > 0); for (const field of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(entry[field], 0); }
    console.log(JSON.stringify(entry));
  }
  for (const [filename, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, filename);
  for (const filename of ['src/universe-data.js', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json', 'scripts/horizon-validate.mjs']) report.sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, failure: report.failure }));

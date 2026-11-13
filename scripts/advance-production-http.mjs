import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { ADVANCE_BASE_COMMIT as BASE_COMMIT, sha } from './advance-evidence.mjs';
const root = new URL('../', import.meta.url);
const base = new URL(process.env.GAME_URL || 'http://127.0.0.1:4198/');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const prefix = process.env.ADVANCE_HTTP_PREFIX || 'advance-production-http';
assert.match(prefix, /^advance-[a-z0-9-]+$/);
const reportURL = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportURL); throw Error('Choose a fresh ADVANCE_HTTP_PREFIX; preserve prior attempts.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const bytes = await readFile(new URL('docs/qa/advance-build-report.json', root)), build = JSON.parse(bytes);
assert.equal(build.passed, true);
const report = { passed: false, at: new Date().toISOString(), baselineCommit: BASE_COMMIT, url: base.href,
  buildReport: { path: 'docs/qa/advance-build-report.json', sha256: sha(bytes) }, sourceHashes: build.sourceHashes,
  checks: [], scope: 'HTTP bytes of every file in the current local production build; public gameplay and visual review have separate reports.' };
try {
  for (const [filename, expected] of Object.entries(build.sourceHashes)) assert.equal(sha(await readFile(new URL(filename, root))), expected, filename);
  for (const [path, expected] of Object.entries(build.distFiles)) {
    const response = await fetch(new URL(path, base));
    const body = Buffer.from(await response.arrayBuffer());
    const result = { path, status: response.status, bytes: body.length, sha256: sha(body) };
    report.checks.push(result);
    assert.equal(response.status, 200, path); assert.equal(body.length, expected.bytes, path); assert.equal(result.sha256, expected.sha256, path);
  }
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
await writeFile(reportURL, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, files: report.checks.length, failure: report.failure }));

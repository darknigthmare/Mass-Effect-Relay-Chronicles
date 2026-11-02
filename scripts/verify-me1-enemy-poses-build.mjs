import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url), sha = data => createHash('sha256').update(data).digest('hex');
const bytes = path => readFile(new URL(path, root));
async function tree(relative) {
  const paths = [];
  for (const entry of await readdir(new URL(relative, root), { withFileTypes: true })) {
    const path = relative + entry.name;
    if (entry.isDirectory()) paths.push(...await tree(path + '/')); else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
const paths = [...await tree('src/'), ...(await tree('tests/')).filter(path => path.endsWith('.test.js')),
  ...await tree('public/assets/'),
  'package.json', 'package-lock.json', 'vite.config.js', 'docs/content-catalog.json',
  'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'docs/qa/me3-legendary-weapons-baseline.json',
  'docs/qa/legendary-weapon-access-baseline.json', 'scripts/verify-me1-enemy-poses-build.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, sha(await bytes(path))])));
const execute = args => spawnSync('npm', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  env: { ...process.env, NO_COLOR: '1' } });
const resume = process.argv.includes('--resume-unit');
const archive = 'docs/qa/me1-enemy-poses-unit-collection/';
const rawUnit = resume ? JSON.parse(await bytes(archive + 'raw-report.json')) : null;
if (resume) {
  assert.equal(rawUnit.exitCode, 0);
  for (const [path, expected] of Object.entries(rawUnit.sourceHashes))
    assert.equal(sha(await bytes(path === 'scripts/verify-me1-enemy-poses-build.mjs' ? archive + 'runner.mjs' : path)), expected, `Test collection source changed: ${path}`);
}
const tests = resume ? { status: rawUnit.exitCode } : execute(['test']);
const unitOutput = resume ? (await bytes(archive + 'output.txt')).toString() : `${tests.stdout || ''}${tests.stderr || ''}`;
if (resume) assert.equal(sha(Buffer.from(unitOutput)), rawUnit.output.sha256);
const count = name => Number(unitOutput.match(new RegExp(`^(?:#|ℹ) ${name} (\\d+)$`, 'm'))?.[1] || 0);
await writeFile(new URL('docs/qa/me1-enemy-poses-unit-output.txt', root), unitOutput);
const unit = { passed: tests.status === 0, generatedAt: new Date().toISOString(), command: 'npm test', exitCode: tests.status,
  tests: count('tests'), passedTests: count('pass'), failedTests: count('fail'), skippedTests: count('skipped'),
  durationMs: Number(unitOutput.match(/^(?:#|ℹ) duration_ms ([\d.]+)$/m)?.[1]),
  sourceHashes: resume ? Object.fromEntries(Object.entries(rawUnit.sourceHashes).map(([path, hash]) =>
    [path === 'scripts/verify-me1-enemy-poses-build.mjs' ? archive + 'runner.mjs' : path, hash])) : sourceHashes,
  output: { path: 'docs/qa/me1-enemy-poses-unit-output.txt', sha256: sha(Buffer.from(unitOutput)) } };
if (resume) unit.collectionProvenance = { collectedAt: rawUnit.generatedAt, newTestRunForSummary: false,
  rawReport: { path: archive + 'raw-report.json', sha256: sha(await bytes(archive + 'raw-report.json')) },
  rawOutput: { path: archive + 'output.txt', sha256: sha(await bytes(archive + 'output.txt')) },
  parser: { path: 'scripts/verify-me1-enemy-poses-build.mjs', sha256: sourceHashes['scripts/verify-me1-enemy-poses-build.mjs'] },
  qualification: 'The actual successful785-test process emitted spec output. These exact bytes are reparsed; the original wrapper failure and runner are archived. Game and test source hashes remain identical.' };
await writeFile(new URL('docs/qa/me1-enemy-poses-unit-report.json', root), JSON.stringify(unit, null, 2) + '\n');
assert.equal(unit.passed, true, unitOutput); assert.ok(unit.tests >= 785); assert.equal(unit.failedTests, 0); assert.equal(unit.skippedTests, 0);
const built = execute(['run', 'build']), buildOutput = `${built.stdout || ''}${built.stderr || ''}`;
await writeFile(new URL('docs/qa/me1-enemy-poses-build-output.txt', root), buildOutput);
const artifacts = [];
if (built.status === 0) for (const path of await tree('dist/')) {
  const data = await bytes(path); artifacts.push({ path, bytes: data.length, sha256: sha(data) });
}
const build = { passed: built.status === 0, generatedAt: new Date().toISOString(), command: 'npm run build', exitCode: built.status,
  modules: Number(buildOutput.match(/(\d+) modules transformed/)?.[1]),
  durationSeconds: Number(buildOutput.match(/built in ([\d.]+)s/)?.[1]),
  pngFiles: artifacts.filter(file => file.path.endsWith('.png')).length,
  compiledJavaScriptBundles: artifacts.filter(file => file.path.endsWith('.js')).length, sourceHashes, artifacts,
  output: { path: 'docs/qa/me1-enemy-poses-build-output.txt', sha256: sha(Buffer.from(buildOutput)) } };
await writeFile(new URL('docs/qa/me1-enemy-poses-build-report.json', root), JSON.stringify(build, null, 2) + '\n');
assert.equal(build.passed, true, buildOutput); assert.equal(build.pngFiles, 27);
for (const [path, expected] of Object.entries(sourceHashes)) assert.equal(sha(await bytes(path)), expected, `Source changed during checks: ${path}`);
console.log(JSON.stringify({ passed: true, nodeTests: unit.tests, modules: build.modules,
  jsBundles: build.compiledJavaScriptBundles, pngFiles: build.pngFiles, checkedSources: paths.length }));

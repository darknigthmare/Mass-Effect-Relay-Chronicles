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
const tests = execute(['test']), unitOutput = `${tests.stdout || ''}${tests.stderr || ''}`;
const count = name => Number(unitOutput.match(new RegExp(`^# ${name} (\\d+)$`, 'm'))?.[1] || 0);
await writeFile(new URL('docs/qa/me1-enemy-poses-unit-output.txt', root), unitOutput);
const unit = { passed: tests.status === 0, generatedAt: new Date().toISOString(), command: 'npm test', exitCode: tests.status,
  tests: count('tests'), passedTests: count('pass'), failedTests: count('fail'), skippedTests: count('skipped'),
  durationMs: Number(unitOutput.match(/^# duration_ms ([\d.]+)$/m)?.[1]), sourceHashes,
  output: { path: 'docs/qa/me1-enemy-poses-unit-output.txt', sha256: sha(Buffer.from(unitOutput)) } };
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

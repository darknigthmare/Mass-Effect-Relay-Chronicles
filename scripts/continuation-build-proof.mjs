import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { featureSourceFiles, sourceHashes as hashSources, CONTINUATION_BASE_COMMIT } from './continuation-evidence.mjs';
const root = new URL('../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function tree(base, prefix = '') {
  const result = {};
  for (const item of (await readdir(base, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix + item.name, target = new URL(item.name + (item.isDirectory() ? '/' : ''), base);
    if (item.isDirectory()) Object.assign(result, await tree(target, name + '/'));
    else if (item.isFile()) { const bytes = await readFile(target); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
try { await readFile(new URL('docs/qa/continuation-build-report.json',root));throw Error('Preserve the executed build proof.'); } catch(error) { if(error.code!=='ENOENT')throw error; }
const featureHashes = await hashSources(await featureSourceFiles());
const dist = await tree(new URL('dist/', root)), publicFiles = await tree(new URL('public/', root));
for (const [name, expected] of Object.entries(publicFiles)) assert.deepEqual(dist[name], expected, `Built local asset mismatch: ${name}`);
const scripts = Object.keys(dist).filter(name => name.endsWith('.js'));
assert.ok(scripts.length > 0); assert.ok(dist['index.html']);
for (const name of scripts) {
  const source = await readFile(new URL(`dist/${name}`, root), 'utf8');
  assert.ok(!source.includes('__RELAY_TEST__'), `${name} retains the development harness`);
  assert.ok(!source.includes('/@vite/client'), `${name} retains a development import`);
}
const sourceHashes = { ...featureHashes };
for (const filename of ['src/universe-data.js', 'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json', 'scripts/continuation-build-proof.mjs']) {
  sourceHashes[filename] = sha(await readFile(new URL(filename, root)));
}
const report = { passed: true, baselineCommit: CONTINUATION_BASE_COMMIT, generatedAt: new Date().toISOString(), sourceHashes, distFiles: dist,
  publicFilesVerified: Object.keys(publicFiles).length, pngCount: Object.keys(publicFiles).filter(name => name.endsWith('.png')).length,
  scriptCount: scripts.length, productionHarnessExcluded: true,
  scope: 'Local compiled tree and copied public bytes. Current feature metadata, all local PNG/JSON and workbook/catalog provenance are identified. Public HTTP behavior is checked separately.',
  limitations: ['This does not launch Electron on Windows or inspect a remote Vercel deployment.'] };
assert.equal(report.pngCount, 46);
await writeFile(new URL('docs/qa/continuation-build-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, publicFiles: report.publicFilesVerified, png: report.pngCount, scripts: scripts.length }));

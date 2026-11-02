import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url), baseline = '641fa6309d7eb04a28f981b8bcdd34210ffdd200';
const digest = (data, algorithm = 'sha256') => createHash(algorithm).update(data).digest('hex');
const bytes = path => readFile(new URL(path, root));
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), baseline);
const permitted = ['README.md', 'docs/IMPLEMENTATION_STATUS.md', 'src/world.js'];
const changed = git(['diff', '--name-only', '-z', baseline]).toString().split('\0').filter(Boolean).sort();
assert.deepEqual(changed, [...permitted].sort());
const oldBlock = `    for (const z of [-11, 10]) {
      this._box(27, .8, 1.8, steel, 0, 10, z);
      this._box(11, .06, .2, this._material(0xc6e8f1, .5, .1, 0x7aabbc), 0, 9.55, z);
    }`;
const newBlock = `    for (const z of [-11, 10]) {
      for (const span of [this._box(27, .8, 1.8, steel, 0, 10, z),
        this._box(11, .06, .2, this._material(0xc6e8f1, .5, .1, 0x7aabbc), 0, 9.55, z)]) {
        // As on Feros, overhead spans yield to the tactical combat view.
        span.userData.keep = true; span.userData.combatOccluder = true;
        span.visible = this.mode !== 'combat'; this.combatOccluders.push(span);
      }
    }`;
const oldWorld = git(['show', `${baseline}:src/world.js`]).toString();
assert.equal(oldWorld.split(oldBlock).length, 2);
const currentWorld = await bytes('src/world.js');
assert.equal(currentWorld.toString(), oldWorld.replace(oldBlock, newBlock), 'No other world renderer change is authorized by this scope proof.');

const records = [], listing = git(['ls-tree', '-r', '-z', baseline]).toString().split('\0').filter(Boolean);
for (const row of listing) {
  const match = row.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/); assert.ok(match, row);
  const [, oid, path] = match;
  if (permitted.includes(path)) continue;
  const data = await bytes(path), observed = digest(Buffer.concat([Buffer.from(`blob ${data.length}\0`), data]), 'sha1');
  assert.equal(observed, oid, `Historical file changed: ${path}`);
  records.push({ path, gitBlob: oid, sha256: digest(data) });
}
const protectedPath = 'docs/qa/eden-occlusion-protected-files.json';
const protectedBytes = Buffer.from(JSON.stringify({ baselineCommit: baseline, files: records }, null, 2) + '\n');
await writeFile(new URL(protectedPath, root), protectedBytes);
const eden = JSON.parse((await bytes('docs/qa/eden-immersion-report.json')).toString()); assert.equal(eden.passed, true);
const unit = JSON.parse((await bytes('docs/qa/eden-occlusion-unit-report.json')).toString());
const build = JSON.parse((await bytes('docs/qa/eden-occlusion-build-report.json')).toString());
assert.equal(unit.passed, true); assert.equal(unit.tests, 802); assert.equal(unit.passedTests, 802);
assert.equal(build.passed, true); assert.equal(build.pngFiles, 31); assert.equal(build.modules, 83);
assert.equal(unit.sourceHashes['src/world.js'], digest(currentWorld));
assert.deepEqual(unit.sourceHashes, build.sourceHashes);
assert.equal((await readdir(new URL('public/assets/', root))).filter(path => path.endsWith('.png')).length, 31);
const sourceHashes = {};
for (const path of [...permitted, 'tests/noveria-occlusion.test.js', 'scripts/audit-eden-occlusion.mjs']) sourceHashes[path] = digest(await bytes(path));
const report = { passed: true, at: new Date().toISOString(), baselineCommit: baseline,
  scope: 'Only four overhead Noveria structural/light meshes are kept separate from static merging and registered with the existing combat-occluder mechanism. All other tracked files except the two documented explanations remain byte-identical to the independently accepted Eden commit.',
  permittedChangedTrackedFiles: permitted, baselineTrackedFiles: listing.length, protectedTrackedFiles: records.length,
  protectedRuntimeModules: records.filter(file => file.path.startsWith('src/')).length,
  protectedQAReports: records.filter(file => file.path.startsWith('docs/qa/') && file.path.endsWith('.json')).length,
  protectedCatalogueAndWorkbook: records.filter(file => ['docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx', 'public/assets/manifest.json'].includes(file.path)),
  protectedFileProof: { path: protectedPath, sha256: digest(protectedBytes), bytes: protectedBytes.length },
  previousEdenEvidence: { path: 'docs/qa/eden-immersion-report.json', sha256: digest(await bytes('docs/qa/eden-immersion-report.json')),
    qualification: 'Historical evidence belongs to this exact baseline commit. Its Noveria occlusion finding is preserved; new build and public-arena evidence substantiate the subsequent correction. The complete Eden traversal is not claimed to have been replayed for this targeted patch.' },
  patch: { changedMethod: '_noveria', registeredMeshes: 4, originalDimensionsRetained: true,
    currentWorldSha256: digest(currentWorld), baselineWorldSha256: digest(Buffer.from(oldWorld)),
    exactScopedReplacementVerified: true, geometryLayoutDataPreserved: true, combatAndSaveModulesPreserved: true },
  sourceHashes, limitations: ['Native integrity and scope proof only. The separate public production journey and actual visual review must establish the observed occlusion correction.',
    'No new PNG, equipment, body pose, story gate or workbook status is added by this correction. Original-game geography and complete likeness remain uncertified1:1.'] };
await writeFile(new URL('docs/qa/eden-occlusion-native-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, baselineFiles: listing.length, protectedFiles: records.length,
  protectedQAReports: report.protectedQAReports, currentTests: unit.tests }));

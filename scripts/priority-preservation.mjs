import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url), cwd = fileURLToPath(root);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const baseline = JSON.parse(await readFile(new URL('docs/qa/priority-workbook-baseline.json', root)));
const preserved = {};
for (const [filename, digest] of Object.entries({ ...baseline.publicPNGHashes, ...baseline.otherWorkbookHashes })) {
  assert.equal(sha(await readFile(new URL(filename, root))), digest, filename); preserved[filename] = digest;
}
for (const [filename, digest] of Object.entries(baseline.universeCatalogueHashes)) {
  assert.equal(sha(await readFile(new URL(filename, root))), digest, filename); preserved[filename] = digest;
}
const allowed = ['README.md', 'docs/ASSETS.md', 'docs/CATALOGUE.md', 'docs/DESIGN.md', 'docs/FIDELITY.md', 'docs/IMPLEMENTATION_STATUS.md',
  'docs/content-catalog.json', 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx',
  'src/combat.js', 'src/loadout.js', 'src/game-data.js', 'src/main.js', 'src/state.js', 'src/world.js',
  'src/loadout-ui.js', 'src/customization-ui.js', 'src/universe-data.js'];
assert.equal(sha(await readFile(new URL('public/assets/manifest.json', root))), baseline.sourceHashes['public/assets/manifest.json']);
const historical = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baseline.baselineCommit], { cwd, encoding: 'utf8' }).trim().split('\n'));
const changed = execFileSync('git', ['diff', '--name-only', baseline.baselineCommit], { cwd, encoding: 'utf8' }).trim().split('\n').filter(filename => historical.has(filename));
assert.ok(changed.length > 0);
for (const filename of changed) assert.ok(allowed.includes(filename), `Unexpected modification of historical file: ${filename}`);
const report = { passed: true, at: new Date().toISOString(), baselineCommit: baseline.baselineCommit,
  preservedPNGCount: Object.keys(baseline.publicPNGHashes).length,
  preservedOtherWorkbookCount: Object.keys(baseline.otherWorkbookHashes).length,
  preservedUniverseCatalogueCount: Object.keys(baseline.universeCatalogueHashes).length,
  preservedHashes: preserved, existingFilesChanged: changed, allowedExistingFiles: allowed,
  existingFilesUnchangedOutsideAllowlist: true,
  scope: 'All tracked historical files outside the explicit feature/documentation/tracking allowlist retain their Git bytes; 46 old PNG, 31 other XLSX and 27 supplemental catalogues additionally checked by native SHA256.',
  limitations: ['New files are recorded by the final commit and their feature reports, not classified as historical preservation.',
    'Catalogue row/cell preservation, tactical formations and the two boss phase plans have their separate native proofs.'] };
assert.equal(report.preservedPNGCount, 46); assert.equal(report.preservedOtherWorkbookCount, 31); assert.equal(report.preservedUniverseCatalogueCount, 27);
await writeFile(new URL('docs/qa/priority-preservation-report.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, oldPNG: report.preservedPNGCount, otherXLSX: report.preservedOtherWorkbookCount, historicalFilesChanged: changed.length }));

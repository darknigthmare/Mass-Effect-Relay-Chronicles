// Read-only preservation of the new base, all historical proof, every public
// asset byte and all existing Validé records. This is not a gameplay gate.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, PUBLIC_TARGETS, sha, fresh, preservation } from './completion-tracking-common.mjs';

const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index++) {
  const option = args[index];
  assert.ok(['--baseline', '--output', '--allow-principal-copies'].includes(option));
  if (option === '--allow-principal-copies') options.allowCopies = true;
  else { assert.ok(args[index + 1]); options[option.slice(2)] = args[++index]; }
}
assert.ok(options.baseline && options.output);
const output = path.resolve(ROOT, options.output); await fresh(output);
const baselineRaw = await fs.readFile(path.resolve(ROOT, options.baseline));
const baseline = JSON.parse(baselineRaw);
assert.equal(baseline.passed, true); assert.equal(baseline.preservation.allPublicBytesProtected, true);
assert.match(baseline.baseCommit, /^[0-9a-f]{40}$/);
const gitBytes = filename => execFileSync('git', ['show', `${baseline.baseCommit}:${filename}`], { cwd: ROOT, maxBuffer: 128 * 1024 * 1024 });
const principalPath = PUBLIC_TARGETS[0], oldPrincipalRaw = gitBytes(principalPath);
assert.equal(sha(oldPrincipalRaw), baseline.publicInputHashes[principalPath]);
const original = JSON.parse(oldPrincipalRaw);
const currentRaw = await fs.readFile(path.join(ROOT, principalPath)), current = JSON.parse(currentRaw);
assert.deepEqual(current.entries.map(entry => entry.id), original.entries.map(entry => entry.id));
const currentById = new Map(current.entries.map(entry => [entry.id, entry]));
const validated = original.entries.filter(entry => entry.status === 'Validé');
for (const entry of validated) assert.deepEqual(currentById.get(entry.id), entry, `Existing Validé changed: ${entry.id}`);
for (const entry of original.entries) assert.equal(currentById.get(entry.id).assetStatus, entry.assetStatus, `Asset status changed: ${entry.id}`);
const protectedFiles = await preservation(baseline, options.allowCopies === true);
const previousPublic = Object.keys(baseline.publicInputHashes).filter(filename => filename.startsWith('public/')).sort();
const actualPublic = (await fs.readdir(path.join(ROOT, 'public'), { recursive: true, withFileTypes: true }))
  .filter(item => item.isFile()).map(item => path.relative(ROOT, path.join(item.parentPath, item.name))).sort();
assert.deepEqual(actualPublic, previousPublic, 'Public file inventory changed');
const historicalToolPaths = Object.keys(baseline.sourceHashes).filter(filename => filename.startsWith('scripts/completion-'));
for (const filename of historicalToolPaths) assert.equal(sha(await fs.readFile(path.join(ROOT, filename))), baseline.sourceHashes[filename], `Historical completion tool changed: ${filename}`);
const currentPrincipalHashes = {};
for (const filename of PUBLIC_TARGETS) currentPrincipalHashes[filename] = sha(await fs.readFile(path.join(ROOT, filename)));
const report = {
  passed: true, preservationOnly: true, generatedAt: new Date().toISOString(), baseCommit: baseline.baseCommit,
  baselineProof: { path: options.baseline, sha256: sha(baselineRaw) },
  principalCopiesMayDiffer: options.allowCopies === true,
  protectedFiles, historicalFiles: Object.keys(baseline.historicalHashes).length,
  preservedPublicFiles: previousPublic.length, preservedPublicPngs: baseline.preservation.publicPngs,
  preservedOtherWorkbooks: baseline.preservation.otherWorkbooks, preservedSupplementalCatalogues: baseline.catalogues.length - 1,
  preservedHistoricalTools: historicalToolPaths.length, preservedValidatedRecords: validated.length,
  preservedAssetStatuses: original.entries.length, sourceHashes: currentPrincipalHashes,
  sourceTool: { path: 'scripts/continuation-tracking-preservation.mjs', sha256: sha(await fs.readFile(fileURLToPath(import.meta.url))) },
  limitations: ['Read-only byte and record preservation check. Gameplay execution, candidate workbook verification, image opening and compiled production checks have their own evidence.'],
};
await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, protectedFiles, preservedValidatedRecords: validated.length,
  preservedPublicFiles: previousPublic.length, preservedHistoricalTools: historicalToolPaths.length, output: options.output }));

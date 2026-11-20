import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getUniverseRecord } from '../src/universe-data.js';
import { getProductionCatalogueView } from '../src/continuation-catalogue.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = process.argv[2];
const read = filename => readFile(new URL(`../${filename}`, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestPath = 'docs/universe/manifest.json';
const outputDirectory = 'docs/universe/outputs/relay-chronicles-20261022/';
const ids = ['INF', 'GAL'];
const manifestBytes = await read(manifestPath);
const manifest = JSON.parse(manifestBytes);
const audit = JSON.parse(execFileSync('python', [
  'scripts/verify-universe-workbooks.py', '--ids', ids.join(','), '--no-write-report',
], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
const selected = manifest.workbooks.filter(book => ids.includes(book.id));
assert.equal(audit.workbooks, ids.length);
assert.equal(selected.length, ids.length);

const checks = [];
for (const work of selected) {
  const bytes = await read(work.catalogPath);
  const workbook = audit.results.find(result => result.id === work.id);
  const catalogue = JSON.parse(bytes);
  const view = getProductionCatalogueView({ workId: work.id });
  assert.equal(view.records.length, catalogue.entries.length);
  assert.equal(workbook.cellsCompared, catalogue.entries.length * 19);
  assert.equal(workbook.exactTextMatch, true);
  assert.equal(workbook.catalogSha256, sha256(bytes));
  assert.equal(work.catalogSha256, sha256(bytes));
  assert.equal(work.sha256, workbook.sha256);
  assert.deepEqual(work.statusCounts, workbook.statusCounts);
  const registry = new Map(view.records.map(record => [record.id, record]));
  for (const entry of catalogue.entries) {
    const result = registry.get(entry.id);
    assert.equal(result, getUniverseRecord(entry.id));
    assert.equal(result.status, entry.status, entry.id);
    assert.equal(result.playable, false, entry.id);
  }
  const target = catalogue.entries.find(entry => entry.id === `${work.id}-SYS-SOURCES`);
  assert.ok(target && target.priority === 'P0');
  assert.equal(getProductionCatalogueView({ workId: work.id, status: 'Intégré' }).records.length,
    catalogue.entries.filter(entry => entry.status === 'Intégré').length);
  checks.push({
    id: target.id, passed: true, exactDescription: target.description, exactCriterion: target.acceptance,
    records: catalogue.entries.length, workbookCells: workbook.cellsCompared, formulas: workbook.formulas,
    catalogueSha256: workbook.catalogSha256, workbookSha256: workbook.sha256,
    results: 'Catalogue, registre consultable, XLSX et manifeste conservent les statuts explicites de chaque fiche.',
  });
}

const archive = `${outputDirectory}Mass_Effect_Universe_27_Classeurs.zip`;
execFileSync('python', ['-c', `
import hashlib, sys, zipfile
from pathlib import Path
archive, manifest, *workbooks = sys.argv[1:]
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert package.read('manifest.json') == Path(manifest).read_bytes()
    for item in map(Path, workbooks):
        assert hashlib.sha256(package.read(item.name)).digest() == hashlib.sha256(item.read_bytes()).digest()
`, archive, manifestPath, ...selected.map(book => `${outputDirectory}${book.filename}`)], { cwd: root });

const report = {
  passed: true, checks, executedAt: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  archiveSha256: sha256(await read(archive)), manifestSha256: sha256(manifestBytes),
  scope: 'Contrôle du suivi documentaire et des exports INF/GAL. Les statuts restent ceux du catalogue. Aucune disponibilité jouable n’est déduite.',
};
if (output) await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));

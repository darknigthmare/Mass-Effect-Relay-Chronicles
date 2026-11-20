import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkProductionEvidence } from '../scripts/check-production-evidence.mjs';

const filename = 'docs/content-catalog.json';
const proofPath = 'docs/qa/results.json';
const sourcePath = 'src/example.js';
const executable = fileURLToPath(new URL('../scripts/check-production-evidence.mjs', import.meta.url));

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'relay-production-evidence-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['docs/qa', 'docs/universe/catalogs', 'src']) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  await writeFile(path.join(root, sourcePath), 'export const advance = () => 1;');
  await writeFile(path.join(root, proofPath), JSON.stringify({ passed: true, checks: ['Ran the command'] }));
  return root;
}

async function writeCatalog(root, entries, target = filename) {
  const file = path.join(root, target);
  const bytes = JSON.stringify({ entries });
  await writeFile(file, bytes);
  return bytes;
}

test('production check accepts runtime evidence and resolves dependencies across the catalogue set', async t => {
  const root = await fixture(t);
  const input = await writeCatalog(root, [
    { id: 'A', status: 'Intégré', implementationPaths: [sourcePath], dependencies: ['EX-1'] },
    { id: 'B', status: 'Validé', assetPath: sourcePath, evidence: [proofPath] },
    { id: 'C', status: 'Défini', plannedPath: 'src/not-created' },
  ]);
  await writeCatalog(root, [{ id: 'EX-1', status: 'Prototype' }], 'docs/universe/catalogs/EX.json');
  const report = await checkProductionEvidence(root);
  assert.equal(report.passed, true);
  assert.deepEqual(report.statuses, { Défini: 1, Prototype: 1, Intégré: 1, Validé: 1 });
  assert.equal(report.catalogues, 2);
  assert.equal(await readFile(path.join(root, filename), 'utf8'), input);
});

test('a real asset does not excuse a missing, empty, external or directory implementation path', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'src/empty.js'), '');
  await writeCatalog(root, [
    { id: 'missing', status: 'Intégré', assetPath: sourcePath, implementationPaths: ['src/missing.js'] },
    { id: 'directory', status: 'Intégré', implementationPaths: ['src'] },
    { id: 'empty', status: 'Intégré', implementationPaths: ['src/empty.js'] },
    { id: 'external', status: 'Intégré', implementationPaths: ['../project.js', 'https://example.test/file', 'C:\\project\\file.js'] },
    { id: 'planned', status: 'Intégré', plannedPath: sourcePath },
    { id: 'report-for-runtime', status: 'Intégré', implementationPaths: [proofPath] },
    { id: 'broken-dependency', status: 'Intégré', implementationPaths: [sourcePath], dependencies: ['unknown'] },
    { id: 'invalid-status', status: 'Published', implementationPaths: [sourcePath] },
  ]);
  const report = await checkProductionEvidence(root);
  assert.equal(report.passed, false);
  assert.deepEqual(report.findings.filter(({ id }) => id === 'missing').map(({ reason }) => reason), ['missing']);
  for (const [id, reason] of [['directory', 'directory'], ['empty', 'empty-file'], ['external', 'invalid-project-path'],
    ['planned', 'missing-implementation-file'], ['report-for-runtime', 'missing-implementation-file'],
    ['broken-dependency', 'unknown-dependency'], ['invalid-status', 'unknown-status']]) {
    assert.ok(report.findings.some(finding => finding.id === id && finding.reason === reason), id);
  }
});

test('an external file reached through a project symlink is refused', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(path.join(outside, 'src'), path.join(root, 'src/external'), process.platform === 'win32' ? 'junction' : 'dir');
  await writeCatalog(root, [{ id: 'A', status: 'Intégré', implementationPaths: ['src/external/example.js'] }]);
  const report = await checkProductionEvidence(root);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some(({ reason }) => reason === 'outside-project'));
});

test('validated status needs a positive execution report and every declared path must resolve', async t => {
  const root = await fixture(t);
  for (const [name, content] of Object.entries({
    failed: { passed: false, checks: ['Execution failed'] },
    blank: { passed: true },
    selfcheck: { passed: true, selfcheckOnly: true, checks: ['No product test'] },
  })) await writeFile(path.join(root, 'docs/qa', `${name}.json`), JSON.stringify(content));
  await writeFile(path.join(root, 'docs/qa/invalid.json'), '{');
  await writeCatalog(root, [
    ...['failed', 'blank', 'selfcheck', 'invalid'].map(id => ({
      id, status: 'Validé', assetPath: sourcePath, evidence: [`docs/qa/${id}.json`],
    })),
    { id: 'missing-link', status: 'Validé', assetPath: sourcePath, evidence: [proofPath, 'docs/qa/missing.json'] },
    { id: 'legacy-lookalike', status: 'Validé', assetPath: sourcePath, notes: `Preuve : ${proofPath}.` },
  ]);
  const report = await checkProductionEvidence(root);
  assert.equal(report.passed, false);
  const unproved = report.findings.filter(({ reason }) => reason === 'missing-positive-execution-report').map(({ id }) => id);
  assert.deepEqual(unproved, ['failed', 'blank', 'selfcheck', 'invalid', 'legacy-lookalike']);
  assert.ok(report.findings.some(({ id, reason }) => id === 'invalid' && reason === 'invalid-json-report'));
  assert.ok(report.findings.some(({ id, reason }) => id === 'missing-link' && reason === 'missing'));
});

test('the CLI fails a missing proof even when it writes a report at that path, and preserves the report on retry', async t => {
  const root = await fixture(t);
  const output = 'docs/qa/new-report.json';
  await writeCatalog(root, [{ id: 'A', status: 'Validé', assetPath: sourcePath, evidence: [output] }]);
  const run = () => spawnSync(process.execPath, [executable, '--root', root, '--output', output], { encoding: 'utf8' });
  const first = run();
  assert.equal(first.status, 1, first.stderr);
  const reportPath = path.join(root, output);
  const outputBytes = await readFile(reportPath, 'utf8');
  const report = JSON.parse(outputBytes);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some(({ reason, value }) => reason === 'missing' && value === output));
  const retry = run();
  assert.equal(retry.status, 1);
  assert.match(retry.stderr, /EEXIST/);
  assert.equal(await readFile(reportPath, 'utf8'), outputBytes);
});

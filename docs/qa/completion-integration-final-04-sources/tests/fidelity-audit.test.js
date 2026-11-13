import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { auditCatalog, auditProject, inspectProjectPath, writeReport } from '../scripts/audit-fidelity.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'relay-fidelity-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'assets', 'sprite.png'), 'fixture asset');
  return root;
}

test('audit separates declared progress, real files, planned directories and canonical fidelity', async t => {
  const root = await fixture(t);
  const catalog = {
    sources: [{ id: 'manual', title: 'Manual', url: 'https://example.test/manual' }],
    entries: [
      { id: 'A', name: 'Sprite', category: 'sprites', status: 'Prototype', canonLevel: 'Confirmé', sourceId: 'manual', acceptance: 'Compare the costume.', assetPath: 'assets/sprite.png', plannedPath: 'assets', dependencies: [] },
      { id: 'B', name: 'Mission', category: 'missions', status: 'Défini', canonLevel: 'Adaptation', assetPath: 'assets/missing.json', dependencies: ['A'] },
      { id: 'C', name: 'Tested source', category: 'systems', status: 'Validé', canonLevel: 'Confirmé', assetPath: 'assets/sprite.png', dependencies: [] },
    ],
  };
  const before = JSON.stringify(catalog);
  const report = await auditCatalog(catalog, { root });
  assert.equal(JSON.stringify(catalog), before, 'Auditing cannot promote or mutate records.');
  assert.deepEqual(report.statuses, { 'Défini': 1, Prototype: 1, 'Intégré': 0, 'Validé': 1 });
  assert.equal(report.backlog.length, 2);
  assert.equal(report.validatedDeclarations.length, 1);
  assert.equal(report.evidence.technicalFileCount, 2);
  assert.equal(report.evidence.plannedFileCount, 0);
  assert.equal(report.evidence.plannedDirectoryCount, 1);
  const sprite = report.backlog.find(entry => entry.id === 'A');
  assert.equal(sprite.technicalEvidence.asset.isFile, true);
  assert.equal(sprite.technicalEvidence.planned.kind, 'directory');
  assert.equal(sprite.canonicalEvidence.factDeclaredEstablished, true);
  assert.equal(sprite.canonicalEvidence.hasSourceReference, true);
  assert.equal(sprite.canonicalEvidence.fidelityAssessment, 'not-assessed');
  assert.equal(report.validatedDeclarations[0].canonicalEvidence.fidelityAssessment, 'not-assessed');
  assert.deepEqual(report.integrity.missingDependencies, []);
});

test('audit reports invalid or duplicate IDs and unresolved dependencies without creating evidence', async t => {
  const root = await fixture(t);
  const report = await auditCatalog({ entries: [
    { id: 'A', status: 'Défini', dependencies: ['missing'] },
    { id: 'A', status: 'Prototype', dependencies: 'A' },
    { name: 'No ID', status: 'Défini' },
  ] }, { root });
  assert.deepEqual(report.integrity.duplicateIds, ['A']);
  assert.deepEqual(report.integrity.invalidIds, [2]);
  assert.deepEqual(report.integrity.invalidDependencies, ['A']);
  assert.deepEqual(report.integrity.missingDependencies, [{ id: 'A', dependency: 'missing' }]);
  assert.equal(report.evidence.technicalFileCount, 0);
  assert.equal(report.backlog[0].technicalEvidence.asset.kind, 'undeclared');
});

test('file evidence rejects paths and symbolic links outside the project', async t => {
  const root = await fixture(t);
  const outside = await mkdtemp(path.join(tmpdir(), 'relay-fidelity-external-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(path.join(outside, 'secret.txt'), 'not read by audit');
  await symlink(path.join(outside, 'secret.txt'), path.join(root, 'assets', 'external'));
  assert.equal((await inspectProjectPath(root, '../unrelated')).kind, 'outside-project');
  const linked = await inspectProjectPath(root, 'assets/external');
  assert.equal(linked.kind, 'outside-project');
  assert.equal(linked.isFile, false);
  assert.equal(linked.withinRoot, false);
});

test('project audit optionally includes extensions, resolves dependencies and leaves catalogue bytes intact', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'docs', 'universe', 'catalogs'), { recursive: true });
  const mainPath = path.join(root, 'docs', 'content-catalog.json');
  const mainBytes = JSON.stringify({ entries: [{ id: 'MAIN-A', name: 'First', status: 'Prototype' }] });
  await writeFile(mainPath, mainBytes);
  await writeFile(path.join(root, 'docs', 'universe', 'catalogs', 'EX.json'), JSON.stringify({
    id: 'EX', sources: [{ id: 'EX-source', url: 'https://example.test/book' }],
    entries: [{ id: 'EX-A', name: 'Extension', category: 'worlds', status: 'Défini', nature: 'Établi', sourceIds: ['EX-source'], dependencies: ['MAIN-A'] }],
  }));
  const main = await auditProject({ root });
  assert.equal(main.summary.catalogs, 1);
  assert.equal(main.summary.entries, 1);
  const extended = await auditProject({ root, includeUniverse: true });
  assert.equal(extended.summary.catalogs, 2);
  assert.equal(extended.summary.entries, 2);
  assert.equal(extended.summary.missingDependencies, 0);
  assert.equal(extended.catalogs[1].backlog[0].episode, 'EX');
  assert.equal(extended.catalogs[1].backlog[0].canonLevel, 'Établi');
  assert.equal(extended.catalogs[1].backlog[0].sources[0].id, 'EX-source');
  const output = path.join(root, 'test-results', 'report.json');
  await writeReport(extended, output);
  assert.equal(JSON.parse(await readFile(output, 'utf8')).summary.entries, 2);
  assert.equal(await readFile(mainPath, 'utf8'), mainBytes);
});

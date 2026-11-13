import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parseWorkbookOptions, validateWorkbookSelection, planWorkbookPreviews, checkedProjectFile, checkDeclaredProofs, sha256 } from '../scripts/universe-workbook-tools.mjs';
import { loadProductionCatalogs, inventoryBacklog, prepareProgressPlan, applyProgressPlan } from '../scripts/catalog-progress.mjs';

const run = promisify(execFile);
const categories = [{ id: 'characters', sheetName: 'Personnages' }, { id: 'powers', sheetName: 'Pouvoirs' }];
const exampleBook = () => ({ id: 'ME2', sources: [{ id: 'SOURCE' }], coverage: [{}], entries: [
  { id: 'ME2-CHR-FIRST', category: 'characters', status: 'Prototype' },
  ...Array.from({ length: 15 }, (_, index) => ({ id: `ME2-POW-${index}`, category: 'powers', status: index >= 12 ? 'Prototype' : 'Défini' })),
] });

test('focus previews include late rows and source columns without rendering all opening pages', () => {
  const book = exampleBook(), snapshot = JSON.stringify(book);
  const options = parseWorkbookOptions(['--focus-status', 'Prototype']);
  const previews = planWorkbookPreviews(book, categories, options);
  const power = previews.filter(preview => preview.sheetName === 'Pouvoirs');
  assert.deepEqual(power.map(preview => preview.range), ['A19:H21', 'I19:P21', 'Q19:S21']);
  assert.deepEqual(power[0].selectedIds, ['ME2-POW-12', 'ME2-POW-13', 'ME2-POW-14']);
  assert.ok(previews.every(preview => preview.kind === 'focus'));
  assert.equal(JSON.stringify(book), snapshot);
});

test('explicit sheets and ID whitelist intersect focus, while no-render takes priority', () => {
  const book = exampleBook();
  const options = parseWorkbookOptions(['--render-sheets', 'Pouvoirs', '--focus-status', 'Prototype', '--focus-ids', 'ME2-POW-14']);
  assert.deepEqual(validateWorkbookSelection([book], categories, options), [book]);
  const previews = planWorkbookPreviews(book, categories, options);
  assert.equal(previews.length, 4);
  assert.ok(previews.every(preview => preview.sheetName === 'Pouvoirs'));
  assert.deepEqual(previews.filter(preview => preview.kind === 'focus').map(preview => preview.range), ['A21:H21', 'I21:P21', 'Q21:S21']);
  assert.deepEqual(planWorkbookPreviews(book, categories, { ...options, noRender: true }), []);
  assert.throws(() => parseWorkbookOptions(['--ids', 'ME2,ME2']), /duplicate/);
  assert.throws(() => parseWorkbookOptions(['--focus-status', 'Terminé']), /Unknown focus/);
  assert.throws(() => validateWorkbookSelection([book], categories, { focusIds: ['missing'] }), /Focus IDs/);
  assert.throws(() => validateWorkbookSelection([book], categories, { renderSheets: ['Wrong'] }), /worksheet/);
  assert.throws(() => validateWorkbookSelection([book, book], categories, {}), /Duplicate catalogue/);
});

test('render windows stay short even when a whole late block advances', () => {
  const book = exampleBook();
  for (const entry of book.entries) entry.status = 'Prototype';
  const previews = planWorkbookPreviews(book, categories, { focusStatus: ['Prototype'] });
  for (const preview of previews) {
    const [, start, end] = /^[A-Z]+(\d+):[A-Z]+(\d+)$/.exec(preview.range);
    assert.ok(Number(end) - Number(start) < 4);
  }
  const shown = new Set(previews.flatMap(preview => preview.selectedIds));
  assert.deepEqual(shown, new Set(book.entries.map(entry => entry.id)));
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'relay-catalog-progress-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const directory of ['docs/universe/catalogs', 'src', 'tests', 'test-results']) await fs.mkdir(path.join(root, directory), { recursive: true });
  const entry = id => ({ id, category: 'powers', name: id, status: 'Défini', nature: 'Établi', description: 'Original fact, unchanged.', sourceIds: ['SOURCE'], conditions: 'Original condition.', reference: 'Original reference.' });
  const book = { id: 'ME2', sources: [{ id: 'SOURCE', url: 'https://example.test/source' }], entries: [entry('ME2-POW-FIRST'), entry('ME2-POW-SECOND')] };
  await fs.writeFile(path.join(root, 'docs/content-catalog.json'), JSON.stringify({ sources: [], entries: [{ id: 'SYS-main', status: 'Défini', canonLevel: 'Adaptation', category: 'systems' }] }, null, 2));
  const catalogPath = path.join(root, 'docs/universe/catalogs/ME2.json');
  await fs.writeFile(catalogPath, JSON.stringify(book, null, 2));
  await fs.writeFile(path.join(root, 'src/powers.js'), 'export const implemented = true;\n');
  await fs.writeFile(path.join(root, 'tests/powers.test.js'), '// Test fixture evidence\n');
  const report = JSON.stringify({ passed: true, unrelated: 'kept' });
  await fs.writeFile(path.join(root, 'test-results/powers.json'), report);
  const plan = { version: 1, reason: 'Explicitly reviewed prototype fixture', changes: [{
    catalogId: 'ME2', id: 'ME2-POW-FIRST', fromStatus: 'Défini', toStatus: 'Prototype',
    implementationPaths: ['src/powers.js'], evidence: ['tests/powers.test.js', 'test-results/powers.json'],
    validation: { reportPath: 'test-results/powers.json', sha256: sha256(report), resultPointer: '/passed' },
  }] };
  return { root, book, catalogPath, plan };
}

test('a dry-run does not promote existing files, and an explicit apply preserves every source field', async t => {
  const f = await fixture(t), before = await fs.readFile(f.catalogPath);
  const inventory = inventoryBacklog(await loadProductionCatalogs(f.root), { catalogIds: ['ME2'], categories: ['powers'] });
  assert.equal(inventory.selectedCount, 2);
  const prepared = await prepareProgressPlan(f.plan, f.root);
  assert.equal(prepared.summary.changedRecords, 1);
  assert.deepEqual(await fs.readFile(f.catalogPath), before);
  assert.equal(await checkDeclaredProofs({ id: 'unpromoted', status: 'Défini' }, f.root), null);
  const applied = await applyProgressPlan(prepared);
  assert.equal(applied.applied, true);
  const current = JSON.parse(await fs.readFile(f.catalogPath, 'utf8'));
  assert.equal(current.entries[0].status, 'Prototype');
  for (const key of ['description', 'nature', 'sourceIds', 'conditions', 'reference']) assert.deepEqual(current.entries[0][key], f.book.entries[0][key]);
  assert.deepEqual(current.entries[1], f.book.entries[1]);
  assert.deepEqual(current.sources, f.book.sources);
});

test('unknown/duplicate IDs, canon edits and advanced statuses fail before any catalogue write', async t => {
  const f = await fixture(t), original = await fs.readFile(f.catalogPath);
  for (const mutation of [
    plan => plan.changes.push(structuredClone(plan.changes[0])),
    plan => { plan.changes[0].id = 'ME2-POW-UNKNOWN'; },
    plan => { plan.changes[0].nature = 'Établi'; },
    plan => { plan.changes[0].toStatus = 'Validé'; },
    plan => { plan.changes[0].fromStatus = 'Prototype'; },
  ]) {
    const plan = structuredClone(f.plan); mutation(plan);
    await assert.rejects(prepareProgressPlan(plan, f.root));
    assert.deepEqual(await fs.readFile(f.catalogPath), original);
  }
});

test('reports need exact hashes and boolean positive results, with existing local evidence', async t => {
  const f = await fixture(t);
  const badHash = structuredClone(f.plan); badHash.changes[0].validation.sha256 = '0'.repeat(64);
  await assert.rejects(prepareProgressPlan(badHash, f.root), /SHA-256 differs/);
  const missing = structuredClone(f.plan); missing.changes[0].evidence = ['tests/missing.js', 'test-results/powers.json'];
  await assert.rejects(prepareProgressPlan(missing, f.root), /ENOENT/);
  const reportMissing = structuredClone(f.plan); reportMissing.changes[0].evidence = ['tests/powers.test.js'];
  await assert.rejects(prepareProgressPlan(reportMissing, f.root), /included explicitly/);
  const report = JSON.stringify({ passed: 'true' });
  await fs.writeFile(path.join(f.root, 'test-results/powers.json'), report);
  const truthy = structuredClone(f.plan); truthy.changes[0].validation.sha256 = sha256(report);
  await assert.rejects(prepareProgressPlan(truthy, f.root), /positive boolean/);
});

test('proofs and reports cannot traverse outside the project or pass through symlinks', async t => {
  const f = await fixture(t);
  await fs.symlink(path.join(f.root, 'test-results/powers.json'), path.join(f.root, 'test-results/link.json'));
  await fs.symlink(path.join(f.root, 'test-results'), path.join(f.root, 'linked-directory'));
  for (const declared of ['../outside.json', '/tmp/outside.json', 'C:\\outside.json', 'test-results/link.json', 'linked-directory/powers.json']) {
    await assert.rejects(checkedProjectFile(f.root, declared));
  }
  const linked = structuredClone(f.plan); linked.changes[0].validation.reportPath = 'test-results/link.json';
  await assert.rejects(prepareProgressPlan(linked, f.root), /Symlink/);
});

test('stale catalogue, report or implementation snapshots prevent apply', async t => {
  for (const target of ['docs/universe/catalogs/ME2.json', 'test-results/powers.json', 'src/powers.js']) {
    const f = await fixture(t), prepared = await prepareProgressPlan(f.plan, f.root), before = await fs.readFile(f.catalogPath);
    await fs.appendFile(path.join(f.root, target), '\n ');
    await assert.rejects(applyProgressPlan(prepared), /changed|differs/);
    if (target !== 'docs/universe/catalogs/ME2.json') assert.deepEqual(await fs.readFile(f.catalogPath), before);
  }
});

test('programmatic plans reject symbols, accessors, custom prototypes and cycles without evaluating them', async t => {
  const f = await fixture(t); let calls = 0;
  const getter = structuredClone(f.plan);
  Object.defineProperty(getter, 'reason', { enumerable: true, get() { calls++; return 'untrusted'; } });
  const symbol = structuredClone(f.plan); symbol[Symbol('hidden')] = true;
  const cycle = structuredClone(f.plan); cycle.changes.push(cycle);
  const inherited = Object.assign(Object.create({ reason: 'inherited' }), f.plan);
  for (const plan of [getter, symbol, cycle, inherited]) await assert.rejects(prepareProgressPlan(plan, f.root));
  assert.equal(calls, 0);
});

test('builder preview planning runs without the spreadsheet runtime and leaves exports untouched', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const workbook = path.join(root, 'docs/universe/outputs/relay-chronicles-20261022/Mass_Effect_3_Production.xlsx');
  const before = sha256(await fs.readFile(workbook));
  const env = { ...process.env }; delete env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  const { stdout } = await run(process.execPath, ['scripts/build-universe-workbooks.mjs', '--ids', 'ME3', '--focus-ids', 'ME3-EQP-BARREL,ME3-EQP-MAGAZINE', '--plan-previews'], { cwd: root, env });
  const report = JSON.parse(stdout);
  assert.equal(report.readOnly, true);
  assert.equal(report.workbooks.length, 1);
  assert.deepEqual(new Set(report.workbooks[0].previews.flatMap(preview => preview.selectedIds)), new Set(['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE']));
  assert.equal(sha256(await fs.readFile(workbook)), before);
});

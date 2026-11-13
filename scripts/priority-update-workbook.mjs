// Author candidates after current native/DEV/opened-image gates. This command
// never writes the public catalogue, workbook or asset manifest.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, GLOBAL_PROOF, IMMUTABLE_FIELDS, describeCurrentFormations, readFeatureSources, sha } from './priority-workbook-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const outputDir = option('--output-dir'), scopePath = option('--scope'), reportPath = option('--report');
const gates = [['integration', option('--integration-report')], ['development', option('--development-report')], ['visual', option('--visual-review')]];
assert.ok(outputDir && scopePath && reportPath && gates.every(([, filename]) => filename));
try { await fs.access(reportPath); throw Error('Preserve the existing update report and choose new outputs.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const destination = path.resolve(outputDir);
const baseline = JSON.parse(await fs.readFile(path.join(root, 'docs/qa/priority-workbook-baseline.json')));
const scopeRaw = await fs.readFile(scopePath), scope = JSON.parse(scopeRaw);
assert.equal(scope.baseCommit, BASE_COMMIT); assert.equal(baseline.baselineCommit, BASE_COMMIT);
assert.deepEqual(scope.newIds, []); assert.deepEqual(scope.immutableExistingFields, IMMUTABLE_FIELDS);
assert.equal(scope.changedIds.length, new Set(scope.changedIds).size); assert.ok(scope.changedIds.length > 23);
assert.ok(Array.isArray(scope.featureSourcePaths) && scope.featureSourcePaths.length > 4);
for (const proposal of scope.proposalSources) assert.equal(sha(await fs.readFile(path.resolve(root, proposal.path))), proposal.sha256, `Scope proposal changed: ${proposal.path}`);
const sourceWorkbook = path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx');
const sourceCatalogue = path.join(root, 'docs/content-catalog.json');
for (const filename of [sourceWorkbook, sourceCatalogue]) assert.equal(sha(await fs.readFile(filename)), baseline.sourceHashes[path.relative(root, filename)]);
const featureSourceHashes = await readFeatureSources(root, scope.featureSourcePaths);
const integrationProofs = [], reports = [], combinedHashes = {};
for (const [kind, supplied] of gates) {
  const raw = await fs.readFile(supplied), report = JSON.parse(raw);
  assert.equal(report.passed, true, `No candidate before a positive ${kind} gate.`);
  const sources = report.sourceHashes || report.sources || {};
  assert.ok(!Array.isArray(sources));
  for (const [filename, expected] of Object.entries(sources)) {
    assert.match(expected, /^[a-f0-9]{64}$/);
    assert.equal(sha(await fs.readFile(path.resolve(root, filename))), expected, `Stale ${kind}: ${filename}`);
    if (Object.hasOwn(combinedHashes, filename)) assert.equal(combinedHashes[filename], expected);
    combinedHashes[filename] = expected;
  }
  if (kind === 'visual') { assert.equal(report.reviewComplete, true); assert.deepEqual(report.blockingFindings, []); }
  else for (const filename of ['src/main.js', 'src/world.js', 'src/combat.js', 'src/state.js']) assert.ok(sources[filename], `${kind} lacks ${filename}`);
  const snapshot = `docs/qa/${path.basename(reportPath, '.json')}-${kind}-gate.json`;
  try { await fs.access(path.join(root, snapshot)); throw Error(`Preserve the existing gate snapshot: ${snapshot}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.writeFile(path.join(root, snapshot), raw);
  integrationProofs.push({ kind, path: snapshot, source: path.relative(root, path.resolve(supplied)), sha256: sha(raw) });
  reports.push({ kind, report });
}
for (const [filename, expected] of Object.entries(featureSourceHashes)) assert.equal(combinedHashes[filename], expected, `No current gate source for ${filename}`);
const images = reports.flatMap(({ report }) => [report.images, report.imagesReviewed, report.capturesReviewed].filter(Array.isArray).flat());
const captures = reports.filter(({ kind }) => kind !== 'visual').flatMap(({ report }) => report.captureArtifacts || report.captures || report.screenshots || []);
assert.ok(images.length > 0 && captures.length > 0);
for (const capture of captures) {
  assert.equal(sha(await fs.readFile(path.resolve(root, capture.path))), capture.sha256);
  assert.ok(images.some(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true), `Capture not actually opened: ${capture.path}`);
}
const catalogue = JSON.parse(await fs.readFile(sourceCatalogue)), original = structuredClone(catalogue);
assert.equal(catalogue.entries.length, 1385);
const derived = await describeCurrentFormations(original);
const replacements = structuredClone(scope.replacements || {}), additions = scope.additions || {};
for (const [id, fields] of Object.entries(derived.replacements)) {
  replacements[id] ||= {};
  for (const [field, value] of Object.entries(fields)) {
    assert.ok(!Object.hasOwn(replacements[id], field), `Source-derived ${id}.${field} must not be manually overridden`);
    replacements[id][field] = value;
  }
}
const selected = new Set(scope.changedIds), catalogueChanges = [], expectedFieldsById = {}, rowLocations = {};
for (const id of scope.changedIds) {
  const entry = catalogue.entries.find(record => record.id === id); assert.ok(entry, id);
  assert.ok(!['Intégré', 'Validé'].includes(entry.status), `Advanced record is immutable: ${id}`);
  rowLocations[id] = baseline.rowLocations[id]; expectedFieldsById[id] = [];
  for (const [field, following] of Object.entries(replacements[id] || {})) {
    assert.ok(scope.allowedFieldsById[id].includes(field)); assert.ok(!IMMUTABLE_FIELDS.includes(field));
    const before = entry[field] ?? null;
    if (JSON.stringify(before) === JSON.stringify(following)) continue;
    if (field === 'status') { assert.ok(scope.promoteIfProved.includes(id)); assert.equal(before, 'Défini'); assert.equal(following, 'Prototype'); }
    assert.notEqual(field, 'assetStatus', 'No art status change is authorized in this functional lot');
    catalogueChanges.push({ id, field, before, after: following }); entry[field] = following; expectedFieldsById[id].push(field);
  }
  for (const [field, append] of Object.entries(additions[id] || {})) {
    assert.ok(['implementationPaths', 'evidence'].includes(field)); assert.ok(scope.allowedFieldsById[id].includes(field));
    const before = entry[field] ?? null, previous = entry[field] || [], after = [...new Set([...previous, ...append])];
    if (JSON.stringify(previous) === JSON.stringify(after)) continue;
    catalogueChanges.push({ id, field, before, after }); entry[field] = after; expectedFieldsById[id].push(field);
  }
  assert.ok(expectedFieldsById[id].length, `Scoped record did not change: ${id}`);
}
for (const id of [...Object.keys(replacements), ...Object.keys(additions)]) assert.ok(selected.has(id), `Unscoped patch: ${id}`);
for (const id of scope.changedIds) {
  const entry = catalogue.entries.find(record => record.id === id);
  if (entry.assetPath) assert.equal((await fs.stat(path.resolve(root, entry.assetPath))).isFile(), true, `${id}: missing assetPath`);
  for (const filename of [...(additions[id]?.implementationPaths || []), ...(additions[id]?.evidence || [])]) {
    if ([GLOBAL_PROOF, 'docs/qa/priority-workbook-visual-report.json'].includes(filename)) continue;
    assert.equal((await fs.stat(path.resolve(root, filename))).isFile(), true, `${id}: missing scoped evidence/path ${filename}`);
  }
}
for (const [index, before] of original.entries.entries()) {
  const after = catalogue.entries[index]; assert.equal(before.id, after.id);
  for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) if (!selected.has(before.id) || !scope.allowedFieldsById[before.id].includes(field)) assert.deepEqual(after[field], before[field], `${before.id}.${field}`);
}
assert.deepEqual(catalogue.sources, original.sources); assert.deepEqual(catalogue.categories, original.categories); assert.deepEqual(catalogue.meta, original.meta);
await fs.mkdir(destination, { recursive: true });
const cataloguePath = path.join(destination, 'content-catalog.json'), workbookPath = path.join(destination, 'Mass_Effect_Relay_Chronicles_Production.xlsx');
await fs.writeFile(cataloguePath, JSON.stringify(catalogue, null, 2) + '\n');
const planPath = path.join(destination, 'priority-authoring-plan.json');
await fs.writeFile(planPath, JSON.stringify({ baseCommit: BASE_COMMIT, changedIds: scope.changedIds, newIds: [], expectedFieldsById }, null, 2) + '\n');
const authorPath = path.join(destination, 'priority-native-authoring.json');
execFileSync('python', ['scripts/priority-patch-workbook.py', '--before', sourceWorkbook, '--catalog-before', sourceCatalogue,
  '--catalog-after', cataloguePath, '--plan', planPath, '--output', workbookPath, '--report', authorPath], { cwd: root, stdio: 'inherit' });
const nativeAuthoring = JSON.parse(await fs.readFile(authorPath));
assert.deepEqual(nativeAuthoring.appendedRows, []); assert.deepEqual(nativeAuthoring.formulaChanges, []);
const bySheet = new Map();
for (const id of scope.changedIds) {
  const location = rowLocations[id]; assert.ok(location);
  if (!bySheet.has(location.sheetName)) bySheet.set(location.sheetName, []);
  bySheet.get(location.sheetName).push({ id, row: location.row });
}
const previews = [];
for (const [sheetName, rows] of bySheet) {
  rows.sort((a, b) => a.row - b.row);
  const groups = [];
  for (const item of rows) {
    const previous = groups.at(-1);
    if (previous && previous.length < 4 && previous.at(-1).row === item.row - 1) previous.push(item); else groups.push([item]);
  }
  for (const group of groups) {
    const first = group[0].row, last = group.at(-1).row;
    const fields = new Set(group.flatMap(item => expectedFieldsById[item.id]));
    const panels = [['identity', 'A', 'D']];
    if (fields.has('description')) panels.push(['description', 'H', 'I']);
    if (['assetPath', 'gameKey', 'notes'].some(field => fields.has(field))) panels.push(['tracking', 'L', 'Q']);
    for (const [panel, a, b] of panels) previews.push({ ids: group.map(item => item.id), file: `priority-workbook-${sheetName.toLowerCase()}-${first}-${last}-${panel}.png`, sheetName, range: `${a}${first}:${b}${last}` });
  }
}
for (const row of [...new Set(nativeAuthoring.formulaCacheChanges.map(change => Number(change.address.match(/\d+/)[0])))].sort((a, b) => a - b)) {
  previews.push({ file: `priority-workbook-dashboard-${row}-status.png`, sheetName: 'Dashboard', range: `A${row}:F${row}` });
}
const statusCounts = data => Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, data.entries.filter(entry => entry.status === status).length]));
const candidateProbe = catalogueChanges.find(change => change.field === 'status')?.id || derived.formations[0].id;
const probeLocation = baseline.rowLocations[candidateProbe];
const categoryIndex = catalogue.categories.findIndex(category => category.sheetName === probeLocation.sheetName);
const report = { passed: true, generatedAt: new Date().toISOString(), baseCommit: BASE_COMMIT, sourceWorkbook, sourceCatalog: sourceCatalogue,
  workbookPath, cataloguePath, sourceHashes: { workbook: sha(await fs.readFile(sourceWorkbook)), catalogue: sha(await fs.readFile(sourceCatalogue)) },
  outputHashes: { workbook: sha(await fs.readFile(workbookPath)), catalogue: sha(await fs.readFile(cataloguePath)) },
  scopeProof: { path: path.relative(root, path.resolve(scopePath)), sha256: sha(scopeRaw) },
  changedIds: scope.changedIds, newIds: [], catalogueEntries: 1385, unchangedEntries: 1385 - scope.changedIds.length,
  expectedFieldsById, catalogueChanges, rowLocations, featureSourceHashes, integrationProofs,
  beforeStatuses: statusCounts(original), afterStatuses: statusCounts(catalogue),
  nativeAuthoring, cellChanges: nativeAuthoring.cellChanges, rowHeightChanges: nativeAuthoring.rowHeightChanges, previews,
  explicitPromotions: catalogueChanges.filter(change => change.field === 'status').map(change => ({ id: change.id, from: change.before, to: change.after })),
  derivedCorrections: { formations: derived.formations, operations: derived.operationCount, supportedEquipment: derived.supportedEquipment },
  counterProbe: { id: candidateProbe, sheet: probeLocation.sheetName, cell: `C${probeLocation.row}`, dashboardRow: categoryIndex + 10 },
  scope: 'Fixed 1385-record candidate after native/development/actually-opened visual gates. Existing criteria, priorities and source records remain unchanged; independent native validation and actual final workbook panel review precede public copy.' };
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
for (const filename of [sourceWorkbook, sourceCatalogue]) assert.equal(sha(await fs.readFile(filename)), baseline.sourceHashes[path.relative(root, filename)]);
console.log(JSON.stringify({ passed: true, candidateOnly: true, recordsChanged: scope.changedIds.length, cells: report.cellChanges.length, panels: previews.length, statuses: report.afterStatuses }));

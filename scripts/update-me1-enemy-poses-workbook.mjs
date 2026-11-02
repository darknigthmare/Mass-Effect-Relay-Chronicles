import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASE_COMMIT, SUBJECTS, FIELD_COLUMNS, readSubject, replacements, additions, sha } from './me1-enemy-poses-workbook-data.mjs';

const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const outputArgument = option('--output-dir'), proofArgument = option('--integration-report');
if (!outputArgument || !proofArgument) throw Error('Provide --output-dir and --integration-report. Assets and an actual positive integration proof must precede production status changes.');
const outputDir = path.resolve(outputArgument), sourceWorkbook = path.resolve(option('--input') || path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
const sourceCatalog = path.resolve(option('--catalog') || path.join(root, 'docs/content-catalog.json'));
const baseCommit = option('--base-commit'); assert.equal(baseCommit, BASE_COMMIT);
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtime) throw Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const require = createRequire(path.join(runtime, '__me1_enemy_poses_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const integrationPath = path.resolve(proofArgument), integrationBytes = await fs.readFile(integrationPath), integration = JSON.parse(integrationBytes);
assert.equal(integration.passed, true, 'No prototype promotion before a positive runtime proof.');
const integrationSources = Array.isArray(integration.sourceHashes) ? Object.fromEntries(integration.sourceHashes.map(item => [item.path, item.sha256])) : integration.sourceHashes;
assert.ok(integrationSources?.['src/world.js'], 'The integration report must identify its real renderer source.');
assert.equal(integrationSources['src/world.js'], sha(await fs.readFile(path.join(root, 'src/world.js'))));
const subjects = await Promise.all(Object.keys(SUBJECTS).map(key => readSubject(root, key)));
const assetSourceHashes = Object.assign({}, ...subjects.map(subject => subject.hashes));
for (const [assetPath, expected] of Object.entries(assetSourceHashes))
  assert.equal(integrationSources[assetPath], expected, `Runtime proof is not bound to this native asset/config: ${assetPath}`);
const catalogue = JSON.parse(await fs.readFile(sourceCatalog, 'utf8')), originalCatalogue = structuredClone(catalogue);
assert.equal(catalogue.entries.length, 1382); assert.equal(new Set(catalogue.entries.map(entry => entry.id)).size, 1382);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
// Retain effective fills after Artifact Tool import; unused differential styles
// are compared by their actual consumers in the separate native verifier.
for (const category of catalogue.categories) {
  const sheet = workbook.worksheets.getItem(category.sheetName), lastRow = 6 + catalogue.entries.filter(entry => entry.category === category.id).length;
  for (const column of ['C', 'G', 'E']) sheet.getRange(`${column}7:${column}${lastRow}`).conditionalFormats.clear();
  for (const [status, fill, color] of [['Prototype','#FFF1D0','#865000'],['Intégré','#D9EEF2','#0C5966'],['Validé','#DDF1E8','#176A4D']])
    sheet.getRange(`C7:C${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${status}"`, format: { fill, font: { color, bold: true } } });
  sheet.getRange(`G7:G${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"Référence à vérifier"', format: { fill: '#FFF2DC', font: { color: '#79520A' } } });
  sheet.getRange(`E7:E${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"P0"', format: { font: { bold: true, color: '#087F8C' } } });
}
const catalogueChanges = [], cellChanges = [], rowLocations = {};
for (const subject of subjects) {
  const { id } = subject, entries = catalogue.entries.filter(entry => entry.id === id); assert.equal(entries.length, 1);
  const entry = entries[0]; assert.equal(entry.status, 'Défini'); assert.equal(entry.assetStatus, subject.joker ? 'Prototype' : 'À produire');
  const category = catalogue.categories.find(item => item.id === entry.category), sheet = workbook.worksheets.getItem(category.sheetName);
  const rows = catalogue.entries.filter(item => item.category === entry.category), row = rows.findIndex(item => item.id === id) + 7;
  assert.equal(sheet.getRange(`A${row}`).values[0][0], id); rowLocations[id] = { sheetName: category.sheetName, row };
  for (const [field, next] of Object.entries(replacements(subject))) {
    const address = `${FIELD_COLUMNS[field]}${row}`, previous = sheet.getRange(address).values[0][0];
    assert.equal(previous ?? '', entry[field] ?? '', `Catalogue/workbook mismatch: ${id}.${field}`);
    if ((previous ?? '') === (next ?? '')) continue;
    sheet.getRange(address).values = [[next]];
    catalogueChanges.push({ id, field, before: entry[field] ?? null, after: next });
    cellChanges.push({ id, sheet: category.sheetName, address, field, before: previous ?? null, after: next }); entry[field] = next;
  }
  for (const [field, paths] of Object.entries(additions(subject))) {
    const previous = entry[field] || []; assert.ok(Array.isArray(previous));
    const next = [...new Set([...previous, ...paths])];
    catalogueChanges.push({ id, field, before: previous, after: next }); entry[field] = next;
  }
}
const allowedIDs = new Set(subjects.map(subject => subject.id));
for (const [index, before] of originalCatalogue.entries.entries()) {
  const after = catalogue.entries[index];
  if (!allowedIDs.has(before.id)) assert.deepEqual(after, before, `Unrelated entry changed: ${before.id}`);
  else for (const field of Object.keys(before)) if (![...Object.keys(FIELD_COLUMNS), 'implementationPaths', 'evidence'].includes(field)) assert.deepEqual(after[field], before[field]);
}
assert.equal(cellChanges.length, 33); assert.equal(catalogueChanges.length, 43);
const statusCounts = value => Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status => [status, value.entries.filter(entry => entry.status === status).length]));
workbook.recalculate();
const previews = subjects.flatMap(subject => [['identity','A','G'],['criteria','H','I'],['path','K','M'],['tracking','P','Q']].map(([panel, first, last]) => {
  const { sheetName, row } = rowLocations[subject.id]; return { file: `me1-enemy-poses-${subject.key}-${panel}.png`, sheetName, range: `${first}${row}:${last}${row}` };
}));
previews.push({ file: 'me1-enemy-poses-dashboard-sprites.png', sheetName: 'Dashboard', range: 'A30:F30' },
  { file: 'me1-enemy-poses-dashboard-total.png', sheetName: 'Dashboard', range: 'A37:F37' });
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
await fs.mkdir(outputDir, { recursive: true });
const workbookPath = path.join(outputDir, 'Mass_Effect_Relay_Chronicles_Production.xlsx');
await (await SpreadsheetFile.exportXlsx(workbook)).save(workbookPath);
await fs.writeFile(path.join(outputDir, 'content-catalog.json'), JSON.stringify(catalogue, null, 2) + '\n');
const hashFile = async filename => sha(await fs.readFile(filename));
const report = { baseCommit, sourceWorkbook, sourceCatalog, workbookPath,
  sourceHashes: { workbook: await hashFile(sourceWorkbook), catalogue: await hashFile(sourceCatalog) },
  outputHashes: { workbook: await hashFile(workbookPath), catalogue: await hashFile(path.join(outputDir, 'content-catalog.json')) },
  catalogueEntries: catalogue.entries.length, changedIds: subjects.map(subject => subject.id), selectedSubjects: subjects.map(subject => subject.key),
  assetSourceHashes, assets: subjects.map(({ key, id, assetPath, configPath, regions }) => ({ key, id, assetPath, configPath, drawnPoses: regions.length })),
  integrationProof: { path: path.relative(root, integrationPath), sha256: sha(integrationBytes), worldSha256: integrationSources['src/world.js'] },
  catalogueChanges, cellChanges, beforeStatuses: statusCounts(originalCatalogue), afterStatuses: statusCounts(catalogue),
  explicitPromotions: subjects.map(subject => ({ id: subject.id, from: 'Défini', to: 'Prototype', reason: 'Fixed key-pose art integrated in the actual renderer; full cycles and original-game likeness remain incomplete.' })),
  formulaCacheCells: ['C30', 'D30', 'C37', 'D37'].map(address => ({ sheet: 'Dashboard', address, after: workbook.worksheets.getItem('Dashboard').getRange(address).values[0][0] })),
  formulaErrorInspection: errors.ndjson, previews,
  limits: ['No Microsoft Excel launch.', 'Only five existing sprite records are promoted to Prototype; no Intégré or Validé promotion.', 'Joker has two drawings; this report claims only idle cockpit display, not a complete cycle or validated second runtime state.', 'All other entries, catalogue metadata and active workbook formats remain unchanged.'] };
await fs.writeFile(path.join(outputDir, 'me1-enemy-poses-workbook-update.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ workbookPath, changedIds: report.changedIds, changedCells: cellChanges.length, explicitPromotions: 5, beforeStatuses: report.beforeStatuses, afterStatuses: report.afterStatuses }));

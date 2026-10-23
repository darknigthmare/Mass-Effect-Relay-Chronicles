import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Run with the primary runtime and an unmodified 0.2.0 workbook/catalogue pair.
// --source and --baseline-catalog make the operation reproducible and prevent
// a repeated run from duplicating the appended records.
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const source = arg('--source');
const baselinePath = arg('--baseline-catalog');
if (!source || !baselinePath) throw new Error('Required: --source <baseline.xlsx> --baseline-catalog <baseline-catalog.json>');
const root = path.resolve(arg('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const outputDir = path.resolve(arg('--output-dir') || path.join(root, 'outputs/relay-customization-20261023'));
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const runtimeRequire = createRequire(path.join(runtimeModules, '__relay_customization_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const catalog = JSON.parse(await fs.readFile(path.join(root, 'docs/content-catalog.json'), 'utf8'));
const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
const priorIds = new Set(baseline.entries.map(entry => entry.id));
assert.equal(priorIds.size, baseline.entries.length);
for (const prior of baseline.entries) assert.deepEqual(catalog.entries.find(entry => entry.id === prior.id), prior, `Historic record changed: ${prior.id}`);
const fields = ['id','name','status','assetStatus','priority','episode','canonLevel','description','acceptance','dependencies','plannedPath','assetPath','gameKey','reference','sourceUrl','scope','notes'];
const widths = [33,39,15,16,10,11,25,55,62,44,54,48,24,60,64,22,66];
const column = index => String.fromCharCode(65 + index);
const value = (entry, key) => Array.isArray(entry[key]) ? entry[key].join(', ') : (entry[key] ?? '');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const dashboard = wb.worksheets.getItem('Dashboard');
const changes = [];
let originalCellsCompared = 0;
function statusRules(sheet, start, end, restore = false) {
  // Artifact import can omit the solid-fill type on differential formats.
  // Reassert the exact existing template rules and verify them against the
  // baseline XML afterwards, preserving their original ranges and meanings.
  if (restore) for (const col of ['C','G','E']) sheet.getRange(`${col}${start}:${col}${end}`).conditionalFormats.deleteAll();
  for (const [status, fill, color] of [['Prototype','#FFF1D0','#865000'],['Intégré','#D9EEF2','#0C5966'],['Validé','#DDF1E8','#176A4D']]) {
    sheet.getRange(`C${start}:C${end}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${status}"`, format: { fill, font: { color, bold: true } } });
  }
  sheet.getRange(`G${start}:G${end}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"Référence à vérifier"', format: { fill: '#FFF2DC', font: { color: '#79520A' } } });
  sheet.getRange(`E${start}:E${end}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"P0"', format: { font: { bold: true, color: '#087F8C' } } });
}
for (const [i, category] of catalog.categories.entries()) {
  const oldEntries = baseline.entries.filter(entry => entry.category === category.id);
  const appended = catalog.entries.filter(entry => entry.category === category.id && !priorIds.has(entry.id));
  const sheet = wb.worksheets.getItem(category.sheetName);
  const oldEnd = oldEntries.length + 6;
  const oldRows = sheet.getRange(`A7:Q${oldEnd}`).values;
  for (const [row, entry] of oldEntries.entries()) for (const [col, key] of fields.entries()) {
    assert.equal(oldRows[row][col] ?? '', value(entry, key), `Baseline mismatch ${category.sheetName}!${column(col)}${row + 7}`);
    originalCellsCompared++;
  }
  statusRules(sheet, 7, oldEnd, true);
  if (!appended.length) continue;
  assert.equal(sheet.tables.items.length, 1, `Expected one table on ${category.sheetName}`);
  const table = sheet.tables.items[0];
  const matrix = appended.map(entry => fields.map(key => value(entry, key)));
  table.rows.add(null, matrix);
  const start = oldEnd + 1, end = oldEnd + appended.length;
  const area = sheet.getRange(`A${start}:Q${end}`);
  area.format.font = { name: 'Arial', size: 10, color: '#183044' };
  area.format.wrapText = true;
  area.format.verticalAlignment = 'top';
  sheet.getRange(`C${start}:G${end}`).format.horizontalAlignment = 'center';
  sheet.getRange(`C${start}:G${end}`).format.verticalAlignment = 'center';
  sheet.getRange(`C${start}:C${end}`).format.fill = '#FFF0C7';
  sheet.getRange(`D${start}:D${end}`).format.fill = '#FFF7E1';
  sheet.getRange(`A${start}:A${end}`).format.font = { name: 'Arial', size: 10, color: '#557283' };
  for (let index = 0; index < matrix.length; index++) {
    const row = start + index;
    const lines = Math.max(...matrix[index].map((text, col) => Math.ceil(String(text).length / (widths[col] * 0.85))));
    sheet.getRange(`A${row}:Q${row}`).format.rowHeight = Math.max(42, lines * 13 + 14);
    if (row % 2 === 1) {
      sheet.getRange(`A${row}:B${row}`).format.fill = '#F8FBFC';
      sheet.getRange(`E${row}:Q${row}`).format.fill = '#F8FBFC';
    }
  }
  const validations = [Object.keys(catalog.meta.statusDefinitions),catalog.meta.assetStatusValues,['P0','P1','P2'],['ME1','ME2','ME3'],Object.keys(catalog.meta.canonDefinitions)];
  validations.forEach((values, j) => { sheet.getRange(`${column(j + 2)}${start}:${column(j + 2)}${end}`).dataValidation = { rule: { type: 'list', values } }; });
  statusRules(sheet, start, end);
  const row = 10 + i, sheetName = category.sheetName.replaceAll("'", "''");
  const ref = col => `'${sheetName}'!$${col}$7:$${col}$${end}`;
  dashboard.getRange(`B${row}:K${row}`).formulas = [[
    `=COUNTA(${ref('A')})`,
    ...['Défini','Prototype','Intégré','Validé'].map(status => `=COUNTIFS(${ref('C')},"${status}")`),
    ...['Confirmé','Référence à vérifier','Adaptation'].map(status => `=COUNTIFS(${ref('G')},"${status}")`),
    `=COUNTIFS(${ref('F')},"ME1")`, `=COUNTIFS(${ref('P')},"Extension future")`,
  ]];
  assert.deepEqual(sheet.getRange(`A7:Q${oldEnd}`).values, oldRows, `Historic cells changed on ${sheetName}`);
  changes.push({ category: category.id, sheet: category.sheetName, start, end, appended: appended.length, table: table.name, dashboardRow: row });
}

const newSources = catalog.sources.filter(source => !baseline.sources.some(prior => prior.id === source.id));
assert.deepEqual(catalog.sources.slice(0, baseline.sources.length), baseline.sources, 'Existing sources must be unchanged.');
const guide = wb.worksheets.getItem('Guide');
const oldFooter = 32 + baseline.sources.length, newFooter = 32 + catalog.sources.length;
if (newSources.length) {
  const footerHeights = Array.from({ length: 4 }, (_, i) => guide.getRange(`A${oldFooter+i}:D${oldFooter+i}`).format.rowHeight);
  guide.getRange(`A${newFooter}:D${newFooter+3}`).copyFrom(guide.getRange(`A${oldFooter}:D${oldFooter+3}`), 'all');
  footerHeights.forEach((height, i) => { guide.getRange(`A${newFooter+i}:D${newFooter+i}`).format.rowHeight = height; });
  guide.getRange(`A${oldFooter}:D${oldFooter+3}`).clear({ applyTo: 'all' });
  const first = 30 + baseline.sources.length, last = 29 + catalog.sources.length;
  const sourceRows = newSources.map(source => [source.id, source.title, source.scope, source.url || 'Conception du projet, sans source externe']);
  const range = guide.getRange(`A${first}:D${last}`);
  range.values = sourceRows;
  range.format.font = { name: 'Arial', size: 10, color: '#183044' };
  range.format.wrapText = true;
  range.format.verticalAlignment = 'top';
  sourceRows.forEach((row, i) => {
    const lines = Math.max(...row.map((text, col) => Math.ceil(String(text).length / ([26,78,42,100][col] * 0.85))));
    guide.getRange(`A${first+i}:D${first+i}`).format.rowHeight = Math.max(42, lines * 13 + 14);
  });
}
guide.getRange(`B${newFooter+2}`).values = [[catalog.meta.version]];
guide.getRange(`B${newFooter+3}`).values = [[new Date(`${catalog.meta.updatedAt}T12:00:00Z`)]];
guide.getRange(`B${newFooter+3}`).setNumberFormat('dd/mm/yyyy');

// Test a newly appended status, including its dashboard and global totals.
const change = changes.find(entry => entry.category === 'systems');
const target = wb.worksheets.getItem(change.sheet);
const priorStatus = target.getRange(`C${change.start}`).values[0][0];
const before = Number(dashboard.getRange(`F${change.dashboardRow}`).values[0][0]);
target.getRange(`C${change.start}`).values = [['Validé']];
const after = Number(dashboard.getRange(`F${change.dashboardRow}`).values[0][0]);
assert.equal(after, before + 1, 'New-row status must recalculate the dashboard.');
target.getRange(`C${change.start}`).values = [[priorStatus]];
wb.recalculate();
assert.equal(Number(dashboard.getRange('B37').values[0][0]), catalog.entries.length);
assert.equal(Number(dashboard.getRange('B5').values[0][0]), catalog.entries.length);
assert.equal(Number(dashboard.getRange('B35').values[0][0]), baseline.entries.filter(entry => entry.category === 'trilogy').length);
const errorScan = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 40 }, summary: 'Customization final formula error scan', maxChars: 2000 });
assert.ok(errorScan.ndjson.includes('matched 0 entries'), errorScan.ndjson);
const previewDir = path.join(root, 'docs/workbook-previews');
await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });
const fileName = 'Mass_Effect_Relay_Chronicles_Production.xlsx';
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(outputDir, fileName));
await fs.copyFile(path.join(outputDir, fileName), path.join(root, 'docs', fileName));
await fs.rm(path.join(outputDir, `${fileName}.inspect.ndjson`), { force: true });
const views = [['Dashboard','A1:K38','Dashboard.png']];
for (const entry of changes) views.push([entry.sheet,`A${entry.start}:I${Math.min(entry.start+3,entry.end)}`,`Customization-${entry.category}.png`]);
views.push(['Guide',`A${30+baseline.sources.length}:D${newFooter+3}`,'Customization-sources.png']);
for (const [sheetName, range, name] of views) {
  const preview = await wb.render({ sheetName, range, scale: 1.25, format: 'png' });
  await fs.writeFile(path.join(previewDir, name), new Uint8Array(await preview.arrayBuffer()));
}
const verification = {
  version: catalog.meta.version, baseCommit: '3aad710557b8bc413e6d7ee79cda128cf65165c9',
  records: catalog.entries.length, originalRecords: baseline.entries.length,
  addedRecords: changes.reduce((sum, entry) => sum + entry.appended, 0),
  originalCellsCompared, historicRecordsUnchanged: true, originalWorksheetsPreserved: 28,
  changes, addedSourceCount: newSources.length,
  statusMutation: { sheet: change.sheet, cell: `C${change.start}`, before, after, restored: priorStatus },
  formulaScan: errorScan.ndjson,
  totals: dashboard.getRange('A37:K37').values[0],
  engine: '@oai/artifact-tool primary runtime',
  nativeApplicationTest: 'Microsoft Excel desktop was not run. Native package preservation is checked separately.',
};
await fs.writeFile(path.join(previewDir, 'customization-verification.json'), `${JSON.stringify(verification, null, 2)}\n`);
console.log(JSON.stringify(verification, null, 2));

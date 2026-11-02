import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASE_COMMIT, IDS, PROMOTED_IDS, CACHE_CELLS, FIELD_COLUMNS, readAssets, replacements, additions, synchronizeCoverage, sha } from './eden-immersion-workbook-data.mjs';

const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const output = option('--output-dir'), integrationArgument = option('--integration-report'), manifestArgument = option('--manifest');
if (!output || !integrationArgument || !manifestArgument) throw Error('Provide --output-dir, --integration-report and --manifest. A separate --asset-integration-report may supply the actual sprite proof.');
assert.equal(option('--base-commit'), BASE_COMMIT);
const outputDir = path.resolve(output), sourceWorkbook = path.resolve(option('--input') || path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
const sourceCatalogue = path.resolve(option('--catalog') || path.join(root, 'docs/content-catalog.json'));
const baseline = JSON.parse(await fs.readFile(path.join(root, 'docs/qa/eden-immersion-workbook-baseline.json')));
assert.equal(baseline.baselineCommit, BASE_COMMIT); assert.deepEqual(baseline.selectedIDs, IDS);
assert.equal(sha(await fs.readFile(sourceWorkbook)), baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
assert.equal(sha(await fs.readFile(sourceCatalogue)), baseline.sourceHashes['docs/content-catalog.json']);
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtime) throw Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const require = createRequire(path.join(runtime, '__eden_immersion_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);

const integrationPaths = [...new Set([integrationArgument, option('--asset-integration-report')].filter(Boolean).map(name => path.resolve(name)))];
const integrationProofs = [], integrationSources = {};
for (const filename of integrationPaths) {
  const raw = await fs.readFile(filename), report = JSON.parse(raw); assert.equal(report.passed, true, `No promotion before a positive integration proof: ${filename}`);
  const sources = Array.isArray(report.sourceHashes) ? Object.fromEntries(report.sourceHashes.map(item => [item.path, item.sha256])) : report.sourceHashes;
  assert.ok(sources?.['src/world.js']); assert.equal(sources['src/world.js'], sha(await fs.readFile(path.join(root, 'src/world.js'))));
  for (const [name, digest] of Object.entries(sources)) {
    assert.equal(typeof digest, 'string'); assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(digest, sha(await fs.readFile(path.resolve(root, name))), `Integration source is no longer current: ${name}`);
    if (Object.hasOwn(integrationSources, name)) assert.equal(integrationSources[name], digest, `Integration phases use different sources: ${name}`);
    integrationSources[name] = digest;
  }
  integrationProofs.push({ path: path.relative(root, filename), sha256: sha(raw), worldSha256: sources['src/world.js'] });
}
const assets = await readAssets(root);
for (const [name, digest] of Object.entries(assets.sourceHashes)) assert.equal(integrationSources[name], digest, `No integration proof bound to the actual asset/config: ${name}`);
for (const name of ['src/level-layout-data.js', 'src/eden-scene.js', 'src/world-data.js'])
  assert.equal(integrationSources[name], sha(await fs.readFile(path.join(root, name))), `Level proof has stale or missing source: ${name}`);
const catalogue = JSON.parse(await fs.readFile(sourceCatalogue)), original = structuredClone(catalogue);
assert.equal(catalogue.entries.length, 1382); assert.equal(new Set(catalogue.entries.map(entry => entry.id)).size, 1382);
const manifestPath = path.resolve(manifestArgument), manifest = JSON.parse(await fs.readFile(manifestPath));
assert.equal(manifest.assets.length, 26); assert.equal(manifest.combatKeyPoses, 56);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
// Recreate the imported effective rules; unused differential definitions remain
// explicitly distinguished from active consumer styles in the native verifier.
for (const category of catalogue.categories) {
  const sheet = workbook.worksheets.getItem(category.sheetName), lastRow = 6 + catalogue.entries.filter(entry => entry.category === category.id).length;
  for (const column of ['C', 'G', 'E']) sheet.getRange(`${column}7:${column}${lastRow}`).conditionalFormats.clear();
  for (const [status, fill, color] of [['Prototype','#FFF1D0','#865000'],['Intégré','#D9EEF2','#0C5966'],['Validé','#DDF1E8','#176A4D']])
    sheet.getRange(`C7:C${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${status}"`, format: { fill, font: { color, bold: true } } });
  sheet.getRange(`G7:G${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"Référence à vérifier"', format: { fill: '#FFF2DC', font: { color: '#79520A' } } });
  sheet.getRange(`E7:E${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"P0"', format: { font: { bold: true, color: '#087F8C' } } });
}
const catalogueChanges = [], cellChanges = [], rowLocations = {};
for (const id of IDS) {
  const entry = catalogue.entries.find(entry => entry.id === id); assert.ok(entry, id);
  if (PROMOTED_IDS.includes(id)) { assert.equal(entry.status, 'Défini'); assert.equal(entry.assetStatus, 'À produire'); }
  else { assert.equal(entry.status, 'Prototype'); assert.equal(entry.assetStatus, 'Prototype'); }
  const category = catalogue.categories.find(item => item.id === entry.category), sheet = workbook.worksheets.getItem(category.sheetName);
  const rows = catalogue.entries.filter(item => item.category === entry.category), row = rows.findIndex(item => item.id === id) + 7;
  assert.equal(sheet.getRange(`A${row}`).values[0][0], id); rowLocations[id] = { sheetName: category.sheetName, row };
  for (const [field, next] of Object.entries(replacements(id))) {
    const address = `${FIELD_COLUMNS[field]}${row}`, previous = sheet.getRange(address).values[0][0];
    assert.equal(previous ?? '', entry[field] ?? '', `${id}.${field}`);
    if ((previous ?? '') === (next ?? '')) continue;
    sheet.getRange(address).values = [[next]];
    catalogueChanges.push({ id, field, before: entry[field] ?? null, after: next });
    cellChanges.push({ id, sheet: category.sheetName, address, field, before: previous ?? null, after: next }); entry[field] = next;
  }
  for (const [field, more] of Object.entries(additions(id))) {
    const previous = entry[field] || []; assert.ok(Array.isArray(previous));
    const next = [...new Set([...previous, ...more])]; assert.notDeepEqual(next, previous, `${id}.${field}`);
    catalogueChanges.push({ id, field, before: previous, after: next }); entry[field] = next;
  }
}
const allowedIDs = new Set(IDS), allowedFields = new Set([...Object.keys(FIELD_COLUMNS), 'implementationPaths', 'evidence']);
for (const [index, before] of original.entries.entries()) {
  const after = catalogue.entries[index];
  if (!allowedIDs.has(before.id)) assert.deepEqual(after, before, `Unrelated record changed: ${before.id}`);
  else for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) if (!allowedFields.has(key)) assert.deepEqual(after[key], before[key]);
}
assert.equal(cellChanges.length, 45); assert.equal(catalogueChanges.length, 61);
const coverage = await synchronizeCoverage(root, catalogue, manifest);
const otherMetaBefore = structuredClone(original.meta), otherMetaAfter = structuredClone(catalogue.meta);
delete otherMetaBefore.prototypeCoverage; delete otherMetaAfter.prototypeCoverage; assert.deepEqual(otherMetaAfter, otherMetaBefore);
const statusCounts = value => Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status => [status, value.entries.filter(entry => entry.status === status).length]));
workbook.recalculate();
const previewKeys = ['world', 'agriculture', 'smoke', 'quays', 'krogan', 'rachni', 'map', 'camera'];
const previews = IDS.flatMap((id, index) => [['identity','A','G'],['criteria','H','I'],['path','K','M'],['tracking','P','Q']].map(([panel, first, last]) => {
  const { sheetName, row } = rowLocations[id]; return { id, file: `eden-immersion-${previewKeys[index]}-${panel}.png`, sheetName, range: `${first}${row}:${last}${row}` };
}));
for (const [key, row] of [['scenery', 16], ['sprites', 30], ['total', 37]]) previews.push({ file: `eden-immersion-dashboard-${key}.png`, sheetName: 'Dashboard', range: `A${row}:F${row}` });
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
await fs.mkdir(outputDir, { recursive: true });
const workbookPath = path.join(outputDir, 'Mass_Effect_Relay_Chronicles_Production.xlsx'), cataloguePath = path.join(outputDir, 'content-catalog.json');
await (await SpreadsheetFile.exportXlsx(workbook)).save(workbookPath);
await fs.writeFile(cataloguePath, JSON.stringify(catalogue, null, 2) + '\n');
const report = { passed: true, generatedAt: new Date().toISOString(), baseCommit: BASE_COMMIT,
  sourceWorkbook, sourceCatalog: sourceCatalogue, workbookPath,
  sourceHashes: { workbook: sha(await fs.readFile(sourceWorkbook)), catalogue: sha(await fs.readFile(sourceCatalogue)) },
  outputHashes: { workbook: sha(await fs.readFile(workbookPath)), catalogue: sha(await fs.readFile(cataloguePath)) },
  catalogueEntries: catalogue.entries.length, changedIds: IDS, selectedSubjects: previewKeys, unchangedEntries: 1374,
  assetSourceHashes: assets.sourceHashes, manifestProof: { path: path.relative(root, manifestPath), sha256: sha(await fs.readFile(manifestPath)) },
  integrationProofs, catalogueChanges, cellChanges, prototypeCoverage: coverage,
  beforeStatuses: statusCounts(original), afterStatuses: statusCounts(catalogue),
  explicitPromotions: PROMOTED_IDS.map(id => ({ id, from: 'Défini', to: 'Prototype', reason: 'Scoped generated art or production scenery integrated and inspected; original geography and complete1:1 likeness remain unvalidated.' })),
  formulaCacheCells: CACHE_CELLS.map(address => ({ sheet: 'Dashboard', address, after: workbook.worksheets.getItem('Dashboard').getRange(address).values[0][0] })),
  formulaErrorInspection: errors.ndjson, previews,
  limits: ['No Microsoft Excel launch or complete workbook visual audit.', 'Only eight existing rows and declared prototypeCoverage metadata are changed; no new catalogue ID or canonical fact.',
    'Five scoped records become Prototype. No Intégré or Validé promotion.', 'Nine visual landmarks do not complete nine original levels; train travel, survivors and timed charges remain outside this delivery.',
    'Active native formats, formulas and all unrelated rows are checked separately by the native verifier.'] };
await fs.writeFile(path.join(outputDir, 'eden-immersion-workbook-update.json'), JSON.stringify(report, null, 2) + '\n');
assert.equal(sha(await fs.readFile(sourceWorkbook)), baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
assert.equal(sha(await fs.readFile(sourceCatalogue)), baseline.sourceHashes['docs/content-catalog.json']);
console.log(JSON.stringify({ passed: true, outputDir, changedIds: IDS.length, changedCells: cellChanges.length, promotions: 5, coverageChanges: coverage.changes.length, afterStatuses: report.afterStatuses }));

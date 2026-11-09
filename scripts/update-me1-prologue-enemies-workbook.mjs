import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BASE_COMMIT, IDS, PROMOTED_IDS, CACHE_CELLS, FIELD_COLUMNS, readAssets, replacements,
  additions, synchronizeCoverage, sha } from './me1-prologue-enemies-workbook-data.mjs';

const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const output = option('--output-dir'), manifestArgument = option('--manifest');
const gates = [['sprites', option('--integration-report')], ['development', option('--development-report')], ['visual', option('--visual-review')]];
if (!output || !manifestArgument || gates.some(([, value]) => !value))
  throw new Error('Provide --output-dir, --manifest, --integration-report, --development-report and --visual-review.');
assert.equal(option('--base-commit'), BASE_COMMIT);
const sourceWorkbook = path.resolve(option('--input') || path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
const sourceCatalogue = path.resolve(option('--catalog') || path.join(root, 'docs/content-catalog.json'));
const outputDir = path.resolve(output), baseline = JSON.parse(await fs.readFile(path.join(root, 'docs/qa/me1-prologue-enemies-workbook-baseline.json')));
assert.equal(baseline.baselineCommit, BASE_COMMIT); assert.deepEqual(baseline.selectedIDs, IDS);
assert.equal(sha(await fs.readFile(sourceWorkbook)), baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
assert.equal(sha(await fs.readFile(sourceCatalogue)), baseline.sourceHashes['docs/content-catalog.json']);
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES; assert.ok(runtime, 'CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const require = createRequire(path.join(runtime, '__me1_prologue_enemies_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);

const integrationSources = {}, integrationProofs = [], reports = [];
for (const [kind, supplied] of gates) {
  const filename = path.resolve(supplied), raw = await fs.readFile(filename), report = JSON.parse(raw);
  assert.equal(report.passed, true, `No promotion before a positive ${kind} gate.`);
  if (kind === 'sprites') assert.equal(report.cases?.length, 12, 'The twelve new fixed-pose states need integration evidence.');
  if (kind === 'visual') { assert.equal(report.reviewComplete, true); assert.deepEqual(report.blockingFindings, []); }
  const sources = report.sourceHashes || report.sources || {};
  const pairs = Array.isArray(sources) ? sources.map(item => [item.path, item.sha256]) : Object.entries(sources);
  for (const [name, expected] of pairs) {
    assert.match(expected, /^[a-f0-9]{64}$/); assert.equal(sha(await fs.readFile(path.resolve(root, name))), expected, `Stale ${kind} gate: ${name}`);
    if (Object.hasOwn(integrationSources, name)) assert.equal(integrationSources[name], expected);
    integrationSources[name] = expected;
  }
  if (kind !== 'visual') assert.ok(integrationSources['src/world.js'], `${kind} proof must identify its executed world.`);
  const snapshot = `docs/qa/me1-prologue-enemies-workbook-${kind}-gate.json`;
  await fs.writeFile(path.join(root, snapshot), raw);
  integrationProofs.push({ kind, path: snapshot, source: path.relative(root, filename), sha256: sha(raw), worldSha256: integrationSources['src/world.js'] });
  reports.push({ kind, report });
}
assert.equal(integrationSources['src/world.js'], sha(await fs.readFile(path.join(root, 'src/world.js'))));
const assets = await readAssets(root);
for (const [name, digest] of Object.entries(assets.sourceHashes)) {
  if (name.startsWith('public/') || name.startsWith('src/') || name === 'vite.config.js')
    assert.equal(integrationSources[name], digest, `No source-bound integration proof for ${name}`);
}
const captures = report => report.captureArtifacts || report.screenshots || [];
const reviewed = reports.flatMap(({ report }) => [report.imagesReviewed, report.images, report.manualVisualReview?.images,
  report.actualVisualReview?.images].filter(Array.isArray).flat());
assert.ok(reviewed.length > 0, 'Actual opened visual records are required.');
for (const capture of reports.filter(item => item.kind !== 'visual').flatMap(({ report }) => captures(report))) {
  const view = reviewed.find(image => image.path === capture.path && image.sha256 === capture.sha256 && image.actuallyOpened === true);
  assert.ok(view, `Integration capture was not actually opened: ${capture.path}`);
  assert.equal(sha(await fs.readFile(path.join(root, capture.path))), capture.sha256);
}

const catalogue = JSON.parse(await fs.readFile(sourceCatalogue)), original = structuredClone(catalogue);
assert.equal(catalogue.entries.length, 1382); assert.equal(new Set(catalogue.entries.map(entry => entry.id)).size, 1382);
const manifestPath = path.resolve(manifestArgument), manifest = JSON.parse(await fs.readFile(manifestPath));
assert.equal(manifest.assets.length, 29); assert.equal(manifest.combatKeyPoses, 68);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
// Preserve the effective imported formats at their consumers. The exporter may
// retain additional unused differential-style definitions; native QA reports it.
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
  const entry = catalogue.entries.find(entry => entry.id === id); assert.ok(entry);
  const expected = baseline.rowLocations[id]; assert.equal(entry.status, expected.status); assert.equal(entry.assetStatus, expected.assetStatus);
  const sheet = workbook.worksheets.getItem(expected.sheetName), row = expected.row;
  assert.equal(sheet.getRange(`A${row}`).values[0][0], id); rowLocations[id] = { sheetName: expected.sheetName, row };
  for (const [field, next] of Object.entries(replacements(id))) {
    const address = `${FIELD_COLUMNS[field]}${row}`, previous = sheet.getRange(address).values[0][0];
    assert.equal(previous ?? '', entry[field] ?? '', `${id}.${field}`);
    assert.notEqual(previous ?? '', next ?? '', `An authored replacement must change ${id}.${field}`);
    sheet.getRange(address).values = [[next]];
    catalogueChanges.push({ id, field, before: entry[field] ?? null, after: next });
    cellChanges.push({ id, sheet: expected.sheetName, address, field, before: previous ?? null, after: next }); entry[field] = next;
  }
  for (const [field, more] of Object.entries(additions(id))) {
    const previous = entry[field] || []; assert.ok(Array.isArray(previous));
    const next = [...new Set([...previous, ...more])]; assert.notDeepEqual(next, previous);
    catalogueChanges.push({ id, field, before: previous, after: next }); entry[field] = next;
  }
}
const allowedIDs = new Set(IDS), allowedFields = new Set([...Object.keys(FIELD_COLUMNS), 'implementationPaths', 'evidence']);
for (const [index, before] of original.entries.entries()) {
  const after = catalogue.entries[index];
  if (!allowedIDs.has(before.id)) assert.deepEqual(after, before);
  else for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) if (!allowedFields.has(key)) assert.deepEqual(after[key], before[key]);
}
const coverage = await synchronizeCoverage(root, catalogue, manifest);
const oldMeta = structuredClone(original.meta), newMeta = structuredClone(catalogue.meta);
delete oldMeta.prototypeCoverage; delete newMeta.prototypeCoverage; assert.deepEqual(newMeta, oldMeta);
const statusCounts = value => Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status => [status, value.entries.filter(entry => entry.status === status).length]));
workbook.recalculate();
const names = ['jenkins-sprite','jenkins-character','creeper-sprite','creeper-enemy','asari-sprite','asari-enemy','camera'];
const previews = IDS.flatMap((id, index) => [['identity','A','G'],['criteria','H','I'],['path','K','M'],['tracking','P','Q']].map(([panel, first, last]) => {
  const { sheetName, row } = rowLocations[id]; return { id, file: `me1-prologue-enemies-${names[index]}-${panel}.png`, sheetName, range: `${first}${row}:${last}${row}` };
}));
for (const [key, row] of [['sprites',30],['total',37]]) previews.push({ file: `me1-prologue-enemies-dashboard-${key}.png`, sheetName: 'Dashboard', range: `A${row}:F${row}` });
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
await fs.mkdir(outputDir, { recursive: true });
const workbookPath = path.join(outputDir, 'Mass_Effect_Relay_Chronicles_Production.xlsx'), cataloguePath = path.join(outputDir, 'content-catalog.json');
await (await SpreadsheetFile.exportXlsx(workbook)).save(workbookPath); await fs.writeFile(cataloguePath, JSON.stringify(catalogue, null, 2) + '\n');
const report = { passed: true, generatedAt: new Date().toISOString(), baseCommit: BASE_COMMIT,
  scope: 'Seven existing records and seven explicit visual prototypeCoverage keys. Two SPR entries reach Prototype after native, development-public and actually opened visual gates. Parent ENM content/asset statuses remain unchanged; no Intégré or Validé promotion.',
  sourceWorkbook, sourceCatalog: sourceCatalogue, workbookPath,
  sourceHashes: { workbook: sha(await fs.readFile(sourceWorkbook)), catalogue: sha(await fs.readFile(sourceCatalogue)) },
  outputHashes: { workbook: sha(await fs.readFile(workbookPath)), catalogue: sha(await fs.readFile(cataloguePath)) },
  catalogueEntries: catalogue.entries.length, changedIds: IDS, selectedSubjects: names, unchangedEntries: 1375,
  assetSourceHashes: assets.sourceHashes, manifestProof: { path: path.relative(root, manifestPath), sha256: sha(await fs.readFile(manifestPath)) },
  integrationProofs, catalogueChanges, cellChanges, prototypeCoverage: coverage,
  beforeStatuses: statusCounts(original), afterStatuses: statusCounts(catalogue),
  explicitPromotions: PROMOTED_IDS.map(id => ({ id, from: 'Défini', to: 'Prototype', reason: 'Four partial fixed drawings integrated and inspected; no complete original1:1 anatomy, costume or motion certification.' })),
  formulaCacheCells: CACHE_CELLS.map(address => ({ sheet: 'Dashboard', address, after: workbook.worksheets.getItem('Dashboard').getRange(address).values[0][0] })),
  formulaErrorInspection: errors.ndjson, previews,
  limits: ['No Microsoft Excel launch or full-workbook visual audit.', 'Prototype gates use explicit development public controls and native fixtures; the separate final compiled-production journey remains necessary before delivery.',
    'Jenkins availability and narrative death remain distinct from combat KO. The generic asari sprite does not deliver the separate Thorian clone records.',
    'Existing row heights/styles are retained. Native XML preservation and actual30targeted panels are checked separately.'] };
await fs.writeFile(path.join(root, 'docs/qa/me1-prologue-enemies-workbook-update.json'), JSON.stringify(report, null, 2) + '\n');
assert.equal(sha(await fs.readFile(sourceWorkbook)), baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
assert.equal(sha(await fs.readFile(sourceCatalogue)), baseline.sourceHashes['docs/content-catalog.json']);
console.log(JSON.stringify({ passed: true, outputDir, changedIds: IDS.length, changedCells: cellChanges.length, metadataFields: catalogueChanges.length - cellChanges.length,
  promotions: 2, coverageKeys: coverage.changes.length, afterStatuses: report.afterStatuses }));

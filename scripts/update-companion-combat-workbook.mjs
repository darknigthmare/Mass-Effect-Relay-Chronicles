import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Scoped update of up to six existing companion sprite records. Author XLSX only with the primary
// runtime's artifact-tool; verify every unrelated native part after export.
const option = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
};
const root = path.resolve(option('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const outputArgument = option('--output-dir');
if (!outputArgument) throw new Error('--output-dir must identify a dedicated workspace outputs directory.');
const outputDir = path.resolve(outputArgument);
const sourceWorkbook = path.resolve(option('--input') || path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
const sourceCatalog = path.resolve(option('--catalog') || path.join(root, 'docs/content-catalog.json'));
const baseCommit = option('--base-commit');
if (!baseCommit || !/^[0-9a-f]{40}$/.test(baseCommit)) throw new Error('--base-commit must be a complete Git SHA.');
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const runtimeRequire = createRequire(path.join(runtimeModules, '__relay_companion_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const evidencePath = 'docs/qa/companion-combat-report.json';
const artReference = 'docs/research/companion-combat-art.md';
const artEvidence = 'docs/qa/companion-combat-art-report.json';
const characters = {
  ashley: ['SPR-ashley-williams-combat', 'Ashley Williams'],
  kaidan: ['SPR-kaidan-alenko-combat', 'Kaidan Alenko'],
  garrus: ['SPR-garrus-vakarian-combat', 'Garrus Vakarian'],
  wrex: ['SPR-urdnot-wrex-combat', 'Urdnot Wrex'],
  tali: ['SPR-tali-zorah-nar-rayya-combat', "Tali’Zorah nar Rayya"],
  liara: ['SPR-liara-t-soni-combat', 'Liara T’Soni'],
};
const selected = option('--characters')?.split(',') || Object.keys(characters);
if (!selected.length || new Set(selected).size !== selected.length || selected.some(id => !Object.hasOwn(characters, id))) throw Error('Select unique companion IDs from ashley,kaidan,garrus,wrex,tali,liara.');
const changes = {}, additions = {}, assets = [], assetSourceHashes = {};
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
for (const character of selected) {
  const [id, name] = characters[character];
  const configPath = `public/assets/companion-${character}-animation.json`;
  const configBytes = await fs.readFile(path.join(root, configPath)), config = JSON.parse(configBytes);
  if (config.character !== character || config.characterId !== character || config.mediaId !== 'ME1') throw Error(`Unexpected companion identity in ${configPath}.`);
  const combat = config.combat;
  if (typeof combat?.file !== 'string' || path.basename(combat.file) !== combat.file || !combat.file.startsWith(`companion-${character}-`) || !combat.file.endsWith('.png')) throw Error(`Unexpected image path in ${configPath}.`);
  const assetPath = `public/assets/${combat.file}`, imageBytes = await fs.readFile(path.join(root, assetPath));
  if (!imageBytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || imageBytes[24] !== 8 || imageBytes[25] !== 6) throw Error(`Expected native 8-bit RGBA PNG: ${assetPath}.`);
  if (imageBytes.readUInt32BE(16) !== combat.width || imageBytes.readUInt32BE(20) !== combat.height) throw Error(`Config/image dimensions differ: ${assetPath}.`);
  if (JSON.stringify(Object.keys(combat.frames || {}).sort()) !== JSON.stringify(['aim','down','hit','power'])) throw Error(`Expected four fixed combat poses in ${configPath}.`);
  for (const [pose, frame] of Object.entries(combat.frames)) {
    const [x,y,w,h] = frame.rect || [], [px,py] = frame.pivot || [];
    if (![x,y,w,h].every(Number.isInteger) || x<0 || y<0 || w<=0 || h<=0 || x+w>combat.width || y+h>combat.height || ![px,py].every(Number.isFinite) || px<0 || py<0 || px>w || py>h || !Number.isFinite(frame.heightScale) || frame.heightScale<=0 || typeof frame.id !== 'string') throw Error(`Invalid declared crop/pivot for ${character}/${pose}.`);
  }
  assetSourceHashes[configPath] = hashBytes(configBytes); assetSourceHashes[assetPath] = hashBytes(imageBytes);
  assets.push({ character, configPath, assetPath, width: combat.width, height: combat.height, poses: Object.keys(combat.frames), pngSha256: assetSourceHashes[assetPath], configSha256: assetSourceHashes[configPath] });
  changes[id] = {
    description: `${name} ME1 dispose de quatre poses clés de combat : visée, geste d’action, impact et hors combat.`,
    acceptance: 'Contrôler aim/power/hit/down en jeu : cadrages, ancrage, proportions et retour au terrain. Transitions, récupération animée et vues supplémentaires restent à produire.',
    assetPath,
    notes: `Continuité visuelle avec crew-atlas.png. Quatre poses fixes en trois-quarts, arme dessinée indépendante du matériel. Costumes et armes exacts, cycles et récupération restent incomplets. Fidélité 1:1 non validée. QA : ${evidencePath}.`,
  };
  additions[id] = {
    implementationPaths: [assetPath, configPath, 'src/world.js'],
    evidence: [artReference, artEvidence, evidencePath],
  };
}
const fieldColumns = { description: 'H', acceptance: 'I', assetPath: 'L', notes: 'Q' };
const catalogue = JSON.parse(await fs.readFile(sourceCatalog, 'utf8'));
const originalCatalogue = structuredClone(catalogue);
if (!Array.isArray(catalogue.entries) || !Array.isArray(catalogue.categories) || new Set(catalogue.entries.map(entry => entry.id)).size !== catalogue.entries.length) throw new Error('Malformed catalogue structure or duplicate IDs.');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
const catalogueChanges = [], cellChanges = [], rowLocations = {};

// The importer omits patternType=solid from differential fills. Reapply the
// original five catalogue rules via the documented API before exporting.
// Native verification resolves each rule's effective format, preserving all
// existing active styles while reporting any retained unused definitions.
for (const category of catalogue.categories) {
  const sheet = workbook.worksheets.getItem(category.sheetName);
  const lastRow = 6 + catalogue.entries.filter(entry => entry.category === category.id).length;
  for (const column of ['C', 'G', 'E']) sheet.getRange(`${column}7:${column}${lastRow}`).conditionalFormats.clear();
  const statuses = sheet.getRange(`C7:C${lastRow}`);
  for (const [status, fill, color] of [
    ['Prototype', '#FFF1D0', '#865000'],
    ['Intégré', '#D9EEF2', '#0C5966'],
    ['Validé', '#DDF1E8', '#176A4D'],
  ]) statuses.conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${status}"`, format: { fill, font: { color, bold: true } } });
  sheet.getRange(`G7:G${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"Référence à vérifier"', format: { fill: '#FFF2DC', font: { color: '#79520A' } } });
  sheet.getRange(`E7:E${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"P0"', format: { font: { bold: true, color: '#087F8C' } } });
}

for (const [id, replacements] of Object.entries(changes)) {
  const entries = catalogue.entries.filter(entry => entry.id === id);
  if (entries.length !== 1) throw new Error(`Expected one catalogue row for ${id}.`);
  const entry = entries[0];
  if (entry.status !== 'Prototype' || entry.assetStatus !== 'Prototype') throw new Error(`Production status changed for ${id}; review this scoped update.`);
  const category = catalogue.categories.find(item => item.id === entry.category);
  const sheet = workbook.worksheets.getItem(category.sheetName);
  const lastRow = 6 + catalogue.entries.filter(item => item.category === entry.category).length;
  const matches = sheet.getRange(`A7:A${lastRow}`).values.flatMap((row, index) => row[0] === id ? [index + 7] : []);
  if (matches.length !== 1) throw new Error(`Expected one workbook row for ${id}.`);
  const row = matches[0];
  rowLocations[id] = { sheetName: category.sheetName, row };
  for (const [field, next] of Object.entries(replacements)) {
    const address = `${fieldColumns[field]}${row}`;
    const previous = sheet.getRange(address).values[0][0];
    if ((previous ?? '') !== (entry[field] ?? '')) throw new Error(`Catalogue/workbook mismatch before editing ${id}.${field}.`);
    if (previous === next) throw new Error(`The requested update is already present for ${id}.${field}.`);
    sheet.getRange(address).values = [[next]];
    catalogueChanges.push({ id, field, before: entry[field], after: next });
    cellChanges.push({ id, sheet: category.sheetName, address, field, before: previous, after: next });
    entry[field] = next;
  }
  for (const [field, paths] of Object.entries(additions[id])) {
    const previous = entry[field] || [];
    if (!Array.isArray(previous)) throw new Error(`Expected a list for ${id}.${field}.`);
    const next = [...new Set([...previous, ...paths])];
    catalogueChanges.push({ id, field, before: previous, after: next });
    entry[field] = next;
  }
}

for (const [index, before] of originalCatalogue.entries.entries()) {
  const after = catalogue.entries[index];
  const allowed = new Set([...Object.keys(changes[before.id] || {}), ...Object.keys(additions[before.id] || {})]);
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!allowed.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key])) throw new Error(`Unexpected catalogue mutation: ${before.id}.${key}.`);
  }
}
if (cellChanges.length !== selected.length * 4 || catalogueChanges.length !== selected.length * 6) throw new Error('Unexpected scope: four text cells and two metadata fields per accepted companion.');
workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });
const previewSpecs = selected.flatMap(character => {
  const id = characters[character][0];
  return [['identity','A','G'],['criteria','H','I'],['path','K','L'],['tracking','P','Q']]
    .map(([panel,first,last]) => [`${character}-${panel}`,id,first,last]);
});
const previews = previewSpecs.map(([name, id, first, last]) => {
  const { sheetName, row } = rowLocations[id];
  return { file: `companion-combat-${name}.png`, sheetName, range: `${first}${row}:${last}${row}` };
});
const renderNames = option('--render-previews')?.split(',');
for (const preview of previews) {
  if (renderNames && !renderNames.includes(preview.file)) continue;
  const blob = await workbook.render({ sheetName: preview.sheetName, range: preview.range, scale: 1, format: 'png' });
  await fs.writeFile(path.join(outputDir, preview.file), new Uint8Array(await blob.arrayBuffer()));
}
const dashboard = workbook.worksheets.getItem('Dashboard');
const beforeStatuses = Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, originalCatalogue.entries.filter(entry => entry.status === status).length]));
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
const inspection = await workbook.inspect({ kind: 'table', range: 'Dashboard!A37:K37', include: 'values,formulas', tableMaxRows: 1, tableMaxCols: 11, maxChars: 2500 });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const workbookPath = path.join(outputDir, 'Mass_Effect_Relay_Chronicles_Production.xlsx');
await xlsx.save(workbookPath);
await fs.writeFile(path.join(outputDir, 'content-catalog.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
const hashFile = async filename => createHash('sha256').update(await fs.readFile(filename)).digest('hex');
await fs.writeFile(path.join(outputDir, 'companion-combat-workbook-update.json'), `${JSON.stringify({
  baseCommit, sourceWorkbook, sourceCatalog, workbookPath,
  sourceHashes: { workbook: await hashFile(sourceWorkbook), catalogue: await hashFile(sourceCatalog) },
  outputHashes: { workbook: await hashFile(workbookPath), catalogue: await hashFile(path.join(outputDir, 'content-catalog.json')) },
  catalogueEntries: catalogue.entries.length, changedIds: Object.keys(changes), selectedCharacters: selected, assets, assetSourceHashes,
  catalogueChanges, cellChanges, beforeStatuses,
  dashboardTotal: dashboard.getRange('B37').values[0][0],
  formulaErrorInspection: errors.ndjson, dashboardInspection: inspection.ndjson, previews,
  limits: ['Native Microsoft Excel was not executed.', 'Gameplay, browser and art checks are recorded separately in the linked reports.', 'Prototype statuses and artistic limitations are preserved.', 'Generic animation-cycle and QA catalogue rows remain unchanged; four fixed key poses do not complete those deliverables.'],
}, null, 2)}\n`);
console.log(JSON.stringify({ workbookPath, changedIds: Object.keys(changes), changedCells: cellChanges.length, changedMetadataFields: catalogueChanges.length - cellChanges.length, catalogueEntries: catalogue.entries.length, beforeStatuses, formulaErrors: errors.ndjson }));

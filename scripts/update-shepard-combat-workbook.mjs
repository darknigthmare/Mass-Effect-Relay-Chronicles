import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Scoped update of six existing records. Author XLSX only with the primary
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
if (baseCommit && !/^[0-9a-f]{40}$/.test(baseCommit)) throw new Error('--base-commit must be a complete Git SHA.');
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const runtimeRequire = createRequire(path.join(runtimeModules, '__relay_shepard_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const evidencePath = 'docs/qa/shepard-combat-poses-report.json';
const artReference = 'docs/research/shepard-male-combat-art.md';
const artEvidence = 'docs/qa/shepard-combat-art-report.json';
const maleAtlas = 'public/assets/shepard-male-combat-atlas.png';
const maleManifest = 'public/assets/shepard-male-animation.json';
const femaleAtlas = 'public/assets/shepard-female-combat-atlas.png';
const femaleManifest = 'public/assets/shepard-female-animation.json';

const changes = {
  'SPR-shepard-combat': {
    description: 'Shepard masculin N7 rejoint l’atlas féminin avec quatre poses clés de combat : visée, pouvoir, impact et hors combat.',
    acceptance: 'Contrôler les poses aim/power/hit/down des deux apparences, sans découpe ni rotation supplémentaire de la pose couchée. Récupération animée à produire.',
    assetPath: maleAtlas,
    notes: `Quatre poses clés en 3/4 fixe. Fusil illustré générique, transitions et variantes par arme à produire. Référence : ${artReference}. QA : ${evidencePath}.`,
  },
  'CUST-ART-armor-preview': {
    description: 'Aperçus Terrain, Visée, Pouvoir, Impact et Hors combat pour les deux apparences, avec les couleurs, le motif et le casque choisis.',
    acceptance: 'Corps lisible et casque aligné, y compris couché, sans masquer les commandes. Combat en 3/4 fixe ; quatre directions disponibles en mode Terrain.',
    notes: `La pose est un état temporaire d’aperçu : aucun effet sur les pouvoirs, les PV ou la sauvegarde. Contrôles : ${evidencePath}. Modèles d’armures exacts à produire.`,
  },
  'CUST-ART-world-palette': {
    description: 'Transmettre couleurs, motif et casque aux sprites de Shepard sur le terrain et dans les poses de combat, pour les deux apparences.',
    acceptance: 'Vérifier les quatre directions de terrain et quatre poses de combat. Palette et casque suivent la tête, y compris couchée. Aucun autre équipier modifié.',
    notes: `La région de tête par pose guide la recoloration et le casque. Contrôles : ${evidencePath}. Les silhouettes exactes d’armure restent à produire.`,
  },
  'CUST-ANI-combat-colors': {
    description: 'Conserver palette, motif et casque dans les quatre poses clés aim/power/hit/down des deux apparences.',
    acceptance: 'Contrôler ancrage, proportions et couleurs à l’entrée en combat, pendant les poses et au retour terrain. La pose couchée utilise son cadrage et sa région de tête.',
    notes: `Poses clés en 3/4 fixe. Transitions et variantes propres aux armes à produire. Contrôles : ${evidencePath}.`,
  },
  'CUST-UI-keyboard': {
    description: 'Commandes d’atelier nommées, focus visible et continuité après Préparer ou un changement de pose.',
    acceptance: 'Sélectionner, appliquer ou annuler au clavier. Après Préparer, le focus rejoint une commande active. Échap ne valide pas le brouillon.',
    notes: `Focus de Préparer rétabli après rendu de l’interface. Pose d’aperçu temporaire. Contrôles : ${evidencePath}.`,
  },
  'CUST-QA-keyboard': {
    description: 'Parcourir poses, onglets et objets au clavier, préparer une pièce puis annuler ou quitter.',
    acceptance: 'Le focus reste visible après Préparer et les changements de pose. Échap ferme sans appliquer le brouillon. Le parcours reste possible sans souris.',
    assetPath: 'scripts/customization-poses-browser.mjs',
    notes: `Scénario des poses et de la continuité du focus : ${evidencePath}. Lire les résultats dans ce rapport. Le scénario seul ne valide pas la fonctionnalité.`,
  },
};
const additions = {
  'SPR-shepard-combat': {
    implementationPaths: [maleAtlas, maleManifest, 'src/customization-render.js', 'scripts/check-shepard-combat-art.mjs'],
    evidence: [artReference, artEvidence, evidencePath],
  },
  'CUST-ART-armor-preview': {
    implementationPaths: ['src/customization-render.js', 'src/customization-ui.css', 'src/main.js', maleAtlas, maleManifest, femaleAtlas, femaleManifest],
    evidence: [artReference, evidencePath],
  },
  'CUST-ART-world-palette': {
    implementationPaths: ['src/customization-render.js', maleManifest, femaleManifest],
    evidence: [evidencePath],
  },
  'CUST-ANI-combat-colors': {
    implementationPaths: ['src/customization-render.js', maleAtlas, maleManifest, femaleAtlas, femaleManifest, 'tests/shepard-combat-world.test.js'],
    evidence: [artReference, artEvidence, evidencePath],
  },
  'CUST-UI-keyboard': {
    implementationPaths: ['src/main.js', 'src/customization-ui.css'],
    evidence: [evidencePath],
  },
  'CUST-QA-keyboard': {
    implementationPaths: ['scripts/customization-poses-browser.mjs', 'tests/customization-preview-poses.test.js'],
    evidence: [evidencePath],
  },
};
const fieldColumns = { description: 'H', acceptance: 'I', assetPath: 'L', notes: 'Q' };
const catalogue = JSON.parse(await fs.readFile(sourceCatalog, 'utf8'));
const originalCatalogue = structuredClone(catalogue);
if (catalogue.entries.length !== 1382 || catalogue.categories.length !== 26) throw new Error('Review the changed catalogue structure before applying this update.');
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
if (cellChanges.length !== 20 || catalogueChanges.length !== 32) throw new Error('Unexpected scope: expected twenty cells and twelve metadata fields.');
workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });
const previewSpecs = [
  ['sprite-criteria', 'SPR-shepard-combat', 'H', 'I'],
  ['sprite-path', 'SPR-shepard-combat', 'K', 'L'],
  ['sprite-tracking', 'SPR-shepard-combat', 'P', 'Q'],
  ['armor-preview-criteria', 'CUST-ART-armor-preview', 'H', 'I'],
  ['armor-preview-tracking', 'CUST-ART-armor-preview', 'P', 'Q'],
  ['palette-criteria', 'CUST-ART-world-palette', 'H', 'I'],
  ['palette-tracking', 'CUST-ART-world-palette', 'P', 'Q'],
  ['combat-colors-criteria', 'CUST-ANI-combat-colors', 'H', 'I'],
  ['combat-colors-tracking', 'CUST-ANI-combat-colors', 'P', 'Q'],
  ['keyboard-criteria', 'CUST-UI-keyboard', 'H', 'I'],
  ['keyboard-tracking', 'CUST-UI-keyboard', 'P', 'Q'],
  ['keyboard-qa-criteria', 'CUST-QA-keyboard', 'H', 'I'],
  ['keyboard-qa-path', 'CUST-QA-keyboard', 'K', 'L'],
  ['keyboard-qa-tracking', 'CUST-QA-keyboard', 'P', 'Q'],
];
const previews = previewSpecs.map(([name, id, first, last]) => {
  const { sheetName, row } = rowLocations[id];
  return { file: `shepard-combat-${name}.png`, sheetName, range: `${first}${row}:${last}${row}` };
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
await fs.writeFile(path.join(outputDir, 'shepard-combat-workbook-update.json'), `${JSON.stringify({
  baseCommit, sourceWorkbook, sourceCatalog, workbookPath,
  sourceHashes: { workbook: await hashFile(sourceWorkbook), catalogue: await hashFile(sourceCatalog) },
  catalogueEntries: catalogue.entries.length, changedIds: Object.keys(changes),
  catalogueChanges, cellChanges, beforeStatuses,
  dashboardTotal: dashboard.getRange('B37').values[0][0],
  formulaErrorInspection: errors.ndjson, dashboardInspection: inspection.ndjson, previews,
  limits: ['Native Microsoft Excel was not executed.', 'Gameplay, browser and art checks are recorded separately in the linked reports.', 'Prototype statuses and artistic limitations are preserved.'],
}, null, 2)}\n`);
console.log(JSON.stringify({ workbookPath, changedIds: Object.keys(changes), changedCells: cellChanges.length, changedMetadataFields: catalogueChanges.length - cellChanges.length, catalogueEntries: catalogue.entries.length, beforeStatuses, formulaErrors: errors.ndjson }));

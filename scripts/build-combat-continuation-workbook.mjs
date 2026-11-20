#!/usr/bin/env node
/**
 * Export the combat-2D continuation register without modifying the RPG catalogue.
 *
 * Run with CODEX_PRIMARY_RUNTIME_NODE from a private temporary directory whose
 * node_modules symlink points to CODEX_PRIMARY_RUNTIME_NODE_MODULES.
 *
 * Required: --input <production.json> --output <output.xlsx>
 * Optional: --csv <production.csv> --preview-dir <scratch-directory>
 *
 * The JSON remains authoritative. Changes made only in Excel are not imported.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const allowedArgs = new Set(['--input', '--output', '--csv', '--preview-dir']);
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  const value = process.argv[i + 1];
  if (!allowedArgs.has(key) || !value || value.startsWith('--')) {
    throw new Error('Usage: --input production.json --output output.xlsx [--csv production.csv] [--preview-dir directory]');
  }
  args[key] = path.resolve(value);
}
if (!args['--input'] || !args['--output']) {
  throw new Error('--input and --output are required.');
}

// Resolve the documented runtime dependency from the temporary working folder.
const runtimeRequire = createRequire(path.join(process.cwd(), 'artifact-loader.cjs'));
const { SpreadsheetFile, Workbook } = await import(
  pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href
);
const source = JSON.parse(await fs.readFile(args['--input'], 'utf8'));
const assets = source.assets;
const backlog = source.backlog;
if (!Array.isArray(assets) || !Array.isArray(backlog)) {
  throw new Error('production.json must define assets and backlog arrays.');
}
const statuses = ['Défini', 'Prototype', 'Intégré', 'Validé'];
const priorities = ['P0', 'P1', 'P2'];
const allIds = new Set();
for (const [group, rows] of [['assets', assets], ['backlog', backlog]]) {
  for (const row of rows) {
    if (!row.id || allIds.has(row.id)) throw new Error(`Missing or duplicate ID in ${group}: ${row.id}`);
    allIds.add(row.id);
    if (!statuses.includes(row.status)) throw new Error(`Unknown status for ${row.id}: ${row.status}`);
    if (!priorities.includes(row.priority)) throw new Error(`Unknown priority for ${row.id}: ${row.priority}`);
  }
}
const dateText = String(source.generatedOn || '').slice(0, 10);
const generatedDate = new Date(`${dateText}T00:00:00Z`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || Number.isNaN(generatedDate.getTime())) {
  throw new Error('generatedOn must contain a valid ISO date.');
}

const outputDir = path.dirname(args['--output']);
const previewDir = args['--preview-dir'];
await fs.mkdir(outputDir, { recursive: true });
if (previewDir) await fs.mkdir(previewDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add('Synthese');
const assetSheet = workbook.worksheets.add('Assets');
const remainingSheet = workbook.worksheets.add('Restants');
const ink = '#17283B';
const navy = '#17334D';
const paleBlue = '#EAF0F6';
const amber = '#FFF3D8';
const line = '#BDCAD6';
const font = 'Arial';
const firstRow = 5;
const assetLast = Math.max(firstRow, assets.length + firstRow - 1);
const backlogLast = Math.max(firstRow, backlog.length + firstRow - 1);
const text = (value) => value == null ? '' : String(value);
const safeText = (value) => {
  const s = text(value);
  return s.startsWith('=') ? `'${s}` : s;
};
const alphaText = (alpha) => {
  if (typeof alpha === 'boolean') return alpha ? 'Oui' : 'Non';
  if (alpha == null) return 'Non mesuré';
  if (typeof alpha === 'string') return alpha;
  return JSON.stringify(alpha);
};
const selections = { prototype_retenu: 'Retenu', historique_non_retenu: 'Historique' };
for (const row of assets) {
  if (!Object.hasOwn(selections, row.selection)) throw new Error(`Unknown selection for ${row.id}: ${row.selection}`);
}
const sourceUrls = (row) => Array.isArray(row.sourceUrls) ? row.sourceUrls.join('\n') : text(row.sourceUrls);
const boundingBox = (row) => row.technical?.bbox == null ? '' : JSON.stringify(row.technical.bbox);
const hasNumeric = (value) => Number.isFinite(value) ? value : null;
const textHeight = (value, widthPx) => {
  const charsPerLine = Math.max(1, Math.floor((widthPx - 16) / 6));
  const lines = text(value).split('\n').reduce((total, lineText) => total + Math.max(1, Math.ceil(lineText.length / charsPerLine)), 0);
  return lines * 15 + 12;
};

function setupSheet(sheet, area, title, lastColumn, rowCount) {
  sheet.showGridLines = false;
  sheet.getRange(area).format = {
    font: { name: font, size: 10, color: ink },
    verticalAlignment: 'center',
    rowHeight: 22,
  };
  sheet.getRange(`A1:${lastColumn}1`).format.rowHeight = 8;
  sheet.getRange('A2').values = [[title]];
  sheet.getRange('A2').format.font = { name: font, size: 16, bold: true, color: navy };
  sheet.getRange(`A2:${lastColumn}2`).format.rowHeight = 30;
  sheet.getRange(`A3:${lastColumn}3`).format.borders = {
    bottom: { style: 'thin', color: line },
  };
  sheet.getRange(`A3:${lastColumn}3`).format.rowHeight = 10;
  if (rowCount) {
    sheet.freezePanes.freezeRows(4);
    sheet.freezePanes.freezeColumns(2);
  }
}

function tableHeader(sheet, range, headers) {
  sheet.getRange(range).values = [headers];
  sheet.getRange(range).format = {
    fill: navy,
    font: { name: font, size: 10, bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
    rowHeight: 34,
    borders: { insideVertical: { style: 'thin', color: '#FFFFFF' } },
  };
}

function columnWidths(sheet, widths, lastRow) {
  widths.forEach(([column, width]) => {
    sheet.getRange(`${column}1:${column}${lastRow}`).format.columnWidthPx = width;
  });
}

function statusStyles(sheet, lastRow) {
  const statusRange = sheet.getRange(`F${firstRow}:F${lastRow}`);
  statusRange.dataValidation = { rule: { type: 'list', values: statuses } };
  statusRange.conditionalFormats.add('containsText', {
    text: 'Défini', format: { fill: '#F1F3F5', font: { color: '#526271' } },
  });
  statusRange.conditionalFormats.add('containsText', {
    text: 'Prototype', format: { fill: paleBlue, font: { color: navy } },
  });
  statusRange.conditionalFormats.add('containsText', {
    text: 'Intégré', format: { fill: '#E9F0E5', font: { color: '#38522A' } },
  });
  statusRange.conditionalFormats.add('containsText', {
    text: 'Validé', format: { fill: '#DDEBE3', font: { color: '#234935' } },
  });
  sheet.getRange(`G${firstRow}:G${lastRow}`).dataValidation = {
    rule: { type: 'list', values: priorities },
  };
  sheet.getRange(`G${firstRow}:G${lastRow}`).conditionalFormats.add('containsText', {
    text: 'P0', format: { fill: amber, font: { color: '#674D1B', bold: true } },
  });
}

setupSheet(summary, 'A1:H34', 'Mass Effect — Combat 2D', 'H', 0);
summary.tabColor = navy;
columnWidths(summary, [['A', 265], ['B', 110], ['C', 30], ['D', 180], ['E', 95], ['F', 95], ['G', 95], ['H', 95]], 34);
summary.getRange('A4').values = [['Lot de continuation']];
summary.getRange('B4').values = [[safeText(source.batchId)]];
summary.getRange('A5').values = [['État au']];
summary.getRange('B5').values = [[generatedDate]];
summary.getRange('B5').format.numberFormat = 'dd/mm/yyyy';
summary.getRange('A6').values = [['Images candidates. Revue de fidélité et animation à poursuivre.']];
summary.getRange('A6').format.font = { name: font, size: 10, italic: true, color: '#526271' };
summary.getRange('A8:B8').values = [['Production du lot', 'Nombre']];
summary.getRange('A8:B8').format = {
  fill: navy, font: { name: font, size: 10, bold: true, color: '#FFFFFF' }, rowHeight: 28,
};
summary.getRange('A9:A15').values = [
  ['Visuels retenus'],
  ['Concepts historiques non retenus'],
  ['Fichiers répertoriés au total'],
  ['Tâches restantes répertoriées'],
  ['Fichiers au statut Validé'],
  ['Tâches P0 restantes'],
  ['Fichiers avec dimensions mesurées'],
];
summary.getRange('B9:B15').formulas = [
  [`=COUNTIFS('Assets'!H${firstRow}:H${assetLast},"Retenu")`],
  [`=COUNTIFS('Assets'!H${firstRow}:H${assetLast},"Historique")`],
  [`=COUNTA('Assets'!A${firstRow}:A${assetLast})`],
  [`=COUNTA('Restants'!A${firstRow}:A${backlogLast})`],
  [`=COUNTIFS('Assets'!F${firstRow}:F${assetLast},"Validé")`],
  [`=COUNTIFS('Restants'!G${firstRow}:G${backlogLast},"P0",'Restants'!F${firstRow}:F${backlogLast},"<>Validé")`],
  [`=COUNTIFS('Assets'!K${firstRow}:K${assetLast},">0",'Assets'!L${firstRow}:L${assetLast},">0")`],
];
summary.getRange('B9:B15').format.numberFormat = '#,##0';
summary.getRange('B9:B15').format.horizontalAlignment = 'right';
summary.getRange('A9:B15').format.rowHeight = 28;
tableHeader(summary, 'D8:F8', ['Statut', 'Visuels', 'Restants']);
summary.getRange('D9:D12').values = statuses.map((value) => [value]);
summary.getRange('E9:F12').formulas = statuses.map((_, index) => [
  `=COUNTIFS('Assets'!F${firstRow}:F${assetLast},D${9 + index})`,
  `=COUNTIFS('Restants'!F${firstRow}:F${backlogLast},D${9 + index})`,
]);
summary.getRange('E9:F12').format.numberFormat = '#,##0';
summary.getRange('E9:F12').format.horizontalAlignment = 'right';
summary.getRange('D9:F12').format.rowHeight = 28;
summary.getRange('A18').values = [['Lecture des statuts']];
summary.getRange('A18').format.font = { name: font, size: 10, bold: true, color: navy };
summary.getRange('A19:B22').values = [
  ['Défini', 'Besoin décrit, livrable à produire.'],
  ['Prototype', 'Candidat produit, limites consignées.'],
  ['Intégré', 'Raccordé au parcours prévu.'],
  ['Validé', 'Critères et preuves spécifiques réunis.'],
];
summary.getRange('A19:A22').format.font = { name: font, size: 10, bold: true, color: ink };
summary.getRange('A19:A22').format.rowHeight = 25;
summary.getRange('A25').values = [['Source de suivi']];
summary.getRange('B25').values = [['docs/combat-2d/production.json']];
summary.getRange('A26').values = [['Commit de départ']];
summary.getRange('B26').values = [[safeText(source.baselineCommit)]];
summary.getRange('A28').values = [['Ce lot suit l’annexe combat 2D. Le catalogue du RPG reste distinct.']];
summary.getRange('A29').values = [['Les modifications faites uniquement dans Excel ne sont pas réimportées dans le JSON.']];
summary.getRange('A28:A29').format.font = { name: font, size: 10, italic: true, color: '#526271' };
summary.getRange('A31').values = [['Les compteurs portent sur ce registre, pas sur tout l’univers Mass Effect.']];
summary.getRange('A32').values = [['Retenu désigne une image candidate. Aucun cycle animé complet n’est livré par ce lot.']];
summary.getRange('A31:A32').format.font = { name: font, size: 10, italic: true, color: '#526271' };

setupSheet(assetSheet, `A1:R${assetLast}`, 'Visuels du lot', 'R', assets.length);
assetSheet.tabColor = '#52728D';
const assetHeaders = ['ID', 'Sujet', 'Œuvre', 'Type', 'Pose / couche', 'Statut', 'Priorité', 'Sélection', 'Fichier', 'Fidélité', 'Largeur (px)', 'Hauteur (px)', 'Alpha', 'Cadre (px)', 'SHA-256', 'Notes'];
tableHeader(assetSheet, 'A4:P4', assetHeaders);
assetSheet.getRange('R4').values = [['Sources']];
assetSheet.getRange('R4').format.font = { name: font, size: 10, bold: true, color: navy };
columnWidths(assetSheet, [
  ['A', 245], ['B', 205], ['C', 145], ['D', 110], ['E', 175], ['F', 105], ['G', 75],
  ['H', 110], ['I', 360], ['J', 180], ['K', 90], ['L', 90], ['M', 110], ['N', 180], ['O', 330], ['P', 460], ['Q', 25], ['R', 600],
], assetLast);
if (assets.length) {
  const assetRows = assets.map((row) => [
    row.id, row.subject, row.work, row.kind, row.state, row.status, row.priority,
    selections[row.selection], row.file, row.fidelityStatus, hasNumeric(row.technical?.width), hasNumeric(row.technical?.height),
    alphaText(row.technical?.alpha), boundingBox(row), row.technical?.sha256, row.notes,
  ].map((value) => typeof value === 'number' || value === null ? value : safeText(value)));
  assetSheet.getRange(`A${firstRow}:P${assetLast}`).values = assetRows;
  assetSheet.getRange(`A${firstRow}:P${assetLast}`).format = {
    wrapText: true, verticalAlignment: 'top',
  };
  assetSheet.getRange(`R${firstRow}:R${assetLast}`).values = assets.map((row) => [sourceUrls(row)]);
  assetSheet.getRange(`R${firstRow}:R${assetLast}`).format = {
    font: { name: font, size: 10, color: '#365C7E' }, wrapText: true, verticalAlignment: 'top',
  };
  const widths = [245, 205, 145, 110, 175, 105, 75, 110, 360, 180, 90, 90, 110, 180, 330, 460];
  assets.forEach((row, index) => {
    const rowHeight = Math.max(48, textHeight(sourceUrls(row), 600), ...assetRows[index].map((value, column) => textHeight(value, widths[column])));
    assetSheet.getRange(`A${firstRow + index}:R${firstRow + index}`).format.rowHeight = rowHeight;
  });
  assetSheet.getRange(`K${firstRow}:L${assetLast}`).format.numberFormat = '#,##0';
  assetSheet.getRange(`K${firstRow}:L${assetLast}`).format.horizontalAlignment = 'right';
  assetSheet.tables.add(`A4:P${assetLast}`, true, 'CombatVisuals');
  statusStyles(assetSheet, assetLast);
}

setupSheet(remainingSheet, `A1:H${backlogLast}`, 'Production restante', 'H', backlog.length);
remainingSheet.tabColor = '#9F8352';
tableHeader(remainingSheet, 'A4:H4', ['ID', 'Sujet', 'Œuvre', 'Type', 'État requis', 'Statut', 'Priorité', 'Notes']);
columnWidths(remainingSheet, [
  ['A', 245], ['B', 205], ['C', 80], ['D', 120], ['E', 210], ['F', 105], ['G', 75], ['H', 660],
], backlogLast);
if (backlog.length) {
  remainingSheet.getRange(`A${firstRow}:H${backlogLast}`).values = backlog.map((row) => [
    row.id, row.subject, row.work, row.kind, row.state, row.status, row.priority, row.notes,
  ].map(safeText));
  remainingSheet.getRange(`A${firstRow}:H${backlogLast}`).format = {
    wrapText: true, verticalAlignment: 'top',
  };
  const widths = [245, 205, 80, 120, 210, 105, 75, 660];
  backlog.forEach((row, index) => {
    const values = [row.id, row.subject, row.work, row.kind, row.state, row.status, row.priority, row.notes];
    const rowHeight = Math.max(42, ...values.map((value, column) => textHeight(value, widths[column])));
    remainingSheet.getRange(`A${firstRow + index}:H${firstRow + index}`).format.rowHeight = rowHeight;
  });
  remainingSheet.tables.add(`A4:H${backlogLast}`, true, 'CombatRemaining');
  statusStyles(remainingSheet, backlogLast);
}

workbook.recalculate();
const actualCounts = summary.getRange('B9:B15').values.map((row) => row[0]);
const expectedCounts = [
  assets.filter((row) => row.selection === 'prototype_retenu').length,
  assets.filter((row) => row.selection === 'historique_non_retenu').length,
  assets.length,
  backlog.length,
  assets.filter((row) => row.status === 'Validé').length,
  backlog.filter((row) => row.priority === 'P0' && row.status !== 'Validé').length,
  assets.filter((row) => row.technical?.width > 0 && row.technical?.height > 0).length,
];
if (JSON.stringify(actualCounts) !== JSON.stringify(expectedCounts)) {
  throw new Error(`Summary mismatch: ${JSON.stringify({ actualCounts, expectedCounts })}`);
}
const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',
  options: { useRegex: true, maxResults: 50 },
  summary: 'Formula error scan',
  maxChars: 3000,
});
const overview = await workbook.inspect({
  kind: 'table', range: 'Synthese!A8:F15', include: 'values,formulas',
  tableMaxRows: 8, tableMaxCols: 6, maxChars: 3500,
});

if (previewDir) {
  const previews = [
    ['Synthese', 'A1:H33', 'synthese.png'],
    ['Assets', `A1:H${assetLast}`, 'assets.png'],
    ['Assets', `I4:P${Math.min(assetLast, 10)}`, 'assets-technical.png'],
    ['Assets', `R4:R${Math.min(assetLast, 10)}`, 'assets-sources.png'],
    ['Restants', `A1:H${Math.min(backlogLast, 12)}`, 'restants.png'],
  ];
  for (const [sheetName, range, filename] of previews) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
    await fs.writeFile(path.join(previewDir, filename), new Uint8Array(await preview.arrayBuffer()));
  }
  await fs.writeFile(path.join(previewDir, 'verification.json'), JSON.stringify({
    baselineCommit: source.baselineCommit, batchId: source.batchId,
    sourceFile: args['--input'], actualCounts, expectedCounts,
    formulaErrors: formulaErrors.ndjson, overview: overview.ndjson,
    limitation: 'Artifact Tool calculation and export verified; no interactive Excel session was run.',
  }, null, 2) + '\n');
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(args['--output']);
if (args['--csv']) {
  const csvHeaders = ['groupe', 'id', 'sujet', 'oeuvre', 'type', 'etat', 'statut', 'priorite', 'selection', 'fichier', 'fidelite', 'largeur_px', 'hauteur_px', 'alpha', 'cadre_px', 'sha256', 'sources', 'notes'];
  const rows = [
    csvHeaders,
    ...assets.map((row) => ['asset', row.id, row.subject, row.work, row.kind, row.state, row.status, row.priority,
      row.selection, row.file, row.fidelityStatus, row.technical?.width, row.technical?.height,
      alphaText(row.technical?.alpha), boundingBox(row), row.technical?.sha256, sourceUrls(row), row.notes]),
    ...backlog.map((row) => ['backlog', row.id, row.subject, row.work, row.kind, row.state, row.status, row.priority,
      '', '', '', '', '', '', '', '', '', row.notes]),
  ];
  const quote = (value) => `"${text(value).replaceAll('"', '""')}"`;
  await fs.mkdir(path.dirname(args['--csv']), { recursive: true });
  await fs.writeFile(args['--csv'], '\uFEFF' + rows.map((row) => row.map(quote).join(',')).join('\n') + '\n');
}
console.log(JSON.stringify({
  workbook: args['--output'], csv: args['--csv'] || null,
  sheets: ['Synthese', 'Assets', 'Restants'], assets: assets.length, backlog: backlog.length,
  countsVerified: true, formulaErrors: formulaErrors.ndjson,
  previews: previewDir || null,
}, null, 2));

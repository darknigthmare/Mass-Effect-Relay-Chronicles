import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Recovery QA: imports the preserved workbook and never exports or changes it.
const repo = path.resolve(process.argv[2] || process.cwd());
const lot = path.join(repo, 'docs/armax/lot21');
const qa = path.join(lot, 'workbook-qa');
const currentPath = path.join(lot, 'Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx');
const baselinePath = path.join(repo, 'docs/armax/lot20/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx');
const expectedPreservedSha256 = '0c72622d22bed67d59836477a95006977a5492f485d8b4b462c37f1ee31032c4';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const initialBytes = await fs.readFile(currentPath);
if (sha(initialBytes) !== expectedPreservedSha256) throw new Error('Preserved workbook bytes changed');
const [wb, baseline] = await Promise.all([
  SpreadsheetFile.importXlsx(await FileBlob.load(currentPath)),
  SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath))
]);
const summary = wb.worksheets.getItem('Synthese');
const list = wb.worksheets.getItem('Catalogue');
const review = wb.worksheets.getItem('Revue21');
const rows = list.getUsedRange().values.slice(5).filter(row => typeof row[11] === 'string');
const oldRows = baseline.worksheets.getItem('Catalogue').getRange('A6:S201').values;
const cellMap = { total: 'B14', withImage: 'C14', withoutImage: 'D14', certified1to1: 'E14', addedSubjects: 'B17', deliveredSubjects: 'B18', deliveredPngFiles: 'B19', selectedPngFiles: 'B44', recoveredPngFiles: 'B29', generatedPngFiles: 'B30', inheritedNewlyIllustrated: 'B23', addedIllustrated: 'B24', addedWithoutImage: 'B45', excludedWithoutImage: 'B40', openWithoutImage: 'B41', reuseWithoutImage: 'B42', totalExclusions: 'B43' };
const counts = () => Object.fromEntries(Object.entries(cellMap).map(([key, cell]) => [key, summary.getRange(cell).values[0][0]]));
const independent = {
  total: rows.length, withImage: rows.filter(r => r[19] === 'Présent').length,
  withoutImage: rows.filter(r => r[19] === 'Absent').length, certified1to1: rows.filter(r => r[9] === 'Oui').length,
  addedSubjects: rows.filter(r => r[15] === 'lot21').length,
  deliveredSubjects: rows.filter(r => r[20] > 0).length,
  deliveredPngFiles: rows.reduce((n, r) => n + r[20], 0),
  selectedPngFiles: rows.reduce((n, r) => n + r[22], 0),
  recoveredPngFiles: rows.reduce((n, r) => n + r[23], 0),
  generatedPngFiles: rows.reduce((n, r) => n + r[24], 0),
  inheritedNewlyIllustrated: rows.filter(r => r[7] === 'Absent' && r[19] === 'Présent').length,
  addedIllustrated: rows.filter(r => r[15] === 'lot21' && r[19] === 'Présent').length,
  addedWithoutImage: rows.filter(r => r[15] === 'lot21' && r[19] === 'Absent').length,
  excludedWithoutImage: rows.filter(r => r[19] === 'Absent' && r[21] === 'Oui').length,
  openWithoutImage: rows.filter(r => r[19] === 'Absent' && r[21] === 'Non').length,
  reuseWithoutImage: rows.filter(r => r[19] === 'Absent' && r[21] === 'Non' && r[25] === 'Oui').length,
  totalExclusions: rows.filter(r => r[21] === 'Oui').length
};
const assertSame = (a, b, reason) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(reason + ': ' + JSON.stringify({ a, b })); };
const historicalNames = ['Recuperes', 'Attributions19', 'Revue20'];
const tableSnapshot = sheet => sheet.tables.items.map(t => ({ sheet: sheet.name, name: t.name, style: t.style, headers: t.getHeaderRowRange().address, data: t.getDataRows().address, showHeaders: t.showHeaders, showTotals: t.showTotals, showBandedColumns: t.showBandedColumns, showFilterButton: t.showFilterButton }));
const historicalCheck = () => {
  for (const name of historicalNames) {
    const a = baseline.worksheets.getItem(name); const b = wb.worksheets.getItem(name);
    assertSame(a.getUsedRange().values, b.getUsedRange().values, 'Historical values changed: ' + name);
    assertSame(a.getUsedRange().formulas, b.getUsedRange().formulas, 'Historical formulas changed: ' + name);
    assertSame(tableSnapshot(a), tableSnapshot(b), 'Historical tables changed: ' + name);
  }
};
historicalCheck();
for (let i = 0; i < oldRows.length; i++) for (const col of [0, 1, 2, 3, 4, 5, 7, 10, 11, 15, 17]) if (oldRows[i][col] !== rows[i][col]) throw new Error('Historical identity/accounting changed: ' + i + '/' + col);
wb.recalculate();
assertSame(counts(), independent, 'Summary counts differ');
const selectedIndex = rows.findIndex(r => r[22] > 0 && r[19] === 'Présent');
const selected = rows[selectedIndex];
const input = list.getRange('T' + (6 + selectedIndex));
input.values = [['Absent']];
wb.recalculate();
const absent = counts();
if (absent.withImage !== independent.withImage - 1 || absent.withoutImage !== independent.withoutImage + 1 || absent.deliveredPngFiles !== independent.deliveredPngFiles) throw new Error('Reactivity failed');
const reviewRows = review.getRange('A6:P27').values;
const selectedReviewIndex = reviewRows.findIndex(r => r[0] === selected[11]);
if (review.getRange('F' + (6 + selectedReviewIndex)).values[0][0] !== 'Absent') throw new Error('Review did not react');
input.values = [['Présent']];
wb.recalculate();
assertSame(counts(), independent, 'Restored counts differ');
historicalCheck();
const formulaError = /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for (const sheet of wb.worksheets.items) for (const row of sheet.getUsedRange().values) for (const value of row) if (typeof value === 'string' && formulaError.test(value)) throw new Error('Formula error: ' + sheet.name + ' ' + value);
const sourcePaths = { catalogue: 'docs/armax/lot21/production-catalog.json', baseline: 'docs/armax/lot20/production-catalog.json', manifest: 'docs/armax/lot21/art-production/manifest.json', audit: 'docs/armax/lot21/audit/coverage-additions.json' };
const inputs = {};
if (!process.argv.includes('--inputs-pending')) {
  const loaded = {};
  for (const [key, relative] of Object.entries(sourcePaths)) {
    const bytes = await fs.readFile(path.join(repo, relative));
    inputs[key] = { path: relative, sha256: sha(bytes) };
    loaded[key] = JSON.parse(bytes);
  }
  assertSame(loaded.catalogue.entries.map(e => e.id), rows.map(r => r[11]), 'Current source identity order differs');
  for (let i = 0; i < rows.length; i++) {
    const e = loaded.catalogue.entries[i]; const r = rows[i];
    for (const [key, col] of [['name', 0], ['work', 2], ['variant', 3], ['status', 6], ['addedInLot', 15]]) if (e[key] !== r[col]) throw new Error('Current source field differs: ' + e.id + ' ' + key);
    assertSame(e.assetFiles || [], (r[14] || '').split('\n').filter(Boolean), 'Current asset list differs: ' + e.id);
  }
  for (const key of ['total', 'withImage', 'withoutImage', 'certified1to1']) if (loaded.catalogue.currentCounts?.[key] !== independent[key]) throw new Error('Current source count differs: ' + key);
  const delivered = loaded.manifest.assets.filter(a => a.path);
  if (delivered.some(a => a.generatedThisTurn === true && a.recoveredThisTurn === true)) throw new Error('Ambiguous manifest origin flags');
  const recoveredAssets = delivered.filter(a => a.recoveredThisTurn === true || /recovered/.test(a.origin || ''));
  const generatedAssets = delivered.filter(a => a.generatedThisTurn === true || a.origin === 'generated_this_turn');
  if (delivered.length !== independent.deliveredPngFiles || recoveredAssets.length !== independent.recoveredPngFiles || generatedAssets.length !== independent.generatedPngFiles || delivered.filter(a => a.selected === true).length !== independent.selectedPngFiles) throw new Error('Manifest accounting differs');
  const reuseIds = new Set(loaded.audit.entries.filter(e => e.auditDecision === 'reemploi_a_inspecter').map(e => e.id));
  assertSame([...reuseIds].sort(), rows.filter(r => r[25] === 'Oui').map(r => r[11]).sort(), 'Audit reuse IDs differ');
}
await fs.mkdir(qa, { recursive: true });
const previousReport = await fs.readFile(path.join(lot, 'workbook-verification.json'), 'utf8').then(JSON.parse).catch(() => null);
const previews = [];
async function render(sheetName, range, name) {
  const bytes = new Uint8Array(await (await wb.render({ sheetName, range, scale: 1, format: 'png' })).arrayBuffer());
  const target = path.join(qa, name + '.png');
  await fs.writeFile(target, bytes);
  previews.push({ sheet: sheetName, range, path: path.relative(repo, target), sha256: sha(bytes) });
}
if (!process.argv.includes('--no-render')) {
  await render('Synthese', 'A1:E30', 'lot21-summary-production');
  await render('Synthese', 'A31:E48', 'lot21-summary-remaining');
  await render('Catalogue', 'T5:Z8', 'lot21-current-accounting');
  await render('Catalogue', 'A202:J204', 'lot21-new-identities');
  for (let start = 6; start <= 27; start += 4) await render('Revue21', `A${start === 6 ? 1 : start}:I${Math.min(start + 3, 27)}`, 'lot21-review-' + start);
  await render('Revue21', 'J23:P23', 'lot21-review-evidence');
} else if (previousReport?.workbook?.sha256 === expectedPreservedSha256) {
  for (const preview of previousReport.previews || []) {
    if (sha(await fs.readFile(path.join(repo, preview.path))) !== preview.sha256) throw new Error('Previously reviewed preview changed');
    previews.push(preview);
  }
}
for (const input of Object.values(inputs)) if (sha(await fs.readFile(path.join(repo, input.path))) !== input.sha256) throw new Error('Source changed during recovery QA');
if (sha(await fs.readFile(currentPath)) !== expectedPreservedSha256) throw new Error('The workbook file was mutated');
const report = {
  schemaVersion: 2, lot: 'lot21', date: '2026-11-27', baseCommit: '8542d7ca03702dcf4b3bccd8ac938bd6574f20bc',
  authoring: 'Original @oai/artifact-tool import/edit/recalculate/export; preserved final XLSX recovered byte-for-byte. This recovery QA imports and verifies without exporting.',
  recovery: { preservedWorkbookSha256: expectedPreservedSha256, fileReexported: false, sourceBindingComplete: !process.argv.includes('--inputs-pending'), reportReconstructedAndChecksRerun: true },
  inputs, template: { path: path.relative(repo, baselinePath), sha256: sha(await fs.readFile(baselinePath)) },
  workbook: { path: path.relative(repo, currentPath), sha256: expectedPreservedSha256, bytes: initialBytes.length },
  sheets: wb.worksheets.items.map(s => s.name), identityRowsPreserved: oldRows.length,
  historicalSheetValuesAndFormulasPreserved: historicalNames,
  historicalTablesBefore: historicalNames.flatMap(name => tableSnapshot(baseline.worksheets.getItem(name))),
  historicalTablesAfter: historicalNames.flatMap(name => tableSnapshot(wb.worksheets.getItem(name))),
  preservedCatalogueColumns: { H: 'Image au lot20', R: 'PNG lot20' },
  currentCatalogueColumns: { T: 'Image actuelle', U: 'PNG livrés lot21', V: 'Exclu de relance', W: 'PNG retenus lot21', X: 'PNG récupérés lot21', Y: 'PNG générés ce tour', Z: 'Piste de réemploi' },
  catalogueTable: tableSnapshot(list), reviewTable: tableSnapshot(review), counts: counts(), independentCounts: independent,
  inputRecalculation: { id: selected[11], inputCell: 'Catalogue!T' + (6 + selectedIndex), before: independent, temporarilyAbsent: absent, restored: counts(), reviewReacted: true, diskFileNeverExported: true },
  formulaErrors: 0, reviewIds: reviewRows.map(r => r[0]),
  reviewDecisions: reviewRows.reduce((acc, r) => { acc[r[8]] = (acc[r[8]] || 0) + 1; return acc; }, {}),
  previews, visualInspection: process.argv.includes('--no-render') && previousReport?.visualInspection || 'Pending inspection of regenerated previews',
  nativeExcelApplicationOpened: false,
  limitations: ['Candidate presence only; no artistic fidelity or gameplay validation.', 'Historical sheets and H/R remain lot20 snapshots.', 'Recovered sources are newly bound after reconciliation; original lost JSON byte identities are not asserted.', 'Rendered with artifact-tool; Microsoft Excel was not opened.']
};
await fs.writeFile(path.join(lot, 'workbook-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ workbookSha256: expectedPreservedSha256, counts: counts(), previewCount: previews.length, sourceBindingComplete: report.recovery.sourceBindingComplete }, null, 2));

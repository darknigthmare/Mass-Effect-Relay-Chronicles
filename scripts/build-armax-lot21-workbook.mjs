import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Execute a copy from a workspace runtime directory with the runtime-owned
// node_modules symlink beside it, using CODEX_PRIMARY_RUNTIME_NODE.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || '/workspace/scratch/6d991d65fa33/outputs/lot21');
const qaDir = path.resolve(process.env.ARMAX_QA_DIR || path.join(outputDir, 'qa'));
const lotDir = path.join(repoRoot, 'docs/armax/lot21');
const baselinePath = path.join(repoRoot, 'docs/armax/lot20/Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(repoRoot, relative), 'utf8'));
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath));
await fs.mkdir(qaDir, { recursive: true });

async function render(sheetName, range, name) {
  const blob = await wb.render({ sheetName, range, scale: 1, format: 'png' });
  const target = path.join(qaDir, `${name}.png`);
  await fs.writeFile(target, new Uint8Array(await blob.arrayBuffer()));
  return { sheet: sheetName, range, path: target };
}

if (process.argv.includes('--inspect-template')) {
  const summary = wb.worksheets.getItem('Synthese');
  const list = wb.worksheets.getItem('Catalogue');
  const compact = await wb.inspect({ kind: 'workbook,sheet,table', maxChars: 8000, tableMaxRows: 3, tableMaxCols: 6, tableMaxCellChars: 100 });
  const metadata = {
    overview: compact.ndjson,
    sheets: wb.worksheets.items.map(s => s.name),
    summary: summary.getRange('A1:E40').values,
    summaryFormulas: summary.getRange('A1:E40').formulas,
    catalogueHeaders: list.getRange('A5:S5').values,
    catalogueFirst: list.getRange('A6:S6').values,
    catalogueLast: list.getRange('A201:S201').values,
    historicalReview: wb.worksheets.getItem('Revue20').getRange('A5:N17').values,
    historicalReviewFormulas: wb.worksheets.getItem('Revue20').getRange('A5:N17').formulas,
    previews: [
      await render('Synthese', 'A1:E37', 'template-summary'),
      await render('Catalogue', 'A5:J7', 'template-catalogue'),
      await render('Revue20', 'A1:I8', 'template-review')
    ]
  };
  await fs.writeFile(path.join(qaDir, 'template-inspection.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(JSON.stringify(metadata, null, 2));
  process.exit(0);
}

const inputPaths = {
  catalogue: 'docs/armax/lot21/production-catalog.json',
  baseline: 'docs/armax/lot20/production-catalog.json',
  manifest: 'docs/armax/lot21/art-production/manifest.json',
  audit: 'docs/armax/lot21/audit/coverage-additions.json'
};
const inputBytes = await Promise.all(Object.values(inputPaths).map(relative => fs.readFile(path.join(repoRoot, relative))));
const [catalogue, baseline, manifest, audit] = inputBytes.map(bytes => JSON.parse(bytes.toString('utf8')));
const summary = wb.worksheets.getItem('Synthese');
const list = wb.worksheets.getItem('Catalogue');
const historicalNames = ['Recuperes', 'Attributions19', 'Revue20'];
const originalSheets = wb.worksheets.items.map(s => s.name);
if (JSON.stringify(originalSheets) !== JSON.stringify(['Synthese', 'Catalogue', ...historicalNames])) throw new Error('Unexpected lot20 sheets');
if (!Array.isArray(catalogue.entries) || !Array.isArray(manifest.assets) || !Array.isArray(audit.entries)) throw new Error('Missing lot21 source arrays');
const first = 6;
const oldLast = first + baseline.entries.length - 1;
const last = first + catalogue.entries.length - 1;
const historical = historicalNames.map(name => {
  const sheet = wb.worksheets.getItem(name);
  return { sheet, values: JSON.stringify(sheet.getUsedRange().values), formulas: JSON.stringify(sheet.getUsedRange().formulas) };
});
const tableSnapshot = sheet => sheet.tables.items.map(t => ({
  sheet: sheet.name, name: t.name, style: t.style,
  headers: t.getHeaderRowRange().address, data: t.getDataRows().address,
  showHeaders: t.showHeaders, showTotals: t.showTotals,
  showBandedColumns: t.showBandedColumns, showFilterButton: t.showFilterButton
}));
const historicalTablesBefore = historical.flatMap(h => tableSnapshot(h.sheet));
const baselineCatalogueValues = list.getRange(`A${first}:S${oldLast}`).values;
const identityFields = ['id', 'category', 'name', 'work', 'dlc', 'variant', 'plannedUse', 'addedInLot'];
if (catalogue.entries.length < baseline.entries.length) throw new Error('The lot21 catalogue removed inherited identities');
for (let i = 0; i < baseline.entries.length; i++) {
  for (const key of identityFields) {
    if (JSON.stringify(baseline.entries[i][key]) !== JSON.stringify(catalogue.entries[i][key])) throw new Error(`Identity/order changed at ${i}: ${key}`);
  }
}
const byId = new Map(catalogue.entries.map(e => [e.id, e]));
if (byId.size !== catalogue.entries.length) throw new Error('Duplicate catalogue IDs');
const auditById = new Map(audit.entries.map(e => [e.id, e]));
const excludedIds = new Set(catalogue.policy?.automaticRetryExcludedIds || []);
for (const e of catalogue.entries) if (e.automaticRetryExcluded) excludedIds.add(e.id);
const assetsById = new Map();
const attemptsById = new Map();
for (const attempt of manifest.attempts || []) {
  if (!byId.has(attempt.catalogId)) throw new Error('Attempt ID is absent from catalogue: ' + attempt.catalogId);
  if (!attemptsById.has(attempt.catalogId)) attemptsById.set(attempt.catalogId, []);
  attemptsById.get(attempt.catalogId).push(attempt);
}
const refusedThisLot = id => (attemptsById.get(id) || []).some(a => /refus|blocked/.test(a.outcome || a.generationStatus || a.errorCode || ''));
const pathsSeen = new Set();
for (const asset of manifest.assets) {
  if (!byId.has(asset.catalogId)) throw new Error('Manifest ID is absent from catalogue: ' + asset.catalogId);
  if (!assetsById.has(asset.catalogId)) assetsById.set(asset.catalogId, []);
  const file = asset.path || asset.assetPath || asset.file || null;
  if (file) {
    if (pathsSeen.has(file)) throw new Error('Duplicate lot21 PNG path: ' + file);
    pathsSeen.add(file);
    await fs.access(path.join(repoRoot, file));
    if (!/\.png$/i.test(file)) throw new Error('The workbook PNG accounting received a non-PNG path: ' + file);
  }
  assetsById.get(asset.catalogId).push({ ...asset, workbookPath: file });
}
const assetOrigin = asset => {
  if (!asset.workbookPath) return null;
  if (asset.generatedThisTurn === true && asset.recoveredThisTurn === true) throw new Error('Ambiguous recovered/generated flags: ' + asset.workbookPath);
  const origin = String(asset.origin || asset.provenance?.origin || '').toLowerCase();
  if (/recover|recuper|repris|prior/.test(origin) || asset.recovered === true || asset.recoveredThisTurn === true) return 'recovered';
  if (/generat|produced_this_turn|new_this_turn/.test(origin) || asset.generatedThisTurn === true) return 'generated';
  throw new Error('Explicit recovered/generated origin is required for ' + asset.workbookPath);
};
const entryFacts = e => {
  const assets = assetsById.get(e.id) || [];
  const delivered = assets.filter(a => a.workbookPath);
  const selected = delivered.filter(a => a.selected === true);
  const recovered = delivered.filter(a => assetOrigin(a) === 'recovered');
  const generated = delivered.filter(a => assetOrigin(a) === 'generated');
  const excluded = excludedIds.has(e.id);
  const reuse = auditById.get(e.id)?.auditDecision === 'reemploi_a_inspecter';
  return { assets, delivered, selected, recovered, generated, excluded, reuse, present: !!e.assetFiles?.length };
};
const factsById = new Map(catalogue.entries.map(e => [e.id, entryFacts(e)]));
for (const e of catalogue.entries) {
  for (const asset of factsById.get(e.id).selected) {
    if (!(e.assetFiles || []).includes(asset.workbookPath)) throw new Error('Selected PNG missing from catalogue files: ' + asset.workbookPath);
  }
}
const categoryLabels = {
  personnage: 'Personnages / ennemis', costume: 'Costumes', stage: 'Décors / calques',
  effet: 'Effets', projectile: 'Projectiles', accessoire: 'Accessoires', arme: 'Armes'
};
const usageLabels = {
  combattant_candidat: 'Combattant proposé', opposant_candidat: 'Opposant proposé', boss_candidat: 'Boss proposé',
  narration_support: 'Support narratif', variante_visuelle: 'Variante visuelle', arene_adaptee: 'Arène adaptée',
  calque_decor: 'Calque de décor', effet_visuel: 'Effet visuel', projectile_candidat: 'Projectile proposé',
  accessoire_candidat: 'Accessoire proposé', arme_candidat: 'Arme proposée'
};
const uniqueText = values => [...new Set(values.flat().filter(v => typeof v === 'string' && v.trim()))].join('\n');
const notesFor = e => uniqueText([e.productionNote, e.generationNotes || [], e.latestReferenceReview?.lot === 'lot21' ? e.latestReferenceReview.reason : '', e.referenceGap]);
const decision = e => {
  const f = factsById.get(e.id);
  if (f.recovered.length) return 'Récupéré';
  if (f.selected.length) return 'Généré ce tour';
  if (refusedThisLot(e.id) || f.assets.some(a => /blocked|refus/.test(a.generationStatus || ''))) return 'Refus sans relance';
  if (f.excluded) return 'Exclu de relance';
  if (f.reuse && !f.present) return 'Réemploi à inspecter';
  if (auditById.get(e.id)?.auditDecision === 'recherche_reference_independante') return 'Référence à rechercher';
  return f.present ? 'Image conservée' : 'À produire';
};
const latestAttempt = e => {
  const f = factsById.get(e.id);
  if (f.recovered.length) return 'Récupéré';
  if (f.generated.length) return 'Généré';
  if (f.assets.some(a => /blocked|refus/.test(a.generationStatus || '')) || e.latestGenerationAttempt === 'blocked') return 'Bloqué';
  if (e.latestGenerationAttempt === 'generated') return 'Généré';
  return 'Non produit';
};
const changedIndices = [];
const currentFields = ['status', 'latestGenerationAttempt', 'fidelity1to1Validated', 'productionNote', 'generationNotes', 'referenceGap', 'sourceUrls', 'assetFiles', 'imageLot', 'alternateAssetFiles', 'latestReferenceReview'];
const catalogueTable = list.tables.items.find(t => t.name === 'ArmaxCatalogue');
if (!catalogueTable) throw new Error('ArmaxCatalogue table missing');
const tableProperties = Object.fromEntries(['style', 'showHeaders', 'showTotals', 'showBandedColumns', 'showFilterButton'].map(k => [k, catalogueTable[k]]));
// H and R remain the accounting inputs consumed by the historical Revue20.
// Current accounting is deliberately stored in a new, explicitly labelled block.
list.getRange('H5').values = [['Image au lot20']];
list.getRange('R5').values = [['PNG lot20']];
list.getRange('T5:Z5').copyFrom(list.getRange('M5:S5'), 'all');
list.getRange('T5:Z5').values = [['Image actuelle', 'PNG livrés lot21', 'Exclu de relance', 'PNG retenus lot21', 'PNG récupérés lot21', 'PNG générés ce tour', 'Piste de réemploi']];
list.getRange(`T6:Z${last}`).format.font = { name: 'Arial', size: 10, color: '#24374D' };
list.getRange(`T5:Z${last}`).format.wrapText = true;
list.getRange(`T6:Z${last}`).format.verticalAlignment = 'top';
list.getRange(`T6:Z${last}`).values = catalogue.entries.map(e => {
  const f = factsById.get(e.id);
  return [f.present ? 'Présent' : 'Absent', f.delivered.length, f.excluded ? 'Oui' : 'Non', f.selected.length, f.recovered.length, f.generated.length, f.reuse ? 'Oui' : 'Non'];
});
for (const col of ['U', 'W', 'X', 'Y']) list.getRange(`${col}6:${col}${last}`).setNumberFormat('0');
for (const col of ['T', 'V', 'Z']) list.getRange(`${col}6:${col}${last}`).format.horizontalAlignment = 'center';
list.getRange(`T6:T${last}`).dataValidation = { rule: { type: 'list', values: ['Présent', 'Absent'] } };
for (const col of ['V', 'Z']) list.getRange(`${col}6:${col}${last}`).dataValidation = { rule: { type: 'list', values: ['Oui', 'Non'] } };
for (const col of ['T', 'U', 'V', 'W', 'X', 'Y', 'Z']) list.getRange(`${col}5:${col}${last}`).format.columnWidth = col === 'T' ? 17 : 19;
list.getRange('A5:Z5').format.rowHeight = 42;
for (let i = 0; i < catalogue.entries.length; i++) {
  const e = catalogue.entries[i];
  const row = first + i;
  const isNew = i >= baseline.entries.length;
  const changed = isNew || currentFields.some(key => JSON.stringify(e[key]) !== JSON.stringify(baseline.entries[i][key]));
  if (isNew) {
    list.getRange(`A${row}:S${row}`).copyFrom(list.getRange(`A${oldLast}:S${oldLast}`), 'all');
    if (!categoryLabels[e.category]) throw new Error('Unknown category: ' + e.category);
    list.getRange(`A${row}:S${row}`).values = [[
      e.name, categoryLabels[e.category], e.work, e.variant || '', e.dlc || '', e.priority, e.status,
      'Hors lot20', latestAttempt(e), e.fidelity1to1Validated ? 'Oui' : 'Non', usageLabels[e.plannedUse] || e.plannedUse,
      e.id, notesFor(e), (e.sourceUrls || []).join('\n'), (e.assetFiles || []).join('\n'), e.addedInLot || 'lot21',
      e.imageLot || '', 0, (e.alternateAssetFiles || []).join('\n')
    ]];
  } else if (changed) {
    // Targeted current-state edits leave every inherited identity and the lot20 accounting cells intact.
    list.getRange(`G${row}`).values = [[e.status]];
    list.getRange(`I${row}:J${row}`).values = [[latestAttempt(e), e.fidelity1to1Validated ? 'Oui' : 'Non']];
    list.getRange(`M${row}:O${row}`).values = [[notesFor(e), (e.sourceUrls || []).join('\n'), (e.assetFiles || []).join('\n')]];
    list.getRange(`Q${row}`).values = [[e.imageLot || '']];
    list.getRange(`S${row}`).values = [[(e.alternateAssetFiles || []).join('\n')]];
  }
  if (changed) {
    changedIndices.push(i);
    const textColumns = [notesFor(e), (e.sourceUrls || []).join('\n'), (e.assetFiles || []).join('\n')];
    const lines = Math.max(...textColumns.map(text => text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 125)), 0)));
    list.getRange(`A${row}:Z${row}`).format.rowHeight = Math.min(409, Math.max(62, lines * 13 + 14));
  }
}
catalogueTable.delete();
const newCatalogueTable = list.tables.add(`A5:Z${last}`, true, 'ArmaxCatalogue');
for (const [key, value] of Object.entries(tableProperties)) if (value !== undefined) newCatalogueTable[key] = value;

const reviewIds = catalogue.entries.filter(e => assetsById.has(e.id) || attemptsById.has(e.id) || auditById.has(e.id)).map(e => e.id);
const review = wb.worksheets.add('Revue21');
const reviewLast = 5 + reviewIds.length;
review.showGridLines = false;
review.getRange('A2').copyFrom(wb.worksheets.getItem('Revue20').getRange('A2'), 'all');
review.getRange('A2').values = [['Lot 21 — récupération, production et couverture']];
review.getRange('A3').copyFrom(wb.worksheets.getItem('Revue20').getRange('A3'), 'all');
review.getRange('A3').values = [['Bilan courant lié au Catalogue. Images candidates : fidélité 1:1 et intégration moteur restent à valider.']];
review.getRange('A4').values = [['Sources de suivi : production-catalog.json ; art-production/manifest.json ; audit/coverage-additions.json. Les anciens bilans restent dans leurs onglets.']];
review.getRange('A4').format.font = { name: 'Arial', size: 9, color: '#64748B' };
review.getRange(`A5:P${reviewLast}`).format.font = { name: 'Arial', size: 10, color: '#24374D' };
review.getRange('A5:P5').copyFrom(list.getRange('A5:P5'), 'all');
review.getRange('A5:P5').values = [['ID catalogue', 'Sujet', 'Opus', 'Variante exacte', 'Usage proposé', 'Image actuelle', 'PNG livrés lot21', 'PNG retenus', 'Décision du lot21', 'Réserves / références manquantes', 'Sources consultées', 'Fichiers sélectionnés', '1:1 validé', 'Moteur intégré', 'Exclu de relance', 'Piste de réemploi']];
const reviewRows = reviewIds.map(id => {
  const e = byId.get(id);
  const proposal = auditById.get(id);
  return [id, e.name, e.work, e.variant, usageLabels[e.plannedUse] || e.plannedUse, '', 0, 0, decision(e),
    uniqueText([e.referenceGap, factsById.get(e.id).present ? '' : proposal?.referenceGap]), (e.sourceUrls || []).join('\n'),
    (e.assetFiles || []).join('\n'), e.fidelity1to1Validated ? 'Oui' : 'Non', e.engineIntegrated ? 'Oui' : 'Non', '', ''];
});
review.getRange(`A6:P${reviewLast}`).values = reviewRows;
for (let i = 0; i < reviewIds.length; i++) {
  const r = first + catalogue.entries.findIndex(e => e.id === reviewIds[i]);
  const dest = first + i;
  for (const [target, source] of [['F', 'T'], ['G', 'U'], ['H', 'W'], ['O', 'V'], ['P', 'Z']]) review.getRange(`${target}${dest}`).formulas = [[`='Catalogue'!${source}${r}`]];
}
const reviewWidths = [38, 31, 13, 34, 24, 16, 14, 13, 25, 112, 120, 110, 13, 15, 17, 19];
review.getRange(`A5:P${reviewLast}`).format.wrapText = true;
review.getRange(`A6:P${reviewLast}`).format.verticalAlignment = 'top';
review.getRange('A5:P5').format.rowHeight = 42;
for (let i = 0; i < reviewWidths.length; i++) review.getRangeByIndexes(4, i, reviewRows.length + 1, 1).format.columnWidth = reviewWidths[i];
for (let i = 0; i < reviewRows.length; i++) {
  const lines = Math.max(...reviewRows[i].map((v, col) => String(v ?? '').split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / (reviewWidths[col] * 0.95))), 0)));
  review.getRange(`A${first + i}:P${first + i}`).format.rowHeight = Math.min(409, Math.max(78, lines * 13 + 16));
}
review.getRange(`G6:H${reviewLast}`).setNumberFormat('0');
const reviewTable = review.tables.add(`A5:P${reviewLast}`, true, 'ArmaxRevue21');
reviewTable.style = tableProperties.style;
review.freezePanes.freezeRows(5);
review.freezePanes.freezeColumns(1);

// Extend the six-category lot20 summary by one row, keeping the surrounding layout.
const categoryOrder = ['personnage', 'costume', 'stage', 'effet', 'projectile', 'accessoire', 'arme'];
const totalRow = 7 + categoryOrder.length;
summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 21']];
summary.getRange('B4').values = [[new Date('2026-11-27T00:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
summary.getRange('A14:E14').copyFrom(summary.getRange('A13:E13'), 'all');
summary.getRange('A13:E13').copyFrom(summary.getRange('A12:E12'), 'all');
const range = col => `'Catalogue'!$${col}$${first}:$${col}$${last}`;
for (let i = 0; i < categoryOrder.length; i++) {
  const row = 7 + i;
  summary.getRange(`A${row}`).values = [[categoryLabels[categoryOrder[i]]]];
  summary.getRange(`B${row}:E${row}`).formulas = [[
    `=COUNTIFS(${range('B')},A${row})`, `=COUNTIFS(${range('B')},A${row},${range('T')},"Présent")`,
    `=B${row}-C${row}`, `=COUNTIFS(${range('B')},A${row},${range('J')},"Oui")`
  ]];
}
summary.getRange(`A${totalRow}`).values = [['Total du catalogue']];
summary.getRange(`B${totalRow}:E${totalRow}`).formulas = [[...['B', 'C', 'D', 'E'].map(col => `=SUM(${col}7:${col}${totalRow - 1})`)]];
const oldSummaryTable = summary.tables.items[0];
const summaryTableProperties = oldSummaryTable ? Object.fromEntries(['name', 'style', 'showHeaders', 'showTotals', 'showBandedColumns', 'showFilterButton'].map(k => [k, oldSummaryTable[k]])) : null;
if (oldSummaryTable) {
  oldSummaryTable.delete();
  const newSummaryTable = summary.tables.add(`A6:E${totalRow}`, true, summaryTableProperties.name);
  for (const [key, value] of Object.entries(summaryTableProperties)) if (key !== 'name' && value !== undefined) newSummaryTable[key] = value;
}
const metrics = [
  [17, 'Fiches ajoutées au lot 21', `=COUNTIFS(${range('P')},"lot21")`],
  [18, 'Fiches avec PNG livrés au lot 21', `=COUNTIFS(${range('U')},">0")`],
  [19, 'PNG livrés au lot 21', `=SUM(${range('U')})`],
  [21, 'Fiches illustrées sans PNG livré au lot 21', `=COUNTIFS(${range('T')},"Présent",${range('U')},0)`],
  [23, 'Anciennes fiches complétées au lot 21', `=COUNTIFS(${range('H')},"Absent",${range('T')},"Présent")`],
  [24, 'Nouvelles fiches illustrées au lot 21', `=COUNTIFS(${range('P')},"lot21",${range('T')},"Présent")`],
  [29, 'PNG récupérés au lot 21', `=SUM(${range('X')})`],
  [30, 'PNG générés durant ce tour', `=SUM(${range('Y')})`],
  [40, 'Fiches sans image — exclues de relance', `=COUNTIFS(${range('T')},"Absent",${range('V')},"Oui")`],
  [41, 'Fiches sans image — ouvertes', `=COUNTIFS(${range('T')},"Absent",${range('V')},"Non")`],
  [42, 'Dont pistes de réemploi à inspecter', `=COUNTIFS(${range('T')},"Absent",${range('V')},"Non",${range('Z')},"Oui")`],
  [43, 'Exclusions totales, avec ou sans image', `=COUNTIFS(${range('V')},"Oui")`],
  [44, 'PNG retenus au lot 21', `=SUM(${range('W')})`],
  [45, 'Nouvelles fiches encore sans image', `=COUNTIFS(${range('P')},"lot21",${range('T')},"Absent")`]
];
for (const [row, label, formula] of metrics) {
  if (row >= 40) summary.getRange(`A${row}:B${row}`).copyFrom(summary.getRange('A30:B30'), 'all');
  summary.getRange(`A${row}`).values = [[label]];
  summary.getRange(`B${row}`).formulas = [[formula]];
}
summary.getRange('A16:B16').values = [['Production courante et archives', 'Fiches / fichiers']];
summary.getRange('A39:B39').copyFrom(summary.getRange('A16:B16'), 'all');
summary.getRange('A39:B39').values = [['État des manquants et sélection', 'Fiches / fichiers']];
summary.getRange('A31').values = [['Une image candidate reste un prototype ; aucune fidélité 1:1 n’est certifiée.']];
summary.getRange('A36').values = [['H/R gardent le bilan lot20 ; T à Z portent les comptes courants. Anciens onglets préservés.']];
summary.getRange('A37').values = [['Guide + extensions : 68 rubriques conservées ; moteur à réaliser.']];
summary.getRange('A47').copyFrom(summary.getRange('A31'), 'all');
summary.getRange('A47').values = [['Les propositions d’audit étendent le suivi ; elles ne prouvent pas une couverture exhaustive des œuvres.']];
summary.getRange('A48').copyFrom(summary.getRange('A31'), 'all');
summary.getRange('A48').values = [['Sources : Catalogue courant, manifeste lot21 et audit ; Recuperes conserve son bilan historique.']];
// Summary labels remain in one column as in the imported template, with enough width for the new labels.
summary.getRange('A6:A45').format.columnWidth = 56;
summary.getRange('A6:A45').format.wrapText = true;
for (const row of [...metrics.map(m => m[0]), 20, 22, 25, 26, 27, 28]) summary.getRange(`A${row}:B${row}`).format.rowHeight = 29;
summary.getRange('A16:B16').format.rowHeight = 33;
summary.getRange('A39:B39').format.rowHeight = 33;

const expected = {
  total: catalogue.entries.length,
  withImage: catalogue.entries.filter(e => factsById.get(e.id).present).length,
  withoutImage: catalogue.entries.filter(e => !factsById.get(e.id).present).length,
  certified1to1: catalogue.entries.filter(e => e.fidelity1to1Validated).length,
  addedSubjects: catalogue.entries.filter(e => e.addedInLot === 'lot21').length,
  deliveredSubjects: catalogue.entries.filter(e => factsById.get(e.id).delivered.length).length,
  deliveredPngFiles: [...factsById.values()].reduce((n, f) => n + f.delivered.length, 0),
  selectedPngFiles: [...factsById.values()].reduce((n, f) => n + f.selected.length, 0),
  recoveredPngFiles: [...factsById.values()].reduce((n, f) => n + f.recovered.length, 0),
  generatedPngFiles: [...factsById.values()].reduce((n, f) => n + f.generated.length, 0),
  inheritedNewlyIllustrated: baseline.entries.filter((e, i) => !e.assetFiles?.length && factsById.get(catalogue.entries[i].id).present).length,
  addedIllustrated: catalogue.entries.filter(e => e.addedInLot === 'lot21' && factsById.get(e.id).present).length,
  addedWithoutImage: catalogue.entries.filter(e => e.addedInLot === 'lot21' && !factsById.get(e.id).present).length,
  excludedWithoutImage: catalogue.entries.filter(e => !factsById.get(e.id).present && factsById.get(e.id).excluded).length,
  openWithoutImage: catalogue.entries.filter(e => !factsById.get(e.id).present && !factsById.get(e.id).excluded).length,
  reuseWithoutImage: catalogue.entries.filter(e => !factsById.get(e.id).present && !factsById.get(e.id).excluded && factsById.get(e.id).reuse).length,
  totalExclusions: catalogue.entries.filter(e => factsById.get(e.id).excluded).length
};
const countCells = {
  total: `B${totalRow}`, withImage: `C${totalRow}`, withoutImage: `D${totalRow}`, certified1to1: `E${totalRow}`,
  addedSubjects: 'B17', deliveredSubjects: 'B18', deliveredPngFiles: 'B19', selectedPngFiles: 'B44',
  recoveredPngFiles: 'B29', generatedPngFiles: 'B30', inheritedNewlyIllustrated: 'B23', addedIllustrated: 'B24',
  addedWithoutImage: 'B45', excludedWithoutImage: 'B40', openWithoutImage: 'B41', reuseWithoutImage: 'B42', totalExclusions: 'B43'
};
const counts = () => Object.fromEntries(Object.entries(countCells).map(([key, cell]) => [key, summary.getRange(cell).values[0][0]]));
const assertCounts = (actual, wanted, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(label + ': ' + JSON.stringify({ actual, wanted }));
};
wb.recalculate();
assertCounts(counts(), expected, 'Formula counts disagree with source arrays');
for (const key of ['total', 'withImage', 'withoutImage', 'certified1to1']) {
  if (catalogue.currentCounts?.[key] !== undefined && catalogue.currentCounts[key] !== expected[key]) throw new Error('Catalogue currentCounts differs from source rows: ' + key);
}
const selectedIndex = catalogue.entries.findIndex(e => factsById.get(e.id).selected.length && factsById.get(e.id).present);
if (selectedIndex < 0) throw new Error('A selected lot21 candidate is required for recalculation QA');
const testedEntry = catalogue.entries[selectedIndex];
const presence = list.getRange('T' + (first + selectedIndex));
presence.values = [['Absent']];
wb.recalculate();
const temporary = counts();
const temporaryExpected = { ...expected, withImage: expected.withImage - 1, withoutImage: expected.withoutImage + 1 };
if (factsById.get(testedEntry.id).excluded) temporaryExpected.excludedWithoutImage++;
else temporaryExpected.openWithoutImage++;
if (testedEntry.addedInLot === 'lot21') { temporaryExpected.addedIllustrated--; temporaryExpected.addedWithoutImage++; }
else if (!baseline.entries[selectedIndex].assetFiles?.length) temporaryExpected.inheritedNewlyIllustrated--;
if (factsById.get(testedEntry.id).reuse && !factsById.get(testedEntry.id).excluded) temporaryExpected.reuseWithoutImage++;
assertCounts(temporary, temporaryExpected, 'Current-image input recalculation failed');
const testedReviewRow = first + reviewIds.indexOf(testedEntry.id);
if (review.getRange('F' + testedReviewRow).values[0][0] !== 'Absent') throw new Error('Revue21 did not react to the current-image change');
presence.values = [['Présent']];
wb.recalculate();
assertCounts(counts(), expected, 'Restored counts disagree');
const finalValues = list.getRange(`A${first}:S${oldLast}`).values;
for (let i = 0; i < baseline.entries.length; i++) {
  for (const col of [0, 1, 2, 3, 4, 5, 7, 10, 11, 15, 17]) {
    if (baselineCatalogueValues[i][col] !== finalValues[i][col]) throw new Error('Inherited identity or lot20 accounting cell changed: ' + i + '/' + col);
  }
}
const assertHistorical = () => {
  for (const snapshot of historical) {
    if (JSON.stringify(snapshot.sheet.getUsedRange().values) !== snapshot.values || JSON.stringify(snapshot.sheet.getUsedRange().formulas) !== snapshot.formulas) throw new Error('Historical sheet changed: ' + snapshot.sheet.name);
  }
  if (JSON.stringify(historical.flatMap(h => tableSnapshot(h.sheet))) !== JSON.stringify(historicalTablesBefore)) throw new Error('Historical tables changed');
};
assertHistorical();
const formulaError = /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for (const sheet of wb.worksheets.items) {
  for (const row of sheet.getUsedRange().values) for (const value of row) if (typeof value === 'string' && formulaError.test(value)) throw new Error('Formula error in ' + sheet.name + ': ' + value);
}

// The affected views only: summary, new accounting columns, new identities and the new review.
// These files must be opened and visually inspected before the workbook is reported ready.
const previews = [];
if (!process.argv.includes('--no-render')) {
  previews.push(await render('Synthese', 'A1:E30', 'lot21-summary-production'));
  previews.push(await render('Synthese', 'A31:E48', 'lot21-summary-remaining'));
  previews.push(await render('Catalogue', 'T5:Z8', 'lot21-current-accounting'));
  if (last > oldLast) previews.push(await render('Catalogue', `A${oldLast + 1}:J${Math.min(oldLast + 3, last)}`, 'lot21-new-identities'));
  for (let start = first; start <= reviewLast; start += 4) previews.push(await render('Revue21', `A${start === first ? 1 : start}:I${Math.min(start + 3, reviewLast)}`, 'lot21-review-' + start));
  const longestReview = reviewRows.reduce((best, row, i) => String(row[9]).length > String(reviewRows[best][9]).length ? i : best, 0);
  previews.push(await render('Revue21', `J${first + longestReview}:P${first + longestReview}`, 'lot21-review-evidence'));
}
wb.recalculate();
assertCounts(counts(), expected, 'Pre-export counts disagree');
assertHistorical();
const inputHashes = Object.fromEntries(Object.entries(inputPaths).map(([key, sourcePath], i) => [key, { path: sourcePath, sha256: sha256(inputBytes[i]) }]));
for (const input of Object.values(inputHashes)) {
  if (sha256(await fs.readFile(path.join(repoRoot, input.path))) !== input.sha256) throw new Error('Input changed during workbook creation; rerun after consolidation: ' + input.path);
}
await fs.mkdir(outputDir, { recursive: true });
const outputName = 'Mass_Effect_Armax_Suivi_Lot21_2026-11-27.xlsx';
const outputPath = path.join(outputDir, outputName);
await (await SpreadsheetFile.exportXlsx(wb)).save(outputPath);
await fs.copyFile(outputPath, path.join(lotDir, outputName));
const finalSheets = wb.worksheets.items.map(s => s.name);
if (JSON.stringify(finalSheets) !== JSON.stringify([...originalSheets, 'Revue21'])) throw new Error('Unexpected final sheets');
const publishedQaDir = path.join(lotDir, 'workbook-qa');
await fs.mkdir(publishedQaDir, { recursive: true });
for (const preview of previews) {
  const destination = path.join(publishedQaDir, path.basename(preview.path));
  await fs.copyFile(preview.path, destination);
  preview.path = path.relative(repoRoot, destination);
  preview.sha256 = sha256(await fs.readFile(destination));
}
const report = {
  schemaVersion: 1, lot: 'lot21', date: '2026-11-27', baseCommit: catalogue.baseCommit,
  authoring: '@oai/artifact-tool import, targeted edit, recalculate, export', inputs: inputHashes,
  template: { path: path.relative(repoRoot, baselinePath), sha256: sha256(await fs.readFile(baselinePath)) },
  workbook: { path: 'docs/armax/lot21/' + outputName, sha256: sha256(await fs.readFile(outputPath)), bytes: (await fs.stat(outputPath)).size },
  sheets: finalSheets, identityRowsPreserved: baseline.entries.length,
  historicalSheetValuesAndFormulasPreserved: historicalNames, historicalTablesBefore,
  historicalTablesAfter: historical.flatMap(h => tableSnapshot(h.sheet)),
  preservedCatalogueColumns: { H: 'Image au lot20', R: 'PNG lot20' },
  currentCatalogueColumns: { T: 'Image actuelle', U: 'PNG livrés lot21', V: 'Exclu de relance', W: 'PNG retenus lot21', X: 'PNG récupérés lot21', Y: 'PNG générés ce tour', Z: 'Piste de réemploi' },
  catalogueTable: tableSnapshot(list), reviewTable: tableSnapshot(review),
  counts: counts(), independentCounts: expected,
  inputRecalculation: { id: testedEntry.id, inputCell: 'Catalogue!T' + (first + selectedIndex), before: expected, temporarilyAbsent: temporary, restored: counts(), reviewReacted: true },
  formulaErrors: 0, changedCatalogueIds: changedIndices.map(i => catalogue.entries[i].id), reviewIds,
  reviewDecisions: reviewIds.reduce((counts, id) => { const label = decision(byId.get(id)); counts[label] = (counts[label] || 0) + 1; return counts; }, {}),
  previews, visualInspection: 'Pending explicit inspection of every rendered view', nativeExcelApplicationOpened: false,
  limitations: [
    'Candidate presence only; fidelity and engine integration are not certified.',
    'Recuperes, Attributions19 and Revue20 preserve historical values and formulas; H/R keep the lot20 inputs.',
    'The additions are an audited extension, not an exhaustive franchise inventory.',
    'Rendered with artifact-tool; Microsoft Excel was not opened.'
  ]
};
await fs.writeFile(path.join(lotDir, 'workbook-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ outputPath, counts: counts(), previewCount: previews.length }, null, 2));

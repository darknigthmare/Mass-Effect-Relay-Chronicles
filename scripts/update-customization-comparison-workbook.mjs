import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Targeted update of existing catalogue rows. Run with the Codex primary Node
// runtime; preserve the workbook's sheets, formulas, tables and formatting.
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
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtimeModules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const runtimeRequire = createRequire(path.join(runtimeModules, '__relay_comparison_workbook__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const evidencePath = 'docs/qa/customization-comparison-report.json';

const changes = {
  'CUST-UI-weapons': {
    description: 'Choix de l’arme, des modules, des munitions et des outils à partir de l’inventaire partagé. La fiche consultée compare son effet au brouillon sans l’appliquer.',
    acceptance: 'La fiche suit l’emplacement actif, y compris vide. Une pièce absente ou incompatible affiche son refus. Remplacer une arme indique les modules restitués.',
    notes: `Consultation et préparation restent distinctes. Les valeurs projetées suivent les règles d’équipement. Suivi : ${evidencePath}. Aucun nouveau modèle visuel.`,
  },
  'CUST-UI-comparison': {
    description: 'L’atelier compare l’équipement actuel, le brouillon et la pièce consultée : santé, bouclier, puissance, défense et multiplicateurs technologiques/biotiques.',
    acceptance: 'Les valeurs suivent actorFor. Afficher les multiplicateurs au format ×1,00 → ×1,15, sans arrondir à 1. La consultation valide le brouillon candidat et indique les modules restitués.',
    notes: `La fiche ne projette aucun gain pour une sélection refusée. État, brouillon et stock restent inchangés avant préparation. Suivi : ${evidencePath}.`,
  },
  'CUST-QA-stats': {
    description: 'Comparer les valeurs de l’atelier et de la fiche de pièce au calcul d’acteur, avant préparation puis après application.',
    acceptance: 'Les multiplicateurs technologiques/biotiques gardent leur précision. Les chiffres projetés et modules restitués concordent avec une dotation valide ; aucun gain n’est projeté pour un refus.',
    notes: `Scénarios de comparaison et de projection : ${evidencePath}. Lire les résultats d’exécution dans ce rapport. Statut de prototype conservé.`,
  },
  'CUST-QA-draft-pure': {
    description: 'Consulter plusieurs pièces et modifier les options du brouillon, puis comparer la partie et les stocks avant validation.',
    acceptance: 'La consultation ne modifie ni la partie, ni le brouillon, ni les quantités. Pour une pièce, seule la préparation modifie la dotation du brouillon. La partie reste intacte jusqu’à Appliquer.',
    notes: `Vérifier les refus de stock/compatibilité et la restitution projetée des modules : ${evidencePath}. L’aperçu seul ne réserve aucun objet.`,
  },
  'CUST-QA-roundtrip': {
    acceptance: 'L’apparence et les neuf emplacements de dotation retrouvés sont identiques aux choix validés.',
    notes: `Critère actualisé pour les neuf emplacements. Contrôles de cette livraison et limites : ${evidencePath}. Le statut reste Prototype.`,
  },
};
const fieldColumns = { description: 'H', acceptance: 'I', notes: 'Q' };
const catalogue = JSON.parse(await fs.readFile(sourceCatalog, 'utf8'));
const originalCatalogue = structuredClone(catalogue);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
const cellChanges = [];

// Artifact-tool 2.8.106 imports differential solid fills without their pattern
// marker. Reapply the existing five catalogue rules, exactly as defined in
// build-workbook.mjs, so exporting a text-only edit preserves their Excel fills.
// The companion native verification compares every rule against the input file.
for (const category of catalogue.categories) {
  const sheet = workbook.worksheets.getItem(category.sheetName);
  const lastRow = 6 + catalogue.entries.filter(entry => entry.category === category.id).length;
  for (const column of ['C', 'G', 'E']) sheet.getRange(`${column}7:${column}${lastRow}`).conditionalFormats.clear();
  const statuses = sheet.getRange(`C7:C${lastRow}`);
  for (const [status, fill, color] of [
    ['Prototype', '#FFF1D0', '#865000'],
    ['Intégré', '#D9EEF2', '#0C5966'],
    ['Validé', '#DDF1E8', '#176A4D'],
  ]) {
    statuses.conditionalFormats.add('cellIs', { operator: 'equal', formula: `"${status}"`, format: { fill, font: { color, bold: true } } });
  }
  sheet.getRange(`G7:G${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"Référence à vérifier"', format: { fill: '#FFF2DC', font: { color: '#79520A' } } });
  sheet.getRange(`E7:E${lastRow}`).conditionalFormats.add('cellIs', { operator: 'equal', formula: '"P0"', format: { font: { bold: true, color: '#087F8C' } } });
}

for (const [id, replacements] of Object.entries(changes)) {
  const entries = catalogue.entries.filter(entry => entry.id === id);
  if (entries.length !== 1) throw new Error(`Expected one catalogue row for ${id}, found ${entries.length}.`);
  const entry = entries[0];
  if (entry.status !== 'Prototype' || entry.assetStatus !== 'Prototype') {
    throw new Error(`Review ${id}: its production status has changed since this scoped update was prepared.`);
  }
  const category = catalogue.categories.find(item => item.id === entry.category);
  if (!category) throw new Error(`Unknown category for ${id}.`);
  const sheet = workbook.worksheets.getItem(category.sheetName);
  const lastRow = 6 + catalogue.entries.filter(item => item.category === entry.category).length;
  const candidates = sheet.getRange(`A7:A${lastRow}`).values;
  const matches = candidates.flatMap((row, index) => row[0] === id ? [index + 7] : []);
  if (matches.length !== 1) throw new Error(`Expected one workbook row for ${id}, found ${matches.length}.`);
  const row = matches[0];
  for (const [field, next] of Object.entries(replacements)) {
    const address = `${fieldColumns[field]}${row}`;
    const previous = sheet.getRange(address).values[0][0];
    if ((previous ?? '') !== (entry[field] ?? '')) {
      throw new Error(`Catalogue and workbook differ before editing ${id}.${field} at ${category.sheetName}!${address}.`);
    }
    sheet.getRange(address).values = [[next]];
    entry[field] = next;
    cellChanges.push({ id, sheet: category.sheetName, address, field, before: previous, after: next });
  }
}

// Only the declared descriptions, acceptance criteria and notes can change.
for (const [index, before] of originalCatalogue.entries.entries()) {
  const after = catalogue.entries[index];
  const allowed = changes[before.id] || {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!(key in allowed) && JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      throw new Error(`Unexpected catalogue mutation: ${before.id}.${key}.`);
    }
  }
}

workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });
const previews = [
  ['comparison-criteria', 'UI_systemes', 'H66:I66'],
  ['comparison-tracking', 'UI_systemes', 'P66:Q66'],
  ['inspection-criteria', 'UI_systemes', 'H56:I56'],
  ['inspection-tracking', 'UI_systemes', 'P56:Q56'],
  ['draft-criteria', 'QA', 'H59:I59'],
  ['draft-tracking', 'QA', 'P59:Q59'],
  ['qa-roundtrip-and-stats', 'QA', 'H65:I67'],
  ['qa-tracking', 'QA', 'P65:Q67'],
];
const renderNames = option('--render-previews')?.split(',');
for (const [name, sheetName, range] of previews) {
  if (renderNames && !renderNames.includes(name)) continue;
  const preview = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(path.join(outputDir, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const dashboard = workbook.worksheets.getItem('Dashboard');
const beforeStatuses = Object.fromEntries(['Défini', 'Prototype', 'Intégré', 'Validé'].map(status => [status, originalCatalogue.entries.filter(entry => entry.status === status).length]));
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, maxChars: 3000 });
const inspection = await workbook.inspect({ kind: 'table', range: 'Dashboard!A37:K37', include: 'values,formulas', tableMaxRows: 1, tableMaxCols: 11, maxChars: 2500 });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const workbookPath = path.join(outputDir, 'Mass_Effect_Relay_Chronicles_Production.xlsx');
await xlsx.save(workbookPath);
await fs.writeFile(path.join(outputDir, 'content-catalog.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, 'customization-workbook-update.json'), `${JSON.stringify({
  sourceWorkbook, sourceCatalog, workbookPath, catalogueEntries: catalogue.entries.length,
  changedIds: Object.keys(changes), cellChanges, beforeStatuses,
  dashboardTotal: dashboard.getRange('B37').values[0][0],
  formulaErrorInspection: errors.ndjson, dashboardInspection: inspection.ndjson,
  previews: previews.map(([name, sheetName, range]) => ({ file: `${name}.png`, sheetName, range })),
  limits: ['Native Microsoft Excel was not executed.', 'Gameplay verification is recorded separately in the linked runtime report.'],
}, null, 2)}\n`);
console.log(JSON.stringify({ workbookPath, changedIds: Object.keys(changes), changedCells: cellChanges.length, catalogueEntries: catalogue.entries.length, beforeStatuses, formulaErrors: errors.ndjson }));

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Run with CODEX_PRIMARY_RUNTIME_NODE. The workbook is an export of the lot data;
// it never changes a gameplay status or a source manifest.
const valueAfter = (flag, fallback) => {
  const index = process.argv.indexOf(flag);
  return index < 0 ? fallback : process.argv[index + 1];
};
const root = path.resolve(valueAfter('--root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));
const workspace = path.dirname(root);
const lotDir = path.join(root, 'docs/armax/lot04');
const outputDir = path.resolve(valueAfter('--output-dir', path.join(workspace, 'outputs/armax-lot04')));
const reviewDir = path.join(outputDir, 'workbook-review');
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const primaryNode = process.env.CODEX_PRIMARY_RUNTIME_NODE;
if (!modules || !primaryNode) throw new Error('CODEX_PRIMARY_RUNTIME_NODE and CODEX_PRIMARY_RUNTIME_NODE_MODULES are required.');
if (await fs.realpath(process.execPath) !== await fs.realpath(primaryNode)) {
  throw new Error('Run this authoring script with CODEX_PRIMARY_RUNTIME_NODE.');
}
const taskDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'relay-armax-workbook-'));
await fs.symlink(modules, path.join(taskDirectory, 'node_modules'), 'dir');
process.chdir(taskDirectory);
const taskRequire = createRequire(path.join(taskDirectory, 'workbook-entry.cjs'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(taskRequire.resolve('@oai/artifact-tool')).href);
await fs.mkdir(reviewDir, { recursive: true });

const sourcePath = path.join(lotDir, 'fighters.json');
const sourceBytes = await fs.readFile(sourcePath);
const source = JSON.parse(sourceBytes);
const fighters = source.fighters;
if (!Array.isArray(fighters) || fighters.length === 0) throw new Error('fighters.json must contain a nonempty fighters array.');
if (new Set(fighters.map(f => f.id)).size !== fighters.length) throw new Error('Duplicate fighter identifiers.');
let manifest = { assets: [] };
let manifestBytes = null;
const manifestPath = path.join(lotDir, 'asset-manifest.json');
try {
  manifestBytes = await fs.readFile(manifestPath);
  manifest = JSON.parse(manifestBytes);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const assets = manifest.assets ?? [];
if (!Array.isArray(assets)) throw new Error('asset-manifest.json assets must be an array.');
const generationAttempts = manifest.generationAttempts ?? [];
const latestAttemptByFighter = new Map(generationAttempts.map(attempt => [attempt.fighterId, attempt]));
const assetMap = new Map();
for (const asset of assets) {
  if (assetMap.has(asset.fighterId)) throw new Error(`Duplicate asset fighterId: ${asset.fighterId}`);
  if (!fighters.some(f => f.id === asset.fighterId)) throw new Error(`Unknown asset fighterId: ${asset.fighterId}`);
  assetMap.set(asset.fighterId, asset);
}
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const cleanText = value => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.map(cleanText).join(' ; ');
    return Object.entries(value).map(([key, item]) => `${key} : ${cleanText(item)}`).join(' ; ');
  }
  return String(value);
};
const scalar = value => value === null || value === undefined ? null : (typeof value === 'number' ? value : cleanText(value));
const sourceMap = new Map((source.sources ?? []).map(s => [s.id, s]));
const sourcesFor = fighter => (fighter.sourceIds ?? []).map(id => {
  const entry = sourceMap.get(id);
  if (!entry) return id;
  return [entry.title ?? id, entry.url ?? entry.sourceUrl ?? '', entry.verification ?? ''].filter(Boolean).join('\n');
}).join('\n');
const exists = async filename => {
  try { return (await fs.stat(filename)).isFile(); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};
const fighterRows = [];
const checks = [];
for (const fighter of fighters) {
  const asset = assetMap.get(fighter.id);
  const assetPath = asset?.path ?? fighter.expectedAsset ?? '';
  const resolvedAsset = path.resolve(root, assetPath);
  if (assetPath && !resolvedAsset.startsWith(`${root}${path.sep}`)) throw new Error(`Asset escapes repository: ${assetPath}`);
  const filePresent = Boolean(assetPath) && await exists(resolvedAsset);
  let hashMatches = null;
  if (asset && filePresent && asset.sha256) {
    hashMatches = hash(await fs.readFile(resolvedAsset)) === asset.sha256;
    if (!hashMatches) throw new Error(`Asset SHA-256 mismatch: ${assetPath}`);
  }
  if (asset && !filePresent) throw new Error(`Manifest asset is missing: ${assetPath}`);
  const produced = Boolean(asset && filePresent);
  const lastAttempt = latestAttemptByFighter.get(fighter.id);
  const blocked = !produced && ['blocked', 'refused', 'safety_blocked'].includes(lastAttempt?.status);
  const generationStatus = produced ? 'Généré' : blocked ? 'Bloqué' : 'À produire';
  const technical = asset?.technicalReview;
  const technicalPassed = produced && technical?.alphaPresent === true && technical?.boundsValid === true && technical?.transparentBackground === true && technical?.passed !== false;
  const technicalStatus = technicalPassed ? 'Contrôlé' : (produced ? (technical?.passed === false ? 'À corriger' : 'À contrôler') : 'Sans image');
  const visualStatus = asset?.visualReview?.status === 'reviewed' ? 'Relue' : (produced ? 'À relire' : 'Sans image');
  const inGameStatus = asset?.playable === true ? 'À vérifier' : 'Non vérifié';
  const fidelityCertified = asset?.visualReview?.fidelityCertified === true && fighter.fidelityCertified === true;
  const selection = fighter.selection?.support ? 'Soutien' : (fighter.selection?.soloVersus ? 'Versus proposé' : 'Boss proposé');
  const status = fighter.status ?? (produced ? 'Prototype' : 'Défini');
  const nextAction = blocked ? 'Génération bloquée. Aucun fichier produit.' : !produced ? 'Produire la silhouette' : technical?.passed === false ? 'Corriger les défauts techniques signalés' : !technicalPassed ? 'Contrôler alpha et cadrage' : visualStatus !== 'Relue' ? 'Relire la silhouette' : 'Comparer aux références et produire les animations';
  fighterRows.push([
    fighter.id, fighter.name, fighter.opus, fighter.role ?? fighter.archetype, status,
    selection, produced ? 'Oui' : 'Non', generationStatus, technicalStatus, visualStatus,
    inGameStatus, fidelityCertified ? 'Certifiée' : 'Non certifiée', assetPath,
    nextAction, sourcesFor(fighter), cleanText([...(fighter.canonReservations ?? []), ...(asset?.visualReview?.issues ?? [])]),
  ]);
  checks.push({ fighterId: fighter.id, assetPath, filePresent, inManifest: Boolean(asset), generationStatus, hashMatches, technicalPassed, visualStatus, fidelityCertified });
}

const moveRows = [];
for (const fighter of fighters) {
  const allMoves = [
    ...(fighter.normals ?? []).map(move => ({ move, type: 'Normal' })),
    ...(fighter.specials ?? []).map(move => ({ move, type: 'Spécial' })),
    ...(fighter.throw ? [{ move: fighter.throw, type: 'Prise' }] : []),
    ...(fighter.super ? [{ move: fighter.super, type: 'Super' }] : []),
    ...(fighter.finisher ? [{ move: fighter.finisher, type: 'Finisher' }] : []),
    ...(fighter.supportActions ?? []).map(move => ({ move, type: 'Soutien' })),
  ];
  for (const { move, type } of allMoves) {
    moveRows.push([
      fighter.name, move.id ?? '', type, move.name ?? '', move.input ?? '',
      scalar(move.damage), scalar(move.startupFrames), scalar(move.activeFrames),
      scalar(move.recoveryFrames), scalar(move.onBlock), scalar(move.hitstunFrames),
      scalar(move.cost), scalar(move.range), [
        move.guardLevel ? `Garde : ${move.guardLevel}.` : '',
        move.durationFrames ? `Durée : ${move.durationFrames} frames.` : '',
        cleanText(move.notes ?? move.description ?? move.effect ?? move.sequence),
      ].filter(Boolean).join(' '),
    ]);
  }
}

const animationRows = [];
for (const fighter of fighters) {
  for (const [index, entry] of (fighter.missingAnimations ?? []).entries()) {
    const animation = typeof entry === 'string' ? { name: entry } : entry;
    animationRows.push([
      `${fighter.id}-${animation.id ?? `anim-${String(index + 1).padStart(2, '0')}`}`,
      fighter.name, animation.name ?? animation.animation ?? animation.id ?? '',
      scalar(animation.minimumUniqueDrawings), animation.priority ?? 'À planifier',
      animation.status ?? 'À produire',
      cleanText(animation.notes ?? animation.description ?? 'Une silhouette fixe ne constitue pas un cycle animé.'),
    ]);
  }
}

const recoveryBytes = await fs.readFile(path.join(lotDir, 'recovery.json'));
const recovery = JSON.parse(recoveryBytes);
if (!Array.isArray(recovery.records)) throw new Error('recovery.json records must be an array.');
const recoveryRows = recovery.records.map(record => [record.title, record.scope, record.availability, record.bytesRecovered, record.nextAction, record.finding]);

const wb = Workbook.create();
const sheets = Object.fromEntries(['Synthèse', 'Personnages', 'Coups', 'Animations', 'Reprise'].map(name => [name, wb.worksheets.add(name)]));
const colors = { navy: '#132838', accent: '#376681', text: '#223744', muted: '#5E707A', line: '#CED9DF', light: '#F1F5F8', amber: '#FFF0D3', amberText: '#805500', red: '#FDEAE7', redText: '#A03329' };
const col = number => {
  let n = number + 1, result = '';
  while (n > 0) { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); }
  return result;
};
function formatBase(sheet, range) {
  sheet.showGridLines = false;
  sheet.getRange(range).format.font = { name: 'Arial', size: 10, color: colors.text };
  sheet.getRange(range).format.verticalAlignment = 'center';
  sheet.getRange(range).format.rowHeight = 23;
}
function heading(sheet, text, subtitle, lastColumn) {
  sheet.getRange('A2').values = [[text]];
  sheet.getRange('A2').format.font = { name: 'Arial', size: 15, bold: true, color: colors.navy };
  sheet.getRange('A2').format.rowHeight = 27;
  sheet.getRange('A3').values = [[subtitle]];
  sheet.getRange('A3').format.font = { name: 'Arial', size: 10, italic: true, color: colors.muted };
  sheet.getRange(`A4:${lastColumn}4`).format.borders = { bottom: { style: 'thin', color: colors.accent } };
}
function table(sheet, headers, rows, widths, tableName, opts = {}) {
  const lastColumn = col(headers.length - 1);
  const lastRow = 6 + Math.max(rows.length, 1);
  formatBase(sheet, `A1:${lastColumn}${lastRow}`);
  sheet.getRange(`A6:${lastColumn}6`).values = [headers];
  if (rows.length) sheet.getRange(`A7:${lastColumn}${lastRow}`).values = rows;
  for (let i = 0; i < widths.length; i++) sheet.getRange(`${col(i)}1:${col(i)}${lastRow}`).format.columnWidth = widths[i];
  const body = sheet.getRange(`A7:${lastColumn}${lastRow}`);
  body.format.wrapText = true;
  body.format.verticalAlignment = 'top';
  rows.forEach((row, index) => {
    const lines = Math.max(1, ...row.map((value, j) => {
      const text = cleanText(value);
      return text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / Math.max(6, widths[j] * 0.95))), 0);
    }));
    sheet.getRange(`A${index + 7}:${lastColumn}${index + 7}`).format.rowHeight = Math.max(opts.minHeight ?? 30, Math.min(285, 13 * lines + 10));
    if (index % 2 === 1) sheet.getRange(`A${index + 7}:${lastColumn}${index + 7}`).format.fill = colors.light;
  });
  if (rows.length) {
    const object = sheet.tables.add(`A6:${lastColumn}${lastRow}`, true, tableName);
    object.style = 'TableStyleLight1';
    object.showFilterButton = true;
    body.format.fill = '#FFFFFF';
    for (let row = 8; row <= lastRow; row += 2) sheet.getRange(`A${row}:${lastColumn}${row}`).format.fill = colors.light;
  }
  const head = sheet.getRange(`A6:${lastColumn}6`);
  head.format = {
    fill: colors.navy, font: { name: 'Arial', size: 10, color: '#FFFFFF', bold: true },
    horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true, rowHeight: 34,
    borders: { insideVertical: { style: 'thin', color: '#FFFFFF' } },
  };
  sheet.freezePanes.freezeRows(6);
  sheet.freezePanes.freezeColumns(opts.freezeColumns ?? 2);
  return lastRow;
}

const pEnd = table(sheets.Personnages,
  ['Identifiant', 'Personnage', 'Opus', 'Rôle proposé', 'Contenu', 'Sélection proposée', 'Image présente', 'Génération', 'Technique', 'Revue visuelle', 'Revue en jeu', 'Fidélité 1:1', 'Fichier', 'Prochaine action', 'Référence', 'Réserves'],
  fighterRows, [33, 28, 24, 39, 16, 21, 14, 17, 18, 18, 17, 20, 65, 48, 65, 64], 'ArmaxCharacters');
heading(sheets.Personnages, 'Personnages du lot04', 'Chaque statut reste distinct de la présence d’un fichier.', 'P');
sheets.Personnages.getRange(`E7:E${pEnd}`).dataValidation = { rule: { type: 'list', values: ['Défini', 'Prototype', 'Intégré', 'Validé'] } };
sheets.Personnages.getRange(`G7:G${pEnd}`).dataValidation = { rule: { type: 'list', values: ['Oui', 'Non'] } };
sheets.Personnages.getRange(`G7:G${pEnd}`).conditionalFormats.addCustom('$G7="Non"', { fill: colors.amber, font: { color: colors.amberText } });
sheets.Personnages.getRange(`H7:H${pEnd}`).conditionalFormats.addCustom('$H7="Bloqué"', { fill: colors.red, font: { color: colors.redText } });
sheets.Personnages.getRange(`I7:I${pEnd}`).conditionalFormats.addCustom('$I7="À contrôler"', { fill: colors.amber, font: { color: colors.amberText } });
sheets.Personnages.getRange(`I7:I${pEnd}`).conditionalFormats.addCustom('$I7="À corriger"', { fill: colors.red, font: { color: colors.redText } });

const mEnd = table(sheets.Coups,
  ['Personnage', 'Identifiant du coup', 'Type', 'Nom', 'Entrée', 'Dégâts', 'Démarrage (frames)', 'Actif (frames)', 'Récup. (frames)', 'Bloc (frames)', 'Hitstun (frames)', 'Coût', 'Portée', 'Description et contre-jeu'],
  moveRows, [26, 37, 14, 32, 22, 12, 14, 13, 14, 13, 15, 19, 27, 75], 'ArmaxMoves');
heading(sheets.Coups, 'Commandes et données de combat', 'Proposition de design à 60 Hz. Aucune valeur n’est un chiffre canonique.', 'N');
sheets.Coups.getRange(`F7:K${mEnd}`).format.horizontalAlignment = 'right';
sheets.Coups.getRange(`F7:K${mEnd}`).setNumberFormat('0');
sheets.Coups.getRange(`L7:M${mEnd}`).format.horizontalAlignment = 'right';
sheets.Coups.getRange(`M7:M${mEnd}`).setNumberFormat('0.00');

const aEnd = table(sheets.Animations,
  ['Identifiant de tâche', 'Personnage', 'Animation à produire', 'Dessins minimaux', 'Priorité', 'État', 'Critère de production'],
  animationRows, [48, 28, 38, 16, 19, 20, 74], 'ArmaxAnimations');
heading(sheets.Animations, 'Animations restantes', 'Dessins minimaux distincts par cycle. Cette quantité ne représente pas sa durée.', 'G');
sheets.Animations.getRange(`E7:E${aEnd}`).format.horizontalAlignment = 'center';
if (animationRows.length) {
  sheets.Animations.getRange(`F7:F${aEnd}`).dataValidation = { rule: { type: 'list', values: ['À produire', 'En cours', 'À contrôler', 'Terminé'] } };
  sheets.Animations.getRange(`F7:F${aEnd}`).conditionalFormats.addCustom('$F7="À produire"', { fill: colors.amber, font: { color: colors.amberText } });
}

const rEnd = table(sheets.Reprise,
  ['Livrable recherché', 'Périmètre', 'Disponibilité', 'Octets récupérés', 'Action restante', 'Constat'],
  recoveryRows, [57, 27, 21, 21, 43, 68], 'ArmaxRecovery', { freezeColumns: 1, minHeight: 45 });
heading(sheets.Reprise, 'Reprise des livrables historiques', `Récupération actualisée au ${recovery.date}. Présence de fichiers distincte de leur validation en jeu.`, 'F');
sheets.Reprise.getRange(`C7:C${rEnd}`).conditionalFormats.addCustom('$C7="Introuvable"', { fill: colors.amber, font: { color: colors.amberText } });

const summary = sheets['Synthèse'];
formatBase(summary, 'A1:F27');
summary.tabColor = colors.navy;
summary.getRange('A1:A25').format.columnWidth = 42;
summary.getRange('B1:B25').format.columnWidth = 14;
summary.getRange('C1:C25').format.columnWidth = 3;
summary.getRange('D1:D25').format.columnWidth = 61;
summary.getRange('E1:F25').format.columnWidth = 20;
heading(summary, 'Mass Effect Armax', 'Production du lot04', 'D');
summary.getRange('A6:B6').values = [['Suivi', 'Nombre']];
summary.getRange('D6').values = [['Périmètre']];
for (const address of ['A6:B6', 'D6']) summary.getRange(address).format = { fill: colors.navy, font: { name: 'Arial', size: 10, color: '#FFFFFF', bold: true }, horizontalAlignment: 'center', rowHeight: 30 };
summary.getRange('A7:A18').values = [
  ['Fiches du lot'], ['Images présentes'], ['Images encore absentes'], ['Images conformes techniquement'],
  ['Images relues visuellement'], ['Fidélité 1:1 certifiée'], ['Sélections versus proposées'], ['Soutiens narratifs'],
  ['Coups et actions spécifiés'], ['Animations suivies'], ['Animations à produire'], ['Générations bloquées'],
];
summary.getRange('B7:B18').formulas = [
  [`=COUNTA('Personnages'!A7:A${pEnd})`],
  [`=COUNTIFS('Personnages'!G7:G${pEnd},"Oui")`],
  ['=B7-B8'],
  [`=COUNTIFS('Personnages'!I7:I${pEnd},"Contrôlé")`],
  [`=COUNTIFS('Personnages'!J7:J${pEnd},"Relue")`],
  [`=COUNTIFS('Personnages'!L7:L${pEnd},"Certifiée")`],
  [`=COUNTIFS('Personnages'!F7:F${pEnd},"Versus proposé")`],
  [`=COUNTIFS('Personnages'!F7:F${pEnd},"Soutien")`],
  [moveRows.length ? `=COUNTA('Coups'!A7:A${mEnd})` : '=0'],
  [animationRows.length ? `=COUNTA('Animations'!A7:A${aEnd})` : '=0'],
  [animationRows.length ? `=COUNTIFS('Animations'!F7:F${aEnd},"À produire")` : '=0'],
  [`=COUNTIFS('Personnages'!H7:H${pEnd},"Bloqué")`],
];
summary.getRange('D7:D18').values = [
  ['Roster de ce lot uniquement'], ['Fichier présent et référencé dans le manifeste'], ['Silhouettes sans fichier référencé'],
  ['Alpha, cadrage et détourage sans défaut signalé'], ['Relecture artistique consignée'], ['Comparaison aux références encore nécessaire'],
  ['Intention de design, sans implémentation jouable'], ['Soutien distinct d’un combattant solo'], ['Données d’équilibrage proposées à 60 Hz'],
  ['Tâches de production, pas nombre de dessins'], ['Aucune animation déduite d’une silhouette fixe'],
  ['Tentatives consignées sans image livrée'],
];
summary.getRange('A7:D18').format.rowHeight = 31;
summary.getRange('B7:B18').setNumberFormat('0');
summary.getRange('B7:B18').format.horizontalAlignment = 'right';
for (let row = 8; row <= 18; row += 2) {
  summary.getRange(`A${row}:B${row}`).format.fill = colors.light;
  summary.getRange(`D${row}`).format.fill = colors.light;
}
summary.getRange('A20').values = [['État de la reprise']];
summary.getRange('A20').format.font = { name: 'Arial', size: 10, bold: true, color: colors.navy };
summary.getRange('A21:B21').values = [['Anciens lots Armax', 'Partielle']];
summary.getRange('D21').values = [[recovery.summaryNote]];
summary.getRange('A23').values = [['Mise à jour du suivi']];
summary.getRange('A23').format.font = { name: 'Arial', size: 10, bold: true, color: colors.navy };
summary.getRange('A24').values = [['Modifier les statuts des feuilles détaillées. Les totaux se recalculent.']];
summary.getRange('A25').values = [['La régénération réimporte le JSON et le manifeste du lot.']];
summary.getRange('A24:D25').format.font = { name: 'Arial', size: 10, italic: true, color: colors.muted };
summary.getRange('B9').conditionalFormats.add('cellIs', { operator: 'greaterThan', formula: 0, format: { fill: colors.amber, font: { color: colors.amberText } } });

wb.recalculate();
const expected = [
  fighters.length, checks.filter(check => check.inManifest && check.filePresent).length,
  checks.filter(check => !(check.inManifest && check.filePresent)).length,
  checks.filter(check => check.technicalPassed).length,
  checks.filter(check => check.visualStatus === 'Relue').length,
  checks.filter(check => check.fidelityCertified).length,
  fighterRows.filter(row => row[5] === 'Versus proposé').length,
  fighterRows.filter(row => row[5] === 'Soutien').length,
  moveRows.length, animationRows.length, animationRows.filter(row => row[5] === 'À produire').length,
  checks.filter(check => check.generationStatus === 'Bloqué').length,
];
const observed = summary.getRange('B7:B18').values.map(row => row[0]);
if (JSON.stringify(expected) !== JSON.stringify(observed)) throw new Error(`Summary mismatch: ${JSON.stringify({ expected, observed })}`);
const summaryInspection = await wb.inspect({ kind: 'table', range: 'Synthèse!A6:D18', include: 'values,formulas', tableMaxRows: 13, tableMaxCols: 4, maxChars: 6000 });
const errors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 30 }, maxChars: 3000, summary: 'Final formula error scan' });

// Verify that editable detail statuses drive the summary, then restore them.
const originalImageStatus = sheets.Personnages.getRange('G7').values[0][0];
sheets.Personnages.getRange('G7').values = [[originalImageStatus === 'Oui' ? 'Non' : 'Oui']];
wb.recalculate();
const imageCountAfterEdit = summary.getRange('B8').values[0][0];
if (imageCountAfterEdit !== expected[1] + (originalImageStatus === 'Oui' ? -1 : 1)) throw new Error('Image count did not follow a detail edit.');
sheets.Personnages.getRange('G7').values = [[originalImageStatus]];
let animationCountAfterEdit = null;
if (animationRows.length) {
  const originalAnimationStatus = sheets.Animations.getRange('F7').values[0][0];
  const toggled = originalAnimationStatus === 'À produire' ? 'En cours' : 'À produire';
  sheets.Animations.getRange('F7').values = [[toggled]];
  wb.recalculate();
  animationCountAfterEdit = summary.getRange('B17').values[0][0];
  if (animationCountAfterEdit !== expected[10] + (originalAnimationStatus === 'À produire' ? -1 : 1)) throw new Error('Animation count did not follow a detail edit.');
  sheets.Animations.getRange('F7').values = [[originalAnimationStatus]];
}
wb.recalculate();
if (JSON.stringify(summary.getRange('B7:B18').values.map(row => row[0])) !== JSON.stringify(expected)) throw new Error('Temporary validation edits were not restored.');

const previews = [
  ['Synthèse', 'A1:D25', 'synthese.png'],
  ['Personnages', `A1:J${Math.min(pEnd, 12)}`, 'personnages.png'],
  ['Personnages', `K6:P${Math.min(pEnd, 10)}`, 'personnages-suivi.png'],
  ['Coups', `A1:I${Math.min(mEnd, 14)}`, 'coups.png'],
  ['Coups', `J6:N${Math.min(mEnd, 12)}`, 'coups-details.png'],
  ['Animations', `A1:G${Math.min(aEnd, 13)}`, 'animations.png'],
  ['Reprise', `A1:F${rEnd}`, 'reprise.png'],
];
for (const [sheetName, range, filename] of previews) {
  const preview = await wb.render({ sheetName, range, scale: 1.25, format: 'png' });
  await fs.writeFile(path.join(reviewDir, filename), new Uint8Array(await preview.arrayBuffer()));
}
const xlsxName = 'PRODUCTION_ARMAX_LOT04.xlsx';
const exportedPath = path.join(outputDir, xlsxName);
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(exportedPath);
await fs.copyFile(exportedPath, path.join(lotDir, xlsxName));
const report = {
  schemaVersion: 1, scope: 'Export et vérification du suivi Armax lot04. Aucune validation de gameplay ou de fidélité 1:1.',
  baseCommit: source.baseCommit ?? null,
  inputs: { fightersSha256: hash(sourceBytes), manifestSha256: manifestBytes ? hash(manifestBytes) : null, recoverySha256: hash(recoveryBytes) },
  worksheets: Object.keys(sheets), summary: { expected, observed },
  counts: { fighters: fighters.length, moves: moveRows.length, animationTasks: animationRows.length, assets: assets.length },
  assetChecks: checks,
  recalculation: { imageStatusChange: 'passed', animationStatusChange: animationRows.length ? 'passed' : 'not applicable', restored: true },
  summaryInspection: summaryInspection.ndjson,
  formulaErrorInspection: errors.ndjson,
  renders: previews.map(([sheetName, range, filename]) => ({ sheetName, range, filename })),
  outputSha256: hash(await fs.readFile(exportedPath)),
  nativeExcelValidation: 'Non exécutée',
};
await fs.writeFile(path.join(reviewDir, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ workbook: path.join(lotDir, xlsxName), reviewDir, counts: report.counts, summary: observed, sha256: report.outputSha256 }));

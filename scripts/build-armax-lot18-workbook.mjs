import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Copy this builder to a temporary directory with a node_modules symlink to
// CODEX_PRIMARY_RUNTIME_NODE_MODULES, then run with CODEX_PRIMARY_RUNTIME_NODE.
// SpreadsheetFile is the only workbook import, authoring and export path.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || '/workspace/scratch/563576916330/outputs/armax-lot18-20261125');
const qaDir = path.resolve(process.env.ARMAX_QA_DIR || '/tmp/armax-workbook-563576916330/qa');
const lotDir = path.join(repoRoot, 'docs/armax/lot18');
const baselinePath = path.join(repoRoot, 'docs/armax/lot16/Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx');
const inspectOnly = process.argv.includes('--inspect');
const sha256 = data => createHash('sha256').update(data).digest('hex');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(repoRoot, relative), 'utf8'));
await fs.mkdir(qaDir, { recursive: true });
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath));
const summary = wb.worksheets.getItem('Synthese');
const list = wb.worksheets.getItem('Catalogue');
const recovered = wb.worksheets.getItem('Recuperes');
const sheetNames = wb.worksheets.items.map(sheet => sheet.name);
if (JSON.stringify(sheetNames) !== JSON.stringify(['Synthese','Catalogue','Recuperes'])) throw new Error('Unexpected baseline sheets');
const baselineInspection = {
  sheets: sheetNames,
  summary: summary.getRange('A6:E24').values,
  catalogueHeaders: list.getRange('A5:S5').values[0],
  recoveredHeaders: recovered.getRange('A5:M5').values[0],
  tables: [list,recovered].flatMap(sheet => sheet.tables.items.map(table => ({sheet:sheet.name,name:table.name,style:table.style,header:table.getHeaderRowRange().address,data:table.getDataRows().address}))),
  templateSha256: sha256(await fs.readFile(baselinePath))
};
await fs.writeFile(path.join(qaDir, 'baseline-inspection.json'), JSON.stringify(baselineInspection,null,2)+'\n');
async function render(sheetName, range, name) {
  const preview = await wb.render({sheetName,range,scale:1,format:'png'});
  const target = path.join(qaDir,name+'.png');
  await fs.writeFile(target,new Uint8Array(await preview.arrayBuffer()));
  return target;
}
if (inspectOnly) {
  for (const [sheetName,range,name] of [
    ['Synthese','A1:E33','baseline-summary'],
    ['Catalogue','A1:J9','baseline-catalogue'],
    ['Recuperes','A1:I9','baseline-recovered']
  ]) await render(sheetName,range,name);
  console.log(JSON.stringify(baselineInspection,null,2));
  process.exit(0);
}
const catalogPath = 'docs/armax/lot18/production-catalog.json';
const manifestPath = 'docs/armax/lot18/manifest.json';
const baselineCatalogPath = 'docs/armax/lot16/production-catalog.json';
const recoveryPath = 'docs/armax/lot17/recovery-audit.json';
const previousManifestPaths = ['docs/armax/lot17/source-me1-me2-mea/manifest.json','docs/armax/lot17/source-me3/manifest.json'];
const [catalog,manifest,baselineCatalog,recoveryAudit,...previousManifests] = await Promise.all(
  [catalogPath,manifestPath,baselineCatalogPath,recoveryPath,...previousManifestPaths].map(readJson)
);
const baseCommit = execFileSync('git',['rev-parse','HEAD'],{cwd:repoRoot,encoding:'utf8'}).trim();
const trackedPaths = new Set(execFileSync('git',['ls-tree','-r','--name-only','HEAD'],{cwd:repoRoot,encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n'));
const identityFields = ['category','name','work','dlc','variant','plannedUse'];
const baselineById = new Map(baselineCatalog.entries.map(entry => [entry.id,entry]));
const byId = new Map(catalog.entries.map(entry => [entry.id,entry]));
if (baselineById.size !== 192 || byId.size !== catalog.entries.length) throw new Error('Invalid identity population');
for (const [id,previous] of baselineById) {
  const current = byId.get(id);
  if (!current || identityFields.some(key => JSON.stringify(previous[key]) !== JSON.stringify(current[key]))) throw new Error('Inherited identity changed: '+id);
  const retainedFiles = new Set([...(current.assetFiles || []),...(current.alternateAssetFiles || [])]);
  for (const file of [...previous.assetFiles,...previous.alternateAssetFiles]) if (!retainedFiles.has(file)) throw new Error('Historical file omitted: '+file);
  if (previous.latestGenerationAttempt === 'blocked' && current.latestGenerationAttempt !== 'blocked') throw new Error('Historical exclusion changed: '+id);
}
const categories = ['personnage','costume','stage','effet','projectile','accessoire'];
const categoryLabels = {personnage:'Personnages / ennemis',costume:'Costumes',stage:'Décors / calques',effet:'Effets',projectile:'Projectiles',accessoire:'Accessoires'};
const roleLabels = {combattant_candidat:'Combattant proposé',opposant_candidat:'Adversaire proposé',boss_candidat:'Boss proposé',narration_support:'Narration / soutien',variante_visuelle:'Variante de tenue',arene_adaptee:'Arène adaptée',effet_visuel:'Effet visuel proposé',projectile_candidat:'Projectile proposé',accessoire_candidat:'Accessoire proposé',calque_decor:'Calque de décor'};
const fileAvailability = new Map();
for (const entry of catalog.entries) {
  if (!categories.includes(entry.category)) throw new Error('Unknown category: '+entry.category);
  if (!baselineById.has(entry.id) && entry.addedInLot !== 'lot18') throw new Error('Undocumented addition: '+entry.id);
  for (const field of ['assetFiles','alternateAssetFiles','sourceUrls']) if (!Array.isArray(entry[field])) throw new Error('Missing array '+field+': '+entry.id);
  if (entry.fidelity1to1Validated !== false || entry.engineIntegrated === true || entry.status === 'Validé') throw new Error('Unexpected fidelity or integration promotion: '+entry.id);
  for (const file of [...entry.assetFiles,...entry.alternateAssetFiles]) {
    if (fileAvailability.has(file)) continue;
    let local = false;
    try { local = (await fs.stat(path.join(repoRoot,file))).size > 0; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const gitTracked = trackedPaths.has(file);
    if (!local && !gitTracked) throw new Error('Missing catalogue file: '+file);
    fileAvailability.set(file,{local,gitTracked});
  }
}
const generatedAssets = manifest.assets || [];
const generatedById = new Map();
const generatedPaths = new Set();
const checkedNativeFiles = [];
async function verifyNative(asset) {
  if (!asset.path || !asset.path.endsWith('.png')) throw new Error('Missing PNG path');
  const bytes = await fs.readFile(path.join(repoRoot,asset.path));
  if (!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Invalid PNG signature: '+asset.path);
  const digest = sha256(bytes);
  const expectedHash = asset.technical?.sha256 || asset.sha256;
  if (!expectedHash || digest !== expectedHash) throw new Error('PNG hash mismatch: '+asset.path);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== asset.technical?.width || height !== asset.technical?.height) throw new Error('PNG dimensions mismatch: '+asset.path);
  checkedNativeFiles.push({path:asset.path,sha256:digest,bytes:bytes.length,width,height});
}
for (const asset of generatedAssets) {
  if (!asset.catalogId || !byId.has(asset.catalogId) || generatedPaths.has(asset.path)) throw new Error('Invalid generated asset association');
  if (asset.fidelity1to1Validated === true || asset.engineIntegrated === true) throw new Error('Generated asset cannot certify fidelity or integration');
  generatedPaths.add(asset.path);
  const associated = byId.get(asset.catalogId);
  if (![...associated.assetFiles,...associated.alternateAssetFiles].includes(asset.path)) throw new Error('Generated asset omitted from catalogue: '+asset.path);
  generatedById.set(asset.catalogId,(generatedById.get(asset.catalogId) || 0)+1);
  await verifyNative(asset);
}
if (!generatedAssets.length) throw new Error('No generated lot18 assets');
const recoveredLot17 = [
  ...recoveryAudit.assets.map(asset => ({...asset,origin:'Récupéré ce tour'})),
  ...previousManifests.flatMap(doc => doc.assets || []).map(asset => ({...asset,origin:'Déjà publié lot17'}))
];
const recoveredPaths = new Set();
for (const asset of recoveredLot17) {
  if (recoveredPaths.has(asset.path)) throw new Error('Duplicate recovered asset: '+asset.path);
  recoveredPaths.add(asset.path);
  await verifyNative(asset);
  if (asset.selected) {
    if (!byId.get(asset.catalogId)?.assetFiles.includes(asset.path)) throw new Error('Selected recovery missing from catalogue: '+asset.path);
  } else if (catalog.entries.some(entry => [...entry.assetFiles,...entry.alternateAssetFiles].includes(asset.path))) {
    throw new Error('Unassigned recovery linked to a catalogue identity: '+asset.path);
  }
}
const first = 6, last = first+catalog.entries.length-1, baselineLast = first+baselineCatalog.entries.length-1;
const historicRecoveryRows = recovered.getRange('A6:M91').values;
if (historicRecoveryRows.length !== 86) throw new Error('Unexpected historical recovery count');
const lastRecovered = first+historicRecoveryRows.length+recoveredLot17.length-1;
const isPresent = entry => entry.assetFiles.length > 0 && entry.assetFiles.every(file => fileAvailability.has(file));
const recoveredIds = new Set(recoveryAudit.assets.filter(asset => asset.selected).map(asset => asset.catalogId));
const rows = catalog.entries.map(entry => {
  const currentCount = generatedById.get(entry.id) || 0;
  if (entry.pngCountLot18 !== undefined && entry.pngCountLot18 !== currentCount) throw new Error('Declared generated-file count mismatch: '+entry.id);
  const lastAttempt = entry.generationExclusionReportedInPriorSession ? 'Refus rapporté' : entry.latestGenerationAttempt === 'blocked' ? 'Bloqué' : entry.latestGenerationAttempt === 'failed' ? 'Échec' : recoveredIds.has(entry.id) ? 'Récupéré' : isPresent(entry) ? 'Généré' : 'Non tenté';
  const note = [entry.producedSubzone ? `Zone produite : ${entry.producedSubzone.replace(/[.\s]+$/,'')}.` : null,entry.productionNote,...(entry.generationNotes || []),entry.referenceGap,entry.generationExclusionReportedInPriorSession?.note].filter(Boolean).join(' ');
  return [entry.name,categoryLabels[entry.category],entry.work,entry.variant,entry.dlc || '',entry.priority,entry.status,isPresent(entry)?'Présent':'Absent',lastAttempt,'Non',roleLabels[entry.plannedUse] || entry.plannedUse,entry.id,note,entry.sourceUrls.join('\n'),entry.assetFiles.join('\n'),entry.addedInLot,entry.imageLot || '',currentCount,entry.alternateAssetFiles.join('\n')];
});
// The table ranges and one generated-lot header change. Recreate only these
// directly affected native table definitions, retaining their names and style.
function extendTable(sheet,name,range) {
  const previous = sheet.tables.getItem(name);
  const properties = {style:previous.style,showHeaders:previous.showHeaders,showTotals:previous.showTotals,showBandedColumns:previous.showBandedColumns,showFilterButton:previous.showFilterButton};
  previous.delete();
  const table = sheet.tables.add(range,true,name);
  for (const [key,value] of Object.entries(properties)) if (value !== undefined) table[key] = value;
  return table;
}
// Copy the nearest existing row's native formatting for the appended identities.
for (let row = baselineLast+1; row <= last; row++) list.getRange(`A${row}:S${row}`).copyFrom(list.getRange(`A${baselineLast}:S${baselineLast}`),'all');
list.getRange(`A${first}:S${last}`).values = rows;
list.getRange('R5').values = [['PNG du lot 18']];
extendTable(list,'ArmaxCatalogue',`A5:S${last}`);
list.getRange(`F${first}:F${last}`).dataValidation = {rule:{type:'list',values:['P0','P1','P2']}};
list.getRange(`G${first}:G${last}`).dataValidation = {rule:{type:'list',values:['Défini','Prototype','Intégré','Validé']}};
// Preserve existing conditional rules and extend them only to the new rows.
if (last > baselineLast) {
  list.getRange(`A${baselineLast+1}:S${last}`).format.wrapText = true;
  list.getRange(`F${baselineLast+1}:F${last}`).conditionalFormats.add('containsText',{text:'P0',format:{fill:'#FFF2CD',font:{bold:true}}});
  list.getRange(`I${baselineLast+1}:I${last}`).conditionalFormats.add('containsText',{text:'Bloqué',format:{fill:'#FCE4E3',font:{color:'#9B2C2C'}}});
}
for (let index=0; index<rows.length; index++) {
  const previous = baselineById.get(catalog.entries[index].id);
  const changed = !previous || JSON.stringify(previous) !== JSON.stringify(catalog.entries[index]);
  if (!changed) continue;
  const noteLines = Math.max(1,Math.ceil(rows[index][12].length/135));
  const sourceLines = rows[index][13].split('\n').reduce((sum,line) => sum+Math.max(1,Math.ceil(line.length/180)),0);
  const height = Math.max(49,Math.max(noteLines,sourceLines)*12+10);
  if (height > 409) throw new Error('Production note needs a wider cell: '+catalog.entries[index].id);
  list.getRange(`A${first+index}:S${first+index}`).format.rowHeight = height;
}
const newRecoveryRows = recoveredLot17.map(asset => [
  asset.selected ? asset.name : asset.name+' (hypothèse)',
  'lot17',asset.category === 'costume' || asset.catalogId?.startsWith('cst_') ? 'Costume' : 'Corps',
  asset.selected ? 'Association provisoire' : 'Non attribué','Prototype',
  asset.technical.width,asset.technical.height,asset.technical.mode,'Non',
  asset.recoveryId || asset.assetId,asset.technical.sha256 || asset.sha256,asset.path,
  [asset.selectionMeaning,asset.visualObservations,asset.reservations,...(asset.reviewNotes || []),asset.catalogId ? 'Fiche : '+asset.catalogId+'.' : 'Aucune fiche associée.'].filter(Boolean).join(' '),asset.origin
]);
for (let row=92;row<=lastRecovered;row++) recovered.getRange(`A${row}:M${row}`).copyFrom(recovered.getRange('A91:M91'),'all');
recovered.getRange(`A92:N${lastRecovered}`).values = newRecoveryRows;
recovered.getRange(`A92:J${lastRecovered}`).format.wrapText = true;
recovered.getRange(`K92:L${lastRecovered}`).format.wrapText = false;
recovered.getRange(`M92:N${lastRecovered}`).format.wrapText = true;
recovered.getRange('N5').copyFrom(recovered.getRange('D5'),'all');
recovered.getRange('N5').values = [['Origine']];
recovered.getRange('N6:N91').values = historicRecoveryRows.map(() => ['Archive historique']);
recovered.getRange(`N6:N${lastRecovered}`).format.font = {name:'Arial',size:10,color:'#22354D'};
recovered.getRange(`N6:N${lastRecovered}`).format.verticalAlignment = 'center';
recovered.getRange(`N6:N${lastRecovered}`).format.wrapText = true;
recovered.getRange(`N1:N${lastRecovered}`).format.columnWidthPx = 150;
for (let index=0;index<newRecoveryRows.length;index++) recovered.getRange(`A${92+index}:N${92+index}`).format.rowHeight = Math.max(45,Math.ceil(newRecoveryRows[index][12].length/210)*12+10);
extendTable(recovered,'ArmaxRecuperes',`A5:N${lastRecovered}`);
recovered.getRange('A3').values = [[`${historicRecoveryRows.length+recoveredLot17.length} fichiers uniques : archives historiques et consolidation du lot 17. Les associations restent provisoires.`]];
recovered.getRange('G3').values = [['Ajouts lot 17']];
recovered.getRange('H3').formulas = [[`=COUNTIFS(B${first}:B${lastRecovered},"lot17")`]];

const priorNotes = summary.getRange('A27:A33').values;
summary.getRange('A31:H37').copyFrom(summary.getRange('A27:H33'),'all');
summary.getRange('A27:H33').clear({applyTo:'contents'});
summary.getRange('A31:A37').values = priorNotes;
summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 18']];
for (const [index,category] of categories.entries()) {
  const row = 7+index;
  summary.getRange(`B${row}:E${row}`).formulas = [[
    `=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row})`,
    `=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$H$${first}:$H$${last},"Présent")`,
    `=B${row}-C${row}`,
    `=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$J$${first}:$J$${last},"Oui")`
  ]];
}
const productionMetrics = [
  [17,'Fiches ajoutées au lot 18',`=COUNTIFS('Catalogue'!$P$${first}:$P$${last},"lot18")`],
  [18,'Fiches avec nouvel actif au lot 18',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0")`],
  [19,'PNG générés pendant ce tour',`=SUM('Catalogue'!$R$${first}:$R$${last})`],
  [20,'Originaux récupérés avant le lot 17',`=COUNTIFS('Recuperes'!$N$${first}:$N$${lastRecovered},"Archive historique")`],
  [21,'Fiches illustrées sans nouvel actif au lot 18',`=COUNTIFS('Catalogue'!$H$${first}:$H$${last},"Présent",'Catalogue'!$R$${first}:$R$${last},0)`],
  [22,'PNG du lot 17 présents dans le dépôt',`=COUNTIFS('Recuperes'!$B$${first}:$B$${lastRecovered},"lot17")`],
  [23,'Fiches héritées enrichies au lot 18',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0",'Catalogue'!$P$${first}:$P$${last},"<>lot18")`],
  [24,'Nouvelles fiches illustrées au lot 18',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0",'Catalogue'!$P$${first}:$P$${last},"lot18")`],
  [25,'Lot 17 : associations provisoires',`=COUNTIFS('Recuperes'!$B$${first}:$B$${lastRecovered},"lot17",'Recuperes'!$D$${first}:$D$${lastRecovered},"Association provisoire")`],
  [26,'Lot 17 : images non attribuées',`=COUNTIFS('Recuperes'!$B$${first}:$B$${lastRecovered},"lot17",'Recuperes'!$D$${first}:$D$${lastRecovered},"Non attribué")`],
  [27,'Lot 17 : récupérées pendant ce tour',`=COUNTIFS('Recuperes'!$N$${first}:$N$${lastRecovered},"Récupéré ce tour")`],
  [28,'Lot 17 : déjà publiées auparavant',`=COUNTIFS('Recuperes'!$N$${first}:$N$${lastRecovered},"Déjà publié lot17")`]
];
for (const [row,label,formula] of productionMetrics) {
  if (row >= 25) summary.getRange(`A${row}:B${row}`).copyFrom(summary.getRange('A24:B24'),'all');
  summary.getRange(`A${row}`).values = [[label]];
  summary.getRange(`B${row}`).formulas = [[formula]];
}
summary.getRange('A25:B28').format.rowHeight = 24;
const stageLayers = catalog.entries.filter(entry => entry.category === 'stage' && entry.plannedUse === 'calque_decor').length;
const stageMasters = catalog.entries.filter(entry => entry.category === 'stage').length-stageLayers;
summary.getRange('A33').values = [[`Décors : ${stageMasters} masters et ${stageLayers} calques. Assemblage et jeu restent à valider.`]];
summary.getRange('A37').values = [['Exclusions conservées ; la scène Grunt refusée ne produit aucun fichier.']];
summary.getRange('A31:A37').format.font.color = '#657181';
summary.getRange('A31:H37').format.rowHeight = 22;

wb.recalculate();
const presenceIndex = catalog.entries.findIndex(entry => generatedById.has(entry.id) && isPresent(entry));
if (presenceIndex < 0) throw new Error('No new presence cell to verify');
const presenceCell = list.getRange(`H${first+presenceIndex}`);
const countPair = () => [summary.getRange('C13').values[0][0],summary.getRange('D13').values[0][0]];
const beforePresence = countPair();
presenceCell.values = [['Absent']];
wb.recalculate();
const temporarilyAbsent = countPair();
if (temporarilyAbsent[0] !== beforePresence[0]-1 || temporarilyAbsent[1] !== beforePresence[1]+1) throw new Error('Presence dependency did not recalculate');
presenceCell.values = [['Présent']];
wb.recalculate();
const restoredPresence = countPair();
if (JSON.stringify(restoredPresence) !== JSON.stringify(beforePresence)) throw new Error('Presence input was not restored');
const calculated = Object.fromEntries([
  ['total','B13'],['withImage','C13'],['withoutImage','D13'],['certified1to1','E13'],
  ['addedEntries','B17'],['newIllustratedSubjects','B18'],['newPngFiles','B19'],['historicRecovered','B20'],
  ['carriedForwardIllustrated','B21'],['lot17PngFiles','B22'],['newInheritedIllustratedSubjects','B23'],
  ['newAddedIllustratedSubjects','B24'],['lot17AssociatedFiles','B25'],['lot17UnassignedFiles','B26'],
  ['recoveredThisTurn','B27'],['alreadyPublishedLot17','B28']
].map(([key,cell]) => [key,summary.getRange(cell).values[0][0]]));
const independent = {
  total:catalog.entries.length,withImage:catalog.entries.filter(isPresent).length,withoutImage:catalog.entries.filter(entry => !isPresent(entry)).length,
  certified1to1:0,addedEntries:catalog.entries.filter(entry => entry.addedInLot === 'lot18').length,
  newIllustratedSubjects:generatedById.size,newPngFiles:generatedPaths.size,historicRecovered:historicRecoveryRows.length,
  carriedForwardIllustrated:catalog.entries.filter(entry => isPresent(entry) && !generatedById.has(entry.id)).length,
  lot17PngFiles:recoveredLot17.length,newInheritedIllustratedSubjects:[...generatedById.keys()].filter(id => baselineById.has(id)).length,
  newAddedIllustratedSubjects:[...generatedById.keys()].filter(id => !baselineById.has(id)).length,
  lot17AssociatedFiles:recoveredLot17.filter(asset => asset.selected).length,lot17UnassignedFiles:recoveredLot17.filter(asset => !asset.selected).length,
  recoveredThisTurn:recoveryAudit.assets.length,alreadyPublishedLot17:previousManifests.reduce((sum,doc) => sum+(doc.assets || []).length,0)
};
for (const key of Object.keys(independent)) if (calculated[key] !== independent[key]) throw new Error(`Calculated ${key}: ${calculated[key]}; expected ${independent[key]}`);
const categoryCounts = Object.fromEntries(categories.map(category => [category,catalog.entries.filter(entry => entry.category === category).length]));
for (const [index,category] of categories.entries()) {
  if (summary.getRange(`B${7+index}`).values[0][0] !== categoryCounts[category]) throw new Error('Category formula mismatch: '+category);
  if (catalog.counts?.[category] !== undefined && catalog.counts[category] !== categoryCounts[category]) throw new Error('Declared category mismatch: '+category);
}
for (const key of ['total','withImage','withoutImage','certified1to1','newPngFiles']) if (catalog.currentCounts?.[key] !== undefined && catalog.currentCounts[key] !== independent[key]) throw new Error('Declared catalogue total mismatch: '+key);
const formulaError = /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for (const sheet of [summary,list,recovered]) for (const row of sheet.getUsedRange().values) for (const value of row) if (typeof value === 'string' && formulaError.test(value)) throw new Error('Formula error in '+sheet.name+': '+value);
const inspection = await wb.inspect({kind:'table',range:'Synthese!A6:E28',include:'values,formulas',tableMaxRows:23,tableMaxCols:5,maxChars:7500});
await fs.writeFile(path.join(qaDir,'summary-inspect.ndjson'),inspection.ndjson);
const errorInspection = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula errors'});
await fs.writeFile(path.join(qaDir,'formula-errors.ndjson'),errorInspection.ndjson);
const costumeIndices = catalog.entries.map((entry,index) => entry.category === 'costume' && generatedById.has(entry.id) ? index : -1).filter(index => index >= 0);
const longestNoteIndex = rows.reduce((best,row,index,all) => row[12].length > all[best][12].length ? index : best,0);
const previewSpecs = [
  ['Synthese','A1:E37','lot18-summary'],
  ['Catalogue',`A${first+Math.min(...costumeIndices)}:J${first+Math.max(...costumeIndices)}`,'lot18-costumes'],
  ['Catalogue',`A${baselineLast-1}:J${last}`,'lot18-additions'],
  ['Catalogue',`M${first+longestNoteIndex}:N${first+longestNoteIndex}`,'lot18-longest-note'],
  ['Recuperes',`A92:J${lastRecovered}`,'lot18-recovered'],
  ['Recuperes',`N90:N${lastRecovered}`,'lot18-recovery-origin']
];
const renderedPreviews = [];
for (const [sheetName,range,name] of previewSpecs) renderedPreviews.push({sheet:sheetName,range,path:await render(sheetName,range,name)});
await fs.mkdir(outputDir,{recursive:true});
const outputName = 'Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx';
const outputPath = path.join(outputDir,outputName);
const exportFile = await SpreadsheetFile.exportXlsx(wb);
await exportFile.save(outputPath);
await fs.copyFile(outputPath,path.join(lotDir,outputName));
// Independent, read-only inspection of native XLSX structures. This does not
// author, serialize, patch or resave any workbook content.
const nativeInspectionCode = `
import json, sys, zipfile, xml.etree.ElementTree as E
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def read_book(filename):
    z=zipfile.ZipFile(filename)
    assert z.testzip() is None, 'Invalid XLSX archive'
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
    sheets=[E.fromstring(z.read('xl/worksheets/sheet'+str(i)+'.xml')) for i in (1,2,3)]
    def cells(sheet):
        result={}
        for cell in sheet.findall('.//m:c',ns):
            value=cell.findtext('m:v',None,ns)
            if cell.get('t')=='s': value=strings[int(value)]
            elif cell.get('t')=='inlineStr': value=''.join(cell.find('m:is',ns).itertext())
            result[cell.get('r')]=value
        return result
    names=[x.get('name') for x in E.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',ns)]
    tables=[E.fromstring(z.read(name)) for name in z.namelist() if name.startswith('xl/tables/') and name.endswith('.xml')]
    return z,sheets,[cells(sheet) for sheet in sheets],names,tables
old,old_sheets,old_cells,old_names,old_tables=read_book(sys.argv[1])
new,new_sheets,new_cells,new_names,new_tables=read_book(sys.argv[2])
assert old_names==new_names==['Synthese','Catalogue','Recuperes']
assert {x.get('name') for x in old_tables}=={x.get('name') for x in new_tables}
for table in new_tables:
    assert table.find('m:tableStyleInfo',ns).get('name')=='TableStyleMedium2'
for i in (1,2):
    assert new_sheets[i].find('.//m:pane',ns).attrib==old_sheets[i].find('.//m:pane',ns).attrib
for row in range(6,92):
    for column in 'ABCDEFGHIJKLM':
        assert old_cells[2].get(column+str(row))==new_cells[2].get(column+str(row)), 'Historical recovery data changed'
old_id_rows={old_cells[1].get('L'+str(row)):row for row in range(6,198)}
new_id_rows={value:int(cell[1:]) for cell,value in new_cells[1].items() if cell.startswith('L') and int(cell[1:])>=6}
for identity,old_row in old_id_rows.items():
    new_row=new_id_rows[identity]
    for column in ('A','B','C','D','E','K','L','P'):
        assert (old_cells[1].get(column+str(old_row)) or '')==(new_cells[1].get(column+str(new_row)) or ''), 'Inherited identity changed'
formula_count=0
for sheet in new_sheets:
    for cell in sheet.findall('.//m:c',ns):
        assert cell.get('t')!='e', 'Native Excel error cell'
        if cell.find('m:f',ns) is not None:
            formula_count+=1
            assert cell.find('m:v',ns) is not None, 'Missing formula cache'
validations=[x.attrib for x in new_sheets[1].findall('.//m:dataValidation',ns)]
assert len(validations)==2 and all(v['type']=='list' for v in validations)
assert sum(int(new_cells[1].get('R'+str(row)) or 0) for row in new_id_rows.values())==int(new_cells[0]['B19'])
assert int(new_cells[0]['B13'])==len(new_id_rows)
assert int(new_cells[0]['C13'])==sum(new_cells[1].get('H'+str(row))=='Présent' for row in new_id_rows.values())
assert int(new_cells[0]['D13'])==sum(new_cells[1].get('H'+str(row))=='Absent' for row in new_id_rows.values())
assert all(new_cells[1].get('J'+str(row))=='Non' for row in new_id_rows.values())
print(json.dumps({'method':'Python standard-library ZIP/XML read only; no workbook writing','nativeTables':[{'name':x.get('name'),'range':x.get('ref')} for x in new_tables],'formulaCachesChecked':formula_count,'nativeFormulaErrors':0,'baselineIdentityRowsPreserved':len(old_id_rows),'historicalRecoveryCellsPreserved':86*13,'panesPreserved':True,'catalogueValidations':validations,'summaryCachesMatchNativeRows':True},ensure_ascii=False))
`;
const nativeVerification = JSON.parse(execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3',['-c',nativeInspectionCode,baselinePath,outputPath],{encoding:'utf8'}));
const verification = {
  schemaVersion:1,lot:'lot18',createdOn:'2026-11-25',baseCommit,
  authoring:'@oai/artifact-tool JavaScript, SpreadsheetFile.importXlsx and SpreadsheetFile.exportXlsx only',
  command:'CODEX_PRIMARY_RUNTIME_NODE <temporary copy of scripts/build-armax-lot18-workbook.mjs> <repoRoot>',
  template:{path:path.relative(repoRoot,baselinePath),sha256:baselineInspection.templateSha256},
  sources:await Promise.all([catalogPath,manifestPath,baselineCatalogPath,recoveryPath,...previousManifestPaths].map(async source => ({path:source,sha256:sha256(await fs.readFile(path.join(repoRoot,source)))}))),
  workbook:{path:'docs/armax/lot18/'+outputName,sha256:sha256(await fs.readFile(outputPath)),bytes:(await fs.stat(outputPath)).size},
  sheetNames,baselineIdentitiesPreserved:baselineById.size,identityFields,categoryCounts,independentCounts:independent,calculatedCounts:calculated,
  recalculationInputCheck:{subjectId:catalog.entries[presenceIndex].id,field:'Image',before:beforePresence,temporarilyAbsent,restored:restoredPresence,passed:true},
  preservedFeatures:['Three sheets in original order','192 inherited catalogue identities','Historical selected and alternate asset paths','86 historical recovery rows','Native table names and TableStyleMedium2','Catalogue production and priority validations','Frozen five header rows and first identifying column','Original category COUNTIFS formula conventions'],
  targetedExtensions:['Current-lot metric labels and twelve derived counts','Catalogue table to current source population','Recovered table by fourteen lot17 files and Origine column','Generated PNG count sourced from manifest and catalogue associations'],
  finalCalculationCompleted:true,formulaErrorCount:0,checkedNativeFiles,
  localCatalogueFiles:[...fileAvailability.values()].filter(value => value.local).length,
  catalogueFilesVerifiedByGitTreeOnly:[...fileAvailability.values()].filter(value => !value.local && value.gitTracked).length,
  renderedPreviews,nativeVerification,nativeExcelApplicationOpened:false,
  limitations:['Spreadsheet layout reviewed using artifact-tool renders. Native Microsoft Excel was not opened.','Presence confirms an available candidate PNG; no 1:1 fidelity, animation, engine integration or playable scene is certified.','Unassigned recovery images remain outside catalogue identity associations.']
};
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify(verification,null,2)+'\n');
await fs.copyFile(path.join(lotDir,'workbook-verification.json'),path.join(outputDir,'workbook-verification.json'));
console.log(JSON.stringify({outputPath,counts:independent,categories:categoryCounts,recalculationInputCheck:verification.recalculationInputCheck},null,2));

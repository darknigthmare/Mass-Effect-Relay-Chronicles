import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Run a copy of this script in a private temporary directory whose node_modules
// symlink points to CODEX_PRIMARY_RUNTIME_NODE_MODULES. Use the bundled Node.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || path.join(path.dirname(repoRoot), 'outputs/armax-lot19-20261127'));
const qaDir = path.resolve(process.env.ARMAX_QA_DIR || path.join(outputDir, 'qa'));
const lotDir = path.join(repoRoot, 'docs/armax/lot19');
const baselinePath = path.join(repoRoot, 'docs/armax/lot18/Mass_Effect_Armax_Suivi_Lot18_2026-11-25.xlsx');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(qaDir, {recursive:true});
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath));
const summary = wb.worksheets.getItem('Synthese');
const list = wb.worksheets.getItem('Catalogue');
const recovered = wb.worksheets.getItem('Recuperes');
const sheets = wb.worksheets.items.map(s => s.name);
if (JSON.stringify(sheets) !== JSON.stringify(['Synthese','Catalogue','Recuperes'])) throw new Error('Unexpected baseline sheets');
const originalRecoveredValues = JSON.stringify(recovered.getUsedRange().values);
const originalRecoveredFormulas = JSON.stringify(recovered.getUsedRange().formulas);
const baselineCatalogueValues = list.getRange('A6:S201').values;
const tablesBefore = [list,recovered].flatMap(s => s.tables.items.map(t => ({sheet:s.name,name:t.name,style:t.style,headers:t.getHeaderRowRange().address,data:t.getDataRows().address})));
async function render(sheetName, range, name) {
  const blob = await wb.render({sheetName,range,scale:1,format:'png'});
  const target = path.join(qaDir, name+'.png');
  await fs.writeFile(target, new Uint8Array(await blob.arrayBuffer()));
  return {sheet:sheetName,range,path:target};
}
if (process.argv.includes('--inspect')) {
  const inspection = await wb.inspect({kind:'table',range:'Synthese!A1:E37',include:'values,formulas',tableMaxRows:37,tableMaxCols:5,maxChars:7000});
  await fs.writeFile(path.join(qaDir,'baseline-summary.ndjson'),inspection.ndjson);
  const previews = [];
  for (const spec of [['Synthese','A1:E37','baseline-summary'],['Catalogue','A1:J9','baseline-catalogue'],['Recuperes','A1:J9','baseline-recovered']]) previews.push(await render(...spec));
  console.log(JSON.stringify({sheets,tablesBefore,summary:summary.getRange('A6:E37').values,headers:list.getRange('A5:S5').values,previews},null,2));
  process.exit(0);
}

const readJson = async relative => JSON.parse(await fs.readFile(path.join(repoRoot,relative),'utf8'));
const cataloguePath = 'docs/armax/lot19/production-catalog.json';
const manifestPath = 'docs/armax/lot19/art-production/manifest.json';
const attributionPath = 'docs/armax/lot19/recovered-attributions.json';
const [catalogue,baseline,manifest,attributionReport] = await Promise.all([cataloguePath,'docs/armax/lot18/production-catalog.json',manifestPath,attributionPath].map(readJson));
if (baseline.entries.length !== 196 || catalogue.entries.length !== 196) throw new Error('This update must preserve all 196 existing identities');
const identityFields = ['id','category','name','work','dlc','variant','plannedUse','addedInLot'];
for (let i=0;i<baseline.entries.length;i++) for (const field of identityFields) {
  if (JSON.stringify(baseline.entries[i][field]) !== JSON.stringify(catalogue.entries[i][field])) throw new Error('Identity or order changed: '+field+' '+i);
}
const generatedById = new Map();
for (const asset of manifest.assets) generatedById.set(asset.catalogId,(generatedById.get(asset.catalogId)||0)+1);
const catalogueById = new Map(catalogue.entries.map(entry=>[entry.id,entry]));
const historicalById = new Map(attributionReport.associations.map(item=>[item.catalogId,item]));
if (historicalById.size !== 2 || attributionReport.associations.length !== 2 || attributionReport.unresolved.length !== 1) throw new Error('Expected two historical attributions and one unresolved image');
for (const item of attributionReport.associations) {
  const entry = catalogueById.get(item.catalogId);
  if (!item.selected || item.newPngFile || item.imageLot !== 'lot17' || item.attributionLot !== 'lot19' || !entry?.assetFiles.includes(item.path) || entry.imageLot !== 'lot17' || entry.attributionLot !== 'lot19' || generatedById.has(item.catalogId)) throw new Error('Historical attribution disagrees with catalogue: '+item.catalogId);
}
for (const item of attributionReport.unresolved) {
  if (item.selected || item.catalogId !== null || catalogue.entries.some(entry=>entry.assetFiles.includes(item.path))) throw new Error('An unresolved historical image was attributed');
}
const changedIndices = [];
const first = 6, last = first+catalogue.entries.length-1;
list.getRange('R5').values = [['PNG du lot 19']];
list.getRange(`R${first}:R${last}`).values = catalogue.entries.map(e => [generatedById.get(e.id)||0]);
for (let i=0;i<catalogue.entries.length;i++) {
  const entry = catalogue.entries[i];
  if (JSON.stringify(entry) === JSON.stringify(baseline.entries[i])) continue;
  const assetFilesChanged = JSON.stringify(entry.assetFiles) !== JSON.stringify(baseline.entries[i].assetFiles);
  if (!generatedById.has(entry.id) && !historicalById.has(entry.id) && !assetFilesChanged && entry.latestGenerationAttempt === baseline.entries[i].latestGenerationAttempt) continue;
  const row = first+i;
  changedIndices.push(i);
  const hasImage = entry.assetFiles.length > 0;
  const reviewNotes = entry.generationNotes?.length ? entry.generationNotes : [entry.referenceGap];
  const noteParts = [...new Set([entry.producedSubzone ? `Zone produite : ${entry.producedSubzone}` : '',entry.productionNote,...reviewNotes,entry.generationExclusionReportedInPriorSession?.note].filter(Boolean))];
  const notes = noteParts.join('\n');
  list.getRange(`G${row}:J${row}`).values = [[entry.status,hasImage?'Présent':'Absent',historicalById.has(entry.id) ? 'Attribué' : entry.latestGenerationAttempt === 'blocked' ? 'Bloqué' : hasImage ? 'Généré' : 'Non produit','Non']];
  list.getRange(`M${row}:O${row}`).values = [[notes,entry.sourceUrls.join('\n'),entry.assetFiles.join('\n')]];
  list.getRange(`Q${row}`).values = [[entry.imageLot||'']];
  list.getRange(`S${row}`).values = [[(entry.alternateAssetFiles||[]).join('\n')]];
  const lines = Math.max(notes.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/135)),0),entry.sourceUrls.length);
  list.getRange(`A${row}:S${row}`).format.rowHeight = Math.min(409,Math.max(49,lines*12+10));
}

// This source sheet records the current associations without changing the
// historical Recuperes snapshot or counting its existing files as new PNGs.
const attributions = wb.worksheets.add('Attributions19');
const attributionItems = [...attributionReport.associations,...attributionReport.unresolved];
const attributionFirst = 6, attributionLast = attributionFirst+attributionItems.length-1;
const displayIdentity = id=>catalogueById.get(id)?.name || id || 'Non attribué';
const attributionRows = attributionItems.map(item=>[
  item.name || displayIdentity(item.possibleCatalogIds?.[0])+' (hypothèse)',
  item.imageLot,item.attributionLot,displayIdentity(item.previousHypothesis.originalCatalogId),
  displayIdentity(item.previousHypothesis.catalogId),displayIdentity(item.catalogId),
  item.selected?'Attribué':'Non résolu',item.selected?catalogueById.get(item.catalogId).status:'Non attribué',
  0,item.fidelity1to1Validated?'Oui':'Non',item.engineIntegrated?'Oui':'Non',item.path,item.sha256,
  item.reviewNotes.join('\n'),item.limits.join('\n'),
  [...(item.sourcePageUrls||[]),...item.sourceUrls].join('\n') || 'Aucune référence exacte inspectée',
  item.previousHypothesis.originalCatalogId || 'Non attribué',item.previousHypothesis.catalogId || 'Aucune',item.catalogId || 'Non attribué'
]);
attributions.showGridLines = false;
attributions.getRange('A2').copyFrom(recovered.getRange('A2'),'all');
attributions.getRange('A2').values = [['Attributions des images historiques — lot 19']];
attributions.getRange('A3').copyFrom(recovered.getRange('A3'),'all');
attributions.getRange('A3').values = [['Images du lot 17. Les anciennes hypothèses étaient non sélectionnées. Les attributions conservent le statut Prototype.']];
attributions.getRange(`A5:S${attributionLast}`).format.font = {name:'Arial',size:10,color:'#24374D'};
attributions.getRange('A5:S5').copyFrom(list.getRange('A5:S5'),'all');
attributions.getRange('A5:S5').values = [['Sujet examiné','Lot du PNG','Lot attribution','Association avant lot 19','Ancienne hypothèse','Association au lot 19','Décision','Production','Nouveaux PNG 19','1:1 validé','Moteur intégré','Chemin historique du PNG','SHA-256 du PNG','Preuves visuelles','Limites de la comparaison','Sources visuelles','ID associé auparavant','ID de l’ancienne hypothèse','ID associé au lot 19']];
attributions.getRange(`A${attributionFirst}:S${attributionLast}`).values = attributionRows;
attributions.getRange(`A5:S${attributionLast}`).format.wrapText = true;
attributions.getRange(`A6:S${attributionLast}`).format.verticalAlignment = 'top';
attributions.getRange('A5:S5').format.rowHeight = 36;
const attributionWidths = [34,11,13,20,30,30,16,15,15,12,14,85,68,105,105,125,32,32,32];
for (let col=0;col<attributionWidths.length;col++) attributions.getRangeByIndexes(4,col,attributionItems.length+1,1).format.columnWidth = attributionWidths[col];
for (let i=0;i<attributionRows.length;i++) {
  const lineCount = Math.max(...attributionRows[i].map((value,col)=>String(value).split('\n').reduce((total,line)=>total+Math.max(1,Math.ceil(line.length/attributionWidths[col])),0)));
  attributions.getRange(`A${attributionFirst+i}:S${attributionFirst+i}`).format.rowHeight = Math.min(409,Math.max(72,lineCount*12+14));
}
attributions.getRange(`I6:I${attributionLast}`).setNumberFormat('0');
const attributionTable = attributions.tables.add(`A5:S${attributionLast}`,true,'ArmaxAttributions19');
attributionTable.style = recovered.tables.items[0].style;
attributions.freezePanes.freezeRows(5);
attributions.freezePanes.freezeColumns(1);

summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 19']];
summary.getRange('B4').values = [[new Date('2026-11-27T00:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
const metrics = [
  [17,'Fiches ajoutées au lot 19',`=COUNTIFS('Catalogue'!$P$${first}:$P$${last},"lot19")`],
  [18,'Fiches avec nouveaux PNG au lot 19',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0")`],
  [19,'PNG générés au lot 19',`=SUM('Catalogue'!$R$${first}:$R$${last})`],
  [21,'Fiches illustrées sans nouvel actif au lot 19',`=COUNTIFS('Catalogue'!$H$${first}:$H$${last},"Présent",'Catalogue'!$R$${first}:$R$${last},0)`],
  [23,'Fiches héritées avec nouveaux PNG au lot 19',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0",'Catalogue'!$P$${first}:$P$${last},"<>lot19")`],
  [24,'Nouvelles fiches avec PNG au lot 19',`=COUNTIFS('Catalogue'!$R$${first}:$R$${last},">0",'Catalogue'!$P$${first}:$P$${last},"lot19")`],
  [29,'Attributions historiques résolues au lot 19',`=COUNTIFS('Attributions19'!$G$${attributionFirst}:$G$${attributionLast},"Attribué")`],
  [30,'Fiches nouvellement illustrées au lot 19','=SUM(B18,B29)']
];
for (const row of [29,30]) summary.getRange(`A${row}:B${row}`).copyFrom(summary.getRange('A28:B28'),'all');
for (const [row,label,formula] of metrics) {
  summary.getRange('A'+row).values = [[label]];
  summary.getRange('B'+row).formulas = [[formula]];
}
summary.getRange('A25').values = [['Lot 17 : associations au bilan du lot 18']];
summary.getRange('A26').values = [['Lot 17 : non attribuées au bilan du lot 18']];
summary.getRange('A27').values = [['Lot 17 : récupérées lors du lot 18']];
summary.getRange('A28').values = [['Lot 17 : publiées avant le lot 18']];
summary.getRange('A37').values = [['Guide + extensions : 68 rubriques documentées ; moteur à réaliser.']];
wb.recalculate();
const counts = () => ({total:summary.getRange('B13').values[0][0],withImage:summary.getRange('C13').values[0][0],withoutImage:summary.getRange('D13').values[0][0],newSubjects:summary.getRange('B18').values[0][0],newPng:summary.getRange('B19').values[0][0],historicalAttributionsResolved:summary.getRange('B29').values[0][0],newIllustratedSubjects:summary.getRange('B30').values[0][0],unassignedRecoveredPngFiles:attributions.getRange(`G6:G${attributionLast}`).values.filter(row=>row[0]==='Non résolu').length});
const expected = {total:196,withImage:catalogue.entries.filter(e=>e.assetFiles.length).length,withoutImage:catalogue.entries.filter(e=>!e.assetFiles.length).length,newSubjects:generatedById.size,newPng:manifest.assets.length,historicalAttributionsResolved:historicalById.size,newIllustratedSubjects:catalogue.entries.filter((e,i)=>e.assetFiles.length&&!baseline.entries[i].assetFiles.length).length,unassignedRecoveredPngFiles:attributionReport.unresolved.length};
const actual = counts();
if (JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error('Formula counts disagree with catalogue: '+JSON.stringify({actual,expected}));
const selectedIndex = catalogue.entries.findIndex(e=>generatedById.has(e.id)&&e.assetFiles.length);
if (selectedIndex<0) throw new Error('No new image to validate');
const presenceCell = list.getRange('H'+(first+selectedIndex));
presenceCell.values = [['Absent']];
wb.recalculate();
const changedCounts = counts();
if (changedCounts.withImage!==expected.withImage-1 || changedCounts.withoutImage!==expected.withoutImage+1) throw new Error('Presence recalc failed');
presenceCell.values = [['Présent']];
wb.recalculate();
if (JSON.stringify(counts())!==JSON.stringify(expected)) throw new Error('Presence restoration failed');
const attributionCell = attributions.getRange('G'+attributionFirst);
attributionCell.values = [['Non résolu']];
wb.recalculate();
const changedAttributionCounts = counts();
if (changedAttributionCounts.historicalAttributionsResolved!==expected.historicalAttributionsResolved-1 || changedAttributionCounts.newIllustratedSubjects!==expected.newIllustratedSubjects-1 || changedAttributionCounts.newPng!==expected.newPng) throw new Error('Attribution recalc failed');
attributionCell.values = [['Attribué']];
wb.recalculate();
if (JSON.stringify(counts())!==JSON.stringify(expected)) throw new Error('Attribution restoration failed');
for (const id of historicalById.keys()) {
  const row = first+catalogue.entries.findIndex(entry=>entry.id===id);
  if (list.getRange('I'+row).values[0][0]!=='Attribué' || list.getRange('Q'+row).values[0][0]!=='lot17' || list.getRange('R'+row).values[0][0]!==0) throw new Error('Historical attribution workbook row is inconsistent: '+id);
}
const finalCatalogueValues = list.getRange('A6:S201').values;
for (let i=0;i<196;i++) for (const col of [0,1,2,3,4,10,11,15]) {
  if (baselineCatalogueValues[i][col] !== finalCatalogueValues[i][col]) throw new Error('Workbook identity changed');
}
if (JSON.stringify(recovered.getUsedRange().values)!==originalRecoveredValues || JSON.stringify(recovered.getUsedRange().formulas)!==originalRecoveredFormulas) throw new Error('Historical recovered sheet changed');
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},summary:'Lot19 formula errors'});
await fs.writeFile(path.join(qaDir,'formula-errors.ndjson'),errors.ndjson);
const formulaError=/^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for (const sheet of wb.worksheets.items) for (const row of sheet.getUsedRange().values) for (const value of row) if(typeof value==='string'&&formulaError.test(value)) throw new Error('Formula error: '+value);
await fs.writeFile(path.join(qaDir,'summary-inspect.ndjson'),(await wb.inspect({kind:'table',range:'Synthese!A6:E30',include:'values,formulas',tableMaxRows:25,tableMaxCols:5,maxChars:7500})).ndjson);
await fs.writeFile(path.join(qaDir,'attributions-inspect.ndjson'),(await wb.inspect({kind:'table',range:`Attributions19!A5:S${attributionLast}`,include:'values,formulas',tableMaxRows:4,tableMaxCols:19,maxChars:9000})).ndjson);
const previews = [await render('Synthese','A1:E37','lot19-summary'),await render('Attributions19',`A1:K${attributionLast}`,'lot19-attributions'),await render('Attributions19',`L5:M${attributionLast}`,'lot19-attribution-files'),await render('Attributions19',`N5:O${attributionLast}`,'lot19-attribution-evidence'),await render('Attributions19',`P5:S${attributionLast}`,'lot19-attribution-sources')];
for (const i of changedIndices) {
  previews.push(await render('Catalogue',`A${first+i}:J${first+i}`,'lot19-'+catalogue.entries[i].id));
}
if(changedIndices.length) {
  const longest=changedIndices.reduce((a,b)=>String(list.getRange('M'+(first+a)).values[0][0]).length>String(list.getRange('M'+(first+b)).values[0][0]).length?a:b);
  previews.push(await render('Catalogue',`M${first+longest}:O${first+longest}`,'lot19-detail'));
}
await fs.mkdir(outputDir,{recursive:true});
const outputName='Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx';
const outputPath=path.join(outputDir,outputName);
// Only this table's current-lot column title changed. Refresh its native
// definition so Excel's table-column name matches the visible header cell.
const oldTable = list.tables.items.find(t=>t.name==='ArmaxCatalogue');
const tableProperties = Object.fromEntries(['style','showHeaders','showTotals','showBandedColumns','showFilterButton'].map(k=>[k,oldTable[k]]));
oldTable.delete();
const currentTable = list.tables.add(`A5:S${last}`,true,'ArmaxCatalogue');
for (const [key,value] of Object.entries(tableProperties)) if(value!==undefined) currentTable[key]=value;
wb.recalculate();
await (await SpreadsheetFile.exportXlsx(wb)).save(outputPath);
await fs.copyFile(outputPath,path.join(lotDir,outputName));
const tablesAfter = [list,recovered].flatMap(s=>s.tables.items.map(t=>({sheet:s.name,name:t.name,style:t.style,headers:t.getHeaderRowRange().address,data:t.getDataRows().address})));
if(JSON.stringify(tablesBefore)!==JSON.stringify(tablesAfter)) throw new Error('Native tables changed unexpectedly');
const finalSheets = wb.worksheets.items.map(sheet=>sheet.name);
if(JSON.stringify(finalSheets)!==JSON.stringify([...sheets,'Attributions19'])) throw new Error('Unexpected final sheets');
const publishedQaDir = path.join(lotDir,'workbook-qa');
await fs.mkdir(publishedQaDir,{recursive:true});
for(const preview of previews) {
  const destination=path.join(publishedQaDir,path.basename(preview.path));
  await fs.copyFile(preview.path,destination);
  preview.path=path.relative(repoRoot,destination);
  preview.sha256=sha256(await fs.readFile(destination));
}
const verification={schemaVersion:1,lot:'lot19',date:'2026-11-27',baseCommit:catalogue.baseCommit,authoring:'@oai/artifact-tool import, targeted edit, recalculate, export',template:{path:path.relative(repoRoot,baselinePath),sha256:sha256(await fs.readFile(baselinePath))},workbook:{path:'docs/armax/lot19/'+outputName,sha256:sha256(await fs.readFile(outputPath)),bytes:(await fs.stat(outputPath)).size},sheets:finalSheets,identityRowsPreserved:196,recoveredSheetValuesAndFormulasPreserved:true,tablesBefore,tablesAfter,attributionSource:{path:attributionPath,sha256:sha256(await fs.readFile(path.join(repoRoot,attributionPath)))},attributionTable:{name:attributionTable.name,headers:attributionTable.getHeaderRowRange().address,data:attributionTable.getDataRows().address},counts:actual,independentCounts:expected,inputRecalculation:{id:catalogue.entries[selectedIndex].id,before:actual,temporarilyAbsent:changedCounts,restored:counts()},attributionRecalculation:{before:actual,temporarilyUnresolved:changedAttributionCounts,restored:counts()},formulaErrors:0,changedCatalogueIds:changedIndices.map(i=>catalogue.entries[i].id),previews,nativeExcelApplicationOpened:false,limitations:['Candidate image presence only; fidelity, animations and engine integration are not certified.','The two lot17 images are newly attributed, not newly generated; the historical Recuperes sheet remains unchanged.','Rendered with artifact-tool; Microsoft Excel was not opened.']};
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify(verification,null,2)+'\n');
console.log(JSON.stringify({outputPath,counts:actual,previews},null,2));

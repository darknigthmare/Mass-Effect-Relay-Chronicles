import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Run a copy with the runtime-owned node_modules linked beside it.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || path.join(path.dirname(repoRoot), 'outputs/armax-lot20-20261127'));
const qaDir = path.resolve(process.env.ARMAX_QA_DIR || path.join(outputDir, 'qa'));
const lotDir = path.join(repoRoot, 'docs/armax/lot20');
const baselinePath = path.join(repoRoot, 'docs/armax/lot19/Mass_Effect_Armax_Suivi_Lot19_2026-11-27.xlsx');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = async relative => JSON.parse(await fs.readFile(path.join(repoRoot,relative),'utf8'));
const [catalogue,baseline,manifest,attributionReport] = await Promise.all([
  'docs/armax/lot20/production-catalog.json','docs/armax/lot19/production-catalog.json',
  'docs/armax/lot20/art-production/manifest.json','docs/armax/lot20/recovered-attributions.json'
].map(readJson));
await fs.mkdir(qaDir,{recursive:true});
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(baselinePath));
const summary = wb.worksheets.getItem('Synthese');
const list = wb.worksheets.getItem('Catalogue');
const recovered = wb.worksheets.getItem('Recuperes');
const historicalAttributions = wb.worksheets.getItem('Attributions19');
const sheets = wb.worksheets.items.map(s=>s.name);
if(JSON.stringify(sheets)!==JSON.stringify(['Synthese','Catalogue','Recuperes','Attributions19'])) throw new Error('Unexpected baseline sheets');
const historical = [recovered,historicalAttributions].map(sheet=>({sheet,values:JSON.stringify(sheet.getUsedRange().values),formulas:JSON.stringify(sheet.getUsedRange().formulas)}));
const baselineCatalogueValues = list.getRange('A6:S201').values;
const tables = () => [list,recovered,historicalAttributions].flatMap(s=>s.tables.items.map(t=>({sheet:s.name,name:t.name,style:t.style,headers:t.getHeaderRowRange().address,data:t.getDataRows().address})));
const tablesBefore = tables();
if(baseline.entries.length!==196 || catalogue.entries.length!==196) throw new Error('196 existing identities required');
for(let i=0;i<196;i++) for(const key of ['id','category','name','work','dlc','variant','plannedUse','addedInLot']) {
  if(JSON.stringify(baseline.entries[i][key])!==JSON.stringify(catalogue.entries[i][key])) throw new Error('Identity/order changed: '+i+' '+key);
}
const byId = new Map(catalogue.entries.map(e=>[e.id,e]));
const generatedById = new Map();
const selectedById = new Map();
for(const a of manifest.assets) {
  generatedById.set(a.catalogId,(generatedById.get(a.catalogId)||0)+1);
  if(a.selected) selectedById.set(a.catalogId,(selectedById.get(a.catalogId)||0)+1);
}
const attributedIds = new Set(attributionReport.associations.map(a=>a.catalogId));
const targetIds = manifest.targetCatalogIds;
if(targetIds.length!==12 || targetIds.some(id=>baseline.entries.find(e=>e.id===id)?.assetFiles.length)) throw new Error('Review targets must be the 12 previously unillustrated eligible subjects');
const first=6,last=201;
list.getRange('R5').values = [['PNG du lot 20']];
list.getRange(`R${first}:R${last}`).values = catalogue.entries.map(e=>[generatedById.get(e.id)||0]);
const changedIndices=[];
const decision = e=> attributedIds.has(e.id)?'Attribué':e.latestGenerationAttempt==='blocked'?'Bloqué':selectedById.has(e.id)?'Candidat retenu':generatedById.has(e.id)?'Candidat écarté':'Non produit';
const notesFor = e => [...new Set([e.productionNote,...(e.generationNotes||[]),e.latestReferenceReview?.lot==='lot20'?e.latestReferenceReview.reason:''].filter(Boolean))].join('\n');
for(let i=0;i<196;i++) {
  const e=catalogue.entries[i];
  if(!targetIds.includes(e.id)) continue;
  const row=first+i;
  changedIndices.push(i);
  const notes=notesFor(e);
  list.getRange(`G${row}:J${row}`).values = [[e.status,e.assetFiles.length?'Présent':'Absent',attributedIds.has(e.id)?'Attribué':e.latestGenerationAttempt==='blocked'?'Bloqué':generatedById.has(e.id)?'Généré':'Non produit','Non']];
  list.getRange(`M${row}:O${row}`).values = [[notes,e.sourceUrls.join('\n'),e.assetFiles.join('\n')]];
  list.getRange(`Q${row}`).values = [[e.imageLot||'']];
  list.getRange(`S${row}`).values = [[(e.alternateAssetFiles||[]).join('\n')]];
  const lines=Math.max(notes.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/135)),0),e.sourceUrls.reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/150)),0));
  list.getRange(`A${row}:S${row}`).format.rowHeight=Math.min(409,Math.max(49,lines*12+12));
}

const review=wb.worksheets.add('Revue20');
review.showGridLines=false;
review.getRange('A2').copyFrom(recovered.getRange('A2'),'all');
review.getRange('A2').values=[['Lot 20 — douze fiches reprises en parallèle']];
review.getRange('A3').copyFrom(recovered.getRange('A3'),'all');
review.getRange('A3').values=[['Images fixes candidates, références et réserves. Les feuilles Recuperes et Attributions19 conservent leurs bilans historiques.']];
const reviewLast=5+targetIds.length;
review.getRange(`A5:N${reviewLast}`).format.font={name:'Arial',size:10,color:'#24374D'};
review.getRange('A5:N5').copyFrom(list.getRange('A5:N5'),'all');
review.getRange('A5:N5').values=[['ID catalogue','Sujet','Opus','Variante exacte','Rôle conservé','Image présente','PNG du lot20','PNG retenus','Décision du lot20','Réserves / références manquantes','Sources consultées','Fichiers sélectionnés','1:1 validé','Moteur intégré']];
const reviewRows=targetIds.map(id=>{
  const e=byId.get(id);
  return [id,e.name,e.work,e.variant,e.plannedUse,'',0,selectedById.get(id)||0,decision(e),e.referenceGap,e.sourceUrls.join('\n'),e.assetFiles.join('\n'),'Non','Non'];
});
review.getRange(`A6:N${reviewLast}`).values=reviewRows;
for(let i=0;i<targetIds.length;i++) {
  const catalogueRow=6+catalogue.entries.findIndex(e=>e.id===targetIds[i]);
  review.getRange('F'+(6+i)).formulas=[[`='Catalogue'!H${catalogueRow}`]];
  review.getRange('G'+(6+i)).formulas=[[`='Catalogue'!R${catalogueRow}`]];
}
review.getRange(`A5:N${reviewLast}`).format.wrapText=true;
review.getRange(`A6:N${reviewLast}`).format.verticalAlignment='top';
review.getRange('A5:N5').format.rowHeight=36;
const widths=[38,34,18,32,24,15,12,12,20,125,150,110,12,14];
for(let i=0;i<widths.length;i++) review.getRangeByIndexes(4,i,targetIds.length+1,1).format.columnWidth=widths[i];
for(let i=0;i<reviewRows.length;i++) {
  const lines=Math.max(...reviewRows[i].map((v,col)=>String(v).split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/widths[col])),0)));
  review.getRange(`A${6+i}:N${6+i}`).format.rowHeight=Math.min(409,Math.max(72,lines*12+16));
}
review.getRange(`G6:H${reviewLast}`).setNumberFormat('0');
const reviewTable=review.tables.add(`A5:N${reviewLast}`,true,'ArmaxRevue20');
reviewTable.style=recovered.tables.items[0].style;
review.freezePanes.freezeRows(5);
review.freezePanes.freezeColumns(1);

summary.getRange('A2').values=[['Mass Effect — Armax : suivi du lot 20']];
summary.getRange('B4').values=[[new Date('2026-11-27T00:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
const metrics=[
  [17,'Fiches ajoutées au lot 20',`=COUNTIFS('Catalogue'!$P$6:$P$201,"lot20")`],
  [18,'Fiches avec nouveaux PNG au lot 20',`=COUNTIFS('Catalogue'!$R$6:$R$201,">0")`],
  [19,'PNG générés au lot 20',`=SUM('Catalogue'!$R$6:$R$201)`],
  [21,'Fiches illustrées sans nouvel actif au lot 20',`=COUNTIFS('Catalogue'!$H$6:$H$201,"Présent",'Catalogue'!$R$6:$R$201,0)`],
  [23,'Fiches héritées avec nouveaux PNG au lot 20',`=COUNTIFS('Catalogue'!$R$6:$R$201,">0",'Catalogue'!$P$6:$P$201,"<>lot20")`],
  [24,'Nouvelles fiches avec PNG au lot 20',`=COUNTIFS('Catalogue'!$R$6:$R$201,">0",'Catalogue'!$P$6:$P$201,"lot20")`],
  [29,'Attributions historiques résolues au lot 20',`=COUNTIFS('Revue20'!$I$6:$I$${reviewLast},"Attribué")`],
  [30,'Fiches nouvellement illustrées au lot 20',`=COUNTIFS('Revue20'!$F$6:$F$${reviewLast},"Présent")`]
];
for(const [row,label,formula] of metrics) {
  summary.getRange('A'+row).values=[[label]];
  summary.getRange('B'+row).formulas=[[formula]];
}
summary.getRange('A37').values=[['Guide + extensions : 68 rubriques conservées ; moteur à réaliser.']];
wb.recalculate();
const counts=()=>({total:summary.getRange('B13').values[0][0],withImage:summary.getRange('C13').values[0][0],withoutImage:summary.getRange('D13').values[0][0],newGeneratedSubjects:summary.getRange('B18').values[0][0],newPngFiles:summary.getRange('B19').values[0][0],historicalAttributionsResolved:summary.getRange('B29').values[0][0],newIllustratedSubjects:summary.getRange('B30').values[0][0]});
const expected=Object.fromEntries(Object.keys(counts()).map(k=>[k,catalogue.currentCounts[k]]));
const actual=counts();
if(JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error('Formula counts disagree: '+JSON.stringify({actual,expected}));
const selectedIndex=catalogue.entries.findIndex(e=>selectedById.has(e.id));
if(selectedIndex<0) throw new Error('No selected candidate');
const presence=list.getRange('H'+(6+selectedIndex));
presence.values=[['Absent']];
wb.recalculate();
const temporary=counts();
if(temporary.withImage!==expected.withImage-1||temporary.withoutImage!==expected.withoutImage+1||temporary.newIllustratedSubjects!==expected.newIllustratedSubjects-1||temporary.newPngFiles!==expected.newPngFiles) throw new Error('Input recalculation failed');
presence.values=[['Présent']];
wb.recalculate();
if(JSON.stringify(counts())!==JSON.stringify(expected)) throw new Error('Restored counts disagree');
const finalValues=list.getRange('A6:S201').values;
for(let i=0;i<196;i++) for(const col of [0,1,2,3,4,10,11,15]) if(baselineCatalogueValues[i][col]!==finalValues[i][col]) throw new Error('Identity cell changed');
for(const snapshot of historical) if(JSON.stringify(snapshot.sheet.getUsedRange().values)!==snapshot.values || JSON.stringify(snapshot.sheet.getUsedRange().formulas)!==snapshot.formulas) throw new Error('Historical sheet changed: '+snapshot.sheet.name);
const formulaError=/^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for(const sheet of wb.worksheets.items) for(const row of sheet.getUsedRange().values) for(const value of row) if(typeof value==='string'&&formulaError.test(value)) throw new Error('Formula error '+value);

async function render(sheetName,range,name) {
  const blob=await wb.render({sheetName,range,scale:1,format:'png'});
  const target=path.join(qaDir,name+'.png');
  await fs.writeFile(target,new Uint8Array(await blob.arrayBuffer()));
  return {sheet:sheetName,range,path:target};
}
const previews=[await render('Synthese','A1:E37','lot20-summary')];
for(let start=6;start<=reviewLast;start+=4) previews.push(await render('Revue20',`A${start===6?1:start}:I${Math.min(start+3,reviewLast)}`,'lot20-review-'+start));
for(const i of changedIndices) previews.push(await render('Catalogue',`A${6+i}:J${6+i}`,'lot20-'+catalogue.entries[i].id));
const longest=changedIndices.reduce((a,b)=>notesFor(catalogue.entries[a]).length>notesFor(catalogue.entries[b]).length?a:b);
previews.push(await render('Catalogue',`M${6+longest}:O${6+longest}`,'lot20-longest-notes'));
const longestReview=reviewRows.reduce((best,row,i)=>String(row[9]).length>String(reviewRows[best][9]).length?i:best,0);
previews.push(await render('Revue20',`J${6+longestReview}:N${6+longestReview}`,'lot20-review-evidence'));
const oldTable=list.tables.items.find(t=>t.name==='ArmaxCatalogue');
const properties=Object.fromEntries(['style','showHeaders','showTotals','showBandedColumns','showFilterButton'].map(k=>[k,oldTable[k]]));
oldTable.delete();
const newTable=list.tables.add('A5:S201',true,'ArmaxCatalogue');
for(const [key,value] of Object.entries(properties)) if(value!==undefined) newTable[key]=value;
wb.recalculate();
await fs.mkdir(outputDir,{recursive:true});
const outputName='Mass_Effect_Armax_Suivi_Lot20_2026-11-27.xlsx';
const outputPath=path.join(outputDir,outputName);
await (await SpreadsheetFile.exportXlsx(wb)).save(outputPath);
await fs.copyFile(outputPath,path.join(lotDir,outputName));
const tablesAfter=tables();
if(JSON.stringify(tablesBefore)!==JSON.stringify(tablesAfter)) throw new Error('Historical table properties changed');
const finalSheets=wb.worksheets.items.map(s=>s.name);
if(JSON.stringify(finalSheets)!==JSON.stringify([...sheets,'Revue20'])) throw new Error('Unexpected sheets');
const publishedQaDir=path.join(lotDir,'workbook-qa');
await fs.mkdir(publishedQaDir,{recursive:true});
for(const preview of previews) {
  const destination=path.join(publishedQaDir,path.basename(preview.path));
  await fs.copyFile(preview.path,destination);
  preview.path=path.relative(repoRoot,destination);
  preview.sha256=sha256(await fs.readFile(destination));
}
const report={schemaVersion:1,lot:'lot20',date:'2026-11-27',baseCommit:catalogue.baseCommit,
  authoring:'@oai/artifact-tool import, targeted edit, recalculate, export',
  template:{path:path.relative(repoRoot,baselinePath),sha256:sha256(await fs.readFile(baselinePath))},
  workbook:{path:'docs/armax/lot20/'+outputName,sha256:sha256(await fs.readFile(outputPath)),bytes:(await fs.stat(outputPath)).size},
  sheets:finalSheets,identityRowsPreserved:196,historicalSheetValuesAndFormulasPreserved:['Recuperes','Attributions19'],
  tablesBefore,tablesAfter,reviewTable:{name:reviewTable.name,headers:reviewTable.getHeaderRowRange().address,data:reviewTable.getDataRows().address},
  counts:actual,independentCounts:expected,inputRecalculation:{id:catalogue.entries[selectedIndex].id,before:actual,temporarilyAbsent:temporary,restored:counts()},
  formulaErrors:0,changedCatalogueIds:changedIndices.map(i=>catalogue.entries[i].id),previews,nativeExcelApplicationOpened:false,
  limitations:['Candidate presence only; fidelity and engine integration are not certified.','Recuperes and Attributions19 remain historical snapshots, not current accounting.','Rendered with artifact-tool; Microsoft Excel was not opened.']};
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({outputPath,counts:actual,previewCount:previews.length},null,2));

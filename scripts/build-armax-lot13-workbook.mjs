import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Workbook } from '@oai/artifact-tool';

// Run the preparation script first, then copy this builder into an isolated
// temporary directory whose node_modules links to the managed primary runtime.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const lotDir = path.join(repoRoot, 'docs/armax/lot13');
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || path.join(path.dirname(repoRoot), 'outputs/armax-lot13-20261124'));
const baseCommit = 'c67af65cd469da9cc3eb3748d2497ea50a578fbd';
async function readRepoJson(relative) {
  try { return JSON.parse(await fs.readFile(path.join(repoRoot,relative),'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return JSON.parse(execFileSync('git',['show',baseCommit+':'+relative],{cwd:repoRoot,encoding:'utf8',maxBuffer:16*1024*1024}));
  }
}
const catalog = await readRepoJson('docs/armax/lot13/production-catalog.json');
const baselineCatalog = await readRepoJson('docs/armax/lot12/production-catalog.json');
const identityFields = ['category','name','work','dlc','variant','plannedUse'];
const baselineIdentity = new Map(baselineCatalog.entries.map(e=>[e.id,identityFields.map(k=>e[k])]));
const referenceLibrary = await readRepoJson('docs/armax/lot13/reference-library.json');
const addedIdentity = new Map(referenceLibrary.catalogAdditions.map(e=>[e.id,identityFields.map(k=>e[k])]));
const declaredIdentity = new Map([...baselineIdentity,...addedIdentity]);
for (const entry of catalog.entries) {
  if (JSON.stringify(identityFields.map(k=>entry[k])) !== JSON.stringify(declaredIdentity.get(entry.id))) throw new Error('Declared identity changed: '+entry.id);
}
if (catalog.entries.length !== declaredIdentity.size) throw new Error('Catalogue entry count changed');
const recovered = await readRepoJson('docs/armax/recovery-20261120/asset-inventory.json');
const roleNames = {combattant_candidat:'Combattant proposé',opposant_candidat:'Adversaire proposé',boss_candidat:'Boss proposé',narration_support:'Narration / soutien',variante_visuelle:'Variante de tenue',arene_adaptee:'Arène adaptée'};
const catNames = {personnage:'Personnages / ennemis',costume:'Costumes',stage:'Stages'};
const wb = Workbook.create();
const summary = wb.worksheets.add('Synthese');
const list = wb.worksheets.add('Catalogue');
const old = wb.worksheets.add('Recuperes');
const ink = '#22354D', muted = '#657181', pale = '#EDF2F7', amber = '#FFF2CD';
for (const sheet of [summary, list, old]) sheet.showGridLines = false;
summary.tabColor = ink;
const n = catalog.entries.length, r = recovered.assets.length, first = 6, last = first + n - 1, lastOld = first + r - 1;
function base(sheet, end) {
  sheet.getRange(end).format.font = {name:'Arial',size:10,color:ink};
  sheet.getRange(end).format.verticalAlignment = 'center';
}
function header(sheet, range) {
  sheet.getRange(range).format = {fill:ink,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',wrapText:true};
  sheet.getRange(range).format.rowHeight = 31;
}
function width(sheet, col, w, end) { sheet.getRange(`${col}1:${col}${end}`).format.columnWidthPx = w; }
base(summary, 'A1:H31'); base(list, `A1:S${last}`); base(old, `A1:M${lastOld}`);
summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 13']];
summary.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
summary.getRange('A4:B4').values = [['État au', new Date('2026-11-24T12:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
summary.getRange('A6:E6').values = [['Catégorie','Fiches','Avec image','Sans image','Fidélité 1:1 validée']]; header(summary,'A6:E6');
for (const [i,c] of ['personnage','costume','stage'].entries()) {
  const row = 7+i;
  summary.getRange(`A${row}`).values = [[catNames[c]]];
  summary.getRange(`B${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row})`]];
  summary.getRange(`C${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$H$${first}:$H$${last},"Présent")`]];
  summary.getRange(`D${row}`).formulas = [[`=B${row}-C${row}`]];
  summary.getRange(`E${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$J$${first}:$J$${last},"Oui")`]];
}
summary.getRange('A10').values = [['Total du catalogue']];
summary.getRange('B10:E10').formulas = [['=SUM(B7:B9)','=SUM(C7:C9)','=SUM(D7:D9)','=SUM(E7:E9)']];
summary.getRange('A10:E10').format.fill = pale;
summary.getRange('A10:E10').format.font.bold = true;
summary.getRange('A13:B13').values = [['Origine et production','Fiches / fichiers']]; header(summary,'A13:B13');
summary.getRange('A14').values = [['Fiches ajoutées au lot 13']];
summary.getRange('B14').formulas = [[`=COUNTIFS('Catalogue'!$P$${first}:$P$${last},"lot13")`]];
summary.getRange('A15').values = [['Fiches illustrées au lot 13']];
summary.getRange('B15').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot13")`]];
summary.getRange('A16').values = [['PNG produits au lot 13, révisions incluses']];
summary.getRange('B16').formulas = [[`=SUM('Catalogue'!$R$${first}:$R$${last})`]];
summary.getRange('A17').values = [['Originaux historiques récupérés']];
summary.getRange('B17').formulas = [[`=COUNTA('Recuperes'!A${first}:A${lastOld})`]];
summary.getRange('A18').values = [['Fiches illustrées des lots précédents']];
summary.getRange('B18').formulas = [[`=COUNTIFS('Catalogue'!$H$${first}:$H$${last},"Présent",'Catalogue'!$Q$${first}:$Q$${last},"<>lot13")`]];
summary.getRange('A19').values = [['Récupérés hors dossiers organisés']];
summary.getRange('B19').formulas = [["='Recuperes'!H3"]];
summary.getRange('A20').values = [['Anciennes fiches illustrées au lot 13']];
summary.getRange('B20').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot13",'Catalogue'!$P$${first}:$P$${last},"<>lot13")`]];
summary.getRange('A21').values = [['Nouvelles fiches illustrées au lot 13']];
summary.getRange('B21').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot13",'Catalogue'!$P$${first}:$P$${last},"lot13")`]];
summary.getRange('A24').values = [['Une image candidate reste un prototype ; aucune fidélité 1:1 n’est certifiée.']];
summary.getRange('A25').values = [['Une fiche illustrée peut encore nécessiter un accessoire ou une autre pose.']];
summary.getRange('A26').values = [['Animations, couches de parallaxe et validation en jeu restent à produire.']];
summary.getRange('A28').values = [['Périmètre : lots Armax retrouvés, hors sprites de la campagne RPG.']];
summary.getRange('A29').values = [['Les lots 01/02 et la bible originale restent non retrouvés.']];
summary.getRange('A24:A29').format.font.color = muted;
summary.getRange('B7:E21').setNumberFormat('#,##0');
summary.getRange('A7:E10').format.rowHeight = 24;
summary.getRange('A14:E21').format.rowHeight = 24;
summary.getRange('A24:H29').format.rowHeight = 22;
for (const [col,w] of Object.entries({A:340,B:125,C:110,D:110,E:145,F:22,G:110,H:110})) width(summary,col,w,31);

list.getRange('A2').values = [['Personnages, costumes et stages']];
list.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
list.getRange('A3').values = [['Une fiche correspond à une identité, un opus et une variante précise.']];
list.getRange('A3').format.font.color = muted;
list.getRange('A5:S5').values = [['Sujet','Catégorie','Opus','Variante / sous-zone','DLC','Priorité','Production','Image','Dernier essai','1:1 validé','Usage proposé','Identifiant','Note de production','Sources','Fichier retenu dans le dépôt','Fiche créée au lot','Lot image courante','PNG du lot 13','Autres versions conservées']];
const rows = catalog.entries.map(e=>[e.name,catNames[e.category],e.work,e.variant,e.dlc||'',e.priority,e.status,e.assetFiles.length?'Présent':'Absent',e.latestGenerationAttempt==='blocked'?'Bloqué':e.latestGenerationAttempt==='failed'?'Échec':e.assetFiles.length?'Généré':'Non tenté',e.fidelity1to1Validated?'Oui':'Non',roleNames[e.plannedUse],e.id,[e.producedSubzone ? `Zone produite : ${e.producedSubzone.replace(/[.\s]+$/,'')}.` : null,e.productionNote,...(e.generationNotes||[]),e.referenceGap].filter(Boolean).join(' '),e.sourceUrls.join('\n'),e.assetFiles.join('\n'),e.addedInLot,e.imageLot,e.pngCountLot13,e.alternateAssetFiles.join('\n')]);
list.getRange(`A${first}:S${last}`).values = rows;
list.tables.add(`A5:S${last}`,true,'ArmaxCatalogue');
header(list,'A5:S5');
list.getRange(`A${first}:S${last}`).format.rowHeight = 49;
list.getRange(`A${first}:S${last}`).format.wrapText = true;
list.getRange(`F${first}:J${last}`).format.horizontalAlignment = 'center';
list.getRange(`P${first}:R${last}`).format.horizontalAlignment = 'center';
list.getRange(`R${first}:R${last}`).setNumberFormat('0');
list.getRange(`F${first}:F${last}`).dataValidation = {rule:{type:'list',values:['P0','P1','P2']}};
list.getRange(`G${first}:G${last}`).dataValidation = {rule:{type:'list',values:['Défini','Prototype','Intégré','Validé']}};
list.getRange(`F${first}:F${last}`).conditionalFormats.add('containsText',{text:'P0',format:{fill:amber,font:{bold:true}}});
list.getRange(`I${first}:I${last}`).conditionalFormats.add('containsText',{text:'Bloqué',format:{fill:'#FCE4E3',font:{color:'#9B2C2C'}}});
list.freezePanes.freezeRows(5); list.freezePanes.freezeColumns(1);
for (const [col,w] of Object.entries({A:255,B:155,C:120,D:265,E:200,F:70,G:100,H:85,I:100,J:80,K:170,L:340,M:1000,N:1350,O:820,P:110,Q:110,R:90,S:820})) width(list,col,w,last);
// Long production caveats and source URLs remain visible without shortening the data.
for (let i = 0; i < rows.length; i++) {
  // The final Jack source set has 28 URLs. The wider source column preserves
  // those complete URLs while keeping the row below Excel's height limit.
  const sourceLines = String(rows[i][13]).split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 180)), 0);
  const noteLines = Math.max(1, Math.ceil(String(rows[i][12]).length / 135));
  const height = Math.max(49, Math.max(sourceLines, noteLines) * 12 + 10);
  // Microsoft documents a 409-point limit for row height.
  // https://support.microsoft.com/en-us/excel/excel-specifications-and-limits
  if (height > 409) throw new Error('Catalogue row needs a wider layout before Excel export: '+catalog.entries[i].id);
  list.getRange(`A${first+i}:S${first+i}`).format.rowHeight = height;
}

old.getRange('A2').values = [['Originaux récupérés — lots antérieurs']];
old.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
old.getRange('A3').values = [['86 fichiers uniques. Les essais conservés ne sont pas tous des versions retenues.']];
old.getRange('G3:H3').values = [['Ajouts', recovered.summary.additionalRecoveredOriginalPngs]];
old.getRange('H3').setNumberFormat('#,##0');
old.getRange('A5:M5').values = [['Sujet','Lot','Nature','Sélection historique','Production','Largeur (px)','Hauteur (px)','Format','1:1 validé','Identifiant','SHA-256','Fichier dans le dépôt','Notes']];
old.getRange(`A${first}:M${lastOld}`).values = recovered.assets.map(a=>[a.subject,a.batch,a.kind,a.historicalSelection,a.status,a.technical.width,a.technical.height,a.technical.mode,a.fidelityValidated?'Oui':'Non',a.id,a.technical.sha256,a.path,a.notes]);
old.tables.add(`A5:M${lastOld}`,true,'ArmaxRecuperes'); header(old,'A5:M5');
old.getRange(`A${first}:M${lastOld}`).format.rowHeight = 45;
old.getRange(`A${first}:J${lastOld}`).format.wrapText = true;
old.getRange(`K${first}:L${lastOld}`).format.wrapText = false;
old.getRange(`M${first}:M${lastOld}`).format.wrapText = true;
old.getRange(`F${first}:G${lastOld}`).setNumberFormat('0');
old.getRange(`H${first}:I${lastOld}`).format.horizontalAlignment = 'center';
old.freezePanes.freezeRows(5); old.freezePanes.freezeColumns(1);
for (const [col,w] of Object.entries({A:245,B:160,C:100,D:140,E:100,F:95,G:95,H:80,I:80,J:390,K:570,L:1000,M:1600})) width(old,col,w,lastOld);
for (let i = 0; i < recovered.assets.length; i++) {
  const noteLines = Math.max(1, Math.ceil(String(recovered.assets[i].notes).length / 210));
  old.getRange(`A${first+i}:M${first+i}`).format.rowHeight = Math.max(45, noteLines * 12 + 10);
}
const longestRecoveredNoteRow = first + recovered.assets.reduce((maxIndex, asset, i, all) => asset.notes.length > all[maxIndex].notes.length ? i : maxIndex, 0);

// Verify that an editable presence field propagates to the summary, then restore it.
// This check is kept out of the delivered workbook; it exercises a real dependency.
const presenceIndex = catalog.entries.findIndex(e=>e.imageLot==='lot13' && e.assetFiles.length);
if (presenceIndex < 0) throw new Error('No newly illustrated entry is available for final export');
const presenceCell = list.getRange(`H${first+presenceIndex}`);
const originalPresence = presenceCell.values[0][0];
const beforePresence = [summary.getRange('C10').values[0][0],summary.getRange('D10').values[0][0]];
presenceCell.values = [['Absent']];
const afterPresence = [summary.getRange('C10').values[0][0],summary.getRange('D10').values[0][0]];
if (afterPresence[0]!==beforePresence[0]-1 || afterPresence[1]!==beforePresence[1]+1) throw new Error('Summary presence formulas did not update after an input change');
presenceCell.values = [[originalPresence]];
wb.recalculate();
const restoredPresence = [summary.getRange('C10').values[0][0],summary.getRange('D10').values[0][0]];
if (JSON.stringify(restoredPresence)!==JSON.stringify(beforePresence)) throw new Error('Summary inputs were not restored');
const recalculationInputCheck = {subjectId:catalog.entries[presenceIndex].id,field:'Image',before:beforePresence,temporarilyAbsent:afterPresence,restored:restoredPresence,passed:true};
const independent = {fiches:n,personnages:catalog.counts.personnage,costumes:catalog.counts.costume,stages:catalog.counts.stage,withImage:catalog.currentCounts.withImage,withoutImage:catalog.currentCounts.withoutImage,certified1to1:catalog.currentCounts.certified1to1,addedEntries:catalog.entries.filter(e=>e.addedInLot==='lot13').length,newIllustratedSubjects:catalog.currentCounts.newIllustratedSubjects,newInheritedIllustratedSubjects:catalog.currentCounts.newInheritedIllustratedSubjects,newAddedIllustratedSubjects:catalog.currentCounts.newAddedIllustratedSubjects,newPngFiles:catalog.currentCounts.newPngFiles,recovered:r,carriedForwardIllustrated:catalog.entries.filter(e=>e.assetFiles.length && e.imageLot!=='lot13').length,additionalRecovered:recovered.summary.additionalRecoveredOriginalPngs};
const calculated = {fiches:summary.getRange('B10').values[0][0],personnages:summary.getRange('B7').values[0][0],costumes:summary.getRange('B8').values[0][0],stages:summary.getRange('B9').values[0][0],withImage:summary.getRange('C10').values[0][0],withoutImage:summary.getRange('D10').values[0][0],certified1to1:summary.getRange('E10').values[0][0],addedEntries:summary.getRange('B14').values[0][0],newIllustratedSubjects:summary.getRange('B15').values[0][0],newInheritedIllustratedSubjects:summary.getRange('B20').values[0][0],newAddedIllustratedSubjects:summary.getRange('B21').values[0][0],newPngFiles:summary.getRange('B16').values[0][0],recovered:summary.getRange('B17').values[0][0],carriedForwardIllustrated:summary.getRange('B18').values[0][0],additionalRecovered:summary.getRange('B19').values[0][0]};
for(const key of Object.keys(independent)) if(independent[key]!==calculated[key]) throw new Error(`Summary mismatch ${key}: ${independent[key]} vs ${calculated[key]}`);
await fs.mkdir(outputDir,{recursive:true});
const inspection = await wb.inspect({kind:'table',range:'Synthese!A6:E21',include:'values,formulas',tableMaxRows:16,tableMaxCols:5,maxChars:5000});
await fs.writeFile(path.join(outputDir,'summary-inspect.ndjson'),inspection.ndjson);
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula errors'});
await fs.writeFile(path.join(outputDir,'formula-errors.ndjson'),errors.ndjson);
let enemyIndex = catalog.entries.findIndex(e=>e.category==='personnage' && e.imageLot==='lot13');
if (enemyIndex < 0) enemyIndex = presenceIndex;
const enemyRow = first + enemyIndex;
const longestCurrentNoteIndex = rows.reduce((maxIndex,row,i,all)=>String(row[12]).length>String(all[maxIndex][12]).length?i:maxIndex,0);
// Use a different new costume if the longest production note already covers one.
let costumeIndex = catalog.entries.findIndex((e,i)=>e.category==='costume' && e.imageLot==='lot13' && i!==longestCurrentNoteIndex);
if (costumeIndex < 0) costumeIndex = catalog.entries.findIndex(e=>e.category==='costume' && e.imageLot==='lot13');
if (costumeIndex < 0) costumeIndex = catalog.entries.findIndex(e=>e.category==='costume' && e.latestGenerationAttempt==='blocked');
const costumeRow = first + costumeIndex;
const longestCurrentNoteRow = first + longestCurrentNoteIndex;
const alternateIndex = catalog.entries.findIndex(e=>e.imageLot==='lot13' && e.alternateAssetFiles.length);
const versionRow = first + (alternateIndex>=0 ? alternateIndex : enemyIndex);
for (const [sheetName,range,name] of [['Synthese','A1:E30','synthese'],['Catalogue','A1:J15','catalogue'],['Catalogue',`A${enemyRow-1}:J${enemyRow+1}`,'ennemis'],['Recuperes','A1:I14','recuperes'],['Catalogue',`M${longestCurrentNoteRow}:N${longestCurrentNoteRow}`,'notes-production'],['Catalogue',`M${costumeRow}:N${costumeRow}`,'notes-costume'],['Catalogue',`P${versionRow-1}:S${versionRow+1}`,'notes-versions'],['Recuperes',`M${longestRecoveredNoteRow}:M${longestRecoveredNoteRow}`,'notes-recuperes']]) {
  const blob = await wb.render({sheetName,range,scale:name.startsWith('notes')?1:1.5,format:'png'});
  await fs.writeFile(path.join(outputDir,`preview-${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const filename = 'Mass_Effect_Armax_Suivi_Lot13_2026-11-24.xlsx';
// Both WASM exporters stalled. The local serializer only packages the reviewed
// artifact-tool model and performs independent XML/openpyxl read-back checks.
await fs.writeFile(path.join(outputDir,'workbook-checkpoint.json'),JSON.stringify(wb.toProto()));
const serializationPath = path.join(outputDir,'workbook-serialization.json');
execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3',[
  path.join(repoRoot,'scripts/export-armax-lot13-workbook-xml.py'),
  path.join(outputDir,'workbook-checkpoint.json'),path.join(outputDir,filename),serializationPath
],{cwd:repoRoot,encoding:'utf8',maxBuffer:1024*1024});
const serialization = JSON.parse(await fs.readFile(serializationPath,'utf8'));
if (!serialization.success) throw new Error('Independent XLSX serialization verification failed');
const readback = Workbook.load(JSON.parse(await fs.readFile(path.join(outputDir,'workbook-readback-model.json'),'utf8')),{validate:true});
const jackRow = first + catalog.entries.findIndex(e=>e.id==='cst_me2_jack_standard');
for (const [sheetName,range,name] of [['Synthese','A1:E30','synthese'],['Catalogue',`M${jackRow}:N${jackRow}`,'jack']]) {
  const blob = await readback.render({sheetName,range,scale:name==='synthese'?1.5:1,format:'png'});
  await fs.writeFile(path.join(outputDir,`readback-${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
await fs.copyFile(path.join(outputDir,filename),path.join(lotDir,filename));
const inputHashes = {};
for (const name of (await fs.readdir(lotDir)).filter(name=>name.endsWith('.json') && !['workbook-verification.json','verification.json','link-verification.json'].includes(name)).sort()) {
  inputHashes[name] = createHash('sha256').update(await fs.readFile(path.join(lotDir,name))).digest('hex');
}
const xlsxSha256 = createHash('sha256').update(await fs.readFile(path.join(lotDir,filename))).digest('hex');
const identityContinuity = {baseline:'docs/armax/lot12/production-catalog.json',subjects:baselineIdentity.size,fields:identityFields,checkedFields:baselineIdentity.size*identityFields.length,unchanged:true};
const originalPngCorpusCount = new Set([...recovered.assets.map(a=>a.path),...catalog.entries.flatMap(e=>[...e.assetFiles,...e.alternateAssetFiles])]).size;
const attemptSources = JSON.parse(await fs.readFile(path.join(lotDir,'consolidation-inputs.json'),'utf8')).attemptSources;
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify({
  date:'2026-11-24',baseCommit,builder:'scripts/build-armax-lot13-workbook.mjs',
  runtime:'@oai/artifact-tool; managed primary Node runtime',
  exportMethod:'artifact-tool authoring/recalculation/rendering; Python standard-library OpenXML serialization from its checkpoint and the unchanged native lot12 style package',
  exportRecovery:'SpreadsheetFile.exportXlsx stalled for more than six minutes after rendering. The documented workbook.export({format:"xlsx"}) call also stalled and was stopped after 123 seconds. No WASM export is claimed to have succeeded.',
  serialization,
  independentReadbackRenderMethod:'XLSX read with openpyxl (no writing), every cell/formula/cache/style/layout/control compared, then actual read-back values loaded by artifact-tool for Synthese and Jack renders.',
  sheets:['Synthese','Catalogue','Recuperes'],independent,calculated,
  recalculated:true,recalculationInputCheck,formulaErrorScan:errors.ndjson,
  renderedSheets:['Synthese','Catalogue','Recuperes'],visualReviewCompleted:false,nativeExcelOpened:false,
  inputHashes,xlsxSha256,identityContinuity,originalPngCorpusCount,
  blockedSubjects:catalog.currentCounts.blockedSubjects,
  recordedGenerationCalls:attemptSources.reduce((sum,source)=>sum+source.count,0),
  historicalAssetsMethod:'Paths verified in the base Git tree; historical binaries need not be locally materialized.'
},null,2)+'\n');
console.log(JSON.stringify({output:path.join(lotDir,filename),counts:calculated,formulaScan:errors.ndjson}));

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Workbook } from '@oai/artifact-tool';

// Run only after the lot16 catalogue has been consolidated. Copy this builder
// into an isolated temporary directory whose node_modules links to the managed
// primary runtime, then execute it with CODEX_PRIMARY_RUNTIME_NODE and repoRoot.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const lotDir = path.join(repoRoot, 'docs/armax/lot16');
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || path.join(path.dirname(repoRoot), 'outputs/armax-lot16-20261125'));
const baseCommit = '71955d9143562d6a44a8b8d48bc552978372bc1e';
const lot = 'lot16';
function readBaseJson(relative) {
  return JSON.parse(execFileSync('git',['show',baseCommit+':'+relative],{cwd:repoRoot,encoding:'utf8',maxBuffer:16*1024*1024}));
}
async function readRepoJson(relative) {
  try { return JSON.parse(await fs.readFile(path.join(repoRoot,relative),'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return readBaseJson(relative);
  }
}
async function readOptionalJson(relative) {
  try { return JSON.parse(await fs.readFile(path.join(repoRoot,relative),'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const catalog = await readRepoJson('docs/armax/lot16/production-catalog.json');
const baselineCatalog = readBaseJson('docs/armax/lot14/production-catalog.json');
const identityFields = ['category','name','work','dlc','variant','plannedUse'];
const baselineIdentity = new Map(baselineCatalog.entries.map(e=>[e.id,identityFields.map(k=>e[k])]));
if (baselineIdentity.size !== 188) throw new Error('Unexpected lot14 baseline identity count');
const referenceLibrary = await readOptionalJson('docs/armax/lot16/reference-library.json');
const addedIdentity = new Map((referenceLibrary?.catalogAdditions || []).map(e=>[e.id,identityFields.map(k=>e[k])]));
const entriesById = new Map(catalog.entries.map(e=>[e.id,e]));
if (entriesById.size !== catalog.entries.length) throw new Error('Duplicate catalogue identity');
for (const [id, identity] of baselineIdentity) {
  if (!entriesById.has(id) || JSON.stringify(identityFields.map(k=>entriesById.get(id)[k])) !== JSON.stringify(identity)) throw new Error('Inherited identity missing or changed: '+id);
}
const categoryKeys = ['personnage','costume','stage','effet','projectile','accessoire'];
for (const entry of catalog.entries) {
  if (!categoryKeys.includes(entry.category)) throw new Error('Undocumented category: '+entry.category);
  if (!baselineIdentity.has(entry.id) && entry.addedInLot !== lot) throw new Error('New identity has no lot16 origin: '+entry.id);
  if (addedIdentity.has(entry.id) && JSON.stringify(identityFields.map(k=>entry[k])) !== JSON.stringify(addedIdentity.get(entry.id))) throw new Error('Declared new identity changed: '+entry.id);
  for (const field of ['assetFiles','alternateAssetFiles','sourceUrls']) if (!Array.isArray(entry[field])) throw new Error('Missing array '+field+': '+entry.id);
  if (!Number.isInteger(entry.pngCountLot16) || entry.pngCountLot16 < 0) throw new Error('Invalid PNG count: '+entry.id);
  if (entry.fidelity1to1Validated !== false) throw new Error('Lot16 must retain unvalidated 1:1 fidelity: '+entry.id);
  if (!entry.plannedUse) throw new Error('Missing planned use: '+entry.id);
}
for (const id of addedIdentity.keys()) if (!entriesById.has(id)) throw new Error('Declared addition is missing: '+id);
for (const previous of baselineCatalog.entries) {
  const current = entriesById.get(previous.id);
  const retained = new Set([...current.assetFiles,...current.alternateAssetFiles]);
  for (const asset of [...previous.assetFiles,...previous.alternateAssetFiles]) if (!retained.has(asset)) throw new Error('Historical image omitted: '+previous.id+' / '+asset);
  if (previous.latestGenerationAttempt === 'blocked' && current.latestGenerationAttempt !== 'blocked') throw new Error('Historical blocked status changed: '+previous.id);
}
const recovered = await readRepoJson('docs/armax/recovery-20261120/asset-inventory.json');
const roleNames = {combattant_candidat:'Combattant proposé',opposant_candidat:'Adversaire proposé',boss_candidat:'Boss proposé',narration_support:'Narration / soutien',variante_visuelle:'Variante de tenue',arene_adaptee:'Arène adaptée',effet_visuel:'Effet visuel proposé',projectile_candidat:'Projectile proposé',accessoire_candidat:'Accessoire proposé',calque_decor:'Calque de décor'};
const catNames = {personnage:'Personnages / ennemis',costume:'Costumes',stage:'Décors / calques',effet:'Effets',projectile:'Projectiles',accessoire:'Accessoires'};
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
base(summary, 'A1:H34'); base(list, `A1:S${last}`); base(old, `A1:M${lastOld}`);
summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 16']];
summary.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
summary.getRange('A4:B4').values = [['État au', new Date('2026-11-25T12:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
summary.getRange('A6:E6').values = [['Catégorie','Fiches','Avec image','Sans image','Fidélité 1:1 validée']]; header(summary,'A6:E6');
for (const [i,c] of categoryKeys.entries()) {
  const row = 7+i;
  summary.getRange(`A${row}`).values = [[catNames[c]]];
  summary.getRange(`B${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row})`]];
  summary.getRange(`C${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$H$${first}:$H$${last},"Présent")`]];
  summary.getRange(`D${row}`).formulas = [[`=B${row}-C${row}`]];
  summary.getRange(`E${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$J$${first}:$J$${last},"Oui")`]];
}
summary.getRange('A13').values = [['Total du catalogue']];
summary.getRange('B13:E13').formulas = [['=SUM(B7:B12)','=SUM(C7:C12)','=SUM(D7:D12)','=SUM(E7:E12)']];
summary.getRange('A13:E13').format.fill = pale;
summary.getRange('A13:E13').format.font.bold = true;
summary.getRange('A16:B16').values = [['Origine et production','Fiches / fichiers']]; header(summary,'A16:B16');
summary.getRange('A17').values = [['Fiches ajoutées au lot 16']];
summary.getRange('B17').formulas = [[`=COUNTIFS('Catalogue'!$P$${first}:$P$${last},"lot16")`]];
summary.getRange('A18').values = [['Fiches avec nouvel actif au lot 16']];
summary.getRange('B18').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot16")`]];
summary.getRange('A19').values = [['PNG produits au lot 16, révisions incluses']];
summary.getRange('B19').formulas = [[`=SUM('Catalogue'!$R$${first}:$R$${last})`]];
summary.getRange('A20').values = [['Originaux historiques récupérés']];
summary.getRange('B20').formulas = [[`=COUNTA('Recuperes'!A${first}:A${lastOld})`]];
summary.getRange('A21').values = [['Fiches illustrées sans ajout au lot 16']];
summary.getRange('B21').formulas = [[`=COUNTIFS('Catalogue'!$H$${first}:$H$${last},"Présent",'Catalogue'!$Q$${first}:$Q$${last},"<>lot16")`]];
summary.getRange('A22').values = [['Récupérés hors dossiers organisés']];
summary.getRange('B22').formulas = [["='Recuperes'!H3"]];
summary.getRange('A23').values = [['Fiches héritées enrichies au lot 16']];
summary.getRange('B23').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot16",'Catalogue'!$P$${first}:$P$${last},"<>lot16")`]];
summary.getRange('A24').values = [['Nouvelles fiches illustrées au lot 16']];
summary.getRange('B24').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot16",'Catalogue'!$P$${first}:$P$${last},"lot16")`]];
summary.getRange('A27').values = [['Une image candidate reste un prototype ; aucune fidélité 1:1 n’est certifiée.']];
summary.getRange('A28').values = [['Une fiche illustrée peut encore nécessiter un accessoire ou une autre pose.']];
summary.getRange('A29').values = [['Décors : 52 masters et 3 calques. Assemblage et jeu restent à valider.']];
summary.getRange('A30').values = [['Lot 15 non récupéré : ses 113 PNG rapportés ne sont pas comptés présents.']];
summary.getRange('A31').values = [['Périmètre : lots Armax retrouvés, hors sprites de la campagne RPG.']];
summary.getRange('A32').values = [['Lots 01/02 et bible originale non retrouvés ; la bible intégrée actuelle est reconstruite.']];
summary.getRange('A33').values = [['Exclusions : 13 documentées et 13 rapportées ; aucun nouvel essai.']];
summary.getRange('A27:A33').format.font.color = muted;
summary.getRange('B7:E24').setNumberFormat('#,##0');
summary.getRange('A7:E13').format.rowHeight = 24;
summary.getRange('A17:E24').format.rowHeight = 24;
summary.getRange('A27:H33').format.rowHeight = 22;
for (const [col,w] of Object.entries({A:340,B:125,C:110,D:110,E:145,F:22,G:110,H:110})) width(summary,col,w,34);

list.getRange('A2').values = [['Catalogue des actifs Armax']];
list.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
list.getRange('A3').values = [['Une fiche correspond à une identité, un opus et une variante précise.']];
list.getRange('A3').format.font.color = muted;
list.getRange('A5:S5').values = [['Sujet','Catégorie','Opus','Variante / sous-zone','DLC','Priorité','Production','Image','Dernier essai','1:1 validé','Usage proposé','Identifiant','Note de production','Sources','Fichier retenu dans le dépôt','Fiche créée au lot','Lot image courante','PNG du lot 16','Autres versions conservées']];
const rows = catalog.entries.map(e=>[e.name,catNames[e.category],e.work,e.variant,e.dlc||'',e.priority,e.status,e.assetFiles.length?'Présent':'Absent',e.generationExclusionReportedInPriorSession?'Refus rapporté':e.latestGenerationAttempt==='blocked'?'Bloqué':e.latestGenerationAttempt==='failed'?'Échec':e.assetFiles.length?'Généré':'Non tenté',e.fidelity1to1Validated?'Oui':'Non',roleNames[e.plannedUse] || e.plannedUse,e.id,[e.producedSubzone ? `Zone produite : ${e.producedSubzone.replace(/[.\s]+$/,'')}.` : null,e.productionNote,...(e.generationNotes||[]),e.referenceGap,e.generationExclusionReportedInPriorSession?.note].filter(Boolean).join(' '),e.sourceUrls.join('\n'),e.assetFiles.join('\n'),e.addedInLot,e.imageLot,e.pngCountLot16,e.alternateAssetFiles.join('\n')]);
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
for (const [col,w] of Object.entries({A:300,B:155,C:120,D:265,E:200,F:70,G:100,H:85,I:100,J:80,K:170,L:340,M:1000,N:1350,O:820,P:110,Q:110,R:90,S:820})) width(list,col,w,last);
// Long production caveats and source URLs remain visible without shortening the data.
for (let i = 0; i < rows.length; i++) {
  // Retain full source URLs and production caveats in the established layout.
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
old.getRange('A3').values = [[`${r} fichiers uniques. Les essais conservés ne sont pas tous des versions retenues.`]];
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
const presenceIndex = catalog.entries.findIndex(e=>e.imageLot===lot && e.assetFiles.length);
if (presenceIndex < 0) throw new Error('No newly illustrated entry is available for final export');
const presenceCell = list.getRange(`H${first+presenceIndex}`);
const originalPresence = presenceCell.values[0][0];
const beforePresence = [summary.getRange('C13').values[0][0],summary.getRange('D13').values[0][0]];
presenceCell.values = [['Absent']];
const afterPresence = [summary.getRange('C13').values[0][0],summary.getRange('D13').values[0][0]];
if (afterPresence[0]!==beforePresence[0]-1 || afterPresence[1]!==beforePresence[1]+1) throw new Error('Summary presence formulas did not update after an input change');
presenceCell.values = [[originalPresence]];
wb.recalculate();
const restoredPresence = [summary.getRange('C13').values[0][0],summary.getRange('D13').values[0][0]];
if (JSON.stringify(restoredPresence)!==JSON.stringify(beforePresence)) throw new Error('Summary inputs were not restored');
const recalculationInputCheck = {subjectId:catalog.entries[presenceIndex].id,field:'Image',before:beforePresence,temporarilyAbsent:afterPresence,restored:restoredPresence,passed:true};
const countsByCategory = Object.fromEntries(categoryKeys.map(category=>[category,catalog.entries.filter(e=>e.category===category).length]));
const illustrated = catalog.entries.filter(e=>e.assetFiles.length);
const newlyIllustrated = illustrated.filter(e=>e.imageLot===lot);
if (catalog.entries.some(e=>e.imageLot===lot && !e.assetFiles.length)) throw new Error('Current lot illustration has no selected file');
const independent = {
  fiches:n,personnages:countsByCategory.personnage,costumes:countsByCategory.costume,stages:countsByCategory.stage,
  effets:countsByCategory.effet,projectiles:countsByCategory.projectile,accessoires:countsByCategory.accessoire,
  withImage:illustrated.length,withoutImage:n-illustrated.length,
  certified1to1:catalog.entries.filter(e=>e.fidelity1to1Validated).length,
  addedEntries:catalog.entries.filter(e=>e.addedInLot===lot).length,
  newIllustratedSubjects:newlyIllustrated.length,
  newInheritedIllustratedSubjects:newlyIllustrated.filter(e=>e.addedInLot!==lot).length,
  newAddedIllustratedSubjects:newlyIllustrated.filter(e=>e.addedInLot===lot).length,
  newPngFiles:catalog.entries.reduce((sum,e)=>sum+e.pngCountLot16,0),recovered:r,
  carriedForwardIllustrated:illustrated.filter(e=>e.imageLot!==lot).length,
  additionalRecovered:recovered.summary.additionalRecoveredOriginalPngs
};
const calculated = {
  fiches:summary.getRange('B13').values[0][0],personnages:summary.getRange('B7').values[0][0],
  costumes:summary.getRange('B8').values[0][0],stages:summary.getRange('B9').values[0][0],
  effets:summary.getRange('B10').values[0][0],projectiles:summary.getRange('B11').values[0][0],accessoires:summary.getRange('B12').values[0][0],
  withImage:summary.getRange('C13').values[0][0],withoutImage:summary.getRange('D13').values[0][0],
  certified1to1:summary.getRange('E13').values[0][0],addedEntries:summary.getRange('B17').values[0][0],
  newIllustratedSubjects:summary.getRange('B18').values[0][0],newInheritedIllustratedSubjects:summary.getRange('B23').values[0][0],
  newAddedIllustratedSubjects:summary.getRange('B24').values[0][0],newPngFiles:summary.getRange('B19').values[0][0],
  recovered:summary.getRange('B20').values[0][0],carriedForwardIllustrated:summary.getRange('B21').values[0][0],
  additionalRecovered:summary.getRange('B22').values[0][0]
};
for(const key of Object.keys(independent)) if(independent[key]!==calculated[key]) throw new Error(`Summary mismatch ${key}: ${independent[key]} vs ${calculated[key]}`);
for (const category of categoryKeys) {
  if (catalog.counts?.[category] !== undefined && catalog.counts[category] !== countsByCategory[category]) throw new Error('Declared category count mismatch: '+category);
}
for (const key of ['withImage','withoutImage','certified1to1','newIllustratedSubjects','newInheritedIllustratedSubjects','newAddedIllustratedSubjects','newPngFiles']) {
  if (catalog.currentCounts?.[key] !== undefined && catalog.currentCounts[key] !== independent[key]) throw new Error('Declared catalogue count mismatch: '+key);
}
await fs.mkdir(outputDir,{recursive:true});
const inspection = await wb.inspect({kind:'table',range:'Synthese!A6:E24',include:'values,formulas',tableMaxRows:19,tableMaxCols:5,maxChars:6000});
await fs.writeFile(path.join(outputDir,'summary-inspect.ndjson'),inspection.ndjson);
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula errors'});
await fs.writeFile(path.join(outputDir,'formula-errors.ndjson'),errors.ndjson);
const formulaError = /^#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)$/;
for (const sheet of [summary,list,old]) {
  for (const row of sheet.getUsedRange().values) for (const value of row) if (typeof value==='string' && formulaError.test(value)) throw new Error('Formula error in '+sheet.name+': '+value);
}
let enemyIndex = catalog.entries.findIndex(e=>e.category==='personnage' && e.imageLot===lot);
if (enemyIndex < 0) enemyIndex = presenceIndex;
const enemyRow = first + enemyIndex;
const longestCurrentNoteIndex = rows.reduce((maxIndex,row,i,all)=>String(row[12]).length>String(all[maxIndex][12]).length?i:maxIndex,0);
// Use a different new costume if the longest production note already covers one.
let costumeIndex = catalog.entries.findIndex((e,i)=>e.category==='costume' && e.imageLot===lot && i!==longestCurrentNoteIndex);
if (costumeIndex < 0) costumeIndex = catalog.entries.findIndex(e=>e.category==='costume' && e.imageLot===lot);
if (costumeIndex < 0) costumeIndex = catalog.entries.findIndex(e=>e.category==='costume' && e.latestGenerationAttempt==='blocked');
const costumeRow = first + costumeIndex;
const longestCurrentNoteRow = first + longestCurrentNoteIndex;
const alternateIndex = catalog.entries.findIndex(e=>e.imageLot===lot && e.alternateAssetFiles.length);
const versionRow = first + (alternateIndex>=0 ? alternateIndex : enemyIndex);
const previews = [['Synthese','A1:E33','synthese'],['Catalogue','A1:J15','catalogue'],['Catalogue',`A${enemyRow-1}:J${enemyRow+1}`,'ennemis'],['Recuperes','A1:I14','recuperes'],['Catalogue',`M${longestCurrentNoteRow}:N${longestCurrentNoteRow}`,'notes-production'],['Catalogue',`M${costumeRow}:N${costumeRow}`,'notes-costume'],['Catalogue',`P${versionRow-1}:S${versionRow+1}`,'notes-versions'],['Recuperes',`M${longestRecoveredNoteRow}:M${longestRecoveredNoteRow}`,'notes-recuperes']];
for (const category of ['stage','effet','projectile','accessoire']) {
  const index = catalog.entries.findIndex(e=>e.category===category && e.imageLot===lot);
  if (index >= 0) {
    const row = first+index;
    previews.push(['Catalogue',`A${Math.max(first,row-1)}:J${Math.min(last,row+1)}`,'actifs-'+category]);
  }
}
for (const [sheetName,range,name] of previews) {
  const blob = await wb.render({sheetName,range,scale:name.startsWith('notes')?1:1.5,format:'png'});
  await fs.writeFile(path.join(outputDir,`preview-${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const filename = 'Mass_Effect_Armax_Suivi_Lot16_2026-11-25.xlsx';
// Reuse the lot13 recovery path approved for this task. The serializer packages
// the artifact-tool model and independently verifies cells, styles and controls.
await fs.writeFile(path.join(outputDir,'workbook-checkpoint.json'),JSON.stringify(wb.toProto()));
const serializationPath = path.join(outputDir,'workbook-serialization.json');
execFileSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3',[
  path.join(repoRoot,'scripts/export-armax-lot16-workbook-xml.py'),
  path.join(outputDir,'workbook-checkpoint.json'),path.join(outputDir,filename),serializationPath
],{cwd:repoRoot,encoding:'utf8',maxBuffer:1024*1024});
const serialization = JSON.parse(await fs.readFile(serializationPath,'utf8'));
if (!serialization.success) throw new Error('Independent XLSX serialization verification failed');
const readback = Workbook.load(JSON.parse(await fs.readFile(path.join(outputDir,'workbook-readback-model.json'),'utf8')),{validate:true});
for (const [sheetName,range,name] of [['Synthese','A1:E33','synthese'],['Catalogue',`M${longestCurrentNoteRow}:N${longestCurrentNoteRow}`,'notes-production']]) {
  const blob = await readback.render({sheetName,range,scale:name==='synthese'?1.5:1,format:'png'});
  await fs.writeFile(path.join(outputDir,`readback-${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
await fs.copyFile(path.join(outputDir,filename),path.join(lotDir,filename));
const inputHashes = {};
for (const name of (await fs.readdir(lotDir)).filter(name=>name.endsWith('.json') && !['workbook-verification.json','verification.json','link-verification.json'].includes(name)).sort()) {
  inputHashes[name] = createHash('sha256').update(await fs.readFile(path.join(lotDir,name))).digest('hex');
}
const xlsxSha256 = createHash('sha256').update(await fs.readFile(path.join(lotDir,filename))).digest('hex');
const identityContinuity = {baseline:'docs/armax/lot14/production-catalog.json',baselineCommit:baseCommit,subjects:baselineIdentity.size,fields:identityFields,checkedFields:baselineIdentity.size*identityFields.length,unchanged:true,historicalImagePathsRetained:true,historicalBlockedStatusesRetained:true};
const originalPngCorpusCount = new Set([...recovered.assets.map(a=>a.path),...catalog.entries.flatMap(e=>[...e.assetFiles,...e.alternateAssetFiles])]).size;
const consolidationInputs = await readOptionalJson('docs/armax/lot16/consolidation-inputs.json');
const attemptSources = consolidationInputs?.attemptSources;
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify({
  date:'2026-11-25',baseCommit,builder:'scripts/build-armax-lot16-workbook.mjs',
  runtime:'@oai/artifact-tool; managed primary Node runtime',
  exportMethod:'artifact-tool authoring/recalculation/rendering; Python standard-library OpenXML serialization from its checkpoint and the unchanged native lot14 style package',
  exportRecovery:'The bounded serializer inherited from lots13–14 packages the artifact-tool model against the native lot14 style package. No new WASM export attempt or success is claimed for lot16.',
  serialization,
  independentReadbackRenderMethod:'XLSX read with openpyxl (no writing), every cell/formula/cache/style/layout/control compared, then actual read-back values loaded by artifact-tool for Synthese and the longest current production note.',
  sheets:['Synthese','Catalogue','Recuperes'],independent,calculated,
  recalculated:true,recalculationInputCheck,formulaErrorScan:errors.ndjson,
  renderedSheets:['Synthese','Catalogue','Recuperes'],visualReviewCompleted:false,nativeExcelOpened:false,
  inputHashes,xlsxSha256,identityContinuity,originalPngCorpusCount,
  beforeEditInspection:{importedNativeLot14:true,renderedSheets:['Synthese','Catalogue','Recuperes'],visuallyReviewed:true},
  lot15OriginalsCountedAsPresent:false,
  inheritedNewlyIllustratedMeaning:'One additional pose on a previously illustrated identity; zero previously missing inherited identities closed.',
  blockedSubjects:catalog.entries.filter(e=>e.latestGenerationAttempt==='blocked').length,
  recordedGenerationCalls:Array.isArray(attemptSources) ? attemptSources.reduce((sum,source)=>sum+source.count,0) : null,
  dimensionsAndAlphaVerifiedHere:false,
  technicalQaMethod:'Image dimensions and alpha are verified separately in the lot16 asset manifests; this workbook preserves their production and fidelity statuses.',
  historicalAssetsMethod:'Inherited paths compared to the immutable lot14 catalogue; historical binaries need not be locally materialized.'
},null,2)+'\n');
console.log(JSON.stringify({output:path.join(lotDir,filename),counts:calculated,formulaScan:errors.ndjson}));

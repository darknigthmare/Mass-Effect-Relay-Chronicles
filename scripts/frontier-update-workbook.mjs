// Scoped candidate authoring only. The public files remain unchanged until the
// native verifier and actual final XLSX panel review both succeed.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {BASE_COMMIT,IDS,PROMOTED_IDS,FIELD_COLUMNS,replacements,additions,synchronizeCoverage,sha} from './frontier-workbook-data.mjs';
import {readAssets} from './frontier-assets.mjs';

const option=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const root=path.resolve(option('--root')||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const output=option('--output-dir'),manifestArgument=option('--manifest');
const gates=[['integration',option('--integration-report')],['development',option('--development-report')],['visual',option('--visual-review')]];
assert.ok(output&&manifestArgument&&gates.every(([,value])=>value),'Provide --output-dir --manifest --integration-report --development-report --visual-review.');
assert.equal(option('--base-commit'),BASE_COMMIT);
const sourceWorkbook=path.resolve(option('--input')||path.join(root,'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'));
const sourceCatalogue=path.resolve(option('--catalog')||path.join(root,'docs/content-catalog.json'));
const outputDir=path.resolve(output),baseline=JSON.parse(await fs.readFile(path.join(root,'docs/qa/frontier-workbook-baseline.json')));
assert.equal(baseline.baselineCommit,BASE_COMMIT);assert.deepEqual(baseline.selectedIDs,IDS);
assert.equal(sha(await fs.readFile(sourceWorkbook)),baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
assert.equal(sha(await fs.readFile(sourceCatalogue)),baseline.sourceHashes['docs/content-catalog.json']);
const integrationSources={},integrationProofs=[],reports=[];
for(const[kind,supplied]of gates){
  const filename=path.resolve(supplied),raw=await fs.readFile(filename),report=JSON.parse(raw);assert.equal(report.passed,true,`No promotion before positive ${kind} gate.`);
  if(kind==='visual'){assert.equal(report.reviewComplete,true);assert.deepEqual(report.blockingFindings,[]);}
  const sources=report.sourceHashes||report.sources||{},pairs=Array.isArray(sources)?sources.map(item=>[item.path,item.sha256]):Object.entries(sources);
  for(const[name,expected]of pairs){assert.match(expected,/^[a-f0-9]{64}$/);assert.equal(sha(await fs.readFile(path.resolve(root,name))),expected,`Stale ${kind} gate: ${name}`);
    if(Object.hasOwn(integrationSources,name))assert.equal(integrationSources[name],expected);integrationSources[name]=expected;}
  if(kind!=='visual')assert.ok(Object.fromEntries(pairs)['src/world.js'],`${kind} must identify its executed world.`);
  const snapshot=`docs/qa/frontier-workbook-${kind}-gate.json`;await fs.writeFile(path.join(root,snapshot),raw);
  integrationProofs.push({kind,path:snapshot,source:path.relative(root,filename),sha256:sha(raw),worldSha256:integrationSources['src/world.js']});reports.push({kind,report});
}
const assets=await readAssets(root);
for(const[name,digest]of Object.entries(assets.sourceHashes))if(name.startsWith('public/')||name.startsWith('src/')||name==='vite.config.js')assert.equal(integrationSources[name],digest,`No current integration proof for ${name}`);
const reviewed=reports.flatMap(({report})=>[report.imagesReviewed,report.images,report.manualVisualReview?.images,report.actualVisualReview?.images].filter(Array.isArray).flat());
assert.ok(reviewed.length,'Actual opened visual records are required.');
for(const capture of reports.filter(item=>item.kind!=='visual').flatMap(({report})=>report.captureArtifacts||report.screenshots||[])){
  assert.ok(reviewed.find(item=>item.path===capture.path&&item.sha256===capture.sha256&&item.actuallyOpened===true),`Capture not actually opened: ${capture.path}`);
  assert.equal(sha(await fs.readFile(path.join(root,capture.path))),capture.sha256);
}
const catalogue=JSON.parse(await fs.readFile(sourceCatalogue)),original=structuredClone(catalogue);
assert.equal(catalogue.entries.length,1382);assert.equal(new Set(catalogue.entries.map(item=>item.id)).size,1382);
const manifestPath=path.resolve(manifestArgument),manifest=JSON.parse(await fs.readFile(manifestPath));assert.equal(manifest.assets.length,36);assert.equal(manifest.combatKeyPoses,84);
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;assert.ok(runtime,'CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const require=createRequire(path.join(runtime,'__frontier_workbook__.cjs'));
const{FileBlob,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(sourceWorkbook));
// Repair only the imported conditional-format references; compare effective
// definitions at their consumers and count any unused export definitions.
for(const category of catalogue.categories){
  const sheet=workbook.worksheets.getItem(category.sheetName),lastRow=6+catalogue.entries.filter(item=>item.category===category.id).length;
  for(const column of['C','G','E'])sheet.getRange(`${column}7:${column}${lastRow}`).conditionalFormats.clear();
  for(const[status,fill,color]of[['Prototype','#FFF1D0','#865000'],['Intégré','#D9EEF2','#0C5966'],['Validé','#DDF1E8','#176A4D']])
    sheet.getRange(`C7:C${lastRow}`).conditionalFormats.add('cellIs',{operator:'equal',formula:`"${status}"`,format:{fill,font:{color,bold:true}}});
  sheet.getRange(`G7:G${lastRow}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"Référence à vérifier"',format:{fill:'#FFF2DC',font:{color:'#79520A'}}});
  sheet.getRange(`E7:E${lastRow}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"P0"',format:{font:{bold:true,color:'#087F8C'}}});
}
const catalogueChanges=[],cellChanges=[],rowLocations={},rowHeightChanges=[],expectedFieldsById={};
for(const id of IDS){
  const entry=catalogue.entries.find(item=>item.id===id),expected=baseline.rowLocations[id];assert.ok(entry);assert.equal(entry.status,expected.status);assert.equal(entry.assetStatus,expected.assetStatus);
  const sheet=workbook.worksheets.getItem(expected.sheetName),row=expected.row;assert.equal(sheet.getRange(`A${row}`).values[0][0],id);rowLocations[id]={sheetName:expected.sheetName,row};
  const updates=replacements(id),metadata=additions(id);expectedFieldsById[id]=[...Object.keys(updates),...Object.keys(metadata)];
  for(const[field,next]of Object.entries(updates)){
    const address=`${FIELD_COLUMNS[field]}${row}`,previous=sheet.getRange(address).values[0][0];assert.equal(previous??'',entry[field]??'',`${id}.${field}`);assert.notEqual(previous??'',next??'',`${id}.${field}`);
    sheet.getRange(address).values=[[next]];catalogueChanges.push({id,field,before:entry[field]??null,after:next});cellChanges.push({id,sheet:expected.sheetName,address,field,before:previous??null,after:next});entry[field]=next;
  }
  for(const[field,more]of Object.entries(metadata)){
    const previous=entry[field]||[],next=[...new Set([...previous,...more])];assert.ok(Array.isArray(previous));assert.notDeepEqual(next,previous);catalogueChanges.push({id,field,before:previous,after:next});entry[field]=next;
  }
  const height=Math.max(expected.rowHeight,Math.ceil(String(entry.notes||'').length/60)*13+12,Math.ceil(String(entry.description||'').length/49)*13+12);
  if(height!==expected.rowHeight){sheet.getRange(`A${row}:Q${row}`).format.rowHeight=height;rowHeightChanges.push({id,sheet:expected.sheetName,row,before:expected.rowHeight,after:height});}
}
const allowedIDs=new Set(IDS),allowedFields=new Set([...Object.keys(FIELD_COLUMNS),'implementationPaths','evidence']);
for(const[index,before]of original.entries.entries()){
  const after=catalogue.entries[index];if(!allowedIDs.has(before.id))assert.deepEqual(after,before);
  else for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(!allowedFields.has(key))assert.deepEqual(after[key],before[key]);
}
const coverage=await synchronizeCoverage(root,catalogue,manifest),oldMeta=structuredClone(original.meta),newMeta=structuredClone(catalogue.meta);
delete oldMeta.prototypeCoverage;delete newMeta.prototypeCoverage;assert.deepEqual(newMeta,oldMeta);
workbook.recalculate();
const statusCounts=value=>Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,value.entries.filter(item=>item.status===status).length]));
const changedCategories=[...new Set(PROMOTED_IDS.map(id=>original.entries.find(item=>item.id===id).category))];
const dashboardRows=[...changedCategories.map(id=>10+catalogue.categories.findIndex(item=>item.id===id)),37].sort((a,b)=>a-b);
const cacheCells=dashboardRows.flatMap(row=>[`C${row}`,`D${row}`]);
const bySheet=new Map();for(const[id,item]of Object.entries(rowLocations)){if(!bySheet.has(item.sheetName))bySheet.set(item.sheetName,[]);bySheet.get(item.sheetName).push({id,row:item.row});}
const previews=[];
for(const[sheetName,rows]of bySheet){
  rows.sort((a,b)=>a.row-b.row);const groups=[];for(const item of rows){const last=groups.at(-1);if(last&&last.at(-1).row===item.row-1)last.push(item);else groups.push([item]);}
  for(const group of groups)for(const[panel,first,last]of[['identity','A','D'],['tracking','L','Q']]){
    const a=group[0].row,b=group.at(-1).row;previews.push({ids:group.map(item=>item.id),file:`frontier-workbook-${sheetName.toLowerCase()}-${a}-${b}-${panel}.png`,sheetName,range:`${first}${a}:${last}${b}`});
  }
}
for(const id of['SYS-transitions-de-camera','SPR-VEH-mako']){const{sheetName,row}=rowLocations[id];previews.push({ids:[id],file:`frontier-workbook-${sheetName.toLowerCase()}-${row}-description.png`,sheetName,range:`H${row}:I${row}`});}
for(const row of dashboardRows)previews.push({file:`frontier-workbook-dashboard-${row}.png`,sheetName:'Dashboard',range:`A${row}:F${row}`});
const errors=await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},maxChars:3000});
await fs.mkdir(outputDir,{recursive:true});const workbookPath=path.join(outputDir,'Mass_Effect_Relay_Chronicles_Production.xlsx'),cataloguePath=path.join(outputDir,'content-catalog.json');
await(await SpreadsheetFile.exportXlsx(workbook)).save(workbookPath);await fs.writeFile(cataloguePath,JSON.stringify(catalogue,null,2)+'\n');
const report={passed:true,generatedAt:new Date().toISOString(),baseCommit:BASE_COMMIT,scope:'34existing records;25partial Prototype promotions after current native, development and actual visual gates. Canonical acceptance criteria retained. Only selected row heights extended; no Intégré/Validé promotion or1:1 certification.',
 sourceWorkbook,sourceCatalog:sourceCatalogue,workbookPath,sourceHashes:{workbook:sha(await fs.readFile(sourceWorkbook)),catalogue:sha(await fs.readFile(sourceCatalogue))},outputHashes:{workbook:sha(await fs.readFile(workbookPath)),catalogue:sha(await fs.readFile(cataloguePath))},
 catalogueEntries:1382,changedIds:IDS,unchangedEntries:1382-IDS.length,expectedFieldsById,assetSourceHashes:assets.sourceHashes,manifestProof:{path:path.relative(root,manifestPath),sha256:sha(await fs.readFile(manifestPath))},
 integrationProofs,catalogueChanges,cellChanges,rowHeightChanges,rowLocations,prototypeCoverage:coverage,beforeStatuses:statusCounts(original),afterStatuses:statusCounts(catalogue),
 explicitPromotions:PROMOTED_IDS.map(id=>({id,from:'Défini',to:'Prototype',reason:'Partial native integration actually exercised and visually opened; original acceptance remains future work.'})),
 formulaCacheCells:cacheCells.map(address=>({sheet:'Dashboard',address,after:workbook.worksheets.getItem('Dashboard').getRange(address).values[0][0]})),formulaErrorInspection:errors.ndjson,previews,
 limits:['No Microsoft Excel launch or full-workbook visual audit.','31other XLSX and1348unselected records remain unchanged.','Native XML/effective-style verification and actual final targeted panel review remain required before public copy.']};
await fs.writeFile(path.join(root,'docs/qa/frontier-workbook-update.json'),JSON.stringify(report,null,2)+'\n');
assert.equal(sha(await fs.readFile(sourceWorkbook)),baseline.sourceHashes['docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);assert.equal(sha(await fs.readFile(sourceCatalogue)),baseline.sourceHashes['docs/content-catalog.json']);
console.log(JSON.stringify({passed:true,selected:IDS.length,changedCells:cellChanges.length,metadataFields:catalogueChanges.length-cellChanges.length,resizedRows:rowHeightChanges.length,panels:previews.length,statuses:report.afterStatuses}));

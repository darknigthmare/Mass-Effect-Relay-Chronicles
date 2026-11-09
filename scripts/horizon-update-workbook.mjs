// Author reviewed candidates only. Publishing is a separate final gate.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,IDS,NEW_IDS,replacements,additions,newRecords,synchronizeCoverage,sha} from './horizon-workbook-data.mjs';
import {readAssets} from './horizon-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
const outputDir=option('--output-dir'),manifestArgument=option('--manifest');
const gates=[['integration',option('--integration-report')],['development',option('--development-report')],['visual',option('--visual-review')]];
assert.ok(outputDir&&manifestArgument&&gates.every(([,file])=>file),'Provide --output-dir --manifest --integration-report --development-report --visual-review.');
const destination=path.resolve(outputDir),baseline=JSON.parse(await fs.readFile(path.join(root,'docs/qa/horizon-workbook-baseline.json')));
const scope=JSON.parse(await fs.readFile(path.join(root,'scripts/horizon-workbook-scope.json')));
assert.equal(baseline.baselineCommit,BASE_COMMIT);assert.deepEqual(scope.changedIds,IDS);assert.deepEqual(scope.newIds,NEW_IDS);
const sourceWorkbook=path.join(root,'docs/Mass_Effect_Relay_Chronicles_Production.xlsx'),sourceCatalogue=path.join(root,'docs/content-catalog.json');
for(const filename of [sourceWorkbook,sourceCatalogue])assert.equal(sha(await fs.readFile(filename)),baseline.sourceHashes[path.relative(root,filename)]);
const integrationSources={},integrationProofs=[],reports=[];
for(const[kind,supplied]of gates){
  const filename=path.resolve(supplied),raw=await fs.readFile(filename),report=JSON.parse(raw);assert.equal(report.passed,true,`No candidate before the positive ${kind} gate.`);
  if(kind==='visual'){assert.equal(report.reviewComplete,true);assert.deepEqual(report.blockingFindings,[]);}
  const sources=report.sourceHashes||report.sources||{};assert.ok(!Array.isArray(sources));
  for(const[name,expected]of Object.entries(sources)){
    assert.match(expected,/^[a-f0-9]{64}$/);assert.equal(sha(await fs.readFile(path.resolve(root,name))),expected,`Stale ${kind} gate: ${name}`);
    if(Object.hasOwn(integrationSources,name))assert.equal(integrationSources[name],expected);integrationSources[name]=expected;
  }
  if(kind!=='visual')assert.ok(sources['src/world.js'],`${kind} must identify its current executed world.`);
  const snapshot=`docs/qa/horizon-workbook-${kind}-gate.json`;await fs.writeFile(path.join(root,snapshot),raw);
  integrationProofs.push({kind,path:snapshot,source:path.relative(root,filename),sha256:sha(raw),worldSha256:integrationSources['src/world.js']});reports.push({kind,report});
}
const assets=await readAssets(root);
for(const[name,expected]of Object.entries(assets.sourceHashes))assert.equal(integrationSources[name],expected,`No current integration source proof: ${name}`);
const reviewed=reports.flatMap(({report})=>[report.images,report.imagesReviewed,report.manualVisualReview?.images].filter(Array.isArray).flat());
for(const capture of reports.filter(item=>item.kind!=='visual').flatMap(({report})=>report.captureArtifacts||report.screenshots||[])){
  assert.ok(reviewed.some(image=>image.path===capture.path&&image.sha256===capture.sha256&&image.actuallyOpened===true),`Not actually opened: ${capture.path}`);
  assert.equal(sha(await fs.readFile(path.join(root,capture.path))),capture.sha256);
}
assert.ok(reviewed.length);
const catalogue=JSON.parse(await fs.readFile(sourceCatalogue)),original=structuredClone(catalogue);
const manifestPath=path.resolve(manifestArgument),manifest=JSON.parse(await fs.readFile(manifestPath));
assert.equal(catalogue.entries.length,1382);assert.equal(manifest.assets.length,41);assert.equal(manifest.combatKeyPoses,84);
const catalogueChanges=[],expectedFieldsById={},rowLocations={};
for(const id of IDS){
  const entry=catalogue.entries.find(entry=>entry.id===id);assert.ok(entry,id);rowLocations[id]=baseline.rowLocations[id];
  expectedFieldsById[id]=[];
  for(const[field,next]of Object.entries(replacements(entry))){
    const previous=entry[field]??null;if(JSON.stringify(previous)===JSON.stringify(next))continue;
    assert.ok(scope.allowedFieldsById[id].includes(field));catalogueChanges.push({id,field,before:previous,after:next});entry[field]=next;expectedFieldsById[id].push(field);
  }
  for(const[field,more]of Object.entries(additions(id))){
    const previous=entry[field]||[],next=[...new Set([...previous,...more])];assert.notDeepEqual(next,previous);assert.ok(scope.allowedFieldsById[id].includes(field));
    catalogueChanges.push({id,field,before:previous,after:next});entry[field]=next;expectedFieldsById[id].push(field);
  }
}
const added=newRecords(catalogue);assert.deepEqual(added.map(entry=>entry.id),NEW_IDS);
assert.ok(added.every(entry=>!catalogue.entries.some(old=>old.id===entry.id)));catalogue.entries.push(...added);
const coverage=await synchronizeCoverage(root,catalogue,manifest);
for(const[index,entry]of original.entries.entries()){
  const after=catalogue.entries[index];assert.equal(entry.id,after.id);
  for(const key of new Set([...Object.keys(entry),...Object.keys(after)]))if(!IDS.includes(entry.id)||!scope.allowedFieldsById[entry.id].includes(key))assert.deepEqual(after[key],entry[key],`${entry.id}.${key}`);
}
assert.deepEqual(catalogue.sources,original.sources);assert.deepEqual(catalogue.categories,original.categories);
await fs.mkdir(destination,{recursive:true});
const cataloguePath=path.join(destination,'content-catalog.json'),workbookPath=path.join(destination,'Mass_Effect_Relay_Chronicles_Production.xlsx');
await fs.writeFile(cataloguePath,JSON.stringify(catalogue,null,2)+'\n');
const planPath=path.join(destination,'horizon-authoring-plan.json');
await fs.writeFile(planPath,JSON.stringify({baseCommit:BASE_COMMIT,changedIds:IDS,newIds:NEW_IDS,expectedFieldsById},null,2)+'\n');
const authorPath=path.join(destination,'horizon-native-authoring.json');
execFileSync('python',['scripts/horizon-patch-workbook.py','--before',sourceWorkbook,'--catalog-before',sourceCatalogue,'--catalog-after',cataloguePath,
  '--plan',planPath,'--output',workbookPath,'--report',authorPath],{cwd:root,stdio:'inherit'});
const nativeAuthoring=JSON.parse(await fs.readFile(authorPath));
const statusCounts=value=>Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,value.entries.filter(entry=>entry.status===status).length]));
const bySheet=new Map();for(const[id,location]of Object.entries(rowLocations)){if(!bySheet.has(location.sheetName))bySheet.set(location.sheetName,[]);bySheet.get(location.sheetName).push({id,row:location.row});}
for(const item of nativeAuthoring.appendedRows){if(!bySheet.has(item.sheet))bySheet.set(item.sheet,[]);bySheet.get(item.sheet).push({id:item.id,row:item.row});rowLocations[item.id]={sheetName:item.sheet,row:item.row};}
const previews=[];
for(const[sheetName,rows]of bySheet){
  rows.sort((a,b)=>a.row-b.row);const groups=[];
  for(const item of rows){const last=groups.at(-1);if(last&&last.at(-1).row===item.row-1)last.push(item);else groups.push([item]);}
  for(const group of groups)for(const[panel,first,last]of[['identity','A','D'],['tracking','L','Q']]){
    const a=group[0].row,b=group.at(-1).row;previews.push({ids:group.map(item=>item.id),file:`horizon-workbook-${sheetName.toLowerCase()}-${a}-${b}-${panel}.png`,sheetName,range:`${first}${a}:${last}${b}`});
  }
}
const camera=rowLocations['SYS-transitions-de-camera'];previews.push({ids:['SYS-transitions-de-camera'],file:`horizon-workbook-camera-description.png`,sheetName:camera.sheetName,range:`H${camera.row}:I${camera.row}`});
previews.push({ids:NEW_IDS,file:'horizon-workbook-new-sprites-descriptions.png',sheetName:'Sprites',range:'H89:K91'});
const changedDashboardRows=[...new Set(nativeAuthoring.formulaCacheChanges.map(item=>Number(item.address.match(/\d+/)[0])))].sort((a,b)=>a-b);
for(const row of changedDashboardRows){
  previews.push({file:`horizon-workbook-dashboard-${row}-status.png`,sheetName:'Dashboard',range:`A${row}:F${row}`});
  if([5,30,37].includes(row))previews.push({file:`horizon-workbook-dashboard-${row}-references.png`,sheetName:'Dashboard',range:`G${row}:K${row}`});
}
const report={passed:true,generatedAt:new Date().toISOString(),baseCommit:BASE_COMMIT,sourceWorkbook,sourceCatalog:sourceCatalogue,workbookPath,cataloguePath,
  sourceHashes:{workbook:sha(await fs.readFile(sourceWorkbook)),catalogue:sha(await fs.readFile(sourceCatalogue))},
  outputHashes:{workbook:sha(await fs.readFile(workbookPath)),catalogue:sha(await fs.readFile(cataloguePath))},
  changedIds:IDS,newIds:NEW_IDS,catalogueEntries:1385,unchangedEntries:1382-IDS.length,expectedFieldsById,catalogueChanges,newRecords:added,
  assetSourceHashes:assets.sourceHashes,manifestProof:{path:path.relative(root,manifestPath),sha256:sha(await fs.readFile(manifestPath))},
  integrationProofs,rowLocations,prototypeCoverage:coverage,beforeStatuses:statusCounts(original),afterStatuses:statusCounts(catalogue),
  nativeAuthoring,cellChanges:nativeAuthoring.cellChanges,rowHeightChanges:nativeAuthoring.rowHeightChanges,previews,
  explicitPromotions:catalogueChanges.filter(item=>item.field==='status').map(item=>({id:item.id,from:item.before,to:item.after})),
  scope:'28existing records and3new explicit SPR deliveries, after native/development/opened-visual gates. Existing acceptance criteria unchanged. Candidate requires independent native verification, live counter probe and actual final XLSX panel review before publication.'};
await fs.writeFile(path.join(root,'docs/qa/horizon-workbook-update.json'),JSON.stringify(report,null,2)+'\n');
for(const filename of [sourceWorkbook,sourceCatalogue])assert.equal(sha(await fs.readFile(filename)),baseline.sourceHashes[path.relative(root,filename)]);
console.log(JSON.stringify({passed:true,candidateOnly:true,existing:IDS.length,added:NEW_IDS.length,cells:report.cellChanges.length,previews:previews.length,statuses:report.afterStatuses}));

// Read-only inventory of the exact published baseline. No tracking promotion.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,sha} from './horizon-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2]||'/tmp/horizon-workbook-baseline');
const reportPath=path.join(root,'docs/qa/horizon-workbook-baseline.json');
try{await fs.access(reportPath);throw Error('Baseline already exists; preserve it.');}catch(error){if(error.code!=='ENOENT')throw error;}
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),BASE_COMMIT);
const read=rel=>execFileSync('git',['show',`${BASE_COMMIT}:${rel}`],{cwd:root,maxBuffer:50*1024*1024});
const tracked=execFileSync('git',['ls-tree','-r','--name-only',BASE_COMMIT],{cwd:root,encoding:'utf8'}).trim().split('\n');
await fs.mkdir(destination,{recursive:true});
const names=['docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx','public/assets/manifest.json'];
const sourceHashes={};
for(const rel of names){const bytes=read(rel);sourceHashes[rel]=sha(bytes);assert.equal(sha(await fs.readFile(path.join(root,rel))),sha(bytes),`Public source changed before baseline: ${rel}`);await fs.writeFile(path.join(destination,path.basename(rel)),bytes);}
const catalogue=JSON.parse(read(names[0])),manifest=JSON.parse(read(names[2]));
assert.equal(catalogue.entries.length,1382);assert.equal(new Set(catalogue.entries.map(item=>item.id)).size,1382);
const native=JSON.parse(execFileSync('python',['scripts/frontier-workbook-native-baseline.py',path.join(destination,'Mass_Effect_Relay_Chronicles_Production.xlsx')],{cwd:root,encoding:'utf8'}));
const rowLocations={};
for(const category of catalogue.categories)for(const[index,entry]of catalogue.entries.filter(entry=>entry.category===category.id).entries()){
  const row=index+7;rowLocations[entry.id]={category:category.id,sheetName:category.sheetName,row,rowHeight:native.rowHeights[category.sheetName][row],status:entry.status,assetStatus:entry.assetStatus};
}
delete native.rowHeights;
const hashPaths=predicate=>Object.fromEntries(tracked.filter(predicate).map(name=>[name,sha(read(name))]));
const publicPNGHashes=hashPaths(name=>/^public\/assets\/[^/]+\.png$/.test(name));
const otherWorkbookHashes=hashPaths(name=>name.endsWith('.xlsx')&&name!==names[1]);
const universeCatalogueHashes=hashPaths(name=>/^docs\/universe\/catalogs\/[^/]+\.json$/.test(name));
const statusCounts=Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,catalogue.entries.filter(entry=>entry.status===status).length]));
assert.equal(Object.keys(publicPNGHashes).length,41);assert.equal(Object.keys(otherWorkbookHashes).length,31);assert.equal(Object.keys(universeCatalogueHashes).length,27);
assert.deepEqual(statusCounts,{'Défini':1001,'Prototype':375,'Intégré':3,'Validé':3});
const report={passed:true,at:new Date().toISOString(),baselineCommit:BASE_COMMIT,catalogueEntries:1382,sourceHashes,rowLocations,
 publicPNGHashes,publicPNGCount:41,otherWorkbookHashes,otherWorkbookCount:31,universeCatalogueHashes,universeCatalogueCount:27,
 advancedRecords:catalogue.entries.filter(entry=>['Intégré','Validé'].includes(entry.status)),statusCounts,nativeChecks:native,
 manifest:{coreAssets:manifest.assets.length,combatKeyPoses:manifest.combatKeyPoses,enemyCombatKeyPoses:manifest.enemyCombatKeyPoses,companionCombatKeyPoses:manifest.companionCombatKeyPoses,bossCombatKeyPoses:manifest.bossCombatKeyPoses},
 scope:'Immutable published 2ab3f7c baseline for all1382existing records. No scope selection, promotion, asset generation or1:1 certification. New rows and each changed existing field require separate explicit native/development/visual gates.'};
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,baselineCommit:BASE_COMMIT,records:1382,publicPNG:41,otherWorkbooks:31,universeCatalogues:27,statusCounts,destination}));

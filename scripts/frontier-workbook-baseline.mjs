// Read immutable git baseline; do not mutate a delivered workbook or catalogue.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,IDS,sha} from './frontier-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2]||'/tmp/frontier-workbook-baseline';
await fs.mkdir(destination,{recursive:true});
const read=rel=>execFileSync('git',['show',`${BASE_COMMIT}:${rel}`],{cwd:root,maxBuffer:50*1024*1024});
const paths=['docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx','public/assets/manifest.json'];
const sourceHashes={};
for(const rel of paths){const bytes=read(rel);sourceHashes[rel]=sha(bytes);assert.equal(sha(await fs.readFile(path.join(root,rel))),sha(bytes),`Public source has changed: ${rel}`);await fs.writeFile(path.join(destination,path.basename(rel)),bytes);}
const catalogue=JSON.parse(read(paths[0])),manifest=JSON.parse(read(paths[2]));
assert.equal(catalogue.entries.length,1382);assert.equal(new Set(catalogue.entries.map(item=>item.id)).size,1382);
const rowLocations=Object.fromEntries(IDS.map(id=>{const entry=catalogue.entries.find(item=>item.id===id);assert.ok(entry,id);const category=catalogue.categories.find(item=>item.id===entry.category);return[id,{sheetName:category.sheetName,row:7+catalogue.entries.filter(item=>item.category===entry.category).findIndex(item=>item.id===id),status:entry.status,assetStatus:entry.assetStatus}];}));
const tracked=execFileSync('git',['ls-tree','-r','--name-only',BASE_COMMIT],{cwd:root,encoding:'utf8'}).trim().split('\n');
const publicPNGHashes=Object.fromEntries(tracked.filter(name=>/^public\/assets\/[^/]+\.png$/.test(name)).map(name=>[name,sha(read(name))]));
const otherWorkbookHashes=Object.fromEntries(tracked.filter(name=>name.endsWith('.xlsx')&&name!==paths[1]).map(name=>[name,sha(read(name))]));
const counts=Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,catalogue.entries.filter(item=>item.status===status).length]));
const native=JSON.parse(execFileSync('python',['scripts/frontier-workbook-native-baseline.py',path.join(destination,'Mass_Effect_Relay_Chronicles_Production.xlsx')],{cwd:root,encoding:'utf8'}));
for(const row of Object.values(rowLocations))row.rowHeight=native.rowHeights[row.sheetName][row.row];
delete native.rowHeights;
const report={passed:true,at:new Date().toISOString(),baselineCommit:BASE_COMMIT,selectedIDs:IDS,catalogueEntries:1382,sourceHashes,rowLocations,
 publicPNGHashes,publicPNGCount:Object.keys(publicPNGHashes).length,otherWorkbookHashes,otherWorkbookCount:Object.keys(otherWorkbookHashes).length,
 statusCounts:counts,nativeChecks:native,manifest:{coreAssets:manifest.assets.length,combatKeyPoses:manifest.combatKeyPoses,enemyCombatKeyPoses:manifest.enemyCombatKeyPoses,companionCombatKeyPoses:manifest.companionCombatKeyPoses},
 scope:'Read-only baseline of 34 existing records; all remaining records and all other workbooks must remain unchanged. No promotion or 1:1 certification.'};
await fs.writeFile(path.join(root,'docs/qa/frontier-workbook-baseline.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,selectedIDs:IDS.length,publicPNG:report.publicPNGCount,otherWorkbooks:report.otherWorkbookCount,statusCounts:counts,destination}));

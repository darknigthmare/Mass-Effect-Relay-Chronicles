// Actual exhaustive catalogue/runtime QA; no file generation or status editing.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, readJson, fresh, sha, counts, currentSources } from './completion-tracking-common.mjs';
const option=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
const output=option('--output');assert.ok(output);await fresh(path.resolve(ROOT,output));
const baseline=await readJson(option('--baseline')||'docs/qa/completion-tracking-baseline-02.json');
const inputHashes={},catalogues=[],entries=[],allSources=[],perCatalogue=[];
const primary=await readJson('docs/content-catalog.json');const categories=primary.data.categories;
assert.equal(new Set(categories.map(category=>category.id)).size,categories.length);
assert.equal(new Set(categories.map(category=>category.sheetName)).size,categories.length);
assert.equal(categories.length,26);
for(const item of baseline.data.catalogues) {
  const catalogue=await readJson(item.catalogPath), data=catalogue.data;inputHashes[catalogue.path]=catalogue.sha256;catalogues.push(catalogue);
  const allowedCategories=new Set(categories.map(category=>category.id==='trilogy'&&item.id!=='ME1'?'continuity':category.id));
  const sourceIds=new Set(data.sources.map(source=>source.id));assert.equal(sourceIds.size,data.sources.length,`${item.id}: duplicate sources`);
  for(const entry of data.entries) {
    assert.ok(allowedCategories.has(entry.category),`${entry.id}: category`);
    assert.ok(['Défini','Prototype','Intégré','Validé'].includes(entry.status),`${entry.id}: status`);
    assert.ok(['P0','P1','P2'].includes(entry.priority),`${entry.id}: priority`);
    for(const id of entry.sourceIds || (entry.sourceId?[entry.sourceId]:[]))assert.ok(sourceIds.has(id),`${entry.id}: missing source ${id}`);
    entries.push({...entry,catalogueId:item.id});
  }
  allSources.push(...data.sources);
  const byCategory=Object.fromEntries([...allowedCategories].map(category=>[category,{records:data.entries.filter(entry=>entry.category===category).length,statuses:counts(data.entries.filter(entry=>entry.category===category))}]));
  assert.equal(Object.values(byCategory).reduce((sum,item)=>sum+item.records,0),data.entries.length);
  perCatalogue.push({id:item.id,path:item.catalogPath,sha256:catalogue.sha256,records:data.entries.length,statuses:counts(data.entries),byCategory});
}
const ids=new Set(entries.map(entry=>entry.id));assert.equal(ids.size,entries.length,'Duplicate production IDs');
for(const entry of entries)for(const dependency of entry.dependencies || [])assert.ok(ids.has(dependency),`${entry.id}: missing dependency ${dependency}`);
assert.equal(entries.length,baseline.data.records);assert.equal(allSources.length,baseline.data.sources);
const runtimePath='src/universe-data.js';inputHashes[runtimePath]=sha(await fs.readFile(path.join(ROOT,runtimePath)));
const runtime=await import(pathToFileURL(path.join(ROOT,runtimePath)).href),records=runtime.UNIVERSE_RECORDS;
assert.equal(records.length,entries.length);assert.equal(new Set(records.map(record=>record.id)).size,records.length);
assert.equal(runtime.UNIVERSE_SUMMARY.recordCount,entries.length);assert.equal(runtime.UNIVERSE_SUMMARY.catalogCount,catalogues.length);assert.equal(runtime.UNIVERSE_SUMMARY.sourceCount,allSources.length);
const lookup=new Map(records.map(record=>[record.id,record]));
for(const entry of entries) {
  const actual=lookup.get(entry.id);assert.ok(actual,entry.id);
  for(const field of ['name','category','status'])assert.deepEqual(actual[field],entry[field],`${entry.id}: registry ${field}`);
  assert.equal(actual.catalogWorkId,entry.catalogueId,entry.id);
}
for(const catalogue of catalogues)assert.equal(runtime.UNIVERSE_SUMMARY.catalogDigests[catalogue.path],catalogue.sha256,`Registry digest ${catalogue.path}`);
inputHashes['scripts/completion-tracking-catalogue-qa.mjs']=sha(await fs.readFile(new URL(import.meta.url)));
await currentSources(inputHashes,'exhaustive catalogue QA');
const report={passed:true,generatedAt:new Date().toISOString(),baseCommit:baseline.data.baseCommit,kind:'native-catalogue-qa',selfcheckOnly:false,
  exactCriterion:'Catégories et compteurs exacts, aucun ID dupliqué.',criterionId:'QA-import-du-catalogue',
  sourceHashes:inputHashes,catalogues:catalogues.length,records:entries.length,uniqueIds:ids.size,sources:allSources.length,mainCategories:categories.length,
  statuses:counts(entries),mainStatuses:counts(primary.data.entries),perCatalogue,runtimeRecords:records.length,
  checks:['All IDs loaded from all 28 production JSON files; global uniqueness.','Every category/status/priority and source/dependency reference is valid.','Exact category and status counters recomputed from every record.','Every generated runtime ID, work, name, category, status and catalogue digest agrees with current JSON.','Every input byte hash rechecked after enumeration.'],
  limits:['Actual current catalogue/registry verification, with no status editing or workbook generation.','Counts measure tracked records, not completed missions, original-game likeness or artistic fidelity.','Native workbook/counter verification and product browser journeys remain separate evidence.']};
await fs.writeFile(path.resolve(ROOT,output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,records:entries.length,catalogues:catalogues.length,uniqueIds:ids.size,mainCategories:categories.length,runtimeExact:true,output}));

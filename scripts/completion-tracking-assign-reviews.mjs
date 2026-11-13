// Partition existing renders. This does not open any image or create a review.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,readJson,fresh,sha} from './completion-tracking-common.mjs';
const option=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
const scopePath=option('--scope'),renderPath=option('--render-report'),output=option('--output');assert.ok(scopePath&&renderPath&&output);
await fresh(path.resolve(ROOT,output));const scope=await readJson(scopePath),render=await readJson(renderPath);assert.equal(render.data.passed,true);
assert.equal(sha(await fs.readFile(render.data.sourceWorkbook)),render.data.sourceWorkbookSha256);
const agents={controls:'/root/priority_controls',persistence:'/root/priority_bosses',combat:'/root/gameplay_audit',narrative:'/root/priority_objectives',chronicles:'/root/priority_talents',world:'/root',tracking:'/root/priority_audit'};
const groups=Object.fromEntries(Object.entries(agents).map(([key,agent])=>[key,{agent,output:`docs/qa/completion-tracking-workbook-review-${key}.json`,images:[],pixels:0}]));
const owner=id=>{
 const sources=scope.data.proposalsById[id]||[];assert.equal(sources.length,1,`Resolve owner overlap before assignments: ${id}`);
 const match=path.basename(sources[0]).match(/^completion-(controls|persistence|combat|narrative|chronicles|world|catalogue)-tracking\.json$/);assert.ok(match,id);
 return match[1]==='catalogue'?'tracking':match[1];
};
for(const [index,image] of render.data.images.entries()) {
 const raw=await fs.readFile(path.resolve(ROOT,image.path));assert.equal(sha(raw),image.sha256);
 assert.equal(raw.subarray(1,4).toString(),'PNG');const pixels=raw.readUInt32BE(16)*raw.readUInt32BE(20);
 const votes={};for(const id of image.ids||[]){const key=owner(id);votes[key]=(votes[key]||0)+1;}
 let key='tracking';
 if(Object.keys(votes).length)key=Object.keys(votes).sort((a,b)=>votes[b]-votes[a]||groups[a].pixels-groups[b].pixels||a.localeCompare(b))[0];
 groups[key].images.push({...image,index,width:raw.readUInt32BE(16),height:raw.readUInt32BE(20)});groups[key].pixels+=pixels;
}
assert.equal(Object.values(groups).reduce((sum,group)=>sum+group.images.length,0),render.data.images.length);
const assignment={passed:true,assignmentOnly:true,publicationAllowed:false,generatedAt:new Date().toISOString(),
 sourceWorkbookSha256:render.data.sourceWorkbookSha256,renderReport:render.path,renderReportSha256:render.sha256,
 scopeProof:{path:scope.path,sha256:scope.sha256},groups,
 instructions:'Every assigned PNG must be actually opened and inspected. Record actual observations, exact image hashes, sourceWorkbookSha256, renderReportSha256, reviewComplete and blockingFindings. This assignment itself is not an opening attestation.'};
await fs.writeFile(path.resolve(ROOT,output),JSON.stringify(assignment,null,2)+'\n');
console.log(JSON.stringify({passed:true,assignmentOnly:true,panels:render.data.images.length,groups:Object.fromEntries(Object.entries(groups).map(([key,value])=>[key,value.images.length])),output}));

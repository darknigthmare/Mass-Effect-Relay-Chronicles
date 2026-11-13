import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { featureSourceFiles, filesBelow, sourceHashes, sha } from './resolve-evidence.mjs';
const baseCommit='f94bd6b7fbb36a4cd83b7672e7eb294b4830735f';
const prefix=process.env.RESOLVE_INTEGRATION_PREFIX||'resolve-integration-final-01';
assert.match(prefix,/^resolve-integration-[a-z0-9-]+$/);
const reportPath=`docs/qa/${prefix}-report.json`,outputPath=`docs/qa/${prefix}.tap`,bundlePath=`docs/qa/${prefix}-changes.json`;
for(const path of [reportPath,outputPath,bundlePath])try{await access(path);throw Error(`Preserve existing ${path}`);}catch(error){if(error.code!=='ENOENT')throw error;}
const tests=(await filesBelow('tests/')).filter(path=>/^tests\/[^/]+\.test\.js$/.test(path));
const files=await featureSourceFiles([...(await filesBelow('tests/')),'scripts/resolve-integration.mjs','scripts/resolve-evidence.mjs','scripts/completion-combat-geometry.mjs']);
const before=await sourceHashes(files);
const baselineFiles=new Set(execFileSync('git',['ls-tree','-r','--name-only',baseCommit],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n'));
const changed=new Set(execFileSync('git',['diff','--name-only',baseCommit],{encoding:'utf8'}).trim().split('\n'));
const replacements={};for(const path of files)if(changed.has(path)||!baselineFiles.has(path))replacements[path]=await readFile(path,'utf8');
const bundle=JSON.stringify({baseCommit,scope:'Unchanged files resolve from this Git baseline; these UTF-8 replacements reconstruct the exact executed feature/test graph. Generated registry is separately checked after tracking.',replacements},null,2)+'\n';
await writeFile(bundlePath,bundle);
const report={passed:false,at:new Date().toISOString(),baseCommit,sourceHashes:before,sourceBundle:{path:bundlePath,sha256:sha(bundle)},command:['node','--test',...tests],scope:'One full native suite on frozen executable sources. No screenshot, physical controller, hardware FPS or Windows gameplay claim.'};
let output,exitCode=0;try{output=execFileSync(process.execPath,['--test',...tests],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:180000});}catch(error){exitCode=error.status??1;output=(error.stdout||'')+(error.stderr||'');}
await writeFile(outputPath,output);report.output={path:outputPath,sha256:sha(output),exitCode};
report.unit=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(key=>[key,Number(output.match(new RegExp(`(?:#|ℹ) ${key} (\\d+)`))?.[1])]));
try{assert.equal(exitCode,0);assert.ok(report.unit.pass>=1177);for(const key of ['fail','cancelled','skipped','todo'])assert.equal(report.unit[key],0);assert.deepEqual(await sourceHashes(files),before);report.sourceFrozen=true;report.passed=true;}catch(error){report.failure=error.stack;process.exitCode=1;}
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,...report.unit,report:reportPath,failure:report.failure}));

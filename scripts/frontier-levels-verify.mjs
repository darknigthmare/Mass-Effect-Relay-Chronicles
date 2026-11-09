import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const paths=['src/world.js','src/world-data.js','src/level-layout-data.js','src/frontier-layout-data.js','src/frontier-scene.js','src/world-navigation.js','src/frontier-enemies.js','src/frontier-characters.js','src/frontier-vehicles.js','src/boss-animation-data.js','tests/frontier-levels.test.js','tests/story-world.test.js','tests/level-renderer.test.js','scripts/frontier-levels-verify.mjs'];
const digest=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
const hashes=Object.fromEntries(paths.map(path=>[path,digest(path)]));
const args=['--test','tests/frontier-levels.test.js','tests/story-world.test.js','tests/level-renderer.test.js'];
const result=spawnSync(process.execPath,args,{cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:8*1024*1024});
const report={passed:result.status===0,at:new Date().toISOString(),command:'node '+args.join(' '),node:process.version,sourceHashes:hashes,
 scope:'Native Three geometry and renderer methods with actual scenery colliders, A* navigation, old-position recovery, party formation, projection, local battle arenas, static crop refusal and the transient Mako controller. Headless Node fixture stubs DOM labels and canvas textures; browser proof is separate. No surveyed geography, complete original mission, exact proportions or full vehicle physics claim.',
 nativeAssertions:{zones:['therum','noveria','virmire'],sectorsPerZone:5,stableMissionPOIsPerZone:7,arenasPerZone:3,optionalPathsPerZone:2,routeSamplingStep:.15,makoFootprintSamplingStep:.18,additionalNoveriaConversationRoutes:4,makoRouteStartsAtAuthoredSpawn:true,oldPositionsRecovered:true,edenRegressionIncluded:true},
 status:result.status,signal:result.signal,output:result.stdout,stderr:result.stderr};
try{for(const[path,hash]of Object.entries(hashes))assert.equal(digest(path),hash,path);}catch(error){report.passed=false;report.failure=error.message;}
writeFileSync(new URL('../docs/qa/frontier-levels-native-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,status:result.status,report:'docs/qa/frontier-levels-native-report.json'}));
if(!report.passed)process.exitCode=1;

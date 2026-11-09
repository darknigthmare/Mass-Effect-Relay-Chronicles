import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,GLOBAL_PROOF,sha} from './frontier-workbook-data.mjs';
import {readAssets} from './frontier-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const output=option('--output');assert.ok(output,'Provide separate --output candidate path.');
const baseline=JSON.parse(await fs.readFile(path.join(root,'docs/qa/frontier-workbook-baseline.json')));assert.equal(baseline.baselineCommit,BASE_COMMIT);
const originalBytes=await fs.readFile(path.join(root,'public/assets/manifest.json'));assert.equal(sha(originalBytes),baseline.sourceHashes['public/assets/manifest.json']);
const previous=JSON.parse(originalBytes),manifest=structuredClone(previous),assets=await readAssets(root);
assert.equal(previous.assets.length,29);assert.equal(previous.combatKeyPoses,68);
for(const [filename,digest]of Object.entries(baseline.publicPNGHashes))assert.equal(sha(await fs.readFile(path.join(root,filename))),digest,filename);
for(const asset of assets.families){
  assert.ok(!manifest.assets.some(item=>item.file===asset.png));
  manifest.assets.push({file:asset.png,width:asset.width,height:asset.height,mode:'RGBA',sha256:asset.sha256,
    assetStatus:'Prototype',fidelity:'Non validée 1:1',mediaId:'ME1',periodId:'me1',partial:true,primaryVisualVerified:false,
    origin:'PNG généré natif, copie byte à byte sans retouche de pixels ; apparence primaire complète non certifiée.',
    configuration:asset.configPath,regions:asset.regions,usage:asset.usage,...(asset.staticSubjects?{staticSubjectCount:asset.staticSubjects}:{}),
    ...(asset.combatPoses?{combatKeyPoses:asset.combatPoses}:{}),...(asset.directionalDrawings?{directionalDrawings:asset.directionalDrawings}:{}),
    evidence:[asset.artPath,'docs/qa/frontier-visual-review.json',GLOBAL_PROOF]});
}
manifest.date=new Date().toISOString().slice(0,10);manifest.bossCombatKeyPoses=assets.families.reduce((n,item)=>n+(item.combatPoses||0),0);
manifest.combatKeyPoses=previous.combatKeyPoses+manifest.bossCombatKeyPoses;
manifest.frontierNPCBodies=assets.families.find(item=>item.key==='npcs').staticSubjects;
manifest.frontierEnemyBodies=assets.families.find(item=>item.key==='enemies').staticSubjects;
manifest.frontierStaticSubjectCount=manifest.frontierNPCBodies+manifest.frontierEnemyBodies;
manifest.makoDirectionalDrawings=assets.families.find(item=>item.key==='mako').directionalDrawings;
assert.deepEqual(manifest.assets.slice(0,previous.assets.length),previous.assets);
for(const key of ['version','coordinates','subjects','walkFrames','keyArtImages','enemyCombatKeyPoses','companionCombatKeyPoses','seatedKeyPoses','terrainTextureCount'])assert.deepEqual(manifest[key],previous[key]);
const publicPNG=(await fs.readdir(path.join(root,'public/assets'))).filter(name=>name.endsWith('.png'));
assert.equal(publicPNG.length,baseline.publicPNGCount+assets.families.length);assert.equal(manifest.assets.length,36);assert.equal(manifest.combatKeyPoses,84);
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await fs.mkdir(path.dirname(path.resolve(output)),{recursive:true});await fs.writeFile(output,bytes);
const report={passed:true,at:new Date().toISOString(),baselineCommit:BASE_COMMIT,source:{path:'public/assets/manifest.json',sha256:sha(originalBytes)},
 candidate:{path:path.resolve(output),sha256:sha(bytes)},previousCoreAssets:previous.assets.length,currentCoreAssets:manifest.assets.length,
 preservedPublicPNG:baseline.publicPNGCount,currentPublicPNG:publicPNG.length,newPNG:assets.families.length,combatKeyPoses:manifest.combatKeyPoses,
 bossCombatKeyPoses:manifest.bossCombatKeyPoses,frontierStaticSubjectCount:manifest.frontierStaticSubjectCount,makoDirectionalDrawings:manifest.makoDirectionalDrawings,
 assetSourceHashes:assets.sourceHashes,scope:'Append only seven native asset declarations. Preserve all29previous entries and34historicalPNG. Fifteen new static bodies and four Mako views are distinct from16new boss combat drawings; no original1:1 certification.'};
await fs.writeFile(path.join(root,'docs/qa/frontier-manifest-update.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,core:manifest.assets.length,newPNG:assets.families.length,publicPNG:publicPNG.length,combatKeyPoses:manifest.combatKeyPoses}));

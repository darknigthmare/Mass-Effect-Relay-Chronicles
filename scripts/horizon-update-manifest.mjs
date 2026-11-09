import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,GLOBAL_PROOF,sha} from './horizon-workbook-data.mjs';
import {readAssets} from './horizon-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const index=process.argv.indexOf('--output');assert.ok(index>=0&&process.argv[index+1],'Provide a separate --output manifest candidate.');
const output=path.resolve(process.argv[index+1]);
const baseline=JSON.parse(await fs.readFile(path.join(root,'docs/qa/horizon-workbook-baseline.json')));assert.equal(baseline.baselineCommit,BASE_COMMIT);
const original=await fs.readFile(path.join(root,'public/assets/manifest.json'));assert.equal(sha(original),baseline.sourceHashes['public/assets/manifest.json']);
const previous=JSON.parse(original),manifest=structuredClone(previous),assets=await readAssets(root);
assert.equal(previous.assets.length,36);assert.equal(previous.combatKeyPoses,84);
for(const[name,expected]of Object.entries(baseline.publicPNGHashes))assert.equal(sha(await fs.readFile(path.join(root,name))),expected,name);
for(const asset of assets.families){
  assert.ok(!manifest.assets.some(item=>item.file===asset.png));
  manifest.assets.push({file:asset.png,width:asset.width,height:asset.height,mode:'RGBA',sha256:asset.sha256,
    assetStatus:'Prototype',fidelity:'Non validée 1:1',partial:true,primaryVisualVerified:false,contexts:asset.contexts,
    origin:'PNG généré natif, copie exacte sans retouche de pixels ; apparence primaire complète non certifiée.',
    configuration:asset.configPath,usage:asset.usage,staticSubjectCount:asset.subjects,
    evidence:[asset.artPath,'docs/qa/horizon-visual-review.json',GLOBAL_PROOF]});
}
manifest.date=new Date().toISOString().slice(0,10);
Object.assign(manifest,{horizonStaticDrawingCount:29,horizonNPCBodies:8,horizonEnemyBodies:5,horizonFleetDrawings:8,horizonFaunaDrawings:8,
  horizonWorldFaunaBodies:3,horizonDocumentaryFaunaBodies:5});
assert.deepEqual(manifest.assets.slice(0,36),previous.assets);
for(const[key,value]of Object.entries(previous))if(!['assets','date'].includes(key))assert.deepEqual(manifest[key],value,key);
const pngs=(await fs.readdir(path.join(root,'public/assets'))).filter(name=>name.endsWith('.png'));
assert.equal(pngs.length,46);assert.equal(manifest.assets.length,41);assert.equal(manifest.combatKeyPoses,84);
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,bytes);
const report={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,
  source:{path:'public/assets/manifest.json',sha256:sha(original)},candidate:{path:output,sha256:sha(bytes)},
  previousCoreAssets:36,currentCoreAssets:41,previousPNG:41,currentPNG:46,newPNG:5,newFixedDrawings:29,combatKeyPoses:84,
  assetSourceHashes:assets.sourceHashes,scope:'Append five native atlas declarations. Preserve all36old core entries and41historical PNG. The29new drawings are fixed bodies/hulls, not additional combat pose families or complete kits.'};
await fs.writeFile(path.join(root,'docs/qa/horizon-manifest-update.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,newPNG:5,png:46,core:41,fixedDrawings:29,combatPoses:84}));

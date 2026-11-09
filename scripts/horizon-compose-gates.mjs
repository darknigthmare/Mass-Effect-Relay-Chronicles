// Aggregate executed reports and actual opened-image attestations. No new
// browser execution, image opening or visual observation is claimed here.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,sha} from './horizon-workbook-data.mjs';
import {readAssets} from './horizon-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),inputs=[],reviews=[];
for(let i=0;i<args.length;i+=2){
  assert.ok(args[i+1],`Missing value for ${args[i]}`);
  if(args[i]==='--report'){
    const split=args[i+1].indexOf('=');assert.ok(split>0,'Use --report KIND=FILE.');inputs.push({kind:args[i+1].slice(0,split),file:args[i+1].slice(split+1)});
  }else if(args[i]==='--review')reviews.push(args[i+1]);
  else throw Error(`Unknown option: ${args[i]}`);
}
assert.ok(inputs.length>=4&&reviews.length>=1,'Provide current family reports and their actual visual review records.');
assert.equal(new Set(inputs.map(item=>item.kind)).size,inputs.length);
const relative=filename=>{const resolved=path.resolve(root,filename);assert.ok(resolved.startsWith(root+path.sep));return path.relative(root,resolved);};
const read=async filename=>{const name=relative(filename),raw=await fs.readFile(path.join(root,name));return {path:name,sha256:sha(raw),raw,json:JSON.parse(raw)};};
const sourceHashes={},captured=new Map(),inputReports=[];
for(const input of inputs){
  const item=await read(input.file),report=item.json;assert.equal(report.passed,true,item.path);
  for(const field of ['errors','failedRequests','evidenceErrors','functionalConsoleErrors','javascriptErrors','failedGameRequests'])if(Array.isArray(report[field]))assert.deepEqual(report[field],[],`${item.path}.${field}`);
  const iconWarnings=[];
  for(const error of report.consoleErrors||[]){
    const url=new URL(error.location?.url),origin=new URL(report.url).origin;
    assert.ok(url.origin===origin&&url.pathname==='/favicon.ico'&&!url.search
      &&error.text==='Failed to load resource: the server responded with a status of 404 (Not Found)',`${item.path}: unexpected console error`);
    iconWarnings.push({...error,classification:'Exact same-origin missing browser icon; no JavaScript or game-asset error.'});
  }
  const sources=report.sourceHashes||report.sources||{};assert.ok(!Array.isArray(sources));
  for(const[filename,expected]of Object.entries(sources)){
    assert.match(expected,/^[a-f0-9]{64}$/);assert.equal(sha(await fs.readFile(path.join(root,relative(filename)))),expected,`Stale ${input.kind}: ${filename}`);
    if(Object.hasOwn(sourceHashes,filename))assert.equal(sourceHashes[filename],expected);sourceHashes[filename]=expected;
  }
  const captures=report.captureArtifacts||report.captures||report.screenshots||[];assert.ok(Array.isArray(captures)&&captures.length>0,`${item.path} has no actual capture`);
  for(const capture of captures){
    const filename=relative(capture.path);assert.match(capture.sha256,/^[a-f0-9]{64}$/);
    assert.equal(sha(await fs.readFile(path.join(root,filename))),capture.sha256,filename);
    const key=filename+'\0'+capture.sha256,existing=captured.get(key);
    captured.set(key,{...(existing||capture),path:filename,sha256:capture.sha256,kinds:[...new Set([...(existing?.kinds||[]),input.kind])],executionReports:[...new Set([...(existing?.executionReports||[]),item.path])]});
  }
  inputReports.push({kind:input.kind,path:item.path,sha256:item.sha256,captures:captures.length,scope:report.scope,
    ...(iconWarnings.length?{consoleWarnings:iconWarnings}:{}),...(report.rawReport?{rawReport:report.rawReport}:{}),
    ...(report.consoleWarnings?.length?{qualifiedConsoleWarnings:report.consoleWarnings}:{})});
}
const records=[],attestations=new Map();
for(const filename of reviews){
  const item=await read(filename),review=item.json;
  if(Object.hasOwn(review,'passed'))assert.equal(review.passed,true,item.path);
  if(Array.isArray(review.blockingFindings))assert.deepEqual(review.blockingFindings,[],item.path);
  const arrays=[review.images,review.captures,review.screenshots,review.imagesReviewed,review.actualVisualReview?.images].filter(Array.isArray);
  let opened=0;
  for(const image of arrays.flat()){
    if(image.actuallyOpened!==true&&!(review.actuallyOpened===true&&image.actuallyOpened!==false))continue;
    if(typeof image.path!=='string'||typeof image.sha256!=='string')continue;
    const name=relative(image.path);assert.equal(sha(await fs.readFile(path.join(root,name))),image.sha256,name);
    const key=name+'\0'+image.sha256;attestations.set(key,{path:name,sha256:image.sha256,actuallyOpened:true,
      reviewRecord:item.path,reviewRecordSHA256:item.sha256,observations:image.observations||image.review||review.observations||null});opened++;
  }
  assert.ok(opened>0,`${item.path} has no actually opened image attestation`);
  records.push({path:item.path,sha256:item.sha256,openedImages:opened});
}
const images=[];
for(const[key,capture]of captured){const attestation=attestations.get(key);assert.ok(attestation,`Capture lacks actual opened review: ${capture.path}`);images.push({...capture,...attestation});}
const assets=await readAssets(root);
for(const[filename,expected]of Object.entries(assets.sourceHashes))if(filename.startsWith('src/')||filename.startsWith('public/')||filename==='vite.config.js')assert.equal(sourceHashes[filename],expected,`No current DEV source hash: ${filename}`);
assert.ok(sourceHashes['src/world.js']);sourceHashes['scripts/horizon-compose-gates.mjs']=sha(await fs.readFile(new URL(import.meta.url)));
const base={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,aggregationOnly:true,sourceHashes,inputReports,reviewRecords:records,
  scope:'Current source-bound development family reports and their actually opened capture attestations. This aggregation does not certify original-game likeness or replay the preceding story fixtures.',
  limits:['Image opening and observations belong to the cited reviewers; no new opening is claimed by this composer.','All source hashes are current; no stale or relabelled world source is accepted.','Production must be verified after catalogue/runtime/build synchronization.']};
const development={...base,captureArtifacts:[...captured.values()]};
const visual={...base,reviewComplete:true,blockingFindings:[],images,actuallyOpenedImages:images.length,
  result:'Every captured current family view has a matching actually opened SHA-bound review. Canonical likeness, full mechanics and geography remain explicitly partial.'};
await fs.writeFile(path.join(root,'docs/qa/horizon-development-report.json'),JSON.stringify(development,null,2)+'\n');
await fs.writeFile(path.join(root,'docs/qa/horizon-visual-review.json'),JSON.stringify(visual,null,2)+'\n');
console.log(JSON.stringify({passed:true,reports:inputs.length,openedCaptures:images.length,sourceHashes:Object.keys(sourceHashes).length}));

// Aggregate existing, hash-bound execution and actually-opened review records.
// This script never opens an image or fabricates a manual visual attestation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,sha} from './frontier-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const index=process.argv.indexOf('--inputs');assert.ok(index>=0&&process.argv[index+1],'Provide --inputs FILE.');
const inputsPath=path.resolve(process.argv[index+1]),plan=JSON.parse(await fs.readFile(inputsPath));
const read=name=>fs.readFile(path.resolve(root,name));
const load=async name=>{const raw=await read(name);return{path:name,sha256:sha(raw),report:JSON.parse(raw)};};
const valueAt=(object,key)=>key.split('.').reduce((value,part)=>value?.[part],object);
const sourcePairs=report=>{const sources=report.sourceHashes||report.sources||{};return Array.isArray(sources)?sources.map(item=>[item.path,item.sha256]):Object.entries(sources);};
const captures=report=>report.captureArtifacts||report.screenshots||report.captures||[];
const allObjects=value=>{if(!value||typeof value!=='object')return[];return[value,...Object.values(value).flatMap(allObjects)];};
const currentWorld=sha(await read('src/world.js'));
let qualification=null;
if(plan.worldQualification){
  const audit=await load(plan.worldQualification),snapshot=await load('docs/qa/frontier-before-ilos-source.json');assert.equal(audit.report.passed,true);
  for(const[name,digest]of sourcePairs(audit.report))assert.equal(sha(await read(name)),digest,`Stale delta audit: ${name}`);
  const oldRaw=await read(snapshot.report.snapshot),newRaw=await read('src/world.js');assert.equal(sha(oldRaw),snapshot.report.sha256);
  const split=raw=>{const text=raw.toString('utf8'),a=text.indexOf('\n  _ilos() {'),b=text.indexOf('\n  _mergeStatic() {',a);assert.ok(a>=0&&b>a,'Expected bounded _ilos method.');return{text,a,b,outside:text.slice(0,a)+text.slice(b),method:text.slice(a,b)};};
  const before=split(oldRaw),after=split(newRaw);assert.equal(before.outside,after.outside,'Qualification cannot cover any change outside _ilos().');
  const replacement=audit.report.permittedReplacement;assert.ok(replacement?.before&&replacement?.after);
  assert.equal(before.text.split(replacement.before).length,2,'Exactly one approved bridge statement must exist.');
  assert.equal(before.text.replace(replacement.before,replacement.after),after.text,'The entire file must equal the approved visibility-only replacement.');
  assert.ok(JSON.stringify(audit.report).includes(snapshot.report.sha256)&&JSON.stringify(audit.report).includes(currentWorld),'Delta audit must bind both exact world hashes.');
  assert.equal(audit.report.outsideIlosUnchanged,true);assert.equal(audit.report.geometryAndCollisionsUnchanged,true);
  qualification={audit:{path:audit.path,sha256:audit.sha256},snapshot:{path:snapshot.report.snapshot,sha256:snapshot.report.sha256},
    current:{path:'src/world.js',sha256:currentWorld},outsideIlosUnchanged:true,geometryAndCollisionsUnchanged:true,
    scope:'Original report hashes are retained. Only a documented Ilos visibility change is qualified; all other source files must match current bytes.'};
}
assert.equal(plan.reports.length,5,'Exactly five final DEV families are required.');
const reportItems=[];
for(const input of [...plan.reports,...(plan.supplements||[])]){
  const item=await load(input.path),report=item.report;
  if(report.passed!==true){
    assert.equal(input.allowWorldOnlyFinalAssertion,true,`${input.path} did not pass.`);assert.ok(qualification);
    assert.match(report.failure||'',/^AssertionError \[ERR_ASSERTION\]: Source changed during run:src\/world\.js\n/,'Only the isolated final world-source assertion can be qualified.');
    assert.ok(Array.isArray(report.checks)&&report.checks.length===7&&report.checks.every(check=>check.passed===true),'All seven public functional checks must have passed before that final assertion.');
  }
  for(const field of['errors','failedRequests','assetErrors','evidenceErrors'])if(Array.isArray(report[field]))assert.deepEqual(report[field],[],`${input.path}:${field}`);
  for(const requirement of input.require||[]){const actual=valueAt(report,requirement.field);if(Object.hasOwn(requirement,'length'))assert.equal(actual?.length,requirement.length,`${input.path}:${requirement.field}`);if(Object.hasOwn(requirement,'equals'))assert.deepEqual(actual,requirement.equals,`${input.path}:${requirement.field}`);}
  const pairs=sourcePairs(report);assert.ok(pairs.length,`${input.path} must bind executed sources.`);assert.ok(Object.fromEntries(pairs)['src/world.js'],`${input.path} must bind its executed world.`);
  const qualifiedSources=[];
  for(const[name,expected]of pairs){assert.match(expected,/^[a-f0-9]{64}$/);const actual=sha(await read(name));
    if(expected!==actual){assert.notEqual(input.requireCurrentWorld,true,`${input.path} requires a fresh current-world run.`);assert.equal(name,'src/world.js',`Unqualified stale source: ${input.path}:${name}`);assert.ok(qualification);assert.equal(expected,qualification.snapshot.sha256);assert.equal(actual,qualification.current.sha256);qualifiedSources.push({path:name,executedSha256:expected,currentSha256:actual,qualification:qualification.audit});}
  }
  for(const capture of captures(report)){assert.ok(typeof capture.path==='string');assert.match(capture.sha256,/^[a-f0-9]{64}$/);assert.equal(sha(await read(capture.path)),capture.sha256,`${input.path}: stale capture ${capture.path}`);}
  reportItems.push({...item,name:input.name,qualifiedSources,input,qualificationReason:report.passed===true?null:'All seven public functional checks passed; only the final world-source assertion failed on the exact audited Ilos-only delta. Raw failure is retained.'});
}
const reviewItems=await Promise.all([...new Set([...(plan.reviewFiles||[]),plan.rootReview])].map(load));
const rootReview=reviewItems.find(item=>item.path===plan.rootReview);assert.equal(rootReview.report.reviewComplete,true);assert.deepEqual(rootReview.report.blockingFindings,[]);
for(const review of reviewItems)for(const[name,expected]of sourcePairs(review.report)){
  const actual=sha(await read(name));if(expected!==actual){assert.equal(name,'src/world.js',`Stale review source: ${review.path}:${name}`);assert.ok(qualification);assert.equal(expected,qualification.snapshot.sha256);assert.equal(actual,qualification.current.sha256);}
}
const replacementMap=new Map();
for(const replacement of plan.captureReplacements||[]){
  const original=reportItems.find(item=>item.path===replacement.originalReport),supplement=reportItems.find(item=>item.path===replacement.supplementReport);
  assert.ok(original&&supplement);assert.ok(original.qualifiedSources.length,'Only the documented source-qualified case can replace a capture.');assert.equal(supplement.report.passed,true);
  const before=captures(original.report).find(item=>item.path===replacement.originalPath),after=captures(supplement.report).find(item=>item.path===replacement.replacementPath);assert.ok(before&&after);
  assert.equal(Object.fromEntries(sourcePairs(supplement.report))['src/world.js'],currentWorld,'Replacement must execute current world.');
  replacementMap.set(before.path,{...replacement,originalSha256:before.sha256,replacementSha256:after.sha256});
}
for(const review of reviewItems){
  const blockers=[...(review.report.blockingFindings||[]),...(review.report.blockingIssues||[])];
  if(review.report.passed===false||blockers.length){const resolution=(plan.resolvedReviews||[]).find(item=>item.path===review.path);assert.ok(resolution,`Unresolved review: ${review.path}`);assert.ok(reportItems.find(item=>item.path===resolution.resolvedBy&&item.report.passed===true));assert.ok([...replacementMap.values()].some(item=>item.supplementReport===resolution.resolvedBy));}
}
const opened=[];
for(const review of reviewItems)for(const item of allObjects(review.report))if(item.actuallyOpened===true&&typeof item.path==='string'&&typeof item.sha256==='string'&&item.bodyVisibilityAccepted!==false&&item.accepted!==false){
  assert.equal(sha(await read(item.path)),item.sha256,`Stale review image: ${review.path}:${item.path}`);opened.push({...item,reviewOrigin:{path:review.path,sha256:review.sha256}});
}
// Some execution reports receive a post-run manual capture annotation. Treat
// that as its own review record only when the image entry explicitly says so.
for(const item of reportItems)for(const capture of captures(item.report))if(capture.actuallyOpened===true&&capture.bodyVisibilityAccepted!==false&&capture.accepted!==false)opened.push({...capture,reviewOrigin:{path:item.path,sha256:item.sha256}});
const selected=new Map();
for(const item of reportItems)for(const capture of captures(item.report)){
  if(replacementMap.has(capture.path))continue;
  const found=opened.filter(view=>view.path===capture.path&&view.sha256===capture.sha256);assert.ok(found.length,`No actual opened review: ${capture.path}`);
  const previous=selected.get(capture.path);if(previous)assert.equal(previous.sha256,capture.sha256);
  selected.set(capture.path,{...capture,actuallyOpened:true,reviewOrigins:found.map(view=>view.reviewOrigin),sourceReports:[...(previous?.sourceReports||[]),item.path]});
}
assert.ok(selected.size,'No final capture evidence.');
const sourceHashes={};
for(const item of reportItems)for(const[name]of sourcePairs(item.report)){const digest=sha(await read(name));if(sourceHashes[name])assert.equal(sourceHashes[name],digest);sourceHashes[name]=digest;}
sourceHashes['src/world.js']=currentWorld;
const inputReports=reportItems.map(item=>({name:item.name,path:item.path,sha256:item.sha256,originalPassed:item.report.passed,
  functionalPassed:item.report.functionalPassed??null,scope:item.report.scope||item.report.mode||null,qualificationReason:item.qualificationReason,qualifiedSources:item.qualifiedSources,captureCount:captures(item.report).length}));
const provenance={inputs:{path:path.relative(root,inputsPath),sha256:sha(await fs.readFile(inputsPath))},inputReports,
 reviewRecords:reviewItems.map(item=>({path:item.path,sha256:item.sha256,originalPassed:item.report.passed??null})),worldQualification:qualification,
 captureReplacements:[...replacementMap.values()],resolvedReviews:plan.resolvedReviews||[]};
const common={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,aggregationOnly:true,sourceHashes,
  scope:'Aggregate of five current or narrowly source-qualified DEV families and their actual opened image reviews. Native fixtures, held boss poses, detached sector views and ordinary public interactions retain their original scopes. No full-campaign or original1:1 certification.',
  ...provenance,limits:['No image was newly opened by this aggregation. Every selected capture binds its unchanged bytes to an existing explicit actuallyOpened:true review.',
    'Original report pass/fail fields and executed hashes remain unchanged. Any Ilos qualification is explicit and backed by exact snapshot/outside-method comparison plus a current Ilos supplement.']};
const development={...common,captureArtifacts:[...selected.values()]};
const visual={...common,reviewComplete:true,blockingFindings:[],images:[...selected.values()],actuallyOpenedImages:selected.size,
  result:'All selected final capture bytes have actual opened review evidence; the documented old Ilos occlusion capture is retained historically and replaced by its explicitly reviewed current supplement when present.'};
// Both objects have been fully validated before either output is emitted.
await fs.writeFile(path.join(root,'docs/qa/frontier-development-report.json'),JSON.stringify(development,null,2)+'\n');
await fs.writeFile(path.join(root,'docs/qa/frontier-visual-review.json'),JSON.stringify(visual,null,2)+'\n');
console.log(JSON.stringify({passed:true,reports:reportItems.length,captures:selected.size,qualifiedReports:inputReports.filter(item=>item.qualifiedSources.length).length,replacedCaptures:replacementMap.size}));

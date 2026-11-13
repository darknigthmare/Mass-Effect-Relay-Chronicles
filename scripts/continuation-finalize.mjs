// Compose actual executions and opened-image reviews; no test is run here.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CONTINUATION_BASE_COMMIT, projectRoot, featureSourceFiles, filesBelow, sourceHashes, sha } from './continuation-evidence.mjs';
import { UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
const configPath = process.argv[2];assert.ok(configPath, 'Pass the explicit final proof configuration.');
const read = path => readFile(new URL(path, projectRoot));
const configBytes = await read(configPath), config = JSON.parse(configBytes);
assert.equal(config.baseCommit, CONTINUATION_BASE_COMMIT);
const output = config.output || 'docs/qa/continuation-report.json';
try { await access(new URL(output,projectRoot));throw Error('Preserve an already composed final report.'); } catch(error) { if(error.code!=='ENOENT')throw error; }
const reports={},proofs={};
for(const key of ['native','development','developmentReview','workbook','validation','build','http','production','productionReview','currentAudit']){
  const path=config[key];assert.equal(typeof path,'string',key);const bytes=await read(path),report=JSON.parse(bytes);
  assert.equal(report.passed,true,path);assert.notEqual(report.selfcheckOnly,true,path);assert.notEqual(report.publicationAllowed,false,path);
  assert.notEqual(report.currentProductGate,false,path);assert.notEqual(report.historicalExecution,true,path);
  for(const[filename,expected]of Object.entries(report.sourceHashes||report.featureSourceHashes||{}))assert.equal(sha(await read(filename)),expected,`${path}: ${filename}`);
  reports[key]=report;proofs[key]={path,sha256:sha(bytes)};
}
const preservedPath=config.preservation,preservedRaw=await read(preservedPath),preservation=JSON.parse(preservedRaw);
assert.equal(preservation.passed,true);proofs.preservation={path:preservedPath,sha256:sha(preservedRaw)};
const baselineBytes=await read(preservation.baselineProof.path);assert.equal(sha(baselineBytes),preservation.baselineProof.sha256);
const preservationBase=JSON.parse(baselineBytes);assert.equal(preservationBase.baseCommit,CONTINUATION_BASE_COMMIT);
const principalTargets=['docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx'];
for(const [filename,expected]of Object.entries({...preservationBase.publicInputHashes,...preservationBase.historicalHashes})){
  if(!principalTargets.includes(filename))assert.equal(sha(await read(filename)),expected,filename);
}
for(const [filename,expected]of Object.entries(preservationBase.sourceHashes))if(filename.startsWith('scripts/completion-'))assert.equal(sha(await read(filename)),expected,filename);
for(const [filename,expected]of Object.entries(preservation.sourceHashes))assert.equal(sha(await read(filename)),expected,filename);
assert.equal(sha(await read(preservation.sourceTool.path)),preservation.sourceTool.sha256);
const cwd=fileURLToPath(projectRoot),allowedExisting=new Set([...principalTargets,'src/main.js','src/world.js','src/story.js','src/chronicles.js','src/combat.js','src/completion-chronicles-powers.js','src/universe-ui.js','src/universe-data.js',
  'README.md','docs/ASSETS.md','docs/CATALOGUE.md','docs/DESIGN.md','docs/FIDELITY.md','docs/IMPLEMENTATION_STATUS.md','docs/PRIORITIES.md']);
const basePaths=new Set(execFileSync('git',['ls-tree','-r','--name-only',CONTINUATION_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n'));
const newPathAllowed=filename=>['docs/CONTINUATION.md','docs/continuation-tracking.md'].includes(filename)||['docs/qa/continuation-','docs/screenshots/continuation-','docs/workbook-previews/continuation-','docs/research/continuation-','scripts/continuation-','src/continuation-','tests/continuation-'].some(prefix=>filename.startsWith(prefix));
const changedPaths=execFileSync('git',['diff','--name-only',CONTINUATION_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n');
const newPaths=execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n');
for(const filename of new Set([...changedPaths,...newPaths].filter(Boolean)))assert.ok(basePaths.has(filename)?allowedExisting.has(filename):newPathAllowed(filename),`Unexpected task change: ${filename}`);
assert.ok(reports.native.unit.pass>=1106);assert.equal(reports.native.unit.fail,0);
for(const key of ['cancelled','skipped','todo'])assert.equal(reports.native.unit[key],0);
assert.equal(reports.native.output.exitCode,0);assert.equal(sha(await read(reports.native.output.path)),reports.native.output.sha256);
const nativeBundle=await read(reports.native.sourceBundle.path);assert.equal(sha(nativeBundle),reports.native.sourceBundle.sha256);
const bundled=JSON.parse(nativeBundle);assert.equal(bundled.baseCommit,CONTINUATION_BASE_COMMIT);
for(const [filename,content]of Object.entries(bundled.replacements))assert.equal(sha(content),reports.native.sourceHashes[filename],filename);
for(const command of reports.validation.commands){assert.equal(command.exitCode,0);assert.equal(sha(await read(command.output)),command.sha256);if(command.detailedReport)assert.equal(sha(await read(command.detailedReport.path)),command.detailedReport.sha256);}
for(const proof of [...Object.values(reports.workbook.proofs),...reports.workbook.integrationProofs])assert.equal(sha(await read(proof.path)),proof.sha256,proof.path);
const expectedKinds=['catalogue','customization','dialogues','banter','chronicles','world'].sort();
for(const stage of ['development','production']){
  const aggregate=reports[stage],review=reports[`${stage}Review`];assert.equal(aggregate.stage,stage);
  assert.deepEqual(aggregate.inputReports.map(report=>report.kind).sort(),expectedKinds,`Missing ${stage} family`);assert.deepEqual(review.blockingFindings,[]);
  const captureKeys=new Set();
  for(const family of aggregate.inputReports){
    const bytes=await read(family.path);assert.equal(sha(bytes),family.sha256);const run=JSON.parse(bytes);assert.equal(run.passed,true);
    // Retain each collector's declared mode instead of rewriting raw reports.
    const expectedMode=stage==='development'?({chronicles:'dev',world:'vite-development'}[family.kind]||stage):(family.kind==='world'?'vite-production-preview':stage);assert.equal(run.mode,expectedMode,family.path);
    for(const field of ['checks','talentChecks'])if(Array.isArray(run[field]))assert.ok(run[field].every(check=>check.passed===true),family.path);
    for(const field of ['errors','failedRequests','consoleErrors','evidenceErrors'])if(Array.isArray(run[field]))assert.deepEqual(run[field],[],`${family.path}.${field}`);
    for(const[filename,expected]of Object.entries(run.sourceHashes||run.sourcesBefore||{}))assert.equal(sha(await read(filename)),expected,filename);
    for(const artifact of [...(run.exports||[]),...(run.fixtures||[])])assert.equal(sha(await read(artifact.path)),artifact.sha256,artifact.path);
    for(const capture of run.captureArtifacts||run.captures||run.screenshots||[]){
      assert.equal(sha(await read(capture.path)),capture.sha256,capture.path);
      assert.ok(review.images.some(image=>image.path===capture.path&&image.sha256===capture.sha256&&image.actuallyOpened===true),capture.path);captureKeys.add(`${capture.path}\0${capture.sha256}`);
    }
    if(stage==='production'){assert.deepEqual(run.sourceRequests,[]);assert.equal(run.distFrozen,true);assert.deepEqual(run.distFiles,reports.build.distFiles);}
  }
  assert.equal(new Set(review.images.map(image=>`${image.path}\0${image.sha256}`)).size,review.images.length,`${stage}: duplicate review capture`);
  assert.deepEqual([...captureKeys].sort(),review.images.map(image=>`${image.path}\0${image.sha256}`).sort(),`${stage}: every capture must have one current review`);
  for(const item of aggregate.reviewRecords)assert.equal(sha(await read(item.path)),item.sha256,item.path);
}
const baseline=JSON.parse(execFileSync('git',['show',`${CONTINUATION_BASE_COMMIT}:docs/content-catalog.json`],{cwd:fileURLToPath(projectRoot),encoding:'utf8',maxBuffer:32*1024*1024}));
const catalogue=JSON.parse(await read('docs/content-catalog.json')),before=new Map(baseline.entries.map(record=>[record.id,record]));
assert.equal(catalogue.entries.length,1385);assert.equal(new Set(catalogue.entries.map(record=>record.id)).size,1385);
for(const record of catalogue.entries)assert.equal(record.acceptance,before.get(record.id)?.acceptance,`${record.id}: unchanged acceptance criterion`);
assert.equal(UNIVERSE_SUMMARY.recordCount,6711);assert.equal(UNIVERSE_SUMMARY.sourceCount,454);
const closed=catalogue.entries.filter(record=>record.status==='Validé'&&before.get(record.id).status!=='Validé');
assert.ok(closed.length>0);const closedByPriority={P0:0,P1:0,P2:0};
for(const record of closed){
  const review=reports.workbook.acceptanceReviews[record.id];assert.ok(review,record.id);assert.equal(review.complete,true);assert.equal(review.exactCriterion,record.acceptance);
  assert.ok(review.evidence.length&&review.coveredClauses.length);for(const path of review.evidence)await access(new URL(path,projectRoot));
  for(const id of record.dependencies)assert.equal(catalogue.entries.find(record=>record.id===id)?.status,'Validé',`${record.id}: ${id}`);
  closedByPriority[record.priority]++;
}
for(const record of baseline.entries.filter(record=>record.status==='Validé'))assert.deepEqual(catalogue.entries.find(current=>current.id===record.id),record);
for(const record of baseline.entries)assert.equal(catalogue.entries.find(current=>current.id===record.id)?.assetStatus,record.assetStatus,record.id);
assert.equal(reports.currentAudit.records,6711);assert.equal(reports.currentAudit.openRecords,6619-closed.length);
assert.equal(sha(await read(reports.currentAudit.ledger.path)),reports.currentAudit.ledger.sha256);
const statuses=records=>Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,records.filter(record=>record.status===status).length]));
// Priority belongs to production catalogues, not the compact runtime registry.
const manifest=JSON.parse(await read('docs/universe/manifest.json'));
const catalogues=[catalogue,...await Promise.all(manifest.workbooks.map(async work=>JSON.parse(await read(work.catalogPath))))];
const productionRecords=catalogues.flatMap(catalogue=>catalogue.entries),runtimeById=new Map(UNIVERSE_RECORDS.map(record=>[record.id,record]));
assert.equal(productionRecords.length,6711);assert.equal(new Set(productionRecords.map(record=>record.id)).size,6711);
for(const record of productionRecords){assert.ok(['P0','P1','P2'].includes(record.priority));assert.equal(runtimeById.get(record.id)?.status,record.status,record.id);}
for(const priority of ['P0','P1','P2'])assert.equal(reports.currentAudit.openByPriority[priority],productionRecords.filter(record=>record.priority===priority&&record.status!=='Validé').length);
assert.deepEqual(statuses(catalogue.entries),reports.workbook.afterStatuses);
assert.equal(reports.workbook.assetStatusPromotions,0);assert.equal(reports.build.pngCount,46);
assert.equal(reports.http.buildReport.sha256,proofs.build.sha256);
assert.deepEqual(reports.http.checks.map(item=>item.path).sort(),Object.keys(reports.build.distFiles).sort());
assert.deepEqual((await filesBelow('dist/')).map(filename=>filename.slice('dist/'.length)).sort(),Object.keys(reports.build.distFiles).sort());
for(const item of reports.http.checks){assert.equal(item.status,200);assert.equal(item.sha256,reports.build.distFiles[item.path].sha256);assert.equal(sha(await read(`dist/${item.path}`)),item.sha256);}
const docs=config.documentationPaths||[];for(const path of docs)assert.ok(path==='README.md'||path.startsWith('docs/'));
const finalSources=await sourceHashes(await featureSourceFiles([...docs,'src/universe-data.js','docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx',configPath,'scripts/continuation-finalize.mjs']));
const report={passed:true,at:new Date().toISOString(),baselineCommit:CONTINUATION_BASE_COMMIT,sourceHashes:finalSources,
  productionPending:false,localValidationComplete:true,commitPushAllowed:true,
  configuration:{path:configPath,sha256:sha(configBytes)},proofs,
  delivery:{newSignaturePowers:[],
    scope:'ME1 walkable stair heights and camera entry alignment, contextual squad exchanges, campaign dialogue branches, public catalogue and source credits, customization acceptance checks, and isolated ME2/ME3 Charge displacement in an abstract ATB arena.',
    main:{records:1385,changed:reports.workbook.changedIds.length,statuses:statuses(catalogue.entries)},
    universe:{records:6711,sources:454,statuses:statuses(UNIVERSE_RECORDS)},closedCriteria:closed.length,closedByPriority,
    closed:closed.map(record=>({id:record.id,priority:record.priority,previousStatus:before.get(record.id).status,exactCriterion:record.acceptance,acceptanceReview:reports.workbook.acceptanceReviews[record.id]})),
    remainingOpenCriteria:reports.currentAudit.openByPriority,remainingTotal:reports.currentAudit.openRecords},
  verification:{nativeTests:reports.native.unit.pass,developmentImagesOpened:reports.developmentReview.images.length,
    productionImagesOpened:reports.productionReview.images.length,workbookPanelsOpened:reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionFamilies:reports.production.inputReports.length,httpFilesVerified:reports.http.checks.length,gamePNG:reports.build.pngCount,
    preservedOtherWorkbooks:reports.workbook.unchangedOtherWorkbooks,preservedOtherCatalogues:reports.workbook.unchangedUniverseCatalogues},
  limitations:['Exact criteria are assessed within the existing sprites/3D/ATB adaptation; no full original campaign, map, artistic model, transcript or numerical table is certified.',
    'Native preparation, public save uploads, virtual input and every actual image reviewer remain attributed in individual reports.',
    'Chronicle movement is a bounded two-dimensional ATB model, without original geometry or 3D animation. Omni-blade eligibility is unproven and remains open.',
    'Hardware FPS, physical controller compatibility, Microsoft Excel and native Windows gameplay are not claimed by these local checks. Packaging and deployment have separate CI/status executions.']};
await writeFile(new URL(output,projectRoot),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,closed:report.delivery.closedCriteria,byPriority:closedByPriority,main:report.delivery.main,verification:report.verification}));

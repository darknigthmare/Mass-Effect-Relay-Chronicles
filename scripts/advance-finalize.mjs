// Compose actual executions and opened-image reviews; no test is run here.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ADVANCE_BASE_COMMIT, projectRoot, featureSourceFiles, filesBelow, sourceHashes, sha } from './advance-evidence.mjs';
import { UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
const configPath = process.argv[2];assert.ok(configPath, 'Pass the explicit final proof configuration.');
const read = path => readFile(new URL(path, projectRoot));
const configBytes = await read(configPath), config = JSON.parse(configBytes);
assert.equal(config.baseCommit, ADVANCE_BASE_COMMIT);
const output = config.output || 'docs/qa/advance-report.json';
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
const preservationBase=JSON.parse(baselineBytes);assert.equal(preservationBase.baseCommit,ADVANCE_BASE_COMMIT);
const principalTargets=['docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx'];
for(const [filename,expected]of Object.entries({...preservationBase.publicInputHashes,...preservationBase.historicalHashes})){
  if(!principalTargets.includes(filename))assert.equal(sha(await read(filename)),expected,filename);
}
for(const [filename,expected]of Object.entries(preservationBase.sourceHashes))if(filename.startsWith('scripts/'))assert.equal(sha(await read(filename)),expected,filename);
for(const [filename,expected]of Object.entries(preservation.sourceHashes))assert.equal(sha(await read(filename)),expected,filename);
assert.equal(sha(await read(preservation.sourceTool.path)),preservation.sourceTool.sha256);
const cwd=fileURLToPath(projectRoot),allowedExisting=new Set([...principalTargets,'src/main.js','src/world.js','src/world-data.js','src/state.js','src/operations.js','src/story.js','src/story-data.js','src/chronicles.js','src/completion-persistence-campaign.js','src/local-map.js','src/local-map.css','src/universe-ui.js','src/universe-data.js',
  'README.md','docs/ASSETS.md','docs/CATALOGUE.md','docs/DESIGN.md','docs/FIDELITY.md','docs/IMPLEMENTATION_STATUS.md','docs/PRIORITIES.md','docs/CHRONICLES.md']);
const basePaths=new Set(execFileSync('git',['ls-tree','-r','--name-only',ADVANCE_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n'));
const newPathAllowed=filename=>['docs/ADVANCE.md','docs/advance-tracking.md'].includes(filename)||['docs/qa/advance-','docs/screenshots/advance-','docs/workbook-previews/advance-','docs/research/advance-','scripts/advance-','src/advance-','tests/advance-'].some(prefix=>filename.startsWith(prefix));
const changedPaths=execFileSync('git',['diff','--name-only',ADVANCE_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n');
const newPaths=execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd,encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n');
for(const filename of new Set([...changedPaths,...newPaths].filter(Boolean)))assert.ok(basePaths.has(filename)?allowedExisting.has(filename):newPathAllowed(filename),`Unexpected task change: ${filename}`);
assert.equal(reports.native.unit.tests,config.expectedNativeTests);assert.equal(reports.native.unit.pass,reports.native.unit.tests);assert.ok(reports.native.unit.pass>=1177);assert.equal(reports.native.unit.fail,0);
for(const key of ['cancelled','skipped','todo'])assert.equal(reports.native.unit[key],0);
assert.equal(reports.native.output.exitCode,0);assert.equal(sha(await read(reports.native.output.path)),reports.native.output.sha256);
const nativeOutput=(await read(reports.native.output.path)).toString();
for(const key of ['tests','pass','fail','cancelled','skipped','todo'])assert.equal(Number(nativeOutput.match(new RegExp(`(?:#|ℹ) ${key} (\\d+)`))?.[1]),reports.native.unit[key],`Actual TAP count: ${key}`);
const nativeBundle=await read(reports.native.sourceBundle.path);assert.equal(sha(nativeBundle),reports.native.sourceBundle.sha256);
const bundled=JSON.parse(nativeBundle);assert.equal(bundled.baseCommit,ADVANCE_BASE_COMMIT);
for(const [filename,content]of Object.entries(bundled.replacements))assert.equal(sha(content),reports.native.sourceHashes[filename],filename);
for(const command of reports.validation.commands){assert.equal(command.exitCode,0);assert.equal(sha(await read(command.output)),command.sha256);if(command.detailedReport)assert.equal(sha(await read(command.detailedReport.path)),command.detailedReport.sha256);}
for(const proof of [...Object.values(reports.workbook.proofs),...reports.workbook.integrationProofs])assert.equal(sha(await read(proof.path)),proof.sha256,proof.path);
const expectedKinds=['progression','dialogues','world','feros','continuity'].sort();
for(const stage of ['development','production']){
  const aggregate=reports[stage],review=reports[`${stage}Review`];assert.equal(aggregate.stage,stage);
  assert.deepEqual(aggregate.inputReports.map(report=>report.kind).sort(),expectedKinds,`Missing ${stage} family`);assert.deepEqual(review.blockingFindings,[]);
  const captureKeys=new Set();
  for(const family of aggregate.inputReports){
    const bytes=await read(family.path);assert.equal(sha(bytes),family.sha256);const run=JSON.parse(bytes);assert.equal(run.passed,true);
    if(run.schemaAdapterOnly){
      const originalBytes=await read(run.originalExecution.path);assert.equal(sha(originalBytes),run.originalExecution.sha256);
      const original=JSON.parse(originalBytes);assert.equal(original.passed,true);assert.equal(sha(await read(run.sourceAdapter.path)),run.sourceAdapter.sha256);
      const relative=path=>path.replace(/^dist\//,'');const relativeMap=map=>Object.fromEntries(Object.entries(map).map(([path,value])=>[relative(path),value]));
      const expected={...original,distFiles:relativeMap(original.distFiles),finalDistFiles:relativeMap(original.finalDistFiles),servedFiles:original.servedFiles.map(file=>({...file,path:relative(file.path)}))};
      for(const key of Object.keys(original))assert.deepEqual(run[key],expected[key],`${family.path}: unchanged execution field ${key}`);
      assert.deepEqual(Object.keys(run).filter(key=>!Object.hasOwn(original,key)).sort(),['normalizedAt','schemaAdapterOnly','originalExecution','sourcePolicy','compiledPathAdapter','sourceAdapter'].sort());
    }
    const collector=run.command.script.replace(/^node /,'');assert.match(collector,/^scripts\/advance-[a-z0-9-]+\.mjs$/);assert.equal(typeof run.sourceHashes[collector],'string',collector);
    assert.equal(run.sourceFrozen,true,family.path);if(run.finalSourceHashes)assert.deepEqual(run.finalSourceHashes,run.sourceHashes,family.path);if(run.sourcesAfter)assert.deepEqual(run.sourcesAfter,run.sourcesBefore,family.path);
    if(run.registryContextHashes?.before)assert.deepEqual(run.registryContextHashes.after,run.registryContextHashes.before,family.path);if(run.finalRegistryContextHashes)assert.deepEqual(run.finalRegistryContextHashes,run.registryContextHashes,family.path);
    // Retain each collector's declared mode instead of rewriting raw reports.
    const expectedMode=stage;assert.equal(run.mode,expectedMode,family.path);
    for(const field of ['checks','talentChecks'])if(Array.isArray(run[field]))assert.ok(run[field].every(check=>check.passed===true),family.path);
    for(const field of ['errors','failedRequests','consoleErrors','evidenceErrors','deliveryErrors','codeResponseErrors'])if(Array.isArray(run[field]))assert.deepEqual(run[field],[],`${family.path}.${field}`);
    for(const[filename,expected]of Object.entries(run.sourceHashes||run.sourcesBefore||{}))assert.equal(sha(await read(filename)),expected,filename);
    for(const artifact of [...(run.exports||[]),...(run.fixtures||[])])assert.equal(sha(await read(artifact.path)),artifact.sha256,artifact.path);
    for(const [path,digest]of Object.entries(run.parentPublicInputs||{}))assert.equal(sha(await read(path)),digest,path);
    for(const capture of run.captureArtifacts||run.captures||run.screenshots||[]){
      assert.equal(sha(await read(capture.path)),capture.sha256,capture.path);
      assert.ok(review.images.some(image=>image.path===capture.path&&image.sha256===capture.sha256&&image.actuallyOpened===true),capture.path);captureKeys.add(`${capture.path}\0${capture.sha256}`);
    }
    if(stage==='production'){
      assert.deepEqual(run.sourceRequests,[]);assert.equal(run.distFrozen,true);assert.deepEqual(run.distFiles,reports.build.distFiles);
      const context=run.registryContextHashes?.before||run.registryContextHashes||{};
      for(const path of ['docs/content-catalog.json','src/universe-data.js']){const expected=run.sourceHashes?.[path]||context[path];assert.equal(typeof expected,'string',path);assert.equal(sha(await read(path)),expected,path);}
      for(const served of run.servedFiles||[]){const built=reports.build.distFiles[served.path];assert.ok(built,served.path);assert.equal(served.bytes,built.bytes,served.path);assert.equal(served.sha256,built.sha256,served.path);}
      if(family.kind==='world'){assert.equal(run.httpAllDistFilesSameBytes,true);assert.deepEqual([...run.httpVerified].sort(),Object.keys(reports.build.distFiles).sort());}
      else assert.ok(run.servedFiles.some(file=>file.path.endsWith('.js')),family.path);
    }
  }
  assert.equal(new Set(review.images.map(image=>`${image.path}\0${image.sha256}`)).size,review.images.length,`${stage}: duplicate review capture`);
  assert.deepEqual([...captureKeys].sort(),review.images.map(image=>`${image.path}\0${image.sha256}`).sort(),`${stage}: every capture must have one current review`);
  for(const item of aggregate.reviewRecords)assert.equal(sha(await read(item.path)),item.sha256,item.path);
}
const baseline=JSON.parse(execFileSync('git',['show',`${ADVANCE_BASE_COMMIT}:docs/content-catalog.json`],{cwd:fileURLToPath(projectRoot),encoding:'utf8',maxBuffer:32*1024*1024}));
const catalogue=JSON.parse(await read('docs/content-catalog.json')),before=new Map(baseline.entries.map(record=>[record.id,record]));
assert.equal(catalogue.entries.length,1385);assert.equal(new Set(catalogue.entries.map(record=>record.id)).size,1385);
for(const record of catalogue.entries)assert.equal(record.acceptance,before.get(record.id)?.acceptance,`${record.id}: unchanged acceptance criterion`);
assert.equal(UNIVERSE_SUMMARY.recordCount,6711);assert.equal(UNIVERSE_SUMMARY.sourceCount,454);
const closed=catalogue.entries.filter(record=>record.status==='Validé'&&before.get(record.id).status!=='Validé');
assert.ok(closed.length>0);const closedByPriority={P0:0,P1:0,P2:0};
for(const record of closed){
  const review=reports.workbook.acceptanceReviews[record.id];assert.ok(review,record.id);assert.equal(review.complete,true);assert.equal(review.exactCriterion,record.acceptance);assert.equal(review.exactDescription,before.get(record.id).description);assert.equal(review.descriptionComplete,true);assert.ok(review.coveredDescriptionClauses.length);
  assert.ok(review.evidence.length&&review.coveredClauses.length);for(const path of review.evidence)await access(new URL(path,projectRoot));
  for(const id of record.dependencies)assert.equal(catalogue.entries.find(record=>record.id===id)?.status,'Validé',`${record.id}: ${id}`);
  closedByPriority[record.priority]++;
}
for(const record of baseline.entries.filter(record=>record.status==='Validé'))assert.deepEqual(catalogue.entries.find(current=>current.id===record.id),record);
for(const record of baseline.entries)assert.equal(catalogue.entries.find(current=>current.id===record.id)?.assetStatus,record.assetStatus,record.id);
assert.equal(reports.currentAudit.records,6711);assert.equal(reports.currentAudit.openRecords,6581-closed.length);
const ledger=reports.currentAudit.ledger;assert.equal(ledger.format,'verified-reference-plus-delta');assert.equal(ledger.exactFieldsRecomputed,true);
const ledgerBytes=await read(ledger.reference.path);assert.equal(sha(ledgerBytes),ledger.reference.sha256);
const referencedLedger=JSON.parse(ledgerBytes);assert.equal(referencedLedger.records.length,ledger.reference.records);
const openLedger=new Map(referencedLedger.records.map(record=>[record.id,record]));
for(const id of ledger.removedRecords)assert.equal(openLedger.delete(id),true,id);
for(const record of ledger.changedRecords)openLedger.set(record.id,record);
assert.equal(openLedger.size,reports.currentAudit.openRecords);
assert.deepEqual([...ledger.removedRecords].sort(),closed.map(record=>record.id).sort());
const statuses=records=>Object.fromEntries(['Défini','Prototype','Intégré','Validé'].map(status=>[status,records.filter(record=>record.status===status).length]));
// Priority belongs to production catalogues, not the compact runtime registry.
const manifest=JSON.parse(await read('docs/universe/manifest.json'));
const catalogues=[catalogue,...await Promise.all(manifest.workbooks.map(async work=>JSON.parse(await read(work.catalogPath))))];
const productionRecords=catalogues.flatMap(catalogue=>catalogue.entries),runtimeById=new Map(UNIVERSE_RECORDS.map(record=>[record.id,record]));
assert.equal(productionRecords.length,6711);assert.equal(new Set(productionRecords.map(record=>record.id)).size,6711);
for(const record of productionRecords){
  assert.ok(['P0','P1','P2'].includes(record.priority));assert.equal(runtimeById.get(record.id)?.status,record.status,record.id);
  if(record.status==='Validé'){assert.equal(openLedger.has(record.id),false,record.id);continue;}
  const open=openLedger.get(record.id);assert.ok(open,record.id);
  for(const field of ['id','category','priority','status','assetStatus','name','episode','scope','canonLevel','description','acceptance','reference','sourceUrl','notes'])assert.deepEqual(open[field],record[field],`${record.id}: ${field}`);
  assert.deepEqual(open.dependencies,record.dependencies||[],record.id);assert.deepEqual(open.implementationPaths,record.implementationPaths||[],record.id);assert.deepEqual(open.declaredEvidence,record.evidence||[],record.id);
}
for(const priority of ['P0','P1','P2'])assert.equal(reports.currentAudit.openByPriority[priority],productionRecords.filter(record=>record.priority===priority&&record.status!=='Validé').length);
assert.deepEqual(statuses(catalogue.entries),reports.workbook.afterStatuses);
assert.equal(reports.workbook.assetStatusPromotions,0);assert.equal(reports.build.pngCount,46);
assert.equal(reports.http.buildReport.sha256,proofs.build.sha256);
assert.deepEqual(reports.http.checks.map(item=>item.path).sort(),Object.keys(reports.build.distFiles).sort());
assert.deepEqual((await filesBelow('dist/')).map(filename=>filename.slice('dist/'.length)).sort(),Object.keys(reports.build.distFiles).sort());
for(const item of reports.http.checks){assert.equal(item.status,200);assert.equal(item.sha256,reports.build.distFiles[item.path].sha256);assert.equal(sha(await read(`dist/${item.path}`)),item.sha256);}
const docs=config.documentationPaths||[];for(const path of docs)assert.ok(path==='README.md'||path.startsWith('docs/'));
const finalSources=await sourceHashes(await featureSourceFiles([...docs,'src/universe-data.js','docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx',configPath,'scripts/advance-finalize.mjs']));
const report={passed:true,at:new Date().toISOString(),baselineCommit:ADVANCE_BASE_COMMIT,sourceHashes:finalSources,
  productionPending:false,localValidationComplete:true,commitPushAllowed:true,
  configuration:{path:configPath,sha256:sha(configBytes)},proofs,
  delivery:{newSignaturePowers:[],
    scope:'ME1 campaign milestones and tracking, guarded recruitment and contextual codex, inspectable travel requirements, local-map collision footprints and retreat recovery, individually targeted Feros decisions and optional ME1 continuity imports into isolated ME2/ME3 chronicles.',
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
    'Feros geography, civilian interventions, reused bodies and morale thresholds remain adaptations. Original Charme12/Intimidation10, complete quest geography and exact artistic variants remain open. Continuity imports are consultation records, not playable ME2/ME3 campaigns.',
    'Hardware FPS, physical controller compatibility, Microsoft Excel and native Windows gameplay are not claimed by these local checks. Packaging and deployment have separate CI/status executions.']};
await writeFile(new URL(output,projectRoot),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,closed:report.delivery.closedCriteria,byPriority:closedByPriority,main:report.delivery.main,verification:report.verification}));

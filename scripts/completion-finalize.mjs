// Compose actual executions and opened-image reviews; no test is run here.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COMPLETION_BASE_COMMIT, projectRoot, featureSourceFiles, filesBelow, sourceHashes, sha } from './completion-evidence.mjs';
import { UNIVERSE_RECORDS, UNIVERSE_SUMMARY } from '../src/universe-data.js';
const configPath = process.argv[2];assert.ok(configPath, 'Pass the explicit final proof configuration.');
const read = path => readFile(new URL(path, projectRoot));
const configBytes = await read(configPath), config = JSON.parse(configBytes);
assert.equal(config.baseCommit, COMPLETION_BASE_COMMIT);
const output = config.output || 'docs/qa/completion-report.json';
try { await access(new URL(output,projectRoot));throw Error('Preserve an already composed final report.'); } catch(error) { if(error.code!=='ENOENT')throw error; }
const reports={},proofs={};
for(const key of ['native','development','developmentReview','workbook','validation','build','http','production','productionReview','preservation','currentAudit']){
  const path=config[key];assert.equal(typeof path,'string',key);const bytes=await read(path),report=JSON.parse(bytes);
  assert.equal(report.passed,true,path);assert.notEqual(report.selfcheckOnly,true,path);assert.notEqual(report.publicationAllowed,false,path);
  assert.notEqual(report.currentProductGate,false,path);assert.notEqual(report.historicalExecution,true,path);
  for(const[filename,expected]of Object.entries(report.sourceHashes||report.featureSourceHashes||{}))assert.equal(sha(await read(filename)),expected,`${path}: ${filename}`);
  reports[key]=report;proofs[key]={path,sha256:sha(bytes)};
}
const preservation=reports.preservation;
assert.equal(sha(await read(preservation.baseline.path)),preservation.baseline.sha256);
for(const [filename,expected]of Object.entries(preservation.preservedHashes))assert.equal(sha(await read(filename)),expected,filename);
const cwd=fileURLToPath(projectRoot);
const tracked=new Set(execFileSync('git',['ls-tree','-r','--name-only',COMPLETION_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n'));
const historicalChanges=execFileSync('git',['diff','--name-only',COMPLETION_BASE_COMMIT],{cwd,encoding:'utf8'}).trim().split('\n').filter(filename=>tracked.has(filename));
for(const filename of historicalChanges)assert.ok(preservation.allowedExistingFiles.includes(filename),`Unexpected historical modification: ${filename}`);
assert.ok(reports.native.unit.pass>=1057);assert.equal(reports.native.unit.fail,0);
for(const key of ['cancelled','skipped','todo'])assert.equal(reports.native.unit[key],0);
assert.equal(reports.native.output.exitCode,0);assert.equal(sha(await read(reports.native.output.path)),reports.native.output.sha256);
for(const command of reports.validation.commands){assert.equal(command.exitCode,0);assert.equal(sha(await read(command.output)),command.sha256);if(command.detailedReport)assert.equal(sha(await read(command.detailedReport.path)),command.detailedReport.sha256);}
const expectedKinds=['combat','controls','chronicles','chronicles-support','narrative','persistence','world'].sort();
for(const stage of ['development','production']){
  const aggregate=reports[stage],review=reports[`${stage}Review`];assert.equal(aggregate.stage,stage);
  assert.deepEqual(aggregate.inputReports.map(report=>report.kind).sort(),expectedKinds,`Missing ${stage} family`);assert.deepEqual(review.blockingFindings,[]);
  const captureKeys=new Set();
  for(const family of aggregate.inputReports){
    const bytes=await read(family.path);assert.equal(sha(bytes),family.sha256);const run=JSON.parse(bytes);assert.equal(run.passed,true);
    // This collector names its development mode "dev"; retain the raw value.
    const expectedMode=stage==='development'&&family.kind==='chronicles'?'dev':stage;assert.equal(run.mode,expectedMode,family.path);
    for(const field of ['checks','talentChecks'])if(Array.isArray(run[field]))assert.ok(run[field].every(check=>check.passed===true),family.path);
    for(const field of ['errors','failedRequests','consoleErrors','evidenceErrors'])if(Array.isArray(run[field]))assert.deepEqual(run[field],[],`${family.path}.${field}`);
    for(const[filename,expected]of Object.entries(run.sourceHashes||{}))assert.equal(sha(await read(filename)),expected,filename);
    for(const artifact of [...(run.exports||[]),...(run.fixtures||[])]){
      if(typeof artifact.path==='string')assert.equal(sha(await read(artifact.path)),artifact.sha256,artifact.path);
      else{
        // This deliberately corrupt initial localStorage value is recorded
        // inline in the already SHA-checked execution report, not as a file.
        assert.equal(family.kind,'persistence');assert.ok(run.fixtures.includes(artifact));
        assert.equal(artifact.label,'corrupt-automatic-save');assert.equal(artifact.storageKey,'relay-chronicles.save.v1');
        assert.equal(artifact.bytes,'{broken checkpoint');assert.equal(typeof artifact.origin,'string');
      }
    }
    for(const capture of run.captureArtifacts||run.captures||run.screenshots||[]){
      assert.equal(sha(await read(capture.path)),capture.sha256,capture.path);
      assert.ok(review.images.some(image=>image.path===capture.path&&image.sha256===capture.sha256&&image.actuallyOpened===true),capture.path);captureKeys.add(`${capture.path}\0${capture.sha256}`);
    }
    if(stage==='production'){assert.deepEqual(run.sourceRequests,[]);assert.notEqual(run.distFrozen,false);assert.deepEqual(run.distFiles,reports.build.distFiles);}
  }
  assert.equal(new Set(review.images.map(image=>`${image.path}\0${image.sha256}`)).size,review.images.length,`${stage}: duplicate review capture`);
  assert.deepEqual([...captureKeys].sort(),review.images.map(image=>`${image.path}\0${image.sha256}`).sort(),`${stage}: every capture must have one current review`);
  for(const item of aggregate.reviewRecords)assert.equal(sha(await read(item.path)),item.sha256,item.path);
}
const baseline=JSON.parse(execFileSync('git',['show',`${COMPLETION_BASE_COMMIT}:docs/content-catalog.json`],{cwd:fileURLToPath(projectRoot),encoding:'utf8',maxBuffer:32*1024*1024}));
const catalogue=JSON.parse(await read('docs/content-catalog.json')),before=new Map(baseline.entries.map(record=>[record.id,record]));
assert.equal(catalogue.entries.length,1385);assert.equal(new Set(catalogue.entries.map(record=>record.id)).size,1385);
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
assert.equal(reports.currentAudit.records,6711);assert.equal(reports.currentAudit.openRecords,6708-closed.length);
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
const finalSources=await sourceHashes(await featureSourceFiles([...docs,'src/universe-data.js','docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx',configPath,'scripts/completion-finalize.mjs']));
const report={passed:true,at:new Date().toISOString(),baselineCommit:COMPLETION_BASE_COMMIT,sourceHashes:finalSources,
  productionPending:false,localValidationComplete:true,commitPushAllowed:true,
  configuration:{path:configPath,sha256:sha(configBytes)},proofs,
  delivery:{newSignaturePowers:['bioticCharge','tacticalCloak','techArmor','nova'],
    scope:'ME1 directional solid-footprint cover, safe retreat, contextual narrative/relations, strict saves/inventory/shop and final campaign export, keyboard/accessibility fixes, isolated prepared ME2/ME3 powers.',
    main:{records:1385,changed:reports.workbook.changedIds.length,statuses:statuses(catalogue.entries)},
    universe:{records:6711,sources:454,statuses:statuses(UNIVERSE_RECORDS)},closedCriteria:closed.length,closedByPriority,
    closed:closed.map(record=>({id:record.id,priority:record.priority,previousStatus:before.get(record.id).status,exactCriterion:record.acceptance,acceptanceReview:reports.workbook.acceptanceReviews[record.id]})),
    remainingOpenCriteria:reports.currentAudit.openByPriority,remainingTotal:reports.currentAudit.openRecords},
  verification:{nativeTests:reports.native.unit.pass,developmentImagesOpened:reports.developmentReview.images.length,
    productionImagesOpened:reports.productionReview.images.length,workbookPanelsOpened:reports.workbook.actualVisualReview.actuallyOpenedImages,
    productionFamilies:reports.production.inputReports.length,httpFilesVerified:reports.http.checks.length,gamePNG:reports.build.pngCount,
    preservedOtherWorkbooks:reports.workbook.unchangedOtherWorkbooks,preservedOtherCatalogues:reports.workbook.unchangedUniverseCatalogues},
  limitations:['Validation concerns each unchanged acceptance criterion in its stated functional scope; no original campaign, map, artistic model, numerical table or full 1:1 recreation is certified.',
    'Native fixtures, prepared progression/XP, virtual gamepad inputs and all unplayed steps remain declared in individual reports. Browser images are attributed to their actual reviewers.',
    'Charge uses abstract contact, not original 3D movement. Seven supplemental POW records and the omni-blade remain open; no supplemental catalogue/workbook/asset status is promoted.',
    'Controlled foreground call rates are not hardware FPS measurements. Trusted browser blur/focus does not certify every OS visibility transition or a physical controller.',
    'The transient eight-second retreat re-entry boundary is not claimed played or persisted by the public world collector; its QA record remains partial unless separately proven.',
    'Microsoft Excel and native Windows gameplay are not launched by these local checks. Packaging and Vercel deployment have their separate CI/status executions.']};
await writeFile(new URL(output,projectRoot),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,closed:report.delivery.closedCriteria,byPriority:closedByPriority,main:report.delivery.main,verification:report.verification}));

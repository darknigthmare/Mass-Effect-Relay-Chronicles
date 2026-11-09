// Publish only the three explicitly scoped candidate files after positive native
// preservation and actual final-preview review. No gameplay generator runs here.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,IDS,PROMOTED_IDS,sha} from './frontier-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFile(path.resolve(root,name));
const json=async name=>JSON.parse(await read(name));
const update=await json('docs/qa/frontier-workbook-update.json'),native=await json('docs/qa/frontier-workbook-preservation.json');
const render=await json('docs/qa/frontier-workbook-render-report.json'),visual=await json('docs/qa/frontier-workbook-visual-review-record.json');
const baseline=await json('docs/qa/frontier-workbook-baseline.json');
assert.equal(update.passed,true);assert.equal(native.ok,true);assert.equal(native.passed,true);assert.equal(render.passed,true);assert.equal(visual.passed,true);
assert.equal(native.sha256,update.outputHashes.workbook);assert.equal(render.sourceWorkbookSha256,native.sha256);assert.equal(render.sourceWorkbookUnchanged,true);
assert.equal(update.baseCommit,BASE_COMMIT);assert.deepEqual(update.changedIds,IDS);assert.equal(native.unchangedEntries,1348);
assert.equal(native.integratedOrValidatedPromotions,0);assert.equal(native.statusPromotions,PROMOTED_IDS.length);assert.equal(native.assetStatusPromotions,PROMOTED_IDS.length);
assert.equal(visual.reviewComplete,true);assert.deepEqual(visual.blockingFindings,[]);assert.equal(visual.sourceWorkbookSha256,update.outputHashes.workbook);
assert.equal(visual.renderReportSha256,sha(await read('docs/qa/frontier-workbook-render-report.json')));
assert.equal(visual.images.length,render.images.length);assert.equal(visual.actuallyOpenedImages,render.images.length);
assert.deepEqual(visual.images.map(item=>item.path).sort(),render.images.map(item=>item.path).sort());
for(const item of visual.images){assert.equal(item.actuallyOpened,true);assert.equal(item.sha256,render.images.find(image=>image.path===item.path).sha256);assert.equal(sha(await read(item.path)),item.sha256);}
for(const[name,digest]of Object.entries(update.assetSourceHashes))assert.equal(sha(await read(name)),digest,name);
for(const gate of update.integrationProofs)assert.equal(sha(await read(gate.path)),gate.sha256,gate.path);
for(const[name,digest]of Object.entries({...baseline.publicPNGHashes,...baseline.otherWorkbookHashes}))assert.equal(sha(await read(name)),digest,name);
const candidateCatalogue=path.join(path.dirname(update.workbookPath),'content-catalog.json');
const deliveries=[['docs/content-catalog.json',candidateCatalogue,update.outputHashes.catalogue],
 ['docs/Mass_Effect_Relay_Chronicles_Production.xlsx',update.workbookPath,update.outputHashes.workbook],
 ['public/assets/manifest.json',path.resolve(root,update.manifestProof.path),update.manifestProof.sha256]];
for(const[publicPath,candidate,digest]of deliveries){assert.equal(sha(await read(candidate)),digest);assert.equal(sha(await read(publicPath)),baseline.sourceHashes[publicPath]);}
assert.ok(process.argv.includes('--publish'),'All checks passed; use --publish to copy the three reviewed candidates.');
for(const[publicPath,candidate]of deliveries)await fs.copyFile(candidate,path.join(root,publicPath));
const nativeOutput='docs/qa/frontier-workbook-public-preservation.json';
execFileSync('python',['scripts/frontier-verify-workbook.py','--before','/tmp/frontier-workbook-baseline/Mass_Effect_Relay_Chronicles_Production.xlsx',
 '--after','docs/Mass_Effect_Relay_Chronicles_Production.xlsx','--catalog-before','/tmp/frontier-workbook-baseline/content-catalog.json',
 '--catalog-after','docs/content-catalog.json','--changes','docs/qa/frontier-workbook-update.json','--output',nativeOutput],{cwd:root,stdio:'inherit'});
const publishedNative=await json(nativeOutput);assert.equal(publishedNative.passed,true);
const report={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,changedIds:IDS,unchangedEntries:1348,catalogueEntries:1382,
 changedWorkbookCells:update.cellChanges.length,changedCatalogueFields:update.catalogueChanges.length,changedMetadataFields:update.catalogueChanges.length-update.cellChanges.length,
 resizedRows:update.rowHeightChanges.length,statusPromotions:PROMOTED_IDS.length,assetStatusPromotions:PROMOTED_IDS.length,integratedOrValidatedPromotions:0,
 beforeStatuses:update.beforeStatuses,afterStatuses:update.afterStatuses,deliveries:Object.fromEntries(deliveries.map(([name,,digest])=>[name,digest])),
 nativeChecks:publishedNative.nativeChecks,actualVisualReview:{record:'docs/qa/frontier-workbook-visual-review-record.json',actuallyOpenedImages:visual.images.length,result:visual.result},
 integrationProofs:update.integrationProofs,assetSourceHashes:update.assetSourceHashes,prototypeCoverageChanges:update.prototypeCoverage.changes,
 preservedHistoricalPNG:Object.keys(baseline.publicPNGHashes).length,unchangedOtherWorkbooks:Object.keys(baseline.otherWorkbookHashes).length,
 limits:['Only the final targeted panels were actually opened. Native XML verifies all23494catalogue cells, formulas, structures and effective styles; Microsoft Excel was not launched.',
 'All canonical acceptance criteria remain unchanged. Prototype promotions document partial integration; no original1:1 certification or full-campaign completion.',
 'Fifteen new static NPC/enemy bodies and four Mako views remain separate from the16new fixed boss drawings; no new boss profile or complete animation kit.',
 'Mako is transient on Thérum only, without weapons, jumps or original physics. Its two WPN records remain unchanged.',
 'The parent delivery must still verify the final compiled public journey after catalogue/runtime synchronization.']};
await fs.writeFile(path.join(root,'docs/qa/frontier-workbook-visual-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,published:true,selected:IDS.length,changedCells:update.cellChanges.length,openedPanels:visual.images.length,statuses:update.afterStatuses}));

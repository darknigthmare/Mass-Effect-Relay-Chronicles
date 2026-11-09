// Copy only the three scoped deliverables after all preservation/review gates.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BASE_COMMIT,IDS,NEW_IDS,sha} from './horizon-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=filename=>fs.readFile(path.resolve(root,filename)),json=async filename=>JSON.parse(await read(filename));
const update=await json('docs/qa/horizon-workbook-update.json'),native=await json('docs/qa/horizon-workbook-preservation.json');
const render=await json('docs/qa/horizon-workbook-render-report.json'),visual=await json('docs/qa/horizon-workbook-visual-review-record.json');
const baseline=await json('docs/qa/horizon-workbook-baseline.json');
for(const report of [update,native,render,visual])assert.equal(report.passed,true);
assert.equal(update.baseCommit,BASE_COMMIT);assert.deepEqual(update.changedIds,IDS);assert.deepEqual(update.newIds,NEW_IDS);
assert.equal(native.unchangedEntries,1354);assert.equal(native.statusPromotions,21);assert.equal(native.assetStatusPromotions,20);
assert.equal(native.newPrototypeEntries,3);assert.equal(native.integratedOrValidatedPromotions,0);
assert.equal(native.sha256,update.outputHashes.workbook);assert.equal(render.sourceWorkbookSha256,native.sha256);assert.equal(render.sourceWorkbookUnchanged,true);
assert.equal(render.counterProbe.passed,true);assert.equal(render.counterProbe.restored,true);assert.equal(render.counterProbe.exported,false);
assert.equal(visual.reviewComplete,true);assert.deepEqual(visual.blockingFindings,[]);assert.equal(visual.sourceWorkbookSha256,native.sha256);
assert.equal(visual.renderReportSha256,sha(await read('docs/qa/horizon-workbook-render-report.json')));
assert.equal(visual.images.length,render.images.length);assert.equal(visual.actuallyOpenedImages,render.images.length);
assert.deepEqual(visual.images.map(image=>image.path).sort(),render.images.map(image=>image.path).sort());
for(const image of visual.images){assert.equal(image.actuallyOpened,true);assert.equal(image.sha256,render.images.find(other=>other.path===image.path).sha256);assert.equal(sha(await read(image.path)),image.sha256);}
for(const[name,expected]of Object.entries(update.assetSourceHashes))assert.equal(sha(await read(name)),expected,name);
for(const gate of update.integrationProofs)assert.equal(sha(await read(gate.path)),gate.sha256,gate.path);
for(const[name,expected]of Object.entries({...baseline.publicPNGHashes,...baseline.otherWorkbookHashes,...baseline.universeCatalogueHashes}))assert.equal(sha(await read(name)),expected,name);
const deliveries=[['docs/content-catalog.json',update.cataloguePath,update.outputHashes.catalogue],
  ['docs/Mass_Effect_Relay_Chronicles_Production.xlsx',update.workbookPath,update.outputHashes.workbook],
  ['public/assets/manifest.json',path.resolve(root,update.manifestProof.path),update.manifestProof.sha256]];
for(const[publicPath,candidate,expected]of deliveries){assert.equal(sha(await read(candidate)),expected);assert.equal(sha(await read(publicPath)),baseline.sourceHashes[publicPath]);}
assert.ok(process.argv.includes('--publish'),'All checks passed. Use --publish for the three reviewed public copies.');
for(const[publicPath,candidate]of deliveries)await fs.copyFile(candidate,path.join(root,publicPath));
const publishedNativePath='docs/qa/horizon-workbook-public-preservation.json';
execFileSync('python',['scripts/horizon-verify-workbook.py','--before','/tmp/horizon-workbook-baseline/Mass_Effect_Relay_Chronicles_Production.xlsx',
  '--after','docs/Mass_Effect_Relay_Chronicles_Production.xlsx','--catalog-before','/tmp/horizon-workbook-baseline/content-catalog.json',
  '--catalog-after','docs/content-catalog.json','--changes','docs/qa/horizon-workbook-update.json','--output',publishedNativePath],{cwd:root,stdio:'inherit'});
assert.equal((await json(publishedNativePath)).passed,true);
const report={passed:true,generatedAt:new Date().toISOString(),baselineCommit:BASE_COMMIT,
  changedIds:IDS,newIds:NEW_IDS,catalogueEntries:1385,unchangedEntries:1354,changedWorkbookCells:update.cellChanges.length,
  changedCatalogueFields:update.catalogueChanges.length,changedMetadataFields:update.catalogueChanges.length-update.cellChanges.length,
  resizedRows:update.rowHeightChanges.length,statusPromotions:21,assetStatusPromotions:20,newPrototypeEntries:3,integratedOrValidatedPromotions:0,
  beforeStatuses:update.beforeStatuses,afterStatuses:update.afterStatuses,
  deliveries:Object.fromEntries(deliveries.map(([filename,,expected])=>[filename,expected])),nativeChecks:native.nativeChecks,
  actualVisualReview:{record:'docs/qa/horizon-workbook-visual-review-record.json',actuallyOpenedImages:visual.images.length,result:visual.result},
  counterProbe:render.counterProbe,integrationProofs:update.integrationProofs,assetSourceHashes:update.assetSourceHashes,
  prototypeCoverageChanges:update.prototypeCoverage.changes,preservedHistoricalPNG:41,unchangedOtherWorkbooks:31,unchangedUniverseCatalogues:27,
  limits:['Only the final targeted panels were actually opened; all23545catalogue cells and native workbook structures are independently checked. Microsoft Excel was not launched.',
    'The1382existing identities and canonical acceptance criteria remain intact;3newSPR production entries are explicit partial additions.',
    'All27supplemental catalogues and31other XLSX retain their exact bytes. Later-media hull/fauna illustrations do not promote their broad source records.',
    'The29new drawings are fixed bodies/hulls. They do not add original flight, animation cycles, pet adoption or complete later-game campaigns.',
    'The parent must synchronize the generated universe registry and verify final compiled production after these public copies.']};
await fs.writeFile(path.join(root,'docs/qa/horizon-workbook-visual-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,published:true,existing:28,newEntries:3,promotions:21,openedPanels:visual.images.length,statuses:report.afterStatuses}));

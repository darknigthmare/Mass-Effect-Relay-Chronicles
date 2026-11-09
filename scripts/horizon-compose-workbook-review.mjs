// Combine actual, individual native-panel reviews. This script opens no image
// and attributes every observation to its SHA-bound reviewer record.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha} from './horizon-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const renderPath='docs/qa/horizon-workbook-render-report.json';
const renderRaw=await fs.readFile(path.join(root,renderPath));
const render=JSON.parse(renderRaw),renderHash=sha(renderRaw);
assert.equal(render.passed,true);assert.equal(render.sourceWorkbookUnchanged,true);
assert.equal(sha(await fs.readFile(render.sourceWorkbook)),render.sourceWorkbookSha256);
const args=process.argv.slice(2),records=[],opened=new Map();
for(let i=0;i<args.length;i+=2){
  assert.equal(args[i],'--review');assert.ok(args[i+1]);
  const name=path.relative(root,path.resolve(root,args[i+1]));
  assert.ok(!name.startsWith('..')&&!path.isAbsolute(name));
  const raw=await fs.readFile(path.join(root,name)),review=JSON.parse(raw);
  assert.equal(review.passed,true,name);assert.equal(review.reviewComplete,true,name);
  assert.deepEqual(review.blockingFindings,[],name);
  assert.equal(review.sourceWorkbookSha256,render.sourceWorkbookSha256,name);
  assert.equal(review.renderReportSha256,renderHash,name);
  assert.ok(Array.isArray(review.images)&&review.images.length>0,name);
  for(const image of review.images){
    const expected=render.images.find(other=>other.path===image.path);
    assert.ok(expected,image.path);assert.equal(image.actuallyOpened,true,image.path);
    assert.equal(image.sha256,expected.sha256,image.path);
    assert.equal(sha(await fs.readFile(path.join(root,image.path))),expected.sha256,image.path);
    assert.ok(!opened.has(image.path),`Panel appears in multiple reviews: ${image.path}`);
    opened.set(image.path,{...expected,...image,reviewRecord:name,reviewRecordSha256:sha(raw)});
  }
  records.push({path:name,sha256:sha(raw),actuallyOpenedImages:review.images.length});
}
assert.equal(opened.size,render.images.length,'Every rendered panel needs an individual opening attestation.');
const images=render.images.map(image=>{assert.ok(opened.has(image.path),image.path);return opened.get(image.path);});
const report={passed:true,reviewComplete:true,generatedAt:new Date().toISOString(),aggregationOnly:true,
  sourceWorkbookSha256:render.sourceWorkbookSha256,renderReport:renderPath,renderReportSha256:renderHash,
  reviewRecords:records,blockingFindings:[],actuallyOpenedImages:images.length,images,
  result:'Les 52 panneaux ciblés ont été réellement ouverts à leur résolution originale par les quatre agents cités. Aucun défaut bloquant de lisibilité, de statut ou de mise en page n’a été relevé.',
  limits:['This composer performs SHA checks and aggregates the cited actual observations; it does not itself open images.',
    'Targeted native renders were reviewed. Microsoft Excel was not launched; full-cell and workbook-structure preservation is covered by the independent OpenXML verifier.']};
const output='docs/qa/horizon-workbook-visual-review-record.json';
await fs.writeFile(path.join(root,output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,openedPanels:images.length,reviewRecords:records.length,output}));

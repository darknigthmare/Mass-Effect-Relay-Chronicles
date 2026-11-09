import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Keep the successful renderer's exact executed source and raw bytes intact.
// Qualify the four unchanged boss zones against the audited Ilos-only delta.
const root = new URL('../', import.meta.url), digest = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFile(new URL(path, root));
const artifact = async path => { const bytes=await read(path);return {path,sha256:digest(bytes),data:JSON.parse(bytes)}; };
const raw=await artifact('docs/qa/frontier-bosses-renderer.json');
const review=await artifact('docs/qa/frontier-bosses-renderer-visual-review.json');
const delta=await artifact('docs/qa/frontier-ilos-delta-report.json');
const metadata=await artifact('docs/qa/frontier-before-ilos-source.json');
assert.equal(raw.data.passed,true);assert.equal(review.data.passed,true);assert.equal(review.data.actuallyOpened,true);
assert.equal(review.data.rawRenderer.sha256,raw.sha256);
assert.equal(delta.data.passed,true);assert.equal(delta.data.outsideIlosUnchanged,true);assert.equal(delta.data.geometryAndCollisionsUnchanged,true);
const snapshot=await read(delta.data.before.snapshot),current=await read(delta.data.after.path);
assert.equal(digest(snapshot),raw.data.sourceHashes['src/world.js']);
assert.equal(digest(snapshot),delta.data.before.sha256);assert.equal(digest(snapshot),metadata.data.sha256);
assert.equal(digest(current),delta.data.after.sha256);
const before=snapshot.toString('utf8'),after=current.toString('utf8'),replacement=delta.data.permittedReplacement;
assert.equal(before.split(replacement.before).length,2,'exactly one permitted bridge replacement');
const methodStart=before.indexOf('  _ilos() {'),methodEnd=before.indexOf('\n  _',methodStart+1),changeStart=before.indexOf(replacement.before);
assert.ok(methodStart>=0&&changeStart>methodStart&&(methodEnd<0||changeStart<methodEnd));
assert.equal(before.replace(replacement.before,replacement.after),after,'all bytes outside the permitted Ilos replacement remain unchanged');
for(const[path,expected]of Object.entries(raw.data.sourceHashes))if(path!=='src/world.js')assert.equal(digest(await read(path)),expected,path);
assert.equal(raw.data.cases.length,16);assert.equal(raw.data.nativeEvents.length,4);assert.equal(raw.data.scopeClosures.length,28);
assert.equal(raw.data.captures.length,16);assert.equal(review.data.captures.length,16);
assert.ok(raw.data.cases.every(row=>row.passed&&!['ilos'].includes(row.zone)));
assert.ok(raw.data.nativeEvents.every(row=>row.actionOK&&row.damageOK&&row.hp===0&&row.powersUnchanged&&row.saveUnchanged));
assert.ok(raw.data.scopeClosures.every(row=>row.frame===null&&row.configClosed&&!row.borrowedBossPose));
for(const capture of review.data.captures){
  assert.equal(capture.actuallyOpened,true);assert.equal(digest(await read(capture.path)),capture.sha256);
  assert.ok(raw.data.captures.some(original=>original.path===capture.path&&original.sha256===capture.sha256));
}
assert.deepEqual(raw.data.errors,[]);assert.deepEqual(raw.data.failedRequests,[]);assert.deepEqual(raw.data.assetErrors,[]);
const output={passed:true,at:new Date().toISOString(),actuallyOpened:true,
  command:'node scripts/qualify-frontier-bosses-renderer.mjs',
  scope:'Qualification of a successful pre-Ilos renderer execution for its four unchanged boss zones. No new renderer replay is claimed. Original executed sourceHashes and raw report bytes remain unchanged; the final source differs only by the exact audited Ilos bridge replacement.',
  rawRenderer:{path:raw.path,sha256:raw.sha256,passed:raw.data.passed},
  visualReview:{path:review.path,sha256:review.sha256,passed:review.data.passed,actuallyOpened:true},
  sourceQualification:{audit:{path:delta.path,sha256:delta.sha256,passed:true},
    snapshot:{path:delta.data.before.snapshot,sha256:digest(snapshot)},metadata:{path:metadata.path,sha256:metadata.sha256},
    currentWorld:{path:delta.data.after.path,sha256:digest(current)},outsideIlosUnchanged:true,exactSingleReplacementVerified:true,
    unchangedBossZones:['virmire','noveria','feros','citadel-finale']},
  sourceHashes:raw.data.sourceHashes,
  cases:raw.data.cases,nativeEvents:raw.data.nativeEvents,scopeClosures:raw.data.scopeClosures,
  captures:review.data.captures,errors:raw.data.errors,failedRequests:raw.data.failedRequests,assetErrors:raw.data.assetErrors,
  storageUnchanged:raw.data.storageUnchanged,reviewByFamily:review.data.reviewByFamily,
  remainingLimitations:review.data.remainingLimitations.filter(item=>!item.startsWith('Separate root audit'))};
await writeFile(new URL('docs/qa/frontier-bosses-renderer-qualified.json',root),JSON.stringify(output,null,2)+'\n');
assert.equal(digest(await read(raw.path)),raw.sha256,'raw renderer report remains byte-identical');
console.log(JSON.stringify({passed:true,cases:output.cases.length,captures:output.captures.length,
  executedWorldSHA256:digest(snapshot),qualifiedCurrentWorldSHA256:digest(current),rawSHA256:raw.sha256}));

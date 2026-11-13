// Aggregate actual reviewer attestations; this script never opens an image.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha } from './priority-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), reviews = [];
let renderPath, output;
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1]);
  if (args[index] === '--render-report') renderPath = args[index + 1];
  else if (args[index] === '--output') output = args[index + 1];
  else { assert.equal(args[index], '--review'); reviews.push(args[index + 1]); }
}
assert.ok(renderPath && output && reviews.length > 0);
try { await fs.access(output); throw Error('Preserve the existing composed review.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const renderRaw = await fs.readFile(path.resolve(root, renderPath)), render = JSON.parse(renderRaw), renderHash = sha(renderRaw);
assert.equal(render.passed, true); assert.equal(render.sourceWorkbookUnchanged, true);
assert.equal(sha(await fs.readFile(render.sourceWorkbook)), render.sourceWorkbookSha256);
const records = [], opened = new Map();
for (const filename of reviews) {
  const name = path.relative(root, path.resolve(root, filename)); assert.ok(!name.startsWith('..') && !path.isAbsolute(name));
  const raw = await fs.readFile(path.join(root, name)), review = JSON.parse(raw);
  assert.equal(review.passed, true, name); assert.equal(review.reviewComplete, true, name); assert.deepEqual(review.blockingFindings, [], name);
  assert.equal(review.sourceWorkbookSha256, render.sourceWorkbookSha256, name); assert.equal(review.renderReportSha256, renderHash, name);
  assert.ok(Array.isArray(review.images) && review.images.length > 0, name);
  for (const image of review.images) {
    const expected = render.images.find(other => other.path === image.path); assert.ok(expected, image.path);
    assert.equal(image.actuallyOpened, true, image.path); assert.equal(image.sha256, expected.sha256, image.path);
    assert.equal(sha(await fs.readFile(path.join(root, image.path))), expected.sha256, image.path);
    assert.ok(!opened.has(image.path), `Duplicate panel review: ${image.path}`);
    opened.set(image.path, { ...expected, ...image, reviewRecord: name, reviewRecordSha256: sha(raw) });
  }
  records.push({ path: name, sha256: sha(raw), actuallyOpenedImages: review.images.length });
}
assert.equal(opened.size, render.images.length, 'Every rendered panel needs an actually opened review.');
const images = render.images.map(image => { assert.ok(opened.has(image.path)); return opened.get(image.path); });
const report = { passed: true, reviewComplete: true, generatedAt: new Date().toISOString(), aggregationOnly: true,
  sourceWorkbookSha256: render.sourceWorkbookSha256, renderReport: renderPath, renderReportSha256: renderHash,
  reviewRecords: records, blockingFindings: [], actuallyOpenedImages: images.length, images,
  result: `Les ${images.length} panneaux ciblés ont été réellement ouverts par les ${records.length} réviseurs cités. Les observations et limites restent attribuées à leurs preuves.`,
  limits: ['This composer validates hashes and attributes actual observations; it does not itself open images.',
    'Only the named panels are visually reviewed. Microsoft Excel was not launched; the independent native checker covers every catalogue cell and workbook structure.'] };
await fs.writeFile(path.resolve(root, output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, openedPanels: images.length, reviewRecords: records.length, output }));

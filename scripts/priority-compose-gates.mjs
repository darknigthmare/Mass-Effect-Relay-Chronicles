// Aggregate executed current reports and real opened-image attestations. This
// composer performs no browser execution, image opening or fidelity assessment.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_COMMIT, PRIORITY_FEATURE_SOURCES, readFeatureSources, sha } from './priority-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), inputs = [], reviews = [];
let nativePath, developmentOutput, visualOutput;
for (let index = 0; index < args.length; index += 2) {
  assert.ok(args[index + 1]);
  if (args[index] === '--report') {
    const split = args[index + 1].indexOf('='); assert.ok(split > 0, 'Use --report KIND=FILE');
    inputs.push({ kind: args[index + 1].slice(0, split), path: args[index + 1].slice(split + 1) });
  } else if (args[index] === '--review') reviews.push(args[index + 1]);
  else if (args[index] === '--native-report') nativePath = args[index + 1];
  else if (args[index] === '--development-output') developmentOutput = args[index + 1];
  else if (args[index] === '--visual-output') visualOutput = args[index + 1];
  else throw Error(`Unknown option: ${args[index]}`);
}
assert.ok(nativePath && developmentOutput && visualOutput && inputs.length >= 6 && reviews.length >= 6,
  'Provide six current family reports, their actual opened reviews, native report and two outputs.');
assert.equal(new Set(inputs.map(item => item.kind)).size, inputs.length);
assert.equal(new Set(inputs.map(item => item.path)).size, inputs.length);
const relative = filename => {
  const resolved = path.resolve(root, filename); assert.ok(resolved.startsWith(root + path.sep)); return path.relative(root, resolved);
};
const read = async filename => {
  const name = relative(filename), bytes = await fs.readFile(path.join(root, name)); return { path: name, bytes, sha256: sha(bytes), json: JSON.parse(bytes) };
};
for (const filename of [developmentOutput, visualOutput]) {
  try { await fs.access(path.resolve(root, filename)); throw Error(`Preserve the existing aggregation: ${filename}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const sourceHashes = {}, captured = new Map(), inputReports = [];
async function checkSources(report, label) {
  const sources = report.sourceHashes || report.sources || {}; assert.ok(!Array.isArray(sources));
  assert.notEqual(report.currentProductGate, false, `Historical report must not become a current gate: ${label}`);
  assert.notEqual(report.historicalExecution, true, `Historical report must not become a current gate: ${label}`);
  for (const [filename, expected] of Object.entries(sources)) {
    assert.match(expected, /^[a-f0-9]{64}$/);
    assert.equal(sha(await fs.readFile(path.join(root, relative(filename)))), expected, `Stale ${label}: ${filename}`);
    if (Object.hasOwn(sourceHashes, filename)) assert.equal(sourceHashes[filename], expected);
    sourceHashes[filename] = expected;
  }
}
const native = await read(nativePath); assert.equal(native.json.passed, true, native.path);
await checkSources(native.json, native.path);
for (const input of inputs) {
  const item = await read(input.path), report = item.json; assert.equal(report.passed, true, item.path);
  for (const field of ['errors', 'failedRequests', 'consoleErrors', 'evidenceErrors']) if (Array.isArray(report[field])) assert.deepEqual(report[field], [], `${item.path}.${field}`);
  await checkSources(report, item.path);
  const captures = report.captureArtifacts || report.captures || report.screenshots || [];
  assert.ok(Array.isArray(captures) && captures.length > 0, `${item.path} lacks actual captures`);
  for (const capture of captures) {
    const filename = relative(capture.path); assert.match(capture.sha256, /^[a-f0-9]{64}$/);
    assert.equal(sha(await fs.readFile(path.join(root, filename))), capture.sha256, filename);
    const key = filename + '\0' + capture.sha256, previous = captured.get(key);
    captured.set(key, { ...(previous || capture), path: filename, sha256: capture.sha256,
      kinds: [...new Set([...(previous?.kinds || []), input.kind])], executionReports: [...new Set([...(previous?.executionReports || []), item.path])] });
  }
  inputReports.push({ kind: input.kind, path: item.path, sha256: item.sha256, captures: captures.length, scope: report.scope });
}
const reviewRecords = [], attestations = new Map();
for (const filename of reviews) {
  const item = await read(filename), review = item.json;
  assert.equal(review.passed, true, item.path);
  assert.notEqual(review.currentProductGate, false, item.path); assert.notEqual(review.historicalExecution, true, item.path);
  assert.deepEqual(review.blockingFindings ?? review.findings, [], item.path);
  await checkSources(review, item.path);
  const images = [review.images, review.captures, review.imagesReviewed, review.screenshots, review.actualVisualReview?.images].filter(Array.isArray).flat();
  let opened = 0;
  for (const image of images) {
    if (image.actuallyOpened !== true && !(review.actuallyOpened === true && image.actuallyOpened !== false)) continue;
    if (typeof image.path !== 'string' || typeof image.sha256 !== 'string') continue;
    const name = relative(image.path); assert.equal(sha(await fs.readFile(path.join(root, name))), image.sha256, name);
    attestations.set(name + '\0' + image.sha256, { path: name, sha256: image.sha256, actuallyOpened: true,
      reviewRecord: item.path, reviewRecordSHA256: item.sha256,
      observations: image.observations || image.observation || image.review || review.observations || null });
    opened++;
  }
  assert.ok(opened > 0, `${item.path} has no actual opened-image attestations`);
  reviewRecords.push({ path: item.path, sha256: item.sha256, openedImages: opened });
}
const images = [];
for (const [key, capture] of captured) {
  const review = attestations.get(key); assert.ok(review, `Current capture has no actual opened review: ${capture.path}`);
  images.push({ ...capture, ...review });
}
const expectedSources = await readFeatureSources(root, PRIORITY_FEATURE_SOURCES);
for (const [filename, expected] of Object.entries(expectedSources)) assert.equal(sourceHashes[filename], expected, `Missing current feature source: ${filename}`);
sourceHashes['scripts/priority-compose-gates.mjs'] = sha(await fs.readFile(new URL(import.meta.url)));
const base = { passed: true, generatedAt: new Date().toISOString(), baselineCommit: BASE_COMMIT, aggregationOnly: true,
  sourceHashes, nativeReport: { path: native.path, sha256: native.sha256 }, inputReports, reviewRecords,
  scope: 'Six current development family executions and their actually opened SHA-bound reviews; native results remain separately attributed. No original-game likeness, full campaign traversal or physical-input certification is inferred.',
  limitations: ['Image opening belongs to the cited reviewers; this composer performs hash checks and aggregation only.',
    'Historical reports and superseded UI attempts remain outside the current gate. Every accepted source hash is current.',
    'Final production must be tested after catalogue synchronization and compilation.'] };
await fs.writeFile(path.resolve(root, developmentOutput), JSON.stringify({ ...base, captureArtifacts: [...captured.values()] }, null, 2) + '\n');
await fs.writeFile(path.resolve(root, visualOutput), JSON.stringify({ ...base, reviewComplete: true, blockingFindings: [],
  images, actuallyOpenedImages: images.length,
  result: 'Every current captured family view has its own actually opened review. Functional prototypes and media-specific limits remain explicit.' }, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, families: inputs.length, openedCaptures: images.length, sourceHashes: Object.keys(sourceHashes).length }));

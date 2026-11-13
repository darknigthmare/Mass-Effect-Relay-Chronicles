// Balance existing rendered panels across the seven actual Resolve reviewers.
// Assignment performs byte/dimension checks and never attests image opening.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, readJson, fresh, sha } from './completion-tracking-common.mjs';
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const renderPath = option('--render-report'), scopePath = option('--scope'), output = option('--output');
assert.ok(renderPath && scopePath && output); await fresh(path.resolve(ROOT, output));
const render = await readJson(renderPath), scope = await readJson(scopePath); assert.equal(render.data.passed, true);
assert.equal(sha(await fs.readFile(render.data.sourceWorkbook)), render.data.sourceWorkbookSha256);
const reviewers = { root: '/root', tracking: '/root/resolve_tracking', citadel: '/root/resolve_citadel',
  noveria: '/root/resolve_noveria', virmire: '/root/resolve_virmire', endgame: '/root/resolve_endgame', origins: '/root/resolve_origins' };
const groups = Object.fromEntries(Object.entries(reviewers).map(([key, agent]) => [key, {
  agent, output: `docs/qa/resolve-tracking-workbook-review-${key}-final-01.json`, images: [], pixels: 0,
}]));
const panels = [];
for (const [index, image] of render.data.images.entries()) {
  const bytes = await fs.readFile(path.resolve(ROOT, image.path)); assert.equal(sha(bytes), image.sha256);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  panels.push({ ...image, index, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
}
assert.ok(panels.length >= Object.keys(groups).length);
const capacity = Math.ceil(panels.length / Object.keys(groups).length);
for (const image of panels.sort((a, b) => b.width * b.height - a.width * a.height || a.index - b.index)) {
  const group = Object.values(groups).filter(item => item.images.length < capacity).sort((a, b) => a.pixels - b.pixels || a.images.length - b.images.length)[0];
  group.images.push(image); group.pixels += image.width * image.height;
}
for (const group of Object.values(groups)) group.images.sort((a, b) => a.index - b.index);
const report = { passed: true, assignmentOnly: true, publicationAllowed: false, generatedAt: new Date().toISOString(),
  sourceWorkbookSha256: render.data.sourceWorkbookSha256, renderReport: render.path, renderReportSha256: render.sha256,
  scopeProof: { path: scope.path, sha256: scope.sha256 },
  sourceTool: { path: 'scripts/resolve-tracking-assign-reviews.mjs', sha256: sha(await fs.readFile(new URL(import.meta.url))) }, groups,
  instructions: 'Actually open every assigned PNG with view_image. Return a fresh JSON with passed, reviewComplete, blockingFindings, sourceWorkbookSha256, renderReportSha256, and each original image path/SHA plus actuallyOpened:true and concrete observations. Separate inherited notes from current status and the Resolve addition. Assignment is not an opening attestation or a fidelity certification.' };
await fs.writeFile(path.resolve(ROOT, output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, panels: panels.length, groups: Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, group.images.length])), output }));

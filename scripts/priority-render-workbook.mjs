// Import/render only. The temporary counter probe is restored and never exported.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha } from './priority-workbook-data.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const input = option('--input'), changes = option('--update-report'), directory = option('--output-dir'), result = option('--report');
assert.ok(input && changes && directory && result);
try { await fs.access(result); throw Error('Preserve the existing render report.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES; assert.ok(runtime);
const require = createRequire(path.join(runtime, '__priority_workbook_preview__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const original = await fs.readFile(input), update = JSON.parse(await fs.readFile(changes));
assert.equal(sha(original), update.outputHashes.workbook);
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const dashboard = workbook.worksheets.getItem('Dashboard'), probe = update.counterProbe;
const sheet = workbook.worksheets.getItem(probe.sheet);
workbook.recalculate();
const counts = () => ({ prototype: Number(dashboard.getRange(`D${probe.dashboardRow}`).values[0][0]),
  validated: Number(dashboard.getRange(`F${probe.dashboardRow}`).values[0][0]),
  globalPrototype: Number(dashboard.getRange('D37').values[0][0]), globalValidated: Number(dashboard.getRange('F37').values[0][0]),
  total: Number(dashboard.getRange('B37').values[0][0]) });
const before = counts(), oldStatus = sheet.getRange(probe.cell).values[0][0];
assert.equal(oldStatus, 'Prototype'); assert.equal(before.total, 1385);
assert.equal(before.globalPrototype, update.afterStatuses.Prototype); assert.equal(before.globalValidated, 3);
sheet.getRange(probe.cell).values = [['Validé']]; workbook.recalculate();
const changed = counts();
assert.deepEqual(changed, { prototype: before.prototype - 1, validated: before.validated + 1,
  globalPrototype: before.globalPrototype - 1, globalValidated: before.globalValidated + 1, total: before.total });
sheet.getRange(probe.cell).values = [[oldStatus]]; workbook.recalculate(); assert.deepEqual(counts(), before);
await fs.mkdir(directory, { recursive: true });
const images = [];
for (const preview of update.previews) {
  assert.equal(path.basename(preview.file), preview.file); assert.match(preview.file, /^priority-workbook-[a-z0-9_-]+\.png$/);
  const blob = await workbook.render({ sheetName: preview.sheetName, range: preview.range, scale: 1, format: 'png' });
  const bytes = new Uint8Array(await blob.arrayBuffer()), target = path.resolve(directory, preview.file);
  await fs.writeFile(target, bytes);
  images.push({ ...preview, path: target.startsWith(root + path.sep) ? path.relative(root, target) : target, sha256: sha(bytes) });
  console.log(`Rendered ${preview.file}`);
}
assert.deepEqual(await fs.readFile(input), original);
const report = { passed: true, generatedAt: new Date().toISOString(), sourceWorkbook: path.resolve(input), sourceWorkbookSha256: sha(original),
  sourceWorkbookUnchanged: true, updateReport: path.resolve(changes), updateReportSha256: sha(await fs.readFile(changes)),
  counterProbe: { passed: true, id: probe.id, cell: `${probe.sheet}!${probe.cell}`, temporaryValue: 'Validé',
    before, changed, restored: true, exported: false, source: 'SpreadsheetFile calculation in memory; Microsoft Excel was not launched.' },
  images, scope: 'Actual renders of the independently verified fixed-record candidate. No pixel editing, re-export or new gameplay verification. Individual opened-image review is required before public copy.' };
await fs.mkdir(path.dirname(path.resolve(result)), { recursive: true });
await fs.writeFile(result, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, panels: images.length, counterProbe: true, sourceWorkbookUnchanged: true }));

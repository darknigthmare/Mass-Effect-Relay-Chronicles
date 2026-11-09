// Render the verified candidate and exercise the extended formulas in memory.
// Never export the mutated probe or edit pixels in the previews.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {sha} from './horizon-workbook-data.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
const input=option('--input'),changes=option('--update-report'),directory=option('--output-dir'),result=option('--report');
assert.ok(input&&changes&&directory&&result,'Provide --input --update-report --output-dir --report.');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;assert.ok(runtime);
const require=createRequire(path.join(runtime,'__horizon_preview__.cjs'));
const {FileBlob,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const original=await fs.readFile(input),update=JSON.parse(await fs.readFile(changes));assert.equal(sha(original),update.outputHashes.workbook);
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(input)),dashboard=workbook.worksheets.getItem('Dashboard'),sprites=workbook.worksheets.getItem('Sprites');
workbook.recalculate();
const before={prototype:Number(dashboard.getRange('D30').values[0][0]),validated:Number(dashboard.getRange('F30').values[0][0]),globalPrototype:Number(dashboard.getRange('D37').values[0][0]),globalValidated:Number(dashboard.getRange('F37').values[0][0]),total:Number(dashboard.getRange('B37').values[0][0])};
assert.equal(sprites.getRange('C89').values[0][0],'Prototype');assert.equal(before.total,1385);assert.equal(before.globalPrototype,399);
sprites.getRange('C89').values=[['Validé']];workbook.recalculate();
const changed={prototype:Number(dashboard.getRange('D30').values[0][0]),validated:Number(dashboard.getRange('F30').values[0][0]),globalPrototype:Number(dashboard.getRange('D37').values[0][0]),globalValidated:Number(dashboard.getRange('F37').values[0][0]),total:Number(dashboard.getRange('B37').values[0][0])};
assert.deepEqual(changed,{prototype:before.prototype-1,validated:before.validated+1,globalPrototype:before.globalPrototype-1,globalValidated:before.globalValidated+1,total:before.total});
sprites.getRange('C89').values=[['Prototype']];workbook.recalculate();assert.equal(Number(dashboard.getRange('D37').values[0][0]),399);
await fs.mkdir(directory,{recursive:true});const images=[];
for(const preview of update.previews){
  assert.equal(path.basename(preview.file),preview.file);assert.ok(preview.file.startsWith('horizon-workbook-')&&preview.file.endsWith('.png'));
  const blob=await workbook.render({sheetName:preview.sheetName,range:preview.range,scale:1,format:'png'}),bytes=new Uint8Array(await blob.arrayBuffer());
  const filename=path.resolve(directory,preview.file);await fs.writeFile(filename,bytes);
  images.push({...preview,path:filename.startsWith(root+path.sep)?path.relative(root,filename):filename,sha256:sha(bytes)});
  console.log(`Rendered ${preview.file}`);
}
assert.deepEqual(await fs.readFile(input),original);
const report={passed:true,generatedAt:new Date().toISOString(),sourceWorkbook:path.resolve(input),sourceWorkbookSha256:sha(original),sourceWorkbookUnchanged:true,
  updateReport:path.resolve(changes),updateReportSha256:sha(await fs.readFile(changes)),
  counterProbe:{passed:true,source:'Imported final candidate, SpreadsheetFile calculation in memory; no Microsoft Excel launch.',cell:'Sprites!C89',temporaryValue:'Validé',before,changed,restored:true,exported:false},
  images,scope:'Actual renders of the independently verified scoped candidate. The temporary new-row status probe is restored in memory before rendering, never exported. Individual image opening and visual review remain required before public copy.'};
await fs.mkdir(path.dirname(path.resolve(result)),{recursive:true});await fs.writeFile(result,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,counterProbe:true,panels:images.length,sourceWorkbookUnchanged:true}));

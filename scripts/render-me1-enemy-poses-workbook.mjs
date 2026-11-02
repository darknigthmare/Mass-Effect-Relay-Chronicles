// Import the final scoped XLSX only to render targeted preview panels. Never
// re-export the workbook or edit any pixels in the generated previews.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), options = {};
for (let index=0; index<args.length; index+=2) {
  if (!['--input','--update-report','--output-dir','--report'].includes(args[index]) || !args[index+1] || Object.hasOwn(options,args[index])) throw Error('Expected --input FILE --update-report FILE --output-dir DIR --report FILE.');
  options[args[index]] = path.resolve(args[index+1]);
}
if (Object.keys(options).length!==4) throw Error('Provide all four arguments.');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!runtime) throw Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const require=createRequire(path.join(runtime,'__me1_enemy_poses_workbook_preview__.cjs'));
const { FileBlob, SpreadsheetFile } = await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const portable=filename=>filename.startsWith(root+path.sep)?path.relative(root,filename):filename;
const original=await fs.readFile(options['--input']);
const update=JSON.parse(await fs.readFile(options['--update-report'],'utf8'));
if (sha(original)!==update.outputHashes.workbook) throw Error('The update report does not bind this final XLSX.');
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(options['--input']));
await fs.mkdir(options['--output-dir'],{recursive:true});
const images=[];
for (const preview of update.previews) {
  if (path.basename(preview.file)!==preview.file || !preview.file.startsWith('me1-enemy-poses-') || !preview.file.endsWith('.png')) throw Error('Invalid new preview filename.');
  const blob=await workbook.render({sheetName:preview.sheetName,range:preview.range,scale:1,format:'png'});
  const bytes=new Uint8Array(await blob.arrayBuffer()), filename=path.join(options['--output-dir'],preview.file);
  await fs.writeFile(filename,bytes);
  images.push({...preview,path:portable(filename),sha256:sha(bytes)});
  console.log(`Rendered ${preview.file}`);
}
if (!original.equals(await fs.readFile(options['--input']))) throw Error('Rendering changed the source workbook bytes.');
const report={passed:true,generatedAt:new Date().toISOString(),sourceWorkbook:portable(options['--input']),sourceWorkbookSha256:sha(original),sourceWorkbookUnchanged:true,
  updateReport:portable(options['--update-report']),updateReportSha256:sha(await fs.readFile(options['--update-report'])),images,
  scope:'Four targeted panels for each of five existing ME1 enemy/Joker sprite rows: identity/status, description/criteria, planned/current path and scope/notes. Two additional Dashboard panels show sprite and total status counters. No full-workbook visual review; native XML preservation is verified separately.'};
await fs.mkdir(path.dirname(options['--report']),{recursive:true});
await fs.writeFile(options['--report'],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,panels:images.length,sourceWorkbookUnchanged:true}));

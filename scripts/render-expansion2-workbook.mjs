// Read-only targeted preview import. Never re-exports or roundtrips the XLSX.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2), options={};
for(let i=0;i<args.length;i+=2){
 if(!['--input','--build-report','--output-dir','--report'].includes(args[i])||!args[i+1]||Object.hasOwn(options,args[i]))throw Error('Usage: --input FILE --build-report FILE --output-dir DIR --report FILE');
 options[args[i]]=path.resolve(args[i+1]);
}
if(Object.keys(options).length!==4)throw Error('Expected --input, --build-report, --output-dir and --report.');
const outputDir=options['--output-dir'], reportPath=options['--report'];
const temporary=p=>p.startsWith('/tmp/');
if(!temporary(outputDir)&&outputDir!==path.join(root,'docs/expansion2-workbook-previews'))throw Error('Only new Lot 2 preview paths are writable.');
if(!temporary(reportPath)&&!(path.dirname(reportPath)===path.join(root,'docs/qa')&&path.basename(reportPath).startsWith('expansion2-')))throw Error('Only new Lot 2 reports are writable.');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!runtime)throw Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required for read-only previews.');
const require=createRequire(path.join(runtime,'__expansion2_workbook_preview__.cjs'));
const {FileBlob,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const portable=filename=>filename.startsWith(root+path.sep)?path.relative(root,filename):filename;
const before=await fs.readFile(options['--input']);
const build=JSON.parse(await fs.readFile(options['--build-report'],'utf8'));
if(digest(before)!==build.xlsxSha256)throw Error('Build report does not bind the current XLSX.');
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(options['--input']));
await fs.mkdir(outputDir,{recursive:true});
const images=[];
for(const sheet of build.sheets){
 const end=Math.max(7,6+sheet.rows), firstEnd=Math.min(end,14), tailStart=Math.max(7,end-11);
 for(const [panel,range] of [['identity',`A1:J${firstEnd}`],['tail',`A${tailStart}:J${end}`],['facts',`K6:N${firstEnd}`],['limits',`O6:Q${firstEnd}`],['evidence',`R6:U${firstEnd}`]]){
  const blob=await workbook.render({sheetName:sheet.name,range,scale:1,format:'png'});
  const bytes=new Uint8Array(await blob.arrayBuffer()), filename=`${sheet.name}-${panel}.png`;
  await fs.writeFile(path.join(outputDir,filename),bytes);
  images.push({sheetName:sheet.name,panel,range,path:portable(path.join(outputDir,filename)),sha256:digest(bytes)});
  console.log(`Rendered ${sheet.name} ${panel}`);
 }
}
const after=await fs.readFile(options['--input']);
if(!before.equals(after))throw Error('Preview rendering changed source XLSX bytes.');
const report={sourceXlsx:portable(options['--input']),sourceXlsxSha256:digest(before),sourceWorkbookUnchanged:true,
 buildReport:portable(options['--build-report']),buildReportSha256:digest(await fs.readFile(options['--build-report'])),
 overlays:build.overlays,
 scope:'Five targeted panels per variable-size worksheet, not a full-cell visual inspection. Native XML verification covers every delivery value separately. Tail panels can contain executable and closed profiles.',images};
await fs.mkdir(path.dirname(reportPath),{recursive:true});
await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({panels:images.length,overlays:build.overlays,sourceWorkbookUnchanged:true,report:reportPath}));

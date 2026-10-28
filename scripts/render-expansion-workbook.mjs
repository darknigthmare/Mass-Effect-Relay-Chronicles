// Read-only rendering of the dedicated workbook. Never exports/import-roundtrips XLSX.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2), options={};
for(let i=0;i<args.length;i+=2){
 if(!['--input','--output-dir','--report'].includes(args[i])||!args[i+1]||Object.hasOwn(options,args[i]))throw Error('Usage: --input FILE --output-dir DIR --report FILE');
 options[args[i]]=path.resolve(args[i+1]);
}
if(Object.keys(options).length!==3)throw Error('Expected --input, --output-dir and --report.');
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!runtime)throw Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required for read-only previews.');
const require=createRequire(path.join(runtime,'__expansion_workbook_preview__.cjs'));
const {FileBlob,SpreadsheetFile}=await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const portable=filename=>filename.startsWith(root+path.sep)?path.relative(root,filename):filename;
const before=await fs.readFile(options['--input']);
const workbook=await SpreadsheetFile.importXlsx(await FileBlob.load(options['--input']));
await fs.mkdir(options['--output-dir'],{recursive:true});
const images=[];
for(const sheetName of ['Personnages','Armures','Armes','Vehicules_vaisseaux','Ennemis']){
 for(const [panel,range] of [['identity','A1:J14'],['consultation','A35:J46'],['facts','K6:N14'],['limits','O6:Q14'],['evidence','R6:U14']]){
  const blob=await workbook.render({sheetName,range,scale:1,format:'png'});
  const bytes=new Uint8Array(await blob.arrayBuffer()),filename=`${sheetName}-${panel}.png`;
  await fs.writeFile(path.join(options['--output-dir'],filename),bytes);
  images.push({sheetName,panel,range,path:portable(path.join(options['--output-dir'],filename)),sha256:digest(bytes)});
  console.log(`Rendered ${sheetName} ${panel}`);
 }
}
const after=await fs.readFile(options['--input']);
if(!before.equals(after))throw Error('Preview rendering changed source XLSX bytes.');
const report={sourceXlsx:portable(options['--input']),sourceXlsxSha256:digest(before),sourceWorkbookUnchanged:true,
 scope:'Twenty-five targeted panels across five worksheets, not a full-cell visual inspection. All200rows are verified separately as XML.',images};
await fs.mkdir(path.dirname(options['--report']),{recursive:true});
await fs.writeFile(options['--report'],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({panels:images.length,sourceWorkbookUnchanged:true,report:options['--report']}));

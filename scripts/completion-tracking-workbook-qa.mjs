// Exercise the actual current production workbook's status formulas in memory.
// The source file is never exported or replaced; Microsoft Excel is not launched.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, readJson, fresh, sha, counts, locations, currentSources } from './completion-tracking-common.mjs';
const option=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
const output=option('--output'),renderPath=option('--render-report'),previewDir=option('--preview-dir');assert.ok(output&&renderPath&&previewDir);
await fresh(path.resolve(ROOT,output));await fresh(path.resolve(ROOT,renderPath));
const catalogue=await readJson('docs/content-catalog.json'),workbook='docs/Mass_Effect_Relay_Chronicles_Production.xlsx';
const sourceHashes={'docs/content-catalog.json':catalogue.sha256,[workbook]:sha(await fs.readFile(path.join(ROOT,workbook))),
  'scripts/completion-tracking-workbook-qa.mjs':sha(await fs.readFile(new URL(import.meta.url))),
  'scripts/completion-tracking-render-workbook.mjs':sha(await fs.readFile(path.join(ROOT,'scripts/completion-tracking-render-workbook.mjs'))),
  'scripts/completion-tracking-common.mjs':sha(await fs.readFile(path.join(ROOT,'scripts/completion-tracking-common.mjs')))};
const id='QA-classeur-edite',entry=catalogue.data.entries.find(entry=>entry.id===id),location=locations(catalogue.data)[id];assert.ok(entry&&location);
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'completion-tracking-workbook-qa-')),planPath=path.join(directory,'counter-input.json');
const input={passed:true,selfcheckOnly:false,kind:'actual-production-workbook-counter-qa-input',catalogueEntries:catalogue.data.entries.length,
  outputHashes:{workbook:sourceHashes[workbook]},afterStatuses:counts(catalogue.data.entries),
  counterProbe:{id,sheet:location.sheetName,cell:`C${location.row}`,dashboardRow:location.dashboardRow,totalRow:catalogue.data.categories.length+11,
    fromStatus:entry.status,temporaryStatus:entry.status==='Validé'?'Prototype':'Validé'},
  previews:[{ids:[id],file:'completion-tracking-workbook-counter-row.png',sheetName:location.sheetName,range:`A${location.row}:D${location.row}`},
    {file:'completion-tracking-workbook-counter-total.png',sheetName:'Dashboard',range:'A37:F37'}]};
await fs.writeFile(planPath,JSON.stringify(input,null,2)+'\n');
execFileSync(process.execPath,['scripts/completion-tracking-render-workbook.mjs','--input',workbook,'--update-report',planPath,'--output-dir',previewDir,'--report',renderPath],{cwd:ROOT,stdio:'inherit'});
const rendered=await readJson(renderPath);assert.equal(rendered.data.passed,true);assert.equal(rendered.data.sourceWorkbookUnchanged,true);
assert.equal(rendered.data.sourceWorkbookSha256,sourceHashes[workbook]);assert.equal(rendered.data.counterProbe.passed,true);assert.equal(rendered.data.counterProbe.restored,true);assert.equal(rendered.data.counterProbe.exported,false);
await currentSources(sourceHashes,'actual production workbook counter QA');
const report={passed:true,generatedAt:new Date().toISOString(),kind:'native-workbook-counter-qa',selfcheckOnly:false,criterionId:id,
  exactCriterion:entry.acceptance,sourceHashes,renderReport:{path:rendered.path,sha256:rendered.sha256},
  counterProbe:rendered.data.counterProbe,captures:rendered.data.images,sourceWorkbookByteIdentical:true,
  limits:['The actual current production XLSX is imported, one existing status cell is edited, category/global formulas recalculate, then the cell is restored in memory. No XLSX export or public modification.','Calculation uses SpreadsheetFile; Microsoft Excel and Windows were not launched.','Actual opening of the two renders is a separate visual review. This metadata QA is separate from gameplay/browser gates and artistic fidelity.']};
await fs.writeFile(path.resolve(ROOT,output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,criterionId:id,counterRecalculatedAndRestored:true,sourceWorkbookByteIdentical:true,captures:report.captures.length,output}));

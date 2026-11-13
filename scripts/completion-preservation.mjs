import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COMPLETION_BASE_COMMIT, projectRoot, sha } from './completion-evidence.mjs';
const baselinePath=process.env.COMPLETION_BASELINE_REPORT||'docs/qa/completion-tracking-baseline-02.json';
const output=process.env.COMPLETION_PRESERVATION_REPORT||'docs/qa/completion-preservation-report.json';
try{await access(new URL(output,projectRoot));throw Error('Preserve the executed preservation report.');}catch(error){if(error.code!=='ENOENT')throw error;}
const bytes=await readFile(new URL(baselinePath,projectRoot)),baseline=JSON.parse(bytes);assert.equal(baseline.baseCommit,COMPLETION_BASE_COMMIT);
const publicChanges=new Set(['docs/content-catalog.json','docs/Mass_Effect_Relay_Chronicles_Production.xlsx']);
const preserved={};
for(const[path,digest]of Object.entries({...baseline.publicInputHashes,...baseline.historicalHashes})){
  if(publicChanges.has(path))continue;assert.equal(sha(await readFile(new URL(path,projectRoot))),digest,path);preserved[path]=digest;
}
const allowedExisting=[...publicChanges,'README.md','docs/ASSETS.md','docs/CATALOGUE.md','docs/DESIGN.md','docs/FIDELITY.md','docs/IMPLEMENTATION_STATUS.md','docs/PRIORITIES.md',
  'src/campaign-talents.js','src/chronicles.js','src/combat.js','src/customization.js','src/gamepad-controls.js','src/loadout.js','src/main.js','src/save-slots.js','src/state.js',
  'src/story-data.js','src/story.js','src/tactical-positions.js','src/tactical-ui.js','src/universe-actors.js','src/universe-powers.js','src/universe-ui.js','src/world.js','src/universe-data.js',
  'tests/campaign-talents.test.js','tests/story-world.test.js','tests/universe-power-profiles.test.js'];
const cwd=fileURLToPath(projectRoot);
const tracked=new Set(execFileSync('git',['ls-tree','-r','--name-only',COMPLETION_BASE_COMMIT],{cwd,encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n'));
const changed=execFileSync('git',['diff','--name-only',COMPLETION_BASE_COMMIT],{cwd,encoding:'utf8'}).trim().split('\n').filter(path=>tracked.has(path));
for(const path of changed)assert.ok(allowedExisting.includes(path),`Unexpected historical modification: ${path}`);
const report={passed:true,at:new Date().toISOString(),baselineCommit:COMPLETION_BASE_COMMIT,baseline:{path:baselinePath,sha256:sha(bytes)},
  preservedPNGCount:baseline.preservation.publicPngs,preservedOtherWorkbookCount:baseline.preservation.otherWorkbooks,
  preservedSupplementalCatalogueCount:baseline.catalogues.length-1,preservedHistoricalProofCount:Object.keys(baseline.historicalHashes).length,
  preservedHashes:preserved,existingFilesChanged:changed,allowedExistingFiles:allowedExisting,unchangedOutsideAllowlist:true,
  scope:'Native SHA preservation of historical proofs, game PNG, other XLSX, supplemental catalogues and manifests; Git byte comparison for all tracked historical files outside the explicit feature/test/documentation allowlist.',
  limitations:['New files are identified by their feature reports and the final commit, not classified as historical preservation.','Principal JSON and XLSX cell/criterion preservation is verified independently by the workbook publication gate.']};
assert.equal(report.preservedPNGCount,46);assert.equal(report.preservedOtherWorkbookCount,31);assert.equal(report.preservedSupplementalCatalogueCount,27);
await writeFile(new URL(output,projectRoot),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,PNG:46,otherXLSX:31,otherCatalogues:27,historicalProofs:report.preservedHistoricalProofCount,existingChanged:changed.length}));

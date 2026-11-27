import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..'),out=resolve(root,'docs/armax/lot22/qa');
mkdirSync(out,{recursive:true});
const command=['--test','--test-reporter=tap','tests/armax-engine.test.js','tests/armax-expansion.test.js'];
const native=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:60000});
writeFileSync(resolve(out,'armax-native.tap'),native.stdout||native.stderr||String(native.error));
const report={at:new Date().toISOString(),node:process.version,command:`node ${command.join(' ')}`,passed:native.status===0,tests:Number(native.stdout?.match(/^# tests (\d+)$/m)?.[1]||0),failures:Number(native.stdout?.match(/^# fail (\d+)$/m)?.[1]||0),exitCode:native.status,scope:'Native deterministic engine and campaign logic only. The eight-victory route test deliberately uses low-health fixtures; it is not a human playthrough or a balance evaluation.',browserVerified:false,sourceSha256:{}};
for(const path of ['src/armax-data.js','src/armax-expansion-data.js','src/armax-engine.js','src/armax-campaign.js','src/armax-ui.js','src/armax-ui.css','src/main.js','tests/armax-engine.test.js','tests/armax-expansion.test.js'])report.sourceSha256[path]=createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex');
if(process.argv.includes('--build')){
  const output=process.env.ARMAX_BUILD_DIR||'/tmp/armax-lot22-build';
  const buildCommand=['node_modules/vite/bin/vite.js','build','--outDir',output,'--emptyOutDir'];
  const build=spawnSync(process.execPath,buildCommand,{cwd:root,encoding:'utf8',timeout:60000});
  writeFileSync(resolve(out,'armax-build.log'),`${build.stdout||''}${build.stderr||''}${build.error?String(build.error):''}`);
  report.build={command:`node ${buildCommand.join(' ')}`,passed:build.status===0,exitCode:build.status,log:'docs/armax/lot22/qa/armax-build.log',scope:'Production compilation. Does not certify browser rendering, hardware performance or absent historical artwork.'};
}
writeFileSync(resolve(out,'armax-native-report.json'),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({passed:report.passed,tests:report.tests,failures:report.failures,buildPassed:report.build?.passed,browserVerified:false}));
process.exitCode=!report.passed||report.build?.passed===false?1:0;

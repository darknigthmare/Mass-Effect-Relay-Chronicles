import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES } from '../src/world-data.js';
const root=new URL('../',import.meta.url),entry=process.env.GAME_URL||'http://127.0.0.1:4176',sha=b=>createHash('sha256').update(b).digest('hex');
const output='docs/qa/horizon-levels-before-report.json';
try{await access(new URL(output,root));throw Error('Preserve prior baseline instead of overwriting it.');}catch(e){if(e.code!=='ENOENT')throw e;}
const report={passed:false,at:new Date().toISOString(),baselineCommit:'2ab3f7c10d3bdd9ca04b7a962df9447aee2b3e75',buildKind:'unchanged production dist from Frontier',url:entry,
 scope:'Four public imported save viewpoints on the previous compiled map. Earlier progression is Node-native fixture preparation, not played here. No QA API, CSS, camera or scene injection.',
 command:{script:'node scripts/horizon-levels-before.mjs',environment:{GAME_URL:entry}},sourceHashes:{},distFiles:{},captures:[],fixtures:[],errors:[],failedRequests:[]};
for(const filename of ['src/world.js','src/world-data.js','src/level-layout-data.js','scripts/horizon-levels-before.mjs'])report.sourceHashes[filename]=sha(await readFile(new URL(filename,root)));
async function tree(url,prefix=''){const result={};for(const item of await readdir(url,{withFileTypes:true})){const name=prefix+item.name,target=new URL(item.name+(item.isDirectory()?'/':''),url);if(item.isDirectory())Object.assign(result,await tree(target,name+'/'));else{const b=await readFile(target);result[name]={bytes:b.length,sha256:sha(b)};}}return result;}
function travel(s,z){s.zone=z;s.position=null;assert.equal(recordVisit(s,z),true);}
function finish(s,z,choice=null){travel(s,z);for(const id of zoneEncounters(z))assert.equal(winEncounter(s,id),true);assert.equal(completeZone(s,z,choice),true);}
function prepare(zone,suffix){const s=newGame({name:'QA Horizon avant',difficulty:'story',mode:'wait'});s.flags.briefed=true;s.settings.sound=false;s.settings.reducedMotion=true;finish(s,'eden-prime');travel(s,'citadel');for(const id of ['garrus','tali','wrex'])assert.equal(recruit(s,id),true);assert.equal(completeZone(s,'citadel'),true);s.party=['shepard','garrus','tali'];
 if(zone==='ilos'){finish(s,'therum');finish(s,'feros','save');finish(s,'noveria','release');finish(s,'virmire','save-kaidan');}
 travel(s,zone);if(suffix!=='spawn'){const target=suffix==='boss'?2:3;for(const id of zoneEncounters(zone).slice(0,target))assert.equal(winEncounter(s,id),true);}
 s.position=suffix==='spawn'?{...WORLD_ZONES[zone].spawn}:((p)=>({x:p.x,z:p.z}))(WORLD_ZONES[zone].pois.find(p=>p.id===`${zone}:${suffix}`));assert.ok(decodeSave(encodeSave(s)));return s;}
let browser,page;
try{
 const old=JSON.parse(await readFile(new URL('docs/qa/frontier-build-report.json',root)));report.distFiles=await tree(new URL('dist/',root));assert.deepEqual(report.distFiles,old.distFiles);report.previousBuildReport={path:'docs/qa/frontier-build-report.json',sha256:sha(await readFile(new URL('docs/qa/frontier-build-report.json',root)))};
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(40000);page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failedRequests.push(r.url()));await page.goto(entry,{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>typeof window.__RELAY_TEST__),'undefined');
 for(const[zone,suffix]of [['feros','spawn'],['feros','boss'],['ilos','spawn'],['ilos','objective']]){
  if(await page.locator('[data-do="pause"]').isVisible()){await page.locator('[data-do="pause"]').click();await page.locator('[data-do="quit"]').click();}
  const s=prepare(zone,suffix),filename=`docs/qa/horizon-levels-before-${zone}-${suffix}-fixture.json`,bytes=Buffer.from(encodeSave(s));await writeFile(new URL(filename,root),bytes);report.fixtures.push({path:filename,sha256:sha(bytes),zone,position:s.position,origin:'Node-native newGame/recruit/winEncounter/completeZone callbacks; preceding encounters not played in Chromium.'});
  await page.locator('#save-import').setInputFiles({name:filename.split('/').pop(),mimeType:'application/json',buffer:bytes});await page.locator('#hud:not(.hidden) .location h2').waitFor();await page.locator('#transition.active').waitFor({state:'hidden'});await page.waitForTimeout(950);
  const path=`docs/screenshots/horizon-levels-before-${zone}-${suffix}.png`,capture=await page.screenshot({path:fileURLToPath(new URL(path,root))});report.captures.push({path,sha256:sha(capture),bytes:capture.length,zone,suffix,viewport:page.viewportSize()});
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(await tree(new URL('dist/',root)),report.distFiles);for(const[path,digest]of Object.entries(report.sourceHashes))assert.equal(sha(await readFile(new URL(path,root))),digest);report.passed=true;
}catch(e){report.failure=e.stack||String(e);process.exitCode=1;}finally{await browser?.close();await mkdir(new URL('docs/qa/',root),{recursive:true});await writeFile(new URL(output,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,captures:report.captures.length,failure:report.failure}));}

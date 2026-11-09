import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),entry=process.env.GAME_URL||'http://127.0.0.1:4243';
const prefix=process.env.EDEN_INSPECTION_PREFIX||'frontier-levels-before',selectedRooms=(process.env.EDEN_INSPECTION_ROOMS||'').split(',').filter(Boolean);
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=['src/world.js','src/world-data.js','src/level-layout-data.js','src/eden-scene.js','src/world-navigation.js','vite.config.js','scripts/frontier-levels-before.mjs'];
const report={passed:false,at:new Date().toISOString(),command:{script:'node scripts/frontier-levels-before.mjs',environment:{GAME_URL:entry,EDEN_INSPECTION_PREFIX:prefix,EDEN_INSPECTION_ROOMS:selectedRooms.join(',')}},scope:'Intermediate visual inspection only on the actual detached WorldView. Three legacy-zone spawn viewpoints use native settled camera focus; player/camera are held for inspection. This does not replay navigation, native actions, saves or ordinary public gameplay.',sourceHashes:Object.fromEntries(await Promise.all(paths.map(async p=>[p,hash(await readFile(new URL(p,root)))]))),screenshots:[],viewpoints:[],errors:[],failedRequests:[],viewport:{width:1280,height:800}};
await mkdir(new URL('docs/screenshots/',root),{recursive:true});let browser,page;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 report.chromium=browser.version();page=await browser.newPage({viewport:report.viewport});page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failedRequests.push(r.url()));
 const url=entry+'/__eden-inspection__';await page.route(url,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><div id="world" style="position:relative;width:100vw;height:100vh"></div><script type="module">import'/@vite/env';import{WorldView}from'/src/world.js';import{getLevelLayout}from'/src/level-layout-data.js';window.__EDEN_INSPECT__={world:new WorldView(document.querySelector('#world')),layout:getLevelLayout('eden-prime')};const w=window.__EDEN_INSPECT__.world;w.setZone('eden-prime');w.setMode('explore');</script></body></html>`}));
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>{const w=window.__EDEN_INSPECT__?.world;return w&&['crew','enemy','boss','props','npc','vehicles','walk'].every(key=>w.atlases[key]);});
 for (const id of ['therum','noveria','virmire']) {
 const view=await page.evaluate(id=>{const w=window.__EDEN_INSPECT__.world;w.setZone(id);w.setMode('explore');w.setPosition(w.zone.spawn);const focus=w._cameraFocus(w.getPosition(),'explore');w.cameraTarget.copy(focus);w.camera.position.copy(focus).add(w.cameraOffset);w.camera.lookAt(focus);w.update(0);return{id,position:w.getPosition(),cameraTarget:w.cameraTarget.toArray(),bounds:w.zone.bounds,assetErrors:[...w.assetErrors]};},id);
 const path=`docs/screenshots/${prefix}-${id}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root))});report.screenshots.push({path,sha256:hash(bytes),bytes:bytes.length});report.viewpoints.push(view);
 }
 await page.evaluate(()=>{window.__EDEN_INSPECT__.world.dispose();delete window.__EDEN_INSPECT__;});assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
 for(const[p,expected]of Object.entries(report.sourceHashes))assert.equal(hash(await readFile(new URL(p,root))),expected,p);
 report.passed=true;
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;console.error(report.failure);}finally{await browser?.close();await writeFile(new URL(`docs/qa/${prefix}-report.json`,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,captures:report.screenshots.length,failure:report.failure}));}

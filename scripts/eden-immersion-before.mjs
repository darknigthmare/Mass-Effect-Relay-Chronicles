import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url), entry = process.env.GAME_URL || 'http://127.0.0.1:4195';
const hash = data => createHash('sha256').update(data).digest('hex');
const paths = ['src/world.js', 'src/world-data.js', 'src/enemy-animation-data.js', 'src/companion-animation-data.js', 'src/joker-seated-data.js', 'vite.config.js', 'scripts/eden-immersion-before.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const baseline = '533efaa2ca88c34be21eb53aa30fafcfedd79707';
for (const path of ['src/world.js', 'src/world-data.js', 'vite.config.js']) assert.equal(sourceHashes[path], hash(execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, maxBuffer: 16*1024*1024 })), `Before-source must remain the baseline: ${path}`);
await mkdir(new URL('docs/qa/eden-immersion-before-source/', root), { recursive: true });
await mkdir(new URL('docs/screenshots/', root), { recursive: true });
for (const path of paths.filter(path => !path.startsWith('scripts/'))) await writeFile(new URL(`docs/qa/eden-immersion-before-source/${path.split('/').at(-1)}`, root), await readFile(new URL(path, root)));
const report = { passed: false, at: new Date().toISOString(), baselineCommit: baseline, sourceHashes, url: entry,
  scope: 'Before-only captures of an explicitly detached actual WorldView fixture on unmodified baseline533efaa. Four exploration camera viewpoints are positioned for inspection; no navigation traversal, app progression or save behavior is claimed. A fifth overview uses an explicitly enlarged inspection camera, with labels hidden, to expose the full baseline scene.',
  viewport: { width: 1280, height: 800 }, screenshots: [], viewpoints: [], errors: [], failedRequests: [], sourceArchive: [] };
for (const path of paths.filter(path => !path.startsWith('scripts/'))) report.sourceArchive.push({ path: `docs/qa/eden-immersion-before-source/${path.split('/').at(-1)}`, originalPath: path, sha256: sourceHashes[path] });
let browser, page;
async function capture(label) { const path = `docs/screenshots/eden-immersion-before-${label}.png`;const data=await page.screenshot({ path:fileURLToPath(new URL(path,root)) });report.screenshots.push({path,sha256:hash(data),bytes:data.length,label}); }
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 report.chromium=browser.version();page=await browser.newPage({viewport:report.viewport});page.setDefaultTimeout(45000);
 page.on('pageerror',error=>report.errors.push(error.message));page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
 const fixtureURL=`${entry}/__eden-immersion-before__`;
 await page.route(fixtureURL,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><title>Eden before fixture</title></head><body style="margin:0;background:#07111d"><div id="world" style="position:relative;width:100vw;height:100vh"></div><script type="module">import{WorldView}from'/src/world.js';const w=new WorldView(document.querySelector('#world'));w.setZone('eden-prime');w.setMode('explore');window.__EDEN_BEFORE__={world:w,frame:0,time:performance.now()};const f=window.__EDEN_BEFORE__;function loop(t){w.update(Math.max(0,Math.min(.05,(t-f.time)/1000)));f.time=t;f.frame=requestAnimationFrame(loop);}f.frame=requestAnimationFrame(loop);</script></body></html>`}));
 await page.goto(fixtureURL,{waitUntil:'networkidle'});await page.waitForFunction(()=>{const w=window.__EDEN_BEFORE__?.world;return w&&['crew','enemy','boss','props','npc','vehicles','walk'].every(key=>!!w.atlases[key]);});
 report.initial=await page.evaluate(()=>{const w=window.__EDEN_BEFORE__.world;return{zone:w.zoneId,theme:w.zone.theme,bounds:w.getBounds(),spawn:w.getPosition(),pois:w.getPOIs().map(p=>({id:p.id,x:p.x,z:p.z})),cameraOffset:w.cameraOffset.toArray()};});
 assert.equal(report.initial.zone,'eden-prime');assert.deepEqual(report.initial.bounds,{minX:-20,maxX:20,minZ:-21,maxZ:21});
 for (const [label,poiId] of [['spawn',null],['patrol','eden-prime:encounter-1'],['husks','eden-prime:encounter-2'],['beacon','eden-prime:objective']]) {
  const viewpoint=await page.evaluate(({label,poiId})=>{const w=window.__EDEN_BEFORE__.world;const p=poiId?w.getPOIs().find(p=>p.id===poiId):w.zone.spawn;w.setPosition(p);return{label,poiId,requested:{x:p.x,z:p.z},actual:w.getPosition()};},{label,poiId});
  assert.deepEqual(viewpoint.actual,viewpoint.requested);
  await page.waitForFunction(()=>{const w=window.__EDEN_BEFORE__.world,p=w.getPosition();return Math.abs(w.cameraTarget.x-Math.max(-9,Math.min(9,p.x*.48)))<.02&&Math.abs(w.cameraTarget.z-Math.max(-10,Math.min(10,p.z*.48)))<.02;});
  viewpoint.render=await page.evaluate(()=>{const w=window.__EDEN_BEFORE__.world;return{cameraTarget:w.cameraTarget.toArray(),cameraPosition:w.camera.position.toArray(),drawCalls:w.renderer.info.render.calls,triangles:w.renderer.info.render.triangles,assetErrors:[...w.assetErrors]};});
  assert.deepEqual(viewpoint.render.assetErrors,[]);await capture(label);report.viewpoints.push(viewpoint);
 }
 report.overview=await page.evaluate(()=>{const f=window.__EDEN_BEFORE__,w=f.world;cancelAnimationFrame(f.frame);w.labels.style.display='none';const b=w.getBounds(),span=Math.max(b.maxX-b.minX,b.maxZ-b.minZ)*1.5,aspect=innerWidth/innerHeight;w.camera.left=-span*aspect/2;w.camera.right=span*aspect/2;w.camera.top=span/2;w.camera.bottom=-span/2;w.camera.position.set(45,60,55);w.camera.lookAt(0,0,0);w.camera.updateProjectionMatrix();w.renderer.render(w.scene,w.camera);return{inspectionOnly:true,labelsHidden:true,cameraPosition:w.camera.position.toArray(),span,frustum:[w.camera.left,w.camera.right,w.camera.top,w.camera.bottom]};});
 await capture('overview');
 report.cleanup=await page.evaluate(()=>{const f=window.__EDEN_BEFORE__,errors=[...f.world.assetErrors];f.world.dispose();delete window.__EDEN_BEFORE__;return{assetErrors:errors,storageKeys:Object.keys(localStorage)};});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.cleanup.assetErrors,[]);assert.deepEqual(report.cleanup.storageKeys,[]);
 for(const[path,expected]of Object.entries(sourceHashes))assert.equal(hash(await readFile(new URL(path,root))),expected,`Source changed during capture:${path}`);
 report.passed=true;
} catch(error){report.failure=error.stack||String(error);process.exitCode=1;console.error(report.failure);}finally{await browser?.close();await writeFile(new URL('docs/qa/eden-immersion-before-report.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,captures:report.screenshots.length,failure:report.failure}));}

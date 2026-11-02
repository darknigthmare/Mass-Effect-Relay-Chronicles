import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// A dedicated read-only material fixture, independent of the app's in-flight
// geometry changes. Two actual Three.js planes each repeat one native image3x3.
const root = new URL('../', import.meta.url), sha = data => createHash('sha256').update(data).digest('hex');
const files = { '/vendor/three.module.js': 'node_modules/three/build/three.module.js',
  '/vendor/three.core.js': 'node_modules/three/build/three.core.js',
  '/assets/eden-ground-grass.png': 'public/assets/eden-ground-grass.png',
  '/assets/eden-ground-dirt.png': 'public/assets/eden-ground-dirt.png' };
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Eden terrain material fixture</title>
<style>html,body{margin:0;background:#101a23;color:#dae6df;font:16px sans-serif;overflow:hidden}canvas{display:block}header{position:absolute;left:24px;right:24px;top:16px;display:flex;justify-content:space-around;pointer-events:none}span{background:#101a23;padding:8px 14px;border:1px solid #43534b}</style></head>
<body><header><span>Prairie · répétition3×3</span><span>Terre · répétition3×3</span></header>
<script type="module">
import * as THREE from '/vendor/three.module.js';
const renderer = new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#101a23');
const camera=new THREE.OrthographicCamera(-9.6,9.6,5,-5,.1,100);camera.up.set(0,0,-1);camera.position.set(0,16,0);camera.lookAt(0,0,0);
const loader=new THREE.TextureLoader(),textures={};
for(const [index,key] of ['grass','dirt'].entries()){
 const texture=await loader.loadAsync('/assets/eden-ground-'+key+'.png');texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.anisotropy=4;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({map:texture,color:0xffffff,toneMapped:false}));
 mesh.rotation.x=-Math.PI/2;mesh.position.x=index===0?-4.35:4.35;scene.add(mesh);textures[key]=texture;
}
function draw(){renderer.render(scene,camera);}
window.__TERRAIN_MATERIAL_FIXTURE__={ready:true,view:'flat',render:draw,oblique(){camera.up.set(0,1,0);camera.position.set(10,17,17);camera.lookAt(0,0,0);camera.left=-10.5;camera.right=10.5;camera.top=6;camera.bottom=-6;camera.updateProjectionMatrix();this.view='oblique';draw();},observe(){return{view:this.view,revision:THREE.REVISION,planes:scene.children.filter(item=>item.isMesh).length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:Object.fromEntries(Object.entries(textures).map(([key,t])=>[key,{width:t.image.width,height:t.image.height,src:t.image.src,repeat:t.repeat.toArray(),wrapS:t.wrapS,wrapT:t.wrapT,colorSpace:t.colorSpace}]))};}};
draw();
</script></body></html>`;
const sourceHashes = {};
for (const path of ['scripts/check-eden-immersion-terrain-browser.mjs', ...Object.values(files)]) sourceHashes[path] = sha(await readFile(new URL(path, root)));
const report = { passed: false, generatedAt: new Date().toISOString(), baselineCommit: '533efaa2ca88c34be21eb53aa30fafcfedd79707',
  scope: 'Dedicated material-only WebGL fixture on Three.js0.180.0: two real planes each display their native image with RepeatWrapping and3x3 UV repeats. Flat and oblique captures are inspected separately. This does not prove whole-level integration, PBR correctness, exact edge continuity or original-game fidelity.',
  sourceHashes, viewport: {width:1536,height:800}, captures: [], servedResources: [], errors: [], failedRequests: [], observations: [] };
await mkdir(new URL('docs/screenshots/', root), {recursive:true});
let browser;
const bodies = Object.fromEntries(await Promise.all(Object.entries(files).map(async([url,path])=>[url,await readFile(new URL(path,root))])));
const server = http.createServer((request,response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') { response.writeHead(200, {'Content-Type':'text/html'}); response.end(html); return; }
  if (bodies[path]) { response.writeHead(200, {'Content-Type':path.endsWith('.png')?'image/png':'text/javascript'}); response.end(bodies[path]); return; }
  if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  response.writeHead(404); response.end();
});
try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  report.url=url;
  browser=await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',
    args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  report.chromium=browser.version();
  const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),reason:request.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});});
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__TERRAIN_MATERIAL_FIXTURE__?.ready);
  for(const [webPath,local] of Object.entries(files)){
    const response=await page.request.get(new URL(webPath,url).href),body=await response.body();
    assert.equal(response.status(),200);assert.equal(sha(body),sourceHashes[local]);
    report.servedResources.push({path:local,status:200,sha256:sha(body)});
  }
  for(const view of ['flat','oblique']){
    if(view==='oblique')await page.evaluate(()=>window.__TERRAIN_MATERIAL_FIXTURE__.oblique());
    else await page.evaluate(()=>window.__TERRAIN_MATERIAL_FIXTURE__.render());
    const observation=await page.evaluate(()=>window.__TERRAIN_MATERIAL_FIXTURE__.observe());
    assert.equal(observation.revision,'180');assert.equal(observation.planes,2);assert.equal(observation.drawCalls,2);assert.equal(observation.triangles,4);
    for(const texture of Object.values(observation.textures)){
      assert.equal(texture.width,1254);assert.equal(texture.height,1254);assert.deepEqual(texture.repeat,[3,3]);assert.equal(texture.wrapS,1000);assert.equal(texture.wrapT,1000);assert.equal(texture.colorSpace,'srgb');
    }
    report.observations.push(observation);
    const path=`docs/screenshots/eden-immersion-terrain-${view}-3x3.png`;
    const image=await page.screenshot({path:fileURLToPath(new URL(path,root))});
    report.captures.push({path,bytes:image.length,sha256:sha(image),view});
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
  report.passed=true;
} catch(error) { report.errors.push(error.stack||String(error)); process.exitCode=1; }
finally { if(browser)await browser.close();await new Promise(resolve=>server.close(resolve)); }
await writeFile(new URL('docs/qa/eden-immersion-terrain-browser-report.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,captures:report.captures.length,errors:report.errors,failedRequests:report.failedRequests}));

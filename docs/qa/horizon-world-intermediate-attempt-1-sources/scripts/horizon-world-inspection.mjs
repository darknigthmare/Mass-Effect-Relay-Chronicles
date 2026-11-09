import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir,access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=new URL('../',import.meta.url),entry=process.env.GAME_URL||'http://127.0.0.1:4181',prefix=process.env.HORIZON_INSPECTION_PREFIX||'horizon-world-intermediate';
assert.match(prefix,/^horizon-[a-z0-9-]+$/);const sha=b=>createHash('sha256').update(b).digest('hex'),output=`docs/qa/${prefix}.json`;
try{await access(new URL(output,root));throw Error('Choose a fresh HORIZON_INSPECTION_PREFIX; preserve previous evidence.');}catch(e){if(e.code!=='ENOENT')throw e;}
const paths=['src/world.js','src/world-data.js','src/level-layout-data.js','src/horizon-layout-data.js','src/horizon-scene.js','src/horizon-characters.js','src/horizon-enemies.js','src/horizon-fauna.js','src/horizon-fleet.js','src/game-data.js','src/operation-data.js','src/operations.js','src/world-navigation.js','vite.config.js','scripts/horizon-world-inspection.mjs'];
const report={passed:false,at:new Date().toISOString(),url:entry,command:{script:'node scripts/horizon-world-inspection.mjs',environment:{GAME_URL:entry,HORIZON_INSPECTION_PREFIX:prefix}},sourceHashes:Object.fromEntries(await Promise.all(paths.map(async p=>[p,sha(await readFile(new URL(p,root)))]))),
 scope:'Detached native WorldView viewpoints at actual legal party positions, source-based campaign fixtures and the normal steady camera focus. No CSS/geometry/pose injection; this is inspection, not a public campaign traversal or performance certification.',captures:[],views:[],errors:[],failedRequests:[]};
let browser,page;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failedRequests.push(r.url()));
 const url=entry+'/__horizon-world-inspection__';await page.route(url,route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><div id="world" style="width:100vw;height:100vh;position:relative"></div><script type="module">
 import '/@vite/client';import {WorldView}from'/src/world.js';import{newGame,winEncounter,completeZone,recruit,zoneEncounters}from'/src/state.js';import{recordVisit}from'/src/story.js';import{advanceOperation}from'/src/operations.js';import{actorFor,enemiesFor}from'/src/game-data.js';import{createBattle}from'/src/combat.js';
 const w=new WorldView(document.querySelector('#world'));window.__HORIZON_INSPECT__={w,actorFor,enemiesFor,createBattle};
 window.__HORIZON_INSPECT__.prepare=zone=>{const s=newGame({name:'Fixture Horizon',difficulty:'story',mode:'wait'});s.flags.briefed=true;const go=z=>{s.zone=z;recordVisit(s,z);};const finish=(z,c=null)=>{go(z);for(const id of zoneEncounters(z)){if(!winEncounter(s,id))throw Error('Bad native win:'+id);}if(!completeZone(s,z,c))throw Error('Bad native complete:'+z);};finish('eden-prime');go('citadel');for(const id of ['garrus','tali','wrex'])recruit(s,id);completeZone(s,'citadel');
 if(['virmire','ilos','citadel-finale'].includes(zone)){finish('therum');finish('feros','save');}if(['ilos','citadel-finale'].includes(zone)){finish('noveria','release');finish('virmire','save-kaidan');}if(zone==='citadel-finale')finish('ilos');go(zone);s.party=['shepard','garrus','tali'];
 if(zone==='feros'){const result=advanceOperation(s,'feros-varrens','request','accept');if(!result.ok)throw Error(result.reason);}
 w.setBattle(null);w.setStoryContext({...s,visitedZones:s.story.visitedZones});w.setZone(zone,{party:s.party,cleared:s.cleared});w.setMode('explore');window.__HORIZON_INSPECT__.s=s;return s;};
 </script></body></html>`}));await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>{const w=window.__HORIZON_INSPECT__?.w;return w&&['crew','enemy','boss','props','npc','vehicles','walk','frontier-npcs','frontier-enemies','horizon-npcs','horizon-enemies','horizon-fauna','horizon-fleet-me1'].every(key=>w.atlases[key]);});
 async function capture(label,goal,battleIndex=null){const view=await page.evaluate(({goal,battleIndex})=>{const f=window.__HORIZON_INSPECT__,w=f.w;
   w.setPosition(goal||w.zone.spawn);if(battleIndex!==null){f.battle=f.createBattle({party:f.s.party.map(id=>f.actorFor(id,f.s)),enemies:f.enemiesFor(w.zoneId,battleIndex,f.s),mode:'wait',seed:2183});w.setBattle(f.battle);w.setMode('combat');}
   for(let i=0;i<100;i++)w.update(.05);w.camera.updateMatrixWorld();
   const result={zone:w.zoneId,position:w.getPosition(),focus:w.cameraTarget.toArray(),walkable:w._walkable(w.player.x,w.player.z),bounds:w.zone.bounds,metrics:w.horizonSceneMetrics||null,
    fleet:[...w.horizonFleetViews.values()].map(v=>({id:v.id,visible:v.mesh.visible,frameId:v.frameId,position:v.mesh.position.toArray()})),
    ambient:w.ambientActors.filter(a=>a.conversationId||a.faunaId).map(a=>({id:a.id,visible:a.group.visible,frame:a.animationFrame,position:a.group.position.toArray()})),
    battle:[...w.battleActors.values()].map(a=>({id:a.id,key:a.key,position:a.group.position.toArray(),height:a.height,frame:a.animationFrame})),assetErrors:[...w.assetErrors]};return result;},{goal,battleIndex});
   assert.equal(view.walkable,true);assert.deepEqual(view.assetErrors,[]);const path=`docs/screenshots/${prefix}-${label}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root))});report.captures.push({path,sha256:sha(bytes),bytes:bytes.length});report.views.push({label,...view});}
 for(const zone of ['feros','ilos']){
   await page.evaluate(z=>window.__HORIZON_INSPECT__.prepare(z),zone);const rooms=await page.evaluate(()=>window.__HORIZON_INSPECT__.w.levelLayout.rooms);
   for(const room of rooms)await capture(`${zone}-${room.id}`,room.center);
 }
 for(const[zone,id]of [['eden-prime','normandy-sr1'],['therum','geth-dropship'],['citadel','destiny-ascension'],['citadel-finale','sovereign']]){
   await page.evaluate(z=>window.__HORIZON_INSPECT__.prepare(z),zone);await capture(`fleet-${id}`);assert.ok(report.views.at(-1).fleet.some(v=>v.id===id&&v.visible),id);
 }
 for(const[zone,index]of [['feros',0],['virmire',1]]){
   await page.evaluate(z=>window.__HORIZON_INSPECT__.prepare(z),zone);const goal=await page.evaluate(i=>window.__HORIZON_INSPECT__.w.levelLayout.pois[`encounter-${i+1}`],index);await capture(`heavy-${zone}`,goal,index);
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);for(const[p,d]of Object.entries(report.sourceHashes))assert.equal(sha(await readFile(new URL(p,root))),d,`Source changed:${p}`);report.passed=true;
}catch(e){report.failure=e.stack||String(e);process.exitCode=1;}finally{await browser?.close();await mkdir(new URL('docs/qa/',root),{recursive:true});await writeFile(new URL(output,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,captures:report.captures.length,failure:report.failure}));}

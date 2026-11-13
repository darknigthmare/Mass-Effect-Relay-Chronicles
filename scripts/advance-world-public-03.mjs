// One immutable public-control collector for development and literal production.
// Prepared save fixtures are declared below. No app getters, state/clock/cadence
// injection, DOM writes, QA mode or source-module imports in the browser.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave, winEncounter, completeZone, recruit, zoneEncounters } from '../src/state.js';
import { normalizeMissionProgress, advanceMission } from '../src/mission-progress.js';
import { recordVisit } from '../src/story.js';
import { WORLD_ZONES, getWorldArrival } from '../src/world-data.js';
import { CHAPTERS } from '../src/game-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { createCombatGeometry } from './completion-combat-geometry.mjs';

const root = new URL('../',import.meta.url), mode = process.env.ADVANCE_WORLD_MODE || 'development';
const prefix = process.env.ADVANCE_WORLD_PREFIX, entry = new URL(process.env.GAME_URL || `http://127.0.0.1:${mode==='production'?4198:4197}/`);
assert.ok(['development','production'].includes(mode));assert.match(prefix||'',/^advance-world-[a-z0-9-]+$/);assert.equal(entry.search,'');
const output = new URL(`docs/qa/${prefix}-report.json`,root);
try { await access(output);throw Error('Choose a new report prefix; previous attempts are immutable.'); } catch(error) { if(error.code!=='ENOENT')throw error; }
const sha = value => createHash('sha256').update(value).digest('hex');
const report = { provenance:[{path:'scripts/advance-world-public-02.mjs',role:'Immutable QA02 predecessor'},{path:'docs/qa/advance-world-dev-03-report.json',role:'Positive DEV03 on the frozen product'},{path:'docs/qa/advance-world-production-final-01-report.json',role:'Negative PROD01: arrival was observed between two separate DOM reads before a movement assertion'}], oracleChanges:'Read public radar and interaction in one synchronous DOM observation, honor actual arrival before the displacement assertion, and retain the subsequent actual-export distance/refusal checks. Product and tests unchanged.', passed:false, at:new Date().toISOString(), baselineCommit:'d2e8432ec4057890b6f86e42ce596f1ab5810148', mode, url:entry.href,
  command:{script:'node scripts/advance-world-public-03.mjs',environment:{GAME_URL:entry.href,ADVANCE_WORLD_MODE:mode,ADVANCE_WORLD_PREFIX:prefix}},
  scope:'Locked destination inspection and hierarchy, local map follow after a real six-second charge, all eight extraction/deployment pairs, real eight-second retreat boundary with paused wall time.',
  sourceHashes:{},registryContextHashes:{},distFiles:{},httpVerified:[],sourceRequests:[],fixtures:[],exports:[],captures:[],checks:[],observations:[],
  errors:[],consoleErrors:[],failedRequests:[],resourceWarnings:[],
  limitations:['Prepared native progression, starting positions and earlier victories are fixtures, not browser-earned campaign play.',
    'Each extraction/deployment pair starts at its declared exit fixture. Travel between a landing point and that exit is covered by native dressed-geometry path tests, not claimed walked here.',
    'Geometry, distances, encounters and countdowns describe the retained ME1 ATB adaptation; no original map plan, artistic fidelity or device performance is certified.',
    'Recovery is a runtime foreground-terrain rule. This collector does not claim recovery persistence across quit/reload.'] };
let browser,page;
const action=(name,id)=>page.locator(`[data-do="${name}"]${id?`[data-id="${id}"]`:''}`).first();
async function click(locator) { await locator.waitFor({state:'visible'});assert.equal(await locator.isEnabled(),true);await locator.click(); }
const check=name=>{report.checks.push({name,passed:true});console.log(JSON.stringify({check:name}));};
async function tree(directory,relative='') {
  const files={};for(const item of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const name=relative+item.name,target=new URL(item.name+(item.isDirectory()?'/':''),directory);
    if(item.isDirectory())Object.assign(files,await tree(target,name+'/'));
    else {const bytes=await readFile(target);files[name]={bytes:bytes.length,sha256:sha(bytes)};}
  }return files;
}
async function sources() {
  const files=['package.json','package-lock.json','scripts/advance-world-public-03.mjs','scripts/completion-combat-geometry.mjs','tests/advance-world.test.js',
    ...(await readdir(new URL('src/',root))).filter(name=>/\.(js|css)$/.test(name)&&(mode==='production'||name!=='universe-data.js')).map(name=>`src/${name}`)];
  return Object.fromEntries(await Promise.all(files.sort().map(async path=>[path,sha(await readFile(new URL(path,root)))])));
}
async function contextHashes() { return Object.fromEntries(await Promise.all(['docs/content-catalog.json','src/universe-data.js'].map(async path=>[path,sha(await readFile(new URL(path,root)))]))); }
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();await page.locator('#transition.active').waitFor({state:'hidden'});
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({state:'hidden'});
}
async function noHarness() {
  assert.deepEqual(await page.evaluate(()=>({own:Object.hasOwn(window,'__RELAY_TEST__'),type:typeof window.__RELAY_TEST__,vite:!!document.querySelector('script[src*="/@vite/client"]')})),
    {own:false,type:'undefined',vite:mode==='development'});
}
async function capture(label) {
  const path=`docs/screenshots/${prefix}-${label}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root)),animations:'disabled'});
  report.captures.push({label,path,sha256:sha(bytes),bytes:bytes.length,source:'Actual public viewport; no DOM/style/pose writes or forced cadence.'});
}
async function fixture(state,label,origin) {
  const path=`docs/qa/${prefix}-${label}-fixture.json`,bytes=Buffer.from(encodeSave(state));assert.ok(decodeSave(bytes.toString()),label);
  await writeFile(new URL(path,root),bytes);const record={label,path,sha256:sha(bytes),origin,position:state.position,zone:state.zone,importedViaPublicChooser:false};
  report.fixtures.push(record);return {bytes,record};
}
async function imported(value) {
  if(!await action('import').isVisible()) {await ready();await page.keyboard.press('Escape');await click(action('quit'));}
  const [chooser]=await Promise.all([page.waitForEvent('filechooser'),click(action('import'))]);
  await chooser.setFiles({name:value.record.path.split('/').at(-1),mimeType:'application/json',buffer:value.bytes});value.record.importedViaPublicChooser=true;
  await ready();await noHarness();
}
async function exported(label,{paused=false,keepOpen=false}={}) {
  if(!paused){await ready();await page.keyboard.press('Escape');}await page.locator('.pause-screen').waitFor();await click(action('save'));
  const [download]=await Promise.all([page.waitForEvent('download'),click(action('export'))]);
  const path=`docs/qa/${prefix}-${label}-export.json`;await download.saveAs(fileURLToPath(new URL(path,root)));assert.equal(await download.failure(),null);
  const bytes=await readFile(new URL(path,root)),state=decodeSave(bytes.toString());assert.ok(state);
  report.exports.push({label,path,sha256:sha(bytes),observed:{zone:state.zone,position:state.position,playedSeconds:state.playedSeconds,xp:state.xp,credits:state.credits,medigel:state.medigel,cleared:state.cleared}});
  if(!keepOpen){await click(action('close'));await ready();}return state;
}
function prepared(target,encounters=0) {
  const state=newGame({name:'QA Navigation',difficulty:'story',mode:'wait'});state.flags.briefed=true;
  const decisions={feros:'save',noveria:'release',virmire:'save-kaidan'};
  for(const zone of ['eden-prime','citadel','therum','feros','noveria','virmire','ilos']) {
    state.zone=zone;recordVisit(state,zone);if(zone==='citadel')assert.equal(recruit(state,'tali'),true);
    for(const id of zoneEncounters(zone).slice(0,zone===target?encounters:3))assert.equal(winEncounter(state,id),true,id);
    if(zone===target)break;assert.equal(completeZone(state,zone,decisions[zone]??null),true,zone);
  }
  state.missionProgress=normalizeMissionProgress(undefined,state);
  // Native old-save migration is declared preparation, never a browser write.
  delete state.campaignProgress;
  const decoded=decodeSave(encodeSave(state));assert.ok(decoded,'prepared progression must import');return decoded;
}
async function allNaturallyReady() {
  const deadline=Date.now()+90000;
  while(Date.now()<deadline) {
    const party=await page.locator('#battle-ui .battle-member').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.id,atb:parseFloat(node.querySelector('[data-stat="atb"]').style.width),hp:node.querySelector('[data-stat="hp-label"]').textContent,held:node.querySelector('[data-stat="heat-summary"]').textContent.includes('Jauge réservée'),ready:node.classList.contains('ready')})));
    assert.equal(party.length,3);assert.ok(party.every(actor=>parseFloat(actor.hp)>0));
    if(party.every(actor=>actor.ready&&actor.atb>=99.999))return;
    const available=party.find(actor=>actor.ready&&actor.atb>=99.999&&!actor.held);
    if(available){await click(action('battle-actor',available.id));await click(action('coord-reserve'));}
    await page.waitForTimeout(120);
  }throw Error('Natural full-gauge retreat readiness timed out.');
}
const stable=state=>{const copy=structuredClone(state);delete copy.playedSeconds;return copy;};
async function approachContact(start,target,fixtureState) {
  const native=createCombatGeometry('eden-prime',{state:fixtureState}),bounds=WORLD_ZONES['eden-prime'].bounds;
  const projection=levelMapProjection(bounds),radar=levelMapProjection(bounds,{left:12,top:12,width:126,height:126});
  const side={x:27/Math.hypot(23,27),z:-23/Math.hypot(23,27)},up={x:-23/Math.hypot(23,27),z:-27/Math.hypot(23,27)};
  const samples=[];report.observations.push({kind:'adaptive-public-keyboard-approach',initialPositionFromActualExport:start,samples,
    readBoundary:'Actual local-map player position, native collision footprints drawn by that public map, actual radar displacement and actual interaction availability. No private application state.'});
  const mapPosition=async()=>{
    const style=await page.locator('.map-player').getAttribute('style'),x=Number(/left:([^%]+)%/.exec(style)[1]),z=Number(/top:([^%]+)%/.exec(style)[1]);
    return {x:bounds.minX+(x-projection.originX)/projection.scale,z:bounds.minZ+(z-projection.originZ)/projection.scale};
  };
  const fieldSnapshot=async()=>{
    const snapshot=await page.evaluate(()=>{
      const marker=document.querySelector('.minimap svg > circle[r="3.5"]');
      if(!marker)return null;
      return {x:Number(marker.getAttribute('cx')),z:Number(marker.getAttribute('cy')),
        interaction:document.querySelector('#hud .interaction')?.textContent||''};
    });
    assert.ok(snapshot,'Public radar must remain present');
    return {position:{x:bounds.minX+(snapshot.x-radar.originX)/radar.scale,z:bounds.minZ+(snapshot.z-radar.originZ)/radar.scale},
      interaction:snapshot.interaction};
  };
  await page.keyboard.press('KeyM');let current=await mapPosition();assert.ok(Math.hypot(current.x-start.x,current.z-start.z)<.001);
  const footprints=await page.locator('.local-map-board .map-collisions [data-map-obstacle]').evaluateAll(nodes=>nodes.map(node=>node.tagName.toLowerCase()==='circle'
    ?{kind:'circle',x:Number(node.getAttribute('cx')),z:Number(node.getAttribute('cy')),radius:Number(node.getAttribute('r'))}
    :{kind:'rect',minX:Number(node.getAttribute('x')),minZ:Number(node.getAttribute('y')),maxX:Number(node.getAttribute('x'))+Number(node.getAttribute('width')),maxZ:Number(node.getAttribute('y'))+Number(node.getAttribute('height'))}));
  assert.ok(footprints.length>10);
  // Outside the browser only: undo the public footprint's .36 foot clearance
  // because the native planner applies that same clearance itself.
  native.colliders=footprints.map(solid=>solid.kind==='circle'?{...solid,radius:solid.radius-.36}
    :{...solid,minX:solid.minX+.36,minZ:solid.minZ+.36,maxX:solid.maxX-.36,maxZ:solid.maxZ-.36});
  const clear=(from,to)=>{const count=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.1));for(let i=1;i<=count;i++)if(!native._walkable(from.x+(to.x-from.x)*i/count,from.z+(to.z-from.z)*i/count))return false;return true;};
  for(let attempt=0;attempt<30;attempt++) {
    current=await mapPosition();native.setPosition(current);const path=native._pathTo(target);assert.ok(path?.length,'Native dressed path from the public map position');
    const candidates=path.filter(point=>Math.hypot(point.x-current.x,point.z-current.z)<=3&&clear(current,point));
    const waypoint=candidates.at(-1)||path[0],dx=waypoint.x-current.x,dz=waypoint.z-current.z,directions=[];
    for(const [right,forward] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const x=side.x*right+up.x*forward,z=side.z*right+up.z*forward,length=Math.hypot(x,z);
      if(clear(current,{x:current.x+x/length*.8,z:current.z+z/length*.8}))directions.push({right,forward,score:(dx*x+dz*z)/length});
    }
    assert.ok(directions.length);const best=directions.sort((a,b)=>b.score-a.score)[0],keys=[];
    if(best.right)keys.push(best.right>0?'KeyD':'KeyA');if(best.forward)keys.push(best.forward>0?'KeyW':'KeyS');
    await click(action('close'));await ready();const initial=await fieldSnapshot(),before=initial.position;
    if(initial.interaction.includes(target.label)){samples.push({keys:[],waypoint,before,actualRadarPosition:before,interaction:initial.interaction,arrived:true});return;}
    for(const key of keys)await page.keyboard.down(key);
    let observed=before,arrived=false,interaction='';const deadline=Date.now()+10000;
    try {
      while(Date.now()<deadline) {
        await page.waitForTimeout(70);const snapshot=await fieldSnapshot();observed=snapshot.position;interaction=snapshot.interaction;
        if(interaction.includes(target.label)){arrived=true;break;}
        if(Math.hypot(observed.x-before.x,observed.z-before.z)>=.5)break;
      }
    } finally {for(const key of keys.toReversed())await page.keyboard.up(key);}
    samples.push({keys,waypoint,before,actualRadarPosition:observed,interaction,arrived});
    if(arrived)return;
    assert.ok(Math.hypot(observed.x-before.x,observed.z-before.z)>.03,'Held-key gesture must produce actual public radar movement unless the actual public contact was reached');
    await page.keyboard.press('KeyM');
  }throw Error('Adaptive keyboard navigation did not reach the public encounter interaction.');
}

try {
  for(const artifact of report.provenance)artifact.sha256=sha(await readFile(new URL(artifact.path,root)));
  report.sourceHashes=await sources();report.sourceSHA=sha(JSON.stringify(report.sourceHashes));report.registryContextHashes=await contextHashes();
  if(mode==='production')report.distFiles=await tree(new URL('dist/',root));
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.setDefaultTimeout(60000);
  page.on('pageerror',error=>report.errors.push(error.message));page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),reason:request.failure()?.errorText}));
  page.on('request',request=>{if(/\/(?:src|@vite|@fs)\//.test(new URL(request.url()).pathname))report.sourceRequests.push(request.url());});
  page.on('response',response=>{if(response.status()>=400)(response.status()===404&&new URL(response.url()).pathname==='/favicon.ico'?report.resourceWarnings:report.failedRequests).push({url:response.url(),status:response.status()});});
  page.on('console',message=>{if(message.type()!=='error')return;const value={text:message.text(),location:message.location()};
    if(value.location.url&&new URL(value.location.url).pathname==='/favicon.ico'&&value.text==='Failed to load resource: the server responded with a status of 404 (Not Found)')report.resourceWarnings.push(value);else report.consoleErrors.push(value);});
  await page.goto(entry.href,{waitUntil:'domcontentloaded'});await action('title-settings').waitFor();await noHarness();
  await click(action('title-settings'));await page.locator('#completion-quality').selectOption('economy');
  assert.equal(await page.locator('body').getAttribute('data-display-quality'),'economy');await click(action('close'));
  report.displayPreference={quality:'economy',source:'Actual title Options select; no renderer/clock/cadence injection.'};

  const beginning=newGame({name:'QA Navigation',difficulty:'story'});beginning.flags.briefed=true;beginning.position={...WORLD_ZONES.normandy.spawn};
  await imported(await fixture(beginning,'locked-destinations','Native newGame Story/Wait with briefing flag and Normandy position; earlier briefing is prepared.'));
  await page.keyboard.press('KeyG');await click(page.locator('.starmap [data-do="planet"][data-id="virmire"]'));
  assert.match(await page.locator('.planet-detail .status').innerText(),/deux enquêtes.*0\/2/s);assert.equal(await action('travel','virmire').isEnabled(),false);
  assert.equal(await page.locator('.galaxy-directory>details').count(),8);await capture('locked-destination-hierarchy');await click(action('close'));
  check('SYS-carte-galactique: real locked Virmire inspection exposes prerequisites; the cluster/system directory remains keyboard-accessible and deployment disabled.');

  const charge=prepared('eden-prime',2);assert.equal(advanceMission(charge,'eden-prime','start').ok,true);
  const chargeWorld=createCombatGeometry('eden-prime',{state:charge}),firstCharge=chargeWorld.getInteractivePOIs().find(poi=>poi.id==='mission:eden-prime:charge-1');assert.ok(firstCharge);charge.position={x:firstCharge.x,z:firstCharge.z};
  await imported(await fixture(charge,'map-step','Native first two Eden win callbacks and mission start; exact dressed first-charge anchor. No charge was disarmed in preparation.'));
  await page.keyboard.press('KeyM');assert.ok(await page.locator('[data-map-obstacle]').count()>10);
  await click(page.locator('.map-locations [data-do="track"][data-id="mission:eden-prime:charge-1"]'));await ready();
  await page.keyboard.press('KeyM');await click(action('map-filter','contacts'));
  assert.match(await page.locator('[data-map-tracked]').innerText(),/masqué par le filtre/);await capture('map-follow-hidden-by-filter');await click(action('close'));
  await page.keyboard.press('KeyE');await page.locator('[data-mission-choice="disarm"]').waitFor();await click(page.locator('[data-mission-choice="disarm"]'));
  await page.locator('#toasts .toast').filter({hasText:`${firstCharge.label} neutralisée.`}).last().waitFor({timeout:20000});
  await page.keyboard.press('KeyM');await click(action('map-filter','campaign'));
  assert.equal(await page.locator('[data-map-tracked]').getAttribute('data-map-tracked'),'mission:eden-prime:charge-2');
  assert.equal(await page.locator('[data-do="track"][data-id="mission:eden-prime:charge-1"]').count(),0);
  assert.ok(await page.locator('[data-do="track"][data-id="eden-prime:exit"]').count()>0);await capture('map-follow-after-real-charge');await click(action('close'));
  check('SYS-carte-locale: real collision footprints, filter-hidden follow and a naturally disarmed charge advance the selected marker to the next step.');

  const unlocked=prepared('citadel-finale');
  for(const zone of Object.keys(CHAPTERS)) {
    const state=structuredClone(unlocked);state.zone=zone;recordVisit(state,zone);state.position={...WORLD_ZONES[zone].pois.find(poi=>poi.id===`${zone}:exit`)};state.position={x:state.position.x,z:state.position.z};
    await imported(await fixture(state,`exit-${zone}`,'All earlier unlocks use native win/complete callbacks with explicit old-save migration. This pair starts at its declared extraction point; the path from landing to exit is not claimed walked.'));
    await page.keyboard.press('KeyE');await page.locator('.dialogue').waitFor();await click(page.locator('.choice').filter({hasText:'Extraction.'}));await ready();
    assert.equal(await page.locator('#hud .location h2').innerText(),'Normandy SR-1');
    if(zone==='eden-prime')await capture('bidirectional-return-normandy');
    await page.keyboard.press('KeyG');await click(page.locator(`.starmap [data-do="planet"][data-id="${zone}"]`));await click(action('travel',zone));await ready();
    assert.equal(await page.locator('#hud .location .sub').textContent(),CHAPTERS[zone].subtitle);
    await page.keyboard.press('KeyM');const style=await page.locator('.map-player').getAttribute('style'),arrival=getWorldArrival(zone,'normandy'),bounds=WORLD_ZONES[zone].bounds,
      projection=getLevelLayout(zone)?levelMapProjection(bounds):{x:value=>5+(value-bounds.minX)/(bounds.maxX-bounds.minX)*90,z:value=>5+(value-bounds.minZ)/(bounds.maxZ-bounds.minZ)*90};
    assert.ok(style.includes(`left:${projection.x(arrival.x)}%`));assert.ok(style.includes(`top:${projection.z(arrival.z)}%`));await click(action('close'));
    await page.waitForTimeout(350);assert.equal(await page.locator('#overlay .dialogue').count(),0);assert.equal(await page.locator('#hud .location .sub').textContent(),CHAPTERS[zone].subtitle);
    report.observations.push({kind:'bidirectional-link',zone,extractionTo:'normandy',deploymentFrom:'normandy',actualMapPlayerStyle:style,expectedArrival:arrival,noInstantLoop:true});
  }
  check('QA-sortie-bidirectionnelle: all eight public extraction/deployment pairs arrive on their expected map anchor and remain in place without an instant loop.');

  const first={...WORLD_ZONES['eden-prime'].pois.find(poi=>poi.id==='eden-prime:encounter-1'),label:CHAPTERS['eden-prime'].encounterNames[0]},retreat=prepared('eden-prime');retreat.position={x:first.x,z:first.z};
  await imported(await fixture(retreat,'retreat-boundary','Native newGame Story/Wait, briefing, Eden visit and first-contact position. No HP, ATB or timer edits; battle readiness is acquired publicly.'));
  await page.keyboard.press('KeyE');await page.locator('.battle-member').first().waitFor();await allNaturallyReady();await click(action('battle-retreat'));
  await page.locator('.dialogue').waitFor();await click(page.locator('.choice').filter({hasText:'Confirmer le repli.'}));await ready();
  const retreated=await exported('retreated');assert.equal(retreated.xp,retreat.xp);assert.equal(retreated.credits,retreat.credits);assert.deepEqual(retreated.cleared,retreat.cleared);
  const clearances=WORLD_ZONES['eden-prime'].pois.filter(poi=>poi.type==='encounter').map(poi=>({id:poi.id,distance:Math.hypot(retreated.position.x-poi.x,retreated.position.z-poi.z)}));assert.ok(clearances.every(item=>item.distance>=5));
  await approachContact(retreated.position,first,retreat);await page.keyboard.press('KeyE');await page.locator('#toasts .toast').filter({hasText:'Repli en cours'}).last().waitFor();
  assert.equal(await page.locator('.battle-member').count(),0);await page.keyboard.press('Escape');
  const denied=await exported('reentry-denied',{paused:true,keepOpen:true});assert.ok(denied.playedSeconds-retreated.playedSeconds<8);assert.ok(Math.hypot(denied.position.x-first.x,denied.position.z-first.z)<2.65);
  const remainingBeforePause=Number(await page.locator('[data-recovery-remaining]').getAttribute('data-recovery-remaining'));assert.ok(remainingBeforePause>0);await capture('reentry-denied-paused');
  const pausedAt=Date.now();await page.waitForTimeout(8500);const stillPaused=await exported('reentry-paused',{paused:true,keepOpen:true});const pausedWallTimeMs=Date.now()-pausedAt;assert.deepEqual(stillPaused,denied);
  assert.equal(Number(await page.locator('[data-recovery-remaining]').getAttribute('data-recovery-remaining')),remainingBeforePause);
  await click(action('close'));await ready();await page.keyboard.press('KeyE');assert.equal(await page.locator('.battle-member').count(),0);
  const samples=[],deadline=Date.now()+20000;let entered=false;
  while(Date.now()<deadline) {
    const indicator=page.locator('[data-recovery-remaining]');
    if(await indicator.count()) {const remaining=Number(await indicator.getAttribute('data-recovery-remaining'));samples.push({remaining,wallTime:Date.now()});await page.keyboard.press('KeyE');}
    else {await page.keyboard.press('KeyE');if(await page.locator('.battle-member').count()){entered=true;break;}}
    await page.waitForTimeout(120);
  }
  assert.equal(entered,true);await capture('reentry-after-natural-eight-seconds');
  report.observations.push({kind:'real-eight-second-boundary',clearances,nearContact:denied.position,terrainSecondsBeforePause:denied.playedSeconds-retreated.playedSeconds,remainingBeforePause,pausedWallTimeMs,configuredPauseWaitMs:8500,pausedExportsIdentical:true,samples,naturalReentry:true,timerOrStateInjected:false});
  check('QA-fuite-et-reentree: safe actual retreat rejects near-contact re-entry before eight terrain seconds, preserves its delay across paused wall time, then naturally re-enters.');

  assert.deepEqual(await sources(),report.sourceHashes);report.sourceFrozen=true;assert.equal(sha(JSON.stringify(await sources())),report.sourceSHA);report.sourceSHAEnd=report.sourceSHA;
  assert.deepEqual(await contextHashes(),report.registryContextHashes);report.registryContextFrozenDuringRun=true;
  if(mode==='production') {
    assert.deepEqual(await tree(new URL('dist/',root)),report.distFiles);report.distFrozen=true;assert.deepEqual(report.sourceRequests,[]);
    for(const [path,expected] of Object.entries(report.distFiles)) {
      const response=await page.request.get(new URL(path,entry).href);assert.equal(response.status(),200,path);const bytes=await response.body();assert.equal(bytes.length,expected.bytes,path);assert.equal(sha(bytes),expected.sha256,path);report.httpVerified.push(path);
    }
    assert.deepEqual(await tree(new URL('dist/',root)),report.distFiles);report.httpAllDistFilesSameBytes=true;
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.failedRequests,[]);report.passed=true;
} catch(error) {
  report.failure=error.stack||String(error);if(page&&!page.isClosed())try{await capture('failure');}catch{}
} finally {
  if(browser)await browser.close();report.browserClosed=true;await writeFile(output,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({passed:report.passed,report:fileURLToPath(output),checks:report.checks.length,captures:report.captures.length,exports:report.exports.length,browserClosed:report.browserClosed,failure:report.failure}));
if(!report.passed)process.exitCode=1;

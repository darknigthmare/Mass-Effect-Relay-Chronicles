// Detached native renderer fixtures, never represented as a played campaign.
// Prepared preceding progression uses native callbacks; only the displayed ATB
// orders below are executed by this check. No win or reward is forced in browser.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { HORIZON_ENCOUNTER_CHANGES } from '../src/horizon-enemies.js';
const root = new URL('../', import.meta.url), entry = process.env.GAME_URL || 'http://127.0.0.1:4181';
const prefix = process.env.HORIZON_ENEMIES_QA_PREFIX || 'horizon-enemies-browser';
assert.match(prefix, /^horizon-enemies-[a-z0-9-]+$/);
const output = new URL(`docs/qa/${prefix}.json`, root);
try { await access(output); throw Error('Preserve the previous report and choose another HORIZON_ENEMIES_QA_PREFIX.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const hash = value => createHash('sha256').update(value).digest('hex');
const paths = ['src/world.js', 'src/world-data.js', 'src/game-data.js', 'src/horizon-enemies.js',
  'src/level-layout-data.js', 'src/frontier-enemies.js', 'src/combat.js', 'src/state.js', 'src/story.js', 'vite.config.js',
  'src/horizon-layout-data.js', 'src/horizon-scene.js',
  'public/assets/horizon-enemies.png', 'public/assets/horizon-enemies.json', 'public/assets/frontier-enemies.png', 'public/assets/frontier-enemies.json', 'scripts/horizon-enemies-browser.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await readFile(new URL(path, root)))])));
const report = { passed: false, at: new Date().toISOString(), url: entry, sourceHashes,
  scope: 'Five new bodies in six actual authored native formations, plus a retained Frontier Juggernaut and separate ambient guard. Actual native ATB orders in detached explicitly ready-ATB fixtures, not a campaign traversal or multi-pose family.',
  fixture: { party: ['shepard', 'garrus', 'tali'], precedingProgression: 'Native newGame/winEncounter/completeZone/recruit/recordVisit callbacks prepare each zone and earlier encounter; these preceding victories are not played.',
    enemyATB: 'Explicit100 fixture input at createBattle; no post-creation ATB edit.',
    camera: 'Native computed steady camera focus applied directly for inspection; no cinematic or continuous traversal claim.' },
  cases: [], captures: [], errors: [], failedRequests: [] };
let browser, page;
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.captures.push({ path, sha256: hash(bytes), bytes: bytes.length }); return path;
}
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(45000); page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  const routeURL = `${entry}/__horizon-enemies-qa__`;
  await page.route(routeURL, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="fr"><body style="margin:0;background:#071321"><div id="world" style="width:100vw;height:100vh;position:relative"></div><script type="module">
    import '/@vite/client';
    import {WorldView} from '/src/world.js';
    import {newGame,winEncounter,completeZone,recruit,zoneEncounters,encodeSave,decodeSave} from '/src/state.js';
    import {recordVisit} from '/src/story.js';
    import {actorFor,enemiesFor,ENCOUNTERS} from '/src/game-data.js';
    import {createBattle,performAction} from '/src/combat.js';
    import {HORIZON_ENEMY_IDS} from '/src/horizon-enemies.js';
    const prepare=(zone,index)=>{
      const state=newGame({difficulty:'story'});state.flags.briefed=true;
      const decisions={feros:'save',noveria:'release',virmire:'save-kaidan','citadel-finale':'save-council'};
      for(const step of ['eden-prime','citadel','therum','feros','noveria','virmire','ilos','citadel-finale']){
        state.zone=step;recordVisit(state,step);
        if(step==='citadel')for(const key of ['garrus','tali','wrex'])if(!recruit(state,key))throw Error('Recruit preparation failed');
        if(step===zone){for(let n=0;n<index;n++)if(!winEncounter(state,zoneEncounters(step)[n]))throw Error('Encounter preparation failed');break;}
        for(const id of zoneEncounters(step))if(!winEncounter(state,id))throw Error('Zone preparation failed');
        if(!completeZone(state,step,decisions[step]))throw Error('Completion preparation failed');
      }
      state.party=['shepard','garrus','tali'];if(!decodeSave(encodeSave(state)))throw Error('Prepared save invalid');return state;
    };
    window.__HORIZON_ENEMIES__={world:new WorldView(document.querySelector('#world')),prepare,actorFor,enemiesFor,ENCOUNTERS,createBattle,performAction,ids:HORIZON_ENEMY_IDS};
  </script></body></html>` }));
  await page.goto(routeURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__HORIZON_ENEMIES__?.world.atlases['horizon-enemies']);
  for (const { zone, index, after } of HORIZON_ENCOUNTER_CHANGES) {
    const observed = await page.evaluate(({ zone, index, after }) => {
      const f = window.__HORIZON_ENEMIES__, w = f.world, state = f.prepare(zone, index);
      f.state = state; f.snapshot = JSON.stringify(state); w.setBattle(null); w.setStoryContext(state); w.setZone(zone, { party: state.party, cleared: state.cleared });
      const suffix = index === 2 ? 'boss' : 'encounter-' + (index + 1), poi = w.zone.pois.find(poi => poi.id === zone + ':' + suffix);
      if(!poi)throw Error('Missing native encounter');w.setPosition(poi);
      f.battle=f.createBattle({party:state.party.map(key=>f.actorFor(key,state)),enemies:f.enemiesFor(zone,index,state).map(enemy=>({...enemy,atb:100})),mode:'wait',difficulty:'story',seed:2183});
      w.setBattle(f.battle);w.setMode('combat');w.cameraTarget.copy(w._cameraFocus(w.battleArena||w.zone.arena,'combat'));w.update(0);
      return {zone,index,expected:after,actual:f.battle.actors.filter(actor=>actor.team==='enemy').map(actor=>actor.id.replace(/-\d+$/,'')),
        sprites:f.battle.actors.filter(actor=>actor.team==='enemy').map(actor=>actor.sprite),
        context:{completed:[...state.completed],cleared:[...state.cleared],party:[...state.party],xp:state.xp},
        bodies:f.battle.actors.filter(actor=>actor.team==='enemy'&&(f.ids.includes(actor.sprite)||actor.sprite==='juggernaut')).map(entry=>{
          const actor=w.battleActors.get(entry.id),config=f.ids.includes(entry.sprite)?w.horizonEnemyConfig:w.frontierEnemyConfig,frame=config?.frames[entry.sprite],map=actor.body.material.map;
          if(!frame)throw Error('Missing normalized native frame');
          return{id:entry.id,key:entry.sprite,frameId:actor.animationFrame,source:map.image?.src,visible:actor.group.visible,opacity:actor.body.material.opacity,height:actor.height,
            actualUV:[map.offset.x,map.offset.y,map.repeat.x,map.repeat.y],expectedUV:[frame.rect[0]/config.width,1-(frame.rect[1]+frame.rect[3])/config.height,frame.rect[2]/config.width,frame.rect[3]/config.height]};
        }),assetErrors:[...w.assetErrors]};
    }, { zone, index, after });
    assert.deepEqual(observed.actual, after); assert.ok(observed.bodies.length); assert.deepEqual(observed.assetErrors, []);
    for (const body of observed.bodies) {
      assert.equal(body.frameId, `${body.key}-body`); assert.equal(body.visible, true); assert.equal(body.opacity, 1);
      assert.ok(body.source.endsWith(body.key === 'juggernaut' ? '/assets/frontier-enemies.png' : '/assets/horizon-enemies.png'));
      body.actualUV.forEach((value, index) => assert.ok(Math.abs(value - body.expectedUV[index]) < 1e-10));
    }
    observed.screenshot = await capture(`${zone}-${index === 2 ? 'boss' : index + 1}`);
    observed.orders = await page.evaluate(() => {
      const f=window.__HORIZON_ENEMIES__,w=f.world;
      return f.battle.actors.filter(actor=>actor.team==='enemy'&&(f.ids.includes(actor.sprite)||actor.sprite==='juggernaut')).map(actor=>{
        const actionId=actor.sprite==='sapper'?'sabotage':actor.sprite==='battlemaster'?'barrier':'shoot',self=actionId==='barrier',targetId=self?actor.id:'shepard';
        const result=f.performAction(f.battle,{actorId:actor.id,actionId,targetId});w.setBattle(f.battle);result.events.forEach(event=>w.playEvent(event));w.update(0);
        return{actorId:actor.id,actionId,targetId,ok:result.ok,atb:actor.atb,heat:actor.heat,barrier:actor.statuses.barrier,
          targetSabotage:f.battle.actors.find(entry=>entry.id==='shepard').statuses.sabotage,persistentStateUnchanged:JSON.stringify(f.state)===f.snapshot};
      });
    });
    for(const order of observed.orders){assert.equal(order.ok,true);assert.equal(order.atb,0);assert.equal(order.persistentStateUnchanged,true);if(order.actionId==='sabotage')assert.ok(order.targetSabotage>0);if(order.actionId==='barrier')assert.ok(order.barrier>0);}
    observed.foreign = await page.evaluate(() => {
      const f=window.__HORIZON_ENEMIES__,w=f.world,entry=f.battle.actors.find(actor=>actor.team==='enemy'&&f.ids.includes(actor.sprite));
      if(!entry)return{notApplicable:'Only relocated Frontier actor in this case'};
      const actor=w.battleActors.get(entry.id),before=actor.animationFrame;entry.mediaId='ME2';w.update(0);const rejected=actor.animationFrame;
      entry.mediaId='ME1';w.update(0);return{before,rejected,restored:actor.animationFrame};
    });
    if(!observed.foreign.notApplicable){assert.ok(observed.foreign.before.endsWith('-body'));assert.equal(observed.foreign.rejected,null);assert.equal(observed.foreign.restored,observed.foreign.before);}
    observed.cleanup = await page.evaluate(() => {
      const f=window.__HORIZON_ENEMIES__,w=f.world;w.setBattle(null);w.setMode('explore');
      return{remainingBattleActors:w.battleActors.size,remainingBattleTextures:[...w.spriteCache.keys()].filter(key=>f.ids.some(id=>key==='horizon-enemies:'+id+'-0'||key==='horizon-enemies:'+id+'-1'||key==='horizon-enemies:'+id+'-2'))};
    });
    assert.equal(observed.cleanup.remainingBattleActors,0);assert.deepEqual(observed.cleanup.remainingBattleTextures,[]);
    report.cases.push(observed);
    console.log(JSON.stringify({case:`${zone}:${index}`,passed:true,bodies:observed.bodies.map(body=>body.key)}));
  }
  report.ambient = await page.evaluate(() => {
    const f=window.__HORIZON_ENEMIES__,w=f.world,state=f.prepare('feros',0);w.setBattle(null);w.setStoryContext(state);w.setZone('feros',{party:state.party,cleared:state.cleared});w.setMode('explore');
    const poi=w.zone.pois.find(poi=>poi.id==='feros:encounter-1');w.setPosition({x:poi.x-5,z:poi.z+2});w.cameraTarget.copy(w._cameraFocus(w.getPosition(),'explore'));w.update(0);
    const actor=w.ambientActors.find(actor=>actor.key==='armature');if(!actor)throw Error('Missing authored ambient armature');const before=actor.animationFrame;
    actor.poiId='foreign';w.update(0);const badPOI=actor.animationFrame;actor.poiId=poi.id;w.update(0);const restored=actor.animationFrame;
    w.setStoryContext({...state,mediaId:'ME3',periodId:'me3'});w.update(0);const foreign=w.ambientActors.find(actor=>actor.key==='armature')?.animationFrame??null;
    w.setStoryContext(state);w.update(0);return{before,badPOI,restored,foreign,actualAmbientId:'ambient:'+poi.id};
  });
  assert.equal(report.ambient.before,'armature-body');assert.equal(report.ambient.badPOI,null);assert.equal(report.ambient.restored,'armature-body');assert.equal(report.ambient.foreign,null);
  await capture('ambient-feros');
  await page.evaluate(()=>{window.__HORIZON_ENEMIES__.world.dispose();delete window.__HORIZON_ENEMIES__;});
  assert.equal(report.cases.length,6);assert.equal(report.captures.length,7);assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
  for(const [path,expected] of Object.entries(sourceHashes))assert.equal(hash(await readFile(new URL(path,root))),expected,`Source changed during run:${path}`);
  report.passed=true;
} catch(error) { report.failure=error.stack||String(error);process.exitCode=1;console.error(report.failure); }
finally { await browser?.close();await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,captures:report.captures.length,failure:report.failure})); }

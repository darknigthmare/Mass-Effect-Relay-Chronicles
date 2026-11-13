// Detached native WorldView and native phase toolbar. Explicit high-health /
// high-attack inputs isolate visual transitions; this is not campaign play.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PRIORITY_FEATURE_SOURCES } from './priority-workbook-data.mjs';
const root = new URL('../', import.meta.url), base = new URL(process.env.GAME_URL || 'http://127.0.0.1:4183/');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname));
const prefix = process.env.PRIORITY_BOSS_PREFIX;
assert.match(prefix || '', /^priority-bosses-[a-z0-9-]+$/, 'Choose a fresh PRIORITY_BOSS_PREFIX for every attempt.');
const output = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(output); throw Error('Preserve the existing report.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/world.js', 'src/world-data.js', 'src/level-layout-data.js', 'src/horizon-layout-data.js', 'src/horizon-scene.js',
  'src/frontier-layout-data.js', 'src/frontier-scene.js', 'src/boss-animation-data.js', 'src/boss-phases.js', 'src/tactical-ui.js',
  'src/tactical-positions.js', 'src/priority-ui.css', 'src/style.css', 'src/game-data.js', 'src/combat.js', 'src/state.js',
  'src/loadout.js', 'src/character-data.js', 'src/campaign-talents.js', 'src/mission-progress.js', 'src/story.js',
  'vite.config.js', 'scripts/priority-bosses-browser.mjs'];
for (const name of await readdir(new URL('public/assets/', root))) if (/\.(png|json)$/.test(name) && name !== 'manifest.json') paths.push(`public/assets/${name}`);
const report = { passed: false, at: new Date().toISOString(), url: base.href, sourceHashes: {}, captures: [], cases: [],
  orders: [], guardChecks: [], servedAssets: [], errors: [], consoleErrors: [], failedRequests: [], assetErrors: [],
  scope: 'Development-only detached native WorldView plus the real tactical toolbar component. Benezia and Thorian transitions use the actual native engine with tactical:true/bossPhases:true. Current source files and unchanged local atlas bytes are identified. No app campaign is begun or public victory claimed.',
  command: { script: 'node scripts/priority-bosses-browser.mjs', environment: { GAME_URL: base.href, PRIORITY_BOSS_PREFIX: prefix } },
  fixture: { preparedProgression: 'Node-equivalent native newGame/recruit/winEncounter/completeZone/recordVisit callbacks inside the detached module page; these earlier victories are prepared, not played.',
    party: ['shepard', 'garrus', 'tali'], actorInputs: 'Each party actor starts with hp=maxHp=5000; Shepard attack=3000 and initial atb=100. Other party ATB starts at0. Canonical profiles are never edited. No subsequent HP/ATB edit.',
    clock: 'Native tickBattle advances naturally to a legal ready order, in active mode. Intermediate GPU drawing is suspended; actual phase snapshots receive one normal final render.',
    camera: 'Native computed settled combat focus is applied directly; no public traversal, camera animation or performance measurement.' },
  limitations: ['These high-health/high-attack visual inputs are distinct from the normal-stat native balance comparison.',
    'The QA caption identifies the detached fixture; the phase toolbar is the real component, not the complete public battle HUD.',
    'No original-game reference image, multi-floor Thorian lair, new node drawing, full animation cycle or physical device is certified.'] };
let browser, page;
async function capture(label) {
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ path, sha256: sha(bytes), bytes: bytes.length, label }); return path;
}
try {
  const snapshotDirectory = `docs/qa/${prefix}-sources/`, snapshotHashes = {};
  await mkdir(new URL(snapshotDirectory + 'src/', root), { recursive: true });
  for (const path of PRIORITY_FEATURE_SOURCES) {
    const bytes = await readFile(new URL(path, root)); snapshotHashes[path] = sha(bytes);
    await writeFile(new URL(snapshotDirectory + path, root), bytes);
  }
  const snapshotPath = `docs/qa/${prefix}-source-snapshot.json`;
  const snapshotRaw = JSON.stringify({ at: new Date().toISOString(), sourceHashes: snapshotHashes,
    files: Object.keys(snapshotHashes).length, directory: snapshotDirectory,
    scope: 'Exact 26-file frozen product context before the renderer fixture; not every captured module is executed by this detached page.' }, null, 2) + '\n';
  await writeFile(new URL(snapshotPath, root), snapshotRaw);
  report.productSnapshot = { path: snapshotPath, sha256: sha(snapshotRaw), directory: snapshotDirectory, files: Object.keys(snapshotHashes).length };
  Object.assign(report.sourceHashes, snapshotHashes);
  for (const path of paths) report.sourceHashes[path] = sha(await readFile(new URL(path, root)));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({text:message.text(),location:message.location()}); });
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  const entry = new URL('__priority-bosses-qa__', base).href;
  await page.route(entry, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/priority-ui.css"><style>html,body{margin:0;overflow:hidden}#world{width:100vw;height:100vh;position:relative}#qa-caption{position:fixed;top:12px;left:16px;right:16px;padding:9px 12px;background:#061522ed;color:#d9e8ef;border:1px solid #426579;font:12px sans-serif;z-index:20}#phase-toolbar{position:fixed;bottom:12px;left:0;right:0;z-index:20}</style></head><body><div id="world"></div><div id="qa-caption">Fixture de rendu détachée · statistiques et progression antérieure préparées · aucune campagne publique jouée</div><div id="phase-toolbar"></div><script type="module">
    import '/@vite/client';
    import { WorldView } from '/src/world.js';
    import { newGame, winEncounter, completeZone, recruit, zoneEncounters, encodeSave, decodeSave } from '/src/state.js';
    import { recordVisit } from '/src/story.js';
    import { actorFor, enemiesFor } from '/src/game-data.js';
    import { createBattle, tickBattle, performAction, getActions, getTargetAvailability, getBossPhaseView } from '/src/combat.js';
    import { renderTacticalToolbar } from '/src/tactical-ui.js';
    const world=new WorldView(document.querySelector('#world'));
    const f={world,storageBefore:JSON.stringify({...localStorage}),orders:[]};
    f.prepare=zone=>{
      const state=newGame({name:'Fixture phases',classId:'soldier',difficulty:'story',mode:'active'});state.flags.briefed=true;
      const decisions={feros:'save',noveria:'release',virmire:'save-kaidan','citadel-finale':'save-council'};
      for(const current of ['eden-prime','citadel','therum','feros','noveria']){
        state.zone=current;recordVisit(state,current);
        if(current==='citadel')for(const key of ['garrus','tali','wrex'])if(!recruit(state,key))throw Error('Recruit preparation failed');
        for(const id of zoneEncounters(current)){
          if(current===zone&&id===zone+':boss'){state.party=['shepard','garrus','tali'];if(!decodeSave(encodeSave(state)))throw Error('Invalid prepared save');return state;}
          if(!winEncounter(state,id))throw Error('Encounter preparation failed');
        }
        if(!completeZone(state,current,decisions[current]??null))throw Error('Objective preparation failed');
      }
      throw Error('Unknown fixture zone');
    };
    f.begin=zone=>{
      f.state=f.prepare(zone);f.stateBefore=JSON.stringify(f.state);world.setBattle(null);world.setStoryContext(f.state);
      world.setZone(zone,{party:f.state.party,cleared:f.state.cleared});const poi=world.zone.pois.find(p=>p.id===zone+':boss');world.setPosition(poi);
      const arena=world.getCombatArena();
      f.battle=createBattle({party:f.state.party.map(id=>({...actorFor(id,f.state),hp:5000,maxHp:5000,...(id==='shepard'?{attack:3000,atb:100}:{atb:0})})),
        enemies:enemiesFor(zone,2,f.state),mode:'active',difficulty:'story',seed:2183,bossPhases:true,tactical:true,
        tacticalPositionAllowed:point=>world._walkable(arena.x+point.x,arena.z+point.z)});
      world.setBattle(f.battle);world.setMode('combat');const focus=world._cameraFocus(world.battleArena||world.zone.arena,'combat');
      world.cameraTarget.copy(focus);world.camera.position.copy(focus).add(world.cameraOffset);world.camera.lookAt(focus);world.update(0);
      f.orders=[];return f.metric();
    };
    f.render=()=>{
      world.setBattle(f.battle);world.update(0);
      document.querySelector('#phase-toolbar').innerHTML=renderTacticalToolbar(f.battle,{actor:'shepard',coordMode:false,coordOrders:[]},{phase:getBossPhaseView(f.battle)});
    };
    f.metric=()=>{
      f.render();return{profileId:f.battle.bossPhases.profileId,phase:getBossPhaseView(f.battle),phaseIndex:f.battle.bossPhases.phaseIndex,
        winner:f.battle.winner,elapsed:f.battle.elapsed,actionCount:f.battle.actionCount,
        victoryEvents:f.battle.events.filter(event=>event.type==='victory').length,
        stateUnchanged:JSON.stringify(f.state)===f.stateBefore,assetErrors:[...world.assetErrors],
        bodies:f.battle.actors.filter(actor=>actor.team==='enemy').map(state=>{
          const actor=world.battleActors.get(state.id),config=world.characterAnimations[actor.key]?.combat,
            frame=Object.values(config?.frames||{}).find(frame=>frame.id===actor.animationFrame),map=actor.body.material.map;
          return{id:state.id,sprite:state.sprite,hp:state.hp,retired:state.bossPhaseRetired===true,visible:actor.group.visible,
            frameId:actor.animationFrame,source:map?.image?.src||null,expectedFile:config?.file,rect:frame?.rect,
            actualUV:[map.offset.x,map.offset.y,map.repeat.x,map.repeat.y],
            expectedUV:frame?[frame.rect[0]/config.width,1-(frame.rect[1]+frame.rect[3])/config.height,frame.rect[2]/config.width,frame.rect[3]/config.height]:null,
            position:actor.basePosition?.toArray(),tacticalAnchorId:state.tacticalAnchorId||null};
        })};
    };
    f.shoot=targetId=>{
      let loops=0;
      while(!f.battle.winner&&loops++<5000){
        if(!getActions(f.battle,'shepard').some(action=>action.id==='shoot'&&action.available)){tickBattle(f.battle,.05);continue;}
        const wanted={actorId:'shepard',actionId:'shoot',targetId},availability=getTargetAvailability(f.battle,wanted);
        const order=availability.ok?wanted:{actorId:'shepard',actionId:'advance',targetId:'shepard'};
        const atb=f.battle.actors.find(actor=>actor.id==='shepard').atb,result=performAction(f.battle,order);
        if(!result.ok)throw Error('Native order rejected: '+JSON.stringify(order)+' '+result.reason);
        f.orders.push({...order,readyATB:atb,readinessSource:f.orders.length===0?'Explicit initial100 fixture':'Native tickBattle refill',phaseIndex:f.battle.bossPhases.phaseIndex});
        if(availability.ok){f.render();return f.metric();}
      }
      throw Error('No naturally ready legal shot');
    };
    window.__PRIORITY_BOSSES__=f;
  </script></body></html>` }));
  await page.goto(entry, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => ['combat-benezia','combat-thorian','combat-asari','combat-creeper','combat-shepard','combat-garrus','combat-tali']
    .every(key => window.__PRIORITY_BOSSES__?.world.atlases[key]));
  for (const profileId of ['benezia', 'thorian']) {
    const zone = profileId === 'benezia' ? 'noveria' : 'feros';
    await page.evaluate(zone => window.__PRIORITY_BOSSES__.begin(zone), zone);
    if (profileId === 'benezia') report.guardChecks.push(await page.evaluate(() => {
      const f=window.__PRIORITY_BOSSES__,hero=f.battle.actors.find(actor=>actor.id==='shepard');
      const before={atb:hero.atb,heat:hero.heat,events:f.battle.events.length,orders:f.battle.actionCount};
      // Resolve through the actual exported engine; no state edit is applied.
      return import('/src/combat.js').then(({performAction})=>{
        const result=performAction(f.battle,{actorId:'shepard',actionId:'shoot',targetId:f.battle.bossPhases.bossId});
        return{ok:result.ok,reason:result.reason,unchanged:JSON.stringify(before)===JSON.stringify({atb:hero.atb,heat:hero.heat,events:f.battle.events.length,orders:f.battle.actionCount})};
      });
    }));
    const stages = profileId === 'benezia' ? 3 : 6;
    for (let index = 0; index < stages; index++) {
      const metric = await page.evaluate(() => window.__PRIORITY_BOSSES__.metric());
      assert.equal(metric.phaseIndex, index); assert.equal(metric.winner, null); assert.equal(metric.victoryEvents, 0);
      assert.equal(metric.stateUnchanged, true); assert.deepEqual(metric.assetErrors, []);
      for (const body of metric.bodies) {
        assert.equal(body.visible, !body.retired); assert.ok(body.frameId);
        assert.ok(new URL(body.source).pathname.endsWith('/' + body.expectedFile)); assert.ok(body.expectedUV);
        body.actualUV.forEach((value, index) => assert.ok(Math.abs(value - body.expectedUV[index]) < 1e-8));
      }
      const label = `${profileId}-phase-${index + 1}`; metric.screenshot = await capture(label); report.cases.push(metric);
      const next = await page.evaluate(() => { const f=window.__PRIORITY_BOSSES__;return f.shoot(f.battle.bossPhases.profileId==='benezia'
        ?f.battle.bossPhases.reinforcementIds[f.battle.bossPhases.phaseIndex]:f.battle.bossPhases.nodeIds[f.battle.bossPhases.phaseIndex]); });
      assert.equal(next.phaseIndex, index + 1); assert.equal(next.winner, null);
    }
    const finalPhase = await page.evaluate(() => window.__PRIORITY_BOSSES__.metric());
    finalPhase.screenshot = await capture(`${profileId}-final-objective`); report.cases.push(finalPhase);
    const final = await page.evaluate(() => {
      const f=window.__PRIORITY_BOSSES__;
      for(const actor of f.battle.actors.filter(actor=>actor.team==='enemy'&&actor.hp>0))f.shoot(actor.id);
      return{...f.metric(),orders:f.orders,phaseEvents:f.battle.events.filter(event=>event.type==='bossPhase')};
    });
    assert.equal(final.winner, 'party'); assert.equal(final.victoryEvents, 1); assert.equal(final.stateUnchanged, true);
    assert.ok(final.orders.every(order => order.readyATB >= 99.999));
    assert.ok(final.bodies.filter(body => body.retired).every(body => !body.visible));
    final.screenshot = await capture(`${profileId}-ended`); report.cases.push(final); report.orders.push(...final.orders);
    await page.evaluate(() => { const w=window.__PRIORITY_BOSSES__.world;w.setBattle(null);w.setMode('explore'); });
    assert.equal(await page.evaluate(() => window.__PRIORITY_BOSSES__.world.battleActors.size), 0);
  }
  for (const key of ['benezia','thorian']) {
    const path = `public/assets/boss-${key}-combat.png`, response = await page.request.get(new URL(`assets/boss-${key}-combat.png`, base).href);
    assert.equal(response.status(), 200); const bytes = await response.body(); assert.equal(sha(bytes), report.sourceHashes[path]);
    report.servedAssets.push({ path, status: response.status(), sha256: sha(bytes), bytes: bytes.length });
  }
  report.storageUnchanged = await page.evaluate(() => JSON.stringify({...localStorage}) === window.__PRIORITY_BOSSES__.storageBefore);
  assert.equal(report.storageUnchanged, true); assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.failedRequests, []);
  assert.ok(report.guardChecks.every(check => check.ok === false && check.unchanged));
  report.assetErrors = await page.evaluate(() => [...window.__PRIORITY_BOSSES__.world.assetErrors]); assert.deepEqual(report.assetErrors, []);
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(await readFile(new URL(path, root))), expected, `Source changed during capture: ${path}`);
  report.sourceFrozen = true; report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; }
finally { await browser?.close(); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, cases: report.cases.length, captures: report.captures.length, orders: report.orders.length, failure: report.failure })); }

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeEnemyAnimation } from '../src/enemy-animation-data.js';

// Detached renderer fixture: no campaign, app harness, saved-state injection,
// recruitment, new attack or canonical original-game likeness is claimed.
const root = new URL('../', import.meta.url), prefix = 'eden-immersion-sprites';
const baseURL = new URL(`${(process.env.GAME_URL || 'http://127.0.0.1:4195').replace(/\/$/, '')}/`);
const ids = ['krogan', 'rachni'], retained = ['geth', 'husk', 'geth-sniper', 'geth-destroyer'];
const sha = value => createHash('sha256').update(value).digest('hex');
const bytes = path => readFile(new URL(path, root));
for (const dir of ['test-results/', 'docs/qa/', 'docs/screenshots/']) await mkdir(new URL(dir, root), { recursive: true });
const configs = Object.fromEntries(await Promise.all(ids.map(async key => [key,
  normalizeEnemyAnimation(key, JSON.parse(await bytes(`public/assets/enemy-${key}-animation.json`)))])));
assert.ok(Object.values(configs).every(Boolean), 'Both measured native families must be registered before this fixture runs');
const paths = ['src/world.js', 'src/eden-scene.js', 'src/world-data.js', 'src/level-layout-data.js',
  'src/enemy-animation-data.js', 'src/companion-animation-data.js', 'src/joker-seated-data.js', 'src/game-data.js',
  'src/combat.js', 'src/state.js', 'vite.config.js', 'scripts/eden-immersion-sprites-browser.mjs',
  'public/assets/enemy-atlas.png', 'public/assets/eden-ground-grass.png', 'public/assets/eden-ground-dirt.png',
  ...[...ids, ...retained].flatMap(key =>
    [`public/assets/enemy-${key}-combat.png`, `public/assets/enemy-${key}-animation.json`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, sha(await bytes(path))])));
const report = { passed: false, generatedAt: new Date().toISOString(), sourceHead:
  execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  url: baseURL.href, buildKind: 'vite-development-private-WorldView-fixture', sourceHashes,
  command: 'GAME_URL=<fresh Vite> PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/eden-immersion-sprites-browser.mjs',
  scope: 'Eight held key poses for the existing krogan/rachni families on the actual WorldView, native barrier/acid/hit/KO events, twelve closed identity contexts and four retained-family aim checks. No campaign is played, no new enemy or power is granted, and no complete1:1 likeness or movement cycle is certified.',
  viewport: { width: 1280, height: 800 }, node: process.version, cases: [], nativeEvents: [], scopeClosures: [],
  regressions: [], captureArtifacts: [], servedAssets: [], errors: [], failedRequests: [], resourceWarnings: [],
  fixtureSpacing: { additionalEnemyZOffsets: { 'krogan-0': -2, 'rachni-1': 3.5 },
    scope: 'Visual-only separation within the open arena; no native actor or battle-data position is changed.' },
  limitations: ['Pose states and enemy spacing are explicitly held in a detached fixture. The public campaign journey is separate.',
    'Native effect cases reduce the initial krogan shield and prepare a one-health KO witness; these are declared test inputs, not canonical statistics.',
    'Only aim is rechecked for the four previously shipped enemy families; their sixteen earlier poses are not claimed as replayed.',
    'The eight fixed drawings, partial primary references, generic illustrated weapon and native low-alpha fringes do not supply complete original-game likeness or motion cycles.'] };
let browser, page;
async function capture(pose) {
  const path = `docs/screenshots/${prefix}-${pose}.png`, raw = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.captureArtifacts.push({ path, bytes: raw.length, sha256: sha(raw) }); return path;
}
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} != ${expected}`);
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() < 400) return;
    const observed = { url: response.url(), status: response.status() };
    if (new URL(response.url()).pathname === '/favicon.ico' && response.status() === 404) report.resourceWarnings.push(observed);
    else report.failedRequests.push(observed);
  });
  const harness = new URL('__eden-sprites-qa__', baseURL);
  await page.route(harness.href, route => route.fulfill({ contentType: 'text/html', body:
    `<!doctype html><html><head><meta charset="utf-8"><title>Detached sprite fixture</title></head><body style="margin:0;background:#07111d"><div id="fixture" style="position:relative;width:100vw;height:100vh"></div><script type="module">
      import ${JSON.stringify(new URL('@vite/env', baseURL).href)};
      import { WorldView } from ${JSON.stringify(new URL('src/world.js', baseURL).href)};
      import { createBattle } from ${JSON.stringify(new URL('src/combat.js', baseURL).href)};
      import { newGame } from ${JSON.stringify(new URL('src/state.js', baseURL).href)};
      import { actorFor, ENEMIES } from ${JSON.stringify(new URL('src/game-data.js', baseURL).href)};
      const world=new WorldView(document.querySelector('#fixture')),state=newGame({name:'Fixture sprites détachée'});
      const f=window.__EDEN_SPRITES_QA__={world,state,beforeState:JSON.stringify(state),storageBefore:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),frame:0,lastTime:performance.now()};
      world.setZone('eden-prime');world.setMode('combat');
      f.battle=createBattle({party:['shepard','ashley','kaidan'].map(id=>actorFor(id,state)),enemies:[{...ENEMIES.krogan,id:'krogan-0'},{...ENEMIES.rachni,id:'rachni-1'}],seed:2183,mode:'wait'});
      world.setBattle(f.battle);world.update(0);
      const loop=time=>{world.update(Math.min(.05,Math.max(0,(time-f.lastTime)/1000)));f.lastTime=time;f.frame=requestAnimationFrame(loop);};f.frame=requestAnimationFrame(loop);
    </script></body></html>` }));
  await page.goto(harness.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const w = window.__EDEN_SPRITES_QA__?.world;
    return w && ['krogan', 'rachni', 'geth', 'husk', 'geth-sniper', 'geth-destroyer'].every(key => w.atlases[`combat-${key}`]);
  });
  assert.equal(await page.evaluate(() => window.__EDEN_SPRITES_QA__.world.zoneId), 'eden-prime');
  assert.deepEqual(await page.evaluate(ids => Object.fromEntries(ids.map(key => [key, window.__EDEN_SPRITES_QA__.world.characterAnimations[key]])), ids), configs);
  for (const id of ids) {
    const path = `public/assets/${configs[id].combat.file}`, response = await page.request.get(new URL(`assets/${configs[id].combat.file}`, baseURL).href);
    assert.equal(response.status(), 200); const actual = sha(await response.body()); assert.equal(actual, sourceHashes[path]);
    report.servedAssets.push({ path, status: 200, sha256: actual });
  }
  await page.evaluate(() => {
    const f = window.__EDEN_SPRITES_QA__, w = f.world;
    // Separate the two held subjects within the existing arena so one silhouette
    // does not conceal the other. Native battle coordinates/data are untouched.
    for (const [index, id] of ['krogan-0', 'rachni-1'].entries()) {
      const actor = w.battleActors.get(id); actor.basePosition.z += index ? 3.5 : -2;
      actor.group.position.copy(actor.basePosition);
    }
    w.update(0); f.textureVersions = Object.fromEntries(['krogan-0','rachni-1'].map(id => {
      const actor=w.battleActors.get(id), map=actor.body.material.map; return [id,{texture:map.version,source:map.source.version}];
    }));
  });
  for (const pose of ['aim', 'power', 'hit', 'down']) {
    await page.evaluate(pose => {
      const f=window.__EDEN_SPRITES_QA__,w=f.world;
      for(const native of f.battle.actors.filter(a=>a.team==='enemy'))native.hp=pose==='down'?0:native.maxHp;
      w.setBattle(f.battle); f.beforeRenderBattle=JSON.stringify(f.battle);
      for (const [index,id] of ['krogan-0','rachni-1'].entries()) {
        const actor=w.battleActors.get(id);actor.basePosition.z+=index?3.5:-2;actor.group.position.copy(actor.basePosition);
      }
      for(const native of f.battle.actors.filter(a=>a.team==='enemy')){
        const actor=w.battleActors.get(native.id);actor.combatPoseTime=0;
        if(pose==='hit')w.playEvent({type:'damage',targetId:native.id});
        else if(pose!=='down')w.playEvent({type:'action',actorId:native.id,actionId:pose==='aim'?'shoot':native.sprite==='krogan'?'barrier':'acid'});
        if(pose!=='down')actor.combatPoseTime=600;
      }
      w.update(0);
    },pose);
    await page.waitForFunction(() => {
      const f=window.__EDEN_SPRITES_QA__,w=f.world,current=w.cameraTarget.toArray(),previous=f.lastCameraTarget;
      f.lastCameraTarget=current;
      return previous&&Math.hypot(...current.map((value,index)=>value-previous[index]))<.002
        &&w.effects.length===0&&[...w.battleActors.values()].every(actor=>actor.poseTime<=0&&(actor.shieldFlash||0)<=0);
    });
    const metrics=await page.evaluate(pose=>{
      const f=window.__EDEN_SPRITES_QA__,w=f.world,V=w.camera.position.constructor;
      return f.battle.actors.filter(a=>a.team==='enemy').map(native=>{
        const actor=w.battleActors.get(native.id),frame=w.characterAnimations[native.sprite].combat.frames[pose],map=actor.body.material.map,p=actor.body.geometry.parameters;
        actor.body.updateWorldMatrix(true,false);
        const pivot=actor.body.localToWorld(new V((frame.pivot[0]/frame.rect[2]-.5)*p.width,(.5-frame.pivot[1]/frame.rect[3])*p.height,0));
        const anchor=actor.group.localToWorld(new V(0,.05,0)),projected=[];
        for(const sx of[-1,1])for(const sy of[-1,1]){const point=actor.body.localToWorld(new V(sx*p.width/2,sy*p.height/2,0));point.project(w.camera);projected.push([(point.x*.5+.5)*innerWidth,(-point.y*.5+.5)*innerHeight]);}
        const atlas=w.atlases['combat-'+native.sprite];
        return {id:actor.id,key:actor.key,pose,frameId:actor.animationFrame,texture:map.image.src,textureUUID:map.uuid,repeat:map.repeat.toArray(),offset:map.offset.toArray(),rect:frame.rect,pivot:frame.pivot,relativeHeight:p.height*actor.body.scale.y/actor.height,groundAnchorError:pivot.distanceTo(anchor),rotationZ:actor.body.rotation.z,sourceMapDistinct:map!==atlas,sourceRepeat:atlas.repeat.toArray(),sourceOffset:atlas.offset.toArray(),textureVersion:map.version,sourceVersion:map.source.version,beforeVersions:f.textureVersions[actor.id],battleUnchanged:JSON.stringify(f.battle)===f.beforeRenderBattle,saveUnchanged:JSON.stringify(f.state)===f.beforeState,drawCalls:w.renderer.info.render.calls,triangles:w.renderer.info.render.triangles,projectedBounds:{left:Math.min(...projected.map(p=>p[0])),right:Math.max(...projected.map(p=>p[0])),top:Math.min(...projected.map(p=>p[1])),bottom:Math.max(...projected.map(p=>p[1]))}};
      });
    },pose);
    for(const m of metrics){const c=configs[m.key].combat,f=c.frames[pose],[x,y,width,height]=f.rect;
      assert.equal(m.frameId,f.id);assert.equal(new URL(m.texture).pathname,`/assets/${c.file}`);assert.deepEqual(m.rect,f.rect);assert.deepEqual(m.pivot,f.pivot);
      close(m.repeat[0],width/c.width,'UV width');close(m.repeat[1],height/c.height,'UV height');close(m.offset[0],x/c.width,'UV x');close(m.offset[1],1-(y+height)/c.height,'UV y');close(m.relativeHeight,f.heightScale,'height');close(m.groundAnchorError,0,'pivot');
      assert.equal(m.rotationZ,0);assert.equal(m.sourceMapDistinct,true);assert.deepEqual(m.sourceRepeat,[1,1]);assert.deepEqual(m.sourceOffset,[0,0]);
      assert.equal(m.textureVersion,m.beforeVersions.texture);assert.equal(m.sourceVersion,m.beforeVersions.source);assert.equal(m.battleUnchanged,true);assert.equal(m.saveUnchanged,true);
      assert.ok(m.drawCalls>0&&m.triangles>0);assert.ok(m.projectedBounds.left>=0&&m.projectedBounds.right<=1280&&m.projectedBounds.top>=0&&m.projectedBounds.bottom<=800);
    }
    assert.notEqual(metrics[0].textureUUID,metrics[1].textureUUID);
    const screenshot=await capture(pose);report.cases.push(...metrics.map(metric=>({...metric,screenshot,passed:true})));
    console.log(JSON.stringify({pose,cases:report.cases.length}));
  }
  report.nativeEvents=await page.evaluate(async()=>{
    const [{actorFor,ENEMIES},{createBattle,performAction}]=await Promise.all([import('/src/game-data.js'),import('/src/combat.js')]);
    const f=window.__EDEN_SPRITES_QA__,w=f.world,rows=[];
    for(const key of['krogan','rachni']){
      const battle=createBattle({party:['shepard','ashley'].map(id=>({...actorFor(id,f.state),atb:100})),enemies:[{...ENEMIES[key],id:key+'-0',atb:100,...(key==='krogan'?{shield:0,maxShield:ENEMIES.krogan.shield}:{})}],seed:2183,mode:'wait'});
      const native=battle.actors.find(a=>a.team==='enemy'),beforePowers=JSON.stringify(native.powers),target=battle.actors.find(a=>a.id==='shepard'),beforeShield=native.shield;
      w.setBattle(battle);const actionId=key==='krogan'?'barrier':'acid';const action=performAction(battle,{actorId:native.id,actionId,targetId:key==='krogan'?native.id:'shepard'});
      w.setBattle(battle);for(const event of action.events)w.playEvent(event);w.update(0);
      const actionFrame=w.battleActors.get(native.id).animationFrame,shieldAfterAction=native.shield,barrierAfterAction=native.statuses.barrier||0,corrosionAfterAction=target.statuses.corrosion||0;
      const hit=performAction(battle,{actorId:'shepard',actionId:'shoot',targetId:native.id});w.setBattle(battle);for(const event of hit.events)w.playEvent(event);w.playEvent({type:'action',actorId:native.id,actionId});w.update(0);const hitFrame=w.battleActors.get(native.id).animationFrame;
      native.hp=1;native.shield=0;const shooter=battle.actors.find(a=>a.id==='ashley');shooter.attack=5000;
      const damage=performAction(battle,{actorId:'ashley',actionId:'shoot',targetId:native.id}),beforeRender=JSON.stringify(battle);
      w.setBattle(battle);for(const event of damage.events)w.playEvent(event);w.playEvent({type:'action',actorId:native.id,actionId});w.update(0);
      rows.push({key,actionId,actionOK:action.ok,actionFrame,beforeShield,shieldAfterAction,barrierAfterAction,corrosionAfterAction,liveDamageOK:hit.ok,hitFrame,lateVisualActionCannotOverrideHit:true,damageOK:damage.ok,koFrame:w.battleActors.get(native.id).animationFrame,hpAfterDamage:native.hp,lateVisualActionCannotOverrideKO:true,powersUnchanged:JSON.stringify(native.powers)===beforePowers,rendererPreservesNativeBattle:JSON.stringify(battle)===beforeRender});
    }return rows;
  });
  for(const r of report.nativeEvents){assert.equal(r.actionOK,true);assert.equal(r.actionFrame,`${r.key}-combat-power`);assert.equal(r.liveDamageOK,true);assert.equal(r.hitFrame,`${r.key}-combat-hit`);assert.equal(r.damageOK,true);assert.equal(r.koFrame,`${r.key}-combat-down`);assert.equal(r.hpAfterDamage,0);assert.equal(r.powersUnchanged,true);assert.equal(r.rendererPreservesNativeBattle,true);if(r.key==='krogan'){assert.ok(r.shieldAfterAction>r.beforeShield);assert.ok(r.barrierAfterAction>0);}else assert.ok(r.corrosionAfterAction>0);}
  report.scopeClosures=await page.evaluate(async()=>{
    const [{actorFor,ENEMIES},{createBattle}]=await Promise.all([import('/src/game-data.js'),import('/src/combat.js')]);const f=window.__EDEN_SPRITES_QA__,w=f.world,rows=[];
    for(const key of['krogan','rachni'])for(const patch of[{mediaId:'ME3'},{periodId:'me2'},{context:{mediaId:'MEA'}},{id:'ME3-ENM-'+key.toUpperCase()},{sprite:key==='krogan'?'rachni':'krogan'},{team:'party'}]){
      w.setBattle(null);const battle=createBattle({party:[actorFor('shepard',f.state)],enemies:[{...ENEMIES[key],id:key+'-0',...patch}],seed:2183});if(patch.team)battle.actors[1].team=patch.team;w.setBattle(battle);w.update(0);const actor=w.battleActors.get(battle.actors[1].id);rows.push({key,patch,frame:actor.animationFrame??null,usesNewCombatAtlas:actor.body.material.map.image.src?.includes('/enemy-krogan-combat.png')||actor.body.material.map.image.src?.includes('/enemy-rachni-combat.png')||false});
    }return rows;
  });
  assert.equal(report.scopeClosures.length,12);assert.ok(report.scopeClosures.every(row=>row.frame===null&&!row.usesNewCombatAtlas));
  report.regressions=await page.evaluate(async()=>{
    const [{actorFor,ENEMIES},{createBattle}]=await Promise.all([import('/src/game-data.js'),import('/src/combat.js')]);const f=window.__EDEN_SPRITES_QA__,w=f.world,rows=[],defs={geth:'geth',husk:'husk','geth-sniper':'sniper','geth-destroyer':'destroyer'};
    for(const[key,base]of Object.entries(defs)){w.setBattle(null);const battle=createBattle({party:[actorFor('shepard',f.state)],enemies:[{...ENEMIES[base],id:base+'-0'}],seed:2183});w.setBattle(battle);w.update(0);const actor=w.battleActors.get(base+'-0');rows.push({key,frame:actor.animationFrame,texture:actor.body.material.map.image.src,saveUnchanged:JSON.stringify(f.state)===f.beforeState});}return rows;
  });
  for(const r of report.regressions){assert.equal(r.frame,`${r.key}-combat-aim`);assert.ok(r.texture.endsWith(`/assets/enemy-${r.key}-combat.png`));assert.equal(r.saveUnchanged,true);}
  const final=await page.evaluate(()=>{const f=window.__EDEN_SPRITES_QA__,result={stateUnchanged:JSON.stringify(f.state)===f.beforeState,storageBefore:f.storageBefore,storageAfter:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),assetErrors:f.world.assetErrors};cancelAnimationFrame(f.frame);f.world.dispose();return result;});
  assert.equal(final.stateUnchanged,true);assert.deepEqual(final.storageAfter,final.storageBefore);assert.deepEqual(final.assetErrors,[]);report.fixturePreserved=final;
  assert.equal(report.cases.length,8);assert.equal(report.captureArtifacts.length,4);assert.equal(report.nativeEvents.length,2);assert.equal(report.regressions.length,4);
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
  for(const[path,expected]of Object.entries(sourceHashes))assert.equal(sha(await bytes(path)),expected,`${path}: changed during fixture`);
  report.passed=true;
} catch(error){report.failure=error.stack||String(error);process.exitCode=1;console.error(report.failure);if(page)await capture('failure').catch(()=>{});}
finally{await browser?.close();await writeFile(new URL(`docs/qa/${prefix}-report.json`,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,captures:report.captureArtifacts.length,nativeEvents:report.nativeEvents.length,failure:report.failure}));}

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeEnemyAnimation } from '../src/enemy-animation-data.js';
import { normalizeCompanionAnimation } from '../src/companion-animation-data.js';

const root = new URL('../', import.meta.url), prefix = process.env.ME1_SPRITE_PREFIX || 'me1-prologue-enemies-sprites';
assert.match(prefix, /^me1-prologue-enemies-[a-z0-9-]+$/);
const base = new URL(`${(process.env.GAME_URL || 'http://127.0.0.1:4243').replace(/\/$/, '')}/`);
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Existing evidence must be preserved; use a new ME1_SPRITE_PREFIX'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const hash = value => createHash('sha256').update(value).digest('hex'), bytes = path => readFile(new URL(path, root));
const ids = ['jenkins', 'creeper', 'asari'], oldEnemies = ['geth', 'husk', 'geth-sniper', 'geth-destroyer', 'krogan', 'rachni'];
const oldCompanions = ['ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara'];
const kind = id => id === 'jenkins' || oldCompanions.includes(id) ? 'companion' : 'enemy';
const configs = Object.fromEntries(await Promise.all(ids.map(async id => [id,
  (id === 'jenkins' ? normalizeCompanionAnimation : normalizeEnemyAnimation)(id, JSON.parse(await bytes(`public/assets/${kind(id)}-${id}-animation.json`)))])));
assert.ok(Object.values(configs).every(Boolean), 'All three measured native families must be registered before this fixture runs.');
for (const dir of ['docs/qa/', 'docs/screenshots/', 'test-results/']) await mkdir(new URL(dir, root), { recursive: true });
const paths = ['src/world.js', 'src/world-data.js', 'src/eden-scene.js', 'src/level-layout-data.js', 'src/companion-animation-data.js',
  'src/enemy-animation-data.js', 'src/game-data.js', 'src/state.js', 'src/combat.js', 'src/story.js', 'vite.config.js',
  'scripts/me1-prologue-enemies-sprites.mjs', 'public/assets/crew-atlas.png', 'public/assets/enemy-atlas.png',
  ...[...ids, ...oldEnemies, ...oldCompanions].flatMap(id => [`public/assets/${kind(id)}-${id}-combat.png`, `public/assets/${kind(id)}-${id}-animation.json`])];
const sourceHashes = Object.fromEntries(await Promise.all(paths.map(async path => [path, hash(await bytes(path))])));
const report = { passed: false, generatedAt: new Date().toISOString(), sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  command: { script: 'node scripts/me1-prologue-enemies-sprites.mjs', environment: { GAME_URL: base.href, PLAYWRIGHT_EXECUTABLE_PATH: process.env.PLAYWRIGHT_EXECUTABLE_PATH || null, ME1_SPRITE_PREFIX: prefix } },
  buildKind: 'vite-development-detached-WorldView-fixture', url: base.href, sourceHashes, viewport: { width: 1280, height: 800 },
  scope: 'Twelve held fixed poses in four actual WorldView captures, native existing actions and closed identity/story contexts. Detached fixtures do not play campaign progression, add powers or certify canonical bodies, movement cycles or the Thorian clone.',
  cases: [], nativeEvents: [], scopeClosures: [], narrativeClosures: [], regressions: [], captureArtifacts: [], servedAssets: [], errors: [], failedRequests: [], resourceWarnings: [],
  limitations: ['The three subjects use a declared isolated battle and held pose timing for visual inspection. Their campaign and production journeys are separate.',
    'Controlled native action witnesses explicitly prepare ATB100, reduced shields and one-health KO targets. These are test inputs, not original statistics or public victories.',
    'Jenkins uses his existing cover command for the power-labelled drawing; no biotic or new skill is supplied. Narrative death is separate from ordinary combat KO.',
    'Only aim is rechecked for six earlier enemies and six earlier companions. This does not replay all their previously accepted poses.',
    'The generic asari key is reused in the condensed campaign. No clone identity, clone phases, summoning cycle or exact original likeness is supplied.'] };
let browser, page;
async function capture(label) { const path = `docs/screenshots/${prefix}-${label}.png`, data = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.captureArtifacts.push({ path, sha256: hash(data), bytes: data.length }); }
const close = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); page = await browser.newPage({ viewport: report.viewport }); page.setDefaultTimeout(45000);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('requestfailed', r => report.failedRequests.push({ url: r.url(), error: r.failure()?.errorText }));
  page.on('response', r => { if (r.status() < 400) return; const o = { url: r.url(), status: r.status() };
    if (new URL(r.url()).pathname === '/favicon.ico' && r.status() === 404) report.resourceWarnings.push(o); else report.failedRequests.push(o); });
  const url = new URL('__me1_prologue_enemies_fixture__', base);
  await page.route(url.href, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body style="margin:0;background:#07111d"><div id="fixture" style="position:relative;width:100vw;height:100vh"></div><script type="module">
    import ${JSON.stringify(new URL('@vite/env', base).href)};
    import {WorldView} from ${JSON.stringify(new URL('src/world.js', base).href)};
    import {createBattle,performAction} from ${JSON.stringify(new URL('src/combat.js', base).href)};
    import {newGame} from ${JSON.stringify(new URL('src/state.js', base).href)};
    import {actorFor,ENEMIES} from ${JSON.stringify(new URL('src/game-data.js', base).href)};
    const state=newGame({name:'Fixture trois familles',difficulty:'story'});state.flags.briefed=true;state.zone='eden-prime';
    const world=new WorldView(document.querySelector('#fixture'));
    const f=window.__PROLOGUE_SPRITES__={state,world,createBattle,performAction,actorFor,ENEMIES,beforeState:JSON.stringify(state),storageBefore:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),frame:0,last:performance.now()};
    world.setStoryContext(state);world.setZone('eden-prime',{party:['jenkins'],cleared:[]});world.setMode('combat');
    f.battle=createBattle({party:[actorFor('jenkins',state)],enemies:[{...ENEMIES.creeper,id:'creeper-0'},{...ENEMIES.asari,id:'asari-1'}],seed:2183,mode:'wait'});
    world.setBattle(f.battle);world.update(0);
    const loop=t=>{world.update(Math.min(.05,Math.max(0,(t-f.last)/1000)));f.last=t;f.frame=requestAnimationFrame(loop)};f.frame=requestAnimationFrame(loop);
  </script></body></html>` }));
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(ids => { const w = window.__PROLOGUE_SPRITES__?.world; return w && ids.every(id => w.atlases[`combat-${id}`]); }, [...ids, ...oldEnemies, ...oldCompanions]);
  assert.deepEqual(await page.evaluate(ids => Object.fromEntries(ids.map(id => [id, window.__PROLOGUE_SPRITES__.world.characterAnimations[id]])), ids), configs);
  for (const id of ids) { const path = `public/assets/${configs[id].combat.file}`, r = await page.request.get(new URL(`assets/${configs[id].combat.file}`, base).href);
    assert.equal(r.status(), 200); const observed = hash(await r.body()); assert.equal(observed, sourceHashes[path]); report.servedAssets.push({ path, status: 200, sha256: observed }); }
  for (const pose of ['aim', 'power', 'hit', 'down']) {
    await page.evaluate(pose => { const f = window.__PROLOGUE_SPRITES__, w = f.world;
      for (const a of f.battle.actors) a.hp = pose === 'down' ? 0 : a.maxHp;
      w.setBattle(f.battle); f.beforeRender = JSON.stringify(f.battle);
      // Visual-only spacing exposes all three held subjects. Native battle data
      // have no coordinate fields and remain unchanged throughout rendering.
      for (const [id, z] of [['jenkins', -2], ['creeper-0', -2], ['asari-1', 4]]) { const a = w.battleActors.get(id); a.basePosition.z = w.battleArena.z + z; a.group.position.copy(a.basePosition); }
      for (const native of f.battle.actors) { const a = w.battleActors.get(native.id); a.combatPoseTime = 0;
        if (pose === 'hit') w.playEvent({ type: 'damage', targetId: native.id });
        else if (pose !== 'down') w.playEvent({ type: 'action', actorId: native.id, actionId: pose === 'aim' ? 'shoot' : native.id === 'jenkins' ? 'cover' : native.sprite === 'creeper' ? 'strike' : 'throw' });
        if (pose !== 'down') a.combatPoseTime = 600;
      } w.update(0);
    }, pose);
    await page.waitForFunction(() => { const f = window.__PROLOGUE_SPRITES__, w = f.world, now = w.cameraTarget.toArray(), previous = f.lastCamera; f.lastCamera = now;
      return previous && Math.hypot(...now.map((v, i) => v - previous[i])) < .002 && w.effects.length === 0 && [...w.battleActors.values()].every(a => a.poseTime <= 0 && (a.shieldFlash || 0) <= 0); });
    const metrics = await page.evaluate(pose => { const f = window.__PROLOGUE_SPRITES__, w = f.world, V = w.camera.position.constructor;
      return f.battle.actors.map(native => { const a = w.battleActors.get(native.id), frame = w.characterAnimations[native.sprite].combat.frames[pose], map = a.body.material.map, g = a.body.geometry.parameters;
        a.body.updateWorldMatrix(true, false); const pivot = a.body.localToWorld(new V((frame.pivot[0] / frame.rect[2] - .5) * g.width, (.5 - frame.pivot[1] / frame.rect[3]) * g.height, 0)), anchor = a.group.localToWorld(new V(0, .05, 0));
        const points = []; for (const x of [-1, 1]) for (const y of [-1, 1]) { const p = a.body.localToWorld(new V(x * g.width / 2, y * g.height / 2, 0)).project(w.camera); points.push([(p.x * .5 + .5) * innerWidth, (-p.y * .5 + .5) * innerHeight]); }
        return { id: a.id, key: a.key, pose, frameId: a.animationFrame, texture: map.image.src, rect: frame.rect, pivot: frame.pivot, repeat: map.repeat.toArray(), offset: map.offset.toArray(),
          relativeHeight: g.height * a.body.scale.y / a.height, groundAnchorError: pivot.distanceTo(anchor), rotationZ: a.body.rotation.z, sourceMapDistinct: map !== w.atlases['combat-' + a.key],
          battleUnchanged: JSON.stringify(f.battle) === f.beforeRender, saveUnchanged: JSON.stringify(f.state) === f.beforeState,
          drawCalls: w.renderer.info.render.calls, bounds: { left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])), top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1])) } };
      });
    }, pose);
    for (const m of metrics) { const c = configs[m.key].combat, f = c.frames[pose], [x, y, width, height] = f.rect;
      assert.equal(m.frameId, f.id); assert.equal(new URL(m.texture).pathname, `/assets/${c.file}`); close(m.repeat[0], width / c.width, 'UV width'); close(m.repeat[1], height / c.height, 'UV height');
      close(m.offset[0], x / c.width, 'UV x'); close(m.offset[1], 1 - (y + height) / c.height, 'UV y'); close(m.relativeHeight, f.heightScale, 'height'); close(m.groundAnchorError, 0, 'pivot');
      assert.equal(m.rotationZ, 0); assert.ok(m.sourceMapDistinct && m.battleUnchanged && m.saveUnchanged && m.drawCalls > 0);
      assert.ok(m.bounds.left >= 0 && m.bounds.right <= 1280 && m.bounds.top >= 0 && m.bounds.bottom <= 800);
    }
    await capture(pose); report.cases.push(...metrics.map(m => ({ ...m, passed: true, screenshot: report.captureArtifacts.at(-1).path })));
  }
  report.nativeEvents = await page.evaluate(() => { const f = window.__PROLOGUE_SPRITES__, w = f.world, rows = [];
    const run = (key, actionId) => {
      w.setBattle(null); w.setStoryContext(f.state);
      const party = ['shepard', 'jenkins'].map(id => ({ ...f.actorFor(id, f.state), atb: 100 }));
      const enemy = { ...f.ENEMIES[key === 'jenkins' ? 'geth' : key], id: (key === 'jenkins' ? 'geth' : key) + '-0', atb: 100 };
      if (actionId === 'barrier') enemy.shield = 0;
      const b = f.createBattle({ party, enemies: [enemy], seed: 2183, mode: 'wait', medigel: 4 });
      const native = b.actors.find(a => key === 'jenkins' ? a.id === 'jenkins' : a.team === 'enemy'), target = b.actors.find(a => a.id === 'shepard'), beforePowers = JSON.stringify(native.powers), beforeHeat = native.heat;
      const r = f.performAction(b, { actorId: native.id, actionId, targetId: ['cover', 'barrier'].includes(actionId) ? native.id : target.id });
      w.setBattle(b); for (const e of r.events) w.playEvent(e); w.update(0);
      const actionFrame = w.battleActors.get(native.id).animationFrame, actionWitness = { cover: native.cover, barrier: native.statuses.barrier || 0, targetStagger: target.statuses.stagger || 0, beforeHeat, afterHeat: native.heat };
      // A separate ready shooter provides an actual native damage witness.
      const shooter = b.actors.find(a => a.id === 'shepard'); shooter.atb = 100;
      native.cover = false; native.shield = 0; native.hp = native.maxHp;
      const hit = f.performAction(b, { actorId: key === 'jenkins' ? enemy.id : shooter.id, actionId: 'shoot', targetId: native.id });
      w.setBattle(b); for (const e of hit.events) w.playEvent(e); w.playEvent({ type: 'action', actorId: native.id, actionId }); w.update(0);
      const hitFrame = w.battleActors.get(native.id).animationFrame;
      native.hp = 1; native.shield = 0;
      const killer = b.actors.find(a => a.id === (key === 'jenkins' ? enemy.id : shooter.id)); killer.atb = 100; killer.attack = 5000;
      const ko = f.performAction(b, { actorId: killer.id, actionId: 'shoot', targetId: native.id }), beforeRender = JSON.stringify(b);
      w.setBattle(b); for (const e of ko.events) w.playEvent(e); w.playEvent({ type: 'action', actorId: native.id, actionId }); w.update(0);
      rows.push({ key, actionId, actionOK: r.ok, actionFrame, actionWitness, liveDamageOK: hit.ok, hitFrame, koOK: ko.ok,
        koFrame: w.battleActors.get(native.id).animationFrame, hpAfterKO: native.hp, powersUnchanged: JSON.stringify(native.powers) === beforePowers, rendererPreservesBattle: JSON.stringify(b) === beforeRender });
    };
    run('jenkins', 'cover'); run('creeper', 'strike'); run('asari', 'throw'); run('asari', 'barrier'); return rows;
  });
  for (const r of report.nativeEvents) { assert.ok(r.actionOK && r.liveDamageOK && r.koOK && r.powersUnchanged && r.rendererPreservesBattle);
    assert.equal(r.actionFrame, `${r.key}-combat-power`); assert.equal(r.hitFrame, `${r.key}-combat-hit`); assert.equal(r.koFrame, `${r.key}-combat-down`); assert.equal(r.hpAfterKO, 0);
    if (r.actionId === 'cover') assert.equal(r.actionWitness.cover, true);
    if (r.actionId === 'strike') close(r.actionWitness.afterHeat, r.actionWitness.beforeHeat, 'Organic strike adds no firearm heat');
    if (r.actionId === 'barrier') assert.ok(r.actionWitness.barrier > 0);
    if (r.actionId === 'throw') assert.ok(r.actionWitness.targetStagger > 0);
  }
  report.scopeClosures = await page.evaluate(() => { const f = window.__PROLOGUE_SPRITES__, w = f.world, rows = [];
    for (const key of ['jenkins', 'creeper', 'asari']) for (const patch of [{ mediaId: 'ME3' }, { periodId: 'me2' }, { context: { mediaId: 'MEA' } },
      { id: 'ME3-FOREIGN-' + key }, { sprite: 'geth' }, { team: key === 'jenkins' ? 'enemy' : 'party' }]) {
      w.setBattle(null); w.setStoryContext(f.state);
      const person = key === 'jenkins' ? { ...f.actorFor('jenkins', f.state), ...patch } : { ...f.ENEMIES[key], id: key + '-0', ...patch };
      const b = f.createBattle({ party: key === 'jenkins' ? [person] : [f.actorFor('shepard', f.state)], enemies: key === 'jenkins' ? [{ ...f.ENEMIES.geth, id: 'geth-0' }] : [person], seed: 2183 });
      const native = b.actors.find(a => a.id === person.id); if (patch.team) native.team = patch.team;
      w.setBattle(b); w.update(0); const view = w.battleActors.get(native.id);
      rows.push({ key, patch, frame: view.animationFrame || null, usesNewAtlas: /\/(?:companion-jenkins|enemy-(?:creeper|asari))-combat\.png$/.test(view.body.material.map.image.src || '') });
    } return rows;
  });
  assert.equal(report.scopeClosures.length, 18); assert.ok(report.scopeClosures.every(r => r.frame === null && !r.usesNewAtlas));
  report.narrativeClosures = await page.evaluate(() => { const f = window.__PROLOGUE_SPRITES__, w = f.world, rows = [];
    for (const patch of [{ lost: ['jenkins'] }, { flags: { jenkinsLost: true } }, { completed: ['eden-prime'] }]) {
      w.setBattle(null); w.setStoryContext({ ...f.state, ...patch });
      const b = f.createBattle({ party: [f.actorFor('jenkins', f.state)], enemies: [{ ...f.ENEMIES.geth, id: 'geth-0' }], seed: 2183 });
      w.setBattle(b); w.update(0); const a = w.battleActors.get('jenkins');
      rows.push({ patch, frame: a.animationFrame || null, usesNewAtlas: (a.body.material.map.image.src || '').endsWith('/companion-jenkins-combat.png'), stateUnchanged: JSON.stringify(f.state) === f.beforeState });
    } w.setStoryContext(f.state); return rows;
  });
  assert.ok(report.narrativeClosures.every(r => r.frame === null && !r.usesNewAtlas && r.stateUnchanged));
  report.regressions = await page.evaluate(() => { const f = window.__PROLOGUE_SPRITES__, w = f.world, rows = [], defs = { geth: 'geth', husk: 'husk', 'geth-sniper': 'sniper', 'geth-destroyer': 'destroyer', krogan: 'krogan', rachni: 'rachni' };
    for (const key of [...Object.keys(defs), 'ashley', 'kaidan', 'garrus', 'tali', 'wrex', 'liara']) {
      w.setBattle(null); w.setStoryContext(f.state); const enemy = Object.hasOwn(defs, key), id = enemy ? defs[key] + '-0' : key;
      const b = f.createBattle({ party: [f.actorFor(enemy ? 'shepard' : key, f.state)], enemies: [{ ...f.ENEMIES[enemy ? defs[key] : 'geth'], id: enemy ? id : 'geth-0' }], seed: 2183 });
      w.setBattle(b); w.update(0); const a = w.battleActors.get(id); rows.push({ key, frame: a.animationFrame, texture: a.body.material.map.image.src, saveUnchanged: JSON.stringify(f.state) === f.beforeState });
    } return rows;
  });
  for (const r of report.regressions) { assert.equal(r.frame, `${r.key}-combat-aim`); assert.ok(r.texture.endsWith(`/${kind(r.key)}-${r.key}-combat.png`)); assert.equal(r.saveUnchanged, true); }
  report.fixturePreserved = await page.evaluate(() => { const f = window.__PROLOGUE_SPRITES__, out = { stateUnchanged: JSON.stringify(f.state) === f.beforeState,
    storageBefore: f.storageBefore, storageAfter: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])), assetErrors: f.world.assetErrors }; cancelAnimationFrame(f.frame); f.world.dispose(); return out; });
  assert.ok(report.fixturePreserved.stateUnchanged); assert.deepEqual(report.fixturePreserved.storageBefore, report.fixturePreserved.storageAfter); assert.deepEqual(report.fixturePreserved.assetErrors, []);
  assert.equal(report.cases.length, 12); assert.equal(report.captureArtifacts.length, 4); assert.equal(report.regressions.length, 12);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  for (const [path, expected] of Object.entries(sourceHashes)) assert.equal(hash(await bytes(path)), expected, `Source changed during fixture:${path}`);
  report.passed = true;
} catch (error) { report.failure = error.stack || String(error); process.exitCode = 1; console.error(report.failure); if (page) await capture('failure').catch(() => {}); }
finally { await browser?.close(); await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ passed: report.passed, poses: report.cases.length, captures: report.captureArtifacts.length, nativeEvents: report.nativeEvents.length, failure: report.failure })); }

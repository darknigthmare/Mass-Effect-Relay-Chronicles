// Production Féros. The first save prepares earlier chapters only.
// Transfers between overlaid test segments change position in a public export.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { newGame, recruit, zoneEncounters, winEncounter, completeZone, encodeSave, decodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { FEROS_COLONIST_TARGETS, ferosColonyReport, listAdvanceFerosPOIs, transitionAdvanceFeros } from '../src/advance-feros.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { getLevelLayout, isLevelGround } from '../src/level-layout-data.js';
import { findLevelPath } from '../src/world-navigation.js';

const baseCommit = 'b005e47dd78e2b642a6ee888ec2b7ea46521ef73';
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4260/');
const dist = resolve(process.env.P0_FEROS_DIST || 'dist');
const output = process.env.P0_FEROS_REPORT || 'docs/qa/p0-feros-campaign-report.json';
const captureFolder = process.env.P0_FEROS_CAPTURES;
const scope = process.env.P0_FEROS_SCOPE || 'campaign';
assert.ok(['campaign', 'passage', 'boss'].includes(scope));
const layout = getLevelLayout('feros'), bounds = WORLD_ZONES.feros.bounds;
const radar = levelMapProjection(bounds, { left: 12, top: 12, width: 126, height: 126 });
const projection = levelMapProjection(bounds);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const entries = JSON.parse(await readFile('docs/content-catalog.json', 'utf8')).entries;
const dedicatedSources = ['src/advance-feros.js','src/advance-feros-ui.js','scripts/p0-feros-campaign-browser.mjs'];
const sourceList = [...dedicatedSources,'src/game-data.js','src/main.js','src/world.js',
  'src/boss-phases.js','src/state.js','src/combat.js'];
const sources = Object.fromEntries(await Promise.all(sourceList.map(async path => [path, hash(await readFile(path))])));
const checks = [], captures = [], exports = [], fixtures = [], encounters = [], motions = [], errors = [], responses = [], served = new Map();
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1040, height: 800 }, acceptDownloads: true });
page.setDefaultTimeout(75000);
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const target = new URL(response.url());
  if (target.origin !== url.origin) return;
  const path = decodeURIComponent(target.pathname.slice(1)) || 'index.html';
  if (path === 'favicon.ico' && response.status() === 404) return;
  if (response.status() >= 400 || path.startsWith('src/')) errors.push(`${response.status()} ${path}`);
  if (response.status() !== 200 || served.has(path)) return;
  served.set(path, null);
  responses.push((async () => {
    const [content, local] = await Promise.all([response.body(), readFile(join(dist, path))]);
    assert.equal(hash(content), hash(local), path);
    served.set(path, hash(content));
  })().catch(error => errors.push(error.message)));
});
const action = (id, value) => page.locator(`[data-do="${id}"]${value ? `[data-id="${value}"]` : ''}`).first();
const dialogue = page.locator('#overlay .dialogue');
const feros = key => page.locator(`.dialogue[data-conversation-id="advance-feros"]${key ? `[data-current-topic="advance:feros:${key}"]` : ''}`);
const reply = (key, id) => feros(key).locator(`[data-reply-id="${id}"]`);
const key = value => page.keyboard.press(value);
const poiId = name => `advance:feros:${name}`;
const at = (position, radius, from) => Math.hypot(position.x - from.x, position.z - from.z) < radius;
async function ready() {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active').waitFor({ state: 'hidden' });
  await page.locator('#overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
}
async function capture(label) {
  if (!captureFolder) return;
  const path = join(captureFolder, `p0-feros-${label}.png`);
  const bytes = await page.screenshot({ path, animations: 'disabled' });
  captures.push({ label, path, sha256: hash(bytes) });
}
async function check(suffix, observations) {
  const id = `QST-${suffix}`, row = entries.find(entry => entry.id === id);
  assert.ok(row);
  checks.push({ id, passed: true, exactDescription: row.description, exactCriterion: row.acceptance, observations });
  console.log(id);
  if (process.env.P0_FEROS_CHECKPOINTS === '1') {
    await Promise.all(responses);
    assert.deepEqual(errors, []);
    for (const path of dedicatedSources) assert.equal(hash(await readFile(path)),sources[path],path);
    const checkpoint = output.replace(/\.json$/, `-${id}.json`);
    assert.notEqual(checkpoint,output);
    await writeFile(checkpoint,JSON.stringify({ passed:true,baseCommit,at:new Date().toISOString(),scope,
      command:'node scripts/p0-feros-campaign-browser.mjs',url:url.href,
      checks:[checks.at(-1)], captures,encounters,sources,fixtures,exports,
      served:Object.fromEntries(served),limitations:['Ce rapport est un jalon autonome. Les autres objectifs du collecteur peuvent encore être en cours.',
        'Les octets HTTP sont vérifiés contre le bundle isolé. Les empreintes source partagées décrivent le début du parcours, avant les éventuelles retouches parallèles.'] },
      null,2)+'\n',{flag:'wx'});
  }
}
async function importFromTitle(state, origin) {
  if (!await action('import').isVisible()) {
    await ready(); await key('Escape'); await action('quit').click();
  }
  const bytes = Buffer.from(encodeSave(state));
  assert.ok(decodeSave(bytes.toString()));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'preuve-feros.json', mimeType: 'application/json', buffer: bytes });
  await ready();
  fixtures.push({ origin, position: state.position, sha256: hash(bytes) });
}
async function exportState(label) {
  await ready(); await key('Escape'); await action('save').click();
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const bytes = await readFile(await download.path()), state = decodeSave(bytes.toString());
  assert.ok(state);
  const sha256 = hash(bytes);
  exports.push({ label, sha256, position: state.position, advanceFeros: state.advanceFeros, cleared: state.cleared,
    credits: state.credits, xp: state.xp, colony: ferosColonyReport(state) });
  await action('close').click(); await ready();
  return { state, sha256 };
}
async function reposition(source, position, label) {
  const state = structuredClone(source.state);
  state.position = position;
  await importFromTitle(state, { label, sourceExport: source.sha256, fieldsChanged: ['position'] });
}
async function reload() {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click(); await ready();
}

function offset(point, transform) {
  return { x: bounds.minX + (point.x - transform.originX) / transform.scale,
    z: bounds.minZ + (point.z - transform.originZ) / transform.scale };
}
async function leader() {
  const raw = await page.locator('.minimap svg > circle[r="3.5"]').evaluate(node => ({ x: +node.getAttribute('cx'), z: +node.getAttribute('cy') }));
  return offset(raw, radar);
}
async function mapNote() {
  await key('KeyM'); await action('map-filter', 'all').waitFor(); await action('map-filter', 'all').click();
  return page.locator('.local-map-layout');
}
async function walk(id) {
  const map = await mapNote();
  const info = await map.evaluate((el, id) => {
    const marker = el.querySelector(`circle[data-map-position="${id}"]`);
    if (!marker) throw Error(id + ' absent de la carte publique');
    const button = [...el.querySelectorAll('button[data-id]')].find(node => node.dataset.id === id);
    return { x: +marker.getAttribute('cx'), z: +marker.getAttribute('cy'), label: button?.title,
      obstacles: [...el.querySelectorAll('[data-map-obstacle]')].map(node => node.tagName.toLowerCase() === 'circle'
        ? { kind: 'circle', x: +node.getAttribute('cx'), z: +node.getAttribute('cy'), radius: +node.getAttribute('r') }
        : { kind: 'rect', minX: +node.getAttribute('x'), minZ: +node.getAttribute('y'), maxX: +node.getAttribute('x') + +node.getAttribute('width'), maxZ: +node.getAttribute('y') + +node.getAttribute('height') }) };
  }, id);
  await action('close').click(); await ready();
  const target = offset(info, projection);
  const collision = (x,z, margin) => info.obstacles.some(obstacle => obstacle.kind === 'circle'
    ? Math.hypot(x-obstacle.x,z-obstacle.z) < obstacle.radius + margin
    : x>obstacle.minX-margin&&x<obstacle.maxX+margin&&z>obstacle.minZ-margin&&z<obstacle.maxZ+margin);
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].map(([right,forward]) => {
    const x = 27*right - 23*forward, z = -23*right - 27*forward, length = Math.hypot(x,z);
    return { right, forward, x: x/length, z: z/length };
  });
  for (let step=0; step<80; step++) {
    const before = await leader();
    if (info.label && await page.locator('#hud .interaction').filter({ hasText: info.label }).count()
      || at(before,.65,target)) return;
    const baseFree = (x,z) => isLevelGround(layout,x,z)&&!collision(x,z,.2);
    const free = baseFree(before.x,before.z)&&baseFree(target.x,target.z) ? baseFree : (x,z)=>isLevelGround(layout,x,z)&&!collision(x,z,0);
    const route = findLevelPath({ bounds, start:before, destination:target,isWalkable:free });
    assert.ok(route?.length, id);
    const clear = (x,z) => {
      const count=Math.ceil(Math.hypot(x-before.x,z-before.z)/.2);
      for(let i=1;i<=count;i++)if(!free(before.x+(x-before.x)*i/count,before.z+(z-before.z)*i/count))return false;
      return true;
    };
    let next=route[0];
    for(const point of route) {
      if (!at(point,3.4,before)||!clear(point.x,point.z)) break;
      next=point;
    }
    const direction = directions.filter(item=>clear(before.x+item.x*.6,before.z+item.z*.6))
      .sort((a,b) => (b.x-a.x)*(next.x-before.x)+(b.z-a.z)*(next.z-before.z))[0];
    assert.ok(direction, id);
    const keys=['ShiftLeft',...(direction.right?[direction.right>0?'KeyD':'KeyA']:[]),
      ...(direction.forward?[direction.forward>0?'KeyW':'KeyS']:[])];
    const expected=Math.max(.35,Math.min(1.6,Math.hypot(next.x-before.x,next.z-before.z)));
    for (const button of keys) await page.keyboard.down(button);
    let after=before;
    try {
      const deadline=Date.now()+4200;
      while(Date.now()<deadline) {
        after=await leader();
        if(!at(after,expected,before) || info.label&&await page.locator('#hud .interaction').filter({hasText:info.label}).count()) break;
        await page.waitForTimeout(65);
      }
    } finally { for(const button of keys.reverse()) await page.keyboard.up(button); }
    motions.push({ id, before, after });
  }
  throw Error(`Déplacement clavier incomplet vers ${id}`);
}
async function open(name) {
  await walk(poiId(name)); await key('KeyE'); await feros(name).waitFor();
}
async function act(name, selection, close = true) {
  await reply(name,selection).click();
  if (close) { await feros(name).getByRole('button',{ name:'Retour sur le terrain.' }).click(); await ready(); }
}
async function interact(name, selection) { await open(name); await act(name,selection); }

async function fight(id, onlyLearnedName = false) {
  await walk(id); await key('KeyE');
  const combat=page.locator('#battle-ui .battle-shell'), victory=action('claim-victory'), nodes=new Set();
  await combat.waitFor();
  if (onlyLearnedName) assert.doesNotMatch(await combat.innerText(), /Thorien|Thorian/i);
  console.log(JSON.stringify({ combat:id, ouverture:true }));
  const until=Date.now()+180000;
  let orders=0;
  while (!await victory.isVisible()) {
    assert.ok(Date.now()<until, `Échéance du combat ${id}`);
    assert.equal(await action('retry').isVisible(),false);
    const field=await combat.innerText({ timeout:650 }).catch(()=> '');
    for(const match of field.matchAll(/nœud neural (\d)\/6/gi)) nodes.add(Number(match[1]));
    const commands = await page.locator('[data-do="battle-action"]:not(:disabled)').evaluateAll(nodes=>nodes.map(node=>node.dataset.id));
    if (commands.includes('shoot')) {
      await key('Space');
      orders++; // Actual action count is also read from the victory screen.
    } else {
      const fallback = commands.includes('cover') ? 'cover' : commands.includes('advance') ? 'advance' : null;
      const bounds = fallback && await action('battle-action',fallback).boundingBox({ timeout:800 }).catch(()=>null);
      if(bounds) await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    }
    await page.waitForTimeout(95);
  }
  assert.ok(orders>0, id);
  const result=await page.locator('.ending-grid').innerText();
  encounters.push({ id, orders, nodes:[...nodes].sort(), result });
  await victory.click(); await ready();
  return nodes;
}

function initial() {
  const state=newGame({ name:'Recette Féros', difficulty:'story', mode:'wait', classId:'soldier' });
  state.flags.briefed=true; state.settings.reducedMotion=true;
  for(const zone of ['eden-prime','citadel']) {
    state.zone=zone; recordVisit(state,zone);
    if(zone==='citadel')assert.equal(recruit(state,'tali'),true);
    for(const id of zoneEncounters(zone))assert.equal(winEncounter(state,id),true);
    assert.equal(completeZone(state,zone),true);
  }
  state.zone='feros'; recordVisit(state,'feros'); state.position={x:-20,z:-10};
  return state;
}

function preparedPassage() {
  const state=initial();
  const advance = (key, selected) => {
    const point=listAdvanceFerosPOIs(state).find(point => point.id===poiId(key));
    assert.ok(point, key); state.position={x:point.x,z:point.z};
    const result=transitionAdvanceFeros(state,point.id,selected);
    assert.equal(result.ok,true,result.reason); state.advanceFeros=result.progress;
  };
  assert.equal(winEncounter(state,'feros:encounter-1'),true);
  advance('defense','coordinate'); advance('lizbeth','listen');
  assert.equal(winEncounter(state,'feros:encounter-2'),true);
  advance('investigation','research'); state.position={x:25,z:-54};
  return state;
}

try {
  await page.goto(url.href, { waitUntil:'networkidle' });
  assert.equal(await page.evaluate(()=> '__RELAY_TEST__' in window), false);
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.locator('#motion-setting').check();
  await action('close').click();
  if (scope === 'passage') {
    await importFromTitle(preparedPassage(), { label:'Préparation native déclarée jusqu’à la recherche ExoGeni. Vannes encore fermées, mécanisme et passage à jouer.' });
  } else if (scope === 'campaign') {
    await importFromTitle(initial(), { label:'Eden Prime et Citadelle préparées par les API natives. Aucun progrès Féros attribué.' });
    const map=await mapNote();
    assert.doesNotMatch(await map.innerText(), /Thorien|Thorian|Cipher/i);
    await action('close').click(); await ready();
    await fight('feros:encounter-1',true);
    const barrage=await exportState('premier-barrage');
    assert.ok(barrage.state.cleared.includes('feros:encounter-1'));
    assert.equal(barrage.state.advanceFeros.defense,false);
    await reposition(barrage,{x:-26,z:64},'Accès au poste de défense');
    await interact('defense','coordinate');
    await key('KeyJ');
    const services=page.locator('[data-feros-defense-services]');
    assert.match(await services.innerText(), /Défense coordonnée.*Services rétablis 0\/4.*Rétablir l’eau.*Disponible/s);
    await capture('services');
    await action('close').click();
    const defense=await exportState('defense');
    assert.equal(defense.state.advanceFeros.defense,true);
    await check('defense-de-zhu-s-hope',{ combat:encounters[0], rapportEtServices:true, aucunServiceAccordeAutomatiquement:true });

    await reposition(defense,{x:8,z:-40},'Arrivée dans les installations adaptées');
    await interact('lizbeth','listen');
    const before=await mapNote();
    assert.doesNotMatch(await before.innerText(), /Révélation des spores|Créatures du Thorien|Repaire du Thorien|Le Thorien/i);
    assert.equal(await before.locator(`circle[data-map-position="${poiId('investigation')}"]`).count(),0);
    await action('close').click(); await ready();
    await fight('feros:encounter-2',true);
    await open('investigation');
    assert.match(await feros('investigation').innerText(),/spores.*organismes contaminés/s);
    await capture('recherche');
    await act('investigation','research');
    const investigation=await exportState('recherche');
    assert.equal(investigation.state.advanceFeros.investigation,true);
    await check('enquete-exogeni',{ coordonneesDeTerrain:true,batailleSansEtiquettePrematuree:true, carteEtTemoignageAvantInterface:true });

  }

  if (scope !== 'boss') {
    await open('service-exogeni');
    assert.equal(await reply('service-exogeni','cross').isDisabled(),true);
    await feros('service-exogeni').getByRole('button',{name:'Revenir sur le terrain.'}).click();
    await open('pressure');
    assert.equal(await reply('pressure','release').isDisabled(),true);
    for(const i of [1,3,4])await act('pressure',`valve-${i}`,false);
    assert.match(await feros('pressure').innerText(),/31 PSI/);
    await capture('pression');
    await act('pressure','release');
    let origin=await leader();
    await open('service-exogeni'); await act('service-exogeni','cross',false); await ready();
    const skyway=await leader();
    assert.ok(at(skyway,3,{x:-14,z:-17})&&!at(skyway,30,origin));
    await reload();
    assert.ok(at(await leader(),3,skyway));
    await open('service-skyway'); await capture('passage');
    await act('service-skyway','cross',false); await ready();
    const exogeni=await leader();
    assert.ok(at(exogeni,3,{x:25,z:-54}));
    await open('service-exogeni'); await act('service-exogeni','cross',false); await ready();
    const crossing=await exportState('passage-ouvert');
    assert.equal(crossing.state.advanceFeros.shipReleased,true);
    await check('degagement-du-vaisseau-geth',{ ferrureActionneeA31PSI:true,refusAvant:true,skyway,exogeni,reprise:true });
  }

  let colony;
  if (scope === 'campaign') {
    await interact('jeong','confront'); await interact('juliana','prepare');
    const intervention=await exportState('preparation-colons');
    assert.equal(ferosColonyReport(intervention.state).spared,0);
    await reposition(intervention,{x:-35,z:58},'Approche du quartier d’intervention');
    for(const [i,target] of FEROS_COLONIST_TARGETS.entries()) {
      await interact(`colonist-${target.id}`,['gas','melee','lethal'][i%3]);
    }
    await interact('freighter','open');
    colony=await exportState('seize-interventions');
    const outcome=ferosColonyReport(colony.state);
    assert.deepEqual([outcome.resolved,outcome.gas,outcome.melee,outcome.killed],[16,6,5,5]);
    assert.equal(outcome.spared,11);
    assert.equal(colony.state.advanceFeros.freighterOpened,true);
    await check('retour-des-colons',{ gaz:6,melee:5,lethal:5,survivants:outcome.survivors.map(target=>target.id),freighterOpened:true });
  } else if (scope === 'boss') {
    const previous=JSON.parse(await readFile('docs/qa/advance-feros-public-production-final-01-report.json','utf8'));
    const archived=previous.exports.find(item=>item.label==='colony-cargo');
    assert.equal(previous.passed,true);
    const bytes=await readFile(archived.path),state=decodeSave(bytes.toString());
    assert.equal(hash(bytes),archived.sha256);
    assert.ok(state?.advanceFeros.freighterOpened);
    assert.equal(state.cleared.includes('feros:boss'),false);
    assert.equal(ferosColonyReport(state).resolved,16);
    colony={state,sha256:archived.sha256};
  }

  if (colony) {
    const baseline=ferosColonyReport(colony.state);
    await reposition(colony,{x:0,z:-82},'Approche du repaire depuis un export public après ouverture');
    const nodes=await fight('feros:boss');
    assert.deepEqual([...nodes].sort(),[1,2,3,4,5,6]);
    await open('shiala'); await act('shiala','receive',false);
    await act('shiala','spare');
    await walk('feros:objective'); await key('KeyE'); await dialogue.waitFor();
    assert.match(await dialogue.innerText(),new RegExp(`${baseline.spared} habitants.*${baseline.killed} ont été tués`,'s'));
    await capture('bilan');
    await dialogue.getByRole('button',{name:/Valider ce bilan/}).click();
    await dialogue.getByRole('button',{name:'Retourner au Normandy.'}).click();
    await ready(); await reload();
    const final=await exportState('mission-reprise');
    assert.equal(final.state.completed.includes('feros'),true);
    assert.equal(final.state.choices.feros,'save');
    assert.equal(final.state.advanceFeros.cipher,true);
    assert.equal(final.state.advanceFeros.shiala,'spared');
    assert.deepEqual(ferosColonyReport(final.state).survivors,baseline.survivors);
    await check('affrontement-du-thorian',{ combat:encounters.at(-1),shiala:'spared',cipher:true,colonists:baseline.spared,reloaded:true });
  }

  await Promise.all(responses);
  assert.deepEqual(errors,[]);
  for(const path of dedicatedSources)assert.equal(hash(await readFile(path)),sources[path],path);
  const finalSources = Object.fromEntries(await Promise.all(sourceList.map(async path => [path,hash(await readFile(path))])));
  const sharedSourceChanges = sourceList.filter(path => finalSources[path] !== sources[path]);
  await writeFile(output,JSON.stringify({ passed:true,baseCommit,at:new Date().toISOString(),
    command:'node scripts/p0-feros-campaign-browser.mjs',scope,url:url.href,checks,captures,encounters,sources,finalSources,sharedSourceChanges,fixtures,exports,motions,served:Object.fromEntries(served),
    displayQuality:'economy',limitations:['Les chapitres précédents sont préparés par les API natives. Les rapprochements explicitement déclarés réimportent un vrai export avec la position seule modifiée.',
      'Les objectifs sont joués dans le niveau adapté existant, avec des interventions civiles et des combats ATB. Aucun décor, dialogue ou scène d’origine supplémentaire n’est reproduit.'],
  },null,2)+'\n',{flag:'wx'});
} catch (error) {
  await capture('diagnostic').catch(()=>{});
  console.error({ errors, checks: checks.map(item=>item.id), motions: motions.slice(-4), encounters });
  throw error;
} finally { await browser.close(); }

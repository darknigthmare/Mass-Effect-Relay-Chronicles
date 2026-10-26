import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = {
  passed: false, at: new Date().toISOString(), stage: 'prepare', checks: [], screenshots: [], errors: [], failedRequests: [],
  weapons: [], armors: [], modifiers: [], oppositions: [], visuals: [], tacticalVictories: [],
  scope: 'Actual UI and native callback checks of eight additional bounded weapon profiles, edition-scoped aggregate armor, one conventional-SMG cooldown module, six independent opposition benches and 24 partial generated illustrations. Numerical budgets, boss limitations and artwork remain explicit ATB/prototype adaptations; this is not global 1:1 fidelity or source-mission reproduction.',
};
let browser, page, baselineState, baselineStorage;
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const session = () => page.evaluate(() => window.__RELAY_TEST__.getChronicle());
const battle = () => page.evaluate(() => window.__RELAY_TEST__.getChronicleBattle());
const campaignState = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const campaignStorage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage)
  .filter(key => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.'))
  .sort().map(key => [key, localStorage.getItem(key)])));
const chronicleStorage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage)
  .filter(key => key.startsWith('relay-chronicles.chronicle.')).sort().map(key => [key, localStorage.getItem(key)])));
const gear = (actorId, slot) => page.locator(`[data-chronicle-gear][data-actor-id="${actorId}"][data-slot="${slot}"]`);
const buildSelect = actorId => page.locator(`[data-chronicle-build][data-actor-id="${actorId}"]`);
const combatant = (combat, id) => combat.actors.find(actor => actor.id === id);
const compactActor = actor => Object.fromEntries(['id', 'hp', 'shield', 'maxShield', 'atb', 'heat', 'ammo', 'reserveAmmo', 'magazineCapacity', 'grenadeCharges', 'grenadeCapacity', 'weaponProfileId', 'weaponSystem', 'channel', 'statuses'].filter(key => actor[key] !== undefined).map(key => [key, actor[key]]));
async function preparedActor(actorId) {
  return page.evaluate(async id => (await import('/src/chronicles.js')).buildChronicleActor(window.__RELAY_TEST__.getChronicle(), id), actorId);
}

async function screenshot(name) {
  const filename = `arsenal-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, out)), timeout: 60000 });
  report.screenshots.push(`test-results/${filename}`);
}
async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState() && !qa.getUI().busy && (!expected || qa.getState().zone === expected);
  }, zone || null, { polling: 100, timeout: 60000 });
}
async function selectContext(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (periodId && await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function prepare(mediaId, periodId, scenarioId) {
  await selectContext(mediaId, periodId); await action('universe-tab', 'session').click();
  if (await page.locator('#chronicle-scenario').inputValue() !== scenarioId) await page.locator('#chronicle-scenario').selectOption(scenarioId);
  await action('chronicle-start').click();
  await page.waitForFunction(({ mediaId, periodId, scenarioId }) => {
    const current = window.__RELAY_TEST__.getChronicle();
    return current?.context.mediaId === mediaId && current.context.periodId === periodId && current.scenarioId === scenarioId;
  }, { mediaId, periodId, scenarioId }, { polling: 100, timeout: 60000 });
}
async function selectParty(ids) {
  const current = await session(), unwanted = current.party.filter(id => !ids.includes(id));
  const keeper = current.party.some(id => ids.includes(id)) ? null : unwanted.pop();
  for (const id of unwanted) await action('chronicle-party', id).click();
  for (const id of ids.filter(id => !(current.party.includes(id)))) {
    await action('chronicle-party', id).click();
    if (keeper && (await session()).party.includes(keeper)) await action('chronicle-party', keeper).click();
  }
  assert.deepEqual([...(await session()).party].sort(), [...ids].sort());
}
async function blockedOption(actorId, slot, itemId) {
  const observed = await gear(actorId, slot).locator(`option[value="${itemId}"]`).evaluate(option => ({ disabled: option.disabled, attribute: option.hasAttribute('disabled'), label: option.textContent }));
  assert.equal(observed.disabled, true, `${itemId}: ${JSON.stringify(observed)}`);
  assert.equal(observed.attribute, true);
}
async function exportDownload(button, filename) {
  const pending = page.waitForEvent('download'); await button.click();
  const download = await pending, path = fileURLToPath(new URL(filename, out));
  await download.saveAs(path); return readFile(path, 'utf8');
}
async function importChronicle(contents, valid = true) {
  await page.evaluate(() => { window.__ARSENAL_IMPORT_FEEDBACK__ = document.querySelector('.universe-feedback'); });
  await page.locator('#chronicle-import').setInputFiles({ name: 'arsenal.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => {
    const current = document.querySelector('.universe-feedback');
    return document.querySelector('#chronicle-import').value === '' && current && current !== window.__ARSENAL_IMPORT_FEEDBACK__;
  }, null, { polling: 100, timeout: 60000 });
  await page.evaluate(() => { delete window.__ARSENAL_IMPORT_FEEDBACK__; });
  assert.equal(await page.locator('.universe-feedback.error').count(), valid ? 0 : 1);
}
async function assertIsolated() {
  assert.deepEqual(await campaignStorage(), baselineStorage, 'Chronicle actions and reload leave the entry checkpoint and manual ME1 saves byte-identical');
  const live = await campaignState(); if (live) assert.deepEqual(live, baselineState, 'Chronicles do not advance the ME1 clock, inventory, choices or rewards');
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getBattle()), null);
}
async function establishCampaignWitness() {
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Alex Arsenal');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle('normandy');
  await action('equipment').click(); await action('eq-tab', 'shop').click(); await action('eq-buy', 'heat-sink-i').click();
  await action('eq-tab', 'inventory').click(); await action('eq-equip', 'heat-sink-i').click(); await action('close').click();
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('ME1 — témoin arsenal Chroniques'); await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click();
  const before = await campaignState(), manual = await campaignStorage();
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  baselineState = await campaignState(); baselineStorage = await campaignStorage();
  assert.deepEqual(baselineState, before);
  assert.deepEqual(JSON.parse(baselineStorage['relay-chronicles.save.v1']).state, before);
  assert.equal(baselineState.credits, 150); assert.equal(baselineState.inventory.equipped.shepard.weaponMod, 'heat-sink-i');
  for (const key of Object.keys(manual).filter(key => key !== 'relay-chronicles.save.v1')) assert.equal(baselineStorage[key], manual[key]);
}
async function waitReady(actorId, actionId) {
  await page.evaluate(async ({ actorId, actionId }) => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    for (let turn = 0; turn < 400; turn++) {
      const combat = qa.getChronicleBattle();
      if (!combat || combat.winner) throw new Error('The Chronicle ended before the requested order');
      if (getActions(combat, actorId).some(action => action.id === actionId && action.available)) return;
      for (const member of combat.actors.filter(actor => actor.team === 'party' && actor.id !== actorId && actor.hp > 0)) {
        if (getActions(combat, member.id).some(action => action.id === 'cover' && action.available)) {
          const result = qa.chronicleAction({ actorId: member.id, actionId: 'cover', targetId: member.id });
          if (!result?.ok) throw new Error(result?.reason || 'A legitimate companion cover order failed');
        }
      }
      qa.chronicleStep(.25);
    }
    throw new Error(`${actorId} did not become ready for ${actionId}`);
  }, { actorId, actionId });
}
async function uiOrder(actorId, actionId, targetId) {
  await waitReady(actorId, actionId);
  await action('chronicle-actor', actorId).click();
  const targetKind = await page.evaluate(async ({ actorId, actionId }) => (await import('/src/combat.js')).getActions(window.__RELAY_TEST__.getChronicleBattle(), actorId).find(action => action.id === actionId).target, { actorId, actionId });
  const targeted = !['self', 'allies'].includes(targetKind);
  assert.ok(!targeted || targetId, `${actionId} needs a real UI target click`);
  const before = await battle();
  // A read-only observer runs after the application's native click handler and
  // before the next animation frame. It changes no actor, session or battle data.
  await page.evaluate(({ actorId, actionId, targetId, targeted }) => {
    const listener = event => {
      const button = event.target.closest('[data-do]');
      if (!button || button.dataset.do !== (targeted ? 'chronicle-target' : 'chronicle-action') || button.dataset.id !== (targeted ? targetId : actionId)) return;
      window.__ARSENAL_ORDER_AFTER__ = window.__RELAY_TEST__.getChronicleBattle();
      document.removeEventListener('click', listener);
    };
    window.__ARSENAL_ORDER_LISTENER__ = listener;
    window.__ARSENAL_ORDER_AFTER__ = null;
    document.addEventListener('click', listener);
  }, { actorId, actionId, targetId, targeted });
  await action('chronicle-action', actionId).click();
  if (targeted) await action('chronicle-target', targetId).click();
  const after = await page.evaluate(() => {
    const snapshot = window.__ARSENAL_ORDER_AFTER__;
    document.removeEventListener('click', window.__ARSENAL_ORDER_LISTENER__);
    delete window.__ARSENAL_ORDER_AFTER__; delete window.__ARSENAL_ORDER_LISTENER__;
    return snapshot;
  });
  assert.ok(after, 'The actual UI order was observed');
  assert.ok(after.actionCount > before.actionCount, `${actionId} executes a real order`);
  assert.equal(after.events.slice(before.events.length).filter(event => event.type === 'action' && event.actorId === actorId && event.actionId === actionId).length, 1, `${actionId} executes exactly once for this actor`);
  return { before, after };
}
async function advanceLegitimately(seconds) {
  return page.evaluate(async seconds => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    const until = qa.getChronicleBattle().elapsed + seconds;
    let combat = qa.getChronicleBattle(), turns = 0;
    while (!combat.winner && combat.elapsed < until && turns++ < 2000) {
      for (const member of combat.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        if (getActions(qa.getChronicleBattle(), member.id).some(action => action.id === 'cover' && action.available)) {
          const result = qa.chronicleAction({ actorId: member.id, actionId: 'cover', targetId: member.id });
          if (!result?.ok) throw new Error(result?.reason || 'A legitimate cover order failed');
        }
      }
      qa.chronicleStep(.1); combat = qa.getChronicleBattle();
    }
    if (!combat.winner && combat.elapsed < until) throw new Error('The legitimate battle clock did not advance');
    return combat;
  }, seconds);
}
async function exposeTarget(actorId, targetId) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const target = combatant(await battle(), targetId);
    assert.ok(target.hp > 0, 'The target survives preparation for the power');
    if (target.shield <= 0) return;
    await uiOrder(actorId, 'burst', targetId);
  }
  assert.equal(combatant(await battle(), targetId).shield, 0, 'Real gunfire removes shields before exposed-target control');
}
function powerEvidence(actionId, actorId, targetId, before, after) {
  report.powers.push({ actionId, actorId, targetId, before: { actor: compactActor(combatant(before, actorId)), ...(targetId ? { target: compactActor(combatant(before, targetId)) } : {}) },
    after: { actor: compactActor(combatant(after, actorId)), ...(targetId ? { target: compactActor(combatant(after, targetId)) } : {}) } });
}
async function winChronicle() {
  const outcome = await page.evaluate(async () => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    let iterations = 0, combat = qa.getChronicleBattle();
    while (combat && !combat.winner && iterations++ < 6000) {
      for (const actor of combat.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        combat = qa.getChronicleBattle(); if (combat.winner) break;
        const available = getActions(combat, actor.id).filter(action => action.available);
        const enemies = combat.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis && !enemy.statuses.dominated) || enemies[0];
        if (!target || !available.length) continue;
        const low = combat.actors.filter(member => member.team === 'party' && member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const priorities = [];
        if (low.hp / low.maxHp < .4) priorities.push(['medigel', low.id]);
        if (actor.weaponSystem === 'thermal-clip' && actor.ammo < 1) priorities.push(['reload', actor.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['reload', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(action => action.id === actionId)) continue;
          if (qa.chronicleAction({ actorId: actor.id, actionId, targetId })?.ok) break;
        }
      }
      qa.chronicleStep(.5); combat = qa.getChronicleBattle();
    }
    return { winner: combat?.winner, actions: combat?.actionCount, elapsed: combat?.elapsed, iterations, scenarioId: qa.getChronicle()?.scenarioId };
  });
  assert.equal(outcome.winner, 'party'); assert.ok(outcome.actions > 0);
  await page.locator('#chronicle-battle-status').filter({ hasText: 'Victoire' }).waitFor();
  await action('chronicle-preparation').click(); report.tacticalVictories.push(outcome);
  await assertIsolated(); return outcome;
}

const unit = (combat, id) => combat.actors.find(actor => actor.id === id);
const eventsSince = (before, after) => after.events.slice(before.events.length);
const near = (actual, expected, label = 'ATB value') => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} != ${expected}`);
async function backToPreparation() { await action('chronicle-preparation').click(); await assertIsolated(); }
async function capturePanel(name, locator) {
  const filename = `arsenal-${name}.png`;
  await locator.scrollIntoViewIfNeeded();
  await locator.screenshot({ path: fileURLToPath(new URL(filename, out)), timeout: 60000 });
  report.screenshots.push(`test-results/${filename}`);
  await mkdir(new URL('../docs/screenshots/', import.meta.url), { recursive: true });
  await copyFile(new URL(filename, out), new URL(`../docs/screenshots/${filename}`, import.meta.url));
}

async function verifyVisuals() {
  mark('24-contextual-visuals');
  const metadata = JSON.parse(await readFile(new URL('../public/assets/arsenal-visuals.json', import.meta.url), 'utf8'));
  const entries = await page.evaluate(async () => {
    const { ARSENAL_VISUAL_DATA } = await import('/src/arsenal-visual-data.js');
    const { getUniverseVisual } = await import('/src/universe-visuals.js');
    return ARSENAL_VISUAL_DATA.map(row => {
      const context = { mediaId: row.mediaId, periodId: row.periodIds[0] };
      const recordId = row.recordIds.find(id => getUniverseVisual(id, context));
      return { ...row, recordId };
    });
  });
  assert.equal(entries.length, 24); assert.equal(metadata.visuals.length, 24); assert.equal(metadata.atlases.length, 4);
  assert.equal(metadata.globalFidelityCertified, false);
  report.atlases = [];
  for (const atlas of metadata.atlases) {
    const bytes = await readFile(new URL(`../${atlas.path}`, import.meta.url));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha256, atlas.sha256); assert.equal(bytes.readUInt32BE(16), atlas.width); assert.equal(bytes.readUInt32BE(20), atlas.height);
    report.atlases.push({ id: atlas.id, path: atlas.path, sha256, width: atlas.width, height: atlas.height, generated: true });
  }
  const fetched = new Set();
  for (const entry of entries) {
    mark(`visual:${entry.id}`); assert.ok(entry.recordId, `${entry.id} needs a canonically eligible documentary record`);
    const [x, y, width, height] = entry.sourceRect;
    assert.ok(entry.sourceRect.every(Number.isInteger) && x >= 0 && y >= 0 && width > 0 && height > 0
      && x + width <= entry.atlasWidth && y + height <= entry.atlasHeight);
    await selectContext(entry.mediaId, entry.periodIds[0]);
    await action('universe-tab', 'references').click(); await action('universe-group', 'all').click();
    await page.locator('#universe-search').fill(entry.recordId);
    await action('universe-record', entry.recordId).click();
    const detail = page.locator(`[data-universe-record="${entry.recordId}"]`);
    const figure = detail.locator('.universe-reference-visual'), svg = figure.locator(`[data-universe-visual="${entry.recordId}"]`);
    await figure.scrollIntoViewIfNeeded();
    const observed = await svg.evaluate(async element => {
      const inner = element.querySelector('svg'), image = element.querySelector('image');
      const source = image.getAttribute('href'), bitmap = new Image(); bitmap.src = source; await bitmap.decode();
      const box = element.getBoundingClientRect();
      return { src: source, viewBox: element.getAttribute('viewBox'),
        inner: inner ? Object.fromEntries(['x', 'y', 'width', 'height', 'viewBox', 'overflow'].map(key => [key, inner.getAttribute(key)])) : null,
        decodedWidth: bitmap.naturalWidth, decodedHeight: bitmap.naturalHeight,
        renderedWidth: box.width, renderedHeight: box.height, viewportHeight: innerHeight };
    });
    assert.equal(observed.src, entry.src); assert.equal(observed.viewBox, entry.sourceRect.join(' '));
    assert.deepEqual(observed.inner, { x: String(x), y: String(y), width: String(width), height: String(height), viewBox: entry.sourceRect.join(' '), overflow: 'hidden' });
    assert.equal(observed.decodedWidth, entry.atlasWidth); assert.equal(observed.decodedHeight, entry.atlasHeight);
    assert.ok(observed.renderedWidth > 0 && observed.renderedHeight > 0);
    assert.match(await figure.locator('figcaption').innerText(), /prototype.*non certifié/i);
    if (!fetched.has(entry.src)) {
      const served = await page.evaluate(async src => {
        const response = await fetch(src); const bytes = await response.arrayBuffer();
        return { status: response.status, sha256: [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('') };
      }, entry.src);
      assert.equal(served.status, 200); assert.equal(served.sha256, entry.sha256); fetched.add(entry.src);
    }
    const foreign = await page.evaluate(async entry => {
      const { getUniverseVisual } = await import('/src/universe-visuals.js');
      const mediaId = entry.mediaId === 'ME3' ? 'ME2' : 'ME3';
      const wrong = getUniverseVisual(entry.recordId, { mediaId, periodId: mediaId.toLowerCase() });
      const documentaryOnly = ['npcs', 'vehicles', 'ships'].includes(entry.category);
      const scene = `${entry.mediaId.toLowerCase()}-equipment-workshop`;
      return { wrong, party: documentaryOnly ? getUniverseVisual(entry.recordId,
        { mediaId: entry.mediaId, periodId: entry.periodIds[0] }, { usage: 'party', scenarioId: scene }) : null,
      combat: documentaryOnly ? getUniverseVisual(entry.recordId,
        { mediaId: entry.mediaId, periodId: entry.periodIds[0] }, { usage: 'combat', scenarioId: scene }) : null };
    }, entry);
    assert.deepEqual(foreign, { wrong: null, party: null, combat: null });
    await capturePanel(`visual-${entry.id}`, figure);
    report.visuals.push({ id: entry.id, recordId: entry.recordId, category: entry.category, mediaId: entry.mediaId,
      periodId: entry.periodIds[0], sourceRect: entry.sourceRect, observed, partial: true,
      primaryVisualVerified: false, documentaryOnly: ['npcs', 'vehicles', 'ships'].includes(entry.category) });
    await assertIsolated();
  }
  assert.equal(new Set(report.visuals.map(row => row.id)).size, 24);
  record('Twenty-four exact work-scoped generated illustrations really decode and render through documentary UI with bounded clipped cells; NPC and fleet overlays grant no combat or gameplay permission', { subjects: 24, atlases: 4 });
  mark('visual-captures-ready');
}

async function prepareWeapon(profile) {
  const mediaId = profile.id.split('-')[0], actorId = `${mediaId}-CHR-${mediaId === 'MEA' ? 'RYDER' : 'SHEPARD'}`;
  const edition = ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER'].includes(profile.id);
  if (edition) {
    await prepare(mediaId, mediaId.toLowerCase(), `${mediaId.toLowerCase()}-equipment-workshop`);
    await blockedOption(actorId, 'weapon', profile.id);
  }
  const scenarioId = edition ? 'me3-legendary-equipment-workshop' : `${mediaId.toLowerCase()}-equipment-workshop`;
  await prepare(mediaId, mediaId.toLowerCase(), scenarioId); await selectParty([actorId]);
  if (await buildSelect(actorId).inputValue() !== 'default') await buildSelect(actorId).selectOption('default');
  await gear(actorId, 'weapon').selectOption(profile.id);
  const prepared = await preparedActor(actorId); assert.equal(prepared.weaponProfileId, profile.id);
  assert.equal(prepared.weaponSystem, profile.weaponSystem);
  await action('chronicle-save').click();
  const saved = await session(), exported = await exportDownload(action('chronicle-export'), `arsenal-weapon-${profile.id.toLowerCase()}.json`);
  await importChronicle(exported); assert.deepEqual(await session(), saved);
  if (['ME3-WPN-ARC', 'ME3-WPN-PARTICLE'].includes(profile.id)) {
    await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
    await importChronicle(exported); await action('universe-tab', 'session').click(); assert.deepEqual(await session(), saved);
  }
  await action('chronicle-battle').click(); await page.locator('#chronicle-battle-status').waitFor();
  return { actorId, scenarioId, saved };
}

async function actualTargetThen(actorId, operation, seconds = 0) {
  await waitReady(actorId, 'shoot'); await action('chronicle-actor', actorId).click(); await action('chronicle-action', 'shoot').click();
  return page.evaluate(({ actorId, operation, seconds }) => {
    const qa = window.__RELAY_TEST__, target = document.querySelector('[data-do="chronicle-target"][data-id="chronicle-enemy-0"]');
    if (!target || target.disabled) throw new Error('The actual target button is unavailable');
    const before = qa.getChronicleBattle(); target.click(); const fired = qa.getChronicleBattle();
    let beforeRelease = null, release = null, impact = null;
    if (operation === 'cancel') {
      const button = document.querySelector('[data-do="chronicle-action"][data-id="cancelChannel"]');
      if (!button || button.disabled) throw new Error('The real cancellation control is missing');
      button.click();
    } else if (operation === 'charge') {
      const actor = fired.actors.find(actor => actor.id === actorId);
      if (actor.channel?.phase !== 'charging') throw new Error('No native charging phase after the real order');
      qa.chronicleStep(actor.channel.remaining - .01); beforeRelease = qa.getChronicleBattle();
      qa.chronicleStep(.01); release = qa.getChronicleBattle();
      if (seconds) { qa.chronicleStep(seconds); impact = qa.getChronicleBattle(); }
    } else if (operation === 'pause') {
      document.querySelector('[data-do="chronicle-pause"]').click();
    } else if (seconds) qa.chronicleStep(seconds);
    return { before, fired, beforeRelease, release, impact, after: qa.getChronicleBattle() };
  }, { actorId, operation, seconds });
}

async function verifyWeapons() {
  mark('eight-weapons');
  const profiles = await page.evaluate(async () => (await import('/src/universe-weapon-profiles.js')).UNIVERSE_WEAPON_PROFILES.filter(profile => profile.identityFact));
  assert.deepEqual(profiles.map(profile => profile.id).sort(), ['ME3-WPN-PARTICLE', 'ME3-WPN-LANCER', 'ME3-WPN-ARC', 'ME3-WPN-GRAAL', 'ME3-WPN-JAVELIN', 'MEA-WPN-EQUALIZER', 'MEA-WPN-SCATTERSHOT', 'MEA-WPN-VENOM'].sort());
  for (const profile of profiles) {
    mark(`weapon:${profile.id}`); const { actorId, scenarioId } = await prepareWeapon(profile);
    const initial = unit(await battle(), actorId); let evidence;
    if (profile.mode.startsWith('charged-')) {
      const canceled = await actualTargetThen(actorId, 'cancel');
      assert.equal(unit(canceled.fired, actorId).channel.phase, 'charging');
      assert.equal(unit(canceled.after, actorId).channel, null); assert.equal(unit(canceled.after, actorId).atb, 0);
      assert.equal(unit(canceled.after, actorId).ammo, initial.ammo);
      assert.equal(unit(canceled.after, 'chronicle-enemy-0').hp, unit(canceled.before, 'chronicle-enemy-0').hp);
      assert.equal(eventsSince(canceled.before, canceled.after).filter(event => event.type === 'action' && event.actionId === 'cancelChannel').length, 1);
      const shot = await actualTargetThen(actorId, 'charge', profile.mode === 'charged-area' ? profile.delay : 0);
      const before = unit(shot.before, actorId), released = unit(shot.release, actorId);
      assert.equal(unit(shot.beforeRelease, actorId).ammo, before.ammo);
      assert.equal(eventsSince(shot.before, shot.beforeRelease).some(event => event.type === 'damage' && event.actorId === actorId), false);
      assert.equal(released.ammo, before.ammo - 1); assert.equal(released.reserveAmmo, before.reserveAmmo);
      assert.equal(eventsSince(shot.before, shot.release).filter(event => event.type === 'weaponChargeRelease').length, 1);
      if (profile.mode === 'charged-area') {
        assert.equal(eventsSince(shot.before, shot.release).some(event => event.type === 'damage' && event.actorId === actorId), false);
        assert.equal(shot.release.projectiles.length, 1);
        assert.equal(shot.impact.projectiles.length, 0);
        assert.equal(eventsSince(shot.release, shot.impact).filter(event => event.type === 'explosion').length, 1);
        assert.equal(eventsSince(shot.release, shot.impact).filter(event => event.type === 'damage' && event.actorId === actorId).length, 2);
      } else {
        assert.equal(eventsSince(shot.before, shot.release).filter(event => event.type === 'damage' && event.actorId === actorId).length, profile.impactCount);
      }
      evidence = { canceled: { before: compactActor(unit(canceled.before, actorId)), after: compactActor(unit(canceled.after, actorId)) },
        chargeBeforeEmission: compactActor(unit(shot.beforeRelease, actorId)), released: compactActor(released),
        events: eventsSince(shot.before, shot.after) };
      if (profile.id === 'ME3-WPN-ARC') {
        const paused = await actualTargetThen(actorId, 'pause');
        assert.equal(unit(paused.after, actorId).channel.phase, 'charging');
        const freeze = await battle(); await page.evaluate(() => window.__RELAY_TEST__.chronicleStep(.5)); assert.deepEqual(await battle(), freeze);
        await capturePanel('arc-real-charge-paused', page.locator('.chronicle-combat'));
        await action('chronicle-pause').click();
      }
    } else if (profile.mode === 'heat-beam') {
      const shot = await actualTargetThen(actorId, 'advance', profile.duration);
      const after = unit(shot.after, actorId);
      assert.equal(unit(shot.fired, actorId).channel.remainingTicks, 4);
      assert.equal(eventsSince(shot.before, shot.fired).some(event => event.type === 'damage' && event.actorId === actorId), false);
      assert.equal(eventsSince(shot.before, shot.after).filter(event => event.type === 'channelPulse').length, 4);
      assert.equal(after.channel, null); near(after.heat, 56);
      for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity']) assert.equal(after[key], undefined);
      const cooled = await advanceLegitimately(.5); assert.ok(unit(cooled, actorId).heat < after.heat);
      evidence = { before: compactActor(unit(shot.before, actorId)), after: compactActor(after), cooled: compactActor(unit(cooled, actorId)), events: eventsSince(shot.before, shot.after) };
    } else {
      const shot = await actualTargetThen(actorId, 'immediate'); const after = unit(shot.after, actorId);
      assert.equal(eventsSince(shot.before, shot.after).filter(event => event.type === 'damage' && event.actorId === actorId).length, profile.burstCount);
      near(after.heat, 24); assert.equal(after.ammo, undefined);
      evidence = { impacts: profile.burstCount, before: compactActor(unit(shot.before, actorId)), after: compactActor(after), events: eventsSince(shot.before, shot.after) };
    }
    report.weapons.push({ id: profile.id, mode: profile.mode, actorId, scenarioId, statsBasis: profile.statsBasis, originalMechanicCertified: false, evidence });
    await backToPreparation();
  }
  record('Eight exact weapon models use real heat, interruptible charge or charge-then-flight systems with finite resource expenditure and preparation save/import/reload', { models: report.weapons.length });
}

async function verifyArmorEditions() {
  mark('armor-edition-permissions');
  const sets = {
    ME2: ['KESTREL', 'CERBERUS', 'COLLECTOR', 'TERMINUS', 'BLOOD-DRAGON', 'INFERNO'],
    ME3: ['AJAX', 'INFERNO', 'BLOOD-DRAGON', 'COLLECTOR', 'TERMINUS', 'CERBERUS'],
    MEA: ['SCAVENGER', 'DEEP-SPACE'],
  };
  for (const [mediaId, suffixes] of Object.entries(sets)) {
    const actorId = `${mediaId}-CHR-${mediaId === 'MEA' ? 'RYDER' : 'SHEPARD'}`;
    const standard = `${mediaId.toLowerCase()}-equipment-workshop`;
    const edition = mediaId === 'MEA' ? 'mea-deluxe-equipment-workshop' : `${mediaId.toLowerCase()}-legendary-equipment-workshop`;
    await prepare(mediaId, mediaId.toLowerCase(), standard);
    for (const suffix of suffixes) await blockedOption(actorId, 'armor', `${mediaId}-EQP-${suffix}`);
    const original = await session();
    const packet = JSON.parse(await exportDownload(action('chronicle-export'), `arsenal-${mediaId.toLowerCase()}-old-workshop.json`));
    packet.session.loadouts[actorId].armor = `${mediaId}-EQP-${suffixes[0]}`;
    const beforeBad = await chronicleStorage(); await importChronicle(JSON.stringify(packet), false);
    assert.deepEqual(await session(), original); assert.deepEqual(await chronicleStorage(), beforeBad);
    await prepare(mediaId, mediaId.toLowerCase(), edition);
    assert.match(await page.locator('.universe-scenario .brief-copy').innerText(), mediaId === 'MEA' ? /Deluxe/i : /Legendary/i);
    const member = (await session()).party.find(id => id !== actorId); assert.ok(member);
    await gear(actorId, 'armor').selectOption(''); const base = await preparedActor(actorId);
    for (const suffix of suffixes) {
      const itemId = `${mediaId}-EQP-${suffix}`;
      await blockedOption(member, 'armor', itemId);
      await gear(actorId, 'armor').selectOption(itemId);
      const selected = await preparedActor(actorId);
      assert.equal(selected.defense, base.defense + 2); assert.equal(selected.maxShield, base.maxShield + 10);
      assert.equal(selected.hp, base.hp); assert.equal(selected.attack, base.attack); assert.deepEqual(selected.powers, base.powers);
      report.armors.push({ id: itemId, actorId, scenarioId: edition, standardRefused: true, companionRefused: member,
        before: { defense: base.defense, shield: base.maxShield }, after: { defense: selected.defense, shield: selected.maxShield },
        scope: 'Aggregate bounded preset; original piece effects, worn appearance, rank and acquisition not reproduced' });
    }
    await capturePanel(`armor-${mediaId.toLowerCase()}-edition`, page.locator(`[data-chronicle-actor="${actorId}"]`));
    await action('chronicle-save').click(); const saved = await session();
    const encoded = await exportDownload(action('chronicle-export'), `arsenal-${mediaId.toLowerCase()}-edition-armor.json`);
    await importChronicle(encoded); assert.deepEqual(await session(), saved);
    const expected = await preparedActor(actorId);
    await action('chronicle-battle').click();
    const actual = unit(await battle(), actorId);
    assert.equal(actual.defense, expected.defense); assert.equal(actual.maxShield, expected.maxShield);
    await uiOrder(actorId, 'shoot', 'chronicle-enemy-0'); await backToPreparation();
  }
  await prepare('MEA', 'mea', 'mea-equipment-workshop');
  const ryder = 'MEA-CHR-RYDER'; await gear(ryder, 'armor').selectOption(''); const base = await preparedActor(ryder);
  for (const companion of (await session()).party.filter(id => id !== ryder)) await blockedOption(companion, 'armor', 'MEA-EQP-REMNANT');
  await gear(ryder, 'armor').selectOption('MEA-EQP-REMNANT'); const remnant = await preparedActor(ryder);
  assert.equal(remnant.defense, base.defense + 2); assert.equal(remnant.maxShield, base.maxShield + 10);
  assert.equal(remnant.shieldRechargeMultiplier, undefined); assert.equal(remnant.fusionSlot, undefined);
  assert.deepEqual(Object.keys((await session()).loadouts[ryder]).sort(), ['armor', 'weapon', 'weaponMod', 'weaponMod2']);
  report.armors.push({ id: 'MEA-EQP-REMNANT', actorId: ryder, scenarioId: 'mea-equipment-workshop',
    before: { defense: base.defense, shield: base.maxShield }, after: { defense: remnant.defense, shield: remnant.maxShield },
    scope: 'Ryder-only aggregate; no new regeneration, fusion slots or armor animation' });
  assert.equal(report.armors.length, 15); await assertIsolated();
  record('Fourteen edition armor presets require their explicit prepared edition workshop and protagonist; Remnant remains a bounded Ryder-only aggregate', { presets: report.armors.length });
}

async function ultralightTrial(modified, grenade = false) {
  await prepare('ME3', 'me3', 'me3-equipment-workshop');
  const actorId = 'ME3-CHR-SHEPARD'; await selectParty([actorId]);
  await buildSelect(actorId).selectOption(grenade ? 'soldier' : 'engineer');
  await gear(actorId, 'weapon').selectOption('ME3-WPN-SHURIKEN');
  for (const slot of ['weaponMod', 'weaponMod2']) if (await gear(actorId, slot).inputValue()) await gear(actorId, slot).selectOption('');
  if (modified) await gear(actorId, 'weaponMod2').selectOption('ME3-EQP-ULTRALIGHT');
  const prepared = await preparedActor(actorId); near(prepared.powerCooldownMultiplier ?? 1, modified ? .9 : 1);
  await action('chronicle-battle').click();
  const result = await uiOrder(actorId, grenade ? 'fragGrenade' : 'overload', 'chronicle-enemy-0');
  await backToPreparation(); return { prepared, ...result };
}
async function verifyUltralight() {
  mark('ultralight-native-cooldown'); const actorId = 'ME3-CHR-SHEPARD';
  const ordinary = await ultralightTrial(false), lighter = await ultralightTrial(true);
  near(unit(ordinary.after, actorId).cooldowns.overload, 8); near(unit(lighter.after, actorId).cooldowns.overload, 7.2);
  const hits = sample => eventsSince(sample.before, sample.after).filter(event => event.type === 'damage' && event.actorId === actorId)
    .map(event => Object.fromEntries(['actorId', 'targetId', 'actionId', 'amount', 'shieldDamage', 'healthDamage'].map(key => [key, event[key]])));
  assert.deepEqual(hits(lighter), hits(ordinary), 'The cooldown module changes neither power strength nor target layers');
  for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity', 'attack', 'defense', 'hp', 'maxShield', 'bioticMultiplier', 'techMultiplier'])
    assert.equal(lighter.prepared[key], ordinary.prepared[key]);
  await blockedOption(actorId, 'weaponMod', 'ME3-EQP-ULTRALIGHT');
  await action('chronicle-save').click(); const saved = await session();
  const encoded = await exportDownload(action('chronicle-export'), 'arsenal-ultralight-preparation.json');
  await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await importChronicle(encoded); await action('universe-tab', 'session').click(); assert.deepEqual(await session(), saved);
  near((await preparedActor(actorId)).powerCooldownMultiplier, .9);
  const duplicate = JSON.parse(encoded); duplicate.session.loadouts[actorId].weaponMod = 'ME3-EQP-ULTRALIGHT';
  const before = await chronicleStorage(); await importChronicle(JSON.stringify(duplicate), false);
  assert.deepEqual(await session(), saved); assert.deepEqual(await chronicleStorage(), before);
  await gear(actorId, 'weapon').selectOption('ME3-WPN-AVENGER');
  assert.equal((await session()).loadouts[actorId].weaponMod2, null);
  near((await preparedActor(actorId)).powerCooldownMultiplier ?? 1, 1);
  await blockedOption(actorId, 'weaponMod', 'ME3-EQP-ULTRALIGHT');
  const grenadePlain = await ultralightTrial(false, true), grenadeLight = await ultralightTrial(true, true);
  for (const sample of [grenadePlain, grenadeLight]) {
    assert.equal(unit(sample.before, actorId).grenadeCharges, 3); assert.equal(unit(sample.after, actorId).grenadeCharges, 2);
    assert.equal(unit(sample.after, actorId).cooldowns.fragGrenade, undefined);
    assert.equal(unit(sample.before, actorId).ammo, unit(sample.after, actorId).ammo);
  }
  assert.deepEqual(hits(grenadePlain), hits(grenadeLight));
  report.modifiers.push({ id: 'ME3-EQP-ULTRALIGHT', ordinaryCooldown: 8, modifiedCooldown: 7.2,
    actualPowerResults: hits(lighter), grenadeCost: 1, grenadeCooldownAdded: false,
    duplicateFamilyImportAtomic: true, realReloadPreservesSingleMultiplier: true, replacingParentClearsModule: true,
    scope: 'Conventional ME3 SMG family only; fixed ATB multiplier, no original weight or rank certification' });
  await capturePanel('ultralight-preparation', page.locator(`[data-chronicle-actor="${actorId}"]`));
  await assertIsolated();
  record('Ultralight changes an actual Overload cooldown from 8 to 7.2 seconds once; power damage, weapon resources and finite grenade behavior remain unchanged after real save/import/reload');
}

async function verifyOppositions() {
  mark('six-native-oppositions');
  const scenes = await page.evaluate(async () => (await import('/src/universe-opposition-scenarios.js')).OPPOSITION_SCENARIOS);
  assert.equal(scenes.length, 6); const encountered = new Set(), bossIds = new Set();
  for (const scene of scenes) {
    mark(`opposition:${scene.id}`);
    await prepare(scene.context.mediaId, scene.context.periodId, scene.id);
    assert.match(await page.locator('.universe-scenario .brief-copy').innerText(), /Banc d’étude indépendant|banc.*indépendant/i);
    assert.equal(await page.locator('[data-do="chronicle-party"][data-id="ME2-NPC-ARIA"]').count(), 0);
    assert.equal(await page.locator('[data-do="chronicle-party"][data-id="ME3-NPC-TRAYNOR"]').count(), 0);
    await action('chronicle-battle').click(); const initial = await battle();
    const enemies = initial.actors.filter(actor => actor.team === 'enemy');
    assert.deepEqual(enemies.map(actor => actor.catalogId).sort(), [...scene.opponentIds].sort());
    for (const enemy of enemies) {
      assert.equal(enemy.mediaId, scene.context.mediaId); assert.deepEqual(enemy.powers, []);
      assert.ok(enemy.missingMechanics.length > 0); encountered.add(enemy.catalogId); if (enemy.boss) bossIds.add(enemy.catalogId);
      const limits = page.locator(`[data-chronicle-opponent-limits="${enemy.catalogId}"]`);
      assert.equal(await limits.count(), 1); assert.equal(await limits.isVisible(), true);
      for (const limitation of enemy.missingMechanics) assert.ok((await limits.innerText()).includes(limitation));
      const primitive = ['ME3-ENM-HUSK', 'ME3-ENM-BRUTE'].includes(enemy.catalogId) ? 'strike' : 'shoot';
      assert.equal(enemy.primaryAction, primitive);
    }
    // The live combat replaces its cards when readiness or damage changes.
    // Use its real pause control while capturing, then resume native simulation.
    await action('chronicle-pause').click();
    await capturePanel(`opposition-${scene.id}`, page.locator('.chronicle-enemy-units'));
    await action('chronicle-pause').click();
    const advanced = await advanceLegitimately(9);
    const attacks = advanced.events.filter(event => event.type === 'action' && enemies.some(enemy => enemy.id === event.actorId));
    for (const enemy of enemies) {
      assert.ok(attacks.some(event => event.actorId === enemy.id), `${enemy.catalogId} executes a native enemy order`);
      assert.ok(advanced.events.some(event => event.type === 'damage' && event.actorId === enemy.id && event.amount > 0), `${enemy.catalogId} damages a real party member`);
    }
    const outcome = await winChronicle(); assert.ok((await session()).cleared.includes(scene.id));
    await action('chronicle-save').click(); const saved = await session();
    const encoded = await exportDownload(action('chronicle-export'), `arsenal-${scene.id}-cleared.json`);
    if (scene.id === 'me2-collector-opposition') {
      await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
    }
    await importChronicle(encoded); await action('universe-tab', 'session').click(); assert.deepEqual(await session(), saved);
    report.oppositions.push({ id: scene.id, context: scene.context, opponentIds: scene.opponentIds,
      nativeAttackers: [...new Set(attacks.map(event => event.actorId))], bossIds: enemies.filter(enemy => enemy.boss).map(enemy => enemy.catalogId),
      missingMechanicsVisible: true, savedOutcome: outcome,
      scope: 'Independent generic-action study bench, no source encounter, complete boss phases or original statistics reconstructed' });
    await assertIsolated();
  }
  assert.equal(encountered.size, 16); assert.equal(bossIds.size, 3);
  report.opponentCoverage = { count: encountered.size, ids: [...encountered], bossIds: [...bossIds], completeOriginalKits: false };
  record('Six contextual opposition benches run sixteen source-identified enemies and three partial bosses through native attacks, six real victories and strict saved outcomes', { encounters: 6, opponents: 16, bosses: 3 });
}

try {
  report.runnerSha256 = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex');
  report.sources = Object.fromEntries(await Promise.all(['src/combat.js', 'src/combat-summons.js', 'src/universe-ammo.js',
    'src/universe-powers.js', 'src/universe-actors.js', 'src/universe-equipment.js', 'src/universe-weapon-profiles.js',
    'src/universe-equipment-scenarios.js', 'src/universe-opposition-scenarios.js', 'src/universe-opponents.js',
    'src/universe-portraits.js', 'src/universe-visuals.js', 'src/arsenal-visual-data.js',
    'src/chronicles.js', 'src/continuity.js', 'src/universe-ui.js', 'src/universe-ui.css', 'src/main.js',
    'public/assets/arsenal-visuals.json'].map(async name =>
    [name, createHash('sha256').update(await readFile(new URL(`../${name}`, import.meta.url))).digest('hex')])));
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  mark('independent-me1-purchase-and-save'); await establishCampaignWitness();
  record('A real ME1 purchase, equipped item, named manual save and entry checkpoint stay independent from every Chronicle and documentary action');
  report.runtime = await page.evaluate(async () => {
    const actors = await import('/src/universe-actors.js'), equipment = await import('/src/universe-equipment.js');
    return { scenarios: actors.CHRONICLE_SCENARIOS.length,
      selectableActors: new Set(actors.CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds)).size,
      supportedEquipment: equipment.UNIVERSE_EQUIPMENT.filter(item => item.runtimeSupported).length };
  });
  assert.equal(report.runtime.scenarios, 25); assert.equal(report.runtime.selectableActors, 42); assert.equal(report.runtime.supportedEquipment, 100);
  await verifyVisuals();
  await verifyWeapons();
  await verifyArmorEditions();
  await verifyUltralight();
  await verifyOppositions();
  await action('chronicle-back').click(); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  const resumed = await campaignState();
  for (const key of ['name', 'xp', 'credits', 'inventory', 'party', 'recruited', 'lost', 'completed', 'cleared', 'choices', 'flags', 'story', 'operations']) assert.deepEqual(resumed[key], baselineState[key]);
  assert.equal(await page.locator('[data-universe-visual]').count(), 0);
  await screenshot('me1-resumed'); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []), []);
  for (const [path, hash] of Object.entries(report.sources)) assert.equal(createHash('sha256').update(await readFile(new URL(`../${path}`, import.meta.url))).digest('hex'), hash, `Frozen source changed during the run: ${path}`);
  report.passed = true; mark('complete');
  console.log(JSON.stringify({ passed: true, checks: report.checks.length, weapons: report.weapons.length,
    armors: report.armors.length, modifiers: report.modifiers.length, oppositions: report.oppositions.length,
    visuals: report.visuals.length, victories: report.tacticalVictories.length }));
} catch (error) {
  report.failure = error.stack || String(error);
  if (page) {
    report.diagnostic = await Promise.race([
      page.evaluate(() => ({ ui: window.__RELAY_TEST__?.getUI()?.screen, mainZone: window.__RELAY_TEST__?.getState()?.zone,
        chronicle: window.__RELAY_TEST__?.getChronicle?.(), battle: window.__RELAY_TEST__?.getChronicleBattle?.() })).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve({ unavailable: true }), 5000)),
    ]);
    await screenshot('failure').catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  if (report.passed) {
    await mkdir(new URL('../docs/screenshots/', import.meta.url), { recursive: true });
    report.captureArtifacts = [];
    for (const runPath of report.screenshots) {
      const archivePath = runPath.replace('test-results/', 'docs/screenshots/');
      const bytes = await readFile(new URL(`../${runPath}`, import.meta.url));
      await copyFile(new URL(`../${runPath}`, import.meta.url), new URL(`../${archivePath}`, import.meta.url));
      report.captureArtifacts.push({ runPath, archivePath, sha256: createHash('sha256').update(bytes).digest('hex'),
        width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), method: 'Unmodified screenshot of actual UI' });
    }
    report.screenshots = report.captureArtifacts.map(artifact => artifact.archivePath);
  }
  const encoded = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(new URL('arsenal-report.json', out), encoded);
  await writeFile(new URL('../docs/qa/arsenal-browser-report.json', import.meta.url), encoded);
}

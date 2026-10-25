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
  powers: [], weapons: [], tacticalVictories: [], scenarios: [], stories: [],
  scope: 'Actual UI specialist preparation, six adapted weapon profiles, finite grenade charges, group shields, six contextual test benches and seven sourced reading additions. All weapon timings, heat, damage, resource budgets and abstract targets remain ATB adaptations; this is not original-model certification or global 1:1 fidelity.',
};
const READING_BASELINE = {
  "commit": "7fe7a88",
  "ids": [
    "ann-transit",
    "asc-projet",
    "evo-apres-guerre",
    "ini-cora",
    "inv-omega",
    "nex-crise",
    "red-recherche",
    "ret-grayson",
    "rev-sidon"
  ],
  "pages": 42,
  "sourceSha256": "5ef21d5bff8066f3c86df4844c0b1bb5061dc2ef832150d023dc632150564ec1",
  "snapshotSha256": "474ffc3927c7257d78500f0b0db45f2b23f2ff4acd24c9ad7e28d0cf36180a8d"
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
  const filename = `chronicle-specialists-${name}.png`;
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
  await page.evaluate(() => { window.__SPECIALISTS_IMPORT_FEEDBACK__ = document.querySelector('.universe-feedback'); });
  await page.locator('#chronicle-import').setInputFiles({ name: 'chronicle-specialists.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => {
    const current = document.querySelector('.universe-feedback');
    return document.querySelector('#chronicle-import').value === '' && current && current !== window.__SPECIALISTS_IMPORT_FEEDBACK__;
  }, null, { polling: 100, timeout: 60000 });
  await page.evaluate(() => { delete window.__SPECIALISTS_IMPORT_FEEDBACK__; });
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
  await page.locator('#commander-name').fill('Alex Archives');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle('normandy');
  await action('equipment').click(); await action('eq-tab', 'shop').click(); await action('eq-buy', 'heat-sink-i').click();
  await action('eq-tab', 'inventory').click(); await action('eq-equip', 'heat-sink-i').click(); await action('close').click();
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('ME1 — témoin expansion Chroniques'); await action('manual-save', '1').click();
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
      window.__SPECIALISTS_ORDER_AFTER__ = window.__RELAY_TEST__.getChronicleBattle();
      document.removeEventListener('click', listener);
    };
    window.__SPECIALISTS_ORDER_LISTENER__ = listener;
    window.__SPECIALISTS_ORDER_AFTER__ = null;
    document.addEventListener('click', listener);
  }, { actorId, actionId, targetId, targeted });
  await action('chronicle-action', actionId).click();
  if (targeted) await action('chronicle-target', targetId).click();
  const after = await page.evaluate(() => {
    const snapshot = window.__SPECIALISTS_ORDER_AFTER__;
    document.removeEventListener('click', window.__SPECIALISTS_ORDER_LISTENER__);
    delete window.__SPECIALISTS_ORDER_AFTER__; delete window.__SPECIALISTS_ORDER_LISTENER__;
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

const durability = actor => actor.hp + actor.shield;
const damageEvents = (before, after, actorId, actionId) => after.events.slice(before.events.length).filter(event => event.type === 'damage' && event.actorId === actorId && event.actionId === actionId);
async function abandonToPreparation() {
  await action('chronicle-preparation').click(); await assertIsolated();
}
async function showSpentActor(actorId) {
  await page.evaluate(async actorId => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    for (const member of qa.getChronicleBattle().actors.filter(actor => actor.team === 'party' && actor.id !== actorId && actor.hp > 0)) {
      if (getActions(qa.getChronicleBattle(), member.id).some(action => action.id === 'cover' && action.available)) {
        const result = qa.chronicleAction({ actorId: member.id, actionId: 'cover', targetId: member.id });
        if (!result?.ok) throw new Error(result?.reason || 'The companion cover order failed');
      }
    }
  }, actorId);
  await action('chronicle-actor', actorId).click();
}
async function verifySpecialistWeapons() {
  mark('specialist-weapon-preparation');
  const profiles = await page.evaluate(async () => (await import('/src/universe-weapon-profiles.js')).UNIVERSE_WEAPON_PROFILES);
  assert.deepEqual(profiles.map(profile => profile.id).sort(), ['ME3-WPN-FALCON', 'ME3-WPN-SCORPION', 'MEA-WPN-SCORPION', 'MEA-WPN-PAW', 'MEA-WPN-REEGAR', 'MEA-WPN-SWEEPER'].sort());
  const wonModes = new Set();
  for (const profile of profiles) {
    mark(`weapon:${profile.id}`);
    const mediaId = profile.id.split('-')[0], actorId = `${mediaId}-CHR-${mediaId === 'MEA' ? 'RYDER' : 'SHEPARD'}`;
    await prepare(mediaId, mediaId.toLowerCase(), `${mediaId.toLowerCase()}-equipment-workshop`);
    if (profile.id === 'ME3-WPN-FALCON') {
      await gear(actorId, 'weapon').selectOption('ME3-WPN-AVENGER');
      await gear(actorId, 'weaponMod').selectOption('ME3-EQP-BARREL'); await gear(actorId, 'weaponMod2').selectOption('ME3-EQP-MAGAZINE');
    }
    await gear(actorId, 'weapon').selectOption(profile.id);
    assert.equal((await session()).loadouts[actorId].weapon, profile.id);
    if (profile.id === 'ME3-WPN-FALCON') {
      assert.equal((await session()).loadouts[actorId].weaponMod, null); assert.equal((await session()).loadouts[actorId].weaponMod2, null);
      for (const slot of ['weaponMod', 'weaponMod2']) for (const id of ['ME3-EQP-BARREL', 'ME3-EQP-MAGAZINE']) await blockedOption(actorId, slot, id);
      assert.match(await gear(actorId, 'weaponMod').locator('option[value="ME3-EQP-BARREL"]').innerText(), /prototype|module|conventionnel/i);
    }
    const prepared = await preparedActor(actorId);
    assert.equal(prepared.weaponProfileId, profile.id); assert.equal(profile.primarySourceVerified, false);
    assert.equal(profile.statsBasis, 'ATB adaptation');
    await action('chronicle-save').click(); const saved = await session();
    const exported = await exportDownload(action('chronicle-export'), `chronicle-specialists-${profile.id.toLowerCase()}.json`);
    if (['ME3-WPN-FALCON', 'MEA-WPN-PAW'].includes(profile.id)) {
      await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
    }
    await importChronicle(exported); assert.deepEqual(await session(), saved); assert.deepEqual(await preparedActor(actorId), prepared); await assertIsolated();
    await action('chronicle-battle').click();
    const targetId = (await battle()).actors.find(actor => actor.team === 'enemy').id;
    const fired = await uiOrder(actorId, 'shoot', targetId), beforeActor = combatant(fired.before, actorId), firedActor = combatant(fired.after, actorId);
    const evidence = { id: profile.id, actorId, mode: profile.mode, sourceBasis: profile.sourceBasis, primarySourceVerified: profile.primarySourceVerified,
      prepared: compactActor(prepared), before: compactActor(beforeActor), fired: compactActor(firedActor), configurationSurvivedImport: true,
      configurationSurvivedReload: ['ME3-WPN-FALCON', 'MEA-WPN-PAW'].includes(profile.id) };
    if (profile.mode === 'delayed-area') {
      assert.equal(firedActor.ammo, beforeActor.ammo - 1); assert.equal(firedActor.reserveAmmo, beforeActor.reserveAmmo);
      assert.equal(damageEvents(fired.before, fired.after, actorId, 'shoot').length, 0, 'Launching an explosive does not apply direct damage');
      assert.ok(fired.after.projectiles.some(projectile => projectile.actorId === actorId && projectile.weaponProfileId === profile.id && projectile.remaining > 0));
      for (const target of fired.before.actors.filter(actor => actor.team === 'enemy')) assert.equal(durability(combatant(fired.after, target.id)), durability(target));
      const resolved = await advanceLegitimately(profile.delay + .15), hits = damageEvents(fired.after, resolved, actorId, 'shoot');
      assert.equal(new Set(hits.map(event => event.targetId)).size, 2, 'The delayed explosion reaches both original workshop targets');
      for (const target of fired.before.actors.filter(actor => actor.team === 'enemy')) assert.ok(durability(combatant(resolved, target.id)) < durability(target));
      evidence.impactAfterSimulatedDelay = profile.delay; evidence.damageTargets = [...new Set(hits.map(event => event.targetId))];
    } else if (['heat-beam', 'clip-channel'].includes(profile.mode)) {
      assert.ok(firedActor.channel); assert.equal(firedActor.channel.weaponProfileId, profile.id);
      assert.equal(damageEvents(fired.before, fired.after, actorId, 'shoot').length, 0);
      const pulsed = await advanceLegitimately(.6), pulseActor = combatant(pulsed, actorId);
      assert.ok(pulsed.events.some(event => event.type === 'channelPulse' && event.actorId === actorId && event.weaponProfileId === profile.id));
      assert.ok(durability(combatant(pulsed, targetId)) < durability(combatant(fired.after, targetId)));
      if (profile.mode === 'heat-beam') {
        assert.ok(pulseActor.heat > beforeActor.heat); assert.equal(pulseActor.weaponSystem, 'heat');
        for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity']) assert.equal(Object.hasOwn(pulseActor, key), false);
        await showSpentActor(actorId); assert.equal(await page.locator('[data-chronicle-ammo]').count(), 0);
        await page.locator('.chronicle-command').scrollIntoViewIfNeeded(); await screenshot('heat-beam');
      } else { assert.ok(pulseActor.ammo < beforeActor.ammo); assert.equal(pulseActor.heat, 0); }
      const finished = await advanceLegitimately(profile.duration), finishedActor = combatant(finished, actorId);
      assert.equal(finishedActor.channel, null);
      const pulses = finished.events.filter(event => event.type === 'channelPulse' && event.actorId === actorId && event.weaponProfileId === profile.id);
      assert.equal(pulses.length, Math.ceil(profile.duration / profile.tickInterval));
      if (profile.mode === 'clip-channel') {
        assert.equal(finishedActor.ammo, beforeActor.ammo - pulses.length * profile.ammoPerTick); assert.equal(finishedActor.reserveAmmo, beforeActor.reserveAmmo);
        const reload = await uiOrder(actorId, 'reload', actorId), reloaded = combatant(reload.after, actorId);
        assert.equal(reloaded.ammo, profile.magazineCapacity); assert.equal(reloaded.reserveAmmo, profile.reserveAmmo - pulses.length * profile.ammoPerTick);
      } else {
        const cooled = await advanceLegitimately(1); assert.ok(combatant(cooled, actorId).heat < finishedActor.heat);
        const reloadAvailable = await page.evaluate(async id => (await import('/src/combat.js')).getActions(window.__RELAY_TEST__.getChronicleBattle(), id).some(action => action.id === 'reload'), actorId);
        assert.equal(reloadAvailable, false);
      }
      evidence.pulses = pulses.length; evidence.afterChannel = compactActor(finishedActor);
    } else if (profile.mode === 'heat-burst') {
      assert.equal(damageEvents(fired.before, fired.after, actorId, 'shoot').length, profile.burstCount);
      assert.ok(firedActor.heat > beforeActor.heat);
      for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity']) assert.equal(Object.hasOwn(firedActor, key), false);
      await showSpentActor(actorId); assert.equal(await page.locator('[data-chronicle-ammo]').count(), 0);
      const cooled = await advanceLegitimately(1); assert.ok(combatant(cooled, actorId).heat < firedActor.heat);
      evidence.impacts = profile.burstCount; evidence.afterCooling = compactActor(combatant(cooled, actorId));
    } else assert.fail(`Unknown profile mode ${profile.mode}`);
    report.weapons.push(evidence);
    if (!wonModes.has(profile.mode)) { await winChronicle(); wonModes.add(profile.mode); }
    else await abandonToPreparation();
  }
  record('Six specialist weapons survive real UI preparation/save/export/import; explosive impacts are delayed AoE, channels consume their actual resource per pulse, heat profiles have no inherited clip stock, and Falcon rejects conventional mods');
}

async function exhaustGrenades(mediaId, actorId, actionId) {
  await prepare(mediaId, mediaId.toLowerCase(), `${mediaId.toLowerCase()}-equipment-workshop`);
  await selectParty([actorId]);
  assert.match(await page.locator('[data-chronicle-grenade-capacity]').innerText(), /3.*charges/);
  await action('chronicle-battle').click();
  let current = await battle();
  assert.equal(combatant(current, actorId).grenadeCharges, 3); assert.equal(combatant(current, actorId).grenadeCapacity, 3);
  const charges = [3], casts = [];
  for (let index = 0; index < 3; index++) {
    current = await battle();
    const livingTargets = current.actors.filter(actor => actor.team === 'enemy' && actor.hp > 0);
    const targetId = livingTargets[index % livingTargets.length].id;
    const result = await uiOrder(actorId, actionId, targetId), before = combatant(result.before, actorId), after = combatant(result.after, actorId);
    assert.equal(after.grenadeCharges, before.grenadeCharges - 1); assert.equal(after.ammo, before.ammo); assert.equal(after.reserveAmmo, before.reserveAmmo); assert.equal(after.heat, before.heat);
    assert.equal(after.cooldowns[actionId] || 0, 0, 'Grenade samples use charges rather than a cooldown');
    let resolved = result.after;
    if (actionId === 'stickyGrenade') {
      assert.equal(damageEvents(result.before, result.after, actorId, actionId).length, 0);
      assert.ok(result.after.projectiles.some(projectile => projectile.actorId === actorId && projectile.actionId === actionId && projectile.remaining > 0));
      resolved = await advanceLegitimately(1.35);
    }
    const hits = damageEvents(result.before, resolved, actorId, actionId);
    assert.equal(new Set(hits.map(event => event.targetId)).size, 2);
    casts.push({ targetId, before: compactActor(before), after: compactActor(after), damageTargets: [...new Set(hits.map(event => event.targetId))] });
    charges.push(after.grenadeCharges);
  }
  await waitReady(actorId, 'shoot'); await action('chronicle-actor', actorId).click();
  assert.match(await page.locator('[data-chronicle-grenades]').innerText(), /0\/3/);
  assert.equal(await action('chronicle-action', actionId).isDisabled(), true);
  assert.match(await action('chronicle-action', actionId).innerText(), /aucun.*grenade/i);
  const beforeRejected = await battle();
  const rejected = await page.evaluate(({ actorId, actionId }) => window.__RELAY_TEST__.chronicleAction({ actorId, actionId, targetId: window.__RELAY_TEST__.getChronicleBattle().actors.find(actor => actor.team === 'enemy' && actor.hp > 0).id }), { actorId, actionId });
  assert.equal(rejected.ok, false); assert.deepEqual(await battle(), beforeRejected, 'A fourth grenade cannot spend ATB, ammunition, events or randomness');
  await page.locator('.chronicle-command').scrollIntoViewIfNeeded(); await screenshot(`${actionId}-empty`);
  report.powers.push({ actionId, actorId, charges, casts, fourthOrderRejected: true });
  await abandonToPreparation();
}

async function verifyFinitePowersAndGroupShield() {
  mark('finite-fragmentation-grenades'); await exhaustGrenades('ME3', 'ME3-CHR-JAMES', 'fragGrenade');
  mark('finite-delayed-sticky-grenades'); await exhaustGrenades('MEA', 'MEA-CHR-JAAL', 'stickyGrenade');
  mark('group-shield-restoration');
  await prepare('MEA', 'mea', 'mea-equipment-workshop');
  const casterId = 'MEA-CHR-CORA';
  await selectParty([casterId, 'MEA-CHR-LIAM', 'MEA-CHR-RYDER']); await action('chronicle-battle').click();
  await page.evaluate(async casterId => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    for (let turn = 0; turn < 1200; turn++) {
      const combat = qa.getChronicleBattle();
      if (!combat || combat.winner) throw new Error('The workshop ended before the real shield-loss witness');
      const damaged = combat.actors.filter(actor => actor.team === 'party' && actor.hp > 0 && actor.shield < actor.maxShield);
      if (damaged.length >= 2 && getActions(combat, casterId).some(action => action.id === 'shieldBoost' && action.available)) return;
      for (const member of combat.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        if (getActions(qa.getChronicleBattle(), member.id).some(action => action.id === 'reposition' && action.available)) {
          const result = qa.chronicleAction({ actorId: member.id, actionId: 'reposition', targetId: member.id });
          if (!result?.ok) throw new Error(result?.reason || 'A legitimate exposure order failed');
        }
      }
      qa.chronicleStep(.25);
    }
    throw new Error('Two real allies did not lose shields before Cora became ready');
  }, casterId);
  const result = await uiOrder(casterId, 'shieldBoost', casterId);
  const damaged = result.before.actors.filter(actor => actor.team === 'party' && actor.hp > 0 && actor.shield < actor.maxShield);
  assert.ok(damaged.length >= 2);
  for (const ally of result.before.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
    const after = combatant(result.after, ally.id);
    if (ally.shield < ally.maxShield) assert.ok(after.shield > ally.shield);
    assert.ok(after.shield <= after.maxShield); assert.equal(after.hp, ally.hp); assert.equal(after.grenadeCharges, ally.grenadeCharges);
    assert.ok(after.statuses.shieldBoost > 0); assert.equal(after.statuses.barrier, ally.statuses.barrier);
  }
  report.powers.push({ actionId: 'shieldBoost', actorId: casterId, damagedAllies: damaged.map(actor => actor.id), before: result.before.actors.filter(actor => actor.team === 'party').map(compactActor), after: result.after.actors.filter(actor => actor.team === 'party').map(compactActor) });
  await abandonToPreparation();
  record('Real grenade orders consume all three finite samples, reject a fourth without mutation and preserve weapon resources; sticky AoE is delayed, while Shield Boost restores multiple genuinely damaged allies without health or grenade changes');
}

async function verifyContextualBenches() {
  mark('contextual-specialist-benches');
  const metadata = await page.evaluate(async () => {
    const { SPECIALIST_SCENARIOS } = await import('/src/universe-specialist-scenarios.js'), { CHRONICLE_SCENARIOS } = await import('/src/universe-actors.js');
    return { scenes: SPECIALIST_SCENARIOS, sceneCount: CHRONICLE_SCENARIOS.length, selectableActorIds: [...new Set(CHRONICLE_SCENARIOS.flatMap(scene => scene.actorIds))] };
  });
  assert.deepEqual(metadata.scenes.map(scene => scene.id).sort(), ['me2-dlc-specialists', 'me2-shadow-broker', 'me3-from-ashes', 'me3-omega', 'me3-citadel-wrex', 'inf-incarceration'].sort());
  assert.equal(metadata.sceneCount, 16); assert.equal(metadata.selectableActorIds.length, 42);
  report.roster = { scenarios: metadata.sceneCount, selectableActors: metadata.selectableActorIds.length };
  for (const scene of metadata.scenes) {
    mark(`bench:${scene.id}`);
    await prepare(scene.context.mediaId, scene.context.periodId, scene.id);
    const roster = await page.locator('[data-do="chronicle-party"]').evaluateAll(buttons => buttons.map(button => button.dataset.id));
    assert.deepEqual(roster.sort(), [...scene.actorIds].sort());
    assert.deepEqual([...(await session()).party].sort(), [...scene.defaultParty].sort());
    const displayed = await page.locator('.universe-scenario .brief-copy').innerText();
    assert.equal(displayed.replace(/\s+/g, ' ').trim(), scene.description.replace(/\s+/g, ' ').trim());
    assert.match(displayed, /mannequins originaux/); assert.deepEqual(scene.allowedEquipmentIds, []);
    if (scene.context.mediaId === 'ME3') await blockedOption(scene.defaultParty[0], 'weapon', 'ME3-WPN-FALCON');
    await action('chronicle-save').click(); const before = await session();
    const exported = await exportDownload(action('chronicle-export'), `chronicle-specialists-${scene.id}.json`);
    await importChronicle(exported); assert.deepEqual(await session(), before);
    if (scene.id === 'me3-omega') { await page.locator('.universe-scenario').scrollIntoViewIfNeeded(); await screenshot('omega-conditions'); }
    await action('chronicle-battle').click();
    const launched = await battle();
    assert.deepEqual(launched.actors.filter(actor => actor.team === 'party').map(actor => actor.id).sort(), [...scene.defaultParty].sort());
    assert.ok(launched.actors.filter(actor => actor.team === 'enemy').every(actor => actor.catalogId === null && actor.abstract === true));
    const targetId = launched.actors.find(actor => actor.team === 'enemy').id, actorId = scene.defaultParty[0];
    const order = await uiOrder(actorId, 'shoot', targetId);
    assert.ok(durability(combatant(order.after, targetId)) < durability(combatant(order.before, targetId)));
    report.scenarios.push({ id: scene.id, context: scene.context, actorIds: scene.actorIds, preparedConditions: scene.preparedConditions, sourceEntryIds: scene.sourceEntryIds,
      sourceIds: scene.sourceIds, allowedEquipmentIds: scene.allowedEquipmentIds, order: { actorId, actionId: 'shoot', targetId }, outcome: 'Launched and exercised with a real order; no victory claimed by this check' });
    await abandonToPreparation();
  }
  for (const [mediaId, sceneId, absent] of [
    ['ME2', 'me2-equipment-workshop', ['ME2-CHR-KASUMI', 'ME2-CHR-ZAEED', 'ME2-CHR-LIARA']],
    ['ME3', 'me3-equipment-workshop', ['ME3-CHR-JAVIK', 'ME3-CHR-ARIA', 'ME3-CHR-NYREEN', 'ME3-CHR-WREX']],
    ['INF', 'inf-security', ['INF-CHR-TURIAN']],
  ]) {
    await prepare(mediaId, mediaId.toLowerCase(), sceneId);
    for (const id of absent) assert.equal(await action('chronicle-party', id).count(), 0, `${id} is not granted outside its explicit contextual bench`);
  }
  await assertIsolated();
  record('Six contextual benches expose eight additional partial profiles under visible DLC/survival/loyalty conditions, survive save/import and execute real orders against declared mannequins without global recruitment or equipment grants');
}

async function verifyNewReadingsAndPreservation() {
  mark('documentary-reading-preservation');
  const oldStories = await page.evaluate(async ids => {
    const { getChronicleStory } = await import('/src/chronicle-story.js');
    return ids.map(id => { const story = getChronicleStory(id); return { id: story.id, context: story.context,
      steps: story.steps.map(step => ({ id: step.id, title: step.title, text: step.text, recordIds: step.recordIds, sourceIds: step.sourceIds, sources: step.sources, reference: step.reference })) }; });
  }, READING_BASELINE.ids);
  const actualHash = createHash('sha256').update(JSON.stringify(oldStories)).digest('hex');
  assert.equal(actualHash, READING_BASELINE.snapshotSha256, 'The nine previous readings retain their exact texts, context, record references and source citations');
  report.previousReadings = { ...READING_BASELINE, actualSnapshotSha256: actualHash, preserved: true };
  const stories = await page.evaluate(async () => {
    const { MEDIA_PERIODS } = await import('/src/continuity-data.js'), { listChronicleStories, getChronicleStory } = await import('/src/chronicle-story.js');
    return MEDIA_PERIODS.flatMap(media => media.periods.flatMap(period => listChronicleStories({ mediaId: media.id, periodId: period.id }).map(story => getChronicleStory(story.id))));
  });
  assert.equal(stories.length, 16); assert.equal(stories.reduce((count, story) => count + story.steps.length, 0), 52);
  const additions = stories.filter(story => !READING_BASELINE.ids.includes(story.id));
  assert.deepEqual(additions.map(story => story.id).sort(), ['dec-reperes', 'hom-liara', 'fou-recherche', 'dis-infiltration', 'inc-omega', 'inq-bailey', 'evo-contact'].sort());
  assert.equal(additions.reduce((count, story) => count + story.steps.length, 0), 10);
  for (const story of additions) {
    mark(`reading:${story.id}`);
    await selectContext(story.context.mediaId, story.context.periodId); const before = await session();
    await action('universe-tab', 'reading').click();
    if (await page.locator('#chronicle-reading').inputValue() !== story.id) await page.locator('#chronicle-reading').selectOption(story.id);
    if (await action('chronicle-reading-open').count()) await action('chronicle-reading-open').click();
    const article = page.locator(`[data-chronicle-reading="${story.id}"]`);
    for (let index = 0; index < story.steps.length; index++) {
      if (index > 0) await page.locator(`[data-do="chronicle-page"][data-index="${index}"]`).click();
      assert.equal(await article.getAttribute('data-reading-index'), String(index));
      const text = await article.locator('.universe-reading-text').innerText(); assert.equal(text, story.steps[index].text);
      const visited = await session(); assert.equal(visited.readingProgress[story.id], index);
      for (const key of ['context', 'scenarioId', 'party', 'loadouts', 'builds', 'notes', 'cleared']) assert.deepEqual(visited[key], before[key]);
      for (const id of story.steps[index].recordIds) assert.ok(visited.discovered.includes(id));
      for (const source of story.steps[index].sources) assert.equal(await article.locator(`[data-reading-source="${source.id}"]`).getAttribute('href'), new URL(source.url).href);
      if (story.id === 'dec-reperes' && index === 2) { assert.match(text, /dix-huit.*douze/); assert.match(text, /contradictions/); }
      if (story.id === 'dec-reperes' && index === 3) { assert.match(text, /n’établissent pas.*édition révisée.*publiée/); await article.scrollIntoViewIfNeeded(); await screenshot('deception-reservations'); }
      if (story.id === 'inq-bailey') { assert.match(text, /traître présumé/); assert.doesNotMatch(text, /Pallin|coupable|verdict/i); await article.scrollIntoViewIfNeeded(); await screenshot('inquisition-presumed'); }
    }
    const completed = await session();
    assert.equal(new Set(completed.discovered).size, completed.discovered.length);
    await action('chronicle-save').click();
    const exported = await exportDownload(action('chronicle-export'), `chronicle-specialists-reading-${story.id}.json`);
    await importChronicle(exported); assert.deepEqual(await session(), completed);
    await action('universe-tab', 'reading').click(); assert.deepEqual(await session(), completed);
    report.stories.push({ id: story.id, context: story.context, pages: story.steps.length, recordIds: [...new Set(story.steps.flatMap(step => step.recordIds))], sourceIds: [...new Set(story.steps.flatMap(step => step.sourceIds))], lastIndex: completed.readingProgress[story.id] });
    await assertIsolated();
  }
  for (const [mediaId, periodId] of [['HOM', 'hom-2-tali'], ['FOU', 'fou-1']]) {
    await selectContext(mediaId, periodId); await action('universe-tab', 'reading').click();
    assert.equal(await page.locator('#chronicle-reading').count(), 0); assert.equal(await page.locator('[data-chronicle-reading]').count(), 0);
  }
  await selectContext('EVO', 'evo-aftermath'); await action('universe-tab', 'reading').click();
  assert.deepEqual(await page.locator('#chronicle-reading option').evaluateAll(options => options.map(option => option.value)), ['evo-apres-guerre']);
  await selectContext('DEC', 'dec'); await action('universe-tab', 'reading').click(); const saved = await session();
  const exported = await exportDownload(action('chronicle-export'), 'chronicle-specialists-deception-resume.json');
  await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await importChronicle(exported); assert.deepEqual(await session(), saved); await action('universe-tab', 'reading').click();
  assert.equal(await page.locator('[data-chronicle-reading="dec-reperes"]').getAttribute('data-reading-index'), String(saved.readingProgress['dec-reperes']));
  const bad = JSON.parse(exported); bad.session.readingProgress['hom-liara'] = 0;
  const beforeBad = await chronicleStorage(); await importChronicle(JSON.stringify(bad), false); assert.deepEqual(await session(), saved); assert.deepEqual(await chronicleStorage(), beforeBad);
  await assertIsolated();
  record('Seven additional contextual readings show ten sourced pages, preserve Deception contradictions and Inquisition suspicion, persist through save/import/reload and reject foreign segments; all nine previous readings remain unchanged');
}

try {
  report.runnerSha256 = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex');
  report.sources = Object.fromEntries(await Promise.all(['src/combat.js', 'src/universe-weapon-profiles.js', 'src/universe-specialist-scenarios.js', 'src/universe-powers.js', 'src/universe-actors.js', 'src/universe-equipment.js', 'src/chronicle-story.js', 'src/chronicles.js', 'src/continuity.js', 'src/universe-ui.js', 'src/main.js'].map(async name => [name, createHash('sha256').update(await readFile(new URL(`../${name}`, import.meta.url))).digest('hex')])));
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  mark('independent-me1-purchase-and-save'); await establishCampaignWitness();
  record('A real ME1 stock purchase, equipped module, entry checkpoint and named manual slot remain the independent campaign witness');
  await verifySpecialistWeapons();
  await verifyFinitePowersAndGroupShield();
  await verifyContextualBenches();
  await verifyNewReadingsAndPreservation();
  await action('chronicle-back').click(); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  const resumed = await campaignState();
  for (const key of ['name', 'xp', 'credits', 'inventory', 'party', 'recruited', 'lost', 'completed', 'cleared', 'choices', 'flags', 'story', 'operations']) assert.deepEqual(resumed[key], baselineState[key]);
  await screenshot('me1-resumed'); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []), []);
  report.passed = true; mark('complete'); console.log(JSON.stringify({ passed: true, checks: report.checks.length, weapons: report.weapons.length, powers: report.powers.length, victories: report.tacticalVictories.length, benches: report.scenarios.length, readings: report.stories.length }));
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
      report.captureArtifacts.push({ runPath, archivePath, sha256: createHash('sha256').update(bytes).digest('hex'), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), method: 'Unmodified screenshot of the real UI' });
    }
    report.screenshots = report.captureArtifacts.map(artifact => artifact.archivePath);
  }
  const encoded = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(new URL('chronicle-specialists-report.json', out), encoded);
  await writeFile(new URL('../docs/qa/chronicle-specialists-browser-report.json', import.meta.url), encoded);
}


import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const legacyFixture = JSON.parse(await readFile(new URL('../tests/fixtures/chronicle-v1-before-expansion.json', import.meta.url), 'utf8'));
const report = {
  passed: false, at: new Date().toISOString(), stage: 'prepare', checks: [], screenshots: [], errors: [], failedRequests: [],
  powers: [], tacticalVictories: [], stories: [],
  scope: 'Actual Chronicle preparation, adapted ATB powers, two distinct weapon modification families and sourced documentary reading paths. These checks do not certify original ranks, statistics, complete campaigns, exact dialogue, original assets or global 1:1 fidelity.',
  legacyFixture: legacyFixture.provenance,
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
const compactActor = actor => Object.fromEntries(['id', 'hp', 'shield', 'maxShield', 'atb', 'heat', 'ammo', 'reserveAmmo', 'magazineCapacity', 'fortificationShield', 'statuses'].filter(key => actor[key] !== undefined).map(key => [key, actor[key]]));
async function preparedActor(actorId) {
  return page.evaluate(async id => (await import('/src/chronicles.js')).buildChronicleActor(window.__RELAY_TEST__.getChronicle(), id), actorId);
}

async function screenshot(name) {
  const filename = `chronicle-expansion-${name}.png`;
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
  await page.evaluate(() => { window.__EXPANSION_IMPORT_FEEDBACK__ = document.querySelector('.universe-feedback'); });
  await page.locator('#chronicle-import').setInputFiles({ name: 'chronicle-expansion.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => {
    const current = document.querySelector('.universe-feedback');
    return document.querySelector('#chronicle-import').value === '' && current && current !== window.__EXPANSION_IMPORT_FEEDBACK__;
  }, null, { polling: 100, timeout: 60000 });
  await page.evaluate(() => { delete window.__EXPANSION_IMPORT_FEEDBACK__; });
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
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator('#manual-save-name-1').fill('ME1 — témoin expansion Chroniques'); await action('manual-save', '1').click();
  assert.equal(await page.locator('[data-save-slot="1"]').getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await action('save').click();
  const before = await campaignState(), manual = await campaignStorage();
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  baselineState = await campaignState(); baselineStorage = await campaignStorage();
  assert.deepEqual(baselineState, before);
  assert.deepEqual(JSON.parse(baselineStorage['relay-chronicles.save.v1']).state, before);
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
  const before = await battle(); await action('chronicle-action', actionId).click();
  if (targetId && targetId !== actorId) await action('chronicle-target', targetId).click();
  const after = await battle();
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

function assertAppliedStatus(result, targetId, status) {
  const events = result.after.events.slice(result.before.events.length);
  assert.ok(events.some(event => event.type === 'status' && event.targetId === targetId && event.status === status && event.duration > 0), `${status} is actually applied by the new order`);
}
async function exerciseAdaptedPowers() {
  mark('biotic-tech-and-military-orders');
  await prepare('ME2', 'me2', 'me2-equipment-workshop');
  await selectParty(['ME2-CHR-JACOB', 'ME2-CHR-MORDIN', 'ME2-CHR-GARRUS']);
  await action('chronicle-battle').click();
  const organic = (await battle()).actors.find(actor => actor.team === 'enemy' && !actor.synthetic).id;
  await waitReady('ME2-CHR-JACOB', 'burst');
  await action('chronicle-actor', 'ME2-CHR-JACOB').click();
  assert.equal(await action('chronicle-action', 'pull').isDisabled(), true, 'Pull cannot bypass intact shields');
  await exposeTarget('ME2-CHR-JACOB', organic);
  let result = await uiOrder('ME2-CHR-JACOB', 'pull', organic);
  assertAppliedStatus(result, organic, 'pull'); powerEvidence('pull', 'ME2-CHR-JACOB', organic, result.before, result.after);
  result = await uiOrder('ME2-CHR-MORDIN', 'incinerate', organic);
  assertAppliedStatus(result, organic, 'burning');
  assert.ok(combatant(result.after, organic).hp < combatant(result.before, organic).hp);
  powerEvidence('incinerate', 'ME2-CHR-MORDIN', organic, result.before, result.after);
  const burning = await advanceLegitimately(1);
  assert.ok(combatant(burning, organic).hp < combatant(result.after, organic).hp, 'Burn deals later damage through actual simulation');
  result = await uiOrder('ME2-CHR-MORDIN', 'cryoBlast', organic);
  assertAppliedStatus(result, organic, 'frozen'); powerEvidence('cryoBlast', 'ME2-CHR-MORDIN', organic, result.before, result.after);
  result = await uiOrder('ME2-CHR-GARRUS', 'concussiveShot', organic);
  assert.ok(combatant(result.after, organic).hp < combatant(result.before, organic).hp);
  assertAppliedStatus(result, organic, 'stagger'); powerEvidence('concussiveShot', 'ME2-CHR-GARRUS', organic, result.before, result.after);
  await screenshot('power-families'); await winChronicle();

  mark('drain-restores-real-shield-loss');
  await prepare('ME2', 'me2', 'me2-equipment-workshop'); await selectParty(['ME2-CHR-TALI']);
  await action('chronicle-battle').click();
  for (let turn = 0; turn < 12; turn++) {
    await waitReady('ME2-CHR-TALI', 'reposition');
    const actor = combatant(await battle(), 'ME2-CHR-TALI');
    if (actor.shield < actor.maxShield) break;
    await uiOrder(actor.id, 'reposition', actor.id);
  }
  const synthetic = (await battle()).actors.find(actor => actor.team === 'enemy' && actor.synthetic).id;
  result = await uiOrder('ME2-CHR-TALI', 'energyDrain', synthetic);
  const drainedBefore = combatant(result.before, synthetic), drainedAfter = combatant(result.after, synthetic);
  assert.ok(drainedAfter.hp + drainedAfter.shield < drainedBefore.hp + drainedBefore.shield);
  assert.ok(combatant(result.before, 'ME2-CHR-TALI').shield < combatant(result.before, 'ME2-CHR-TALI').maxShield);
  assert.ok(combatant(result.after, 'ME2-CHR-TALI').shield > combatant(result.before, 'ME2-CHR-TALI').shield, 'Energy Drain restores shields actually lost to enemy orders');
  powerEvidence('energyDrain', 'ME2-CHR-TALI', synthetic, result.before, result.after); await winChronicle();

  mark('temporary-protection-and-group-control');
  await prepare('ME2', 'me2', 'me2-equipment-workshop'); await selectParty(['ME2-CHR-GRUNT', 'ME2-CHR-JACK']);
  await action('chronicle-battle').click();
  result = await uiOrder('ME2-CHR-GRUNT', 'fortification', 'ME2-CHR-GRUNT');
  assertAppliedStatus(result, 'ME2-CHR-GRUNT', 'fortification');
  assert.ok(combatant(result.after, 'ME2-CHR-GRUNT').fortificationShield > 0);
  powerEvidence('fortification', 'ME2-CHR-GRUNT', null, result.before, result.after);
  const exposed = (await battle()).actors.find(actor => actor.team === 'enemy' && !actor.synthetic).id;
  await exposeTarget('ME2-CHR-JACK', exposed);
  result = await uiOrder('ME2-CHR-JACK', 'shockwave', exposed);
  const hitIds = new Set(result.after.events.slice(result.before.events.length).filter(event => event.type === 'damage' && event.actionId === 'shockwave').map(event => event.targetId));
  assert.equal(hitIds.size, 2, 'Shockwave reaches both original workshop targets');
  assertAppliedStatus(result, exposed, 'stagger'); powerEvidence('shockwave', 'ME2-CHR-JACK', null, result.before, result.after); await winChronicle();

  mark('reave-and-delayed-slam');
  await prepare('ME2', 'me2', 'me2-equipment-workshop'); await selectParty(['ME2-CHR-SAMARA', 'ME2-CHR-MIRANDA']);
  await action('chronicle-battle').click();
  const reaveTarget = (await battle()).actors.find(actor => actor.team === 'enemy' && !actor.synthetic).id;
  await exposeTarget('ME2-CHR-MIRANDA', reaveTarget);
  result = await uiOrder('ME2-CHR-SAMARA', 'reave', reaveTarget);
  assertAppliedStatus(result, reaveTarget, 'reave'); powerEvidence('reave', 'ME2-CHR-SAMARA', reaveTarget, result.before, result.after);
  const reaved = await advanceLegitimately(1);
  assert.ok(combatant(reaved, reaveTarget).hp < combatant(result.after, reaveTarget).hp);
  result = await uiOrder('ME2-CHR-MIRANDA', 'slam', reaveTarget);
  assertAppliedStatus(result, reaveTarget, 'slam');
  assert.equal(result.after.events.slice(result.before.events.length).some(event => event.type === 'damage' && event.actionId === 'slam'), false, 'Slam does not apply its impact before the lift phase');
  const impacted = await advanceLegitimately(1.1);
  assert.ok(impacted.events.slice(result.after.events.length).some(event => event.type === 'damage' && event.actionId === 'slam' && event.targetId === reaveTarget), 'The impact happens after the real delayed phase');
  powerEvidence('slam', 'ME2-CHR-MIRANDA', reaveTarget, result.before, impacted); await winChronicle();

  mark('organic-domination');
  await prepare('ME2', 'me2', 'me2-equipment-workshop'); await selectParty(['ME2-CHR-MORINTH']);
  await action('chronicle-battle').click();
  const dominateTarget = (await battle()).actors.find(actor => actor.team === 'enemy' && !actor.synthetic).id;
  await exposeTarget('ME2-CHR-MORINTH', dominateTarget);
  result = await uiOrder('ME2-CHR-MORINTH', 'dominate', dominateTarget);
  assertAppliedStatus(result, dominateTarget, 'dominated');
  powerEvidence('dominate', 'ME2-CHR-MORINTH', dominateTarget, result.before, result.after);
  const dominated = await advanceLegitimately(8.5);
  assert.ok(dominated.events.some(event => event.type === 'action' && event.actorId === dominateTarget && event.targetId === dominated.actors.find(actor => actor.team === 'enemy' && actor.synthetic).id), 'The controlled organic really orders an attack against its own camp');
  await winChronicle();
  assert.deepEqual([...new Set(report.powers.map(power => power.actionId))].sort(), ['pull', 'incinerate', 'cryoBlast', 'concussiveShot', 'energyDrain', 'fortification', 'reave', 'shockwave', 'slam', 'dominate'].sort());
  record('Ten distinct adapted powers execute real UI orders across biotic, technology and military families, with real restrictions, delayed effects, shield restoration and organic control');
}

async function exerciseMigrationBuildsAndModules() {
  mark('historical-session-migration');
  await importChronicle(JSON.stringify(legacyFixture.packet));
  const migrated = await session(), original = legacyFixture.packet.session;
  for (const key of ['context', 'scenarioId', 'party', 'discovered', 'notes', 'cleared']) assert.deepEqual(migrated[key], original[key]);
  assert.deepEqual(migrated.readingProgress, {});
  for (const id of original.party) {
    assert.equal(migrated.builds[id], 'default');
    assert.deepEqual(migrated.loadouts[id], { ...original.loadouts[id], weaponMod: null, weaponMod2: null });
  }
  const shepard = 'ME3-CHR-SHEPARD', baseline = await preparedActor(shepard);
  assert.deepEqual(baseline.powers, [], 'Historical Shepard is not silently assigned a class');
  report.migration = { context: migrated.context, party: migrated.party, builds: migrated.builds, loadouts: migrated.loadouts, readingProgress: migrated.readingProgress };

  mark('explicit-class-preparation');
  const expectedClasses = ['default', 'soldier', 'engineer', 'adept', 'infiltrator', 'vanguard', 'sentinel'];
  assert.deepEqual((await buildSelect(shepard).locator('option').evaluateAll(options => options.map(option => option.value))).sort(), [...expectedClasses].sort());
  for (const id of expectedClasses) {
    await buildSelect(shepard).selectOption(id);
    const actor = await preparedActor(shepard);
    for (const stat of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(actor[stat], baseline[stat], `${id} does not fabricate new base statistics`);
    assert.equal((await session()).builds[shepard], id);
    if (id !== 'default') assert.ok(actor.powers.length > 0);
  }
  await buildSelect(shepard).selectOption('engineer');
  const unmodified = await preparedActor(shepard);
  assert.ok(unmodified.powers.includes('incinerate'));
  await gear(shepard, 'weaponMod').selectOption('ME3-EQP-BARREL');
  await blockedOption(shepard, 'weaponMod2', 'ME3-EQP-BARREL');
  await gear(shepard, 'weaponMod2').selectOption('ME3-EQP-MAGAZINE');
  const modified = await preparedActor(shepard);
  assert.equal(modified.weaponDamageMultiplier, 1.12); assert.equal(modified.attack, unmodified.attack);
  assert.equal(modified.magazineCapacity, 23); assert.equal(modified.ammo, 23); assert.equal(modified.reserveAmmo, 67);
  assert.equal(modified.ammo + modified.reserveAmmo, unmodified.ammo + unmodified.reserveAmmo);
  assert.equal(modified.bioticMultiplier, unmodified.bioticMultiplier); assert.equal(modified.techMultiplier, unmodified.techMultiplier);
  assert.deepEqual(modified.powers, unmodified.powers, 'Weapon modifications neither grant nor amplify a power');
  const displayedStats = await page.locator(`[data-chronicle-actor="${shepard}"]`).innerText();
  assert.match(displayedStats, /Chargeur ATB 23, réserve ATB 67/);
  assert.match(displayedStats, /Dégâts des tirs ATB 112 %/);
  assert.equal(await gear(shepard, 'weaponMod').locator('option[value="ME3-EQP-SCOPE"]').count(), 0);
  await gear(shepard, 'weaponMod').selectOption(''); await gear(shepard, 'weaponMod2').selectOption('');
  await gear(shepard, 'weaponMod').selectOption('ME3-EQP-MAGAZINE'); await gear(shepard, 'weaponMod2').selectOption('ME3-EQP-BARREL');
  assert.deepEqual(await preparedActor(shepard), modified, 'The two distinct module families work in either port');
  assert.match(await page.locator(`[data-chronicle-actor="${shepard}"] .universe-change-warning`).last().innerText(), /deux ports/);
  await gear(shepard, 'weapon').selectOption('ME3-WPN-VINDICATOR');
  assert.equal((await session()).loadouts[shepard].weaponMod, null); assert.equal((await session()).loadouts[shepard].weaponMod2, null);
  await gear(shepard, 'weapon').selectOption('ME3-WPN-AVENGER');
  await gear(shepard, 'weaponMod').selectOption('ME3-EQP-BARREL'); await gear(shepard, 'weaponMod2').selectOption('ME3-EQP-MAGAZINE');
  await gear(shepard, 'weapon').selectOption('');
  assert.equal((await session()).loadouts[shepard].weaponMod, null); assert.equal((await session()).loadouts[shepard].weaponMod2, null);
  await blockedOption(shepard, 'weaponMod', 'ME3-EQP-BARREL');
  await gear(shepard, 'weapon').selectOption('ME3-WPN-PREDATOR'); await blockedOption(shepard, 'weaponMod', 'ME3-EQP-BARREL');
  await gear(shepard, 'weapon').selectOption('ME3-WPN-AVENGER');
  await gear(shepard, 'weaponMod').selectOption('ME3-EQP-BARREL'); await gear(shepard, 'weaponMod2').selectOption('ME3-EQP-MAGAZINE');
  await action('chronicle-save').click(); const equipped = await session();
  const exported = await exportDownload(action('chronicle-export'), 'chronicle-expansion-me3-modules.json');
  for (const corrupt of [
    packet => { packet.session.loadouts[shepard].weaponMod2 = 'ME3-EQP-BARREL'; },
    packet => { delete packet.session.loadouts[shepard].weaponMod2; },
    packet => { packet.session.builds[shepard] = 'invented-class'; },
    packet => { packet.session.readingProgress['ann-transit'] = 0; },
  ]) {
    const packet = JSON.parse(exported); corrupt(packet); const before = await chronicleStorage();
    await importChronicle(JSON.stringify(packet), false);
    assert.deepEqual(await session(), equipped); assert.deepEqual(await chronicleStorage(), before);
  }
  await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await selectContext('ME3', 'me3'); await action('universe-tab', 'session').click(); await action('chronicle-load').click();
  assert.deepEqual(await session(), equipped); assert.deepEqual(await preparedActor(shepard), modified);
  await importChronicle(exported); assert.deepEqual(await session(), equipped); await assertIsolated();
  await page.locator(`[data-chronicle-actor="${shepard}"]`).scrollIntoViewIfNeeded();
  await screenshot('two-module-ports');
  report.modules = { actorId: shepard, before: { attack: unmodified.attack, capacity: unmodified.magazineCapacity, ammo: unmodified.ammo, reserve: unmodified.reserveAmmo },
    after: { attack: modified.attack, weaponDamageMultiplier: modified.weaponDamageMultiplier, capacity: modified.magazineCapacity, ammo: modified.ammo, reserve: modified.reserveAmmo },
    loadout: equipped.loadouts[shepard], acquisition: 'Free prototype preparation, with no stock, credits or ownership simulation' };
  await action('chronicle-battle').click();
  const target = (await battle()).actors.find(actor => actor.team === 'enemy').id;
  const shot = await uiOrder(shepard, 'shoot', target), shooterBefore = combatant(shot.before, shepard), shooterAfter = combatant(shot.after, shepard);
  assert.equal(shooterBefore.magazineCapacity, 23); assert.equal(shooterBefore.ammo, 23); assert.equal(shooterAfter.ammo, 22);
  assert.equal(shooterAfter.reserveAmmo, 67); assert.equal(shooterAfter.heat, 0);
  assert.ok(combatant(shot.after, target).hp + combatant(shot.after, target).shield < combatant(shot.before, target).hp + combatant(shot.before, target).shield);
  await uiOrder(shepard, 'incinerate', target); await winChronicle();
  record('A historical v1 session migrates without assigning a class; explicit builds and two distinct module ports persist through export/import and reload, alter only their adapted statistics, consume real ammunition and clear on weapon replacement/removal');

  mark('cross-period-build-and-module-restrictions');
  await prepare('ME2', 'me2', 'me2-equipment-workshop');
  const me2 = 'ME2-CHR-SHEPARD', me2Base = await preparedActor(me2);
  for (const id of expectedClasses) {
    await buildSelect(me2).selectOption(id);
    const actor = await preparedActor(me2);
    for (const stat of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(actor[stat], me2Base[stat]);
  }
  await buildSelect(me2).selectOption('default'); await gear(me2, 'weapon').selectOption('ME2-WPN-AVENGER'); await gear(me2, 'armor').selectOption('ME2-EQP-N7');
  await buildSelect(me2).selectOption('engineer');
  assert.equal((await session()).loadouts[me2].weapon, null);
  assert.equal((await session()).loadouts[me2].armor, 'ME2-EQP-N7');
  await blockedOption(me2, 'weapon', 'ME2-WPN-AVENGER');
  assert.equal(await gear(me2, 'weaponMod').count(), 0, 'ME3 weapon modifications are not invented in ME2');
  await prepare('MEA', 'mea', 'mea-equipment-workshop');
  const ryder = 'MEA-CHR-RYDER', ryderBase = await preparedActor(ryder);
  assert.deepEqual((await buildSelect(ryder).locator('option').evaluateAll(options => options.map(option => option.value))).sort(), ['default', 'combat', 'biotic', 'tech'].sort());
  for (const id of ['combat', 'biotic', 'tech']) {
    await buildSelect(ryder).selectOption(id); const actor = await preparedActor(ryder);
    for (const stat of ['hp', 'maxHp', 'shield', 'maxShield', 'attack', 'defense', 'speed']) assert.equal(actor[stat], ryderBase[stat]);
    assert.ok(actor.powers.length > 0 && actor.powers.length <= 3);
  }
  await prepare('MEA', 'mea-prologue', 'mea-habitat7');
  assert.deepEqual(await buildSelect(ryder).locator('option').evaluateAll(options => options.map(option => option.value)), ['default']);
  assert.equal(await buildSelect(ryder).isDisabled(), true);
  assert.deepEqual((await preparedActor(ryder)).powers, []);
  await assertIsolated();
  record('Class preparations retain base statistics and enforce ME2 weapon training, Ryder skill selections stay bounded, and prologues and earlier works do not inherit later builds or modifications');
}

async function exerciseDocumentaryReadings() {
  mark('sourced-documentary-readings');
  const stories = await page.evaluate(async () => {
    const { MEDIA_PERIODS } = await import('/src/continuity-data.js'), { listChronicleStories, getChronicleStory } = await import('/src/chronicle-story.js');
    return MEDIA_PERIODS.flatMap(media => media.periods.flatMap(period => listChronicleStories({ mediaId: media.id, periodId: period.id }).map(story => getChronicleStory(story.id))));
  });
  assert.ok(stories.length >= 6, 'At least six sourced works offer actual documentary reading');
  for (const story of stories) {
    mark(`reading:${story.id}`);
    await selectContext(story.context.mediaId, story.context.periodId);
    const beforeReading = await session();
    await action('universe-tab', 'reading').click();
    if (await page.locator('#chronicle-reading').inputValue() !== story.id) await page.locator('#chronicle-reading').selectOption(story.id);
    if (await action('chronicle-reading-open').count()) await action('chronicle-reading-open').click();
    const article = page.locator(`[data-chronicle-reading="${story.id}"]`);
    const sourceIds = new Set(), recordIds = new Set();
    for (let index = 0; index < story.steps.length; index++) {
      if (index > 0) await page.locator(`[data-do="chronicle-page"][data-index="${index}"]`).click();
      await article.waitFor(); assert.equal(await article.getAttribute('data-reading-index'), String(index));
      assert.equal(await article.locator('.universe-reading-text').innerText(), story.steps[index].text);
      const visited = await session();
      assert.equal(visited.readingProgress[story.id], index);
      for (const key of ['context', 'scenarioId', 'party', 'loadouts', 'builds', 'notes', 'cleared']) assert.deepEqual(visited[key], beforeReading[key], `Reading ${story.id} cannot change ${key}`);
      for (const id of story.steps[index].recordIds) { assert.ok(visited.discovered.includes(id)); recordIds.add(id); }
      for (const source of story.steps[index].sources) {
        sourceIds.add(source.id);
        assert.equal(await article.locator(`[data-reading-source="${source.id}"]`).getAttribute('href'), new URL(source.url).href);
      }
    }
    const completed = await session();
    assert.equal(new Set(completed.discovered).size, completed.discovered.length);
    assert.equal(await article.locator('[data-do="chronicle-page"]').last().isDisabled(), true);
    if (story.steps.length > 1) {
      await article.locator(`[data-do="chronicle-page"][data-index="${story.steps.length - 2}"]`).click();
      await article.locator(`[data-do="chronicle-page"][data-index="${story.steps.length - 1}"]`).click();
      assert.deepEqual(await session(), completed, 'Rereading facts adds no duplicate discoveries, rewards or alternate outcomes');
    }
    const metadata = await page.evaluate(async ({ ids, context }) => {
      const { getUniverseRecord } = await import('/src/universe-data.js'), { canAccessContent } = await import('/src/continuity.js');
      return ids.map(id => { const record = getUniverseRecord(id); return { id, established: record.nature === 'Établi' && record.fact === true, available: canAccessContent(id, context).ok }; });
    }, { ids: [...recordIds], context: story.context });
    assert.ok(metadata.every(record => record.established && record.available));
    report.stories.push({ id: story.id, context: story.context, pages: story.steps.length, recordIds: [...recordIds], sourceIds: [...sourceIds], lastIndex: completed.readingProgress[story.id] });
    await assertIsolated();
  }
  await page.locator('[data-chronicle-reading]').scrollIntoViewIfNeeded();
  await screenshot('documentary-page');
  await selectContext('EVO', 'evo-contact'); await action('universe-tab', 'reading').click();
  assert.equal(await page.locator('#chronicle-reading').count(), 0, 'The later Evolution arc cannot be read as ongoing First Contact War');
  assert.equal(await page.locator('[data-chronicle-reading]').count(), 0);
  for (const mediaId of ['LIB', 'BLA', 'ME4', 'CUT']) {
    await selectContext(mediaId); await action('universe-tab', 'reading').click();
    assert.equal(await page.locator('#chronicle-period').isDisabled(), true);
    assert.equal(await page.locator('[data-chronicle-reading]').count(), 0);
  }
  await selectContext('INI', 'ini'); await action('universe-tab', 'reading').click();
  const saved = await session(); assert.equal(saved.context.galaxy, 'milky-way');
  const exported = await exportDownload(action('chronicle-export'), 'chronicle-expansion-reading.json');
  const stored = await chronicleStorage();
  await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await selectContext('INI', 'ini'); await action('universe-tab', 'reading').click();
  assert.deepEqual(await session(), saved); assert.deepEqual(await chronicleStorage(), stored);
  assert.equal(await page.locator('[data-chronicle-reading="ini-cora"]').getAttribute('data-reading-index'), String(saved.readingProgress['ini-cora']));
  await selectContext('ANN', 'ann'); await action('universe-tab', 'reading').click();
  assert.equal((await session()).context.galaxy, 'unknown', 'Intergalactic transit does not become a free Heleus scene');
  await importChronicle(exported); assert.deepEqual(await session(), saved);
  const bad = JSON.parse(exported); bad.session.readingProgress['evo-apres-guerre'] = 0;
  const beforeBad = await chronicleStorage(); await importChronicle(JSON.stringify(bad), false);
  assert.deepEqual(await session(), saved); assert.deepEqual(await chronicleStorage(), beforeBad);
  await assertIsolated();
  record('Every exposed documentary path displays its sourced factual paraphrases, records only unique visits and page position, survives reload/import, and rejects other works, segments and speculative settings', { readings: report.stories.length, pages: report.stories.reduce((total, story) => total + story.pages, 0) });
}

try {
  report.sources = Object.fromEntries(await Promise.all(['src/combat.js', 'src/universe-powers.js', 'src/universe-actors.js', 'src/universe-equipment.js', 'src/chronicle-story.js', 'src/chronicles.js', 'src/continuity.js', 'src/universe-ui.js', 'src/main.js'].map(async name => [name, createHash('sha256').update(await readFile(new URL(`../${name}`, import.meta.url))).digest('hex')])));
  browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
  mark('independent-me1-witness'); await establishCampaignWitness();
  await exerciseMigrationBuildsAndModules();
  await exerciseAdaptedPowers();
  await exerciseDocumentaryReadings();
  await action('chronicle-back').click(); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  const resumed = await campaignState();
  for (const key of ['name', 'xp', 'credits', 'inventory', 'party', 'recruited', 'lost', 'completed', 'cleared', 'choices', 'flags', 'story', 'operations']) assert.deepEqual(resumed[key], baselineState[key]);
  await screenshot('me1-resumed'); assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  report.passed = true; mark('complete'); console.log(JSON.stringify({ passed: true, checks: report.checks.length, powers: new Set(report.powers.map(power => power.actionId)).size, victories: report.tacticalVictories.length, readings: report.stories.length }));
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
  await browser?.close(); await writeFile(new URL('chronicle-expansion-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}

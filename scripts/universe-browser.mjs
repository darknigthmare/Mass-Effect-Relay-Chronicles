import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const catalogueFiles = [new URL('../docs/content-catalog.json', import.meta.url), ...(await readdir(new URL('../docs/universe/catalogs/', import.meta.url))).filter(name => name.endsWith('.json')).sort().map(name => new URL(`../docs/universe/catalogs/${name}`, import.meta.url))];
const catalogues = await Promise.all(catalogueFiles.map(async url => {
  const catalogue = JSON.parse(await readFile(url, 'utf8'));
  return { ...catalogue, id: catalogue.id || 'ME1' };
}));
const reservationIds = ['GAL-CNT-DATE', 'ME2-WRL-AEIA', 'ANN-CON-01', 'ANN-CON-03', 'INI-CON-01', 'PL-CON-02', 'PL-CON-03', 'ME4-REF-STOP', 'CUT-CASE-ME4', 'BLA-WRL-VIRMIRE', 'LIB-REF-VOL2'];
const report = {
  passed: false, at: new Date().toISOString(), stage: 'prepare', checks: [], screenshots: [], errors: [], failedRequests: [],
  scope: 'Separate multimedia reference contexts and bounded ATB Chronicle prototypes. These checks do not certify complete campaigns, exact dialogue, original combat statistics or global 1:1 fidelity.',
  catalogueReview: {
    catalogues: catalogues.map(catalogue => ({ id: catalogue.id, title: catalogue.title || 'Mass Effect', entries: catalogue.entries.length, medium: catalogue.medium || 'Jeu vidéo' })),
    reservations: catalogues.flatMap(catalogue => catalogue.entries.filter(entry => reservationIds.includes(entry.id)).map(entry => ({ mediaId: catalogue.id, id: entry.id, name: entry.name, nature: entry.nature || entry.canonLevel, description: entry.description, sourceIds: entry.sourceIds || [] }))),
    rules: [
      'Established reference facts do not make adaptation/gameplay/implementation proposals canonical.',
      'Dates of publication, world names and contradictory chronology do not grant temporal availability.',
      'LIB is an editorial collection; HOM/FOU require individual scenes, not a blanket date interval.',
      'BLA is fiction inside the fiction; ME4 and CUT remain documentary and unavailable to factual gameplay.',
      'Andromeda-linked pre-departure, transit and Heleus contexts remain distinct.',
    ],
  },
};
let browser, page;
const mark = stage => { report.stage = stage; console.log(JSON.stringify({ stage })); };
const record = (name, details = {}) => { report.checks.push({ name, ...details }); console.log(JSON.stringify({ check: name })); };
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
async function screenshot(name) {
  const filename = `universe-${name}.png`;
  await page.screenshot({ path: fileURLToPath(new URL(filename, out)), timeout: 60000 });
  report.screenshots.push(`test-results/${filename}`);
}
async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState() && !qa.getUI().busy && (!expected || qa.getState().zone === expected);
  }, zone || null, { polling: 100, timeout: 60000 });
}
const mainState = () => page.evaluate(() => structuredClone(window.__RELAY_TEST__.getState()));
const mainStorage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)])));
async function exportDownload(button, filename) {
  const pending = page.waitForEvent('download'); await button.click();
  const download = await pending, path = fileURLToPath(new URL(filename, out));
  await download.saveAs(path); return readFile(path, 'utf8');
}
async function saveMainBranch(id) {
  await page.keyboard.press('Escape'); await action('manual-saves').click();
  await page.locator(`#manual-save-name-${id}`).fill('Campagne ME1 témoin indépendante');
  await action('manual-save', id).click();
  assert.equal(await page.locator(`[data-save-slot="${id}"]`).getAttribute('data-status'), 'saved');
  await action('manual-back').click(); await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
}
async function contextBoundaries() {
  const unverified = catalogues.find(catalogue => catalogue.id === 'ME2').entries.find(entry => entry.nature === 'Extrapolation').id;
  const observed = await page.evaluate(async unverifiedId => {
    const continuity = await import('/src/continuity.js');
    const { UNIVERSE_RECORDS } = await import('/src/universe-data.js');
    const context = (mediaId, periodId) => ({ mediaId, periodId });
    const access = (id, mediaId, periodId) => continuity.canAccessContent(id, context(mediaId, periodId)).ok;
    return {
      mainContext: continuity.getCurrentContext(window.__RELAY_TEST__.getState()),
      freeYear: continuity.normalizeContext({ mediaId: 'ME1', periodId: 'me1', year: 2185 }),
      foreignPeriod: continuity.normalizeContext(context('ME1', 'me2')),
      wrongGalaxy: continuity.normalizeContext({ mediaId: 'MEA', periodId: 'mea', galaxy: 'milky-way' }),
      jackME1: access('ME2-CHR-JACK', 'ME1', 'me1'), jackME2: access('ME2-CHR-JACK', 'ME2', 'me2'),
      graalGalaxy: access('ME3-WPN-GRAAL', 'GAL', 'gal'),
      eosME1: access('MEA-WRL-EOS', 'ME1', 'me1'), eosMEA: access('MEA-WRL-EOS', 'MEA', 'mea'),
      taliUnverifiedScene: access('HOM-ACT-TALI', 'HOM', 'hom-2-tali'),
      liaraHomeworlds4: access('HOM-ACT-LIARA', 'HOM', 'hom-4-liara'),
      garrusInTaliStory: access('HOM-ACT-GARRUS', 'HOM', 'hom-2-tali'),
      foundationJackUnverified7: access('FOU-ACT-JACK', 'FOU', 'fou-7'),
      foundationMiranda5: access('FOU-ACT-MIRANDA', 'FOU', 'fou-5'), foundationMiranda2: access('FOU-ACT-MIRANDA', 'FOU', 'fou-2'),
      adaptationAvailable: access(unverifiedId, 'ME2', 'me2'),
      documentaryOnly: UNIVERSE_RECORDS.every(record => record.playable === false),
      locked: continuity.listMediaPeriods().filter(media => ['LIB', 'ME4', 'CUT', 'BLA'].includes(media.id)).map(media => ({ id: media.id, locked: media.locked, periods: media.periods.length })),
      noNumericYear: continuity.listMediaPeriods().filter(media => ['GAL', 'ANN', 'PL'].includes(media.id)).every(media => media.periods.every(period => period.yearStart === null && period.yearEnd === null)),
    };
  }, unverified);
  assert.deepEqual(observed.mainContext, { mediaId: 'ME1', periodId: 'me1', galaxy: 'milky-way' });
  for (const key of ['freeYear', 'foreignPeriod', 'wrongGalaxy']) assert.equal(observed[key], null);
  for (const key of ['jackME1', 'graalGalaxy', 'eosME1', 'garrusInTaliStory', 'taliUnverifiedScene', 'foundationJackUnverified7', 'foundationMiranda2', 'adaptationAvailable']) assert.equal(observed[key], false, key);
  for (const key of ['jackME2', 'eosMEA', 'liaraHomeworlds4', 'foundationMiranda5', 'documentaryOnly', 'noNumericYear']) assert.equal(observed[key], true, key);
  assert.deepEqual(observed.locked.map(media => media.id).sort(), ['BLA', 'CUT', 'LIB', 'ME4']);
  assert.ok(observed.locked.every(media => media.locked && media.periods === 0));
  return observed;
}
const chronicle = () => page.evaluate(() => window.__RELAY_TEST__.getChronicle());
const chronicleBattle = () => page.evaluate(() => window.__RELAY_TEST__.getChronicleBattle());
const chronicleStorage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith('relay-chronicles.chronicle.')).sort().map(key => [key, localStorage.getItem(key)])));
async function selectContext(mediaId, periodId) {
  if (await page.locator('#chronicle-media').inputValue() !== mediaId) await page.locator('#chronicle-media').selectOption(mediaId);
  if (periodId && await page.locator('#chronicle-period').inputValue() !== periodId) await page.locator('#chronicle-period').selectOption(periodId);
}
async function reference(mediaId, periodId, query) {
  await selectContext(mediaId, periodId); await action('universe-tab', 'references').click();
  await action('universe-group', 'all').click(); await page.locator('#universe-search').fill(query);
}
async function prepare(mediaId, periodId, scenarioId, load = false) {
  await selectContext(mediaId, periodId); await action('universe-tab', 'session').click();
  if (!load && await page.locator('#chronicle-scenario').inputValue() !== scenarioId) await page.locator('#chronicle-scenario').selectOption(scenarioId);
  await action(load ? 'chronicle-load' : 'chronicle-start').click();
  await page.waitForFunction(({ mediaId, periodId, scenarioId }) => {
    const current = window.__RELAY_TEST__.getChronicle();
    return current?.context.mediaId === mediaId && current.context.periodId === periodId && current.scenarioId === scenarioId;
  }, { mediaId, periodId, scenarioId }, { polling: 100, timeout: 60000 });
}
const gear = (actorId, slot) => page.locator(`[data-chronicle-gear][data-actor-id="${actorId}"][data-slot="${slot}"]`);
async function blockedGearOption(actorId, slot, itemId, message) {
  const select = gear(actorId, slot);
  await select.scrollIntoViewIfNeeded();
  const observed = await select.locator(`option[value="${itemId}"]`).evaluate(option => ({
    disabled: option.disabled, attribute: option.hasAttribute('disabled'), value: option.value, label: option.textContent,
  }));
  assert.equal(observed.disabled, true, `${message || itemId}: ${JSON.stringify(observed)}`);
  assert.equal(observed.attribute, true, message || itemId);
}
async function importChronicle(contents, valid = true) {
  await page.evaluate(() => { window.__UNIVERSE_IMPORT_FEEDBACK__ = document.querySelector('.universe-feedback'); });
  await page.locator('#chronicle-import').setInputFiles({ name: 'chronicle.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => {
    const current = document.querySelector('.universe-feedback');
    return document.querySelector('#chronicle-import').value === '' && current && current !== window.__UNIVERSE_IMPORT_FEEDBACK__;
  }, null, { polling: 100, timeout: 60000 });
  await page.evaluate(() => { delete window.__UNIVERSE_IMPORT_FEEDBACK__; });
  assert.equal(await page.locator('.universe-feedback.error').count(), valid ? 0 : 1);
}
async function waitReady(actorId, actionId) {
  await page.evaluate(async ({ actorId, actionId }) => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    for (let turn = 0; turn < 200; turn++) {
      const battle = qa.getChronicleBattle();
      if (!battle || battle.winner) throw new Error('The Chronicle ended before the requested order');
      if (getActions(battle, actorId).some(action => action.id === actionId && action.available)) return;
      for (const member of battle.actors.filter(actor => actor.team === 'party' && actor.id !== actorId && actor.hp > 0)) {
        if (getActions(battle, member.id).some(action => action.id === 'cover' && action.available)) {
          const result = qa.chronicleAction({ actorId: member.id, actionId: 'cover', targetId: member.id });
          if (!result?.ok) throw new Error(result?.reason || 'A legitimate companion cover order failed');
        }
      }
      qa.chronicleStep(.25);
    }
    throw new Error(`${actorId} did not become ready for ${actionId}`);
  }, { actorId, actionId });
}
async function winChronicle() {
  const outcome = await page.evaluate(async () => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__;
    let iterations = 0, battle = qa.getChronicleBattle();
    while (battle && !battle.winner && iterations++ < 6000) {
      for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0)) {
        battle = qa.getChronicleBattle(); if (battle.winner) break;
        const available = getActions(battle, actor.id).filter(action => action.available);
        const enemies = battle.actors.filter(enemy => enemy.team === 'enemy' && enemy.hp > 0);
        const target = enemies.find(enemy => !enemy.statuses.stasis) || enemies[0];
        if (!target || !available.length) continue;
        const low = battle.actors.filter(member => member.team === 'party' && member.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const priorities = [];
        if (low.hp / low.maxHp < .4) priorities.push(['medigel', low.id]);
        if (actor.weaponSystem === 'thermal-clip' && actor.ammo < 1) priorities.push(['reload', actor.id]);
        if (target.shield > 0) priorities.push(['overload', target.id]);
        priorities.push(['signature', target.id], ['warp', target.id], ['burst', target.id], ['shoot', target.id], ['throw', target.id], ['overload', target.id], ['reload', actor.id], ['cover', actor.id]);
        for (const [actionId, targetId] of priorities) {
          if (!available.some(action => action.id === actionId)) continue;
          const result = qa.chronicleAction({ actorId: actor.id, actionId, targetId });
          if (result?.ok) break;
        }
      }
      qa.chronicleStep(.5); battle = qa.getChronicleBattle();
    }
    return { winner: battle?.winner, actions: battle?.actionCount, elapsed: battle?.elapsed, iterations,
      scenarioId: qa.getChronicle()?.scenarioId, cleared: qa.getChronicle()?.cleared };
  });
  assert.equal(outcome.winner, 'party'); assert.ok(outcome.actions > 0); assert.ok(outcome.cleared.includes(outcome.scenarioId));
  await page.locator('#chronicle-battle-status').filter({ hasText: 'Victoire' }).waitFor();
  await action('chronicle-preparation').click();
  return outcome;
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });

  mark('real-me1-baseline');
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill('Alex Continuité'); await page.locator('#new-appearance').selectOption('female');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click(); await idle('normandy');
  await action('equipment').click(); await action('eq-tab', 'shop').click(); await action('eq-buy', 'heat-sink-i').click();
  await action('eq-tab', 'inventory').click(); await action('eq-equip', 'heat-sink-i').click(); await action('close').click();
  await saveMainBranch('1'); await page.keyboard.press('Escape'); await action('save').click();
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await page.waitForFunction(() => {
    const live = window.__RELAY_TEST__.getState();
    const saved = JSON.parse(localStorage.getItem('relay-chronicles.save.v1')).state;
    return live.playedSeconds >= saved.playedSeconds + .5;
  }, null, { polling: 100, timeout: 60000 });
  await page.keyboard.press('Escape');
  const beforeEntryState = await mainState(), beforeEntryStorage = await mainStorage();
  const beforeEntrySaved = JSON.parse(beforeEntryStorage['relay-chronicles.save.v1']).state;
  assert.ok(beforeEntryState.playedSeconds > beforeEntrySaved.playedSeconds, 'Real exploration leaves unsaved ME1 play time before entering Chronicles');
  const mainExport = await exportDownload(action('export'), 'universe-me1-witness.json');
  assert.deepEqual(JSON.parse(mainExport).state, beforeEntryState);
  await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  const baselineState = await mainState(), baselineStorage = await mainStorage();
  const baselineSaved = JSON.parse(baselineStorage['relay-chronicles.save.v1']).state;
  assert.equal(baselineState.credits, 150); assert.equal(baselineState.inventory.equipped.shepard.weaponMod, 'heat-sink-i');
  assert.deepEqual(baselineState, beforeEntryState, 'The entry checkpoint preserves the exact live ME1 state');
  assert.deepEqual(baselineSaved, beforeEntryState, 'Entering Chronicles checkpoints the latest ME1 play time and gameplay state');
  for (const key of Object.keys(beforeEntryStorage).filter(key => key !== 'relay-chronicles.save.v1')) assert.equal(baselineStorage[key], beforeEntryStorage[key], 'The entry checkpoint leaves manual slots byte-identical');
  report.entryCheckpoint = {
    previouslySavedPlayedSeconds: beforeEntrySaved.playedSeconds,
    livePlayedSeconds: beforeEntryState.playedSeconds,
    checkpointPlayedSeconds: baselineSaved.playedSeconds,
  };
  const assertIsolated = async () => {
    const stored = await mainStorage();
    assert.deepEqual(JSON.parse(stored['relay-chronicles.save.v1']).state, baselineSaved, 'Chronicles never change ME1 gameplay state or played time');
    for (const key of Object.keys(baselineStorage).filter(key => key !== 'relay-chronicles.save.v1')) assert.equal(stored[key], baselineStorage[key], 'Manual ME1 slots remain byte-identical');
    assert.deepEqual(stored, baselineStorage, 'The entry checkpoint and manual slots remain byte-identical throughout Chronicle activity and reload');
    const live = await mainState(); if (live) assert.deepEqual(live, baselineState);
    assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getBattle()), null, 'The ME1 battle remains independent');
  };
  record('A real ME1 purchase, equipped module and manual slot form an independent campaign witness; entry checkpoints subsequent unsaved exploration time without changing gameplay');

  mark('context-and-documentary-boundaries');
  const options = await page.locator('#chronicle-media option').evaluateAll(items => items.map(item => item.value).filter(Boolean));
  assert.deepEqual([...options].sort(), catalogues.map(catalogue => catalogue.id).sort());
  assert.equal(await page.locator('#chronicle-year,input[name="year"]').count(), 0);
  report.boundaries = await contextBoundaries();
  await reference('ME1', 'me1', 'Jack'); assert.equal(await page.locator('[data-record-id="ME2-CHR-JACK"]').count(), 0);
  await reference('ME2', 'me2', 'Jack'); await page.locator('[data-record-id="ME2-CHR-JACK"]').waitFor();
  await action('universe-record', 'ME2-CHR-JACK').click();
  assert.match(await page.locator('[data-universe-record="ME2-CHR-JACK"]').innerText(), /Référence|Établi/i);
  await reference('GAL', 'gal', 'Graal'); assert.equal(await page.locator('[data-record-id="ME3-WPN-GRAAL"]').count(), 0);
  await reference('MEA', 'mea', 'Eos'); await page.locator('[data-record-id="MEA-WRL-EOS"]').waitFor();
  await reference('ME1', 'me1', 'Eos'); assert.equal(await page.locator('[data-record-id="MEA-WRL-EOS"]').count(), 0);
  await reference('HOM', 'hom-2-tali', 'Garrus'); assert.equal(await page.locator('[data-record-id="HOM-ACT-GARRUS"]').count(), 0);
  await reference('HOM', 'hom-4-liara', 'Liara'); await page.locator('[data-record-id="HOM-ACT-LIARA"]').waitFor();
  await reference('FOU', 'fou-5', 'Miranda'); await page.locator('[data-record-id="FOU-ACT-MIRANDA"]').waitFor();
  await reference('FOU', 'fou-2', 'Miranda'); assert.equal(await page.locator('[data-record-id="FOU-ACT-MIRANDA"]').count(), 0);
  for (const mediaId of ['LIB', 'ME4', 'CUT', 'BLA']) {
    await selectContext(mediaId); assert.equal(await page.locator('#chronicle-period').isDisabled(), true);
    assert.equal(await page.locator('#chronicle-period option').count(), 1);
    await action('universe-tab', 'session').click(); assert.equal(await action('chronicle-start').count(), 0);
    assert.ok((await page.locator('.universe-lock').innerText()).length > 0);
  }
  await screenshot('documentary-lock'); await assertIsolated();
  record('All source catalogues are represented; references obey work, galaxy and attested segment, while speculative works, fiction and collections grant no historical campaign');

  mark('scene-and-equipment-permissions');
  await prepare('ME2', 'me2', 'me2-freedoms-progress');
  assert.equal(await action('chronicle-party', 'ME2-CHR-JACK').count(), 0);
  await blockedGearOption('ME2-CHR-SHEPARD', 'weapon', 'ME2-WPN-PREDATOR', 'A workshop weapon is not attributed to the historical scene');
  await prepare('ME2', 'me2', 'me2-equipment-workshop');
  assert.match(await page.locator('.universe-session-note').innerText(), /acquisition.*non simulée/);
  assert.equal(await action('chronicle-party', 'ME2-CHR-JACK').count(), 1, 'Jack is selectable in an explicitly free workshop, never in Freedom’s Progress');
  for (const id of ['ME2-CHR-MIRANDA', 'ME2-CHR-JACOB']) await action('chronicle-party', id).click();
  await action('chronicle-party', 'ME2-CHR-SAMARA').click();
  const withSamara = await chronicle();
  await action('chronicle-party', 'ME2-CHR-MORINTH').click();
  assert.deepEqual(await chronicle(), withSamara, 'Samara and Morinth cannot be selected together');
  assert.equal(await page.locator('.universe-feedback.error').count(), 1);
  await action('chronicle-party', 'ME2-CHR-SAMARA').click(); await action('chronicle-party', 'ME2-CHR-JACK').click();
  assert.ok((await chronicle()).party.includes('ME2-CHR-JACK'));
  const jack = await page.evaluate(async () => (await import('/src/chronicles.js')).buildChronicleActor(window.__RELAY_TEST__.getChronicle(), 'ME2-CHR-JACK'));
  assert.deepEqual(jack.powers, ['pull', 'shockwave'], 'Jack uses her implemented power bindings without an invented ME1 ability');
  assert.equal(jack.powers.includes('lift'), false, 'Pull is not an alias for ME1 Lift');
  await action('chronicle-party', 'ME2-CHR-JACK').click();
  for (const id of ['ME2-CHR-MIRANDA', 'ME2-CHR-JACOB']) await action('chronicle-party', id).click();
  await blockedGearOption('ME2-CHR-MIRANDA', 'armor', 'ME2-EQP-N7');
  await blockedGearOption('ME2-CHR-MIRANDA', 'weapon', 'ME2-WPN-AVENGER');
  await gear('ME2-CHR-SHEPARD', 'weapon').selectOption('ME2-WPN-AVENGER');
  await gear('ME2-CHR-SHEPARD', 'armor').selectOption('ME2-EQP-N7');
  const avenger = await page.evaluate(async () => (await import('/src/chronicles.js')).buildChronicleActor(window.__RELAY_TEST__.getChronicle(), 'ME2-CHR-SHEPARD'));
  assert.equal(avenger.weaponSystem, 'thermal-clip'); assert.equal(avenger.magazineCapacity, 18); assert.equal(avenger.reserveAmmo, 72);
  await gear('ME2-CHR-SHEPARD', 'weapon').selectOption('ME2-WPN-PREDATOR');
  const preparedME2 = await chronicle();
  const strictExport = await exportDownload(action('chronicle-export'), 'universe-prepared-me2.json');
  await importChronicle(mainExport, false); assert.deepEqual(await chronicle(), preparedME2);
  for (const change of [
    packet => { packet.session.context.year = 2185; },
    packet => { packet.session.context.galaxy = 'andromeda'; },
    packet => { packet.session.party = ['ME3-CHR-JAMES']; packet.session.loadouts = {}; },
    packet => { packet.session.party = ['ME2-CHR-SAMARA', 'ME2-CHR-MORINTH']; packet.session.loadouts = {}; },
    packet => { packet.session.loadouts['ME2-CHR-SHEPARD'].weapon = 'ME3-WPN-GRAAL'; },
    packet => { packet.session.stats = { hp: 1_000_000_000, attack: 1_000_000_000 }; },
  ]) {
    const packet = JSON.parse(strictExport); change(packet); const beforeStorage = await chronicleStorage();
    await importChronicle(JSON.stringify(packet), false);
    assert.deepEqual(await chronicle(), preparedME2); assert.deepEqual(await chronicleStorage(), beforeStorage);
  }
  await importChronicle(strictExport); assert.deepEqual(await chronicle(), preparedME2); await assertIsolated();
  await screenshot('me2-preparation');
  record('Fixed partial profiles and scene rosters constrain actors and gear; malformed dates, galaxies, foreign actors/models and invented statistics fail strict Chronicle imports without mutation');

  mark('real-ammunition-and-reload');
  await action('chronicle-battle').click();
  assert.equal(await page.locator('#chronicle-media').isDisabled(), true); assert.equal(await page.locator('#chronicle-period').isDisabled(), true);
  await waitReady('ME2-CHR-SHEPARD', 'burst');
  let combat = await chronicleBattle(), shooter = combat.actors.find(actor => actor.id === 'ME2-CHR-SHEPARD');
  const beforeShot = { ammo: shooter.ammo, reserve: shooter.reserveAmmo, heat: shooter.heat, capacity: shooter.magazineCapacity };
  await action('chronicle-actor', shooter.id).click(); await action('chronicle-action', 'burst').click();
  await action('chronicle-target', combat.actors.find(actor => actor.team === 'enemy' && actor.hp > 0).id).click();
  shooter = (await chronicleBattle()).actors.find(actor => actor.id === 'ME2-CHR-SHEPARD');
  assert.equal(shooter.ammo, beforeShot.ammo - 3); assert.equal(shooter.reserveAmmo, beforeShot.reserve); assert.equal(shooter.heat, 0);
  const afterShot = { ammo: shooter.ammo, reserve: shooter.reserveAmmo, heat: shooter.heat };
  await waitReady(shooter.id, 'reload'); await action('chronicle-actor', shooter.id).click();
  assert.match(await page.locator('[data-chronicle-ammo]').innerText(), /5\/8.*réserve\s*32/);
  await action('chronicle-action', 'reload').click();
  shooter = (await chronicleBattle()).actors.find(actor => actor.id === 'ME2-CHR-SHEPARD');
  assert.equal(shooter.ammo, beforeShot.capacity); assert.equal(shooter.reserveAmmo, beforeShot.reserve - 3); assert.equal(shooter.atb, 0); assert.equal(shooter.heat, 0);
  await page.evaluate(async () => {
    const { getActions } = await import('/src/combat.js'), qa = window.__RELAY_TEST__, battle = qa.getChronicleBattle();
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.id !== 'ME2-CHR-SHEPARD')) {
      if (getActions(battle, actor.id).some(action => action.id === 'cover' && action.available)) qa.chronicleAction({ actorId: actor.id, actionId: 'cover', targetId: actor.id });
    }
  });
  await action('chronicle-actor', shooter.id).click();
  assert.match(await page.locator('[data-chronicle-ammo]').innerText(), /8\/8.*réserve\s*29/);
  report.ammunition = { beforeShot, afterShot, afterReload: { ammo: shooter.ammo, reserve: shooter.reserveAmmo, heat: shooter.heat } };
  await screenshot('thermal-clips');
  report.tacticalVictories = [await winChronicle()];
  const savedME2 = await chronicle(); await action('chronicle-save').click();
  const completedExport = await exportDownload(action('chronicle-export'), 'universe-completed-me2.json');
  await assertIsolated();
  record('Actual UI burst and reload consume and transfer finite thermal clips, use an ATB order, retain zero heat and finish a legitimate prototype victory');

  mark('separate-chronicle-saves');
  await prepare('MEA', 'mea', 'mea-equipment-workshop');
  await blockedGearOption('MEA-CHR-CORA', 'armor', 'MEA-EQP-PATHFINDER');
  await blockedGearOption('MEA-CHR-RYDER', 'weapon', 'MEA-WPN-EQUALIZER');
  await gear('MEA-CHR-RYDER', 'armor').selectOption('MEA-EQP-PATHFINDER');
  await gear('MEA-CHR-RYDER', 'weapon').selectOption('MEA-WPN-AVENGER');
  await action('chronicle-save').click(); const savedMEA = await chronicle();
  const independentKeys = Object.keys(await chronicleStorage());
  assert.ok(independentKeys.includes('relay-chronicles.chronicle.ME2.me2.v1'));
  assert.ok(independentKeys.includes('relay-chronicles.chronicle.MEA.mea.v1'));
  await prepare('ME2', 'me2', 'me2-equipment-workshop', true); assert.deepEqual(await chronicle(), savedME2);
  await prepare('MEA', 'mea', 'mea-equipment-workshop', true); assert.deepEqual(await chronicle(), savedMEA);
  await page.reload({ waitUntil: 'networkidle' }); await action('chronicles').click(); await page.locator('.universe-screen').waitFor();
  await prepare('ME2', 'me2', 'me2-equipment-workshop', true); assert.deepEqual(await chronicle(), savedME2);
  await assertIsolated();
  await page.locator('#save-import').setInputFiles({ name: 'foreign-chronicle.json', mimeType: 'application/json', buffer: Buffer.from(completedExport) });
  await page.waitForFunction(() => document.querySelector('#save-import').value === '', null, { polling: 100, timeout: 60000 });
  assert.deepEqual(await chronicle(), savedME2); await assertIsolated();
  await importChronicle(completedExport); assert.deepEqual(await chronicle(), savedME2);
  record('Per-work Chronicle saves survive real reload and independent context changes; actual ME1/Chronicle exports are rejected by the other importer and the ME1 gameplay state/manual slot stay unchanged', { storageKeys: independentKeys });

  mark('remaining-tactical-prototypes');
  await prepare('ME3', 'me3', 'me3-equipment-workshop');
  for (const id of ['ME3-CHR-LIARA', 'ME3-CHR-JAMES']) await action('chronicle-party', id).click();
  await action('chronicle-party', 'ME3-CHR-ASHLEY').click();
  const withAshley = await chronicle(); await action('chronicle-party', 'ME3-CHR-KAIDAN').click();
  assert.deepEqual(await chronicle(), withAshley, 'Ashley and Kaidan remain mutually exclusive');
  assert.equal(await page.locator('.universe-feedback.error').count(), 1);
  await action('chronicle-party', 'ME3-CHR-ASHLEY').click();
  for (const id of ['ME3-CHR-LIARA', 'ME3-CHR-JAMES']) await action('chronicle-party', id).click();
  await blockedGearOption('ME3-CHR-SHEPARD', 'weapon', 'ME3-WPN-GRAAL');
  await blockedGearOption('ME3-CHR-LIARA', 'armor', 'ME3-EQP-N7');
  await gear('ME3-CHR-SHEPARD', 'weapon').selectOption('ME3-WPN-AVENGER');
  await action('chronicle-battle').click(); report.tacticalVictories.push(await winChronicle());
  const exposed = await page.evaluate(async () => (await import('/src/universe-actors.js')).CHRONICLE_SCENARIOS
    .map(scenario => [scenario.context.mediaId, scenario.context.periodId, scenario.id]));
  const alreadyWon = new Set(report.tacticalVictories.map(result => result.scenarioId));
  const remaining = exposed.filter(([, , scenarioId]) => !alreadyWon.has(scenarioId));
  for (const [mediaId, periodId, scenarioId] of remaining) {
    mark(`prototype:${scenarioId}`); await prepare(mediaId, periodId, scenarioId, scenarioId === 'mea-equipment-workshop');
    if (scenarioId === 'gal-jacob') assert.equal(await gear('GAL-CHR-JACOB', 'weapon').locator('option[value="ME3-WPN-GRAAL"]').count(), 0);
    await action('chronicle-battle').click(); report.tacticalVictories.push(await winChronicle());
    await assertIsolated();
  }
  const exposedScenarios = exposed.map(([, , scenarioId]) => scenarioId);
  assert.deepEqual(report.tacticalVictories.map(result => result.scenarioId).sort(), exposedScenarios.sort());
  await screenshot('completed-workshop');
  record('Every exposed bounded tactical prototype reaches victory through legitimate orders, with independent scene rosters, partial powers and no ME1 progress or reward transfer', { scenarios: report.tacticalVictories.map(result => result.scenarioId) });

  await action('chronicle-back').click(); await page.getByRole('button', { name: /Reprendre/ }).click(); await idle('normandy');
  const resumed = await mainState();
  for (const key of ['name', 'xp', 'credits', 'inventory', 'party', 'recruited', 'lost', 'completed', 'cleared', 'choices', 'flags', 'story', 'operations']) assert.deepEqual(resumed[key], baselineState[key]);
  await screenshot('me1-resumed');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(await page.evaluate(() => window.__RELAY_TEST__.getWorld().assetErrors || []), []);
  report.passed = true; mark('complete'); console.log(JSON.stringify({ passed: true, checks: report.checks.length, victories: report.tacticalVictories.length }));
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
  await browser?.close(); await writeFile(new URL('universe-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}

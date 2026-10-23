import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = {
  passed: false, at: new Date().toISOString(), checks: [], errors: [], failedRequests: [],
};
let browser, page;
const identity = {
  name: 'Alex Shepard', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero',
};

async function idle(zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState()?.zone === expected && !qa.getUI().busy;
  }, zone);
}

const slot = id => page.locator(`[data-save-slot="${id}"]`);
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`);

async function storageSnapshot() {
  return page.evaluate(async () => {
    const { SAVE_KEY } = await import('/src/state.js');
    const { MANUAL_SAVE_KEY_PREFIX } = await import('/src/save-slots.js');
    return {
      automatic: localStorage.getItem(SAVE_KEY),
      first: localStorage.getItem(`${MANUAL_SAVE_KEY_PREFIX}1`),
      second: localStorage.getItem(`${MANUAL_SAVE_KEY_PREFIX}2`),
    };
  });
}

async function readSlot(id) {
  return page.evaluate(async selected => {
    const { readManualSave } = await import('/src/save-slots.js');
    const result = readManualSave(localStorage, selected);
    if (!result.ok) throw new Error(`Manual slot ${selected}: ${result.code} ${result.reason}`);
    return result;
  }, id);
}

async function clickPreservingAutosave(button) {
  // Observe this click's synchronous transaction; periodic autosaves can run
  // between separate Playwright commands and are independent of manual writes.
  await button.evaluate(async element => {
    const { SAVE_KEY } = await import('/src/state.js');
    const observation = window.__MANUAL_AUTOSAVE_OBSERVATION__ = { complete: false };
    element.addEventListener('click', () => {
      observation.before = localStorage.getItem(SAVE_KEY);
    }, { once: true });
    // Registered after the application's document click handler: this listener
    // reads after its write, rather than relying on microtask timing in event bubbling.
    document.addEventListener('click', () => {
      observation.after = localStorage.getItem(SAVE_KEY);
      observation.complete = true;
    }, { once: true });
  });
  await button.click();
  const observation = await page.evaluate(() => window.__MANUAL_AUTOSAVE_OBSERVATION__);
  assert.equal(observation.complete, true, 'The user click completed');
  assert.equal(observation.after, observation.before, 'Manual operation preserves the automatic save');
}

async function assertFemaleIdentity(zone) {
  await idle(zone);
  await page.waitForFunction(() => window.__RELAY_TEST__.getWorld().atlases.npc);
  const restored = await page.evaluate(() => {
    const qa = window.__RELAY_TEST__, state = qa.getState();
    const actor = qa.getWorld().actors.find(entry => entry.id === 'shepard');
    return {
      name: state.name, appearance: state.appearance, origin: state.origin,
      psychologicalProfile: state.psychologicalProfile, zone: state.zone,
      actorId: actor?.id, sprite: actor?.key, texture: actor?.body.material.map?.image?.src,
    };
  });
  for (const [key, value] of Object.entries(identity)) assert.equal(restored[key], value, key);
  assert.equal(restored.zone, zone);
  assert.equal(restored.actorId, 'shepard');
  assert.equal(restored.sprite, 'femshep');
  assert.match(restored.texture || '', /npc-atlas\.png/);
}

async function beginCampaign(commander) {
  await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
  await page.locator('#commander-name').fill(commander.name);
  await page.locator('#new-appearance').selectOption(commander.appearance);
  await page.locator('#new-origin').selectOption(commander.origin);
  await page.locator('#new-profile').selectOption(commander.psychologicalProfile);
  await page.locator('#new-difficulty').selectOption('story');
  await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await idle('normandy');
}

async function openSlotsFromGame() {
  await page.keyboard.press('Escape');
  await action('manual-saves').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === 'saves');
}

async function returnToTitleFromSlots() {
  await action('manual-back').click();
  await action('quit').click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getUI().screen === 'title');
}

async function screenshot(name) {
  await page.screenshot({ path: fileURLToPath(new URL(`save-slots-${name}.png`, out)) });
}

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
  await beginCampaign(identity);
  await assertFemaleIdentity('normandy');
  await page.keyboard.press('Escape');
  await action('dossier').click();
  assert.equal(await page.locator('.commander-name').innerText(), identity.name);
  assert.match(await page.locator('.commander-record').innerText(), /Colon/);
  assert.match(await page.locator('.commander-record').innerText(), /Héros de guerre/);
  await action('dossier-back').click();
  await action('manual-saves').click();
  assert.equal(await page.locator('[data-save-slot]').count(), 6);
  assert.equal(await page.locator('[data-save-slot][data-status="empty"]').count(), 6);
  assert.ok((await storageSnapshot()).automatic, 'The campaign already has an automatic save');

  await page.locator('#manual-save-name-1').fill('Avant le briefing');
  await clickPreservingAutosave(action('manual-save', '1'));
  await page.waitForFunction(() => document.querySelector('[data-save-slot="1"]')?.dataset.status === 'saved');
  const initial = await readSlot('1');
  assert.equal(initial.metadata.name, 'Avant le briefing');
  assert.equal(initial.state.zone, 'normandy');
  for (const [key, value] of Object.entries(identity)) assert.equal(initial.state[key], value);
  assert.equal(await slot('1').locator('.save-slot-name').innerText(), 'Avant le briefing');
  assert.match(await slot('1').locator('.save-slot-zone').innerText(), /Normandy/i);
  assert.ok((await slot('1').locator('.save-slot-commander').innerText()).includes(identity.name));
  assert.ok((await slot('1').locator('.save-slot-class').innerText()).trim());
  const displayedDate = await slot('1').locator('time').getAttribute('datetime');
  assert.equal(displayedDate, initial.metadata.savedAt);
  assert.ok(Number.isFinite(Date.parse(displayedDate)), 'The slot preview has a valid timestamp');
  await page.locator('#manual-save-name-2').fill('Secours Normandy');
  await clickPreservingAutosave(action('manual-save', '2'));
  const initialStorage = await storageSnapshot();
  await screenshot('named-slots');
  report.checks.push('Named slots show commander, date, zone and class without replacing autosave');

  await action('manual-back').click();
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  const start = await page.evaluate(() => window.__RELAY_TEST__.getWorld().getPosition());
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(position => {
    const next = window.__RELAY_TEST__.getWorld().getPosition();
    return Math.hypot(position.x - next.x, position.z - next.z) > .5;
  }, start);
  await page.keyboard.up('ArrowUp');
  await page.evaluate(() => window.__RELAY_TEST__.interact('normandy:briefing'));
  await page.getByRole('button', { name: /Mission comprise/ }).click();
  await page.getByRole('button', { name: /Préparer le déploiement/ }).click();
  await idle('eden-prime');
  await openSlotsFromGame();
  await page.locator('#manual-save-name-1').fill('Eden Prime — arrivée');
  await clickPreservingAutosave(action('manual-save', '1'));
  assert.equal(await page.locator('[data-manual-confirm="overwrite"]').count(), 1);
  assert.equal((await storageSnapshot()).first, initialStorage.first, 'Opening confirmation does not overwrite');
  await screenshot('overwrite-confirmation');
  await clickPreservingAutosave(action('manual-cancel'));
  assert.equal((await storageSnapshot()).first, initialStorage.first, 'Cancelling preserves the old slot');
  assert.equal((await readSlot('1')).state.zone, 'normandy');
  report.checks.push('Real movement, briefing and travel change the campaign; overwrite cancellation preserves the old slot');

  await page.locator('#manual-save-name-1').fill('Eden Prime — arrivée');
  await clickPreservingAutosave(action('manual-save', '1'));
  await clickPreservingAutosave(action('manual-confirm'));
  const replaced = await readSlot('1');
  assert.equal(replaced.state.zone, 'eden-prime');
  assert.equal(replaced.metadata.name, 'Eden Prime — arrivée');
  const replacedStorage = await storageSnapshot();
  assert.notEqual(replacedStorage.first, initialStorage.first);
  assert.equal(replacedStorage.second, initialStorage.second);
  report.checks.push('Confirmed overwrite updates only the chosen slot and preserves autosave');

  await returnToTitleFromSlots();
  await beginCampaign({ name: 'Sam Shepard', appearance: 'male', origin: 'earthborn', psychologicalProfile: 'ruthless' });
  await page.keyboard.press('Escape');
  await action('quit').click();
  await action('manual-saves').click();
  assert.equal(await action('manual-save', '1').count(), 0, 'The title does not save an inactive campaign');
  assert.equal((await storageSnapshot()).first, replacedStorage.first, 'A new campaign preserves existing manual slots');
  await action('manual-load', '1').click();
  await assertFemaleIdentity('eden-prime');
  await screenshot('restored-female');
  report.checks.push('Loading from the title restores female identity, origin, profile, zone and sprite after a male campaign');

  await page.evaluate(() => window.__RELAY_TEST__.startBattle('eden-prime:encounter-1'));
  await page.waitForFunction(() => window.__RELAY_TEST__.getBattle() && window.__RELAY_TEST__.getWorld().battleActors.has('shepard'));
  await page.keyboard.press('Escape');
  assert.equal(await action('manual-saves').isDisabled(), true, 'Manual slots are disabled in combat');
  assert.equal(await action('save').isDisabled(), true, 'Autosave button is disabled in combat');
  assert.equal(await action('export').isDisabled(), true, 'Export is disabled in combat');
  assert.equal((await storageSnapshot()).first, replacedStorage.first);
  await screenshot('combat-disabled');
  report.checks.push('Combat disables manual save access, autosave and export');

  await action('quit').click();
  await action('manual-saves').click();
  const beforeDelete = await storageSnapshot();
  await action('manual-delete', '1').click();
  assert.equal(await page.locator('[data-manual-confirm="delete"]').count(), 1);
  assert.equal((await storageSnapshot()).first, beforeDelete.first, 'Opening delete confirmation preserves the slot');
  await action('manual-cancel').click();
  assert.deepEqual(await storageSnapshot(), beforeDelete, 'Cancelling deletion preserves every save');
  await action('manual-delete', '1').click();
  await clickPreservingAutosave(action('manual-confirm'));
  const deleted = await storageSnapshot();
  assert.equal(deleted.first, null);
  assert.equal(deleted.second, beforeDelete.second);
  assert.equal(deleted.automatic, beforeDelete.automatic);
  assert.equal(await slot('1').getAttribute('data-status'), 'empty');
  await screenshot('deleted-slot');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: /Reprendre/ }).count(), 1);
  await action('manual-saves').click();
  assert.equal(await slot('1').getAttribute('data-status'), 'empty');
  assert.equal(await slot('2').getAttribute('data-status'), 'saved');
  assert.deepEqual(await storageSnapshot(), deleted, 'Deletion persists across browser reload without touching other saves');
  report.checks.push('Delete requires confirmation, cancellation preserves all data, and confirmed deletion preserves autosave and another slot after reload');

  assert.deepEqual(report.errors, [], 'No uncaught browser errors');
  assert.deepEqual(report.failedRequests, [], 'No failed requests or HTTP errors');
  report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  if (page) await screenshot('failure').catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await writeFile(new URL('save-slots-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}

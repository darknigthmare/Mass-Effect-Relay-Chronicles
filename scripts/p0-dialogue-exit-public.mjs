import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { newGame, winEncounter, zoneEncounters, completeZone, recruit, encodeSave, decodeSave, canTravelCampaign } from '../src/state.js';
import { recordVisit } from '../src/story.js';
import { FEROS_COLONIST_TARGETS, listAdvanceFerosPOIs, transitionAdvanceFeros } from '../src/advance-feros.js';

const url = new URL(process.env.P0_DIALOGUE_URL || 'http://127.0.0.1:4285/');
const dist = resolve(process.env.P0_DIALOGUE_DIST || 'dist');
const output = process.env.P0_DIALOGUE_OUTPUT || 'test-results/p0-dialogue-exit';
const sha256 = content => createHash('sha256').update(content).digest('hex');
const action = (page, id) => page.locator(`[data-do="${id}"]`).first();
const exitCheck = 'advance:feros:freighter';
const report = {
  passed: false,
  generatedAt: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  url: url.href,
  client: 'Vite production build in Chromium, with normal title import, exploration, controls and save export.',
  fixtures: {},
  compiledResponses: [],
  checks: [],
  screenshots: [],
  errors: [],
};
const check = result => {
  report.checks.push(result);
  console.log(result);
};

function enter(state, zone) {
  state.zone = zone;
  assert.equal(recordVisit(state, zone), true);
}

function act(state, key, choice) {
  const point = listAdvanceFerosPOIs(state).find(poi => poi.id === `advance:feros:${key}`);
  assert.ok(point, key);
  state.position = { x: point.x, z: point.z };
  const result = transitionAdvanceFeros(state, point.id, choice);
  assert.equal(result.ok, true, result.reason);
  state.advanceFeros = result.progress;
}

function fixture(eligible) {
  const state = newGame({ name: 'QA Dialogues', difficulty: 'story' });
  state.flags.briefed = true;
  Object.assign(state.settings, { sound: false, reducedMotion: true });
  enter(state, 'eden-prime');
  for (const id of zoneEncounters('eden-prime')) assert.equal(winEncounter(state, id), true);
  assert.equal(completeZone(state, 'eden-prime'), true);
  enter(state, 'citadel');
  assert.equal(recruit(state, 'tali'), true);
  assert.equal(completeZone(state, 'citadel'), true);
  enter(state, 'feros');
  assert.equal(winEncounter(state, 'feros:encounter-1'), true);
  act(state, 'defense', 'coordinate');
  act(state, 'lizbeth', 'listen');
  assert.equal(winEncounter(state, 'feros:encounter-2'), true);
  act(state, 'investigation', 'research');
  for (const index of [1, 3, 4]) act(state, 'pressure', `valve-${index}`);
  act(state, 'pressure', 'release');
  act(state, 'jeong', 'confront');
  act(state, 'juliana', 'prepare');
  const targets = eligible ? FEROS_COLONIST_TARGETS : FEROS_COLONIST_TARGETS.slice(0, -1);
  for (const target of targets) act(state, `colonist-${target.id}`, 'melee');
  const { x, z } = listAdvanceFerosPOIs(state).find(poi => poi.id === exitCheck);
  state.position = { x, z };
  return state;
}

async function field(page) {
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await page.locator('#transition.active,.dialogue,.screen').first().waitFor({ state: 'hidden' });
}

async function importFixture(page, name, value) {
  if (!await action(page, 'import').isVisible()) {
    await page.keyboard.press('Escape');
    await action(page, 'quit').click();
  }
  const bytes = Buffer.from(encodeSave(value));
  const expected = decodeSave(bytes.toString());
  assert.ok(expected);
  assert.equal(canTravelCampaign(expected, expected.zone).ok, true);
  report.fixtures[name] = { sha256: sha256(bytes), resolved: Object.values(value.advanceFeros.colonists).filter(Boolean).length };
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action(page, 'import').click()]);
  await chooser.setFiles({ name: `${name}.json`, mimeType: 'application/json', buffer: bytes });
  await field(page);
  return expected;
}

async function openCargo(page) {
  await page.locator('#hud [data-do="interact"]').filter({ hasText: 'commandes du cargo' }).waitFor();
  await page.keyboard.press('KeyE');
  const dialogue = page.locator(`.dialogue[data-current-topic="${exitCheck}"]`);
  await dialogue.waitFor();
  return dialogue;
}

async function exportState(page) {
  await page.keyboard.press('Escape');
  await page.locator('.pause-screen').waitFor();
  const [download] = await Promise.all([page.waitForEvent('download'), action(page, 'export').click()]);
  assert.equal(await download.failure(), null);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  await action(page, 'close').click();
  await field(page);
  assert.ok(state);
  return state;
}

async function capture(page, name) {
  const path = resolve(output, `${name}.png`);
  const bytes = await page.screenshot({ path, animations: 'disabled', timeout: 8000 });
  report.screenshots.push({ filename: `${name}.png`, sha256: sha256(bytes) });
}

await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--renderer-process-limit=1'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 740 } });
  page.setDefaultTimeout(40000);
  page.on('pageerror', error => report.errors.push(error.message));
  const responses = new Map();
  page.on('response', response => {
    const responseUrl = new URL(response.url());
    if (responseUrl.origin !== url.origin) return;
    const path = responseUrl.pathname.replace(/^\//, '');
    if (response.status() === 200 && (!path || /^assets\/[^/]+\.js$/.test(path))) {
      const filename = path || 'index.html';
      if (!responses.has(filename)) {
        responses.set(filename, response.body().then(async bytes => {
          const sha = sha256(bytes);
          assert.equal(sha, sha256(await readFile(resolve(dist, filename))), filename);
          report.compiledResponses.push({ path: filename, sha256: sha });
        }).catch(error => report.errors.push(error.message)));
      }
    }
    if (response.status() >= 400 && path !== 'favicon.ico') report.errors.push(`${response.status()} ${path}`);
  });

  await page.goto(url.href);
  await action(page, 'title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await action(page, 'close').click();
  const initial = await importFixture(page, 'cargo-pending', fixture(false));
  assert.equal(await page.evaluate(() => Object.hasOwn(globalThis, '__RELAY_TEST__')), false);
  let cargo = await openCargo(page);
  const entry = cargo.locator('[data-reply-id="open"]');
  assert.equal(await entry.isDisabled(), true);
  assert.match(await entry.innerText(), /1 cible\(s\) encore sous influence/);
  await capture(page, 'cargo-cancel');
  await cargo.locator('[data-conversation-end]').click();
  await field(page);
  check('An all-disabled choice set has a visible exit, and the unmet requirement remains readable.');

  cargo = await openCargo(page);
  await page.keyboard.press('Escape');
  await field(page);
  const cancelled = await exportState(page);
  assert.deepEqual(cancelled.advanceFeros, initial.advanceFeros);
  assert.deepEqual(cancelled.inventory, initial.inventory);
  assert.equal(cancelled.xp, initial.xp);
  assert.equal(cancelled.credits, initial.credits);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action(page, 'continue').click();
  await field(page);
  cargo = await openCargo(page);
  assert.equal(await cargo.locator('[data-reply-id="open"]').isDisabled(), true);
  await cargo.locator('[data-conversation-end]').click();
  await field(page);
  check('Escape and the visible exit leave progress, resources and the resumed eligibility unchanged.');

  const eligible = await importFixture(page, 'cargo-eligible', fixture(true));
  cargo = await openCargo(page);
  assert.equal(await cargo.locator('[data-reply-id="open"]').isEnabled(), true);
  assert.equal(await cargo.locator('[data-conversation-end]').count(), 0);
  await cargo.locator('[data-reply-id="open"]').click();
  await cargo.getByRole('button', { name: 'Retour sur le terrain.' }).click();
  await field(page);
  const advanced = await exportState(page);
  assert.deepEqual(advanced.advanceFeros, { ...eligible.advanceFeros, freighterOpened: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action(page, 'continue').click();
  await field(page);
  assert.equal((await exportState(page)).advanceFeros.freighterOpened, true);
  check('The enabled branch commits only the cargo action, reaches its field exit and resumes with this decision saved.');

  assert.ok(responses.has('index.html'));
  assert.ok([...responses.keys()].some(path => /^assets\/index-.+\.js$/.test(path)));
  await Promise.all(responses.values());
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  const [page] = browser.contexts()[0]?.pages() ?? [];
  if (page) {
    report.errors.push(await page.locator('#app').innerText({ timeout: 2000 }).then(text => text.slice(-900)).catch(() => ''));
    await capture(page, 'failure').catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, report: resolve(output, 'report.json') }));
}

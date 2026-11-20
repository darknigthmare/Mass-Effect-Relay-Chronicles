import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { applyResolveCitadel, confirmCampaignBriefing, decodeSave, encodeSave, newGame, travelCampaign, winEncounter } from '../src/state.js';
import { EDEN_SUPPORT, EDEN_CLUE } from '../src/eden-prologue.js';
import { levelMapProjection } from '../src/level-map-render.js';
import { WORLD_ZONES } from '../src/world-data.js';
import { CREW } from '../src/game-data.js';

const target = new URL(process.env.GAME_URL || 'http://127.0.0.1:4287/');
const dist = process.env.P0_BUILD_DIR || 'dist';
const out = process.env.P0_PROLOGUE_OUTPUT || 'test-results/p0-eden-prologue';
const fieldOnly = process.env.P0_PROLOGUE_PHASE === 'field';
const supportOnly = process.env.P0_PROLOGUE_PHASE === 'support';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const eden = WORLD_ZONES['eden-prime'];
const first = 'eden-prime:encounter-1';
const search = 'QST-recherche-de-la-balise';
const viewport = { width: 1100, height: 780 };
const report = { passed: false, generatedAt: new Date().toISOString(), url: target.href, checks: [], captures: [], servedFiles: [], relocations: [], errors: [] };
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--renderer-process-limit=1'],
});
const page = await browser.newPage({ viewport, acceptDownloads: true });
page.setDefaultTimeout(35_000);
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const dialogue = id => page.locator(`.dialogue[data-conversation-id="${id}"]`);
const reply = (conversation, id) => dialogue(conversation).locator(`[data-reply-id="${id}"]`);
const hud = page.locator('#hud:not(.hidden) .location h2');
const party = () => page.locator('#hud .explore-party strong,#hud .explore-party button > span').allTextContents();
const check = (id, name) => { report.checks.push({ id, name, passed: true }); console.log(name); };
async function field() {
  await hud.waitFor();
  await page.locator('#transition.active,#overlay .dialogue,#overlay .screen').waitFor({ state: 'hidden' });
}
async function exported() {
  await field();
  await page.keyboard.press('Escape');
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const state = decodeSave(await readFile(await download.path(), 'utf8'));
  assert.ok(state);
  await action('close').click();
  await field();
  return state;
}
async function relocate(state, point, stage) {
  if (!await action('import').isVisible()) {
    await page.keyboard.press('Escape');
    await action('quit').click();
  }
  const value = { ...state, position: point ? { x: point.x, z: point.z } : null };
  const bytes = Buffer.from(encodeSave(value));
  assert.deepEqual(decodeSave(bytes.toString()), value);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: `${stage}.json`, mimeType: 'application/json', buffer: bytes });
  await field();
  report.relocations.push({ stage, from: state.position, to: value.position, sha256: sha(bytes),
    changedFields: point ? ['position'] : [], nativePrerequisites: !point });
}
async function capture(name) {
  const path = resolve(out, `${name}.png`);
  const bytes = await page.screenshot({ path, animations: 'disabled' });
  report.captures.push({ path, sha256: sha(bytes), viewport });
}
async function openAndCloseJournal(id, status, track = false) {
  await page.keyboard.press('KeyJ');
  const item = page.locator(`[data-campaign-milestone="${id}"]`);
  assert.equal(await item.getAttribute('data-campaign-status'), status);
  if (track) await item.locator('[data-do="track-campaign"]').click();
  const text = await item.innerText();
  await action('close').click();
  await field();
  return text;
}
async function markerPosition(id) {
  await page.keyboard.press('KeyM');
  await action('map-filter', 'all').click();
  const marker = page.locator(`circle[data-map-position="${id}"]`);
  const projection = levelMapProjection(eden.bounds);
  const x = eden.bounds.minX + (Number(await marker.getAttribute('cx')) - projection.originX) / projection.scale;
  const z = eden.bounds.minZ + (Number(await marker.getAttribute('cy')) - projection.originZ) / projection.scale;
  assert.ok(Number.isFinite(x) && Number.isFinite(z), id);
  await action('close').click();
  await field();
  return { x, z };
}

const responses = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('response', response => {
  const url = new URL(response.url()), path = url.pathname.slice(1) || 'index.html';
  if (url.origin !== target.origin) return;
  if (response.status() >= 400 && path !== 'favicon.ico') report.errors.push(response.url());
  if (response.status() !== 200 || responses.has(path) || !/^(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(path)) return;
  responses.set(path, response.body().then(async bytes => {
    assert.equal(sha(bytes), sha(await readFile(resolve(dist, path))), path);
    report.servedFiles.push({ path, sha256: sha(bytes) });
  }).catch(error => report.errors.push(error.message)));
});

async function briefingAndDeployment() {
  await action('new').click();
  await page.locator('#new-difficulty').selectOption('story');
  await action('begin').click();
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await field();
  const startup = await exported();
  assert.deepEqual(startup.campaignProgress.prologue, { digClue: false });
  const briefing = WORLD_ZONES.normandy.pois.find(point => point.id === 'normandy:briefing');
  await relocate(startup, briefing, 'briefing');
  await page.keyboard.press('KeyE');
  await reply('campaign:briefing', 'practical').click();
  await reply('campaign:briefing', 'questions').click();
  await reply('campaign:briefing', 'ready').click();
  await reply('campaign:briefing', 'deploy').click();
  const access = page.locator('[data-destination="eden-prime"]');
  await access.waitFor();
  assert.equal(await access.getAttribute('data-access'), 'locked');
  assert.match(await access.innerText(), /Nihlus/);
  assert.equal(await action('travel', 'eden-prime').isDisabled(), true);
  await capture('briefing');
  await action('close').click();
  await field();

  await openAndCloseJournal('QST-briefing-normandy', 'active', true);
  await page.keyboard.press('KeyC');
  await action('conversation', 'nihlus').click();
  await reply('nihlus', 'resolve-report').click();
  assert.equal(await reply('resolve-citadel', 'evaluation').count(), 0);
  await reply('resolve-citadel', 'colony').click();
  await reply('resolve-result', 'leave').click();
  await field();
  await page.keyboard.press('KeyC');
  await action('conversation', 'nihlus').click();
  await reply('nihlus', 'resolve-report').click();
  await reply('resolve-citadel', 'evaluation').click();
  await reply('resolve-result', 'leave').click();
  await field();
  await openAndCloseJournal('QST-briefing-normandy', 'complete');
  const readyToDeploy = await exported();
  assert.equal(readyToDeploy.resolveCitadel.nihlus, 2);
  assert.equal(readyToDeploy.flags.spectre, undefined);
  check('QST-briefing-normandy', 'Anderson confirme le briefing, la carte attend le contact avec Nihlus et son évaluation se débloque dans l’ordre.');

  await page.keyboard.press('KeyG');
  assert.equal(await action('travel', 'eden-prime').isEnabled(), true);
  await action('travel', 'eden-prime').click();
  await field();
}

async function playLandingAndFirstBattle() {
  assert.equal(await hud.innerText(), 'Eden Prime');
  assert.deepEqual(await party(), ['Shepard', CREW.kaidan.name, CREW.jenkins.name]);
  await capture('premier-cadrage');
  const landed = await exported();
  assert.deepEqual(landed.position, eden.spawn);
  assert.deepEqual(landed.party, ['shepard', 'kaidan', 'jenkins']);
  await relocate(landed, eden.pois.find(point => point.id === 'eden-prime:arrival'), 'rapport-d-arrivee');
  await page.keyboard.press('KeyE');
  await page.locator('.dialogue').waitFor();
  assert.match(await page.locator('.dialogue-text').innerText(), /attaque|geth|fouille/i);
  await page.locator('.dialogue [data-do="dialogue-choice"]').first().click();
  await field();
  check('QST-deploiement-eden-prime', 'Le point de départ contient le groupe prévu. Le rapport de terrain confirme la découverte de l’attaque.');

  await relocate(landed, eden.pois.find(point => point.id === first), 'premier-contact');
  await page.keyboard.press('KeyE');
  await page.locator('#combat-shepard').waitFor();
  const deadline = Date.now() + 130_000;
  while (!await action('claim-victory').isVisible() && Date.now() < deadline) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(170);
  }
  await action('claim-victory').click();
  await reply('eden-prologue', 'support').waitFor();
  await capture('soutien');
  await reply('eden-prologue', 'leave').click();
  await field();
}

try {
  await page.goto(target.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false);
  await action('title-settings').click();
  await page.locator('#completion-quality').selectOption('economy');
  await page.locator('#sound-setting').uncheck();
  await action('close').click();
  if (fieldOnly || supportOnly) {
    const state = newGame({ guidedPrologue: true, difficulty: 'story' });
    Object.assign(state.settings, { sound: false, reducedMotion: true });
    assert.equal(confirmCampaignBriefing(state).ok, true);
    assert.equal(applyResolveCitadel(state, 'nihlus', 'colony').ok, true);
    assert.equal(travelCampaign(state, 'eden-prime').ok, true);
    if (supportOnly) assert.equal(winEncounter(state, first), true);
    await relocate(state, null, supportOnly ? 'premiere-victoire-preparee' : 'largage-prepare');
  } else {
    await briefingAndDeployment();
  }
  if (!supportOnly) await playLandingAndFirstBattle();
  const pending = await exported();
  assert.deepEqual(pending.lost, ['jenkins']);
  assert.deepEqual(pending.party, ['shepard', 'kaidan']);
  assert.equal(pending.recruited.includes('ashley'), false);
  const support = await markerPosition(EDEN_SUPPORT);
  await relocate(pending, support, 'soutien-repris');
  await page.keyboard.press('KeyE');
  await reply('eden-prologue', 'support').click();
  await field();
  const helped = await exported();
  assert.deepEqual(helped.party, ['shepard', 'kaidan', 'ashley']);
  assert.deepEqual([helped.xp, helped.credits], [pending.xp, pending.credits]);
  assert.equal(helped.recruited.filter(id => id === 'ashley').length, 1);
  await openAndCloseJournal('QST-rencontre-d-ashley', 'complete');
  check('QST-rencontre-d-ashley', 'Le premier combat et son rapport laissent le soutien en attente. La reprise retrouve le point et l’aide ajoute Ashley une fois.');

  const text = await openAndCloseJournal(search, 'active', true);
  assert.match(text, /site de fouille/);
  const clue = await markerPosition(EDEN_CLUE);
  await relocate(await exported(), clue, 'releve-de-fouille');
  await page.keyboard.press('KeyE');
  await reply('eden-prologue', 'record').click();
  await field();
  const recorded = await exported();
  assert.equal(recorded.campaignProgress.prologue.digClue, true);
  assert.match(recorded.logs[0].text, /spatioport/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await field();
  assert.match(await openAndCloseJournal(search, 'active'), /spatioport/);
  await page.keyboard.press('KeyM');
  await page.locator('[data-map-tracked="eden-prime:encounter-2"]').waitFor();
  assert.equal(await page.locator(`circle[data-map-position="${EDEN_CLUE}"]`).count(), 0);
  await capture('piste-spatioport');
  check(search, 'Le relevé est enregistré au site de fouille. Le journal et le repère suivi basculent vers le spatioport après reprise.');

  await Promise.all(responses.values());
  assert.ok(report.servedFiles.some(entry => /^assets\/index-.+\.js$/.test(entry.path)));
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.errors.push(error.message);
  try { await capture('blocage'); } catch {}
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}

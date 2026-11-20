import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { createChronicle, decodeChronicle, equipChronicle, setChronicleBuild, setChronicleParty, startChronicleBattle } from '../src/chronicles.js';
import { getTargetAvailability, performAction, tickBattle } from '../src/combat.js';
import { encodeSave, newGame, SAVE_KEY } from '../src/state.js';

const endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4314/');
const dist = process.env.P0_ME2_DIST || 'dist';
const output = process.env.P0_ME2_REPORT || 'test-results/p0-me2-preparation.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const context = { mediaId: 'ME2', periodId: 'me2' };
const standard = 'me2-equipment-workshop', legendary = 'me2-legendary-equipment-workshop', shadow = 'me2-shadow-broker';
const shepard = 'ME2-CHR-SHEPARD', miranda = 'ME2-CHR-MIRANDA';
const witness = encodeSave(newGame({ name: 'Témoin ME1' }));
const cataloguePath = 'docs/universe/catalogs/ME2.json';
const classes = ['default', 'soldier', 'engineer', 'adept', 'infiltrator', 'vanguard', 'sentinel'];
const sourceFiles = ['src/main.js', 'src/chronicles.js', 'src/universe-ui.js', 'src/universe-equipment.js', 'src/universe-equipment-scenarios.js', 'src/universe-ui.css', cataloguePath];
const snapshots = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, hash(await readFile(file))])));
const report = {
  passed: false, at: new Date().toISOString(), url: endpoint.href,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceHashes: await snapshots(), checks: [], observations: {}, captures: [], served: {}, errors: [],
  scope: 'Bancs Chroniques ME2 dans le build public, avec règles et réglages ATB de l’application. Portée limitée aux dotations, modèles et rôles d’essai disponibles. Les acquisitions et campagnes des éditions originales restent hors de cette vérification.',
};

function deterministicOrder() {
  const scenario = createChronicle(context, standard);
  const solo = setChronicleParty(scenario, [shepard]);
  const engineer = setChronicleBuild(solo.session, shepard, 'engineer');
  const battle = startChronicleBattle(engineer.session).battle;
  tickBattle(battle, 15);
  assert.equal(battle.waiting, true);
  const actor = battle.actors.find(item => item.id === shepard);
  const before = JSON.stringify(battle);
  const order = { actorId: shepard, actionId: 'hack' };
  const legal = getTargetAvailability(battle, { ...order, targetId: 'chronicle-enemy-0' });
  const refused = getTargetAvailability(battle, { ...order, targetId: 'chronicle-enemy-1' });
  assert.equal(legal.atbCost, 100);
  assert.equal(refused.ok, false);
  assert.equal(JSON.stringify(battle), before);
  assert.equal(performAction(battle, { ...order, targetId: 'chronicle-enemy-1' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  const outcome = performAction(battle, { ...order, targetId: 'chronicle-enemy-0' });
  assert.equal(outcome.ok, true);
  assert.equal(actor.atb, 0);
  assert.ok(battle.actors.find(item => item.id === 'chronicle-enemy-0').statuses.hacked > 0);
  return outcome.events;
}

assert.deepEqual(deterministicOrder(), deterministicOrder());
const original = createChronicle(context, standard), edition = createChronicle(context, legendary);
assert.equal(equipChronicle(original, shepard, 'ME2-EQP-KESTREL', 'armor').ok, false);
assert.equal(equipChronicle(edition, shepard, 'ME2-EQP-KESTREL', 'armor').ok, true);
assert.equal(equipChronicle(edition, miranda, 'ME2-EQP-KESTREL', 'armor').ok, false);
await mkdir(dirname(output), { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 870 }, acceptDownloads: true });
page.setDefaultTimeout(22000);
const responses = new Map();
page.on('pageerror', error => report.errors.push(error.message));
page.on('requestfailed', request => report.errors.push(request.url()));
page.on('request', request => {
  const url = new URL(request.url());
  if (url.origin !== endpoint.origin || /^\/(src|@vite|@fs)\//.test(url.pathname)) report.errors.push(request.url());
});
page.on('response', response => {
  const file = new URL(response.url()).pathname.slice(1) || 'index.html';
  if (response.status() >= 400 && file !== 'favicon.ico') report.errors.push(`${response.status()} ${file}`);
  if (response.status() !== 200 || (file !== 'index.html' && !/^assets\/[\w.-]+\.(?:css|js)$/.test(file)) || responses.has(file)) return;
  responses.set(file, response.body().then(async bytes => {
    const sum = hash(bytes);
    assert.equal(sum, hash(await readFile(join(dist, file))));
    report.served[file] = sum;
  }).catch(error => report.errors.push(error.message)));
});

const command = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const member = name => command('chronicle-party', `ME2-CHR-${name}`);
const profile = page.locator('[data-chronicle-equipment-profile]');
const scenario = page.locator('#chronicle-scenario');
const selected = () => page.locator('[data-do="chronicle-party"][aria-pressed="true"]').evaluateAll(cards => cards.map(card => card.dataset.id));
const gear = (actorId, slot) => page.locator(`#chronicle-${actorId}-${slot}`);
const unavailableGear = (select, id) => select.locator(`option[value="${id}"]`).evaluate(option => option.disabled);
const target = index => command('chronicle-target', `chronicle-enemy-${index}`);
const unit = id => page.locator(`[data-chronicle-unit="${id}"]`);
const atb = id => unit(id).getByRole('progressbar', { name: 'Jauge ATB' }).getAttribute('aria-valuenow');
const campaign = () => page.evaluate(key => localStorage.getItem(key), SAVE_KEY);

async function capture(name, locator) {
  const file = output.replace(/\.json$/, `-${name}.png`);
  const image = await locator.screenshot({ animations: 'disabled' });
  await writeFile(file, image, { flag: 'wx' });
  report.captures.push({ name, file, sha256: hash(image) });
}
async function chooseScenario(id) {
  await scenario.selectOption(id);
  if (!(await command('chronicle-battle').count())) await command('chronicle-start').click();
  assert.equal(await scenario.inputValue(), id);
}

try {
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: SAVE_KEY, save: witness });
  await page.goto(endpoint.href, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => typeof window.__RELAY_TEST__), 'undefined');
  await command('chronicles').click();
  await page.locator('#chronicle-media').selectOption('ME2');
  await page.locator('#chronicle-period').selectOption('me2');
  await command('universe-tab', 'session').click();
  await chooseScenario(standard);
  assert.equal(await profile.getAttribute('data-chronicle-equipment-profile'), 'standard');
  assert.deepEqual(await selected(), [shepard, miranda, 'ME2-CHR-JACOB']);
  assert.equal(await member('LIARA').count(), 0);

  const loadout = gear(shepard, 'weapon'), armor = gear(shepard, 'armor');
  const build = page.locator(`#chronicle-build-${shepard}`);
  assert.deepEqual(await build.locator('option').evaluateAll(items => items.map(option => option.value)), classes);
  assert.equal(await unavailableGear(armor, 'ME2-EQP-KESTREL'), true);
  assert.equal(await unavailableGear(gear(miranda, 'armor'), 'ME2-EQP-N7'), true);
  assert.equal(await unavailableGear(gear(miranda, 'weapon'), 'ME2-WPN-AVENGER'), true);
  assert.equal(await unavailableGear(loadout, 'ME2-WPN-WIDOW'), true);
  await armor.selectOption('ME2-EQP-N7');
  await loadout.selectOption('ME2-WPN-AVENGER');
  await build.selectOption('engineer');
  assert.equal(await armor.inputValue(), 'ME2-EQP-N7');
  assert.equal(await loadout.inputValue(), '');
  assert.equal(await unavailableGear(loadout, 'ME2-WPN-AVENGER'), true);
  await loadout.selectOption('ME2-WPN-PREDATOR');

  await member('GARRUS').click();
  assert.match(await page.getByRole('alert').innerText(), /un à trois/);
  assert.equal((await selected()).length, 3);
  await member('JACOB').click();
  await member('MIRANDA').click();
  await member('SAMARA').click();
  assert.match(await member('MORINTH').locator('[data-chronicle-party-exclusive]').innerText(), /Samara/);
  await member('MORINTH').click();
  assert.match(await page.getByRole('alert').innerText(), /Samara ou Morinth/);
  assert.deepEqual(await selected(), [shepard, 'ME2-CHR-SAMARA']);
  await member('SAMARA').click();
  await member('MORINTH').click();
  await member('GARRUS').click();
  assert.deepEqual(await selected(), [shepard, 'ME2-CHR-GARRUS', 'ME2-CHR-MORINTH']);
  report.observations.loadout = { profiles: classes, classChangeClearsWrongWeapon: true, allyFiltersIndependent: true, modeledArmor: 'ME2-EQP-N7', widowLocked: true };

  await command('chronicle-battle').click();
  const rhythm = page.locator('#chronicle-mode');
  assert.equal(await rhythm.inputValue(), 'wait');
  await rhythm.selectOption('active');
  await page.waitForFunction(id => document.querySelector(`[data-chronicle-unit="${id}"] [aria-label="Jauge ATB"]`)?.getAttribute('aria-valuenow') === '100', shepard);
  await rhythm.selectOption('wait');
  await command('chronicle-actor', shepard).click();
  const ammunition = () => page.locator('[data-chronicle-ammo]').innerText();
  const beforeAmmo = await ammunition();
  assert.match(beforeAmmo, /^8\/8/);
  await command('chronicle-action', 'hack').click();
  assert.equal(await atb(shepard), '100');
  assert.equal(await ammunition(), beforeAmmo);
  assert.equal(await target(1).isDisabled(), true);
  assert.match(await target(1).locator('[data-chronicle-target-reason]').innerText(), /cible synthétique/);
  assert.equal(await target(0).isEnabled(), true);
  await capture('target-conditions', page.locator('.chronicle-command'));
  await target(0).click();
  assert.notEqual(await atb(shepard), '100');
  assert.match(await unit('chronicle-enemy-0').locator('[data-chronicle-signature-status]').innerText(), /Piratage/);
  await command('chronicle-pause').click();
  const frozen = await atb(shepard);
  await page.waitForTimeout(350);
  assert.equal(await atb(shepard), frozen);
  report.observations.atb = { resourcesUntouchedBeforeTarget: true, deterministicNative: true, targetRefusalVisible: true, manualPauseFreezesAtb: true };
  await command('chronicle-preparation').click();

  await chooseScenario(shadow);
  assert.deepEqual(await selected(), [shepard, 'ME2-CHR-LIARA']);
  const restriction = member('LIARA').locator('[data-chronicle-party-restriction]');
  assert.match(await restriction.innerText(), /Shadow Broker uniquement/);
  assert.match(await page.getByRole('list', { name: 'Conditions de l’essai' }).innerText(), /Shadow Broker/);
  await capture('temporary-party', page.locator('.universe-party'));
  report.observations.squad = { maximumThree: true, exclusionPreserved: true, scopedTemporaryActor: true };

  await chooseScenario(legendary);
  assert.equal(await profile.getAttribute('data-chronicle-equipment-profile'), 'legendary');
  assert.match(await page.getByRole('list', { name: 'Conditions de l’essai' }).innerText(), /contenus d’équipement correspondants supposés présents/);
  assert.equal(await member('LIARA').count(), 0);
  assert.equal(await unavailableGear(armor, 'ME2-EQP-KESTREL'), false);
  assert.equal(await unavailableGear(gear(miranda, 'armor'), 'ME2-EQP-KESTREL'), true);
  assert.equal(await unavailableGear(loadout, 'ME2-WPN-LOCUST'), false);
  await armor.selectOption('ME2-EQP-KESTREL');
  const [download] = await Promise.all([page.waitForEvent('download'), command('chronicle-export').click()]);
  const loaded = decodeChronicle(await readFile(await download.path(), 'utf8'));
  assert.equal(loaded.scenarioId, legendary);
  assert.equal(loaded.loadouts[shepard].armor, 'ME2-EQP-KESTREL');
  await command('chronicle-load').click();
  assert.equal(await armor.inputValue(), 'ME2-EQP-KESTREL');
  await capture('edition-conditions', page.locator('.universe-scenario'));
  await chooseScenario(standard);
  assert.equal(await armor.inputValue(), '');
  assert.equal(await unavailableGear(armor, 'ME2-EQP-KESTREL'), true);
  assert.equal(await unavailableGear(loadout, 'ME2-WPN-LOCUST'), true);
  report.observations.edition = { originalAndLegendary: true, allowedDlcGearScoped: true, loadoutRoundTrip: true, crossProfileGearRemoved: true };

  assert.equal(await campaign(), witness);
  await Promise.all(responses.values());
  assert.ok(report.served['index.html'] && Object.keys(report.served).filter(file => file.endsWith('.js')).length >= 2);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await snapshots(), report.sourceHashes);
  const entries = JSON.parse(await readFile(cataloguePath, 'utf8')).entries;
  for (const id of ['ME2-SYS-ATB', 'ME2-SYS-LOADOUT', 'ME2-SYS-SQUAD', 'ME2-SYS-EDITION']) {
    const row = entries.find(entry => entry.id === id);
    assert.equal(row.priority, 'P0');
    report.checks.push({ id, passed: true, exactDescription: row.description, exactCriterion: row.acceptance });
  }
  report.campaignSha256 = hash(witness);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  process.exitCode = 1;
  await capture('failure', page).catch(() => {});
} finally {
  await browser.close();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, output, failure: report.failure }));
}

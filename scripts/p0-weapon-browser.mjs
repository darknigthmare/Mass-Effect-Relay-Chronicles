import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';

const root = new URL('../', import.meta.url);
const out = new URL('test-results/p0-weapon/', root);
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4267/');
url.searchParams.set('qa', '1');
await mkdir(out, { recursive: true });
const fixture = newGame({ name: 'Essai de dotation', classId: 'soldier', difficulty: 'story' });
fixture.flags.briefed = true;
fixture.xp = 300; // Test fixture at level 2 so the shop offers a measurable upgrade.
fixture.settings.reducedMotion = true;
const rifle = actorFor('shepard', fixture);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  at: new Date().toISOString(), passed: false,
  scope: 'Public import, shop, equipment, reload and travel, with read-only renderer and battle observations. The existing DEV QA adapter starts the selected encounter after deployment.',
  checks: [], captures: [], errors: [],
};
const sources = ['src/main.js', 'src/world.js', 'src/loadout.js', 'src/weapon-presentation.js', 'src/local-map.css'];
async function sourceHashes() {
  return Object.fromEntries(await Promise.all(sources.map(async path => [path, hash(await readFile(new URL(path, root)))])));
}
report.sourceHashes = await sourceHashes();
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(20_000);
  page.on('pageerror', error => report.errors.push(error.message));
  const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
  const ready = zone => page.waitForFunction(zone => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState()?.zone === zone && !qa.getUI().busy && !qa.getUI().screen;
  }, zone);
  const check = (name, details) => report.checks.push({ name, details });
  async function capture(name, clip) {
    const path = `${name}.png`;
    const bytes = await page.screenshot({ path: new URL(path, out).pathname, clip, animations: 'disabled' });
    report.captures.push({ path, sha256: hash(bytes) });
    return bytes;
  }
  async function carried(itemId) {
    await page.waitForFunction(itemId => {
      const actor = window.__RELAY_TEST__?.getWorld().actors.find(actor => actor.id === 'shepard');
      return actor.carriedWeapon?.visible && actor.carriedWeapon.userData.itemId === itemId;
    }, itemId);
    return page.evaluate(() => {
      const world = window.__RELAY_TEST__.getWorld();
      const actor = world.actors.find(actor => actor.id === 'shepard');
      const layer = actor.carriedWeapon, canvas = layer.material.map.image;
      const center = layer.getWorldPosition(actor.group.position.clone()).project(world.camera);
      return {
        attached: layer.parent === actor.body,
        family: layer.userData.family, itemId: layer.userData.itemId,
        texturePixels: canvas.toDataURL(),
        clip: {
          x: Math.max(0, Math.round((center.x + 1) * innerWidth / 2 - 69)),
          y: Math.max(0, Math.round((1 - center.y) * innerHeight / 2 - 90)),
          width: 138, height: 170,
        },
      };
    });
  }

  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const chooserPromise = page.waitForEvent('filechooser');
  await action('import').click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'dotation-niveau-2.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await ready('normandy');
  const original = await carried('lancer-i');
  assert.equal(original.family, 'assault');
  assert.ok(original.attached);
  const beforePixels = await capture('01-carried-rifle', original.clip);

  await page.keyboard.press('KeyI');
  await action('eq-tab', 'shop').click();
  await action('eq-buy', 'hurricane-iii').click();
  await action('eq-tab', 'inventory').click();
  await action('eq-equip', 'hurricane-iii').click();
  await action('eq-tab', 'loadout').click();
  assert.match(await page.locator('.eq-slot[data-slot="weapon"]').innerText(), /Hurricane III/);
  await action('close').click();
  await ready('normandy');
  const changed = await carried('hurricane-iii');
  assert.equal(changed.family, 'shotgun');
  assert.ok(changed.attached);
  assert.notEqual(changed.texturePixels, original.texturePixels);
  const afterPixels = await capture('02-carried-shotgun', changed.clip);
  assert.notDeepEqual(afterPixels, beforePixels);
  check('The public equipment change replaces the carried sprite attached to the player', { before: original.itemId, after: changed.itemId });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await ready('normandy');
  const resumed = await carried('hurricane-iii');
  assert.equal(resumed.texturePixels, changed.texturePixels);
  check('The saved weapon rebuilds the same carried sprite after reload', { itemId: resumed.itemId });

  await page.keyboard.press('KeyG');
  await page.locator('.planet-dot[data-id="citadel"]').click();
  await page.locator('.planet-detail[data-destination="citadel"][data-access="locked"]').waitFor();
  await page.locator('.planet-dot[data-id="eden-prime"]').click();
  await page.locator('.planet-detail[data-destination="eden-prime"][data-access="available"]').waitFor();
  check('A public pointer click selects each marker inside the decorative galaxy orbit', { selected: ['citadel', 'eden-prime'] });
  await action('travel', 'eden-prime').click();
  await ready('eden-prime');
  await page.evaluate(() => window.__RELAY_TEST__.startBattle('eden-prime:encounter-1'));
  await page.locator('#battle-ui .battle-shell').waitFor();
  const battle = await page.evaluate(() => {
    const qa = window.__RELAY_TEST__;
    const { weaponItemId, weaponType, attack, weaponHeatMultiplier } = qa.getBattle().actors.find(actor => actor.id === 'shepard');
    return { weaponItemId, weaponType, attack, weaponHeatMultiplier };
  });
  assert.equal(battle.weaponItemId, changed.itemId);
  assert.equal(battle.weaponType, changed.family);
  assert.ok(battle.attack > rifle.attack);
  assert.ok(battle.weaponHeatMultiplier > rifle.weaponHeatMultiplier);
  await page.keyboard.press('KeyI');
  await page.keyboard.press('Escape');
  await action('customization').waitFor();
  assert.ok(await action('customization').isDisabled());
  assert.equal(await page.locator('.loadout-screen').count(), 0);
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getState().inventory.equipped.shepard.weapon), changed.itemId);
  check('The same item drives the next ATB battle, and equipment stays inaccessible in combat', battle);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await sourceHashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, captures: report.captures.length, report: new URL('report.json', out).pathname }));
}

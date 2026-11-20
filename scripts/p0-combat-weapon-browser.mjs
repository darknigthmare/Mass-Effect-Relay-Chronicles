import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { actorFor } from '../src/game-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { newGame, encodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';

const root = new URL('../', import.meta.url);
const out = new URL('test-results/p0-combat-weapon/', root);
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4267/');
url.searchParams.set('qa', '1');
await mkdir(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = ['src/weapon-presentation.js', 'src/world.js', 'src/main.js', 'src/loadout.js', 'scripts/p0-combat-weapon-browser.mjs'];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, hash(await readFile(new URL(file, root)))])));
const report = {
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  at: new Date().toISOString(), passed: false, sourceHashes: await sourceHashes(), checks: [], captures: [], errors: [],
  scope: 'Public inventory, an actual Eden Prime encounter and native ATB controls. In a developer build, read-only renderer and battle observations inspect the attachment, texture and weapon state on the same actor.',
};
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const [appearance, item, family] of [['male', 'striker-iii', 'pistol'], ['female', 'hurricane-iii', 'shotgun']]) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 830 } });
    const page = await context.newPage();
    page.setDefaultTimeout(35_000);
    page.on('pageerror', error => report.errors.push(error.message));
    const action = (name, dataId) => page.locator(`[data-do="${name}"]${dataId ? `[data-id="${dataId}"]` : ''}`).first();
    const fixture = newGame({ appearance, name: 'QA équipement', difficulty: 'story', mode: 'active' });
    fixture.zone = 'eden-prime';
    fixture.flags.briefed = true;
    fixture.xp = 300;
    fixture.inventory.items[item] = 1;
    fixture.settings.sound = false;
    fixture.settings.reducedMotion = true;
    fixture.position = { ...getLevelLayout(fixture.zone).pois['encounter-1'] };
    assert.ok(recordVisit(fixture, fixture.zone));
    const original = actorFor('shepard', fixture);
    const equipped = structuredClone(fixture);
    equipped.inventory.equipped.shepard.weapon = item;
    const expected = actorFor('shepard', equipped);
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
    await chooser.setFiles({ name: 'qa-combat-weapon.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
    await page.locator('#hud:not(.hidden) .location h2').waitFor();
    await page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
    await page.keyboard.press('KeyI');
    await action('eq-tab', 'inventory').click();
    await action('eq-equip', item).click();
    await action('close').click();
    await page.waitForFunction(item => window.__RELAY_TEST__?.getWorld().actors.find(actor => actor.id === 'shepard').carriedWeapon?.userData.itemId === item, item);
    await page.keyboard.press('KeyE');
    await page.locator('#battle-ui .tactical-toolbar').waitFor();
    await page.waitForFunction(item => {
      const actor = window.__RELAY_TEST__?.getWorld().battleActors.get('shepard');
      return actor?.carriedWeapon?.visible && actor.carriedWeapon.userData.itemId === item;
    }, item);

    const observed = await page.evaluate(() => {
      const qa = window.__RELAY_TEST__, world = qa.getWorld(), actor = world.battleActors.get('shepard');
      const weapon = actor.carriedWeapon, { attack, weaponItemId, weaponType, weaponHeatMultiplier } = actor.state;
      const center = actor.body.getWorldPosition(actor.group.position.clone()).project(world.camera);
      const texture = actor.body.material.map;
      const mask = texture.userData.relayCustomizationSource || texture;
      const { width, height } = mask.image;
      const x = Math.min(innerWidth - 240, Math.max(0, Math.round((center.x + 1) * innerWidth / 2 - 92)));
      const y = Math.min(innerHeight - 240, Math.max(0, Math.round((1 - center.y) * innerHeight / 2 - 120)));
      return { attack, weaponItemId, weaponType, weaponHeatMultiplier, bodyCanvas: mask.isCanvasTexture, width, height,
        pose: actor.animationFrame, layerParent: weapon.parent === actor.body, layerItemId: weapon.userData.itemId, layerFamily: weapon.userData.family,
        clip: { x, y, width: 240, height: 240 } };
    });
    assert.equal(observed.weaponItemId, item);
    assert.equal(observed.layerItemId, observed.weaponItemId);
    assert.equal(observed.layerFamily, family);
    assert.equal(observed.weaponType, observed.layerFamily);
    assert.notEqual(observed.attack, original.attack);
    assert.notEqual(observed.weaponHeatMultiplier, original.weaponHeatMultiplier);
    assert.equal(observed.attack, expected.attack);
    assert.equal(observed.weaponHeatMultiplier, expected.weaponHeatMultiplier);
    assert.ok(observed.bodyCanvas && observed.layerParent && observed.pose.endsWith('-aim'));
    const name = `${appearance}-${family}-visee.png`;
    const screenshot = await page.screenshot({ path: new URL(name, out).pathname, clip: observed.clip });
    report.captures.push({ name, sha256: hash(screenshot) });
    await page.keyboard.press('KeyI');
    await page.keyboard.press('Escape');
    assert.ok(await action('customization').isDisabled());
    assert.equal(await page.locator('.loadout-screen').count(), 0);
    assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getState().inventory.equipped.shepard.weapon), item);
    await action('close').click();
    const ready = page.locator('[data-do="battle-actor"][data-id="shepard"].ready');
    await ready.waitFor({ timeout: 50000 });
    await ready.click();
    await action('battle-action', 'shoot').click();
    const target = page.locator('[data-do="battle-target"]:not(:disabled)').first();
    await target.click();
    await page.waitForFunction(() => window.__RELAY_TEST__?.getBattle().events.some(event => event.actorId === 'shepard' && event.type === 'damage'));
    const shot = await page.evaluate(() => {
      const battle = window.__RELAY_TEST__.getBattle();
      const event = battle.events.find(event => event.actorId === 'shepard' && event.type === 'damage');
      return { healthDamage: event.healthDamage, shieldDamage: event.shieldDamage, heat: battle.actors.find(actor => actor.id === 'shepard').heat };
    });
    assert.ok(shot.healthDamage + shot.shieldDamage > 0 && shot.heat > 0);
    assert.ok(await page.evaluate(item => window.__RELAY_TEST__.getWorld().battleActors.get('shepard').carriedWeapon.userData.itemId === item, item));
    report.checks.push({ appearance, item, family, originalAttack: original.attack, observed, shot });
    console.log(`${appearance} ${family} visible in the active battle and fired using the equipped stats`);
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(await sourceHashes(), report.sourceHashes);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, cases: report.checks.length, report: new URL('report.json', out).pathname }));
}

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { actorFor } from '../src/game-data.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { equipItem } from '../src/loadout.js';
import { newGame, encodeSave } from '../src/state.js';
import { recordVisit } from '../src/story.js';

const root = new URL('../', import.meta.url), out = new URL('test-results/p0-party-weapon/', root);
const url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4267/');
url.searchParams.set('qa', '1');
await mkdir(out, { recursive: true });
const ids = ['ashley', 'kaidan', 'garrus', 'tali', 'liara', 'wrex', 'jenkins'];
const families = [['pistol', 'striker-iii'], ['assault', 'banshee-iii'], ['shotgun', 'hurricane-iii'], ['sniper', 'hammer-iii']];
const sources = ['src/weapon-presentation.js', 'src/world.js', 'src/main.js', 'src/loadout.js', 'scripts/p0-party-weapon-browser.mjs',
  'public/assets/crew-atlas.png', ...ids.flatMap(id => [`public/assets/companion-${id}-animation.json`, `public/assets/companion-${id}-combat.png`])];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hashes = async () => Object.fromEntries(await Promise.all(sources.map(async file => [file, hash(await readFile(new URL(file, root)))])));
const report = {
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  at: new Date().toISOString(), passed: false, sourceHashes: await hashes(), public: [], matrix: [], captures: [], errors: [],
  scope: 'Public equipment, save resume, Eden Prime encounter and ATB shooting with Kaidan and Jenkins. The second stage exercises the field, four weapon families and every authored companion combat pose on an isolated WorldView and native battle, driven by its developer adapter.',
};
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });
  page.setDefaultTimeout(75_000);
  page.on('pageerror', error => report.errors.push(error.message));
  const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
  const clear = () => page.locator('#transition.active, #overlay .screen, #overlay .dialogue').waitFor({ state: 'hidden' });
  const capture = async (name, image) => {
    const bytes = image || await page.screenshot({ path: new URL(name, out).pathname });
    if (image) await writeFile(new URL(name, out), bytes);
    report.captures.push({ name, sha256: hash(bytes) });
  };
  const changed = { kaidan: 'hammer-iii', jenkins: 'hurricane-iii' };
  const fixture = newGame({ name: 'QA dotation du groupe', difficulty: 'story', mode: 'active' });
  fixture.flags.briefed = true;
  fixture.zone = 'eden-prime';
  fixture.position = { ...getLevelLayout(fixture.zone).pois['encounter-1'] };
  fixture.xp = 300;
  fixture.settings.sound = false;
  fixture.settings.reducedMotion = true;
  for (const item of Object.values(changed)) fixture.inventory.items[item] = 1;
  assert.ok(recordVisit(fixture, fixture.zone));
  const expected = structuredClone(fixture);
  for (const [id, item] of Object.entries(changed)) assert.ok(equipItem(expected, id, item).ok);

  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: 'qa-dotation-du-groupe.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(fixture)) });
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await clear();
  await page.keyboard.press('KeyI');
  for (const [id, item] of Object.entries(changed)) {
    await action('eq-actor', id).click();
    await action('eq-tab', 'inventory').click();
    await action('eq-equip', item).click();
  }
  await action('close').click();
  await clear();
  const waitField = () => page.waitForFunction(changed => Object.entries(changed).every(([id, item]) => {
    const actor = window.__RELAY_TEST__.getWorld().actors.find(actor => actor.id === id);
    return actor?.carriedWeapon?.visible && actor.carriedWeapon.userData.itemId === item;
  }), changed);
  await waitField();
  await capture('commando-dotations-terrain.png');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await clear();
  await waitField();
  await page.keyboard.press('KeyE');
  await page.locator('#battle-ui .tactical-toolbar').waitFor();
  await page.waitForFunction(changed => Object.entries(changed).every(([id, item]) => {
    const actor = window.__RELAY_TEST__.getWorld().battleActors.get(id);
    return actor?.animationFrame?.endsWith('-aim') && actor.carriedWeapon?.visible && actor.carriedWeapon.userData.itemId === item;
  }), changed);
  const battle = await page.evaluate(ids => {
    const { battleActors } = window.__RELAY_TEST__.getWorld();
    return ids.map(id => {
      const actor = battleActors.get(id), { weaponItemId, weaponType, attack, weaponHeatMultiplier } = actor.state;
      return { id, weaponItemId, weaponType, attack, weaponHeatMultiplier, family: actor.carriedWeapon.userData.family,
        posed: actor.body.material.map.isCanvasTexture, attachment: actor.carriedWeapon.parent === actor.body };
    });
  }, Object.keys(changed));
  for (const item of battle) {
    const model = actorFor(item.id, expected);
    for (const key of ['weaponItemId', 'weaponType', 'attack', 'weaponHeatMultiplier']) assert.equal(item[key], model[key]);
    assert.equal(item.family, model.weaponType);
    assert.ok(item.posed && item.attachment);
    assert.notEqual(item.attack, actorFor(item.id, fixture).attack);
  }
  await capture('commando-dotations-combat.png');
  await page.keyboard.press('KeyI');
  assert.ok(await action('equipment').isDisabled());
  assert.equal(await page.locator('.loadout-screen').count(), 0);
  await page.waitForFunction(() => window.__RELAY_TEST__.getBattle().actors.find(actor => actor.id === 'kaidan').atb >= 100);
  await action('battle-actor', 'kaidan').click();
  await action('battle-action', 'shoot').click();
  await page.locator('[data-do="battle-target"]:not(:disabled)').first().click();
  await page.waitForFunction(() => window.__RELAY_TEST__.getBattle().events.some(event => event.type === 'damage' && event.actorId === 'kaidan'));
  report.public.push(...battle);
  console.log('Public equipment, resume and the encounter passed.');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await action('continue').click();
  await page.locator('#hud:not(.hidden) .location h2').waitFor();
  await clear();
  await page.waitForFunction(ids => ids.every(id => window.__RELAY_TEST__?.getWorld().atlases[`combat-${id}`]?.image), ids);
  const definitions = [];
  for (const id of ids) for (const [family, item] of families) {
    const variant = newGame();
    variant.recruited = [...ids];
    variant.party = ['shepard', id];
    variant.xp = 300;
    variant.inventory.items[item] = 1;
    assert.ok(equipItem(variant, id, item).ok);
    definitions.push({ id, family, item, actor: actorFor(id, variant), baseline: actorFor(id, { ...variant, inventory: fixture.inventory }) });
  }
  const matrixResult = await page.evaluate(async ({ definitions, ids, families }) => {
    const { createBattle, performAction } = await import('/src/combat.js');
    const qa = window.__RELAY_TEST__, world = qa.getWorld();
    const sheet = document.createElement('canvas');
    sheet.width = 290 * families.length; sheet.height = 165 * ids.length;
    const ctx = sheet.getContext('2d'); ctx.fillStyle = '#101820'; ctx.fillRect(0, 0, sheet.width, sheet.height);
    ctx.fillStyle = '#dfecf9'; ctx.font = '14px sans-serif';
    ctx.imageSmoothingQuality = 'high';
    const cells = [];
    function draw(actor, x, y) {
      const map = actor.body.material.map;
      const image = map.image;
      const bodyWidth = actor.body.geometry.parameters.width, bodyHeight = actor.body.geometry.parameters.height;
      const w = image.width / image.height * 122, h = 122;
      ctx.drawImage(image, x, y, w, h);
      if (!actor.carriedWeapon?.visible) return;
      const layer = actor.carriedWeapon;
      ctx.save(); ctx.translate(x + (layer.position.x / bodyWidth + .5) * w, y + (.5 - layer.position.y / bodyHeight) * h);
      ctx.scale(w / bodyWidth, h / bodyHeight); ctx.rotate(-layer.rotation.z);
      ctx.drawImage(layer.material.map.image, -layer.scale.x / 2, -layer.scale.y / 2, layer.scale.x, layer.scale.y);
      ctx.restore();
    }
    world.setStoryContext({ ...world.storyContext, recruited: ids, lost: [], completed: [] });
    for (const entry of definitions) {
      const { id, family, actor, item } = entry;
      world.setMode('explore');
      world.setParty(['shepard', id]);
      world.setPartyMemberWeapon(actor);
      world.update(.05, { render: false });
      const explorer = world.actors.find(actor => actor.id === id);
      const fieldMap = explorer.body.material.map;
      const field = {
        item: explorer.carriedWeapon?.visible ? explorer.carriedWeapon.userData.itemId : null,
        family: explorer.carriedWeapon?.visible ? explorer.carriedWeapon.userData.family : null,
        crop: fieldMap.userData.weaponMount?.rect,
      };
      if (['garrus', 'wrex'].includes(id)) {
        const existingFrame = world._spriteTexture(id, false).image;
        const topPixels = image => image.getContext('2d').getImageData(0, 0, 384, 95).data;
        const before = topPixels(existingFrame), after = topPixels(fieldMap.image);
        field.topPreserved = before.every((value, i) => value === after[i]);
      }
      world.setMode('combat');
      const matrixBattle = createBattle({ party: [{ ...actor, atb: 100 }], enemies: [{ id: 'test-adversaire', sprite: 'geth', hp: 500, shield: 100 }], mode: 'active', seed: 101 });
      world.setBattle(matrixBattle);
      const sprite = world.battleActors.get(id), poses = [];
      for (const pose of ['aim', 'power', 'hit', 'down']) {
        if (pose === 'power') world.playEvent({ type: 'action', actorId: id, targetId: 'test-adversaire', actionId: 'warp' });
        if (pose === 'hit') world.playEvent({ type: 'damage', targetId: id });
        if (pose === 'down') { matrixBattle.actors[0].hp = 0; world.setBattle(matrixBattle); }
        world.update(.05, { render: false });
        const layer = sprite.carriedWeapon;
        const texture = layer?.material.map;
        poses.push({ pose, frame: sprite.animationFrame, visible: layer?.visible || false,
          opacity: layer?.visible ? layer.material.opacity : null, bodyOpacity: sprite.body.material.opacity,
          mask: Boolean(sprite.body.material.map.userData.weaponMount), id: layer?.visible ? layer.userData.itemId : null,
          family: layer?.visible ? layer.userData.family : null, texture: layer?.visible ? texture.image.toDataURL() : null });
        if (pose === 'aim') {
          const x = families.findIndex(entry => entry[0] === family) * 290, y = ids.indexOf(id) * 165;
          ctx.fillText(`${id} · ${family}`, x + 16, y + 18);
          draw(sprite, x + 21, y + 26);
        }
      }
      matrixBattle.actors[0].hp = actor.hp;
      world.setBattle(matrixBattle);
      const result = performAction(matrixBattle, { actorId: id, targetId: 'test-adversaire', actionId: 'shoot' });
      const { weaponItemId, weaponType, attack, weaponHeatMultiplier, heat } = matrixBattle.actors[0];
      cells.push({ id, item, family, weaponItemId, weaponType, attack, weaponHeatMultiplier, field, poses,
        shot: { ok: result.ok, heat, damage: result.events?.reduce((sum, e) => sum + (e.healthDamage || 0) + (e.shieldDamage || 0), 0) || 0 } });
      world.setBattle(null);
    }
    return { cells, png: sheet.toDataURL('image/png') };
  }, { definitions, ids, families });
  const allTextures = new Map();
  for (const [index, cell] of matrixResult.cells.entries()) {
    const expected = definitions[index];
    assert.equal(cell.item, cell.weaponItemId);
    assert.equal(cell.family, cell.weaponType);
    assert.equal(cell.attack, expected.actor.attack);
    assert.notEqual(cell.attack, expected.baseline.attack);
    assert.equal(cell.weaponHeatMultiplier, expected.actor.weaponHeatMultiplier);
    assert.ok(cell.shot.ok && cell.shot.damage > 0 && cell.shot.heat > 0, JSON.stringify(cell.shot));
    assert.equal(cell.field.item, cell.item);
    assert.equal(cell.field.family, cell.family);
    assert.deepEqual(cell.field.crop.slice(2), [384, 512]);
    if (['garrus', 'wrex'].includes(cell.id)) {
      assert.equal(cell.field.crop[1], cell.id === 'garrus' ? 497 : 494);
      assert.equal(cell.field.topPreserved, true);
    }
    for (const pose of cell.poses) {
      assert.equal(pose.frame, `${cell.id}-combat-${pose.pose}`);
      const held = pose.pose === 'aim' || ['ashley', 'kaidan', 'jenkins'].includes(cell.id);
      assert.equal(pose.visible, held);
      assert.equal(pose.mask, held);
      if (held) {
        assert.equal(pose.id, cell.item);
        assert.equal(pose.family, cell.family);
        assert.equal(pose.opacity, pose.bodyOpacity);
        allTextures.set(cell.family, hash(Buffer.from(pose.texture)));
      }
      delete pose.texture;
    }
    report.matrix.push(cell);
  }
  assert.equal(new Set(allTextures.values()).size, 4);
  await capture('commando-quatre-familles.png', Buffer.from(matrixResult.png.split(',')[1], 'base64'));
  assert.deepEqual(await hashes(), report.sourceHashes);
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await browser.close();
  await writeFile(new URL('report.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, cases: report.matrix.length, report: new URL('report.json', out).pathname }));
}

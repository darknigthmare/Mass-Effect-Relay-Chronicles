import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4173';
const out = new URL('../test-results/', import.meta.url);
await mkdir(out, { recursive: true });
const report = { passed: false, at: new Date().toISOString(), scenarios: [], errors: [], failedRequests: [] };
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function idle(page, zone) {
  await page.waitForFunction(expected => {
    const qa = window.__RELAY_TEST__;
    return qa?.getState()?.zone === expected && !qa.getUI().busy;
  }, zone);
}

async function assertIdentity(page, expected) {
  await page.waitForFunction(() => {
    const world = window.__RELAY_TEST__.getWorld();
    return world.atlases.npc && world.atlases.crew;
  });
  const identity = await page.evaluate(() => {
    const qa = window.__RELAY_TEST__, state = qa.getState(), world = qa.getWorld();
    const actor = world.actors.find(entry => entry.id === 'shepard');
    return {
      name: state.name, appearance: state.appearance, origin: state.origin,
      psychologicalProfile: state.psychologicalProfile,
      sprite: actor?.key, texture: actor?.body.material.map?.image?.src,
    };
  });
  for (const key of ['name', 'appearance', 'origin', 'psychologicalProfile']) assert.equal(identity[key], expected[key], key);
  assert.equal(identity.sprite, expected.appearance === 'female' ? 'femshep' : 'shepard');
  assert.match(identity.texture || '', expected.appearance === 'female' ? /npc-atlas\.png/ : /(?:crew|shepard-walk)-atlas\.png/);
}

async function importSave(page, contents, name = 'commander.json') {
  await page.evaluate(() => { window.__COMMANDER_PRIOR_STATE__ = window.__RELAY_TEST__.getState(); });
  await page.locator('#save-import').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(contents) });
  await page.waitForFunction(() => window.__RELAY_TEST__.getState() !== window.__COMMANDER_PRIOR_STATE__ && !window.__RELAY_TEST__.getUI().busy);
  await page.evaluate(() => { delete window.__COMMANDER_PRIOR_STATE__; });
}

const scenarios = [
  { name: 'Alex Shepard', appearance: 'female', origin: 'colonist', psychologicalProfile: 'war-hero', originLabel: 'Colon', profileLabel: 'Héros de guerre' },
  { name: 'Sam Shepard', appearance: 'male', origin: 'earthborn', psychologicalProfile: 'ruthless', originLabel: 'Terrien', profileLabel: 'Impitoyable' },
];

try {
  for (const expected of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(45000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('requestfailed', request => report.failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
    try {
      await page.goto(`${baseURL}/?qa`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Nouvelle campagne/ }).click();
      await page.locator('#commander-name').fill(expected.name);
      await page.locator('#new-appearance').selectOption(expected.appearance);
      await page.locator('#new-origin').selectOption(expected.origin);
      await page.locator('#new-profile').selectOption(expected.psychologicalProfile);
      assert.equal(await page.locator('#commander-name').inputValue(), expected.name);
      const preview = await page.locator('#commander-preview').evaluate(element => getComputedStyle(element).backgroundImage);
      assert.ok(preview.includes(expected.appearance === 'female' ? 'npc-atlas.png' : 'crew-atlas.png'));
      await page.screenshot({ path: fileURLToPath(new URL(`commander-${expected.appearance}-creation.png`, out)) });
      await page.getByRole('button', { name: /Commencer l’aventure/ }).click();
      await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
      await idle(page, 'normandy');
      await page.waitForFunction(() => window.__RELAY_TEST__.getWorld().atlases.npc && window.__RELAY_TEST__.getWorld().atlases.crew);
      await assertIdentity(page, expected);

      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Dossier Shepard', exact: true }).click();
      assert.ok((await page.locator('.commander-record').innerText()).includes(expected.originLabel));
      assert.ok((await page.locator('.commander-record').innerText()).includes(expected.profileLabel));
      assert.equal(await page.locator('.commander-name').innerText(), expected.name);
      await page.screenshot({ path: fileURLToPath(new URL(`commander-${expected.appearance}-dossier.png`, out)) });
      await page.locator('[data-do="dossier-back"]').click();
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-do="export"]').click();
      const download = await downloadPromise;
      const savePath = fileURLToPath(new URL(`commander-${expected.appearance}-save.json`, out));
      await download.saveAs(savePath);
      const serialized = await readFile(savePath, 'utf8');
      const exported = JSON.parse(serialized);
      for (const key of ['name', 'appearance', 'origin', 'psychologicalProfile']) assert.equal(exported.state[key], expected[key]);

      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Reprendre/ }).click();
      await idle(page, 'normandy');
      await assertIdentity(page, expected);
      if (expected.appearance === 'female') {
        const legacy = JSON.parse(serialized);
        delete legacy.state.appearance; delete legacy.state.origin; delete legacy.state.psychologicalProfile;
        await importSave(page, JSON.stringify(legacy), 'legacy-v1.json');
        await idle(page, 'normandy');
        await assertIdentity(page, { ...expected, appearance: 'male', origin: 'spacer', psychologicalProfile: 'sole-survivor' });
      }
      await importSave(page, serialized);
      await idle(page, 'normandy');
      await assertIdentity(page, expected);
      const start = await page.evaluate(() => window.__RELAY_TEST__.getWorld().getPosition());
      await page.keyboard.down('ArrowUp');
      await page.waitForFunction(position => {
        const next = window.__RELAY_TEST__.getWorld().getPosition();
        return Math.hypot(position.x - next.x, position.z - next.z) > 0.5;
      }, start);
      await page.keyboard.up('ArrowUp');
      await assertIdentity(page, expected);

      await page.evaluate(() => window.__RELAY_TEST__.interact('normandy:briefing'));
      await page.getByRole('button', { name: /Mission comprise/ }).click();
      await page.getByRole('button', { name: /Préparer le déploiement/ }).click();
      await idle(page, 'eden-prime');
      await assertIdentity(page, expected);
      await page.evaluate(() => window.__RELAY_TEST__.startBattle('eden-prime:encounter-1'));
      await page.waitForFunction(() => window.__RELAY_TEST__.getWorld().battleActors.has('shepard'));
      const battle = await page.evaluate(() => {
        const qa = window.__RELAY_TEST__, actor = qa.getWorld().battleActors.get('shepard');
        return { id: actor.id, key: actor.key, name: qa.getBattle().actors.find(entry => entry.id === 'shepard').name, texture: actor.body.material.map?.image?.src };
      });
      assert.equal(battle.id, 'shepard');
      assert.equal(battle.name, expected.name);
      assert.equal(battle.key, expected.appearance === 'female' ? 'femshep' : 'shepard');
      assert.ok(battle.texture?.includes(expected.appearance === 'female' ? 'npc-atlas.png' : 'crew-atlas.png'));
      report.scenarios.push({ appearance: expected.appearance, creation: true, dossier: true, saveExport: true, saveReload: true, saveImport: true, keyboardMovement: true, exploration: true, combat: true, ...(expected.appearance === 'female' ? { legacyMigration: true } : {}) });
    } catch (error) {
      await page.screenshot({ path: fileURLToPath(new URL(`commander-${expected.appearance}-failure.png`, out)) }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedRequests, []);
  report.passed = true;
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await writeFile(new URL('commander-report.json', out), `${JSON.stringify(report, null, 2)}\n`);
}

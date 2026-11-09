import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await context.newPage(); const cdp = await context.newCDPSession(page);
const report = { passed: false, at: new Date().toISOString(), checks: [], errors: [],
  scope: 'Independent review of frontier-ui.js/css and main integration. Native post-Council fixture is explicitly prepared with state callbacks; not an end-to-end campaign replay.' };
page.on('pageerror', error => report.errors.push(error.message));
const keys = () => page.evaluate(() => [...window.__RELAY_TEST__.getWorld().keys]);
const point = async selector => { const box = await page.locator(selector).boundingBox(); assert.ok(box); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; };
const finger = (id, point) => ({ id, ...point, radiusX: 1, radiusY: 1, force: 1 });
try {
  await page.goto('http://127.0.0.1:4173/?qa=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.__RELAY_TEST__.begin());
  await page.getByRole('button', { name: 'Je rejoins le briefing.' }).click();
  await page.waitForFunction(() => !window.__RELAY_TEST__.getUI().busy);
  await page.evaluate(async () => {
    const { zoneEncounters, winEncounter, completeZone, recruit, decodeSave, encodeSave } = await import('/src/state.js');
    const { recordVisit } = await import('/src/story.js'); const state = window.__RELAY_TEST__.getState(); state.flags.briefed = true;
    state.zone = 'eden-prime'; recordVisit(state, state.zone); for (const id of zoneEncounters(state.zone)) if (!winEncounter(state, id)) throw new Error('Fixture Eden callback failed');
    if (!completeZone(state, state.zone)) throw new Error('Fixture Eden objective failed');
    state.zone = 'citadel'; recordVisit(state, state.zone); recruit(state, 'tali'); if (!completeZone(state, state.zone)) throw new Error('Fixture Council failed');
    if (!decodeSave(encodeSave(state))) throw new Error('Fixture native save invalid');
    await window.__RELAY_TEST__.travel('therum');
  });
  await page.waitForFunction(() => !window.__RELAY_TEST__.getUI().busy && window.__RELAY_TEST__.getState().zone === 'therum');
  const parking = await page.evaluate(() => window.__RELAY_TEST__.getWorld().makoState.position);
  await page.evaluate(parking => window.__RELAY_TEST__.getWorld().setPosition(parking), parking);
  await page.waitForFunction(() => document.querySelector('[data-do="interact"]')?.textContent.includes('Monter à bord'));
  await page.keyboard.press('e'); assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().isVehicleMounted()), true);
  await page.keyboard.down('e'); // repeat events while held must not toggle again
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', repeat: true, bubbles: true })));
  await page.keyboard.up('e');
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().isVehicleMounted()), false);
  // The first non-repeat keydown above intentionally descends. Reboard explicitly.
  if (!await page.evaluate(() => window.__RELAY_TEST__.getWorld().isVehicleMounted())) await page.keyboard.press('e');
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().isVehicleMounted()), true);
  report.checks.push('Keyboard E boards/leaves once; the repeated event does not toggle twice.');
  await page.waitForSelector('.mobile-pad .boost');
  const up = finger(1, await point('.mobile-pad .up')), boost = finger(2, await point('.mobile-pad .boost'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [up] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [up, boost] });
  assert.deepEqual((await keys()).sort(), ['ArrowUp', 'ShiftLeft']);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [boost] });
  assert.deepEqual(await keys(), ['ArrowUp']);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); assert.deepEqual(await keys(), []);
  report.checks.push('CDP real two-finger direction plus boost stores both keys; ending boost preserves direction, final release clears all.');
  const down = finger(3, await point('.mobile-pad .down')), boost2 = finger(4, await point('.mobile-pad .boost'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [down, boost2] });
  assert.equal((await keys()).length, 2); await page.keyboard.press('Escape'); assert.deepEqual(await keys(), []);
  assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getUI().screen), 'pause');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click(); assert.deepEqual(await keys(), []);
  report.checks.push('Escape pause during two-finger hold clears direction and boost; released touches do not resume motion.');
  // A HUD target change destroys the captured pad DOM. Document release must still clear keys.
  const up2 = finger(5, await point('.mobile-pad .up'));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [up2] });
  await page.evaluate(() => { const qa = window.__RELAY_TEST__; qa.getState().name = 'Fixture HUD redraw'; qa.render(); });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); assert.deepEqual(await keys(), []);
  report.checks.push('Ending a touch after a forced HUD replacement clears its key.');
  await page.keyboard.press('e'); assert.equal(await page.evaluate(() => window.__RELAY_TEST__.getWorld().isVehicleMounted()), false);
  await page.keyboard.down('ArrowUp'); assert.ok((await keys()).includes('ArrowUp'));
  await page.keyboard.press('Escape'); assert.deepEqual(await keys(), []); await page.keyboard.up('ArrowUp');
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click(); assert.deepEqual(await keys(), []);
  report.checks.push('Keyboard movement also clears on pause and does not stick after release.');
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) { report.error = error.stack; process.exitCode = 1; }
finally { await writeFile(new URL('../docs/qa/frontier-ui-independent-review.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`); await browser.close(); }
console.log(JSON.stringify(report));

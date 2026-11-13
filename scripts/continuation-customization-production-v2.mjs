// Production-only continuation of the successful DEV03 public collector.
// The seven functional groups and thirteen captures remain unchanged. Extra
// checks bind every loaded JS/CSS response and both dist reads to this run.
// V2 classifies only the exact optional-browser-favicon 404 console event as
// a declared resource warning; all raw console errors remain recorded.
import assert from 'node:assert/strict';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { actorFor } from '../src/game-data.js';
import { buyItem, equipItem, SLOTS } from '../src/loadout.js';
import { CUSTOMIZATION_OPTIONS, createCustomizationDraft, prepareCustomizationEquipment, customizationPreviewState } from '../src/customization.js';
import { sha, sourceHashes } from './completion-evidence.mjs';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4196/');
const prefix = process.env.CONTINUATION_CUSTOMIZATION_PREFIX || 'continuation-customization-production-final-02', mode = 'production';
assert.match(prefix, /^continuation-customization-[a-z0-9-]+$/);
assert.ok(!process.env.CONTINUATION_CUSTOMIZATION_MODE || process.env.CONTINUATION_CUSTOMIZATION_MODE === mode, 'This collector tests production only.');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Fresh prefix required; preserve previous attempts.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(new URL('docs/screenshots/', root), { recursive: true });
const developmentReportPath='docs/qa/continuation-customization-dev-final-03-report.json';
const developmentReportBytes=await readFile(new URL(developmentReportPath,root)),developmentReport=JSON.parse(developmentReportBytes);
assert.equal(developmentReport.passed,true);assert.equal(developmentReport.checks.length,7);assert.equal(developmentReport.captures.length,13);
const developmentCollectorBytes=await readFile(new URL(developmentReport.collector.path,root));
assert.equal(sha(developmentCollectorBytes),developmentReport.collector.sha256);
assert.equal(sha(await readFile(new URL('scripts/continuation-customization-public.mjs',root))),developmentReport.collector.sha256,'The successful DEV03 collector is preserved.');
const previousProductionReportPath='docs/qa/continuation-customization-production-final-01-report.json';
const previousProductionReportBytes=await readFile(new URL(previousProductionReportPath,root)),previousProductionReport=JSON.parse(previousProductionReportBytes);
assert.equal(previousProductionReport.passed,false);assert.equal(previousProductionReport.checks.length,7);assert.equal(previousProductionReport.captures.length,13);
const previousProductionCollectorBytes=await readFile(new URL(previousProductionReport.collector.path,root));
assert.equal(sha(previousProductionCollectorBytes),previousProductionReport.collector.sha256);
assert.equal(sha(await readFile(new URL('scripts/continuation-customization-production.mjs',root))),previousProductionReport.collector.sha256,'The rejected PROD01 collector is preserved.');
const optionalFaviconURL=new URL('/favicon.ico',url).href,optionalFavicon404='Failed to load resource: the server responded with a status of 404 (Not Found)';
const paths = ['src/main.js','src/state.js','src/save-slots.js','src/loadout.js','src/game-data.js','src/customization.js','src/customization-ui.js','src/customization-ui.css','src/customization-render.js','scripts/continuation-customization-public.mjs','scripts/continuation-customization-production.mjs','scripts/continuation-customization-production-v2.mjs'];
const registryPaths=['src/universe-data.js'],strictPaths=[...paths,...registryPaths];
const collectorBytes=await readFile(new URL(import.meta.url)),collectorPath=`docs/qa/${prefix}-collector.mjs`;
try{await access(new URL(collectorPath,root));throw Error('Fresh prefix required; preserve an existing collector snapshot even without its report.');}catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile(new URL(collectorPath,root),collectorBytes);
const report = { passed: false, at: new Date().toISOString(), mode, url: url.href, sourceHashes: await sourceHashes(strictPaths),registryContextHashes:await sourceHashes(registryPaths),
  collector:{originalPath:'scripts/continuation-customization-production-v2.mjs',path:collectorPath,sha256:sha(collectorBytes)},
  developmentProvenance:{reportPath:developmentReportPath,reportSha256:sha(developmentReportBytes),collectorPath:developmentReport.collector.path,collectorSha256:sha(developmentCollectorBytes),passed:true,checks:7,captures:13},
  previousProductionProvenance:{reportPath:previousProductionReportPath,reportSha256:sha(previousProductionReportBytes),collectorPath:previousProductionReport.collector.path,collectorSha256:sha(previousProductionCollectorBytes),passed:false,checks:7,captures:13,reason:'PROD01 refused two exact optional-browser-favicon 404 console events; its report, collector and captures remain unchanged.'},
  resourceWarningPolicy:{url:optionalFaviconURL,consoleMessage:optionalFavicon404,scope:'Only a console error matching BOTH this exact URL and this exact message is classified as an optional browser favicon resource warning. Every raw error is retained; every other error remains blocking.'},
  baseCommit: '5d933068cacd1b595d584b7cedfffd35b1db362d',
  command: { script: 'node scripts/continuation-customization-production-v2.mjs', environment: { GAME_URL: url.href, CONTINUATION_CUSTOMIZATION_PREFIX: prefix, CONTINUATION_CUSTOMIZATION_MODE: mode } },
  scope: 'Remaining exact functional FACE, equipment and QA workshop clauses. Public import, cosmetic changes, nine ports, ownership refusals, preparation, cancel/apply, auto/manual/JSON reload, invalid and legacy imports, responsive keyboard path.',
  limitations: ['Native fixtures grant explicit credits, XP and equipment; acquisition and campaign travel are not played.', 'No private runtime state, QA observer, DOM/CSS mutation, clock injection or localStorage access is used.', 'Software Chromium viewports do not establish physical phone, controller, Electron/Windows or artistic/canonical 1:1 fidelity.'],
  checks: [], captures: [], fixtures: [], exports: [], faceObservations: [], equipmentObservations: [], layouts: [], errors: [], rawConsoleErrors: [],consoleErrors: [],resourceWarnings: [], failedRequests: [], sourceRequests: [], loadedCodeRequests: [], codeResponseErrors: [], servedFiles: [], distFiles: {}, distFrozen:false,sourceFrozen:false };
let browser, page;const pendingCodeResponses=[];
const action = (name, id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const choice = (field, id) => page.locator(`[data-do="custom-choice"][data-field="${field}"][data-id="${id}"]`);
const gear = (slot, id) => page.locator(`[data-do="custom-equip"][data-slot="${slot}"][data-id="${id}"]`);
const check = (name, details = {}) => { report.checks.push({ name, passed: true, ...details }); console.log(JSON.stringify({ check: name, passed: true })); };
const stable = state => { const copy = structuredClone(state); delete copy.position; delete copy.playedSeconds; return copy; };
async function capture(label, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)), animations: 'disabled' });
  report.captures.push({ label, path, sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(), source: 'Actual public browser viewport; no injected content.' });
}
async function settle() { await page.locator('#transition.active').waitFor({ state: 'hidden' }); }
async function pause() { await settle(); await page.keyboard.press('Escape'); await action('export').waitFor({ state: 'visible' }); }
async function exportSave(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), action('export').click()]);
  const bytes = await readFile(await download.path()), path = `docs/qa/${prefix}-${label}-export.json`;
  await writeFile(new URL(path, root), bytes); const state = decodeSave(bytes.toString()); assert.ok(state, label);
  report.exports.push({ label, path, sha256: sha(bytes), bytes: bytes.length }); return state;
}
async function importText(label, text, expected = true) {
  const path = `docs/qa/${prefix}-${label}-fixture.json`; await writeFile(new URL(path, root), text);
  report.fixtures.push({ label, path, sha256: sha(text), origin: 'Explicit Node fixture or intentionally malformed JSON; submitted through the public file chooser.' });
  if (!expected) await page.waitForFunction(() => !document.querySelector('.toast.error'));
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), action('import').click()]);
  await chooser.setFiles({ name: `${label}.json`, mimeType: 'application/json', buffer: Buffer.from(text) });
  if (expected) { await page.locator('#hud:not(.hidden)').waitFor(); await settle(); await pause(); }
  else await page.locator('.toast.error').filter({ hasText: /invalide|illisible|Impossible d’importer/ }).first().waitFor();
}
async function drawing() {
  return page.locator('.custom-portrait-frame svg').evaluate(svg => JSON.stringify([...svg.querySelectorAll('path,ellipse,circle,stop,g')].map(element => [element.tagName,
    ...[...element.attributes].filter(attribute => ['d','fill','stroke','stroke-width','cx','cy','rx','ry','r','offset','stop-color'].includes(attribute.name)).map(attribute => [attribute.name, attribute.value])])));
}
async function canvasSignature() {
  await page.locator('[data-custom-canvas][data-ready="true"]').waitFor();
  return sha(await page.locator('[data-custom-canvas]').evaluate(canvas => canvas.toDataURL()));
}
async function compare(expectedState, baseline, label) {
  const observed = await page.locator('.custom-stat[data-stat]').evaluateAll(rows => rows.map(row => ({ key: row.dataset.stat, before: Number(row.dataset.before), after: Number(row.dataset.after), text: row.innerText })));
  const before = actorFor('shepard', baseline), after = actorFor('shepard', expectedState);
  for (const row of observed) {
    const neutral = /Multiplier$/.test(row.key) ? 1 : 0, current = before[row.key] ?? neutral, proposed = after[row.key] ?? neutral;
    assert.ok(Math.abs(row.before - current) < 1e-9, `${label}/${row.key}: before`);
    assert.ok(Math.abs(row.after - proposed) < 1e-9, `${label}/${row.key}: after`);
    if (['techMultiplier','bioticMultiplier'].includes(row.key)) assert.ok(row.text.includes(proposed.toFixed(2).replace('.', ',')));
  }
  assert.ok(observed.length >= 8); return observed;
}
async function inspection(slot, id, status) {
  const panel = page.locator('[data-custom-inspection]');
  assert.equal(await panel.getAttribute('data-inspection-slot'), slot); assert.equal(await panel.getAttribute('data-inspection-id'), id);
  assert.equal(await panel.getAttribute('data-inspection-status'), status);
  if (status === 'unavailable') { assert.equal(await panel.locator('[data-item-stat]').count(), 0); assert.ok((await panel.innerText()).length > 100); assert.equal(await gear(slot, id).isDisabled(), true); }
  const text = await panel.innerText(); report.equipmentObservations.push({ slot, id, status, text }); return text;
}
async function tabTo(selector) {
  for (let count = 0; count < 180; count++) {
    if (await page.evaluate(selector => document.activeElement.matches(selector), selector)) return;
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('.customization-screen')), true);
  }
  throw Error(`Keyboard target unreachable: ${selector}`);
}
async function visibleFocus() {
  const info = await page.evaluate(() => { const element = document.activeElement, box = element.getBoundingClientRect(), style = getComputedStyle(element);
    const hit = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
    return { action: element.dataset.do, id: element.dataset.id, inside: !!element.closest('.customization-screen'),
      visible: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight && !!hit && element.contains(hit),
      outline: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow }; });
  assert.equal(info.inside, true); assert.equal(info.visible, true);
  assert.ok(info.outline !== 'none' && info.outlineWidth !== '0px' || info.boxShadow !== 'none'); return info;
}
async function layout() {
  const observation = await page.locator('.customization-screen').evaluate(root => ({ viewport: { width: innerWidth, height: innerHeight },
    documentOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    horizontalOverflows: [...root.querySelectorAll('*')].filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(element).overflowX)).map(element => element.className) }));
  assert.equal(observation.documentOverflow, false); assert.deepEqual(observation.horizontalOverflows, []);
  const controls = page.locator('.customization-screen button:visible:not(:disabled), .customization-screen select:visible');
  for (let index = 0; index < await controls.count(); index++) {
    await controls.nth(index).scrollIntoViewIfNeeded(); const box = await controls.nth(index).boundingBox();
    assert.ok(box && box.x >= -1 && box.x + box.width <= page.viewportSize().width + 1, `control ${index} horizontally available`);
  }
  report.layouts.push(observation); return observation;
}
async function tree(directory, prefix = '') {
  const files={};
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left,right)=>left.name.localeCompare(right.name))) {
    const target = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory), path = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(files,await tree(target, path + '/')); else { const bytes = await readFile(target); files[path] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return files;
}
async function verifyLoadedCode(response){
  const responseURL=new URL(response.url()),path=decodeURIComponent(responseURL.pathname).slice(1);
  assert.equal(responseURL.origin,url.origin,'Loaded JavaScript and CSS must come from the production origin.');
  assert.equal(response.status(),200,`Loaded production code status: ${path}`);
  assert.ok(report.distFiles[path],`Loaded production code exists in initial dist: ${path}`);
  const failed=await response.finished();assert.equal(failed,null,`Loaded code response completes: ${path}`);
  const bytes=await response.body(),digest=sha(bytes);
  assert.equal(digest,report.distFiles[path].sha256,`Actually loaded code matches initial dist: ${path}`);
  report.servedFiles.push({path,url:response.url(),sha256:digest,bytes:bytes.length,matchesDist:true,source:'actual browser JS/CSS response, including late loads'});
}
const isCodeRequest=request=>['script','stylesheet'].includes(request.resourceType())||/\.(?:js|css)$/i.test(new URL(request.url()).pathname);
function fixture() {
  const state = newGame({ name: 'Atelier continuation', appearance: 'female', classId: 'sentinel', origin: 'colonist', psychologicalProfile: 'war-hero' });
  state.xp = 2100; state.credits = 20000; state.settings.sound = false; state.settings.reducedMotion = true;
  for (const id of ['striker-iii','phoenix-human-iii','onyx-turian-i','heat-sink-i','heat-sink-i','armor-piercing-rounds-i','hardened-weave-i','shield-battery-i','omni-tool-upgraded','biotic-amp-upgraded']) assert.equal(buyItem(state, id).ok, true, id);
  assert.equal(equipItem(state, 'kaidan', 'phoenix-human-iii', 'armor').ok, true);
  assert.equal(equipItem(state, 'kaidan', 'kessler-i', 'weapon').ok, true);
  assert.ok(decodeSave(encodeSave(state))); return state;
}
try {
  report.distFiles=await tree(new URL('dist/',root));report.distManifestSha256=sha(JSON.stringify(report.distFiles));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  report.browser = browser.version(); page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'){
    const event={text:message.text(),location:message.location()};report.rawConsoleErrors.push(event);
    if(event.location.url===optionalFaviconURL&&event.text===optionalFavicon404)report.resourceWarnings.push({...event,code:'optional-browser-favicon-404',origin:'console'});
    else report.consoleErrors.push(event);
  }});
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { const pathname=new URL(request.url()).pathname;
    if (/\/(?:src\/|node_modules\/|@(?:vite|fs|id)\/)/.test(pathname)) report.sourceRequests.push(request.url());
    if(isCodeRequest(request))report.loadedCodeRequests.push({url:request.url(),resourceType:request.resourceType()});
  });
  page.on('response', response => {
    if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() });
    if(isCodeRequest(response.request())||/(?:javascript|ecmascript|text\/css)/i.test(response.headers()['content-type']||''))pendingCodeResponses.push(verifyLoadedCode(response).catch(error=>report.codeResponseErrors.push({url:response.url(),error:error.stack||String(error)})));
  });
  const response = await page.goto(url.href, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  assert.equal(await page.evaluate(() => Object.hasOwn(window, '__RELAY_TEST__')), false, 'No QA query or harness is used.');
  if (mode === 'production') {
    const html = await response.text(); assert.equal(sha(html), report.distFiles['index.html'].sha256);
    report.servedFiles.push({path:'index.html',sha256:sha(html),bytes:Buffer.byteLength(html),matchesDist:true,source:'actual browser navigation response'});
    for (const match of html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)) {
      const path = new URL(match[1], url).pathname.slice(1), bytes = await (await page.request.get(new URL(match[1], url).href)).body();
      assert.equal(sha(bytes), report.distFiles[path].sha256); report.servedFiles.push({ path, sha256: sha(bytes), matchesDist: true,source:'explicit verification of HTML entry reference' });
    }
    assert.deepEqual(report.sourceRequests, []);
  }
  const initial = fixture(); await importText('prepared', encodeSave(initial)); const baseline = await exportSave('baseline');
  assert.deepEqual(stable(baseline), stable(initial)); await action('customization').click();
  const beforeDrawing = await drawing(); await choice('face.preset','veteran').click(); assert.notEqual(await drawing(), beforeDrawing);
  await choice('face.preset','standard').click(); assert.equal(await drawing(), beforeDrawing);
  for (const skin of CUSTOMIZATION_OPTIONS.skinTones) {
    await choice('face.skinTone', skin.id).click(); const signature = await drawing();
    assert.ok(signature.includes(skin.color)); report.faceObservations.push({ field: 'face.skinTone', value: skin.id, drawingSha256: sha(signature), palette: skin.color });
    await capture(`skin-${skin.id}`, '.custom-portrait-frame');
  }
  assert.equal(new Set(report.faceObservations.map(item => item.drawingSha256)).size, 6);
  await choice('face.hairStyle','tied').click(); await choice('face.hairColor','white').click();
  assert.equal(await choice('face.hairStyle','tied').getAttribute('aria-pressed'), 'true');
  await choice('face.hairStyle','swept').click(); assert.equal(await choice('face.hairColor','white').getAttribute('aria-pressed'), 'true');
  await choice('face.eyeColor','green').click(); const eye = await page.locator('.custom-portrait-frame svg g').first().getAttribute('fill'); assert.equal(eye, '#75895a');
  await compare(baseline, baseline, 'cosmetics'); await capture('hair-eyes', '.custom-portrait-frame');
  await action('custom-cancel').click(); assert.deepEqual(stable(await exportSave('cancelled')), stable(baseline));
  await action('customization').click(); assert.equal(await drawing(), beforeDrawing); await action('custom-cancel').click();
  check('Face controls change real drawings, preset return and cancellation restore the previous portrait, cosmetic stats remain unchanged');

  await action('customization').click(); await action('custom-tab','armor').click();
  for (const id of ['phoenix-human-iii','onyx-turian-i']) { await action('custom-inspect',id).click(); await inspection('armor',id,'unavailable'); }
  await capture('armor-refusals', '[data-custom-inspection]');
  await action('custom-tab','weapons').click(); await action('custom-inspect','kessler-i').click(); await inspection('weapon','kessler-i','unavailable');
  check('Reserved armor and weapon and incompatible armor explain their refusal and project no gain');
  let draft = createCustomizationDraft(baseline); draft.customization.face.eyeColor = 'green'; draft.customization.face.skinTone = 'deep'; draft.customization.face.hairStyle = 'tied'; draft.customization.face.hairColor = 'white'; draft.customization.face.preset = 'veteran';
  await action('custom-tab','character').click(); for (const [field,value] of Object.entries(draft.customization.face)) await choice(`face.${field}`,value).click();
  draft.customization.armor = { ...draft.customization.armor, primary: 'teal', pattern: 'split', finish: 'matte', helmet: 'visible' };
  await action('custom-tab','armor').click(); const cosmeticChanges=[];let priorCanvas=await canvasSignature();
  for (const [field,value] of Object.entries(draft.customization.armor)) {
    await choice(`armor.${field}`,value).click();const next=await canvasSignature();
    if(['primary','pattern','finish','helmet'].includes(field))assert.notEqual(next,priorCanvas,`${field}: visible canvas drawing changes`);
    cosmeticChanges.push({field,value,canvasSha256:next});priorCanvas=next;
  }
  report.armorDrawingChanges=cosmeticChanges;await capture('armor-pattern-finish-helmet','.customization-preview');
  await compare(baseline, baseline, 'armor cosmetics');
  const visited = new Set();
  for (const [slot,id] of [['armor',null],['armor','onyx-human-i'],['armorMod','shield-battery-i'],['armorMod2','hardened-weave-i'],['weapon','striker-iii'],['weaponMod','heat-sink-i'],['weaponMod2','heat-sink-i'],['ammoMod','armor-piercing-rounds-i'],['omniTool','omni-tool-upgraded'],['bioticAmp','biotic-amp-upgraded']]) {
    await action('custom-tab',['armor','armorMod','armorMod2'].includes(slot) ? 'armor' : 'weapons').click(); await action('custom-slot',slot).click();
    if (id) {
      const before = JSON.stringify(await page.locator('.custom-loadout-summary').innerText());
      await action('custom-inspect',id).click(); assert.equal(JSON.stringify(await page.locator('.custom-loadout-summary').innerText()), before, 'Inspection leaves the draft summary intact.');
    }
    const staged = prepareCustomizationEquipment(baseline,draft,slot,id); assert.equal(staged.ok,true,slot); draft = staged.draft;
    await gear(slot,id || '').click(); visited.add(slot); await compare(customizationPreviewState(baseline,draft), baseline, slot);
  }
  assert.equal(visited.size, SLOTS.length);
  await action('custom-slot','ammoMod').click(); await gear('ammoMod','').click(); draft = prepareCustomizationEquipment(baseline,draft,'ammoMod',null).draft;
  await compare(customizationPreviewState(baseline,draft),baseline,'ammo removed');
  assert.equal(draft.equipment.weaponMod,'heat-sink-i'); await gear('ammoMod','armor-piercing-rounds-i').click(); draft = prepareCustomizationEquipment(baseline,draft,'ammoMod','armor-piercing-rounds-i').draft;
  const prepared = customizationPreviewState(baseline,draft); report.preparedComparison = await compare(prepared,baseline,'all nine ports');
  await capture('nine-port-comparison','.custom-stats');
  await action('custom-slot','weapon').click(); await action('custom-inspect','lancer-i').click();
  assert.equal(await page.locator('.custom-returned-modules li').count(),3);
  await action('custom-tab','armor').click(); await gear('armor','').click(); const removed = prepareCustomizationEquipment(baseline,draft,'armor',null); assert.equal(removed.ok,true); assert.equal(removed.returnedMods.length,2);
  await compare(customizationPreviewState(baseline,removed.draft),baseline,'two armor modules released');
  await action('custom-cancel').click(); assert.deepEqual(stable(await exportSave('inspection-preparation-cancelled')),stable(baseline));
  check('Nine ports prepare on a detached draft; ammo preserves modules; parent replacement returns three weapon and two armor modules; cancel preserves all quantities and ally assignments');

  // Apply the exact complete prepared configuration through public controls.
  await action('customization').click(); await action('custom-tab','character').click(); for (const [field,value] of Object.entries(draft.customization.face)) await choice(`face.${field}`,value).click();
  await action('custom-tab','armor').click(); for (const [field,value] of Object.entries(draft.customization.armor)) await choice(`armor.${field}`,value).click();
  for (const slot of SLOTS) {
    await action('custom-tab',['armor','armorMod','armorMod2'].includes(slot) ? 'armor' : 'weapons').click(); await action('custom-slot',slot).click();
    const id = draft.equipment[slot]; if (await gear(slot,id || '').isEnabled()) await gear(slot,id || '').click();
  }
  await compare(prepared,baseline,'before apply'); await action('custom-apply').click(); const applied = await exportSave('applied');
  assert.deepEqual(stable(applied),stable(prepared)); assert.deepEqual(applied.inventory.items,baseline.inventory.items); assert.deepEqual(applied.inventory.equipped.kaidan,baseline.inventory.equipped.kaidan);
  await action('manual-saves').click(); await page.locator('#manual-save-name-1').fill('Atelier neuf ports'); await action('manual-save','1').click(); await capture('manual-save');
  await action('manual-load','1').click(); await pause(); assert.deepEqual(stable(await exportSave('manual-reloaded')),stable(applied));
  await page.reload({waitUntil:'networkidle'}); await action('continue').click(); await pause(); assert.deepEqual(stable(await exportSave('automatic-reloaded')),stable(applied));
  const downloadedApplied = await readFile(new URL(report.exports.find(item => item.label === 'applied').path,root),'utf8');
  await action('quit').click(); await importText('roundtrip-json',downloadedApplied); assert.deepEqual(stable(await exportSave('json-reimported')),stable(applied));
  check('Apply preserves credits XP quests and allies; eye palette and all nine slots survive manual, automatic and exported JSON reload');

  for (const field of ['preset','hairColor','hairStyle']) {
    const invalid=JSON.parse(encodeSave(applied));invalid.state.customization.face[field]='unknown';await action('quit').click();await importText(`invalid-${field}`,JSON.stringify(invalid),false);
    await action('continue').click();await pause();assert.deepEqual(stable(await exportSave(`after-invalid-${field}`)),stable(applied));
  }
  const legacy=JSON.parse(encodeSave(applied));delete legacy.state.customization;await action('quit').click();await importText('legacy',JSON.stringify(legacy));const migrated=await exportSave('legacy-migrated');
  const expectedLegacy=structuredClone(applied);expectedLegacy.customization=newGame({appearance:applied.appearance}).customization;assert.deepEqual(stable(migrated),stable(expectedLegacy));
  check('Unknown preset and hair enums are rejected without replacing the current campaign; absent historical cosmetics migrate without losing any other field');

  await action('customization').click(); await layout(); await page.keyboard.press('Tab');
  await tabTo('[data-do="custom-choice"][data-field="face.eyeColor"][data-id="grey"]');await page.keyboard.press('Enter');await visibleFocus();
  await tabTo('[data-do="custom-tab"][data-id="armor"]');await page.keyboard.press('Enter');
  await tabTo('[data-do="custom-choice"][data-field="armor.primary"][data-id="purple"]');await page.keyboard.press('Space');await visibleFocus();
  await tabTo('[data-do="custom-tab"][data-id="weapons"]');await page.keyboard.press('Enter');
  await tabTo('[data-do="custom-slot"][data-id="omniTool"]');await page.keyboard.press('Enter');
  await tabTo('[data-do="custom-equip"][data-slot="omniTool"][data-id=""]'); await page.keyboard.press('Enter'); await visibleFocus();
  await tabTo('[data-do="custom-equip"][data-slot="omniTool"][data-id="omni-tool-upgraded"]');await page.keyboard.press('Enter');report.keyboardPrepareFocus=await visibleFocus();
  report.keyboardPoseFocus=[];for(const pose of ['aim','power','hit','down','field']){await tabTo(`[data-do="custom-pose"][data-id="${pose}"]`);await page.keyboard.press('Enter');report.keyboardPoseFocus.push(await visibleFocus());}
  await capture('keyboard-focus');
  await page.keyboard.press('Escape');assert.deepEqual(stable(await exportSave('keyboard-cancelled')),stable(migrated));
  await page.setViewportSize({width:390,height:844});await action('customization').click();await layout();await action('custom-tab','armor').click();await layout();await capture('mobile-armor','[data-do="custom-apply"]');
  await action('custom-tab','weapons').click();await layout();await page.keyboard.press('Escape');
  check('Desktop and mobile controls remain horizontally available; real Tab Enter pose and prepare retain visible focus; Escape cancels the keyboard draft');
  await page.setViewportSize({width:1440,height:1000});
  const soldier=newGame({name:'Soldat sans biotique',classId:'soldier'});soldier.credits=1000;soldier.settings.sound=false;
  assert.equal(buyItem(soldier,'biotic-amp-upgraded').ok,true);await action('quit').click();await importText('soldier-module',encodeSave(soldier));
  const soldierBefore=await exportSave('soldier-before');await action('customization').click();await action('custom-tab','weapons').click();await action('custom-slot','bioticAmp').click();await action('custom-inspect','biotic-amp-upgraded').click();await inspection('bioticAmp','biotic-amp-upgraded','unavailable');
  await action('custom-cancel').click();const soldierAfter=await exportSave('soldier-after');assert.deepEqual(stable(soldierAfter),stable(soldierBefore));assert.deepEqual(actorFor('shepard',soldierAfter).powers,actorFor('shepard',soldierBefore).powers);
  check('An owned amplifier cannot grant biotics to a Soldier; workshop refusal preserves the complete save and power set');
  await page.waitForLoadState('networkidle');
  const codeResults=await Promise.allSettled(pendingCodeResponses);
  for(const result of codeResults)if(result.status==='rejected')report.codeResponseErrors.push({error:String(result.reason)});
  await browser.close();browser=null;
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.failedRequests,[]);
  assert.deepEqual(report.sourceRequests,[],'No development source request was made at any point in the complete production path.');
  assert.deepEqual(report.codeResponseErrors,[],'Every actual JavaScript/CSS response, including late loads, matches dist.');
  assert.ok(report.loadedCodeRequests.length>0,'Actual browser code requests were observed.');
  for(const request of report.loadedCodeRequests)assert.ok(report.servedFiles.some(file=>file.url===request.url&&file.source.startsWith('actual browser JS/CSS')),'Every actual browser code request has a verified response.');
  report.loadedCodeVerified=true;
  assert.deepEqual(await sourceHashes(strictPaths),report.sourceHashes,'Relevant sources unchanged throughout collection');
  assert.deepEqual(await sourceHashes(registryPaths),report.registryContextHashes,'Generated registry context unchanged throughout collection');report.sourceFrozen=true;
  report.distFilesAfter=await tree(new URL('dist/',root));report.distManifestAfterSha256=sha(JSON.stringify(report.distFilesAfter));
  assert.deepEqual(report.distFilesAfter,report.distFiles,'Complete dist tree and all bytes are unchanged from before browser launch to after browser close.');
  report.distFrozen=true;report.passed=true;
} catch (error) { report.failure=error.stack||String(error);console.error(report.failure);if(page)await capture('failure').catch(()=>{});process.exitCode=1;
} finally { if(browser)await browser.close();report.finishedAt=new Date().toISOString();await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,captures:report.captures.length,report:fileURLToPath(reportPath)})); }

// Public preference journey on the supplied compiled build. The only fault
// injection is an explicitly declared isolated Storage quota/corruption fixture.
import assert from 'node:assert/strict';
import { access, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave } from '../src/state.js';
import { decodeChronicle } from '../src/chronicles.js';
import { COMIC_LIBRARY_PREFERENCES_KEY } from '../src/comic-library-preferences.js';

const root = new URL('../', import.meta.url), endpoint = new URL(process.env.GAME_URL || 'http://127.0.0.1:4332/');
const dist = new URL((process.env.COMIC_LIBRARY_DIST || '/tmp/relay-comics-fields-proof-dist').replace(/\/?$/, '/'), 'file:///');
const prefix = process.env.COMIC_LIBRARY_PROOF_PREFIX || 'comic-library-preferences-public-01';
assert.match(prefix, /^comic-library-preferences-[a-z0-9-]+$/); assert.equal(endpoint.search, '');
const output = new URL(`docs/qa/${prefix}-report.json`, root), collectorPath = `docs/qa/${prefix}-collector.mjs`;
for (const path of [output, new URL(collectorPath, root)]) try { await access(path); throw Error('Preserve every attempt; choose a fresh prefix.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { passed: false, at: new Date().toISOString(), mode: 'production', url: endpoint.href,
  baselineCommit: execFileSync('git', ['rev-parse','HEAD'], { cwd: fileURLToPath(root), encoding: 'utf8' }).trim(),
  command: { script: 'node scripts/comic-library-preferences-public-01.mjs', environment: { GAME_URL: endpoint.href, COMIC_LIBRARY_DIST: fileURLToPath(dist), COMIC_LIBRARY_PROOF_PREFIX: prefix } },
  exactCriterion: 'Sauvegarder, quitter et reprendre avant/après un raccord ne double aucun objet, objectif ou récompense.',
  scope: 'Personal Library Edition sorting/bookmarks/consultation/open sections, canonical owner routing, actual owner archive conclusion and restart; unchanged ME1/owner state, explicit readonly storage errors.',
  inputMethod: 'Actual file chooser, buttons, selects, native details and downloads. Page evaluation reads public DOM or storage bytes only for isolation diagnostics; it never pilots actions from storage.',
  fixtures: [], captures: [], exports: [], checks: [], observations: [], sourceHashes: {}, registryContextHashes: {}, distFiles: {}, servedFiles: [], sourceRequests: [], errors: [], consoleErrors: [], failedRequests: [], warnings: [],
  faultInjection: ['A separate browser context wraps Storage.prototype.setItem only for the library preference key and deliberately throws QuotaExceededError. No game/Chronicle storage, clock, DOM, actor or resource is injected.',
    'Another separate context starts with the sole library preference key containing malformed JSON, using Playwright storageState. Its bytes must be retained and no false successful save is claimed.'],
  limitations: ['The ME1 witness is an unprogressed native newGame uploaded through the real file chooser; no ME1 campaign playthrough is claimed.',
    'The owner conclusion is the existing original archive exercise, not a comic page transcription, original mission, source hardcover inspection or new canon choice.',
    'Preference consultation marks are personal dossier status, not completion of a narrative unit or verification of a physical edition. No page or bibliographic fact is added.'] };
let browser, page; const pending = [], served = new Set();
const check = name => { report.checks.push({ name, passed: true }); console.log(JSON.stringify({ check: name })); };
async function tree(directory, prefixPath = '') {
  const result = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefixPath + item.name, path = new URL(item.name + (item.isDirectory() ? '/' : ''), directory);
    if (item.isDirectory()) Object.assign(result, await tree(path, name + '/'));
    else { const bytes = await readFile(path); result[name] = { bytes: bytes.length, sha256: sha(bytes) }; }
  }
  return result;
}
async function sources() {
  const paths = Object.keys(await tree(new URL('src/', root))).map(path => `src/${path}`);
  paths.push('scripts/comic-library-preferences-public-01.mjs','tests/comic-library-preferences.test.js','tests/comic-library.test.js','package.json','package-lock.json');
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, sha(await readFile(new URL(path, root)))])));
}
const action = (name, id) => page.locator(`[data-do="${name}"]${id ? `[data-id="${id}"]` : ''}`).first();
const click = async locator => { await locator.waitFor({ state: 'visible' }); assert.equal(await locator.isEnabled(), true); await locator.click(); };
async function openLibrary() {
  await action('chronicles').waitFor({state:'visible',timeout:90000}); await click(action('chronicles')); await page.locator('.universe-screen').waitFor();
  await page.locator('#chronicle-media').selectOption('LIB'); await click(action('universe-tab','reading')); await page.locator('[data-comic-library]').waitFor();
}
async function capture(label, focus) {
  if (focus) await focus.scrollIntoViewIfNeeded();
  const path = `docs/screenshots/${prefix}-${label}.png`, bytes = await page.screenshot({ path: fileURLToPath(new URL(path, root)) });
  report.captures.push({ label, path, bytes: bytes.length, sha256: sha(bytes), source: 'Actual unmodified public viewport; no DOM/style/clock changes.' });
}
async function exported(label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click(action('chronicle-export'))]);
  const path = `docs/qa/${prefix}-${label}-export.json`; await download.saveAs(fileURLToPath(new URL(path, root))); assert.equal(await download.failure(), null);
  const bytes = await readFile(new URL(path, root)), session = decodeChronicle(bytes.toString()); assert.ok(session);
  report.exports.push({ label, path, bytes: bytes.length, sha256: sha(bytes) }); return session;
}
async function prefsVisible() {
  assert.equal(await page.locator('#comic-library-sort').inputValue(), 'title');
  assert.equal(await page.locator('details[data-library-section="units:RED"]').getAttribute('open'), '');
  assert.equal(await page.locator('details[data-library-section="edition:omnibus-1"]').getAttribute('open'), '');
  assert.equal(await action('comic-library-bookmark','RED:1').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-library-consultation][data-id="RED:1"]').inputValue(), 'consulted');
  assert.equal(await page.locator('[data-library-bookmark-count]').getAttribute('data-library-bookmark-count'), '1');
  assert.equal(await page.locator('[data-library-consulted-unit-count]').getAttribute('data-library-consulted-unit-count'), '1');
}
async function campaignBytes() {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key === 'relay-chronicles.save.v1' || key.startsWith('relay-chronicles.manual-save.v1.')).sort().map(key => [key, localStorage.getItem(key)])));
}
function observe(target) {
  target.on('pageerror', error => report.errors.push(error.message));
  target.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  target.on('console', message => { if (message.type() !== 'error') return; const exactFavicon = message.location().url === new URL('/favicon.ico', endpoint).href && ['Failed to load resource: the server responded with a status of 404 (Not Found)','Failed to load resource: the server responded with a status of 404 (File not found)'].includes(message.text()); (exactFavicon ? report.warnings : report.consoleErrors).push({ text: message.text(), url: message.location().url }); });
  target.on('response', response => {
    const url = new URL(response.url()); if (url.origin !== endpoint.origin) return;
    if (/^\/(?:src|@vite|@fs)\//.test(url.pathname)) report.sourceRequests.push(url.href);
    if (response.status() >= 400 && !(url.pathname === '/favicon.ico' && response.status() === 404)) report.failedRequests.push({ url: url.href, status: response.status() });
    if (response.status() !== 200) return;
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1)), expected = report.distFiles[path];
    if (!expected) { report.failedRequests.push({ url: url.href, reason: 'Response absent from frozen build' }); return; }
    const job = (async () => { const bytes = await response.body(); assert.equal(bytes.length, expected.bytes, path); assert.equal(sha(bytes), expected.sha256, path); report.responseBodiesVerified = (report.responseBodiesVerified || 0) + 1; if (!served.has(path)) { served.add(path); report.servedFiles.push({ path, bytes: bytes.length, sha256: sha(bytes) }); } })();
    job.catch(() => {}); pending.push(job);
  });
}
try {
  const script = await readFile(new URL(import.meta.url)); await writeFile(new URL(collectorPath, root), script); report.collectorSnapshot = { path: collectorPath, sha256: sha(script) };
  report.sourceHashes = await sources(); report.distFiles = await tree(dist);
  for (const path of ['src/universe-data.js','docs/universe/catalogs/LIB.json']) report.registryContextHashes[path] = sha(await readFile(new URL(path, root)));
  const fixture = encodeSave(newGame({ name: 'Témoin bibliothèque' })), fixturePath = `docs/qa/${prefix}-me1-witness-fixture.json`;
  await writeFile(new URL(fixturePath, root), fixture); report.fixtures.push({ path: fixturePath, bytes: Buffer.byteLength(fixture), sha256: sha(fixture), origin: 'Native unprogressed newGame; actual public upload before any preference operation.' });
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  report.chromium = browser.version(); const regular = await browser.newContext({ viewport: { width:1280, height:1000 }, acceptDownloads:true }); page = await regular.newPage(); observe(page);
  page.setDefaultTimeout(60000); await page.goto(endpoint.href,{waitUntil:'domcontentloaded'}); await action('import').waitFor();
  assert.equal(await page.evaluate(() => Object.hasOwn(window,'__RELAY_TEST__')),false);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'),click(action('import'))]); await chooser.setFiles({name:'me1-witness.json',mimeType:'application/json',buffer:Buffer.from(fixture)});
  await page.locator('#hud:not(.hidden) .location h2').waitFor(); await page.locator('#transition.active').waitFor({state:'hidden'}); await click(action('pause')); await openLibrary();
  const me1 = await campaignBytes();
  await page.locator('#comic-library-sort').selectOption('title');
  const titles = await page.locator('[data-comic-volume="1"] [data-comic-work]').evaluateAll(nodes=>nodes.map(node=>node.dataset.comicWork)); assert.deepEqual(titles,['CON','EVO','HOM','INC','INQ','INV','RED']);
  await click(page.locator('[data-library-section="units:RED"] > summary')); await click(action('comic-library-bookmark','RED:1'));
  await page.locator('[data-library-consultation][data-id="RED:1"]').selectOption('consulted');
  await click(page.locator('[data-library-section="edition:omnibus-1"] > summary')); await prefsVisible();
  await capture('personal-unit-status',page.locator('[data-comic-unit="RED:1"]'));
  await click(action('comic-library-open','omnibus-1/RED')); await page.locator('[data-comic-archive][data-media-id="RED"]').waitFor();
  await click(action('universe-tab','session')); const before = await exported('owner-before-raccord'); await click(action('universe-tab','reading'));
  const dossier = page.locator('[data-do="comic-briefing-open"]').first(), dossierId = await dossier.getAttribute('data-id'); await click(dossier);
  await click(action('comic-briefing-method','trace')); for (const index of [0,1,2]) await click(action('comic-briefing-pick',String(index))); await click(action('comic-briefing-finish','archive'));
  await page.locator('[data-comic-briefing][data-comic-phase="resolved"]').waitFor(); const after = await exported('owner-after-raccord');
  assert.equal(after.comicProgress[dossierId].closed,true); const {comicProgress:beforeProgress,...beforeOther}=before,{comicProgress:afterProgress,...afterOther}=after; assert.deepEqual(afterOther,beforeOther);
  await click(action('comic-library-back')); await prefsVisible();
  assert.equal(await action('comic-library-resume').getAttribute('data-id'),'RED');
  await page.reload({waitUntil:'domcontentloaded'}); await openLibrary(); await prefsVisible();
  await click(action('comic-library-resume')); await page.locator('[data-comic-archive][data-media-id="RED"]').waitFor(); await click(action('comic-briefing-open',dossierId));
  await page.locator('[data-comic-briefing][data-comic-phase="resolved"]').waitFor(); assert.deepEqual(await exported('owner-resumed'),after);
  await click(action('comic-library-back')); await prefsVisible(); assert.deepEqual(await campaignBytes(),me1);
  await page.setViewportSize({width:390,height:844}); await capture('restored-mobile',page.locator('#comic-library-sort')); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  report.observations.push({label:'real-owner-raccord',dossierId,onlyComicProgressChanged:true,me1StorageUnchanged:true,canonicalLastTarget:'RED',bookmarks:1,consultedUnits:1,totalUnits:34});
  check('Sort, unique unit bookmark, personal consultation and expanded sections survive alias routing, actual owner conclusion, browser reload and resume with identical owner export and unchanged ME1 storage.');
  await regular.close();
  const quota = await browser.newContext({viewport:{width:1280,height:1000}});
  await quota.addInitScript(({key})=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Declared QA quota','QuotaExceededError');return original.call(this,name,value);};},{key:COMIC_LIBRARY_PREFERENCES_KEY});
  page=await quota.newPage();page.setDefaultTimeout(60000);observe(page);await page.goto(endpoint.href,{waitUntil:'domcontentloaded'});await openLibrary();
  await page.locator('#comic-library-sort').selectOption('title');await page.locator('[data-library-readonly]').waitFor();assert.equal(await page.locator('#comic-library-sort').isDisabled(),true);assert.equal(await page.locator('#comic-library-sort').inputValue(),'volume');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),COMIC_LIBRARY_PREFERENCES_KEY),null);
  await capture('quota-readonly',page.locator('[data-library-readonly]'));await click(action('comic-library-open','RED'));await page.locator('[data-comic-archive][data-media-id="RED"]').waitFor();
  check('A declared preference-only quota failure is caught, leaves the prior default and stored bytes unchanged, shows readonly status and preserves owner navigation.');
  await quota.close();
  const broken='{invalid-preferences',corrupt=await browser.newContext({viewport:{width:1280,height:1000},storageState:{cookies:[],origins:[{origin:endpoint.origin,localStorage:[{name:COMIC_LIBRARY_PREFERENCES_KEY,value:broken}]}]}});
  const brokenPath=`docs/qa/${prefix}-malformed-preferences-fixture.json`;await writeFile(new URL(brokenPath,root),broken);
  report.fixtures.push({kind:'malformed-library-preferences',path:brokenPath,sha256:sha(broken),bytes:Buffer.byteLength(broken),storageKey:COMIC_LIBRARY_PREFERENCES_KEY,origin:'Declared browser storageState fixture in an independent context; no game or Chronicle state injected.'});
  page=await corrupt.newPage();page.setDefaultTimeout(60000);observe(page);await page.goto(endpoint.href,{waitUntil:'domcontentloaded'});await openLibrary();await page.locator('[data-library-readonly]').waitFor();assert.equal(await page.locator('#comic-library-sort').isDisabled(),true);assert.equal(await page.evaluate(key=>localStorage.getItem(key),COMIC_LIBRARY_PREFERENCES_KEY),broken);
  report.observations.push({label:'corrupt-preferences',readonlyMessage:await page.locator('[data-library-readonly]').innerText(),malformedBytesRetained:true});
  check('A declared malformed preference load preserves its exact bytes, exposes readonly consultation and creates no silent reset.');
  await Promise.all(pending);assert.deepEqual(await sources(),report.sourceHashes);report.sourceFrozen=true;assert.deepEqual(await tree(dist),report.distFiles);report.distFrozen=true;
  for(const[path,expected]of Object.entries(report.registryContextHashes))assert.equal(sha(await readFile(new URL(path,root))),expected);
  assert.deepEqual(report.sourceRequests,[]);for(const key of ['errors','consoleErrors','failedRequests'])assert.deepEqual(report[key],[]);report.passed=true;
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;if(page)try{await capture('failure');}catch{}}
finally{await browser?.close();report.browserClosed=!!browser;try{await Promise.all(pending);for(const key of ['errors','consoleErrors','failedRequests'])assert.deepEqual(report[key],[]);}catch(error){report.passed=false;report.failure ||= error.stack||String(error);process.exitCode=1;}await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,captures:report.captures.length,exports:report.exports.length,output:fileURLToPath(output),failure:report.failure}));}

// Public DOM controls and genuine downloads only. Native Node fixtures prepare
// progression/position; no app state setter, QA hook, CSS or clock injection.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { newGame, encodeSave, decodeSave, recruit, winEncounter, zoneEncounters, completeZone } from '../src/state.js';
import { decodeCampaignExport } from '../src/completion-persistence-campaign.js';
import { recordVisit } from '../src/story.js';
import { getLevelLayout } from '../src/level-layout-data.js';
import { buyItem, equipItem } from '../src/loadout.js';
import { actorFor } from '../src/game-data.js';

const root = new URL('../', import.meta.url), url = new URL(process.env.GAME_URL || 'http://127.0.0.1:4191/');
const prefix = process.env.COMPLETION_PERSISTENCE_PREFIX, mode = process.env.COMPLETION_PERSISTENCE_MODE;
assert.match(prefix || '', /^completion-persistence-[a-z0-9-]+$/); assert.ok(['development','production'].includes(mode));
assert.equal(url.search, '');
const reportPath = new URL(`docs/qa/${prefix}-report.json`, root);
try { await access(reportPath); throw Error('Choose a fresh prefix and preserve this attempt.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['index.html','src/main.js','src/state.js','src/save-slots.js','src/loadout.js','src/customization.js','src/customization-ui.js',
  'src/customization-ui.css','src/customization-render.js','src/completion-persistence-campaign.js','src/campaign-talents.js',
  'src/mission-progress.js','src/game-data.js','src/story.js','src/story-data.js','src/character-data.js','src/operations.js',
  'src/assignments.js','src/world.js','src/world-data.js','src/level-layout-data.js','src/style.css','vite.config.js',
  'scripts/completion-persistence-browser.mjs'];
for(const name of await readdir(new URL('src/',root)))if(/\.(?:js|css|json)$/.test(name)&&!paths.includes(`src/${name}`))paths.push(`src/${name}`);
const registryPaths=['src/universe-data.js'],logicPaths=mode==='development'?paths.filter(path=>!registryPaths.includes(path)):paths;
const hashPaths = async names => Object.fromEntries(await Promise.all(names.map(async path => [path, sha(await readFile(new URL(path, root)))])));
const hashSources = async () => hashPaths(logicPaths);
const registrySourceHashes=await hashPaths(registryPaths),registrySnapshots=[];
for(const path of registryPaths){const bytes=await readFile(new URL(path,root)),snapshot=`docs/qa/${prefix}-registry-${path.replaceAll('/','-')}`;
  assert.equal(sha(bytes),registrySourceHashes[path]);await writeFile(new URL(snapshot,root),bytes);registrySnapshots.push({sourcePath:path,path:snapshot,sha256:sha(bytes),bytes:bytes.length});}
const report = { passed:false, at:new Date().toISOString(), mode, url:url.href, sourceHashes:await hashSources(),registrySourceHashes,registrySnapshots,
  command:{script:'node scripts/completion-persistence-browser.mjs',environment:{GAME_URL:url.href,COMPLETION_PERSISTENCE_PREFIX:prefix,COMPLETION_PERSISTENCE_MODE:mode}},
  scope:'Public corrupted-save warning/new campaign, workshop cancel/reset/apply, six named manual slots and overwrite cancellation, invalid import preserving saved progress, legacy customization migration, full-stock sale refusal, one actual supply claim/reload/repeat, and completed ME1 campaign export. Desktop and mobile viewport evidence.',
  limitations:['Initial corruption bytes are a declared storage fixture. Native prepared campaign saves and supply coordinates are imported through the public file chooser; previous fights and travel are not played.',
    'The final campaign is prepared using native progression callbacks, not a public campaign victory. No ME2 continuation or artistic 1:1 certification is claimed.',
    'Browser screenshots use software rendering. No Windows executable, hardware controller or device performance is certified.'],
  fixtures:[],exports:[],captures:[],checks:[],optionChecks:[],errors:[],consoleErrors:[],failedRequests:[],rawConsoleErrors:[],rawFailedRequests:[],resourceWarnings:[],sourceRequests:[],servedFiles:[],distFiles:{},qaHarnessAvailable:null };
let browser,page; const pendingResponses=[];
const action = (name,id) => page.locator(`[data-do="${name}"]${id === undefined ? '' : `[data-id="${id}"]`}`).first();
const check = (name, details={}) => { report.checks.push({name,passed:true,...details}); console.log(JSON.stringify({check:name,passed:true})); };
async function capture(label) {
  const path=`docs/screenshots/${prefix}-${label}.png`,bytes=await page.screenshot({path:fileURLToPath(new URL(path,root)),animations:'disabled'});
  report.captures.push({label,path,sha256:sha(bytes),bytes:bytes.length,viewport:page.viewportSize(),source:'Actual public viewport; no injected scene, CSS or image.'});
}
async function settled() { await page.waitForFunction(()=>!document.querySelector('#transition')?.classList.contains('active')); }
async function pause() { await settled(); await page.keyboard.press('Escape'); await action('export').waitFor({state:'visible'}); }
async function drawingSignature() {
  return page.locator('.custom-portrait-frame svg').evaluate(svg=>JSON.stringify([...svg.querySelectorAll('path,ellipse,circle,stop,g')].map(element=>[
    element.tagName,...[...element.attributes].filter(attribute=>['d','fill','stroke','stroke-width','cx','cy','rx','ry','r','offset','stop-color'].includes(attribute.name)).map(attribute=>[attribute.name,attribute.value])
  ])));
}
const stable = state => { const copy=structuredClone(state); delete copy.playedSeconds; delete copy.position; return copy; };
async function exportSave(label,kind='save') {
  const [download]=await Promise.all([page.waitForEvent('download'),action(kind==='campaign'?'export-campaign':'export').click()]);
  const bytes=await readFile(await download.path()),path=`docs/qa/${prefix}-${label}.json`; await writeFile(new URL(path,root),bytes);
  const record=kind==='campaign'?decodeCampaignExport(bytes.toString()):decodeSave(bytes.toString());
  assert.ok(record,`Valid ${kind} download: ${label}`); report.exports.push({label,kind,path,sha256:sha(bytes),bytes:bytes.length,suggestedFilename:download.suggestedFilename()}); return record;
}
async function importText(label,text,expected=true) {
  const path=`docs/qa/${prefix}-fixture-${label}.json`; await writeFile(new URL(path,root),text);
  report.fixtures.push({label,path,sha256:sha(text),origin:'Native Node fixture or explicitly malformed JSON, submitted through the public save file input.'});
  await page.locator('#save-import').setInputFiles({name:`${label}.json`,mimeType:'application/json',buffer:Buffer.from(text)});
  if(expected){
    const desired=decodeSave(text);assert.ok(desired);
    await page.waitForFunction(({name,zone,appearance,primary})=>{
      try{const current=JSON.parse(localStorage.getItem('relay-chronicles.save.v1'))?.state;
        return current?.name===name&&current.zone===zone&&current.appearance===appearance&&current.customization?.armor.primary===primary;
      }catch{return false;}
    },{name:desired.name,zone:desired.zone,appearance:desired.appearance,primary:desired.customization.armor.primary});
    await settled();await page.locator('#hud:not(.hidden)').waitFor();await pause();
  }
}
async function editDraft() {
  await action('custom-appearance','male').click(); await page.locator('[data-do="custom-choice"][data-field="face.preset"][data-id="veteran"]').click();
  await action('custom-tab','armor').click(); await page.locator('[data-do="custom-choice"][data-field="armor.primary"][data-id="purple"]').click();
  await action('custom-tab','weapons').click(); await page.locator('[data-do="custom-equip"][data-slot="weapon"][data-id="kessler-i"]').click();
}
function finalFixture() {
  const state=newGame({name:'Bilan explicite',appearance:'female',origin:'earthborn',psychologicalProfile:'ruthless',classId:'sentinel'}); state.flags.briefed=true;
  for(const [zone,choice] of [['eden-prime'],['citadel'],['therum'],['feros','save'],['noveria','release'],['virmire','save-ashley'],['ilos'],['citadel-finale','save-council']]){
    state.zone=zone;state.position=null;recordVisit(state,zone);
    if(zone==='citadel')for(const id of ['tali','garrus','wrex'])assert.equal(recruit(state,id),true);
    else for(const id of zoneEncounters(zone))assert.equal(winEncounter(state,id),true);
    assert.equal(completeZone(state,zone,choice),true);
  }
  state.settings.sound=false;state.settings.reducedMotion=true;assert.ok(decodeSave(encodeSave(state)));return state;
}
function workshopFixture() {
  const state=newGame({name:'Atelier explicite',appearance:'female',classId:'sentinel'});state.xp=2100;state.credits=20_000;state.settings.sound=false;state.settings.reducedMotion=true;
  for(const id of ['heat-sink-i','heat-sink-i','armor-piercing-rounds-i','armor-plating-i','armor-plating-i',
    'omni-tool-upgraded','biotic-amp-upgraded','phoenix-human-iii','onyx-turian-i'])assert.equal(buyItem(state,id).ok,true,id);
  for(const [id,slot] of [['heat-sink-i','weaponMod'],['heat-sink-i','weaponMod2'],['armor-piercing-rounds-i','ammoMod'],['armor-plating-i','armorMod'],['armor-plating-i','armorMod2']])
    assert.equal(equipItem(state,'shepard',id,slot).ok,true,slot);
  assert.ok(decodeSave(encodeSave(state)));return state;
}
async function distTree(directory,prefixPath='') {
  const result={};for(const item of await readdir(directory,{withFileTypes:true})){
    const name=prefixPath+item.name,target=new URL(item.name+(item.isDirectory()?'/':''),directory);
    if(item.isDirectory())Object.assign(result,await distTree(target,name+'/'));
    else{const bytes=await readFile(target);result[name]={bytes:bytes.length,sha256:sha(bytes)};}
  }return result;
}
try {
  if(mode==='production')report.distFiles=await distTree(new URL('dist/',root));
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});page=await context.newPage();page.setDefaultTimeout(30000);
  await page.addInitScript(()=>{if(!sessionStorage.getItem('completion-corruption-fixture')){localStorage.setItem('relay-chronicles.save.v1','{broken checkpoint');sessionStorage.setItem('completion-corruption-fixture','1');}});
  report.fixtures.push({label:'corrupt-automatic-save',storageKey:'relay-chronicles.save.v1',bytes:'{broken checkpoint',origin:'Declared initial storage fixture, applied once before navigation; no live campaign is edited.'});
  page.on('pageerror',error=>report.errors.push(error.stack));page.on('console',message=>{if(message.type()==='error'){
    const error={text:message.text(),location:message.location()};report.consoleErrors.push(error);console.log(JSON.stringify({consoleError:error}));
  }});
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{const requestURL=new URL(response.url());
    if(response.status()>=400)report.failedRequests.push({url:response.url(),status:response.status()});
    if(requestURL.origin!==url.origin)return;
    if(requestURL.pathname.startsWith('/src/'))report.sourceRequests.push(requestURL.pathname);
    if(/\.(?:js|css)$/.test(requestURL.pathname))pendingResponses.push(response.body().then(bytes=>report.servedFiles.push({path:requestURL.pathname,sha256:sha(bytes),bytes:bytes.length})).catch(error=>report.errors.push(error.message)));
  });
  await page.goto(url.href,{waitUntil:'networkidle'});await action('new').waitFor();
  report.qaHarnessAvailable=await page.evaluate(()=>typeof window.__RELAY_TEST__!=='undefined');assert.equal(report.qaHarnessAvailable,false);
  assert.match(await page.locator('.save-warning').innerText(),/Sauvegarde illisible/);assert.equal(await action('continue').count(),0);
  await capture('corrupt-title');check('corrupted automatic save gives clear recovery choices without deleting bytes');
  await action('new').click();await page.locator('#commander-name').fill('Camille');await page.locator('#new-appearance').selectOption('female');
  await page.locator('#new-origin').selectOption('colonist');await page.locator('#new-profile').selectOption('war-hero');await action('class','sentinel').click();
  await action('begin').click();await page.getByRole('button',{name:'Je rejoins le briefing.'}).click();await pause();
  const initial=await exportSave('fresh');assert.equal(initial.name,'Camille');assert.equal(initial.zone,'normandy');assert.equal(initial.credits,250);assert.equal(initial.xp,0);
  assert.deepEqual(initial.completed,[]);assert.deepEqual(initial.choices,{});assert.deepEqual(initial.inventory,newGame({classId:'sentinel'}).inventory);
  await capture('fresh-campaign');check('public new campaign starts with clean profile, choices and inventory');
  await action('customization').click();await editDraft();await capture('workshop-draft');await action('custom-cancel').click();
  assert.deepEqual(stable(await exportSave('after-cancel')),stable(initial));
  await action('customization').click();await editDraft();await action('custom-reset').click();assert.equal(await action('custom-reset').isDisabled(),true);
  await action('custom-tab','character').click();
  assert.equal(await action('custom-appearance','female').getAttribute('aria-pressed'),'true');await action('custom-cancel').click();
  assert.deepEqual(stable(await exportSave('after-reset')),stable(initial));check('public draft, cancel and reset preserve the complete campaign');
  await action('customization').click();await editDraft();await action('custom-apply').click();
  const applied=await exportSave('applied');assert.equal(applied.appearance,'male');assert.equal(applied.customization.face.preset,'veteran');assert.equal(applied.customization.armor.primary,'purple');
  assert.equal(applied.inventory.equipped.shepard.weapon,'kessler-i');assert.deepEqual(applied.inventory.items,initial.inventory.items);assert.deepEqual(applied.inventory.stock,initial.inventory.stock);
  const identity=structuredClone(applied);identity.appearance=initial.appearance;identity.customization=initial.customization;identity.inventory=initial.inventory;
  assert.deepEqual(stable(identity),stable(initial));check('public apply changes configuration together and preserves dossier, progression and quantities');
  await action('manual-saves').click();const autoBefore=await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1'));
  for(let i=1;i<=6;i++){await page.locator(`#manual-save-name-${i}`).fill(`Camille · slot ${i}`);await action('manual-save',String(i)).click();}
  const manual=await page.evaluate(()=>Array.from({length:6},(_,i)=>JSON.parse(localStorage.getItem(`relay-chronicles.manual-save.v1.${i+1}`))));
  for(let i=0;i<6;i++){assert.equal(manual[i].name,`Camille · slot ${i+1}`);assert.deepEqual(stable(decodeSave(manual[i].save)),stable(applied));}
  assert.equal(await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1')),autoBefore);
  await capture('six-manual-slots');const slotBefore=JSON.stringify(manual[0]);await action('manual-save','1').click();await action('manual-cancel').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('relay-chronicles.manual-save.v1.1')),slotBefore);check('six named manual saves preserve configuration and automatic bytes; overwrite cancellation preserves slot');
  await action('manual-back').click();await action('quit').click();const originalBytes=await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1'));
  const future=JSON.parse(encodeSave(initial));future.version=999;await importText('future-version',JSON.stringify(future),false);
  await page.getByText('Version de sauvegarde non prise en charge.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1')),originalBytes);
  await capture('invalid-import');await action('continue').click();await pause();assert.deepEqual(stable(await exportSave('after-invalid-import')),stable(applied));
  check('future import is explained and preserves the existing saved campaign');
  const malformedClass=JSON.parse(encodeSave(initial));malformedClass.state.classId=['soldier'];malformedClass.state.inventory.equipped={};malformedClass.state.inventory.training={};malformedClass.state.talents.ranks={};
  await action('quit').click();
  const beforeClassImport=await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1'));
  await importText('coercive-class-array',JSON.stringify(malformedClass),false);
  await page.getByText('Sauvegarde illisible ou invalide. Vous pouvez importer un autre fichier ou commencer une nouvelle campagne.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1')),beforeClassImport);
  await action('continue').click();await pause();
  assert.deepEqual(stable(await exportSave('after-class-array-import')),stable(applied));
  report.checks.at(-1).malformedClassImport={rejected:true,storedBytesUnchanged:true,currentCampaignUnchanged:true};
  await action('manual-saves').click();await action('manual-load','1').click();await pause();assert.deepEqual(stable(await exportSave('manual-reloaded')),stable(applied));
  await page.reload({waitUntil:'networkidle'});await action('continue').click();await pause();assert.deepEqual(stable(await exportSave('automatic-reloaded')),stable(applied));
  check('manual and automatic reload restore exactly the selected configuration');
  const legacy=JSON.parse(encodeSave(applied));delete legacy.state.customization;await importText('legacy-customization-absent',JSON.stringify(legacy));
  const migrated=await exportSave('legacy-migrated');assert.deepEqual(migrated.customization,newGame({appearance:applied.appearance}).customization);
  assert.deepEqual(migrated.inventory,applied.inventory);assert.equal(migrated.origin,applied.origin);assert.equal(migrated.psychologicalProfile,applied.psychologicalProfile);
  await action('customization').click();await capture('legacy-migrated');await action('custom-cancel').click();check('historic absent customization migrates while identity, inventory and progress survive');
  const workshop=workshopFixture();await importText('workshop-owned-gear',encodeSave(workshop));await action('customization').click();
  const automaticBeforeOptions=await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1'));
  for(const field of ['appearance','face.preset','face.skinTone','face.eyeColor','face.hairStyle','face.hairColor']){
    const selector=field==='appearance'?'[data-do="custom-appearance"]':`[data-do="custom-choice"][data-field="${field}"]`;
    const choices=await page.locator(selector).evaluateAll(elements=>elements.map(element=>({id:element.dataset.id,selected:element.getAttribute('aria-pressed')==='true'})));
    const sequence=[...choices.filter(choice=>!choice.selected),...choices.filter(choice=>choice.selected)];
    for(const choice of sequence){
      const before=await page.locator('.custom-portrait-frame').innerHTML(),beforeDrawing=await drawingSignature();
      const button=field==='appearance'?action('custom-appearance',choice.id):page.locator(`${selector}[data-id="${choice.id}"]`);
      await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
      const after=await page.locator('.custom-portrait-frame').innerHTML(),afterDrawing=await drawingSignature();
      assert.notEqual(after,before,`${field}:${choice.id} changes actual SVG preview`);
      assert.notEqual(afterDrawing,beforeDrawing,`${field}:${choice.id} changes drawing paths or colors beyond labels/ARIA`);
      assert.equal(await page.evaluate(()=>localStorage.getItem('relay-chronicles.save.v1')),automaticBeforeOptions);
      report.optionChecks.push({field,id:choice.id,beforePreviewSha256:sha(before),afterPreviewSha256:sha(after),beforeDrawingSha256:sha(beforeDrawing),afterDrawingSha256:sha(afterDrawing),activeSaveUnchanged:true});
    }
  }
  await page.locator('[data-do="custom-choice"][data-field="face.hairColor"][data-id="white"]').click();await capture('character-options');
  await action('custom-cancel').click();assert.deepEqual(stable(await exportSave('character-options-cancelled')),stable(workshop));
  check('every character option changes its real preview while the active campaign stays untouched',{options:report.optionChecks.length});
  await action('dossier').click();await action('customization').click();await action('custom-cancel').click();await page.getByRole('heading',{name:'Dossier Shepard'}).waitFor();await action('dossier-back').click();
  await action('close').click();await page.keyboard.press('i');await action('customization').click();await action('custom-cancel').click();await page.getByRole('heading',{name:'Équipement du commando'}).waitFor();
  await page.keyboard.press('Escape');await page.keyboard.press('c');await action('dossier').click();await action('customization').click();await action('custom-cancel').click();await action('dossier-back').click();await action('crew-confirm').waitFor();
  await page.keyboard.press('Escape');await pause();assert.deepEqual(stable(await exportSave('workshop-entries')),stable(workshop));
  check('public Pause, Shepard dossier, squad dossier and equipment entries return to the expected menu');
  await action('customization').click();await action('custom-tab','weapons').click();const visitedSlots=new Set(await page.locator('[data-do="custom-slot"]').evaluateAll(elements=>elements.map(element=>element.dataset.id)));
  await action('custom-slot','bioticAmp').click();assert.equal(await page.locator('.custom-item-detail').getAttribute('data-inspection-slot'),'bioticAmp');assert.equal(await page.locator('.custom-item-detail').getAttribute('data-inspection-status'),'empty');
  await action('custom-show-all').click();await action('custom-inspect','biotic-amp-standard').click();assert.equal(await page.locator('.custom-item-detail').getAttribute('data-inspection-status'),'unavailable');assert.match(await page.locator('.custom-item-unavailable').innerText(),/possé|inventaire|exemplaire/i);
  await action('custom-slot','omniTool').click();await action('custom-inspect','omni-tool-upgraded').click();
  const candidate=structuredClone(workshop);assert.equal(equipItem(candidate,'shepard','omni-tool-upgraded','omniTool').ok,true);
  const techBefore=actorFor('shepard',workshop).techMultiplier,techAfter=actorFor('shepard',candidate).techMultiplier;
  assert.equal(Number(await page.locator('[data-item-stat="techMultiplier"]').getAttribute('data-before')),techBefore);assert.equal(Number(await page.locator('[data-item-stat="techMultiplier"]').getAttribute('data-after')),techAfter);
  assert.match(await page.locator('[data-item-stat="techMultiplier"] b').innerText(),/×\s*1,00\s*→\s*×\s*1,15/);
  await page.locator('[data-do="custom-equip"][data-slot="omniTool"][data-id="omni-tool-upgraded"]').click();
  assert.equal(Number(await page.locator('[data-stat="techMultiplier"]').getAttribute('data-after')),techAfter);
  await action('custom-slot','bioticAmp').click();await action('custom-inspect','biotic-amp-upgraded').click();
  const bioticCandidate=structuredClone(candidate);assert.equal(equipItem(bioticCandidate,'shepard','biotic-amp-upgraded','bioticAmp').ok,true);
  const bioticBefore=actorFor('shepard',candidate).bioticMultiplier,bioticAfter=actorFor('shepard',bioticCandidate).bioticMultiplier;
  assert.equal(Number(await page.locator('[data-item-stat="bioticMultiplier"]').getAttribute('data-before')),bioticBefore);assert.equal(Number(await page.locator('[data-item-stat="bioticMultiplier"]').getAttribute('data-after')),bioticAfter);
  assert.match(await page.locator('[data-item-stat="bioticMultiplier"] b').innerText(),/×\s*1,00\s*→\s*×\s*1,15/);
  await page.locator('[data-item-stat="bioticMultiplier"]').scrollIntoViewIfNeeded();await capture('tool-comparison');
  await action('custom-slot','weapon').click();await action('custom-inspect','kessler-i').click();assert.equal(await page.locator('.custom-returned-modules li').count(),3);await page.locator('.custom-returned-modules').scrollIntoViewIfNeeded();await capture('weapon-returns');
  await action('custom-tab','armor').click();for(const id of await page.locator('[data-do="custom-slot"]').evaluateAll(elements=>elements.map(element=>element.dataset.id)))visitedSlots.add(id);
  await action('custom-inspect','onyx-turian-i').click();assert.equal(await page.locator('.custom-item-detail').getAttribute('data-inspection-status'),'unavailable');assert.match(await page.locator('.custom-item-unavailable').innerText(),/morphologie/);
  assert.equal(await page.locator('[data-do="custom-equip"][data-id="onyx-turian-i"]').isDisabled(),true);
  await action('custom-inspect','phoenix-human-iii').click();assert.equal(await page.locator('.custom-returned-modules li').count(),2);assert.ok(await page.locator('[data-item-stat="maxHp"]').count());
  await page.locator('.custom-item-detail').scrollIntoViewIfNeeded();await capture('armor-comparison');
  assert.equal(visitedSlots.size,9);await action('custom-cancel').click();assert.deepEqual(stable(await exportSave('comparison-cancelled')),stable(workshop));
  check('nine ports, empty and unavailable selections, species restrictions, exact tool multipliers and parent-module returns use actual current inventory',{visitedSlots:[...visitedSlots],techBefore,techAfter,bioticBefore,bioticAfter});
  const fullStock=newGame({name:'Stock plein explicite'});fullStock.inventory.stock['kessler-i']=40;fullStock.settings.sound=false;fullStock.settings.reducedMotion=true;
  assert.ok(decodeSave(encodeSave(fullStock)));await importText('full-armory-stock',encodeSave(fullStock));await action('close').click();await page.keyboard.press('i');
  await action('eq-tab','inventory').click();await action('eq-kind','all').click();await page.locator('[data-do="eq-sell"][data-id="kessler-i"]').click();
  await page.getByText('Le stock de l’armurerie est plein pour cet objet.',{exact:true}).waitFor();await capture('full-stock-sale-refused');
  await page.keyboard.press('Escape');await pause();const refused=await exportSave('full-stock-refused');
  assert.deepEqual(stable(refused),stable(fullStock));assert.deepEqual(actorFor('shepard',refused),actorFor('shepard',fullStock));
  check('public sale against a full stock is refused with a French reason before any inventory, credits, stock or actor-stat mutation');
  const supply=newGame({name:'Ravitaillement explicite'});supply.flags.briefed=true;supply.zone='eden-prime';recordVisit(supply,'eden-prime');supply.position={...getLevelLayout('eden-prime').pois.cache};supply.settings.sound=false;supply.settings.reducedMotion=true;
  await importText('supply-position',encodeSave(supply));await action('close').click();await page.keyboard.press('e');await page.getByRole('button',{name:'Retour sur le terrain.'}).waitFor();
  await capture('supply-claimed');await page.getByRole('button',{name:'Retour sur le terrain.'}).click();await pause();const claimed=await exportSave('supply-claimed');
  assert.equal(claimed.credits,supply.credits+100);assert.ok(claimed.collected.includes('eden-prime:cache'));assert.equal(claimed.logs.filter(log=>log.title==='Ravitaillement').length,1);
  await page.reload({waitUntil:'networkidle'});await action('continue').click();await settled();await page.keyboard.press('e');await page.getByRole('button',{name:'Retour sur le terrain.'}).click();await pause();
  assert.deepEqual(stable(await exportSave('supply-repeated')),stable(claimed));check('actual cache claim grants once, persists and cannot duplicate resources after reload');
  const final=finalFixture();await importText('completed-campaign',encodeSave(final));await capture('final-export');const ending=await exportSave('final-bilan','campaign');
  assert.equal(ending.sourceMediaId,'ME1');assert.equal(ending.continuationImplemented,false);assert.deepEqual(stable(ending.save.state),stable(final));assert.equal(Object.keys(ending.save.state.choices).length,4);
  check('public final export contains the versioned complete ME1 choices and an explicitly unimplemented continuation');
  await action('quit').click();await action('new').click();await page.locator('#commander-name').fill('Nouvelle Camille');
  await page.locator('#new-appearance').selectOption('female');await page.locator('#new-origin').selectOption('spacer');await page.locator('#new-profile').selectOption('sole-survivor');
  await action('class','soldier').click();await page.locator('#new-difficulty').selectOption('normal');await page.locator('#new-mode').selectOption('wait');
  await action('begin').click();await page.getByRole('button',{name:'Je rejoins le briefing.'}).click();await pause();
  const clean=await exportSave('fresh-after-completed'),expectedClean=newGame({name:'Nouvelle Camille',appearance:'female',classId:'soldier'});expectedClean.settings=clean.settings;
  assert.deepEqual(stable(clean),stable(expectedClean));
  assert.equal(await page.evaluate(()=>Array.from({length:6},(_,i)=>localStorage.getItem(`relay-chronicles.manual-save.v1.${i+1}`)).filter(Boolean).length),6);
  await capture('fresh-after-completed');check('new public campaign after a completed imported campaign resets profile, progression, inventory and choices while preserving manual slots');
  await page.setViewportSize({width:390,height:844});await action('manual-saves').click();assert.equal(await page.locator('[data-save-slot]').count(),6);await capture('mobile-slots');
  check('manual-slot controls remain available in the mobile viewport');
  await Promise.all(pendingResponses);
  if(mode==='production'){assert.deepEqual(report.sourceRequests,[]);for(const item of report.servedFiles){const file=report.distFiles[item.path.replace(/^\//,'')];assert.ok(file,item.path);assert.equal(item.sha256,file.sha256,item.path);}}
  // Preserve observations before the one explicitly allowed qualification.
  // Chromium's implicit favicon request is outside the game's resources and
  // may emit a console error without a Playwright page response event.
  report.rawConsoleErrors=structuredClone(report.consoleErrors);report.rawFailedRequests=structuredClone(report.failedRequests);
  const favicon=new URL('favicon.ico',url).href;
  report.consoleErrors=report.rawConsoleErrors.filter(error=>{
    const known=error.location?.url===favicon&&error.text==='Failed to load resource: the server responded with a status of 404 (Not Found)';
    if(known)report.resourceWarnings.push({source:'console',...error});return !known;
  });
  report.failedRequests=report.rawFailedRequests.filter(error=>{
    const known=error.url===favicon&&error.status===404;
    if(known)report.resourceWarnings.push({source:'response',...error});return !known;
  });
  report.resourceWarningPolicy='Only an actually observed exact origin /favicon.ico HTTP404 is a resource warning. Raw console locations and responses remain above. Every other error fails.';
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.failedRequests,[]);
  report.sourcesUnchanged=JSON.stringify(await hashSources())===JSON.stringify(report.sourceHashes);assert.equal(report.sourcesUnchanged,true,'Sources changed; preserve report and retry after freeze.');
  report.registrySourcesUnchanged=JSON.stringify(await hashPaths(registryPaths))===JSON.stringify(report.registrySourceHashes);assert.equal(report.registrySourcesUnchanged,true,'Generated context registry changed during this run.');
  report.passed=true;
}catch(error){report.errors.push(error.stack);process.exitCode=1;if(page)try{await capture('failure');}catch{}}
finally{if(browser)await browser.close();await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({path:fileURLToPath(reportPath),passed:report.passed,captures:report.captures.length,checks:report.checks.length,errors:report.errors}));}

import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_PERIODS } from '../src/continuity-data.js';
import { UNIVERSE_WORKS, getUniverseRecord } from '../src/universe-data.js';
import { normalizeContext, listAvailable } from '../src/continuity.js';
import { createChronicle, listChronicleScenarios, getChronicleRoster, getChronicleGear, buildChronicleActor, startChronicleBattle,
  getChronicleBuilds, setChronicleBuild, equipChronicle, listChronicleReadings, getChronicleReading, readChroniclePage } from '../src/chronicles.js';
import { getActions, ACTIONS } from '../src/combat.js';
import { renderUniverseScreen, renderUniverseReferences, renderChronicleBattle, renderChronicleReading } from '../src/universe-ui.js';

const context = (mediaId, periodId) => normalizeContext({ mediaId, periodId });
const uiFor = (ctx, extra = {}) => ({ mediaId: ctx?.mediaId || '', periodId: ctx?.periodId || '', group: 'all', query: '', recordId: null, visibleCount: 30, tab: 'references', ...extra });
function viewFor(ctx, session = null) {
  const roster = session ? getChronicleRoster(session) : [], gearByActor = {}, gearByActorSlot = {}, actors = {}, buildsByActor = {};
  for (const id of session?.party || []) {
    gearByActor[id] = getChronicleGear(session, id); actors[id] = buildChronicleActor(session, id); buildsByActor[id] = getChronicleBuilds(session, id);
    gearByActorSlot[id] = { weaponMod: getChronicleGear(session, id, 'weaponMod'), weaponMod2: getChronicleGear(session, id, 'weaponMod2') };
  }
  const readings = listChronicleReadings(ctx), reading = session && readings[0] ? getChronicleReading(session, readings[0].id) : null;
  return { works: UNIVERSE_WORKS, context: ctx, records: ctx ? listAvailable(ctx) : [], scenarios: listChronicleScenarios(ctx), session, roster, gearByActor, gearByActorSlot, actors, buildsByActor, actionLabels: ACTIONS, readings, reading, battle: null, actions: [] };
}

test('the registry offers all works and only their registered finite chapters, with sourced date uncertainty', () => {
  const ctx = context('ME1', 'me1'), ui = uiFor(ctx), view = viewFor(ctx);
  const html = renderUniverseScreen(view, ui);
  const workSelect = html.match(/<select id="chronicle-media"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.equal([...workSelect.matchAll(/<option value="[^"]+"/g)].length, 28);
  assert.ok(html.includes('Date non fixée'));
  assert.ok(html.includes(MEDIA_PERIODS.find(work => work.id === 'ME1').periods[0].uncertainty));
  assert.ok(!/type="(?:date|number)"/.test(html));
  const hom = renderUniverseScreen(viewFor(null), uiFor(null, { mediaId: 'HOM' }));
  for (const period of MEDIA_PERIODS.find(work => work.id === 'HOM').periods) assert.ok(hom.includes(`value="${period.id}"`));
  assert.ok(!hom.includes('data-do="chronicle-battle"'));
});

test('stale future references never leak into an earlier work, galaxy, or anthology segment', () => {
  for (const [mediaId, periodId, forbiddenId] of [
    ['ME1', 'me1', 'ME2-CHR-JACK'], ['GAL', 'gal', 'ME3-WPN-GRAAL'], ['ME2', 'me2', 'MEA-EQP-HELEUS'],
  ]) {
    const ctx = context(mediaId, periodId), view = viewFor(ctx), forbidden = getUniverseRecord(forbiddenId);
    assert.ok(forbidden);
    const current = view.records[0];
    view.records = [current, forbidden];
    const html = renderUniverseReferences(view, uiFor(ctx, { recordId: forbidden.id }));
    assert.ok(html.includes(`data-universe-record="${current.id}"`));
    assert.ok(!html.includes(forbidden.name), `${forbidden.name} must be absent from ${mediaId}`);
    assert.ok(!html.includes(forbidden.id));
  }
  const ctx = context('HOM', 'hom-1-youth'), view = viewFor(ctx);
  const anotherSegment = { id: 'later-segment', name: 'LATER_SEGMENT_ONLY', availability: [{ mediaId: 'HOM', periodIds: ['hom-4-liara'] }] };
  view.records = [anotherSegment];
  assert.ok(!renderUniverseReferences(view, uiFor(ctx)).includes('LATER_SEGMENT_ONLY'));
});

test('documentary locks expose their reason without a playable preparation or implicit chapter', () => {
  for (const id of ['LIB', 'CUT', 'ME4', 'BLA']) {
    const work = UNIVERSE_WORKS.find(entry => entry.id === id);
    const html = renderUniverseScreen(viewFor(null), uiFor(null, { mediaId: id, tab: 'session' }));
    assert.ok(html.includes(work.reason));
    assert.ok(/id="chronicle-period" disabled/.test(html));
    assert.ok(!html.includes('data-do="chronicle-start"'));
    assert.ok(!html.includes('data-do="chronicle-battle"'));
  }
});

test('reference content and search terms are escaped and source URLs cannot execute code', () => {
  const ctx = context('ME1', 'me1'), view = viewFor(ctx);
  view.records = [{ id: 'safe-id', name: '<img src=x onerror=alert(1)>', description: '<script>bad()</script>', category: 'characters',
    availability: [{ mediaId: 'ME1', periodIds: ['me1'] }], sourceUrl: 'javascript:alert(1)', sourceIds: ['unregistered'] }];
  const html = renderUniverseReferences(view, uiFor(ctx, { query: '"><script>query()</script>' }));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('&lt;script&gt;bad()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
});

test('workshop preparation keeps scoped roster, compatibility reasons and ATB budgets without mutating its session', () => {
  const ctx = context('ME2', 'me2'), session = createChronicle(ctx, 'me2-equipment-workshop'), view = viewFor(ctx, session), before = JSON.stringify(session);
  const html = renderUniverseScreen(view, uiFor(ctx, { tab: 'session' }));
  assert.ok(html.includes('Atelier d’équipement'));
  assert.ok(html.includes('acquisition d’origine non simulée'));
  for (const id of session.party) {
    assert.ok(html.includes(`data-chronicle-actor="${id}"`));
    assert.ok(html.includes(`data-actor-id="${id}" data-slot="weapon"`));
    assert.ok(html.includes(`data-actor-id="${id}" data-slot="armor"`));
  }
  assert.ok(html.includes('data-chronicle-portrait="ME2-CHR-MIRANDA"'));
  assert.ok(!html.includes('crew-atlas.png'), 'No ME1 costume is reused for a later identity');
  assert.ok([...html.matchAll(/href="([^"]*assets\/[^\"]*)"/g)].every(match => match[1] === './assets/chronicle-portraits-me2-me3.png'));
  const incompatible = view.gearByActor[session.party[0]].find(item => item.slot && !item.compatible);
  assert.ok(incompatible, 'The scoped catalogue contains a concrete incompatible equipment model.');
  assert.match(html, new RegExp(`<option value="${incompatible.id}"[^>]*disabled`));
  assert.equal(JSON.stringify(session), before);
});

test('a session from another period cannot expose its party or battle in the selected context', () => {
  const me2 = context('ME2', 'me2'), me1 = context('ME1', 'me1'), session = createChronicle(me2, 'me2-equipment-workshop');
  const view = viewFor(me1, session); view.battle = startChronicleBattle(session).battle;
  const html = renderUniverseScreen(view, uiFor(me1, { tab: 'session' }));
  assert.ok(!html.includes('data-chronicle-unit'));
  assert.ok(!html.includes('data-chronicle-actor'));
  assert.ok(!html.includes('ME2-CHR-MIRANDA'));
});

test('the isolated battle renders real actions, data bars and only authorized prototype portraits', () => {
  const ctx = context('ME2', 'me2'), session = createChronicle(ctx, 'me2-equipment-workshop'), view = viewFor(ctx, session);
  const result = startChronicleBattle(session); assert.equal(result.ok, true);
  const actor = result.battle.actors.find(unit => unit.team === 'party');
  view.battle = result.battle; view.selectedActorId = actor.id; view.selectedActionId = 'shoot'; view.actions = getActions(view.battle, actor.id);
  const before = JSON.stringify(view.battle), html = renderChronicleBattle(view, uiFor(ctx));
  assert.ok(html.includes(`data-chronicle-unit="${actor.id}"`));
  for (const stat of ['hp', 'shield', 'atb']) assert.ok(html.includes(`data-chronicle-stat="${stat}"`));
  for (const action of view.actions) assert.ok(html.includes(`data-do="chronicle-action" data-id="${action.id}"`));
  assert.ok(html.includes('data-do="chronicle-pause"'));
  assert.ok(html.includes('data-do="chronicle-target"'));
  assert.ok(html.includes('data-chronicle-portrait="ME2-CHR-MIRANDA"'));
  assert.ok(!html.includes('data-chronicle-portrait="ME2-CHR-SHEPARD"'));
  assert.ok(!html.includes('crew-atlas.png'));
  assert.equal(JSON.stringify(view.battle), before);
});

test('class preparation renders real selected powers and rejects incompatible weapon families before selection', () => {
  const ctx = context('ME2', 'me2');
  let session = createChronicle(ctx, 'me2-equipment-workshop');
  const result = setChronicleBuild(session, 'ME2-CHR-SHEPARD', 'engineer');
  assert.equal(result.ok, true); session = result.session;
  const before = JSON.stringify(session), html = renderUniverseScreen(viewFor(ctx, session), uiFor(ctx, { tab: 'session' }));
  const buildSelect = html.match(/<select[^>]*data-chronicle-build data-actor-id="ME2-CHR-SHEPARD"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.equal([...buildSelect.matchAll(/<option /g)].length, 7);
  assert.match(buildSelect, /value="engineer" selected>Ingénieur/);
  const actor = buildChronicleActor(session, 'ME2-CHR-SHEPARD');
  for (const power of actor.powers) assert.ok(html.includes(ACTIONS[power].label));
  assert.match(html, /<option value="ME2-WPN-AVENGER"[^>]*disabled/);
  assert.ok(html.includes('Cette famille d’arme ne fait pas partie de cette préparation de classe.'));
  assert.ok(html.includes('Changer de profil retire les équipements devenus incompatibles.'));
  assert.equal(JSON.stringify(session), before);

  const prologue = context('ME3', 'me3-prologue'), fixed = createChronicle(prologue, 'me3-earth-prologue');
  const fixedHTML = renderUniverseScreen(viewFor(prologue, fixed), uiFor(prologue, { tab: 'session' }));
  assert.match(fixedHTML, /<select[^>]*data-chronicle-build[^>]*disabled/);
});

test('both module ports expose their exact compatibility, selected family profiles and replacement warning', () => {
  const ctx = context('ME3', 'me3');
  let session = createChronicle(ctx, 'me3-equipment-workshop');
  for (const [item, slot] of [['ME3-WPN-AVENGER', 'weapon'], ['ME3-EQP-BARREL', 'weaponMod'], ['ME3-EQP-MAGAZINE', 'weaponMod2']]) {
    const result = equipChronicle(session, 'ME3-CHR-SHEPARD', item, slot); assert.equal(result.ok, true, result.reason); session = result.session;
  }
  const before = JSON.stringify(session), html = renderUniverseScreen(viewFor(ctx, session), uiFor(ctx, { tab: 'session' }));
  for (const [slot, item] of [['weaponMod', 'ME3-EQP-BARREL'], ['weaponMod2', 'ME3-EQP-MAGAZINE']]) {
    const selector = new RegExp(`<select[^>]*data-actor-id="ME3-CHR-SHEPARD" data-slot="${slot}"[^>]*>([\\s\\S]*?)<\\/select>`);
    const content = html.match(selector)[1];
    assert.match(content, new RegExp(`value="${item}" selected`));
  }
  assert.ok(html.includes('Changer d’arme retire les modules de ses deux ports.'));
  assert.ok(html.includes('Chargeur ATB 23, réserve ATB 67'));
  assert.ok(html.includes('Dégâts des tirs ATB 112 %'));
  assert.equal(buildChronicleActor(session, 'ME3-CHR-SHEPARD').magazineCapacity, 23);
  assert.equal(JSON.stringify(session), before);
});

test('documentary reading shows one sourced page, exact navigation and saved progression without combat rewards', () => {
  const ctx = context('REV', 'rev'), session = createChronicle(ctx), result = readChroniclePage(session, 'rev-sidon', 1);
  assert.equal(result.ok, true);
  const view = viewFor(ctx, result.session), ui = uiFor(ctx, { tab: 'reading', readingId: 'rev-sidon' }), before = JSON.stringify(result.session);
  const html = renderUniverseScreen(view, ui);
  assert.ok(html.includes('data-do="universe-tab" data-id="reading" aria-pressed="true"'));
  assert.ok(html.includes('id="chronicle-reading"'));
  assert.ok(html.includes('data-chronicle-reading="rev-sidon" data-reading-index="1"'));
  assert.ok(html.includes(result.reading.step.text));
  for (const source of result.reading.step.sources) assert.ok(html.includes(`data-reading-source="${source.id}"`));
  assert.ok(html.includes('data-do="chronicle-page" data-index="0"'));
  assert.ok(html.includes('data-do="chronicle-page" data-index="2"'));
  assert.ok(!html.includes('data-do="chronicle-battle"'));
  assert.ok(!html.includes('data-chronicle-actor'));
  assert.equal(JSON.stringify(result.session), before);
  const last = readChroniclePage(result.session, 'rev-sidon', 4), lastView = viewFor(ctx, last.session);
  assert.match(renderChronicleReading(lastView, ui), /data-do="chronicle-page" data-index="4" disabled>Étape suivante/);
});

test('reading and power-reference tabs preserve context gates and active battle restrictions', () => {
  const rev = context('REV', 'rev'), session = createChronicle(rev), reading = getChronicleReading(session, 'rev-sidon');
  const view = viewFor(context('ME1', 'me1'), session); view.readings = listChronicleReadings(rev); view.reading = reading;
  assert.ok(!renderChronicleReading(view, uiFor(rev, { readingId: 'rev-sidon' })).includes(reading.step.text));
  const me2 = context('ME2', 'me2'), battleSession = createChronicle(me2, 'me2-equipment-workshop'), active = viewFor(me2, battleSession);
  active.battle = startChronicleBattle(battleSession).battle;
  assert.match(renderUniverseScreen(active, uiFor(me2, { tab: 'session' })), /data-id="reading"[^>]*disabled>Lecture/);
  const safe = viewFor(rev, session); safe.battle = active.battle;
  assert.ok(!renderChronicleReading(safe, uiFor(rev, { tab: 'reading' })).includes(reading.step.text));

  const powersView = viewFor(me2), power = getUniverseRecord('ME2-POW-PULL'); powersView.records = [power];
  const html = renderUniverseReferences(powersView, uiFor(me2, { group: 'powers' }));
  assert.ok(html.includes('data-id="powers" aria-pressed="true">Pouvoirs'));
  assert.ok(html.includes(`data-universe-record="${power.id}"`));
});

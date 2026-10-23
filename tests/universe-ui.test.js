import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_PERIODS } from '../src/continuity-data.js';
import { UNIVERSE_WORKS, getUniverseRecord } from '../src/universe-data.js';
import { normalizeContext, listAvailable } from '../src/continuity.js';
import { createChronicle, listChronicleScenarios, getChronicleRoster, getChronicleGear, buildChronicleActor, startChronicleBattle } from '../src/chronicles.js';
import { getActions } from '../src/combat.js';
import { renderUniverseScreen, renderUniverseReferences, renderChronicleBattle } from '../src/universe-ui.js';

const context = (mediaId, periodId) => normalizeContext({ mediaId, periodId });
const uiFor = (ctx, extra = {}) => ({ mediaId: ctx?.mediaId || '', periodId: ctx?.periodId || '', group: 'all', query: '', recordId: null, visibleCount: 30, tab: 'references', ...extra });
function viewFor(ctx, session = null) {
  const roster = session ? getChronicleRoster(session) : [], gearByActor = {}, actors = {};
  for (const id of session?.party || []) { gearByActor[id] = getChronicleGear(session, id); actors[id] = buildChronicleActor(session, id); }
  return { works: UNIVERSE_WORKS, context: ctx, records: ctx ? listAvailable(ctx) : [], scenarios: listChronicleScenarios(ctx), session, roster, gearByActor, actors, battle: null, actions: [] };
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
  assert.ok(!html.includes('assets/'));
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

test('the isolated battle renders real engine actions and data bars with neutral unit symbols', () => {
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
  assert.ok(!/<(?:img|svg)\b/.test(html));
  assert.equal(JSON.stringify(view.battle), before);
});

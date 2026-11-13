import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIVERSE_WORKS, getUniverseRecord } from '../src/universe-data.js';
import { normalizeContext, canAccessContent } from '../src/continuity.js';
import { ARSENAL_VISUAL_DATA } from '../src/arsenal-visual-data.js';
import { getUniverseVisual } from '../src/universe-visuals.js';
import { getUniverseEquipment } from '../src/universe-equipment.js';
import { CHRONICLE_SCENARIOS } from '../src/universe-actors.js';
import { OPPOSITION_SCENARIOS } from '../src/universe-opposition-scenarios.js';
import { createChronicle, listChronicleScenarios, getChronicleRoster, getChronicleGear, buildChronicleActor,
  getChronicleBuilds, equipChronicle, setChronicleParty, startChronicleBattle } from '../src/chronicles.js';
import { ACTIONS, getActions } from '../src/combat.js';
import { renderUniverseScreen, renderUniverseReferences, renderChronicleBattle } from '../src/universe-ui.js';

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const uiFor = context => ({ mediaId: context.mediaId, periodId: context.periodId, tab: 'session' });
function viewFor(session, battle = null) {
  const actors = {}, gearByActor = {}, gearByActorSlot = {}, buildsByActor = {};
  for (const id of session.party) {
    actors[id] = buildChronicleActor(session, id); buildsByActor[id] = getChronicleBuilds(session, id);
    gearByActor[id] = getChronicleGear(session, id);
    gearByActorSlot[id] = { weaponMod: getChronicleGear(session, id, 'weaponMod'), weaponMod2: getChronicleGear(session, id, 'weaponMod2') };
  }
  return { context: session.context, session, battle, actors, gearByActor, gearByActorSlot, buildsByActor,
    works: UNIVERSE_WORKS, roster: getChronicleRoster(session), scenarios: listChronicleScenarios(session.context),
    actionLabels: ACTIONS, selectedActorId: session.party[0], actions: battle ? getActions(battle, session.party[0]) : [] };
}

test('partial opponent mechanics remain readable in preparation and actual combat for all six benches', () => {
  for (const scenario of OPPOSITION_SCENARIOS) {
    const session = createChronicle(scenario.context, scenario.id), before = JSON.stringify(session);
    const prepared = renderUniverseScreen(viewFor(session), uiFor(session.context));
    assert.match(prepared, /aria-label="Profils partiels des adversaires"/);
    const { battle } = startChronicleBattle(session), battleBefore = JSON.stringify(battle);
    const live = renderChronicleBattle(viewFor(session, battle), uiFor(session.context));
    for (const enemy of scenario.enemies) {
      for (const html of [prepared, live]) {
        assert.ok(html.includes(`data-chronicle-opponent-limits="${enemy.catalogId}"`));
        assert.ok(html.includes('Profil partiel · limites du combat'));
        for (const limitation of enemy.missingMechanics) assert.ok(html.includes(`<li>${esc(limitation)}</li>`), limitation);
      }
    }
    assert.equal(JSON.stringify(session), before); assert.equal(JSON.stringify(battle), battleBefore);
  }
});

test('lightweight equipment explains the real adapted cooldown and SMG restriction without an original weight claim', () => {
  const context = normalizeContext({ mediaId: 'ME3', periodId: 'me3' });
  let session = createChronicle(context, 'me3-equipment-workshop');
  for (const [id, slot] of [['ME3-WPN-SHURIKEN', 'weapon'], ['ME3-EQP-ULTRALIGHT', 'weaponMod']]) {
    const result = equipChronicle(session, 'ME3-CHR-SHEPARD', id, slot); assert.equal(result.ok, true, result.reason); session = result.session;
  }
  const before = JSON.stringify(session), html = renderUniverseScreen(viewFor(session), uiFor(context));
  assert.match(html, /Recharges de pouvoirs ×0,9 ATB/);
  assert.match(html, /SMG ME3 conventionnelle uniquement/);
  assert.match(html, /Aucun poids original reproduit/);
  assert.match(html, /value="ME3-EQP-ULTRALIGHT" selected/);
  assert.equal(JSON.stringify(session), before);
});

test('opponent limitations are escaped and an enemy never gains group controls', () => {
  const scenario = OPPOSITION_SCENARIOS[0], session = createChronicle(scenario.context, scenario.id);
  const { battle } = startChronicleBattle(session);
  const enemy = battle.actors.find(actor => actor.team === 'enemy');
  enemy.missingMechanics = ['<img src=x onerror=alert(1)>'];
  const before = JSON.stringify(battle), html = renderChronicleBattle(viewFor(session, battle), uiFor(session.context));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;')); assert.ok(!html.includes('<img src=x'));
  assert.equal(JSON.stringify(battle), before);
  const card = html.slice(html.indexOf(`data-chronicle-unit="${enemy.id}"`), html.indexOf('</article>', html.indexOf(`data-chronicle-unit="${enemy.id}"`)));
  assert.ok(!card.includes('data-do="chronicle-actor"'));
});

function assertCell(html, visual, recordId) {
  const [x, y, width, height] = visual.sourceRect;
  assert.ok(html.includes(`data-universe-visual="${recordId}"`), recordId);
  assert.ok(html.includes(`viewBox="${visual.sourceRect.join(' ')}" overflow="hidden"`), recordId);
  assert.ok(html.includes(`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${visual.sourceRect.join(' ')}" overflow="hidden"`), recordId);
  assert.ok(html.includes(`<image href="${visual.src}" width="${visual.atlasWidth}" height="${visual.atlasHeight}"/>`), recordId);
  assert.ok(html.includes('Illustration de prototype'));
}

test('generated reference images use the exact clipped cell and never grant documentary NPC or fleet gameplay', () => {
  assert.equal(ARSENAL_VISUAL_DATA.length, 24);
  let visible = 0;
  for (const entry of ARSENAL_VISUAL_DATA) {
    const context = normalizeContext({ mediaId: entry.mediaId, periodId: entry.periodIds[0] });
    const recordId = entry.recordIds.find(id => getUniverseVisual(id, context)) || entry.recordIds[0], record = getUniverseRecord(recordId);
    const view = { works: UNIVERSE_WORKS, context, records: [record] };
    const before = JSON.stringify(view), html = renderUniverseReferences(view, { ...uiFor(context), recordId });
    const visual = getUniverseVisual(recordId, context);
    if (visual) {
      visible++; assertCell(html, visual, recordId);
      assert.ok(html.includes('image fixe, modèle original non certifié'));
      assert.ok(html.includes(esc(visual.caption)));
    } else {
      assert.equal(canAccessContent(recordId, context).ok, false, recordId);
      assert.ok(!html.includes(`data-universe-visual="${recordId}"`));
    }
    assert.ok(!/data-do="(?:chronicle-party|chronicle-battle|chronicle-action)"/.test(html));
    assert.ok(!html.includes('universe-character-stats')); assert.equal(JSON.stringify(view), before);
  }
  assert.equal(visible, 24);
  for (const id of ['SPR-VEH-mako', 'SYS-mako', 'SPR-VEH-normandy-sr-1', 'SCN-normandy-coque-sr-1']) {
    assert.equal(getUniverseVisual(id, { mediaId: 'ME1', periodId: 'me1' }), null, id);
  }
});

test('the four new ME2 busts precede initials in their authorized party and actual battle while old portraits keep priority', () => {
  const context = normalizeContext({ mediaId: 'ME2', periodId: 'me2' });
  for (const id of ['ME2-CHR-MORDIN', 'ME2-CHR-TALI', 'ME2-CHR-LEGION', 'ME2-CHR-SAMARA']) {
    const session = setChronicleParty(createChronicle(context, 'me2-equipment-workshop'), [id]).session;
    const visual = getUniverseVisual(id, context, { usage: 'party', scenarioId: session.scenarioId }); assert.ok(visual);
    const prepared = renderUniverseScreen(viewFor(session), uiFor(context)); assertCell(prepared, visual, id);
    const { battle } = startChronicleBattle(session), before = JSON.stringify(battle);
    const live = renderChronicleBattle(viewFor(session, battle), uiFor(context)); assertCell(live, visual, id);
    assert.equal(JSON.stringify(battle), before);
  }
  for (const [mediaId, ids] of [['ME2', ['ME2-CHR-MIRANDA', 'ME2-CHR-THANE']], ['ME3', ['ME3-CHR-GARRUS']]]) {
    const ctx = normalizeContext({ mediaId, periodId: mediaId.toLowerCase() });
    const session = createChronicle(ctx, `${mediaId.toLowerCase()}-equipment-workshop`);
    const html = renderUniverseScreen(viewFor(session), uiFor(ctx));
    for (const id of ids) {
      assert.ok(html.includes(`data-chronicle-portrait="${id}"`));
      assert.ok(!html.includes(`data-universe-visual="${id}"`));
    }
    assert.ok(html.includes('href="./assets/chronicle-portraits-me2-me3.png"'));
  }
});

test('six opponent images resolve native enemy catalog IDs instead of transient battle unit IDs', () => {
  const entries = ARSENAL_VISUAL_DATA.filter(entry => ['enemies', 'bosses'].includes(entry.category)); assert.equal(entries.length, 6);
  for (const entry of entries) {
    const id = entry.recordIds[0], scenario = CHRONICLE_SCENARIOS.find(scene => scene.enemies.some(enemy => enemy.catalogId === id)); assert.ok(scenario, id);
    const session = createChronicle(scenario.context, scenario.id), { battle } = startChronicleBattle(session);
    const enemy = battle.actors.find(actor => actor.catalogId === id), before = JSON.stringify(battle);
    const visual = getUniverseVisual(id, session.context, { usage: 'combat', scenarioId: session.scenarioId }); assert.ok(visual);
    const html = renderChronicleBattle(viewFor(session, battle), uiFor(session.context)); assertCell(html, visual, id);
    assert.ok(html.includes(`data-chronicle-unit="${enemy.id}"`));
    assert.ok(!html.includes(`data-universe-visual="${enemy.id}"`)); assert.equal(JSON.stringify(battle), before);
  }
});

test('all six selected equipment illustrations preserve irregular rectangles, validated loadouts and their real stats', () => {
  const entries = ARSENAL_VISUAL_DATA.filter(entry => ['weapons', 'costumes', 'mods'].includes(entry.category)); assert.equal(entries.length, 6);
  for (const entry of entries) {
    const id = entry.recordIds[0], item = getUniverseEquipment(id);
    const scenario = CHRONICLE_SCENARIOS.find(scene => scene.allowedEquipmentIds.includes(id)); assert.ok(scenario, id);
    const actorId = scenario.defaultParty[0]; let session = createChronicle(scenario.context, scenario.id);
    if (item.slot === 'weaponMod') session = equipChronicle(session, actorId, 'ME3-WPN-AVENGER', 'weapon').session;
    const equipped = equipChronicle(session, actorId, id, item.slot); assert.equal(equipped.ok, true, equipped.reason); session = equipped.session;
    const before = JSON.stringify(session), stats = JSON.stringify(buildChronicleActor(session, actorId));
    const visual = getUniverseVisual(id, session.context, { usage: 'reference' }); assert.ok(visual);
    const html = renderUniverseScreen(viewFor(session), uiFor(session.context)); assertCell(html, visual, id);
    assert.ok(html.includes('class="universe-gear-visual"'));
    assert.equal(JSON.stringify(session), before); assert.equal(JSON.stringify(buildChronicleActor(session, actorId)), stats);
  }
});

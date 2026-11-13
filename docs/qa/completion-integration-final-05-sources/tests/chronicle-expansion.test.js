import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createChronicle, normalizeChronicle, getChronicleBuilds, setChronicleBuild, equipChronicle,
  getChronicleGear, buildChronicleActor, listChronicleReadings, getChronicleReading, readChroniclePage,
  encodeChronicle, decodeChronicle, startChronicleBattle, finishChronicleBattle } from '../src/chronicles.js';
import { setChronicleNote } from '../src/continuity.js';
import { getActions, performAction, tickBattle } from '../src/combat.js';
const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const workshop = mediaId => createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`);
const equip = (session, id, item, slot) => {
  const result = equipChronicle(session, id, item, slot);
  assert.equal(result.ok, true, result.reason); return result.session;
};

test('a real previous-release Chronicle keeps its two existing items while new preparation fields migrate', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/chronicle-v1-before-expansion.json', import.meta.url)));
  assert.equal(Object.hasOwn(fixture.packet.session, 'builds'), false);
  const before = structuredClone(fixture.packet), session = decodeChronicle(fixture.packet);
  assert.ok(session); assert.equal(session.version, 1);
  for (const id of session.party) {
    assert.equal(session.builds[id], 'default');
    assert.deepEqual(session.loadouts[id], { ...before.session.loadouts[id], weaponMod: null, weaponMod2: null });
  }
  assert.deepEqual(session.readingProgress, {});
  assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
  assert.deepEqual(fixture.packet, before);
  assert.deepEqual(buildChronicleActor(session, session.party[0]).powers, []);
});

test('ME2 class preparation withdraws incompatible weapons atomically and survives an exact save round trip', () => {
  const id = 'ME2-CHR-SHEPARD'; let session = workshop('ME2');
  const choices = getChronicleBuilds(session, id);
  assert.equal(choices.length, 7); assert.ok(choices.some(build => build.id === 'engineer'));
  session = equip(session, id, 'ME2-WPN-AVENGER', 'weapon');
  const before = structuredClone(session), base = buildChronicleActor(session, id);
  const result = setChronicleBuild(session, id, 'engineer');
  assert.equal(result.ok, true); assert.deepEqual(result.clearedEquipment, ['ME2-WPN-AVENGER']);
  assert.equal(result.session.loadouts[id].weapon, null); assert.equal(result.session.builds[id], 'engineer');
  assert.deepEqual(session, before);
  const engineer = buildChronicleActor(result.session, id);
  for (const key of ['hp', 'maxHp', 'attack', 'defense']) assert.equal(engineer[key], base[key]);
  assert.ok(engineer.powers.includes('incinerate')); assert.equal(engineer.biotic, false); assert.equal(engineer.tech, true);
  const unavailable = getChronicleGear(result.session, id).find(item => item.id === 'ME2-WPN-AVENGER');
  assert.equal(unavailable.compatible, false); assert.equal(unavailable.slotReasons.weapon, unavailable.reason);
  assert.equal(equipChronicle(result.session, id, 'ME2-WPN-AVENGER', 'weapon').ok, false);
  assert.equal(normalizeChronicle({ ...result.session, loadouts: before.loadouts }), null);
  assert.deepEqual(decodeChronicle(encodeChronicle(result.session)), result.session);
  assert.equal(setChronicleBuild(session, id, 'invented-class').ok, false);
  assert.equal(setChronicleBuild(session, 'ME2-CHR-MIRANDA', 'engineer').ok, false);
});

test('ME3 modules combine finite ammunition and weapon-only damage without changing a prepared class', () => {
  const id = 'ME3-CHR-SHEPARD'; let session = workshop('ME3');
  session = setChronicleBuild(session, id, 'engineer').session;
  session = equip(session, id, 'ME3-WPN-AVENGER', 'weapon');
  const base = buildChronicleActor(session, id);
  session = equip(session, id, 'ME3-EQP-BARREL', 'weaponMod');
  session = equip(session, id, 'ME3-EQP-MAGAZINE', 'weaponMod2');
  const actor = buildChronicleActor(session, id);
  assert.equal(actor.magazineCapacity, 23); assert.equal(actor.ammo, 23); assert.equal(actor.reserveAmmo, 67);
  assert.equal(actor.ammo + actor.reserveAmmo, base.ammo + base.reserveAmmo);
  assert.equal(actor.weaponDamageMultiplier, 1.12); assert.equal(actor.attack, base.attack);
  assert.deepEqual(actor.powers, base.powers); assert.equal(session.builds[id], 'engineer');
  assert.equal(equipChronicle(session, id, 'ME3-EQP-BARREL', 'weaponMod2').ok, false);
  assert.deepEqual(buildChronicleActor(decodeChronicle(encodeChronicle(session)), id), actor);
  const removed = equip(session, id, null, 'weapon');
  assert.deepEqual(removed.loadouts[id], { weapon: null, armor: null, weaponMod: null, weaponMod2: null });
  assert.equal(buildChronicleActor(removed, id).weaponDamageMultiplier, 1);
});

test('all documentary pages persist only their visited references and never replace personal notes', () => {
  let total = 0;
  for (const mediaId of ['REV', 'ASC', 'RET', 'NEX', 'INI', 'ANN', 'RED', 'INV', 'EVO']) {
    const ctx = mediaId === 'EVO' ? { mediaId, periodId: 'evo-aftermath' } : context(mediaId);
    let session = createChronicle(ctx); assert.ok(session);
    const stories = listChronicleReadings(ctx); assert.equal(stories.length, 1);
    const story = stories[0], pristine = structuredClone(session);
    assert.equal(getChronicleReading(session, story.id).index, 0); assert.deepEqual(session, pristine);
    const first = readChroniclePage(session, story.id, 0); assert.equal(first.ok, true);
    session = first.session;
    const anchor = first.reading.story.progressRecordId;
    assert.equal(setChronicleNote(session, anchor, 'Conserver cette note personnelle.' ).ok, true);
    const originalParty = [...session.party], originalLoadouts = structuredClone(session.loadouts);
    for (let index = 0; index < story.stepCount; index++) {
      const result = readChroniclePage(session, story.id, index); assert.equal(result.ok, true, result.reason);
      session = result.session; assert.equal(session.readingProgress[story.id], index);
      assert.equal(result.reading.index, index); assert.equal(result.reading.completed, index === story.stepCount - 1);
      assert.ok(result.reading.step.recordIds.every(id => session.discovered.includes(id)));
      assert.equal(session.notes[anchor], 'Conserver cette note personnelle.');
      assert.deepEqual(session.party, originalParty); assert.deepEqual(session.loadouts, originalLoadouts);
      assert.deepEqual(session.cleared, []); assert.equal(Object.hasOwn(session, 'credits'), false);
      total++;
    }
    const size = session.discovered.length;
    const repeated = readChroniclePage(session, story.id);
    assert.equal(repeated.session.discovered.length, size);
    assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
    assert.equal(getChronicleReading(session, story.id).index, story.stepCount - 1);
    assert.equal(readChroniclePage(session, story.id, story.stepCount).ok, false);
    assert.equal(readChroniclePage(session, story.id, null).ok, false);
  }
  assert.equal(total, 42);
});

test('foreign, malformed or fabricated reading progress is rejected without altering a Chronicle', () => {
  const session = createChronicle(context('REV')), before = structuredClone(session);
  for (const value of [{ ...session, readingProgress: { 'rev-sidon': 0 } },
    { ...session, readingProgress: { 'ann-transit': 0 } }, { ...session, readingProgress: { invented: 0 } }]) {
    assert.equal(normalizeChronicle(value), null);
  }
  assert.equal(readChroniclePage(session, 'ann-transit', 0).ok, false);
  assert.equal(readChroniclePage(createChronicle({ mediaId: 'EVO', periodId: 'evo-contact' }), 'evo-apres-guerre', 0).ok, false);
  let called = false; const hostile = { toString() { called = true; return 'rev-sidon'; } };
  assert.equal(getChronicleReading(session, hostile), null); assert.equal(readChroniclePage(session, hostile).ok, false);
  assert.equal(called, false); assert.deepEqual(session, before);
});

test('a tactical outcome cannot be claimed under a different class preparation', () => {
  const session = workshop('ME2'), started = startChronicleBattle(session); assert.equal(started.ok, true);
  const battle = started.battle;
  for (let frame = 0; frame < 4000 && !battle.winner; frame++) {
    for (const actor of battle.actors.filter(item => item.team === 'party' && item.hp > 0)) {
      const actions = getActions(battle, actor.id).filter(action => action.available);
      const chosen = ['reload', 'signature', 'burst', 'shoot', 'overload', 'warp', 'throw']
        .map(id => actions.find(action => action.id === id)).find(Boolean);
      if (!chosen) continue;
      const target = chosen.target === 'self' ? actor : battle.actors.find(item => item.team === 'enemy' && item.hp > 0 && !item.statuses.stasis);
      if (target) performAction(battle, { actorId: actor.id, actionId: chosen.id, targetId: target.id });
    }
    tickBattle(battle, .2);
  }
  assert.equal(battle.winner, 'party');
  const changed = setChronicleBuild(session, 'ME2-CHR-SHEPARD', 'engineer'); assert.equal(changed.ok, true);
  assert.equal(finishChronicleBattle(changed.session, battle).ok, false);
  assert.equal(finishChronicleBattle(session, battle).ok, true);
});

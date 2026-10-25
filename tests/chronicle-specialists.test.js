import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronicle, equipChronicle, setChronicleBuild, buildChronicleActor,
  normalizeChronicle, startChronicleBattle, encodeChronicle, decodeChronicle,
  readChroniclePage, getChronicleGear, setChronicleParty } from '../src/chronicles.js';
import { getActions } from '../src/combat.js';
import { SPECIALIST_SCENARIOS } from '../src/universe-specialist-scenarios.js';
import { getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';
const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const workshop = mediaId => createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`);
const equipped = (session, actorId, itemId, slot = 'weapon') => {
  const result = equipChronicle(session, actorId, itemId, slot);
  assert.equal(result.ok, true, result.reason); return result.session;
};

test('saved special weapon IDs reconstruct their bounded mechanics without inheriting an abstract clip reserve', () => {
  for (const id of ['ME3-WPN-FALCON', 'ME3-WPN-SCORPION', 'MEA-WPN-SCORPION', 'MEA-WPN-PAW', 'MEA-WPN-REEGAR', 'MEA-WPN-SWEEPER']) {
    const mediaId = id.split('-')[0], actorId = `${mediaId}-CHR-${mediaId === 'MEA' ? 'RYDER' : 'SHEPARD'}`;
    let session = equipped(workshop(mediaId), actorId, id);
    const serialized = encodeChronicle(session);
    session = decodeChronicle(serialized); assert.ok(session);
    assert.equal(serialized.includes('weaponProfileId'), false, 'Only the selected catalogue ID is stored');
    const actor = buildChronicleActor(session, actorId), profile = getUniverseWeaponProfile(id);
    assert.equal(actor.weaponProfileId, id); assert.equal(actor.weaponSystem, profile.weaponSystem);
    if (profile.weaponSystem === 'heat') {
      for (const key of ['ammo', 'reserveAmmo', 'magazineCapacity']) assert.equal(Object.hasOwn(actor, key), false);
    } else assert.equal(actor.ammo + actor.reserveAmmo, profile.ammo + profile.reserveAmmo);
    const started = startChronicleBattle(session); assert.equal(started.ok, true, started.reason);
    assert.equal(started.battle.actors.find(unit => unit.id === actorId).weaponProfileId, id);
    if (profile.weaponSystem === 'heat')
      assert.equal(getActions(started.battle, actorId).some(action => action.id === 'reload'), false);
    const forged = structuredClone(session);
    forged.loadouts[actorId].weaponProfileId = 'ME3-WPN-AVENGER';
    assert.equal(normalizeChronicle(forged), null, 'An import cannot supply a second mechanics identity');
  }
});

test('selecting Falcon withdraws conventional modules, and forged retained modules cannot reach combat', () => {
  const id = 'ME3-CHR-SHEPARD';
  let session = equipped(workshop('ME3'), id, 'ME3-WPN-AVENGER');
  session = equipped(session, id, 'ME3-EQP-BARREL', 'weaponMod');
  session = equipped(session, id, 'ME3-EQP-MAGAZINE', 'weaponMod2');
  const result = equipChronicle(session, id, 'ME3-WPN-FALCON', 'weapon');
  assert.equal(result.ok, true);
  assert.equal(result.session.loadouts[id].weaponMod, null);
  assert.equal(result.session.loadouts[id].weaponMod2, null);
  const barrel = getChronicleGear(result.session, id, 'weaponMod').find(item => item.id === 'ME3-EQP-BARREL');
  assert.equal(barrel.compatible, false); assert.ok(barrel.slotReasons.weaponMod);
  const forged = structuredClone(result.session); forged.loadouts[id].weaponMod = 'ME3-EQP-BARREL';
  assert.equal(startChronicleBattle(forged).ok, false);
  assert.equal(buildChronicleActor(result.session, id).weaponDamageMultiplier, 1);
});

test('finite grenade preparation is derived from the exact native kit, never from saved resource fields', () => {
  for (const [mediaId, actorId, buildId, actionId] of [
    ['ME3', 'ME3-CHR-SHEPARD', 'soldier', 'fragGrenade'],
    ['ME3', 'ME3-CHR-SHEPARD', 'infiltrator', 'stickyGrenade'],
    ['ME3', 'ME3-CHR-JAMES', 'default', 'fragGrenade'],
    ['MEA', 'MEA-CHR-LIAM', 'default', 'fragGrenade'],
    ['MEA', 'MEA-CHR-JAAL', 'default', 'stickyGrenade'],
  ]) {
    const party = setChronicleParty(workshop(mediaId), [actorId]); assert.equal(party.ok, true, party.reason);
    const changed = setChronicleBuild(party.session, actorId, buildId); assert.equal(changed.ok, true, changed.reason);
    const session = changed.session;
    const actor = buildChronicleActor(session, actorId);
    assert.ok(actor.powers.includes(actionId)); assert.equal(actor.grenadeCharges, 3); assert.equal(actor.grenadeCapacity, 3);
    const imported = decodeChronicle(encodeChronicle(session)); assert.deepEqual(imported, session);
    const forged = { ...session, grenadeCharges: 12 }; assert.equal(normalizeChronicle(forged), null);
  }
  const defaultActor = buildChronicleActor(workshop('ME3'), 'ME3-CHR-SHEPARD');
  assert.equal(defaultActor.powers.includes('fragGrenade'), false);
  assert.equal(Object.hasOwn(defaultActor, 'grenadeCharges'), false);
});

test('every specialist bench launches with its scoped partial profiles and survives a strict session round trip', () => {
  for (const scenario of SPECIALIST_SCENARIOS) {
    const session = createChronicle(scenario.context, scenario.id); assert.ok(session);
    assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
    const launched = startChronicleBattle(session); assert.equal(launched.ok, true, `${scenario.id}: ${launched.reason}`);
    const opponents = launched.battle.actors.filter(actor => actor.team === 'enemy');
    assert.ok(opponents.length > 0); assert.ok(opponents.every(actor => actor.catalogId === null));
    assert.deepEqual(session.cleared, []); assert.equal(Object.hasOwn(session, 'credits'), false);
    const foreign = { ...session, context: context(scenario.context.mediaId === 'ME3' ? 'ME2' : 'ME3') };
    assert.equal(normalizeChronicle(foreign), null);
  }
});

test('separate Evolution reading paths cannot reuse their progress across the two segments', () => {
  const contact = createChronicle({ mediaId: 'EVO', periodId: 'evo-contact' });
  const read = readChroniclePage(contact, 'evo-contact', 0); assert.equal(read.ok, true);
  assert.equal(readChroniclePage(read.session, 'evo-apres-guerre', 0).ok, false);
  const swapped = { ...read.session, context: { mediaId: 'EVO', periodId: 'evo-aftermath', galaxy: 'milky-way' } };
  assert.equal(normalizeChronicle(swapped), null);
  assert.deepEqual(decodeChronicle(encodeChronicle(read.session)), read.session);
});

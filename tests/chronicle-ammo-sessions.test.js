import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeChronicleSession, setChronicleNote } from '../src/continuity.js';
import { createChronicle, normalizeChronicle, getChronicleAmmoModes, setChronicleAmmoMode,
  setChronicleBuild, setChronicleParty, selectChronicleScenario, equipChronicle, buildChronicleActor,
  listChronicleReadings, readChroniclePage, startChronicleBattle, finishChronicleBattle,
  encodeChronicle, decodeChronicle, saveChronicle, loadChronicle, chronicleStorageKey } from '../src/chronicles.js';
import { getActions, performAction, tickBattle } from '../src/combat.js';
import { planSummon, isSummon } from '../src/combat-summons.js';

const clone = value => structuredClone(value);
const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const workshop = mediaId => createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`);
const accepted = result => { assert.equal(result.ok, true, result.reason); return result.session; };
const prepared = (mediaId = 'ME2', buildId = 'soldier') => {
  const session = workshop(mediaId);
  return accepted(setChronicleBuild(session, session.party[0], buildId));
};
const mode = (mediaId = 'ME2', suffix = 'INCENDIARY') => `${mediaId}-POW-AMMO-${suffix}`;
const store = () => {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
function simulate(battle) {
  for (let frame = 0; frame < 12000 && !battle.winner; frame++) {
    for (const actor of battle.actors.filter(actor => actor.team === 'party' && actor.hp > 0 && !isSummon(actor))) {
      const actions = getActions(battle, actor.id).filter(action => action.available);
      const action = ['reload', 'signature', 'burst', 'shoot', 'overload', 'throw', 'warp', 'cover', 'reposition']
        .map(id => actions.find(candidate => candidate.id === id)).find(Boolean);
      if (!action) continue;
      const target = action.target === 'self' ? actor
        : battle.actors.find(candidate => candidate.team === 'enemy' && candidate.hp > 0 && !candidate.statuses.stasis);
      if (target) performAction(battle, { actorId: actor.id, actionId: action.id, targetId: target.id });
    }
    tickBattle(battle, .1);
  }
  assert.ok(battle.winner, 'A real sequence of combat commands reaches an outcome');
}

test('a real pre-expansion v1 save migrates to independent null preferences without changing its historical data', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/chronicle-v1-before-expansion.json', import.meta.url)));
  assert.equal(fixture.provenance.commit, '994a963');
  assert.equal(Object.hasOwn(fixture.packet.session, 'ammoModes'), false);
  const before = clone(fixture), session = decodeChronicle(fixture.packet);
  assert.ok(session);
  assert.deepEqual(session.ammoModes, Object.fromEntries(session.party.map(id => [id, null])));
  assert.deepEqual(session.notes, fixture.packet.session.notes);
  assert.deepEqual(session.discovered, fixture.packet.session.discovered);
  for (const id of session.party) {
    assert.deepEqual(session.loadouts[id], { ...fixture.packet.session.loadouts[id], weaponMod: null, weaponMod2: null });
    assert.equal(buildChronicleActor(session, id).ammoModeId, null);
  }
  const storage = store(); assert.equal(saveChronicle(storage, session).ok, true);
  assert.deepEqual(loadChronicle(storage, session.context).session, session);
  assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
  assert.deepEqual(fixture, before);
});

test('a provided ammo map exactly matches the current party and cannot supply actor permissions or mechanics', () => {
  const session = prepared(), id = session.party[0];
  const invalid = [null, [], {}, { [id]: null }, { ...session.ammoModes, stranger: null },
    { ...session.ammoModes, [id]: undefined }, { ...session.ammoModes, [id]: 1 },
    { ...session.ammoModes, [id]: {} }, { ...session.ammoModes, [id]: 'unknown' },
    { ...session.ammoModes, [id]: 'ME3-POW-AMMO-INCENDIARY' }];
  for (const ammoModes of invalid) {
    const forged = { ...session, ammoModes };
    assert.equal(normalizeChronicleSession(forged), null);
    assert.equal(normalizeChronicle(forged), null);
  }
  for (const extra of [{ allowedAmmoProfileIds: [mode()] }, { powers: ['ammoIncendiary'] }, { ammoModeId: mode() }]) {
    assert.equal(normalizeChronicle({ ...session, ...extra }), null);
  }
  assert.deepEqual(session, prepared());
});

test('getters, hidden or symbolic properties, cycles and foreign prototypes in preferences are refused without execution', () => {
  const session = prepared(), id = session.party[0]; let calls = 0;
  const hostileMaps = [];
  const accessor = clone(session.ammoModes);
  Object.defineProperty(accessor, id, { enumerable: true, get() { calls++; throw new Error('getter'); } });
  hostileMaps.push(accessor);
  const hidden = clone(session.ammoModes); Object.defineProperty(hidden, 'hidden', { value: null }); hostileMaps.push(hidden);
  const symbolic = clone(session.ammoModes); symbolic[Symbol('extra')] = null; hostileMaps.push(symbolic);
  const cyclic = clone(session.ammoModes); cyclic[id] = cyclic; hostileMaps.push(cyclic);
  hostileMaps.push(Object.assign(Object.create({ inherited: null }), session.ammoModes));
  hostileMaps.push(JSON.parse(`{"${id}":null,"__proto__":{}}`));
  for (const ammoModes of hostileMaps) assert.equal(normalizeChronicle({ ...session, ammoModes }), null);
  const getterSession = clone(session);
  Object.defineProperty(getterSession, 'ammoModes', { enumerable: true, get() { calls++; return session.ammoModes; } });
  assert.equal(normalizeChronicle(getterSession), null);
  assert.equal(setChronicleAmmoMode(getterSession, id, mode()).ok, false);
  const forgedId = { get id() { calls++; return mode(); }, toString() { calls++; return mode(); } };
  assert.equal(setChronicleAmmoMode(session, id, forgedId).ok, false);
  assert.equal(calls, 0);
});

test('profile lists expose real media and kit compatibility before selection, without granting permissions', () => {
  const session = prepared(), id = session.party[0], before = clone(session);
  const choices = getChronicleAmmoModes(session, id);
  assert.equal(choices.length, 6);
  assert.deepEqual(choices.filter(item => item.compatible).map(item => item.id).sort(),
    ['INCENDIARY', 'CRYO', 'DISRUPTOR'].map(suffix => mode('ME2', suffix)).sort());
  assert.ok(choices.filter(item => !item.compatible).every(item => item.reason));
  assert.ok(choices.every(item => item.mediaId === 'ME2' && !item.selected));
  choices[0].sourceIds.push('forged'); choices[0].name = 'Changed';
  assert.equal(getChronicleAmmoModes(session, id)[0].sourceIds.includes('forged'), false);
  assert.equal(getChronicleAmmoModes(session, 'ME3-CHR-SHEPARD').length, 0);
  const me3 = prepared('ME3');
  const warp = getChronicleAmmoModes(me3, me3.party[0]).find(item => item.id === mode('ME3', 'WARP'));
  assert.equal(warp.compatible, false); assert.ok(warp.reason);
  const mea = workshop('MEA'); assert.deepEqual(getChronicleAmmoModes(mea, mea.party[0]), []);
  assert.deepEqual(session, before);
});

test('selection, replacement, idempotence and removal are atomic and persist exact catalogue IDs', () => {
  const session = prepared(), id = session.party[0], before = clone(session);
  let selected = accepted(setChronicleAmmoMode(session, id, mode()));
  assert.deepEqual(session, before); assert.equal(selected.ammoModes[id], mode());
  assert.equal(buildChronicleActor(selected, id).ammoModeId, mode());
  assert.ok(buildChronicleActor(selected, id).allowedAmmoProfileIds.includes(mode()));
  assert.equal(getChronicleAmmoModes(selected, id).find(item => item.id === mode()).selected, true);
  assert.deepEqual(accepted(setChronicleAmmoMode(selected, id, mode())), selected);
  selected = accepted(setChronicleAmmoMode(selected, id, mode('ME2', 'CRYO')));
  assert.equal(selected.ammoModes[id], mode('ME2', 'CRYO'));
  assert.equal(getChronicleAmmoModes(selected, id).filter(item => item.selected).length, 1);
  assert.deepEqual(decodeChronicle(encodeChronicle(selected)), selected);
  selected = accepted(setChronicleAmmoMode(selected, id, null));
  assert.equal(selected.ammoModes[id], null);
  for (const invalid of [undefined, false, 0, 'constructor', 'ME2-WPN-PREDATOR', mode('ME2', 'AP'), mode('ME3')]) {
    const snapshot = clone(selected);
    assert.equal(setChronicleAmmoMode(selected, id, invalid).ok, false);
    assert.deepEqual(selected, snapshot);
  }
});

test('companion modes come from their own sourced kits and loyalty scope instead of another similarly named actor', () => {
  const expectations = [
    ['ME2', 'ME2-CHR-GARRUS', 'AP'], ['ME2', 'ME2-CHR-JACK', 'WARP'],
    ['ME2', 'ME2-CHR-THANE', 'SHREDDER'], ['ME2', 'ME2-CHR-JACOB', 'INCENDIARY'],
    ['ME3', 'ME3-CHR-GARRUS', 'AP'], ['ME3', 'ME3-CHR-ASHLEY', 'DISRUPTOR'],
  ];
  for (const [mediaId, id, suffix] of expectations) {
    const session = accepted(setChronicleParty(workshop(mediaId), [id]));
    const profileId = mode(mediaId, suffix), selected = accepted(setChronicleAmmoMode(session, id, profileId));
    assert.deepEqual(buildChronicleActor(selected, id).allowedAmmoProfileIds, [profileId]);
    assert.equal(buildChronicleActor(selected, id).ammoModeId, profileId);
    const wrongMedia = mode(mediaId === 'ME2' ? 'ME3' : 'ME2', suffix);
    assert.equal(setChronicleAmmoMode(selected, id, wrongMedia).ok, false);
  }
  const liara = accepted(setChronicleParty(workshop('ME3'), ['ME3-CHR-LIARA']));
  assert.equal(setChronicleAmmoMode(liara, 'ME3-CHR-LIARA', mode('ME3', 'WARP')).ok, false);
  const document = createChronicle(context('RED'));
  assert.deepEqual(document.ammoModes, Object.fromEntries(document.party.map(id => [id, null])));
  assert.equal(setChronicleAmmoMode(document, document.party[0], mode('ME2', 'WARP')).ok, false);
});

test('forged imports cannot turn a documentary power, another kit or another medium into an active mode', () => {
  const session = prepared(), id = session.party[0];
  for (const modeId of [mode('ME2', 'AP'), mode('ME2', 'WARP'), mode('ME2', 'SHREDDER'), 'ME2-WPN-PREDATOR']) {
    const forged = { ...session, ammoModes: { ...session.ammoModes, [id]: modeId } }, before = clone(forged);
    assert.equal(normalizeChronicle(forged), null); assert.equal(encodeChronicle(forged), null);
    const storage = store(), key = chronicleStorageKey(session.context); storage.setItem(key, 'previous-save');
    assert.equal(saveChronicle(storage, forged).ok, false); assert.equal(storage.getItem(key), 'previous-save');
    assert.deepEqual(forged, before);
  }
  const defaultKit = workshop('ME2');
  assert.equal(setChronicleAmmoMode(defaultKit, defaultKit.party[0], mode()).ok, false);
  const prologue = createChronicle(context('ME2'), 'me2-freedoms-progress');
  assert.equal(setChronicleAmmoMode(prologue, 'ME2-CHR-JACOB', mode()).ok, true, 'Jacob keeps his actual base-kit Incendiary power');
  assert.equal(setChronicleAmmoMode(prologue, prologue.party[0], mode()).ok, false);
  const mea = workshop('MEA'), ryder = mea.party[0];
  assert.equal(setChronicleAmmoMode(mea, ryder, 'MEA-EQP-AMMO-FIRE').ok, false);
  assert.equal(normalizeChronicle({ ...mea, ammoModes: { ...mea.ammoModes, [ryder]: mode() } }), null);
});

test('class changes preserve common learned modes and withdraw those the actual new build does not learn', () => {
  const session = prepared(), id = session.party[0];
  let selected = accepted(setChronicleAmmoMode(session, id, mode('ME2', 'CRYO')));
  const before = clone(selected), common = setChronicleBuild(selected, id, 'infiltrator');
  assert.equal(common.ok, true); assert.equal(common.session.ammoModes[id], mode('ME2', 'CRYO'));
  assert.equal(common.clearedAmmoMode, null); assert.deepEqual(selected, before);
  const lost = setChronicleBuild(common.session, id, 'adept');
  assert.equal(lost.ok, true); assert.equal(lost.session.ammoModes[id], null);
  assert.equal(lost.clearedAmmoMode, mode('ME2', 'CRYO'));
  selected = accepted(setChronicleAmmoMode(session, id, mode()));
  const removed = setChronicleBuild(selected, id, 'infiltrator');
  assert.equal(removed.session.ammoModes[id], null); assert.equal(removed.clearedAmmoMode, mode());
  assert.equal(setChronicleBuild(selected, id, 'invented').ok, false);
  assert.equal(selected.ammoModes[id], mode());
});

test('conventional weapon replacement keeps a valid mode while specialist replacement removes it before saving', () => {
  let session = prepared('ME3'); const id = session.party[0];
  session = accepted(equipChronicle(session, id, 'ME3-WPN-AVENGER', 'weapon'));
  session = accepted(equipChronicle(session, id, 'ME3-EQP-BARREL', 'weaponMod'));
  session = accepted(setChronicleAmmoMode(session, id, mode('ME3')));
  const before = clone(session), conventional = equipChronicle(session, id, 'ME3-WPN-VINDICATOR', 'weapon');
  assert.equal(conventional.ok, true); assert.equal(conventional.session.ammoModes[id], mode('ME3'));
  assert.deepEqual(conventional.returnedMods, ['ME3-EQP-BARREL']); assert.equal(conventional.clearedAmmoMode, null);
  assert.deepEqual(session, before);
  const special = equipChronicle(conventional.session, id, 'ME3-WPN-FALCON', 'weapon');
  assert.equal(special.ok, true); assert.equal(special.session.ammoModes[id], null);
  assert.equal(special.clearedAmmoMode, mode('ME3'));
  assert.equal(buildChronicleActor(special.session, id).weaponProfileId, 'ME3-WPN-FALCON');
  assert.equal(setChronicleAmmoMode(special.session, id, mode('ME3')).ok, false);
  assert.deepEqual(decodeChronicle(encodeChronicle(special.session)), special.session);
  assert.equal(normalizeChronicle({ ...special.session, ammoModes: { ...special.session.ammoModes, [id]: mode('ME3') } }), null);
  const restored = accepted(equipChronicle(special.session, id, 'ME3-WPN-AVENGER', 'weapon'));
  assert.equal(restored.ammoModes[id], null, 'Returning to a compatible gun does not invent a new selection');
  assert.equal(setChronicleAmmoMode(restored, id, mode('ME3')).ok, true);
});

test('MEA heat and special weapon preparations remain mode-free and keep the existing four equipment ports', () => {
  let session = workshop('MEA'); const id = session.party[0];
  for (const weapon of ['MEA-WPN-AVENGER', 'MEA-WPN-PAW', 'MEA-WPN-SWEEPER', 'MEA-WPN-REEGAR']) {
    session = accepted(equipChronicle(session, id, weapon, 'weapon'));
    assert.equal(session.ammoModes[id], null);
    assert.deepEqual(Object.keys(session.loadouts[id]), ['weapon', 'armor', 'weaponMod', 'weaponMod2']);
    for (const forged of [mode('ME2'), mode('ME3'), 'MEA-EQP-AMMO-FIRE']) {
      assert.equal(setChronicleAmmoMode(session, id, forged).ok, false);
    }
    assert.deepEqual(decodeChronicle(encodeChronicle(session)), session);
  }
});

test('party and scenario selections preserve eligible common actors but remove obsolete or foreign preferences', () => {
  let session = prepared(); const id = session.party[0], jacob = 'ME2-CHR-JACOB';
  session = accepted(setChronicleAmmoMode(session, id, mode()));
  session = accepted(setChronicleAmmoMode(session, jacob, mode()));
  const selected = accepted(setChronicleParty(session, [jacob, 'ME2-CHR-GARRUS', id]));
  assert.deepEqual(selected.ammoModes, { [jacob]: mode(), 'ME2-CHR-GARRUS': null, [id]: mode() });
  assert.equal(setChronicleParty(selected, ['ME3-CHR-GARRUS']).ok, false);
  const changedScenario = accepted(selectChronicleScenario(selected, 'me2-freedoms-progress'));
  assert.ok(changedScenario.party.includes(jacob));
  assert.equal(changedScenario.ammoModes[jacob], mode(), 'Jacob retains an actually learned base-kit mode in the prologue');
  assert.equal(changedScenario.ammoModes[id], null, 'Changing scenario resets the class preparation as before');
  assert.equal(Object.hasOwn(changedScenario.ammoModes, 'ME2-CHR-GARRUS'), false);
  const again = accepted(selectChronicleScenario(session, 'me2-equipment-workshop'));
  assert.equal(again.ammoModes[jacob], mode(), 'Common actual default-kit permissions survive a scenario reset');
  const removed = accepted(setChronicleParty(selected, [jacob]));
  assert.deepEqual(removed.ammoModes, { [jacob]: mode() });
  assert.deepEqual(session.ammoModes, { [id]: mode(), 'ME2-CHR-MIRANDA': null, [jacob]: mode() });
});

test('reading, discoveries, notes and exact isolated storage preserve all valid preference maps', () => {
  let session = prepared(); const id = session.party[0];
  session = accepted(setChronicleAmmoMode(session, id, mode()));
  assert.equal(setChronicleNote(session, id, 'Une note personnelle.' ).ok, true);
  const storage = store(); storage.setItem('relay-chronicles.save.v1', 'campaign-bytes');
  assert.equal(saveChronicle(storage, session).ok, true);
  const encoded = storage.getItem(chronicleStorageKey(session.context));
  assert.deepEqual(loadChronicle(storage, session.context).session, session);
  assert.equal(encodeChronicle(decodeChronicle(encoded)), encoded);
  assert.equal(storage.getItem('relay-chronicles.save.v1'), 'campaign-bytes');
  assert.equal(saveChronicle({ setItem() { throw new Error('quota'); } }, session).ok, false);
  assert.equal(storage.getItem(chronicleStorageKey(session.context)), encoded);
  let readingSession = createChronicle(context('RED'));
  const story = listChronicleReadings(readingSession.context)[0];
  const beforeModes = clone(readingSession.ammoModes);
  readingSession = accepted(readChroniclePage(readingSession, story.id, 0));
  assert.deepEqual(readingSession.ammoModes, beforeModes);
  assert.deepEqual(decodeChronicle(encodeChronicle(readingSession)), readingSession);
});

test('a result cannot be claimed under a different preparation mode even when class, party and weapon match', () => {
  const base = prepared(), id = base.party[0];
  const session = accepted(setChronicleAmmoMode(base, id, mode()));
  const started = startChronicleBattle(session); assert.equal(started.ok, true); simulate(started.battle);
  const other = accepted(setChronicleAmmoMode(session, id, mode('ME2', 'CRYO')));
  const before = clone(other);
  assert.equal(finishChronicleBattle(other, started.battle).ok, false); assert.deepEqual(other, before);
  const result = finishChronicleBattle(session, started.battle); assert.equal(result.ok, true);
  assert.equal(result.session.ammoModes[id], mode());
  assert.equal(finishChronicleBattle(session, started.battle).ok, false);
});

test('a real combat activation changes only the live actor and leaves the prepared save and outcome fingerprint intact', () => {
  const base = prepared(), id = base.party[0];
  const session = accepted(setChronicleAmmoMode(base, id, mode())), before = clone(session);
  const started = startChronicleBattle(session); assert.equal(started.ok, true, started.reason);
  const battle = started.battle, actor = battle.actors.find(candidate => candidate.id === id);
  assert.equal(actor.ammoModeId, mode());
  for (let frame = 0; frame < 300 && !getActions(battle, id).find(action => action.id === 'ammoCryo')?.available; frame++) tickBattle(battle, .1);
  const command = getActions(battle, id).find(action => action.id === 'ammoCryo');
  assert.equal(command?.available, true, command?.reason);
  assert.equal(performAction(battle, { actorId: id, actionId: command.id, targetId: id }).ok, true);
  assert.equal(actor.ammoModeId, mode('ME2', 'CRYO'));
  assert.deepEqual(session, before);
  assert.equal(decodeChronicle(encodeChronicle(session)).ammoModes[id], mode());
  simulate(battle);
  const finished = finishChronicleBattle(session, battle);
  assert.equal(finished.ok, true, finished.reason); assert.equal(finished.session.ammoModes[id], mode());
});

test('real supported entities cannot replace missing native actors or supply a party-only survivor', () => {
  const session = prepared('ME3', 'engineer'), started = startChronicleBattle(session);
  assert.equal(started.ok, true); const battle = started.battle;
  const deployment = planSummon({ actors: battle.actors, ownerId: session.party[0], actionId: 'combatDrone',
    elapsed: 0, serial: 1, targetId: 'chronicle-enemy-0' });
  assert.equal(deployment.ok, true, deployment.reason); assert.equal(isSummon(deployment.actor), true);
  battle.actors.push(deployment.actor);
  for (const actor of battle.actors.filter(actor => !isSummon(actor))) actor.hp = 0;
  battle.winner = 'party';
  assert.equal(finishChronicleBattle(session, battle).ok, false, 'A live summon does not turn native mutual KO into a party victory');
  battle.winner = 'enemy';
  assert.equal(finishChronicleBattle(session, battle).ok, true, 'The support is ignored when recording native defeat');
  const second = startChronicleBattle(session).battle;
  const absent = second.actors.findIndex(actor => actor.id === session.party[0]); second.actors.splice(absent, 1);
  for (const actor of second.actors.filter(actor => actor.team === 'enemy')) actor.hp = 0;
  second.winner = 'party';
  assert.equal(finishChronicleBattle(session, second).ok, false, 'Every native actor must still belong to the result');
});

test('native result identities cannot be duplicated, hidden by support flags or replaced with foreign entities', () => {
  const session = prepared('ME3', 'engineer');
  for (const change of [
    battle => { battle.actors[0].id = 'foreign-native'; },
    battle => { battle.actors[0].id = battle.actors[1].id; },
    battle => { battle.actors.push({ id: 'forged-device', team: 'party', hp: 10, autonomous: true, countsForVictory: false }); },
  ]) {
    const battle = startChronicleBattle(session).battle;
    for (const actor of battle.actors.filter(actor => actor.team === 'enemy')) actor.hp = 0;
    battle.winner = 'party'; change(battle);
    assert.equal(finishChronicleBattle(session, battle).ok, false);
  }
  const battle = startChronicleBattle(session).battle;
  const deployment = planSummon({ actors: battle.actors, ownerId: session.party[0], actionId: 'combatDrone', elapsed: 0, serial: 1 });
  assert.equal(deployment.ok, true); battle.actors.push(deployment.actor);
  for (const actor of battle.actors.filter(actor => actor.team === 'enemy')) actor.hp = 0;
  battle.winner = 'party';
  assert.equal(finishChronicleBattle(session, battle).ok, true, 'An actual live support does not obstruct a native victory');
});

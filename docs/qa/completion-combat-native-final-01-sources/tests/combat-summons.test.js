import test from 'node:test';
import assert from 'node:assert/strict';
import { SUMMON_PROFILES, SUMMON_LIMITS, getSummonProfile, isSummon, isVictoryParticipant, planSummon, planSummonTick } from '../src/combat-summons.js';

const owner = (changes = {}) => ({ id: 'owner', mediaId: 'ME3', team: 'party', hp: 200, maxHp: 200,
  powers: ['combatDrone', 'sentryTurret', 'defenseDrone'], statuses: {}, techMultiplier: 1, ...changes });
const enemy = (changes = {}) => ({ id: 'enemy', team: 'enemy', hp: 1000, statuses: {}, ...changes });
const actors = () => [owner(), enemy()];
function spawn(list, actionId = 'combatDrone', serial = 1, extra = {}) {
  return planSummon({ actors: list, ownerId: 'owner', actionId, elapsed: 0, serial, ...extra });
}
function applySpawn(list, result) {
  assert.equal(result.ok, true, result.reason);
  return [...list.filter(actor => !result.retireIds.includes(actor.id)), result.actor];
}
function applyTick(list, result) {
  assert.equal(result.ok, true, result.reason);
  return list.filter(actor => !result.retireIds.includes(actor.id)).map(actor => ({ ...actor,
    ...result.patches.find(patch => patch.actorId === actor.id) }));
}
const tick = (list, elapsed, recentEvents = []) => planSummonTick({ actors: list, elapsed, recentEvents });
const hit = (id, at, changes = {}) => ({ id, at, type: 'damage', actorId: 'enemy', targetId: 'owner', amount: 10, ...changes });

test('four frozen profiles retain exact work/action identity and disclose prototype rules', () => {
  assert.equal(SUMMON_PROFILES.length, 4);
  assert.ok(getSummonProfile('ME2', 'combatDrone'));
  for (const actionId of ['combatDrone', 'sentryTurret', 'defenseDrone']) assert.ok(getSummonProfile('ME3', actionId));
  for (const [media, action] of [['ME1', 'combatDrone'], ['MEA', 'sentryTurret'], ['ME2', 'defenseDrone'], ['ME2', 'sentryTurret']]) assert.equal(getSummonProfile(media, action), null);
  for (const profile of SUMMON_PROFILES) {
    assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.sourceIds));
    assert.equal(profile.statsBasis, 'ATB adaptation'); assert.equal(profile.primarySourceVerifiedMechanics, false);
    assert.match(profile.limitations.join(' '), /proximité physique/);
  }
  assert.match(getSummonProfile('ME2', 'combatDrone').primaryReference.scope, /pas les paramètres/);
});

test('deployment produces a fresh targetable synthetic entity without copying owner equipment or HP', () => {
  const list = actors(); list[0].techMultiplier = 1.5;
  Object.assign(list[0], { ammoModeId: 'owner-ammo', allowedAmmoProfileIds: ['owner-ammo'], weaponProfileId: 'owner-weapon', weaponDamageMultiplier: 3 });
  const before = structuredClone(list), result = spawn(list);
  assert.equal(result.ok, true); assert.deepEqual(list, before);
  const summon = result.actor;
  assert.equal(summon.id, 'summon:owner:combatDrone:1'); assert.equal(summon.ownerId, 'owner');
  assert.equal(summon.actionId, 'combatDrone'); assert.equal(summon.expiresAt, 18);
  assert.equal(summon.hp, 65); assert.equal(summon.maxHp, 65); assert.equal(summon.attack, 13.5);
  assert.equal(summon.synthetic, true); assert.equal(summon.targetable, true); assert.equal(summon.isSummon, true);
  assert.equal(summon.autonomous, true); assert.equal(summon.countsForVictory, false); assert.equal(summon.canRevive, false);
  assert.equal(summon.sprite, null); assert.equal(summon.portrait, null);
  for (const field of ['ammoModeId', 'allowedAmmoProfileIds', 'ammoModes', 'weaponProfileId', 'weaponDamageMultiplier']) assert.equal(summon[field], undefined);
  assert.equal(isSummon(summon), true); assert.equal(isVictoryParticipant(summon), false);
  assert.equal(isVictoryParticipant({ ...owner(), countsForVictory: false }), true);
  summon.hp = 1; summon.statuses.stasis = 2;
  assert.equal(list[0].hp, 200); assert.deepEqual(list[0].statuses, {});
});

test('invalid owners, training, identities and focus targets fail atomically', () => {
  for (const changes of [{ hp: 0 }, { powers: [] }, { mediaId: 'ME1' }, { statuses: { stasis: 2 } }]) {
    const list = [owner(changes), enemy()], before = structuredClone(list);
    assert.equal(spawn(list).ok, false); assert.deepEqual(list, before);
  }
  for (const target of [enemy({ hp: 0 }), enemy({ statuses: { stasis: 5 } })]) assert.equal(spawn([owner(), target]).ok, false);
  assert.equal(spawn(actors(), 'combatDrone', 1, { targetId: 'missing' }).ok, false);
  assert.equal(spawn(actors(), 'sentryTurret', 1, { targetId: 'enemy' }).ok, false);
  assert.equal(spawn(actors(), 'unknown').ok, false);
  assert.equal(spawn(actors(), 'combatDrone', -1).ok, false);
  assert.equal(spawn(actors(), 'combatDrone', 1, { elapsed: NaN }).ok, false);
  assert.equal(spawn(actors(), 'combatDrone', 1, { elapsed: 1e300 }).ok, false);
  assert.equal(spawn(actors(), 'combatDrone', SUMMON_LIMITS.maximumSerial).ok, true);
  const original = spawn(actors());
  assert.equal(spawn(applySpawn(actors(), original), 'combatDrone', 1).ok, false);
});

test('replacement, two types per owner and six active entities per team enforce the announced ATB budget', () => {
  let list = actors(); list = applySpawn(list, spawn(list));
  const replacement = spawn(list, 'combatDrone', 2);
  assert.deepEqual(replacement.retireIds, ['summon:owner:combatDrone:1']);
  assert.equal(replacement.nextSerial, 3); list = applySpawn(list, replacement);
  list = applySpawn(list, spawn(list, 'sentryTurret', 3));
  const before = structuredClone(list); assert.equal(spawn(list, 'defenseDrone', 4).ok, false); assert.deepEqual(list, before);
  list = [owner(), owner({ id: 'owner2' }), owner({ id: 'owner3' }), owner({ id: 'owner4' }), enemy()];
  let serial = 1;
  for (const ownerId of ['owner', 'owner2', 'owner3']) for (const actionId of ['combatDrone', 'sentryTurret']) {
    list = applySpawn(list, planSummon({ actors: list, ownerId, actionId, elapsed: 0, serial: serial++ }));
  }
  assert.equal(list.filter(isSummon).length, SUMMON_LIMITS.perTeam);
  assert.equal(spawn(list, 'defenseDrone', serial, { ownerId: 'owner4' }).ok, false);
  assert.equal(spawn(list, 'combatDrone', serial).ok, true, 'A replacement can reuse an occupied team slot');
  const hostileOwner = owner({ id: 'hostile-owner', team: 'enemy' }); list.push(hostileOwner);
  assert.equal(spawn(list, 'combatDrone', serial, { ownerId: hostileOwner.id }).ok, true, 'The other team has its own bounded allowance');
});

test('dead, orphaned and expired summons retire without keeping a side alive or attacking after KO', () => {
  for (const kind of ['destroyed', 'ownerKO', 'orphan']) {
    let list = applySpawn(actors(), spawn(actors()));
    if (kind === 'destroyed') list.find(isSummon).hp = 0;
    else if (kind === 'ownerKO') list[0].hp = 0;
    else list = list.filter(actor => actor.id !== 'owner');
    const result = tick(list, 10);
    assert.equal(result.ok, true); assert.equal(result.attacks.length, 0); assert.equal(result.retireIds.length, 1);
    const participants = list.filter(isVictoryParticipant);
    assert.equal(participants.some(actor => actor.team === 'party' && actor.hp > 0), kind === 'destroyed');
  }
  const list = applySpawn(actors(), spawn(actors())), summon = list.find(isSummon);
  summon.nextAttackAt = summon.expiresAt;
  const expired = tick(list, summon.expiresAt);
  assert.deepEqual(expired.attacks, []); assert.equal(expired.retirements[0].reason, 'expired');
});

test('attack schedules and expiry remain identical across different tick granularities', () => {
  let base = actors(); base = applySpawn(base, spawn(base)); base = applySpawn(base, spawn(base, 'sentryTurret', 2));
  const coarse = tick(base, 21), fineAttacks = []; let fine = structuredClone(base);
  for (let quarter = 1; quarter <= 84; quarter++) {
    const result = tick(fine, quarter * .25); fineAttacks.push(...result.attacks); fine = applyTick(fine, result);
  }
  assert.deepEqual(fineAttacks, coarse.attacks);
  assert.ok(coarse.attacks.every(attack => attack.at < base.find(actor => actor.id === attack.actorId).expiresAt));
  assert.equal(fine.filter(isSummon).length, 0); assert.equal(coarse.retireIds.length, 2);
});

test('harassment retargets a lost focus and never schedules a hit against dead or Stasis targets', () => {
  let list = [owner(), enemy(), enemy({ id: 'other' }), enemy({ id: 'frozen', statuses: { stasis: 6 } })];
  list = applySpawn(list, spawn(list, 'combatDrone', 1, { targetId: 'enemy' })); list.find(actor => actor.id === 'enemy').hp = 0;
  const first = tick(list, 2); assert.equal(first.attacks[0].targetId, 'other'); assert.equal(first.attacks[0].breakCover, true);
  assert.equal(first.attacks[0].staggerRequiresUnprotected, true);
  list = applyTick(list, first); list.find(actor => actor.id === 'other').hp = 0;
  assert.deepEqual(tick(list, 4).attacks, []);
});

test('the native hacked status changes a device target camp without duplicating its owner or team HP', () => {
  const list = applySpawn(actors(), spawn(actors())); list.find(isSummon).statuses.hacked = 6;
  const result = tick(list, 2); assert.equal(result.attacks[0].targetId, 'owner');
  assert.equal(result.attacks[0].actionId, 'summonPulse'); assert.equal(result.attacks[0].family, 'tech');
});

test('Defense Drone reacts to actual owner damage, consumes the event cursor, and never acts as Barrier', () => {
  let list = applySpawn(actors(), spawn(actors(), 'defenseDrone', 1, { eventCursor: 4 }));
  const events = [hit(4, 0), hit(5, 1), hit(6, 2), hit(7, 3.1), hit(8, 3.5, { type: 'heal' }),
    hit(9, 3.5, { amount: 0 }), hit(10, 4, { targetId: 'other' })];
  const first = tick(list, 4, events);
  assert.deepEqual(first.attacks.map(attack => attack.at), [1, 3.1]);
  assert.ok(first.attacks.every(attack => attack.powerActionId === 'defenseDrone' && attack.targetId === 'enemy'));
  assert.ok(first.patches.every(patch => !('hp' in patch) && !('shield' in patch) && !('statuses' in patch)));
  assert.equal(first.patches[0].eventCursor, 10);
  list = applyTick(list, first);
  assert.deepEqual(tick(list, 4.5, events).attacks, [], 'Applying the cursor prevents double reactions');
  assert.equal(list[0].shield, undefined); assert.deepEqual(list[0].statuses, {});
});

test('guard reactions have the same ordering for a coarse event batch and fine repeated plans', () => {
  const base = applySpawn(actors(), spawn(actors(), 'defenseDrone'));
  const events = [hit(1, .5), hit(2, 1), hit(3, 3), hit(4, 5.5), hit(5, 9)];
  const coarse = tick(base, 10, events), fineAttacks = []; let fine = structuredClone(base);
  for (let quarter = 1; quarter <= 40; quarter++) {
    const result = tick(fine, quarter * .25, events); fineAttacks.push(...result.attacks); fine = applyTick(fine, result);
  }
  assert.deepEqual(fineAttacks, coarse.attacks); assert.deepEqual(coarse.attacks.map(attack => attack.at), [.5, 3, 5.5, 9]);
});

test('a guard never retaliates against a dead, invulnerable or unrelated attacker', () => {
  let list = [owner(), enemy({ hp: 0 }), enemy({ id: 'stasis', statuses: { stasis: 6 } }), enemy({ id: 'other' })];
  list = applySpawn(list, spawn(list, 'defenseDrone'));
  const result = tick(list, 4, [hit(1, 1), hit(2, 2, { actorId: 'stasis' }), hit(3, 3, { actorId: 'other', targetId: 'someone-else' })]);
  assert.deepEqual(result.attacks, []); assert.equal(result.patches[0].eventCursor, 3);
});

test('disabled devices discard blocked opportunities instead of catching up with a phantom volley', () => {
  let list = applySpawn(actors(), spawn(actors())); list.find(isSummon).statuses.stasis = 5;
  const blocked = tick(list, 3); assert.deepEqual(blocked.attacks, []);
  list = applyTick(list, blocked); list.find(isSummon).statuses = {};
  assert.deepEqual(tick(list, 4).attacks, []);
  assert.equal(tick(list, 5).attacks.length, 1);
  let guard = applySpawn(actors(), spawn(actors(), 'defenseDrone')); guard.find(isSummon).statuses.sabotage = 4;
  const lost = tick(guard, 1, [hit(1, 1)]); guard = applyTick(guard, lost); guard.find(isSummon).statuses = {};
  assert.deepEqual(tick(guard, 4, [hit(1, 1)]).attacks, []);
});

test('HP remains solely in the actual battle entity and plans never clone a second mutable health store', () => {
  const list = applySpawn(actors(), spawn(actors())), summon = list.find(isSummon);
  const before = structuredClone(list), plan = tick(list, 2); assert.deepEqual(list, before);
  assert.ok(plan.attacks.every(attack => typeof attack.targetId === 'string' && !('target' in attack) && !('hp' in attack)));
  assert.ok(plan.patches.every(patch => !('hp' in patch) && !('maxHp' in patch)));
  summon.hp = 0;
  const destroyed = tick(list, 2.1); assert.deepEqual(destroyed.attacks, []); assert.deepEqual(destroyed.retireIds, [summon.id]);
});

test('malformed requests and accessor-bearing input fail without reading getters or partially allocating', () => {
  let calls = 0;
  const bad = owner(); Object.defineProperty(bad, 'hp', { enumerable: true, get() { calls++; throw new Error('getter'); } });
  assert.equal(spawn([bad, enemy()]).ok, false); assert.equal(calls, 0);
  const powers = ['combatDrone']; Object.defineProperty(powers, '0', { enumerable: true, get() { calls++; return 'combatDrone'; } });
  assert.equal(spawn([owner({ powers }), enemy()]).ok, false); assert.equal(calls, 0);
  const list = actors(), before = structuredClone(list);
  for (const input of [null, [], { actors: [list[0], list[0]], elapsed: 1 }, { actors: list, elapsed: -1 }, { actors: list, elapsed: 1, recentEvents: [hit(1, 0), hit(1, 1)] }]) assert.equal(planSummonTick(input).ok, false);
  assert.deepEqual(list, before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, createBattle, getActions, performAction, tickBattle } from '../src/combat.js';

const NEW_POWERS = ['pull', 'incinerate', 'cryoBlast', 'concussiveShot', 'energyDrain', 'fortification', 'reave', 'shockwave', 'slam', 'dominate'];
const caster = (changes = {}) => ({ id: 'caster', name: 'Lanceur', hp: 200, maxHp: 400, shield: 20, maxShield: 120,
  attack: 20, defense: 0, speed: .1, atb: 100, powers: [...NEW_POWERS, 'throw', 'overload', 'stasis'], mediaId: 'ME2', ...changes });
const target = (changes = {}) => ({ id: 'target', name: 'Cible', hp: 10000, maxHp: 10000, shield: 0, maxShield: 0,
  attack: 20, defense: 0, speed: .1, powers: [], ...changes });
const build = (sourceChanges = {}, targetChanges = {}, extraEnemies = []) => createBattle({ mode: 'active', rng: () => .5,
  party: [caster(sourceChanges)], enemies: [target(targetChanges), ...extraEnemies] });
const unit = (battle, id = 'caster') => battle.actors.find(actor => actor.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should equal ${expected}`);
function cast(battle, actionId, targetId = 'target', actorId = 'caster') {
  unit(battle, actorId).atb = 100;
  return performAction(battle, { actorId, actionId, targetId: ACTIONS[actionId].target === 'self' ? actorId : targetId });
}
function requireCast(battle, actionId, targetId, actorId) {
  const result = cast(battle, actionId, targetId, actorId); assert.equal(result.ok, true, result.reason); return result;
}
const damage = result => result.events.find(event => event.type === 'damage')?.amount || 0;

test('new powers require training, spend one ATB order, and use cooldowns without weapon resources', () => {
  const untrained = build({ powers: [] });
  assert.ok(getActions(untrained, 'caster').every(action => !NEW_POWERS.includes(action.id)));
  assert.equal(cast(untrained, 'pull').ok, false);
  const battle = build({ heat: 60, weaponSystem: 'thermal-clip', ammo: 8, magazineCapacity: 8, reserveAmmo: 32 });
  requireCast(battle, 'pull');
  const source = unit(battle); assert.equal(source.atb, 0); assert.equal(source.cooldowns.pull, 8);
  assert.equal(source.ammo, 8); assert.equal(source.reserveAmmo, 32); assert.equal(source.heat, 0);
  source.atb = 100;
  const before = JSON.stringify(battle);
  assert.equal(performAction(battle, { actorId: 'caster', actionId: 'pull', targetId: 'target' }).ok, false);
  assert.equal(JSON.stringify(battle), before);
  tickBattle(battle, 8); source.atb = 100;
  assert.equal(getActions(battle, source.id).find(action => action.id === 'pull').available, true);
});

test('Pull suspends exposed targets using its own status and respects shields and control resistance', () => {
  const battle = build({}, { controlResistance: .25, cover: true });
  requireCast(battle, 'pull');
  close(unit(battle, 'target').statuses.pull, 2.25);
  assert.equal(unit(battle, 'target').statuses.lift, undefined);
  assert.equal(unit(battle, 'target').hp, 10000); assert.equal(unit(battle, 'target').cover, false);
  assert.equal(cast(battle, 'shoot', 'caster', 'target').ok, false);
  tickBattle(battle, 2.3); assert.equal(unit(battle, 'target').statuses.pull, undefined);
  for (const protectedChanges of [{ shield: 1, maxShield: 1 }, { controlImmune: true }, { statuses: { stasis: 6 } }]) {
    const protectedBattle = build({}, protectedChanges), before = JSON.stringify(protectedBattle);
    assert.equal(cast(protectedBattle, 'pull').ok, false);
    assert.equal(JSON.stringify(protectedBattle), before);
  }
});

test('Incinération applies a real bounded burn and fractional ticks do not inflate damage', () => {
  const large = build(), small = build();
  close(damage(requireCast(large, 'incinerate')), 30); requireCast(small, 'incinerate');
  assert.equal(unit(large, 'target').statuses.burning, 5);
  tickBattle(large, 2); for (let i = 0; i < 40; i++) tickBattle(small, .05);
  close(unit(large, 'target').hp, 9960); close(unit(small, 'target').hp, 9960);
  tickBattle(large, 3.1); close(unit(large, 'target').hp, 9945);
  assert.equal(unit(large, 'target').statuses.burning, undefined);
  const immune = build({}, { burnImmune: true }); requireCast(immune, 'incinerate');
  assert.equal(unit(immune, 'target').statuses.burning, undefined);
});

test('Cryo freezes exposed synthetics too and a percussive impact shatters it without ammunition', () => {
  const battle = build({ weaponSystem: 'thermal-clip', magazineCapacity: 8, ammo: 8, reserveAmmo: 20 }, { synthetic: true });
  requireCast(battle, 'cryoBlast'); assert.equal(unit(battle, 'target').statuses.frozen, 4);
  close(damage(requireCast(battle, 'concussiveShot')), 54);
  assert.equal(unit(battle, 'target').statuses.frozen, undefined);
  close(unit(battle, 'target').statuses.stagger, 1.1);
  assert.equal(unit(battle).ammo, 8); assert.equal(unit(battle).heat, 0);
  const gun = build(); requireCast(gun, 'cryoBlast'); close(damage(requireCast(gun, 'shoot')), 23);
  const fire = build(); requireCast(fire, 'cryoBlast'); requireCast(fire, 'incinerate');
  assert.equal(unit(fire, 'target').statuses.frozen, undefined);
  const immune = build({}, { freezeImmune: true }); assert.equal(cast(immune, 'cryoBlast').ok, false);
});

test('Energy Drain restores shields only from real eligible damage and never drains exposed organic health', () => {
  const organic = build({}, { shield: 10, maxShield: 10 });
  requireCast(organic, 'energyDrain');
  assert.equal(unit(organic, 'target').hp, 10000); assert.equal(unit(organic, 'target').shield, 0);
  close(unit(organic).shield, 25);
  const synthetic = build({}, { synthetic: true }); requireCast(synthetic, 'energyDrain');
  close(unit(synthetic).shield, 39.5); close(unit(synthetic, 'target').hp, 9961);
  const capped = build({ shield: 119 }, { synthetic: true }); requireCast(capped, 'energyDrain'); assert.equal(unit(capped).shield, 120);
  const exposed = build(), before = JSON.stringify(exposed);
  assert.equal(cast(exposed, 'energyDrain').ok, false); assert.equal(JSON.stringify(exposed), before);
  const frozen = build({}, { synthetic: true, statuses: { stasis: 6 } }); requireCast(frozen, 'energyDrain');
  assert.equal(unit(frozen).shield, 20); assert.equal(unit(frozen, 'target').hp, 10000);
});

test('Fortification has an expiring ME2 reserve and a distinct ME3 damage guard, without biotic shields', () => {
  const me2 = build(); requireCast(me2, 'fortification');
  const protectedActor = unit(me2); close(protectedActor.fortificationShield, 72);
  assert.equal(protectedActor.shield, 20); assert.equal(protectedActor.statuses.barrier, undefined);
  const hit = requireCast(me2, 'shoot', 'caster', 'target');
  close(protectedActor.fortificationShield, 35); assert.equal(protectedActor.shield, 20);
  close(hit.events.find(event => event.type === 'damage').temporaryShieldDamage, 37);
  tickBattle(me2, 10.1); assert.equal(protectedActor.fortificationShield, 0);
  const base = build({ mediaId: 'ME3', shield: 0, maxShield: 0 });
  const me3 = build({ mediaId: 'ME3', shield: 0, maxShield: 0, bioticMultiplier: 3, techMultiplier: 3 });
  requireCast(me3, 'fortification');
  close(damage(requireCast(me3, 'shoot', 'caster', 'target')), damage(requireCast(base, 'shoot', 'caster', 'target')) * .75);
  assert.equal(unit(me3).shield, 0); assert.equal(unit(me3).fortificationShield, 0);
});

test('Reave heals actual organic health loss in ME2 and uses a separate guard in ME3', () => {
  const organic = build({ hp: 100 }); requireCast(organic, 'reave'); close(unit(organic).hp, 108.5);
  tickBattle(organic, 2); close(unit(organic).hp, 114.5); close(unit(organic, 'target').hp, 9971);
  const synthetic = build({ hp: 100 }, { synthetic: true }); requireCast(synthetic, 'reave'); tickBattle(synthetic, 2);
  assert.equal(unit(synthetic).hp, 100);
  const me3 = build({ mediaId: 'ME3', hp: 100, shield: 0, maxShield: 0 }); requireCast(me3, 'reave');
  assert.equal(unit(me3).hp, 100); assert.equal(unit(me3).statuses.reaveGuard, 5);
  close(damage(requireCast(me3, 'shoot', 'caster', 'target')), 37 * .85);
  const capped = build({ hp: 399 }); requireCast(capped, 'reave'); assert.equal(unit(capped).hp, 400);
});

test('Slam has a delayed single impact and Stasis protects even during its flight', () => {
  const battle = build(); requireCast(battle, 'slam');
  close(unit(battle, 'target').statuses.slam, .8); assert.equal(unit(battle, 'target').hp, 10000);
  tickBattle(battle, .75); assert.equal(unit(battle, 'target').hp, 10000);
  tickBattle(battle, .1); close(unit(battle, 'target').hp, 9957);
  tickBattle(battle, 2); close(unit(battle, 'target').hp, 9957);
  const frozen = build(); requireCast(frozen, 'slam'); requireCast(frozen, 'stasis'); tickBattle(frozen, 1);
  assert.equal(unit(frozen, 'target').hp, 10000); assert.equal(unit(frozen, 'target')._slamDamage, 0);
});

test('Shockwave hits the group but only disables unprotected non-immune targets', () => {
  const battle = build({}, {}, [target({ id: 'shielded', shield: 100, maxShield: 100 }), target({ id: 'boss', controlImmune: true })]);
  requireCast(battle, 'shockwave');
  close(unit(battle, 'target').hp, 9973); close(unit(battle, 'target').statuses.stagger, 1.3);
  close(unit(battle, 'shielded').shield, 73); assert.equal(unit(battle, 'shielded').statuses.stagger, undefined);
  close(unit(battle, 'boss').hp, 9973); assert.equal(unit(battle, 'boss').statuses.stagger, undefined);
});

test('Domination temporarily redirects organic fire and rejects protected, synthetic or immune targets atomically', () => {
  const battle = build({}, {}, [target({ id: 'guard' })]); requireCast(battle, 'dominate');
  assert.equal(unit(battle, 'target').statuses.dominated, 8);
  assert.equal(cast(battle, 'shoot', 'caster', 'target').ok, false);
  const previousPartyHp = unit(battle).hp;
  requireCast(battle, 'shoot', 'guard', 'target'); close(unit(battle, 'guard').hp, 9963);
  assert.equal(unit(battle).hp, previousPartyHp);
  tickBattle(battle, 8.1); assert.equal(unit(battle, 'target').statuses.dominated, undefined);
  assert.equal(cast(battle, 'shoot', 'guard', 'target').ok, false);
  for (const changes of [{ synthetic: true }, { shield: 1, maxShield: 1 }, { dominateImmune: true }, { controlImmune: true }]) {
    const invalid = build({}, changes), before = JSON.stringify(invalid);
    assert.equal(cast(invalid, 'dominate').ok, false); assert.equal(JSON.stringify(invalid), before);
  }
});

test('new power families apply only their own amplifier, bounded duration, and no ammunition bonus', () => {
  close(damage(requireCast(build({ bioticMultiplier: 2 }), 'incinerate')), 30);
  close(damage(requireCast(build({ techMultiplier: 2 }), 'incinerate')), 60);
  close(damage(requireCast(build({ bioticMultiplier: 2, techMultiplier: 2 }), 'concussiveShot')), 36);
  const normal = build(), tech = build({ techMultiplier: 3 }); requireCast(normal, 'slam'); requireCast(tech, 'slam');
  tickBattle(normal, 1); tickBattle(tech, 1); close(unit(normal, 'target').hp, unit(tech, 'target').hp);
  const bounded = build({ bioticMultiplier: 100 }); requireCast(bounded, 'pull');
  assert.equal(unit(bounded, 'target').statuses.pull, 20);
  assert.match(getActions(bounded, 'caster').find(action => action.id === 'pull').description, /20 secondes/);
  const enhanced = build({ syntheticDamageBonus: 1, organicDamageBonus: 1, shieldBypass: .75 });
  close(damage(requireCast(enhanced, 'incinerate')), 30);
});

test('Stasis blocks every new damage and drain effect without phantom healing or delayed damage', () => {
  for (const actionId of ['incinerate', 'concussiveShot', 'energyDrain', 'reave', 'shockwave']) {
    const battle = build({ hp: 100 }, { synthetic: true, statuses: { stasis: 6 } });
    requireCast(battle, actionId); assert.equal(unit(battle).shield, 20);
    tickBattle(battle, 2);
    assert.equal(unit(battle, 'target').hp, 10000, actionId);
    assert.equal(unit(battle).hp, 100); close(unit(battle).shield, 22); // ordinary exposed recharge, without any drain restoration
    assert.equal(unit(battle, 'target').statuses.burning, undefined);
    assert.equal(unit(battle, 'target').statuses.reave, undefined);
  }
});

test('a compatible alternative target cannot make a forbidden selected target spend resources', () => {
  const battle = build({}, { shield: 10, maxShield: 10 }, [target({ id: 'exposed' })]);
  assert.equal(getActions(battle, 'caster').find(action => action.id === 'pull').available, true);
  const before = JSON.stringify(battle);
  assert.equal(cast(battle, 'pull', 'target').ok, false);
  assert.equal(JSON.stringify(battle), before);
  const dominated = build({}, { synthetic: true }, [target({ id: 'organic' })]);
  assert.equal(getActions(dominated, 'caster').find(action => action.id === 'dominate').available, true);
  const snapshot = JSON.stringify(dominated);
  assert.equal(cast(dominated, 'dominate', 'target').ok, false);
  assert.equal(JSON.stringify(dominated), snapshot);
});

test('weapon damage multipliers boost only gunfire and preserve the legacy heat and clips paths', () => {
  close(damage(requireCast(build({ weaponDamageMultiplier: 1.5 }), 'shoot')), 30);
  close(damage(requireCast(build({ weaponDamageMultiplier: 1.5 }), 'overload', 'target')), 0); // exposed organic
  close(damage(requireCast(build({ weaponDamageMultiplier: 1.5 }, { synthetic: true }), 'overload')), 50);
  close(damage(requireCast(build({ weaponDamageMultiplier: 1.5 }), 'incinerate')), 30);
  close(damage(requireCast(build({ weaponDamageMultiplier: 1.5 }), 'throw')), 30);
  const melee = build({ primaryAction: 'strike', weaponDamageMultiplier: 3 }); close(damage(requireCast(melee, 'strike')), 20);
  const heat = build({ powers: [] }); requireCast(heat, 'shoot'); assert.equal(unit(heat).heat, 24);
  const clips = build({ weaponSystem: 'thermal-clip', magazineCapacity: 8, ammo: 8, reserveAmmo: 32 }); requireCast(clips, 'shoot');
  assert.equal(unit(clips).ammo, 7); assert.equal(unit(clips).heat, 0);
});

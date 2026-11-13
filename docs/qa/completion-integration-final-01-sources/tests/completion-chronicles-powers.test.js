import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { universeActorFor, getUniverseBuild } from '../src/universe-actors.js';
import { getUniversePowerMapping } from '../src/universe-powers.js';
import { createChronicle, setChronicleBuild, startChronicleBattle, encodeChronicle, decodeChronicle } from '../src/chronicles.js';
import { CHRONICLE_SIGNATURE_BINDINGS, signatureActionAllowed, planSignatureAction, signatureTargetable,
  signatureDamageMultiplier, signatureIncomingDamageMultiplier, planSignatureArmorBreak } from '../src/completion-chronicles-powers.js';

const context = mediaId => ({ mediaId, periodId: mediaId.toLowerCase() });
const native = (mediaId, buildId, changes = {}) => ({ ...universeActorFor(`${mediaId}-CHR-SHEPARD`, context(mediaId), buildId, `${mediaId.toLowerCase()}-equipment-workshop`), atb: 100, ...changes });
const target = (id = 'enemy', changes = {}) => ({ id, name: id, hp: 2000, maxHp: 2000, shield: 0, maxShield: 0, attack: 1, defense: 0, speed: .1, atb: 100, ...changes });
const make = (mediaId, buildId, changes = {}, enemies = [target()]) => createBattle({ party: [native(mediaId, buildId, changes)], enemies, mode: 'active', rng: () => .5 });
const act = (battle, actionId, targetId = 'enemy', actorId = battle.actors[0].id) => performAction(battle, { actorId, actionId, targetId });
const ready = battle => { battle.actors[0].atb = 100; };
const approx = (left, right) => assert.ok(Math.abs(left - right) < 1e-8, `${left} != ${right}`);

test('seven sourced bindings are exposed only by their exact class, work and main period', () => {
  assert.equal(CHRONICLE_SIGNATURE_BINDINGS.length, 7);
  for (const binding of CHRONICLE_SIGNATURE_BINDINGS) {
    const actor = native(binding.mediaId, binding.buildId);
    assert.equal(getUniversePowerMapping(binding.catalogId).actionId, binding.actionId);
    assert.equal(signatureActionAllowed(actor, binding.actionId), true);
    for (const patch of [{ mediaId: 'ME1' }, { chronicleSignaturePeriod: 'me3-prologue' }, { buildId: 'soldier' },
      { catalogId: `${binding.mediaId}-CHR-LIARA` }, { powerCatalogIds: [] }, { powers: [] }]) assert.equal(signatureActionAllowed({ ...actor, ...patch }, binding.actionId), false);
  }
  assert.equal(signatureActionAllowed(native('ME2', 'vanguard'), 'nova'), false);
  assert.equal(signatureActionAllowed(native('ME2', 'sentinel'), 'techArmorDetonate'), false);
  assert.equal(getUniverseBuild('ME3-CHR-SHEPARD', { mediaId: 'ME3', periodId: 'me3-prologue' }, 'vanguard', 'me3-earth-prologue'), null);
});

test('pure plans and rejected native commands do not spend resources or draw randomness', () => {
  const battle = make('ME3', 'vanguard', { shield: 0 }); let draws = 0; battle._rng = () => { draws++; return .5; };
  const before = JSON.stringify(battle), plan = planSignatureAction({ battle, actor: battle.actors[0], actionId: 'nova', targets: [battle.actors[1]] });
  assert.equal(plan.ok, false); assert.equal(JSON.stringify(battle), before);
  assert.equal(act(battle, 'nova').ok, false); assert.equal(JSON.stringify(battle), before); assert.equal(draws, 0);
  const wrong = make('ME2', 'infiltrator', { chronicleSignaturePeriod: 'me2-opening' });
  const snapshot = JSON.stringify(wrong); assert.equal(act(wrong, 'tacticalCloak').ok, false); assert.equal(JSON.stringify(wrong), snapshot);
});

test('Charge records an abstract contact, restores bounded shields and introduces finite exposure', () => {
  const battle = make('ME2', 'vanguard', { shield: 0, maxShield: 100, ammo: 5, reserveAmmo: 20 });
  const actor = battle.actors[0], targetActor = battle.actors[1], beforeHp = targetActor.hp;
  assert.equal(act(battle, 'bioticCharge').ok, true);
  assert.equal(actor.atb, 0); assert.equal(actor.cooldowns.bioticCharge, 12); assert.equal(actor.engagedTargetId, targetActor.id);
  assert.equal(actor.shield, 50); assert.equal(actor.statuses.chargeExposure, 3); assert.equal(actor.ammo, 5); assert.equal(actor.reserveAmmo, 20);
  approx(beforeHp - targetActor.hp, actor.attack * 1.25 * actor.bioticMultiplier);
  approx(signatureIncomingDamageMultiplier(actor), 1.15);
  tickBattle(battle, 4, { paused: true }); assert.equal(actor.statuses.chargeExposure, 3);
  tickBattle(battle, 3.1); assert.equal(actor.statuses.chargeExposure, undefined); assert.equal(signatureIncomingDamageMultiplier(actor), 1);
});

test('Cloak masks newly commanded targets, expires and is broken by an offensive order', () => {
  const battle = make('ME2', 'infiltrator'), actor = battle.actors[0];
  assert.equal(act(battle, 'tacticalCloak', actor.id).ok, true); assert.equal(signatureTargetable(actor), false);
  const snapshot = JSON.stringify(battle); assert.equal(act(battle, 'shoot', actor.id, 'enemy').ok, false); assert.equal(JSON.stringify(battle), snapshot);
  ready(battle); const hp = battle.actors[1].hp; assert.equal(act(battle, 'shoot').ok, true);
  approx(hp - battle.actors[1].hp, actor.attack * 1.5); assert.equal(actor.statuses.tacticalCloak, undefined); assert.equal(signatureTargetable(actor), true);
  const expiry = make('ME3', 'infiltrator'); assert.equal(act(expiry, 'tacticalCloak', expiry.actors[0].id).ok, true);
  tickBattle(expiry, 5.1); assert.equal(expiry.actors[0].statuses.tacticalCloak, undefined);
});

test('Cloak weapon launch bonus survives a charged shot exactly once', () => {
  const profileId = 'ME3-WPN-JAVELIN';
  const ordinary = make('ME3', 'infiltrator', { weaponProfileId: profileId, shield: 0 }), hidden = make('ME3', 'infiltrator', { weaponProfileId: profileId, shield: 0 });
  assert.equal(act(hidden, 'tacticalCloak', hidden.actors[0].id).ok, true); ready(hidden);
  const normalHp = ordinary.actors[1].hp, hiddenHp = hidden.actors[1].hp;
  assert.equal(act(ordinary, 'shoot').ok, true); assert.equal(act(hidden, 'shoot').ok, true);
  assert.equal(hidden.actors[0].statuses.tacticalCloak, undefined);
  tickBattle(ordinary, 3); tickBattle(hidden, 3);
  approx((hiddenHp - hidden.actors[1].hp) / (normalHp - ordinary.actors[1].hp), 1.5);
});

test('a launched projectile remains dangerous after its target cloaks', () => {
  const battle = make('ME3', 'infiltrator', { shield: 0, maxShield: 0, defense: 0 }, [target('enemy', { weaponProfileId: 'ME3-WPN-SCORPION', attack: 20 })]);
  const actor = battle.actors[0], hp = actor.hp;
  assert.equal(act(battle, 'shoot', actor.id, 'enemy').ok, true); assert.ok(battle.projectiles?.length);
  assert.equal(act(battle, 'tacticalCloak', actor.id).ok, true); tickBattle(battle, 2);
  assert.ok(actor.hp < hp); assert.equal(signatureTargetable(actor), false);
});

test('ME2 armour auto-detonates once when its live shield is broken', () => {
  const battle = make('ME2', 'sentinel', { shield: 0, maxShield: 100, defense: 0 }, [target('enemy', { attack: 60 })]);
  const actor = battle.actors[0], enemy = battle.actors[1];
  assert.equal(act(battle, 'techArmor', actor.id).ok, true); assert.equal(actor.shield, 50);
  const beforeHp = enemy.hp; assert.equal(act(battle, 'shoot', actor.id, enemy.id).ok, true);
  assert.equal(actor.shield, 0); assert.equal(actor.statuses.techArmor, undefined); assert.ok(enemy.hp < beforeHp);
  const explosions = battle.events.filter(event => event.type === 'chronicleSignature' && event.automatic === true);
  assert.equal(explosions.length, 1); assert.equal(planSignatureArmorBreak({ battle, actor, beforeShield: 50 }), null);
  assert.equal(getActions(battle, actor.id).some(action => action.id === 'techArmorDetonate'), false);
});

test('ME3 armour reduces incoming damage and manual detonation sacrifices it without resources', () => {
  const battle = make('ME3', 'sentinel', { shield: 0, maxShield: 0, defense: 0 }, [target('enemy', { attack: 20 })]);
  const actor = battle.actors[0]; assert.equal(act(battle, 'techArmor', actor.id).ok, true); assert.equal(actor.shield, 0);
  const hp = actor.hp; assert.equal(act(battle, 'shoot', actor.id, 'enemy').ok, true); approx(hp - actor.hp, 20 * 1.85 * .75);
  ready(battle); const ammo = actor.ammo, enemyHp = battle.actors[1].hp;
  assert.equal(act(battle, 'techArmorDetonate').ok, true); assert.equal(actor.statuses.techArmor, undefined); assert.equal(actor.ammo, ammo);
  assert.ok(battle.actors[1].hp < enemyHp); ready(battle);
  const snapshot = JSON.stringify(battle); assert.equal(act(battle, 'techArmorDetonate').ok, false); assert.equal(JSON.stringify(battle), snapshot);
});

test('Nova converts the actual shield once and Charge can supply its next cost', () => {
  const battle = make('ME3', 'vanguard', { shield: 0, maxShield: 100, ammo: 4, reserveAmmo: 20 });
  const actor = battle.actors[0]; assert.equal(act(battle, 'bioticCharge').ok, true); assert.equal(actor.shield, 50); ready(battle);
  const hp = battle.actors[1].hp; assert.equal(act(battle, 'nova').ok, true); assert.equal(actor.shield, 0);
  approx(hp - battle.actors[1].hp, actor.attack * 1.8 * .5 * actor.bioticMultiplier);
  assert.equal(actor.ammo, 4); assert.equal(actor.reserveAmmo, 20); ready(battle);
  const snapshot = JSON.stringify(battle); assert.equal(act(battle, 'nova').ok, false); assert.equal(JSON.stringify(battle), snapshot);
});

test('signature preparation/export/reload preserves only its own session and no live effects', () => {
  for (const mediaId of ['ME2', 'ME3']) for (const buildId of ['vanguard', 'infiltrator', 'sentinel']) {
    const initial = createChronicle(context(mediaId), `${mediaId.toLowerCase()}-equipment-workshop`), prepared = setChronicleBuild(initial, `${mediaId}-CHR-SHEPARD`, buildId);
    assert.equal(prepared.ok, true); const decoded = decodeChronicle(encodeChronicle(prepared.session)); assert.deepEqual(decoded, prepared.session);
    const first = startChronicleBattle(decoded), second = startChronicleBattle(decoded); assert.equal(first.ok, true); assert.equal(second.ok, true);
    assert.deepEqual(first.battle.actors[0].statuses, {}); assert.deepEqual(second.battle.actors[0].statuses, {});
    assert.equal(decoded.builds[`${mediaId}-CHR-SHEPARD`], buildId);
  }
  const forged = { ...native('ME3', 'soldier'), statuses: { tacticalCloak: 3, chargeExposure: 3, techArmor: 8 } };
  assert.equal(signatureTargetable(forged), true); assert.equal(signatureDamageMultiplier(forged, null, 'shoot'), 1); assert.equal(signatureIncomingDamageMultiplier(forged), 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNIVERSE_AMMO_PROFILES, getUniverseAmmoProfile, getAmmoActionProfile,
  validateAmmoMode, canActivateAmmoProfile, activateAmmoProfile, getAmmoHitModifiers, getAmmoPostHit } from '../src/universe-ammo.js';

const neutral = { profileId: null, shieldMultiplier: 1, healthMultiplier: 1, defenseMultiplier: 1, coverMultiplier: 1, postHit: null };
const source = (mode = 'INCENDIARY', mediaId = 'ME2', extra = {}) => ({ mediaId, hp: 100,
  powers: UNIVERSE_AMMO_PROFILES.filter(profile => profile.mediaId === mediaId).map(profile => profile.actionId),
  allowedAmmoProfileIds: UNIVERSE_AMMO_PROFILES.filter(profile => profile.mediaId === mediaId).map(profile => profile.id),
  ammoModeId: mode === null ? null : `${mediaId}-POW-AMMO-${mode}`, weaponSystem: 'thermal-clip',
  bioticMultiplier: 1, techMultiplier: 1, ...extra });
const target = (extra = {}) => ({ hp: 100, shield: 0, defense: 10, statuses: {}, ...extra });
const clone = value => JSON.parse(JSON.stringify(value));
const hit = (mode, victim = target(), actionId = 'shoot', mediaId = 'ME2') => getAmmoHitModifiers(source(mode, mediaId), victim, actionId);

test('eleven immutable native profiles resolve exact sourced IDs, without ME3 Shredder or any MEA consumable', async () => {
  assert.equal(UNIVERSE_AMMO_PROFILES.length, 11);
  assert.ok(Object.isFrozen(UNIVERSE_AMMO_PROFILES));
  for (const mediaId of ['ME2', 'ME3']) {
    const catalogue = JSON.parse(await readFile(new URL(`../docs/universe/catalogs/${mediaId}.json`, import.meta.url), 'utf8'));
    const profiles = UNIVERSE_AMMO_PROFILES.filter(profile => profile.mediaId === mediaId);
    assert.equal(profiles.length, mediaId === 'ME2' ? 6 : 5);
    for (const profile of profiles) {
      const entry = catalogue.entries.find(row => row.id === profile.id);
      assert.ok(entry); assert.equal(entry.nature, 'Établi');
      assert.deepEqual(profile.sourceIds, entry.sourceIds);
      assert.equal(profile.catalogId, profile.id);
      assert.equal(getUniverseAmmoProfile(profile.id), profile);
      assert.equal(getAmmoActionProfile(mediaId, profile.actionId), profile);
      assert.equal(profile.kind, 'power'); assert.equal(profile.activation, 'learned-mode');
      assert.equal(profile.statsBasis, 'ATB adaptation'); assert.equal(profile.primaryMechanicsVerified, false);
      assert.match(profile.tuningNote, /aucune valeur originale ni fidélité 1:1 certifiée/);
      assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.sourceIds));
      assert.throws(() => { profile.weaponSystems.push('heat'); }, TypeError);
      assert.equal(Object.hasOwn(profile, 'charges'), false); assert.equal(Object.hasOwn(profile, 'cooldown'), false);
    }
  }
  for (const id of ['ME3-POW-AMMO-SHREDDER', 'MEA-EQP-AMMO-FIRE', 'MEA-EQP-AMMO-CRYO', 'MEA-EQP-AMMO-DISRUPT', 'MEA-EQP-POWER-CELLS'])
    assert.equal(getUniverseAmmoProfile(id), null);
  assert.equal(getAmmoActionProfile('MEA', 'ammoIncendiary'), null);
});

test('activation requires both the actual power and a same-media explicit kit permission', () => {
  const actor = source(null), id = 'ME2-POW-AMMO-INCENDIARY';
  assert.equal(canActivateAmmoProfile(actor, id).ok, true);
  assert.equal(validateAmmoMode(source('WARP', 'ME3', { powers: [], allowedAmmoProfileIds: [] })).ok, false);
  for (const extra of [{ powers: [] }, { allowedAmmoProfileIds: [] }, { mediaId: 'ME3' }, { mediaId: 'MEA' },
    { powers: ['ammoCryo'] }, { allowedAmmoProfileIds: ['ME3-POW-AMMO-INCENDIARY'] }]) {
    assert.equal(canActivateAmmoProfile({ ...actor, ...extra }, id).ok, false);
  }
  assert.equal(canActivateAmmoProfile(actor, 'ME3-POW-AMMO-INCENDIARY').ok, false);
});

test('mode replacement and removal are pure, exclusive and idempotent validation never consumes a resource', () => {
  const actor = source('INCENDIARY'), before = clone(actor), id = 'ME2-POW-AMMO-CRYO';
  assert.equal(validateAmmoMode(actor).ok, true);
  assert.equal(canActivateAmmoProfile(actor, actor.ammoModeId).ok, false);
  assert.deepEqual(activateAmmoProfile(actor, id), { ok: true, reason: null, ammoModeId: id, replacedProfileId: actor.ammoModeId });
  assert.deepEqual(actor, before);
  const updated = { ...actor, ammoModeId: id }, modifiers = getAmmoHitModifiers(updated, target(), 'shoot');
  assert.equal(modifiers.profileId, id); assert.equal(modifiers.postHit.kind, 'cryo');
  assert.equal(modifiers.healthMultiplier, 1); assert.equal(Object.hasOwn(modifiers.postHit, 'damagePerSecond'), false);
  assert.deepEqual(activateAmmoProfile(updated, null), { ok: true, reason: null, ammoModeId: null, replacedProfileId: id });
  assert.deepEqual(getAmmoHitModifiers({ ...updated, ammoModeId: null }, target(), 'shoot'), neutral);
  assert.equal(validateAmmoMode({}, null).ok, true, 'Older actors and sessions with no mode keep neutral behavior');
});

test('specialist, heat, organic and autonomous weapons cannot inherit learned ammunition modes', () => {
  for (const extra of [{ weaponSystem: 'heat' }, { weaponSystem: undefined }, { weaponProfileId: 'ME3-WPN-FALCON' },
    { weaponProfileId: 'forged' }, { weaponProfileId: '' }, { primaryAction: 'strike' }, { primaryAction: 'acid' },
    { isSummon: true }, { autonomous: true }, { countsForVictory: false }]) {
    const actor = source('DISRUPTOR', 'ME2', extra);
    assert.equal(validateAmmoMode(actor).ok, false);
    assert.deepEqual(getAmmoHitModifiers(actor, target({ synthetic: true, shield: 20 }), 'shoot'), neutral);
  }
});

test('only the three weapon commands use modes and support attacks or powers remain exactly neutral', () => {
  const actor = source('DISRUPTOR'), victim = target({ synthetic: true, shield: 100 });
  for (const actionId of ['overload', 'incinerate', 'throw', 'strike', 'acid', 'summonPulse', 'fragGrenade', 'stickyGrenade',
    'shieldBoost', 'concussiveShot', 'reload', 'constructor', undefined, null]) {
    assert.deepEqual(getAmmoHitModifiers(actor, victim, actionId), neutral);
    assert.equal(getAmmoPostHit(actor, victim, actionId, { healthDamage: 10, shotCount: 3 }), null);
  }
  for (const actionId of ['shoot', 'burst', 'signature']) assert.equal(getAmmoHitModifiers(actor, victim, actionId).shieldMultiplier, 1.3);
  assert.deepEqual(getAmmoHitModifiers(source(null), victim, 'shoot'), neutral);
});

test('Disruptor bonuses apply to distinct shield and synthetic-health layers, without organic-health overflow', () => {
  const organic = hit('DISRUPTOR', target({ shield: 5 }));
  assert.equal(organic.shieldMultiplier, 1.3); assert.equal(organic.healthMultiplier, 1);
  const exposed = hit('DISRUPTOR'); assert.equal(exposed.healthMultiplier, 1);
  for (const victim of [target({ synthetic: true, shield: 5 }), target({ type: 'synthetic' })]) {
    const result = hit('DISRUPTOR', victim);
    assert.equal(result.shieldMultiplier, 1.3); assert.equal(result.healthMultiplier, 1.2);
    assert.equal(result.defenseMultiplier, 1); assert.equal(result.postHit, null);
  }
});

test('AP reduces only the defense budget and ME3 alone reduces the cover penalty', () => {
  const me2 = hit('AP'), me3 = hit('AP', target(), 'shoot', 'ME3');
  assert.equal(me2.defenseMultiplier, .65); assert.equal(me3.defenseMultiplier, .65);
  assert.equal(me2.coverMultiplier, 1); assert.equal(me3.coverMultiplier, .75);
  for (const result of [me2, me3]) {
    assert.equal(result.shieldMultiplier, 1); assert.equal(result.healthMultiplier, 1); assert.equal(result.postHit, null);
  }
});

test('Warp distinguishes actual biotic control and Barrier from an ordinary shield or nonbiotic control', () => {
  const normal = hit('WARP', target({ shield: 20 }));
  assert.equal(normal.shieldMultiplier, 1); assert.equal(normal.healthMultiplier, 1);
  const barrier = hit('WARP', target({ shield: 20, statuses: { barrier: 3 } }));
  assert.equal(barrier.shieldMultiplier, 1.25); assert.equal(barrier.healthMultiplier, 1);
  for (const key of ['lift', 'singularity', 'pull', 'slam']) {
    const controlled = hit('WARP', target({ statuses: { [key]: 2 } }));
    assert.equal(controlled.shieldMultiplier, 1.2); assert.equal(controlled.healthMultiplier, 1.2);
  }
  const combined = hit('WARP', target({ statuses: { barrier: 3, lift: 2 } }));
  assert.equal(combined.shieldMultiplier, 1.5); assert.equal(combined.healthMultiplier, 1.2);
  for (const key of ['stagger', 'frozen', 'sabotage']) assert.equal(hit('WARP', target({ statuses: { [key]: 2 } })).healthMultiplier, 1);
  assert.deepEqual(hit('WARP', target({ statuses: { stasis: 2 } })), neutral);
});

test('Shredder strengthens only an exposed organic health layer and never synthesizes a ME3 permission', () => {
  assert.equal(hit('SHREDDER').healthMultiplier, 1.25);
  for (const victim of [target({ shield: 1 }), target({ synthetic: true }),
    target({ fortificationShield: 3, statuses: { fortification: 1 } })]) {
    const result = hit('SHREDDER', victim); assert.equal(result.healthMultiplier, 1); assert.equal(result.shieldMultiplier, 1);
  }
  assert.deepEqual(hit('SHREDDER', target(), 'shoot', 'ME3'), neutral);
});

test('incendiary statuses require actual organic health damage after protections break and never scale with tools', () => {
  const actor = source('INCENDIARY'), shielded = target({ shield: 5 });
  assert.equal(getAmmoHitModifiers(actor, shielded, 'shoot').postHit, null);
  const after = { ...shielded, shield: 0, hp: 95 };
  const expected = { kind: 'burn', duration: 3, damagePerSecond: 4 };
  assert.deepEqual(getAmmoPostHit(actor, after, 'shoot', { healthDamage: 5, shieldDamage: 5 }), expected);
  assert.deepEqual(getAmmoPostHit({ ...actor, techMultiplier: 99, bioticMultiplier: 99 }, after, 'shoot', { healthDamage: 5 }), expected);
  for (const victim of [shielded, target({ synthetic: true }), target({ hp: 0 }), target({ statuses: { stasis: 2 } })])
    assert.equal(getAmmoPostHit(actor, victim, 'shoot', { healthDamage: 5 }), null);
  for (const damage of [{ healthDamage: 0, shieldDamage: 5 }, { healthDamage: -1 }, { healthDamage: NaN },
    { healthDamage: '5' }, { healthDamage: 5, shotCount: 0 }, null]) assert.equal(getAmmoPostHit(actor, after, 'shoot', damage), null);
});

test('cryo buildup counts real shots once, respects immunities and activates only on a living exposed target', () => {
  const actor = source('CRYO');
  for (const [actionId, stacks] of [['shoot', 1], ['burst', 3], ['signature', 2]]) {
    assert.deepEqual(getAmmoPostHit(actor, target(), actionId, { healthDamage: 5 }), { kind: 'cryo', stacks, threshold: 3, freezeDuration: 2 });
    assert.equal(getAmmoPostHit(actor, target(), actionId, { healthDamage: 5, shotCount: 999 }).stacks, stacks);
  }
  assert.equal(getAmmoPostHit(actor, target(), 'burst', { healthDamage: 5, shotCount: 1 }).stacks, 1);
  for (const victim of [target({ shield: 1 }), target({ freezeImmune: true }), target({ controlImmune: true }),
    target({ controlResistance: 1 }), target({ statuses: { stasis: 1 } }), target({ hp: 0 })])
    assert.equal(getAmmoPostHit(actor, victim, 'burst', { healthDamage: 5 }), null);
  assert.ok(getAmmoPostHit(actor, target({ controlResistance: .5 }), 'burst', { healthDamage: 5 }));
  const effect = getAmmoPostHit(actor, target(), 'shoot', { healthDamage: 5 }); effect.threshold = 100;
  assert.equal(getAmmoPostHit(actor, target(), 'shoot', { healthDamage: 5 }).threshold, 3);
});

test('forged modes, mechanical objects and getters are never trusted or coerced', () => {
  let invoked = false;
  const forged = { toString() { invoked = true; throw new Error('No coercion'); } };
  for (const id of [forged, [], 1, '__proto__', 'constructor', 'MEA-EQP-AMMO-FIRE']) {
    assert.equal(getUniverseAmmoProfile(id), null);
    assert.equal(validateAmmoMode(source(), id).ok, false);
  }
  const getterActor = source(); Object.defineProperty(getterActor, 'ammoModeId', { get() { invoked = true; return 'ME2-POW-AMMO-INCENDIARY'; } });
  assert.deepEqual(getAmmoHitModifiers(getterActor, target(), 'shoot'), neutral);
  assert.deepEqual(getAmmoHitModifiers(source(), target(), forged), neutral);
  const getterPowers = []; Object.defineProperty(getterPowers, 0, { get() { invoked = true; return 'ammoIncendiary'; } });
  assert.equal(validateAmmoMode(source('INCENDIARY', 'ME2', { powers: getterPowers })).ok, false);
  const symbolic = ['ammoIncendiary']; symbolic[Symbol('extra')] = true;
  assert.equal(validateAmmoMode(source('INCENDIARY', 'ME2', { powers: symbolic })).ok, false);
  const actor = source('DISRUPTOR', 'ME2', { ammoProfile: { shieldMultiplier: 999 } });
  assert.equal(getAmmoHitModifiers(actor, target(), 'shoot').shieldMultiplier, 1.3);
  assert.equal(invoked, false);
});

test('hit evaluation never changes actors and the module imports no registry, actors or combat', async () => {
  const actor = source('CRYO'), victim = target(), before = clone({ actor, victim });
  getAmmoHitModifiers(actor, victim, 'burst'); getAmmoPostHit(actor, victim, 'burst', { healthDamage: 2 });
  assert.deepEqual({ actor, victim }, before);
  const sourceText = await readFile(new URL('../src/universe-ammo.js', import.meta.url), 'utf8');
  assert.doesNotMatch(sourceText, /^\s*import\s|\bimport\s*\(/m);
  assert.doesNotMatch(sourceText, /universe-data|universe-actors|from ['"]\.\/combat/);
});

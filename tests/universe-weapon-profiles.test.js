import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UNIVERSE_WEAPON_PROFILES, getUniverseWeaponProfile } from '../src/universe-weapon-profiles.js';

test('special mechanics retain six previous identities and eight explicit additional models with immutable data', () => {
  assert.deepEqual(UNIVERSE_WEAPON_PROFILES.map(profile => profile.id).sort(), [
    'ME3-WPN-FALCON', 'ME3-WPN-SCORPION', 'MEA-WPN-PAW', 'MEA-WPN-REEGAR', 'MEA-WPN-SCORPION', 'MEA-WPN-SWEEPER',
    'ME3-WPN-PARTICLE', 'ME3-WPN-LANCER', 'ME3-WPN-ARC', 'ME3-WPN-GRAAL', 'ME3-WPN-JAVELIN',
    'MEA-WPN-EQUALIZER', 'MEA-WPN-SCATTERSHOT', 'MEA-WPN-VENOM',
  ].sort());
  assert.equal(new Set(UNIVERSE_WEAPON_PROFILES.map(profile => profile.id)).size, UNIVERSE_WEAPON_PROFILES.length);
  assert.ok(Object.isFrozen(UNIVERSE_WEAPON_PROFILES));
  for (const profile of UNIVERSE_WEAPON_PROFILES) {
    assert.equal(getUniverseWeaponProfile(profile.id), profile);
    assert.equal(profile.catalogId, profile.id);
    assert.ok(Object.isFrozen(profile)); assert.ok(Object.isFrozen(profile.sourceIds)); assert.ok(Object.isFrozen(profile.limitations));
    assert.throws(() => { profile.sourceIds.push('invented-reference'); }, TypeError);
    assert.throws(() => { profile.weaponSystem = 'thermal-clip'; }, TypeError);
    assert.equal(profile.statsBasis, 'ATB adaptation'); assert.equal(profile.primarySourceVerified, false);
    assert.equal(profile.sourceBasis, 'catalogue-secondary-reference');
    assert.match(profile.tuningNote, /aucune fidélité.*1:1 certifiée/);
    assert.ok(profile.sourceIds.length > 0 && profile.limitations.length > 0);
    assert.equal(Object.hasOwn(profile, 'manufacturer'), false); assert.equal(Object.hasOwn(profile, 'rank'), false);
  }
});

test('heat weapons have no clips and clip weapons have finite internally consistent budgets', () => {
  for (const profile of UNIVERSE_WEAPON_PROFILES) {
    assert.ok(['pistol', 'assault', 'shotgun', 'sniper'].includes(profile.weaponType));
    if (profile.weaponSystem === 'heat') {
      for (const key of ['magazineCapacity', 'ammo', 'reserveAmmo']) assert.equal(Object.hasOwn(profile, key), false);
      assert.ok(['heat-beam', 'heat-burst'].includes(profile.mode));
    } else {
      assert.equal(profile.weaponSystem, 'thermal-clip');
      assert.ok(Number.isInteger(profile.magazineCapacity) && profile.magazineCapacity > 0 && profile.magazineCapacity <= 24);
      assert.equal(profile.ammo, profile.magazineCapacity);
      assert.ok(Number.isInteger(profile.reserveAmmo) && profile.reserveAmmo >= 0 && profile.reserveAmmo <= 96);
      assert.ok(['delayed-area', 'clip-channel', 'charged-shot', 'charged-area'].includes(profile.mode));
    }
    if (profile.mode === 'delayed-area' || profile.mode === 'charged-area') {
      assert.ok(profile.delay > 0 && profile.delay <= 3);
      assert.ok(profile.splashRatio > 0 && profile.splashRatio < 1);
    }
    if (profile.mode.startsWith('charged-')) {
      assert.ok(profile.chargeDuration > 0 && profile.chargeDuration <= 3);
      assert.ok(profile.chargeDamageMultiplier >= 1 && profile.chargeDamageMultiplier <= 2);
      assert.ok(Number.isInteger(profile.impactCount) && profile.impactCount >= 1 && profile.impactCount <= 5);
      assert.match(profile.mechanicNote, /Charge fixe/);
    } else if (profile.mode.endsWith('channel') || profile.mode === 'heat-beam') {
      assert.ok(profile.duration > 0 && profile.duration <= 4);
      assert.ok(profile.tickInterval > 0 && profile.tickInterval <= profile.duration);
      assert.equal(profile.duration % profile.tickInterval, 0);
      if (profile.mode === 'clip-channel') {
        assert.ok(Number.isInteger(profile.ammoPerTick) && profile.ammoPerTick > 0);
        assert.ok(profile.ammoPerTick * profile.duration / profile.tickInterval <= profile.magazineCapacity);
      } else assert.ok(profile.heatPerSecond > 0 && profile.heatPerSecond * profile.duration <= 100);
    } else if (profile.mode !== 'delayed-area') {
      assert.equal(profile.mode, 'heat-burst');
      assert.ok(Number.isInteger(profile.burstCount) && profile.burstCount > 1 && profile.burstCount <= 5);
      assert.ok(profile.heatCost > 0 && profile.heatCost < 100);
    }
  }
});

test('unknown IDs and forged profiles cannot activate mechanics, coerce strings or change ordinary weapon behavior', () => {
  let invoked = false;
  const forged = { get id() { invoked = true; return 'MEA-WPN-PAW'; }, toString() { invoked = true; throw new Error('no coercion'); } };
  for (const id of [undefined, null, 0, [], forged, 'constructor', '__proto__', 'ME3-WPN-AVENGER', 'WPN-avenger',
    'MEA-WPN-LANAT', 'ME3-WPN-CHAKRAM', 'ME3-WPN-VENOM', 'ME3-WPN-REEGAR', 'ME3-WPN-CAIN', 'INF-WPN-PARTICLE']) {
    assert.equal(getUniverseWeaponProfile(id), null);
  }
  assert.equal(invoked, false);
});

test('new model identities match factual catalogue text while proposed mechanics and editions remain distinct', async () => {
  const works = Object.fromEntries(await Promise.all(['ME3', 'MEA'].map(async mediaId => [mediaId,
    JSON.parse(await readFile(new URL(`../docs/universe/catalogs/${mediaId}.json`, import.meta.url), 'utf8'))])));
  for (const profile of UNIVERSE_WEAPON_PROFILES.filter(profile => profile.identityFact)) {
    const work = works[profile.id.split('-')[0]], record = work.entries.find(record => record.id === profile.id);
    assert.ok(record); assert.equal(record.nature, 'Établi'); assert.equal(record.category, 'weapons');
    assert.equal(profile.identityFact, record.description);
    assert.ok(profile.sourceIds.every(id => work.sources.some(source => source.id === id)));
    assert.match(profile.mechanicEvidence, /Spécification de prototype/);
    assert.equal(profile.primarySourceVerified, false);
  }
  assert.match(getUniverseWeaponProfile('ME3-WPN-PARTICLE').availabilityNote, /From Ashes.*Legendary/);
  assert.match(getUniverseWeaponProfile('ME3-WPN-LANCER').availabilityNote, /Citadel.*Legendary/);
  const javelin = getUniverseWeaponProfile('ME3-WPN-JAVELIN');
  assert.equal(javelin.ignoresCover, true); assert.match(javelin.primaryReference.reference, /26/);
  assert.equal(javelin.primaryReference.sha256, '07ee7dc469e5c6beb85d2050b333647aa29ee9900d83695cfbe28be51726da01');
  assert.match(javelin.primaryReference.scope, /ne certifie pas la charge/);
});

test('the combat mechanics table has no static or dynamic imports and cannot pull the documentary registry into the entry bundle', async () => {
  const source = await readFile(new URL('../src/universe-weapon-profiles.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s|\bimport\s*\(/m);
  assert.doesNotMatch(source, /universe-data|universe-actors|continuity\.js/);
});

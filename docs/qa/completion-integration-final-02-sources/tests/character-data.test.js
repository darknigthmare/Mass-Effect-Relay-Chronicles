import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASS_EQUIPMENT, CHARACTER_EQUIPMENT, EQUIPMENT_WEAPON_TYPES, getEquipmentProfile } from '../src/character-data.js';

test('all six Shepard classes can carry four weapon families without inventing their mastery', () => {
  assert.equal(Object.keys(CLASS_EQUIPMENT).length, 6);
  for (const classId of Object.keys(CLASS_EQUIPMENT)) {
    const profile = getEquipmentProfile('shepard', classId);
    assert.deepEqual(profile.allowedWeapons, EQUIPMENT_WEAPON_TYPES);
    assert.ok(profile.weaponTraining.every(type => profile.allowedWeapons.includes(type)));
  }
  assert.deepEqual(getEquipmentProfile('shepard', 'soldier').weaponTraining, EQUIPMENT_WEAPON_TYPES);
  assert.deepEqual(getEquipmentProfile('shepard', 'sentinel').weaponTraining, []);
  assert.deepEqual(getEquipmentProfile('shepard', 'infiltrator').weaponTraining, ['pistol', 'sniper']);
});

test('class armour eligibility preserves the original initial and training restrictions', () => {
  for (const classId of Object.keys(CLASS_EQUIPMENT)) {
    const profile = getEquipmentProfile('shepard', classId);
    assert.ok(profile.armorWeights.includes('light'));
    assert.ok(!profile.armorWeights.includes('heavy'), 'No class starts with heavy armour');
    assert.equal(profile.armorWeights.includes('medium'), classId === 'soldier');
  }
  assert.deepEqual(getEquipmentProfile('shepard', 'soldier').trainableArmorWeights, ['heavy']);
  for (const classId of ['vanguard', 'infiltrator']) assert.deepEqual(getEquipmentProfile('shepard', classId).trainableArmorWeights, ['medium']);
  for (const classId of ['adept', 'engineer', 'sentinel']) assert.deepEqual(getEquipmentProfile('shepard', classId).trainableArmorWeights, []);
});

test('all eight identities have anatomical profiles without making every character human', () => {
  assert.equal(Object.keys(CHARACTER_EQUIPMENT).length, 8);
  const garrus = getEquipmentProfile('garrus'), tali = getEquipmentProfile('tali'), wrex = getEquipmentProfile('wrex'), liara = getEquipmentProfile('liara');
  assert.equal(garrus.armorSpecies, 'turian');
  assert.equal(tali.armorSpecies, 'quarian');
  assert.equal(wrex.armorSpecies, 'krogan');
  assert.deepEqual(wrex.armorWeights, ['medium'], 'No invented light krogan starter');
  assert.deepEqual(wrex.trainableArmorWeights, ['heavy']);
  assert.deepEqual(getEquipmentProfile('jenkins').armorWeights, ['light', 'medium']);
  assert.deepEqual(getEquipmentProfile('jenkins').trainableArmorWeights, ['heavy']);
  assert.equal(liara.biologicalSpecies, 'asari');
  assert.equal(liara.armorSpecies, 'human');
  assert.deepEqual(liara.armorWeights, ['light']);
});

test('specialist equipment follows existing biotic and technical capabilities', () => {
  assert.equal(getEquipmentProfile('liara').canUseOmniTool, true);
  assert.equal(getEquipmentProfile('liara').tech, false, 'OmniTech permission does not grant technological combat powers');
  assert.equal(getEquipmentProfile('shepard', 'soldier').canUseOmniTool, false);
  assert.equal(getEquipmentProfile('shepard', 'engineer').canUseOmniTool, true);
  assert.deepEqual(['biotic', 'tech'].map(key => getEquipmentProfile('shepard', 'soldier')[key]), [false, false]);
  assert.deepEqual(['biotic', 'tech'].map(key => getEquipmentProfile('shepard', 'sentinel')[key]), [true, true]);
  assert.equal(getEquipmentProfile('wrex').biotic, true);
  assert.equal(getEquipmentProfile('tali').biotic, false);
  assert.equal(getEquipmentProfile('garrus').biotic, false);
  assert.equal(getEquipmentProfile('tali').tech, true);
  assert.equal(getEquipmentProfile('kaidan').tech, true);
});

test('profiles are isolated copies and invalid identities/classes cannot gain fallback equipment rights', () => {
  const profile = getEquipmentProfile('shepard', 'soldier');
  profile.allowedWeapons.length = 0;
  profile.weaponTraining.push('invented-weapon');
  profile.armorWeights.push('heavy');
  const fresh = getEquipmentProfile('shepard', 'soldier');
  assert.equal(fresh.allowedWeapons.length, 4);
  assert.equal(fresh.weaponTraining.includes('invented-weapon'), false);
  assert.equal(fresh.armorWeights.includes('heavy'), false);
  for (const value of ['unknown', '__proto__', 'constructor', null, 3]) assert.equal(getEquipmentProfile(value), null);
  assert.equal(getEquipmentProfile('shepard', 'unknown'), null);
  assert.equal(getEquipmentProfile('garrus', '__proto__'), null);
});

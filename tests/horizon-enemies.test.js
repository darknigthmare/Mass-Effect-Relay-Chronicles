import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HORIZON_ENEMIES, HORIZON_ENEMY_IDS as IDS, HORIZON_ENEMY_HEIGHTS,
  HORIZON_ENEMY_MECHANICS, HORIZON_ENEMY_VISUALS, HORIZON_ENCOUNTER_CHANGES,
  normalizeHorizonEnemyAtlas, getHorizonEnemyVisual, getHorizonAmbientVisual } from '../src/horizon-enemies.js';
import { ENEMIES, ENCOUNTERS, actorFor, enemiesFor } from '../src/game-data.js';
import { newGame, winEncounter, completeZone, recruit, zoneEncounters, canStartEncounter, encodeSave, decodeSave } from '../src/state.js';
import { createBattle, getActions, performAction } from '../src/combat.js';

// Actual main2ab3f7c formations, transcribed as a portable test fixture; the
// separate paired simulator loads that revision with git show before comparison.
const baseline = {
  'eden-prime': [['geth', 'geth'], ['husk', 'husk', 'geth'], ['destroyer', 'sniper']],
  therum: [['recon-drone', 'rocket-geth'], ['shock-geth', 'turret'], ['krogan', 'geth', 'sniper']],
  feros: [['geth', 'geth', 'sniper'], ['creeper', 'creeper', 'asari'], ['thorian', 'creeper']],
  noveria: [['geth', 'destroyer'], ['rachni-worker', 'rachni', 'rachni'], ['benezia', 'asari']],
  virmire: [['assault-drone', 'sniper', 'krogan'], ['juggernaut', 'krogan'], ['saren', 'geth']],
  ilos: [['stalker', 'destroyer'], ['destroyer', 'sniper'], ['destroyer', 'destroyer', 'sniper']],
  'citadel-finale': [['geth', 'sniper', 'destroyer'], ['destroyer', 'asari'], ['saren-final']],
};
const atlas = () => JSON.parse(readFileSync(new URL('../public/assets/horizon-enemies.json', import.meta.url)));

test('five partial ME1 profiles remain distinct from fauna, companions and ambiguous ghost content', () => {
  assert.equal(IDS.length, 5); assert.equal(new Set(IDS.map(key => HORIZON_ENEMIES[key].catalogId)).size, 5);
  for (const key of IDS) {
    const profile = HORIZON_ENEMIES[key];
    assert.equal(ENEMIES[key], profile); assert.equal(profile.sprite, key); assert.equal(profile.mediaId, 'ME1');
    assert.equal(profile.periodId, 'me1'); assert.equal(profile.status, 'Prototype'); assert.ok(Object.isFrozen(profile.powers));
    assert.equal(profile.synthetic, key !== 'battlemaster'); assert.equal(profile.boss, undefined);
    assert.ok(HORIZON_ENEMY_HEIGHTS[key] > 1); assert.ok(HORIZON_ENEMY_MECHANICS[key].missing.length);
    assert.equal(profile.primaryAction, undefined);
  }
  for (const key of ['ghost', 'varren', 'alpha-varren', 'fist', 'balak']) assert.ok(!IDS.includes(key));
  assert.equal(ENEMIES.ghost, undefined);
});

test('every new profile executes a real native shot, spends ATB and leaves persistent state alone', () => {
  for (const key of IDS) {
    const state = newGame({ difficulty: 'story' }), snapshot = structuredClone(state), id = `${key}-0`;
    const battle = createBattle({ party: [actorFor('shepard', state)],
      enemies: [{ ...HORIZON_ENEMIES[key], id, atb: 100 }], difficulty: 'story', mode: 'wait', seed: 2183 });
    const enemy = battle.actors.find(actor => actor.id === id), player = battle.actors.find(actor => actor.id === 'shepard');
    const before = player.hp + player.shield;
    assert.ok(getActions(battle, id).some(action => action.id === 'shoot' && action.available));
    const result = performAction(battle, { actorId: id, actionId: 'shoot', targetId: 'shepard' });
    assert.equal(result.ok, true); assert.equal(enemy.atb, 0); assert.equal(enemy.heat, 24);
    assert.ok(player.hp + player.shield < before); assert.deepEqual(state, snapshot);
    assert.ok(result.events.some(event => event.type === 'action' && event.actorId === id && event.actionId === 'shoot'));
  }
});

test('the sapper actually sabotages weapons without granting biotic powers or disabling unrelated powers', () => {
  const state = newGame({ classId: 'adept' }), id = 'sapper-0';
  const battle = createBattle({ party: [{ ...actorFor('shepard', state), atb: 100 }],
    enemies: [{ ...HORIZON_ENEMIES.sapper, id, atb: 100 }], mode: 'wait', seed: 2183 });
  const result = performAction(battle, { actorId: id, actionId: 'sabotage', targetId: 'shepard' });
  assert.equal(result.ok, true);
  const player = battle.actors.find(actor => actor.id === 'shepard');
  assert.ok(player.statuses.sabotage > 0);
  assert.equal(getActions(battle, 'shepard').find(action => action.id === 'shoot').available, false);
  assert.equal(getActions(battle, 'shepard').find(action => action.id === 'throw').available, true);
  assert.deepEqual(HORIZON_ENEMIES.sapper.powers, ['sabotage']);
});

test('Therum battlemaster replaces identity only with exact old krogan budget and existing Barrier', () => {
  for (const field of ['hp', 'shield', 'attack', 'defense', 'speed', 'powers', 'synthetic']) {
    assert.deepEqual(HORIZON_ENEMIES.battlemaster[field], ENEMIES.krogan[field], field);
  }
  const state = newGame(), id = 'battlemaster-0';
  const battle = createBattle({ party: [actorFor('shepard', state)],
    enemies: [{ ...HORIZON_ENEMIES.battlemaster, id, atb: 100, shield: 0, maxShield: HORIZON_ENEMIES.battlemaster.shield }], mode: 'wait', seed: 2183 });
  const result = performAction(battle, { actorId: id, actionId: 'barrier', targetId: id });
  assert.equal(result.ok, true);
  const actor = battle.actors.find(actor => actor.id === id);
  assert.ok(actor.shield > 0); assert.ok(actor.statuses.barrier > 0); assert.equal(actor.atb, 0);
  assert.deepEqual(ENCOUNTERS.therum[2], ['battlemaster', 'geth', 'sniper']);
});

test('exactly six authored slots change, preserving every mission ID and all other boss formations', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS), Object.keys(baseline));
  const observed = new Set(), encounteredNew = new Set();
  const changes = new Map(HORIZON_ENCOUNTER_CHANGES.map(change => [`${change.zone}:${change.index}`, change]));
  for (const [zone, rows] of Object.entries(baseline)) {
    assert.deepEqual(zoneEncounters(zone), [`${zone}:encounter-1`, `${zone}:encounter-2`, `${zone}:boss`]);
    for (const [index, before] of rows.entries()) {
      const slot = `${zone}:${index}`, change = changes.get(slot), expected = change?.after || before;
      assert.deepEqual(ENCOUNTERS[zone][index], expected, slot); assert.equal(expected.length, before.length);
      if (change) { observed.add(slot); assert.deepEqual(change.before, before); }
      const budget = list => list.reduce((sum, key) => sum + ENEMIES[key].hp + ENEMIES[key].shield, 0);
      assert.ok(budget(expected) / budget(before) >= .8 && budget(expected) / budget(before) <= 1.2);
      for (const actor of enemiesFor(zone, index, newGame())) if (IDS.includes(actor.sprite)) encounteredNew.add(actor.sprite);
      if (index === 2 && zone !== 'therum') assert.deepEqual(expected, before);
    }
  }
  assert.equal(observed.size, 6); assert.deepEqual([...encounteredNew].sort(), [...IDS].sort());
  // The previous Juggernaut remains present after the Colossus takes its old slot.
  assert.ok(ENCOUNTERS['citadel-finale'][0].includes('juggernaut'));
  assert.deepEqual(ENCOUNTERS['eden-prime'], baseline['eden-prime']);
});

test('all 21 prior sector histories resume with original rewards, deaths and no replay', () => {
  const state = newGame({ difficulty: 'story' }); state.flags.briefed = true;
  const choices = { feros: 'save', noveria: 'release', virmire: 'save-kaidan', 'citadel-finale': 'save-council' };
  for (const zone of ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale']) {
    state.zone = zone;
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) {
      assert.equal(canStartEncounter(state, id).ok, true);
      const before = { xp: state.xp, credits: state.credits };
      assert.equal(winEncounter(state, id), true); assert.equal(state.xp - before.xp, 65); assert.equal(state.credits - before.credits, 85);
      const restored = decodeSave(encodeSave(state)); assert.ok(restored); assert.deepEqual(restored.cleared, state.cleared);
      assert.equal(canStartEncounter(restored, id).ok, false);
      const copy = structuredClone(restored); assert.equal(winEncounter(restored, id), false); assert.deepEqual(restored, copy);
    }
    assert.equal(completeZone(state, zone, choices[zone]), true); assert.ok(decodeSave(encodeSave(state)));
  }
  assert.equal(state.ending, true); assert.equal(state.cleared.length, 21); assert.ok(state.lost.includes('jenkins'));
});

test('five native measured crops normalize locally, detached and immutable; invalid layouts fail closed', () => {
  const raw = atlas(), parsed = normalizeHorizonEnemyAtlas(raw); assert.ok(parsed);
  assert.equal(Object.keys(parsed.frames).length, 5); assert.ok(Object.isFrozen(parsed.frames.colossus.rect));
  const before = parsed.frames.colossus.rect[0]; raw.frames.colossus.rect[0] = 9000; assert.equal(parsed.frames.colossus.rect[0], before);
  const mutations = [input => { input.mediaId = 'ME2'; }, input => { input.periodId = 'me3'; },
    input => { input.file = '../horizon-enemies.png'; }, input => { delete input.frames.sapper; },
    input => { input.frames.sapper.catalogId = 'ENM-fantome-geth'; }, input => { input.frames.sapper.sprite = 'ghost'; },
    input => { input.frames.armature.rect = [...input.frames.colossus.rect]; }, input => { input.frames.colossus.rect[2] = 9000; },
    input => { input.frames.sapper.pivot[0] = -1; }, input => { input.frames.colossus.heightScale = 2; },
    input => { input.frames['rocket-drone'].hoverHeight = Infinity; }, input => { input.frames.battlemaster.id = 'fist-body'; }];
  for (const mutate of mutations) { const input = atlas(); mutate(input); assert.equal(normalizeHorizonEnemyAtlas(input), null); }
  assert.equal(normalizeHorizonEnemyAtlas(Object.create(atlas())), null);
  const png = readFileSync(new URL('../public/assets/horizon-enemies.png', import.meta.url));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.equal(png[25], 6);
  assert.equal(png.readUInt32BE(16), parsed.width); assert.equal(png.readUInt32BE(20), parsed.height);
});

test('native body identities reject wrong teams, sprites, namespaces and foreign actor/state scope', () => {
  for (const key of IDS) {
    const state = { ...HORIZON_ENEMIES[key], id: `${key}-0`, team: 'enemy' }, actor = { id: state.id, key, enemy: true, state };
    assert.equal(getHorizonEnemyVisual(actor), HORIZON_ENEMY_VISUALS[key]);
    for (const patch of [{ mediaId: 'ME2' }, { periodId: 'me3' }, { context: { mediaId: 'MEA' } },
      { context: { periodId: 'me2' } }, { id: 'foreign' }, { sprite: 'geth' }, { team: 'party' }]) assert.equal(getHorizonEnemyVisual(actor, { ...state, ...patch }), null);
    for (const patch of [{ enemy: false }, { key: 'ghost' }, { periodId: 'mea' }, { mediaId: 'ME3' }, { context: { mediaId: 'ME2' } }]) assert.equal(getHorizonEnemyVisual({ ...actor, ...patch }), null);
    for (const id of [key, `${key}-fixture`, `${key}--1`, `${key}-1x`, `bench:${key}-0`]) assert.equal(getHorizonEnemyVisual({ ...actor, id }, { ...state, id }), null);
  }
});

test('ambient previews only authorize the real first opponent of each explicitly authored slot', () => {
  for (const change of HORIZON_ENCOUNTER_CHANGES.filter(change => IDS.includes(change.after[0]))) {
    const key = change.after[0], suffix = change.index === 2 ? 'boss' : `encounter-${change.index + 1}`;
    const poi = { id: `${change.zone}:${suffix}`, type: 'encounter' };
    const actor = { id: `ambient:${poi.id}`, poiId: poi.id, key, enemy: true };
    const input = { zoneId: change.zone, poi, firstSprite: key, context: { mediaId: 'ME1', periodId: 'me1' } };
    assert.equal(getHorizonAmbientVisual(actor, input), HORIZON_ENEMY_VISUALS[key]);
    for (const patch of [{ firstSprite: 'geth' }, { zoneId: 'eden-prime' }, { context: { mediaId: 'ME2' } },
      { poi: { ...poi, type: 'npc' } }, { poi: { ...poi, id: `${change.zone}:invented` } }]) assert.equal(getHorizonAmbientVisual(actor, { ...input, ...patch }), null);
    for (const patch of [{ enemy: false }, { id: `${key}-0` }, { poiId: 'foreign' }, { mediaId: 'MEA' }]) assert.equal(getHorizonAmbientVisual({ ...actor, ...patch }, input), null);
  }
});

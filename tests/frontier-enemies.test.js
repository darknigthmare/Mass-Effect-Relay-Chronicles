import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FRONTIER_ENEMIES, FRONTIER_ENEMY_IDS as IDS, FRONTIER_ENEMY_ATLAS,
  FRONTIER_ENEMY_VISUALS, FRONTIER_ENEMY_MECHANICS, normalizeFrontierEnemyAtlas,
  getFrontierEnemyVisual, getFrontierAmbientVisual } from '../src/frontier-enemies.js';
import { ENEMIES, ENCOUNTERS, actorFor, enemiesFor } from '../src/game-data.js';
import { newGame, winEncounter, canStartEncounter, zoneEncounters, recruit,
  completeZone, encodeSave, decodeSave } from '../src/state.js';
import { createBattle, getActions, performAction } from '../src/combat.js';

const baseline = {
  'eden-prime': [['geth', 'geth'], ['husk', 'husk', 'geth'], ['destroyer', 'sniper']],
  therum: [['geth', 'sniper'], ['geth', 'destroyer'], ['krogan', 'geth', 'sniper']],
  feros: [['geth', 'geth', 'sniper'], ['creeper', 'creeper', 'asari'], ['thorian', 'creeper']],
  noveria: [['geth', 'destroyer'], ['rachni', 'rachni', 'rachni'], ['benezia', 'asari']],
  virmire: [['geth', 'sniper', 'krogan'], ['destroyer', 'krogan'], ['saren', 'geth']],
  ilos: [['geth', 'destroyer'], ['destroyer', 'sniper'], ['destroyer', 'destroyer', 'sniper']],
  'citadel-finale': [['geth', 'sniper', 'destroyer'], ['destroyer', 'asari'], ['saren-final']],
};
const fresh = () => newGame({ difficulty: 'story' });

test('eight partial native ME1 profiles have distinct identities and no invented biotic or later-game kit', () => {
  assert.equal(IDS.length, 8); assert.equal(new Set(IDS.map(key => FRONTIER_ENEMIES[key].catalogId)).size, 8);
  for (const key of IDS) {
    const profile = FRONTIER_ENEMIES[key];
    assert.equal(ENEMIES[key], profile); assert.equal(profile.sprite, key);
    assert.equal(profile.mediaId, 'ME1'); assert.equal(profile.periodId, 'me1'); assert.equal(profile.status, 'Prototype');
    assert.ok(Object.isFrozen(profile.powers)); assert.deepEqual(profile.powers, []);
    assert.equal(profile.synthetic, key !== 'rachni-worker'); assert.equal(profile.boss, undefined);
    assert.ok(FRONTIER_ENEMY_MECHANICS[key].implemented.length > 0);
    assert.ok(FRONTIER_ENEMY_MECHANICS[key].missing.length > 0);
    assert.equal(profile.weaponSystem, undefined); assert.equal(profile.grenades, undefined);
  }
  assert.equal(FRONTIER_ENEMIES['rachni-worker'].primaryAction, 'strike');
});

test('every new type executes an actual existing attack and spends ATB, without adding a power', () => {
  for (const key of IDS) {
    const state = fresh(), id = `${key}-0`, profile = FRONTIER_ENEMIES[key];
    const battle = createBattle({ party: [actorFor('shepard', state)],
      enemies: [{ ...profile, id, atb: 100 }], mode: 'wait', difficulty: 'story', seed: 2183 });
    const native = battle.actors.find(actor => actor.id === id), target = battle.actors.find(actor => actor.id === 'shepard');
    const actionId = profile.primaryAction || 'shoot', before = target.hp + target.shield;
    assert.ok(getActions(battle, id).some(action => action.id === actionId && action.available));
    if (key === 'rachni-worker') assert.ok(!getActions(battle, id).some(action => ['shoot', 'burst', 'acid'].includes(action.id)));
    const result = performAction(battle, { actorId: id, actionId, targetId: target.id });
    assert.equal(result.ok, true, key); assert.equal(native.atb, 0); assert.ok(target.hp + target.shield < before, key);
    assert.equal(native.heat, key === 'rachni-worker' ? 0 : 24); assert.deepEqual(native.powers, []);
    assert.ok(result.events.some(event => event.type === 'action' && event.actorId === id && event.actionId === actionId));
    assert.deepEqual(state, fresh(), 'The detached encounter never modifies persistent inventory, progression or rewards.');
  }
});

test('Frontier profiles remain encountered after later additions, with stable mission IDs, counts and bounded budgets', () => {
  assert.deepEqual(Object.keys(ENCOUNTERS), Object.keys(baseline));
  const observed = new Set();
  for (const [zone, rows] of Object.entries(baseline)) {
    assert.deepEqual(zoneEncounters(zone), [`${zone}:encounter-1`, `${zone}:encounter-2`, `${zone}:boss`]);
    for (let index = 0; index < rows.length; index++) {
      const expected = ENCOUNTERS[zone][index];
      assert.equal(expected.length, rows[index].length);
      if(zone==='eden-prime'||index===2&&zone!=='therum')assert.deepEqual(expected,rows[index]);
      const enemies = enemiesFor(zone, index, fresh());
      enemies.forEach((actor, position) => {
        assert.equal(actor.id, `${expected[position]}-${position}`);
        assert.equal(actor.maxHp, ENEMIES[expected[position]].hp);
        if (IDS.includes(actor.sprite)) observed.add(actor.sprite);
      });
      // These substitutions keep body/shield budgets within 20%; higher speeds,
      // defense and removed old powers are assessed by the campaign simulation.
      const budget = keys => keys.reduce((total, key) => total + ENEMIES[key].hp + ENEMIES[key].shield, 0);
      const ratio = budget(expected) / budget(rows[index]); assert.ok(ratio >= .8 && ratio <= 1.2, `${zone}:${index}: ${ratio}`);
    }
  }
  assert.deepEqual([...observed].sort(), [...IDS].sort());
});

test('old encounter history resumes without replay or duplicate rewards through all new variants', () => {
  const state = fresh(); state.flags.briefed = true;
  const choices = { feros: 'save', noveria: 'release', virmire: 'save-kaidan', 'citadel-finale': 'save-council' };
  for (const zone of ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale']) {
    state.zone = zone;
    if (zone === 'citadel') assert.equal(recruit(state, 'tali'), true);
    for (const id of zoneEncounters(zone)) {
      assert.equal(canStartEncounter(state, id).ok, true);
      const before = { xp: state.xp, credits: state.credits };
      assert.equal(winEncounter(state, id), true);
      assert.equal(state.xp, before.xp + 65); assert.equal(state.credits, before.credits + 85);
      // Old saves contain sector IDs, never the previous formation's actor IDs.
      const resumed = decodeSave(encodeSave(state)); assert.ok(resumed);
      assert.deepEqual(resumed.cleared, state.cleared); assert.equal(canStartEncounter(resumed, id).ok, false);
      const snapshot = structuredClone(resumed); assert.equal(winEncounter(resumed, id), false); assert.deepEqual(resumed, snapshot);
    }
    assert.equal(completeZone(state, zone, choices[zone]), true);
    assert.ok(decodeSave(encodeSave(state)));
  }
  assert.equal(state.ending, true); assert.equal(state.cleared.length, 21);
  assert.ok(state.lost.includes('jenkins')); assert.ok(state.lost.includes('ashley'));
});

test('atlas metadata is complete, local, immutable, non-overlapping and equal to published measured frames', () => {
  const raw = JSON.parse(readFileSync(new URL('../public/assets/frontier-enemies.json', import.meta.url)));
  const parsed = normalizeFrontierEnemyAtlas(raw); assert.ok(parsed);
  assert.deepEqual(parsed.frames, FRONTIER_ENEMY_VISUALS); assert.deepEqual(parsed.frames, FRONTIER_ENEMY_ATLAS.frames);
  assert.ok(Object.isFrozen(parsed.frames.stalker.rect));
  raw.frames.stalker.rect[0] = 9000; assert.equal(parsed.frames.stalker.rect[0], 387);
  const invalid = [
    input => { input.mediaId = 'ME2'; }, input => { input.periodId = 'me3'; },
    input => { input.file = '../frontier-enemies.png'; }, input => { delete input.frames.turret; },
    input => { input.frames.turret.catalogId = 'ENM-drone-d-assaut-geth'; },
    input => { input.frames.stalker.sprite = 'geth'; }, input => { input.frames.stalker.mediaId = 'ME3'; },
    input => { input.frames.stalker.rect = input.frames['recon-drone'].rect; },
    input => { input.frames.stalker.rect[2] = 9000; }, input => { input.frames.stalker.pivot[0] = -1; },
    input => { input.frames.stalker.heightScale = 2; }, input => { input.frames['recon-drone'].hoverHeight = Infinity; },
    input => { input.frames.stalker.file = 'https://example.com/foreign.png'; },
  ];
  for (const mutate of invalid) {
    const input = structuredClone(FRONTIER_ENEMY_ATLAS); mutate(input); assert.equal(normalizeFrontierEnemyAtlas(input), null);
  }
});

test('body lookup requires native indexed enemy identities and rejects foreign scope or party aliases', () => {
  for (const key of IDS) {
    const state = { ...FRONTIER_ENEMIES[key], id: `${key}-0`, team: 'enemy' };
    const view = { id: state.id, key, enemy: true, state };
    assert.equal(getFrontierEnemyVisual(view), FRONTIER_ENEMY_VISUALS[key]);
    for (const patch of [{ mediaId: 'ME2' }, { periodId: 'me3' }, { context: { mediaId: 'MEA' } },
      { context: { periodId: 'me2' } }, { id: `ME2-${key}` }, { sprite: 'geth' }, { team: 'party' }])
      assert.equal(getFrontierEnemyVisual(view, { ...state, ...patch }), null);
    for (const patch of [{ enemy: false }, { mediaId: 'ME3' }, { key: 'geth' }, { periodId: 'mea' }])
      assert.equal(getFrontierEnemyVisual({ ...view, ...patch }), null);
    for (const id of [key, `${key}-fixture`, `${key}-1x`, `${key}--1`, `bench:${key}-0`])
      assert.equal(getFrontierEnemyVisual({ ...view, id }, { ...state, id }), null);
  }
  assert.equal(getFrontierEnemyVisual(null), null);
});

test('ambient patrol previews require the actual zone encounter, first enemy and separate ambient identity', () => {
  for (const [zoneId, formations] of Object.entries(ENCOUNTERS)) for (const [index, formation] of formations.entries()) {
    const key = formation[0];if(!IDS.includes(key))continue;
    const poi = { id: `${zoneId}:encounter-${Number(index) + 1}`, type: 'encounter' };
    const actor = { id: `ambient:${poi.id}`, poiId: poi.id, key, enemy: true };
    const input = { zoneId, poi, firstSprite: ENEMIES[ENCOUNTERS[zoneId][Number(index)][0]].sprite,
      context: { mediaId: 'ME1', periodId: 'me1' } };
    assert.equal(getFrontierAmbientVisual(actor, input), FRONTIER_ENEMY_VISUALS[key]);
    assert.equal(getFrontierEnemyVisual(actor, { id: actor.id, sprite: key, team: 'enemy' }), null);
    for (const change of [{ zoneId: 'eden-prime' }, { firstSprite: 'rocket-geth' },
      { context: { mediaId: 'ME2', periodId: 'me2' } }, { poi: { ...poi, type: 'npc' } },
      { poi: { ...poi, id: `${zoneId}:boss` } }]) assert.equal(getFrontierAmbientVisual(actor, { ...input, ...change }), null);
    for (const change of [{ enemy: false }, { id: `${key}-0` }, { poiId: 'fake' }, { key: 'turret' },
      { mediaId: 'MEA' }]) assert.equal(getFrontierAmbientVisual({ ...actor, ...change }, input), null);
  }
  assert.equal(getFrontierAmbientVisual({id:'ambient:virmire:encounter-2',poiId:'virmire:encounter-2',key:'juggernaut',enemy:true},{zoneId:'virmire',poi:{id:'virmire:encounter-2',type:'encounter'},firstSprite:'juggernaut',context:{mediaId:'ME1',periodId:'me1'}}),null,'The retired Juggernaut patrol is no longer authorized.');
  assert.equal(getFrontierAmbientVisual({ id: 'ambient:eden-prime:encounter-1', poiId: 'eden-prime:encounter-1', key: 'recon-drone', enemy: true },
    { zoneId: 'eden-prime', poi: { id: 'eden-prime:encounter-1', type: 'encounter' }, firstSprite: 'recon-drone' }), null);
});

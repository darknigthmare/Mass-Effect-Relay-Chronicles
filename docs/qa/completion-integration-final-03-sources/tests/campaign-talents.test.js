import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, encodeSave, decodeSave } from '../src/state.js';
import { baseActorFor } from '../src/game-data.js';
import { createBattle, getActions, performAction, tickBattle } from '../src/combat.js';
import { applyLoadout, normalizeInventory, getTrainingOptions, trainArmor, equipItem, previewLoadout } from '../src/loadout.js';
import { createTalentState, normalizeTalents, getTalentOptions, getTalentBudget, trainTalent, getTalentEffects,
  applyCampaignTalents, CAMPAIGN_TALENT_ACTIONS, campaignTalentActionAllowed, applyCampaignTalentAction, campaignTalentDamageMultiplier } from '../src/campaign-talents.js';

const stateFor = (classId = 'soldier', points = 6) => ({ ...newGame({ classId }), xp: points * 300, talents: createTalentState() });
const actorFor = state => applyCampaignTalents(applyLoadout(baseActorFor('shepard', state), state), state);
const buy = (state, id, count = 1) => { for (let i = 0; i < count; i++) assert.equal(trainTalent(state, 'shepard', id).ok, true, id); };
const unchangedFailure = (state, callback) => { const before = structuredClone(state); assert.equal(callback().ok, false); assert.deepEqual(state, before); };

test('absent legacy talents migrate neutrally and validated ranks are detached', () => {
  const state = stateFor();
  const old = structuredClone(state); delete old.talents;
  assert.deepEqual(normalizeTalents(undefined, old), { version: 1, ranks: {} });
  const baseline = applyLoadout(baseActorFor('shepard', old), old);
  assert.deepEqual(applyCampaignTalents(baseline, old), baseline);
  buy(state, 'fitness');
  const copy = normalizeTalents(state.talents, state); copy.ranks.shepard.fitness = 2;
  assert.equal(state.talents.ranks.shepard.fitness, 1);
});

test('explicit malformed talents, class forgeries and getter payloads are refused', () => {
  const state = stateFor();
  const invalid = [null, [], {}, { version: 2, ranks: {} }, { version: 1, ranks: {}, extra: 0 },
    { version: 1, ranks: { shepard: { fitness: 0 } } }, { version: 1, ranks: { shepard: { fitness: 4 } } },
    { version: 1, ranks: { shepard: { damping: 2 } } }, { version: 1, ranks: { tali: { electronics: 1 } } },
    { version: 1, ranks: { jenkins: { 'assault-rifles': 1 } } },
    { version: 1, ranks: JSON.parse('{"__proto__":{"fitness":1}}') },
  ];
  for (const raw of invalid) assert.equal(normalizeTalents(raw, state), null);
  let accessed = false;
  const accessor = createTalentState(); Object.defineProperty(accessor.ranks, 'shepard', { enumerable: true, get() { accessed = true; return {}; } });
  assert.equal(normalizeTalents(accessor, state), null); assert.equal(accessed, false);
  const cyclic = createTalentState(); cyclic.ranks.shepard = cyclic; assert.equal(normalizeTalents(cyclic, state), null);
  const symbolic = createTalentState(); symbolic.ranks[Symbol('x')] = {}; assert.equal(normalizeTalents(symbolic, state), null);
  const foreign = stateFor(); foreign.context = { mediaId: 'ME2', periodId: 'me2' };
  assert.equal(normalizeTalents({ version: 1, ranks: {} }, foreign), null);
});

test('talents and armour reserve the same per-actor point regardless of purchase order', () => {
  const armourFirst = stateFor('soldier', 1);
  assert.equal(trainArmor(armourFirst, 'shepard', 'heavy').ok, true);
  unchangedFailure(armourFirst, () => trainTalent(armourFirst, 'shepard', 'fitness'));
  assert.deepEqual(getTalentBudget(armourFirst, 'shepard'), { total: 1, talentPoints: 0, armorPoints: 1, available: 0 });
  const talentFirst = stateFor('soldier', 1); buy(talentFirst, 'fitness');
  unchangedFailure(talentFirst, () => trainArmor(talentFirst, 'shepard', 'heavy'));
  assert.equal(getTrainingOptions(talentFirst, 'shepard')[0].availablePoints, 0);
  const forged = structuredClone(talentFirst);
  forged.inventory.training.shepard = { weights: { heavy: true }, legacyArmor: null };
  assert.equal(normalizeTalents(forged.talents, forged), null);
  assert.equal(normalizeInventory(forged.inventory, forged), null);
});

test('actual campaign save reconstruction preserves both budgets and rejects an overspent import', () => {
  const state = stateFor('soldier', 2); buy(state, 'fitness');
  assert.equal(trainArmor(state, 'shepard', 'heavy').ok, true);
  const loaded = decodeSave(encodeSave(state)); assert.ok(loaded);
  assert.deepEqual(loaded.talents, state.talents); assert.deepEqual(loaded.inventory, state.inventory);
  assert.deepEqual(getTalentBudget(loaded, 'shepard'), { total: 2, talentPoints: 1, armorPoints: 1, available: 0 });
  const invalid = JSON.parse(encodeSave(state)); invalid.state.talents.ranks.shepard.fitness = 2;
  assert.equal(decodeSave(invalid), null);
  const legacy = JSON.parse(encodeSave(state)); delete legacy.state.talents;
  assert.deepEqual(decodeSave(legacy).talents, createTalentState());
  legacy.state.talents = null; assert.equal(decodeSave(legacy), null);
});

test('class capabilities and permanent loss constrain options without creating a power', () => {
  for (const classId of ['soldier', 'engineer', 'adept', 'infiltrator', 'vanguard', 'sentinel']) {
    const state = stateFor(classId), ids = getTalentOptions(state, 'shepard').map(talent => talent.id);
    assert.equal(ids.includes('fitness'), classId === 'soldier');
    assert.equal(ids.includes('assault-training'), classId === 'soldier');
    assert.equal(ids.includes('damping'), classId === 'engineer');
    assert.equal(ids.includes('biotic-discipline'), ['adept', 'vanguard', 'sentinel'].includes(classId));
    assert.equal(ids.includes('electronics'), ['engineer', 'infiltrator', 'sentinel'].includes(classId));
  }
  const state = stateFor(); state.recruited.push('liara', 'tali');
  assert.deepEqual(getTalentOptions(state, 'liara').map(talent => talent.id), ['biotic-discipline']);
  assert.equal(getTalentOptions(state, 'tali').some(talent => talent.id === 'biotic-discipline'), false);
  state.lost.push('tali'); unchangedFailure(state, () => trainTalent(state, 'tali', 'electronics'));
  assert.deepEqual(getTalentOptions(state, 'jenkins'), []);
  unchangedFailure(state, () => trainTalent(state, 'shepard', '__proto__'));
});

test('prerequisite, rank cap and Normandy restriction are atomic and spend no currency', () => {
  const state = stateFor('engineer', 5);
  unchangedFailure(state, () => trainTalent(state, 'shepard', 'damping'));
  const currency = [state.xp, state.credits, state.medigel, state.paragon, state.renegade], inventory = structuredClone(state.inventory);
  buy(state, 'electronics'); buy(state, 'damping', 2);
  assert.deepEqual([state.xp, state.credits, state.medigel, state.paragon, state.renegade], currency);
  assert.deepEqual(state.inventory, inventory);
  unchangedFailure(state, () => trainTalent(state, 'shepard', 'damping'));
  state.zone = 'eden-prime'; unchangedFailure(state, () => trainTalent(state, 'shepard', 'electronics'));
});

test('derived bonuses recompute from gear and rank without stacking or wrong-family effects', () => {
  const state = stateFor('soldier', 10);
  const baseline = applyLoadout(baseActorFor('shepard', state), state);
  buy(state, 'fitness', 2); buy(state, 'pistols', 2); buy(state, 'assault-training', 2);
  const rifle = actorFor(state);
  assert.equal(rifle.hp, baseline.hp + 28); assert.equal(rifle.maxHp, baseline.maxHp + 28);
  assert.equal(rifle.weaponDamageMultiplier, 1.06, 'Unselected pistol ranks do not strengthen an assault rifle');
  assert.equal(equipItem(state, 'shepard', 'kessler-i', 'weapon').ok, true);
  const pistol = actorFor(state);
  assert.equal(pistol.weaponDamageMultiplier, 1.07 * 1.06);
  assert.deepEqual(applyCampaignTalents(pistol, state), pistol);
  assert.deepEqual(actorFor(state), pistol);
  assert.ok(pistol.powers.includes('me1Immunity') && pistol.powers.includes('me1Adrenaline'));
  assert.equal(getTalentEffects(state, 'shepard').bioticMultiplier, 1);
  const before = structuredClone(state); const preview = previewLoadout(baseActorFor('shepard', state), state, 'lancer-i', 'weapon');
  assert.equal(preview.ok, true); assert.deepEqual(preview.current, pistol); assert.equal(preview.preview.hp, pistol.hp);
  assert.equal(preview.preview.weaponDamageMultiplier, 1.06); assert.equal(preview.deltas.weaponDamageMultiplier, -.074); assert.deepEqual(state, before);
});

test('new combat powers require the purchased ME1 class and never leak to later contexts', () => {
  const soldier = stateFor('soldier', 4); buy(soldier, 'fitness', 2); buy(soldier, 'assault-training', 2);
  const actor = actorFor(soldier);
  assert.equal(campaignTalentActionAllowed(actor, 'me1Immunity'), true);
  assert.equal(campaignTalentActionAllowed(actor, 'me1Adrenaline'), true);
  assert.equal(campaignTalentActionAllowed({ ...actor, mediaId: 'ME2' }, 'me1Adrenaline'), false);
  assert.equal(campaignTalentActionAllowed({ ...actor, id: 'ashley' }, 'me1Immunity'), false);
  assert.equal(campaignTalentActionAllowed({ ...actor, campaignTalentClass: 'adept' }, 'me1Immunity'), false);
  assert.equal(campaignTalentActionAllowed({ ...actor, campaignTalentRanks: {} }, 'me1Immunity'), false);
  const foreign = { ...soldier, context: { mediaId: 'MEA', periodId: 'mea' } };
  assert.deepEqual(applyCampaignTalents(applyLoadout(baseActorFor('shepard', soldier), soldier), foreign), applyLoadout(baseActorFor('shepard', soldier), soldier));
});

test('ME1 adrenaline resets other cooldowns while preserving its cost and every other resource', () => {
  const state = stateFor('soldier', 2); buy(state, 'assault-training', 2);
  const actor = { ...actorFor(state), cooldowns: { me1Adrenaline: 45, unity: 19, cover: 3 }, atb: 0, heat: 79, hp: 90, focus: 14 };
  const before = structuredClone(actor);
  const result = applyCampaignTalentAction({ actor, actionId: 'me1Adrenaline', elapsed: 12 });
  assert.equal(result.ok, true); assert.equal(actor.cooldowns.me1Adrenaline, 45);
  assert.equal(actor.cooldowns.unity, 0); assert.equal(actor.cooldowns.cover, 0);
  assert.deepEqual({ ...actor, cooldowns: before.cooldowns }, before);
  assert.equal(CAMPAIGN_TALENT_ACTIONS.me1Adrenaline.cooldown, 45);
});

test('damping affects future powers only; immunity reduction is finite and ME1-scoped', () => {
  const state = stateFor('engineer', 3); buy(state, 'electronics'); buy(state, 'damping', 2);
  const actor = { ...actorFor(state), techMultiplier: 1.25 };
  const target = { id: 'hostile', hp: 90, shield: 40, statuses: { barrier: 5 }, cooldowns: { throw: 7 }, controlResistance: .2, channel: { phase: 'already-running' } };
  const before = structuredClone(target); const result = applyCampaignTalentAction({ actor, actionId: 'me1Damping', targets: [target] });
  assert.equal(result.ok, true); assert.equal(target.statuses.damped, 8);
  assert.deepEqual({ ...target, statuses: before.statuses }, before); assert.equal(target.statuses.barrier, 5);
  const stasis = { ...structuredClone(before), statuses: { stasis: 6 } };
  assert.equal(applyCampaignTalentAction({ actor, actionId: 'me1Damping', targets: [stasis] }).events[0].blocked, true);
  assert.equal(stasis.statuses.damped, undefined);
  assert.equal(campaignTalentDamageMultiplier({ mediaId: 'ME1', statuses: { me1Immunity: 8 } }), .65);
  assert.equal(campaignTalentDamageMultiplier({ mediaId: 'ME1', statuses: { me1Immunity: 0 } }), 1);
  assert.equal(campaignTalentDamageMultiplier({ mediaId: 'ME2', statuses: { me1Immunity: 8 } }), 1);
});

test('native damping blocks new bio/tech orders while shooting and resolved effects remain valid', () => {
  const state = stateFor('engineer', 3); buy(state, 'electronics'); buy(state, 'damping', 2);
  const battle = createBattle({ party: [{ ...actorFor(state), atb: 100 }],
    enemies: [{ id: 'specialist', hp: 300, shield: 0, maxShield: 0, atb: 100, attack: 20,
      powers: ['overload', 'throw', 'barrier'], statuses: { barrier: 4 } }], mode: 'active', difficulty: 'story', rng: () => .5 });
  const enemy = battle.actors.find(actor => actor.id === 'specialist');
  assert.equal(performAction(battle, { actorId: 'shepard', actionId: 'me1Damping', targetId: enemy.id }).ok, true);
  assert.equal(enemy.statuses.damped, 8); assert.equal(enemy.statuses.barrier, 4);
  const actorBefore = structuredClone(enemy);
  assert.equal(performAction(battle, { actorId: enemy.id, actionId: 'overload', targetId: 'shepard' }).ok, false);
  assert.deepEqual(enemy, actorBefore);
  assert.equal(getActions(battle, enemy.id).find(action => action.id === 'throw').available, false);
  assert.equal(getActions(battle, enemy.id).find(action => action.id === 'shoot').available, true);
  assert.equal(performAction(battle, { actorId: enemy.id, actionId: 'shoot', targetId: 'shepard' }).ok, true);
  tickBattle(battle, 3, { paused: true }); assert.equal(enemy.statuses.damped, 8);
  tickBattle(battle, 2); assert.ok(enemy.statuses.damped < 8 && enemy.statuses.damped > 0);
});

test('damping respects immunity and complete resistance without creating a zero-duration status', () => {
  const state = stateFor('engineer', 3); buy(state, 'electronics'); buy(state, 'damping', 2);
  const actor = actorFor(state);
  for (const resistance of [{ controlImmune: true }, { controlResistance: 1 }, { controlResistance: .999 }]) {
    const target = { id: 'immune', name: 'Cible protégée', hp: 100, statuses: { barrier: 3 }, ...resistance };
    const before = structuredClone(target), result = applyCampaignTalentAction({ actor, actionId: 'me1Damping', targets: [target] });
    assert.equal(result.ok, true); assert.equal(result.events[0].resisted, true); assert.deepEqual(target, before);
    assert.equal(Object.hasOwn(target.statuses, 'damped'), false);
  }
});

test('native immunity reduces actual incoming damage and native adrenaline keeps its own recharge', () => {
  const state = stateFor('soldier', 4); buy(state, 'fitness', 2); buy(state, 'assault-training', 2);
  const make = () => createBattle({ party: [{ ...actorFor(state), shield: 0, maxShield: 0, defense: 0, heat: 43,
    atb: 100, cooldowns: { me1Immunity: 0 } }], enemies: [{ id: 'attacker', hp: 500, shield: 0, attack: 50, atb: 100 }], mode: 'active', difficulty: 'easy', rng: () => .5 });
  const baseline = make(), protectedBattle = make();
  const damage = battle => { const actor = battle.actors[0], hp = actor.hp;
    assert.equal(performAction(battle, { actorId: 'attacker', actionId: 'shoot', targetId: 'shepard' }).ok, true); return hp - actor.hp; };
  assert.equal(performAction(protectedBattle, { actorId: 'shepard', actionId: 'me1Immunity' }).ok, true);
  assert.ok(Math.abs(damage(protectedBattle) / damage(baseline) - .65) < 1e-9);
  const adrenaline = make(), actor = adrenaline.actors[0]; actor.cooldowns.me1Immunity = 19;
  assert.equal(performAction(adrenaline, { actorId: 'shepard', actionId: 'me1Adrenaline' }).ok, true);
  assert.equal(actor.atb, 0); assert.equal(actor.cooldowns.me1Adrenaline, 45); assert.equal(actor.cooldowns.me1Immunity, 0);
  assert.equal(actor.heat, 43); assert.equal(adrenaline.actionCount, 1);
  assert.equal(getActions(adrenaline, 'shepard').find(action => action.id === 'me1Adrenaline').available, false);
});

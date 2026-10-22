/**
 * Deterministic campaign balance QA. Run from the repository with:
 *   node scripts/simulate-campaign.mjs
 *   node scripts/simulate-campaign.mjs --output docs/qa/balance-report.json
 *
 * By default, runs all six classes in Story, Normal and Hard (378 encounters),
 * plus the six Normal campaigns using the previous balance for comparison.
 * --baseline runs only those previous Normal campaigns, entirely in memory.
 * --difficulty story|normal|hard selects one final difficulty without baseline.
 * No actor statistics, ATB gauges, credits or victory results are forced.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  newGame, unlockedZones, zoneEncounters, canStartEncounter, winEncounter,
  completeZone, recruit, setSquad, buyUpgrade, encodeSave, decodeSave, encounterIndex,
} from '../src/state.js';
import { CLASSES, actorFor, enemiesFor } from '../src/game-data.js';
import * as currentCombat from '../src/combat.js';

const DECISIONS = {
  feros: 'save',
  noveria: 'release',
  virmire: 'save-kaidan',
  'citadel-finale': 'save-council',
};
const ROUTE = ['eden-prime', 'citadel', 'therum', 'feros', 'noveria', 'virmire', 'ilos', 'citadel-finale'];
const DIFFICULTIES = ['story', 'normal', 'hard'];
const PREVIOUS_PARAMETERS = {
  shieldRecharge: { exposedDelay: 4, exposedRate: 6, coverDelay: 4, coverRate: 10 },
  difficulty: {
    story: { enemyDamage: 0.65, enemySpeed: 0.8, focusChance: 0 },
    easy: { enemyDamage: 0.8, enemySpeed: 0.9, focusChance: 0 },
    normal: { enemyDamage: 1, enemySpeed: 1, focusChance: 0 },
    hard: { enemyDamage: 1.22, enemySpeed: 1.12, focusChance: 0 },
  },
};
const EXPECTED_ENCOUNTERS = ROUTE.reduce((count, zone) => count + zoneEncounters(zone).length, 0);
assert.equal(EXPECTED_ENCOUNTERS, 21, 'Update the QA protocol if the campaign gains encounters.');

const source = readFileSync(new URL('../src/combat.js', import.meta.url), 'utf8');
const difficultyBlock = /const DIFFICULTY = \{[\s\S]*?\n\};/;
const shieldBlock = /const SHIELD_RECHARGE = \{[^\n]*\};/;
assert.ok(difficultyBlock.test(source) && shieldBlock.test(source), 'Combat balance declarations must remain identifiable.');

function numericFields(block) {
  return Object.fromEntries([...block.matchAll(/(\w+):\s*([\d.]+)/g)].map(([, key, value]) => [key, Number(value)]));
}
const currentDifficulty = Object.fromEntries(
  [...source.match(difficultyBlock)[0].matchAll(/(\w+):\s*\{([^}]+)\}/g)]
    .map(([, name, fields]) => [name, numericFields(fields)]),
);
const CURRENT_PARAMETERS = {
  shieldRecharge: numericFields(source.match(shieldBlock)[0]),
  difficulty: currentDifficulty,
};
assert.equal(Object.keys(currentDifficulty).length, 4, 'Unexpected difficulty declaration.');
assert.equal(Object.keys(CURRENT_PARAMETERS.shieldRecharge).length, 4, 'Unexpected shield recharge declaration.');

async function previousCombat() {
  // This is a parameter comparison, not a historical source-code snapshot.
  // focusChance: 0 reproduces the former uniformly random target selection.
  const restored = source
    .replace(difficultyBlock, 'const DIFFICULTY = ' + JSON.stringify(PREVIOUS_PARAMETERS.difficulty) + ';')
    .replace(shieldBlock, 'const SHIELD_RECHARGE = ' + JSON.stringify(PREVIOUS_PARAMETERS.shieldRecharge) + ';');
  return import('data:text/javascript;base64,' + Buffer.from(restored).toString('base64'));
}

function prepareSquadAndEquipment(state) {
  // Navigation is represented directly; all destinations are still gate-checked.
  assert.ok(unlockedZones(state).includes('normandy'));
  state.zone = 'normandy';
  state.position = null;
  if (state.flags.spectre) {
    const squad = state.recruited.includes('liara') && !['adept', 'vanguard'].includes(state.classId)
      ? ['garrus', 'liara'] : ['garrus', 'tali'];
    assert.ok(setSquad(state, squad));
  }
  // Purchases use only the current credit balance. Failed unaffordable purchases
  // are allowed; no resources, upgrade counts or purchase results are overwritten.
  for (let level = 1; level <= 5; level += 1) {
    for (const id of state.party) {
      for (const [item, stat] of [['rifle', 'attack'], ['shield', 'shield'], ['armor', 'defense']]) {
        if ((state.upgrades[id]?.[stat + 'Count'] || 0) < level) buyUpgrade(state, id, item);
      }
    }
  }
}

function chooseAction(engine, battle, actor) {
  const actions = engine.getActions(battle, actor.id).filter(action => action.available);
  if (!actions.length) return null;
  const can = id => actions.some(action => action.id === id);
  const allies = battle.actors.filter(candidate => candidate.team === 'party');
  let enemies = battle.actors.filter(candidate => candidate.team === 'enemy' && candidate.hp > 0 && !candidate.statuses.stasis);
  if (enemies.some(enemy => !enemy.statuses.hacked)) enemies = enemies.filter(enemy => !enemy.statuses.hacked);
  enemies.sort((left, right) => left.hp + left.shield - right.hp - right.shield);
  const target = enemies[0];

  if (can('unity')) return ['unity', actor.id];
  const hurt = allies.filter(ally => ally.hp > 0 && ally.hp / ally.maxHp < 0.65)
    .sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
  if (hurt && can('medigel')) return ['medigel', hurt.id];
  if (!target) return ['cover', actor.id];
  if (actor.shield < actor.maxShield * 0.2 && actor.hp < actor.maxHp * 0.8
      && enemies.some(enemy => enemy.atb > 40) && can('cover')) return ['cover', actor.id];
  if (can('signature')) return ['signature', target.id];
  if (can('shoot') && target.hp + target.shield < actor.attack * 0.85) return ['shoot', target.id];
  if (can('barrier') && actor.shield < actor.maxShield * 0.22) return ['barrier', actor.id];

  const shielded = enemies.find(enemy => enemy.shield > actor.attack * 1.1);
  if (can('overload') && shielded) return ['overload', shielded.id];
  const hackable = enemies.filter(enemy => enemy.synthetic && !enemy.hackImmune && !enemy.statuses.hacked)
    .sort((left, right) => right.attack - left.attack)[0];
  if (can('hack') && enemies.length > 1 && hackable) return ['hack', hackable.id];
  if (can('singularity') && enemies.filter(enemy => !enemy.statuses.singularity && !enemy.statuses.lift).length >= 3) {
    return ['singularity', target.id];
  }
  const airborne = enemies.find(enemy => enemy.statuses.lift || enemy.statuses.singularity);
  if (can('throw') && airborne) return ['throw', airborne.id];
  if (can('warp') && target.maxHp >= 160 && !target.statuses.warp) return ['warp', target.id];
  const readyThreat = enemies.find(enemy => enemy.atb >= 65 && !enemy.statuses.lift && !enemy.statuses.singularity && !enemy.statuses.stagger);
  if (can('lift') && readyThreat) return ['lift', readyThreat.id];
  const armed = enemies.find(enemy => !['strike', 'acid'].includes(enemy.primaryAction) && !enemy.statuses.sabotage && enemy.atb >= 55);
  if (can('sabotage') && armed) return ['sabotage', armed.id];
  if (can('throw')) return ['throw', target.id];
  if (can('overload') && target.synthetic) return ['overload', target.id];
  if (can('burst') && actor.heat <= 45) return ['burst', target.id];
  if (can('shoot')) return ['shoot', target.id];
  return ['cover', actor.id];
}

const round = (number, precision = 6) => Number(number.toFixed(precision));
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);

function runEncounter(engine, state, zone, id) {
  assert.ok(canStartEncounter(state, id).ok, 'Encounter must be unlocked: ' + id);
  const seed = state.cleared.length + 2183;
  const battle = engine.createBattle({
    party: state.party.map(id => actorFor(id, state)),
    enemies: enemiesFor(zone, encounterIndex(id), state),
    difficulty: state.difficulty,
    mode: 'wait',
    seed,
    medigel: state.medigel,
  });
  let minimumHealth = 1;
  let iterations = 0;
  while (!battle.winner && battle.elapsed < 300 && iterations++ < 20000) {
    for (const actor of battle.actors.filter(candidate => candidate.team === 'party')) {
      const action = chooseAction(engine, battle, actor);
      if (action) {
        const result = engine.performAction(battle, { actorId: actor.id, actionId: action[0], targetId: action[1] });
        assert.ok(result.ok, id + ' ' + action.join(' ') + ': ' + result.reason);
      }
      minimumHealth = Math.min(minimumHealth, actor.hp / actor.maxHp);
      if (battle.winner) break;
    }
    engine.tickBattle(battle, 0.1);
    for (const actor of battle.actors.filter(candidate => candidate.team === 'party')) {
      minimumHealth = Math.min(minimumHealth, actor.hp / actor.maxHp);
    }
  }
  const partyIds = new Set(battle.actors.filter(actor => actor.team === 'party').map(actor => actor.id));
  const actions = battle.events.filter(event => event.type === 'action' && partyIds.has(event.actorId));
  const actionCounts = {};
  for (const action of actions) actionCounts[action.actionId] = (actionCounts[action.actionId] || 0) + 1;
  return {
    battle,
    record: {
      id,
      seed,
      party: [...state.party],
      winner: battle.winner,
      seconds: round(battle.elapsed, 2),
      playerActions: actions.length,
      minHealthPercent: round(minimumHealth * 100),
      healthDamageObserved: minimumHealth < 1 - 1e-8,
      partyKO: battle.events.filter(event => event.type === 'defeat' && partyIds.has(event.targetId)).length,
      actions: actionCounts,
      medigelUsed: state.medigel - battle.medigel,
      healthRestored: round(battle.events.filter(event => event.type === 'heal').reduce((total, event) => total + event.amount, 0)),
      endedByTimeout: !battle.winner,
    },
  };
}

function runCampaign(engine, difficulty, classId) {
  const state = newGame({ classId, difficulty, mode: 'wait' });
  // Represents completing the initial briefing, the normal UI unlock action.
  state.flags.briefed = true;
  prepareSquadAndEquipment(state);
  const encounters = [];
  let failed = false;
  let validatedSaves = 0;
  function validateSave() {
    assert.ok(decodeSave(encodeSave(state)), 'Campaign state must remain importable.');
    validatedSaves += 1;
  }
  for (const zone of ROUTE) {
    assert.ok(unlockedZones(state).includes(zone), 'Destination must be unlocked: ' + zone);
    state.zone = zone;
    if (zone === 'citadel') {
      for (const id of ['garrus', 'tali', 'wrex']) assert.ok(recruit(state, id));
    }
    for (const id of zoneEncounters(zone)) {
      const { battle, record } = runEncounter(engine, state, zone, id);
      encounters.push(record);
      if (battle.winner !== 'party') {
        failed = true;
        break;
      }
      state.medigel = battle.medigel;
      assert.ok(winEncounter(state, id), 'Victory progression must accept the actual encounter.');
      validateSave();
    }
    if (failed) break;
    assert.ok(completeZone(state, zone, DECISIONS[zone]), 'Objective and explicit choice must be valid.');
    validateSave();
    prepareSquadAndEquipment(state);
  }
  const times = encounters.map(encounter => encounter.seconds).sort((left, right) => left - right);
  return {
    difficulty,
    classId,
    won: encounters.filter(encounter => encounter.winner === 'party').length,
    encounterCount: encounters.length,
    endingReached: state.ending,
    partyKO: sum(encounters, 'partyKO'),
    minHealthPercent: Math.min(...encounters.map(encounter => encounter.minHealthPercent)),
    medigelUsed: sum(encounters, 'medigelUsed'),
    coverUsed: encounters.reduce((total, encounter) => total + (encounter.actions.cover || 0), 0),
    healthRestored: round(sum(encounters, 'healthRestored')),
    encountersWithHealthDamage: encounters.filter(encounter => encounter.healthDamageObserved).length,
    totalSeconds: round(sum(encounters, 'seconds'), 2),
    medianSeconds: times[Math.floor(times.length / 2)],
    maxSeconds: Math.max(...times),
    validatedSaves,
    failedAt: failed ? encounters.at(-1).id : null,
    finalCredits: state.credits,
    finalMedigel: state.medigel,
    encounters,
  };
}

function aggregate(campaigns) {
  return {
    campaigns: campaigns.length,
    completedCampaigns: campaigns.filter(campaign => campaign.endingReached).length,
    encounters: sum(campaigns, 'encounterCount'),
    victories: sum(campaigns, 'won'),
    defeatsOrTimeouts: campaigns.reduce((total, campaign) => total + campaign.encounterCount - campaign.won, 0),
    partyKO: sum(campaigns, 'partyKO'),
    encountersWithHealthDamage: sum(campaigns, 'encountersWithHealthDamage'),
    medigelUsed: sum(campaigns, 'medigelUsed'),
    coverUsed: sum(campaigns, 'coverUsed'),
    healthRestored: round(sum(campaigns, 'healthRestored')),
    minHealthPercent: Math.min(...campaigns.map(campaign => campaign.minHealthPercent)),
    totalSeconds: round(sum(campaigns, 'totalSeconds'), 2),
    validatedSaves: sum(campaigns, 'validatedSaves'),
  };
}

function parseOptions() {
  const options = { output: null, baseline: false, difficulties: DIFFICULTIES };
  const argumentsList = process.argv.slice(2);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--baseline') options.baseline = true;
    else if (argument === '--output') {
      options.output = argumentsList[++index];
      assert.ok(options.output && !options.output.startsWith('--'), '--output needs a file path.');
    } else if (argument === '--difficulty') {
      const difficulty = argumentsList[++index];
      assert.ok(DIFFICULTIES.includes(difficulty), '--difficulty must be story, normal or hard.');
      options.difficulties = [difficulty];
    } else throw new Error('Unknown argument: ' + argument);
  }
  return options;
}

const options = parseOptions();
const engine = options.baseline ? await previousCombat() : currentCombat;
const selectedDifficulties = options.baseline ? ['normal'] : options.difficulties;
const campaigns = selectedDifficulties.flatMap(difficulty => Object.keys(CLASSES).map(classId => runCampaign(engine, difficulty, classId)));
const includeBaseline = !options.baseline && selectedDifficulties.length === DIFFICULTIES.length;
const baselineEngine = includeBaseline ? await previousCombat() : null;
const baselineCampaigns = baselineEngine
  ? Object.keys(CLASSES).map(classId => runCampaign(baselineEngine, 'normal', classId))
  : [];
const sha256 = path => createHash('sha256').update(readFileSync(new URL(path, import.meta.url))).digest('hex');
const report = {
  schemaVersion: 1,
  variant: options.baseline ? 'previous-balance-normal' : 'current-balance',
  sourceHashes: {
    'src/combat.js': sha256('../src/combat.js'),
    'src/game-data.js': sha256('../src/game-data.js'),
    'src/state.js': sha256('../src/state.js'),
    'scripts/simulate-campaign.mjs': sha256('./simulate-campaign.mjs'),
  },
  parameters: { before: PREVIOUS_PARAMETERS, after: CURRENT_PARAMETERS },
  protocol: {
    classes: Object.keys(CLASSES),
    difficulties: selectedDifficulties,
    mode: 'wait',
    route: ROUTE,
    decisions: DECISIONS,
    encountersPerCampaign: EXPECTED_ENCOUNTERS,
    firstEncounterSeed: 2183,
    seedRule: '2183 + number of previously won encounters, matching the game UI',
    simulatedStepSeconds: 0.1,
    timeoutSeconds: 300,
    healBelowHealthFraction: 0.65,
    coverBelowShieldFraction: 0.2,
    coverBelowHealthFraction: 0.8,
    coverWhenEnemyAtbAbove: 40,
    purchases: 'Only earned credits; rifle, shield and armor, in that order, up to five levels; no optional caches or medigel purchases.',
    squad: 'Starting story squad; Garrus and Tali after Citadel; Garrus and Liara after Therum except Adept and Vanguard.',
    healthBetweenEncounters: 'actorFor restores full health and shields at each encounter, matching current game behavior; medigel persists.',
    progression: 'Unlocks, ordered encounter gates, recruitment, explicit choices and save/import round trips are checked.',
    baseline: 'Previous balance parameters restored in memory; all other current engine logic and player policy remain identical.',
    limits: [
      'One deterministic seed sequence and one campaign route per class.',
      'Instant automated decisions in Wait mode; not a human usability or Active mode test.',
      'Systematic upgrades and trained-power usage; casual play can be harder.',
      'This is a regression and calibration report, not final human playtest balancing.',
    ],
  },
  summary: aggregate(campaigns),
  byDifficulty: Object.fromEntries(selectedDifficulties.map(difficulty => [difficulty, aggregate(campaigns.filter(campaign => campaign.difficulty === difficulty))])),
  campaigns,
  baselineNormal: baselineCampaigns.length ? { summary: aggregate(baselineCampaigns), campaigns: baselineCampaigns } : null,
};
if (options.output) {
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({
  variant: report.variant,
  summary: report.summary,
  byDifficulty: report.byDifficulty,
  baselineNormal: report.baselineNormal?.summary || null,
  reportFile: options.output,
}, null, 2));
const failures = [...campaigns, ...baselineCampaigns].filter(campaign => !campaign.endingReached || campaign.won !== EXPECTED_ENCOUNTERS);
if (failures.length) {
  console.error('Campaign verification failed: ' + failures.map(campaign => campaign.difficulty + '/' + campaign.classId + ' at ' + campaign.failedAt).join(', '));
  process.exitCode = 1;
}

// ME1 encounter adaptations. These plans distribute existing health/shield
// budgets; they do not certify the original encounter counts or geometry.
// Combat owns normalization, actor insertion, event emission and the winner.
const EPSILON = 1e-8;
const clone = value => structuredClone(value);
const alive = actor => Number.isFinite(actor?.hp) && actor.hp > EPSILON;
const profiles = new Set(['benezia', 'thorian']);
const forbiddenContext = actor => actor?.mediaId !== undefined && actor.mediaId !== 'ME1'
  || actor?.periodId !== undefined && actor.periodId !== 'me1';
const stateFor = battle => profiles.has(battle?.bossPhases?.profileId) ? battle.bossPhases : null;
const event = (state, message) => ({ type: 'bossPhase', profileId: state.profileId,
  actorId: state.bossId, phaseIndex: state.phaseIndex, phaseCount: state.phaseCount, message });
const retireable = actor => ['node', 'reinforcement'].includes(actor?.bossPhaseRole);

function uniqueNativeId(sprite, allocated) {
  let serial = 0;
  while (allocated.has(`${sprite}-${serial}`)) serial++;
  const id = `${sprite}-${serial}`; allocated.add(id); return id;
}

function distributedActor(template, id, count, extra = {}) {
  return { ...clone(template), id, hp: template.hp / count, maxHp: template.maxHp / count,
    shield: template.shield / count, maxShield: template.maxShield / count,
    atb: 0, heat: 0, overheated: false, focus: 0, cover: false, channel: null,
    cooldowns: {}, statuses: {}, ...extra };
}

function reinforcement(state, index) {
  return distributedActor(state.supportTemplate, state.reinforcementIds[index], 3, {
    name: state.profileId === 'benezia' ? `Commando asari — vague ${index + 1}/3` : `Rampant — renfort ${index + 1}/3`,
    bossPhaseRole: 'reinforcement', bossPhaseOwner: state.bossId, bossPhaseIndex: index,
  });
}

function neuralNode(state, index) {
  return distributedActor(state.bossTemplate, state.nodeIds[index], 6, {
    name: `Nœud neural ${index + 1}/6`, bossPhaseRole: 'node', bossPhaseOwner: state.bossId,
    bossPhaseIndex: index, tacticalAnchorId: state.bossId,
    // The node is an objective, not a shooter. The combat hook also prevents
    // autonomous orders; no acid/gun action is inferred from its old body art.
    powers: [], attack: 1, bossPassive: true,
  });
}

/**
 * Input is the freshly normalized actor array, including teams. No input is
 * changed. An explicit flag and the exact two-body ME1 encounter are required.
 * The combat owner normalizes the returned initial actors once more.
 */
export function createBossPhasePlan(actors, { enabled = false } = {}) {
  if (enabled !== true || !Array.isArray(actors) || actors.some(forbiddenContext)) return null;
  const enemies = actors.filter(actor => actor?.team === 'enemy');
  const boss = enemies.find(actor => actor.boss === true && profiles.has(actor.sprite));
  if (!boss || enemies.length !== 2 || !alive(boss)) return null;
  const supportKind = boss.sprite === 'benezia' ? 'asari' : 'creeper';
  const support = enemies.find(actor => actor !== boss && actor.sprite === supportKind && alive(actor));
  if (!support || actors.some(actor => typeof actor?.id !== 'string' || !actor.id)
    || new Set(actors.map(actor => actor.id)).size !== actors.length) return null;
  if ([boss, support].some(actor => !Number.isFinite(actor.maxHp) || actor.maxHp <= 0
    || !Number.isFinite(actor.shield) || actor.shield < 0 || !Number.isFinite(actor.maxShield) || actor.maxShield < 0)) return null;
  const allocated = new Set(actors.map(actor => actor.id));
  const state = { version: 1, profileId: boss.sprite, bossId: boss.id, phaseIndex: 0,
    phaseCount: boss.sprite === 'benezia' ? 4 : 6,
    bossTemplate: clone(boss), supportTemplate: clone(support),
    reinforcementIds: [support.id, uniqueNativeId(support.sprite, allocated), uniqueNativeId(support.sprite, allocated)],
    nodeIds: boss.sprite === 'thorian' ? [boss.id, ...Array.from({ length: 5 }, () => uniqueNativeId(boss.sprite, allocated))] : [],
  };
  const changed = actors.filter(actor => actor !== boss && actor !== support).map(clone);
  changed.push(boss.sprite === 'benezia' ? { ...clone(boss), bossPhaseRole: 'commander', bossPhaseOwner: boss.id } : neuralNode(state, 0));
  changed.push(reinforcement(state, 0));
  return { actors: changed, state, retireIds: [], events: [event(state,
    boss.sprite === 'benezia' ? 'Bénézia est protégée. Neutralisez les renforts asari.' : 'Le Thorien : détruisez les six nœuds neuraux et les rampants.')] };
}

/** Protected bosses reject hostile targeting before ATB, heat, costs or RNG. */
export function getBossTargetReason(battle, target) {
  const state = stateFor(battle);
  return state?.profileId === 'benezia' && state.phaseIndex < 3 && target?.id === state.bossId
    ? 'Bénézia est protégée : neutralisez la vague de commandos asari.' : null;
}

/** Damage-over-time, area effects and autonomous attacks use the same guard. */
export const bossDamageBlocked = (battle, target) => getBossTargetReason(battle, target) !== null;

/** Nodes never take autonomous actions; all other actors retain their kits. */
export function bossActorCanAct(battle, actor) {
  return !(stateFor(battle)?.profileId === 'thorian' && actor?.bossPhaseOwner === battle.bossPhases.bossId && actor?.bossPhaseRole === 'node');
}

/**
 * A pure transition plan. Apply its state, normalize/insert its raw spawns,
 * mark retireIds for presentation, then check the winner. Call from the common
 * winner check so direct damage, DoT, projectiles and summons share this rule.
 */
export function advanceBossPhases(battle) {
  const current = stateFor(battle);
  if (!current || battle.winner || !Array.isArray(battle.actors)
    || !battle.actors.some(actor => actor.team === 'party' && alive(actor))) return null;
  const state = clone(current), spawns = [], events = [];
  const retireIds = battle.actors.filter(actor => retireable(actor) && actor.bossPhaseOwner === state.bossId
    && !alive(actor) && actor.bossPhaseRetired !== true
    && !(state.profileId === 'thorian' && actor.id === state.nodeIds[5])).map(actor => actor.id);
  if (state.profileId === 'benezia' && Number.isInteger(state.phaseIndex) && state.phaseIndex >= 0 && state.phaseIndex < 3) {
    const wave = battle.actors.find(actor => actor.id === state.reinforcementIds[state.phaseIndex]);
    if (wave && !alive(wave)) {
      state.phaseIndex++;
      if (state.phaseIndex < 3) {
        spawns.push(reinforcement(state, state.phaseIndex));
        events.push(event(state, `Nouvelle vague de commandos asari (${state.phaseIndex + 1}/3).`));
      } else events.push(event(state, 'Les renforts sont neutralisés. Bénézia est désormais vulnérable.'));
    }
  }
  if (state.profileId === 'thorian' && Number.isInteger(state.phaseIndex) && state.phaseIndex >= 0 && state.phaseIndex < 6) {
    const node = battle.actors.find(actor => actor.id === state.nodeIds[state.phaseIndex]);
    if (node && !alive(node)) {
      state.phaseIndex++;
      if (state.phaseIndex < 6) {
        spawns.push(neuralNode(state, state.phaseIndex));
        if (state.phaseIndex % 2 === 0) spawns.push(reinforcement(state, state.phaseIndex / 2));
        events.push(event(state, `Nœud neural détruit. Atteignez le nœud ${state.phaseIndex + 1}/6.`));
      } else events.push(event(state, 'Les six nœuds sont détruits. Éliminez les rampants encore actifs.'));
    }
  }
  return state.phaseIndex !== current.phaseIndex || retireIds.length ? { state, spawns, retireIds, events } : null;
}

/** Read-only presentation; never marks a victory or changes the battle. */
export function getBossPhaseView(battle) {
  const state = stateFor(battle);
  if (!state) return null;
  if (state.profileId === 'benezia') {
    const protectedBoss = state.phaseIndex < 3;
    return { profileId: state.profileId, phaseIndex: state.phaseIndex, phaseCount: 4,
      label: protectedBoss ? `Bénézia — renforts ${state.phaseIndex + 1}/3` : 'Bénézia — confrontation directe',
      instruction: protectedBoss ? 'Bénézia est protégée. Neutralisez les commandos asari.' : 'La protection est levée. Concentrez vos attaques sur Bénézia.',
      protectedActorId: protectedBoss ? state.bossId : null,
      objectiveActorId: protectedBoss ? state.reinforcementIds[state.phaseIndex] : state.bossId };
  }
  return { profileId: state.profileId, phaseIndex: state.phaseIndex, phaseCount: 6,
    label: state.phaseIndex < 6 ? `Thorien — nœud neural ${state.phaseIndex + 1}/6` : 'Thorien — nœuds neutralisés',
    instruction: state.phaseIndex < 6 ? 'Détruisez le nœud neural actif. Les rampants restent une menace.' : 'Éliminez les rampants encore actifs pour sécuriser le repaire.',
    protectedActorId: null, objectiveActorId: state.phaseIndex < 6 ? state.nodeIds[state.phaseIndex] : null };
}

export const BOSS_PHASE_LIMITATIONS = Object.freeze([
  'Phases ATB de prototype : counts, health distribution, timings and local staging are adaptation values.',
  'Six neural targets reuse the existing Thorian body; no original multi-floor lair or individual node artwork is delivered.',
  'The original Benezia conversation/intermission, complete reinforcement roster and original power bar remain open.',
  'Saren, Virmire and the final synthetic shell retain their existing mechanics; no unsupported phase or persuasion threshold is added.',
]);

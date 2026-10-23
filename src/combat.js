/**
 * Deterministic ATB combat simulation. All numbers are adaptation/balance values.
 * No DOM, renderer, clock or platform state is read by this module.
 *
 * speed is a multiplier: 1 fills an ATB gauge in five simulated seconds.
 * Cooldowns and timed statuses use simulated seconds. In wait mode a ready,
 * actionable party member freezes the entire simulation until an order is given.
 */

export const ACTIONS = Object.freeze({
  shoot: { label: 'Tir contrôlé', description: 'Un tir précis. Génère 24 points de chaleur.', target: 'enemy', heatCost: 24 },
  burst: { label: 'Rafale', description: 'Plus de dégâts, mais 48 points de chaleur.', target: 'enemy', heatCost: 48 },
  strike: { label: 'Assaut organique', description: 'Une attaque rapprochée qui contourne la couverture. Ne génère aucune chaleur d’arme.', target: 'enemy' },
  acid: { label: 'Projection acide', description: 'Une attaque organique suivie de corrosion. Ne mobilise aucun pouvoir biotique.', target: 'enemy' },
  cover: { label: 'Couverture', description: 'Réduit les tirs jusqu’à la prochaine action, accélère la recharge des boucliers et laisse refroidir l’arme.', target: 'self' },
  reposition: { label: 'Contournement', description: 'Le prochain tir ignore la couverture adverse pendant huit secondes.', target: 'self' },
  medigel: { label: 'Médi-gel', description: 'Soigne un allié conscient. Consomme une dose partagée.', target: 'ally' },
  overload: { label: 'Surcharge', description: 'Attaque les boucliers ; peut aussi endommager les synthétiques.', target: 'enemy', cooldown: 8 },
  sabotage: { label: 'Sabotage', description: 'Neutralise les armes adverses pendant six secondes.', target: 'enemy', cooldown: 10 },
  lift: { label: 'Lévitation', description: 'Soulève et neutralise la cible pendant quatre secondes.', target: 'enemy', cooldown: 10 },
  throw: { label: 'Projection', description: 'Projette la cible. Plus efficace contre une cible soulevée.', target: 'enemy', cooldown: 7 },
  warp: { label: 'Déchirure', description: 'Inflige des dégâts et affaiblit l’armure pendant six secondes.', target: 'enemy', cooldown: 11 },
  singularity: { label: 'Singularité', description: 'Désorganise et soulève les adversaires proches pendant trois secondes.', target: 'enemies', cooldown: 16 },
  barrier: { label: 'Barrière', description: 'Restaure une partie des boucliers et ajoute une protection temporaire.', target: 'self', cooldown: 13 },
  stasis: { label: 'Stase', description: 'Immobilise six secondes. La cible est aussi protégée de tous les dégâts.', target: 'enemy', cooldown: 16 },
  hack: { label: 'Piratage d’IA', description: 'Un synthétique attaque temporairement son propre camp.', target: 'enemy', cooldown: 15, syntheticOnly: true },
  unity: { label: 'Unité', description: 'Talent Spectre : remet les équipiers hors combat en état de combattre.', target: 'allies', cooldown: 24 },
  signature: { label: 'Technique d’élite', description: 'Une exécution précise avec l’arsenal du personnage. Nécessite 100 de concentration.', target: 'enemy', heatCost: 42 },
});

const BASE_ACTIONS = ['shoot', 'burst', 'cover', 'reposition'];
const PRIMARY_ACTIONS = new Set(['shoot', 'burst', 'strike', 'acid', 'cover', 'reposition']);
const WEAPON_ACTIONS = new Set(['shoot', 'burst', 'signature']);
const DISABLING_STATUSES = ['stasis', 'lift', 'singularity', 'stagger'];
const DIFFICULTY = {
  story: { enemyDamage: 0.65, enemySpeed: 0.8, focusChance: 0.2 },
  easy: { enemyDamage: 0.8, enemySpeed: 0.9, focusChance: 0.4 },
  normal: { enemyDamage: 1.85, enemySpeed: 1.2, focusChance: 0.8 },
  hard: { enemyDamage: 2.25, enemySpeed: 1.35, focusChance: 0.9 },
};
const EPSILON = 1e-8;
// Exposed recovery is deliberately slow; spending an ATB action on cover is
// the practical way to rebuild shields while the rest of the squad acts.
const SHIELD_RECHARGE = { exposedDelay: 7, exposedRate: 1, coverDelay: 2, coverRate: 8 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const living = actor => actor.hp > EPSILON;
const synthetic = actor => actor.synthetic === true || actor.type === 'synthetic';
const armed = actor => !['strike', 'acid'].includes(actor.primaryAction);
const disabled = actor => DISABLING_STATUSES.some(key => actor.statuses[key] > EPSILON);
const ready = actor => living(actor) && !disabled(actor) && actor.atb >= 100 - EPSILON;

function makeRandom(seed) {
  let state = (finite(seed, 1) >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function random(battle) {
  return clamp(finite(battle._rng(), 0.5), 0, 1 - Number.EPSILON);
}

function emit(battle, event) {
  const entry = { id: battle.events.length, at: battle.elapsed, ...event };
  battle.events.push(entry);
  if (event.message) {
    battle.log.push(event.message);
    if (battle.log.length > 100) battle.log.shift();
  }
  return entry;
}

function normalizeActor(input, team, index) {
  const maxHp = Math.max(1, finite(input.maxHp, finite(input.hp, 100)));
  const maxShield = Math.max(0, finite(input.maxShield, finite(input.shield, 40)));
  return {
    ...input,
    id: String(input.id ?? `${team}-${index}`),
    name: String(input.name ?? (team === 'party' ? 'Commando' : 'Adversaire')),
    team,
    hp: clamp(finite(input.hp, maxHp), 0, maxHp),
    maxHp,
    shield: clamp(finite(input.shield, maxShield), 0, maxShield),
    maxShield,
    attack: Math.max(1, finite(input.attack, team === 'party' ? 22 : 17)),
    defense: Math.max(0, finite(input.defense, 3)),
    speed: clamp(finite(input.speed, 1), 0.1, 5),
    powers: [...new Set(Array.isArray(input.powers) ? input.powers : [])].filter(id => ACTIONS[id]),
    atb: clamp(finite(input.atb, 0), 0, 100),
    heat: clamp(finite(input.heat, 0), 0, 100),
    focus: clamp(finite(input.focus, 0), 0, 100),
    overheated: Boolean(input.overheated) || input.heat >= 100,
    cover: Boolean(input.cover),
    cooldowns: { ...input.cooldowns },
    statuses: { ...input.statuses },
    controlResistance: clamp(finite(input.controlResistance, 0), 0, 1),
    weaponHeatMultiplier: clamp(finite(input.weaponHeatMultiplier, 1), .25, 3),
    weaponCoolingBonus: clamp(finite(input.weaponCoolingBonus, 0), 0, 20),
    organicDamageBonus: clamp(finite(input.organicDamageBonus, 0), 0, 1),
    syntheticDamageBonus: clamp(finite(input.syntheticDamageBonus, 0), 0, 1),
    shieldBypass: clamp(finite(input.shieldBypass, 0), 0, .75),
    primaryAction: ['strike', 'acid'].includes(input.primaryAction) ? input.primaryAction : 'shoot',
    lastDamagedAt: -Infinity,
    _warpSource: null,
    _acidSource: null,
  };
}

/** Creates a fresh battle without changing the supplied actor definitions. */
export function createBattle({ party, enemies, difficulty = 'normal', mode = 'wait', seed = 1, rng, medigel = 3 } = {}) {
  if (!Array.isArray(party) || !party.length || !Array.isArray(enemies) || !enemies.length) {
    throw new TypeError('Un combat nécessite au moins un allié et un adversaire.');
  }
  const actors = [
    ...party.map((actor, index) => normalizeActor(actor, 'party', index)),
    ...enemies.map((actor, index) => normalizeActor(actor, 'enemy', index)),
  ];
  if (new Set(actors.map(actor => actor.id)).size !== actors.length) {
    throw new TypeError('Chaque combattant doit avoir un identifiant unique.');
  }
  const battle = {
    actors,
    difficulty: DIFFICULTY[difficulty] ? difficulty : 'normal',
    mode: mode === 'active' ? 'active' : 'wait',
    seed,
    medigel: Math.max(0, Math.floor(finite(medigel, 3))),
    log: [],
    events: [],
    winner: null,
    elapsed: 0,
    waiting: false,
    actionCount: 0,
    _rng: typeof rng === 'function' ? rng : makeRandom(seed),
  };
  emit(battle, { type: 'start', message: 'Contact hostile. Le commando attend vos ordres.' });
  updateWinner(battle);
  battle.waiting = battle.mode === 'wait' && actors.some(actor => actor.team === 'party' && ready(actor));
  return battle;
}

function updateWinner(battle) {
  if (battle.winner) return battle.winner;
  const partyAlive = battle.actors.some(actor => actor.team === 'party' && living(actor));
  const enemyAlive = battle.actors.some(actor => actor.team === 'enemy' && living(actor));
  if (!partyAlive || !enemyAlive) {
    battle.winner = partyAlive ? 'party' : 'enemy';
    battle.waiting = false;
    emit(battle, {
      type: 'victory', winner: battle.winner,
      message: battle.winner === 'party' ? 'Zone sécurisée. Victoire du commando.' : 'Le commando est hors combat.',
    });
  }
  return battle.winner;
}

function opponents(battle, actor) {
  const hacked = actor.statuses.hacked > EPSILON;
  return battle.actors.filter(target => target.id !== actor.id && living(target)
    && (hacked ? target.team === actor.team : target.team !== actor.team));
}

function friends(battle, actor) {
  return battle.actors.filter(target => target.team === actor.team);
}

function actionIds(actor) {
  const organic = actor.primaryAction === 'strike' || actor.primaryAction === 'acid';
  const ids = organic ? [actor.primaryAction, 'cover', 'reposition'] : [...BASE_ACTIONS];
  if (actor.team === 'party') ids.push('medigel');
  ids.push(...actor.powers.filter(id => !BASE_ACTIONS.includes(id) && id !== 'medigel' && id !== 'signature'));
  if (actor.team === 'party' && !organic) ids.push('signature');
  return [...new Set(ids)];
}

function unavailableReason(battle, actor, actionId) {
  const action = ACTIONS[actionId];
  if (battle.winner) return 'Le combat est terminé.';
  if (!living(actor)) return 'Ce personnage est hors combat.';
  if (disabled(actor)) return actor.statuses.stasis > 0 ? 'Ce personnage est en stase.' : 'Ce personnage est immobilisé.';
  if (actor.atb < 100 - EPSILON) return 'La jauge ATB doit être pleine.';
  if (actor.cooldowns[actionId] > EPSILON) return `Recharge : ${Math.ceil(actor.cooldowns[actionId])} s.`;
  if (WEAPON_ACTIONS.has(actionId)) {
    if (actor.statuses.sabotage > EPSILON) return 'L’arme est neutralisée par Sabotage.';
    if (actor.overheated) return 'Arme en surchauffe : attendre le refroidissement.';
  }
  if (actionId === 'signature' && actor.focus < 100 - EPSILON) return 'Concentration insuffisante (100 requis).';
  if (actionId === 'medigel') {
    if (battle.medigel < 1) return 'Plus de médi-gel.';
    if (!friends(battle, actor).some(target => living(target) && target.hp < target.maxHp - EPSILON)) return 'Aucun allié conscient à soigner.';
  }
  if (actionId === 'unity' && !friends(battle, actor).some(target => !living(target))) return 'Aucun équipier hors combat.';
  if (actionId === 'sabotage' && !opponents(battle, actor).some(armed)) return 'Aucune arme adverse à saboter.';
  if (action.syntheticOnly && !opponents(battle, actor).some(target => synthetic(target) && !target.hackImmune)) return 'Aucune cible synthétique piratable.';
  if ((action.target === 'enemy' || action.target === 'enemies') && !opponents(battle, actor).length) return 'Aucune cible valide.';
  return null;
}

/** UI-ready action metadata. Untrained powers are omitted, unavailable actions carry a reason. */
export function getActions(battle, actorId) {
  const actor = battle.actors.find(candidate => candidate.id === actorId);
  if (!actor) return [];
  return actionIds(actor).map(id => {
    const reason = unavailableReason(battle, actor, id);
    const heatCost = WEAPON_ACTIONS.has(id) ? ACTIONS[id].heatCost * actor.weaponHeatMultiplier : undefined;
    const description = heatCost === undefined ? ACTIONS[id].description
      : ACTIONS[id].description.replace(/(?:24|48|42) points de chaleur/, `${Math.round(heatCost * 10) / 10} points de chaleur`);
    return { id, ...ACTIONS[id], ...(heatCost === undefined ? {} : { heatCost }), description, available: !reason, reason, cooldownRemaining: actor.cooldowns[id] || 0 };
  });
}

function applyDamage(battle, source, target, rawAmount, { ignoreCover = false, ignoreArmor = false, shieldOnly = false, silent = false, actionId = null } = {}) {
  if (!living(target) || rawAmount <= 0) return 0;
  if (target.statuses.stasis > EPSILON) {
    if (!silent) emit(battle, { type: 'blocked', actorId: source?.id, targetId: target.id, actionId, amount: 0, message: `${target.name} est protégé par la stase.` });
    return 0;
  }
  let amount = rawAmount * (source?.team === 'enemy' ? DIFFICULTY[battle.difficulty].enemyDamage : 1);
  if (target.cover && !ignoreCover) amount *= 0.5;
  if (target.statuses.barrier > EPSILON) amount *= 0.7;
  // Ammunition bypass splits one hit between shield and health; damage is
  // never duplicated and armor is applied once to the health portion.
  const bypass = WEAPON_ACTIONS.has(actionId) && !shieldOnly ? source?.shieldBypass || 0 : 0;
  const shieldDamage = Math.min(target.shield, amount * (1 - bypass));
  target.shield = Math.max(0, target.shield - shieldDamage);
  const armor = ignoreArmor ? 0 : target.defense * (target.statuses.warp > EPSILON ? 0.5 : 1);
  const remaining = Math.max(0, amount - shieldDamage);
  // A small simulation slice must not turn a fractional damage-over-time tick
  // into a whole hit point. The one-point armor floor applies only to hits >= 1.
  const healthDamage = shieldOnly || remaining <= 0 ? 0 : Math.min(target.hp, Math.max(Math.min(1, remaining), remaining - armor));
  target.hp = Math.max(0, target.hp - healthDamage);
  const total = shieldDamage + healthDamage;
  if (total > EPSILON) {
    target.lastDamagedAt = battle.elapsed;
    target.focus = clamp(target.focus + total * 0.12, 0, 100);
    if (source && source.id !== target.id) source.focus = clamp(source.focus + total * 0.35, 0, 100);
    if (!silent) emit(battle, {
      type: 'damage', actorId: source?.id, targetId: target.id, actionId,
      amount: total, shieldDamage, healthDamage,
      message: `${target.name} subit ${Math.round(total)} dégâts${shieldDamage > 0 ? ` (${Math.round(shieldDamage)} sur les boucliers)` : ''}.`,
    });
  }
  if (!living(target)) {
    target.hp = 0;
    target.atb = 0;
    target.cover = false;
    target.statuses = {};
    emit(battle, { type: 'defeat', actorId: source?.id, targetId: target.id, message: `${target.name} est hors combat.` });
  }
  return total;
}

function applyControl(battle, source, target, status, duration) {
  if (!living(target) || target.statuses.stasis > EPSILON) return false;
  const actual = target.controlImmune ? 0 : duration * (1 - target.controlResistance);
  if (actual < 0.1) {
    emit(battle, { type: 'resist', actorId: source.id, targetId: target.id, status, message: `${target.name} résiste au contrôle.` });
    return false;
  }
  target.statuses[status] = Math.max(target.statuses[status] || 0, actual);
  if (status !== 'hacked' && status !== 'sabotage') target.cover = false;
  emit(battle, { type: 'status', actorId: source.id, targetId: target.id, status, duration: actual });
  return true;
}

function addHeat(battle, actor, amount) {
  actor.heat = clamp(actor.heat + amount, 0, 100);
  if (actor.heat >= 100 - EPSILON) {
    actor.overheated = true;
    emit(battle, { type: 'overheat', actorId: actor.id, message: `L’arme de ${actor.name} surchauffe.` });
  }
}

function resolveTargets(battle, actor, actionId, targetId) {
  const definition = ACTIONS[actionId];
  const target = targetId == null ? null : battle.actors.find(candidate => candidate.id === targetId);
  if (definition.target === 'self') {
    if (targetId != null && targetId !== actor.id) return { error: 'Cette action vise son utilisateur.' };
    return { targets: [actor] };
  }
  if (definition.target === 'allies') return { targets: friends(battle, actor) };
  if (definition.target === 'ally') {
    const ally = target ?? (targetId == null ? actor : null);
    if (!ally || ally.team !== actor.team || !living(ally)) return { error: 'Choisissez un allié conscient.' };
    if (ally.hp >= ally.maxHp - EPSILON) return { error: 'Cet allié est déjà en pleine santé.' };
    return { targets: [ally] };
  }
  const candidates = opponents(battle, actor);
  if (definition.target === 'enemies') {
    if (targetId != null && !candidates.some(candidate => candidate.id === targetId)) return { error: 'Cible adverse invalide.' };
    return { targets: candidates };
  }
  if (!target || !candidates.some(candidate => candidate.id === target.id)) return { error: 'Choisissez un adversaire vivant.' };
  if (definition.syntheticOnly && !synthetic(target)) return { error: 'Piratage d’IA exige une cible synthétique.' };
  if (definition.syntheticOnly && target.hackImmune) return { error: 'Les systèmes de cette cible résistent au piratage.' };
  if (actionId === 'sabotage' && !armed(target)) return { error: 'Cette créature n’utilise aucune arme à saboter.' };
  return { targets: [target] };
}

/** Validates first; a rejected order never spends ATB, inventory, heat or randomness. */
export function performAction(battle, { actorId, actionId, targetId } = {}) {
  const actor = battle.actors.find(candidate => candidate.id === actorId);
  if (!actor || !ACTIONS[actionId] || !actionIds(actor).includes(actionId)) return { ok: false, reason: 'Action inconnue ou non maîtrisée.', events: [] };
  const reason = unavailableReason(battle, actor, actionId);
  if (reason) return { ok: false, reason, events: [] };
  const resolution = resolveTargets(battle, actor, actionId, targetId);
  if (resolution.error) return { ok: false, reason: resolution.error, events: [] };
  const targets = resolution.targets;
  const target = targets[0];
  const startIndex = battle.events.length;
  const definition = ACTIONS[actionId];
  actor.atb = 0;
  if (actionId !== 'cover') actor.cover = false;
  if (definition.cooldown) actor.cooldowns[actionId] = definition.cooldown;
  battle.actionCount += 1;
  emit(battle, { type: 'action', actorId, actionId, targetId: target?.id, targetIds: targets.map(candidate => candidate.id), message: `${actor.name} : ${definition.label}.` });

  if (WEAPON_ACTIONS.has(actionId)) {
    const multiplier = actionId === 'burst' ? 1.65 : actionId === 'signature' ? 2.4 : 1;
    const speciesBonus = synthetic(target) ? actor.syntheticDamageBonus : actor.organicDamageBonus;
    const damage = actor.attack * multiplier * (1 + speciesBonus) * (0.94 + random(battle) * 0.12);
    applyDamage(battle, actor, target, damage, { actionId, ignoreCover: actor.statuses.flanking > EPSILON || actionId === 'signature' });
    delete actor.statuses.flanking;
    addHeat(battle, actor, definition.heatCost * actor.weaponHeatMultiplier);
    if (actionId === 'signature') actor.focus = 0;
  } else if (actionId === 'strike') {
    applyDamage(battle, actor, target, actor.attack * (0.94 + random(battle) * 0.12), { actionId, ignoreCover: true });
  } else if (actionId === 'acid') {
    applyDamage(battle, actor, target, 6 + actor.attack * 0.65, { actionId });
    if (living(target) && !(target.statuses.stasis > EPSILON)) {
      target.statuses.corrosion = 5;
      target._acidSource = actor.id;
      emit(battle, { type: 'status', actorId, targetId: target.id, status: 'corrosion', duration: 5 });
    }
  } else if (actionId === 'cover') {
    actor.cover = true;
    actor.focus = clamp(actor.focus + 6, 0, 100);
  } else if (actionId === 'reposition') {
    actor.statuses.flanking = 8;
    actor.focus = clamp(actor.focus + 5, 0, 100);
  } else if (actionId === 'medigel') {
    const amount = Math.min(target.maxHp - target.hp, 38 + target.maxHp * 0.22);
    target.hp += amount;
    battle.medigel -= 1;
    actor.focus = clamp(actor.focus + 10, 0, 100);
    emit(battle, { type: 'heal', actorId, targetId: target.id, amount, message: `${target.name} récupère ${Math.round(amount)} points de santé.` });
  } else if (actionId === 'unity') {
    for (const ally of targets.filter(candidate => !living(candidate))) {
      ally.hp = ally.maxHp * 0.3;
      ally.shield = ally.maxShield * 0.25;
      ally.atb = 0;
      ally.statuses = {};
      ally.lastDamagedAt = battle.elapsed;
      emit(battle, { type: 'revive', actorId, targetId: ally.id, amount: ally.hp, message: `${ally.name} reprend le combat.` });
    }
  } else if (actionId === 'overload') {
    applyDamage(battle, actor, target, 34 + actor.attack * 0.8, { actionId, ignoreCover: true, ignoreArmor: true, shieldOnly: !synthetic(target) });
  } else if (actionId === 'sabotage') {
    if (applyControl(battle, actor, target, 'sabotage', 6)) addHeat(battle, target, 35);
  } else if (actionId === 'lift') {
    applyControl(battle, actor, target, 'lift', 4);
  } else if (actionId === 'throw') {
    const airborne = target.statuses.lift > EPSILON || target.statuses.singularity > EPSILON;
    applyDamage(battle, actor, target, (14 + actor.attack * 0.8) * (airborne ? 1.4 : 1), { actionId, ignoreCover: true });
    if (applyControl(battle, actor, target, 'stagger', 1.2)) {
      delete target.statuses.lift;
      delete target.statuses.singularity;
    }
  } else if (actionId === 'warp') {
    applyDamage(battle, actor, target, 12 + actor.attack * 0.7, { actionId, ignoreCover: true });
    if (living(target) && !(target.statuses.stasis > EPSILON)) {
      target.statuses.warp = 6;
      target._warpSource = actor.id;
      emit(battle, { type: 'status', actorId, targetId: target.id, status: 'warp', duration: 6 });
    }
  } else if (actionId === 'singularity') {
    for (const enemy of targets) applyControl(battle, actor, enemy, 'singularity', 3);
  } else if (actionId === 'barrier') {
    const amount = Math.min(actor.maxShield - actor.shield, 26 + actor.maxShield * 0.55);
    actor.shield += amount;
    actor.statuses.barrier = 8;
    emit(battle, { type: 'shield', actorId, targetId: actorId, amount });
  } else if (actionId === 'stasis') {
    applyControl(battle, actor, target, 'stasis', 6);
  } else if (actionId === 'hack') {
    applyControl(battle, actor, target, 'hacked', 8);
  }
  updateWinner(battle);
  battle.waiting = !battle.winner && battle.mode === 'wait' && battle.actors.some(candidate => candidate.team === 'party' && ready(candidate));
  return { ok: true, reason: null, events: battle.events.slice(startIndex) };
}

function tickActor(battle, actor, dt) {
  if (!living(actor)) return;
  const stasisTime = Math.max(0, actor.statuses.stasis || 0);
  const warpTime = Math.max(0, actor.statuses.warp || 0);
  const acidTime = Math.max(0, actor.statuses.corrosion || 0);
  if (warpTime > EPSILON && stasisTime <= EPSILON) {
    const source = battle.actors.find(candidate => candidate.id === actor._warpSource);
    applyDamage(battle, source, actor, 4 * Math.min(dt, warpTime), { actionId: 'warp', ignoreCover: true, ignoreArmor: true, silent: true });
  }
  if (living(actor) && acidTime > EPSILON && stasisTime <= EPSILON) {
    const source = battle.actors.find(candidate => candidate.id === actor._acidSource);
    applyDamage(battle, source, actor, 3 * Math.min(dt, acidTime), { actionId: 'acid', ignoreCover: true, ignoreArmor: true, silent: true });
  }
  if (!living(actor)) return;
  for (const key of Object.keys(actor.cooldowns)) {
    actor.cooldowns[key] = Math.max(0, finite(actor.cooldowns[key], 0) - dt);
    if (actor.cooldowns[key] <= EPSILON) delete actor.cooldowns[key];
  }
  for (const key of Object.keys(actor.statuses)) {
    actor.statuses[key] = Math.max(0, finite(actor.statuses[key], 0) - dt);
    if (actor.statuses[key] <= EPSILON) delete actor.statuses[key];
  }
  actor.heat = Math.max(0, actor.heat - dt * (9 + actor.weaponCoolingBonus));
  if (actor.overheated && actor.heat <= 35 + EPSILON) {
    actor.overheated = false;
    emit(battle, { type: 'cooled', actorId: actor.id, message: `L’arme de ${actor.name} est de nouveau opérationnelle.` });
  }
  const shieldDelay = actor.cover ? SHIELD_RECHARGE.coverDelay : SHIELD_RECHARGE.exposedDelay;
  const shieldRate = actor.cover ? SHIELD_RECHARGE.coverRate : SHIELD_RECHARGE.exposedRate;
  if (battle.elapsed - actor.lastDamagedAt >= shieldDelay && actor.shield < actor.maxShield) {
    actor.shield = Math.min(actor.maxShield, actor.shield + dt * shieldRate);
  }
  if (!disabled(actor)) {
    const modifier = actor.team === 'enemy' ? DIFFICULTY[battle.difficulty].enemySpeed : 1;
    actor.atb = Math.min(100, actor.atb + dt * 20 * actor.speed * modifier);
  }
}

/** Enemy orders are deterministic for a given seed and decision sequence. */
export function autoEnemyActions(battle) {
  if (battle.winner) return battle;
  if (battle.mode === 'wait' && battle.actors.some(actor => actor.team === 'party' && ready(actor))) return battle;
  for (const actor of battle.actors.filter(candidate => candidate.team === 'enemy')) {
    if (!ready(actor) || battle.winner) continue;
    const targets = opponents(battle, actor).filter(target => !(target.statuses.stasis > EPSILON));
    const actions = getActions(battle, actor.id).filter(action => action.available);
    const can = id => actions.some(action => action.id === id);
    // Sustained fire can breach one shield instead of distributing harmless
    // chip damage across the squad. Taking cover makes an actor less attractive.
    const roll = random(battle);
    const focusChance = DIFFICULTY[battle.difficulty].focusChance;
    const exposure = target => (target.hp + target.shield) / (target.maxHp + target.maxShield)
      + (target.cover ? 0.45 : 0) + (target.statuses.barrier > EPSILON ? 0.2 : 0);
    const target = roll < focusChance
      ? [...targets].sort((left, right) => exposure(left) - exposure(right))[0]
      : targets[Math.floor((roll - focusChance) / (1 - focusChance) * targets.length)];
    if (!target) {
      if (can('cover')) performAction(battle, { actorId: actor.id, actionId: 'cover' });
      continue;
    }
    let actionId = null;
    let targetId = target.id;
    if (can('barrier') && actor.shield < actor.maxShield * 0.4) {
      actionId = 'barrier';
      targetId = actor.id;
    } else if (random(battle) < 0.6) {
      const powers = actions.filter(action => !PRIMARY_ACTIONS.has(action.id) && !['signature', 'medigel', 'unity', 'barrier'].includes(action.id)
        && (!action.syntheticOnly || (synthetic(target) && !target.hackImmune))
        && (action.id !== 'sabotage' || armed(target))
        && (action.id !== 'overload' || target.shield > 0 || synthetic(target))
        && !(target.statuses.stasis > EPSILON));
      if (powers.length) actionId = powers[Math.floor(random(battle) * powers.length)].id;
    }
    if (!actionId) {
      if (can('strike') || can('acid')) actionId = actor.primaryAction;
      else if (can('burst') && actor.heat < 35 && random(battle) < 0.22) actionId = 'burst';
      else if (can('shoot')) actionId = 'shoot';
      else {
        actionId = 'cover';
        targetId = actor.id;
      }
    }
    performAction(battle, { actorId: actor.id, actionId, targetId });
  }
  return battle;
}

/** Advances simulated time; paused/waiting combat also freezes cooldowns, heat and statuses. */
export function tickBattle(battle, dt, { paused = false } = {}) {
  if (paused || battle.winner || !Number.isFinite(dt) || dt <= 0) return battle;
  let remaining = dt;
  while (remaining > EPSILON && !battle.winner) {
    battle.waiting = battle.mode === 'wait' && battle.actors.some(actor => actor.team === 'party' && ready(actor));
    if (battle.waiting) break;
    const step = Math.min(0.05, remaining);
    battle.elapsed += step;
    for (const actor of battle.actors) tickActor(battle, actor, step);
    updateWinner(battle);
    if (battle.winner) break;
    // A player decision wins simultaneous readiness in wait mode; active mode has no such pause.
    battle.waiting = battle.mode === 'wait' && battle.actors.some(actor => actor.team === 'party' && ready(actor));
    if (!battle.waiting) autoEnemyActions(battle);
    remaining -= step;
  }
  return battle;
}

/** Serializable result for UI, progression and save-state summaries. */
export function summarizeBattle(battle) {
  return {
    winner: battle.winner,
    elapsed: battle.elapsed,
    actionCount: battle.actionCount,
    medigel: battle.medigel,
    defeatedEnemies: battle.actors.filter(actor => actor.team === 'enemy' && !living(actor)).length,
    party: battle.actors.filter(actor => actor.team === 'party').map(({ id, name, hp, maxHp, shield, maxShield }) => ({ id, name, hp, maxHp, shield, maxShield, alive: hp > 0 })),
    enemies: battle.actors.filter(actor => actor.team === 'enemy').map(({ id, name, hp, maxHp, shield, maxShield }) => ({ id, name, hp, maxHp, shield, maxShield, alive: hp > 0 })),
  };
}

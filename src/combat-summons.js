/**
 * Pure deployment plans. HP has one owner: the actual entity in battle.actors.
 * This module never edits actors, events, clocks, inventories or victory state.
 * Numbers, counters, retirement on owner KO and reactive guard behavior are ATB
 * choices, not verified original ranks, ranges or companion AI rules.
 */
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const EPSILON = 1e-8;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const fail = reason => ({ ok: false, reason });
const number = value => typeof value === 'number' && Number.isFinite(value);
const id = value => typeof value === 'string' && value.length > 0 && value.length <= 320
  && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function data(value, key, fallback) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return fallback;
  if (!descriptor.enumerable || !own(descriptor, 'value')) throw new TypeError('Data fields required');
  return descriptor.value;
}

export const SUMMON_LIMITS = freeze({ perOwnerAndAction: 1, perOwner: 2, perTeam: 6,
  maximumActors: 256, maximumSerial: 1000000, maximumElapsed: 1000000000, maximumCatchUpAttacks: 32 });

const common = {
  statsBasis: 'ATB adaptation', primarySourceVerifiedMechanics: false,
  ownerKOPolicy: 'retire', visualMode: 'prototype-device',
  limitations: ['HP, dégâts, durée, cadence, plafonds et retrait lorsque le propriétaire tombe sont des réglages ATB.',
    'Portée, proximité physique, déplacements, trajectoires et collision avec le décor ne sont pas simulés.',
    'La proximité des noms ne donne aucun droit d’attribution : les kits restent validés séparément par œuvre et scène.'],
};
export const SUMMON_PROFILES = freeze([
  { ...common, catalogId: 'ME2-POW-DRONE', mediaId: 'ME2', actionId: 'combatDrone', kind: 'combat-drone',
    name: 'Drone de combat — prototype', target: 'enemy', cooldown: 10, duration: 18, hp: 55, shield: 0, defense: 0,
    damage: 8, interval: 2, staggerDuration: .4, breakCover: true, mobility: 'floating',
    sourceIds: ['ME2-SRC-POWERS'],
    primaryReference: { url: 'https://eaassets-a.akamaihd.net/eahelp/manuals/mass-effect-2-manuals_PC_fr.pdf',
      reference: 'Manuel PC français : Ingénieur ; annexe 2, classes et pouvoirs.',
      scope: 'Le manuel confirme le Drone de combat de l’ingénieur, le harcèlement et le délogement du couvert ; pas les paramètres de ce prototype.' } },
  { ...common, catalogId: 'ME3-POW-DRONE', mediaId: 'ME3', actionId: 'combatDrone', kind: 'combat-drone',
    name: 'Drone de combat — prototype', target: 'enemy', cooldown: 10, duration: 18, hp: 65, shield: 0, defense: 1,
    damage: 9, interval: 2, staggerDuration: .4, breakCover: true, mobility: 'floating', sourceIds: ['ME3-SRC-POWERS'] },
  { ...common, catalogId: 'ME3-POW-SENTRY', mediaId: 'ME3', actionId: 'sentryTurret', kind: 'sentry-turret',
    name: 'Tourelle de garde — prototype', target: 'self', cooldown: 12, duration: 20, hp: 100, shield: 25, defense: 2,
    damage: 12, interval: 1.5, staggerDuration: 0, breakCover: false, mobility: 'stationary', sourceIds: ['ME3-SRC-POWERS'] },
  { ...common, catalogId: 'ME3-POW-DEFENSE-DRONE', mediaId: 'ME3', actionId: 'defenseDrone', kind: 'defense-drone',
    name: 'Drone de défense — prototype', target: 'self', cooldown: 12, duration: 18, hp: 60, shield: 0, defense: 0,
    damage: 6, interval: 2, staggerDuration: .5, breakCover: false, mobility: 'owner-tethered', sourceIds: ['ME3-SRC-SQUAD'],
    mechanicNote: 'Garde ATB réactive : répond aux véritables coups reçus par son propriétaire ; aucune proximité physique ou protection de type Barrière n’est revendiquée.' },
]);
const byContext = new Map(SUMMON_PROFILES.map(profile => [`${profile.mediaId}:${profile.actionId}`, profile]));
const byCatalogId = new Map(SUMMON_PROFILES.map(profile => [profile.catalogId, profile]));
export function getSummonProfile(mediaId, actionId) {
  return typeof mediaId === 'string' && typeof actionId === 'string' ? byContext.get(`${mediaId}:${actionId}`) || null : null;
}

export function isSummon(actor) {
  try {
    if (!plain(actor)) return false;
    const profile = byCatalogId.get(data(actor, 'summonProfileId'));
    const ownerId = data(actor, 'ownerId'), serial = data(actor, 'summonSerial');
    return !!profile && id(ownerId) && Number.isInteger(serial) && serial >= 1 && serial <= SUMMON_LIMITS.maximumSerial
      && data(actor, 'id') === `summon:${ownerId}:${profile.actionId}:${serial}`
      && data(actor, 'actionId') === profile.actionId && data(actor, 'mediaId') === profile.mediaId
      && data(actor, 'autonomous') === true && data(actor, 'countsForVictory') === false
      && data(actor, 'synthetic') === true && number(data(actor, 'summonedAt')) && number(data(actor, 'expiresAt'))
      && data(actor, 'expiresAt') > data(actor, 'summonedAt');
  } catch { return false; }
}
export const isVictoryParticipant = actor => !isSummon(actor);

function actorList(value) {
  if (!Array.isArray(value) || value.length > SUMMON_LIMITS.maximumActors) throw new TypeError('Invalid actors');
  const ids = new Set();
  for (let index = 0; index < value.length; index++) {
    const actor = data(value, String(index));
    if (!plain(actor) || !id(data(actor, 'id')) || ids.has(data(actor, 'id'))
      || !['party', 'enemy'].includes(data(actor, 'team')) || !number(data(actor, 'hp')) || data(actor, 'hp') < 0) throw new TypeError('Invalid actor');
    const statuses = data(actor, 'statuses', {});
    if (!plain(statuses)) throw new TypeError('Invalid statuses');
    ids.add(data(actor, 'id'));
  }
  return value;
}
const alive = actor => data(actor, 'hp') > EPSILON;
const status = (actor, key) => {
  const value = data(data(actor, 'statuses', {}), key, 0);
  if (!number(value) || value < 0) throw new TypeError('Invalid status');
  return value > EPSILON;
};
const disabled = actor => ['stasis', 'lift', 'singularity', 'stagger', 'pull', 'frozen', 'slam'].some(key => status(actor, key));
const opponents = (actor, target) => data(actor, 'id') !== data(target, 'id')
  && ((status(actor, 'hacked') || status(actor, 'dominated')) ? data(actor, 'team') === data(target, 'team') : data(actor, 'team') !== data(target, 'team'));
const eligibleTarget = (actor, target) => alive(target) && opponents(actor, target) && !status(target, 'stasis');

function retirement(actor, actors, elapsed) {
  if (!alive(actor)) return { actorId: data(actor, 'id'), reason: 'destroyed', at: elapsed };
  const owner = actors.find(candidate => data(candidate, 'id') === data(actor, 'ownerId'));
  if (!owner || !alive(owner)) return { actorId: data(actor, 'id'), reason: 'owner-unavailable', at: elapsed };
  if (elapsed >= data(actor, 'expiresAt') - EPSILON) return { actorId: data(actor, 'id'), reason: 'expired', at: data(actor, 'expiresAt') };
  return null;
}

/** Preflight only. Apply retireIds and the new actor together after the native
 * combat layer validates ATB, cooldown and target. eventCursor is the current
 * last battle event ID, so a new guard cannot replay pre-deployment damage. */
export function planSummon(input = {}) {
  try {
    if (!plain(input)) return fail('Invalid summon request.');
    const actors = actorList(data(input, 'actors'));
    const ownerId = data(input, 'ownerId'), actionId = data(input, 'actionId');
    const elapsed = data(input, 'elapsed'), serial = data(input, 'serial'), eventCursor = data(input, 'eventCursor', -1);
    if (!id(ownerId) || !number(elapsed) || elapsed < 0 || elapsed > SUMMON_LIMITS.maximumElapsed || !Number.isInteger(serial) || serial < 1 || serial > SUMMON_LIMITS.maximumSerial
      || !Number.isInteger(eventCursor) || eventCursor < -1) return fail('Invalid summon clock or identifier.');
    const owner = actors.find(actor => data(actor, 'id') === ownerId);
    if (!owner || !alive(owner) || disabled(owner) || isSummon(owner)) return fail('The owner cannot deploy this entity.');
    const profile = getSummonProfile(data(owner, 'mediaId'), actionId), powers = data(owner, 'powers', []);
    let trained = false;
    if (Array.isArray(powers)) for (let index = 0; index < powers.length; index++) if (data(powers, String(index)) === actionId) trained = true;
    if (!profile || !trained) return fail('This action is not trained in this work.');
    if (elapsed + profile.duration > SUMMON_LIMITS.maximumElapsed) return fail('Summon lifetime exceeds the clock budget.');
    const targets = actors.filter(target => eligibleTarget(owner, target));
    const requestedTarget = data(input, 'targetId');
    const focus = requestedTarget === undefined ? targets[0] : targets.find(target => data(target, 'id') === requestedTarget);
    if (profile.target === 'enemy' && !focus) return fail('A living, exposed-to-targeting opponent is required.');
    if (profile.target === 'self' && requestedTarget !== undefined && requestedTarget !== ownerId) return fail('This deployment targets its owner.');
    const summonId = `summon:${ownerId}:${actionId}:${serial}`;
    if (actors.some(actor => data(actor, 'id') === summonId)) return fail('Summon identifier already exists.');
    const retired = actors.filter(isSummon).map(actor => retirement(actor, actors, elapsed)).filter(Boolean);
    const retiredIds = new Set(retired.map(item => item.actorId));
    const active = actors.filter(actor => isSummon(actor) && !retiredIds.has(data(actor, 'id')));
    const replacements = active.filter(actor => data(actor, 'ownerId') === ownerId && data(actor, 'actionId') === actionId);
    const replacedIds = new Set(replacements.map(actor => data(actor, 'id')));
    const remaining = active.filter(actor => !replacedIds.has(data(actor, 'id')));
    if (remaining.filter(actor => data(actor, 'ownerId') === ownerId).length >= SUMMON_LIMITS.perOwner
      || remaining.filter(actor => data(actor, 'team') === data(owner, 'team')).length >= SUMMON_LIMITS.perTeam) return fail('ATB deployment capacity reached.');
    const multiplier = data(owner, 'techMultiplier', 1);
    if (!number(multiplier) || multiplier <= 0) return fail('Invalid technological multiplier.');
    const actor = {
      id: summonId, name: profile.name, team: data(owner, 'team'), mediaId: profile.mediaId,
      ownerId, actionId, summonProfileId: profile.catalogId, summonSerial: serial,
      summonedAt: elapsed, expiresAt: elapsed + profile.duration,
      nextAttackAt: elapsed + (profile.kind === 'defense-drone' ? 0 : profile.interval), eventCursor,
      focusTargetId: profile.target === 'enemy' ? data(focus, 'id') : null,
      hp: profile.hp, maxHp: profile.hp, shield: profile.shield, maxShield: profile.shield,
      attack: profile.damage * clamp(multiplier, .05, 10), defense: profile.defense, speed: .1, atb: 0,
      powers: [], statuses: {}, cooldowns: {}, synthetic: true, type: 'synthetic',
      isSummon: true, autonomous: true, countsForVictory: false, targetable: true, canRevive: false, canUseItems: false,
      mobility: profile.mobility, visualMode: profile.visualMode, portrait: null, sprite: null,
      statsBasis: profile.statsBasis,
    };
    return { ok: true, actor, retireIds: [...new Set([...retiredIds, ...replacedIds])], nextSerial: serial + 1 };
  } catch { return fail('Malformed summon request.'); }
}

function readEvents(events, elapsed) {
  if (!Array.isArray(events)) throw new TypeError('Invalid events');
  const result = [], ids = new Set();
  for (let index = 0; index < events.length; index++) {
    const event = data(events, String(index));
    if (!plain(event)) throw new TypeError('Invalid event');
    const eventId = data(event, 'id'), at = data(event, 'at'), type = data(event, 'type');
    if (!Number.isInteger(eventId) || eventId < 0 || !number(at) || at < 0 || typeof type !== 'string' || ids.has(eventId)) throw new TypeError('Invalid event');
    ids.add(eventId);
    if (at <= elapsed + EPSILON) result.push({ id: eventId, at, type,
      actorId: data(event, 'actorId'), targetId: data(event, 'targetId'), amount: data(event, 'amount', 0) });
  }
  return result.sort((left, right) => left.at - right.at || left.id - right.id);
}

/** Return commands, never deal damage or update HP here. The core applies each
 * attack through its own Stasis/armor/control rules and rechecks live targets.
 * Apply patches once before the next plan; their event cursor prevents replay.
 * If one call spans expiry, attack timestamps precede retirement timestamps. */
export function planSummonTick(input = {}) {
  try {
    if (!plain(input)) return fail('Invalid summon tick.');
    const actors = actorList(data(input, 'actors')), elapsed = data(input, 'elapsed');
    if (!number(elapsed) || elapsed < 0 || elapsed > SUMMON_LIMITS.maximumElapsed) return fail('Invalid summon clock.');
    const events = readEvents(data(input, 'recentEvents', []), elapsed);
    const newestEventId = events.reduce((latest, event) => Math.max(latest, event.id), -1);
    const attacks = [], patches = [], retirements = [];
    for (const [actorOrder, actor] of actors.entries()) {
      if (!isSummon(actor)) continue;
      const profile = byCatalogId.get(data(actor, 'summonProfileId'));
      const retired = retirement(actor, actors, elapsed);
      if (retired && retired.reason !== 'expired') { retirements.push(retired); continue; }
      const born = data(actor, 'summonedAt'), expires = data(actor, 'expiresAt');
      let nextAttackAt = data(actor, 'nextAttackAt'), eventCursor = data(actor, 'eventCursor', -1);
      if (!number(nextAttackAt) || nextAttackAt < born || !Number.isInteger(eventCursor) || eventCursor < -1
        || !number(data(actor, 'attack')) || data(actor, 'attack') < 0) return fail('Invalid summon runtime state.');
      if (elapsed < born - EPSILON) continue;
      const cursor = Math.max(eventCursor, newestEventId);
      const blocked = disabled(actor) || status(actor, 'sabotage');
      const targets = actors.filter(target => eligibleTarget(actor, target));
      const append = (target, at) => attacks.push({ actorId: data(actor, 'id'), ownerId: data(actor, 'ownerId'),
        actionId: 'summonPulse', powerActionId: profile.actionId, targetId: data(target, 'id'), at,
        rawDamage: data(actor, 'attack'), family: 'tech', ignoreCover: profile.breakCover,
        breakCover: profile.breakCover, staggerDuration: profile.staggerDuration,
        staggerRequiresUnprotected: true, actorOrder });
      if (blocked || targets.length === 0) nextAttackAt = Math.max(nextAttackAt, elapsed + profile.interval);
      else if (profile.kind === 'defense-drone') {
        for (const event of events) {
          if (event.id <= eventCursor || event.type !== 'damage' || !number(event.amount) || event.amount <= EPSILON
            || event.targetId !== data(actor, 'ownerId') || event.at < born - EPSILON || event.at < nextAttackAt - EPSILON || event.at >= expires - EPSILON) continue;
          const attacker = targets.find(target => data(target, 'id') === event.actorId);
          if (!attacker) continue;
          append(attacker, event.at); nextAttackAt = event.at + profile.interval;
        }
      } else {
        const focused = targets.find(target => data(target, 'id') === data(actor, 'focusTargetId')) || targets[0];
        let count = 0;
        while (nextAttackAt <= elapsed + EPSILON && nextAttackAt < expires - EPSILON && count++ < SUMMON_LIMITS.maximumCatchUpAttacks) {
          append(focused, nextAttackAt); nextAttackAt += profile.interval;
        }
      }
      patches.push({ actorId: data(actor, 'id'), nextAttackAt, eventCursor: cursor });
      if (retired) retirements.push(retired);
    }
    attacks.sort((left, right) => left.at - right.at || left.actorOrder - right.actorOrder);
    return { ok: true, attacks: attacks.map(({ actorOrder, ...attack }) => attack), patches,
      retireIds: retirements.map(item => item.actorId), retirements };
  } catch { return fail('Malformed summon tick.'); }
}

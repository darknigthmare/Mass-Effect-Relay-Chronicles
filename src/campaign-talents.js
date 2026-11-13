// Persistent ME1 training. Ranks, costs and bonuses are explicit ATB adaptations,
// not the original twelve-rank trees. Inventory armour training shares this pool.
import { getEquipmentProfile, CHARACTER_EQUIPMENT } from './character-data.js';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const actorIds = Object.freeze(Object.keys(CHARACTER_EQUIPMENT));
const maxRank = 3;
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const mastery = (id, label, weaponType) => ({ id, label, weaponType, maxRank,
  description: 'Augmente les dégâts de cette famille équipée de 3,5 % par rang. La précision et le pouvoir original de maîtrise ne sont pas ajoutés.' });
export const CAMPAIGN_TALENTS = freeze([
  mastery('pistols', 'Pistolets', 'pistol'), mastery('assault-rifles', 'Fusils d’assaut', 'assault'),
  mastery('shotguns', 'Fusils à pompe', 'shotgun'), mastery('sniper-rifles', 'Fusils de précision', 'sniper'),
  { id: 'fitness', label: 'Aptitude physique', maxRank, commanderClass: 'soldier', actionId: 'me1Immunity', actionRank: 2,
    description: 'Ajoute 14 points de santé par rang. Le deuxième rang débloque Immunité pour Shepard soldat.' },
  { id: 'assault-training', label: 'Formation d’assaut', maxRank, commanderClass: 'soldier', actionId: 'me1Adrenaline', actionRank: 2,
    description: 'Ajoute 3 % aux dégâts des tirs par rang. Le deuxième rang débloque Montée d’adrénaline ME1.' },
  { id: 'electronics', label: 'Électronique', maxRank, requiresTech: true,
    description: 'Ajoute huit points de bouclier par rang. Ne donne pas Surcharge ou Décryptage à un personnage non formé.' },
  { id: 'damping', label: 'Atténuation', maxRank: 2, commanderClass: 'engineer', prerequisites: { electronics: 1 }, actionId: 'me1Damping', actionRank: 2,
    description: 'Le deuxième rang bloque temporairement les nouvelles capacités d’une cible. Demande un rang d’Électronique ; les actions déjà résolues sont conservées.' },
  { id: 'biotic-discipline', label: 'Discipline biotique', maxRank, requiresBiotic: true,
    description: 'Exercice ATB adapté : renforce les pouvoirs biotiques déjà maîtrisés de 4 % par rang. Aucun nouveau pouvoir n’est accordé.' },
]);
const definitions = Object.freeze(Object.fromEntries(CAMPAIGN_TALENTS.map(talent => [talent.id, talent])));
export const CAMPAIGN_TALENT_ACTIONS = freeze({
  me1Damping: { label: 'Atténuation', description: 'Neutralise les nouvelles capacités technologiques et biotiques d’une cible pendant huit secondes ATB, amplifiées par son outil. Ne révoque aucun effet déjà résolu.', target: 'enemy', cooldown: 18 },
  me1Immunity: { label: 'Immunité', description: 'Réduit de 35 % les dégâts reçus pendant huit secondes ATB. Ces chiffres sont propres à l’adaptation.', target: 'self', cooldown: 24 },
  me1Adrenaline: { label: 'Montée d’adrénaline ME1', description: 'Rend les autres capacités immédiatement disponibles. Sa propre recharge de 45 secondes reste active ; aucun ralenti, soin ou refroidissement d’arme.', target: 'self', cooldown: 45 },
});

function safeRecord(value, depth = 0, seen = new WeakSet()) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 4 || seen.has(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const keys = Reflect.ownKeys(value); if (keys.length > 30) return false;
  seen.add(value);
  for (const key of keys) {
    if (typeof key !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !own(descriptor, 'value') || !safeRecord(descriptor.value, depth + 1, seen)) return false;
  }
  seen.delete(value); return true;
}
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Reflect.ownKeys(value).length === keys.length && keys.every(key => own(value, key));
const me1State = state => state && (!own(state, 'context') || state.context?.mediaId === 'ME1' && state.context?.periodId === 'me1');
const knownActor = (state, actorId) => typeof actorId === 'string' && actorIds.includes(actorId)
  && !!getEquipmentProfile(actorId, state?.classId) && (actorId === 'shepard' || state?.recruited?.includes(actorId));
const eligible = (state, actorId, talent) => {
  if (!me1State(state) || !knownActor(state, actorId) || actorId === 'jenkins' || !talent) return false;
  const profile = getEquipmentProfile(actorId, state.classId);
  return (!talent.commanderClass || actorId === 'shepard' && state.classId === talent.commanderClass)
    && (!talent.weaponType || profile.weaponTraining.includes(talent.weaponType))
    && (!talent.requiresTech || profile.tech === true) && (!talent.requiresBiotic || profile.biotic === true);
};
const budget = state => Number.isSafeInteger(state?.xp) && state.xp >= 0 ? Math.floor(state.xp / 300) : 0;
function armorPoints(state, actorId) {
  const training = state?.inventory?.training;
  if (training === undefined || !own(training, actorId)) return 0;
  const entry = training[actorId];
  if (!entry || !entry.weights || typeof entry.weights !== 'object' || Array.isArray(entry.weights)) return Infinity;
  let points = 0;
  for (const key of Reflect.ownKeys(entry.weights)) {
    const descriptor = Object.getOwnPropertyDescriptor(entry.weights, key);
    if (typeof key !== 'string' || !['light', 'medium', 'heavy'].includes(key) || !descriptor.enumerable || !own(descriptor, 'value') || descriptor.value !== true) return Infinity;
    points++;
  }
  return points;
}
const rankTotal = ranks => Object.values(ranks || {}).reduce((total, rank) => total + rank, 0);
export function createTalentState() { return { version: 1, ranks: {} }; }

/** Missing legacy field migrates to zero ranks; explicit invalid data fails. */
export function normalizeTalents(raw, state) {
  try {
    if (raw === undefined) return createTalentState();
    if (!me1State(state) || !safeRecord(raw) || !exact(raw, ['version', 'ranks']) || raw.version !== 1
      || !raw.ranks || typeof raw.ranks !== 'object' || Array.isArray(raw.ranks)) return null;
    const result = createTalentState();
    for (const [actorId, ranks] of Object.entries(raw.ranks)) {
      if (!knownActor(state, actorId) || actorId === 'jenkins' || !ranks || typeof ranks !== 'object' || Array.isArray(ranks)) return null;
      const copy = {};
      for (const [id, rank] of Object.entries(ranks)) {
        const talent = own(definitions, id) ? definitions[id] : null;
        if (!eligible(state, actorId, talent) || !Number.isInteger(rank) || rank < 1 || rank > talent.maxRank) return null;
        copy[id] = rank;
      }
      if (Object.entries(copy).some(([id]) => Object.entries(definitions[id].prerequisites || {}).some(([required, minimum]) => (copy[required] || 0) < minimum))) return null;
      if (rankTotal(copy) + armorPoints(state, actorId) > budget(state)) return null;
      result.ranks[actorId] = copy;
    }
    return result;
  } catch { return null; }
}

/** Infinity makes armour operations reject malformed or jointly overspent data. */
export function campaignTalentPointsSpent(state, actorId) {
  const normalized = normalizeTalents(state?.talents, state);
  return normalized ? rankTotal(normalized.ranks[actorId]) : Infinity;
}

export function getTalentBudget(state, actorId) {
  const talentPoints = campaignTalentPointsSpent(state, actorId), armourPoints = armorPoints(state, actorId);
  return { total: budget(state), talentPoints, armorPoints: armourPoints, available: budget(state) - talentPoints - armourPoints };
}

export function getTalentOptions(state, actorId) {
  const normalized = normalizeTalents(state?.talents, state);
  if (!normalized || !knownActor(state, actorId)) return [];
  const ranks = normalized.ranks[actorId] || {}, points = getTalentBudget(state, actorId);
  return CAMPAIGN_TALENTS.filter(talent => eligible(state, actorId, talent)).map(talent => {
    const rank = ranks[talent.id] || 0;
    const unmet = Object.entries(talent.prerequisites || {}).find(([id, minimum]) => (ranks[id] || 0) < minimum);
    const reason = state.lost?.includes(actorId) ? 'Cet équipier ne peut plus recevoir de formation.'
      : state.zone !== 'normandy' ? 'Rejoignez le Normandy pour investir un point de talent.'
        : rank >= talent.maxRank ? 'Rang maximum atteint.'
          : unmet ? `${definitions[unmet[0]].label} : rang ${unmet[1]} nécessaire.`
            : points.available < 1 ? 'Un point de formation commun aux talents et aux armures est nécessaire.' : null;
    return { ...talent, prerequisites: { ...talent.prerequisites }, rank, nextRank: Math.min(talent.maxRank, rank + 1),
      cost: 1, availablePoints: points.available, canTrain: !reason, reason,
      unlockedAction: talent.actionId && rank >= talent.actionRank ? talent.actionId : null };
  });
}

/** Commit only after all rank, class, prerequisite and shared-budget checks. */
export function trainTalent(state, actorId, talentId) {
  const option = getTalentOptions(state, actorId).find(talent => talent.id === talentId);
  if (!option) return { ok: false, reason: 'Ce talent n’est pas proposé à cet équipier.' };
  if (!option.canTrain) return { ok: false, reason: option.reason };
  const next = normalizeTalents(state.talents, state);
  (next.ranks[actorId] ||= {})[talentId] = option.rank + 1;
  if (!normalizeTalents(next, state)) return { ok: false, reason: 'Le budget commun de formation ne permet pas ce rang.' };
  state.talents = next;
  return { ok: true, actorId, talentId, rank: option.rank + 1, cost: 1 };
}

export function getTalentEffects(state, actorId) {
  const normalized = normalizeTalents(state?.talents, state), ranks = normalized?.ranks[actorId] || {};
  const weaponMultipliers = Object.fromEntries(CAMPAIGN_TALENTS.filter(talent => talent.weaponType)
    .map(talent => [talent.weaponType, 1 + .035 * (ranks[talent.id] || 0)]));
  const actions = CAMPAIGN_TALENTS.filter(talent => talent.actionId && (ranks[talent.id] || 0) >= talent.actionRank).map(talent => talent.actionId);
  return { ranks: { ...ranks }, hp: 14 * (ranks.fitness || 0), shield: 8 * (ranks.electronics || 0),
    weaponMultipliers, assaultMultiplier: 1 + .03 * (ranks['assault-training'] || 0),
    bioticMultiplier: 1 + .04 * (ranks['biotic-discipline'] || 0), actions };
}

/** Apply once after applyLoadout(baseActorFor()). Never mutates saved bases. */
export function applyCampaignTalents(actor, state) {
  const copy = { ...actor, powers: [...(actor.powers || [])] };
  if (!me1State(state) || actor.mediaId && actor.mediaId !== 'ME1' || actor.campaignTalentsApplied || !knownActor(state, actor.id)) return copy;
  const effects = getTalentEffects(state, actor.id);
  if (!Object.keys(effects.ranks).length) return copy;
  return { ...copy, mediaId: 'ME1', campaignTalents: true, campaignTalentsApplied: true, campaignTalentClass: state.classId, campaignTalentRanks: effects.ranks,
    hp: actor.hp + effects.hp, maxHp: actor.maxHp + effects.hp,
    shield: actor.shield + effects.shield, maxShield: actor.maxShield + effects.shield,
    weaponDamageMultiplier: (actor.weaponDamageMultiplier ?? 1) * (effects.weaponMultipliers[actor.weaponType] || 1) * effects.assaultMultiplier,
    bioticMultiplier: (actor.bioticMultiplier ?? 1) * effects.bioticMultiplier,
    powers: [...new Set([...copy.powers, ...effects.actions])] };
}

export function campaignTalentActionAllowed(actor, actionId) {
  if (!actor || !own(CAMPAIGN_TALENT_ACTIONS, actionId) || actor.id !== 'shepard' || actor.mediaId !== 'ME1'
    || actor.campaignTalents !== true || actor.powers?.includes(actionId) !== true) return false;
  const talent = CAMPAIGN_TALENTS.find(talent => talent.actionId === actionId);
  return actor.campaignTalentClass === talent.commanderClass && actor.campaignTalentRanks?.[talent.id] >= talent.actionRank
    && Object.entries(talent.prerequisites || {}).every(([id, rank]) => actor.campaignTalentRanks?.[id] >= rank);
}
export function campaignTalentActionDescription(actor, actionId) {
  if (!campaignTalentActionAllowed(actor, actionId)) return null;
  return CAMPAIGN_TALENT_ACTIONS[actionId].description;
}
export function campaignTalentDamageMultiplier(actor) {
  return actor?.mediaId === 'ME1' && actor?.statuses?.me1Immunity > 0 ? .65 : 1;
}

/** Combat owns costs/ATB/target checks; this helper only applies the resolved effect. */
export function applyCampaignTalentAction({ actor, actionId, targets = [], elapsed = 0 } = {}) {
  if (!campaignTalentActionAllowed(actor, actionId)) return { ok: false, events: [] };
  const event = details => ({ type: 'talent', actorId: actor.id, actionId, at: elapsed, ...details });
  if (actionId === 'me1Adrenaline') {
    for (const id of Object.keys(actor.cooldowns || {})) if (id !== actionId) actor.cooldowns[id] = 0;
    return { ok: true, events: [event({ message: `${actor.name} rend ses autres capacités disponibles.` })] };
  }
  if (actionId === 'me1Immunity') {
    actor.statuses ||= {}; actor.statuses.me1Immunity = Math.max(actor.statuses.me1Immunity || 0, 8);
    return { ok: true, events: [event({ duration: 8, message: `${actor.name} bénéficie d’Immunité pendant huit secondes ATB.` })] };
  }
  const target = targets[0];
  if (!target || target.hp <= 0) return { ok: false, events: [] };
  if (target.statuses?.stasis > 0) return { ok: true, events: [event({ targetId: target.id, blocked: true, message: 'La stase protège la cible contre Atténuation.' })] };
  const duration = Math.max(0, Math.min(20, 8 * (actor.techMultiplier ?? 1) * (1 - Math.max(0, Math.min(1, target.controlResistance || 0)))));
  if (target.controlImmune === true || duration < .1) return { ok: true, events: [event({ targetId: target.id, resisted: true, message: `${target.name} résiste à Atténuation ; aucune nouvelle neutralisation n’est appliquée.` })] };
  target.statuses ||= {}; target.statuses.damped = Math.max(target.statuses.damped || 0, duration);
  return { ok: true, events: [event({ targetId: target.id, duration, message: `${target.name} ne peut plus activer de nouvelle capacité pendant ${Number(duration.toFixed(2)).toLocaleString('fr-FR')} secondes ATB.` })] };
}

// Prepared ME2/ME3 signature powers. All distances, damage, durations and costs
// are explicit ATB choices. No campaign, acquisition or original animation is
// produced by enabling a sourced power in an independent chronicle workshop.
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const EPSILON = 1e-8;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const alive = actor => !!actor && Number.isFinite(actor.hp) && actor.hp > EPSILON;
const positive = (value, fallback) => Number.isFinite(value) && value >= 0 ? value : fallback;
const power = (actor, field) => Math.max(.05, Math.min(10, positive(actor?.[field], 1)));
const fail = reason => ({ ok: false, reason });

export const CHRONICLE_SIGNATURE_BINDINGS = freeze([
  ...['ME2', 'ME3'].flatMap(mediaId => [
    { catalogId: `${mediaId}-POW-CHARGE`, mediaId, actionId: 'bioticCharge', buildId: 'vanguard' },
    { catalogId: `${mediaId}-POW-TACTICAL`, mediaId, actionId: 'tacticalCloak', buildId: 'infiltrator' },
    { catalogId: `${mediaId}-POW-TECH-ARMOR`, mediaId, actionId: 'techArmor', buildId: 'sentinel' },
  ]),
  { catalogId: 'ME3-POW-NOVA', mediaId: 'ME3', actionId: 'nova', buildId: 'vanguard' },
]);
export const SIGNATURE_ACTIONS = freeze({
  bioticCharge: { label: 'Charge biotique', target: 'enemy', cooldown: 12,
    description: 'Approche abstraite au contact : impact biotique et récupération de la moitié des boucliers maximum. Exposition aux dégâts accrue de 15 % pendant trois secondes ATB.' },
  tacticalCloak: { label: 'Camouflage tactique', target: 'self', cooldown: 18,
    description: 'Empêche les nouveaux ordres adverses de cibler le personnage pendant cinq secondes ATB, y compris les zones abstraites de cet essai. Le prochain ordre offensif révèle le personnage ; les tirs bénéficient d’un multiplicateur de 1,5. Les projectiles déjà lancés ne sont pas effacés.' },
  techArmor: { label: 'Technoblindage', target: 'self', cooldown: 20,
    description: 'ME2 : recharge partielle des boucliers et détonation lorsqu’ils cèdent, durant douze secondes ATB. ME3 : protection de 25 % pendant quinze secondes, avec détonation manuelle. Paramètres adaptés, sans rang original simulé.' },
  techArmorDetonate: { label: 'Détoner le technoblindage', target: 'enemies', cooldown: 3,
    description: 'ME3 seulement : retire la protection active et frappe les adversaires conscients. N’accorde aucun nouveau bouclier, aucune munition et aucun soin.' },
  nova: { label: 'Nova', target: 'enemies',
    description: 'ME3 seulement : consomme tout le bouclier courant pour une onde biotique dont les dégâts dépendent de la fraction dépensée. Impossible sans bouclier ; aucune munition consommée.' },
});

function bindingFor(actor, actionId) {
  const lookupId = actionId === 'techArmorDetonate' ? 'techArmor' : actionId;
  return CHRONICLE_SIGNATURE_BINDINGS.find(binding => binding.mediaId === actor?.mediaId && binding.actionId === lookupId);
}
export function signatureActionAllowed(actor, actionId) {
  if (!actor || !own(SIGNATURE_ACTIONS, actionId) || !['ME2', 'ME3'].includes(actor.mediaId)
    || actor.catalogId !== `${actor.mediaId}-CHR-SHEPARD`
    || actor.chronicleSignaturePeriod !== actor.mediaId.toLowerCase()
    || !Array.isArray(actor.powers) || !actor.powers.includes(actionId)) return false;
  const binding = bindingFor(actor, actionId);
  return !!binding && actor.buildId === binding.buildId && actor.powerCatalogIds?.includes(binding.catalogId) === true
    && (actionId !== 'techArmorDetonate' || actor.mediaId === 'ME3');
}

const enemyTargets = (actor, targets) => Array.isArray(targets) ? targets.filter(target => alive(target) && target.id !== actor.id
  && (actor.team === undefined || target.team === undefined || target.team !== actor.team)) : [];
const event = (actor, actionId, details) => ({ type: 'chronicleSignature', actorId: actor.id, actionId, ...details });
const emptyPlan = () => ({ ok: true, selfStatus: {}, selfShieldDelta: 0, selfShieldCost: 0,
  damage: [], controls: [], events: [], clearStatuses: [], breakCover: false });

/** Pure preflight. Engine commits the returned instructions after native costs. */
export function planSignatureAction({ battle, actor, actionId, targets = [] } = {}) {
  if (!signatureActionAllowed(actor, actionId)) return fail('Cette capacité n’appartient pas à la classe, à l’œuvre ou à la période préparée.');
  if (!alive(actor)) return fail('Ce combattant est hors combat.');
  const plan = emptyPlan(), attack = Math.max(1, positive(actor.attack, 20));
  const enemies = enemyTargets(actor, targets);
  if (actionId === 'tacticalCloak') {
    plan.selfStatus.tacticalCloak = 5;
    plan.events.push(event(actor, actionId, { duration: 5, message: `${actor.name} se dissimule pendant cinq secondes ATB.` }));
    return plan;
  }
  if (actionId === 'techArmor') {
    if (actor.statuses?.techArmor > EPSILON) return fail('Le technoblindage est déjà actif.');
    plan.selfStatus.techArmor = actor.mediaId === 'ME2' ? 12 : 15;
    if (actor.mediaId === 'ME2') plan.selfShieldDelta = positive(actor.maxShield, 0) * .5;
    plan.events.push(event(actor, actionId, { duration: plan.selfStatus.techArmor,
      message: actor.mediaId === 'ME2' ? `${actor.name} prépare une protection détonante ME2.` : `${actor.name} active sa protection ME3, avec détonation manuelle.` }));
    return plan;
  }
  if (actionId === 'techArmorDetonate') {
    if (!(actor.statuses?.techArmor > EPSILON)) return fail('Activez d’abord le technoblindage.');
    if (!enemies.length) return fail('Aucun adversaire vivant à portée de l’onde abstraite.');
    plan.clearStatuses.push('techArmor');
    plan.damage = enemies.map(target => ({ targetId: target.id, amount: attack * power(actor, 'techMultiplier'), ignoreCover: true }));
    plan.events.push(event(actor, actionId, { message: `${actor.name} sacrifie son technoblindage dans une onde technologique.` }));
    return plan;
  }
  if (!enemies.length) return fail('Sélectionnez un adversaire vivant.');
  if (actionId === 'bioticCharge') {
    const target = enemies[0];
    plan.selfEngagedTargetId = target.id;
    plan.selfStatus.chargeExposure = 3; plan.selfShieldDelta = positive(actor.maxShield, 0) * .5;
    plan.breakCover = true;
    plan.damage.push({ targetId: target.id, amount: attack * 1.25 * power(actor, 'bioticMultiplier'), ignoreCover: true });
    if (!(target.shield > EPSILON)) plan.controls.push({ targetId: target.id, status: 'stagger', duration: 1 });
    plan.events.push(event(actor, actionId, { targetId: target.id, approach: 'abstract-contact', duration: 3,
      message: `${actor.name} se projette au contact de ${target.name} ; exposition accrue pendant trois secondes ATB.` }));
    return plan;
  }
  if (actionId === 'nova') {
    const shield = positive(actor.shield, 0), maximum = positive(actor.maxShield, 0);
    if (shield <= EPSILON || maximum <= EPSILON) return fail('Nova exige des boucliers à convertir.');
    plan.selfShieldCost = shield;
    const fraction = Math.min(1, shield / maximum);
    plan.damage = enemies.map(target => ({ targetId: target.id, amount: attack * 1.8 * fraction * power(actor, 'bioticMultiplier'), ignoreCover: true }));
    plan.events.push(event(actor, actionId, { shieldSpent: shield, fraction,
      message: `${actor.name} consomme ${Math.round(shield)} points de bouclier pour Nova.` }));
    return plan;
  }
  return fail('Capacité inconnue.');
}

/** ME2-only one-shot plan. Clear the status before applying recursive damage. */
export function planSignatureArmorBreak({ battle, actor, beforeShield } = {}) {
  if (!battle || !signatureActionAllowed(actor, 'techArmor') || actor.mediaId !== 'ME2'
    || !(actor.statuses?.techArmor > EPSILON) || !(beforeShield > EPSILON) || actor.shield > EPSILON) return null;
  const plan = emptyPlan(); plan.clearStatuses.push('techArmor');
  plan.damage = enemyTargets(actor, battle.actors).map(target => ({ targetId: target.id,
    amount: Math.max(1, positive(actor.attack, 20)) * power(actor, 'techMultiplier'), ignoreCover: true }));
  plan.events.push(event(actor, 'techArmor', { automatic: true, message: `Le technoblindage de ${actor.name} se brise et détonne.` }));
  return plan;
}

const signatureStateAllowed = actor => !!actor && ['ME2', 'ME3'].includes(actor.mediaId)
  && actor.chronicleSignaturePeriod === actor.mediaId.toLowerCase() && actor.catalogId === `${actor.mediaId}-CHR-SHEPARD`;
export function signatureTargetable(actor) {
  return !(signatureActionAllowed(actor, 'tacticalCloak') && actor.statuses?.tacticalCloak > EPSILON);
}
/** Weapon launch bonus; the engine must not multiply delayed damage twice. */
export function signatureDamageMultiplier(source, target, actionId) {
  return signatureActionAllowed(source, 'tacticalCloak') && source.statuses?.tacticalCloak > EPSILON
    && ['shoot', 'burst', 'signature'].includes(actionId) ? 1.5 : 1;
}
export function signatureIncomingDamageMultiplier(target) {
  if (!signatureStateAllowed(target)) return 1;
  return (signatureActionAllowed(target, 'bioticCharge') && target.statuses?.chargeExposure > EPSILON ? 1.15 : 1)
    * (target.mediaId === 'ME3' && signatureActionAllowed(target, 'techArmor') && target.statuses?.techArmor > EPSILON ? .75 : 1);
}
export function signatureOffensiveAction(actionId, definition) {
  if (['self', 'allies'].includes(definition?.target)) return false;
  return !['cover', 'reposition', 'advance', 'withdraw', 'reload', 'cancelChannel', 'medigel', 'unity',
    'tacticalCloak', 'techArmor', 'barrier', 'fortification', 'shieldBoost', 'ammoOff',
    'ammoIncendiary', 'ammoCryo', 'ammoDisruptor', 'ammoArmorPiercing', 'ammoWarp', 'ammoShredder'].includes(actionId);
}
export function chronicleSignatureStatus(actor) {
  if (!signatureStateAllowed(actor)) return [];
  const facts = [];
  if (signatureActionAllowed(actor, 'tacticalCloak') && actor.statuses?.tacticalCloak > EPSILON) facts.push(`Camouflage : ${Math.ceil(actor.statuses.tacticalCloak)} s`);
  if (signatureActionAllowed(actor, 'techArmor') && actor.statuses?.techArmor > EPSILON) facts.push(`Technoblindage ${actor.mediaId} : ${Math.ceil(actor.statuses.techArmor)} s`);
  if (signatureActionAllowed(actor, 'bioticCharge') && actor.statuses?.chargeExposure > EPSILON) facts.push(`Contact rapproché abstrait · exposition +15 % : ${Math.ceil(actor.statuses.chargeExposure)} s`);
  return facts;
}

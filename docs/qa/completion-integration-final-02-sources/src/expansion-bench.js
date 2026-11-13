// Resource experiments use real native orders on explicit abstract fixtures.
// They never equip a source character or grant a power, object or campaign flag.
import { ACTIONS, createBattle, performAction, tickBattle } from './combat.js';
import { canAccessContent } from './continuity.js';
import { getUniverseEquipment } from './universe-equipment.js';
import { getTool } from './tool-data.js';

const definitions = Object.freeze({
  'EQP-omni-outil': { kind: 'tool', parentRecordId: 'PWR-surcharge', equipmentId: 'omni-tool-upgraded', actionId: 'overload' },
  'EQP-amplificateur-biotique': { kind: 'tool', parentRecordId: 'PWR-projection', equipmentId: 'biotic-amp-upgraded', actionId: 'throw' },
  'ME3-EQP-BARREL': { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-AVENGER', equipmentId: 'ME3-EQP-BARREL', actionId: 'shoot' },
  'ME3-EQP-MAGAZINE': { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-AVENGER', equipmentId: 'ME3-EQP-MAGAZINE', actionId: 'reload' },
  'ME3-EQP-ULTRALIGHT': { kind: 'weapon-mod', parentRecordId: 'ME3-WPN-SHURIKEN', equipmentId: 'ME3-EQP-ULTRALIGHT', actionId: 'overload' },
  'ME2-EQP-THERMAL': { kind: 'thermal-clips', parentRecordId: 'ME2-WPN-AVENGER', actionId: 'reload' },
  'ME3-EQP-THERMAL': { kind: 'thermal-clips', parentRecordId: 'ME3-WPN-AVENGER', actionId: 'reload' },
  'ME3-EQP-GRENADE-STOCK': { kind: 'grenade-stock', parentRecordId: 'ME3-POW-FRAG', actionId: 'fragGrenade' },
  'MEA-EQP-POWER-CELLS': { kind: 'power-cells', parentRecordId: 'MEA-POW-FRAG', actionId: 'fragGrenade' },
});
const resourceFields = ['weaponType', 'weaponSystem', 'magazineCapacity', 'ammo', 'reserveAmmo'];
const resourceProfile = id => {
  const item = getUniverseEquipment(id);
  return item?.runtimeSupported && item.fact && item.kind === 'weapon' && item.weaponSystem === 'thermal-clip'
    && !item.requiresEdition && !item.weaponProfileId ? item : null;
};

export function canRunExpansionBench(entry, context) {
  const spec = definitions[entry?.id], bench = entry?.bench;
  if (!spec || !bench || Object.keys(bench).some(key => !Object.hasOwn(spec, key))
    || Object.entries(spec).some(([key, value]) => bench[key] !== value)
    || !canAccessContent(spec.parentRecordId, context).ok) return { ok: false, reason: 'Banc ou référence parent non attestés pour cette période.' };
  if (spec.kind === 'tool' && !getTool(spec.equipmentId)) return { ok: false, reason: 'Outil de prototype indisponible.' };
  if (['thermal-clips', 'weapon-mod'].includes(spec.kind) && !resourceProfile(spec.parentRecordId))
    return { ok: false, reason: 'Le parent conventionnel exact reste indisponible.' };
  if (spec.kind === 'weapon-mod') {
    const item = getUniverseEquipment(spec.equipmentId), parent = resourceProfile(spec.parentRecordId);
    if (!item?.runtimeSupported || item.kind !== 'weaponMod' || item.requiresEdition
      || !item.weaponTypes?.includes(parent.weaponType) || !item.weaponSystems?.includes(parent.weaponSystem))
      return { ok: false, reason: 'Compatibilité du module avec ce parent non établie.' };
  }
  return { ok: true, reason: null };
}

const snapshot = (battle, actionId) => {
  const actor = battle.actors[0], target = battle.actors[1];
  return { hp: actor.hp, shield: actor.shield, targetHp: target.hp, targetShield: target.shield,
    cooldown: actor.cooldowns[actionId] || 0, grenades: actor.grenadeCharges, atb: actor.atb,
    ...(actor.weaponSystem === 'thermal-clip' ? { capacity: actor.magazineCapacity, ammo: actor.ammo, reserve: actor.reserveAmmo } : {}),
  };
};
function fixture(entry, spec, options, enhanced) {
  const actor = { ...entry.simulation, id: 'bench:subject', name: 'Porteur abstrait déjà formé',
    atb: 100, powers: ['overload', 'throw', 'fragGrenade'].includes(spec.actionId) ? [spec.actionId] : [],
    mediaId: entry.record.mediaId };
  if (['thermal-clips', 'weapon-mod'].includes(spec.kind)) {
    const parent = resourceProfile(spec.parentRecordId);
    Object.assign(actor, Object.fromEntries(resourceFields.map(key => [key, parent[key]])));
    if (enhanced && spec.kind === 'weapon-mod') {
      const bonus = getUniverseEquipment(spec.equipmentId).bonuses;
      if (bonus.weaponDamageMultiplier) actor.weaponDamageMultiplier = bonus.weaponDamageMultiplier;
      if (bonus.powerCooldownMultiplier) actor.powerCooldownMultiplier = bonus.powerCooldownMultiplier;
      if (bonus.magazineCapacityMultiplier) actor.magazineCapacity = Math.min(256, Math.ceil(actor.magazineCapacity * bonus.magazineCapacityMultiplier));
    }
    if (spec.actionId === 'reload') {
      actor.reserveAmmo = parent.ammo + parent.reserveAmmo; actor.ammo = 0;
    }
  }
  if (enhanced && spec.kind === 'tool') Object.assign(actor, getTool(spec.equipmentId).bonuses);
  if (['grenade-stock', 'power-cells'].includes(spec.kind)) Object.assign(actor, { grenadeCapacity: 3, grenadeCharges: 3 });
  return createBattle({ party: [actor], enemies: [{ id: 'bench:target', name: 'Cible abstraite',
    hp: 2000, shield: spec.actionId === 'throw' ? 0 : 200, attack: 1, defense: 2, speed: .2,
    synthetic: true, powers: [] }], difficulty: options.difficulty, seed: options.seed, mode: 'active', medigel: 0 });
}
const order = (battle, actionId) => performAction(battle, { actorId: 'bench:subject', actionId,
  targetId: actionId === 'reload' ? 'bench:subject' : 'bench:target' });
function ready(battle) {
  for (let i = 0; i < 1000 && battle.actors[0].atb < 99.999 && !battle.winner; i++) tickBattle(battle, .1);
}

export function runExpansionBench(entry, context, options) {
  if (!canRunExpansionBench(entry, context).ok) throw new Error('Unavailable curated bench');
  const spec = definitions[entry.id], enhanced = fixture(entry, spec, options, true), before = snapshot(enhanced, spec.actionId);
  const actions = [];
  if (['grenade-stock', 'power-cells'].includes(spec.kind)) {
    for (let i = 0; i < 3; i++) { ready(enhanced); actions.push(order(enhanced, spec.actionId)); }
    const exhausted = snapshot(enhanced, spec.actionId);
    for (let i = 0; i < 100; i++) tickBattle(enhanced, .1);
    const afterTime = snapshot(enhanced, spec.actionId), fourth = order(enhanced, spec.actionId);
    if (!actions.every(action => action.ok) || fourth.ok || exhausted.grenades !== 0 || afterTime.grenades !== 0)
      throw new Error('Finite resource experiment did not execute correctly');
    return { kind: 'equipment-bench', outcome: 'observed', benchKind: spec.kind, actionId: spec.actionId,
      actionLabel: ACTIONS[spec.actionId].label,
      rows: [{ label: 'Charges disponibles', before: before.grenades, control: exhausted.grenades, sample: afterTime.grenades, unit: 'Après usage / après 10 s ATB' },
        { label: 'Ordres exécutés', before: 0, control: 3, sample: 3, unit: 'Quatrième ordre refusé' }],
      before, after: afterTime, actions: actions.length, rejectedFourthOrder: !fourth.ok, rejectionReason: fourth.reason,
      replenishmentObserved: false,
      note: 'Porteur de test préparé avec trois charges ATB. Le principe de réserve finie est testé ; quantités, pouvoir de test et ravitaillement ne certifient pas le modèle original.' };
  }
  const control = fixture(entry, spec, options, false), controlBefore = snapshot(control, spec.actionId);
  const first = order(enhanced, spec.actionId), second = order(control, spec.actionId);
  if (!first.ok || !second.ok) throw new Error('Native comparison order was rejected');
  const sample = snapshot(enhanced, spec.actionId), plain = snapshot(control, spec.actionId);
  const rows = spec.actionId === 'reload' ? [
    { label: 'Capacité du chargeur', before: before.capacity, control: plain.capacity, sample: sample.capacity, unit: 'Budget ATB' },
    { label: 'Munitions chargées', before: before.ammo, control: plain.ammo, sample: sample.ammo, unit: 'Munitions ATB' },
    { label: 'Réserve restante', before: before.reserve, control: plain.reserve, sample: sample.reserve, unit: 'Total conservé' },
  ] : [
    { label: 'Santé retirée à la cible', before: 0, control: controlBefore.targetHp - plain.targetHp, sample: before.targetHp - sample.targetHp, unit: 'Points ATB' },
    { label: 'Boucliers retirés à la cible', before: 0, control: controlBefore.targetShield - plain.targetShield, sample: before.targetShield - sample.targetShield, unit: 'Points ATB' },
    { label: 'Recharge du pouvoir', before: 0, control: plain.cooldown, sample: sample.cooldown, unit: 'Secondes ATB' },
  ];
  return { kind: 'equipment-bench', outcome: 'observed', benchKind: spec.kind, actionId: spec.actionId,
    actionLabel: ACTIONS[spec.actionId].label, before, after: sample, control: plain, rows,
    note: 'Même graine, deux porteurs de test abstraits distincts. Les effets viennent des tables ATB existantes, sans pouvoir accordé à un personnage ni bonus original certifié.' };
}

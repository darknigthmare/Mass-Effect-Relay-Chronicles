import { CREW, EQUIPMENT } from './game-data.js';
import { SLOTS, SLOT_LABELS, ITEMS, WEAPON_LABELS, ARMOR_LABELS, INVENTORY_CAPACITY, listInventory, listShop, equipmentFor, inventoryCount, itemCompatibility, canEquipItem, previewLoadout, getTrainingOptions } from './loadout.js';
import { getEquipmentProfile } from './character-data.js';

const TABS = [['loadout', 'Dotation'], ['inventory', 'Inventaire'], ['shop', 'Armurerie'], ['calibrations', 'Calibrations']];
const KINDS = [['all', 'Tout'], ['weapon', 'Armes'], ['armor', 'Armures'], ['weaponMod', 'Modules d’arme'], ['ammoMod', 'Munitions'], ['armorMod', 'Modules d’armure'], ['tool', 'Outils']];
const LEGACY_ARMOR_NOTICE = 'L’autorisation de porter cette armure prend fin si vous la retirez ou la remplacez. Une formation sera ensuite nécessaire.';
const signed = n => `${n > 0 ? '+' : ''}${Math.round(n * 100) / 100}`;
const pct = n => `${signed(n * 100)} %`;
const nameFor = (state, id) => id === 'shepard' ? state.name : CREW[id]?.name || id;
const escapeDefault = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function loadoutActors(state) {
  return ['shepard', ...state.recruited].filter(id => CREW[id] && (!state.lost.includes(id) || Object.values(equipmentFor(state, id)).some(Boolean)));
}
function bonusesText(item, state, actorId) {
  const b = item.bonuses, labels = [];
  if (b.attack) {
    const check = itemCompatibility(state, actorId, item.id);
    const attack = item.kind === 'weapon' && check.trained === false ? Math.floor(b.attack / 2) : b.attack;
    labels.push(`${signed(attack)} puissance${check.trained === false ? ' (sans entraînement)' : ''}`);
  }
  if (b.hp) labels.push(`${signed(b.hp)} santé`);
  if (b.shield) labels.push(`${signed(b.shield)} bouclier`);
  if (b.defense) labels.push(`${signed(b.defense)} défense`);
  if (b.weaponHeatMultiplier && b.weaponHeatMultiplier !== 1) labels.push(`${pct(b.weaponHeatMultiplier - 1)} chaleur`);
  if (b.weaponCoolingBonus) labels.push(`${signed(b.weaponCoolingBonus)} refroidissement/s`);
  if (b.syntheticDamageBonus) labels.push(`${pct(b.syntheticDamageBonus)} contre les synthétiques`);
  if (b.organicDamageBonus) labels.push(`${pct(b.organicDamageBonus)} contre les organiques`);
  if (b.shieldBypass) labels.push(`${Math.round(b.shieldBypass * 100)} % traverse les boucliers`);
  if (b.controlResistance) labels.push(`${Math.round(b.controlResistance * 100)} % de résistance aux contrôles`);
  if (b.bioticMultiplier && b.bioticMultiplier !== 1) labels.push(`${pct(b.bioticMultiplier - 1)} biotique`);
  if (b.techMultiplier && b.techMultiplier !== 1) labels.push(`${pct(b.techMultiplier - 1)} technologie`);
  return labels.join(' · ') || 'Statistiques de base';
}
function itemCategory(item) {
  return item.kind === 'weapon' ? WEAPON_LABELS[item.weaponType] : item.kind === 'armor' ? `Armure ${ARMOR_LABELS[item.armorWeight].toLowerCase()}` : SLOT_LABELS[item.slot];
}
function preview(item, state, actor, helpers, slot) {
  const comparison = previewLoadout(helpers.baseActorFor(actor.id, state), state, item.id, slot);
  if (!comparison.ok) return `<p class="eq-blocked">${helpers.esc(comparison.reason)}</p>`;
  const labels = { maxHp: 'santé', maxShield: 'bouclier', attack: 'puissance', defense: 'défense', weaponCoolingBonus: 'refroid./s' };
  const differences = Object.entries(labels).filter(([key]) => comparison.deltas[key]).map(([key, label]) => `<span class="${comparison.deltas[key] > 0 ? 'positive' : 'negative'}">${signed(comparison.deltas[key])} ${label}</span>`);
  const heat = comparison.deltas.weaponHeatMultiplier;
  if (heat) differences.push(`<span class="${heat < 0 ? 'positive' : 'negative'}">${pct(heat)} chaleur</span>`);
  for (const [key, label] of [['syntheticDamageBonus', 'synthétiques'], ['organicDamageBonus', 'organiques'], ['shieldBypass', 'traversée'], ['controlResistance', 'résistance'], ['bioticMultiplier', 'biotique'], ['techMultiplier', 'technologie']]) {
    const delta = comparison.deltas[key];
    if (delta) differences.push(`<span class="${delta > 0 ? 'positive' : 'negative'}">${pct(delta)} ${label}</span>`);
  }
  return `<div class="eq-comparison" aria-label="Comparaison avec la dotation actuelle">${differences.length ? differences.join('') : '<span>Aucun changement de statistiques.</span>'}</div>${comparison.warning ? `<p class="eq-warning">${helpers.esc(comparison.warning)}</p>` : ''}${returnedModulesNotice(comparison.returnedMods, helpers.esc)}`;
}
function itemSlots(item) {
  return item.slot === 'weaponMod' ? ['weaponMod', 'weaponMod2'] : item.slot === 'armorMod' ? ['armorMod', 'armorMod2'] : [item.slot];
}
function selectedSlot(item, state, actorId, ui) {
  const slots = itemSlots(item), requested = ui.equipmentSlots?.[`${actorId}:${item.id}`], current = equipmentFor(state, actorId);
  return slots.includes(requested) ? requested : slots.find(slot => current[slot] === item.id) || slots.find(slot => !current[slot]) || slots[0];
}
function returnedModulesNotice(ids, esc) {
  return ids?.length ? `<p class="eq-warning eq-returned-mods" data-eq-returned-mods="${esc(ids.join(','))}">Les modules actuels seront remis dans l’inventaire.</p>` : '';
}
function legacyArmorNotice(state, actorId, esc) {
  const armor = equipmentFor(state, actorId).armor;
  return getTrainingOptions(state, actorId).some(option => option.legacyArmor === armor && !option.trained && armor)
    ? `<p class="eq-warning" data-eq-legacy-armor="${esc(armor)}">${LEGACY_ARMOR_NOTICE}</p>` : '';
}
function itemCard(item, state, actor, helpers, shop, ui) {
  const esc = helpers.esc, current = equipmentFor(state, actor.id), slot = selectedSlot(item, state, actor.id, ui), selected = current[slot] === item.id;
  const canEquip = canEquipItem(state, actor.id, item.id, slot), compatibility = itemCompatibility(state, actor.id, item.id);
  const shopOpen = ['normandy', 'citadel'].includes(state.zone);
  const sellAllowed = !shop && item.available > 0 && shopOpen;
  return `<article class="eq-item ${selected ? 'eq-selected' : ''}" data-item="${esc(item.id)}">
    <div class="eq-item-top"><span class="eyebrow">${esc(itemCategory(item))}</span><span class="pill">Niv. ${item.level}</span></div>
    <h3>${esc(item.name)}</h3><p class="eq-manufacturer">${esc(item.manufacturer)}</p>
    <p class="eq-bonuses">${esc(bonusesText(item, state, actor.id))}</p><p class="eq-description">${esc(item.detail)}</p>
    ${itemSlots(item).length > 1 ? `<label class="eq-slot-select" for="eq-slot-${esc(actor.id)}-${esc(item.id)}"><span>Emplacement</span><select id="eq-slot-${esc(actor.id)}-${esc(item.id)}" data-eq-slot-selector data-item="${esc(item.id)}">${itemSlots(item).map(id => `<option value="${id}" ${id === slot ? 'selected' : ''}>${esc(SLOT_LABELS[id])}</option>`).join('')}</select></label>` : ''}
    <p class="eq-compatibility ${compatibility.ok ? 'positive' : 'eq-blocked'}" data-eq-compatibility>${compatibility.ok ? `Compatible avec ${esc(actor.name)}.` : esc(compatibility.reason)}</p>
    ${preview(item, state, actor, helpers, slot)}
    ${!shop && item.slot === 'armor' && canEquip.ok && !selected ? legacyArmorNotice(state, actor.id, esc) : ''}
    <div class="eq-item-bottom">${shop
      ? `<p class="eq-stock">${item.stock} en stock · ${item.owned} possédé${item.owned > 1 ? 's' : ''}${item.spectre ? ' · Spectre' : ''}</p><button class="secondary" data-do="eq-buy" data-id="${esc(item.id)}" ${item.canBuy ? '' : 'disabled'} aria-label="Acheter ${esc(item.name)} pour ${item.cost} crédits">Acheter pour le stock · ${item.cost} CR</button>${item.reason ? `<p class="eq-blocked">${esc(item.reason)}</p>` : ''}`
      : `<p class="eq-stock">${item.quantity} possédé${item.quantity > 1 ? 's' : ''} · ${item.available} libre${item.available > 1 ? 's' : ''}${item.actors.length ? `<br>Équipé : ${esc(item.actors.map(id => nameFor(state, id) + (state.lost.includes(id) ? ' (à récupérer)' : '')).join(', '))}` : ''}</p><div class="eq-actions"><button class="secondary" data-do="eq-equip" data-id="${esc(item.id)}" data-slot="${slot}" ${canEquip.ok ? '' : 'disabled'}>${selected ? 'Déjà équipé' : 'Équiper'}</button><button class="secondary" data-do="eq-sell" data-id="${esc(item.id)}" ${sellAllowed ? '' : 'disabled'} aria-label="Vendre un exemplaire de ${esc(item.name)} pour ${item.sell} crédits">Vendre · ${item.sell} CR</button></div>${!canEquip.ok && !selected ? `<p class="eq-blocked">${esc(canEquip.reason)}</p>` : ''}`}
    </div>
  </article>`;
}
function filters(ui, esc) {
  const kind = ui.equipmentKind || 'all';
  return `<div class="eq-filters" aria-label="Catégories d’équipement">${KINDS.map(([id, label]) => `<button class="eq-filter ${kind === id ? 'active' : ''}" data-do="eq-kind" data-id="${id}" aria-pressed="${kind === id}">${esc(label)}</button>`).join('')}</div>`;
}
function trainingProfile(state, actorId, esc) {
  const profile = getEquipmentProfile(actorId, state.classId), options = getTrainingOptions(state, actorId);
  if (!profile) return '';
  const weights = [...new Set([...profile.armorWeights, ...options.filter(option => option.trained).map(option => option.weight)])];
  return `<dl class="eq-training-profile"><div><dt>Armes maîtrisées</dt><dd>${esc(profile.weaponTraining.map(type => WEAPON_LABELS[type]).join(', ') || 'Aucune spécialisation d’arme')}</dd></div><div><dt>Armures autorisées</dt><dd>${esc(weights.map(weight => ARMOR_LABELS[weight]).join(', '))}</dd></div><div><dt>Outils spécialisés</dt><dd>${esc([profile.canUseOmniTool ? 'OmniTech' : null, profile.biotic ? 'Amplificateur biotique' : null].filter(Boolean).join(' · ') || 'Aucun')}</dd></div></dl>${options.length ? `<section class="eq-training" data-eq-training><h4>Formation d’armure</h4><p class="eq-description">${options[0].availablePoints} point${options[0].availablePoints > 1 ? 's' : ''} disponible${options[0].availablePoints > 1 ? 's' : ''}</p>${options.map(option => `<div class="eq-training-option" data-training-weight="${option.weight}"><strong>${esc(option.label)}</strong><p>${esc(option.reason || `Coût : ${option.cost} point.`)}</p>${option.legacyArmor && !option.trained ? `<p class="eq-warning" data-eq-legacy-armor="${esc(option.legacyArmor)}">${LEGACY_ARMOR_NOTICE}</p>` : ''}${option.trained ? '<span class="pill">Acquise</span>' : `<button class="secondary" data-do="eq-train" data-weight="${option.weight}" data-id="${option.weight}" ${option.canTrain ? '' : 'disabled'}>Apprendre · ${option.cost} point</button>`}</div>`).join('')}</section>` : ''}`;
}
function loadout(state, actor, helpers) {
  const esc = helpers.esc, slots = equipmentFor(state, actor.id), lost = state.lost.includes(actor.id);
  const portrait = actor.id === 'shepard' && state.appearance === 'female'
    ? `<div class="eq-portrait" aria-label="Shepard, apparence féminine"><svg viewBox="183 42 156 290" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${import.meta.env?.BASE_URL || '/'}assets/shepard-female-walk-atlas.png" width="1254" height="1254"/></svg></div>`
    : `<div class="eq-portrait crew-art" style="${helpers.portraitStyle(actor.id)}"></div>`;
  return `<div class="eq-layout"><div class="eq-profile">${portrait}<div class="eyebrow">${esc(CREW[actor.id].role)}</div><h3>${esc(actor.name)}</h3><p class="eq-description">${lost ? 'Les effets de cet équipier restent dans votre inventaire. Retirez-les pour les attribuer à un autre membre.' : 'Préparez un rôle précis pour chaque membre du commando.'}</p><div class="eq-stats">${[['maxHp', 'Santé'], ['maxShield', 'Bouclier'], ['attack', 'Puissance'], ['defense', 'Défense']].map(([key, label]) => `<div><b>${actor[key]}</b><span>${label}</span></div>`).join('')}</div><div class="eq-technical"><span>Chaleur des tirs <b>× ${actor.weaponHeatMultiplier.toFixed(2)}</b></span><span>Refroidissement <b>+${actor.weaponCoolingBonus}/s</b></span><span>Résistance aux contrôles <b>${Math.round(actor.controlResistance * 100)} %</b></span><span>Puissance biotique <b>× ${actor.bioticMultiplier.toFixed(2)}</b></span><span>Puissance technologique <b>× ${actor.techMultiplier.toFixed(2)}</b></span></div>${trainingProfile(state, actor.id, esc)}</div><div class="eq-slots">${SLOTS.map(slot => {
    const item = ITEMS[slots[slot]];
    return `<article class="eq-slot" data-slot="${slot}"><div><span class="eyebrow">${esc(SLOT_LABELS[slot])}</span><h4>${esc(item?.name || (['weapon', 'armor'].includes(slot) ? 'Dotation de base' : 'Aucun module'))}</h4><p>${item ? esc(bonusesText(item, state, actor.id)) : 'Aucun bonus supplémentaire.'}</p>${slot === 'armor' ? legacyArmorNotice(state, actor.id, esc) : ''}${returnedModulesNotice((slot === 'weapon' ? ['weaponMod', 'weaponMod2', 'ammoMod'] : slot === 'armor' ? ['armorMod', 'armorMod2'] : []).map(id => slots[id]).filter(Boolean), esc)}</div>${item ? `<button class="secondary" data-do="eq-unequip" data-id="${slot}">${lost ? 'Récupérer' : 'Retirer'}</button>` : '<span class="eq-empty">—</span>'}</article>`;
  }).join('')}<button class="primary" data-do="eq-tab" data-id="inventory">Choisir dans l’inventaire →</button><p class="eq-description">Les changements se répercutent sur le prochain combat. Les calibrations permanentes restent attachées au personnage.</p></div></div>`;
}
function calibrations(state, actor, helpers) {
  const esc = helpers.esc, upgrades = state.upgrades[actor.id] || {}, available = !state.lost.includes(actor.id) && ['normandy', 'citadel'].includes(state.zone);
  return `<div class="eq-calibrations"><p class="eq-intro">Les calibrations sont des améliorations permanentes du personnage. Elles s’ajoutent aux objets équipés.</p>${EQUIPMENT.map(item => {
    const cost = helpers.upgradePrice ? helpers.upgradePrice(state, item.id) : item.cost;
    const capped = item.stat === 'medigel' ? state.medigel >= 9 : (upgrades[`${item.stat}Count`] || 0) >= 5;
    return `<article class="eq-calibration"><div><h3>${esc(item.name)}</h3><p>${esc(item.detail)}</p><small>${item.stat === 'medigel' ? `${state.medigel}/9 doses` : `Niveau ${upgrades[`${item.stat}Count`] || 0}/5`} · ${cost} CR${cost < item.cost ? ' · Remise médicale appliquée' : ''}</small></div><button class="secondary" data-do="buy" data-id="${item.id}" ${!available || state.credits < cost || capped ? 'disabled' : ''} aria-label="Acheter ${esc(item.name)} pour ${cost} crédits">${capped ? 'Maximum' : 'Acheter'}</button></article>`;
  }).join('')}${!available ? '<p class="eq-blocked">Les calibrations s’achètent au Normandy et à la Citadelle, pour un équipier vivant.</p>' : ''}</div>`;
}

/** Returns body markup only. Event delegation and saving remain in main.js. */
export function renderLoadoutScreen(state, ui, options) {
  const helpers = { esc: escapeDefault, ...options };
  const esc = helpers.esc, actors = loadoutActors(state), selected = actors.includes(ui.equipmentActor) ? ui.equipmentActor : 'shepard';
  const actor = helpers.actorFor(selected, state);
  // Base helpers may not yet expose effects; avoid a broken preview during migration.
  actor.weaponHeatMultiplier ??= 1; actor.weaponCoolingBonus ??= 0; actor.controlResistance ??= 0; actor.bioticMultiplier ??= 1; actor.techMultiplier ??= 1;
  const tab = TABS.some(([id]) => id === ui.equipmentTab) ? ui.equipmentTab : 'loadout', kind = ui.equipmentKind || 'all';
  let body;
  if (tab === 'loadout') body = loadout(state, actor, helpers);
  else if (tab === 'calibrations') body = calibrations(state, actor, helpers);
  else {
    const entries = (tab === 'shop' ? listShop(state) : listInventory(state)).filter(item => kind === 'all' || (kind === 'tool' ? ['omniTool', 'bioticAmp'].includes(item.kind) : item.kind === kind));
    body = `${filters(ui, esc)}<p class="eq-intro">${tab === 'shop' ? 'Les achats rejoignent l’inventaire partagé. Sélectionnez ensuite un équipier pour les équiper.' : 'Un exemplaire ne peut équiper qu’une personne. Retirez les objets pour les transférer ou les vendre.'}</p><div class="eq-catalogue">${entries.map(item => itemCard(item, state, actor, helpers, tab === 'shop', ui)).join('') || '<p class="eq-empty-list">Aucun objet dans cette catégorie.</p>'}</div>`;
  }
  return `<div class="loadout-screen"><div class="eq-roster" aria-label="Équipier à équiper">${actors.map(id => `<button class="eq-actor ${id === selected ? 'active' : ''}" data-do="eq-actor" data-id="${id}" aria-pressed="${id === selected}">${esc(nameFor(state, id))}${state.lost.includes(id) ? '<small>Récupération</small>' : ''}</button>`).join('')}</div><div class="eq-toolbar"><div class="eq-tabs" aria-label="Écrans d’équipement">${TABS.map(([id, label]) => `<button class="tab ${id === tab ? 'active' : ''}" data-do="eq-tab" data-id="${id}" aria-pressed="${id === tab}">${label}</button>`).join('')}</div><span class="eq-capacity">${inventoryCount(state)}/${INVENTORY_CAPACITY} objets</span></div><div class="eq-content">${body}</div><p class="eq-footnote">Noms de matériel ME1 · valeurs et seuils adaptés au combat ATB.</p></div>`;
}

import { CLASSES, actorFor } from './game-data.js';
import { ITEMS, GEAR_CATALOG, SLOT_LABELS, WEAPON_LABELS, ARMOR_LABELS, listInventory, itemCompatibility } from './loadout.js';
import { CUSTOMIZATION_OPTIONS, createCustomizationDraft, customizationPreviewState, validateCustomizationDraft, getCustomizationPalette } from './customization.js';
import { renderCustomizationSprite } from './customization-render.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const signed = value => `${value > 0 ? '+' : ''}${Math.round(value * 100) / 100}`;
const BASE = `${import.meta.env?.BASE_URL || './'}assets/`;
const VIEWS = [['front', 'Face'], ['right', 'Profil droit'], ['back', 'Dos'], ['left', 'Profil gauche']];
const TABS = [['character', '01', 'Personnage'], ['armor', '02', 'Armure'], ['weapons', '03', 'Armes']];
const images = new Map();

export const CUSTOMIZATION_FIELDS = Object.freeze({
  'face.preset': 'facePresets', 'face.skinTone': 'skinTones', 'face.eyeColor': 'eyeColors',
  'face.hairColor': 'hairColors', 'face.hairStyle': 'hairStyles',
  'armor.primary': 'armorColors', 'armor.secondary': 'armorColors', 'armor.accent': 'armorColors',
  'armor.pattern': 'patterns', 'armor.finish': 'finishes', 'armor.helmet': 'helmetModes',
});

export function customizationHasChanges(state, draft) {
  return JSON.stringify(createCustomizationDraft(state)) !== JSON.stringify(draft);
}

function optionsFor(key) { return CUSTOMIZATION_OPTIONS[key] || []; }
function optionLabel(key, id) { return optionsFor(key).find(option => option.id === id)?.label || id; }
function fieldValue(draft, field) { const [group, key] = field.split('.'); return draft.customization[group][key]; }

function choices(draft, field, label, swatches = false) {
  const key = CUSTOMIZATION_FIELDS[field], options = optionsFor(key), value = fieldValue(draft, field);
  return `<fieldset class="custom-field"><legend>${label}<span>${esc(optionLabel(key, value))}</span></legend><div class="${swatches ? 'custom-swatches' : 'custom-options'}" role="group" aria-label="${label}">${options.map(option => `<button type="button" class="${swatches ? 'custom-swatch' : 'custom-option'} ${value === option.id ? 'selected' : ''}" data-do="custom-choice" data-field="${field}" data-id="${esc(option.id)}" aria-label="${label} : ${esc(option.label)}" aria-pressed="${value === option.id}" title="${esc(option.label)}" ${swatches ? `style="--swatch:${esc(option.color)}"` : ''}>${swatches ? `<span class="custom-swatch-fill"></span><span class="sr-custom">${esc(option.label)}</span>${value === option.id ? '<span class="custom-check" aria-hidden="true">✓</span>' : ''}` : esc(option.label)}</button>`).join('')}</div></fieldset>`;
}

function characterControls(draft) {
  return `<div class="custom-section-title"><span>Identité visuelle</span><small>Shepard</small></div>
    <fieldset class="custom-field"><legend>Apparence</legend><div class="custom-options">${[['male', 'Masculine'], ['female', 'Féminine']].map(([id, label]) => `<button class="custom-option ${draft.appearance === id ? 'selected' : ''}" data-do="custom-appearance" data-id="${id}" aria-pressed="${draft.appearance === id}">${label}</button>`).join('')}</div></fieldset>
    ${choices(draft, 'face.preset', 'Traits du visage')}
    ${choices(draft, 'face.skinTone', 'Teint', true)}
    ${choices(draft, 'face.eyeColor', 'Iris', true)}
    ${choices(draft, 'face.hairStyle', 'Coiffure')}
    ${choices(draft, 'face.hairColor', 'Cheveux', true)}`;
}

function itemName(id, slot) { return ITEMS[id]?.name || (['weapon', 'armor'].includes(slot) ? 'Dotation de base' : 'Aucun module'); }
function itemCategory(item) {
  return item.slot === 'weapon' ? WEAPON_LABELS[item.weaponType] : item.slot === 'armor' ? `Armure ${ARMOR_LABELS[item.armorWeight].toLowerCase()}` : SLOT_LABELS[item.slot];
}

function equipmentList(state, ui, slots) {
  const draft = ui.customizationDraft;
  const selectedSlot = slots.includes(ui.customSlot) ? ui.customSlot : slots[0];
  const owned = new Map(listInventory(state).map(item => [item.id, item]));
  const entries = GEAR_CATALOG.filter(item => item.slot === selectedSlot && (ui.customShowAll || owned.has(item.id)) && (selectedSlot !== 'weapon' || !ui.customWeaponFilter || ui.customWeaponFilter === 'all' || item.weaponType === ui.customWeaponFilter));
  const trial = id => validateCustomizationDraft(state, { ...draft, equipment: { ...draft.equipment, [selectedSlot]: id } });
  return `<div class="custom-slot-tabs" role="group" aria-label="Emplacements">${slots.map(slot => `<button class="custom-slot ${selectedSlot === slot ? 'selected' : ''}" data-do="custom-slot" data-id="${slot}" aria-pressed="${selectedSlot === slot}"><span>${esc(SLOT_LABELS[slot])}</span><small>${esc(itemName(draft.equipment[slot], slot))}</small></button>`).join('')}</div>
    ${selectedSlot === 'weapon' ? `<label class="custom-filter">Catégorie<select id="custom-weapon-filter"><option value="all">Toutes les armes</option>${Object.entries(WEAPON_LABELS).map(([id, label]) => `<option value="${id}" ${ui.customWeaponFilter === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>` : ''}
    <div class="custom-list-heading"><span>${entries.length} référence${entries.length > 1 ? 's' : ''}</span><button data-do="custom-show-all" aria-pressed="${!!ui.customShowAll}">${ui.customShowAll ? 'Voir mes objets' : 'Tout le catalogue'}</button></div>
    <div class="custom-item-list" aria-label="${esc(SLOT_LABELS[selectedSlot])} disponibles">${entries.map(item => {
      const selected = draft.equipment[selectedSlot] === item.id, validation = trial(item.id), stock = owned.get(item.id);
      return `<article class="custom-item ${selected ? 'selected' : ''} ${ui.customItem === item.id ? 'inspected' : ''}" data-custom-item="${item.id}"><button class="custom-item-info" data-do="custom-inspect" data-id="${item.id}" aria-label="Inspecter ${esc(item.name)}"><span class="custom-item-type">${esc(itemCategory(item))} · niv. ${item.level}</span><strong>${esc(item.name)}</strong><small>${stock ? `${stock.quantity} possédé${stock.quantity > 1 ? 's' : ''}` : 'À acquérir'}${item.spectre ? ' · Spectre' : ''}</small></button><button class="custom-equip" data-do="custom-equip" data-slot="${selectedSlot}" data-id="${item.id}" ${selected || !validation.ok ? 'disabled' : ''} aria-label="${selected ? 'Sélectionné' : 'Préparer'} : ${esc(item.name)}" title="${esc(selected ? 'Déjà sélectionné' : validation.reason || 'Préparer cet objet')}">${selected ? '✓' : '+'}</button>${!selected && !validation.ok ? `<p class="custom-item-reason">${esc(validation.reason)}</p>` : ''}</article>`;
    }).join('') || '<p class="custom-empty">Aucun objet possédé dans cette catégorie. Consultez l’Armurerie pour en acquérir.</p>'}</div>
    <button class="custom-remove" data-do="custom-equip" data-slot="${selectedSlot}" data-id="" ${draft.equipment[selectedSlot] ? '' : 'disabled'}>Retirer ${selectedSlot === 'armor' ? 'l’armure' : selectedSlot === 'weapon' ? 'l’arme' : 'le module'}</button>`;
}

function armorControls(state, ui) {
  const draft = ui.customizationDraft;
  return `<div class="custom-section-title"><span>Protection & apparence</span><small>Ensemble complet</small></div>
    ${equipmentList(state, ui, ['armor', 'armorMod'])}
    <details class="custom-colors" open><summary>Revêtement de l’armure</summary>
    ${choices(draft, 'armor.primary', 'Couleur principale', true)}
    ${choices(draft, 'armor.secondary', 'Couleur secondaire', true)}
    ${choices(draft, 'armor.accent', 'Marquages', true)}
    ${choices(draft, 'armor.pattern', 'Motif')}
    ${choices(draft, 'armor.finish', 'Finition')}
    ${choices(draft, 'armor.helmet', 'Casque')}
    </details>`;
}

/** A vector portrait study; the game's existing sprite silhouette is shown separately. */
export function customizationFaceSVG(draft, prefix = 'custom-face') {
  const face = draft.customization.face, armor = draft.customization.armor, palette = getCustomizationPalette(draft.customization);
  const female = draft.appearance === 'female', veteran = face.preset === 'veteran', angular = veteran || face.preset === 'colonist';
  const spacer = face.preset === 'spacer';
  const jaw = female ? (angular ? 50 : spacer ? 33 : 39) : (angular ? 65 : spacer ? 45 : 56), cheeks = female ? (spacer ? 60 : 66) : (spacer ? 69 : 76);
  const hair = {
    cropped: 'M108 153Q93 89 142 67Q201 39 250 70Q283 90 280 153L269 116Q225 88 161 105L121 124Z',
    short: 'M103 176Q80 105 121 71Q155 29 219 46Q288 44 287 132L271 178L260 114Q206 136 158 95L123 132L120 179Z',
    swept: 'M103 183Q72 115 117 65Q162 18 226 44Q290 39 292 128L273 181L264 116Q221 139 170 93Q157 141 117 150L119 185Z',
    tied: 'M101 177Q86 125 105 88Q122 39 193 38Q259 38 282 82Q304 127 281 181L268 150L263 109Q226 121 184 87L119 126L118 177Z',
  }[face.hairStyle] || '';
  return `<svg viewBox="0 0 390 440" class="custom-face-art" role="img" aria-label="Portrait de conception ${female ? 'féminin' : 'masculin'}, ${esc(optionLabel('facePresets', face.preset))}"><defs>
    <linearGradient id="${prefix}-skin"><stop stop-color="${palette.skin}"/><stop offset=".56" stop-color="${palette.skin}"/><stop offset="1" stop-color="#241c22"/></linearGradient>
    <linearGradient id="${prefix}-armor" x2=".8" y2="1"><stop stop-color="${palette.secondary}"/><stop offset=".5" stop-color="${palette.primary}"/><stop offset="1" stop-color="#0b1520"/></linearGradient>
    <radialGradient id="${prefix}-light"><stop stop-color="#90d8e0" stop-opacity=".15"/><stop offset="1" stop-color="#90d8e0" stop-opacity="0"/></radialGradient>
    </defs><circle cx="195" cy="205" r="180" fill="url(#${prefix}-light)"/>
    <path d="M25 440L36 343Q78 306 143 291L155 246H235L248 291Q318 307 354 343L372 440Z" fill="url(#${prefix}-armor)" stroke="#a4bccc" stroke-opacity=".36"/>
    <path d="M150 260L153 292L194 323L238 290L237 256" fill="url(#${prefix}-skin)"/>
    <path d="M144 288L194 322L242 287L258 306L231 346H157L131 309Z" fill="#101b25" stroke="#9cafbb" stroke-opacity=".35"/>
    <path d="M121 151Q108 159 116 184L129 196M267 151Q281 159 273 185L260 198" fill="${palette.skin}" stroke="#59453f"/>
    <path d="M${195 - cheeks} 132Q117 83 161 77Q225 63 265 111L${195 + cheeks} 163L${195 + jaw} 231Q232 269 195 280Q157 268 ${195 - jaw} 231Z" fill="url(#${prefix}-skin)" stroke="#bfa898" stroke-opacity=".3"/>
    <path d="M132 163Q155 149 174 159M214 158Q237 147 258 160" fill="none" stroke="${palette.hair}" stroke-width="${veteran ? 9 : 7}" stroke-linecap="round"/>
    <path d="M133 174Q154 162 175 174Q154 186 133 174M214 173Q235 161 257 173Q235 186 214 173" fill="#b3b7ac"/>
    <g fill="${palette.eyes}"><ellipse cx="155" cy="174" rx="8" ry="7"/><ellipse cx="235" cy="173" rx="8" ry="7"/></g>
    <g fill="#0a141b"><ellipse cx="155" cy="174" rx="3.5" ry="6"/><ellipse cx="235" cy="173" rx="3.5" ry="6"/></g>
    <g fill="#eff5f7"><circle cx="153" cy="172" r="1.5"/><circle cx="233" cy="171" r="1.5"/></g>
    <path d="M192 174L180 209Q192 216 205 210" fill="none" stroke="#4d3b38" stroke-opacity=".5" stroke-width="3"/>
    <path d="M164 238Q194 ${female ? 229 : 234} 225 236Q195 251 164 238" fill="#794d49" fill-opacity=".75"/>
    <path d="M169 238L219 237M174 257Q194 263 214 255" fill="none" stroke="#372c30" stroke-opacity=".3" stroke-width="2"/>
    ${veteran ? '<path d="M139 185L149 205L157 218M138 189L147 188M145 201L155 198" fill="none" stroke="#dfb3a6" stroke-width="2" opacity=".7"/>' : ''}
    ${face.hairStyle === 'tied' ? `<path d="M269 103Q317 106 299 191Q282 203 285 256L266 228L277 146Z" fill="${palette.hair}"/>` : ''}<path d="${hair}" fill="${palette.hair}"/><path d="M127 94Q177 62 245 80" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="5"/>
    <path d="M49 350L115 323L145 369L137 408H47Z M265 369L287 325L344 353L349 409H270Z" fill="${palette.primary}" stroke="#a9c2cb" stroke-opacity=".35"/>
    <path d="M67 345L81 339L110 403H96Z" fill="${palette.accent}"/><path d="M85 337L91 334L121 403H115Z" fill="#dfdfd4"/>
    <path d="M151 368H241L254 429H137Z" fill="${palette.secondary}" opacity=".8" stroke="#bed4e0" stroke-opacity=".25"/>
    <text x="166" y="399" fill="#e2edf1" font-size="22" font-family="Arial,sans-serif" font-weight="bold">N<tspan fill="${palette.accent}">7</tspan></text>
    ${armor.helmet !== 'hidden' && armor.helmet !== 'off' ? `<path d="M117 167L127 118Q191 77 262 120L277 168L263 226L237 245H154L125 224Z" fill="${palette.primary}" fill-opacity=".93" stroke="#a5c3d1" stroke-opacity=".6"/><path d="M126 161Q193 144 269 161L259 190Q195 203 135 187Z" fill="#68b9d1" fill-opacity=".7"/><path d="M156 223H236" stroke="${palette.secondary}" stroke-width="8"/>` : ''}
    </svg>`;
}

function weaponDiagram(item) {
  const type = item?.weaponType || 'assault', short = type === 'pistol', sniper = type === 'sniper', shotgun = type === 'shotgun';
  return `<svg viewBox="0 0 400 150" class="custom-weapon-diagram" role="img" aria-label="Schéma de catégorie : ${esc(WEAPON_LABELS[type])}"><defs><linearGradient id="custom-weapon-metal" x2="0" y2="1"><stop stop-color="#8398a5"/><stop offset=".44" stop-color="#344959"/><stop offset="1" stop-color="#142430"/></linearGradient></defs><path d="M${short ? 114 : 48} 58L${short ? 155 : 88} 47H${short ? 236 : 290}L${short ? 259 : 308} 65V85H${short ? 192 : 243}L${short ? 170 : 222} 116H${short ? 146 : 196}L${short ? 153 : 207} 84H${short ? 114 : 100}L${short ? 105 : 70} 103H${short ? 92 : 37}Z" fill="url(#custom-weapon-metal)" stroke="#90b5c4" stroke-width="1.5"/><path d="M${short ? 235 : 283} 60H${sniper ? 379 : short ? 286 : 350}V76H${short ? 235 : 283}Z" fill="#324754" stroke="#9ebbc8"/><path d="M${short ? 129 : 117} 56H${short ? 206 : 248}V64H${short ? 129 : 117}Z" fill="#b0c3c8"/><path d="M${short ? 135 : 143} 69H${short ? 183 : 203}" stroke="#e16758" stroke-width="5"/>${sniper ? '<path d="M160 34H246V45H160Z" fill="#6d8999"/><rect x="171" y="28" width="61" height="15" rx="5" fill="#233b4b" stroke="#9bb8c5"/>' : ''}${shotgun ? '<path d="M248 87H344V96H248Z" fill="#3c5666" stroke="#86a1af"/>' : ''}<path d="M27 132H376" stroke="#7190a2" stroke-opacity=".25"/><text x="200" y="145" text-anchor="middle" fill="#90acbc" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">${esc(WEAPON_LABELS[type].toUpperCase())}</text></svg>`;
}

function previewMarkup(state, ui) {
  const draft = ui.customCompare ? createCustomizationDraft(state) : ui.customizationDraft, tab = ui.customTab;
  const armor = ITEMS[draft.equipment.armor], weapon = ITEMS[draft.equipment.weapon];
  return `<section class="customization-preview ${tab === 'character' ? 'custom-portrait-mode' : ''}" aria-label="Aperçu de la personnalisation" data-preview-appearance="${draft.appearance}" data-preview-mode="${ui.customCompare ? 'current' : 'draft'}">
    <div class="custom-preview-top"><span>${ui.customCompare ? 'Configuration actuelle' : 'Aperçu des modifications'}</span><span class="custom-n7">N<span>7</span></span></div>
    <div class="custom-stage"><div class="custom-stage-grid"></div><div class="custom-orbit custom-orbit-one"></div><div class="custom-orbit custom-orbit-two"></div>
    ${tab === 'character' ? `<div class="custom-portrait-frame">${customizationFaceSVG(draft)}<span class="custom-portrait-caption">Portrait de conception 2D</span></div><div class="custom-terrain-preview"><canvas class="custom-sprite-canvas" data-custom-canvas width="360" height="480" role="img" aria-label="Sprite de terrain personnalisé"></canvas><span>Sprite de terrain</span></div>` : `<canvas class="custom-sprite-canvas" data-custom-canvas width="720" height="900" role="img" aria-label="Aperçu du sprite de Shepard avec les couleurs choisies"></canvas>`}
    <p class="custom-preview-loading" data-preview-status role="status">Chargement de l’aperçu…</p>
    </div>
    <div class="custom-preview-identity"><div class="eyebrow">${draft.appearance === 'female' ? 'Commandante' : 'Commandant'} · ${esc(CLASSES[state.classId].name)}</div><h3>${esc(state.name)}</h3><p>${esc(tab === 'weapons' ? weapon?.name || 'Dotation de base' : armor?.name || 'Dotation de base')}</p></div>
    <div class="custom-view-controls" aria-label="Vue du sprite">${VIEWS.map(([id, label]) => `<button data-do="custom-view" data-id="${id}" aria-pressed="${(ui.customView || 'front') === id}" aria-label="Vue ${label.toLowerCase()}" class="${(ui.customView || 'front') === id ? 'selected' : ''}">${label}</button>`).join('')}</div>
    ${tab === 'weapons' ? `<div class="custom-equipped-weapon">${weaponDiagram(weapon)}<span>Schéma de catégorie</span></div>` : ''}
    <p class="custom-render-note">${tab === 'character' ? 'Traits et coiffure sur le portrait. Teint et couleurs repris en jeu.' : 'Couleurs affichées sur la tenue N7. Les objets sélectionnés déterminent les bonus.'}${draft.customization.armor.helmet === 'combat' ? ' Casque présenté en situation de combat.' : ''}</p>
    </section>`;
}

function statsMarkup(state, ui) {
  const preview = customizationPreviewState(state, ui.customizationDraft), current = actorFor('shepard', state), proposed = preview ? actorFor('shepard', preview) : current;
  const stats = [['maxHp', 'Santé', 600, false], ['maxShield', 'Bouclier', 400, false], ['attack', 'Puissance', 100, false], ['defense', 'Défense', 50, false], ['weaponHeatMultiplier', 'Chaleur / tir', 2, true], ['weaponCoolingBonus', 'Refroidissement / s', 10, false], ['syntheticDamageBonus', 'Dégâts synthétiques', 1, false], ['organicDamageBonus', 'Dégâts organiques', 1, false], ['shieldBypass', 'Traversée bouclier', 1, false], ['controlResistance', 'Résistance contrôle', 1, false]];
  const percent = key => ['syntheticDamageBonus', 'organicDamageBonus', 'shieldBypass', 'controlResistance'].includes(key);
  const display = (key, value) => percent(key) ? `${Math.round(value * 100)} %` : key === 'weaponHeatMultiplier' ? `× ${value.toFixed(2)}` : Math.round(value * 100) / 100;
  const detailed = ui.customItem && ITEMS[ui.customItem] ? ITEMS[ui.customItem] : ITEMS[ui.customizationDraft.equipment[ui.customTab === 'armor' ? 'armor' : 'weapon']];
  const preparedWeapon = ui.customizationDraft.equipment.weapon, training = preparedWeapon ? itemCompatibility(state, 'shepard', preparedWeapon).warning : null;
  return `<aside class="custom-inspector"><div class="custom-section-title"><span>Profil de combat</span><small>Niveau ${Math.floor(state.xp / 300) + 1}</small></div>
    <p class="custom-stats-caption">Dotation actuelle <span>→ Aperçu</span></p><div class="custom-stats">${stats.filter(([key], index) => index < 6 || current[key] || proposed[key]).map(([key, label, max, lower]) => {
      const before = current[key] ?? (key === 'weaponHeatMultiplier' ? 1 : 0), after = proposed[key] ?? (key === 'weaponHeatMultiplier' ? 1 : 0), diff = after - before;
      return `<div class="custom-stat" data-stat="${key}" data-before="${before}" data-after="${after}"><div><span>${label}</span><b>${display(key, before)}<span> → </span>${display(key, after)}</b></div><div class="custom-stat-bar"><i style="width:${Math.min(100, before / max * 100)}%"></i><i class="${diff && (lower ? diff < 0 : diff > 0) ? 'improved' : diff ? 'reduced' : ''}" style="width:${Math.min(100, after / max * 100)}%"></i></div>${diff ? `<small class="${lower ? diff < 0 ? 'positive' : 'negative' : diff > 0 ? 'positive' : 'negative'}">${signed(diff * (percent(key) ? 100 : 1))}${percent(key) ? ' points' : ''}</small>` : ''}</div>`;
    }).join('')}</div>${training ? `<p class="custom-training-warning" role="status">${esc(training)}</p>` : ''}
    ${detailed ? `<section class="custom-item-detail"><span class="eyebrow">${esc(itemCategory(detailed))}</span><h4>${esc(detailed.name)}</h4><p class="custom-maker">${esc(detailed.manufacturer)}</p><p>${esc(detailed.detail)}</p><dl><div><dt>Niveau requis</dt><dd>${detailed.level}</dd></div><div><dt>Emplacement</dt><dd>${esc(SLOT_LABELS[detailed.slot])}</dd></div>${detailed.spectre ? '<div><dt>Accès</dt><dd>Spectre</dd></div>' : ''}</dl></section>` : ''}
    <section class="custom-loadout-summary"><h4>Configuration préparée</h4>${Object.entries(ui.customizationDraft.equipment).map(([slot, id]) => `<p><span>${esc(SLOT_LABELS[slot])}</span><b>${esc(itemName(id, slot))}</b></p>`).join('')}</section>
    <p class="custom-game-note">Les statistiques tiennent compte de votre classe, de votre niveau et de vos calibrations. Les couleurs ne donnent aucun bonus.</p></aside>`;
}

/** The caller owns the draft, all mutation, persistence, and focus management. */
export function renderCustomizationScreen(state, ui) {
  const dirty = customizationHasChanges(state, ui.customizationDraft), tab = TABS.some(([id]) => id === ui.customTab) ? ui.customTab : 'character';
  const controls = tab === 'character' ? characterControls(ui.customizationDraft) : tab === 'armor' ? armorControls(state, ui) : `<div class="custom-section-title"><span>Armement & modules</span><small>Matériel ME1</small></div>${equipmentList(state, ui, ['weapon', 'weaponMod', 'ammoMod'])}`;
  return `<div class="custom-toolbar"><nav class="custom-tabs" aria-label="Sections de personnalisation">${TABS.map(([id, number, label]) => `<button data-do="custom-tab" data-id="${id}" class="${tab === id ? 'selected' : ''}" aria-pressed="${tab === id}"><small>${number}</small>${label}</button>`).join('')}</nav><div class="custom-draft-status ${dirty ? 'dirty' : ''}" role="status"><i></i>${dirty ? 'Modifications en attente' : 'Configuration actuelle'}</div></div>
    <div class="custom-workspace"><div class="custom-controls" data-custom-tab="${tab}">${controls}</div>${previewMarkup(state, { ...ui, customTab: tab })}${statsMarkup(state, ui)}</div>
    <div class="custom-context"><span>Atelier visuel de Relay Chronicles</span><p>Armure complète et modules ME1. Revêtements et retouche en cours de partie : extensions cosmétiques de cette adaptation.</p></div>`;
}

export function renderCustomizationFooter(state, ui) {
  const result = validateCustomizationDraft(state, ui.customizationDraft), dirty = customizationHasChanges(state, ui.customizationDraft);
  return `<div class="custom-footer-tools"><button class="secondary" data-do="custom-compare" aria-pressed="${!!ui.customCompare}">${ui.customCompare ? 'Revenir à l’aperçu' : 'Comparer à l’actuel'}</button><button class="custom-reset" data-do="custom-reset" ${dirty ? '' : 'disabled'}>Réinitialiser le brouillon</button></div><div class="custom-footer-confirm"><button class="secondary" data-do="custom-cancel">Annuler</button><button class="primary" data-do="custom-apply" ${result.ok ? '' : 'disabled'}>${ui.customCreation ? 'Valider le personnage' : 'Appliquer'}</button></div>${result.ok ? '' : `<p class="custom-error" role="alert">${esc(result.reason)}</p>`}`;
}

async function loadImage(file) {
  if (!images.has(file)) images.set(file, new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error(`Aperçu indisponible : ${file}`)); img.src = `${BASE}${file}`; }));
  return images.get(file);
}

function frameFor(appearance, direction) {
  if (appearance === 'female' && typeof __RELAY_FEMSHEP_ANIMATION__ !== 'undefined') {
    const config = __RELAY_FEMSHEP_ANIMATION__;
    return { file: config.file, rect: config.frames.find(frame => frame.direction === direction && frame.index === 0)?.rect || config.frames[0].rect };
  }
  const frames = { front: [46, 1, 298, 313], back: [46, 316, 298, 304], right: [46, 622, 298, 297], left: [46, 921, 298, 318] };
  return { file: 'shepard-walk-atlas.png', rect: frames[direction] || frames.front };
}

export async function paintCustomizationPreview(root, state, ui) {
  const target = root.querySelector('[data-custom-canvas]'); if (!target) return;
  const status = root.querySelector('[data-preview-status]');
  const draft = ui.customCompare ? createCustomizationDraft(state) : ui.customizationDraft;
  const direction = ui.customView || 'front', frame = frameFor(draft.appearance, direction);
  try {
    const source = await loadImage(frame.file); if (!target.isConnected) return;
    const crop = document.createElement('canvas'); crop.width = frame.rect[2]; crop.height = frame.rect[3];
    crop.getContext('2d').drawImage(source, ...frame.rect, 0, 0, crop.width, crop.height);
    const tinted = renderCustomizationSprite(crop, draft.customization, { appearance: draft.appearance, direction, inCombat: draft.customization.armor.helmet === 'combat' });
    const context = target.getContext('2d'), pixels = tinted.getContext('2d').getImageData(0, 0, tinted.width, tinted.height);
    let left = tinted.width, top = tinted.height, right = 0, bottom = 0;
    for (let y = 0; y < tinted.height; y++) for (let x = 0; x < tinted.width; x++) if (pixels.data[(y * tinted.width + x) * 4 + 3] > 80) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    if (right <= left || bottom <= top) { left = 0; top = 0; right = tinted.width - 1; bottom = tinted.height - 1; }
    const width = right - left + 1, height = bottom - top + 1, scale = Math.min(target.width * .76 / width, target.height * .91 / height);
    context.clearRect(0, 0, target.width, target.height); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(tinted, left, top, width, height, (target.width - width * scale) / 2, target.height * .96 - height * scale, width * scale, height * scale);
    target.dataset.ready = 'true'; target.dataset.direction = direction; target.dataset.palette = JSON.stringify(getCustomizationPalette(draft.customization));
    if (status) { status.textContent = ''; status.hidden = true; }
  } catch (error) { if (status?.isConnected) { status.textContent = error.message; status.classList.add('error'); } }
}

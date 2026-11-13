import { listHorizonFleet, getHorizonFleetFrame } from './horizon-fleet.js';
import { listHorizonFauna, getHorizonFaunaFrame } from './horizon-fauna.js';
import { atlasFrameSVG } from './horizon-ui.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

export function renderHorizonArchive(state, { kind = 'fleet', selectedId = null } = {}, baseURL = './') {
  const context = { mediaId:'ME1', periodId:'me1' }, fleet = kind !== 'fauna';
  const records = fleet ? listHorizonFleet(context, state) : listHorizonFauna(context, state);
  const fleetAtlases = typeof __RELAY_HORIZON_FLEET_ATLASES__ === 'undefined' ? {} : __RELAY_HORIZON_FLEET_ATLASES__;
  const faunaAtlas = typeof __RELAY_HORIZON_FAUNA_ATLAS__ === 'undefined' ? null : __RELAY_HORIZON_FAUNA_ATLAS__;
  const entries = records.map(record => {
    const frame = fleet ? getHorizonFleetFrame(record.id, fleetAtlases) : getHorizonFaunaFrame(record.id, faunaAtlas);
    const atlas = fleet ? frame : faunaAtlas;
    return { ...record, art:frame ? atlasFrameSVG(atlas, frame, baseURL) : '' };
  });
  const selected = entries.find(entry => entry.id === selectedId) || entries[0];
  return `<nav class="tabs" aria-label="Dossiers de reconnaissance">${[['fleet','Vaisseaux'],['fauna','Faune']].map(([id,label]) => `<button class="tab ${id === (fleet ? 'fleet' : 'fauna') ? 'active' : ''}" data-do="horizon-kind" data-id="${id}" aria-pressed="${id === (fleet ? 'fleet' : 'fauna')}">${label}</button>`).join('')}</nav><p class="small horizon-archive-intro">Dossiers connus du commando · campagne de Mass Effect</p>${selected ? `<div class="horizon-archive-layout"><nav class="horizon-archive-list" aria-label="Dossiers connus">${entries.map(entry => `<button class="horizon-archive-card ${entry.id === selected.id ? 'selected' : ''}" data-do="horizon-record" data-id="${esc(entry.id)}" aria-pressed="${entry.id === selected.id}"><span class="horizon-archive-thumbnail">${entry.art}</span><strong>${esc(entry.name)}</strong></button>`).join('')}</nav><article class="horizon-archive-detail" data-horizon-dossier="${esc(selected.id)}"><h3>${esc(selected.name)}</h3><figure><div class="horizon-archive-art">${selected.art}</div><figcaption>Illustration de prototype</figcaption></figure><p>${esc(selected.description)}</p></article></div>` : '<p class="brief-copy">Ces dossiers s’enrichiront au fil de votre enquête.</p>'}`;
}

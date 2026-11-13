import { CHAPTERS } from './game-data.js';
import { getDestinationAccess } from './advance-travel-access.js';
import { levelMapProjection } from './level-map-render.js';

/** A locked planet stays inspectable; only deployment is disabled. */
export function renderGalaxyMap(state, selected, esc) {
  const id = Object.hasOwn(CHAPTERS, selected) ? selected : 'eden-prime', chapter = CHAPTERS[id];
  const access = getDestinationAccess(state, id);
  const positions = [[25,23],[67,19],[47,39],[19,53],[81,45],[60,62],[35,78],[80,82]];
  const sectors = Object.entries(CHAPTERS).reduce((groups,[zone,c])=>{
    const [system,cluster] = c.cluster.split(' · ');
    (groups[cluster] ||= []).push({zone,chapter:c,system});return groups;
  },{});
  return `<nav class="galaxy-directory" aria-label="Navigation par amas et système">${Object.entries(sectors).map(([cluster,entries])=>`<details${entries.some(entry=>entry.zone===id)?' open':''}><summary>${esc(cluster)}</summary>${entries.map(({zone,chapter:c,system})=>`<details open><summary>Système ${esc(system)}</summary><button data-do="planet" data-id="${zone}" aria-pressed="${zone===id}">${esc(c.name)}${getDestinationAccess(state,zone).ok?'':' · verrouillée'}</button></details>`).join('')}</details>`).join('')}</nav><div class="galaxy-layout"><div class="starmap"><div class="star-dust"></div><div class="galaxy-orbit"></div>${Object.entries(CHAPTERS).map(([zone,c],i)=>{
    const destination = getDestinationAccess(state, zone), locked = !destination.ok;
    return `<button class="planet-dot ${id===zone?'selected':''} ${locked?'planet-locked':''}" data-do="planet" data-id="${zone}" style="left:${positions[i][0]}%;top:${positions[i][1]}%;--planet:${c.palette}" aria-pressed="${id===zone}" aria-label="${esc(c.name)}${locked?' · verrouillée · consulter les prérequis':''}"><i></i>${esc(c.name)}${state.completed.includes(zone)?' ✓':locked?' · 🔒':''}</button>`;
  }).join('')}</div><div class="planet-detail" data-destination="${id}" data-access="${access.status}"><div class="planet-number">${esc(chapter.number)}</div><span class="eyebrow">${esc(chapter.subtitle)}</span><h3>${esc(chapter.name)}</h3><div class="cluster">${esc(chapter.cluster)}</div><p>${esc(chapter.description)}</p><div class="status" role="status">${access.missing.length?`<strong>Destination verrouillée</strong><ul>${access.missing.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>`:esc(access.reason)}</div><button class="primary" data-do="travel" data-id="${id}" ${!access.ok?'disabled':''}>Préparer le déploiement →</button></div></div>`;
}

/** Draw only detached native collision footprints, at the terrain's scale. */
export function renderMapCollisions(bounds, collisions = [], viewport = {}) {
  const projection = levelMapProjection(bounds, viewport);
  if (!projection || !Array.isArray(collisions) || !collisions.length) return '';
  const n = value => Number(value.toFixed(4));
  const transform=viewport.stretch?`translate(${viewport.left??5} ${viewport.top??5}) scale(${(viewport.width??90)/(bounds.maxX-bounds.minX)} ${(viewport.height??90)/(bounds.maxZ-bounds.minZ)}) translate(${-bounds.minX} ${-bounds.minZ})`:projection.transform;
  return `<g class="map-collisions" transform="${transform}" fill="#08131c" stroke="#c3b29466" stroke-width=".2">${collisions.map((solid,index)=>solid.kind==='circle'
    ? `<circle data-map-obstacle="${index}" cx="${n(solid.x)}" cy="${n(solid.z)}" r="${n(solid.radius)}"/>`
    : `<rect data-map-obstacle="${index}" x="${n(solid.minX)}" y="${n(solid.minZ)}" width="${n(solid.maxX-solid.minX)}" height="${n(solid.maxZ-solid.minZ)}"/>`).join('')}</g>`;
}

export function renderEncounterRecovery(recovery) {
  if (!recovery || !Number.isFinite(recovery.remaining) || recovery.remaining <= 0) return '';
  return `<div class="encounter-recovery" role="status" data-recovery-id="${recovery.id.replace(/[^a-zA-Z0-9:-]/g,'')}" data-recovery-remaining="${recovery.remaining}">Repli · contact suspendu ${Math.ceil(recovery.remaining)} s de terrain<span>Menus et combats suspendent ce délai.</span></div>`;
}

import { renderLevelGround, levelMapProjection } from './level-map-render.js';
import { renderMapCollisions } from './advance-travel-ui.js';

/** Numbered map markers keep dense Citadel contacts legible at every viewport. */
export function renderLocalMap({ bounds, position, pois, objective, tracked, filter = 'all', esc, layout = null, collisions = [] }) {
  if (!['all', 'campaign', 'operations', 'contacts'].includes(filter)) filter = 'all';
  const category = poi => poi.operationId ? 'operations' : poi.assignmentContactId || poi.conversationId ? 'contacts' : 'campaign';
  const entries = pois.filter(poi => filter === 'all' || category(poi) === filter);
  const trackedPOI = pois.find(poi => poi.id === tracked);
  const numbers = new Map(pois.map((poi,index) => [poi.id,index+1]));
  const projection = layout ? levelMapProjection(bounds) : null;
  const px = projection?.x || (value => 5 + (value - bounds.minX) / (bounds.maxX - bounds.minX) * 90);
  const pz = projection?.z || (value => 5 + (value - bounds.minZ) / (bounds.maxZ - bounds.minZ) * 90);
  const markers = [];
  for (const poi of entries) {
    const sourceX = px(poi.x), sourceY = pz(poi.z);
    let x = sourceX, y = sourceY;
    // Offset only the label, never the world coordinates or collision geometry.
    outer: for (let radius = 0; radius < 24; radius += 3) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const tx = Math.min(94, Math.max(6, sourceX + Math.cos(angle) * radius));
        const ty = Math.min(94, Math.max(6, sourceY + Math.sin(angle) * radius));
        if (markers.every(marker => Math.hypot(tx - marker.x, ty - marker.y) >= 8)) { x = tx; y = ty; break outer; }
      }
    }
    markers.push({ poi, x, y, sourceX, sourceY });
  }
  const color = poi => poi.cleared ? '#617a87' : poi.operationId ? '#c49ae6' : poi.type === 'encounter' ? '#ee8875' : poi.type === 'objective' ? '#e2c493' : '#85dcd3';
  return `<nav class="tabs map-filters" aria-label="Filtres de la carte">${[['all','Tout'],['campaign','Campagne'],['operations','Annexes'],['contacts','Contacts']].map(([id,label])=>`<button class="tab ${filter===id?'active':''}" data-do="map-filter" data-id="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</nav>
    <div class="local-map-layout"><div class="local-map-board" aria-label="Carte des points accessibles">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${layout ? renderLevelGround(layout) : '<path d="M5 50H95M50 5V95" stroke="#81ddd422" stroke-width=".3"/><rect x="5" y="5" width="90" height="90" fill="none" stroke="#81ddd444" stroke-width=".3"/>'}${renderMapCollisions(bounds,collisions,{stretch:!layout})}${markers.map(({poi,x,y,sourceX,sourceY})=>`<path d="M${sourceX} ${sourceY}L${x} ${y}" stroke="${color(poi)}" stroke-width=".25" opacity=".6"/><circle cx="${sourceX}" cy="${sourceY}" data-map-position="${esc(poi.id)}" r=".65" fill="${color(poi)}"/>`).join('')}</svg>
      ${markers.map(({poi,x,y})=>`<button class="map-number ${tracked===poi.id?'selected':''}" data-do="track" data-id="${esc(poi.id)}" style="left:${x}%;top:${y}%;--marker:${color(poi)}" aria-label="${numbers.get(poi.id)}. ${esc(poi.label)}" aria-pressed="${tracked===poi.id}" title="${esc(poi.label)}">${numbers.get(poi.id)}</button>`).join('')}
      <span class="map-player" style="left:${px(position.x)}%;top:${pz(position.z)}%" aria-label="Votre position">▲</span>
    </div><div class="local-map-sidebar"><div class="section-label">Objectif de mission</div><p class="brief-copy">${esc(objective)}</p>
      ${trackedPOI?`<div class="map-tracked-summary" data-map-tracked="${esc(trackedPOI.id)}"><strong>Repère suivi : ${esc(trackedPOI.label)}</strong>${!entries.includes(trackedPOI)?'<span>Ce repère est masqué par le filtre ; son suivi reste actif sur le radar.</span>':''}</div>`:''}
      <p class="small">Choisissez un numéro ou un lieu pour le suivre sur le radar. ${layout ? 'Les sentiers indiquent les passages ; les traits fins relient les numéros à leur emplacement.' : 'Les traits indiquent l’emplacement exact.'}</p>
      <div class="map-terrain-key">${layout?'<span><i class="main-route"></i>Chemin principal</span><span><i></i>Passages secondaires</span>':''}${collisions.length?'<span><i class="map-obstacle-key"></i>Obstacles et dégagement des pieds</span>':''}</div>
      <ol class="map-locations">${markers.map(({poi})=>`<li><button class="${tracked===poi.id?'selected':''}" data-do="track" data-id="${esc(poi.id)}" aria-pressed="${tracked===poi.id}"><b style="color:${color(poi)}">${numbers.get(poi.id)}</b><span>${esc(poi.label)}${poi.cleared?'<small>Secteur sécurisé</small>':''}</span><i>${tracked===poi.id?'Suivi':'→'}</i></button></li>`).join('')}</ol>
      ${markers.length?'':'<p class="small">Aucun lieu dans ce filtre.</p>'}</div></div>`;
}

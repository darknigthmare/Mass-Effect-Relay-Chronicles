/** Numbered map markers keep dense Citadel contacts legible at every viewport. */
export function renderLocalMap({ bounds, position, pois, objective, tracked, filter = 'all', esc }) {
  const category = poi => poi.operationId ? 'operations' : poi.assignmentContactId || poi.conversationId ? 'contacts' : 'campaign';
  const entries = pois.filter(poi => filter === 'all' || category(poi) === filter);
  const px = value => 5 + (value - bounds.minX) / (bounds.maxX - bounds.minX) * 90;
  const pz = value => 5 + (value - bounds.minZ) / (bounds.maxZ - bounds.minZ) * 90;
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
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M5 50H95M50 5V95" stroke="#81ddd422" stroke-width=".3"/><rect x="5" y="5" width="90" height="90" fill="none" stroke="#81ddd444" stroke-width=".3"/>${markers.map(({poi,x,y,sourceX,sourceY})=>`<path d="M${sourceX} ${sourceY}L${x} ${y}" stroke="${color(poi)}" stroke-width=".25" opacity=".6"/><circle cx="${sourceX}" cy="${sourceY}" r=".65" fill="${color(poi)}"/>`).join('')}</svg>
      ${markers.map(({poi,x,y},index)=>`<button class="map-number ${tracked===poi.id?'selected':''}" data-do="track" data-id="${esc(poi.id)}" style="left:${x}%;top:${y}%;--marker:${color(poi)}" aria-label="${index+1}. ${esc(poi.label)}" title="${esc(poi.label)}">${index+1}</button>`).join('')}
      <span class="map-player" style="left:${px(position.x)}%;top:${pz(position.z)}%" aria-label="Votre position">▲</span>
    </div><div class="local-map-sidebar"><div class="section-label">Objectif suivi</div><p class="brief-copy">${esc(objective)}</p>
      <p class="small">Choisissez un numéro ou un lieu pour le suivre sur le radar. Les traits indiquent l’emplacement exact.</p>
      <ol class="map-locations">${markers.map(({poi},index)=>`<li><button class="${tracked===poi.id?'selected':''}" data-do="track" data-id="${esc(poi.id)}"><b style="color:${color(poi)}">${index+1}</b><span>${esc(poi.label)}${poi.cleared?'<small>Secteur sécurisé</small>':''}</span><i>${tracked===poi.id?'Suivi':'→'}</i></button></li>`).join('')}</ol>
      ${markers.length?'':'<p class="small">Aucun lieu dans ce filtre.</p>'}</div></div>`;
}

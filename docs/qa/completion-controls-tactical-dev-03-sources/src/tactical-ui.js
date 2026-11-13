const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
// Component-local sizing keeps the field visible without changing other menus.
const commandStyle = 'font-size:calc(12px * var(--completion-text-scale,1));line-height:1.3;letter-spacing:.04em;padding:6px 10px;min-height:34px;flex:0 0 auto;';
const helpParagraphStyle = 'display:block;flex:none;margin:0 0 10px;line-height:1.55;font-size:calc(13px * var(--completion-text-scale,1));';
// These rules exist only while this ME1 component is mounted. Native details
// may retain layout boxes for closed contents, so hide that focus region
// explicitly. The bounded battle panel keeps the formation above its controls.
const compactStyles = `<style>
#battle-ui:has(> [data-compact-tactical]){max-height:40dvh!important;}
[data-compact-tactical] [data-tactical-help]:not([open])>[data-tactical-help-body]{display:none!important;}
@media(max-width:700px){#battle-ui:has(> [data-compact-tactical]){max-height:44dvh!important;}}
</style>`;
export function renderTacticalToolbar(battle, ui, { phase, plan, actions, retreat } = {}) {
  if (!battle?.tactical?.enabled) return '';
  const orders = ui.coordOrders || [], actor = battle.actors.find(actor => actor.id === ui.actor), held = battle.actors.filter(actor => actor.tacticalHeld && actor.hp > 0);
  const reserve = `<button class="secondary" style="${commandStyle}" data-do="coord-reserve" aria-label="Réserver la jauge de l’équipier sélectionné" title="Réserver cette jauge laisse avancer le temps et les ennemis." ${!actor || actor.hp <= 0 || actor.atb < 99.999 || actor.tacticalHeld ? 'disabled' : ''}>Réserver</button><button class="secondary" style="${commandStyle}" data-do="coord-release" aria-label="Libérer toutes les jauges réservées" title="Rendre leurs jauges aux équipiers réservés." ${!held.length ? 'disabled' : ''}>Libérer</button>`;
  const retreatButton = retreat ? `<button class="secondary" style="${commandStyle}" data-do="battle-retreat" aria-label="Repli du commando" ${!retreat.ok ? 'disabled' : ''} title="${esc(retreat.reason)}">Repli</button>` : '';
  const coordination = ui.coordMode
    ? `<button class="primary" style="${commandStyle}" data-do="coord-execute" aria-label="Exécuter ${orders.length} ordre${orders.length === 1 ? '' : 's'} coordonné${orders.length === 1 ? '' : 's'}" title="${esc(plan?.reason || 'Chaque ordre conserve ses coûts habituels.')}" ${!plan?.ok ? 'disabled' : ''}>Exécuter ${orders.length}</button><button class="secondary" style="${commandStyle}" data-do="coord-cancel" aria-label="Annuler la préparation des ordres coordonnés">Annuler</button>`
    : `<button class="secondary" style="${commandStyle}" data-do="coord-start" aria-label="Préparer des ordres coordonnés" title="Préparer un ordre par équipier prêt avant d’exécuter le groupe.">Coordonner</button>`;
  const orderList = ui.coordMode && orders.length ? `<ul class="coordinated-orders" data-tactical-draft aria-label="Ordres préparés" style="flex:0 0 100%;display:flex;gap:6px;flex-wrap:wrap;max-height:84px;overflow:auto;scroll-padding:4px;list-style:none;margin:0;padding:0;">${orders.map(order => `<li style="display:flex;align-items:center;gap:4px;min-width:0;max-width:100%;padding:3px 6px;font-size:calc(12px * var(--completion-text-scale,1));line-height:1.4;"><span style="min-width:0;overflow-wrap:anywhere;">${esc(battle.actors.find(actor => actor.id === order.actorId)?.name)} · ${esc(actions?.[order.actionId]?.label || order.actionId)}</span><button data-do="coord-remove" data-id="${esc(order.actorId)}" aria-label="Retirer l’ordre de ${esc(battle.actors.find(actor => actor.id === order.actorId)?.name)}" title="Retirer cet ordre sans l’exécuter" style="min-width:34px;min-height:34px;flex:none;">×</button></li>`).join('')}</ul>` : '';
  const help = `<details data-tactical-help style="min-width:0;flex:0 1 auto;"><summary style="${commandStyle}cursor:pointer;" aria-label="Aide tactique et conditions du repli" title="Lire les coûts, réservations et conditions du repli.">Aide tactique</summary><div data-tactical-help-body tabindex="0" role="region" aria-label="Conseils tactiques" style="width:min(720px,75vw);max-width:100%;max-height:24dvh;overflow:auto;padding:10px 12px;box-sizing:border-box;background:#071724;border:1px solid #617e90;outline-offset:-3px;">
    <p style="${helpParagraphStyle}">Les distances limitent tirs et pouvoirs. Approcher ou reculer consomme une jauge ATB. Réserver attend les autres équipiers en laissant agir les ennemis.</p>
    ${ui.coordMode ? `<p style="${helpParagraphStyle}">Préparez un ordre par équipier prêt, puis exécutez le groupe. Chaque ordre conserve ses coûts habituels.${plan && !plan.ok && orders.length > 1 ? ` ${esc(plan.reason)}` : ''}</p>` : ''}
    ${retreat ? `<p data-retreat-status style="${helpParagraphStyle}">${esc(retreat.reason)}</p>` : ''}
    ${phase ? `<p style="${helpParagraphStyle}"><strong>${esc(phase.label)}</strong> · ${esc(phase.instruction)}</p>` : ''}
    <p style="${helpParagraphStyle}margin-bottom:0;">Lecture : Page haut / bas ou stick droit. Refermez « Aide tactique » pour retrouver tout le terrain.</p>
  </div></details>`;
  return `<div class="tactical-toolbar" data-compact-tactical aria-label="Commandement tactique" style="padding:4px 6px;gap:6px;align-items:center;min-width:0;">${compactStyles}${reserve}${retreatButton}${coordination}${phase ? `<span class="boss-phase" role="status" title="${esc(phase.instruction)}" style="font-size:calc(12px * var(--completion-text-scale,1));max-width:220px;padding:4px 6px;"><strong>${esc(phase.label)}</strong></span>` : ''}${help}${orderList}</div>`;
}

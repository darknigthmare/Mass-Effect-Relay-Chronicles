import { CREW } from './game-data.js';
import { virmireReport } from './resolve-virmire.js';

const supports = {
  communications: 'Communications geth',
  satellite: 'Liaison satellite',
  flyers: 'Ravitaillement des drones',
};
const alarmLabels = {
  disabled: 'Désactivées',
  diverted: 'Déclenchées du côté du STG',
};

export function renderResolveVirmireJournal(state) {
  const report = virmireReport(state);
  if (!report.known || !report.briefed) return '';

  const defensesPassed = state.cleared?.includes('virmire:encounter-2') === true;
  const unconfirmed = defensesPassed ? 'Secteur dépassé' : 'À effectuer';
  const supportRows = Object.entries(supports).map(([id, label]) =>
    `<li data-virmire-support="${id}" data-done="${report.support[id]}">${label} · <strong>${report.support[id] ? 'Confirmé' : unconfirmed}</strong></li>`).join('');
  const research = defensesPassed ? [
    report.rana && `<li data-virmire-research="rana">Compte rendu du laboratoire · Recherches sur l’endoctrinement confirmées. Rana a été ${report.rana === 'released' ? 'épargnée' : 'exécutée'}.</li>`,
    report.beacon && '<li data-virmire-research="beacon">Balise du laboratoire · Seconde vision enregistrée.</li>',
    report.sovereign && '<li data-virmire-research="sovereign">Transmission · Identité de Sovereign confirmée dans le Codex.</li>',
  ].filter(Boolean) : [];
  const pendingResearch = !report.rana ? 'Parler au contact du laboratoire.' : !report.beacon ? 'Examiner la balise.'
    : !report.sovereign ? 'Consulter la transmission.' : '';
  return `<article class="journal-entry" data-resolve-id="virmire">
    <h3>Virmire · diversion et extraction</h3>
    <p>Volontaire STG · ${CREW[report.stgVolunteer]?.name || 'Non affecté'}</p>
    <ul>${supportRows}<li data-virmire-alarms>Alarmes · <strong>${alarmLabels[report.alarms] || unconfirmed}</strong></li></ul>
    <p>Extraction · ${CREW[report.survivor]?.name || 'Non décidée'}</p>
    ${defensesPassed ? `<section data-virmire-laboratory><h4>Rapport du laboratoire</h4>
      ${research.length ? `<ol>${research.join('')}</ol>` : ''}${pendingResearch ? `<p>${pendingResearch}</p>` : ''}</section>` : ''}
  </article>`;
}

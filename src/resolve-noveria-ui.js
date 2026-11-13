import { normalizeResolveNoveriaState, noveriaResolutionReport } from './resolve-noveria.js';

const PASS_LABELS = {
  lorik: 'Laissez-passer remis par Lorik contre les preuves.',
  'anoleis-evidence': 'Laissez-passer remis par Anoleis contre les preuves.',
  gianna: 'Laissez-passer remis par Gianna après l’arrestation.',
  opold: 'Laissez-passer obtenu en dénonçant le paquet d’Opold.',
  'anoleis-corpse': 'Laissez-passer récupéré sur le corps d’Anoleis.',
};

export function resolveNoveriaObjective(state) {
  if (state?.zone !== 'noveria' || state.completed?.includes('noveria')) return '';
  const p = normalizeResolveNoveriaState(state.resolveNoveria, state);
  if (!p || p.legacy || p.pass !== null) return '';
  if (p.anoleis === 'dead') return 'Récupérer le laissez-passer sur le corps d’Anoleis.';
  if (p.opold === 'held') return 'Présenter le paquet d’Opold à Anoleis pour obtenir l’accès au garage.';
  if (p.opold === 'accepted') return 'Récupérer le paquet d’Opold au quai du Normandy ou poursuivre l’affaire Lorik.';
  if (p.evidence === 'held' && ['charmed', 'intimidated'].includes(p.lorikTestimony)) return 'Rapporter le témoignage à Gianna ou choisir une autre remise des preuves.';
  if (p.evidence === 'held' && p.gianna === 'investigating') return 'Parler à Lorik de son témoignage, ou remettre directement les preuves contre un laissez-passer.';
  if (p.evidence === 'held') return 'Parler à Gianna avant de décider à qui remettre les preuves.';
  if (p.lorikContract) return 'Récupérer les preuves dans le terminal de Lorik.';
  if (p.anoleisAsked) return 'Obtenir un laissez-passer : rencontrer Lorik ou examiner la proposition d’Opold.';
  return 'Demander l’accès au Pic 15 à Anoleis ou rencontrer Opold.';
}

export function renderResolveNoveriaJournal(state, { esc } = {}) {
  if (state?.zone !== 'noveria' && !state?.story?.visitedZones?.includes('noveria') && !state?.completed?.includes('noveria')) return '';
  const p = normalizeResolveNoveriaState(state.resolveNoveria, state);
  if (!p) return '';
  if (p.legacy) return '<article class="journal-entry" data-noveria-report="legacy"><h3>Port Hanshan · bilan</h3><p>Cette ancienne progression ne contient pas la voie d’obtention du laissez-passer ni le sort de Gianna et d’Anoleis. La décision historique sur la reine reste conservée.</p></article>';
  const report = noveriaResolutionReport(state), lines = [];
  const objective = resolveNoveriaObjective(state);
  if (objective) lines.push(objective);
  if (report.pass) lines.push(PASS_LABELS[report.pass]);
  if (report.evidence === 'held') lines.push('Les preuves de corruption sont encore en votre possession.');
  if (report.evidence === 'lorik') lines.push('Les preuves ont été rendues à Lorik.');
  if (report.evidence === 'anoleis') lines.push('Les preuves ont été remises à Anoleis ; Gianna ne peut plus conclure l’enquête avec ce dossier.');
  if (report.lorikTestimony === 'charmed') lines.push('Lorik a accepté de témoigner après persuasion.');
  if (report.lorikTestimony === 'intimidated') lines.push('Lorik a accepté de témoigner sous la menace.');
  if (report.lorikTestimony === 'declined') lines.push('Vous avez choisi de ne pas insister pour le témoignage de Lorik.');
  if (report.gianna === 'investigating') lines.push('Gianna travaille pour les Affaires internes. Son enquête n’a pas encore abouti à une arrestation.');
  if (report.gianna === 'arrested-anoleis') lines.push('Gianna a reçu les preuves et le témoignage ; Anoleis est arrêté.');
  if (report.gianna === 'dead') lines.push('Après votre dénonciation, Gianna et Anoleis se sont entretués.');
  if (report.opold === 'reported') lines.push('Le paquet d’Opold a été saisi par Anoleis.');
  if (report.queen) lines.push(report.queen === 'release' ? 'La reine rachni a été libérée.' : 'La reine rachni a été détruite.');
  return `<article class="journal-entry" data-noveria-report="current"><h3>Port Hanshan · bilan</h3>${lines.map(text => `<p>${esc(text)}</p>`).join('')}</article>`;
}

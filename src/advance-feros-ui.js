import { normalizeAdvanceFerosState, ferosColonyReport, FEROS_COLONIST_TARGETS } from './advance-feros.js';

export function advanceFerosObjective(state) {
  if (state?.zone !== 'feros' || state.completed?.includes('feros')) return '';
  const p=normalizeAdvanceFerosState(state.advanceFeros,state);
  if (!p || p.legacy) return '';
  if (!state.cleared.includes('feros:encounter-1')) return '';
  if (!p.defense) return 'Retrouver Fai Dan pour organiser la défense de Zhu’s Hope.';
  if (!p.lizbeth) return 'Recueillir le témoignage de Lizbeth à ExoGeni.';
  if (!state.cleared.includes('feros:encounter-2')) return 'Sécuriser ExoGeni pour accéder aux recherches.';
  if (!p.investigation) return 'Consulter l’interface ExoGeni avec la carte de Lizbeth.';
  if (!p.shipReleased) return 'Régler la pression de la baie entre 31 et 34 PSI puis libérer la griffe.';
  if (p.jeong === null) return 'Retrouver Ethan Jeong sur la voie de retour.';
  if (!p.gasIssued) return 'Préparer avec Juliana une intervention non létale sur les colons.';
  const report=ferosColonyReport(state);
  if (report.pending) return `Zhu’s Hope · ${report.resolved}/16 colons neutralisés · ${report.spared} épargnés · ${report.killed} tués.`;
  if (!p.freighterOpened) return 'Rejoindre les commandes du cargo et ouvrir le repaire.';
  if (!state.cleared.includes('feros:boss')) return 'Affronter le Thorien dans son repaire.';
  if (!p.cipher) return 'Écouter Shiala et recevoir le Cipher.';
  if (p.shiala === null) return 'Décider du sort de Shiala.';
  return 'Valider le bilan de Zhu’s Hope au point de mission.';
}

export function renderAdvanceFerosJournal(state,{esc}={}) {
  if (!state?.story?.visitedZones?.includes('feros') && state?.zone !== 'feros' && !state?.completed?.includes('feros')) return '';
  const p=normalizeAdvanceFerosState(state.advanceFeros,state);
  if (!p) return '';
  if (p.legacy) return '<article class="journal-entry" data-feros-report="legacy"><h3>Rapport de Zhu’s Hope</h3><p>Ce bilan ancien ne contient pas le détail individuel des colons. Votre décision historique reste conservée.</p></article>';
  const report=ferosColonyReport(state);
  const status=state.completed.includes('feros')?'Mission accomplie':advanceFerosObjective({...state,zone:'feros'});
  const methods={gas:'Épargné · gaz anti-Thorien',melee:'Épargné · mêlée',lethal:'Tué'};
  const jeong={persuaded:'Jeong a renoncé à la purge après persuasion.',intimidated:'Jeong a renoncé à la purge après intimidation.',killed:'Jeong a été tué lors de la confrontation.'};
  return `<article class="journal-entry" data-feros-report="current" data-feros-resolved="${report.resolved}" data-feros-spared="${report.spared}" data-feros-killed="${report.killed}"><h3>Rapport de Zhu’s Hope</h3><p>${esc(status)}</p>${p.lizbeth?'<p>Le témoignage et la carte de Lizbeth ont été recueillis.</p>':''}${p.investigation?'<p>Les recherches d’ExoGeni expliquent l’influence des spores sur les colons.</p>':''}${p.shipReleased?'<p>La griffe du vaisseau geth a été détruite ; la voie de retour est libérée.</p>':''}${p.jeong?`<p>${esc(jeong[p.jeong])}</p>`:''}${p.gasIssued?`<p>${report.resolved}/16 cibles traitées : ${report.spared} épargnées et ${report.killed} tuées. Gaz : ${report.gas} · Mêlée : ${report.melee}.</p><details><summary>État des habitants</summary><ul>${FEROS_COLONIST_TARGETS.map(target=>`<li>${esc(target.name)} · ${esc(methods[p.colonists[target.id]]||'Encore sous influence')}</li>`).join('')}</ul></details>`:''}${p.freighterOpened?'<p>Fai Dan s’est donné la mort. Il est compté séparément des seize cibles.</p>':''}${p.cipher?'<p>Le Cipher a été transmis à Shepard.</p>':''}${p.shiala?`<p>Shiala a été ${p.shiala==='spared'?'épargnée':'exécutée'}.</p>`:''}</article>`;
}

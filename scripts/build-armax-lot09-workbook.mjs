import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

// Run with the managed primary Node runtime. The only positional argument is the repo root.
const repoRoot = path.resolve(process.argv[2] || process.cwd());
const lotDir = path.join(repoRoot, 'docs/armax/lot09');
const outputDir = path.resolve(process.env.ARMAX_EXPORT_DIR || path.join(repoRoot, 'outputs/armax-lot09'));
const catalogPath = path.join(lotDir, 'production-catalog.json');
const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const baselineCatalog = JSON.parse(await fs.readFile(path.join(repoRoot, 'docs/armax/lot08/production-catalog.json'), 'utf8'));
const identityFields = ['category','name','work','dlc','variant'];
const baselineIdentity = new Map(baselineCatalog.entries.map(e=>[e.id,identityFields.map(k=>e[k])]));
function verifyIdentityContinuity() {
  if (catalog.entries.length !== baselineIdentity.size || new Set(catalog.entries.map(e=>e.id)).size !== baselineIdentity.size) throw new Error('Lot 09 subject count or IDs changed');
  for (const entry of catalog.entries) {
    if (JSON.stringify(identityFields.map(k=>entry[k])) !== JSON.stringify(baselineIdentity.get(entry.id))) throw new Error(`Subject identity changed: ${entry.id}`);
  }
}
verifyIdentityContinuity();
const recovered = JSON.parse(await fs.readFile(path.join(repoRoot, 'docs/armax/recovery-20261120/asset-inventory.json'), 'utf8'));
const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:repoRoot,encoding:'utf8'}).trim();
// Inspect the tree only. This does not fetch historical PNG blobs in a partial checkout.
const tree = execFileSync('git', ['ls-tree', '-r', '-z', 'HEAD'], {cwd:repoRoot,encoding:'utf8',maxBuffer:16*1024*1024});
const trackedFiles = new Map(tree.split('\0').filter(Boolean).map(record => {
  const tab = record.indexOf('\t');
  return [record.slice(tab+1), record.slice(0,tab).split(' ')[2]];
}));
const asList = value => value == null ? [] : Array.isArray(value) ? value : [value];
const toUrls = value => asList(value).flatMap(item => typeof item === 'string' ? [item] : [item?.url,item?.sourcePage,item?.directImageUrl].filter(Boolean));
async function fileEvidence(file) {
  let local = false;
  try { local = (await fs.stat(path.join(repoRoot,file))).isFile(); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const gitBlob = trackedFiles.get(file) || null;
  if (!local && !gitBlob) throw new Error(`Declared asset absent locally and from base Git tree: ${file}`);
  return {path:file,locallyMaterialized:local,gitBlob,baseCommit:gitBlob?baseCommit:null};
}
async function optionalJson(name) {
  try { return JSON.parse(await fs.readFile(path.join(lotDir, name), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const attemptLogs = await Promise.all(['generation-attempts.json', 'stages-attempts.json'].map(optionalJson));
const recordedAttempts = attemptLogs.filter(Boolean).flatMap(log => log.attempts || log.results || []);
const canonicalId = id => String(id || '').replace(/_r\d+$/, '');
const manifestNames = ['stages-manifest.json', 'costumes-manifest.json', 'fighters-manifest.json'];
const manifests = (await Promise.all(manifestNames.map(optionalJson))).filter(Boolean);
// A producer may refine the chosen subzone or reference record during review.
// Only these production details are merged; the five identity fields stay frozen.
for (const manifest of manifests) Object.assign(catalog.sources, manifest.sourceRecords || {});
const newAssets = manifests.flatMap(m => Array.isArray(m) ? m : (m.assets || m.results || []));
const attempts = [...recordedAttempts, ...manifests.flatMap(m => m.attempts || []), ...newAssets.filter(a => ['blocked', 'failed'].includes(a.status))].map(a => ({...a,id:canonicalId(a.catalogId || a.id),status:a.status === 'generation_failed' ? (String(a.error).includes('moderation_blocked') ? 'blocked' : 'failed') : a.status}));
const index = new Map(catalog.entries.map(e => [e.id, e]));
for (const a of newAssets) {
  const entry = index.get(canonicalId(a.catalogId || a.id));
  const file = a.path || a.file;
  if (!entry) throw new Error(`Unknown manifest subject: ${a.catalogId || a.id}`);
  if (!file) continue;
  await fs.access(path.join(repoRoot, file));
  entry.status = 'Prototype';
  entry.assetPresence = 'candidat_genere_fichier_present';
  entry.assetFiles = [file];
  entry.alternateAssetFiles = asList(a.alternateFiles).map(v => typeof v === 'string' ? v : v.path).filter(Boolean);
  entry.alternateAssetNotes = asList(a.alternateFiles).filter(v => typeof v === 'object').map(v => `${v.path}: ${v.selection || v.role || 'autre version'}${v.note || v.reason ? ' — ' + (v.note || v.reason) : ''}`);
  entry.fidelity1to1Validated = false;
  entry.engineIntegrated = false;
  entry.referenceReadiness = 'images_de_reference_consultees; comparaison_detaillee_restante';
  const review = a.visualReview || a.review || {};
  entry.generationNotes = [...asList(a.notes), ...asList(review.issues), ...asList(review.notes), ...asList(a.referenceLimit), ...entry.alternateAssetNotes];
  const pose = a.pose || a.observedPose;
  if (pose) entry.generationNotes.unshift(`Pose obtenue : ${pose}.`);
  if (a.producedSubzone) entry.producedSubzone = a.producedSubzone;
  if (a.productionNote) entry.productionNote = a.productionNote;
  entry.sourceIds = [...new Set([...entry.sourceIds,...asList(a.sourceIds)])];
  for (const sourceId of entry.sourceIds) if (!catalog.sources[sourceId]) throw new Error(`Unknown manifest source ID: ${entry.id} / ${sourceId}`);
  entry.sourceUrls = [...new Set([...entry.sourceUrls, ...toUrls(a.sourceUrls), ...toUrls(a.referenceUrls), ...toUrls(a.sourceReferences)])];
  entry.sourceUrls = [...new Set([...entry.sourceUrls,...entry.sourceIds.map(key=>catalog.sources[key].url)])];
  entry.imageLot = 'lot09';
  if (entry.referenceGap) {
    entry.previousReferenceGap = entry.referenceGap;
    delete entry.referenceGap;
  }
}
for (const deferred of manifests.flatMap(m => m.deferred || [])) {
  const entry = index.get(canonicalId(deferred.id));
  if (!entry) throw new Error(`Unknown deferred subject: ${deferred.id}`);
  entry.referenceGap = deferred.note;
  entry.sourceUrls = [...new Set([...entry.sourceUrls,...toUrls(deferred.referenceUrls)])];
}
for (const e of catalog.entries) {
  e.latestGenerationAttempt = attempts.filter(a => a.id === e.id).at(-1)?.status || e.latestGenerationAttempt || (e.assetFiles.length ? 'generated' : 'not_attempted');
  if (e.assetFiles.length && !e.imageLot) throw new Error(`Image lot missing for historical subject: ${e.id}`);
  e.imageLot ||= '';
  e.alternateAssetFiles ||= [];
  e.assetAvailabilityEvidence = await Promise.all([...e.assetFiles,...e.alternateAssetFiles].map(fileEvidence));
  e.pngCountLot09 = [...new Set([...e.assetFiles,...e.alternateAssetFiles])].filter(file => file.startsWith('public/assets/armax/lot09/')).length;
}
const recoveredFileEvidence = await Promise.all(recovered.assets.map(a => fileEvidence(a.path)));
const currentFileOwners = new Map();
for (const entry of catalog.entries) {
  for (const file of [...new Set([...entry.assetFiles,...entry.alternateAssetFiles])].filter(file=>file.startsWith('public/assets/armax/lot09/'))) {
    if (currentFileOwners.has(file) && currentFileOwners.get(file)!==entry.id) throw new Error(`Lot 09 image reused across subjects: ${file}`);
    currentFileOwners.set(file,entry.id);
  }
}
catalog.currentCounts = {
  total: catalog.entries.length,
  withImage: catalog.entries.filter(e => e.assetFiles.length).length,
  withoutImage: catalog.entries.filter(e => !e.assetFiles.length).length,
  certified1to1: catalog.entries.filter(e => e.fidelity1to1Validated).length,
  newIllustratedSubjects: catalog.entries.filter(e => e.imageLot === 'lot09').length,
  newPngFiles: catalog.entries.reduce((sum,e) => sum+e.pngCountLot09,0),
  blockedSubjects: catalog.entries.filter(e => e.latestGenerationAttempt === 'blocked').length,
};
catalog.policy.automaticRetryExcludedIds = [...new Set([...catalog.policy.automaticRetryExcludedIds,...catalog.entries.filter(e => e.latestGenerationAttempt === 'blocked').map(e => e.id)])];
verifyIdentityContinuity();
await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

const roleNames = {combattant_candidat:'Combattant proposé',opposant_candidat:'Adversaire proposé',boss_candidat:'Boss proposé',narration_support:'Narration / soutien',variante_visuelle:'Variante de tenue',arene_adaptee:'Arène adaptée'};
const catNames = {personnage:'Personnages / ennemis',costume:'Costumes',stage:'Stages'};
const md = [
  '# Mass Effect — Armax : catalogue courant, lot 09', '',
  'Mise à jour : 20 novembre 2026. Source éditable : [production-catalog.json](production-catalog.json).', '',
  `Le lot 09 reprend les **${catalog.entries.length} fiches du lot 08 sans ajouter de sujet** : **${catalog.counts.personnage} personnages/ennemis, ${catalog.counts.costume} costumes et ${catalog.counts.stage} stages**. Il vise à réduire les **${catalog.baselineCounts.withoutImage} fiches sans image** de départ. À cette révision, **${catalog.currentCounts.withImage} fiches ont un fichier candidat** et **${catalog.currentCounts.withoutImage} restent sans image**. Aucun élément n’est certifié fidèle 1:1.`, '',
  `La production du lot 09 couvre **${catalog.currentCounts.newIllustratedSubjects} fiches illustrées** et **${catalog.currentCounts.newPngFiles} PNG**, révisions comprises. Une révision d’image ne crée pas un sujet supplémentaire. Le [catalogue du lot 08](../lot08/production-catalog.json) et son Excel restent des historiques intacts.`, '',
  'Le périmètre est celui des lots Armax retrouvés. Les sprites du RPG principal, les portraits, les nouvelles variantes et les images de travail restent des livrables distincts. Les lots 01/02 et la bible originale de 99 pages n’ont pas été retrouvés. Ce catalogue ne prétend pas couvrir toute la licence.', '',
  'Les fonctions de combattant, boss ou soutien ci-dessous sont des propositions pour le mode annexe. Une fonction de combat n’est pas attribuée automatiquement à un personnage civil. Les arènes reprennent des lieux canoniques avec un cadrage de combat 2D à concevoir.', '',
  '## Références et fidélité', '',
  'Les sources identifient l’œuvre, la tenue ou le lieu. La présence d’une fiche wiki ou d’une image générée ne valide pas une géométrie 1:1. Les costumes de loyauté, les packs d’apparences et les versions des différents opus ont des identifiants séparés. Les fichiers produits restent des prototypes jusqu’aux comparaisons visuelles et aux vérifications en jeu.', '',
];
for (const cat of ['personnage', 'costume', 'stage']) {
  md.push(`## ${catNames[cat]}`, '', '| Sujet | Opus | Variante / lieu | Usage proposé | Priorité | État | Fiche créée | Sources |', '|---|---|---|---|---|---|---|---|');
  for (const e of catalog.entries.filter(e => e.category === cat)) {
    const refs = e.sourceIds.map(k => `[${k}](${catalog.sources[k].url})`).join(', ');
    md.push(`| ${e.name} | ${e.work} | ${e.variant}${e.dlc ? ' — ' + e.dlc : ''} | ${roleNames[e.plannedUse]} | ${e.priority} | ${e.status}${e.assetFiles.length ? ' — image candidate' : ' — image absente'}${e.latestGenerationAttempt === 'blocked' ? ' ; essai bloqué' : ''} | ${e.addedInLot} | ${refs} |`);
  }
  md.push('');
}
md.push('## Références encore insuffisantes', '', ...catalog.entries.filter(e => e.referenceGap).map(e => `- **${e.name}** : ${e.referenceGap}`), '', '## Étapes encore nécessaires', '', ...catalog.remainingCoverage.map(t => '- ' + t), '', 'Les images, réserves et tentatives sans sortie sont consignées dans les manifestes de chaque lot. Les références visuelles du lot 09 sont documentées dans [reference-library.json](reference-library.json). Les 86 originaux historiques restent suivis séparément dans [l’inventaire de récupération](../recovery-20261120/asset-inventory.json). Une absence de copie locale d’un ancien PNG ne modifie pas sa présence déclarée dans l’arbre Git.', '');
await fs.writeFile(path.join(lotDir, 'MANQUANTS_2026-11-20.md'), md.join('\n'));

const wb = Workbook.create();
const summary = wb.worksheets.add('Synthese');
const list = wb.worksheets.add('Catalogue');
const old = wb.worksheets.add('Recuperes');
const ink = '#22354D', muted = '#657181', pale = '#EDF2F7', amber = '#FFF2CD';
for (const sheet of [summary, list, old]) sheet.showGridLines = false;
summary.tabColor = ink;
const n = catalog.entries.length, r = recovered.assets.length, first = 6, last = first + n - 1, lastOld = first + r - 1;
function base(sheet, end) {
  sheet.getRange(end).format.font = {name:'Arial',size:10,color:ink};
  sheet.getRange(end).format.verticalAlignment = 'center';
}
function header(sheet, range) {
  sheet.getRange(range).format = {fill:ink,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',wrapText:true};
  sheet.getRange(range).format.rowHeight = 31;
}
function width(sheet, col, w, end) { sheet.getRange(`${col}1:${col}${end}`).format.columnWidthPx = w; }
base(summary, 'A1:H28'); base(list, `A1:S${last}`); base(old, `A1:M${lastOld}`);
summary.getRange('A2').values = [['Mass Effect — Armax : suivi du lot 09']];
summary.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
summary.getRange('A4:B4').values = [['État au', new Date('2026-11-20T12:00:00Z')]];
summary.getRange('B4').setNumberFormat('dd/mm/yyyy');
summary.getRange('A6:E6').values = [['Catégorie','Fiches','Avec image','Sans image','Fidélité 1:1 validée']]; header(summary,'A6:E6');
for (const [i,c] of ['personnage','costume','stage'].entries()) {
  const row = 7+i;
  summary.getRange(`A${row}`).values = [[catNames[c]]];
  summary.getRange(`B${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row})`]];
  summary.getRange(`C${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$H$${first}:$H$${last},"Présent")`]];
  summary.getRange(`D${row}`).formulas = [[`=B${row}-C${row}`]];
  summary.getRange(`E${row}`).formulas = [[`=COUNTIFS('Catalogue'!$B$${first}:$B$${last},A${row},'Catalogue'!$J$${first}:$J$${last},"Oui")`]];
}
summary.getRange('A10').values = [['Total du catalogue']];
summary.getRange('B10:E10').formulas = [['=SUM(B7:B9)','=SUM(C7:C9)','=SUM(D7:D9)','=SUM(E7:E9)']];
summary.getRange('A10:E10').format.fill = pale;
summary.getRange('A10:E10').format.font.bold = true;
summary.getRange('A13:B13').values = [['Origine et production','Fiches / fichiers']]; header(summary,'A13:B13');
summary.getRange('A14').values = [['Fiches ajoutées au lot 09']];
summary.getRange('B14').formulas = [[`=COUNTIFS('Catalogue'!$P$${first}:$P$${last},"lot09")`]];
summary.getRange('A15').values = [['Fiches illustrées au lot 09']];
summary.getRange('B15').formulas = [[`=COUNTIFS('Catalogue'!$Q$${first}:$Q$${last},"lot09")`]];
summary.getRange('A16').values = [['PNG produits au lot 09, révisions incluses']];
summary.getRange('B16').formulas = [[`=SUM('Catalogue'!$R$${first}:$R$${last})`]];
summary.getRange('A17').values = [['Originaux historiques récupérés']];
summary.getRange('B17').formulas = [[`=COUNTA('Recuperes'!A${first}:A${lastOld})`]];
summary.getRange('A18').values = [['Fiches illustrées des lots précédents']];
summary.getRange('B18').formulas = [[`=COUNTIFS('Catalogue'!$H$${first}:$H$${last},"Présent",'Catalogue'!$Q$${first}:$Q$${last},"<>lot09")`]];
summary.getRange('A19').values = [['Récupérés hors dossiers organisés']];
summary.getRange('B19').formulas = [["='Recuperes'!H3"]];
summary.getRange('A21').values = [['Une image candidate reste un prototype ; aucune fidélité 1:1 n’est certifiée.']];
summary.getRange('A22').values = [['Les nouveaux masters de stage sont aplatis.']];
summary.getRange('A23').values = [['Animations, couches de parallaxe et validation en jeu restent à produire.']];
summary.getRange('A25').values = [['Périmètre : lots Armax retrouvés, hors sprites de la campagne RPG.']];
summary.getRange('A26').values = [['Les lots 01/02 et la bible originale restent non retrouvés.']];
summary.getRange('A21:A26').format.font.color = muted;
summary.getRange('B7:E19').setNumberFormat('#,##0');
summary.getRange('A7:E10').format.rowHeight = 24;
summary.getRange('A14:E19').format.rowHeight = 24;
summary.getRange('A21:H26').format.rowHeight = 22;
for (const [col,w] of Object.entries({A:340,B:125,C:110,D:110,E:145,F:22,G:110,H:110})) width(summary,col,w,28);

list.getRange('A2').values = [['Personnages, costumes et stages']];
list.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
list.getRange('A3').values = [['Une fiche correspond à une identité, un opus et une variante précise.']];
list.getRange('A3').format.font.color = muted;
list.getRange('A5:S5').values = [['Sujet','Catégorie','Opus','Variante / sous-zone','DLC','Priorité','Production','Image','Dernier essai','1:1 validé','Usage proposé','Identifiant','Note de production','Sources','Fichier retenu dans le dépôt','Fiche créée au lot','Lot image courante','PNG du lot 09','Autres versions conservées']];
const rows = catalog.entries.map(e=>[e.name,catNames[e.category],e.work,e.variant,e.dlc||'',e.priority,e.status,e.assetFiles.length?'Présent':'Absent',e.latestGenerationAttempt==='blocked'?'Bloqué':e.latestGenerationAttempt==='failed'?'Échec':e.assetFiles.length?'Généré':'Non tenté',e.fidelity1to1Validated?'Oui':'Non',roleNames[e.plannedUse],e.id,[e.producedSubzone ? `Zone produite : ${e.producedSubzone.replace(/[.\s]+$/,'')}.` : null,e.productionNote,...(e.generationNotes||[]),e.referenceGap].filter(Boolean).join(' '),e.sourceUrls.join('\n'),e.assetFiles.join('\n'),e.addedInLot,e.imageLot,e.pngCountLot09,e.alternateAssetFiles.join('\n')]);
list.getRange(`A${first}:S${last}`).values = rows;
list.tables.add(`A5:S${last}`,true,'ArmaxCatalogue');
header(list,'A5:S5');
list.getRange(`A${first}:S${last}`).format.rowHeight = 49;
list.getRange(`A${first}:S${last}`).format.wrapText = true;
list.getRange(`F${first}:J${last}`).format.horizontalAlignment = 'center';
list.getRange(`P${first}:R${last}`).format.horizontalAlignment = 'center';
list.getRange(`R${first}:R${last}`).setNumberFormat('0');
list.getRange(`F${first}:F${last}`).dataValidation = {rule:{type:'list',values:['P0','P1','P2']}};
list.getRange(`G${first}:G${last}`).dataValidation = {rule:{type:'list',values:['Défini','Prototype','Intégré','Validé']}};
list.getRange(`F${first}:F${last}`).conditionalFormats.add('containsText',{text:'P0',format:{fill:amber,font:{bold:true}}});
list.getRange(`I${first}:I${last}`).conditionalFormats.add('containsText',{text:'Bloqué',format:{fill:'#FCE4E3',font:{color:'#9B2C2C'}}});
list.freezePanes.freezeRows(5); list.freezePanes.freezeColumns(1);
for (const [col,w] of Object.entries({A:255,B:155,C:120,D:265,E:200,F:70,G:100,H:85,I:100,J:80,K:170,L:340,M:1000,N:900,O:820,P:110,Q:110,R:90,S:820})) width(list,col,w,last);
// Long production caveats and source URLs remain visible without shortening the data.
for (let i = 0; i < rows.length; i++) {
  const sourceLines = String(rows[i][13]).split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 120)), 0);
  const noteLines = Math.max(1, Math.ceil(String(rows[i][12]).length / 135));
  const height = Math.max(49, Math.max(sourceLines, noteLines) * 12 + 10);
  list.getRange(`A${first+i}:S${first+i}`).format.rowHeight = height;
}

old.getRange('A2').values = [['Originaux récupérés — lots antérieurs']];
old.getRange('A2').format.font = {name:'Arial',size:16,bold:true,color:ink};
old.getRange('A3').values = [['86 fichiers uniques. Les essais conservés ne sont pas tous des versions retenues.']];
old.getRange('G3:H3').values = [['Ajouts', recovered.summary.additionalRecoveredOriginalPngs]];
old.getRange('H3').setNumberFormat('#,##0');
old.getRange('A5:M5').values = [['Sujet','Lot','Nature','Sélection historique','Production','Largeur (px)','Hauteur (px)','Format','1:1 validé','Identifiant','SHA-256','Fichier dans le dépôt','Notes']];
old.getRange(`A${first}:M${lastOld}`).values = recovered.assets.map(a=>[a.subject,a.batch,a.kind,a.historicalSelection,a.status,a.technical.width,a.technical.height,a.technical.mode,a.fidelityValidated?'Oui':'Non',a.id,a.technical.sha256,a.path,a.notes]);
old.tables.add(`A5:M${lastOld}`,true,'ArmaxRecuperes'); header(old,'A5:M5');
old.getRange(`A${first}:M${lastOld}`).format.rowHeight = 45;
old.getRange(`A${first}:J${lastOld}`).format.wrapText = true;
old.getRange(`K${first}:L${lastOld}`).format.wrapText = false;
old.getRange(`M${first}:M${lastOld}`).format.wrapText = true;
old.getRange(`F${first}:G${lastOld}`).setNumberFormat('0');
old.getRange(`H${first}:I${lastOld}`).format.horizontalAlignment = 'center';
old.freezePanes.freezeRows(5); old.freezePanes.freezeColumns(1);
for (const [col,w] of Object.entries({A:245,B:160,C:100,D:140,E:100,F:95,G:95,H:80,I:80,J:390,K:570,L:1000,M:1600})) width(old,col,w,lastOld);
for (let i = 0; i < recovered.assets.length; i++) {
  const noteLines = Math.max(1, Math.ceil(String(recovered.assets[i].notes).length / 210));
  old.getRange(`A${first+i}:M${first+i}`).format.rowHeight = Math.max(45, noteLines * 12 + 10);
}
const longestRecoveredNoteRow = first + recovered.assets.reduce((maxIndex, asset, i, all) => asset.notes.length > all[maxIndex].notes.length ? i : maxIndex, 0);

wb.recalculate();
const independent = {fiches:n,personnages:catalog.counts.personnage,costumes:catalog.counts.costume,stages:catalog.counts.stage,withImage:catalog.currentCounts.withImage,withoutImage:catalog.currentCounts.withoutImage,certified1to1:catalog.currentCounts.certified1to1,addedEntries:catalog.entries.filter(e=>e.addedInLot==='lot09').length,newIllustratedSubjects:catalog.currentCounts.newIllustratedSubjects,newPngFiles:catalog.currentCounts.newPngFiles,recovered:r,carriedForwardIllustrated:catalog.entries.filter(e=>e.assetFiles.length && e.imageLot!=='lot09').length,additionalRecovered:recovered.summary.additionalRecoveredOriginalPngs};
const calculated = {fiches:summary.getRange('B10').values[0][0],personnages:summary.getRange('B7').values[0][0],costumes:summary.getRange('B8').values[0][0],stages:summary.getRange('B9').values[0][0],withImage:summary.getRange('C10').values[0][0],withoutImage:summary.getRange('D10').values[0][0],certified1to1:summary.getRange('E10').values[0][0],addedEntries:summary.getRange('B14').values[0][0],newIllustratedSubjects:summary.getRange('B15').values[0][0],newPngFiles:summary.getRange('B16').values[0][0],recovered:summary.getRange('B17').values[0][0],carriedForwardIllustrated:summary.getRange('B18').values[0][0],additionalRecovered:summary.getRange('B19').values[0][0]};
for(const key of Object.keys(independent)) if(independent[key]!==calculated[key]) throw new Error(`Summary mismatch ${key}: ${independent[key]} vs ${calculated[key]}`);
await fs.mkdir(outputDir,{recursive:true});
const inspection = await wb.inspect({kind:'table',range:'Synthese!A6:E19',include:'values,formulas',tableMaxRows:14,tableMaxCols:5,maxChars:5000});
await fs.writeFile(path.join(outputDir,'summary-inspect.ndjson'),inspection.ndjson);
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula errors'});
await fs.writeFile(path.join(outputDir,'formula-errors.ndjson'),errors.ndjson);
const enemyRow = first + catalog.entries.findIndex(e=>e.id==='chr_me2_scion');
const costumeRow = first + catalog.entries.findIndex(e=>e.id==='cst_me2_shepard_male_inferno');
const longestCurrentNoteRow = first + rows.reduce((maxIndex,row,i,all)=>String(row[12]).length>String(all[maxIndex][12]).length?i:maxIndex,0);
for (const [sheetName,range,name] of [['Synthese','A1:E27','synthese'],['Catalogue','A1:J15','catalogue'],['Catalogue',`A${enemyRow-1}:J${enemyRow+1}`,'ennemis'],['Recuperes','A1:I14','recuperes'],['Catalogue',`M${longestCurrentNoteRow}:N${longestCurrentNoteRow}`,'notes-production'],['Catalogue',`M${costumeRow}:N${costumeRow}`,'notes-costume'],['Catalogue',`P${enemyRow-1}:S${enemyRow+1}`,'notes-versions'],['Recuperes',`M${longestRecoveredNoteRow}:M${longestRecoveredNoteRow}`,'notes-recuperes']]) {
  const blob = await wb.render({sheetName,range,scale:name.startsWith('notes')?1:1.5,format:'png'});
  await fs.writeFile(path.join(outputDir,`preview-${name}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const xlsx = await SpreadsheetFile.exportXlsx(wb);
const filename = 'Mass_Effect_Armax_Suivi_Lot09_2026-11-20.xlsx';
await xlsx.save(path.join(outputDir,filename));
await fs.copyFile(path.join(outputDir,filename),path.join(lotDir,filename));
const inputHashes = {};
for (const file of ['production-catalog.json',...manifestNames,'generation-attempts.json','stages-attempts.json','reference-library.json']) inputHashes[file] = createHash('sha256').update(await fs.readFile(path.join(lotDir,file))).digest('hex');
const xlsxSha256 = createHash('sha256').update(await fs.readFile(path.join(lotDir,filename))).digest('hex');
const identityContinuity = {baseline:'docs/armax/lot08/production-catalog.json',subjects:baselineIdentity.size,fields:identityFields,checkedFields:baselineIdentity.size*identityFields.length,unchanged:true};
const originalPngCorpusCount = new Set([...recovered.assets.map(a=>a.path),...catalog.entries.flatMap(e=>[...e.assetFiles,...e.alternateAssetFiles])]).size;
await fs.writeFile(path.join(lotDir,'workbook-verification.json'),JSON.stringify({date:'2026-11-20',baseCommit,builder:'scripts/build-armax-lot09-workbook.mjs',runtime:'@oai/artifact-tool; managed primary runtime',sheets:['Synthese','Catalogue','Recuperes'],independent,calculated,recalculated:true,formulaErrorScan:errors.ndjson,renderedSheets:['Synthese','Catalogue','Recuperes'],visualReviewCompleted:false,nativeExcelOpened:false,inputHashes,xlsxSha256,identityContinuity,originalPngCorpusCount,blockedSubjects:catalog.currentCounts.blockedSubjects,recordedGenerationCalls:recordedAttempts.length,assetAvailability:{method:'filesystem for new assets; git ls-tree at baseCommit for historical assets, without fetching their blobs',historicalTrackedFiles:recoveredFileEvidence.length,recoveredEvidence:recoveredFileEvidence}},null,2)+'\n');
console.log(JSON.stringify({output:path.join(lotDir,filename),counts:calculated,formulaScan:errors.ndjson}));

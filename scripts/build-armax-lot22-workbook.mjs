#!/usr/bin/env node
/**
 * Rebuild the separate Lot 22/Nacre workbook using the Codex primary runtime.
 * Copy this exact file to a conversation-specific /tmp directory containing a
 * node_modules symlink to CODEX_PRIMARY_RUNTIME_NODE_MODULES, then run it with
 * CODEX_PRIMARY_RUNTIME_NODE. Do not install or resolve dependencies in the repo.
 *
 * --repo PATH --output-dir PATH --roster PATH --world PATH --catalog PATH
 * --coverage PATH are optional overrides. Production uses committed sources.
 * Source JSON, native images, and prior workbooks are read-only inputs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const cli = Object.fromEntries(process.argv.slice(2).reduce((acc, value, index, all) => {
  if (value.startsWith('--')) acc.push([value.slice(2), all[index + 1]]);
  return acc;
}, []));
const workspace = path.resolve(cli.workspace || '/workspace/scratch/d2ff5b8b3d47');
const repo = path.resolve(cli.repo || path.join(workspace, 'mass-effect'));
const outputDir = path.resolve(cli['output-dir'] || path.join(workspace, 'outputs', 'lot22'));
const docDir = path.join(repo, 'docs/armax/lot22');
const qaDir = path.join(docDir, 'qa/workbook');
const fileName = 'Mass_Effect_Armax_Nacre_Lot22_2026-11-27.xlsx';
const exists = async file => !!(await fs.stat(file).catch(() => null))?.isFile();
const sourceSha256 = {};
const readJson = async file => {
  const bytes = await fs.readFile(file);
  sourceSha256[path.relative(repo,file).replaceAll(path.sep,'/')] = createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes.toString('utf8'));
};
const choose = async files => {
  for (const file of files.filter(Boolean)) if (await exists(file)) return file;
  throw new Error(`Required source unavailable: ${files.filter(Boolean).join(' ; ')}`);
};
const catalogPath = await choose([cli.catalog,
  path.join(docDir, 'production-catalog.json'),
  path.join(repo, 'docs/armax/lot21/production-catalog.json')]);
const rosterPath = await choose([cli.roster, path.join(repo, 'DLC/LesDettesDeNacre/nacre_roster_design.json')]);
const worldPath = await choose([cli.world, path.join(repo, 'DLC/LesDettesDeNacre/nacre-world.json')]);
const coverageCandidates = [cli.coverage,
  path.join(docDir, 'gameplay-coverage.json'),
  path.join(repo, 'DLC/LesDettesDeNacre/gameplay-coverage.json')].filter(Boolean);
let coveragePath = null;
for (const candidate of coverageCandidates) if (await exists(candidate)) { coveragePath = candidate; break; }
const [catalog, roster, world, coverage] = await Promise.all([
  readJson(catalogPath), readJson(rosterPath), readJson(worldPath),
  coveragePath ? readJson(coveragePath) : Promise.resolve(null),
]);
const canonicalFollowupPath = path.join(docDir, 'canonical-followup.json');
const canonicalFollowup = await exists(canonicalFollowupPath) ? await readJson(canonicalFollowupPath) : null;
const canonicalFollowupById = new Map((canonicalFollowup?.entries || []).map(entry => [entry.id, entry]));
const revisionReferencePath = path.join(docDir, 'revision-generation-prompts.json');
const revisionReferences = await exists(revisionReferencePath) ? await readJson(revisionReferencePath) : [];
if (roster.fighters.length !== 10) throw new Error('Expected ten original fighter designs.');
for (const key of ['stages', 'enemies', 'bosses', 'props', 'projectilesVfx']) {
  if (world[key]?.length !== 20) throw new Error(`Expected twenty original ${key}.`);
}

let gitFiles = new Set();
let gitHead = null;
try {
  gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  gitFiles = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'],
    { cwd: repo, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).trim().split('\n'));
} catch { /* A source-only preview remains possible; no Git presence is claimed. */ }

const string = value => value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
const text = value => {
  const result = string(value).replace(/\r/g, '');
  return /^[=+@]/.test(result) ? `'${result}` : result;
};
const arr = value => Array.isArray(value) ? value : value == null ? [] : [value];
const unique = values => [...new Set(values.filter(Boolean))];
const urlsFrom = (ids, sources) => unique(arr(ids).map(id =>
  Array.isArray(sources) ? sources.find(source => source.id === id)?.url : sources?.[id]?.url));
const sourceUrls = entry => unique([
  ...arr(entry.sourceUrls), ...urlsFrom(entry.sourceIds, catalog.sources),
  ...urlsFrom(entry.sourceIds, world.sources),
  ...arr(revisionReferences).filter(revision => revision.originalIdentity === entry.id)
    .flatMap(revision => arr(revision.referenceImages).map(reference => reference.url)),
]);
const fighterSourceIds = {
  nacre_mara_vey: ['nacre_src_calibrations'],
  nacre_tavin_rhex: ['nacre_src_calibrations'],
  nacre_ilyra_senn: ['nacre_src_manual_fr', 'nacre_src_biotics_codex'],
  nacre_keela_vess: ['nacre_src_tali', 'nacre_src_species_codex'],
  nacre_ghoran_brakk: ['nacre_src_species_codex'],
  nacre_neral_vesh: ['nacre_src_species_codex'],
  nacre_selek_dhan: ['nacre_src_manual_fr'],
  nacre_varek_hesk: ['nacre_src_species_codex'],
  nacre_dalo_ruun: ['nacre_src_volus_mp', 'nacre_src_species_codex'],
  nacre_nyra_korr: ['nacre_src_calibrations'],
};
const originalCategory = {
  fighter: 'Personnage', stage: 'Stage', enemy: 'Ennemi', boss: 'Boss',
  prop: 'Accessoire', projectile_vfx: 'Projectile / VFX',
};
const canonicalCategory = {
  personnage: 'Personnage', costume: 'Costume', stage: 'Stage',
  accessoire: 'Accessoire', effet: 'Effet', projectile: 'Projectile', arme: 'Arme',
  enemy: 'Ennemi', boss: 'Boss',
};
const expectedOriginalPath = (id, category) => {
  const folder = { fighter: 'fighters', stage: 'stages', enemy: 'enemies', boss: 'bosses', prop: 'props', projectile_vfx: 'fx' }[category];
  return `public/assets/armax/lot22/originals/${folder}/${id}.png`;
};
const normalizePath = file => file.startsWith('public/') ? file : file.startsWith('assets/') ? `public/${file}` : file.replace(/^\//, '');
const sourcePath = file => path.relative(repo, file).replaceAll(path.sep, '/');
const getPresence = async paths => {
  const normalized = unique(paths.filter(p => typeof p === 'string').map(normalizePath));
  const local = [];
  const tracked = [];
  for (const file of normalized) {
    if (await exists(path.join(repo, file))) local.push(file);
    else if (gitFiles.has(file)) tracked.push(file);
  }
  return { paths: normalized, local, tracked, present: local.length + tracked.length > 0 };
};

const coverageFeatures = arr(coverage?.features || coverage?.coverage || coverage?.requirements || coverage?.rows);
const coverageById = new Map(coverageFeatures.map(feature => [feature.id, feature]));
const nativeTestsPassed = coverage?.verification?.nativePassed === true;
const nativeTestsCount = Number(coverage?.verification?.nativeTests || 0);
const inputRoutingPassed = coverage?.verification?.inputRoutingPassed === true;
const inputRoutingTests = Number(coverage?.verification?.inputRoutingTests || 0);
const nativeVerificationText = nativeTestsPassed ? `${nativeTestsCount} tests Armax réussis` : 'Tests Armax à vérifier';
const inputVerificationText = inputRoutingPassed ? ` ; ${inputRoutingTests} contrats d’entrée vérifiés` : '';
const campaignPartiallyVerified = coverageById.get('campaign')?.status === 'partial_engine_verified';
const bossesPartiallyVerified = coverageById.get('bosses')?.status === 'partial_engine_verified';
const runtimeSourcePath = path.join(repo, 'src/armax-data.js');
const runtimeSource = await exists(runtimeSourcePath) ? await fs.readFile(runtimeSourcePath, 'utf8') : '';
// Complete prototype sign-off requires an explicit declaration and all ten IDs.
// Smoke/global results cannot certify profiles or the full kits from the bible.
const prototypeVerificationFor = report => {
  const verifiedIds = new Set(Array.isArray(report?.playableProfiles?.verifiedIds)
    ? report.playableProfiles.verifiedIds.filter(id => typeof id === 'string') : []);
  return report?.prototypePlayableVerified === true && roster.fighters.every(fighter =>
    verifiedIds.has(fighter.id) && runtimeSource.includes(fighter.id));
};
const prototypeVerified = prototypeVerificationFor(coverage);
const partialUiChecksPassed = coverage?.verification?.browserPassed === true;
const browserQueued = coverage?.verification?.pendingCiAttempt?.status === 'queued' ||
  string(coverage?.verification?.browserStatus).startsWith('queued');
const browserVerificationText = prototypeVerified ? 'Prototype complet vérifié' :
  partialUiChecksPassed ? 'Contrôles UI partiels réussis' :
  browserQueued ? 'Contrôles UI en attente' : 'Parcours navigateur non validé';
const entries = new Map();
for (const entry of catalog.entries || []) {
  if (entries.has(entry.id)) throw new Error(`Duplicate catalogue id: ${entry.id}`);
  entries.set(entry.id, { ...entry, scope: entry.id.startsWith('nacre_') ? 'Original' : 'Canon adapté' });
}
for (const fighter of roster.fighters) {
  const previous = entries.get(fighter.id) || {};
  entries.set(fighter.id, { ...previous, id: fighter.id, name: fighter.name,
    scope: 'Original', category: 'fighter', work: 'Les Dettes de Nacre (2185)',
    status: previous.status || 'Défini', variant: fighter.role,
    productionNote: 'Base statique et profil de prototype distincts. Kit complet, animations, voix, costume et campagne restent à produire ou à raccorder.',
    sourceUrls: urlsFrom(fighterSourceIds[fighter.id], roster.sources),
    assetFiles: previous.assetFiles?.length ? previous.assetFiles : unique([normalizePath(fighter.sprite), expectedOriginalPath(fighter.id, 'fighter')]),
    fidelity1to1Validated: false, fullKitImplemented: false,
    originalDesign: fighter,
  });
}
for (const key of ['stages', 'enemies', 'bosses', 'props', 'projectilesVfx']) {
  for (const item of world[key]) {
    const previous = entries.get(item.id) || {};
    entries.set(item.id, { ...previous, ...item, scope: 'Original', work: 'Les Dettes de Nacre (2185)',
      status: previous.status || item.production?.status || 'Défini',
      assetFiles: previous.assetFiles?.length ? previous.assetFiles : unique([...arr(item.assetFiles),
        item.production?.imagePath, item.imagePath, expectedOriginalPath(item.id, item.category)]),
      variant: item.speciesOrChassis || item.location || item.role || '',
      productionNote: item.loreBoundary || item.gameplayRule || item.constraint || item.storyObjective || '',
      sourceUrls: unique([...(previous.sourceUrls || []), ...sourceUrls(item)]),
      fidelity1to1Validated: false, fullKitImplemented: false,
    });
  }
}

const records = [];
for (const entry of entries.values()) {
  const presence = await getPresence(arr(entry.assetFiles));
  const verifiedPrototype = entry.scope === 'Original' && entry.category === 'fighter' &&
    prototypeVerified && runtimeSource.includes(entry.id);
  const category = entry.scope === 'Original' ? originalCategory[entry.category] || canonicalCategory[entry.category] || entry.category :
    canonicalCategory[entry.category] || entry.category;
  const status = presence.present ? entry.scope === 'Original' ? 'Candidat illustré' : 'Prototype' : entry.status === 'Validé' ? 'À vérifier' : 'Défini';
  const proof = presence.local.length ? 'Fichier local vérifié' : presence.tracked.length ? 'Blob Git présent' : 'Aucun fichier trouvé';
  const followup = canonicalFollowupById.get(entry.id);
  const newReference = followup?.newPrimaryReference;
  records.push({ id: entry.id, name: entry.name, scope: entry.scope, category,
    work: entry.work || '', status, present: presence.present ? 1 : 0, proof,
    prototype: verifiedPrototype ? 1 : 0, fullKit: entry.fullKitImplemented === true ? 1 : 0,
    fidelity: entry.fidelity1to1Validated === true ? 1 : 0,
    paths: (presence.present ? unique([...presence.local, ...presence.tracked]) : presence.paths).join('\n'),
    remaining: followup ? `${followup.nextReferenceDeliverable}\n${followup.remainingVisualQuestions.join(' ')}` : entry.productionNote || entry.referenceGap || '',
    variant: [entry.variant, entry.selectedRevision ? `Base ${entry.selectedRevision}` : '', entry.dlc].filter(Boolean).join(' — '),
    sources: unique([...sourceUrls(entry),newReference?.pageUrl,newReference?.authorUrl,newReference?.directImageUrl]).join('\n'), local: presence.local.length ? 1 : 0,
  });
}
const originalCount = records.filter(record => record.scope === 'Original').length;
if (originalCount !== 110) throw new Error(`Expected 110 original records, got ${originalCount}.`);
const canonicalCount = records.filter(record => record.scope === 'Canon adapté').length;
const referenceUrls = unique(records.flatMap(record => record.sources.split('\n')));
const referenceIdFor = new Map(referenceUrls.map((url,index) => [url,`SRC_${String(index+1).padStart(4,'0')}`]));
const rowFor = new Map(records.map((record, index) => [record.id, index + 6]));
const recordById = new Map(records.map(record => [record.id, record]));
const fighterById = new Map(roster.fighters.map(fighter => [fighter.id, fighter]));
const stageById = new Map(world.stages.map(stage => [stage.id, stage]));
const bossById = new Map(world.bosses.map(boss => [boss.id, boss]));

const workbook = Workbook.create();
const sheets = Object.fromEntries(['Synthèse','Gameplay','Kits','Campagnes','Rencontres','Catalogue'].map(name => [name, workbook.worksheets.add(name)]));
const colors = { ink:'#172638', navy:'#17344D', mid:'#476779', light:'#E9F0F4', line:'#A7BBC9', amber:'#FFF1D7', red:'#9B3434' };
const FONT = 'Arial';
const col = index => { let result = ''; for (let n=index+1; n>0; n=Math.floor((n-1)/26)) result=String.fromCharCode(65+(n-1)%26)+result; return result; };
function startSheet(sheet, title, note, widths, rows=30) {
  sheet.showGridLines = false;
  const last = col(widths.length - 1);
  sheet.getRange(`A1:${last}${rows}`).format.font = { name:FONT, size:10, color:colors.ink };
  sheet.getRange(`A1:${last}${rows}`).format.verticalAlignment = 'center';
  widths.forEach((width, index) => { sheet.getRange(`${col(index)}1:${col(index)}${rows}`).format.columnWidth = width; });
  sheet.getRange('A2').values = [[title]];
  sheet.getRange('A2').format.font = { name:FONT, size:14, bold:true, color:colors.navy };
  sheet.getRange('A3').values = [['Arrêté au 27/11/2026']];
  sheet.getRange(`A3:${last}3`).format.borders = { bottom:{ style:'thin', color:colors.line } };
  sheet.getRange('A4').values = [[note]];
  sheet.getRange('A4').format.font = { name:FONT, size:10, italic:true, color:colors.mid };
  sheet.getRange('A1').format.rowHeight = 8;
  sheet.getRange('A2').format.rowHeight = 24;
  sheet.getRange('A3:A4').format.rowHeight = 20;
}
function table(sheet, name, headers, rows, widths, { start=5, rowHeight=42, numeric=[], maxHeight=180 }={}) {
  const last=col(headers.length-1), bottom=start+rows.length;
  sheet.getRange(`A${start}:${last}${bottom}`).values = [headers, ...rows.map(row => row.map(text))];
  // Restore typed numeric inputs after text normalization, including legitimate zeros.
  numeric.forEach(index => {
    sheet.getRange(`${col(index)}${start+1}:${col(index)}${bottom}`).values = rows.map(row => [typeof row[index] === 'number' ? row[index] : null]);
    sheet.getRange(`${col(index)}${start+1}:${col(index)}${bottom}`).setNumberFormat('#,##0');
    sheet.getRange(`${col(index)}${start+1}:${col(index)}${bottom}`).format.horizontalAlignment = 'right';
  });
  const range=sheet.getRange(`A${start}:${last}${bottom}`);
  range.format.wrapText = true;
  range.format.verticalAlignment = 'top';
  const header=sheet.getRange(`A${start}:${last}${start}`);
  header.format = { fill:colors.navy, font:{name:FONT,size:10,bold:true,color:'#FFFFFF'}, wrapText:true,
    horizontalAlignment:'center', verticalAlignment:'center', rowHeight:32,
    borders:{ insideVertical:{style:'thin',color:'#FFFFFF'}, bottom:{style:'thin',color:colors.line} } };
  for (let index=0; index<rows.length; index++) {
    const row=rows[index];
    const lineCount = Math.max(1, ...row.map((value, ci) =>
      string(value).split('\n').reduce((count, line) => count+Math.max(1,Math.ceil(line.length/Math.max(10,widths[ci]-3))),0)));
    sheet.getRange(`A${start+index+1}:${last}${start+index+1}`).format.rowHeight=Math.min(maxHeight,Math.max(rowHeight,lineCount*13+8));
    if (index%2===1) sheet.getRange(`A${start+index+1}:${last}${start+index+1}`).format.fill='#F3F6F8';
  }
  const t=sheet.tables.add(`A${start}:${last}${bottom}`, true, name);
  t.style='TableStyleLight1';
  t.showFilterButton=true;
  sheet.freezePanes.freezeRows(start);
  sheet.freezePanes.freezeColumns(2);
  return {start,bottom,last};
}

const catalogHeaders=['ID','Contenu','Origine','Catégorie','Œuvre ou extension','État artistique','Image présente','Preuve de présence','Prototype vérifié','Kit complet','1:1 validé','Chemins des images','Travail restant','Variante ou DLC','Réf. sources','Fichier local','ID unique'];
const catalogWidths=[38,32,18,21,29,17,13,26,14,12,12,78,84,44,90,13,12];
const catalogRows=records.map(r=>[r.id,r.name,r.scope,r.category,r.work,r.status,r.present,r.proof,r.prototype,r.fullKit,r.fidelity,r.paths,r.remaining,r.variant,
  r.sources.split('\n').filter(Boolean).map(url=>referenceIdFor.get(url)).join('\n'),r.local,null]);
startSheet(sheets.Catalogue,'Catalogue de production','Présence : fichier local ou blob Git. 1 = oui ; 0 = non. Les URL complètes sont dans l’index des sources au bas de cette feuille.',catalogWidths,records.length+7);
const catalogueRange=table(sheets.Catalogue,'NacreCatalogue',catalogHeaders,catalogRows,catalogWidths,{numeric:[6,8,9,10,15],rowHeight:48,maxHeight:409});
const end=catalogueRange.bottom;
for (let row=6;row<=end;row++) sheets.Catalogue.getRange(`Q${row}`).formulas=[[`=IF(COUNTIFS($A$6:$A$${end},A${row})=1,1,0)`]];
sheets.Catalogue.getRange(`Q6:Q${end}`).setNumberFormat('0');
for (const letter of ['G','I','J','K','P']) sheets.Catalogue.dataValidations.add({range:`${letter}6:${letter}${end}`,rule:{type:'whole',operator:'between',formula1:0,formula2:1}});
sheets.Catalogue.getRange(`G6:G${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:0,format:{fill:colors.amber}});
sheets.Catalogue.getRange(`Q6:Q${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:0,format:{fill:'#FFE1DF',font:{bold:true,color:colors.red}}});

// One URL per row avoids clipping historical signed image URLs or 28-source cells.
// This appendix belongs to the Catalogue sheet and is outside all count ranges.
const sourceAppendixStart=end+4;
const sourceAppendixBottom=sourceAppendixStart+referenceUrls.length;
sheets.Catalogue.getRange(`L${sourceAppendixStart-1}`).values=[['Index des sources — URL intégrales conservées']];
sheets.Catalogue.getRange(`L${sourceAppendixStart-1}`).format.font={name:FONT,size:12,bold:true,color:colors.navy};
const sourceRows=referenceUrls.map(url=>[referenceIdFor.get(url),url,new URL(url).hostname,
  'URL documentaire conservée. La qualification de variante et les réserves sont précisées dans la fiche et les audits cités.']);
sheets.Catalogue.getRange(`L${sourceAppendixStart}:O${sourceAppendixBottom}`).values=[['Référence','URL complète','Domaine','Qualification'],...sourceRows];
sheets.Catalogue.getRange(`L${sourceAppendixStart}:O${sourceAppendixBottom}`).format={font:{name:FONT,size:10,color:colors.ink},wrapText:true,verticalAlignment:'top'};
sheets.Catalogue.getRange(`L${sourceAppendixStart}:O${sourceAppendixStart}`).format={fill:colors.navy,font:{name:FONT,size:10,bold:true,color:'#FFFFFF'},rowHeight:32,verticalAlignment:'center'};
sourceRows.forEach((row,index)=>{
  const lineCount=Math.max(...row.map((value,ci)=>Math.max(1,Math.ceil(value.length/([78,84,44,90][ci]-3)))));
  sheets.Catalogue.getRange(`L${sourceAppendixStart+index+1}:O${sourceAppendixStart+index+1}`).format.rowHeight=Math.min(409,Math.max(42,lineCount*13+8));
});
const sourceTable=sheets.Catalogue.tables.add(`L${sourceAppendixStart}:O${sourceAppendixBottom}`,true,'NacreSourceIndex');
sourceTable.style='TableStyleLight1';sourceTable.showFilterButton=true;

const summary=sheets['Synthèse'];
const summaryWidths=[35,14,16,16,20,18,16,16];
startSheet(summary,'Suivi Armax et Nacre','Les compteurs décrivent les fiches du suivi disponible, pas l’achèvement de la franchise.',summaryWidths,44);
summary.tabColor=colors.navy;
summary.getRange('A6:H6').values=[['Périmètre','Fiches','Avec image','Sans image','Présence à vérifier','Prototype vérifié','Kit complet','1:1 validé']];
summary.getRange('A7:A9').values=[['Canon adapté'],['Original'],['Total']];
for (const row of [7,8]) {
  summary.getRange(`B${row}`).formulas=[[`=COUNTIFS('Catalogue'!$C$6:$C$${end},$A${row})`]];
  for (const [dest,source,criteria] of [['C','G',1],['D','G',0],['F','I',1],['G','J',1],['H','K',1]]) {
    summary.getRange(`${dest}${row}`).formulas=[[`=COUNTIFS('Catalogue'!$C$6:$C$${end},$A${row},'Catalogue'!$${source}$6:$${source}$${end},${criteria})`]];
  }
  summary.getRange(`E${row}`).formulas=[[`=B${row}-C${row}-D${row}`]];
}
for (const letter of ['B','C','D','E','F','G','H']) summary.getRange(`${letter}9`).formulas=[[`=SUM(${letter}7:${letter}8)`]];
summary.getRange('A6:H6').format={fill:colors.navy,font:{name:FONT,size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:36};
summary.getRange('A7:H9').format.rowHeight=28;
summary.getRange('B7:H9').setNumberFormat('#,##0');
summary.getRange('A9:H9').format={fill:colors.light,font:{name:FONT,size:10,bold:true,color:colors.navy},borders:{top:{style:'thin',color:colors.line}}};
summary.getRange('E7:E9').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:colors.amber,font:{bold:true,color:colors.red}}});
summary.getRange('A11').values=[['Prototype vérifié : parcours de jeu validé ; les tests du moteur seuls ne cochent pas cette colonne.']];
summary.getRange('A12').values=[['1:1 validé : certification de référence, jamais déduite de la présence d’un PNG.']];
summary.getRange('A11:A12').format.font={name:FONT,size:10,italic:true,color:colors.mid};
summary.getRange('A14:F14').values=[['Catégorie','Fiches canon','Fiches canon illustrées','Fiches originales','Fiches originales illustrées','Reste original']];
summary.getRange('A14:F14').format={fill:colors.navy,font:{name:FONT,size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:44};
const categories=unique(records.map(r=>r.category)).sort((a,b)=>a.localeCompare(b,'fr'));
categories.forEach((category,index)=>{
  const row=15+index;
  summary.getRange(`A${row}`).values=[[category]];
  summary.getRange(`B${row}`).formulas=[[`=COUNTIFS('Catalogue'!$D$6:$D$${end},$A${row},'Catalogue'!$C$6:$C$${end},$A$7)`]];
  summary.getRange(`C${row}`).formulas=[[`=COUNTIFS('Catalogue'!$D$6:$D$${end},$A${row},'Catalogue'!$C$6:$C$${end},$A$7,'Catalogue'!$G$6:$G$${end},1)`]];
  summary.getRange(`D${row}`).formulas=[[`=COUNTIFS('Catalogue'!$D$6:$D$${end},$A${row},'Catalogue'!$C$6:$C$${end},$A$8)`]];
  summary.getRange(`E${row}`).formulas=[[`=COUNTIFS('Catalogue'!$D$6:$D$${end},$A${row},'Catalogue'!$C$6:$C$${end},$A$8,'Catalogue'!$G$6:$G$${end},1)`]];
  summary.getRange(`F${row}`).formulas=[[`=D${row}-E${row}`]];
  summary.getRange(`A${row}:F${row}`).format.rowHeight=24;
  if(index%2)summary.getRange(`A${row}:F${row}`).format.fill='#F3F6F8';
});
const summaryNotesRow=17+categories.length;
summary.getRange(`A${summaryNotesRow}`).values=[['Lignes avec ID non unique']];
summary.getRange(`B${summaryNotesRow}`).formulas=[[`=COUNTIFS('Catalogue'!$Q$6:$Q$${end},0)`]];
summary.getRange(`A${summaryNotesRow+2}`).values=[['Les Dettes de Nacre']];
summary.getRange(`A${summaryNotesRow+2}`).format.font={name:FONT,size:10,bold:true,color:colors.navy};
summary.getRange(`A${summaryNotesRow+3}`).values=[['Création du projet, située en 2185 dans les Terminus. Aucun statut officiel revendiqué.']];
summary.getRange(`A${summaryNotesRow+4}`).values=[[`${nativeVerificationText}${inputVerificationText}. ${browserVerificationText}.`]];
summary.getRange(`A${summaryNotesRow+5}`).values=[['Kits complets, animations, parallaxe, scènes illustrées, voix et costumes restent suivis séparément.']];

const kitRows=[];
const moveDetailKeys = {
  guard:'Garde', kind:'Famille', airRecoveryMode:'Récupération aérienne',
  armingFrames:'Armement (f)', lifetimeFrames:'Durée de vie (f)', maximumInstances:'Instances max.',
  shieldRestore:'Bouclier restauré max.', chargesPerRound:'Charges par manche', cannotOvercap:'Sans dépassement',
  counterWindowFrames:'Fenêtre de contre (f)', durationFrames:'Durée (f)', durationSeconds:'Durée (s)',
  slowDurationFrames:'Ralentissement (f)', slowMultiplier:'Vitesse relative',
  targetInvulnerableDuringStasis:'Cible invulnérable en stase', temporaryDeployables:'Déployables temporaires',
  projectilePolicy:'Règle projectile', whiffPolicy:'En cas de raté', rankedEffect:'Effet en classé',
};
const moveDetailValue = (key,value) => typeof value === 'boolean' ? value ? 'oui' : 'non' :
  key === 'guard' ? ({mid:'intermédiaire',low:'basse',overhead:'haute',throw:'projection'}[value] || string(value)) : string(value);
for(const fighter of roster.fighters){
  const add=(category,move)=>kitRows.push([fighter.name,category,move.input||'',move.name||'',
    typeof move.damage==='number'?move.damage:null,move.startupFrames??null,move.activeFrames??null,move.recoveryFrames??null,
    move.meterCost??null,[move.intent||move.sequence||move.goal||move.line||'',move.animation].filter(Boolean).join('\n'),
    [move.counterplay||move.condition||'',...Object.entries(moveDetailKeys).filter(([key])=>move[key]!=null&&move[key]!=='')
      .map(([key,label])=>`${label} : ${moveDetailValue(key,move[key])}`)].filter(Boolean).join('\n'),
    'Conception ; kit complet non intégré']);
  fighter.normalMoves.forEach(move=>add('Normale',move));
  add('Commande normale',fighter.command); add('Projection',fighter.throw);
  fighter.specials.forEach(move=>add('Spécial',move)); add('Super',fighter.super);
  add('Neutralisation décisive',fighter.finisher); add('Assistance',fighter.assist); add('Provocation',fighter.taunt);
  fighter.combos.forEach((combo,index)=>add('Route de combo',{...combo,name:`Route ${index+1}`}));
  add('Identité de jeu',{name: fighter.role, intent:fighter.identity});
  add('Ressource et limites',{name:'Règle individuelle',intent:fighter.resource,counterplay:fighter.speciesLocks.join(' ; ')});
  add('Équipement',{name:'Fondement fictionnel',intent:fighter.equipment.join(' ; '),counterplay:'Paramètres de duel originaux ; aucun chiffre canon revendiqué.'});
}
const commonKitStart = 6 + kitRows.length;
const commonKitLabels = {
  notation:'Lecture des commandes', scope:'Périmètre des chiffres', simplifiedInputs:'Preuve de jouabilité',
  normalCancel:'Annulations', airRule:'Déplacement aérien', throws:'Projections et déchoppage',
  finisherRule:'Neutralisation décisive', tagRule:'Assistance et tag', damageRule:'Dégâts et protections', tuningGate:'Qualification',
};
kitRows.push(['Règles communes','Contrat de combat','L / M / H / S','RC-ARMAX-0.1',null,null,null,null,100,
  `Simulation proposée : ${roster.combatContract.simulationHz} Hz ; réserve maximale : ${roster.combatContract.meterMaximum} points ; super : ${roster.combatContract.superCost} points.`,
  'Valeurs de conception ; le code et ses preuves déterminent le sous-ensemble réellement joué.','Contrat de conception']);
for(const [key,label] of Object.entries(commonKitLabels))kitRows.push(['Règles communes','Contrat de combat','',label,null,null,null,null,null,
  roster.combatContract[key]||'','','Contrat de conception']);
const kitWidths=[29,24,25,30,12,13,13,15,14,90,85,35];
startSheet(sheets.Kits,'Kits des dix combattants','Paramètres provisoires à 60 Hz. Ces coups de conception ne sont pas tous exécutés par le prototype.',kitWidths,kitRows.length+7);
table(sheets.Kits,'NacreKits',['Personnage','Type','Commande','Coup','Dégâts','Début (f)','Actif (f)','Récupération (f)','Jauge','Fonction','Réponse ou condition','État'],kitRows,kitWidths,{numeric:[4,5,6,7,8],rowHeight:28,maxHeight:160});

const campaignRows=[];
for(const fighter of roster.fighters){
  const campaign=fighter.campaign;
  campaignRows.push([fighter.name,0,'Intro','', '',campaign.intro,'Route alternative du même incident local.','Conception',campaign.illustrationAssetIds[0],0]);
  campaign.stageIds.forEach((stageId,index)=>{
    const stage=stageById.get(stageId),boss=stage&&bossById.get(stage.bossId);
    campaignRows.push([fighter.name,index+1,'Étape',stageId,stage?.name||stageId,stage?.storyObjective||'',
      boss ? `Boss du lieu : ${boss.name}. Rencontre personnelle : ${campaign.personalBossIds.includes(boss.id)?'oui':'non'}.` : '',
      'Conception','',0]);
  });
  campaignRows.push([fighter.name,null,'Rival','',fighterById.get(campaign.rivalId)?.name||campaign.rivalId,
    `${campaign.rivalReason}\n${campaign.rivalDialogue.join('\n')}`,campaign.rivalOutcome,'Conception',campaign.illustrationAssetIds[1],0]);
  campaignRows.push([fighter.name,null,'Choix','', '',campaign.choice,'Conséquences locales ; aucune issue canon imposée.','Conception','',0]);
  campaignRows.push([fighter.name,null,'Ending','nacre_stage_20','Elyne Korda',campaign.ending,
    'Une illustration d’ending distincte du sprite de base reste nécessaire.','Conception',campaign.illustrationAssetIds[2],0]);
}
const campaignWidths=[29,10,16,27,30,85,75,17,45,15];
startSheet(sheets.Campagnes,'Campagnes de Nacre',campaignPartiallyVerified?'Dix routes de huit duels et textes raccordés au moteur ; choix avancés et illustrations à produire. Parcours navigateur non validé.':'Dix routes alternatives : intro, huit étapes, rivalité, choix et ending. Scènes à raccorder au prototype.',campaignWidths,campaignRows.length+7);
table(sheets.Campagnes,'NacreCampagnes',['Personnage','Étape','Scène','Stage ID','Lieu ou interlocuteur','Récit et objectif','Condition','État','Illustration prévue','Image présente'],campaignRows,campaignWidths,{numeric:[1,9],rowHeight:36,maxHeight:220});

const encounterRows=[];
for(const stage of world.stages){
  const boss=bossById.get(stage.bossId);
  encounterRows.push([stage.id,stage.name,'Stage',stage.act,stage.location,stage.storyObjective,
    stage.variants?.story?.hazard||'',stage.variants?.competitive?.rule||'',
    boss?.name||stage.bossId,`${stage.parallaxLayers?.length||0} couches à produire séparément`,recordById.get(stage.id)?.present||0,
    recordById.get(stage.id)?.present ? 'Fond fixe ; sélection codée, parcours UI à vérifier' : 'Conception ; fond à produire',sourceUrls(stage).join('\n')]);
  if(boss) encounterRows.push([boss.id,boss.name,'Boss',stage.act,boss.speciesOrChassis,boss.narrativeRole,
    boss.phases.map(phase=>`${phase.name} (${phase.entryHpPercentAtOrBelowProposal}% PV) : ${phase.pattern}\nAnnonce : ${phase.telegraph}\nRéponse : ${phase.counterplay}`).join('\n\n'),
    boss.rules?.mode||'Histoire / défi de boss',stage.name,boss.weakPoint,recordById.get(boss.id)?.present||0,
    coverage?.opposition?.unavailableBossIds?.includes(boss.id) ? 'Profil défini ; PNG absent, boss indisponible' : bossesPartiallyVerified ? 'Profil condensé testé ; patterns complets non validés' : 'Conception ; IA et phases non intégrées',sourceUrls(boss).join('\n')]);
}
const encounterWidths=[29,33,13,10,37,90,125,90,33,67,15,42,90];
startSheet(sheets.Rencontres,'Stages et rencontres de boss','20 couples stage et boss. Patterns complets et cinq couches par stage à produire ; états PV condensés suivis dans Gameplay.',encounterWidths,encounterRows.length+7);
table(sheets.Rencontres,'NacreRencontres',['ID','Nom','Type','Acte','Lieu ou espèce','Objectif narratif','Danger ou phases','Règle compétitive','Lien stage / boss','Production ou faiblesse','Image présente','État','Sources URL'],encounterRows,encounterWidths,{numeric:[3,10],rowHeight:64,maxHeight:260});

const fallbackGameplay=[
 ['simulation','Simulation à 60 Hz','Code à raccorder','Pas de preuve courante chargée.','Pas de certification de jeu déduite de la bible.'],
 ['movement','Mouvement, saut et garde','Code à raccorder','Pas de preuve courante chargée.','Le prototype sera évalué sur son exécution.'],
 ['fighter_profiles','Dix profils originaux','Conception','DLC/LesDettesDeNacre/nacre_roster_design.json','Kit complet non intégré.'],
 ['specials','Spéciaux et supers','Conception','40 spéciaux et dix supers spécifiés.','Un spécial simple par profil peut être prototypé séparément.'],
 ['story','Campagnes intro/rival/ending','Conception','Dix campagnes rédigées.','Scènes et transitions à implémenter.'],
 ['bosses','Vingt boss à trois phases','Conception','DLC/LesDettesDeNacre/nacre-world.json','IA et assets séparés à produire.'],
 ['tag','Tag et assistances','Conception','Dix assists décrites.','Aucun kit tag complet annoncé.'],
 ['tournament','Tournoi','Conception','Guide général et bible courante.','Arbre et progression à implémenter.'],
 ['parallax','Parallaxe','Conception','Cinq couches prévues par stage.','Un fond aplati ne constitue pas cinq couches.'],
 ['online','Réseau et classement','Non implémenté','Aucune preuve de réseau.','Aucune validation en ligne annoncée.'],
];
const gameplayRows=coverageFeatures.length ? coverageFeatures.map(feature=>[
  feature.id||feature.key||'',feature.feature||feature.name||feature.title||'',
  feature.status||'À vérifier',arr(feature.evidence||feature.evidencePaths||feature.proof||feature.path).map(string).join('\n'),
  feature.limitations||feature.remaining||feature.note||feature.scope||'',
]) : fallbackGameplay;
gameplayRows.push(['complete_kits','Kits complets de Nacre','Conception','DLC/LesDettesDeNacre/nacre_roster_design.json',
  'Neuf normales, commande, projection, quatre spéciaux, super, neutralisation, assist et taunt par personnage ; ce périmètre dépasse le prototype.']);
gameplayRows.push(['canonical_1to1','Fidélité 1:1 des contenus canoniques','Non certifiée','Catalogue : colonne 1:1 validé',
  'Un fichier présent est un candidat artistique. Les variantes et les références doivent être contrôlées individuellement.']);
if (coverage?.verification?.inputRoutingReport) gameplayRows.push([
  'input_routing_contracts',`${inputRoutingTests} contrats d’entrée courants`,
  inputRoutingPassed?'Contrats natifs vérifiés':'À vérifier',coverage.verification.inputRoutingReport,
  'Contrats du routage clavier et du pointeur ; cette preuve native ne valide pas un parcours UI ni les dix profils.']);
const currentFullSuite = coverage?.verification?.fullSuite;
const currentSuiteDifferences = arr(currentFullSuite?.changedRuntimeFiles ?? currentFullSuite?.currentSourceDifferences);
if (currentFullSuite) gameplayRows.push([
  'current_full_suite',currentFullSuite.sourceMatchesCurrent===false?'Suite générale — révision testée':'Suite générale courante',
  currentFullSuite.passed===true?(currentFullSuite.sourceMatchesCurrent===false?'Réussie sur la révision indiquée':'Suite courante réussie'):currentFullSuite.status||'À vérifier',
  [currentFullSuite.report,currentFullSuite.url].filter(Boolean).join('\n'),
  `Révision : ${currentFullSuite.sourceHead||'non renseignée'}. `+
  (currentFullSuite.passed===true?`${currentFullSuite.passedTests??'?'}/${currentFullSuite.reportedTests??currentFullSuite.tests??'?'} tests réussis ; ${currentFullSuite.failedTests??'?'} échec(s). `+
    `${currentFullSuite.buildPassed===true?`Compilation réussie (${currentFullSuite.buildModules??'?'} modules). `:''}`+
    `${currentFullSuite.sourceMatchesCurrent===true?'Sources concordantes avec la version courante. ':
      currentFullSuite.sourceMatchesCurrent===false?`Résultat rattaché à la révision testée ; sources courantes différentes${currentSuiteDifferences.length?` (${currentSuiteDifferences.join(', ')})`:''}. `:
      'Correspondance avec les sources courantes non établie. '}Résultat distinct des contrôles UI.`:
    'Aucune réussite courante déduite du résultat historique.')]);
const lastCompletedFullSuite = coverage?.verification?.lastCompletedFullSuite;
if (lastCompletedFullSuite) gameplayRows.push([
  'last_completed_full_suite',lastCompletedFullSuite.sourceMatchesCurrent===false?'Suite générale historique':'Dernière suite générale consignée',lastCompletedFullSuite.passed===true?'Réussie sur la révision indiquée':'Échec sur la révision indiquée',
  lastCompletedFullSuite.report||'',
  `${lastCompletedFullSuite.passedTests??'?'}/${lastCompletedFullSuite.tests??'?'} tests ; révision ${lastCompletedFullSuite.sourceHead||'non renseignée'}. `+
  (lastCompletedFullSuite.sourceMatchesCurrent===false?`Résultat historique : sources courantes différentes (${arr(lastCompletedFullSuite.changedRuntimeFiles).join(', ')}).`:'Correspondance avec les sources courantes à lire dans le rapport.')]);
const gameplayWidths=[31,38,35,80,96];
startSheet(sheets.Gameplay,'Couverture du gameplay',`${nativeVerificationText}${inputVerificationText} ; compilation ${coverage?.verification?.buildPassed?'réussie':'à vérifier'}. ${browserVerificationText}. Les kits complets restent ouverts.`,gameplayWidths,gameplayRows.length+10);
table(sheets.Gameplay,'NacreGameplay',['ID','Fonction','État observé','Preuve ou source','Limites et travail restant'],gameplayRows,gameplayWidths,{rowHeight:32,maxHeight:200});
// Keep the limited UI checks and their evidence readable in a focused view.
// Locate them by ID so a later coverage report can reorder its feature rows.
const uiReviewIds = new Set(['entry','render','touch','stages','isolation']);
const uiReviewRows = gameplayRows.flatMap((values,index) =>
  uiReviewIds.has(values[0]) ? [{row:index+6,values}] : []);
for (const {row,values} of uiReviewRows) {
  const lineCount = Math.max(1,...values.map((value,ci) => string(value).split('\n')
    .reduce((count,line) => count+Math.max(1,Math.ceil(line.length/Math.max(10,gameplayWidths[ci]-3))),0)));
  sheets.Gameplay.getRange(`A${row}:E${row}`).format.rowHeight = Math.min(409,Math.max(80,lineCount*13+12));
}
const uiReviewRange = uiReviewRows.length
  ? `A${Math.min(...uiReviewRows.map(item=>item.row))}:E${Math.max(...uiReviewRows.map(item=>item.row))}`
  : 'A1:E13';
sheets.Gameplay.tabColor=colors.mid;

workbook.recalculate();
const numericValues=range=>summary.getRange(range).values.map(row=>row.map(value=>Number(value)));
const before=numericValues('B7:H9');
const expected=[
  records.filter(r=>r.scope==='Canon adapté'),records.filter(r=>r.scope==='Original'),records,
].map(rows=>[rows.length,rows.filter(r=>r.present===1).length,rows.filter(r=>r.present===0).length,0,
  rows.filter(r=>r.prototype===1).length,rows.filter(r=>r.fullKit===1).length,rows.filter(r=>r.fidelity===1).length]);
if(JSON.stringify(before)!==JSON.stringify(expected)) throw new Error(`Summary does not reconcile: ${JSON.stringify({before,expected})}`);

// Meaningful recalculation checks are temporary and restored before export.
const smokeProbeCoverage = coverage || {};
const hadSmokeFlag = Object.prototype.hasOwnProperty.call(smokeProbeCoverage, 'smokeTestPassed');
const savedSmokeFlag = smokeProbeCoverage.smokeTestPassed;
const fighterRows = roster.fighters.map(fighter => rowFor.get(fighter.id));
const readPrototypeCells = () => fighterRows.map(row => Number(sheets.Catalogue.getRange(`I${row}`).values[0][0]));
const savedPrototypeCells = readPrototypeCells();
try {
  smokeProbeCoverage.smokeTestPassed = true;
  const probeVerified = prototypeVerificationFor(smokeProbeCoverage);
  fighterRows.forEach(row => { sheets.Catalogue.getRange(`I${row}`).values = [[probeVerified ? 1 : 0]]; });
  workbook.recalculate();
  if (JSON.stringify(readPrototypeCells()) !== JSON.stringify(savedPrototypeCells) ||
      JSON.stringify(numericValues('B7:H9')) !== JSON.stringify(before)) {
    throw new Error('A smoke-test flag changed prototype certification cells.');
  }
} finally {
  if (hadSmokeFlag) smokeProbeCoverage.smokeTestPassed = savedSmokeFlag;
  else delete smokeProbeCoverage.smokeTestPassed;
  fighterRows.forEach((row,index) => { sheets.Catalogue.getRange(`I${row}`).values = [[savedPrototypeCells[index]]]; });
  workbook.recalculate();
}
if (Object.prototype.hasOwnProperty.call(smokeProbeCoverage, 'smokeTestPassed') !== hadSmokeFlag ||
    smokeProbeCoverage.smokeTestPassed !== savedSmokeFlag ||
    JSON.stringify(readPrototypeCells()) !== JSON.stringify(savedPrototypeCells)) {
  throw new Error('Smoke-test probe was not restored.');
}
const sample=records.find(record=>record.scope==='Original');
const sampleRow=rowFor.get(sample.id);
const samplePresence=sample.present;
sheets.Catalogue.getRange(`G${sampleRow}`).values=[[1-samplePresence]];
workbook.recalculate();
const edited=numericValues('B7:H9');
const delta=samplePresence? -1 : 1;
if(edited[1][1]!==before[1][1]+delta||edited[2][1]!==before[2][1]+delta)throw new Error('Image presence recalculation failed.');
sheets.Catalogue.getRange(`G${sampleRow}`).values=[[null]];
workbook.recalculate();
const blank=numericValues('B7:H9');
if(blank[1][3]!==1||blank[2][3]!==1)throw new Error('Blank presence was silently counted as absent.');
sheets.Catalogue.getRange(`G${sampleRow}`).values=[[samplePresence]];
const secondOriginal=records.filter(r=>r.scope==='Original')[1];
const secondRow=rowFor.get(secondOriginal.id);
sheets.Catalogue.getRange(`A${secondRow}`).values=[[sample.id]];
workbook.recalculate();
if(Number(summary.getRange(`B${summaryNotesRow}`).values[0][0])!==2)throw new Error('Duplicate IDs did not become visible.');
sheets.Catalogue.getRange(`A${secondRow}`).values=[[secondOriginal.id]];
workbook.recalculate();
const restored=numericValues('B7:H9');
if(JSON.stringify(restored)!==JSON.stringify(before))throw new Error('Temporary tests were not restored.');
if(Number(summary.getRange(`B${summaryNotesRow}`).values[0][0])!==0)throw new Error('Duplicate test was not restored.');

await fs.mkdir(qaDir,{recursive:true});
await fs.mkdir(outputDir,{recursive:true});
const summaryInspection=await workbook.inspect({kind:'table',range:'Synthèse!A6:H9',include:'values,formulas',tableMaxRows:4,tableMaxCols:8,maxChars:6000});
await fs.writeFile(path.join(qaDir,'summary-inspection.ndjson'),summaryInspection.ndjson+'\n');
const errors=await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',
  options:{useRegex:true,maxResults:300},summary:'Final formula error scan',maxChars:10000});
await fs.writeFile(path.join(qaDir,'formula-error-scan.ndjson'),errors.ndjson+'\n');
const actualFormulaError=/#(?:REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)/.test(errors.ndjson.replace(/#REF!\|#DIV\/0!\|#VALUE!\|#NAME\\\?\|#N\/A\|#NUM!\|#NULL!\|#SPILL!\|#CALC!/g,''));
if(actualFormulaError && !/"matches":\s*\[\s*\]/.test(errors.ndjson)) {
  throw new Error(`Formula scan returned an error; inspect ${path.join(qaDir,'formula-error-scan.ndjson')}.`);
}
const renderJobs=[
 ['Synthèse','A1:H'+(summaryNotesRow+5),'01-synthese.png'],
 ['Gameplay','A1:E13','02-gameplay.png'],
 ['Kits','A1:I15','03-kits-commandes.png'],
 ['Kits','J5:L12','04-kits-fonctions.png'],
 ['Campagnes','A1:F10','05-campagnes.png'],
 ['Rencontres','A1:F9','06-rencontres.png'],
 ['Rencontres','G5:J9','07-rencontres-phases.png'],
 ['Catalogue','A1:H13','08-catalogue-canon.png'],
 ['Catalogue',`A${6+canonicalCount}:H${Math.min(end,15+canonicalCount)}`,'09-catalogue-originaux.png'],
 ['Catalogue','L5:Q9','10-catalogue-preuves.png'],
 ['Kits','J219:L221','11-kit-dalo-limites.png'],
 ['Kits',`J${commonKitStart}:L${commonKitStart+5}`,'12-kits-regles-communes.png'],
 ['Catalogue',`L${sourceAppendixStart-1}:O${sourceAppendixStart+4}`,'13-index-sources.png'],
 ['Gameplay',uiReviewRange,'14-gameplay-controles-ui.png',
   'Contrôles UI limités et réserves de chaque fonction ; aucune certification des dix profils, des assets ou des kits complets déduite de cette vue.'],
];
for(const [sheetName,range,filename] of renderJobs){
  const preview=await workbook.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(path.join(qaDir,filename),new Uint8Array(await preview.arrayBuffer()));
}
const xlsx=await SpreadsheetFile.exportXlsx(workbook);
const outputPath=path.join(outputDir,fileName);
await xlsx.save(outputPath);
await fs.copyFile(outputPath,path.join(docDir,fileName));
const verification={
  generatedAt:new Date().toISOString(),date:'2026-11-27',builder:'scripts/build-armax-lot22-workbook.mjs',
  runtime:'CODEX_PRIMARY_RUNTIME_NODE / @oai/artifact-tool',gitHead,
  sources:{catalog:sourcePath(catalogPath),roster:sourcePath(rosterPath),world:sourcePath(worldPath),coverage:coveragePath?sourcePath(coveragePath):null,
    canonicalFollowup:canonicalFollowup?sourcePath(canonicalFollowupPath):null,
    revisionReferenceManifest:revisionReferences.length?sourcePath(revisionReferencePath):null},
  sourceSha256:Object.fromEntries(Object.entries(sourceSha256).sort(([left],[right])=>left.localeCompare(right))),
  sheets:Object.keys(sheets),records:records.length,canonicalRecords:canonicalCount,originalRecords:originalCount,
  sourceIndex:{count:referenceUrls.length,startRow:sourceAppendixStart,range:`Catalogue!L${sourceAppendixStart}:O${sourceAppendixBottom}`,allOriginalUrlsPreserved:true},
  originalCounts:Object.fromEntries(['fighter','stage','enemy','boss','prop','projectile_vfx'].map(category=>[category,[...entries.values()].filter(e=>e.scope==='Original'&&e.category===category).length])),
  summaryColumns:['fiches','avec_image','sans_image','presence_non_renseignee','prototype_verifie','kit_complet','fidelite_validee'],
  summaryRows:{canon:before[0],original:before[1],total:before[2]},
  gameplayVerification:{nativeTestsPassed,nativeTestsCount,inputRoutingPassed,inputRoutingTests,prototypeVerified,partialUiChecksPassed,browserQueued,
    buildPassed:coverage?.verification?.buildPassed===true,currentFullSuite:currentFullSuite||null,lastCompletedFullSuite:lastCompletedFullSuite||null,
    statusCounts:Object.fromEntries(unique(coverageFeatures.map(f=>f.status)).map(status=>[status,coverageFeatures.filter(f=>f.status===status).length]))},
  tests:{independentSourceReconciliation:true,smokeFlagDoesNotPromoteProfiles:true,smokeProbeRestored:true,imagePresenceChange:true,blankPresenceVisible:true,duplicateIdVisible:true,temporaryEditsRestored:true},
  views:renderJobs.map(([sheet,range,file,scope])=>({sheet,range,file,scale:1,...(scope?{scope}:{})})),
  visualReviewStatus:'Rendered; human/model visual inspection still required after this run.',
  nativeExcelOpened:false,
  limitations:['Formula calculation verified with artifact-tool; no native Microsoft Excel execution claimed.',
    'A tracked Git blob proves repository presence but may not be materialized locally; both states remain distinct.',
    'No prior workbook was modified. New source data does not assert animation, complete kit, campaign or 1:1 certification.'],
  output:outputPath,repositoryCopy:path.join(docDir,fileName),
};
await fs.writeFile(path.join(qaDir,'workbook-verification.json'),JSON.stringify(verification,null,2)+'\n');
console.log(JSON.stringify({output:outputPath,repositoryCopy:verification.repositoryCopy,records:records.length,canonical:canonicalCount,original:originalCount,summary:verification.summaryRows,renderedViews:renderJobs.length,prototypeVerified,qa:qaDir}));

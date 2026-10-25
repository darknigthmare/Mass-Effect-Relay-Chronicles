import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Author with the Codex primary runtime. No repository-local spreadsheet dependency is required.
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if (!modules) throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required to build the workbook with @oai/artifact-tool.');
const runtimeRequire = createRequire(path.join(modules, '__relay_workbook__.cjs'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const suppliedRoot = process.argv.indexOf('--root');
const root = suppliedRoot >= 0 ? path.resolve(process.argv[suppliedRoot + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const renderIndex=process.argv.indexOf('--render-sheets');
const renderOnly=renderIndex>=0?new Set(process.argv[renderIndex+1].split(',')):null;
const catalog = JSON.parse(await fs.readFile(path.join(root, 'docs/content-catalog.json'), 'utf8'));
const outPath = path.join(root, 'docs/Mass_Effect_Relay_Chronicles_Production.xlsx');
const previewDir = path.join(root, 'docs/workbook-previews');
await fs.mkdir(previewDir, { recursive: true });

const colors = { navy:'#102438', teal:'#087F8C', text:'#183044', faint:'#EDF5F7', amber:'#FFF0C7', light:'#F8FBFC', white:'#FFFFFF', line:'#D5E2E8' };
const wb = Workbook.create();
const dashboard = wb.worksheets.add('Dashboard');
const worksheets = new Map(catalog.categories.map(c => [c.id, wb.worksheets.add(c.sheetName)]));
const guide = wb.worksheets.add('Guide');
const fields = [
 ['id','Identifiant',33],['name','Élément',39],['status','Contenu',15],['assetStatus','Asset',16],
 ['priority','Priorité',10],['episode','Épisode',11],['canonLevel','Canon',25],
 ['description','Description',55],['acceptance','Critère d’acceptation',62],['dependencies','Dépendances',44],
 ['plannedPath','Destination prévue',54],['assetPath','Fichier existant',48],['gameKey','Clé dans le jeu',24],
 ['reference','Référence à contrôler',60],['sourceUrl','Source URL',64],['scope','Périmètre',22],['notes','Notes',66],
];
const letters = i => { let n=i+1,s=''; do {n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}while(n);return s; };
const lastCol=letters(fields.length-1);
function base(sheet,range){
 sheet.showGridLines=false;
 sheet.getRange(range).format.font={name:'Arial',size:10,color:colors.text};
 sheet.getRange(range).format.verticalAlignment='center';
 sheet.getRange(range).format.rowHeight=22;
}
function header(sheet,range){
 sheet.getRange(range).format={fill:colors.navy,font:{name:'Arial',size:10,bold:true,color:colors.white},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:34,borders:{bottom:{style:'thin',color:colors.teal}}};
}
function title(sheet,label,subtitle,last='I'){
 sheet.getRange('A2').values=[[label]];
 sheet.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:colors.navy};
 sheet.getRange('A3').values=[[subtitle]];
 sheet.getRange('A3').format.font={name:'Arial',size:10,italic:true,color:'#4A6374'};
 sheet.getRange(`A4:${last}4`).format.borders={bottom:{style:'thin',color:colors.teal}};
}
const stats=[];
for(const category of catalog.categories){
 const sheet=worksheets.get(category.id);
 const records=catalog.entries.filter(e=>e.category===category.id);
 const end=6+records.length;
 base(sheet,`A1:${lastCol}${end}`);
 title(sheet,category.title,category.description);
 sheet.getRange(`A6:${lastCol}6`).values=[fields.map(f=>f[1])];
 const matrix=records.map(e=>fields.map(([key])=>Array.isArray(e[key])?e[key].join(', '):(e[key]??'')));
 sheet.getRange(`A7:${lastCol}${end}`).values=matrix;
 fields.forEach(([, ,width],i)=>sheet.getRange(`${letters(i)}1:${letters(i)}${end}`).format.columnWidth=width);
 sheet.getRange(`A7:${lastCol}${end}`).format.wrapText=true;
 sheet.getRange(`A7:${lastCol}${end}`).format.verticalAlignment='top';
 for(let index=0;index<matrix.length;index++){
  const estimatedLines=Math.max(...matrix[index].map((value,j)=>Math.ceil(String(value).length/(fields[j][2]*0.9))));
  // Extend row height only for the enriched delivery; preserve unrelated rows.
  const maxHeight=records[index].deliveryVersion==='0.2.0'?260:100;
  sheet.getRange(`A${7+index}:${lastCol}${7+index}`).format.rowHeight=Math.max(36,Math.min(maxHeight,estimatedLines*13+10));
 }
 sheet.getRange(`C7:G${end}`).format.horizontalAlignment='center';
 sheet.getRange(`C7:G${end}`).format.verticalAlignment='center';
 sheet.getRange(`C7:C${end}`).format.fill=colors.amber;
 sheet.getRange(`D7:D${end}`).format.fill='#FFF7E1';
 sheet.getRange(`A7:A${end}`).format.font={name:'Arial',size:10,color:'#557283'};
 for(let r=7;r<=end;r+=2) {
  sheet.getRange(`A${r}:B${r}`).format.fill=colors.light;
  sheet.getRange(`E${r}:${lastCol}${r}`).format.fill=colors.light;
 }
 const table=sheet.tables.add(`A6:${lastCol}${end}`,true,`Catalog_${category.id}`);
 table.showFilterButton=true;
 table.showBandedColumns=false;
 header(sheet,`A6:${lastCol}6`);
 sheet.getRange(`C7:C${end}`).dataValidation={rule:{type:'list',values:Object.keys(catalog.meta.statusDefinitions)}};
 sheet.getRange(`D7:D${end}`).dataValidation={rule:{type:'list',values:catalog.meta.assetStatusValues}};
 sheet.getRange(`E7:E${end}`).dataValidation={rule:{type:'list',values:['P0','P1','P2']}};
 sheet.getRange(`F7:F${end}`).dataValidation={rule:{type:'list',values:['ME1','ME2','ME3','TRANSVERSE']}};
 sheet.getRange(`G7:G${end}`).dataValidation={rule:{type:'list',values:Object.keys(catalog.meta.canonDefinitions)}};
 const statusRange=sheet.getRange(`C7:C${end}`);
 for(const [status,fill,color] of [['Prototype','#FFF1D0','#865000'],['Intégré','#D9EEF2','#0C5966'],['Validé','#DDF1E8','#176A4D']]){
  statusRange.conditionalFormats.add('cellIs',{operator:'equal',formula:`"${status}"`,format:{fill,font:{color,bold:true}}});
 }
 sheet.getRange(`G7:G${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"Référence à vérifier"',format:{fill:'#FFF2DC',font:{color:'#79520A'}}});
 sheet.getRange(`E7:E${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"P0"',format:{font:{bold:true,color:colors.teal}}});
 sheet.freezePanes.freezeRows(6);
 sheet.freezePanes.freezeColumns(2);
 if(category.id==='trilogy')sheet.tabColor='#8095A7';
 stats.push({category,records,end});
}

base(dashboard,'A1:K43');
dashboard.tabColor=colors.navy;
title(dashboard,'Mass Effect Relay Chronicles — Production','ME1 prioritaire. Extensions ME2 et ME3 séparées. Statuts liés aux feuilles de contenu.','K');
const dWidths=[28,12,13,13,13,13,17,21,16,12,16];
dWidths.forEach((width,i)=>dashboard.getRange(`${letters(i)}1:${letters(i)}43`).format.columnWidth=width);
dashboard.getRange('A5').values=[['Éléments suivis']];
dashboard.getRange('B5').formulas=[['=SUM(B10:B35)']];
dashboard.getRange('D5').values=[['Intégrés']];
dashboard.getRange('E5').formulas=[['=SUM(E10:F35)']];
dashboard.getRange('G5').values=[['Références à vérifier']];
dashboard.getRange('H5').formulas=[['=SUM(H10:H35)']];
dashboard.getRange('J5').values=[['Validés']];
dashboard.getRange('K5').formulas=[['=SUM(F10:F35)']];
for(const cell of ['B5','E5','H5','K5'])dashboard.getRange(cell).format.font={name:'Arial',size:14,bold:true,color:colors.teal};
dashboard.getRange('A7').values=[['Une ligne décrit un élément à produire ou à vérifier. Un statut Défini ne signifie pas jouable.']];
dashboard.getRange('A7').format.font={name:'Arial',size:10,italic:true,color:'#4A6374'};
dashboard.getRange('A9:K9').values=[['Catégorie','Total','Défini','Prototype','Intégré','Validé','Canon confirmé','Réf. à vérifier','Adaptation','ME1','Extension future']];
header(dashboard,'A9:K9');
for(let i=0;i<stats.length;i++){
 const {category,end}=stats[i],r=10+i,name=category.sheetName.replaceAll("'","''");
 const ref=col=>`'${name}'!$${col}$7:$${col}$${end}`;
 dashboard.getRange(`A${r}`).values=[[category.title]];
 dashboard.getRange(`B${r}:K${r}`).formulas=[[
  `=COUNTA(${ref('A')})`,...['Défini','Prototype','Intégré','Validé'].map(s=>`=COUNTIFS(${ref('C')},"${s}")`),
  ...['Confirmé','Référence à vérifier','Adaptation'].map(s=>`=COUNTIFS(${ref('G')},"${s}")`),
  `=COUNTIFS(${ref('F')},"ME1")`,`=COUNTIFS(${ref('P')},"Extension future")`
 ]];
 if(i%2===0)dashboard.getRange(`A${r}:K${r}`).format.fill=colors.faint;
}
dashboard.getRange('A37').values=[['TOTAL']];
dashboard.getRange('B37:K37').formulas=[Array.from({length:10},(_,i)=>`=SUM(${letters(i+1)}10:${letters(i+1)}35)`)];
dashboard.getRange('A37:K37').format={fill:colors.navy,font:{name:'Arial',size:10,bold:true,color:colors.white},rowHeight:28};
dashboard.getRange('B10:K37').setNumberFormat('#,##0');
dashboard.getRange('B10:K37').format.horizontalAlignment='right';
dashboard.getRange('A39').values=[['Prototype : contenu simplifié. Intégré : présence vérifiée. Validé : preuve de contrôle disponible.']];
dashboard.getRange('A41').values=[['Les chemins « Destination prévue » ne sont pas des fichiers existants. Consulter « Fichier existant » pour les preuves.']];
dashboard.freezePanes.freezeRows(9);

const guideFooter=32+catalog.sources.length;
const guideEnd=guideFooter+6;
base(guide,`A1:D${guideEnd}`);
guide.tabColor='#78929B';
title(guide,'Guide du catalogue','Définitions, périmètre et références de production.','D');
guide.getRange(`A1:A${guideEnd}`).format.columnWidth=26;
guide.getRange(`B1:B${guideEnd}`).format.columnWidth=78;
guide.getRange(`C1:C${guideEnd}`).format.columnWidth=42;
guide.getRange(`D1:D${guideEnd}`).format.columnWidth=100;
guide.getRange('A6:B6').values=[['Statut du contenu','Signification']];
header(guide,'A6:B6');
guide.getRange('A7:B10').values=Object.entries(catalog.meta.statusDefinitions);
guide.getRange('A13:B13').values=[['Niveau de canon','Signification']];
header(guide,'A13:B13');
guide.getRange('A14:B16').values=Object.entries(catalog.meta.canonDefinitions);
guide.getRange('A19:B19').values=[['Champ','Utilisation']];
header(guide,'A19:B19');
guide.getRange('A20:B26').values=[
 ['Destination prévue','Chemin de production envisagé. Il ne prouve pas qu’un fichier existe.'],
 ['Fichier existant','Chemin vers une réalisation réellement présente et contrôlée.'],
 ['P0','Fonctionnement du prototype, cohérence de base et validation.'],
 ['P1','Complétude du premier épisode et qualité artistique.'],
 ['P2','Extensions et contenus ultérieurs.'],
 ['Édition du classeur','Les compteurs se recalculent. Les modifications Excel ne sont pas automatiquement réimportées dans le JSON.'],
 ['Régénération','Le script relit docs/content-catalog.json et remplace le classeur. Reporter les décisions approuvées dans ce JSON avant une régénération.'],
 ];
guide.getRange('A29:D29').values=[['Source','Titre','Périmètre','URL']];
header(guide,'A29:D29');
guide.getRange(`A30:D${29+catalog.sources.length}`).values=catalog.sources.map(s=>[s.id,s.title,s.scope,s.url??'Conception du projet, sans source externe']);
guide.getRange(`A${guideFooter}:B${guideFooter+3}`).values=[['Périmètre',catalog.meta.scope],['Fidélité',catalog.meta.fidelity],['Version',catalog.meta.version],['Date de référence',new Date(`${catalog.meta.updatedAt}T12:00:00Z`)]];
guide.getRange(`B${guideFooter+3}`).setNumberFormat('dd/mm/yyyy');
guide.getRange(`A6:D${guideFooter+3}`).format.wrapText=true;
guide.getRange(`A7:D${guideFooter+3}`).format.verticalAlignment='top';
guide.getRange(`A7:D${guideFooter+3}`).format.rowHeight=42;
guide.getRange('A14:B16').format.rowHeight=48;
guide.getRange('A25:B26').format.rowHeight=60;
guide.getRange(`A${guideFooter}:B${guideFooter+1}`).format.rowHeight=68;
catalog.sources.forEach((source,index)=>{
 const cells=[source.id,source.title,source.scope,source.url||'Conception du projet, sans source externe'];
 const widths=[26,78,42,100];
 const lines=Math.max(...cells.map((value,i)=>Math.ceil(String(value).length/(widths[i]*.85))));
 guide.getRange(`A${30+index}:D${30+index}`).format.rowHeight=Math.max(42,lines*13+10);
});
guide.freezePanes.freezeRows(6);

// Validate formula recalculation after an editable status changes, then restore it.
const first=worksheets.get(catalog.categories[0].id);
const prior=first.getRange('C7').values[0][0];
const before=Number(dashboard.getRange('F10').values[0][0]);
first.getRange('C7').values=[['Validé']];
const after=Number(dashboard.getRange('F10').values[0][0]);
if(prior!=='Validé' && after!==before+1)throw new Error(`Status recalculation failed: ${before} -> ${after}`);
first.getRange('C7').values=[[prior]];
wb.recalculate();
const total=Number(dashboard.getRange('B37').values[0][0]);
if(total!==catalog.entries.length)throw new Error(`Total mismatch: ${total} != ${catalog.entries.length}`);
const formulaCheck=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Formula error scan',maxChars:3500});
const dashboardCheck=await wb.inspect({kind:'table',range:'Dashboard!A35:K37',include:'values,formulas',tableMaxRows:3,tableMaxCols:11,maxChars:4000});
await fs.writeFile(path.join(previewDir,'verification.json'),JSON.stringify({total,records:catalog.entries.length,statusMutation:{before,after,restored:prior},formulaScan:formulaCheck.ndjson,dashboard:dashboardCheck.ndjson},null,2));
console.log(JSON.stringify({total,formulaScan:formulaCheck.ndjson}));
const output=await SpreadsheetFile.exportXlsx(wb);
await output.save(outPath);
await fs.rename(`${outPath}.inspect.ndjson`,path.join(previewDir,'export-inspect.ndjson')).catch(error=>{if(error.code!=='ENOENT')throw error;});
for(const sheetName of ['Dashboard',...catalog.categories.map(c=>c.sheetName),'Guide']){
 if(renderOnly&&!renderOnly.has(sheetName))continue;
 const range=sheetName==='Dashboard'?'A1:K38':sheetName==='Guide'?'A1:B16':'A1:I11';
 const preview=await wb.render({sheetName,range,scale:1.25,format:'png'});
 await fs.writeFile(path.join(previewDir,`${sheetName}.png`),new Uint8Array(await preview.arrayBuffer()));
 console.log(`Rendered ${sheetName}`);
}
// Targeted views expose late-table records instead of hiding new assets below the first preview page.
for(const [categoryId,ids,filename] of [
 ['enemies',['ENM-matriarche-benezia','ENM-thorian','ENM-saren-sur-virmire','ENM-saren-a-la-citadelle'],'Boss-focus'],
 ['sprites',['SPR-VEH-mako','SPR-VEH-normandy-sr-1','SPR-VEH-sovereign'],'Vehicules-focus'],
 ['side_quests',['SIDE-citadelle-plainte-de-xeltan','OPSTEP-citadel-xeltan-evidence'],'Annexes-focus'],
 ['side_quests',['OPSTEP-citadel-consort-reception','OPSTEP-citadel-consort-request'],'Etapes-focus'],
 ['enemies',['OPENCOUNTER-michel-blackmailer','OPENCOUNTER-tunnel-geth'],'Rencontres-focus'],
 ['weapons',['GEAR-kessler-i','GEAR-lancer-i','GEAR-storm-i'],'Armes-v02-focus'],
 ['equipment',['GEAR-onyx-human-i','GEAR-phoenix-human-iii','GEAR-colossus-human-vii'],'Armures-v02-focus'],
 ['equipment',['GEAR-armor-piercing-rounds-i','GEAR-tungsten-rounds-iv','GEAR-shredder-rounds-iv'],'Modules-v02-focus'],
 ['animations',['FRAME-femshep-walk-front-0','FRAME-femshep-walk-front-1'],'Marche-femme-focus'],
 ['animations',['FRAME-femshep-combat-hit','FRAME-femshep-combat-down'],'Combat-femme-focus'],
 ['systems',['SYS-chroniques-contextuelles','SYS-clips-thermiques'],'Chroniques-focus'],
 ['systems',['SYS-preparations-chroniques','SYS-modules-chroniques','SYS-lectures-chroniques'],'Chantiers-chroniques-focus'],
]){
 const category=catalog.categories.find(c=>c.id===categoryId);
 if(renderOnly&&!renderOnly.has(category.sheetName))continue;
 const rows=catalog.entries.filter(e=>e.category===categoryId);
 const indices=ids.map(id=>rows.findIndex(e=>e.id===id)+7);
 if(indices.some(index=>index<7))continue;
 const preview=await wb.render({sheetName:category.sheetName,range:`A${Math.min(...indices)}:I${Math.max(...indices)}`,scale:1.25,format:'png'});
 await fs.writeFile(path.join(previewDir,`${filename}.png`),new Uint8Array(await preview.arrayBuffer()));
 console.log(`Rendered ${filename}`);
}
if(!renderOnly||renderOnly.has('Guide')){
 const preview=await wb.render({sheetName:'Guide',range:`A${Math.max(30,29+catalog.sources.length-2)}:D${guideFooter+3}`,scale:1.25,format:'png'});
 await fs.writeFile(path.join(previewDir,'Guide-sources-focus.png'),new Uint8Array(await preview.arrayBuffer()));
}
console.log(`Workbook exported: ${outPath}`);

// Keep the GitHub-readable index tied to the same catalogue as the workbook.
const countBy=key=>catalog.entries.reduce((result,e)=>{result[e[key]]=(result[e[key]]||0)+1;return result;},{});
const statusCounts=countBy('status'),canonCounts=countBy('canonLevel'),episodeCounts=countBy('episode');
const fr=n=>new Intl.NumberFormat('fr-FR').format(n);
const safe=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
const categoryRows=catalog.categories.map(category=>{
 const entries=catalog.entries.filter(e=>e.category===category.id);
 const counts=Object.fromEntries(Object.keys(catalog.meta.statusDefinitions).map(status=>[status,entries.filter(e=>e.status===status).length]));
 return `| ${safe(category.title)} | ${entries.length} | ${counts['Défini']} | ${counts.Prototype} | ${counts['Intégré']} | ${counts['Validé']} | ${safe(category.description)} |`;
}).join('\n');
const statusRows=Object.entries(catalog.meta.statusDefinitions).map(([label,meaning])=>`| ${label} | ${fr(statusCounts[label]||0)} | ${safe(meaning)} |`).join('\n');
const canonRows=Object.entries(catalog.meta.canonDefinitions).map(([label,meaning])=>`| ${label} | ${fr(canonCounts[label]||0)} | ${safe(meaning)} |`).join('\n');
const sourceRows=catalog.sources.map(source=>`| ${source.id} | ${source.url?`[${safe(source.title)}](${source.url})`:safe(source.title)} | ${safe(source.scope)} |`).join('\n');
const atlasRows=(catalog.meta.prototypeCoverage.atlases||[]).map(atlas=>`| [${atlas.path.split('/').pop()}](../${atlas.path}) | ${safe(atlas.scope)} | Prototype |`).join('\n');
const doc=`# Catalogue de production — Mass Effect Relay Chronicles

Mise à jour : **${catalog.meta.updatedAt}** · Version ${catalog.meta.version}

Ce catalogue contient **${fr(catalog.entries.length)} fiches**, organisées en **${catalog.categories.length} catégories** et **${catalog.categories.length+2} onglets Excel**. Il décrit un plan de couverture du premier Mass Effect, puis une extension séparée vers ME2 et ME3. Le nombre de fiches mesure le travail suivi ; il ne mesure pas le nombre de fonctionnalités terminées.

- [Classeur de production](Mass_Effect_Relay_Chronicles_Production.xlsx) : filtres, statuts modifiables, validations de saisie, volets figés et tableaux de comptage recalculés.
- [Données de référence du catalogue](content-catalog.json) : identifiants stables, dépendances, références, chemins et critères d’acceptation.
- [Générateur du classeur et de cette page](../scripts/build-workbook.mjs).
- [Aperçu du tableau de bord](workbook-previews/Dashboard.png) · [Vérification des formules](workbook-previews/verification.json) · [Contrôle du fichier exporté](workbook-previews/native-export-check.json).

## État réel

| Statut du contenu | Fiches | Signification |
| --- | ---: | --- |
${statusRows}

Un statut de contenu et un statut d’asset décrivent deux choses distinctes. Une image peut être au stade **Prototype** alors que le dialogue, la mission ou la conduite correspondante reste **Défini**. Les éventuelles fiches **Validé** attestent leurs critères fonctionnels documentés ; elles ne certifient pas la fidélité 1:1 de l’ensemble du jeu.

| Niveau de canon | Fiches | Signification |
| --- | ---: | --- |
${canonRows}

Le périmètre comprend **${fr(episodeCounts.ME1||0)} fiches ME1**, **${fr(episodeCounts.ME2||0)} fiches ME2**, **${fr(episodeCounts.ME3||0)} fiches ME3** et **${fr(episodeCounts.TRANSVERSE||0)} systèmes transversaux**. Les 57 fiches d’extension futures du classeur principal restent séparées ; les nouveaux essais sont suivis dans les classeurs propres aux œuvres. Un élément canonique confirmé ne signifie pas que sa représentation graphique ou ses mécaniques sont fidèles.

## Couverture du prototype

Les preuves locales se trouvent dans [world-data.js](../src/world-data.js), [world.js](../src/world.js), [game-data.js](../src/game-data.js) et [combat.js](../src/combat.js).

| Domaine | Ce qui est représenté | Limite de couverture |
| --- | --- | --- |
| Exploration | 9 zones jouables condensées : Normandy, Eden Prime, Citadelle, Thérum, Feros, Noveria, Virmire, Ilos et Citadelle assiégée | 8 destinations distinctes ; la Citadelle revient sous deux états. Les 100 sous-zones et 91 liaisons du catalogue restent un plan à produire. |
| Personnages | 8 identités dans les données : Shepard, Ashley, Kaidan, Jenkins, Garrus, Tali, Wrex et Liara | Ce nombre inclut Shepard et Jenkins ; il ne désigne pas huit compagnons permanents. Poses et costumes définitifs non validés. |
| Dossier Shepard | Apparence masculine/féminine, trois origines et trois profils psychologiques, conservés après reprise et import | Portraits et sprites liés à l’apparence ; marche féminine et quatre poses de combat. Réactions narratives complètes aux antécédents, créateur facial et costumes définitifs restent à produire. |
| Combat | 21 rencontres de campagne et ${catalog.meta.prototypeCoverage.operationEncounterCount} rencontres annexes possibles, commandes ATB | Adaptation de conception ; elle ne reproduit pas les combats originaux à l’identique. Les étapes narratives du catalogue sont distinctes de ces rencontres. |
| Codex | ${catalog.meta.prototypeCoverage.codexCount} entrées à découverte progressive avec recherche | Les entrées dépendant de Liara, Féros, Virmire et Ilos sont conditionnées aux événements connus. Ne représente pas le codex complet de Mass Effect. |
| Boss | Images de Saren, Bénézia, Thorien et Saren final | Quatre poses de prototype. Mise en scène, variantes et animations complètes à produire. |
| PNJ | Anderson, Joker, Chakwas, Udina et Kirrahe placés ; Nihlus présent au Normandy avant Eden Prime ; Emily intervient dans son opération | Les nouveaux contacts utilisent des marqueurs et dialogues, sans sprites de terrain dédiés. L’image de Joker est debout ; sa pose assise reste à produire. Les positions appartiennent aux décors condensés de l’adaptation. |
| Conversations | Neuf interlocuteurs, dix-huit sujets conditionnels au Normandy, avec conseil à Garrus mémorisé | Textes français réécrits, sans doublage. Les dialogues complets, les animations et leur conformité mot à mot restent à produire ou à vérifier. |
| Assignations | ${catalog.meta.prototypeCoverage.assignmentCount} quêtes annexes : trois historiques et ${catalog.meta.prototypeCoverage.operationCount} opérations ajoutées à la Citadelle et Féros, avec ${catalog.meta.prototypeCoverage.operationStepCount} nouvelles étapes | ${catalog.meta.prototypeCoverage.assignmentLimit} Les récompenses sont des réglages de l’adaptation. Les lignes d’étapes complètent les fiches de quêtes sans représenter des quêtes supplémentaires. |
| Équipement | ${catalog.meta.prototypeCoverage.equipmentItemCount} articles jouables : 20 armes, 16 armures, 12 modules et ${catalog.meta.prototypeCoverage.toolItemCount} outils, achat/vente, comparaison et neuf emplacements par personnage | Inventaire de 150 objets et 20 exemplaires par référence. Formations explicites, restrictions de morphologie, poids, niveau et bio/tech. Modules restitués au retrait de leur pièce. Prix, points et ports fixes adaptés ; l’arme et la tenue dessinées ne changent pas. Voir [complément et sources](research/loadout-extension-sources.md). |
| Chroniques | ${catalog.meta.prototypeCoverage.chronicles.works} œuvres, ${catalog.meta.prototypeCoverage.chronicles.periodSegments} segments documentés, ${catalog.meta.prototypeCoverage.chronicles.scenarios} essais tactiques, ${catalog.meta.prototypeCoverage.chronicles.selectableCharacters} personnages sélectionnables et ${catalog.meta.prototypeCoverage.chronicles.equipmentItems} équipements | ${catalog.meta.prototypeCoverage.chronicles.limit} Voir [périmètre et utilisation](CHRONICLES.md). |
| Pouvoirs des Chroniques | ${catalog.meta.prototypeCoverage.chronicles.powerCatalogEntries} fiches reliées à ${catalog.meta.prototypeCoverage.chronicles.activePowerActions} actions, dont ${catalog.meta.prototypeCoverage.chronicles.newPowerActions} nouvelles ; ${catalog.meta.prototypeCoverage.chronicles.classPreparations} préparations de classe ou de compétences | Arbres et acquisition complets non simulés ; statistiques ATB de base conservées. Les deux familles de modules ME3 sont limitées aux fusils d’assaut conventionnels à clips. |
| Lectures documentaires | ${catalog.meta.prototypeCoverage.chronicles.documentaryReadings} parcours et ${catalog.meta.prototypeCoverage.chronicles.documentaryPages} pages sourcées | Paraphrases factuelles avec navigation et découvertes persistantes. Aucun personnage de livre rendu jouable, niveau créé, dialogue intégral ou choix canonique inventé. |
| Véhicules | Mako et Sovereign placés comme décor ; illustrations de Normandy SR-1 et d’une armature geth | Aucune conduite, aucun tir depuis un véhicule, aucun pilotage spatial. L’armature illustrée n’est pas un ennemi spécifique jouable à ce stade. |
| Animation | ${catalog.meta.prototypeCoverage.walkFrameCount} images de marche pour les deux apparences de Shepard et ${catalog.meta.prototypeCoverage.femaleCombatPoseCount} poses clés de combat féminines, au stade Prototype | ${catalog.meta.prototypeCoverage.animationLimit} Les contacts féminins 0 et 2 restent proches dans certaines orientations. |

### Images existantes

| Fichier | Contenu observable ou rôle de prototype | Statut |
| --- | --- | --- |
${atlasRows}

Les images générées sont des propositions graphiques. Leur présence sur disque ne prouve ni l’exactitude du costume, ni une animation complète, ni un dialogue achevé. Les fiches de sprites renvoient au même atlas lorsqu’une seule pose sert à plusieurs usages.

## Catégories et comptes

Les compteurs du classeur utilisent les statuts des lignes. Les onglets Dashboard et Guide complètent les 26 catégories ci-dessous.

| Catégorie | Total | Défini | Prototype | Intégré | Validé | Périmètre |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${categoryRows}
| **Total** | **${fr(catalog.entries.length)}** | **${fr(statusCounts['Défini']||0)}** | **${fr(statusCounts.Prototype||0)}** | **${fr(statusCounts['Intégré']||0)}** | **${fr(statusCounts['Validé']||0)}** | |

## Lire une fiche

Chaque fiche possède un identifiant stable, une catégorie, un épisode, un périmètre, un niveau de canon, deux statuts, une priorité, une description et un critère d’acceptation. Les dépendances utilisent les identifiants des autres fiches.

| Champ | Usage |
| --- | --- |
| \`status\` | Avancement du contenu décrit. |
| \`assetStatus\` | Avancement de son illustration, son ou fichier de production. |
| \`canonLevel\` | Niveau de confirmation de l’information ou indication d’une adaptation. |
| \`sourceId\`, \`sourceUrl\`, \`reference\` | Référence et point à contrôler. Une URL seule n’atteste pas le détail d’une fiche. |
| \`plannedPath\` | Destination envisagée, qui peut ne pas encore exister. |
| \`assetPath\` | Preuve locale réellement présente ; selon la fiche, image ou fichier source du prototype. |
| \`gameKey\` | Clé actuelle dans les données ou le renderer, lorsqu’elle existe. |
| \`acceptance\` | Condition à satisfaire avant de déclarer le travail abouti. |
| \`dependencies\` | Prérequis par identifiants. |
| \`priority\` | P0 : fonctionnement/cohérence ; P1 : complétude ME1 ; P2 : extensions. |
| \`notes\` | Limites observées, placeholders et contrôles encore nécessaires. |

## Sources et limites de fidélité

La colonne de source donne une référence de travail. Les lignes marquées **Référence à vérifier** demandent encore une comparaison avec le jeu, son codex, des captures identifiées et la version exacte choisie. Certaines pages du guide constituent seulement un point de départ pour retrouver le détail. L’index communautaire est une source secondaire, signalée comme telle.

| Identifiant | Source | Usage et périmètre |
| --- | --- | --- |
${sourceRows}

La production prend ME1 comme base. La continuité doit distinguer le Normandy SR-1 des vaisseaux ultérieurs, les armes à chauffe des systèmes de cartouches thermiques, et les talents de ME1 des pouvoirs introduits plus tard. Les guides cosplay et les visuels de la trilogie exigent un classement par épisode avant réutilisation. Les références original/Legendary Edition doivent également être identifiées avant une comparaison exacte.

Les dialogues, la topologie complète, les missions secondaires, les DLC, les choix persistants, les romances, les modèles d’armes, les movesets et les séquences cinématiques ne sont pas réputés complets par simple présence d’une fiche. La boucle ATB, le découpage condensé, les sprites et les décors interprétés sont des décisions d’adaptation.

## Mettre à jour le suivi

Modifier les fiches dans [content-catalog.json](content-catalog.json), puis lancer le générateur avec le runtime Node disposant de \`@oai/artifact-tool\` :

\`\`\`bash
node scripts/build-workbook.mjs
\`\`\`

La variable \`CODEX_PRIMARY_RUNTIME_NODE_MODULES\` doit désigner les modules du runtime d’artefacts. L’option \`--render-sheets Dashboard,PNJ,Ennemis_boss,Sprites\` limite les aperçus recalculés, tout en reconstruisant le classeur complet et cette page. Les fichiers de vérification donnent le total exporté, le contrôle des formules et la présence des filtres, validations et volets figés.

Les modifications effectuées directement dans Excel recalculent son tableau de bord, mais ne sont pas automatiquement réimportées dans le JSON. Reporter ces décisions dans le catalogue avant de régénérer le classeur.
`;
await fs.writeFile(path.join(root,'docs/CATALOGUE.md'),doc);
console.log('Catalogue Markdown regenerated.');

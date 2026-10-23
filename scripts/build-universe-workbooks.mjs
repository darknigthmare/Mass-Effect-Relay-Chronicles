import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {universeFileStem,universeJsonFilename} from './universe-paths.mjs';

// Run from an OS-temporary directory with the Codex primary runtime.
const modules=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!modules)throw new Error('CODEX_PRIMARY_RUNTIME_NODE_MODULES is required.');
const runtimeRequire=createRequire(path.join(modules,'__relay_universe__.cjs'));
const {Workbook,SpreadsheetFile}=await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')).href);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'docs/universe/catalogs');
const outputDir=path.join(root,'docs/universe/outputs/relay-chronicles-20261022');
const qaDir=path.join(root,'docs/universe/qa');
const previewDir=process.env.RELAY_PREVIEW_DIR||'/tmp/relay-universe-workbooks-20261022/previews';
const arg=(k)=>{const i=process.argv.indexOf(k);return i<0?null:process.argv[i+1];};
const wanted=arg('--ids')?.split(',');
const noRender=process.argv.includes('--no-render');
const sourceCatalog=JSON.parse(await fs.readFile(path.join(root,'docs/content-catalog.json'),'utf8'));
const categories=sourceCatalog.categories.map(c=>c.id==='trilogy'?{id:'continuity',title:'Continuité',sheetName:'Continuite',description:'États persistants, chronologie et limites de l’adaptation'}:{...c,description:c.id==='characters'?'Identités et fonctions dans l’œuvre':c.id==='enemies'?'Bestiaire, adversaires et affrontements':c.id==='side_quests'?'Contenus annexes, variantes et extensions':c.description});
const color={navy:'#102438',teal:'#087F8C',text:'#183044',faint:'#EDF5F7',amber:'#FFF0C7',light:'#F8FBFC',line:'#D5E2E8'};
const status=['Défini','Prototype','Intégré','Validé'];
const nature=['Établi','À vérifier','Extrapolation','Coupé attesté','Concept abandonné','Allégation écartée'];
const fields=[['id','Identifiant',31],['name','Élément',37],['status','Contenu',14],['nature','Nature de la référence',21],['priority','Priorité',10],['description','Fait ou hypothèse',52],['adaptation','Adaptation proposée',57],['gameplay','Règles et moveset proposés',60],['visual','Direction visuelle',56],['animation','Animation',53],['audio','Audio et accessibilité',51],['implementation','Mise en œuvre prévue',58],['conditions','Conditions et variantes',57],['acceptance','Critère d’acceptation',61],['dependencies','Dépendances',44],['reference','Repère dans l’œuvre',45],['sourceIds','Sources',24],['sourceUrls','Sources URL',75],['notes','Notes et limites',80]];
const letter=i=>{let n=i+1,s='';do{n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}while(n);return s;};
function base(s,range){s.showGridLines=false;s.getRange(range).format={font:{name:'Arial',size:10,color:color.text},rowHeight:22,verticalAlignment:'center'};}
function header(s,range){s.getRange(range).format={fill:color.navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:34,wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#FFFFFF'},bottom:{style:'thin',color:color.teal}}};}
function title(s,name,sub,last){s.getRange('A2').values=[[name]];s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:color.navy};s.getRange('A3').values=[[sub]];s.getRange('A3').format.font={name:'Arial',size:10,italic:true,color:'#4A6374'};s.getRange(`A4:${last}4`).format.borders={bottom:{style:'thin',color:color.teal}};}
function lines(value,width){
 const cap=Math.max(5,Math.floor(width*0.95));let total=0;
 for(const paragraph of String(value??'').split('\n')){let used=0,n=1;for(const word of paragraph.split(/\s+/)){const len=[...word].length;if(len>cap){n+=Math.floor(len/cap);used=len%cap;}else if(used&&used+1+len>cap){n++;used=len;}else used+=len+(used?1:0);}total+=n;}return total;
}
function validate(b){
 const ids=new Set();const cats=new Set(categories.map(c=>c.id));const sources=new Set(b.sources.map(s=>s.id));
 for(const e of b.entries){if(ids.has(e.id))throw new Error(`Duplicate ${e.id}`);ids.add(e.id);if(!cats.has(e.category)||!status.includes(e.status)||!nature.includes(e.nature))throw new Error(`Invalid classification ${e.id}`);if(!e.name||!e.description||!e.adaptation||!e.acceptance)throw new Error(`Incomplete ${e.id}`);if(['Intégré','Validé'].includes(e.status))throw new Error(`Unproven implementation ${e.id}`);for(const s of e.sourceIds||[])if(!sources.has(s))throw new Error(`Missing source ${s} in ${e.id}`);}
 for(const e of b.entries)for(const d of e.dependencies||[])if(!ids.has(d))throw new Error(`Missing dependency ${d} in ${e.id}`);
 if(!/^[\w.-]+_Production\.xlsx$/.test(b.filename))throw new Error(`Unsafe filename ${b.filename}`);
 if(new Set(b.sources.map(s=>s.id)).size!==b.sources.length)throw new Error(`Duplicate sources ${b.id}`);
}
await fs.mkdir(outputDir,{recursive:true});await fs.mkdir(qaDir,{recursive:true});await fs.mkdir(previewDir,{recursive:true});
const filenames=(await fs.readdir(dataDir)).filter(n=>n.endsWith('.json')).sort();
for(const filename of filenames){
 const b=JSON.parse(await fs.readFile(path.join(dataDir,filename),'utf8'));if(wanted&&!wanted.includes(b.id))continue;validate(b);
 console.log(`Creating ${b.id}: ${b.entries.length} records`);
 const wb=Workbook.create();const dashboard=wb.worksheets.add('Dashboard');const sheets=new Map(categories.map(c=>[c.id,wb.worksheets.add(c.sheetName)]));const guide=wb.worksheets.add('Guide');
 const stats=[];const sources=new Map(b.sources.map(s=>[s.id,s]));
 for(const c of categories){
  const s=sheets.get(c.id),records=b.entries.filter(e=>e.category===c.id),end=Math.max(7,6+records.length);stats.push({c,records,end});base(s,`A1:S${end}`);title(s,c.title,`${b.title} — ${c.description}`,'S');
  fields.forEach(([, ,w],i)=>s.getRange(`${letter(i)}1:${letter(i)}${end}`).format.columnWidth=w);
  s.getRange('A6:S6').values=[fields.map(f=>f[1])];
  const values=records.map(e=>fields.map(([key])=>key==='sourceUrls'?(e.sourceIds||[]).map(id=>sources.get(id)?.url||'').filter(Boolean).join('\n'):Array.isArray(e[key])?e[key].join(', '):e[key]??''));
  if(values.length){s.getRange(`A7:S${end}`).values=values;s.getRange(`A7:Q${end}`).format.wrapText=true;s.getRange(`A7:S${end}`).format.verticalAlignment='top';
   for(let i=0;i<values.length;i++){const n=Math.max(...values[i].slice(0,17).map((v,j)=>lines(v,fields[j][2])),String(values[i][17]).split('\n').length);s.getRange(`A${i+7}:S${i+7}`).format.rowHeight=Math.max(44,Math.min(360,n*14+12));if(i%2===0)s.getRange(`A${i+7}:S${i+7}`).format.fill=color.light;}
   s.getRange(`C7:C${end}`).format.fill=color.amber;s.getRange(`C7:E${end}`).format.horizontalAlignment='center';s.getRange(`C7:E${end}`).format.verticalAlignment='center';s.getRange(`A7:A${end}`).format.font.color='#557283';
   const t=s.tables.add(`A6:S${end}`,true,`${b.id}_${c.id}`);t.showFilterButton=true;
   s.getRange(`C7:C${end}`).dataValidation={rule:{type:'list',values:status}};s.getRange(`D7:D${end}`).dataValidation={rule:{type:'list',values:nature}};s.getRange(`E7:E${end}`).dataValidation={rule:{type:'list',values:['P0','P1','P2']}};
   s.getRange(`D7:D${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"À vérifier"',format:{fill:'#FFF2DC',font:{color:'#79520A'}}});
   s.getRange(`D7:D${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"Extrapolation"',format:{font:{color:'#436875'}}});
   s.getRange(`C7:C${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"Validé"',format:{fill:'#DDF1E8',font:{color:'#176A4D',bold:true}}});
   s.getRange(`E7:E${end}`).conditionalFormats.add('cellIs',{operator:'equal',formula:'"P0"',format:{font:{bold:true,color:color.teal}}});
   // These are per-record data, so they belong to the table and move with sorting.
   // General methodology remains in Guide, outside the record tables.
   s.getRange(`R7:S${end}`).format.wrapText=false;
   const maxNote=Math.max(80,...values.map(r=>String(r[18]).length));s.getRange(`S1:S${end}`).format.columnWidth=Math.min(255,Math.ceil(maxNote*0.91));
   const maxUrl=Math.max(75,...values.flatMap(r=>String(r[17]).split('\n').map(x=>x.length)));s.getRange(`R1:R${end}`).format.columnWidth=Math.min(255,Math.ceil(maxUrl*0.91));
  }else{s.getRange('B7').values=[['Aucun élément inventorié. Voir les limites dans Guide.']];s.getRange('B7:G7').format.wrapText=false;}
  header(s,'A6:S6');s.freezePanes.freezeRows(6);s.freezePanes.freezeColumns(2);
 }
 base(dashboard,'A1:M42');dashboard.tabColor=color.navy;title(dashboard,b.title,'Catalogue de production. Statuts et références calculés depuis les fiches.','M');
 [28,12,13,13,13,13,14,15,16,17,17,17,14].forEach((w,i)=>dashboard.getRange(`${letter(i)}1:${letter(i)}42`).format.columnWidth=w);
 dashboard.getRange('A5').values=[['Fiches suivies']];dashboard.getRange('B5').formulas=[['=SUM(B10:B35)']];dashboard.getRange('D5').values=[['Intégrés']];dashboard.getRange('E5').formulas=[['=SUM(E10:F35)']];dashboard.getRange('G5').values=[['À vérifier']];dashboard.getRange('H5').formulas=[['=SUM(H10:H35)']];dashboard.getRange('J5').values=[['Extrapolations']];dashboard.getRange('K5').formulas=[['=SUM(I10:I35)']];for(const x of ['B5','E5','H5','K5'])dashboard.getRange(x).format.font={name:'Arial',size:14,bold:true,color:color.teal};
 dashboard.getRange('A7').values=[['Défini = spécification. Établi = référence documentée. Les colonnes d’adaptation restent des propositions.']];dashboard.getRange('A7').format.font.italic=true;
 dashboard.getRange('A9:M9').values=[['Domaine','Total','Défini','Prototype','Intégré','Validé','Établi','À vérifier','Extrapolation','Coupé attesté','Concept abandonné','Allégation écartée','Priorité P0']];header(dashboard,'A9:M9');
 for(let i=0;i<stats.length;i++){const {c,records,end}=stats[i],r=10+i,ref=col=>`'${c.sheetName}'!$${col}$7:$${col}$${end}`;dashboard.getRange(`A${r}`).values=[[c.title]];dashboard.getRange(`B${r}:M${r}`).formulas=[[`=COUNTA(${ref('A')})`,...status.map(s=>`=COUNTIFS(${ref('C')},"${s}")`),...nature.map(s=>`=COUNTIFS(${ref('D')},"${s}")`),`=COUNTIFS(${ref('E')},"P0")`]];if(i%2===0)dashboard.getRange(`A${r}:M${r}`).format.fill=color.faint;}
 dashboard.getRange('A37').values=[['TOTAL']];dashboard.getRange('B37:M37').formulas=[[...Array.from({length:12},(_,i)=>`=SUM(${letter(i+1)}10:${letter(i+1)}35)`)]];dashboard.getRange('A37:M37').format={fill:color.navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:28};dashboard.getRange('B10:M37').setNumberFormat('#,##0');dashboard.getRange('B10:M37').format.horizontalAlignment='right';
 dashboard.getRange('A39').values=[['Les compteurs mesurent les fiches présentes, pas un pourcentage d’exhaustivité ou de réalisation.']];dashboard.getRange('A41').values=[['Périmètre, sources, incertitudes et méthode de suivi : voir Guide.']];
 base(guide,`A1:F${100+b.sources.length+b.coverage.length}`);guide.tabColor='#78929B';title(guide,'Guide du catalogue',b.title,'F');[27,67,47,90,48,65].forEach((w,i)=>guide.getRange(`${letter(i)}1:${letter(i)}${100+b.sources.length+b.coverage.length}`).format.columnWidth=w);
 const blocks=[['Œuvre',b.title],['Support',b.medium],['Périmètre',b.scope],['Projet',b.summary],['Références et limites',b.canonNote],['Date de référence',new Date('2026-10-22T12:00:00Z')],['Statut Défini','Fiche de conception à réaliser. Aucun asset ou code supplémentaire n’est prouvé par cette valeur.'],['Établi','Fait de référence documenté. Les colonnes adaptation, règles, visuel et animation décrivent la production envisagée.'],['À vérifier','Information partielle, indexée ou nécessitant un contrôle dans l’œuvre originale.'],['Extrapolation','Création ou interprétation pour le fan game. Ne décrit pas un contenu officiel.'],['Coupé attesté','Contenu retiré appuyé par une source identifiée. Son état exact peut rester à relever.'],['Concept abandonné','Piste ou prototype documenté, sans scénario final officiel présumé.'],['Allégation écartée','Hypothèse exclue de la continuité de production. Motif donné dans la fiche.'],['Priorités','P0 : dépendance structurante. P1 : production du module. P2 : enrichissement ultérieur.'],['Édition','Les statuts se modifient dans les cellules ambre. Les compteurs se recalculent. Les modifications Excel ne sont pas réimportées automatiquement.'],['Régénération','Conserver les décisions approuvées dans le catalogue JSON du dépôt avant de régénérer ce classeur.']];
 guide.getRange('A6:B6').values=[['Champ','Définition']];header(guide,'A6:B6');guide.getRange(`A7:B${6+blocks.length}`).values=blocks;guide.getRange('B12').setNumberFormat('dd/mm/yyyy');guide.getRange(`A7:B${6+blocks.length}`).format.wrapText=true;guide.getRange(`A7:B${6+blocks.length}`).format.verticalAlignment='top';blocks.forEach((r,i)=>guide.getRange(`A${i+7}:B${i+7}`).format.rowHeight=Math.max(30,lines(r[1],67)*14+12));
 let r=26;guide.getRange(`A${r}:F${r}`).values=[['Source','Titre','Type','URL','Périmètre','Accès et limites']];header(guide,`A${r}:F${r}`);r++;
 if(b.sources.length){guide.getRange(`A${r}:F${r+b.sources.length-1}`).values=b.sources.map(s=>[s.id,s.title,s.kind,s.url,s.scope,s.note]);guide.getRange(`A${r}:F${r+b.sources.length-1}`).format.wrapText=true;b.sources.forEach((s,i)=>guide.getRange(`A${r+i}:F${r+i}`).format.rowHeight=Math.max(42,Math.max(lines(s.title,67),lines(s.scope,48),lines(s.note,65),lines(s.url,90))*14+12));r+=b.sources.length+3;}
 const coverageStart=r;guide.getRange(`A${r}:C${r}`).values=[['Domaine','Couverture actuelle','Travail restant']];header(guide,`A${r}:C${r}`);r++;guide.getRange(`A${r}:C${r+b.coverage.length-1}`).values=b.coverage.map(v=>[v.area,v.covered,v.remaining]);guide.getRange(`A${r}:C${r+b.coverage.length-1}`).format.wrapText=true;b.coverage.forEach((v,i)=>guide.getRange(`A${r+i}:C${r+i}`).format.rowHeight=Math.max(42,Math.max(lines(v.covered,67),lines(v.remaining,47))*14+12));guide.freezePanes.freezeRows(6);
 // Exercise the same dependency chain used after a user changes a status.
 const sample=stats.find(s=>s.records.length),sampleSheet=sheets.get(sample.c.id),sampleRow=10+stats.indexOf(sample);const before=Number(dashboard.getRange(`F${sampleRow}`).values[0][0]),prior=sampleSheet.getRange('C7').values[0][0];sampleSheet.getRange('C7').values=[['Validé']];const after=Number(dashboard.getRange(`F${sampleRow}`).values[0][0]);if(after!==before+1)throw new Error(`Recalculation failed ${b.id}`);sampleSheet.getRange('C7').values=[[prior]];wb.recalculate();
 const total=Number(dashboard.getRange('B37').values[0][0]);if(total!==b.entries.length)throw new Error(`Total mismatch ${b.id}: ${total}`);
 const scan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},maxChars:2000});
 const inspected=await wb.inspect({kind:'table',range:'Dashboard!A37:M37',include:'values,formulas',tableMaxRows:1,tableMaxCols:13,maxChars:2500});
 const report={id:b.id,title:b.title,records:total,sheets:28,sourceCount:b.sources.length,formulaScan:scan.ndjson,statusMutation:{before,after,restored:prior},dashboard:inspected.ndjson,counts:Object.fromEntries(categories.map(c=>[c.id,b.entries.filter(e=>e.category===c.id).length])),rendered:[]};
 const file=await SpreadsheetFile.exportXlsx(wb);await file.save(path.join(outputDir,b.filename));await fs.rm(path.join(outputDir,b.filename+'.inspect.ndjson'),{force:true});
 if(!noRender){const dest=path.join(previewDir,universeFileStem(b.id));await fs.mkdir(dest,{recursive:true});
  for(const name of ['Dashboard',...categories.map(c=>c.sheetName),'Guide']){const range=name==='Dashboard'?'A1:M38':name==='Guide'?'A1:B13':'A1:H7';const img=await wb.render({sheetName:name,range,scale:1.15,format:'png'});await fs.writeFile(path.join(dest,name+'.png'),new Uint8Array(await img.arrayBuffer()));report.rendered.push(name);}
  const chosen=stats.find(s=>s.c.id==='main_quests'&&s.records.length)||sample;const detail=await wb.render({sheetName:chosen.c.sheetName,range:'I6:Q8',scale:1.15,format:'png'});await fs.writeFile(path.join(dest,'Detail.png'),new Uint8Array(await detail.arrayBuffer()));
  const coverage=await wb.render({sheetName:'Guide',range:`A${coverageStart}:C${Math.min(coverageStart+3,r+b.coverage.length-1)}`,scale:1.15,format:'png'});await fs.writeFile(path.join(dest,'Couverture.png'),new Uint8Array(await coverage.arrayBuffer()));
  const refs=await wb.render({sheetName:sample.c.sheetName,range:'Q6:S8',scale:1.15,format:'png'});await fs.writeFile(path.join(dest,'Sources_notes.png'),new Uint8Array(await refs.arrayBuffer()));
 }
 await fs.writeFile(path.join(qaDir,universeJsonFilename(b.id)),JSON.stringify(report,null,2)+'\n');console.log(`Exported ${b.id}: ${total} records, ${report.rendered.length} sheet previews`);
}

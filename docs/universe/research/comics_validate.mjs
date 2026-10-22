import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {categories} from './comics_catalog_common.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const works=['RED','EVO','INV','HOM','FOU','INC','INQ','CON','BLA','HWB','LIB','DIS'];
const titles=['Redemption','Evolution','Invasion','Homeworlds','Foundation','Incursion','Inquisition','Conviction','Blasto:_Eternity_is_Forever','He_Who_Laughs_Best','Library Edition','Discovery'];
const required=['id','category','name','status','nature','priority','description','adaptation','gameplay','visual','animation','audio','implementation','conditions','acceptance','dependencies','sourceIds','reference','notes'];
const report=[];
const urls=new Set();
let errors=[];
for(const id of works){
 const data=JSON.parse(fs.readFileSync(path.join(here,'..','catalogs',`${id}.json`),'utf8'));
 const entryIds=new Set(data.entries.map(e=>e.id));
 const sourceIds=new Set(data.sources.map(s=>s.id));
 const descriptions=new Set(), natureCounts={}, categoryCounts=Object.fromEntries(categories.map(c=>[c,0]));
 const factualAnchorWords={};
 for(const s of data.sources){new URL(s.url);urls.add(s.url);}
 for(const e of data.entries){
  for(const key of required)if(!(key in e))errors.push(`${e.id}: missing ${key}`);
  if(!categories.includes(e.category))errors.push(`${e.id}: unknown category`);else categoryCounts[e.category]++;
  if(!e.name||!e.description||!e.acceptance||!e.implementation||!e.conditions)errors.push(`${e.id}: empty key field`);
  if(e.status!=='Défini')errors.push(`${e.id}: unsupported implementation status`);
  if(!['Établi','À vérifier','Extrapolation','Coupé attesté','Concept abandonné','Allégation écartée'].includes(e.nature))errors.push(`${e.id}: unknown nature`);
  natureCounts[e.nature]=(natureCounts[e.nature]||0)+1;
  if(descriptions.has(e.description))errors.push(`${e.id}: duplicate description`);descriptions.add(e.description);
  for(const dep of e.dependencies)if(!entryIds.has(dep))errors.push(`${e.id}: missing local dependency ${dep}`);
  for(const s of e.sourceIds){if(!sourceIds.has(s))errors.push(`${e.id}: missing source ${s}`);factualAnchorWords[s]=(factualAnchorWords[s]||0)+(e.name+' '+e.description).split(/\s+/u).length;}
 }
 if(entryIds.size!==data.entries.length)errors.push(`${id}: duplicate ids`);
 if(data.coverage.length!==26)errors.push(`${id}: incomplete coverage`);
 report.push({id,entries:data.entries.length,sourceRecords:data.sources.length,natureCounts,categoryCounts,factualAnchorWords,bytes:fs.statSync(path.join(here,'..','catalogs',`${id}.json`)).size});
}
const result={
 date:'2026-10-22',scope:'12 comics/collections; JSON de production uniquement; aucun changement au jeu, aucun XLSX produit par cet auteur.',
 verification:{schema:true,uniqueIds:true,localDependencies:true,sourceIds:true,uniqueDescriptionsWithinEachWork:true,coverageAreasPerWork:26,implementationTests:'Aucun : les critères sont des recettes futures, aucun asset ni gameplay n’a été réalisé.',errors},
 totals:{works:report.length,entries:report.reduce((a,r)=>a+r.entries,0),sourceRecords:report.reduce((a,r)=>a+r.sourceRecords,0),uniqueSourceUrls:urls.size},
 works:report,
 requestedFandomAccess:works.map((id,i)=>({id,url:id==='LIB'?'https://masseffect.fandom.com/wiki/Mass_Effect_Library_Edition':`https://masseffect.fandom.com/wiki/Mass_Effect:_${titles[i]}`,result:'Ouverture directe tentée et échouée.',reason:id==='FOU'?'Erreur de récupération sans contenu.':'URL restreinte signalée par le service de navigation.',fallback:'Notices officielles consultées lorsque disponibles; extraits Fandom indexés séparés et marqués À vérifier.'})),
 otherFailedAccess:[
 {url:'https://www.darkhorse.com/Comics/17-568/Mass-Effect-Invasion-1-Massimo-Carnevale-cover',reason:'URL restreinte à l’ouverture.'},
 {url:'https://www.darkhorse.com/Books/20-489/Mass-Effect-Foundation-Volume-1-TPB',reason:'URL restreinte à l’ouverture.'},
 {url:'https://www.darkhorse.com/Comics/21-313/Mass-Effect-Homeworlds-4-Mike-Hawthorne-variant-cover',reason:'Erreur de décodage à l’ouverture; notice officielle lisible dans l’index, signalée dans la source.'},
 {url:'https://www.darkhorse.com/',reason:'Le moteur a signalé robots.txt lors des recherches de notices; utilisation de Penguin Random House, du site de l’auteur et de Dark Horse Digital.'},
 {url:'https://farawaypress.com/comics/masseffectinvasion/masseffectinvasion2/',reason:'URL non accessible par le service; non employée comme source.'},
 {url:'https://farawaypress.com/comics/masseffectinvasion/masseffectinvasion3/',reason:'URL non accessible par le service; non employée comme source.'}
 ],
 primaryFallbacks:[
 'Notices Dark Horse Books distribuées par Penguin Random House pour les recueils, Omnibus et Discovery.',
 'Notes de John Jackson Miller sur Redemption #1–4, Evolution #1–4 et Invasion #1/#4.',
 'Dark Horse Digital : The Complete Comics.',
 'Notice fournie par Dark Horse sur Apple Books pour Incursion/Inquisition et Foundation #5.',
 'Notice éditeur de Blasto dans Google Books.',
 'Catalogue Random House printemps 2015, page PDF 103 (index 102), pour Library Edition 2.'
 ],
 limitations:[
 'Les extraits de wiki consultés par index ne remplacent pas la vérification des planches et de leur pagination dans une édition autorisée.',
 'Les couleurs, costumes, armes précises, géométries, animations, sons, interfaces et statistiques de prototype sont des directions de production, non des observations visuelles certifiées.',
 'Les correspondances de sommaire Library Edition, les bonus et différences de format nécessitent une comparaison d’exemplaires; les pages inconnues ne sont pas inventées.',
 'Les numéros Foundation #7/#10/#11 sont pointés par des sollicitations secondaires et les thèmes corroborés par les volumes officiels; le contenu détaillé reste À vérifier.',
 'Les notes du scénariste écrivent Alignon alors que le wiki emploie Alingon; la variante est signalée explicitement dans RED.',
 'Blasto est une fiction diégétique; le dispositif temporel et les règles du film ne sont pas exportés vers le canon physique général.',
 'Les essais de gameplay n’ajoutent pas une autre issue canon; les choix locaux convergent vers les raccords source.',
 'Le comptage des mots des ancrages est indicatif et ne remplace pas une revue éditoriale; les créations originales constituent la majorité des fiches.'
 ]
};
fs.writeFileSync(path.join(here,'comics_research_audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({totals:result.totals,errors},null,2));
if(errors.length)process.exitCode=1;

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,categories} from './comics_catalog_common.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const modules=['comics_catalog_arcs.mjs','comics_catalog_homeworlds.mjs','comics_catalog_foundation.mjs','comics_catalog_shorts.mjs','comics_catalog_discovery.mjs','comics_catalog_library.mjs'];
const wanted=new Set(process.argv.slice(2));
let total=0;
for(const filename of modules) {
 if(!fs.existsSync(path.join(here,filename))) continue;
 const contents=await import(`./${filename}`);
 for(const c of Object.values(contents)) {
  if(!c?.id || (wanted.size && !wanted.has(c.id))) continue;
  const result=build(c),ids=new Set(result.entries.map(x=>x.id)),sids=new Set(result.sources.map(x=>x.id));
  if(ids.size!==result.entries.length) throw new Error(`${c.id}: identifiants dupliqués`);
  const required=['id','category','name','status','nature','priority','description','adaptation','gameplay','visual','animation','audio','implementation','conditions','acceptance','dependencies','sourceIds','reference','notes'];
  for(const r of result.entries) {
   for(const field of required) if(!(field in r)) throw new Error(`${r.id}: champ absent ${field}`);
   if(!categories.includes(r.category)) throw new Error(`${r.id}: catégorie inconnue`);
   if(!r.acceptance) throw new Error(`${r.id}: recette vide`);
   for(const dep of r.dependencies) if(!ids.has(dep)) throw new Error(`${r.id}: dépendance absente ${dep}`);
   for(const s of r.sourceIds) if(!sids.has(s)) throw new Error(`${r.id}: source absente ${s}`);
   if(r.status!=='Défini') throw new Error(`${r.id}: statut de réalisation interdit`);
  }
  fs.writeFileSync(path.join(here,'..','catalogs',`${c.id}.json`),JSON.stringify(result,null,2)+'\n');
  total+=result.entries.length;
  console.log(`${c.id}: ${result.entries.length} fiches; ${result.sources.length} sources; ${new Set(result.entries.map(x=>x.category)).size}/26 catégories avec fiches; 26 domaines couverts.`);
 }
}
console.log(`Total écrit : ${total} fiches.`);

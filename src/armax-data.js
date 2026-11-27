// Original-compatible Nacre duel profiles. Tuning numbers, not canonical RPG statistics.
const BOUNDS = {
  nacre_mara_vey:[173,20,848,1506],nacre_tavin_rhex:[121,10,777,1499],
  nacre_ilyra_senn:[124,4,896,1501],nacre_keela_vess:[60,8,951,1484],
  nacre_ghoran_brakk:[29,65,997,1453],nacre_neral_vesh:[69,19,919,1512],
};
const profile=(id,name,species,role,life,shield,speed,height,specialName,specialKind,color)=>Object.freeze({
  id,name,species,role,life,shield,speed:speed/100,height:height/60,specialName,specialKind,color,
  sprite:`assets/armax/lot22/originals/fighters/${id}.png`,visualBounds:BOUNDS[id]||null,
  status:'Prototype',fullKitImplemented:false,animationStatus:'pose_fixe',
});
export const ARMAX_FIGHTERS=Object.freeze([
  profile('nacre_mara_vey','Mara Vey','Humaine','Escorte polyvalente',1000,220,250,145,'Tir concussif','projectile','#e1ad66'),
  profile('nacre_tavin_rhex','Tavin Rhex','Turien','Contrôle à mi-distance',1000,280,230,160,'Tir de contention','projectile','#8cb9d0'),
  profile('nacre_ilyra_senn','Ilyra Senn','Asari','Contrôle biotique',900,250,250,145,'Projection','projectile','#779aff'),
  profile('nacre_keela_vess','Keela’Vess nar Tasera','Quarienne','Ingénieure d’interception',900,280,245,147,'Relais d’interception','trap','#e5b760'),
  profile('nacre_ghoran_brakk','Ghoran Brakk','Krogan','Lutteur lourd',1300,100,190,154,'Percée de quai','charge','#b4bc82'),
  profile('nacre_neral_vesh','Neral Vesh','Drell','Infiltration',850,160,305,147,'Percée à couvert','charge','#74bca6'),
  profile('nacre_selek_dhan','Selek Dhan','Galarien','Pièges et sabotage',850,220,280,160,'Microcharge de sabotage','trap','#eeae58'),
  profile('nacre_varek_hesk','Varek Hesk','Batarien','Briseur de proximité',1100,180,235,149,'Coup d’arrêt','melee','#dc846e'),
  profile('nacre_dalo_ruun','Dalo Ruun','Volus','Renfort de protection',800,380,180,93,'Réserve de bouclier','shield','#6bc5d4'),
  profile('nacre_nyra_korr','Nyra Korr','Turienne','Éclaireuse de précision',900,220,290,156,'Tir repéré','projectile','#9dbdce'),
]);
export const ARMAX_STAGES=Object.freeze([
  {id:'nacre_stage_01',name:'Nacre · quai des arrivées',image:'assets/armax/lot22/originals/stages/nacre_stage_01.png'},
  {id:'nacre_stage_02',name:'Nacre · galerie de transit',image:'assets/armax/lot22/originals/stages/nacre_stage_02.png'},
]);
export const ARMAX_COMMANDS=Object.freeze({KeyJ:'L',KeyK:'M',KeyL:'H',KeyU:'S',KeyI:'super',KeyO:'throw'});

// Authored ME1 staging. Named locations and the retained mission order are
// source-based; contours, distances and seamless connections are adaptations.
const room=(id,label,kind,x,z,polygon)=>({id,label,kind,center:{x,z},polygon});
const route=(id,kind,width,points)=>({id,kind,width,points});
function layout(id,rooms,paths,pois,extra={}) {
  const arenas=Object.fromEntries(['encounter-1','encounter-2','boss'].map(key=>[`${id}:${key}`,{...pois[key]}]));
  const operationPoints=Object.entries(extra.operationAnchors||{}).flatMap(([operation,steps])=>Object.entries(steps).map(([step,p])=>({id:`operation:${operation}:${step}`,...p,radius:3.5,kind:'approach'})));
  const reservations=[...Object.entries(pois).map(([key,p])=>({id:`approach:${key}`,...p,radius:3.8,kind:'approach'})),
    ...Object.entries({...arenas,...extra.sideArenas}).map(([key,p])=>({id:`arena:${key}`,...p,halfWidth:11,halfDepth:8,kind:'arena'})),
    ...Object.values(extra.npcAnchors||{}).flatMap(group=>Object.entries(group).map(([key,p])=>({id:`npc:${key}`,...p,radius:4.3,kind:'approach'}))),...operationPoints];
  return {id,version:1,partial:true,renderer:'horizon',bounds:{minX:-66,maxX:66,minZ:-105,maxZ:85},spawn:{...rooms[0].center},
    arena:{...pois['encounter-1']},arenas,pois,rooms,paths,sectors:rooms,corridors:paths,
    camera:{follow:1,span:29,limits:{minX:-57,maxX:57,minZ:-98,maxZ:78}},
    contours:{areas:rooms.map(({id,polygon})=>({id,polygon})),paths:paths.map(({id,width,points})=>({id,width,points}))},
    landmarks:rooms.map(r=>({id:r.id,label:r.label,kind:r.kind,...r.center})),...extra,reservations,
    reference:{mediaId:'ME1',periodId:'me1',sourceId:'PRIMA-ME1',url:'https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf',
      limitation:'Named places arranged around the retained mission and operation interactions. Distances, building footprints and continuous routes are original staging, not a measured reconstruction. Elevators, original level transitions and full cutscenes remain open.'}};
}
const ferosOperations={
  'feros-water':{request:{x:-28.7,z:49},'valve-south':{x:-7,z:39},'valve-central':{x:12,z:13},'valve-north':{x:34,z:37},report:{x:-28.7,z:49}},
  'feros-power':{request:{x:-38,z:65},wreck:{x:29,z:46},report:{x:-38,z:65}},
  'feros-geth-tunnels':{request:{x:-27.7,z:61},patrol:{x:-5,z:23},guards:{x:30,z:23},transmitter:{x:-4,z:12},report:{x:-27.7,z:61}},
  'feros-data-recovery':{request:{x:0,z:-16},guards:{x:0,z:-44},terminal:{x:30,z:-51},report:{x:0,z:-16}},
  'feros-varrens':{request:{x:-10.7,z:49},pack:{x:12,z:25},report:{x:-10.7,z:49}},
};
export const HORIZON_LAYOUTS={
  feros:layout('feros',[
    room('colony','Espérance de Zhu','colony',-23,66,[[-48,82],[-9,83],[3,66],[-7,48],[-39,47],[-56,65]]),
    room('tunnels','Tunnels de la colonie','tunnels',12,28,[[-14,47],[39,48],[50,30],[40,8],[-10,8],[-24,28]]),
    room('skyway','Voie aérienne prothéenne','skyway',-20,-10,[[-43,8],[-2,11],[9,-9],[-2,-28],[-38,-30],[-54,-10]]),
    room('exogeni','Complexe ExoGeni','industrial',16,-47,[[-7,-30],[34,-29],[49,-47],[34,-64],[-5,-65],[-20,-48]]),
    room('thorian','Repaire du Thorien','roots',0,-85,[[-24,-67],[22,-67],[36,-84],[21,-102],[-23,-101],[-37,-84]]),
  ],[
    route('colony-exogeni','main',11,[[-23,66],[-10,52],[7,44],[12,28],[0,10],[-20,-10],[-7,-28],[16,-47],[9,-66],[0,-85]]),
    route('maintenance-loop','branch',9,[[-23,66],[-47,45],[-49,24],[-40,6],[-20,-10]]),
    route('ancient-return','return',8,[[0,-85],[-27,-72],[-45,-49],[-48,-23],[-40,6]]),
  ],{arrival:{x:-23,z:63},cache:{x:30,z:-55},'encounter-1':{x:-20,z:-10},'encounter-2':{x:16,z:-47},boss:{x:0,z:-82},objective:{x:0,z:-92},exit:{x:-29,z:74}},
  {lighting:{background:0x44544f,fog:.0045},surfaceColor:0x82918a,routeColor:0xa1aaa0,ridgeColor:0x425c52,
    npcAnchors:{colony:{'fai-dan':{x:-30,z:64},arcelia:{x:-15,z:65},macha:{x:-31,z:52},davin:{x:-13,z:52}}},operationAnchors:ferosOperations,
    sideArenas:{'feros-varrens-pack':{x:12,z:25},'tunnel-geth':{x:-5,z:23},'tunnel-krogans':{x:30,z:23},'data-krogans':{x:0,z:-44}},
    faunaAnchors:{varren:{x:12,z:25}},storyRegions:['colony','tunnels','skyway','exogeni','thorian']}),
  ilos:layout('ilos',[
    room('landing','Site de débarquement','jungle',-24,66,[[-48,82],[-10,83],[2,65],[-10,47],[-38,46],[-55,63]]),
    room('gardens','Jardins des anciens','gardens',14,28,[[-7,45],[34,46],[48,29],[35,10],[0,10],[-14,28]]),
    room('archives','Galeries des archives','ruins',-16,-10,[[-40,8],[1,9],[14,-9],[1,-28],[-35,-29],[-50,-10]]),
    room('cryogenic','Archives et cryostase','cryogenic',18,-48,[[-4,-30],[37,-30],[51,-48],[36,-65],[0,-65],[-17,-48]]),
    room('conduit','Vigil et le Conduit','conduit',-4,-86,[[-28,-68],[15,-68],[30,-85],[15,-102],[-27,-102],[-41,-85]]),
  ],[
    route('vigil-route','main',11,[[-24,66],[-11,48],[14,28],[4,10],[-16,-10],[-1,-30],[18,-48],[8,-67],[-4,-86],[-4,-95]]),
    route('western-gardens','branch',9,[[-24,66],[-43,47],[-46,24],[-32,3],[-16,-10]]),
    route('archive-return','return',8,[[-4,-86],[-31,-70],[-45,-43],[-41,-19],[-32,3]]),
  ],{arrival:{x:-24,z:63},cache:{x:-46,z:24},'encounter-1':{x:14,z:28},'encounter-2':{x:-16,z:-10},boss:{x:18,z:-48},objective:{x:-4,z:-82},exit:{x:-4,z:-96}},
  {lighting:{background:0x334d44,fog:.0055},surfaceColor:0x748777,routeColor:0x8d9c87,ridgeColor:0x354f40,
    staticMako:{x:-32,z:70},vigil:{x:-5,z:-84},conduit:{x:-4,z:-101},storyRegions:['landing','gardens','archives','cryogenic','conduit']}),
};

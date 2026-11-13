// Authored expansions of the retained condensed ME1 campaign. Named places
// follow ME1; contours, distances and the seamless connections are adaptations.
const sector = (id, label, kind, x, z, polygon) => ({ id, label, kind, center: { x, z }, polygon });
const path = (id, kind, width, points) => ({ id, kind, width, points });
function layout(id, rooms, paths, pois, extra = {}) {
  const arenas = Object.fromEntries(['encounter-1', 'encounter-2', 'boss'].map(key => [`${id}:${key}`, { ...pois[key] }]));
  const reservations = [...Object.entries(pois).map(([key,p]) => ({id:`approach:${key}`,...p,radius:3.5,kind:'approach'})),
    ...Object.entries(arenas).map(([key,p])=>({id:`arena:${key}`,...p,halfWidth:9,halfDepth:8,kind:'arena'})),
    ...(extra.vehicleSpawn ? [{id:'mako-parking',...extra.vehicleSpawn,radius:5,kind:'approach'}] : []),
    ...Object.values(extra.npcAnchors || {}).flatMap(group=>Object.entries(group).map(([key,p])=>({id:`npc:${key}`,...p,radius:4.5,kind:'approach'}))),
    ...(extra.campNPC ? [{id:'kirrahe-camp',...extra.campNPC,radius:6,kind:'approach'}] : [])];
  return { id, version: 1, partial: true, renderer: 'frontier',
    bounds: { minX: -60, maxX: 62, minZ: -98, maxZ: 78 }, spawn: { ...rooms[0].center },
    arena: { ...pois['encounter-1'] }, arenas, pois, rooms, paths, sectors: rooms, corridors: paths,
    camera: { follow: 1, span: 29, limits: { minX: -53, maxX: 55, minZ: -92, maxZ: 71 } },
    contours: { areas: rooms.map(({ id, polygon }) => ({ id, polygon })), paths: paths.map(({ id, points, width }) => ({ id, points, width })) },
    landmarks: rooms.map(room => ({ id: room.id, label: room.label, kind: room.kind, ...room.center })),
    reference: { mediaId: 'ME1', periodId: 'me1', sourceId: 'PRIMA-ME1',
      url: 'https://na.llnet.bioware.cdn.ea.com/u/f/eagames/bioware/masseffect/prima/prima_guide_me_pc.pdf',
      limitation: 'Named ME1 places arranged for the existing seven interactions and ATB encounters. Not surveyed original geography; elevators, indoor transitions and the full original mission sequence are not reproduced.' }, ...extra, reservations };
}
export const FRONTIER_LAYOUTS = {
  therum: layout('therum', [
    sector('landing', 'Plateau de débarquement', 'basalt', -25, 61, [[-46,74],[-9,75],[0,60],[-8,46],[-33,43],[-51,56]]),
    sector('refinery', 'Raffinerie et route minière', 'industrial', -17, 23, [[-39,39],[-7,41],[5,27],[-2,10],[-31,7],[-45,22]]),
    sector('lava', 'Défilé volcanique', 'basalt', 20, -8, [[1,9],[35,10],[46,-5],[37,-24],[10,-25],[-4,-9]]),
    sector('ruins', 'Ruines prothéennes', 'ruins', 24, -43, [[6,-26],[40,-26],[49,-42],[36,-59],[9,-59],[-3,-43]]),
    sector('dig', 'Site de fouille de Liara', 'ruins', 1, -80, [[-19,-65],[19,-62],[32,-77],[18,-94],[-15,-93],[-29,-79]]),
  ], [
    path('mining-road', 'main', 12, [[-25,61],[-28,45],[-27,35],[-17,23],[-5,15],[7,4],[20,-8],[29,-22],[24,-43],[13,-61],[1,-80]]),
    path('survey-loop', 'branch', 10, [[-28,45],[-44,39],[-47,27],[-40,12],[-24,14],[-17,23]]),
    path('basalt-return', 'return', 10, [[1,-80],[-20,-69],[-35,-48],[-42,-24],[-40,12]]),
  ], { arrival:{x:-25,z:58},cache:{x:-47,z:27},'encounter-1':{x:-17,z:23},'encounter-2':{x:24,z:-43},boss:{x:1,z:-77},objective:{x:1,z:-85},exit:{x:-31,z:65} },
  { vehicleSpawn:{x:-18,z:65}, lighting:{background:0x4d3631,fog:.0045}, surfaceColor:0x847768, routeColor:0x988a74, ridgeColor:0x564c47 }),
  noveria: layout('noveria', [
    sector('port', 'Port Hanshan', 'industrial', 0, 62, [[-24,76],[24,76],[31,61],[19,45],[-17,44],[-30,59]]),
    sector('garage', 'Garage de Port Hanshan', 'industrial', -24, 27, [[-45,42],[-10,43],[3,28],[-7,11],[-37,11],[-50,25]]),
    sector('blizzard', 'Route enneigée vers le Pic 15', 'snow', 6, -8, [[-14,7],[24,9],[35,-7],[23,-25],[-9,-25],[-23,-10]]),
    sector('labs', 'Pic 15 · Laboratoires', 'industrial', 23, -43, [[3,-27],[40,-27],[50,-42],[38,-60],[9,-60],[-5,-44]]),
    sector('chamber', 'Laboratoire de confinement', 'industrial', -2, -80, [[-24,-65],[15,-64],[27,-79],[14,-94],[-20,-94],[-34,-79]]),
  ], [
    path('peak15-road', 'main', 11, [[0,62],[-12,47],[-24,27],[-18,10],[-3,-1],[6,-8],[20,-22],[23,-43],[11,-63],[-2,-80]]),
    path('freight-loop', 'branch', 9, [[0,62],[22,48],[32,33],[26,15],[13,4],[6,-8]]),
    path('maintenance-return', 'return', 8, [[-2,-80],[-26,-64],[-41,-42],[-43,-15],[-37,10],[-24,27]]),
  ], {arrival:{x:0,z:59},cache:{x:32,z:33},'encounter-1':{x:-24,z:27},'encounter-2':{x:23,z:-43},boss:{x:-2,z:-77},objective:{x:-2,z:-85},exit:{x:7,z:68}},
  { lighting:{background:0x677e90,fog:.006}, surfaceColor:0xc8d8dd, routeColor:0x8699a3, ridgeColor:0x98aebc,
    npcAnchors:{port:{parasini:{x:-12,z:62},anoleis:{x:13,z:59},lorik:{x:-10,z:51}},garage:{lilihierax:{x:-35,z:32}}} }),
  virmire: layout('virmire', [
    sector('coast', 'Côte et zone de débarquement', 'sand', -27, 61, [[-49,74],[-11,76],[0,62],[-8,46],[-35,44],[-54,59]]),
    sector('camp', 'Camp du GSI', 'sand', 18, 28, [[-2,44],[36,44],[47,29],[35,12],[4,12],[-9,28]]),
    sector('perimeter', 'Périmètre défensif', 'grass', 2, -8, [[-20,8],[18,10],[30,-6],[18,-24],[-14,-25],[-27,-8]]),
    sector('facility', 'Installation de reproduction', 'industrial', 26, -43, [[6,-27],[43,-27],[52,-42],[40,-59],[10,-60],[-3,-44]]),
    sector('extraction', 'Tour de défense et extraction', 'industrial', -7, -80, [[-30,-65],[12,-64],[26,-79],[10,-94],[-25,-94],[-40,-79]]),
  ], [
    path('coastal-approach', 'main', 11, [[-27,61],[-12,48],[4,40],[18,28],[17,12],[7,1],[2,-8],[16,-25],[26,-43],[14,-63],[-7,-80]]),
    path('beach-loop', 'branch', 9, [[-27,61],[-40,43],[-37,26],[-24,12],[-10,0],[2,-8]]),
    path('western-flank', 'return', 8, [[-7,-80],[-31,-62],[-44,-42],[-46,-18],[-37,26]]),
  ], {arrival:{x:18,z:31},cache:{x:-37,z:26},'encounter-1':{x:2,z:-8},'encounter-2':{x:26,z:-43},boss:{x:-7,z:-77},objective:{x:-7,z:-85},exit:{x:-34,z:65}},
  { lighting:{background:0x648b95,fog:.004}, surfaceColor:0xc3b88e, routeColor:0xd7c7a0, ridgeColor:0x647e67, campNPC:{x:23,z:33} }),
};

import { isSummon } from './combat-summons.js';
import './style.css';
import './loadout-ui.css';
import './customization-ui.css';
import './operations-ui.css';
import './local-map.css';
import { renderLoadoutScreen } from './loadout-ui.js';
import { createCustomizationDraft, commitCustomization, initialCustomization, validateCustomizationDraft, prepareCustomizationEquipment } from './customization.js';
import { CUSTOMIZATION_FIELDS, renderCustomizationScreen, renderCustomizationFooter, paintCustomizationPreview, customizationFaceSVG } from './customization-ui.js';
import { equipItem, unequipItem, buyItem, sellItem, equipmentFor, trainArmor, SLOTS } from './loadout.js';
import { listOperations, operationPOIs, getOperationInteraction, advanceOperation, getOperationEncounter, finishOperationBattle, operationEffects } from './operations.js';
import { renderOperationsJournal } from './operations-ui.js';
import { renderLocalMap } from './local-map.js';
import { WorldView } from './world.js';
import { WORLD_ZONES } from './world-data.js';
import { AudioDirector } from './audio.js';
import { COMMANDER_APPEARANCES, ORIGINS, PSYCHOLOGICAL_PROFILES } from './commander.js';
import { recordVisit, getConversation, readTopic, chooseReply, getCodexEntries } from './story.js';
import { getAssignmentConversation, chooseAssignmentReply, getAssignmentContacts, getAssignments } from './assignments.js';
import { listManualSaves, readManualSave, writeManualSave, deleteManualSave } from './save-slots.js';
import { createBattle, tickBattle, getActions, performAction, summarizeBattle, ACTIONS } from './combat.js';
import { VERSION, CLASSES, CREW, CHAPTERS, EQUIPMENT, baseActorFor, actorFor, enemiesFor } from './game-data.js';
import { newGame, unlockedZones, objectiveReady, canStartEncounter, encounterIndex, zoneEncounters, winEncounter, completeZone, recruit, availableCrew, setSquad, buyUpgrade, upgradePrice, addLog, encodeSave, decodeSave, saveTo, loadFrom } from './state.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (value,max) => Math.max(0,Math.min(100,value/Math.max(1,max)*100));
const NPC_PORTRAITS={femshep:0,femaleShepard:0,anderson:1,joker:2,chakwas:3,nihlus:4,udina:5,kirrahe:6,emily:7};
const portraitStyle = (id,appearance=state?.appearance) => {
  const key=id==='shepard'?(COMMANDER_APPEARANCES[appearance]?.sprite||'shepard'):id;
  const npc=Object.hasOwn(NPC_PORTRAITS,key),index=npc?NPC_PORTRAITS[key]:CREW[key]?.index||0;
  return `background-image:url('${import.meta.env.BASE_URL}assets/${npc?'npc':'crew'}-atlas.png');background-position:${(index%4)/3*100}% ${Math.floor(index/4)*100}%`;
};
const commanderArt = appearance => {
  if(appearance!=='female')return '';
  const config=__RELAY_FEMSHEP_ANIMATION__,frame=config.frames[0];
  return `<svg class="commander-sprite" viewBox="${frame.rect.join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${import.meta.env.BASE_URL}assets/${config.file}" width="${config.width}" height="${config.height}"/></svg>`;
};
const commanderRank = () => state?.appearance==='female'?'Commandante':'Commandant';
const newCommanderForm = () => ({name:'Shepard',classId:'soldier',difficulty:'normal',mode:'wait',appearance:'male',origin:'spacer',psychologicalProfile:'sole-survivor'});
let hudStamp = '', touchKey = null;
let state = null, battle = null, running = false, battlePOI = null, lastBattleEvent = 0, combatStamp = '', lastFrame = performance.now(), uiAccumulator = 0, saveAccumulator = 0;
let universePromise, universeModules, chronicleSession=null, chronicleBattle=null, chroniclePaused=false, chronicleFinished=false, chronicleStamp='', chronicleView=null;
const universeUI={mediaId:'',periodId:'',scenarioId:'',readingId:null,group:'all',query:'',recordId:null,visibleCount:30,tab:'references',actorId:null,actionId:'shoot',feedback:null,returnScreen:'title'};
const ui = { screen:'title', previous:null, form:newCommanderForm(), planet:'eden-prime', selectedCrew:[], actor:'shepard', action:'shoot', selectedTarget:null, equipmentActor:'shepard', equipmentTab:'loadout', equipmentKind:'all', equipmentSlots:{}, customTab:'character', customSlot:'weapon', customView:'front', customCompare:false, customShowAll:false, customWeaponFilter:'all', customizationDraft:null, customizationBase:null, customReturn:null, customCreation:false, customItem:null, operationFilter:'all', mapFilter:'all', codex:null, codexQuery:'', journalTab:'missions', tracked:null, dialogue:null, busy:false, manualNames:{}, manualFeedback:null, manualConfirmation:null, manualReturn:'title' };
$('#app').innerHTML = `<div id="world"></div><div class="vignette"></div><div id="hud" class="hidden"></div><div id="battle-ui"></div><div id="overlay"></div><div id="toasts" aria-live="polite"></div><div id="transition" class="transition-cover"><span class="eyebrow">Normandy · liaison opérationnelle</span><h2></h2><div class="spinner"></div></div><div class="scanlines"></div><input type="file" id="save-import" accept="application/json,.json" hidden><input type="file" id="chronicle-import" accept="application/json,.json" hidden>`;
const audio = new AudioDirector();
let world;
try { world = new WorldView($('#world'), { onInteract:interactPOI, onEncounter:startEncounter, onMove:position=>{ if(state) state.position=position; } }); }
catch (error) { $('#overlay').innerHTML = `<section class="screen"><div class="screen-body"><h2>Le rendu 3D n’a pas pu démarrer</h2><p class="brief-copy">Activez l’accélération graphique de votre navigateur, puis relancez le jeu.</p><p class="small">${esc(error.message)}</p><button class="primary" onclick="location.reload()">Relancer</button></div></section>`; throw error; }
for (const [zone,chapter] of Object.entries(CHAPTERS)) {
  WORLD_ZONES[zone].subtitle=chapter.cluster.toUpperCase();
  for (const [i,suffix] of ['encounter-1','encounter-2','boss'].entries()) { const poi=WORLD_ZONES[zone].pois.find(p=>p.id===`${zone}:${suffix}`); if(poi && chapter.encounterNames[i]) poi.label=chapter.encounterNames[i]; }
}

function toast(text,error=false){const el=document.createElement('div');el.className=`toast${error?' error':''}`;el.textContent=text;$('#toasts').appendChild(el);setTimeout(()=>el.remove(),4500);}
function syncMode(){world.setMode(battle?'combat':running&&!ui.screen&&!ui.busy?'explore':'menu');$('#hud').classList.toggle('hidden',!running);}
function syncStoryContext(){world.setStoryContext({...state,visitedZones:state.story.visitedZones,assignmentContacts:getAssignmentContacts(state)});}
function refreshOperations(){
  if(!state)return;
  world.setOperationPOIs(operationPOIs(state));
  const operation=listOperations(state).find(item=>item.id===state.trackedOperation);
  if(operation&&['completed','unavailable'].includes(operation.status)){state.trackedOperation=null;ui.tracked=null;}
  if(state.trackedOperation)ui.tracked=world.getInteractivePOIs().find(p=>p.operationId===state.trackedOperation)?.id||null;
  hudStamp='';
}

function applySettings(){const s=state?.settings||{sound:true,volume:.35};audio.setEnabled(s.sound);audio.setVolume(s.volume);document.body.classList.toggle('reduced-motion',!!s.reducedMotion);document.body.classList.toggle('large-text',!!s.largeText);}
function autosave(notify=false){if(!state||battle||inChronicles())return false;state.position=world.getPosition();const ok=saveTo(localStorage,state);if(notify)toast(ok?'Progression sauvegardée.':'La sauvegarde locale a échoué. Exportez votre progression.',!ok);return ok;}
function openScreen(name){ui.previous=ui.screen;ui.screen=name;audio.play('ui');syncMode();renderScreen();}
function closeScreen(){if(ui.screen==='customization'){closeCustomization();return;}ui.screen=null;ui.dialogue=null;$('#overlay').innerHTML='';syncMode();renderHUD();}
function customizationBase(){return ui.customCreation?ui.customizationBase:state;}
function openCustomization(creation=false){
  if(battle||ui.busy||(!creation&&!running))return;
  const base=creation?newGame(ui.form):state;
  if(creation&&ui.form.initialEquipment){const saved=createCustomizationDraft(base);saved.equipment={...ui.form.initialEquipment};commitCustomization(base,saved);}
  ui.customCreation=creation;ui.customizationBase=creation?base:null;ui.customReturn=ui.screen;ui.customPrevious=ui.previous;
  ui.customizationDraft=createCustomizationDraft(base);ui.customTab='character';ui.customSlot='weapon';ui.customItem=null;ui.customView='front';ui.customCompare=false;ui.customShowAll=false;ui.customWeaponFilter='all';
  openScreen('customization');
  requestAnimationFrame(()=>$('#overlay [data-do="custom-tab"]')?.focus({preventScroll:true}));
}
function closeCustomization(){
  const destination=ui.customReturn;ui.previous=ui.customPrevious;ui.customPrevious=null;ui.customizationDraft=null;ui.customizationBase=null;ui.customCompare=false;ui.customCreation=false;ui.customReturn=null;
  if(destination){ui.screen=destination;renderScreen();requestAnimationFrame(()=>document.querySelector(`[data-do="${destination==='new'?'customization-create':'customization'}"]`)?.focus({preventScroll:true}));}else{ui.screen=null;$('#overlay').innerHTML='';syncMode();renderHUD();}
}
function refreshCustomization(){
  const active=document.activeElement,focus=active?.dataset?.do?{action:active.dataset.do,id:active.dataset.id,field:active.dataset.field,slot:active.dataset.slot}:null;
  const scroll=$('.customization-screen .screen-body')?.scrollTop||0,controls=$('.custom-controls')?.scrollTop||0,inspector=$('.custom-inspector')?.scrollTop||0;
  renderScreen();
  if($('.customization-screen .screen-body'))$('.customization-screen .screen-body').scrollTop=scroll;
  if($('.custom-controls'))$('.custom-controls').scrollTop=controls;
  if($('.custom-inspector'))$('.custom-inspector').scrollTop=inspector;
  if(focus){const button=[...document.querySelectorAll('.customization-screen [data-do]')].find(element=>element.dataset.do===focus.action&&element.dataset.id===focus.id&&element.dataset.field===focus.field&&element.dataset.slot===focus.slot);button?.focus({preventScroll:true});}
}
function applyCustomization(){
  if(ui.screen!=='customization'||!ui.customizationDraft||battle)return;
  const base=customizationBase(),result=commitCustomization(base,ui.customizationDraft,{inCombat:!!battle});
  if(!result.ok){toast(result.reason,true);return;}
  if(ui.customCreation){ui.form.appearance=base.appearance;ui.form.customization=structuredClone(base.customization);ui.form.initialEquipment={...base.inventory.equipped.shepard};}
  else{world.setCommanderAppearance(state.appearance);world.setCommanderCustomization(state.customization);hudStamp='';autosave();}
  closeCustomization();toast('Personnalisation appliquée.');
}
function customizationScreen(){
  const base=customizationBase();
  return screen('Personnalisation de Shepard',`${ui.customCreation?'Nouveau dossier':'Archives de l’Alliance'} · personnage & dotation`,renderCustomizationScreen(base,ui),renderCustomizationFooter(base,ui),'customization-screen');
}
function inChronicles(){return ['chronicles','chronicles-loading'].includes(ui.screen);}
async function openChronicles(){
  if(battle||ui.busy)return;
  if(running)autosave();
  universeUI.returnScreen=running?'pause':'title';
  ui.screen='chronicles-loading';syncMode();renderScreen();
  try{
    universePromise ||= Promise.all([import('./universe-ui.js'),import('./chronicles.js'),import('./continuity.js'),import('./universe-data.js'),import('./universe-ui.css')]).then(([renderer,engine,continuity,data])=>({renderer,engine,continuity,data})).catch(error=>{universePromise=null;throw error;});
    universeModules=await universePromise;
    if(ui.screen!=='chronicles-loading')return;
    ui.screen='chronicles';renderScreen();
  }catch{if(ui.screen==='chronicles-loading'){ui.screen=universeUI.returnScreen;renderScreen();toast('Les chroniques n’ont pas pu être chargées. Réessayez.',true);}}
}
function closeChronicles(){chroniclePaused=true;ui.screen=universeUI.returnScreen;renderScreen();}
function universeContext(){return universeModules?.continuity.normalizeContext({mediaId:universeUI.mediaId,periodId:universeUI.periodId})||null;}
function universeView(){
  const context=universeContext(),engine=universeModules.engine;
  const records=context?universeModules.continuity.listAvailable(context,{group:universeUI.group,query:universeUI.query}):[];
  if(!records.some(record=>record.id===universeUI.recordId))universeUI.recordId=records[0]?.id||null;
  const roster=chronicleSession?engine.getChronicleRoster(chronicleSession):[];
  const gearByActor={},gearByActorSlot={},actors={},buildsByActor={},ammoModesByActor={};
  for(const id of chronicleSession?.party||[]){gearByActor[id]=engine.getChronicleGear(chronicleSession,id);gearByActorSlot[id]={weaponMod:engine.getChronicleGear(chronicleSession,id,'weaponMod'),weaponMod2:engine.getChronicleGear(chronicleSession,id,'weaponMod2')};actors[id]=engine.buildChronicleActor(chronicleSession,id);buildsByActor[id]=engine.getChronicleBuilds(chronicleSession,id);ammoModesByActor[id]=engine.getChronicleAmmoModes(chronicleSession,id);}
  const readings=context?engine.listChronicleReadings(context):[];
  if(!readings.some(reading=>reading.id===universeUI.readingId))universeUI.readingId=readings[0]?.id||null;
  const reading=chronicleSession&&universeUI.readingId?engine.getChronicleReading(chronicleSession,universeUI.readingId):null;
  return {works:universeModules.data.UNIVERSE_WORKS,context,records,scenarios:context?engine.listChronicleScenarios(context):[],session:chronicleSession,roster,gearByActor,gearByActorSlot,actors,buildsByActor,ammoModesByActor,actionLabels:ACTIONS,readings,reading,battle:chronicleBattle,feedback:universeUI.feedback,paused:chroniclePaused,...chronicleCommands()};
}
function chronicleCommands(){
  if(!chronicleBattle)return {actions:[],selectedActorId:null,selectedActionId:null};
  const party=chronicleBattle.actors.filter(actor=>actor.team==='party'&&!isSummon(actor));
  let actor=party.find(actor=>actor.id===universeUI.actorId);
  const ready=party.find(candidate=>candidate.hp>0&&getActions(chronicleBattle,candidate.id).some(action=>action.available));
  if((!actor||actor.hp<=0||actor.atb<99.999)&&ready)actor=ready;
  actor ||= party.find(candidate=>candidate.hp>0)||party[0];
  universeUI.actorId=actor?.id;
  const actions=actor?getActions(chronicleBattle,actor.id):[];
  if(!actions.some(action=>action.id===universeUI.actionId))universeUI.actionId=actions[0]?.id||'shoot';
  return {actions,selectedActorId:universeUI.actorId,selectedActionId:universeUI.actionId};
}
function resetChronicleContext(mediaId,periodId=''){
  if(chronicleBattle&&!chronicleBattle.winner)return;
  universeUI.mediaId=mediaId;universeUI.periodId=periodId;universeUI.scenarioId='';universeUI.readingId=null;universeUI.query='';universeUI.recordId=null;universeUI.visibleCount=30;universeUI.feedback=null;
  chronicleSession=null;chronicleBattle=null;chronicleView=null;chronicleStamp='';
  const context=universeContext();
  if(context){const loaded=universeModules.engine.loadChronicle(localStorage,context);if(loaded.ok)chronicleSession=loaded.session;else universeUI.feedback={text:loaded.reason,error:true};}
  if(universeUI.tab==='reading'&&chronicleSession){universeUI.readingId=universeModules.engine.listChronicleReadings(context)[0]?.id||null;if(universeUI.readingId)return readChroniclePage();}
  renderScreen();
}
function chronicleFeedback(text,error=false){universeUI.feedback={text,error};renderScreen();}
function persistChronicle(success){
  const saved=universeModules.engine.saveChronicle(localStorage,chronicleSession);
  universeUI.feedback={text:saved.ok?success:saved.reason,error:!saved.ok};
  return saved.ok;
}
function acceptChronicle(result,message){
  if(!result?.ok)return chronicleFeedback(result?.reason||'Cette préparation est indisponible.',true);
  chronicleSession=result.session;chronicleBattle=null;chronicleStamp='';persistChronicle(message);renderScreen();
}
function readChroniclePage(index){
  if(!chronicleSession||!universeUI.readingId||chronicleBattle&&!chronicleBattle.winner)return;
  acceptChronicle(universeModules.engine.readChroniclePage(chronicleSession,universeUI.readingId,index),'Lecture enregistrée.');
}
function prepareChronicle(){
  if(chronicleSession)return acceptChronicle(universeModules.engine.selectChronicleScenario(chronicleSession,universeUI.scenarioId||chronicleSession.scenarioId),'Préparation enregistrée dans cette chronique.');
  const session=universeModules.engine.createChronicle(universeContext(),universeUI.scenarioId||undefined);
  if(!session)return chronicleFeedback('Choisissez une période proposant un essai tactique.',true);
  acceptChronicle({ok:true,session},'Préparation enregistrée dans cette chronique.');
}
function loadPreparedChronicle(){acceptChronicle(universeModules.engine.loadChronicle(localStorage,universeContext()),'Chronique chargée.');}
function launchChronicleBattle(){
  const result=universeModules.engine.startChronicleBattle(chronicleSession);
  if(!result.ok)return chronicleFeedback(result.reason,true);
  chronicleBattle=result.battle;chroniclePaused=false;chronicleFinished=false;chronicleStamp='';universeUI.feedback=null;universeUI.actorId=chronicleSession.party[0];universeUI.actionId='shoot';renderScreen();
}
function concludeChronicleBattle(){
  if(!chronicleBattle?.winner||chronicleFinished)return;
  chronicleFinished=true;
  const result=universeModules.engine.finishChronicleBattle(chronicleSession,chronicleBattle);
  if(!result.ok)return chronicleFeedback(result.reason,true);
  chronicleSession=result.session;persistChronicle(result.won?'Essai réussi · résultat enregistré.':'Escarmouche terminée · préparation conservée.');renderScreen();
}
function issueChronicleAction(targetId){
  if(!chronicleBattle||chronicleBattle.winner||chroniclePaused||document.hidden)return;
  const result=performAction(chronicleBattle,{actorId:universeUI.actorId,actionId:universeUI.actionId,targetId});
  if(!result.ok){toast(result.reason,true);return result;}
  chronicleStamp='';if(chronicleBattle.winner)concludeChronicleBattle();else renderChronicleCombat(true);
  return result;
}
function advanceChronicle(dt){
  if(ui.screen!=='chronicles'||!chronicleBattle||chroniclePaused||ui.busy||document.hidden)return;
  tickBattle(chronicleBattle,dt);if(chronicleBattle.winner)concludeChronicleBattle();
}
function renderChronicleCombat(force=false){
  if(ui.screen!=='chronicles'||universeUI.tab!=='session'||!chronicleBattle||!chronicleView)return;
  Object.assign(chronicleView,{battle:chronicleBattle,session:chronicleSession,paused:chroniclePaused},chronicleCommands());
  const stamp=[chronicleView.selectedActorId,chronicleView.selectedActionId,chroniclePaused,chronicleBattle.waiting,chronicleBattle.winner,chronicleBattle.medigel,chronicleBattle.log.at(-1),...chronicleView.actions.map(action=>`${action.id}:${action.available}:${action.reason}:${Math.ceil(action.cooldownRemaining||0)}`),...chronicleBattle.actors.map(actor=>`${actor.id}:${actor.hp>0}:${actor.ammo}:${Math.round(actor.heat)}:${actor.ammoModeId}`)].join('|');
  if(force||stamp!==chronicleStamp){chronicleStamp=stamp;const content=$('#chronicle-battle-content');if(content)content.innerHTML=universeModules.renderer.renderChronicleBattle(chronicleView,universeUI,{esc});}
  for(const actor of chronicleBattle.actors){
    const card=document.querySelector(`[data-chronicle-unit="${CSS.escape(actor.id)}"]`);if(!card)continue;
    for(const [stat,value,max] of [['hp',actor.hp,actor.maxHp],['shield',actor.shield,actor.maxShield],['atb',actor.atb,100]]){const bar=card.querySelector(`[data-chronicle-stat="${stat}"]`);if(bar)bar.style.width=`${pct(value,max)}%`;}
    card.querySelector('[data-chronicle-hp-label]').textContent=`${Math.ceil(actor.hp)} / ${actor.maxHp}`;
    const lifetime=card.querySelector('[data-chronicle-support-time]');if(lifetime)lifetime.textContent=`${Math.max(0,Math.ceil(actor.expiresAt-chronicleBattle.elapsed))} s`;
  }
}
function exportChronicle(){
  const encoded=universeModules.engine.encodeChronicle(chronicleSession);if(!encoded)return chronicleFeedback('Cette chronique ne peut pas être exportée.',true);
  const url=URL.createObjectURL(new Blob([encoded],{type:'application/json'})),anchor=document.createElement('a');anchor.href=url;anchor.download=`Relay_Chronicle_${chronicleSession.context.mediaId}_${chronicleSession.context.periodId}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function screen(title,eyebrow,body,foot='',className=''){return `<div class="overlay-backdrop"></div><section class="screen ${className}" role="dialog" aria-label="${esc(title)}"><header class="screen-head"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div>${['victory','defeat','ending'].includes(ui.screen)?'':'<button class="close" data-do="close" aria-label="Fermer">×</button>'}</header><div class="screen-body">${body}</div>${foot?`<footer class="screen-foot">${foot}</footer>`:''}</section>`;}
function titleScreen(){
  const saved=loadFrom(localStorage);
  return `<section class="title-screen"><div class="title-art"></div><div class="title-coordinates">ARCHIVES DE L’ALLIANCE<br>2183 · ESPACE CONCILIEN<div class="title-line"></div>SSV NORMANDY SR-1</div><div class="title-content"><div class="title-overline">UNE GALAXIE. VOS DÉCISIONS.</div><h1 class="title-wordmark">MASS EFFECT</h1><h2 class="title-subtitle">Relay Chronicles</h2><p class="title-copy">Traversez les relais. Rassemblez votre commando.<br>Une aventure cinématographique en 2D/3D,<br>au rythme de vos décisions.</p><div class="title-menu">${saved?`<button class="primary" data-do="continue">Reprendre <span>→</span></button>`:''}<button class="${saved?'secondary':'primary'}" data-do="new">Nouvelle campagne <span>→</span></button><button class="secondary" data-do="manual-saves">Charger une partie <span>→</span></button><button class="secondary" data-do="chronicles">Chroniques <span>→</span></button><button class="secondary" data-do="import">Importer une sauvegarde <span>↗</span></button><button class="secondary" data-do="title-settings">Options <span>＋</span></button><button class="secondary" data-do="credits">Crédits <span>＋</span></button></div></div><div class="title-badge"><b>01 / 2183</b><small>LES CHRONIQUES DES RELAIS</small></div><footer class="title-footer"><span>Projet de fan non officiel · campagne condensée</span><span>Version ${VERSION} · PC</span></footer></section>`;
}
function renderScreen(){
  let html='';
  if(ui.screen==='title')html=titleScreen();
  else if(ui.screen==='chronicles-loading')html=screen('Chroniques','Archives des relais','<p class="brief-copy" role="status">Chargement des chroniques…</p>');
  else if(ui.screen==='chronicles'&&universeModules){chronicleView=universeView();html=screen('Chroniques','Œuvres et chapitres',universeModules.renderer.renderUniverseScreen(chronicleView,universeUI,{esc}),'<span class="small">Références et essais tactiques indépendants. Votre campagne Mass Effect conserve sa progression.</span><button class="secondary" data-do="chronicle-back">Retour</button>','universe-screen');}
  else if(ui.screen==='new')html=newGameScreen();
  else if(ui.screen==='pause')html=screen('Mission en pause','Normandy · commando',`<div class="button-row"><button class="primary" data-do="close">Reprendre</button><button class="secondary" data-do="save" ${battle?'disabled':''}>Sauvegarder</button><button class="secondary" data-do="manual-saves" ${battle?'disabled':''}>Emplacements de sauvegarde</button><button class="secondary" data-do="export" ${battle?'disabled':''}>Exporter la sauvegarde</button><button class="secondary" data-do="dossier">Dossier Shepard</button><button class="secondary" data-do="customization" ${battle?'disabled':''}>Personnaliser Shepard</button><button class="secondary" data-do="chronicles" ${battle?'disabled':''}>Chroniques</button><button class="secondary" data-do="settings">Options</button><button class="secondary" data-do="help">Commandes</button><button class="danger" data-do="quit">Retour au titre</button></div>`,`<span class="small">${battle?'La reprise se fait avant le combat en cours.':'Sauvegarde automatique entre les rencontres.'}</span>`,'pause-screen');
  else if(ui.screen==='galaxy')html=galaxyScreen();
  else if(ui.screen==='squad')html=squadScreen();
  else if(ui.screen==='dossier')html=commanderScreen();
  else if(ui.screen==='saves')html=manualSavesScreen();
  else if(ui.screen==='equipment')html=equipmentScreen();
  else if(ui.screen==='customization')html=customizationScreen();
  else if(ui.screen==='journal')html=journalScreen();
  else if(ui.screen==='codex')html=codexScreen();
  else if(ui.screen==='settings')html=settingsScreen();
  else if(ui.screen==='dialogue')html=dialogueScreen();
  else if(ui.screen==='victory')html=victoryScreen();
  else if(ui.screen==='defeat')html=screen('Le commando est hors combat','Intervention interrompue',`<p class="brief-copy">Reprenez la rencontre depuis votre état précédent ou revenez à la dernière sauvegarde.</p>`,`<button class="secondary" data-do="load">Dernière sauvegarde</button><button class="primary" data-do="retry">Reprendre le combat</button>`,'pause-screen');
  else if(ui.screen==='ending')html=endingScreen();
  else if(ui.screen==='map')html=localMapScreen();
  else if(ui.screen==='help')html=screen('Commandes','Manuel du commando',`<div class="journal-layout"><div><div class="section-label">Exploration</div><p class="brief-copy">ZQSD / WASD / flèches : déplacement<br>Maj : courir<br>E : interaction proche<br>Clic sur le sol : se déplacer<br>Clic sur un repère : rejoindre et interagir</p></div><div><div class="section-label">Menus et combat</div><p class="brief-copy">Échap : pause / fermer<br>J : journal · C : commando · I : équipement<br>M : carte · G : galaxie au Normandy<br>1, 2, 3 : choisir un équipier<br>Espace : tir contrôlé avec un équipier prêt</p></div></div>`);
  else if(ui.screen==='credits')html=screen('Relay Chronicles','Crédits',`<p class="brief-copy">Conception et réalisation pour Darknigthmare.<br>Univers, personnages et noms Mass Effect : Electronic Arts et BioWare.<br>Cette adaptation de fan est indépendante et non officielle.</p><div class="divider"></div><p class="small">Code du prototype : JavaScript, Three.js, Vite et Electron.<br>Illustrations et atlas : génération originale assistée par IA, références ME1, validation artistique en cours.<br>Ambiances et effets sonores : synthèse originale Web Audio.<br>Les dialogues, les combats ATB et les cartes condensées sont des adaptations.</p>`);
  $('#overlay').innerHTML=html;syncMode();
  if(ui.screen==='customization')paintCustomizationPreview($('#overlay'),customizationBase(),ui);
}
function commanderField(id,label,choices,value){
  const selected=choices[value];
  return `<label class="field commander-field" for="${id}"><span>${label}</span><select id="${id}" aria-describedby="${id}-description">${Object.entries(choices).map(([key,entry])=>`<option value="${key}" ${key===value?'selected':''}>${esc(entry.name)}</option>`).join('')}</select></label><p class="field-description" id="${id}-description">${esc(selected.description)}</p>`;
}
function newGameScreen(){
  return screen('Dossier Shepard','Nouvelle campagne',`
    <div class="form-layout commander-form">
      <div>
        <p class="brief-copy">L’Alliance vous confie une mission de récupération sur Eden Prime. Votre histoire commence à bord du Normandy.</p>
        <div class="divider"></div>
        <label class="field"><span>Nom de Shepard</span><input id="commander-name" maxlength="24" value="${esc(ui.form.name)}" autocomplete="off"></label>
        ${commanderField('new-appearance','Apparence',COMMANDER_APPEARANCES,ui.form.appearance)}
        ${commanderField('new-origin','Origine',ORIGINS,ui.form.origin)}
        ${commanderField('new-profile','Profil psychologique',PSYCHOLOGICAL_PROFILES,ui.form.psychologicalProfile)}
      </div>
      <div>
        <div class="commander-preview-row"><div id="commander-preview" class="crew-art commander-preview" role="img" aria-label="${esc(COMMANDER_APPEARANCES[ui.form.appearance].name)}" style="${ui.form.customization||ui.form.appearance==='female'?'background-image:none':portraitStyle('shepard',ui.form.appearance)}">${ui.form.customization?customizationFaceSVG({appearance:ui.form.appearance,customization:ui.form.customization},'creation-face'):commanderArt(ui.form.appearance)}</div><div><div class="section-label">Archives de l’Alliance</div><p class="small">Votre origine et votre profil font partie du dossier personnel conservé avec la campagne.</p><button class="secondary" data-do="customization-create" style="margin-top:12px;font-size:9px;padding:10px 12px">Personnaliser l’apparence</button></div></div>
        <div class="section-label">Spécialisation</div>
        <div class="class-grid">${Object.entries(CLASSES).map(([id,c])=>`<button class="class-card ${ui.form.classId===id?'selected':''}" data-do="class" data-id="${id}"><strong>${c.name}</strong><small>${c.tagline}</small></button>`).join('')}</div>
        <div class="divider"></div>
        <label class="field"><span>Difficulté</span><select id="new-difficulty"><option value="story" ${ui.form.difficulty==='story'?'selected':''}>Histoire — profiter de l’aventure</option><option value="normal" ${ui.form.difficulty==='normal'?'selected':''}>Vétéran — équilibre tactique</option><option value="hard" ${ui.form.difficulty==='hard'?'selected':''}>Difficile — pression renforcée</option></select></label>
        <label class="field"><span>Rythme des combats</span><select id="new-mode"><option value="wait" ${ui.form.mode==='wait'?'selected':''}>Attente — pause à chaque décision</option><option value="active" ${ui.form.mode==='active'?'selected':''}>Actif — le temps continue</option></select></label>
      </div>
    </div>`, `<span class="small">${loadFrom(localStorage)?'Commencer remplacera la sauvegarde automatique.':'Déplacements : ZQSD / WASD / flèches · interaction : E'}</span><button class="primary" data-do="begin">Commencer l’aventure →</button>`, 'commander-creation');
}
function commanderScreen(){
  const appearance=COMMANDER_APPEARANCES[state.appearance],origin=ORIGINS[state.origin],profile=PSYCHOLOGICAL_PROFILES[state.psychologicalProfile];
  return screen('Dossier Shepard','Archives personnelles · Alliance',`
    <div class="commander-dossier">
      <div><div class="crew-art commander-portrait" role="img" aria-label="Portrait de ${esc(state.name)}" style="${state.appearance==='female'?'background-image:none':portraitStyle('shepard')}">${commanderArt(state.appearance)}</div><span class="pill teal">${esc(appearance.name)}</span></div>
      <div><div class="eyebrow">${commanderRank()}</div><h3 class="commander-name">${esc(state.name)}</h3><p class="brief-copy">${esc(CLASSES[state.classId].name)} · Niveau ${Math.floor(state.xp/300)+1}</p>
        <dl class="commander-record"><div><dt>Origine</dt><dd><strong>${esc(origin.name)}</strong><p>${esc(origin.description)}</p></dd></div><div><dt>Profil psychologique</dt><dd><strong>${esc(profile.name)}</strong><p>${esc(profile.description)}</p></dd></div></dl>
      </div>
    </div>`, `<button class="secondary" data-do="customization" ${battle?'disabled':''}>Personnaliser Shepard</button><button class="secondary" data-do="dossier-back">${ui.previous==='squad'?'Retour au commando':'Retour à la pause'}</button>`);
}
const manualDate = value => new Intl.DateTimeFormat('fr-FR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Paris',timeZoneName:'short'}).format(new Date(value));
const manualDefaultName = () => `${WORLD_ZONES[state.zone].label} · ${manualDate(new Date())}`;
const canWriteManualSave = () => running&&!!state&&!battle&&!ui.busy;
function manualFeedbackHTML(){return ui.manualFeedback?`<p id="manual-save-feedback" class="save-feedback ${ui.manualFeedback.error?'error':''}" role="${ui.manualFeedback.error?'alert':'status'}">${esc(ui.manualFeedback.text)}</p>`:'';}
function manualMetadataHTML(metadata){
  return `<h3 class="save-slot-name">${esc(metadata.name)}</h3><p><time datetime="${esc(metadata.savedAt)}">${esc(manualDate(metadata.savedAt))}</time></p><dl class="save-slot-details"><div><dt>Lieu</dt><dd class="save-slot-zone">${esc(WORLD_ZONES[metadata.zone].label)}</dd></div><div><dt>Commandement</dt><dd class="save-slot-commander">${esc(metadata.commanderName)} · ${esc(COMMANDER_APPEARANCES[metadata.appearance].name)}</dd></div><div><dt>Spécialisation</dt><dd class="save-slot-class">${esc(CLASSES[metadata.classId].name)}</dd></div></dl>`;
}
function manualSavesScreen(){
  if(ui.manualConfirmation)return manualConfirmationScreen();
  const result=listManualSaves(localStorage),canSave=canWriteManualSave();
  return screen('Sauvegardes manuelles','Six emplacements · sur cet appareil',`
    <p class="brief-copy">${running?'Enregistrez votre progression dans un emplacement nommé ou chargez un parcours conservé.':'Choisissez une partie conservée pour reprendre votre parcours.'} Les emplacements restent indépendants de la sauvegarde automatique.</p>
    ${manualFeedbackHTML()}${!result.ok?`<p class="save-feedback error" role="alert">${esc(result.reason)}</p>`:''}
    ${battle?'<p class="save-feedback error" role="alert">Le chargement et l’enregistrement sont indisponibles pendant un combat.</p>':''}
    <div class="save-slots">${result.slots.map(slot=>{
      const occupied=slot.status==='saved'||slot.status==='corrupt',unavailable=slot.status==='unavailable';
      const name=ui.manualNames[slot.id]??slot.metadata?.name??'';
      return `<article class="save-slot ${slot.status}" data-save-slot="${slot.id}" data-status="${slot.status}" aria-label="Emplacement ${slot.id}">
        <div class="save-slot-header"><span class="eyebrow">Emplacement ${slot.id}</span><span class="pill ${slot.status==='saved'?'teal':''}">${slot.status==='saved'?'Enregistré':slot.status==='empty'?'Libre':slot.status==='corrupt'?'Illisible':'Indisponible'}</span></div>
        <div class="save-slot-preview">${slot.metadata?manualMetadataHTML(slot.metadata):`<h3 class="save-slot-name">${slot.status==='empty'?'Emplacement libre':slot.status==='corrupt'?'Sauvegarde illisible':'Stockage inaccessible'}</h3><p class="small">${slot.status==='empty'?'Aucune partie enregistrée ici.':slot.status==='corrupt'?'Les données ne permettent pas de reconstituer une partie valide. Vous pouvez conserver cet emplacement, le remplacer ou le supprimer.':'Les données de cet emplacement ne peuvent pas être consultées actuellement.'}</p>`}</div>
        ${canSave?`<label class="field save-name-field" for="manual-save-name-${slot.id}"><span>Nom de la sauvegarde</span><input id="manual-save-name-${slot.id}" data-manual-name="${slot.id}" maxlength="60" value="${esc(name)}" placeholder="${esc(manualDefaultName())}" ${unavailable?'disabled':''}></label>`:''}
        <div class="button-row save-slot-actions">${running?`<button class="secondary" data-do="manual-save" data-id="${slot.id}" ${!canSave||unavailable?'disabled':''}>${occupied?'Remplacer':'Enregistrer'}</button>`:''}<button class="${running?'secondary':'primary'}" data-do="manual-load" data-id="${slot.id}" ${slot.status!=='saved'||battle||ui.busy?'disabled':''}>Charger</button>${occupied?`<button class="danger" data-do="manual-delete" data-id="${slot.id}" ${battle||ui.busy?'disabled':''}>Supprimer</button>`:''}</div>
      </article>`;
    }).join('')}</div>`, `<span class="small">${running?'Sauvegarde automatique : bouton Sauvegarder dans la pause.':'Le bouton Reprendre du titre utilise la sauvegarde automatique.'}</span><button class="secondary" data-do="manual-back">${ui.manualReturn==='title'?'Retour au titre':'Retour à la pause'}</button>`, 'manual-saves-screen');
}
function manualConfirmationScreen(){
  const pending=ui.manualConfirmation,remove=pending.action==='delete';
  return screen(remove?'Supprimer cet emplacement ?':'Remplacer cette sauvegarde ?',`Emplacement ${pending.id}`,`
    <div class="save-confirmation" data-manual-confirm="${pending.action}">
      ${manualFeedbackHTML()}
      <p class="brief-copy">${remove?'La partie conservée dans cet emplacement sera supprimée.':'La partie conservée dans cet emplacement sera remplacée par votre progression actuelle.'}</p>
      <div class="save-confirm-preview">${pending.slot.metadata?manualMetadataHTML(pending.slot.metadata):'<h3 class="save-slot-name">Sauvegarde illisible</h3><p class="small">Cet emplacement contient des données qui ne peuvent pas être chargées.</p>'}</div>
      ${remove?'':`<div class="save-replacement"><div class="section-label">Progression à enregistrer</div><h3>${esc(pending.name)}</h3><p>${esc(state.name)} · ${esc(CLASSES[state.classId].name)} · ${esc(WORLD_ZONES[state.zone].label)}</p></div>`}
    </div>`, `<button class="secondary" data-do="manual-cancel">Annuler</button><button class="danger" data-do="manual-confirm" ${battle||ui.busy?'disabled':''}>${remove?'Supprimer définitivement':'Confirmer le remplacement'}</button>`, 'save-confirmation-screen');
}
function showManualResult(result,message){
  ui.manualFeedback={error:!result.ok,text:result.ok?message:result.reason};renderScreen();
}
function currentManualSlot(id){return listManualSaves(localStorage).slots.find(slot=>slot.id===id);}
function requestManualSave(id){
  if(!canWriteManualSave())return;
  const slot=currentManualSlot(id);if(!slot)return;
  const name=(ui.manualNames[id]??slot.metadata?.name??'').trim()||manualDefaultName();
  ui.manualNames[id]=name;ui.manualFeedback=null;
  if(slot.status==='saved'||slot.status==='corrupt'){ui.manualConfirmation={action:'overwrite',id,name,slot};renderScreen();return;}
  writeCurrentManualSave(id,name,false);
}
function writeCurrentManualSave(id,name,overwrite){
  if(!canWriteManualSave())return;
  state.position=world.getPosition();
  const result=writeManualSave(localStorage,id,state,{name,overwrite});
  if(result.ok)ui.manualConfirmation=null;
  showManualResult(result,'Partie enregistrée dans cet emplacement.');
}
function requestManualDelete(id){
  if(battle||ui.busy)return;
  const slot=currentManualSlot(id);if(!slot||!['saved','corrupt'].includes(slot.status))return;
  ui.manualFeedback=null;ui.manualConfirmation={action:'delete',id,slot};renderScreen();
}
function confirmManualAction(){
  const pending=ui.manualConfirmation;if(!pending||battle||ui.busy)return;
  const current=currentManualSlot(pending.id);
  if(!current||current.status==='unavailable'){showManualResult({ok:false,reason:'Cet emplacement ne peut pas être consulté. Réessayez lorsque le stockage est disponible.'});return;}
  if(JSON.stringify(current)!==JSON.stringify(pending.slot)){
    if(current.status==='empty'){ui.manualConfirmation=null;showManualResult({ok:false,reason:'Cet emplacement a changé. Vérifiez les emplacements avant de réessayer.'});return;}
    pending.slot=current;showManualResult({ok:false,reason:'Cet emplacement a changé. Consultez son nouvel aperçu avant de confirmer.'});return;
  }
  if(pending.action==='overwrite')writeCurrentManualSave(pending.id,pending.name,true);
  else {const result=deleteManualSave(localStorage,pending.id);if(result.ok){ui.manualConfirmation=null;delete ui.manualNames[pending.id];}showManualResult(result,'Emplacement supprimé.');}
}
function loadManualSave(id){
  if(battle||ui.busy)return;
  const result=readManualSave(localStorage,id);
  if(!result.ok){showManualResult(result);return;}
  ui.manualConfirmation=null;ui.manualFeedback=null;continueGame(result.state);toast('Partie chargée depuis l’emplacement '+id+'.');
}
function galaxyScreen(){
  const unlocked=unlockedZones(state);const chapter=CHAPTERS[ui.planet]||CHAPTERS['eden-prime'];
  const positions=[[25,23],[67,19],[47,39],[19,53],[81,45],[60,62],[35,78],[80,82]];
  return screen('Carte de la galaxie','Normandy SR-1 · navigation',`<div class="galaxy-layout"><div class="starmap"><div class="star-dust"></div><div class="galaxy-orbit"></div>${Object.entries(CHAPTERS).map(([id,c],i)=>`<button class="planet-dot ${ui.planet===id?'selected':''}" data-do="planet" data-id="${id}" style="left:${positions[i][0]}%;top:${positions[i][1]}%;--planet:${c.palette}" ${!unlocked.includes(id)?'disabled':''}><i></i>${c.name}${state.completed.includes(id)?' ✓':''}</button>`).join('')}</div><div class="planet-detail"><div class="planet-number">${chapter.number}</div><span class="eyebrow">${chapter.subtitle}</span><h3>${chapter.name}</h3><div class="cluster">${chapter.cluster}</div><p>${chapter.description}</p><div class="status">${state.completed.includes(ui.planet)?'Mission accomplie · revisite disponible':unlocked.includes(ui.planet)?'Destination accessible':'Poursuivez votre enquête pour obtenir les coordonnées.'}</div><button class="primary" data-do="travel" data-id="${ui.planet}" ${!unlocked.includes(ui.planet)?'disabled':''}>Préparer le déploiement →</button></div></div>`,`<span class="small">${state.completed.length} étapes accomplies · ${state.credits} crédits</span><span class="small">Les destinations se débloquent avec l’enquête.</span>`);
}
function squadScreen(){
  const available=availableCrew(state);const editable=state.zone==='normandy';
  return screen('Votre commando','Deux équipiers · une mission',`<p class="brief-copy" style="margin-bottom:22px">${editable?'Choisissez deux compagnons pour votre prochaine sortie.':'Votre groupe est engagé sur le terrain. La composition se prépare au Normandy.'}</p><div class="crew-grid">${Object.values(CREW).filter(c=>!['shepard','jenkins'].includes(c.id)).map(c=>{const locked=!available.includes(c.id);return `<button class="crew-card ${ui.selectedCrew.includes(c.id)?'selected':''} ${locked?'unavailable':''}" data-do="crew-select" data-id="${c.id}" ${locked||!editable?'disabled':''}>${ui.selectedCrew.includes(c.id)?'<span class="check">SÉLECTIONNÉ</span>':''}<div class="crew-art" style="${portraitStyle(c.id)}"></div><div class="card-info"><strong>${c.name}</strong><small>${state.lost.includes(c.id)?'Mort au combat':locked?'Pas encore recruté':c.role}</small><small>${c.description}</small></div></button>`;}).join('')}</div>${editable?conversationDirectory():''}`,`<div class="squad-footer"><span class="small">${ui.selectedCrew.length}/2 équipiers sélectionnés</span><button class="secondary" data-do="dossier">Dossier Shepard</button></div><button class="primary" data-do="crew-confirm" ${!editable||ui.selectedCrew.length!==2?'disabled':''}>Confirmer le commando</button>`);
}
function conversationDirectory(){
  const conversations=['nihlus','joker','chakwas','kaidan','ashley','garrus','tali','wrex','liara'].map(id=>getConversation(state,id)).filter(Boolean);
  if(!conversations.length)return '';
  return `<div class="conversation-directory"><div class="section-label">Échanges à bord</div><div class="conversation-buttons">${conversations.map(conversation=>`<button class="secondary" data-do="conversation" data-id="${esc(conversation.id)}">Parler à ${esc(conversation.speaker)}</button>`).join('')}</div></div>`;
}
function equipmentScreen(){
  const id=ui.equipmentActor;
  if(id!=='shepard'&&(!state.recruited.includes(id)||state.lost.includes(id)&&!Object.values(equipmentFor(state,id)||{}).some(Boolean)))ui.equipmentActor='shepard';
  return screen('Équipement du commando',`${state.credits} crédits · ${state.medigel} médi-gels`,renderLoadoutScreen(state,ui,{esc,portraitStyle,baseActorFor,actorFor,upgradePrice}),`<div class="custom-entry"><div><strong>Atelier de Shepard</strong><p>Personnage, revêtement d’armure et configuration des armes.</p></div><button class="secondary" data-do="customization">Personnaliser Shepard</button></div>`);
}
function journalScreen(){
  const tabs=[['missions','Missions'],['assignments','Assignations'],['reports','Rapports']];
  let body='';
  if(ui.journalTab==='assignments')body=assignmentJournal()+renderOperationsJournal(state,ui,{esc});
  else if(ui.journalTab==='reports')body=`<div class="journal-reports">${state.logs.slice(0,12).map(log=>`<article class="journal-entry"><h3>${esc(log.title)}</h3><p>${esc(log.text)}</p></article>`).join('')}</div>`;
  else body=`<div class="journal-missions"><div class="section-label">Campagne</div>${Object.entries(CHAPTERS).filter(([id])=>unlockedZones(state).includes(id)).map(([id,chapter])=>`<article class="journal-entry" data-mission-id="${id}"><h3>${state.completed.includes(id)?'✓ ':''}${esc(chapter.name)}</h3><p>${state.completed.includes(id)?'Mission accomplie.':esc(chapter.objective)}</p>${state.choices[id]?`<span class="pill">${esc(choiceLabel(id,state.choices[id]))}</span>`:''}</article>`).join('')}</div>`;
  return screen('Journal de mission','Missions · assignations · rapports',`<nav class="tabs" aria-label="Sections du journal">${tabs.map(([id,label])=>`<button class="tab ${ui.journalTab===id?'active':''}" data-do="journal-tab" data-id="${id}" aria-pressed="${ui.journalTab===id}">${label}</button>`).join('')}</nav><div class="journal-section" data-journal-section="${ui.journalTab}">${body}</div>`,`<span class="small">Conciliation ${state.paragon} · Pragmatisme ${state.renegade}</span><span class="small">Niveau ${Math.floor(state.xp/300)+1} · ${state.xp} EXP</span>`);
}
function assignmentJournal(){
  const assignments=getAssignments(state);
  if(!assignments.length)return '<p class="brief-copy">Aucune assignation de contact enregistrée. Vos rencontres peuvent ouvrir de nouvelles pistes.</p>';
  return [['active','En cours'],['completed','Terminées']].map(([status,label])=>{
    const entries=assignments.filter(assignment=>assignment.status===status);
    if(!entries.length)return '';
    return `<section class="assignment-group"><h3 class="section-label">${label}</h3>${entries.map(assignment=>`<article class="journal-entry assignment-entry" data-assignment-id="${esc(assignment.id)}" data-assignment-status="${assignment.status}"><div class="assignment-heading"><h3>${esc(assignment.title)}</h3><span class="pill ${status==='completed'?'teal':''}">${status==='completed'?'Terminée':'En cours'}</span></div><p class="assignment-objective">${esc(assignment.objective)}</p>${assignment.summary&&assignment.summary!==assignment.outcome?`<p class="assignment-summary">${esc(assignment.summary)}</p>`:''}${assignment.outcome?`<p class="assignment-outcome">${esc(assignment.outcome)}</p>`:''}</article>`).join('')}</section>`;
  }).join('');
}
function codexContents(){
  const entries=getCodexEntries(state,ui.codexQuery);
  if(!entries.some(entry=>entry.id===ui.codex))ui.codex=entries[0]?.id||null;
  const entry=entries.find(item=>item.id===ui.codex);
  if(!entry)return `<p class="codex-empty" role="status">${ui.codexQuery?'Aucun dossier ne correspond à cette recherche.':'Aucune archive disponible.'}</p>`;
  return `<div class="codex-layout"><nav class="codex-list" aria-label="Dossiers du codex">${entries.map(item=>`<button class="codex-item ${item.id===ui.codex?'active':''}" data-do="codex-entry" data-id="${esc(item.id)}" aria-pressed="${item.id===ui.codex}">${esc(item.name)}</button>`).join('')}</nav><article class="codex-article"><span class="eyebrow">${esc(entry.category)}</span><h3>${esc(entry.name)}</h3><p>${esc(entry.text)}</p></article></div>`;
}
function codexScreen(){
  return screen('Codex','Archives de l’Alliance',`<label class="field codex-search" for="codex-search"><span>Rechercher dans le codex</span><input type="search" id="codex-search" value="${esc(ui.codexQuery)}" placeholder="Nom, catégorie ou sujet" autocomplete="off"></label><div id="codex-results">${codexContents()}</div>`);
}
function settingsScreen(){const s=state?.settings||{sound:true,volume:.35,reducedMotion:false,largeText:false};return screen('Options','Affichage · audio · rythme',`<div class="setting-row"><label for="sound-setting">Ambiances et effets<small>Synthèse sonore originale</small></label><input id="sound-setting" type="checkbox" ${s.sound?'checked':''}></div><div class="setting-row"><label for="volume-setting">Volume général</label><input id="volume-setting" type="range" min="0" max="1" step=".05" value="${s.volume}"></div><div class="setting-row"><label for="motion-setting">Réduire les transitions</label><input id="motion-setting" type="checkbox" ${s.reducedMotion?'checked':''}></div><div class="setting-row"><label for="text-setting">Texte agrandi</label><input id="text-setting" type="checkbox" ${s.largeText?'checked':''}></div>${state?`<div class="setting-row"><label for="mode-setting">Jauges ATB<small>Le mode Attente suspend le temps lorsqu’un allié est prêt.</small></label><select id="mode-setting"><option value="wait" ${state.mode==='wait'?'selected':''}>Attente</option><option value="active" ${state.mode==='active'?'selected':''}>Actif</option></select></div><div class="setting-row"><label for="difficulty-setting">Difficulté<small>Appliquée aux prochains combats.</small></label><select id="difficulty-setting"><option value="story" ${state.difficulty==='story'?'selected':''}>Histoire</option><option value="normal" ${state.difficulty==='normal'?'selected':''}>Vétéran</option><option value="hard" ${state.difficulty==='hard'?'selected':''}>Difficile</option></select></div>`:''}<div class="setting-row"><label>Plein écran<small>F11 dans l’application PC</small></label><button class="secondary" data-do="fullscreen">Basculer</button></div>`);}
function dialogueScreen(){
  const d=ui.dialogue;if(!d)return '';
  return `<div class="dialogue" role="dialog" aria-label="Dialogue" ${d.operationId?`data-operation-id="${esc(d.operationId)}" data-step-id="${esc(d.stepId)}"`: ''} ${d.assignmentContact?`data-assignment-contact="${esc(d.assignmentContact)}"`:''} ${d.assignmentId?`data-assignment-id="${esc(d.assignmentId)}"`:''} ${d.conversationId?`data-conversation-id="${esc(d.conversationId)}"`:''} ${d.topicId?`data-current-topic="${esc(d.topicId)}"`:''} ${d.replyId?`data-selected-reply="${esc(d.replyId)}"`:''}><div class="dialogue-portrait ${d.portrait?'':'generic'}" style="${d.portrait?portraitStyle(d.portrait):''}">${d.portrait?'':'◇'}</div><div class="dialogue-body"><div class="speaker">${esc(d.speaker)}</div><p class="dialogue-text">${esc(d.text)}</p>${d.rememberedReply?`<p class="dialogue-note">Votre réponse : ${esc(d.rememberedReply)}</p>`:''}<div class="dialogue-choices">${d.choices.map((choice,index)=>`<button class="choice ${choice.tone||''}" data-do="dialogue-choice" data-index="${index}" ${choice.disabled?'disabled':''} ${choice.operationChoice?`data-operation-choice="${esc(choice.operationChoice)}"`:''} ${choice.topicId?`data-topic-id="${esc(choice.topicId)}"`:''} ${choice.replyId?`data-reply-id="${esc(choice.replyId)}"`:''} ${choice.conversationBack?'data-conversation-back':''} ${choice.conversationEnd?'data-conversation-end':''} ${choice.assignmentChoice?`data-assignment-choice="${esc(choice.assignmentChoice)}"`:''} ${choice.assignmentEnd?'data-assignment-end':''} ${choice.assignmentBack?'data-assignment-back':''}>${esc(choice.label)}${choice.hint||choice.reason||choice.consequence?`<small>${esc(choice.reason||choice.hint||choice.consequence)}</small>`:''}</button>`).join('')}</div></div></div>`;
}
function localMapScreen(){return screen(WORLD_ZONES[state.zone].label,'Carte locale',renderLocalMap({bounds:world.getBounds(),position:world.getPosition(),pois:world.getInteractivePOIs(),objective:currentObjective(),tracked:ui.tracked,filter:ui.mapFilter,esc}));}
function victoryScreen(){
  const result=summarizeBattle(battle), operation=!!battlePOI?.operationId;
  return screen('Secteur sécurisé',CHAPTERS[state.zone]?.name||'Rapport de combat',`<p class="brief-copy">${esc(battlePOI.label)}. ${operation?'Cette étape est sécurisée. Les récompenses de l’assignation seront accordées lors de son compte rendu.':'Le commando peut poursuivre sa progression.'}</p><div class="ending-grid">${operation?'':`<div class="ending-stat"><strong>+65</strong><span>EXPÉRIENCE</span></div><div class="ending-stat"><strong>+85</strong><span>CRÉDITS</span></div>`}<div class="ending-stat"><strong>${result.defeatedEnemies}</strong><span>ADVERSAIRES NEUTRALISÉS</span></div><div class="ending-stat"><strong>${result.actionCount}</strong><span>ACTIONS EXÉCUTÉES</span></div></div>`,`<span class="small">Le secteur restera sécurisé.</span><button class="primary" data-do="claim-victory">Poursuivre →</button>`,'pause-screen');
}
function choiceLabel(zone,value){const labels={'save':'Colonie protégée','force':'Colonie sacrifiée','release':'Reine rachni libérée','destroy':'Reine rachni détruite','save-kaidan':'Kaidan sauvé','save-ashley':'Ashley sauvée','save-council':'Conseil secouru','focus-sovereign':'Flotte concentrée sur Sovereign'};return labels[value]||value;}
function endingScreen(){return screen('Le prochain cycle vous appartient','Fin de cette chronique',`<span class="eyebrow">${commanderRank()} ${esc(state.name)}</span><h3 style="font-size:35px;font-weight:350;margin:15px 0 22px">La menace a un nom.</h3><p class="brief-copy">Saren est arrêté. La Citadelle survit à l’assaut. Votre commando a porté la vérité au-delà des relais, et les décisions prises pendant l’enquête ont marqué la galaxie.</p><div class="ending-grid"><div class="ending-stat"><strong>${state.completed.length}</strong><span>ÉTAPES ACCOMPLIES</span></div><div class="ending-stat"><strong>${state.cleared.length}</strong><span>RENCONTRES REMPORTÉES</span></div></div>${['feros','noveria','virmire','citadel-finale'].map(z=>`<div class="journal-entry"><h3>${CHAPTERS[z].name}</h3><p>${esc(choiceLabel(z,state.choices[z]||''))}</p></div>`).join('')}<p class="small" style="margin-top:20px">Votre sauvegarde conserve les choix de cette campagne condensée. Le registre de production documente les scènes et contenus restant à développer pour une adaptation intégrale.</p>`,`<button class="secondary" data-do="export">Exporter le parcours</button><button class="primary" data-do="return-normandy">Retrouver le Normandy →</button>`);}

function speak(speaker,text,choices=[{label:'Poursuivre',run:()=>closeScreen()}],portrait=null,context={}){portrait ||= /Anderson/.test(speaker)?'anderson':/Joker/.test(speaker)?'joker':/Chakwas/.test(speaker)?'chakwas':null;ui.dialogue={speaker,text,choices,portrait,...context};openScreen('dialogue');audio.play('dialogue');}
function interactOperation(poi){
  const interaction=getOperationInteraction(state,poi.operationId,poi.stepId);
  if(!interaction?.ok)return toast(interaction?.reason||'Cette étape est indisponible.',true);
  const choices=interaction.choices.map(choice=>({...choice,operationChoice:choice.id,run:()=>{
    if(choice.disabled)return;
    const result=advanceOperation(state,poi.operationId,poi.stepId,choice.id);
    if(!result.ok)return toast(result.reason||'Cette action est indisponible.',true);
    closeScreen();
    if(result.cancelled)return;
    state.trackedOperation=result.completed?null:poi.operationId;ui.tracked=null;
    refreshOperations();autosave();
    if(result.battle)startEncounter({...poi,type:'operation'});
    else toast(result.message|| (result.completed?'Assignation terminée.':'Objectif mis à jour.'));
  }}));
  speak(interaction.speaker,interaction.text,choices,interaction.portrait||null,{operationId:poi.operationId,stepId:poi.stepId});
}
function showAssignmentConversation(contactId){
  const contact=getAssignmentContacts(state).find(item=>item.id===contactId),conversation=getAssignmentConversation(state,contactId);
  if(!contact||!conversation)return toast('Cette personne n’est pas disponible pour le moment.');
  const context={assignmentContact:contactId,assignmentId:contact.assignmentId};
  const portrait=conversation.portrait||null;
  const choices=conversation.choices.map(choice=>({label:choice.label,assignmentChoice:choice.id,assignmentEnd:choice.id==='leave',run:()=>showAssignmentReply(contactId,choice.id,{...context,speaker:conversation.speaker,portrait})}));
  if(!conversation.choices.some(choice=>choice.id==='leave'))choices.push({label:'Reprendre la mission.',assignmentEnd:true,run:()=>closeScreen()});
  speak(conversation.speaker,conversation.text,choices,portrait,context);
}
function showAssignmentReply(contactId,choiceId,context){
  const result=chooseAssignmentReply(state,contactId,choiceId);
  if(!result.ok)return toast(result.reason||'Cette réponse n’est pas disponible pour le moment.',true);
  syncStoryContext();refreshOperations();autosave();
  if(choiceId==='leave'){closeScreen();return;}
  const choices=[{label:'Continuer.',assignmentEnd:true,run:()=>closeScreen()}];
  if(getAssignmentConversation(state,contactId))choices.push({label:'Reparler.',assignmentBack:true,run:()=>showAssignmentConversation(contactId)});
  speak(context.speaker,result.response||'Votre échange est terminé.',choices,context.portrait,{assignmentContact:contactId,assignmentId:context.assignmentId});
}
function showConversation(id){
  const conversation=getConversation(state,id);
  if(!conversation)return toast('Cette personne n’est pas disponible pour le moment.');
  const choices=conversation.topics.map(topic=>({label:topic.label,topicId:topic.id,run:()=>showConversationTopic(id,topic.id)}));
  choices.push({label:'Reprendre la mission.',conversationEnd:true,run:()=>closeScreen()});
  speak(conversation.speaker,'De quoi souhaitez-vous parler ?',choices,conversation.portrait,{conversationId:id});
}
function showConversationTopic(id,topicId){
  const conversation=getConversation(state,id);
  if(!conversation)return toast('Cette personne n’est pas disponible pour le moment.');
  const result=readTopic(state,id,topicId);
  if(!result.ok)return toast('Ce sujet n’est pas disponible pour le moment.');
  autosave();
  const topic=result.topic,savedId=state.story.choices[`${id}:${topicId}`],remembered=topic.choices?.find(reply=>reply.id===savedId);
  const choices=remembered?[]:(topic.choices||[]).map(reply=>({label:reply.label,replyId:reply.id,run:()=>showConversationReply(id,topicId,reply.id)}));
  choices.push({label:'Retour aux sujets.',conversationBack:true,run:()=>showConversation(id)});
  const text=remembered?`${topic.text}\n\n${remembered.response}`:topic.text;
  speak(conversation.speaker,text,choices,conversation.portrait,{conversationId:id,topicId,replyId:remembered?.id,rememberedReply:remembered?.label});
}
function showConversationReply(id,topicId,replyId){
  const conversation=getConversation(state,id);
  if(!conversation)return toast('Cette personne n’est pas disponible pour le moment.');
  const result=chooseReply(state,id,topicId,replyId);
  if(!result.ok)return toast(result.reason||'Cette réponse n’est pas disponible pour le moment.',true);
  autosave();
  const selected=conversation.topics.find(topic=>topic.id===topicId)?.choices?.find(reply=>reply.id===replyId);
  speak(conversation.speaker,result.response,[{label:'Retour aux sujets.',conversationBack:true,run:()=>showConversation(id)}],conversation.portrait,{conversationId:id,topicId,replyId,rememberedReply:selected?.label});
}
function currentObjective(){if(!state)return '';const followed=listOperations(state).find(item=>item.id===state.trackedOperation);if(followed&&!['completed','unavailable'].includes(followed.status))return `${followed.name} · ${followed.blockedReason||followed.currentStep?.label||followed.description}`;if(state.zone==='normandy')return !state.flags.briefed?'Rejoindre le briefing de mission.':'Préparer le commando, puis choisir une destination sur la carte galactique.';if(state.completed.includes(state.zone))return 'Mission accomplie. Rejoignez le point d’extraction.';return CHAPTERS[state.zone]?.objective||'';}
function renderHUD(){if(!running||!state)return;const chapter=CHAPTERS[state.zone];const nearby=!ui.screen&&!battle?world.getNearby():null;const signature=[state.zone,state.name,state.classId,state.appearance,state.party.join(','),state.completed.join(','),state.cleared.join(','),state.flags.briefed,nearby?.id,!!battle,battle?.waiting,battle?.log.slice(-3).join('|'),ui.tracked].join('~');if(signature===hudStamp){if(!battle&&$('.minimap'))$('.minimap').innerHTML=minimapSVG();return;}hudStamp=signature;$('#hud').innerHTML=`<div class="hud-top"><div class="location"><div class="eyebrow">${state.zone==='normandy'?'SSV · ALLIANCE':`MISSION ${chapter?.number||''}`}</div><h2>${esc(WORLD_ZONES[state.zone].label)}</h2><div class="sub">${esc(chapter?.subtitle||'Centre d’information et de combat')}</div></div><nav class="hud-nav"><button class="icon-button" data-do="journal" ${battle?'disabled':''}><b>J</b> Journal</button><button class="icon-button" data-do="squad" ${battle?'disabled':''}><b>C</b> Commando</button><button class="icon-button" data-do="equipment" ${battle?'disabled':''}><b>I</b> Équipement</button><button class="icon-button" data-do="map" ${battle?'disabled':''}><b>M</b> Carte</button><button class="icon-button" data-do="pause"><b>Ⅱ</b> Pause</button></nav></div>${!battle?`<div class="mission-chip"><div class="eyebrow">${state.completed.includes(state.zone)?'Rapport transmis':'Objectif de mission'}</div><p>${esc(currentObjective())}</p><div class="steps">${zoneEncounters(state.zone).map(id=>`<i class="step ${state.cleared.includes(id)?'done':''}"></i>`).join('')}</div></div><div class="minimap">${minimapSVG()}</div><div class="explore-party">${state.party.map(id=>`<button class="mini-member" data-do="squad"><span>${esc(id==='shepard'?state.name:CREW[id].name)}</span><small>${id==='shepard'?CLASSES[state.classId].name:CREW[id].role}</small></button>`).join('')}</div>${nearby?`<button class="interaction" data-do="interact"><kbd>E</kbd><span>${esc(nearby.label)}</span></button>`:''}<div class="controls-hint">ZQSD / WASD · DÉPLACEMENT<br>E · INTERAGIR &nbsp; MAJ · COURIR<br>CLIC · REJOINDRE UN POINT</div><div class="mobile-pad"><button class="up" data-key="ArrowUp">↑</button><button class="left" data-key="ArrowLeft">←</button><button class="down" data-key="ArrowDown">↓</button><button class="right" data-key="ArrowRight">→</button></div>`:`<div class="combat-badge">${esc(battlePOI?.label||'Contact hostile')} · ${battle.waiting?'EN ATTENTE D’ORDRES':'JAUGES ACTIVES'}</div><div class="combat-log">${battle.log.slice(-3).map(l=>`<p>${esc(l)}</p>`).join('')}</div>`}`;}
function minimapSVG(){const b=world.getBounds(),p=world.getPosition();const x=v=>12+(v-b.minX)/(b.maxX-b.minX)*126,z=v=>12+(v-b.minZ)/(b.maxZ-b.minZ)*126;return `<svg viewBox="0 0 150 150" aria-label="Radar"><path d="M12 75H138M75 12V138" stroke="#81ddd418"/><rect x="12" y="12" width="126" height="126" fill="none" stroke="#81ddd433"/>${world.getInteractivePOIs().filter(o=>!o.cleared).map(o=>`<circle cx="${x(o.x)}" cy="${z(o.z)}" r="${ui.tracked===o.id?4:2.6}" fill="${o.type==='encounter'?'#df8174':o.type==='objective'?'#dcbe8c':'#81ddd4'}"/>`).join('')}<circle cx="${x(p.x)}" cy="${z(p.z)}" r="3.5" fill="#fff"/><circle cx="${x(p.x)}" cy="${z(p.z)}" r="8" fill="none" stroke="#fff5"/></svg>`;}

async function loadZone(zone,{resume=false}={}){if(!state||!WORLD_ZONES[zone]||!unlockedZones(state).includes(zone)){toast('Destination indisponible.',true);return;}ui.busy=true;ui.screen=null;$('#overlay').innerHTML='';$('#transition h2').textContent=WORLD_ZONES[zone].label;$('#transition').classList.add('active');syncMode();const position=resume?state.position:null;await new Promise(r=>setTimeout(r,state.settings.reducedMotion?0:280));state.zone=zone;recordVisit(state,zone);world.setCommanderAppearance(state.appearance);world.setCommanderCustomization(state.customization);syncStoryContext();world.setZone(zone,{party:state.party,cleared:state.cleared});if(position)world.setPosition(position);refreshOperations();state.position=world.getPosition();audio.setZone(zone);ui.busy=false;$('#transition').classList.remove('active');syncMode();renderHUD();autosave();}
function beginGame(){const preferences=state?.settings;state=newGame(ui.form);if(ui.form.initialEquipment){const draft=createCustomizationDraft(state);draft.equipment={...ui.form.initialEquipment};commitCustomization(state,draft);}ui.codex=null;ui.codexQuery='';ui.journalTab='missions';ui.tracked=null;if(preferences)state.settings={...preferences};running=true;battle=null;battlePOI=null;$('#battle-ui').innerHTML='';ui.screen=null;audio.unlock();applySettings();loadZone('normandy').then(()=>speak('Capitaine Anderson','Nous approchons d’Eden Prime. Rejoignez le briefing avant la descente. Préparez votre équipe, puis consultez la carte galactique.',[{label:'Je rejoins le briefing.',run:()=>closeScreen()}]));}
function continueGame(s=loadFrom(localStorage)){if(!s){toast('Aucune sauvegarde valide.',true);return;}state=s;ui.codex=null;ui.codexQuery='';ui.journalTab='missions';ui.tracked=null;running=true;battle=null;battlePOI=null;$('#battle-ui').innerHTML='';ui.screen=null;world.setBattle(null);audio.unlock();applySettings();loadZone(state.zone,{resume:true});}

function interactPOI(poi){if(!poi||!running||battle||ui.screen||ui.busy)return;audio.play('ui');const zone=state.zone;
  if(poi.operationId)return interactOperation(poi);
  if(poi.assignmentContactId)return showAssignmentConversation(poi.assignmentContactId);
  if(poi.conversationId)return showConversation(poi.conversationId);
  if(zone==='normandy'){
    const key=poi.id.split(':')[1];
    if(key==='briefing')return speak('Capitaine Anderson',state.flags.briefed?'Votre dossier est prêt. Les destinations accessibles sont répertoriées sur la carte galactique.':'Une balise prothéenne a été découverte sur Eden Prime. Kaidan et Jenkins vous accompagneront au sol. La priorité est de sécuriser la récupération.',[{label:state.flags.briefed?'Ouvrir la carte galactique.':'Mission comprise. Préparons la descente.',run:()=>{state.flags.briefed=true;autosave();ui.planet=unlockedZones(state).find(z=>z!=='normandy'&&!state.completed.includes(z))||'citadel';openScreen('galaxy');}}]);
    if(key==='galaxy'||key==='exit'){if(!state.flags.briefed)return toast('Le capitaine vous attend au briefing.');ui.planet=unlockedZones(state).find(z=>z!=='normandy'&&!state.completed.includes(z))||'citadel';return openScreen('galaxy');}
    if(key==='crew'){ui.selectedCrew=state.party.slice(1);return openScreen('squad');}
    if(key==='equipment'){ui.equipmentActor='shepard';return openScreen('equipment');}
    if(key==='archive')return openScreen('codex');
    if(key==='medbay'){if(!state.collected.includes('normandy:medbay-restock')){state.medigel=Math.min(9,state.medigel+2);state.collected.push('normandy:medbay-restock');autosave();}return speak('Dr Chakwas','Votre réserve de médi-gel est prête. Prenez le temps d’examiner votre équipement avant de repartir.',[{label:'Merci, docteur.',run:()=>closeScreen()}]);}
  }
  if(poi.id.endsWith(':exit'))return speak('Joker','La zone d’extraction est prête. Rejoignons le Normandy.',[{label:'Extraction.',run:()=>loadZone('normandy')},{label:'Nous poursuivons l’exploration.',run:()=>closeScreen()}]);
  if(poi.id.endsWith(':arrival'))return speak(zone==='citadel'?'Capitaine Anderson':'Rapport du commando',CHAPTERS[zone].briefing,[{label:'Poursuivre la mission.',run:()=>closeScreen()}]);
  if(poi.id.endsWith(':cache')){
    if(zone==='citadel'){ui.equipmentActor='shepard';return openScreen('equipment');}
    if(!state.collected.includes(poi.id)){state.collected.push(poi.id);state.credits+=100;state.medigel=Math.min(9,state.medigel+1);addLog(state,'Ravitaillement',`${CHAPTERS[zone].name} : +100 crédits, une dose de médi-gel et des données récupérées.`);autosave();toast('+100 crédits · +1 médi-gel');}
    return speak('Terminal de terrain','Les données du secteur ont été copiées dans votre dossier. Les ressources disponibles ont été ajoutées à la réserve du commando.',[{label:'Consulter le codex.',run:()=>openScreen('codex')},{label:'Retour sur le terrain.',run:()=>closeScreen()}]);
  }
  if(zone==='citadel'&&['encounter-1','encounter-2','boss'].some(s=>poi.id.endsWith(s))){
    const id=poi.id.endsWith('encounter-1')?'garrus':poi.id.endsWith('encounter-2')?'tali':'wrex';
    const texts={garrus:'Les procédures du SSC ralentissent l’enquête. Si vous comptez réellement poursuivre Saren, je veux être du voyage.',tali:'J’ai obtenu un enregistrement lié aux geth et à Saren. Ces preuves doivent parvenir au Conseil. Je peux aussi vous aider à comprendre leurs systèmes.',wrex:'Saren est au centre de beaucoup trop d’affaires. Si votre mission vous conduit jusqu’à lui, nous avons un intérêt commun.'};
    const joined=state.recruited.includes(id);
    const choices=[{label:joined?'À bientôt.':'Bienvenue dans le commando.',run:()=>{if(!joined){recruit(state,id);syncStoryContext();refreshOperations();world.setParty(state.party);}autosave();closeScreen();}}];
    if(!joined&&id!=='tali')choices.push({label:'Nous en reparlerons plus tard.',run:()=>closeScreen()});
    return speak(CREW[id].name,joined?'Retrouvez-moi à bord du Normandy pour préparer la prochaine mission.':texts[id],choices,id);
  }
  if(poi.type==='objective')return finishObjective();
}
function finishObjective(){const zone=state.zone;if(state.completed.includes(zone))return toast('Objectif déjà accompli. Le Normandy vous attend.');if(!objectiveReady(state,zone))return toast(zone==='citadel'?'Rencontrez Tali et recueillez ses preuves avant l’audience.':'Sécurisez les trois secteurs avant de poursuivre.',true);
  const finish=choice=>{if(!completeZone(state,zone,choice))return;world.setCommanderAppearance(state.appearance);syncStoryContext();refreshOperations();world.setParty(state.party);autosave();audio.play('win');if(state.ending)return openScreen('ending');const texts={
    'eden-prime':'La balise s’active au contact de Shepard. Des images fragmentées laissent entrevoir une menace ancienne. Le Normandy fait route vers la Citadelle.',
    citadel:'Les preuves sont entendues. Vous obtenez le statut de Spectre et le commandement de l’enquête. Therum, Feros et Noveria sont désormais accessibles.',
    therum:'Liara est libérée. Son expertise des Prothéens peut aider à interpréter la vision. Elle rejoint le Normandy.',
    feros:choice==='save'?'La colonie est libérée de l’influence du Thorien. Les survivants peuvent commencer à reconstruire.':'La menace est neutralisée, au prix de lourdes pertes parmi les colons.',
    noveria:choice==='release'?'La reine rachni est libérée. Votre décision aura un écho bien au-delà de Noveria.':'La reine rachni est détruite. Le dossier de Pic 15 est clos.',
    virmire:choice==='save-kaidan'?'Kaidan a été extrait. Ashley reste sur Virmire. Son sacrifice ne sera pas oublié.':'Ashley a été extraite. Kaidan reste sur Virmire. Son sacrifice ne sera pas oublié.',
    ilos:'Vigil révèle la fonction du Conduit. L’accès à la Citadelle est ouvert : il reste une dernière chance d’arrêter Saren.'};
    const support=operationEffects(state);if(zone==='feros')texts.feros+=` Services de la colonie rétablis : ${support.colonySupport}/3.${support.researchRecovered?' Les données de Gavin Hossle ont été récupérées.':''}`;
    speak('Rapport de mission',texts[zone],[{label:zone==='ilos'?'Emprunter le Conduit.':'Retourner au Normandy.',run:()=>loadZone(zone==='ilos'?'citadel-finale':'normandy')}],zone==='therum'?'liara':null);
  };
  if(zone==='ilos')return speak('Vigil · le Conduit','Le Conduit mène à la confrontation finale. Les opérations de terrain inachevées de votre journal seront fermées après ce passage.',[{label:'Emprunter le Conduit et poursuivre la mission.',run:()=>finish()},{label:'Revenir à l’exploration.',run:()=>closeScreen()}]);
  if(zone==='feros')return speak('Le sort de Zhu’s Hope','Le lien du Thorien est brisé. Votre rapport doit préciser les mesures prises pour protéger la colonie.',[{label:'Préserver les colons et organiser les secours.',tone:'paragon',run:()=>finish('save')},{label:'Privilégier la neutralisation à tout prix.',tone:'renegade',run:()=>finish('force')}]);
  if(zone==='noveria')return speak('La reine rachni','La reine est à votre merci. Elle demande à quitter cet endroit. C’est à vous de décider si elle doit vivre.',[{label:'La libérer.',tone:'paragon',run:()=>finish('release')},{label:'La détruire.',tone:'renegade',run:()=>finish('destroy')}]);
  if(zone==='virmire')return speak('Joker · canal d’urgence','Le Normandy ne peut effectuer qu’une seule extraction. Kaidan et Ashley sont séparés. Vous devez choisir qui rejoindre.',[{label:'Rejoindre Kaidan.',run:()=>finish('save-kaidan')},{label:'Rejoindre Ashley.',run:()=>finish('save-ashley')}]);
  if(zone==='citadel-finale')return speak('Commandement de l’Alliance','Saren est arrêté. La flotte demande vos ordres. Le vaisseau du Conseil est en difficulté tandis que Sovereign concentre les tirs.',[{label:'Secourir le Conseil.',tone:'paragon',run:()=>finish('save-council')},{label:'Concentrer la flotte sur Sovereign.',tone:'renegade',run:()=>finish('focus-sovereign')}]);
  speak(zone==='therum'?'Liara T’Soni':zone==='ilos'?'Vigil':zone==='citadel'?'Conseil de la Citadelle':'Rapport du commando',zone==='therum'?'Le système de confinement peut enfin être désactivé. Liara est prête à quitter les ruines.':zone==='ilos'?'Les dernières archives prothéennes expliquent le rôle du Conduit. Votre prochain passage vous mènera au cœur de la Citadelle.':zone==='citadel'?'Les preuves remettent en cause Saren. Le Conseil vous accorde les moyens de poursuivre votre enquête.':'La balise est accessible. Le commando sécurise les abords du site.',[{label:'Poursuivre.',run:()=>finish()}],zone==='therum'?'liara':null);
}

function startEncounter(poi){
  if(!poi||!running||battle||ui.screen||ui.busy)return;
  const operation=poi.operationId?getOperationEncounter(state,poi.operationId,poi.stepId):null;
  const allowed=poi.operationId?{ok:!!operation,reason:'Ce combat annexe doit être engagé depuis son dialogue.'}:canStartEncounter(state,poi.id);
  if(!allowed.ok)return toast(allowed.reason,true);
  if(!poi.operationId&&poi.id==='feros:boss'&&!poi.confirmed){
    const unfinished=listOperations(state).filter(item=>(item.id==='feros-geth-tunnels'||item.id==='feros-data-recovery'&&item.stage<3)&&item.status==='active');
    if(unfinished.length)return speak('Point de non-retour · ExoGeni','Affronter le Thorien ferme l’accès aux objectifs encore inachevés dans les tunnels et au terminal d’ExoGeni. Vous pouvez revenir les terminer avant de poursuivre.',[{label:'Vérifier les assignations.',run:()=>{ui.journalTab='assignments';openScreen('journal');}},{label:'Poursuivre vers le Thorien.',run:()=>{closeScreen();startEncounter({...poi,confirmed:true});}}]);
  }
  battlePOI=poi;state.position=world.getPosition();autosave();
  battle=createBattle({party:state.party.map(id=>actorFor(id,state)),enemies:operation?operation.enemies:enemiesFor(state.zone,encounterIndex(poi.id),state),difficulty:state.difficulty,mode:state.mode,seed:state.cleared.length+2183,medigel:state.medigel});
  ui.actor='shepard';ui.action='shoot';ui.selectedTarget=battle.actors.find(a=>a.team==='enemy')?.id;lastBattleEvent=0;combatStamp='';world.setBattle(battle);world.setMode('combat');audio.setZone('combat');renderCombat(true);renderHUD();
}
function renderCombat(force=false){if(!battle){$('#battle-ui').innerHTML='';return;}const party=battle.actors.filter(a=>a.team==='party');let actor=party.find(a=>a.id===ui.actor);const ready=party.filter(a=>a.hp>0&&a.atb>=99.999&&!['stasis','lift','singularity','stagger'].some(s=>a.statuses[s]>0));if((!actor||actor.hp<=0||actor.atb<99.999)&&ready.length){actor=ready[0];ui.actor=actor.id;}actor ||= party[0];const actions=getActions(battle,actor.id);if(!actions.some(a=>a.id===ui.action))ui.action='shoot';const chosen=actions.find(a=>a.id===ui.action)||actions[0];const targets=battle.actors.filter(a=>(chosen?.target==='ally'||chosen?.target==='allies'?a.team==='party':a.team==='enemy'));const stamp=[ui.actor,ui.action,...actions.map(a=>`${a.id}:${a.available}:${Math.ceil(a.cooldownRemaining||0)}`),...battle.actors.map(a=>`${a.id}:${a.hp>0}`)].join('|');
  if(force||stamp!==combatStamp){combatStamp=stamp;$('#battle-ui').innerHTML=`<div class="battle-shell"><div class="party-list">${party.map((a,i)=>`<button id="combat-${a.id}" class="battle-member ${a.id===actor.id?'active':''}" data-do="battle-actor" data-id="${a.id}"><span class="member-key">${i+1}</span><div><div class="member-title"><span>${esc(a.name)}</span><small data-stat="hp-label"></small></div><div class="bar"><span class="shield-fill" data-stat="shield"></span></div><div class="bar"><span class="hp-fill" data-stat="hp"></span></div><div class="bar"><span class="atb-fill" data-stat="atb"></span></div></div></button>`).join('')}</div><div class="actions-panel"><div class="battle-status"><h3>${esc(actor.name)}</h3><span id="heat-label"></span></div><div class="bar" style="margin-bottom:10px"><span id="heat-meter" class="heat-fill"></span></div><div class="action-grid">${actions.map(a=>`<button class="action-button ${a.id===ui.action?'selected':''}" data-do="battle-action" data-id="${a.id}" ${!a.available?'disabled':''} title="${esc(a.reason||a.description)}">${a.label}${a.cooldownRemaining>0?`<small>${Math.ceil(a.cooldownRemaining)} s</small>`:''}</button>`).join('')}</div><div class="action-help">${esc(chosen?.reason||chosen?.description||'Attendez la jauge ATB.')} ${chosen?.available&&['enemy','ally','enemies'].includes(chosen.target)?'Choisissez une cible.':''}</div></div><div class="target-list">${targets.map(a=>`<button id="target-${a.id}" class="target ${ui.selectedTarget===a.id?'selected':''}" data-do="battle-target" data-id="${a.id}" ${a.hp<=0?'disabled':''}><span>${esc(a.name)}</span><div class="bar"><span class="shield-fill" data-stat="shield"></span></div><div class="bar"><span class="hp-fill" data-stat="hp"></span></div><small data-stat="status" class="small"></small></button>`).join('')}</div></div>`;}
  for(const a of battle.actors){for(const prefix of ['combat','target']){const el=document.getElementById(`${prefix}-${a.id}`);if(!el)continue;for(const [k,max]of [['hp',a.maxHp],['shield',a.maxShield],['atb',100]]){const meter=el.querySelector(`[data-stat="${k}"]`);if(meter)meter.style.width=pct(a[k],max)+'%';}const label=el.querySelector('[data-stat="hp-label"]');if(label)label.textContent=`${Math.ceil(a.hp)} / ${a.maxHp}`;const status=el.querySelector('[data-stat="status"]');if(status)status.textContent=a.hp<=0?'Neutralisé':a.statuses.stasis>0?'Stase · protégé':a.statuses.hacked>0?'Piraté':a.cover?'À couvert':a.boss?'Menace majeure':'';el.classList.toggle('ready',a.atb>=99.999);}}
  if($('#heat-label'))$('#heat-label').textContent=`CHALEUR ${Math.round(actor.heat)} % · MÉDI-GEL ${battle.medigel}`;if($('#heat-meter'))$('#heat-meter').style.width=pct(actor.heat,100)+'%';
}
function issueAction(targetId){if(!battle||ui.screen)return;const result=performAction(battle,{actorId:ui.actor,actionId:ui.action,targetId});if(!result.ok)return toast(result.reason,true);ui.selectedTarget=targetId;drainEvents();renderCombat(true);renderHUD();}
function drainEvents(){while(battle&&lastBattleEvent<battle.events.length){const event=battle.events[lastBattleEvent++];if(['action','damage','heal','blocked'].includes(event.type))world.playEvent(event);if(event.type==='action')audio.play(event);}if(battle)world.setBattle(battle);}
function finishBattle(){if(!battle||ui.screen)return;audio.play(battle.winner==='party'?'win':'lose');openScreen(battle.winner==='party'?'victory':'defeat');}
function claimVictory(){
  if(!battle||battle.winner!=='party'||!battlePOI)return false;
  const poi=battlePOI,id=poi.id,previousMedigel=state.medigel;
  state.medigel=battle.medigel;
  const won=poi.operationId?finishOperationBattle(state,poi.operationId,poi.stepId,true):winEncounter(state,id);
  if(won===false||won?.ok===false){state.medigel=previousMedigel;return false;}
  battle=null;battlePOI=null;world.setBattle(null);world.setCommanderAppearance(state.appearance);syncStoryContext();world.setParty(state.party);world.setCleared(state.cleared);refreshOperations();$('#battle-ui').innerHTML='';closeScreen();audio.setZone(state.zone);autosave();
  if(id==='eden-prime:encounter-1')speak('Kaidan Alenko','Jenkins n’a pas survécu à la première attaque. Nous avons retrouvé Ashley Williams, isolée de sa garnison. Elle nous accompagnera jusqu’au site de fouilles.',[{label:'Nous devons poursuivre.',run:()=>closeScreen()}],'kaidan');else toast(poi.operationId?'Étape sécurisée · journal mis à jour.':'Secteur sécurisé · progression sauvegardée.');
  return true;
}

document.addEventListener('click',event=>{const button=event.target.closest('[data-do]');if(!button||button.disabled)return;const action=button.dataset.do,id=button.dataset.id;audio.unlock();
  switch(action){
    case 'chronicles':openChronicles();break;
    case 'chronicle-back':closeChronicles();break;
    case 'universe-tab':if(['references','session','reading'].includes(id)&&!(id==='reading'&&chronicleBattle&&!chronicleBattle.winner)){universeUI.tab=id;if(chronicleBattle&&!chronicleBattle.winner)chroniclePaused=true;if(id==='reading'&&chronicleSession&&universeUI.readingId)readChroniclePage();else renderScreen();}break;
    case 'universe-group':if(['all','actors','equipment','powers','story'].includes(id)){universeUI.group=id;universeUI.visibleCount=30;renderScreen();}break;
    case 'universe-record':universeUI.recordId=id;renderScreen();break;
    case 'universe-more':universeUI.visibleCount+=30;renderScreen();break;
    case 'chronicle-start':prepareChronicle();break;
    case 'chronicle-load':loadPreparedChronicle();break;
    case 'chronicle-reading-open':readChroniclePage();break;
    case 'chronicle-page':readChroniclePage(Number(button.dataset.index));break;
    case 'chronicle-save':if(chronicleSession){persistChronicle('Chronique enregistrée.');renderScreen();}break;
    case 'chronicle-import':if(!chronicleBattle||chronicleBattle.winner)$('#chronicle-import').click();break;
    case 'chronicle-export':exportChronicle();break;
    case 'chronicle-party':if(chronicleSession&&!chronicleBattle){const party=chronicleSession.party.includes(id)?chronicleSession.party.filter(actorId=>actorId!==id):[...chronicleSession.party,id];acceptChronicle(universeModules.engine.setChronicleParty(chronicleSession,party),'Groupe enregistré.');}break;
    case 'chronicle-battle':launchChronicleBattle();break;
    case 'chronicle-actor':if(chronicleBattle?.actors.some(actor=>actor.id===id&&actor.team==='party'&&!isSummon(actor))){universeUI.actorId=id;renderChronicleCombat(true);}break;
    case 'chronicle-action':{if(!chronicleBattle||chroniclePaused)break;const selected=getActions(chronicleBattle,universeUI.actorId).find(action=>action.id===id);if(!selected?.available)break;universeUI.actionId=id;if(['self','allies'].includes(selected.target))issueChronicleAction(universeUI.actorId);else renderChronicleCombat(true);break;}
    case 'chronicle-target':issueChronicleAction(id);break;
    case 'chronicle-pause':chroniclePaused=!chroniclePaused;renderChronicleCombat(true);break;
    case 'chronicle-preparation':chronicleBattle=null;chronicleStamp='';universeUI.feedback=null;renderScreen();break;
    case 'new': ui.form=newCommanderForm();openScreen('new');break;
    case 'class':ui.form.classId=id;renderScreen();break;
    case 'begin':beginGame();break;
    case 'continue':case 'load':continueGame();break;
    case 'close':if(ui.screen==='customization'){closeCustomization();break;}if(inChronicles()){closeChronicles();break;}if(!running){ui.screen='title';renderScreen();}else if(['dialogue','victory','defeat','ending'].includes(ui.screen)){}else closeScreen();break;
    case 'pause':openScreen('pause');break;
    case 'manual-saves':if(!battle&&!ui.busy){ui.manualReturn=running?'pause':'title';ui.manualNames={};ui.manualFeedback=null;ui.manualConfirmation=null;openScreen('saves');}break;
    case 'manual-save':requestManualSave(id);break;
    case 'manual-load':loadManualSave(id);break;
    case 'manual-delete':requestManualDelete(id);break;
    case 'manual-confirm':confirmManualAction();break;
    case 'manual-cancel':ui.manualConfirmation=null;ui.manualFeedback=null;renderScreen();break;
    case 'manual-back':ui.manualConfirmation=null;openScreen(ui.manualReturn);break;
    case 'dossier':if(running)openScreen('dossier');break;
    case 'dossier-back':openScreen(ui.previous==='squad'?'squad':'pause');break;
    case 'journal':if(!battle)openScreen('journal');break;
    case 'journal-tab':if(['missions','assignments','reports'].includes(id)){ui.journalTab=id;renderScreen();}break;
    case 'squad':if(!battle){ui.selectedCrew=state.party.slice(1);openScreen('squad');}break;
    case 'equipment':if(!battle){ui.equipmentActor='shepard';openScreen('equipment');}break;
    case 'customization':openCustomization();break;
    case 'customization-create':if(ui.screen==='new')openCustomization(true);break;
    case 'custom-tab':if(ui.screen==='customization'&&['character','armor','weapons'].includes(id)){ui.customTab=id;ui.customSlot=id==='armor'?'armor':'weapon';ui.customItem=ui.customizationDraft.equipment[ui.customSlot];refreshCustomization();$('.customization-screen .screen-body').scrollTop=0;$('.custom-controls').scrollTop=0;}break;
    case 'custom-slot':if(ui.screen==='customization'&&SLOTS.includes(id)){ui.customSlot=id;ui.customItem=ui.customizationDraft.equipment[id];refreshCustomization();}break;
    case 'custom-view':if(ui.screen==='customization'&&['front','right','back','left'].includes(id)){ui.customView=id;refreshCustomization();}break;
    case 'custom-compare':if(ui.screen==='customization'){ui.customCompare=!ui.customCompare;refreshCustomization();}break;
    case 'custom-show-all':if(ui.screen==='customization'){ui.customShowAll=!ui.customShowAll;refreshCustomization();}break;
    case 'custom-inspect':if(ui.screen==='customization'){ui.customItem=id;refreshCustomization();}break;
    case 'custom-appearance':if(ui.screen==='customization'&&['male','female'].includes(id)){
      const draft=ui.customizationDraft,oldDefault=initialCustomization(draft.appearance);if(JSON.stringify(draft.customization.face)===JSON.stringify(oldDefault.face))draft.customization.face=initialCustomization(id).face;
      draft.appearance=id;ui.customCompare=false;refreshCustomization();
    }break;
    case 'custom-choice':if(ui.screen==='customization'&&Object.hasOwn(CUSTOMIZATION_FIELDS,button.dataset.field)){
      const [group,key]=button.dataset.field.split('.'),draft=structuredClone(ui.customizationDraft);draft.customization[group][key]=id;
      const result=validateCustomizationDraft(customizationBase(),draft,{inCombat:!!battle});if(result.ok){ui.customizationDraft=draft;ui.customCompare=false;refreshCustomization();}else toast(result.reason,true);
    }break;
    case 'custom-equip':if(ui.screen==='customization'&&Object.hasOwn(ui.customizationDraft.equipment,button.dataset.slot)){
      const result=prepareCustomizationEquipment(customizationBase(),ui.customizationDraft,button.dataset.slot,id||null);if(result.ok){ui.customizationDraft=result.draft;ui.customItem=id||null;ui.customCompare=false;refreshCustomization();}else toast(result.reason,true);
    }break;
    case 'custom-reset':if(ui.screen==='customization'){ui.customizationDraft=createCustomizationDraft(customizationBase());ui.customCompare=false;ui.customItem=null;refreshCustomization();}break;
    case 'custom-cancel':if(ui.screen==='customization')closeCustomization();break;
    case 'custom-apply':applyCustomization();break;
    case 'eq-tab':if(['loadout','inventory','shop','calibrations'].includes(id)){ui.equipmentTab=id;renderScreen();}break;
    case 'eq-actor':ui.equipmentActor=id;renderScreen();break;
    case 'eq-kind':ui.equipmentKind=id;renderScreen();break;
    case 'eq-train':{if(battle||ui.busy)break;const result=trainArmor(state,ui.equipmentActor,button.dataset.weight);toast(result.ok?'Formation d’armure acquise.':result.reason,!result.ok);if(result.ok)autosave();renderScreen();renderHUD();break;}
    case 'eq-equip':case 'eq-unequip':case 'eq-buy':case 'eq-sell':{
      if(battle)break;
      const result=action==='eq-equip'?equipItem(state,ui.equipmentActor,id,button.dataset.slot||undefined):action==='eq-unequip'?unequipItem(state,ui.equipmentActor,id):action==='eq-buy'?buyItem(state,id):sellItem(state,id);
      toast(result.ok?'Dotation mise à jour.':result.reason,!result.ok);if(result.ok)autosave();renderScreen();break;
    }
    case 'operation-filter':ui.operationFilter=id;renderScreen();break;
    case 'track-operation':state.trackedOperation=state.trackedOperation===id?null:id;ui.tracked=null;refreshOperations();autosave();renderScreen();renderHUD();break;
    case 'map-filter':ui.mapFilter=id;renderScreen();break;
    case 'equipment-actor':ui.equipmentActor=id;renderScreen();break;
    case 'buy':{const result=buyUpgrade(state,ui.equipmentActor,id);toast(result.ok?'Équipement mis à jour.':result.reason,!result.ok);autosave();renderScreen();break;}
    case 'crew-select':if(ui.selectedCrew.includes(id))ui.selectedCrew=ui.selectedCrew.filter(x=>x!==id);else if(ui.selectedCrew.length<2)ui.selectedCrew.push(id);else toast('Retirez un équipier avant d’en choisir un autre.');renderScreen();break;
    case 'crew-confirm':if(setSquad(state,ui.selectedCrew)){world.setCommanderAppearance(state.appearance);syncStoryContext();world.setParty(state.party);autosave();closeScreen();toast('Commando prêt.');}break;
    case 'map':if(!battle)openScreen(state.zone==='normandy'&&state.flags.briefed?'galaxy':'map');break;
    case 'track':ui.tracked=id;state.trackedOperation=world.getInteractivePOIs().find(p=>p.id===id)?.operationId||null;autosave();closeScreen();toast(`Objectif suivi : ${world.getInteractivePOIs().find(p=>p.id===id)?.label||id}`);break;
    case 'planet':ui.planet=id;renderScreen();break;
    case 'travel':loadZone(id);break;
    case 'interact':world.interact();break;
    case 'codex':openScreen('codex');break;
    case 'conversation':if(state?.zone==='normandy'&&!battle)showConversation(id);break;
    case 'codex-entry':ui.codex=id;renderScreen();break;
    case 'settings':case 'title-settings':openScreen('settings');break;
    case 'save':autosave(true);break;
    case 'export':exportSave();break;
    case 'import':$('#save-import').click();break;
    case 'credits':openScreen('credits');break;
    case 'help':openScreen('help');break;
    case 'fullscreen':if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('Le plein écran est indisponible.'));break;
    case 'quit':if(!battle)autosave();battle=null;world.setBattle(null);$('#battle-ui').innerHTML='';running=false;ui.screen='title';renderScreen();break;
    case 'dialogue-choice':{const choice=ui.dialogue?.choices[Number(button.dataset.index)];if(!choice?.disabled)choice?.run();break;}
    case 'battle-actor':ui.actor=id;renderCombat(true);break;
    case 'battle-action':ui.action=id;{const a=ACTIONS[id];if(a.target==='self'||a.target==='allies')issueAction(ui.actor);else renderCombat(true);}break;
    case 'battle-target':issueAction(id);break;
    case 'claim-victory':claimVictory();break;
    case 'retry':{const p=battlePOI;battle=null;world.setBattle(null);closeScreen();startEncounter(p);break;}
    case 'return-normandy':loadZone('normandy');break;
  }
});
document.addEventListener('input',e=>{if(e.target.id==='universe-search'&&ui.screen==='chronicles'){universeUI.query=e.target.value;universeUI.visibleCount=30;chronicleView=universeView();$('#universe-results').innerHTML=universeModules.renderer.renderUniverseReferenceResults(chronicleView,universeUI,{esc});}if(e.target.id==='codex-search'){ui.codexQuery=e.target.value;$('#codex-results').innerHTML=codexContents();}if(e.target.dataset.manualName)ui.manualNames[e.target.dataset.manualName]=e.target.value;if(e.target.id==='commander-name')ui.form.name=e.target.value;if(e.target.id==='volume-setting'){if(!state)state=newGame();state.settings.volume=Number(e.target.value);applySettings();}});
document.addEventListener('change',e=>{
  const {id,value,checked}=e.target;
  if(ui.screen==='chronicles'){
    if(id==='chronicle-media'){const work=universeModules.data.UNIVERSE_WORKS.find(item=>item.id===value);resetChronicleContext(value,work?.periods.length===1?work.periods[0].id:'');return;}
    if(id==='chronicle-period'){resetChronicleContext(universeUI.mediaId,value);return;}
    if(id==='chronicle-scenario'){universeUI.scenarioId=value;if(chronicleSession)acceptChronicle(universeModules.engine.selectChronicleScenario(chronicleSession,value),'Essai sélectionné.');else renderScreen();return;}
    if(id==='chronicle-reading'&&!(chronicleBattle&&!chronicleBattle.winner)){universeUI.readingId=value;readChroniclePage();return;}
    if(e.target.matches('[data-chronicle-build]')&&chronicleSession&&!chronicleBattle){const result=universeModules.engine.setChronicleBuild(chronicleSession,e.target.dataset.actorId,value);acceptChronicle(result,result.clearedEquipment?.length?'Profil enregistré · équipements incompatibles retirés.':'Profil enregistré.');return;}
    if(e.target.matches('[data-chronicle-ammo-mode]')&&chronicleSession&&!chronicleBattle){acceptChronicle(universeModules.engine.setChronicleAmmoMode(chronicleSession,e.target.dataset.actorId,value||null),'Mode de munitions enregistré.');return;}
    if(e.target.matches('[data-chronicle-gear]')&&chronicleSession&&!chronicleBattle){acceptChronicle(universeModules.engine.equipChronicle(chronicleSession,e.target.dataset.actorId,value||null,e.target.dataset.slot),'Dotation enregistrée.');return;}
  }
  if(e.target.matches('[data-eq-slot-selector]')){ui.equipmentSlots[`${ui.equipmentActor}:${e.target.dataset.item}`]=value;renderScreen();return;}if(id==='new-difficulty')ui.form.difficulty=value;if(id==='new-mode')ui.form.mode=value;
  const commanderFields={'new-appearance':['appearance',COMMANDER_APPEARANCES],'new-origin':['origin',ORIGINS],'new-profile':['psychologicalProfile',PSYCHOLOGICAL_PROFILES]};
  if(commanderFields[id]){const [field,choices]=commanderFields[id];if(Object.hasOwn(choices,value)){ui.form[field]=value;const description=document.getElementById(`${id}-description`);if(description)description.textContent=choices[value].description;if(id==='new-appearance'){const portrait=$('#commander-preview');portrait.style.cssText=ui.form.customization||value==='female'?'background-image:none':portraitStyle('shepard',value);portrait.innerHTML=ui.form.customization?customizationFaceSVG({appearance:value,customization:ui.form.customization},'creation-face'):commanderArt(value);portrait.setAttribute('aria-label',choices[value].name);}}}
  if(id==='custom-weapon-filter'&&ui.screen==='customization'){ui.customWeaponFilter=value;refreshCustomization();$('#custom-weapon-filter')?.focus({preventScroll:true});}

  if(['sound-setting','motion-setting','text-setting','mode-setting','difficulty-setting'].includes(id)){if(!state)state=newGame();if(id==='sound-setting')state.settings.sound=checked;if(id==='motion-setting')state.settings.reducedMotion=checked;if(id==='text-setting')state.settings.largeText=checked;if(id==='mode-setting'){state.mode=value;if(battle)battle.mode=value;}if(id==='difficulty-setting')state.difficulty=value;applySettings();if(running)autosave();}
});
$('#save-import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2000000){toast('Fichier de sauvegarde trop volumineux.',true);return;}const imported=decodeSave(await file.text());if(!imported)toast('Ce fichier n’est pas une sauvegarde valide.',true);else{saveTo(localStorage,imported);continueGame(imported);toast('Sauvegarde importée.');}e.target.value='';});
$('#chronicle-import').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file||ui.screen!=='chronicles'||chronicleBattle&&!chronicleBattle.winner)return;
  if(file.size>2000000)return chronicleFeedback('Le fichier de chronique est trop volumineux.',true);
  try{
    const imported=universeModules.engine.decodeChronicle(await file.text());
    if(!imported)return chronicleFeedback('Ce fichier n’est pas une chronique valide.',true);
    if(ui.screen!=='chronicles')return;
    universeUI.mediaId=imported.context.mediaId;universeUI.periodId=imported.context.periodId;universeUI.scenarioId=imported.scenarioId||'';universeUI.query='';universeUI.recordId=null;universeUI.visibleCount=30;universeUI.readingId=null;universeUI.tab=imported.scenarioId?'session':universeModules.engine.listChronicleReadings(imported.context).length?'reading':'references';
    acceptChronicle({ok:true,session:imported},'Chronique importée.');
  }catch{chronicleFeedback('Impossible de lire ce fichier de chronique.',true);}
});
function exportSave(){if(!state||battle)return;const blob=new Blob([encodeSave(state)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Relay_Chronicles_Sauvegarde.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('keydown',e=>{if(ui.screen==='customization'){
  if(e.code==='Escape'){e.preventDefault();closeCustomization();return;}
  if(e.code==='Tab'){const focusable=[...document.querySelectorAll('.customization-screen button:not(:disabled),.customization-screen select,.customization-screen input,.customization-screen summary')].filter(element=>element.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  return;
}if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Escape'){e.preventDefault();if(inChronicles()){closeChronicles();return;}if(!running)return;if(['dialogue','victory','defeat','ending'].includes(ui.screen))return;if(ui.screen)closeScreen();else openScreen('pause');return;}if(!running||ui.screen||ui.busy)return;
  if(battle){if(['Digit1','Digit2','Digit3'].includes(e.code)){ui.actor=battle.actors.filter(a=>a.team==='party')[Number(e.code.slice(-1))-1]?.id||ui.actor;renderCombat(true);}if(e.code==='Space'){e.preventDefault();const ready=battle.actors.find(a=>a.team==='party'&&getActions(battle,a.id).some(x=>x.id==='shoot'&&x.available));if(ready){ui.actor=ready.id;ui.action='shoot';const target=battle.actors.find(a=>a.team==='enemy'&&a.hp>0&&!a.statuses.stasis);if(target)issueAction(target.id);}}return;}
  const shortcuts={KeyJ:'journal',KeyC:'squad',KeyI:'equipment',KeyM:'map',KeyG:'galaxy'};
  if(e.code==='KeyE')world.interact();else if(shortcuts[e.code]){e.preventDefault();const next=shortcuts[e.code];if(next==='galaxy'&&(state.zone!=='normandy'||!state.flags.briefed))return toast('La carte galactique se consulte au Normandy après le briefing.');if(next==='squad')ui.selectedCrew=state.party.slice(1);if(next==='equipment')ui.equipmentActor='shepard';openScreen(next);}
});
document.addEventListener('pointerdown',e=>{const key=e.target.closest('[data-key]')?.dataset.key;if(key){e.preventDefault();if(touchKey)world.keys.delete(touchKey);touchKey=key;world.keys.add(key);e.target.setPointerCapture?.(e.pointerId);}});
function releaseTouch(){if(touchKey)world.keys.delete(touchKey);touchKey=null;}
document.addEventListener('pointerup',releaseTouch);document.addEventListener('pointercancel',releaseTouch);
window.addEventListener('beforeunload',()=>{if(running&&!battle)autosave();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&inChronicles()&&chronicleBattle){chroniclePaused=true;renderChronicleCombat(true);}if(document.hidden&&running&&!ui.screen)openScreen('pause');});
function frame(now){const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;if(running&&!ui.screen&&!ui.busy&&!document.hidden)state.playedSeconds+=dt;if(battle&&!ui.screen&&!ui.busy){tickBattle(battle,dt);drainEvents();if(battle.winner)finishBattle();}advanceChronicle(dt);world.update(dt);uiAccumulator+=dt;saveAccumulator+=dt;if(uiAccumulator>.16){uiAccumulator=0;if(inChronicles())renderChronicleCombat();else if(running){renderHUD();if(battle)renderCombat();}}if(saveAccumulator>25){saveAccumulator=0;if(running&&!ui.screen&&!battle)autosave();}requestAnimationFrame(frame);}
renderScreen();requestAnimationFrame(frame);
// A test-only harness is excluded from production builds by Vite.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa')){
  window.__RELAY_TEST__={getState:()=>state,getBattle:()=>battle,getChronicle:()=>chronicleSession?structuredClone(chronicleSession):null,getChronicleBattle:()=>{if(!chronicleBattle)return null;const {_rng,...data}=chronicleBattle;return structuredClone(data);},chronicleStep:dt=>{if(Number.isFinite(dt)&&dt>0){advanceChronicle(Math.min(dt,60));renderChronicleCombat();}},chronicleAction:args=>{if(!args||typeof args!=='object'||!chronicleBattle)return {ok:false};universeUI.actorId=args.actorId;universeUI.actionId=args.actionId;return issueChronicleAction(args.targetId);},getWorld:()=>world,getUI:()=>ui,begin:(options={})=>{ui.form={...ui.form,...options};beginGame();},close:()=>closeScreen(),interact:id=>interactPOI(world.getInteractivePOIs().find(p=>p.id===id)),startBattle:id=>startEncounter(world.getInteractivePOIs().find(p=>p.id===id)),travel:zone=>loadZone(zone),step:dt=>{if(battle){tickBattle(battle,dt);drainEvents();if(battle.winner)finishBattle();}},action:args=>{const r=performAction(battle,args);drainEvents();renderCombat(true);return r;},claim:()=>claimVictory(),ready:()=>finishObjective(),render:()=>{renderHUD();renderScreen();},snapshot:()=>({zone:state?.zone,screen:ui.screen,actors:battle?.actors.map(a=>({id:a.id,hp:a.hp,atb:a.atb})),renderer:{calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles}})};
}

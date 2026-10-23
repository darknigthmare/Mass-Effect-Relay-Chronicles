import './style.css';
import { WorldView } from './world.js';
import { WORLD_ZONES } from './world-data.js';
import { AudioDirector } from './audio.js';
import { COMMANDER_APPEARANCES, ORIGINS, PSYCHOLOGICAL_PROFILES } from './commander.js';
import { listManualSaves, readManualSave, writeManualSave, deleteManualSave } from './save-slots.js';
import { createBattle, tickBattle, getActions, performAction, summarizeBattle, ACTIONS } from './combat.js';
import { VERSION, CLASSES, CREW, CHAPTERS, CODEX, EQUIPMENT, actorFor, enemiesFor } from './game-data.js';
import { newGame, unlockedZones, objectiveReady, canStartEncounter, encounterIndex, zoneEncounters, winEncounter, completeZone, recruit, availableCrew, setSquad, buyUpgrade, addLog, encodeSave, decodeSave, saveTo, loadFrom } from './state.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (value,max) => Math.max(0,Math.min(100,value/Math.max(1,max)*100));
const NPC_PORTRAITS={femshep:0,femaleShepard:0,anderson:1,joker:2,chakwas:3,nihlus:4,udina:5,kirrahe:6,emily:7};
const portraitStyle = (id,appearance=state?.appearance) => {
  const key=id==='shepard'?(COMMANDER_APPEARANCES[appearance]?.sprite||'shepard'):id;
  const npc=Object.hasOwn(NPC_PORTRAITS,key),index=npc?NPC_PORTRAITS[key]:CREW[key]?.index||0;
  return `background-image:url('${import.meta.env.BASE_URL}assets/${npc?'npc':'crew'}-atlas.png');background-position:${(index%4)/3*100}% ${Math.floor(index/4)*100}%`;
};
const commanderRank = () => state?.appearance==='female'?'Commandante':'Commandant';
const newCommanderForm = () => ({name:'Shepard',classId:'soldier',difficulty:'normal',mode:'wait',appearance:'male',origin:'spacer',psychologicalProfile:'sole-survivor'});
let hudStamp = '', touchKey = null;
let state = null, battle = null, running = false, battlePOI = null, lastBattleEvent = 0, combatStamp = '', lastFrame = performance.now(), uiAccumulator = 0, saveAccumulator = 0;
const ui = { screen:'title', previous:null, form:newCommanderForm(), planet:'eden-prime', selectedCrew:[], actor:'shepard', action:'shoot', selectedTarget:null, equipmentActor:'shepard', codex:'relay', tracked:null, dialogue:null, busy:false, manualNames:{}, manualFeedback:null, manualConfirmation:null, manualReturn:'title' };
$('#app').innerHTML = `<div id="world"></div><div class="vignette"></div><div id="hud" class="hidden"></div><div id="battle-ui"></div><div id="overlay"></div><div id="toasts" aria-live="polite"></div><div id="transition" class="transition-cover"><span class="eyebrow">Normandy · liaison opérationnelle</span><h2></h2><div class="spinner"></div></div><div class="scanlines"></div><input type="file" id="save-import" accept="application/json,.json" hidden>`;
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
function applySettings(){const s=state?.settings||{sound:true,volume:.35};audio.setEnabled(s.sound);audio.setVolume(s.volume);document.body.classList.toggle('reduced-motion',!!s.reducedMotion);document.body.classList.toggle('large-text',!!s.largeText);}
function autosave(notify=false){if(!state||battle)return false;state.position=world.getPosition();const ok=saveTo(localStorage,state);if(notify)toast(ok?'Progression sauvegardée.':'La sauvegarde locale a échoué. Exportez votre progression.',!ok);return ok;}
function openScreen(name){ui.previous=ui.screen;ui.screen=name;audio.play('ui');syncMode();renderScreen();}
function closeScreen(){ui.screen=null;ui.dialogue=null;$('#overlay').innerHTML='';syncMode();renderHUD();}
function screen(title,eyebrow,body,foot='',className=''){return `<div class="overlay-backdrop"></div><section class="screen ${className}" role="dialog" aria-label="${esc(title)}"><header class="screen-head"><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div>${['victory','defeat','ending'].includes(ui.screen)?'':'<button class="close" data-do="close" aria-label="Fermer">×</button>'}</header><div class="screen-body">${body}</div>${foot?`<footer class="screen-foot">${foot}</footer>`:''}</section>`;}
function titleScreen(){
  const saved=loadFrom(localStorage);
  return `<section class="title-screen"><div class="title-art"></div><div class="title-coordinates">ARCHIVES DE L’ALLIANCE<br>2183 · ESPACE CONCILIEN<div class="title-line"></div>SSV NORMANDY SR-1</div><div class="title-content"><div class="title-overline">UNE GALAXIE. VOS DÉCISIONS.</div><h1 class="title-wordmark">MASS EFFECT</h1><h2 class="title-subtitle">Relay Chronicles</h2><p class="title-copy">Traversez les relais. Rassemblez votre commando.<br>Une aventure cinématographique en 2D/3D,<br>au rythme de vos décisions.</p><div class="title-menu">${saved?`<button class="primary" data-do="continue">Reprendre <span>→</span></button>`:''}<button class="${saved?'secondary':'primary'}" data-do="new">Nouvelle campagne <span>→</span></button><button class="secondary" data-do="manual-saves">Charger une partie <span>→</span></button><button class="secondary" data-do="import">Importer une sauvegarde <span>↗</span></button><button class="secondary" data-do="title-settings">Options <span>＋</span></button><button class="secondary" data-do="credits">Crédits <span>＋</span></button></div></div><div class="title-badge"><b>01 / 2183</b><small>LES CHRONIQUES DES RELAIS</small></div><footer class="title-footer"><span>Projet de fan non officiel · campagne condensée</span><span>Version ${VERSION} · PC</span></footer></section>`;
}
function renderScreen(){
  let html='';
  if(ui.screen==='title')html=titleScreen();
  else if(ui.screen==='new')html=newGameScreen();
  else if(ui.screen==='pause')html=screen('Mission en pause','Normandy · commando',`<div class="button-row"><button class="primary" data-do="close">Reprendre</button><button class="secondary" data-do="save" ${battle?'disabled':''}>Sauvegarder</button><button class="secondary" data-do="manual-saves" ${battle?'disabled':''}>Emplacements de sauvegarde</button><button class="secondary" data-do="export" ${battle?'disabled':''}>Exporter la sauvegarde</button><button class="secondary" data-do="dossier">Dossier Shepard</button><button class="secondary" data-do="settings">Options</button><button class="secondary" data-do="help">Commandes</button><button class="danger" data-do="quit">Retour au titre</button></div>`,`<span class="small">${battle?'La reprise se fait avant le combat en cours.':'Sauvegarde automatique entre les rencontres.'}</span>`,'pause-screen');
  else if(ui.screen==='galaxy')html=galaxyScreen();
  else if(ui.screen==='squad')html=squadScreen();
  else if(ui.screen==='dossier')html=commanderScreen();
  else if(ui.screen==='saves')html=manualSavesScreen();
  else if(ui.screen==='equipment')html=equipmentScreen();
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
        <div class="commander-preview-row"><div id="commander-preview" class="crew-art commander-preview" role="img" aria-label="${esc(COMMANDER_APPEARANCES[ui.form.appearance].name)}" style="${portraitStyle('shepard',ui.form.appearance)}"></div><div><div class="section-label">Archives de l’Alliance</div><p class="small">Votre origine et votre profil font partie du dossier personnel conservé avec la campagne.</p></div></div>
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
      <div><div class="crew-art commander-portrait" role="img" aria-label="Portrait de ${esc(state.name)}" style="${portraitStyle('shepard')}"></div><span class="pill teal">${esc(appearance.name)}</span></div>
      <div><div class="eyebrow">${commanderRank()}</div><h3 class="commander-name">${esc(state.name)}</h3><p class="brief-copy">${esc(CLASSES[state.classId].name)} · Niveau ${Math.floor(state.xp/300)+1}</p>
        <dl class="commander-record"><div><dt>Origine</dt><dd><strong>${esc(origin.name)}</strong><p>${esc(origin.description)}</p></dd></div><div><dt>Profil psychologique</dt><dd><strong>${esc(profile.name)}</strong><p>${esc(profile.description)}</p></dd></div></dl>
      </div>
    </div>`, `<span class="small">Dossier conservé dans la sauvegarde de cette campagne.</span><button class="secondary" data-do="dossier-back">${ui.previous==='squad'?'Retour au commando':'Retour à la pause'}</button>`);
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
  return screen('Votre commando','Deux équipiers · une mission',`<p class="brief-copy" style="margin-bottom:22px">${editable?'Choisissez deux compagnons pour votre prochaine sortie.':'Votre groupe est engagé sur le terrain. La composition se prépare au Normandy.'}</p><div class="crew-grid">${Object.values(CREW).filter(c=>!['shepard','jenkins'].includes(c.id)).map(c=>{const locked=!available.includes(c.id);return `<button class="crew-card ${ui.selectedCrew.includes(c.id)?'selected':''} ${locked?'unavailable':''}" data-do="crew-select" data-id="${c.id}" ${locked||!editable?'disabled':''}>${ui.selectedCrew.includes(c.id)?'<span class="check">SÉLECTIONNÉ</span>':''}<div class="crew-art" style="${portraitStyle(c.id)}"></div><div class="card-info"><strong>${c.name}</strong><small>${state.lost.includes(c.id)?'Mort au combat':locked?'Pas encore recruté':c.role}</small><small>${c.description}</small></div></button>`;}).join('')}</div>`,`<div class="squad-footer"><span class="small">${ui.selectedCrew.length}/2 équipiers sélectionnés</span><button class="secondary" data-do="dossier">Dossier Shepard</button></div><button class="primary" data-do="crew-confirm" ${!editable||ui.selectedCrew.length!==2?'disabled':''}>Confirmer le commando</button>`);
}
function equipmentScreen(){
  const id=ui.equipmentActor;const actor=actorFor(id,state);const canBuy=['normandy','citadel'].includes(state.zone);const upgrades=state.upgrades[id]||{};
  return screen('Équipement du commando',`${state.credits} crédits · ${state.medigel} médi-gels`,`<div class="tabs">${state.party.map(p=>`<button class="tab ${id===p?'active':''}" data-do="equipment-actor" data-id="${p}">${esc(p==='shepard'?state.name:CREW[p].name)}</button>`).join('')}</div><div class="crew-detail-grid"><div class="crew-art" style="height:320px;${portraitStyle(id)}"></div><div><div class="eyebrow">${CREW[id].role}</div><h3 style="font-size:25px;font-weight:350;margin-top:8px">${esc(actor.name)}</h3><div class="stats-list"><div class="stat"><b>${actor.maxHp}</b><span>SANTÉ</span></div><div class="stat"><b>${actor.maxShield}</b><span>BOUCLIERS</span></div><div class="stat"><b>${actor.attack}</b><span>PUISSANCE</span></div><div class="stat"><b>${actor.defense}</b><span>DÉFENSE</span></div></div>${EQUIPMENT.map(item=>`<div class="shop-row"><div><h3>${item.name}</h3><p>${item.detail}</p><p>${item.stat==='medigel'?`${state.medigel}/9 doses`:`Niveau ${upgrades[item.stat+'Count']||0}/5`}</p></div><button class="secondary" data-do="buy" data-id="${item.id}" ${!canBuy||state.credits<item.cost?'disabled':''}>${item.cost} CR</button></div>`).join('')}<p class="small" style="margin-top:16px">${canBuy?'Les améliorations sont appliquées au personnage sélectionné.':'Les achats sont disponibles au Normandy et à la Citadelle.'}</p></div></div>`);
}
function journalScreen(){return screen('Journal de mission','Objectifs · décisions · progression',`<div class="journal-layout"><div><div class="section-label">Campagne</div>${Object.entries(CHAPTERS).filter(([id])=>unlockedZones(state).includes(id)).map(([id,c])=>`<div class="journal-entry"><h3>${state.completed.includes(id)?'✓ ':''}${c.name}</h3><p>${state.completed.includes(id)?'Mission accomplie.':c.objective}</p>${state.choices[id]?`<span class="pill">${choiceLabel(id,state.choices[id])}</span>`:''}</div>`).join('')}</div><div><div class="section-label">Rapports récents</div>${state.logs.slice(0,12).map(l=>`<div class="journal-entry"><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p></div>`).join('')}</div></div>`,`<span class="small">Conciliation ${state.paragon} · Pragmatisme ${state.renegade}</span><span class="small">Niveau ${Math.floor(state.xp/300)+1} · ${state.xp} EXP</span>`);}
function codexScreen(){const entry=CODEX.find(e=>e.id===ui.codex)||CODEX[0];return screen('Codex','Archives de l’Alliance',`<div class="codex-layout"><nav class="codex-list">${CODEX.map(e=>`<button class="codex-item ${e.id===ui.codex?'active':''}" data-do="codex-entry" data-id="${e.id}">${e.name}</button>`).join('')}</nav><article class="codex-article"><span class="eyebrow">${entry.category}</span><h3>${entry.name}</h3><p>${entry.text}</p><div class="section-label">Dossier de bord</div><p class="small">Les informations tactiques décrivent les règles de cette adaptation. Le journal conserve vos décisions de campagne.</p></article></div>`);}
function settingsScreen(){const s=state?.settings||{sound:true,volume:.35,reducedMotion:false,largeText:false};return screen('Options','Affichage · audio · rythme',`<div class="setting-row"><label for="sound-setting">Ambiances et effets<small>Synthèse sonore originale</small></label><input id="sound-setting" type="checkbox" ${s.sound?'checked':''}></div><div class="setting-row"><label for="volume-setting">Volume général</label><input id="volume-setting" type="range" min="0" max="1" step=".05" value="${s.volume}"></div><div class="setting-row"><label for="motion-setting">Réduire les transitions</label><input id="motion-setting" type="checkbox" ${s.reducedMotion?'checked':''}></div><div class="setting-row"><label for="text-setting">Texte agrandi</label><input id="text-setting" type="checkbox" ${s.largeText?'checked':''}></div>${state?`<div class="setting-row"><label for="mode-setting">Jauges ATB<small>Le mode Attente suspend le temps lorsqu’un allié est prêt.</small></label><select id="mode-setting"><option value="wait" ${state.mode==='wait'?'selected':''}>Attente</option><option value="active" ${state.mode==='active'?'selected':''}>Actif</option></select></div><div class="setting-row"><label for="difficulty-setting">Difficulté<small>Appliquée aux prochains combats.</small></label><select id="difficulty-setting"><option value="story" ${state.difficulty==='story'?'selected':''}>Histoire</option><option value="normal" ${state.difficulty==='normal'?'selected':''}>Vétéran</option><option value="hard" ${state.difficulty==='hard'?'selected':''}>Difficile</option></select></div>`:''}<div class="setting-row"><label>Plein écran<small>F11 dans l’application PC</small></label><button class="secondary" data-do="fullscreen">Basculer</button></div>`);}
function dialogueScreen(){const d=ui.dialogue;if(!d)return '';return `<div class="dialogue" role="dialog" aria-label="Dialogue"><div class="dialogue-portrait ${d.portrait?'':'generic'}" style="${d.portrait?portraitStyle(d.portrait):''}">${d.portrait?'':'◇'}</div><div class="dialogue-body"><div class="speaker">${esc(d.speaker)}</div><p class="dialogue-text">${esc(d.text)}</p><div class="dialogue-choices">${d.choices.map((c,i)=>`<button class="choice ${c.tone||''}" data-do="dialogue-choice" data-index="${i}">${esc(c.label)}${c.hint?`<small>${esc(c.hint)}</small>`:''}</button>`).join('')}</div></div></div>`;}
function localMapScreen(){const b=world.getBounds();const p=world.getPosition();const pois=world.getPOIs();const x=v=>(v-b.minX)/(b.maxX-b.minX)*100;const z=v=>(v-b.minZ)/(b.maxZ-b.minZ)*100;return screen(WORLD_ZONES[state.zone].label,'Carte locale',`<div class="galaxy-layout"><div class="starmap"><div class="star-dust"></div>${pois.map(o=>`<button class="planet-dot" data-do="track" data-id="${o.id}" style="left:${x(o.x)}%;top:${z(o.z)}%;--planet:${o.cleared?'#607e83':o.type==='encounter'?'#df8174':'#81ddd4'}"><i></i>${esc(o.label)}</button>`).join('')}<span style="position:absolute;left:${x(p.x)}%;top:${z(p.z)}%;color:#fff;transform:translate(-50%,-50%)">▲</span></div><div><div class="section-label">Objectif actuel</div><p class="brief-copy">${esc(currentObjective())}</p><div class="divider"></div><p class="small">Cliquez sur un lieu pour le suivre sur le radar. Déplacez-vous avec ZQSD / WASD ou cliquez sur le sol.</p><div class="divider"></div><button class="secondary" data-do="close">Retour sur le terrain</button></div></div>`);}
function victoryScreen(){const result=summarizeBattle(battle);return screen('Secteur sécurisé',CHAPTERS[state.zone]?.name||'Rapport de combat',`<p class="brief-copy">${esc(battlePOI.label)}. Le commando peut poursuivre sa progression.</p><div class="ending-grid"><div class="ending-stat"><strong>+65</strong><span>EXPÉRIENCE</span></div><div class="ending-stat"><strong>+85</strong><span>CRÉDITS</span></div><div class="ending-stat"><strong>${result.defeatedEnemies}</strong><span>ADVERSAIRES NEUTRALISÉS</span></div><div class="ending-stat"><strong>${result.actionCount}</strong><span>ACTIONS EXÉCUTÉES</span></div></div>`,`<span class="small">Le secteur restera sécurisé.</span><button class="primary" data-do="claim-victory">Poursuivre →</button>`,'pause-screen');}
function choiceLabel(zone,value){const labels={'save':'Colonie protégée','force':'Colonie sacrifiée','release':'Reine rachni libérée','destroy':'Reine rachni détruite','save-kaidan':'Kaidan sauvé','save-ashley':'Ashley sauvée','save-council':'Conseil secouru','focus-sovereign':'Flotte concentrée sur Sovereign'};return labels[value]||value;}
function endingScreen(){return screen('Le prochain cycle vous appartient','Fin de cette chronique',`<span class="eyebrow">${commanderRank()} ${esc(state.name)}</span><h3 style="font-size:35px;font-weight:350;margin:15px 0 22px">La menace a un nom.</h3><p class="brief-copy">Saren est arrêté. La Citadelle survit à l’assaut. Votre commando a porté la vérité au-delà des relais, et les décisions prises pendant l’enquête ont marqué la galaxie.</p><div class="ending-grid"><div class="ending-stat"><strong>${state.completed.length}</strong><span>ÉTAPES ACCOMPLIES</span></div><div class="ending-stat"><strong>${state.cleared.length}</strong><span>RENCONTRES REMPORTÉES</span></div></div>${['feros','noveria','virmire','citadel-finale'].map(z=>`<div class="journal-entry"><h3>${CHAPTERS[z].name}</h3><p>${esc(choiceLabel(z,state.choices[z]||''))}</p></div>`).join('')}<p class="small" style="margin-top:20px">Votre sauvegarde conserve les choix de cette campagne condensée. Le registre de production documente les scènes et contenus restant à développer pour une adaptation intégrale.</p>`,`<button class="secondary" data-do="export">Exporter le parcours</button><button class="primary" data-do="return-normandy">Retrouver le Normandy →</button>`);}

function speak(speaker,text,choices=[{label:'Poursuivre',run:()=>closeScreen()}],portrait=null){portrait ||= /Anderson/.test(speaker)?'anderson':/Joker/.test(speaker)?'joker':/Chakwas/.test(speaker)?'chakwas':null;ui.dialogue={speaker,text,choices,portrait};openScreen('dialogue');audio.play('dialogue');}
function currentObjective(){if(!state)return '';if(state.zone==='normandy')return !state.flags.briefed?'Rejoindre le briefing de mission.':'Préparer le commando, puis choisir une destination sur la carte galactique.';if(state.completed.includes(state.zone))return 'Mission accomplie. Rejoignez le point d’extraction.';return CHAPTERS[state.zone]?.objective||'';}
function renderHUD(){if(!running||!state)return;const chapter=CHAPTERS[state.zone];const nearby=!ui.screen&&!battle?world.getNearby():null;const signature=[state.zone,state.name,state.classId,state.appearance,state.party.join(','),state.completed.join(','),state.cleared.join(','),state.flags.briefed,nearby?.id,!!battle,battle?.waiting,battle?.log.slice(-3).join('|'),ui.tracked].join('~');if(signature===hudStamp){if(!battle&&$('.minimap'))$('.minimap').innerHTML=minimapSVG();return;}hudStamp=signature;$('#hud').innerHTML=`<div class="hud-top"><div class="location"><div class="eyebrow">${state.zone==='normandy'?'SSV · ALLIANCE':`MISSION ${chapter?.number||''}`}</div><h2>${esc(WORLD_ZONES[state.zone].label)}</h2><div class="sub">${esc(chapter?.subtitle||'Centre d’information et de combat')}</div></div><nav class="hud-nav"><button class="icon-button" data-do="journal" ${battle?'disabled':''}><b>J</b> Journal</button><button class="icon-button" data-do="squad" ${battle?'disabled':''}><b>C</b> Commando</button><button class="icon-button" data-do="equipment" ${battle?'disabled':''}><b>I</b> Équipement</button><button class="icon-button" data-do="map" ${battle?'disabled':''}><b>M</b> Carte</button><button class="icon-button" data-do="pause"><b>Ⅱ</b> Pause</button></nav></div>${!battle?`<div class="mission-chip"><div class="eyebrow">${state.completed.includes(state.zone)?'Rapport transmis':'Objectif de mission'}</div><p>${esc(currentObjective())}</p><div class="steps">${zoneEncounters(state.zone).map(id=>`<i class="step ${state.cleared.includes(id)?'done':''}"></i>`).join('')}</div></div><div class="minimap">${minimapSVG()}</div><div class="explore-party">${state.party.map(id=>`<button class="mini-member" data-do="squad"><span>${esc(id==='shepard'?state.name:CREW[id].name)}</span><small>${id==='shepard'?CLASSES[state.classId].name:CREW[id].role}</small></button>`).join('')}</div>${nearby?`<button class="interaction" data-do="interact"><kbd>E</kbd><span>${esc(nearby.label)}</span></button>`:''}<div class="controls-hint">ZQSD / WASD · DÉPLACEMENT<br>E · INTERAGIR &nbsp; MAJ · COURIR<br>CLIC · REJOINDRE UN POINT</div><div class="mobile-pad"><button class="up" data-key="ArrowUp">↑</button><button class="left" data-key="ArrowLeft">←</button><button class="down" data-key="ArrowDown">↓</button><button class="right" data-key="ArrowRight">→</button></div>`:`<div class="combat-badge">${esc(battlePOI?.label||'Contact hostile')} · ${battle.waiting?'EN ATTENTE D’ORDRES':'JAUGES ACTIVES'}</div><div class="combat-log">${battle.log.slice(-3).map(l=>`<p>${esc(l)}</p>`).join('')}</div>`}`;}
function minimapSVG(){const b=world.getBounds(),p=world.getPosition();const x=v=>12+(v-b.minX)/(b.maxX-b.minX)*126,z=v=>12+(v-b.minZ)/(b.maxZ-b.minZ)*126;return `<svg viewBox="0 0 150 150" aria-label="Radar"><path d="M12 75H138M75 12V138" stroke="#81ddd418"/><rect x="12" y="12" width="126" height="126" fill="none" stroke="#81ddd433"/>${world.getPOIs().filter(o=>!o.cleared).map(o=>`<circle cx="${x(o.x)}" cy="${z(o.z)}" r="${ui.tracked===o.id?4:2.6}" fill="${o.type==='encounter'?'#df8174':o.type==='objective'?'#dcbe8c':'#81ddd4'}"/>`).join('')}<circle cx="${x(p.x)}" cy="${z(p.z)}" r="3.5" fill="#fff"/><circle cx="${x(p.x)}" cy="${z(p.z)}" r="8" fill="none" stroke="#fff5"/></svg>`;}

async function loadZone(zone,{resume=false}={}){if(!state||!WORLD_ZONES[zone]||!unlockedZones(state).includes(zone)){toast('Destination indisponible.',true);return;}world.setCommanderAppearance(state.appearance);ui.busy=true;ui.screen=null;$('#overlay').innerHTML='';$('#transition h2').textContent=WORLD_ZONES[zone].label;$('#transition').classList.add('active');syncMode();const position=resume?state.position:null;await new Promise(r=>setTimeout(r,state.settings.reducedMotion?0:280));state.zone=zone;world.setZone(zone,{party:state.party,cleared:state.cleared});if(position)world.setPosition(position);state.position=world.getPosition();audio.setZone(zone);ui.busy=false;$('#transition').classList.remove('active');syncMode();renderHUD();autosave();}
function beginGame(){const preferences=state?.settings;state=newGame(ui.form);if(preferences)state.settings={...preferences};running=true;battle=null;battlePOI=null;$('#battle-ui').innerHTML='';ui.screen=null;audio.unlock();applySettings();loadZone('normandy').then(()=>speak('Capitaine Anderson','Nous approchons d’Eden Prime. Rejoignez le briefing avant la descente. Préparez votre équipe, puis consultez la carte galactique.',[{label:'Je rejoins le briefing.',run:()=>closeScreen()}]));}
function continueGame(s=loadFrom(localStorage)){if(!s){toast('Aucune sauvegarde valide.',true);return;}state=s;running=true;battle=null;battlePOI=null;$('#battle-ui').innerHTML='';ui.screen=null;world.setBattle(null);audio.unlock();applySettings();loadZone(state.zone,{resume:true});}

function interactPOI(poi){if(!poi||!running||battle||ui.screen||ui.busy)return;audio.play('ui');const zone=state.zone;
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
    return speak(CREW[id].name,state.recruited.includes(id)?'Je serai prêt pour la prochaine mission. Retrouvez-moi à bord du Normandy.':texts[id],[{label:state.recruited.includes(id)?'À bientôt.':'Bienvenue dans le commando.',run:()=>{recruit(state,id);autosave();closeScreen();}}],id);
  }
  if(poi.type==='objective')return finishObjective();
}
function finishObjective(){const zone=state.zone;if(state.completed.includes(zone))return toast('Objectif déjà accompli. Le Normandy vous attend.');if(!objectiveReady(state,zone))return toast(zone==='citadel'?'Rencontrez Garrus, Tali et Wrex avant l’audience.':'Sécurisez les trois secteurs avant de poursuivre.',true);
  const finish=choice=>{if(!completeZone(state,zone,choice))return;world.setCommanderAppearance(state.appearance);world.setParty(state.party);autosave();audio.play('win');if(state.ending)return openScreen('ending');const texts={
    'eden-prime':'La balise s’active au contact de Shepard. Des images fragmentées laissent entrevoir une menace ancienne. Le Normandy fait route vers la Citadelle.',
    citadel:'Les preuves sont entendues. Vous obtenez le statut de Spectre et le commandement de l’enquête. Therum, Feros et Noveria sont désormais accessibles.',
    therum:'Liara est libérée. Son expertise des Prothéens peut aider à interpréter la vision. Elle rejoint le Normandy.',
    feros:choice==='save'?'La colonie est libérée de l’influence du Thorien. Les survivants peuvent commencer à reconstruire.':'La menace est neutralisée, au prix de lourdes pertes parmi les colons.',
    noveria:choice==='release'?'La reine rachni est libérée. Votre décision aura un écho bien au-delà de Noveria.':'La reine rachni est détruite. Le dossier de Pic 15 est clos.',
    virmire:choice==='save-kaidan'?'Kaidan a été extrait. Ashley reste sur Virmire. Son sacrifice ne sera pas oublié.':'Ashley a été extraite. Kaidan reste sur Virmire. Son sacrifice ne sera pas oublié.',
    ilos:'Vigil révèle la fonction du Conduit. L’accès à la Citadelle est ouvert : il reste une dernière chance d’arrêter Saren.'};
    speak('Rapport de mission',texts[zone],[{label:zone==='ilos'?'Emprunter le Conduit.':'Retourner au Normandy.',run:()=>loadZone(zone==='ilos'?'citadel-finale':'normandy')}],zone==='therum'?'liara':null);
  };
  if(zone==='feros')return speak('Le sort de Zhu’s Hope','Le lien du Thorien est brisé. Votre rapport doit préciser les mesures prises pour protéger la colonie.',[{label:'Préserver les colons et organiser les secours.',tone:'paragon',run:()=>finish('save')},{label:'Privilégier la neutralisation à tout prix.',tone:'renegade',run:()=>finish('force')}]);
  if(zone==='noveria')return speak('La reine rachni','La reine est à votre merci. Elle demande à quitter cet endroit. C’est à vous de décider si elle doit vivre.',[{label:'La libérer.',tone:'paragon',run:()=>finish('release')},{label:'La détruire.',tone:'renegade',run:()=>finish('destroy')}]);
  if(zone==='virmire')return speak('Joker · canal d’urgence','Le Normandy ne peut effectuer qu’une seule extraction. Kaidan et Ashley sont séparés. Vous devez choisir qui rejoindre.',[{label:'Rejoindre Kaidan.',run:()=>finish('save-kaidan')},{label:'Rejoindre Ashley.',run:()=>finish('save-ashley')}]);
  if(zone==='citadel-finale')return speak('Commandement de l’Alliance','Saren est arrêté. La flotte demande vos ordres. Le vaisseau du Conseil est en difficulté tandis que Sovereign concentre les tirs.',[{label:'Secourir le Conseil.',tone:'paragon',run:()=>finish('save-council')},{label:'Concentrer la flotte sur Sovereign.',tone:'renegade',run:()=>finish('focus-sovereign')}]);
  speak(zone==='therum'?'Liara T’Soni':zone==='ilos'?'Vigil':zone==='citadel'?'Conseil de la Citadelle':'Rapport du commando',zone==='therum'?'Le système de confinement peut enfin être désactivé. Liara est prête à quitter les ruines.':zone==='ilos'?'Les dernières archives prothéennes expliquent le rôle du Conduit. Votre prochain passage vous mènera au cœur de la Citadelle.':zone==='citadel'?'Les preuves remettent en cause Saren. Le Conseil vous accorde les moyens de poursuivre votre enquête.':'La balise est accessible. Le commando sécurise les abords du site.',[{label:'Poursuivre.',run:()=>finish()}],zone==='therum'?'liara':null);
}

function startEncounter(poi){if(!running||battle||ui.screen||ui.busy)return;const allowed=canStartEncounter(state,poi.id);if(!allowed.ok)return toast(allowed.reason,true);battlePOI=poi;state.position=world.getPosition();autosave();const index=encounterIndex(poi.id);battle=createBattle({party:state.party.map(id=>actorFor(id,state)),enemies:enemiesFor(state.zone,index,state),difficulty:state.difficulty,mode:state.mode,seed:state.cleared.length+2183,medigel:state.medigel});ui.actor='shepard';ui.action='shoot';ui.selectedTarget=battle.actors.find(a=>a.team==='enemy')?.id;lastBattleEvent=0;combatStamp='';world.setBattle(battle);world.setMode('combat');audio.setZone('combat');renderCombat(true);renderHUD();}
function renderCombat(force=false){if(!battle){$('#battle-ui').innerHTML='';return;}const party=battle.actors.filter(a=>a.team==='party');let actor=party.find(a=>a.id===ui.actor);const ready=party.filter(a=>a.hp>0&&a.atb>=99.999&&!['stasis','lift','singularity','stagger'].some(s=>a.statuses[s]>0));if((!actor||actor.hp<=0||actor.atb<99.999)&&ready.length){actor=ready[0];ui.actor=actor.id;}actor ||= party[0];const actions=getActions(battle,actor.id);if(!actions.some(a=>a.id===ui.action))ui.action='shoot';const chosen=actions.find(a=>a.id===ui.action)||actions[0];const targets=battle.actors.filter(a=>(chosen?.target==='ally'||chosen?.target==='allies'?a.team==='party':a.team==='enemy'));const stamp=[ui.actor,ui.action,...actions.map(a=>`${a.id}:${a.available}:${Math.ceil(a.cooldownRemaining||0)}`),...battle.actors.map(a=>`${a.id}:${a.hp>0}`)].join('|');
  if(force||stamp!==combatStamp){combatStamp=stamp;$('#battle-ui').innerHTML=`<div class="battle-shell"><div class="party-list">${party.map((a,i)=>`<button id="combat-${a.id}" class="battle-member ${a.id===actor.id?'active':''}" data-do="battle-actor" data-id="${a.id}"><span class="member-key">${i+1}</span><div><div class="member-title"><span>${esc(a.name)}</span><small data-stat="hp-label"></small></div><div class="bar"><span class="shield-fill" data-stat="shield"></span></div><div class="bar"><span class="hp-fill" data-stat="hp"></span></div><div class="bar"><span class="atb-fill" data-stat="atb"></span></div></div></button>`).join('')}</div><div class="actions-panel"><div class="battle-status"><h3>${esc(actor.name)}</h3><span id="heat-label"></span></div><div class="bar" style="margin-bottom:10px"><span id="heat-meter" class="heat-fill"></span></div><div class="action-grid">${actions.map(a=>`<button class="action-button ${a.id===ui.action?'selected':''}" data-do="battle-action" data-id="${a.id}" ${!a.available?'disabled':''} title="${esc(a.reason||a.description)}">${a.label}${a.cooldownRemaining>0?`<small>${Math.ceil(a.cooldownRemaining)} s</small>`:''}</button>`).join('')}</div><div class="action-help">${esc(chosen?.reason||chosen?.description||'Attendez la jauge ATB.')} ${chosen?.available&&['enemy','ally','enemies'].includes(chosen.target)?'Choisissez une cible.':''}</div></div><div class="target-list">${targets.map(a=>`<button id="target-${a.id}" class="target ${ui.selectedTarget===a.id?'selected':''}" data-do="battle-target" data-id="${a.id}" ${a.hp<=0?'disabled':''}><span>${esc(a.name)}</span><div class="bar"><span class="shield-fill" data-stat="shield"></span></div><div class="bar"><span class="hp-fill" data-stat="hp"></span></div><small data-stat="status" class="small"></small></button>`).join('')}</div></div>`;}
  for(const a of battle.actors){for(const prefix of ['combat','target']){const el=document.getElementById(`${prefix}-${a.id}`);if(!el)continue;for(const [k,max]of [['hp',a.maxHp],['shield',a.maxShield],['atb',100]]){const meter=el.querySelector(`[data-stat="${k}"]`);if(meter)meter.style.width=pct(a[k],max)+'%';}const label=el.querySelector('[data-stat="hp-label"]');if(label)label.textContent=`${Math.ceil(a.hp)} / ${a.maxHp}`;const status=el.querySelector('[data-stat="status"]');if(status)status.textContent=a.hp<=0?'Neutralisé':a.statuses.stasis>0?'Stase · protégé':a.statuses.hacked>0?'Piraté':a.cover?'À couvert':a.boss?'Menace majeure':'';el.classList.toggle('ready',a.atb>=99.999);}}
  if($('#heat-label'))$('#heat-label').textContent=`CHALEUR ${Math.round(actor.heat)} % · MÉDI-GEL ${battle.medigel}`;if($('#heat-meter'))$('#heat-meter').style.width=pct(actor.heat,100)+'%';
}
function issueAction(targetId){if(!battle||ui.screen)return;const result=performAction(battle,{actorId:ui.actor,actionId:ui.action,targetId});if(!result.ok)return toast(result.reason,true);ui.selectedTarget=targetId;drainEvents();renderCombat(true);renderHUD();}
function drainEvents(){while(battle&&lastBattleEvent<battle.events.length){const event=battle.events[lastBattleEvent++];if(['action','damage','heal','blocked'].includes(event.type))world.playEvent(event);if(event.type==='action')audio.play(event);}if(battle)world.setBattle(battle);}
function finishBattle(){if(!battle||ui.screen)return;audio.play(battle.winner==='party'?'win':'lose');openScreen(battle.winner==='party'?'victory':'defeat');}
function claimVictory(){const id=battlePOI.id;state.medigel=battle.medigel;winEncounter(state,id);battle=null;battlePOI=null;world.setBattle(null);world.setCommanderAppearance(state.appearance);world.setParty(state.party);world.setCleared(state.cleared);$('#battle-ui').innerHTML='';closeScreen();audio.setZone(state.zone);autosave();if(id==='eden-prime:encounter-1')speak('Kaidan Alenko','Jenkins n’a pas survécu à la première attaque. Nous avons retrouvé Ashley Williams, isolée de sa garnison. Elle nous accompagnera jusqu’au site de fouilles.',[{label:'Nous devons poursuivre.',run:()=>closeScreen()}],'kaidan');else toast('Secteur sécurisé · progression sauvegardée.');}

document.addEventListener('click',event=>{const button=event.target.closest('[data-do]');if(!button||button.disabled)return;const action=button.dataset.do,id=button.dataset.id;audio.unlock();
  switch(action){
    case 'new': ui.form=newCommanderForm();openScreen('new');break;
    case 'class':ui.form.classId=id;renderScreen();break;
    case 'begin':beginGame();break;
    case 'continue':case 'load':continueGame();break;
    case 'close':if(!running){ui.screen='title';renderScreen();}else if(['dialogue','victory','defeat','ending'].includes(ui.screen)){}else closeScreen();break;
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
    case 'squad':if(!battle){ui.selectedCrew=state.party.slice(1);openScreen('squad');}break;
    case 'equipment':if(!battle){ui.equipmentActor='shepard';openScreen('equipment');}break;
    case 'equipment-actor':ui.equipmentActor=id;renderScreen();break;
    case 'buy':{const result=buyUpgrade(state,ui.equipmentActor,id);toast(result.ok?'Équipement mis à jour.':result.reason,!result.ok);autosave();renderScreen();break;}
    case 'crew-select':if(ui.selectedCrew.includes(id))ui.selectedCrew=ui.selectedCrew.filter(x=>x!==id);else if(ui.selectedCrew.length<2)ui.selectedCrew.push(id);else toast('Retirez un équipier avant d’en choisir un autre.');renderScreen();break;
    case 'crew-confirm':if(setSquad(state,ui.selectedCrew)){world.setCommanderAppearance(state.appearance);world.setParty(state.party);autosave();closeScreen();toast('Commando prêt.');}break;
    case 'map':if(!battle)openScreen(state.zone==='normandy'&&state.flags.briefed?'galaxy':'map');break;
    case 'track':ui.tracked=id;closeScreen();toast(`Objectif suivi : ${world.getPOIs().find(p=>p.id===id)?.label||id}`);break;
    case 'planet':ui.planet=id;renderScreen();break;
    case 'travel':loadZone(id);break;
    case 'interact':world.interact();break;
    case 'codex':openScreen('codex');break;
    case 'codex-entry':ui.codex=id;renderScreen();break;
    case 'settings':case 'title-settings':openScreen('settings');break;
    case 'save':autosave(true);break;
    case 'export':exportSave();break;
    case 'import':$('#save-import').click();break;
    case 'credits':openScreen('credits');break;
    case 'help':openScreen('help');break;
    case 'fullscreen':if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('Le plein écran est indisponible.'));break;
    case 'quit':if(!battle)autosave();battle=null;world.setBattle(null);$('#battle-ui').innerHTML='';running=false;ui.screen='title';renderScreen();break;
    case 'dialogue-choice':{const choice=ui.dialogue?.choices[Number(button.dataset.index)];choice?.run();break;}
    case 'battle-actor':ui.actor=id;renderCombat(true);break;
    case 'battle-action':ui.action=id;{const a=ACTIONS[id];if(a.target==='self'||a.target==='allies')issueAction(ui.actor);else renderCombat(true);}break;
    case 'battle-target':issueAction(id);break;
    case 'claim-victory':claimVictory();break;
    case 'retry':{const p=battlePOI;battle=null;world.setBattle(null);closeScreen();startEncounter(p);break;}
    case 'return-normandy':loadZone('normandy');break;
  }
});
document.addEventListener('input',e=>{if(e.target.dataset.manualName)ui.manualNames[e.target.dataset.manualName]=e.target.value;if(e.target.id==='commander-name')ui.form.name=e.target.value;if(e.target.id==='volume-setting'){if(!state)state=newGame();state.settings.volume=Number(e.target.value);applySettings();}});
document.addEventListener('change',e=>{
  const {id,value,checked}=e.target;if(id==='new-difficulty')ui.form.difficulty=value;if(id==='new-mode')ui.form.mode=value;
  const commanderFields={'new-appearance':['appearance',COMMANDER_APPEARANCES],'new-origin':['origin',ORIGINS],'new-profile':['psychologicalProfile',PSYCHOLOGICAL_PROFILES]};
  if(commanderFields[id]){const [field,choices]=commanderFields[id];if(Object.hasOwn(choices,value)){ui.form[field]=value;const description=document.getElementById(`${id}-description`);if(description)description.textContent=choices[value].description;if(id==='new-appearance'){const portrait=$('#commander-preview');portrait.style.cssText=portraitStyle('shepard',value);portrait.setAttribute('aria-label',choices[value].name);}}}

  if(['sound-setting','motion-setting','text-setting','mode-setting','difficulty-setting'].includes(id)){if(!state)state=newGame();if(id==='sound-setting')state.settings.sound=checked;if(id==='motion-setting')state.settings.reducedMotion=checked;if(id==='text-setting')state.settings.largeText=checked;if(id==='mode-setting'){state.mode=value;if(battle)battle.mode=value;}if(id==='difficulty-setting')state.difficulty=value;applySettings();if(running)autosave();}
});
$('#save-import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2000000){toast('Fichier de sauvegarde trop volumineux.',true);return;}const imported=decodeSave(await file.text());if(!imported)toast('Ce fichier n’est pas une sauvegarde valide.',true);else{saveTo(localStorage,imported);continueGame(imported);toast('Sauvegarde importée.');}e.target.value='';});
function exportSave(){if(!state||battle)return;const blob=new Blob([encodeSave(state)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Relay_Chronicles_Sauvegarde.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Escape'){e.preventDefault();if(!running)return;if(['dialogue','victory','defeat','ending'].includes(ui.screen))return;if(ui.screen)closeScreen();else openScreen('pause');return;}if(!running||ui.screen||ui.busy)return;
  if(battle){if(['Digit1','Digit2','Digit3'].includes(e.code)){ui.actor=battle.actors.filter(a=>a.team==='party')[Number(e.code.slice(-1))-1]?.id||ui.actor;renderCombat(true);}if(e.code==='Space'){e.preventDefault();const ready=battle.actors.find(a=>a.team==='party'&&getActions(battle,a.id).some(x=>x.id==='shoot'&&x.available));if(ready){ui.actor=ready.id;ui.action='shoot';const target=battle.actors.find(a=>a.team==='enemy'&&a.hp>0&&!a.statuses.stasis);if(target)issueAction(target.id);}}return;}
  const shortcuts={KeyJ:'journal',KeyC:'squad',KeyI:'equipment',KeyM:'map',KeyG:'galaxy'};
  if(e.code==='KeyE')world.interact();else if(shortcuts[e.code]){e.preventDefault();const next=shortcuts[e.code];if(next==='galaxy'&&(state.zone!=='normandy'||!state.flags.briefed))return toast('La carte galactique se consulte au Normandy après le briefing.');if(next==='squad')ui.selectedCrew=state.party.slice(1);if(next==='equipment')ui.equipmentActor='shepard';openScreen(next);}
});
document.addEventListener('pointerdown',e=>{const key=e.target.closest('[data-key]')?.dataset.key;if(key){e.preventDefault();if(touchKey)world.keys.delete(touchKey);touchKey=key;world.keys.add(key);e.target.setPointerCapture?.(e.pointerId);}});
function releaseTouch(){if(touchKey)world.keys.delete(touchKey);touchKey=null;}
document.addEventListener('pointerup',releaseTouch);document.addEventListener('pointercancel',releaseTouch);
window.addEventListener('beforeunload',()=>{if(running&&!battle)autosave();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!ui.screen)openScreen('pause');});
function frame(now){const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;if(running&&!ui.screen&&!ui.busy&&!document.hidden)state.playedSeconds+=dt;if(battle&&!ui.screen&&!ui.busy){tickBattle(battle,dt);drainEvents();if(battle.winner)finishBattle();}world.update(dt);uiAccumulator+=dt;saveAccumulator+=dt;if(uiAccumulator>.16){uiAccumulator=0;if(running){renderHUD();if(battle)renderCombat();}}if(saveAccumulator>25){saveAccumulator=0;if(running&&!ui.screen&&!battle)autosave();}requestAnimationFrame(frame);}
renderScreen();requestAnimationFrame(frame);
// A test-only harness is excluded from production builds by Vite.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa')){
  window.__RELAY_TEST__={getState:()=>state,getBattle:()=>battle,getWorld:()=>world,getUI:()=>ui,begin:(options={})=>{ui.form={...ui.form,...options};beginGame();},close:()=>closeScreen(),interact:id=>interactPOI(world.getPOIs().find(p=>p.id===id)),startBattle:id=>startEncounter(world.getPOIs().find(p=>p.id===id)),travel:zone=>loadZone(zone),step:dt=>{if(battle){tickBattle(battle,dt);drainEvents();if(battle.winner)finishBattle();}},action:args=>{const r=performAction(battle,args);drainEvents();renderCombat(true);return r;},claim:()=>claimVictory(),ready:()=>finishObjective(),render:()=>{renderHUD();renderScreen();},snapshot:()=>({zone:state?.zone,screen:ui.screen,actors:battle?.actors.map(a=>({id:a.id,hp:a.hp,atb:a.atb})),renderer:{calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles}})};
}

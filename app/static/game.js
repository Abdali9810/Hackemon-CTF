const $=s=>document.querySelector(s),c=$('#c'),g=c.getContext('2d');
const TS=16,W=48,H=32,PAS=[0,1,4,5,7],ZN=['','Pradera Recon','Bosque de Redes','Cumbre Root'],ZC=['','#00c8d4','#e06010','#6020c0'];
const MED=[,'Medalla Lupa','Medalla Paquete','Medalla Root'],mcount=()=>Object.keys(S.medals||{}).length;
let R=[],T=[],S={cap:{},hints:{}},mode='load',A=null,captureResult=null,pendingMedal=null,tm=0,keys={},tmr,modeBeforeMenu='map',modeBeforeConfirm='menu',confirmOk=null,confirmReturnFocus=null,PLAYER='',ADMIN=null,DLG=null,lastZ=0,activeNpcGame=null;
let startCreatures=[],startWaves=[],startWaveAt=0,startWaveCount=0,startLastFrame=0,briefingT0=0,briefingZone=1,briefingMascot=null;
let playerOutfitColor='#2fa84f';
let playerAccessory='cap';
const characters=[
 {id:'byte',name:'BYTE',role:'Exploradora de campo',description:'Su chaqueta de exploración y su compañero brote la ayudan a descubrir pistas escondidas.',pants:'#294c82',hat:'#f4d15b',hatBand:'#d95042',hair:'#53331e',accent:'#ffe17a',outfit:'trail',pet:'#64c95a',skills:['Ojo de codigo · detecta detalles ocultos','Analisis web · experta en aplicaciones']},
 {id:'cipher',name:'CIPHER',role:'Guardiana de sistemas',description:'Lleva una armadura tecnológica con luces de señal y un dron centinela.',pants:'#26334e',hat:'#27324d',hatBand:'#62d9e8',hair:'#372b28',accent:'#75d9e8',outfit:'tech',pet:'#57d9ee',skills:['Lectura de patrones · une pistas','Resolucion metódica de retos']},
 {id:'pixel',name:'PIXEL',role:'Artista de redes',description:'Su capa violeta, bufanda brillante y mascota pixelada siguen el rastro de los datos.',pants:'#69458c',hat:'#f5c2e0',hatBand:'#e56eaa',hair:'#6a3b25',accent:'#ffd166',outfit:'artist',pet:'#f184c4',skills:['Rastreo de red · sigue el flujo de datos','Criptografia · descifra mensajes']}
];
let activeCharacterIndex=0,chosenCharacterId=null;
try{S=JSON.parse(localStorage.getItem('ctfm1'))||S}catch(e){}
if(!S||typeof S!=='object')S={cap:{},hints:{}};
if(!S.cap||typeof S.cap!=='object')S.cap={};
if(!S.hints||typeof S.hints!=='object')S.hints={};
if(!S.minigames||typeof S.minigames!=='object')S.minigames={};
if(S.skin)playerOutfitColor=S.skin;
if(S.accessory==='bow'||S.accessory==='cap')playerAccessory=S.accessory;
if(characters.some(ch=>ch.id===S.character)){chosenCharacterId=S.character;activeCharacterIndex=characters.findIndex(ch=>ch.id===chosenCharacterId)}
const persist=()=>{try{S.skin=playerOutfitColor;S.accessory=playerAccessory;if(chosenCharacterId)S.character=chosenCharacterId;localStorage.setItem('ctfm1',JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const nz=z=>R.filter(r=>r.zona===z&&S.cap[r.id]).length,total=()=>R.filter(r=>S.cap[r.id]).length,unl=z=>z===1||!!ADMIN||nz(z-1)>=4;
const basePts=r=>r.zona===1?100:r.zona===2?150:200;
const revHints=r=>typeof S.hints[r.id]==='number'?Math.min(S.hints[r.id],(r.pistas||[]).length):0;
const revPaidHints=r=>typeof S.paidHints?.[r.id]==='number'?Math.min(S.paidHints[r.id],revHints(r)):revHints(r);
const earned=r=>Math.max(0,basePts(r)-revPaidHints(r)*15);
const score=()=>R.reduce((s,r)=>s+(S.cap[r.id]?earned(r):0),0)+Object.entries(NPC_MINIGAMES).reduce((sum,[id,game])=>sum+(S.minigames[id]?game.rewardPoints:0),0);
const hs=(x,y)=>((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%100;
function trackStartPointer(e){
 if(e.pointerType!=='mouse'||!R.length||matchMedia('(prefers-reduced-motion: reduce)').matches||($('#landing-screen').hidden&&$('#story-screen').hidden&&$('#character-screen').hidden))return;
 const now=performance.now();if(now-startWaveAt<180)return;startWaveAt=now;
 const bounds=$('#start').getBoundingClientRect(),count=Math.min(6,R.length);
 startWaves.push({x:e.clientX-bounds.left,y:e.clientY-bounds.top,started:now,creatures:Array.from({length:count},(_,i)=>R[(startWaveCount+i)%R.length])});
 startWaveCount=(startWaveCount+count)%R.length;if(startWaves.length>4)startWaves.shift()
}
function startEdgePoint(distance,width,height,pad){
 const w=Math.max(1,width-pad*2),h=Math.max(1,height-pad*2),perimeter=2*(w+h);let d=distance%perimeter;
 if(d<w)return{x:pad+d,y:pad,dx:1,dy:0};
 d-=w;if(d<h)return{x:width-pad,y:pad+d,dx:0,dy:1};
 d-=h;if(d<w)return{x:width-pad-d,y:height-pad,dx:-1,dy:0};
 d-=w;return{x:pad,y:height-pad-d,dx:0,dy:-1}
}
function drawStartAmbience(now){
 const characterScreen=!$('#character-screen').hidden,screenVisible=characterScreen||!$('#landing-screen').hidden||!$('#story-screen').hidden;
 if(mode!=='start'||!screenVisible){const canvas=$('#start-world');canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);return}
 const canvas=$('#start-world'),bounds=$('#start').getBoundingClientRect(),width=bounds.width,height=bounds.height;
 if(!width||!height)return;
 const ratio=Math.min(devicePixelRatio||1,2),pixelWidth=Math.round(width*ratio),pixelHeight=Math.round(height*ratio);
 if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight}
 const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,dt=Math.min((now-startLastFrame||16)/1000,.05);startLastFrame=now;
 const pad=22,perimeter=2*(Math.max(1,width-pad*2)+Math.max(1,height-pad*2));
 for(const creature of startCreatures){
  if(!reduced)creature.progress=(creature.progress+creature.speed*dt/perimeter)%1;
  const point=startEdgePoint(creature.progress*perimeter,width,height,pad),bob=reduced?0:Math.sin(now/180+creature.progress*30)*2;
  ctx.fillStyle='#06120c66';ctx.beginPath();ctx.ellipse(point.x,point.y+5,12,3,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.globalAlpha=.9;ctx.translate(point.x,point.y-13+bob);if(point.dx<0)ctx.scale(-1,1);
  ctx.drawImage(mk(creature.r),-12,-12,24,24);ctx.restore()
 }
 if(reduced){startWaves=[];return}
 startWaves=startWaves.filter(wave=>now-wave.started<950);
 for(const wave of startWaves){
  const progress=(now-wave.started)/950,radius=16+progress*112;
  ctx.strokeStyle=`rgba(140,229,181,${(1-progress)*.5})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(wave.x,wave.y,radius,0,Math.PI*2);ctx.stroke();
  wave.creatures.forEach((creature,index)=>{
   const angle=index/wave.creatures.length*Math.PI*2+progress*.25,x=wave.x+Math.cos(angle)*radius,y=wave.y+Math.sin(angle)*radius;
   ctx.globalAlpha=1-progress;ctx.drawImage(mk(creature),x-8,y-8,16,16)
  })
 }
 ctx.globalAlpha=1
}
function toast(s,ms=2800,cls=''){const m=$('#msg');m.className=cls;m.textContent=s;m.style.display='block';clearTimeout(tmr);tmr=setTimeout(()=>m.style.display='none',ms)}
function drawPreview(id,d,ch){const canvas=$(`#${id}`),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(6,6);drawCharacter(ctx,(canvas.width/6-16)/2,(canvas.height/6-16)/2,d,0,ch);ctx.restore()}
function renderCharacterSelection(){const ch=characters[activeCharacterIndex];
 $('#character-count').textContent=`${String(activeCharacterIndex+1).padStart(2,'0')} / ${String(characters.length).padStart(2,'0')}`;
 $('#character-role').textContent=ch.role;$('#character-name').textContent=ch.name;$('#character-description').textContent=ch.description;
 $('#character-skills').innerHTML=ch.skills.map(skill=>{const normalized=skill.charAt(0).toLocaleUpperCase('es')+skill.slice(1);return`<li>${esc(normalized)}</li>`}).join('');
 document.querySelectorAll('.accessory-option').forEach(button=>{const selected=button.dataset.accessory===playerAccessory;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected))});
 $('#select-character').textContent=chosenCharacterId===ch.id?'PERSONAJE ELEGIDO':'ELEGIR ESTE PERSONAJE';
 $('#select-character').disabled=chosenCharacterId===ch.id;$('#begin').disabled=!chosenCharacterId;
 drawPreview('preview-front',0,ch);drawPreview('preview-back',1,ch)}
function browseCharacter(step){activeCharacterIndex=(activeCharacterIndex+step+characters.length)%characters.length;chosenCharacterId=null;renderCharacterSelection()}
function updateMusicButton(enabled){const label=enabled?'Desactivar música':'Activar música';
 const t=$('#music-toggle');t.classList.toggle('off',!enabled);t.setAttribute('aria-pressed',String(enabled));
 const m=$('#menu-music');m.title=label;m.setAttribute('aria-label',label);m.setAttribute('aria-pressed',String(enabled));m.classList.toggle('off',!enabled);
 const ms=$('#menu-music-status');if(ms)ms.textContent=enabled?'Sonando':'Apagada';
 const b=$('#sound-music');b.textContent=enabled?'Música: encendida':'Música: apagada';b.setAttribute('aria-pressed',String(enabled));b.classList.toggle('off',!enabled)}
function refreshPauseMenu(){const caps=$('#menu-stat-caps'),med=$('#menu-stat-medals'),pts=$('#menu-stat-score'),pl=$('#menu-player');
 if(caps)caps.textContent=`${total()}/12`;if(med)med.textContent=`${mcount()}/3`;if(pts)pts.textContent=String(score());
 if(pl)pl.textContent=PLAYER?`Entrenador(a) ${PLAYER}`:'Explorando el mundo'}
function openMenu(){if(!['map','panel','inv'].includes(mode))return;modeBeforeMenu=mode;mode='menu';keys={};refreshPauseMenu();$('#game-menu').style.display='grid';$('#menu-toggle').setAttribute('aria-expanded','true');document.body.classList.add('menu-open');$('#menu-inventory').focus()}
async function toggleMusic(){try{updateMusicButton(await window.HackemonMusic.toggle())}catch(e){console.error('No se pudo cambiar la música.',e);toast('No se pudo cambiar la música en este navegador.',4000)}}
function setSoundPanel(open){$('#sound-panel').hidden=!open;$('#music-toggle').setAttribute('aria-expanded',String(open));if(open){window.HackemonMusic.unlock().catch(()=>{});$('#sound-music').focus()}else $('#music-toggle').focus()}
function initVolumes(){const v=window.HackemonMusic.getVolumes();
 for(const k of ['music','sfx']){const el=$('#vol-'+k),out=$('#vol-'+k+'-val'),show=()=>out.textContent=el.value+'%';el.value=Math.round(v[k]*100);show();
  el.oninput=()=>{show();window.HackemonMusic.setVolume(k,el.value/100)};
  if(k==='sfx')el.onchange=()=>window.HackemonMusic.sfx.step('grass')}}
function closeMenu(){if(mode!=='menu')return;mode=modeBeforeMenu;$('#game-menu').style.display='none';$('#menu-toggle').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');if(mode==='map')$('#menu-toggle').focus();else if(mode==='panel')$('#fl').focus();else if(mode==='inv')$('#inv .trainer-foot button').focus()}
function openGameConfirm(opts){modeBeforeConfirm=mode;confirmReturnFocus=document.activeElement;mode='confirm';confirmOk=opts.onConfirm||null;const panel=$('#game-confirm .game-confirm-panel');panel.dataset.tone=opts.tone||'warn';$('#confirm-eyebrow').textContent=opts.eyebrow||'Asistente del laboratorio';$('#confirm-title').textContent=opts.title||'¿Estás seguro?';$('#confirm-message').textContent=opts.message||'';$('#confirm-yes').textContent=opts.yes||'Sí, continuar';$('#confirm-no').textContent=opts.no||'No, volver';$('#game-confirm').hidden=false;$('#confirm-no').focus()}
function closeGameConfirm(accepted){$('#game-confirm').hidden=true;const back=modeBeforeConfirm;mode=back;const fn=confirmOk,returnFocus=confirmReturnFocus;confirmOk=null;confirmReturnFocus=null;if(accepted&&fn)fn();else if(returnFocus?.isConnected)returnFocus.focus()}
function applyRestart(){S={cap:{},hints:{},minigames:{},skin:playerOutfitColor};persist();P.x=48;P.y=256;P.dir=0;P.mv=0;keys={};closeMenu();if(mode!=='map')mode='map';$('#panel').style.display=$('#inv').style.display='none';window.HackemonMusic.setScene('world');toast('Nueva partida iniciada. ¡Vuelve a resolver los retos!')}
function applyExitToStart(){S={cap:{},hints:{},minigames:{},skin:playerOutfitColor};persist();PLAYER='';ADMIN=null;P.x=48;P.y=256;P.dir=0;P.mv=0;keys={};closeMenu();$('#panel').style.display=$('#inv').style.display='none';$('#dialog').hidden=true;$('#menu-toggle').style.display='none';$('#landing-screen').hidden=false;$('#story-screen').hidden=true;$('#character-screen').hidden=true;$('#start').style.display='grid';mode='start';window.HackemonMusic.setScene('menu')}
function restartChallenges(){openGameConfirm({tone:'warn',eyebrow:'Registro Hackédex',title:'¿Nueva partida?',message:'¿Quieres comenzar otra aventura? Se borrarán todas las criaturas capturadas y tu progreso en el mundo. No podrás recuperarlo.',yes:'Sí, empezar de cero',no:'No, seguir jugando',onConfirm:applyRestart})}
function exitToStart(){openGameConfirm({tone:'exit',eyebrow:'Puerta del laboratorio',title:'¿Volver a la pantalla de inicio?',message:'Se reiniciará la partida y se borrará todo tu avance actual.',yes:'Sí, salir',no:'No, quedarme',onConfirm:applyExitToStart})}
const QUIPS=[
 r=>['¡Vaya, vaya!',`Capturaste a ${r.criatura}, ${PLAYER}. No te pongas la capucha de hacker todavía: hasta un reloj roto acierta dos veces al día.`],
 r=>['¿Fue suerte?',`${r.criatura} ya es tuyo. Los logs dicen que fue habilidad; nosotros preferimos esperar a la auditoría.`],
 r=>['Increíble, en serio',`Atrapaste a ${r.criatura}. Tu mamá estaría orgullosa, ${PLAYER}… si supiera qué es una bandera.`],
 r=>['Mira quién despertó',`${r.criatura} entró en la cápsula sin resistirse. Creo que lo convenció más tu insistencia que tu talento.`]];
let lastQuip=-1;
function pickQuip(r){let i;do i=Math.floor(Math.random()*QUIPS.length);while(i===lastQuip);lastQuip=i;return QUIPS[i](r)}
function captureSuccess(r,msg){closeAll(false);toast(msg);mode='enc';$('#menu-toggle').style.display='none';
 A={kind:'capture',r,k:0,done:()=>{S.cap[r.id]=Date.now();pendingMedal=nz(r.zona)>=4&&!(S.medals||{})[r.zona]?r.zona:null;
  if(pendingMedal){S.medals=S.medals||{};S.medals[r.zona]=Date.now();
   if(R.filter(q=>q.zona===r.zona).every(q=>!S.hints[q.id])){S.pure=S.pure||{};S.pure[r.zona]=Date.now()}}persist();captureResult=r;mode='capture-result';
  const q=r.id===2?['Reto completado','¡Qué sorpresa! Por fin una neurona hizo conexión. Continúa, a ver cuánto te dura la suerte.']:pickQuip(r);
  $('#capture-title').textContent=q[0];$('#capture-text').textContent=q[1];$('#capture-message').style.display='grid';$('#capture-continue').focus()}}}
function showDialog(who,lines,then){mode='dialog';keys={};DLG={who,lines,i:0,then};$('#menu-toggle').style.display='none';$('#dialog-who').textContent=who;$('#dialog-text').textContent=lines[0];$('#dialog').hidden=false}
function nextDialog(){if(!DLG)return;if(++DLG.i<DLG.lines.length){$('#dialog-text').textContent=DLG.lines[DLG.i];return}
 const then=DLG.then;DLG=null;$('#dialog').hidden=true;mode='map';keys={};$('#menu-toggle').style.display='block';if(then)then()}
function openLogin(){if(mode!=='start'||!R.length)return;window.HackemonMusic.unlock().catch(()=>{});mode='login';$('#login-name').value=(()=>{try{return localStorage.getItem('ctfm1-name')||''}catch(e){return ''}})();
 $('#login-pass').value='';$('#login-error').textContent='';syncLogin();$('#login').style.display='grid';$('#login-name').focus()}
function syncLogin(){$('#login-pass-row').hidden=$('#login-name').value.trim()!=='Admin-TR'}
async function submitLogin(e){e.preventDefault();const name=$('#login-name').value.trim(),err=$('#login-error');err.textContent='';
 if(!name){err.textContent='Escribe un nombre de usuario.';return}
 ADMIN=null;
 if(name==='Admin-TR'){const clave=$('#login-pass').value;if(!clave){err.textContent='Este usuario necesita su contraseña.';$('#login-pass').focus();return}
  try{const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:name,clave})}),d=await res.json();
   if(!d.ok){err.textContent=res.status===429?'Demasiados intentos. Espera un minuto.':'Contraseña incorrecta.';return}ADMIN=d.respuestas}
  catch(x){err.textContent='No se pudo contactar al servidor.';return}}
 const character=characters.find(ch=>ch.id===chosenCharacterId)||characters[0];
 const characterSurname=character.name.charAt(0)+character.name.slice(1).toLocaleLowerCase('es');
 PLAYER=`${name} ${characterSurname}`;try{localStorage.setItem('ctfm1-name',name)}catch(x){}
 $('#login').style.display='none';startGame()}
function startGame(){P.characterId=chosenCharacterId;$('#start').style.display='none';window.HackemonMusic.setScene('world');
 if(!S.t0)S.t0=Date.now();persist();
 window.HackemonMusic.start().then(()=>updateMusicButton(true)).catch(e=>{console.error('No se pudo iniciar la música.',e);toast('No se pudo iniciar la música en este navegador.',4000)});
 const lines=[`¡Hola! Me llamo ${PLAYER}.`,
  'Dicen que este mundo es una aventura llena de retos, criaturas digitales y guardias con muy poca paciencia.',
  'Mi plan: resolver cada reto, capturar a los 12 Hackémon y no romper nada que no tenga permiso para romper.'];
 if(ADMIN)lines.push('Modo administrador activado: veo las respuestas, puedo saltar retos y los guardias me dejan pasar. Solo para pruebas.');
 lines.push('¿Listos? ¡Que empiece la aventura!');
 showDialog(PLAYER,lines,()=>toast('Camina hasta una cápsula brillante y pulsa Espacio.',4000))}
const ZONE_BRIEFINGS={
 1:{
  story:'¡Medalla Lupa para ti! Superaste los primeros desafíos y descubriste que las pistas sí sirven; Pikachu agradece que ya no le pidas resolverlo todo. Celebra, entrenador: el Bosque de Redes te espera.'
 },
 2:{
  story:'¡Medalla Paquete conseguida! Encontraste vecinos, reconociste a Apache y pescaste chismes en ICMP y SNMP. El router pide vacaciones; tú puedes presumir hasta que aparezcan DNS, SQL y puertos tímidos.'
 },
 3:{
  story:'¡Lo lograste! Completaste los 12 retos y conquistaste la Cumbre Root. CorpX ha sido derrotada, tus Hackémon están a salvo y el profesor promete no volver a decir “¿probaste reiniciar?”. Bueno… no lo promete.'
 }
};
function drawBriefingMascot(now){const canvas=$('#briefing-mascot');if(!canvas||!briefingMascot)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=now-briefingT0,x=reduced?w/2:w/2+Math.sin(t/430)*13,y=reduced?55:55+Math.sin(t/190)*5;
 ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(x,h-19,17,5,0,0,Math.PI*2);ctx.fill();
 if(!reduced){for(let i=0;i<3;i++){const a=t/520+i*Math.PI*2/3,px=x+Math.cos(a)*27,py=y+Math.sin(a)*20;ctx.fillStyle=i%2?'#ffe566':'#fff';ctx.fillRect(Math.round(px),Math.round(py),3,3)}}
 ctx.drawImage(mk(briefingMascot),Math.round(x-21),Math.round(y-21),42,42)}
function openZoneBriefing(zone,mascot){briefingZone=zone;briefingMascot=mascot||R.find(r=>r.zona===zone);briefingT0=performance.now();const text=ZONE_BRIEFINGS[zone];
 mode='zone-briefing';$('#zone-briefing').hidden=false;$('#menu-toggle').style.display='none';
 $('#zone-briefing-title').textContent=PLAYER?`¡Felicidades, ${PLAYER}!`:'¡Felicidades, entrenador!';
 $('#zone-briefing-kicker').textContent=zone===3?'Liga Hackémon completada · 12/12 retos':`${ZN[zone]} · ${nz(zone)}/${R.filter(r=>r.zona===zone).length} retos`;
 $('#zone-briefing-medal').src=medalImg(zone).toDataURL();$('#zone-briefing-medal-name').textContent=MED[zone];
 $('#briefing-story-text').textContent=text.story;
 const stats=$('#briefing-final-stats');stats.hidden=zone!==3;
 if(zone===3){const hints=Object.values(S.hints||{}).reduce((sum,count)=>sum+count,0),elapsed=Math.floor((Date.now()-(S.t0||Date.now()))/1000);stats.textContent=`Puntuación: ${score()} pts · Medallas: ${mcount()}/3 · Pistas usadas: ${hints} · Tiempo: ${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;$('#zone-briefing-continue').textContent='¡Seguir explorando!'}
 else $('#zone-briefing-continue').textContent='¡Listo para la siguiente zona!';
 drawBriefingMascot(performance.now());$('#zone-briefing-continue').focus();window.HackemonMusic.sfx.caught?.()}
function closeZoneBriefing(){S[`briefingZ${briefingZone}`]=Date.now();persist();$('#zone-briefing').hidden=true;mode='map';$('#menu-toggle').style.display='block';burst(P.x+8,P.y+8,ZC[briefingZone],40);toast(`¡${MED[briefingZone]} conseguida${(S.pure||{})[briefingZone]?' · sin pistas':''}! Completaste ${ZN[briefingZone]} · [I] inventario`,6000)}
function continueAfterCapture(){if(mode!=='capture-result')return;$('#capture-message').style.display='none';window.HackemonMusic.setScene('world');
 const medalEarned=pendingMedal,capturedCreature=captureResult,capturedName=captureResult?.criatura;pendingMedal=null;captureResult=null;
 if((medalEarned===1||medalEarned===2||medalEarned===3&&total()===12)&&!S[`briefingZ${medalEarned}`]){openZoneBriefing(medalEarned,capturedCreature);return}
 mode='map';$('#menu-toggle').style.display='block';
 if(medalEarned){window.HackemonMusic.sfx.caught();burst(P.x+8,P.y+8,ZC[medalEarned],40);toast(`¡${MED[medalEarned]} conseguida${(S.pure||{})[medalEarned]?' · sin pistas':''}! Completaste ${ZN[medalEarned]} · [I] inventario`,6000)}
 else if(capturedName)toast(`¡Capturaste a ${capturedName}! (${total()}/12) · [I] inventario`,4000);
 if(total()===12){const hh=Object.values(S.hints||{}).reduce((a,b)=>a+b,0),s=Math.floor((Date.now()-(S.t0||Date.now()))/1000);
  $('#liga-stats').innerHTML=`Puntuación: <b>${score()} pts</b> · Medallas: ${mcount()}/3 · Pistas usadas: ${hh} · Tiempo: ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  $('#liga').style.display='grid';mode='liga';$('#liga-continue').focus()}}
function build(){
 for(let y=0;y<H;y++){T[y]=[];for(let x=0;x<W;x++){const n=hs(x,y),z3=x>=33;let v=z3?5:0;
  if(x===0||y===0||x===W-1||y===H-1)v=z3?6:2;else if([15,16,31,32].includes(x))v=3;
  else if(n<12)v=z3?6:2;else if(n<24&&!z3)v=1;else if(n>95&&!z3)v=7;T[y][x]=v}}
 for(let x=1;x<W-1;x++)T[16][x]=4;
 R.forEach(r=>{for(let y=Math.min(r.y,16);y<=Math.max(r.y,16);y++)T[y][r.x]=4;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=r.x+dx,Y=r.y+dy;if([2,6].includes(T[Y][X]))T[Y][X]=X>=33?5:0}});
 GD.forEach(d=>T[15][d.x-1]=4);buildMini()}
let MINI=null;
function buildMini(){MINI=document.createElement('canvas');MINI.width=96;MINI.height=64;const m=MINI.getContext('2d');
 const C={0:'#4a9a44',1:'#3a7a34',2:'#245824',3:'#3890f8',4:'#d8c090',5:'#a89878',6:'#4a4a52',7:'#58b848'};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){m.fillStyle=C[T[y][x]]||'#4a9a44';m.fillRect(x*2,y*2,2,2)}}
function drawMini(){const mn=$('#mini');if(!mn||!MINI)return;const m=mn.getContext('2d');m.drawImage(MINI,0,0);
 R.forEach(r=>{if(!S.cap[r.id]){m.fillStyle=ZC[r.zona];m.fillRect(r.x*2-1,r.y*2-1,3,3)}});
 m.fillStyle='#fff';m.fillRect(Math.round(P.x/8)-1,Math.round(P.y/8)-1,3,3)}
function tile(v,x,y,tx,ty){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 const sw=Math.round(Math.sin(tm/16+tx*0.8+ty*0.4));
 const aut=tx>=17&&tx<=30;
 if([0,1,2,7].includes(v)){f(aut?'#c8882a':'#58b848',0,0,16,16);if((tx*3+ty)%4===0){f(aut?'#d8a040':'#68c858',3+sw,4,2,2);f(aut?'#a06820':'#48a038',11+sw,10,2,1)}}
 if(v===5||v===6){f('#a89878',0,0,16,16);if((tx+ty*2)%3===0){f('#988868',4,5,3,2);f('#b8a888',10,11,2,2)}}
 if(v===1){f(aut?'#b04020':'#3c9a3c',2+sw,6,2,6);f(aut?'#b04020':'#3c9a3c',7+sw,4,2,8);f(aut?'#b04020':'#3c9a3c',12+sw,7,2,5);f(aut?'#f0a030':'#78d868',3+sw,6,1,3);f(aut?'#f0a030':'#78d868',8+sw,4,1,3)}
 if(v===7){const c=aut?(hs(tx,ty)%2?'#e84828':'#f8c038'):(hs(tx,ty)%2?'#f85878':'#c868f8');f(aut?'#8a6020':'#2f8f3f',7+sw,8,1,7);f(aut?'#8a6020':'#2f8f3f',5+sw,11,2,1);f(c,5+sw,4,5,1);f(c,7+sw,2,1,5);f(aut?'#f0a030':'#f8d030',7+sw,4,1,1)}
 if(v===2){f(aut?'#8a3818':'#1e421e',1,9,14,5);f(aut?'#c04820':'#2f6f2f',2,2,12,8);f(aut?'#8a3818':'#1e421e',1,4,1,5);f(aut?'#8a3818':'#1e421e',14,4,1,5);f(aut?'#d86028':'#3d8b3d',4+sw,1,7,3);f(aut?'#e07830':'#4da04d',3+sw,5,2,2);f(aut?'#e07830':'#4da04d',10+sw,6,2,2);f('#5a3a20',6,11,4,5);f('#7a5a35',7,11,2,4);f(aut?'#c8882a':'#58b848',0,14,16,2)}
 if(v===6){f('#4a4a52',1,10,14,4);f('#6b6b73',1,3,14,8);f('#8a8a94',3,4,6,3)}
 if(v===3){f('#3890f8',0,0,16,16);const o=(Math.floor(tm/12)+tx*3)%8;f('#88c8ff',o,5,4,1);f('#88c8ff',(o+6)%12,11,3,1);
  const ph=(Math.floor(tm/5)+hs(tx,ty)*3)%90;if(ph<10){const fy=Math.round(Math.sin(ph/10*Math.PI)*6);f('#e8f0e0',7,9-fy,3,2);f('#10161a',9,9-fy,1,1);if(fy<3)f('#bfe8ff',5,12,7,1)}}
 if(v===4){if([15,16,31,32].includes(tx)){f('#a8783c',0,0,16,16);f('#7a5428',0,5,16,1);f('#7a5428',0,11,16,1)}else{f('#d8c090',0,0,16,16);f('#c8b080',3,3,2,2);f('#e8d0a0',10,9,2,2)}}}
function ball(x,y,r,rot,col){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=col||'#2f9fb0';g.beginPath();g.arc(0,0,r,Math.PI,0);g.fill();
 g.fillStyle='#f8f8f8';g.beginPath();g.arc(0,0,r,0,Math.PI);g.fill();g.fillStyle='#222';g.fillRect(-r,-1,2*r,2);
 g.fillStyle='#f8d030';g.beginPath();g.arc(0,0,r*.35,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=1;g.stroke();g.restore()}
function spr(x,y,d,fr){const ch=characters.find(item=>item.id===P.characterId)||characters[0];drawCharacter(g,x,y,d,fr,ch)}
function drawCharacter(ctx,x,y,d,fr,ch){const f=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f(ch.pants,4,10,3,5-(fr===1?1:0));f(ch.pants,9,10,3,5-(fr===2?1:0));f(playerOutfitColor,3,6,10,5);f('#f0c8a0',2,7,1,3);f('#f0c8a0',13,7,1,3);
 if(ch.outfit==='trail'){f(playerOutfitColor,3,6,3,2);f(playerOutfitColor,10,6,3,2);f('#f3d37e',7,6,2,5);f('#a74836',4,8,2,3);f('#f4d15b',9,8,2,1);f('#f4d15b',9,10,2,1);if(d===1)f('#a74836',11,7,4,4)}
 else if(ch.outfit==='tech'){f(playerOutfitColor,3,6,10,4);f('#62d9e8',4,6,2,1);f('#62d9e8',10,6,2,1);f('#75d9e8',7,7,2,2);f('#9ef4f4',7,10,2,1);f('#f5bc35',4,9,2,1);f('#f5bc35',10,9,2,1);if(d===1)f('#62d9e8',5,7,6,2)}
 else{f(playerOutfitColor,3,6,10,5);f('#f184c4',3,6,3,2);f('#f184c4',10,6,3,2);f('#ffd166',7,8,2,1);f('#ffd166',7,10,2,1);f('#f184c4',4,10,2,1);f('#f184c4',10,10,2,1);if(d===1)f('#f184c4',4,7,8,1)}
 f(ch.hair,4,1,8,6);if(d!==1)f('#f0c8a0',4,2,8,5);else f(ch.hair,4,1,8,5);
 if(playerAccessory==='bow'){f(ch.outfit==='tech'?'#65dff0':ch.outfit==='artist'?'#f184c4':'#ed5b91',3,0,4,2);f(ch.outfit==='tech'?'#65dff0':ch.outfit==='artist'?'#f184c4':'#ed5b91',9,0,4,2);f('#fff0c8',4,0,2,1);f('#fff0c8',10,0,2,1);f(ch.accent,7,1,2,2)}
 else{f(ch.hat,4,0,8,2);f(ch.hat,2,2,12,2);f(ch.hatBand,3,3,10,1);f(ch.accent,7,1,2,1);f(ch.hatBand,1,4,14,1)}
 if(ch.outfit==='tech'){f(ch.accent,2,5,1,2);f(ch.accent,13,5,1,2)}
 else if(ch.outfit==='artist'){f('#f184c4',3,5,10,1);f('#ffd166',3,6,2,1)}
 else{f('#e7c56a',3,5,10,1);f('#a74836',2,6,1,2)}
 if(fr!==1){const px=ch.outfit==='tech'?12:2,py=ch.outfit==='artist'?8:7;f(ch.pet,px,py,3,3);f('#fff',px+1,py,1,1);f('#26334e',px+1,py+1,1,1)}
 else{f(ch.pet,6,8,4,3);f('#fff',7,8,1,1);f('#26334e',8,9,1,1)}
 if(d===0){f('#222',6,4,1,1);f('#222',9,4,1,1)}if(d===2)f('#222',5,4,1,1);if(d===3)f('#222',10,4,1,1)}
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cc={},cs={};
function mk(r){if(cc[r.id])return cc[r.id];const q=rng(r.id*7919+13),k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d'),hue=(r.id*47)%360;
 const m=[];for(let j=0;j<8;j++){m[j]=[];for(let i=0;i<4;i++)m[j][i]=((j>1&&j<7&&i>0)?q()<.7:q()<.3)?1:0}
 m[3][2]=m[3][3]=m[4][2]=m[4][3]=m[5][2]=m[5][3]=1;const G=Array.from({length:10},()=>Array(10).fill(0));
 for(let j=0;j<8;j++)for(let i=0;i<8;i++)G[j+1][i+1]=m[j][i<4?i:7-i];
 for(let j=0;j<10;j++)for(let i=0;i<10;i++){if(G[j][i]){x.fillStyle=`hsl(${hue},65%,58%)`;x.fillRect(i,j,1,1)}
  else if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>G[j+b]&&G[j+b][i+a])){x.fillStyle=`hsl(${hue},60%,28%)`;x.fillRect(i,j,1,1)}}
 x.fillStyle=`hsl(${hue},75%,82%)`;x.fillRect(3,3,1,1);x.fillStyle='#fff';x.fillRect(3,4,1,1);x.fillRect(6,4,1,1);x.fillStyle='#111';x.fillRect(3,5,1,1);x.fillRect(6,5,1,1);
 return cc[r.id]=k}
function sil(r){if(cs[r.id])return cs[r.id];const k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d');x.drawImage(mk(r),0,0);x.globalCompositeOperation='source-in';x.fillStyle='#10161a';x.fillRect(0,0,10,10);return cs[r.id]=k}
function tint(r,col){const k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d');x.drawImage(mk(r),0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,10,10);return k}
function challengeLogo(r){const k=document.createElement('canvas');k.width=k.height=56;const x=k.getContext('2d'),zc=ZC[r.zona]||'#58b848';x.fillStyle='#16241c';x.fillRect(0,0,56,56);x.strokeStyle='#47745b';x.lineWidth=2;x.strokeRect(1,1,54,54);x.fillStyle=zc;x.beginPath();x.arc(28,28,23,0,7);x.fill();x.fillStyle='#e8f0e0';x.fillRect(6,27,44,2);x.strokeStyle='#3b5b3b';x.lineWidth=1;x.beginPath();x.arc(28,28,23,0,7);x.stroke();x.fillStyle='#f8d030';x.beginPath();x.arc(28,28,6,0,7);x.fill();x.strokeStyle='#3b5b3b';x.stroke();x.drawImage(mk(r),15,15,26,26);return k.toDataURL()}
const DL_ICO='<svg class="challenge-dl-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v8m0 0 2.5-2.5M12 13l-2.5-2.5M6 19h12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
const challengeDl=(href,label,title)=>`<a class="challenge-dl-btn" href="${esc(href)}" download title="${esc(title)}">${DL_ICO}<span>${esc(label)}</span></a>`;
const challengeHintHtml=(pistas,n)=>Array.from({length:n},(_,i)=>`<p class="challenge-hint-line"><b>Pista ${i+1}:</b> ${esc(pistas[i])}</p>`).join('');
function pureImg(){const k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d');
 x.fillStyle='#f8d030';[[4,0,2,2],[3,2,4,2],[1,4,8,2],[3,6,4,2],[4,8,2,2]].forEach(([a,b,w,h])=>x.fillRect(a,b,w,h));return k}
function medalImg(z){const k=document.createElement('canvas');k.width=k.height=12;const x=k.getContext('2d');
 x.fillStyle='#b04040';x.fillRect(4,0,2,4);x.fillRect(7,0,2,4);
 x.fillStyle=ZC[z];x.beginPath();x.arc(6,8,4,0,7);x.fill();x.strokeStyle='#f8f8f8';x.lineWidth=1;
 if(z===1){x.strokeRect(4,5,4,4);x.beginPath();x.moveTo(8,9);x.lineTo(10,11);x.stroke()}
 else if(z===2){x.strokeRect(4,5,5,5);x.fillStyle='#f8f8f8';x.fillRect(5,7,3,1);x.fillRect(2,3,2,2);x.fillRect(9,9,2,2)}
 else{x.fillStyle='#f8f8f8';x.fillRect(4,6,4,1);x.fillRect(5,7,1,1);x.fillRect(7,9,3,1)}
 return k}
const GD=[{z:2,x:15},{z:3,x:31}],gpos=d=>unl(d.z)?{x:d.x-1,y:15}:{x:d.x,y:16};
function guardAt(tx,ty){return GD.find(d=>{const q=gpos(d);return q.x===tx&&q.y===ty})}
const GQ=[
 (zn,n,who)=>`Guardia: ¿${who} queriendo cruzar con ${n}/4 criaturas de ${zn}? Qué valiente. Vuelve cuando tengas las 4 y no solo autoestima.`,
 (zn,n,who)=>`Guardia: Este puente tiene firewall y soy yo. Regla única: las 4 criaturas de ${zn}. Llevas ${n}/4, ${who}. Sí, sé contar.`,
 (zn,n,who)=>`Guardia: Acceso denegado, ${who}. Ni con sudo pasas. Captura las 4 criaturas de ${zn} (llevas ${n}/4) y hablamos.`,
 (zn,n,who)=>`Guardia: Otra vez tú, ${who}. Insistir no es un exploit válido. Te faltan ${4-n} criaturas de ${zn}.`];
const ADMIN_GQ=[
 (zn,n,who,medals,captures)=>`Guardia: ¡${who}! El pase de administrador para ${zn} está aprobado. No es favoritismo; es miedo a que me reinicies.`,
 (zn,n,who,medals,captures)=>`Guardia: Puedes pasar a ${zn}, ${who}. Veo que ${n}/4 Hackémon ya están registrados; el resto puede seguir fingiendo que no te vio.`,
 (zn,n,who,medals,captures)=>`Guardia: Acceso autorizado por ADMIN. ${who}, tu auditoría está en ${medals}/3 medallas y ${captures}/12 capturas. No pongas eso en mi evaluación.`,
 (zn,n,who,medals,captures)=>`Guardia: Adelante hacia ${zn}. El protocolo dice “verificar permisos”; el mío dice “no discutir con quien puede cambiar la configuración”.`,
 (zn,n,who,medals,captures)=>`Guardia: Credenciales de administrador confirmadas, ${who}. Yo vigilo la puerta y tú vigilas que no se caiga el servidor. Trato hecho.`,
 (zn,n,who,medals,captures)=>`Guardia: Pase a ${zn}, ${who}. Con ${captures} Hackémon capturados ya tienes más equipo que yo personal de seguridad.`
];
let lastGQ=-1,lastAdminGQ=-1;
function guardTalk(d){if(tm-lastT<=90)return;lastT=tm;const z=d.z-1;if(unl(d.z)){if(ADMIN){let i;do i=Math.floor(Math.random()*ADMIN_GQ.length);while(i===lastAdminGQ&&ADMIN_GQ.length>1);lastAdminGQ=i;toast(ADMIN_GQ[i](ZN[d.z],nz(z),PLAYER,mcount(),total()),7000)}
 else toast(`Guardia: ¡Bien hecho, ${PLAYER}! Puedes cruzar hacia ${ZN[d.z]}.`,7000);return}
 window.HackemonMusic.sfx.guardDenied();
 let i;do i=Math.floor(Math.random()*GQ.length);while(i===lastGQ);lastGQ=i;toast(GQ[i](ZN[z],nz(z),PLAYER),8000)}
function guard(x,y,open){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f('#1c2a4a',4,10,3,5);f('#1c2a4a',9,10,3,5);f('#2c4a8a',3,6,10,5);f('#f8d030',7,7,2,2);f('#1c2a4a',3,9,10,1);
 f('#f0c8a0',2,7,1,3);f('#f0c8a0',13,7,1,3);f('#f0c8a0',4,1,8,6);f('#1c2a4a',3,0,10,3);f('#2c4a8a',3,3,10,1);f('#f8d030',7,1,2,1);
 f('#222',6,4,1,1);f('#222',9,4,1,1);f('#8a5a2a',6,6,4,1);
 if(!open){f('#8a6a3a',14,-4,1,18);f('#c8c8d0',13,-6,3,3)}else{f('#8a6a3a',0,-2,1,16);f('#c8c8d0',-1,-4,3,3)}
 if(!open){g.fillStyle='#fff';g.font='bold 9px monospace';g.fillText('!',x+6,y-7+Math.sin(tm/8)*1.5)}}
const P={x:48,y:256,dir:0,mv:0,characterId:null},DD=[[0,1],[0,-1],[-1,0],[1,0]];let lastT=0;
function can(tx,ty){if(tx<0||ty<0||tx>=W||ty>=H)return false;
 const gd=guardAt(tx,ty);if(gd){guardTalk(gd);return false}
 for(const n of NPCS){const p=npcPos(n);if(p.x===tx&&p.y===ty){npcTalk(n);return false}}
 return PAS.includes(T[ty][tx])}
function update(){if(clownWalk){if(clownWalk.mv){const gtx=clownWalk.tx*16,gty=clownWalk.ty*16,ddx=gtx-clownWalk.px,ddy=gty-clownWalk.py,d2=Math.hypot(ddx,ddy);if(d2<=1){clownWalk.px=gtx;clownWalk.py=gty;clownWalk.mv=0;}else{clownWalk.px+=ddx/d2;clownWalk.py+=ddy/d2;}return;}const cx=Math.round(clownWalk.px/16),cy=Math.round(clownWalk.py/16);if(cx===clownWalk.gx&&cy===clownWalk.gy){P.dir=3;clownWalk=null;showDialog('El Payaso Ops',[`Vaya, vaya... ${PLAYER||'entrenador'}. ¿Así que lo lograste?`,'Rompiste el SSH. Pillaste las credenciales. Entraste al sistema.','El sufrimiento de los estudiantes me mantiene joven jajajaja...','...pero tú ya no eres uno de ellos.','¿Quieres volverte admin?','Jajajaja. Ya lo eres. Bienvenido al otro lado del firewall.'],()=>{$('#liga').style.display='grid';mode='liga'});return;}const dx=clownWalk.gx-cx,dy=clownWalk.gy-cy;const ord=dx!==0?[[Math.sign(dx),0],[0,1],[0,-1]]:[[0,Math.sign(dy)],[1,0],[-1,0]];for(const[nx,ny]of ord){const ntx=cx+nx,nty=cy+ny;if(T[nty]&&PAS.includes(T[nty][ntx])){clownWalk.tx=ntx;clownWalk.ty=nty;clownWalk.mv=1;return;}}return;}if(P.mv>0){const d=DD[P.dir];P.x+=d[0]*2;P.y+=d[1]*2;P.mv-=2;return}
 const k=keys,dir=(k.arrowdown||k.s)?0:(k.arrowup||k.w)?1:(k.arrowleft||k.a)?2:(k.arrowright||k.d)?3:-1;if(dir<0)return;
 P.dir=dir;const d=DD[dir],tx=P.x/16+d[0],ty=P.y/16+d[1];if(can(tx,ty)){P.mv=16;window.HackemonMusic.sfx.step(surface(tx,ty))}}
function surface(tx,ty){const v=T[ty][tx];return v===4?([15,16,31,32].includes(tx)?'wood':'dirt'):v===5?'stone':'grass'}
function near(){const tx=Math.round(P.x/16),ty=Math.round(P.y/16);return R.find(r=>Math.abs(r.x-tx)+Math.abs(r.y-ty)<=1)}
function decor(x,y,tx,ty){const v=T[ty][tx],z=tx<15?1:tx<31?2:3,f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 if(hs(tx,ty)%9!==0)return;const t=hs(ty,tx)%3;
 if(z===1&&v===0){
  if(t===0){f('#e8e0d0',4,4,8,10);f('#9a9284',5,6,6,1);f('#9a9284',5,8,6,1);f('#9a9284',5,10,4,1)}
  else if(t===1){g.strokeStyle='#2c3e50';g.lineWidth=1;g.strokeRect(x+3.5,y+3.5,6,6);f('#7ec8f0',4,4,4,4);f('#2c3e50',9,9,3,3)}
  else{f('#3a5a3a',5,4,2,3);f('#3a5a3a',9,9,2,3);f('#3a5a3a',5,11,2,2);f('#3a5a3a',9,5,2,2)}}
 else if(z===2&&v===0){
  if(t===0){f('#26334e',3,9,10,4);f('#75d9e8',5,10,6,1);f('#75d9e8',5,12,3,1)}
  else if(t===1){f('#3a4a5a',7,4,2,9);f('#75d9e8',6,2,4,2);f('#75d9e8',3,5,1,2);f('#75d9e8',12,5,1,2)}
  else{f('#2c3e50',3,7,10,2);f('#f5bc35',3+(Math.floor(tm/8)+tx*2)%11,6,2,3)}}
 else if(z===3&&v===5){
  if(t===0){f('#10161a',3,4,10,8);f('#38a96b',4,6,3,1);f('#38a96b',4,8,5,1)}
  else if(t===1){f('#c8a028',6,4,4,3);f('#8a7018',4,7,8,6);f('#f8e8a0',7,9,2,2)}
  else{f('#e8e8e8',5,3,6,5);f('#10161a',6,5,1,1);f('#10161a',9,5,1,1);f('#e8e8e8',6,9,4,3);f('#10161a',7,10,1,1);f('#10161a',9,10,1,1)}}}
const FX=[];
function burst(x,y,col,n=24){for(let i=0;i<n;i++){const a=Math.random()*7,s=1+Math.random()*2;FX.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,l:30+Math.random()*20,c:Math.random()<.5?col:'#fff'})}}
function drawFX(cx,cy){for(let i=FX.length-1;i>=0;i--){const p=FX[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.04;if(--p.l<0){FX.splice(i,1);continue}g.globalAlpha=Math.min(1,p.l/20);g.fillStyle=p.c;g.fillRect(p.x-cx,p.y-cy,2,2)}g.globalAlpha=1}
function drawMap(){const cx=Math.max(0,Math.min(W*16-240,P.x+8-120)),cy=Math.max(0,Math.min(H*16-160,P.y+8-80));
 for(let ty=Math.floor(cy/16);ty<Math.ceil((cy+160)/16);ty++)for(let tx=Math.floor(cx/16);tx<Math.ceil((cx+240)/16);tx++){const X=tx*16-cx,Y=ty*16-cy;tile(T[ty][tx],X,Y,tx,ty);decor(X,Y,tx,ty)}
 const nr=near();
 R.forEach(r=>{const x=r.x*16-cx,y=r.y*16-cy,done=S.cap[r.id];g.fillStyle='#555';g.fillRect(x+3,y+11,10,4);
  g.fillStyle='#6b4a2a';g.fillRect(x+22,y+8,2,7);
  g.fillStyle='#3a2010';g.fillRect(x+16,y,14,8);
  g.fillStyle=done?'#887040':'#c09040';g.fillRect(x+17,y+1,12,6);
  g.fillStyle=done?'#998050':'#d4a850';g.fillRect(x+17,y+2,12,1);
  g.font='bold 7px monospace';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#1a0a02';g.fillText(String(r.id),x+24,y+5);
  g.fillStyle='#fffaf0';g.fillText(String(r.id),x+23,y+4);
  g.textAlign='left';g.textBaseline='alphabetic';
  if(!done){g.globalAlpha=.25+.2*Math.sin(tm/10+r.id);g.fillStyle='#fff';g.beginPath();g.arc(x+8,y+6,9,0,7);g.fill();g.globalAlpha=1}
  ball(x+8,y+6,5,0,done?'#777':ZC[r.zona]);if(done){g.fillStyle='#fff';g.font='bold 8px monospace';g.fillText('✓',x+5,y+4)}
  if(r===nr&&!done){g.fillStyle='#fff';g.font='bold 9px monospace';g.fillText('!',x+6,y-4+Math.sin(tm/6)*1.5)}});
 GD.forEach(d=>{const q=gpos(d);guard(q.x*16-cx,q.y*16-cy-4,unl(d.z))});
 NPCS.forEach(n=>{const p=npcPos(n);const wx=(n.draw==='clown'&&clownWalk)?clownWalk.px:p.x*16,wy=(n.draw==='clown'&&clownWalk)?clownWalk.py:p.y*16;NPC_DRAW[n.draw](wx-cx,wy-cy-4);
  if(Math.abs(wx/16-Math.round(P.x/16))+Math.abs(wy/16-Math.round(P.y/16))<=2){g.fillStyle='#fff';g.font='bold 9px monospace';g.fillText('!',wx-cx+6,wy-cy-8+Math.sin(tm/8)*1.5)}});
 spr(P.x-cx,P.y-cy-4,P.dir,P.mv>0?(Math.floor(P.mv/4)%2?1:2):0);
 drawFX(cx,cy);
 const dayA=.05+.05*Math.sin(tm/5400);if(dayA>0.01){g.fillStyle=`rgba(10,20,60,${dayA})`;g.fillRect(0,0,240,160)}
 const z=P.x<240?1:P.x<496?2:3;if(lastZ&&z!==lastZ&&mode==='map')toast(`— ${ZN[z]} —`,1800,'zone');lastZ=z;window.HackemonMusic.setZone&&window.HackemonMusic.setZone(z);
 const h=$('#hud'),txt=`${PLAYER}${ADMIN?' [ADMIN]':''} · ${ZN[z]} · ${total()}/12 · ${mcount()}/3 medallas · ${score()} pts`;if(h.textContent!==txt)h.textContent=txt;
 drawMini()}
const FISH_LINES=[
 'Los guardias no muerden, solo bloquean. Captura las 4 criaturas de tu zona y te dejarán pasar.',
 'Espacio abre una cápsula, I el inventario, M el menú y N el minimapa. Fácil, ¿no?',
 'Cada pista cuesta 15 puntos. Piensa dos veces antes de pedir una.',
 'Recuerdo cuando solía programar y hackear redes… qué buenos tiempos. Ahora solo pesco paquetes.',
 'Espero que estés usando el cerebro y no solo la IA, jaja.',
 'Aquí los peces saltan sin que nadie les haga ping. Cosas del río.',
 'Antes de pedir una pista, inténtalo una vez más. Mi récord de espera por un pez es de 40 años y contando.',
 'Si un reto te pide una descarga, el botón está en su cápsula. Y no, no puedo enseñarte a pescar flags.'];
const GIRL_LINES=[
 'Las imágenes guardan secretos: exiftool o strings revelan lo que el ojo no ve.',
 'Un nslookup cuenta como reconocimiento pasivo. Preguntar no es atacar.',
 'El campo Comment de un PNG es clásico para esconder banderas.',
 'Me encanta este jardín: cada píxel puede ser una pista.',
 'Si te atascas, cambia de herramienta, no de reto.'];
const HACKER_LINES=[
 'Enumerar primero, atacar después. gobuster antes que sqlmap, joven.',
 "Una comilla simple puede romper un login entero. Pruébalo: admin'--",
 'El port knocking es un saludo secreto: golpea los puertos en el orden correcto.',
 'Las cabeceras HTTP hablan. curl -i y escucha.',
 'En mi época el root se ganaba con paciencia, no con pistas.'];
const NPC_MINIGAMES={
 detective:{title:'Ojo de detective',kicker:'Niña detective · 3 hallazgos rápidos',rewardZone:1,rewardPoints:15,questions:[
  {prompt:'¿Dónde revisarías un comentario oculto en una imagen?',choices:['En sus metadatos','En el volumen del parlante','En la papelera'],answer:'En sus metadatos'},
  {prompt:'¿Qué herramienta sirve para consultar registros DNS?',choices:['nslookup','La caña de pescar','Un cronómetro'],answer:'nslookup'},
  {prompt:'¡Caso relámpago! ¿Qué herramienta ayuda a leer metadatos?',choices:['exiftool','ping','calculadora'],answer:'exiftool'}
 ]},
 fisherman:{title:'Pesca el paquete',kicker:'Viejo pescador · 3 capturas rápidas',rewardZone:2,rewardPoints:20,questions:[
  {prompt:'¿Qué opción de Nmap descubre hosts sin escanear puertos?',choices:['-sn','-sV','-p 80'],answer:'-sn'},
  {prompt:'¿Qué puerto revisas para encontrar el Apache del reto?',choices:['80','7','65000'],answer:'80'},
  {prompt:'SNMP suele viajar por…',choices:['UDP','SMTP','Bluetooth'],answer:'UDP'}
 ]},
 retired:{title:'Plan de hacker retirado',kicker:'Hacker retirado · 3 decisiones rápidas',rewardZone:3,rewardPoints:25,questions:[
  {prompt:'Para encontrar directorios web, ¿qué herramienta va primero?',choices:['gobuster','base32','la caña'],answer:'gobuster'},
  {prompt:'La captura muestra golpes a varios puertos. ¿Qué debes anotar?',choices:['El orden de los puertos','El color del cable','La hora del almuerzo'],answer:'El orden de los puertos'},
  {prompt:'Antes de probar el servicio oculto, lo más sensato es…',choices:['Revisar la captura y ordenar la secuencia','Adivinar a gritos','Escanear todo Internet'],answer:'Revisar la captura y ordenar la secuencia'}
 ]}
};
const CLOWN_LINES=[
 'El sufrimiento de los estudiantes me mantiene joven jajajaja'];
const NPCS=[
 {x:6,y0:14,y1:24,who:'Niña detective',lines:GIRL_LINES,draw:'girl',game:'detective',last:-1},
 {x:17,y0:12,y1:26,who:'Viejo pescador',lines:FISH_LINES,draw:'fisher',game:'fisherman',last:-1},
 {x:40,y0:12,y1:26,who:'Hacker retirado',lines:HACKER_LINES,draw:'hacker',game:'retired',last:-1},
 {x:46,y0:12,y1:26,who:'El Payaso Ops',lines:CLOWN_LINES,draw:'clown',last:-1}];
const npcPos=n=>{for(let y=n.y0;y<n.y1;y++)if(T[y]&&(T[y][n.x]===0||T[y][n.x]===5))return{x:n.x,y};return{x:n.x,y:n.y0}};
let lastNPC=0;
function renderNpcMinigame(feedback=''){if(!activeNpcGame)return;const game=activeNpcGame.config,complete=activeNpcGame.index>=game.questions.length;
 $('#npc-game-kicker').textContent=game.kicker;$('#npc-game-title').textContent=game.title;$('#npc-game-prize').textContent=`+${game.rewardPoints} PTS`;
 $('#npc-game-progress').textContent=complete?'¡Reto superado!':`Pregunta ${activeNpcGame.index+1} de ${game.questions.length}`;
 $('#npc-game-track-fill').style.width=`${Math.min(100,activeNpcGame.index/game.questions.length*100)}%`;
 const prompt=$('#npc-game-prompt'),choices=$('#npc-game-choices'),status=$('#npc-game-feedback');status.className='npc-game-feedback';status.textContent=feedback;
 if(complete){$('#npc-game-track-fill').style.width='100%';prompt.textContent=`¡Ronda perfecta! Te llevas ${game.rewardPoints} puntos extra. ${activeNpcGame.npc.who} confirma que esta vez sí lo lograste.`;
  choices.innerHTML='<button class="npc-game-choice npc-game-choice--success" id="npc-game-close" type="button">¡Cobrar mis puntos!</button>';
  $('#npc-game-close').onclick=closeNpcMinigame;$('#npc-game-close').focus();return}
 const q=game.questions[activeNpcGame.index];prompt.textContent=q.prompt;
 const options=q.choices.map(label=>({label,correct:label===q.answer})).sort(()=>Math.random()-.5);
 choices.innerHTML=options.map((option,i)=>`<button class="npc-game-choice" type="button" data-correct="${option.correct}">${esc(option.label)}</button>`).join('');
 choices.querySelectorAll('button').forEach(button=>button.onclick=()=>{if(button.dataset.correct==='true'){activeNpcGame.index++;
   if(activeNpcGame.index===game.questions.length){S.minigames[activeNpcGame.npc.game]=Date.now();persist()}
   renderNpcMinigame(['¡Zas! Dato a la canasta.','¡Buena pesca!','¡El profesor finge que no está impresionado!'][Math.floor(Math.random()*3)])}
  else{status.textContent=['¡Ese dato se escapó! Prueba otra vez.','Casi… el paquete correcto está en otra caña.','¡Pescaste una bota! Inténtalo de nuevo.'][Math.floor(Math.random()*3)];status.classList.add('bad')}});
 choices.querySelector('button').focus()}
function startNpcMinigame(n){const config=NPC_MINIGAMES[n.game];if(!config||S.minigames[n.game])return false;
 activeNpcGame={npc:n,config,index:0};mode='npc-minigame';keys={};$('#menu-toggle').style.display='none';$('#npc-minigame').hidden=false;renderNpcMinigame(`¡Tres aciertos y ganas ${config.rewardPoints} puntos!`);return true}
function closeNpcMinigame(){if(!activeNpcGame)return;const won=activeNpcGame.index>=activeNpcGame.config.questions.length,zone=activeNpcGame.config.rewardZone,id=activeNpcGame.npc.game,points=activeNpcGame.config.rewardPoints;
 if(won&&!S.minigames[id]){S.minigames[id]=Date.now();persist()}
 activeNpcGame=null;$('#npc-minigame').hidden=true;mode='map';keys={};$('#menu-toggle').style.display='block';$('#c').focus();
 if(won)toast(`¡+${points} puntos! Minijuego de ${ZN[zone]} completado.`,6000)}
function npcTalk(n){if(mode!=='map'||tm-lastNPC<=90)return;lastNPC=tm;
 if(n.game&&!S.minigames[n.game]&&startNpcMinigame(n))return;
 let i;do i=Math.floor(Math.random()*n.lines.length);while(i===n.last&&n.lines.length>1);n.last=i;
 showDialog(n.who,[n.lines[i]],null)}
function fisher(x,y){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f('#4a3a2a',4,10,3,5);f('#4a3a2a',9,10,3,5);f('#7a6a4a',3,6,10,5);f('#5a4a35',3,9,10,1);
 f('#f0c8a0',4,1,8,6);f('#e8e8e8',5,4,6,3);f('#222',5,3,1,1);f('#222',9,3,1,1);f('#c8b070',3,0,10,2);f('#c8b070',5,-1,6,1);
 g.strokeStyle='#8a5a2a';g.lineWidth=1;g.beginPath();g.moveTo(x+2,y+9);g.lineTo(x-5,y-1);g.stroke();
 g.strokeStyle='#d8d8e0';g.beginPath();g.moveTo(x-5,y-1);g.lineTo(x-5+Math.sin(tm/20)*2,y+11);g.stroke()}
function girl(x,y){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f('#d0486a',4,10,3,5);f('#d0486a',9,10,3,5);f('#f8d030',3,6,10,5);f('#e8a830',3,9,10,1);
 f('#f0c8a0',4,1,8,6);f('#53331e',3,0,10,3);f('#53331e',2,2,3,6);f('#222',5,4,1,1);f('#222',9,4,1,1);
 g.strokeStyle='#2c3e50';g.lineWidth=1;g.strokeRect(x+12.5,y+5.5,4,4);g.beginPath();g.moveTo(x+15,y+10);g.lineTo(x+17,y+13);g.stroke();
 f('#7ec8f0',13,6,3,3)}
function hacker(x,y){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f('#2a2a35',4,10,3,5);f('#2a2a35',9,10,3,5);f('#26334e',3,6,10,5);f('#1c2438',3,9,10,1);
 f('#f0c8a0',4,3,8,4);f('#26334e',3,0,10,3);f('#372b28',4,2,8,1);f('#222',5,4,1,1);f('#222',9,4,1,1);
 f('#4a5568',6,8,8,5);f('#75d9e8',7,9,6,3)}
function clown(x,y){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.28)',3,13,10,2);               // shadow
 f('#c02020',3,10,4,5);f('#c02020',9,10,4,5); // red shoes
 f('#1e449a',3,6,10,5);f('#162e72',3,9,10,2); // blue suit
 f('#c8a870',3,8,2,1);f('#c8a870',11,7,1,2);  // patches
 f('#e8d018',7,7,2,5);f('#c01818',7,8,1,1);f('#c01818',8,10,1,1); // tie+dots
 // cara de piel ancha y visible (y0..y7)
 f('#f0c8a0',4,0,8,7);
 // 3 picos mohawk sobre la cara
 f('#201008',5,-2,2,3);f('#201008',7,-3,2,5);f('#201008',9,-2,2,3); // picos
 f('#201008',6,0,4,2);                         // base mohawk (centro, lados quedan calvos)
 // gafas desde y2 — deja y0-y1 de piel calva visible
 f('#111828',4,2,4,3);f('#111828',8,2,4,3);f('#111828',7,3,2,1); // lentes+puente
 f('#90a8c0',5,2,2,1);f('#90a8c0',9,2,2,1);  // brillo lente
 f('#111',5,3,1,1);f('#111',9,3,1,1);         // pupilas
 // barba y nariz
 f('#201008',4,6,8,3);                         // barba completa
 f('#e02828',7,5,2,2)}                         // nariz redonda encima
const NPC_DRAW={girl,fisher,hacker,clown};
function interact(){const r=near();
 if(!r){const tx=Math.round(P.x/16),ty=Math.round(P.y/16);for(const n of NPCS){const p=npcPos(n);if(Math.abs(p.x-tx)+Math.abs(p.y-ty)<=1){npcTalk(n);return}}return}
 if(S.cap[r.id])return toast(`Ya capturaste a ${r.criatura}.`);
 $('#menu-toggle').style.display='none';
 window.HackemonMusic.setScene('encounter',r.id);
 toast('¡Un reto salvaje apareció! Lanzando cápsula…');A={kind:'open',r,k:0,done:()=>openPanel(r)};mode='enc'}
function encSfx(kind,k){const s=window.HackemonMusic.sfx;if(k===1||(kind==='open'&&k===30))s.throw();if(kind!=='capture')return;
 if(k===45)s.absorb();else if(k===70||k===84||k===96)s.bounce();else if(k>=105&&k<195&&(k-105)%30===0)s.wobble();else if(k===195){s.caught();burst(170,104,ZC[A.r.zona],30)}}
function fondoEnc(z){const R2=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(a,b,w,h)};
 if(z===2){R2('#0d2430',0,0,240,160);R2('#123c44',0,56,240,36);
  g.fillStyle='#0a1c22';[[18,70],[60,64],[120,68],[190,66],[226,72]].forEach(([x,y])=>{g.beginPath();g.moveTo(x-14,y+26);g.lineTo(x,y-14);g.lineTo(x+14,y+26);g.fill()});
  g.strokeStyle='#215a68';g.lineWidth=1;[28,44].forEach(y=>{g.beginPath();g.moveTo(0,y);g.lineTo(240,y-6);g.stroke()});
  [0,1].forEach(i=>{const x=(tm*1.5+i*120)%240;g.fillStyle='#75d9e8';g.fillRect(x,26-6*(x/240)+i*16,3,3)});
  R2('#1d4a44',0,92,240,68);R2('#2f9fb0',0,92,240,3);R2('#173b36',0,140,240,20)}
 else if(z===3){R2('#f8c878',0,0,240,160);R2('#f09850',0,60,240,32);
  g.fillStyle='#f8e0a0';g.beginPath();g.arc(190,26,14,0,7);g.fill();
  g.fillStyle='#d8a850';[[-40,104],[90,96],[200,106]].forEach(([x,y])=>{g.beginPath();g.ellipse(x,y,85,30,0,Math.PI,0);g.fill()});
  R2('#c89848',0,116,240,44);R2('#b8853c',0,140,240,20);
  g.fillStyle='#8a6a4a';g.fillRect(28,128,10,6);g.fillRect(30,126,6,3);g.fillRect(206,144,12,7);g.fillRect(209,141,7,3)}
 else{R2('#bfe3ff',0,0,240,160);R2('#d8f0ff',0,40,240,20);R2('#78c850',0,92,240,68);R2('#68b840',0,92,240,3);
  g.fillStyle='#3f8f3f';for(let x=0;x<240;x+=16){g.beginPath();g.arc(x+8,90,9,Math.PI,0);g.fill()}
  g.fillStyle='#5aa83a';[[170,102,52,9],[52,150,56,8]].forEach(([x,y,a,b])=>{g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fill()});
  [[30,124,'#f85878'],[62,144,'#c868f8'],[132,130,'#f85878'],[204,136,'#f8d030'],[92,150,'#c868f8'],[216,150,'#f85878']].forEach(([x,y,c])=>{g.fillStyle=c;g.fillRect(x,y,3,3);g.fillStyle='#f8d030';g.fillRect(x+1,y+1,1,1)})}}
function enc(){const{r,kind}=A,k=++A.k;encSfx(kind,k);const cx=170,cy=64,gy=104,bx=30,by=140,zc=ZC[r.zona];
 fondoEnc(r.zona);
 const cr=(sc,img)=>g.drawImage(img,cx-30*sc,cy-30*sc+8,60*sc,60*sc),arc=p=>[bx+(cx-bx)*p,by+(cy-by)*p-48*Math.sin(Math.PI*p)];
 if(kind==='open'){
  if(k<30){const w=Math.min(240,240*(k/24));for(let i=0;i<10;i++){g.fillStyle=i%2?zc:'#10161a';g.fillRect(i%2?240-w:0,i*16,w,16)}}
  else{cr(1,sil(r));const kk=k-30;
   if(kk<50){const[x,y]=arc(kk/50);ball(x,y,6,kk/3,zc)}
   else if(kk<85){const p=(kk-50)/35;g.globalAlpha=1-p;g.fillStyle='#fff';g.fillRect(0,0,240,160);g.globalAlpha=1}
   else{A.done();A=null;return}}}
 else{ if(k<45){cr(1,mk(r));const[x,y]=arc(k/45);ball(x,y,6,k/3,zc)}
  else if(k<70){const p=(k-45)/25;if(p<1)g.drawImage(tint(r,'#ff5050'),cx-30*(1-p),cy-30*(1-p)+8,60*(1-p),60*(1-p));ball(cx,cy,6+3*Math.sin(p*3),0,zc)}
  else if(k<105){const p=(k-70)/35;const y=p<.4?cy+(gy-cy)*(p/.4)**2:gy-Math.abs(Math.sin((p-.4)/.6*Math.PI*2))*10*(1-(p-.4)/.6);ball(cx,y,6,0,zc)}
  else if(k<195){const ph=(k-105)%30;ball(cx,gy,6,ph<20?Math.sin(ph/20*Math.PI*2)*.5:0,zc)}
  else if(k<235){ball(cx,gy,6,0,zc);drawFX(0,0);g.fillStyle='#ffe84a';for(let i=0;i<8;i++){const a=i*Math.PI/4,d=(k-195)*.8;g.fillRect(cx+Math.cos(a)*d,gy+Math.sin(a)*d,2,2)}}
  else{A.done();A=null;return}}}
function closeAll(resumeMusic=true){if(mode==='panel'&&resumeMusic)window.HackemonMusic.setScene('world');$('#panel').style.display=$('#inv').style.display='none';if(mode!=='enc')mode='map';$('#menu-toggle').style.display=mode==='map'?'block':'none';if(mode==='map')$('#c').focus()}
function openInv(){mode='inv';const v=$('#inv');
 const medals=[1,2,3].map(z=>`<div class="medal ${(S.medals||{})[z]?'':'off'}">${(S.pure||{})[z]?`<img class=pur src="${pureImg().toDataURL()}" title="Zona sin pistas">`:''}<img src="${medalImg(z).toDataURL()}" alt=""><small>${(S.medals||{})[z]?esc(MED[z]):'???'}</small></div>`).join('');
 const cards=R.map(r=>{const got=S.cap[r.id];
 return `<div class="card ${got?'':'off'}"><img src="${got?challengeLogo(r):sil(r).toDataURL()}" alt=""><b>${got?esc(r.criatura):'???'}</b><small>${got?esc(r.tipo)+' · Zona '+r.zona:'Reto '+r.id+' · Zona '+r.zona}</small>${got?`<small>${esc(r.titulo)}</small><small class="${earned(r)<basePts(r)?'bad':'ok'}">${earned(r)} pts${revPaidHints(r)?` (-${revPaidHints(r)*15} pts por pistas)`:''}</small>`:''}</div>`}).join('');
 v.innerHTML=`<article class="inv-screen trainer-ui"><header class="trainer-head"><p class="eyebrow">Registro del entrenador</p><h2>Hackédex · ${total()}/12</h2><small>Cada criatura es un reto resuelto.</small></header><div class="trainer-stat-grid inv-stat-grid" aria-label="Resumen"><div class="trainer-stat-card trainer-stat-card--1"><span class="trainer-stat-value">${total()}/12</span><span class="trainer-stat-label">Capturados</span></div><div class="trainer-stat-card trainer-stat-card--2"><span class="trainer-stat-value">${mcount()}/3</span><span class="trainer-stat-label">Medallas</span></div><div class="trainer-stat-card trainer-stat-card--3"><span class="trainer-stat-value">${score()}</span><span class="trainer-stat-label">Puntos</span></div></div><section class="trainer-block" aria-labelledby="inv-medals-label"><h3 id="inv-medals-label" class="trainer-section-label">Gimnasios y medallas</h3><div class="medals">${medals}</div></section><section class="trainer-block" aria-labelledby="inv-dex-label"><h3 id="inv-dex-label" class="trainer-section-label">Criaturas registradas</h3><div class="grid">${cards}</div></section><footer class="trainer-foot"><button type="button" onclick="closeAll()">Cerrar (Esc)</button></footer></article>`;v.style.display='block';v.querySelector('.trainer-foot button').focus()}
function openPanel(r){mode='panel';$('#menu-toggle').style.display='block';let h=revHints(r);const p=$('#panel'),pistas=Array.isArray(r.pistas)?r.pistas:[],adminAnswer=ADMIN&&ADMIN[r.id]?String(ADMIN[r.id]).replace(/^CORPX\{(.*)\}$/i,'$1'):'';
 const dl=r.descarga?challengeDl(r.descarga,'Archivo del reto','Descarga el archivo en tu equipo antes de resolver el reto'):'',foca=r.herramienta_descarga?challengeDl(r.herramienta_descarga,'FOCA (.zip)','Descarga y ejecuta FOCA para revisar metadatos'):'',dls=dl||foca?`<div class="challenge-downloads" aria-label="Descargas">${dl}${foca}</div>`:'',pen=revHints(r)*15;
 const hintButtonLabel=`Pista ${h}/${pistas.length}${pen?` · -${pen}pts`:''}`;
 const hintInit=h>0?`<section id="ph" class="challenge-hints" aria-live="polite">${challengeHintHtml(pistas,h)}</section>`:'<section id="ph" class="challenge-hints" hidden aria-live="polite"></section>';
 p.innerHTML=`<article class="challenge-panel" data-zone="${r.zona}"><header class="challenge-head"><div class="challenge-logo-wrap"><img class="challenge-logo" width="56" height="56" src="${challengeLogo(r)}" alt="Hackémon ${esc(r.criatura)}"><span class="challenge-species">${esc(r.criatura)}</span></div><div class="challenge-titles"><span class="challenge-wild">¡Reto salvaje!</span><h2>${esc(r.titulo)}</h2><small>Zona ${r.zona} · ${esc(ZN[r.zona])} · ${esc(r.tipo)}</small></div></header><section class="challenge-body"><section class="challenge-mission challenge-textbox" aria-label="Descripción del reto"><span class="challenge-mission-tag">Misión</span><p class="challenge-brief">${esc(r.brief)}</p><p class="challenge-objective"><b>Objetivo</b> <code>${esc(r.objetivo)}</code></p></section>${dls?`<div class="challenge-ribbon">${dls}</div>`:''}<div class="challenge-body-scroll"><p class="challenge-tools">${r.tools.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</p><p class="challenge-eth">${esc(r.etica)}</p>${ADMIN?`<div class="admin-box challenge-admin"><span>Admin</span><code>${esc(adminAnswer)}</code><button type="button" class="challenge-btn challenge-btn-ghost" id="admin-skip">Saltar</button></div>`:''}${hintInit}</div></section><footer class="challenge-dock">${r.tipo==='Upload Web'?'<div class="challenge-upload"><input type="file" id="fu" accept=".txt" class="challenge-upload-input"><button type="button" id="bu" class="challenge-btn challenge-btn-primary">Subir</button></div><p id="ur" class="challenge-result" role="status"></p>':''}<div class="challenge-commands">${Array.isArray(r.pistas)?`<button type="button" id="bh" class="challenge-btn challenge-btn-ghost" ${pistas.length?'':'disabled'}>${hintButtonLabel}</button>`:'<span class="challenge-no-hints">Sin pistas</span>'}<div class="challenge-submit"><input id="fl" placeholder="Escriba la bandera…" autocomplete="off" aria-label="Escriba la bandera"><button type="button" id="bv" class="challenge-btn challenge-btn-primary">Validar</button></div><button type="button" class="challenge-btn challenge-btn-ghost challenge-close" onclick="closeAll()">Mapa</button></div><p id="rs" class="challenge-result" role="status"></p></footer></article>`;
 p.style.display='grid';$('#fl').focus();
 if(ADMIN)$('#admin-skip').onclick=()=>captureSuccess(r,'Modo admin: reto saltado. Lanzando cápsula…');
 if(pistas.length)$('#bh').onclick=()=>{if(h<pistas.length){const box=$('#ph');box.hidden=false;box.insertAdjacentHTML('beforeend',`<p class="challenge-hint-line"><b>Pista ${h+1}:</b> ${esc(pistas[h])}</p>`);
  h++;S.hints[r.id]=h;persist();$('#bh').textContent=`Pista ${h}/${pistas.length} · -${h*15}pts`;$('#bh').disabled=h>=pistas.length}};
 $('#bv').onclick=async()=>{const v=$('#fl').value.trim(),o=$('#rs');if(!v){o.className='challenge-result bad';o.textContent='Escribe una bandera primero.';return}
  try{const m=v.match(/^corpx\{(.+)\}$/i),inner=m?m[1]:v;const submittedFlag=r.plain?v:`CORPX{${inner}}`;const res=await fetch('/api/validar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,flag:submittedFlag})}),d=await res.json();
   if(d.ok)captureSuccess(r,'¡Bandera correcta! Lanzando cápsula de captura…');
   else{o.className='challenge-result bad';o.textContent=res.status===429?'Demasiados intentos. Espera un minuto.':'Bandera incorrecta. Revisa el formato y vuelve a intentarlo.'}}
  catch(e){o.className='challenge-result bad';o.textContent='No se pudo contactar al servidor.'}}
 if(r.tipo==='Upload Web')$('#bu').onclick=async()=>{const fi=$('#fu').files[0],o=$('#ur');if(!fi){o.className='challenge-result bad';o.textContent='Selecciona un archivo .txt primero.';return}const fd=new FormData();fd.append('archivo',fi);try{const res=await fetch('/api/upload-reto9',{method:'POST',body:fd}),d=await res.json();if(d.ok){o.className='challenge-result ok';o.innerHTML=`¡Acceso concedido! Bandera en: <a href="${d.url}" target="_blank" rel="noopener">${d.url}</a>`}else{o.className='challenge-result bad';o.textContent=d.msg||'Acceso denegado.'}}catch(e){o.className='challenge-result bad';o.textContent='Error al subir el archivo.'}}}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(mode==='dialog'){if([' ','enter'].includes(k)){e.preventDefault();nextDialog()}return}
 if(mode==='npc-minigame'){if(k==='escape'){e.preventDefault();closeNpcMinigame()}return}
 if(mode==='confirm'){if(k==='escape'){e.preventDefault();closeGameConfirm(false);return}if(k==='enter'){e.preventDefault();closeGameConfirm(true);return}if(k===' '&&e.target.closest('#confirm-yes,#confirm-no'))return;if(k===' '){e.preventDefault();closeGameConfirm(true);return}return}
 if(mode==='zone-briefing'){if([' ','enter'].includes(k)){e.preventDefault();closeZoneBriefing();return}return}
 if(mode==='capture-result'){if([' ','enter'].includes(k)){e.preventDefault();continueAfterCapture();return}return}
 if(mode==='liga'){if([' ','enter'].includes(k)){e.preventDefault();$('#liga-continue').click();return}return}
 if(mode==='login'){if(e.key==='Escape'){$('#login').style.display='none';mode='start'}return}if(e.key==='Escape'){if(mode==='menu')closeMenu();else if(mode==='panel'||mode==='inv')closeAll();else if(mode==='map')openMenu();return}
 if(e.target.tagName==='INPUT'){if(k==='enter'&&mode==='panel')$('#bv').click();return}
 if([' ','enter'].includes(k)&&e.target.closest('button,a,[role="button"]'))return;
 if(mode==='start'&&!$('#character-screen').hidden&&(k==='arrowleft'||k==='arrowright')){e.preventDefault();browseCharacter(k==='arrowleft'?-1:1);return}
 if(k==='m'){if(mode==='menu')closeMenu();else openMenu();return}keys[k]=1;
 if(mode==='map'){if([' ','enter'].includes(k)){e.preventDefault();interact()}else if(k==='i')openInv();else if(k==='n'){S.mini=S.mini===false;persist()}else if(k.startsWith('arrow'))e.preventDefault()}
 else if(mode==='inv'&&k==='i')closeAll()});
addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);addEventListener('blur',()=>keys={});
//audio

function loop(){tm++;$('#hud').hidden=['start','login','enc','capture-result','confirm','zone-briefing','npc-minigame'].includes(mode);$('#mini').hidden=mode!=='map'||S.mini===false;$('#controls-footer').hidden=mode==='start'||mode==='panel'||mode==='npc-minigame';document.body.classList.toggle('intro-active',mode==='start');document.body.classList.toggle('panel-active',mode==='panel');if(mode==='zone-briefing')drawBriefingMascot(performance.now());else if(['map','start','login','dialog'].includes(mode)){if(mode==='map')update();drawMap();if(mode==='start')drawStartAmbience(performance.now())}else if(mode==='enc'&&A)enc();requestAnimationFrame(loop)}
updateMusicButton(false);
$('#menu-toggle').onclick=()=>mode==='menu'?closeMenu():openMenu();
$('#menu-close').onclick=closeMenu;
$('#capture-continue').onclick=continueAfterCapture;
$('#zone-briefing-continue').onclick=closeZoneBriefing;
$('#liga-continue').onclick=()=>{$('#liga').style.display='none';mode='map'};
$('#menu-music').onclick=toggleMusic;
$('#menu-inventory').onclick=()=>{closeMenu();$('#panel').style.display='none';openInv()};
$('#menu-restart').onclick=restartChallenges;
$('#menu-exit').onclick=exitToStart;
$('#confirm-yes').onclick=()=>closeGameConfirm(true);
$('#confirm-no').onclick=()=>closeGameConfirm(false);
$('#enter-game').onclick=()=>{if(mode!=='start'||!R.length)return;$('#landing-screen').hidden=true;$('#story-screen').hidden=false;$('#start').scrollTop=0};
$('#choose-screen').onclick=()=>{if(mode!=='start'||!R.length)return;$('#start').scrollTop=0;$('#story-screen').hidden=true;$('#character-screen').hidden=false;renderCharacterSelection()};
$('#back-story').onclick=()=>{$('#start').scrollTop=0;$('#character-screen').hidden=true;$('#story-screen').hidden=false};
$('#previous-character').onclick=()=>browseCharacter(-1);
$('#next-character').onclick=()=>browseCharacter(1);
document.querySelectorAll('.accessory-option').forEach(button=>button.addEventListener('click',()=>{playerAccessory=button.dataset.accessory;persist();renderCharacterSelection()}));
$('#select-character').onclick=()=>{chosenCharacterId=characters[activeCharacterIndex].id;persist();renderCharacterSelection()};
$('#begin').onclick=()=>{if(!chosenCharacterId)return;persist();openLogin()};
$('#login-form').onsubmit=submitLogin;$('#login-name').oninput=syncLogin;
$('#login-back').onclick=()=>{$('#login').style.display='none';mode='start'};
$('#dialog').onclick=nextDialog;
$('#start').addEventListener('pointermove',trackStartPointer);
$('#music-toggle').onclick=e=>{e.stopPropagation();setSoundPanel($('#sound-panel').hidden)};
$('#sound-music').onclick=toggleMusic;
$('#sound-panel').onclick=e=>e.stopPropagation();
document.addEventListener('click',()=>{if(!$('#sound-panel').hidden)setSoundPanel(false)});
initVolumes();
document.querySelectorAll('.swatch').forEach(btn=>{
 if(btn.dataset.skin===playerOutfitColor)btn.classList.add('active');
 btn.addEventListener('click',()=>{playerOutfitColor=btn.dataset.skin;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b===btn));persist();if(!$('#character-screen').hidden)renderCharacterSelection()});
});
fetch('/api/retos').then(r=>r.json()).then(d=>{if(!Array.isArray(d)||!d.length)throw new Error('La lista de retos está vacía.');R=d;startCreatures=R.slice(0,8).map((r,i,list)=>({r,progress:i/list.length,speed:18+(i%3)*5}));build();mode='start';window.HackemonMusic.setScene('menu');$('#enter-game').disabled=false;$('#enter-game').textContent='ENTRAR AL MUNDO';$('#choose-screen').disabled=false;$('#choose-screen').textContent='SELECCIONAR PERSONAJE';loop()}).catch(e=>{console.error('No se pudieron cargar los retos.',e);$('#enter-game').textContent='No se pudo cargar el laboratorio';$('#choose-screen').textContent='No se pudo cargar el laboratorio';toast('No se pudo cargar la lista de retos.',9000)});

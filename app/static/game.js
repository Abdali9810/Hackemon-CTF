const $=s=>document.querySelector(s),c=$('#c'),g=c.getContext('2d');
const TS=16,W=48,H=32,PAS=[0,1,4,5,7],ZN=['','Ruta Césped','Bosque de Redes','Cumbre Root'],ZC=['','#58b848','#2f9fb0','#d0703c'];
const MED=[,'Medalla Lupa','Medalla Paquete','Medalla Root'],mcount=()=>Object.keys(S.medals||{}).length;
let R=[],T=[],S={cap:{},hints:{}},mode='load',A=null,captureResult=null,pendingMedal=null,tm=0,keys={},tmr,modeBeforeMenu='map',PLAYER='',ADMIN=null,DLG=null,lastZ=0;
let playerSkinColor='#2fa84f';
const characters=[
 {id:'byte',name:'BYTE',role:'Especialista web',description:'Encuentra detalles y pistas que suelen pasar desapercibidos.',pants:'#2b4a9a',hat:'#f8f8f8',hatBand:'#e03030',hair:'#53331e',accent:'#ffde00',headwear:'cap',skills:['Ojo de codigo · detecta detalles ocultos','Analisis web · experto en aplicaciones']},
 {id:'cipher',name:'CIPHER',role:'Experto en sistemas',description:'Reconoce patrones y encuentra rutas bloqueadas.',pants:'#26334e',hat:'#252a3b',hatBand:'#f5bc35',hair:'#372b28',accent:'#75d9e8',headwear:'hood',skills:['Lectura de patrones · une pistas','Resolucion metódica de retos']},
 {id:'pixel',name:'PIXEL',role:'Analista de red',description:'Sigue el recorrido de los datos hasta su origen.',pants:'#553e8f',hat:'#f2f2f2',hatBand:'#4d56cf',hair:'#6a3b25',accent:'#55dfc2',headwear:'headset',skills:['Rastreo de red · sigue el flujo de datos','Criptografia · descifra mensajes']}
];
let activeCharacterIndex=0,chosenCharacterId=null;
try{S=JSON.parse(localStorage.getItem('ctfm1'))||S}catch(e){}
if(!S||typeof S!=='object')S={cap:{},hints:{}};
if(!S.cap||typeof S.cap!=='object')S.cap={};
if(!S.hints||typeof S.hints!=='object')S.hints={};
if(S.skin)playerSkinColor=S.skin;
if(characters.some(ch=>ch.id===S.character)){chosenCharacterId=S.character;activeCharacterIndex=characters.findIndex(ch=>ch.id===chosenCharacterId)}
const persist=()=>{try{S.skin=playerSkinColor;if(chosenCharacterId)S.character=chosenCharacterId;localStorage.setItem('ctfm1',JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const nz=z=>R.filter(r=>r.zona===z&&S.cap[r.id]).length,total=()=>R.filter(r=>S.cap[r.id]).length,unl=z=>z===1||!!ADMIN||nz(z-1)>=4;
const basePts=r=>r.zona===1?100:r.zona===2?150:200;
const revHints=r=>typeof S.hints[r.id]==='number'?Math.min(S.hints[r.id],(r.pistas||[]).length):0;
const earned=r=>Math.max(0,basePts(r)-revHints(r)*15);
const score=()=>R.reduce((s,r)=>s+(S.cap[r.id]?earned(r):0),0);
const hs=(x,y)=>((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%100;
function toast(s,ms=2800,cls=''){const m=$('#msg');m.className=cls;m.textContent=s;m.style.display='block';clearTimeout(tmr);tmr=setTimeout(()=>m.style.display='none',ms)}
function drawPreview(id,d,ch){const canvas=$(`#${id}`),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(6,6);drawCharacter(ctx,8,1,d,0,ch);ctx.restore()}
function renderCharacterSelection(){const ch=characters[activeCharacterIndex];
 $('#character-count').textContent=`${String(activeCharacterIndex+1).padStart(2,'0')} / ${String(characters.length).padStart(2,'0')}`;
 $('#character-role').textContent=ch.role;$('#character-name').textContent=ch.name;$('#character-description').textContent=ch.description;
 $('#character-skills').innerHTML=ch.skills.map(skill=>`<li>${esc(skill)}</li>`).join('');
 $('#skills-panel').hidden=true;$('#skills-toggle').setAttribute('aria-expanded','false');$('#skills-toggle').textContent='VER HABILIDADES';
 $('#select-character').textContent=chosenCharacterId===ch.id?'PERSONAJE ELEGIDO':'ELEGIR ESTE PERSONAJE';
 $('#select-character').disabled=chosenCharacterId===ch.id;$('#begin').disabled=!chosenCharacterId;
 drawPreview('preview-front',0,ch);drawPreview('preview-back',1,ch)}
function browseCharacter(step){activeCharacterIndex=(activeCharacterIndex+step+characters.length)%characters.length;chosenCharacterId=null;renderCharacterSelection()}
function updateMusicButton(enabled){const label=enabled?'Desactivar música':'Activar música';
 const t=$('#music-toggle');t.classList.toggle('off',!enabled);t.setAttribute('aria-pressed',String(enabled));
 const m=$('#menu-music');m.textContent='♫';m.title=label;m.setAttribute('aria-label',label);m.setAttribute('aria-pressed',String(enabled));m.classList.toggle('off',!enabled);
 const b=$('#sound-music');b.textContent=enabled?'Música: encendida':'Música: apagada';b.setAttribute('aria-pressed',String(enabled));b.classList.toggle('off',!enabled)}
async function toggleMusic(){try{updateMusicButton(await window.HackemonMusic.toggle())}catch(e){console.error('No se pudo cambiar la música.',e);toast('No se pudo cambiar la música en este navegador.',4000)}}
function setSoundPanel(open){$('#sound-panel').hidden=!open;$('#music-toggle').setAttribute('aria-expanded',String(open));if(open)window.HackemonMusic.unlock().catch(()=>{})}
function initVolumes(){const v=window.HackemonMusic.getVolumes();
 for(const k of ['music','sfx']){const el=$('#vol-'+k),out=$('#vol-'+k+'-val'),show=()=>out.textContent=el.value+'%';el.value=Math.round(v[k]*100);show();
  el.oninput=()=>{show();window.HackemonMusic.setVolume(k,el.value/100)};
  if(k==='sfx')el.onchange=()=>window.HackemonMusic.sfx.step('grass')}}
function openMenu(){if(!['map','panel','inv'].includes(mode))return;modeBeforeMenu=mode;mode='menu';keys={};$('#game-menu').style.display='grid';$('#menu-toggle').setAttribute('aria-expanded','true')}
function closeMenu(){if(mode!=='menu')return;mode=modeBeforeMenu;$('#game-menu').style.display='none';$('#menu-toggle').setAttribute('aria-expanded','false')}
function restartChallenges(){if(!window.confirm('¿Empezar una nueva partida? Se borrarán todas las criaturas capturadas.'))return;S={cap:{},hints:{},skin:playerSkinColor};persist();P.x=48;P.y=256;P.dir=0;P.mv=0;keys={};closeMenu();if(mode!=='map')mode='map';$('#panel').style.display=$('#inv').style.display='none';window.HackemonMusic.setScene('world');toast('Nueva partida iniciada. ¡Vuelve a resolver los retos!')}
function exitToStart(){if(!window.confirm('¿Salir al inicio? Se iniciará una nueva partida y se borrará el progreso actual.'))return;S={cap:{},hints:{},skin:playerSkinColor};persist();PLAYER='';ADMIN=null;P.x=48;P.y=256;P.dir=0;P.mv=0;keys={};closeMenu();$('#panel').style.display=$('#inv').style.display='none';$('#dialog').hidden=true;$('#menu-toggle').style.display='none';$('#start').style.display='grid';mode='start';window.HackemonMusic.setScene('menu')}
const QUIPS=[
 r=>['¡Vaya, vaya!',`Capturaste a ${r.criatura}, ${PLAYER}. No te pongas la capucha de hacker todavía: hasta un reloj roto acierta dos veces al día.`],
 r=>['¿Fue suerte?',`${r.criatura} ya es tuyo. Los logs dicen que fue habilidad; nosotros preferimos esperar a la auditoría.`],
 r=>['Increíble, en serio',`Atrapaste a ${r.criatura}. Tu mamá estaría orgullosa, ${PLAYER}… si supiera qué es una bandera.`],
 r=>['Mira quién despertó',`${r.criatura} entró en la cápsula sin resistirse. Creo que lo convenció más tu insistencia que tu talento.`]];
let lastQuip=-1;
function pickQuip(r){let i;do i=Math.floor(Math.random()*QUIPS.length);while(i===lastQuip);lastQuip=i;return QUIPS[i](r)}
function captureSuccess(r,msg){closeAll(false);toast(msg);mode='enc';$('#menu-toggle').style.display='none';
 A={kind:'capture',r,k:0,done:()=>{S.cap[r.id]=Date.now();pendingMedal=nz(r.zona)>=4&&!(S.medals||{})[r.zona]?r.zona:null;
  if(pendingMedal){S.medals=S.medals||{};S.medals[r.zona]=Date.now()}persist();captureResult=r;mode='capture-result';
  const q=r.id===2?['Reto completado','¡Qué sorpresa! Por fin una neurona hizo conexión. Continúa, a ver cuánto te dura la suerte.']:pickQuip(r);
  $('#capture-title').textContent=q[0];$('#capture-text').textContent=q[1];$('#capture-message').style.display='grid'}}}
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
 PLAYER=name;try{localStorage.setItem('ctfm1-name',name)}catch(x){}
 $('#login').style.display='none';startGame()}
function startGame(){P.characterId=chosenCharacterId;$('#start').style.display='none';window.HackemonMusic.setScene('world');
 window.HackemonMusic.start().then(()=>updateMusicButton(true)).catch(e=>{console.error('No se pudo iniciar la música.',e);toast('No se pudo iniciar la música en este navegador.',4000)});
 const lines=[`¡Hola! Me llamo ${PLAYER}.`,
  'Dicen que este mundo es una aventura llena de retos, criaturas digitales y guardias con muy poca paciencia.',
  'Mi plan: resolver cada reto, capturar a los 12 Hackémon y no romper nada que no tenga permiso para romper.'];
 if(ADMIN)lines.push('Modo administrador activado: veo las respuestas, puedo saltar retos y los guardias me dejan pasar. Solo para pruebas.');
 lines.push('¿Listos? ¡Que empiece la aventura!');
 showDialog(PLAYER,lines,()=>toast('Camina hasta una cápsula brillante y pulsa Espacio.',4000))}
function continueAfterCapture(){if(mode!=='capture-result')return;$('#capture-message').style.display='none';mode='map';$('#menu-toggle').style.display='block';window.HackemonMusic.setScene('world');
 if(pendingMedal){window.HackemonMusic.sfx.caught();burst(P.x+8,P.y+8,ZC[pendingMedal],40);toast(`¡${MED[pendingMedal]} conseguida! Completaste ${ZN[pendingMedal]} · [I] inventario`,6000);pendingMedal=null}
 else toast(`¡Capturaste a ${captureResult.criatura}! (${total()}/12) · [I] inventario`,4000);captureResult=null}
function build(){
 for(let y=0;y<H;y++){T[y]=[];for(let x=0;x<W;x++){const n=hs(x,y),z3=x>=33;let v=z3?5:0;
  if(x===0||y===0||x===W-1||y===H-1)v=z3?6:2;else if([15,16,31,32].includes(x))v=3;
  else if(n<12)v=z3?6:2;else if(n<24&&!z3)v=1;else if(n>95&&!z3)v=7;T[y][x]=v}}
 for(let x=1;x<W-1;x++)T[16][x]=4;
 R.forEach(r=>{for(let y=Math.min(r.y,16);y<=Math.max(r.y,16);y++)T[y][r.x]=4;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=r.x+dx,Y=r.y+dy;if([2,6].includes(T[Y][X]))T[Y][X]=X>=33?5:0}});
 GD.forEach(d=>T[15][d.x-1]=4)}
function tile(v,x,y,tx,ty){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 const sw=Math.round(Math.sin(tm/16+tx*0.8+ty*0.4));
 if([0,1,2,7].includes(v)){f('#58b848',0,0,16,16);if((tx*3+ty)%4===0){f('#68c858',3+sw,4,2,2);f('#48a038',11+sw,10,2,1)}}
 if(v===5||v===6){f('#a89878',0,0,16,16);if((tx+ty*2)%3===0){f('#988868',4,5,3,2);f('#b8a888',10,11,2,2)}}
 if(v===1){f('#3c9a3c',2+sw,6,2,6);f('#3c9a3c',7+sw,4,2,8);f('#3c9a3c',12+sw,7,2,5);f('#78d868',3+sw,6,1,3);f('#78d868',8+sw,4,1,3)}
 if(v===7){f('#f8f8f8',5+sw,5,2,2);f('#f8d030',6+sw,6,1,1);f('#f85878',10+sw,10,2,2)}
 if(v===2){f('#245824',1,8,14,6);f('#2f6f2f',1,1,14,10);f('#3d8b3d',3+sw,0,10,4);f('#6b4a2a',6,12,4,4);f('#58b848',0,14,16,2);if(sw!==0)f('#4da04d',5+sw,5,3,1)}
 if(v===6){f('#4a4a52',1,10,14,4);f('#6b6b73',1,3,14,8);f('#8a8a94',3,4,6,3)}
 if(v===3){f('#3890f8',0,0,16,16);const o=(Math.floor(tm/12)+tx*3)%8;f('#88c8ff',o,5,4,1);f('#88c8ff',(o+6)%12,11,3,1)}
 if(v===4){if([15,16,31,32].includes(tx)){f('#a8783c',0,0,16,16);f('#7a5428',0,5,16,1);f('#7a5428',0,11,16,1)}else{f('#d8c090',0,0,16,16);f('#c8b080',3,3,2,2);f('#e8d0a0',10,9,2,2)}}}
function ball(x,y,r,rot,col){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=col||'#2f9fb0';g.beginPath();g.arc(0,0,r,Math.PI,0);g.fill();
 g.fillStyle='#f8f8f8';g.beginPath();g.arc(0,0,r,0,Math.PI);g.fill();g.fillStyle='#222';g.fillRect(-r,-1,2*r,2);
 g.fillStyle='#f8d030';g.beginPath();g.arc(0,0,r*.35,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=1;g.stroke();g.restore()}
function spr(x,y,d,fr){const ch=characters.find(item=>item.id===P.characterId)||characters[0];drawCharacter(g,x,y,d,fr,ch)}
function drawCharacter(ctx,x,y,d,fr,ch){const f=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f(ch.pants,4,10,3,5-(fr===1?1:0));f(ch.pants,9,10,3,5-(fr===2?1:0));f(playerSkinColor,3,6,10,5);f('#f0c8a0',2,7,1,3);f('#f0c8a0',13,7,1,3);
 f(ch.hair,4,1,8,6);if(d!==1)f('#f0c8a0',4,2,8,5);else f(ch.hair,4,1,8,5);
 if(ch.headwear==='hood'){f(ch.hat,2,0,12,2);f(ch.hat,1,2,2,4);f(ch.hat,13,2,2,4);f(ch.hatBand,2,2,12,1)}
 else if(ch.headwear==='headset'){f(ch.hat,4,0,8,2);f(ch.accent,1,3,2,4);f(ch.accent,13,3,2,4);f(ch.hatBand,4,0,8,1)}
 else{f(ch.hat,3,0,10,3);f(ch.hatBand,3,3,10,1);f(ch.accent,7,1,2,1)}
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
let lastGQ=-1;
function guardTalk(d){if(tm-lastT<=90)return;lastT=tm;const z=d.z-1;if(unl(d.z)){toast(ADMIN&&nz(z)<4?`Guardia: Sí, señor administrador. Pase usted, no vaya a ser que me cambie la contraseña.`:`Guardia: ¡Bien hecho, ${PLAYER}! Puedes cruzar hacia ${ZN[d.z]}.`,7000);return}
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
 return PAS.includes(T[ty][tx])}
function update(){if(P.mv>0){const d=DD[P.dir];P.x+=d[0]*2;P.y+=d[1]*2;P.mv-=2;return}
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
  if(!done){g.globalAlpha=.25+.2*Math.sin(tm/10+r.id);g.fillStyle='#fff';g.beginPath();g.arc(x+8,y+6,9,0,7);g.fill();g.globalAlpha=1}
  ball(x+8,y+6,5,0,done?'#777':ZC[r.zona]);if(done){g.fillStyle='#fff';g.font='bold 8px monospace';g.fillText('✓',x+5,y+4)}
  if(r===nr&&!done){g.fillStyle='#fff';g.font='bold 9px monospace';g.fillText('!',x+6,y-4+Math.sin(tm/6)*1.5)}});
 GD.forEach(d=>{const q=gpos(d);guard(q.x*16-cx,q.y*16-cy-4,unl(d.z))});
 spr(P.x-cx,P.y-cy-4,P.dir,P.mv>0?(Math.floor(P.mv/4)%2?1:2):0);
 drawFX(cx,cy);
 const z=P.x<240?1:P.x<496?2:3;if(lastZ&&z!==lastZ&&mode==='map')toast(`— ${ZN[z]} —`,1800,'zone');lastZ=z;
 const h=$('#hud'),txt=`${PLAYER}${ADMIN?' [ADMIN]':''} · ${ZN[z]} · ${total()}/12 · ${mcount()}/3 medallas · ${score()} pts`;if(h.textContent!==txt)h.textContent=txt}
function interact(){const r=near();if(!r)return;if(S.cap[r.id])return toast(`Ya capturaste a ${r.criatura}.`);
 $('#menu-toggle').style.display='none';
 window.HackemonMusic.setScene('encounter',r.id);
 toast('¡Un reto salvaje apareció! Lanzando cápsula…');A={kind:'open',r,k:0,done:()=>openPanel(r)};mode='enc'}
function encSfx(kind,k){const s=window.HackemonMusic.sfx;if(k===1||(kind==='open'&&k===30))s.throw();if(kind!=='capture')return;
 if(k===45)s.absorb();else if(k===70||k===84||k===96)s.bounce();else if(k>=105&&k<195&&(k-105)%30===0)s.wobble();else if(k===195){s.caught();burst(170,104,ZC[A.r.zona],30)}}
function enc(){const{r,kind}=A,k=++A.k;encSfx(kind,k);const cx=170,cy=64,gy=104,bx=30,by=140,zc=ZC[r.zona];
 g.fillStyle='#bfe3ff';g.fillRect(0,0,240,160);g.fillStyle='#d8f0ff';g.fillRect(0,40,240,20);g.fillStyle='#78c850';g.fillRect(0,92,240,68);g.fillStyle='#68b840';g.fillRect(0,92,240,3);
 g.fillStyle='#5aa83a';[[170,102,52,9],[52,150,56,8]].forEach(([x,y,a,b])=>{g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fill()});
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
function closeAll(resumeMusic=true){if(mode==='panel'&&resumeMusic)window.HackemonMusic.setScene('world');$('#panel').style.display=$('#inv').style.display='none';if(mode!=='enc')mode='map';$('#menu-toggle').style.display=mode==='map'?'block':'none'}
function openInv(){mode='inv';const v=$('#inv');v.innerHTML=`<h2>Inventario · ${total()}/12</h2><small>Cada criatura es un reto resuelto.</small><p><b>Puntuación: ${score()} pts</b></p><div class=medals>${[1,2,3].map(z=>`<div class="medal ${(S.medals||{})[z]?'':'off'}"><img src="${medalImg(z).toDataURL()}"><small>${(S.medals||{})[z]?MED[z]:'???'}</small></div>`).join('')}</div><div class=grid>`+R.map(r=>{const got=S.cap[r.id];
 return `<div class="card ${got?'':'off'}"><img src="${(got?mk(r):sil(r)).toDataURL()}"><b>${got?esc(r.criatura):'???'}</b><small>${got?esc(r.tipo)+' · Zona '+r.zona:'Reto '+r.id+' · Zona '+r.zona}</small>${got?`<small>${esc(r.titulo)}</small><small class="${earned(r)<basePts(r)?'bad':'ok'}">${earned(r)} pts${revHints(r)?' (-'+revHints(r)*15+' pistas)':''}</small>`:''}</div>`}).join('')+`</div><button onclick="closeAll()">Cerrar (Esc)</button>`;v.style.display='block'}
function openPanel(r){mode='panel';$('#menu-toggle').style.display='block';let h=0;const p=$('#panel');
 p.innerHTML=`<div class=row><img src="${sil(r).toDataURL()}"><div><h2>Reto ${r.id}: ${esc(r.titulo)}</h2><small>Zona ${r.zona} · ${esc(ZN[r.zona])} · Criatura tipo ${esc(r.tipo)}</small></div></div><p>${esc(r.brief)}</p><p><b>Objetivo:</b> <code>${esc(r.objetivo)}</code></p>${r.descarga?`<p><a class=download href="${esc(r.descarga)}" download>Descargar archivo del reto</a></p>`:''}${r.herramienta_descarga?`<p><a class=download href="${esc(r.herramienta_descarga)}" download>Descargar FOCA v3.4.7.1 (.zip)</a></p><small>Descomprime el ZIP en Windows y ejecuta FOCA.exe.</small>`:''}<p>${r.tools.map(t=>`<span class=chip>${esc(t)}</span>`).join('')}</p><div class=eth><b>Ética:</b> ${esc(r.etica)}</div>${ADMIN?`<div class=admin-box><b>Admin · Respuesta:</b> <code>${esc(ADMIN[r.id]||'')}</code><br><button id=admin-skip>Saltar reto</button></div>`:''}<div id=ph></div><button id=bh>Pedir pista (0/${r.pistas.length})${revHints(r)?' -'+revHints(r)*15+' pts ya reveladas':''}</button><p><input id=fl placeholder="${r.id===2?'Escribe la respuesta':'CORPX{...}'}" autocomplete=off><button id=bv>Validar bandera</button></p><p id=rs></p><button onclick="closeAll()">Volver al mapa (Esc)</button>`;
 p.style.display='block';$('#fl').focus();
 if(ADMIN)$('#admin-skip').onclick=()=>captureSuccess(r,'Modo admin: reto saltado. Lanzando cápsula…');
 $('#bh').onclick=()=>{if(h<r.pistas.length){$('#ph').innerHTML+=`<p>${esc(r.pistas[h])}</p>`;h++;if(typeof S.hints[r.id]!=='number'||h>S.hints[r.id])S.hints[r.id]=h;persist();const pen=revHints(r)*15;$('#bh').textContent='Pedir pista ('+h+'/'+r.pistas.length+')'+(pen?' -'+pen+' pts':'');}};
 $('#bv').onclick=async()=>{const v=$('#fl').value.trim(),o=$('#rs');if(!v){o.className='bad';o.textContent='Escribe una bandera primero.';return}
  try{const m=v.match(/^corpx\{(.+)\}$/i),inner=m?m[1]:v;const submittedFlag=r.id===2?inner:`CORPX{${inner}}`;const res=await fetch('/api/validar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,flag:submittedFlag})}),d=await res.json();
   if(d.ok)captureSuccess(r,'¡Bandera correcta! Lanzando cápsula de captura…');
   else{o.className='bad';o.textContent=res.status===429?'Demasiados intentos. Espera un minuto.':'Bandera incorrecta. Revisa el formato y vuelve a intentarlo.'}}
  catch(e){o.className='bad';o.textContent='No se pudo contactar al servidor.'}}}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(mode==='dialog'){if([' ','enter'].includes(k)){e.preventDefault();nextDialog()}return}
 if(mode==='login'){if(e.key==='Escape'){$('#login').style.display='none';mode='start'}return}if(e.key==='Escape'){if(mode==='menu')closeMenu();else if(mode==='panel'||mode==='inv')closeAll();else if(mode==='map')openMenu();return}
 if(e.target.tagName==='INPUT'){if(k==='enter'&&mode==='panel')$('#bv').click();return}
 if(mode==='start'&&!$('#character-screen').hidden&&(k==='arrowleft'||k==='arrowright')){e.preventDefault();browseCharacter(k==='arrowleft'?-1:1);return}
 if(k==='m'){if(mode==='menu')closeMenu();else openMenu();return}keys[k]=1;
 if(mode==='map'){if([' ','enter'].includes(k)){e.preventDefault();interact()}else if(k==='i')openInv();else if(k.startsWith('arrow'))e.preventDefault()}
 else if(mode==='inv'&&k==='i')closeAll()});
addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);addEventListener('blur',()=>keys={});
//audio

function loop(){tm++;$('#hud').hidden=['start','login','enc','capture-result'].includes(mode);if(['map','start','login','dialog'].includes(mode)){if(mode==='map')update();drawMap()}else if(mode==='enc'&&A)enc();requestAnimationFrame(loop)}
updateMusicButton(false);
$('#menu-toggle').onclick=()=>mode==='menu'?closeMenu():openMenu();
$('#menu-close').onclick=closeMenu;
$('#capture-continue').onclick=continueAfterCapture;
$('#menu-music').onclick=toggleMusic;
$('#menu-inventory').onclick=()=>{closeMenu();$('#panel').style.display='none';openInv()};
$('#menu-restart').onclick=restartChallenges;
$('#menu-exit').onclick=exitToStart;
$('#choose-screen').onclick=()=>{if(mode!=='start'||!R.length)return;$('#start').scrollTop=0;$('#story-screen').hidden=true;$('#character-screen').hidden=false;renderCharacterSelection()};
$('#back-story').onclick=()=>{$('#start').scrollTop=0;$('#character-screen').hidden=true;$('#story-screen').hidden=false};
$('#previous-character').onclick=()=>browseCharacter(-1);
$('#next-character').onclick=()=>browseCharacter(1);
$('#skills-toggle').onclick=()=>{const p=$('#skills-panel');p.hidden=!p.hidden;$('#skills-toggle').setAttribute('aria-expanded',String(!p.hidden));$('#skills-toggle').textContent=p.hidden?'VER HABILIDADES':'OCULTAR HABILIDADES'};
$('#select-character').onclick=()=>{chosenCharacterId=characters[activeCharacterIndex].id;persist();renderCharacterSelection()};
$('#begin').onclick=()=>{if(!chosenCharacterId)return;persist();openLogin()};
$('#login-form').onsubmit=submitLogin;$('#login-name').oninput=syncLogin;
$('#login-back').onclick=()=>{$('#login').style.display='none';mode='start'};
$('#dialog').onclick=nextDialog;
$('#music-toggle').onclick=e=>{e.stopPropagation();setSoundPanel($('#sound-panel').hidden)};
$('#sound-music').onclick=toggleMusic;
$('#sound-panel').onclick=e=>e.stopPropagation();
document.addEventListener('click',()=>{if(!$('#sound-panel').hidden)setSoundPanel(false)});
initVolumes();
document.querySelectorAll('.swatch').forEach(btn=>{
 if(btn.dataset.skin===playerSkinColor)btn.classList.add('active');
 btn.addEventListener('click',()=>{playerSkinColor=btn.dataset.skin;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b===btn));persist();if(!$('#character-screen').hidden)renderCharacterSelection()});
});
fetch('/api/retos').then(r=>r.json()).then(d=>{if(!Array.isArray(d)||!d.length)throw new Error('La lista de retos está vacía.');R=d;build();mode='start';window.HackemonMusic.setScene('menu');$('#choose-screen').disabled=false;$('#choose-screen').textContent='SELECCIONAR PERSONAJE';loop()}).catch(e=>{console.error('No se pudieron cargar los retos.',e);$('#choose-screen').textContent='No se pudo cargar el laboratorio';toast('No se pudo cargar la lista de retos.',9000)});

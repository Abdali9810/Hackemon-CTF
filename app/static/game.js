const $=s=>document.querySelector(s),c=$('#c'),g=c.getContext('2d');
const TS=16,W=48,H=32,PAS=[0,1,4,5,7],ZN=['','Ruta Césped','Bosque de Redes','Cumbre Root'],ZC=['','#58b848','#2f9fb0','#d0703c'];
let R=[],T=[],S={cap:{},hints:{}},mode='load',A=null,tm=0,keys={},tmr;
try{S=JSON.parse(localStorage.getItem('ctfm1'))||S}catch(e){console.error('No se pudo recuperar el progreso guardado.',e)}
if(!S||typeof S!=='object')S={cap:{},hints:{},items:{}};
if(!S.cap||typeof S.cap!=='object')S.cap={};
if(!S.hints||typeof S.hints!=='object')S.hints={};
if(!S.items||typeof S.items!=='object')S.items={};
const persist=()=>{try{localStorage.setItem('ctfm1',JSON.stringify(S));return true}catch(e){console.error('No se pudo guardar el progreso.',e);return false}};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const nz=z=>R.filter(r=>r.zona===z&&S.cap[r.id]).length,total=()=>R.filter(r=>S.cap[r.id]).length,unl=z=>z===1||nz(z-1)>=3;
const hintCount=r=>Math.min(r.cantidad_pistas,Array.isArray(S.hints[r.id])?S.hints[r.id].length:0);
const hintPenalty=(r,n)=>10+(r.zona-1)*5+(n-1)*5;
const hintCost=r=>Array.from({length:hintCount(r)},(_,i)=>hintPenalty(r,i+1)).reduce((a,b)=>a+b,0);
const earned=r=>Math.max(0,r.puntos-hintCost(r));
const score=()=>R.reduce((sum,r)=>sum+(S.cap[r.id]?earned(r):0),0);
const hs=(x,y)=>((Math.imul(x,73856093)^Math.imul(y,19349663))>>>0)%100;
function toast(s,ms=2800){const m=$('#msg');m.textContent=s;m.style.display='block';clearTimeout(tmr);tmr=setTimeout(()=>m.style.display='none',ms)}
function drawPreview(id,d,ch){const c=$(`#${id}`),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.scale(6,6);drawCharacter(ctx,8,1,d,0,ch);ctx.restore()}
function renderCharacterSelection(){const ch=characters[activeCharacterIndex];
 $('#character-count').textContent=`${String(activeCharacterIndex+1).padStart(2,'0')} / ${String(characters.length).padStart(2,'0')}`;
 $('#character-role').textContent=ch.role;$('#character-name').textContent=ch.name;$('#character-description').textContent=ch.description;
 $('#character-skills').innerHTML=ch.skills.map(skill=>`<li>${esc(skill)}</li>`).join('');
 $('#skills-panel').hidden=true;$('#skills-toggle').setAttribute('aria-expanded','false');$('#skills-toggle').textContent='VER HABILIDADES';
 $('#select-character').textContent=chosenCharacterId===ch.id?'PERSONAJE ELEGIDO':'ELEGIR ESTE PERSONAJE';
 $('#select-character').disabled=chosenCharacterId===ch.id;$('#begin').disabled=!chosenCharacterId;
 drawPreview('preview-front',0,ch);drawPreview('preview-back',1,ch)}
function browseCharacter(step){activeCharacterIndex=(activeCharacterIndex+step+characters.length)%characters.length;chosenCharacterId=null;renderCharacterSelection()}
function build(){
 for(let y=0;y<H;y++){T[y]=[];for(let x=0;x<W;x++){const n=hs(x,y),z3=x>=33;let v=z3?5:0;
  if(x===0||y===0||x===W-1||y===H-1)v=z3?6:2;else if([15,16,31,32].includes(x))v=3;
  else if(n<12)v=z3?6:2;else if(n<24&&!z3)v=1;else if(n>95&&!z3)v=7;T[y][x]=v}}
 for(let x=1;x<W-1;x++)T[16][x]=4;
 R.forEach(r=>{for(let y=Math.min(r.y,16);y<=Math.max(r.y,16);y++)T[y][r.x]=4;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=r.x+dx,Y=r.y+dy;if([2,6].includes(T[Y][X]))T[Y][X]=X>=33?5:0}});
 worldObjects.forEach(({x,y})=>{if(T[y][x]===2||T[y][x]===6)T[y][x]=x>=33?5:0})}
function tile(v,x,y,tx,ty){const f=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)};
 if([0,1,2,7].includes(v)){f('#58b848',0,0,16,16);if((tx*3+ty)%4===0){f('#68c858',3,4,2,2);f('#48a038',11,10,2,1)}}
 if(v===5||v===6){f('#a89878',0,0,16,16);if((tx+ty*2)%3===0){f('#988868',4,5,3,2);f('#b8a888',10,11,2,2)}}
 if(v===1){f('#3c9a3c',2,6,2,6);f('#3c9a3c',7,4,2,8);f('#3c9a3c',12,7,2,5);f('#78d868',3,6,1,3);f('#78d868',8,4,1,3)}
 if(v===7){f('#f8f8f8',5,5,2,2);f('#f8d030',6,6,1,1);f('#f85878',10,10,2,2)}
 if(v===2){f('#245824',1,8,14,6);f('#2f6f2f',1,1,14,10);f('#3d8b3d',3,0,10,4);f('#6b4a2a',6,12,4,4);f('#58b848',0,14,16,2)}
 if(v===6){f('#4a4a52',1,10,14,4);f('#6b6b73',1,3,14,8);f('#8a8a94',3,4,6,3)}
 if(v===3){f('#3890f8',0,0,16,16);const o=(Math.floor(tm/12)+tx*3)%8;f('#88c8ff',o,5,4,1);f('#88c8ff',(o+6)%12,11,3,1)}
 if(v===4){if([15,16,31,32].includes(tx)){f('#a8783c',0,0,16,16);f('#7a5428',0,5,16,1);f('#7a5428',0,11,16,1)}else{f('#d8c090',0,0,16,16);f('#c8b080',3,3,2,2);f('#e8d0a0',10,9,2,2)}}}
function ball(x,y,r,rot,col){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=col||'#2f9fb0';g.beginPath();g.arc(0,0,r,Math.PI,0);g.fill();
 g.fillStyle='#f8f8f8';g.beginPath();g.arc(0,0,r,0,Math.PI);g.fill();g.fillStyle='#222';g.fillRect(-r,-1,2*r,2);
 g.fillStyle='#f8d030';g.beginPath();g.arc(0,0,r*.35,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=1;g.stroke();g.restore()}
function spr(x,y,d,fr){const ch=characters.find(v=>v.id===P.characterId)||characters[0];drawCharacter(g,x,y,d,fr,ch)}
function drawCharacter(ctx,x,y,d,fr,ch){const f=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h)};
 f('rgba(0,0,0,.25)',3,13,10,3);f(ch.pants,4,10,3,5-(fr===1?1:0));f(ch.pants,9,10,3,5-(fr===2?1:0));f(ch.shirt,3,6,10,5);f('#f0c8a0',2,7,1,3);f('#f0c8a0',13,7,1,3);
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
const wildlife=[
 {x:7,y:15,flight:false,phase:0,name:'Brotiluz',message:'Brotiluz saluda y deja unas huellas brillantes en el cesped.'},
 {x:12,y:18,flight:true,phase:11,name:'Aleteo',message:'Aleteo da una vuelta sobre tu cabeza antes de seguir volando.'},
 {x:10,y:11,flight:false,phase:23,name:'Musguito',message:'Musguito se esconde entre la hierba y asoma con curiosidad.'},
 {x:21,y:14,flight:true,phase:7,name:'Chisparin',message:'Chisparin revolotea a tu alrededor. Parece lleno de energia.'},
 {x:26,y:18,flight:false,phase:17,name:'Caparock',message:'Caparock te saluda con un movimiento lento de su caparazon.'},
 {x:29,y:12,flight:true,phase:29,name:'Ventisca',message:'Ventisca agita sus alas y deja una brisa fresca.'},
 {x:37,y:15,flight:false,phase:5,name:'Pedrusco',message:'Pedrusco rueda un poquito y vuelve a quedarse quieto.'},
 {x:42,y:18,flight:true,phase:19,name:'Nubelin',message:'Nubelin flota a tu lado y luego asciende hacia las cumbres.'},
 {x:45,y:12,flight:false,phase:31,name:'Llamita',message:'Llamita da un saltito alegre y te invita a seguir explorando.'}
].map((creature,index)=>({...creature,sprite:mk({id:100+index})}));
const worldObjects=[
 {id:'flower-1',x:8,y:13,type:'flower',message:'Unas flores silvestres perfuman la Ruta Cesped.'},
 {id:'flower-2',x:13,y:21,type:'flower',message:'Las flores se mecen con la brisa del camino.'},
 {id:'flower-3',x:9,y:27,type:'flower',message:'Mariposas diminutas visitan este rincon lleno de flores.'},
 {id:'berry-1',x:9,y:10,type:'berry',message:'Has recogido una baya madura. Queda guardada en tu mochila.'},
 {id:'sign-1',x:14,y:14,type:'sign',message:'LETRERO: Ruta Cesped. Explora con calma y ayuda a quien encuentres.'},
 {id:'stone-1',x:18,y:21,type:'stone',message:'Una roca con marcas antiguas. Alguien paso por aqui hace mucho.'},
 {id:'flower-4',x:18,y:12,type:'flower',message:'Unas flores azules crecen al borde del Bosque de Redes.'},
 {id:'flower-5',x:24,y:18,type:'flower',message:'Hay flores violetas junto al sendero.'},
 {id:'berry-2',x:25,y:12,type:'berry',message:'Has recogido una baya silvestre. Queda guardada en tu mochila.'},
 {id:'sign-2',x:30,y:14,type:'sign',message:'LETRERO: Bosque de Redes. Sigue los caminos y observa las senales.'},
 {id:'crystal-1',x:33,y:14,type:'crystal',message:'El cristal vibra suavemente: la red de esta zona esta activa.'},
 {id:'flower-6',x:35,y:14,type:'flower',message:'Pequenas flores crecen entre las piedras de la cumbre.'},
 {id:'stone-2',x:40,y:11,type:'stone',message:'Una piedra pulida refleja la luz de la montana.'},
 {id:'berry-3',x:39,y:22,type:'berry',message:'Has recogido una baya de montana. Queda guardada en tu mochila.'},
 {id:'flower-7',x:41,y:19,type:'flower',message:'Las flores de la cumbre resisten el viento y el frio.'},
 {id:'sign-3',x:34,y:17,type:'sign',message:'LETRERO: Cumbre Root. Ya estas cerca del ultimo sector.'},
 {id:'crystal-2',x:45,y:26,type:'crystal',message:'El cristal guarda un destello de energia de la cumbre.'}
];
let jumpFrames=0;
function drawWildlife(cameraX,cameraY){
 wildlife.forEach((creature,index)=>{
  const {x,y,phase}=wildlifePosition(creature,cameraX,cameraY);
  if(x < -18 || x > 258 || y < -22 || y > 178)return;
  g.fillStyle='rgba(20,35,30,.3)';
  g.beginPath();g.ellipse(x+5,y+12,5,1.5,0,0,Math.PI*2);g.fill();
  if(creature.flight){
   const wingHeight=Math.floor((tm+creature.phase)%8/4);
   g.globalAlpha=.72;
   g.fillStyle='#e7f7ff';
   g.fillRect(x-2,y+3-wingHeight,3,2);
   g.fillRect(x+9,y+3-wingHeight,3,2);
   g.globalAlpha=1;
  }
  g.save();
  if(Math.cos(phase)<0){g.translate(x+10,y);g.scale(-1,1);g.drawImage(creature.sprite,0,0,10,10)}
  else g.drawImage(creature.sprite,x,y,10,10);
  g.restore();
 });
}
function wildlifePosition(creature,cameraX=0,cameraY=0){
 const phase=tm/(creature.flight?18:26)+creature.phase;
 const drift=Math.sin(phase)*(creature.flight?13:9);
 const hop=creature.flight?Math.sin(phase*1.7)*5:Math.max(0,Math.sin(phase*2))*1.5;
 return{x:creature.x*16-cameraX+drift,y:creature.y*16-cameraY-hop,phase};
}
function drawWorldObjects(cameraX,cameraY){
 worldObjects.forEach((item)=>{
  const x=item.x*16-cameraX+3,y=item.y*16-cameraY+3;
  if(x < -18 || x > 258 || y < -18 || y > 178)return;
  if(item.type==='flower'){
   const sway=Math.round(Math.sin(tm/18+item.x)*1);
   g.fillStyle='#267b37';g.fillRect(x+4,y+7,2,6);g.fillRect(x+9+sway,y+6,2,7);
   g.fillStyle='#54bf52';g.fillRect(x+2,y+9,3,2);g.fillRect(x+10+sway,y+10,3,2);
   g.fillStyle=item.x%2?'#ff8fc1':'#fff0a0';g.fillRect(x+2,y+2,3,3);g.fillRect(x+6,y,3,3);g.fillRect(x+10,y+2,3,3);
   g.fillStyle='#ffde00';g.fillRect(x+6,y+3,3,3);
  }else if(item.type==='berry'){
   g.fillStyle='#276c38';g.fillRect(x+1,y+5,12,6);g.fillRect(x+3,y+3,8,2);
   if(!S.items[item.id]){g.fillStyle='#cb3657';g.fillRect(x+3,y+5,2,2);g.fillRect(x+9,y+7,2,2);g.fillStyle='#ffe07a';g.fillRect(x+4,y+5,1,1);g.fillRect(x+10,y+7,1,1)}
  }else if(item.type==='sign'){
   g.fillStyle='#714422';g.fillRect(x+6,y+6,3,9);
   g.fillStyle='#e2b965';g.fillRect(x+1,y+1,13,7);g.fillStyle='#805326';g.fillRect(x+3,y+3,2,1);g.fillRect(x+7,y+3,4,1);g.fillRect(x+5,y+5,5,1);
  }else if(item.type==='stone'){
   g.fillStyle='#777b84';g.fillRect(x+1,y+7,12,6);g.fillRect(x+3,y+4,7,5);g.fillStyle='#a8adb3';g.fillRect(x+4,y+5,3,2);
  }else if(item.type==='crystal'){
   g.fillStyle='#527bdb';g.fillRect(x+4,y+2,5,3);g.fillRect(x+2,y+5,9,6);g.fillStyle='#91e8ff';g.fillRect(x+4,y+4,2,5);g.fillRect(x+7,y+6,2,3);
  }
 });
}
function nearbyInteraction(){
 const px=P.x+8,py=P.y+8,choices=[];
 const add=(type,item,x,y)=>{const distance=Math.hypot(px-x,py-y);if(distance<=26)choices.push({type,item,x,y,distance})};
 const challenge=near();
 if(challenge)add('challenge',challenge,challenge.x*16+8,challenge.y*16+8);
 wildlife.forEach(creature=>{const position=wildlifePosition(creature);add('creature',creature,position.x+5,position.y+5)});
 worldObjects.forEach(item=>add('object',item,item.x*16+8,item.y*16+8));
 return choices.sort((a,b)=>a.distance-b.distance)[0]||null;
}
function interactNearby(){
 const target=nearbyInteraction();
 if(!target)return toast('Acercate a una criatura, flor o letrero para interactuar.');
 if(target.type==='challenge')return interact();
 if(target.type==='creature')return toast(`${target.item.name}: ${target.item.message}`,4000);
 const item=target.item;
 if(item.type==='berry'){
  if(S.items[item.id])return toast('Este arbusto ya no tiene bayas maduras.');
  S.items[item.id]=true;const saved=persist();
  return toast(saved?item.message:'No se pudo guardar la baya en tu mochila.',4000);
 }
 toast(item.message,4000);
}
function jump(){
 if(P.jump>0)return;
 P.jump=18;
}
function sil(r){if(cs[r.id])return cs[r.id];const k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d');x.drawImage(mk(r),0,0);x.globalCompositeOperation='source-in';x.fillStyle='#10161a';x.fillRect(0,0,10,10);return cs[r.id]=k}
function tint(r,col){const k=document.createElement('canvas');k.width=k.height=10;const x=k.getContext('2d');x.drawImage(mk(r),0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,10,10);return k}
const P={x:48,y:256,dir:0,mv:0,jump:0,characterId:null},DD=[[0,1],[0,-1],[-1,0],[1,0]];let lastT=0;
const characters=[
 {id:'byte',name:'BYTE',role:'Especialista web',description:'Un estratega curioso que descubre accesos y pistas donde nadie mas mira.',shirt:'#2fa84f',pants:'#2b4a9a',hat:'#f8f8f8',hatBand:'#e03030',hair:'#53331e',accent:'#ffde00',headwear:'cap',skills:['Ojo de codigo · detecta detalles ocultos','Analisis web · experto en aplicaciones']},
 {id:'cipher',name:'CIPHER',role:'Experto en sistemas',description:'Un explorador audaz que encuentra patrones y abre rutas bloqueadas.',shirt:'#d34c37',pants:'#26334e',hat:'#252a3b',hatBand:'#f5bc35',hair:'#372b28',accent:'#75d9e8',headwear:'hood',skills:['Lectura de patrones · une pistas','Fuerza bruta · prueba soluciones con metodo']},
 {id:'pixel',name:'PIXEL',role:'Analista de red',description:'Una mente veloz que sigue cada paquete hasta llegar a la fuente.',shirt:'#3977c6',pants:'#553e8f',hat:'#f2f2f2',hatBand:'#4d56cf',hair:'#6a3b25',accent:'#55dfc2',headwear:'headset',skills:['Rastreo de red · sigue el flujo de datos','Criptografia · descifra mensajes']}
];
let activeCharacterIndex=0,chosenCharacterId=null;
function can(tx,ty){if(tx<0||ty<0||tx>=W||ty>=H)return false;
 if(tx===15&&!unl(2)){if(tm-lastT>90){toast('Un guardia bloquea el puente: captura 3 criaturas de la Zona 1.');lastT=tm}return false}
 if(tx===31&&!unl(3)){if(tm-lastT>90){toast('Un guardia bloquea el puente: captura 3 criaturas de la Zona 2.');lastT=tm}return false}
 return PAS.includes(T[ty][tx])}
function update(){if(P.jump>0)P.jump--;if(P.mv>0){const d=DD[P.dir];P.x+=d[0]*2;P.y+=d[1]*2;P.mv-=2;return}
 const k=keys,dir=(k.arrowdown||k.s)?0:(k.arrowup||k.w)?1:(k.arrowleft||k.a)?2:(k.arrowright||k.d)?3:-1;if(dir<0)return;
 P.dir=dir;const d=DD[dir];if(can(P.x/16+d[0],P.y/16+d[1]))P.mv=16}
function near(){const tx=Math.round(P.x/16),ty=Math.round(P.y/16);return R.find(r=>Math.abs(r.x-tx)+Math.abs(r.y-ty)<=1)}
function drawMap(){const cx=Math.max(0,Math.min(W*16-240,P.x+8-120)),cy=Math.max(0,Math.min(H*16-160,P.y+8-80));
 for(let ty=Math.floor(cy/16);ty<Math.ceil((cy+160)/16);ty++)for(let tx=Math.floor(cx/16);tx<Math.ceil((cx+240)/16);tx++)tile(T[ty][tx],tx*16-cx,ty*16-cy,tx,ty);
 drawWildlife(cx,cy);drawWorldObjects(cx,cy);
 const nr=near();
 R.forEach(r=>{const x=r.x*16-cx,y=r.y*16-cy,done=S.cap[r.id];g.fillStyle='#555';g.fillRect(x+3,y+11,10,4);
  if(!done){g.globalAlpha=.25+.2*Math.sin(tm/10+r.id);g.fillStyle='#fff';g.beginPath();g.arc(x+8,y+6,9,0,7);g.fill();g.globalAlpha=1}
  ball(x+8,y+6,5,0,done?'#777':ZC[r.zona]);if(done){g.fillStyle='#fff';g.font='bold 8px monospace';g.fillText('✓',x+5,y+4)}
  if(r===nr&&!done){g.fillStyle='#fff';g.font='bold 9px monospace';g.fillText('!',x+6,y-4+Math.sin(tm/6)*1.5)}});
 const jumpHeight=P.jump>0?Math.sin((18-P.jump)/18*Math.PI)*10:0;
 spr(P.x-cx,P.y-cy-4-jumpHeight,P.dir,P.mv>0?(Math.floor(P.mv/4)%2?1:2):0);
 const target=nearbyInteraction();if(target&&target.type!=='challenge'){g.fillStyle='#fff';g.fillRect(target.x-cx+2,target.y-cy-13,12,8);g.fillStyle='#273999';g.font='bold 6px monospace';g.fillText('E',target.x-cx+6,target.y-cy-7)}
 const z=P.x<240?1:P.x<496?2:3;g.fillStyle='rgba(0,0,0,.7)';g.fillRect(0,0,240,22);g.fillStyle='#fff';g.font='bold 8px monospace';g.fillText(`${ZN[z]} · ${total()}/12`,4,9);g.fillText(`Puntos: ${score()} · [I] inventario`,4,19)}
function interact(){const r=near();if(!r)return;if(S.cap[r.id])return toast(`Ya capturaste a ${r.criatura}.`);
 toast('¡Un reto salvaje apareció! Lanzando cápsula…');A={kind:'open',r,k:0,done:()=>openPanel(r)};mode='enc'}
function enc(){const{r,kind}=A,k=++A.k,cx=170,cy=64,gy=104,bx=30,by=140,zc=ZC[r.zona];
 g.fillStyle='#bfe3ff';g.fillRect(0,0,240,160);g.fillStyle='#d8f0ff';g.fillRect(0,40,240,20);g.fillStyle='#78c850';g.fillRect(0,92,240,68);g.fillStyle='#68b840';g.fillRect(0,92,240,3);
 g.fillStyle='#5aa83a';[[170,102,52,9],[52,150,56,8]].forEach(([x,y,a,b])=>{g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fill()});
 const cr=(sc,img)=>g.drawImage(img,cx-30*sc,cy-30*sc+8,60*sc,60*sc),arc=p=>[bx+(cx-bx)*p,by+(cy-by)*p-48*Math.sin(Math.PI*p)];
 if(kind==='open'){cr(1,sil(r));if(k<50){const[x,y]=arc(k/50);ball(x,y,6,k/3,zc)}
  else if(k<85){const p=(k-50)/35;g.globalAlpha=1-p;g.fillStyle='#fff';g.fillRect(0,0,240,160);g.globalAlpha=1}
  else{A.done();A=null;return}}
 else{ if(k<45){cr(1,mk(r));const[x,y]=arc(k/45);ball(x,y,6,k/3,zc)}
  else if(k<70){const p=(k-45)/25;if(p<1)g.drawImage(tint(r,'#ff5050'),cx-30*(1-p),cy-30*(1-p)+8,60*(1-p),60*(1-p));ball(cx,cy,6+3*Math.sin(p*3),0,zc)}
  else if(k<105){const p=(k-70)/35;const y=p<.4?cy+(gy-cy)*(p/.4)**2:gy-Math.abs(Math.sin((p-.4)/.6*Math.PI*2))*10*(1-(p-.4)/.6);ball(cx,y,6,0,zc)}
  else if(k<195){const ph=(k-105)%30;ball(cx,gy,6,ph<20?Math.sin(ph/20*Math.PI*2)*.5:0,zc)}
  else if(k<235){ball(cx,gy,6,0,zc);g.fillStyle='#ffe84a';for(let i=0;i<8;i++){const a=i*Math.PI/4,d=(k-195)*.8;g.fillRect(cx+Math.cos(a)*d,gy+Math.sin(a)*d,2,2)}}
  else{A.done();A=null;return}}}
function closeAll(){$('#panel').style.display=$('#inv').style.display='none';if(mode!=='enc')mode='map'}
function openInv(){mode='inv';const v=$('#inv'),berries=Object.keys(S.items).filter(id=>id.startsWith('berry-')).length;v.innerHTML=`<h2>Inventario · ${total()}/12 · ${score()} puntos</h2><small>Cada criatura es un reto resuelto. Bayas recogidas: ${berries}/3.</small><div class=grid>`+R.map(r=>{const got=S.cap[r.id];
 return `<div class="card ${got?'':'off'}"><img src="${(got?mk(r):sil(r)).toDataURL()}"><b>${got?esc(r.criatura):'???'}</b><small>${got?esc(r.tipo)+' · Zona '+r.zona:'Reto '+r.id+' · Zona '+r.zona}</small>${got?`<small>${esc(r.titulo)} · ${earned(r)} puntos</small>`:''}</div>`}).join('')+`</div><button onclick="closeAll()">Cerrar (Esc)</button>`;v.style.display='block'}
function openPanel(r){mode='panel';let h=hintCount(r),pending=false;const p=$('#panel');
 p.innerHTML=`<div class=row><img src="${sil(r).toDataURL()}"><div><h2>Reto ${r.id}: ${esc(r.titulo)}</h2><small>Zona ${r.zona} · ${esc(ZN[r.zona])} · Criatura tipo ${esc(r.tipo)}</small></div></div><p>${esc(r.brief)}</p><p><b>Objetivo:</b> <code>${esc(r.objetivo)}</code></p><p>${r.tools.map(t=>`<span class=chip>${esc(t)}</span>`).join('')}</p><div class=eth><b>Ética:</b> ${esc(r.etica)}</div><p><b>Valor:</b> ${r.puntos} puntos · <span id=rp>Si lo resuelves ahora: ${earned(r)} puntos</span></p><div id=ph aria-live=polite></div><p id=hs role=status></p><button id=bh>Mostrar pista (${h}/${r.cantidad_pistas})${h<r.cantidad_pistas?` · −${hintPenalty(r,h+1)} puntos`:''}</button><p><input id=fl placeholder="CORPX{...}" autocomplete=off><button id=bv>Validar bandera</button></p><p id=rs></p><button onclick="closeAll()">Volver al mapa (Esc)</button>`;
 p.style.display='block';p.querySelector('#fl').focus();
 const ph=p.querySelector('#ph'),hs=p.querySelector('#hs'),bh=p.querySelector('#bh'),rp=p.querySelector('#rp');
 const updateHintUI=()=>{h=hintCount(r);bh.textContent=`Mostrar pista (${h}/${r.cantidad_pistas})${h<r.cantidad_pistas?` · −${hintPenalty(r,h+1)} puntos`:''}`;bh.disabled=pending||h>=r.cantidad_pistas;rp.textContent=`Si lo resuelves ahora: ${earned(r)} puntos`};
 (S.hints[r.id]||[]).slice(0,h).forEach((text,i)=>{ph.insertAdjacentHTML('beforeend',`<p><b>Pista ${i+1}:</b> ${esc(text)}</p>`)});
 updateHintUI();
 bh.onclick=async()=>{if(pending||h>=r.cantidad_pistas)return;const index=h;pending=true;updateHintUI();hs.className='';hs.textContent='Cargando pista…';
  try{const res=await fetch(`/api/pistas/${r.id}/${index+1}`),d=await res.json();if(!res.ok||typeof d.pista!=='string')throw new Error('No se pudo obtener la pista.');
   const revealed=Array.isArray(S.hints[r.id])?S.hints[r.id]:[];let saved=true;
   if(revealed.length===index){S.hints[r.id]=[...revealed,d.pista];saved=persist();ph.insertAdjacentHTML('beforeend',`<p><b>Pista ${index+1}:</b> ${esc(d.pista)}</p>`)}
   updateHintUI();hs.textContent=`Pista revelada. Esta pista resta ${hintPenalty(r,index+1)} puntos al reto.${saved===false?' No se pudo guardar el progreso en este navegador.':''}`}
  catch(e){hs.className='bad';hs.textContent='No se pudo cargar la pista. Comprueba tu conexión e inténtalo de nuevo.'}
  finally{pending=false;updateHintUI()}};
 p.querySelector('#bv').onclick=async()=>{const v=p.querySelector('#fl').value.trim(),o=p.querySelector('#rs'),bv=p.querySelector('#bv');if(!v){o.className='bad';o.textContent='Escribe una bandera primero.';return}
  bv.disabled=true;
  try{const res=await fetch('/api/validar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id,flag:v})}),d=await res.json();
   if(d.ok){closeAll();toast(`¡Bandera correcta! Lanzando cápsula de captura…`);mode='enc';A={kind:'capture',r,k:0,done:()=>{if(!S.cap[r.id])S.cap[r.id]=Date.now();const saved=persist();mode='map';toast(`¡Capturaste a ${r.criatura}! +${earned(r)} puntos (${score()} total) · ${total()}/12 retos · [I] inventario${saved?'':' · No se pudo guardar el progreso'}`,5000)}}}
   else{o.className='bad';o.textContent=res.status===429?'Demasiados intentos. Espera un minuto.':'Bandera incorrecta. Revisa el formato y vuelve a intentarlo.';bv.disabled=false}}
  catch(e){o.className='bad';o.textContent='No se pudo contactar al servidor.';bv.disabled=false}}}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.key==='Escape'){if(mode==='panel'||mode==='inv')closeAll();return}
 if(e.target.tagName==='INPUT'){if(k==='enter')$('#bv').click();return}if(e.repeat&&[' ','enter','e'].includes(k))return;keys[k]=1;
 if(mode==='map'){if(k===' '){e.preventDefault();const challenge=near();if(challenge&&!S.cap[challenge.id])interact();else jump()}else if(k==='enter'||k==='e'){e.preventDefault();interactNearby()}else if(k==='i')openInv();else if(k.startsWith('arrow'))e.preventDefault()}
 else if(mode==='inv'&&k==='i')closeAll()});
addEventListener('keyup',e=>delete keys[e.key.toLowerCase()]);addEventListener('blur',()=>keys={});
function loop(){tm++;if(mode==='map'||mode==='start'){if(mode==='map')update();drawMap()}else if(mode==='enc'&&A)enc();requestAnimationFrame(loop)}
function updateMusicButton(enabled){const b=$('#music-toggle');b.textContent=enabled?'♫ Música: encendida':'♫ Activar música';b.setAttribute('aria-pressed',String(enabled))}
$('#choose-screen').onclick=()=>{if(mode!=='start'||!R.length)return;$('#story-screen').hidden=true;$('#character-screen').hidden=false;renderCharacterSelection()}
$('#back-story').onclick=()=>{chosenCharacterId=null;$('#begin').disabled=true;$('#character-screen').hidden=true;$('#story-screen').hidden=false}
$('#previous-character').onclick=()=>browseCharacter(-1)
$('#next-character').onclick=()=>browseCharacter(1)
$('#skills-toggle').onclick=()=>{const p=$('#skills-panel');p.hidden=!p.hidden;$('#skills-toggle').setAttribute('aria-expanded',String(!p.hidden));$('#skills-toggle').textContent=p.hidden?'VER HABILIDADES':'OCULTAR HABILIDADES'}
$('#select-character').onclick=()=>{chosenCharacterId=characters[activeCharacterIndex].id;renderCharacterSelection()}
$('#begin').onclick=()=>{if(mode!=='start'||!R.length||!chosenCharacterId)return;P.characterId=chosenCharacterId;mode='map';$('#start').style.display='none';window.HackemonMusic.start().then(()=>updateMusicButton(true)).catch(e=>{console.error('No se pudo iniciar la música.',e);toast('No se pudo iniciar la música en este navegador.',4000)});toast('Flechas: moverte · Espacio: saltar o abrir capsula cercana · E: interactuar · I: mochila.',5000)}
$('#music-toggle').onclick=async()=>{try{updateMusicButton(await window.HackemonMusic.toggle())}catch(e){console.error('No se pudo cambiar la música.',e);toast('No se pudo reproducir música en este navegador.',4000)}}
fetch('/api/retos').then(r=>{if(!r.ok)throw new Error(`Error HTTP ${r.status}`);return r.json()}).then(d=>{if(!Array.isArray(d)||!d.length)throw new Error('La lista de retos está vacía.');R=d;build();mode='start';$('#choose-screen').disabled=false;$('#choose-screen').textContent='SELECCIONAR PERSONAJE';loop()}).catch(e=>{console.error('No se pudieron cargar los retos.',e);$('#choose-screen').textContent='No se pudo cargar el laboratorio';toast('No se pudo cargar la lista de retos.',9000)});

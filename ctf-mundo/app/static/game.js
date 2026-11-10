// Elementos, constantes del mundo y estado de juego
const $ = (selector) => document.querySelector(selector);
const canvas = $('#c');
const g = canvas.getContext('2d');
g.scale(2, 2);

const TILE_SIZE = 16;
const MAP_WIDTH = 48;
const MAP_HEIGHT = 32;
const PASSABLE_TILES = [0, 1, 4, 5, 7];
const ZONE_NAMES = ['', 'Ruta Césped', 'Bosque de Redes', 'Cumbre Root'];
const ZONE_COLORS = ['', '#58b848', '#2f9fb0', '#d0703c'];
const DIRECTIONS = [[0, 1], [0, -1], [-1, 0], [1, 0]];

let challenges = [];
let tiles = [];
let saveData = { cap: {}, items: {} };
let mode = 'load';
let animation = null;
let frame = 0;
let keys = {};
let toastTimer;
let lastGuardMessage = 0;

const player = { x: 48, y: 256, dir: 0, moving: 0, jump: 0, characterId: null };
const characters = [
  {
    id: 'byte',
    name: 'BYTE',
    role: 'Especialista web',
    description: 'Un estratega curioso que descubre accesos y pistas donde nadie mas mira.',
    shirt: '#2fa84f',
    pants: '#2b4a9a',
    hat: '#f8f8f8',
    hatBand: '#e03030',
    hair: '#53331e',
    accent: '#ffde00',
    headwear: 'cap',
    skills: ['Ojo de codigo · detecta detalles ocultos', 'Analisis web · experto en aplicaciones']
  },
  {
    id: 'cipher',
    name: 'CIPHER',
    role: 'Experto en sistemas',
    description: 'Un explorador audaz que encuentra patrones y abre rutas bloqueadas.',
    shirt: '#d34c37',
    pants: '#26334e',
    hat: '#252a3b',
    hatBand: '#f5bc35',
    hair: '#372b28',
    accent: '#75d9e8',
    headwear: 'hood',
    skills: ['Lectura de patrones · une pistas', 'Fuerza bruta · prueba soluciones con metodo']
  },
  {
    id: 'pixel',
    name: 'PIXEL',
    role: 'Analista de red',
    description: 'Una mente veloz que sigue cada paquete hasta llegar a la fuente.',
    shirt: '#3977c6',
    pants: '#553e8f',
    hat: '#f2f2f2',
    hatBand: '#4d56cf',
    hair: '#6a3b25',
    accent: '#55dfc2',
    headwear: 'headset',
    skills: ['Rastreo de red · sigue el flujo de datos', 'Criptografia · descifra mensajes']
  }
];
let activeCharacterIndex = 0;
let chosenCharacterId = null;
const creatureSprites = {};
const silhouetteSprites = {};

try {
  saveData = JSON.parse(localStorage.getItem('ctfm1')) || saveData;
} catch (error) {
  console.warn('No se pudo leer el progreso guardado.', error);
}
if (!saveData || typeof saveData !== 'object') saveData = { cap: {}, items: {} };
if (!saveData.cap || typeof saveData.cap !== 'object') saveData.cap = {};
if (!saveData.items || typeof saveData.items !== 'object') saveData.items = {};

// Persistencia, formato y progreso
function persistProgress() {
  try {
    localStorage.setItem('ctfm1', JSON.stringify(saveData));
  } catch (error) {
    console.warn('No se pudo guardar el progreso.', error);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[char]);
}

function countCapturedInZone(zone) {
  return challenges.filter((challenge) =>
    challenge.zona === zone && saveData.cap[challenge.id]
  ).length;
}

function countCaptured() {
  return challenges.filter((challenge) => saveData.cap[challenge.id]).length;
}

function isZoneUnlocked(zone) {
  return zone === 1 || countCapturedInZone(zone - 1) >= 3;
}

function hashTile(x, y) {
  return ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0) % 100;
}

function showToast(message, duration = 2800) {
  const element = $('#msg');
  element.textContent = message;
  element.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.style.display = 'none';
  }, duration);
}

function drawCharacterPreview(canvasId, direction, character) {
  const preview = $(`#${canvasId}`);
  const context = preview.getContext('2d');
  context.clearRect(0, 0, preview.width, preview.height);
  context.save();
  context.scale(6, 6);
  drawCharacterSprite(context, 8, 1, direction, 0, character);
  context.restore();
}

function renderCharacterSelection() {
  const character = characters[activeCharacterIndex];
  $('#character-count').textContent =
    `${String(activeCharacterIndex + 1).padStart(2, '0')} / ${String(characters.length).padStart(2, '0')}`;
  $('#character-role').textContent = character.role;
  $('#character-name').textContent = character.name;
  $('#character-description').textContent = character.description;
  $('#character-skills').innerHTML = character.skills
    .map((skill) => `<li>${escapeHtml(skill)}</li>`)
    .join('');
  $('#skills-panel').hidden = true;
  $('#skills-toggle').setAttribute('aria-expanded', 'false');
  $('#skills-toggle').textContent = 'VER HABILIDADES';
  $('#select-character').textContent = chosenCharacterId === character.id
    ? 'PERSONAJE ELEGIDO'
    : 'ELEGIR ESTE PERSONAJE';
  $('#select-character').disabled = chosenCharacterId === character.id;
  $('#begin').disabled = !chosenCharacterId;
  drawCharacterPreview('preview-front', 0, character);
  drawCharacterPreview('preview-back', 1, character);
}

function browseCharacter(step) {
  activeCharacterIndex = (activeCharacterIndex + step + characters.length) % characters.length;
  chosenCharacterId = null;
  renderCharacterSelection();
}

// Construcción y dibujo del mapa
function buildMap() {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const value = hashTile(x, y);
      const isMountain = x >= 33;
      let tile = isMountain ? 5 : 0;

      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        tile = isMountain ? 6 : 2;
      } else if ([15, 16, 31, 32].includes(x)) {
        tile = 3;
      } else if (value < 12) {
        tile = isMountain ? 6 : 2;
      } else if (value < 24 && !isMountain) {
        tile = 1;
      } else if (value > 95 && !isMountain) {
        tile = 7;
      }

      tiles[y][x] = tile;
    }
  }

  for (let x = 1; x < MAP_WIDTH - 1; x++) {
    tiles[16][x] = 4;
  }

  challenges.forEach((challenge) => {
    for (let y = Math.min(challenge.y, 16); y <= Math.max(challenge.y, 16); y++) {
      tiles[y][challenge.x] = 4;
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = challenge.x + dx;
        const y = challenge.y + dy;
        if ([2, 6].includes(tiles[y][x])) {
          tiles[y][x] = x >= 33 ? 5 : 0;
        }
      }
    }
  });
  worldObjects.forEach(({ x, y }) => {
    if ([2, 6].includes(tiles[y][x])) tiles[y][x] = x >= 33 ? 5 : 0;
  });
}

function drawTile(value, x, y, tileX, tileY) {
  const fill = (color, offsetX, offsetY, width, height) => {
    g.fillStyle = color;
    g.fillRect(x + offsetX, y + offsetY, width, height);
  };

  if ([0, 1, 2, 7].includes(value)) {
    fill('#58b848', 0, 0, 16, 16);
    if ((tileX * 3 + tileY) % 4 === 0) {
      fill('#68c858', 3, 4, 2, 2);
      fill('#48a038', 11, 10, 2, 1);
    }
  }

  if (value === 5 || value === 6) {
    fill('#a89878', 0, 0, 16, 16);
    if ((tileX + tileY * 2) % 3 === 0) {
      fill('#988868', 4, 5, 3, 2);
      fill('#b8a888', 10, 11, 2, 2);
    }
  }

  if (value === 1) {
    fill('#3c9a3c', 2, 6, 2, 6);
    fill('#3c9a3c', 7, 4, 2, 8);
    fill('#3c9a3c', 12, 7, 2, 5);
    fill('#78d868', 3, 6, 1, 3);
    fill('#78d868', 8, 4, 1, 3);
  }

  if (value === 7) {
    fill('#f8f8f8', 5, 5, 2, 2);
    fill('#f8d030', 6, 6, 1, 1);
    fill('#f85878', 10, 10, 2, 2);
  }

  if (value === 2) {
    fill('#245824', 1, 8, 14, 6);
    fill('#2f6f2f', 1, 1, 14, 10);
    fill('#3d8b3d', 3, 0, 10, 4);
    fill('#6b4a2a', 6, 12, 4, 4);
    fill('#58b848', 0, 14, 16, 2);
  }

  if (value === 6) {
    fill('#4a4a52', 1, 10, 14, 4);
    fill('#6b6b73', 1, 3, 14, 8);
    fill('#8a8a94', 3, 4, 6, 3);
  }

  if (value === 3) {
    fill('#3890f8', 0, 0, 16, 16);
    const offset = (Math.floor(frame / 12) + tileX * 3) % 8;
    fill('#88c8ff', offset, 5, 4, 1);
    fill('#88c8ff', (offset + 6) % 12, 11, 3, 1);
  }

  if (value === 4) {
    if ([15, 16, 31, 32].includes(tileX)) {
      fill('#a8783c', 0, 0, 16, 16);
      fill('#7a5428', 0, 5, 16, 1);
      fill('#7a5428', 0, 11, 16, 1);
    } else {
      fill('#d8c090', 0, 0, 16, 16);
      fill('#c8b080', 3, 3, 2, 2);
      fill('#e8d0a0', 10, 9, 2, 2);
    }
  }
}

function drawMap() {
  const cameraX = Math.max(0, Math.min(MAP_WIDTH * 16 - 240, player.x + 8 - 120));
  const cameraY = Math.max(0, Math.min(MAP_HEIGHT * 16 - 160, player.y + 8 - 80));

  for (let tileY = Math.floor(cameraY / 16); tileY < Math.ceil((cameraY + 160) / 16); tileY++) {
    for (let tileX = Math.floor(cameraX / 16); tileX < Math.ceil((cameraX + 240) / 16); tileX++) {
      drawTile(tiles[tileY][tileX], tileX * 16 - cameraX, tileY * 16 - cameraY, tileX, tileY);
    }
  }

  drawWildlife(cameraX, cameraY);
  drawWorldObjects(cameraX, cameraY);

  const nearbyChallenge = findNearbyChallenge();
  challenges.forEach((challenge) => {
    const x = challenge.x * 16 - cameraX;
    const y = challenge.y * 16 - cameraY;
    const captured = saveData.cap[challenge.id];
    g.fillStyle = '#555';
    g.fillRect(x + 3, y + 11, 10, 4);

    if (!captured) {
      g.globalAlpha = .25 + .2 * Math.sin(frame / 10 + challenge.id);
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(x + 8, y + 6, 9, 0, 7);
      g.fill();
      g.globalAlpha = 1;
    }

    drawBall(x + 8, y + 6, 5, 0, captured ? '#777' : ZONE_COLORS[challenge.zona]);
    if (captured) {
      g.fillStyle = '#fff';
      g.font = 'bold 8px monospace';
      g.fillText('✓', x + 5, y + 4);
    }

    if (challenge === nearbyChallenge && !captured) {
      g.fillStyle = '#fff';
      g.font = 'bold 9px monospace';
      g.fillText('!', x + 6, y - 4 + Math.sin(frame / 6) * 1.5);
    }
  });

  const jumpHeight = player.jump > 0
    ? Math.sin((18 - player.jump) / 18 * Math.PI) * 10
    : 0;
  drawPlayer(
    player.x - cameraX,
    player.y - cameraY - 4 - jumpHeight,
    player.dir,
    player.moving > 0 ? (Math.floor(player.moving / 4) % 2 ? 1 : 2) : 0
  );

  const target = nearbyInteraction();
  if (target && target.type !== 'challenge') {
    g.fillStyle = '#fff';
    g.fillRect(target.x - cameraX + 2, target.y - cameraY - 13, 12, 8);
    g.fillStyle = '#273999';
    g.font = 'bold 6px monospace';
    g.fillText('E', target.x - cameraX + 6, target.y - cameraY - 7);
  }

  const zone = player.x < 240 ? 1 : player.x < 496 ? 2 : 3;
  g.fillStyle = 'rgba(0,0,0,.6)';
  g.fillRect(0, 0, 240, 12);
  g.fillStyle = '#fff';
  g.font = 'bold 8px monospace';
  g.fillText(`${ZONE_NAMES[zone]} · ${countCaptured()}/12 · [I] inventario`, 4, 9);
}

// Sprites y animaciones de criaturas
function drawBall(x, y, radius, rotation, color) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.fillStyle = color || '#2f9fb0';
  g.beginPath();
  g.arc(0, 0, radius, Math.PI, 0);
  g.fill();
  g.fillStyle = '#f8f8f8';
  g.beginPath();
  g.arc(0, 0, radius, 0, Math.PI);
  g.fill();
  g.fillStyle = '#222';
  g.fillRect(-radius, -1, 2 * radius, 2);
  g.fillStyle = '#f8d030';
  g.beginPath();
  g.arc(0, 0, radius * .35, 0, 7);
  g.fill();
  g.strokeStyle = '#222';
  g.lineWidth = 1;
  g.stroke();
  g.restore();
}

function drawPlayer(x, y, direction, frameOffset) {
  const character = characters.find(({ id }) => id === player.characterId) || characters[0];
  drawCharacterSprite(g, x, y, direction, frameOffset, character);
}

function drawCharacterSprite(context, x, y, direction, frameOffset, character) {
  const fill = (color, offsetX, offsetY, width, height) => {
    context.fillStyle = color;
    context.fillRect(x + offsetX, y + offsetY, width, height);
  };

  fill('rgba(0,0,0,.25)', 3, 13, 10, 3);
  fill(character.pants, 4, 10, 3, 5 - (frameOffset === 1 ? 1 : 0));
  fill(character.pants, 9, 10, 3, 5 - (frameOffset === 2 ? 1 : 0));
  fill(character.shirt, 3, 6, 10, 5);
  fill('#f0c8a0', 2, 7, 1, 3);
  fill('#f0c8a0', 13, 7, 1, 3);
  fill(character.hair, 4, 1, 8, 6);
  if (direction !== 1) {
    fill('#f0c8a0', 4, 2, 8, 5);
  } else {
    fill(character.hair, 4, 1, 8, 5);
  }
  if (character.headwear === 'hood') {
    fill(character.hat, 2, 0, 12, 2);
    fill(character.hat, 1, 2, 2, 4);
    fill(character.hat, 13, 2, 2, 4);
    fill(character.hatBand, 2, 2, 12, 1);
  } else if (character.headwear === 'headset') {
    fill(character.hat, 4, 0, 8, 2);
    fill(character.accent, 1, 3, 2, 4);
    fill(character.accent, 13, 3, 2, 4);
    fill(character.hatBand, 4, 0, 8, 1);
  } else {
    fill(character.hat, 3, 0, 10, 3);
    fill(character.hatBand, 3, 3, 10, 1);
    fill(character.accent, 7, 1, 2, 1);
  }

  if (direction === 0) {
    fill('#222', 6, 4, 1, 1);
    fill('#222', 9, 4, 1, 1);
  }
  if (direction === 2) fill('#222', 5, 4, 1, 1);
  if (direction === 3) fill('#222', 10, 4, 1, 1);
}

function createRandom(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function getCreatureSprite(challenge) {
  if (creatureSprites[challenge.id]) return creatureSprites[challenge.id];

  const random = createRandom(challenge.id * 7919 + 13);
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 10;
  const context = sprite.getContext('2d');
  const hue = (challenge.id * 47) % 360;
  const body = [];

  for (let y = 0; y < 8; y++) {
    body[y] = [];
    for (let x = 0; x < 4; x++) {
      body[y][x] = ((y > 1 && y < 7 && x > 0) ? random() < .7 : random() < .3) ? 1 : 0;
    }
  }

  body[3][2] = body[3][3] = body[4][2] = body[4][3] = body[5][2] = body[5][3] = 1;
  const pixels = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      pixels[y + 1][x + 1] = body[y][x < 4 ? x : 7 - x];
    }
  }

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      if (pixels[y][x]) {
        context.fillStyle = `hsl(${hue},65%,58%)`;
        context.fillRect(x, y, 1, 1);
      } else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) =>
        pixels[y + dy] && pixels[y + dy][x + dx]
      )) {
        context.fillStyle = `hsl(${hue},60%,28%)`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  context.fillStyle = `hsl(${hue},75%,82%)`;
  context.fillRect(3, 3, 1, 1);
  context.fillStyle = '#fff';
  context.fillRect(3, 4, 1, 1);
  context.fillRect(6, 4, 1, 1);
  context.fillStyle = '#111';
  context.fillRect(3, 5, 1, 1);
  context.fillRect(6, 5, 1, 1);
  creatureSprites[challenge.id] = sprite;
  return sprite;
}

const wildlife = [
  { x: 7, y: 15, flight: false, phase: 0, name: 'Brotiluz', message: 'Brotiluz saluda y deja unas huellas brillantes en el cesped.' },
  { x: 12, y: 18, flight: true, phase: 11, name: 'Aleteo', message: 'Aleteo da una vuelta sobre tu cabeza antes de seguir volando.' },
  { x: 10, y: 11, flight: false, phase: 23, name: 'Musguito', message: 'Musguito se esconde entre la hierba y asoma con curiosidad.' },
  { x: 21, y: 14, flight: true, phase: 7, name: 'Chisparin', message: 'Chisparin revolotea a tu alrededor. Parece lleno de energia.' },
  { x: 26, y: 18, flight: false, phase: 17, name: 'Caparock', message: 'Caparock te saluda con un movimiento lento de su caparazon.' },
  { x: 29, y: 12, flight: true, phase: 29, name: 'Ventisca', message: 'Ventisca agita sus alas y deja una brisa fresca.' },
  { x: 37, y: 15, flight: false, phase: 5, name: 'Pedrusco', message: 'Pedrusco rueda un poquito y vuelve a quedarse quieto.' },
  { x: 42, y: 18, flight: true, phase: 19, name: 'Nubelin', message: 'Nubelin flota a tu lado y luego asciende hacia las cumbres.' },
  { x: 45, y: 12, flight: false, phase: 31, name: 'Llamita', message: 'Llamita da un saltito alegre y te invita a seguir explorando.' }
].map((creature, index) => ({
  ...creature,
  sprite: getCreatureSprite({ id: 100 + index })
}));

function drawWildlife(cameraX, cameraY) {
  wildlife.forEach((creature) => {
    const { x, y, phase } = wildlifePosition(creature, cameraX, cameraY);
    if (x < -18 || x > 258 || y < -22 || y > 178) return;

    g.fillStyle = 'rgba(20,35,30,.3)';
    g.beginPath();
    g.ellipse(x + 5, y + 12, 5, 1.5, 0, 0, Math.PI * 2);
    g.fill();

    if (creature.flight) {
      const wingHeight = Math.floor((frame + creature.phase) % 8 / 4);
      g.globalAlpha = .72;
      g.fillStyle = '#e7f7ff';
      g.fillRect(x - 2, y + 3 - wingHeight, 3, 2);
      g.fillRect(x + 9, y + 3 - wingHeight, 3, 2);
      g.globalAlpha = 1;
    }

    g.save();
    if (Math.cos(phase) < 0) {
      g.translate(x + 10, y);
      g.scale(-1, 1);
      g.drawImage(creature.sprite, 0, 0, 10, 10);
    } else {
      g.drawImage(creature.sprite, x, y, 10, 10);
    }
    g.restore();
  });
}

const worldObjects = [
  { id: 'flower-1', x: 8, y: 13, type: 'flower', message: 'Unas flores silvestres perfuman la Ruta Cesped.' },
  { id: 'flower-2', x: 13, y: 21, type: 'flower', message: 'Las flores se mecen con la brisa del camino.' },
  { id: 'flower-3', x: 9, y: 27, type: 'flower', message: 'Mariposas diminutas visitan este rincon lleno de flores.' },
  { id: 'berry-1', x: 9, y: 10, type: 'berry', message: 'Has recogido una baya madura. Queda guardada en tu mochila.' },
  { id: 'sign-1', x: 14, y: 14, type: 'sign', message: 'LETRERO: Ruta Cesped. Explora con calma y ayuda a quien encuentres.' },
  { id: 'stone-1', x: 18, y: 21, type: 'stone', message: 'Una roca con marcas antiguas. Alguien paso por aqui hace mucho.' },
  { id: 'flower-4', x: 18, y: 12, type: 'flower', message: 'Unas flores azules crecen al borde del Bosque de Redes.' },
  { id: 'flower-5', x: 24, y: 18, type: 'flower', message: 'Hay flores violetas junto al sendero.' },
  { id: 'berry-2', x: 25, y: 12, type: 'berry', message: 'Has recogido una baya silvestre. Queda guardada en tu mochila.' },
  { id: 'sign-2', x: 30, y: 14, type: 'sign', message: 'LETRERO: Bosque de Redes. Sigue los caminos y observa las senales.' },
  { id: 'crystal-1', x: 33, y: 14, type: 'crystal', message: 'El cristal vibra suavemente: la red de esta zona esta activa.' },
  { id: 'flower-6', x: 35, y: 14, type: 'flower', message: 'Pequenas flores crecen entre las piedras de la cumbre.' },
  { id: 'stone-2', x: 40, y: 11, type: 'stone', message: 'Una piedra pulida refleja la luz de la montana.' },
  { id: 'berry-3', x: 39, y: 22, type: 'berry', message: 'Has recogido una baya de montana. Queda guardada en tu mochila.' },
  { id: 'flower-7', x: 41, y: 19, type: 'flower', message: 'Las flores de la cumbre resisten el viento y el frio.' },
  { id: 'sign-3', x: 34, y: 17, type: 'sign', message: 'LETRERO: Cumbre Root. Ya estas cerca del ultimo sector.' },
  { id: 'crystal-2', x: 45, y: 26, type: 'crystal', message: 'El cristal guarda un destello de energia de la cumbre.' }
];

function wildlifePosition(creature, cameraX = 0, cameraY = 0) {
  const phase = frame / (creature.flight ? 18 : 26) + creature.phase;
  const drift = Math.sin(phase) * (creature.flight ? 13 : 9);
  const hop = creature.flight
    ? Math.sin(phase * 1.7) * 5
    : Math.max(0, Math.sin(phase * 2)) * 1.5;
  return {
    x: creature.x * TILE_SIZE - cameraX + drift,
    y: creature.y * TILE_SIZE - cameraY - hop,
    phase
  };
}

function drawWorldObjects(cameraX, cameraY) {
  worldObjects.forEach((item) => {
    const x = item.x * TILE_SIZE - cameraX + 3;
    const y = item.y * TILE_SIZE - cameraY + 3;
    if (x < -18 || x > 258 || y < -18 || y > 178) return;

    if (item.type === 'flower') {
      const sway = Math.round(Math.sin(frame / 18 + item.x));
      g.fillStyle = '#267b37';
      g.fillRect(x + 4, y + 7, 2, 6);
      g.fillRect(x + 9 + sway, y + 6, 2, 7);
      g.fillStyle = '#54bf52';
      g.fillRect(x + 2, y + 9, 3, 2);
      g.fillRect(x + 10 + sway, y + 10, 3, 2);
      g.fillStyle = item.x % 2 ? '#ff8fc1' : '#fff0a0';
      g.fillRect(x + 2, y + 2, 3, 3);
      g.fillRect(x + 6, y, 3, 3);
      g.fillRect(x + 10, y + 2, 3, 3);
      g.fillStyle = '#ffde00';
      g.fillRect(x + 6, y + 3, 3, 3);
    } else if (item.type === 'berry') {
      g.fillStyle = '#276c38';
      g.fillRect(x + 1, y + 5, 12, 6);
      g.fillRect(x + 3, y + 3, 8, 2);
      if (!saveData.items[item.id]) {
        g.fillStyle = '#cb3657';
        g.fillRect(x + 3, y + 5, 2, 2);
        g.fillRect(x + 9, y + 7, 2, 2);
        g.fillStyle = '#ffe07a';
        g.fillRect(x + 4, y + 5, 1, 1);
        g.fillRect(x + 10, y + 7, 1, 1);
      }
    } else if (item.type === 'sign') {
      g.fillStyle = '#714422';
      g.fillRect(x + 6, y + 6, 3, 9);
      g.fillStyle = '#e2b965';
      g.fillRect(x + 1, y + 1, 13, 7);
      g.fillStyle = '#805326';
      g.fillRect(x + 3, y + 3, 2, 1);
      g.fillRect(x + 7, y + 3, 4, 1);
      g.fillRect(x + 5, y + 5, 5, 1);
    } else if (item.type === 'stone') {
      g.fillStyle = '#777b84';
      g.fillRect(x + 1, y + 7, 12, 6);
      g.fillRect(x + 3, y + 4, 7, 5);
      g.fillStyle = '#a8adb3';
      g.fillRect(x + 4, y + 5, 3, 2);
    } else if (item.type === 'crystal') {
      g.fillStyle = '#527bdb';
      g.fillRect(x + 4, y + 2, 5, 3);
      g.fillRect(x + 2, y + 5, 9, 6);
      g.fillStyle = '#91e8ff';
      g.fillRect(x + 4, y + 4, 2, 5);
      g.fillRect(x + 7, y + 6, 2, 3);
    }
  });
}

function nearbyInteraction() {
  const playerX = player.x + 8;
  const playerY = player.y + 8;
  const choices = [];
  const add = (type, item, x, y) => {
    const distance = Math.hypot(playerX - x, playerY - y);
    if (distance <= 26) choices.push({ type, item, x, y, distance });
  };
  const challenge = findNearbyChallenge();
  if (challenge) add('challenge', challenge, challenge.x * TILE_SIZE + 8, challenge.y * TILE_SIZE + 8);
  wildlife.forEach((creature) => {
    const position = wildlifePosition(creature);
    add('creature', creature, position.x + 5, position.y + 5);
  });
  worldObjects.forEach((item) => add('object', item, item.x * TILE_SIZE + 8, item.y * TILE_SIZE + 8));
  return choices.sort((a, b) => a.distance - b.distance)[0] || null;
}

function interactNearby() {
  const target = nearbyInteraction();
  if (!target) return showToast('Acercate a una criatura, flor o letrero para interactuar.');
  if (target.type === 'challenge') return interactWithChallenge();
  if (target.type === 'creature') return showToast(`${target.item.name}: ${target.item.message}`, 4000);
  const item = target.item;
  if (item.type === 'berry') {
    if (saveData.items[item.id]) return showToast('Este arbusto ya no tiene bayas maduras.');
    saveData.items[item.id] = true;
    if (!persistProgress()) return showToast('No se pudo guardar la baya en tu mochila.', 4000);
  }
  showToast(item.message, 4000);
}

function jump() {
  if (player.jump > 0) return;
  player.jump = 18;
}

function getSilhouette(challenge) {
  if (silhouetteSprites[challenge.id]) return silhouetteSprites[challenge.id];

  const silhouette = document.createElement('canvas');
  silhouette.width = silhouette.height = 10;
  const context = silhouette.getContext('2d');
  context.drawImage(getCreatureSprite(challenge), 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = '#10161a';
  context.fillRect(0, 0, 10, 10);
  silhouetteSprites[challenge.id] = silhouette;
  return silhouette;
}

function tintCreature(challenge, color) {
  const tinted = document.createElement('canvas');
  tinted.width = tinted.height = 10;
  const context = tinted.getContext('2d');
  context.drawImage(getCreatureSprite(challenge), 0, 0);
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = color;
  context.fillRect(0, 0, 10, 10);
  return tinted;
}

// Movimiento, colisiones y retos cercanos
function canMoveTo(tileX, tileY) {
  if (tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) {
    return false;
  }

  if (tileX === 15 && !isZoneUnlocked(2)) {
    if (frame - lastGuardMessage > 90) {
      showToast('Un guardia bloquea el puente: captura 3 criaturas de la Zona 1.');
      lastGuardMessage = frame;
    }
    return false;
  }

  if (tileX === 31 && !isZoneUnlocked(3)) {
    if (frame - lastGuardMessage > 90) {
      showToast('Un guardia bloquea el puente: captura 3 criaturas de la Zona 2.');
      lastGuardMessage = frame;
    }
    return false;
  }

  return PASSABLE_TILES.includes(tiles[tileY][tileX]);
}

function updatePlayer() {
  if (player.jump > 0) player.jump--;
  if (player.moving > 0) {
    const direction = DIRECTIONS[player.dir];
    player.x += direction[0] * 2;
    player.y += direction[1] * 2;
    player.moving -= 2;
    return;
  }

  const direction = (keys.arrowdown || keys.s) ? 0
    : (keys.arrowup || keys.w) ? 1
      : (keys.arrowleft || keys.a) ? 2
        : (keys.arrowright || keys.d) ? 3 : -1;
  if (direction < 0) return;

  player.dir = direction;
  const [dx, dy] = DIRECTIONS[direction];
  if (canMoveTo(player.x / TILE_SIZE + dx, player.y / TILE_SIZE + dy)) {
    player.moving = TILE_SIZE;
  }
}

function findNearbyChallenge() {
  const tileX = Math.round(player.x / TILE_SIZE);
  const tileY = Math.round(player.y / TILE_SIZE);
  return challenges.find((challenge) =>
    Math.abs(challenge.x - tileX) + Math.abs(challenge.y - tileY) <= 1
  );
}

function interactWithChallenge() {
  const challenge = findNearbyChallenge();
  if (!challenge) return;
  if (saveData.cap[challenge.id]) {
    return showToast(`Ya capturaste a ${challenge.criatura}.`);
  }

  showToast('¡Un reto salvaje apareció! Lanzando cápsula…');
  animation = {
    kind: 'open',
    challenge,
    frame: 0,
    done: () => openChallenge(challenge)
  };
  mode = 'enc';
}

function drawEncounter() {
  const { challenge, kind } = animation;
  const currentFrame = ++animation.frame;
  const centerX = 170;
  const centerY = 64;
  const groundY = 104;
  const ballX = 30;
  const ballY = 140;
  const zoneColor = ZONE_COLORS[challenge.zona];

  g.fillStyle = '#bfe3ff';
  g.fillRect(0, 0, 240, 160);
  g.fillStyle = '#d8f0ff';
  g.fillRect(0, 40, 240, 20);
  g.fillStyle = '#78c850';
  g.fillRect(0, 92, 240, 68);
  g.fillStyle = '#68b840';
  g.fillRect(0, 92, 240, 3);
  g.fillStyle = '#5aa83a';
  [[170, 102, 52, 9], [52, 150, 56, 8]].forEach(([x, y, width, height]) => {
    g.beginPath();
    g.ellipse(x, y, width, height, 0, 0, 7);
    g.fill();
  });

  const drawCreature = (scale, image) => {
    g.drawImage(image, centerX - 30 * scale, centerY - 30 * scale + 8, 60 * scale, 60 * scale);
  };
  const ballArc = (progress) => [
    ballX + (centerX - ballX) * progress,
    ballY + (centerY - ballY) * progress - 48 * Math.sin(Math.PI * progress)
  ];

  if (kind === 'open') {
    drawCreature(1, getSilhouette(challenge));
    if (currentFrame < 50) {
      const [x, y] = ballArc(currentFrame / 50);
      drawBall(x, y, 6, currentFrame / 3, zoneColor);
    } else if (currentFrame < 85) {
      const progress = (currentFrame - 50) / 35;
      g.globalAlpha = 1 - progress;
      g.fillStyle = '#fff';
      g.fillRect(0, 0, 240, 160);
      g.globalAlpha = 1;
    } else {
      animation.done();
      animation = null;
      return;
    }
    return;
  }

  if (currentFrame < 45) {
    drawCreature(1, getCreatureSprite(challenge));
    const [x, y] = ballArc(currentFrame / 45);
    drawBall(x, y, 6, currentFrame / 3, zoneColor);
  } else if (currentFrame < 70) {
    const progress = (currentFrame - 45) / 25;
    if (progress < 1) {
      g.drawImage(
        tintCreature(challenge, '#ff5050'),
        centerX - 30 * (1 - progress),
        centerY - 30 * (1 - progress) + 8,
        60 * (1 - progress),
        60 * (1 - progress)
      );
    }
    drawBall(centerX, centerY, 6 + 3 * Math.sin(progress * 3), 0, zoneColor);
  } else if (currentFrame < 105) {
    const progress = (currentFrame - 70) / 35;
    const y = progress < .4
      ? centerY + (groundY - centerY) * (progress / .4) ** 2
      : groundY - Math.abs(Math.sin((progress - .4) / .6 * Math.PI * 2))
        * 10 * (1 - (progress - .4) / .6);
    drawBall(centerX, y, 6, 0, zoneColor);
  } else if (currentFrame < 195) {
    const phase = (currentFrame - 105) % 30;
    drawBall(centerX, groundY, 6, phase < 20 ? Math.sin(phase / 20 * Math.PI * 2) * .5 : 0, zoneColor);
  } else if (currentFrame < 235) {
    drawBall(centerX, groundY, 6, 0, zoneColor);
    g.fillStyle = '#ffe84a';
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const distance = (currentFrame - 195) * .8;
      g.fillRect(
        centerX + Math.cos(angle) * distance,
        groundY + Math.sin(angle) * distance,
        2,
        2
      );
    }
  } else {
    animation.done();
    animation = null;
  }
}

// Inventario y panel de detalle del reto
function closePanels() {
  $('#panel').style.display = $('#inv').style.display = 'none';
  if (mode !== 'enc') mode = 'map';
}

function openInventory() {
  mode = 'inv';
  const inventory = $('#inv');
  const berries = Object.keys(saveData.items).filter((id) => id.startsWith('berry-')).length;
  inventory.innerHTML = `
    <h2>Inventario · ${countCaptured()}/12</h2>
    <small>Cada criatura es un reto resuelto. Bayas recogidas: ${berries}/3.</small>
    <div class="grid">${challenges.map((challenge) => {
      const captured = saveData.cap[challenge.id];
      const image = captured ? getCreatureSprite(challenge) : getSilhouette(challenge);
      const name = captured ? escapeHtml(challenge.criatura) : '???';
      const detail = captured
        ? `${escapeHtml(challenge.tipo)} · Zona ${challenge.zona}`
        : `Reto ${challenge.id} · Zona ${challenge.zona}`;
      const title = captured ? `<small>${escapeHtml(challenge.titulo)}</small>` : '';
      return `
        <div class="card ${captured ? '' : 'off'}">
          <img src="${image.toDataURL()}">
          <b>${name}</b>
          <small>${detail}</small>
          ${title}
        </div>`;
    }).join('')}</div>
    <button onclick="closePanels()">Cerrar (Esc)</button>`;
  inventory.style.display = 'block';
}

function openChallenge(challenge) {
  mode = 'panel';
  let hintCount = 0;
  const panel = $('#panel');
  panel.innerHTML = `
    <div class="row">
      <img src="${getSilhouette(challenge).toDataURL()}">
      <div>
        <h2>Reto ${challenge.id}: ${escapeHtml(challenge.titulo)}</h2>
        <small>Zona ${challenge.zona} · ${escapeHtml(ZONE_NAMES[challenge.zona])} · Criatura tipo ${escapeHtml(challenge.tipo)}</small>
      </div>
    </div>
    <p>${escapeHtml(challenge.brief)}</p>
    <p><b>Objetivo:</b> <code>${escapeHtml(challenge.objetivo)}</code></p>
    <p>${challenge.tools.map((tool) => `<span class="chip">${escapeHtml(tool)}</span>`).join('')}</p>
    <div class="eth"><b>Ética:</b> ${escapeHtml(challenge.etica)}</div>
    <div id="ph"></div>
    <button id="bh">Pedir pista (0/${challenge.pistas.length})</button>
    <p>
      <input id="fl" placeholder="HACKEMON{...}" autocomplete="off">
      <button id="bv">Validar bandera</button>
    </p>
    <p id="rs"></p>
    <button onclick="closePanels()">Volver al mapa (Esc)</button>`;
  panel.style.display = 'block';
  $('#fl').focus();

  $('#bh').onclick = () => {
    if (hintCount >= challenge.pistas.length) return;
    $('#ph').innerHTML += `<p>${escapeHtml(challenge.pistas[hintCount++])}</p>`;
    $('#bh').textContent = `Pedir pista (${hintCount}/${challenge.pistas.length})`;
  };
  $('#bv').onclick = () => validateFlag(challenge);
}

async function validateFlag(challenge) {
  const flag = $('#fl').value.trim();
  const result = $('#rs');
  if (!flag) {
    result.className = 'bad';
    result.textContent = 'Escribe una bandera primero.';
    return;
  }

  try {
    const response = await fetch('/api/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: challenge.id, flag })
    });
    const data = await response.json();

    if (data.ok) {
      closePanels();
      showToast('¡Bandera correcta! Lanzando cápsula de captura…');
      mode = 'enc';
      animation = {
        kind: 'capture',
        challenge,
        frame: 0,
        done: () => {
          saveData.cap[challenge.id] = Date.now();
          persistProgress();
          mode = 'map';
          showToast(`¡Capturaste a ${challenge.criatura}! (${countCaptured()}/12) · [I] inventario`, 4000);
        }
      };
      return;
    }

    result.className = 'bad';
    result.textContent = response.status === 429
      ? 'Demasiados intentos. Espera un minuto.'
      : 'Bandera incorrecta. Revisa el formato y vuelve a intentarlo.';
  } catch (error) {
    result.className = 'bad';
    result.textContent = 'No se pudo contactar al servidor.';
  }
}

// Controles, ciclo de animación e inicio del laboratorio
addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (event.key === 'Escape') {
    if (mode === 'panel' || mode === 'inv') closePanels();
    return;
  }

  if (event.target.tagName === 'INPUT') {
    if (key === 'enter') $('#bv').click();
    return;
  }

  if (event.repeat && [' ', 'enter', 'e'].includes(key)) return;
  keys[key] = 1;
  if (mode === 'map') {
    if (key === ' ') {
      event.preventDefault();
      const challenge = findNearbyChallenge();
      if (challenge && !saveData.cap[challenge.id]) interactWithChallenge();
      else jump();
    } else if (key === 'enter' || key === 'e') {
      event.preventDefault();
      interactNearby();
    } else if (key === 'i') {
      openInventory();
    } else if (key.startsWith('arrow')) {
      event.preventDefault();
    }
  } else if (mode === 'inv' && key === 'i') {
    closePanels();
  }
});

addEventListener('keyup', (event) => {
  delete keys[event.key.toLowerCase()];
});
addEventListener('blur', () => {
  keys = {};
});

function gameLoop() {
  frame++;
  if (mode === 'map' || mode === 'start') {
    if (mode === 'map') updatePlayer();
    drawMap();
  } else if (mode === 'enc' && animation) {
    drawEncounter();
  }
  requestAnimationFrame(gameLoop);
}

$('#choose-screen').onclick = () => {
  if (mode !== 'start' || !challenges.length) return;
  $('#story-screen').hidden = true;
  $('#character-screen').hidden = false;
  renderCharacterSelection();
};

$('#back-story').onclick = () => {
  chosenCharacterId = null;
  $('#begin').disabled = true;
  $('#character-screen').hidden = true;
  $('#story-screen').hidden = false;
};

$('#previous-character').onclick = () => browseCharacter(-1);
$('#next-character').onclick = () => browseCharacter(1);

$('#skills-toggle').onclick = () => {
  const panel = $('#skills-panel');
  panel.hidden = !panel.hidden;
  $('#skills-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  $('#skills-toggle').textContent = panel.hidden ? 'VER HABILIDADES' : 'OCULTAR HABILIDADES';
};

$('#select-character').onclick = () => {
  chosenCharacterId = characters[activeCharacterIndex].id;
  renderCharacterSelection();
};

$('#begin').onclick = () => {
  if (mode !== 'start' || !challenges.length || !chosenCharacterId) return;
  player.characterId = chosenCharacterId;
  mode = 'map';
  $('#start').style.display = 'none';
  showToast('Flechas: moverte · Espacio: saltar o abrir capsula cercana · E: interactuar · I: mochila.', 5000);
};

fetch('/api/retos')
  .then((response) => {
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data) || !data.length) {
      throw new Error('La lista de retos está vacía.');
    }
    challenges = data;
    buildMap();
    mode = 'start';
    $('#choose-screen').disabled = false;
    $('#choose-screen').textContent = 'SELECCIONAR PERSONAJE';
    gameLoop();
  })
  .catch((error) => {
    console.error('No se pudo cargar el laboratorio.', error);
    $('#choose-screen').textContent = 'No se pudo cargar el laboratorio';
    showToast('No se pudo cargar la lista de retos.', 9000);
  });

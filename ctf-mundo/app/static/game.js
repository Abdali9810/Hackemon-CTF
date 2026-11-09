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
let saveData = { cap: {} };
let mode = 'load';
let animation = null;
let frame = 0;
let keys = {};
let toastTimer;
let lastGuardMessage = 0;

const player = { x: 48, y: 256, dir: 0, moving: 0 };
const creatureSprites = {};
const silhouetteSprites = {};

try {
  saveData = JSON.parse(localStorage.getItem('ctfm1')) || saveData;
} catch (error) {
  console.warn('No se pudo leer el progreso guardado.', error);
}

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

  drawPlayer(
    player.x - cameraX,
    player.y - cameraY - 4,
    player.dir,
    player.moving > 0 ? (Math.floor(player.moving / 4) % 2 ? 1 : 2) : 0
  );

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
  const fill = (color, offsetX, offsetY, width, height) => {
    g.fillStyle = color;
    g.fillRect(x + offsetX, y + offsetY, width, height);
  };

  fill('rgba(0,0,0,.25)', 3, 13, 10, 3);
  fill('#2b4a9a', 4, 10, 3, 5 - (frameOffset === 1 ? 1 : 0));
  fill('#2b4a9a', 9, 10, 3, 5 - (frameOffset === 2 ? 1 : 0));
  fill('#2fa84f', 3, 6, 10, 5);
  fill('#f0c8a0', 2, 7, 1, 3);
  fill('#f0c8a0', 13, 7, 1, 3);
  fill('#f0c8a0', 4, 1, 8, 6);
  if (direction === 1) fill('#7a4a22', 4, 1, 8, 5);
  fill('#f8f8f8', 3, 0, 10, 3);
  fill('#e03030', 3, 3, 10, 1);

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
  inventory.innerHTML = `
    <h2>Inventario · ${countCaptured()}/12</h2>
    <small>Cada criatura es un reto resuelto.</small>
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
      <input id="fl" placeholder="Escribe la bandera" autocomplete="off">
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

    if (data.ok && challenge.id === 2) {
      saveData.cap[challenge.id] = Date.now();
      persistProgress();
      $('#panel').innerHTML = `
        <h2>Reto completado</h2>
        <p>¡Qué sorpresa! Por fin una neurona hizo conexión. Continúa, a ver cuánto te dura la suerte.</p>
        <button id="continue">Continuar</button>`;
      $('#continue').onclick = closePanels;
      return;
    }

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

  keys[key] = 1;
  if (mode === 'map') {
    if ([' ', 'enter', 'e'].includes(key)) {
      event.preventDefault();
      interactWithChallenge();
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

$('#begin').onclick = () => {
  if (mode !== 'start' || !challenges.length) return;
  mode = 'map';
  $('#start').style.display = 'none';
  showToast('Camina hasta una cápsula brillante y pulsa Espacio.', 4000);
};

fetch('/api/retos')
  .then((response) => response.json())
  .then((data) => {
    if (!Array.isArray(data) || !data.length) {
      throw new Error('La lista de retos está vacía.');
    }
    challenges = data;
    buildMap();
    mode = 'start';
    $('#begin').disabled = false;
    $('#begin').textContent = 'Entrar al laboratorio';
    gameLoop();
  })
  .catch(() => {
    $('#begin').textContent = 'No se pudo cargar el laboratorio';
    showToast('No se pudo cargar la lista de retos.', 9000);
  });

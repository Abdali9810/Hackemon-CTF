(() => {
  const menuTracks = [
    { melody: [72, 76, 79, 84, 79, 76, 74, 79], bass: [48, 55, 53, 50], tempo: 0.28 },
    { melody: [74, 77, 81, 86, 81, 77, 76, 81], bass: [50, 57, 55, 52], tempo: 0.3 },
    { melody: [71, 74, 79, 83, 79, 74, 72, 79], bass: [47, 55, 52, 50], tempo: 0.27 }
  ];
  const worldTrack = {
    melody: [
      72, 76, 79, 84, 83, 79, 76, 74,
      72, 76, 79, 86, 84, 81, 79, 76,
      74, 77, 81, 86, 84, 81, 77, 74,
      71, 74, 79, 83, 81, 79, 76, 74
    ],
    bass: [48, 55, 53, 50, 48, 55, 57, 50],
    tempo: 0.19
  };
  const encounterMelodies = [
    [72, 79, 84, 81, 79, 76, 74, 76],
    [74, 81, 86, 83, 81, 77, 76, 77],
    [76, 83, 88, 84, 83, 79, 78, 79],
    [67, 74, 79, 76, 74, 71, 69, 71],
    [69, 76, 81, 77, 76, 72, 71, 72],
    [71, 78, 83, 79, 78, 74, 73, 74],
    [72, 76, 81, 84, 81, 79, 76, 74],
    [74, 77, 81, 86, 84, 81, 77, 76],
    [65, 72, 77, 81, 77, 76, 72, 69],
    [67, 74, 79, 83, 79, 77, 74, 71],
    [69, 74, 78, 81, 78, 74, 73, 74],
    [71, 74, 79, 86, 83, 79, 78, 74]
  ];
  const encounterTracks = encounterMelodies.map((melody) => ({
    melody: melody.concat(melody.slice(0, 4)),
    bass: [36, 43, 41, 38],
    tempo: 0.32
  }));

  // La música va "muy de fondo": el control al 100 % equivale a este volumen.
  const MUSIC_MAX = 0.32;
  const SFX_MAX = 1;
  const VOL_KEY = 'ctfm1-volumen';
  const volumes = { music: 0.6, sfx: 0.7 };
  try { Object.assign(volumes, JSON.parse(localStorage.getItem(VOL_KEY)) || {}); } catch (e) {}

  let context;
  let musicFade;   // encendido/apagado de la música
  let musicBus;    // volumen de la música
  let sfxBus;      // volumen de pasos, captura y ambiente
  let noiseBuffer;
  let timer;
  let nextNoteTime = 0;
  let step = 0;
  let enabled = false;
  let scene = 'menu';
  let zone = 1;
  let menuIndex = 0;
  let track = menuTracks[menuIndex];
  let ambient = false;
  let birdTimer = null;

  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  function getContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      throw new Error('Este navegador no es compatible con Web Audio.');
    }

    if (!context) {
      context = new AudioContext();
      musicBus = context.createGain();
      musicBus.gain.value = volumes.music * MUSIC_MAX;
      musicBus.connect(context.destination);
      musicFade = context.createGain();
      musicFade.gain.value = 0;
      musicFade.connect(musicBus);
      sfxBus = context.createGain();
      sfxBus.gain.value = volumes.sfx * SFX_MAX;
      sfxBus.connect(context.destination);
      noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return context;
  }

  // Desbloquea el audio tras un gesto del usuario (los navegadores lo exigen).
  async function unlock() {
    const audio = getContext();
    if (audio.state !== 'running') await audio.resume();
    updateAmbient();
  }

  function ready() {
    return context && context.state === 'running';
  }

  function playNote(frequency, start, duration, waveform, volume, out = musicFade) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(out);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playNoise(start, duration, volume, filterType, frequency, q = 1) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.value = q;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(sfxBus);
    source.start(start, Math.random() * 1.5);
    source.stop(start + duration + 0.02);
    return filter;
  }

  function selectScene(nextScene, challengeId) {
    if (nextScene === scene && !(nextScene === 'encounter' && track !== encounterTracks[(challengeId - 1) % encounterTracks.length])) {
      return;
    }

    scene = nextScene;
    if (scene === 'menu') {
      menuIndex = 0;
      track = menuTracks[menuIndex];
    } else if (scene === 'encounter') {
      track = encounterTracks[(challengeId - 1) % encounterTracks.length];
    } else {
      track = worldTrack;
    }

    step = 0;
    if (context) {
      nextNoteTime = context.currentTime + 0.05;
      if (enabled) scheduleNotes();
    }
    updateAmbient();
  }

  function scheduleNotes() {
    while (nextNoteTime < context.currentTime + 0.1) {
      if (step >= track.melody.length) {
        if (scene === 'menu') {
          menuIndex = (menuIndex + 1) % menuTracks.length;
          track = menuTracks[menuIndex];
        }
        step = 0;
      }

      const note = track.melody[step];
      const duration = track.tempo;
      playNote(midi(note), nextNoteTime, duration * 0.82, 'square', 0.11);

      if (step % 4 === 0) {
        const bassNote = track.bass[Math.floor(step / 4) % track.bass.length];
        playNote(midi(bassNote), nextNoteTime, duration * 3.2, 'triangle', 0.16);
      }

      nextNoteTime += duration;
      step++;
    }
  }

  async function start() {
    const audio = getContext();
    await unlock();
    if (enabled) return;

    enabled = true;
    nextNoteTime = audio.currentTime + 0.05;
    musicFade.gain.cancelScheduledValues(audio.currentTime);
    musicFade.gain.setTargetAtTime(1, audio.currentTime, 0.04);
    scheduleNotes();
    timer = window.setInterval(scheduleNotes, 25);
  }

  // Apagar la música no silencia los pasos, la captura ni el ambiente.
  async function stop() {
    if (!context || !enabled) return;
    enabled = false;
    window.clearInterval(timer);
    musicFade.gain.cancelScheduledValues(context.currentTime);
    musicFade.gain.setTargetAtTime(0, context.currentTime, 0.03);
  }

  async function toggle() {
    if (enabled) {
      await stop();
    } else {
      await start();
    }
    return enabled;
  }

  // ---- Ambiente: pájaros suaves solo en la primera zona ----
  function chirp() {
    if (!ready() || !ambient) return;
    const t = context.currentTime;
    const base = 2200 + Math.random() * 1400;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const s = t + i * 0.11;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, s);
      osc.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), s + 0.07);
      env.gain.setValueAtTime(0.0001, s);
      env.gain.exponentialRampToValueAtTime(0.035, s + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, s + 0.08);
      osc.connect(env);
      env.connect(sfxBus);
      osc.start(s);
      osc.stop(s + 0.1);
    }
  }

  function scheduleBird() {
    window.clearTimeout(birdTimer);
    birdTimer = window.setTimeout(() => {
      birdTimer = null;
      chirp();
      if (ambient) scheduleBird();
    }, 3000 + Math.random() * 6000);
  }

  function updateAmbient() {
    const wantBirds = scene === 'world' && zone === 1;
    if (!wantBirds) {
      ambient = false;
      window.clearTimeout(birdTimer);
      birdTimer = null;
      return;
    }

    ambient = true;
    if (ready() && birdTimer === null) scheduleBird();
  }

  // ---- Efectos ----
  let stepAlt = false;
  const sfx = {
    step(surface = 'grass') {
      if (!ready()) return;
      const t = context.currentTime;
      stepAlt = !stepAlt;
      const shift = stepAlt ? 1 : 0.85;
      if (surface === 'wood') {
        playNoise(t, 0.07, 0.1, 'bandpass', 900 * shift, 4);
        playNote(180 * shift, t, 0.06, 'triangle', 0.06, sfxBus);
      } else if (surface === 'stone') {
        playNoise(t, 0.05, 0.08, 'bandpass', 2600 * shift, 2.5);
      } else if (surface === 'dirt') {
        playNoise(t, 0.08, 0.08, 'lowpass', 1100 * shift);
      } else {
        playNoise(t, 0.09, 0.07, 'highpass', 2400 * shift);
      }
    },
    throw() {
      if (!ready()) return;
      const t = context.currentTime;
      const f = playNoise(t, 0.45, 0.18, 'bandpass', 600, 3);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
    },
    absorb() {
      if (!ready()) return;
      const t = context.currentTime;
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      osc.connect(env);
      env.connect(sfxBus);
      osc.start(t);
      osc.stop(t + 0.45);
    },
    bounce() {
      if (!ready()) return;
      playNote(320, context.currentTime, 0.08, 'triangle', 0.18, sfxBus);
    },
    wobble() {
      if (!ready()) return;
      const t = context.currentTime;
      playNoise(t, 0.05, 0.3, 'bandpass', 1800, 6);
      playNote(520, t, 0.05, 'square', 0.05, sfxBus);
    },
    caught() {
      if (!ready()) return;
      const t = context.currentTime;
      playNoise(t, 0.04, 0.5, 'bandpass', 3000, 8);
      playNote(1200, t, 0.05, 'square', 0.08, sfxBus);
      const jingle = [
        [72, 0, 1], [76, 1, 1], [79, 2, 1], [84, 3, 3],
        [81, 6, 1], [79, 7, 1], [81, 8, 1], [84, 9, 3],
        [77, 12, 1], [76, 13, 1], [74, 14, 1], [72, 15, 7]
      ];
      jingle.forEach(([n, i, d]) => {
        const s = t + 0.25 + i * 0.11;
        playNote(midi(n), s, d * 0.11, 'square', 0.1, sfxBus);
        playNote(midi(n - 12), s, d * 0.11, 'triangle', 0.12, sfxBus);
      });
    }
  };

  function setVolume(kind, value) {
    volumes[kind] = Math.max(0, Math.min(1, Number(value)));
    try { localStorage.setItem(VOL_KEY, JSON.stringify(volumes)); } catch (e) {}
    if (!context) return;
    const bus = kind === 'music' ? musicBus : sfxBus;
    const max = kind === 'music' ? MUSIC_MAX : SFX_MAX;
    bus.gain.setTargetAtTime(volumes[kind] * max, context.currentTime, 0.05);
  }

  window.HackemonMusic = {
    start,
    stop,
    toggle,
    unlock,
    setScene: selectScene,
    setZone: z => { if (z === zone) return; zone = z; updateAmbient(); },
    isPlaying: () => enabled,
    setVolume,
    getVolumes: () => ({ ...volumes }),
    sfx
  };
})();

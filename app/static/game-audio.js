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
  let context;
  let master;
  let timer;
  let nextNoteTime = 0;
  let step = 0;
  let enabled = false;
  let scene = 'menu';
  let menuIndex = 0;
  let track = menuTracks[menuIndex];

  function getContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      throw new Error('Este navegador no es compatible con Web Audio.');
    }

    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);
    }
    return context;
  }

  function playNote(frequency, start, duration, waveform, volume) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
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
      playNote(440 * 2 ** ((note - 69) / 12), nextNoteTime, duration * 0.82, 'square', 0.11);

      if (step % 4 === 0) {
        const bassNote = track.bass[Math.floor(step / 4) % track.bass.length];
        playNote(440 * 2 ** ((bassNote - 69) / 12), nextNoteTime, duration * 3.2, 'triangle', 0.16);
      }

      nextNoteTime += duration;
      step++;
    }
  }

  async function start() {
    const audio = getContext();
    await audio.resume();
    if (enabled) return;

    enabled = true;
    nextNoteTime = audio.currentTime + 0.05;
    master.gain.cancelScheduledValues(audio.currentTime);
    master.gain.setTargetAtTime(0.65, audio.currentTime, 0.04);
    scheduleNotes();
    timer = window.setInterval(scheduleNotes, 25);
  }

  async function stop() {
    if (!context || !enabled) return;
    enabled = false;
    window.clearInterval(timer);
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, 0.03);
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    if (!enabled) await context.suspend();
  }

  async function toggle() {
    if (enabled) {
      await stop();
    } else {
      await start();
    }
    return enabled;
  }

  window.HackemonMusic = {
    start,
    stop,
    toggle,
    setScene: selectScene,
    isPlaying: () => enabled
  };
})();

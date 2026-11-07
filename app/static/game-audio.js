(() => {
  const melody = [
    72, 76, 79, 84, 83, 79, 76, 74,
    72, 76, 79, 86, 84, 81, 79, 76,
    74, 77, 81, 86, 84, 81, 77, 74,
    71, 74, 79, 83, 81, 79, 76, 74
  ];
  const bass = [48, 55, 53, 50, 48, 55, 57, 50];
  const stepDuration = 0.19;
  let context;
  let master;
  let timer;
  let nextNoteTime = 0;
  let step = 0;
  let enabled = false;

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

  function scheduleNotes() {
    while (nextNoteTime < context.currentTime + 0.1) {
      const note = melody[step % melody.length];
      playNote(440 * 2 ** ((note - 69) / 12), nextNoteTime, stepDuration * 0.82, 'square', 0.11);

      if (step % 4 === 0) {
        const bassNote = bass[Math.floor(step / 4) % bass.length];
        playNote(440 * 2 ** ((bassNote - 69) / 12), nextNoteTime, stepDuration * 3.2, 'triangle', 0.16);
      }

      nextNoteTime += stepDuration;
      step++;
    }
  }

  async function start() {
    const audio = getContext();
    await audio.resume();
    if (enabled) return;

    enabled = true;
    step = 0;
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

  window.HackemonMusic = { start, stop, toggle, isPlaying: () => enabled };
})();

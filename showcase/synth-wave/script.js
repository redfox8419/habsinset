const keyboardEl = document.getElementById('keyboard');
const instrumentSelect = document.getElementById('instrumentSelect');
const bpmInput = document.getElementById('bpmInput');
const startBtn = document.getElementById('startButton');
const pauseBtn = document.getElementById('pauseButton');
const resetBtn = document.getElementById('resetButton');
const addMelodyBtn = document.getElementById('addMelodyButton');
const addBeatBtn = document.getElementById('addBeatButton');
const timelineContainer = document.getElementById('timelineContainer');
const effectsControls = document.getElementById('effectsControls');
const melodyPatternSelect = document.getElementById('melodyPatternSelect');
const melodyInstrumentSelect = document.getElementById('melodyInstrumentSelect');
const basslineBtn = document.getElementById('addBasslineButton');
const drumPatternSelect = document.getElementById('drumPatternSelect');
let playhead = document.getElementById('playhead');
const noteRecordStartTimes = {}; // Used for tracking currently held keys

const keyMap = ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5'];
const TIME_SCALE = 100; // px/s
const TIMELINE_LENGTH = 8; // seconds

let audioReady = false;
let currentInstrument, melodySampler, junoPad, prophet5, dx7Synth, analogBass;
let stringSynth, drums;
let activeLoops = [], loops = [];
let playheadRAF;
let reverb, delay, chorus;

// Classic synthwave melody patterns
const melodyPatterns = {
  "Miami Nights": [
    { note: "A4", duration: "8n", time: 0 },
    { note: "C5", duration: "8n", time: 0.25 },
    { note: "E5", duration: "8n", time: 0.5 },
    { note: "D5", duration: "8n", time: 0.75 },
    { note: "C5", duration: "8n", time: 1.0 },
    { note: "A4", duration: "8n", time: 1.25 },
    { note: "C5", duration: "4n", time: 1.5 }
  ],
  "Neon Drive": [
    { note: "E4", duration: "16n", time: 0 },
    { note: "G4", duration: "16n", time: 0.125 },
    { note: "A4", duration: "16n", time: 0.25 },
    { note: "B4", duration: "16n", time: 0.375 },
    { note: "C5", duration: "8n", time: 0.5 },
    { note: "B4", duration: "16n", time: 0.75 },
    { note: "A4", duration: "16n", time: 0.875 },
    { note: "G4", duration: "8n", time: 1.0 },
    { note: "E4", duration: "8n", time: 1.25 },
    { note: "D4", duration: "8n", time: 1.5 },
    { note: "E4", duration: "4n", time: 1.75 }
  ],
  "Outrun Chase": [
    { note: "E4", duration: "16n", time: 0 },
    { note: "E4", duration: "16n", time: 0.125 },
    { note: "G4", duration: "8n", time: 0.25 },
    { note: "G4", duration: "8n", time: 0.5 },
    { note: "A4", duration: "8n", time: 0.75 },
    { note: "B4", duration: "8n", time: 1 },
    { note: "C5", duration: "8n", time: 1.25 },
    { note: "E5", duration: "4n", time: 1.5 }
  ],
  "Night Cruiser": [
    { note: "G4", duration: "8n", time: 0 },
    { note: "B4", duration: "8n", time: 0.25 },
    { note: "D5", duration: "8n", time: 0.5 },
    { note: "F#5", duration: "8n", time: 0.75 },
    { note: "G5", duration: "4n", time: 1 },
    { note: "F#5", duration: "8n", time: 1.5 },
    { note: "D5", duration: "8n", time: 1.75 },
    { note: "B4", duration: "8n", time: 2 },
    { note: "G4", duration: "2n", time: 2.25 }
  ],
  "Digital Dreams": [
    { note: "F4", duration: "16n", time: 0 },
    { note: "A4", duration: "16n", time: 0.125 },
    { note: "C5", duration: "16n", time: 0.25 },
    { note: "F5", duration: "8n", time: 0.375 },
    { note: "E5", duration: "16n", time: 0.625 },
    { note: "D5", duration: "16n", time: 0.75 },
    { note: "C5", duration: "8n", time: 0.875 },
    { note: "A4", duration: "16n", time: 1.125 },
    { note: "C5", duration: "4n", time: 1.25 }
  ]
};

// Predefined synthwave drum patterns
const drumPatterns = {
  "Classic Four-on-the-Floor": [
    ['C1', null, 'E1', null, 'D1', null, 'E1', null], // Kick, hi-hat, snare pattern
    ['C1', null, 'E1', null, 'D1', null, 'E1', null]
  ],
  "LinnDrum Groove": [
    ['C1', null, 'E1', 'E1', 'D1', null, 'E1', null],
    ['C1', null, 'E1', null, 'D1', 'E1', 'E1', null]
  ],
  "808 Night Drive": [
    ['C1', null, null, 'E1', 'D1', null, 'E1', null],
    ['C1', null, null, 'E1', 'D1', null, 'E1', 'E1']
  ],
  "Retro Shuffle": [
    ['C1', null, 'E1', null, 'D1', null, 'E1', 'E1'],
    ['C1', null, 'E1', null, 'D1', null, 'C1', 'E1']
  ]
};

// Synthwave bassline patterns
const basslinePatterns = {
  "Classic Octave": [
    { note: "C2", duration: "8n" },
    { note: "C3", duration: "8n" },
    { note: "G2", duration: "8n" },
    { note: "G3", duration: "8n" },
    { note: "A2", duration: "8n" },
    { note: "A3", duration: "8n" },
    { note: "F2", duration: "8n" },
    { note: "F3", duration: "8n" }
  ],
  "Pulsing Fifth": [
    { note: "C2", duration: "8n" },
    { note: "G2", duration: "8n" },
    { note: "C2", duration: "8n" },
    { note: "G2", duration: "8n" },
    { note: "A1", duration: "8n" },
    { note: "E2", duration: "8n" },
    { note: "A1", duration: "8n" },
    { note: "E2", duration: "8n" }
  ],
  "Arpeggio Bass": [
    { note: "C2", duration: "16n" },
    { note: "E2", duration: "16n" },
    { note: "G2", duration: "16n" },
    { note: "A2", duration: "16n" },
    { note: "A1", duration: "16n" },
    { note: "C2", duration: "16n" },
    { note: "E2", duration: "16n" },
    { note: "G2", duration: "16n" }
  ]
};

// Helper function to convert note names to MIDI numbers and back
const noteToMidi = (note) => {
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return (octave + 1) * 12 + notes.indexOf(noteName);
};

const midiToNote = (midi) => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const noteIdx = midi % 12;
  return notes[noteIdx] + octave;
};

// Build keyboard
keyMap.forEach(note => {
  const key = document.createElement('div'); 
  key.classList.add('key');
  if (note.includes('#')) key.classList.add('black'); 
  key.dataset.note = note; 
  keyboardEl.appendChild(key);
});

// Init Audio + BPM + Transport Loop
async function initAudio() {
  if (audioReady) return;
  try {
    await Tone.start(); 
    audioReady = true;
    
    // Create effects
    reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3,
      preDelay: 0.01
    }).toDestination();
    
    delay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.4,
      wet: 0.2
    }).connect(reverb);
    
    chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0.5
    }).connect(delay);
    
    // Effects chain: instrument -> chorus -> delay -> reverb -> output
    
    // Original piano sampler
    melodySampler = new Tone.Sampler({ 
      urls: { 
        'C4':'C4.mp3',
        'D#4':'Ds4.mp3',
        'F#4':'Fs4.mp3',
        'A4':'A4.mp3' 
      }, 
      release: 1, 
      baseUrl: 'https://tonejs.github.io/audio/salamander/' 
    }).connect(chorus);
    
    // Juno-106 style warm pad
    junoPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'pulse',
        width: 0.4
      },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.6,
        release: 1.5
      },
      filter: {
        Q: 1.5,
        type: 'lowpass',
        rolloff: -12,
        frequency: 2200
      },
      filterEnvelope: {
        attack: 0.5,
        decay: 0.5,
        sustain: 0.6,
        release: 1.2,
        baseFrequency: 1200
      },
      volume: -6 // Lower volume for better mix
    }).connect(chorus);
    
    // Prophet-5 style rich synth
    prophet5 = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.8,
        release: 1.5
      },
      filter: {
        Q: 1,
        type: 'lowpass',
        rolloff: -24
      }
    }).connect(chorus);
    
    // DX7 style FM synth
    dx7Synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.2,
      modulationIndex: 4,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.8,
        release: 1.2
      },
      modulation: {
        type: 'triangle'
      },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1
      }
    }).connect(chorus);
    
    // Analog Bass - Moog-like
    analogBass = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.9,
        release: 0.4
      },
      filterEnvelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 0.4,
        baseFrequency: 100,
        octaves: 3
      }
    }).connect(delay);
    
    // Original synth (keeping for backward compatibility)
    synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
    }).connect(chorus);

    // Original string synth (keeping for backward compatibility)
    stringSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.0 }
    }).connect(chorus);

    // 808/LinnDrum style drums
    drums = new Tone.Sampler({ 
      urls: { 
        'C1': 'kick.mp3',
        'D1': 'snare.mp3',
        'E1': 'hihat.mp3' 
      }, 
      baseUrl: 'https://tonejs.github.io/audio/drum-samples/CR78/' 
    }).connect(delay);
    
    setInstrument(instrumentSelect.value);
    
    // Make transport loop the 12s timeline
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = TIMELINE_LENGTH;
    document.documentElement.style.setProperty('--timeline-length', `${TIMELINE_LENGTH * TIME_SCALE}px`);
    bpmInput.dispatchEvent(new Event('change'));
    [startBtn, resetBtn, addMelodyBtn, addBeatBtn, basslineBtn].forEach(b => b.disabled = false);
    
    // Initialize effects controls
    updateEffectsControls();
  } catch(e) { 
    console.error(e); 
    alert('Could not initialize audio.'); 
  }
}

document.body.addEventListener('click', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });

// BPM control & grid spacing
bpmInput.addEventListener('change', () => {
  const b = parseInt(bpmInput.value) || 120;
  Tone.Transport.bpm.value = b;
  const beatSec = 60 / b;
  const spacing = beatSec * TIME_SCALE;
  document.documentElement.style.setProperty('--grid-spacing', `${spacing}px`);
  timelineContainer.querySelectorAll('.timelineLayer').forEach(layer => 
    layer.style.setProperty('--grid-spacing', `${spacing}px`)
  );
});

// Update effects controls
function updateEffectsControls() {
  if (!effectsControls) return;
  
  const reverbWetInput = document.getElementById('reverbWet');
  const delayWetInput = document.getElementById('delayWet');
  const chorusWetInput = document.getElementById('chorusWet');
  
  if (reverbWetInput) {
    reverbWetInput.addEventListener('input', e => {
      reverb.wet.value = parseFloat(e.target.value);
    });
  }
  
  if (delayWetInput) {
    delayWetInput.addEventListener('input', e => {
      delay.wet.value = parseFloat(e.target.value);
    });
  }
  
  if (chorusWetInput) {
    chorusWetInput.addEventListener('input', e => {
      chorus.wet.value = parseFloat(e.target.value);
    });
  }
}

function setInstrument(type) {
  if (type === 'piano') {
    currentInstrument = melodySampler;
  } else if (type === 'synth') {
    currentInstrument = synth;
  } else if (type === 'strings') {
    currentInstrument = stringSynth;
  } else if (type === 'junoPad') {
    currentInstrument = junoPad;
  } else if (type === 'prophet5') {
    currentInstrument = prophet5;
  } else if (type === 'dx7') {
    currentInstrument = dx7Synth;
  } else if (type === 'analogBass') {
    currentInstrument = analogBass;
  }
}

instrumentSelect.addEventListener('change', e => setInstrument(e.target.value));

// Playhead animation
function animatePlayhead() {
  const secs = Tone.Transport.seconds;
  playhead.style.left = `${secs * TIME_SCALE}px`;
  playheadRAF = requestAnimationFrame(animatePlayhead);
}

function stopPlayhead() { 
  cancelAnimationFrame(playheadRAF); 
}

// Transport controls
startBtn.addEventListener('click', async () => {
  if (Tone.context.state !== 'running') await Tone.context.resume();
  if (Tone.Transport.state !== 'started') { 
    Tone.Transport.start(); 
    animatePlayhead(); 
  }
  updateButtonStates();
});

pauseBtn.addEventListener('click', () => { 
  if (Tone.Transport.state === 'started') { 
    Tone.Transport.pause(); 
    stopPlayhead(); 
  } 
  updateButtonStates(); 
});

resetBtn.addEventListener('click', () => {
  Tone.Transport.stop(); 
  Tone.Transport.cancel(0); 
  stopPlayhead(); 
  playhead.style.left = '0px';
  activeLoops.forEach(l => { 
    if(l.stop) l.stop(0); 
    if(l.dispose) l.dispose(); 
  }); 
  activeLoops = []; 
  loops = [];
  timelineContainer.innerHTML = '<div id="playhead"><div class="playhead-ball"></div></div>';
  playhead = document.getElementById('playhead'); 
  updateButtonStates();
});

function updateButtonStates() { 
  const state = Tone.Transport.state;
  const has = activeLoops.length > 0;
  startBtn.disabled = state === 'started' || !has; 
  pauseBtn.disabled = state !== 'started'; 
  resetBtn.disabled = !has && state === 'stopped'; 
}

// Note play/release
function playNote(note, keyEl) {
  if(!currentInstrument) return;
  
  // Regular note playing
  currentInstrument.triggerAttack(note, Tone.now());
  keyEl.classList.add('active');

  // Track note start time
  noteRecordStartTimes[note] = Tone.now();
}

function releaseNote(keyEl) {
  const note = keyEl.dataset.note;
  if(!keyEl.classList.contains('active')) return;
  keyEl.classList.remove('active');

  // Remove from active notes
  delete noteRecordStartTimes[note];
  
  // Handle release based on instrument type
  const now = Tone.now();
  
  if (currentInstrument === melodySampler) {
    melodySampler.triggerRelease(note, now + 0.05);
  } else if (currentInstrument === synth) {
    synth.triggerRelease(now + 0.05);
  } else if (currentInstrument === stringSynth) {
    stringSynth.triggerRelease(now + 0.05);
  } else if (currentInstrument === junoPad) {
    junoPad.triggerRelease([note], now + 0.05);
  } else if (currentInstrument === prophet5) {
    prophet5.triggerRelease([note], now + 0.05);
  } else if (currentInstrument === dx7Synth) {
    dx7Synth.triggerRelease([note], now + 0.05);
  } else if (currentInstrument === analogBass) {
    analogBass.triggerRelease(now + 0.05);
  }
}

// Keyboard event listeners
keyboardEl.addEventListener('pointerdown', e => { 
  if(audioReady && e.target.classList.contains('key')) {
    playNote(e.target.dataset.note, e.target); 
  }
});

keyboardEl.addEventListener('pointerup', e => { 
  if(audioReady && e.target.classList.contains('key')) {
    releaseNote(e.target); 
  }
});

keyboardEl.addEventListener('pointerleave', e => { 
  if(audioReady && e.target.classList.contains('key') && e.target.classList.contains('active')) {
    releaseNote(e.target); 
  }
});

// Add melody from preset patterns
addMelodyBtn.addEventListener('click', () => {
  if (!audioReady) {
    initAudio();
    return;
  }
  
  // Get selected melody pattern and instrument
  const patternName = melodyPatternSelect ? melodyPatternSelect.value : "Miami Nights";
  const instrumentName = melodyInstrumentSelect ? melodyInstrumentSelect.value : "dx7";
  
  // Get the pattern
  const pattern = melodyPatterns[patternName] || melodyPatterns["Miami Nights"];
  
  // Select the instrument
  let instrument;
  switch(instrumentName) {
    case 'dx7': instrument = dx7Synth; break;
    case 'prophet5': instrument = prophet5; break;
    case 'junoPad': instrument = junoPad; break;
    case 'analogBass': instrument = analogBass; break;
    default: instrument = dx7Synth;
  }
  
  // Create the part
  const part = new Tone.Part((time, note) => {
    instrument.triggerAttackRelease(note.note, note.duration, time);
  }, pattern);
  
  // Calculate the total duration
  let maxTime = 0;
  pattern.forEach(note => {
    const noteEndTime = note.time + Tone.Time(note.duration).toSeconds();
    if (noteEndTime > maxTime) maxTime = noteEndTime;
  });
  
  // Add a little buffer to the duration
  const duration = maxTime + 0.5;
  
  part.loop = true;
  part.loopEnd = duration;
  part.start(0);
  
  // Add to active loops
  activeLoops.push(part);
  
  // Add to loops array and timeline
  const idx = loops.filter(l => l.type === 'Melody').length + 1;
  const name = `Melody ${idx} (${patternName})`;
  
  const obj = {
    type: 'Melody',
    part: part,
    looped: true,
    startOffset: 0,
    duration: duration,
    color: 'var(--melody)',
    name: name
  };
  
  loops.push(obj);
  addLoopClipToTimeline(obj);
  updateButtonStates();
});

// Beat builder with patterns
addBeatBtn.addEventListener('click', () => {
  if (!audioReady) {
    initAudio();
    return;
  }
  
  // Use selected pattern or default to Classic Four-on-the-Floor
  let patternName = "Classic Four-on-the-Floor";
  if (drumPatternSelect) {
    patternName = drumPatternSelect.value;
  }
  
  const pattern = drumPatterns[patternName] || drumPatterns["Classic Four-on-the-Floor"];
  const flatPattern = pattern.flat();
  
  const seq = new Tone.Sequence((time, note) => {
    if (note) drums.triggerAttackRelease(note, '16n', time);
  }, flatPattern, '8n');
  
  seq.loop = true;
  seq.start(0);
  activeLoops.push(seq);
  
  const idx = loops.filter(l => l.type === 'Beat').length + 1;
  const name = `Beat ${idx} (${patternName})`;
  
  const obj = {
    type: 'Beat',
    loop: seq,
    looped: true,
    startOffset: 0,
    duration: flatPattern.length * Tone.Time('8n').toSeconds(),
    color: 'var(--beat)',
    name
  };
  
  loops.push(obj);
  addLoopClipToTimeline(obj);
  updateButtonStates();
});

// Add bassline pattern to timeline
if (basslineBtn) {
  basslineBtn.addEventListener('click', () => {
    if (!audioReady) {
      initAudio();
      return;
    }
    
    const patternSelect = document.getElementById('bassPatternSelect');
    const patternName = patternSelect ? patternSelect.value : "Classic Octave";
    const pattern = basslinePatterns[patternName] || basslinePatterns["Classic Octave"];
    
    // Create sequence from pattern
    const sequence = [];
    let totalDuration = 0;
    
    pattern.forEach(note => {
      sequence.push({
        time: totalDuration,
        note: note.note,
        duration: note.duration
      });
      totalDuration += Tone.Time(note.duration).toSeconds();
    });
    
    // Create part
    const part = new Tone.Part((time, note) => {
      analogBass.triggerAttackRelease(note.note, note.duration, time);
    }, sequence);
    
    part.loop = true;
    part.loopEnd = totalDuration;
    part.start(0);
    
    activeLoops.push(part);
    
    const idx = loops.filter(l => l.type === 'Bass').length + 1;
    const name = `Bass ${idx} (${patternName})`;
    
    const obj = {
      type: 'Bass',
      part: part,
      looped: true,
      startOffset: 0,
      duration: totalDuration,
      color: 'var(--bassline)',
      name
    };
    
    loops.push(obj);
    addLoopClipToTimeline(obj);
    updateButtonStates();
  });
}

// Drag & drop clips
function initDrag(e, clip, loopObj) {
  e.preventDefault();
  clip.classList.add('dragging');
  const startX = e.clientX;
  const initLeft = parseInt(clip.style.left);
  
  function onMove(ev) {
    const dx = ev.clientX - startX;
    const nl = Math.max(0, initLeft + dx);
    clip.style.left = nl + 'px';
  }
  
  function onUp(ev) {
    clip.classList.remove('dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    
    const final = parseInt(clip.style.left);
    const off = final / TIME_SCALE;
    loopObj.startOffset = off;
    
    if (loopObj.part) {
      loopObj.part.stop(0);
      loopObj.part.start(off);
    }
    
    if (loopObj.loop) {
      loopObj.loop.stop(0);
      loopObj.loop.start(off);
    }
  } 
  
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

function addLoopClipToTimeline(loopObj) {
  const layer = document.createElement('div');
  layer.className = 'timelineLayer';
  
  const clip = document.createElement('div');
  clip.className = 'loopClip';
  clip.style.background = loopObj.color;
  clip.textContent = loopObj.name;
  clip.style.left = (loopObj.startOffset * TIME_SCALE) + 'px';
  
  clip.addEventListener('pointerdown', e => initDrag(e, clip, loopObj));
  layer.appendChild(clip);
  timelineContainer.appendChild(layer);
  timelineContainer.scrollTop = timelineContainer.scrollHeight;
  loopObj.clipEl = clip;
}

// Initial state
updateButtonStates();
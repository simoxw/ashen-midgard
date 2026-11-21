/**
 * Sintetizzatore Audio Procedurale basato su Web Audio API.
 * Zero dipendenze esterne o file MP3: leggero, reattivo e 100% offline.
 */

const MUTE_STORAGE_KEY = 'ashen_midgard_muted';

// Scala pentatonica minore/nordica in Hz per il pitch crescente delle gemme XP
const GEM_SCALE = [
  440.0,  // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  987.77, // B5
  1046.5, // C6
  1174.66 // D6
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.muted = this._loadMuteState();
    // Rate-limiting per evitare distorsioni con 200+ nemici sullo schermo
    this.lastTimes = {
      hit: 0,
      gem: 0,
      throw: 0,
      lightning: 0,
      blade: 0,
      aura: 0,
      hammer: 0,
      crate: 0,
      shield: 0,
      skill: 0,
      spear: 0,
      chain: 0
    };
  }

  _loadMuteState() {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
    } catch {
      // Ignora errori di storage in modalità privata
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.42, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Sblocca e inizializza AudioContext al primo gesto utente (necessario su iOS/Chrome Mobile).
   */
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.42;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _canPlay(key, cooldownMs) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return false;
    const now = performance.now();
    if (now - (this.lastTimes[key] || 0) < cooldownMs) return false;
    this.lastTimes[key] = now;
    return true;
  }

  playUiClick() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playThrow() {
    if (!this._canPlay('throw', 90)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHammerSlam() {
    if (!this._canPlay('hammer', 150)) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.22);

    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.25);
  }

  playShieldBlock() {
    if (!this._canPlay('shield', 110)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.11);
    osc2.frequency.setValueAtTime(1020, now);
    osc2.frequency.exponentialRampToValueAtTime(510, now + 0.09);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.13);
    osc2.stop(now + 0.13);
  }

  playSpearThrow() {
    if (!this._canPlay('spear', 100)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.11);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playChainSweep() {
    if (!this._canPlay('chain', 160)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playActiveSkill(heroId = 'warrior') {
    if (this.muted) return;
    this.unlock();
    if (!this._canPlay('skill', 250)) return;
    const now = this.ctx.currentTime;
    const chordMap = {
      warrior: [392.0, 523.25, 783.99],
      assassin: [587.33, 880.0, 1174.66],
      mage: [440.0, 659.25, 987.77],
      juggernaut: [196.0, 293.66, 392.0]
    };
    const freqs = chordMap[heroId] || chordMap.warrior;
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.035;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = heroId === 'juggernaut' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 1.12, start + 0.22);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  playCrateBreak() {
    if (!this._canPlay('crate', 100)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playShrineActivate() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const start = now + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  playChestOpen() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99, 987.77];
    notes.forEach((f, idx) => {
      const start = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  }

  playEvolution() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((f, idx) => {
      const start = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  playHit(isCrit = false) {
    if (!this._canPlay('hit', 45)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    const startFreq = isCrit ? 320 : 185;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.08);

    gain.gain.setValueAtTime(isCrit ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playPlayerHurt() {
    if (!this._canPlay('hurt', 180)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.14);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playAuraPulse() {
    if (!this._canPlay('aura', 350)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.18);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  playLightning() {
    if (!this._canPlay('lightning', 110)) return;
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + 0.16);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.22, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.18);
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playGem(comboStep = 0) {
    if (!this._canPlay('gem', 38)) return;
    const now = this.ctx.currentTime;
    const freq = GEM_SCALE[Math.min(comboStep, GEM_SCALE.length - 1)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + 0.08);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playLevelUp() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  playBossAlarm() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    // Corno da guerra norreno + doppio battito di tamburo
    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.42;
      const horn = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      horn.type = 'sawtooth';
      horn.frequency.setValueAtTime(110, start);
      horn.frequency.linearRampToValueAtTime(103, start + 0.36);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.28, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      horn.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      horn.start(start);
      horn.stop(start + 0.4);
    }
  }

  playBossAttack() {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    this.playExplosion(0.7);
  }

  playExplosion(intensity = 1.0) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Sub-bass drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(135, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    subGain.gain.setValueAtTime(0.38 * intensity, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.5);

    // Filtered noise blast
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.45);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.32 * intensity, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.52);
    }
  }

  playVictory() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 392.0, t: 0.0, d: 0.16 },
      { f: 493.88, t: 0.14, d: 0.16 },
      { f: 587.33, t: 0.28, d: 0.18 },
      { f: 783.99, t: 0.44, d: 0.55 }
    ];
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.001, now + note.t);
      gain.gain.linearRampToValueAtTime(0.24, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.02);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const notes = [293.66, 261.63, 220.0, 174.61];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  }
}

export const audio = new AudioEngine();

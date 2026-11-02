/**
 * Grand Slot Club - Web Audio API Synthesizer & Background Music Engine
 * Produces crisp casino sound effects, streaming jazz playlists, and procedural synth jazz.
 */

/**
 * Grand Slot Club - Background Music & Procedural Jazz Engine
 */
class BgmController {
  constructor(slotAudio) {
    this.slotAudio = slotAudio;
    this.audio = null;

    // Casino Salon tracks (Shuffle & Repeat)
    this.casinoPlaylist = [
      'Grand Slot Club.mp3',
      'Smotryshka.mp3',
      'Smotryshka1.mp3'
    ];
    this.currentTrackIndex = -1;

    // Active mode: 'casino' | 'vault' | 'royale' | 'crash'
    this.mode = 'casino';

    // Volume configurations
    this.baseVolume = 0.38;
    this.currentVolume = 0.38;
    this.targetVolume = 0.38;
    this.isDucked = false;
    this.isDeepDucked = false;
    this.duckTimer = null;
    this.fadeRaf = null;

    // Playback state
    this.isPlaying = false;
    this.hasUserInteracted = false;
    this.isMuted = false;

    // Procedural Synth state
    this.synthMasterGain = null;
    this.synthInterval = null;
    this.synthStep = 0;
    this.crashMultiplier = 1.0;

    // Check saved mute state
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('grandslot_bgm_muted') === '1') {
        this.isMuted = true;
      }
    } catch (e) {}

    this.initAudioElement();
    this.setupUserInteractionListener();
    this.setupVisibilityListener();
  }

  initAudioElement() {
    try {
      if (typeof Audio === 'undefined') return;
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.volume = this.currentVolume;

      this.audio.addEventListener('ended', () => {
        if (this.mode === 'casino' && !this.isMuted) {
          this.playNextCasinoTrack();
        }
      });

      this.audio.addEventListener('error', (err) => {
        console.warn('[BgmController] Audio playback warning:', err);
      });
    } catch (e) {
      console.warn('[BgmController] HTML5 Audio element unavailable:', e);
    }
  }

  setupUserInteractionListener() {
    if (typeof window === 'undefined') return;
    const onFirstInteract = () => {
      this.hasUserInteracted = true;
      if (this.slotAudio && typeof this.slotAudio.ensureAudio === 'function') {
        this.slotAudio.ensureAudio();
      }
      if (!this.isMuted && !this.isPlaying) {
        this.playForCurrentMode();
      }
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('touchstart', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
      window.removeEventListener('click', onFirstInteract);
    };

    window.addEventListener('pointerdown', onFirstInteract, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstInteract, { once: true, passive: true });
    window.addEventListener('keydown', onFirstInteract, { once: true, passive: true });
    window.addEventListener('click', onFirstInteract, { once: true, passive: true });
  }

  setupVisibilityListener() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        if (!this.isMuted && this.hasUserInteracted) {
          this.resume();
        }
      }
    });
  }

  getNextCasinoTrack() {
    if (this.casinoPlaylist.length === 0) return null;
    if (this.casinoPlaylist.length === 1) return this.casinoPlaylist[0];

    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * this.casinoPlaylist.length);
    } while (nextIdx === this.currentTrackIndex);

    this.currentTrackIndex = nextIdx;
    return this.casinoPlaylist[nextIdx];
  }

  playNextCasinoTrack() {
    if (this.isMuted || !this.audio) return;
    const track = this.getNextCasinoTrack();
    if (!track) return;

    const trackUrl = 'assets/audio/music/' + encodeURIComponent(track);
    this.audio.src = trackUrl;
    this.audio.volume = this.currentVolume;

    const promise = this.audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          this.isPlaying = true;
        })
        .catch(() => {
          this.isPlaying = false;
        });
    }
  }

  playForCurrentMode() {
    if (this.isMuted) return;
    if (this.mode === 'casino') {
      this.stopSynthGroove();
      this.playNextCasinoTrack();
    } else if (this.mode === 'vault') {
      this.pauseAudioElement();
      this.startVaultGroove();
    } else if (this.mode === 'royale') {
      this.pauseAudioElement();
      this.startRoyaleGroove();
    } else if (this.mode === 'crash') {
      this.pauseAudioElement();
      this.startCrashGroove();
    }
  }

  setMode(newMode) {
    if (this.mode === newMode && this.isPlaying) return;
    const prevMode = this.mode;
    this.mode = newMode;

    // Crossfade exit current music
    if (prevMode === 'casino') {
      this.fadeVolumeAudio(0, 350, () => {
        this.pauseAudioElement();
      });
    } else {
      this.stopSynthGroove(350);
    }

    if (this.isMuted || !this.hasUserInteracted) return;

    // Smoothly start new music mode
    setTimeout(() => {
      if (this.isMuted) return;
      if (newMode === 'casino') {
        this.playNextCasinoTrack();
        this.fadeVolumeAudio(this.isDucked ? 0.12 : this.baseVolume, 450);
      } else if (newMode === 'vault') {
        this.startVaultGroove();
      } else if (newMode === 'royale') {
        this.startRoyaleGroove();
      } else if (newMode === 'crash') {
        this.startCrashGroove();
      }
    }, 380);
  }

  pauseAudioElement() {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch (e) {}
    }
  }

  pause() {
    this.isPlaying = false;
    this.pauseAudioElement();
    this.stopSynthGroove(150);
  }

  resume() {
    if (this.isMuted) return;
    this.playForCurrentMode();
  }

  setMuted(muted) {
    this.isMuted = muted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('grandslot_bgm_muted', muted ? '1' : '0');
      }
    } catch (e) {}

    if (muted) {
      this.pause();
    } else {
      if (this.hasUserInteracted) {
        this.resume();
      }
    }
  }

  // Audio Ducking Core
  duck(target = 0.12, duration = 250) {
    this.isDucked = true;
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.rampVolume(target, duration);
  }

  deepDuck(target = 0.04, duration = 150) {
    this.isDeepDucked = true;
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.rampVolume(target, duration);
  }

  unduck(duration = 600, delay = 0) {
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.isDucked = false;
      this.isDeepDucked = false;
      this.rampVolume(this.baseVolume, duration);
    }, delay);
  }

  rampVolume(targetVol, duration = 300) {
    this.targetVolume = targetVol;
    // Ramp HTML5 audio
    this.fadeVolumeAudio(targetVol, duration);

    // Ramp procedural synth master gain
    if (this.synthMasterGain && this.slotAudio && this.slotAudio.ctx) {
      try {
        const now = this.slotAudio.ctx.currentTime;
        this.synthMasterGain.gain.cancelScheduledValues(now);
        this.synthMasterGain.gain.linearRampToValueAtTime(targetVol, now + duration / 1000);
      } catch (e) {}
    }
  }

  fadeVolumeAudio(targetVol, duration = 300, onComplete = null) {
    if (!this.audio) {
      if (onComplete) onComplete();
      return;
    }

    if (typeof requestAnimationFrame === 'undefined') {
      try { this.audio.volume = targetVol; } catch (e) {}
      if (onComplete) onComplete();
      return;
    }

    if (this.fadeRaf) cancelAnimationFrame(this.fadeRaf);

    const startVol = this.audio.volume;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const current = startVol + (targetVol - startVol) * ease;
      this.currentVolume = Math.max(0, Math.min(1, current));
      try {
        this.audio.volume = this.currentVolume;
      } catch (e) {}

      if (progress < 1) {
        this.fadeRaf = requestAnimationFrame(step);
      } else {
        this.currentVolume = targetVol;
        try {
          this.audio.volume = targetVol;
        } catch (e) {}
        this.fadeRaf = null;
        if (onComplete) onComplete();
      }
    };

    this.fadeRaf = requestAnimationFrame(step);
  }

  // --- PROCEDURAL JAZZ SYNTHESIZERS ---

  ensureSynthMasterGain() {
    if (!this.slotAudio || !this.slotAudio.ctx) return null;
    if (!this.synthMasterGain) {
      this.synthMasterGain = this.slotAudio.ctx.createGain();
      this.synthMasterGain.connect(this.slotAudio.ctx.destination);
    }
    this.synthMasterGain.gain.setValueAtTime(this.currentVolume, this.slotAudio.ctx.currentTime);
    return this.synthMasterGain;
  }

  stopSynthGroove(fadeMs = 200) {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthMasterGain && this.slotAudio && this.slotAudio.ctx && fadeMs > 0) {
      try {
        const now = this.slotAudio.ctx.currentTime;
        this.synthMasterGain.gain.cancelScheduledValues(now);
        this.synthMasterGain.gain.linearRampToValueAtTime(0.001, now + fadeMs / 1000);
      } catch (e) {}
    }
  }

  // 1. Trezor Provala: Stealth Heist Jazz (Pink Panther / Ocean's 11 mood)
  startVaultGroove() {
    this.stopSynthGroove();
    if (this.slotAudio) this.slotAudio.ensureAudio();
    if (!this.slotAudio || !this.slotAudio.ctx || this.isMuted) return;

    const master = this.ensureSynthMasterGain();
    if (!master) return;
    this.isPlaying = true;

    // D Dorian / D Minor Walking Bassline (92 BPM = ~652ms per beat)
    const bpm = 92;
    const beatMs = (60 / bpm) * 1000;
    const bassline = [
      73.42,  // D2
      87.31,  // F2
      98.00,  // G2
      103.83, // Ab2 (blues passing note)
      110.00, // A2
      130.81, // C3
      146.83, // D3
      123.47, // B2
      73.42,  // D2
      82.41,  // E2
      87.31,  // F2
      98.00,  // G2
      110.00, // A2
      98.00,  // G2
      87.31,  // F2
      65.41   // C2
    ];

    const chords = [
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [196.00, 246.94, 293.66, 349.23], // G7
      [116.54, 146.83, 174.61, 220.00], // Bbmaj7
      [110.00, 138.59, 196.00, 277.18]  // A7#9
    ];

    this.synthStep = 0;
    this.synthInterval = setInterval(() => {
      if (this.isMuted || !this.slotAudio || !this.slotAudio.ctx) return;
      const ctx = this.slotAudio.ctx;
      const now = ctx.currentTime;

      // 1. Acoustic Upright Walking Bass Note
      const noteFreq = bassline[this.synthStep % bassline.length];
      const bassOsc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const bassFilter = ctx.createBiquadFilter();
      const bassGain = ctx.createGain();

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(noteFreq, now);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(noteFreq * 0.5, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, now);
      bassFilter.Q.setValueAtTime(2.5, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.24, now + 0.015);
      bassGain.gain.exponentialRampToValueAtTime(0.06, now + 0.35);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.95);

      bassOsc.connect(bassFilter);
      subOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);

      bassOsc.start(now);
      subOsc.start(now);
      bassOsc.stop(now + (beatMs / 1000));
      subOsc.stop(now + (beatMs / 1000));

      // 2. Soft Brushed Swing Cymbal
      const beatInBar = this.synthStep % 4;
      if (beatInBar === 1 || beatInBar === 3) {
        this.triggerBrushHit(now, 0.045);
        this.triggerBrushHit(now + (beatMs / 1000) * 0.66, 0.025);
      }

      // 3. Ambient Jazz Chord Swell
      if (beatInBar === 0) {
        const barIdx = Math.floor(this.synthStep / 4) % chords.length;
        this.triggerJazzChord(chords[barIdx], now, 0.035, (beatMs * 3.5) / 1000);
      }

      this.synthStep++;
    }, beatMs);
  }

  // 2. Battle Royale: Warzone Big Band Swing Groove
  startRoyaleGroove() {
    this.stopSynthGroove();
    if (this.slotAudio) this.slotAudio.ensureAudio();
    if (!this.slotAudio || !this.slotAudio.ctx || this.isMuted) return;

    const master = this.ensureSynthMasterGain();
    if (!master) return;
    this.isPlaying = true;

    // Fast 122 BPM Swing Rhythm (~491ms per beat)
    const bpm = 122;
    const beatMs = (60 / bpm) * 1000;
    const bassline = [
      65.41,  // C2
      77.78,  // Eb2
      87.31,  // F2
      92.50,  // F#2
      98.00,  // G2
      116.54, // Bb2
      123.47, // B2
      130.81  // C3
    ];

    const brassChords = [
      [261.63, 311.13, 392.00, 466.16], // Cm7
      [220.00, 277.18, 329.63, 392.00]  // A7
    ];

    this.synthStep = 0;
    this.synthInterval = setInterval(() => {
      if (this.isMuted || !this.slotAudio || !this.slotAudio.ctx) return;
      const ctx = this.slotAudio.ctx;
      const now = ctx.currentTime;

      // 1. Driving Punchy Bass
      const noteFreq = bassline[this.synthStep % bassline.length];
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.20, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + (beatMs / 1000));

      // 2. Crisp Ride Cymbal Swing
      this.triggerBrushHit(now, 0.038);
      const beatInBar = this.synthStep % 4;
      if (beatInBar === 1 || beatInBar === 3) {
        this.triggerBrushHit(now + (beatMs / 1000) * 0.62, 0.030);
      }

      // 3. Muted Brass Stabs on Off-beats (beat 2 and 4)
      if (beatInBar === 1 || beatInBar === 3) {
        const chord = brassChords[Math.floor(this.synthStep / 4) % brassChords.length];
        this.triggerBrassStab(chord, now, 0.032);
      }

      this.synthStep++;
    }, beatMs);
  }

  // 3. Grand Crash: Electro-Jazz Ascent
  startCrashGroove() {
    this.stopSynthGroove();
    if (this.slotAudio) this.slotAudio.ensureAudio();
    if (!this.slotAudio || !this.slotAudio.ctx || this.isMuted) return;

    const master = this.ensureSynthMasterGain();
    if (!master) return;
    this.isPlaying = true;

    // 108 BPM (~555ms per beat)
    const bpm = 108;
    const beatMs = (60 / bpm) * 1000;
    const arpNotes = [
      110.00, // A2
      130.81, // C3
      164.81, // E3
      196.00, // G3
      220.00, // A3
      196.00, // G3
      164.81, // E3
      130.81  // C3
    ];

    this.synthStep = 0;
    this.synthInterval = setInterval(() => {
      if (this.isMuted || !this.slotAudio || !this.slotAudio.ctx) return;
      const ctx = this.slotAudio.ctx;
      const now = ctx.currentTime;

      // Pulse Arp with dynamic filter based on crash multiplier
      const noteFreq = arpNotes[this.synthStep % arpNotes.length];
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, now);

      const cutoff = Math.min(2400, 320 + (this.crashMultiplier - 1) * 200);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (beatMs / 1000) * 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + (beatMs / 1000));

      // Hi-hat tick
      this.triggerBrushHit(now, 0.025);

      this.synthStep++;
    }, beatMs / 2); // 8th note arp
  }

  setCrashMultiplier(mult) {
    this.crashMultiplier = Math.max(1, mult || 1);
  }

  // Synthesis Helpers
  triggerBrushHit(time, volume = 0.04) {
    if (!this.slotAudio || !this.slotAudio.ctx) return;
    const ctx = this.slotAudio.ctx;
    const master = this.synthMasterGain;
    if (!master) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.05);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      noise.start(time);
      noise.stop(time + 0.05);
    } catch (e) {}
  }

  triggerJazzChord(frequencies, time, volume = 0.03, duration = 1.5) {
    if (!this.slotAudio || !this.slotAudio.ctx) return;
    const ctx = this.slotAudio.ctx;
    const master = this.synthMasterGain;
    if (!master) return;

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  triggerBrassStab(frequencies, time, volume = 0.03) {
    if (!this.slotAudio || !this.slotAudio.ctx) return;
    const ctx = this.slotAudio.ctx;
    const master = this.synthMasterGain;
    if (!master) return;

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, time);
      filter.Q.setValueAtTime(2.0, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  }
}

class SlotAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.spinInterval = null;
    this.rollupInterval = null;

    // Background Music & Procedural Jazz Engine
    this.bgm = new BgmController(this);
  }

  initContext() {
    if (!this.ctx && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  ensureAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.bgm && !this.bgm.isPlaying && !this.isMuted && this.bgm.hasUserInteracted) {
      this.bgm.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.setMuted(this.isMuted);
    }
    return this.isMuted;
  }

  setBgmMode(mode) {
    if (this.bgm) {
      this.bgm.setMode(mode);
    }
  }

  // Click / Beep for buttons
  playClick() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Lever pull ratchet sound
  playLever() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + i * 50, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }, i * 40);
    }
  }

  // Continuous spinning reel sound
  startSpinningSound() {
    if (this.bgm) this.bgm.duck(0.12, 220);
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    this.stopSpinningSound();
    let tickCount = 0;
    this.spinInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      // alternating subtle frequencies for rolling sensation
      osc.frequency.setValueAtTime(140 + (tickCount % 2) * 40, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
      tickCount++;
    }, 70);
  }

  stopSpinningSound() {
    if (this.spinInterval) {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
    }
    if (this.bgm && !this.rollupInterval) {
      this.bgm.unduck(500, 300);
    }
  }

  // Authentic Mechanical Solenoid & Ratchet Pawl Reel Stop
  playReelStop(index = 0) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.playMechanicalReelStop(index);
    
    // 1. Heavy rubber bumper & drum mass impact (low-frequency punch)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + index * 25, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.14);

    gain.gain.setValueAtTime(0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);

    // 2. Crisp mechanical ratchet pawl snap (metal gear notch lock)
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sawtooth';
    click.frequency.setValueAtTime(1450 + index * 100, now);
    click.frequency.exponentialRampToValueAtTime(260, now + 0.035);
    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start(now);
    click.stop(now + 0.035);

    // 3. Subtle secondary rebound click (~50ms later when spring arm settles)
    const reboundTime = now + 0.052;
    const microClick = this.ctx.createOscillator();
    const microGain = this.ctx.createGain();
    microClick.type = 'triangle';
    microClick.frequency.setValueAtTime(820 + index * 40, reboundTime);
    microClick.frequency.exponentialRampToValueAtTime(290, reboundTime + 0.025);
    microGain.gain.setValueAtTime(0.08, reboundTime);
    microGain.gain.exponentialRampToValueAtTime(0.001, reboundTime + 0.025);

    microClick.connect(microGain);
    microGain.connect(this.ctx.destination);
    microClick.start(reboundTime);
    microClick.stop(reboundTime + 0.025);
  }

  // Win chime
  playWin() {
    if (this.bgm) {
      this.bgm.duck(0.08, 180);
      setTimeout(() => {
        if (!this.rollupInterval && this.bgm) this.bgm.unduck(600);
      }, 1400);
    }
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      }, idx * 100);
    });
  }

  // Jackpot / Huge Win fanfare & coins
  playJackpot() {
    if (this.bgm) {
      this.bgm.deepDuck(0.03, 150);
      setTimeout(() => {
        if (!this.rollupInterval && this.bgm) this.bgm.unduck(1000);
      }, 3800);
    }
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const fanfare = [
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 300 }, // G5
      { f: 1046.50, d: 700 } // C6
    ];

    let delay = 0;
    fanfare.forEach((item) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc2.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now);
        osc2.frequency.setValueAtTime(item.f * 1.005, now); // slight chorus

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.d / 1000);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + item.d / 1000);
        osc2.stop(now + item.d / 1000);
      }, delay);
      delay += item.d;
    });

    // Metallic coin shower sounds
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.playCoinDrop();
      }, 500 + i * 90);
    }
  }

  // Coin drop / ting sound
  playCoinDrop() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const freqs = [1800, 2200, 2600, 3100];
    const f = freqs[Math.floor(Math.random() * freqs.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Heavy metal coin locking sound in Hold & Win
  playCoinLock() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Heavy thud + metallic ting
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2800, now + 0.02);
    gain2.gain.setValueAtTime(0.25, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.25);
  }

  // Deep adrenaline Heartbeat pulse (lub-dub)
  playHeartbeat() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // First beat (lub)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second beat (dub)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(75, now + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(38, now + 0.26);
    gain2.gain.setValueAtTime(0.4, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.26);
  }

  // Suspense riser for Near-Miss 3rd reel slowdown
  playNearMissTension(duration = 2.0) {
    this.playNearMissRiser(duration);
  }

  // Suspense riser for Near-Miss 3rd reel slowdown
  playNearMissRiser(duration = 1.8) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + duration);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.85);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Card shuffle / flip sound
  playCardFlip() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Gamble Win / Double up sound
  playGambleWin() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      }, i * 65);
    });
  }

  // Gamble Lose / Bust sound
  playGambleLose() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [260, 220, 175, 130].forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      }, i * 90);
    });
  }

  // Mines - Gem / Diamond Reveal
  playGemReveal(step = 1) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const baseFreq = 480 + Math.min(step * 60, 600);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Harmonic bell
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, t);
      gain2.gain.setValueAtTime(0.18, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.25);
    }, 40);
  }

  // Mines - Explosion
  playMineExplode() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Deep sub bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise crackle
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // Mines - Cashout
  playCashout() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      }, idx * 60);
    });
  }

  // --- IGT WHEEL OF FORTUNE & BIG WIN AUDIO SYNTHESIS ---

  // Wheel Pointer / Peg Tick
  playWheelTick(pitch = 1.0) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1750 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(420 * pitch, now + 0.022);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  // Wheel Win Grand Fanfare
  playWheelWin() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      }, idx * 75);
    });
  }

  // Bonus Notification Chime
  playBonusNotification() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const chords = [587.33, 739.99, 880, 1174.66];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      }, idx * 70);
    });
  }

  // Rapid Coin Roll-up Counter Sound (Loop)
  startRollupSound() {
    if (this.bgm) this.bgm.deepDuck(0.03, 120);
    if (this.isMuted || this.rollupInterval) return;
    this.ensureAudio();
    if (!this.ctx) return;

    let counter = 0;
    this.rollupInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + (counter % 8) * 60, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
      counter++;
    }, 45);
  }

  stopRollupSound() {
    if (this.rollupInterval) {
      clearInterval(this.rollupInterval);
      this.rollupInterval = null;
    }
    if (this.bgm) {
      this.bgm.unduck(1200, 100);
    }
  }

  // Big Win / Mega Win / Epic Win Fanfare
  playBigWinCheer(tier = 'big') {
    if (this.bgm) this.bgm.deepDuck(0.03, 150);
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const baseChords = tier === 'epic' 
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093] 
      : (tier === 'mega' ? [440, 554.37, 659.25, 880, 1108.73, 1318.5] : [392, 493.88, 587.33, 783.99, 987.77]);

    baseChords.forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      }, i * 65);
    });
  }

  // Free Spins Mode Trigger
  playFreeSpinsTrigger() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ascending electronic glissando
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.7);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);

    // Followed by celebratory chords
    setTimeout(() => this.playWheelWin(), 600);
  }

  // Free Spins Multiplier Level-Up
  playMultiplierUp(mult = 2) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 500 + Math.min(12, mult) * 80;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Heavy mechanical reel stop (solenoid thud + ratchet latch)
  playMechanicalReelStop(reelIndex = 0) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitchOffset = reelIndex * 15;

    // 1. Solenoid low thud
    const oscLow = this.ctx.createOscillator();
    const gainLow = this.ctx.createGain();
    oscLow.type = 'triangle';
    oscLow.frequency.setValueAtTime(95 + pitchOffset, now);
    oscLow.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gainLow.gain.setValueAtTime(0.35, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    oscLow.connect(gainLow);
    gainLow.connect(this.ctx.destination);
    oscLow.start(now);
    oscLow.stop(now + 0.08);

    // 2. High metallic click/latch
    const oscHigh = this.ctx.createOscillator();
    const gainHigh = this.ctx.createGain();
    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(1400 - pitchOffset * 40, now);
    oscHigh.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gainHigh.gain.setValueAtTime(0.2, now);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    oscHigh.connect(gainHigh);
    gainHigh.connect(this.ctx.destination);
    oscHigh.start(now);
    oscHigh.stop(now + 0.04);
  }

  // Las Vegas Casino Floor Ambient Sound Generator
  startCasinoAmbient() {
    if (this.isAmbientActive) return;
    this.ensureAudio();
    if (!this.ctx) return;

    this.isAmbientActive = true;
    try {
      // 1. White-to-Pink noise buffer for gentle room murmur
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.12;
      }

      this.ambientNoiseSource = this.ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuffer;
      this.ambientNoiseSource.loop = true;

      // Bandpass filter to simulate muffled casino hall acoustics
      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.value = 420;
      this.ambientFilter.Q.value = 1.2;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.045, this.ctx.currentTime); // subtle background level

      this.ambientNoiseSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientNoiseSource.start(0);

      // 2. Periodic faint casino bells / distant chimes
      this.ambientChimeInterval = setInterval(() => {
        if (!this.isAmbientActive || this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        const freqs = [1046, 1174, 1318, 1567, 1760];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        chimeOsc.frequency.setValueAtTime(f, now);

        chimeGain.gain.setValueAtTime(0.015, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chimeOsc.start(now);
        chimeOsc.stop(now + 0.8);
      }, 3500);
    } catch (e) {
      console.warn('Could not start ambient casino sound:', e);
    }
  }

  stopCasinoAmbient() {
    this.isAmbientActive = false;
    if (this.ambientChimeInterval) {
      clearInterval(this.ambientChimeInterval);
      this.ambientChimeInterval = null;
    }
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop();
        this.ambientNoiseSource.disconnect();
      } catch (e) {}
      this.ambientNoiseSource = null;
    }
  }

  toggleCasinoAmbient() {
    if (this.isAmbientActive) {
      this.stopCasinoAmbient();
      return false;
    } else {
      this.startCasinoAmbient();
      return true;
    }
  }

  /* ==========================================================================
     Dynamic Audio Profiler (Casino, Vault Crawler, Battle Royale)
     ========================================================================== */

  switchProfile(profile = 'casino') {
    this.currentProfile = profile;
    this.ensureAudio();
    if (this.isMuted || !this.ctx) return;

    if (profile === 'vault') {
      this.stopCasinoAmbient();
      this.playVaultDoorClank();
    } else if (profile === 'royale') {
      this.stopCasinoAmbient();
      this.playRoyaleWarHorn();
    } else {
      this.playGoldChime();
    }
  }

  // Golden shimmer for Casino mode
  playGoldChime() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  // Vault hydraulic release & heavy steel latch
  playVaultDoorClank() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Low sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // 2. Metallic clank & ratchet
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const clank = this.ctx.createOscillator();
        const clankGain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        clank.type = 'square';
        clank.frequency.setValueAtTime(420 + i * 110, t);
        clank.frequency.exponentialRampToValueAtTime(180, t + 0.08);

        clankGain.gain.setValueAtTime(0.2, t);
        clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        clank.connect(clankGain);
        clankGain.connect(this.ctx.destination);
        clank.start(t);
        clank.stop(t + 0.08);
      }, 70 + i * 45);
    }
  }

  // Vault alarm siren sweep for Boss encounters
  playVaultAlarm() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.18);
    osc.frequency.linearRampToValueAtTime(320, now + 0.36);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Battle Royale War Horn announcement
  playRoyaleWarHorn() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const chords = [
      [220, 330],
      [277.18, 415.3],
      [329.63, 493.88]
    ];

    chords.forEach((pair, idx) => {
      const delay = idx * 0.12;
      pair.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + delay);

        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.35);
      });
    });
  }

  // Battle Royale heartbeat sonar tick
  playRoyaleZoneTick() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Battle Royale heavy elimination gong
  playRoyaleElimination() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.8);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  // Battle Royale victory fanfare
  playRoyaleVictory() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [392, 523.25, 659.25, 783.99, 1046.50];

    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.25, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  }
}

window.slotAudio = new SlotAudio();

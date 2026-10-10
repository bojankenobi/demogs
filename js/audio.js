/**
 * Happy Hour Slot - Web Audio API Synthesizer
 * Produces crisp, casino-grade sound effects without external audio files.
 */
class SlotAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.spinInterval = null;
  }

  initContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  ensureAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
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
  }

  // Big Win / Mega Win / Epic Win Fanfare
  playBigWinCheer(tier = 'big') {
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
}

window.slotAudio = new SlotAudio();

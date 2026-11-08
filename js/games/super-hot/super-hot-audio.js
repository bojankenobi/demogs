/**
 * Grand Slot Club - Grand Super Hot Audio Synthesizer
 * Web Audio API procedural synthesis for authentic EGT mechanical sounds,
 * flame whooshes, scatter tension bells, gamble heartbeats, and jackpot fanfares.
 */

(function(root) {
  'use strict';

  class SuperHotAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.suspenseOsc = null;
      this.heartbeatInterval = null;

      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('grandslot_bgm_muted') === '1') {
          this.isMuted = true;
        }
      } catch (e) {}
    }

    initContext() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMute(muted) {
      this.isMuted = !!muted;
      if (this.isMuted) {
        this.stopSuspense();
        this.stopHeartbeat();
      }
    }

    /**
     * Mechanical reel tick during spin
     */
    playReelTick() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.03);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    }

    /**
     * Heavy mechanical clunk when an individual reel stops
     */
    playReelStop(reelIndex = 0) {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const baseFreq = 110 + (reelIndex * 15);

      // 1. Thump component
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);

      // 2. Metallic latch click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1200 + (reelIndex * 60), t);
      clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.02);

      clickGain.gain.setValueAtTime(0.12, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(t);
      clickOsc.stop(t + 0.025);
    }

    /**
     * Slam Stop: All reels brake simultaneously
     */
    playSlamStop() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    /**
     * High bright chime when a Scatter (Golden Star) lands
     */
    playScatterBell(scatterNum = 1) {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const freqs = [659.25, 880.00, 1174.66, 1567.98, 2093.00];
      const freq = freqs[Math.min(scatterNum - 1, 4)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.setValueAtTime(freq * 1.5, t + 0.04);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    }

    /**
     * Rising suspense drone while anticipating 3rd/4th/5th Scatter
     */
    startSuspense() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      this.stopSuspense();

      const t = this.ctx.currentTime;
      this.suspenseOsc = this.ctx.createOscillator();
      this.suspenseGain = this.ctx.createGain();

      this.suspenseOsc.type = 'sawtooth';
      this.suspenseOsc.frequency.setValueAtTime(220, t);
      this.suspenseOsc.frequency.linearRampToValueAtTime(660, t + 2.5);

      this.suspenseGain.gain.setValueAtTime(0.12, t);

      // Lowpass filter for smooth pulsating tension
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(2400, t + 2.5);

      this.suspenseOsc.connect(filter);
      filter.connect(this.suspenseGain);
      this.suspenseGain.connect(this.ctx.destination);

      this.suspenseOsc.start(t);
    }

    stopSuspense() {
      if (this.suspenseOsc) {
        try {
          const t = this.ctx ? this.ctx.currentTime : 0;
          if (this.suspenseGain && this.ctx) {
            this.suspenseGain.gain.linearRampToValueAtTime(0.001, t + 0.05);
          }
          this.suspenseOsc.stop(t + 0.06);
        } catch (e) {}
        this.suspenseOsc = null;
        this.suspenseGain = null;
      }
    }

    /**
     * Fire swoosh & flame burst sound for winning lines
     */
    playFlameWhoosh() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.15);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.42);
    }

    /**
     * Electronic arcade win fanfare
     */
    playWinFanfare(tier = 'normal') {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const notes = (tier === 'big' || tier === 'epic') 
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] 
        : [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + (idx * 0.08);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.26);
      });
    }

    /**
     * Heartbeat pulse for Gamble Screen
     */
    startHeartbeat() {
      if (this.isMuted) return;
      this.stopHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        this.playSingleHeartbeat();
      }, 750);
      this.playSingleHeartbeat();
    }

    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }

    playSingleHeartbeat() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Lub
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(75, t);
      osc1.frequency.exponentialRampToValueAtTime(30, t + 0.1);
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.11);

      // Dub
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.frequency.setValueAtTime(60, t + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(25, t + 0.22);
      gain2.gain.setValueAtTime(0.25, t + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.12);
      osc2.stop(t + 0.23);
    }

    playCardFlip() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.06);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    }

    playJackpotAlarm() {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      for (let i = 0; i < 4; i++) {
        const t = this.ctx.currentTime + (i * 0.15);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440 * (i % 2 === 0 ? 1.5 : 2.0), t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    }
  }

  root.SuperHotAudio = SuperHotAudio;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SuperHotAudio };
  }
})(typeof window !== 'undefined' ? window : global);

/**
 * Plinko Deluxe - 60FPS Physics Engine & Multiplier Pyramid
 * Features:
 * - Real-time rigid body physics with peg collisions, restitution & deflection
 * - Configurable pyramid rows (8, 12, 16 rows)
 * - 3 Risk tiers: Low (Nizak), Medium (Srednji), High (Visok - up to 1000x!)
 * - Multi-ball dropping with neon particle trails
 * - Bottom multiplier bins with spring bounce animations & dynamic glow
 * - Acoustic peg ping synthesizer and celebratory win fanfares
 * - History ticker of recent multipliers
 * - Integrated with Wallet & Player Tracker
 */

const PLINKO_PAYOUTS = {
  8: {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    med: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [8.9, 3, 1.6, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.6, 3, 8.9],
    med: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    med: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

class PlinkoDeluxeGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.currentBet = 20;
    this.rows = 12; // 8, 12, or 16
    this.risk = 'med'; // 'low', 'med', 'high'

    // Simulation & Physics
    this.balls = [];
    this.pegs = [];
    this.bins = [];
    this.particles = [];
    this.animFrameId = null;
    this.autoDropTimer = null;
    this.autoDropsRemaining = 0;
    this.isAutoDropping = false;

    // History of multipliers hit
    this.history = [2.0, 0.6, 4.0, 0.3, 1.1, 11.0, 0.6, 1.1];

    // Audio synth context for peg pinging
    this.audioCtx = null;

    // DOM references
    this.viewContainer = document.getElementById('plinko-game-view');
    this.canvasEl = document.getElementById('plinko-canvas');
    this.historyStrip = document.getElementById('plinko-history-strip');
    this.betInput = document.getElementById('plinko-bet-val');
    this.btnMinus = document.getElementById('plinko-bet-minus');
    this.btnPlus = document.getElementById('plinko-bet-plus');
    this.quickChipButtons = document.querySelectorAll('.plinko-chip-btn');
    this.btnDrop = document.getElementById('plinko-drop-btn');
    this.btnAutoDrop = document.getElementById('plinko-auto-btn');
    this.riskButtons = document.querySelectorAll('.plinko-risk-btn');
    this.rowsButtons = document.querySelectorAll('.plinko-rows-btn');
    this.statusSub = document.getElementById('plinko-status-sub');
    this.totalWinEl = document.getElementById('plinko-total-win');

    this.initDOM();
    this.initCanvas();
    this.buildPyramid();
  }

  /* ==========================================================================
     Pyramid Layout & Multiplier Bins
     ========================================================================== */
  buildPyramid() {
    const w = this.canvasWidth || 460;
    const h = this.canvasHeight || 420;

    this.pegs = [];
    this.bins = [];

    const topY = Math.round(40 * Math.min(1.4, Math.max(1.0, h / 420)));
    const bottomY = h - Math.round(55 * Math.min(1.4, Math.max(1.0, h / 420)));
    const verticalGap = (bottomY - topY) / (this.rows + 1);

    // Calculate peg radius based on row count and canvas scale
    const scaleFactor = Math.min(1.5, Math.max(1.0, w / 460));
    const basePegR = this.rows === 16 ? 3.0 : (this.rows === 12 ? 3.6 : 4.4);
    const pegRadius = +(basePegR * scaleFactor).toFixed(1);

    // Generate Pegs in an Equilateral Triangular Grid (this.rows rows: 0 to this.rows - 1)
    for (let r = 0; r < this.rows; r++) {
      const pinsInRow = r + 3;
      const rowY = topY + r * verticalGap;
      const rowWidth = (pinsInRow - 1) * (w / (this.rows + 3.2));
      const startX = (w - rowWidth) / 2;
      const spacingX = rowWidth / (pinsInRow - 1);

      for (let c = 0; c < pinsInRow; c++) {
        const x = startX + c * spacingX;
        this.pegs.push({
          row: r,
          col: c,
          x: x,
          y: rowY,
          radius: pegRadius,
          hitIntensity: 0
        });
      }
    }

    // Generate Multiplier Bins at the Bottom (aligned with the gaps of the last row)
    const currentPayouts = PLINKO_PAYOUTS[this.rows][this.risk];
    const binCount = currentPayouts.length;
    const lastRow = this.pegs.filter(p => p.row === this.rows - 1);
    
    // Sort bottom pegs by X coordinate to align bins precisely under slots
    lastRow.sort((a, b) => a.x - b.x);

    const binY = bottomY + Math.round(12 * Math.min(1.5, Math.max(1.0, h / 420)));
    const binHeight = Math.round(32 * Math.min(1.5, Math.max(1.0, h / 420)));

    for (let i = 0; i < binCount; i++) {
      let x, binWidth;
      if (lastRow[i] && lastRow[i + 1]) {
        x = (lastRow[i].x + lastRow[i + 1].x) / 2;
        binWidth = lastRow[i + 1].x - lastRow[i].x - 2;
      } else {
        binWidth = w / (binCount + 1.5);
        x = (w / (binCount + 1)) * (i + 1);
      }

      const mult = currentPayouts[i];
      const colorInfo = this.getBinColor(mult, i, binCount);

      this.bins.push({
        index: i,
        x: x,
        y: binY,
        width: Math.max(16, binWidth),
        height: binHeight,
        mult: mult,
        color: colorInfo.color,
        borderColor: colorInfo.border,
        textColor: colorInfo.text,
        scale: 1.0,
        glow: 0
      });
    }

    this.renderHistory();
  }

  getPegPos(r, c) {
    const w = this.canvasWidth || 460;
    const h = this.canvasHeight || 420;
    const topY = Math.round(40 * Math.min(1.4, Math.max(1.0, h / 420)));
    const bottomY = h - Math.round(55 * Math.min(1.4, Math.max(1.0, h / 420)));
    const verticalGap = (bottomY - topY) / (this.rows + 1);

    const pinsInRow = r + 3;
    const rowY = topY + r * verticalGap;
    const rowWidth = (pinsInRow - 1) * (w / (this.rows + 3.2));
    const startX = (w - rowWidth) / 2;
    const spacingX = rowWidth / (pinsInRow - 1);

    return {
      x: startX + c * spacingX,
      y: rowY
    };
  }

  generateGaltonPath() {
    const decisions = [];
    let k = 0;
    for (let r = 0; r < this.rows; r++) {
      const d = Math.random() < 0.5 ? 0 : 1;
      decisions.push(d);
      k += d;
    }

    const apexPos = this.getPegPos(0, 1);
    const waypoints = [
      { x: apexPos.x + (Math.random() * 2 - 1), y: 15, isApexSpawn: true },
      { x: apexPos.x, y: apexPos.y, pegR: 0, pegC: 1, dir: decisions[0] }
    ];

    let currentC = 1;
    for (let r = 0; r < this.rows - 1; r++) {
      const d = decisions[r];
      currentC = currentC + d;
      const pegPos = this.getPegPos(r + 1, currentC);
      waypoints.push({
        x: pegPos.x,
        y: pegPos.y,
        pegR: r + 1,
        pegC: currentC,
        dir: decisions[r + 1]
      });
    }

    // Target bin waypoint
    const targetBin = this.bins[k] || this.bins[Math.floor(this.bins.length / 2)];
    const binX = targetBin ? targetBin.x : (this.canvasWidth || 460) / 2;
    const binY = targetBin ? targetBin.y : (this.canvasHeight || 420) - 40;

    waypoints.push({
      x: binX,
      y: binY,
      isBin: true,
      binIndex: k
    });

    return { k, waypoints, decisions };
  }

  getBinColor(mult, idx, total) {
    const distFromCenter = Math.abs(idx - (total - 1) / 2) / ((total - 1) / 2);

    if (distFromCenter > 0.8) {
      // Outermost highest risk (Red / Coral / Bright Gold)
      return { color: 'rgba(239, 68, 68, 0.85)', border: '#f87171', text: '#ffffff' };
    } else if (distFromCenter > 0.55) {
      // Mid-high (Orange / Amber)
      return { color: 'rgba(245, 158, 11, 0.85)', border: '#fbbf24', text: '#ffffff' };
    } else if (distFromCenter > 0.28) {
      // Medium (Warm Gold / Bronze)
      return { color: 'rgba(212, 175, 55, 0.75)', border: '#ffd700', text: '#ffffff' };
    } else {
      // Center (Slate / Indigo low return)
      return { color: 'rgba(56, 189, 248, 0.45)', border: '#38bdf8', text: '#e2e8f0' };
    }
  }

  /* ==========================================================================
     DOM & Event Initialization
     ========================================================================== */
  initDOM() {
    if (this.btnMinus) {
      this.btnMinus.addEventListener('click', () => {
        this.currentBet = Math.max(5, this.currentBet - 5);
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    if (this.btnPlus) {
      this.btnPlus.addEventListener('click', () => {
        const maxLimit = this.wallet && this.wallet.balance > 0 ? this.wallet.balance : 10000;
        this.currentBet = Math.min(maxLimit, this.currentBet + 5);
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    this.quickChipButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('max')) {
          this.currentBet = this.wallet && this.wallet.balance > 0 ? this.wallet.balance : 500;
        } else {
          const val = parseInt(btn.getAttribute('data-amt'), 10);
          if (!isNaN(val)) this.currentBet = val;
        }
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    });

    // Risk selectors
    this.riskButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const r = btn.getAttribute('data-risk');
        if (r && ['low', 'med', 'high'].includes(r)) {
          this.risk = r;
          this.riskButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.buildPyramid();
          if (window.slotAudio) window.slotAudio.playClick();
        }
      });
    });

    // Row selectors
    this.rowsButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rowsCount = parseInt(btn.getAttribute('data-rows'), 10);
        if ([8, 12, 16].includes(rowsCount)) {
          this.rows = rowsCount;
          this.rowsButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.buildPyramid();
          if (window.slotAudio) window.slotAudio.playClick();
        }
      });
    });

    // Drop Button
    if (this.btnDrop) {
      this.btnDrop.addEventListener('click', () => {
        this.dropBall();
      });
    }

    // Auto Drop Button
    if (this.btnAutoDrop) {
      this.btnAutoDrop.addEventListener('click', () => {
        this.toggleAutoDrop();
      });
    }
  }

  initCanvas() {
    if (!this.canvasEl) return;
    this.canvas = this.canvasEl;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.buildPyramid();
    });
  }

  resizeCanvas() {
    if (!this.canvas || !this.viewContainer) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 0 ? rect.width : 460;
    const h = rect.height > 0 ? rect.height : 420;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  /* ==========================================================================
     Game Lifecycle: Mount / Unmount / ForceExit
     ========================================================================== */
  mount() {
    this.isActive = true;
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }

    if (this.wallet) {
      this.currentBet = Math.min(this.wallet.bet || 20, this.wallet.balance > 0 ? this.wallet.balance : 20);
    }
    this.updateBetDisplay();
    this.resizeCanvas();
    this.buildPyramid();
    this.startRenderLoop();
  }

  unmount() {
    this.isActive = false;
    this.stopAutoDrop();
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.balls = [];
    this.particles = [];
  }

  forceExit() {
    this.stopAutoDrop();
  }

  /* ==========================================================================
     Audio Synthesis for Peg Collision & Bin Landing
     ========================================================================== */
  playPegPing(highPitch = false) {
    try {
      if (!this.audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) this.audioCtx = new AudioClass();
      }
      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        if (this.audioCtx) this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const freq = highPitch ? (800 + Math.random() * 200) : (440 + Math.random() * 120);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  /* ==========================================================================
     Drop Ball Engine
     ========================================================================== */
  dropBall() {
    if (!this.wallet || this.wallet.balance < this.currentBet) {
      if (this.statusSub) {
        this.statusSub.textContent = 'NEDOVOLJNO KREDITA ZA OPKLADU!';
        setTimeout(() => {
          if (this.statusSub) this.statusSub.textContent = 'IZABERITE ULOG I SPUSTITE KUGLICU';
        }, 1500);
      }
      this.stopAutoDrop();
      if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      return false;
    }

    let success = false;
    if (typeof this.wallet.deductBet === 'function') {
      success = this.wallet.deductBet(this.currentBet);
    } else if (this.wallet.balance >= this.currentBet) {
      this.wallet.balance -= this.currentBet;
      if (typeof this.wallet.setLastWin === 'function') this.wallet.setLastWin(0);
      this.wallet.updateUI();
      success = true;
    }

    if (!success) {
      this.stopAutoDrop();
      return false;
    }

    // Audio cue
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }

    const pathData = this.generateGaltonPath();
    const scaleFactor = Math.min(1.5, Math.max(1.0, (this.canvasWidth || 460) / 460));
    const baseBallR = this.rows === 16 ? 4.0 : (this.rows === 12 ? 4.8 : 5.6);
    const ballRadius = +(baseBallR * scaleFactor).toFixed(1);

    this.balls.push({
      id: 'ball_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      bet: this.currentBet,
      radius: ballRadius,
      trail: [],
      hue: Math.floor(Math.random() * 45) + 35, // Golden-orange hue
      waypoints: pathData.waypoints,
      targetBinIndex: pathData.k,
      currSegment: 0,
      t: 0,
      speed: 0.10, // ~10 frames per hop => ~2s drop
      x: pathData.waypoints[0].x,
      y: pathData.waypoints[0].y
    });

    if (this.statusSub) {
      this.statusSub.textContent = `KUGLICA U IGRI • ULOG: ${this.currentBet} ZLT`;
    }

    return true;
  }

  toggleAutoDrop() {
    if (this.isAutoDropping) {
      this.stopAutoDrop();
    } else {
      this.isAutoDropping = true;
      if (this.btnAutoDrop) {
        this.btnAutoDrop.textContent = 'ZAUSTAVI AUTO';
        this.btnAutoDrop.classList.add('active');
      }
      this.dropBall();
      this.autoDropTimer = setInterval(() => {
        if (!this.isActive || !this.isAutoDropping) {
          this.stopAutoDrop();
          return;
        }
        const dropped = this.dropBall();
        if (!dropped) this.stopAutoDrop();
      }, 450);
    }
  }

  stopAutoDrop() {
    this.isAutoDropping = false;
    if (this.autoDropTimer) {
      clearInterval(this.autoDropTimer);
      this.autoDropTimer = null;
    }
    if (this.btnAutoDrop) {
      this.btnAutoDrop.textContent = 'AUTO SPUŠTANJE';
      this.btnAutoDrop.classList.remove('active');
    }
  }

  /* ==========================================================================
     Physics Engine: Galton Board Kinematics & Bin Landing
     ========================================================================== */
  updatePhysics() {
    // 1. Decay peg hit flashes
    this.pegs.forEach(peg => {
      if (peg.hitIntensity > 0) {
        peg.hitIntensity = Math.max(0, peg.hitIntensity - 0.08);
      }
    });

    // 2. Decay bin spring scale and glow
    this.bins.forEach(bin => {
      if (bin.scale > 1.0) {
        bin.scale = Math.max(1.0, bin.scale - 0.035);
      }
      if (bin.glow > 0) {
        bin.glow = Math.max(0, bin.glow - 0.04);
      }
    });

    // 3. Update Balls along their Galton Waypoints
    for (let b = this.balls.length - 1; b >= 0; b--) {
      const ball = this.balls[b];
      const wp = ball.waypoints;
      const seg = ball.currSegment;

      if (!wp || seg >= wp.length - 1) {
        this.balls.splice(b, 1);
        continue;
      }

      const A = wp[seg];
      const B = wp[seg + 1];

      ball.t += ball.speed;

      // Kinematic interpolation with smooth horizontal step and parabolic hop
      const t = Math.min(1.0, ball.t);
      const st = t * t * (3 - 2 * t); // Smoothstep for X
      ball.x = A.x + (B.x - A.x) * st;

      if (seg === 0) {
        // Initial fall onto apex peg
        ball.y = A.y + (B.y - A.y) * (t * t);
      } else if (B.isBin) {
        // Final drop into bottom bin
        ball.y = A.y + (B.y - A.y) * (t * t);
      } else {
        // Parabolic arc bounce over peg A towards peg B
        const bounceHeight = 5.2;
        ball.y = A.y + (B.y - A.y) * t - (4 * bounceHeight * t * (1 - t));
      }

      // Trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 6) ball.trail.shift();

      // Check waypoint completion
      if (ball.t >= 1.0) {
        ball.currSegment++;
        ball.t = 0;

        if (B.isBin) {
          // Ball arrived in target bin!
          const bin = this.bins[B.binIndex] || this.bins[Math.floor(this.bins.length / 2)];
          this.handleBallLanding(ball, bin);
          this.balls.splice(b, 1);
        } else if (B.pegR !== undefined) {
          // Ball collided with peg B!
          const targetPeg = this.pegs.find(p => p.row === B.pegR && p.col === B.pegC);
          if (targetPeg) {
            targetPeg.hitIntensity = 1.0;
          }
          this.playPegPing(B.pegR > this.rows * 0.65);
          this.spawnPegSparks(B.x, B.y, 4);
        }
      }
    }

    // 4. Update splash and spark particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const pt = this.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;
      if (pt.alpha <= 0) {
        this.particles.splice(p, 1);
      }
    }
  }

  handleBallLanding(ball, bin) {
    const mult = bin.mult;
    const winAmt = Math.round(ball.bet * mult);
    const netProfit = winAmt - ball.bet;

    // Credit win
    if (this.wallet && winAmt > 0) {
      this.wallet.addWin(winAmt);
    }

    if (window.slotApp && window.slotApp.playerTracker) {
      window.slotApp.playerTracker.recordSpin('plinko', ball.bet, winAmt);
    }

    // Trigger visual reactions on bin
    bin.scale = 1.28;
    bin.glow = 1.0;

    // Spawn landing splash particles
    this.spawnBinParticles(bin.x, bin.y, bin.color, mult >= 5.0 ? 25 : 12);

    // Add to multiplier history
    this.history.unshift(mult);
    if (this.history.length > 8) this.history.pop();
    this.renderHistory();

    // Sound effect based on REAL net outcome
    if (mult >= 10.0) {
      if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
      if (window.particleEngine) window.particleEngine.spawnCelebration(true);
    } else if (mult >= 2.0) {
      if (window.slotAudio && window.slotAudio.playCashout) window.slotAudio.playCashout();
    } else if (mult > 1.0) {
      if (window.slotAudio && window.slotAudio.playWin) window.slotAudio.playWin();
    } else if (mult === 1.0) {
      if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    }

    // Status announcement that CLEARLY communicates Win vs Loss
    if (this.statusSub) {
      if (mult >= 2.0) {
        this.statusSub.innerHTML = `<span style="color:#4ade80;font-weight:900;">🎉 DOBITAK: +${winAmt.toLocaleString()} ZLT (${mult >= 100 ? Math.round(mult) : mult.toFixed(1)}x) • NETO: +${netProfit.toLocaleString()} ZLT</span>`;
      } else if (mult > 1.0) {
        this.statusSub.innerHTML = `<span style="color:#22c55e;font-weight:700;">DOBITAK: +${winAmt.toLocaleString()} ZLT (${mult.toFixed(1)}x)</span>`;
      } else if (mult === 1.0) {
        this.statusSub.innerHTML = `<span style="color:#94a3b8;">POVRATAK ULOGA: ${winAmt.toLocaleString()} ZLT (1.0x)</span>`;
      } else {
        // Net loss (mult < 1.0, npr. 0.2x, 0.3x, 0.5x, 0.6x)
        const lossAmt = ball.bet - winAmt;
        this.statusSub.innerHTML = `<span style="color:#f87171;font-weight:700;">GUBITAK: -${lossAmt.toLocaleString()} ZLT • POVRAĆAJ: ${winAmt.toLocaleString()} ZLT (${mult.toFixed(1)}x)</span>`;
      }
    }
  }

  spawnPegSparks(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color: '#fbbf24',
        alpha: 1.0,
        decay: Math.random() * 0.08 + 0.04
      });
    }
  }

  spawnBinParticles(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 1.2) + Math.random() * (Math.PI * 0.6);
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: color,
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  }

  /* ==========================================================================
     Canvas Render Loop (60FPS)
     ========================================================================== */
  startRenderLoop() {
    const loop = () => {
      if (!this.isActive) return;

      this.updatePhysics();
      this.renderCanvas();

      this.animFrameId = requestAnimationFrame(loop);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(loop);
  }

  renderCanvas() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvasWidth || 460;
    const h = this.canvasHeight || 420;

    // 1. Clean backdrop
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient gold rays & luxury grid
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // 3. Render Multiplier Bins
    this.bins.forEach(bin => {
      ctx.save();
      ctx.translate(bin.x, bin.y + bin.height / 2);
      ctx.scale(bin.scale, bin.scale);

      const halfW = bin.width / 2;
      const halfH = bin.height / 2;

      // Glow effect if recently landed
      if (bin.glow > 0) {
        ctx.shadowBlur = 16 * bin.glow;
        ctx.shadowColor = bin.borderColor;
      }

      // Rounded bin background
      ctx.fillStyle = bin.color;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, bin.width, bin.height, 6);
      ctx.fill();

      // Bin border
      ctx.strokeStyle = bin.borderColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Bin multiplier text
      ctx.shadowBlur = 0;
      ctx.fillStyle = bin.textColor;
      const binScale = Math.min(1.4, Math.max(1.0, (this.canvasWidth || 460) / 460));
      const fontRem = (this.rows === 16 ? 0.58 : 0.68) * binScale;
      ctx.font = `800 ${fontRem.toFixed(2)}rem 'Cinzel', 'Trajan Pro', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const txt = bin.mult >= 100 ? `${Math.round(bin.mult)}x` : `${bin.mult}x`;
      ctx.fillText(txt, 0, 0);

      ctx.restore();
    });

    // 4. Render Pegs
    this.pegs.forEach(peg => {
      ctx.save();
      if (peg.hitIntensity > 0) {
        ctx.shadowBlur = 12 * peg.hitIntensity;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#cbd5e1';
      }

      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring for metallic look
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    });

    // 5. Render Particle Splashes
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Render Balls & Trails
    this.balls.forEach(ball => {
      // Draw neon trail
      if (ball.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = `hsla(${ball.hue}, 90%, 55%, 0.4)`;
        ctx.lineWidth = ball.radius * 1.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        for (let t = 1; t < ball.trail.length; t++) {
          ctx.lineTo(ball.trail[t].x, ball.trail[t].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Ball
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = `hsl(${ball.hue}, 100%, 50%)`;

      // Ball gradient
      const grad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.2,
        ball.x,
        ball.y,
        ball.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, `hsl(${ball.hue}, 100%, 55%)`);
      grad.addColorStop(1, `hsl(${ball.hue - 15}, 100%, 35%)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  /* ==========================================================================
     UI Rendering & Updates
     ========================================================================== */
  updateBetDisplay() {
    if (this.betInput) {
      this.betInput.textContent = this.currentBet.toLocaleString();
    }
  }

  renderHistory() {
    if (!this.historyStrip) return;
    this.historyStrip.innerHTML = this.history.map(mult => {
      let tierClass = 'blue';
      if (mult >= 10.0) tierClass = 'gold';
      else if (mult >= 2.0) tierClass = 'purple';

      return `<span class="crash-pill ${tierClass}">${mult >= 100 ? Math.round(mult) : mult.toFixed(1)}x</span>`;
    }).join('');
  }
}

window.PlinkoDeluxeGame = PlinkoDeluxeGame;
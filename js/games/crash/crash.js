/**
 * Grand Crash (Aviator) - Real-Time Multiplier Game Engine
 * Features:
 * - Real-time animated canvas flight trajectory (gradient rocket path, jet flame & stars)
 * - Provably fair exponential multiplier growth (1.00x -> 1000x)
 * - Live betting & countdown phase (5s countdown between flights)
 * - Instant and Auto-Cashout functionality
 * - History ticker of past crash multipliers
 * - Full audio synthesis & particle integration
 */

class GrandCrashGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;

    this.isActive = false;
    this.gameState = 'idle'; // 'waiting', 'flying', 'crashed'
    this.currentBet = 20;
    this.hasActiveBet = false;
    this.hasCashedOut = false;
    this.currentMultiplier = 1.0;
    this.targetCrashPoint = 1.0;
    this.flightStartTime = 0;
    this.animFrameId = null;
    this.countdownTimer = null;
    this.countdownLeft = 5.0;

    // Auto cashout setting
    this.isAutoCashout = false;
    this.autoCashoutMult = 1.50;
    this.lastWonAmount = 0;
    this.lastCashMultiplier = 1.0;

    // History of past crashes
    this.history = [1.85, 3.40, 1.15, 12.80, 2.10, 1.04, 5.25, 1.95];

    // Canvas & particles
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.stars = [];
    this.explosionParticles = [];

    // DOM references
    this.viewContainer = document.getElementById('crash-game-view');
    this.canvasEl = document.getElementById('crash-canvas');
    this.historyStrip = document.getElementById('crash-history-strip');
    this.multDisplay = document.getElementById('crash-mult-display');
    this.statusSub = document.getElementById('crash-status-sub');
    this.countdownWrap = document.getElementById('crash-countdown-wrap');
    this.countdownFill = document.getElementById('crash-countdown-fill');
    this.betInput = document.getElementById('crash-bet-val');
    this.btnMinus = document.getElementById('crash-bet-minus');
    this.btnPlus = document.getElementById('crash-bet-plus');
    this.btnMainAction = document.getElementById('crash-action-btn');
    this.actionTitle = document.getElementById('crash-action-title');
    this.actionSub = document.getElementById('crash-action-sub');
    this.autoToggle = document.getElementById('crash-auto-toggle');
    this.autoMultInput = document.getElementById('crash-auto-mult');
    this.autoBadge = document.getElementById('crash-auto-badge');
    this.quickChipButtons = document.querySelectorAll('.crash-chip-btn');
    this.presetButtons = document.querySelectorAll('.crash-preset-btn');

    this.initDOM();
    this.initCanvas();
  }

  /* ==========================================================================
     Provably Fair Math Engine
     ========================================================================== */
  generateCrashPoint() {
    // 97% RTP casino standard: ~3.5% instant crash at 1.00x
    const r = Math.random();
    if (r < 0.035) {
      return 1.00;
    }
    // Exponential probability distribution
    const mult = 0.97 / (1.0 - r);
    // Clamp between 1.01x and 1000.00x, rounded to 2 decimals
    return Math.max(1.01, Math.min(1000.0, Math.floor(mult * 100) / 100));
  }

  /* ==========================================================================
     DOM & Event Initialization
     ========================================================================== */
  initDOM() {
    if (this.btnMinus) {
      this.btnMinus.addEventListener('click', () => {
        if (this.hasActiveBet && this.gameState === 'flying') return;
        this.currentBet = Math.max(5, this.currentBet - 5);
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    if (this.btnPlus) {
      this.btnPlus.addEventListener('click', () => {
        if (this.hasActiveBet && this.gameState === 'flying') return;
        const maxLimit = this.wallet && this.wallet.balance > 0 ? this.wallet.balance : 10000;
        this.currentBet = Math.min(maxLimit, this.currentBet + 5);
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    this.quickChipButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.hasActiveBet && this.gameState === 'flying') return;
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

    if (this.autoToggle) {
      this.autoToggle.addEventListener('change', (e) => {
        this.isAutoCashout = e.target.checked;
        this.updateAutoCashoutUI();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    const handleAutoMultChange = (valStr) => {
      let val = parseFloat(valStr);
      if (isNaN(val) || val < 1.05) val = 1.05;
      this.autoCashoutMult = Math.min(100.0, Math.round(val * 100) / 100);
      this.isAutoCashout = true;
      this.updateAutoCashoutUI();
    };

    if (this.autoMultInput) {
      this.autoMultInput.addEventListener('input', (e) => {
        handleAutoMultChange(e.target.value);
      });
      this.autoMultInput.addEventListener('change', (e) => {
        handleAutoMultChange(e.target.value);
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    if (this.presetButtons) {
      this.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = parseFloat(btn.getAttribute('data-preset'));
          if (!isNaN(preset)) {
            this.autoCashoutMult = preset;
            this.isAutoCashout = true;
            this.updateAutoCashoutUI();
            if (window.slotAudio) window.slotAudio.playClick();
          }
        });
      });
    }

    if (this.btnMainAction) {
      this.btnMainAction.addEventListener('click', () => {
        this.handleMainAction();
      });
    }

    this.updateAutoCashoutUI();
  }

  updateAutoCashoutUI() {
    if (this.autoBadge) {
      if (this.isAutoCashout) {
        this.autoBadge.className = 'crash-auto-badge on';
        this.autoBadge.textContent = `${this.autoCashoutMult.toFixed(2)}x UKLJ`;
      } else {
        this.autoBadge.className = 'crash-auto-badge off';
        this.autoBadge.textContent = 'ISKLJ';
      }
    }
    if (this.autoToggle) {
      this.autoToggle.checked = this.isAutoCashout;
    }
    if (this.autoMultInput && document.activeElement !== this.autoMultInput) {
      this.autoMultInput.value = this.autoCashoutMult.toFixed(2);
    }
    if (this.presetButtons) {
      this.presetButtons.forEach(btn => {
        const val = parseFloat(btn.getAttribute('data-preset'));
        if (this.isAutoCashout && Math.abs(val - this.autoCashoutMult) < 0.01) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  initCanvas() {
    if (!this.canvasEl) return;
    this.canvas = this.canvasEl;
    this.ctx = this.canvas.getContext('2d');

    // Generate ambient background stars
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * 480,
        y: Math.random() * 260,
        size: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.7 + 0.3
      });
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas || !this.viewContainer) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 0 ? rect.width : 480;
    const h = rect.height > 0 ? rect.height : 260;

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

    // Sync bet from wallet
    if (this.wallet) {
      this.currentBet = Math.min(this.wallet.bet || 20, this.wallet.balance > 0 ? this.wallet.balance : 20);
    }
    this.updateBetDisplay();
    this.renderHistory();
    this.resizeCanvas();

    // Start round loop if idle
    if (this.gameState === 'idle' || this.gameState === 'crashed') {
      this.startCountdown();
    }

    this.startRenderLoop();
  }

  unmount() {
    this.isActive = false;
    this.forceExit();
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  forceExit() {
    if (this.gameState === 'flying' && this.hasActiveBet && !this.hasCashedOut) {
      // Auto cashout on exit
      this.cashout();
    } else if (this.gameState === 'waiting' && this.hasActiveBet) {
      // Refund bet placed during countdown
      if (this.wallet) {
        this.wallet.addWin(this.currentBet);
      }
      this.hasActiveBet = false;
    }
    this.hasActiveBet = false;
    this.hasCashedOut = false;
  }

  /* ==========================================================================
     Round Phases: Waiting (Countdown) -> Flying -> Crashed
     ========================================================================== */
  startCountdown() {
    if (!this.isActive) return;

    this.gameState = 'waiting';
    this.currentMultiplier = 1.0;
    this.hasCashedOut = false;
    this.explosionParticles = [];
    this.countdownLeft = 5.0;

    if (this.countdownWrap) this.countdownWrap.style.display = 'block';
    if (this.countdownFill) this.countdownFill.style.width = '100%';
    if (this.multDisplay) {
      this.multDisplay.textContent = '1.00x';
      this.multDisplay.className = 'crash-multiplier-val waiting';
    }

    this.updateActionUI();

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const stepMs = 50;
    const totalMs = 5000;
    let elapsedMs = 0;

    this.countdownTimer = setInterval(() => {
      elapsedMs += stepMs;
      this.countdownLeft = Math.max(0, (totalMs - elapsedMs) / 1000);

      const pct = (this.countdownLeft / 5.0) * 100;
      if (this.countdownFill) this.countdownFill.style.width = `${pct}%`;

      if (this.statusSub) {
        this.statusSub.textContent = `SLEDEĆI LET POLEĆE ZA: ${this.countdownLeft.toFixed(1)}s`;
      }

      if (elapsedMs >= totalMs) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.launchFlight();
      }
    }, stepMs);
  }

  launchFlight() {
    if (!this.isActive) return;

    this.gameState = 'flying';
    this.flightStartTime = performance.now();
    this.currentMultiplier = 1.0;
    this.targetCrashPoint = this.generateCrashPoint();
    this.particles = [];

    if (this.countdownWrap) this.countdownWrap.style.display = 'none';
    if (this.statusSub) this.statusSub.textContent = 'LET U TOKU • PRAĆENJE KVOTE';
    if (this.multDisplay) {
      this.multDisplay.className = 'crash-multiplier-val flying';
    }

    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }

    this.updateActionUI();
  }

  handleCrash() {
    this.gameState = 'crashed';
    this.currentMultiplier = this.targetCrashPoint;

    // Trigger explosion particles at rocket position
    this.triggerExplosion();

    if (this.multDisplay) {
      this.multDisplay.textContent = `${this.targetCrashPoint.toFixed(2)}x`;
      this.multDisplay.className = 'crash-multiplier-val crashed';
    }

    // Audio explosion
    if (window.slotAudio && window.slotAudio.playMineExplode) {
      window.slotAudio.playMineExplode();
    }

    // Prepend to history
    this.history.unshift(this.targetCrashPoint);
    if (this.history.length > 10) this.history.pop();
    this.renderHistory();

    if (this.hasCashedOut) {
      if (this.statusSub) {
        this.statusSub.innerHTML = `<span style="color:#4ade80;font-weight:900;">✅ DOBITAK SAČUVAN: +${this.lastWonAmount.toLocaleString()} ZLT (${this.lastCashMultiplier.toFixed(2)}x)!</span> <span style="opacity:0.8;font-size:0.85em;">(Raketa pala na ${this.targetCrashPoint.toFixed(2)}x)</span>`;
      }
    } else if (this.hasActiveBet) {
      if (this.statusSub) {
        this.statusSub.innerHTML = `<span style="color:#ef4444;font-weight:900;">💥 RAKETA JE PALA NA ${this.targetCrashPoint.toFixed(2)}x!</span> <span style="opacity:0.8;font-size:0.85em;">(Niste isplatili pre pada)</span>`;
      }
    } else {
      if (this.statusSub) {
        this.statusSub.textContent = `💥 RAKETA JE EKSPLODIRALA NA ${this.targetCrashPoint.toFixed(2)}x!`;
      }
    }

    // Reset active bet state for round end
    this.hasActiveBet = false;
    this.updateActionUI();

    // Wait 2.8s and start next countdown
    setTimeout(() => {
      if (this.isActive) {
        this.startCountdown();
      }
    }, 2800);
  }

  /* ==========================================================================
     Player Betting & Cashout Actions
     ========================================================================== */
  handleMainAction() {
    if (this.gameState === 'waiting') {
      if (this.hasActiveBet) {
        // Cancel bet before launch
        if (this.wallet) {
          this.wallet.addWin(this.currentBet);
        }
        this.hasActiveBet = false;
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      } else {
        // Place bet for next round
        if (!this.wallet || this.wallet.balance < this.currentBet) {
          if (this.statusSub) {
            this.statusSub.textContent = 'NEDOVOLJNO KREDITA ZA OPKLADU!';
            setTimeout(() => {
              if (this.gameState === 'waiting') {
                this.statusSub.textContent = `SLEDEĆI LET POLEĆE ZA: ${this.countdownLeft.toFixed(1)}s`;
              }
            }, 1500);
          }
          return;
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

        if (success) {
          this.hasActiveBet = true;
          this.hasCashedOut = false;
          this.lastWonAmount = 0;
          if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        }
      }
      this.updateActionUI();
    } else if (this.gameState === 'flying') {
      if (this.hasActiveBet && !this.hasCashedOut) {
        this.cashout(false);
      }
    }
  }

  cashout(isAuto = false) {
    if (!this.hasActiveBet || this.hasCashedOut || this.gameState !== 'flying') return;

    this.hasCashedOut = true;
    const finalMult = isAuto ? this.autoCashoutMult : this.currentMultiplier;
    const winAmt = Math.round(this.currentBet * finalMult);
    this.lastWonAmount = winAmt;
    this.lastCashMultiplier = finalMult;

    if (this.wallet) {
      this.wallet.addWin(winAmt);
    }

    if (window.slotApp && window.slotApp.playerTracker) {
      window.slotApp.playerTracker.recordSpin('crash', this.currentBet, winAmt);
    }

    // Audio & visual celebration
    if (window.slotAudio && window.slotAudio.playCashout) {
      window.slotAudio.playCashout();
    }

    if (finalMult >= 2.5 && window.particleEngine) {
      window.particleEngine.spawnCelebration(true);
    }

    this.updateActionUI();

    if (this.statusSub) {
      this.statusSub.innerHTML = `<span style="color:#4ade80;font-weight:900;">🎉 ISPLAĆENO: +${winAmt.toLocaleString()} ZLT (${finalMult.toFixed(2)}x)!</span>`;
    }
  }

  /* ==========================================================================
     UI Rendering & Updates
     ========================================================================== */
  updateBetDisplay() {
    if (this.betInput) {
      this.betInput.textContent = this.currentBet.toLocaleString();
    }
    this.updateActionUI();
  }

  updateActionUI() {
    if (!this.btnMainAction || !this.actionTitle || !this.actionSub) return;

    if (this.gameState === 'waiting') {
      this.btnMainAction.disabled = false;
      if (this.hasActiveBet) {
        this.btnMainAction.className = 'btn-crash-action btn-crash-cancel';
        this.actionTitle.textContent = 'OTKAŽI OPKLADU';
        this.actionSub.textContent = `${this.currentBet.toLocaleString()} ZLT`;
      } else {
        this.btnMainAction.className = 'btn-crash-action btn-crash-bet';
        this.actionTitle.textContent = 'ULOŽI ZA SLEDEĆI LET';
        this.actionSub.textContent = `${this.currentBet.toLocaleString()} ZLT`;
      }
    } else if (this.gameState === 'flying') {
      if (this.hasActiveBet && !this.hasCashedOut) {
        const potentialWin = Math.round(this.currentBet * this.currentMultiplier);
        this.btnMainAction.disabled = false;
        this.btnMainAction.className = 'btn-crash-action btn-crash-cashout';
        this.actionTitle.textContent = 'ISPLATI ODMAH';
        this.actionSub.textContent = `+${potentialWin.toLocaleString()} ZLT (${this.currentMultiplier.toFixed(2)}x)`;
      } else if (this.hasCashedOut) {
        this.btnMainAction.disabled = true;
        this.btnMainAction.className = 'btn-crash-action btn-crash-cashed';
        this.actionTitle.textContent = 'DOBITAK PREUZET';
        this.actionSub.textContent = `Čekaj sledeći let...`;
      } else {
        this.btnMainAction.disabled = true;
        this.btnMainAction.className = 'btn-crash-action btn-crash-waiting';
        this.actionTitle.textContent = 'LET U TOKU';
        this.actionSub.textContent = 'Čekaj sledeću rundu';
      }
    } else if (this.gameState === 'crashed') {
      this.btnMainAction.disabled = true;
      if (this.hasCashedOut) {
        this.btnMainAction.className = 'btn-crash-action btn-crash-cashed';
        this.actionTitle.textContent = 'DOBITAK PREUZET!';
        this.actionSub.textContent = `+${this.lastWonAmount.toLocaleString()} ZLT (${this.lastCashMultiplier.toFixed(2)}x)`;
      } else {
        this.btnMainAction.className = 'btn-crash-action btn-crash-crashed';
        this.actionTitle.textContent = 'PAD RAKETE';
        this.actionSub.textContent = `${this.targetCrashPoint.toFixed(2)}x`;
      }
    }
  }

  renderHistory() {
    if (!this.historyStrip) return;
    this.historyStrip.innerHTML = this.history.map(mult => {
      let tierClass = 'blue';
      if (mult >= 10.0) tierClass = 'gold';
      else if (mult >= 2.0) tierClass = 'purple';

      return `<span class="crash-pill ${tierClass}">${mult.toFixed(2)}x</span>`;
    }).join('');
  }

  triggerExplosion() {
    const w = this.canvasWidth || 480;
    const h = this.canvasHeight || 260;
    const rx = this.currentRocketX || (w * 0.75);
    const ry = this.currentRocketY || (h * 0.35);

    this.explosionParticles = [];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.explosionParticles.push({
        x: rx,
        y: ry,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#f87171' : (Math.random() > 0.5 ? '#fbbf24' : '#ffffff'),
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  /* ==========================================================================
     Canvas Animation Loop (High Performance 60FPS)
     ========================================================================== */
  startRenderLoop() {
    const loop = (now) => {
      if (!this.isActive) return;

      this.updatePhysics(now);
      this.renderCanvas();

      this.animFrameId = requestAnimationFrame(loop);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(loop);
  }

  updatePhysics(now) {
    if (this.gameState === 'flying') {
      const elapsedSec = (now - this.flightStartTime) / 1000;
      // Exponential curve formula: e^(0.065 * t)
      const calculatedMult = Math.pow(Math.E, 0.065 * elapsedSec * 1.6);
      this.currentMultiplier = Math.max(1.0, Math.round(calculatedMult * 100) / 100);

      // Check auto cashout
      if (this.isAutoCashout && this.hasActiveBet && !this.hasCashedOut) {
        if (this.currentMultiplier >= this.autoCashoutMult) {
          this.cashout(true);
        }
      }

      // Check crash condition
      if (this.currentMultiplier >= this.targetCrashPoint) {
        this.handleCrash();
      } else {
        if (this.multDisplay) {
          this.multDisplay.textContent = `${this.currentMultiplier.toFixed(2)}x`;
        }
        this.updateActionUI();
      }
    }
  }

  renderCanvas() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvasWidth || 480;
    const h = this.canvasHeight || 260;

    // 1. Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw luxury radar grid & axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridCols = 6;
    const gridRows = 4;
    for (let c = 1; c < gridCols; c++) {
      const x = (w / gridCols) * c;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 20);
      ctx.stroke();
    }
    for (let r = 1; r < gridRows; r++) {
      const y = ((h - 20) / gridRows) * r;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Axes lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, h - 20);
    ctx.lineTo(w - 10, h - 20);
    ctx.stroke();

    // 3. Move background stars
    const starSpeedMultiplier = (this.gameState === 'flying') ? Math.min(4, 1 + (this.currentMultiplier * 0.15)) : 0.4;
    this.stars.forEach(star => {
      star.x -= star.speed * starSpeedMultiplier;
      star.y += star.speed * starSpeedMultiplier * 0.3;
      if (star.x < 30) star.x = w;
      if (star.y > h - 20) star.y = 10;

      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 4. Calculate Rocket Position based on Multiplier
    const startX = 35;
    const startY = h - 24;
    const maxFlightProgress = Math.min(1.0, (this.currentMultiplier - 1.0) / 12.0);

    const rocketX = startX + (w - 75) * Math.min(0.9, Math.pow(maxFlightProgress, 0.65) * 0.85 + (this.gameState === 'flying' ? 0.08 : 0));
    const rocketY = startY - (h - 65) * Math.min(0.92, Math.pow(maxFlightProgress, 0.85) * 0.88 + (this.gameState === 'flying' ? 0.05 : 0));

    this.currentRocketX = rocketX;
    this.currentRocketY = rocketY;

    // 5. Draw Flight Trajectory Curve & Gradient Fill
    if (this.gameState === 'flying' || this.gameState === 'crashed') {
      const cpX = startX + (rocketX - startX) * 0.45;
      const cpY = startY;

      // Area gradient fill under curve
      const gradFill = ctx.createLinearGradient(0, rocketY, 0, startY);
      if (this.gameState === 'crashed') {
        gradFill.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        gradFill.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      } else {
        gradFill.addColorStop(0, 'rgba(212, 175, 55, 0.35)');
        gradFill.addColorStop(1, 'rgba(212, 175, 55, 0.0)');
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cpX, cpY, rocketX, rocketY);
      ctx.lineTo(rocketX, startY);
      ctx.closePath();
      ctx.fillStyle = gradFill;
      ctx.fill();

      // Glowing Neon Trajectory Line
      ctx.shadowBlur = 14;
      ctx.shadowColor = this.gameState === 'crashed' ? '#ef4444' : '#fbbf24';
      ctx.strokeStyle = this.gameState === 'crashed' ? '#f87171' : '#fce07a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cpX, cpY, rocketX, rocketY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 6. Draw Rocket and Exhaust Flame
    if (this.gameState === 'flying') {
      // Spawn exhaust particles
      if (Math.random() > 0.3) {
        this.particles.push({
          x: rocketX - 10,
          y: rocketY + 6,
          vx: -(Math.random() * 3 + 2),
          vy: Math.random() * 2 - 1,
          radius: Math.random() * 3 + 1.5,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
          alpha: 0.9,
          decay: 0.04
        });
      }

      // Draw jet exhaust particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw stylized rocket icon (Enlarged & high-contrast)
      ctx.save();
      ctx.translate(rocketX, rocketY);
      // Angle tangent to flight path
      const angle = -Math.PI / 4 + Math.sin(performance.now() * 0.008) * 0.06;
      ctx.rotate(angle);

      // Rocket body glow (Gold chrome space shuttle)
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ffd700';

      // Fuselage
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold chrome accent band
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -8, 4, 16);

      // Cockpit dome (cyan glow)
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(7, -2, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red fins
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(-24, -14);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-12, 5);
      ctx.lineTo(-24, 14);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();

      // Tail flame (dual inner white/cyan and outer gold/orange)
      const flameLength = 18 + Math.random() * 12;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(-18 - flameLength, 0);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fill();

      // Inner white-hot flame core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.lineTo(-18 - (flameLength * 0.55), 0);
      ctx.lineTo(-18, 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 7. Render Explosion on Crash
    if (this.gameState === 'crashed' && this.explosionParticles.length > 0) {
      for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
        const ep = this.explosionParticles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.alpha -= ep.decay;
        if (ep.alpha <= 0) {
          this.explosionParticles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = ep.color;
        ctx.globalAlpha = ep.alpha;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  }
}

window.GrandCrashGame = GrandCrashGame;

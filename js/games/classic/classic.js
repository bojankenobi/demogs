/**
 * Classic 1-Line Slot Machine Engine
 * 3D Golden Cylinder with Mechanical Lever and single center payline.
 */
class ClassicSlotGame {
  constructor(wallet, jackpots, onSpinComplete) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    this.onSpinComplete = onSpinComplete;
    this.isSpinning = false;
    this.tileHeight = 72;
    this.restingY = -36; // Centered for 1-line

    this.assemblyWrap = document.querySelector('.slot-assembly-wrap');
    this.drumElements = [
      document.getElementById('reel-drum-1'),
      document.getElementById('reel-drum-2'),
      document.getElementById('reel-drum-3')
    ];
    this.viewport3 = document.getElementById('viewport-3');
    this.leverEl = document.getElementById('slot-lever');

    this.currentSymbols = [
      { top: CLASSIC_SYMBOLS[0], center: CLASSIC_SYMBOLS[6], bottom: CLASSIC_SYMBOLS[1] },
      { top: CLASSIC_SYMBOLS[2], center: CLASSIC_SYMBOLS[6], bottom: CLASSIC_SYMBOLS[3] },
      { top: CLASSIC_SYMBOLS[4], center: CLASSIC_SYMBOLS[6], bottom: CLASSIC_SYMBOLS[5] }
    ];
    this.spinTimeouts = [];
  }

  clearSpinTimeouts() {
    this.spinTimeouts.forEach(t => clearTimeout(t));
    this.spinTimeouts = [];
    this.drumElements.forEach(d => {
      if (d) d.classList.remove('mechanical-snap-bounce', 'spinning');
    });
  }

  mount() {
    this.clearSpinTimeouts();
    this.isSpinning = false;
    if (this.assemblyWrap) {
      this.assemblyWrap.classList.remove('game-mode-3x3', 'game-mode-fullfocus');
      this.assemblyWrap.classList.add('game-mode-classic');
    }
    const stageArea = document.querySelector('.stage-area');
    if (stageArea) {
      stageArea.classList.remove('has-3x3', 'has-fullfocus');
    }
    const stageScaler = document.querySelector('.slot-stage-scaler');
    if (stageScaler) {
      stageScaler.classList.remove('is-fullfocus');
    }
    this.initReels();
  }

  unmount() {
    this.clearSpinTimeouts();
    this.isSpinning = false;
    this.clearHighlights();
  }

  initReels() {
    for (let r = 0; r < 3; r++) {
      const drum = this.drumElements[r];
      if (!drum) continue;
      const s = this.currentSymbols[r];

      drum.innerHTML = `
        <div class="reel-tile" data-idx="0" data-row="top">
          <img src="${s.top.svg}" alt="${s.top.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="1" data-row="center">
          <img src="${s.center.svg}" alt="${s.center.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="2" data-row="bottom">
          <img src="${s.bottom.svg}" alt="${s.bottom.name}" class="symbol-img" />
        </div>
      `;
      drum.style.transition = 'none';
      drum.style.transform = `translateY(${this.restingY}px)`;
    }
  }

  clearHighlights() {
    document.querySelectorAll('.reel-tile').forEach(t => {
      t.classList.remove('win-center', 'win-line');
    });
    if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
  }

  getRandomSymbol() {
    const isAnte = (this.wallet && this.wallet.isGoldenBet);
    const totalWeight = CLASSIC_SYMBOLS.reduce((sum, s) => {
      const w = (isAnte && ['wheel', 'coin'].includes(s.id)) ? s.weight * 1.6 : s.weight;
      return sum + w;
    }, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of CLASSIC_SYMBOLS) {
      const w = (isAnte && ['wheel', 'coin'].includes(sym.id)) ? sym.weight * 1.6 : sym.weight;
      if (rand < w) return sym;
      rand -= w;
    }
    return CLASSIC_SYMBOLS[CLASSIC_SYMBOLS.length - 1];
  }

  spin() {
    if (this.isSpinning) {
      this.slamStop();
      return { success: true, isSlamStop: true };
    }
    if (!this.wallet.canAffordSpin()) {
      if (window.slotAudio) window.slotAudio.playClick();
      return { success: false, reason: 'NO_CREDITS' };
    }

    const spinTx = this.wallet.deductSpinBet();
    if (!spinTx) return { success: false, reason: 'NO_CREDITS' };

    this.isSpinning = true;
    this.clearHighlights();

    if (this.jackpots) {
      this.jackpots.incrementOnSpin(this.wallet.bet);
    }

    // Inform Free Spins Manager of spin deduction
    if (window.slotApp && window.slotApp.freeSpinsManager && window.slotApp.freeSpinsManager.isActive) {
      window.slotApp.freeSpinsManager.onSpinStart();
    }

    // Animate mechanical lever
    if (this.leverEl) {
      this.leverEl.classList.add('pulled');
      setTimeout(() => this.leverEl.classList.remove('pulled'), 400);
    }

    if (window.slotAudio) {
      window.slotAudio.playLever();
      window.slotAudio.startSpinningSound();
    }

    const mathMgr = window.slotApp?.mathManager;
    const profile = mathMgr ? mathMgr.getActiveProfile() : null;

    let targetMatrix;
    if (profile && profile.forceWin) {
      // Demo / Promo mode: Guaranteed win! Pick a high/mid symbol or scatter
      const demoSymPool = CLASSIC_SYMBOLS.filter(s => ['crown', 'seven', 'bar', 'bell', 'coin', 'wheel'].includes(s.id));
      const winSym = demoSymPool[Math.floor(Math.random() * demoSymPool.length)];
      targetMatrix = [
        { top: this.getRandomSymbol(), center: winSym, bottom: this.getRandomSymbol() },
        { top: this.getRandomSymbol(), center: winSym, bottom: this.getRandomSymbol() },
        { top: this.getRandomSymbol(), center: winSym, bottom: this.getRandomSymbol() }
      ];
    } else {
      targetMatrix = [
        { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() },
        { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() },
        { top: this.getRandomSymbol(), center: this.getRandomSymbol(), bottom: this.getRandomSymbol() }
      ];
    }
    this.currentTargetMatrix = targetMatrix;

    const r0Center = targetMatrix[0].center;
    const r1Center = targetMatrix[1].center;
    const isBigJackpotCombo = (r0Center.id === r1Center.id && ['flower', 'crown', 'seven', 'bar', 'wheel'].includes(r0Center.id));
    const isNearMiss = isBigJackpotCombo;

    const reel3Duration = isNearMiss ? 3.1 : 1.95;
    const durations = [1.05, 1.45, reel3Duration];
    const tileCounts = [22, 28, isNearMiss ? 48 : 34];

    this.clearSpinTimeouts();

    for (let r = 0; r < 3; r++) {
      const drum = this.drumElements[r];
      const res = targetMatrix[r];
      const count = tileCounts[r];

      const stripTiles = new Array(count);
      stripTiles[0] = res.top;
      stripTiles[1] = res.center;
      stripTiles[2] = res.bottom;

      for (let i = 3; i < count - 3; i++) {
        stripTiles[i] = this.getRandomSymbol();
      }

      stripTiles[count - 3] = this.currentSymbols[r].top;
      stripTiles[count - 2] = this.currentSymbols[r].center;
      stripTiles[count - 1] = this.currentSymbols[r].bottom;

      drum.innerHTML = stripTiles.map((sym, idx) => `
        <div class="reel-tile" data-idx="${idx}">
          <img src="${sym.svg}" alt="${sym.name}" class="symbol-img" />
        </div>
      `).join('');

      // Setup initial position & ensure no lingering bounce classes
      drum.classList.remove('mechanical-snap-bounce');
      const startY = this.restingY - (count - 3) * this.tileHeight;
      drum.style.transition = 'none';
      drum.style.transform = `translateY(${startY}px)`;
      void drum.offsetWidth;

      // Phase 1: Staggered mechanical wind-up / solenoid release
      const windupDelay = r * 30; // 0ms, 30ms, 60ms ripple
      const windupDuration = 110;
      const kickY = startY - 14;
      const dur = durations[r];
      const targetY = this.restingY;
      const overshootY = targetY + 18; // 18px downward overshoot onto stopper pawl

      const tWindup = setTimeout(() => {
        drum.style.transition = 'transform 0.11s cubic-bezier(0.2, 0.85, 0.35, 1.15)';
        drum.style.transform = `translateY(${kickY}px)`;
      }, windupDelay);
      this.spinTimeouts.push(tWindup);

      // Phase 2: High-speed linear spin with rapid mechanical deceleration
      const tLaunch = setTimeout(() => {
        drum.classList.add('spinning');

        if (r === 2 && isNearMiss) {
          if (this.viewport3) this.viewport3.classList.add('near-miss-active');
          try {
            if (window.slotAudio && window.slotAudio.playNearMissTension) {
              window.slotAudio.playNearMissTension();
            }
          } catch (e) {}
        }

        drum.style.transition = `transform ${dur}s cubic-bezier(0.42, 0, 0.12, 0.98)`;
        drum.style.transform = `translateY(${overshootY}px)`;

        // Phase 3: Mechanical ratchet stop impact & damped spring rebound
        const tStop = setTimeout(() => {
          drum.classList.remove('spinning');
          try {
            if (window.slotAudio) window.slotAudio.playReelStop(r);
          } catch (e) {}

          // Apply physical spring oscillation
          drum.style.transition = 'none';
          drum.style.setProperty('--stop-overshoot', `${overshootY}px`);
          drum.style.setProperty('--stop-rebound', `${targetY - 6}px`);
          drum.style.setProperty('--stop-micro', `${targetY + 2}px`);
          drum.style.setProperty('--stop-target', `${targetY}px`);
          drum.classList.add('mechanical-snap-bounce');
          drum.style.transform = `translateY(${targetY}px)`;

          // Phase 4: Settle & populate clean final resting tiles
          const tSettle = setTimeout(() => {
            drum.classList.remove('mechanical-snap-bounce');
            drum.innerHTML = `
              <div class="reel-tile" data-idx="0" data-row="top">
                <img src="${res.top.svg}" alt="${res.top.name}" class="symbol-img" />
              </div>
              <div class="reel-tile" data-idx="1" data-row="center">
                <img src="${res.center.svg}" alt="${res.center.name}" class="symbol-img" />
              </div>
              <div class="reel-tile" data-idx="2" data-row="bottom">
                <img src="${res.bottom.svg}" alt="${res.bottom.name}" class="symbol-img" />
              </div>
            `;
            drum.style.transition = 'none';
            drum.style.transform = `translateY(${this.restingY}px)`;
            this.currentSymbols[r] = res;
          }, 220);
          this.spinTimeouts.push(tSettle);

          if (r === 2) {
            if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
            try {
              if (window.slotAudio) window.slotAudio.stopSpinningSound();
            } catch (e) {}

            const tEval = setTimeout(() => {
              this.evaluateResults([targetMatrix[0].center, targetMatrix[1].center, targetMatrix[2].center], targetMatrix);
            }, 260);
            this.spinTimeouts.push(tEval);
          }
        }, dur * 1000);
        this.spinTimeouts.push(tStop);
      }, windupDelay + windupDuration);
      this.spinTimeouts.push(tLaunch);
    }

    const maxSpinTime = (Math.max(...durations) + 1.2) * 1000;
    const tMax = setTimeout(() => {
      try { if (window.slotAudio) window.slotAudio.stopSpinningSound(); } catch (e) {}
      if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
      if (this.isSpinning) {
        this.isSpinning = false;
        if (this.onSpinComplete) this.onSpinComplete(null);
      }
    }, maxSpinTime);
    this.spinTimeouts.push(tMax);

    return { success: true, isFree: spinTx.isFree };
  }

  slamStop() {
    if (!this.isSpinning || !this.currentTargetMatrix) return;
    this.clearSpinTimeouts();

    try {
      if (window.slotAudio) window.slotAudio.stopSpinningSound();
    } catch (e) {}

    const targetMatrix = this.currentTargetMatrix;
    for (let r = 0; r < 3; r++) {
      const drum = this.drumElements[r];
      const res = targetMatrix[r];
      const targetY = this.restingY;
      const overshootY = targetY + 18;

      drum.classList.remove('spinning');
      try {
        if (window.slotAudio) window.slotAudio.playReelStop(r);
      } catch (e) {}

      drum.style.transition = 'none';
      drum.style.setProperty('--stop-overshoot', `${overshootY}px`);
      drum.style.setProperty('--stop-rebound', `${targetY - 6}px`);
      drum.style.setProperty('--stop-micro', `${targetY + 2}px`);
      drum.style.setProperty('--stop-target', `${targetY}px`);
      drum.classList.add('mechanical-snap-bounce');
      drum.style.transform = `translateY(${targetY}px)`;

      drum.innerHTML = `
        <div class="reel-tile" data-idx="0" data-row="top">
          <img src="${res.top.svg}" alt="${res.top.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="1" data-row="center">
          <img src="${res.center.svg}" alt="${res.center.name}" class="symbol-img" />
        </div>
        <div class="reel-tile" data-idx="2" data-row="bottom">
          <img src="${res.bottom.svg}" alt="${res.bottom.name}" class="symbol-img" />
        </div>
      `;
      this.currentSymbols[r] = res;
    }

    if (this.viewport3) this.viewport3.classList.remove('near-miss-active');

    setTimeout(() => {
      this.drumElements.forEach(d => d.classList.remove('mechanical-snap-bounce'));
      this.evaluateResults([targetMatrix[0].center, targetMatrix[1].center, targetMatrix[2].center], targetMatrix);
    }, 220);
  }

  evaluateResults(centerSymbols, fullMatrix) {
    this.isSpinning = false;
    let winMultiplier = 0;
    let winAmount = 0;
    let winningReels = [];
    try {
      const mathMgr = window.slotApp?.mathManager;
      const profile = mathMgr ? mathMgr.getActiveProfile() : null;
      const allowTwo = profile ? profile.allowTwoSymbolPay : ['coin'];
      const p3Mult = profile ? profile.payout3Multiplier : 1.0;

      const [s1, s2, s3] = centerSymbols;
      if (s1 && s2 && s3) {
        if (s1.id === 'wheel' && s2.id === 'wheel' && s3.id === 'wheel') {
          // 3 WHEEL SCATTERS -> WHEEL OF FORTUNE BONUS!
          winMultiplier = Math.round(50 * p3Mult);
          winningReels = [0, 1, 2];
          setTimeout(() => {
            if (window.slotApp && window.slotApp.wheelBonus) {
              window.slotApp.wheelBonus.openModal();
            }
          }, 800);
        } else if (s1.id === 'wheel' && s2.id === 'wheel' && allowTwo.includes('wheel')) {
          // 2 WHEEL SCATTERS
          winMultiplier = 15;
          winningReels = [0, 1];
        } else if (s1.id === s2.id && s2.id === s3.id) {
          // 3 OF A KIND! (Full payline win)
          winMultiplier = Math.round(s1.payout3 * p3Mult);
          winningReels = [0, 1, 2];
        } else if (s1.id === s2.id && allowTwo.includes(s1.id)) {
          // Authentic Left-to-Right 2-symbol win ONLY if permitted by volatility profile!
          winMultiplier = s1.payout2;
          winningReels = [0, 1];
        }
      }

      // Check Free Spins active multiplier
      let freeSpinsMultiplier = 1;
      if (window.slotApp && window.slotApp.freeSpinsManager && window.slotApp.freeSpinsManager.isActive) {
        freeSpinsMultiplier = window.slotApp.freeSpinsManager.currentMultiplier;
      }

      if (winMultiplier > 0) {
        winAmount = Math.round(this.wallet.bet * winMultiplier * this.wallet.happyHourMultiplier * freeSpinsMultiplier);
        this.wallet.addWin(winAmount);

        winningReels.forEach(r => {
          const drum = this.drumElements[r];
          if (drum) {
            const centerTile = drum.querySelector('.reel-tile[data-row="center"]');
            if (centerTile) centerTile.classList.add('win-center');
          }
        });

        if (window.slotApp && window.slotApp.freeSpinsManager && window.slotApp.freeSpinsManager.isActive) {
          window.slotApp.freeSpinsManager.onSpinWin(winAmount);
        }

        // Big Win celebration trigger (>= 25x bet)
        if (winMultiplier * freeSpinsMultiplier >= 25 && window.slotApp && window.slotApp.bigWinCelebrator) {
          window.slotApp.bigWinCelebrator.trigger(winAmount);
        } else if (winMultiplier >= 30) {
          if (window.slotAudio) window.slotAudio.playJackpot();
          if (window.particleEngine) window.particleEngine.spawnCelebration(true);
        } else {
          if (window.slotAudio) window.slotAudio.playWin();
          if (window.particleEngine) window.particleEngine.spawnCelebration(false);
        }
      }

      // Check if Free Spins round is completed
      if (window.slotApp && window.slotApp.freeSpinsManager) {
        window.slotApp.freeSpinsManager.checkCompletion();
      }
    } catch (err) {
      console.error('Error in classic evaluateResults:', err);
    } finally {
      this.isSpinning = false;
      if (this.onSpinComplete) {
        this.onSpinComplete({
          game: 'classic',
          winAmount,
          winMultiplier,
          fullMatrix
        });
      }
    }
  }
}

window.ClassicSlotGame = ClassicSlotGame;

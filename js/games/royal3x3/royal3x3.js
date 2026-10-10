/**
 * Royal 3x3 Slot Game Engine
 * 3x3 Matrix, 5 Fixed Neon Paylines, Full Focus Mode, Diamond Free Spins and Hold & Win Hook.
 */
class Royal3x3Game {
  constructor(wallet, jackpots, onSpinComplete, onTriggerHoldWin) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    this.onSpinComplete = onSpinComplete;
    this.onTriggerHoldWin = onTriggerHoldWin;
    this.isSpinning = false;
    this.isFullFocus = false;
    this.tileHeight = 72;
    this.restingY = 7; // In 230px drum height: (230 - 216)/2 = 7px

    this.assemblyWrap = document.querySelector('.slot-assembly-wrap');
    this.drumElements = [
      document.getElementById('reel-drum-1'),
      document.getElementById('reel-drum-2'),
      document.getElementById('reel-drum-3')
    ];
    this.viewport3 = document.getElementById('viewport-3');
    this.paylinesOverlay = document.getElementById('paylines-overlay');
    this.leverEl = document.getElementById('slot-lever');

    this.currentSymbols = [
      { top: ROYAL_SYMBOLS[0], center: ROYAL_SYMBOLS[1], bottom: ROYAL_SYMBOLS[2] },
      { top: ROYAL_SYMBOLS[3], center: ROYAL_SYMBOLS[4], bottom: ROYAL_SYMBOLS[5] },
      { top: ROYAL_SYMBOLS[6], center: ROYAL_SYMBOLS[7], bottom: ROYAL_SYMBOLS[0] }
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

  mount(isFullFocus = false) {
    this.clearSpinTimeouts();
    this.isSpinning = false;
    this.isFullFocus = isFullFocus;
    if (this.assemblyWrap) {
      this.assemblyWrap.classList.remove('game-mode-classic');
      this.assemblyWrap.classList.toggle('game-mode-3x3', !isFullFocus);
      this.assemblyWrap.classList.toggle('game-mode-fullfocus', isFullFocus);
    }
    const stageArea = document.querySelector('.stage-area');
    if (stageArea) {
      stageArea.classList.toggle('has-3x3', !isFullFocus);
      stageArea.classList.toggle('has-fullfocus', isFullFocus);
    }
    const stageScaler = document.querySelector('.slot-stage-scaler');
    if (stageScaler) {
      stageScaler.classList.toggle('is-fullfocus', isFullFocus);
    }
    this.initReels();
  }

  unmount() {
    this.clearPaylines();
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

  clearPaylines() {
    if (this.paylinesOverlay) {
      this.paylinesOverlay.innerHTML = '';
    }
    document.querySelectorAll('.reel-tile').forEach(t => {
      t.classList.remove('win-line', 'win-center');
    });
    if (this.viewport3) this.viewport3.classList.remove('near-miss-active');
  }

  drawPaylines(winningLines) {
    if (!this.paylinesOverlay || !winningLines || winningLines.length === 0) return;

    const colX = [50, 152, 254];
    const rowY = [36, 108, 180];

    let svgHtml = '';
    winningLines.forEach((line) => {
      const p0 = `${colX[0]},${rowY[line.rows[0]]}`;
      const p1 = `${colX[1]},${rowY[line.rows[1]]}`;
      const p2 = `${colX[2]},${rowY[line.rows[2]]}`;
      svgHtml += `<polyline points="${p0} ${p1} ${p2}" class="payline-svg-path" />`;

      for (let r = 0; r < 3; r++) {
        const rowIdx = line.rows[r];
        const drum = this.drumElements[r];
        if (drum) {
          const tile = drum.querySelector(`.reel-tile[data-idx="${rowIdx}"]`);
          if (tile) tile.classList.add('win-line');
        }
      }
    });

    this.paylinesOverlay.innerHTML = svgHtml;
  }

  getRandomSymbol() {
    const isAnte = (this.wallet && this.wallet.isGoldenBet);
    const totalWeight = ROYAL_SYMBOLS.reduce((sum, s) => {
      const w = (isAnte && ['wheel', 'coin', 'diamond'].includes(s.id)) ? s.weight * 1.6 : s.weight;
      return sum + w;
    }, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of ROYAL_SYMBOLS) {
      const w = (isAnte && ['wheel', 'coin', 'diamond'].includes(sym.id)) ? sym.weight * 1.6 : sym.weight;
      if (rand < w) return sym;
      rand -= w;
    }
    return ROYAL_SYMBOLS[ROYAL_SYMBOLS.length - 1];
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
    this.clearPaylines();

    if (this.jackpots) {
      this.jackpots.incrementOnSpin(this.wallet.bet);
    }

    // Inform Free Spins Manager of spin deduction
    if (window.slotApp && window.slotApp.freeSpinsManager && window.slotApp.freeSpinsManager.isActive) {
      window.slotApp.freeSpinsManager.onSpinStart();
    }

    if (!this.isFullFocus && this.leverEl) {
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
      // Demo / Promo mode: Guaranteed 100% win! Create winning line on center row
      const demoSymPool = ROYAL_SYMBOLS.filter(s => ['crown', 'seven', 'bar', 'bell', 'coin', 'wheel'].includes(s.id));
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

    const coinCountFirstTwo = [targetMatrix[0].top, targetMatrix[0].center, targetMatrix[0].bottom,
                               targetMatrix[1].top, targetMatrix[1].center, targetMatrix[1].bottom].filter(s => s.id === 'coin').length;
    const r0Center = targetMatrix[0].center;
    const r1Center = targetMatrix[1].center;
    const isBigCombo = (r0Center.id === r1Center.id && ['flower', 'crown', 'seven', 'bar', 'wheel'].includes(r0Center.id));
    const isNearMiss = isBigCombo || (coinCountFirstTwo >= 2);

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

          // Phase 4: Settle & populate clean final resting tiles with 3D cylindrical row attributes
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
              // Check Hold & Win condition (3+ coins)
              let totalCoins = 0;
              for (let c = 0; c < 3; c++) {
                if (targetMatrix[c].top.id === 'coin') totalCoins++;
                if (targetMatrix[c].center.id === 'coin') totalCoins++;
                if (targetMatrix[c].bottom.id === 'coin') totalCoins++;
              }

              // Mini-Mines bonus is STRICTLY available only when the Emerald Mines bar is 100% full (active frenzy)!
              const isMinesUnlocked = (window.slotApp && window.slotApp.meters && window.slotApp.meters.isMinesUnlocked());
              
              if (isMinesUnlocked && totalCoins >= 2 && this.onTriggerHoldWin) {
                this.isSpinning = false;
                this.onTriggerHoldWin(targetMatrix);
              } else {
                this.evaluateResults3x3(targetMatrix);
              }
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
      this.evaluateResults3x3(targetMatrix);
    }, 220);
  }

  evaluateResults3x3(matrix) {
    this.isSpinning = false;
    let totalWinMultiplier = 0;
    const winningLines = [];
    let diamondCount = 0;
    let wheelCount = 0;
    let totalWin = 0;

    try {
      for (let r = 0; r < 3; r++) {
        ['top', 'center', 'bottom'].forEach(row => {
          if (matrix[r] && matrix[r][row]) {
            if (matrix[r][row].id === 'diamond') diamondCount++;
            if (matrix[r][row].id === 'wheel') wheelCount++;
          }
        });
      }

      const mathMgr = window.slotApp?.mathManager;
      const profile = mathMgr ? mathMgr.getActiveProfile() : null;
      const allowTwo = profile ? profile.allowTwoSymbolPay : ['coin'];
      const p3Mult = profile ? profile.payout3Multiplier : 1.0;

      ROYAL_PAYLINES.forEach(line => {
        const s0 = line.rows[0] === 0 ? matrix[0].top : (line.rows[0] === 1 ? matrix[0].center : matrix[0].bottom);
        const s1 = line.rows[1] === 0 ? matrix[1].top : (line.rows[1] === 1 ? matrix[1].center : matrix[1].bottom);
        const s2 = line.rows[2] === 0 ? matrix[2].top : (line.rows[2] === 1 ? matrix[2].center : matrix[2].bottom);

        let lineMult = 0;
        if (s0 && s1 && s2) {
          if (s0.id === s1.id && s1.id === s2.id) {
            lineMult = Math.round(s0.payout3 * p3Mult);
          } else if (s0.id === s1.id && allowTwo.includes(s0.id)) {
            lineMult = s0.payout2;
          }
        }

        if (lineMult > 0) {
          totalWinMultiplier += lineMult;
          winningLines.push(line);
        }
      });

      // Scatter Wheel Trigger (3+ Wheel symbols anywhere)
      if (wheelCount >= 3) {
        setTimeout(() => {
          if (window.slotApp && window.slotApp.wheelBonus) {
            window.slotApp.wheelBonus.openModal();
          }
        }, 900);
      }

      // Check Free Spins active multiplier & retrigger
      let freeSpinsMultiplier = 1;
      const isFreeSpinsActive = (window.slotApp && window.slotApp.freeSpinsManager && window.slotApp.freeSpinsManager.isActive);
      if (isFreeSpinsActive) {
        freeSpinsMultiplier = window.slotApp.freeSpinsManager.currentMultiplier;
        if (diamondCount >= 3 || wheelCount >= 2) {
          window.slotApp.freeSpinsManager.retrigger(5);
        }
      } else if (diamondCount >= 3) {
        // Trigger Free Spins from 3 Diamonds
        if (window.slotApp && window.slotApp.freeSpinsManager) {
          window.slotApp.freeSpinsManager.start(10, 2);
        } else {
          this.wallet.addFreeSpins(5);
        }
      }

      if (totalWinMultiplier > 0) {
        const lineBet = Math.max(1, Math.round(this.wallet.bet / 5));
        totalWin = Math.round(lineBet * totalWinMultiplier * this.wallet.happyHourMultiplier * freeSpinsMultiplier);
        this.wallet.addWin(totalWin);
        this.drawPaylines(winningLines);

        if (isFreeSpinsActive) {
          window.slotApp.freeSpinsManager.onSpinWin(totalWin);
        }

        // Big Win celebration trigger (>= 25x bet)
        if (totalWinMultiplier * freeSpinsMultiplier >= 25 && window.slotApp && window.slotApp.bigWinCelebrator) {
          window.slotApp.bigWinCelebrator.trigger(totalWin);
        } else if (totalWinMultiplier >= 30) {
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
      console.error('Error in evaluateResults3x3:', err);
    } finally {
      this.isSpinning = false;
      if (this.onSpinComplete) {
        this.onSpinComplete({
          game: this.isFullFocus ? 'fullfocus' : 'royal3x3',
          winAmount: totalWin,
          winMultiplier: totalWinMultiplier,
          winningLines,
          isDiamondBonus: diamondCount >= 3,
          fullMatrix: matrix
        });
      }
    }
  }
}

window.Royal3x3Game = Royal3x3Game;

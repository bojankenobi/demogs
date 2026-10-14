/**
 * IGT Xtension Link - Game Engine
 * 5 Reels x 3 Rows Base Game -> Expanding up to 5x8 in Xtension Link Bonus.
 * Unlock levels:
 *  - 4th Row: 8 Spheres
 *  - 5th & 6th Row: 12 Spheres
 *  - 7th & 8th Row: 16 Spheres
 * Total 40 positions. Full 40 tiles = GRAND JACKPOT!
 */
class GrandXtensionGame {
  constructor(wallet, jackpots, onSpinComplete) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    this.onSpinComplete = onSpinComplete;

    this.isSpinning = false;
    this.inBonusMode = false;
    this.bonusRespinsLeft = 3;
    this.bonusSpheresCount = 0;
    this.bonusMatrix = []; // 5 cols x 8 rows: null or { val, isMini, isMajor, isGrand }
    this.activeRows = 3; // 3, 4, 6, 8

    // Base symbols state: 5 cols x 3 rows
    this.baseSymbols = [
      [XTENSION_SYMBOLS[0], XTENSION_SYMBOLS[1], XTENSION_SYMBOLS[2]],
      [XTENSION_SYMBOLS[1], XTENSION_SYMBOLS[2], XTENSION_SYMBOLS[3]],
      [XTENSION_SYMBOLS[2], XTENSION_SYMBOLS[0], XTENSION_SYMBOLS[1]],
      [XTENSION_SYMBOLS[3], XTENSION_SYMBOLS[1], XTENSION_SYMBOLS[2]],
      [XTENSION_SYMBOLS[4], XTENSION_SYMBOLS[3], XTENSION_SYMBOLS[0]]
    ];

    // DOM References
    this.viewContainer = document.getElementById('xtension-game-view');
    this.reelsGrid = document.getElementById('xtension-reels-grid');
    this.bonusTopbar = document.getElementById('xtension-bonus-topbar');
    this.tierVeil = document.getElementById('xtension-upper-tier-veil');
    this.respinsCounter = document.getElementById('xtension-respins-val');
    this.spheresCounter = document.getElementById('xtension-spheres-val');
    this.bonusWinDisplay = document.getElementById('xtension-bonus-total-win');
    this.paylinesOverlay = document.getElementById('xtension-paylines-overlay');

    this.spinTimeouts = [];
    this.bonusRespinTimer = null;
    this.ensureDOMReferences();
    this.initDOM();
  }

  ensureDOMReferences() {
    this.viewContainer = document.getElementById('xtension-game-view');
    this.reelsGrid = document.getElementById('xtension-reels-grid');
    this.bonusTopbar = document.getElementById('xtension-bonus-topbar');
    this.tierVeil = document.getElementById('xtension-upper-tier-veil');
    this.respinsCounter = document.getElementById('xtension-respins-val');
    this.spheresCounter = document.getElementById('xtension-spheres-val');
    this.bonusWinDisplay = document.getElementById('xtension-bonus-total-win');
    this.paylinesOverlay = document.getElementById('xtension-paylines-overlay');
  }

  initDOM() {
    this.renderBaseReels();
  }

  mount() {
    this.ensureDOMReferences();
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    this.inBonusMode = false;
    this.isSpinning = false;
    this.activeRows = 3;
    if (this.tierVeil) {
      this.tierVeil.className = 'xtension-upper-tier-veil';
    }
    if (this.bonusTopbar) {
      this.bonusTopbar.style.display = 'none';
    }
    this.setSpinButtonBonusState(false);
    this.renderBaseReels();
  }

  unmount() {
    this.clearAllTimeouts();
    this.inBonusMode = false;
    this.isSpinning = false;
    this.setSpinButtonBonusState(false);
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
  }

  setSpinButtonBonusState(isActive) {
    const spinBtn = document.getElementById('spin-btn');
    const spinText = spinBtn ? spinBtn.querySelector('.spin-text-mini') : null;
    if (spinBtn) {
      if (isActive) {
        spinBtn.classList.add('xtension-bonus-active');
        if (spinText) spinText.textContent = `RESPIN (${this.bonusRespinsLeft})`;
      } else {
        spinBtn.classList.remove('xtension-bonus-active');
        if (spinText) spinText.textContent = 'SPIN';
      }
    }
  }

  clearAllTimeouts() {
    this.spinTimeouts.forEach(t => clearTimeout(t));
    this.spinTimeouts = [];
    if (this.bonusRespinTimer) {
      clearTimeout(this.bonusRespinTimer);
      this.bonusRespinTimer = null;
    }
    if (window.slotAudio && typeof window.slotAudio.stopSpinningSound === 'function') {
      window.slotAudio.stopSpinningSound();
    }
  }

  getRandomSymbol() {
    const totalWeight = XTENSION_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of XTENSION_SYMBOLS) {
      if (rand < sym.weight) return sym;
      rand -= sym.weight;
    }
    return XTENSION_SYMBOLS[XTENSION_SYMBOLS.length - 1];
  }

  getRandomSphereValue(bet) {
    const r = Math.random();
    if (r < 0.02) return { type: 'major', label: 'MAJOR', amount: Math.round(bet * 100) };
    if (r < 0.08) return { type: 'mini', label: 'MINI', amount: Math.round(bet * 25) };
    
    const multipliers = [1, 2, 3, 5, 8, 10, 15, 20];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    return { type: 'cash', label: `${Math.round(bet * mult)}`, amount: Math.round(bet * mult) };
  }

  renderBaseReels() {
    this.ensureDOMReferences();
    if (!this.reelsGrid) return;
    this.reelsGrid.innerHTML = '';

    // Render 5 columns, each containing 8 rows (top 5 rows 7..3, bottom 3 rows 2..0)
    for (let c = 0; c < 5; c++) {
      const colEl = document.createElement('div');
      colEl.className = 'xtension-reel-col';
      colEl.id = `xtension-col-${c}`;

      const drumEl = document.createElement('div');
      drumEl.className = 'xtension-drum';
      drumEl.id = `xtension-drum-${c}`;

      let tilesHTML = '';
      // Top 5 rows (rows 7 down to 3) - veiled in base mode
      for (let r = 7; r >= 3; r--) {
        const filler = XTENSION_SYMBOLS[(r + c) % (XTENSION_SYMBOLS.length - 1)];
        tilesHTML += `
          <div class="xtension-tile tile-upper-row" data-row="${r}">
            <img src="${filler.svg}" alt="${filler.name}" class="xt-sym-img" />
          </div>
        `;
      }
      // Bottom 3 active rows (rows 2 down to 0)
      for (let r = 2; r >= 0; r--) {
        const sym = this.baseSymbols[c][r];
        tilesHTML += `
          <div class="xtension-tile" data-row="${r}">
            <img src="${sym.svg}" alt="${sym.name}" class="xt-sym-img" />
            ${sym.isLink && sym.sphereData ? `<span class="xt-sphere-tag">${sym.sphereData.label}</span>` : ''}
          </div>
        `;
      }

      drumEl.innerHTML = tilesHTML;
      colEl.appendChild(drumEl);
      this.reelsGrid.appendChild(colEl);
    }
  }

  spin() {
    if (this.isSpinning) return { success: false };

    if (this.inBonusMode) {
      if (this.bonusRespinTimer) clearTimeout(this.bonusRespinTimer);
      this.stepBonusRespin();
      return { success: true };
    }

    if (!this.wallet.canAffordSpin()) {
      if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      return { success: false, reason: 'NO_CREDITS' };
    }

    const spinTx = this.wallet.deductSpinBet();
    if (!spinTx) return { success: false, reason: 'NO_CREDITS' };

    this.isSpinning = true;
    this.clearPaylines();

    if (window.slotAudio) {
      if (typeof window.slotAudio.playLever === 'function') window.slotAudio.playLever();
      if (typeof window.slotAudio.startSpinningSound === 'function') window.slotAudio.startSpinningSound();
    }

    // Generate targets: 5 columns x 3 rows
    const targetMatrix = [];
    let linkCount = 0;

    for (let c = 0; c < 5; c++) {
      const col = [];
      for (let r = 0; r < 3; r++) {
        let sym = this.getRandomSymbol();
        const isMinesFrenzy = (window.slotApp && window.slotApp.meters && window.slotApp.meters.isMinesUnlocked());
        if (isMinesFrenzy && Math.random() < 0.22) {
          sym = XTENSION_SYMBOLS.find(s => s.id === 'coin');
        }
        if (sym.isLink) {
          linkCount++;
          sym = { ...sym, sphereData: this.getRandomSphereValue(this.wallet.bet) };
        }
        col.push(sym);
      }
      targetMatrix.push(col);
    }

    // Staggered roll animations inside fixed 280px container
    // Fixed tile height: 34.5px (with gap: 2px, total step = 34.5px)
    const tileStep = 34.5;
    const stripTileCounts = [18, 21, 24, 27, 30];
    const durations = [0.75, 0.95, 1.15, 1.35, 1.55];

    for (let c = 0; c < 5; c++) {
      const drum = document.getElementById(`xtension-drum-${c}`);
      if (!drum) continue;

      const totalTiles = stripTileCounts[c];

      // Build strip: [target 8 tiles] -> [fillers] -> [current 8 tiles]
      const stripSymbols = [];
      // 1. Target top 5 upper rows (dimmed)
      for (let r = 7; r >= 3; r--) {
        stripSymbols.push(XTENSION_SYMBOLS[(r + c) % (XTENSION_SYMBOLS.length - 1)]);
      }
      // Target bottom 3 base rows
      stripSymbols.push(targetMatrix[c][2]);
      stripSymbols.push(targetMatrix[c][1]);
      stripSymbols.push(targetMatrix[c][0]);

      // 2. Random fillers
      for (let i = 8; i < totalTiles - 8; i++) {
        stripSymbols.push(this.getRandomSymbol());
      }

      // 3. Current 8 resting tiles
      for (let r = 7; r >= 3; r--) {
        stripSymbols.push(XTENSION_SYMBOLS[(r + c) % (XTENSION_SYMBOLS.length - 1)]);
      }
      stripSymbols.push(this.baseSymbols[c][2]);
      stripSymbols.push(this.baseSymbols[c][1]);
      stripSymbols.push(this.baseSymbols[c][0]);

      drum.innerHTML = stripSymbols.map((sym, idx) => `
        <div class="xtension-tile ${idx < 5 || (idx >= totalTiles - 8 && idx < totalTiles - 3) ? 'tile-upper-row' : ''}">
          <img src="${sym.svg}" alt="${sym.name}" class="xt-sym-img" />
          ${sym.isLink && sym.sphereData ? `<span class="xt-sphere-tag">${sym.sphereData.label}</span>` : ''}
        </div>
      `).join('');

      const startY = -(totalTiles - 8) * tileStep;
      drum.style.transition = 'none';
      drum.style.transform = `translate3d(0, ${startY}px, 0)`;
      void drum.offsetWidth;

      const dur = durations[c];
      const overshootY = 8;

      drum.classList.add('is-spinning');
      drum.style.transition = `transform ${dur}s cubic-bezier(0.12, 0.78, 0.28, 1.0)`;
      drum.style.transform = `translate3d(0, ${overshootY}px, 0)`;

      const tStop = setTimeout(() => {
        drum.classList.remove('is-spinning');
        drum.style.transition = 'transform 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.45)';
        drum.style.transform = 'translate3d(0, 0, 0)';

        if (window.slotAudio && typeof window.slotAudio.playReelStop === 'function') {
          window.slotAudio.playReelStop(c);
        }

        const tSettle = setTimeout(() => {
          this.baseSymbols[c] = targetMatrix[c];
          
          let restingHTML = '';
          for (let r = 7; r >= 3; r--) {
            const filler = XTENSION_SYMBOLS[(r + c) % (XTENSION_SYMBOLS.length - 1)];
            restingHTML += `
              <div class="xtension-tile tile-upper-row" data-row="${r}">
                <img src="${filler.svg}" alt="${filler.name}" class="xt-sym-img" />
              </div>
            `;
          }
          for (let r = 2; r >= 0; r--) {
            const sym = targetMatrix[c][r];
            restingHTML += `
              <div class="xtension-tile" data-row="${r}">
                <img src="${sym.svg}" alt="${sym.name}" class="xt-sym-img" />
                ${sym.isLink && sym.sphereData ? `<span class="xt-sphere-tag">${sym.sphereData.label}</span>` : ''}
              </div>
            `;
          }

          drum.innerHTML = restingHTML;
          drum.style.transition = 'none';
          drum.style.transform = 'translate3d(0, 0, 0)';
        }, 160);
        this.spinTimeouts.push(tSettle);

        if (c === 4) {
          if (window.slotAudio && typeof window.slotAudio.stopSpinningSound === 'function') {
            window.slotAudio.stopSpinningSound();
          }

          const tEnd = setTimeout(() => {
            this.isSpinning = false;
            if (linkCount >= 6) {
              this.triggerXtensionLinkBonus(targetMatrix);
            } else {
              this.evaluateBaseWins(targetMatrix);
            }
          }, 240);
          this.spinTimeouts.push(tEnd);
        }
      }, dur * 1000);
      this.spinTimeouts.push(tStop);
    }

    return { success: true };
  }

  clearPaylines() {
    if (this.paylinesOverlay) this.paylinesOverlay.innerHTML = '';
  }

  evaluateBaseWins(matrix) {
    let totalWin = 0;
    const winningLines = [];

    XTENSION_PAYLINES.forEach(line => {
      const symbolsOnLine = [
        matrix[0][line.rows[0]],
        matrix[1][line.rows[1]],
        matrix[2][line.rows[2]],
        matrix[3][line.rows[3]],
        matrix[4][line.rows[4]]
      ];

      const firstSym = symbolsOnLine[0];
      if (firstSym.isLink) return;

      const matchId = firstSym.id;
      let matchCount = 1;

      for (let i = 1; i < 5; i++) {
        const s = symbolsOnLine[i];
        if (s.id === matchId || s.isWild) {
          matchCount++;
        } else {
          break;
        }
      }

      if (matchCount >= 3) {
        const symDef = XTENSION_SYMBOLS.find(s => s.id === matchId);
        let mult = 0;
        if (matchCount === 5) mult = symDef.payout5 || 0;
        else if (matchCount === 4) mult = symDef.payout4 || 0;
        else if (matchCount === 3) mult = symDef.payout3 || 0;

        if (mult > 0) {
          const lineWin = Math.round((this.wallet.bet / 25) * mult);
          totalWin += lineWin;
          winningLines.push({ id: line.id, rows: line.rows, matchCount, win: lineWin });
        }
      }
    });

    if (totalWin > 0) {
      this.wallet.addWin(totalWin);
      if (window.slotAudio && window.slotAudio.playWin) window.slotAudio.playWin();
      if (window.particleEngine) window.particleEngine.spawnCelebration(totalWin >= this.wallet.bet * 10);
    }

    if (this.onSpinComplete) {
      this.onSpinComplete({
        winAmount: totalWin,
        winMultiplier: Math.round(totalWin / this.wallet.bet),
        winningLines
      });
    }
  }

  /* ============================================================
     AUTHENTIC HOLD & SPIN BONUS ENGINE
     Operates inside the fixed 5x8 matrix cabinet:
     - Reveals upper rows by lifting veil (.rows-4, .rows-6, .rows-8)
     - Spin button acts as RESPIN trigger with glowing aura
     - Auto-chains respins smoothly without screen jumps
     ============================================================ */
  triggerXtensionLinkBonus(baseMatrix) {
    this.inBonusMode = true;
    this.isSpinning = false;
    this.bonusRespinsLeft = 3;
    this.activeRows = 3; // Starts at 3 rows (5x3)
    this.bonusMatrix = Array.from({ length: 8 }, () => Array(5).fill(null));

    let initialSpheres = 0;
    // Map base 5x3 spheres into bottom 3 rows (rows 0, 1, 2)
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 3; r++) {
        const sym = baseMatrix[c][r];
        if (sym && sym.isLink && sym.sphereData) {
          this.bonusMatrix[r][c] = { ...sym.sphereData };
          initialSpheres++;
        }
      }
    }
    this.bonusSpheresCount = initialSpheres;

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.slotApp) {
      window.slotApp.showMessage('⚡ GRAND XTENSION LINK POKRENUT! PRITISNITE SPIN ZA RESPIN ⚡', 'jackpot');
    }

    this.showBonusUI();
    this.checkUnlockRows();

    // Auto-prompt initial respin after 1.8s if player doesn't click immediately
    if (this.bonusRespinTimer) clearTimeout(this.bonusRespinTimer);
    this.bonusRespinTimer = setTimeout(() => {
      if (this.inBonusMode && !this.isSpinning && this.bonusRespinsLeft > 0) {
        this.stepBonusRespin();
      }
    }, 1800);
  }

  checkUnlockRows() {
    let prevRows = this.activeRows;
    if (this.bonusSpheresCount >= 16) {
      this.activeRows = 8; // 5x8 fully open
    } else if (this.bonusSpheresCount >= 12) {
      this.activeRows = 6; // 5x6
    } else if (this.bonusSpheresCount >= 8) {
      this.activeRows = 4; // 5x4
    } else {
      this.activeRows = 3; // 5x3
    }

    // Update veil height to reveal unlocked rows smoothly
    if (this.tierVeil) {
      this.tierVeil.className = `xtension-upper-tier-veil rows-${this.activeRows}`;
    }

    if (this.activeRows > prevRows) {
      if (window.slotAudio && window.slotAudio.playWin) {
        window.slotAudio.playWin();
      }
      if (window.particleEngine) {
        window.particleEngine.spawnCelebration(false);
      }
      if (window.slotApp) {
        window.slotApp.showMessage(`🚀 REŠETKA PROŠIRENA NA 5x${this.activeRows}!`, 'jackpot');
      }
    }
  }

  showBonusUI() {
    this.ensureDOMReferences();
    if (this.bonusTopbar) {
      this.bonusTopbar.style.display = 'flex';
    }
    this.setSpinButtonBonusState(true);
    this.renderBonusBoard();
    this.updateBonusCounters();
  }

  hideBonusUI() {
    this.ensureDOMReferences();
    if (this.bonusRespinTimer) {
      clearTimeout(this.bonusRespinTimer);
      this.bonusRespinTimer = null;
    }
    if (this.bonusTopbar) {
      this.bonusTopbar.style.display = 'none';
    }
    if (this.tierVeil) {
      this.tierVeil.className = 'xtension-upper-tier-veil';
    }
    this.setSpinButtonBonusState(false);
    this.inBonusMode = false;
    this.isSpinning = false;
    this.renderBaseReels();
  }

  renderBonusBoard() {
    this.ensureDOMReferences();
    if (!this.reelsGrid) return;
    this.reelsGrid.innerHTML = '';

    // Render 5 columns with 8 rows inside the fixed matrix
    for (let c = 0; c < 5; c++) {
      const colEl = document.createElement('div');
      colEl.className = 'xtension-reel-col';
      colEl.id = `xtension-col-${c}`;

      const drumEl = document.createElement('div');
      drumEl.className = 'xtension-drum';
      drumEl.id = `xtension-drum-${c}`;

      let tilesHTML = '';
      for (let r = 7; r >= 0; r--) {
        const sphere = this.bonusMatrix[r][c];
        const isUnlocked = (r < this.activeRows);

        if (sphere) {
          tilesHTML += `
            <div class="xtension-tile has-sphere sphere-${sphere.type} ${isUnlocked ? 'tile-unlocked-tier' : 'tile-upper-row'}" id="xt-tile-${r}-${c}">
              <img src="assets/symbols/coin.svg" class="xt-sym-img pulse" alt="SPHERE" />
              <span class="xt-sphere-tag">${sphere.label}</span>
            </div>
          `;
        } else {
          tilesHTML += `
            <div class="xtension-tile ${isUnlocked ? 'tile-unlocked-tier empty-tile' : 'tile-upper-row'}" id="xt-tile-${r}-${c}">
            </div>
          `;
        }
      }

      drumEl.innerHTML = tilesHTML;
      colEl.appendChild(drumEl);
      this.reelsGrid.appendChild(colEl);
    }
  }

  updateBonusCounters() {
    this.ensureDOMReferences();
    if (this.respinsCounter) this.respinsCounter.textContent = this.bonusRespinsLeft;
    if (this.spheresCounter) this.spheresCounter.textContent = this.bonusSpheresCount;
    
    // Calculate total currently locked on board
    let totalWin = 0;
    for (let r = 0; r < this.activeRows; r++) {
      for (let c = 0; c < 5; c++) {
        const s = this.bonusMatrix[r][c];
        if (s && s.amount) totalWin += s.amount;
      }
    }
    if (this.bonusWinDisplay) this.bonusWinDisplay.textContent = totalWin.toLocaleString();

    this.setSpinButtonBonusState(this.inBonusMode);
  }

  stepBonusRespin() {
    if (!this.inBonusMode || this.bonusRespinsLeft <= 0 || this.isSpinning) return;

    if (this.bonusRespinTimer) {
      clearTimeout(this.bonusRespinTimer);
      this.bonusRespinTimer = null;
    }

    this.isSpinning = true;
    this.bonusRespinsLeft--;
    this.updateBonusCounters();

    if (window.slotAudio) {
      if (typeof window.slotAudio.playLever === 'function') window.slotAudio.playLever();
      if (typeof window.slotAudio.startSpinningSound === 'function') window.slotAudio.startSpinningSound();
    }

    // Flash empty tiles in unlocked tiers
    const emptyTiles = this.reelsGrid ? this.reelsGrid.querySelectorAll('.tile-unlocked-tier.empty-tile') : [];
    emptyTiles.forEach(t => t.classList.add('tile-spinning'));

    const tRespin = setTimeout(() => {
      if (window.slotAudio && typeof window.slotAudio.stopSpinningSound === 'function') {
        window.slotAudio.stopSpinningSound();
      }
      emptyTiles.forEach(t => t.classList.remove('tile-spinning'));
      let newSpheresLanded = 0;

      for (let r = 0; r < this.activeRows; r++) {
        for (let c = 0; c < 5; c++) {
          if (!this.bonusMatrix[r][c]) {
            // Chance to drop sphere on empty position
            if (Math.random() < 0.16) {
              const val = this.getRandomSphereValue(this.wallet.bet);
              this.bonusMatrix[r][c] = val;
              this.bonusSpheresCount++;
              newSpheresLanded++;
            }
          }
        }
      }

      if (newSpheresLanded > 0) {
        this.bonusRespinsLeft = 3; // Reset respins to 3!
        if (window.slotAudio && typeof window.slotAudio.playCoinDrop === 'function') {
          window.slotAudio.playCoinDrop();
        }
        this.checkUnlockRows();
      }

      this.renderBonusBoard();
      this.isSpinning = false;
      this.updateBonusCounters();

      // Check Grand Jackpot condition (all 40 filled)
      if (this.bonusSpheresCount >= 40) {
        this.finishBonus(true);
      } else if (this.bonusRespinsLeft <= 0) {
        this.finishBonus(false);
      } else {
        // Auto-progress next respin after 1.5s if player doesn't manually press SPIN
        if (this.bonusRespinTimer) clearTimeout(this.bonusRespinTimer);
        this.bonusRespinTimer = setTimeout(() => {
          if (this.inBonusMode && !this.isSpinning && this.bonusRespinsLeft > 0) {
            this.stepBonusRespin();
          }
        }, 1500);
      }
    }, 900);

    this.spinTimeouts.push(tRespin);
  }

  finishBonus(isGrandWin = false) {
    if (this.bonusRespinTimer) {
      clearTimeout(this.bonusRespinTimer);
      this.bonusRespinTimer = null;
    }
    this.isSpinning = false;
    let finalWin = 0;

    for (let r = 0; r < this.activeRows; r++) {
      for (let c = 0; c < 5; c++) {
        const s = this.bonusMatrix[r][c];
        if (s && s.amount) finalWin += s.amount;
      }
    }

    if (isGrandWin) {
      finalWin += this.jackpots ? this.jackpots.jackpotDiamond : 25000;
    }

    this.wallet.addWin(finalWin);

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.particleEngine) {
      window.particleEngine.spawnCelebration(true);
    }
    if (window.slotApp) {
      window.slotApp.showMessage(
        isGrandWin 
          ? `👑 GRAND JACKPOT OSVOJEN! +${finalWin.toLocaleString()} RSD!` 
          : `💰 XTENSION LINK ISPLATIO +${finalWin.toLocaleString()} RSD!`,
        'jackpot'
      );
      if (window.slotApp.gamble) {
        window.slotApp.gamble.showTrigger(finalWin);
      }
    }

    const tEnd = setTimeout(() => {
      this.hideBonusUI();
      if (this.onSpinComplete) {
        this.onSpinComplete({ winAmount: finalWin, winMultiplier: Math.round(finalWin / this.wallet.bet) });
      }
    }, 2800);
    this.spinTimeouts.push(tEnd);
  }
}

window.GrandXtensionGame = GrandXtensionGame;

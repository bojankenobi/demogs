/**
 * IGT - Mines X Game Engine (Standalone Mode)
 * Based on authentic EGT Digital / Spribe Mines mechanics:
 * Configurable grid (3x3 default, 5x5 option), selectable mine count,
 * progressive multiplier bar, interactive tile picking, Cashout feature.
 */

class MinesGame {
  constructor(wallet, jackpots) {
    this.wallet = wallet;
    this.jackpots = jackpots;
    
    this.gridSize = 3; // 3x3 default (9 tiles)
    this.totalTiles = 9;
    this.mineCount = 3; // 3 mines default
    this.currentBet = 20;
    this.gameState = 'idle'; // 'idle', 'playing', 'cashed_out', 'exploded'
    
    this.revealedCount = 0;
    this.currentMultiplier = 1.0;
    this.mineLocations = [];
    this.revealedTiles = [];

    // Proportional mine options and defaults per grid size
    // 3x3 (9 tiles): min 1, options [1, 2, 3, 4], default 2
    // 5x5 (25 tiles): min 3, options [3, 5, 8, 12, 15], default 5
    // 7x7 (49 tiles): min 5, options [5, 10, 15, 20, 25], default 10
    // 8x8 (64 tiles): min 8, options [8, 15, 20, 30, 40], default 15
    this.GRID_CONFIGS = {
      3: { minMines: 1, defaultMines: 2, options: [1, 2, 3, 4] },
      5: { minMines: 3, defaultMines: 5, options: [3, 5, 8, 12, 15] },
      7: { minMines: 5, defaultMines: 10, options: [5, 10, 15, 20, 25] },
      8: { minMines: 8, defaultMines: 15, options: [8, 15, 20, 30, 40] }
    };

    // DOM references
    this.viewContainer = document.getElementById('mines-game-view');
    this.gridContainer = document.getElementById('mines-grid');
    this.multipliersBar = document.getElementById('mines-multipliers-bar');
    this.betInput = document.getElementById('mines-bet-val');
    this.btnMinus = document.getElementById('mines-bet-minus');
    this.btnPlus = document.getElementById('mines-bet-plus');
    this.btnMainAction = document.getElementById('mines-action-btn');
    this.countSelectorEl = document.getElementById('mines-count-selector');
    this.gridSizeButtons = document.querySelectorAll('.mines-grid-size-btn');
    this.statusBanner = document.getElementById('mines-status-text');

    this.initEvents();
  }

  initEvents() {
    if (this.btnMinus) {
      this.btnMinus.addEventListener('click', () => {
        if (this.gameState === 'playing') return;
        this.currentBet = Math.max(5, this.currentBet - 5);
        this.wallet.bet = this.currentBet;
        this.wallet.updateUI();
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    if (this.btnPlus) {
      this.btnPlus.addEventListener('click', () => {
        if (this.gameState === 'playing') return;
        this.currentBet = Math.min(this.wallet.balance > 0 ? this.wallet.balance : this.currentBet + 5, this.currentBet + 5);
        this.wallet.bet = this.currentBet;
        this.wallet.updateUI();
        this.updateBetDisplay();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    }

    if (this.btnMainAction) {
      this.btnMainAction.addEventListener('click', () => {
        if (this.gameState === 'playing') {
          this.cashout();
        } else {
          this.startGame();
        }
      });
    }

    this.gridSizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.gameState === 'playing') return;
        const size = parseInt(btn.getAttribute('data-size'), 10);
        if (!isNaN(size) && this.GRID_CONFIGS[size]) {
          this.gridSize = size;
          this.totalTiles = size * size;
          this.gridSizeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const config = this.GRID_CONFIGS[size];
          this.mineCount = config.defaultMines;
          this.renderMineCountButtons();
          this.rebuildGrid();
          this.renderMultipliersBar();
          if (window.slotAudio) window.slotAudio.playClick();
        }
      });
    });

    this.renderMineCountButtons();
  }

  renderMineCountButtons() {
    if (!this.countSelectorEl) return;
    this.countSelectorEl.innerHTML = '';
    const config = this.GRID_CONFIGS[this.gridSize] || this.GRID_CONFIGS[3];

    config.options.forEach(count => {
      const btn = document.createElement('button');
      btn.className = `mines-count-btn ${count === this.mineCount ? 'active' : ''}`;
      btn.setAttribute('data-mines', count);
      btn.textContent = count;
      btn.addEventListener('click', () => {
        if (this.gameState === 'playing') return;
        this.mineCount = count;
        this.countSelectorEl.querySelectorAll('.mines-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderMultipliersBar();
        if (window.slotAudio) window.slotAudio.playClick();
      });
      this.countSelectorEl.appendChild(btn);
    });
  }

  mount() {
    if (this.viewContainer) {
      this.viewContainer.style.display = 'flex';
    }
    // Sync bet from wallet
    this.currentBet = Math.min(this.wallet.bet, this.wallet.balance > 0 ? this.wallet.balance : this.wallet.bet);
    this.updateBetDisplay();
    this.rebuildGrid();
    this.renderMultipliersBar();
    this.resetGameState();
  }

  unmount() {
    if (this.viewContainer) {
      this.viewContainer.style.display = 'none';
    }
  }

  updateBetDisplay() {
    if (this.betInput) {
      this.betInput.textContent = this.currentBet.toLocaleString();
    }
  }

  calculateMultiplier(step) {
    // Configurable fair crash curve with ~96.5% default RTP (house edge 0.035)
    // P(success up to step k) = Product_{i=0..k-1} (totalTiles - mineCount - i) / (totalTiles - i)
    const targetRtp = 1.0 - (this.houseEdge || 0.035);
    let prob = 1.0;
    const gems = this.totalTiles - this.mineCount;
    for (let i = 0; i < step; i++) {
      prob *= (gems - i) / (this.totalTiles - i);
    }
    if (prob <= 0) return 0;
    const mult = (targetRtp / prob);
    return Math.max(1.05, Math.round(mult * 100) / 100);
  }

  renderMultipliersBar() {
    if (!this.multipliersBar) return;
    this.multipliersBar.innerHTML = '';
    const gems = this.totalTiles - this.mineCount;
    const maxSteps = Math.min(gems, 7); // Show next steps
    for (let step = 1; step <= maxSteps; step++) {
      const mult = this.calculateMultiplier(step);
      const chip = document.createElement('div');
      chip.className = `mines-mult-chip ${step === this.revealedCount + 1 ? 'is-next' : ''} ${step <= this.revealedCount ? 'is-won' : ''}`;
      chip.innerHTML = `<span class="mult-step">${step}x</span><span class="mult-val">${mult.toFixed(2)}x</span>`;
      this.multipliersBar.appendChild(chip);
    }
  }

  rebuildGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    this.gridContainer.className = `mines-board-grid grid-${this.gridSize}x${this.gridSize}`;

    for (let i = 0; i < this.totalTiles; i++) {
      const tile = document.createElement('button');
      tile.className = 'mines-tile';
      tile.setAttribute('data-index', i);
      tile.innerHTML = `
        <div class="mines-tile-inner">
          <div class="mines-tile-front"><span class="mines-tile-dot"></span></div>
          <div class="mines-tile-back"></div>
        </div>
      `;
      tile.addEventListener('click', () => this.handleTileClick(i));
      this.gridContainer.appendChild(tile);
    }
  }

  resetGameState() {
    this.gameState = 'idle';
    this.revealedCount = 0;
    this.currentMultiplier = 1.0;
    this.revealedTiles = [];
    this.mineLocations = [];

    if (this.btnMainAction) {
      this.btnMainAction.className = 'btn-mines-action btn-mines-start';
      const label = window.i18n ? window.i18n.t('minesBetBtn') : 'BET';
      this.btnMainAction.innerHTML = `
        <span class="action-top">${label}</span>
        <span class="action-val">${this.currentBet} RSD</span>
      `;
      this.btnMainAction.disabled = false;
    }

    if (this.statusBanner) {
      this.statusBanner.textContent = window.i18n ? window.i18n.t('minesPickPrompt') : 'IZABERITE ULOG I POKRENITE IGRU';
      this.statusBanner.className = 'mines-status-text';
    }

    this.renderMultipliersBar();
  }

  startGame() {
    if (this.wallet.balance < this.currentBet) {
      if (window.slotApp) {
        window.slotApp.showMessage(window.i18n ? window.i18n.t('notEnoughCredits') : 'NEMATE DOVOLJNO KREDITA!', 'warning');
      }
      if (window.slotAudio) window.slotAudio.playClick();
      return;
    }

    this.wallet.balance -= this.currentBet;
    this.wallet.setLastWin(0);
    this.wallet.updateUI();

    this.gameState = 'playing';
    this.revealedCount = 0;
    this.currentMultiplier = 1.0;
    this.revealedTiles = [];

    // Place mines randomly
    const indices = Array.from({ length: this.totalTiles }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);
    this.mineLocations = indices.slice(0, this.mineCount);

    this.rebuildGrid();
    this.renderMultipliersBar();

    if (this.btnMainAction) {
      this.btnMainAction.className = 'btn-mines-action btn-mines-cashout is-disabled';
      const cashoutLabel = window.i18n ? window.i18n.t('minesCashoutBtn') : 'ISPLATA';
      this.btnMainAction.innerHTML = `
        <span class="action-top">${cashoutLabel}</span>
        <span class="action-val">0 RSD</span>
      `;
    }

    if (this.statusBanner) {
      this.statusBanner.textContent = window.i18n ? window.i18n.t('minesActivePrompt') : 'OTVORITE POLJA I IZBEGAVAJTE MINE!';
      this.statusBanner.className = 'mines-status-text active-game';
    }

    if (this.jackpots) {
      this.jackpots.incrementOnSpin(this.currentBet);
    }

    if (window.slotAudio) window.slotAudio.playClick();
  }

  handleTileClick(index) {
    if (this.gameState !== 'playing') return;
    if (this.revealedTiles.includes(index)) return;

    this.revealedTiles.push(index);
    const tileEl = this.gridContainer.querySelector(`.mines-tile[data-index="${index}"]`);
    if (!tileEl) return;

    const isMine = this.mineLocations.includes(index);

    if (isMine) {
      this.triggerExplosion(tileEl, index);
    } else {
      this.triggerGemReveal(tileEl, index);
    }
  }

  triggerGemReveal(tileEl, index) {
    this.revealedCount++;
    this.currentMultiplier = this.calculateMultiplier(this.revealedCount);
    const currentWin = Math.round(this.currentBet * this.currentMultiplier);

    tileEl.classList.add('revealed', 'gem');
    const backSide = tileEl.querySelector('.mines-tile-back');
    if (backSide) {
      backSide.innerHTML = `
        <img src="assets/symbols/diamond.svg" class="mines-symbol-img neon-glow" alt="Diamond" />
        <span class="tile-win-badge">+${currentWin}</span>
      `;
    }

    if (window.slotAudio) window.slotAudio.playGemReveal(this.revealedCount);

    // Update Action Button to active Cashout
    if (this.btnMainAction) {
      this.btnMainAction.classList.remove('is-disabled');
      const cashoutLabel = window.i18n ? window.i18n.t('minesCashoutBtn') : 'ISPLATA';
      this.btnMainAction.innerHTML = `
        <span class="action-top">${cashoutLabel} (${this.currentMultiplier.toFixed(2)}x)</span>
        <span class="action-val">${currentWin.toLocaleString()} RSD</span>
      `;
    }

    if (this.statusBanner) {
      const msg = window.i18n 
        ? window.i18n.t('minesHitStatus', { mult: `${this.currentMultiplier.toFixed(2)}x`, win: currentWin })
        : `POGODAK! MNOŽILAC: ${this.currentMultiplier.toFixed(2)}x (${currentWin} RSD)`;
      this.statusBanner.textContent = msg;
    }

    this.renderMultipliersBar();

    // Check if all gems uncovered
    if (this.revealedCount === (this.totalTiles - this.mineCount)) {
      this.cashout(true);
    }
  }

  triggerExplosion(tileEl, clickedIndex) {
    this.gameState = 'exploded';

    if (window.slotApp && window.slotApp.playerTracker) {
      window.slotApp.playerTracker.recordSpin('mines', this.currentBet, 0);
    }

    tileEl.classList.add('revealed', 'exploded');
    const backSide = tileEl.querySelector('.mines-tile-back');
    if (backSide) {
      backSide.innerHTML = `<img src="assets/symbols/bomb.svg" class="mines-symbol-img bomb-shake" alt="BOMB" />`;
    }

    if (window.slotAudio) window.slotAudio.playMineExplode();

    // Reveal all remaining mines and gems
    const tilesEls = this.gridContainer.querySelectorAll('.mines-tile');
    tilesEls.forEach((el, idx) => {
      if (idx !== clickedIndex && !this.revealedTiles.includes(idx)) {
        el.classList.add('disabled-preview');
        const b = el.querySelector('.mines-tile-back');
        if (this.mineLocations.includes(idx)) {
          el.classList.add('revealed', 'mine-revealed');
          if (b) b.innerHTML = `<img src="assets/symbols/bomb.svg" class="mines-symbol-img dim" alt="BOMB" />`;
        } else {
          el.classList.add('revealed', 'gem-dim');
          if (b) b.innerHTML = `<img src="assets/symbols/diamond.svg" class="mines-symbol-img dim" alt="GEM" />`;
        }
      }
    });

    if (this.statusBanner) {
      this.statusBanner.textContent = window.i18n ? window.i18n.t('minesExploded') : '💥 MINA! POKUŠAJTE PONOVO.';
      this.statusBanner.className = 'mines-status-text alert-danger';
    }

    if (this.btnMainAction) {
      this.btnMainAction.className = 'btn-mines-action btn-mines-start';
      const label = window.i18n ? window.i18n.t('minesNewGameBtn') : 'NOVA IGRA';
      this.btnMainAction.innerHTML = `
        <span class="action-top">${label}</span>
        <span class="action-val">${this.currentBet} RSD</span>
      `;
    }
  }

  cashout(allCleared = false) {
    if (this.gameState !== 'playing' || this.revealedCount === 0) return;

    this.gameState = 'cashed_out';
    const winAmount = Math.round(this.currentBet * this.currentMultiplier);
    this.wallet.addWin(winAmount);

    if (window.slotApp && window.slotApp.playerTracker) {
      window.slotApp.playerTracker.recordSpin('mines', this.currentBet, winAmount);
    }

    if (window.slotAudio) window.slotAudio.playCashout();
    if (window.particleEngine) window.particleEngine.spawnCelebration(allCleared);

    if (this.statusBanner) {
      this.statusBanner.textContent = allCleared 
        ? (window.i18n ? window.i18n.t('minesAllCleared', { win: winAmount.toLocaleString() }) : `👑 SVA POLJA OČIŠĆENA! OSVOJENO: ${winAmount} RSD!`)
        : (window.i18n ? window.i18n.t('minesCashedOut', { win: winAmount.toLocaleString(), mult: `${this.currentMultiplier.toFixed(2)}x` }) : `💰 ISPLAĆENO: ${winAmount.toLocaleString()} RSD (${this.currentMultiplier.toFixed(2)}x)`);
      this.statusBanner.className = 'mines-status-text win';
    }

    // Reveal rest safely
    const tilesEls = this.gridContainer.querySelectorAll('.mines-tile');
    tilesEls.forEach((el, idx) => {
      if (!this.revealedTiles.includes(idx)) {
        el.classList.add('disabled-preview');
        const b = el.querySelector('.mines-tile-back');
        if (this.mineLocations.includes(idx)) {
          el.classList.add('revealed', 'mine-revealed');
          if (b) b.innerHTML = `<img src="assets/symbols/bomb.svg" class="mines-symbol-img dim" alt="BOMB" />`;
        } else {
          el.classList.add('revealed', 'gem-dim');
          if (b) b.innerHTML = `<img src="assets/symbols/diamond.svg" class="mines-symbol-img dim" alt="GEM" />`;
        }
      }
    });

    if (this.btnMainAction) {
      this.btnMainAction.className = 'btn-mines-action btn-mines-start';
      const label = window.i18n ? window.i18n.t('minesNewGameBtn') : 'NOVA IGRA';
      this.btnMainAction.innerHTML = `
        <span class="action-top">${label}</span>
        <span class="action-val">${this.currentBet} RSD</span>
      `;
    }

    if (window.slotApp && window.slotApp.gamble) {
      window.slotApp.gamble.showTrigger(winAmount);
    }
  }

  onLanguageChanged() {
    if (this.gameState === 'idle') {
      if (this.statusBanner) {
        this.statusBanner.textContent = window.i18n ? window.i18n.t('minesPickPrompt') : 'IZABERITE ULOG I POKRENITE IGRU';
      }
      if (this.btnMainAction) {
        const label = window.i18n ? window.i18n.t('minesBetBtn') : 'BET';
        const actionTop = this.btnMainAction.querySelector('.action-top');
        if (actionTop) actionTop.textContent = label;
      }
    } else if (this.gameState === 'playing') {
      if (this.revealedCount === 0) {
        if (this.statusBanner) {
          this.statusBanner.textContent = window.i18n ? window.i18n.t('minesActivePrompt') : 'OTVORITE POLJA I IZBEGAVAJTE MINE!';
        }
        if (this.btnMainAction) {
          const cashoutLabel = window.i18n ? window.i18n.t('minesCashoutBtn') : 'ISPLATA';
          const actionTop = this.btnMainAction.querySelector('.action-top');
          if (actionTop) actionTop.textContent = cashoutLabel;
        }
      } else {
        const currentWin = Math.round(this.currentBet * this.currentMultiplier);
        if (this.statusBanner) {
          this.statusBanner.textContent = window.i18n 
            ? window.i18n.t('minesHitStatus', { mult: `${this.currentMultiplier.toFixed(2)}x`, win: currentWin })
            : `POGODAK! MNOŽILAC: ${this.currentMultiplier.toFixed(2)}x (${currentWin} RSD)`;
        }
        if (this.btnMainAction) {
          const cashoutLabel = window.i18n ? window.i18n.t('minesCashoutBtn') : 'ISPLATA';
          const actionTop = this.btnMainAction.querySelector('.action-top');
          if (actionTop) actionTop.textContent = `${cashoutLabel} (${this.currentMultiplier.toFixed(2)}x)`;
        }
      }
    } else if (this.gameState === 'exploded') {
      if (this.statusBanner) {
        this.statusBanner.textContent = window.i18n ? window.i18n.t('minesExploded') : '💥 MINA! POKUŠAJTE PONOVO.';
      }
      if (this.btnMainAction) {
        const label = window.i18n ? window.i18n.t('minesNewGameBtn') : 'NOVA IGRA';
        const actionTop = this.btnMainAction.querySelector('.action-top');
        if (actionTop) actionTop.textContent = label;
      }
    } else if (this.gameState === 'cashed_out') {
      const winAmount = Math.round(this.currentBet * this.currentMultiplier);
      if (this.statusBanner) {
        this.statusBanner.textContent = window.i18n 
          ? window.i18n.t('minesCashedOut', { win: winAmount.toLocaleString(), mult: `${this.currentMultiplier.toFixed(2)}x` })
          : `💰 ISPLAĆENO: ${winAmount.toLocaleString()} RSD (${this.currentMultiplier.toFixed(2)}x)`;
      }
      if (this.btnMainAction) {
        const label = window.i18n ? window.i18n.t('minesNewGameBtn') : 'NOVA IGRA';
        const actionTop = this.btnMainAction.querySelector('.action-top');
        if (actionTop) actionTop.textContent = label;
      }
    }
  }

  get isSpinning() {
    return this.gameState === 'playing';
  }
}

window.MinesGame = MinesGame;

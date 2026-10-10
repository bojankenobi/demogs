/**
 * IGT - Mini-Mines Slot Bonus Round
 * Replaces the long respin mode with an interactive, high-tension choice-driven bonus.
 * Triggered when 3+ Gold Coins land on the reels during slot spins.
 * Players uncover vault tiles to reveal Gold Coins, Diamonds and Multipliers,
 * avoiding the hidden skull mines, with an instant CASHOUT button!
 */

class MiniMinesBonus {
  constructor(wallet, onComplete) {
    this.wallet = wallet;
    this.onComplete = onComplete;
    this.isActive = false;
    this.bet = 20;
    this.totalWin = 0;
    this.revealedCount = 0;
    this.mineLocations = [];
    this.revealedTiles = [];
    this.tilesData = []; // { val, type: 'coin'|'diamond'|'mine', multiplier }

    // DOM references
    this.modal = document.getElementById('mini-mines-modal');
    this.grid = document.getElementById('mini-mines-grid');
    this.cashoutBtn = document.getElementById('mini-mines-cashout-btn');
    this.totalEl = document.getElementById('mini-mines-total-amount');
    this.statusText = document.getElementById('mini-mines-status-text');
    this.minesPips = document.getElementById('mini-mines-hazard-pips');

    this.initEvents();
  }

  initEvents() {
    if (this.cashoutBtn) {
      this.cashoutBtn.addEventListener('click', () => {
        if (!this.isActive || this.revealedCount === 0) return;
        this.finishBonus(false);
      });
    }
  }

  trigger(sourceMatrix, bet) {
    this.isActive = true;
    this.bet = bet || 20;
    this.totalWin = 0;
    this.revealedCount = 0;
    this.revealedTiles = [];
    this.mineLocations = [];
    this.tilesData = new Array(9).fill(null);

    // Pick 2 random mine positions out of the 9 tiles
    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    this.mineLocations = allIndices.slice(0, 2); // 2 mines, 7 safe gems/coins

    // Initial starter bonus from triggering coins on slot reels
    let starterCoins = 0;
    if (sourceMatrix) {
      for (let r = 0; r < 3; r++) {
        ['top', 'center', 'bottom'].forEach(row => {
          if (sourceMatrix[r] && sourceMatrix[r][row] && sourceMatrix[r][row].id === 'coin') {
            starterCoins++;
          }
        });
      }
    }
    // Base starter prize from triggering symbols (e.g. 3 coins = 3x bet guaranteed start)
    const starterPrize = this.bet * Math.max(2, starterCoins);
    this.totalWin = starterPrize;

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.particleEngine) {
      window.particleEngine.spawnCelebration(true);
    }

    this.renderInitialGrid();
    this.updateUI();

    if (this.statusText) {
      this.statusText.textContent = window.i18n ? window.i18n.t('miniMinesStart', { starter: starterPrize }) : `OSVOJENO ZA START: +${starterPrize} RSD! OTVARAJTE POLJA ILI UZMITE DOBITAK!`;
      this.statusText.className = 'mini-mines-status-tag highlight';
    }

    if (this.cashoutBtn) {
      this.cashoutBtn.disabled = false;
      this.cashoutBtn.innerHTML = `
        <span class="btn-cashout-icon">💰</span>
        <span class="btn-cashout-label">UZMI DOBITAK (TAKE WIN)</span>
        <span class="btn-cashout-val">${this.totalWin.toLocaleString()} RSD</span>
      `;
    }

    if (this.modal) {
      this.modal.classList.add('active');
    }
  }

  renderInitialGrid() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const tile = document.createElement('button');
      tile.className = 'mini-mines-tile';
      tile.setAttribute('data-idx', i);
      tile.setAttribute('type', 'button');
      const pickLabel = window.i18n ? window.i18n.t('miniPickLabel') : 'OTVORI';
      tile.innerHTML = `
        <div class="tile-flipper">
          <div class="tile-front">
            <span class="tile-crystal-icon">💎</span>
            <span class="tile-pick-label">${pickLabel}</span>
          </div>
          <div class="tile-back"></div>
        </div>
      `;
      tile.addEventListener('click', () => this.handleTilePick(i, tile));
      this.grid.appendChild(tile);
    }
  }

  handleTilePick(idx, tileEl) {
    if (!this.isActive) return;
    if (this.revealedTiles.includes(idx)) return;

    this.revealedTiles.push(idx);
    const isMine = this.mineLocations.includes(idx);

    if (isMine) {
      this.triggerMineHit(idx, tileEl);
    } else {
      this.triggerGemSuccess(idx, tileEl);
    }
  }

  triggerGemSuccess(idx, tileEl) {
    this.revealedCount++;
    // Multipliers scale: +2x, +3x, +5x, +8x, +15x, +25x, +50x bet
    const multipliers = [2, 3, 5, 8, 12, 20, 50];
    const pickMultiplier = multipliers[Math.min(this.revealedCount - 1, multipliers.length - 1)];
    const tileWin = Math.round(this.bet * pickMultiplier);
    this.totalWin += tileWin;

    const symSvg = 'assets/symbols/coin.svg';
    const symName = window.i18n ? window.i18n.t('minesGoldCoin') : 'ZLATNIK';

    tileEl.classList.add('revealed', 'safe-gem');
    // Replace whole tile contents cleanly to prevent any overlap with front label/diamond
    tileEl.innerHTML = `
      <div class="tile-win-reveal">
        <img src="${symSvg}" class="mini-sym-img pulse" alt="${symName}" />
        <span class="tile-win-badge">+${tileWin.toLocaleString()}</span>
      </div>
    `;

    if (window.slotAudio && window.slotAudio.playGemReveal) {
      window.slotAudio.playGemReveal(this.revealedCount);
    }

    this.updateUI();

    if (this.statusText) {
      this.statusText.textContent = window.i18n 
        ? window.i18n.t('miniHitStatus', { win: tileWin, mult: pickMultiplier })
        : `POGODAK! +${tileWin} RSD (${pickMultiplier}x)`;
      this.statusText.className = 'mini-mines-status-tag success';
    }

    if (this.cashoutBtn) {
      this.cashoutBtn.disabled = false;
      const cashoutLabel = window.i18n ? window.i18n.t('miniMinesCashoutLabel') : 'UZMI DOBITAK (TAKE WIN)';
      this.cashoutBtn.innerHTML = `
        <span class="btn-cashout-icon">💰</span>
        <span class="btn-cashout-label">${cashoutLabel}</span>
        <span class="btn-cashout-val">${this.totalWin.toLocaleString()} RSD</span>
      `;
    }

    // If player found all 7 safe gems! Max Win!
    if (this.revealedCount === 7) {
      if (this.statusText) {
        this.statusText.textContent = window.i18n ? window.i18n.t('miniMinesAvoided') : '👑 SVE MINE IZBEGNUTE! MAKSIMALAN BONUS!';
      }
      setTimeout(() => this.finishBonus(true), 900);
    }
  }

  triggerMineHit(idx, tileEl) {
    if (typeof idx === 'object' && idx !== null && idx.nodeType) {
      const temp = tileEl;
      tileEl = idx;
      idx = typeof temp === 'number' ? temp : 0;
    }
    if (!tileEl && this.grid) {
      tileEl = this.grid.querySelector(`.mini-mines-tile[data-index="${idx}"]`) || this.grid.querySelector('.mini-mines-tile');
    }
    if (tileEl) {
      tileEl.classList.add('revealed', 'exploded-mine');
      const bombName = window.i18n ? window.i18n.t('minesBomb') : 'MINA';
      tileEl.innerHTML = `
        <div class="tile-win-reveal">
          <img src="assets/symbols/bomb.svg" class="mini-sym-img bomb-shake" alt="${bombName}" />
          <span class="tile-mine-badge">BOOM!</span>
        </div>
      `;
    }

    if (window.slotAudio && window.slotAudio.playMineExplode) {
      window.slotAudio.playMineExplode();
    }

    if (this.statusText) {
      this.statusText.textContent = window.i18n ? window.i18n.t('miniMinesHitStatus') : '💥 MINA! BONUS ZAVRŠEN!';
      this.statusText.className = 'mini-mines-status-tag danger';
    }

    if (this.cashoutBtn) {
      this.cashoutBtn.disabled = true;
    }

    // Reveal the second mine and remaining tiles
    if (this.grid) {
      const allTiles = this.grid.querySelectorAll('.mini-mines-tile');
      allTiles.forEach((el, i) => {
        if (!this.revealedTiles.includes(i)) {
          el.classList.add('revealed', 'dimmed-preview');
          if (this.mineLocations.includes(i)) {
            el.classList.add('exploded-mine');
            el.innerHTML = `
              <div class="tile-win-reveal">
                <img src="assets/symbols/bomb.svg" class="mini-sym-img dim" alt="BOMB" />
              </div>
            `;
          } else {
            el.classList.add('safe-gem');
            el.innerHTML = `
              <div class="tile-win-reveal">
                <img src="assets/symbols/coin.svg" class="mini-sym-img dim" alt="ZLATNIK" />
              </div>
            `;
          }
        }
      });
    }

    // Authentic Casino Rule: hitting a mine wipes out all accumulated bonus winnings (0 RSD)!
    this.totalWin = 0;
    this.updateUI();

    if (this.statusText) {
      this.statusText.textContent = window.i18n 
        ? window.i18n.t('miniMinesWipedOut')
        : '💥 MINA EKSPLODIRALA! IZGUBLJEN SAV DOBITAK (0 RSD)!';
      this.statusText.classList.add('alert-danger');
    }

    if (this.cashoutBtn) {
      this.cashoutBtn.disabled = true;
      this.cashoutBtn.classList.add('is-disabled');
    }

    setTimeout(() => {
      this.finishBonus(false);
    }, 1800);
  }

  updateUI() {
    if (this.totalEl) {
      this.totalEl.textContent = this.totalWin.toLocaleString();
    }
  }

  finishBonus(allSafeCleared = false) {
    this.isActive = false;

    if (this.totalWin > 0) {
      this.wallet.addWin(this.totalWin);
      if (window.slotAudio && window.slotAudio.playCashout) {
        window.slotAudio.playCashout();
      }
      if (window.particleEngine) {
        window.particleEngine.spawnCelebration(allSafeCleared);
      }
    } else {
      if (window.slotAudio && window.slotAudio.playMineExplode) {
        window.slotAudio.playMineExplode();
      }
    }

    setTimeout(() => {
      if (this.modal) {
        this.modal.classList.remove('active');
      }
      if (this.onComplete) {
        this.onComplete(this.totalWin);
      }
    }, 800);
  }

  onLanguageChanged() {
    if (this.cashoutBtn) {
      const labelEl = this.cashoutBtn.querySelector('.btn-cashout-label');
      if (labelEl) {
        labelEl.textContent = window.i18n ? window.i18n.t('miniMinesCashoutLabel') : 'UZMI DOBITAK (TAKE WIN)';
      }
    }
    if (this.grid) {
      const pickLabel = window.i18n ? window.i18n.t('miniPickLabel') : 'OTVORI';
      this.grid.querySelectorAll('.tile-pick-label').forEach(el => {
        el.textContent = pickLabel;
      });
    }
  }
}

window.MiniMinesBonus = MiniMinesBonus;

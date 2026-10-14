/**
 * Core Platform - Bonus Rush Meters Engine
 * Tracks progress for Diamond Cards (Gamble) and Emerald Mines bonuses.
 * Higher bets charge meters faster.
 * Once full (100%), unlocks a timed frenzied window (40s - 50s depending on bet).
 * When both are active simultaneously: DOUBLE BONUS RUSH!
 */
class BonusMeters {
  constructor(wallet) {
    this.wallet = wallet;

    // Progress percentage (0 - 100)
    this.cardsProgress = 0;
    this.minesProgress = 0;

    // Active state & remaining seconds
    this.cardsActive = false;
    this.cardsTimeLeft = 0;
    this.cardsMaxDuration = 40;

    this.minesActive = false;
    this.minesTimeLeft = 0;
    this.minesMaxDuration = 40;

    // Timer loop reference
    this.timerInterval = null;

    // DOM Elements
    this.cardsFillEl = document.getElementById('meter-cards-fill');
    this.cardsValEl = document.getElementById('meter-cards-val');
    this.cardsMeterPod = document.getElementById('meter-pod-cards');

    this.minesFillEl = document.getElementById('meter-mines-fill');
    this.minesValEl = document.getElementById('meter-mines-val');
    this.minesMeterPod = document.getElementById('meter-pod-mines');

    this.syncTimer();
    this.render();
  }

  /**
   * Called on every slot spin with current bet.
   * Bet 5:  ~25 spins to fill (4% per spin)
   * Bet 20: ~14 spins to fill (7% per spin)
   * Bet 50: ~7 spins to fill (14% per spin)
   * Bet 100: ~4 spins to fill (25% per spin)
   */
  chargeOnSpin(bet) {
    const denom = (this.wallet && this.wallet.activeDenom) ? this.wallet.activeDenom : 1;
    const anteMultiplier = (this.wallet && this.wallet.isGoldenBet) ? 2.0 : 1.0;
    const betRsd = Math.max(1, (bet || 20) * denom * anteMultiplier);

    const mathMgr = window.slotApp?.mathManager || window.slotMathManager;
    const profile = mathMgr ? mathMgr.getActiveProfile() : null;
    const req = profile?.meterTurnoverRequired || { cards: 450, mines: 600, wheel: 850 };

    // Charge cards meter if not currently active
    if (!this.cardsActive) {
      const cardsIncrement = Math.max(0.5, +((betRsd / req.cards) * 100).toFixed(1));
      this.cardsProgress = Math.min(100, +(this.cardsProgress + cardsIncrement).toFixed(1));
      if (this.cardsProgress >= 100) {
        this.activateCardsBonus(bet);
      }
    }

    // Charge mines meter if not currently active
    if (!this.minesActive) {
      const minesIncrement = Math.max(0.5, +((betRsd / req.mines) * 100).toFixed(1));
      this.minesProgress = Math.min(100, +(this.minesProgress + minesIncrement).toFixed(1));
      if (this.minesProgress >= 100) {
        this.activateMinesBonus(bet);
      }
    }

    this.render();
  }

  /**
   * Calculates duration based on bet:
   * Min bet (5): 40 seconds
   * Max bet (100): 50 seconds
   */
  calculateDuration(bet) {
    const minB = 5;
    const maxB = 100;
    const ratio = Math.max(0, Math.min(1, (bet - minB) / (maxB - minB)));
    return Math.round(40 + ratio * 10); // 40 to 50s
  }

  activateCardsBonus(bet) {
    this.cardsActive = true;
    this.cardsProgress = 100;
    this.cardsMaxDuration = this.calculateDuration(bet);
    this.cardsTimeLeft = this.cardsMaxDuration;

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.particleEngine) {
      window.particleEngine.spawnCelebration(false);
    }
    if (window.slotApp) {
      window.slotApp.showMessage(
        window.i18n ? window.i18n.t('cardsBonusActivated', { sec: this.cardsTimeLeft }) : `💎 DUPLANJE OTKLJUČANO! (${this.cardsTimeLeft}s)`,
        'jackpot'
      );
    }

    // Make gamble button glow immediately
    const gambleBtn = document.getElementById('gamble-btn');
    if (gambleBtn) {
      gambleBtn.classList.remove('is-dimmed');
      gambleBtn.classList.add('gamble-highlight-pulse', 'frenzy-unlocked');
    }
  }

  activateMinesBonus(bet) {
    this.minesActive = true;
    this.minesProgress = 100;
    this.minesMaxDuration = this.calculateDuration(bet);
    this.minesTimeLeft = this.minesMaxDuration;

    if (window.slotAudio && window.slotAudio.playJackpot) {
      window.slotAudio.playJackpot();
    }
    if (window.particleEngine) {
      window.particleEngine.spawnCelebration(false);
    }
    if (window.slotApp) {
      window.slotApp.showMessage(
        window.i18n ? window.i18n.t('minesBonusActivated', { sec: this.minesTimeLeft }) : `❇️ GRAND MINES OTKLJUČAN! (${this.minesTimeLeft}s)`,
        'jackpot'
      );
    }
  }

  syncTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      let changed = false;

      if (this.cardsActive) {
        this.cardsTimeLeft--;
        this.cardsProgress = Math.max(0, (this.cardsTimeLeft / this.cardsMaxDuration) * 100);
        changed = true;
        if (this.cardsTimeLeft <= 0) {
          this.cardsActive = false;
          this.cardsProgress = 0;
          const gambleBtn = document.getElementById('gamble-btn');
          if (gambleBtn) {
            gambleBtn.classList.remove('frenzy-unlocked');
            if (this.wallet.lastWin <= 0) {
              gambleBtn.classList.add('is-dimmed');
              gambleBtn.classList.remove('gamble-highlight-pulse');
            }
          }
        }
      }

      if (this.minesActive) {
        this.minesTimeLeft--;
        this.minesProgress = Math.max(0, (this.minesTimeLeft / this.minesMaxDuration) * 100);
        changed = true;
        if (this.minesTimeLeft <= 0) {
          this.minesActive = false;
          this.minesProgress = 0;
        }
      }

      if (changed) {
        this.render();
      }
    }, 1000);
  }

  isCardsUnlocked() {
    return this.cardsActive;
  }

  isMinesUnlocked() {
    return this.minesActive;
  }

  render() {
    // 1. Cards meter render
    if (this.cardsFillEl) {
      this.cardsFillEl.style.width = `${Math.min(100, Math.max(0, this.cardsProgress))}%`;
    }
    if (this.cardsValEl) {
      this.cardsValEl.textContent = this.cardsActive 
        ? `${this.cardsTimeLeft}s` 
        : `${Math.round(this.cardsProgress)}%`;
    }
    if (this.cardsMeterPod) {
      this.cardsMeterPod.classList.toggle('is-frenzy-active', this.cardsActive);
    }

    // 2. Mines meter render
    if (this.minesFillEl) {
      this.minesFillEl.style.width = `${Math.min(100, Math.max(0, this.minesProgress))}%`;
    }
    if (this.minesValEl) {
      this.minesValEl.textContent = this.minesActive 
        ? `${this.minesTimeLeft}s` 
        : `${Math.round(this.minesProgress)}%`;
    }
    if (this.minesMeterPod) {
      this.minesMeterPod.classList.toggle('is-frenzy-active', this.minesActive);
    }

    // 3. Double Rush detection
    const metersContainer = document.getElementById('bonus-meters-bar');
    if (metersContainer) {
      const isDouble = (this.cardsActive && this.minesActive);
      metersContainer.classList.toggle('double-frenzy', isDouble);
    }

    // 4. Strictly synchronize Gamble Button: ONLY active when cardsActive is true
    const gambleBtn = document.getElementById('gamble-btn');
    if (gambleBtn) {
      if (this.cardsActive) {
        gambleBtn.classList.remove('is-dimmed');
        gambleBtn.classList.add('gamble-highlight-pulse', 'frenzy-unlocked');
      } else {
        gambleBtn.classList.add('is-dimmed');
        gambleBtn.classList.remove('gamble-highlight-pulse', 'frenzy-unlocked');
      }
    }

    // 5. Update Lobby IGT Mines card visual indicator
    const lobbyMinesCard = document.getElementById('egt-opt-mines');
    if (lobbyMinesCard) {
      lobbyMinesCard.classList.remove('mines-locked');
      const tag = lobbyMinesCard.querySelector('.egt-badge-status');
      if (tag && window.slotApp && window.slotApp.lobby && window.slotApp.lobby.activeGameId !== 'mines') {
        tag.textContent = this.minesActive ? 'BONUS FRENZY!' : (window.i18n ? window.i18n.t('egtSelectTag') : 'IGRAJ SADA');
      }
    }
  }
}

window.BonusMeters = BonusMeters;

/**
 * IGT - Application Controller & Platform Orchestrator
 * Integrates Core Services (Wallet, Jackpots, Audio, Lobby) with Game Engines.
 */
class IGTApp {
  constructor() {
    this.messageBanner = document.getElementById('status-banner');
    this.spinBtn = document.getElementById('spin-btn');
    this.autoBtn = document.getElementById('auto-btn');
    this.isAutoSpin = false;

    // 1. Core Services & Player Tracking
    this.mathManager = new window.SlotMathManager();
    window.slotMathManager = this.mathManager;
    this.playerTracker = new window.PlayerTracker();
    this.wallet = new window.CasinoWallet(1000, 20);
    this.jackpots = new window.CasinoJackpots(this.wallet);
    this.meters = new window.BonusMeters(this.wallet);

    // 2. Auxiliary Engines
    this.gamble = new window.CardGambleGame(this.wallet, (amount) => {
      if (amount > 0 && this.playerTracker) {
        this.playerTracker.recordBonus('gambleDouble');
      }
      this.wallet.updateUI();
    });

    this.miniMines = new window.MiniMinesBonus(this.wallet, (totalWin) => {
      if (this.playerTracker) {
        this.playerTracker.recordBonus('miniMines');
      }
      if (totalWin > 0) {
        this.showMessage(window.i18n ? window.i18n.t('miniMinesFinished', { amount: totalWin }) : `💣 ZAVRŠEN MINES BONUS: +${totalWin}!`, 'jackpot');
        this.gamble.showTrigger(totalWin);
      } else {
        this.showMessage('💥 MINA EKSPLODIRALA! IZGUBLJEN SAV BONUS DOBITAK (0 RSD)!', 'normal');
        this.gamble.hideTrigger();
      }
      this.wallet.updateUI();
      this.updateSpinButtonState();
    });

    this.freeSpinsManager = new window.FreeSpinsManager(this.wallet, (totalWon) => {
      this.showMessage(`🎉 ZAVRŠEN SUPER BONUS: OSVOJENO +${totalWon.toLocaleString()}!`, 'jackpot');
      this.wallet.updateUI();
      this.updateSpinButtonState();
    });

    this.bigWinCelebrator = new window.BigWinCelebrator(this.wallet);

    this.wheelBonus = new window.IGTWheelBonus(
      this.wallet,
      this.jackpots,
      (spins, startMult) => {
        this.freeSpinsManager.start(spins, startMult);
      },
      (creditsWon) => {
        this.wallet.updateUI();
        this.updateSpinButtonState();
      }
    );

    this.buyBonus = new window.BuyBonusManager(this.wallet);
    this.tournament = new window.CasinoTournament(this.wallet);

    // 3. Game Engines
    this.classicGame = new window.ClassicSlotGame(
      this.wallet,
      this.jackpots,
      (res) => this.handleSpinResult(res)
    );

    this.royalGame = new window.Royal3x3Game(
      this.wallet,
      this.jackpots,
      (res) => this.handleSpinResult(res),
      (matrix) => this.handleTriggerHoldWin(matrix)
    );

    this.minesGame = new window.MinesGame(this.wallet, this.jackpots);

    // 4. Lobby
    this.lobby = new window.CasinoLobby(this.wallet, this.jackpots);
    this.lobby.registerGame('classic', this.classicGame);
    this.lobby.registerGame('royal3x3', {
      mount: () => {
        const stage = document.querySelector('.slot-stage-scaler');
        if (stage) stage.style.display = 'flex';
        this.royalGame.mount(false);
      },
      unmount: () => this.royalGame.unmount(),
      spin: () => this.royalGame.spin(),
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.royalGame
    });
    this.lobby.registerGame('fullfocus', {
      mount: () => {
        const stage = document.querySelector('.slot-stage-scaler');
        if (stage) stage.style.display = 'flex';
        this.royalGame.mount(true);
      },
      unmount: () => this.royalGame.unmount(),
      spin: () => this.royalGame.spin(),
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.royalGame
    });
    this.lobby.registerGame('mines', {
      mount: () => {
        const stage = document.querySelector('.slot-stage-scaler');
        if (stage) stage.style.display = 'none';
        
        // Hide slot controls panel (Bet stepper, Max Bet, Gamble, and Big Spin button)
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) controlsPanel.style.display = 'none';

        // Hide regular slot status banner to avoid clutter
        const bannerWrap = document.querySelector('.status-banner-wrap');
        if (bannerWrap) bannerWrap.style.display = 'none';

        // Add class to container for clean vertical layout
        const container = document.querySelector('.game-container');
        if (container) container.classList.add('in-mines-mode');

        // Cancel any active auto spin
        if (this.isAutoSpin) this.toggleAutoSpin(false);

        this.minesGame.mount();
      },
      unmount: () => {
        this.minesGame.unmount();

        const stage = document.querySelector('.slot-stage-scaler');
        if (stage) stage.style.display = 'flex';

        // Restore slot controls panel and status banner
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) controlsPanel.style.display = 'flex';

        const bannerWrap = document.querySelector('.status-banner-wrap');
        if (bannerWrap) bannerWrap.style.display = 'block';

        const container = document.querySelector('.game-container');
        if (container) container.classList.remove('in-mines-mode');
      },
      spin: () => {
        if (this.minesGame.gameState === 'idle' || this.minesGame.gameState === 'cashed_out' || this.minesGame.gameState === 'exploded') {
          this.minesGame.startGame();
        } else if (this.minesGame.gameState === 'playing') {
          this.minesGame.cashout();
        }
      },
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.minesGame
    });

    // Default Game: Classic
    this.lobby.switchGame('classic');

    this.initControls();

    // 5. Check 18+ Login State & Open Appropriate Modal
    if (this.playerTracker && !this.playerTracker.profile.isLoggedIn) {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.add('active');
    } else {
      if (this.lobby) {
        this.lobby.openModal();
      }
    }

    // 6. Admin / Operator Control Panel
    if (window.AdminPanel) {
      this.adminPanel = new window.AdminPanel(this);
    }
  }

  showMessage(msg, type = 'normal') {
    if (!this.messageBanner) return;
    this.messageBanner.textContent = msg;
    this.messageBanner.className = `status-banner status-${type}`;
  }

  spin() {
    if (!this.lobby || !this.lobby.activeGame) return;
    if (this.miniMines && this.miniMines.isActive) return;

    // Slam Stop: If slot reels are spinning, instant stop!
    if (this.lobby.activeGame.isSpinning) {
      if (this.lobby.activeGame.slamStop) {
        this.lobby.activeGame.slamStop();
        this.showMessage('SLAM STOP!', 'normal');
      }
      return;
    }

    if (!this.wallet.canAffordSpin()) {
      this.showMessage(window.i18n ? window.i18n.t('notEnoughCredits') : 'NEMATE DOVOLJNO KREDITA!', 'warning');
      if (window.slotAudio) window.slotAudio.playClick();
      return;
    }

    this.gamble.hideTrigger();
    this.animateSpinButton();
    this.showMessage(window.i18n ? window.i18n.t('spinning') : 'VRTENJE U TOKU...', 'normal');

    const result = this.lobby.activeGame.spin();
    if (result && result.success !== false) {
      if (this.meters) {
        this.meters.chargeOnSpin(this.wallet.bet);
      }
      if (this.wheelBonus) {
        this.wheelBonus.chargeOnSpin(this.wallet.bet);
      }
    }
    this.updateSpinButtonState();
  }

  showBigWin(amount, onComplete) {
    if (this.bigWinCelebrator) {
      this.bigWinCelebrator.trigger(amount, onComplete);
    } else if (onComplete) {
      onComplete();
    }
  }

  animateSpinButton() {
    if (this.spinBtn) {
      this.spinBtn.classList.remove('flash-active');
      void this.spinBtn.offsetWidth;
      this.spinBtn.classList.add('flash-active');
      setTimeout(() => {
        if (this.spinBtn) this.spinBtn.classList.remove('flash-active');
      }, 420);
    }
  }

  updateSpinButtonState() {
    if (this.spinBtn) {
      const isSpinning = (this.lobby.activeGame && this.lobby.activeGame.isSpinning) || (this.miniMines && this.miniMines.isActive);
      this.spinBtn.disabled = isSpinning;
      this.spinBtn.classList.toggle('disabled', isSpinning);
    }
  }

  handleTriggerHoldWin(sourceMatrix) {
    if (this.playerTracker) {
      this.playerTracker.recordBonus('holdAndWin');
    }
    this.showMessage(window.i18n ? window.i18n.t('miniMinesBonusTitle') : '💎 GRAND MINES BONUS! 💣', 'jackpot');
    if (this.miniMines) {
      this.miniMines.trigger(sourceMatrix, this.wallet.bet);
    }
    this.updateSpinButtonState();
  }

  handleSpinResult(result) {
    this.updateSpinButtonState();
    if (!result) return;

    const { winAmount, winMultiplier, isDiamondBonus, winningLines } = result;

    // Record spin in PlayerTracker
    if (this.playerTracker) {
      const activeGameId = (this.lobby && this.lobby.activeGameId) || 'classic';
      this.playerTracker.recordSpin(activeGameId, this.wallet.bet, winAmount);
    }

    if (this.tournament && this.tournament.isActive && winAmount > 0) {
      this.tournament.onSpinWin(winAmount);
    }

    if (winAmount > 0) {
      if (isDiamondBonus) {
        if (this.playerTracker) {
          this.playerTracker.recordBonus('freeSpins');
        }
        const msg = window.i18n ? window.i18n.t('freeSpinsPlusWin', { amount: winAmount }) : `💎 5 BESPLATNIH SPINOVA + ${winAmount}! 💎`;
        this.showMessage(msg, 'jackpot');
      } else if (winMultiplier >= 30) {
        this.showMessage(`${window.i18n ? window.i18n.t('bigWin') : '🎰 VELIKI DOBITAK! +'}${winAmount} 🎰`, 'jackpot');
      } else {
        const linesCount = winningLines ? winningLines.length : 1;
        const msg = (linesCount > 1) 
          ? `+${winAmount} (${linesCount} LINIJA)` 
          : `${window.i18n ? window.i18n.t('winPrefix') : 'DOBITAK: +'}${winAmount}`;
        this.showMessage(msg, 'win');
      }
      this.gamble.showTrigger(winAmount);
    } else {
      if (this.wallet.freeSpins <= 0) {
        this.showMessage(window.i18n ? window.i18n.t('tryAgain') : 'POKUŠAJTE PONOVO!', 'normal');
      }
    }

    // Check Mystery Jackpots on spin end
    this.jackpots.checkMysteryJackpot((tier, prize, msgKey) => {
      if (this.playerTracker) {
        this.playerTracker.recordJackpot(tier, prize);
      }
      const defaultMsg = tier === 'diamond' 
        ? `💎 DIAMOND JACKPOT! +${prize.toLocaleString()} RSD! 💎`
        : (tier === 'gold' 
          ? `🏆 GOLD JACKPOT! +${prize.toLocaleString()} RSD! 🏆`
          : `🥈 SILVER JACKPOT! +${prize.toLocaleString()} RSD! 🥈`);
      this.showMessage(window.i18n ? window.i18n.t(msgKey, { amount: prize.toLocaleString() }) : defaultMsg, 'jackpot');
      this.gamble.showTrigger(prize);
    });

    // Auto-spin next cycle
    if (this.isAutoSpin) {
      if (this.wallet.canAffordSpin()) {
        setTimeout(() => {
          if (this.isAutoSpin) this.spin();
        }, 1300);
      } else {
        this.toggleAutoSpin(false);
      }
    }
  }

  toggleAutoSpin(forcedState = null) {
    if (window.slotAudio) window.slotAudio.playClick();
    this.isAutoSpin = (forcedState !== null) ? forcedState : !this.isAutoSpin;
    if (this.autoBtn) {
      this.autoBtn.classList.toggle('active', this.isAutoSpin);
      const label = this.isAutoSpin 
        ? (window.i18n ? window.i18n.t('autoSpinOn') : 'STOP') 
        : (window.i18n ? window.i18n.t('autoSpin') : 'AUTO');
      this.autoBtn.textContent = label;
    }
    if (this.isAutoSpin && (!this.lobby.activeGame || !this.lobby.activeGame.isSpinning)) {
      this.spin();
    }
  }

  initControls() {
    if (this.spinBtn) {
      this.spinBtn.addEventListener('click', () => this.spin());
    }
    if (this.autoBtn) {
      this.autoBtn.addEventListener('click', () => this.toggleAutoSpin());
    }

    const betMinusBtn = document.getElementById('bet-minus');
    const betPlusBtn = document.getElementById('bet-plus');
    const maxBetBtn = document.getElementById('max-bet-btn');
    const refillBtn = document.getElementById('refill-credits-btn');
    const hudDenomToggle = document.getElementById('hud-denom-toggle-btn');

    if (betMinusBtn) betMinusBtn.addEventListener('click', () => this.wallet.changeBet(-5));
    if (betPlusBtn) betPlusBtn.addEventListener('click', () => this.wallet.changeBet(5));
    if (maxBetBtn) maxBetBtn.addEventListener('click', () => this.wallet.setMaxBet());
    if (refillBtn) refillBtn.addEventListener('click', () => {
      if (typeof this.openProfileModal === 'function') {
        this.openProfileModal();
      } else {
        const pBtn = document.getElementById('player-profile-btn');
        if (pBtn) pBtn.click();
      }
    });

    if (hudDenomToggle) {
      hudDenomToggle.addEventListener('click', () => {
        this.wallet.cycleDenomination();
        const msg = `DENOMINACIJA: 1 KR = ${this.wallet.activeDenom} RSD`;
        this.showMessage(msg, 'info');
      });
    }

    const goldenBetBtn = document.getElementById('btn-golden-bet');
    if (goldenBetBtn) {
      goldenBetBtn.addEventListener('click', () => {
        const isActive = this.wallet.toggleGoldenBet();
        const msg = isActive 
          ? '✨ GOLDEN BET UKLJUČEN (+25% ULOG, 2x BRŽI BONUSA)!' 
          : 'GOLDEN BET ISKLJUČEN';
        this.showMessage(msg, isActive ? 'jackpot' : 'info');
      });
    }

    const ambientBtn = document.getElementById('ambient-btn');
    if (ambientBtn) {
      ambientBtn.addEventListener('click', () => {
        if (window.slotAudio) {
          const isPlaying = window.slotAudio.toggleCasinoAmbient();
          ambientBtn.classList.toggle('active', isPlaying);
          const msg = isPlaying ? '🔊 VEGAS CASINO AMBIJENT UKLJUČEN' : 'CASINO AMBIJENT UTIŠAN';
          this.showMessage(msg, 'info');
        }
      });
    }

    const tournamentBtn = document.getElementById('tournament-btn');
    if (tournamentBtn && this.tournament) {
      tournamentBtn.addEventListener('click', () => {
        this.tournament.openModal();
      });
    }

    this.initVolatilityModal();
  }

  openVolatilityModal() {
    const modal = document.getElementById('volatility-modal');
    if (modal) modal.classList.add('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    this.updateVolatilityUI();
  }

  closeVolatilityModal() {
    const modal = document.getElementById('volatility-modal');
    if (modal) modal.classList.remove('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  initVolatilityModal() {
    const modal = document.getElementById('volatility-modal');
    const headerBtn = document.getElementById('btn-volatility-toggle');
    const footerBtn = document.getElementById('volatility-footer-btn');
    const closeBtn = document.getElementById('volatility-close-btn');

    if (headerBtn) headerBtn.addEventListener('click', () => this.openVolatilityModal());
    if (footerBtn) footerBtn.addEventListener('click', () => this.openVolatilityModal());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeVolatilityModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeVolatilityModal();
      });
    }

    // Bind cards and selection buttons
    const cards = document.querySelectorAll('.volatility-option-card');
    cards.forEach(card => {
      const presetId = card.getAttribute('data-preset');
      const selectBtn = card.querySelector('.btn-select-preset');

      const selectPreset = (e) => {
        e.stopPropagation();
        if (this.mathManager && presetId) {
          this.mathManager.setPreset(presetId);
          this.updateVolatilityUI();
          if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
          setTimeout(() => closeModal(), 280);
        }
      };

      card.addEventListener('click', selectPreset);
      if (selectBtn) selectBtn.addEventListener('click', selectPreset);
    });

    this.updateVolatilityUI();
  }

  updateVolatilityUI() {
    if (!this.mathManager) return;
    const profile = this.mathManager.getActiveProfile();
    const activeId = this.mathManager.activePreset;

    const lbl = document.getElementById('hud-volatility-name');
    if (lbl) {
      lbl.textContent = profile.shortName;
    }

    const subLbl = document.getElementById('hud-volatility-sub');
    if (subLbl) {
      subLbl.textContent = (activeId === 'standard' ? 'STD' : (activeId === 'low' ? 'LOW' : (activeId === 'high' ? 'HIGH' : '100%')));
    }

    document.querySelectorAll('.volatility-option-card').forEach(card => {
      const pid = card.getAttribute('data-preset');
      card.classList.toggle('active', pid === activeId);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const particles = new window.ParticleEngine('fx-canvas');
  window.particleEngine = particles;

  const app = new IGTApp();
  window.IGTApp = IGTApp;
  window.MaxBetApp = IGTApp; // Backwards compatibility
  window.GrandSlotApp = IGTApp; // Backwards compatibility
  window.slotApp = app;
  window.slotGame = app; // Backwards compatibility for inspect/dev

  // Universal Responsive Scaler
  function updateSlotScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isFullFocus = (app.lobby && app.lobby.activeGameId === 'fullfocus');
    const is3x3 = (app.lobby && (app.lobby.activeGameId === 'royal3x3' || isFullFocus));

    const baseW = isFullFocus ? 416 : 514;
    const availW = Math.max(260, vw - (isFullFocus ? 16 : 24));
    const scaleW = Math.min(1.22, availW / baseW);

    const baseH = is3x3 ? 250 : 165;
    const availH = Math.max(100, vh - 320);
    const scaleH = Math.min(1.22, availH / baseH);
    const finalScale = Math.max(0.48, Math.min(scaleW, scaleH));
    document.documentElement.style.setProperty('--slot-scale', finalScale.toFixed(4));
  }
  window.updateSlotScale = updateSlotScale;
  window.addEventListener('resize', updateSlotScale);
  window.addEventListener('orientationchange', () => setTimeout(updateSlotScale, 100));
  updateSlotScale();

  // Mechanical Lever Interaction
  const lever = document.getElementById('slot-lever');
  if (lever) {
    const leverArm = lever.querySelector('.lever-pivot-arm');
    let startY = 0;
    let currentDeltaY = 0;
    let isDragging = false;
    let justSwiped = false;

    lever.addEventListener('click', () => {
      if (justSwiped) return;
      app.spin();
    });

    lever.addEventListener('pointerdown', (e) => {
      if (app.lobby.activeGame && app.lobby.activeGame.isSpinning) return;
      startY = e.clientY;
      currentDeltaY = 0;
      isDragging = true;
      try { lever.setPointerCapture(e.pointerId); } catch (err) {}
      if (leverArm) leverArm.style.transition = 'none';
    });

    lever.addEventListener('pointermove', (e) => {
      if (!isDragging || (app.lobby.activeGame && app.lobby.activeGame.isSpinning)) return;
      const deltaY = e.clientY - startY;
      if (deltaY > 0) {
        currentDeltaY = deltaY;
        if (leverArm) {
          const pullAngle = 38 + Math.min(72, deltaY * 0.75);
          const pullScale = 1 - Math.min(0.15, (deltaY / 90) * 0.15);
          leverArm.style.transform = `rotate(${pullAngle}deg) scaleY(${pullScale})`;
        }
      }
    });

    const finishLeverDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        if (e && e.pointerId && lever.hasPointerCapture(e.pointerId)) {
          lever.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      if (currentDeltaY >= 25 && (!app.lobby.activeGame || !app.lobby.activeGame.isSpinning)) {
        justSwiped = true;
        setTimeout(() => { justSwiped = false; }, 450);

        if (leverArm) {
          leverArm.style.transition = 'transform 0.12s ease-in';
          leverArm.style.transform = 'rotate(110deg) scaleY(0.86)';
        }

        app.spin();

        setTimeout(() => {
          if (leverArm) {
            leverArm.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
            leverArm.style.transform = '';
            setTimeout(() => { if (leverArm) leverArm.style.transition = ''; }, 360);
          }
        }, 220);
      } else {
        if (leverArm) {
          leverArm.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
          leverArm.style.transform = '';
          setTimeout(() => { if (leverArm) leverArm.style.transition = ''; }, 260);
        }
      }
      currentDeltaY = 0;
    };

    lever.addEventListener('pointerup', finishLeverDrag);
    lever.addEventListener('pointercancel', finishLeverDrag);
  }

  // Spacebar Spin
  window.addEventListener('keydown', (e) => {
    const paytableModal = document.getElementById('paytable-modal');
    if (e.code === 'Space' && !e.repeat && (!paytableModal || !paytableModal.classList.contains('active'))) {
      e.preventDefault();
      app.spin();
    }
  });

  // Sound toggle
  const soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = window.slotAudio.toggleMute();
      soundBtn.classList.toggle('muted', isMuted);
      const onIcon = soundBtn.querySelector('.sound-on-icon');
      const offIcon = soundBtn.querySelector('.sound-off-icon');
      if (onIcon && offIcon) {
        onIcon.style.display = isMuted ? 'none' : 'block';
        offIcon.style.display = isMuted ? 'block' : 'none';
      }
    });
  }

  // Language toggle
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      if (window.i18n) window.i18n.toggleLanguage();
    });
  }

  // Paytable Modal
  const paytableBtn = document.getElementById('paytable-btn');
  const paytableModal = document.getElementById('paytable-modal');
  const closePaytableBtn = document.getElementById('close-paytable');
  if (paytableBtn && paytableModal) {
    paytableBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      paytableModal.classList.add('active');
    });
  }
  if (closePaytableBtn && paytableModal) {
    closePaytableBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      paytableModal.classList.remove('active');
    });
  }
  if (paytableModal) {
    paytableModal.addEventListener('click', (e) => {
      if (e.target === paytableModal) paytableModal.classList.remove('active');
    });
  }

  // PWA Automated 1-Click Installation Controller
  let deferredPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  const bannerInstallBtn = document.getElementById('pwa-banner-install-btn');
  const installBanner = document.getElementById('pwa-install-banner');
  const dismissBannerBtn = document.getElementById('pwa-dismiss-btn');
  const iosModal = document.getElementById('pwa-ios-modal');
  const closeIosModalBtn = document.getElementById('pwa-ios-close-x');
  const confirmIosModalBtn = document.getElementById('pwa-ios-confirm-btn');

  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  // Detect iOS Safari
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  function showInstallBanner() {
    if (isStandalone) return;
    const dismissedTime = localStorage.getItem('igt_pwa_dismissed') || localStorage.getItem('maxbet_pwa_dismissed');
    // If dismissed recently (within 24h), do not annoy the user
    if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 86400000) {
      return;
    }
    if (installBanner) {
      setTimeout(() => {
        installBanner.classList.add('is-visible');
      }, 1500);
    }
  }

  function hideInstallBanner(permanently = false) {
    if (installBanner) {
      installBanner.classList.remove('is-visible');
    }
    if (permanently) {
      localStorage.setItem('igt_pwa_dismissed', Date.now().toString());
    }
  }

  // Handle Android / Chrome automated beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;

    // Highlight install button in footer
    if (installBtn) {
      installBtn.classList.add('is-pulse');
    }

    // Show floating installation banner
    showInstallBanner();
  });

  async function triggerAutomatedInstall() {
    if (window.slotAudio) window.slotAudio.playClick();

    // 1. Android / Chrome / Edge Native 1-Click Prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        hideInstallBanner(true);
        if (installBtn) installBtn.classList.remove('is-pulse');
      }
      deferredPrompt = null;
      return;
    }

    // 2. iOS Safari Step-by-Step visual guide
    if (isIos || isSafari) {
      hideInstallBanner(false);
      if (iosModal) iosModal.classList.add('active');
      return;
    }

    // 3. Fallback for Desktop/Unsupported browsers: show gentle prompt
    if (app && typeof app.showMessage === 'function') {
      const msg = window.i18n ? window.i18n.t('pwaBannerTitle') : 'Instalirajte IGT Casino';
      app.showMessage(msg, 'gold');
    }
  }

  if (installBtn) {
    installBtn.addEventListener('click', triggerAutomatedInstall);
  }

  if (bannerInstallBtn) {
    bannerInstallBtn.addEventListener('click', triggerAutomatedInstall);
  }

  if (dismissBannerBtn) {
    dismissBannerBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      hideInstallBanner(true);
    });
  }

  // iOS Guide Modal Events
  if (closeIosModalBtn && iosModal) {
    closeIosModalBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      iosModal.classList.remove('active');
    });
  }

  if (confirmIosModalBtn && iosModal) {
    confirmIosModalBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      iosModal.classList.remove('active');
    });
  }

  if (iosModal) {
    iosModal.addEventListener('click', (e) => {
      if (e.target === iosModal) iosModal.classList.remove('active');
    });
  }

  // App Installed Event Listener
  window.addEventListener('appinstalled', () => {
    hideInstallBanner(true);
    if (installBtn) installBtn.classList.remove('is-pulse');
    if (app && typeof app.showMessage === 'function') {
      const msg = window.i18n ? window.i18n.t('pwaInstalledSuccess') : 'Aplikacija je uspešno instalirana!';
      app.showMessage(msg, 'jackpot');
    }
  });

  // Prompt banner on iOS or first visit if not installed
  if (!isStandalone) {
    setTimeout(showInstallBanner, 2000);
  }

  // 18+ Login & Player Profile UI Controller
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const loginUserInput = document.getElementById('login-username');
  const loginPinInput = document.getElementById('login-pin');
  const loginAgeCheck = document.getElementById('login-age-check');
  const loginRememberCheck = document.getElementById('login-remember-me');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const headerPlayerName = document.getElementById('header-player-name');
  const playerProfileBtn = document.getElementById('player-profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const profileCloseX = document.getElementById('profile-close-x');
  const profileCloseBtn = document.getElementById('profile-close-btn');
  const profileLogoutBtn = document.getElementById('profile-logout-btn');

  function updateHeaderProfile() {
    if (!app || !app.playerTracker) return;
    const profile = app.playerTracker.profile;
    if (headerPlayerName) {
      headerPlayerName.textContent = profile.isLoggedIn ? (profile.username || 'Igrač') : 'Prijava';
    }
    if (playerProfileBtn) {
      const uName = profile.isLoggedIn ? (profile.username || 'Igrač') : 'Prijava';
      playerProfileBtn.title = `${uName} (18+) - Profil & Statistika`;
    }
  }

  // Pre-fill remembered username
  if (app && app.playerTracker && app.playerTracker.profile) {
    if (loginUserInput && app.playerTracker.profile.username) {
      loginUserInput.value = app.playerTracker.profile.username;
    }
    updateHeaderProfile();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!loginAgeCheck || !loginAgeCheck.checked) {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = window.i18n ? window.i18n.t('loginAgeRequiredMsg') : 'Morate potvrditi da imate 18 ili više godina!';
          loginErrorMsg.style.display = 'block';
        }
        return;
      }

      const username = (loginUserInput ? loginUserInput.value : '').trim() || 'Demo Player';
      const pin = loginPinInput ? loginPinInput.value : '';
      const remember = loginRememberCheck ? loginRememberCheck.checked : true;

      if (app && app.playerTracker) {
        app.playerTracker.login(username, pin, remember);
      }

      if (window.slotAudio) window.slotAudio.playClick();
      if (loginModal) loginModal.classList.remove('active');
      updateHeaderProfile();

      // Open games lobby upon successful login
      if (app && app.lobby) {
        app.lobby.openModal();
      }
    });
  }

  function renderProfileStats() {
    if (!app || !app.playerTracker) return;
    const p = app.playerTracker.profile;
    const s = p.stats;

    const modalUsername = document.getElementById('profile-modal-username');
    if (modalUsername) modalUsername.textContent = p.username || 'Demo Player';

    const statSpins = document.getElementById('profile-stat-spins');
    if (statSpins) statSpins.textContent = s.totalSpins.toLocaleString();

    const statRtp = document.getElementById('profile-stat-rtp');
    if (statRtp) statRtp.textContent = `${app.playerTracker.getCalculatedRTP()}%`;

    const statBet = document.getElementById('profile-stat-bet');
    if (statBet) statBet.textContent = `${s.totalBet.toLocaleString()} RSD`;

    const statWin = document.getElementById('profile-stat-win');
    if (statWin) statWin.textContent = `${s.totalWin.toLocaleString()} RSD`;

    const statBiggest = document.getElementById('profile-stat-biggest-win');
    if (statBiggest) statBiggest.textContent = `${s.biggestWin.toLocaleString()} RSD`;

    const bdClassic = document.getElementById('profile-breakdown-classic');
    if (bdClassic) bdClassic.textContent = `${(s.spinsByGame.classic || 0).toLocaleString()} spinova`;

    const bdRoyal = document.getElementById('profile-breakdown-royal');
    if (bdRoyal) bdRoyal.textContent = `${((s.spinsByGame.royal3x3 || 0) + (s.spinsByGame.fullfocus || 0)).toLocaleString()} spinova`;

    const bdMines = document.getElementById('profile-breakdown-mines');
    if (bdMines) bdMines.textContent = `${(s.spinsByGame.mines || 0).toLocaleString()} rundi`;

    const bFree = document.getElementById('profile-bonus-freespins');
    if (bFree) bFree.textContent = (s.bonusesTriggered.freeSpins || 0).toString();

    const bHold = document.getElementById('profile-bonus-holdwin');
    if (bHold) bHold.textContent = (s.bonusesTriggered.holdAndWin || 0).toString();

    const bMines = document.getElementById('profile-bonus-mines');
    if (bMines) bMines.textContent = (s.bonusesTriggered.miniMines || 0).toString();

    const jSummary = document.getElementById('profile-jackpot-summary');
    if (jSummary) {
      jSummary.textContent = `${s.jackpotsWon.silver || 0} / ${s.jackpotsWon.gold || 0} / ${s.jackpotsWon.diamond || 0}`;
    }

    const playTimeEl = document.getElementById('profile-playtime');
    if (playTimeEl) playTimeEl.textContent = app.playerTracker.getSessionPlayTime();
  }

  app.openProfileModal = function() {
    if (window.slotAudio) window.slotAudio.playClick();
    if (!app.playerTracker || !app.playerTracker.profile.isLoggedIn) {
      if (loginModal) loginModal.classList.add('active');
    } else {
      renderProfileStats();
      if (profileModal) profileModal.classList.add('active');
    }
  };

  if (playerProfileBtn) {
    playerProfileBtn.addEventListener('click', () => {
      app.openProfileModal();
    });
  }

  function closeProfileModal() {
    if (window.slotAudio) window.slotAudio.playClick();
    if (profileModal) profileModal.classList.remove('active');
  }

  if (profileCloseX) profileCloseX.addEventListener('click', closeProfileModal);
  if (profileCloseBtn) profileCloseBtn.addEventListener('click', closeProfileModal);
  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      if (app && app.playerTracker) {
        app.playerTracker.logout();
      }
      closeProfileModal();
      updateHeaderProfile();
      if (loginModal) loginModal.classList.add('active');
    });
  }

  // Fictional RSD Deposit chips in Profile
  document.querySelectorAll('.btn-deposit-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-amount'), 10) || 500;
      if (app && app.wallet) {
        const addedCredits = app.wallet.addFictionalRsd(amount);
        renderProfileStats();
        app.showMessage(`💰 USPEŠNO UPLAĆENO +${amount.toLocaleString()} RSD (+${addedCredits.toLocaleString()} KR)!`, 'jackpot');
      }
    });
  });

  // Custom RSD Deposit in Profile
  const customDepositInput = document.getElementById('custom-deposit-input');
  const btnSubmitCustomDeposit = document.getElementById('btn-submit-custom-deposit');
  if (btnSubmitCustomDeposit) {
    btnSubmitCustomDeposit.addEventListener('click', () => {
      const val = parseInt(customDepositInput ? customDepositInput.value : 0, 10);
      if (val && val > 0) {
        if (app && app.wallet) {
          const addedCredits = app.wallet.addFictionalRsd(val);
          if (customDepositInput) customDepositInput.value = '';
          renderProfileStats();
          app.showMessage(`💰 USPEŠNO UPLAĆENO +${val.toLocaleString()} RSD (+${addedCredits.toLocaleString()} KR)!`, 'jackpot');
        }
      } else {
        if (window.slotAudio) window.slotAudio.playClick();
        if (customDepositInput) customDepositInput.focus();
      }
    });
  }

  // Profile Denomination Pills
  document.querySelectorAll('.denom-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const denomVal = parseFloat(btn.getAttribute('data-denom'));
      if (app && app.wallet && denomVal) {
        app.wallet.setDenomination(denomVal);
        renderProfileStats();
        app.showMessage(`🎰 DENOMINACIJA: 1 KR = ${denomVal} RSD`, 'info');
      }
    });
  });

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => reg.update())
      .catch((err) => console.error('PWA SW registration failed:', err));
  }
});

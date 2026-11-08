/**
 * GameStageManager - Dynamic Virtual View Staging & DOM Node Pooling
 * Caches DOM references to all game stage views, keeping ONLY the active game in the live render tree.
 * Reduces live DOM nodes by >90% on mobile devices, eliminating mobile freezing, layout thrashing, and GPU memory starvation.
 */
class GameStageManager {
  constructor() {
    this.host = document.getElementById('game-stage-host') || document.querySelector('.stage-area');
    this.views = {};
    this.activeViewKeys = [];

    const viewSelectors = {
      slot: '.slot-stage-scaler',
      vault: '#vault-crawler-view',
      royale: '#battle-royale-view',
      mines: '#mines-game-view',
      crash: '#crash-game-view',
      plinko: '#plinko-game-view',
      blackjack: '#blackjack-game-view',
      videopoker: '#videopoker-game-view',
      holdem: '#casino-holdem-game-view',
      scratch: '#scratch-game-view'
    };

    Object.entries(viewSelectors).forEach(([key, selector]) => {
      const el = document.querySelector(selector);
      if (el) {
        this.views[key] = el;
      }
    });
  }

  init() {
    this.mountView('slot');
  }

  /**
   * Mounts the requested view(s) into the live DOM host and detaches all other inactive views.
   * Preserves event listeners, closures, canvas contexts, and element bindings across transitions.
   * @param {string} key - 'slot' | 'vault' | 'royale' | 'mines' | 'crash' | 'plinko' | 'blackjack' | 'videopoker' | 'holdem'
   */
  mountView(key) {
    if (!this.host) return;

    let targetKeys = [];
    if (key === 'vault') {
      targetKeys = ['vault', 'slot'];
    } else if (key === 'royale') {
      targetKeys = ['royale', 'slot'];
    } else if (['classic', 'royal3x3', 'fullfocus', 'slot'].includes(key)) {
      targetKeys = ['slot'];
    } else if (this.views[key]) {
      targetKeys = [key];
    } else {
      targetKeys = ['slot'];
    }

    // Detach inactive views to release layout, render, and GPU compositing layers
    Object.keys(this.views).forEach(k => {
      const el = this.views[k];
      if (el && !targetKeys.includes(k) && el.parentNode) {
        el.remove();
      }
    });

    // Attach target views into host in exact DOM visual order
    targetKeys.forEach(k => {
      const el = this.views[k];
      if (el) {
        if (el.parentNode !== this.host) {
          this.host.appendChild(el);
        }
        el.style.display = 'flex';
      }
    });

    this.activeViewKeys = targetKeys;
  }
}
window.GameStageManager = GameStageManager;

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
        this.showMessage('💥 MINA EKSPLODIRALA! IZGUBLJEN SAV BONUS DOBITAK (0 KREDITA)!', 'normal');
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
    if (window.GrandCrashGame) {
      this.crashGame = new window.GrandCrashGame(this.wallet, this.jackpots);
    }
    if (window.PlinkoDeluxeGame) {
      this.plinkoGame = new window.PlinkoDeluxeGame(this.wallet, this.jackpots);
    }
    if (window.RoyalBlackjackGame) {
      this.blackjackGame = new window.RoyalBlackjackGame(this.wallet, this.jackpots);
    }
    if (window.RoyalVideoPokerGame) {
      this.videoPokerGame = new window.RoyalVideoPokerGame(this.wallet, this.jackpots);
    }
    if (window.RoyalCasinoHoldemGame) {
      this.casinoHoldemGame = new window.RoyalCasinoHoldemGame(this.wallet, this.jackpots);
    }
    if (window.RoyalScratchGame) {
      this.scratchGame = new window.RoyalScratchGame(this.wallet, this.jackpots);
    }

    // 4. Lobby
    this.lobby = new window.CasinoLobby(this.wallet, this.jackpots);
    window.casinoLobby = this.lobby;
    this.lobby.registerGame('classic', {
      mount: () => {
        this.restoreSlotUI();
        this.classicGame.mount();
      },
      unmount: () => this.classicGame.unmount(),
      spin: () => this.classicGame.spin(),
      slamStop: () => this.classicGame.slamStop && this.classicGame.slamStop(),
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.classicGame
    });
    this.lobby.registerGame('royal3x3', {
      mount: () => {
        this.restoreSlotUI();
        this.royalGame.mount(false);
      },
      unmount: () => this.royalGame.unmount(),
      spin: () => this.royalGame.spin(),
      slamStop: () => this.royalGame.slamStop && this.royalGame.slamStop(),
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.royalGame
    });
    this.lobby.registerGame('fullfocus', {
      mount: () => {
        this.restoreSlotUI();
        this.royalGame.mount(true);
      },
      unmount: () => this.royalGame.unmount(),
      spin: () => this.royalGame.spin(),
      slamStop: () => this.royalGame.slamStop && this.royalGame.slamStop(),
      get isSpinning() { return this.gameInstance.isSpinning; },
      gameInstance: this.royalGame
    });
    this.lobby.registerGame('mines', {
      mount: () => {
        if (this.stageManager) this.stageManager.mountView('mines');
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
        this.restoreSlotUI();
      },
      forceExit: () => {
        if (this.minesGame && typeof this.minesGame.forceExit === 'function') {
          this.minesGame.forceExit();
        }
      },
      spin: () => {
        if (this.minesGame.gameState === 'idle' || this.minesGame.gameState === 'cashed_out' || this.minesGame.gameState === 'exploded') {
          this.minesGame.startGame();
        } else if (this.minesGame.gameState === 'playing') {
          this.minesGame.cashout();
        }
      },
      get isSpinning() { return false; },
      gameInstance: this.minesGame
    });

    if (this.crashGame) {
      this.lobby.registerGame('crash', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('crash');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-crash-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.crashGame.mount();
        },
        unmount: () => {
          this.crashGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-crash-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.crashGame && typeof this.crashGame.forceExit === 'function') {
            this.crashGame.forceExit();
          }
        },
        spin: () => {
          if (this.crashGame) {
            this.crashGame.handleMainAction();
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.crashGame
      });
    }

    if (this.plinkoGame) {
      this.lobby.registerGame('plinko', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('plinko');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-plinko-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.plinkoGame.mount();
        },
        unmount: () => {
          this.plinkoGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-plinko-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.plinkoGame && typeof this.plinkoGame.forceExit === 'function') {
            this.plinkoGame.forceExit();
          }
        },
        spin: () => {
          if (this.plinkoGame) {
            this.plinkoGame.dropBall();
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.plinkoGame
      });
    }

    if (this.blackjackGame) {
      this.lobby.registerGame('blackjack', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('blackjack');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-blackjack-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.blackjackGame.mount();
        },
        unmount: () => {
          this.blackjackGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-blackjack-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.blackjackGame && typeof this.blackjackGame.forceExit === 'function') {
            this.blackjackGame.forceExit();
          }
        },
        spin: () => {
          if (this.blackjackGame) {
            this.blackjackGame.handleMainAction();
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.blackjackGame
      });
    }

    if (this.videoPokerGame) {
      this.lobby.registerGame('videopoker', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('videopoker');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-videopoker-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.videoPokerGame.mount();
        },
        unmount: () => {
          this.videoPokerGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-videopoker-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.videoPokerGame && typeof this.videoPokerGame.forceExit === 'function') {
            this.videoPokerGame.forceExit();
          }
        },
        spin: () => {
          if (this.videoPokerGame) {
            this.videoPokerGame.handleMainAction();
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.videoPokerGame
      });
    }

    if (this.casinoHoldemGame) {
      this.lobby.registerGame('holdem', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('holdem');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-holdem-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.casinoHoldemGame.mount();
        },
        unmount: () => {
          this.casinoHoldemGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-holdem-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.casinoHoldemGame && typeof this.casinoHoldemGame.forceExit === 'function') {
            this.casinoHoldemGame.forceExit();
          }
        },
        spin: () => {
          if (this.casinoHoldemGame) {
            this.casinoHoldemGame.handleMainAction();
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.casinoHoldemGame
      });
    }

    if (this.scratchGame) {
      this.lobby.registerGame('scratch', {
        mount: () => {
          if (this.stageManager) this.stageManager.mountView('scratch');
          const stage = document.querySelector('.slot-stage-scaler');
          if (stage) stage.style.display = 'none';

          const controlsPanel = document.querySelector('.controls-panel');
          if (controlsPanel) controlsPanel.style.display = 'none';

          const bannerWrap = document.querySelector('.status-banner-wrap');
          if (bannerWrap) bannerWrap.style.display = 'none';

          const container = document.querySelector('.game-container');
          if (container) container.classList.add('in-scratch-mode');

          if (this.isAutoSpin) this.toggleAutoSpin(false);

          this.scratchGame.mount();
        },
        unmount: () => {
          this.scratchGame.unmount();
          const container = document.querySelector('.game-container');
          if (container) container.classList.remove('in-scratch-mode');
          this.restoreSlotUI();
        },
        forceExit: () => {
          if (this.scratchGame && typeof this.scratchGame.forceExit === 'function') {
            this.scratchGame.forceExit();
          }
        },
        spin: () => {
          if (this.scratchGame) {
            if (this.scratchGame.cardState === 'ready' || this.scratchGame.cardState === 'revealed') {
              this.scratchGame.buyNewCard();
            } else if (this.scratchGame.cardState === 'scratching') {
              this.scratchGame.scratchAll();
            }
          }
        },
        get isSpinning() { return false; },
        gameInstance: this.scratchGame
      });
    }

    // Default Game: Classic
    this.lobby.switchGame('classic');

    this.initControls();

    // 5. Check Player Session & Prompt Auth
    this.sessionCheckPromise = this.initPlayerSession();

    // 5.5 Notification Manager
    if (window.NotificationManager) {
      this.notifications = new window.NotificationManager(this);
    }

    // 6. Admin Remote Bridge (Connects silently in background to standalone admin.html)
    if (window.AdminBridge) {
      this.adminBridge = new window.AdminBridge(this);
    }

    // 7. Check for Smart Push Promotional Rewards & VIP Vouchers
    this.initPromoBonusListener();
    this.initVoucherHub();
    this.initPromoBanner();
    this.checkPromoBonusFromUrl();

    // 8. The Vault Crawler & Slot-Battle Royale Engines
    if (window.VaultCrawler) {
      this.vaultCrawler = new window.VaultCrawler(this.wallet, this.lobby);
      window.vaultCrawler = this.vaultCrawler;
    }
    if (window.SlotBattleRoyale) {
      this.battleRoyale = new window.SlotBattleRoyale(this.wallet, this.lobby);
      window.battleRoyale = this.battleRoyale;
    }

    // 8.5 Operator Daily Access & Exclusivity Controls
    if (window.DailyAccessManager) {
      this.dailyAccessManager = new window.DailyAccessManager();
      window.dailyAccessManager = this.dailyAccessManager;
    }

    // 8.6 Daily Missions & 7-Day Streak Retention Manager
    if (window.DailyMissionsManager) {
      this.dailyMissionsManager = new window.DailyMissionsManager();
      window.dailyMissionsManager = this.dailyMissionsManager;
    }

    // 8.7 Tier & Loyalty Progression Manager (Silver, Gold, VIP)
    if (window.TierManager) {
      this.tierManager = new window.TierManager(this);
      window.slotTierManager = this.tierManager;
      this.tierManager.init(this);
    }

    // 8.8 Live Events & Physical Club Broadcast Hub Manager
    this.sessionSpinsCount = 0;
    if (window.ClubEventsManager) {
      this.clubEventsManager = new window.ClubEventsManager(this);
      window.clubEventsManager = this.clubEventsManager;
    }

    // 8.9 Dynamic Game Stage Manager (Virtual View Detachment / Node Pooling)
    this.stageManager = new GameStageManager();
    window.gameStageManager = this.stageManager;
    this.stageManager.init();
    this.sessionStartTime = Date.now();
    this.currentGrandMode = 'casino';
    this.casinoStyle = 'daily';
    try {
      this.casinoStyle = localStorage.getItem('gsc_casino_style') || 'daily';
    } catch (_) {}
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('theme-casino', 'theme-vault', 'theme-royale');
      document.body.classList.add('theme-casino');
    }

    // Ensure subgame mobile action docks are hidden on initial load in Casino mode
    const initVDock = document.getElementById('vault-mobile-dock');
    if (initVDock) initVDock.style.display = 'none';
    const initRDock = document.getElementById('royale-mobile-dock');
    if (initRDock) initRDock.style.display = 'none';

    this.initGrandModeHub();
    this.initDailyGrantAndAudit();
  }

  /* ==========================================================================
     Grand Mode Hub Navigation (Casino Salon, Vault Crawler, Battle Royale)
     ========================================================================== */

  initGrandModeHub() {
    const tabs = document.querySelectorAll('.hub-mode-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-mode');
        if (mode) {
          this.switchGrandMode(mode);
        }
      });
    });

    // Main 3-Pillar Experience Modal Triggers
    const btnModeCasino = document.getElementById('btn-select-mode-casino');
    if (btnModeCasino) {
      btnModeCasino.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.openCasinoStyleModal();
      });
    }

    const btnModeVault = document.getElementById('btn-select-mode-vault');
    if (btnModeVault) {
      btnModeVault.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.closeMainModeModal();
        this.switchGrandMode('vault');
      });
    }

    const btnModeRoyale = document.getElementById('btn-select-mode-royale');
    if (btnModeRoyale) {
      btnModeRoyale.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.closeMainModeModal();
        this.switchGrandMode('royale');
      });
    }

    // Casino Style Selection (Casual vs Daily sa taskovima)
    const btnStyleCasual = document.getElementById('btn-style-casual');
    if (btnStyleCasual) {
      btnStyleCasual.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.setCasinoStyle('casual');
      });
    }

    const btnStyleDaily = document.getElementById('btn-style-daily');
    if (btnStyleDaily) {
      btnStyleDaily.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.setCasinoStyle('daily');
      });
    }

    const btnBackToMainModes = document.getElementById('btn-back-to-main-modes');
    if (btnBackToMainModes) {
      btnBackToMainModes.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.openMainModeModal();
      });
    }

    // Allow clicking the main brand logo to open the 3-pillar mode selector anytime
    const brandLogo = document.querySelector('.main-brand-logo');
    if (brandLogo) {
      brandLogo.style.cursor = 'pointer';
      brandLogo.title = 'Izbor Glavnog Režima (Kazino Salon, Trezor Provala, Battle Royale)';
      brandLogo.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        this.openMainModeModal();
      });
    }

    // Prestige Hub / Kuća Slavnih Trigger
    const prestigeTab = document.getElementById('hub-btn-prestige');
    if (prestigeTab) {
      prestigeTab.addEventListener('click', () => {
        if (window.prestigeManager) {
          window.prestigeManager.openModal(this.currentGrandMode || 'casino');
        }
      });
    }

    this.updateModeQuotaPills();
  }

  openMainModeModal() {
    if (this.playerTracker && !this.playerTracker.profile.isLoggedIn) {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.add('active');
      if (typeof window.switchAuthTab === 'function') window.switchAuthTab('login');
      return;
    }
    this.closeCasinoStyleModal();
    if (this.lobby && typeof this.lobby.closeModal === 'function') {
      this.lobby.closeModal();
    }
    const modal = document.getElementById('main-mode-select-modal');
    if (modal) {
      modal.classList.remove('is-hidden');
      modal.classList.add('active');
    }
  }

  closeMainModeModal() {
    const modal = document.getElementById('main-mode-select-modal');
    if (modal) {
      modal.classList.add('is-hidden');
      modal.classList.remove('active');
    }
  }

  openCasinoStyleModal() {
    if (this.playerTracker && !this.playerTracker.profile.isLoggedIn) {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.add('active');
      if (typeof window.switchAuthTab === 'function') window.switchAuthTab('login');
      return;
    }
    this.closeMainModeModal();
    const modal = document.getElementById('casino-style-select-modal');
    if (modal) {
      modal.classList.remove('is-hidden');
      modal.classList.add('active');
    }
  }

  closeCasinoStyleModal() {
    const modal = document.getElementById('casino-style-select-modal');
    if (modal) {
      modal.classList.add('is-hidden');
      modal.classList.remove('active');
    }
  }

  setCasinoStyle(style) {
    this.casinoStyle = style;
    try {
      localStorage.setItem('gsc_casino_style', style);
    } catch (_) {}

    const missionsBar = document.getElementById('daily-missions-bar');
    if (missionsBar) {
      missionsBar.style.display = (style === 'daily') ? 'flex' : 'none';
      if (style === 'daily' && this.dailyMissionsManager) {
        this.dailyMissionsManager.renderBar();
      }
    }

    this.closeCasinoStyleModal();
    this.closeMainModeModal();
    this.switchGrandMode('casino');

    // Otvara izbor igara odmah nakon izbora stila kazina
    if (this.lobby && typeof this.lobby.openModal === 'function') {
      this.lobby.openModal();
    }

    if (window.slotNotifications && typeof window.slotNotifications.show === 'function') {
      if (style === 'casual') {
        window.slotNotifications.show('☕ Kazino Salon: Pokrenut CASUAL stil igre (čista zabava bez zadataka).', 'info');
      } else {
        window.slotNotifications.show('🎯 Kazino Salon: Pokrenut DAILY stil sa aktivnim zadacima i nagradama!', 'info');
      }
    }
  }

  initDailyGrantAndAudit() {
    if (!this.dailyAccessManager) return;
    const playerId = this.playerTracker?.profile?.id || this.dailyAccessManager.getCurrentPlayerId();
    const playerName = this.playerTracker?.profile?.name || playerId;

    // Check and claim daily login grant (100 ZLT default)
    const grantResult = this.dailyAccessManager.checkAndClaimDailyGrant(playerId, playerName);
    if (grantResult.awarded) {
      if (this.wallet && typeof this.wallet.addFictionalRsd === 'function') {
        this.wallet.addFictionalRsd(grantResult.amount);
      }
      setTimeout(() => {
        this.showDailyGrantModal(grantResult.amount, grantResult.totalLogins);
      }, 700);
    }

    // Record login in operator audit trail
    this.dailyAccessManager.recordLoginAudit({
      playerId: playerId,
      playerName: playerName,
      bonusAwarded: grantResult.awarded ? grantResult.amount : 0,
      isNewLogin: true
    });

    this.updateModeQuotaPills();
  }

  updateModeQuotaPills() {
    if (!this.dailyAccessManager) return;
    const playerId = this.playerTracker?.profile?.id || this.dailyAccessManager.getCurrentPlayerId();
    const isGod = this.dailyAccessManager.isGodPlayer ? this.dailyAccessManager.isGodPlayer(playerId) : false;

    const vaultPill = document.getElementById('vault-quota-pill');
    if (vaultPill) {
      if (isGod) {
        vaultPill.textContent = '∞';
        vaultPill.classList.remove('exhausted');
        vaultPill.classList.add('god-quota-pill');
        vaultPill.title = '⚡ GOD TIER: Neograničeni ulasci u Trezor!';
      } else {
        vaultPill.classList.remove('god-quota-pill');
        const rem = this.dailyAccessManager.getRemaining(playerId, 'vault');
        const lim = this.dailyAccessManager.getLimit('vault', playerId);
        vaultPill.textContent = `${rem}/${lim}`;
        vaultPill.classList.toggle('exhausted', rem <= 0);
        vaultPill.title = `Preostalo ulazaka u Trezor danas: ${rem} od ${lim}`;
      }
    }

    const royalePill = document.getElementById('royale-quota-pill');
    if (royalePill) {
      if (isGod) {
        royalePill.textContent = '∞';
        royalePill.classList.remove('exhausted');
        royalePill.classList.add('god-quota-pill');
        royalePill.title = '⚡ GOD TIER: Neograničeni ulasci u Battle Royale!';
      } else {
        royalePill.classList.remove('god-quota-pill');
        const rem = this.dailyAccessManager.getRemaining(playerId, 'royale');
        const lim = this.dailyAccessManager.getLimit('royale', playerId);
        royalePill.textContent = `${rem}/${lim}`;
        royalePill.classList.toggle('exhausted', rem <= 0);
        royalePill.title = `Preostalo učešća u Battle Royale danas: ${rem} od ${lim}`;
      }
    }
  }

  showDailyGrantModal(amount = 100, totalLogins = 1) {
    const modal = document.getElementById('daily-grant-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    if (window.slotAudio && window.slotAudio.playWin) {
      window.slotAudio.playWin();
    }
    const closeBtn = document.getElementById('btn-close-daily-grant');
    const claimBtn = document.getElementById('btn-claim-daily-grant');
    const hide = () => {
      modal.style.display = 'none';
      if (window.slotAudio && window.slotAudio.playClick) {
        window.slotAudio.playClick();
      }
    };
    if (closeBtn) closeBtn.onclick = hide;
    if (claimBtn) claimBtn.onclick = hide;
  }

  showExclusiveLockModal(mode, checkResult) {
    const modal = document.getElementById('exclusive-lock-modal');
    if (!modal) return;
    const titleEl = document.getElementById('exclusive-lock-title');
    const quotaEl = document.getElementById('exclusive-lock-quota-val');
    const descEl = document.getElementById('exclusive-lock-desc');
    const timerEl = document.getElementById('exclusive-lock-timer');
    const closeBtn = document.getElementById('btn-close-exclusive-lock');
    const okBtn = document.getElementById('btn-exclusive-lock-ok');

    const modeName = mode === 'vault' ? 'TREZOR (VAULT CRAWLER)' : 'SLOT BATTLE ROYALE';
    if (titleEl) titleEl.textContent = `EKSKLUZIVNOST: ${modeName}`;
    if (quotaEl) quotaEl.textContent = `ISKORIŠĆENO: ${checkResult.currentUsage} / ${checkResult.limit} ULAZAKA DANAS`;
    if (descEl) descEl.textContent = checkResult.reason || 'Dnevna kvota ekskluzivnih ulazaka je iskorišćena. U cilju očuvanja ekskluzivnosti i vrednosti nagrada, pristup se ponovo otvara u ponoć!';

    const updateTimer = () => {
      const ms = checkResult.resetInMs !== undefined ? checkResult.resetInMs : (this.dailyAccessManager ? this.dailyAccessManager.getMsUntilMidnight() : 0);
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      if (timerEl) {
        timerEl.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      }
    };
    updateTimer();

    modal.style.display = 'flex';
    if (this._lockTimerInterval) clearInterval(this._lockTimerInterval);
    this._lockTimerInterval = setInterval(updateTimer, 1000);

    const hide = () => {
      modal.style.display = 'none';
      if (this._lockTimerInterval) clearInterval(this._lockTimerInterval);
      if (window.slotAudio && window.slotAudio.playClick) {
        window.slotAudio.playClick();
      }
    };
    if (closeBtn) closeBtn.onclick = hide;
    if (okBtn) okBtn.onclick = hide;
  }

  switchGrandMode(mode) {
    if (window.slotAudio) window.slotAudio.playClick();

    // Zero-Lag Safe Cancel: Instant slam-stop any active slot spin on mode switch
    if (this.lobby && this.lobby.activeGame && this.lobby.activeGame.isSpinning) {
      if (typeof this.lobby.activeGame.slamStop === 'function') {
        this.lobby.activeGame.slamStop();
      } else if (typeof this.lobby.activeGame.forceExit === 'function') {
        this.lobby.activeGame.forceExit();
      }
    }

    // 1. Forfeit protection: Leaving active Trezor mid-run wipes all heist loot (only if player actually has loot)
    if (this.currentGrandMode === 'vault' && mode !== 'vault') {
      if (this.vaultCrawler && this.vaultCrawler.isActive && !this.vaultCrawler.isRunResolved) {
        if (this.vaultCrawler.currentRunLootZlt > 0) {
          const confirmExit = confirm('⚠️ NAPUŠTANJE TREZORA:\nDa li ste sigurni da želite da izađete pre kraja provale?\n\nIzlazak pre pobede ili poraza briše SVE zlatnike (ZLT) koje ste zaradili tokom ove provale!');
          if (!confirmExit) {
            const tabs = document.querySelectorAll('.hub-mode-tab');
            tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === 'vault'));
            return;
          }
        }
        this.vaultCrawler.forfeitRun();
      }
    }

    // 2. Forfeit protection: Leaving active Battle Royale mid-match wipes score & forfeits buy-in
    if (this.currentGrandMode === 'royale' && mode !== 'royale') {
      if (this.battleRoyale && this.battleRoyale.isActive && !this.battleRoyale.isMatchCompleted) {
        const confirmExit = confirm('⚠️ NAPUŠTANJE BATTLE ROYALE ARENE:\nDa li ste sigurni da želite da napustite meč?\n\nIzlazak pre kraja meča briše sve privremene poene i nepovratno gubite uplaćenu kotizaciju od 100 ZLT!');
        if (!confirmExit) {
          const tabs = document.querySelectorAll('.hub-mode-tab');
          tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === 'royale'));
          return;
        }
        this.battleRoyale.forfeitMatch();
      }
    }

    // Check operator daily access limits for Trezor and Battle Royale
    if (mode === 'vault' || mode === 'royale') {
      const playerId = this.playerTracker?.profile?.id || (this.dailyAccessManager ? this.dailyAccessManager.getCurrentPlayerId() : 'gsc_player_1');
      if (this.dailyAccessManager) {
        const check = this.dailyAccessManager.canEnterMode(playerId, mode);
        if (!check.allowed) {
          this.showExclusiveLockModal(mode, check);
          // Keep active tab synced with current allowed mode
          const tabs = document.querySelectorAll('.hub-mode-tab');
          tabs.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-mode') === (this.currentGrandMode || 'casino'));
          });
          return;
        }
        // Deduct/record entry
        this.dailyAccessManager.recordEntry(playerId, mode);
        this.updateModeQuotaPills();
      }
    }

    // 1. Instant Tab & Theme visual feedback on main UI thread
    const tabs = document.querySelectorAll('.hub-mode-tab');
    tabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });

    this.currentGrandMode = mode;
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('theme-casino', 'theme-vault', 'theme-royale');
      document.body.classList.add(`theme-${mode}`);
    }

    // Temporarily pause canvas ambient rendering to give 100% frame budget to mode transition
    if (window.particleEngine && typeof window.particleEngine.pauseAmbient === 'function') {
      window.particleEngine.pauseAmbient(450);
    }

    if (window.slotAudio && typeof window.slotAudio.setBgmMode === 'function') {
      window.slotAudio.setBgmMode(mode);
    }

    if (window.slotAudio && typeof window.slotAudio.switchProfile === 'function') {
      window.slotAudio.switchProfile(mode);
    }

    const container = document.querySelector('.game-container');

    const standaloneGameIds = ['crash', 'plinko', 'blackjack', 'mines', 'videopoker', 'holdem'];
    const standaloneViews = [
      'crash-game-view',
      'plinko-game-view',
      'blackjack-game-view',
      'videopoker-game-view',
      'casino-holdem-game-view',
      'mines-game-view'
    ];

    // Defer heavier subgame mounting and layout reflows to next animation frame
    requestAnimationFrame(() => {
      if (mode === 'vault' || mode === 'royale') {
        if (this.stageManager) {
          this.stageManager.mountView(mode);
        }

        // Strict rule: in Trezor and Battle Royale, only Royal 3x3 slot is permitted!
        if (this.lobby) {
          if (standaloneGameIds.includes(this.lobby.activeGameId)) {
            this.savedCasinoGameId = this.lobby.activeGameId;
            if (this.lobby.activeGame && typeof this.lobby.activeGame.unmount === 'function') {
              this.lobby.activeGame.unmount();
            }
          }
          if (this.lobby.activeGameId !== 'royal3x3') {
            this.lobby.switchGame('royal3x3');
          }
        }

        // Hide all standalone views
        standaloneViews.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });

        if (container) {
          container.classList.remove('in-mines-mode', 'in-crash-mode', 'in-plinko-mode', 'in-blackjack-mode', 'in-videopoker-mode', 'in-holdem-mode');
          container.classList.toggle('in-vault-mode', mode === 'vault');
          container.classList.toggle('in-royale-mode', mode === 'royale');
        }

        // Ensure slot UI is visible and properly scaled for Trezor / Royale combat
        const stage = document.querySelector('.slot-stage-scaler');
        if (stage) stage.style.display = 'flex';
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) controlsPanel.style.display = 'flex';
        const bannerWrap = document.querySelector('.status-banner-wrap');
        if (bannerWrap) bannerWrap.style.display = 'block';

        // Hide daily missions bar in Vault and Royale
        const missionsBar = document.getElementById('daily-missions-bar');
        if (missionsBar) missionsBar.style.display = 'none';

        if (mode === 'vault') {
          if (this.battleRoyale) this.battleRoyale.unmount();
          if (this.vaultCrawler) this.vaultCrawler.mount();
        } else {
          if (this.vaultCrawler) this.vaultCrawler.unmount();
          if (this.battleRoyale) this.battleRoyale.mount();
        }
      } else {
        // Regular Casino Salon
        if (this.stageManager) {
          const targetGame = this.savedCasinoGameId || (this.lobby ? this.lobby.activeGameId : 'slot') || 'slot';
          this.stageManager.mountView(targetGame);
        }
        if (this.vaultCrawler) this.vaultCrawler.unmount();
        if (this.battleRoyale) this.battleRoyale.unmount();

        // Ensure subgame mobile action docks are strictly hidden in clean Casino mode
        const vDock = document.getElementById('vault-mobile-dock');
        if (vDock) vDock.style.display = 'none';
        const rDock = document.getElementById('royale-mobile-dock');
        if (rDock) rDock.style.display = 'none';

        if (container) {
          container.classList.remove('in-vault-mode', 'in-royale-mode');
        }

        // Restore daily missions bar according to chosen casino style (casual vs daily)
        const missionsBar = document.getElementById('daily-missions-bar');
        if (missionsBar) {
          missionsBar.style.display = (this.casinoStyle === 'daily') ? 'flex' : 'none';
        }

        // If user came to Trezor from Crash, Plinko, Blackjack or Mines, restore that game!
        if (this.savedCasinoGameId) {
          const restoreId = this.savedCasinoGameId;
          this.savedCasinoGameId = null;
          this.lobby.switchGame(restoreId);
        } else if (this.lobby && standaloneGameIds.includes(this.lobby.activeGameId)) {
          this.lobby.activeGame.mount();
        } else {
          this.restoreSlotUI();
        }
      }

      if (this.lobby && typeof this.lobby.updateCurrentLabel === 'function') {
        this.lobby.updateCurrentLabel();
      }

      if (typeof window.updateSlotScale === 'function') {
        window.updateSlotScale();
      }

      if (this.dailyMissionsManager && this.casinoStyle === 'daily' && mode === 'casino') {
        this.dailyMissionsManager.renderBar();
      }
    });
  }

  /* ==========================================================================
     Smart Promotional Bonus Claims (Push Notifications)
     ========================================================================== */

  initPromoBonusListener() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CLAIM_PROMO_BONUS') {
          this.claimPromoBonus(event.data.promo);
        }
      });
    }
  }

  checkPromoBonusFromUrl() {
    if (typeof window === 'undefined' || !window.location.search) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('promo_action')) {
        const action = params.get('promo_action');
        const val = parseInt(params.get('promo_val'), 10) || 0;
        const title = params.get('promo_title') || '';
        const body = params.get('promo_body') || '';
        const img = params.get('promo_img') || '';
        const loc = params.get('promo_loc') || '';
        
        // Clean URL so refresh doesn't re-trigger
        window.history.replaceState({}, document.title, window.location.pathname);

        setTimeout(() => {
          this.claimPromoBonus({
            promoAction: action,
            promoValue: val,
            title,
            body,
            imageUrl: img,
            location: loc
          });
        }, 1200);
      }
    } catch (e) {
      console.warn('Promo URL parsing error:', e);
    }
  }

  claimPromoBonus(promo) {
    if (!promo || !promo.promoAction || promo.promoAction === 'none') return;

    if (promo.promoAction === 'free_spins') {
      const spins = Number(promo.promoValue) || 10;
      if (this.freeSpinsManager) {
        this.freeSpinsManager.start(spins, 2);
      }
      if (window.slotAudio && window.slotAudio.playBigWin) {
        window.slotAudio.playBigWin();
      }
      if (window.particleEngine && window.particleEngine.burst) {
        window.particleEngine.burst(300, 250);
      }
      this.showMessage(`🎰 POKLON PROMOCIJA: Aktivirano +${spins} BESPLATNIH SPINOVA (2x Množilac)!`, 'jackpot');
    } else if (promo.promoAction === 'credit_bonus') {
      const credits = Number(promo.promoValue) || 500;
      if (this.wallet && this.wallet.addFictionalRsd) {
        this.wallet.addFictionalRsd(credits);
      }
      if (window.slotAudio && window.slotAudio.playBigWin) {
        window.slotAudio.playBigWin();
      }
      if (window.particleEngine && window.particleEngine.burst) {
        window.particleEngine.burst(300, 250);
      }
      this.showMessage(`🎁 POKLON BONUS: Čestitamo! Vaš račun je dopunjen sa +${credits.toLocaleString()} ZLT!`, 'win');
    } else if (promo.promoAction === 'club_voucher' || promo.promoAction === 'interactive_promo' || promo.promoAction === 'voucher') {
      this.openVoucherModal({
        title: promo.title || 'VIP Promo Vaučer',
        description: promo.body || 'Prijavite se za ovu ekskluzivnu promociju i preuzmite svoj VIP vaučer za Grand Slot Club!',
        rewardValue: promo.promoValue || 1000,
        imageUrl: promo.imageUrl || 'assets/symbols/crystal-spade-clean.png',
        location: promo.location || 'Grand Slot Club Beograd'
      });
    }
  }

  /* ==========================================================================
     Lobby Weekly / Monthly Promo Banner & Custom Campaigns
     ========================================================================== */

  initPromoBanner() {
    this.activePromotion = null;
    this.promoTimerInterval = null;

    const bannerEl = document.getElementById('lobby-promo-banner');
    const openBtn = document.getElementById('btn-lobby-promo-open');

    if (bannerEl) {
      bannerEl.addEventListener('click', () => {
        if (this.activePromotion) {
          this.openPromotionModal(this.activePromotion);
        }
      });
    }

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activePromotion) {
          this.openPromotionModal(this.activePromotion);
        }
      });
    }

    this.loadActivePromotion();
  }

  loadActivePromotion() {
    let promo = null;
    try {
      const stored = localStorage.getItem('gsc_active_promo');
      if (stored) promo = JSON.parse(stored);
    } catch (e) {}

    if (!promo) {
      promo = {
        id: 'promo_vikend_reload',
        title: 'VIP VIKEND RELOAD TIKET',
        body: 'Preuzmite svoj VIP vaučer za igru na slot aparatima u našem klubu i duplirajte uzbuđenje!',
        imageUrl: 'assets/promotions/promo_weekend_vip.svg',
        location: 'Grand Slot Club - Kralja Milana 12, Beograd',
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        targetType: 'all',
        promoAction: 'voucher',
        promoValue: 1000,
        status: 'ACTIVE'
      };
      try {
        localStorage.setItem('gsc_active_promo', JSON.stringify(promo));
      } catch (e) {}
    }

    this.setActivePromotion(promo, false);
    // Note: Promotions are accessible via the header "VAUČERI" badge or "Moji Vaučeri" modal,
    // avoiding uninvited popups during launch or mode selection.
  }

  setActivePromotion(promo, shouldStore = true) {
    this.activePromotion = promo;
    if (shouldStore && promo) {
      try {
        localStorage.setItem('gsc_active_promo', JSON.stringify(promo));
      } catch (e) {}
    }

    const wrap = document.getElementById('lobby-promo-banner-wrap');
    if (!wrap) return;

    if (!promo || promo.status !== 'ACTIVE') {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = 'block';

    const imgEl = document.getElementById('lobby-promo-img');
    const titleEl = document.getElementById('lobby-promo-title');
    const descEl = document.getElementById('lobby-promo-desc');
    const rewardEl = document.getElementById('lobby-promo-reward-pill');
    const countdownEl = document.getElementById('lobby-promo-countdown');
    const badgeEl = document.getElementById('lobby-promo-badge');

    if (imgEl && promo.imageUrl) imgEl.src = promo.imageUrl;
    if (titleEl) titleEl.textContent = promo.title || 'VIP Promocija';
    if (descEl) descEl.textContent = promo.body || promo.description || 'Preuzmite ekskluzivni vaučer za igru!';
    if (badgeEl) badgeEl.textContent = promo.targetType === 'vip' ? '👑 SAMO ZA VIP ČLANOVE' : '⭐ EKSKLUZIVNA NEDELJNA PONUDA';

    // Format reward tag
    let rewardTag = '📢 OBAVEŠTENJE';
    const val = Number(promo.promoValue || promo.rewardValue) || 1000;
    if (promo.promoAction === 'voucher') rewardTag = `🎟️ ${val.toLocaleString()} ZLT VAUČER`;
    else if (promo.promoAction === 'voucher_drink') rewardTag = '🍸 WELCOME DRINK';
    else if (promo.promoAction === 'voucher_tour') rewardTag = '🏆 TURNIR ULAZNICA';
    else if (promo.promoAction === 'credit_bonus') rewardTag = `🪙 +${val.toLocaleString()} ZLT DOPUNA`;
    else if (promo.promoAction === 'free_spins') rewardTag = `🎰 +${val} FREE SPINOVA`;

    if (rewardEl) rewardEl.textContent = rewardTag;

    // Start live countdown timer on banner
    if (this.promoTimerInterval) clearInterval(this.promoTimerInterval);
    const updateCountdown = () => {
      if (!countdownEl || !promo.expiresAt) return;
      const diff = new Date(promo.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        countdownEl.textContent = '🔴 Promocija je istekla';
        countdownEl.style.color = '#ef4444';
      } else {
        const d = Math.floor(diff / (24 * 3600000));
        const h = Math.floor((diff % (24 * 3600000)) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        countdownEl.textContent = `⏳ Ističe za: ${d}d ${h}h ${m}m`;
        countdownEl.style.color = '#facc15';
      }
    };
    updateCountdown();
    this.promoTimerInterval = setInterval(updateCountdown, 60000);
  }

  openPromotionModal(promo = null) {
    if (!promo) promo = this.activePromotion;
    if (!promo) return;

    this.openVoucherModal({
      campaignId: promo.id,
      title: promo.title,
      description: promo.body || promo.description,
      imageUrl: promo.imageUrl,
      location: promo.location,
      rewardValue: promo.promoValue || promo.rewardValue || 1000,
      rewardType: promo.promoAction || promo.rewardType || 'voucher',
      promoAction: promo.promoAction || 'voucher',
      expiresAt: promo.expiresAt
    });
  }

  /* ==========================================================================
     Omnichannel VIP Voucher & Interactive Promotion Hub
     ========================================================================== */

  initVoucherHub() {
    this.activeVoucher = null;
    this.voucherCountdownInterval = null;

    try {
      const cached = localStorage.getItem('gsc_active_voucher');
      if (cached) {
        this.activeVoucher = JSON.parse(cached);
      }
    } catch (e) {}

    this.updateVoucherBadge();

    const hudBtn = document.getElementById('hud-voucher-btn');
    if (hudBtn) {
      hudBtn.addEventListener('click', () => {
        this.openVoucherModal();
      });
    }

    const closeBtn = document.getElementById('btn-close-voucher-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeVoucherModal());

    const doneBtn = document.getElementById('btn-done-voucher-card');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        try {
          localStorage.setItem('gsc_vip_voucher_claimed', 'true');
        } catch (e) {}
        if (this.activeVoucher) {
          this.saveVoucherToMyList(this.activeVoucher);
        }
        this.closeVoucherModal();
        this.showMessage('🎟️ VIP VAUČER SAČUVAN U "MOJI VAUČERI"!', 'win');
      });
    }

    const backBtn = document.getElementById('btn-back-to-promo-view');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.switchVoucherView('promo');
      });
    }

    const claimBtn = document.getElementById('btn-claim-promo-action');
    if (claimBtn) {
      claimBtn.addEventListener('click', async () => {
        await this.claimActivePromoVoucher();
        try {
          localStorage.setItem('gsc_vip_voucher_claimed', 'true');
        } catch (e) {}
        if (this.activeVoucher) {
          this.saveVoucherToMyList(this.activeVoucher);
        }
      });
    }

    const modal = document.getElementById('vip-voucher-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeVoucherModal();
      });
    }

    setTimeout(() => this.syncPlayerVouchers(), 2500);
  }

  updateVoucherBadge() {
    const badge = document.getElementById('hud-voucher-badge');
    if (!badge) return;

    if (this.activeVoucher && this.activeVoucher.status === 'ACTIVE') {
      const isExpired = new Date(this.activeVoucher.expires_at) < new Date();
      if (!isExpired) {
        badge.style.display = 'block';
        return;
      }
    }
    badge.style.display = 'none';
  }

  async syncPlayerVouchers() {
    const playerId = (this.playerTracker && this.playerTracker.profile && this.playerTracker.profile.id)
      ? this.playerTracker.profile.id
      : (localStorage.getItem('gsc_player_id') || 'gsc_player_1');

    if (typeof fetch === 'undefined') return;

    const localList = this.getMyVouchersList();
    const localCodes = localList.map(v => v.voucher_code).filter(Boolean);

    try {
      let queryUrl = `/api/vouchers/my?playerId=${encodeURIComponent(playerId)}`;
      if (localCodes.length > 0) {
        queryUrl += `&codes=${encodeURIComponent(localCodes.join(','))}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();

      if (data && data.success && Array.isArray(data.vouchers)) {
        let hasChanges = false;

        data.vouchers.forEach(dbV => {
          const dbCode = (dbV.voucher_code || '').trim().toUpperCase();
          const dbStatus = (dbV.status || '').toLowerCase(); // 'active', 'redeemed', 'expired'
          const localItem = localList.find(v => (v.voucher_code || '').trim().toUpperCase() === dbCode || v.id === dbV.id);

          if (localItem) {
            if (localItem.status !== dbStatus) {
              localItem.status = dbStatus;
              hasChanges = true;
            }
            if (dbV.redeemed_at) {
              const formattedRedeemedAt = new Date(dbV.redeemed_at).toLocaleString('sr-RS');
              if (localItem.redeemed_at !== formattedRedeemedAt) {
                localItem.redeemed_at = formattedRedeemedAt;
                hasChanges = true;
              }
            }
            if (dbV.redeemed_by_operator) {
              localItem.redeemed_by_operator = dbV.redeemed_by_operator;
            }
            if (dbV.redeemed_location) {
              localItem.redeemed_location = dbV.redeemed_location;
            }
          } else {
            // New voucher found in database for this player
            localList.unshift({
              id: dbV.id || ('v_' + Date.now()),
              title: dbV.title || 'VIP Promo Vaučer',
              reward_value: dbV.reward_value || 1000,
              reward_text: dbV.reward_text || (dbV.reward_value ? `${Number(dbV.reward_value).toLocaleString()} ZLT` : '1.000 ZLT'),
              desc: dbV.description || 'VIP Promo Vaučer u klubu',
              voucher_code: dbV.voucher_code,
              location: dbV.location || 'Grand Slot Club',
              status: dbStatus || 'active',
              expires_at: dbV.expires_at || new Date(Date.now() + 48 * 3600000).toISOString(),
              redeemed_at: dbV.redeemed_at ? new Date(dbV.redeemed_at).toLocaleString('sr-RS') : null,
              redeemed_by_operator: dbV.redeemed_by_operator || null,
              redeemed_location: dbV.redeemed_location || null,
              created_at: dbV.created_at ? new Date(dbV.created_at).toLocaleDateString('sr-RS') : new Date().toLocaleDateString('sr-RS')
            });
            hasChanges = true;
          }
        });

        if (hasChanges) {
          try {
            localStorage.setItem('gsc_my_vouchers_list', JSON.stringify(localList));
          } catch (e) {}
        }

        // Also update active voucher reference
        const active = data.vouchers.find(v => v.status === 'ACTIVE' && new Date(v.expires_at) > new Date());
        if (active) {
          this.activeVoucher = active;
          try { localStorage.setItem('gsc_active_voucher', JSON.stringify(active)); } catch (e) {}
        } else if (data.vouchers.length > 0) {
          this.activeVoucher = data.vouchers[0];
          try { localStorage.setItem('gsc_active_voucher', JSON.stringify(data.vouchers[0])); } catch (e) {}
        }

        this.updateVouchersCounter();

        // If the My Vouchers modal is currently open on screen, live-refresh the active tab!
        const myVouchersModal = document.getElementById('my-vouchers-modal');
        if (myVouchersModal && myVouchersModal.classList.contains('active')) {
          const currentTabBtn = myVouchersModal.querySelector('.voucher-tab-btn.active');
          const currentTab = currentTabBtn ? currentTabBtn.getAttribute('data-vtab') : 'active';
          this.renderMyVouchersList(currentTab);
        }

        // If a voucher card is open and was redeemed, update its pill live
        const ticketModal = document.getElementById('vip-voucher-modal');
        if (ticketModal && ticketModal.classList.contains('active') && this.activeVoucher) {
          const updatedActive = localList.find(v => v.voucher_code === this.activeVoucher.voucher_code);
          if (updatedActive && updatedActive.status === 'redeemed') {
            const statusPill = document.getElementById('ticket-status-pill');
            if (statusPill) {
              statusPill.textContent = '📜 ISKORIŠĆEN';
              statusPill.className = 'ticket-status-pill redeemed';
            }
          }
        }

        this.updateVoucherBadge();
      }
    } catch (e) {
      console.warn('syncPlayerVouchers error:', e);
    }
  }

  showVoucherTicket(voucher) {
    this.activeVoucher = voucher;
    try {
      localStorage.setItem('gsc_active_voucher', JSON.stringify(voucher));
    } catch (e) {}
    this.renderVoucherCard(voucher);
    this.switchVoucherView('card');
    const modal = document.getElementById('vip-voucher-modal');
    if (modal) modal.classList.add('active');
    this.updateVoucherBadge();
  }

  checkVoucherEligibility() {
    const missionsCompleted = (this.dailyMissionsManager && this.dailyMissionsManager.state && Array.isArray(this.dailyMissionsManager.state.missions))
      ? this.dailyMissionsManager.state.missions.filter(m => m.completed).length
      : 0;
    const spins = this.sessionSpinsCount || 0;
    const requiredSpins = 15;
    const requiredMissions = 2;

    const spinsPct = Math.min(100, Math.round((spins / requiredSpins) * 100));
    const missionsPct = Math.min(100, Math.round((missionsCompleted / requiredMissions) * 100));
    const highestPct = Math.max(spinsPct, missionsPct);

    const isEligible = (missionsCompleted >= requiredMissions) || (spins >= requiredSpins);

    const fillEl = document.getElementById('voucher-proof-fill');
    const statusLbl = document.getElementById('voucher-proof-status-lbl');
    const spinsLbl = document.getElementById('voucher-proof-spins-lbl');
    const missionsLbl = document.getElementById('voucher-proof-missions-lbl');
    const claimBtn = document.getElementById('btn-claim-promo-action');
    const playShortcutBtn = document.getElementById('btn-voucher-play-shortcut');

    if (fillEl) fillEl.style.width = `${highestPct}%`;
    if (spinsLbl) spinsLbl.textContent = `Spinovi u sesiji: ${spins} / ${requiredSpins}`;
    if (missionsLbl) missionsLbl.textContent = `Dnevne misije: ${missionsCompleted} / ${requiredMissions}`;

    if (statusLbl) {
      if (isEligible) {
        statusLbl.textContent = 'Otključano! Uslov ispunjen ✅';
        statusLbl.style.color = '#10b981';
      } else {
        statusLbl.textContent = `Zaključano (${spins}/${requiredSpins} spinova ili ${missionsCompleted}/${requiredMissions} misije)`;
        statusLbl.style.color = '#f59e0b';
      }
    }

    if (claimBtn && (!this.currentPromoData || this.currentPromoData.rewardType === 'club_ticket' || this.currentPromoData.rewardType === 'voucher')) {
      if (isEligible) {
        claimBtn.disabled = false;
        claimBtn.classList.remove('disabled');
        claimBtn.innerHTML = '🎟️ PREUZMI VIP VAUČER ZA KLUB';
      } else {
        claimBtn.disabled = true;
        claimBtn.classList.add('disabled');
        claimBtn.innerHTML = `🔒 ZAKLJUČANO (${highestPct}% ISPUNJENO)`;
      }
    }

    if (playShortcutBtn) {
      playShortcutBtn.style.display = isEligible ? 'none' : 'block';
    }

    return isEligible;
  }

  openVoucherModal(promoPayload = null) {
    const modal = document.getElementById('vip-voucher-modal');
    if (!modal) return;

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    modal.classList.add('active');

    const shortcutBtn = document.getElementById('btn-voucher-play-shortcut');
    if (shortcutBtn) {
      shortcutBtn.onclick = () => {
        this.closeVoucherModal();
        if (this.lobby && typeof this.lobby.selectGame === 'function') {
          this.lobby.selectGame('classic');
        }
      };
    }

    if (promoPayload) {
      this.setupPromoViewData(promoPayload);
      this.switchVoucherView('promo');
    } else if (this.activeVoucher) {
      this.renderVoucherCard(this.activeVoucher);
      this.switchVoucherView('card');
    } else {
      this.setupPromoViewData({
        title: 'VIP Promo Tiket 1.000 ZLT',
        description: 'Ispunite uslov igre u aplikaciji i preuzmite lični VIP QR vaučer za igru na slot aparatima u Grand Slot Club-u!',
        rewardValue: 1000,
        rewardType: 'club_ticket',
        location: 'Grand Slot Club - Kralja Milana 12, Beograd',
        validHours: 48
      });
      this.switchVoucherView('promo');
    }

    this.checkVoucherEligibility();
  }

  closeVoucherModal() {
    const modal = document.getElementById('vip-voucher-modal');
    if (modal) modal.classList.remove('active');
    if (this.voucherCountdownInterval) {
      clearInterval(this.voucherCountdownInterval);
      this.voucherCountdownInterval = null;
    }
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  switchVoucherView(viewName) {
    const viewPromo = document.getElementById('voucher-view-promo');
    const viewCard = document.getElementById('voucher-view-card');
    if (viewPromo && viewCard) {
      viewPromo.classList.toggle('active', viewName === 'promo');
      viewCard.classList.toggle('active', viewName === 'card');
    }
  }

  setupPromoViewData(data) {
    this.currentPromoData = data;
    const titleEl = document.getElementById('voucher-promo-title');
    const descEl = document.getElementById('voucher-promo-desc');
    const tagEl = document.getElementById('voucher-promo-value-tag');
    const locEl = document.getElementById('voucher-promo-location');
    const validEl = document.getElementById('voucher-promo-validity');
    const imgEl = document.getElementById('voucher-promo-img');
    const claimBtn = document.getElementById('btn-claim-promo-action');

    const title = data.title || 'Grand Slot VIP Promocija';
    const desc = data.description || data.body || 'Preuzmite lični VIP vaučer za klub!';
    const val = Number(data.rewardValue || data.promoValue || 1000);
    const action = data.promoAction || data.rewardType || 'voucher';

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (locEl) locEl.textContent = data.location || 'Grand Slot Club Beograd';
    if (imgEl && data.imageUrl) imgEl.src = data.imageUrl;

    // Remaining validity
    if (validEl) {
      if (data.expiresAt) {
        const diff = new Date(data.expiresAt).getTime() - Date.now();
        if (diff > 0) {
          const d = Math.floor(diff / (24 * 3600000));
          const h = Math.floor((diff % (24 * 3600000)) / 3600000);
          validEl.textContent = `${d} dana ${h} sati`;
        } else {
          validEl.textContent = 'Istekla';
        }
      } else {
        validEl.textContent = `${data.validHours || 48} sati`;
      }
    }

    // Dynamic Reward & Button Config
    if (claimBtn) {
      claimBtn.disabled = false;
      // clone button to strip old listeners
      const newBtn = claimBtn.cloneNode(true);
      claimBtn.parentNode.replaceChild(newBtn, claimBtn);

      if (action === 'credit_bonus') {
        if (tagEl) tagEl.textContent = `🪙 +${val.toLocaleString()} ZLT ONLINE DOPUNA`;
        newBtn.innerHTML = `🪙 PREUZMI +${val.toLocaleString()} ZLT ODMAH`;
        newBtn.addEventListener('click', () => {
          if (this.wallet && this.wallet.addFictionalRsd) {
            this.wallet.addFictionalRsd(val);
          }
          if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
          if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);
          this.closeVoucherModal();
          this.showMessage(`🎁 Čestitamo! Vaš račun je dopunjen sa +${val.toLocaleString()} ZLT!`, 'win');
        });
      } else if (action === 'free_spins') {
        if (tagEl) tagEl.textContent = `🎰 +${val} BESPLATNIH SPINOVA`;
        newBtn.innerHTML = `🎰 ZAPOČNI +${val} BESPLATNIH SPINOVA`;
        newBtn.addEventListener('click', () => {
          if (this.freeSpinsManager) this.freeSpinsManager.start(val, 2);
          if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
          if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);
          this.closeVoucherModal();
          this.showMessage(`🎰 Aktivirano +${val} BESPLATNIH SPINOVA (2x Množilac)!`, 'jackpot');
        });
      } else if (action === 'voucher_tour') {
        if (tagEl) tagEl.textContent = '🏆 VIP ULAZNICA ZA TURNIR (50.000 ZLT)';
        newBtn.innerHTML = '🏆 PREUZMI VIP ULAZNICU ZA TURNIR';
        newBtn.addEventListener('click', () => {
          if (!this.checkVoucherEligibility()) {
            this.showMessage('⚠️ Morate ispuniti Proof-of-Play uslov pre preuzimanja turnirske nagrade!', 'normal');
            return;
          }
          this.claimActivePromoVoucher();
        });
      } else if (action === 'none') {
        if (tagEl) tagEl.textContent = '📢 KAZINO OBAVEŠTENJE';
        newBtn.innerHTML = '👍 RAZUMEM / NASTAVI IGRU';
        newBtn.addEventListener('click', () => this.closeVoucherModal());
      } else {
        if (tagEl) tagEl.textContent = `🎟️ +${val.toLocaleString()} ZLT PROMO VAUČER`;
        newBtn.innerHTML = `🎟️ PREUZMI VIP VAUČER ZA KLUB (${val.toLocaleString()} ZLT)`;
        newBtn.addEventListener('click', () => {
          if (!this.checkVoucherEligibility()) {
            this.showMessage('⚠️ Morate ispuniti Proof-of-Play uslov (15 spinova ili 2 misije) pre preuzimanja vaučera!', 'normal');
            return;
          }
          this.claimActivePromoVoucher();
        });
      }
    }

    this.checkVoucherEligibility();
  }

  async claimActivePromoVoucher() {
    if (!this.checkVoucherEligibility()) {
      this.showMessage('⚠️ Preuzimanje vaučera je zaključano dok ne ispunite uslov igre!', 'normal');
      return;
    }

    const btn = document.getElementById('btn-claim-promo-action');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Generisanje ličnog vaučera...';
    }

    const playerId = this.playerTracker ? this.playerTracker.profile.id : ('gsc_usr_' + Math.floor(1000 + Math.random() * 9000));
    const pData = this.currentPromoData || {};

    const payload = {
      playerId,
      campaignId: pData.campaignId || 'vip_promo',
      title: pData.title || 'VIP Promo Tiket 1.000 ZLT',
      description: pData.description || '1.000 ZLT Promo Tiket za slot aparate u klubu',
      imageUrl: pData.imageUrl || 'assets/symbols/crystal-spade-clean.png',
      rewardType: pData.rewardType || 'club_ticket',
      rewardValue: Number(pData.rewardValue || pData.promoValue || 1000),
      location: pData.location || 'Grand Slot Club - Kralja Milana 12, Beograd',
      validHours: Number(pData.validHours || 48)
    };

    try {
      const res = await fetch('/api/vouchers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success && data.voucher) {
        this.activeVoucher = data.voucher;
        localStorage.setItem('gsc_active_voucher', JSON.stringify(data.voucher));
        this.saveVoucherToMyList(data.voucher);

        if (window.slotAudio && window.slotAudio.playBigWin) window.slotAudio.playBigWin();
        if (window.particleEngine && window.particleEngine.burst) window.particleEngine.burst(300, 250);

        this.renderVoucherCard(data.voucher);
        this.switchVoucherView('card');
        this.updateVoucherBadge();
        this.showMessage('🎫 ČESTITAMO! VAŠ VIP VAUČER ZA KLUB JE SPREMAN!', 'win');
      } else {
        alert(data.error || 'Nije uspelo preuzimanje vaučera.');
      }
    } catch (e) {
      const fakeVoucher = {
        voucher_code: 'GSC-' + Math.floor(1000 + Math.random() * 9000) + '-VIP',
        title: payload.title,
        reward_value: payload.rewardValue,
        location: payload.location,
        expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
        status: 'ACTIVE'
      };
      this.activeVoucher = fakeVoucher;
      localStorage.setItem('gsc_active_voucher', JSON.stringify(fakeVoucher));
      this.saveVoucherToMyList(fakeVoucher);
      this.renderVoucherCard(fakeVoucher);
      this.switchVoucherView('card');
      this.updateVoucherBadge();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✅ PRIJAVI SE I PREUZMI VIP VAUČER';
      }
    }
  }

  renderVoucherCard(voucher) {
    const p = this.playerTracker ? this.playerTracker.profile : null;
    const playerNick = (p && (p.nickname || p.username)) ? (p.nickname || p.username) : 'VIP Član';
    const isVip = Boolean(p && (p.vipTier === 'VIP' || p.isLoggedIn));

    const nameEl = document.getElementById('ticket-player-name');
    const vipEl = document.getElementById('ticket-vip-tag');
    const amtEl = document.getElementById('ticket-reward-amount');
    const titleEl = document.getElementById('ticket-reward-title');
    const codeEl = document.getElementById('ticket-code-val');
    const statusPill = document.getElementById('ticket-status-pill');

    if (nameEl) nameEl.textContent = playerNick;
    if (vipEl) vipEl.style.display = isVip ? 'inline-block' : 'none';
    if (amtEl) amtEl.textContent = Number(voucher.reward_value || 1000).toLocaleString() + ' ZLT';
    if (titleEl) titleEl.textContent = voucher.title || 'Fizički Promo Tiket za Slot Aparate';
    if (codeEl) codeEl.textContent = voucher.voucher_code || 'GSC-VIP';

    if (statusPill) {
      if (voucher.status === 'REDEEMED') {
        statusPill.textContent = '📜 ISKORIŠĆEN';
        statusPill.className = 'ticket-status-pill redeemed';
      } else {
        statusPill.textContent = '🟢 AKTIVAN';
        statusPill.className = 'ticket-status-pill';
      }
    }

    const qrContainer = document.getElementById('ticket-qr-container');
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      try {
        const qrPayload = JSON.stringify({
          code: voucher.voucher_code,
          player: this.playerTracker ? this.playerTracker.profile.id : '',
          val: voucher.reward_value
        });
        new QRCode(qrContainer, {
          text: qrPayload,
          width: 146,
          height: 146,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (e) {
        console.warn('QRCode generation fallback:', e);
      }
    }

    if (this.voucherCountdownInterval) clearInterval(this.voucherCountdownInterval);

    const updateTimer = () => {
      const timerEl = document.getElementById('ticket-countdown-val');
      if (!timerEl) return;

      const diffMs = new Date(voucher.expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        timerEl.textContent = 'ISTEKAO';
        timerEl.style.color = '#ef4444';
        if (statusPill) {
          statusPill.textContent = '⚠️ ISTEKAO';
          statusPill.className = 'ticket-status-pill redeemed';
        }
        return;
      }

      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      timerEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    updateTimer();
    this.voucherCountdownInterval = setInterval(updateTimer, 1000);
  }

  // =========================================================================
  // DEDICATED "MOJI VAUČERI" MANAGEMENT SYSTEM
  // =========================================================================
  getMyVouchersList() {
    try {
      const stored = localStorage.getItem('gsc_my_vouchers_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Initial default seed so the player immediately has rich data
    const defaults = [
      {
        id: 'v_halloween_vip',
        title: 'VIP VIKEND RELOAD TIKET',
        reward_value: 1000,
        reward_text: '1.000 ZLT VAUČER',
        desc: 'Fizički VIP tiket za slot aparate u našem klubu',
        voucher_code: 'GSC-7842-VIP',
        location: 'Grand Slot Club Banovo Brdo, Kirovljeva 14',
        status: 'active',
        expires_at: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
        created_at: '01.11.2026'
      },
      {
        id: 'v_welcome_cocktail',
        title: 'PREMIUM KOKTEL DOBRODOŠLICE',
        reward_value: 0,
        reward_text: 'GRATIS PIĆE',
        desc: 'Besplatno piće na šanku kluba za VIP člana',
        voucher_code: 'GSC-KOKTEL-81',
        location: 'Grand Slot Club Banovo Brdo',
        status: 'redeemed',
        redeemed_at: '28.10.2026 21:30',
        created_at: '28.10.2026'
      },
      {
        id: 'v_oct_slots',
        title: 'OKTOBARSKI RELOAD VAUČER',
        reward_value: 500,
        reward_text: '500 ZLT VAUČER',
        desc: 'Promotivni bonus tiket za automate',
        voucher_code: 'GSC-OCT-1029',
        location: 'Grand Slot Club Beograd',
        status: 'expired',
        expires_at: '20.10.2026',
        created_at: '15.10.2026'
      }
    ];

    try {
      localStorage.setItem('gsc_my_vouchers_list', JSON.stringify(defaults));
    } catch (e) {}
    return defaults;
  }

  saveVoucherToMyList(voucher) {
    if (!voucher) return;
    const list = this.getMyVouchersList();
    const existingIdx = list.findIndex(v => v.voucher_code === voucher.voucher_code || v.id === voucher.id);
    const formatted = {
      id: voucher.id || ('v_' + Date.now()),
      title: voucher.title || 'VIP Promo Vaučer',
      reward_value: voucher.reward_value || 1000,
      reward_text: voucher.reward_text || (voucher.reward_value ? `${Number(voucher.reward_value).toLocaleString()} ZLT` : '1.000 ZLT'),
      desc: voucher.description || voucher.desc || 'Fizički VIP tiket za slot aparate u našem klubu',
      voucher_code: voucher.voucher_code || ('GSC-' + Math.floor(1000 + Math.random() * 9000) + '-VIP'),
      location: voucher.location || 'Grand Slot Club Banovo Brdo',
      status: voucher.status ? voucher.status.toLowerCase() : 'active',
      expires_at: voucher.expires_at || new Date(Date.now() + 48 * 3600000).toISOString(),
      created_at: new Date().toLocaleDateString('sr-RS')
    };

    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...formatted };
    } else {
      list.unshift(formatted);
    }

    try {
      localStorage.setItem('gsc_my_vouchers_list', JSON.stringify(list));
    } catch (e) {}

    this.updateVouchersCounter();
  }

  updateVouchersCounter() {
    const list = this.getMyVouchersList();
    const activeCount = list.filter(v => v.status === 'active').length;
    const redeemedCount = list.filter(v => v.status === 'redeemed').length;
    const expiredCount = list.filter(v => v.status === 'expired').length;

    const headerCounter = document.getElementById('header-voucher-counter');
    if (headerCounter) {
      headerCounter.textContent = activeCount;
      headerCounter.style.display = activeCount > 0 ? 'inline-flex' : 'none';
    }

    const countActive = document.getElementById('count-vouchers-active');
    const countRedeemed = document.getElementById('count-vouchers-redeemed');
    const countExpired = document.getElementById('count-vouchers-expired');

    if (countActive) countActive.textContent = activeCount;
    if (countRedeemed) countRedeemed.textContent = redeemedCount;
    if (countExpired) countExpired.textContent = expiredCount;
  }

  async openMyVouchersModal(tab = 'active') {
    const modal = document.getElementById('my-vouchers-modal');
    if (!modal) return;

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    this.renderMyVouchersList(tab);
    modal.classList.add('active');

    // Trigger instant background sync with database to ensure latest redemption status
    await this.syncPlayerVouchers();
  }

  closeMyVouchersModal() {
    const modal = document.getElementById('my-vouchers-modal');
    if (modal) modal.classList.remove('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  renderMyVouchersList(filterTab = 'active') {
    this.updateVouchersCounter();

    // Update active tab button
    const tabs = document.querySelectorAll('.voucher-tab-btn');
    tabs.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-vtab') === filterTab);
    });

    const listContainer = document.getElementById('my-vouchers-list');
    if (!listContainer) return;

    const list = this.getMyVouchersList();
    const filtered = list.filter(v => v.status === filterTab);

    if (filtered.length === 0) {
      const tabNames = { active: 'aktivnih', redeemed: 'iskorišćenih', expired: 'isteklih' };
      listContainer.innerHTML = `
        <div class="my-vouchers-empty-state">
          <div class="empty-icon">🎟️</div>
          <h3>Trenutno nema ${tabNames[filterTab] || ''} vaučera</h3>
          <p>Učestvujte u dnevnim misijama i posetite naš klub za nove VIP kupone!</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(v => {
      const isAct = v.status === 'active';
      const isRed = v.status === 'redeemed';
      const isExp = v.status === 'expired';

      let statusBadge = '<span class="voucher-status-pill pill-active">🟢 AKTIVAN</span>';
      let cardClass = 'voucher-item-card active-ticket';
      let actionBtn = `<button type="button" class="btn-voucher-item-action primary btn-show-voucher-code" data-code="${v.voucher_code}">👁️ PRIKAŽI KOD &amp; QR</button>`;

      if (isRed) {
        statusBadge = '<span class="voucher-status-pill pill-redeemed">🔵 ISKORIŠĆENO</span>';
        cardClass = 'voucher-item-card redeemed-ticket';
        actionBtn = `<button type="button" class="btn-voucher-item-action secondary" disabled>✔️ ISKORIŠĆENO NA BLAGAJNI</button>`;
      } else if (isExp) {
        statusBadge = '<span class="voucher-status-pill pill-expired">⚪ ISTEKLO</span>';
        cardClass = 'voucher-item-card expired-ticket';
        actionBtn = `<button type="button" class="btn-voucher-item-action secondary" disabled>⚪ ISTEKAO ROK VAŽENJA</button>`;
      }

      html += `
        <div class="${cardClass}">
          <div class="voucher-item-head">
            <span class="voucher-item-title">${v.title}</span>
            ${statusBadge}
          </div>
          <div class="voucher-item-value-row">
            <span class="voucher-item-value">${v.reward_text || (v.reward_value ? v.reward_value + ' ZLT' : '1.000 ZLT')}</span>
            <span style="font-size: 0.72rem; color: #fbbf24; font-weight: 800; font-family: monospace;">KOD: ${v.voucher_code}</span>
          </div>
          <p style="font-size: 0.75rem; color: #cbd5e1; margin: 0;">${v.desc}</p>
          <div class="voucher-item-meta">
            <span>📍 ${v.location}</span>
            <span>⏳ ${isAct ? 'Važi do: ' + new Date(v.expires_at).toLocaleDateString('sr-RS') : (isRed ? (v.redeemed_at || 'Iskorišćeno') : 'Isteklo: ' + (v.expires_at ? new Date(v.expires_at).toLocaleDateString('sr-RS') : 'Ranije'))}</span>
          </div>
          <div class="voucher-item-actions">
            ${actionBtn}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Attach click events on "Prikaži Kod & QR"
    listContainer.querySelectorAll('.btn-show-voucher-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const voucher = list.find(item => item.voucher_code === code);
        if (voucher) {
          this.closeMyVouchersModal();
          this.showVoucherTicket(voucher);
        }
      });
    });
  }

  restoreSlotUI() {
    if (this.stageManager) {
      this.stageManager.mountView('slot');
    }

    const stage = document.querySelector('.slot-stage-scaler');
    if (stage) stage.style.display = 'flex';

    const controlsPanel = document.querySelector('.controls-panel');
    if (controlsPanel) controlsPanel.style.display = 'flex';

    const bannerWrap = document.querySelector('.status-banner-wrap');
    if (bannerWrap) bannerWrap.style.display = 'block';

    const standaloneViews = [
      'crash-game-view',
      'plinko-game-view',
      'blackjack-game-view',
      'videopoker-game-view',
      'casino-holdem-game-view',
      'mines-game-view'
    ];
    standaloneViews.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    const container = document.querySelector('.game-container');
    if (container) {
      container.classList.remove('in-mines-mode', 'in-crash-mode', 'in-plinko-mode', 'in-blackjack-mode', 'in-videopoker-mode', 'in-holdem-mode');
    }

    // Ensure no residual multiplayer overlays bleed into Casino or Trezor
    const freezeOverlay = document.getElementById('reel-frozen-overlay');
    if (freezeOverlay && freezeOverlay.parentNode) freezeOverlay.parentNode.removeChild(freezeOverlay);
    const smokeOverlay = document.getElementById('smoke-screen-overlay');
    if (smokeOverlay && smokeOverlay.parentNode) smokeOverlay.parentNode.removeChild(smokeOverlay);

    this.updateSpinButtonState();
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
      const isSpinning = (this.lobby && this.lobby.activeGame && this.lobby.activeGame.isSpinning) || (this.miniMines && this.miniMines.isActive);
      this.spinBtn.disabled = !!isSpinning;
      this.spinBtn.classList.toggle('disabled', !!isSpinning);

      // Mobile Watchdog: if animation dropped or browser tab throttled, force unfreeze
      if (isSpinning) {
        if (this.spinWatchdog) clearTimeout(this.spinWatchdog);
        this.spinWatchdog = setTimeout(() => {
          if (this.lobby && this.lobby.activeGame) {
            this.lobby.activeGame.isSpinning = false;
          }
          if (this.spinBtn) {
            this.spinBtn.disabled = false;
            this.spinBtn.classList.remove('disabled');
          }
          if (window.particleEngine && typeof window.particleEngine.resumeAmbient === 'function') {
            window.particleEngine.resumeAmbient();
          }
        }, 4200);
      } else {
        if (this.spinWatchdog) {
          clearTimeout(this.spinWatchdog);
          this.spinWatchdog = null;
        }
      }
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

    // Track Proof-of-Play spins for physical club voucher unlocking
    this.sessionSpinsCount = (this.sessionSpinsCount || 0) + 1;
    this.checkVoucherEligibility();

    const { winAmount, winMultiplier, isDiamondBonus, winningLines } = result;

    // Record spin in PlayerTracker
    if (this.playerTracker) {
      const activeGameId = (this.lobby && this.lobby.activeGameId) || 'classic';
      this.playerTracker.recordSpin(activeGameId, this.wallet.bet, winAmount);
    }

    // Record spin in Prestige Leaderboard (Casino Pillar)
    if (window.prestigeManager) {
      window.prestigeManager.recordCasinoSpin(this.wallet.bet, winAmount);
    }

    // Record spin in Daily Missions (Slot Task)
    if (window.dailyMissionsManager) {
      window.dailyMissionsManager.recordSlotSpin();
    }

    if (this.tournament && this.tournament.isActive && winAmount > 0) {
      this.tournament.onSpinWin(winAmount);
    }

    // Forward spin result to The Vault Crawler if active
    if (this.vaultCrawler && this.vaultCrawler.isActive) {
      this.vaultCrawler.handleSpinResult(winAmount, result.symbols || []);
    }

    // Forward spin result to Slot-Battle Royale if active
    if (this.battleRoyale && this.battleRoyale.isActive) {
      this.battleRoyale.handleSpinResult(winAmount, result.symbols || []);
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
        ? `💎 DIAMOND JACKPOT! +${prize.toLocaleString()} KREDITA! 💎`
        : (tier === 'gold' 
          ? `🏆 GOLD JACKPOT! +${prize.toLocaleString()} KREDITA! 🏆`
          : `🥈 SILVER JACKPOT! +${prize.toLocaleString()} KREDITA! 🥈`);
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

  async initPlayerSession() {
    const loginModal = document.getElementById('login-modal');
    if (this.playerTracker && this.playerTracker.getAuthToken()) {
      try {
        const res = await this.playerTracker.checkSession();
        if (res && res.success && res.player) {
          if (this.wallet && res.player.balance_rsd != null) {
            this.wallet.setBalanceFromAuth(res.player.balance_rsd);
          }
          if (typeof window.updateHeaderProfile === 'function') {
            window.updateHeaderProfile();
          }
          if (loginModal) loginModal.classList.remove('active');
          return true;
        }
      } catch (err) {
        console.warn('Init session check error:', err);
      }
    }

    return false;
  }

  initControls() {
    if (this.spinBtn) {
      let lastTrigger = 0;
      const doSpin = (e) => {
        if (e && e.type === 'pointerdown') {
          // Prevent mobile 300ms delayed click synthesis and accidental gesture scrolling on spin thumb
          if (e.cancelable) e.preventDefault();
        }
        const now = Date.now();
        if (now - lastTrigger < 320) return; // Debounce double-triggering
        lastTrigger = now;
        this.spin();
      };

      this.spinBtn.addEventListener('click', doSpin);
      this.spinBtn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          doSpin(e);
        }
      });
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
        const msg = `DENOMINACIJA: 1 KR = ${this.wallet.activeDenom} ZLT`;
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
          this.updateCasinoMenuUI();
        }
      });
    }

    const tournamentBtn = document.getElementById('tournament-btn');
    if (tournamentBtn && this.tournament) {
      tournamentBtn.addEventListener('click', () => {
        this.tournament.openModal();
      });
    }

    this.initCasinoMenu();
  }

  // Deprecated in-game volatility modal (now managed exclusively via standalone admin.html)
  openVolatilityModal() {}
  closeVolatilityModal() {}
  initVolatilityModal() {}
  updateVolatilityUI() {}

  /* ==========================================================================
     UNIFIED CASINO MENU (Tablet & Mobile Sleek Hub)
     ========================================================================== */
  openCasinoMenu() {
    const modal = document.getElementById('casino-menu-modal');
    if (modal) modal.classList.add('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
    this.updateCasinoMenuUI();
  }

  closeCasinoMenu() {
    const modal = document.getElementById('casino-menu-modal');
    if (modal) modal.classList.remove('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  updateCasinoMenuUI() {
    // 1. Volatility badge in menu
    const volBadge = document.getElementById('menu-current-volatility-badge');
    if (volBadge && this.mathManager) {
      const activeId = this.mathManager.activePreset;
      volBadge.textContent = (activeId === 'standard' ? 'STD' : (activeId === 'low' ? 'LOW' : (activeId === 'high' ? 'HIGH' : '100%')));
    }

    // 2. Language badge in menu
    const langBadge = document.getElementById('menu-current-lang-badge');
    if (langBadge && window.i18n) {
      langBadge.textContent = (window.i18n.currentLang || 'sr').toUpperCase();
    }

    // 3. Ambient badge in menu
    const ambBadge = document.getElementById('menu-ambient-status-badge');
    if (ambBadge && window.slotAudio) {
      const isAmb = !!window.slotAudio.isAmbientPlaying;
      ambBadge.textContent = isAmb ? 'ON' : 'OFF';
      ambBadge.className = 'menu-pill-badge ' + (isAmb ? 'badge-green' : '');
    }

    // 4. Sound badge & icon in menu
    const sndBadge = document.getElementById('menu-sound-status-badge');
    const sndIcon = document.getElementById('menu-sound-icon');
    if (sndBadge && window.slotAudio) {
      const isMuted = !!window.slotAudio.isMuted;
      sndBadge.textContent = isMuted ? 'OFF' : 'ON';
      sndBadge.className = 'menu-pill-badge ' + (isMuted ? '' : 'badge-green');
      if (sndIcon) sndIcon.textContent = isMuted ? '🔇' : '🔊';
    }

    // 5. Notifications badge in menu
    if (this.notifications) {
      this.notifications.updateUI();
    }
  }

  initCasinoMenu() {
    const modal = document.getElementById('casino-menu-modal');
    const openBtn = document.getElementById('casino-menu-btn');
    const closeBtn = document.getElementById('casino-menu-close');
    const returnBtn = document.getElementById('btn-menu-close-action');

    if (openBtn) openBtn.addEventListener('click', () => this.openCasinoMenu());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCasinoMenu());
    if (returnBtn) returnBtn.addEventListener('click', () => this.closeCasinoMenu());

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeCasinoMenu();
      });
    }


    // Option 1: Izbor Igara (Lobi)
    const optLobby = document.getElementById('menu-opt-lobby');
    if (optLobby) {
      optLobby.addEventListener('click', () => {
        this.closeCasinoMenu();
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        setTimeout(() => {
          if (window.casinoLobby && typeof window.casinoLobby.openModal === 'function') {
            window.casinoLobby.openModal();
          }
        }, 120);
      });
    }

    // Option 2: Tournament
    const optTournament = document.getElementById('menu-opt-tournament');
    if (optTournament) {
      optTournament.addEventListener('click', () => {
        this.closeCasinoMenu();
        if (this.tournament) {
          setTimeout(() => this.tournament.openModal(), 120);
        }
      });
    }

    // Option 3: VIP Vaučeri & Promocije (Moji Vaučeri: Aktivni, Iskorišćeni, Istekli)
    const optVoucher = document.getElementById('menu-opt-voucher');
    if (optVoucher) {
      optVoucher.addEventListener('click', () => {
        this.closeCasinoMenu();
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        setTimeout(() => {
          if (typeof this.openMyVouchersModal === 'function') {
            this.openMyVouchersModal('active');
          } else {
            this.openVoucherModal();
          }
        }, 120);
      });
    }

    // Option 3: Player Profile & Deposit
    const optProfile = document.getElementById('menu-opt-profile');
    if (optProfile) {
      optProfile.addEventListener('click', () => {
        this.closeCasinoMenu();
        setTimeout(() => {
          if (typeof this.openProfileModal === 'function') {
            this.openProfileModal();
          }
        }, 120);
      });
    }

    // Option 4: Paytable & Rules
    const optPaytable = document.getElementById('menu-opt-paytable');
    if (optPaytable) {
      optPaytable.addEventListener('click', () => {
        this.closeCasinoMenu();
        const paytableModal = document.getElementById('paytable-modal');
        if (paytableModal) {
          setTimeout(() => {
            if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
            paytableModal.classList.add('active');
          }, 120);
        }
      });
    }

    // Option 5: Language Toggle
    const optLang = document.getElementById('menu-opt-lang');
    if (optLang) {
      optLang.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
        if (window.i18n) {
          window.i18n.toggleLanguage();
          this.updateCasinoMenuUI();
        }
      });
    }

    // Option 6: Casino Ambience Toggle
    const optAmbient = document.getElementById('menu-opt-ambient');
    if (optAmbient) {
      optAmbient.addEventListener('click', () => {
        if (window.slotAudio) {
          const isPlaying = window.slotAudio.toggleCasinoAmbient();
          const ambientBtn = document.getElementById('ambient-btn');
          if (ambientBtn) ambientBtn.classList.toggle('active', isPlaying);
          this.updateCasinoMenuUI();
          const isEn = window.i18n && window.i18n.currentLang === 'en';
          const msg = isPlaying 
            ? (isEn ? '🔊 CASINO AMBIENCE ON' : '🔊 VEGAS CASINO AMBIJENT UKLJUČEN') 
            : (isEn ? 'CASINO AMBIENCE MUTED' : 'CASINO AMBIJENT UTIŠAN');
          this.showMessage(msg, 'info');
        }
      });
    }

    // Option 7: Sound Effects Toggle
    const optSound = document.getElementById('menu-opt-sound');
    if (optSound) {
      optSound.addEventListener('click', () => {
        if (window.slotAudio) {
          const isMuted = window.slotAudio.toggleMute();
          const soundBtn = document.getElementById('sound-btn');
          if (soundBtn) {
            soundBtn.classList.toggle('muted', isMuted);
            const onIcon = soundBtn.querySelector('.sound-on-icon');
            const offIcon = soundBtn.querySelector('.sound-off-icon');
            if (onIcon && offIcon) {
              onIcon.style.display = isMuted ? 'none' : 'block';
              offIcon.style.display = isMuted ? 'block' : 'none';
            }
          }
          this.updateCasinoMenuUI();
        }
      });
    }

    // Option 8: Official Website Link
    const optWebsite = document.getElementById('menu-opt-website');
    if (optWebsite) {
      optWebsite.addEventListener('click', () => {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      });
    }

    // Option 9: Push Notifications Toggle
    const optNotif = document.getElementById('menu-opt-notifications');
    if (optNotif) {
      optNotif.addEventListener('click', () => {
        if (this.notifications) {
          this.notifications.toggle();
        }
      });
    }

    // Option 10: PWA App Installation
    const optInstall = document.getElementById('menu-opt-install');
    if (optInstall) {
      optInstall.addEventListener('click', () => {
        this.closeCasinoMenu();
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
          installBtn.click();
        }
      });
    }

    this.updateCasinoMenuUI();
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
    const isVaultOpen = (app.currentGrandMode === 'vault');
    const isRoyaleOpen = (app.currentGrandMode === 'royale');
    const hasActiveSubgame = (isVaultOpen || isRoyaleOpen);

    const baseW = isFullFocus ? 416 : 514;
    const padW = vw <= 370 ? 12 : (vw <= 480 ? 16 : 28);
    const availW = Math.max(220, vw - padW);
    const scaleW = Math.min(1.15, availW / baseW);

    const baseH = is3x3 ? 246 : 160;
    let uiOverhead = 330;
    if (vw <= 480) {
      uiOverhead = hasActiveSubgame ? 345 : 320;
    } else if (hasActiveSubgame) {
      uiOverhead = (vw >= 1024 && (isVaultOpen || isRoyaleOpen)) ? 290 : 500;
      if (vw < 1024) uiOverhead = 350; // Refined compact mobile/tablet HUD overhead
    }

    const availH = Math.max(80, vh - uiOverhead);
    const scaleH = Math.min(1.15, availH / baseH);
    const minAllowed = vw <= 370 ? 0.42 : 0.46;
    const finalScale = Math.max(minAllowed, Math.min(scaleW, scaleH));
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

  // Spacebar Spin & Escape Key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const casinoMenuModal = document.getElementById('casino-menu-modal');
      if (casinoMenuModal && casinoMenuModal.classList.contains('active')) {
        app.closeCasinoMenu();
        return;
      }
      const volModal = document.getElementById('volatility-modal');
      if (volModal && volModal.classList.contains('active')) {
        app.closeVolatilityModal();
        return;
      }
    }
    const paytableModal = document.getElementById('paytable-modal');
    const casinoMenuModal = document.getElementById('casino-menu-modal');
    if (e.code === 'Space' && !e.repeat && 
        (!paytableModal || !paytableModal.classList.contains('active')) &&
        (!casinoMenuModal || !casinoMenuModal.classList.contains('active'))) {
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
      if (app && typeof app.updateCasinoMenuUI === 'function') {
        app.updateCasinoMenuUI();
      }
    });
  }

  // Language toggle
  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      if (window.slotAudio) window.slotAudio.playClick();
      if (window.i18n) {
        window.i18n.toggleLanguage();
        if (app && typeof app.updateCasinoMenuUI === 'function') {
          app.updateCasinoMenuUI();
        }
      }
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
      const msg = window.i18n ? window.i18n.t('pwaBannerTitle') : 'Instalirajte Grand Slot';
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

  // VIP Authentication & Player Profile UI Controller
  const loginModal = document.getElementById('login-modal');
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabRegister = document.getElementById('auth-tab-register');
  const authPanelLogin = document.getElementById('auth-panel-login');
  const authPanelRegister = document.getElementById('auth-panel-register');
  const authAlertBox = document.getElementById('auth-alert-box');
  const linkGoToReg = document.getElementById('link-go-to-reg');
  const linkGoToLogin = document.getElementById('link-go-to-login');

  const loginForm = document.getElementById('login-form');
  const loginUserInput = document.getElementById('login-username');
  const loginPassInput = document.getElementById('login-password');
  const loginRememberCheck = document.getElementById('login-remember-me');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnLoginText = document.getElementById('btn-login-text');
  const toggleLoginPass = document.getElementById('toggle-login-password');

  const registerForm = document.getElementById('register-form');
  const regUserInput = document.getElementById('reg-username');
  const regPassInput = document.getElementById('reg-password');
  const regPhoneInput = document.getElementById('reg-phone');
  const regAgeCheck = document.getElementById('reg-age-check');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');
  const btnRegText = document.getElementById('btn-reg-text');
  const toggleRegPass = document.getElementById('toggle-reg-password');

  const headerPlayerName = document.getElementById('header-player-name');
  const playerProfileBtn = document.getElementById('player-profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const profileCloseX = document.getElementById('profile-close-x');
  const profileCloseBtn = document.getElementById('profile-close-btn');
  const profileLogoutBtn = document.getElementById('profile-logout-btn');

  function showAuthAlert(msg, type = 'error') {
    if (!authAlertBox) return;
    authAlertBox.className = `auth-alert-box ${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    authAlertBox.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    authAlertBox.style.display = 'flex';
  }

  function clearAuthAlert() {
    if (authAlertBox) {
      authAlertBox.style.display = 'none';
      authAlertBox.innerHTML = '';
    }
  }

  function switchAuthTab(tab) {
    clearAuthAlert();
    if (tab === 'register') {
      authTabLogin?.classList.remove('active');
      authTabRegister?.classList.add('active');
      authPanelLogin?.classList.add('hidden');
      authPanelRegister?.classList.remove('hidden');
      if (regUserInput) regUserInput.focus();
    } else {
      authTabRegister?.classList.remove('active');
      authTabLogin?.classList.add('active');
      authPanelRegister?.classList.add('hidden');
      authPanelLogin?.classList.remove('hidden');
      if (loginUserInput) loginUserInput.focus();
    }
  }
  window.switchAuthTab = switchAuthTab;

  if (authTabLogin) authTabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (authTabRegister) authTabRegister.addEventListener('click', () => switchAuthTab('register'));
  if (linkGoToReg) linkGoToReg.addEventListener('click', () => switchAuthTab('register'));
  if (linkGoToLogin) linkGoToLogin.addEventListener('click', () => switchAuthTab('login'));

  // Password Visibility Toggles
  if (toggleLoginPass && loginPassInput) {
    toggleLoginPass.addEventListener('click', () => {
      const isPass = loginPassInput.type === 'password';
      loginPassInput.type = isPass ? 'text' : 'password';
      toggleLoginPass.textContent = isPass ? '🙈' : '👁️';
    });
  }

  if (toggleRegPass && regPassInput) {
    toggleRegPass.addEventListener('click', () => {
      const isPass = regPassInput.type === 'password';
      regPassInput.type = isPass ? 'text' : 'password';
      toggleRegPass.textContent = isPass ? '🙈' : '👁️';
    });
  }

  function updateHeaderProfile() {
    if (!app || !app.playerTracker) return;
    const profile = app.playerTracker.profile;
    const isGod = profile.is_god || profile.role === 'GOD' || profile.vipTier === 'GOD';
    if (headerPlayerName) {
      if (profile.isLoggedIn) {
        headerPlayerName.textContent = isGod ? '⚡ GOD' : (profile.username || 'Igrač');
        headerPlayerName.classList.toggle('god-player-badge', isGod);
      } else {
        headerPlayerName.textContent = 'Prijava';
        headerPlayerName.classList.remove('god-player-badge');
      }
    }
    if (playerProfileBtn) {
      const uName = profile.isLoggedIn ? (isGod ? '⚡ GOD OPERATOR' : (profile.username || 'Igrač')) : 'Prijava';
      playerProfileBtn.title = `${uName} (18+) - Profil & VIP Klub`;
      playerProfileBtn.classList.toggle('god-profile-btn', isGod);
    }
    const godDeck = document.getElementById('profile-god-deck');
    if (godDeck) {
      godDeck.style.display = (profile.isLoggedIn && isGod) ? 'block' : 'none';
    }
    const profileTag = document.getElementById('profile-modal-username');
    if (profileTag && profile.isLoggedIn) {
      profileTag.textContent = isGod ? '⚡ GOD OPERATOR (Super Admin)' : (profile.username || 'Demo Player');
    }
    app.updateModeQuotaPills();
    if (app.tierManager) app.tierManager.updateUI();
  }
  window.updateHeaderProfile = updateHeaderProfile;

  // Quick fill God Tier test credentials
  const btnQuickGod = document.getElementById('btn-quick-fill-god');
  if (btnQuickGod) {
    btnQuickGod.addEventListener('click', () => {
      if (loginUserInput) loginUserInput.value = 'god';
      if (loginPassInput) loginPassInput.value = 'god123';
      switchAuthTab('login');
      if (window.slotAudio) window.slotAudio.playClick();
    });
  }

  // Pre-fill remembered username
  if (app && app.playerTracker && app.playerTracker.profile) {
    if (loginUserInput && app.playerTracker.profile.username) {
      loginUserInput.value = app.playerTracker.profile.username;
    }
    updateHeaderProfile();
  }

  // Auto-login as God Tier if URL has ?god=1
  if (typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('god=1')) {
    setTimeout(() => {
      app.playerTracker.login('god', 'god123').then(res => {
        if (res.success) {
          if (app.wallet && res.player.balance_rsd != null) {
            app.wallet.setBalanceFromAuth(res.player.balance_rsd);
          }
          updateHeaderProfile();
          app.showMessage('⚡ GOD TIER automatska prijava uspešna!', 'jackpot');
        }
      });
    }, 400);
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();

      const username = (loginUserInput ? loginUserInput.value : '').trim();
      const password = (loginPassInput ? loginPassInput.value : '').trim();
      const remember = loginRememberCheck ? loginRememberCheck.checked : true;

      if (!username || !password) {
        showAuthAlert('Molimo unesite korisničko ime i lozinku.');
        return;
      }

      if (btnLoginSubmit) btnLoginSubmit.disabled = true;
      if (btnLoginText) btnLoginText.textContent = 'Povezivanje...';

      try {
        const res = await app.playerTracker.login(username, password, remember);
        if (!res.success) {
          showAuthAlert(res.error || 'Pogrešno korisničko ime ili lozinka.');
          if (btnLoginSubmit) btnLoginSubmit.disabled = false;
          if (btnLoginText) btnLoginText.textContent = 'PRIJAVI SE';
          return;
        }

        showAuthAlert('Uspešna prijava! Učitavanje profila...', 'success');
        if (window.slotAudio) window.slotAudio.playClick();

        if (app.wallet && res.player.balance_rsd != null) {
          app.wallet.setBalanceFromAuth(res.player.balance_rsd);
        }
        updateHeaderProfile();

        setTimeout(() => {
          if (loginModal) loginModal.classList.remove('active');
          if (btnLoginSubmit) btnLoginSubmit.disabled = false;
          if (btnLoginText) btnLoginText.textContent = 'PRIJAVI SE';
          if (app && typeof app.openMainModeModal === 'function') {
            app.openMainModeModal();
          } else if (app.lobby) {
            app.lobby.openModal();
          }
          app.showMessage(`✨ Dobrodošli nazad, ${res.player.username}!`, 'info');
        }, 500);

      } catch (err) {
        showAuthAlert('Greška pri komunikaciji sa serverom.');
        if (btnLoginSubmit) btnLoginSubmit.disabled = false;
        if (btnLoginText) btnLoginText.textContent = 'PRIJAVI SE';
      }
    });
  }

  // Handle Register Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthAlert();

      if (!regAgeCheck || !regAgeCheck.checked) {
        showAuthAlert('Morate potvrditi da imate 18+ godina radi odgovornog igranja.');
        return;
      }

      const username = (regUserInput ? regUserInput.value : '').trim();
      const password = (regPassInput ? regPassInput.value : '').trim();
      const phone = (regPhoneInput ? regPhoneInput.value : '').trim() || null;

      if (!username || username.length < 3) {
        showAuthAlert('Korisničko ime mora imati najmanje 3 karaktera.');
        return;
      }

      if (!password || password.length < 6) {
        showAuthAlert('Lozinka mora imati najmanje 6 karaktera.');
        return;
      }

      if (btnRegisterSubmit) btnRegisterSubmit.disabled = true;
      if (btnRegText) btnRegText.textContent = 'Otvaranje VIP naloga...';

      try {
        const res = await app.playerTracker.register(username, password, phone);
        if (!res.success) {
          showAuthAlert(res.error || 'Greška pri registraciji.');
          if (btnRegisterSubmit) btnRegisterSubmit.disabled = false;
          if (btnRegText) btnRegText.textContent = 'REGISTRUJ SE I UZMI 1.000 ZLATNIKA';
          return;
        }

        showAuthAlert('🎁 Čestitamo! Dobili ste 1.000 Zlatnika dobrodošlice!', 'success');
        if (window.slotAudio) window.slotAudio.playCoinDrop();

        if (app.wallet && res.player.balance_rsd != null) {
          app.wallet.setBalanceFromAuth(res.player.balance_rsd);
        }
        updateHeaderProfile();

        setTimeout(() => {
          if (loginModal) loginModal.classList.remove('active');
          if (btnRegisterSubmit) btnRegisterSubmit.disabled = false;
          if (btnRegText) btnRegText.textContent = 'REGISTRUJ SE I UZMI 1.000 ZLATNIKA';
          if (app && typeof app.openMainModeModal === 'function') {
            app.openMainModeModal();
          } else if (app.lobby) {
            app.lobby.openModal();
          }
          app.showMessage(`🎁 Čestitamo ${res.player.username}! 1.000 Zlatnika je spremno!`, 'jackpot');
        }, 800);

      } catch (err) {
        showAuthAlert('Greška pri komunikaciji sa serverom.');
        if (btnRegisterSubmit) btnRegisterSubmit.disabled = false;
        if (btnRegText) btnRegText.textContent = 'REGISTRUJ SE I UZMI 1.000 ZLATNIKA';
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
    if (statBet) statBet.textContent = `${s.totalBet.toLocaleString()} ZLT`;

    const statWin = document.getElementById('profile-stat-win');
    if (statWin) statWin.textContent = `${s.totalWin.toLocaleString()} ZLT`;

    const statBiggest = document.getElementById('profile-stat-biggest-win');
    if (statBiggest) statBiggest.textContent = `${s.biggestWin.toLocaleString()} ZLT`;

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

    // God Tier Deck Setup & Action Listeners
    const isGod = p.is_god || p.role === 'GOD' || p.vipTier === 'GOD';
    const godDeck = document.getElementById('profile-god-deck');
    if (godDeck) {
      godDeck.style.display = isGod ? 'block' : 'none';
    }

    const btnGodResetQuotas = document.getElementById('btn-god-reset-quotas');
    if (btnGodResetQuotas && !btnGodResetQuotas._wired) {
      btnGodResetQuotas._wired = true;
      btnGodResetQuotas.addEventListener('click', () => {
        if (app.dailyAccessManager) {
          app.dailyAccessManager.resetAllPlayerLimits();
        }
        app.updateModeQuotaPills();
        if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
        app.showMessage('⚡ Dnevne kvote resetovane na Neograničeno (∞)!', 'info');
      });
    }

    const btnGodAddGold = document.getElementById('btn-god-add-gold');
    if (btnGodAddGold && !btnGodAddGold._wired) {
      btnGodAddGold._wired = true;
      btnGodAddGold.addEventListener('click', () => {
        if (app.wallet && typeof app.wallet.addFictionalRsd === 'function') {
          app.wallet.addFictionalRsd(100000);
        }
        if (window.slotAudio && window.slotAudio.playWin) window.slotAudio.playWin();
        app.showMessage('💰 +100.000 ZLT dodato na račun!', 'win');
      });
    }

    const btnGodAddKeys = document.getElementById('btn-god-add-keys');
    if (btnGodAddKeys && !btnGodAddKeys._wired) {
      btnGodAddKeys._wired = true;
      btnGodAddKeys.addEventListener('click', () => {
        if (app.vaultCrawler) {
          app.vaultCrawler.vaultKeys += 99;
          app.vaultCrawler.saveState();
          app.vaultCrawler.updateHUD();
        }
        if (window.slotAudio && window.slotAudio.playCoinDrop) window.slotAudio.playCoinDrop();
        app.showMessage('🗝️ +99 Ključeva dodato u Trezor!', 'win');
      });
    }

    const btnGodMaxTalents = document.getElementById('btn-god-max-talents');
    if (btnGodMaxTalents && !btnGodMaxTalents._wired) {
      btnGodMaxTalents._wired = true;
      btnGodMaxTalents.addEventListener('click', () => {
        if (app.vaultCrawler) {
          app.vaultCrawler.talents = { wildLuck: 5, armorPlating: 5, goldMagnet: 5 };
          app.vaultCrawler.saveTalents();
          app.vaultCrawler.renderTalentsUI();
          app.vaultCrawler.updateHUD();
        }
        if (window.slotAudio && window.slotAudio.playJackpot) window.slotAudio.playJackpot();
        app.showMessage('🏛️ Svi taletni Trezora su na MAX (Lvl 5/5)!', 'jackpot');
      });
    }
  }

  app.openProfileModal = function() {
    if (window.slotAudio) window.slotAudio.playClick();
    if (!app.playerTracker || !app.playerTracker.profile.isLoggedIn) {
      if (loginModal) loginModal.classList.add('active');
    } else {
      renderProfileStats();
      if (app.tierManager) app.tierManager.updateUI();
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
      if (app && typeof app.closeMainModeModal === 'function') app.closeMainModeModal();
      if (app && typeof app.closeCasinoStyleModal === 'function') app.closeCasinoStyleModal();
      if (app && app.lobby && typeof app.lobby.closeModal === 'function') app.lobby.closeModal();
      if (app && typeof app.closeVoucherModal === 'function') app.closeVoucherModal();

      if (typeof switchAuthTab === 'function') {
        switchAuthTab('login');
      }
      if (loginModal) loginModal.classList.add('active');
    });
  }

  // Promo Zlatnici Dopuna chips in Profile
  document.querySelectorAll('.btn-deposit-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-amount'), 10) || 500;
      if (app && app.wallet) {
        const addedCredits = app.wallet.addFictionalRsd(amount);
        renderProfileStats();
        app.showMessage(`💰 USPEŠNO PREUZETO +${amount.toLocaleString()} ZLATNIKA (+${addedCredits.toLocaleString()} KR)!`, 'jackpot');
      }
    });
  });

  // Custom Promo Dopuna in Profile
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
          app.showMessage(`💰 USPEŠNO PREUZETO +${val.toLocaleString()} ZLATNIKA (+${addedCredits.toLocaleString()} KR)!`, 'jackpot');
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
        app.showMessage(`🎰 DENOMINACIJA: 1 KR = ${denomVal} ZLT`, 'info');
      }
    });
  });

  // Dedicated My Vouchers Modal Wiring
  const btnHeaderVouchers = document.getElementById('btn-header-vouchers');
  if (btnHeaderVouchers) {
    btnHeaderVouchers.addEventListener('click', () => {
      if (app && typeof app.openMyVouchersModal === 'function') {
        app.openMyVouchersModal('active');
      }
    });
  }

  const btnProfileVouchers = document.getElementById('btn-profile-my-vouchers');
  if (btnProfileVouchers) {
    btnProfileVouchers.addEventListener('click', () => {
      const profileModal = document.getElementById('profile-modal');
      if (profileModal) profileModal.classList.remove('active');
      if (app && typeof app.openMyVouchersModal === 'function') {
        app.openMyVouchersModal('active');
      }
    });
  }

  const closeMyVouchers = document.getElementById('btn-close-my-vouchers');
  const closeMyVouchersBtn = document.getElementById('btn-my-vouchers-close');
  const myVouchersModal = document.getElementById('my-vouchers-modal');

  if (closeMyVouchers) closeMyVouchers.addEventListener('click', () => app.closeMyVouchersModal());
  if (closeMyVouchersBtn) closeMyVouchersBtn.addEventListener('click', () => app.closeMyVouchersModal());
  if (myVouchersModal) {
    myVouchersModal.addEventListener('click', (e) => {
      if (e.target === myVouchersModal) app.closeMyVouchersModal();
    });
  }

  document.querySelectorAll('.voucher-tab-btn').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const vtab = tabBtn.getAttribute('data-vtab') || 'active';
      if (app && typeof app.renderMyVouchersList === 'function') {
        app.renderMyVouchersList(vtab);
      }
    });
  });

  // Initial update of vouchers counter badge & real-time scanner sync
  if (app && typeof app.updateVouchersCounter === 'function') {
    app.updateVouchersCounter();
  }

  if (app && typeof app.syncPlayerVouchers === 'function') {
    // Initial sync with backend
    app.syncPlayerVouchers();

    // BroadcastChannel sync across tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const voucherBc = new BroadcastChannel('gsc_vouchers_channel');
        voucherBc.onmessage = (event) => {
          if (event.data && event.data.type === 'VOUCHER_REDEEMED') {
            app.syncPlayerVouchers();
          }
        };
      }
    } catch (e) {}

    // Storage event sync across windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'gsc_last_redeemed_voucher' || e.key === 'gsc_my_vouchers_list') {
        app.syncPlayerVouchers();
      }
    });

    // Window custom event sync
    window.addEventListener('gsc_voucher_redeemed', () => {
      app.syncPlayerVouchers();
    });

    // Sync on tab focus / visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        app.syncPlayerVouchers();
      }
    });

    // Periodic live sync every 12 seconds
    setInterval(() => {
      app.syncPlayerVouchers();
    }, 12000);
  }

  // 2-Second Grand Slot VIP Splash Screen & Auth Gating
  const splashEl = document.getElementById('grand-splash-screen');
  const proceedAfterSplash = async () => {
    let isLoggedIn = false;
    if (app && app.sessionCheckPromise) {
      try {
        isLoggedIn = await app.sessionCheckPromise;
      } catch (_) {}
    }
    if (!isLoggedIn && app && app.playerTracker && app.playerTracker.profile) {
      isLoggedIn = !!app.playerTracker.profile.isLoggedIn;
    }

    if (!isLoggedIn) {
      // Unauthenticated or logged out: Open VIP Authentication Modal immediately
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.classList.add('active');
      }
      if (typeof window.switchAuthTab === 'function') {
        window.switchAuthTab('login');
      }
      if (app && typeof app.closeMainModeModal === 'function') app.closeMainModeModal();
      if (app && typeof app.closeCasinoStyleModal === 'function') app.closeCasinoStyleModal();
      if (app && app.lobby && typeof app.lobby.closeModal === 'function') app.lobby.closeModal();
      if (app && typeof app.closeVoucherModal === 'function') app.closeVoucherModal();
    } else {
      // Authenticated player: Proceed to 3 Pillars Mode Selection (Kazino Salon, Trezor Provala, Battle Royale)
      if (app && typeof app.openMainModeModal === 'function') {
        app.openMainModeModal();
      }
    }
  };

  if (splashEl) {
    setTimeout(() => {
      splashEl.classList.add('fade-out');
      setTimeout(() => {
        splashEl.style.display = 'none';
        proceedAfterSplash();
      }, 500);
    }, 2000);
  } else {
    proceedAfterSplash();
  }

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => reg.update())
      .catch((err) => console.error('PWA SW registration failed:', err));
  }
});

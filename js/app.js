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
    if (window.GrandCrashGame) {
      this.crashGame = new window.GrandCrashGame(this.wallet, this.jackpots);
    }
    if (window.PlinkoDeluxeGame) {
      this.plinkoGame = new window.PlinkoDeluxeGame(this.wallet, this.jackpots);
    }
    if (window.RoyalBlackjackGame) {
      this.blackjackGame = new window.RoyalBlackjackGame(this.wallet, this.jackpots);
    }

    // 4. Lobby
    this.lobby = new window.CasinoLobby(this.wallet, this.jackpots);
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

    // Default Game: Classic
    this.lobby.switchGame('classic');

    this.initControls();

    // 5. Check Player Session & Prompt Auth
    this.initPlayerSession();

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
    this.initGrandModeHub();
  }

  /* ==========================================================================
     Grand Mode Hub Navigation (Casino Salon, Vault Crawler, Battle Royale)
     ========================================================================== */

  initGrandModeHub() {
    const tabs = document.querySelectorAll('.hub-mode-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-mode');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.switchGrandMode(mode);
      });
    });
  }

  switchGrandMode(mode) {
    if (window.slotAudio) window.slotAudio.playClick();
    const container = document.querySelector('.game-container');

    const standaloneGameIds = ['crash', 'plinko', 'blackjack', 'mines'];
    const standaloneViews = [
      'crash-game-view',
      'plinko-game-view',
      'blackjack-game-view',
      'mines-game-view'
    ];

    if (mode === 'vault' || mode === 'royale') {
      // If we are currently on a non-slot standalone game, unmount it & remember it
      if (this.lobby && standaloneGameIds.includes(this.lobby.activeGameId)) {
        this.savedCasinoGameId = this.lobby.activeGameId;
        if (this.lobby.activeGame && typeof this.lobby.activeGame.unmount === 'function') {
          this.lobby.activeGame.unmount();
        }
        // Switch lobby to royal3x3 slot so reel spins attack the vault boss / score points!
        this.lobby.switchGame('royal3x3');
      }

      // Hide all standalone views
      standaloneViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      if (container) {
        container.classList.remove('in-mines-mode', 'in-crash-mode', 'in-plinko-mode', 'in-blackjack-mode');
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

      if (mode === 'vault') {
        if (this.battleRoyale) this.battleRoyale.unmount();
        if (this.vaultCrawler) this.vaultCrawler.mount();
      } else {
        if (this.vaultCrawler) this.vaultCrawler.unmount();
        if (this.battleRoyale) this.battleRoyale.mount();
      }
    } else {
      // Regular Casino Salon
      if (this.vaultCrawler) this.vaultCrawler.unmount();
      if (this.battleRoyale) this.battleRoyale.unmount();

      if (container) {
        container.classList.remove('in-vault-mode', 'in-royale-mode');
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

    if (typeof window.updateSlotScale === 'function') {
      window.updateSlotScale();
    }
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

    // Auto-popup if player has not seen this promotion yet
    const lastSeenId = localStorage.getItem('gsc_last_seen_promo_id');
    if (promo && promo.status === 'ACTIVE' && lastSeenId !== promo.id) {
      setTimeout(() => {
        localStorage.setItem('gsc_last_seen_promo_id', promo.id);
        this.openPromotionModal(promo);
      }, 1400);
    }
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
    if (doneBtn) doneBtn.addEventListener('click', () => this.closeVoucherModal());

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
    const playerId = this.playerTracker ? this.playerTracker.profile.id : null;
    if (!playerId || typeof fetch === 'undefined') return;

    try {
      const res = await fetch(`/api/vouchers/my?playerId=${encodeURIComponent(playerId)}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.vouchers)) {
        const active = data.vouchers.find(v => v.status === 'ACTIVE' && new Date(v.expires_at) > new Date());
        if (active) {
          this.activeVoucher = active;
          localStorage.setItem('gsc_active_voucher', JSON.stringify(active));
        } else if (data.vouchers.length > 0) {
          this.activeVoucher = data.vouchers[0];
          localStorage.setItem('gsc_active_voucher', JSON.stringify(data.vouchers[0]));
        }
        this.updateVoucherBadge();
      }
    } catch (e) {}
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

  openVoucherModal(promoPayload = null) {
    const modal = document.getElementById('vip-voucher-modal');
    if (!modal) return;

    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();

    modal.classList.add('active');

    if (promoPayload) {
      this.setupPromoViewData(promoPayload);
      this.switchVoucherView('promo');
    } else if (this.activeVoucher) {
      this.renderVoucherCard(this.activeVoucher);
      this.switchVoucherView('card');
    } else {
      this.setupPromoViewData({
        title: 'VIP Promo Tiket 1.000 RSD',
        description: 'Prijavite se za ekskluzivni vikend bonus i preuzmite lični VIP QR vaučer za igru na slot aparatima u Grand Slot Club-u!',
        rewardValue: 1000,
        rewardType: 'club_ticket',
        location: 'Grand Slot Club - Kralja Milana 12, Beograd',
        validHours: 48
      });
      this.switchVoucherView('promo');
    }
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
      } else if (action === 'voucher_drink') {
        if (tagEl) tagEl.textContent = '🍸 VIP WELCOME DRINK NA ŠANKU';
        newBtn.innerHTML = '🍸 PREUZMI VIP KOKTEL VAUČER';
        newBtn.addEventListener('click', () => this.claimActivePromoVoucher());
      } else if (action === 'voucher_tour') {
        if (tagEl) tagEl.textContent = '🏆 VIP ULAZNICA ZA TURNIR (50.000 ZLT)';
        newBtn.innerHTML = '🏆 PREUZMI VIP ULAZNICU ZA TURNIR';
        newBtn.addEventListener('click', () => this.claimActivePromoVoucher());
      } else if (action === 'none') {
        if (tagEl) tagEl.textContent = '📢 KAZINO OBAVEŠTENJE';
        newBtn.innerHTML = '👍 RAZUMEM / NASTAVI IGRU';
        newBtn.addEventListener('click', () => this.closeVoucherModal());
      } else {
        if (tagEl) tagEl.textContent = `🎟️ +${val.toLocaleString()} ZLT PROMO VAUČER`;
        newBtn.innerHTML = `🎟️ PREUZMI VIP VAUČER ZA KLUB (${val.toLocaleString()} ZLT)`;
        newBtn.addEventListener('click', () => this.claimActivePromoVoucher());
      }
    }
  }

  async claimActivePromoVoucher() {
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

  restoreSlotUI() {
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
      'mines-game-view'
    ];
    standaloneViews.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    const container = document.querySelector('.game-container');
    if (container) {
      container.classList.remove('in-mines-mode', 'in-crash-mode', 'in-plinko-mode', 'in-blackjack-mode');
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
          if (this.lobby) this.lobby.openModal();
          return;
        }
      } catch (err) {
        console.warn('Init session check error:', err);
      }
    }

    if (loginModal) loginModal.classList.add('active');
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

    // Option: VIP Vaučeri & Promocije
    const optVoucher = document.getElementById('menu-opt-voucher');
    if (optVoucher) {
      optVoucher.addEventListener('click', () => {
        this.closeCasinoMenu();
        setTimeout(() => this.openVoucherModal(), 120);
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
    const vaultView = document.getElementById('vault-crawler-view');
    const royaleView = document.getElementById('battle-royale-view');
    const isVaultOpen = vaultView && vaultView.style.display !== 'none';
    const isRoyaleOpen = royaleView && royaleView.style.display !== 'none';
    const hasActiveSubgame = (isVaultOpen || isRoyaleOpen);

    const baseW = isFullFocus ? 416 : 514;
    const padW = vw <= 370 ? 12 : (vw <= 480 ? 16 : 28);
    const availW = Math.max(220, vw - padW);
    const scaleW = Math.min(1.15, availW / baseW);

    const baseH = is3x3 ? 246 : 160;
    let uiOverhead = 330;
    if (vw <= 480) {
      uiOverhead = hasActiveSubgame ? 460 : 320;
    } else if (hasActiveSubgame) {
      uiOverhead = 500;
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
    if (headerPlayerName) {
      headerPlayerName.textContent = profile.isLoggedIn ? (profile.username || 'Igrač') : 'Prijava';
    }
    if (playerProfileBtn) {
      const uName = profile.isLoggedIn ? (profile.username || 'Igrač') : 'Prijava';
      playerProfileBtn.title = `${uName} (18+) - Profil & VIP Klub`;
    }
  }
  window.updateHeaderProfile = updateHeaderProfile;

  // Pre-fill remembered username
  if (app && app.playerTracker && app.playerTracker.profile) {
    if (loginUserInput && app.playerTracker.profile.username) {
      loginUserInput.value = app.playerTracker.profile.username;
    }
    updateHeaderProfile();
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
          if (app.lobby) app.lobby.openModal();
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
          if (app.lobby) app.lobby.openModal();
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

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => reg.update())
      .catch((err) => console.error('PWA SW registration failed:', err));
  }
});

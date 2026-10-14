/**
 * Grandslot - Admin Remote Bridge
 * Connects the slot game to the standalone Operator Admin Dashboard (admin.html)
 * via the BroadcastChannel API and localStorage.
 */
class AdminBridge {
  constructor(app) {
    this.app = app;
    this.channelName = 'grandslot_admin_channel';
    this.channel = null;
    this.logoClicks = 0;
    this.lastLogoClickTime = 0;

    this.initChannel();
    this.initShortcuts();
    this.attachTelemetryHooks();
  }

  initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }

    // Storage event fallback (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'grandslot_admin_command' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.handleMessage(data);
        } catch (err) {}
      }
    });

    // Announce to any active admin dashboard that the slot is online
    setTimeout(() => {
      this.postMessage({ action: 'SLOT_ONLINE', timestamp: Date.now() });
      this.broadcastState();
    }, 300);
  }

  postMessage(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {
        console.warn('Failed to post message on admin channel:', e);
      }
    }

    // Also persist telemetry to localStorage for initial dashboard load
    if (data.action === 'STATE_UPDATE' && data.state) {
      try {
        localStorage.setItem('grandslot_live_telemetry', JSON.stringify(data.state));
      } catch (e) {}
    }
  }

  handleMessage(data) {
    if (!data || !data.action) return;

    switch (data.action) {
      case 'REQUEST_STATE':
      case 'ADMIN_ONLINE':
        this.broadcastState();
        break;

      case 'SET_PRESET':
        if (this.app.mathManager && data.presetId) {
          this.app.mathManager.setPreset(data.presetId);
          this.broadcastState();
        }
        break;

      case 'SET_WEIGHT':
        if (this.app.mathManager && data.symbolId && data.value) {
          this.app.mathManager.setCustomWeight(data.symbolId, data.value);
          this.broadcastState();
        }
        break;

      case 'TRIGGER_JACKPOT':
        if (this.app.jackpots && data.tier) {
          this.app.jackpots.awardJackpot(data.tier, (tier, pot, mult) => {
            const isEn = window.i18n && window.i18n.currentLang === 'en';
            const title = isEn 
              ? `🏆 REMOTE ADMIN: ${tier.toUpperCase()} JACKPOT +${pot.toLocaleString()} RSD!`
              : `🏆 OPERATER TRIGGER: ${tier.toUpperCase()} DŽEKPOT +${pot.toLocaleString()} RSD!`;
            this.app.showMessage(title, 'jackpot');
          });
          this.broadcastState();
        }
        break;

      case 'TRIGGER_BONUS':
        if (data.bonusType === 'wheel' && this.app.wheelBonus) {
          this.app.wheelBonus.openModal(true);
        } else if (data.bonusType === 'mines' && this.app.meters) {
          this.app.meters.minesProgress = 100;
          this.app.meters.activateMinesBonus(this.app.wallet.bet);
        } else if (data.bonusType === 'cards' && this.app.meters) {
          this.app.meters.cardsProgress = 100;
          this.app.meters.activateCardsBonus(this.app.wallet.bet);
        } else if (data.bonusType === 'doublerush' && this.app.meters) {
          this.app.meters.cardsProgress = 100;
          this.app.meters.activateCardsBonus(this.app.wallet.bet);
          this.app.meters.minesProgress = 100;
          this.app.meters.activateMinesBonus(this.app.wallet.bet);
          this.app.showMessage('🔥 OPERATER: DOUBLE BONUS RUSH AKTIVIRAN!', 'frenzy');
        }
        this.broadcastState();
        break;

      case 'WALLET_ADD':
        if (this.app.wallet && typeof data.amount === 'number') {
          this.app.wallet.addFictionalRsd(data.amount);
          this.app.showMessage(`💰 OPERATER: +${data.amount.toLocaleString()} RSD DODATO!`, 'win');
          this.broadcastState();
        }
        break;

      case 'WALLET_SET':
        if (this.app.wallet && typeof data.amount === 'number') {
          this.app.wallet.rsdBalance = data.amount;
          this.app.wallet.saveState();
          this.app.wallet.updateUI();
          this.app.showMessage(`🔄 OPERATER: STANJE POSTAVLJENO NA ${data.amount.toLocaleString()} RSD`, 'info');
          this.broadcastState();
        }
        break;

      case 'SWITCH_GAME':
        if (this.app.lobby && data.gameId) {
          this.app.lobby.selectGame(data.gameId);
          this.broadcastState();
        }
        break;

      case 'TRIGGER_PUSH':
        if (this.app.notifications) {
          if (data.notifType === 'jackpot') this.app.notifications.triggerJackpotAlert('gold');
          else if (data.notifType === 'tournament') this.app.notifications.triggerTournamentAlert();
          else if (data.notifType === 'bonus') this.app.notifications.triggerBonusAlert();
          else if (data.title && data.body) {
            this.app.notifications.sendPushNotification(data.title, data.body);
            this.app.showMessage(`🔔 PUSH POSLAT: ${data.title}`, 'win');
          }
        }
        break;

      case 'RESET_SESSION':
        localStorage.clear();
        this.app.showMessage('🧹 Istorija sesije i keš resetovani od strane operatera', 'info');
        setTimeout(() => window.location.reload(), 600);
        break;
    }
  }

  broadcastState() {
    if (!this.app) return;

    const state = {
      timestamp: Date.now(),
      balance: this.app.wallet ? this.app.wallet.rsdBalance : 0,
      credits: this.app.wallet ? this.app.wallet.credits : 0,
      bet: this.app.wallet ? this.app.wallet.bet : 20,
      activeDenom: this.app.wallet ? this.app.wallet.activeDenom : 1,
      activeGame: this.app.lobby ? this.app.lobby.activeGameId : 'royal3x3',
      activePreset: this.app.mathManager ? this.app.mathManager.activePreset : 'standard',
      customWeights: this.app.mathManager ? this.app.mathManager.getActiveWeights() : {},
      jackpots: {
        silver: this.app.jackpots ? Math.floor(this.app.jackpots.pots.silver.current) : 80,
        gold: this.app.jackpots ? Math.floor(this.app.jackpots.pots.gold.current) : 250,
        diamond: this.app.jackpots ? Math.floor(this.app.jackpots.pots.diamond.current) : 600
      }
    };

    this.postMessage({ action: 'STATE_UPDATE', state });
  }

  attachTelemetryHooks() {
    // Broadcast on wallet updates and game actions
    window.addEventListener('grandslot:spinend', () => this.broadcastState());
    window.addEventListener('grandslot:walletupdate', () => this.broadcastState());

    // Periodic heartbeat sync every 2.5 seconds
    setInterval(() => {
      this.broadcastState();
    }, 2500);
  }

  openAdminDashboard() {
    window.open('admin.html', '_blank', 'width=1180,height=880,menubar=no,toolbar=no');
    if (this.app && this.app.showMessage) {
      this.app.showMessage('⚙️ OTVARAM GRANDSLOT OPERATOR DASHBOARD...', 'info');
    }
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
  }

  initShortcuts() {
    // 1. Logo clicks (5 clicks within 2.5s)
    const logoEl = document.querySelector('.main-brand-logo');
    if (logoEl) {
      logoEl.style.cursor = 'pointer';
      logoEl.addEventListener('click', () => {
        const now = Date.now();
        if (now - this.lastLogoClickTime < 600) {
          this.logoClicks++;
        } else {
          this.logoClicks = 1;
        }
        this.lastLogoClickTime = now;

        if (this.logoClicks >= 5) {
          this.logoClicks = 0;
          this.openAdminDashboard();
        }
      });
    }

    // 2. Keyboard shortcut: Ctrl + Shift + A or Backquote (~)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.openAdminDashboard();
      }
    });

    // 3. Open button in rules modal
    const openFromRules = document.getElementById('open-admin-from-rules');
    if (openFromRules) {
      openFromRules.addEventListener('click', () => {
        const paytableModal = document.getElementById('paytable-modal');
        if (paytableModal) paytableModal.classList.remove('active');
        this.openAdminDashboard();
      });
    }
  }
}

window.AdminBridge = AdminBridge;

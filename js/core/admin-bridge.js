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

  /* ==========================================================================
     In-Slot Operator PIN Security Modal & Access Control
     ========================================================================== */

  static hashPin(pin) {
    let hash = 0x811c9dc5;
    const str = 'GSC_SALT_2026_' + String(pin).trim();
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  getStoredPinHash() {
    const key = 'grandslot_operator_pin_hash';
    let stored = localStorage.getItem(key);
    if (!stored) {
      stored = AdminBridge.hashPin('7777');
      try { localStorage.setItem(key, stored); } catch (e) {}
    }
    return stored;
  }

  verifyPin(inputPin) {
    return AdminBridge.hashPin(inputPin) === this.getStoredPinHash();
  }

  createPinModal() {
    let modal = document.getElementById('slot-operator-pin-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'slot-operator-pin-modal';
    modal.className = 'slot-pin-modal-overlay';
    modal.innerHTML = `
      <div class="slot-pin-modal-card">
        <button type="button" class="slot-pin-close-btn" id="slot-pin-close-btn" aria-label="Zatvori">&times;</button>
        <div class="slot-pin-brand-header">
          <img src="assets/logo.svg" alt="Grand Slot Club" class="slot-pin-brand-logo">
          <span class="slot-pin-badge">OPERATOR SECURITY</span>
        </div>
        <h2 class="slot-pin-title">OPERATERSKI SISTEM</h2>
        <p class="slot-pin-subtitle">Unesite 4-cifreni PIN kod za pristup kontrolnoj tabli</p>

        <div class="slot-pin-dots-wrap" id="slot-pin-dots">
          <span class="slot-pin-dot" data-idx="0"></span>
          <span class="slot-pin-dot" data-idx="1"></span>
          <span class="slot-pin-dot" data-idx="2"></span>
          <span class="slot-pin-dot" data-idx="3"></span>
        </div>

        <div class="slot-pin-feedback" id="slot-pin-feedback"></div>

        <div class="slot-pin-keypad" id="slot-pin-keypad">
          <button type="button" class="slot-pin-btn" data-key="1">1</button>
          <button type="button" class="slot-pin-btn" data-key="2">2</button>
          <button type="button" class="slot-pin-btn" data-key="3">3</button>
          <button type="button" class="slot-pin-btn" data-key="4">4</button>
          <button type="button" class="slot-pin-btn" data-key="5">5</button>
          <button type="button" class="slot-pin-btn" data-key="6">6</button>
          <button type="button" class="slot-pin-btn" data-key="7">7</button>
          <button type="button" class="slot-pin-btn" data-key="8">8</button>
          <button type="button" class="slot-pin-btn" data-key="9">9</button>
          <button type="button" class="slot-pin-btn btn-clear" data-key="C">C</button>
          <button type="button" class="slot-pin-btn" data-key="0">0</button>
          <button type="button" class="slot-pin-btn btn-backspace" data-key="BACK">⌫</button>
        </div>

        <div class="slot-pin-footer-info">
          <span>🔒 5 pokušaja / 30s privremena blokada</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#slot-pin-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePinModal());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closePinModal();
    });

    const keypad = modal.querySelector('#slot-pin-keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const key = btn.getAttribute('data-key');
        this.handlePinKeyInput(key);
      });
    }

    return modal;
  }

  requestAdminAccess() {
    this.createPinModal();
    this.currentPin = '';
    this.updatePinDots();
    this.setPinFeedback('', '');

    const modal = document.getElementById('slot-operator-pin-modal');
    if (modal) {
      modal.classList.add('active');
      this.checkLockout();
    }
  }

  closePinModal() {
    const modal = document.getElementById('slot-operator-pin-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.currentPin = '';
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }

  handlePinKeyInput(key) {
    if (this.isLockedOut()) return;

    if (key >= '0' && key <= '9') {
      if (this.currentPin.length < 4) {
        this.currentPin += key;
        this.updatePinDots();
        if (this.currentPin.length === 4) {
          setTimeout(() => this.submitPin(), 90);
        }
      }
    } else if (key === 'BACK') {
      if (this.currentPin.length > 0) {
        this.currentPin = this.currentPin.slice(0, -1);
        this.updatePinDots();
      }
    } else if (key === 'C') {
      this.currentPin = '';
      this.updatePinDots();
      this.setPinFeedback('', '');
    }
  }

  updatePinDots() {
    const dots = document.querySelectorAll('#slot-pin-dots .slot-pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < this.currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  setPinFeedback(text, type) {
    const feedback = document.getElementById('slot-pin-feedback');
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'slot-pin-feedback ' + (type || '');
  }

  submitPin() {
    if (this.isLockedOut()) return;

    if (this.verifyPin(this.currentPin)) {
      localStorage.setItem('grandslot_pin_failed_attempts', '0');
      this.setPinFeedback('✓ AUTORIZOVAN PRISTUP', 'success');

      try {
        sessionStorage.setItem('grandslot_admin_session_auth', 'true');
      } catch (e) {}

      setTimeout(() => {
        this.closePinModal();
        this.openAdminDashboard();
      }, 250);
    } else {
      let failed = parseInt(localStorage.getItem('grandslot_pin_failed_attempts') || '0', 10) + 1;
      localStorage.setItem('grandslot_pin_failed_attempts', String(failed));

      const card = document.querySelector('#slot-operator-pin-modal .slot-pin-modal-card');
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
      }

      if (failed >= 5) {
        const lockoutUntil = Date.now() + 30000;
        localStorage.setItem('grandslot_pin_lockout_until', String(lockoutUntil));
        localStorage.setItem('grandslot_pin_failed_attempts', '0');
        this.startLockoutCountdown(lockoutUntil);
      } else {
        const left = 5 - failed;
        this.setPinFeedback(`Netačan PIN kod! (Preostalo: ${left})`, 'error');
        this.currentPin = '';
        this.updatePinDots();
      }
    }
  }

  isLockedOut() {
    const until = parseInt(localStorage.getItem('grandslot_pin_lockout_until') || '0', 10);
    return Date.now() < until;
  }

  checkLockout() {
    const until = parseInt(localStorage.getItem('grandslot_pin_lockout_until') || '0', 10);
    if (Date.now() < until) {
      this.startLockoutCountdown(until);
    }
  }

  startLockoutCountdown(until) {
    if (this.lockoutInterval) clearInterval(this.lockoutInterval);
    this.currentPin = '';
    this.updatePinDots();

    const updateTimer = () => {
      const remainingSec = Math.ceil((until - Date.now()) / 1000);
      if (remainingSec <= 0) {
        clearInterval(this.lockoutInterval);
        this.lockoutInterval = null;
        localStorage.removeItem('grandslot_pin_lockout_until');
        this.setPinFeedback('Pokušajte ponovo.', '');
      } else {
        this.setPinFeedback(`⚠️ Previše pokušaja! Sačekajte: ${remainingSec}s`, 'lockout');
      }
    };

    updateTimer();
    this.lockoutInterval = setInterval(updateTimer, 1000);
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
          this.requestAdminAccess();
        }
      });
    }

    // 2. Keyboard shortcut: Ctrl + Shift + A or Backquote (~)
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('slot-operator-pin-modal');
      const isModalActive = modal && modal.classList.contains('active');

      if (isModalActive) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          this.handlePinKeyInput(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.handlePinKeyInput('BACK');
        } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          this.closePinModal();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.currentPin && this.currentPin.length === 4) {
            this.submitPin();
          }
        }
        return;
      }

      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.requestAdminAccess();
      }
    });

    // 3. Open button in rules modal
    const openFromRules = document.getElementById('open-admin-from-rules');
    if (openFromRules) {
      openFromRules.addEventListener('click', () => {
        const paytableModal = document.getElementById('paytable-modal');
        if (paytableModal) paytableModal.classList.remove('active');
        this.requestAdminAccess();
      });
    }
  }
}

window.AdminBridge = AdminBridge;

/**
 * Grand Slot Club - Standalone Operator Admin Dashboard Controller
 * Connects to live slot sessions via BroadcastChannel and manages RTP, simulations, and remote actions.
 */
class AdminDashboard {
  constructor() {
    this.channelName = 'grandslot_admin_channel';
    this.channel = null;
    this.mathManager = new window.SlotMathManager();
    this.isConnected = false;
    this.lastState = null;
    this.connectionTimeout = null;

    this.initSecurity();
    this.initChannel();
    this.initTabs();
    this.initPresetsAndWeights();
    this.initSimulator();
    this.initTriggers();
    this.initPushTab();
    
    // Check for cached telemetry
    this.loadCachedTelemetry();
  }

  /* ==========================================================================
     BroadcastChannel Communication & State Sync
     ========================================================================== */

  initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (e) => this.handleMessage(e.data);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // Storage fallback
    window.addEventListener('storage', (e) => {
      if (e.key === 'grandslot_live_telemetry' && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          this.applyLiveState(state);
        } catch (err) {}
      }
    });

    // Send handshake request
    this.sendHandshake();

    // Re-check connection every 4 seconds
    setInterval(() => {
      if (!this.isConnected) {
        this.sendHandshake();
      }
    }, 4000);
  }

  sendHandshake() {
    this.sendCommand({ action: 'ADMIN_ONLINE', timestamp: Date.now() });
    this.sendCommand({ action: 'REQUEST_STATE' });

    // Set timeout to mark disconnected if no response arrives within 2.5s
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    this.connectionTimeout = setTimeout(() => {
      if (!this.lastState || Date.now() - (this.lastState.timestamp || 0) > 6000) {
        this.setConnected(false);
      }
    }, 2500);
  }

  sendCommand(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {
        console.warn('Failed to send command to slot:', e);
      }
    }

    // Storage fallback for cross-process
    try {
      localStorage.setItem('grandslot_admin_command', JSON.stringify({ ...data, _ts: Date.now() }));
    } catch (e) {}
  }

  handleMessage(data) {
    if (!data || !data.action) return;

    if (data.action === 'SLOT_ONLINE' || data.action === 'STATE_UPDATE') {
      this.setConnected(true);
      if (data.state) {
        this.applyLiveState(data.state);
      }
    }
  }

  setConnected(connected) {
    this.isConnected = connected;
    const pill = document.getElementById('conn-status-pill');
    const txt = document.getElementById('conn-status-text');

    if (pill && txt) {
      if (connected) {
        pill.className = 'conn-pill connected';
        txt.textContent = 'POVEZAN SA SLOTOM (LIVE)';
      } else {
        pill.className = 'conn-pill disconnected';
        txt.textContent = 'ČEKAM SLOT MAŠINU';
      }
    }
  }

  loadCachedTelemetry() {
    try {
      const cached = localStorage.getItem('grandslot_live_telemetry');
      if (cached) {
        const state = JSON.parse(cached);
        this.applyLiveState(state);
      }
    } catch (e) {}
  }

  applyLiveState(state) {
    this.lastState = state;
    this.setConnected(true);

    // 1. Update Telemetry Strip
    const gameEl = document.getElementById('tel-active-game');
    if (gameEl) {
      const names = {
        'classic': '1-Line Classic Retro',
        'royal3x3': 'Royal 3x3 (5 Linija)',
        'fullfocus': 'Royal 3x3 Full Focus',
        'mines': 'Grand Mines X'
      };
      gameEl.textContent = names[state.activeGame] || state.activeGame || 'Royal 3x3';
    }

    const balEl = document.getElementById('tel-player-balance');
    if (balEl && state.balance !== undefined) {
      balEl.textContent = `${state.balance.toLocaleString()} RSD`;
    }

    const profEl = document.getElementById('tel-active-preset');
    if (profEl && state.activePreset) {
      const p = this.mathManager.PRESETS[state.activePreset];
      profEl.textContent = state.activePreset === 'custom' ? 'CUSTOM WEIGHTS' : (p ? p.shortName : state.activePreset.toUpperCase());
    }

    if (state.jackpots) {
      const sEl = document.getElementById('tel-jackpot-silver');
      const gEl = document.getElementById('tel-jackpot-gold');
      const dEl = document.getElementById('tel-jackpot-diamond');
      if (sEl) sEl.textContent = `${state.jackpots.silver.toLocaleString()} RSD`;
      if (gEl) gEl.textContent = `${state.jackpots.gold.toLocaleString()} RSD`;
      if (dEl) dEl.textContent = `${state.jackpots.diamond.toLocaleString()} RSD`;
    }

    // 2. Sync active preset highlight
    if (state.activePreset) {
      document.querySelectorAll('.preset-dash-card').forEach(card => {
        const pid = card.getAttribute('data-preset');
        card.classList.toggle('active', pid === state.activePreset);
      });
    }

    // 3. Sync custom weights if provided
    if (state.customWeights) {
      Object.keys(state.customWeights).forEach(symId => {
        const input = document.querySelector(`.sym-weight-input[data-symbol="${symId}"]`);
        if (input && document.activeElement !== input) {
          input.value = state.customWeights[symId];
        }
      });
    }
  }

  /* ==========================================================================
     Tab 1: Presets & Weights Editor
     ========================================================================== */

  initPresetsAndWeights() {
    // Preset cards activation
    document.querySelectorAll('.preset-dash-card').forEach(card => {
      card.addEventListener('click', () => {
        const presetId = card.getAttribute('data-preset');
        this.mathManager.setPreset(presetId);
        this.sendCommand({ action: 'SET_PRESET', presetId });

        document.querySelectorAll('.preset-dash-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.renderWeights();
        this.showToast(`⚡ Aktiviran matematički profil: ${presetId.toUpperCase()}`);
      });
    });

    // Reset weights button
    const btnReset = document.getElementById('btn-reset-weights-default');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const curPreset = this.mathManager.activePreset;
        this.mathManager.setPreset(curPreset);
        this.sendCommand({ action: 'SET_PRESET', presetId: curPreset });
        this.renderWeights();
        this.showToast('🔄 Težine simbola vraćene na fabričke vrednosti');
      });
    }

    this.renderWeights();
  }

  renderWeights() {
    const container = document.getElementById('weights-dash-grid');
    if (!container) return;

    const weights = this.mathManager.getActiveWeights();
    const symbols = window.CLASSIC_SYMBOLS || [];

    container.innerHTML = symbols.map(sym => {
      const curWeight = weights[sym.id] !== undefined ? weights[sym.id] : sym.weight;
      return `
        <div class="weight-row-card">
          <div class="sym-left-info">
            <img src="${sym.svg}" alt="${sym.name}" class="sym-icon-preview" />
            <div class="sym-text-details">
              <span class="sym-title-txt">${sym.name}</span>
              <span class="sym-payout-txt">3x: <strong>${sym.payout3}x</strong> ${sym.payout2 ? `| 2x: <strong>${sym.payout2}x</strong>` : ''}</span>
            </div>
          </div>
          <div class="sym-weight-control">
            <input type="number" min="1" max="50" value="${curWeight}" data-symbol="${sym.id}" class="sym-weight-input" />
          </div>
        </div>
      `;
    }).join('');

    // Attach input change events
    container.querySelectorAll('.sym-weight-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const symId = e.target.getAttribute('data-symbol');
        const val = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1));
        e.target.value = val;

        this.mathManager.setCustomWeight(symId, val);
        this.sendCommand({ action: 'SET_WEIGHT', symbolId: symId, value: val });

        // Unhighlight presets since custom values are active
        document.querySelectorAll('.preset-dash-card').forEach(c => c.classList.remove('active'));
        this.showToast(`⚖️ Težina simbola [${symId}] ažurirana na ${val}`);
      });
    });
  }

  /* ==========================================================================
     Tab 2: Monte Carlo Simulator
     ========================================================================== */

  initSimulator() {
    const runBtns = document.querySelectorAll('.btn-sim-run');
    runBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        runBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const spins = parseInt(btn.getAttribute('data-spins'), 10);
        this.executeSimulation(spins);
      });
    });
  }

  executeSimulation(spins) {
    const statusBox = document.getElementById('sim-status-banner');
    const resultsGrid = document.getElementById('sim-results-cards');
    const gameChoice = document.getElementById('sim-game-choice').value;

    if (statusBox) statusBox.textContent = `⏳ Izvršavam ${spins.toLocaleString()} spinova u pozadini...`;
    if (resultsGrid) resultsGrid.style.display = 'none';

    setTimeout(() => {
      const startTime = performance.now();
      const res = this.mathManager.runSimulation(gameChoice, spins);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (statusBox) {
        statusBox.textContent = `✅ Simulacija završena za ${elapsed}s (${spins.toLocaleString()} spinova na ${res.gameType === 'royal3x3' ? 'Royal 3x3' : 'Classic 1-Line'}).`;
      }

      if (resultsGrid) {
        resultsGrid.style.display = 'grid';
        document.getElementById('sim-res-rtp').textContent = `${res.rtp}%`;
        document.getElementById('sim-res-hitrate').textContent = `${res.hitRate}%`;
        document.getElementById('sim-res-maxwin').textContent = `${res.maxWinMult}x`;
        document.getElementById('sim-res-betwin').textContent = `${res.totalBet.toLocaleString()} / ${res.totalWon.toLocaleString()} RSD`;
      }
    }, 40);
  }

  /* ==========================================================================
     Tab 3: Remote Controls & Triggers
     ========================================================================== */

  initTriggers() {
    // 1. Jackpots
    const btnSilver = document.getElementById('btn-cmd-silver');
    if (btnSilver) btnSilver.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_JACKPOT', tier: 'silver' });
      this.showToast('🥈 Poslata komanda: Okini SILVER Džekpot!');
    });

    const btnGold = document.getElementById('btn-cmd-gold');
    if (btnGold) btnGold.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_JACKPOT', tier: 'gold' });
      this.showToast('🏆 Poslata komanda: Okini GOLD Džekpot!');
    });

    const btnDiamond = document.getElementById('btn-cmd-diamond');
    if (btnDiamond) btnDiamond.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_JACKPOT', tier: 'diamond' });
      this.showToast('💎 Poslata komanda: Okini DIAMOND Džekpot!');
    });

    // 2. Bonuses
    const btnWheel = document.getElementById('btn-cmd-wheel');
    if (btnWheel) btnWheel.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'wheel' });
      this.showToast('🎡 Poslata komanda: Pokreni Točak Sreće!');
    });

    const btnMines = document.getElementById('btn-cmd-mines');
    if (btnMines) btnMines.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'mines' });
      this.showToast('💣 Poslata komanda: Pokreni Mines Bonus!');
    });

    const btnCards = document.getElementById('btn-cmd-cards');
    if (btnCards) btnCards.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'cards' });
      this.showToast('🃏 Poslata komanda: Napuni Cards Bonus!');
    });

    const btnRush = document.getElementById('btn-cmd-doublerush');
    if (btnRush) btnRush.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'doublerush' });
      this.showToast('🔥 Poslata komanda: DOUBLE BONUS RUSH!');
    });

    // 3. Wallet
    const btnAdd10k = document.getElementById('btn-cmd-add10k');
    if (btnAdd10k) btnAdd10k.addEventListener('click', () => {
      this.sendCommand({ action: 'WALLET_ADD', amount: 10000 });
      this.showToast('💰 Poslato: +10.000 RSD na račun igrača!');
    });

    const btnReset1k = document.getElementById('btn-cmd-reset1k');
    if (btnReset1k) btnReset1k.addEventListener('click', () => {
      this.sendCommand({ action: 'WALLET_SET', amount: 1000 });
      this.showToast('🔄 Poslato: Stanje postavljeno na 1.000 RSD');
    });

    const btnCustomDeposit = document.getElementById('btn-cmd-custom-deposit');
    if (btnCustomDeposit) btnCustomDeposit.addEventListener('click', () => {
      const val = parseInt(document.getElementById('input-custom-deposit-amount').value, 10);
      if (val > 0) {
        this.sendCommand({ action: 'WALLET_SET', amount: val });
        this.showToast(`💵 Poslato: Stanje postavljeno na ${val.toLocaleString()} RSD`);
      }
    });

    // 4. Game Switching
    document.querySelectorAll('.btn-switch-game').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.getAttribute('data-game');
        this.sendCommand({ action: 'SWITCH_GAME', gameId });
        this.showToast(`🎰 Poslata komanda za promenu igre: [${gameId.toUpperCase()}]`);
      });
    });

    // 5. Session Reset
    const btnResetSession = document.getElementById('btn-cmd-reset-session');
    if (btnResetSession) btnResetSession.addEventListener('click', () => {
      if (confirm('Da li ste sigurni da želite da resetujete celu sesiju slota i osvežite igru?')) {
        this.sendCommand({ action: 'RESET_SESSION' });
        this.showToast('🧹 Poslat zahtev za reset sesije slota');
      }
    });
  }

  /* ==========================================================================
     Tab 4: Push Notifications & Marketing
     ========================================================================== */

  initPushTab() {
    const btnPushJackpot = document.getElementById('btn-push-jackpot-alert');
    if (btnPushJackpot) btnPushJackpot.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'jackpot' });
      this.showToast('🔔 Poslata push notifikacija: Džekpot Alarm');
    });

    const btnPushTour = document.getElementById('btn-push-tour-alert');
    if (btnPushTour) btnPushTour.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'tournament' });
      this.showToast('🔔 Poslata push notifikacija: Turnir Poziv');
    });

    const btnPushBonus = document.getElementById('btn-push-bonus-alert');
    if (btnPushBonus) btnPushBonus.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'bonus' });
      this.showToast('🔔 Poslata push notifikacija: Točak Sreće');
    });

    const btnSendCustom = document.getElementById('btn-send-custom-push');
    if (btnSendCustom) btnSendCustom.addEventListener('click', () => {
      const title = document.getElementById('input-push-title').value.trim();
      const body = document.getElementById('input-push-body').value.trim();

      if (title && body) {
        this.sendCommand({ action: 'TRIGGER_PUSH', title, body });
        this.showToast(`🚀 Prilagođena notifikacija poslata: "${title}"`);
      } else {
        alert('Molimo unesite naslov i tekst poruke.');
      }
    });
  }

  /* ==========================================================================
     Tabs & Toast Helpers
     ========================================================================== */

  initTabs() {
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(`pane-${target}`);
        if (pane) pane.classList.add('active');
      });
    });
  }

  showToast(msg) {
    let toast = document.getElementById('admin-toast-popup');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast-popup';
      toast.className = 'admin-toast-popup';
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.add('visible');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  /* ==========================================================================
     Operator PIN Security & Auto-Lock System
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
      stored = AdminDashboard.hashPin('7777');
      try { localStorage.setItem(key, stored); } catch (e) {}
    }
    return stored;
  }

  verifyPin(inputPin) {
    return AdminDashboard.hashPin(inputPin) === this.getStoredPinHash();
  }

  initSecurity() {
    this.currentPinInput = '';
    this.inactivityTimer = null;
    this.lockoutInterval = null;

    this.lockOverlay = document.getElementById('admin-lock-screen');
    this.feedbackEl = document.getElementById('admin-pin-feedback');
    this.pinDots = document.querySelectorAll('#admin-pin-dots .pin-dot');
    this.pinCard = document.querySelector('.pin-card-box');

    // Check lockout first
    this.checkLockout();

    // Check existing session auth
    const isAuthed = sessionStorage.getItem('grandslot_admin_session_auth') === 'true';
    if (isAuthed && !this.isLockedOut()) {
      this.unlockSession(false);
    } else {
      this.lockSession(false);
    }

    // Keypad button clicks
    const keypad = document.getElementById('admin-pin-keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const key = btn.getAttribute('data-key');
        this.handleKeypadInput(key);
      });
    }

    // Physical keyboard input
    window.addEventListener('keydown', (e) => {
      // If locked, capture numeric keys
      if (this.lockOverlay && !this.lockOverlay.classList.contains('hidden')) {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          this.handleKeypadInput(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.handleKeypadInput('BACK');
        } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          this.handleKeypadInput('C');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (this.currentPinInput.length === 4) {
            this.submitPin();
          }
        }
      }
    });

    // Manual lock button in top nav
    const lockBtn = document.getElementById('btn-lock-session');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        this.lockSession(true);
        this.showToast('🔒 Sesija operatera je zaključana.');
      });
    }

    // Inactivity watchdog (5 minutes = 300,000 ms)
    const resetWatchdog = () => this.resetInactivityWatchdog();
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      window.addEventListener(evt, resetWatchdog, { passive: true });
    });

    // Change PIN form
    this.initChangePinForm();
  }

  handleKeypadInput(key) {
    if (this.isLockedOut()) return;

    if (key >= '0' && key <= '9') {
      if (this.currentPinInput.length < 4) {
        this.currentPinInput += key;
        this.updatePinDots();
        if (this.currentPinInput.length === 4) {
          setTimeout(() => this.submitPin(), 90);
        }
      }
    } else if (key === 'BACK') {
      if (this.currentPinInput.length > 0) {
        this.currentPinInput = this.currentPinInput.slice(0, -1);
        this.updatePinDots();
      }
    } else if (key === 'C') {
      this.currentPinInput = '';
      this.updatePinDots();
      this.setFeedback('', '');
    }
  }

  updatePinDots() {
    this.pinDots.forEach((dot, idx) => {
      if (idx < this.currentPinInput.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  submitPin() {
    if (this.isLockedOut()) return;

    if (this.verifyPin(this.currentPinInput)) {
      // Success!
      localStorage.setItem('grandslot_pin_failed_attempts', '0');
      this.setFeedback('✓ AUTORIZOVAN PRISTUP', 'success');
      setTimeout(() => {
        this.unlockSession(true);
      }, 250);
    } else {
      // Failed attempt
      let failed = parseInt(localStorage.getItem('grandslot_pin_failed_attempts') || '0', 10) + 1;
      localStorage.setItem('grandslot_pin_failed_attempts', String(failed));

      if (this.pinCard) {
        this.pinCard.classList.remove('shake');
        void this.pinCard.offsetWidth; // trigger reflow
        this.pinCard.classList.add('shake');
      }

      if (failed >= 5) {
        const lockoutUntil = Date.now() + 30000; // 30 seconds
        localStorage.setItem('grandslot_pin_lockout_until', String(lockoutUntil));
        localStorage.setItem('grandslot_pin_failed_attempts', '0');
        this.startLockoutCountdown(lockoutUntil);
      } else {
        const left = 5 - failed;
        this.setFeedback(`Netačan PIN kod! (Preostalo pokušaja: ${left})`, 'error');
        this.currentPinInput = '';
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
    this.currentPinInput = '';
    this.updatePinDots();

    const updateTimer = () => {
      const remainingSec = Math.ceil((until - Date.now()) / 1000);
      if (remainingSec <= 0) {
        clearInterval(this.lockoutInterval);
        this.lockoutInterval = null;
        localStorage.removeItem('grandslot_pin_lockout_until');
        this.setFeedback('Pokušajte ponovo.', '');
      } else {
        this.setFeedback(`⚠️ Previše neuspešnih pokušaja! Sačekajte: ${remainingSec}s`, 'lockout');
      }
    };

    updateTimer();
    this.lockoutInterval = setInterval(updateTimer, 1000);
  }

  setFeedback(text, type) {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = 'pin-feedback-msg ' + (type || '');
  }

  unlockSession(markSession = true) {
    if (markSession) {
      sessionStorage.setItem('grandslot_admin_session_auth', 'true');
    }
    if (this.lockOverlay) {
      this.lockOverlay.classList.add('hidden');
    }
    this.currentPinInput = '';
    this.updatePinDots();
    this.setFeedback('', '');
    this.resetInactivityWatchdog();
  }

  lockSession(clearSession = true) {
    if (clearSession) {
      sessionStorage.removeItem('grandslot_admin_session_auth');
    }
    if (this.lockOverlay) {
      this.lockOverlay.classList.remove('hidden');
    }
    this.currentPinInput = '';
    this.updatePinDots();
    this.checkLockout();
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  }

  resetInactivityWatchdog() {
    if (this.lockOverlay && !this.lockOverlay.classList.contains('hidden')) return;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    // 5 minutes = 300,000 ms
    this.inactivityTimer = setTimeout(() => {
      this.lockSession(true);
      this.showToast('🔒 Sesija je automatski zaključana zbog neaktivnosti.');
    }, 300000);
  }

  initChangePinForm() {
    const saveBtn = document.getElementById('btn-save-new-pin');
    const oldInput = document.getElementById('input-pin-old');
    const newInput = document.getElementById('input-pin-new');
    const confirmInput = document.getElementById('input-pin-confirm');
    const msgEl = document.getElementById('pin-change-status-msg');

    if (!saveBtn || !oldInput || !newInput || !confirmInput) return;

    saveBtn.addEventListener('click', () => {
      const oldVal = (oldInput.value || '').trim();
      const newVal = (newInput.value || '').trim();
      const confirmVal = (confirmInput.value || '').trim();

      if (!this.verifyPin(oldVal)) {
        msgEl.textContent = '❌ Trenutni PIN nije ispravan.';
        msgEl.style.color = '#ef4444';
        return;
      }

      if (!/^\d{4}$/.test(newVal)) {
        msgEl.textContent = '❌ Novi PIN mora sadržati tačno 4 cifre (0-9).';
        msgEl.style.color = '#ef4444';
        return;
      }

      if (newVal !== confirmVal) {
        msgEl.textContent = '❌ Novi PIN i potvrda se ne poklapaju.';
        msgEl.style.color = '#ef4444';
        return;
      }

      const newHash = AdminDashboard.hashPin(newVal);
      localStorage.setItem('grandslot_operator_pin_hash', newHash);
      
      oldInput.value = '';
      newInput.value = '';
      confirmInput.value = '';

      msgEl.textContent = '✓ PIN je uspešno promenjen!';
      msgEl.style.color = '#00e676';
      this.showToast('🔐 Operaterski PIN je uspešno ažuriran!');

      setTimeout(() => {
        msgEl.textContent = '';
      }, 4000);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});

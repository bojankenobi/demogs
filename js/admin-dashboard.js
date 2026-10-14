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
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});

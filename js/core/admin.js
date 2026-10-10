/**
 * IGT - Operator / Admin Control Panel
 * Secret activation via 5 clicks on IGT logo or keyboard shortcut Ctrl+Shift+A / `~`
 * Enables live RTP Presets, symbol weight tuning, RTP Monte Carlo simulation, and instant demo triggers.
 */
class AdminPanel {
  constructor(app) {
    this.app = app;
    this.mathManager = (this.app && this.app.mathManager) ? this.app.mathManager : new window.SlotMathManager();
    this.app.mathManager = this.mathManager;

    this.logoClicks = 0;
    this.lastLogoClickTime = 0;
    this.isOpen = false;

    this.initDOM();
    this.initEvents();
  }

  initDOM() {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'admin-panel-modal';
    modal.className = 'admin-modal-overlay';
    modal.innerHTML = `
      <div class="admin-modal-box">
        <div class="admin-header">
          <div class="admin-title-wrap">
            <span class="admin-badge">OPERATOR / DEMO</span>
            <h2 class="admin-title">⚙️ IGT ADMIN PANEL</h2>
          </div>
          <button class="admin-close-btn" id="admin-close-btn" title="Zatvori">✕</button>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab-btn active" data-tab="presets">📊 RTP & Matematika</button>
          <button class="admin-tab-btn" data-tab="simulator">⚡ RTP Simulator</button>
          <button class="admin-tab-btn" data-tab="triggers">🎯 Demo Prečice</button>
        </div>

        <div class="admin-content">
          <!-- TAB 1: PRESETS & WEIGHTS -->
          <div class="admin-tab-pane active" id="pane-presets">
            <div class="admin-section-desc">
              Odaberite fabrički matematički profil ili prilagodite težine simbola:
            </div>

            <div class="preset-cards-grid">
              <div class="preset-card ${this.mathManager.activePreset === 'promo' ? 'active' : ''}" data-preset="promo">
                <div class="preset-card-head">
                  <span class="preset-name">🎉 Promo / Reklama</span>
                  <span class="preset-rtp">~98.5% RTP</span>
                </div>
                <div class="preset-desc">Maksimalan doživljaj za sajmove i prezentacije. Izuzetno česti dobici i brzi bonusi.</div>
              </div>

              <div class="preset-card ${this.mathManager.activePreset === 'standard' ? 'active' : ''}" data-preset="standard">
                <div class="preset-card-head">
                  <span class="preset-name">🎰 Casino Standard</span>
                  <span class="preset-rtp">~96.2% RTP</span>
                </div>
                <div class="preset-desc">Standardna industrijska slot matematika. Balansiran odnos adrenalina i dobitaka.</div>
              </div>

              <div class="preset-card ${this.mathManager.activePreset === 'tight' ? 'active' : ''}" data-preset="tight">
                <div class="preset-card-head">
                  <span class="preset-name">🔥 Visoka Volatilnost</span>
                  <span class="preset-rtp">~93.8% RTP</span>
                </div>
                <div class="preset-desc">Veći rizik i ređi dobici, ali ekstremni pikovi. Za takmičenja i duže sesije.</div>
              </div>
            </div>

            <div class="admin-subhead">⚖️ Podešavanje težina simbola (Weight)</div>
            <div class="weights-editor-grid" id="weights-editor-grid">
              <!-- Dynamically populated -->
            </div>
            <div class="admin-info-note">ℹ️ Veća težina = simbol češće pada. Manja težina = redak simbol sa visokom isplatom.</div>
          </div>

          <!-- TAB 2: RTP SIMULATOR -->
          <div class="admin-tab-pane" id="pane-simulator">
            <div class="admin-section-desc">
              Testirajte trenutnu matematiku kroz Monte Carlo simulaciju od 10.000 do 100.000 spinova u sekundi:
            </div>

            <div class="sim-controls-bar">
              <div class="sim-game-select">
                <label>Igra za test:</label>
                <select id="sim-game-choice" class="admin-select">
                  <option value="royal3x3">Royal 3x3 (5 Linija)</option>
                  <option value="classic">Classic 1-Line Slot</option>
                </select>
              </div>

              <div class="sim-spins-select">
                <label>Broj spinova:</label>
                <div class="sim-spins-btns">
                  <button class="admin-btn-action sim-run-btn" data-spins="10000">10.000</button>
                  <button class="admin-btn-action sim-run-btn active" data-spins="50000">50.000</button>
                  <button class="admin-btn-action sim-run-btn" data-spins="100000">100.000</button>
                </div>
              </div>
            </div>

            <div class="sim-status-box" id="sim-status-box">
              Kliknite na jedno od dugmadi iznad da pokrenete simulaciju.
            </div>

            <div class="sim-results-grid" id="sim-results-grid" style="display: none;">
              <div class="sim-stat-card">
                <span class="sim-stat-lbl">REALIZOVANI RTP</span>
                <span class="sim-stat-val val-gold" id="sim-res-rtp">0%</span>
              </div>
              <div class="sim-stat-card">
                <span class="sim-stat-lbl">HIT RATE (UČESTALOST)</span>
                <span class="sim-stat-val" id="sim-res-hitrate">0%</span>
              </div>
              <div class="sim-stat-card">
                <span class="sim-stat-lbl">MAX WIN U SESIJI</span>
                <span class="sim-stat-val val-green" id="sim-res-maxwin">0x</span>
              </div>
              <div class="sim-stat-card">
                <span class="sim-stat-lbl">ODNOS ULOG / DOBITAK</span>
                <span class="sim-stat-val" id="sim-res-betwin">0 / 0</span>
              </div>
            </div>
          </div>

          <!-- TAB 3: DEMO TRIGGERS -->
          <div class="admin-tab-pane" id="pane-triggers">
            <div class="admin-section-desc">
              Trenutno forsirajte događaje na ekranu za potrebe demonstracije ili snimanja reklame:
            </div>

            <div class="triggers-grid">
              <div class="trigger-group">
                <div class="trigger-group-title">🏆 Džekpotovi (Instant Win)</div>
                <div class="trigger-btns-row">
                  <button class="admin-btn-trigger silver" id="btn-trigger-silver">🥈 Trigger SILVER</button>
                  <button class="admin-btn-trigger gold" id="btn-trigger-gold">🏆 Trigger GOLD</button>
                  <button class="admin-btn-trigger diamond" id="btn-trigger-diamond">💎 Trigger DIAMOND</button>
                </div>
              </div>

              <div class="trigger-group">
                <div class="trigger-group-title">⚡ Frenzy / Bonus Rush Metri</div>
                <div class="trigger-btns-row">
                  <button class="admin-btn-trigger" id="btn-trigger-fill-cards">🃏 Napuni Cards (Gamble)</button>
                  <button class="admin-btn-trigger" id="btn-trigger-fill-mines">💣 Napuni Mines Bonus</button>
                  <button class="admin-btn-trigger frenzy" id="btn-trigger-double-rush">🔥 DOUBLE RUSH ODMAH</button>
                </div>
              </div>

              <div class="trigger-group">
                <div class="trigger-group-title">💰 Novčanik & Krediti</div>
                <div class="trigger-btns-row">
                  <button class="admin-btn-trigger" id="btn-trigger-add-10k">➕ Dodaj +10.000 RSD</button>
                  <button class="admin-btn-trigger" id="btn-trigger-reset-1k">🔄 Postavi na 1.000 RSD</button>
                  <button class="admin-btn-trigger" id="btn-trigger-reset-stats">🧹 Resetuj istoriju sesije</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-footer">
          <div class="admin-hint">Prečica: <strong>5 klikova na logo</strong> ili taster <strong>~</strong></div>
          <button class="admin-btn-primary" id="admin-done-btn">Sačuvaj i Zatvori</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
  }

  initEvents() {
    // 1. Logo clicks (5 within 2.5 seconds)
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
          this.open();
        }
      });
    }

    // 2. Keyboard shortcut: Ctrl + Shift + A or Backquote (~)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle();
      }
    });

    // 3. Close & Open from rules buttons
    const openFromRules = document.getElementById('open-admin-from-rules');
    if (openFromRules) {
      openFromRules.addEventListener('click', () => {
        const paytableModal = document.getElementById('paytable-modal');
        if (paytableModal) paytableModal.classList.remove('active');
        this.open();
      });
    }

    const closeBtn = document.getElementById('admin-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    const doneBtn = document.getElementById('admin-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', () => this.close());

    // 4. Tab switching
    const tabBtns = this.modalEl.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.modalEl.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(`pane-${target}`);
        if (pane) pane.classList.add('active');
      });
    });

    // 5. Preset selection
    const presetCards = this.modalEl.querySelectorAll('.preset-card');
    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const presetId = card.getAttribute('data-preset');
        this.mathManager.setPreset(presetId);
        presetCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.renderWeightsEditor();
        if (window.slotAudio) window.slotAudio.playClick();
      });
    });

    // 6. Simulator triggers
    const simBtns = this.modalEl.querySelectorAll('.sim-run-btn');
    simBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        simBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const spins = parseInt(btn.getAttribute('data-spins'), 10);
        this.executeSimulation(spins);
      });
    });

    // 7. Demo triggers
    const triggerSilver = document.getElementById('btn-trigger-silver');
    if (triggerSilver) triggerSilver.addEventListener('click', () => {
      this.app.jackpots.awardJackpot('silver', (t, p, m) => {
        this.app.showMessage(`🥈 DEMO: SILVER JACKPOT +${p.toLocaleString()} RSD!`, 'jackpot');
      });
      this.close();
    });

    const triggerGold = document.getElementById('btn-trigger-gold');
    if (triggerGold) triggerGold.addEventListener('click', () => {
      this.app.jackpots.awardJackpot('gold', (t, p, m) => {
        this.app.showMessage(`🏆 DEMO: GOLD JACKPOT +${p.toLocaleString()} RSD!`, 'jackpot');
      });
      this.close();
    });

    const triggerDiamond = document.getElementById('btn-trigger-diamond');
    if (triggerDiamond) triggerDiamond.addEventListener('click', () => {
      this.app.jackpots.awardJackpot('diamond', (t, p, m) => {
        this.app.showMessage(`💎 DEMO: DIAMOND JACKPOT +${p.toLocaleString()} RSD!`, 'jackpot');
      });
      this.close();
    });

    const triggerFillCards = document.getElementById('btn-trigger-fill-cards');
    if (triggerFillCards) triggerFillCards.addEventListener('click', () => {
      if (this.app.meters) {
        this.app.meters.cardsProgress = 100;
        this.app.meters.activateCardsBonus(this.app.wallet.bet);
        this.app.showMessage('🃏 CARDS GESTIJA OTKLJUČANA!', 'frenzy');
      }
      this.close();
    });

    const triggerFillMines = document.getElementById('btn-trigger-fill-mines');
    if (triggerFillMines) triggerFillMines.addEventListener('click', () => {
      if (this.app.meters) {
        this.app.meters.minesProgress = 100;
        this.app.meters.activateMinesBonus(this.app.wallet.bet);
        this.app.showMessage('💣 MINES BONUS SPREMAN!', 'frenzy');
      }
      this.close();
    });

    const triggerDoubleRush = document.getElementById('btn-trigger-double-rush');
    if (triggerDoubleRush) triggerDoubleRush.addEventListener('click', () => {
      if (this.app.meters) {
        this.app.meters.cardsProgress = 100;
        this.app.meters.activateCardsBonus(this.app.wallet.bet);
        this.app.meters.minesProgress = 100;
        this.app.meters.activateMinesBonus(this.app.wallet.bet);
        this.app.showMessage('🔥 DOUBLE BONUS RUSH AKTIVIRAN!', 'frenzy');
      }
      this.close();
    });

    const triggerAdd10k = document.getElementById('btn-trigger-add-10k');
    if (triggerAdd10k) triggerAdd10k.addEventListener('click', () => {
      this.app.wallet.addFictionalRsd(10000);
      this.app.showMessage('💰 +10.000 RSD DODATO NA RAČUN!', 'win');
    });

    const triggerReset1k = document.getElementById('btn-trigger-reset-1k');
    if (triggerReset1k) triggerReset1k.addEventListener('click', () => {
      this.app.wallet.rsdBalance = 1000;
      this.app.wallet.saveState();
      this.app.wallet.updateUI();
      this.app.showMessage('🔄 STANJE POSTAVLJENO NA 1.000 RSD', 'info');
      if (window.slotAudio) window.slotAudio.playClick();
    });

    const triggerResetStats = document.getElementById('btn-trigger-reset-stats');
    if (triggerResetStats) triggerResetStats.addEventListener('click', () => {
      localStorage.clear();
      this.app.showMessage('🧹 Istorija sesije i keš resetovani', 'info');
      setTimeout(() => window.location.reload(), 500);
    });
  }

  renderWeightsEditor() {
    const container = document.getElementById('weights-editor-grid');
    if (!container) return;

    const weights = this.mathManager.getActiveWeights();
    const symbols = window.CLASSIC_SYMBOLS || [];

    container.innerHTML = symbols.map(sym => {
      const curWeight = weights[sym.id] !== undefined ? weights[sym.id] : sym.weight;
      return `
        <div class="weight-item-card">
          <div class="weight-sym-info">
            <img src="${sym.svg}" alt="${sym.name}" class="weight-sym-icon" />
            <div class="weight-sym-text">
              <span class="weight-sym-name">${sym.name}</span>
              <span class="weight-sym-payout">3x: <strong>${sym.payout3}x</strong> | 2x: <strong>${sym.payout2}x</strong></span>
            </div>
          </div>
          <div class="weight-input-wrap">
            <label>Težina:</label>
            <input type="number" min="1" max="50" value="${curWeight}" data-symbol="${sym.id}" class="weight-number-input" />
          </div>
        </div>
      `;
    }).join('');

    // Attach change events to inputs
    container.querySelectorAll('.weight-number-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const symId = e.target.getAttribute('data-symbol');
        const val = parseInt(e.target.value, 10);
        this.mathManager.setCustomWeight(symId, val);
        // Deselect preset cards since it is custom now
        this.modalEl.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      });
    });
  }

  executeSimulation(spins) {
    const statusBox = document.getElementById('sim-status-box');
    const resultsGrid = document.getElementById('sim-results-grid');
    const gameChoice = document.getElementById('sim-game-choice').value;

    if (statusBox) statusBox.textContent = `⏳ Izvršavam ${spins.toLocaleString()} spinova u pozadini...`;
    if (resultsGrid) resultsGrid.style.display = 'none';

    // Allow UI to paint the loading text
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

  open() {
    this.isOpen = true;
    this.modalEl.classList.add('active');
    this.renderWeightsEditor();
    if (window.slotAudio) window.slotAudio.playClick();
  }

  close() {
    this.isOpen = false;
    this.modalEl.classList.remove('active');
    if (window.slotAudio) window.slotAudio.playClick();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}

window.AdminPanel = AdminPanel;

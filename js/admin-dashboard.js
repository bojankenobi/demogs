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
    this.peer = null;
    this.remoteConn = null;
    this.isRemoteConnected = false;

    this.initSecurity();
    this.initChannel();
    this.initWebRTC();
    this.initTabs();
    this.initPresetsAndWeights();
    this.initSimulator();
    this.initTriggers();
    this.initCrmHub();
    this.initPromoHub();
    
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
        console.warn('Failed to send command to slot via channel:', e);
      }
    }

    // Forward to remote slot via WebRTC DataChannel (phone to remote kiosk)
    if (this.remoteConn && this.remoteConn.open) {
      try {
        this.remoteConn.send(data);
      } catch (e) {
        console.warn('Failed to send command to slot via WebRTC:', e);
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
      const label = this.isRemoteConnected ? `WEBRTC (${this.targetRoomId})` : 'LOKALNO (LIVE)';
      this.setConnected(true, label);
      if (data.state) {
        this.applyLiveState(data.state);
      }
    }
  }

  setConnected(connected, label) {
    this.isConnected = connected;
    const pill = document.getElementById('conn-status-pill');
    const txt = document.getElementById('conn-status-text');

    if (pill && txt) {
      if (connected) {
        pill.className = 'conn-pill connected';
        txt.textContent = label ? `POVEZAN: ${label}` : 'POVEZAN SA SLOTOM (LIVE)';
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
      balEl.textContent = `${state.balance.toLocaleString()} ZLT`;
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
      if (sEl && state.jackpots.silver !== undefined) sEl.textContent = `${Number(state.jackpots.silver).toLocaleString()} ZLT`;
      if (gEl && state.jackpots.gold !== undefined) gEl.textContent = `${Number(state.jackpots.gold).toLocaleString()} ZLT`;
      if (dEl && state.jackpots.diamond !== undefined) dEl.textContent = `${Number(state.jackpots.diamond).toLocaleString()} ZLT`;
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
        this.showToast(`Aktiviran matematički profil: ${presetId.toUpperCase()}`);
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
        this.showToast('Težine simbola vraćene na fabričke vrednosti');
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
        this.showToast(`Težina simbola [${symId}] ažurirana na ${val}`);
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
        statusBox.textContent = `Simulacija završena za ${elapsed}s (${spins.toLocaleString()} spinova na ${res.gameType === 'royal3x3' ? 'Royal 3x3' : 'Classic 1-Line'}).`;
      }

      if (resultsGrid) {
        resultsGrid.style.display = 'grid';
        document.getElementById('sim-res-rtp').textContent = `${res.rtp}%`;
        document.getElementById('sim-res-hitrate').textContent = `${res.hitRate}%`;
        document.getElementById('sim-res-maxwin').textContent = `${res.maxWinMult}x`;
        document.getElementById('sim-res-betwin').textContent = `${res.totalBet.toLocaleString()} / ${res.totalWon.toLocaleString()} ZLT`;
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
      this.showToast('Poslata komanda: Okini SILVER Džekpot');
    });

    const btnGold = document.getElementById('btn-cmd-gold');
    if (btnGold) btnGold.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_JACKPOT', tier: 'gold' });
      this.showToast('Poslata komanda: Okini GOLD Džekpot');
    });

    const btnDiamond = document.getElementById('btn-cmd-diamond');
    if (btnDiamond) btnDiamond.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_JACKPOT', tier: 'diamond' });
      this.showToast('Poslata komanda: Okini DIAMOND Džekpot');
    });

    // 2. Bonuses
    const btnWheel = document.getElementById('btn-cmd-wheel');
    if (btnWheel) btnWheel.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'wheel' });
      this.showToast('Poslata komanda: Pokreni Točak Sreće');
    });

    const btnMines = document.getElementById('btn-cmd-mines');
    if (btnMines) btnMines.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'mines' });
      this.showToast('Poslata komanda: Pokreni Mines Bonus');
    });

    const btnCards = document.getElementById('btn-cmd-cards');
    if (btnCards) btnCards.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'cards' });
      this.showToast('Poslata komanda: Napuni Cards Bonus');
    });

    const btnRush = document.getElementById('btn-cmd-doublerush');
    if (btnRush) btnRush.addEventListener('click', () => {
      this.sendCommand({ action: 'TRIGGER_BONUS', bonusType: 'doublerush' });
      this.showToast('Poslata komanda: DOUBLE BONUS RUSH');
    });

    // 3. Wallet
    const btnAdd10k = document.getElementById('btn-cmd-add10k');
    if (btnAdd10k) btnAdd10k.addEventListener('click', () => {
      this.sendCommand({ action: 'WALLET_ADD', amount: 10000 });
      this.showToast('Poslato: +10.000 ZLT na račun igrača');
    });

    const btnReset1k = document.getElementById('btn-cmd-reset1k');
    if (btnReset1k) btnReset1k.addEventListener('click', () => {
      this.sendCommand({ action: 'WALLET_SET', amount: 1000 });
      this.showToast('Poslato: Stanje postavljeno na 1.000 ZLT');
    });

    const btnCustomDeposit = document.getElementById('btn-cmd-custom-deposit');
    if (btnCustomDeposit) btnCustomDeposit.addEventListener('click', () => {
      const val = parseInt(document.getElementById('input-custom-deposit-amount').value, 10);
      if (val > 0) {
        this.sendCommand({ action: 'WALLET_SET', amount: val });
        this.showToast(`Poslato: Stanje postavljeno na ${val.toLocaleString()} ZLT`);
      }
    });

    // 4. Game Switching
    document.querySelectorAll('.btn-switch-game').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.getAttribute('data-game');
        this.sendCommand({ action: 'SWITCH_GAME', gameId });
        this.showToast(`Poslata komanda za promenu igre: [${gameId.toUpperCase()}]`);
      });
    });

    // 5. Session Reset
    const btnResetSession = document.getElementById('btn-cmd-reset-session');
    if (btnResetSession) btnResetSession.addEventListener('click', () => {
      if (confirm('Da li ste sigurni da želite da resetujete celu sesiju slota i osvežite igru?')) {
        this.sendCommand({ action: 'RESET_SESSION' });
        this.showToast('Poslat zahtev za reset sesije slota');
      }
    });
  }

  /* ==========================================================================
     Tab 4: CRM Player Database & Smart Push Campaigns
     ========================================================================== */

  /* ==========================================================================
     Tab 4 & 5: CRM Player Database & Voucher Scans
     ========================================================================== */

  initCrmHub() {
    this.crmActiveSegment = 'all';
    this.crmSearchQuery = '';
    this.crmSearchTimeout = null;

    // Segment Filters
    const filterBtns = document.querySelectorAll('.crm-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.crmActiveSegment = btn.getAttribute('data-segment') || 'all';
        this.fetchCrmPlayers();
      });
    });

    // Search Bar
    const searchInput = document.getElementById('crm-player-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.crmSearchTimeout);
        this.crmSearchTimeout = setTimeout(() => {
          this.crmSearchQuery = e.target.value.trim();
          this.fetchCrmPlayers();
        }, 300);
      });
    }

    // Refresh CRM
    const refreshBtn = document.getElementById('btn-crm-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchCrmPlayers();
        this.showToast('Lista igrača osvežena');
      });
    }

    // Refresh Voucher Scans
    const scansRefreshBtn = document.getElementById('btn-crm-scans-refresh');
    if (scansRefreshBtn) {
      scansRefreshBtn.addEventListener('click', () => {
        this.fetchVoucherScans();
        this.showToast('Dnevnik overenih vaučera osvežen');
      });
    }

    // Initial load
    this.fetchCrmPlayers();
    this.fetchVoucherScans();
  }

  /* ==========================================================================
     Tab 6: Promotions Hub, Custom Posters & Voucher Trigger Manager
     ========================================================================== */

  initPromoHub() {
    // 1. Seed or load campaign registry
    this.campaignsRegistry = this.loadCampaignsRegistry();

    // 2. Set default expiry: 7 days from now
    this.setDefaultExpiry(7);

    // 3. Quick Expiry presets (+3, +7, +30 days)
    document.querySelectorAll('.btn-expiry-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-expiry-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const days = parseInt(btn.getAttribute('data-days'), 10) || 7;
        this.setDefaultExpiry(days);
        this.updateLivePosterPreview();
      });
    });

    // 4. Target selector toggle
    const targetSelect = document.getElementById('select-push-target');
    const targetPlayerGroup = document.getElementById('group-target-player-id');
    if (targetSelect && targetPlayerGroup) {
      targetSelect.addEventListener('change', () => {
        targetPlayerGroup.style.display = targetSelect.value === 'single' ? 'flex' : 'none';
        this.updateLivePosterPreview();
      });
    }

    // 5. Template selector
    const templateSelect = document.getElementById('select-push-template');
    if (templateSelect) {
      templateSelect.addEventListener('change', () => {
        this.applyPromoTemplate(templateSelect.value);
      });
    }

    // 6. Live preview input listeners (realtime updating as operator types)
    const previewTriggers = [
      'input-push-title',
      'input-push-body',
      'input-push-image',
      'input-push-location',
      'select-push-promo',
      'input-promo-expiry',
      'input-promo-campaign-id'
    ];
    previewTriggers.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateLivePosterPreview());
        el.addEventListener('change', () => this.updateLivePosterPreview());
      }
    });

    // 7. Poster Drag & Drop + File Upload with automatic compression
    this.initPosterUploader();

    // 8. Preset Quick Push Buttons (Jackpot, Tour, Wheel)
    this.initQuickPushButtons();

    // 9. Publish & Send Campaign Button
    const btnSend = document.getElementById('btn-send-custom-push');
    if (btnSend) {
      btnSend.addEventListener('click', () => this.publishCampaign(true));
    }

    // 10. Save Draft Button
    const btnDraft = document.getElementById('btn-save-campaign-draft');
    if (btnDraft) {
      btnDraft.addEventListener('click', () => this.publishCampaign(false));
    }

    // 11. Refresh campaigns table
    const btnRefresh = document.getElementById('btn-refresh-campaigns');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.campaignsRegistry = this.loadCampaignsRegistry();
        this.renderCampaignsTable();
        this.showToast('Lista promocija osvežena');
      });
    }

    // Initial render
    this.updateLivePosterPreview();
    this.renderCampaignsTable();
  }

  setDefaultExpiry(days) {
    const input = document.getElementById('input-promo-expiry');
    if (!input) return;
    const targetDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
    // format as YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}T${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`;
    input.value = formatted;
  }

  initPosterUploader() {
    const dropzone = document.getElementById('poster-dropzone');
    const fileInput = document.getElementById('input-poster-file');
    const browseBtn = document.getElementById('btn-browse-poster');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.processUploadedPoster(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.processUploadedPoster(e.target.files[0]);
        }
      });
    }
  }

  processUploadedPoster(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Molimo izaberite validan slikovni fajl (JPG, PNG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (file.type === 'image/svg+xml') {
        this.setPosterImage(dataUrl, file.name);
        return;
      }

      // Optimize bitmap images via offscreen canvas (max 1200x675)
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const maxH = 675;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          if (w / h > maxW / maxH) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          } else {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        this.setPosterImage(optimizedDataUrl, file.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  setPosterImage(url, fileName) {
    const imgInput = document.getElementById('input-push-image');
    if (imgInput) imgInput.value = url;
    this.updateLivePosterPreview();
    this.showToast(`Poster uspešno postavljen: ${fileName || 'Custom slika'}`);
  }

  applyPromoTemplate(key) {
    const templates = {
      voucher_1000: {
        id: 'promo_vikend_reload',
        title: 'VIP VIKEND RELOAD TIKET',
        body: 'Preuzmite svoj VIP vaučer za igru na slot aparatima u našem klubu i duplirajte uzbuđenje!',
        image: 'assets/promotions/promo_weekend_vip.svg',
        location: 'Grand Slot Club - Kralja Milana 12, Beograd',
        promo: 'voucher:1000',
        days: 7
      },
      voucher_drink: {
        id: 'promo_welcome_drink',
        title: 'VIP WELCOME DRINK NA ŠANKU',
        body: 'Preuzmite svoj ekskluzivni koktel dobrodošlice prilikom posete klubu!',
        image: 'assets/promotions/promo_drink.svg',
        location: 'Grand Slot Club - VIP Bar',
        promo: 'voucher_drink:1',
        days: 14
      },
      voucher_tournament: {
        id: 'promo_120s_turnir',
        title: 'VIP ULAZNICA ZA KAZINO TURNIR',
        body: 'Obezbedite besplatan ulaz na ekskluzivni 120s slot turnir sa fondom od 50.000 ZLT!',
        image: 'assets/promotions/promo_tournament.svg',
        location: 'Grand Slot Club - Arena 1',
        promo: 'voucher_tour:1',
        days: 5
      },
      voucher_birthday: {
        id: 'promo_vip_rodjendan',
        title: 'SREĆAN ROĐENDAN OD GRAND SLOTA',
        body: 'Čeka vas rođendanski keš poklon od 2.000 ZLT na blagajni kluba!',
        image: 'assets/promotions/promo_birthday.svg',
        location: 'Grand Slot Club - VIP Blagajna',
        promo: 'voucher:2000',
        days: 30
      },
      free_spins_25: {
        id: 'promo_super_spins_25',
        title: 'VIP POKLON: 25 BESPLATNIH SPINOVA',
        body: 'Zavrtite slot odmah uz 25 gratis spinova i 2x duplirane dobitke u Super Bonusu!',
        image: 'assets/promotions/promo_spins.svg',
        location: 'Grand Slot Online',
        promo: 'free_spins:25',
        days: 7
      }
    };

    if (templates[key]) {
      const t = templates[key];
      const idInput = document.getElementById('input-promo-campaign-id');
      const titleInput = document.getElementById('input-push-title');
      const bodyInput = document.getElementById('input-push-body');
      const imageInput = document.getElementById('input-push-image');
      const locationInput = document.getElementById('input-push-location');
      const promoSelect = document.getElementById('select-push-promo');

      if (idInput) idInput.value = t.id;
      if (titleInput) titleInput.value = t.title;
      if (bodyInput) bodyInput.value = t.body;
      if (imageInput) imageInput.value = t.image;
      if (locationInput) locationInput.value = t.location;
      if (promoSelect) promoSelect.value = t.promo;
      if (t.days) this.setDefaultExpiry(t.days);

      this.updateLivePosterPreview();
    }
  }

  updateLivePosterPreview() {
    const title = (document.getElementById('input-push-title')?.value || 'VIP PROMOCIJA').trim();
    const body = (document.getElementById('input-push-body')?.value || '').trim();
    const image = (document.getElementById('input-push-image')?.value || 'assets/promotions/promo_weekend_vip.svg').trim();
    const location = (document.getElementById('input-push-location')?.value || 'Grand Slot Club').trim();
    const promoSelectVal = document.getElementById('select-push-promo')?.value || 'none:0';
    const [action, rawVal] = promoSelectVal.split(':');
    const val = parseInt(rawVal, 10) || 0;
    const expiryVal = document.getElementById('input-promo-expiry')?.value;

    const imgEl = document.getElementById('sim-poster-img');
    const titleEl = document.getElementById('sim-poster-title');
    const descEl = document.getElementById('sim-poster-desc');
    const rewardEl = document.getElementById('sim-poster-reward-tag');
    const locEl = document.getElementById('sim-poster-location');
    const timerEl = document.getElementById('sim-poster-timer');
    const ctaBtn = document.getElementById('sim-poster-cta-btn');

    if (imgEl) imgEl.src = image;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = body;
    if (locEl) locEl.textContent = `📍 ${location}`;

    // Reward tag and CTA button label
    let rewardText = '📢 KAZINO OBAVEŠTENJE';
    let btnText = '👍 POGLEDAJ DETALJE';

    if (action === 'voucher') {
      rewardText = `🎟️ ${val.toLocaleString()} ZLT PROMO TIKET`;
      btnText = `🎟️ PREUZMI ${val.toLocaleString()} ZLT VAUČER ZA KLUB`;
    } else if (action === 'voucher_drink') {
      rewardText = '🍸 VIP WELCOME DRINK NA ŠANKU';
      btnText = '🍸 PREUZMI WELCOME DRINK VAUČER';
    } else if (action === 'voucher_tour') {
      rewardText = '🏆 VIP ULAZNICA ZA TURNIR (50.000 ZLT)';
      btnText = '🏆 PREUZMI VIP ULAZNICU ZA TURNIR';
    } else if (action === 'credit_bonus') {
      rewardText = `🪙 +${val.toLocaleString()} ZLT ONLINE DOPUNA`;
      btnText = `🪙 PREUZMI +${val.toLocaleString()} ZLT ODMAH`;
    } else if (action === 'free_spins') {
      rewardText = `🎰 +${val} BESPLATNIH SPINOVA`;
      btnText = `🎰 ZAPOČNI +${val} BESPLATNIH SPINOVA`;
    }

    if (rewardEl) rewardEl.textContent = rewardText;
    if (ctaBtn) ctaBtn.textContent = btnText;

    // Remaining time format
    if (timerEl) {
      if (expiryVal) {
        const diffMs = new Date(expiryVal).getTime() - Date.now();
        if (diffMs <= 0) {
          timerEl.textContent = '🔴 Promocija je istekla';
          timerEl.style.color = '#ef4444';
        } else {
          const days = Math.floor(diffMs / (24 * 3600000));
          const hours = Math.floor((diffMs % (24 * 3600000)) / 3600000);
          timerEl.textContent = `⏳ Ističe za: ${days}d ${hours}h`;
          timerEl.style.color = '#ffd700';
        }
      } else {
        timerEl.textContent = '⏳ Trajanje: 7 dana';
      }
    }
  }

  loadCampaignsRegistry() {
    try {
      const stored = localStorage.getItem('gsc_promotions_registry');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    const initial = [
      {
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
      },
      {
        id: 'promo_welcome_drink',
        title: 'VIP WELCOME DRINK NA ŠANKU',
        body: 'Preuzmite svoj ekskluzivni koktel dobrodošlice prilikom posete klubu!',
        imageUrl: 'assets/promotions/promo_drink.svg',
        location: 'Grand Slot Club - VIP Bar',
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        targetType: 'all',
        promoAction: 'voucher_drink',
        promoValue: 1,
        status: 'PAUSED'
      },
      {
        id: 'promo_120s_turnir',
        title: 'VIP ULAZNICA ZA KAZINO TURNIR',
        body: 'Obezbedite besplatan ulaz na ekskluzivni 120s slot turnir sa fondom od 50.000 ZLT!',
        imageUrl: 'assets/promotions/promo_tournament.svg',
        location: 'Grand Slot Club - Arena 1',
        expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        targetType: 'all',
        promoAction: 'voucher_tour',
        promoValue: 1,
        status: 'PAUSED'
      }
    ];

    try {
      localStorage.setItem('gsc_promotions_registry', JSON.stringify(initial));
      localStorage.setItem('gsc_active_promo', JSON.stringify(initial[0]));
    } catch (e) {}

    return initial;
  }

  saveCampaignsRegistry() {
    try {
      localStorage.setItem('gsc_promotions_registry', JSON.stringify(this.campaignsRegistry));
    } catch (e) {}
  }

  initQuickPushButtons() {
    const btnPushJackpot = document.getElementById('btn-push-jackpot-alert');
    if (btnPushJackpot) {
      btnPushJackpot.addEventListener('click', async () => {
        this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'jackpot' });
        await this.dispatchPushApi({
          title: 'GRANDSLOT DŽEKPOT ALARM',
          body: 'Džekpot fond je prešao 180.000 ZLT! Zavrtite dobitni spin!',
          targetType: 'all',
          promoAction: 'none'
        });
        this.showToast('Poslata notifikacija: Džekpot Alarm');
      });
    }

    const btnPushTour = document.getElementById('btn-push-tour-alert');
    if (btnPushTour) {
      btnPushTour.addEventListener('click', async () => {
        this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'tournament' });
        await this.dispatchPushApi({
          title: '120s GRAND TURNIR JE OTVOREN',
          body: 'Uđite u brzi turnir sa 5.000 startnih poena i osvojite prvo mesto!',
          targetType: 'all',
          promoAction: 'none'
        });
        this.showToast('Poslata notifikacija: Turnir Poziv');
      });
    }

    const btnPushBonus = document.getElementById('btn-push-bonus-alert');
    if (btnPushBonus) {
      btnPushBonus.addEventListener('click', async () => {
        this.sendCommand({ action: 'TRIGGER_PUSH', notifType: 'bonus' });
        await this.dispatchPushApi({
          title: 'VAŠ TOČAK SREĆE JE SPREMAN',
          body: 'Čeka vas okretanje Točka Sreće sa množiteljima do 200x!',
          targetType: 'all',
          promoAction: 'none'
        });
        this.showToast('Poslata notifikacija: Točak Sreće');
      });
    }
  }

  async publishCampaign(isLive) {
    const campaignId = (document.getElementById('input-promo-campaign-id')?.value || `promo_${Date.now()}`).trim();
    const title = (document.getElementById('input-push-title')?.value || '').trim();
    const body = (document.getElementById('input-push-body')?.value || '').trim();
    const imageUrl = (document.getElementById('input-push-image')?.value || 'assets/promotions/promo_weekend_vip.svg').trim();
    const location = (document.getElementById('input-push-location')?.value || '').trim() || 'Grand Slot Club - Glavna Filijala';
    const targetType = document.getElementById('select-push-target')?.value || 'all';
    const targetPlayerId = (document.getElementById('input-target-player-id')?.value || '').trim();
    const promoSelectVal = document.getElementById('select-push-promo')?.value || 'none:0';
    const [promoAction, rawVal] = promoSelectVal.split(':');
    const promoValue = parseInt(rawVal, 10) || 0;
    const expiryInput = document.getElementById('input-promo-expiry')?.value;
    const expiresAt = expiryInput ? new Date(expiryInput).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString();

    if (!title || !body) {
      alert('Molimo unesite naslov i tekst poruke pre objave.');
      return;
    }

    if (targetType === 'single' && !targetPlayerId) {
      alert('Molimo navedite ID ciljanog igrača za pojedinačnu poruku.');
      return;
    }

    const campaign = {
      id: campaignId,
      title,
      body,
      imageUrl,
      location,
      targetType,
      targetPlayerId: targetType === 'single' ? targetPlayerId : null,
      promoAction,
      promoValue,
      expiresAt,
      status: isLive ? 'ACTIVE' : 'PAUSED',
      updatedAt: new Date().toISOString()
    };

    // Update or insert into registry
    const existingIndex = this.campaignsRegistry.findIndex(c => c.id === campaignId);
    if (existingIndex >= 0) {
      this.campaignsRegistry[existingIndex] = campaign;
    } else {
      this.campaignsRegistry.unshift(campaign);
    }

    if (isLive) {
      // Mark others as inactive if they are active
      this.campaignsRegistry.forEach(c => {
        if (c.id !== campaignId && c.status === 'ACTIVE') {
          c.status = 'PAUSED';
        }
      });
      localStorage.setItem('gsc_active_promo', JSON.stringify(campaign));
    }

    this.saveCampaignsRegistry();
    this.renderCampaignsTable();

    const statusEl = document.getElementById('push-campaign-status');

    if (isLive) {
      if (statusEl) {
        statusEl.style.color = 'var(--accent-gold)';
        statusEl.textContent = '⏳ Lansiranje kampanje u kazino lobiju i slanje pop-up obaveštenja...';
      }

      // 1. Live broadcast to active slot/casino terminals:
      // A) Update persistent lobby banner
      this.sendCommand({
        action: 'SET_ACTIVE_PROMO',
        promo: campaign
      });

      // B) Trigger live modal pop-up on open screens
      this.sendCommand({
        action: 'TRIGGER_PROMO_POPUP',
        promo: campaign
      });

      // C) Trigger native audio/toast push
      this.sendCommand({
        action: 'TRIGGER_PUSH',
        title,
        body,
        imageUrl,
        location,
        targetType,
        targetPlayerId,
        promoAction,
        promoValue
      });

      // 2. Dispatch to backend Web Push API
      const res = await this.dispatchPushApi({
        title,
        body,
        imageUrl,
        location,
        targetType,
        targetPlayerId,
        promoAction,
        promoValue
      });

      if (statusEl) {
        if (res && res.success) {
          statusEl.style.color = '#4ade80';
          statusEl.textContent = `✅ Uspešno objavljeno u lobiju i poslato igračima (${res.message || 'aktivirano'})!`;
          this.showToast('Promocija je aktivna u lobiju i poslata igračima!');
        } else {
          statusEl.style.color = '#f87171';
          statusEl.textContent = `Greška: ${res?.error || 'Došlo je do greške pri slanju.'}`;
        }
      }
    } else {
      if (statusEl) {
        statusEl.style.color = '#ffd700';
        statusEl.textContent = `💾 Kampanja [${campaignId}] sačuvana kao nacrt.`;
      }
      this.showToast(`Kampanja [${title}] sačuvana kao nacrt.`);
    }
  }

  renderCampaignsTable() {
    const tbody = document.getElementById('campaigns-table-body');
    if (!tbody) return;

    if (!this.campaignsRegistry || this.campaignsRegistry.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-loading-cell">Nema unetih promocija. Kreirajte novu kampanju iznad.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    const now = Date.now();

    this.campaignsRegistry.forEach((c) => {
      const isExpired = new Date(c.expiresAt).getTime() < now;
      let statusClass = 'status-paused';
      let statusLabel = 'PAUZIRANA';

      if (isExpired) {
        statusClass = 'status-expired';
        statusLabel = 'ISTEKLA';
      } else if (c.status === 'ACTIVE') {
        statusClass = 'status-active';
        statusLabel = '🟢 AKTIVNA U LOBIJU';
      }

      // Format reward label
      let rewardTag = '📢 Obaveštenje';
      if (c.promoAction === 'voucher') rewardTag = `🎟️ ${Number(c.promoValue).toLocaleString()} ZLT Vaučer`;
      else if (c.promoAction === 'voucher_drink') rewardTag = '🍸 Welcome Drink';
      else if (c.promoAction === 'voucher_tour') rewardTag = '🏆 Turnir Ulaznica';
      else if (c.promoAction === 'credit_bonus') rewardTag = `🪙 +${Number(c.promoValue).toLocaleString()} ZLT Online`;
      else if (c.promoAction === 'free_spins') rewardTag = `🎰 +${c.promoValue} Besplatnih Spinova`;

      const expDate = new Date(c.expiresAt);
      const dateStr = `${expDate.getDate()}.${expDate.getMonth() + 1}.${expDate.getFullYear()}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <img src="${c.imageUrl}" class="campaign-thumb-mini" alt="Poster" onerror="this.src='assets/symbols/crystal-spade-clean.png'">
        </td>
        <td>
          <strong style="color: #fff;">${this.escapeHtml(c.title)}</strong>
          <div style="font-size: 0.72rem; color: var(--text-tertiary); font-family: monospace;">${this.escapeHtml(c.id)}</div>
        </td>
        <td>
          <span style="font-size: 0.78rem; font-weight: 700; color: #ffd700;">${rewardTag}</span>
        </td>
        <td style="font-size: 0.75rem; color: var(--text-secondary);">
          <div>${c.targetType === 'vip' ? '👑 VIP' : (c.targetType === 'single' ? '👤 Korisnik' : '👥 Svi')}</div>
          <div style="color: var(--text-tertiary); font-size: 0.7rem;">${this.escapeHtml(c.location || 'Klub')}</div>
        </td>
        <td style="font-size: 0.75rem;">
          <div style="color: ${isExpired ? '#f87171' : '#cbd5e1'}; font-weight: 600;">${dateStr}</div>
        </td>
        <td>
          <span class="campaign-status-pill ${statusClass}">${statusLabel}</span>
        </td>
        <td>
          <div class="campaign-row-actions">
            ${c.status !== 'ACTIVE' ? `
              <button type="button" class="btn-row-action act-activate" data-act="activate" data-id="${c.id}" title="Postavi ovu promociju kao glavnu u lobiju">
                Aktiviraj
              </button>
            ` : `
              <button type="button" class="btn-row-action act-pause" data-act="pause" data-id="${c.id}" title="Pauziraj promociju">
                Pauziraj
              </button>
            `}
            <button type="button" class="btn-row-action act-popup" data-act="popup" data-id="${c.id}" title="Pošalji instant pop-up poster igračima na ekran">
              Pop-up
            </button>
            <button type="button" class="btn-row-action act-delete" data-act="delete" data-id="${c.id}" title="Obriši kampanju">
              Obriši
            </button>
          </div>
        </td>
      `;

      // Event listeners for actions
      tr.querySelector('[data-act="activate"]')?.addEventListener('click', () => this.activateCampaignFromTable(c.id));
      tr.querySelector('[data-act="pause"]')?.addEventListener('click', () => this.pauseCampaignFromTable(c.id));
      tr.querySelector('[data-act="popup"]')?.addEventListener('click', () => this.triggerPopupFromTable(c.id));
      tr.querySelector('[data-act="delete"]')?.addEventListener('click', () => this.deleteCampaignFromTable(c.id));

      tbody.appendChild(tr);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  activateCampaignFromTable(campaignId) {
    const campaign = this.campaignsRegistry.find(c => c.id === campaignId);
    if (!campaign) return;

    this.campaignsRegistry.forEach(c => {
      c.status = (c.id === campaignId) ? 'ACTIVE' : 'PAUSED';
    });

    localStorage.setItem('gsc_active_promo', JSON.stringify(campaign));
    this.saveCampaignsRegistry();
    this.renderCampaignsTable();

    // Broadcast to lobby
    this.sendCommand({
      action: 'SET_ACTIVE_PROMO',
      promo: campaign
    });

    this.showToast(`Promocija [${campaign.title}] je sada aktivna u lobiju!`);
  }

  pauseCampaignFromTable(campaignId) {
    const campaign = this.campaignsRegistry.find(c => c.id === campaignId);
    if (!campaign) return;

    campaign.status = 'PAUSED';
    this.saveCampaignsRegistry();
    this.renderCampaignsTable();

    this.sendCommand({
      action: 'SET_ACTIVE_PROMO',
      promo: null
    });

    this.showToast(`Promocija [${campaign.title}] je pauzirana.`);
  }

  triggerPopupFromTable(campaignId) {
    const campaign = this.campaignsRegistry.find(c => c.id === campaignId);
    if (!campaign) return;

    this.sendCommand({
      action: 'TRIGGER_PROMO_POPUP',
      promo: campaign
    });

    this.showToast(`Pop-up za [${campaign.title}] poslat na ekrane igrača!`);
  }

  deleteCampaignFromTable(campaignId) {
    if (!confirm(`Da li ste sigurni da želite da obrišete kampanju [${campaignId}]?`)) return;

    this.campaignsRegistry = this.campaignsRegistry.filter(c => c.id !== campaignId);
    this.saveCampaignsRegistry();
    this.renderCampaignsTable();
    this.showToast(`Kampanja [${campaignId}] je obrisana.`);
  }

  async dispatchPushApi(payload) {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend Push API offline or unavailable, simulating send:', e);
      return {
        success: true,
        simulated: true,
        sentCount: payload.targetType === 'single' ? 1 : 4,
        message: 'Lokalna simulacija: poruka poslata preko live kanala!'
      };
    }
  }

  async fetchCrmPlayers() {
    const tableBody = document.getElementById('crm-players-table-body');
    try {
      const url = `/api/players/list?segment=${encodeURIComponent(this.crmActiveSegment || 'all')}&search=${encodeURIComponent(this.crmSearchQuery || '')}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.stats) {
        const totalEl = document.getElementById('crm-stat-total-players');
        const pushEl = document.getElementById('crm-stat-push-enabled');
        const vipEl = document.getElementById('crm-stat-vip-count');
        const activeEl = document.getElementById('crm-stat-active-today');

        if (totalEl) totalEl.textContent = data.stats.total || 0;
        if (pushEl) pushEl.textContent = data.stats.pushEnabled || 0;
        if (vipEl) vipEl.textContent = data.stats.vip || 0;
        if (activeEl) activeEl.textContent = data.stats.activeToday || 0;
      }

      if (!tableBody) return;

      const players = data.players || [];
      if (players.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Nema pronađenih igrača u izabranom segmentu.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = players.map(p => {
        const isVip = (p.vip_tier || 'STANDARD') !== 'STANDARD';
        const formattedDate = this.formatRelativeTime(p.last_seen_at);
        const turnover = Number(p.total_turnover || 0).toLocaleString();
        const spins = Number(p.total_spins || 0).toLocaleString();
        const isPush = Boolean(p.is_push_enabled);

        return `
          <tr>
            <td><code style="color: var(--accent-gold);">${p.id}</code></td>
            <td><strong>${p.nickname || 'Gost'}</strong></td>
            <td>
              <span class="badge-vip-pill ${isVip ? 'vip' : 'standard'}" 
                    data-player-id="${p.id}" 
                    data-vip="${p.vip_tier || 'STANDARD'}" 
                    title="Kliknite za promenu VIP statusa">
                ${isVip ? 'VIP' : 'STANDARD'}
              </span>
            </td>
            <td>${turnover} ZLT</td>
            <td>${spins}</td>
            <td style="font-size: 0.75rem; color: #a8a29e;">${formattedDate}</td>
            <td>${isPush ? '<span style="color:#4ade80;">Aktivno</span>' : '<span style="color:#78716c;">Neaktivno</span>'}</td>
            <td>
              <button type="button" class="btn-crm-target" data-target-id="${p.id}" data-nickname="${p.nickname || ''}">
                Ciljaj
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row action listeners
      this.bindCrmRowEvents();

    } catch (err) {
      console.warn('Failed to fetch CRM players:', err);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: #f87171; padding: 20px;">
              Greška pri učitavanju baze igrača.
            </td>
          </tr>
        `;
      }
    }
  }

  async fetchVoucherScans() {
    const tableBody = document.getElementById('crm-scans-table-body');
    if (!tableBody) return;

    try {
      const res = await fetch('/api/vouchers/scans');
      const data = await res.json();
      const scans = (data && data.scans) ? data.scans : [];

      if (scans.length === 0) {
        // Fallback to local demo storage if backend returns empty or demo
        try {
          const rawLocal = localStorage.getItem('gsc_redeemed_scans_demo') || '[]';
          const localScans = JSON.parse(rawLocal);
          if (localScans.length > 0) {
            this.renderVoucherScansRows(localScans, tableBody);
            return;
          }
        } catch (err) {}

        tableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Još uvek nema overenih vaučera u kazinu.
            </td>
          </tr>
        `;
        return;
      }

      this.renderVoucherScansRows(scans, tableBody);

    } catch (e) {
      console.warn('Failed to fetch voucher scans from API, checking local storage:', e);
      try {
        const rawLocal = localStorage.getItem('gsc_redeemed_scans_demo') || '[]';
        const localScans = JSON.parse(rawLocal);
        if (localScans.length > 0) {
          this.renderVoucherScansRows(localScans, tableBody);
          return;
        }
      } catch (err) {}

      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">
            Dnevnik je spreman. Kada operater očita vaučer na mobilnom skeneru, pojaviće se ovde.
          </td>
        </tr>
      `;
    }
  }

  renderVoucherScansRows(scans, tableBody) {
    tableBody.innerHTML = scans.map(s => {
      const dateStr = s.redeemed_at ? new Date(s.redeemed_at).toLocaleString('sr-RS') : 'Upravo';
      const isDrink = s.reward_type === 'drink';
      const displayVal = isDrink ? 'VIP Drink' : `${Number(s.reward_value || 0).toLocaleString()} ZLT`;
      return `
        <tr>
          <td style="font-size: 0.76rem; color: #a8a29e;">${dateStr}</td>
          <td>
            <strong style="color: #fff;">${s.player_nickname || 'Gost'}</strong>
            <div style="font-size: 0.7rem; color: #a8a29e;">${s.player_id || ''}</div>
          </td>
          <td><code style="color: var(--accent-gold); font-weight: 700;">${s.voucher_code || ''}</code></td>
          <td>${s.title || 'VIP Promo Tiket'}</td>
          <td style="color: #4ade80; font-weight: 700;">${displayVal}</td>
          <td><span style="color: #ffd700;">${s.redeemed_by_operator || 'Operater'}</span></td>
          <td style="font-size: 0.78rem; color: #d1c7b7;">${s.redeemed_location || 'Glavna Filijala'}</td>
          <td><span class="badge-vip-pill vip" style="background: rgba(34, 197, 94, 0.2); border-color: #22c55e; color: #4ade80;">Overen</span></td>
        </tr>
      `;
    }).join('');
  }

  bindCrmRowEvents() {
    // 1. VIP Pill Toggle
    document.querySelectorAll('.badge-vip-pill').forEach(pill => {
      pill.addEventListener('click', async () => {
        const playerId = pill.getAttribute('data-player-id');
        const currentTier = pill.getAttribute('data-vip');
        const newTier = currentTier === 'VIP' ? 'STANDARD' : 'VIP';

        try {
          await fetch('/api/players/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, vipTier: newTier })
          });
          this.showToast(`Status za ${playerId} promenjen u ${newTier}`);
          this.fetchCrmPlayers();
        } catch (e) {
          console.error(e);
        }
      });
    });

    // 2. Direct Target Player Button
    document.querySelectorAll('.btn-crm-target').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-target-id');
        const nick = btn.getAttribute('data-nickname');

        const selectTarget = document.getElementById('select-push-target');
        const inputId = document.getElementById('input-target-player-id');
        const groupTarget = document.getElementById('group-target-player-id');
        const inputTitle = document.getElementById('input-push-title');
        const inputBody = document.getElementById('input-push-body');

        if (selectTarget) selectTarget.value = 'single';
        if (groupTarget) groupTarget.style.display = 'flex';
        if (inputId) inputId.value = id;
        if (inputTitle) inputTitle.value = `Specijalna ponuda za ${nick || id}`;
        if (inputBody) inputBody.value = `Zdravo ${nick || 'igraču'}, čeka vas 25 besplatnih spinova kao našem vernom članu!`;

        const composer = document.getElementById('input-push-title');
        if (composer) {
          composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          composer.focus();
        }

        this.showToast(`Izabran igrač [${id}] u kreatoru kampanja`);
      });
    });
  }

  formatRelativeTime(isoString) {
    if (!isoString) return 'Nedavno';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Upravo sada';
      if (diffMins < 60) return `Pre ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Pre ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Pre ${diffDays} d`;
    } catch (e) {
      return 'Nedavno';
    }
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

        if (target === 'crm') {
          this.fetchCrmPlayers();
        } else if (target === 'vouchers') {
          this.fetchVoucherScans();
        }
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
        this.showToast('Sesija operatera je zaključana.');
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
      this.setFeedback('AUTORIZOVAN PRISTUP', 'success');
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
        this.setFeedback(`Previše neuspešnih pokušaja! Sačekajte: ${remainingSec}s`, 'lockout');
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
      this.showToast('Sesija je automatski zaključana zbog neaktivnosti.');
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
        msgEl.textContent = 'Trenutni PIN nije ispravan.';
        msgEl.style.color = '#ef4444';
        return;
      }

      if (!/^\d{4}$/.test(newVal)) {
        msgEl.textContent = 'Novi PIN mora sadržati tačno 4 cifre (0-9).';
        msgEl.style.color = '#ef4444';
        return;
      }

      if (newVal !== confirmVal) {
        msgEl.textContent = 'Novi PIN i potvrda se ne poklapaju.';
        msgEl.style.color = '#ef4444';
        return;
      }

      const newHash = AdminDashboard.hashPin(newVal);
      localStorage.setItem('grandslot_operator_pin_hash', newHash);
      
      oldInput.value = '';
      newInput.value = '';
      confirmInput.value = '';

      msgEl.textContent = 'PIN je uspešno promenjen.';
      msgEl.style.color = '#00e676';
      this.showToast('Operaterski PIN je uspešno ažuriran.');

      setTimeout(() => {
        msgEl.textContent = '';
      }, 4000);
    });
  }

  /* ==========================================================================
     WebRTC Remote Cloud Pairing (Phone / Tablet to Remote Kiosk)
     ========================================================================== */

  initWebRTC() {
    if (typeof Peer === 'undefined') {
      console.info('PeerJS not loaded; WebRTC remote sync disabled.');
      return;
    }

    // Check URL parameters for ?room=GSC-XXXX
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    const storedRoom = localStorage.getItem('grandslot_target_room_id');
    const initialRoom = (roomFromUrl || storedRoom || '').toUpperCase().trim();

    const roomInput = document.getElementById('input-webrtc-room');
    if (roomInput && initialRoom) {
      roomInput.value = initialRoom;
    }

    // Connect button in Tab 5
    const connectBtn = document.getElementById('btn-connect-webrtc');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        const val = (roomInput ? roomInput.value : '').toUpperCase().trim();
        if (val) {
          this.connectToRemoteSlot(val);
        } else {
          this.setWebRTCFeedback('Unesite šifru sobe aparata (npr. GSC-7842)', 'error');
        }
      });
    }

    // Disconnect button in Tab 5
    const disconnectBtn = document.getElementById('btn-disconnect-webrtc');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        this.disconnectRemoteSlot();
      });
    }

    // Auto-connect if room specified in URL
    if (initialRoom) {
      setTimeout(() => {
        this.connectToRemoteSlot(initialRoom);
      }, 500);
    }
  }

  connectToRemoteSlot(roomId) {
    if (typeof Peer === 'undefined') return;

    this.targetRoomId = roomId.toUpperCase().trim();
    localStorage.setItem('grandslot_target_room_id', this.targetRoomId);

    this.setWebRTCFeedback(`Povezujem se sa aparatom [${this.targetRoomId}]...`, 'info');

    const targetPeerId = 'grandslot-slot-' + this.targetRoomId.toLowerCase();

    try {
      if (this.peer) {
        try { this.peer.destroy(); } catch (e) {}
      }

      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        this.remoteConn = this.peer.connect(targetPeerId, { reliable: true });

        this.remoteConn.on('open', () => {
          this.isRemoteConnected = true;
          this.setConnected(true, `WEBRTC (${this.targetRoomId})`);
          this.setWebRTCFeedback(`Povezan sa aparatom [${this.targetRoomId}] u realnom vremenu.`, 'success');
          this.showToast(`Uspešno povezan sa aparatom [${this.targetRoomId}]`);

          const connectBtn = document.getElementById('btn-connect-webrtc');
          const disconnectBtn = document.getElementById('btn-disconnect-webrtc');
          if (connectBtn) connectBtn.style.display = 'none';
          if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';

          this.sendCommand({ action: 'REQUEST_STATE' });
        });

        this.remoteConn.on('data', (data) => {
          this.handleMessage(data);
        });

        this.remoteConn.on('close', () => {
          this.isRemoteConnected = false;
          this.setConnected(false);
          this.setWebRTCFeedback(`Veza sa aparatom [${this.targetRoomId}] je prekinuta.`, 'error');

          const connectBtn = document.getElementById('btn-connect-webrtc');
          const disconnectBtn = document.getElementById('btn-disconnect-webrtc');
          if (connectBtn) connectBtn.style.display = 'inline-block';
          if (disconnectBtn) disconnectBtn.style.display = 'none';
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Admin WebRTC peer error:', err);
        this.setWebRTCFeedback('Greška pri povezivanju: proverite da li je aparat uključen.', 'error');
      });
    } catch (e) {
      console.warn('WebRTC connection failed:', e);
      this.setWebRTCFeedback('Neuspešna inicijalizacija WebRTC veze.', 'error');
    }
  }

  disconnectRemoteSlot() {
    if (this.remoteConn) {
      try { this.remoteConn.close(); } catch (e) {}
      this.remoteConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    this.isRemoteConnected = false;
    this.setConnected(false);
    localStorage.removeItem('grandslot_target_room_id');
    this.setWebRTCFeedback('Veza je prekinuta.', 'info');

    const connectBtn = document.getElementById('btn-connect-webrtc');
    const disconnectBtn = document.getElementById('btn-disconnect-webrtc');
    if (connectBtn) connectBtn.style.display = 'inline-block';
    if (disconnectBtn) disconnectBtn.style.display = 'none';
  }

  setWebRTCFeedback(msg, type) {
    const el = document.getElementById('webrtc-conn-feedback');
    if (!el) return;
    el.textContent = msg;
    if (type === 'success') el.style.color = '#00e676';
    else if (type === 'error') el.style.color = '#ef4444';
    else el.style.color = '#ffd700';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
});

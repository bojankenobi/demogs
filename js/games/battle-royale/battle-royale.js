/**
 * Grand Slot Club - Slot-Battle Royale (Multiplayer 120s Live PvP Arena)
 * Fast-paced competitive multiplayer arena with scheduled 5-minute rounds,
 * safe zone shrinking & eliminations, active PvP disruption cards (Ice Freeze,
 * Smoke Screen, Point Siphon), cross-mode loadouts, and 48-hour QR vouchers.
 */

class SlotBattleRoyale {
  constructor(wallet, lobby) {
    this.wallet = wallet;
    this.lobby = lobby;

    this.isActive = false;
    this.matchDuration = 120; // 120 seconds
    this.timeLeft = 120;
    this.timerInterval = null;
    this.botInterval = null;
    this.activeTimeouts = [];

    // Balance snapshot for forfeit / surrender protection
    this.initialBalance = null;
    this.initialRsdBalance = null;
    this.isMatchCompleted = false;

    // Buy-in & Smart Target Settings
    this.buyInCost = 100; // 100 ZLT tournament buy-in
    this.isBuyInPaid = false;
    this.currentTargetMode = 'leader'; // 'leader' | 'ahead' | 'revenge'
    this.lastAttacker = null;

    this.playerScore = 0;
    this.playerRank = 1;
    this.isEliminated = false;
    this.isFrozen = false;
    this.hasSmoke = false;

    // PvP Attack Deck availability
    this.attacks = {
      freeze: false,
      smoke: false,
      siphon: false
    };

    // Pre-populated realistic rival competitors
    this.competitors = [
      { id: 'c_1', name: 'Miloš (Niš)', score: 0, eliminated: false, avatar: '👑' },
      { id: 'c_2', name: 'Stefan (Beograd)', score: 0, eliminated: false, avatar: '💎' },
      { id: 'c_3', name: 'Nemanja (Novi Sad)', score: 0, eliminated: false, avatar: '🔥' },
      { id: 'c_4', name: 'Aleksandar (Kragujevac)', score: 0, eliminated: false, avatar: '⚡' },
      { id: 'c_5', name: 'Nikola (Zemun)', score: 0, eliminated: false, avatar: '🎯' },
      { id: 'c_6', name: 'Marko (Subotica)', score: 0, eliminated: false, avatar: '🎲' },
      { id: 'c_7', name: 'Jovan (Čačak)', score: 0, eliminated: false, avatar: '🃏' },
      { id: 'c_8', name: 'Luka (Pančevo)', score: 0, eliminated: false, avatar: '🚀' },
      { id: 'c_9', name: 'Vuk (Kraljevo)', score: 0, eliminated: false, avatar: '⭐' },
      { id: 'c_10', name: 'Dušan (Kruševac)', score: 0, eliminated: false, avatar: '🦁' },
      { id: 'c_11', name: 'Filip (Zrenjanin)', score: 0, eliminated: false, avatar: '🦅' },
      { id: 'c_12', name: 'Petar (Valjevo)', score: 0, eliminated: false, avatar: '🏆' }
    ];

    this.initDOM();
  }

  initDOM() {
    this.stageView = document.getElementById('battle-royale-view');
    this.slotStage = document.querySelector('.slot-stage-scaler');

    this.timerEl = document.getElementById('royale-timer-val');
    this.rankEl = document.getElementById('royale-rank-val');
    this.scoreEl = document.getElementById('royale-score-val');
    this.zoneBannerEl = document.getElementById('royale-zone-banner');
    this.leaderboardStripEl = document.getElementById('royale-leaderboard-strip');

    // Make rank badge open Prestige Hub
    if (this.rankEl && this.rankEl.parentElement) {
      this.rankEl.parentElement.style.cursor = 'pointer';
      this.rankEl.parentElement.title = 'Pogledaj rang listu i prestiž Kuće Slavnih';
      this.rankEl.parentElement.addEventListener('click', () => {
        if (window.prestigeManager) window.prestigeManager.openModal('royale');
      });
    }

    // Attack action buttons
    this.btnFreeze = document.getElementById('btn-pvp-freeze');
    this.btnSmoke = document.getElementById('btn-pvp-smoke');
    this.btnSiphon = document.getElementById('btn-pvp-siphon');

    if (this.btnFreeze) {
      this.btnFreeze.addEventListener('click', () => this.executeAttack('freeze'));
    }
    if (this.btnSmoke) {
      this.btnSmoke.addEventListener('click', () => this.executeAttack('smoke'));
    }
    if (this.btnSiphon) {
      this.btnSiphon.addEventListener('click', () => this.executeAttack('siphon'));
    }

    // Smart Meta Target Selector buttons
    const targetBtns = document.querySelectorAll('.btn-target-selector');
    targetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        targetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTargetMode = btn.getAttribute('data-target') || 'leader';
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      });
    });

    // Buy-in modal elements
    this.buyInModal = document.getElementById('royale-buyin-modal');
    this.btnConfirmBuyIn = document.getElementById('btn-confirm-royale-buyin');
    this.btnCancelBuyIn = document.getElementById('btn-cancel-royale-buyin');
    this.btnCloseBuyIn = document.getElementById('btn-close-royale-buyin');

    if (this.btnConfirmBuyIn) {
      this.btnConfirmBuyIn.addEventListener('click', () => this.handleConfirmBuyIn());
    }
    if (this.btnCancelBuyIn) {
      this.btnCancelBuyIn.addEventListener('click', () => this.handleCancelBuyIn());
    }
    if (this.btnCloseBuyIn) {
      this.btnCloseBuyIn.addEventListener('click', () => this.handleCancelBuyIn());
    }

    const btnStartArena = document.getElementById('btn-start-royale-round');
    if (btnStartArena) {
      btnStartArena.addEventListener('click', () => {
        if (!this.isBuyInPaid) {
          this.promptBuyInModal();
        } else {
          this.startMatch();
        }
      });
    }

    const btnExitArena = document.getElementById('btn-exit-royale-round');
    if (btnExitArena) {
      btnExitArena.addEventListener('click', () => {
        if (confirm('Da li ste sigurni da želite da odustanete od Battle Royale arene?\nUplaćena kotizacija od 100 ZLT je nepovratna, a privremeni poeni se brišu.')) {
          this.forfeitMatch();
        }
      });
    }

    // Mobile Royale Action Dock bindings
    const btnDockTarget = document.getElementById('btn-dock-royale-target');
    if (btnDockTarget) {
      btnDockTarget.addEventListener('click', () => {
        // Cycle target: leader -> ahead -> nemesis -> leader
        if (this.currentTargetMode === 'leader') this.currentTargetMode = 'ahead';
        else if (this.currentTargetMode === 'ahead') this.currentTargetMode = 'nemesis';
        else this.currentTargetMode = 'leader';

        targetBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-target') === this.currentTargetMode));
        this.updateHUD();
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      });
    }

    const btnDockFreeze = document.getElementById('btn-dock-atk-freeze');
    if (btnDockFreeze) {
      btnDockFreeze.addEventListener('click', () => this.executeAttack('freeze'));
    }
    const btnDockSmoke = document.getElementById('btn-dock-atk-smoke');
    if (btnDockSmoke) {
      btnDockSmoke.addEventListener('click', () => this.executeAttack('smoke'));
    }
    const btnDockSiphon = document.getElementById('btn-dock-atk-siphon');
    if (btnDockSiphon) {
      btnDockSiphon.addEventListener('click', () => this.executeAttack('siphon'));
    }
    const btnDockLeaderboard = document.getElementById('btn-dock-royale-leaderboard');
    if (btnDockLeaderboard) {
      btnDockLeaderboard.addEventListener('click', () => this.openLeaderboardModal());
    }

    // Modal Royale Leaderboard events
    const btnCloseModalLb = document.getElementById('btn-close-royale-leaderboard');
    if (btnCloseModalLb) {
      btnCloseModalLb.addEventListener('click', () => this.closeLeaderboardModal());
    }
    const btnDoneModalLb = document.getElementById('btn-done-royale-leaderboard');
    if (btnDoneModalLb) {
      btnDoneModalLb.addEventListener('click', () => this.closeLeaderboardModal());
    }
  }

  openLeaderboardModal() {
    const modal = document.getElementById('royale-leaderboard-modal');
    if (!modal) return;
    this.renderLeaderboardModal();
    modal.classList.add('active');
    if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
  }

  closeLeaderboardModal() {
    const modal = document.getElementById('royale-leaderboard-modal');
    if (modal) modal.classList.remove('active');
  }

  renderLeaderboardModal() {
    const listEl = document.getElementById('royale-leaderboard-modal-list');
    if (!listEl) return;
    this.calculateRankings();
    if (!this.sortedAll) return;

    listEl.innerHTML = this.sortedAll.map((item, idx) => {
      let medal = `#${idx + 1}`;
      if (idx === 0) medal = '🥇 #1';
      else if (idx === 1) medal = '🥈 #2';
      else if (idx === 2) medal = '🥉 #3';

      const isEliminated = item.eliminated;
      const statusText = isEliminated ? 'ELIMINISAN' : `${item.score.toLocaleString()} ZLT`;

      return `
        <div class="royale-modal-row ${item.isYou ? 'you' : ''} ${isEliminated ? 'eliminated' : ''}">
          <div class="royale-modal-col-rank">
            <span>${medal}</span>
            <span>${item.name}</span>
          </div>
          <div class="royale-modal-col-score">${statusText}</div>
        </div>
      `;
    }).join('');
  }

  scheduleTimeout(fn, delay) {
    const tid = setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter(id => id !== tid);
      fn();
    }, delay);
    this.activeTimeouts.push(tid);
    return tid;
  }

  clearTimeouts() {
    if (this.activeTimeouts && this.activeTimeouts.length > 0) {
      this.activeTimeouts.forEach(tid => clearTimeout(tid));
      this.activeTimeouts = [];
    }
  }

  mount() {
    this.isActive = true;
    if (this.stageView) this.stageView.style.display = 'flex';
    if (this.slotStage) this.slotStage.style.display = 'block';

    const dock = document.getElementById('royale-mobile-dock');
    if (dock) dock.style.display = 'flex';

    // Must pay buy-in (100 ZLT) to enter the battle arena!
    if (!this.isBuyInPaid) {
      this.promptBuyInModal();
      return;
    }

    if (!this.timerInterval) {
      this.startMatch();
    }
  }

  promptBuyInModal() {
    if (!this.buyInModal) return;
    const curBal = this.wallet ? this.wallet.rsdBalance : 0;
    const balEl = document.getElementById('royale-player-wallet-val');
    const costEl = document.getElementById('royale-buyin-cost');
    const potEl = document.getElementById('royale-buyin-pot');
    const confirmBtn = document.getElementById('btn-confirm-royale-buyin');

    if (balEl) balEl.textContent = `${curBal.toLocaleString()} ZLT`;
    if (costEl) costEl.textContent = `${this.buyInCost} ZLT`;
    if (potEl) potEl.textContent = `${(this.buyInCost * 20).toLocaleString()} ZLT`;

    if (curBal < this.buyInCost) {
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = `❌ NEDOVOLJNO ZLT (Potrebno: ${this.buyInCost})`;
      }
    } else {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = `🪙 UPLATI ${this.buyInCost} ZLT & UĐI U ARENU`;
      }
    }

    this.buyInModal.style.display = 'flex';
  }

  handleConfirmBuyIn() {
    const curBal = this.wallet ? this.wallet.rsdBalance : 0;
    if (curBal < this.buyInCost) {
      alert('Nemate dovoljno zlatnika za kotizaciju u areni!');
      return;
    }

    // Deduct buy-in entry fee from player wallet
    this.wallet.rsdBalance -= this.buyInCost;
    if (typeof this.wallet.saveState === 'function') this.wallet.saveState();
    if (typeof this.wallet.updateUI === 'function') this.wallet.updateUI();

    this.isBuyInPaid = true;
    // Snapshot initial balance AFTER paying the buy-in fee
    this.initialRsdBalance = this.wallet.rsdBalance;
    this.initialBalance = this.wallet.balance;

    if (this.buyInModal) {
      this.buyInModal.style.display = 'none';
    }

    if (window.slotAudio && window.slotAudio.playLever) {
      window.slotAudio.playLever();
    }

    this.startMatch();
  }

  handleCancelBuyIn() {
    if (this.buyInModal) {
      this.buyInModal.style.display = 'none';
    }
    // Return cleanly to Casino Salon mode
    if (window.slotApp && typeof window.slotApp.switchGrandMode === 'function') {
      const tabs = document.querySelectorAll('.hub-mode-tab');
      tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === 'casino'));
      window.slotApp.switchGrandMode('casino');
    }
  }

  unmount() {
    this.isActive = false;

    const dock = document.getElementById('royale-mobile-dock');
    if (dock) dock.style.display = 'none';
    this.closeLeaderboardModal();

    // If player leaves or navigates away before match completes legitimately, forfeit and rollback balance!
    if (!this.isMatchCompleted && typeof this.initialRsdBalance === 'number' && this.wallet) {
      this.wallet.rsdBalance = this.initialRsdBalance;
      if (typeof this.wallet.saveState === 'function') this.wallet.saveState();
      if (typeof this.wallet.updateUI === 'function') this.wallet.updateUI();
      if (window.slotNotifications && typeof window.slotNotifications.show === 'function') {
        window.slotNotifications.show(`🏳️ NAPUŠTENA ARENA: Zlatnici su vraćeni na pređašnje stanje (${this.initialRsdBalance} ZLT).`, 'info');
      }
    }

    this.cleanUpEffects();
    this.initialBalance = null;
    this.initialRsdBalance = null;
  }

  forfeitMatch() {
    // 1. Rollback any coins gained or spent during Battle Royale to pre-match balance
    if (this.wallet && typeof this.initialRsdBalance === 'number') {
      this.wallet.rsdBalance = this.initialRsdBalance;
      if (typeof this.wallet.saveState === 'function') this.wallet.saveState();
      if (typeof this.wallet.updateUI === 'function') this.wallet.updateUI();
    }

    const restoredBal = this.initialRsdBalance;
    this.isMatchCompleted = true; // Mark as handled so unmount doesn't duplicate rollback
    this.cleanUpEffects();

    if (window.slotNotifications && typeof window.slotNotifications.show === 'function') {
      window.slotNotifications.show(`🏳️ ODUSTALI STE OD ARENE: Vraćeno pređašnje stanje (${restoredBal} ZLT).`, 'info');
    }

    // 2. Return cleanly to Casino Salon mode
    if (window.slotApp && typeof window.slotApp.switchGrandMode === 'function') {
      const tabs = document.querySelectorAll('.hub-mode-tab');
      tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === 'casino'));
      window.slotApp.switchGrandMode('casino');
    }
  }

  cleanUpEffects() {
    this.clearTimers();
    this.clearTimeouts();

    this.isFrozen = false;
    this.hasSmoke = false;
    this.isEliminated = false;

    // Purge any freeze overlay from slot stage so it NEVER bleeds into casino or vault
    const freezeOverlay = document.getElementById('reel-frozen-overlay');
    if (freezeOverlay && freezeOverlay.parentNode) {
      freezeOverlay.parentNode.removeChild(freezeOverlay);
    }

    // Purge any smoke overlay from slot stage
    const smokeOverlay = document.getElementById('smoke-screen-overlay');
    if (smokeOverlay && smokeOverlay.parentNode) {
      smokeOverlay.parentNode.removeChild(smokeOverlay);
    }

    // Reset zone banner
    if (this.zoneBannerEl) {
      this.zoneBannerEl.classList.remove('shrinking');
      this.zoneBannerEl.textContent = '⚠️ SIGURNA ZONA JE OTVORENA • SVI IGRAČI SU AKTIVNI';
    }

    // Hide Battle Royale stage view
    if (this.stageView) {
      this.stageView.style.display = 'none';
    }

    this.resetAttacks();
  }

  startMatch() {
    this.clearTimers();
    this.clearTimeouts();

    this.timeLeft = this.matchDuration;
    this.playerScore = 0;
    this.playerRank = 1;
    this.isEliminated = false;
    this.isFrozen = false;
    this.hasSmoke = false;
    this.isMatchCompleted = false;

    // Snapshot initial balance for this round if not already set
    if (this.initialBalance === null && this.wallet && typeof this.wallet.balance === 'number') {
      this.initialBalance = this.wallet.balance;
    }

    // Reset competitors
    this.competitors.forEach(c => {
      c.score = 0;
      c.eliminated = false;
    });

    this.resetAttacks();
    this.updateHUD();
    this.renderLeaderboard();

    // Check for consumable Booster Potion from Vault Crawler
    const inventoryRaw = localStorage.getItem('gsc_vault_inventory_v1');
    if (inventoryRaw) {
      try {
        const inv = JSON.parse(inventoryRaw);
        if (inv.boosterPotions > 0) {
          inv.boosterPotions--;
          localStorage.setItem('gsc_vault_inventory_v1', JSON.stringify(inv));
          this.setZoneNotice('🧪 AKTIVIRAN BOOSTER IZ TREZORA: +20% POENA U ARENI!');
        }
      } catch (e) {}
    }

    // Match Timer Countdown
    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft === 75) {
        // At 45 seconds elapsed: Zone shrinking phase 1
        this.eliminateBottomPercent(0.25, '🚨 ZONA SE ZATVARA! Eliminisan donji 25% tabele!');
      } else if (this.timeLeft === 30) {
        // At 90 seconds elapsed: Zone shrinking phase 2
        this.eliminateBottomPercent(0.25, '🔥 ZONA SE SUŽAVA! Poslednjih 30s: DOUBLE RUSH 2X POENI!');
      }

      if (this.timeLeft <= 0) {
        this.endMatch(true);
      } else {
        this.updateHUD();
      }
    }, 1000);

    // Bot competitors background point generation & random attacks
    this.botInterval = setInterval(() => {
      this.simulateCompetitorActivity();
    }, 1400);
  }

  clearTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.botInterval) {
      clearInterval(this.botInterval);
      this.botInterval = null;
    }
  }

  simulateCompetitorActivity() {
    if (!this.isActive || this.timeLeft <= 0) return;

    // Award random points to active competitors
    const multiplier = (this.timeLeft <= 30) ? 2 : 1;
    this.competitors.forEach(c => {
      if (!c.eliminated) {
        const added = (Math.floor(Math.random() * 45) + 10) * multiplier;
        c.score += added;
      }
    });

    // Random chance of competitor firing an attack at player
    if (Math.random() < 0.12 && !this.isFrozen && !this.hasSmoke) {
      this.receiveRivalAttack();
    }

    this.calculateRankings();
    this.renderLeaderboard();
  }

  receiveRivalAttack() {
    // Pick attacker for revenge target
    const activeCompetitors = this.competitors.filter(c => !c.eliminated);
    if (activeCompetitors.length > 0) {
      this.lastAttacker = activeCompetitors[Math.floor(Math.random() * activeCompetitors.length)];
    }

    // Check if player has Kevlar Shield from Vault Crawler!
    const inventoryRaw = localStorage.getItem('gsc_vault_inventory_v1');
    if (inventoryRaw) {
      try {
        const inv = JSON.parse(inventoryRaw);
        if (inv.kevlarShields > 0) {
          inv.kevlarShields--;
          localStorage.setItem('gsc_vault_inventory_v1', JSON.stringify(inv));
          this.setZoneNotice('🛡️ KEVLAR ŠTIT IZ TREZORA JE BLOKIRAO NAPAD PROTIVNIKA!');
          return;
        }
      } catch (e) {}
    }

    // Choose attack: Freeze or Smoke
    if (Math.random() < 0.5) {
      this.triggerFreezeEffect();
    } else {
      this.triggerSmokeEffect();
    }
  }

  triggerFreezeEffect() {
    this.isFrozen = true;
    this.setZoneNotice('❄️ ZALEĐEN! Protivnik ti je zaledio kolone na 3 sekunde!');
    
    // Mount freeze overlay
    let overlay = document.getElementById('reel-frozen-overlay');
    if (!overlay && this.slotStage) {
      overlay = document.createElement('div');
      overlay.id = 'reel-frozen-overlay';
      overlay.className = 'reel-frozen-overlay';
      overlay.innerHTML = '❄️';
      this.slotStage.appendChild(overlay);
    }

    this.scheduleTimeout(() => {
      this.isFrozen = false;
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 3000);
  }

  triggerSmokeEffect() {
    this.hasSmoke = true;
    this.setZoneNotice('💨 DIMNA BOMBA! Dodirnite ekran da rasterate dim!');

    let smoke = document.getElementById('smoke-screen-overlay');
    if (!smoke && this.slotStage) {
      smoke = document.createElement('div');
      smoke.id = 'smoke-screen-overlay';
      smoke.className = 'smoke-screen-overlay';
      smoke.innerHTML = `
        <span style="font-size: 2.2rem;">💨</span>
        <span class="smoke-screen-hint">DODIRNITE OVDE DA RASTERATA DIM!</span>
      `;
      smoke.addEventListener('click', () => {
        this.hasSmoke = false;
        if (smoke && smoke.parentNode) smoke.parentNode.removeChild(smoke);
      });
      this.slotStage.appendChild(smoke);
    }
  }

  calculateRankings() {
    const all = [
      { id: 'player', name: 'VI (Igrač)', score: this.playerScore, eliminated: this.isEliminated, isYou: true },
      ...this.competitors
    ];

    // Sort by score descending (active first, then eliminated)
    all.sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      return b.score - a.score;
    });

    const myIdx = all.findIndex(x => x.isYou);
    this.playerRank = (myIdx !== -1) ? (myIdx + 1) : all.length;
    this.sortedAll = all;
  }

  eliminateBottomPercent(pct, noticeMsg) {
    this.calculateRankings();
    const activeOnes = this.sortedAll.filter(x => !x.eliminated);
    const countToKill = Math.max(1, Math.floor(activeOnes.length * pct));

    // Mark bottom active as eliminated
    for (let i = activeOnes.length - 1; i >= activeOnes.length - countToKill; i--) {
      const target = activeOnes[i];
      if (target.isYou) {
        this.isEliminated = true;
      } else {
        const c = this.competitors.find(x => x.id === target.id);
        if (c) c.eliminated = true;
      }
    }

    this.setZoneNotice(noticeMsg);
    this.calculateRankings();
    this.renderLeaderboard();

    if (this.isEliminated) {
      alert('💀 ZONA VAS JE ELIMINISALA! Niste imali dovoljno poena. Više sreće u sledećoj rundi!');
      this.endMatch(false);
    }
  }

  setZoneNotice(msg) {
    if (this.zoneBannerEl) {
      this.zoneBannerEl.textContent = msg;
      this.zoneBannerEl.classList.add('shrinking');
      this.scheduleTimeout(() => {
        if (this.zoneBannerEl) this.zoneBannerEl.classList.remove('shrinking');
      }, 4000);
    }
  }

  renderLeaderboard() {
    if (!this.leaderboardStripEl || !this.sortedAll) return;

    this.leaderboardStripEl.innerHTML = this.sortedAll.map((item, idx) => {
      const rank = idx + 1;
      return `
        <div class="competitor-pill ${item.isYou ? 'you' : ''} ${item.eliminated ? 'eliminated' : ''}">
          <span>#${rank}</span>
          <span>${item.name}</span>
          <strong style="color: #fbbf24;">${item.score.toLocaleString()}</strong>
        </div>
      `;
    }).join('');
  }

  /**
   * Hook called on every spin in Battle Royale
   */
  handleSpinResult(winAmount, symbols = []) {
    if (!this.isActive || this.timeLeft <= 0 || this.isEliminated) return;

    if (this.isFrozen) {
      this.setZoneNotice('❄️ Ne možete da vrtite dok su kolone zaleđene!');
      return;
    }

    // Award points (Double points if in final 30 seconds!)
    const multiplier = (this.timeLeft <= 30) ? 2 : 1;
    const addedPoints = Math.max(10, Math.round(winAmount * 2.5)) * multiplier;
    this.playerScore += addedPoints;

    // Check if player unlocked an attack card
    if (winAmount > 0) {
      if (winAmount >= 50 && !this.attacks.siphon) {
        this.attacks.siphon = true;
      } else if (winAmount >= 20 && !this.attacks.freeze) {
        this.attacks.freeze = true;
      } else if (!this.attacks.smoke) {
        this.attacks.smoke = true;
      }
    }

    this.updateAttacksDeck();
    this.calculateRankings();
    this.updateHUD();
    this.renderLeaderboard();
  }

  executeAttack(type) {
    if (!this.attacks[type]) return;
    this.attacks[type] = false;

    // Pick target based on Smart Meta currentTargetMode
    let target = null;
    const activeCompetitors = this.competitors.filter(c => !c.eliminated);

    if (this.currentTargetMode === 'leader') {
      // #1 competitor by score
      const sorted = [...activeCompetitors].sort((a, b) => b.score - a.score);
      target = sorted[0];
    } else if (this.currentTargetMode === 'ahead') {
      // Competitor immediately ahead of player in rankings
      this.calculateRankings();
      const myIdx = this.sortedAll ? this.sortedAll.findIndex(x => x.isYou) : -1;
      if (myIdx > 0 && this.sortedAll[myIdx - 1] && !this.sortedAll[myIdx - 1].eliminated) {
        target = this.competitors.find(c => c.id === this.sortedAll[myIdx - 1].id);
      }
      if (!target) target = activeCompetitors[0];
    } else if (this.currentTargetMode === 'revenge') {
      // Competitor who attacked last
      if (this.lastAttacker) {
        target = this.competitors.find(c => c.id === this.lastAttacker.id && !c.eliminated);
      }
      if (!target) target = activeCompetitors[0];
    }

    if (!target) {
      target = activeCompetitors[0] || { name: 'Protivnik', score: 0 };
    }

    if (type === 'freeze') {
      this.setZoneNotice(`❄️ ZALEDIO SI [${target.name}]! Kolone su mu zamrznute na 3s!`);
      target.score = Math.max(0, target.score - 40);
    } else if (type === 'smoke') {
      this.setZoneNotice(`💨 DIMNA BOMBA POSLATA NA [${target.name}]!`);
    } else if (type === 'siphon') {
      const stolen = Math.round(target.score * 0.15) || 50;
      target.score = Math.max(0, target.score - stolen);
      this.playerScore += stolen;
      this.setZoneNotice(`⚡ UKRAO SI +${stolen} POENA od [${target.name}]!`);
    }

    this.updateAttacksDeck();
    this.calculateRankings();
    this.updateHUD();
  }

  resetAttacks() {
    this.attacks = { freeze: false, smoke: false, siphon: false };
    this.updateAttacksDeck();
  }

  updateAttacksDeck() {
    if (this.btnFreeze) {
      this.btnFreeze.disabled = !this.attacks.freeze;
      const tag = this.btnFreeze.querySelector('.pvp-card-ready');
      if (tag) tag.textContent = this.attacks.freeze ? 'SPREMNO!' : 'LOCKED';
    }
    if (this.btnSmoke) {
      this.btnSmoke.disabled = !this.attacks.smoke;
      const tag = this.btnSmoke.querySelector('.pvp-card-ready');
      if (tag) tag.textContent = this.attacks.smoke ? 'SPREMNO!' : 'LOCKED';
    }
    if (this.btnSiphon) {
      this.btnSiphon.disabled = !this.attacks.siphon;
      const tag = this.btnSiphon.querySelector('.pvp-card-ready');
      if (tag) tag.textContent = this.attacks.siphon ? 'SPREMNO!' : 'LOCKED';
    }

    // Sync Mobile Royale Action Dock buttons
    const dockFreeze = document.getElementById('btn-dock-atk-freeze');
    if (dockFreeze) {
      dockFreeze.disabled = !this.attacks.freeze;
      dockFreeze.classList.toggle('ready', !!this.attacks.freeze);
    }
    const dockSmoke = document.getElementById('btn-dock-atk-smoke');
    if (dockSmoke) {
      dockSmoke.disabled = !this.attacks.smoke;
      dockSmoke.classList.toggle('ready', !!this.attacks.smoke);
    }
    const dockSiphon = document.getElementById('btn-dock-atk-siphon');
    if (dockSiphon) {
      dockSiphon.disabled = !this.attacks.siphon;
      dockSiphon.classList.toggle('ready', !!this.attacks.siphon);
    }
  }

  updateHUD() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = (this.timeLeft % 60).toString().padStart(2, '0');
    if (this.timerEl) this.timerEl.textContent = `${mins}:${secs}`;
    if (this.rankEl) this.rankEl.textContent = `#${this.playerRank}`;
    if (this.scoreEl) this.scoreEl.textContent = `${this.playerScore.toLocaleString()} ZLT`;

    // Sync Mobile Royale Dock Target Pill
    const dockTargetLbl = document.getElementById('royale-dock-target-lbl');
    if (dockTargetLbl) {
      let lbl = '#1 Lider';
      if (this.currentTargetMode === 'ahead') lbl = 'Rival Ispred';
      else if (this.currentTargetMode === 'nemesis') lbl = 'Osveta';
      dockTargetLbl.textContent = lbl;
    }
  }

  endMatch(completed = true) {
    this.clearTimers();
    this.clearTimeouts();

    if (completed && !this.isEliminated) {
      this.isMatchCompleted = true;
      this.isBuyInPaid = false; // Reset buy-in state for next entry
      this.calculateRankings();

      // Record match results in Prestige Leaderboard (Battle Royale Pillar)
      if (window.prestigeManager) {
        const isWin = (this.playerRank === 1);
        const killsEstimate = Math.max(1, Math.floor(this.playerScore / 500));
        window.prestigeManager.recordRoyaleMatch(this.playerRank, killsEstimate, isWin);
      }

      if (this.playerRank === 1) {
        // VICTORY ROYALE! Top 1 prize: 1.000 ZLT + Finale Ticket + VIP Voucher
        if (this.wallet && typeof this.wallet.addFictionalRsd === 'function') {
          this.wallet.addFictionalRsd(1000);
        }
        if (window.slotAudio && window.slotAudio.playRoyaleVictory) {
          window.slotAudio.playRoyaleVictory();
        }
        this.awardRoyaleVoucher(
          'Glavni Zlatni VIP Tiket: 1.000 ZLT + Finale u 21:00h',
          'club_ticket',
          1000,
          '1. Mesto u Battle Royale Areni! Zlatna ulaznica za Grand Finale u 21:00h (Fond 5.000 ZLT)!'
        );
        alert('👑 VICTORY ROYALE! Osvojili ste 1. MESTO u areni!\n+1.000 ZLT dodeljeno u novčanik (10x povrat uloga)!\nOsvojili ste Zlatnu ulaznicu za večernje Grand Finale u 21:00h!');
      } else if (this.playerRank === 2) {
        if (this.wallet && typeof this.wallet.addFictionalRsd === 'function') {
          this.wallet.addFictionalRsd(500);
        }
        alert('🥈 SREBRNA MEDALJA! Završili ste na 2. MESTU!\n+500 ZLT (5x povrat uloga) dodeljeno na vaš račun!');
      } else if (this.playerRank === 3) {
        if (this.wallet && typeof this.wallet.addFictionalRsd === 'function') {
          this.wallet.addFictionalRsd(300);
        }
        alert('🥉 BRONZANA MEDALJA! Završili ste na 3. MESTU!\n+300 ZLT (3x povrat uloga) dodeljeno na vaš račun!');
      } else {
        alert(`Meč je završen! Plasman: #${this.playerRank} od 20 takmičara sa ${this.playerScore.toLocaleString()} poena.\nKotizacija je iskorišćena. Pobednik nosi fond. Više sreće u sledećoj sobi!`);
      }
    } else {
      if (this.isEliminated && window.prestigeManager) {
        window.prestigeManager.recordRoyaleMatch(this.playerRank || 12, 0, false);
      }
      this.isBuyInPaid = false;
      this.forfeitMatch();
    }
  }

  async awardRoyaleVoucher(title, rewardType, rewardVal, desc) {
    const code = 'GSC-ROYALE-' + Math.floor(1000 + Math.random() * 9000);
    try {
      await fetch('/api/vouchers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: localStorage.getItem('gsc_player_id') || 'gsc_vip_royale',
          voucherCode: code,
          title: title,
          rewardValue: rewardVal,
          rewardType: rewardType,
          location: 'Grand Slot Club (20 lokala)'
        })
      });
    } catch (e) {}

    if (window.slotApp && typeof window.slotApp.showVoucherTicket === 'function') {
      window.slotApp.showVoucherTicket({
        voucher_code: code,
        title: title,
        reward_value: rewardVal,
        expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.SlotBattleRoyale = SlotBattleRoyale;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlotBattleRoyale;
}

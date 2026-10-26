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

    const btnStartArena = document.getElementById('btn-start-royale-round');
    if (btnStartArena) {
      btnStartArena.addEventListener('click', () => this.startMatch());
    }

    const btnExitArena = document.getElementById('btn-exit-royale-round');
    if (btnExitArena) {
      btnExitArena.addEventListener('click', () => this.endMatch(false));
    }
  }

  mount() {
    this.isActive = true;
    if (this.stageView) this.stageView.style.display = 'flex';
    if (this.slotStage) this.slotStage.style.display = 'block';

    if (!this.timerInterval) {
      this.startMatch();
    }
  }

  unmount() {
    this.isActive = false;
    if (this.stageView) this.stageView.style.display = 'none';
    this.clearTimers();
  }

  startMatch() {
    this.clearTimers();

    this.timeLeft = this.matchDuration;
    this.playerScore = 0;
    this.playerRank = 1;
    this.isEliminated = false;
    this.isFrozen = false;
    this.hasSmoke = false;

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

    setTimeout(() => {
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
      setTimeout(() => {
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

    if (type === 'freeze') {
      const rival = this.competitors.find(c => !c.eliminated);
      const targetName = rival ? rival.name : 'Protivnik';
      this.setZoneNotice(`❄️ ZALEDIO SI [${targetName}]! Kolone su mu zamrznute na 3s!`);
      if (rival) rival.score = Math.max(0, rival.score - 40);
    } else if (type === 'smoke') {
      this.setZoneNotice('💨 DIMNA BOMBA POSLATA! Protivnici moraju da čiste ekran!');
    } else if (type === 'siphon') {
      const rival = this.competitors.find(c => !c.eliminated && c.score > 0);
      if (rival) {
        const stolen = Math.round(rival.score * 0.12);
        rival.score -= stolen;
        this.playerScore += stolen;
        this.setZoneNotice(`⚡ UKRAO SI +${stolen} POENA od [${rival.name}]!`);
      }
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
  }

  updateHUD() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = (this.timeLeft % 60).toString().padStart(2, '0');
    if (this.timerEl) this.timerEl.textContent = `${mins}:${secs}`;
    if (this.rankEl) this.rankEl.textContent = `#${this.playerRank}`;
    if (this.scoreEl) this.scoreEl.textContent = `${this.playerScore.toLocaleString()} ZLT`;
  }

  endMatch(completed = true) {
    this.clearTimers();

    if (completed && !this.isEliminated) {
      this.calculateRankings();

      if (this.playerRank === 1) {
        // VICTORY ROYALE!
        this.awardRoyaleVoucher(
          'Glavni Zlatni VIP Tiket: 2.000 ZLT + Piće',
          'club_ticket',
          2000,
          '1. Mesto u Battle Royale Areni! Važi 48 sati u bilo kom od 20 lokala!'
        );
        alert('👑 POBEDA! Osvojili ste 1. MESTO u Battle Royale Areni!\nVaš Zlatni VIP Vaučer od 2.000 ZLT je spreman!');
      } else if (this.playerRank <= 5) {
        // Top 2-5 Silver Reward
        this.awardRoyaleVoucher(
          'Srebrni Vaučer: VIP Koktel na Šanku',
          'drink',
          500,
          'Top 5 Plasman u Battle Royale Areni! Preuzmite piće u bilo kom od 20 lokala u roku od 48h!'
        );
        alert(`🥈 ČESTITAMO! Plasman #${this.playerRank} u Battle Royale Areni!\nOsvojili ste Srebrni vaučer za piće na šanku!`);
      } else {
        alert(`Kraj meča! Završili ste na #${this.playerRank} mestu sa ${this.playerScore} poena. Sledeća runda počinje uskoro!`);
      }
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

window.SlotBattleRoyale = SlotBattleRoyale;

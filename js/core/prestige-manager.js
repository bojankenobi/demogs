/**
 * Grand Slot Club - Prestige & Hall of Fame Manager (Kuća Slavnih)
 * 
 * Manages cross-pillar leaderboards and prestige progression for:
 * 1. 🎰 Kazino Salon (Highest Multiplier X + Total Wagered + Spins)
 * 2. ⚔️ Trezor Provala (Highest Floor + Bosses Defeated + Keys + Loot)
 * 3. 👑 Battle Royale (Victory Royale Wins + Kills + Grand Finale Tickets)
 * 
 * Includes Weekly Seasons, Prestige Titles, Avatar Frames, and Operator Admin controls.
 */

class PrestigeManager {
  constructor() {
    this.STORAGE_KEYS = {
      SEASON: 'gsc_prestige_season_v1',
      BOARDS: 'gsc_prestige_leaderboard_v1',
      PLAYER: 'gsc_prestige_player_v1',
      HALL_OF_FAME: 'gsc_prestige_hall_of_fame_v1'
    };

    this.activeTab = 'casino'; // 'casino' | 'vault' | 'royale' | 'fame'
    this.countdownTimer = null;

    this.initData();
    this.bindEvents();
  }

  /* ==========================================================================
     DATA INITIALIZATION & DEFAULTS
     ========================================================================== */
  initData() {
    // 1. Season Info
    const now = Date.now();
    const defaultSeason = this.calculateNextSundayDeadline();
    try {
      const savedSeason = localStorage.getItem(this.STORAGE_KEYS.SEASON);
      if (savedSeason) {
        this.season = JSON.parse(savedSeason);
        // If expired, auto-trigger season conclusion
        if (this.season.endsAt && now >= this.season.endsAt) {
          this.executeSeasonReset(false);
        }
      } else {
        this.season = defaultSeason;
        this.saveSeason();
      }
    } catch (e) {
      this.season = defaultSeason;
    }

    // 2. Leaderboards
    this.initDefaultBoards();

    // 3. Player Record
    this.initPlayerRecord();

    // 4. Hall of Fame Archive
    this.initHallOfFame();
  }

  calculateNextSundayDeadline() {
    const d = new Date();
    // Days until next Sunday (0 is Sunday, so if today is Sunday, 7 days or midnight)
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const target = new Date(d);
    target.setDate(d.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    target.setHours(23, 59, 59, 999);

    const weekNumber = Math.ceil((((target - new Date(target.getFullYear(), 0, 1)) / 86400000) + 1) / 7);

    return {
      seasonId: `season_${target.getFullYear()}_w${weekNumber}`,
      seasonName: `Sezona ${weekNumber} • Nedeljni Šampionat`,
      startsAt: Date.now(),
      endsAt: target.getTime(),
      prizePool: {
        first: 5000,
        second: 2500,
        third: 1000
      }
    };
  }

  saveSeason() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SEASON, JSON.stringify(this.season));
    } catch (e) {}
  }

  initDefaultBoards() {
    const defaultBoards = {
      casino: [
        { id: 'bot_c1', name: 'Miloš (Nbgd VIP)', highestWinX: 1250, totalWagered: 45000, totalSpins: 320, score: 14040, avatar: '👑', frame: 'frame-gold' },
        { id: 'bot_c2', name: 'Stefan (Zemun)', highestWinX: 850, totalWagered: 38000, totalSpins: 290, score: 9840, avatar: '💎', frame: 'frame-cyan' },
        { id: 'bot_c3', name: 'Luka (Novi Sad)', highestWinX: 620, totalWagered: 24000, totalSpins: 180, score: 7040, avatar: '🔥', frame: 'frame-gold' },
        { id: 'bot_c4', name: 'Dorćol_Highroller', highestWinX: 410, totalWagered: 31000, totalSpins: 240, score: 5200, avatar: '⭐', frame: 'frame-silver' },
        { id: 'bot_c5', name: 'Kragujevac_Queen', highestWinX: 300, totalWagered: 18000, totalSpins: 150, score: 3660, avatar: '🎲', frame: 'frame-bronze' }
      ],
      vault: [
        { id: 'bot_v1', name: 'MasterHeist_Stefan', maxFloor: 5, bossesDefeated: 4, keysCollected: 42, totalLootZlt: 16500, score: 9700, avatar: '🕵️', frame: 'frame-gold' },
        { id: 'bot_v2', name: 'Bane_Dorćol_Raider', maxFloor: 5, bossesDefeated: 3, keysCollected: 35, totalLootZlt: 13200, score: 8695, avatar: '🗝️', frame: 'frame-cyan' },
        { id: 'bot_v3', name: 'Kruševac_Breaker', maxFloor: 4, bossesDefeated: 3, keysCollected: 28, totalLootZlt: 9800, score: 7180, avatar: '🏛️', frame: 'frame-gold' },
        { id: 'bot_v4', name: 'Pančevo_Shadow', maxFloor: 3, bossesDefeated: 2, keysCollected: 20, totalLootZlt: 6400, score: 5140, avatar: '🕶️', frame: 'frame-silver' },
        { id: 'bot_v5', name: 'Subotica_SafeCrack', maxFloor: 2, bossesDefeated: 1, keysCollected: 14, totalLootZlt: 3800, score: 3230, avatar: '🔒', frame: 'frame-bronze' }
      ],
      royale: [
        { id: 'bot_r1', name: 'Apex_Vuk_Kraljevo', wins: 8, kills: 34, finaleTickets: 5, matchesPlayed: 14, score: 28020, avatar: '🦁', frame: 'frame-gold' },
        { id: 'bot_r2', name: 'Gladiator_Nemanja', wins: 5, kills: 27, finaleTickets: 3, matchesPlayed: 12, score: 18410, avatar: '⚡', frame: 'frame-cyan' },
        { id: 'bot_r3', name: 'Aleksandar_ArenaKing', wins: 4, kills: 22, finaleTickets: 2, matchesPlayed: 10, score: 14600, avatar: '🏆', frame: 'frame-gold' },
        { id: 'bot_r4', name: 'Nikola_Sniper_Zemun', wins: 3, kills: 18, finaleTickets: 1, matchesPlayed: 8, score: 10940, avatar: '🎯', frame: 'frame-silver' },
        { id: 'bot_r5', name: 'Jovan_Čačak_Fighter', wins: 2, kills: 14, finaleTickets: 1, matchesPlayed: 6, score: 7780, avatar: '🃏', frame: 'frame-bronze' }
      ]
    };

    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.BOARDS);
      this.boards = saved ? JSON.parse(saved) : defaultBoards;
    } catch (e) {
      this.boards = defaultBoards;
    }
  }

  saveBoards() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.BOARDS, JSON.stringify(this.boards));
    } catch (e) {}
  }

  initPlayerRecord() {
    const defaultRecord = {
      casino: { highestWinX: 0, totalWagered: 0, totalSpins: 0, score: 0 },
      vault: { maxFloor: 1, bossesDefeated: 0, keysCollected: 0, totalLootZlt: 0, score: 0 },
      royale: { wins: 0, kills: 0, finaleTickets: 0, matchesPlayed: 0, score: 0 },
      earnedTitles: ['🛡️ Bronzani Takmičar'],
      activeTitle: '🛡️ Bronzani Takmičar'
    };

    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.PLAYER);
      this.playerRecord = saved ? { ...defaultRecord, ...JSON.parse(saved) } : defaultRecord;
    } catch (e) {
      this.playerRecord = defaultRecord;
    }
    this.recalculateAllPlayerScores();
  }

  savePlayerRecord() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PLAYER, JSON.stringify(this.playerRecord));
    } catch (e) {}
  }

  initHallOfFame() {
    const defaultFame = [
      {
        seasonId: 'season_2026_w43',
        seasonName: 'Sezona 43 (Oktobar 2026)',
        date: '2026-10-25',
        casinoChamp: { name: 'Miloš (Nbgd VIP)', score: 19800, prize: '5.000 ZLT + 👑 Kralj Slota' },
        vaultChamp: { name: 'Bane_Dorćol_Raider', score: 11400, prize: '5.000 ZLT + 🗝️ Vault Overlord' },
        royaleChamp: { name: 'Apex_Vuk_Kraljevo', score: 32400, prize: '5.000 ZLT + ⚔️ Apex Gladiator' }
      }
    ];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.HALL_OF_FAME);
      this.hallOfFame = saved ? JSON.parse(saved) : defaultFame;
    } catch (e) {
      this.hallOfFame = defaultFame;
    }
  }

  saveHallOfFame() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.HALL_OF_FAME, JSON.stringify(this.hallOfFame));
    } catch (e) {}
  }

  getPlayerName() {
    try {
      const savedProfile = localStorage.getItem('maxbet_player_profile') || localStorage.getItem('igt_player_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.username && p.username.trim()) return p.username.trim();
      }
    } catch (e) {}
    return 'Vi (Gost)';
  }

  /* ==========================================================================
     SCORING FORMULAS & TITLES
     ========================================================================== */
  calcCasinoScore(c) {
    if (!c) return 0;
    const winX = Number(c.highestWinX) || 0;
    const wagered = Number(c.totalWagered) || 0;
    const spins = Number(c.totalSpins) || 0;
    return Math.round((winX * 10) + (wagered / 50) + (spins * 2));
  }

  calcVaultScore(v) {
    if (!v) return 0;
    const fl = Number(v.maxFloor) || 1;
    const bosses = Number(v.bossesDefeated) || 0;
    const keys = Number(v.keysCollected) || 0;
    const loot = Number(v.totalLootZlt) || 0;
    return Math.round((fl * 1000) + (bosses * 500) + (keys * 25) + (loot / 10));
  }

  calcRoyaleScore(r) {
    if (!r) return 0;
    const wins = Number(r.wins) || 0;
    const kills = Number(r.kills) || 0;
    const tickets = Number(r.finaleTickets) || 0;
    const matches = Number(r.matchesPlayed) || 0;
    return Math.round((wins * 2500) + (kills * 150) + (tickets * 500) + (matches * 30));
  }

  recalculateAllPlayerScores() {
    this.playerRecord.casino.score = this.calcCasinoScore(this.playerRecord.casino);
    this.playerRecord.vault.score = this.calcVaultScore(this.playerRecord.vault);
    this.playerRecord.royale.score = this.calcRoyaleScore(this.playerRecord.royale);

    // Update Player Prestige Title based on max performance
    const totalScore = this.playerRecord.casino.score + this.playerRecord.vault.score + this.playerRecord.royale.score;
    let earnedTitle = '🛡️ Bronzani Takmičar';

    if (totalScore >= 15000) {
      earnedTitle = '✨ Apex Grand Master';
    } else if (totalScore >= 8000) {
      earnedTitle = '💎 Dijamantski Šampion';
    } else if (totalScore >= 3500) {
      earnedTitle = '🏆 Zlatni Veteran';
    } else if (totalScore >= 1200) {
      earnedTitle = '⚔️ Srebrni Izazivač';
    }

    if (!this.playerRecord.earnedTitles.includes(earnedTitle)) {
      this.playerRecord.earnedTitles.push(earnedTitle);
    }
    this.playerRecord.activeTitle = earnedTitle;
    this.savePlayerRecord();
  }

  getFrameClassForScore(score) {
    if (score >= 15000) return 'frame-gold-animated';
    if (score >= 8000) return 'frame-cyan';
    if (score >= 3500) return 'frame-gold';
    if (score >= 1200) return 'frame-silver';
    return 'frame-bronze';
  }

  /* ==========================================================================
     EVENT RECORDING HOOKS (CALLED FROM GAMES)
     ========================================================================== */
  recordCasinoSpin(betAmount, winAmount) {
    const bet = Number(betAmount) || 0;
    const win = Number(winAmount) || 0;
    const multX = bet > 0 ? (win / bet) : 0;

    this.playerRecord.casino.totalWagered += bet;
    this.playerRecord.casino.totalSpins += 1;
    if (multX > this.playerRecord.casino.highestWinX) {
      this.playerRecord.casino.highestWinX = Math.round(multX * 10) / 10;
    }

    this.recalculateAllPlayerScores();
  }

  recordVaultProgress(floor, bossDefeated = false, keysAdded = 0, lootAdded = 0) {
    if (floor > this.playerRecord.vault.maxFloor) {
      this.playerRecord.vault.maxFloor = floor;
    }
    if (bossDefeated) {
      this.playerRecord.vault.bossesDefeated += 1;
    }
    this.playerRecord.vault.keysCollected += (Number(keysAdded) || 0);
    this.playerRecord.vault.totalLootZlt += (Number(lootAdded) || 0);

    this.recalculateAllPlayerScores();
  }

  recordRoyaleMatch(placement, kills = 0, finaleTicketWon = false) {
    this.playerRecord.royale.matchesPlayed += 1;
    this.playerRecord.royale.kills += (Number(kills) || 0);
    if (placement === 1) {
      this.playerRecord.royale.wins += 1;
    }
    if (finaleTicketWon) {
      this.playerRecord.royale.finaleTickets += 1;
    }

    this.recalculateAllPlayerScores();
  }

  /* ==========================================================================
     LEADERBOARD COMPOSITION WITH PLAYER
     ========================================================================== */
  getSortedLeaderboard(category) {
    this.recalculateAllPlayerScores();
    const myName = this.getPlayerName();
    const pStats = this.playerRecord[category] || {};
    const pScore = pStats.score || 0;

    const playerEntry = {
      id: 'player_me',
      isYou: true,
      name: `${myName} (Vi)`,
      score: pScore,
      avatar: '👤',
      frame: this.getFrameClassForScore(pScore),
      ...pStats
    };

    const competitors = (this.boards[category] || []).filter(item => !item.isYou);
    const combined = [playerEntry, ...competitors];

    // Sort descending by calculated score
    combined.sort((a, b) => b.score - a.score);

    // Assign rank 1..N
    return combined.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /* ==========================================================================
     SEASON COUNTDOWN & RESETS
     ========================================================================== */
  getTimeRemaining() {
    const totalMs = Math.max(0, this.season.endsAt - Date.now());
    const totalSecs = Math.floor(totalMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return {
      totalMs,
      days,
      hours,
      minutes,
      seconds,
      isExpired: totalMs <= 0,
      formatted: `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
    };
  }

  executeSeasonReset(isAdminManual = false) {
    // 1. Gather Top 1 for Hall of Fame
    const casinoSorted = this.getSortedLeaderboard('casino');
    const vaultSorted = this.getSortedLeaderboard('vault');
    const royaleSorted = this.getSortedLeaderboard('royale');

    const casinoTop = casinoSorted[0] || { name: 'Miloš (Nbgd VIP)', score: 14040 };
    const vaultTop = vaultSorted[0] || { name: 'MasterHeist_Stefan', score: 9700 };
    const royaleTop = royaleSorted[0] || { name: 'Apex_Vuk_Kraljevo', score: 28020 };

    // 2. Archive to Hall of Fame
    const archivedSeason = {
      seasonId: this.season.seasonId,
      seasonName: this.season.seasonName,
      date: new Date().toISOString().split('T')[0],
      casinoChamp: { name: casinoTop.name, score: casinoTop.score, prize: `${this.season.prizePool.first} ZLT + 🎰 Kralj Slota` },
      vaultChamp: { name: vaultTop.name, score: vaultTop.score, prize: `${this.season.prizePool.first} ZLT + 🗝️ Vault Overlord` },
      royaleChamp: { name: royaleTop.name, score: royaleTop.score, prize: `${this.season.prizePool.first} ZLT + 👑 Apex Gladiator` }
    };
    this.hallOfFame.unshift(archivedSeason);
    this.saveHallOfFame();

    // 3. Award Player if in Top 3
    ['casino', 'vault', 'royale'].forEach(cat => {
      const list = (cat === 'casino') ? casinoSorted : (cat === 'vault' ? vaultSorted : royaleSorted);
      const myRank = list.findIndex(x => x.isYou) + 1;
      if (myRank >= 1 && myRank <= 3) {
        let rewardZlt = 0;
        let rewardTitle = '';
        if (myRank === 1) {
          rewardZlt = this.season.prizePool.first;
          rewardTitle = `👑 Šampion Sezone (${cat.toUpperCase()})`;
        } else if (myRank === 2) {
          rewardZlt = this.season.prizePool.second;
          rewardTitle = `🥈 Srebrni Laureat (${cat.toUpperCase()})`;
        } else if (myRank === 3) {
          rewardZlt = this.season.prizePool.third;
          rewardTitle = `🥉 Bronzani Laureat (${cat.toUpperCase()})`;
        }

        // Add to wallet
        if (window.wallet && typeof window.wallet.addFictionalRsd === 'function') {
          window.wallet.addFictionalRsd(rewardZlt);
        }

        if (!this.playerRecord.earnedTitles.includes(rewardTitle)) {
          this.playerRecord.earnedTitles.push(rewardTitle);
        }
      }
    });

    // 4. Reset Player stats for new season
    this.playerRecord.casino = { highestWinX: 0, totalWagered: 0, totalSpins: 0, score: 0 };
    this.playerRecord.vault = { maxFloor: 1, bossesDefeated: 0, keysCollected: 0, totalLootZlt: 0, score: 0 };
    this.playerRecord.royale = { wins: 0, kills: 0, finaleTickets: 0, matchesPlayed: 0, score: 0 };
    this.savePlayerRecord();

    // 5. Initialize new season schedule
    this.season = this.calculateNextSundayDeadline();
    this.saveSeason();

    console.log(`[PrestigeManager] Season successfully concluded and reset. Admin trigger: ${isAdminManual}`);
    return archivedSeason;
  }

  /* ==========================================================================
     ADMINISTRATOR OPERATIONS
     ========================================================================== */
  disqualifyEntry(category, entryId) {
    if (!this.boards[category]) return false;
    this.boards[category] = this.boards[category].filter(x => x.id !== entryId);
    this.saveBoards();
    return true;
  }

  updatePrizePool(firstZlt, secondZlt, thirdZlt) {
    this.season.prizePool = {
      first: Math.max(0, Number(firstZlt) || 5000),
      second: Math.max(0, Number(secondZlt) || 2500),
      third: Math.max(0, Number(thirdZlt) || 1000)
    };
    this.saveSeason();
    return this.season.prizePool;
  }

  /* ==========================================================================
     MODAL & UI BINDINGS
     ========================================================================== */
  bindEvents() {
    // Header trigger button
    const openBtn = document.getElementById('prestige-hall-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openModal(this.activeTab));
    }

    // Modal close button & background click
    const modalEl = document.getElementById('prestige-hall-modal');
    const closeBtn = document.getElementById('prestige-hall-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) this.closeModal();
      });
    }

    // Modal tabs
    const tabBtns = document.querySelectorAll('.prestige-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
    });
  }

  openModal(tab = 'casino') {
    const modal = document.getElementById('prestige-hall-modal');
    if (!modal) return;

    this.activeTab = tab;
    modal.classList.add('is-open');

    // SFX if available
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }

    this.renderModal();
    this.startCountdownTimer();
  }

  closeModal() {
    const modal = document.getElementById('prestige-hall-modal');
    if (modal) modal.classList.remove('is-open');
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
    this.renderModal();
  }

  startCountdownTimer() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const timerEl = document.getElementById('prestige-season-timer-val');
      if (timerEl) {
        const rem = this.getTimeRemaining();
        timerEl.textContent = rem.formatted;
        if (rem.isExpired) {
          this.executeSeasonReset(false);
          this.renderModal();
        }
      }
    }, 1000);
  }

  renderModal() {
    // 1. Update Tab Buttons
    const tabBtns = document.querySelectorAll('.prestige-tab-btn');
    tabBtns.forEach(btn => {
      const t = btn.getAttribute('data-tab');
      btn.classList.toggle('active', t === this.activeTab);
    });

    // 2. Update Season Header & Countdown
    const titleEl = document.getElementById('prestige-season-title');
    if (titleEl) titleEl.textContent = this.season.seasonName;

    const timerEl = document.getElementById('prestige-season-timer-val');
    if (timerEl) timerEl.textContent = this.getTimeRemaining().formatted;

    // 3. Update Personal Prestige Card
    this.renderPersonalCard();

    // 4. Render Table Content
    const contentContainer = document.getElementById('prestige-table-content');
    if (!contentContainer) return;

    if (this.activeTab === 'fame') {
      this.renderHallOfFameTable(contentContainer);
    } else {
      this.renderPillarLeaderboardTable(contentContainer, this.activeTab);
    }
  }

  renderPersonalCard() {
    const myName = this.getPlayerName();
    const nameEl = document.getElementById('prestige-my-name');
    const titleEl = document.getElementById('prestige-my-title');
    const avatarEl = document.getElementById('prestige-my-avatar');
    const myRankEl = document.getElementById('prestige-my-rank');
    const myScoreEl = document.getElementById('prestige-my-score');
    const myMetricEl = document.getElementById('prestige-my-metric');

    if (nameEl) nameEl.textContent = myName;
    if (titleEl) titleEl.textContent = this.playerRecord.activeTitle;
    if (avatarEl) {
      avatarEl.className = `prestige-avatar-box ${this.getFrameClassForScore(this.playerRecord.casino.score + this.playerRecord.vault.score + this.playerRecord.royale.score)}`;
    }

    if (this.activeTab === 'fame') {
      if (myRankEl) myRankEl.textContent = 'VEČNA KUĆA';
      if (myScoreEl) myScoreEl.textContent = `${this.hallOfFame.length} Arhiviranih Sezona`;
      if (myMetricEl) myMetricEl.textContent = 'Istorijski šampioni i laureati Grand Slot kluba';
      return;
    }

    const sorted = this.getSortedLeaderboard(this.activeTab);
    const myEntry = sorted.find(x => x.isYou);
    const myRank = myEntry ? myEntry.rank : '-';
    const myScore = myEntry ? myEntry.score : 0;

    if (myRankEl) myRankEl.textContent = `#${myRank}`;
    if (myScoreEl) myScoreEl.textContent = `${myScore.toLocaleString()} Bodova`;

    if (myMetricEl) {
      if (this.activeTab === 'casino') {
        myMetricEl.textContent = `Max Dobitak: ${this.playerRecord.casino.highestWinX}x • Uloženo: ${this.playerRecord.casino.totalWagered.toLocaleString()} ZLT • ${this.playerRecord.casino.totalSpins} Spinova`;
      } else if (this.activeTab === 'vault') {
        myMetricEl.textContent = `Sprat: ${this.playerRecord.vault.maxFloor}/5 • Bossovi: ${this.playerRecord.vault.bossesDefeated} • Ključevi: ${this.playerRecord.vault.keysCollected} • Blago: ${this.playerRecord.vault.totalLootZlt.toLocaleString()} ZLT`;
      } else if (this.activeTab === 'royale') {
        myMetricEl.textContent = `Pobede: ${this.playerRecord.royale.wins} 👑 • Kills: ${this.playerRecord.royale.kills} • Finale Karte: ${this.playerRecord.royale.finaleTickets} 🎟️ • Mečevi: ${this.playerRecord.royale.matchesPlayed}`;
      }
    }
  }

  renderPillarLeaderboardTable(container, category) {
    const sorted = this.getSortedLeaderboard(category);

    let colHeaders = '';
    if (category === 'casino') {
      colHeaders = `
        <span class="col-head rank-col">Rang</span>
        <span class="col-head name-col">Takmičar</span>
        <span class="col-head stat-col">Max Dobitak (X)</span>
        <span class="col-head stat-col">Ukupni Obrt</span>
        <span class="col-head score-col">Prestiž Skor</span>
        <span class="col-head prize-col">Nagrada</span>
      `;
    } else if (category === 'vault') {
      colHeaders = `
        <span class="col-head rank-col">Rang</span>
        <span class="col-head name-col">Takmičar</span>
        <span class="col-head stat-col">Max Sprat</span>
        <span class="col-head stat-col">Bossovi / Ključevi</span>
        <span class="col-head score-col">Prestiž Skor</span>
        <span class="col-head prize-col">Nagrada</span>
      `;
    } else if (category === 'royale') {
      colHeaders = `
        <span class="col-head rank-col">Rang</span>
        <span class="col-head name-col">Takmičar</span>
        <span class="col-head stat-col">Victory Royale</span>
        <span class="col-head stat-col">Kills / Karte</span>
        <span class="col-head score-col">Prestiž Skor</span>
        <span class="col-head prize-col">Nagrada</span>
      `;
    }

    const rowsHtml = sorted.map((row, idx) => {
      let medal = `<span class="prestige-rank-num">#${row.rank}</span>`;
      let prizePill = `<span class="prize-tag none">-</span>`;

      if (row.rank === 1) {
        medal = `<span class="prestige-medal gold">🥇 1</span>`;
        prizePill = `<span class="prize-tag first">5.000 ZLT + 👑 VIP Titula</span>`;
      } else if (row.rank === 2) {
        medal = `<span class="prestige-medal silver">🥈 2</span>`;
        prizePill = `<span class="prize-tag second">2.500 ZLT + 🥈 Bedž</span>`;
      } else if (row.rank === 3) {
        medal = `<span class="prestige-medal bronze">🥉 3</span>`;
        prizePill = `<span class="prize-tag third">1.000 ZLT + 🥉 Bedž</span>`;
      }

      let metric1 = '-';
      let metric2 = '-';

      if (category === 'casino') {
        metric1 = `⚡ ${row.highestWinX || 0}x`;
        metric2 = `💰 ${(row.totalWagered || 0).toLocaleString()} ZLT`;
      } else if (category === 'vault') {
        metric1 = `🏢 Sprat ${row.maxFloor || 1}/5`;
        metric2 = `💀 ${row.bossesDefeated || 0} / 🗝️ ${row.keysCollected || 0}`;
      } else if (category === 'royale') {
        metric1 = `👑 ${row.wins || 0} Pobeda`;
        metric2 = `🎯 ${row.kills || 0} K / 🎟️ ${row.finaleTickets || 0}`;
      }

      return `
        <div class="prestige-table-row ${row.isYou ? 'is-player-row' : ''} ${row.rank <= 3 ? `top-${row.rank}` : ''}">
          <div class="row-cell rank-col">${medal}</div>
          <div class="row-cell name-col">
            <span class="prestige-row-avatar ${row.frame || ''}">${row.avatar || '👤'}</span>
            <span class="prestige-row-name">${row.name}</span>
            ${row.isYou ? '<span class="you-badge-chip">VI</span>' : ''}
          </div>
          <div class="row-cell stat-col">${metric1}</div>
          <div class="row-cell stat-col">${metric2}</div>
          <div class="row-cell score-col">
            <strong class="score-highlight">${(row.score || 0).toLocaleString()}</strong>
          </div>
          <div class="row-cell prize-col">${prizePill}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="prestige-table-wrap">
        <div class="prestige-table-header">${colHeaders}</div>
        <div class="prestige-table-body">${rowsHtml}</div>
      </div>
    `;
  }

  renderHallOfFameTable(container) {
    if (!this.hallOfFame || this.hallOfFame.length === 0) {
      container.innerHTML = `<div class="fame-empty-notice">Još uvek nema arhiviranih prethodnih sezona. Prva sezona je u toku!</div>`;
      return;
    }

    const cardsHtml = this.hallOfFame.map(item => `
      <div class="fame-season-card">
        <div class="fame-card-header">
          <span class="fame-season-title">🏛️ ${item.seasonName}</span>
          <span class="fame-season-date">${item.date}</span>
        </div>
        <div class="fame-podiums-grid">
          <div class="fame-podium-box casino-gold">
            <div class="podium-pillar-tag">🎰 KAZINO ŠAMPION</div>
            <div class="podium-winner-name">${item.casinoChamp.name}</div>
            <div class="podium-winner-score">${item.casinoChamp.score.toLocaleString()} Bodova</div>
            <div class="podium-winner-reward">${item.casinoChamp.prize}</div>
          </div>
          <div class="fame-podium-box vault-gold">
            <div class="podium-pillar-tag">⚔️ MASTER TREZORA</div>
            <div class="podium-winner-name">${item.vaultChamp.name}</div>
            <div class="podium-winner-score">${item.vaultChamp.score.toLocaleString()} Bodova</div>
            <div class="podium-winner-reward">${item.vaultChamp.prize}</div>
          </div>
          <div class="fame-podium-box royale-gold">
            <div class="podium-pillar-tag">👑 APEX GLADIATOR</div>
            <div class="podium-winner-name">${item.royaleChamp.name}</div>
            <div class="podium-winner-score">${item.royaleChamp.score.toLocaleString()} Bodova</div>
            <div class="podium-winner-reward">${item.royaleChamp.prize}</div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="fame-cards-container">${cardsHtml}</div>`;
  }
}

// Global Singleton Instance
if (typeof window !== 'undefined') {
  window.PrestigeManager = PrestigeManager;
  window.prestigeManager = new PrestigeManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrestigeManager };
}

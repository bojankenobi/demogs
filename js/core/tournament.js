/**
 * IGT - Casino Tournament Mode Engine
 * High-speed 120-second tournament challenge with 5,000 tournament credits,
 * live on-screen countdown HUD, real-time score tracking and persistent local leaderboard.
 */
class CasinoTournament {
  constructor(wallet) {
    this.wallet = wallet;
    this.isActive = false;
    this.duration = 120; // 2 minutes
    this.timeLeft = 120;
    this.tournamentScore = 0;
    this.timerInterval = null;
    this.backupRsd = 0;

    this.STORAGE_KEY = 'igt_tournament_leaderboard_v1';

    // DOM Elements
    this.modal = document.getElementById('tournament-modal');
    this.resultsModal = document.getElementById('tournament-results-modal');
    this.hudBanner = document.getElementById('tournament-hud-banner');
    this.btnOpen = document.getElementById('tournament-btn');
    this.btnClose = document.getElementById('tournament-close-btn');
    this.btnStart = document.getElementById('tournament-start-btn');
    this.btnResultsClose = document.getElementById('tournament-results-close-btn');

    this.hudTimeEl = document.getElementById('tournament-hud-time');
    this.hudScoreEl = document.getElementById('tournament-hud-score');
    this.hudRankEl = document.getElementById('tournament-hud-rank');

    this.leaderboardListEl = document.getElementById('tournament-leaderboard-list');
    this.resultScoreEl = document.getElementById('tournament-result-score');
    this.resultRankEl = document.getElementById('tournament-result-rank');

    this.initEvents();
    this.loadLeaderboard();
  }

  initEvents() {
    if (this.btnOpen) {
      this.btnOpen.addEventListener('click', () => this.openModal());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.closeModal());
    }
    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => this.startTournament());
    }
    if (this.btnResultsClose) {
      this.btnResultsClose.addEventListener('click', () => this.closeResultsModal());
    }
    const exitBtn = document.getElementById('tour-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        if (this.isActive) this.endTournament();
      });
    }
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
  }

  loadLeaderboard() {
    const defaultBoard = [
      { name: '🥇 VIP_HighRoller', score: 18450 },
      { name: '🥈 BelgradeSpinner', score: 14200 },
      { name: '🥉 Lucky_777', score: 11900 },
      { name: '👑 MasterJack', score: 9500 },
      { name: '⭐ CasinoPro', score: 7800 }
    ];

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.leaderboard = JSON.parse(saved);
      } else {
        this.leaderboard = defaultBoard;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultBoard));
      }
    } catch (e) {
      this.leaderboard = defaultBoard;
    }
  }

  saveLeaderboard() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {}
  }

  renderLeaderboard() {
    if (!this.leaderboardListEl) return;
    this.leaderboardListEl.innerHTML = this.leaderboard.map((item, idx) => {
      const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}.`));
      return `
        <div class="tournament-lead-row ${idx === 0 ? 'first-place' : ''}">
          <span class="lead-rank">${medal}</span>
          <span class="lead-name">${item.name}</span>
          <span class="lead-score">${item.score.toLocaleString()} RSD</span>
        </div>
      `;
    }).join('');
  }

  openModal() {
    if (this.isActive) {
      if (window.slotApp) {
        const msg = window.i18n ? window.i18n.t('tourAlreadyActive') : '⚡ TURNIR JE VEĆ U TOKU!';
        window.slotApp.showMessage(msg, 'warning');
      }
      return;
    }
    this.loadLeaderboard();
    this.renderLeaderboard();
    if (this.modal) this.modal.classList.add('active');
    if (window.slotAudio) window.slotAudio.playClick();
  }

  closeModal() {
    if (this.modal) this.modal.classList.remove('active');
    if (window.slotAudio) window.slotAudio.playClick();
  }

  closeResultsModal() {
    if (this.resultsModal) this.resultsModal.classList.remove('active');
    if (window.slotAudio) window.slotAudio.playClick();
  }

  startTournament() {
    if (this.isActive) return;
    this.closeModal();

    this.isActive = true;
    this.timeLeft = this.duration;
    this.tournamentScore = 0;

    // Backup player's current balance
    this.backupRsd = this.wallet.rsdBalance;

    // Award 5,000 tournament credits (at active denomination)
    const tourneyRsd = +(5000 * this.wallet.activeDenom).toFixed(2);
    this.wallet.rsdBalance = tourneyRsd;
    this.wallet.bet = 50; // set standard 50 credit tourney bet
    this.wallet.saveState();
    this.wallet.updateUI();

    // Show floating Tournament HUD
    if (this.hudBanner) {
      this.hudBanner.style.display = 'flex';
      this.hudBanner.classList.add('pulse-active');
    }
    this.updateHUD();

    if (window.slotAudio) window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    if (window.slotApp) {
      const msg = window.i18n ? window.i18n.t('tourStartedMsg') : '🏆 TURNIR JE POČEO! 2 MINUTA ZA MAKSIMALAN DOBITAK! ⚡';
      window.slotApp.showMessage(msg, 'jackpot');
    }

    // Timer loop
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateHUD();

      if (this.timeLeft <= 10 && this.timeLeft > 0) {
        if (window.slotAudio && window.slotAudio.playClick) window.slotAudio.playClick();
      }

      if (this.timeLeft <= 0) {
        this.endTournament();
      }
    }, 1000);
  }

  updateHUD() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (this.hudTimeEl) this.hudTimeEl.textContent = timeStr;
    if (this.hudScoreEl) this.hudScoreEl.textContent = `${this.tournamentScore.toLocaleString()} RSD`;

    // Estimate rank
    let rank = 1;
    for (const item of this.leaderboard) {
      if (this.tournamentScore < item.score) rank++;
    }
    if (this.hudRankEl) this.hudRankEl.textContent = `#${Math.min(10, rank)}`;
  }

  onSpinWin(winCredits) {
    if (!this.isActive || winCredits <= 0) return;
    const rsdWon = +(winCredits * this.wallet.activeDenom).toFixed(2);
    this.tournamentScore = +(this.tournamentScore + rsdWon).toFixed(2);
    this.updateHUD();
  }

  endTournament() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isActive = false;

    if (this.hudBanner) {
      this.hudBanner.style.display = 'none';
      this.hudBanner.classList.remove('pulse-active');
    }

    // Restore real balance
    this.wallet.rsdBalance = this.backupRsd;
    this.wallet.saveState();
    this.wallet.updateUI();

    // Check placement on leaderboard
    const fallbackName = window.i18n ? window.i18n.t('tourPlayerYou') : 'Vi (Igrač)';
    const playerName = (window.slotApp && window.slotApp.playerTracker && window.slotApp.playerTracker.profile.username)
      ? window.slotApp.playerTracker.profile.username
      : fallbackName;

    this.leaderboard.push({ name: playerName, score: Math.round(this.tournamentScore) });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 5); // top 5
    this.saveLeaderboard();

    const userRank = this.leaderboard.findIndex(item => item.name === playerName) + 1;
    const rankLabel = userRank > 0 
      ? (window.i18n ? window.i18n.t('tourRankPlace', { rank: userRank }) : `#${userRank}. MESTO`)
      : 'TOP 10';

    if (this.resultScoreEl) this.resultScoreEl.textContent = `${Math.round(this.tournamentScore).toLocaleString()} RSD`;
    if (this.resultRankEl) this.resultRankEl.textContent = rankLabel;

    if (this.resultsModal) this.resultsModal.classList.add('active');

    if (window.slotAudio) window.slotAudio.playJackpot();
    if (window.particleEngine) window.particleEngine.spawnCelebration(true);

    if (window.slotApp) {
      const msg = window.i18n 
        ? window.i18n.t('tourFinishedMsg', { rank: rankLabel, score: Math.round(this.tournamentScore).toLocaleString() })
        : `🎉 ZAVRŠEN TURNIR! RANG: ${rankLabel} (${Math.round(this.tournamentScore)} RSD)!`;
      window.slotApp.showMessage(msg, 'jackpot');
    }
  }
}

window.CasinoTournament = CasinoTournament;

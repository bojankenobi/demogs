/**
 * Grand Slot Club - Daily Missions & 7-Day Streak Retention Engine
 * 
 * Manages the dual-pathway experience in Casino Salon:
 * 1. Casual / Free play across all casino games
 * 2. 3 Daily Gamified Missions with instant ZLT rewards
 * 3. 7-Day Progressive Streak calendar with Day 7 Mystery Chest & Physical VIP Club Voucher
 * 4. Direct 'Play Now' shortcut routing to respective games
 */

class DailyMissionsManager {
  constructor() {
    this.STORAGE_KEY = 'gsc_daily_missions_v1';
    this.STREAK_REWARDS = [15, 20, 25, 35, 50, 75, 150]; // Day 1 to Day 7 ZLT
    this.timerInterval = null;

    this.initState();
    this.bindEvents();
    this.startMidnightTimer();
    this.renderBar();
  }

  /* ==========================================================================
     State & Date Calculations
     ========================================================================== */
  getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateDailyMissions() {
    return [
      {
        id: 'task_slot',
        category: 'slot',
        title: 'Spin Majstor',
        desc: 'Zavrti 15 spinova na Classic ili Royal slotu',
        target: 15,
        current: 0,
        reward: 20,
        gameId: 'classic',
        icon: '🎰',
        completed: false,
        claimed: false
      },
      {
        id: 'task_arcade',
        category: 'arcade',
        title: 'Raketni Dobitak',
        desc: 'Pogodi 2.0x ili veći na Crashu ili Plinku',
        target: 1,
        current: 0,
        reward: 25,
        gameId: 'crash',
        icon: '🚀',
        completed: false,
        claimed: false
      },
      {
        id: 'task_table',
        category: 'table',
        title: 'Stona Taktika',
        desc: 'Odigraj 5 ruku Blackjacka ili otkrij 5 dijamanata u Minama',
        target: 5,
        current: 0,
        reward: 25,
        gameId: 'blackjack',
        icon: '🃏',
        completed: false,
        claimed: false
      }
    ];
  }

  initState() {
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    const defaultState = {
      streak: 1,
      lastClaimDate: null,
      todayDate: today,
      missions: this.generateDailyMissions()
    };

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);

        // Check if date rolled over to a new day
        if (this.state.todayDate !== today) {
          // Check streak continuity:
          // If player claimed yesterday, streak progresses; if missed, resets to 1!
          if (this.state.lastClaimDate === yesterday) {
            this.state.streak = (this.state.streak >= 7) ? 1 : (this.state.streak + 1);
          } else if (this.state.lastClaimDate !== today) {
            // Missed a day -> reset to Day 1
            this.state.streak = 1;
          }

          this.state.todayDate = today;
          this.state.missions = this.generateDailyMissions();
          this.saveState();
        }
      } else {
        this.state = defaultState;
        this.saveState();
      }
    } catch (e) {
      this.state = defaultState;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diffMs = Math.max(0, midnight.getTime() - now.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    return {
      hours,
      mins,
      secs,
      formatted: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    };
  }

  startMidnightTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const timeObj = this.getTimeUntilMidnight();
      const elBar = document.getElementById('dmb-reset-timer');
      const elModal = document.getElementById('dmm-reset-timer');
      if (elBar) elBar.textContent = `⏳ Reset: ${timeObj.formatted}`;
      if (elModal) elModal.textContent = timeObj.formatted;

      // Check if day changed
      const today = this.getTodayString();
      if (this.state.todayDate !== today) {
        this.initState();
        this.renderBar();
        this.renderModal();
      }
    }, 1000);

    if (this.timerInterval && typeof this.timerInterval.unref === 'function') {
      this.timerInterval.unref();
    }
  }

  /* ==========================================================================
     Game Action Hooks
     ========================================================================== */
  recordSlotSpin() {
    const task = this.state.missions.find(m => m.id === 'task_slot');
    if (!task || task.completed) return;

    task.current += 1;
    if (task.current >= task.target) {
      task.current = task.target;
      task.completed = true;
      this.notifyMissionCompleted(task);
    }
    this.saveState();
    this.renderBar();
  }

  recordArcadeWin(multiplier) {
    const mult = Number(multiplier) || 0;
    if (mult < 2.0) return;

    const task = this.state.missions.find(m => m.id === 'task_arcade');
    if (!task || task.completed) return;

    task.current += 1;
    if (task.current >= task.target) {
      task.current = task.target;
      task.completed = true;
      this.notifyMissionCompleted(task);
    }
    this.saveState();
    this.renderBar();
  }

  recordTableAction() {
    const task = this.state.missions.find(m => m.id === 'task_table');
    if (!task || task.completed) return;

    task.current += 1;
    if (task.current >= task.target) {
      task.current = task.target;
      task.completed = true;
      this.notifyMissionCompleted(task);
    }
    this.saveState();
    this.renderBar();
  }

  notifyMissionCompleted(task) {
    if (window.slotAudio && window.slotAudio.playWin) {
      window.slotAudio.playWin();
    }
    if (window.igtApp && window.igtApp.showMessage) {
      window.igtApp.showMessage(`🎯 ZADATAK ZAVRŠEN: ${task.title}! Preuzmite +${task.reward} ZLT!`, 'win');
    }
    this.renderBar();
  }

  /* ==========================================================================
     Claims & Rewards
     ========================================================================== */
  claimMission(missionId) {
    const task = this.state.missions.find(m => m.id === missionId);
    if (!task || !task.completed || task.claimed) return;

    task.claimed = true;
    this.saveState();

    // Award ZLT into wallet
    if (window.wallet && typeof window.wallet.addFictionalRsd === 'function') {
      window.wallet.addFictionalRsd(task.reward);
    } else if (window.igtApp && window.igtApp.wallet) {
      window.igtApp.wallet.addFictionalRsd(task.reward);
    }

    // Award Status Points (XP)
    const xpReward = Math.max(50, Math.round((task.reward || 20) * 2.5));
    if (window.slotTierManager && typeof window.slotTierManager.addXP === 'function') {
      window.slotTierManager.addXP(xpReward, 'Rešena misija: ' + task.title);
      // All 3 missions completed bonus (+250 XP)
      if (this.state.missions.every(m => m.claimed)) {
        setTimeout(() => {
          window.slotTierManager.addXP(250, 'Sve 3 dnevne misije rešene!');
          if (window.igtApp && window.igtApp.showMessage) {
            window.igtApp.showMessage('🏆 SVE DNEVNE MISIJE ZAVRŠENE! +250 XP EKSTRA BONUS!', 'jackpot');
          }
        }, 600);
      }
    }

    if (window.slotAudio && window.slotAudio.playBigWin) {
      window.slotAudio.playBigWin();
    }
    if (window.particleEngine && window.particleEngine.burst) {
      window.particleEngine.burst(window.innerWidth / 2, window.innerHeight / 2);
    }

    if (window.igtApp && window.igtApp.showMessage) {
      window.igtApp.showMessage(`🎁 PREUZETO: +${task.reward} ZLT dodeljeno u novčanik!`, 'win');
    }

    this.renderBar();
    this.renderModal();
  }

  canClaimStreakToday() {
    return this.state.lastClaimDate !== this.getTodayString();
  }

  claimDailyStreak() {
    if (!this.canClaimStreakToday()) {
      if (typeof alert !== 'undefined') {
        alert('Već ste preuzeli dnevnu nagradu za danas! Vratite se sutra za sledeći korak niza.');
      }
      return;
    }

    const currentDay = this.state.streak; // 1..7
    const rewardZlt = this.STREAK_REWARDS[currentDay - 1] || 15;

    // Mark claimed today
    this.state.lastClaimDate = this.getTodayString();
    this.saveState();

    // Award ZLT
    if (window.wallet && typeof window.wallet.addFictionalRsd === 'function') {
      window.wallet.addFictionalRsd(rewardZlt);
    } else if (window.igtApp && window.igtApp.wallet) {
      window.igtApp.wallet.addFictionalRsd(rewardZlt);
    }

    // Award Streak XP (25 to 150 XP)
    const streakXpTable = [25, 35, 50, 75, 100, 125, 150];
    const earnedStreakXp = streakXpTable[currentDay - 1] || 25;
    if (window.slotTierManager && typeof window.slotTierManager.addXP === 'function') {
      window.slotTierManager.addXP(earnedStreakXp, `Dnevni Login Dan ${currentDay}/7`);
    }

    if (window.slotAudio && window.slotAudio.playBigWin) {
      window.slotAudio.playBigWin();
    }
    if (window.particleEngine && window.particleEngine.spawnCelebration) {
      window.particleEngine.spawnCelebration(true);
    }

    // Special Day 7 Grand Reward: Mystery Chest & Physical VIP Voucher Trigger!
    if (currentDay === 7) {
      setTimeout(() => {
        if (window.igtApp && typeof window.igtApp.openVoucherModal === 'function') {
          window.igtApp.openVoucherModal({
            title: '🎁 VIP GRAND ŠAMPION 7-DNEVNOG NIZA!',
            description: 'Čestitamo! Uspešno ste ostvarili punih 7 dana uzastopne igre u Grand Slot Klubu! Iskoristite ovaj ekskluzivni vaučer za besplatno VIP piće i promo kredit u bilo kom od 20 klubova!',
            rewardValue: 1500,
            rewardType: 'voucher_drink',
            promoAction: 'voucher_drink',
            location: 'Grand Slot Club (Svi Lokali)'
          });
        }
      }, 700);

      if (typeof alert !== 'undefined') {
        alert(`🔥 ČESTITAMO! KOMPLETIRAN JE 7-DNEVNI NIZ!\n\n+${rewardZlt} ZLT dodeljeno u novčanik!\nOtključana je VIP Mystery Škrinja sa vaučerom za lokal!`);
      }
    } else {
      if (typeof alert !== 'undefined') {
        alert(`🔥 DNEVNI NIZ (DAN ${currentDay}/7)!\n\n+${rewardZlt} ZLT dodeljeno na vaš račun!\nVratite se sutra za veći bonus!`);
      }
    }

    this.renderBar();
    this.renderModal();
  }

  playGame(gameId) {
    this.closeModal();
    if (window.igtApp && window.igtApp.lobby) {
      window.igtApp.lobby.switchGame(gameId);
    }
  }

  /* ==========================================================================
     UI Rendering & Modal
     ========================================================================== */
  bindEvents() {
    // Open trigger bar in Casino
    const bar = document.getElementById('daily-missions-bar');
    if (bar) {
      bar.addEventListener('click', () => this.openModal());
    }

    // Close button & backdrop
    const closeBtn = document.getElementById('btn-close-daily-missions');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const modal = document.getElementById('daily-missions-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Streak claim button
    const claimStreakBtn = document.getElementById('btn-claim-daily-streak');
    if (claimStreakBtn) {
      claimStreakBtn.addEventListener('click', () => this.claimDailyStreak());
    }
  }

  openModal() {
    const modal = document.getElementById('daily-missions-modal');
    if (!modal) return;
    this.renderModal();
    modal.classList.add('is-open');

    if (window.slotAudio && window.slotAudio.playClick) {
      window.slotAudio.playClick();
    }
  }

  closeModal() {
    const modal = document.getElementById('daily-missions-modal');
    if (modal) modal.classList.remove('is-open');
  }

  renderBar() {
    const countEl = document.getElementById('dmb-tasks-count');
    const streakEl = document.getElementById('dmb-streak-val');
    const streakIcon = document.getElementById('dmb-streak-icon');
    const bar = document.getElementById('daily-missions-bar');

    if (!countEl || !this.state) return;

    const completedCount = this.state.missions.filter(m => m.completed).length;
    countEl.innerHTML = `<span class="cnt-num">${completedCount}/3</span> <span class="cnt-lbl dmb-txt-full">Rešeno</span>`;

    if (completedCount === 3) {
      countEl.style.color = '#4ade80';
    } else {
      countEl.style.color = '#ffd700';
    }

    if (streakEl) {
      streakEl.textContent = `Dan ${this.state.streak}/7`;
    }

    if (streakIcon) {
      streakIcon.textContent = this.canClaimStreakToday() ? '🎁' : '🔥';
    }

    // Only visible if container is in Casino mode
    const container = document.querySelector('.game-container');
    if (bar) {
      const isCasinoMode = !container || (!container.classList.contains('in-vault-mode') && !container.classList.contains('in-royale-mode'));
      bar.style.display = isCasinoMode ? 'flex' : 'none';
    }
  }

  renderModal() {
    const modal = document.getElementById('daily-missions-modal');
    if (!modal || !this.state) return;

    // 1. Render 7-Day Streak Calendar
    const streakGrid = document.getElementById('dmm-streak-grid');
    if (streakGrid) {
      const canClaim = this.canClaimStreakToday();
      const currentStreakDay = this.state.streak;

      streakGrid.innerHTML = this.STREAK_REWARDS.map((rew, idx) => {
        const dayNum = idx + 1;
        const isCurrent = (dayNum === currentStreakDay);
        const isPast = (dayNum < currentStreakDay) || (isCurrent && !canClaim);
        const isGrand = (dayNum === 7);

        let statusClass = 'locked';
        let statusBadge = '🔒';

        if (isPast) {
          statusClass = 'claimed';
          statusBadge = '✔';
        } else if (isCurrent && canClaim) {
          statusClass = 'ready-claim';
          statusBadge = '🎁 PREUZMI';
        }

        return `
          <div class="streak-step-card ${statusClass} ${isGrand ? 'grand-day' : ''}">
            <div class="streak-step-day">DAN ${dayNum}</div>
            <div class="streak-step-icon">${isGrand ? '🏆' : (isPast ? '⭐' : '🪙')}</div>
            <div class="streak-step-reward">+${rew} ZLT</div>
            ${isGrand ? '<div class="streak-step-sub">+VIP Škrinja</div>' : ''}
            <div class="streak-step-badge">${statusBadge}</div>
          </div>
        `;
      }).join('');
    }

    // 2. Streak Claim Button Status
    const claimStreakBtn = document.getElementById('btn-claim-daily-streak');
    if (claimStreakBtn) {
      const canClaim = this.canClaimStreakToday();
      const rew = this.STREAK_REWARDS[this.state.streak - 1];
      if (canClaim) {
        claimStreakBtn.disabled = false;
        claimStreakBtn.className = 'btn-streak-claim-active';
        claimStreakBtn.innerHTML = `🎁 PREUZMI DNEVNI BONUS (+${rew} ZLT)`;
      } else {
        claimStreakBtn.disabled = true;
        claimStreakBtn.className = 'btn-streak-claim-claimed';
        claimStreakBtn.innerHTML = `✔ DANAŠNJI BONUS JE PREUZET (Dan ${this.state.streak}/7)`;
      }
    }

    // 3. Render 3 Missions Cards
    const tasksList = document.getElementById('dmm-tasks-list');
    if (tasksList) {
      tasksList.innerHTML = this.state.missions.map(m => {
        const pct = Math.min(100, Math.round((m.current / m.target) * 100));
        let actionBtn = '';

        if (m.claimed) {
          actionBtn = `<button type="button" class="btn-mission-status done" disabled>✔ PREUZETO (+${m.reward} ZLT)</button>`;
        } else if (m.completed) {
          actionBtn = `<button type="button" class="btn-mission-status claim" data-claim-id="${m.id}">🎁 PREUZMI ${m.reward} ZLT</button>`;
        } else {
          actionBtn = `<button type="button" class="btn-mission-status play" data-play-game="${m.gameId}">IGRAJ ➔</button>`;
        }

        return `
          <div class="mission-task-card ${m.completed ? 'is-completed' : ''} ${m.claimed ? 'is-claimed' : ''}">
            <div class="mission-task-icon-box">${m.icon}</div>
            <div class="mission-task-body">
              <div class="mission-task-header">
                <span class="mission-task-title">${m.title}</span>
                <span class="mission-task-reward-pill">+${m.reward} ZLT</span>
              </div>
              <div class="mission-task-desc">${m.desc}</div>
              <div class="mission-progress-bar-wrap">
                <div class="mission-progress-bar-fill" style="width: ${pct}%;"></div>
                <span class="mission-progress-text">${m.current}/${m.target}</span>
              </div>
            </div>
            <div class="mission-task-action">
              ${actionBtn}
            </div>
          </div>
        `;
      }).join('');

      // Bind claim & play buttons
      tasksList.querySelectorAll('.btn-mission-status.claim').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mId = e.currentTarget.getAttribute('data-claim-id');
          this.claimMission(mId);
        });
      });

      tasksList.querySelectorAll('.btn-mission-status.play').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const gId = e.currentTarget.getAttribute('data-play-game');
          this.playGame(gId);
        });
      });
    }
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.DailyMissionsManager = DailyMissionsManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DailyMissionsManager };
}

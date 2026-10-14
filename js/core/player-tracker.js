/**
 * IGT - Player Tracker & Analytics Engine
 * Manages player profile, 18+ verification state, sessions, and comprehensive statistics.
 */
class PlayerTracker {
  constructor() {
    this.storageKey = 'igt_player_profile';
    this.sessionStartTime = Date.now();
    this.profile = this.loadProfile();

    // Auto-sync with CRM backend after initial boot
    setTimeout(() => {
      this.syncWithBackend();
    }, 1800);
  }

  generatePlayerId() {
    const savedId = localStorage.getItem('gsc_player_id');
    if (savedId) return savedId;
    const newId = 'gsc_usr_' + Math.floor(1000 + Math.random() * 9000);
    try {
      localStorage.setItem('gsc_player_id', newId);
    } catch (e) {}
    return newId;
  }

  loadProfile() {
    const persistentId = this.generatePlayerId();
    const defaultProfile = {
      id: persistentId,
      username: '',
      vipTier: 'STANDARD',
      pin: '',
      isVerified18: false,
      isLoggedIn: false,
      rememberMe: true,
      registeredAt: Date.now(),
      stats: {
        totalSpins: 0,
        spinsByGame: {
          classic: 0,
          royal3x3: 0,
          fullfocus: 0,
          mines: 0
        },
        totalBet: 0,
        totalWin: 0,
        biggestWin: 0,
        bonusesTriggered: {
          freeSpins: 0,
          holdAndWin: 0,
          miniMines: 0,
          gambleDouble: 0
        },
        jackpotsWon: {
          silver: 0,
          gold: 0,
          diamond: 0
        },
        totalPlayTimeSeconds: 0
      }
    };

    try {
      const saved = localStorage.getItem(this.storageKey) || localStorage.getItem('maxbet_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultProfile,
          ...parsed,
          stats: {
            ...defaultProfile.stats,
            ...(parsed.stats || {}),
            spinsByGame: {
              ...defaultProfile.stats.spinsByGame,
              ...((parsed.stats && parsed.stats.spinsByGame) || {})
            },
            bonusesTriggered: {
              ...defaultProfile.stats.bonusesTriggered,
              ...((parsed.stats && parsed.stats.bonusesTriggered) || {})
            },
            jackpotsWon: {
              ...defaultProfile.stats.jackpotsWon,
              ...((parsed.stats && parsed.stats.jackpotsWon) || {})
            }
          }
        };
      }
    } catch (e) {
      console.error('Failed to load player profile:', e);
    }

    return defaultProfile;
  }

  saveProfile() {
    try {
      if (this.profile.rememberMe || this.profile.isLoggedIn) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {
      console.error('Failed to save player profile:', e);
    }
  }

  async syncWithBackend(extra = {}) {
    if (typeof fetch === 'undefined') return;

    try {
      let favoriteGame = 'royal3x3';
      let maxSpins = -1;
      const spins = this.profile.stats.spinsByGame || {};
      for (const [game, count] of Object.entries(spins)) {
        if (count > maxSpins) {
          maxSpins = count;
          favoriteGame = game;
        }
      }

      const isPush = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      const pushSub = window.currentPushSubscription || null;

      const payload = {
        id: this.profile.id,
        nickname: this.profile.username || ('Gost_' + this.profile.id.replace('gsc_usr_', '')),
        vip_tier: this.profile.vipTier || 'STANDARD',
        total_turnover: this.profile.stats.totalBet || 0,
        total_spins: this.profile.stats.totalSpins || 0,
        total_wins: this.profile.stats.totalWin || 0,
        favorite_game: favoriteGame,
        device_info: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          language: typeof navigator !== 'undefined' ? navigator.language : '',
          platform: typeof navigator !== 'undefined' ? navigator.platform : '',
          screen: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : ''
        },
        push_subscription: pushSub,
        is_push_enabled: isPush,
        ...extra
      };

      const res = await fetch('/api/players/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.player && data.player.vip_tier) {
          this.profile.vipTier = data.player.vip_tier;
          this.saveProfile();
        }
      }
    } catch (e) {
      // Offline / standalone fallback
    }
  }

  login(username, pin = '', rememberMe = true) {
    this.profile.username = username.trim() || 'Demo Player';
    this.profile.pin = pin;
    this.profile.isVerified18 = true;
    this.profile.isLoggedIn = true;
    this.profile.rememberMe = rememberMe;
    this.sessionStartTime = Date.now();
    this.saveProfile();
    this.syncWithBackend();
  }

  logout() {
    this.profile.isLoggedIn = false;
    if (!this.profile.rememberMe) {
      this.profile.username = '';
      this.profile.pin = '';
      this.profile.isVerified18 = false;
    }
    this.saveProfile();
  }

  recordSpin(gameId, betAmount, winAmount = 0) {
    if (!this.profile.isLoggedIn) return;

    this.profile.stats.totalSpins += 1;
    if (this.profile.stats.spinsByGame[gameId] !== undefined) {
      this.profile.stats.spinsByGame[gameId] += 1;
    } else {
      this.profile.stats.spinsByGame[gameId] = 1;
    }

    this.profile.stats.totalBet += betAmount;
    this.profile.stats.totalWin += winAmount;

    if (winAmount > this.profile.stats.biggestWin) {
      this.profile.stats.biggestWin = winAmount;
    }

    this.saveProfile();

    // Periodic sync every 10 spins
    if (this.profile.stats.totalSpins % 10 === 0) {
      this.syncWithBackend();
    }
  }

  recordBonus(bonusType) {
    if (!this.profile.isLoggedIn) return;
    if (this.profile.stats.bonusesTriggered[bonusType] !== undefined) {
      this.profile.stats.bonusesTriggered[bonusType] += 1;
    }
    this.saveProfile();
  }

  recordJackpot(tier, amount) {
    if (!this.profile.isLoggedIn) return;
    const key = tier.toLowerCase();
    if (this.profile.stats.jackpotsWon[key] !== undefined) {
      this.profile.stats.jackpotsWon[key] += 1;
    }
    this.profile.stats.totalWin += amount;
    if (amount > this.profile.stats.biggestWin) {
      this.profile.stats.biggestWin = amount;
    }
    this.saveProfile();
  }

  getCalculatedRTP() {
    if (this.profile.stats.totalBet <= 0) return '0.00';
    const rtp = (this.profile.stats.totalWin / this.profile.stats.totalBet) * 100;
    return rtp.toFixed(2);
  }

  getSessionPlayTime() {
    const sessionSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const totalSeconds = (this.profile.stats.totalPlayTimeSeconds || 0) + sessionSeconds;
    
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  }
}

window.PlayerTracker = PlayerTracker;
